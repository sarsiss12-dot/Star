#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.3: AI ↔ AI KARŞILIKLI MÜZAKERE
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
/* Temas kurulmuş galaksi fixture'ı — gerçek keşif yerine tüm
   yaşayan devletler arasında karşılıklı temas kurar. Kuruluş
   DETERMİNİSTİKtir: rnd() kullanmaz, sabit sırada ilerler. */
const TEMAS=[
 "G.emps.forEach(function(x){ G.emps.forEach(function(y){",
 "  if(x.id!==y.id && !x.wild && !y.wild && !x.dead && !y.dead)",
 "    x.contact[y.id]=true; }); });"].join('\n');
const KUR=(seed)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:"+(seed||99)+",ethics:{mil:0,aut:0,mat:0,ahl:0},",
 " civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 TEMAS,
 "economyTick(true); return 'ok';"].join('\n');

/* ═══ A. DOSYA SINIRI VE KARANTİNA ═══ */
console.log('\nA. DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const ai=oku('ai.js'), mn=oku('main.js');
  ok("sw cache = 'stars-v95e'", /const CACHE = 'stars-v95e'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  ok('aiNegotiate kanonik fonksiyonu var', /function aiNegotiate\(/.test(ai));
  /* FAZ 86C.4: teklif artık aiProposeTerms ile KARŞILIKLI kuruluyor;
     çağrı biçimi tp.give/tp.want oldu. Kanonik müzakere yolu aynı. */
  ok('AI-AI pact yolu aiNegotiate + aiProposeTerms kullanıyor',
     /aiProposeTerms\(e, o, 'pact'\)/.test(ai) &&
     /aiNegotiate\(e, o, tp\.give, tp\.want,true\)/.test(ai));
  ok('AI-AI ally yolu aiNegotiate + aiProposeTerms kullanıyor',
     /aiProposeTerms\(e, o, 'ally'\)/.test(ai) &&
     /aiNegotiate\(e, o, ta\.give, ta\.want,true\)/.test(ai));
  ok('AI-AI yolunda DOĞRUDAN executeDeal KALMADI',
     !/executeDeal\(\{from:e\.id, to:o\.id, give:\[\{t:'(pact|ally)'\}\]/.test(ai));
  ok('aiNegotiate oyuncuyu hedef almıyor (kod güvencesi)',
     /proposer\.id === 0 \|\| target\.id === 0/.test(ai));
  ok('oyuncuya giden teklif yolu UI.aiOffer olarak KORUNDU',
     /UI\.aiOffer\(\{from:e\.id, to:0/.test(ai));
  ok('86C.2 transaction mimarisi duruyor',
     /function dealTxBegin\(/.test(oku('diplomacy.js')) &&
     /function dealPostcondition\(/.test(oku('diplomacy.js')));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
}
{
  /* FAZ 86C.4H: map.js ve main.js bu hotfix'te DEĞİŞİYOR
     (pointer yaşam döngüsü + yükleme sonrası kurtarma), bu
     yüzden korunan kümeden çıkarıldılar. */
  /* FAZ 86C.4H-R1: ui.js bu turda DEĞİŞİYOR (mapFix kanonik
     sırası), korunan kümeden çıkarıldı. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json',
   'map.js'].forEach(f=>{
    // 91D: bütün map.js yerine değişmemesi gereken altyapı bölümleri kilitli.
    if(f==='map.js'){ok('map altyapısı sabit; hedef seçimi 93A referansında',
      require('./helpers/map-preservation').isMapInfrastructurePreserved(oku(f)));return;}
    if(!ref||!ref[f]){ ok(f+' referansı var', false); return; }
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
}

/* ═══ B. ÜÇ MÜZAKERE SENARYOSU ═══ */
console.log('\nB. KABUL / RET / KARŞI TEKLİF');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2];A.intel=A.intel||{};B.intel=B.intel||{};A.intel[B.id]=B.intel[A.id]=3;",
    "A.res.etk=9999; A.res.min=9000; B.res.min=9000; B.res.ene=9000;",
    "function foto(){ return JSON.stringify({a:A.res,b:B.res,",
    "  pact:JSON.stringify(A.pact||{}), rel:JSON.stringify(A.rel),",
    "  ally:JSON.stringify(A.ally), log:(G.log||[]).length, rng:RND_STATE}); }",
    "var out={};",
    "A.pact={}; B.pact={};",
    "/* 1) CÖMERT → kabul */",
    "var X0=foto();",
    "var r1=aiNegotiate(A,B,[{t:'res',r:'min',v:4000}],[{t:'res',r:'ene',v:50}]);",
    "out.comert={karar:r1.karar, tur:r1.tur, uygulandi:r1.uygulandi,",
    "  degisti:X0!==foto()};",
    "/* 2) KÖTÜ → ret, sıfır mutasyon */",
    "var X1=foto();",
    "var r2=aiNegotiate(A,B,[{t:'res',r:'min',v:1}],[{t:'res',r:'ene',v:5000}]);",
    "out.kotu={karar:r2.karar, tur:r2.tur, uygulandi:r2.uygulandi,",
    "  why:(r2.why||'').slice(0,50), mutasyonYok:X1===foto()};",
    "/* 3) YAKIN → karşı teklif */",
    "var X2=foto();",
    "var r3=aiNegotiate(A,B,[{t:'res',r:'min',v:300}],[{t:'res',r:'ene',v:600}]);",
    "out.yakin={karar:r3.karar, tur:r3.tur, uygulandi:r3.uygulandi,",
    "  karsiSayi:(r3.karsi||[]).length,",
    "  karsi:(r3.karsi||[]).map(function(x){return x.t;}).join(','),",
    "  why:(r3.why||'').slice(0,50),",
    "  redSonrasiMutasyonYok:(r3.uygulandi?true:X2===foto())};",
    "/* 4) determinizm: aynı girdi aynı sonuç */",
    "var r4=aiNegotiate(A,B,[{t:'res',r:'min',v:300}],[{t:'res',r:'ene',v:600}]);",
    "out.deterministik=(r3.karar===r4.karar && r3.tur===r4.tur);",
    "/* 5) geçersiz teklif → gecersiz, sıfır mutasyon */",
    "var X3=foto();",
    "var r5=aiNegotiate(A,B,[{t:'ZEHIR'}],[]);",
    "out.gecersiz={karar:r5.karar, tur:r5.tur, mutasyonYok:X3===foto(),",
    "  why:(r5.why||'').slice(0,45)};",
    "/* 6) oyuncu ASLA hedef alınmaz */",
    "var X4=foto();",
    "var r6=aiNegotiate(A,G.p,[{t:'pact'}],[]);",
    "var r7=aiNegotiate(G.p,A,[{t:'pact'}],[]);",
    "out.oyuncu={hedef:{karar:r6.karar,tur:r6.tur,uyg:r6.uygulandi},",
    "  kaynak:{karar:r7.karar,tur:r7.tur,uyg:r7.uygulandi},",
    "  mutasyonYok:X4===foto()};",
    "out.maxTur=Math.max(r1.tur,r2.tur,r3.tur,r5.tur);",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const C=d.comert||{}, K=d.kotu||{}, Y=d.yakin||{}, GZ=d.gecersiz||{}, O=d.oyuncu||{};
  ok('cömert teklif → KABUL ve uygulandı',
     C.karar==='kabul' && C.uygulandi===true && C.degisti===true);
  ok('kötü teklif → RET (alıcı gerçekten reddedebiliyor)',
     K.karar==='red' && K.uygulandi===false, K.why);
  ok('ret gerekçesi anlamlı', (K.why||'').length>10, K.why);
  ok('reddedilen teklif SIFIR mutasyon bıraktı', K.mutasyonYok===true);
  ok('yakın teklif → KARŞI TEKLİF turu açıldı',
     Y.tur===2 && Y.karsiSayi>0, Y.karar+' · ek: '+Y.karsi);
  ok('karşı teklif sonucu net (kabul veya ret)',
     ['karsi-kabul','karsi-red','karsi-gecersiz'].indexOf(Y.karar)>=0, Y.karar);
  ok('karşı teklif reddedilirse mutasyon yok',
     Y.redSonrasiMutasyonYok===true);
  ok('EN FAZLA İKİ TUR — sonsuz döngü yok', d.maxTur<=2, 'maxTur '+d.maxTur);
  ok('müzakere DETERMİNİSTİK', d.deterministik===true);
  ok('geçersiz teklif müzakereye girmeden reddedildi',
     GZ.karar==='gecersiz' && GZ.tur===0 && GZ.mutasyonYok===true, GZ.why);
  ok('oyuncu HEDEF olarak alınmıyor',
     O.hedef && O.hedef.karar===null && O.hedef.uyg===false);
  ok('oyuncu KAYNAK olarak da alınmıyor',
     O.kaynak && O.kaynak.karar===null && O.kaynak.uyg===false);
  ok('oyuncu denemeleri sıfır mutasyon bıraktı', O.mutasyonYok===true);
}

/* ═══ C. TEMAS FIXTURE'I ═══ */
console.log('\nC. TEMAS FIXTURE\'I DETERMİNİSTİK Mİ');
{
  const H=harness();
  const r=H.R(["setupGame({name:'T',race:'insan',traits:[],size:'buyuk',",
    " shape:'sarmal',diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},",
    " civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "View.init(); View.vw=900; View.vh=420; View.cv=document.getElementById('map');",
    "var canli=G.emps.filter(function(x){return !x.dead&&!x.wild;});",
    "var once=0;",
    "canli.forEach(function(x){ canli.forEach(function(y){",
    "  if(y.id>x.id && x.contact[y.id]) once++; }); });",
    "var wildOnce=G.emps.filter(function(x){return x.wild;}).map(function(x){",
    "  return Object.keys(x.contact||{}).length;}).join(',');",
    "var rng0=RND_STATE;",
    TEMAS,
    "var sonra=0;",
    "canli.forEach(function(x){ canli.forEach(function(y){",
    "  if(y.id>x.id && x.contact[y.id]) sonra++; }); });",
    "var cift=canli.length*(canli.length-1)/2;",
    "return JSON.stringify({once:once, sonra:sonra, cift:cift,",
    "  rngAyni:RND_STATE===rng0, wildOnce:wildOnce,",
    "  wildSonra:G.emps.filter(function(x){return x.wild;}).map(function(x){",
    "    return Object.keys(x.contact||{}).length;}).join(',')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ÖLÇÜM: oyun başında AI-AI teması sıfıra yakın', d.once===0, String(d.once));
  ok('fixture tüm yaşayan çiftlerde temas kurdu',
     d.sonra===d.cift, d.sonra+'/'+d.cift);
  ok('fixture RNG TÜKETMEDİ (deterministik)', d.rngAyni===true);
  /* Korsanların BAŞLANGIÇTA teması olabilir (oyun kurulumu). Ölçülen
     şey fixture'ın korsan temasını DEĞİŞTİRMEMESİ. */
  ok('fixture korsan temasını DEĞİŞTİRMEDİ',
     d.wildOnce===d.wildSonra, d.wildOnce+' → '+d.wildSonra);
}

/* ═══ D. 3 SEED × 360 AY SİMÜLASYON ═══ */
console.log('\nD. 3 SEED × 360 AY AI–AI DİPLOMASİ');
{
  const seedler=[11,99,404];
  const ozet=[];
  for(const sd of seedler){
    const H=harness(); H.R(KUR(sd));
    const r=H.R([
      "var say={negot:0,kabul:0,red:0,karsi:0,karsiKabul:0,karsiRed:0,",
      "  gecersiz:0,exec:0,execFail:0};",
      "var orgN=aiNegotiate, orgE=executeDeal;",
      "globalThis.aiNegotiate=function(p,t,g,w,...extra){ say.negot++; var x=orgN(p,t,g,w,...extra);",
      "  if(x.karar==='kabul') say.kabul++;",
      "  else if(x.karar==='red') say.red++;",
      "  else if(x.karar==='karsi-kabul'){ say.karsi++; say.karsiKabul++; }",
      "  else if(x.karar==='karsi-red'||x.karar==='karsi-gecersiz'){",
      "    say.karsi++; say.karsiRed++; }",
      "  else if(x.karar==='gecersiz') say.gecersiz++;",
      "  return x; };",
      "globalThis.executeDeal=function(o){ var x=orgE(o);",
      "  if(x) say.exec++; else say.execFail++; return x; };",
      "var hata='', nan=false, neg=false;",
      "var t0=Date.now();",
      "try{ for(var m=0;m<360;m++){ G.day+=30; monthTick(); G.over=null; } }",
      "catch(ex){ hata=ex.message; }",
      "var sureMs=Date.now()-t0;",
      "globalThis.aiNegotiate=orgN; globalThis.executeDeal=orgE;",
      "var savas=0,pact=0,ally=0,nap=0,relT=0,relN=0,cift=0;",
      "var canli=G.emps.filter(function(x){return !x.dead&&!x.wild;});",
      "canli.forEach(function(x){",
      "  for(var k in x.res){ var v=x.res[k];",
      "    if(typeof v==='number'){ if(!isFinite(v)) nan=true; if(v<-1) neg=true; } }",
      "  canli.forEach(function(y){ if(y.id<=x.id) return; cift++;",
      "    if(x.war[y.id]) savas++;",
      "    if(x.pact&&x.pact[y.id]) pact++;",
      "    if(x.ally[y.id]) ally++;",
      "    if(x.nap&&x.nap[y.id]>G.day) nap++;",
      "    relT+=(x.rel[y.id]||0); relN++; }); });",
      "return JSON.stringify({say:say, hata:hata, nan:nan, neg:neg,",
      "  savas:savas, pact:pact, ally:ally, nap:nap, cift:cift,",
      "  ortRel:relN?+(relT/relN).toFixed(1):0, sits:(G.sits||[]).length,",
      "  canli:canli.length, sureMs:sureMs, ayMs:+(sureMs/360).toFixed(1)});"].join('\n'));
    let d={}; try{d=JSON.parse(r);}catch(e){ d={hata:'parse'}; }
    ozet.push({sd,d});
    const s=d.say||{};
    ok('seed '+sd+': 360 ay HATASIZ', d.hata==='', d.hata||'ok');
    ok('seed '+sd+': AI–AI müzakere GERÇEKTEN çalıştı',
       s.negot>0, s.negot+' müzakere');
    ok('seed '+sd+': her müzakere kanonik executeDeal\'e düşmedi',
       s.exec<=s.negot, 'negot '+s.negot+' exec '+s.exec);
    ok('seed '+sd+': NaN veya negatif stok YOK', d.nan===false && d.neg===false);
    ok('seed '+sd+': galaksi kalıcı savaşa KİLİTLENMEDİ',
       d.savas < d.cift, d.savas+'/'+d.cift);
    ok('seed '+sd+': galaksi kalıcı ittifaka KİLİTLENMEDİ',
       d.ally < d.cift, d.ally+'/'+d.cift);
    ok('seed '+sd+': Situation tetiklenmedi', d.sits===0, String(d.sits));
    ok('seed '+sd+': imparatorluklar hayatta', d.canli>=2, String(d.canli));
  }
  console.log('\n  ── SİMÜLASYON TABLOSU (temas fixture\'ı) ──');
  ozet.forEach(({sd,d})=>{
    const s=d.say||{};
    console.log('  seed '+sd+': müzakere '+s.negot+' → kabul '+s.kabul+
      ' · ret '+s.red+' · karşı '+s.karsi+' (kabul '+s.karsiKabul+
      '/ret '+s.karsiRed+') · geçersiz '+s.gecersiz);
    console.log('            exec ok '+s.exec+' / red '+s.execFail+
      ' | savaş '+d.savas+' pact '+d.pact+' ally '+d.ally+' nap '+d.nap+
      ' (çift '+d.cift+') · ort.ilişki '+d.ortRel+' · '+d.ayMs+' ms/ay');
  });
}

/* ═══ E. PERFORMANS ═══ */
console.log('\nE. TRANSACTION PERFORMANSI');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var e=G.p,o=G.emps[1]; e.res.etk=99999; e.res.min=99999;",
    "var t0=Date.now();",
    "for(var i=0;i<200;i++){ o.res.min=0;",
    "  executeDeal({from:e.id,to:o.id,give:[{t:'res',r:'min',v:1}],want:[]}); }",
    "var execMs=Date.now()-t0;",
    "var t1=Date.now();",
    "for(var j=0;j<200;j++) dealQuote({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:1}],want:[]});",
    "var quoteMs=Date.now()-t1;",
    "return JSON.stringify({execTekMs:+(execMs/200).toFixed(2),",
    "  quoteTekMs:+(quoteMs/200).toFixed(3),",
    "  sys:G.sys.length, filo:G.fleets.length, emp:G.emps.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('tek transaction makul sürede (< 20 ms)',
     d.execTekMs < 20, d.execTekMs+' ms');
  ok('saf quote transaction\'dan belirgin ucuz',
     d.quoteTekMs < d.execTekMs, d.quoteTekMs+' ms vs '+d.execTekMs+' ms');
  console.log('  ── PERFORMANS: transaction '+d.execTekMs+' ms · quote '+
    d.quoteTekMs+' ms · '+d.sys+' sistem, '+d.filo+' filo, '+d.emp+' devlet');
}

/* ═══ F. ÖNCEKİ FAZ REGRESYONLARI ═══ */
console.log('\nF. ÖNCEKİ FAZ REGRESYONLARI');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; o.res.min=500; e.res.etk=9999;",
    "var top0=e.res.min+o.res.min;",
    "var cog=executeDeal({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:800},{t:'res',r:'min',v:800}],want:[]});",
    "e.rel[o.id]=0; o.rel[e.id]=0;",
    "var bos=executeDeal({from:e.id,to:o.id,give:[],want:[]});",
    "e.nap={}; o.nap={};",
    "var n1=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "var n2=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "/* 86C.2 rollback hâlâ çalışıyor mu */",
    "var A=JSON.stringify({res:e.res, war:e.war, log:(G.log||[]).length});",
    "G._dealFailInject=function(t){ if(t==='after:cost') throw new Error('e'); };",
    "var rb=executeDeal({from:e.id,to:o.id,give:[{t:'res',r:'min',v:5}],want:[]});",
    "delete G._dealFailInject;",
    "var B=JSON.stringify({res:e.res, war:e.war, log:(G.log||[]).length});",
    "return JSON.stringify({cogaltma:cog, toplam:top0===e.res.min+o.res.min,",
    "  bos:bos, bosRel:e.rel[o.id], nap:[n1,n2],",
    "  rollback:{ok:rb, geriAlindi:A===B}});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('86B: kaynak çoğaltma KAPALI', d.cogaltma===false && d.toplam===true);
  ok('86B: boş anlaşma KAPALI', d.bos===false && d.bosRel===0);
  ok('86B: yürürlükteki antlaşma farm\'ı KAPALI',
     JSON.stringify(d.nap)==='[true,false]');
  ok('86C.2: rollback hâlâ TAM çalışıyor',
     (d.rollback||{}).ok===false && (d.rollback||{}).geriAlindi===true);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
