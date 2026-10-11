'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(actor=0,target=1){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var E=G.emps[${actor}],A=G.emps[${target}],B=G.emps[3],C=G.emps[4];
   for(const e of [E,A,B,C]){
     e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];e.opLog=[];e.hitLog=[];e.whisperLog=[];
     e.mem={};e.war={};e.ally={};e.res.etk=10000;e.res.ara=0;e.intel={};
     for(const o of [E,A,B,C])if(e!==o){e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=0;}
   }
   E.techs={};A.techs={t_tarim:true};E.name='GERCEK_AKTOR_871';C.name='MASUM_871';
   G.council=null;var messages=[];say=function(msg){messages.push(msg);};
   function dice(values){globalThis.draws=0;globalThis.rnd=function(){draws++;return values.shift()??.999;};}
   function state(){return JSON.stringify([G.emps,G.sys,G.log,G.inbox,RND_STATE]);}
 `);return h;
}
for(const framed of [false,true])for(const success of [false,true])for(const exposed of [false,true])
for(const actor of [0,2])test(`fısıltı actor=${actor}, iftira=${framed}, başarı=${success}, ifşa=${exposed}`,()=>{
 const h=fresh(actor);h.run(`dice([${success?0:.999},${exposed?0:.999}]);
   var before=E.res.etk;var r=${actor===0?'playerWhisper(A,B,':'runWhisper(E,A,B,'}${framed?'C':'null'});`);
 eq(h.run('r.resolved'));eq(h.run('r.basarili'),success);eq(h.run('r.ifsa'),exposed);
 eq(h.run('r.ok'),actor===0?true:success); // Eski iki farklı ok sözleşmesi korunur.
 eq(h.run('before-E.res.etk'),framed?80:45);eq(h.run('draws'),2);
 eq(h.run('E.opLog.length'),1);eq(h.run('E.opLog[0].cost'),framed?80:45);
 eq(h.run('E.opLog[0].outcome'),success?(exposed?'basari-ifsa':'basari'):(exposed?'ifsa':'sonucsuz'));
 eq(h.run('A.rel[B.id]'),success?-9:0);eq(h.run('B.rel[A.id]'),success?-9:0);
 eq(h.run('A.hitLog.length+B.hitLog.length'),0); // İkinci soruşturma izi yaratılmaz.
 if(actor===0){eq(h.run('E.whisperLog.length'),1);eq(h.run('E.whisperLog[0].ok'),success);}
 if(framed&&success&&exposed)eq(h.run("r.msg.includes('suç MASUM_871 üstüne yıkıldı')"),false);
});
for(const [label,setup] of [
 ['eski hedef','A={...A};'],['ölü hedef','A.dead=true;'],['temassız','E.contact[A.id]=false;'],
 ['ölü aktör','E.dead=true;'],['yetersiz kaynak','E.res.etk=0;'],['eski suçlanan','C={...C};'],
 ['aynı hedef','B=A;'],['savaşta','A.war[B.id]=true;']
])test('fısıltı '+label+': doğrudan motor saf ret',()=>{
 const h=fresh();h.run(`${setup}var before=state();var r=runWhisper(E,A,B,C);`);
 eq(h.run('r.resolved'),false);eq(h.run('r.ok'),false);eq(h.run('state()===before'));
});
for(const tur of ['tekno','sabotaj'])for(const outcome of ['basari','ifsa','sonucsuz'])
test('sahte bayrak '+tur+' '+outcome+': tek maliyet ve kayıt',()=>{
 const h=fresh();h.run(`dice(${outcome==='basari'?'[0, .999, .999]':outcome==='ifsa'?'[.999,0]':'[.999,.999]'});
   var before=E.res.etk;var r=falseFlagOp(E,A,C,'${tur}');`);
 eq(h.run('r.ok'));eq(h.run('r.outcome'),outcome);eq(h.run('r.basarili'),outcome==='basari');
 eq(h.run('before-E.res.etk'),140);eq(h.run('E.opLog.length'),1);eq(h.run('E.opLog[0].cost'),140);
 eq(h.run('A.hitLog.length'),outcome==='sonucsuz'?0:1);
 if(outcome==='basari'){eq(h.run('A.hitLog[0].by'),4);eq(h.run('A.hitLog[0].framed'),0);}
 if(outcome==='ifsa'){eq(h.run('A.hitLog[0].by'),0);eq(h.run('A.hitLog[0].known'));}
 if(tur==='tekno')eq(h.run('E.res.ara'),outcome==='basari'?h.run('Math.round(TECHS.t_tarim.c*.5)'):0);
});
for(const [label,setup,tur] of [
 ['bilinmeyen tür','','ZEHIR'],['eski hedef','A={...A};','tekno'],
 ['eski suçlanan','C={...C};','tekno'],['korsan','C.wild=true;','tekno'],
 ['temassız','E.contact[A.id]=false;','sabotaj'],['ölü aktör','E.dead=true;','sabotaj']
])test('sahte bayrak '+label+': kesinti/zar/kayıt yok',()=>{
 const h=fresh();h.run(`${setup}var before=state();var r=falseFlagOp(E,A,C,'${tur}');`);
 eq(h.run('r.ok'),false);eq(h.run('state()===before'));
});
for(const blocked of [false,true])test('kritik sahte bayrak: gerçek savaş '+(blocked?'reddediliyor':'kuruluyor'),()=>{
 const h=fresh();h.run(`${blocked?"A.civics=['golge_kons'];":''}
   G._warAuth='ONCEKI';G._warWhy={n:'önceki'};A._lastCB={n:'eski sebep'};
   var old=G._warWhy,oldCB=A._lastCB;dice([0,0]);var r=falseFlagOp(E,A,C,'sabotaj');`);
 eq(h.run('r.savas'),!blocked);eq(h.run('!!A.war[C.id]'),!blocked);
 eq(h.run("r.msg.includes('SAVAŞ İLAN ETTİ')"),!blocked);
 eq(h.run("G._warAuth==='ONCEKI'&&G._warWhy===old"));
 if(blocked)eq(h.run('A._lastCB===oldCB'));
});
test('başarısız savaşta önceden olmayan yetki alanları tekrar yoktur',()=>{
 const h=fresh();h.run(`delete G._warAuth;delete G._warWhy;delete A._lastCB;A.civics=['golge_kons'];
   dice([0,0]);falseFlagOp(E,A,C,'sabotaj');`);
 eq(h.run("['_warAuth','_warWhy'].some(k=>Object.hasOwn(G,k))||Object.hasOwn(A,'_lastCB')"),false);
});
test('veri yokken iftira başarısı, araştırma kazanımı diye sunulmaz',()=>{
 const h=fresh();h.run("A.techs={};dice([0,.999]);var r=falseFlagOp(E,A,C,'tekno');");
 eq(h.run('r.basarili'));eq(h.run('r.payloadApplied'),false);eq(h.run('E.res.ara'),0);
 eq(h.run("r.msg.includes('veri bulunamadı')"));
});
test('kurban dosyası masumu gösterir; gerçek kuklacı yalnız soruşturma sonrası görünür',()=>{
 const h=fresh(1,0);h.run(`dice([0,.999,.999]);falseFlagOp(E,A,C,'tekno');
   var before=UI.intelFiles();UI.opLogMenu();`);
 const modal=h.doc.getElementById('modal').innerHTML;
 for(const html of [h.run('before'),modal]){assert.ok(html.includes('MASUM_871'));assert.ok(!html.includes('GERCEK_AKTOR_871'));}
 h.run('dice([0,0]);var investigation=deepInvestigate(A);var after=UI.intelFiles();');
 eq(h.run('investigation.cozuldu'));assert.ok(h.run('after').includes('GERCEK_AKTOR_871'));
});
test('fısıltı menüsü iftira seçilince gerçek 80 Etki ve yüzde .88 başarıyı gösterir',()=>{
 const h=fresh();h.run(`UI.wA=A.id;UI.wB=B.id;UI.wC=C.id;UI.whisperMenu();
   var expected=Math.round(whisperSuccessChance(E)*.88*100);`);
 const html=h.doc.getElementById('modal').innerHTML;
 assert.ok(html.includes('/ 80 ◈'));assert.ok(html.includes('%'+h.run('expected')));
});
test('gerçek UI ifşa edilmiş başarılı iftirayı masumun üstünde kaldı diye anlatmaz',()=>{
 const h=fresh();h.run('UI.wA=A.id;UI.wB=B.id;UI.wC=C.id;dice([0,0]);UI.act("whisperGo");var small=UI.intelFiles();UI.opLogMenu();');
 eq(h.run('E.opLog.length'),1);eq(h.run('E.whisperLog.length'),1);
 eq(h.run("messages.some(m=>m.includes('üstünde kaldı'))"),false);
 for(const html of [h.run('small'),h.doc.getElementById('modal').innerHTML]){
   assert.ok(html.includes('BAŞARILI · aynı denemede İFŞA OLDU'));assert.ok(html.includes('80 ◈ harcandı'));
 }
});
test('AI fısıltısı actor ve eski karşı istihbarat kaydını birer kez yazar',()=>{
 const h=fresh(2);h.run(`for(const e of G.emps)e.ai=false;E.ai=true;
   whisperTarget=function(){return {a:A,b:B};};pickBlameTarget=function(){return C;};
   rnd=function(){return 0;};var before=E.res.etk;whisperTick();`);
 eq(h.run('E.opLog.length'),1);eq(h.run('E.whisperLog.length'),1);eq(h.run('before-E.res.etk'),80);
});
test('v8 ücret/sonuç/geçmişi korur; gecikmeli fısıltı ifşası eski yoldan çalışır',()=>{
 const h=fresh();h.run(`dice([0,.999]);playerWhisper(A,B,null);
   var history=JSON.stringify([E.opLog,E.whisperLog]);var txt=serialize();deserialize(txt);
   E=G.p;A=G.emps[1];B=G.emps[3];var loaded=JSON.stringify([E.opLog,E.whisperLog]);
   G.memAge+=3;rnd=function(){return 0;};counterIntelTick();`);
 eq(h.run('history===loaded'));eq(h.run('JSON.parse(txt).v'),8);eq(h.run('E.whisperLog[0].found'));
 eq(h.run('E.opLog.length'),1);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
