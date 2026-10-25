'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
let pass=0,fail=0;
function check(name,fn){try{fn();pass++;console.log('  ✓ '+name);}catch(e){fail++;console.log('  ✗ '+name+' — '+e.stack);}}
const data=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function fresh(){
  const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`G.feds=[{id:802,name:'Yasa Birliği',members:[0,1,2],laws:{},treasury:0,nextVote:G.day+180,cohesion:60}];
    var F=G.feds[0],P=G.p,T=G.emps[3];G.fedUid=802;
    for(const e of G.emps){e.ally={};e.war={};e.nap={};e.civics=[];e.res.etk=1000;e.contact={};e.warDefense={};e._fedLawCd=0;}
    for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;
    P.contact[T.id]=true;T.contact[P.id]=true;G.council=null;UI.fedVote=()=>{};`);
  return h;
}
function accept(h){return h.run('F.vote.yes=F.vote.eligible.filter(id=>id!==0);F.vote.no=[];castFedVote(P,F.id,fedVoteToken(F.vote),true)');}
function law(h,k,repeal=false){const r=h.run(`proposeFedLaw(P,'${k}',${repeal})`);assert.equal(r.ok,true);assert.equal(accept(h).gecti,true);}
function request(h){return h.run('proposeFedWar(P,T)');}
check('Catalog offers 15 laws with 11 internal proposals in five categories',()=>{
 const h=fresh();assert.equal(h.run('Object.keys(FED_LAWS).length+Object.keys(FED_INNER_LAWS).length'),15);
 assert.equal(h.run('new Set(Object.values(FED_INNER_LAWS).map(x=>x.cat)).size'),5);
 for(const key of data(h,'Object.keys(FED_INNER_LAWS)')){const x=fresh();law(x,key);assert.equal(x.run(`!!F.laws['${key}']`),true);}
});
check('All internal laws can be repealed, cost once, law really disappears',()=>{
 for(const key of data(fresh(),'Object.keys(FED_INNER_LAWS)')){
  const h=fresh();h.run(`F.laws['${key}']=true`);law(h,key,true);
  assert.equal(h.run(`!!F.laws['${key}']`),false);assert.equal(h.run('P.res.etk'),1000-h.run(`fedLawCost('${key}',true)`));
 }
});
check('Each exclusive policy replaces only its family on acceptance',()=>{
 for(const pair of [['ortakDon','sivilFon'],['bilimAgi','patentOzerk'],['seriUretim','refah']]){
  const h=fresh();h.run(`F.laws['${pair[0]}']=true;F.laws.serbest=true`);law(h,pair[1]);
  assert.equal(h.run(`!!F.laws['${pair[0]}']`),false);assert.equal(h.run('!!F.laws.serbest'),true);
 }
});
check('Rejected replacement retains original policy and its capacity',()=>{
 const h=fresh();h.run('F.laws.ortakDon=true;recalcMods(P);var cap=P.cap;proposeFedLaw(P,"sivilFon");F.vote.yes=[];F.vote.no=[1,2]');
 h.run('castFedVote(P,F.id,fedVoteToken(F.vote),false)');assert.equal(h.run('P.cap'),h.run('cap'));
 assert.equal(h.run('!!F.laws.ortakDon'),true);assert.equal(h.run('!!F.laws.sivilFon'),false);
});
check('Replacing naval budget removes exactly 15 capacity',()=>{
 const h=fresh();h.run('F.laws.ortakDon=true;recalcMods(P);var cap=P.cap');law(h,'sivilFon');assert.equal(h.run('P.cap'),h.run('cap-15'));
});
check('Civil budget charges existing fund at 3 percent, no extra treasury',()=>{
 const h=fresh();h.run('F.laws.sivilFon=true;F.fund={ala:0,ene:0};G.fleets=[];for(const id of F.members){G.emps[id].inc={ala:100,ene:200};G.emps[id].res.ala=100;G.emps[id].res.ene=100;}fedFundTick()');
 assert.equal(h.run('F.fund.ala'),9);assert.equal(h.run('F.fund.ene'),18);assert.equal(h.run('F.treasury'),0);
});
check('Income effects match all seven economic policy numbers and negative-income rules',()=>{
 const cases={sivilFon:{ene:108,ara:96},patentOzerk:{ara:104,etk:102},seriUretim:{ala:110,min:95},refah:{yiy:110,tuk:110,ala:95},uyumProgrami:{etk:99},bilimAgi:{ara:112}};
 for(const [k,expected] of Object.entries(cases)){
  const h=fresh();h.run(`F.laws['${k}']=true;var inc={min:100,ene:100,ara:100,ala:100,yiy:100,tuk:100,etk:100};fedApplyIncomeLaws(P,inc)`);
  for(const [r,v] of Object.entries(expected))assert.ok(Math.abs(h.run('inc.'+r)-v)<1e-8,k+':'+r);
 }
 const h=fresh();h.run('F.laws={sivilFon:true,refah:true};var inc={ene:-10,yiy:-10,tuk:-10,ala:-10,ara:100,etk:0};fedApplyIncomeLaws(P,inc)');
 for(const r of ['ene','yiy','tuk','ala'])assert.equal(h.run('inc.'+r),-10);
});
check('Actual empireIncome uses new policy and repeal removes it',()=>{
 const h=fresh();h.run('recalcMods(P);var before=empireIncome(P);F.laws.patentOzerk=true;var after=empireIncome(P)');
 assert.ok(Math.abs(h.run('after.ara/before.ara')-1.04)<1e-8);assert.equal(h.run('after.etk-before.etk'),2);
 law(h,'patentOzerk',true);assert.equal(h.run('empireIncome(P).etk'),h.run('before.etk'));
});
check('Combat and navigation laws reach real modifier and upkeep paths',()=>{
 const h=fresh();h.run('recalcMods(P);var b={...P.mods};var oldUp=fleetUpkeep(P);F.laws.ortakDoktrin=true;F.laws.ikmalStandardi=true;recalcMods(P)');
 assert.ok(Math.abs(h.run('P.mods.dmgMul-b.dmgMul')-.08)<1e-8);assert.ok(Math.abs(h.run('P.mods.spdMul-b.spdMul')-.08)<1e-8);
 assert.ok(Math.abs(h.run('P.mods.upMul-b.upMul')-.11)<1e-8);assert.ok(h.run('fleetUpkeep(P)>oldUp'));
 law(h,'ortakDoktrin',true);assert.ok(Math.abs(h.run('P.mods.upMul-b.upMul')-.06)<1e-8);
});
check('Cohesion program applies 0.6 plus existing per-law 0.35 only on monthly tick',()=>{
 const a=fresh(),b=fresh();b.run('F.laws.uyumProgrami=true');a.run('cohesionTick()');b.run('cohesionTick()');
 assert.ok(Math.abs(b.run('F.cohesion')-a.run('F.cohesion')-.95)<1e-8);
});
check('Membership loss removes all new derived modifiers',()=>{
 const h=fresh();h.run('recalcMods(P);var base={...P.mods};F.laws={ortakDoktrin:true,ikmalStandardi:true,patentOzerk:true};recalcMods(P);P.ally={};for(const e of G.emps)delete e.ally[0];updateFederations()');
 assert.equal(h.run('P.mods.dmgMul'),h.run('base.dmgMul'));assert.equal(h.run('P.mods.spdMul'),h.run('base.spdMul'));
});
check('War request gate is pure, rejects allies/members/no contact/pirates',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');const before=h.run('serialize()'),rng=h.run('RND_STATE');
 assert.equal(h.run('canFedWarRequest(P,T).ok'),true);
 for(const id of [0,1,4,12])assert.equal(h.run(`canFedWarRequest(P,G.emps[${id}]).ok`),false);
 assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
check('War without federation permission is blocked before cost or RNG',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');const rng=h.run('RND_STATE'),etk=h.run('P.res.etk');
 assert.equal(h.run('canDeclareWarOn(P,T)'),false);assert.equal(h.run('canPromiseWarOn(P,T).ok'),false);
 assert.equal(h.run('setWarGoal(P,T,"fetih")'),false);assert.equal(h.run('declareWar(P,T)'),false);
 assert.equal(h.run('P.res.etk'),etk);assert.equal(h.run('RND_STATE'),rng);assert.equal(h.run('!!P.war[T.id]'),false);
});
check('Accepted permission does not declare war; one specific member and target only',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');assert.equal(request(h).pending,true);assert.equal(accept(h).gecti,true);
 assert.equal(h.run('!!P.war[T.id]'),false);assert.equal(h.run('fedWarAllowed(P,T)'),true);
 assert.equal(h.run('fedWarAllowed(G.emps[1],T)'),false);assert.equal(h.run('fedWarAllowed(P,G.emps[4])'),false);
 assert.equal(h.run('P.res.etk'),1000);
});
check('Permission enables real declaration and is consumed exactly once',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);accept(h);
 assert.equal(h.run('declareWar(P,T)'),true);assert.equal(h.run('!!T.war[0]'),true);
 assert.equal(h.run('F.warPermits["0>3"]'),undefined);assert.equal(h.run('declareWar(P,T)'),false);
 h.run('makePeace(P,T)');assert.equal(h.run('fedWarAllowed(P,T)'),false);
});
check('Expired permission cannot be used',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);accept(h);h.run('G.day+=180');
 assert.equal(h.run('declareWar(P,T)'),false);h.run('fedPruneWarPermits(F)');assert.deepEqual(data(h,'F.warPermits'),{});
});
check('Rejection never grants permission; immediate duplicate request has cooldown',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);h.run('F.vote.yes=[];F.vote.no=[1,2];castFedVote(P,F.id,fedVoteToken(F.vote),false)');
 assert.equal(h.run('fedWarAllowed(P,T)'),false);assert.equal(request(h).ok,false);
 h.run('G.day+=90');assert.equal(request(h).ok,true);
});
check('Invalidated target cancels otherwise unanimous permission vote',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);h.run('T.dead=true');assert.equal(accept(h).gecti,false);
 assert.match(h.run('F.lastVote.invalid'),/Geçerli/);assert.equal(h.run('F.warPermits'),undefined);
});
check('Requester leaving for another federation cannot obtain permission from old electorate',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);
 h.run('F.members=[1,2,4];G.feds.push({id:803,members:[0,5,6],laws:{savasOnay:true}});F.vote.yes=[1,2];F.vote.no=[]');
 assert.equal(h.run('finishFedVote(F).gecti'),false);assert.equal(h.run('F.warPermits'),undefined);
});
check('Repealing war law clears unused permits',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);accept(h);law(h,'savasOnay',true);
 assert.deepEqual(data(h,'F.warPermits'),{});assert.equal(h.run('fedWarAllowed(P,T)'),true);
});
check('Leaving federation invalidates unused permit before rejoining',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);accept(h);
 h.run('F.members=[1,2,4];fedPruneWarPermits(F);F.members=[0,1,2,4]');assert.equal(h.run('fedWarAllowed(P,T)'),false);
});
check('Defense pact members defend without a new offensive permit',()=>{
 const h=fresh();h.run('F.laws={savasOnay:true,savunma:true};warAuthorize(T,P,{n:"Test"});var started=declareWar(T,P);warAuthClear()');
 assert.equal(h.run('started'),true);assert.equal(h.run('!!G.emps[1].war[T.id]'),true);assert.equal(h.run('!!G.emps[2].war[T.id]'),true);
 assert.equal(h.run('G.emps[1].warDefense[T.id].defensive'),true);assert.equal(h.run('T.warDefense[1].defensive'),false);
});
check('Offensive coalition war is not mislabeled as defense',()=>{
 const h=fresh();h.run('F.laws={savasOnay:true,savunma:true}');request(h);accept(h);h.run('declareWar(P,T)');
 assert.equal(h.run('fedDefensiveWar(G.emps[1],T)'),false);assert.equal(h.run('fedWarAllowed(G.emps[1],T)'),false);
});
check('Permission cannot bypass civic prohibition or AI authorization',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);accept(h);
 h.run("CIVICS.__ban={flag:'universal'};P.civics=['__ban']");assert.equal(h.run('declareWar(P,T)'),false);
 h.run('P.civics=[];P.ai=true');assert.equal(h.run('canDeclareWarOn(P,T)'),false);
 h.run('warAuthorize(P,T,{n:"Test"})');assert.equal(h.run('canDeclareWarOn(P,T)'),true);
});
check('Pending war agenda and granted permission survive save/load without auto-war',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true');request(h);
 h.run('var saved=serialize();var rng=RND_STATE;deserialize(saved);F=fedOf(802);P=G.p;T=G.emps[3]');
 assert.equal(h.run('F.vote.kind'),'war');assert.equal(h.run('RND_STATE'),h.run('rng'));accept(h);
 h.run('var done=serialize();deserialize(done);F=fedOf(802);P=G.p;T=G.emps[3]');
 assert.equal(h.run('fedWarAllowed(P,T)'),true);assert.equal(h.run('!!P.war[T.id]'),false);
});
check('Replacement rollback restores old family policy, cost and effects',()=>{
 const h=fresh();h.run('F.laws.ortakDon=true;recalcMods(P);proposeFedLaw(P,"sivilFon");F.vote.yes=[1,2];F.vote.no=[];var old=recalcMods;recalcMods=()=>{throw Error("fail")}');
 const before=h.run('serialize()');assert.equal(h.run('castFedVote(P,F.id,fedVoteToken(F.vote),true).ok'),false);
 assert.equal(h.run('serialize()'),before);
});
check('Real UI exposes five categories, replacement warning and repeal action',()=>{
 const h=fresh();h.run('F.laws.ortakDon=true;UI.openFed()');const html=h.doc.getElementById('diploPane').innerHTML;
 assert.match(html,/Üretim ve refah/);assert.match(html,/Savunma ve lojistik/);assert.match(html,/yerine geçer/);assert.match(html,/fedLawRepeal/);
 h.run("UI.act('fedLawRepeal','ortakDon')");assert.equal(h.run('F.vote.repeal'),true);
});
check('Real war proposal action, context and privacy',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true;UI.act("fedWarRequest","3")');assert.equal(h.run('F.vote.kind'),'war');
 assert.match(h.run('UI.fedAgendaContext(F.vote)'),/Hedef:/);h.run('delete P.contact[3]');assert.match(h.run('UI.fedAgendaContext(F.vote)'),/Temassız devlet/);
});
check('War promise quote and transaction honor federation permission and rollback it',()=>{
 const h=fresh();h.run('F.laws.savasOnay=true;P.contact[2]=true;G.emps[2].contact[0]=true;var off={from:0,to:2,give:[{t:"warOn",target:3}],want:[]}');
 assert.equal(h.run('dealQuote(off).ok'),false);assert.match(h.run('dealQuote(off).reasons.join(" ")'),/federasyon savaş izni/);request(h);accept(h);
 assert.equal(h.run('dealQuote(off).ok'),true);
 h.run('G._dealFailInject=t=>{if(t==="after:warOn")throw Error("rollback war")};var saved=serialize();var rng=RND_STATE');
 assert.equal(h.run('executeDeal(off)'),false);assert.equal(h.run('serialize()'),h.run('saved'));assert.equal(h.run('RND_STATE'),h.run('rng'));
 h.run('delete G._dealFailInject');assert.equal(h.run('executeDeal(off)'),true);assert.equal(h.run('!!P.war[3]'),true);
});
check('Real AI war review requests permission then uses its normal declaration path',()=>{
 const h=fresh();h.run(`F.laws.savasOnay=true;var E=G.emps[1];
   for(const e of G.emps)e.ai=false;E.ai=true;E.contact={3:true};E.rel[3]=-100;
   E.sundered=3;E.pact={};E.nap={};E.inc.ene=100;E.factions=[];
   G.fleets=G.fleets.filter(f=>f.e!==3);E._powAt=-1;T._powAt=-1;
   E.intel=E.intel||{};E.intel[3]=3;G.sys[T.home].owner=3;G.sys[E.home].owner=E.id;G.sys[E.home].lanes.push(T.home);G.sys[T.home].lanes.push(E.home);G.sys[T.home].x=G.sys[E.home].x+100;G.sys[T.home].y=G.sys[E.home].y;newFleet(E,E.home,Array.from({length:30},()=>({c:'kor'})));E._powAt=-1;remember(E,3,'ihanet');E.res.ene=10000;E.res.ala=10000;E.inc=empireIncome(E,false);rndSeed(1234);aiWarReview()`);
 assert.equal(h.run('aiEconomyPlan(E).critical'),false);
 assert.equal(h.run('F.vote && F.vote.kind'),'war');assert.equal(h.run('F.vote.proposer'),1);
 assert.equal(h.run('!!E.war[3]'),false);accept(h);
 h.run('for(let i=0;i<50&&!E.war[3];i++)aiWarReview()');assert.equal(h.run('!!E.war[3]'),true);
 assert.equal(h.run('F.warPermits["1>3"]'),undefined);
});
check('AI considers expanded policies and respects occupied policy families',()=>{
 const h=fresh();h.run('F.members=[1,2,4];F.laws={serbest:true,ortakDon:true,bilimAgi:true};G.emps[1].res.etk=1000;G.emps[2].res.etk=0;G.emps[4].res.etk=0;aiFedLawTick()');
 assert.equal(h.run('!!F.laws.ortakDon'),true);assert.equal(h.run('!!F.laws.bilimAgi'),true);
 assert.equal(h.run('G.emps[1]._fedLawCd>0'),true);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
