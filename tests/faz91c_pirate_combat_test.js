'use strict';
const assert=require('assert/strict'),path=require('path');
const {fresh:fixture}=require('./helpers/combat-feedback-fixture');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.message);}}
function fresh({guard=true,nest=true,reverse=false}={}){
 const h=fixture(ROOT,['muh','muh','muh'],['kor','kor']);
 h.run(`for(const s of G.sys){delete s.nest;delete s.ruin;s.claim=-1;}
 for(const e of G.emps){e.colonies=[];e.war={};e.passage={};}
 O.wild=true;G.wildId=O.id;G.nests=[];G.ruins=[];
 A.stance=B.stance='agresif';S.cr=1;S.seen=[0];S.surv=[0];G.vis=new Set([0,1]);
 var beforeWar=JSON.stringify(G.emps.map(e=>e.war));rndSeed(17);`);
 if(nest)h.run('S.nest={hp:1200,timer:120};G.nests=[S.id]');
 if(!guard)h.run('G.fleets=[A]');
 if(reverse)h.run('G.fleets.reverse()');
 return h;
}
test('korsan filosu savaş ilanı olmadan gerçek muharebeye girer',()=>{
 const h=fresh({nest:false});h.run('combatTick(.5)');
 assert.equal(h.run('S.battleReport&&S.battleReport.rounds'),1);
 assert.equal(h.run('JSON.stringify(G.emps.map(e=>e.war))'),h.run('beforeWar'));
});
test('korsan husumeti iki yönlü ve RNG tüketmeden hesaplanır',()=>{
 const h=fresh();h.run('var rng=RND_STATE;var yes=hostile(E.id,O.id)&&hostile(O.id,E.id)');
 assert.equal(h.run('yes'),true);assert.equal(h.run('RND_STATE'),h.run('rng'));
 assert.equal(h.run('hostile(O.id,O.id)'),false);
});
test('normal taraflar savaş ilanı olmadan çatışmaz',()=>{
 const h=fresh({nest:false});h.run('O.wild=false;combatTick(.5)');
 assert.equal(h.run('!!S.battleReport'),false);assert.equal(h.run('A.combat||B.combat'),0);
});
test('olmayan/ölü korsan tarafı hedef olamaz',()=>{
 const h=fresh();assert.equal(h.run('hostile(0,9999)'),false);
 h.run('O.dead=true');assert.equal(h.run('hostile(E.id,O.id)||hostile(O.id,E.id)'),false);
});
test('muhafızsız yuva hasar alır ve oyuncuya karşı ateş eder',()=>{
 const h=fresh({guard:false});h.run('var hull=fleetHealth(A);combatTick(.5)');
 assert.ok(h.run('S.nest.hp<1200'));assert.ok(h.run('fleetHealth(A)<hull'));
 assert.equal(h.run('S.battleReport.done'),false);
});
for(const reverse of [false,true])test('filo sırası yuvanın erken kaybetmesine yol açmaz '+reverse,()=>{
 const h=fresh({reverse});h.run('B.ships.forEach(s=>s.h=.00001);combatTick(.5)');
 assert.ok(h.run('S.nest&&S.nest.hp>0'));assert.equal(h.run('B.ships.length'),0);
 assert.equal(h.run('S.battleReport.done'),false);
 assert.equal(h.run('G.log.some(x=>x.m.includes("Korsanlar püskürtüldü"))'),false);
});
test('yuvanın dayanımı bitince kaldırılır ve ödül tekrarlanmaz',()=>{
 const h=fresh({guard:false});h.run(`S.nest.hp=1;var ala=E.res.ala,min=E.res.min,etk=E.res.etk;
 combatTick(.5);var after=JSON.stringify(E.res);for(var i=0;i<5;i++)combatTick(.5);`);
 assert.equal(h.run('S.nest'),null);assert.equal(h.run('G.nests.includes(S.id)'),false);
 assert.equal(h.run('S.battleReport.winner'),0);assert.equal(h.run('JSON.stringify(E.res)'),h.run('after'));
 assert.equal(h.run('E.res.min-min'),180);assert.equal(h.run('E.res.etk-etk'),40);
 assert.equal(h.run('E.res.ala-ala'),350); // 260 nest + existing 90 victory bounty
 assert.equal(h.run('G.log.filter(x=>x.m.includes("KORSAN YUVASI YOK EDİLDİ")).length'),1);
});
test('iki normal devletin savaşı taraf olmayan yuvaya hasar vermez',()=>{
 const h=fresh();h.run(`O.wild=false;G.emps[2].wild=true;G.wildId=2;
 E.war[O.id]=O.war[E.id]=true;combatTick(.5);`);
 assert.equal(h.run('S.nest.hp'),1200);
});
test('korsan yuvası sistemin normal sahibini hayatta tutan savunma sayılmaz',()=>{
 const h=fresh();h.run('S.owner=E.id;A.ships.forEach(s=>s.h=.000001);combatTick(.5)');
 assert.equal(h.run('A.ships.length'),0);assert.ok(h.run('S.nest.hp>0'));
 assert.equal(h.run('S.battleReport.done'),true);assert.equal(h.run('S.battleReport.winner'),h.run('O.id'));
});
test('normal devletin savaşı taraf olmayan kalıntıya hasar vermez',()=>{
 const h=fresh({nest:false});h.run(`O.wild=false;G.emps[2].wild=true;G.wildId=2;
 S.ruin={hp:3000,max:3000,awake:false,rw:'tech'};E.war[O.id]=O.war[E.id]=true;combatTick(.5);`);
 assert.equal(h.run('S.ruin.hp'),3000);assert.equal(h.run('S.ruin.awake'),false);
});
test('silahlı filo uyanan kalıntıyla karşılıklı savaşır',()=>{
 const h=fresh({guard:false,nest:false});h.run(`S.ruin={hp:3000,max:3000,awake:false,rw:'tech'};
 var hull=fleetHealth(A);combatTick(.5);`);
 assert.equal(h.run('S.ruin.awake'),true);assert.ok(h.run('S.ruin.hp<3000'));
 assert.ok(h.run('fleetHealth(A)<hull'));
});
test('korsanın sahip olduğu sisteme saldırı rotası engellenmez',()=>{
 const h=fresh({guard:false});h.run('S.owner=O.id');assert.equal(h.run('canEnter(E,S)'),true);
});
test('yuvanın varlığı tarafsız üçüncü devletin sınırını açmaz',()=>{
 const h=fresh({guard:false});h.run('S.owner=2');assert.equal(h.run('canEnter(E,S)'),false);
});
test('gerçek SALDIR eylemi rota kurar ve varıştan sonra yuvaya ateş açılır',()=>{
 const h=fresh({guard:false});h.run(`S.owner=-1;G.claim={};A.sys=1;A.x=G.sys[1].x;A.y=G.sys[1].y;
 UI.act('sendhere',A.id+':'+S.id);var ordered=A.path.includes(S.id)||!!A.mv;
 for(var i=0;i<2000&&A.sys!==S.id;i++){G.day+=.5;dailyTick(.5);}
 combatTick(.5);`);
 assert.equal(h.run('ordered'),true);assert.equal(h.run('A.sys'),0);
 assert.ok(h.run('!S.nest||S.nest.hp<1200'));
});
test('korsan filosu AI tehdit hesabına girer, barıştaki normal filo girmez',()=>{
 const h=fresh({nest:false});assert.ok(h.run('threatAt(E,S.id)>0'));
 h.run('O.wild=false');assert.equal(h.run('threatAt(E,S.id)'),0);
});
test('yuvadan gerçek ricat saldırganı hasardan önce çıkarır',()=>{
 const h=fresh({guard:false});h.run('A.stance="savunma";A.ships.forEach(s=>s.h=.2);var hull=fleetHealth(A);combatTick(.5)');
 assert.equal(h.run('fleetHealth(A)'),h.run('hull'));assert.equal(h.run('S.nest.hp'),1200);
 assert.equal(h.run('S.battleReport.retreat[0]'),1);
});
test('muhafız ricat etse de yuva aynı turda savaşa devam eder',()=>{
 const h=fresh();h.run('G.sys[1].owner=O.id;B.stance="savunma";B.ships.forEach(s=>s.h=.2);combatTick(.5)');
 assert.equal(h.run('S.battleReport.retreat[1]'),1);assert.equal(h.run('S.battleReport.rounds'),1);
 assert.ok(h.run('S.nest.hp<1200'));assert.equal(h.run('S.battleReport.done'),false);
});
test('geri çekilemeyen düşük gövdeli filo yuvaya karşı donmaz',()=>{
 const h=fresh({guard:false});h.run('S.lanes=[];A.stance="savunma";A.ships.forEach(s=>s.h=.2);combatTick(.5)');
 assert.equal(h.run('S.battleReport.rounds'),1);assert.ok(h.run('S.nest.hp<1200'));
});
test('panel salt varlığı sürmekte olan kuşatma diye göstermez',()=>{
 const h=fresh({guard:false});h.run('View.selSys=S;var html=UI.p_sistem()');
 assert.ok(h.run('html.includes("Korsanlara savaş ilanı gerekmez")'));
 assert.ok(h.run('html.includes("Filon yuvanın bulunduğu sistemde")'));
 h.run('combatTick(.5);html=UI.p_sistem()');assert.ok(h.run('html.includes("Filon korsanlarla savaşıyor")'));
});
test('v8 yüklemeden sonra korsan çatışması ve yuva dayanımı devam eder',()=>{
 const h=fresh({guard:false});h.run('combatTick(.5);var hp=S.nest.hp;var saved=serialize();deserialize(saved);G.sys[0].cr=1;combatTick(.5)');
 assert.equal(h.run('JSON.parse(saved).v'),8);assert.ok(h.run('G.sys[0].nest.hp<hp'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
