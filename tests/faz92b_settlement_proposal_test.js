'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(){const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.feds=[];G.council=null;G.fleets=[];
 for(const e of G.emps){e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;
   for(const o of G.emps)e.contact[o.id]=true;}
 for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
 var P=G.p,T=G.emps[2],M=G.emps[3];
 declareWar(P,T);executeDeal({from:3,to:0,give:[{t:'warOn',target:2}],want:[]});
 var land=G.sys.filter(s=>!s.planets.some(p=>p.col)).slice(0,4);
 land.forEach((s,i)=>{s.owner=2;captureSystem(s,i<2?0:3)});
 var campaign=warLedgerFind(0,2).campaign;makePeace(P,T);
 var q=settlementPreview(P,campaign);`);return h;}
function submit(h,who='P',assign='null'){return h.run(`var q=settlementPreview(${who},campaign);settlementSubmit(${who},campaign,q.stamp,${assign})`);}
test('Real coalition conquest and peace yields one unique row per empty system',()=>{
 const h=fresh();eq(h.run('q.ok'));eq(h.run('q.rows.length'),4);eq(h.run('new Set(q.rows.map(r=>r.key)).size'),4);eq(h.run('q.members.join(",")'),'0,3');
});
test('Pure proposal and AI opinion do not mutate state, RNG or resources',()=>{
 const h=fresh();h.run('var s=serialize(),r=RND_STATE;for(var i=0;i<30;i++){var p=settlementPreview(P,campaign);settlementOpinion(M,p)}');eq(h.run('serialize()'),h.run('s'));eq(h.run('RND_STATE'),h.run('r'));
});
test('Open campaign and partial legacy records cannot generate share rights',()=>{
 const h=fresh();h.run('G.warLedger.fronts[0].ended=null');eq(h.run('settlementPreview(P,campaign).ok'),false);
 h.run('G.warLedger.fronts[0].ended=G.day;G.warLedger.fronts[0].legacy=true');eq(h.run('settlementPreview(P,campaign).ok'),false);
});
test('Independent war participants are not added to eligible recipients',()=>{
 const h=fresh();h.run('var X=G.emps[4];warAuthorize(X,T,{n:"test"});declareWar(X,T);warAuthClear();makePeace(X,T)');eq(h.run('settlementPreview(P,campaign).members.join(",")'),'0,3');
});
test('Living opponent or third-party current land is excluded',()=>{
 const h=fresh();h.run('land[0].owner=4;land[1].owner=2;var p=settlementPreview(P,campaign)');eq(h.run('p.rows.length'),2);eq(h.run('p.rows.some(r=>r.from===2||r.from===4)'),false);
});
test('Other campaign later occupation excludes an old campaign asset',()=>{
 const h=fresh();h.run(`var f=JSON.parse(JSON.stringify(G.warLedger.fronts[0]));f.id=999;f.campaign=999;f.occupation=[{sys:land[0].id,planet:null,from:2,to:0,day:G.day}];G.warLedger.fronts.push(f);`);
 eq(h.run('settlementPreview(P,campaign).rows.some(r=>r.sys===land[0].id)'),false);
});
test('Recipient cannot be an outsider and extra forged asset key is rejected',()=>{
 const h=fresh();eq(h.run('settlementPreview(P,campaign,{[q.rows[0].key]:4}).ok'),false);eq(h.run('settlementPreview(P,campaign,{"s:999":0}).ok'),false);
});
test('Fetih claim is a reason, not a forced ownership right',()=>{
 const h=fresh();h.run('G.warLedger.fronts[1].goals.push({by:3,day:0,type:"fetih",targets:[land[0].id]});var p=settlementPreview(P,campaign,{[q.rows[0].key]:0})');
 eq(h.run('p.rows[0].claims.includes(3)'));eq(h.run('p.rows[0].to'),0);eq(h.run('land[0].owner'),0);
});
test('Accepted proposal remains a proposal; no land, resource or RNG mutation',()=>{
 const h=fresh();h.run('var owners=JSON.stringify(G.sys),emps=JSON.stringify(G.emps),r=RND_STATE');const r=submit(h);eq(r.ok);eq(r.state,'approved');
 eq(h.run('JSON.stringify(G.sys)'),h.run('owners'));eq(h.run('JSON.stringify(G.emps)'),h.run('emps'));eq(h.run('RND_STATE'),h.run('r'));
});
test('AI explicitly rejects a plan that takes every asset for proposer',()=>{
 const h=fresh();const r=submit(h,'P','Object.fromEntries(q.rows.map(r=>[r.key,0]))');eq(r.ok);eq(r.state,'rejected');eq(h.run('G.settlements.offers[0].votes.find(v=>v.by===3).yes'),false);
});
test('AI proposer never auto-votes for player; explicit player yes is required',()=>{
 const h=fresh();const r=submit(h,'M');eq(r.ok);eq(r.state,'pending');eq(h.run('G.settlements.offers[0].votes.some(v=>v.by===0)'),false);
 eq(h.run('settlementVote(P,1,true).state'),'approved');
});
test('Player rejection ends proposal without resource charge',()=>{
 const h=fresh();submit(h,'M');h.run('var money=JSON.stringify(P.res)');eq(h.run('settlementVote(P,1,false).state'),'rejected');eq(h.run('JSON.stringify(P.res)'),h.run('money'));
});
test('Duplicate send and duplicate vote cannot add second decisions',()=>{
 const h=fresh();submit(h,'M');eq(submit(h,'M').ok,false);eq(h.run('G.settlements.offers.length'),1);
 eq(h.run('settlementVote(P,1,true).ok'));eq(h.run('settlementVote(P,1,true).ok'),false);eq(h.run('G.settlements.offers[0].votes.length'),2);
});
test('Ownership changed after preview prevents stale submission',()=>{
 const h=fresh();h.run('var old=q.stamp;land[0].owner=4');eq(h.run('settlementSubmit(P,campaign,old).ok'),false);eq(h.run('G.settlements.offers.length'),0);
});
test('Ownership changed after submission prevents approval',()=>{
 const h=fresh();submit(h,'M');h.run('land[0].owner=4');eq(h.run('settlementVote(P,1,true).ok'),false);eq(h.run('settlementState(settlementOffer(1)).state'),'invalid');
});
test('Capture away and back invalidates consent even with same final owner',()=>{
 const h=fresh();submit(h,'M');h.run('captureSystem(land[0],4,"transfer");captureSystem(land[0],0,"transfer")');eq(h.run('settlementVote(P,1,true).ok'),false);
});
test('Renewed war, member death and membership change invalidate terms',()=>{
 for(const change of ['P.war[2]=T.war[0]=true','M.dead=true','G.feds=[{id:100,members:[0,3],laws:{}}]']){
  const h=fresh();submit(h,'M');h.run(change);eq(h.run('settlementVote(P,1,true).ok'),false);
 }
});
test('Deadline expires pending and approved proposals',()=>{
 for(const proposer of ['M','P']){const h=fresh();submit(h,proposer);h.run('G.day+=180;settlementTick()');eq(h.run('settlementOffer(1).state'),'expired');}
});
test('Proposer can withdraw; changed terms require new offer and fresh player vote',()=>{
 const h=fresh();submit(h,'M');eq(h.run('settlementWithdraw(P,1).ok'),false);eq(h.run('settlementWithdraw(M,1).ok'));eq(submit(h,'M').ok);eq(h.run('settlementOffer(2).state'),'pending');eq(h.run('settlementOffer(2).votes.some(v=>v.by===0)'),false);
});
test('Save/load preserves pending terms and does not approve player',()=>{
 const h=fresh();submit(h,'M');h.run('var s=serialize(),o=JSON.stringify(G.settlements),r=RND_STATE');eq(h.run('deserialize(s)'));eq(h.run('JSON.stringify(G.settlements)'),h.run('o'));eq(h.run('RND_STATE'),h.run('r'));
});
test('Forged unanimous status and foreign recipient in save are rejected',()=>{
 for(const change of ['d.settlements.offers[0].state="approved"','d.settlements.offers[0].rows[0].to=4']){
  const h=fresh();submit(h,'M');h.run('var old=serialize(),d=JSON.parse(old);'+change);eq(h.run('deserialize(JSON.stringify(d))'),false);eq(h.run('serialize()'),h.run('old'));
 }
});
test('Submit failure restores sequence/root; vote failure restores same offer object',()=>{
 const h=fresh();h.run('var ref=G.settlements,s=serialize();G._settlementFailInject=()=>{throw Error("fail")}');eq(submit(h,'M').ok,false);eq(h.run('G.settlements===ref'));eq(h.run('serialize()'),h.run('s'));
 h.run('delete G._settlementFailInject');submit(h,'M');h.run('var offer=settlementOffer(1),s=serialize();G._settlementFailInject=()=>{throw Error("vote")}');eq(h.run('settlementVote(P,1,true).ok'),false);eq(h.run('settlementOffer(1)===offer'));eq(h.run('serialize()'),h.run('s'));
});
test('UI action opens real preview, changes recipient, submits without transfer',()=>{
 const h=fresh();h.run('UI.act("shareOpen",campaign);var old=JSON.stringify(G.sys);UI._hooks.shareNext(0);UI._hooks.shareSend()');
 eq(h.run('G.settlements.offers.length'),1);eq(h.run('JSON.stringify(G.sys)'),h.run('old'));
});
test('Player UI consent and stale callbacks follow actual world identity',()=>{
 const h=fresh();submit(h,'M');h.run('UI.openSettlement(campaign);var callback=UI._hooks.shareYes,s=serialize();deserialize(s);callback()');eq(h.run('settlementOffer(1).state'),'pending');
 h.run('UI.openSettlement(campaign);UI._hooks.shareYes()');eq(h.run('settlementOffer(1).state'),'approved');
});
test('Unknown land names are hidden and incomplete preview cannot be submitted',()=>{
 const h=fresh();h.run('land[2].seen=[];land[2].surv=[];UI.openSettlement(campaign);var html=document.getElementById("modal").innerHTML');
 eq(h.run('settlementSubmit(P,campaign,q.stamp).ok'),false);
 // Renderer host stores modal HTML in modalBox; use actual method capture for privacy.
 h.run('var shown="";UI.openModal=s=>{shown=s};UI.openSettlement(campaign)');eq(h.run('shown.includes(land[2].name)'),false);eq(h.run('shown.includes("Keşif bilgisi yetersiz")'));
});
test('Old v8 save resets settlement state and new game cannot retain offers',()=>{
 const h=fresh();submit(h,'M');h.run('var d=JSON.parse(serialize());delete d.settlements');eq(h.run('deserialize(JSON.stringify(d))'));eq(h.run('G.settlements.offers.length'),0);
 h.run('setupGame({...G.cfg})');eq(h.run('G.settlements.offers.length'),0);
});
test('Colonized system contributes separate colonies, no duplicate orbit or neutral colony',()=>{
 const h=fresh();h.run(`var donor=G.sys.find(s=>s.planets.some(p=>p.col));var template=JSON.parse(JSON.stringify(donor.planets.find(p=>p.col).col));
   var s=land[0];for(let i=0;i<2;i++){if(!s.planets[i])s.planets[i]={i,name:'Test '+i};s.planets[i].col=JSON.parse(JSON.stringify(template));s.planets[i].owner=i===0?0:4;}
   G.warLedger.fronts[0].occupation.push({sys:s.id,planet:0,from:2,to:0,day:G.day});var p=settlementPreview(P,campaign);`);
 eq(h.run('p.ok'));eq(h.run('p.rows.some(r=>r.sys===land[0].id&&r.planet===null)'),false);
 eq(h.run('p.rows.filter(r=>r.sys===land[0].id).length'),1);eq(h.run('p.rows.find(r=>r.sys===land[0].id).value'),3);
 eq(h.run('p.rows.some(r=>r.from===4)'),false);
});
test('Identical-day cross-front ownership ambiguity is excluded conservatively',()=>{
 const h=fresh();h.run('G.warLedger.fronts[1].occupation.push({sys:land[0].id,planet:null,from:2,to:3,day:G.day});land[0].owner=3');
 eq(h.run('settlementPreview(P,campaign).rows.some(r=>r.sys===land[0].id)'),false);
});
test('A recapture in one front does not duplicate distribution rows',()=>{
 const h=fresh();h.run('var f=G.warLedger.fronts[0];f.occupation.push({sys:land[0].id,planet:null,from:0,to:2,day:G.day},{sys:land[0].id,planet:null,from:2,to:0,day:G.day})');
 eq(h.run('settlementPreview(P,campaign).rows.filter(r=>r.sys===land[0].id).length'),1);
});
test('Outsider and stale world actor cannot approve or submit',()=>{
 const h=fresh();submit(h,'M');eq(h.run('settlementVote(G.emps[4],1,true).ok'),false);
 h.run('var oldP=P;deserialize(serialize())');eq(h.run('settlementVote(oldP,1,true).ok'),false);
});
test('Malformed archived numeric shares cannot inject content or bypass load guard',()=>{
 const h=fresh();submit(h,'M');h.run('var old=serialize(),d=JSON.parse(old);d.settlements.offers[0].state="invalid";d.settlements.offers[0].stamp="old";d.settlements.offers[0].shares[0].points="<img>"');
 eq(h.run('deserialize(JSON.stringify(d))'),false);eq(h.run('serialize()'),h.run('old'));
});
test('Save/load retains territory revision and pending decision becomes invalid after transfer',()=>{
 const h=fresh();submit(h,'M');h.run('captureSystem(land[0],4,"transfer");captureSystem(land[0],0,"transfer");var rev=land[0].shareRev,sysId=land[0].id');
 eq(h.run('deserialize(serialize())'));eq(h.run('G.sys[sysId].shareRev'),h.run('rev'));eq(h.run('settlementOffer(1).state'),'invalid');
});
test('Expired and withdrawn archives survive reload with no automatic new proposal',()=>{
 for(const command of ['G.day+=180;settlementTick()','settlementWithdraw(M,1)']){
 const h=fresh();submit(h,'M');h.run(command+';var s=JSON.stringify(G.settlements)');eq(h.run('deserialize(serialize())'));eq(h.run('JSON.stringify(G.settlements)'),h.run('s'));
 }
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
