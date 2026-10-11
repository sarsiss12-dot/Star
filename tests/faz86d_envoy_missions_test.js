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

// Real v8 deserialize and serialize. No stub for migration/economy/load code.
test('Eski true kaydı Yakınlaşma olur; false silinir, olmayan alan eklenmez',()=>{
 const h=fresh(), d=JSON.parse(h.run('serialize()'));
 d.emps[0].envoy={'1':true,'3':false};delete d.emps[4].envoy;
 h.sb.oldSave=JSON.stringify(d);h.run('deserialize(oldSave)');
 eq(h.run('G.p.envoy[1].task'),'yakinlasma');eq(h.run('G.p.envoy[1].months'),0);
 eq(h.run('G.p.envoy[1].lastMonth===envoyMonth()'));
 eq(h.run('Object.hasOwn(G.p.envoy,3)'),false);eq(h.run('Object.hasOwn(G.emps[4],"envoy")'),false);
 eq(h.run('G.day'),d.day);eq(h.run('RND_STATE'),d.rs);
 eq(JSON.stringify(h.run('G.p.res')),JSON.stringify(d.emps[0].res));
 eq(JSON.stringify(h.run('G.p.rel')),JSON.stringify(d.emps[0].rel));
});
test('Göç iki kez aynı sonucu verir; ilişkiler, RNG ve gün ilerlemez',()=>{
 const h=fresh();h.run('A.envoy={1:true,3:false};normalizeEnvoys();var before=state();normalizeEnvoys();');
 eq(h.run('state()===before'));
});
test('Göç savaşta atamayı korur, katkıyı duraklatır',()=>{
 const h=fresh();h.run('A.envoy={1:true};B.war[A.id]=true;normalizeEnvoys();');
 eq(h.run('!!A.envoy[1]'));eq(h.run('envoyStatus(A,1).active'),false);
});
test('Geçersiz tür/görev/hedef temizlenir; gelecekteki ay ve negatif kıdem düzelir',()=>{
 const h=fresh();h.run(`A.envoy=JSON.parse('{"1":{"task":"ticaret","months":-3,"lastMonth":9999999},"3":{"task":"ZEHIR","months":50},"4":7,"999":true,"01":true,"__proto__":true}');
  normalizeEnvoys();`);
 eq(h.run('Object.keys(A.envoy).join(",")'),'1');eq(h.run('A.envoy[1].months'),0);
 eq(h.run('A.envoy[1].lastMonth===envoyMonth()'));
 h.run('A.envoy[1].months=NaN;A.envoy[1].lastMonth=Infinity;normalizeEnvoys();');
 eq(h.run('A.envoy[1].months'),0);eq(h.run('A.envoy[1].lastMonth===envoyMonth()'));
});
test('Geçerli görev kaydı nesne kimliğiyle korunur; üst kıdem sınırı uygulanır',()=>{
 const h=fresh();h.run(`A.envoy={1:{task:'guvenlik',months:36,lastMonth:envoyMonth()}};
 var ref=A.envoy[1];normalizeEnvoys();`);
 eq(h.run('ref===A.envoy[1]'));eq(h.run('A.envoy[1].months'),36);
 h.run('ref.months=1e20;normalizeEnvoys();');eq(h.run('ref.months'),Number.MAX_SAFE_INTEGER);
});
test('Yeni kayıt yüklemesi ve tekrarı görev/kıdem/ilişki/RNG korur',()=>{
 const h=fresh();h.run(`setEnvoyTask(A,B.id,'guvenlik');A.envoy[B.id].months=17;
 var saved=serialize(), expected=JSON.stringify(A.envoy),rels=JSON.stringify(A.rel),rng=RND_STATE;
 deserialize(saved);deserialize(serialize());`);
 eq(h.run('JSON.stringify(G.p.envoy)===expected'));eq(h.run('JSON.stringify(G.p.rel)===rels'));
 eq(h.run('RND_STATE===rng'));eq(JSON.parse(h.run('serialize()')).v,8);
});

for(const task of ['yakinlasma','ticaret','guvenlik'])test(task+' atanır, ücret/RNG/ilişki değiştirmez',()=>{
 const h=fresh();h.sb.task=task;
 h.run('var money=JSON.stringify(A.res),rng=RND_STATE,rel=JSON.stringify(A.rel);');
 eq(h.run('setEnvoyTask(A,1,task).ok'));eq(h.run('A.envoy[1].task'),task);
 eq(h.run('A.envoy[1].months'),0);eq(h.run('JSON.stringify(A.res)===money&&RND_STATE===rng&&JSON.stringify(A.rel)===rel'));
});
for(const [name,setup] of [
 ['temas yok','delete A.contact[1]'],['kaynak savaşta','A.war[1]=true'],
 ['hedef savaşta','B.war[0]=true'],['kaynak Arındırıcı',"A.mizac='izolasyonist'"],
 ['hedef Arındırıcı',"B.mizac='izolasyonist'"],['hedef ölü','B.dead=true'],
 ['kaynak ölü','A.dead=true'],['korsan','B.wild=true'],['kriz','B.crisisSide=true']
])test('Atama kapısı: '+name+' → mutasyonsuz ret',()=>{
 const h=fresh();h.run(setup+';var before=state();');
 eq(h.run("setEnvoyTask(A,1,'ticaret').ok"),false);eq(h.run('state()===before'));
});
test('Kendine, olmayan hedefe ve bilinmeyen göreve atama yapılamaz',()=>{
 const h=fresh();for(const expr of ["setEnvoyTask(A,0,'ticaret')","setEnvoyTask(A,999,'ticaret')",
 "setEnvoyTask(A,1,'ZEHIR')","setEnvoyTask(A,1,'constructor')","setEnvoyTask(A,1,'__proto__')"])
 eq(h.run(expr+'.ok'),false);
 eq(h.run('envoysUsed(A)'),0);
});
test('Kapasite doluyken yeni atama reddedilir, görev değişimi yer kullanmaz',()=>{
 const h=fresh();h.run(`A.colonies=[];A.mods.dipMul=0;setEnvoyTask(A,1,'yakinlasma');
 setEnvoyTask(A,3,'ticaret');A.envoy[1].months=20;`);
 eq(h.run('envoyCap(A)'),2);eq(h.run("setEnvoyTask(A,4,'ticaret').ok"),false);
 eq(h.run("setEnvoyTask(A,1,'guvenlik').action"),'change');eq(h.run('envoysUsed(A)'),2);
 eq(h.run('A.envoy[1].months'),0);
});
test('Aynı görevi seçmek kaydı, kıdemi ve aylık işaretini değiştirmez',()=>{
 const h=fresh();h.run(`setEnvoyTask(A,1,'ticaret');A.envoy[1].months=20;var ref=A.envoy[1],before=state();`);
 eq(h.run("setEnvoyTask(A,1,'ticaret').changed"),false);eq(h.run('state()===before&&A.envoy[1]===ref'));
});
test('Savaşta görev değişmez; geri çekme yer açar; yeniden atama kıdem 0',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=40;A.war[1]=true;");
 eq(h.run("setEnvoyTask(A,1,'guvenlik').ok"),false);eq(h.run('A.envoy[1].months'),40);
 eq(h.run('recallEnvoy(A,1).ok'));eq(h.run('envoysUsed(A)'),0);
 h.run("delete A.war[1];setEnvoyTask(A,1,'ticaret');");eq(h.run('A.envoy[1].months'),0);
});
test('Eski assignEnvoy toggle çağıranları boolean dönüşle çalışır',()=>{
 const h=fresh();eq(h.run('assignEnvoy(A,1)'));eq(h.run('A.envoy[1].task'),'yakinlasma');
 eq(h.run('assignEnvoy(A,1)'));eq(h.run('envoysUsed(A)'),0);
});
test('Ölen hedef kapasiteyi boşaltır; aylık temizlik kaydı siler',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');B.dead=true;");
 eq(h.run('envoysUsed(A)'),0);h.run('nextEnvoyMonth()');eq(h.run('Object.hasOwn(A.envoy,1)'),false);
});

for(const [task,expected]of [['yakinlasma',2.2],['ticaret',.9],['guvenlik',.8]])test(task+' ilk aktif ay: gerçek ilişki kazancı ve karşılıklı oran',()=>{
 const h=fresh();h.sb.task=task;h.run('setEnvoyTask(A,1,task);envoyTick();');
 eq(h.run('A.rel[1]'),0);h.run('nextEnvoyMonth();');near(h.run('A.rel[1]'),expected);
 near(h.run('B.rel[0]'),expected*.6);eq(h.run('A.envoy[1].months'),1);
 h.run('var before=state();envoyTick();');eq(h.run('state()===before'));
});
test('Kıdem 12 ve 36 aktif ayda artar; yakınlaşma doygunluğu korunur',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'yakinlasma');for(let i=0;i<11;i++)nextEnvoyMonth();");
 eq(h.run('envoyStatus(A,1).rank'),0);h.run('A.rel[1]=0;nextEnvoyMonth();');
 eq(h.run('envoyStatus(A,1).rank'),1);near(h.run('A.rel[1]'),2.42);
 h.run('for(let i=0;i<23;i++)nextEnvoyMonth();');eq(h.run('A.envoy[1].months'),35);
 h.run('A.rel[1]=55;nextEnvoyMonth();');eq(h.run('envoyStatus(A,1).rank'),2);
 near(h.run('A.rel[1]'),55+2.2*1.2*.05);
});
for(const [name,setup,undo]of [
 ['savaş','B.war[0]=true','delete B.war[0]'],
 ['temas kesilmesi','delete A.contact[1]','A.contact[1]=true'],
 ['doktrin kilidi',"B.mizac='izolasyonist'","B.mizac='tuccar'"]
])test(name+': kıdem/ilişki durur, dönüşte geçmiş aylar verilmez',()=>{
 const h=fresh();h.run(`setEnvoyTask(A,1,'ticaret');nextEnvoyMonth();${setup};
 var rel=A.rel[1],months=A.envoy[1].months;for(let i=0;i<20;i++)nextEnvoyMonth();`);
 eq(h.run('A.rel[1]===rel&&A.envoy[1].months===months'));
 eq(h.run('envoyStatus(A,1).active'),false);h.run(undo+';nextEnvoyMonth();');
 eq(h.run('A.envoy[1].months'),2);eq(h.run('envoyStatus(A,1).active'));
});
test('Gerçek monthTick atamayı tam bir ay ilerletir; araya UI/quote çağrısı ay eklemez',()=>{
 const h=fresh();h.run(`setEnvoyTask(A,1,'ticaret');monthTick();`);
 eq(h.run('A.envoy[1].months'),1);
 h.run('for(let i=0;i<20;i++){envoyStatus(A,1);dealQuote(offer);}envoyTick();');
 eq(h.run('A.envoy[1].months'),1);
});
test('Gerçek spyTick: aktif elçi +0.35, savaşta yalnız mevcut temas katkısı',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');spyTick();");near(h.run('A.intelP[1]'),.63);
 h.run('A.intelP[1]=0;B.war[0]=true;spyTick();');near(h.run('A.intelP[1]'),.28);
 h.run('A.intelP[1]=0;delete A.contact[1];spyTick();');near(h.run('A.intelP[1]'),0);
});

// Factor tests exercise both production evalOffer and the pure weighted helper.
test('Elçi yok → aynı nötr değerlendirme',()=>{
 const h=fresh();eq(h.run('evalOffer(B,offer).factors.envoy'),1);
});
for(const [task,kind,expected]of [['yakinlasma','sys',1.04],['ticaret','res',1.10],
 ['ticaret','ally',1],['guvenlik','ally',1.10],['guvenlik','res',1]])test(task+' uzman: '+kind+' kapsamı',()=>{
 const h=fresh();h.sb.task=task;h.sb.kind=kind;
 h.run('setEnvoyTask(A,1,task);A.envoy[1].months=36;');
 near(h.run('envoyDealFactor(B,A,[{it:{t:kind},value:100}])'),expected);
});
test('Gerçek evalOffer ticaret görevini ve kıdem artışını kullanır',()=>{
 const h=fresh();h.run("var initial=evalOffer(B,offer);setEnvoyTask(A,1,'ticaret');");
 near(h.run('evalOffer(B,offer).factors.envoy'),1.04);
 h.run('A.envoy[1].months=12;');near(h.run('evalOffer(B,offer).factors.envoy'),1.07);
 h.run('A.envoy[1].months=36;');near(h.run('evalOffer(B,offer).factors.envoy'),1.10);
 eq(h.run('evalOffer(B,offer).rawCost===initial.rawCost&&evalOffer(B,offer).rawGain===initial.rawGain'));
 eq(h.run('evalOffer(B,offer).why.some(s=>s.includes("Elçi"))'));
});
test('1 birim kaynak + 999 birim ittifak: ticaret bonusu tüm pakete yayılmaz',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=36;");
 near(h.run("envoyDealFactor(B,A,[{it:{t:'res'},value:1},{it:{t:'ally'},value:999}])"),1.0001);
});
test('İki elçi aynı faydaya yığılmaz; farklı görevler maddelere ayrı uygulanır',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');setEnvoyTask(B,0,'ticaret');A.envoy[1].months=B.envoy[0].months=36;");
 near(h.run('evalOffer(B,offer).factors.envoy'),1.1);
 h.run("setEnvoyTask(B,0,'guvenlik');B.envoy[0].months=36;");
 near(h.run("envoyDealFactor(B,A,[{it:{t:'res'},value:200},{it:{t:'ally'},value:800}])"),1.1);
});
test('Negatif/sıfır fayda veya redundant madde bonus alamaz',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=36;");
 for(const parts of ['[]',"[{it:{t:'res'},value:0}]","[{it:{t:'res'},value:-5}]",
 "[{it:{t:'res'},value:100},{it:{t:'sys'},value:-200}]",
 "[{it:{t:'pact'},value:100,effective:false}]"])
 eq(h.run('envoyDealFactor(B,A,'+parts+')'),1);
 h.run('A.pact[1]=B.pact[0]=true;offer.give=[{t:"pact"}];');
 eq(h.run('evalOffer(B,offer).factors.envoy'),1);
});
test('Savaş ve doktrin elçi faktörünü sıfırlar; hardLock ayrı kalır',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=36;B.war[0]=true;");
 eq(h.run('evalOffer(B,offer).factors.envoy'),1);
 h.run("delete B.war[0];B.mizac='izolasyonist';");eq(h.run('evalOffer(B,offer).hardLock'));
});
test('Yetersiz Etki elçiyle aşılamaz; gerçek aiRespond geçersiz teklifi reddeder',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'guvenlik');A.envoy[1].months=36;A.res.etk=0;offer.give=[{t:'ally'}];");
 eq(h.run('dealQuote(offer).ok'),false);
 const result=h.run('aiRespond(B,offer)');
 eq(result.v,'red');
});
test('Saf durum/faktör 100 çağrıda G ve RNG değiştirmez (legacy dahil)',()=>{
 const h=fresh();h.run(`A.envoy={1:true};var before=state();
 for(let i=0;i<100;i++){envoyStatus(A,1);envoyGate(A,1);envoyDealFactor(B,A,[{it:{t:'res'},value:100}]);}`);
 eq(h.run('state()===before'));
});
test('Gerçek aiRespond aynı geçerli teklife aynı yanıtı verir; kıdemi tüketmez',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=36;var before=JSON.stringify(A.envoy),rng=RND_STATE;");
 eq(h.run('JSON.stringify(aiRespond(B,offer))===JSON.stringify(aiRespond(B,offer))'));
 eq(h.run('JSON.stringify(A.envoy)===before&&RND_STATE===rng'));
});
test('Anlaşma rollback elçi nesnesini/alias/kıdemi korur',()=>{
 const h=fresh();h.run(`setEnvoyTask(A,1,'ticaret');A.envoy[1].months=36;
 var ref=A.envoy[1];B._envoyAlias=ref;var money=JSON.stringify([A.res,B.res]),rng=RND_STATE;
 G._dealFailInject=stage=>{if(stage==='after:cost')throw Error('fault');};`);
 eq(h.run('executeDeal(offer)'),false);eq(h.run('A.envoy[1]===ref&&B._envoyAlias===ref&&ref.months===36'));
 eq(h.run('JSON.stringify([A.res,B.res])===money&&RND_STATE===rng'));
});

// Real UI actions/renderers. No menu/act/modal stub.
test('Elçi menüsünü aç/kapat: atama yapmaz, duraklamayı korur, hedef adını kaçırır',()=>{
 const h=fresh();h.run(`B.name='<img src=x onerror=bad>';var before=JSON.stringify(A.envoy);UI.act('envoy',1);`);
 const html=h.elements.get('modal').innerHTML;
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));
 eq((html.match(/data-a="envoyTask"/g)||[]).length,3);
 eq(h.run('JSON.stringify(A.envoy)===before'));h.run("UI.act('closem');");eq(h.run('G.speed'),0);
});
test('UI atama/değişim/aynı görev/geri çekme gerçek kaydı ve doğru logu üretir',()=>{
 const h=fresh();h.run("G.speed=3;UI.act('envoy',1);UI.act('envoyTask','1:ticaret');");
 eq(h.run('A.envoy[1].task'),'ticaret');eq(h.run('G.speed'),3);
 h.run("A.envoy[1].months=20;UI.act('envoy',1);UI.act('envoyTask','1:ticaret');");eq(h.run('A.envoy[1].months'),20);
 h.run("UI.act('envoy',1);UI.act('envoyTask','1:guvenlik');");eq(h.run('A.envoy[1].months'),0);
 eq(h.run('A.envoy[1].task'),'guvenlik');
 h.run("UI.act('envoy',1);UI.act('envoyRecall','1');");eq(h.run('envoysUsed(A)'),0);
 assert.ok(h.run('JSON.stringify(G.log)').includes('Elçi geri çekildi'));
});
test('UI kapasite/savaş retlerinde menü kalır, kıdem kaybolmaz',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=20;B.war[0]=true;UI.act('envoy',1);");
 let html=h.elements.get('modal').innerHTML;
 assert.ok(html.includes('Duraklatıldı'));assert.ok(html.includes('envoyRecall'));
 eq((html.match(/disabled/g)||[]).length,3);
 h.run("UI.act('envoyTask','1:guvenlik');");eq(h.run('A.envoy[1].months'),20);
 eq(h.elements.get('modal').className,'');h.run("UI.act('envoyRecall','1');");eq(h.run('envoysUsed(A)'),0);
});
test('Sistem paneli ve ilişki sayfası görev/kıdem özetini gösterir',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'ticaret');A.envoy[1].months=12;View.selSys=G.sys[B.home];View.sel=null;");
 const system=h.run('UI.p_sistem()');assert.ok(system.includes('Ticari heyet'));assert.ok(system.includes('12 aktif ay'));
 h.run("UI.openDiplo();UI.act('diploPick',1);");const html=h.elements.get('diploPane').innerHTML;
 assert.ok(html.includes('Ticari heyet'));assert.ok(html.includes('ELÇİ GÖREVİ'));
});
test('Devlet listesinde görev özeti, ilişki sayfasında görev düğmesi bulunur',()=>{
 const h=fresh();h.run("setEnvoyTask(A,1,'guvenlik');UI.openDiplo();");
 const html=h.elements.get('diploPane').innerHTML;
 assert.ok(html.includes('class="dpList"'));assert.ok(html.includes('data-a="diploPick" data-x="1"'));assert.ok(html.includes('Güvenlik teması'));
 h.run("UI.act('diploPick',1);");assert.ok(h.elements.get('diploPane').innerHTML.includes('data-a="envoy" data-x="1"'));
});

// AI chooses a task without drawing extra random numbers.
for(const [name,setup,want]of [
 ['düşük ilişki','A.rel[1]=-30','yakinlasma'],
 ['ticaret ortağı','A.rel[1]=40;A.pact[1]=true','ticaret'],
 ['ortak düşman','A.rel[1]=-30;A.war[C.id]=B.war[C.id]=true','guvenlik']
])test('AI görev seçimi: '+name+'; deterministik ve RNG tüketmez',()=>{
 const h=fresh();h.run(setup+';var rng=RND_STATE;');eq(h.run('aiEnvoyTask(A,B)'),want);
 eq(h.run('aiEnvoyTask(A,B)'),want);eq(h.run('RND_STATE===rng'));
});
test('Gerçek aiEnvoyTurn tek RNG kapısıyla nesne kaydı atar, yeniden atamaz',()=>{
 const h=fresh();h.run(`A.contact={1:true};A.rel[1]=40;A.pact[1]=true;
 rndSeed(11);var seed=RND_STATE;var sample=rnd(),after=RND_STATE;rndSeed(seed);
 aiEnvoyTurn(A,{dip:1});`);
 // Probability is 0.8; fixed seed must actually pass, no rnd stub.
 eq(h.run('sample<.8'));eq(h.run('A.envoy[1].task'),'ticaret');eq(h.run('RND_STATE===after'));
 h.run('A.envoy[1].months=20;var record=A.envoy[1],rng=RND_STATE;aiEnvoyTurn(A,{dip:1});');
 eq(h.run('A.envoy[1]===record&&record.months===20&&RND_STATE===rng'));
});
test('Gerçek aiTurn elçi görev hattına ulaşır (üretim planlayıcısı)',()=>{
 const h=fresh();h.run(`B.contact={0:true};B.rel[0]=45;B.pact[0]=true;
 for(let i=0;i<30&&!envoyRecord(B,0);i++){G.day+=30;aiTurn(B);}`);
 eq(h.run('!!envoyRecord(B,0)'));eq(h.run('typeof B.envoy[0]'),'object');
 eq(h.run('Object.hasOwn(ENVOY_TASKS,B.envoy[0].task)'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
