'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [prev,output]=process.argv.slice(2);
const realm=root=>{
 const h=runtime({root});
 h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
 h.run(fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8'));
 return h;
};
const oldRoot=path.resolve(prev),candidate=realm(process.cwd());
const workdir=process.cwd();
process.chdir(oldRoot);
const old=require(path.join(oldRoot,'tests/helpers/beta-fed-found0-mp-world.cjs')).world();
process.chdir(workdir);
old.run('var package55=MP.snapshot({}).pkg;');
candidate.sb.package55=old.run('JSON.stringify(package55)');
const real=JSON.parse(candidate.run(`JSON.stringify((()=>{
 const verdict=StarsMP.validatePackage(package55);
 if(!verdict.ok)return verdict;
 const saved=StarsMP.loadWorld(verdict.pkg||JSON.parse(package55));
 return {...saved,build:JSON.parse(package55).build,protocol:StarsMP.PROTOCOL,package:StarsMP.PKG_VERSION,rng:RND_STATE};
})())`));
assert.equal(real.ok,true,JSON.stringify(real));
assert.equal(real.rng,old.run('RND_STATE'));
const range=[];
for(let p=41;p<=56;p++){
 candidate.sb.build='96h10p'+p;
 const entry=JSON.parse(candidate.run(`JSON.stringify((()=>{
  const pack=JSON.parse(package55);
  pack.build=build;
  const {integrity,save8,...fields}=pack;
  pack.integrity.body=StarsMP.sha256(StarsMP.canon({...fields,save8:integrity.save8}));
  const verdict=StarsMP.validatePackage(pack);
  if(!verdict.ok)return {build,step:'validate',why:verdict.why};
  const load=StarsMP.loadWorld(verdict.pkg);
  return {build,ok:load.ok,rng:RND_STATE};
 })())`));
 assert.equal(entry.ok,true,JSON.stringify(entry));assert.equal(entry.rng,real.rng);range.push(entry);
}
fs.writeFileSync(output,JSON.stringify({real,range,note:'One valid Save8 with each historical client build tag and recalculated integrity. Actual p55 room snapshot tested separately.'},null,2)+'\n');
