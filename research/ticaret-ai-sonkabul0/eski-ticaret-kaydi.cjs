'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {runtime} = require('../../tests/helpers/runtime');
const {fresh} = require('../../tests/helpers/dispatch-fixture');
const {setup} = require('../../tests/helpers/96a-fixture');

const [legacy,candidate] = process.argv.slice(2).map(x=>path.resolve(x));
const core = root => fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
const old = fresh(0,legacy);
old.run(setup);
old.run(core(legacy));
old.sb.random = length => 'a'.repeat(length*2);
old.run(`
 G.cfg.humans=[{race:G.emps[1].race}];
 G.emps[1].ai=false;
 G.emps[0].portTransit={1:G.day+300};
 if(!sign())throw Error('p53 sözleşmesi imzalanamadı');
 for(let i=0;i<8;i++)advanceCargo(.5);
`);
const save = old.run('serialize()');
const before = state(old);
assert(before.receipts.length===2 && before.receipts.every(x=>x[1]==='moving'));
const packageResult = JSON.parse(old.run("JSON.stringify(StarsMP.packageFromSave8(serialize(),{random,now:()=>1}))"));
assert(packageResult.ok,JSON.stringify(packageResult).slice(0,200));
assert.equal(packageResult.pkg.build,'96h10p53');

function state(h) {
  return JSON.parse(h.run(`JSON.stringify({day:G.day,rng:RND_STATE,res:G.emps.slice(0,2).map(e=>e.res),
    permit:G.emps[0].portTransit,contracts:G.commerce.contracts,receipts:G.commerce.convoys.map(v=>[v.id,v.status,v.amount,v.delivered,v.receipt])
  })`));
}
function loaded(byPackage) {
  const h = runtime({root:candidate});
  if(byPackage){
    h.sb.reference=packageResult.pkg;
    h.run(core(candidate));
    assert(h.run('StarsMP.validatePackage(reference).ok'));
    assert(h.run('StarsMP.loadWorld(reference).ok'));
  }else{
    h.sb.reference=save;
    assert(h.run('deserialize(reference)'));
  }
  assert.deepEqual(state(h),before);
  assert.equal(h.run('JSON.stringify(G.commerce)'),old.run('JSON.stringify(G.commerce)'));
  return h;
}
function advance(h) {
  h.run('for(let i=0;i<50;i++){G.day+=.5;Commerce.tick(.5);}');
  return state(h);
}
const saved = loaded(false), pkg = loaded(true);
const after = advance(old);
assert(after.receipts.every(x=>x[1]==='delivered' && x[0]===x[4]));
assert.deepEqual(advance(saved),after);
assert.deepEqual(advance(pkg),after);
console.log(JSON.stringify({build:packageResult.pkg.build,mpVersion:packageResult.pkg.mpVersion,
  saveSha256:sha(save),pkgSha256:sha(JSON.stringify(packageResult.pkg)),before,after},null,2));
