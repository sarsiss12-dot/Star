'use strict';
/* 96H.7.1: a joint plan closed because only its sponsor remained must not
   make the game's own Save8 unloadable. Active plans still need two members. */
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {jointWorld}=require('./helpers/joint-fixture'),{harness}=require('./helpers/95e-fixture'),{stripReviewedH63}=require('./helpers/96h63-preservation'),{stripReviewedH8}=require('./helpers/96h8-preservation'),{stripReviewedH9}=require('./helpers/96h9-preservation');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
// Federation dissolves while both partners stay allied: the real jointValid path
// drops both former federation members and closes the plan with its sponsor alone.
// Load normalization may add explicit false treaty keys; only active flags are compared.
const dissolve=`var p71=plan();G.feds=[];jointTick();var why71=p71.reason;if(p71.state!=='cancelled'||why71!=='Ortak savaş katılımcısı kalmadı'||JSON.stringify(p71.members)!=='[1]')throw Error('natural singleton fixture: '+p71.state+' '+why71+' '+p71.members);
 var save71=serialize(),rng71=RND_STATE,rel71=()=>JSON.stringify(G.emps.map(e=>[e.war,e.ally].map(m=>Object.keys(m).filter(k=>m[k]).sort()))),wars71=rel71(),hist71=JSON.stringify(G.jointOps.plans[0]);`;
function closed(base){const h=jointWorld(base?{root:base}:{});h.run(dissolve);return h;}
function canonicalRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-96h61-'));
  for(const n of fs.readdirSync(root))if(/\.(js|html|json)$/.test(n)&&fs.statSync(path.join(root,n)).isFile())fs.symlinkSync(path.join(root,n),path.join(dir,n));
  fs.unlinkSync(path.join(dir,'ai.js'));fs.writeFileSync(path.join(dir,'ai.js'),stripReviewedH63(stripReviewedH8(stripReviewedH9(fs.readFileSync(path.join(root,'ai.js'),'utf8')))));
  return dir;
}
test('96H.6.1 source rejects its own save after federation dissolution (bug reproduced)',()=>{const dir=canonicalRoot();try{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'ai.js'))).digest('hex'),'27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739');
  const h=closed(dir);assert.equal(h.run('deserialize(save71)'),false);assert(h.run('RND_STATE===rng71&&serialize()===save71'));
}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('closed single-member history loads; plan, wars, alliances and RNG preserved',()=>{const h=closed();assert.equal(h.run('deserialize(save71)'),true);
  assert(h.run('RND_STATE===rng71&&JSON.stringify(G.jointOps.plans[0])===hist71&&wars71===rel71()'));
  assert(h.run('G.fleets.every(f=>f.jointPlan===undefined)'));});
test('second Save8 load is idempotent',()=>{const h=closed();assert(h.run('deserialize(save71)'));h.run('var again71=serialize()');assert(h.run('deserialize(again71)&&serialize()===again71&&RND_STATE===rng71'));});
test('resumed simulation after load matches uninterrupted simulation',()=>{const h=closed();
  h.run('function outcome71(){return JSON.stringify({ops:G.jointOps,fleets:G.fleets.map(f=>[f.id,f.e,f.sys,f.path,f.mv,f.ships.length]),rng:RND_STATE,day:G.day});}');
  h.run('tick(10);var straight71=outcome71();');assert(h.run('deserialize(save71)'));h.run('tick(10)');assert(h.run('outcome71()===straight71'));});
test('active single-member plan is still rejected and rolls back atomically',()=>{const h=closed();h.run('var bad71=JSON.parse(save71);bad71.jointOps.plans[0].state="gather"');
  assert.equal(h.run('deserialize(JSON.stringify(bad71))'),false);assert(h.run('serialize()===save71&&RND_STATE===rng71'));});
for(const [name,edit]of Object.entries({empty:'p.members=[]',duplicate:'p.members=[1,1]',noSponsor:'p.members=[2]',strangerFleet:'p.fleets[0].owner=4'}))
  test('malformed closed history still rejected: '+name,()=>{const h=closed();h.run('var bad71=JSON.parse(save71),p=bad71.jointOps.plans[0];'+edit);
    assert.equal(h.run('deserialize(JSON.stringify(bad71))'),false);assert(h.run('serialize()===save71&&RND_STATE===rng71'));});
test('only the reviewed guard and 96H.8 campaign change differ from 96H.6.1 ai.js',()=>{const source=fs.readFileSync(path.join(root,'ai.js'),'utf8');
  assert(source.includes('p.members.length<(jointActive(p)?2:1)'));
  assert.equal(crypto.createHash('sha256').update(stripReviewedH63(stripReviewedH8(stripReviewedH9(source)))).digest('hex'),'27ae25e44d66f5fdbfb04ea7db69aa75769a3165759b6feb0250b5b753e8c739');});
end();
