'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const SAVE=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
function fresh(){
 const h=runtime();h.loadSave(SAVE);
 h.run(`var A=G.p,B=G.emps[1],C=G.emps[3],D=G.emps[4];
 for(const e of G.emps){
  if(e.wild||e.crisisSide)continue;
  e.dead=false;e.civics=[];e.mizac='tuccar';e._pers='tuccar';e.persLock='tuccar';
  e.ethics={mil:0,aut:0,mat:0,ahl:0};e.envoy={};e.war={};e.pact={};e.nap={};e.ally={};
  e.spy={};e.intel={};e.intelP={};e.contact={};e.rel={};
  for(const o of G.emps){if(o===e||o.wild||o.crisisSide)continue;e.contact[o.id]=true;e.rel[o.id]=0;}
  for(const r of ['min','ene','yiy','tuk','ala','etk'])e.res[r]=10000;
  recalcMods(e);e.mods.dipMul=0;e.mods.sensor=0;
 }
 G.speed=0;
 function nextEnvoyMonth(){G.month++;if(G.month>12){G.month=1;G.year++;}envoyTick();}
 function state(){return JSON.stringify({G,RND_STATE});}
 var offer={from:A.id,to:B.id,give:[{t:'res',r:'min',v:500}],want:[{t:'res',r:'ene',v:100}]};
 `);
 return h;
}

function html(h){return h.elements.get('diploPane').innerHTML;}
function relation(h,id=1){h.run(`UI.selectDiplo(${id},'relation')`);return html(h);}
function count(s,pattern){return (s.match(pattern)||[]).length;}
function modal(h){return h.doc.getElementById('modal').innerHTML;}

test('Devlet listesi yalnız temaslı yaşayan normal devletleri seçtirir',()=>{
 const h=fresh();h.run('delete A.contact[3];D.dead=true;UI.openDiplo();');const s=html(h);
 assert.ok(s.includes('data-a="diploPick" data-x="1"'));assert.ok(!s.includes('data-a="diploPick" data-x="3"'));
 assert.ok(!s.includes('data-a="diploPick" data-x="4"'));assert.ok(!s.includes('data-a="diploPick" data-x="0"'));
 eq(count(s,/role="tab"/g),3);eq(count(s,/aria-selected="true"/g),1);
});
test('Temassız dünya açıklama gösterir, ilişki ve müzakere devre dışıdır',()=>{
 const h=fresh();h.run('A.contact={};UI.openDiplo()');const s=html(h);
 assert.ok(s.includes('Henüz temas kurulmadı'));eq(count(s,/disabled/g),2);
 h.run("UI.act('diploPick',1);UI.act('diploNav','deal')");eq(h.run('UI.deal==null'));
});
for(const [filter,setup,id] of [['war','A.war[1]=true',1],['ally','A.ally[3]=true',3],['envoy',"setEnvoyTask(A,4,'ticaret')",4]]){
 test('Devlet filtresi: '+filter,()=>{
  const h=fresh();h.run(setup+`;UI.act('diploFilter','${filter}');`);
  eq(count(html(h),/data-a="diploPick"/g),1);assert.ok(html(h).includes(`data-a="diploPick" data-x="${id}"`));
 });
}
test('Sağ panel tek ilişki girişi; pakt ve NAP doğru adlarla görünür',()=>{
 const h=fresh();h.run('A.pact[1]=B.pact[0]=true;View.selSys=G.sys[B.home];View.sel=null;');
 let s=h.run('UI.p_sistem()');assert.ok(s.includes('Ticaret paktı'));assert.ok(!s.includes('Saldırmazlık'));
 eq(count(s,/data-a="diploRelation"/g),1);eq(count(s,/data-a="deal"/g),0);
 h.run('A.nap[1]=B.nap[0]=G.day+60');s=h.run('UI.p_sistem()');assert.ok(s.includes('Saldırmazlık · 2 ay'));
});
test('Elçi, ticaret, geçiş, sensör ve casus ağı ayrı doğru durumlar',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=12;A.pact[1]=B.pact[0]=true;A.spynet={1:true};A.visionFrom={1:true};B.passage={0:true};");
 const s=relation(h);for(const text of ['12 aktif ay','Ticari heyet','ELÇİ GÖREVİ','Casusluk ağı','Sana sensör paylaşımı','Onun sınırı sana açık','Ticaret paktı'])assert.ok(s.includes(text),text);
 assert.ok(!s.includes('Senin sınırın ona açık'));
 eq(count(s,/data-a="deal"/g),1);eq(count(s,/data-a="envoy"/g),1);
});
test('Vasal özeti tür, öfke ve oyuncunun aldığı vergiyi korur',()=>{
 const h=fresh();h.run("B.overlord=0;B.vassalType='haracguzar';B.vassalAnger=42;B.vassalPaid=15;");
 const s=relation(h);for(const text of ['SENİN VASALIN','42/100','15/ay',h.run('VASSAL_TYPES.haracguzar.n')])assert.ok(s.includes(text),text);
});
test('Gizli diplomasi, federasyon, konsey ve istihbarat hâlâ erişilir',()=>{
 const h=fresh();h.run('UI.openDiplo()');for(const a of ['whisperMenu','opLogMenu','fedPane','cncPane'])assert.ok(html(h).includes(`data-a="${a}"`));
 h.run("UI.act('whisperMenu')");assert.ok(modal(h).includes('FISILTI AĞI'));
 relation(h);h.run("UI.act('spyOpen',1)");eq(h.run('UI.spyTarget'),1);eq(h.run('UI.cur'),'intel');
});
test('Savaş eylemi boolean izinle çalışır ve önce hedef seçtirir',()=>{
 const h=fresh();eq(h.run('canDeclareWarOn(A,B)'),true);const s=relation(h);
 assert.ok(/data-a="war" data-x="1"\s*>/.test(s));
 h.run("UI.act('war',1)");assert.ok(modal(h).includes('SAVAŞ HEDEFİ'));eq(h.run('!!A.war[1]'),false);
});
test('Doktrin engeli ilişkiyi açar; elçi/hediye yok, müzakere disabled',()=>{
 const h=fresh();h.run("B.mizac='izolasyonist';B._pers='izolasyonist';B.persLock='izolasyonist';");
 eq(h.run('diploBlocked(A,B)'));const s=relation(h);
 assert.ok(s.includes('Doktrin'));assert.ok(/data-a="deal" data-x="1" disabled/.test(s));
 assert.ok(!s.includes('data-a="envoy"'));assert.ok(!s.includes('data-a="gift"'));assert.ok(s.includes('data-a="spyOpen"'));
});
test('Gezinme dünya, kaynaklar, ilişkiler, hafıza ve RNG değiştirmez',()=>{
 const h=fresh();h.run('var before=state();UI.openDiplo();');
 for(let i=0;i<4;i++)h.run("UI.act('diploPick',1);UI.act('diploNav','deal');UI.act('diploNav','states');UI.act('closeDiplo');UI.openDiplo();");
 eq(h.run('state()===before'));
});
test('Taslak aynı hedefe dönünce maddeleri, ömrü ve nesne kimliğini korur',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give.push({t:'res',r:'min',v:500});UI.deal.born=G.day;UI.deal.expires=G.day+30;var draft=UI.deal;UI.act('dealBack');UI.act('diploNav','states');UI.act('diploPick',1);UI.act('diploNav','deal');");
 eq(h.run('UI.deal===draft'));eq(h.run('UI.deal.give[0].v'),500);eq(h.run('UI.deal.expires===G.day+30'));
});
test('Devlet başına taslak ve karşı teklif birbirine karışmaz',()=>{
 const h=fresh();h.run(`UI.openDeal(1);UI.deal.give.push({t:'res',r:'min',v:500});var first=UI.deal;
 UI.dealCounter={from:1,to:0,give:[{t:'res',r:'ene',v:10}],want:[]};var counter=UI.dealCounter;
 UI.openDeal(3);UI.deal.give.push({t:'res',r:'ala',v:20});var second=UI.deal;`);
 eq(h.run('UI.dealCounter===null'));h.run('UI.openDeal(1)');eq(h.run('UI.deal===first&&UI.dealCounter===counter'));
 h.run('UI.openDeal(3)');eq(h.run('UI.deal===second&&UI.dealCounter===null'));
});
test('Kapatıp açma taslağı korur, temizleme yalnız seçili devleti temizler',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give.push({t:'res',r:'min',v:500});var first=UI.deal;UI.act('closeDiplo');UI.openDiplo();");
 eq(h.run('UI.deal===first'));h.run("UI.openDeal(3);UI.deal.want.push({t:'passage'});UI.act('dealDiscard');");eq(h.run('UI.deal.want.length'),0);
 h.run('UI.openDeal(1)');eq(h.run('UI.deal===first'));eq(h.run('UI.deal.give.length'),1);
});
test('Kayıt yüklemede açık taslak silinir ve eski teklif gönderilmez',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give.push({t:'res',r:'min',v:500});var sav=serialize();deserialize(sav);var before=state();UI.refresh();UI.dealSend();");
 eq(h.run('UI.deal===null'));eq(h.run('Object.keys(UI._diploDrafts).length'),0);eq(h.run('UI.diploPage'),'states');eq(h.run('state()===before'));
});
test('Yükleme sonrası eski karşı teklif kabulü/ret çağrısı dünyayı değiştirmez',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.dealCounter={from:1,to:0,give:[{t:'res',r:'min',v:500}],want:[]};var sav=serialize();deserialize(sav);var before=state();UI.act('ctrYes');UI.act('ctrNo');");
 eq(h.run('state()===before'));eq(h.run('UI.dealCounter===null'));
});
test('Ölen veya teması kaybolan hedefin taslağı açılmaz',()=>{
 const h=fresh();h.run('UI.openDeal(1);B.dead=true;UI.drawDeal()');eq(h.run('UI.deal===null'));eq(h.run('UI.diploPage'),'states');
 h.run('B.dead=false;delete A.contact[1];UI.openDeal(1)');eq(h.run('UI.deal===null'));
});
test('Liste ve hedeflerin kaydırma konumları ayrı korunur; eski scroll etkisiz',()=>{
 const h=fresh(),pane=h.doc.getElementById('diploPane');let body=null,raw=pane.innerHTML;
 Object.defineProperty(pane,'innerHTML',{get:()=>raw,set:v=>{raw=v;body=h.doc.createElement('div');}});
 pane.querySelector=()=>body;
 h.run('UI.openDiplo()');const old=body;old.scrollTop=190;old.emit('scroll');
 relation(h);body.scrollTop=77;body.emit('scroll');h.run("UI.act('diploNav','states')");eq(body.scrollTop,190);
 old.scrollTop=999;old.emit('scroll');eq(h.run("UI._dcScroll['states:all']"),190);
 relation(h);eq(body.scrollTop,77);
});
for(const lvl of [0,1,2,3])test('İstihbarat '+lvl+': kaynak, teknoloji ve mizaç kapıları',()=>{
 const h=fresh();h.run(`A.intel[1]=${lvl};B.res.min=987654;`);const s=relation(h);
 eq(s.includes('Kaynaklar:'),lvl>=3);eq(s.includes('Teknolojiler:'),lvl>=2);eq(s.includes('Mizaç:'),lvl>=2);
 eq(s.includes('Koloni sayısı:'),lvl>=1);assert.ok(s.includes(h.run('powerLabel(A,B)')));
});
test('Düşük istihbaratta gizli stok/teknoloji değişmesi ilişki HTML değiştirmez',()=>{
 const h=fresh();const first=relation(h);
 h.run("B.res.min=123456;B.res.ene=987654;B.techs={f_lazer2:true};B.war[3]=true;");
 eq(relation(h),first);
});
test('Yabancı üçüncü devletin adı yüksek istihbaratta da maskelenir',()=>{
 const h=fresh();h.run("A.intel[1]=3;delete A.contact[3];C.name='GIZLI_AD_314';B.war[3]=true;");const s=relation(h);
 assert.ok(s.includes('Bilinmeyen devlet'));assert.ok(!s.includes('GIZLI_AD_314'));
});
test('Düşük istihbaratta kaynak seçicisi stoktan bağımsız aynı seçenekleri sunar',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.dealAdd('want:res')");const first=modal(h);assert.ok(first.includes('stok bilinmiyor'));
 h.run("B.res.min=20;B.res.ene=7;UI.dealAdd('want:res')");eq(modal(h),first);
 h.run('UI._pick(0)');const amount=modal(h);h.run("B.res.min=999999;UI.dealAdd('want:res');UI._pick(0)");eq(modal(h),amount);
});
test('Yüksek istihbaratta kaynak seçicisi gerçek stokları kullanır',()=>{
 const h=fresh();h.run("A.intel[1]=3;B.res.min=1234;UI.openDeal(1);UI.dealAdd('want:res')");
 assert.ok(!modal(h).includes('stok bilinmiyor'));assert.ok(modal(h).includes(h.run('fmt(B.res.min)')));
});
test('İstihbaratsız teknoloji/lüks eylemi doğrudan çağrılsa da seçici açılmaz',()=>{
 const h=fresh();h.run('UI.openDeal(1)');const before=modal(h);
 h.run("UI.dealAdd('want:tech');UI.dealAdd('want:lux')");eq(modal(h),before);eq(h.run('UI.deal.want.length'),0);
 assert.ok(/data-x="want:tech" disabled/.test(html(h)));assert.ok(/data-x="want:lux" disabled/.test(html(h)));
});
test('Görülmemiş yabancı sistemler düşük istihbarat seçicisinde listelenmez',()=>{
 const h=fresh();h.run("var s=G.sys.find(x=>x.id!==B.home);s.owner=B.id;s.seen=[];s.name='GIZLI_SISTEM_314';UI.openDeal(1);UI.dealAdd('want:sys');");
 assert.ok(!modal(h).includes('GIZLI_SISTEM_314'));
 h.run("A.intel[1]=3;UI.dealAdd('want:sys')");assert.ok(modal(h).includes('GIZLI_SISTEM_314'));
});
test('Kendi teknoloji seçenekleri düşük istihbaratta rakibin envanterini açığa çıkarmaz',()=>{
 const h=fresh();h.run("A.techs={f_lazer2:true};B.techs={};UI.openDeal(1);UI.dealAdd('give:tech')");const first=modal(h);
 h.run("B.techs={f_lazer2:true};UI.dealAdd('give:tech')");eq(modal(h),first);
});
test('Düşük istihbaratta teklif önizlemesi evalOffer çağırmaz; üst düzeyde kaba tahmin',()=>{
 const h=fresh();h.run(`UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:500}];
 var originalEval=evalOffer,evalCalls=0;evalOffer=function(...a){evalCalls++;return originalEval(...a)};UI.drawDeal();`);
 eq(h.run('evalCalls'),0);h.run('A.intel[1]=2;UI.drawDeal()');eq(h.run('evalCalls'),1);
 assert.ok(html(h).includes('TUTUM TAHMİNİ'));assert.ok(!html(h).includes('Net değer'));
});
test('Süresi dolmuş teklif önizlemede ve gönderimde reddedilir; stok/RNG sabit',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:500}];UI.deal.born=G.day-60;UI.deal.expires=G.day-1;var before=state();UI.drawDeal();UI.dealSend();");
 assert.ok(/data-a="dealSend" disabled/.test(html(h)));assert.ok(html(h).includes('süresi dol'));eq(h.run('state()===before'));
});
test('Cömert teklif gerçek aiRespond ve executeDeal ile tek kez aktarılır',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:500}];var min=A.res.min,other=B.res.min;UI.dealSend();");
 eq(h.run('A.res.min'),9500);eq(h.run('B.res.min'),10500);eq(h.run('UI.deal===null'));
 h.run('UI.dealSend()');eq(h.run('A.res.min'),9500);h.run('UI.openDeal(1)');eq(h.run('UI.deal.give.length'),0);
});
test('Kötü teklif gerçek AI ret verir; kaynaklar ve RNG değişmez',()=>{
 const h=fresh();h.run("A.res.min=1;A.res.ene=A.res.ala=A.res.tuk=A.res.yiy=0;A.techs={};aiProfile(B);UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:1}];UI.deal.want=[{t:'res',r:'ene',v:5000}];var response=aiRespond(B,UI.deal);var before=state();UI.dealSend();");
 eq(h.run('response.v'),'red');eq(h.run('state()===before'));assert.ok(h.run('UI.dealMsg.length')>0);eq(h.run('UI.deal.want[0].v'),5000);
});
test('Karşı teklif hedef değiştirince saklanır; kabul yalnız o devleti etkiler',()=>{
 const h=fresh();h.run(`UI.openDeal(1);UI.dealCounter={from:1,to:0,give:[{t:'res',r:'min',v:500}],want:[]};
 UI.openDeal(3);var third=C.res.min;UI.openDeal(1);UI.act('ctrYes');`);
 eq(h.run('A.res.min'),10500);eq(h.run('B.res.min'),9500);eq(h.run('C.res.min===third'));eq(h.run('UI.dealCounter===null'));
});
test('Seçici açıkken hedef değişirse gecikmiş seçim yeni taslağa yazılmaz',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.dealAdd('give:res');var oldPick=UI._pick;UI.openDeal(3);oldPick(0);");
 eq(h.run('UI.deal.give.length'),0);eq(h.run('UI._diploDrafts[1].deal.give.length'),0);
});
test('Seçici açıkken kayıt yüklenirse gecikmiş callback etkisiz',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.dealAdd('give:res');UI._pick(0);var oldPick=UI._pick;var sav=serialize();deserialize(sav);var before=state();oldPick(0);");
 eq(h.run('state()===before'));eq(h.run('UI.deal.give.length'),0);
});
test('Diplomasi taslakları v8 kayda veya tercihlere eklenmez',()=>{
 const h=fresh();const keys=[...h.local.keys()].sort().join(',');
 h.run("UI.openDeal(1);UI.deal.give.push({t:'res',r:'min',v:314});var saved=JSON.parse(serialize());");eq(h.run('saved.v'),8);
 for(const k of ['deal','dealCounter','diploTarget','_diploDrafts'])eq(h.run(`Object.hasOwn(saved,'${k}')`),false);
 eq([...h.local.keys()].sort().join(','),keys);
});
test('Mobil CSS kontrolleri kapsamlıdır; tema değişkenleri tanımlıdır (yerleşim testi değil)',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const section=css.slice(css.indexOf('/* 86E'),css.indexOf('</style>'));
 assert.ok(section.length>100);for(const v of section.matchAll(/var\((--[\w-]+)\)/g))assert.ok(css.includes(v[1]+':'),v[1]);
 assert.ok(section.includes('min-height:44px'));assert.ok(section.includes('overflow:auto'));assert.ok(section.includes('minmax(0,1fr)'));
});
test('Gerçek AI karşı teklifi ayrı kalır; hedef değişiminden sonra aynı içerikle açılır',()=>{
 const h=fresh();h.run('B.intel[A.id]=3');h.run("UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:1}];UI.deal.want=[{t:'res',r:'ene',v:5000}];var draft=JSON.stringify(UI.deal);UI.dealSend();var counter=JSON.stringify(UI.dealCounter);UI.openDeal(3);UI.openDeal(1);");
 eq(h.run('JSON.stringify(UI.deal)===draft'));eq(h.run('JSON.stringify(UI.dealCounter)===counter'));eq(h.run('UI.dealCounter.from'),1);
 assert.ok(h.run('UI.dealCounter.want.length')>1);assert.ok(html(h).includes('Karşı teklifi kabul et'));
});
test('Temas kaybından sonra eski teklif doğrudan gönderilse de aktarılmaz',()=>{
 const h=fresh();h.run("UI.openDeal(1);UI.deal.give=[{t:'res',r:'min',v:500}];delete A.contact[1];var before=state();UI.dealSend();");
 eq(h.run('state()===before'));eq(h.run('UI.deal===null'));
});
test('Seçili devletin kendi hafızası gösterilir, karşı tarafın gizli hafızası gösterilmez',()=>{
 const h=fresh();h.run("remember(A,1,'hediye');remember(B,0,'sinirGergin');");
 const s=relation(h);for(const m of h.run('topMemories(A,1,4)'))assert.ok(s.includes(m.txt));
 const onlyOther=h.run('topMemories(B,0,4).filter(m=>!topMemories(A,1,4).some(n=>n.txt===m.txt))');
 for(const m of onlyOther)assert.ok(!s.includes(m.txt));
});
for(const lvl of [0,2,3])test('Süzerenlik onay ekranı da istihbarat kapılarını korur: '+lvl,()=>{
 const h=fresh();h.run(`A.intel[1]=${lvl};UI.vs={id:1,yon:'demand',tur:'haracguzar'};UI.vsDraw();`);
 const s=modal(h);assert.ok(!s.includes('Tahmini kabul şansı'));assert.ok(!s.includes('Yeterince güçlü değilsin ('));
 eq(s.includes('İstihbarat yetersiz'),lvl<2);assert.ok(s.includes('Etki bedeli'));assert.ok(s.includes('ŞART PAKETİ'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
