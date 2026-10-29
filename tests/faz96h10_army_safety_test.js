'use strict';
/* 96H.10: an unarmed army is not sent into, and does not keep heading for, a
   system where visible hostile warships outgun the empire's own warships that
   are there or bound there. Real seed11 Save8 checkpoints (canonical 45/5 spiral,
   one-draw placebo worlds of the 96H.9 evidence) reproduce the 96H.9 failures:
   at month 228 four armies are sent into their own colony while pirates hold the
   orbit and three die on arrival; at month 173 a moving army keeps its order into
   visible enemy strength and is lost. The 96H.9 control is rebuilt from the
   reviewed adapter. */
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),{stripReviewedH10,reviewedH10Blocks}=require('./helpers/96h10-preservation');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const fixture=n=>fs.readFileSync(path.join(__dirname,n.includes('/')?n:'fixtures/96h10/'+n),'utf8');
const OCCUPIED='seed11-month228-occupied-colony.save',TRANSIT='seed11-month173-in-transit.save';
function legacyRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-96h9-'));
  for(const n of fs.readdirSync(root))if(/\.(js|html|json)$/.test(n)&&fs.statSync(path.join(root,n)).isFile())fs.symlinkSync(path.join(root,n),path.join(dir,n));
  fs.unlinkSync(path.join(dir,'ai.js'));fs.writeFileSync(path.join(dir,'ai.js'),stripReviewedH10(fs.readFileSync(path.join(root,'ai.js'),'utf8')));
  return dir;
}
function load(save,base=root){
  const h=runtime({root:base});h.sb.raw10=fixture(save);assert.equal(h.run('deserialize(raw10)'),true);h.run('delete raw10');
  h.run(`var orders10=[],losses10=[];
    const mv10=aiMove;aiMove=function(e,f,to){const r=mv10.apply(this,arguments);if(isTransport(f))orders10.push({day:G.day,fleet:f.id,to,ok:!!r});return r;};
    const ct10=combatTick;combatTick=function(){const before=G.fleets.filter(f=>f.ships.length&&isTransport(f)).map(f=>({id:f.id,sys:f.sys}));const r=ct10.apply(this,arguments);
      for(const a of before)if(!G.fleets.some(f=>f.id===a.id&&f.ships.length))losses10.push({day:G.day,fleet:a.id,sys:a.sys});return r;};
    function step10(n){for(let i=0;i<n;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}}
    function alive10(ids){return ids.filter(id=>G.fleets.some(f=>f.id===id&&f.ships.length));}
    function dest10(id){const f=G.fleets.find(x=>x.id===id);return f&&(f.path.length?f.path.at(-1):(f.mv?f.mv.to:f.sys));}`);
  return h;
}
function withLegacy(fn){const dir=legacyRoot();try{return fn(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const json=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const ARMIES=[603,606,721];

test('96H.9 month 228: actor3 orders four armies into colony sys20 held by visible pirates; three die on arrival (bug reproduced)',()=>withLegacy(dir=>{
  const h=load(OCCUPIED,dir);h.run('step10(120)');
  const o=json(h,'orders10.filter(x=>x.day===6870&&x.to===20)'),l=json(h,'losses10');
  assert.equal(o.length,4,JSON.stringify(o));
  assert.deepEqual(json(h,'alive10('+JSON.stringify(ARMIES)+')'),[]);
  assert(l.filter(x=>x.day===6877&&ARMIES.includes(x.fleet)).length===3,JSON.stringify(l));
}));
test('96H.10 month 228: no army is ordered into the occupied orbit; the armies wait at a safe colony and survive',()=>{
  const h=load(OCCUPIED);assert.equal(h.run('aiArmySafe(G.emps[3],20)'),false);
  h.run('step10(120)');
  assert.deepEqual(json(h,'orders10.filter(x=>x.to===20)'),[]);
  assert.deepEqual(json(h,'alive10('+JSON.stringify(ARMIES)+')'),ARMIES);
  assert(h.run(`[${ARMIES}].every(id=>aiArmySafe(G.emps[3],dest10(id)))`));
});
test('96H.9 month 173: actor1 army 397 keeps its order into visible enemy strength and is lost on day 5240.5 (bug reproduced)',()=>withLegacy(dir=>{
  const h=load(TRANSIT,dir);h.run('step10(120)');
  assert(json(h,'losses10').some(x=>x.fleet===397&&x.day===5240.5),h.run('JSON.stringify(losses10)'));
  assert(!json(h,'orders10').some(x=>x.fleet===397));
}));
test('96H.10 month 173: the moving army is re-tasked on day 5220 to safe sys13 and survives',()=>{
  const h=load(TRANSIT);h.run('step10(120)');
  assert.deepEqual(json(h,'orders10.filter(x=>x.fleet===397)'),[{day:5220,fleet:397,to:13,ok:true}]);
  assert(h.run('alive10([397]).length===1&&!losses10.some(x=>x.fleet===397)'));
});
test('safety reads only visible hostile warships and counts own warships there or bound there; read-only, no RNG',()=>{
  const h=load(OCCUPIED),raw=h.run('serialize()'),rng=h.run('RND_STATE');
  assert.equal(h.run('aiObservedThreat(G.emps[3],20,false)'),1254);
  assert.equal(h.run('aiArmySafe(G.emps[3],20)'),false);
  assert(h.run('serialize()')===raw&&h.run('RND_STATE')===rng);
  // the same hostile fleets outside the observer's sight are not used
  assert.equal(h.run('aiView(G.emps[3]).ctx.visible.delete(20);var s=aiArmySafe(G.emps[3],20);AI_VIEW_CACHE.delete(G.emps[3]);s'),true);
  // committed own warships of at least 1.15x the visible threat make the system safe
  assert.equal(h.run('var f=G.fleets.find(x=>x.id===51);f.path=[20];aiArmySafe(G.emps[3],20)'),true);
});
test('a moving army re-decides only when its destination turned unsafe; joint-operation and delivery fleets are never re-tasked',()=>{
  for(const flag of ['jointPlan','rallyTo']){
    const h=load(TRANSIT);h.run('step10(59)');h.sb.flag10=flag;
    assert(h.run('G.day===5219.5&&dest10(397)===6&&!aiArmySafe(G.emps[1],6)'));
    h.run('var f=G.fleets.find(x=>x.id===397);f[flag10]=flag10==="jointPlan"?999:6;var p=JSON.stringify(f.path);aiArmyTick()');
    assert(h.run('JSON.stringify(f.path)===p'),flag);
    h.run('delete f[flag10];aiArmyTick()');assert.equal(h.run('dest10(397)'),13);
  }
});
test('negative control: the escorted 96H.9 invasions are unchanged (same army commands, no re-order while moving; sys5 and sys6 still fall cleanly)',()=>{
  const run=base=>{const h=load('fixtures/96h9/seed11-month79-escort.save',base);h.run('var falls=[];const rf=recordFall;recordFall=function(t){falls.push(G.day+":"+t);return rf.apply(this,arguments);};step10(120)');return h;};
  const old=withLegacy(dir=>run(dir).run('JSON.stringify(orders10)')),h=run(root);
  assert.equal(h.run('JSON.stringify(orders10)'),old);
  assert.deepEqual(json(h,'orders10.filter(x=>x.fleet===237)'),[{day:2400,fleet:237,to:5,ok:true}]);
  assert(h.run('falls.includes("2430:temiz")&&G.sys[5].planets.filter(p=>p.col).every(p=>p.owner===3)'));
  const g=load('fixtures/96h9/seed11-month66-siege.save');
  g.run('var falls=[];const rf=recordFall;recordFall=function(t){falls.push(G.day+":"+t);return rf.apply(this,arguments);};step10(360)');
  assert(g.run('falls.includes("2130:temiz")&&G.sys[6].planets.filter(p=>p.col).every(p=>p.owner===1)'));
});
test('player armies are not commanded by the AI army tick',()=>{
  const h=load(OCCUPIED);
  h.run('var pf=newFleet(G.p,G.p.home,[{c:"ord",h:1}]);pf.path=[20];var before=JSON.stringify(pf.path);aiArmyTick()');
  assert(h.run('JSON.stringify(pf.path)===before'));
});
test('Save8 and RNG: 96H.10 stores no new state; a natural run reloads to a fixed point',()=>{
  const writes=reviewedH10Blocks.flatMap(b=>[...b.matchAll(/([A-Za-z_$][\w$]*(?:\.[\w$]+)+)\s*(?:\+=|-=|=(?!=))/g)].map(m=>m[1]));
  assert.deepEqual([...new Set(writes)],[]);
  const keys=h=>h.run('var d=JSON.parse(serialize());JSON.stringify([Object.keys(d).sort(),[...new Set(d.emps.flatMap(e=>Object.keys(e)))].sort()])');
  const old=withLegacy(dir=>{const h=load(OCCUPIED,dir);h.run('step10(120)');return keys(h);});
  const h=load(OCCUPIED);h.run('step10(120)');assert.equal(keys(h),old);
  assert(h.run('var a=serialize(),ok=deserialize(a),b=serialize(),ok2=deserialize(b),c=serialize();ok&&ok2&&b===c&&JSON.parse(a).v===8&&JSON.stringify(JSON.parse(a).sys)===JSON.stringify(JSON.parse(b).sys)'));
});
test('invasion, combat and diplomacy rules keep their 96H.9 bytes',()=>{
  const want={'economy.js':'5d412d488760ae2b7193b13822b747788130b63ed782e62bfbd3223154b69d22','combat.js':'b4e21fcdb6fdaaa93da07313131470de3e8a3c28b5650226a9c4a2713bde73a5','diplomacy.js':'ca589f8d2581e7189f6ace471db9bf2e9e1e504117eb2249b7ce9f04e206eaf4'};
  for(const [n,sha]of Object.entries(want))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex'),sha,n);
});
test('only the reviewed 96H.10 army-safety blocks differ from 96H.9 ai.js',()=>{
  const source=fs.readFileSync(path.join(root,'ai.js'),'utf8');
  assert.equal(crypto.createHash('sha256').update(stripReviewedH10(source)).digest('hex'),'4d7270b6f84466db89fbf944a67c393861dda4485a421ddcabf145b84d6709ed');
});
end();
