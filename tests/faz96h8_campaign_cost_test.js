'use strict';
/* 96H.8: military campaigns use the real deployed upkeep. Real seed11 Save8
   checkpoints (canonical 45/5 spiral, month 40 and 60) reproduce the old
   perpetual failed-target deadline and the wartime disband after an unfunded
   full dispatch. The 96H.7.1 control is rebuilt from the reviewed adapter. */
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),{stripReviewedH8}=require('./helpers/96h8-preservation');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const fixture=n=>fs.readFileSync(path.join(__dirname,'fixtures/96h8',n),'utf8');
function legacyRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-96h71-'));
  for(const n of fs.readdirSync(root))if(/\.(js|html|json)$/.test(n)&&fs.statSync(path.join(root,n)).isFile())fs.symlinkSync(path.join(root,n),path.join(dir,n));
  fs.unlinkSync(path.join(dir,'ai.js'));fs.writeFileSync(path.join(dir,'ai.js'),stripReviewedH8(fs.readFileSync(path.join(root,'ai.js'),'utf8')));
  return dir;
}
function load(save,base=root){
  const h=runtime({root:base});h.sb.raw8=fixture(save);assert.equal(h.run('deserialize(raw8)'),true);h.run('delete raw8');
  h.run(`var dis8=[];const dt8=aiDisbandTick;aiDisbandTick=function(){const n=G.emps.map(e=>G.fleets.filter(f=>f.e===e.id).reduce((a,f)=>a+f.ships.length,0)),r=dt8.apply(this,arguments);
    G.emps.forEach((e,i)=>{const m=G.fleets.filter(f=>f.e===e.id).reduce((a,f)=>a+f.ships.length,0);if(m<n[i])dis8.push({day:G.day,e:e.id,ships:n[i]-m,war:Object.keys(e.war).some(k=>e.war[k])});});return r;};
    function decide8(id){var e=G.emps[id],guard=aiStrategicTradeProtection(e),my=G.sys.filter(s=>s.owner===e.id),wars=G.emps.filter(o=>!o.dead&&e.war[o.id]),armed=G.fleets.filter(f=>f.e===e.id&&f.id!==guard&&isArmed(f)&&!f.combat&&!hasShipment(f)&&!jointReserved(f));aiMilitaryCampaign(e,armed,my,wars);return e.aiCampaign;}
    function months8(n,id){var phases=[];for(let m=0;m<n;m++){for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}phases.push(G.emps[id].aiCampaign?.phase);}return phases;}
    function ships8(id){return G.fleets.filter(f=>f.e===id).reduce((a,f)=>a+f.ships.length,0);}`);
  return h;
}
function withLegacy(fn){const dir=legacyRoot();try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}

test('96H.7.1 slides seed11 actor1 failed-target deadline on every deferred turn (bug reproduced)',()=>withLegacy(dir=>{
  const h=load('seed11-month60.save',dir),rng=h.run('RND_STATE'),seen=[];
  for(const day of [1800,1830,2100]){h.sb.day8=day;seen.push(h.run('G.day=day8;decide8(1).failedTargets[6]'));}
  assert.deepEqual(seen,[2160,2190,2460]);assert.equal(h.run('RND_STATE'),rng);
}));
test('recorded deadline stays fixed while the target waits; no RNG',()=>{
  const h=load('seed11-month60.save'),rng=h.run('RND_STATE'),seen=[];
  for(const day of [1800,1830,2100,2159]){h.sb.day8=day;seen.push(h.run('G.day=day8;var c=decide8(1);[c.failedTargets[6],c.phase]').join(':'));}
  assert.deepEqual(seen,['2160:supply','2160:supply','2160:supply','2160:supply']);assert.equal(h.run('RND_STATE'),rng);
});
test('expired failed target is retried with a new progress window',()=>{
  const h=load('seed11-month60.save');h.run('G.day=2160;var c=decide8(1)');
  assert(h.run('c.target===6&&!Object.hasOwn(c.failedTargets,6)&&c.lastProgress===2160&&c.since===2160&&c.phase!=="supply"'));
});
test('deployment upkeep estimate equals the real fleetUpkeep and fleetAlloyUpkeep change at the target',()=>{
  const h=load('seed11-month60.save'),rng=h.run('RND_STATE');
  h.run('var e=G.emps[1],f=G.fleets.find(x=>x.id===109),d=aiDeploymentUpkeep(e,[f],G.sys[6]),u0=fleetUpkeep(e),a0=fleetAlloyUpkeep(e);f.sys=6;f.mv=null;f.path=[];var du=fleetUpkeep(e)-u0,da=fleetAlloyUpkeep(e)-a0');
  assert(h.run('d.ene>100&&Math.abs(du-d.ene)<1e-9&&Math.abs(da-d.ala)<1e-9'),h.run('JSON.stringify({d,du,da})'));
  assert.equal(h.run('RND_STATE'),rng);
});
test('funded detachment keeps every ship, hull and RNG; detachment is capped at its own size',()=>{
  const h=load('seed11-month60.save'),rng=h.run('RND_STATE');
  h.run('var e=G.emps[1],f=G.fleets.find(x=>x.id===109),hull=G.fleets.filter(x=>x.e===1).flatMap(x=>x.ships.map(s=>s.c+":"+s.h)).sort().join(),n0=ships8(1),k0=f.ships.length,sent=aiCampaignDetachment(e,[f],G.sys[6],133.75,aiEconomyPlan(e)),nf=sent[0]');
  assert(h.run('sent.length===1&&nf!==f&&nf.capTarget===nf.ships.length&&f.ships.length+nf.ships.length===k0&&ships8(1)===n0'));
  assert(h.run('hull===G.fleets.filter(x=>x.e===1).flatMap(x=>x.ships.map(s=>s.c+":"+s.h)).sort().join()&&fleetPower(nf)>=133.75&&!f.ships.some(s=>nf.ships.includes(s))'));
  assert.equal(h.run('RND_STATE'),rng);
  // Only the derived per-fleet rounded power cache (_powC) is refreshed by the load.
  h.run('var raw=serialize(),ok=deserialize(raw),again=serialize(),ok2=deserialize(again),third=serialize()');
  assert(h.run('ok&&ok2&&again===third&&JSON.stringify(JSON.parse(raw).fl)===JSON.stringify(JSON.parse(again).fl)&&JSON.parse(raw).fl.length>0&&G.fleets.find(x=>x.id===nf.id).capTarget===nf.ships.length'));
});
test('real month-72 decision: unfunded 24-ship stack stays home and a funded detachment attacks',()=>{
  const h=load('seed11-month60.save');h.run('months8(12,1)');
  assert(h.run('G.day===2160&&/müfreze/.test(G.emps[1].aiCampaign.reason)&&G.emps[1].aiCampaign.phase==="attack"'),h.run('JSON.stringify(G.emps[1].aiCampaign)'));
  assert(h.run('var main=G.fleets.find(x=>x.id===109),det=G.fleets.filter(x=>x.e===1&&x.capTarget!==undefined&&(x.path.at(-1)===6||x.mv?.to===6));main.ships.length>=20&&main.path.at(-1)!==6&&det.length===1&&det[0].ships.length<=2'));
});
test('funded full dispatch keeps the original all-together attack',()=>{
  const h=load('seed11-month60.save');h.run('G.emps[1].res.ene=1e6;var n=G.fleets.length;G.day=2160;var c=decide8(1)');
  assert(h.run('c.phase==="attack"&&c.reason==="Kuvvet birlikte taarruz ediyor"&&G.fleets.find(x=>x.id===109).path.at(-1)===6&&G.fleets.length===n'));
});
test('unfundable attack waits in fund phase without orders or splits',()=>{
  const h=load('seed11-month60.save');h.run('G.emps[1].res.ene=5;var n=G.fleets.length,p=JSON.stringify(G.fleets.filter(x=>x.e===1).map(x=>x.path));G.day=2160;var c=decide8(1)');
  assert(h.run('c.phase==="fund"&&G.fleets.length===n&&JSON.stringify(G.fleets.filter(x=>x.e===1).map(x=>x.path))===p&&c.lastProgress===2160'));
});
test('deficit-funded deployment is recalled home before the disband crisis; healthy stock stays',()=>{
  for(const [stock,recall]of [[1000,true],[5000,false]]){
    const h=load('seed11-month60.save'),rng=h.run('RND_STATE');h.sb.stock8=stock;
    h.run('var e=G.emps[1],f=G.fleets.find(x=>x.id===109);f.sys=6;f.mv=null;f.path=[];e.inc.ene=-120;e.res.ene=stock8;aiRecallUnfundedDeployment(e,[f],G.sys.filter(s=>s.owner===1))');
    assert.equal(h.run('f.path.length>0&&G.sys[f.path.at(-1)].owner===1&&e.aiStrategy.history.at(-1).kind==="campaign-recalled"'),recall);
    assert.equal(h.run('RND_STATE'),rng);
  }
});
test('natural 24 months from seed11 month 60: actor1 attacks, no disband, energy grows (96H.7 rejected unlock lost 22)',()=>{
  const h=load('seed11-month60.save');h.run('var e0=G.emps[1].res.ene,phases=months8(24,1)');
  assert(h.run('phases.filter(p=>p==="attack").length>=6&&!dis8.some(x=>x.e===1)&&G.emps[1].res.ene>e0&&G.emps.filter(e=>!e.dead&&!e.wild).length===6'),h.run('JSON.stringify({phases,dis8,ene:G.emps[1].res.ene})'));
  assert(h.run('deserialize(serialize())'));
});
test('natural 24 months from seed11 month 40: actor3 keeps its navy instead of the 12-ship wartime disband',()=>{
  const old=withLegacy(dir=>{const h=load('seed11-month40.save',dir);h.run('months8(24,3)');return JSON.parse(h.run('JSON.stringify({dis:dis8.filter(x=>x.e===3),ships:ships8(3)})'));});
  assert(old.dis.some(x=>x.ships>=12&&x.war),JSON.stringify(old));
  const h=load('seed11-month40.save');h.run('months8(24,3)');
  assert(h.run('!dis8.some(x=>x.e===3)&&ships8(3)>=12'),h.run('JSON.stringify({dis8,ships:ships8(3)})'));
});
test('only the reviewed 96H.8 campaign blocks differ from 96H.7.1 ai.js',()=>{
  const source=fs.readFileSync(path.join(root,'ai.js'),'utf8');
  assert.equal(crypto.createHash('sha256').update(stripReviewedH8(source)).digest('hex'),'f48608cc82ca46b5028c637dcabbfb1b3e2ae09f1e3c1eb24bd2c4c1b326d8d0');
});
end();
