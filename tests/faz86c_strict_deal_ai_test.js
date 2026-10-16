#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C: KATI DOĞRULAMA + AÇIKLANABİLİR DİPLOMASİ AI'I
   normalizeDeal · dealValidity · dealQuote · executeDeal · teklif ömrü
   Çalıştırma: node tests/faz86b_deal_engine_test.js
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'),
      vm=require('vm'), crypto=require('crypto');
const KOK=path.resolve(__dirname,'..');
let gecen=0, kalan=0; const basarisiz=[];
function ok(ad,sart,detay){
  if(sart){gecen++;console.log('  ✓ '+ad+(detay?' — '+detay:''));}
  else{kalan++;basarisiz.push(ad);console.log('  ✗ '+ad+(detay?' — '+detay:''));}
}
const oku=f=>fs.readFileSync(path.join(KOK,f),'utf8');

/* ═══ HARNESS ═══ */
function harness(){
  const listeners={}, store={};
  const doluD=new Uint8ClampedArray(4); doluD[3]=200;
  function ctx(){
    const c={};
    ['fill','stroke','beginPath','arc','moveTo','lineTo','fillRect','fillText',
     'strokeText','save','restore','setLineDash','drawImage','closePath',
     'clearRect','translate','rotate','scale','ellipse','rect','strokeRect',
     'quadraticCurveTo','bezierCurveTo','clip','arcTo','setTransform',
     'resetTransform','putImageData'].forEach(k=>c[k]=function(){});
    c.measureText=()=>({width:30});
    c.createRadialGradient=c.createLinearGradient=()=>({addColorStop(){}});
    c.createImageData=(w,h)=>({data:new Uint8ClampedArray(((w||1)*(h||1))*4),
                               width:w||1,height:h||1});
    c.getImageData=()=>({data:doluD});
    c.canvas={width:900,height:420};
    return c;
  }
  function el(id){
    return {id,className:'',innerHTML:'',textContent:'',style:{},dataset:{},
      width:900,height:420,offsetWidth:900,offsetHeight:420,
      clientWidth:900,clientHeight:420,scrollTop:0,firstElementChild:null,
      classList:{_s:new Set(),add(...a){a.forEach(x=>this._s.add(x));},
        remove(...a){a.forEach(x=>this._s.delete(x));},
        toggle(x,v){v===undefined?(this._s.has(x)?this._s.delete(x):this._s.add(x))
          :(v?this._s.add(x):this._s.delete(x));},
        contains(x){return this._s.has(x);}},
      appendChild(){},removeChild(){},remove(){},addEventListener(){},
      getContext(){return ctx();},
      getBoundingClientRect(){return{left:0,top:0,right:100,bottom:40,width:100,height:40};},
      querySelector(){return null;},querySelectorAll(){return [];},
      closest(){return null;},focus(){},click(){}};
  }
  const sb={console:{log(){},warn(){},error(){}},Math,Date,JSON,parseInt,
    parseFloat,isFinite,isNaN,Set,Map,Array,Object,String,Number,Boolean,
    Error,Promise,RegExp,Uint8ClampedArray,Float32Array,Int32Array,Proxy,
    Reflect,Symbol};
  const KUYRUK=[];
  sb.setTimeout=(f,ms)=>{KUYRUK.push({f,ms});return KUYRUK.length;};
  sb.clearTimeout=id=>{if(KUYRUK[id-1])KUYRUK[id-1].f=null;};
  sb.setInterval=()=>1; sb.clearInterval=()=>{};
  sb.requestAnimationFrame=()=>1; sb.cancelAnimationFrame=()=>{};
  sb.performance={now:()=>Date.now()};
  sb.document={getElementById:id=>(store[id]||(store[id]=el(id))),
    createElement:t=>el(t),querySelector:()=>null,querySelectorAll:()=>[],
    addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    body:el('body'),documentElement:el('html'),hidden:false,
    visibilityState:'visible'};
  sb.window={addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    innerWidth:900,innerHeight:420,matchMedia:()=>({matches:false}),
    localStorage:{_d:{},getItem(k){return this._d[k]||null;},
      setItem(k,v){this._d[k]=String(v);},removeItem(k){delete this._d[k];}},
    location:{protocol:'https:'},devicePixelRatio:1};
  sb.localStorage=sb.window.localStorage;
  sb.navigator={userAgent:'node',standalone:false};
  sb.globalThis=sb;
  vm.createContext(sb);
  for(const f of ['main.js','map.js','combat.js','ai.js','diplomacy.js',
                  'economy.js','ui.js','audio.js'])
    vm.runInContext(fs.readFileSync(path.join(KOK,f),'utf8'),sb,{filename:f});
  const R=c=>{try{return vm.runInContext('(function(){'+c+'})()',sb);}
              catch(e){return 'HATA: '+e.message;}};
  return {sb,R};
}
const KUR=(seed)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:"+(seed||99)+",ethics:{mil:0,aut:0,mat:0,ahl:0},",
 " civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "G.emps.forEach(function(o){ if(o.id && !o.wild && !o.dead){",
 "  G.p.contact[o.id]=true; o.contact[G.p.id]=true; } });",
 "economyTick(true); return 'ok';"].join('\n');

/* ═══ A. DOSYA SINIRI VE KARANTİNA ═══ */
console.log('\nA. DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  ok("sw cache = 'stars-v95c'", /const CACHE = 'stars-v95c'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(oku('main.js')));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, oku('main.js').includes(k)));
  const dip=oku('diplomacy.js');
  /* FAZ 86C.2: yüzeysel dealJournal/dealRollback yerini gerçek
     transaction mimarisi aldı (dealTxBegin/dealTxRollback/
     txCaptureGraph/txRestoreGraph/dealPostcondition). */
  ['normalizeDeal','dealValidity','dealQuote','executeDeal','dealCost',
   'dealGoodwill','dealTxBegin','dealTxRollback','txCaptureGraph','txRestoreGraph',
   'dealPostcondition','dealFactors','ethicGap']
   .forEach(f=>ok('kanonik fonksiyon: '+f, new RegExp('function '+f+'\\(').test(dip)));
  ok('DEAL_FACTOR_CAPS tanımlı', /const DEAL_FACTOR_CAPS/.test(dip));
  ok('kabul/ret için RNG YOK (evalOffer saf)',
     !/rnd\(\)/.test(dip.slice(dip.indexOf('function evalOffer'),
                              dip.indexOf('function evalOffer')+2600)));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
}
{
  /* FAZ 86C.4H: map.js ve main.js bu hotfix'te DEĞİŞİYOR
     (pointer yaşam döngüsü + yükleme sonrası kurtarma), bu
     yüzden korunan kümeden çıkarıldılar. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json'].forEach(f=>{
    if(!ref||!ref[f]){ ok(f+' referansı var', false); return; }
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
}

/* ═══ B. GÖREV A — FATAL DOĞRULAMA ═══ */
console.log('\nB. FATAL DOĞRULAMA (normalizeDeal üç sınıf)');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; o.res.ene=900;",
    "var A=JSON.stringify({a:e.res,b:o.res,rel:e.rel[o.id]});",
    "/* GEÇERLİ FAYDA (500 enerji alacak) + GEÇERSİZ YÜKÜMLÜLÜK */",
    "var of={from:e.id,to:o.id,give:[{t:'ZEHIR',v:5}],want:[{t:'res',r:'ene',v:500}]};",
    "var q=dealQuote(of); var r1=executeDeal(of);",
    "var B=JSON.stringify({a:e.res,b:o.res,rel:e.rel[o.id]});",
    "function f(x){ var qq=dealQuote(x); return (qq.fatal||[])[0]||null; }",
    "var n=normalizeDeal({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:10},{t:'res',r:'min',v:20},{t:'nap'}],want:[{t:'nap'}]});",
    "return JSON.stringify({ok:r1, sifirMutasyon:A===B, fatal:(q.fatal||[])[0],",
    "  siniflar:{norm:n.normalizations.length, red:n.redundant.length, err:n.errors.length},",
    "  toplandi:(n.give.filter(function(x){return x.t==='res';})[0]||{}).v,",
    "  simetrikTek:n.give.filter(function(x){return x.t==='nap';}).length+",
    "              n.want.filter(function(x){return x.t==='nap';}).length,",
    "  kendisi:f({from:0,to:0,give:[],want:[]}),",
    "  olu:(function(){var d=G.emps[2];d.dead=true;var z=f({from:0,to:2,give:[],want:[]});d.dead=false;return z;})(),",
    "  wild:f({from:0,to:G.emps.filter(function(x){return x.wild;})[0].id,give:[],want:[]}),",
    "  nan:f({from:0,to:1,give:[{t:'res',r:'min',v:NaN}],want:[]}),",
    "  inf:f({from:0,to:1,give:[{t:'res',r:'min',v:Infinity}],want:[]}),",
    "  sifir:f({from:0,to:1,give:[{t:'res',r:'min',v:0}],want:[]}),",
    "  negatif:f({from:0,to:1,give:[{t:'res',r:'min',v:-5}],want:[]}),",
    "  kaynak:f({from:0,to:1,give:[{t:'res',r:'YOK',v:5}],want:[]}),",
    "  tech:f({from:0,to:1,give:[{t:'tech',id:'YOK'}],want:[]}),",
    "  lux:f({from:0,to:1,give:[{t:'lux',k:'YOK'}],want:[]}),",
    "  sys:f({from:0,to:1,give:[{t:'sys',id:99999}],want:[]}),",
    "  hedef:f({from:0,to:1,give:[{t:'warOn',target:99999}],want:[]}),",
    "  eksikAlan:f({from:0,to:1,give:[{t:'res',v:5}],want:[]})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('geçerli fayda + geçersiz yükümlülük BÜTÜNÜYLE reddedildi', d.ok===false);
  ok('sıfır mutasyon — ödül aktarılmadı', d.sifirMutasyon===true);
  ok('fatal gerekçe döndü', /Bilinmeyen madde türü/.test(d.fatal||''), d.fatal);
  ok('normalizeDeal üç sınıf döndürüyor',
     d.siniflar && d.siniflar.norm>=1 && d.siniflar.err===0,
     JSON.stringify(d.siniflar));
  ok('güvenli normalleştirme: aynı kaynak satırları toplandı (10+20=30)',
     d.toplandi===30, String(d.toplandi));
  ok('simetrik antlaşma tek maddeye indi', d.simetrikTek===1, String(d.simetrikTek));
  [['self-deal','kendisi'],['ölü taraf','olu'],['wild taraf','wild'],
   ['NaN miktar','nan'],['Infinity miktar','inf'],['sıfır miktar','sifir'],
   ['negatif miktar','negatif'],['bilinmeyen kaynak','kaynak'],
   ['katalogda olmayan tech','tech'],['katalogda olmayan lux','lux'],
   ['geçersiz sistem','sys'],['geçersiz hedef','hedef'],
   ['eksik zorunlu alan','eksikAlan']].forEach(([ad,k])=>
    ok('FATAL: '+ad, typeof d[k]==='string' && d[k].length>0, d[k]));
}

/* ═══ C. GÖREV B — PLANLANAN SON DURUM ═══ */
console.log('\nC. PLANLANAN SON DURUM VE REDUNDANT');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[3];",
    "function dene(items){ e.war[o.id]=true; o.war[e.id]=true; e.nap={}; o.nap={};",
    "  e.pact={}; o.pact={}; e.res.etk=9999;",
    "  e.exh=e.exh||{}; e.exh[o.id]=99; o.exh=o.exh||{}; o.exh[e.id]=99;",
    "  e.warSince=e.warSince||{}; e.warSince[o.id]=0;",
    "  var q=dealQuote({from:e.id,to:o.id,give:items,want:[]});",
    "  return {ok:q.ok, r:(q.reasons||[])[0]||null}; }",
    "var a=dene([{t:'nap'}]), b=dene([{t:'peace'},{t:'nap'}]),",
    "    c=dene([{t:'nap'},{t:'peace'}]), p=dene([{t:'pact'}]);",
    "/* REDUNDANT: yürürlükteki antlaşma yeni değer saymaz */",
    "e.war[o.id]=false; o.war[e.id]=false; e.nap={}; o.nap={};",
    "executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "var q2=dealQuote({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "/* yeni madde + redundant madde: yalnız yeni fiyatlanır */",
    "var q3=dealQuote({from:e.id,to:o.id,give:[{t:'nap'},{t:'pact'}],want:[]});",
    "var q4=dealQuote({from:e.id,to:o.id,give:[{t:'pact'}],want:[]});",
    "return JSON.stringify({yalnizNap:a, peaceNap:b, napPeace:c, savastaPact:p,",
    "  yururlukte:{ok:q2.ok, redundant:(q2.redundant||[]).length, r:(q2.reasons||[])[0]},",
    "  karisikMaliyet:q3.cost, yalnizYeniMaliyet:q4.cost,",
    "  karisikOk:q3.ok, karisikRedundant:(q3.redundant||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('savaş sürerken YALNIZ nap → geçersiz',
     (d.yalnizNap||{}).ok===false, (d.yalnizNap||{}).r);
  ok('peace + nap → geçerli', (d.peaceNap||{}).ok===true);
  ok('nap + peace (ters sıra) → AYNI geçerli sonuç',
     (d.napPeace||{}).ok===true &&
     (d.peaceNap||{}).ok===(d.napPeace||{}).ok);
  ok('savaş sürerken pact → geçersiz', (d.savastaPact||{}).ok===false);
  ok('yürürlükteki antlaşma yeni değer saymaz',
     (d.yururlukte||{}).ok===false && (d.yururlukte||{}).redundant>=1,
     (d.yururlukte||{}).r);
  ok('yeni + redundant pakette yalnız YENİ madde fiyatlanır',
     d.karisikOk===true && d.karisikMaliyet===d.yalnizYeniMaliyet,
     d.karisikMaliyet+' = '+d.yalnizYeniMaliyet);
}

/* ═══ D. İŞLEM GÜVENLİĞİ — MUTASYON ÖNCESİ + COMMIT SONU (SINIRLI) ═══
   FAZ 86C.1 düzeltmesi: `_dealFailInject` madde mutasyonundan ÖNCE
   çalışır, bu yüzden bu blok TAM ATOMİKLİĞİ KANITLAMAZ. Kanıtladığı:
   mutasyon öncesi hata güvenliği ve commit sonu sınırlı rollback.
   after:* enjeksiyonları ve derin rollback FAZ 86C.2'de. */
console.log('\nD. TAM TRANSACTION — AŞAMALI HATA ENJEKSİYONU');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=2000; e.res.etk=3000; o.res.min=500;",
    "var bos=G.sys.filter(function(s){return s.owner===-1;})[0];",
    "if(bos) captureSystem(bos,e.id);",
    "var sy=G.sys.filter(function(s){return s.owner===e.id && s.id!==e.home;})[0];",
    "var tek=Object.keys(TECHS).filter(function(t){return !o.techs[t];})[0];",
    "e.techs[tek]=true;",
    "function foto(){ return JSON.stringify({eRes:e.res,oRes:o.res,",
    "  eTech:Object.keys(e.techs).length, oTech:Object.keys(o.techs).length,",
    "  sysOwner:sy.owner, eRel:e.rel[o.id], oRel:o.rel[e.id],",
    "  ePact:!!(e.pact&&e.pact[o.id]), giftAt:JSON.stringify(e.giftAt||{}),",
    "  log:(G.log||[]).length}); }",
    "var teklif={from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:300},{t:'pact'},{t:'sys',id:sy.id},{t:'tech',id:tek}],want:[]};",
    "var s={};",
    "/* FAZ 86C.2: kancalar artık AŞAMALI (before:/after:). */",
    "['before:res','after:res','before:pact','after:pact',",
    " 'before:sys','after:sys','after:items','after:cost','son'].forEach(function(nk){",
    "  var A=foto();",
    "  G._dealFailInject=function(t){ if(t===nk) throw new Error('enj:'+t); };",
    "  var ok2=false, hata='';",
    "  try{ ok2=executeDeal(JSON.parse(JSON.stringify(teklif))); }catch(ex){ hata=ex.message; }",
    "  delete G._dealFailInject;",
    "  s[nk]={ok:ok2, sizanHata:hata, tamGeriAlindi:A===foto()}; });",
    "var A2=foto(); var son=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "s.enjeksiyonsuz={ok:son, uygulandi:A2!==foto(), sysYeniSahip:sy.owner===o.id};",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['before:res','after:res','before:pact','after:pact',
   'before:sys','after:sys','after:items','after:cost','son'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok('"'+k+'" noktasında hata → TAM geri alma',
       x.ok===false && x.tamGeriAlindi===true && x.sizanHata==='',
       'geriAlindi='+x.tamGeriAlindi);
  });
  const z=d.enjeksiyonsuz||{};
  ok('enjeksiyonsuz teklif gerçekten uygulanıyor',
     z.ok===true && z.uygulandi===true && z.sysYeniSahip===true);
}

/* ═══ E. GÖREV D — ÇOKLU MALİYET ═══ */
console.log('\nE. ÇOKLU ANTLAŞMA MALİYETİ');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "/* FAZ 86C.1: maliyet artık EFFECTIVE plan üzerinden hesaplanıyor —",
    "   zaten yürürlükteki (redundant) madde ücretlendirilmez. Taban",
    "   ücretleri ölçmek için maddelerin GERÇEKTEN yeni etki üretmesi",
    "   gerekir: barış için savaş, antlaşmalar için yürürlükte olmama. */",
    "e.war[o.id]=true; o.war[e.id]=true;",
    "e.exh=e.exh||{}; e.exh[o.id]=99; o.exh=o.exh||{}; o.exh[e.id]=99;",
    "e.warSince=e.warSince||{}; e.warSince[o.id]=0;",
    "e.nap={}; o.nap={}; e.pact={}; o.pact={}; e.ally={}; o.ally={};",
    "e.spynet={}; o.spynet={}; e.passage={}; o.passage={};",
    "e.visionFrom={}; o.visionFrom={};",
    "function c(g,w){ return dealCost({from:e.id,to:o.id,give:g,want:w||[]}); }",
    "e.res.etk=9999;",
    "var res0=JSON.stringify(e.res);",
    "var q=dealQuote({from:e.id,to:o.id,give:[{t:'ZEHIR'}],want:[]});",
    "return JSON.stringify({",
    "  ally_pact:c([{t:'ally'},{t:'pact'}]),",
    "  spynet_intel:c([{t:'spynet'},{t:'intel'}]),",
    "  spynet_ally_pact:c([{t:'spynet'},{t:'ally'},{t:'pact'}]),",
    "  tavan:c([{t:'spynet'},{t:'ally'},{t:'pact'},{t:'intel'},{t:'peace'}]),",
    "  ally:c([{t:'ally'}]), peace:c([{t:'peace'}]), pact:c([{t:'pact'}]),",
    "  intel:c([{t:'intel'}]), spynet:c([{t:'spynet'}]),",
    "  nap:c([{t:'nap'}]), passage:c([{t:'passage'}]),",
    "  ciftYon:c([{t:'intel'}],[{t:'intel'}]),",
    "  gecersizMaliyet:q.ok===false, kaynakAyni:JSON.stringify(e.res)===res0});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ally 90 + pact 40 = 100', d.ally_pact===100, String(d.ally_pact));
  ok('spynet 120 + intel 45 = 131', d.spynet_intel===131, String(d.spynet_intel));
  ok('spynet + ally + pact = 153', d.spynet_ally_pact===153, String(d.spynet_ally_pact));
  ok('tavan 160 aşılmıyor', d.tavan===160, String(d.tavan));
  ok('tabanlar korundu (peace30·pact40·ally90·intel45·spynet120)',
     d.peace===30 && d.pact===40 && d.ally===90 && d.intel===45 && d.spynet===120);
  ok('nap ve passage maliyetsiz', d.nap===0 && d.passage===0);
  ok('aynı antlaşma iki yönde → TEK ücret', d.ciftYon===45, String(d.ciftYon));
  ok('geçersiz teklif maliyet kesmiyor',
     d.gecersizMaliyet===true && d.kaynakAyni===true);
}

/* ═══ F. GÖREV E — GOODWILL ═══ */
console.log('\nF. GOODWILL VE COOLDOWN');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "var gelir=0; for(var k in (o.inc||{})) gelir+=Math.max(0,o.inc[k]||0);",
    "function gw(v){ delete e.giftAt; delete o.giftAt;",
    "  return dealGoodwill(o,e,normalizeDeal({from:e.id,to:o.id,",
    "    give:[{t:'res',r:'min',v:v}],want:[]})); }",
    "var dengeli=dealGoodwill(o,e,normalizeDeal({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:500}],want:[{t:'res',r:'ene',v:500}]}));",
    "/* 10 küçük hediye */",
    "var t=G.emps[2]; e.res.min=99999; e.res.etk=9999;",
    "e.rel[t.id]=0; t.rel[e.id]=0; delete e.giftAt; delete t.giftAt; G.memAge=100;",
    "for(var i=0;i<10;i++) executeDeal({from:e.id,to:t.id,give:[{t:'res',r:'min',v:5}],want:[]});",
    "var kucukSon=t.rel[e.id];",
    "/* cooldown */",
    "e.rel[t.id]=0; t.rel[e.id]=0; delete e.giftAt; delete t.giftAt;",
    "var b1=executeDeal({from:e.id,to:t.id,give:[{t:'res',r:'min',v:3000}],want:[]});",
    "var r1=t.rel[e.id];",
    "var b2=executeDeal({from:e.id,to:t.id,give:[{t:'res',r:'min',v:3000}],want:[]});",
    "var r2=t.rel[e.id];",
    "/* cooldown kalıcı mı: save/load */",
    "var kayit=serialize(); var damga=JSON.stringify(e.giftAt);",
    "e.giftAt={}; deserialize(kayit);",
    "var damgaSonra=JSON.stringify(G.p.giftAt);",
    "G.memAge=112;",
    "var b3=executeDeal({from:G.p.id,to:2,give:[{t:'res',r:'min',v:3000}],want:[]});",
    "return JSON.stringify({gelir:+gelir.toFixed(1),",
    "  g1:gw(1), g100:gw(100), g1000:gw(1000), dengeli:dengeli,",
    "  kucukSon:kucukSon, ilkOdul:r1, cooldownIcinde:r2,",
    "  cooldownSonrasi:G.emps[2].rel[G.p.id],",
    "  transferler:(b1&&b2&&b3), damga:damga, damgaSonra:damgaSonra});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('1 birimlik hediye ilişki VERMEZ', d.g1===0, String(d.g1));
  ok('100 birim → küçük goodwill', d.g100>=1 && d.g100<=2, String(d.g100));
  ok('1000 birim → tavan 4', d.g1000===4, String(d.g1000));
  ok('dengeli takas goodwill VERMEZ', d.dengeli===0, String(d.dengeli));
  ok('goodwill 0–4 tam sayı aralığında',
     [d.g1,d.g100,d.g1000].every(x=>Number.isInteger(x)&&x>=0&&x<=4));
  ok('10 küçük hediye ilişki FARM\'ı üretmiyor', d.kucukSon===0, String(d.kucukSon));
  ok('büyük hediye bir kez ödüllendirildi', d.ilkOdul>0, String(d.ilkOdul));
  ok('cooldown içinde ikinci hediye ilişki VERMEDİ',
     d.cooldownIcinde===d.ilkOdul, d.ilkOdul+' → '+d.cooldownIcinde);
  ok('cooldown sırasında transfer yine de gerçekleşti', d.transferler===true);
  ok('cooldown damgası save/load ile KALICI',
     d.damga===d.damgaSonra && d.damga!=='{}' , d.damga+' / '+d.damgaSonra);
  ok('12 ay sonra goodwill yeniden kazanılabildi',
     d.cooldownSonrasi>d.cooldownIcinde,
     d.cooldownIcinde+' → '+d.cooldownSonrasi);
}

/* ═══ G. GÖREV F — FAKTÖRLER VE CAP'LER ═══ */
console.log('\nG. AÇIKLANABİLİR DEĞERLEME');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var ai=G.emps[1], e=G.p;ai.intel=ai.intel||{};ai.intel[e.id]=3;",
    "var of={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:300}],want:[{t:'res',r:'ene',v:100}]};",
    "function ev(){ return evalOffer(ai,of); }",
    "var s={};",
    "ai.rel[e.id]=-100; var a1=ev(); ai.rel[e.id]=100; var a2=ev(); ai.rel[e.id]=0;",
    "s.rel={dusuk:+a1.net.toFixed(2), yuksek:+a2.net.toFixed(2), yon:a2.net>a1.net,",
    "  cap:[a1.factors.rel, a2.factors.rel]};",
    "function mem(v){ G.emps.forEach(function(x){ if(x.id===e.id||x.wild||x.dead) return;",
    "  x.mem=x.mem||{}; x.mem[e.id]=[{k:'t',v:v,t:0}]; }); }",
    "mem(-60); var h1=ev(); mem(60); var h2=ev();",
    "G.emps.forEach(function(x){ if(x.mem) delete x.mem[e.id]; });",
    "s.honor={kotu:h1.factors.honor, iyi:h2.factors.honor, yon:h2.net>h1.net};",
    "ai.mem=ai.mem||{}; ai.mem[e.id]=[{k:'t',v:-80,t:0}]; var t1=ev();",
    "ai.mem[e.id]=[{k:'t',v:80,t:0}]; var t2=ev(); delete ai.mem[e.id];",
    "s.trust={kotu:t1.factors.trust, iyi:t2.factors.trust, yon:t2.net>t1.net};",
    "var eskiE=JSON.stringify(e.ethics), eskiA=JSON.stringify(ai.ethics);",
    "ai.ethics={mil:3,aut:3,mat:3,ahl:3}; e.ethics={mil:3,aut:3,mat:3,ahl:3};",
    "var i1=ev(); e.ethics={mil:-3,aut:-3,mat:-3,ahl:-3}; var i2=ev();",
    "s.ideoloji={yakin:i1.factors.ethic, zit:i2.factors.ethic, yon:i1.net>i2.net,",
    "  gapZit:i2.ethicGap};",
    "/* yeterli tazminat yumuşak ideoloji farkını AŞABİLİR */",
    "var buyuk={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:5000}],want:[{t:'res',r:'ene',v:10}]};",
    "s.tazminatAsar=evalOffer(ai,buyuk).net>0;",
    "e.ethics=JSON.parse(eskiE); ai.ethics=JSON.parse(eskiA);",
    "/* ortak düşman YALNIZ güvenlik maddelerinde */",
    "var maddi={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:100}],want:[]};",
    "var guv={from:e.id,to:ai.id,give:[{t:'nap'}],want:[]};",
    "s.foe={maddi:evalOffer(ai,maddi).factors.foe, guvenlik:evalOffer(ai,guv).factors.foe};",
    "s.envoyNotr=ev().factors.envoy===1;",
    "/* SAFLIK: 200 tekrar */",
    "var A={res:JSON.stringify(ai.res), rng:RND_STATE, rel:JSON.stringify(ai.rel),",
    "  mem:JSON.stringify(ai.mem||{}), log:(G.log||[]).length};",
    "for(var i=0;i<200;i++){ normalizeDeal(of); dealValidity(of); dealQuote(of); evalOffer(ai,of); }",
    "s.saf={res:JSON.stringify(ai.res)===A.res, rng:RND_STATE===A.rng,",
    "  rel:JSON.stringify(ai.rel)===A.rel, mem:JSON.stringify(ai.mem||{})===A.mem,",
    "  log:(G.log||[]).length===A.log};",
    "/* determinizm */",
    "var d1=JSON.stringify(ev().net), d2=JSON.stringify(ev().net);",
    "s.deterministik=d1===d2;",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const R=d.rel||{}, Hn=d.honor||{}, T=d.trust||{}, I=d.ideoloji||{}, F=d.foe||{};
  ok('ilişki faktörü doğru yönde ve [0.80,1.20] cap içinde',
     R.yon===true && R.cap[0]>=0.80 && R.cap[1]<=1.20, JSON.stringify(R.cap));
  ok('onur faktörü doğru yönde ve [0.92,1.08] içinde',
     Hn.yon===true && Hn.kotu>=0.92 && Hn.iyi<=1.08, Hn.kotu+'..'+Hn.iyi);
  ok('güven/hafıza faktörü doğru yönde ve [0.85,1.15] içinde',
     T.yon===true && T.kotu>=0.85 && T.iyi<=1.15, T.kotu+'..'+T.iyi);
  ok('ideoloji faktörü doğru yönde ve [0.90,1.10] içinde',
     I.yon===true && I.zit>=0.90 && I.yakin<=1.10, I.zit+'..'+I.yakin);
  ok('ethicGap normalleştirilmiş (0–1)', I.gapZit>=0 && I.gapZit<=1, String(I.gapZit));
  ok('yeterli tazminat yumuşak ideoloji farkını AŞABİLİYOR', d.tazminatAsar===true);
  ok('ortak düşman yalnız GÜVENLİK maddelerinde etkili',
     F.maddi===1 && F.guvenlik>=1 && F.guvenlik<=1.15,
     'maddi='+F.maddi+' güvenlik='+F.guvenlik);
  ok('Elçi yoksa anlaşma faktörü nötr', d.envoyNotr===true);
  ok('800 çağrı tamamen SAF (kaynak/RNG/ilişki/hafıza/log)',
     d.saf && d.saf.res && d.saf.rng && d.saf.rel && d.saf.mem && d.saf.log);
  ok('değerleme DETERMİNİSTİK', d.deterministik===true);
}

/* ═══ H. GÖREV G — AI KARARI ═══ */
console.log('\nH. AI KABUL / RET / KARŞI TEKLİF');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var ai=G.emps[1], e=G.p;ai.intel=ai.intel||{};ai.intel[e.id]=3;",
    "/* Oyuncu FAKİR olmalı: aksi hâlde AI açığı kapatan bir karşı",
"   teklif kurabiliyor ve doğru olarak 'karsi' diyor. */",
"e.res.min=9000; e.res.ene=9000; ai.res.ene=3000;",
    "ai.rel[e.id]=20;",
    "var comar={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:4000}],want:[{t:'res',r:'ene',v:50}]};",
    "var kotu={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:1}],want:[{t:'res',r:'ene',v:2500}]};",
"var fakir=G.emps[4]; G.p.contact[fakir.id]=true; fakir.contact[G.p.id]=true;",
"var yedekRes=JSON.stringify(e.res);",
    "var yakin={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:300}],want:[{t:'res',r:'ene',v:500}]};",
    "var a=aiRespond(ai,comar), c=aiRespond(ai,yakin);",
"/* RET ölçümü: oyuncunun elinde kapatacak hiçbir şey yok */",
"e.res={min:1,ene:1,ala:0,ara:0,yiy:0,tuk:0,etk:0};",
"e.techs={}; var b=aiRespond(ai,kotu);",
"e.res=JSON.parse(yedekRes);",
    "/* karşı teklif AI'ın gerçekten alabileceği maddelerden mi */",
    "var karsiGecerli=true;",
    "if(c.v==='karsi'){ var yeni={from:e.id,to:ai.id,",
    "  give:comar.give.concat(c.add||[]), want:yakin.want.slice()};",
    "  karsiGecerli=(c.add||[]).every(function(it){",
    "    return !it.r || (e.res[it.r]||0)>=it.v; }); }",
    "/* determinizm */",
    "var c2=aiRespond(ai,yakin);",
    "/* sert kilit tazminatla aşılamaz */",
    "/* GERÇEK üretim koşulu: diploBlocked → isPurifier → e.mizac */",
    "var pur=G.emps[2]; pur.mizac='izolasyonist';",
    "var dev={from:e.id,to:pur.id,give:[{t:'res',r:'min',v:9000}],want:[]};",
    "var pr=aiRespond(pur,dev);",
    "return JSON.stringify({comar:a.v, kotu:b.v, yakin:c.v,",
    "  karsiEk:(c.add||[]).length, karsiGecerli:karsiGecerli,",
    "  deterministik:JSON.stringify(c.v)===JSON.stringify(c2.v),",
    "  kotuNeden:(b.why||'').slice(0,40),",
    "  sertKilit:pr.v, sertNeden:(pr.why||'').slice(0,50),",
    "  hardLock:!!(pr.ev&&pr.ev.hardLock)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('cömert teklif → KABUL', d.comar==='kabul', d.comar);
  ok('çok kötü teklif → RET', d.kotu==='red', d.kotu+' · '+d.kotuNeden);
  ok('yakın ama yetersiz → KABUL veya KARŞI TEKLİF',
     d.yakin==='karsi'||d.yakin==='kabul', d.yakin);
  ok('karşı teklif yalnız teslim edilebilir maddeler içeriyor',
     d.karsiGecerli===true);
  ok('AI kararı DETERMİNİSTİK', d.deterministik===true);
  ok('sert doktrin kilidi tazminatla AŞILAMIYOR',
     d.sertKilit==='red', d.sertKilit+' · '+d.sertNeden);
}

/* ═══ H2. AI-AI YOLU KANONİK MOTORU ATLAMIYOR ═══ */
console.log('\nH2. AI-AI KANONİK BAĞLANTI');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var a=G.emps[1], b=G.emps[2];",
    "/* ÖLÇÜLEN: oyun başında AI-AI teması SIFIR; headless simülasyonda",
    "   keşif ilerlemediği için AI-AI antlaşma kapısı hiç açılmıyor.",
    "   Bağlantıyı doğrudan sınıyoruz. */",
    "var temasSayi=0;",
    "G.emps.forEach(function(x){ if(x.wild||x.dead||!x.id) return;",
    "  G.emps.forEach(function(y){ if(y.id<=x.id||y.wild||y.dead) return;",
    "    if(x.contact[y.id]) temasSayi++; }); });",
    "a.contact[b.id]=true; b.contact[a.id]=true;",
    "a.res.etk=500; a.pact={}; b.pact={}; a.ally={}; b.ally={};",
    "var cagri=0; var org=executeDeal;",
    "globalThis.executeDeal=function(o){ cagri++; return org(o); };",
    "var etk0=a.res.etk;",
    "var rp=executeDeal({from:a.id,to:b.id,give:[{t:'pact'}],want:[]});",
    "var pactMaliyet=etk0-a.res.etk;",
    "var etk1=a.res.etk;",
    "var ra=executeDeal({from:a.id,to:b.id,give:[{t:'ally'}],want:[]});",
    "var allyMaliyet=etk1-a.res.etk;",
    "globalThis.executeDeal=org;",
    "return JSON.stringify({baslangicTemas:temasSayi, cagri:cagri,",
    "  pactOk:rp, pactVar:!!a.pact[b.id], pactMaliyet:pactMaliyet,",
    "  allyOk:ra, allyVar:!!a.ally[b.id], allyMaliyet:allyMaliyet,",
    "  pactKuruldu:!!a.pact[b.id]});"].join('\n'));
  /* Kaynak düzeyi kanıt: ai.js'de ham yollar kaldı mı? */
  const aiSrc=oku('ai.js');
  /* Yorum satırları hariç: yalnız GERÇEK kod aranır. */
  const aiKod=aiSrc.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const hamEtki=/res\.etk -= 70|res\.etk -= 150/.test(aiKod);
  const hamRel=/e\.rel\[o\.id\] = Math\.max\(e\.rel\[o\.id\], 55\)/.test(aiKod);
  const kanonik=/executeDeal\(\{from:e\.id, to:o\.id/.test(aiKod);
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ÖLÇÜM: oyun başında AI-AI teması sıfır (sim sınırı)',
     d.baslangicTemas===0, String(d.baslangicTemas));
  ok('AI-AI pact kanonik executeDeal\'den geçiyor',
     d.pactOk===true && d.pactVar===true && d.cagri>=1);
  ok('AI-AI pact maliyeti KANONİK tablodan (40, eskiden 70)',
     d.pactMaliyet===40, String(d.pactMaliyet));
  ok('AI-AI ittifak kanonik executeDeal\'den geçiyor',
     d.allyOk===true && d.allyVar===true);
  ok('AI-AI ittifak maliyeti KANONİK tablodan (90, eskiden 150)',
     d.allyMaliyet===90, String(d.allyMaliyet));
  ok('ai.js\'de ham Etki kesme (70/150) KALMADI', hamEtki===false);
  ok('ai.js\'de ham ilişki ataması (rel=55) KALMADI', hamRel===false);
  /* FAZ 86C.3: AI-AI yolu artık DOĞRUDAN executeDeal çağırmıyor —
     karşılıklı müzakere için aiNegotiate'e bağlandı. Kanonik hat
     korunuyor (aiNegotiate içinden executeDeal'e düşüyor), ama
     alıcı AI önce değerlendiriyor. */
  /* FAZ 86C.4: karşılıklı teklif şekli — çağrı tp/ta üzerinden. */
  ok('ai.js AI-AI yolu kanonik müzakereye bağlı (aiNegotiate)',
     /aiNegotiate\(e, o, tp\.give, tp\.want,true\)/.test(aiKod) &&
     /aiNegotiate\(e, o, ta\.give, ta\.want,true\)/.test(aiKod));
  ok('aiNegotiate kanonik executeDeal kullanıyor',
     /function aiNegotiate[\s\S]{0,2600}executeDeal\(teklif\)/.test(aiKod));
}

/* ═══ I. 86B REGRESYONLARI ═══ */
console.log('\nI. 86B REGRESYONLARI');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; o.res.min=500;",
    "var top0=e.res.min+o.res.min;",
    "var cog=executeDeal({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:800},{t:'res',r:'min',v:800}],want:[]});",
    "var top1=e.res.min+o.res.min;",
    "e.rel[o.id]=0; o.rel[e.id]=0;",
    "var bos=executeDeal({from:e.id,to:o.id,give:[],want:[]});",
    "for(var i=0;i<10;i++) executeDeal({from:e.id,to:o.id,give:[],want:[]});",
    "var bosRel=e.rel[o.id];",
    "e.nap={}; o.nap={}; e.rel[o.id]=0; o.rel[e.id]=0; e.res.etk=9999;",
    "var n1=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "var rel1=e.rel[o.id];",
    "var n2=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "var n3=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "return JSON.stringify({cogaltma:cog, toplamKorundu:top0===top1,",
    "  bos:bos, bosRel:bosRel,",
    "  nap:[n1,n2,n3], relIlk:rel1, relSon:e.rel[o.id]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kaynak çoğaltma KAPALI (800+800 vs 1000)',
     d.cogaltma===false && d.toplamKorundu===true);
  ok('boş anlaşma KAPALI (11 deneme, ilişki 0)',
     d.bos===false && d.bosRel===0, String(d.bosRel));
  ok('yürürlükteki antlaşma farm\'ı KAPALI',
     JSON.stringify(d.nap)==='[true,false,false]' && d.relSon===d.relIlk,
     JSON.stringify(d.nap));
}

/* ═══ J. 3 SEED × 360 AY SİMÜLASYON ═══ */
console.log('\nJ. DETERMİNİSTİK UZUN SİMÜLASYON (3 seed × 360 ay)');
{
  const seedler=[11,99,404];
  const ozet=[];
  for(const sd of seedler){
    const H=harness(); H.R(KUR(sd));
    const r=H.R([
      "var say={teklif:0,yanit:0,kabul:0,red:0,karsi:0,exec:0,execFail:0};",
      "/* GERÇEK giriş noktaları: AI→oyuncu teklifi UI.aiOffer üzerinden,",
"   yanıt UI içindeki aiRespond çağrısıyla gelir. Ayrıca doğrudan",
"   aiRespond/executeDeal sarmalanır. */",
"var orgResp=aiRespond, orgExec=executeDeal, orgOffer=UI.aiOffer;",
"UI.aiOffer=function(o){ say.teklif++; return orgOffer.call(UI,o); };",
      "globalThis.aiRespond=function(a,o){ say.yanit++;",
      "  var v=orgResp(a,o);",
      "  if(v.v==='kabul') say.kabul++; else if(v.v==='karsi') say.karsi++;",
      "  else say.red++; return v; };",
      "globalThis.executeDeal=function(o){ var r=orgExec(o);",
      "  if(r) say.exec++; else say.execFail++; return r; };",
      "var hata='', nanVar=false, negVar=false;",
      "var toplam0=0; G.emps.forEach(function(x){ for(var k in x.res)",
      "  toplam0+=Math.max(0,x.res[k]||0); });",
      "/* ÖLÇÜM DÜZELTMESİ: monthTick() G.day'i ilerletmez — gerçek",
"   oyunda gün döngüsü yapar. AI teklif kapısı (G.day-lastProp>540)",
"   bu yüzden hiç açılmıyordu. Ay başına 30 gün ilerletilir. */",
"try{ for(var m=0;m<360;m++){ G.day+=30; monthTick(); G.over=null; } }",
      "catch(ex){ hata=ex.message; }",
      "globalThis.aiRespond=orgResp; globalThis.executeDeal=orgExec; UI.aiOffer=orgOffer;",
      "var savas=0, pact=0, ally=0, nap=0, relTop=0, relN=0;",
      "G.emps.forEach(function(x){ if(x.dead||x.wild) return;",
      "  for(var k in x.res){ var v=x.res[k];",
      "    if(typeof v==='number'){ if(!isFinite(v)) nanVar=true; if(v<0) negVar=true; } }",
      "  G.emps.forEach(function(y){ if(y.id<=x.id||y.dead||y.wild) return;",
      "    if(x.war[y.id]) savas++;",
      "    if(x.pact&&x.pact[y.id]) pact++;",
      "    if(x.ally[y.id]) ally++;",
      "    if(x.nap&&x.nap[y.id]>G.day) nap++;",
      "    relTop+=(x.rel[y.id]||0); relN++; }); });",
      "var ciftSayi=G.emps.filter(function(x){return !x.dead&&!x.wild;}).length;",
      "ciftSayi=ciftSayi*(ciftSayi-1)/2;",
      "return JSON.stringify({say:say, hata:hata, nanVar:nanVar, negVar:negVar,",
      "  savas:savas, pact:pact, ally:ally, nap:nap, cift:ciftSayi,",
      "  ortRel:relN?+(relTop/relN).toFixed(1):0,",
      "  sits:(G.sits||[]).length});"].join('\n'));
    let d={}; try{d=JSON.parse(r);}catch(e){ d={hata:'parse'}; }
    ozet.push({sd, d});
    ok('seed '+sd+': 360 ay HATASIZ', d.hata==='', d.hata||'ok');
    ok('seed '+sd+': NaN veya negatif stok YOK',
       d.nanVar===false && d.negVar===false);
    ok('seed '+sd+': galaksi kalıcı savaşa KİLİTLENMEDİ',
       d.savas < d.cift, d.savas+'/'+d.cift+' çift savaşta');
    ok('seed '+sd+': galaksi kalıcı ittifaka KİLİTLENMEDİ',
       d.ally < d.cift, d.ally+'/'+d.cift+' çift ittifakta');
    ok('seed '+sd+': Situation tetiklenmedi', d.sits===0, String(d.sits));
  }
  console.log('\n  ── SİMÜLASYON TABLOSU ──');
  ozet.forEach(({sd,d})=>{
    const s=d.say||{};
    console.log('  seed '+sd+': teklif '+s.teklif+' · kabul '+s.kabul+
      ' · ret '+s.red+' · karşı '+s.karsi+' · yanıt '+s.yanit+' | exec ok '+s.exec+
      ' / red '+s.execFail+' | savaş '+d.savas+' pact '+d.pact+
      ' ally '+d.ally+' nap '+d.nap+' (çift '+d.cift+') · ort.ilişki '+d.ortRel);
  });
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
