'use strict';

const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { runtime } = require('../../tests/helpers/runtime');

const candidate = path.resolve(__dirname, '../..');
const control = path.resolve(process.env.STARS_CONTROL_ROOT || '../Star');
const output = path.resolve(process.env.STARS_OUTPUT || '/tmp/stars-border');
const sha = text => createHash('sha256').update(text).digest('hex');

const engineProbes = `
  let proofTrace = [];
  const proofResources = e => Object.entries(e.res).map(([key, stock]) => [key, stock]);
  function proofPaid(e, before){
    return before.flatMap(([key, stock])=>stock===e.res[key]?[]:[[key, stock-e.res[key]]]);
  }
  function proofWrap(name, record){
    const original = globalThis[name];
    globalThis[name] = function(...args) {
      const result = original.apply(this, args);
      record(result, ...args);
      return result;
    };
  }
  function proofOrder(name, describe) {
    const original = globalThis[name];
    globalThis[name] = function(e, ...args) {
      if (!e.ai) return original.call(this, e, ...args);
      const before = proofResources(e);
      const result = original.call(this, e, ...args);
      if (result) proofTrace.push([name, G.day, e.id, describe(...args), proofPaid(e, before)]);
      return result;
    };
  }
  proofWrap('aiPlanEvent', (result, e, kind, detail)=>
    proofTrace.push(['plan', G.day, e.id, kind, JSON.stringify(detail)]));
  proofWrap('aiMove',(result, e, f, to)=>{
    if(result)proofTrace.push(['fleet', G.day, e.id, f.id, to, [...f.path]]);
  });
  proofWrap('aiNegotiate',(result, from, to, give, want)=>{
    proofTrace.push(['deal', G.day, from.id, to.id, JSON.stringify([give,want]), result?.uygulandi, result?.karar]);
  });
  proofOrder('queueShip', (s, cls, auto)=>[s.id, cls, !!auto]);
  proofOrder('queueBuilding', (s, p, key)=>[s.id, p.i, key]);
  proofOrder('queueDemolish', (s, p, key)=>[s.id, p.i, key]);
  function proofMonth() {
    const initial = Math.floor(G.day/30);
    for(let i=0; i<60 && !G.over; i++){
      G.day += .5;
      dailyTick(.5);
      structTick(.5);
      colonyBuildTick(.5);
      autoExploreTick();
      if(Math.floor(G.day/30)>initial)monthTick();
    }
  }
  function proofSummary(){
    const trace = JSON.stringify(proofTrace);
    const summary = {day:G.day, rng:RND_STATE, over:!!G.over, trace,
      orders:proofTrace.length, payments:proofTrace.filter(a=>/^queue/.test(a[0])&&a[4].length>0).length};
    proofTrace = [];
    return summary;
  }
`;

function worker(root, n, ai, seed) {
  const h = runtime({ root, processGlobal: true });
  h.run(`setupGame({...CFG,size:setupSizeKey(${n}),aiCount:${ai},seed:${seed}}); G.autoSave=false;`);
  h.run(engineProbes);
  let saved = h.run('serialize()');
  let lastTrace = '[]';
  process.on('message', ({ action }) => {
    if (action === 'close') return process.disconnect();
    if (action === 'dump') return process.send({ saved, lastTrace });
    if (action === 'next') {
      h.run('proofMonth()');
      saved = h.run('serialize()');
    }
    const { trace, ...summary } = h.run('proofSummary()');
    lastTrace = trace;
    process.send({ ...summary, save: sha(saved), trace: sha(trace) });
  });
}

function query(child, action) {
  return new Promise((resolve, reject) => {
    const onExit = (code, signal) => reject(Error('İşçi durdu: ' + code + ' ' + signal));
    child.once('exit', onExit);
    child.once('message', value => {
      child.off('exit', onExit);
      resolve(value);
    });
    child.send({ action });
  });
}

async function compare(n, ai, seed, max) {
  fs.mkdirSync(output, { recursive: true });
  const name = [n, ai, seed].join('-');
  const file = path.join(output, name + '-campaign.json');
  const workers = [control, candidate].map(root => fork(__filename, ['worker', root, n, ai, seed], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] }));
  const record = { systems: n, ai, seed, max, equal: false, months: [] };
  try {
    for (let month = 0; month <= max; month++) {
      const [base, candidate] = await Promise.all(workers.map(c => query(c, month ? 'next' : 'start')));
      try {
        assert.deepEqual(candidate, base, 'İlk fark: ay ' + month);
      } catch (error) {
        const dumps = await Promise.all(workers.map(c => query(c, 'dump')));
        for (const [i, item] of dumps.entries()) {
          fs.writeFileSync(path.join(output, name + '-first-' + i + '.save'), item.saved);
          fs.writeFileSync(path.join(output, name + '-first-' + i + '-trace.json'), item.lastTrace);
        }
        throw error;
      }
      record.months.push({ month, base, candidate });
      if (month % 30 === 0 || base.over) {
        fs.writeFileSync(file, JSON.stringify(record) + '\n');
        console.log(name, month, base.day, base.over);
      }
      if (base.over) break;
    }
    record.equal = true;
  } finally {
    fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
    for (const c of workers) if (c.connected) c.send({ action: 'close' });
  }
}

const [first, ...args] = process.argv.slice(2);
if (first === 'worker') worker(args[0], ...args.slice(1).map(Number));
else compare(...[first, ...args].map(Number)).catch(error => { console.error(error); process.exitCode = 1; });
