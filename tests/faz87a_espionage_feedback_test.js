'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const SAVE=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function fresh(){
  const h=runtime({root:ROOT});h.loadSave(SAVE);
  h.run(`var A=G.p,B=G.emps[1],C=G.emps[3];
    for(const e of [A,B,C]){
      e.dead=false;e.wild=false;e.civics=[];e.spy={};e.intel={};e.intelP={};
      e.mods.opCost=0;e.mods.sensor=0;e.opLog=[];e.hitLog=[];
      for(const k in e.res)e.res[k]=10000;
      for(const o of [A,B,C])if(o!==e){e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=50;}
    }
    G.speed=0;UI.spyTarget=B.id;UI.intelView='operations';
    function snap(){return JSON.stringify([G.emps,G.sys,G.fleets,G.log,G.inbox,RND_STATE,G.day]);}
  `);
  return h;
}
function ask(h,key='kervan'){
  h.run(`UI.act('opAsk',B.id+':${key}');`);
  const html=h.doc.getElementById('modal').innerHTML;
  const m=html.match(/data-a="opGo"\s+data-x="([^"]+)"/);
  assert.ok(m,'onay düğmesi yok');
  return m[1];
}
function go(h,token){h.run(`UI.act('opGo',${JSON.stringify(token)});`);}

for(const [name,setup,target] of [
  ['kendine operasyon','A.intel[A.id]=3;A.contact[A.id]=true;','A'],['temassız hedef','A.contact[B.id]=false;','B'],
  ['ölü hedef','B.dead=true;','B'],['korsan hedef','B.wild=true;','B'],
  ['eski hedef nesnesi','var oldB={...B};','oldB'],['olmayan hedef','','undefined'],
  ['ölü aktör','A.dead=true;','B'],['eski aktör','A={...A};','B']
])test(name+' reddedilir; dünya/RNG değişmez',()=>{
  const h=fresh();h.run(`${setup}var before=snap();var q=opQuote(A,${target},'kervan');var r=runOp(A,${target},'kervan');`);
  eq(h.run('q.ok'),false);eq(h.run('r.ok'),false);eq(h.run('snap()===before'));
});
test('null aktör istisnasız reddedilir',()=>{const h=fresh();eq(h.run("opQuote(null,B,'kervan').ok"),false);});
test('katalog dışı/prototip anahtarları ve sayısal olmayan casus hedefi etkisizdir',()=>{
  const h=fresh();h.run(`var before=snap();var keys=['constructor','toString','__proto__','YOK'];
    var blocked=keys.every(k=>!opQuote(A,B,k).ok&&!runOp(A,B,k).ok);
    var invalid=['constructor',NaN,-1,1.5].every(id=>!assignSpy(A,id));`);
  eq(h.run('blocked&&invalid'));eq(h.run('snap()===before'));
});
test('kilitli operasyon gerçek stok/koloni sayısı sızdırmaz',()=>{
  const h=fresh();h.run("A.intel[B.id]=0;var before=snap();var q=opQuote(A,B,'hazine');var html=UI.opsCatalog(B.id);");
  eq(h.run('q.ok'),false);eq(h.run('q.viableDesc'),'');
  eq(h.run("/stok türü|uygun koloni|yeni teknoloji/.test(html)"),false);eq(h.run('snap()===before'));
});
test('2400 önizleme saf; uygun teklifin gerçek maliyet/risk alanları korunur',()=>{
  const h=fresh();h.run(`var before=snap();for(let i=0;i<200;i++)for(const k in OPS)opQuote(A,B,k);
    var q=opQuote(A,B,'hazine');`);eq(h.run('snap()===before'));eq(h.run('q.ok'));
  eq(h.run('q.cost.etk'),55);eq(h.run('q.riskPct'),38);
});
test('sağ panel CASUS ATA ve GERİ ÇEK üretir; eylem istihbaratta kalır',()=>{
  const h=fresh();h.run("var html=UI.intelOperations();UI.act('spy',B.id);var after=UI.intelOperations();");
  eq(h.run('A.spy[B.id]'));eq(h.run("html.includes('data-a=\"spy\"')&&after.includes('CASUSU GERİ ÇEK')"));
  eq(h.doc.getElementById('diploPane').classList.contains('show'),false);
  h.run("UI.act('spy',B.id);");eq(h.run('A.spy[B.id]'),false);
});
test('dolu kapasite yeni casus atamaz, mevcut casusu geri çekebilir',()=>{
  const h=fresh();h.run('assignSpy(A,B.id);var before=snap();var second=assignSpy(A,C.id);');
  eq(h.run('second'),false);eq(h.run('snap()===before'));eq(h.run('assignSpy(A,B.id)'));eq(h.run('spiesUsed(A)'),0);
});
for(const id of ['A.id','999'])test('geçersiz casus ataması '+id+' sıfır mutasyon',()=>{
  const h=fresh();h.run(`delete A.spy;var before=snap();var ok=assignSpy(A,${id});`);
  eq(h.run('ok'),false);eq(h.run('snap()===before'));
});
test('eski hedefte kalmış casus geri çekilebilir',()=>{
  const h=fresh();h.run('A.spy[999]=true;var q=spyAssignQuote(A,999);var ok=assignSpy(A,999);');
  eq(h.run('q.ok&&q.withdraw&&ok'));eq(h.run('spiesUsed(A)'),0);
});
test('iptalden sonra eski onay hiçbir operasyon yürütmez',()=>{
  const h=fresh(),token=ask(h);h.run("UI.act('closem');var before=snap();");go(h,token);eq(h.run('snap()===before'));eq(h.run('A.opLog.length'),0);
});
test('başka modal eski onayı iptal eder',()=>{
  const h=fresh(),token=ask(h);h.run("UI.openModal('<div>başka ekran</div>','sci');var before=snap();");go(h,token);eq(h.run('snap()===before'));
});
test('aynı operasyon yeniden açılırsa eski jeton yeni onayı tüketmez',()=>{
  const h=fresh(),old=ask(h),current=ask(h);assert.notEqual(old,current);
  go(h,old);eq(h.run('A.opLog.length'),0);go(h,current);eq(h.run('A.opLog.length'),1);
});
test('çift onay tek kesinti ve iki tarafta tek kayıt üretir',()=>{
  const h=fresh(),token=ask(h);h.run('var etk=A.res.etk;');go(h,token);h.run('var after=snap();');go(h,token);
  eq(h.run('A.opLog.length'),1);eq(h.run('B.hitLog.length'),1);eq(h.run('etk-A.res.etk'),40);eq(h.run('snap()===after'));
});
for(const [name,change] of [
  ['maliyet','A.mods.opCost=1.5'],['risk',"A.civics=['golge_kons']"],['temas','A.contact[B.id]=false'],
  ['kaynak','A.res.etk=0'],['hedef ölümü','B.dead=true']
])test('onaydan sonra '+name+' değişimi kesinti yapmadan durur',()=>{
  const h=fresh(),token=ask(h);h.run(`${change};var rng=RND_STATE,stock=JSON.stringify(A.res);`);go(h,token);
  eq(h.run('A.opLog.length'),0);eq(h.run('B.hitLog.length'),0);eq(h.run('RND_STATE===rng&&JSON.stringify(A.res)===stock'));
});
test('deserialize sonrası eski onay yeni dünyada çalışmaz',()=>{
  const h=fresh(),token=ask(h);h.run('var txt=serialize();deserialize(txt);A=G.p;B=G.emps[1];var rng=RND_STATE,stock=JSON.stringify(A.res);');go(h,token);
  eq(h.run('A.opLog.length'),0);eq(h.run('RND_STATE===rng&&JSON.stringify(A.res)===stock'));
});
test('geçersiz yeni önizleme eski onayı da iptal eder',()=>{
  const h=fresh(),token=ask(h);h.run("UI.opConfirm(B.id,'YOK');var before=snap();");go(h,token);eq(h.run('snap()===before'));
});
test('dört süreli kazanım gerçek alanlardan okunur; bitiş gününde listeden çıkar',()=>{
  const h=fresh();h.run(`A.fakeTo={[B.id]:{mul:.45,until:G.day+10}};A.routeIntel={[B.id]:G.day+20};
    A.fleetIntel={[B.id]:G.day+30};A.smuggle={[B.id]:G.day+40};var before=snap();var effects=opActiveEffects(A,B);var html=UI.opEffects(B);`);
  eq(h.run('effects.length'),4);eq(h.run('snap()===before'));eq(h.run("html.includes('40 gün kaldı')"));
  h.run('G.day+=10;');eq(h.run('opActiveEffects(A,B).length'),3);
  h.run('G.day+=30;');eq(h.run('opActiveEffects(A,B).length'),0);
});
test('kervan yürütme gerçek süreyi oluşturur; v8 kaydında korunur',()=>{
  const h=fresh();h.run("runOp(A,B,'kervan');var first=opActiveEffects(A,B);var txt=serialize();deserialize(txt);A=G.p;B=G.emps[1];var second=opActiveEffects(A,B);");
  eq(h.run('first[0].days'),1080);eq(h.run('JSON.stringify(first)===JSON.stringify(second)'));
  eq(h.run('JSON.parse(txt).v'),8);
});
test('düşmanın gizli virüs süresi ve başka devlete ait kazanım gösterilmez',()=>{
  const h=fresh();h.run('B.virusUntil=G.day+777;A.routeIntel={[C.id]:G.day+888};var html=UI.opEffects(B);');
  eq(h.run("html.includes('777')||html.includes('888')"),false);
});
test('kendi tersane zararı görünür ama faili bilinmeyen isim sızmaz',()=>{
  const h=fresh();h.run(`A.virusUntil=G.day+90;B.name='GIZLI_FAIL_87A';A.hitLog=[{k:'tersaneVir',t:G.memAge,by:B.id,known:false,caught:false}];var html=UI.intelFiles();`);
  eq(h.run("html.includes('90 gün kaldı')&&html.includes('FAİL BİLİNMİYOR')"));eq(h.run("html.includes('GIZLI_FAIL_87A')"),false);
});
test('saklanan sonuç özeti iki dosya görünümünde de kesilmeden ve güvenle gösterilir',()=>{
  const h=fresh();h.sb.summary='A'.repeat(85)+' <sonuc> ETKI_87A';
  h.run("A.opLog=[{k:'kervan',o:B.id,t:G.memAge,caught:false,actorSummary:summary}];var small=UI.intelFiles();UI.opLogMenu();");
  const big=h.doc.getElementById('modal').innerHTML;
  eq(h.run("small.includes('ETKI_87A')&&small.includes('&lt;sonuc&gt;')"));assert.ok(big.includes('ETKI_87A')&&big.includes('&lt;sonuc&gt;'));
});
test('eski kayıtta özet yoksa sonuç uydurulmaz',()=>{
  const h=fresh();h.run("A.opLog=[{k:'stealTech',o:B.id,t:0,caught:false}];UI.opLogMenu();");
  assert.ok(h.doc.getElementById('modal').innerHTML.includes('ayrıntılı sonuç saklanmamış'));
});
test('ifşa edilmemek hiç iz kalmaması olarak anlatılmaz',()=>{
  const h=fresh();h.run('rndSeed(999);while(true){var seed=RND_STATE;if(rnd()>.9)break;}rndSeed(seed);');
  const token=ask(h);go(h,token);eq(h.run('A.opLog[0].caught'),false);
  const html=h.doc.getElementById('modal').innerHTML;
  assert.ok(html.includes('sonraki soruşturmalarla çözülebilir'));assert.ok(!html.includes('iz bırakılmadı'));
});
test('gerçek AI aktörü de aynı kanonik kayıt ve maliyet yolunu kullanır',()=>{
  const h=fresh();h.run("var stock=B.res.etk;var q=opQuote(B,A,'kervan');var r=runOp(B,A,'kervan');");
  eq(h.run('q.ok&&r.ok'));eq(h.run('stock-B.res.etk'),40);eq(h.run('B.opLog.length'),1);eq(h.run('A.hitLog.length'),1);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
