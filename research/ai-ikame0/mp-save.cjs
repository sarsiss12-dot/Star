'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { runtime } = require('../../tests/helpers/runtime');

const control = path.resolve(process.argv[2]);
const candidate = path.resolve(__dirname, '../..');

function engine(root) {
  const world = runtime({root});
  world.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
  return world;
}

const source = engine(control);
const text = source.run(`
  setupGame({...CFG,seed:99,size:'orta',aiCount:5});
  G.autoSave=false;
  for(let i=0;i<25;i++){
    G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
  }
  const host=StarsMP.createHost({roomId:'p44-control',random:n=>'ab'.repeat(n),send(){}});
  JSON.stringify(host.snapshot({}).pkg);
`);
const sourcePackage = JSON.parse(text);
assert.equal(sourcePackage.build,'96h10p44');
assert.equal(sourcePackage.mpVersion,4);
assert.equal(JSON.parse(sourcePackage.save8).v,8);

function load(root) {
  const world = engine(root);
  world.sb.packageText = text;
  const result = JSON.parse(world.run(`
    const verified=StarsMP.validatePackage(packageText);
    if(!verified.ok)throw Error(verified.why);
    const opened=StarsMP.loadWorld(verified.pkg);
    if(!opened.ok)throw Error(opened.why);
    G.autoSave=false;
    JSON.stringify({day:G.day,rng:RND_STATE,save:serialize()});
  `));
  return { world, result };
}

const base = load(control);
const reopened = [load(candidate),load(candidate)];
for (const run of reopened) assert.deepEqual(run.result,base.result);
const { result } = reopened[0];
const broken = { ...sourcePackage, integrity: { ...sourcePackage.integrity, save8: '00' } };
reopened[0].world.sb.broken = JSON.stringify(broken);
assert.equal(reopened[0].world.run('StarsMP.validatePackage(broken).ok'),false);
console.log(JSON.stringify({package:4,save:8,day:result.day,rng:result.rng,
  sha256:createHash('sha256').update(result.save).digest('hex'),loads:2,integrityReject:true},null,2));
