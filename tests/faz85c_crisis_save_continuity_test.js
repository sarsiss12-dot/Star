#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85C: OYUN SONU KRİZİ KAYDET/YÜKLE SÜREKLİLİĞİ
   Çalıştırma: node tests/faz85c_crisis_save_continuity_test.js
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
      clientWidth:900,clientHeight:420,scrollTop:0,
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
const KUR=(cr,seed,size)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'"+(size||'buyuk')+"',",
 " shape:'sarmal',diff:'normal',seed:"+(seed||99)+",",
 " ethics:{mil:1,aut:0,mat:0,ahl:0},civics:[],origin:'standart',",
 " ruins:'yok',crisis:'"+cr+"',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "return 'ok';"].join('\n');
/* Krizi gerçekten aktif hâle getirir. */
const AKTIFLE=[
 "G.crisis.atMonth=1; G.crisis.age=0;",
 "for(var i=0;i<4 && !crisisActive();i++) crisisTick();",
 "G.crisis.stage=2; G.crisis.timer=7; G.crisis.kills=5;",
 "G.crisis.need=120; G.crisis.contrib={0:40,1:15}; G.crisis.warned=true;",
 "G.crisis.over=false;"].join('\n');

/* ═══ A. SÖZDİZİMİ, DOSYA SINIRI, KARANTİNA ═══ */
console.log('\nA. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const mainJs=oku('main.js');
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mainJs.includes(k)));
  ok("sw cache = 'stars-v95d'", /const CACHE = 'stars-v95d'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 (Faz 85F ile yükseldi)', /v:8, cfg:G\.cfg/.test(mainJs));
  ok('world (85A) şeması korundu',
     /world: serializePoliticalWorld\(\)/.test(mainJs) &&
     /sandbox: G\.sandbox === true/.test(mainJs));
  ok('threats bölümü eklendi', /threats: serializeCrisisWorld\(\)/.test(mainJs));
  /* Sıra: threats geri yüklemesi world'den SONRA, türetilmişten ÖNCE */
  const iw=mainJs.indexOf('G._loadWorldInfo = restorePoliticalWorld');
  const ic=mainJs.indexOf('G._loadCrisisInfo = restoreCrisisWorld');
  const ir=mainJs.indexOf('rebuildDerivedStateAfterLoad(true);', ic);
  const ie=mainJs.indexOf('economyTick(true);', ic);
  ok('restoreCrisisWorld, restorePoliticalWorld SONRASINDA', ic>iw && iw>0);
  ok('restoreCrisisWorld, rebuildDerivedStateAfterLoad ÖNCESİNDE', ir>ic);
  ok('restoreCrisisWorld, economyTick(true) ÖNCESİNDE', ie>ic);
  ok('setupGame kriz sıfırlaması initCrisis ÖNCESİNDE',
     mainJs.indexOf('resetCrisisRuntimeState();') <
     mainJs.indexOf("if (typeof initCrisis === 'function') initCrisis();"));
  /* KAPSAM DIŞI alanlar threats'e sızmamalı */
  const i1=mainJs.indexOf('function serializeCrisisWorld');
  const i2=mainJs.indexOf('function resetCrisisRuntimeState');
  ['G.upheaval','G.upAge','G.upLast','G.wildId','G.nests','G.ruins',
   'G.raids','G.market','G.inbox','G.chainQueue'].forEach(k=>
    ok('kapsam dışı alan threats içinde YOK: '+k,
       mainJs.slice(i1,i2).indexOf(k)<0));
  /* Çalışma zamanında crisisId null bırakılmamalı */
  ok('resetCrisisRuntimeState delete kullanıyor (null DEĞİL)',
     /function resetCrisisRuntimeState\(\)\{[\s\S]{0,220}delete G\.crisisId;/.test(mainJs));
  ok('G.crisisId = null ataması kodda YOK',
     !/G\.crisisId\s*=\s*null/.test(mainJs));
  /* FAZ 85B saf init yolu byte düzeyinde korunmalı */
  const eco=oku('economy.js');
  ok('85B: advanceMonthlyWorld duruyor', /function advanceMonthlyWorld\(\)\{/.test(eco));
  ok('85B: aylık dünya yalnız init===false yolunda',
     /if \(!init\) advanceMonthlyWorld\(\);/.test(eco));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF (yorumlu)',
     /\/\/\s*if \(typeof situationsTick/.test(dip) &&
     !/^\s*if \(typeof situationsTick === 'function'\) situationsTick\(\);/m.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
  const H=harness(); H.R(KUR('kapali',99));
  const sit=H.R(["G.sits=[]; G.sitDone={};",
    "for (var m=0;m<200;m++){ G.memAge++; monthTick(); G.over=null; }",
    "return String((G.sits||[]).length);"].join('\n'));
  ok('200 ayda situation tetiklenmedi', String(sit)==='0', String(sit));
}
{
  /* FAZ 86C.4H: map.js ve main.js bu hotfix'te DEĞİŞİYOR
     (pointer yaşam döngüsü + yükleme sonrası kurtarma), bu
     yüzden korunan kümeden çıkarıldılar. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  const izinsiz=[
                 'audio.js','manifest.json'];
  if(!ref) ok('referans-sha.json okunabildi', false, 'dosya yok');
  else izinsiz.forEach(f=>{
    if(!ref[f]){ ok(f+' referansı var', false, 'referansta yok'); return; }
    const h=crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
  /* 91D: etiket/draw değişikliği izinli; giriş/kurtarma/kamera/sprite/filo kaynakları 91C ile aynı. */
  ok('map kaynak kilidi: 91C altyapısı + 93A hedef seçimi',
     require('./helpers/map-preservation').isMapInfrastructurePreserved(oku('map.js')));
}

/* ═══ B. SENARYO 1 — BEKLEYEN KRİZ ═══ */
console.log('\nB. SENARYO 1 — BEKLEYEN KRİZ');
{
  const H=harness(); H.R(KUR('normal',99));
  const r=H.R([
    "var A=JSON.parse(JSON.stringify(G.crisis));",
    "var k=serialize(); var v=JSON.parse(k);",
    "/* zehirle */",
    "G.crisis={stage:9,age:9999,at:9999,atMonth:9999,warned:true,over:true};",
    "G.crisisId=3;",
    "var yaslar=[];",
    "for(var i=0;i<10;i++){ deserialize(k); yaslar.push(G.crisis.age); }",
    "var B=G.crisis;",
    "return JSON.stringify({surum:v.v,",
    "  threatsAlan:Object.keys(v.threats||{}).sort().join(','),",
    "  stage:B.stage, age:B.age, at:B.at, atMonth:B.atMonth,",
    "  warned:B.warned, over:B.over,",
    "  bekAge:A.age, bekAt:A.at, bekAtMonth:A.atMonth,",
    "  yaslar:yaslar, yasSabit:yaslar.every(function(x){return x===A.age;}),",
    "  aktif:crisisActive(), crisisId:G.crisisId,",
    "  idTipi:(typeof G.crisisId)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıt sürümü v:8 (Faz 85F)', d.surum===8, 'v='+d.surum);
  ok('threats alanları tam (crisis, crisisId)',
     d.threatsAlan==='crisis,crisisId', d.threatsAlan);
  ok('stage=0 korundu', d.stage===0, String(d.stage));
  ok('age korundu', d.age===d.bekAge, d.bekAge+' → '+d.age);
  ok('at korundu', d.at===d.bekAt, String(d.at));
  ok('atMonth korundu', d.atMonth===d.bekAtMonth, String(d.atMonth));
  ok('warned korundu (false)', d.warned===false);
  ok('over korundu (false)', d.over===false);
  ok('10 ardışık yükleme age değerini ARTIRMADI',
     d.yasSabit===true, (d.yaslar||[]).join(','));
  ok('yükleme tek başına krizi BAŞLATMADI', d.aktif===false);
  ok('kriz tarafı yokken crisisId undefined (null DEĞİL)',
     d.idTipi==='undefined', d.idTipi);
}

/* ═══ C. SENARYO 2 — AKTİF KRİZ ═══ */
console.log('\nC. SENARYO 2 — AKTİF KRİZ');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "function kf(){ return G.fleets.filter(function(f){return f.e===G.crisisId;})",
    "  .map(function(f){return f.id+':'+f.sys+':'+(f.order||'-')+':'+(f.stance||'-')+':'+",
    "    f.ships.map(function(s){return s.c+'@'+(+(s.h!==undefined?s.h:1)).toFixed(3);}).join('|');})",
    "  .sort().join(';'); }",
    "var A={c:JSON.parse(JSON.stringify(G.crisis)), id:G.crisisId,",
    "  ad:G.emps[G.crisisId].name, filo:kf(),",
    "  filoSayi:G.fleets.filter(function(f){return f.e===G.crisisId;}).length,",
    "  gemi:G.fleets.filter(function(f){return f.e===G.crisisId;})",
    "    .reduce(function(a,f){return a+f.ships.length;},0)};",
    "var k=serialize();",
    "/* zehirle */",
    "G.crisis=null; delete G.crisisId;",
    "for(var i=0;i<5;i++) deserialize(k);",
    "var B={c:G.crisis, id:G.crisisId, filo:kf(),",
    "  side:G.emps[G.crisisId]?G.emps[G.crisisId].crisisSide:null,",
    "  ad:G.emps[G.crisisId]?G.emps[G.crisisId].name:null,",
    "  filoSayi:G.fleets.filter(function(f){return f.e===G.crisisId;}).length,",
    "  gemi:G.fleets.filter(function(f){return f.e===G.crisisId;})",
    "    .reduce(function(a,f){return a+f.ships.length;},0)};",
    "return JSON.stringify({A:A, B:B, aktif:crisisActive(),",
    "  esit:JSON.stringify(A.c)===JSON.stringify(B.c),",
    "  filoEsit:A.filo===B.filo});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const B=d.B||{}, A=d.A||{}, c=B.c||{};
  ok('kriz gerçekten aktifti (kurulum geçerli)', A.c && A.c.stage===2);
  ok('5 yükleme sonrası crisis nesnesi BİREBİR aynı', d.esit===true,
     JSON.stringify(c).slice(0,80));
  ok('stage korundu (2)', c.stage===2, String(c.stage));
  ok('timer korundu (7)', c.timer===7, String(c.timer));
  ok('kills korundu (5)', c.kills===5, String(c.kills));
  ok('need korundu (120)', c.need===120, String(c.need));
  ok('contrib korundu', JSON.stringify(c.contrib)==='{"0":40,"1":15}',
     JSON.stringify(c.contrib));
  ok('warned korundu (true)', c.warned===true);
  ok('over korundu (false)', c.over===false);
  ok('crisisActive() yükleme sonrası TRUE', d.aktif===true);
  ok('crisisId doğru crisisSide devletine bağlı',
     B.id===A.id && B.side===true, 'id='+B.id+' '+B.ad);
  ok('kriz filoları/gemileri/sistemleri/emirleri korundu',
     d.filoEsit===true, B.filoSayi+' filo · '+B.gemi+' gemi');
}

/* ═══ D. SENARYO 3 — TEK GERÇEK AY ═══ */
console.log('\nD. SENARYO 3 — TEK GERÇEK crisisTick()');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var k=serialize();",
    "function ozet(){ return JSON.stringify({s:G.crisis.stage, t:G.crisis.timer,",
    "  a:G.crisis.age, o:G.crisis.over,",
    "  f:G.fleets.filter(function(f){return f.e===G.crisisId;}).length}); }",
    "/* A: taze yükleme + tek tik */",
    "deserialize(k); var oncA=ozet(); crisisTick(); var A=ozet();",
    "/* B: 8 yükleme + tek tik */",
    "for(var i=0;i<8;i++) deserialize(k);",
    "var oncB=ozet(); crisisTick(); var B=ozet();",
    "/* C: 8 yükleme, tik YOK — sayaç ilerlememeli */",
    "for(var j=0;j<8;j++) deserialize(k);",
    "var C=ozet();",
    "return JSON.stringify({oncA:oncA, A:A, oncB:oncB, B:B, C:C});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme sayısı sonucu ETKİLEMİYOR (aynı başlangıç)',
     d.oncA===d.oncB && d.oncB===d.C, d.C);
  ok('8 yükleme tek başına sayacı İLERLETMEDİ', d.oncA===d.C, d.C);
  ok('taze yükleme + tek tik = 8 yükleme + tek tik', d.A===d.B,
     d.A+' / '+d.B);
  ok('tek tik sayacı YALNIZ BİR kez ilerletti', d.A!==d.oncA,
     d.oncA+' → '+d.A);
}

/* ═══ E. SENARYO 4 — ÇÖZÜLMÜŞ KRİZ ═══ */
console.log('\nE. SENARYO 4 — ÇÖZÜLMÜŞ KRİZ');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "G.crisis.over=true; G.crisis.stage=3;",
    "G.p.guardian={since:5,vetoAt:0,newOrder:false}; G.p.crisisScore=380;",
    "G.fleets=G.fleets.filter(function(f){return f.e!==G.crisisId;});",
    "var filoOnce=G.fleets.length;",
    "var k=serialize();",
    "G.crisis=null; delete G.crisisId;",
    "var logOnce=(G.log||[]).length;",
    "for(var i=0;i<5;i++) deserialize(k);",
    "/* yükleme sonrası tek tik de krizi diriltmemeli */",
    "crisisTick(); crisisTick();",
    "return JSON.stringify({over:G.crisis&&G.crisis.over,",
    "  stage:G.crisis&&G.crisis.stage, aktif:crisisActive(),",
    "  krizFilo:G.fleets.filter(function(f){return f.e===G.crisisId;}).length,",
    "  filoOnce:filoOnce, filoSonra:G.fleets.length,",
    "  guard:JSON.stringify(G.p.guardian), skor:G.p.crisisScore,",
    "  id:G.crisisId, side:G.emps[G.crisisId]?G.emps[G.crisisId].crisisSide:null});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('over=true korundu', d.over===true);
  ok('stage=3 korundu', d.stage===3, String(d.stage));
  ok('yükleme krizi YENİDEN BAŞLATMADI', d.aktif===false);
  ok('yeni kriz filosu DOĞMADI', d.krizFilo===0, String(d.krizFilo));
  ok('toplam filo sayısı değişmedi', d.filoOnce===d.filoSonra,
     d.filoOnce+'/'+d.filoSonra);
  ok('guardian korundu', d.guard==='{"since":5,"vetoAt":0,"newOrder":false}');
  ok('crisisScore korundu (380)', d.skor===380, String(d.skor));
  ok('crisisId hâlâ gerçek crisisSide devletine bağlı', d.side===true,
     'id='+d.id);
}

/* ═══ F. SENARYO 5 — KRİZ KAPALI ═══ */
console.log('\nF. SENARYO 5 — KRİZ KAPALI');
{
  const H=harness(); H.R(KUR('kapali',99));
  const r=H.R([
    "var k=serialize(); var v=JSON.parse(k);",
    "/* zehirle: crisisId'yi OYUNCUYA denk gelen 0 ve null ile dene */",
    "G.crisis={stage:2,over:false}; G.crisisId=0;",
    "deserialize(k);",
    "var a={crisis:G.crisis, id:G.crisisId, tip:typeof G.crisisId,",
    "  emps0:G.emps[G.crisisId]?G.emps[G.crisisId].name:'-'};",
    "G.crisisId=null;",
    "deserialize(k);",
    "var b={id:G.crisisId, tip:typeof G.crisisId,",
    "  varMi:('crisisId' in G),",
    "  oyuncuyaBagli:(G.crisisId!==undefined && G.emps[G.crisisId]===G.p)};",
    "return JSON.stringify({kayitCrisis:v.threats.crisis,",
    "  kayitId:v.threats.crisisId, a:a, b:b});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıtta crisis null', d.kayitCrisis===null);
  ok('kayıtta crisisId null (kimlik yok işareti)', d.kayitId===null);
  ok('yükleme sonrası G.crisis null korundu', d.a && d.a.crisis===null);
  ok('çalışma zamanında crisisId undefined (null DEĞİL)',
     d.a && d.a.tip==='undefined', (d.a||{}).tip);
  ok('crisisId anahtarı G üzerinden tamamen silindi',
     d.b && d.b.varMi===false);
  ok('G.emps[null] üzerinden OYUNCUYA yanlış bağlanma YOK',
     d.b && d.b.oyuncuyaBagli===false);
}

/* ═══ G. SENARYO 6 — AYNI OTURUM ZEHİRLEME ═══ */
console.log('\nG. SENARYO 6 — AYNI OTURUMDA FARKLI KAYIT');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var kA=serialize();",
    "var aId=G.crisisId, aStage=G.crisis.stage;",
    "/* Oyun B: krizsiz */",
    "setupGame({name:'B',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var kB=serialize();",
    "/* A yükle, sonra B yükle */",
    "deserialize(kA);",
    "var aYuk={id:G.crisisId, stage:G.crisis&&G.crisis.stage, aktif:crisisActive()};",
    "deserialize(kB);",
    "var bYuk={crisis:G.crisis, id:G.crisisId, tip:typeof G.crisisId,",
    "  aktif:crisisActive(),",
    "  krizSide:G.emps.filter(function(x){return x.crisisSide;}).length};",
    "return JSON.stringify({aId:aId, aStage:aStage, aYuk:aYuk, bYuk:bYuk});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('OYUN A aktif krizle yüklendi',
     d.aYuk && d.aYuk.aktif===true && d.aYuk.stage===2, 'id='+(d.aYuk||{}).id);
  ok('OYUN B: G.crisis A\'dan SIZMADI', d.bYuk && d.bYuk.crisis===null);
  ok('OYUN B: crisisId A\'dan SIZMADI (undefined)',
     d.bYuk && d.bYuk.tip==='undefined', (d.bYuk||{}).tip);
  ok('OYUN B: crisisActive false', d.bYuk && d.bYuk.aktif===false);
  ok('OYUN B: kriz devleti yok', d.bYuk && d.bYuk.krizSide===0,
     String((d.bYuk||{}).krizSide));
}

/* ═══ H. SENARYO 7 — YENİ OYUN ═══ */
console.log('\nH. SENARYO 7 — YENİ OYUN (setupGame)');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var eskiId=G.crisisId, eskiAd=G.emps[eskiId].name;",
    "var eskiKriz=JSON.stringify(G.crisis);",
    "/* AYNI SAYFADA yeni oyun */",
    "setupGame({name:'Y',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'erken',council:'kapali'});",
    "var sonra={id:G.crisisId, tip:typeof G.crisisId,",
    "  krizStage:G.crisis&&G.crisis.stage,",
    "  krizSide:G.emps.filter(function(x){return x.crisisSide;}).length,",
    "  empSayi:G.emps.length};",
    "/* eski kimliğe denk gelen devletin ÖNCEKİ hâli */",
    "var kurban=G.emps[eskiId];",
    "var kurbanOnce=kurban?{ad:kurban.name, col:kurban.col,",
    "  etik:JSON.stringify(kurban.ethics), side:!!kurban.crisisSide,",
    "  savas:JSON.stringify(kurban.war)}:null;",
    "/* ensureCrisisEmpire GERÇEK yeni kriz devleti kursun */",
    "var c=ensureCrisisEmpire();",
    "var kurbanSonra=kurban?{ad:kurban.name, col:kurban.col,",
    "  etik:JSON.stringify(kurban.ethics), side:!!kurban.crisisSide,",
    "  savas:JSON.stringify(kurban.war)}:null;",
    "return JSON.stringify({eskiId:eskiId, eskiAd:eskiAd,",
    "  eskiKriz:eskiKriz.slice(0,40), sonra:sonra,",
    "  yeniId:c.id, yeniAd:c.name, yeniSide:!!c.crisisSide, yeniWild:!!c.wild,",
    "  yeniDevletMi:(c.id===sonra.empSayi),",
    "  kurbanOnce:kurbanOnce, kurbanSonra:kurbanSonra,",
    "  kurbanBozulmadi:JSON.stringify(kurbanOnce)===JSON.stringify(kurbanSonra)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yeni oyunda eski crisisId SİLİNDİ',
     d.sonra && d.sonra.tip==='undefined', (d.sonra||{}).tip);
  ok('yeni oyunda kriz devleti henüz yok',
     d.sonra && d.sonra.krizSide===0, String((d.sonra||{}).krizSide));
  ok('yeni oyunda bekleyen kriz kuruldu (stage 0)',
     d.sonra && d.sonra.krizStage===0);
  ok('ensureCrisisEmpire GERÇEK yeni devlet oluşturdu',
     d.yeniSide===true && d.yeniWild===true && d.yeniDevletMi===true,
     d.yeniAd+' #'+d.yeniId);
  ok('mevcut hiçbir devletin adı/rengi/etiği/savaşı kriz devletine dönmedi',
     d.kurbanOnce===null || d.kurbanBozulmadi===true);
}

/* ═══ I. SENARYO 8 — BOZUK ID ═══ */
console.log('\nI. SENARYO 8 — BOZUK crisisId');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var gercekId=G.crisisId;",
    "var k=serialize(); var v=JSON.parse(k);",
    "/* (a) crisisId NORMAL bir devleti gösteriyor */",
    "var normalId=G.emps.filter(function(x){return !x.wild&&!x.dead&&",
    "  !x.crisisSide;})[1].id;",
    "var bozuk=JSON.parse(k); bozuk.threats.crisisId=normalId;",
    "deserialize(JSON.stringify(bozuk));",
    "var a={id:G.crisisId, side:G.emps[G.crisisId]?",
    "  G.emps[G.crisisId].crisisSide:null,",
    "  normalBozuldu:!!G.emps[normalId].crisisSide,",
    "  rapor:(G._loadCrisisInfo||{}).repair};",
    "/* (b) crisisId aralık dışı */",
    "var bozuk2=JSON.parse(k); bozuk2.threats.crisisId=999;",
    "deserialize(JSON.stringify(bozuk2));",
    "var b={id:G.crisisId, side:G.emps[G.crisisId]?",
    "  G.emps[G.crisisId].crisisSide:null,",
    "  rapor:(G._loadCrisisInfo||{}).repair};",
    "/* (c) crisisSide adayı HİÇ YOK + bozuk id */",
    "var bozuk3=JSON.parse(k);",
    "bozuk3.emps.forEach(function(x){ delete x.crisisSide; });",
    "bozuk3.threats.crisisId=normalId;",
    "deserialize(JSON.stringify(bozuk3));",
    "var c={id:G.crisisId, tip:typeof G.crisisId,",
    "  normalBozuldu:!!G.emps[normalId].crisisSide,",
    "  aktif:crisisActive(), over:G.crisis&&G.crisis.over,",
    "  rapor:(G._loadCrisisInfo||{}).repair,",
    "  not:(G._loadCrisisInfo||{}).note};",
    "return JSON.stringify({gercekId:gercekId, normalId:normalId,",
    "  a:a, b:b, c:c});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const a=d.a||{}, b=d.b||{}, c=d.c||{};
  ok('normal devleti gösteren crisisId KABUL EDİLMEDİ',
     a.id===d.gercekId, 'id '+d.normalId+' → '+a.id);
  ok('gerçek crisisSide adayından deterministik onarım yapıldı',
     a.side===true && typeof a.rapor==='string', a.rapor);
  ok('normal devlet kriz tarafına DÖNÜŞTÜRÜLMEDİ',
     a.normalBozuldu===false);
  ok('aralık dışı crisisId de onarıldı', b.id===d.gercekId && b.side===true,
     b.rapor);
  ok('aday YOKKEN normal devlet ELE GEÇİRİLMEDİ',
     c.normalBozuldu===false && c.tip==='undefined',
     'crisisId '+c.tip);
  ok('taraf bulunamayan aktif kriz güvenle devre dışı bırakıldı',
     c.aktif===false && c.over===true, c.not);
}

/* ═══ J. SENARYO 9 — V4 GÖÇÜ ═══ */
console.log('\nJ. SENARYO 9 — V4 GÖÇÜ');
/* (1) Kriz tarafı olmayan bekleyen kayıt */
{
  const H=harness(); H.R(KUR('normal',99));
  const r=H.R([
    "G.day=930;",
    "var v5=JSON.parse(serialize()); delete v5.threats; v5.v=4;",
    "var v4=JSON.stringify(v5);",
    "/* oturumu zehirle */",
    "G.crisis={stage:9,over:true}; G.crisisId=2;",
    "var rngOnce=RND_STATE, hata='';",
    "var sonuclar=[], rngler=[];",
    "for(var i=0;i<3;i++){",
    "  try{ deserialize(v4); }catch(ex){ hata=ex.message; }",
    "  sonuclar.push(JSON.stringify(G.crisis)); rngler.push(RND_STATE); }",
    "return JSON.stringify({hata:hata, crisis:JSON.parse(sonuclar[0]),",
    "  id:G.crisisId, tip:typeof G.crisisId, aktif:crisisActive(),",
    "  determinist:sonuclar[0]===sonuclar[1]&&sonuclar[1]===sonuclar[2],",
    "  rngSabit:rngler.every(function(x){return x===rngler[0];}),",
    "  rngOnce:rngOnce, rngSonra:rngler[0],",
    "  bilgi:JSON.stringify(G._loadCrisisInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const c=d.crisis||{};
  ok('v4 (kriz tarafı yok) HATA ATMADAN açıldı', d.hata==='', d.hata||'ok');
  ok('bekleyen zamanlayıcı kuruldu (stage=0)', c.stage===0, String(c.stage));
  ok('atMonth CRISIS_WINDOW normal aralığında [150,200]',
     c.atMonth>=150 && c.atMonth<=200, String(c.atMonth));
  ok('age kayıt gününden türetildi (930/30=31)', c.age===31, String(c.age));
  ok('zehirli crisisId temizlendi (undefined)', d.tip==='undefined', d.tip);
  ok('yükleme krizi başlatmadı', d.aktif===false);
  ok('göç DETERMİNİSTİK (3 tekrar aynı)', d.determinist===true);
  ok('göç RNG TÜKETMEDİ', d.rngSabit===true && d.rngOnce===d.rngSonra,
     d.rngOnce+' → '+d.rngSonra);
  ok('göç dürüstçe raporlandı (özgün tarih kurtarılamaz)',
     /KURTARILAMAZ/.test(d.bilgi||''), (d.bilgi||'').slice(0,90));
}
/* (2) Aktif crisisSide + kriz filosu bulunan v4 kayıt */
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var gercekId=G.crisisId;",
    "var filoOnce=G.fleets.filter(function(f){return f.e===gercekId;}).length;",
    "var v5=JSON.parse(serialize()); delete v5.threats; v5.v=4;",
    "var v4=JSON.stringify(v5);",
    "G.crisis=null; delete G.crisisId;",
    "var s=[], rr=[];",
    "for(var i=0;i<3;i++){ deserialize(v4);",
    "  s.push(JSON.stringify(G.crisis)); rr.push(RND_STATE); }",
    "return JSON.stringify({crisis:JSON.parse(s[0]), id:G.crisisId,",
    "  side:G.emps[G.crisisId]?G.emps[G.crisisId].crisisSide:null,",
    "  gercekId:gercekId, filoOnce:filoOnce,",
    "  filoSonra:G.fleets.filter(function(f){return f.e===G.crisisId;}).length,",
    "  aktif:crisisActive(),",
    "  determinist:s[0]===s[1]&&s[1]===s[2],",
    "  rngSabit:rr.every(function(x){return x===rr[0];}),",
    "  bilgi:JSON.stringify(G._loadCrisisInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const c=d.crisis||{};
  ok('v4 aktif kriz: crisisId GERÇEK crisisSide devletine bağlandı',
     d.id===d.gercekId && d.side===true, 'id='+d.id);
  ok('kriz filoları ÖKSÜZ kalmadı',
     d.filoSonra===d.filoOnce && d.filoSonra>0,
     d.filoOnce+' → '+d.filoSonra);
  ok('kriz aktif olarak sürdürüldü', d.aktif===true && c.stage===1,
     'stage='+c.stage);
  ok('kurtarılamayan alanlara dürüst varsayılan verildi',
     c.timer===0 && c.kills===0 && JSON.stringify(c.contrib)==='{}');
  ok('göç DETERMİNİSTİK ve RNG sabit',
     d.determinist===true && d.rngSabit===true);
  ok('kurtarılamayan bilgi açıkça raporlandı',
     /KURTARILAMADI/.test(d.bilgi||''), (d.bilgi||'').slice(0,90));
}
/* (3) crisisSide var, kriz filosu YOK */
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "var gercekId=G.crisisId;",
    "G.fleets=G.fleets.filter(function(f){return f.e!==gercekId;});",
    "var filoToplam=G.fleets.length;",
    "var v5=JSON.parse(serialize()); delete v5.threats; v5.v=4;",
    "var v4=JSON.stringify(v5);",
    "G.crisis=null; delete G.crisisId;",
    "var s=[];",
    "for(var i=0;i<3;i++){ deserialize(v4); s.push(JSON.stringify(G.crisis)); }",
    "/* yükleme sonrası tikler krizi diriltmemeli */",
    "crisisTick(); crisisTick();",
    "return JSON.stringify({crisis:JSON.parse(s[0]), id:G.crisisId,",
    "  side:G.emps[G.crisisId]?G.emps[G.crisisId].crisisSide:null,",
    "  aktif:crisisActive(),",
    "  krizFilo:G.fleets.filter(function(f){return f.e===G.crisisId;}).length,",
    "  filoToplam:filoToplam, filoSonra:G.fleets.length,",
    "  determinist:s[0]===s[1]&&s[1]===s[2],",
    "  bilgi:JSON.stringify(G._loadCrisisInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const c=d.crisis||{};
  ok('crisisSide var + filo yok → ÇÖZÜLMÜŞ kabul edildi',
     c.over===true, 'over='+c.over);
  ok('kriz YENİDEN BAŞLATILMADI (galaksi 2. kez cezalandırılmadı)',
     d.aktif===false && d.krizFilo===0, 'kriz filo='+d.krizFilo);
  ok('yükleme sonrası tikler yeni dalga doğurmadı',
     d.filoSonra===d.filoToplam, d.filoToplam+' → '+d.filoSonra);
  ok('crisisId yine de gerçek devlete bağlı (öksüz değil)',
     d.side===true, 'id='+d.id);
  ok('göç DETERMİNİSTİK', d.determinist===true);
  ok('çözülmüş varsayımı açıkça raporlandı',
     /çözülmüş kabul edildi/.test(d.bilgi||''), (d.bilgi||'').slice(0,90));
}

/* ═══ K. SENARYO 10 — 85A / 85B REGRESYONU ═══ */
console.log('\nK. SENARYO 10 — 85A / 85B REGRESYONU');
{
  const H=harness(); H.R(KUR('erken',99));
  const r=H.R([AKTIFLE,
    "/* 85A politik dünya */",
    "G.memAge=137; G.cncAge=64;",
    "G.council={name:'Konsey',founder:0,members:[0,1],laws:{ticaretStd:true},",
    "  targeted:{parya:2},treasury:412,president:0,termStart:G.day,terms:{},",
    "  voteIn:9,vote:{key:'ambargo',target:3,yes:[0],no:[],done:false},dead:false};",
    "G.feds=[{id:7,name:'Kuzey',members:[0,1],laws:{},treasury:250,",
    "  nextVote:G.day+40,vote:null,founder:0}];",
    "G.fedUid=7; G.sandbox=true;",
    "G.rebelAlliance={target:3,members:[0],since:120,revealed:true};",
    "/* 85B: kalkan idempotansı */",
    "var sy=G.sys.filter(function(s){return s.owner===G.p.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "pl.col.shield=4;",
    "var k=serialize(); var kalkanlar=[4];",
    "for(var i=0;i<6;i++){ deserialize(k);",
    "  kalkanlar.push(G.sys[sy.id].planets[pl.i].col.shield); }",
    "var oncAy=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(true);",
    "var initSonra=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(false);",
    "var aySonra=G.sys[sy.id].planets[pl.i].col.shield;",
    "return JSON.stringify({kalkanlar:kalkanlar,",
    "  kalkanSabit:kalkanlar.every(function(x){return x===4;}),",
    "  initSonra:initSonra, oncAy:oncAy, aySonra:aySonra,",
    "  memAge:G.memAge, cncAge:G.cncAge,",
    "  konsey:G.council&&G.council.name, hazine:G.council&&G.council.treasury,",
    "  fedUid:G.fedUid, sandbox:G.sandbox,",
    "  rebel:G.rebelAlliance&&G.rebelAlliance.target,",
    "  krizAktif:crisisActive(), krizStage:G.crisis&&G.crisis.stage});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('85B: 6 yüklemede kalkan TAM 4 kaldı', d.kalkanSabit===true,
     (d.kalkanlar||[]).join('→'));
  ok('85B: economyTick(true) hiçbir aylık sistemi ilerletmedi',
     d.initSonra===d.oncAy, d.oncAy+' → '+d.initSonra);
  ok('85B: economyTick(false) hâlâ normal ilerliyor',
     d.aySonra>d.oncAy, d.oncAy+' → '+d.aySonra);
  ok('85A: memAge/cncAge korundu', d.memAge===137 && d.cncAge===64,
     d.memAge+'/'+d.cncAge);
  ok('85A: Konsey + hazine korundu',
     d.konsey==='Konsey' && d.hazine===412);
  ok('85A: fedUid / sandbox / rebelAlliance korundu',
     d.fedUid===7 && d.sandbox===true && d.rebel===3);
  ok('85C: kriz aynı yüklemelerde de korundu',
     d.krizAktif===true && d.krizStage===2);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
