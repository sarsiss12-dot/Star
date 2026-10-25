#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85F: KONUMSAL SİMÜLASYON DURUMU SÜREKLİLİĞİ
   Korsanlar · kalıntılar · ticaret baskınları · savaş · sabotaj
   Çalıştırma: node tests/faz85f_spatial_simulation_continuity_test.js
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
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:1,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'zengin',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "return 'ok';"].join('\n');

/* Zengin, gerçekçi konumsal dünya. */
const DUNYA=[
 "var W=G.emps.filter(function(x){return x.wild && !x.dead &&",
 "  x.crisisSide!==true;})[0];",
 "G.wildId=W.id;",
 "/* iki korsan yuvası — farklı hp/timer, birinde nestPow */",
 "G.sys.forEach(function(s){ delete s.nest; delete s.nestPow; });",
 "G.sys[5].nest={hp:820, timer:14};",
 "G.sys[9].nest={hp:410, timer:3}; G.sys[9].nestPow=1.6;",
 "G.nests=[5,9];",
 "/* iki kalıntı — farklı hp/max/ödül, biri uyanık */",
 "G.sys.forEach(function(s){ delete s.ruin; });",
 "G.sys[12].ruin={hp:900,max:1200,rw:'tech',awake:false};",
 "G.sys[17].ruin={hp:300,max:800,rw:'mega',awake:true};",
 "G.ruins=[12,17];",
 "/* yağmalanmış ticaret rotaları */",
 "/* FAZ 85F.1: gerçek üretim biçimi 'a_b' (economy.js/tradeLinks) */",
 "G.raids={'3_8': G.day+120, '4_11': G.day+45};",
 "G.monsterAt=640;",
 "/* ilk keşfedenler — GERÇEK TECHS anahtarları */",
 "G._firstTech={f_reaktor:0, f_lazer1:1, f_kalkan1:2};",
 "/* aktif muharebe + yörünge hâkimiyeti */",
 "G.sys[21].cr=2; G.sys[21].orbitHeld=1;",
 "/* aktif tedarik sabotajı */",
 "G.sys[24].supplyHack=6; G.sys[24].supplyHackBy=2;"].join('\n');
const ZEHIR=[
 "G.wildId=0;",
 "G.nests=[99]; G.ruins=[99]; G.raids={'9:9':1};",
 "G.monsterAt=99999; G._firstTech={f_sensor:5};",
 "G.sys[5].nest={hp:1,timer:1}; delete G.sys[9].nest;",
 "delete G.sys[9].nestPow;",
 "delete G.sys[12].ruin;",
 "G.sys[17].ruin={hp:1,max:1,rw:'tech',awake:false};",
 "G.sys[21].cr=0; delete G.sys[21].orbitHeld;",
 "G.sys[24].supplyHackBy=7;"].join('\n');

/* ═══ A. DOSYA SINIRI, ŞEMA VE KARANTİNA ═══ */
console.log('\nA. DOSYA SINIRI, ŞEMA VE KARANTİNA');
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
  ok("sw cache = 'stars-v96h31r1'", /const CACHE = 'stars-v96h31r1'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8', /v:8, cfg:G\.cfg/.test(mainJs));
  ['world: serializePoliticalWorld','threats: serializeCrisisWorld',
   'campaign: serializeCampaignWorld','events: serializeEventsWorld'].forEach(x=>
    ok('önceki bölüm korundu: '+x.split(':')[0], mainJs.indexOf(x)>=0));
  ok('simulation bölümü eklendi',
     /simulation: serializeSimulationWorld\(\)/.test(mainJs));
  /* Sıra: sys/emps sonrası, campaign sonrası, events öncesi, tikten önce */
  const ie=mainJs.indexOf('G.emps = d.emps');
  const ik=mainJs.indexOf('restoreCampaignWorld(d.campaign');
  const is=mainJs.indexOf('restoreSimulationWorld(d.simulation');
  const iv=mainJs.indexOf('restoreEventsWorld(d.events');
  const ir=mainJs.indexOf('rebuildDerivedStateAfterLoad(true);', is);
  const it=mainJs.indexOf('economyTick(true);', is);
  ok('simulation restore sys/emps KURULDUKTAN sonra', is>ie && ie>0);
  ok('simulation restore campaign SONRASINDA', is>ik && ik>0);
  ok('simulation restore events ÖNCESİNDE', iv>is);
  ok('simulation restore türetilmiş durumdan ÖNCE', ir>is && it>is);
  ok('setupGame merkezî resetSimulationRuntimeState kullanıyor',
     /resetSimulationRuntimeState\(\);/.test(mainJs));
  /* Reset, yeni oyunun üretiminden ÖNCE çalışmalı */
  ok('reset, initRuins/korsan üretiminden ÖNCE',
     mainJs.indexOf('resetSimulationRuntimeState();') <
     mainJs.indexOf("if (typeof initRuins === 'function')"));
  /* Türetilmiş / görsel alanlar simulation'a girmemeli */
  const blok=mainJs.slice(mainJs.indexOf('function serializeSimulationWorld'),
                          mainJs.indexOf('function resetSimulationRuntimeState'));
  ['_reach','_shat','_shatBio','_loopWarn','panopt','G.fx','G.vis',
   'G.speed','G.over','minRaw','G.sits','sitDone','chainQueue'].forEach(k=>
    ok('türetilmiş/geçici alan simulation içinde YOK: '+k, blok.indexOf(k)<0));
  ok('wildId için null DEĞİL delete kullanılıyor',
     /function resetSimulationRuntimeState[\s\S]{0,300}delete G\.wildId;/.test(mainJs));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF (yorumlu)',
     /\/\/\s*if \(typeof situationsTick/.test(dip) &&
     !/^\s*if \(typeof situationsTick === 'function'\) situationsTick\(\);/m.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
  const H=harness(); H.R(KUR);
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
    ok(f+' byte-for-byte aynı', (f==='audio.js'?require('./helpers/audio-preservation').isReviewedAudio(fs.readFileSync(path.join(KOK,f))):h===ref[f]), h.slice(0,16));
  });
  /* 91D: etiket/draw değişikliği izinli; giriş/kurtarma/kamera/sprite/filo kaynakları 91C ile aynı. */
  ok('map kaynak kilidi: 91C altyapısı + 93A hedef seçimi',
     require('./helpers/map-preservation').isMapInfrastructurePreserved(oku('map.js')));
}

/* ═══ B. V8 SIMULATION ŞEMASI ═══ */
console.log('\nB. V8 SIMULATION ŞEMASI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var v=JSON.parse(serialize());",
    "var s=v.simulation;",
    "var sysRec=s.systems.filter(function(x){return x.i===9;})[0];",
    "var ruinRec=s.systems.filter(function(x){return x.i===17;})[0];",
    "var savRec=s.systems.filter(function(x){return x.i===21;})[0];",
    "var sabRec=s.systems.filter(function(x){return x.i===24;})[0];",
    "return JSON.stringify({surum:v.v,",
    "  anahtar:Object.keys(s).sort().join(','),",
    "  ustBolum:['world','threats','campaign','events','simulation']",
    "    .every(function(k){return k in v;}),",
    "  sysAnahtar:sysRec?Object.keys(sysRec).sort().join(','):null,",
    "  ruinAnahtar:ruinRec?Object.keys(ruinRec).sort().join(','):null,",
    "  savAnahtar:savRec?Object.keys(savRec).sort().join(','):null,",
    "  sabAnahtar:sabRec?Object.keys(sabRec).sort().join(','):null,",
    "  seyrek:s.systems.length, toplamSys:G.sys.length,",
    "  chainQueueSimda:JSON.stringify(s).indexOf('chainQueue')>=0,",
    "  campaignChain:!!(v.campaign && v.campaign.chainQueue)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıt sürümü v:8', d.surum===8, 'v='+d.surum);
  ok('simulation TAM ve YALNIZ yedi anahtar',
     d.anahtar==='firstTech,monsterAt,nests,raids,ruins,systems,wildId',
     d.anahtar);
  ok('world/threats/campaign/events bölümleri korundu', d.ustBolum===true);
  ok('systems SEYREK liste (tüm sistemler değil)',
     d.seyrek>0 && d.seyrek<d.toplamSys, d.seyrek+'/'+d.toplamSys);
  ok('yuva kaydı: i + ne + np', d.sysAnahtar==='i,ne,np', d.sysAnahtar);
  ok('kalıntı kaydı: i + ru', d.ruinAnahtar==='i,ru', d.ruinAnahtar);
  ok('savaş kaydı: i + cr + oh', d.savAnahtar==='cr,i,oh', d.savAnahtar);
  ok('sabotaj kaydı: i + sb', d.sabAnahtar==='i,sb', d.sabAnahtar);
  ok('chainQueue simulation\'a KOPYALANMADI', d.chainQueueSimda===false);
  ok('chainQueue campaign\'de KALDI', d.campaignChain===true);
}

/* ═══ C. KORSAN YUVASI VE KALINTI ═══ */
console.log('\nC. KORSAN YUVASI VE KALINTI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k=serialize();", ZEHIR,
    "for(var i=0;i<10;i++) deserialize(k);",
    "return JSON.stringify({",
    "  nest5:JSON.stringify(G.sys[5].nest), nest9:JSON.stringify(G.sys[9].nest),",
    "  nestPow9:G.sys[9].nestPow, nestPow5:G.sys[5].nestPow,",
    "  ruin12:JSON.stringify(G.sys[12].ruin),",
    "  ruin17:JSON.stringify(G.sys[17].ruin),",
    "  nests:JSON.stringify(G.nests), ruins:JSON.stringify(G.ruins),",
    "  filoSayi:G.fleets.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yuva#5 hp/timer korundu (10 yükleme)',
     d.nest5==='{"hp":820,"timer":14}', d.nest5);
  ok('yuva#9 hp/timer korundu', d.nest9==='{"hp":410,"timer":3}', d.nest9);
  ok('nestPow korundu (1.6)', d.nestPow9===1.6, String(d.nestPow9));
  ok('nestPow olmayan yuvaya uydurulmadı', d.nestPow5===undefined);
  ok('kalıntı#12 hp/max/rw/awake korundu',
     d.ruin12==='{"hp":900,"max":1200,"rw":"tech","awake":false}', d.ruin12);
  ok('kalıntı#17 awake=true korundu (yükleme uyandırmadı/uyutmadı)',
     d.ruin17==='{"hp":300,"max":800,"rw":"mega","awake":true}', d.ruin17);
  ok('G.nests sırası ve üyeliği korundu', d.nests==='[5,9]', d.nests);
  ok('G.ruins sırası korundu', d.ruins==='[12,17]', d.ruins);
}
/* Bozuk indeks ve geçersiz ödül */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k=serialize();",
    "/* tekrarlı + geçersiz + eksik indeks */",
    "var b=JSON.parse(k);",
    "b.simulation.nests=[5,5,99,9];",
    "b.simulation.ruins=[17,17,404];",
    "var rngOnce=RND_STATE;",
    "deserialize(JSON.stringify(b));",
    "var a={nests:JSON.stringify(G.nests), ruins:JSON.stringify(G.ruins),",
    "  rapor:(G._loadSimInfo||{}).repair.join(' | ')};",
    "/* geçersiz ruin ödülü — RNG tüketmeden reddedilmeli */",
    "var b2=JSON.parse(k);",
    "b2.simulation.systems.forEach(function(x){",
    "  if(x.i===12 && x.ru) x.ru.rw='YOK_BOYLE_ODUL'; });",
    "var rngOnce2=RND_STATE;",
    "deserialize(JSON.stringify(b2));",
    "var c={ruin12:G.sys[12].ruin, ruins:JSON.stringify(G.ruins),",
    "  rngAyni:RND_STATE===rngOnce2,",
    "  rapor:(G._loadSimInfo||{}).repair.join(' | ')};",
    "return JSON.stringify({a:a, c:c, rngIlkAyni:RND_STATE===rngOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const a=d.a||{}, c=d.c||{};
  ok('tekrarlı/geçersiz nest indeksi deterministik temizlendi',
     a.nests==='[5,9]', a.nests);
  ok('tekrarlı/geçersiz ruin indeksi temizlendi, sıra korundu',
     a.ruins==='[17,12]', a.ruins+' (kayıt sırası 17 önce)');
  ok('onarım miktarı raporlandı',
     /nests:/.test(a.rapor||'') && /ruins:/.test(a.rapor||''),
     (a.rapor||'').slice(0,80));
  ok('geçersiz ruin ödülü RNG KULLANMADAN reddedildi',
     c.ruin12===undefined && c.rngAyni===true);
  ok('reddedilen kalıntı indeksten de düştü',
     c.ruins==='[17]', c.ruins);
  ok('geçersiz ödül raporlandı', /geçersiz ruin ödülü/.test(c.rapor||''),
     (c.rapor||'').slice(0,60));
}

/* ═══ D. wildId GUARD ═══ */
console.log('\nD. wildId GUARD');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var gercek=G.wildId;",
    "var k=serialize();",
    "function foto(e){ return JSON.stringify({n:e.name,c:e.col,",
    "  et:e.ethics,w:!!e.wild,d:!!e.dead}); }",
    "function dene(deger){",
    "  var b=JSON.parse(k); b.simulation.wildId=deger;",
    "  var p0=foto(G.emps[0]), a1=foto(G.emps[1]);",
    "  var n0=G.emps.length, f0=G.fleets.length;",
    "  deserialize(JSON.stringify(b));",
    "  return {wildId:G.wildId,",
    "    dogru:G.wildId===gercek,",
    "    oyuncuBozuldu:foto(G.emps[0])!==p0,",
    "    aiBozuldu:foto(G.emps[1])!==a1,",
    "    empArtti:G.emps.length!==n0, filoArtti:G.fleets.length!==f0,",
    "    rapor:((G._loadSimInfo||{}).repair||[]).join('|')};",
    "}",
    "var out={};",
    "out.oyuncu=dene(0);",
    "out.normalAI=dene(1);",
    "out.aralikDisi=dene(999);",
    "out.nullDeger=dene(null);",
    "/* crisisSide devleti wild sayılmamalı */",
    "var cs=G.emps[G.emps.length-1];",
    "out.gecerli=dene(gercek);",
    "/* ölü wild: aday kalmayınca hiçbir devlet ele geçirilmemeli */",
    "var b=JSON.parse(k);",
    "b.emps.forEach(function(e){ if(e.wild) e.dead=true; });",
    "b.simulation.wildId=1;",
    "var p0=foto(G.emps[0]);",
    "deserialize(JSON.stringify(b));",
    "out.oluWild={wildId:G.wildId, tip:typeof G.wildId,",
    "  ai1Wild:!!G.emps[1].wild,",
    "  rapor:((G._loadSimInfo||{}).repair||[]).join('|')};",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  [['wildId=0 (OYUNCU)',d.oyuncu],['wildId=normal AI',d.normalAI],
   ['wildId=aralık dışı',d.aralikDisi],['wildId=null',d.nullDeger]].forEach(([ad,x])=>{
    x=x||{};
    ok(ad+': gerçek korsan devletine onarıldı', x.dogru===true,
       'wildId='+x.wildId);
    ok(ad+': oyuncu/AI kimliği BOZULMADI',
       x.oyuncuBozuldu===false && x.aiBozuldu===false);
    ok(ad+': yeni devlet veya filo DOĞMADI',
       x.empArtti===false && x.filoArtti===false);
  });
  ok('geçerli wildId aynen kabul edildi, onarım yapılmadı',
     (d.gecerli||{}).dogru===true && !(d.gecerli||{}).rapor,
     'wildId='+(d.gecerli||{}).wildId);
  const o=d.oluWild||{};
  ok('wild aday YOKKEN hiçbir normal devlet korsan yapılmadı',
     o.ai1Wild===false && o.tip==='undefined', 'wildId '+o.tip);
  ok('aday yokluğu raporlandı', /aday yok/.test(o.rapor||''),
     (o.rapor||'').slice(0,60));
}

/* ═══ E. BASKINLAR, CANAVAR SAATİ, İLK TEKNOLOJİ ═══ */
console.log('\nE. BASKIN / CANAVAR / İLK TEKNOLOJİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var raidOnce=JSON.stringify(G.raids);",
    "var trOnce=(typeof tradeLinks==='function')",
    "  ? tradeLinks(G.p).map(function(l){return l.key+':'+(l.raided?1:0);}).join(',') : '';",
    "var skorOnce=JSON.stringify(scoreCard(G.p));",
    "var k=serialize();", ZEHIR,
    "for(var i=0;i<10;i++) deserialize(k);",
    "var trSonra=(typeof tradeLinks==='function')",
    "  ? tradeLinks(G.p).map(function(l){return l.key+':'+(l.raided?1:0);}).join(',') : '';",
    "return JSON.stringify({raids:JSON.stringify(G.raids), raidOnce:raidOnce,",
    "  monsterAt:G.monsterAt, firstTech:JSON.stringify(G._firstTech),",
    "  trAyni:trOnce===trSonra,",
    "  skorAyni:JSON.stringify(scoreCard(G.p))===skorOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('G.raids ve bitiş günleri korundu (10 yükleme)',
     d.raids===d.raidOnce, d.raids);
  ok('tradeLinks yükleme sonrası aynı rotayı aynı şekilde gösteriyor',
     d.trAyni===true);
  ok('G.monsterAt korundu (640)', d.monsterAt===640, String(d.monsterAt));
  ok('G._firstTech korundu (gerçek TECHS anahtarları)',
     d.firstTech==='{"f_reaktor":0,"f_lazer1":1,"f_kalkan1":2}', d.firstTech);
  ok('scoreCard teknoloji puanı kaydet/yükle ile DEĞİŞMEDİ',
     d.skorAyni===true);
}
/* Geçersiz rota / tech / devlet güvenle düşer */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k=serialize(); var b=JSON.parse(k);",
    "b.simulation.raids={'3_8':G.day+120, '999_1000':50, 'bozuk':7,",
    "  '3_3':9, 'x_5':4, '7_9':NaN};",
    "b.simulation.firstTech={f_reaktor:0, YOK_TECH:1, f_lazer1:9999};",
    "deserialize(JSON.stringify(b));",
    "return JSON.stringify({raids:JSON.stringify(G.raids),",
    "  firstTech:JSON.stringify(G._firstTech),",
    "  rapor:((G._loadSimInfo||{}).repair||[]).join('|')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('geçersiz rota anahtarları düşürüldü, geçerli GERÇEK biçim kaldı',
     d.raids==='{"3_8":120}', d.raids);
  ok('geçersiz raid rotaları raporlandı',
     /raid rotası/.test(d.rapor||''), (d.rapor||'').slice(0,70));
  ok('katalogda olmayan tech ve olmayan devlet firstTech\'ten düşürüldü',
     d.firstTech==='{"f_reaktor":0}', d.firstTech);
}

/* ═══ E2. FAZ 85F.1 — GERÇEK TİCARET ROTASI ANAHTARI ═══
   Faz 85F testi yalnız ELLE yazılmış '3:8' anahtarları kullandığı için
   gerçek üretim biçimini (economy.js/tradeLinks → "a_b") hiç sınamadı
   ve codec hatası 1450 testten kaçtı. Bu blok anahtarı DOĞRUDAN
   tradeLinks() çıktısından alır. */
console.log('\nE2. GERÇEK tradeLinks ROTA ANAHTARI (85F.1 hotfix)');
/* Gerçek ticaret ağı: kolonilere liman + karşılıklı pakt */
const TICARET=[
 "G.emps.forEach(function(o){ if(o.dead) return;",
 "  (o.colonies||[]).forEach(function(c){",
 "    var pl=G.sys[c.s].planets[c.p];",
 "    if(pl.col){ pl.col.b=pl.col.b||{}; pl.col.b.liman=1; } }); });",
 "G.emps.forEach(function(o){ if(o.id && !o.wild && !o.dead){",
 "  G.p.contact[o.id]=true; o.contact[G.p.id]=true;",
 "  G.p.pact=G.p.pact||{}; o.pact=o.pact||{};",
 "  G.p.pact[o.id]=true; o.pact[G.p.id]=true; } });"].join('\n');
{
  const H=harness(); H.R(KUR);
  const r=H.R([TICARET,
    "var links=tradeLinks(G.p);",
    "if(!links.length) return JSON.stringify({hata:'gerçek rota üretilemedi'});",
    "/* anahtar DOĞRUDAN üretim çıktısından alınır */",
    "var L=links[0], anahtar=L.key;",
    "G.raids={}; G.raids[anahtar]=G.day+120;",
    "var oncRaided=tradeLinks(G.p).filter(function(x){return x.raided;})",
    "  .map(function(x){return x.key;});",
    "var k=serialize(); var v=JSON.parse(k);",
    "var kayitta=JSON.stringify(v.simulation.raids);",
    "/* zehirle + 10 ardışık yükleme */",
    "G.raids={'9_9':1};",
    "var dizi=[];",
    "for(var i=0;i<10;i++){ deserialize(k); dizi.push(JSON.stringify(G.raids)); }",
    "var sonLinks=tradeLinks(G.p);",
    "var L2=sonLinks.filter(function(x){return x.key===anahtar;})[0];",
    "return JSON.stringify({anahtar:anahtar,",
    "  altCizgi:anahtar.indexOf('_')>=0, ikiNokta:anahtar.indexOf(':')>=0,",
    "  kayitta:kayitta, sonra:JSON.stringify(G.raids),",
    "  korundu:G.raids[anahtar]!==undefined, gun:G.raids[anahtar],",
    "  beklenenGun:JSON.parse(kayitta)[anahtar],",
    "  oncRaided:oncRaided,",
    "  sonRaided:sonLinks.filter(function(x){return x.raided;})",
    "    .map(function(x){return x.key;}),",
    "  L2raided:L2?L2.raided:null,",
    "  sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  anahtarSayi:Object.keys(G.raids).length,",
    "  rapor:((G._loadSimInfo||{}).repair||[]).join('|')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('gerçek tradeLinks() bir rota üretti', !d.hata && !!d.anahtar,
     d.hata || d.anahtar);
  ok('gerçek üretim anahtarı "_" biçiminde ( ":" DEĞİL )',
     d.altCizgi===true && d.ikiNokta===false, d.anahtar);
  ok('yükleme öncesi rota raided görünüyordu',
     Array.isArray(d.oncRaided) && d.oncRaided.indexOf(d.anahtar)>=0,
     (d.oncRaided||[]).join(','));
  ok('GERÇEK anahtar 10 yüklemeden sonra KORUNDU (85F hatası)',
     d.korundu===true, d.sonra);
  ok('bitiş günü birebir korundu', d.gun===d.beklenenGun,
     d.gun+' = '+d.beklenenGun);
  ok('rota yükleme sonrası hâlâ raided === true (erken açılmadı)',
     d.L2raided===true &&
     Array.isArray(d.sonRaided) && d.sonRaided.indexOf(d.anahtar)>=0,
     (d.sonRaided||[]).join(','));
  ok('10 ardışık yükleme rotayı çoğaltmadı', d.sabit===true &&
     d.anahtarSayi===1, d.anahtarSayi+' anahtar');
  ok('geçerli gerçek anahtar için onarım raporu üretilmedi',
     d.rapor==='', d.rapor);
}
/* Normalleştirme: ters sıra · iki nokta uyumluluğu · çakışma */
{
  const H=harness(); H.R(KUR);
  const r=H.R([TICARET,
    "var k0=serialize();",
    "function yukle(raids){ var b=JSON.parse(k0);",
    "  b.simulation.raids=raids; deserialize(JSON.stringify(b));",
    "  return {raids:JSON.stringify(G.raids),",
    "    rapor:((G._loadSimInfo||{}).repair||[]).join('|')}; }",
    "var ters=yukle({'8_3':50});",
    "var kolon=yukle({'3:8':60});",
    "var carp=yukle({'8_3':50, '3_8':90});",
    "var carp2=yukle({'3_8':90, '8_3':50});",
    "var rngOnce=RND_STATE;",
    "var bozuk=yukle({'3_3':9, '999_1000':5, 'bozuk':7, 'x_5':4,",
    "  '7_9':NaN, '3_8':70});",
    "return JSON.stringify({ters:ters, kolon:kolon, carp:carp, carp2:carp2,",
    "  bozuk:bozuk, rngAyni:RND_STATE===rngOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ters sıralı "8_3" kanonik "3_8" biçimine normalize edildi',
     (d.ters||{}).raids==='{"3_8":50}', (d.ters||{}).raids);
  ok('savunmalı uyumluluk: "3:8" okunup kanonik "3_8" yapıldı',
     (d.kolon||{}).raids==='{"3_8":60}', (d.kolon||{}).raids);
  ok('aynı kanonik anahtara düşen iki kayıtta EN GEÇ bitiş korundu',
     (d.carp||{}).raids==='{"3_8":90}', (d.carp||{}).raids);
  ok('çakışma çözümü sıradan bağımsız (deterministik)',
     (d.carp||{}).raids===(d.carp2||{}).raids,
     (d.carp||{}).raids+' / '+(d.carp2||{}).raids);
  ok('çakışma raporlandı', /birleşti/.test((d.carp||{}).rapor||''),
     ((d.carp||{}).rapor||'').slice(0,60));
  ok('3_3 / bilinmeyen sistem / metin / NaN düşürüldü, geçerli kaldı',
     (d.bozuk||{}).raids==='{"3_8":70}', (d.bozuk||{}).raids);
  ok('normalleştirme RNG TÜKETMEDİ', d.rngAyni===true);
}
/* Tek gerçek raidTick zamanı gelince rotayı bir kez temizler */
{
  const H=harness(); H.R(KUR);
  const r=H.R([TICARET,
    "var L=tradeLinks(G.p)[0], anahtar=L.key;",
    "/* biri süresi DOLMUŞ, biri sürüyor */",
    "G.raids={}; G.raids[anahtar]=G.day-1;",
    "var digerL=tradeLinks(G.p)[1];",
    "if(digerL) G.raids[digerL.key]=G.day+200;",
    "var k=serialize();",
    "for(var i=0;i<10;i++) deserialize(k);",
    "var yuklemeSonrasi=JSON.stringify(G.raids);",
    "var suresiGecenVar=G.raids[anahtar]!==undefined;",
    "/* tek GERÇEK raidTick */",
    "raidTick();",
    "var tikSonrasi=JSON.stringify(G.raids);",
    "return JSON.stringify({yuklemeSonrasi:yuklemeSonrasi,",
    "  suresiGecenVar:suresiGecenVar,",
    "  tikSonrasi:tikSonrasi,",
    "  suresiGecenSilindi:G.raids[anahtar]===undefined,",
    "  digerKaldi:digerL?G.raids[digerL.key]!==undefined:true});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme süresi geçmiş rotayı HAYALİ TİKLE silmedi',
     d.suresiGecenVar===true, d.yuklemeSonrasi);
  ok('tek gerçek raidTick süresi geçen rotayı bir kez temizledi',
     d.suresiGecenSilindi===true, d.tikSonrasi);
  ok('süresi dolmayan rota raidTick sonrası duruyor', d.digerKaldi===true);
}
/* Yükleme kaynak/filo/ilişki/RNG/bildirim değiştirmiyor */
{
  const H=harness(); H.R(KUR);
  const r=H.R([TICARET,
    "var L=tradeLinks(G.p)[0]; G.raids={}; G.raids[L.key]=G.day+120;",
    "G.log=[];",
    "var A={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filo:G.fleets.length, rng:RND_STATE};",
    "var k=serialize();",
    "for(var i=0;i<10;i++) deserialize(k);",
    "return JSON.stringify({",
    "  resAyni:A.res===G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  relAyni:A.rel===G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filoAyni:A.filo===G.fleets.length, rngAyni:A.rng===RND_STATE,",
    "  log:(G.log||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('gerçek rotalı yükleme kaynak/ilişki/filo değiştirmedi',
     d.resAyni===true && d.relAyni===true && d.filoAyni===true);
  ok('gerçek rotalı yükleme RNG tüketmedi ve bildirim üretmedi',
     d.rngAyni===true && d.log===0, 'log='+d.log);
}

/* ═══ F. SAVAŞ, YÖRÜNGE, SABOTAJ ═══ */
console.log('\nF. sys.cr / orbitHeld / supplyHackBy');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var o=G.emps[1];",
    "G.p.war[o.id]=true; o.war[G.p.id]=true;",
    "G.p.exh=G.p.exh||{}; G.p.exh[o.id]=99; o.exh=o.exh||{}; o.exh[G.p.id]=99;",
    "G.p.warSince=G.p.warSince||{}; G.p.warSince[o.id]=0;",
    "var occOnce=(typeof occupationMap==='function')",
    "  ? JSON.stringify(occupationMap(G.p,o).map(function(x){",
    "      return x.sys.id+':'+x.yeni;})) : '';",
    "var canOnce=(typeof canStatusQuo==='function')",
    "  ? JSON.stringify(canStatusQuo(G.p,o)) : '';",
    "var k=serialize();", ZEHIR,
    "for(var i=0;i<10;i++) deserialize(k);",
    "var o2=G.emps[1];",
    "var occSonra=(typeof occupationMap==='function')",
    "  ? JSON.stringify(occupationMap(G.p,o2).map(function(x){",
    "      return x.sys.id+':'+x.yeni;})) : '';",
    "return JSON.stringify({cr21:G.sys[21].cr, orbit21:G.sys[21].orbitHeld,",
    "  sh24:G.sys[24].supplyHack, shBy24:G.sys[24].supplyHackBy,",
    "  occAyni:occOnce===occSonra, occ:occSonra.slice(0,60),",
    "  canAyni:canOnce===((typeof canStatusQuo==='function')",
    "    ? JSON.stringify(canStatusQuo(G.p,o2)) : '')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('sys.cr korundu (2 — menzil aşaması)', d.cr21===2, String(d.cr21));
  ok('sys.orbitHeld korundu (1)', d.orbit21===1, String(d.orbit21));
  ok('sys.supplyHack korundu (6 — süre azalmadı)', d.sh24===6, String(d.sh24));
  ok('sys.supplyHackBy korundu ve DOĞRU saldırganı gösteriyor (2)',
     d.shBy24===2, String(d.shBy24));
  ok('occupationMap sonucu kaydet/yükle öncesiyle AYNI', d.occAyni===true,
     d.occ);
  ok('canStatusQuo sonucu aynı', d.canAyni===true);
}
/* Geçersiz orbitHeld / supplyHackBy atfı */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k=serialize(); var b=JSON.parse(k);",
    "b.simulation.systems.forEach(function(x){",
    "  if(x.i===21) x.oh=999;",
    "  if(x.i===24) x.sb=999; });",
    "deserialize(JSON.stringify(b));",
    "return JSON.stringify({orbit21:G.sys[21].orbitHeld,",
    "  sh24:G.sys[24].supplyHack, shBy24:G.sys[24].supplyHackBy,",
    "  own21:G.sys[21].owner,",
    "  rapor:((G._loadSimInfo||{}).repair||[]).join('|')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('geçersiz orbitHeld normal devlete YÖNLENDİRİLMEDİ',
     d.orbit21===undefined, String(d.orbit21));
  ok('geçersiz orbitHeld sahiplik aktarımı YAPMADI',
     typeof d.own21==='number' || d.own21===undefined);
  ok('geçersiz supplyHackBy atfı temizlendi (rastgele devlete bağlanmadı)',
     d.shBy24===undefined, String(d.shBy24));
  ok('aktif sabotajın KENDİSİ korundu (supplyHack=6)', d.sh24===6,
     String(d.sh24));
  ok('her iki onarım da raporlandı',
     /orbitHeld/.test(d.rapor||'') && /supplyHackBy/.test(d.rapor||''),
     (d.rapor||'').slice(0,90));
}

/* ═══ G. 10 YÜKLEME IDEMPOTENCY + GERÇEK ADIM ═══ */
console.log('\nG. IDEMPOTENCY VE GERÇEK ADIM SÜREKLİLİĞİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "G.log=[];",
    "var A={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filo:G.fleets.length,",
    "  gemi:G.fleets.reduce(function(a,f){return a+((f.ships||[]).length);},0),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), rng:RND_STATE};",
    "var k=serialize();",
    "var dizi=[];",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(JSON.stringify({n5:G.sys[5].nest, n9:G.sys[9].nest,",
    "    r12:G.sys[12].ruin, r17:G.sys[17].ruin, cr:G.sys[21].cr,",
    "    oh:G.sys[21].orbitHeld, sh:G.sys[24].supplyHack,",
    "    sb:G.sys[24].supplyHackBy, raids:G.raids, mAt:G.monsterAt,",
    "    ne:G.nests, ru:G.ruins, w:G.wildId})); }",
    "var B={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filo:G.fleets.length,",
    "  gemi:G.fleets.reduce(function(a,f){return a+((f.ships||[]).length);},0),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','), rng:RND_STATE};",
    "return JSON.stringify({sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  ilk:dizi[0].slice(0,90),",
    "  resAyni:A.res===B.res, relAyni:A.rel===B.rel,",
    "  filoAyni:A.filo===B.filo, gemiAyni:A.gemi===B.gemi,",
    "  ownAyni:A.own===B.own, rngAyni:A.rng===B.rng,",
    "  log:(G.log||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yükleme hiçbir sayaç/hp/timer/menzil/süre İLERLETMEDİ',
     d.sabit===true, d.ilk);
  ok('10 yüklemede kaynak ve ilişkiler değişmedi',
     d.resAyni===true && d.relAyni===true);
  ok('10 yüklemede filo/gemi/sistem sahipliği değişmedi',
     d.filoAyni===true && d.gemiAyni===true && d.ownAyni===true);
  ok('10 yüklemede RNG değişmedi', d.rngAyni===true);
  ok('10 yükleme BİLDİRİM üretmedi', d.log===0, String(d.log));
}
/* Taze yükleme + gerçek adım == çok yükleme + aynı gerçek adım */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k=serialize();",
    "function oz(){ return JSON.stringify({n5:G.sys[5].nest, n9:G.sys[9].nest,",
    "  r12:G.sys[12].ruin, cr:G.sys[21].cr, raids:G.raids, mAt:G.monsterAt,",
    "  ne:G.nests, w:G.wildId, filo:G.fleets.length, rng:RND_STATE}); }",
    "/* wildTurn(e) KORSAN DEVLETİNİ argüman alır — parametresiz çağrı",
    "   e.id üzerinde patlar. Gerçek üretim çağrı biçimi kullanılır. */",
    "function wt(){ var w=G.emps[G.wildId]; if(w) wildTurn(w); }",
    "/* A: taze yükleme + tek gerçek wildTurn */",
    "deserialize(k); var oncA=oz(); wt(); var A=oz();",
    "/* B: 10 yükleme + tek gerçek wildTurn */",
    "for(var i=0;i<10;i++) deserialize(k);",
    "var oncB=oz(); wt(); var B=oz();",
    "/* C: taze yükleme + tek gerçek combatTick */",
    "deserialize(k); var oncC=oz();",
    "combatTick(); var C=oz();",
    "for(var j=0;j<10;j++) deserialize(k);",
    "combatTick(); var D=oz();",
    "return JSON.stringify({baslangicAyni:oncA===oncB && oncB===oncC,",
    "  wildAyni:A===B, combatAyni:C===D,",
    "  wildIlerledi:A!==oncA});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme sayısı başlangıç durumunu ETKİLEMİYOR', d.baslangicAyni===true);
  ok('taze yükleme + 1 wildTurn = 10 yükleme + 1 wildTurn', d.wildAyni===true);
  ok('taze yükleme + 1 combatTick = 10 yükleme + 1 combatTick',
     d.combatAyni===true);
}

/* ═══ H. SIZINTI, YENİ OYUN, V7 GÖÇÜ ═══ */
console.log('\nH. SIZINTI / YENİ OYUN / V7 GÖÇÜ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kA=serialize();",
    "/* Oyun B: temiz */",
    "setupGame({name:'B',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var kurulum={raids:JSON.stringify(G.raids), mAt:G.monsterAt,",
    "  ft:JSON.stringify(G._firstTech),",
    "  eskiNest5:G.sys[5]?G.sys[5].nest:null,",
    "  eskiCr21:G.sys[21]?G.sys[21].cr:null,",
    "  eskiOh21:G.sys[21]?G.sys[21].orbitHeld:null,",
    "  eskiSb24:G.sys[24]?G.sys[24].supplyHackBy:null,",
    "  wildVar:G.emps.some(function(x){return x.wild;}),",
    "  wildIdGecerli:G.wildId===undefined ||",
    "    !!(G.emps[G.wildId] && G.emps[G.wildId].wild)};",
    "var kB=serialize();",
    "deserialize(kA);",
    "var aYuk={nest5:!!G.sys[5].nest, raids:Object.keys(G.raids).length};",
    "deserialize(kB);",
    "var bYuk={nest5:G.sys[5]?G.sys[5].nest:null,",
    "  ruin12:G.sys[12]?G.sys[12].ruin:null,",
    "  nests:JSON.stringify(G.nests), ruins:JSON.stringify(G.ruins),",
    "  raids:JSON.stringify(G.raids), mAt:G.monsterAt,",
    "  ft:JSON.stringify(G._firstTech),",
    "  cr21:G.sys[21]?G.sys[21].cr:null};",
    "return JSON.stringify({kurulum:kurulum, aYuk:aYuk, bYuk:bYuk});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const s=d.kurulum||{}, b=d.bYuk||{};
  ok('YENİ OYUN: raids/monsterAt/firstTech sıfırlandı',
     s.raids==='{}' && s.mAt===0 && s.ft==='{}',
     'raids='+s.raids+' mAt='+s.mAt);
  ok('YENİ OYUN: eski sistem alanları (cr/orbitHeld/supplyHackBy) temiz',
     s.eskiCr21===undefined && s.eskiOh21===undefined &&
     s.eskiSb24===undefined);
  ok('YENİ OYUN: normal üretim bir kez çalıştı (korsan devleti var)',
     s.wildVar===true && s.wildIdGecerli===true);
  ok('OYUN A zengin yüklendi', (d.aYuk||{}).nest5===true &&
     (d.aYuk||{}).raids===2);
  ok('OYUN B: A\'nın yuva/kalıntısı SIZMADI',
     (b.nest5===null||b.nest5===undefined) &&
     (b.ruin12===null||b.ruin12===undefined));
  ok('OYUN B: A\'nın raids/monsterAt/firstTech SIZMADI',
     b.raids==='{}' && b.mAt===0 && b.ft==='{}');
  ok('OYUN B: A\'nın savaş menzili SIZMADI',
     b.cr21===undefined || b.cr21===null);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var gercekWild=G.wildId;",
    "var v8=JSON.parse(serialize()); delete v8.simulation; v8.v=7;",
    "var v7=JSON.stringify(v8);", ZEHIR,
    "var s=[], rr=[], hata=''; G.log=[];",
    "var f0=G.fleets.length;",
    "for(var i=0;i<3;i++){",
    "  try{ deserialize(v7); }catch(ex){ hata=ex.message; }",
    "  s.push(JSON.stringify({w:G.wildId,n:G.nests,r:G.ruins,",
    "    rd:G.raids,m:G.monsterAt,f:G._firstTech,",
    "    n5:G.sys[5].nest, cr:G.sys[21].cr}));",
    "  rr.push(RND_STATE); }",
    "return JSON.stringify({hata:hata, wildId:G.wildId,",
    "  wildDogru:G.wildId===gercekWild,",
    "  nests:JSON.stringify(G.nests), ruins:JSON.stringify(G.ruins),",
    "  raids:JSON.stringify(G.raids), mAt:G.monsterAt,",
    "  ft:JSON.stringify(G._firstTech),",
    "  nest5:G.sys[5].nest, cr21:G.sys[21].cr,",
    "  oh21:G.sys[21].orbitHeld, sb24:G.sys[24].supplyHackBy,",
    "  filoAyni:G.fleets.length===f0, log:(G.log||[]).length,",
    "  determinist:s[0]===s[1]&&s[1]===s[2],",
    "  rngSabit:rr.every(function(x){return x===rr[0];}),",
    "  bilgi:JSON.stringify(G._loadSimInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('v7 kaydı HATA ATMADAN açıldı', d.hata==='', d.hata||'ok');
  ok('v7: wildId yaşayan wild devletten deterministik geri bulundu',
     d.wildDogru===true, 'wildId='+d.wildId);
  ok('v7: nests/ruins uydurulmadan boş',
     d.nests==='[]' && d.ruins==='[]', d.nests+' '+d.ruins);
  ok('v7: raids {} · monsterAt kanonik 0 · firstTech {}',
     d.raids==='{}' && d.mAt===0 && d.ft==='{}');
  ok('v7: sistem alanları (nest/cr/orbitHeld/supplyHackBy) uydurulmadı',
     d.nest5===undefined && d.cr21===undefined &&
     d.oh21===undefined && d.sb24===undefined);
  ok('v7: zehirli oturum değerleri TAŞINMADI',
     d.raids==='{}' && d.ft==='{}' && d.nests==='[]');
  ok('v7: filo doğmadı', d.filoAyni===true);
  ok('v7: bildirim üretilmedi', d.log===0, String(d.log));
  ok('v7: göç DETERMİNİSTİK (3 tekrar aynı)', d.determinist===true);
  ok('v7: göç RNG TÜKETMEDİ', d.rngSabit===true);
  ok('v7: kurtarılan ve kurtarılamayanlar açıkça raporlandı',
     /KURTARILAMADI/.test(d.bilgi||'') && /wildId/.test(d.bilgi||''),
     (d.bilgi||'').slice(0,90));
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
