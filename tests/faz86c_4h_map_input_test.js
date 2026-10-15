#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H: MOBİL HARİTA GİRDİSİ + YÜKLEME KURTARMA
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
/* Gerçek olay dinleyicilerini yakalayan sahte tuval. Testler bir
   fonksiyonun çağrıldığını değil, OLAY DİZİSİNİN SONUCUNU sınar. */
const TUVAL=[
 "var L={}, capSay=0, relSay=0;",
 "var cv={ _cap:{}, width:900, height:420, style:{},",
 "  classList:{add:function(){},remove:function(){},contains:function(){return false;}},",
 "  getContext:function(){ return document.getElementById('map').getContext('2d'); },",
 "  getBoundingClientRect:function(){ return {left:0,top:0,width:900,height:420,right:900,bottom:420}; },",
 "  addEventListener:function(t,f){ (L[t]=L[t]||[]).push(f); },",
 "  removeEventListener:function(t,f){ if(L[t]) L[t]=L[t].filter(function(x){return x!==f;}); },",
 "  setPointerCapture:function(id){ capSay++; this._cap[id]=true; },",
 "  releasePointerCapture:function(id){ relSay++; delete this._cap[id]; },",
 "  clientWidth:900, clientHeight:420, offsetWidth:900, offsetHeight:420 };",
 "View._boundCv=null; View.cv=cv; View.vw=900; View.vh=420; View.dpr=1;",
 "View.bind();",
 "function ev(t,id,x,y){ (L[t]||[]).forEach(function(f){",
 "  f({pointerId:id, clientX:x, clientY:y, preventDefault:function(){}}); }); }",
 "var tapSay=0, tapNokta=null; var _orgTap=View.tap;",
 "View.tap=function(p){ tapSay++; tapNokta=p; };"].join('\n');
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "return 'ok';"].join('\n');

/* ═══ A. DOSYA SINIRI VE KARANTİNA ═══ */
/* FAZ 86C.4H-R3: yüzey dinleyicileri artık kayıtlı `_ekle`
   üzerinden bağlanıyor (sökülebilmeleri için). Davranış AYNI;
   yalnız bağlama biçimi değişti. */
console.log('\nA. DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const mp=oku('map.js'), mn=oku('main.js'), sw=oku('sw.js');
  ok("sw cache = 'stars-v94d'", /const CACHE = 'stars-v94d'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  ok('lostpointercapture dinleniyor',
     /_ekle\('lostpointercapture'/.test(mp));
  ok('resetGesture merkezî sıfırlayıcı var', /  resetGesture\(\)\{/.test(mp));
  ok('bind() tekrarlı çağrıya karşı korumalı',
     /if \(this\._boundCv === cv\) return;/.test(mp));
  ok('setPointerCapture try/catch içinde',
     /try \{ cv\.setPointerCapture\(ev\.pointerId\); \} catch\(e\)\{\}/.test(mp));
  ok('kesinti olayları bağlı (blur + visibilitychange)',
     /window\.addEventListener\('blur', kesinti\)/.test(mp) &&
     /visibilitychange/.test(mp));
  ok('yükleme sonrası jest sıfırlanıyor',
     /View\.resetGesture\(\)/.test(mn));
  ok('yükleme sonrası seçim kimlikle yeniden bağlanıyor',
     /selection = \{sys:View\.selSys && View\.selSys\.id/.test(mn) &&
     /View\.selSys = G\.sys\.find\(s=>s\.id === _selSysId\) \|\| null/.test(mn) &&
     /View\.sel = G\.fleets\.find\(f=>f\.id === _selFleetId\) \|\| null/.test(mn));
  /* 86C.4 davranışları korunmalı */
  const ai=oku('ai.js');
  ok('86C.4 aiProposeTerms korundu', /function aiProposeTerms\(/.test(ai));
  ok('86C.4 NAP yolu korundu', /6z\. SALDIRMAZLIK PAKTI/.test(ai));
  ok('86C.4 DELTA karşı teklif korundu', /karşı teklifi DELTA olarak/.test(ai));
  ok('86C.4 diploBlocked kontrolleri korundu',
     (ai.match(/diploBlocked\(e, o\)\) continue/g)||[]).length===3);
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
}
{
  /* FAZ 86C.4H-R1: ui.js bu turda DEĞİŞİYOR (mapFix kanonik
     sırası), korunan kümeden çıkarıldı. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json',
   'map.js','index.html'].forEach(f=>{
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

/* ═══ B. TEMEL JEST AYRIMI ═══ */
console.log('\nB. DOKUNMA / SÜRÜKLEME / PINCH AYRIMI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var out={};",
    "out.listener={down:(L.pointerdown||[]).length, up:(L.pointerup||[]).length,",
    "  cancel:(L.pointercancel||[]).length, lost:(L.lostpointercapture||[]).length,",
    "  move:(L.pointermove||[]).length};",
    "/* 1) EŞİK ALTI tek temas → SEÇİM */",
    "tapSay=0; ev('pointerdown',1,100,100); ev('pointermove',1,103,101);",
    "ev('pointerup',1,103,101);",
    "out.kisaDokunus=tapSay;",
    "/* 2) SÜRÜKLEME → kaydırma, seçim YOK */",
    "tapSay=0; var c0=JSON.stringify(View.cam);",
    "ev('pointerdown',2,200,200);",
    "for(var i=1;i<=6;i++) ev('pointermove',2,200+i*15,200);",
    "var c1=JSON.stringify(View.cam);",
    "ev('pointerup',2,290,200);",
    "out.surukleme={tap:tapSay, kamera:c0!==c1,",
    "  zoomAyni:JSON.parse(c0).z===JSON.parse(c1).z};",
    "/* 3) sürükleme SONRASI bağımsız dokunuş yine çalışır */",
    "tapSay=0; ev('pointerdown',3,150,150); ev('pointerup',3,150,150);",
    "out.suruklemeSonrasiTap=tapSay;",
    "/* 4) İKİ temas → pinch (zoom değişir) */",
    "tapSay=0; var z0=View.cam.z;",
    "ev('pointerdown',4,300,300); ev('pointerdown',5,400,300);",
    "ev('pointermove',5,500,300);",
    "var z1=View.cam.z;",
    "/* 5) bir parmak kalkar → kalan temas için başlangıç YENİDEN kurulur */",
    "ev('pointerup',5,500,300);",
    "var camA=JSON.stringify(View.cam);",
    "ev('pointermove',4,305,300);",
    "var camB=JSON.stringify(View.cam);",
    "var sicrama=Math.abs(JSON.parse(camB).x-JSON.parse(camA).x);",
    "ev('pointerup',4,305,300);",
    "out.pinch={zoomDegisti:z0!==z1, pinchSonrasiTap:tapSay,",
    "  kameraSicramasi:+sicrama.toFixed(1)};",
    "/* 6) pinch tamamen bittikten sonra YENİ dokunuş çalışır */",
    "tapSay=0; ev('pointerdown',6,250,250); ev('pointerup',6,250,250);",
    "out.pinchSonrasiYeniTap=tapSay;",
    "View.tap=_orgTap;",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const S=d.surukleme||{}, P=d.pinch||{};
  ok('lostpointercapture dinleyicisi KAYITLI',
     (d.listener||{}).lost===1, String((d.listener||{}).lost));
  ok('eşik altı tek temas → gezegen SEÇİMİ', d.kisaDokunus===1,
     String(d.kisaDokunus));
  ok('tek temasla sürükleme → harita KAYDIRMA', S.kamera===true);
  ok('sürüklemede zoom DEĞİŞMEZ', S.zoomAyni===true);
  ok('sürükleme sonunda yanlışlıkla SEÇİM YAPILMAZ', S.tap===0,
     String(S.tap));
  ok('sürükleme sonrası bağımsız dokunuş ÇALIŞIR',
     d.suruklemeSonrasiTap===1, String(d.suruklemeSonrasiTap));
  ok('iki temas → pinch-zoom', P.zoomDegisti===true);
  ok('pinch sonunda yanlışlıkla SEÇİM YAPILMAZ', P.pinchSonrasiTap===0,
     String(P.pinchSonrasiTap));
  ok('pinch\'ten tek parmağa düşünce kamera SIÇRAMAZ',
     P.kameraSicramasi < 50, P.kameraSicramasi+' birim');
  ok('pinch tamamen bittikten sonra yeni dokunuş ÇALIŞIR',
     d.pinchSonrasiYeniTap===1, String(d.pinchSonrasiYeniTap));
}

/* ═══ C. TAKILI POINTER — ASIL HATA ═══ */
console.log('\nC. YAKALAMA KAYBI VE İPTAL (asıl kök neden)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var out={};",
    "/* lostpointercapture: pointerup HİÇ gelmez */",
    "ev('pointerdown',1,200,200);",
    "ev('lostpointercapture',1,200,200);",
    "out.lostSonrasiPts=View._gest.pts.size;",
    "tapSay=0; ev('pointerdown',2,300,300); ev('pointerup',2,300,300);",
    "out.lostSonrasiTap=tapSay;",
    "/* pointercancel */",
    "ev('pointerdown',3,100,100); ev('pointercancel',3,100,100);",
    "out.cancelSonrasiPts=View._gest.pts.size;",
    "tapSay=0; ev('pointerdown',4,120,120); ev('pointerup',4,120,120);",
    "out.cancelSonrasiTap=tapSay;",
    "/* AYNI temas için ÇOK kapanış olayı durumu bozmaz */",
    "ev('pointerdown',5,140,140);",
    "ev('pointerup',5,140,140); ev('pointerup',5,140,140);",
    "ev('pointercancel',5,140,140); ev('lostpointercapture',5,140,140);",
    "out.coklaKapanisPts=View._gest.pts.size;",
    "tapSay=0; ev('pointerdown',6,160,160); ev('pointerup',6,160,160);",
    "out.coklaKapanisSonrasiTap=tapSay;",
    "/* arka plana geçme → jest sıfırlanır */",
    "ev('pointerdown',7,200,200); ev('pointerdown',8,260,200);",
    "View.resetGesture();",
    "out.resetSonrasiPts=View._gest.pts.size;",
    "out.resetSonrasiPinch=View._gest.pinch===null;",
    "tapSay=0; ev('pointerdown',9,180,180); ev('pointerup',9,180,180);",
    "out.resetSonrasiTap=tapSay;",
    "out.capiadeSayisi={cap:capSay, rel:relSay};",
    "View.tap=_orgTap;",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('lostpointercapture temas kaydını TEMİZLER',
     d.lostSonrasiPts===0, String(d.lostSonrasiPts));
  ok('yakalama kaybı sonrası sonraki dokunuş ÇALIŞIR (asıl hata)',
     d.lostSonrasiTap===1, String(d.lostSonrasiTap));
  ok('pointercancel temas kaydını temizler', d.cancelSonrasiPts===0);
  ok('iptal sonrası sonraki dokunuş çalışır', d.cancelSonrasiTap===1);
  ok('aynı temas için çok kapanış olayı durumu BOZMAZ',
     d.coklaKapanisPts===0 && d.coklaKapanisSonrasiTap===1);
  ok('resetGesture pts ve pinch durumunu temizler',
     d.resetSonrasiPts===0 && d.resetSonrasiPinch===true);
  ok('sıfırlama sonrası dokunuş çalışır', d.resetSonrasiTap===1);
  ok('yakalama alındıysa serbest de bırakılıyor',
     (d.capiadeSayisi||{}).rel > 0, JSON.stringify(d.capiadeSayisi));
}

/* ═══ D. TEKRARLI BIND / TAMİR ═══ */
console.log('\nD. TEKRARLI BIND LISTENER BİRİKTİRMEZ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var ilk={down:(L.pointerdown||[]).length, move:(L.pointermove||[]).length,",
    "  up:(L.pointerup||[]).length, lost:(L.lostpointercapture||[]).length};",
    "View.bind(); View.bind(); View.bind();",
    "var sonra={down:(L.pointerdown||[]).length, move:(L.pointermove||[]).length,",
    "  up:(L.pointerup||[]).length, lost:(L.lostpointercapture||[]).length};",
    "/* üç tamir sonrası kaydırma TEK katsayıda kalmalı */",
    "var c0=View.cam.x;",
    "ev('pointerdown',1,300,300); ev('pointermove',1,280,300);",
    "ev('pointerup',1,280,300);",
    "var kayma=Math.abs(View.cam.x-c0);",
    "tapSay=0; ev('pointerdown',2,150,150); ev('pointerup',2,150,150);",
    "View.tap=_orgTap;",
    "return JSON.stringify({ilk:ilk, sonra:sonra, kayma:+kayma.toFixed(2),",
    "  beklenenKayma:+(20/View.cam.z).toFixed(2), tap:tapSay});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('3 kez bind() sonrası listener sayısı ARTMADI',
     JSON.stringify(d.ilk)===JSON.stringify(d.sonra),
     JSON.stringify(d.ilk)+' → '+JSON.stringify(d.sonra));
  ok('kaydırma TEK katsayıda (çift işleme yok)',
     Math.abs(d.kayma - d.beklenenKayma) < 0.5,
     d.kayma+' ≈ '+d.beklenenKayma);
  ok('tekrarlı bind sonrası seçim çalışıyor', d.tap===1, String(d.tap));
}

/* ═══ E. KAYIT YÜKLEME SONRASI ═══ */
console.log('\nE. KAYIT YÜKLEME SONRASI HARİTA KULLANILABİLİR');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "/* yükleme öncesi durum + yarım kalmış jest */",
    "View.cam.x=120; View.cam.y=80; View.cam.z=0.5;",
    "View.selSys=G.sys[3];",
    "var oyunOnce=JSON.stringify({sys:G.sys.map(function(s){return s.owner;}),",
    "  res:G.emps.map(function(e){return JSON.stringify(e.res);}), day:G.day});",
    "var kayit=serialize();",
    "ev('pointerdown',1,200,200); ev('pointerdown',2,260,200);",
    "var yarimJest=View._gest.pts.size;",
    "/* eski nesneye referans: yükleme sonrası kimlikle çözülmeli */",
    "var eskiSysNesnesi=View.selSys;",
    "deserialize(kayit);",
    "var out={yarimJest:yarimJest, yuklemeSonrasiPts:View._gest.pts.size,",
    "  pinchTemiz:View._gest.pinch===null,",
    "  secimYeniNesne:(View.selSys===G.sys[3]),",
    "  secimEskiNesneDegil:(View.selSys!==eskiSysNesnesi)||(G.sys[3]===eskiSysNesnesi),",
    "  camKorundu:(View.cam.x===120 && View.cam.y===80 && View.cam.z===0.5),",
    "  oyunVerisiKorundu:oyunOnce===JSON.stringify({sys:G.sys.map(function(s){return s.owner;}),",
    "    res:G.emps.map(function(e){return JSON.stringify(e.res);}), day:G.day})};",
    "/* yükleme SONRASI kaydırma + seçim birlikte çalışmalı */",
    "var c0=JSON.stringify(View.cam);",
    "ev('pointerdown',3,300,300);",
    "for(var i=1;i<=5;i++) ev('pointermove',3,300+i*12,300);",
    "ev('pointerup',3,360,300);",
    "out.yuklemeSonrasiKaydirma=(c0!==JSON.stringify(View.cam));",
    "tapSay=0; ev('pointerdown',4,150,150); ev('pointerup',4,150,150);",
    "out.yuklemeSonrasiSecim=tapSay;",
    "/* pinch de çalışmalı */",
    "var z0=View.cam.z;",
    "ev('pointerdown',5,300,300); ev('pointerdown',6,400,300);",
    "ev('pointermove',6,480,300);",
    "out.yuklemeSonrasiPinch=(View.cam.z!==z0);",
    "ev('pointerup',5,300,300); ev('pointerup',6,480,300);",
    "/* geçersiz seçim temizlenir */",
    "View.selSys={id:99999, name:'HAYALET'};",
    "deserialize(kayit);",
    "out.gecersizSecimTemiz=(View.selSys===null);",
    "View.tap=_orgTap;",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme öncesi yarım jest gerçekten vardı', d.yarimJest===2,
     String(d.yarimJest));
  ok('yükleme eski jest durumunu TEMİZLEDİ',
     d.yuklemeSonrasiPts===0 && d.pinchTemiz===true);
  ok('seçim GÜNCEL oyun nesnesine yeniden bağlandı',
     d.secimYeniNesne===true);
  ok('geçerli kamera GEREKSİZ yere sıfırlanmadı', d.camKorundu===true);
  ok('yükleme kalıcı oyun verisini bozmadı', d.oyunVerisiKorundu===true);
  ok('yükleme SONRASI kaydırma çalışıyor', d.yuklemeSonrasiKaydirma===true);
  ok('yükleme SONRASI gezegen seçimi çalışıyor',
     d.yuklemeSonrasiSecim===1, String(d.yuklemeSonrasiSecim));
  ok('yükleme SONRASI pinch çalışıyor', d.yuklemeSonrasiPinch===true);
  ok('geçersiz seçim yüklemede temizlendi', d.gecersizSecimTemiz===true);
}

/* ═══ F. GEÇERSİZ KAYIT VE BOYUT DEĞİŞİMİ ═══ */
console.log('\nF. GEÇERSİZ KAYIT VE YENİDEN BOYUTLANDIRMA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var kayit=serialize();",
    "var oyunOnce=JSON.stringify({sys:G.sys.map(function(s){return s.owner;}),",
    "  day:G.day, emps:G.emps.length});",
    "/* GEÇERSİZ kayıt yükleme denemesi */",
    "var hata='';",
    "try{ deserialize('{bozuk json'); }catch(ex){ hata='yakalandi'; }",
    "var out={bozukSonrasiOyun:oyunOnce===JSON.stringify({",
    "  sys:G.sys.map(function(s){return s.owner;}), day:G.day, emps:G.emps.length})};",
    "tapSay=0; ev('pointerdown',1,150,150); ev('pointerup',1,150,150);",
    "out.bozukSonrasiSecim=tapSay;",
    "var c0=JSON.stringify(View.cam);",
    "ev('pointerdown',2,300,300); ev('pointermove',2,270,300); ev('pointerup',2,270,300);",
    "out.bozukSonrasiKaydirma=(c0!==JSON.stringify(View.cam));",
    "/* boyut değişimi sonrası hit-test ile çizim aynı dönüşümü kullanır */",
    "View.vw=380; View.vh=700;",
    "var w=View.s2w(190,350);",
    "out.merkezDonusum={x:+w.x.toFixed(2), y:+w.y.toFixed(2),",
    "  camX:+View.cam.x.toFixed(2), camY:+View.cam.y.toFixed(2)};",
    "tapSay=0; ev('pointerdown',3,190,350); ev('pointerup',3,190,350);",
    "out.boyutSonrasiSecim=tapSay;",
    "View.tap=_orgTap;",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('geçersiz kayıt mevcut oyunu BOZMADI', d.bozukSonrasiOyun===true);
  ok('başarısız yükleme sonrası seçim çalışıyor',
     d.bozukSonrasiSecim===1, String(d.bozukSonrasiSecim));
  ok('başarısız yükleme sonrası kaydırma çalışıyor',
     d.bozukSonrasiKaydirma===true);
  const M=d.merkezDonusum||{};
  ok('ekran merkezi dünya koordinatında kamera merkezine denk',
     Math.abs(M.x-M.camX)<0.01 && Math.abs(M.y-M.camY)<0.01,
     JSON.stringify(M));
  ok('boyut değişimi sonrası seçim çalışıyor',
     d.boyutSonrasiSecim===1, String(d.boyutSonrasiSecim));
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
