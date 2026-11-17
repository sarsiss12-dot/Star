'use strict';
/* REINF-ROUTE.0 — tersaneden çıkan takviye, düşman sistemindeki (kuşatma / işgal) ana filoya ulaşır.
   Zincir: tersane çıkışı (yeni sevkiyat filosu) → hareket (yol / bacak) → ana filonun gemi sayısı artar.
   Harita (dispatch-fixture): 0(tersane)-1-2-3-4-5 düz hat; 5 düşman (O) sahipliğinde, E ile O savaşta.
   Sapma yolu (yalnız ilgili vakada): 0-6-7-5. STARS_ROOT=<kök> ile eski sürüm (p39) aynı vakalarla koşulur. */
const assert=require('assert/strict');const path=require('path');
const {fresh}=require('./helpers/dispatch-fixture');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
function setup(actor=0,extra=''){
  const h=fresh(actor,ROOT);
  h.run(`E.war[O.id]=O.war[E.id]=true;G.sys[5].owner=O.id;G.vis=new Set(G.sys.map(s=>s.id));
    function N(){return G.fleets.find(f=>f!==A&&f!==B&&f.e===E.id&&f.ships.length&&(f.shipment||f.joinFleet!==undefined));}
    function armed(sys){const x=newFleet(O,sys,[{c:'kor'},{c:'kor'}],'Düşman');return x;}
    function days(n,dt=1){for(let i=0;i<n;i++){G.day+=dt;stepFleets(dt);}}
    ${extra}`);
  return h;
}
const chain=h=>h.run(`({yard:!!N0,moved:moved,main:A.ships.length})`);

/* 1) Sipariş sınır geçişinden ÖNCE, üretim ana filo düşman sistemine girdikten SONRA biter; güvenli kesintisiz rota. */
test('R1 sipariş sınırdan önce, üretim sonra: takviye düşman sistemindeki ana filoya katılır',()=>{
  const h=setup();
  const r=h.run(`var o=reinforceFleet(E,A);A.sys=5;finish();var N0=N(),moved=!!(N0&&(N0.path.length||N0.mv)),why=N0&&shipmentStatus(N0);days(60);({ok:o.ok,yard:!!N0,moved,why,main:A.ships.length,left:N()?N().shipment.state:null})`);
  assert.equal(r.ok,true,'sipariş verildi');assert.equal(r.yard,true,'tersaneden çıktı');
  assert.equal(r.moved,true,'yola çıktı — '+r.why);assert.equal(r.main,2,'ana filo gemi sayısı arttı (durum: '+r.left+')');
});
/* 2) Ana filo zaten düşman sistemindeyken yeni otomatik sipariş (Filo Bileşimi + Otomatik Takviye). */
test('R2 ana filo düşman sistemindeyken otomatik takviye sipariş verir ve teslim eder',()=>{
  const h=setup();
  const r=h.run(`A.sys=5;var t=setFleetTemplate(E,A,{kor:2},true);A.composition.next=0;fleetAutoReinforceTick();
    var q=G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.delivery&&q.delivery.fleet===A.id).length,0),reason=A.composition.reason;
    finish();var N0=N(),moved=!!(N0&&(N0.path.length||N0.mv));days(60);({t:t.ok,q,reason,yard:!!N0,moved,main:A.ships.length})`);
  assert.equal(r.t,true);assert.equal(r.q,1,'otomatik sipariş kuyrukta — '+r.reason);
  assert.equal(r.yard,true);assert.equal(r.moved,true);assert.equal(r.main,2,'ana filo büyüdü');
});
/* 3) Yolda görünür silahlı düşman filosu → aynı adımda güvenli sapma rotası (0-6-7-5). */
test('R3 yolda görünür düşman filosu: güvenli sapma rotasıyla ulaşır',()=>{
  const h=setup(0,'link(0,6);link(6,7);link(7,5);');
  const r=h.run(`reinforceFleet(E,A);A.sys=5;finish();var N0=N(),first=N0.path.join(",");days(1,.4);var X=armed(3),at=N0.sys,route=null;
    for(let i=0;i<20&&N0.ships.length;i++){days(1,.5);if(!route&&N0.path.length&&N0.path.includes(6))route=N0.path.slice();}
    days(60);({first,at,route,inX:G.fleets.includes(X),main:A.ships.length,lost:N()?shipmentStatus(N()):null,hitX:N0.sys===3})`);
  assert.equal(r.first,"1,2,3,4,5",'ilk rota düz hat');assert.ok(r.route,'sapma rotası (6 üzerinden) seçildi: '+r.lost);
  assert.equal(r.main,2,'sapmadan sonra ana filo büyüdü');
});
/* 4) Güvenli rota yok → güvenli sistemde bekler (panelde yer + neden), uzun süre sonra rota açılınca kendiliğinden devam eder. */
test('R4 güvenli rota yok: bekler, yer ve neden görünür; rota açılınca kendiliğinden devam eder; ikinci sipariş / ödeme yok',()=>{
  const h=setup();
  const r=h.run(`var X=armed(3);reinforceFleet(E,A);A.sys=5;finish();var N0=N();days(1);var res=JSON.stringify(E.res),q0=G.sys[0].queue.length;
    var st1=shipmentStatus(N0),at1=N0.sys,s1=N0.shipment.state,again=reinforceFleet(E,A);days(200,2);
    var st2=shipmentStatus(N0),s2=N0.shipment.state,pend=fleetPendingCounts(E,A).inTransit,q1=G.sys[0].queue.length,res1=JSON.stringify(E.res);
    G.fleets=G.fleets.filter(f=>f!==X);days(30);({st1,at1,s1,again:again.ok,st2,s2,pend,same:res===res1&&q0===q1,main:A.ships.length})`);
  assert.ok(/Bekleme yeri: /.test(r.st1),'panelde bekleme yeri: '+r.st1);assert.notEqual(r.at1,3,'tehdit sisteminde beklemez');
  assert.equal(r.again,false,'aynı eksik için ikinci sipariş yok');assert.equal(r.pend,1,'bekleyen gemi bileşimde sayılır');assert.equal(r.same,true,'ek ödeme / kuyruk yok');
  assert.notEqual(r.s2,'paused','uzun beklemede otomatik deneme durmaz: '+r.st2);assert.equal(r.main,2,'rota açılınca ana filoya katıldı');
});
/* 5) Beklerken ana filo ulaşılabilir yere geçer → hemen (5 günü beklemeden) yeniden rota. */
test('R5 beklerken ana filo ulaşılabilir sisteme geçince hemen devam eder',()=>{
  const h=setup();
  const r=h.run(`var X=armed(3);reinforceFleet(E,A);A.sys=5;finish();var N0=N();days(3);var n0=N0.shipment.next;A.sys=1;days(1,.2);
    var moving=!!(N0.path.length||N0.mv);days(20);({n0,moving,main:A.ships.length})`);
  assert.equal(r.moving,true,'ana filo yer değiştirince yeniden rota');assert.equal(r.main,2);
});
/* 6) Kayıt / devam: bekleyen sevkiyat hedefini ve sayımını korur, yüklemeden sonra kendiliğinden sürer. */
test('R6 bekleyen takviye kayıt / devam sonrası korunur ve rota açılınca teslim edilir',()=>{
  const h=setup();
  const r=h.run(`var X=armed(3);reinforceFleet(E,A);A.sys=5;finish();var N0=N();days(120,2);var id=N0.id,aid=A.id,txt=serialize(),ok=deserialize(txt);
    A=G.fleets.find(f=>f.id===aid);var M=G.fleets.find(f=>f.id===id);G.fleets=G.fleets.filter(f=>!(f.e===O.id&&f.sys===3));var st=M.shipment.state,j=M.joinFleet===aid;days(40);
    ({ok,st,j,main:A.ships.length})`);
  assert.equal(r.ok,true);assert.equal(r.j,true,'hedef korunur');assert.notEqual(r.st,'lost');assert.equal(r.main,2,'yüklemeden sonra teslim');
});
/* 7) Silahlı düşman filosu ana filonun kendi sistemindeyse yaklaşma güvenli değildir → bekler (sahiplik değil, görünür filo). */
test('R7 hedef sistemde görünür düşman filosu varken takviye girmez, bekler',()=>{
  const h=setup();
  const r=h.run(`reinforceFleet(E,A);A.sys=5;var X=armed(5);finish();var N0=N();days(5);({st:N0.shipment.state,sys:N0.sys,main:A.ships.length})`);
  assert.notEqual(r.sys,5,'tehlikeli hedefe girmedi');assert.equal(r.main,1);
});
/* 8) AI'nın takviye seçimi değişmez (askerî strateji ayrı faz kararı): AI ana filosu düşman sisteminde → eskisi gibi tersane bulunmaz. */
test('R8 AI devleti: düşman sistemindeki ana filoya takviye kuralı eskisiyle aynı',()=>{
  const h=setup(1);
  const r=h.run(`A.sys=5;var o=reinforceFleet(E,A);({ok:o.ok,why:o.why})`);
  assert.equal(r.ok,false,'AI davranışı değişmedi');
});
/* 9) MP uzak insan (ai=false, devlet 0 değil): Otomatik Takviye düşman sistemindeki ana filo için sipariş verir ve teslim eder. */
test('R9 uzak insan devletin Otomatik Takviyesi sipariş verir, düşman sistemindeki ana filoya teslim eder',()=>{
  const h=setup(1);
  const r=h.run(`E.ai=false;A.sys=5;setFleetTemplate(E,A,{kor:2},true);A.composition.next=0;fleetAutoReinforceTick();
    var q=G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.delivery&&q.delivery.fleet===A.id).length,0),reason=A.composition.reason;finish();days(60);({q,reason,main:A.ships.length})`);
  assert.equal(r.q,1,'sipariş — '+r.reason);assert.equal(r.main,2);
});
/* 10) Derin giriş: yol düşmanın toprak iddiasındaki kolonisiz sistemlerinden (3, 4) geçer — görünür filo yoksa geçilebilir. */
test('R10 düşman toprak iddiasındaki boş sistemlerden geçerek ana filoya ulaşır',()=>{
  const h=setup(0,'var __oc=claimOf;claimOf=s=>[3,4].includes(s.id)?O.id:__oc(s);G.sys[3].owner=G.sys[4].owner=-1;');
  const r=h.run(`reinforceFleet(E,A);A.sys=5;finish();var N0=N(),moved=!!(N0&&(N0.path.length||N0.mv));days(60);({moved,main:A.ships.length})`);
  assert.equal(r.moved,true);assert.equal(r.main,2);
});
/* 11) Kolonili düşman ara sistemi (4) kaçınılır; kendi silahlı filon orayı tutuyorsa geçilir. */
test('R11 kolonili düşman ara sistemi kapalı; kendi silahlı filon tutuyorsa açık',()=>{
  const h=setup(0,'G.sys[4].owner=O.id;B.sys=8;');
  const r=h.run(`reinforceFleet(E,A);A.sys=5;finish();var N0=N();days(2);var s1=N0.shipment.state,m1=A.ships.length;var H=newFleet(E,4,[{c:'kor'}],'Tutan');days(40);({s1,m1,main:A.ships.length})`);
  assert.equal(r.m1,1,'kolonili ara sistemden geçmedi');assert.equal(r.s1,'blocked');assert.equal(r.main,2,'tutulan sistemden geçti');
});
/* 12) MP uzak insan: müttefik sensör paylaşımıyla HARİTADA gördüğü (humanVisionContext) silahlı düşman filosu rota kararında da tehdit;
   aynı filo görünürlükten çıkınca (paylaşım biter) gizli konumu rotaya sızmaz. Harita: 0(tersane)-1-2-3-4-5(hedef, O); sapma 0-6-7-5.
   1–4 sahipsiz; düşman filosu 3'te; müttefik G (devlet 2) 2'de koloni / filo ile 3'ü görür ve E'ye sensör paylaşır. */
test('R12 müttefik sensörüyle görülen düşman filosu rota kararında tehdit; görünürlükten çıkınca gizli konum sızmaz',()=>{
  const h=setup(1,`E.ai=false;for(const i of [1,2,3,4])G.sys[i].owner=-1;link(0,6);link(6,7);link(7,5);B.sys=8;A.sys=5;
    var Al=G.emps[2];Al.dead=false;E.war[Al.id]=Al.war[E.id]=false;O.war[Al.id]=Al.war[O.id]=false;var AF=newFleet(Al,2,[{c:'kor'}],'Gözcü');
    E.shareVis=E.shareVis||{};E.mods.sensor=0;var X=armed(3);`);
  const r=h.run(`var vis=humanVisionContext(E).visible.has(3),shareOn=sensorShareActive(E,Al);E.shareVis[Al.id]=true;var visOn=humanVisionContext(E).visible.has(3),act=sensorShareActive(E,Al);
    var th=reinforcementThreats(E).has(3);reinforceFleet(E,A);A.sys=5;finish();var N0=N(),p1=N0.path.join(',');
    /* paylaşım biter: misafirin haritası 3'ü artık görmez; rota tehdidi de düşmeli (gizli bilgi sızmaz) */
    delete E.shareVis[Al.id];var visOff=humanVisionContext(E).visible.has(3),thOff=reinforcementThreats(E).has(3);
    ({vis,shareOn,visOn,act,th,p1,visOff,thOff})`);
  assert.equal(r.vis,false,'paylaşımsız 3 görünmez');assert.equal(r.visOn,true,'paylaşımla misafir haritası 3 görür');
  assert.equal(r.th,true,'haritada görülen silahlı düşman rota tehdidi');assert.ok(r.p1.includes('6')&&!r.p1.includes('3'),'güvenli sapma rotası: '+r.p1);
  assert.equal(r.visOff,false);assert.equal(r.thOff,false,'görünmeyen filo tehdit sayılmaz (gizli bilgi yok)');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);
process.exitCode=fail?1:0;
