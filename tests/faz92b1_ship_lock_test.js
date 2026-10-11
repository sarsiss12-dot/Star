'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
function fresh(){const h=runtime();h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var P=G.p,S=G.sys.find(s=>s.owner===P.id&&hasYard(s));G.council=null;
 for(const e of G.emps){e.war={};e.res.ala=10000;e.res.min=10000;e.res.ene=10000;}
 G.fleets=[];for(const s of G.sys){s.queue=[];delete s.loopBuild;delete s.yardLock;}
 for(const k of ['m_muhrip','m_kruvazor','m_zirhli','m_yildiz'])delete P.techs[k];
 UI.refresh=()=>{};`);return h;}
const eq=(a,b=true)=>assert.equal(a,b);
test('All four technology locks reject direct orders with no state/RNG mutation',()=>{
 const h=fresh();const before=h.run('serialize()'),rng=h.run('RND_STATE');
 for(const c of ['muh','kru','zir','col_s'])eq(h.run(`queueShip(P,S,'${c}')`),false);
 eq(h.run('serialize()'),before);eq(h.run('RND_STATE'),rng);
});
test('Real UI ship action cannot bypass a locked class',()=>{
 const h=fresh();h.run("var cash=P.res.ala;UI.act('ship',S.id+':muh');UI.act('ship',S.id+':kru')");
 eq(h.run('S.queue.length'),0);eq(h.run('P.res.ala'),h.run('cash'));
});
test('Research unlock queues once and charges the actual class cost',()=>{
 for(const c of ['muh','kru','zir','col_s']){const h=fresh();
 h.run(`P.techs[SHIPS['${c}'].tech]=true;var cost=shipCost(P,'${c}'),cash=JSON.stringify(P.res)`);
 eq(h.run(`queueShip(P,S,'${c}')`));eq(h.run('S.queue.length'),1);
 eq(h.run('Object.keys(cost).every(k=>P.res[k]===JSON.parse(cash)[k]-cost[k])'));}
});
test('Basic military and civilian classes remain available',()=>{
 const h=fresh();for(const c of ['kor','bil','kol','ins','ord'])eq(h.run(`queueShip(P,S,'${c}')`));eq(h.run('S.queue.length'),5);
});
test('Invalid keys, actors and systems cannot throw or charge',()=>{
 const h=fresh(),before=h.run('serialize()');
 for(const c of ['MISSING','constructor','__proto__']){eq(h.run(`queueShip(P,S,'${c}')`),false);eq(h.run(`canBuildShip(P,'${c}')`),false);}
 eq(h.run("queueShip(null,S,'kor')"),false);eq(h.run("queueShip(P,null,'kor')"),false);
 eq(h.run("queueShip({...P},S,'kor')"),false);eq(h.run('serialize()'),before);
});
test('Insufficient funds and foreign yard still reject orders',()=>{
 const h=fresh();h.run('P.techs.m_muhrip=true;P.res.ala=0');eq(h.run("queueShip(P,S,'muh')"),false);
 h.run('P.res.ala=10000;S.owner=1');eq(h.run("queueShip(P,S,'muh')"),false);
});
test('AI direct production shares the same technology gate',()=>{
 const h=fresh();h.run('var A=G.emps[1];S.owner=A.id;delete A.techs.m_muhrip');
 eq(h.run("queueShip(A,S,'muh')"),false);h.run('A.techs.m_muhrip=true');eq(h.run("queueShip(A,S,'muh')"));
});
test('Continuous production cannot be configured to locked or foreign yard',()=>{
 const h=fresh();h.run("UI.act('loopSet',S.id+':muh')");assert.equal(h.run('S.loopBuild'),undefined);
 h.run("UI.act('loopSet',S.id+':kor')");eq(h.run('S.loopBuild'),'kor');
 h.run("delete S.loopBuild;S.owner=1;UI.act('loopSet',S.id+':kor')");assert.equal(h.run('S.loopBuild'),undefined);
});
test('Loaded locked automation pauses with reason then resumes on research',()=>{
 const h=fresh();h.run("S.loopBuild='muh';loopBuildTick()");eq(h.run('S.queue.length'),0);
 eq(h.run("loopBuildStatus(P,S).why.includes('Araştırma')"));
 h.run('P.techs.m_muhrip=true;loopBuildTick()');eq(h.run('S.queue.length'),1);
});
test('Fleet reinforcement orders cannot bypass class technology',()=>{
 const h=fresh();h.run("var f=newFleet(P,S.id,[{c:'muh'}]);var cash=P.res.ala");
 eq(h.run("queueFleetShip(P,S,'muh',f)"),false);eq(h.run('reinforceFleet(P,f).ok'),false);
 eq(h.run('S.queue.length'),0);eq(h.run('P.res.ala'),h.run('cash'));
});
test('Federal fund cannot bypass technology or crisis-only restriction',()=>{
 const h=fresh();h.run("G.feds=[{id:7,members:[0,1],leader:0,laws:{},fund:{ala:10000,ene:10000}}];var cash=G.feds[0].fund.ala");
 eq(h.run("buildFederalShip(P,S.id,'muh').ok"),false);
 eq(h.run("buildFederalShip(P,S.id,'swarm_drone').ok"),false);
 eq(h.run('G.feds[0].fund.ala'),h.run('cash'));eq(h.run('G.fleets.length'),0);
 h.run('P.techs.m_muhrip=true');eq(h.run("buildFederalShip(P,S.id,'muh').ok"));eq(h.run('G.fleets.length'),1);
});
test('Council prohibition is shared by personal and federal production',()=>{
 const h=fresh();h.run("P.techs.m_yildiz=true;G.council={members:[0],laws:{colYasak:true}};G.feds=[{id:7,members:[0],leader:0,fund:{ala:10000}}]");
 eq(h.run("queueShip(P,S,'col_s')"),false);eq(h.run("buildFederalShip(P,S.id,'col_s').ok"),false);
});
test('Crisis hulls remain restricted to crisis actors',()=>{
 const h=fresh();eq(h.run("queueShip(P,S,'swarm_drone')"),false);
 h.run('P.crisisSide=true');eq(h.run("queueShip(P,S,'swarm_drone')"));
});
test('Existing locked queue pauses without losing paid order or blocking basic hulls',()=>{
 const h=fresh();h.run("S.queue=[{cls:'muh',e:0,left:1,tot:44},{cls:'kor',e:0,left:1,tot:30}];var cash=P.res.ala;dailyTick(2)");
 eq(h.run('S.queue.length'),1);eq(h.run('S.queue[0].cls'),'muh');eq(h.run('S.queue[0].left'),1);
 eq(h.run("G.fleets.flatMap(f=>f.ships).filter(s=>s.c==='kor').length"),1);eq(h.run('P.res.ala'),h.run('cash'));
 h.run('P.techs.m_muhrip=true;dailyTick(2)');eq(h.run('S.queue.length'),0);
 eq(h.run("G.fleets.flatMap(f=>f.ships).filter(s=>s.c==='muh').length"),1);eq(h.run('P.res.ala'),h.run('cash'));
});
test('Even overdue locked orders cannot complete before research',()=>{
 const h=fresh();h.run("S.queue=[{cls:'kru',e:0,left:-1,tot:58}];dailyTick(2)");eq(h.run('S.queue.length'),1);eq(h.run('G.fleets.length'),0);
});
test('Sabotaged yard does not progress already queued orders',()=>{
 const h=fresh();h.run("queueShip(P,S,'kor');S.yardLock=G.memAge+2;var left=S.queue[0].left;dailyTick(2)");
 eq(h.run('S.queue[0].left'),h.run('left'));h.run('delete S.yardLock;dailyTick(2)');eq(h.run('S.queue[0].left'),h.run('left-2'));
});
test('Save/load keeps locked orders paused and does not debit again',()=>{
 const h=fresh();h.run("S.queue=[{cls:'muh',e:0,left:9,tot:44}];var sid=S.id,cash=P.res.ala;var save=serialize()");
 eq(h.run('deserialize(save)'));h.run('P=G.p;S=G.sys[sid];dailyTick(2)');
 eq(h.run('S.queue[0].left'),9);eq(h.run('P.res.ala'),h.run('cash'));
});
test('Setup physiology step has the same unadorned label format',()=>{
 const h=fresh();eq(h.run("STEPS.find(s=>s.k==='fizyo').n"),'FİZYOLOJİ');eq(h.run('STEPS.length'),7);
});
test('Actual ship panel disables locked buttons, filters loops and explains paused order',()=>{
 const h=fresh();h.run("View.selSys=S;S.queue=[{cls:'muh',e:0,left:9,tot:44}];var html=UI.p_sistem()");
 const html=h.run('html');
 assert.match(html, /<button[^>]*disabled[^>]*data-a="ship"[^>]*data-x="\d+:muh"/);
 assert.doesNotMatch(html, /data-a="loopSet"[^>]*data-x="\d+:(muh|kru|zir|col_s)"/);
 assert.match(html,/BEKLİYOR · Araştırma gerekli/);
 h.run('P.techs.m_muhrip=true;html=UI.p_sistem()');
 assert.match(h.run('html'), /data-a="loopSet"[^>]*data-x="\d+:muh"/);
 assert.doesNotMatch(h.run('html'), /<button[^>]*disabled[^>]*data-a="ship"[^>]*data-x="\d+:muh"/);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
