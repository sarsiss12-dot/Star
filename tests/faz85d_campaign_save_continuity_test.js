#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85D: KONUMSAL OLMAYAN KAMPANYA DURUMU SÜREKLİLİĞİ
                    + KRİZ KİMLİĞİ GUARD'I
   Çalıştırma: node tests/faz85d_campaign_save_continuity_test.js
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const release5=require('./helpers/release-contract');
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
                  'economy.js','commerce.js','ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'])
    vm.runInContext(fs.readFileSync(path.join(KOK,f),'utf8'),sb,{filename:f});
  const R=c=>{try{return vm.runInContext('(function(){'+c+'})()',sb);}
              catch(e){return 'HATA: '+e.message;}};
  return {sb,R};
}
const KUR=(cr,seed)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:"+(seed||99)+",ethics:{mil:1,aut:0,mat:0,ahl:0},",
 " civics:[],origin:'standart',ruins:'yok',crisis:'"+(cr||'kapali')+"',",
 " council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "return 'ok';"].join('\n');

/* Zengin, gerçekçi bir kampanya durumu kurar. */
const KAMPANYA=[
 "var UK=Object.keys(UPHEAVALS)[0];",
 "G.upAge=64; G.upLast=20;",
 "G.upheaval={k:UK, left:19, total:48, at:45};",
 "G.emps.forEach(function(x){ if(!x.dead) recalcMods(x); });",
 "G.market={mul:{ene:1.34,min:0.72,ala:1.91},",
 "  hist:[{t:1,ene:1,min:1,ala:1},{t:2,ene:1.1,min:0.9,ala:1.2},",
 "        {t:3,ene:1.34,min:0.72,ala:1.91}], acildi:12};",
 "G.chainQueue=[{id:'ch_a',at:G.day+30},{id:'ch_b',at:G.day+90}];",
 "G.fallStats={uzay:3,teslim:1,katastrof:2,temiz:5,colossus:1,yutuldu:0,ayrilik:4};",
 "G.sabStats={basari:7,ifsa:2,sessiz:3,cift:1,tech:4,kiskirt:2,falseflag:1,",
 "  yardSabo:6,supplyHack:9};"].join('\n');
/* Aynı oturumu tamamen farklı zehirli değerlerle doldurur. */
const ZEHIR=[
 "G.upAge=999; G.upLast=999;",
 "G.upheaval={k:'ZEHIR',left:1,total:1,at:999};",
 "G.market={mul:{ene:9,min:9,ala:9},hist:[{t:9,ene:9,min:9,ala:9}],acildi:999};",
 "G.chainQueue=[{id:'ZEHIR',at:1}];",
 "G.fallStats={uzay:99,teslim:99,katastrof:99,temiz:99,colossus:99,",
 "  yutuldu:99,ayrilik:99};",
 "G.sabStats={basari:99,ifsa:99,sessiz:99,cift:99,tech:99,kiskirt:99,",
 "  falseflag:99,yardSabo:99,supplyHack:99};"].join('\n');

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
  ok("sw cache = '"+release5.cache+"'", release5.cachePattern.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 (Faz 85F ile yükseldi)', /v:8, cfg:G\.cfg/.test(mainJs));
  ok('world (85A) şeması korundu', /world: serializePoliticalWorld\(\)/.test(mainJs));
  ok('threats (85C) şeması korundu', /threats: serializeCrisisWorld\(\)/.test(mainJs));
  ok('campaign bölümü eklendi', /campaign: serializeCampaignWorld\(\)/.test(mainJs));
  /* Sıra: campaign restore, crisis'ten SONRA, türetilmişten ÖNCE */
  const iw=mainJs.indexOf('restorePoliticalWorld(d.world');
  const ic=mainJs.indexOf('restoreCrisisWorld(d.threats');
  const ik=mainJs.indexOf('restoreCampaignWorld(d.campaign');
  const ir=mainJs.indexOf('rebuildDerivedStateAfterLoad(true);', ik);
  const ie=mainJs.indexOf('economyTick(true);', ik);
  ok('restoreCampaignWorld, restorePoliticalWorld SONRASINDA', ik>iw && iw>0);
  ok('restoreCampaignWorld, restoreCrisisWorld SONRASINDA', ik>ic && ic>0);
  ok('restoreCampaignWorld, rebuildDerivedStateAfterLoad ÖNCESİNDE', ir>ik);
  ok('restoreCampaignWorld, economyTick(true) ÖNCESİNDE', ie>ik);
  /* setupGame merkezî reset */
  ok('setupGame merkezî resetCampaignRuntimeState kullanıyor',
     /resetCampaignRuntimeState\(\);/.test(mainJs));
  ok('setupGame\'deki dağınık elle sıfırlamalar kaldırıldı',
     !/G\.fallStats = \{uzay:0, teslim:0/.test(mainJs) &&
     !/G\.sabStats = \{basari:0, ifsa:0/.test(mainJs));
  /* Tek kanonik varsayılan, beş yerde de kullanılıyor */
  ok('fallStatsDefaults() tek kanonik kaynak', /function fallStatsDefaults\(\)\{/.test(mainJs));
  ok('sabStatsDefaults() tek kanonik kaynak', /function sabStatsDefaults\(\)\{/.test(mainJs));
  ok('recordFall kanonik varsayılanı kullanıyor',
     /function recordFall[\s\S]{0,200}fallStatsDefaults\(\)/.test(mainJs));
  ok('recordSabotage kanonik varsayılanı kullanıyor',
     /function recordSabotage[\s\S]{0,260}sabStatsDefaults\(\)/.test(mainJs));
  /* KAPSAM DIŞI alanlar campaign'e sızmamalı */
  const i1=mainJs.indexOf('function serializeCampaignWorld');
  const i2=mainJs.indexOf('function resetCampaignRuntimeState');
  ['G.inbox','G.inboxUid','G.minNote','G.minRaw','G.wildId','G.nests',
   'G.ruins','G.raids','G.sits','G.fx'].forEach(k=>
    ok('kapsam dışı alan campaign içinde YOK: '+k,
       mainJs.slice(i1,i2).indexOf(k)<0));
  /* upLast null yasağı */
  ok('resetCampaignRuntimeState upLast için delete kullanıyor',
     /function resetCampaignRuntimeState[\s\S]{0,400}delete G\.upLast;/.test(mainJs));
  ok('G.upLast = null ataması kodda YOK', !/G\.upLast\s*=\s*null/.test(mainJs));
  /* 85C yanlış JS iddiası düzeltildi */
  ok('85C yanlış "G.emps[null] → 0. indeks" iddiası düzeltildi',
     !/`G\.emps\[null\]`\s*\n?\s*JavaScript'te 0\. indekse \(OYUNCUYA\) çözülebilir/.test(mainJs));
  ok('düzeltilmiş açıklama gerçek davranışı anlatıyor',
     /"null" ADLI özelliği arar/.test(mainJs) && /\+null === 0/.test(mainJs));
  /* 85B saf init yolu korunmalı */
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
  const H=harness(); H.R(KUR());
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

/* ═══ B. V6 CAMPAIGN ANAHTAR KÜMESİ ═══ */
console.log('\nB. V6 CAMPAIGN ŞEMASI');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var v=JSON.parse(serialize());",
    "return JSON.stringify({surum:v.v,",
    "  ust:Object.keys(v).sort().join(','),",
    "  campaign:Object.keys(v.campaign||{}).sort().join(','),",
    "  worldVar:!!v.world, threatsVar:('threats' in v),",
    "  sysVar:!!v.sys, empsVar:!!v.emps, flVar:!!v.fl});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıt sürümü v:8 (Faz 85F)', d.surum===8, 'v='+d.surum);
  ok('campaign TAM ve YALNIZ yedi alan',
     d.campaign==='chainQueue,fallStats,market,sabStats,upAge,upLast,upheaval',
     d.campaign);
  ok('world (85A) bölümü korundu', d.worldVar===true);
  ok('threats (85C) bölümü korundu', d.threatsVar===true);
  ok('sys/emps/fl bölümleri korundu',
     d.sysVar===true && d.empsVar===true && d.flVar===true);
}

/* ═══ C. ÇALKANTI SÜREKLİLİĞİ ═══ */
console.log('\nC. ÇALKANTI SÜREKLİLİĞİ');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var modOnce=JSON.stringify(G.p.mods);",
    "var resOnce=JSON.stringify(G.p.res);",
    "var popOnce=G.emps.map(function(e){return (e.colonies||[])",
    "  .reduce(function(a,c){var p=G.sys[c.s].planets[c.p];",
    "  return a+((p.col&&p.col.pop)||0);},0);}).join(',');",
    "var k=serialize();", ZEHIR,
    "var dizi=[], rngler=[], loglar=[];",
    "G.log=[];",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(JSON.stringify(G.upheaval)+'|'+G.upAge+'|'+G.upLast);",
    "  rngler.push(RND_STATE); loglar.push((G.log||[]).length); }",
    "return JSON.stringify({dizi:dizi, sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  k:G.upheaval.k, left:G.upheaval.left, total:G.upheaval.total,",
    "  at:G.upheaval.at, upAge:G.upAge, upLast:G.upLast,",
    "  rngSabit:rngler.every(function(x){return x===rngler[0];}),",
    "  logSayi:loglar[loglar.length-1],",
    "  modAyni:JSON.stringify(G.p.mods)===modOnce,",
    "  resAyni:JSON.stringify(G.p.res)===resOnce,",
    "  popAyni:G.emps.map(function(e){return (e.colonies||[])",
    "    .reduce(function(a,c){var p=G.sys[c.s].planets[c.p];",
    "    return a+((p.col&&p.col.pop)||0);},0);}).join(',')===popOnce,",
    "  modStab:G.p.mods.stab});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yüklemede çalkantı BİREBİR sabit', d.sabit===true,
     (d.dizi||[])[0]);
  ok('upheaval.k korundu', d.k==='goc', d.k);
  ok('upheaval.left korundu (19) — tick çalışmadı', d.left===19, String(d.left));
  ok('upheaval.total korundu (48)', d.total===48, String(d.total));
  ok('upheaval.at korundu (45)', d.at===45, String(d.at));
  ok('upAge korundu (64) — yükleme ayı ilerletmedi', d.upAge===64, String(d.upAge));
  ok('upLast korundu (20)', d.upLast===20, String(d.upLast));
  ok('yükleme RNG TÜKETMEDİ', d.rngSabit===true);
  ok('yükleme BİLDİRİM üretmedi (onStart çalışmadı)', d.logSayi===0,
     String(d.logSayi));
  ok('kaynaklar yükleme nedeniyle değişmedi', d.resAyni===true);
  ok('nüfus yükleme nedeniyle değişmedi', d.popAyni===true);
  ok('çalkantı modları yükleme sonrası HEMEN doğru',
     d.modAyni===true, 'stab='+d.modStab);
}
/* Taze yükleme + 1 tick == 10 yükleme + 1 tick */
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var k=serialize();",
    "function oz(){ return JSON.stringify(G.upheaval)+'|'+G.upAge+'|'+G.upLast; }",
    "deserialize(k); var oncA=oz(); upheavalTick(); var A=oz();",
    "for(var i=0;i<10;i++) deserialize(k);",
    "var oncB=oz(); upheavalTick(); var B=oz();",
    "for(var j=0;j<10;j++) deserialize(k); var C=oz();",
    "return JSON.stringify({oncA:oncA,A:A,oncB:oncB,B:B,C:C});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yükleme tek başına sayacı İLERLETMEDİ', d.oncA===d.C, d.C);
  ok('taze yükleme + 1 tick = 10 yükleme + 1 tick', d.A===d.B, d.A);
  ok('tek tik yalnız bir ay ilerletti', d.A!==d.oncA, d.oncA+' → '+d.A);
}
/* Bozuk çalkantı uydurulmaz */
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var k=serialize();",
    "var b1=JSON.parse(k); b1.campaign.upheaval={k:'YOK_BOYLE',left:5,total:9,at:1};",
    "deserialize(JSON.stringify(b1));",
    "var a={u:G.upheaval, rapor:(G._loadCampaignInfo||{}).repair};",
    "var b2=JSON.parse(k); b2.campaign.upheaval={k:'goc',left:NaN,total:'x',at:1};",
    "deserialize(JSON.stringify(b2));",
    "var b={u:G.upheaval, rapor:(G._loadCampaignInfo||{}).repair};",
    "/* upLast null → çalışma zamanında undefined; 0 GEÇERLİ */",
    "var b3=JSON.parse(k); b3.campaign.upLast=null;",
    "deserialize(JSON.stringify(b3));",
    "var c={tip:typeof G.upLast, varMi:('upLast' in G)};",
    "var b4=JSON.parse(k); b4.campaign.upLast=0;",
    "deserialize(JSON.stringify(b4));",
    "var e={deger:G.upLast, tip:typeof G.upLast};",
    "return JSON.stringify({a:a,b:b,c:c,e:e});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('geçersiz upheaval.k uydurulmadı → null',
     d.a && d.a.u===null, (d.a||{}).rapor);
  ok('bozuk sayaçlı upheaval uydurulmadı → null',
     d.b && d.b.u===null, (d.b||{}).rapor);
  ok('geçersiz çalkantı tanıda raporlandı',
     typeof (d.a||{}).rapor==='string' && (d.a||{}).rapor.length>0);
  ok('upLast null → çalışma zamanında undefined (null DEĞİL)',
     d.c && d.c.tip==='undefined' && d.c.varMi===false, (d.c||{}).tip);
  ok('upLast = 0 GEÇERLİ değer olarak korundu',
     d.e && d.e.deger===0 && d.e.tip==='number', String((d.e||{}).deger));
}

/* ═══ D. PİYASA SÜREKLİLİĞİ ═══ */
console.log('\nD. GALAKTİK PİYASA SÜREKLİLİĞİ');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var resOnce=G.emps.map(function(e){return JSON.stringify(e.res);}).join(';');",
    "var k=serialize();", ZEHIR,
    "var dizi=[];",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(JSON.stringify(G.market)); }",
    "var m=G.market;",
    "return JSON.stringify({sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  ene:m.mul.ene, min:m.mul.min, ala:m.mul.ala,",
    "  histLen:m.hist.length, histSira:m.hist.map(function(h){return h.t;}).join(','),",
    "  acildi:m.acildi,",
    "  resAyni:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';')===resOnce,",
    "  fiyatEne:marketPrice('ene')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yüklemede piyasa BİREBİR sabit', d.sabit===true);
  ok('mul.ene korundu (1.34) — tabana dönmedi', d.ene===1.34, String(d.ene));
  ok('mul.min korundu (0.72)', d.min===0.72, String(d.min));
  ok('mul.ala korundu (1.91)', d.ala===1.91, String(d.ala));
  ok('hist uzunluğu ve SIRASI korundu',
     d.histLen===3 && d.histSira==='1,2,3', d.histSira);
  ok('acildi korundu (12)', d.acildi===12, String(d.acildi));
  ok('yükleme kaynak stoklarını değiştirmedi (AI takası yok)',
     d.resAyni===true);
  ok('marketPrice yüklenen çarpanı kullanıyor', d.fiyatEne>0);
}
/* Taze yükleme + 1 marketTick == çoklu yükleme + 1 marketTick */
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "/* marketTick yalnız BORSA AÇIKKEN fiyat oynatır (marketOpen) */",
    "G.council={name:'K',founder:0,members:[0,1],laws:{borsaKur:true},",
    "  targeted:{},treasury:0,president:0,termStart:G.day,terms:{},",
    "  voteIn:9,vote:null,dead:false};",
    "var k=serialize();",
    "deserialize(k); var oncA=JSON.stringify(G.market);",
    "var acik=marketOpen();",
    "marketTick(); var A=JSON.stringify(G.market);",
    "for(var i=0;i<10;i++) deserialize(k);",
    "var oncB=JSON.stringify(G.market); marketTick();",
    "var B=JSON.stringify(G.market);",
    "return JSON.stringify({oncA:oncA,oncB:oncB,A:A,B:B,acik:acik,",
    "  yuklemeAyni:oncA===oncB, tikAyni:A===B, tikIlerledi:A!==oncA});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme sayısı piyasayı ETKİLEMİYOR', d.yuklemeAyni===true);
  ok('taze yükleme + 1 marketTick = 10 yükleme + 1 marketTick',
     d.tikAyni===true);
  ok('borsa açık (marketOpen) — senaryo geçerli', d.acik===true);
  ok('gerçek marketTick hâlâ ilerliyor', d.tikIlerledi===true);
}
/* Bozuk piyasa + 40 kayıt sınırı + hiç açılmamış piyasa */
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var k=serialize();",
    "var b=JSON.parse(k);",
    "b.campaign.market={mul:{ene:Infinity,min:-3,ala:'x'},",
    "  hist:[{t:1,ene:NaN,min:1,ala:1},'bozuk',null,{t:2,ene:1,min:1,ala:1}],",
    "  acildi:'yanlis'};",
    "deserialize(JSON.stringify(b));",
    "var bozuk={mul:JSON.stringify(G.market.mul), hist:G.market.hist.length,",
    "  acildi:G.market.acildi};",
    "/* 50 kayıtlı geçmiş → 40'a kırpılmalı, en yeniler kalmalı */",
    "var b2=JSON.parse(k); b2.campaign.market.hist=[];",
    "for(var i=0;i<50;i++) b2.campaign.market.hist.push({t:i,ene:1,min:1,ala:1});",
    "deserialize(JSON.stringify(b2));",
    "var kirp={len:G.market.hist.length, ilk:G.market.hist[0].t,",
    "  son:G.market.hist[G.market.hist.length-1].t};",
    "/* piyasa hiç açılmamış */",
    "var b3=JSON.parse(k); b3.campaign.market=null;",
    "deserialize(JSON.stringify(b3));",
    "var yok={m:G.market};",
    "var kuruldu=marketInit();",
    "return JSON.stringify({bozuk:bozuk, kirp:kirp, yok:yok,",
    "  kuruldu:JSON.stringify(kuruldu.mul)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('bozuk çarpanlar güvenli varsayılana (1) düştü',
     d.bozuk && d.bozuk.mul==='{"ene":1,"min":1,"ala":1}', (d.bozuk||{}).mul);
  ok('bozuk geçmiş girdileri atıldı, geçerliler kaldı',
     d.bozuk && d.bozuk.hist===2, String((d.bozuk||{}).hist));
  ok('yanlış tipli acildi 0\'a çekildi', d.bozuk && d.bozuk.acildi===0);
  ok('50 kayıtlı geçmiş mevcut 40 sınırına kırpıldı',
     d.kirp && d.kirp.len===40, String((d.kirp||{}).len));
  ok('kırpmada EN YENİ kayıtlar tutuldu',
     d.kirp && d.kirp.ilk===10 && d.kirp.son===49,
     't='+(d.kirp||{}).ilk+'..'+(d.kirp||{}).son);
  ok('hiç açılmamış piyasa null kaldı', d.yok && d.yok.m===null);
  ok('marketInit() gerektiğinde normal kuruyor',
     d.kuruldu==='{"ene":1,"min":1,"ala":1}', d.kuruldu);
}

/* ═══ E. BEKLEYEN HİKÂYE ZİNCİRLERİ ═══ */
console.log('\nE. chainQueue');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var k=serialize();", ZEHIR,
    "var dizi=[], rngler=[];",
    "var cagri=0; var org=UI.chain; UI.chain=function(id){ cagri++; };",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(JSON.stringify(G.chainQueue)); rngler.push(RND_STATE); }",
    "var yuklemeCagri=cagri;",
    "UI.chain=org;",
    "return JSON.stringify({sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  q:JSON.parse(dizi[0]), uzunluk:G.chainQueue.length,",
    "  yuklemeCagri:yuklemeCagri,",
    "  rngSabit:rngler.every(function(x){return x===rngler[0];})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 yüklemede chainQueue BİREBİR sabit', d.sabit===true,
     JSON.stringify(d.q));
  ok('girdiler ve SIRALARI korundu',
     Array.isArray(d.q) && d.q.length===2 &&
     d.q[0].id==='ch_a' && d.q[1].id==='ch_b',
     (d.q||[]).map(x=>x.id).join(','));
  ok('yükleme kuyruğu ÇOĞALTMADI', d.uzunluk===2, String(d.uzunluk));
  ok('yükleme girdileri ÇALIŞTIRMADI (UI.chain çağrısı 0)',
     d.yuklemeCagri===0, String(d.yuklemeCagri));
  ok('yükleme RNG tüketmedi', d.rngSabit===true);
}
/* Zamanı gelen giriş tek gerçek ilerlemede BİR kez çalışır */
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "G.chainQueue=[{id:'ch_due',at:G.day-1},{id:'ch_later',at:G.day+900}];",
    "var k=serialize();",
    "var cagri=[]; var org=UI.chain; UI.chain=function(id){ cagri.push(id); };",
    "for(var i=0;i<6;i++) deserialize(k);",
    "var yukleme=cagri.length;",
    "monthTick();",
    "/* monthTick doğal olarak BAŞKA zincirler de açabilir (maybeEvent);",
    "   ölçüm kuyruktaki girdiye göre daraltılır. */",
    "var ay1=cagri.filter(function(x){return x==='ch_due'||x==='ch_later';});",
    "UI.chain=org;",
    "return JSON.stringify({yukleme:yukleme, ay1:ay1,",
    "  kalan:G.chainQueue.map(function(x){return x.id;})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('6 yükleme zamanı gelen girişi çalıştırmadı', d.yukleme===0,
     String(d.yukleme));
  ok('tek gerçek aylık ilerleme onu TAM BİR kez çalıştırdı',
     Array.isArray(d.ay1) && d.ay1.length===1 && d.ay1[0]==='ch_due',
     (d.ay1||[]).join(','));
  ok('zamanı gelmemiş giriş kuyrukta kaldı',
     Array.isArray(d.kalan) && d.kalan.length===1 && d.kalan[0]==='ch_later',
     (d.kalan||[]).join(','));
}
/* Geçersiz girdiler atılır, geçerli aynı-id KORUNUR */
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "G.chainQueue=[{id:'a',at:10}];",
    "var k=serialize(); var b=JSON.parse(k);",
    "b.campaign.chainQueue=[{id:'a',at:10},null,{id:'',at:5},",
    "  {at:7},{id:'b'},{id:'c',at:NaN},'bozuk',{id:'a',at:40},{id:'a',at:10}];",
    "deserialize(JSON.stringify(b));",
    "return JSON.stringify({q:G.chainQueue,",
    "  atilan:(G._loadCampaignInfo||{}).droppedChain});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const q=d.q||[];
  ok('geçersiz biçimli girdiler güvenle atıldı', q.length===3,
     q.length+' kaldı');
  ok('atılan sayısı tanıda bildirildi', d.atilan===6, String(d.atilan));
  ok('geçerli AYNI-ID girdileri körlemesine tekilleştirilmedi',
     q.length===3 && q[0].id==='a' && q[1].id==='a' && q[2].id==='a' &&
     q[0].at===10 && q[1].at===40 && q[2].at===10,
     q.map(x=>x.id+'@'+x.at).join(','));
}

/* ═══ F. İSTATİSTİKLER ═══ */
console.log('\nF. İSTATİSTİKLER VE KANONİK VARSAYILAN');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var k=serialize();", ZEHIR,
    "for(var i=0;i<5;i++) deserialize(k);",
    "var fall=G.fallStats, sab=G.sabStats;",
    "/* eksik anahtarlı eski kayıt */",
    "var b=JSON.parse(k);",
    "b.campaign.sabStats={basari:5,ifsa:2};",
    "b.campaign.fallStats={uzay:2};",
    "deserialize(JSON.stringify(b));",
    "var eksik={sab:JSON.stringify(G.sabStats), fall:JSON.stringify(G.fallStats)};",
    "/* bozuk değerler */",
    "var b2=JSON.parse(k);",
    "b2.campaign.sabStats={basari:-5,ifsa:NaN,sessiz:'x',cift:3};",
    "deserialize(JSON.stringify(b2));",
    "var bozuk=JSON.stringify(G.sabStats);",
    "return JSON.stringify({fall:JSON.stringify(fall), sab:JSON.stringify(sab),",
    "  eksik:eksik, bozuk:bozuk});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('fallStats korundu (zehri ezdi)',
     d.fall==='{"uzay":3,"teslim":1,"katastrof":2,"temiz":5,"colossus":1,"yutuldu":0,"ayrilik":4}',
     d.fall);
  ok('sabStats korundu (yardSabo 6, supplyHack 9 dahil)',
     d.sab==='{"basari":7,"ifsa":2,"sessiz":3,"cift":1,"tech":4,"kiskirt":2,"falseflag":1,"yardSabo":6,"supplyHack":9}',
     d.sab);
  ok('eksik anahtarlar sıfırla tamamlandı, geçerliler korundu',
     d.eksik && d.eksik.sab==='{"basari":5,"ifsa":2,"sessiz":0,"cift":0,"tech":0,"kiskirt":0,"falseflag":0,"yardSabo":0,"supplyHack":0}' &&
     d.eksik.fall==='{"uzay":2,"teslim":0,"katastrof":0,"temiz":0,"colossus":0,"yutuldu":0,"ayrilik":0}',
     (d.eksik||{}).sab);
  ok('negatif/NaN/yanlış tip güvenli sıfıra çekildi, geçerli korundu',
     d.bozuk==='{"basari":0,"ifsa":0,"sessiz":0,"cift":3,"tech":0,"kiskirt":0,"falseflag":0,"yardSabo":0,"supplyHack":0}',
     d.bozuk);
}
/* İKİ KAYIP SAYAÇ artık gerçekten artıyor */
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "G.sabStats=null;",
    "recordSabotage('basari'); recordSabotage('yardSabo');",
    "recordSabotage('supplyHack'); recordSabotage('yardSabo');",
    "recordSabotage('BILINMEYEN');",
    "G.fallStats=null; recordFall('uzay'); recordFall('ayrilik');",
    "recordFall('BILINMEYEN');",
    "return JSON.stringify({sab:G.sabStats, fall:G.fallStats,",
    "  anahtarlar:Object.keys(G.sabStats).join(',')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const s=d.sab||{}, f=d.fall||{};
  ok('sabStats kanonik kümesi dokuz anahtar',
     d.anahtarlar==='basari,ifsa,sessiz,cift,tech,kiskirt,falseflag,yardSabo,supplyHack',
     d.anahtarlar);
  ok('yardSabo artık GERÇEKTEN artıyor (2 çağrı → 2)', s.yardSabo===2,
     String(s.yardSabo));
  ok('supplyHack artık GERÇEKTEN artıyor (1 çağrı → 1)', s.supplyHack===1,
     String(s.supplyHack));
  ok('bilinmeyen sabotaj türü sayaç uydurmadı', s.BILINMEYEN===undefined);
  ok('recordFall kanonik varsayılanı kullanıyor',
     f.uzay===1 && f.ayrilik===1 && f.BILINMEYEN===undefined);
}
/* fallReport toplam formülü DEĞİŞMEDİ */
{
  const H=harness(); H.R(KUR());
  const r=H.R([
    "G.fallStats={uzay:3,teslim:1,katastrof:2,temiz:5,colossus:1,yutuldu:7,ayrilik:4};",
    "var rp=fallReport();",
    "return JSON.stringify({toplam:rp.toplam, beklenen:3+1+2+5+1,",
    "  temizOran:rp.temizOran});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('fallReport toplam formülü bu fazda DEĞİŞMEDİ',
     d.toplam===d.beklenen && d.toplam===12,
     'toplam='+d.toplam);
}

/* ═══ G. SIZINTI VE YENİ OYUN ═══ */
console.log('\nG. SIZINTI VE YENİ OYUN');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "var kA=serialize();",
    "/* Oyun B: temiz kampanya */",
    "setupGame({name:'B',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var kurulum={up:G.upheaval, upAge:G.upAge, upLastTip:typeof G.upLast,",
    "  market:G.market, chain:JSON.stringify(G.chainQueue),",
    "  fall:JSON.stringify(G.fallStats), sab:JSON.stringify(G.sabStats)};",
    "var kB=serialize();",
    "deserialize(kA);",
    "var aYuk={up:G.upheaval&&G.upheaval.k, market:G.market&&G.market.mul.ene};",
    "deserialize(kB);",
    "var bYuk={up:G.upheaval, upAge:G.upAge, upLastTip:typeof G.upLast,",
    "  market:G.market, chain:JSON.stringify(G.chainQueue),",
    "  fall:JSON.stringify(G.fallStats), sab:JSON.stringify(G.sabStats)};",
    "return JSON.stringify({kurulum:kurulum, aYuk:aYuk, bYuk:bYuk});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const s=d.kurulum||{}, b=d.bYuk||{};
  ok('YENİ OYUN: eski çalkantı taşınmadı (eskiden SIZIYORDU)',
     s.up===null, JSON.stringify(s.up));
  ok('YENİ OYUN: upAge sıfırlandı (eskiden SIZIYORDU)', s.upAge===0,
     String(s.upAge));
  ok('YENİ OYUN: upLast undefined (eskiden SIZIYORDU)',
     s.upLastTip==='undefined', s.upLastTip);
  ok('YENİ OYUN: eski piyasa fiyatı taşınmadı (eskiden SIZIYORDU)',
     s.market===null, JSON.stringify(s.market));
  ok('YENİ OYUN: chainQueue boş', s.chain==='[]');
  ok('YENİ OYUN: istatistikler sıfır ve kanonik',
     s.fall==='{"uzay":0,"teslim":0,"katastrof":0,"temiz":0,"colossus":0,"yutuldu":0,"ayrilik":0}' &&
     /"yardSabo":0,"supplyHack":0/.test(s.sab||''));
  ok('OYUN A gerçekten zengin yüklendi',
     d.aYuk && d.aYuk.up==='goc' && d.aYuk.market===1.34);
  ok('OYUN B: A\'nın çalkantısı SIZMADI', b.up===null);
  ok('OYUN B: A\'nın piyasası SIZMADI', b.market===null);
  ok('OYUN B: A\'nın chainQueue\'su SIZMADI', b.chain==='[]');
  ok('OYUN B: A\'nın istatistikleri SIZMADI',
     /"uzay":0/.test(b.fall||'') && /"yardSabo":0/.test(b.sab||''));
}

/* ═══ H. V5 GÖÇÜ ═══ */
console.log('\nH. V5 GÖÇÜ');
{
  const H=harness(); H.R(KUR());
  const r=H.R([KAMPANYA,
    "G.day=930;",
    "var v6=JSON.parse(serialize()); delete v6.campaign; v6.v=5;",
    "var v5=JSON.stringify(v6);", ZEHIR,
    "var s=[], rr=[], hata='';",
    "G.log=[];",
    "for(var i=0;i<3;i++){",
    "  try{ deserialize(v5); }catch(ex){ hata=ex.message; }",
    "  s.push(JSON.stringify({u:G.upheaval,a:G.upAge,l:G.upLast,",
    "    m:G.market,c:G.chainQueue,f:G.fallStats,sb:G.sabStats}));",
    "  rr.push(RND_STATE); }",
    "return JSON.stringify({hata:hata, upheaval:G.upheaval, upAge:G.upAge,",
    "  upLastTip:typeof G.upLast, market:G.market,",
    "  chain:JSON.stringify(G.chainQueue), fall:JSON.stringify(G.fallStats),",
    "  sab:JSON.stringify(G.sabStats), log:(G.log||[]).length,",
    "  determinist:s[0]===s[1]&&s[1]===s[2],",
    "  rngSabit:rr.every(function(x){return x===rr[0];}),",
    "  bilgi:JSON.stringify(G._loadCampaignInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('v5 kaydı HATA ATMADAN açıldı', d.hata==='', d.hata||'ok');
  ok('upAge = gün/30 deterministik türetildi (930→31)', d.upAge===31,
     String(d.upAge));
  ok('upheaval null (uydurulmadı)', d.upheaval===null);
  ok('upLast çalışma zamanında undefined', d.upLastTip==='undefined');
  ok('market null (fiyat geçmişi uydurulmadı)', d.market===null);
  ok('chainQueue boş (bekleyen zincir uydurulmadı)', d.chain==='[]');
  ok('fallStats kanonik sıfır', /"uzay":0/.test(d.fall||''), d.fall);
  ok('sabStats kanonik sıfır (dokuz anahtar)',
     /"yardSabo":0,"supplyHack":0/.test(d.sab||''));
  ok('zehirli oturum değerleri TAŞINMADI',
     d.upAge===31 && d.upheaval===null && d.market===null);
  ok('göç bildirim üretmedi', d.log===0, String(d.log));
  ok('göç DETERMİNİSTİK (3 tekrar aynı)', d.determinist===true);
  ok('göç RNG TÜKETMEDİ', d.rngSabit===true);
  ok('kurtarılamayan bilgi dürüstçe raporlandı',
     /KURTARILAMADI/.test(d.bilgi||''), (d.bilgi||'').slice(0,80));
}

/* ═══ I. KRİZ KİMLİĞİ GUARD'I ═══ */
console.log('\nI. ensureCrisisEmpire GUARD\'I');
{
  const H=harness(); H.R(KUR('erken'));
  const r=H.R([
    "G.crisis.atMonth=1; G.crisis.age=0;",
    "for(var i=0;i<4 && !crisisActive();i++) crisisTick();",
    "/* Temiz taban: kriz devletini ve filolarını kaldır, kimliği sil. */",
    "var kid=G.crisisId;",
    "G.fleets=G.fleets.filter(function(f){return f.e!==kid;});",
    "G.emps=G.emps.filter(function(x){return x.id!==kid;});",
    "delete G.crisisId;",
    "var TABAN=G.emps.length;",
    "/* Kimlik DIŞI alanlar: savaş haritası kasten hariç — yeni kriz",
    "   devleti herkesle savaşa girer, bu DOĞRU davranıştır. */",
    "function kimlik(e){ return JSON.stringify({n:e.name, c:e.col,",
    "  et:e.ethics, side:!!e.crisisSide, wild:!!e.wild, ai:!!e.ai}); }",
    "var temizEmps=G.emps.map(function(e){return JSON.parse(JSON.stringify(e));});",
    "function tazele(){",
    "  G.emps=temizEmps.map(function(e){return JSON.parse(JSON.stringify(e));});",
    "  G.fleets=G.fleets.filter(function(f){return f.e<TABAN;});",
    "}",
    "function dene(ayar){",
    "  tazele();",
    "  var p0=kimlik(G.emps[0]), a1=G.emps[1]?kimlik(G.emps[1]):null;",
    "  var w0=JSON.stringify(G.emps[0].war);",
    "  ayar();",
    "  var n0=G.emps.length;",
    "  var c=ensureCrisisEmpire();",
    "  var w1=JSON.stringify(G.emps[0].war);",
    "  /* savaş haritası YALNIZ yeni kriz kimliği eklenerek değişmeli */",
    "  var wa=JSON.parse(w0), wb=JSON.parse(w1), ekFark=[];",
    "  Object.keys(wb).forEach(function(k){",
    "    if(JSON.stringify(wa[k])!==JSON.stringify(wb[k])) ekFark.push(k); });",
    "  /* Yeni kriz kimliği DIŞINDA değişen anahtar OLMAMALI. Kriz",
    "     kimliğinin kendisi eklenebilir (herkes krizle savaşa girer) ",
    "     ya da zaten true olabilir; ikisi de güvenlidir. */",
    "  var yabanci=ekFark.filter(function(k){return String(k)!==String(c.id);});",
    "  return {dondu:c.id, side:!!c.crisisSide, wild:!!c.wild,",
    "    yeniDevlet:c.id>=n0, empArtti:G.emps.length===n0+1,",
    "    oyuncuKimlikBozuldu:kimlik(G.emps[0])!==p0,",
    "    aiKimlikBozuldu:G.emps[1]?kimlik(G.emps[1])!==a1:false,",
    "    savasEkFark:ekFark.join(','), yabanciFark:yabanci.join(','),",
    "    yeniId:c.id};",
    "}",
    "var out={};",
    "out.id0=dene(function(){ G.crisisId=0; });",
    "out.idAI=dene(function(){",
    "  var ai=G.emps.filter(function(x){return x.ai && !x.wild && !x.dead;})[0];",
    "  G.crisisId=ai.id; out._aiId=ai.id; });",
    "out.idRange=dene(function(){ G.crisisId=999; });",
    "out.idNull=dene(function(){ G.crisisId=null; });",
    "/* 5) GEÇERLİ crisisSide kimliği → mevcut devlet aynen dönmeli */",
    "tazele();",
    "delete G.crisisId;",
    "var gercek=ensureCrisisEmpire();",
    "var nD=G.emps.length;",
    "G.crisisId=gercek.id;",
    "var tekrar=ensureCrisisEmpire();",
    "out.idValid={dondu:tekrar.id, ayni:tekrar.id===gercek.id,",
    "  side:!!tekrar.crisisSide, yeniUretilmedi:G.emps.length===nD};",
    "out.taban=TABAN;",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const a=d.id0||{}, b=d.idAI||{}, c=d.idRange||{}, e=d.idNull||{}, f=d.idValid||{};
  [['crisisId=0 (OYUNCU)',a],['crisisId=normal AI',b],
   ['crisisId=aralık dışı',c],['crisisId=null',e]].forEach(([ad,x])=>{
    ok(ad+': sıradan devlet DÖNDÜRÜLMEDİ, gerçek kriz devleti üretildi',
       x.side===true && x.wild===true && x.yeniDevlet===true &&
       x.empArtti===true, 'döndü #'+x.dondu);
    ok(ad+': oyuncunun ad/renk/etik/crisisSide değeri BOZULMADI',
       x.oyuncuKimlikBozuldu===false);
    ok(ad+': AI devletinin kimliği BOZULMADI', x.aiKimlikBozuldu===false);
    ok(ad+': savaş haritasında YABANCI anahtar değişmedi',
       x.yabanciFark==='',
       'değişen: ['+(x.savasEkFark||'-')+'] · yeni kriz id '+x.yeniId);
  });
  ok('crisisId=geçerli crisisSide: MEVCUT devlet aynen döndü',
     f.ayni===true && f.side===true, 'döndü #'+f.dondu);
  ok('geçerli kimlikte İKİNCİ kriz devleti üretilmedi',
     f.yeniUretilmedi===true);
}

/* ═══ J. YÜKLEME SAFİYETİ + 85A/85B/85C REGRESYONU ═══ */
console.log('\nJ. YÜKLEME SAFİYETİ VE ÖNCEKİ FAZ REGRESYONLARI');
{
  const H=harness(); H.R(KUR('erken'));
  const r=H.R([
    "G.crisis.atMonth=1; G.crisis.age=0;",
    "for(var i=0;i<4 && !crisisActive();i++) crisisTick();",
    "G.crisis.stage=2; G.crisis.timer=7;", KAMPANYA,
    "/* 85A politik dünya */",
    "G.memAge=137; G.cncAge=64; G.fedUid=7; G.sandbox=true;",
    "G.council={name:'Konsey',founder:0,members:[0,1],laws:{},targeted:{},",
    "  treasury:412,president:0,termStart:G.day,terms:{},voteIn:9,",
    "  vote:null,dead:false};",
    "/* 85B kalkan */",
    "var sy=G.sys.filter(function(s){return s.owner===G.p.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "pl.col.shield=4;",
    "var A={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filo:G.fleets.length,",
    "  gemi:G.fleets.reduce(function(a,f){return a+((f.ships||[]).length);},0),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  pop:G.emps.map(function(e){return (e.colonies||[]).reduce(function(a,c){",
    "    var p=G.sys[c.s].planets[c.p]; return a+((p.col&&p.col.pop)||0);},0);}).join(',')};",
    "/* G.log kayıt yükünün PARÇASIDIR (deserialize onu geri yükler),",
    "   bu yüzden serialize'dan ÖNCE temizlenir. */",
    "G.log=[]; var k=serialize();",
    "var kalkanlar=[4];",
    "for(var j=0;j<6;j++){ deserialize(k);",
    "  kalkanlar.push(G.sys[sy.id].planets[pl.i].col.shield); }",
    "var B={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  filo:G.fleets.length,",
    "  gemi:G.fleets.reduce(function(a,f){return a+((f.ships||[]).length);},0),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  pop:G.emps.map(function(e){return (e.colonies||[]).reduce(function(a,c){",
    "    var p=G.sys[c.s].planets[c.p]; return a+((p.col&&p.col.pop)||0);},0);}).join(',')};",
    "var oncAy=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(true);",
    "var initSonra=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(false);",
    "var aySonra=G.sys[sy.id].planets[pl.i].col.shield;",
    "return JSON.stringify({resAyni:A.res===B.res, relAyni:A.rel===B.rel,",
    "  filoAyni:A.filo===B.filo, gemiAyni:A.gemi===B.gemi,",
    "  ownAyni:A.own===B.own, popAyni:A.pop===B.pop,",
    "  log:(G.log||[]).length,",
    "  kalkanSabit:kalkanlar.every(function(x){return x===4;}),",
    "  initSonra:initSonra, oncAy:oncAy, aySonra:aySonra,",
    "  memAge:G.memAge, cncAge:G.cncAge, fedUid:G.fedUid, sandbox:G.sandbox,",
    "  konsey:G.council&&G.council.treasury,",
    "  krizAktif:crisisActive(), krizStage:G.crisis&&G.crisis.stage,",
    "  krizTimer:G.crisis&&G.crisis.timer,",
    "  krizSide:G.emps[G.crisisId]?G.emps[G.crisisId].crisisSide:null,",
    "  upK:G.upheaval&&G.upheaval.k, marketEne:G.market&&G.market.mul.ene});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme KAYNAKLARI değiştirmedi', d.resAyni===true);
  ok('yükleme İLİŞKİLERİ değiştirmedi', d.relAyni===true);
  ok('yükleme FİLO/GEMİ sayısını değiştirmedi',
     d.filoAyni===true && d.gemiAyni===true);
  ok('yükleme SİSTEM SAHİPLİĞİNİ değiştirmedi', d.ownAyni===true);
  ok('yükleme NÜFUSU değiştirmedi', d.popAyni===true);
  ok('yükleme BİLDİRİM/EVENT üretmedi', d.log===0, String(d.log));
  ok('85B: 6 yüklemede kalkan TAM 4 kaldı', d.kalkanSabit===true);
  ok('85B: economyTick(true) aylık sistem ilerletmedi',
     d.initSonra===d.oncAy, d.oncAy+' → '+d.initSonra);
  ok('85B: economyTick(false) hâlâ normal ilerliyor', d.aySonra>d.oncAy,
     d.oncAy+' → '+d.aySonra);
  ok('85A: memAge/cncAge/fedUid/sandbox/Konsey korundu',
     d.memAge===137 && d.cncAge===64 && d.fedUid===7 &&
     d.sandbox===true && d.konsey===412);
  ok('85C: aktif kriz korundu ve doğru devlete bağlı',
     d.krizAktif===true && d.krizStage===2 && d.krizTimer===7 &&
     d.krizSide===true);
  ok('85D: kampanya durumu aynı yüklemelerde korundu',
     d.upK==='goc' && d.marketEne===1.34);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
