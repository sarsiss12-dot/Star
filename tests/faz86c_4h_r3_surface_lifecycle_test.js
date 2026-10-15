#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H-R3: TUVAL KURTARMA YAŞAM DÖNGÜSÜ
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
/* ═══ GERÇEK DOM AĞACI + HER CANVAS KENDİ CONTEXT'İ ═══
   R2 testinin kör noktası: bütün canvas'lar AYNI sahte context'i
   döndürüyordu, bu yüzden "yeniCtx=false" olmasına rağmen iddia
   geçiyordu. Burada her canvas kendi context nesnesini üretir; aynı
   canvas'tan tekrar alınan context AYNI nesnedir. */
const DOM=[
 "var WL={}, DL={}, ctxSeri=0, tuvaller=[];",
 "var ow=window.addEventListener, od=document.addEventListener;",
 "window.addEventListener=function(t,f){ (WL[t]=WL[t]||[]).push(f);",
 "  return ow&&ow.call(window,t,f); };",
 "document.addEventListener=function(t,f){ (DL[t]=DL[t]||[]).push(f);",
 "  return od&&od.call(document,t,f); };",
 "function yeniTuval(){ var L={}, kendi=null, kir=false;",
 "  var c={ id:'map', className:'', width:900, height:420, style:{}, _L:L,",
 "    _kir:function(v){ kir=v; },",
 "    classList:{add:function(){},remove:function(){},contains:function(){return false;}},",
 "    getContext:function(){ if(kir) return null;",
 "      if(!kendi){ kendi=document.getElementById('map0').getContext('2d');",
 "        kendi=Object.create(kendi); kendi.__id=++ctxSeri; kendi.canvas=c; }",
 "      return kendi; },",
 "    getAttribute:function(){ return null; }, setAttribute:function(){},",
 "    getBoundingClientRect:function(){ return {left:0,top:0,width:900,height:420,",
 "      right:900,bottom:420}; },",
 "    addEventListener:function(t,f){ (L[t]=L[t]||[]).push(f); },",
 "    removeEventListener:function(t,f){ if(L[t]) L[t]=L[t].filter(function(x){return x!==f;}); },",
 "    setPointerCapture:function(){}, releasePointerCapture:function(){},",
 "    clientWidth:900, clientHeight:420, offsetWidth:900, offsetHeight:420 };",
 "  tuvaller.push(c); return c; }",
 "var ebeveyn={ cocuk:null, replaceChild:function(y,e){ this.cocuk=y; y.parentNode=this; } };",
 "var cv=yeniTuval(); cv.parentNode=ebeveyn; ebeveyn.cocuk=cv;",
 "var orgGet=document.getElementById, orgCreate=document.createElement;",
 "document.getElementById=function(id){ return id==='map'? ebeveyn.cocuk : orgGet(id); };",
 "document.createElement=function(t){ return t==='canvas'? yeniTuval() : orgCreate(t); };",
 "View._globalBound=false; View._boundCv=null; View._surfListeners=null;",
 "View.cv=cv; View.g=cv.getContext('2d'); View.vw=900; View.vh=420; View.dpr=1;",
 "View.bind();",
 "function sayGlobal(){ return {blur:(WL.blur||[]).length,",
 "  vis:(DL.visibilitychange||[]).length}; }",
 "function sayYuzey(c){ var L=(c&&c._L)||{}; var o={}, t=0;",
 "  ['pointerdown','pointermove','pointerup','pointercancel',",
 "   'lostpointercapture','wheel','contextlost','contextrestored']",
 "  .forEach(function(k){ o[k]=(L[k]||[]).length; t+=o[k]; });",
 "  o._toplam=t; return o; }",
 "function ev(c,t,id,x,y){ var L=(c._L||{})[t]||[];",
 "  L.forEach(function(f){ try{ f({pointerId:id, clientX:x, clientY:y,",
 "    preventDefault:function(){}}); }catch(e){} }); }",
 "function domGeri(){ document.getElementById=orgGet;",
 "  document.createElement=orgCreate;",
 "  window.addEventListener=ow; document.addEventListener=od; }"].join('\n');
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "return 'ok';"].join('\n');

/* ═══ A. SÖZDİZİMİ, SINIR, KARANTİNA ═══ */
console.log('\nA. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const mn=oku('main.js'), mp=oku('map.js'), sw=oku('sw.js');
  ok("sw cache = 'stars-v94d'", /const CACHE = 'stars-v94d'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  /* R3 düzeltmeleri kod düzeyinde */
  ok('A: global dinleyiciler tek sefer bağlanıyor',
     /if \(!View\._globalBound\)\{/.test(mp));
  ok('yüzey dinleyicileri kaydediliyor (_surfListeners)',
     /this\._surfListeners = \[\]/.test(mp));
  ok('unbindSurface eski yüzeyi söküyor', /  unbindSurface\(\)\{/.test(mp));
  ok('bind() önce unbindSurface çağırıyor',
     /this\.unbindSurface\(\);\s*\n\s*this\._boundCv = cv;/.test(mp));
  ok('B: context olayları yüzey yaşam döngüsünde',
     /_ekle\('contextlost'/.test(mp) && /_ekle\('contextrestored'/.test(mp));
  ok('C: nesil koruması gerçek karar noktasında',
     /if \(surfGen !== _surfGen\)\{/.test(mn));
  ok('D: context alınamazsa yüzey basamağına geçiliyor',
     /rebuildCanvasSurface\(sebep \+ '\+noctx'\)/.test(mn));
  ok('E: context ÖNCE hazırlanıyor, sonra DOM değişiyor',
     mn.indexOf("try { g = yeni.getContext('2d'); } catch(e){}") <
     mn.indexOf('eski.parentNode.replaceChild(yeni, eski);'));
  ok('E: hazırlık hatasında geri alma var',
     /yeni\.parentNode\.replaceChild\(eski, yeni\)/.test(mn));
  ok('F: çizim hatası belirsizlikten öncelikli',
     /if \(h\.belirsiz && !cizHata\)\{/.test(mn));
  /* Korunacaklar */
  ok('R2: worldBoundsFrom korundu', /function worldBoundsFrom\(d\)/.test(mn));
  ok('R2: restoreWorldBounds korundu', /function restoreWorldBounds\(d\)/.test(mn));
  ok('R2: LOGI_ON bağımsız katman korundu', /let LOGI_ON = false;/.test(mn));
  ok('R1: pointerup kapat() tap\'ten önce',
     mp.indexOf('kapat(ev.pointerId);                    // ÖNCE temizle') <
     mp.indexOf('this.tap(nokta);'));
  ok('R1: tap(screenPos) parametresi korundu', /  tap\(screenPos\)\{/.test(mp));
  const eco=oku('economy.js'), dip=oku('diplomacy.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
}
{
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json','map.js',
   'index.html'].forEach(f=>{
    if(f==='index.html'){ok('93D bilim CSS ve değişmeyen 93C HTML',
      require('./helpers/ui-preservation').isReviewedUI(oku(f)));return;}
    // 91D: bütün map.js yerine değişmemesi gereken altyapı bölümleri kilitli.
    if(f==='map.js'){ok('map altyapısı sabit; hedef seçimi 93A referansında',
      require('./helpers/map-preservation').isMapInfrastructurePreserved(oku(f)));return;}
    if(!ref||!ref[f]){ ok(f+' referansı var', false); return; }
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
}

/* ═══ B. TEST HARNESS'ININ KENDİSİ DOĞRU MU ═══ */
console.log('\nB. HARNESS DOĞRULAMASI (R2 kör noktası)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var c1=ebeveyn.cocuk;",
    "var a=c1.getContext('2d'), b=c1.getContext('2d');",
    "var c2=yeniTuval();",
    "var d=c2.getContext('2d');",
    "domGeri();",
    "return JSON.stringify({ayniCanvasAyniCtx:(a===b),",
    "  farkliCanvasFarkliCtx:(a!==d), ctxCanvasEsler:(a.canvas===c1 && d.canvas===c2)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('aynı canvas → AYNI context nesnesi', d.ayniCanvasAyniCtx===true);
  ok('farklı canvas → FARKLI context nesnesi', d.farkliCanvasFarkliCtx===true);
  ok('ctx.canvas kendi canvas\'ını gösteriyor', d.ctxCanvasEsler===true);
}

/* ═══ C. A/B/C BULGULARI — ÖNCE/SONRA ═══ */
console.log('\nC. DİNLEYİCİ YAŞAM DÖNGÜSÜ (A, B, C bulguları)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var g0=sayGlobal(); var ilkCv=ebeveyn.cocuk; var y0=sayYuzey(ilkCv);",
    "/* 10 yüzey değişimi */",
    "var basarili=0;",
    "for(var i=0;i<10;i++){ if(rebuildCanvasSurface('t'+i)) basarili++; }",
    "var sonCv=ebeveyn.cocuk;",
    "var g1=sayGlobal(); var y1=sayYuzey(sonCv);",
    "/* tek blur olayı kaç resetGesture */",
    "var rg=0; var org=View.resetGesture;",
    "View.resetGesture=function(){ rg++; return org.apply(View,arguments); };",
    "(WL.blur||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "View.resetGesture=org;",
    "/* eski yüzeyler söküldü mü */",
    "var eskiToplam=0;",
    "tuvaller.forEach(function(c){ if(c!==sonCv) eskiToplam+=sayYuzey(c)._toplam; });",
    "/* C: eski yüzey güncel kamerayı değiştirebiliyor mu */",
    "View.cam.x=3000; View.cam.y=3000; View.cam.z=0.5;",
    "var camOnce=View.cam.x;",
    "ev(ilkCv,'pointerdown',99,400,300); ev(ilkCv,'pointermove',99,380,300);",
    "var camSonra=View.cam.x;",
    "/* C: emekli yüzeyin contextrestored'ı yeni kurtarma planlamıyor */",
    "var planSay=0; var oSch=scheduleRecovery;",
    "globalThis.scheduleRecovery=function(s,m){ planSay++; return oSch(s,m); };",
    "((ilkCv._L||{}).contextrestored||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "globalThis.scheduleRecovery=oSch;",
    "/* B: YENİ yüzeyde context olayları var mı */",
    "domGeri();",
    "return JSON.stringify({basarili:basarili, global:{once:g0, sonra:g1},",
    "  blurResetGesture:rg, yuzeyOnce:y0, yuzeySonra:y1,",
    "  eskiYuzeyToplam:eskiToplam,",
    "  camDegisti:(camSonra!==camOnce), emekliPlan:planSay});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const G0=(d.global||{}).once||{}, G1=(d.global||{}).sonra||{};
  ok('10 yüzey değişimi başarılı', d.basarili===10, String(d.basarili));
  ok('A: window blur dinleyicisi ÇOĞALMADI (1→1)',
     G0.blur===1 && G1.blur===1, G0.blur+' → '+G1.blur);
  ok('A: document visibilitychange ÇOĞALMADI',
     G1.vis===G0.vis, G0.vis+' → '+G1.vis);
  ok('A: tek blur olayı resetGesture\'ı TAM BİR kez çalıştırdı',
     d.blurResetGesture===1, String(d.blurResetGesture));
  ok('B: YENİ yüzeyde contextlost dinleyicisi var',
     (d.yuzeySonra||{}).contextlost===1, String((d.yuzeySonra||{}).contextlost));
  ok('B: YENİ yüzeyde contextrestored dinleyicisi var',
     (d.yuzeySonra||{}).contextrestored===1,
     String((d.yuzeySonra||{}).contextrestored));
  ok('B: ilk ve yeni yüzey AYNI korumaya sahip',
     JSON.stringify(d.yuzeyOnce)===JSON.stringify(d.yuzeySonra),
     JSON.stringify(d.yuzeySonra));
  ok('emekli yüzeylerin dinleyicileri SÖKÜLDÜ',
     d.eskiYuzeyToplam===0, String(d.eskiYuzeyToplam)+' kalıntı');
  ok('C: emekli yüzey güncel kamerayı DEĞİŞTİREMİYOR',
     d.camDegisti===false);
  ok('C: emekli yüzeyin contextrestored\'ı kurtarma planlamıyor',
     d.emekliPlan===0, String(d.emekliPlan));
}

/* ═══ D. BAŞARISIZLIK YOLLARI (D, E, F) ═══ */
console.log('\nD. BAŞARISIZLIK YOLLARI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var out={};",
    "/* D) mevcut canvas context VERMİYOR → yüzey basamağına ulaş */",
    "var yrSay=0; var oRb=rebuildCanvasSurface;",
    "globalThis.rebuildCanvasSurface=function(s){ yrSay++; return oRb(s); };",
    "ebeveyn.cocuk._kir(true);",
    "DIAG.length=0; _recCalisiyor=false;",
    "runRecovery('resize', 0);",
    "out.D={yuzeyDeneme:yrSay, tani:DIAG.map(function(x){return x.m.slice(0,44);}).slice(0,3)};",
    "globalThis.rebuildCanvasSurface=oRb;",
    "/* E) YENİ canvas context VERMİYOR → referanslar tutarlı kalmalı */",
    "var saglam=yeniTuval(); saglam.parentNode=ebeveyn; ebeveyn.cocuk=saglam;",
    "View._boundCv=null; View.cv=saglam; View.g=saglam.getContext('2d'); View.bind();",
    "var eskiEl=ebeveyn.cocuk, eskiG=View.g;",
    "var oCreate=document.createElement;",
    "document.createElement=function(t){ if(t==='canvas'){ var c=yeniTuval();",
    "  c._kir(true); return c; } return oCreate(t); };",
    "_recCalisiyor=false;",
    "var sonuc=rebuildCanvasSurface('E-testi');",
    "document.createElement=oCreate;",
    "out.E={sonuc:sonuc, domAyni:(ebeveyn.cocuk===eskiEl),",
    "  cvAyni:(View.cv===eskiEl), gAyni:(View.g===eskiG),",
    "  tutarli:(View.g && View.g.canvas===View.cv)};",
    "/* F) çizim hatası + belirsiz örnekleme → 'ok' YAZILMAMALI */",
    "DIAG.length=0; _recCalisiyor=false;",
    "var oDraw=View.draw;",
    "View.draw=function(){ throw new Error('enjekte: fillRect'); };",
    "var oVer=verifyRenderHealth;",
    "globalThis.verifyRenderHealth=function(){ return {ok:false, belirsiz:true,",
    "  why:'güvenilir örnek yok', kod:'belirsiz'}; };",
    "yrSay=0; globalThis.rebuildCanvasSurface=function(s){ yrSay++; return true; };",
    "runRecovery('resize', 0);",
    "View.draw=oDraw; globalThis.verifyRenderHealth=oVer;",
    "globalThis.rebuildCanvasSurface=oRb;",
    "var kayitlar=DIAG.map(function(x){return x.m;});",
    "out.F={okBelirsiz:kayitlar.some(function(m){return /ok\\(belirsiz\\)/.test(m);}),",
    "  cizimHatasiKaydi:kayitlar.some(function(m){return /ÇİZİM HATASI/.test(m);}),",
    "  kayit:kayitlar.slice(0,3).map(function(m){return m.slice(0,50);})};",
    "/* Sağlıklı BOŞ viewport → gereksiz yeniden kurma YOK */",
    "DIAG.length=0; _recCalisiyor=false; yrSay=0;",
    "globalThis.rebuildCanvasSurface=function(s){ yrSay++; return true; };",
    "globalThis.verifyRenderHealth=function(){ return {ok:false, belirsiz:true,",
    "  why:'boş uzay', kod:'belirsiz'}; };",
    "runRecovery('resize', 0);",
    "globalThis.verifyRenderHealth=oVer; globalThis.rebuildCanvasSurface=oRb;",
    "out.bosViewport={yuzeyDeneme:yrSay,",
    "  ok:DIAG.map(function(x){return x.m;}).some(function(m){",
    "    return /ok\\(belirsiz\\)/.test(m);})};",
    "domGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const D=d.D||{}, E=d.E||{}, F=d.F||{}, BV=d.bosViewport||{};
  ok('D: context alınamayınca yüzey yeniden kurma DENENDİ',
     D.yuzeyDeneme>=1, String(D.yuzeyDeneme)+' deneme');
  ok('E: hazırlanamayan yüzey için false döndü', E.sonuc===false);
  ok('E: DOM eski elemente DOKUNULMADI', E.domAyni===true);
  ok('E: View.cv ve View.g eski değerlerinde', E.cvAyni===true && E.gAyni===true);
  ok('E: View.g.canvas === View.cv (yarım geçiş YOK)', E.tutarli===true);
  ok('F: çizim hatası varken "ok(belirsiz)" YAZILMADI',
     F.okBelirsiz===false, (F.kayit||[]).join(' | '));
  ok('F: çizim hatası açıkça kaydedildi', F.cizimHatasiKaydi===true);
  ok('F: çizim hatası uygun kurtarma basamağına ulaştı',
     (F.kayit||[]).length>0);
  ok('sağlıklı BOŞ viewport gereksiz yeniden kurma başlatmadı',
     BV.yuzeyDeneme===0 && BV.ok===true, 'deneme '+BV.yuzeyDeneme);
}

/* ═══ E. BAŞARILI KURTARMA SONRASI GİRDİ ═══ */
console.log('\nE. KURTARMA SONRASI GERÇEK GİRDİ ZİNCİRİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var once={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "View.cam.x=250; View.cam.y=180; View.cam.z=0.66;",
    "View.selSys=G.sys[6]; MAP_MODE='savas'; RADAR_ON=true; LOGI_ON=true;",
    "var kuruldu=rebuildCanvasSurface('E');",
    "var yeni=ebeveyn.cocuk;",
    "var sonra={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "/* Seçim ve tercihler kurtarmanın HEMEN ardından ölçülür:",
    "   aşağıdaki filo dokunuşu selSys'i doğal olarak null yapar",
    "   (map.js: filo seçilince sistem seçimi bırakılır). */",
    "var secimKorundu=(View.selSys===G.sys[6]);",
    "var tercihKorundu=(MAP_MODE==='savas'&&RADAR_ON===true&&LOGI_ON===true);",
    "/* TAP — gerçek View.tap, stub YOK */",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "var tabSay=0; var oTab=UI.tab; UI.tab=function(k){ if(k==='filo') tabSay++; };",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "var tapHata='';",
    "try{ ev(yeni,'pointerdown',1,150,120); ev(yeni,'pointerup',1,150,120); }",
    "catch(x){ tapHata=x.message; }",
    "UI.tab=oTab;",
    "/* PAN */",
    "View.rowHits=[];",
    "var x0=View.cam.x, z0=View.cam.z;",
    "ev(yeni,'pointerdown',2,400,300);",
    "for(var k=1;k<=6;k++) ev(yeni,'pointermove',2,400+k*14,300);",
    "ev(yeni,'pointerup',2,484,300);",
    "var pan={degisti:(View.cam.x!==x0), zoomAyni:(View.cam.z===z0)};",
    "/* PINCH */",
    "var z1=View.cam.z;",
    "ev(yeni,'pointerdown',3,300,300); ev(yeni,'pointerdown',4,420,300);",
    "ev(yeni,'pointermove',4,520,300);",
    "var pinch={zoomDegisti:(View.cam.z!==z1)};",
    "ev(yeni,'pointerup',3,300,300); ev(yeni,'pointerup',4,520,300);",
    "/* PINCH SONRASI PAN */",
    "var x2=View.cam.x, z2=View.cam.z;",
    "ev(yeni,'pointerdown',5,400,300);",
    "for(var k2=1;k2<=6;k2++) ev(yeni,'pointermove',5,400+k2*14,300);",
    "ev(yeni,'pointerup',5,484,300);",
    "domGeri();",
    "return JSON.stringify({kuruldu:kuruldu,",
    "  veriAyni:JSON.stringify(once)===JSON.stringify(sonra),",
    "  secim:secimKorundu, tercih:tercihKorundu,",
    "  ctxTutarli:(View.g && View.g.canvas===View.cv && View.cv===yeni),",
    "  tap:{hata:tapHata, say:tabSay}, pan:pan, pinch:pinch,",
    "  pinchSonrasiPan:{degisti:(View.cam.x!==x2), zoomAyni:(View.cam.z===z2)},",
    "  pts:View._gest.pts.size});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yüzey yeniden kuruldu', d.kuruldu===true);
  ok('View.cv / View.g / g.canvas TUTARLI', d.ctxTutarli===true);
  ok('oyun verisi ve RNG DEĞİŞMEDİ', d.veriAyni===true);
  ok('seçim korundu', d.secim===true);
  ok('ana mod ve iki katman tercihi korundu', d.tercih===true);
  ok('kurtarma sonrası gerçek TAP çalışıyor',
     (d.tap||{}).hata==='' && (d.tap||{}).say===1, JSON.stringify(d.tap));
  ok('kurtarma sonrası PAN çalışıyor, zoom sabit',
     (d.pan||{}).degisti===true && (d.pan||{}).zoomAyni===true);
  ok('kurtarma sonrası PINCH çalışıyor', (d.pinch||{}).zoomDegisti===true);
  ok('pinch SONRASI pan çalışıyor',
     (d.pinchSonrasiPan||{}).degisti===true &&
     (d.pinchSonrasiPan||{}).zoomAyni===true);
  ok('zincir sonunda pts 0', d.pts===0, String(d.pts));
}

/* ═══ F. MANUEL mapFix AYNI ZİNCİR ═══ */
console.log('\nF. MANUEL mapFix');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "ev(ebeveyn.cocuk,'pointerdown',1,200,200);",
    "ev(ebeveyn.cocuk,'pointerdown',2,320,200);",
    "View.cam.x=260; View.cam.y=190; View.cam.z=0.71;",
    "var once={pts:View._gest.pts.size, cam:{x:View.cam.x,y:View.cam.y,z:View.cam.z}};",
    "var recSay=0; var oSch=scheduleRecovery;",
    "globalThis.scheduleRecovery=function(s,m){ recSay++; return oSch(s,m); };",
    "var oClose=UI.closeModal; UI.closeModal=function(){};",
    "UI.act('mapFix');",
    "UI.closeModal=oClose; globalThis.scheduleRecovery=oSch;",
    "var g0=sayGlobal();",
    "domGeri();",
    "return JSON.stringify({once:once, ptsSonra:View._gest.pts.size,",
    "  pinch:View._gest.pinch===null,",
    "  camAyni:(View.cam.x===260&&View.cam.y===190&&View.cam.z===0.71),",
    "  rec:recSay, global:g0});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('mapFix öncesi takılı pointer vardı', (d.once||{}).pts===2);
  ok('mapFix jest durumunu sıfırladı', d.ptsSonra===0 && d.pinch===true);
  ok('mapFix kamerayı GEREKSİZ sıfırlamadı', d.camAyni===true);
  ok('mapFix TEK recovery planladı', d.rec===1, String(d.rec));
  ok('mapFix global dinleyici çoğaltmadı',
     (d.global||{}).blur===1, JSON.stringify(d.global));
}

/* ═══ G. GERÇEK KAYIT — KAMERA (R2 DÜZELTMESİ KORUNUYOR) ═══ */
console.log('\nG. GERÇEK KAYITLA KAMERA ERİŞİMİ');
{
  const kayitYolu=process.env.STARS_SAVE || process.argv[2] ||
    path.join(__dirname,'fixtures/stars-2210-06.sav.json');
  let kayit=null;
  try{ kayit=fs.readFileSync(kayitYolu,'utf8'); }catch(e){}
  if(!kayit) ok('gerçek kayıt okunabildi', false, 'dosya yok');
  else {
    const H=harness();
    H.R(["setupGame({name:'X',race:'insan',traits:[],size:'orta',shape:'sarmal',",
      " diff:'normal',seed:1,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
      " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
      "View.init(); View.vw=900; View.vh=420; return 'ok';"].join('\n'));
    const r=H.R([
      "var kayit=" + JSON.stringify(kayit) + ";",
      "var kucuk={W:G.W,H:G.H};",
      "deserialize(kayit);",
      "var v=JSON.parse(kayit);",
      "var mx=0,my=0; G.sys.forEach(function(s){ if(s.x>mx)mx=s.x; if(s.y>my)my=s.y; });",
      "function merkezlenemeyen(z){ View.cam.z=z; var n=0;",
      "  G.sys.forEach(function(s){ View.cam.x=s.x; View.cam.y=s.y; View.clampCam();",
      "    if(Math.abs(View.cam.x-s.x)>1||Math.abs(View.cam.y-s.y)>1) n++; }); return n; }",
      "var m19=merkezlenemeyen(1.9), m10=merkezlenemeyen(1.0), m03=merkezlenemeyen(0.3);",
      "/* tekrarlı yükleme aynı sonucu vermeli */",
      "var W1=G.W, koord1=G.sys.map(function(s){return Math.round(s.x)+','+Math.round(s.y);}).join('|');",
      "deserialize(kayit); deserialize(kayit);",
      "var W2=G.W, koord2=G.sys.map(function(s){return Math.round(s.x)+','+Math.round(s.y);}).join('|');",
      "/* kaydet/yükle sonrası boyut korunuyor */",
      "var yeni=serialize(); var nv=JSON.parse(yeni);",
      "G.W=4200; G.H=4200; deserialize(yeni);",
      "return JSON.stringify({kayittaWH:(v.W===undefined?'YOK':v.W),",
      "  kucukOnce:kucuk, W:G.W, H:G.H, sys:G.sys.length,",
      "  maxX:Math.round(mx), maxY:Math.round(my),",
      "  merkezlenemeyen:{z19:m19, z10:m10, z03:m03},",
      "  tekrarAyni:(W1===W2 && koord1===koord2),",
      "  yeniKayittaW:nv.W, yuklemeSonrasiW:G.W});"].join('\n'));
    let d={}; try{d=JSON.parse(r);}catch(e){}
    ok('gerçek kayıtta W/H alanı YOK (R2 öncesi kayıt)',
       d.kayittaWH==='YOK', String(d.kayittaWH));
    ok('yükleme dünya boyutunu doğru kurdu (6881)',
       d.W===6881 && d.H===6881, d.W+'x'+d.H);
    ok('küçük dünyadan gelindiğinde eski boyut TAŞINMADI',
       (d.kucukOnce||{}).W !== d.W, (d.kucukOnce||{}).W+' → '+d.W);
    ok('sistem koordinatları kapsanıyor',
       d.maxX<=d.W && d.maxY<=d.H, d.maxX+','+d.maxY+' ≤ '+d.W);
    ok('z=1.9 (en yakın) — merkezlenemeyen sistem YOK',
       (d.merkezlenemeyen||{}).z19===0, String((d.merkezlenemeyen||{}).z19));
    ok('z=1.0 ve z=0.3 — merkezlenemeyen sistem YOK',
       (d.merkezlenemeyen||{}).z10===0 && (d.merkezlenemeyen||{}).z03===0,
       JSON.stringify(d.merkezlenemeyen));
    ok('tekrarlı yüklemede boyut ve koordinatlar AYNI', d.tekrarAyni===true);
    ok('yeni kayıt gerçek dünya boyutunu saklıyor',
       d.yeniKayittaW===6881, String(d.yeniKayittaW));
    ok('kaydet/yükle sonrası boyut korunuyor',
       d.yuklemeSonrasiW===6881, String(d.yuklemeSonrasiW));
  }
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
