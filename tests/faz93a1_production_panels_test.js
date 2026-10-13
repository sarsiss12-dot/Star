'use strict';
const assert=require('assert/strict'),path=require('path'),fs=require('fs');
const {fresh:fixture}=require('./helpers/dispatch-fixture');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const fresh=()=>{const h=fixture(0,root);h.run('Y.planets[0].owner=E.id;View.selSys=Y;');return h;};
let pass=0,fail=0;const eq=(a,b=true)=>assert.equal(a,b);
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
test('Active ship cancellation returns original payment even after discount changes',()=>{
 const h=fresh();h.run(`var stock=JSON.stringify(E.res);queueShip(E,Y,'kor');var q=Y.queue[0];q.left=q.tot/2;
 E.mods.shipCost=.5;var r=cancelShipOrders(E,Y,[q]);`);
 eq(h.run('r.ok'));eq(h.run('Y.queue.length'),0);eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
});
test('Second cancellation, duplicate selection and foreign ownership cannot refund twice',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');var q=Y.queue[0],stock=JSON.stringify(E.res);
 var duplicate=cancelShipOrders(E,Y,[q,q]);Y.owner=O.id;var foreign=cancelShipOrders(E,Y,[q]);Y.owner=E.id;`);
 eq(h.run('duplicate.ok'),false);eq(h.run('foreign.ok'),false);eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
 h.run('cancelShipOrders(E,Y,[q]);var refunded=JSON.stringify(E.res);var again=cancelShipOrders(E,Y,[q]);');
 eq(h.run('again.ok'),false);eq(h.run('JSON.stringify(E.res)'),h.run('refunded'));
});
test('Completed order identity cannot cancel the next order',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');queueShip(E,Y,'bil');var first=Y.queue[0];finish();
 var before=JSON.stringify([E.res,Y.queue]);var r=cancelShipOrders(E,Y,[first]);`);
 eq(h.run('r.ok'),false);eq(h.run('JSON.stringify([E.res,Y.queue])'),h.run('before'));
});
test('Bulk cancel affects only selected yard orders and stops its production loop',()=>{
 const h=fresh();h.run(`A.capTarget=4;reinforceFleet(E,A);finish();var traveler=G.fleets.find(f=>f.joinFleet===A.id);
 G.sys[1].built.tersane=1;queueShip(E,G.sys[1],'kor');var other=JSON.stringify(G.sys[1].queue);
 Y.loopBuild='kor';var r=cancelShipOrders(E,Y,Y.queue.slice(),true);`);
 eq(h.run('r.ok'));eq(h.run('Y.queue.length'),0);eq(h.run('Y.loopBuild===undefined'));
 eq(h.run('G.fleets.includes(traveler)'));eq(h.run('JSON.stringify(G.sys[1].queue)'),h.run('other'));
 eq(h.run('fleetReinforcementStatus(E,A).queued'),0);eq(h.run('fleetReinforcementStatus(E,A).inTransit'),1);
 eq(h.run('fleetReinforcementStatus(E,A).missing'),2);
});
test('Single cancellation leaves loop preference; snapshot excludes later orders',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');var chosen=Y.queue.slice();Y.loopBuild='kor';queueShip(E,Y,'bil');
 cancelShipOrders(E,Y,chosen);`);
 eq(h.run('Y.queue.length'),1);eq(h.run('Y.queue[0].cls'),'bil');eq(h.run('Y.loopBuild'),'kor');
});
test('Legacy orders quote missing receipt explicitly and cannot create a refund',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');delete Y.queue[0].paid;var stock=JSON.stringify(E.res);
 UI.act('shipCancelAll','0');var quote=shipCancellationQuote(E,Y,Y.queue);`);
 eq(h.run('quote.legacy'),1);assert.match(h.run("$('modal').innerHTML"),/ödeme kaydı yok/);
 h.run('UI.act("shipCancelConfirm",String(UI._shipCancelPending.token))');eq(h.run('Y.queue.length'),0);
 eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
});
test('Invalid receipts cannot inject negative or nonfinite resource refunds',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');Y.queue[0].paid={ala:NaN};var stock=JSON.stringify(E.res);
 var r=cancelShipOrders(E,Y,Y.queue.slice());`);
 eq(h.run('r.legacy'),1);eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
});
test('v8 round trip preserves receipt and private fleet destination',()=>{
 const h=fresh();h.run(`reinforceFleet(E,A);var before=JSON.stringify(Y.queue),saved=serialize();deserialize(saved);
 var E=G.p,Y=G.sys[0];var quote=shipCancellationQuote(E,Y,Y.queue);`);
 eq(h.run('JSON.stringify(Y.queue)'),h.run('before'));eq(h.run('quote.legacy'),0);
 eq(h.run('JSON.parse(saved).v'),8);eq(h.run('typeof Y.queue[0].delivery.fleet'),'number');
});
test('Real ship panel offers individual and all cancellation; confirm is single-use',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');queueShip(E,Y,'bil');var html=UI.p_sistem();
 var token=Array.from(UI._shipCancelRefs.keys())[0];UI.act('shipCancel',token);var confirm=String(UI._shipCancelPending.token);`);
 assert.match(h.run('html'),/data-a="shipCancelAll"/);assert.match(h.run('html'),/data-a="shipCancel"/);
 eq(h.run('Y.queue.length'),2);h.run(`UI.act('shipCancelConfirm',confirm);var stock=JSON.stringify(E.res);UI.act('shipCancelConfirm',confirm);`);
 eq(h.run('Y.queue.length'),1);eq(h.run('Y.queue[0].cls'),'bil');eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
});
test('Confirmation becomes invalid across world reload',()=>{
 const h=fresh();h.run(`queueShip(E,Y,'kor');UI.act('shipCancelAll','0');var token=String(UI._shipCancelPending.token);
 deserialize(serialize());var before=JSON.stringify([G.p.res,G.sys,G.fleets,RND_STATE,G.day]);UI.act('shipCancelConfirm',token);`);
 eq(h.run('JSON.stringify([G.p.res,G.sys,G.fleets,RND_STATE,G.day])'),h.run('before'));
});
test('Closing or replacing the cancellation dialog invalidates its confirmation',()=>{
 for(const action of ["UI.closeModal()","UI.act('bInfo','tersane')"]){
  const h=fresh();h.run(`queueShip(E,Y,'kor');UI.act('shipCancelAll','0');var token=String(UI._shipCancelPending.token);
    var before=JSON.stringify([E.res,Y.queue]);${action};UI.act('shipCancelConfirm',token);`);
  eq(h.run('JSON.stringify([E.res,Y.queue])'),h.run('before'));
 }
});
test('Civilian orders refund every paid resource after partial construction',()=>{
 const h=fresh();h.run(`var stock=JSON.stringify(E.res);queueShip(E,Y,'kol');Y.queue[0].left=1;
 var r=cancelShipOrders(E,Y,Y.queue.slice());`);
 eq(h.run('r.ok'));eq(h.run('Object.keys(r.refund).length>1'));eq(h.run('JSON.stringify(E.res)'),h.run('stock'));
});
test('Cancellation confirm or dismissal restores paused or running game speed exactly',()=>{
 for(const speed of [0,1,3])for(const confirm of [false,true]){
  const h=fresh();h.run(`queueShip(E,Y,'kor');G.speed=${speed};UI.act('shipCancelAll','0');`);
  eq(h.run('G.speed'),0);
  h.run(confirm?"UI.act('shipCancelConfirm',String(UI._shipCancelPending.token))":"UI.closeModal()");
  eq(h.run('G.speed'),speed);
 }
});
test('Colony starts expanded; folds to summary; reopening restores real controls',()=>{
 const h=fresh();h.run(`var pid=Y.planets[0].i;var original=UI.p_sistem();var stock=serialize();
 UI.act('planetFold','0:'+pid);var small=UI.p_sistem();`);
 assert.match(h.run('original'),/aria-expanded="true"/);assert.match(h.run('original'),/data-a="build"/);
 assert.match(h.run('small'),/aria-expanded="false"/);assert.match(h.run('small'),/Nüfus/);
 assert.doesNotMatch(h.run('small'),/data-a="build"/);eq(h.run('serialize()'),h.run('stock'));
 h.run(`UI.act('planetFold','0:'+pid);var reopened=UI.p_sistem()`);assert.match(h.run('reopened'),/data-a="build"/);
});
test('Two colonies fold independently; state survives panel refresh but new world starts open',()=>{
 const h=fresh();h.run(`Y.planets[1].col=JSON.parse(JSON.stringify(Y.planets[0].col));Y.planets[1].owner=E.id;
 UI.act('planetFold','0:'+Y.planets[0].i);var html=UI.p_sistem();UI.p_sistem();`);
 eq((h.run('html').match(/aria-expanded="false"/g)||[]).length,1);
 eq((h.run('html').match(/aria-expanded="true"/g)||[]).length,1);
 h.run('deserialize(serialize());View.selSys=G.sys[0];var restored=UI.p_sistem();');
 assert.doesNotMatch(h.run('restored'),/aria-expanded="false"/);
});
test('Collapsed colony still shows live population, morale and pending construction count',()=>{
 const h=fresh();h.run(`UI.act('planetFold','0:'+Y.planets[0].i);Y.planets[0].col.pop=23.9;
 Y.planets[0].col.stab=42;Y.planets[0].col.q=[{key:'maden'}];var html=UI.p_sistem();`);
 assert.match(h.run('html'),/Nüfus 23 · Moral 42 · İnşa 1/);
});
function holdButton(h){h.doc.getElementById('menu').classList.add('hidden');
 const b=h.doc.createElement('button');b.dataset={hold:'tersane',a:'build',x:'0:0:tersane'};
 b.closest=selector=>selector==='[data-hold]'||selector==='[data-a]'?b:null;
 return b;
}
function fireHold(h,b){h.doc.emit('pointerdown',{target:b,clientX:0,clientY:0,pointerId:1,isPrimary:true});
 const item=[...h.timers.entries()].find(([id,t])=>t.ms===450);assert.ok(item);h.timers.delete(item[0]);item[1].fn();}
test('450ms hold opens real building details and capture guard prevents follow-up construction',()=>{
 const h=fresh(),b=holdButton(h);h.run('var before=serialize();UI.boot();');fireHold(h,b);
 assert.match(h.run("$('modal').innerHTML"),/İNŞA BEDELİ/);assert.match(h.run("$('modal').innerHTML"),/AYLIK BAKIM/);
 let stopped=false,prevented=false;
 const handler=h.doc.listeners.get('click').find(fn=>fn.toString().includes('_holdElement'));
 handler({target:b,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});
 if(!stopped)h.doc.body.emit('click',{target:b});
 eq(stopped);eq(prevented);eq(h.run('serialize()'),h.run('before'));
});
test('Scroll, pointer cancel, background and secondary finger cancel pending hold',()=>{
 for(const mode of ['move','cancel','blur','hidden','second']){
  const h=fresh(),b=holdButton(h);h.doc.emit('pointerdown',{target:b,clientX:0,clientY:0,pointerId:1});
  if(mode==='move')h.doc.emit('pointermove',{target:b,clientX:0,clientY:30,pointerId:1});
  if(mode==='cancel')h.doc.emit('pointercancel',{target:b,pointerId:1});
  if(mode==='blur')h.win.emit('blur');
  if(mode==='hidden'){h.doc.hidden=true;h.doc.emit('visibilitychange');}
  if(mode==='second')h.doc.emit('pointerdown',{target:b,clientX:0,clientY:0,pointerId:2,isPrimary:false});
  eq([...h.timers.values()].some(t=>t.ms===450),false);
 }
});
test('Ordinary short press is not swallowed by the hold guard',()=>{
 const h=fresh(),b=holdButton(h);h.doc.emit('pointerdown',{target:b,clientX:0,clientY:0,pointerId:1});
 h.doc.emit('pointerup',{target:b,clientX:0,clientY:0,pointerId:1});let stopped=false;
 h.doc.listeners.get('click').find(fn=>fn.toString().includes('_holdElement'))({target:b,preventDefault(){},stopImmediatePropagation(){stopped=true}});
 eq(stopped,false);
});
test('Reinforcement selects dominant military class, subtracts pending and explains actual purpose',()=>{
 const h=fresh();h.run(`E.techs.m_muhrip=true;A.ships=[{c:'muh',h:1},{c:'muh',h:1},{c:'kor',h:1}];A.capTarget=5;
 var r=reinforceFleet(E,A);View.sel=A;var html=UI.p_filo();`);
 eq(h.run('r.cls'),'muh');eq(h.run('r.siparis'),2);eq(h.run('fleetReinforcementStatus(E,A).missing'),0);
 assert.match(h.run('html'),/gövdesini veya erzağını doldurmaz/);eq(h.run('reinforceFleet(E,A).ok'),false);
});
test('Layer off/on styles share exactly the same opacity selector',()=>{
 const css=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(css,/\.tool\.radarBtn,\.tool\.logiBtn,\.tool\.fleetNamesBtn\{opacity:\.65\}/);
 assert.match(css,/\.tool\.radarBtn\.on,\.tool\.logiBtn\.on,\.tool\.fleetNamesBtn\.on\{opacity:1/);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
