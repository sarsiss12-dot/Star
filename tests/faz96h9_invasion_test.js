'use strict';
/* 96H.9: a campaign with a colonised war target buys its ground army while it
   prepares, and the force that reached the target holds the siege. Real seed11
   Save8 checkpoints (canonical 45/5 spiral) reproduce the 96H.8 failures: during
   a month-66 siege no army is ever paid, so the stalled garrison never falls;
   at month 79 the escort is recalled to the rally and the arriving army lands
   alone. The 96H.8 control is rebuilt from the reviewed adapter. */
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),{stripReviewedH9,reviewedH9Blocks}=require('./helpers/96h9-preservation');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const fixture=n=>fs.readFileSync(path.join(__dirname,'fixtures/96h9',n),'utf8');
const SIEGE='seed11-month66-siege.save',ESCORT='seed11-month79-escort.save';
function legacyRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-96h8-'));
  for(const n of fs.readdirSync(root))if(/\.(js|html|json)$/.test(n)&&fs.statSync(path.join(root,n)).isFile())fs.symlinkSync(path.join(root,n),path.join(dir,n));
  fs.unlinkSync(path.join(dir,'ai.js'));fs.writeFileSync(path.join(dir,'ai.js'),stripReviewedH9(fs.readFileSync(path.join(root,'ai.js'),'utf8')));
  return dir;
}
function load(save,base=root){
  const h=runtime({root:base});h.sb.raw9=fixture(save);assert.equal(h.run('deserialize(raw9)'),true);h.run('delete raw9');
  h.run(`var ev9=[];const cs9=captureSystem;captureSystem=function(sys,by,cause){const before=sys.planets.map(p=>({i:p.i,owner:p.owner,col:!!p.col,pop:p.col?p.col.pop:0})),r=cs9.apply(this,arguments);
     const flips=before.filter(b=>b.col&&sys.planets[b.i].owner!==b.owner).map(b=>({i:b.i,from:b.owner,pop:b.pop,after:sys.planets[b.i].col?.pop}));if(flips.length)ev9.push({day:G.day,kind:'capture',sys:sys.id,by,cause,flips});return r;};
    const rf9=recordFall;recordFall=function(t){ev9.push({day:G.day,kind:'fall',type:t});return rf9.apply(this,arguments);};
    const wg9=warLedgerGround;warLedgerGround=function(a,b,lost,red){ev9.push({day:G.day,kind:'ground',atk:a,def:b,lost,red});return wg9.apply(this,arguments);};
    function armies9(id){const inv=aiShipInventory(G.emps[id]);return (inv.counts.ord||0)+(inv.pending.ord||0);}
    function escort9(id,sys){return G.fleets.filter(f=>f.e===id&&isArmed(f)&&f.sys===sys&&!f.mv).reduce((n,f)=>n+fleetPower(f),0);}
    function months9(n,id,sys){var rows=[];for(let m=0;m<n;m++){for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}
      rows.push({day:G.day,armies:armies9(id),escort:escort9(id,sys),owners:G.sys[sys].planets.filter(p=>p.col).map(p=>p.owner)});}return rows;}
    function produce9(id){const e=G.emps[id],a0=e.res.ala,rng=RND_STATE;delete e.aiShipPlan;aiShipProduction(e,G.sys.filter(s=>s.owner===id),aiProfile(e));
      return {spent:a0-e.res.ala,queued:G.sys.flatMap(s=>s.queue.filter(j=>j.e===id).map(j=>j.cls)),reasons:e.aiShipPlan.reasons,rng:rng===RND_STATE};}`);
  return h;
}
function withLegacy(fn){const dir=legacyRoot();try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const json=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));

test('96H.8 month-66 siege of player colony sys6: actor1 never pays for an army and the garrison never falls (bug reproduced)',()=>withLegacy(dir=>{
  const h=load(SIEGE,dir),rows=json(h,'months9(6,1,6)');
  assert(rows.every(r=>r.armies===0&&r.owners.every(o=>o===0)),JSON.stringify(rows));
  assert(rows.at(-1).escort>2000&&!json(h,'ev9').some(x=>x.kind==='capture'||x.kind==='ground'));
}));
test('96H.9 month-66: the army is ordered while the campaign gathers and sys6 falls cleanly to a ground landing',()=>{
  const h=load(SIEGE),rows=json(h,'months9(6,1,6)'),ev=json(h,'ev9');
  assert.equal(rows[0].armies,1,JSON.stringify(rows));
  const cap=ev.find(x=>x.kind==='capture'&&x.sys===6);
  assert(cap&&cap.by===1&&cap.cause==='conquest'&&cap.day===2130&&cap.flips.every(f=>f.from===0),JSON.stringify(ev));
  assert(ev.some(x=>x.kind==='ground'&&x.atk===1&&x.def===0&&x.day===2130)&&ev.some(x=>x.kind==='fall'&&x.type==='temiz'&&x.day===2130));
  assert(!ev.some(x=>x.kind==='fall'&&x.type==='katastrof'));
  assert(h.run('G.sys[6].planets.filter(p=>p.col).every(p=>p.owner===1)&&deserialize(serialize())'));
});
test('96H.8 month-79 siege of sys5: the escort is recalled to rally 31 and the army reaches the regenerating shield alone (bug reproduced)',()=>withLegacy(dir=>{
  const h=load(ESCORT,dir);json(h,'months9(1,3,5)');
  assert(h.run('[51,128,196].every(id=>{const f=G.fleets.find(x=>x.id===id);return f.sys===5&&f.path.at(-1)===31;})'));
  const rows=json(h,'months9(3,3,5)');
  assert(rows[0].escort===0&&rows.every(r=>r.owners.every(o=>o===5))&&!h.run('G.fleets.some(f=>f.id===237&&f.ships.length)'),JSON.stringify(rows));
  assert(!json(h,'ev9').some(x=>x.kind==='capture'&&x.sys===5));
}));
test('96H.9 month-79: the force holds sys5 and the escorted army captures it cleanly on day 2430',()=>{
  const h=load(ESCORT);json(h,'months9(1,3,5)');
  assert(h.run('[51,128,196].every(id=>{const f=G.fleets.find(x=>x.id===id);return f.sys===5&&!f.mv&&!f.path.length;})&&G.emps[3].aiCampaign.rally===31'));
  json(h,'months9(1,3,5)');const ev=json(h,'ev9');
  assert(ev.some(x=>x.kind==='capture'&&x.sys===5&&x.by===3&&x.day===2430)&&ev.some(x=>x.kind==='fall'&&x.type==='temiz'&&x.day===2430),JSON.stringify(ev));
  assert(h.run('escort9(3,5)>4000&&G.sys[5].planets.filter(p=>p.col).every(p=>p.owner===3)'));
});
test('invasion intent is read-only: the known colonised war target, nothing at peace',()=>{
  const h=load(SIEGE),raw=h.run('serialize()'),rng=h.run('RND_STATE');
  assert.equal(h.run('aiInvasionTarget(G.emps[1])?.id'),6);assert(h.run('serialize()')===raw&&h.run('RND_STATE')===rng);
  assert.equal(h.run('G.emps[1].war[0]=false;G.emps[0].war[1]=false;aiInvasionTarget(G.emps[1])'),null);
});
test('alloy-only shortfall reserves the army price from warships and grants nothing; 96H.8 spends it on a corvette',()=>{
  const old=withLegacy(dir=>json(load(SIEGE,dir),'produce9(1)')),now=json(load(SIEGE),'produce9(1)');
  assert(old.rng&&now.rng&&old.queued.join()==='kor'&&old.spent>0,JSON.stringify(old));
  assert(now.queued.length===0&&now.spent===0&&now.reasons.includes('alloy-budget-reserve'),JSON.stringify(now));
});
test('an affordable army is bought first and paid from the same alloy stock',()=>{
  const old=withLegacy(dir=>json(load(SIEGE,dir),'(G.emps[1].res.ala=100,produce9(1))')),now=json(load(SIEGE),'(G.emps[1].res.ala=100,produce9(1))');
  assert(old.queued.join()==='kor,kor',JSON.stringify(old));
  assert(now.queued.join()==='ord'&&now.spent===70&&now.rng,JSON.stringify(now));
});
test('any other failing gate (energy runway) leaves production and Save8 byte-identical to 96H.8',()=>{
  const run=base=>{const h=load(SIEGE,base);h.run('G.emps[1].res.ene=60');const r=json(h,'produce9(1)');return {r,raw:h.run('serialize()')};};
  const old=withLegacy(run),now=run(root);
  assert(now.r.queued.length===0&&now.r.reasons.includes('energy-runway')&&now.raw===old.raw);
});
test('Save8 shape and RNG: 96H.9 stores no new state; a natural 96H.9 run reloads byte-identically',()=>{
  const writes=reviewedH9Blocks.flatMap(b=>[...b.matchAll(/([A-Za-z_$][\w$]*(?:\.[\w$]+)+)\s*(?:\+=|-=|=(?!=))/g)].map(m=>m[1]));
  assert.deepEqual([...new Set(writes)],['state.reasons']);
  const keys=h=>h.run('var d=JSON.parse(serialize());JSON.stringify([Object.keys(d).sort(),[...new Set(d.emps.flatMap(e=>Object.keys(e)))].sort()])');
  const old=withLegacy(dir=>{const h=load(SIEGE,dir);h.run('months9(6,1,6)');return keys(h);});
  const h=load(SIEGE);h.run('months9(6,1,6)');assert.equal(keys(h),old);
  // As in 96H.8, a mid-month first load recomputes derived caches (income, modifiers,
  // power); systems are unchanged and every later save/load is a fixed point.
  assert(h.run('var a=serialize(),ok=deserialize(a),b=serialize(),ok2=deserialize(b),c=serialize();ok&&ok2&&b===c&&JSON.parse(a).v===8&&JSON.stringify(JSON.parse(a).sys)===JSON.stringify(JSON.parse(b).sys)'));
});
test('invasion, combat and diplomacy rules keep their 96H.8 bytes',()=>{
  const want={'economy.js':'5d412d488760ae2b7193b13822b747788130b63ed782e62bfbd3223154b69d22','combat.js':'b4e21fcdb6fdaaa93da07313131470de3e8a3c28b5650226a9c4a2713bde73a5','diplomacy.js':'ca589f8d2581e7189f6ace471db9bf2e9e1e504117eb2249b7ce9f04e206eaf4'};
  for(const [n,sha]of Object.entries(want))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex'),sha,n);
});
test('only the reviewed 96H.9 invasion blocks differ from 96H.8 ai.js',()=>{
  const source=fs.readFileSync(path.join(root,'ai.js'),'utf8');
  assert.equal(crypto.createHash('sha256').update(stripReviewedH9(source)).digest('hex'),'8141a3fb691db340e66f267a9a94f942d3cb7e2cd542829bbb7493545bff16b0');
});
end();
