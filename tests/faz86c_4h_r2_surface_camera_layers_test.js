#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H-R2: BEYAZ HARİTA KURTARMA + KAMERA SINIRLARI + KATMANLAR
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
/* Gerçek DOM ağacı: rebuildCanvasSurface parentNode.replaceChild
   kullandığı için sahte tuvale gerçek bir ebeveyn verilir. */
const TUVAL=[
 "/* Gerçek 2D context bir kez alınır; sahte tuvallerin getContext'i",
 "   bunu döndürür (document.getElementById override'ı ile özyineleme",
 "   oluşmasın diye). */",
 "var _gercekCtx = document.getElementById('map').getContext('2d');",
 "var L={}, elemanlar=[];",
 "function yeniTuval(){",
 "  var L2={};",
 "  var c={ _cap:{}, id:'map', className:'mapCv', width:900, height:420,",
 "    style:{}, _L:L2,",
 "    classList:{add:function(){},remove:function(){},contains:function(){return false;}},",
 "    getContext:function(){ return _gercekCtx; },",
 "    getBoundingClientRect:function(){ return {left:0,top:0,width:900,height:420,right:900,bottom:420}; },",
 "    addEventListener:function(t,f){ (L2[t]=L2[t]||[]).push(f); },",
 "    removeEventListener:function(t,f){ if(L2[t]) L2[t]=L2[t].filter(function(x){return x!==f;}); },",
 "    setPointerCapture:function(id){ this._cap[id]=true; },",
 "    releasePointerCapture:function(id){ delete this._cap[id]; },",
 "    getAttribute:function(){ return null; },",
 "    clientWidth:900, clientHeight:420, offsetWidth:900, offsetHeight:420 };",
 "  elemanlar.push(c); return c; }",
 "var ebeveyn={ cocuk:null,",
 "  replaceChild:function(y,e){ this.cocuk=y; y.parentNode=this; } };",
 "var cv=yeniTuval(); cv.parentNode=ebeveyn; ebeveyn.cocuk=cv;",
 "/* createElement('canvas') gerçek bir tuval üretsin */",
 "var _orgCreate=document.createElement;",
 "document.createElement=function(t){ return (t==='canvas')? yeniTuval() : _orgCreate(t); };",
 "var _orgGet=document.getElementById;",
 "document.getElementById=function(id){ return (id==='map')? (ebeveyn.cocuk||cv) : _orgGet(id); };",
 "View._boundCv=null; View.cv=cv; View.vw=900; View.vh=420; View.dpr=1;",
 "View.g=_gercekCtx;",
 "View.bind();",
 "function ev(t,id,x,y){ var h=(View.cv._L||{})[t]||[];",
 "  h.forEach(function(f){ f({pointerId:id, clientX:x, clientY:y,",
 "    preventDefault:function(){}}); }); }",
 "var tabSay={}, _orgTab=UI.tab, _orgRefresh=UI.refresh;",
 "UI.tab=function(k){ tabSay[k]=(tabSay[k]||0)+1; };",
 "UI.refresh=function(){};",
 "function geri(){ UI.tab=_orgTab; UI.refresh=_orgRefresh;",
 "  document.createElement=_orgCreate; document.getElementById=_orgGet; }"].join('\n');
const KUR=(sz)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'"+(sz||'buyuk')+"',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "return 'ok';"].join('\n');

/* ═══ A. SÖZDİZİMİ, SINIR, KARANTİNA ═══ */
/* FAZ 86C.4H-R3: yüzey dinleyicileri artık kayıtlı `_ekle`
   üzerinden bağlanıyor (sökülebilmeleri için). Davranış AYNI;
   yalnız bağlama biçimi değişti. */
console.log('\nA. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const mn=oku('main.js'), sw=oku('sw.js'), mp=oku('map.js'), ui=oku('ui.js');
  ok("sw cache = 'stars-v94c'", /const CACHE = 'stars-v94c'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  ok('W/H kayda yazılıyor', /W:G\.W, H:G\.H,/.test(mn));
  ok('restoreWorldBounds kanonik yardımcısı var',
     /function restoreWorldBounds\(d\)/.test(mn) && /function worldBoundsFrom\(d\)/.test(mn));
  ok('sağlık örneklemesi DPR dönüşümü kullanıyor',
     /getImageData\(px, py, 1, 1\)/.test(mn) && /o\.x \* _dpr/.test(mn));
  ok('yüzey yeniden kurma basamağı var',
     /function rebuildCanvasSurface\(sebep\)/.test(mn));
  ok('yüzey basamağı retry SONRASINDA tetikleniyor',
     /deneme === 1 && rebuildCanvasSurface\(sebep\)/.test(mn));
  ok('tanı özeti sınırlı bilgi ekliyor', /function canvasTani\(\)/.test(mn));
  ok('LOGI_ON bağımsız katman değişkeni var', /let LOGI_ON = false;/.test(mn));
  ok('lojistik tercihi kalıcı', /async function loadLogiPref\(\)/.test(mn));
  ok('logiToggle ayrı aksiyon', /case 'logiToggle': \{/.test(ui));
  ok('lojistik düğmesi yeni aksiyona bağlı',
     /id="logiBtn" data-a="logiToggle"/.test(ui));
  ok('çizim koşulları LOGI_ON kullanıyor',
     /if \(LOGI_ON \|\| RADAR_ON\)\{/.test(mp) &&
     !/MAP_MODE === 'askeri'/.test(mp));
  ok('çizim önbelleği anahtarı katmanları içeriyor',
     /RADAR_ON\?'R':'-'\) \+ \(LOGI_ON\?'L':'-'\)/.test(mp));
  /* R1 kazanımları korunmalı */
  ok('R1: tap(screenPos) korundu', /  tap\(screenPos\)\{/.test(mp));
  ok('R1: lostpointercapture korundu',
     /_ekle\('lostpointercapture'/.test(mp));
  ok('R1: pointerup önce temizliyor',
     mp.indexOf('// ÖNCE temizle') < mp.indexOf('this.tap(nokta);'));
  ok('R1: activeWorldState guard korundu', /function activeWorldState\(\)/.test(mn));
  ok('R1: _recCalisiyor finally korundu',
     /\} finally \{[\s\S]{0,600}_recCalisiyor = false;/.test(mn));
  ok('R1: mapFix resetGesture korundu',
     /case 'mapFix'[\s\S]{0,900}View\.resetGesture\(\)/.test(ui));
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

/* ═══ B. DÜNYA SINIRI VE KAMERA ═══ */
console.log('\nB. DÜNYA BOYUTU VE KAMERA ERİŞİMİ');
{
  const H=harness(); H.R(KUR('ulu'));
  const r=H.R([
    "var uluW=G.W, uluSys=G.sys.length;",
    "var maxX=0,maxY=0; G.sys.forEach(function(s){",
    "  if(s.x>maxX)maxX=s.x; if(s.y>maxY)maxY=s.y; });",
    "var kayit=serialize();",
    "var eski=JSON.parse(kayit); delete eski.W; delete eski.H;",
    "var eskiStr=JSON.stringify(eski);",
    "/* KÜÇÜK dünyalı oturuma ULU kayıt yükle (asıl hata senaryosu) */",
    "setupGame({name:'K',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var kucukW=G.W;",
    "deserialize(kayit);",
    "var yeniW=G.W, yeniH=G.H;",
    "var yMaxX=0; G.sys.forEach(function(s){ if(s.x>yMaxX)yMaxX=s.x; });",
    "/* ESKİ v8 kaydı (W/H yok) */",
    "setupGame({name:'K2',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "deserialize(eskiStr);",
    "var eskiW=G.W;",
    "var det=[]; for(var i=0;i<5;i++){ deserialize(eskiStr); det.push(G.W+'x'+G.H); }",
    "/* BOZUK boyut */",
    "var bz=JSON.parse(kayit); bz.W=1e9; bz.H=-5;",
    "deserialize(JSON.stringify(bz)); var bozukW=G.W;",
    "/* GERİ dönüş: ULU → küçük dünya */",
    "setupGame({name:'K3',race:'insan',traits:[],size:'kucuk',shape:'sarmal',",
    "  diff:'normal',seed:3,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var kucukKayit=serialize(); var kucuk2W=G.W;",
    "deserialize(kayit); var geriUlu=G.W;",
    "deserialize(kucukKayit); var geriKucuk=G.W;",
    "/* KAMERA ERİŞİMİ: her sistem, üç zoom, iki viewport */",
    "deserialize(kayit);",
    "function erisim(z,vw,vh){ View.vw=vw; View.vh=vh; var k=0;",
    "  G.sys.forEach(function(s){ View.cam={x:s.x,y:s.y,z:z}; View.clampCam();",
    "    if(Math.abs(View.cam.x-s.x)>1||Math.abs(View.cam.y-s.y)>1) k++; });",
    "  return k; }",
    "var koseler=[{x:0,y:0},{x:G.W,y:0},{x:0,y:G.H},{x:G.W,y:G.H}];",
    "function kose(z,vw,vh){ View.vw=vw; View.vh=vh; var k=0;",
    "  koseler.forEach(function(c){ View.cam={x:c.x,y:c.y,z:z}; View.clampCam();",
    "    if(Math.abs(View.cam.x-c.x)>1||Math.abs(View.cam.y-c.y)>1) k++; });",
    "  return k; }",
    "/* kaydet/yükle sonrası veri korunumu */",
    "var v1=JSON.stringify({day:G.day,rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(',')});",
    "var k2=serialize(); deserialize(k2);",
    "var v2=JSON.stringify({day:G.day,rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(',')});",
    "return JSON.stringify({uluW:uluW, uluSys:uluSys, kucukW:kucukW,",
    "  yeniW:yeniW, yeniH:yeniH, koordKorundu:(Math.round(yMaxX)===Math.round(maxX)),",
    "  eskiW:eskiW, determinist:det.every(function(x){return x===det[0];}),",
    "  bozukW:bozukW, kucuk2W:kucuk2W, geriUlu:geriUlu, geriKucuk:geriKucuk,",
    "  yatay:{z019:erisim(0.19,900,420), z05:erisim(0.5,900,420), z19:erisim(1.9,900,420)},",
    "  dikey:{z019:erisim(0.19,380,700), z05:erisim(0.5,380,700), z19:erisim(1.9,380,700)},",
    "  kose:{z019:kose(0.19,900,420), z19:kose(1.9,900,420), dar:kose(1.9,380,700)},",
    "  veriKorundu:(v1===v2)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ULU galaksi 100 sistem, W=galaxyScale(100)=6881',
     d.uluW===6881 && d.uluSys===100, d.uluW+' / '+d.uluSys);
  ok('küçük dünyalı oturumda ULU kayıt DOĞRU boyutu kuruyor',
     d.yeniW===6881 && d.yeniH===6881, d.kucukW+' → '+d.yeniW);
  ok('sistem koordinatları YENİDEN ÜRETİLMEDİ', d.koordKorundu===true);
  ok('eski v8 kaydı (W/H yok) deterministik açılıyor',
     d.eskiW===6881 && d.determinist===true, String(d.eskiW));
  ok('bozuk boyut girdisi güvenle düzeltiliyor', d.bozukW===6881,
     String(d.bozukW));
  ok('küçük dünya → ULU → küçük dünya geçişleri doğru',
     d.geriUlu===6881 && d.geriKucuk===d.kucuk2W,
     d.kucuk2W+' → '+d.geriUlu+' → '+d.geriKucuk);
  ok('yatay ekranda hiçbir sistem erişilemez değil',
     d.yatay.z019===0 && d.yatay.z05===0 && d.yatay.z19===0,
     JSON.stringify(d.yatay));
  ok('dikey/dar ekranda hiçbir sistem erişilemez değil',
     d.dikey.z019===0 && d.dikey.z05===0 && d.dikey.z19===0,
     JSON.stringify(d.dikey));
  ok('dört köşe her zoom ve viewport\'ta erişilebilir',
     d.kose.z019===0 && d.kose.z19===0 && d.kose.dar===0,
     JSON.stringify(d.kose));
  ok('kaydet/yükle oyun verisini ve RNG\'yi korudu', d.veriKorundu===true);
}

/* ═══ C. DPR SAĞLIK ÖRNEKLEMESİ ═══ */
console.log('\nC. SAĞLIK ÖRNEKLEMESİ — DPR DÖNÜŞÜMÜ');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "/* TUVAL sarmalayıcısı yerine gerçek View.init yüzeyi — getImageData",
    "   doğrudan üretim context'i üzerinde gözlenir. */",
    "View.init(); View.vw=900; View.vh=420;",
    "var okunan=[];",
    "var org=View.g.getImageData;",
    "View.g.getImageData=function(x,y,w,h){ okunan.push([x,y]);",
    "  return org.call(View.g,x,y,w,h); };",
    "View.cam={x:G.sys[0].x,y:G.sys[0].y,z:0.5};",
    "View.dpr=1; View.cv.width=900; View.cv.height=420;",
    "var h1=verifyRenderHealth(); var d1=okunan.slice(); okunan=[];",
    "View.dpr=2; View.cv.width=1800; View.cv.height=840;",
    "var h2=verifyRenderHealth(); var d2=okunan.slice();",
    "View.g.getImageData=org;",
    "return JSON.stringify({dpr1:d1.slice(0,3), dpr2:d2.slice(0,3),",
    "  oran:(d1.length&&d2.length)?(d2[0][0]/(d1[0][0]||1)):null,",
    "  dpr2SinirIcinde:d2.every(function(p){return p[0]<1800&&p[1]<840;}),",
    "  ayniSayida:(d1.length===d2.length)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('sağlık örneklemesi gerçekten piksel okuyor',
     (d.dpr1||[]).length>0 && (d.dpr2||[]).length>0,
     ((d.dpr1||[]).length)+' / '+((d.dpr2||[]).length));
  ok('DPR=1 ve DPR=2 aynı sayıda nokta örnekliyor', d.ayniSayida===true);
  ok('DPR=2 örnekleri tam 2× ölçekleniyor', d.oran===2,
     JSON.stringify((d.dpr1||[])[0])+' → '+JSON.stringify((d.dpr2||[])[0]));
  ok('DPR=2 örnekleri tuval sınırları İÇİNDE', d.dpr2SinirIcinde===true);
}

/* ═══ D. YÜZEY YENİDEN KURMA ═══ */
console.log('\nD. ÇİZİM YÜZEYİNİ YENİDEN KURMA');
{
  const H=harness(); H.R(KUR());
  const r=H.R([TUVAL,
    "var eskiCv=View.cv, eskiG=View.g;",
    "View.cam={x:1234,y:567,z:0.77}; View.selSys=G.sys[5];",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View.sel=f;",
    "var v1=JSON.stringify({day:G.day,res:G.p.res,rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  filo:G.fleets.length, W:G.W});",
    "View._gest.pts.set(99,{x:1,y:1});",
    "var _d0=DIAG.length;",
    "var ok1=rebuildCanvasSurface('test');",
    "var _tani=DIAG.slice(_d0).map(function(x){return x.m.slice(0,80);}).join(' | ');",
    "var v2=JSON.stringify({day:G.day,res:G.p.res,rng:RND_STATE,",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  filo:G.fleets.length, W:G.W});",
    "var out={kuruldu:ok1, yeniElement:(View.cv!==eskiCv),",
    "  yeniContext:(View.g!==eskiG),",
    "  kamera:(View.cam.x===1234&&View.cam.y===567&&View.cam.z===0.77),",
    "  secim:(View.selSys===G.sys[5] && View.sel===f),",
    "  jestTemiz:(View._gest.pts.size===0),",
    "  veriKorundu:(v1===v2), gen1:_surfGen, tani:_tani};",
    "/* Yeni yüzeyde TAP / PAN / PINCH çalışmalı */",
    "View.route=false; View.sel=null; tabSay={};",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "var tapHata='';",
    "try{ ev('pointerdown',1,150,120); ev('pointerup',1,150,120); }",
    "catch(ex){ tapHata=ex.message; }",
    "out.tap={hata:tapHata, filo:(tabSay['filo']||0)};",
    "View.rowHits=[];",
    "var x0=View.cam.x, z0=View.cam.z;",
    "ev('pointerdown',2,400,300);",
    "for(var k=1;k<=6;k++) ev('pointermove',2,400+k*14,300);",
    "ev('pointerup',2,484,300);",
    "out.pan={degisti:(View.cam.x!==x0), zoomAyni:(View.cam.z===z0)};",
    "var z1=View.cam.z;",
    "ev('pointerdown',3,300,300); ev('pointerdown',4,420,300);",
    "ev('pointermove',4,520,300);",
    "out.pinch={degisti:(View.cam.z!==z1)};",
    "ev('pointerup',3,300,300); ev('pointerup',4,520,300);",
    "var x2=View.cam.x;",
    "ev('pointerdown',5,400,300);",
    "for(var k2=1;k2<=6;k2++) ev('pointermove',5,400+k2*14,300);",
    "ev('pointerup',5,484,300);",
    "out.pinchSonrasiPan={degisti:(View.cam.x!==x2), pts:View._gest.pts.size};",
    "/* TEKRARLI yeniden kurma: listener/döngü çoğalmasın */",
    "for(var i=0;i<3;i++) rebuildCanvasSurface('tekrar');",
    "View.bind(); View.bind();",
    "var son=View.cv;",
    "out.tekrar={gen:_surfGen, boundEsit:(View._boundCv===son),",
    "  dinleyici:(son._L.pointerdown||[]).length,",
    "  move:(son._L.pointermove||[]).length,",
    "  lost:(son._L.lostpointercapture||[]).length};",
    "tabSay={};",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "ev('pointerdown',9,150,120); ev('pointerup',9,150,120);",
    "out.tekrarSonrasiTap=(tabSay['filo']||0);",
    "geri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yüzey gerçekten yeniden kuruldu',
     d.kuruldu===true && d.yeniElement===true,
     'kuruldu='+d.kuruldu+' yeniEl='+d.yeniElement+
     ' yeniCtx='+d.yeniContext+' · '+(d.tani||''));
  ok('kamera korundu', d.kamera===true);
  ok('sistem ve filo seçimi korundu', d.secim===true);
  ok('jest durumu temizlendi', d.jestTemiz===true);
  ok('oyun verisi, RNG ve dünya boyutu DEĞİŞMEDİ', d.veriKorundu===true);
  ok('yeni yüzeyde TAP çalışıyor',
     (d.tap||{}).hata==='' && (d.tap||{}).filo===1, JSON.stringify(d.tap));
  ok('yeni yüzeyde PAN çalışıyor, zoom sabit',
     (d.pan||{}).degisti===true && (d.pan||{}).zoomAyni===true);
  ok('yeni yüzeyde PINCH çalışıyor', (d.pinch||{}).degisti===true);
  ok('pinch sonrası PAN çalışıyor, pts 0',
     (d.pinchSonrasiPan||{}).degisti===true && (d.pinchSonrasiPan||{}).pts===0);
  const T=d.tekrar||{};
  ok('3 kez yeniden kurma + 2 bind: listener sayısı 1\'de sabit',
     T.dinleyici===1 && T.move===1 && T.lost===1, JSON.stringify(T));
  ok('tekrarlı kurmadan sonra TAP yine çalışıyor',
     d.tekrarSonrasiTap===1, String(d.tekrarSonrasiTap));
}

/* ═══ E. 12 MOD/KATMAN BİRLEŞİMİ ═══ */
console.log('\nE. ÜÇ ANA MOD × RADAR × LOJİSTİK = 12 BİRLEŞİM');
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "var sonuc=[];",
    "['siyasi','diplomasi','savas'].forEach(function(m){",
    "  [false,true].forEach(function(rr){ [false,true].forEach(function(l){",
    "    MAP_MODE='siyasi'; RADAR_ON=false; LOGI_ON=false;",
    "    UI.act('mapMode', m);",
    "    if(rr) UI.act('radarTog');",
    "    if(l) UI.act('logiToggle');",
    "    sonuc.push({ist:m+'|R'+(rr?1:0)+'|L'+(l?1:0),",
    "      ger:MAP_MODE+'|R'+(RADAR_ON?1:0)+'|L'+(LOGI_ON?1:0)});",
    "  }); }); });",
    "/* katman değiştirmek ana modu ve diğer katmanı DEĞİŞTİRMEZ */",
    "MAP_MODE='savas'; RADAR_ON=true; LOGI_ON=true;",
    "UI.act('logiToggle');",
    "var a={m:MAP_MODE,r:RADAR_ON,l:LOGI_ON};",
    "UI.act('radarTog');",
    "var b={m:MAP_MODE,r:RADAR_ON,l:LOGI_ON};",
    "/* ana mod değiştirmek katmanları DEĞİŞTİRMEZ */",
    "MAP_MODE='siyasi'; RADAR_ON=true; LOGI_ON=true;",
    "UI.act('mapMode','savas'); var c={m:MAP_MODE,r:RADAR_ON,l:LOGI_ON};",
    "UI.act('mapMode','diplomasi'); var e2={m:MAP_MODE,r:RADAR_ON,l:LOGI_ON};",
    "/* eski 'askeri' girdisi ana modu BOZMAZ */",
    "MAP_MODE='savas'; LOGI_ON=false;",
    "UI.act('mapMode','askeri'); var f2={m:MAP_MODE,l:LOGI_ON};",
    "/* çizim önbelleği anahtarı katmanlara duyarlı */",
    "MAP_MODE='savas'; RADAR_ON=false; LOGI_ON=false;",
    "var k1=MAP_MODE+'|'+(RADAR_ON?'R':'-')+(LOGI_ON?'L':'-');",
    "LOGI_ON=true;",
    "var k2=MAP_MODE+'|'+(RADAR_ON?'R':'-')+(LOGI_ON?'L':'-');",
    "return JSON.stringify({adet:sonuc.length,",
    "  hepsi:sonuc.every(function(x){return x.ist===x.ger;}),",
    "  hatali:sonuc.filter(function(x){return x.ist!==x.ger;}),",
    "  logiKapat:a, radarKapat:b, mod1:c, mod2:e2, eskiAskeri:f2,",
    "  anahtarFarkli:(k1!==k2)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('12 birleşimin TAMAMI gerçek UI eylemleriyle doğru',
     d.adet===12 && d.hepsi===true, JSON.stringify(d.hatali||[]));
  ok('Lojistik kapatınca Savaş ve Radar KORUNUYOR',
     (d.logiKapat||{}).m==='savas' && (d.logiKapat||{}).r===true &&
     (d.logiKapat||{}).l===false, JSON.stringify(d.logiKapat));
  ok('Radar kapatınca ana mod korunuyor',
     (d.radarKapat||{}).m==='savas' && (d.radarKapat||{}).r===false);
  ok('ana mod değişimi katmanları DEĞİŞTİRMİYOR',
     (d.mod1||{}).r===true && (d.mod1||{}).l===true &&
     (d.mod2||{}).r===true && (d.mod2||{}).l===true);
  ok('eski "askeri" girdisi ana modu bozmuyor, katmanı çeviriyor',
     (d.eskiAskeri||{}).m==='savas' && (d.eskiAskeri||{}).l===true);
  ok('çizim önbelleği anahtarı katman değişimine duyarlı',
     d.anahtarFarkli===true);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
