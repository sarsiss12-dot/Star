'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const { runtime } = require('../../tests/helpers/runtime');

const [control, output, arm = 'aday'] = process.argv.slice(2);
const candidate = path.resolve(process.env.STARS_CANDIDATE_ROOT || path.join(__dirname, '../..'));
const read = name => fs.readFileSync(path.join(output, name), 'utf8');
const readRun = name => JSON.parse(gunzipSync(fs.readFileSync(path.join(output, name + '.json.gz'))));

function world(root, save, location) {
  const h = runtime({ root });
  h.sb.input = save;
  h.sb.auditLocation = location;
  assert.equal(h.run('deserialize(input)'), true, 'Save8 açıldı');
  h.run(differentPaths.toString());
  h.run(`
    G.autoSave=false;
    const audit=[], note=AIDiagnostics.note;
    AIDiagnostics.note=function(code,e,other,detail){
      if(code==='replacement:deferred'||code==='replacement:committed')audit.push({kind:code,day:G.day,actor:e.id,
        ...(typeof detail==='string'?JSON.parse(detail):detail)});
      note.call(this,code,e,other,detail);
    };
    for(const name of ['queueDemolish','queueBuilding']){
      const original=globalThis[name];
      globalThis[name]=function(e,s,p,key,...options){
        const before={...e.res},ok=original(e,s,p,key,...options);
        if(ok&&e.ai&&!e.wild&&!e.crisisSide){
          const q=p.col.q.at(-1),paid=Object.fromEntries(Object.keys(q.paid).map(r=>[r,before[r]-e.res[r]]));
          audit.push({kind:q.dem?'demolition':'paid',day:G.day,actor:e.id,system:s.id,planet:p.i,key,paid,
            ...(q.replacement?{replacement:{...q.replacement}}:{})});
        }
        return ok;
      };
    }
    if(auditLocation){
      const original=colonyBuildTick,{actor,system,planet}=auditLocation;
      colonyBuildTick=function(dt){
        const p=G.sys[system].planets[planet],job=p.col?.q?.[0];
        const due=job?.dem&&job.left<=dt&&p.owner===actor;
        const before=due?p.col.b[job.key]||0:0;
        original(dt);
        if(due&&(p.col.b[job.key]||0)<before){
          audit.push({kind:'removed',day:G.day,actor,system,planet,key:job.key,refund:job.refund});
        }
      };
    }
    if(typeof aiReplacementFirstBuilding==='function'){
      const original=aiReplacementFirstBuilding;
      aiReplacementFirstBuilding=function(...args){
        const before=serialize(),rng=RND_STATE;
        const first=original(...args);
        const after=serialize();
        if(before!==after||rng!==RND_STATE){
          const paths=differentPaths(JSON.parse(before),JSON.parse(after));
          throw Error(JSON.stringify({day:G.day,actor:args[0].id,system:args[1].id,planet:args[2].i,
            first,rng:[rng,RND_STATE],paths}));
        }
        return first;
      };
    }
    function advanceMonth(){
      for(let i=0;i<60&&!G.over;i++){
        const m=Math.floor(G.day/30);
        G.day+=.5;
        dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
        if(Math.floor(G.day/30)>m)monthTick();
      }
    }
  `);
  return h;
}

function differentPaths(before, after, prefix = '', paths = []) {
  if (before === after || paths.length >= 12) return paths;
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      differentPaths(before[key], after[key], prefix + '.' + key, paths);
    }
  } else paths.push(prefix);
  return paths;
}
const trace = h => JSON.parse(h.run('JSON.stringify(audit)'));
const inColony = (events, location) => events.filter(e =>
  e.actor === location.actor && e.system === location.system && e.planet === location.planet);

const report = {};
for (const [seed, actor, system, planet] of [[11,1,27,1],[99,1,82,0],[404,3,1,0]]) {
  const tag = '100-9-' + seed;
  const historicalLocation = { actor, system, planet };
  const historical = [control, candidate].map(root =>
    world(root, read('p44-' + tag + '-ornek.save'), historicalLocation));
  for (const h of historical) h.run('for(let i=0;i<7;i++)advanceMonth()');
  const historicalTraces = historical.map(h => inColony(trace(h), historicalLocation));
  const firstPaidAfterRemoval = events => {
    const removal = events.find(e=>e.kind==='removed'&&e.key==='dokum');
    return removal && events.find(e=>e.kind==='paid'&&e.day>=removal.day);
  };
  assert.equal(firstPaidAfterRemoval(historicalTraces[0])?.key, 'dokum', 'p44 araştırma örneği ' + seed);
  assert.notEqual(firstPaidAfterRemoval(historicalTraces[1])?.key, 'dokum', 'aday aynı döngüyü üretmedi ' + seed);

  const original = readRun(arm + '-' + tag);
  const p44 = readRun('p44-' + tag);
  const first = original.events.find(e => e.kind.startsWith('replacement:'));
  assert(first, 'doğal aday koşusunda değişen karar ' + seed);
  const before = read(arm + '-' + tag + '-ilk.save');
  const savedMonth = original.months.find(m => m.day === first.day - 30);
  assert.equal(savedMonth.sha256, p44.months.find(m => m.day === savedMonth.day).sha256);
  assert.equal(savedMonth.rng, p44.months.find(m => m.day === savedMonth.day).rng);
  const base = world(control, before);
  const live = world(candidate, before);
  live.run('advanceMonth()');
  const resumed = world(candidate, live.run('serialize()'));
  const firstTrace = trace(live);
  live.run('audit.length=0');
  const queue = `JSON.stringify(G.sys[${first.system}].planets[${first.planet}].col.q)`;
  assert.equal(live.run(queue), resumed.run(queue), 'kayıttaki kuyruk aynı');
  assert.equal(live.run('RND_STATE'), resumed.run('RND_STATE'), 'yükleme RNG çekmedi');
  const reload = [];
  for (let month = 1; month < 7; month++) {
    for (const h of [live, resumed]) h.run('advanceMonth()');
    const a = live.run('serialize()'), b = resumed.run('serialize()');
    reload.push({day:live.run('G.day'),equal:a===b,rngEqual:live.run('RND_STATE')===resumed.run('RND_STATE'),
      ...(a!==b?{paths:differentPaths(JSON.parse(a),JSON.parse(b))}:{})});
  }
  base.run('advanceMonth()');
  const baseChange = inColony(trace(base), first).find(e => e.kind==='demolition');
  assert.equal(baseChange?.key, first.removed, 'p44 aynı yıkımı seçti');
  assert.deepEqual(inColony(trace(live), first), inColony(trace(resumed), first),
    'kayıttan sonra aynı kolonide karar ve gerçek ödeme ' + seed);
  const liveTrace = inColony(firstTrace.concat(trace(live)), first);
  assert.deepEqual(liveTrace.find(e => e.kind===first.kind), first);
  const queued = liveTrace.find(e=>e.day===first.day&&e.kind==='demolition');
  if(first.kind==='replacement:deferred')assert.equal(queued,undefined,'karar anında yıkım yok');
  else {
    assert.equal(queued.replacement.key,first.wanted,'kalıcı ikame emri');
    assert.equal(queued.replacement.owner,first.actor,'kalıcı ikame sahibi');
  }
  const expected = inColony(original.events, first)
    .filter(e=>e.day>=first.day&&e.day<=first.day+180&&e.kind==='paid')
    .map(({id,...event})=>event);
  const livePaid = liveTrace.filter(e=>e.kind==='paid');
  assert.equal(livePaid.length, expected.length, 'sürekli koşu ve kayıttan ödemeler');
  for(let i=0;i<livePaid.length;i++){
    const {paid,...event}=livePaid[i],{paid:quoted,...reference}=expected[i];
    assert.deepEqual(event,reference);
    assert.deepEqual(Object.keys(paid),Object.keys(quoted));
    for(const r in paid)assert(Math.abs(paid[r]-quoted[r])<1e-8, 'gerçek stok kesintisi');
  }
  report[seed] = {
    equalThroughDay:savedMonth.day, first, p44:baseChange,
    reload, payments:livePaid,
    historical:{...historicalLocation,p44:historicalTraces[0],candidate:historicalTraces[1]}
  };
}
console.log(JSON.stringify(report, null, 2));
