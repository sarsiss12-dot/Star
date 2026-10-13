'use strict';
const assert=require('assert/strict');
const {fresh}=require('./helpers/dispatch-fixture');
let pass=0,fail=0;const eq=(a,b=true)=>assert.equal(a,b);
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
function blocked(actor=0){const h=fresh(actor);h.run('reinforceFleet(E,A);G.sys[1].owner=O.id;finish();var N=G.fleets.find(f=>f!==A&&f!==B);');return h;}
for(const actor of [0,1])test(actor+': kapalı üretim çıkışı hedefi ve eksik sayacını korur',()=>{
 const h=blocked(actor);eq(h.run('N.joinFleet===A.id'));eq(h.run('N.shipment.state'),'blocked');eq(h.run('fleetPendingCounts(E,A).inTransit'),1);eq(h.run('reinforceFleet(E,A).ok'),false);
});
test('retry beklemesi kare başına yol aramaz, 4 denemede durur',()=>{
 const h=blocked();h.run('var calls=0,orig=shipmentRoute;shipmentRoute=function(...a){calls++;return orig(...a)};for(let i=0;i<100;i++)stepFleets(.01);');eq(h.run('calls'),0);
 h.run('for(let i=0;i<10;i++){G.day+=40;stepFleets(.01);}');eq(h.run('calls'),3);eq(h.run('N.shipment.state'),'paused');eq(h.run('N.shipment.attempts'),4);
});
test('rota açılınca otomatik retry gerçek gemiyi bir kez teslim eder',()=>{
 const h=blocked();h.run('var res=JSON.stringify(E.res),rng=RND_STATE;G.sys[1].owner=E.id;G.day+=5;sail();sail();');eq(h.run('A.ships.length'),2);eq(h.run('N.ships.length'),0);eq(h.run('JSON.stringify(E.res)===res&&RND_STATE===rng'));
});
test('genel sistem hedefi kapalıyken korunur ve açılınca varır',()=>{
 const h=fresh();h.run('setRally(E,Y,9);queueShip(E,Y,"kor");finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.shipment.sys'),9);h.run('link(5,9);G.day+=5;sail();');eq(h.run('N.sys'),9);eq(h.run('hasShipment(N)'),false);
});
test('yolda sınır kapanması hedefi kaybettirmez',()=>{
 const h=fresh();h.run('reinforceFleet(E,B);finish();stepFleets(100);G.sys[2].owner=O.id;stepFleets(.1);var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.joinFleet'),h.run('B.id'));eq(h.run('N.path.length'),0);eq(h.run('N.shipment.state'),'blocked');
});
test('ana filo kaybı aktif bacağı bitirir, eski hedefe devam etmez',()=>{
 const h=fresh();h.run('reinforceFleet(E,B);finish();stepFleets(.01);var N=G.fleets.find(f=>f!==A&&f!==B),dest=N.mv.to;B.ships=[];stepFleets(.01);');eq(h.run('N.shipment.state'),'lost');eq(h.run('N.joinFleet===undefined'));h.run('sail();');eq(h.run('N.sys'),h.run('dest'));eq(h.run('N.ships.length'),1);
});
test('üretimde ana filo kaybı gemiyi korur ve gizli sistem fallback yapmaz',()=>{
 const h=fresh();h.run('Y.rally[E.id]={fleet:999999,sys:4};queueShip(E,Y,"kor");finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('N.sys'),0);eq(h.run('N.shipment.state'),'lost');eq(h.run('N.path.length'),0);
});
test('iptal kaynak iade etmez, gemiyi silmez, tekrar işlem reddedilir',()=>{
 const h=blocked();h.run('var before=JSON.stringify(E.res),r=shipmentAction(E,N,"cancel"),r2=shipmentAction(E,N,"cancel");');eq(h.run('r.ok'));eq(h.run('r2.ok'),false);eq(h.run('N.ships.length'),1);eq(h.run('JSON.stringify(E.res)===before'));eq(h.run('pendingFleetShips(E,A)'),0);
});
test('yeni filo hedefi sayacı aktarır, tersane ayarını değiştirmez',()=>{
 const h=blocked();h.run('setRally(E,Y,5);var r=shipmentAction(E,N,"retarget",{fleet:B.id});');eq(h.run('r.ok'));eq(h.run('pendingFleetShips(E,A)'),0);eq(h.run('pendingFleetShips(E,B)'),1);eq(h.run('Y.rally[E.id].sys'),5);
});
test('yeni sistem hedefi kapalı rotada kabul edilip bekler',()=>{
 const h=blocked();h.run('var r=shipmentAction(E,N,"retarget",{sys:9});');eq(h.run('r.ok'));eq(h.run('N.shipment.sys'),9);eq(h.run('N.shipment.state'),'blocked');eq(h.run('N.joinFleet===undefined'));
});
test('yabancı, kendi kendisi, sevkiyat ve bilinmeyen hedef değişmez',()=>{
 const h=blocked();h.run('B.e=O.id;G.sys[9].seen=[];var before=JSON.stringify(N);');
 for(const target of ['{fleet:B.id}','{fleet:N.id}','{sys:9}','{sys:-1}'])eq(h.run(`shipmentAction(E,N,'retarget',${target}).ok`),false);
 eq(h.run('JSON.stringify(N)===before'));eq(h.run('shipmentAction(O,N,"cancel").ok'),false);
});
test('hareketli ana filonun yeni varışı izlenir',()=>{
 const h=blocked();h.run('G.sys[1].owner=E.id;orderMove(A,3);stepFleets(.01);G.day+=5;followRallyFleet(N);');eq(h.run('N.path.at(-1)'),3);
});
test('çatışmadaki ana filoya savaş bitmeden birleşmez',()=>{
 const h=fresh();h.run('A.sys=0;A.combat=3;reinforceFleet(E,A);finish();var N=G.fleets.find(f=>f!==A&&f!==B);');eq(h.run('A.ships.length'),1);eq(h.run('N.shipment.state'),'waiting');h.run('A.combat=0;stepFleets(.01);');eq(h.run('A.ships.length'),2);
});
test('v8 bekleme ve retry bütçesi yüklemede sıfırlanmaz',()=>{
 const h=blocked();h.run('var id=N.id,txt=serialize(),d=JSON.stringify(N.shipment),rng=RND_STATE;var ok=deserialize(txt);N=G.fleets.find(f=>f.id===id);');eq(h.run('ok'));eq(h.run('JSON.parse(txt).v'),8);eq(h.run('JSON.stringify(N.shipment)===d'));eq(h.run('RND_STATE===rng'));
});
test('eski v8 joinFleet ve rallyTo teslimatları tembel olarak alınır',()=>{
 const h=fresh();h.run('var N=newFleet(E,0,[{c:"kor"}]);N.joinFleet=A.id;N.rallyTo=4;followRallyFleet(N);');eq(h.run('N.shipment.fleet'),h.run('A.id'));eq(h.run('N.path.at(-1)'),2);
});
test('geçersiz yeni kayıt retry alanları sınırlanır',()=>{
 const h=blocked();h.run('N.shipment.attempts=1e20;N.shipment.next=1e20;N.shipment.state="bogus";var id=N.id;deserialize(serialize());N=G.fleets.find(f=>f.id===id);');eq(h.run('N.shipment.attempts'),4);eq(h.run('N.shipment.next<=G.day+40'));
});
test('bir tikte en fazla 8 bekleyen rota sorgusu',()=>{
 const h=fresh();h.run('G.sys[1].owner=O.id;for(let i=0;i<50;i++){const n=newFleet(E,0,[{c:"kor"}]);n.shipment={fleet:A.id,state:"ready",attempts:0,next:0};n.joinFleet=A.id;}var calls=0,orig=shipmentRoute;shipmentRoute=function(...a){calls++;return orig(...a)};stepFleets(.01);');eq(h.run('calls'),8);
});
test('normal üretim bekleyen sevkiyata gemi eklemez',()=>{
 const h=blocked();h.run('queueShip(E,Y,"kor");finish();');eq(h.run('N.ships.length'),1);eq(h.run('G.fleets.filter(f=>f.e===E.id&&f.sys===0).length'),2);
});
test('AI bekleyen sevkiyatı otomatik birleştirmez',()=>{
 const h=blocked(1);h.run('var C=newFleet(E,0,[{c:"kor"}]);aiTurn(E);');eq(h.run('N.ships.length'),1);eq(h.run('N.shipment.fleet'),h.run('A.id'));eq(h.run('G.fleets.includes(N)'));
});
test('başarılı manuel hareket eski teslimatı kaldırır, başarısız korur',()=>{
 const h=blocked();h.run('var no=orderMove(N,4);');eq(h.run('no'),false);eq(h.run('hasShipment(N)'));h.run('var yes=orderMove(N,0);');eq(h.run('yes'));eq(h.run('hasShipment(N)'),false);
});
test('manuel retry durmuş sevkiyatı yeniden başlatır',()=>{
 const h=blocked();h.run('for(let i=0;i<3;i++){G.day+=40;stepFleets(.01);}G.sys[1].owner=E.id;var r=shipmentAction(E,N,"retry");sail();');eq(h.run('r.ok'));eq(h.run('A.ships.length'),2);
});
test('UI iptal gerçek motora bağlıdır, eski düğme tekrar çalışmaz',()=>{
 const h=blocked();h.run('View.sel=N;G.speed=0;UI.shipmentMenu(N);var token=UI._shipmentPending.token;UI.act("shipmentApply",token+":cancel");UI.act("shipmentApply",token+":cancel");');eq(h.run('hasShipment(N)'),false);eq(h.run('G.speed'),0);eq(h.run('N.ships.length'),1);
});
test('UI hedef seçimi ve panel bekleme gerekçesi bağlıdır',()=>{
 const h=blocked();h.run('View.sel=N;var html=UI.p_filo();UI.shipmentMenu(N);var p=UI._shipmentPending,i=p.choices.findIndex(x=>x.target.fleet===B.id);UI.act("shipmentApply",p.token+":"+i);');eq(h.run('html.includes("SEVKİYATI YÖNET")'));eq(h.run('N.shipment.fleet'),h.run('B.id'));
});
test('yükleme öncesi modal yeni dünyadaki aynı IDye işlem yapmaz',()=>{
 const h=blocked();h.run('UI.shipmentMenu(N);var token=UI._shipmentPending.token,id=N.id,txt=serialize();deserialize(txt);UI.act("shipmentApply",token+":cancel");N=G.fleets.find(f=>f.id===id);');eq(h.run('hasShipment(N)'));
});
test('DUR emri otomatik teslimatın yeniden başlamasını engeller',()=>{
 const h=blocked();h.run('View.sel=N;UI.act("stop","");G.day+=40;G.sys[1].owner=E.id;sail();');eq(h.run('hasShipment(N)'),false);eq(h.run('N.sys'),0);
});
test('UI vazgeç oyun hızını ve sevkiyatı korur, eski düğme geçersizdir',()=>{
 const h=blocked();h.run('G.speed=0;UI.shipmentMenu(N);var token=UI._shipmentPending.token,before=JSON.stringify(N);UI.closeModal();UI.act("shipmentApply",token+":cancel");');eq(h.run('G.speed'),0);eq(h.run('JSON.stringify(N)===before'));
});
test('sevkiyat gemisine ikinci bir takviye zinciri açılamaz',()=>{
 const h=blocked();h.run('var before=JSON.stringify([Y.queue,E.res]),r=reinforceFleet(E,N);');eq(h.run('r.ok'),false);eq(h.run('queueFleetShip(E,Y,"kor",N)'),false);eq(h.run('JSON.stringify([Y.queue,E.res])===before'));
});
test('hareket ortasında iptal mevcut bacağı bitirir ve tekrar sevk etmez',()=>{
 const h=fresh();h.run('reinforceFleet(E,B);finish();stepFleets(.01);var N=G.fleets.find(f=>f!==A&&f!==B),leg=N.mv.to,pos=N.x;shipmentAction(E,N,"cancel");var kept=N.mv.to===leg&&N.x===pos;sail();');eq(h.run('kept'));eq(h.run('N.sys'),h.run('leg'));eq(h.run('B.ships.length'),1);eq(h.run('N.ships.length'),1);
});
test('hareket ortasında yeniden hedefleme bacak atlamaz ve doğru filoya katılır',()=>{
 const h=fresh();h.run('reinforceFleet(E,B);finish();stepFleets(.01);var N=G.fleets.find(f=>f!==A&&f!==B),leg=N.mv.to;shipmentAction(E,N,"retarget",{fleet:A.id});var kept=N.path[0]===leg;var id=N.id,aid=A.id,bid=B.id;deserialize(serialize());N=G.fleets.find(f=>f.id===id);A=G.fleets.find(f=>f.id===aid);B=G.fleets.find(f=>f.id===bid);sail();');eq(h.run('kept'));eq(h.run('A.ships.length'),2);eq(h.run('B.ships.length'),1);
});
test('retry kapalı kısa yol yerine geçerli alternatif hiper-yolu kullanır',()=>{
 const h=blocked();h.run('link(0,5);G.day+=5;followRallyFleet(N);');eq(h.run('N.path[0]'),5);eq(h.run('N.path.at(-1)'),2);eq(h.run('N.path.includes(1)'),false);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
