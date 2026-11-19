'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const candidate = path.resolve(process.env.STARS_CANDIDATE_ROOT || path.join(__dirname, '../..'));
const control = path.resolve(process.env.STARS_CONTROL_ROOT || '../Star');
const inputs = path.resolve(process.env.CHECKPOINT_DIR || '/tmp/stars-p43');
const output = path.resolve(process.env.STARS_OUTPUT || '/tmp/stars-border');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

function advanceMonth() {
  const initial = Math.floor(G.day / 30);
  for (let step = 0; step < 60 && !G.over; step++) {
    G.day += .5;
    dailyTick(.5);
    structTick(.5);
    colonyBuildTick(.5);
    autoExploreTick();
    if (Math.floor(G.day / 30) > initial) {
      monthTick();
      return;
    }
  }
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    p50: (sorted[middle] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2,
    p95: sorted[Math.ceil(sorted.length * .95) - 1]
  };
}

async function start(root) {
  const relay = require(path.join(root, 'research/mp1/server/relay.js')).create({ MP1_BIND: '127.0.0.1', MP1_PORT: '0' });
  const srv = await relay.start();
  return { relay, origin: 'http://127.0.0.1:' + srv.address().port };
}

async function open(browser, origin, save, warm, replacementCost = false) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(origin);
  await page.waitForFunction(() => typeof deserialize === 'function');
  await page.addScriptTag({ content: advanceMonth.toString() });
  const identity = await page.evaluate(({ save, warm, replacementCost }) => {
    if (!deserialize(save)) throw Error('Save8 açılamadı');
    G.autoSave = false;
    G.speed = 0;
    if(replacementCost){
      // Benchmark the new decision code on a matched workload. Apply the old
      // demolition after measuring the new preview, on this test page only.
      const demolish=queueDemolish,note=AIDiagnostics.note,pending=new Set();
      queueDemolish=(e,s,p,key,replacement)=>{
        const ok=demolish(e,s,p,key);
        if(ok&&replacement&&typeof aiCanFinishReplacement==='function'){
          pending.add({e,s,p,job:p.col.q.at(-1),replacement:{...replacement,owner:e.id}});
        }
        return ok;
      };
      const build=colonyBuildTick;
      colonyBuildTick=function(dt){
        for(const item of pending){
          const {e,s,p,job,replacement}=item,q=p.col?.q;
          if(e.dead||p.owner!==e.id||!q?.includes(job)){pending.delete(item);continue;}
          if(q[0]!==job||job.left>dt)continue;
          pending.delete(item);
          if(q.length!==1)continue;
          q.shift();
          try{aiCanFinishReplacement(e,s,p,{...job,replacement});}
          finally{q.unshift(job);}
        }
        build(dt);
      };
      AIDiagnostics.note=function(code,e,other,detail){
        if(code==='replacement:deferred'){
          const {system,planet,removed,wanted}=JSON.parse(detail),s=G.sys[system],p=s.planets[planet];
          if(demolish(e,s,p,removed))aiPlanEvent(e,'building-replacement',{system,planet,removed,wanted});
        }
        note.call(this,code,e,other,detail);
      };
    }
    const settings = { startDay: G.day, systems: G.sys.length, ai: G.emps.filter(e => e.ai && !e.wild && !e.crisisSide).length, build: BUILD_ID };
    for (let i = 0; i < warm; i++) advanceMonth();
    return settings;
  }, { save, warm, replacementCost });
  return { context, page, identity };
}

async function profile(browser, server, key, save) {
  const { context, page, identity } = await open(browser, server.origin, save, 1);
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    await cdp.send('Profiler.start');
    const times = await page.evaluate(() => Array.from({ length: 3 }, () => {
      const started = performance.now();
      advanceMonth();
      return performance.now() - started;
    }));
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map();
    const nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame]));
    profile.samples.forEach((id, i) => {
      const frame = nodes.get(id);
      const label = (frame.functionName || '(anon)') + ' ' + frame.url.replace(server.origin, '') + ':' + (frame.lineNumber + 1);
      self.set(label, (self.get(label) || 0) + profile.timeDeltas[i]);
    });
    const total = profile.timeDeltas.reduce((sum, delta) => sum + delta, 0);
    const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 35).map(([fn, us]) => ({ fn, ms: us / 1000, percent: us / total * 100 }));
    return { key, identity, times, top };
  } finally {
    await context.close();
  }
}

async function compare(browser, servers, key, save, replacementCost = false) {
  const order = ['base', 'candidate', 'candidate', 'base', 'base', 'candidate', 'candidate', 'base'];
  const samples = 6;
  const result = { key, sha: sha(save), chromium: browser.version(), warmMonths: 2, monthsPerArm: samples, replacementCost, runs: [] };
  const reference = [];
  for (const arm of order) {
    const { context, page, identity } = await open(browser, servers[arm].origin, save, result.warmMonths, replacementCost);
    try {
      const data = await page.evaluate(count => {
        const rows = [];
        for (let i = 0; i < count; i++) {
          if (G.over) throw Error('Oyun ölçüm penceresi içinde bitti');
          const start = performance.now();
          advanceMonth();
          const ms = performance.now() - start;
          rows.push({ ms, day: G.day, rng: RND_STATE, save: serialize() });
        }
        return rows;
      }, samples);
      const rows = data.map(({ save, ...rest }, i) => {
        const hash = sha(save);
        if (!reference[i]) reference[i] = { hash, day: rest.day, rng: rest.rng, save };
        const match = reference[i];
        if (match.hash !== hash || match.rng !== rest.rng || match.day !== rest.day) {
          fs.writeFileSync(path.join(output, key + '-first-base.save'), match.save);
          fs.writeFileSync(path.join(output, key + '-first-other.save'), save);
          throw Error(key + ' ilk ayrışma, gün ' + rest.day + ', kol ' + arm);
        }
        return { ...rest, sha: hash };
      });
      result.runs.push({ arm, identity, rows, ...stats(rows.map(row => row.ms)) });
    } finally {
      await context.close();
    }
  }
  result.arms = Object.fromEntries(['base', 'candidate'].map(arm =>
    [arm, stats(result.runs.filter(run => run.arm === arm).flatMap(run => run.rows.map(row => row.ms)))]));
  result.pairsPct = Array.from({ length: 4 }, (_, i) => {
    const [a, b] = result.runs.slice(i * 2, i * 2 + 2);
    const control = a.arm === 'base' ? a : b;
    const candidate = a.arm === 'candidate' ? a : b;
    return { order: [a.arm, b.arm], p50: 100 * (1 - candidate.p50 / control.p50), p95: 100 * (1 - candidate.p95 / control.p95) };
  });
  result.equal = true;
  return result;
}

async function main(mode, keys) {
  assert(['profile-base', 'profile-candidate', 'compare', 'compare-replacement-cost'].includes(mode));
  assert(keys.length);
  fs.mkdirSync(output, { recursive: true });
  const servers = {};
  let browser;
  try {
    if (mode !== 'profile-candidate') servers.base = await start(control);
    if (mode !== 'profile-base') servers.candidate = await start(candidate);
    browser = await chromium.launch({ executablePath: process.env.STARS_CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
    for (const key of keys) {
      const save = fs.readFileSync(path.join(inputs, key + '.save'), 'utf8');
      const result = mode.startsWith('compare') ?
        await compare(browser, servers, key, save, mode==='compare-replacement-cost') : await profile(browser, servers[mode.split('-')[1]], key, save);
      fs.writeFileSync(path.join(output, mode + '-' + key + '.json'), JSON.stringify(result, null, 2) + '\n');
      console.log(key, result.arms || result.top.slice(0, 5));
    }
  } finally {
    await browser?.close();
    for (const server of Object.values(servers)) server.relay.shutdown();
  }
}

main(process.argv[2], process.argv.slice(3)).catch(error => { console.error(error); process.exitCode = 1; });
