'use strict';
const assert=require('assert/strict'),path=require('path');
const {fresh:fixture}=require('./helpers/dispatch-fixture');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const fresh=()=>fixture(0,root);let pass=0,fail=0;const eq=(a,b=true)=>assert.equal(a,b);
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
test('Legacy fleet rally action does not arm global yard rewriting',()=>{
 const h=fresh();h.run('G.sys[1].built.tersane=1;setRally(E,G.sys[1],4);var saved=serialize();UI.act("rallySet",String(A.id))');
 eq(h.run('View.rallyFor===undefined'));eq(h.run('G.sys[1].rally[0].sys'),4);eq(h.run('A.rallyAt===undefined'));
});
test('Retired map selection cannot rewrite any yard or fleet target',()=>{
 const h=fresh();h.run(`G.sys[1].built.tersane=1;setRally(E,G.sys[1],4);View.rallyFor=A.id;View.rowHits=[];View.route=false;
 View.cam={x:G.sys[5].x,y:G.sys[5].y,z:1};View.tap(View.w2s(G.sys[5].x,G.sys[5].y))`);
 eq(h.run('G.sys[1].rally[0].sys'),4);eq(h.run('G.sys[1].rally[0].fleet===undefined'));eq(h.run('A.rallyAt===undefined'));
});
test('Yard selection outranks fleet row hits and double tap and affects only chosen yard',()=>{
 const h=fresh();h.run(`setRally(E,G.sys[1],4);UI.act('rallySysSet','0');View.cam={x:G.sys[5].x,y:G.sys[5].y,z:1};
 var pt=View.w2s(G.sys[5].x,G.sys[5].y);View.rowHits=[{x:pt.x-20,y:pt.y-20,w:40,h:40,filolar:[A],sys:5}];
 View._lastTap=performance.now();View._lastPt=pt;View.tap(pt);`);
 eq(h.run('Y.rally[0].sys'),5);eq(h.run('G.sys[1].rally[0].sys'),4);eq(h.run('View.rallyForSys===undefined'));
 h.run('queueShip(E,Y,"kor");finish();var nf=G.fleets.find(f=>f!==A&&f!==B)');eq(h.run('nf.path[nf.path.length-1]'),5);eq(h.run('nf.joinFleet===undefined'));
});
test('Captured yard cannot be set or cleared through stale map selection or UI action',()=>{
 const h=fresh();h.run(`setRally(E,Y,4);UI.act('rallySysSet','0');Y.owner=O.id;View.cam={x:G.sys[5].x,y:G.sys[5].y,z:1};View.tap(View.w2s(G.sys[5].x,G.sys[5].y));UI.act('rallySysClear','0');`);
 eq(h.run('Y.rally[0].sys'),4);h.run('UI.act("rallySysSet","0")');eq(h.run('View.rallyForSys===undefined'));
});
test('Cancelling selection leaves old destination; clear uses canonical owner gate',()=>{
 const h=fresh();h.run('setRally(E,Y,4);UI.act("rallySysSet","0");UI.act("rallySysCancel");');eq(h.run('Y.rally[0].sys'),4);
 eq(h.run('View.rallyForSys===undefined'));h.run('UI.act("rallySysClear","0")');eq(h.run('Y.rally[0]===undefined'));
});
test('Private reinforcement ignores later general target edits and follows moving fleet',()=>{
 const h=fresh();h.run('setRally(E,Y,5);reinforceFleet(E,A);setRally(E,Y,4);orderMove(A,3);finish();var nf=G.fleets.find(f=>f.joinFleet===A.id)');
 eq(h.run('Y.rally[0].sys'),4);eq(h.run('nf.path[nf.path.length-1]'),3);h.run('sail()');eq(h.run('A.ships.length'),2);
});
test('Shared status separates queued and traveling ships without mutating game or RNG',()=>{
 const h=fresh();h.run('A.capTarget=4;reinforceFleet(E,A);var saved=serialize(),rng=RND_STATE;var status=fleetReinforcementStatus(E,A)');
 eq(h.run('status.queued'),3);eq(h.run('status.inTransit'),0);eq(h.run('status.missing'),0);eq(h.run('serialize()'),h.run('saved'));eq(h.run('RND_STATE'),h.run('rng'));
 h.run('finish();var status=fleetReinforcementStatus(E,A)');eq(h.run('status.queued'),2);eq(h.run('status.inTransit'),1);eq(h.run('status.missing'),0);
});
test('Real fleet panel shows pending counts and disables redundant order',()=>{
 const h=fresh();h.run('A.capTarget=3;reinforceFleet(E,A);View.sel=A;var html=UI.p_filo()');
 assert.match(h.run('html'),/Üretimde \/ sırada<\/span><b>2/);assert.match(h.run('html'),/Yeni sipariş gereken<\/span><b>0/);
 assert.match(h.run('html'),/disabled data-a="reinf"/);assert.doesNotMatch(h.run('html'),/data-a="rallySet"/);
 h.run('var res=JSON.stringify(E.res);UI.act("reinf",String(A.id))');eq(h.run('JSON.stringify(E.res)'),h.run('res'));eq(h.run('Y.queue.length'),2);
});
test('Locked class gives actual research reason with no stock or queue mutation',()=>{
 const h=fresh();h.run(`A.ships=[{c:'muh'},{c:'muh'},{c:'kor'}];A.capTarget=4;delete E.techs.m_muhrip;
 var before=JSON.stringify([E.res,Y.queue]);var r=reinforceFleet(E,A);View.sel=A;var html=UI.p_filo()`);
 eq(h.run('r.ok'),false);assert.match(h.run('r.why'),/Araştırma gerekli/);assert.match(h.run('html'),/Araştırma gerekli/);
 eq(h.run('JSON.stringify([E.res,Y.queue])'),h.run('before'));
 h.run('E.techs.m_muhrip=true;var r=reinforceFleet(E,A)');eq(h.run('r.ok'));eq(h.run('Y.queue[0].cls'),'muh');
});
test('Unavailable, sabotaged and unreachable yards have distinct reasons',()=>{
 for(const [cmd,why] of [['Y.planets[0].col.b.tersane=0',/kendi tersanen yok/],['Y.yardLock=99999',/sabotaj/],['Y.lanes=[]',/rota kapalı/]]){
 const h=fresh();h.run(cmd);h.run('var r=reinforceFleet(E,A)');eq(h.run('r.ok'),false);assert.match(h.run('r.why'),why);eq(h.run('Y.queue.length'),0);}
});
test('Partial purchase reports remaining shortage; genuine poverty is not mislabeled',()=>{
 const h=fresh();h.run(`A.capTarget=4;E.res.ala=shipCost(E,'kor').ala;var r=reinforceFleet(E,A)`);
 eq(h.run('r.ok'));eq(h.run('r.siparis'),1);eq(h.run('r.kalan'),2);
 h.run('var r=reinforceFleet(E,A)');eq(h.run('r.why'),'Kaynak yetersiz');
});
test('Legacy mixed target keeps fleet priority across save/load and labels it honestly',()=>{
 const h=fresh();h.run('Y.rally[0]={fleet:A.id,sys:5};A.rallyAt=5;queueShip(E,Y,"kor");var saved=serialize();deserialize(saved);var E=G.p,Y=G.sys[0],A=G.fleets.find(f=>f.name==="A"),B=G.fleets.find(f=>f.name==="B");View.selSys=Y;var html=UI.p_sistem();finish();var nf=G.fleets.find(f=>f.joinFleet===A.id)');
 eq(h.run('Y.rally[0].sys'),5);eq(h.run('nf.path[nf.path.length-1]'),2);assert.match(h.run('html'),/Eski filo hedefi korunuyor/);
 assert.match(h.run('html'),/Filo: A/);
});
test('Saved private deliveries retain each fleet and ordinary system destination',()=>{
 const h=fresh();h.run('setRally(E,Y,5);reinforceFleet(E,A);reinforceFleet(E,B);var before=JSON.stringify(Y.queue);var saved=serialize();deserialize(saved)');
 eq(h.run('JSON.stringify(G.sys[0].queue)'),h.run('before'));eq(h.run('G.sys[0].rally[0].sys'),5);
});
test('Civilian ships remain at yard despite military system rally',()=>{
 const h=fresh();h.run('setRally(E,Y,5);queueShip(E,Y,"bil");finish();var nf=G.fleets.find(f=>f.ships.some(s=>s.c==="bil"))');
 eq(h.run('nf.sys'),0);eq(h.run('nf.path.length'),0);
});
test('Foreign and stale fleets cannot order reinforcement or reveal a shared status',()=>{
 const h=fresh();h.run('var before=JSON.stringify(E.res);var result=fleetReinforcementStatus(E,{...A})');eq(h.run('result.ok'),false);
 h.run('A.e=O.id');eq(h.run('reinforceFleet(E,A).ok'),false);eq(h.run('JSON.stringify(E.res)'),h.run('before'));
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
