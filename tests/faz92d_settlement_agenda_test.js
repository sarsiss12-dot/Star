'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');let pass=0,fail=0;
const eq=(a,b=true)=>assert.equal(a,b);
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
function fresh(aiOnly=false){const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.feds=[];G.council=null;G.fleets=[];G.over=null;
 for(const e of G.emps){e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;
 for(const o of G.emps)e.contact[o.id]=true;}
 for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
 var A=G.emps[${aiOnly?1:0}],T=G.emps[2],M=G.emps[3];
 var land=G.sys.filter(s=>!s.planets.some(p=>p.col)&&s.planets.length>=2).slice(0,4);
 G._warAuth=A.id+'>2';declareWar(A,T);G._warAuth=null;executeDeal({from:M.id,to:A.id,give:[{t:'warOn',target:2}],want:[]});
 land.forEach((s,i)=>{s.owner=2;captureSystem(s,i<2?A.id:M.id)});
 var campaign=warLedgerFind(A.id,2).campaign;makePeace(A,T);
 var mf=G.warLedger.fronts.find(f=>f.campaign===campaign&&f.sides.includes(3));mf.metrics[mf.sides.indexOf(3)].damageDealt=1000;
 UI.refresh=()=>{};`);return h;}
test('AI proposal leaves player ownership and vote unchanged, survives repeated tick',()=>{
 const h=fresh();h.run('var owners=land.map(s=>s.owner).join(),rng=RND_STATE;var r=settlementAgendaTick(),O=G.settlements.offers[0]');
 eq(h.run('r.submitted'),1);eq(h.run('O.state'),'pending');eq(h.run('O.proposer'),3);
 eq(h.run('O.votes.some(v=>v.by===0)'),false);eq(h.run('land.map(s=>s.owner).join()'),h.run('owners'));eq(h.run('RND_STATE'),h.run('rng'));
 h.run('for(let i=0;i<20;i++)settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),1);
 eq(h.run('G.log.filter(x=>x.m.includes("paylaşımı önerildi")).length'),1);
});
test('Player yes still requires explicit application',()=>{
 const h=fresh();h.run('settlementAgendaTick();var O=G.settlements.offers[0],owners=land.map(s=>s.owner).join()');
 eq(h.run('settlementVote(G.p,O.id,true).ok'));h.run('settlementAgendaTick()');eq(h.run('O.state'),'approved');
 eq(h.run('land.map(s=>s.owner).join()'),h.run('owners'));eq(h.run('settlementApply(G.p,O.id).ok'));eq(h.run('O.state'),'applied');
});
test('AI-only coalition uses canonical approval and actual transfer once',()=>{
 const h=fresh(true);h.run('var owners=land.map(s=>s.owner).join(),rng=RND_STATE;var r=settlementAgendaTick(),O=G.settlements.offers[0]');
 eq(h.run('r.submitted'),1);eq(h.run('r.applied'),1);eq(h.run('O.state'),'applied');assert.notEqual(h.run('land.map(s=>s.owner).join()'),h.run('owners'));
 eq(h.run('O.votes.every(v=>v.yes)'));eq(h.run('RND_STATE'),h.run('rng'));eq(h.run('G.log.some(x=>x.m.includes("paylaşımı önerildi"))'),false);
 h.run('settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),1);
});
test('Player rejection is not resubmitted by AI after reload or expiry',()=>{
 const h=fresh();h.run('settlementAgendaTick();settlementVote(G.p,G.settlements.offers[0].id,false);var saved=serialize();deserialize(saved);G.day+=181;settlementAgendaTick()');
 eq(h.run('G.settlements.offers.length'),1);eq(h.run('G.settlements.offers[0].state'),'rejected');
});
test('No proposal during active war, legacy front, unknown partner or unseen land',()=>{
 for(const cmd of ['G.warLedger.fronts[0].ended=null','G.warLedger.fronts[0].legacy=true','M.contact[A.id]=false','land.forEach(s=>s.seen=[])']){
 const h=fresh();h.run(cmd);h.run('settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),0);}
});
test('Old peace and unchanged default distribution do not generate busywork',()=>{
 const h=fresh();h.run('G.day+=181;settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),0);
 const b=fresh();b.run('mf.metrics[mf.sides.indexOf(3)].damageDealt=0;settlementAgendaTick()');eq(b.run('G.settlements.offers.length'),0);
});
test('New war, death, or expired proposal cannot auto-transfer',()=>{
 for(const cmd of ['A.war[2]=true','M.dead=true','G.day+=180']){const h=fresh(true);
 h.run(`var q=settlementPreview(M,campaign);settlementSubmit(M,campaign,q.stamp);var owners=land.map(s=>s.owner).join();${cmd};settlementAgendaTick()`);
 eq(h.run('land.map(s=>s.owner).join()'),h.run('owners'));eq(h.run('G.settlements.offers[0].state===\'applied\''),false);}
});
test('Submission failure rolls back; no notice or lost offer id',()=>{
 const h=fresh();h.run('var saved=serialize();G._settlementFailInject=stage=>{if(stage===\'submit\')throw Error(\'injected\')};var r=settlementAgendaTick()');
 eq(h.run('r.blocked'),1);eq(h.run('serialize()'),h.run('saved'));
 h.run('delete G._settlementFailInject;settlementAgendaTick()');eq(h.run('G.settlements.offers[0].id'),1);
});
test('Application failure leaves approved offer retriable with intact ownership',()=>{
 const h=fresh(true);h.run('var owners=land.map(s=>s.owner).join();G._settlementFailInject=stage=>{if(stage===\'after:items\')throw Error(\'injected\')};var r=settlementAgendaTick()');
 eq(h.run('r.blocked'),1);eq(h.run('land.map(s=>s.owner).join()'),h.run('owners'));eq(h.run('G.settlements.offers[0].state'),'approved');
 h.run('delete G._settlementFailInject;settlementAgendaTick()');eq(h.run('G.settlements.offers[0].state'),'applied');eq(h.run('G.settlements.offers.length'),1);
});
test('Notification failure does not undo successful pending proposal or interrupt agenda',()=>{
 const h=fresh();h.run('UI.alert=()=>{throw Error("presentation")};settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),1);
});
test('Save/load does not auto-vote or auto-apply; pure directory reaches pending proposal',()=>{
 const h=fresh();h.run('settlementAgendaTick();var saved=serialize();deserialize(saved);var before=serialize();var html=UI.settlementAgenda()');
 eq(h.run('serialize()'),h.run('before'));assert.match(h.run('html'),/shareOpen/);assert.match(h.run('html'),/Oyun bekleniyor/);
 eq(h.run('G.settlements.offers[0].state'),'pending');h.run('settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),1);
});
test('Unrelated player sees no AI-only agenda or secret participant names',()=>{
 const h=fresh(true);h.run('settlementAgendaTick()');eq(h.run('UI.settlementAgenda()'),'');
});
test('Real monthTick reaches agenda after peace without player consent',()=>{
 const h=fresh();h.run('aiTurn=()=>{};G.autoSave=false;monthTick()');eq(h.run('G.settlements.offers.length'),1);eq(h.run('G.settlements.offers[0].votes.some(v=>v.by===0)'),false);
});
test('Nested transaction and game-over skip agenda completely',()=>{
 for(const cmd of ['G.over={win:true}','_dealTxActive=true','G._sideBuf=[]']){const h=fresh();h.run(cmd);h.run('settlementAgendaTick()');eq(h.run('G.settlements.offers.length'),0);}
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
