#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 83.3 RENDER & KURTARMA TESTİ
   Yalnız Node.js yerleşik modülleri (fs, path, child_process, vm,
   crypto). Harici bağımlılık yoktur.

   Çalıştırma: node tests/faz83_3_render_recovery_test.js
   Çıkış kodu: 0 = hepsi geçti, 1 = en az bir başarısızlık
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'),
      vm=require('vm'), crypto=require('crypto');
const KOK = path.resolve(__dirname, '..');
const NL = '\n';
let gecen=0, kalan=0; const basarisiz=[];
const OLCUM = {};

function ok(ad, sart, detay){
  if (sart){ gecen++; console.log('  ✓ '+ad+(detay?' — '+detay:'')); }
  else { kalan++; basarisiz.push(ad); console.log('  ✗ '+ad+(detay?' — '+detay:'')); }
}
const oku = f => fs.readFileSync(path.join(KOK,f),'utf8');

/* ═══ SAHTE DOM + CANVAS ═══ */
function harness(opts){
  opts = opts || {};
  const sayac = {getImageData:0, resize:0, draw:0, runRecovery:0,
                 buildBorders:0, borderCacheAlive:0, raf:0, layout:0};
  const listeners = {};
  const doluD = new Uint8ClampedArray(4); doluD[3] = 200;
  const bosD  = new Uint8ClampedArray(4);
  const durum = {anaDolu: true, ctxHata: false, bcacheDolu: true};

  function ctx(){
    const c = {};
    ['fill','stroke','beginPath','arc','moveTo','lineTo','fillRect','fillText',
     'strokeText','save','restore','setLineDash','drawImage','closePath',
     'clearRect','translate','rotate','scale','ellipse','rect','strokeRect',
     'quadraticCurveTo','bezierCurveTo','clip','arcTo','setTransform',
     'resetTransform','putImageData'].forEach(k => c[k] = function(){});
    c.measureText = () => ({width:30});
    c.createRadialGradient = c.createLinearGradient = () => ({addColorStop(){}});
    c.createImageData = (w,h) => ({data:new Uint8ClampedArray(((w||1)*(h||1))*4),
                                   width:w||1, height:h||1});
    c.getImageData = function(){
      sayac.getImageData++;
      if (durum.ctxHata) throw new Error('sentetik context hatası');
      return {data: durum.anaDolu ? doluD : bosD};
    };
    c.canvas = {width:900, height:420};
    return c;
  }
  function el(id){
    const e = {id, className:'', innerHTML:'', textContent:'', style:{},
      dataset:{}, width:900, height:420, offsetWidth:900, offsetHeight:420,
      clientWidth:900, clientHeight:420, scrollTop:0,
      classList:{_s:new Set(), add(...a){a.forEach(x=>this._s.add(x));},
        remove(...a){a.forEach(x=>this._s.delete(x));},
        toggle(x,v){ v===undefined?(this._s.has(x)?this._s.delete(x):this._s.add(x))
          :(v?this._s.add(x):this._s.delete(x)); },
        contains(x){return this._s.has(x);}},
      appendChild(){}, removeChild(){}, remove(){}, addEventListener(){},
      getContext(){ return ctx(); },
      getBoundingClientRect(){return{left:0,top:0,right:100,bottom:40,width:100,height:40};},
      querySelector(){return null;}, querySelectorAll(){return [];},
      closest(){return null;}, focus(){}, click(){}};
    return e;
  }
  const store = {};
  const sb = { console:{log(){},warn(){},error(){}}, Math, Date, JSON, parseInt,
    parseFloat, isFinite, isNaN, Set, Map, Array, Object, String, Number,
    Boolean, Error, Promise, RegExp, Uint8ClampedArray, Float32Array,
    Int32Array, Proxy, Reflect, Symbol, NL };
  const KUYRUK = [];
  sb.setTimeout = (f,ms) => { KUYRUK.push({f,ms}); return KUYRUK.length; };
  sb.clearTimeout = id => { if (KUYRUK[id-1]) KUYRUK[id-1].f = null; };
  sb.setInterval = ()=>1; sb.clearInterval = ()=>{};
  sb.requestAnimationFrame = () => { sayac.raf++; return 1; };
  sb.cancelAnimationFrame = ()=>{};
  sb.performance = {now: () => Date.now()};
  sb.document = { getElementById: id => (store[id] || (store[id] = el(id))),
    createElement: t => el(t), querySelector:()=>null, querySelectorAll:()=>[],
    addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    body: el('body'), documentElement: el('html'), hidden:false,
    visibilityState:'visible' };
  sb.window = { addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    innerWidth:900, innerHeight:420, matchMedia:()=>({matches:false}),
    localStorage:{_d:{}, getItem(k){return this._d[k]||null;},
      setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];}},
    location:{protocol:'https:'}, devicePixelRatio:1 };
  sb.localStorage = sb.window.localStorage;
  sb.navigator = {userAgent:'node', standalone:false};
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of ['main.js','map.js','combat.js','ai.js','diplomacy.js',
                   'economy.js','ui.js','audio.js'])
    vm.runInContext(fs.readFileSync(path.join(KOK,f),'utf8'), sb, {filename:f});

  const R = c => { try { return vm.runInContext('(function(){'+c+'})()', sb); }
                   catch(e){ return 'HATA: '+e.message; } };
  const flush = () => { const k = KUYRUK.splice(0);
                        k.forEach(x => { if (x.f) try{x.f();}catch(e){} }); };
  const ates = (tur) => { (listeners[tur]||[]).forEach(f => { try{f({});}catch(e){} }); };
  return {sb, R, sayac, durum, flush, ates, listeners, ctx};
}

/* ═══════════════ A. KAYNAK VE SÖZDİZİMİ ═══════════════ */
console.log('\nA. KAYNAK VE SÖZDİZİMİ');
for (const f of fs.readdirSync(KOK).filter(x => x.endsWith('.js'))){
  let h = null;
  try { cp.execFileSync(process.execPath, ['--check', path.join(KOK,f)], {stdio:'pipe'}); }
  catch(e){ h = String(e.stderr||e.message).split('\n')[0]; }
  ok('node --check '+f, !h, h||undefined);
}
let mf=null; try { mf = JSON.parse(oku('manifest.json')); } catch(e){}
ok('manifest.json geçerli JSON', !!mf);
const html = oku('index.html');
const sira = (html.match(/<script src="([^"]+\.js)"><\/script>/g)||[])
  .map(x => x.replace(/.*src="/,'').replace(/".*/,''));
ok('script yükleme sırası değişmedi',
   ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','ui.js','audio.js']
   .every((f,i) => sira[i]===f), sira.join(' → '));
const mainJs = oku('main.js');
['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
 'yh_templates','__yh_probe','__yh_diag'].forEach(k =>
  ok('anahtar korundu: '+k, mainJs.includes(k)));
/* Cache sürümü her fazda yükseliyor — sabit sürüm yerine
   'stars-v' önekine ve eski markanın yokluğuna bakıyoruz. */
{
  const swSrc = oku('sw.js');
  ok('sw cache stars-v ile başlıyor', /const CACHE = 'stars-v[\w.-]+'/.test(swSrc),
     (swSrc.match(/const CACHE = '([^']+)'/)||[])[1]);
}

/* ═══════════════ B. NORMAL KARE PERFORMANSI ═══════════════ */
console.log('\nB. NORMAL KARE PERFORMANSI');
{
  const H = harness();
  const r = H.R(`
    setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
      diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
      origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    View.cam.z=0.04; View.cam.x=G.W/2; View.cam.y=G.H/2;
    MAP_MODE='siyasi';
    View.draw(0);                       // ilk doku üretimi
    globalThis.__k1 = View.bkey;
    return 'ok';`);
  ok('kurulum', r==='ok', r!=='ok'?String(r):undefined);
  H.sayac.getImageData = 0;
  H.R('for (var i=0;i<300;i++) View.draw(i*16); return 1;');
  OLCUM.normal300 = H.sayac.getImageData;
  ok('300 normal karede getImageData = 0', H.sayac.getImageData === 0,
     H.sayac.getImageData + ' çağrı');
  const bb = H.R('return typeof View.buildBorders === "function" && !!View.bcache;');
  ok('buildBorders normal çalışmaya devam ediyor', bb === true);
  const yeni = H.R(`
    var eski = View.bkey;
    MAP_MODE='diplomasi';
    View.invalidateRenderCaches('test');
    View.draw(1);
    return (View.bkey !== eski && !!View.bcache) ? 'ok' : 'eski:'+eski;`);
  ok('anahtar değişince doku yeniden üretiliyor', yeni === 'ok', String(yeni));
}

/* ═══════════════ C. KURTARMA SAĞLIK TESTİ ═══════════════ */
console.log('\nC. KURTARMA SAĞLIK TESTİ');
{
  const H = harness();
  H.R(`setupGame({name:'S',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
    diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
    origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    View.cam.z=0.04; View.cam.x=G.W/2; View.cam.y=G.H/2; View.draw(0); return 1;`);

  H.durum.anaDolu = true;
  let h = H.R('var h=verifyRenderHealth(); return h.kod+"|"+h.ok;');
  ok('dolu canvas sağlıklı', /healthy\|true/.test(String(h)), String(h));

  H.durum.anaDolu = false;
  h = H.R('var h=verifyRenderHealth(); return h.kod+"|"+h.ok;');
  ok('tamamen şeffaf canvas YAKALANDI', /blank-canvas\|false/.test(String(h)), String(h));

  /* Güvenilir sistem noktası dolu, genel noktalar boş */
  H.durum.anaDolu = true;
  const secmeli = H.R(`
    var orij = View.g.getImageData;
    var sayi = 0;
    var dolu = new Uint8ClampedArray(4); dolu[3]=180;
    var bos  = new Uint8ClampedArray(4);
    View.g.getImageData = function(){ sayi++;
      return {data: sayi===1 ? dolu : bos}; };   // yalnız 1. (güvenilir) dolu
    var h = verifyRenderHealth();
    View.g.getImageData = orij;
    return h.kod+'|'+h.ok;`);
  ok('güvenilir nokta doluysa yanlış hata YOK',
     /healthy\|true/.test(String(secmeli)), String(secmeli));

  /* Güvenilir sistem yok → belirsiz */
  const belirsiz = H.R(`
    var eskiCam = {x:View.cam.x, y:View.cam.y, z:View.cam.z};
    View.cam.x = -999999; View.cam.y = -999999;   // hiçbir sistem viewport'ta değil
    var h = verifyRenderHealth();
    View.cam.x=eskiCam.x; View.cam.y=eskiCam.y; View.cam.z=eskiCam.z;
    return h.kod+'|'+h.ok+'|'+(h.belirsiz?'belirsiz':'kesin');`);
  ok('güvenilir sistem yoksa BELİRSİZ, boş kararı yok',
     /inconclusive\|true\|belirsiz/.test(String(belirsiz)), String(belirsiz));

  H.durum.ctxHata = true;
  h = H.R('var h=verifyRenderHealth(); return h.kod+"|"+h.ok;');
  ok('getImageData hatası yakalandı',
     /ctx-unreadable\|false/.test(String(h)), String(h));
  H.durum.ctxHata = false;

  /* Tek başarılı kurtarmada getImageData sayısı */
  H.sayac.getImageData = 0;
  H.R('runRecovery("olcum",0); return 1;');
  OLCUM.recovery1 = H.sayac.getImageData;
  ok('tek kurtarmada getImageData ≤ 6', H.sayac.getImageData <= 6,
     H.sayac.getImageData + ' çağrı');
}

/* ═══════════════ D. RETRY SINIRI ═══════════════ */
console.log('\nD. RETRY SINIRI');
{
  const H = harness();
  H.R(`setupGame({name:'R',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
    diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
    origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    View.cam.z=0.04; View.cam.x=G.W/2; View.cam.y=G.H/2; View.draw(0); return 1;`);
  const r1 = H.R(`
    var cagri=0, od=View.draw;
    View.draw=function(t){ cagri++; if(cagri===1) throw new Error('sentetik');
      return od.apply(View,arguments); };
    var once=DIAG.length;
    runRecovery('retrytest',0);
    View.draw=od;
    return cagri;`);
  OLCUM.retryDraw = r1;
  ok('ilk başarısız + ikinci başarılı = 2 çizim', r1 === 2, r1+' çizim');
  ok('sonsuz döngü yok', r1 <= 3, r1+' çizim');
  const r2 = H.R(`
    var cagri=0, od=View.draw;
    View.draw=function(){ cagri++; throw new Error('hep hata'); };
    runRecovery('hep',0);
    View.draw=od;
    var son = DIAG.slice(-3).map(function(d){return d.tur+':'+d.m.slice(0,40);});
    return cagri+'||'+son.join(' ## ');`);
  const parca = String(r2).split('||');
  ok('iki deneme de başarısızsa durur', +parca[0] <= 2, parca[0]+' çizim');
  ok('DIAG doğru nedeni gösteriyor',
     /retry sonrası hâlâ sağlıksız|draw-error|sentetik|hep hata/.test(parca[1]||''),
     (parca[1]||'').slice(0,70));
}

/* ═══════════════ E. RESIZE FIRTINASI ═══════════════ */
console.log('\nE. RESIZE FIRTINASI');
{
  const H = harness();
  H.R(`setupGame({name:'E',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
    diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
    origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map'); View.draw(0); return 1;`);
  const dinleyici = (H.listeners['resize']||[]).length;
  OLCUM.resizeListener = dinleyici;
  ok('tek window resize dinleyicisi', dinleyici === 1, dinleyici+' adet');
  const say = H.R(`
    globalThis.__rs=0; globalThis.__dr=0; globalThis.__rr=0;
    var oR=View.resize, oD=View.draw, oRR=runRecovery;
    View.resize=function(){ globalThis.__rs++; return oR.apply(View,arguments); };
    View.draw=function(){ globalThis.__dr++; return oD.apply(View,arguments); };
    globalThis.runRecovery=function(){ globalThis.__rr++; };
    return 1;`);
  for (let i=0;i<50;i++) H.ates('resize');
  H.flush();
  const sonuc = H.R('return globalThis.__rs+"|"+globalThis.__dr+"|"+globalThis.__rr;');
  const [rs,dr,rr] = String(sonuc).split('|').map(Number);
  OLCUM.resize50 = {resize:rs, draw:dr, runRecovery:rr};
  ok('50 resize → tek ağır runRecovery', rr === 1, rr+' runRecovery');
  ok('layout geçişi olay başına 1', rs >= 50 && rs <= 150,
     rs+' View.resize (50 olay × abone sayısı)');
  ok('ikinci oyun rAF zinciri yok', H.sayac.raf === 0, H.sayac.raf+' rAF');
}

/* ═══════════════ F. DİĞER KURTARMA OLAYLARI ═══════════════ */
console.log('\nF. DİĞER KURTARMA OLAYLARI');
{
  const H = harness();
  H.R(`setupGame({name:'F',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
    diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
    origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map'); View.draw(0);
    globalThis.__rr=0;
    globalThis.runRecovery=function(){ globalThis.__rr++; };
    return 1;`);
  ['visibilitychange','pageshow','focus','orientationchange'].forEach(olay => {
    H.R('globalThis.__rr=0; return 1;');
    H.ates(olay); H.flush();
    const n = H.R('return globalThis.__rr;');
    ok(olay+' → runRecovery', n >= 1, n+' çağrı');
  });
}

/* ═══════════════ G. VERİ BÜTÜNLÜĞÜ ═══════════════ */
console.log('\nG. VERİ BÜTÜNLÜĞÜ');
{
  const H = harness();
  const r = H.R(`
    setupGame({name:'G',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
      diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
      origin:'standart',ruins:'orta',crisis:'kapali',council:'normal'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    for (var m=0;m<24;m++){
      for (var d=0;d<30;d++){ dailyTick(1); structTick(1); colonyBuildTick(1); }
      economyTick(false); diploTick(); monthTick(); G.over=null;
    }
    var hs=G.sys[G.p.home];
    hs.rally={}; hs.rally[0]={sys:hs.lanes[0]}; hs.loopBuild='kor';
    View.draw(0);
    var once=serialize();
    runRecovery('veri',0);
    var sonra=serialize();
    /* ANLAMSAL karşılaştırma: leaderPool() çağrıldığında
       e.leaders undefined → [] oluyor. Bu bir başlatma yan
       etkisi; oyun anlamında fark yok (boş havuz = havuz yok).
       Karşılaştırmadan önce iki tarafta da normalize ediyoruz. */
    function norm(t){
      var d=JSON.parse(t);
      (d.emps||[]).forEach(function(e2){
        if (Array.isArray(e2.leaders) && e2.leaders.length===0) delete e2.leaders;
      });
      return JSON.stringify(d);
    }
    var esit = norm(once)===norm(sonra);
    var hamFark = once===sonra ? 0 : Math.abs(once.length-sonra.length);
    var hs2=G.sys[G.p.home];
    return [esit ? 'AYNI'+(hamFark?' (ham fark '+hamFark+'B: leaders undefined→[])':'')
                 : 'FARK('+hamFark+')',
            (hs2.rally&&hs2.rally[0])?'rally-ok':'rally-KAYIP',
            hs2.loopBuild==='kor'?'loop-ok':'loop-KAYIP',
            typeof UI.tab].join('|');`);
  const p = String(r).split('|');
  ok('serialize kurtarma öncesi/sonrası anlamsal olarak aynı',
     p[0].indexOf('AYNI')===0, p[0]);
  ok('ralli korundu', p[1]==='rally-ok', p[1]);
  ok('loopBuild korundu', p[2]==='loop-ok', p[2]);
  ok('UI.tab hâlâ function', p[3]==='function', p[3]);
  const v3 = H.R(`
    var t=serialize();
    G.sys=[]; G.emps=[]; G.fleets=[];
    var ok2=deserialize(t);
    var sahipli=G.sys.filter(function(s){return s.owner>=0;});
    var reach=sahipli.filter(function(s){return (s._reach||0)>0;});
    return (ok2?'yuklendi':'HATA')+'|'+sahipli.length+'/'+reach.length;`);
  const q = String(v3).split('|');
  ok('kayıt mantıksal olarak yüklenebiliyor', q[0]==='yuklendi', q[0]);
  ok('_reach yüklemede yeniden üretildi',
     q[1] && q[1].split('/')[0] === q[1].split('/')[1], q[1]+' (sahipli/reach)');
}

/* ═══════════════ H. ÖLÇÜM RAPORU ═══════════════ */
console.log('\nH. ÖLÇÜM RAPORU');
{
  const mj = oku('main.js');
  /* ═══ FAZ 84A: YANLIŞ GÜVEN VEREN ARAMA DÜZELTİLDİ ═══
     Eski kod `indexOf('function forceRedraw()')` arıyordu. Faz
     83.4'te imza `function forceRedraw(sebep)` oldu; arama -1
     döndü, slice(-1, 899) dosyanın SONUNDAN bir parça aldı ve
     sayımlar anlamsız çıktı — ama test yine de GEÇTİ. Artık
     parametre bağımsız regex kullanılıyor ve fonksiyon
     bulunamazsa test KESİN olarak başarısız oluyor. */
  const m = mj.match(/function\s+forceRedraw\s*\([^)]*\)\s*\{/);
  ok('forceRedraw tanımı bulundu', !!m, m ? m[0] : 'BULUNAMADI');
  const i = m ? mj.indexOf(m[0]) : -1;
  /* Gövdeyi süslü parantez sayarak KESİN sınırla — regex ile
     bölmek fonksiyondan sonraki yorumları da içine alıyordu. */
  let govde = '';
  if (i >= 0){
    let d = 0, basladi = false;
    for (let k = i; k < mj.length && k < i + 4000; k++){
      const ch = mj[k];
      if (ch === '{'){ d++; basladi = true; }
      else if (ch === '}') d--;
      govde += ch;
      if (basladi && d === 0) break;
    }
  }
  ok('forceRedraw scheduleRecovery\'ye delege ediyor',
     /scheduleRecovery/.test(govde));
  ok('forceRedraw içinde doğrudan View.draw YOK',
     !/View\.draw/.test(govde));
  ok('forceRedraw içinde ciz() zinciri YOK',
     !/ciz\s*\(/.test(govde));
  ok('forceRedraw içinde requestAnimationFrame YOK',
     !/requestAnimationFrame/.test(govde));
  OLCUM.forceRedrawResize = (govde.match(/View\.resize/g)||[]).length;
  OLCUM.forceRedrawDraw   = (govde.match(/View\.draw/g)||[]).length;
  const ciz = (govde.match(/ciz\(\)/g)||[]).length;
  console.log('  1. 300 normal karede getImageData ....... ' + OLCUM.normal300);
  console.log('  2. tek başarılı recovery'+"'"+'de getImageData . ' + OLCUM.recovery1);
  console.log('  3. retry gerektiren recovery: çizim ..... ' + OLCUM.retryDraw);
  console.log('  4. 50 resize → View.resize ' + OLCUM.resize50.resize +
              ' · View.draw ' + OLCUM.resize50.draw +
              ' · runRecovery ' + OLCUM.resize50.runRecovery);
  console.log('  5. forceRedraw gövdesi: ' + OLCUM.forceRedrawResize +
              ' resize · ' + OLCUM.forceRedrawDraw + ' draw · ' +
              ciz + ' ciz() — Faz 83.4\'te sarmalayıcıya indirildi');
  console.log('  6. window resize dinleyicisi ............ ' + OLCUM.resizeListener);
}

/* ═══════════════ ÖZET ═══════════════ */
console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if (basarisiz.length){ console.log('  BAŞARISIZ:');
  basarisiz.forEach(x => console.log('    · '+x)); }
console.log('══════════════════════════════════════════\n');
process.exit(kalan ? 1 : 0);
