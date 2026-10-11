'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
let pass=0,fail=0;
function check(name,fn){try{fn();pass++;console.log('  ✓ '+name);}catch(e){fail++;console.log('  ✗ '+name+' — '+e.stack);}}
const data=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function fresh(){
  const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`G.feds=[{id:801,name:'Test Birliği',members:[0,1,2],laws:{},treasury:0,nextVote:G.day+60,cohesion:70}];
    var F=G.feds[0];G.fedUid=801;G.fleets=G.fleets.filter(f=>!f.federal);
    for(const e of G.emps){e.ally={};e.war={};e.civics=[];e.res.etk=1000;}
    for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;
    UI.fedVote=()=>{};`);
  return h;
}
function open(h,key='bilimAgi',proposer=0){return h.run(`proposeFedLaw(G.emps[${proposer}], '${key}')`);}
function vote(h,yes=true){return h.run(`castFedVote(G.p,F.id,fedVoteToken(F.vote),${yes})`);}
check('Invalid and unsupported proposals leave state and RNG intact',()=>{
  const h=fresh(),before=h.run('serialize()'),rng=h.run('RND_STATE');
  for(const key of ['ZEHIR','__proto__','constructor'])assert.equal(open(h,key).ok,false);
  assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
check('Pure quotes never initialize cohesion or charge cost',()=>{
  const h=fresh();h.run('delete F.cohesion');const before=h.run('serialize()');
  for(let i=0;i<10;i++)h.run("canFedLaw(G.p,'serbest');fedCohesion(F)");
  assert.equal(h.run('serialize()'),before);
});
check('Player proposal pays once and still requires explicit player vote',()=>{
  const h=fresh();assert.equal(open(h).pending,true);assert.equal(h.run('G.p.res.etk'),890);
  assert.equal(h.run('F.vote.yes.includes(0)||F.vote.no.includes(0)'),false);
  assert.equal(h.run('!!F.laws.bilimAgi'),false);
  const before=h.run('serialize()'),rng=h.run('RND_STATE');assert.equal(open(h,'serbest').ok,false);
  assert.equal(h.run('startFedVote(F).ok'),false);assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
check('AI proposal also waits for real player consent',()=>{
  const h=fresh();assert.equal(open(h,'serbest',1).pending,true);
  assert.deepEqual(data(h,'fedVoteCounts(F).waiting'),[0]);assert.equal(h.run('G.emps[1].res.etk'),920);
});
check('AI-only federation resolves without creating a player vote',()=>{
  const h=fresh();h.run('F.members=[1,2,3]');assert.equal(open(h,'serbest',1).pending,false);
  assert.equal(h.run('F.vote'),null);assert.equal(h.run('F.lastVote.yes+F.lastVote.no'),3);
});
check('Accepted law, last result, and exactly one charge',()=>{
  const h=fresh();open(h);h.run('F.vote.yes=[1,2];F.vote.no=[]');assert.equal(vote(h).gecti,true);
  assert.equal(h.run('F.vote'),null);assert.equal(h.run('F.lastVote.passed'),true);
  assert.equal(h.run('G.p.res.etk'),890);assert.equal(h.run('!!F.laws.bilimAgi'),true);
});
check('Tie rejects; cost is not refunded; result survives',()=>{
  const h=fresh();open(h);h.run('F.members=[0,1];F.vote.yes=[1];F.vote.no=[]');
  assert.equal(vote(h,false).gecti,false);assert.equal(h.run('G.p.res.etk'),890);
  assert.equal(h.run('!!F.laws.bilimAgi'),false);assert.equal(h.run('F.cohesion'),67);
});
check('Duplicate ballots and stale identifiers cannot charge or vote again',()=>{
  const h=fresh();open(h);h.run('var tok=fedVoteToken(F.vote);F.vote.yes=[1,2];F.vote.no=[]');vote(h);
  open(h,'serbest');const before=h.run('serialize()');
  assert.equal(h.run('castFedVote(G.p,F.id,tok,true).ok'),false);assert.equal(h.run('serialize()'),before);
});
check('Current electorate filters duplicates, deceased and departed members',()=>{
  const h=fresh();open(h);h.run('F.vote.yes=[1,1,2,5];F.vote.no=[1];G.emps[2].dead=true;F.members=[0,1,4]');
  assert.deepEqual(data(h,'fedVoteCounts(F)'),{yes:1,no:0,eligible:[0,1],voted:[1],waiting:[0]});
  assert.equal(h.run('castFedVote(G.emps[4],F.id,fedVoteToken(F.vote),true).ok'),false);
});
check('Departed player cannot use an old modal vote',()=>{
  const h=fresh();open(h);h.run('F.members=[1,2,3]');assert.equal(vote(h).ok,false);
});
check('Deadline expires with abstention; no automatic player yes',()=>{
  const h=fresh();open(h);h.run('F.vote.yes=[];F.vote.no=[1,2];G.day=F.vote.expires');
  assert.equal(vote(h).ok,false);assert.equal(h.run('finishFedVote(F).gecti'),false);
  assert.equal(h.run('F.lastVote.abstain'),1);
});
check('Monthly automatic agenda cannot overwrite an unfinished vote',()=>{
  const h=fresh();open(h);h.run('F.nextVote=G.day-1;var tok=fedVoteToken(F.vote);fedTick()');
  assert.equal(h.run('fedVoteToken(F.vote)'),h.run('tok'));
});
check('Legacy basic vote remains usable',()=>{
  const h=fresh();h.run("F.vote={law:'savunma',yes:[1,2],no:[],done:false}");
  assert.equal(vote(h).gecti,true);assert.equal(h.run('!!F.laws.savunma'),true);
});
check('Legacy council-flag compatibility counts double weight once (catalog fixture)',()=>{
  const h=fresh();open(h);
  // This flag is absent from the active catalog. Exercise compatibility without
  // claiming that the player can currently select such a civic.
  h.run("CIVICS.__legacyCouncil={flag:'council'};G.p.civics=['__legacyCouncil'];F.vote.yes=[0,0];F.vote.no=[1,2]");
  assert.equal(h.run('fedVoteCounts(F).yes'),2);assert.equal(h.run('finishFedVote(F).gecti'),false);
});
check('Save/load keeps pending agenda, paid cost, and explicit vote',()=>{
  const h=fresh();open(h);h.run('F.vote.yes=[1,2];F.vote.no=[];var saved=serialize();var rng=RND_STATE');
  assert.equal(h.run('deserialize(saved)'),true);h.run('F=fedOf(801)');
  assert.equal(h.run('G.p.res.etk'),890);assert.equal(h.run('RND_STATE'),h.run('rng'));
  assert.deepEqual(data(h,'fedVoteCounts(F).waiting'),[0]);assert.equal(vote(h).gecti,true);
  h.run('var done=serialize();deserialize(done);F=fedOf(801)');assert.equal(h.run('F.lastVote.passed'),true);
});
check('Transaction rollback includes vote, resources, law and RNG on recalc failure',()=>{
  const h=fresh();open(h);h.run('F.vote.yes=[1,2];F.vote.no=[];var realRecalc=recalcMods;recalcMods=()=>{throw Error("injected")};');
  const before=h.run('serialize()'),rng=h.run('RND_STATE');assert.equal(vote(h).ok,false);
  assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
  h.run('recalcMods=realRecalc');assert.equal(vote(h).gecti,true);
});
check('AI vote failure rolls back proposal cost and consumed RNG',()=>{
  const h=fresh();h.run('var oldPersona=personaOf;personaOf=()=>{rnd();throw Error("AI fail")}');
  const before=h.run('serialize()'),rng=h.run('RND_STATE');assert.equal(open(h).ok,false);
  assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
check('Notification failure does not undo accepted law or duplicate payment',()=>{
  const h=fresh();h.run('UI.fedVote=()=>{throw Error("notice")};UI.alert=()=>{throw Error("alert")}');
  assert.equal(open(h).ok,true);h.run('F.vote.yes=[1,2];F.vote.no=[]');assert.equal(vote(h).ok,true);
  assert.equal(h.run('G.p.res.etk'),890);assert.equal(h.run('!!F.laws.bilimAgi'),true);
});
check('Research law raises real monthly income by exactly 12 percent',()=>{
  const h=fresh();h.run('recalcMods(G.p);var income=empireIncome(G.p).ara;F.laws.bilimAgi=true');
  assert.ok(h.run('income')>0);assert.ok(Math.abs(h.run('empireIncome(G.p).ara/income')-1.12)<1e-10);
  h.run('F.members=[1,2,3]');assert.ok(Math.abs(h.run('empireIncome(G.p).ara/income')-1)<1e-10);
});
check('Naval law adds a flat 15 capacity; repeated recalculation cannot stack',()=>{
  const h=fresh();h.run('recalcMods(G.p);var cap=G.p.cap;F.laws.ortakDon=true');
  for(let i=0;i<5;i++)h.run('recalcMods(G.p)');assert.equal(h.run('G.p.cap-cap'),15);
  h.run('G.p.ally={};for(const e of G.emps)delete e.ally[0];updateFederations()');assert.equal(h.run('G.p.cap'),h.run('cap'));
});
check('Federal fund receives 5 percent normally, 9 percent with naval law',()=>{
  for(const law of [false,true]){
    const h=fresh();h.run(`F.laws.ortakDon=${law};F.fund={ala:0,ene:0};
      for(const id of F.members){G.emps[id].inc={ala:100,ene:200};G.emps[id].res.ala=100;G.emps[id].res.ene=100;}
      fedFundTick()`);
    assert.equal(h.run('F.fund.ala'),law?27:15);assert.equal(h.run('F.fund.ene'),law?54:30);
    assert.equal(h.run('G.p.res.ala'),law?91:95);
  }
});
check('Fund contribution does not overdraw; exact stock can pay',()=>{
  const h=fresh();h.run('F.laws.ortakDon=true;F.fund={ala:0,ene:0};for(const id of F.members){G.emps[id].inc={ala:100,ene:100};G.emps[id].res.ala=8;G.emps[id].res.ene=9;}fedFundTick()');
  assert.equal(h.run('G.p.res.ala'),8);assert.equal(h.run('G.p.res.ene'),0);assert.equal(h.run('F.fund.ene'),27);
});
check('Free passage derives from membership and does not leak permission records',()=>{
  const h=fresh();h.run('F.laws.serbest=true;G.p.ally={};G.emps[1].passage={};var sys={owner:1};');
  assert.equal(h.run('canEnter(G.p,sys)'),true);h.run('F.members=[1,2,3]');
  assert.equal(h.run('canEnter(G.p,sys)'),false);assert.deepEqual(data(h,'G.emps[1].passage'),{});
});
check('Passing free movement never writes permanent bilateral passage',()=>{
  const h=fresh();open(h,'serbest');h.run('F.vote.yes=[1,2];F.vote.no=[];var passages=JSON.stringify(G.emps.map(e=>e.passage))');vote(h);
  assert.equal(h.run('JSON.stringify(G.emps.map(e=>e.passage))'),h.run('passages'));assert.equal(h.run('F.cohesion'),78);
});
check('Load income recalculation cannot deduct fund or replay law voting',()=>{
  const h=fresh();h.run('F.laws={bilimAgi:true,ortakDon:true};F.fund={ala:5,ene:6};economyTick(true);var snap=JSON.stringify(G.emps.map(e=>e.res));var rng=RND_STATE;');
  h.run('economyTick(true)');assert.equal(h.run('JSON.stringify(G.emps.map(e=>e.res))'),h.run('snap'));
  assert.deepEqual(data(h,'F.fund'),{ala:5,ene:6});assert.equal(h.run('RND_STATE'),h.run('rng'));
});
check('Real UI panel exposes proposals, reasons, tally and previous result',()=>{
  const h=fresh();h.run('UI.openFed()');let html=h.doc.getElementById('diploPane').innerHTML;
  assert.match(html,/fedLawPropose/);assert.match(html,/90 gün/);assert.match(html,/Üyelik ve yönetim/);assert.match(html,/Savaş Onayı/);
  h.run("UI.act('fedLawPropose','bilimAgi')");assert.equal(h.run('G.p.res.etk'),890);
  assert.match(h.doc.getElementById('diploPane').innerHTML,/Ağırlıklı oylar/);
});
check('Real modal callback captures old agenda identity',()=>{
  const h=fresh();open(h);const hooks={};h.sb.captureHook=(a,fn)=>hooks[a]=fn;
  h.run('UI._hook=captureHook;UI.fedVoteOpen(F.id)');assert.equal(typeof hooks.fedYes,'function');
  const stale=hooks.fedYes;h.run('F.vote.yes=[1,2];F.vote.no=[]');vote(h);open(h,'serbest');
  const before=data(h,'F.vote');stale();assert.deepEqual(data(h,'F.vote'),before);
});
check('Modal opened before loading cannot vote in the restored world',()=>{
  const h=fresh();open(h);const hooks={};h.sb.captureHook=(a,fn)=>hooks[a]=fn;
  h.run('UI._hook=captureHook;UI.fedVoteOpen(F.id);var saved=serialize();deserialize(saved);F=fedOf(801)');
  const before=data(h,'F.vote');hooks.fedYes();assert.deepEqual(data(h,'F.vote'),before);
});
check('New member receives naval law but cannot vote on an older agenda',()=>{
  const h=fresh();h.run('F.laws.ortakDon=true;recalcMods(G.emps[3]);var cap3=G.emps[3].cap');open(h);
  h.run('for(const id of F.members){G.emps[3].ally[id]=true;G.emps[id].ally[3]=true;}updateFederations()');
  assert.equal(h.run('G.emps[3].cap-cap3'),15);
  assert.equal(h.run('castFedVote(G.emps[3],F.id,fedVoteToken(F.vote),true).ok'),false);
});
check('Cohesion collapse removes naval capacity immediately',()=>{
  const h=fresh();h.run('recalcMods(G.p);var cap=G.p.cap;F.laws.ortakDon=true;recalcMods(G.p);F.cohesion=-100;cohesionTick()');
  assert.equal(h.run('findFed(G.p)'),null);assert.equal(h.run('G.p.cap'),h.run('cap'));
});
check('Real AI tick proposes once and respects player-pending agenda',()=>{
  const h=fresh();h.run('aiFedLawTick()');assert.equal(h.run('!!F.vote'),true);
  assert.deepEqual(data(h,'fedVoteCounts(F).waiting'),[0]);const before=h.run('serialize()'),rng=h.run('RND_STATE');
  h.run('aiFedLawTick()');assert.equal(h.run('serialize()'),before);assert.equal(h.run('RND_STATE'),rng);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
