'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const {fresh:battle}=require('./helpers/combat-feedback-fixture');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' != '+b);
function fresh(){const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`G.warLedger=warLedgerEmpty();G.feds=[];G.council=null;
 for(const e of G.emps){e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;e.res.min=1000;
   for(const o of G.emps)e.contact[o.id]=true;}
 var P=G.p,T=G.emps[2],M=G.emps[3];`);return h;}
function war(h,a=0,b=2){eq(h.run(`warAuthorize(G.emps[${a}],G.emps[${b}],{n:'test'});var ok=declareWar(G.emps[${a}],G.emps[${b}]);warAuthClear();ok`));}
test('Declaration opens one exact front; duplicate declaration cannot duplicate it',()=>{
 const h=fresh();war(h);eq(h.run('G.warLedger.fronts.length'),1);eq(h.run('declareWar(P,T)'),false);eq(h.run('G.warLedger.fronts.length'),1);
 eq(h.run('warLedgerFind(0,2).legacy'),false);
});
test('Rejected declaration records nothing',()=>{const h=fresh();h.run("P.civics=['evrensel_baris']");
 // Closed federation permission is independent of civic catalog spelling.
 h.run('G.feds=[{id:100,members:[0,3],laws:{savasOnay:true}}]');eq(h.run('declareWar(P,T)'),false);eq(h.run('G.warLedger.fronts.length'),0);
});
test('Federation defense joins exact campaign and keeps original sides',()=>{
 const h=fresh();h.run('G.feds=[{id:100,members:[2,3],laws:{savunma:true}}]');war(h);
 eq(h.run('!!M.war[0]'));eq(h.run('warLedgerFind(3,0).campaign'),h.run('warLedgerFind(0,2).campaign'));
 eq(h.run('warLedgerFind(3,0).roles[0]'),1);eq(h.run('warLedgerFind(3,0).reason'),'federation');
});
test('Independent attack on same enemy stays separate despite alliance',()=>{
 const h=fresh();war(h);h.run('P.ally[3]=M.ally[0]=true');war(h,3,2);
 assert.notEqual(h.run('warLedgerFind(0,2).campaign'),h.run('warLedgerFind(3,2).campaign'));
});
test('Overlord defensive entry carries verified sponsor',()=>{
 const h=fresh();h.run('T.overlord=3;T.vassalType="bilim"');war(h);
 eq(h.run('warLedgerFind(3,0).campaign'),h.run('warLedgerFind(0,2).campaign'));
 eq(h.run('warLedgerFind(3,0).reason'),'overlord');
});
test('War promise joins sponsor campaign and proxy peace closes both',()=>{
 const h=fresh();war(h);eq(h.run('executeDeal({from:3,to:0,give:[{t:"warOn",target:2}],want:[]})'));
 eq(h.run('warLedgerFind(3,2).campaign'),h.run('warLedgerFind(0,2).campaign'));
 eq(h.run('makePeace(P,T)'));eq(h.run('G.warLedger.fronts.every(f=>f.ended!==null)'));
});
test('Support for someone not fighting does not invent a coalition',()=>{
 const h=fresh();eq(h.run('executeDeal({from:3,to:0,give:[{t:"warOn",target:2}],want:[]})'));
 eq(h.run('G.warLedger.fronts.length'),1);eq(h.run('G.warLedger.fronts[0].parent'),null);
});
test('Membership changes append history without rewriting campaign side',()=>{
 const h=fresh();war(h);h.run('G.day++;G.feds=[{id:101,members:[0,3],laws:{}}];warLedgerSync();G.day++;G.feds=[];warLedgerSync()');
 eq(h.run('warLedgerFind(0,2).membership.filter(x=>x.id===0).length'),3);eq(h.run('warLedgerFind(0,2).roles[0]'),0);
});
test('Repeated sync and read are RNG-free and do not inflate history',()=>{
 const h=fresh();war(h);h.run('var r=RND_STATE;var s=serialize();for(var i=0;i<50;i++){warLedgerSync();warLedgerView(P,2);UI.warContribution(P,T)}');eq(h.run('RND_STATE'),h.run('r'));eq(h.run('serialize()'),h.run('s'));
});
test('Old ongoing wars begin partial measurement, without invented past losses',()=>{
 const h=fresh();h.run('P.war[2]=T.war[0]=true;var d=JSON.parse(serialize());delete d.warLedger;var r=RND_STATE');eq(h.run('deserialize(JSON.stringify(d))'));
 eq(h.run('warLedgerFind(0,2).legacy'));eq(h.run('warLedgerFind(0,2).metrics[0].shipsLost'),0);eq(h.run('RND_STATE'),h.run('r'));
});
test('Direct legacy rebellion path is observed without guessed sponsor',()=>{
 const h=fresh();h.run('M.war[2]=T.war[3]=true;dailyTick(0)');eq(h.run('warLedgerFind(2,3).legacy'));eq(h.run('warLedgerFind(2,3).parent'),null);
});
test('Peace and new war create distinct episodes even on same day',()=>{
 const h=fresh();war(h);eq(h.run('makePeace(P,T)'));war(h);eq(h.run('G.warLedger.fronts.length'),2);eq(h.run('G.warLedger.fronts[0].ended'),h.run('G.day'));
});
test('Separate peace keeps other campaign front active',()=>{
 const h=fresh();h.run('G.feds=[{id:100,members:[2,3],laws:{savunma:true}}]');war(h);eq(h.run('makePeace(P,T)'));
 eq(h.run('warLedgerFind(0,2)'),null);assert.ok(h.run('warLedgerFind(3,0)'));
});
test('Empire elimination closes episode without crediting purged fleets as combat kills',()=>{
 const h=fresh();war(h);h.run('T.dead=true;purgeEmpire(T)');eq(h.run('G.warLedger.fronts[0].endReason'),'eliminated');eq(h.run('G.warLedger.fronts[0].metrics[0].shipsDestroyed'),0);
});
test('Real battle round uses actual hull damage and loss counts',()=>{
 const h=battle();h.run('var before=B.ships.reduce((n,s)=>n+maxHull(s.c,O)*s.h,0);combatTick(.1);var after=B.ships.reduce((n,s)=>n+maxHull(s.c,O)*s.h,0);var f=warLedgerFind(0,1)');
 near(h.run('f.metrics[0].damageDealt'),h.run('before-after'));eq(h.run('f.metrics[0].rounds'),1);eq(h.run('f.metrics[0].shipsLost'),h.run('S.battleReport.loss[0]'));
});
test('Destroyed unarmed survivors are counted exactly once',()=>{
 const h=battle(undefined,['muh'],['bil','kol']);h.run('SHIPS.muh.dmg=1;combatTick(.1);var f=warLedgerFind(0,1);combatTick(.1)');
 eq(h.run('f.metrics[0].shipsDestroyed'),2);eq(h.run('f.metrics[1].shipsLost'),2);
});
test('Pirate fighting is excluded from state settlement contributions',()=>{
 const h=battle();h.run('O.wild=true;combatTick(.1)');eq(h.run('warLedgerFind(0,1)'),null);
});
test('Wartime system capture records all actual colony owners separately',()=>{
 const h=fresh();war(h);h.run('var sy=G.sys.find(s=>s.owner===2&&s.planets.some(p=>p.col));var n=sy.planets.filter(p=>p.col&&p.owner===2).length;captureSystem(sy,0);var f=G.warLedger.fronts[0]');
 eq(h.run('f.metrics[0].systems.length'),1);eq(h.run('f.metrics[0].planets.length'),h.run('n'));eq(h.run('f.occupation[0].from'),2);
});
test('Repeated capture of same asset cannot farm unique capture count',()=>{
 const h=fresh();war(h);h.run('var sy=G.sys.find(s=>s.owner===2&&!s.planets.some(p=>p.col));if(!sy){sy=G.sys.find(s=>s.owner<0);sy.owner=2;}captureSystem(sy,0);captureSystem(sy,2);captureSystem(sy,0)');
 eq(h.run('G.warLedger.fronts[0].metrics[0].systems.length'),1);eq(h.run('G.warLedger.fronts[0].occupation.length'),3);
});
test('Peaceful transfer and wartime deal transfer do not masquerade as conquest',()=>{
 const h=fresh();war(h);h.run('var sy=G.sys.find(s=>s.owner===2);captureSystem(sy,0,"transfer")');eq(h.run('G.warLedger.fronts[0].occupation.length'),0);
 const x=fresh();x.run('var sy=G.sys.find(s=>s.owner===2);captureSystem(sy,0)');eq(x.run('G.warLedger.fronts.length'),0);
});
test('Fetih targets are recorded as claims, never invented as ownership',()=>{
 const h=fresh();eq(h.run('setWarGoal(P,T,"fetih")'));war(h);eq(h.run('JSON.stringify(warLedgerFind(0,2).goals[0].targets)'),h.run('JSON.stringify(P.wg[2].targets)'));
 eq(h.run('warLedgerFind(0,2).occupation.length'),0);
});
test('Old war goal cannot silently become a new campaign claim',()=>{
 const h=fresh();h.run('setWarGoal(P,T,"fetih");G.day++');war(h);eq(h.run('warLedgerFind(0,2).goals.length'),0);
});
test('Native serialized ledger survives reload, without RNG/tick changes',()=>{
 const h=fresh();war(h);h.run('warLedgerBattle(0,2,{killed:1,damage:10},{killed:2,damage:20});var x=JSON.stringify(G.warLedger),r=RND_STATE,day=G.day,save=serialize()');
 eq(h.run('deserialize(save)'));eq(h.run('JSON.stringify(G.warLedger)'),h.run('x'));eq(h.run('RND_STATE'),h.run('r'));eq(h.run('G.day'),h.run('day'));
});
test('Malformed ledger is rejected with full load rollback',()=>{
 const h=fresh();war(h);h.run('var old=serialize(),ref=G.warLedger;var d=JSON.parse(old);d.warLedger.fronts[0].metrics[0].shipsLost=-1');
 eq(h.run('deserialize(JSON.stringify(d))'),false);eq(h.run('G.warLedger===ref'));eq(h.run('serialize()'),h.run('old'));
});
test('Duplicate active pair in save is rejected',()=>{
 const h=fresh();war(h);h.run('var d=JSON.parse(serialize());var f=JSON.parse(JSON.stringify(d.warLedger.fronts[0]));f.id=2;f.campaign=2;d.warLedger.next=3;d.warLedger.fronts.push(f)');eq(h.run('deserialize(JSON.stringify(d))'),false);
});
test('Invalid zero sequence is rejected before creating an unloadable next save',()=>{
 const h=fresh();h.run('var s=serialize(),d=JSON.parse(s);d.warLedger.next=0');
 eq(h.run('deserialize(JSON.stringify(d))'),false);eq(h.run('serialize()'),h.run('s'));
});
test('WarOn transaction rollback restores ledger root identity and sequence',()=>{
 const h=fresh();h.run('var ref=G.warLedger,s=serialize(),r=RND_STATE;G._dealFailInject=t=>{if(t==="after:warOn")throw Error("fail")};');
 eq(h.run('executeDeal({from:3,to:0,give:[{t:"warOn",target:2}],want:[]})'),false);eq(h.run('G.warLedger===ref'));eq(h.run('serialize()'),h.run('s'));eq(h.run('RND_STATE'),h.run('r'));
});
test('Peace transaction rollback reopens same episode',()=>{
 const h=fresh();war(h);h.run('var ref=warLedgerFind(0,2),s=serialize();G._dealFailInject=t=>{if(t==="after:peace")throw Error("fail")}');
 eq(h.run('executeDeal({from:0,to:2,give:[{t:"peace"}],want:[]})'),false);eq(h.run('warLedgerFind(0,2)===ref'));eq(h.run('serialize()'),h.run('s'));
});
test('Contribution view cannot reveal unknown partners or foreign front metrics',()=>{
 const h=fresh();war(h);eq(h.run('executeDeal({from:3,to:0,give:[{t:"warOn",target:2}],want:[]})'));
 h.run('delete P.contact[3];var v=warLedgerView(P,2),html=UI.warContribution(P,T)');eq(h.run('v.partners.length'),0);eq(h.run('html.includes(M.name)'),false);eq(h.run('warLedgerView(P,3)'),null);
});
test('UI shows own contribution and explicitly excludes automatic entitlement',()=>{
 const h=fresh();war(h);h.run('var html=UI.diploRelationship(P,T)');eq(h.run('html.includes("Savaş katkı kaydı")'));eq(h.run('html.includes("paylaşım hakkı değildir")'));
});
test('Real invasion counts only destroyed assault strength before successful disband',()=>{
 const h=fresh();war(h);h.run(`G.fleets=[];var sy=G.sys.find(s=>s.owner===2&&s.planets.some(p=>p.col)),pl=sy.planets.find(p=>p.col);
   for(const p of sy.planets)if(p!==pl){p.col=null;p.owner=-1;}
   pl.col.shield=0;pl.col.garrison=1;var army=newFleet(P,sy.id,[{c:'ord'},{c:'ord'}]);
   invasionTick();var f=G.warLedger.fronts[0];`);
 eq(h.run('pl.owner'),0);eq(h.run('army.ships.length'),0);
 assert.ok(h.run('f.metrics[0].groundLost>0&&f.metrics[0].groundLost<1'));
 eq(h.run('f.metrics[0].garrisonReduced'),1);eq(h.run('f.metrics[1].groundDestroyed'),h.run('f.metrics[0].groundLost'));
});
test('Mixed ownership planet flip is recorded even if system already belongs to attacker',()=>{
 const h=fresh();war(h);h.run(`G.fleets=[];var sy=G.sys.find(s=>s.owner===2&&s.planets.some(p=>p.col)),pl=sy.planets.find(p=>p.col);
   sy.owner=0;for(const p of sy.planets)if(p!==pl){p.col=null;p.owner=-1;}
   pl.col.shield=0;pl.col.garrison=1;newFleet(P,sy.id,[{c:'ord'},{c:'ord'}]);invasionTick();`);
 eq(h.run('G.warLedger.fronts[0].metrics[0].systems.length'),0);eq(h.run('G.warLedger.fronts[0].metrics[0].planets.length'),1);
});
test('Status quo closes real episode without distributing coalition land',()=>{
 const h=fresh();war(h);h.run('P.exh={2:100};T.exh={0:100}');eq(h.run('statusQuoPeace(P,T).ok'));
 eq(h.run('G.warLedger.fronts[0].endReason'),'status-quo');
});
test('New game resets previous campaign ledger',()=>{
 const h=fresh();war(h);h.run('setupGame({...G.cfg})');eq(h.run('G.warLedger.fronts.length'),0);eq(h.run('G.warLedger.next'),1);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
