#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H-R4: HEDEFLİ TANI VE KURTARMA DOĞRULAMASI
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
/* ═══ DOM VE OLAY KAYDI ÜRETİM DOSYALARINDAN ÖNCE HAZIR ═══
   R3 kör noktası: başlangıç IIFE'sinin bağlandığı ilk canvas testin
   dışında kalıyordu. Bu harness DOM'u ve dinleyici kaydını modüller
   yüklenmeden önce kurar, böylece İLK canvas da gözlemlenir. */
const DOM=[
 "var WL={}, DL={}, ctxSeri=0, tuvaller=[];",
 "var ow=window.addEventListener, od=document.addEventListener;",
 "window.addEventListener=function(t,f){ (WL[t]=WL[t]||[]).push(f);",
 "  return ow&&ow.call(window,t,f); };",
 "document.addEventListener=function(t,f){ (DL[t]=DL[t]||[]).push(f);",
 "  return od&&od.call(document,t,f); };",
 "function yeniTuval(){ var L={}, kendi=null, kir=false, tfKir=false;",
 "  var c={ id:'map', className:'', width:900, height:420, style:{}, _L:L,",
 "    _kir:function(v){ kir=v; }, _tfKir:function(v){ tfKir=v; },",
 "    classList:{add:function(){},remove:function(){},contains:function(){return false;}},",
 "    getContext:function(){ if(kir) return null;",
 "      if(!kendi){ var t=document.getElementById('map0').getContext('2d');",
 "        kendi=Object.create(t); kendi.__id=++ctxSeri; kendi.canvas=c;",
 "        kendi.setTransform=function(){ if(tfKir) throw new Error('enjekte: setTransform'); };",
 "      } return kendi; },",
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
  ok("sw cache = 'stars-v95c'", /const CACHE = 'stars-v95c'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  /* B: başlangıç IIFE'si kaldırıldı */
  ok('B: main.js\'te doğrudan contextlost bağlaması KALMADI',
     !/cv\.addEventListener\('contextlost'/.test(mn));
  ok('B: context olaylarının tek sahibi yüzey yaşam döngüsü',
     /_ekle\('contextlost'/.test(mp) && /_ekle\('contextrestored'/.test(mp));
  /* A: bağlama jetonu */
  ok('A: bağlama jetonu var (_bindToken)', /this\._bindToken = \(this\._bindToken/.test(mp));
  ok('A: _guncel jetonu karşılaştırıyor',
     /this\._bindToken === _jeton && this\._boundCv === cv/.test(mp));
  ok('A: sökme _boundCv\'den bağımsız (kayıt._cv)',
     /_kayit\._cv = cv;/.test(mp) && /kayit && kayit\._cv/.test(mp));
  ok('A: geri alma kısmi yeni bağlamayı söküyor',
     /if \(View\.unbindSurface\) View\.unbindSurface\(\);\s*\/\/ kısmi yeni bağlama/.test(mn));
  /* C: resize hatası kurtarmaya ulaşıyor */
  ok('C: resize hatası yüzey basamağına ulaşıyor',
     /rebuildCanvasSurface\(sebep \+ '\+resize'\)/.test(mn));
  /* Tanı */
  ok('renderReport tanı toplayıcısı var', /function renderReport\(/.test(mn));
  ok('olay izi tutuluyor', /function izOlay\(/.test(mn) && /const OLAY_IZI/.test(mn));
  ok('ilk başarısızlık korunuyor', /function ilkHataKaydet\(/.test(mn));
  ok('build kimliği var', /const BUILD_ID = /.test(mn));
  ok('çizim aşaması izleniyor', /this\._drawStage = 'tamam'/.test(mp));
  ok('tanı raporu dışa aktarılabiliyor', /case 'diagCopy'/.test(ui));
  ok('pano yoksa dosya indirme var', /a\.download = 'stars-tani\.txt'/.test(ui));
  /* Korunacaklar */
  ok('R2: worldBoundsFrom korundu', /function worldBoundsFrom\(d\)/.test(mn));
  ok('R2: LOGI_ON bağımsız katman korundu', /let LOGI_ON = false;/.test(mn));
  ok('R1: tap(screenPos) korundu', /  tap\(screenPos\)\{/.test(mp));
  ok('R1: pointerup kapat() tap\'ten önce',
     mp.indexOf('kapat(ev.pointerId);                    // ÖNCE temizle') <
     mp.indexOf('this.tap(nokta);'));
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

/* ═══ B. A BULGUSU — ÇİFT GİRİŞ ═══ */
console.log('\nB. A BULGUSU: BAŞARISIZ HAZIRLIK SONRASI TEK GİRİŞ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "var eskiCv=ebeveyn.cocuk;",
    "/* YENİ context'in setTransform'u hata atsın → geri alma yolu */",
    "var oCreate=document.createElement;",
    "document.createElement=function(t){ if(t==='canvas'){ var c=yeniTuval();",
    "  c._tfKir(true); return c; } return oCreate(t); };",
    "var sonuc=rebuildCanvasSurface('A-testi');",
    "document.createElement=oCreate;",
    "var domAyni=(ebeveyn.cocuk===eskiCv);",
    "/* TEK dokunuş → TEK filo seçimi olmalı */",
    "var tabSay=0; var oTab=UI.tab; UI.tab=function(k){ if(k==='filo') tabSay++; };",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "ev(ebeveyn.cocuk,'pointerdown',1,150,120);",
    "ev(ebeveyn.cocuk,'pointerup',1,150,120);",
    "UI.tab=oTab;",
    "/* z=1'de 40 px sürükleme → kamera 40 birim ilerlemeli */",
    "View.rowHits=[]; View.cam.z=1; View.cam.x=2000; View.cam.y=2000;",
    "var x0=View.cam.x;",
    "ev(ebeveyn.cocuk,'pointerdown',2,400,300);",
    "ev(ebeveyn.cocuk,'pointermove',2,360,300);",
    "ev(ebeveyn.cocuk,'pointerup',2,360,300);",
    "var kayma=Math.round(Math.abs(View.cam.x-x0));",
    "/* emekli/kısmi bağlamalardan kalıntı var mı */",
    "var kalinti=0;",
    "tuvaller.forEach(function(c){ if(c!==ebeveyn.cocuk) kalinti+=sayYuzey(c)._toplam; });",
    "domGeri();",
    "return JSON.stringify({sonuc:sonuc, domAyni:domAyni, tap:tabSay,",
    "  kayma:kayma, kalinti:kalinti,",
    "  tutarli:(View.g && View.g.canvas===View.cv && View.cv===ebeveyn.cocuk)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('hazırlık hatasında yeniden kurma false döndü', d.sonuc===false);
  ok('DOM eski elemente geri alındı', d.domAyni===true);
  ok('A: TEK dokunuş → TEK filo seçimi (önce 2 idi)',
     d.tap===1, String(d.tap)+' seçim');
  ok('A: 40 px sürükleme → 40 birim kamera (önce 80 idi)',
     d.kayma===40, String(d.kayma)+' birim');
  ok('emekli/kısmi bağlamalardan kalıntı YOK', d.kalinti===0, String(d.kalinti));
  ok('View.cv / View.g / g.canvas tutarlı', d.tutarli===true);
}
/* Aynı canvas'a dönüşte eski callback'ler etkisiz */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var cv1=ebeveyn.cocuk;",
    "/* eski bağlamanın işleyicilerini SAKLA */",
    "var eskiPD=((cv1._L||{}).pointerdown||[]).slice();",
    "var eskiPM=((cv1._L||{}).pointermove||[]).slice();",
    "/* AYNI canvas'a yeniden bağlan */",
    "View._boundCv=null; View.bind();",
    "View.cam.z=1; View.cam.x=2000; var x0=View.cam.x;",
    "/* ESKİ bağlamanın callback'lerini doğrudan çağır */",
    "eskiPD.forEach(function(f){ try{ f({pointerId:9, clientX:400, clientY:300,",
    "  preventDefault:function(){}}); }catch(e){} });",
    "eskiPM.forEach(function(f){ try{ f({pointerId:9, clientX:360, clientY:300,",
    "  preventDefault:function(){}}); }catch(e){} });",
    "var eskiEtki=(View.cam.x!==x0);",
    "/* GÜNCEL bağlama hâlâ çalışıyor mu */",
    "var x1=View.cam.x;",
    "ev(cv1,'pointerdown',1,400,300); ev(cv1,'pointermove',1,360,300);",
    "ev(cv1,'pointerup',1,360,300);",
    "domGeri();",
    "return JSON.stringify({eskiEtki:eskiEtki, guncelKayma:Math.round(Math.abs(View.cam.x-x1)),",
    "  pts:View._gest.pts.size});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('A: AYNI canvas\'a dönüşte ESKİ callback\'ler ETKİSİZ',
     d.eskiEtki===false);
  ok('A: güncel bağlama doğru mesafede çalışıyor',
     d.guncelKayma===40, String(d.guncelKayma));
  ok('jest durumu temiz', d.pts===0);
}

/* ═══ C. B BULGUSU — CONTEXT OLAYLARININ TEK SAHİBİ ═══ */
console.log('\nC. B BULGUSU: CONTEXT OLAYLARI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var ilk=ebeveyn.cocuk;",
    "var i0=sayYuzey(ilk);",
    "var basarili=0;",
    "for(var i=0;i<10;i++){ if(rebuildCanvasSurface('t'+i)) basarili++; }",
    "var son=ebeveyn.cocuk; var s0=sayYuzey(son);",
    "/* emekli ilk canvas'ta kalıntı */",
    "var emekli=sayYuzey(ilk);",
    "/* emekli contextrestored kurtarma planlıyor mu */",
    "var plan=0; var oSch=scheduleRecovery;",
    "globalThis.scheduleRecovery=function(s,m){ plan++; return oSch(s,m); };",
    "((ilk._L||{}).contextrestored||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "globalThis.scheduleRecovery=oSch;",
    "/* GÜNCEL yüzeyin contextrestored'ı ÇALIŞMALI */",
    "var plan2=0;",
    "globalThis.scheduleRecovery=function(s,m){ plan2++; return oSch(s,m); };",
    "((son._L||{}).contextrestored||[]).forEach(function(f){ try{ f({}); }catch(e){} });",
    "globalThis.scheduleRecovery=oSch;",
    "var g1=sayGlobal();",
    "domGeri();",
    "return JSON.stringify({basarili:basarili, ilk:i0, son:s0, emekli:emekli,",
    "  emekliPlan:plan, guncelPlan:plan2, global:g1});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yüzey değişimi başarılı', d.basarili===10, String(d.basarili));
  ok('B: İLK canvas\'ta contextlost TAM 1 (önce 2 idi)',
     (d.ilk||{}).contextlost===1, String((d.ilk||{}).contextlost));
  ok('B: İLK canvas\'ta contextrestored TAM 1 (önce 2 idi)',
     (d.ilk||{}).contextrestored===1, String((d.ilk||{}).contextrestored));
  ok('B: yeni canvas ilk canvas ile AYNI profile sahip',
     JSON.stringify(d.ilk)===JSON.stringify(d.son), JSON.stringify(d.son));
  ok('B: emekli canvas\'ta hiç dinleyici KALMADI',
     (d.emekli||{})._toplam===0, String((d.emekli||{})._toplam));
  ok('B: emekli contextrestored kurtarma PLANLAMIYOR',
     d.emekliPlan===0, String(d.emekliPlan));
  ok('B: GÜNCEL contextrestored kurtarma planlıyor',
     d.guncelPlan===1, String(d.guncelPlan));
  ok('global dinleyiciler çoğalmadı',
     (d.global||{}).blur===1 && (d.global||{}).vis===1,
     JSON.stringify(d.global));
}

/* ═══ D. C BULGUSU — HAZIRLIK HATASI KURTARMAYA ULAŞIYOR ═══ */
console.log('\nD. C BULGUSU: MEVCUT YÜZEYDE RESIZE HATASI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var out={};",
    "/* MEVCUT context setTransform hatası → yüzey basamağına ulaş */",
    "ebeveyn.cocuk._tfKir(true);",
    "var yr=0; var oRb=rebuildCanvasSurface;",
    "globalThis.rebuildCanvasSurface=function(s){ yr++; return oRb(s); };",
    "DIAG.length=0; _recCalisiyor=false;",
    "runRecovery('resize', 0);",
    "globalThis.rebuildCanvasSurface=oRb;",
    "out.C={yuzeyDeneme:yr, bayrak:_recCalisiyor,",
    "  kayit:DIAG.map(function(x){return x.m.slice(0,42);}).slice(0,3)};",
    "/* MEVCUT context null → yine yüzey basamağı (D bulgusu, R3) */",
    "ebeveyn.cocuk._tfKir(false); ebeveyn.cocuk._kir(true);",
    "yr=0; globalThis.rebuildCanvasSurface=function(s){ yr++; return oRb(s); };",
    "DIAG.length=0; _recCalisiyor=false;",
    "runRecovery('resize', 0);",
    "globalThis.rebuildCanvasSurface=oRb;",
    "out.noctx={yuzeyDeneme:yr, bayrak:_recCalisiyor};",
    "domGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const C=d.C||{}, N=d.noctx||{};
  ok('C: resize hatası yüzey yeniden kurmayı TETİKLEDİ (önce 0)',
     C.yuzeyDeneme>=1, String(C.yuzeyDeneme));
  ok('C: kurtarma bayrağı serbest bırakıldı', C.bayrak===false);
  ok('C: resize hatası açıkça kaydedildi',
     (C.kayit||[]).some(function(m){return /resize hatası/.test(m);}),
     (C.kayit||[]).join(' | '));
  ok('context null yolu da yüzey basamağına ulaşıyor',
     N.yuzeyDeneme>=1 && N.bayrak===false, String(N.yuzeyDeneme));
}

/* ═══ E. TANI — HANGİ DALI AYIRABİLİYOR ═══ */
console.log('\nE. HEDEFLİ TANI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var out={};",
    "/* normal çizim → aşama tamam */",
    "View.draw(performance.now());",
    "var R1=renderReport('test');",
    "out.normal={stage:R1.stage, cvEsles:R1.cvEsles, gEsles:R1.gEsles,",
    "  drawCvEsles:R1.drawCvEsles, build:R1.build, resizeAfterDraw:R1.resizeAfterDraw,",
    "  alanlar:Object.keys(R1).length};",
    "/* çizim SONRASI resize → tanı bunu ayırmalı */",
    "View.resize();",
    "var R2=renderReport('test2');",
    "out.resizeSonra={resizeAfterDraw:R2.resizeAfterDraw};",
    "/* yanlış yüzeye çizim → drawCvEsles false */",
    "var sahte=yeniTuval(); View._drawCv=sahte;",
    "var R3=renderReport('test3');",
    "out.yanlisYuzey={drawCvEsles:R3.drawCvEsles};",
    "/* olay izi */",
    "izOlay('vis'); izOlay('focus');",
    "out.olaylar=renderReport('t').olaylar;",
    "/* İLK hata korunuyor mu (ardışık retry ezmemeli) */",
    "ILK_HATA=null;",
    "ilkHataKaydet({sebep:'ILK', t:1});",
    "ilkHataKaydet({sebep:'IKINCI', t:2});",
    "out.ilkHata=ILK_HATA.sebep;",
    "/* metin raporu */",
    "out.metin=renderReportText(renderReport('t')).slice(0,60);",
    "domGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const N=d.normal||{};
  ok('çizim tamamlandığında aşama "tamam"', N.stage==='tamam', N.stage);
  ok('yüzey eşleşmeleri raporlanıyor',
     N.cvEsles===true && N.gEsles===true && N.drawCvEsles===true);
  ok('build kimliği raporda', N.build==='95c', String(N.build));
  ok('rapor yeterince alan içeriyor', N.alanlar>=15, String(N.alanlar));
  ok('çizim SONRASI resize AYIRT EDİLİYOR',
     N.resizeAfterDraw===false && (d.resizeSonra||{}).resizeAfterDraw===true,
     'önce '+N.resizeAfterDraw+' → sonra '+(d.resizeSonra||{}).resizeAfterDraw);
  ok('yanlış/eski yüzeye çizim AYIRT EDİLİYOR',
     (d.yanlisYuzey||{}).drawCvEsles===false);
  ok('olay izi tutuluyor', /vis|focus|resize/.test(d.olaylar||''), d.olaylar);
  ok('İLK başarısızlık korunuyor (retry ezmiyor)',
     d.ilkHata==='ILK', String(d.ilkHata));
  ok('metin raporu üretilebiliyor', (d.metin||'').length>20, d.metin);
}

/* ═══ F. KURTARMA SONRASI GERÇEK GİRDİ + KORUNUM ═══ */
console.log('\nF. KURTARMA SONRASI GERÇEK GİRDİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DOM,
    "var once={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "View.cam.x=250; View.cam.y=180; View.cam.z=1;",
    "View.selSys=G.sys[6]; MAP_MODE='savas'; RADAR_ON=true; LOGI_ON=true;",
    "var kuruldu=rebuildCanvasSurface('F');",
    "var secim=(View.selSys===G.sys[6]);",
    "var tercih=(MAP_MODE==='savas'&&RADAR_ON===true&&LOGI_ON===true);",
    "var kam=(View.cam.x===250&&View.cam.y===180&&View.cam.z===1);",
    "var sonra={day:G.day, res:JSON.stringify(G.p.res), rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), filo:G.fleets.length};",
    "var yeni=ebeveyn.cocuk;",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "var tab=0; var oTab=UI.tab; UI.tab=function(k){ if(k==='filo') tab++; };",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "var tapHata='';",
    "try{ ev(yeni,'pointerdown',1,150,120); ev(yeni,'pointerup',1,150,120); }",
    "catch(x){ tapHata=x.message; }",
    "UI.tab=oTab;",
    "View.rowHits=[]; var x0=View.cam.x, z0=View.cam.z;",
    "ev(yeni,'pointerdown',2,400,300);",
    "ev(yeni,'pointermove',2,360,300);",
    "ev(yeni,'pointerup',2,360,300);",
    "var pan={kayma:Math.round(Math.abs(View.cam.x-x0)), zoomAyni:(View.cam.z===z0)};",
    "var z1=View.cam.z;",
    "ev(yeni,'pointerdown',3,300,300); ev(yeni,'pointerdown',4,420,300);",
    "ev(yeni,'pointermove',4,520,300);",
    "var pinch=(View.cam.z!==z1);",
    "ev(yeni,'pointerup',3,300,300); ev(yeni,'pointerup',4,520,300);",
    "var x2=View.cam.x, z2=View.cam.z;",
    "ev(yeni,'pointerdown',5,400,300); ev(yeni,'pointermove',5,360,300);",
    "ev(yeni,'pointerup',5,360,300);",
    "domGeri();",
    "return JSON.stringify({kuruldu:kuruldu, secim:secim, tercih:tercih, kam:kam,",
    "  veriAyni:JSON.stringify(once)===JSON.stringify(sonra),",
    "  tap:{hata:tapHata, say:tab}, pan:pan, pinch:pinch,",
    "  pinchSonrasiPan:{degisti:(View.cam.x!==x2), zoomAyni:(View.cam.z===z2)},",
    "  pts:View._gest.pts.size,",
    "  tutarli:(View.g && View.g.canvas===View.cv && View.cv===yeni)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yüzey yeniden kuruldu', d.kuruldu===true);
  ok('referanslar tutarlı', d.tutarli===true);
  ok('oyun verisi ve RNG DEĞİŞMEDİ', d.veriAyni===true);
  ok('kamera, seçim ve katman tercihleri korundu',
     d.kam===true && d.secim===true && d.tercih===true);
  ok('kurtarma sonrası TEK tap', (d.tap||{}).hata==='' && (d.tap||{}).say===1,
     JSON.stringify(d.tap));
  ok('kurtarma sonrası pan DOĞRU mesafede (40)',
     (d.pan||{}).kayma===40 && (d.pan||{}).zoomAyni===true,
     JSON.stringify(d.pan));
  ok('kurtarma sonrası pinch çalışıyor', d.pinch===true);
  ok('pinch sonrası pan çalışıyor',
     (d.pinchSonrasiPan||{}).degisti===true &&
     (d.pinchSonrasiPan||{}).zoomAyni===true);
  ok('zincir sonunda pts 0', d.pts===0);
}

/* ═══ G. GERÇEK KAYIT — KAMERA (R2 KORUNUYOR) ═══ */
console.log('\nG. GERÇEK KAYITLA KAMERA');
{
  /* Yol CLI/env'den; mutlak yol teste sabitlenmiyor. */
  const kayitYolu = process.env.STARS_SAVE ||
    (process.argv[2] || '') ||
    path.join(__dirname,'fixtures/stars-2210-06.sav.json');
  let kayit=null;
  try{ kayit=fs.readFileSync(kayitYolu,'utf8'); }catch(e){}
  if(!kayit){
    ok('gerçek kayıt okunabildi (STARS_SAVE ile yol verilebilir)',
       false, 'bulunamadı: '+kayitYolu);
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
    ok('gerçek kayıt 6881×6881 yükleniyor (R2 korundu)',
       d.W===6881 && d.H===6881, d.W+'x'+d.H);
    ok('her zoom seviyesinde merkezlenemeyen sistem YOK',
       d.z19===0 && d.z10===0 && d.z03===0, JSON.stringify(d));
  }
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
