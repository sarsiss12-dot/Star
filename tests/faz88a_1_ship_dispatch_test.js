'use strict';
const assert=require('assert/strict'),path=require('path');
const {fresh:fixture}=require('./helpers/dispatch-fixture');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const fresh=(actor=0)=>fixture(actor,ROOT);
let pass=0,fail=0;const eq=(a,b=true)=>assert.equal(a,b);
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.message);}}
for(const actor of [0,1])test(actor+': iki filonun aynı tersanedeki siparişleri karışmaz',()=>{
 const h=fresh(actor);h.run('reinforceFleet(E,A);reinforceFleet(E,B);finish();sail();finish();sail();');eq(h.run('A.ships.length'),2);eq(h.run('B.ships.length'),2);
});
test('tamamlama genel toplanma noktasını değiştirmez',()=>{
 const h=fresh();h.run('setRally(E,Y,5);reinforceFleet(E,A);');eq(h.run('Y.rally[E.id].sys'),5);eq(h.run('Y.rally[E.id].fleet===undefined'));
});
test('aynı eksik için tekrar düğmesi ikinci bedeli kesmez',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);var before=JSON.stringify(E.res),r=reinforceFleet(E,A);');eq(h.run('r.ok'),false);eq(h.run('Y.queue.length'),1);eq(h.run('JSON.stringify(E.res)===before'));
});
test('yoldaki ikmal de beklenen gemi sayısına dahildir',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);finish();var before=JSON.stringify(E.res),r=reinforceFleet(E,A);');eq(h.run('r.ok'),false);eq(h.run('Y.queue.length'),0);eq(h.run('JSON.stringify(E.res)===before'));
});
test('başarısız sevk gemiyi tersanede bırakır, sevk ilan etmez',()=>{
 const h=fresh();h.run('setRally(E,Y,9);queueShip(E,Y,"kor");finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.sys'),0);eq(h.run('N.path.length'),0);eq(h.run('N.joinFleet===undefined&&N.rallyTo===undefined'));eq(h.run('G.log.some(x=>x.m.includes("toplanma noktasına sevk"))'),false);
});
test('üretimde hareketli hedefin güncel varışı seçilir',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);orderMove(A,3);stepFleets(.01);finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.path.at(-1)'),3);eq(h.run('N.joinFleet'),h.run('A.id'));
});
test('yok olmuş filo siparişi eski konuma yollanmaz',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);A.ships=[];finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.sys'),0);eq(h.run('N.path.length'),0);eq(h.run('N.joinFleet===undefined'));
});
test('genel rally yabancı filo id içerirse yabancıya gemi verilmez',()=>{
 const h=fresh();h.run('A.e=O.id;A.sys=0;Y.rally[E.id]={fleet:A.id,sys:0};queueShip(E,Y,"kor");finish();');eq(h.run('A.ships.length'),1);eq(h.run('G.fleets.some(f=>f.e===E.id&&f.sys===0&&f.ships.length===1)'));
});
test('yabancı filoya ikmal siparişi kaynak harcamadan reddedilir',()=>{
 const h=fresh();h.run('A.e=O.id;var before=JSON.stringify([E.res,Y.queue]),r=reinforceFleet(E,A);');eq(h.run('r.ok'),false);eq(h.run('JSON.stringify([E.res,Y.queue])===before'));
});
test('sabotajlı ilk tersane diğer geçerli tersaneyi engellemez',()=>{
 const h=fresh();h.run('Y.yardLock=999;var Z=G.sys[5];Z.planets[0].col=JSON.parse(JSON.stringify(template));Z.planets[0].col.b.tersane=1;var r=reinforceFleet(E,A);');eq(h.run('r.ok'));eq(h.run('Y.queue.length'),0);eq(h.run('Z.queue.length'),1);
});
test('ulaşılamayan tersane sipariş ve bedel yaratmaz',()=>{
 const h=fresh();h.run('Y.lanes=[];G.sys[1].lanes=[2];var before=JSON.stringify(E.res),r=reinforceFleet(E,A);');eq(h.run('r.ok'),false);eq(h.run('Y.queue.length'),0);eq(h.run('JSON.stringify(E.res)===before'));
});
test('v8 iki ayrı sipariş hedefini yükleme sonrası korur',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);reinforceFleet(E,B);var a=A.id,b=B.id,rng=RND_STATE,txt=serialize();deserialize(txt);E=G.emps[0];Y=G.sys[0];A=G.fleets.find(f=>f.id===a);B=G.fleets.find(f=>f.id===b);var sameRng=RND_STATE===rng;finish();sail();finish();sail();');eq(h.run('A.ships.length'),2);eq(h.run('B.ships.length'),2);eq(h.run('sameRng'));eq(h.run('JSON.parse(txt).v'),8);
});
test('eski hedefsiz kuyruk mevcut genel rally ile çalışır',()=>{
 const h=fresh();h.run('Y.queue.push({cls:"kor",e:E.id,left:0,tot:30});setRally(E,Y,3);finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.path.at(-1)'),3);h.run('sail();');eq(h.run('N.sys'),3);
});
test('sivil üretim askeri rally tarafından yutulmaz',()=>{
 const h=fresh();h.run('setRally(E,Y,5);queueShip(E,Y,"kol");finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.sys'),0);eq(h.run('N.path.length'),0);eq(h.run('N.ships[0].c'),'kol');
});
test('yabancı tersanenin rally ayarı değiştirilemez',()=>{
 const h=fresh();h.run('Y.owner=O.id;var before=JSON.stringify(Y.rally),r=setRally(E,Y,4);');eq(h.run('r.ok'),false);eq(h.run('JSON.stringify(Y.rally)===before'));
});
test('geçersiz rally hedefi eski tercihi silmez',()=>{
 const h=fresh();h.run('setRally(E,Y,4);var r=setRally(E,Y,99999);');eq(h.run('r.ok'),false);eq(h.run('Y.rally[E.id].sys'),4);
});
test('vasal kapı izni gerçek kapı kenarından geçişe yeter',()=>{
 const h=fresh();h.run('Y.built.kapi=E.id;G.sys[4].built.kapi=O.id;G.sys[4].owner=O.id;O.overlord=E.id;var can=hasUsableGate(E,G.sys[4]);var F=newFleet(E,0,[{c:"kor"}]);var ok=orderMove(F,4);stepFleets(1);');eq(h.run('can'));eq(h.run('ok'));eq(h.run('F.sys'),4);
});
test('vasal kapı hakkı kapısız sıradan sınıra izin yaratmaz',()=>{
 const h=fresh();h.run('G.sys[1].owner=O.id;O.overlord=E.id;var F=newFleet(E,0,[{c:"kor"}]);var ok=orderMove(F,1);');eq(h.run('ok'),false);
});
test('oyuncu otomatik keşfi ulaşılamayan en yakın hedefe takılmaz',()=>{
 const h=fresh();h.run('G.fleets=[];var F=newFleet(E,0,[{c:"bil"}]);F.auto=true;G.sys[9].x=10;G.sys[9].surv=[];G.sys[2].surv=[];autoExploreTick();');eq(h.run('F.path.at(-1)'),2);
});
test('AI keşfi ulaşılamayan en yakın hedef yerine geçerli hedefi seçer',()=>{
 const h=fresh(1);h.run('G.sys[9].x=10;G.sys[9].surv=[];G.sys[2].surv=[];var F=newFleet(E,0,[{c:"bil"}]);E.ai=true;aiTurn(E);');eq(h.run('F.path.at(-1)'),2);
});
test('gerçek AI üretim kapısı bir gemiyi eksik filoya ayırır',()=>{
 const {probe}=require('./ai-dispatch-probe');const p=probe(ROOT,11);eq(p.queued,1);eq(p.targeted,1);eq(p.classes[0],'kor');
});
test('AI hedef bulamazsa mevcut yerel üretim devam eder',()=>{
 const h=fresh(1);h.run('A.capTarget=B.capTarget=1;var ok=aiQueueMilitaryShip(E,Y,"kor");');eq(h.run('ok'));eq(h.run('Y.queue.length'),1);eq(h.run('Y.queue[0].delivery===undefined'));
});
test('AI dolu veya yoldaki ikmalle tamamlanmış filoya ikinci sipariş vermez',()=>{
 const h=fresh(1);h.run('B.capTarget=1;aiQueueMilitaryShip(E,Y,"kor");aiQueueMilitaryShip(E,Y,"kor");');eq(h.run('Y.queue.filter(q=>q.delivery).length'),1);
});
test('üretim sonrası sınır kapanırsa gemi ve kaynak sonucu tutarlı kalır',()=>{
 const h=fresh();h.run('reinforceFleet(E,A);var before=JSON.stringify(E.res);G.sys[1].owner=O.id;finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.sys'),0);eq(h.run('N.path.length'),0);eq(h.run('N.joinFleet===undefined'));eq(h.run('JSON.stringify(E.res)===before'));
});
test('tersanede çatışan ana filoya anında gemi eklenmez',()=>{
 const h=fresh();h.run('A.sys=0;A.combat=2;reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('A.ships.length'),1);eq(h.run('N.joinFleet'),h.run('A.id'));h.run('A.combat=0;sail();');eq(h.run('A.ships.length'),2);
});
test('başarılı sevk gerçek bedeli bir kez keser ve RNG tüketmez',()=>{
 const h=fresh();h.run('var before=JSON.parse(JSON.stringify(E.res)),rng=RND_STATE,cost=shipCost(E,"kor");reinforceFleet(E,A);finish();sail();');eq(h.run('Object.keys(cost).every(k=>before[k]-E.res[k]===cost[k])'));eq(h.run('RND_STATE===rng'));eq(h.run('A.ships.length'),2);
});
for(const actor of [0,1])test(actor+': kendi sistemindeki taranmamış hedefte tarama başlar',()=>{
 const h=fresh(actor);h.run('G.fleets=[];var F=newFleet(E,0,[{c:"bil"}]);F.auto=true;G.sys[0].surv=[];');h.run(actor?'E.ai=true;aiTurn(E);':'autoExploreTick();');eq(h.run('F.surv>0'));eq(h.run('F.path.length'),0);
});
test('AI sürmekte olan taramayı başa sarmaz',()=>{
 const h=fresh(1);h.run('G.fleets=[];var F=newFleet(E,0,[{c:"bil"}]);F.surv=7;G.sys[0].surv=[];E.ai=true;aiTurn(E);');eq(h.run('F.surv'),7);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
