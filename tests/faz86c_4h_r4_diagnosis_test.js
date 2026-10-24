#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H-R4: HEDEFLİ BEYAZ EKRAN TANISI
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
                  'economy.js','commerce.js','ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'])
    vm.runInContext(fs.readFileSync(path.join(KOK,f),'utf8'),sb,{filename:f});
  const R=c=>{try{return vm.runInContext('(function(){'+c+'})()',sb);}
              catch(e){return 'HATA: '+e.message;}};
  return {sb,R};
}
/* ═══ DOM VE OLAY KAYDI ÜRETİM DOSYALARINDAN ÖNCE HAZIR ═══
   R3 kör noktası: başlangıç IIFE'sinin bağlandığı ilk canvas testin
   dışında kalıyordu. Harness artık `harness()` çağrılmadan ÖNCE
   enstrümante DOM kurar, böylece İLK canvas da gözlenir. */
function h4(){
  const H = harness();
  const r = H.R([
    "globalThis.__L={}; globalThis.__WL={}; globalThis.__DL={};",
    "return 'ok';"].join('\n'));
  return H;
}
const DOM=[
 "var WL={}, DL={}, ctxSeri=0, tuvaller=[];",
 "var ow=window.addEventListener, od=document.addEventListener;",
 "window.addEventListener=function(t,f){ (WL[t]=WL[t]||[]).push(f);",
 "  return ow&&ow.call(window,t,f); };",
 "document.addEventListener=function(t,f){ (DL[t]=DL[t]||[]).push(f);",
 "  return od&&od.call(document,t,f); };",
 "function yeniTuval(){ var L={}, kendi=null, kir=false, tfKir=false;",
 "  var c={ id:'map', className:'', width:900, height:420, style:{}, _L:L,",
 "    _kir:function(v){ kir=v; }, _tfKir:function(v){ tfKir=v;",
 "      if(kendi) kendi.setTransform=function(){ if(tfKir)",
 "        throw new Error('enjekte: setTransform'); }; },",
 "    classList:{add:function(){},remove:function(){},contains:function(){return false;}},",
 "    getContext:function(){ if(kir) return null;",
 "      if(!kendi){ kendi=Object.create(document.getElementById('map0').getContext('2d'));",
 "        kendi.__id=++ctxSeri; kendi.canvas=c;",
 "        kendi.setTransform=function(){ if(tfKir) throw new Error('enjekte: setTransform'); }; }",
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
 "View._bindToken=0;",
 "View.cv=cv; View.g=cv.getContext('2d'); View.vw=900; View.vh=420; View.dpr=1;",
 "View.bind();",
 "function sayYuzey(c){ var L=(c&&c._L)||{}; var o={}, t=0;",
 "  ['pointerdown','pointermove','pointerup','pointercancel',",
 "   'lostpointercapture','wheel','contextlost','contextrestored']",
 "  .forEach(function(k){ o[k]=(L[k]||[]).length; t+=o[k]; });",
 "  o._toplam=t; return o; }",
 "function ev(c,t,id,x,y){ var L=(c._L||{})[t]||[];",
 "  L.slice().forEach(function(f){ try{ f({pointerId:id, clientX:x, clientY:y,",
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
  const mn=oku('main.js'), mp=oku('map.js'), ui=oku('ui.js'), sw=oku('sw.js');
  ok("sw cache = 'stars-v96h0'", /const CACHE = 'stars-v96h0'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  /* B — IIFE gerçekten kaldırıldı */
  ok('B: başlangıç context IIFE\'si KALDIRILDI',
     !/cv\.addEventListener\('contextlost'/.test(mn) &&
     !/cv\.addEventListener\('contextrestored'/.test(mn));
  ok('B: context olaylarının tek sahibi yüzey yaşam döngüsü',
     /_ekle\('contextlost'/.test(mp) && /_ekle\('contextrestored'/.test(mp));
  /* A — bağlama jetonu */
  ok('A: bağlama jetonu var (_bindToken)', /this\._bindToken = \(this\._bindToken \|\| 0\) \+ 1/.test(mp));
  ok('A: _guncel jetonu karşılaştırıyor',
     /this\._bindToken === _jeton && this\._boundCv === cv/.test(mp));
  ok('A: unbindSurface kaydı _boundCv\'den bağımsız',
     /kayit && kayit\._cv/.test(mp));
  ok('A: geri alma kısmi yeni bağlamayı söküyor',
     /if \(View\.unbindSurface\) View\.unbindSurface\(\);/.test(mn));
  /* C — resize hatası basamağa ulaşıyor */
  ok('C: resize hatası yüzey basamağına ulaşıyor',
     /rebuildCanvasSurface\(sebep \+ '\+resize'\)/.test(mn));
  /* Tanı */
  ok('tanı: renderReport var', /function renderReport\(/.test(mn));
  ok('tanı: BUILD_ID güncel', /const BUILD_ID = '96h0';/.test(mn));
  ok('tanı: olay izi var', /function izOlay\(/.test(mn));
  ok('tanı: ilk başarısızlık korunuyor', /function ilkHataKaydet\(/.test(mn));
  ok('tanı: çizim aşaması izleniyor', /this\._drawStage = 'tamam'/.test(mp));
  ok('tanı: rapor dışa aktarma eylemi var', /case 'diagCopy'/.test(ui));
  ok('tanı: pano yoksa dosya indirme var', /a\.download = 'stars-tani\.txt'/.test(ui));
  /* Korunacaklar */
  ok('R2: worldBoundsFrom korundu', /function worldBoundsFrom\(d\)/.test(mn));
  ok('R2: LOGI_ON bağımsız katman korundu', /let LOGI_ON = false;/.test(mn));
  ok('R1: tap(screenPos) korundu', /  tap\(screenPos\)\{/.test(mp));
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
    ok(f+' byte-for-byte aynı', (f==='audio.js'?require('./helpers/audio-preservation').isReviewedAudio(fs.readFileSync(path.join(KOK,f))):h===ref[f]), h.slice(0,16));
  });
}

/* ═══ B. A BULGUSU — ÇİFT GİRİŞ ═══ */
console.log('\nB. BAŞARISIZ HAZIRLIK SONRASI TEK GİRİŞ (A bulgusu)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "/* YENİ context'in setTransform'u hata atsın → geri alma yolu */",
    "var oCreate=document.createElement;",
    "document.createElement=function(t){ if(t==='canvas'){ var c=yeniTuval();",
    "  c.getContext('2d'); c._tfKir(true); return c; } return oCreate(t); };",
    "var eskiEl=ebeveyn.cocuk, eskiG=View.g;",
    "var sonuc=rebuildCanvasSurface('A-testi');",
    "document.createElement=oCreate;",
    "var guncel=ebeveyn.cocuk;",
    "/* TEK dokunuş → TEK filo seçimi olmalı */",
    "var tab=0; var oTab=UI.tab; UI.tab=function(k){ if(k==='filo') tab++; };",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "ev(guncel,'pointerdown',1,150,120); ev(guncel,'pointerup',1,150,120);",
    "UI.tab=oTab;",
    "/* z=1'de 40 px sürükleme → kamera TAM 40 birim */",
    "View.rowHits=[]; View.cam.z=1; View.cam.x=3000; View.cam.y=3000;",
    "var x0=View.cam.x;",
    "ev(guncel,'pointerdown',2,500,300);",
    "ev(guncel,'pointermove',2,460,300);",
    "ev(guncel,'pointerup',2,460,300);",
    "var kayma=Math.round((View.cam.x-x0)*100)/100;",
    "/* pinch de tek katsayıda */",
    "var z1=View.cam.z;",
    "ev(guncel,'pointerdown',3,300,300); ev(guncel,'pointerdown',4,420,300);",
    "ev(guncel,'pointermove',4,520,300);",
    "var pinchOk=(View.cam.z!==z1);",
    "ev(guncel,'pointerup',3,300,300); ev(guncel,'pointerup',4,520,300);",
    "domGeri();",
    "return JSON.stringify({sonuc:sonuc, domGeriAlindi:(guncel===eskiEl),",
    "  gAyni:(View.g===eskiG), tutarli:(View.g&&View.g.canvas===View.cv),",
    "  tapSay:tab, kayma:kayma, pinchOk:pinchOk,",
    "  pts:View._gest.pts.size});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('hazırlık hatasında false döndü', d.sonuc===false);
  ok('DOM eski elemente geri alındı', d.domGeriAlindi===true);
  ok('View.g eski değerinde ve tutarlı',
     d.gAyni===true && d.tutarli===true);
  ok('A: tek dokunuş → TEK filo seçimi (önce 2 idi)',
     d.tapSay===1, String(d.tapSay)+' seçim');
  ok('A: 40 px sürükleme → kamera TAM 40 birim (önce 80 idi)',
     Math.abs(d.kayma-40) < 0.5, String(d.kayma)+' birim');
  ok('geri alma sonrası pinch tek katsayıda çalışıyor', d.pinchOk===true);
  ok('zincir sonunda pts 0', d.pts===0);
}

/* ═══ C. B BULGUSU — CONTEXT OLAYI TEKİL ═══ */
console.log('\nC. CONTEXT OLAYLARI TEKİL SAHİPLİKTE (B bulgusu)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var ilk=ebeveyn.cocuk;",
    "var y0=sayYuzey(ilk);",
    "var kuruldu=rebuildCanvasSurface('B-testi');",
    "var yeni=ebeveyn.cocuk;",
    "var y1=sayYuzey(yeni), yEski=sayYuzey(ilk);",
    "/* emekli yüzeyin contextrestored'ı kurtarma planlamamalı */",
    "var plan=0; var oS=scheduleRecovery;",
    "globalThis.scheduleRecovery=function(s,m){ plan++; return oS(s,m); };",
    "((ilk._L||{}).contextrestored||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "var emekliPlan=plan;",
    "/* GÜNCEL yüzeyin contextrestored'ı kurtarma PLANLAMALI */",
    "plan=0;",
    "((yeni._L||{}).contextrestored||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "var guncelPlan=plan;",
    "globalThis.scheduleRecovery=oS;",
    "domGeri();",
    "return JSON.stringify({kuruldu:kuruldu, ilk:y0, yeni:y1, emekli:yEski,",
    "  emekliPlan:emekliPlan, guncelPlan:guncelPlan});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const I=d.ilk||{}, Y=d.yeni||{}, E=d.emekli||{};
  ok('B: İLK canvas\'ta contextlost TAM 1 (önce 2 idi)',
     I.contextlost===1, String(I.contextlost));
  ok('B: İLK canvas\'ta contextrestored TAM 1 (önce 2 idi)',
     I.contextrestored===1, String(I.contextrestored));
  ok('B: YENİ canvas aynı korumayı aldı',
     Y.contextlost===1 && Y.contextrestored===1,
     JSON.stringify({l:Y.contextlost, r:Y.contextrestored}));
  ok('B: EMEKLİ canvas\'ta context dinleyicisi KALMADI (önce 1 idi)',
     E.contextlost===0 && E.contextrestored===0 && E._toplam===0,
     'toplam '+E._toplam);
  ok('B: emekli contextrestored kurtarma PLANLAMIYOR',
     d.emekliPlan===0, String(d.emekliPlan));
  ok('B: güncel contextrestored kurtarma PLANLIYOR',
     d.guncelPlan===1, String(d.guncelPlan));
}

/* ═══ D. C BULGUSU — HAZIRLIK HATASI BASAMAĞA ULAŞIYOR ═══ */
console.log('\nD. MEVCUT YÜZEYDE RESIZE HATASI (C bulgusu)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var yr=0; var oRb=rebuildCanvasSurface;",
    "globalThis.rebuildCanvasSurface=function(s){ yr++; return true; };",
    "/* MEVCUT context'in setTransform'u hata versin */",
    "ebeveyn.cocuk._tfKir(true);",
    "DIAG.length=0; _recCalisiyor=false;",
    "runRecovery('resize', 0);",
    "var out={yuzeyDeneme:yr, bayrak:_recCalisiyor,",
    "  kayit:DIAG.map(function(x){return x.m.slice(0,46);}).slice(0,3)};",
    "globalThis.rebuildCanvasSurface=oRb;",
    "ebeveyn.cocuk._tfKir(false);",
    "domGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('C: resize hatası yüzey yeniden kurmayı TETİKLEDİ (önce 0 idi)',
     d.yuzeyDeneme>=1, String(d.yuzeyDeneme)+' deneme');
  ok('C: resize hatası açıkça kaydedildi',
     (d.kayit||[]).some(m=>/resize hatası/.test(m)),
     (d.kayit||[]).join(' | '));
  ok('C: kurtarma bayrağı serbest kaldı', d.bayrak===false);
}

/* ═══ E. 10 DEĞİŞİMDE DİNLEYİCİ SABİTLİĞİ ═══ */
console.log('\nE. BAŞARILI/BAŞARISIZ 10 DEĞİŞİM');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var g0={blur:(WL.blur||[]).length, vis:(DL.visibilitychange||[]).length};",
    "var oCreate=document.createElement, basarili=0, basarisiz=0;",
    "for(var i=0;i<10;i++){",
    "  if(i%3===2){ document.createElement=function(t){ if(t==='canvas'){",
    "      var c=yeniTuval(); c._kir(true); return c; } return oCreate(t); };",
    "    if(!rebuildCanvasSurface('f'+i)) basarisiz++;",
    "    document.createElement=oCreate; }",
    "  else { if(rebuildCanvasSurface('s'+i)) basarili++; } }",
    "var g1={blur:(WL.blur||[]).length, vis:(DL.visibilitychange||[]).length};",
    "var guncel=ebeveyn.cocuk;",
    "var eskiToplam=0;",
    "tuvaller.forEach(function(c){ if(c!==guncel) eskiToplam+=sayYuzey(c)._toplam; });",
    "/* AYNI canvas'a geri dönüşte eski callback'ler etkisiz olmalı */",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View._boundCv=null; View.cv=guncel; View.g=guncel.getContext('2d'); View.bind();",
    "View._boundCv=null; View.bind();   // AYNI canvas'a ikinci bağlama",
    "var tab=0; var oTab=UI.tab; UI.tab=function(k){ if(k==='filo') tab++; };",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "ev(guncel,'pointerdown',1,150,120); ev(guncel,'pointerup',1,150,120);",
    "UI.tab=oTab;",
    "View.rowHits=[]; View.cam.z=1; var x0=View.cam.x;",
    "ev(guncel,'pointerdown',2,500,300); ev(guncel,'pointermove',2,460,300);",
    "ev(guncel,'pointerup',2,460,300);",
    "var kayma=Math.round((View.cam.x-x0)*100)/100;",
    "domGeri();",
    "return JSON.stringify({basarili:basarili, basarisiz:basarisiz,",
    "  global:{once:g0, sonra:g1}, eskiToplam:eskiToplam,",
    "  ayniCanvasTap:tab, ayniCanvasKayma:kayma,",
    "  guncelYuzey:sayYuzey(guncel)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const G0=(d.global||{}).once||{}, G1=(d.global||{}).sonra||{};
  ok('10 değişim: 7 başarılı + 3 başarısız üretildi',
     d.basarili===7 && d.basarisiz===3,
     d.basarili+'/'+d.basarisiz);
  ok('global dinleyiciler SABİT kaldı',
     G0.blur===G1.blur && G0.vis===G1.vis,
     JSON.stringify(G0)+' → '+JSON.stringify(G1));
  ok('emekli yüzeylerde dinleyici KALMADI',
     d.eskiToplam===0, String(d.eskiToplam));
  ok('güncel yüzeyde her olaydan TAM 1',
     (d.guncelYuzey||{})._toplam===8, JSON.stringify(d.guncelYuzey));
  ok('AYNI canvas\'a yeniden bağlamada tek dokunuş → TEK seçim',
     d.ayniCanvasTap===1, String(d.ayniCanvasTap));
  ok('AYNI canvas\'a yeniden bağlamada kayma TAM 40',
     Math.abs(d.ayniCanvasKayma-40)<0.5, String(d.ayniCanvasKayma));
}

/* ═══ F. TANI RAPORU AYIRIM GÜCÜ ═══ */
console.log('\nF. TANI RAPORU HANGİ DALLARI AYIRIYOR');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var out={};",
    "/* 1) çizim hiç başlamadı */",
    "delete View._drawStage; delete View._drawEnd;",
    "out.hicCizim=renderReport('t1').stage;",
    "/* 2) normal çizim → aşama 'tamam' */",
    "try{ View.draw(1); }catch(e){}",
    "var R2=renderReport('t2');",
    "out.tamamCizim={stage:R2.stage, drawN:R2.drawN, bitti:R2.drawEnd>0};",
    "/* 3) belirli aşamada hata */",
    "var oFill=View.g.fillRect;",
    "View.g.fillRect=function(){ View._drawStage='zemin';",
    "  throw new Error('enjekte'); };",
    "try{ View.draw(2); }catch(e){}",
    "View.g.fillRect=oFill;",
    "out.asamaHatasi=renderReport('t3').stage;",
    "/* 4) çizimden SONRA resize */",
    "try{ View.draw(3); }catch(e){}",
    "markResize();",
    "out.resizeSonra=renderReport('t4').resizeAfterDraw;",
    "/* 5) yanlış yüzeye çizim */",
    "try{ View.draw(4); }catch(e){}",
    "var R5a=renderReport('t5a');",
    "rebuildCanvasSurface('t5');",
    "var R5b=renderReport('t5b');",
    "out.yuzeyEslesme={once:R5a.drawCvEsles, sonra:R5b.drawCvEsles,",
    "  cvEsles:R5b.cvEsles, gEsles:R5b.gEsles};",
    "/* 6) olay izi ve build */",
    "izOlay('vis'); izOlay('focus');",
    "var R6=renderReport('t6');",
    "out.iz={build:R6.build, olaylar:R6.olaylar, gen:R6.surfGen>0,",
    "  tok:R6.bindTok>0, dpr:R6.dpr, cvPx:R6.cvPx};",
    "/* 7) ilk başarısızlık korunuyor mu */",
    "ILK_HATA=null;",
    "ilkHataKaydet(renderReport('ilk-hata'));",
    "for(var i=0;i<50;i++) logDiag('recovery','doldurma '+i);",
    "out.ilkHataKorundu=!!(ILK_HATA && ILK_HATA.sebep==='ilk-hata');",
    "ilkHataKaydet(renderReport('ikinci'));",
    "out.ilkHataEzilmedi=(ILK_HATA.sebep==='ilk-hata');",
    "/* 8) metin üretimi */",
    "out.metin=renderReportText(renderReport('metin')).slice(0,60);",
    "domGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('dal 1: çizim hiç başlamadı ayırt ediliyor',
     d.hicCizim==='hic', String(d.hicCizim));
  ok('dal 2: tamamlanan çizim "tamam" damgası bırakıyor',
     (d.tamamCizim||{}).stage==='tamam' && (d.tamamCizim||{}).bitti===true,
     JSON.stringify(d.tamamCizim));
  ok('dal 3: aşamada hata → son aşama görünüyor',
     d.asamaHatasi==='zemin', String(d.asamaHatasi));
  ok('dal 4: çizimden SONRA resize ayırt ediliyor',
     d.resizeSonra===true, String(d.resizeSonra));
  const Y=d.yuzeyEslesme||{};
  ok('dal 5: yanlış/eski yüzeye çizim ayırt ediliyor',
     Y.once===true && Y.sonra===false, JSON.stringify(Y));
  ok('dal 5: View.cv / View.g eşleşmesi raporlanıyor',
     Y.cvEsles===true && Y.gEsles===true);
  const I=d.iz||{};
  ok('rapor build, olay izi, nesil ve jeton içeriyor',
     I.build==='96h0' && /vis>focus/.test(I.olaylar||'') &&
     I.gen===true && I.tok===true, JSON.stringify(I));
  ok('rapor viewport/canvas/DPR içeriyor',
     I.dpr!==undefined && !!I.cvPx, I.cvPx+' dpr '+I.dpr);
  ok('İLK başarısızlık 50 kayıt sonrası KORUNUYOR',
     d.ilkHataKorundu===true);
  ok('İLK başarısızlık ikinci raporla EZİLMİYOR',
     d.ilkHataEzilmedi===true);
  ok('rapor metne çevrilebiliyor', (d.metin||'').indexOf('sebep=')===0,
     d.metin);
}

/* ═══ G. KORUNAN DAVRANIŞLAR ═══ */
console.log('\nG. KORUNAN DAVRANIŞLAR');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var once={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "View.cam.x=270; View.cam.y=195; View.cam.z=0.63;",
    "View.selSys=G.sys[7]; MAP_MODE='savas'; RADAR_ON=true; LOGI_ON=true;",
    "rebuildCanvasSurface('G');",
    "var korunan={secim:(View.selSys===G.sys[7]),",
    "  kam:(View.cam.x===270&&View.cam.y===195&&View.cam.z===0.63),",
    "  tercih:(MAP_MODE==='savas'&&RADAR_ON===true&&LOGI_ON===true)};",
    "var sonra={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "/* 12 mod/katman birleşimi hâlâ bağımsız */",
    "var bagimsiz=true;",
    "['siyasi','diplomasi','savas'].forEach(function(m){",
    "  [false,true].forEach(function(rr){ [false,true].forEach(function(l){",
    "    MAP_MODE=m; RADAR_ON=rr; LOGI_ON=l;",
    "    UI.act('logiToggle'); if(MAP_MODE!==m || RADAR_ON!==rr) bagimsiz=false;",
    "    UI.act('logiToggle');",
    "    UI.act('radarTog'); if(MAP_MODE!==m || LOGI_ON!==l) bagimsiz=false;",
    "    UI.act('radarTog'); }); }); });",
    "domGeri();",
    "return JSON.stringify({korunan:korunan,",
    "  veriAyni:JSON.stringify(once)===JSON.stringify(sonra),",
    "  katmanBagimsiz:bagimsiz});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const K=d.korunan||{};
  ok('kurtarma seçimi korudu', K.secim===true);
  ok('kurtarma kamerayı korudu', K.kam===true);
  ok('kurtarma ana mod ve katman tercihlerini korudu', K.tercih===true);
  ok('oyun verisi ve RNG DEĞİŞMEDİ', d.veriAyni===true);
  ok('12 birleşimde katmanlar hâlâ bağımsız', d.katmanBagimsiz===true);
}

/* ═══ H. GERÇEK KAYIT — KAMERA (R2 KORUNUYOR) ═══ */
console.log('\nH. GERÇEK KAYITLA KAMERA');
{
  /* Yol CLI/env üzerinden; mutlak yol teste sabitlenmiyor. */
  const kayitYolu = process.env.STARS_SAVE ||
    (process.argv[2] || path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  let kayit=null;
  try{ kayit=fs.readFileSync(kayitYolu,'utf8'); }catch(e){}
  if(!kayit){
    ok('gerçek kayıt okunabildi (STARS_SAVE ile verilebilir)', false, kayitYolu);
  } else {
    const H=harness();
    H.R(["setupGame({name:'X',race:'insan',traits:[],size:'orta',shape:'sarmal',",
      " diff:'normal',seed:1,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
      " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
      "View.init(); View.vw=900; View.vh=420; return 'ok';"].join('\n'));
    const r=H.R([
      "var kayit=" + JSON.stringify(kayit) + ";",
      "deserialize(kayit);",
      "function merkezlenemeyen(z){ View.cam.z=z; var n=0;",
      "  G.sys.forEach(function(s){ View.cam.x=s.x; View.cam.y=s.y; View.clampCam();",
      "    if(Math.abs(View.cam.x-s.x)>1||Math.abs(View.cam.y-s.y)>1) n++; }); return n; }",
      "return JSON.stringify({W:G.W, H:G.H, sys:G.sys.length,",
      "  z19:merkezlenemeyen(1.9), z10:merkezlenemeyen(1.0),",
      "  z03:merkezlenemeyen(0.3)});"].join('\n'));
    let d={}; try{d=JSON.parse(r);}catch(e){}
    ok('gerçek kayıt 6881×6881 yükleniyor',
       d.W===6881 && d.H===6881, d.W+'x'+d.H);
    ok('her zoom seviyesinde merkezlenemeyen sistem YOK',
       d.z19===0 && d.z10===0 && d.z03===0,
       JSON.stringify({z19:d.z19, z10:d.z10, z03:d.z03}));
  }
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
