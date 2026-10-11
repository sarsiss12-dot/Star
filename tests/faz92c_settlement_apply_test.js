'use strict';
const assert=require('assert/strict'),path=require('path'),fs=require('fs');
const {runtime}=require('./helpers/runtime');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(colonies=false){const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.feds=[];G.council=null;G.fleets=[];
 for(const e of G.emps){e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;
 for(const o of G.emps)e.contact[o.id]=true;}
 for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
 var P=G.p,T=G.emps[2],M=G.emps[3];
 var land=G.sys.filter(s=>!s.planets.some(p=>p.col)&&s.planets.length>=2).slice(0,4);
 var template=JSON.parse(JSON.stringify(G.sys[P.colonies[0].s].planets[P.colonies[0].p].col));
 declareWar(P,T);executeDeal({from:3,to:0,give:[{t:'warOn',target:2}],want:[]});`);
 if(colonies)h.run(`for(const i of [0,2]){const s=land[i],p=s.planets[0];p.col=JSON.parse(JSON.stringify(template));p.owner=2;T.colonies.push({s:s.id,p:p.i});}`);
 h.run(`land.forEach((s,i)=>{s.owner=2;captureSystem(s,i<2?0:3)});
 var campaign=warLedgerFind(0,2).campaign;makePeace(P,T);
 UI.refresh=()=>{};var q=settlementPreview(P,campaign);`);
 return h;}
function approve(h,who='P',assignment='Object.fromEntries(q.rows.map(r=>[r.key,r.from===0?3:0]))'){
 const r=h.run(`var q=settlementPreview(${who},campaign);var submitted=settlementSubmit(${who},campaign,q.stamp,${assignment});submitted`);
 eq(r.ok);if(r.state==='pending')eq(h.run('settlementVote(P,submitted.id,true).ok'));
 eq(h.run('settlementOffer(submitted.id).state'),'approved');h.run('var O=settlementOffer(submitted.id)');
}
test('Real coalition empty systems transfer exactly once with no resource/RNG/fleet cost',()=>{
 const h=fresh();approve(h);h.run('var beforeRes=JSON.stringify(G.emps.map(e=>e.res)),rng=RND_STATE,ships=JSON.stringify(G.fleets),ledger=JSON.stringify(G.warLedger)');
 eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('land.map(s=>s.owner).join()'),'3,3,0,0');eq(h.run('O.state'),'applied');
 eq(h.run('JSON.stringify(G.emps.map(e=>e.res))'),h.run('beforeRes'));eq(h.run('RND_STATE'),h.run('rng'));
 eq(h.run('JSON.stringify(G.fleets)'),h.run('ships'));eq(h.run('JSON.stringify(G.warLedger)'),h.run('ledger'));
 h.run('var saved=serialize()');eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('saved'));
});
test('Application quote is pure; pending/rejected/withdrawn/expired are rejected',()=>{
 for(const state of ['pending','rejected','withdrawn','expired']){const h=fresh();approve(h);h.run(`O.state='${state}';var before=serialize(),r=RND_STATE`);
 eq(h.run('settlementApplyQuote(P,O.id).ok'),false);eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('before'));eq(h.run('RND_STATE'),h.run('r'));}
});
test('Only a current living participant can apply',()=>{
 const h=fresh();approve(h);eq(h.run('settlementApply(G.emps[4],O.id).ok'),false);eq(h.run('settlementApply({...P},O.id).ok'),false);
 eq(h.run('settlementApply(null,O.id).ok'),false);eq(h.run('settlementApply(M,O.id).ok'));
});
test('Unknown land prevents application without changing accepted offer',()=>{
 const h=fresh();approve(h);h.run('land[2].seen=[];var saved=serialize()');eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('saved'));
});
test('Mixed system moves selected colony only, preserving foreign colony, orbit and fleets',()=>{
 const h=fresh(true);h.run(`var foreign=land[0].planets[1];foreign.col=JSON.parse(JSON.stringify(template));foreign.owner=4;
 G.emps[4].colonies.push({s:land[0].id,p:foreign.i});var foreignState=JSON.stringify(foreign);
 var fl=newFleet(P,land[0].id,[{c:'kor'}]),fleetState=JSON.stringify(fl);`);approve(h);
 h.run('var colony=land[0].planets[0].col,oldPop=colony.pop,oldB=JSON.stringify(colony.b),oldStab=colony.stab,oldHist=JSON.stringify(colony.hist)');
 eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('land[0].planets[0].owner'),3);eq(h.run('land[0].owner'),0);
 eq(h.run('land[2].planets[0].owner'),0);eq(h.run('land[2].owner'),3);
 eq(h.run('JSON.stringify(foreign)'),h.run('foreignState'));eq(h.run('JSON.stringify(fl)'),h.run('fleetState'));
 eq(h.run('land[0].planets[0].col===colony'));eq(h.run('colony.pop'),h.run('oldPop'));eq(h.run('colony.stab'),h.run('oldStab'));eq(h.run('JSON.stringify(colony.b)'),h.run('oldB'));
 eq(h.run('JSON.stringify(colony.hist)'),h.run('oldHist'));
 eq(h.run('M.colonies.filter(c=>c.s===land[0].id&&c.p===0).length'),1);eq(h.run('P.colonies.filter(c=>c.s===land[0].id&&c.p===0).length'),0);
});
test('Governors remain with former empire; automation stops; capital relocates safely',()=>{
 const h=fresh(true);h.run(`var p=land[0].planets[0];P.leaders=[{id:998,tip:'vali',post:land[0].id+':0'}];p.col.leader=998;p.col.auto=true;P.home=land[0].id;`);approve(h);
 eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('P.leaders.length'),1);assert.equal(h.run('P.leaders[0].post'),undefined);
 assert.equal(h.run('p.col.leader'),undefined);eq(h.run('p.col.auto'),false);eq(h.run('P.colonies.some(c=>c.s===P.home)'));
});
test('Last-colony surrender rejected before mutations',()=>{
 const h=fresh(true);h.run(`for(const c of P.colonies.slice()){if(c.s===land[0].id)continue;const p=G.sys[c.s].planets[c.p];territoryOwnerSet(p,4);G.emps[4].colonies.push(c);}
 P.colonies=P.colonies.filter(c=>c.s===land[0].id);`);
 approve(h,'P','Object.fromEntries(q.rows.map(r=>[r.key,3]))');h.run('var saved=serialize()');
 eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('saved'));eq(h.run('P.dead'),false);
});
test('Ownership away and back invalidates consent, including direct non-war writer',()=>{
 const h=fresh();approve(h);h.run('territoryOwnerSet(land[0],4);territoryOwnerSet(land[0],0)');eq(h.run('settlementApply(P,O.id).ok'),false);
});
test('Foreign colony owner change in same system invalidates the agreed footprint',()=>{
 const h=fresh(true);approve(h);h.run('territoryOwnerSet(land[0].planets[1],4)');eq(h.run('settlementApply(P,O.id).ok'),false);
});
test('Renewed war, death, membership change and expiry invalidate approval',()=>{
 for(const cmd of ['P.war[2]=true','M.dead=true','M.overlord=4','G.day+=180']){const h=fresh();approve(h);h.run(cmd);eq(h.run('settlementApply(P,O.id).ok'),false);}
});
test('Edited recipient or recomputed rows cannot reuse existing consent',()=>{
 const h=fresh();approve(h);h.run('var n=settlementPreview(P,campaign);O.rows=n.rows;O.shares=n.shares');eq(h.run('settlementApply(P,O.id).ok'),false);
});
test('Duplicate or missing unanimous votes cannot authorize transfer',()=>{
 for(const cmd of ['O.votes.pop()','O.votes[1].by=O.votes[0].by','O.votes[1].yes=false']){const h=fresh();approve(h);h.run(cmd);eq(h.run('settlementApply(P,O.id).ok'),false);}
});
test('Malformed colony index and occupied empty-system queue reject without mutation',()=>{
 const h=fresh(true);approve(h);h.run('P.colonies.push({s:land[0].id,p:0});var saved=serialize()');eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('saved'));
 const x=fresh();approve(x);x.run("land[0].queue.push({e:0,cls:'kor',left:1,tot:1});var saved=serialize()");eq(x.run('settlementApply(P,O.id).ok'),false);eq(x.run('serialize()'),x.run('saved'));
});
for(const stage of ['before:apply','first:asset','after:items','after:recalc','after:receipt','after:log','son'])
 test('Injected '+stage+' restores world, aliases, governor, RNG and suppresses presentation',()=>{
  const h=fresh(true);h.run(`P.leaders=[{id:998,tip:'vali',post:land[0].id+':0'}];land[0].planets[0].col.leader=998;`);approve(h);
  h.run(`var sysRef=land[0],colRef=land[0].planets[0].col,arrayRef=P.colonies,offerRef=O,playerRef=P,leaderRef=P.leaders[0],before=serialize(),rng=RND_STATE,alerts=0;
  UI.alert=()=>{alerts++};G._dealAuth='prior';G._settlementFailInject=s=>{if(s===${JSON.stringify(stage)}||(${JSON.stringify(stage)}==='first:asset'&&s===('after:'+O.rows[0].key))){rnd();throw Error('injected')}};`);
  eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('serialize()'),h.run('before'));eq(h.run('RND_STATE'),h.run('rng'));
  eq(h.run('P===playerRef&&P.colonies===arrayRef&&O===offerRef&&land[0]===sysRef&&sysRef.planets[0].col===colRef&&P.leaders[0]===leaderRef'));
  eq(h.run('alerts'),0);eq(h.run('G._dealAuth'),'prior');eq(h.run('_dealTxActive'),false);
  h.run('delete G._settlementFailInject');eq(h.run('settlementApply(P,O.id).ok'));
 });
test('Nested deal/apply cannot execute inside transfer transaction',()=>{
 const h=fresh();approve(h);h.run("var nested;G._settlementFailInject=s=>{if(s==='before:apply')nested=settlementApply(P,O.id)}");eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('nested.ok'),false);
});
test('Presentation exceptions after commit cannot turn success into retry or duplicate logs',()=>{
 const h=fresh();approve(h);h.run("var oldLogs=G.log.length;UI.alert=()=>{throw Error('alert')};UI.refresh=()=>{throw Error('refresh')};AUDIO.forLog=()=>{throw Error('audio')}");
 eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('O.state'),'applied');h.run('var log=JSON.stringify(G.log)');eq(h.run('settlementApply(P,O.id).ok'),false);eq(h.run('JSON.stringify(G.log)'),h.run('log'));
});
test('Approved save loads with identical consent and applies; receipt survives reload without replay',()=>{
 const h=fresh(true);approve(h);h.run('var id=O.id;var save=serialize()');eq(h.run('deserialize(save)'));eq(h.run('settlementApply(G.p,id).ok'));
 h.run('var owners=JSON.stringify(G.sys.map(s=>[s.owner,s.planets.map(p=>p.owner)])),receipt=JSON.stringify(settlementOffer(id).receipt);save=serialize()');
 eq(h.run('deserialize(save)'));eq(h.run('settlementOffer(id).state'),'applied');eq(h.run('JSON.stringify(settlementOffer(id).receipt)'),h.run('receipt'));
 eq(h.run('settlementApply(G.p,id).ok'),false);eq(h.run('JSON.stringify(G.sys.map(s=>[s.owner,s.planets.map(p=>p.owner)]))'),h.run('owners'));
});
test('Broken receipt fails load atomically; later ownership changes do not erase valid history',()=>{
 const h=fresh();approve(h);eq(h.run('settlementApply(P,O.id).ok'));h.run('territoryOwnerSet(land[0],4);var saved=serialize(),d=JSON.parse(saved);d.settlements.offers[0].receipt.transfers=[]');
 eq(h.run('deserialize(JSON.stringify(d))'),false);eq(h.run('serialize()'),h.run('saved'));eq(h.run('deserialize(saved)'));eq(h.run('settlementOffer(1).state'),'applied');
});
test('Old 92B approval without bound terms becomes invalid, never auto-applied',()=>{
 const h=fresh();approve(h);h.run('var d=JSON.parse(serialize());delete d.settlements.offers[0].terms');eq(h.run('deserialize(JSON.stringify(d))'));
 eq(h.run('settlementOffer(1).state'),'invalid');eq(h.run('land.map(s=>s.owner).join()'),'0,0,3,3');
});
test('Applied campaign cannot submit a second proposal, including no-op distribution',()=>{
 const h=fresh();approve(h,'P','null');eq(h.run('settlementApply(P,O.id).ok'));eq(h.run('O.receipt.transfers.length'),0);
 eq(h.run('settlementSubmit(P,campaign,settlementPreview(P,campaign).stamp).ok'),false);
});
test('Real UI apply action works; old callback after load has no effect',()=>{
 const h=fresh();approve(h);h.run('UI.openSettlement(campaign);var cb=UI._hooks.shareApply,save=serialize();deserialize(save);cb()');eq(h.run('settlementOffer(1).state'),'approved');
 h.run('UI.openSettlement(campaign);UI._hooks.shareApply()');eq(h.run('settlementOffer(1).state'),'applied');
 h.run('var shown="";UI.openModal=s=>{shown=s};UI.openSettlement(campaign)');eq(h.run('shown.includes("Paylaşım uygulandı")'));assert.doesNotMatch(h.run('shown'),/data-a="shareApply"/);
});
test('Production ownership assignment audit has only the canonical setter',()=>{
 for(const file of ['main.js','economy.js','diplomacy.js','combat.js','ai.js','ui.js']){
 const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8');const matches=text.match(/\b\w+(?:\.\w+)*\.owner\s*=(?!=)[^;\n]+;/g)||[];
 assert.deepEqual(matches,file==='main.js'?['place.owner = owner;']:[]);}
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
