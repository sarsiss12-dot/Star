'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.message);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(actor=0){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`G.fleets=[];G.cfg.gates=true;
   for(const e of G.emps){e.war={};e.ally={};e.passage={};e.civics=[];e.dead=false;
     e.wild=false;e.crisisSide=false;e.mizac=e._pers='yayilmaci';delete e._gateAt;delete e._gateList;}
   for(const s of G.sys){s.lanes=[];s.built={};s._reach=0;s.owner=-1;
     s.x=20000+s.id*1000;s.y=20000;s.surv=G.emps.map(e=>e.id);s.seen=s.surv.slice();
     s.anom=false;delete s.supplyHack;}
   var E=G.emps[${actor}],O=G.emps[${actor===0?1:0}];
   for(let i=0;i<10;i++){G.sys[i].owner=E.id;G.sys[i].x=i*100;G.sys[i].y=0;}
   function link(a,b){G.sys[a].lanes.push(b);G.sys[b].lanes.push(a);}
   function chain(){for(let i=0;i<5;i++)link(i,i+1);}
   function gate(id,owner=E.id){G.sys[id].owner=owner;G.sys[id].built.kapi=owner;}
   function frame(){stepFleets(100);}
   var F=newFleet(E,0,[{c:'kor'}],'Rota testi');
 `);return h;
}
for(const actor of [0,1]){
 test(actor+': kapalı hedef askeri filoya geçiş vermez',()=>{
  const h=fresh(actor);h.run('chain();G.sys[1].owner=O.id;var ok=orderMove(F,1);');eq(h.run('ok'),false);eq(h.run('F.path.length'),0);
 });
 test(actor+': ulaşılamayan yeni hedef eski rotayı korur',()=>{
  const h=fresh(actor);h.run('chain();orderMove(F,2);var before=JSON.stringify(F);var ok=orderMove(F,9);');
  eq(h.run('ok'),false);eq(h.run('JSON.stringify(F)===before'));
 });
 test(actor+': kapalı ara sistem yerine izinli yol',()=>{
  const h=fresh(actor);h.run('link(0,1);link(1,2);link(0,3);link(3,2);G.sys[1].owner=O.id;orderMove(F,2);');
  eq(h.run('JSON.stringify(F.path)'),'[3,2]');h.run('frame();frame();');eq(h.run('F.sys'),2);
 });
 test(actor+': iki kapı arasındaki sanal yol gerçekten biter',()=>{
  const h=fresh(actor);h.run('gate(0);gate(4);rebuildStructIndex();var ok=orderMove(F,4);frame();');
  eq(h.run('ok'));eq(h.run('F.sys'),4);eq(h.run('F.path.length'),0);eq(h.run('F.mv'),null);
 });
 test(actor+': izin hareket başlamadan geri çekilirse sınır aşılmaz',()=>{
  const h=fresh(actor);h.run('chain();G.sys[1].owner=O.id;O.passage[E.id]=true;orderMove(F,2);delete O.passage[E.id];frame();');
  eq(h.run('F.sys'),0);eq(h.run('F.path.length'),0);
 });
}
test('reddedilen ek durak mevcut güzergâhı bozmaz',()=>{
 const h=fresh();h.run('chain();orderMove(F,2);var before=JSON.stringify(F);var ok=orderMove(F,9,true);');eq(h.run('ok'),false);eq(h.run('JSON.stringify(F)===before'));
});
test('hareket sırasında yeni rota ilk yeni durağı atlamaz',()=>{
 const h=fresh();h.run('chain();orderMove(F,1);stepFleets(.01);orderMove(F,3);frame();');
 eq(h.run('F.sys'),1);eq(h.run('JSON.stringify(F.path)'),'[2,3]');h.run('frame();frame();');eq(h.run('F.sys'),3);
});
test('ek duraklar gerçek varış sırasını korur',()=>{
 const h=fresh();h.run('chain();orderMove(F,2);orderMove(F,4,true);var visited=[];for(let i=0;i<4;i++){frame();visited.push(F.sys);}');eq(h.run('JSON.stringify(visited)'),'[1,2,3,4]');
});
test('geçersiz hedef false döner ve filoyu değiştirmez',()=>{
 const h=fresh();h.run('chain();orderMove(F,2);var before=JSON.stringify(F);var ok=orderMove(F,99999);');eq(h.run('ok'),false);eq(h.run('JSON.stringify(F)===before'));
});
test('sivil gemi kapalı sınırdan geçmeye devam eder',()=>{
 const h=fresh();h.run("chain();F.ships=[{c:'kol',h:1}];G.sys[1].owner=O.id;var ok=orderMove(F,1);frame();");eq(h.run('ok'));eq(h.run('F.sys'),1);
});
test('savaş hedefi ve geri çekilme koridoru açık kalır',()=>{
 const h=fresh();h.run('chain();G.sys[1].owner=O.id;E.war[O.id]=true;var war=orderMove(F,1);delete E.war[O.id];F.retreating=true;var retreat=orderMove(F,2);frame();');eq(h.run('war&&retreat'));eq(h.run('F.sys'),1);
});
test('kapı izni sahibin yolcuya verdiği yönde okunur',()=>{
 const h=fresh();h.run('gate(0);gate(4,O.id);O.passage[E.id]=true;rebuildStructIndex();');eq(h.run('hasUsableGate(E,G.sys[4])'));eq(h.run('gateNetwork(E).ok(4)'));
});
test('yolcunun karşı tarafa verdiği izin onun kapısını açmaz',()=>{
 const h=fresh();h.run('gate(0);gate(4,O.id);E.passage[O.id]=true;rebuildStructIndex();');eq(h.run('hasUsableGate(E,G.sys[4])'),false);eq(h.run('gateNetwork(E).ok(4)'),false);
});
test('kapılar kapalı ayarı lojistik kapı listesini de kapatır',()=>{
 const h=fresh();h.run('gate(0);gate(4);rebuildStructIndex();G.cfg.gates=false;');eq(h.run('hasUsableGate(E,G.sys[4])'),false);eq(h.run('gateSupplyNodes(E).length'),0);eq(h.run('orderMove(F,4)'),false);
});
test('aynı gün iptal edilen izin kapı önbelleğinde kalmaz',()=>{
 const h=fresh();h.run('gate(4,O.id);O.passage[E.id]=E.passage[O.id]=true;var before=gateSupplyNodes(E).includes(4);delete O.passage[E.id];delete E.passage[O.id];');eq(h.run('before'));eq(h.run('gateSupplyNodes(E).includes(4)'),false);
});
test('savaşta kalan eski geçiş alanı ikmal sağlamaz',()=>{
 const h=fresh();h.run('G.sys[4].owner=O.id;O.passage[E.id]=true;E.war[O.id]=true;');eq(h.run('isSupplyNode(E,G.sys[4])'),false);
});
test('kapı inşa edilince eski yapı indeksi yolu saklamaz',()=>{
 const h=fresh();h.run('rebuildStructIndex();gate(0);gate(4);var ok=orderMove(F,4);frame();');eq(h.run('ok'));eq(h.run('F.sys'),4);
});
test('kapı kapanırsa komşu olmayan düğüme ışınlanılmaz',()=>{
 const h=fresh();h.run('gate(0);gate(4);rebuildStructIndex();orderMove(F,4);delete G.sys[4].built.kapi;frame();');eq(h.run('F.sys'),0);eq(h.run('F.path.length'),0);
});
test('alternatif yol kapı bağlantılarını korur',()=>{
 const h=fresh();h.run('link(0,1);link(1,2);link(0,3);link(4,2);G.sys[1].owner=O.id;gate(3);gate(4);rebuildStructIndex();var ok=orderMove(F,2);');
 eq(h.run('ok'));eq(h.run('JSON.stringify(F.path)'),'[3,4,2]');h.run('frame();frame();frame();');eq(h.run('F.sys'),2);
});
test('hareketli ana filoyu takipte ilk yeni sıçrama tüketilmez',()=>{
 const h=fresh();h.run('chain();var A=newFleet(E,2,[{c:"kor"}],"Ana");F.joinFleet=A.id;orderMove(F,1);frame();');
 eq(h.run('F.sys'),1);eq(h.run('JSON.stringify(F.path)'),'[2]');h.run('frame();');eq(h.run('A.ships.length'),2);eq(h.run('F.ships.length'),0);
});
test('başka devletin filosuyla birleşme yok',()=>{
 const h=fresh();h.run('chain();var A=newFleet(O,1,[{c:"kor"}],"Yabancı");F.joinFleet=A.id;orderMove(F,1);frame();');
 eq(h.run('A.ships.length'),1);eq(h.run('F.ships.length'),1);eq(h.run('F.joinFleet === undefined'));
});
test('ana filo çatışmadayken ikmal hedefini unutmaz',()=>{
 const h=fresh();h.run('chain();var A=newFleet(E,1,[{c:"kor"}],"Ana");A.combat=2;F.joinFleet=A.id;orderMove(F,1);frame();');
 eq(h.run('F.joinFleet===A.id'));eq(h.run('F.ships.length'),1);h.run('A.combat=0;frame();');eq(h.run('A.ships.length'),2);
});
test('yıkılmış ana filo takibi açık iş bırakmaz',()=>{
 const h=fresh();h.run('chain();F.joinFleet=999999;orderMove(F,1);frame();');eq(h.run('F.joinFleet === undefined'));eq(h.run('F.rallyTo === undefined'));
});
test('v8 hareket ortası yükleme rota sırasını korur',()=>{
 const h=fresh();h.run('chain();orderMove(F,1);stepFleets(.01);orderMove(F,3);var id=F.id,rng=RND_STATE,txt=serialize();deserialize(txt);F=G.fleets.find(f=>f.id===id);frame();');
 eq(h.run('F.sys'),1);eq(h.run('JSON.stringify(F.path)'),'[2,3]');eq(h.run('RND_STATE===rng'));eq(h.run('JSON.parse(txt).v'),8);
});
test('alternatif aramada radyasyon cezası değişmez',()=>{
 const h=fresh();h.run('link(0,1);link(1,2);link(0,3);link(3,2);G.sys[1].radiation=true;G.sys[3].x=100;G.sys[3].y=100;');
 eq(h.run('JSON.stringify(findPathAllowed(E,F,0,2))'),'[3,2]');
});
test('izin kalkınca kapalı durağa dolambaçlı yol da giremez',()=>{
 const h=fresh();h.run('link(0,1);link(1,2);link(0,3);link(3,1);G.sys[1].owner=O.id;O.passage[E.id]=true;orderMove(F,2);delete O.passage[E.id];');
 // Kapalı ara düğüm geçilemez; eski rotadaki bu durağı atlayıp sınır aşma yok.
 h.run('frame();');eq(h.run('F.sys'),0);eq(h.run('F.path.length'),0);
});
test('planlanmış bağlantı silinirse aynı durağa izinli alternatif bulunur',()=>{
 const h=fresh();h.run('link(0,1);link(0,3);link(3,1);orderMove(F,1);G.sys[0].lanes=[3];G.sys[1].lanes=[3];frame();');
 eq(h.run('JSON.stringify(F.path)'),'[3,1]');h.run('frame();frame();');eq(h.run('F.sys'),1);
});
test('başlamış bacak iptal edilmez; sonraki kapalı sınır durdurur',()=>{
 const h=fresh();h.run('chain();G.sys[1].owner=G.sys[2].owner=O.id;O.passage[E.id]=true;orderMove(F,2);stepFleets(.01);delete O.passage[E.id];frame();');
 eq(h.run('F.sys'),1);h.run('frame();');eq(h.run('F.sys'),1);eq(h.run('F.path.length'),0);
});
test('saf yol araması oyun verisi ve RNG değiştirmez',()=>{
 const h=fresh();h.run('gate(0);gate(4);var before=JSON.stringify([G.emps,G.sys,RND_STATE]);for(let i=0;i<30;i++)findPathAllowed(E,F,0,4);');eq(h.run('JSON.stringify([G.emps,G.sys,RND_STATE])===before'));
});
test('ikmal ana filonun hareket halindeki varışını izler',()=>{
 const h=fresh();h.run('chain();var A=newFleet(E,1,[{c:"kor"}],"Ana");orderMove(A,3);stepFleets(.01);F.joinFleet=A.id;orderMove(F,1);frame();');
 eq(h.run('F.joinFleet===A.id'));eq(h.run('F.path[0]'),2);
});
test('tek yeni bacakta konum koordinatları varışla eşleşir',()=>{
 const h=fresh();h.run('chain();orderMove(F,1);frame();');eq(h.run('F.x'),h.run('G.sys[1].x'));eq(h.run('F.y'),h.run('G.sys[1].y'));
});
test('gerçek AI lojistik tikinde yıpranmış filo ikmale döner',()=>{
 const h=fresh(1);h.run('chain();link(5,6);link(6,7);link(7,8);for(let i=1;i<10;i++){G.sys[i].owner=-1;G.sys[i].x=i*1000;}F.sys=8;F.x=G.sys[8].x;F.ships[0].h=.2;E.ai=true;aiLogisticsTick();');
 eq(h.run('F.retreating'));eq(h.run('F.path.at(-1)'),0);h.run('for(let i=0;i<12;i++)frame();');eq(h.run('F.sys'),0);
});
test('bilim gemisi ikmal tabanında durur; koloni gemisi muaf kalır',()=>{
 const h=fresh();h.run('chain();link(5,6);link(6,7);for(let i=1;i<10;i++){G.sys[i].owner=-1;G.sys[i].x=i*1000;}F.sys=5;F.ships=[{c:"bil",h:1}];orderMove(F,6);frame();');
 eq(h.run('F.sys'),5);eq(h.run('F.stalled'));h.run('F.ships=[{c:"kol",h:1}];orderMove(F,6);frame();');eq(h.run('F.sys'),6);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
