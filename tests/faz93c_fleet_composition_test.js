'use strict';
const assert=require('assert/strict');
const {fresh}=require('./helpers/dispatch-fixture');
let pass=0,fail=0;const eq=(a,b=true)=>assert.equal(a,b);
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
function setup(actor=0){const h=fresh(actor);h.run(`E.techs.m_muhrip=true;E.techs.m_kruvazor=true;E.techs.m_zirhli=true;
function yard(id,slots=1){var s=G.sys[id];s.planets[0].col=JSON.parse(JSON.stringify(template));s.planets[0].col.b.tersane=slots;return s;}
function tpl(counts,auto=false){return setFleetTemplate(E,A,counts,auto);}`);return h;}
test('mixed 15/10/5 targets buy exact classes, no second charge',()=>{
 const h=setup();h.run('tpl({kor:15,muh:10,kru:5});var r=reinforceFleet(E,A),stock=JSON.stringify(E.res),r2=reinforceFleet(E,A),s=fleetCompositionStatus(E,A)');
 eq(h.run('r.siparis'),29);eq(h.run('Y.queue.filter(q=>q.cls==="kor").length'),14);eq(h.run('Y.queue.filter(q=>q.cls==="muh").length'),10);eq(h.run('Y.queue.filter(q=>q.cls==="kru").length'),5);eq(h.run('s.missing'),0);eq(h.run('r2.ok'),false);eq(h.run('JSON.stringify(E.res)===stock'));
});
test('wrong-class surplus cannot mask a missing class',()=>{
 const h=setup();h.run('A.ships=Array.from({length:8},()=>({c:"kor",h:1}));tpl({kor:2,muh:3});reinforceFleet(E,A);var s=fleetCompositionStatus(E,A)');eq(h.run('s.rows.find(r=>r.cls==="kor").excess'),6);eq(h.run('Y.queue.length'),3);eq(h.run('Y.queue.every(q=>q.cls==="muh")'));
});
test('casualty is replaced in its class after genuine delivery',()=>{
 const h=setup();h.run('tpl({kor:1,muh:1});reinforceFleet(E,A);finish();sail();A.ships=A.ships.filter(s=>s.c!=="muh");var r=reinforceFleet(E,A)');eq(h.run('r.siparis'),1);eq(h.run('Y.queue[0].cls'),'muh');
});
test('queue, moving and blocked counts stay separate per class',()=>{
 const h=setup();h.run('tpl({kor:2,muh:2});reinforceFleet(E,A);finish();G.sys[1].owner=O.id;stepFleets(.1);var s=fleetCompositionStatus(E,A)');eq(h.run('s.queued'),2);eq(h.run('s.inTransit'),1);eq(h.run('s.waiting'),1);eq(h.run('s.missing'),0);
});
test('lower target preserves paid jobs and shows surplus',()=>{
 const h=setup();h.run('tpl({kor:4});reinforceFleet(E,A);var before=JSON.stringify([E.res,Y.queue]);tpl({kor:1});var s=fleetCompositionStatus(E,A);reinforceFleet(E,A)');eq(h.run('s.excess'),3);eq(h.run('JSON.stringify([E.res,Y.queue])===before'));
});
test('template save is pure with respect to money, orders and RNG',()=>{
 const h=setup();h.run('var before=JSON.stringify([E.res,Y.queue,RND_STATE]);tpl({kor:10,muh:5},true)');eq(h.run('JSON.stringify([E.res,Y.queue,RND_STATE])===before'));
});
test('status query does not mutate save or RNG',()=>{
 const h=setup();h.run('tpl({kor:3,muh:1});var before=serialize(),rng=RND_STATE;fleetCompositionStatus(E,A);fleetReinforcementStatus(E,A)');eq(h.run('serialize()===before&&RND_STATE===rng'));
});
test('invalid, fractional, enormous, unknown and civilian targets are rejected',()=>{
 const h=setup();for(const v of ['{kor:-1}','{kor:1.5}','{kor:NaN}','{kor:Infinity}','{kor:301}','{bogus:1}','{bil:2}','[]'])eq(h.run(`tpl(${v}).ok`),false);eq(h.run('A.composition===undefined'));
});
test('zero targets disable purchases, without deleting current ships',()=>{
 const h=setup();h.run('tpl({kor:0});var s=fleetCompositionStatus(E,A)');eq(h.run('s.missing'),0);eq(h.run('s.excess'),1);eq(h.run('reinforceFleet(E,A).ok'),false);eq(h.run('A.ships.length'),1);
});
test('foreign, stale, federal and delivery fleets cannot receive templates',()=>{
 const h=setup();eq(h.run('setFleetTemplate(O,A,{kor:3},true).ok'),false);eq(h.run('setFleetTemplate(E,{...A},{kor:3},true).ok'),false);
 h.run('A.federal=1');eq(h.run('tpl({kor:3}).ok'),false);h.run('delete A.federal;A.joinFleet=B.id');eq(h.run('tpl({kor:3}).ok'),false);
});
test('locked classes remain planned but cannot consume money',()=>{
 const h=setup();h.run('delete E.techs.m_muhrip;tpl({kor:2,muh:3});var r=reinforceFleet(E,A)');eq(h.run('r.siparis'),1);eq(h.run('Y.queue[0].cls'),'kor');eq(h.run('fleetCompositionStatus(E,A).missing'),3);h.run('E.techs.m_muhrip=true');eq(h.run('reinforceFleet(E,A).siparis'),3);
});
test('captured yard orders do not hide replacement deficit',()=>{
 const h=setup();h.run('tpl({kor:3});reinforceFleet(E,A);Y.owner=O.id;yard(5);var s=fleetCompositionStatus(E,A),r=reinforceFleet(E,A)');eq(h.run('s.queued'),0);eq(h.run('r.siparis'),2);
});
test('unlocked pending legacy rally jobs also count by class',()=>{
 const h=setup();h.run('Y.rally[E.id]={fleet:A.id};queueShip(E,Y,"muh");tpl({kor:1,muh:1});var s=fleetCompositionStatus(E,A)');eq(h.run('s.queued'),1);eq(h.run('s.missing'),0);
});
test('far empty yard beats nearer overloaded yard',()=>{
 const h=setup();h.run('var Z=yard(5);for(let i=0;i<4;i++)queueShip(E,Y,"kru");tpl({kor:2});var r=reinforceFleet(E,A)');eq(h.run('r.orders[0].sys'),5);eq(h.run('r.orders[0].wait'),0);
});
test('travel time beats straight line distance',()=>{
 const h=setup();h.run('var Z=yard(5);G.sys[1].x=10000;link(5,2);tpl({kor:2});var r=reinforceFleet(E,A)');eq(h.run('r.orders[0].sys'),5);
});
test('parallel slots and partially complete orders are accounted',()=>{
 const h=setup();h.run('Y.planets[0].col.b.tersane=2;queueShip(E,Y,"kor");queueShip(E,Y,"kor");Y.queue[0].left=2;Y.queue[1].left=10;tpl({kor:3});var r=reinforceFleet(E,A)');eq(h.run('r.orders[0].wait'),2);eq(h.run('r.orders[1].wait'),10);
});
test('batch reservations distribute to earliest available yards',()=>{
 const h=setup();h.run('yard(5);tpl({kor:5});var r=reinforceFleet(E,A)');eq(h.run('Y.queue.length'),2);eq(h.run('G.sys[5].queue.length'),2);eq(h.run('r.orders[2].wait>0'));
});
test('locked legacy queue jobs do not occupy active slots',()=>{
 const h=setup();h.run('queueShip(E,Y,"muh");delete E.techs.m_muhrip;tpl({kor:2});var r=reinforceFleet(E,A)');eq(h.run('r.orders[0].wait'),0);
});
test('build speed and hull size match production duration',()=>{
 const h=setup();h.run('E.mods.buildMul=.5;E.mods.shipSpeed=0;E.mods.militaryBuildMul=0;tpl({kor:1,kru:1});var r=reinforceFleet(E,A)');eq(h.run('r.orders[0].build'),h.run('Y.queue[0].tot'));eq(h.run('r.orders[0].build'),39);
});
test('sabotaged yards excluded without charge',()=>{
 const h=setup();h.run('Y.yardLock=99999;tpl({kor:2});var res=JSON.stringify(E.res),r=reinforceFleet(E,A)');eq(h.run('r.ok'),false);eq(h.run('JSON.stringify(E.res)===res'));
});
test('closed route detour is actually dispatched',()=>{
 const h=setup();h.run('G.sys[1].owner=O.id;link(0,5);tpl({kor:2});reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f.joinFleet===A.id)');eq(h.run('N.path[0]'),5);eq(h.run('N.path.includes(1)'),false);eq(h.run('N.shipment.safe'));
});
test('enemy territory is avoided even though ordinary war fleets may enter',()=>{
 const h=setup();h.run('G.sys[1].owner=O.id;E.war[O.id]=true;O.war[E.id]=true;link(0,5);tpl({kor:2});reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f.joinFleet===A.id)');eq(h.run('N.path[0]'),5);
});
test('visible hostile fleet causes safe detour; hidden one does not leak',()=>{
 const h=setup();h.run('E.war[O.id]=true;newFleet(O,1,[{c:"kor"}]);G.vis=new Set([1]);G._shareVisSet=null;link(0,5);var route=reinforcementRoute(E,A,0,2)');eq(h.run('route[0]'),5);
 h.run('G.vis=new Set();var route=reinforcementRoute(E,A,0,2)');eq(h.run('route[0]'),1);
});
test('threat entering next leg stops safely and keeps delivery count',()=>{
 const h=setup();h.run('tpl({kor:2});reinforceFleet(E,A);finish();E.war[O.id]=true;newFleet(O,1,[{c:"kor"}]);G.vis=new Set([1]);stepFleets(.01);var N=G.fleets.find(f=>f.joinFleet===A.id)');eq(h.run('N.sys'),0);eq(h.run('N.shipment.state'),'blocked');eq(h.run('fleetCompositionStatus(E,A).missing'),0);
});
test('gate shortcut reduces delivery ETA and is followed',()=>{
 const h=setup();h.run('Y.built.kapi=1;G.sys[2].built.kapi=1;tpl({kor:2});var r=reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f.joinFleet===A.id)');eq(h.run('r.orders[0].travel<.01'));eq(h.run('N.path[0]'),2);h.run('sail()');eq(h.run('A.ships.length'),2);
});
test('nebula route timing respects slower movement',()=>{
 const h=setup();h.run('var t=reinforcementRoutes(E,[{c:"kor"}],2).eta[0];G.sys[1].nebulaS=true;var slow=reinforcementRoutes(E,[{c:"kor"}],2).eta[0]');eq(h.run('slow>t'));
});
test('planner shares one graph per class across yards and every order',()=>{
 const h=setup();h.run('yard(3);yard(5);tpl({kor:15,muh:10,kru:5});var n=0,orig=reinforcementRoutes;reinforcementRoutes=function(...a){n++;return orig(...a)};reinforceFleet(E,A)');eq(h.run('n'),3);
});
test('target movement, blocked retry and death retain 93B behavior',()=>{
 const h=setup();h.run('tpl({kor:2});reinforceFleet(E,A);orderMove(A,3);finish();var N=G.fleets.find(f=>f.joinFleet===A.id)');eq(h.run('N.path.at(-1)'),3);h.run('A.ships=[];stepFleets(.01)');eq(h.run('N.shipment.state'),'lost');eq(h.run('N.ships.length'),1);
});
test('cancel and retarget free only the proper class deficit',()=>{
 const h=setup();h.run('tpl({kor:1,muh:1});reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f.joinFleet===A.id);shipmentAction(E,N,"retarget",{fleet:B.id});var s=fleetCompositionStatus(E,A)');eq(h.run('s.rows.find(r=>r.cls==="muh").missing'),1);eq(h.run('N.shipment.safe'));
});
test('save v8 preserves composition, auto, deadline and safe delivery',()=>{
 const h=setup();h.run('tpl({kor:3,muh:1},true);A.composition.next=G.day+4;reinforceFleet(E,A);finish();var id=A.id,t=JSON.stringify(A.composition),saved=serialize();deserialize(saved);A=G.fleets.find(f=>f.id===id)');eq(h.run('JSON.parse(saved).v'),8);eq(h.run('JSON.stringify(A.composition)===t'));eq(h.run('G.fleets.some(f=>f.shipment&&f.shipment.safe)'));
});
test('legacy save does not invent a template or turn auto on',()=>{
 const h=setup();h.run('var id=A.id;deserialize(serialize());A=G.fleets.find(f=>f.id===id)');eq(h.run('A.composition===undefined'));eq(h.run('fleetReinforcementStatus(G.p,A).target'),2);
});
test('corrupt template is dropped and deadline bounded without RNG consumption',()=>{
 const h=setup();h.run('A.composition={counts:{kor:9999},auto:true};var id=A.id,rng=RND_STATE;deserialize(serialize());A=G.fleets.find(f=>f.id===id)');eq(h.run('A.composition===undefined'));eq(h.run('RND_STATE===rng'));
});
test('auto disabled never buys, on buys once then counts pipeline',()=>{
 const h=setup();h.run('tpl({kor:3});fleetAutoReinforceTick()');eq(h.run('Y.queue.length'),0);h.run('tpl({kor:3},true);G.day++;fleetAutoReinforceTick();var stock=JSON.stringify(E.res);G.day+=5;fleetAutoReinforceTick()');eq(h.run('Y.queue.length'),2);eq(h.run('JSON.stringify(E.res)===stock'));
});
test('automatic purchase budget and per-day throttle are bounded',()=>{
 const h=setup();h.run('tpl({kor:20},true);fleetAutoReinforceTick();for(let i=0;i<200;i++)fleetAutoReinforceTick()');eq(h.run('Y.queue.length'),4);h.run('G.day+=5;fleetAutoReinforceTick()');eq(h.run('Y.queue.length'),8);
});
test('automatic next deadline survives load; no free retry burst',()=>{
 const h=setup();h.run('tpl({kor:20},true);fleetAutoReinforceTick();var saved=serialize();deserialize(saved);fleetAutoReinforceTick()');eq(h.run('G.sys[0].queue.length'),4);
});
test('auto respects low resources and capacity while explicit order stays possible',()=>{
 const h=setup();h.run('tpl({kor:3},true);E.res.ala=400;fleetAutoReinforceTick()');eq(h.run('Y.queue.length'),0);eq(h.run('reinforceFleet(E,A).siparis'),2);
});
test('auto off preserves already-paid orders',()=>{
 const h=setup();h.run('tpl({kor:10},true);fleetAutoReinforceTick();tpl({kor:10},false);var before=JSON.stringify([E.res,Y.queue]);G.day+=6;fleetAutoReinforceTick()');eq(h.run('JSON.stringify([E.res,Y.queue])===before'));
});
test('large manual requests are bounded then continue without duplicates',()=>{
 const h=setup();h.run('tpl({kor:70});var r=reinforceFleet(E,A),r2=reinforceFleet(E,A),r3=reinforceFleet(E,A)');eq(h.run('r.siparis'),30);eq(h.run('r2.siparis'),30);eq(h.run('r3.siparis'),9);eq(h.run('fleetCompositionStatus(E,A).missing'),0);
});
test('AI uses mixed template deficit rather than arbitrary chosen class',()=>{
 const h=setup(1);h.run('tpl({kor:1,muh:2},true);var ok=aiQueueMilitaryShip(E,Y,"kor")');eq(h.run('ok'));eq(h.run('Y.queue.length'),1);eq(h.run('Y.queue[0].cls'),'muh');eq(h.run('Y.queue[0].delivery.fleet'),h.run('A.id'));
});
test('AI chooses empty distant yard and preserves its strategic reserve',()=>{
 const h=setup(1);h.run('yard(5);for(let i=0;i<4;i++)queueShip(E,Y,"kru");tpl({kor:1,muh:2},true);aiQueueMilitaryShip(E,Y,"kor")');eq(h.run('G.sys[5].queue[0].cls'),'muh');
 h.run('E.megaReserve=E.res.ala;var before=JSON.stringify(E.res),ok=aiQueueMilitaryShip(E,Y,"kor")');eq(h.run('ok'),false);eq(h.run('JSON.stringify(E.res)===before'));
});
test('AI does not merge away a template or pending target',()=>{
 const h=setup(1);h.run('A.sys=B.sys=0;tpl({kor:3},true);B.composition={counts:{kor:1},auto:false,next:G.day};aiTurn(E)');eq(h.run('G.fleets.includes(A)&&G.fleets.includes(B)'));
});
test('ordinary local production does not silently overfill template fleet',()=>{
 const h=setup();h.run('A.sys=0;tpl({kor:1});queueShip(E,Y,"kor");finish()');eq(h.run('A.ships.length'),1);
});
test('real UI opens, saves values, preserves pause and rejects stale token',()=>{
 const h=setup();h.run('G.speed=0;UI.fleetCompositionMenu(A);var token=UI._compositionPending.token;for(const c of fleetTemplateClasses())$("fc-"+c).value="0";$("fc-kor").value="15";$("fc-muh").value="10";$("fc-kru").value="5";$("fc-auto").checked=true;UI.act("compositionSave",String(token));UI.act("compositionSave",String(token));');eq(h.run('A.composition.counts.muh'),10);eq(h.run('A.composition.auto'));eq(h.run('G.speed'),0);eq(h.run('Y.queue.length'),0);
});
test('UI cancel leaves template and paused game unchanged',()=>{
 const h=setup();h.run('tpl({kor:3});var before=JSON.stringify(A.composition);G.speed=0;UI.fleetCompositionMenu(A);UI.closeModal()');eq(h.run('JSON.stringify(A.composition)===before'));eq(h.run('G.speed'),0);
});
test('UI old world or removed fleet cannot save new template',()=>{
 const h=setup();h.run('UI.fleetCompositionMenu(A);var token=UI._compositionPending.token;deserialize(serialize());UI.act("compositionSave",String(token))');eq(h.run('G.fleets.every(f=>!f.composition)'));
});
test('panel shows class shortage, surplus, toggle and delivery estimate',()=>{
 const h=setup();h.run('tpl({kor:3,muh:1});View.sel=A;UI.act("reinf",String(A.id));var html=UI.p_filo()');for(const str of ['SINIF BAZLI BİLEŞİM','Muhrip','Eksik: 0','OTOMATİK TAKVİYE: KAPALI','SON TAKVİYE PLANI'])eq(h.run(`html.includes(${JSON.stringify(str)})`));
});
test('monthly AI can use free yard when sampled yard is full and Colossus tech unlocked',()=>{
 const h=setup(1);h.run(`yard(5);E.techs.m_yildiz=true;E.inc.ene=100;E.cap=300;E.megaReserve=E.colossusReserve=0;
 for(let i=0;i<2;i++)newFleet(E,0,[{c:'bil'}]);for(let i=0;i<5;i++)newFleet(E,0,[{c:'ord'}]);
 for(let i=0;i<4;i++)queueShip(E,Y,'kor');tpl({kor:1,muh:2},true);
 colonizeTargets=()=>[];rnd=()=>.01;var calls=0,oldMilitary=aiQueueMilitaryShip;
 aiQueueMilitaryShip=function(...a){calls++;return oldMilitary(...a)};aiTurn(E);`);
 eq(h.run('calls>=1&&calls<=4'));eq(h.run('G.sys[5].queue.some(q=>q.delivery&&q.delivery.fleet===A.id)'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
