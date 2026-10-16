#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4H-R1: GERÇEK ÜRETİM YOLU REGRESYONU
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
/* Gerçek canvas listener'ları. View.tap ASLA stub'lanmaz — yalnız
   TÜKETİCİLER (UI.tab / UI.refresh) gözlemlenir. */
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
 "/* YALNIZ tüketici gözlemi — View.tap dokunulmadan kalır. */",
 "var tabSay={}, refreshSay=0;",
 "var _orgTab=UI.tab, _orgRefresh=UI.refresh;",
 "UI.tab=function(k){ tabSay[k]=(tabSay[k]||0)+1; };",
 "UI.refresh=function(){ refreshSay++; };",
 "function tuketiciGeri(){ UI.tab=_orgTab; UI.refresh=_orgRefresh; }"].join('\n');
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
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
  const mn=oku('main.js'), sw=oku('sw.js');
  ok("sw cache = 'stars-v95c'", /const CACHE = 'stars-v95c'/.test(sw));
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  const eco=oku('economy.js'), dip=oku('diplomacy.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
  const ai=oku('ai.js');
  ok('86C.4 aiProposeTerms korundu', /function aiProposeTerms\(/.test(ai));
  ok('86C.4 NAP yolu korundu', /6z\. SALDIRMAZLIK PAKTI/.test(ai));
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

/* ═══ B. STATİK: View.tap GÖVDESİ TEMİZ Mİ ═══ */
console.log('\nB. View.tap GÖVDESİ — STATİK DOĞRULAMA');
{
  const mp=oku('map.js');
  /* Dengeli parantezle gövdeyi çıkar (yorumlar hariç sınanır). */
  const i=mp.indexOf('  tap(screenPos){');
  ok('tap parametresi açık adlandırıldı (screenPos)', i>=0);
  let govde='';
  if (i>=0){
    let d=0, j=mp.indexOf('{', i);
    for (let p=j; p<mp.length; p++){
      if (mp[p]==='{') d++;
      else if (mp[p]==='}'){ d--; if (d===0){ govde=mp.slice(j+1,p); break; } }
    }
  }
  const kod = govde.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*/g,'');
  ok('gövde dengeli parantezle çıkarıldı', kod.length>200,
     kod.split('\n').length+' satır');
  ok('gövdede `pos(ev)` YOK', !/pos\s*\(\s*ev\s*\)/.test(kod));
  ok('gövdede bağımsız `ev` YOK', !/\bev\b/.test(kod));
  ok('parametreyi gölgeleyen `const sp = pos...` YOK',
     !/const\s+sp\s*=\s*pos/.test(kod));
  ok('rowHits bloğu hâlâ var (davranış korundu)', /rowHits/.test(kod));
  ok('filo satırı cycling korundu', /list\.indexOf\(this\.sel\)/.test(kod));
  ok('çift dokunma davranışı korundu', /dbl/.test(kod));
  /* pointerup sırası */
  ok('pointerup: kapat() tap\'ten ÖNCE',
     mp.indexOf('kapat(ev.pointerId);                    // ÖNCE temizle') <
     mp.indexOf('this.tap(nokta);'));
  ok('tap kendi hata sınırında (try/catch)',
     /try \{\s*this\.tap\(nokta\);\s*\} catch\(err\)\{/.test(mp));
  ok('hata maskelenmiyor — logDiag map-input kaydı',
     /logDiag\('map-input'/.test(mp));
  /* 86C.4H kazanımları korunmalı */
  ok('lostpointercapture korundu', /_ekle\('lostpointercapture'/.test(mp));
  ok('pointercancel korundu', /_ekle\('pointercancel'/.test(mp));
  ok('resetGesture korundu', /  resetGesture\(\)\{/.test(mp));
  ok('bind idempotency korundu', /if \(this\._boundCv === cv\) return;/.test(mp));
  ok('blur/visibility temizliği korundu',
     /window\.addEventListener\('blur', kesinti\)/.test(mp) && /visibilitychange/.test(mp));
  ok('setPointerCapture koruması korundu',
     /try \{ cv\.setPointerCapture/.test(mp));
  /* mapFix ve recovery */
  const ui=oku('ui.js'), mn2=oku('main.js');
  ok('mapFix View.resetGesture çağırıyor',
     /case 'mapFix'[\s\S]{0,900}View\.resetGesture\(\)/.test(ui));
  ok('mapFix resetGesture\'ı scheduleRecovery\'den ÖNCE çağırıyor',
     ui.indexOf('View.resetGesture();') < ui.indexOf("scheduleRecovery('manual', true)"));
  ok('activeWorldState kanonik yardımcısı var',
     /function activeWorldState\(\)/.test(mn2));
  ok('runRecovery aktif dünya kapısı içeriyor',
     /const aw = activeWorldState\(\);/.test(mn2));
  ok('skip tanısı açık biçimde yazılıyor',
     /recovery skip:no-active-world:/.test(mn2));
  ok('bozuk dünya `skip` DEĞİL, başarısızlık', /bozuk dünya/.test(mn2));
}

/* ═══ C. GERÇEK View.tap ÜRETİM YOLU (STUB YOK) ═══ */
console.log('\nC. GERÇEK rowHits ÜRETİM YOLU — View.tap STUB\'LANMADAN');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "/* View.tap DEĞİŞTİRİLMEDİ — gerçek üretim fonksiyonu çalışacak. */",
    "var tapStub=(View.tap.toString().indexOf('screenPos')>=0);",
    "/* Canlı filo ve EŞLEŞEN dikdörtgen ile gerçek rowHits kur. */",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "if(!f) return JSON.stringify({hata:'canlı filo yok'});",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "var hata='';",
    "var orgErr=console.error; console.error=function(){};",
    "tabSay={}; refreshSay=0;",
    "try{ ev('pointerdown',1,150,120); ev('pointerup',1,150,120); }",
    "catch(ex){ hata=ex.message; }",
    "console.error=orgErr;",
    "var out={tapGercek:tapStub, hata:hata,",
    "  secilenFilo:(View.sel===f), tabFilo:(tabSay['filo']||0),",
    "  ptsBos:View._gest.pts.size===0,",
    "  diagMapInput:(typeof DIAG!=='undefined'? DIAG.filter(function(d){",
    "    return d.tur==='map-input';}).length : -1)};",
    "/* 10 kez arka arkaya AYNI üretim yolu */",
    "var hata10='', tab10=0;",
    "for(var i=0;i<10;i++){",
    "  View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "  try{ ev('pointerdown',10+i,150,120); ev('pointerup',10+i,150,120); }",
    "  catch(ex){ hata10=ex.message; } }",
    "out.on={hata:hata10, tabFilo:(tabSay['filo']||0),",
    "  pts:View._gest.pts.size};",
    "/* Ardından TEK PARMAK DRAG: pan olmalı, zoom DEĞİŞMEMELİ */",
    "View.rowHits=[];",
    "var c0={x:View.cam.x,y:View.cam.y,z:View.cam.z};",
    "ev('pointerdown',50,400,300);",
    "for(var k=1;k<=6;k++) ev('pointermove',50,400+k*14,300);",
    "ev('pointerup',50,484,300);",
    "out.drag={panDegisti:(View.cam.x!==c0.x||View.cam.y!==c0.y),",
    "  zoomAyni:(View.cam.z===c0.z), pts:View._gest.pts.size};",
    "tuketiciGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('gerçek View.tap kullanılıyor (stub değil)', d.tapGercek===true);
  ok('ReferenceError YOK — üretim yolu hatasız', d.hata==='', d.hata||'ok');
  ok('doğru filo seçildi', d.secilenFilo===true);
  ok("UI.tab('filo') tam BİR kez", d.tabFilo===1, String(d.tabFilo));
  ok('pointer state temiz (pts 0)', d.ptsBos===true);
  ok('hata kaydı üretilmedi (map-input 0)', d.diagMapInput===0,
     String(d.diagMapInput));
  const O=d.on||{};
  ok('10 ardışık üretim turu hatasız', O.hata==='', O.hata||'ok');
  ok('10 turdan sonra pts hâlâ 0', O.pts===0, String(O.pts));
  ok("10 turda UI.tab('filo') 11 kez (1+10)", O.tabFilo===11, String(O.tabFilo));
  const DR=d.drag||{};
  ok('sonraki tek parmak DRAG pan yaptı', DR.panDegisti===true);
  ok('drag sırasında zoom DEĞİŞMEDİ (pinch değil)', DR.zoomAyni===true);
  ok('drag sonrası pts 0', DR.pts===0, String(DR.pts));
}

/* ═══ D. TÜKETİCİ HATASI — POINTER KURTARILIYOR ═══ */
console.log('\nD. UI HATASI ENJEKSİYONU — pointer state kurtarılıyor');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View.route=false; View.sel=null;",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "/* UI.tab KASITLI hata atsın */",
    "UI.tab=function(k){ throw new Error('enjekte: UI.tab patladı'); };",
    "var diagOnce=(typeof DIAG!=='undefined')? DIAG.length : 0;",
    "var orgErr=console.error; console.error=function(){};",
    "var sizanHata='';",
    "try{ ev('pointerdown',1,150,120); ev('pointerup',1,150,120); }",
    "catch(ex){ sizanHata=ex.message; }",
    "console.error=orgErr;",
    "var out={sizanHata:sizanHata, ptsSonra:View._gest.pts.size,",
    "  pinchSonra:View._gest.pinch===null,",
    "  diagYeni:(typeof DIAG!=='undefined')? DIAG.length-diagOnce : -1,",
    "  diagTur:(typeof DIAG!=='undefined' && DIAG.length)? DIAG[DIAG.length-1].tur : null,",
    "  diagMesaj:(typeof DIAG!=='undefined' && DIAG.length)? DIAG[DIAG.length-1].m.slice(0,40) : null};",
    "/* Sonraki TEK parmak PAN olmalı, pinch DEĞİL */",
    "UI.tab=function(k){ tabSay[k]=(tabSay[k]||0)+1; };",
    "View.rowHits=[];",
    "var z0=View.cam.z, x0=View.cam.x;",
    "ev('pointerdown',2,400,300);",
    "for(var k=1;k<=6;k++) ev('pointermove',2,400+k*14,300);",
    "ev('pointerup',2,484,300);",
    "out.sonraki={pan:(View.cam.x!==x0), zoomAyni:(View.cam.z===z0),",
    "  pts:View._gest.pts.size};",
    "/* ve normal dokunuş yine çalışıyor */",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "tabSay={};",
    "ev('pointerdown',3,150,120); ev('pointerup',3,150,120);",
    "out.sonrakiTap=(tabSay['filo']||0);",
    "tuketiciGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('tüketici hatası DIŞARI sızmadı', d.sizanHata==='', d.sizanHata||'ok');
  ok('hata sonrası pointer state SIFIR (asıl kabul kriteri)',
     d.ptsSonra===0, String(d.ptsSonra));
  ok('hata sonrası pinch temiz', d.pinchSonra===true);
  ok('hata MASKELENMEDİ — map-input tanısı yazıldı',
     d.diagYeni>=1 && d.diagTur==='map-input',
     d.diagTur+' · '+d.diagMesaj);
  const S=d.sonraki||{};
  ok('sonraki tek parmak PAN (pinch DEĞİL)',
     S.pan===true && S.zoomAyni===true);
  ok('hata sonrası pts yine 0', S.pts===0);
  ok('hata sonrası normal dokunuş yine çalışıyor',
     d.sonrakiTap===1, String(d.sonrakiTap));
}

/* ═══ E. NULL G.p RECOVERY GUARD'I ═══ */
console.log('\nE. AKTİF DÜNYA OLMADAN RECOVERY');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "var refreshSayac=0, drawSayac=0, reachSayac=0;",
    "var oR=UI.refresh, oD=View.draw, oRe=(typeof refreshReach==='function')?refreshReach:null;",
    "UI.refresh=function(){ refreshSayac++; return oR.apply(UI,arguments); };",
    "View.draw=function(){ drawSayac++; return oD.apply(View,arguments); };",
    "if(oRe) globalThis.refreshReach=function(){ reachSayac++; return oRe.apply(null,arguments); };",
    "/* ANA MENÜ DURUMU: aktif dünya yok */",
    "var yedekP=G.p; G.p=null;",
    "var diagOnce=DIAG.length;",
    "var hata='';",
    "var rafOnce=(typeof _recCalisiyor!=='undefined')?_recCalisiyor:null;",
    "try{ for(var i=0;i<50;i++) runRecovery('resize', 0); }catch(ex){ hata=ex.message; }",
    "var skip=DIAG.slice(diagOnce).filter(function(d){",
    "  return /skip:no-active-world/.test(d.m||''); }).length;",
    "var resHata=DIAG.slice(diagOnce).filter(function(d){",
    "  return /reading 'res'/.test(d.m||''); }).length;",
    "var out={nullDunya:{refresh:refreshSayac, draw:drawSayac, reach:reachSayac,",
    "  hata:hata, skipKaydi:skip, resHatasi:resHata,",
    "  recBayragi:(typeof _recCalisiyor!=='undefined')?_recCalisiyor:null}};",
    "G.p=yedekP;",
    "/* AKTİF OYUNDA aynı recovery ÇALIŞMALI */",
    "refreshSayac=0; drawSayac=0;",
    "var hata2='';",
    "try{ runRecovery('resize', 0); }catch(ex){ hata2=ex.message; }",
    "out.aktifDunya={refresh:refreshSayac, draw:drawSayac, hata:hata2,",
    "  recBayragi:(typeof _recCalisiyor!=='undefined')?_recCalisiyor:null};",
    "/* BOZUK dünya: skip DEĞİL, başarısızlık.",
    "   Ölçüm izole edilir: giriş guard\'ı önceki çağrıdan kalan",
    "   bayrakla düşmesin diye açıkça sıfırlanır. */",
    "_recCalisiyor=false;",
    "/* DIAG 40 kayıtta taşıyor; slice(length) boş dönerdi.",
    "   Ölçüm için tampon temizlenir. */",
    "DIAG.length=0;",
    "var yedekRes=G.p.res; delete G.p.res;",
    "var diag2=0;",
    "try{ runRecovery('resize', 0); }catch(ex){}",
    "G.p.res=yedekRes;",
    "var bozukKayit=DIAG.slice(diag2);",
    "out.bozukDunya={skip:bozukKayit.filter(function(d){",
    "    return /skip:no-active-world/.test(d.m||''); }).length,",
    "  basarisiz:bozukKayit.filter(function(d){",
    "    return /bozuk dünya/.test(d.m||''); }).length};",
    "UI.refresh=oR; View.draw=oD; if(oRe) globalThis.refreshReach=oRe;",
    "tuketiciGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const N=d.nullDunya||{}, A=d.aktifDunya||{}, B=d.bozukDunya||{};
  ok('null G.p ile 50 recovery: UI.refresh 0', N.refresh===0, String(N.refresh));
  ok('null G.p ile 50 recovery: View.draw 0', N.draw===0, String(N.draw));
  ok('null G.p ile 50 recovery: refreshReach 0', N.reach===0, String(N.reach));
  ok("null G.p ile \"reading 'res'\" hatası 0", N.resHatasi===0, String(N.resHatasi));
  ok('null G.p ile hiç istisna sızmadı', N.hata==='', N.hata||'ok');
  ok('açık skip tanısı yazıldı', N.skipKaydi>0, N.skipKaydi+' kayıt');
  ok('_recCalisiyor erken dönüşte serbest bırakıldı',
     N.recBayragi===false, String(N.recBayragi));
  ok('AKTİF oyunda recovery gerçekten çalışıyor',
     A.refresh>=1 && A.draw>=1 && A.hata==='',
     'refresh '+A.refresh+' draw '+A.draw);
  ok('aktif oyunda da _recCalisiyor serbest', A.recBayragi===false);
  ok('BOZUK dünya `skip` DEĞİL, başarısızlık olarak kaydedildi',
     B.skip===0 && B.basarisiz>0, 'skip '+B.skip+' başarısız '+B.basarisiz);
}

/* ═══ F. mapFix GERÇEK AKSİYON ═══ */
console.log('\nF. mapFix — GERÇEK UI.act YOLU');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "/* Takılı pointer + aktif pinch + geçerli kamera kur */",
    "ev('pointerdown',1,200,200); ev('pointerdown',2,320,200);",
    "ev('pointermove',2,380,200);",
    "View.cam.x=250; View.cam.y=175; View.cam.z=0.62;",
    "var once={pts:View._gest.pts.size, pinch:View._gest.pinch!==null,",
    "  cam:{x:View.cam.x,y:View.cam.y,z:View.cam.z}};",
    "/* GERÇEK aksiyon delegasyonu */",
    "var recSay=0; var oSch=(typeof scheduleRecovery==='function')?scheduleRecovery:null;",
    "if(oSch) globalThis.scheduleRecovery=function(s,m){ recSay++; return oSch(s,m); };",
    "var oClose=UI.closeModal; UI.closeModal=function(){};",
    "UI.act('mapFix');",
    "UI.closeModal=oClose;",
    "if(oSch) globalThis.scheduleRecovery=oSch;",
    "var sonra={pts:View._gest.pts.size, pinch:View._gest.pinch===null,",
    "  cam:{x:View.cam.x,y:View.cam.y,z:View.cam.z}, rec:recSay};",
    "/* Ardından tap ve pan çalışmalı */",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View.route=false; View.sel=null; tabSay={};",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "ev('pointerdown',3,150,120); ev('pointerup',3,150,120);",
    "var tapOk=(tabSay['filo']||0);",
    "View.rowHits=[];",
    "var x0=View.cam.x, z0=View.cam.z;",
    "ev('pointerdown',4,400,300);",
    "for(var k=1;k<=6;k++) ev('pointermove',4,400+k*14,300);",
    "ev('pointerup',4,484,300);",
    "tuketiciGeri();",
    "return JSON.stringify({once:once, sonra:sonra, tap:tapOk,",
    "  pan:(View.cam.x!==x0), zoomAyni:(View.cam.z===z0)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const O=d.once||{}, S=d.sonra||{};
  ok('mapFix öncesi gerçekten takılı pointer + pinch vardı',
     O.pts===2 && O.pinch===true, 'pts '+O.pts);
  ok('mapFix pts durumunu SIFIRLADI', S.pts===0, String(S.pts));
  ok('mapFix pinch durumunu temizledi', S.pinch===true);
  ok('mapFix kamerayı GEREKSİZ sıfırlamadı',
     JSON.stringify(O.cam)===JSON.stringify(S.cam),
     JSON.stringify(S.cam));
  ok('TEK recovery planlandı', S.rec===1, String(S.rec));
  ok('mapFix sonrası gezegen/filo seçimi çalışıyor', d.tap===1, String(d.tap));
  ok('mapFix sonrası pan çalışıyor, zoom sabit',
     d.pan===true && d.zoomAyni===true);
}

/* ═══ G. YÜKLEME REGRESYONU ═══ */
console.log('\nG. YÜKLEME SONRASI TAM ZİNCİR');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "View.cam.x=140; View.cam.y=90; View.cam.z=0.55;",
    "View.selSys=G.sys[4];",
    "var f0=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View.sel=f0;",
    "var once={day:G.day, res:JSON.stringify(G.p.res),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), rng:RND_STATE};",
    "var kayit=serialize();",
    "/* YARIM JEST */",
    "ev('pointerdown',1,200,200); ev('pointerdown',2,300,200);",
    "var yarim=View._gest.pts.size;",
    "deserialize(kayit);",
    "var out={yarimJest:yarim, ptsSonra:View._gest.pts.size,",
    "  pinchTemiz:View._gest.pinch===null,",
    "  sysSecimGuncel:(View.selSys===G.sys[4]),",
    "  filoSecimGuncel:!!(View.sel && View.sel.id===f0.id),",
    "  camFinite:(isFinite(View.cam.x)&&isFinite(View.cam.y)&&isFinite(View.cam.z)),",
    "  veriKorundu:(once.day===G.day && once.res===JSON.stringify(G.p.res) &&",
    "    once.own===G.sys.map(function(s){return s.owner;}).join(',') &&",
    "    once.rng===RND_STATE)};",
    "/* TAP */",
    "var f=G.fleets.filter(function(x){return x.e===0 && (x.ships||[]).length;})[0];",
    "View.route=false; View.sel=null; tabSay={};",
    "View.rowHits=[{x:100,y:100,w:120,h:40,sys:f.sys,filolar:[f]}];",
    "var tapHata='';",
    "try{ ev('pointerdown',3,150,120); ev('pointerup',3,150,120); }",
    "catch(ex){ tapHata=ex.message; }",
    "out.tap={hata:tapHata, tabFilo:(tabSay['filo']||0)};",
    "/* PAN */",
    "View.rowHits=[];",
    "var x0=View.cam.x, z0=View.cam.z;",
    "ev('pointerdown',4,400,300);",
    "for(var k=1;k<=6;k++) ev('pointermove',4,400+k*14,300);",
    "ev('pointerup',4,484,300);",
    "out.pan={degisti:(View.cam.x!==x0), zoomAyni:(View.cam.z===z0)};",
    "/* PINCH */",
    "var z1=View.cam.z;",
    "ev('pointerdown',5,300,300); ev('pointerdown',6,420,300);",
    "ev('pointermove',6,520,300);",
    "out.pinch={zoomDegisti:(View.cam.z!==z1)};",
    "ev('pointerup',5,300,300); ev('pointerup',6,520,300);",
    "/* PINCH SONRASI PAN */",
    "var x2=View.cam.x, z2=View.cam.z;",
    "ev('pointerdown',7,400,300);",
    "for(var k2=1;k2<=6;k2++) ev('pointermove',7,400+k2*14,300);",
    "ev('pointerup',7,484,300);",
    "out.pinchSonrasiPan={degisti:(View.cam.x!==x2), zoomAyni:(View.cam.z===z2),",
    "  pts:View._gest.pts.size,",
    "  camFinite:(isFinite(View.cam.x)&&isFinite(View.cam.y)&&isFinite(View.cam.z))};",
    "tuketiciGeri();",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme öncesi yarım jest vardı', d.yarimJest===2, String(d.yarimJest));
  ok('yükleme stale pointer bırakmadı',
     d.ptsSonra===0 && d.pinchTemiz===true);
  ok('sistem seçimi güncel nesneye bağlı', d.sysSecimGuncel===true);
  ok('filo seçimi güncel nesneye bağlı', d.filoSecimGuncel===true);
  ok('yükleme oyun günü/kaynak/sahiplik/RNG değiştirmedi',
     d.veriKorundu===true);
  ok('kamera finite', d.camFinite===true);
  ok('yükleme sonrası TAP hatasız ve çalışıyor',
     (d.tap||{}).hata==='' && (d.tap||{}).tabFilo===1,
     JSON.stringify(d.tap));
  ok('yükleme sonrası PAN çalışıyor, zoom sabit',
     (d.pan||{}).degisti===true && (d.pan||{}).zoomAyni===true);
  ok('yükleme sonrası PINCH çalışıyor', (d.pinch||{}).zoomDegisti===true);
  const PP=d.pinchSonrasiPan||{};
  ok('pinch SONRASI pan çalışıyor, zoom sabit',
     PP.degisti===true && PP.zoomAyni===true);
  ok('zincir sonunda pts 0 ve kamera finite',
     PP.pts===0 && PP.camFinite===true);
}

/* ═══ H. LISTENER / rAF ÇOĞALMASI ═══ */
console.log('\nH. LISTENER VE DÖNGÜ ÇOĞALMASI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TUVAL,
    "function say(){ return {down:(L.pointerdown||[]).length,",
    "  move:(L.pointermove||[]).length, up:(L.pointerup||[]).length,",
    "  cancel:(L.pointercancel||[]).length,",
    "  lost:(L.lostpointercapture||[]).length, wheel:(L.wheel||[]).length}; }",
    "var ilk=say();",
    "for(var i=0;i<5;i++) View.bind();",
    "var oClose=UI.closeModal; UI.closeModal=function(){};",
    "for(var j=0;j<3;j++) UI.act('mapFix');",
    "UI.closeModal=oClose;",
    "var sonra=say();",
    "/* pan tek katsayıda mı (çift işleme yok) */",
    "var x0=View.cam.x;",
    "ev('pointerdown',1,300,300); ev('pointermove',1,280,300); ev('pointerup',1,280,300);",
    "var kayma=Math.abs(View.cam.x-x0);",
    "tuketiciGeri();",
    "return JSON.stringify({ilk:ilk, sonra:sonra, kayma:+kayma.toFixed(2),",
    "  beklenen:+(20/View.cam.z).toFixed(2), pts:View._gest.pts.size});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('5 bind + 3 mapFix sonrası listener sayısı ARTMADI',
     JSON.stringify(d.ilk)===JSON.stringify(d.sonra),
     JSON.stringify(d.ilk)+' → '+JSON.stringify(d.sonra));
  ok('pan TEK katsayıda (çift işleme yok)',
     Math.abs(d.kayma-d.beklenen)<0.5, d.kayma+' ≈ '+d.beklenen);
  ok('sonunda pts 0', d.pts===0);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
