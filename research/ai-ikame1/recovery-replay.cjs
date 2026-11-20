'use strict';

const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const {runtime} = require('../../tests/helpers/runtime');

const [p45, candidate, file] = process.argv.slice(2);
const input = fs.readFileSync(file, 'utf8');

function open(root, save) {
  const h = runtime({root});
  h.sb.input = save;
  assert.equal(h.run('deserialize(input)'), true);
  h.run(`
    G.autoSave=false;
    const audit=[], actor=5, system=88, planet=0;
    let recovery=false;
    const recover=aiRecoverEconomy, delta=aiBuildingDelta, dem=queueDemolish, build=queueBuilding;
    aiRecoverEconomy=function(e){
      recovery=e.id===actor;
      try{return recover(e);}finally{recovery=false;}
    };
    aiBuildingDelta=function(e,s,p,key,...args){
      const change=delta(e,s,p,key,...args);
      if(recovery&&s.id===system&&p.i===planet&&['dokum','fabrika'].includes(key)){
        audit.push({kind:'choice',day:G.day,key,stock:e.res.min,income:{...e.inc},change});
      }
      return change;
    };
    queueDemolish=function(e,s,p,key,...args){
      const ok=dem(e,s,p,key,...args);
      if(ok&&recovery&&s.id===system&&p.i===planet){
        const job=p.col.q.at(-1);
        audit.push({kind:'demolition',day:G.day,key,left:job.left,refund:job.refund});
      }
      return ok;
    };
    queueBuilding=function(e,s,p,key,...args){
      const before={...e.res};
      const ok=build(e,s,p,key,...args);
      if(ok&&e.id===actor&&s.id===system&&p.i===planet){
        const paid=p.col.q.at(-1).paid, debit=Object.fromEntries(Object.keys(paid).map(r=>[r,before[r]-e.res[r]]));
        audit.push({kind:'paid',day:G.day,key,paid,debit});
      }
      return ok;
    };
    function month(){
      for(let i=0;i<60&&!G.over;i++){
        const start=Math.floor(G.day/30);
        G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
        if(Math.floor(G.day/30)>start)monthTick();
      }
    }
  `);
  return h;
}

const trace = h => JSON.parse(h.run('JSON.stringify(audit)'));
const bytes = h => h.run('serialize()');
const sha = save => createHash('sha256').update(save).digest('hex');
const [base, live, reloadBefore] = [p45, candidate, candidate].map(root => open(root, input));
for (const h of [live, reloadBefore]) {
  assert.equal(bytes(h), bytes(base));
  assert.equal(h.run('RND_STATE'), base.run('RND_STATE'));
}
const before = {day:live.run('G.day'), sha256:sha(bytes(live)), rng:live.run('RND_STATE')};
for (const h of [base, live, reloadBefore]) h.run('month()');
const decisions = Object.fromEntries([['p45', base], ['candidate', live], ['reloadedBefore',reloadBefore]]
  .map(([name, h]) => [name, trace(h)]));
assert.deepEqual(decisions.candidate, decisions.reloadedBefore);
assert.equal(decisions.p45.find(e => e.kind === 'demolition')?.key, 'dokum');
assert.equal(decisions.candidate.find(e => e.kind === 'demolition')?.key, 'fabrika');
assert(decisions.candidate.some(e => e.kind === 'choice' && e.key === 'dokum' && e.income.ala + e.change.ala < 0));
const reloaded = open(candidate, bytes(live));
const after = {day:live.run('G.day'), sha256:sha(bytes(live)), rng:live.run('RND_STATE')};
assert.equal(reloaded.run('RND_STATE'), after.rng);
live.run('audit.length=0');
const later = [];
for (let i = 0; i < 8; i++) {
  for (const h of [live, reloaded]) h.run('month()');
  const a = bytes(live), b = bytes(reloaded);
  const rng = live.run('RND_STATE');
  assert.equal(rng, reloaded.run('RND_STATE'));
  assert.deepEqual(JSON.parse(a), JSON.parse(b));
  later.push({day:live.run('G.day'), rng, equalBytes:a===b, equalValues:true});
}
const payments = trace(live).filter(e => e.kind === 'paid');
assert.deepEqual(payments, trace(reloaded).filter(e => e.kind === 'paid'));
assert(payments.length);
for (const {paid, debit} of payments) {
  for (const r in paid) assert(Math.abs(paid[r] - debit[r]) < 1e-8);
}
console.log(JSON.stringify({before, after, decisions, later, payments}, null, 2));
