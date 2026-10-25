#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.4: KARŞILIKLI TEKLİF ŞEKLİ + NAP YOLU
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
 TEMAS, "economyTick(true); return 'ok';"].join('\n');

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
  ok("sw cache = 'stars-v96h3'", /const CACHE = 'stars-v96h3'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  ok('aiProposeTerms kanonik fonksiyonu var', /function aiProposeTerms\(/.test(ai));
  ok('NAP teklif yolu eklendi', /6z\. SALDIRMAZLIK PAKTI/.test(ai) &&
     /aiNegotiate\(e, o, \[\{t:'nap'\}\], \[\],true\)/.test(ai));
  ok('oyuncuya NAP teklifi UI.aiOffer ile gidiyor',
     /UI\.aiOffer\(\{from:e\.id, to:0, give:\[\{t:'nap'\}\]/.test(ai));
  ok('doktrin-kilitli hedef üç yolda da atlanıyor',
     (ai.match(/diploBlocked\(e, o\)\) continue/g)||[]).length===3,
     String((ai.match(/diploBlocked\(e, o\)\) continue/g)||[]).length));
  ok('karşı teklif DELTA olarak değerlendiriliyor (tersi evalOffer YOK)',
     /karşı teklifi DELTA olarak/.test(ai) &&
     !/const tersi = \{from:target\.id/.test(ai));
  /* Fırsat kapıları değişmedi */
  ok('pact fırsat kapısı DEĞİŞMEDİ',
     /rnd\(\) < \.10 \+ prof\.eco\*\.16 \+ \(e\.rel\[o\.id\]\+40\)\/400 \+ luxWant\*\.09/.test(ai));
  ok('ally fırsat kapısı DEĞİŞMEDİ',
     /clamp\(\(e\.rel\[o\.id\]\+30\)\/180 \* prof\.dip \+ \(commonFoe\?\.25:0\), 0, \.7\)/.test(ai));
  ok('86C.3 aiNegotiate mimarisi duruyor', /function aiNegotiate\(/.test(ai));
  ok('86C.2 transaction duruyor',
     /function dealTxBegin\(/.test(oku('diplomacy.js')));
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
    ok(f+' byte-for-byte aynı', (f==='audio.js'?require('./helpers/audio-preservation').isReviewedAudio(fs.readFileSync(path.join(KOK,f))):h===ref[f]), h.slice(0,16));
  });
}

/* ═══ B. KARŞILIKLI TEKLİF ŞEKLİ ═══ */
console.log('\nB. TEKLİF ARTIK KARŞILIK İSTİYOR');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2];A.intel=A.intel||{};B.intel=B.intel||{};A.intel[B.id]=B.intel[A.id]=3;",
    "A.res.etk=9999; A.pact={}; B.pact={};",
    "/* ZENGİN alıcı */",
    "B.res.min=6000; B.res.ene=6000; B.rel[A.id]=40; A.rel[B.id]=40;",
    "var tZengin=aiProposeTerms(A,B,'pact');",
    "var qZ=dealQuote({from:A.id,to:B.id,give:tZengin.give,want:tZengin.want});",
    "var evZ=evalOffer(B,{from:A.id,to:B.id,give:tZengin.give,want:tZengin.want});",
    "/* FAKİR alıcı */",
    "B.res.min=20; B.res.ene=20; B.res.ala=0;",
    "var tFakir=aiProposeTerms(A,B,'pact');",
    "/* SOĞUK ilişki daha çok ister */",
    "B.res.min=6000; B.res.ene=6000;",
    "B.rel[A.id]=-80; A.rel[B.id]=-80;",
    "var tSoguk=aiProposeTerms(A,B,'pact');",
    "B.rel[A.id]=80; A.rel[B.id]=80;",
    "var tDost=aiProposeTerms(A,B,'pact');",
    "/* NAP maliyetsiz → karşılık istenmez */",
    "var tNap=aiProposeTerms(A,B,'nap');",
    "return JSON.stringify({",
    "  zenginWant:tZengin.want.map(function(x){return x.t+':'+x.r+':'+x.v;}),",
    "  zenginQuoteOk:qZ.ok, aliciNet:+evZ.net.toFixed(1),",
    "  aliciCost:+evZ.cost.toFixed(1),",
    "  fakirWant:tFakir.want.map(function(x){return x.t+':'+x.r+':'+x.v;}),",
    "  fakirMiktar:(tFakir.want[0]||{}).v||0,",
    "  sogukMiktar:(tSoguk.want[0]||{}).v||0,",
    "  dostMiktar:(tDost.want[0]||{}).v||0,",
    "  napWant:tNap.want.length, napGive:tNap.give.map(function(x){return x.t;})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('teklif artık KARŞILIK içeriyor (want boş değil)',
     (d.zenginWant||[]).length>0, (d.zenginWant||[]).join(','));
  ok('alıcının maliyeti artık SIFIR DEĞİL', d.aliciCost>0, String(d.aliciCost));
  ok('karşılıklı teklif kanonik quote\'tan geçiyor', d.zenginQuoteOk===true);
  ok('soğuk ilişkide daha çok karşılık isteniyor',
     d.sogukMiktar > d.dostMiktar, d.sogukMiktar+' > '+d.dostMiktar);
  /* Stok 20 → tavan 5 → 10'luk asgari adımın altında: hiç karşılık
     istenmez. Tavanın AŞILMAMASI kritik (yuvarlama hatası düzeltildi). */
  ok('fakir alıcıdan stok tavanı (%25) AŞILMIYOR',
     d.fakirMiktar <= 5, 'istenen '+d.fakirMiktar+' · tavan 5');
  ok('maliyetsiz NAP için karşılık İSTENMİYOR',
     d.napWant===0 && JSON.stringify(d.napGive)==='["nap"]');
}

/* ═══ C. ÜÇ MÜZAKERE SONUCU ═══ */
console.log('\nC. KABUL / RET / KARŞI TEKLİF (karşılıklı şekil)');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2];A.intel=A.intel||{};B.intel=B.intel||{};A.intel[B.id]=B.intel[A.id]=3;",
    "A.res.etk=9999; A.res.min=9000; A.pact={}; B.pact={};",
    "function foto(){ return JSON.stringify({a:A.res,b:B.res,",
    "  pact:JSON.stringify(A.pact||{}), rel:JSON.stringify(A.rel),",
    "  log:(G.log||[]).length, rng:RND_STATE}); }",
    "var out={};",
    "/* 1) ZENGİN + DOST → kabul */",
    "B.res.min=8000; B.res.ene=8000; B.rel[A.id]=50; A.rel[B.id]=50;",
    "var t1=aiProposeTerms(A,B,'pact');",
    "var r1=aiNegotiate(A,B,t1.give,t1.want);",
    "out.zengin={karar:r1.karar, tur:r1.tur, uygulandi:r1.uygulandi};",
    "/* 2) FAKİR alıcı → ret veya karşı teklif */",
    "/* Alıcı ORTA stoklu ama ÇOK soğuk: istek büyük, değer düşük. */",
    "A.pact={}; B.pact={};",
    "B.res.min=400; B.res.ene=50; B.res.ala=0;",
    "B.rel[A.id]=-95; A.rel[B.id]=-95;",
    "var X=foto();",
    "var t2=aiProposeTerms(A,B,'pact');",
    "var r2=aiNegotiate(A,B,t2.give,t2.want);",
    "out.fakir={karar:r2.karar, tur:r2.tur, uygulandi:r2.uygulandi,",
    "  why:(r2.why||'').slice(0,60),",
    "  mutasyonYok:(r2.uygulandi?true:X===foto())};",
    "/* 3) determinizm — ikinci ölçüm AYNI başlangıç durumundan.",
    "   (İlk müzakere başarılıysa antlaşma kurulur ve ikinci çağrı",
    "    doğal olarak redundant döner; bu determinizm ihlali DEĞİLDİR.) */",
    "A.pact={}; B.pact={}; B.res.min=400; B.res.ene=50;",
    "B.rel[A.id]=-95; A.rel[B.id]=-95;",
    "var t3=aiProposeTerms(A,B,'pact');",
    "var r3=aiNegotiate(A,B,t3.give,t3.want);",
    "out.deterministik=(r2.karar===r3.karar && r2.tur===r3.tur &&",
    "  JSON.stringify(t2.want)===JSON.stringify(t3.want));",
    "/* 4) karşı teklif tavanı: aşırı ek reddedilir */",
    "A.pact={}; B.pact={}; B.res.min=8000;",
    "var pactDeg=itemValue(A,{t:'pact'},B);",
    "out.pactDegeri=pactDeg;",
    "out.tavan=Math.round(aiCounterBudget(A,B,{from:A.id,to:B.id,give:[{t:'pact'}],want:[]},[]).cap);",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const Z=d.zengin||{}, F=d.fakir||{};
  ok('zengin + dost alıcı → KABUL', Z.karar==='kabul' && Z.uygulandi===true, Z.karar);
  ok('fakir + soğuk alıcı → ret ya da karşı teklif',
     ['red','karsi-red','karsi-kabul','karsi-gecersiz'].indexOf(F.karar)>=0,
     F.karar+' · '+F.why);
  ok('reddedilen müzakere SIFIR mutasyon bıraktı', F.mutasyonYok===true);
  ok('müzakere DETERMİNİSTİK', d.deterministik===true);
  ok('karşı teklif tavanı antlaşma değerinin %60\'ı',
     d.tavan===Math.round(d.pactDegeri*0.6),
     'pact '+d.pactDegeri+' → tavan '+d.tavan);
}

/* ═══ D. NAP YOLU ═══ */
console.log('\nD. SALDIRMAZLIK PAKTI YOLU');
{
  const H=harness(); H.R(KUR(99));
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2];A.intel=A.intel||{};B.intel=B.intel||{};A.intel[B.id]=B.intel[A.id]=3;",
    "A.nap={}; B.nap={}; A.war[B.id]=false; B.war[A.id]=false;",
    "A.res.etk=9999;",
    "/* NAP kanonik yoldan kurulabiliyor mu */",
    "var t=aiProposeTerms(A,B,'nap');",
    "var q=dealQuote({from:A.id,to:B.id,give:t.give,want:t.want});",
    "var maliyet=q.cost;",
    "var etk0=A.res.etk;",
    "var r1=aiNegotiate(A,B,t.give,t.want);",
    "var kuruldu=!!(A.nap&&A.nap[B.id]>G.day && B.nap&&B.nap[A.id]>G.day);",
    "/* savaşta NAP reddedilmeli */",
    "A.nap={}; B.nap={}; A.war[B.id]=true; B.war[A.id]=true;",
    "var q2=dealQuote({from:A.id,to:B.id,give:[{t:'nap'}],want:[]});",
    "/* yürürlükteki NAP tekrar kurulmamalı */",
    "A.war[B.id]=false; B.war[A.id]=false;",
    "executeDeal({from:A.id,to:B.id,give:[{t:'nap'}],want:[]});",
    "var bitis=A.nap[B.id];",
    "var r2=aiNegotiate(A,B,[{t:'nap'}],[]);",
    "return JSON.stringify({maliyet:maliyet, karar:r1.karar, kuruldu:kuruldu,",
    "  kesinti:etk0-A.res.etk, savastaOk:q2.ok,",
    "  savastaNeden:(q2.reasons||[])[0]||null,",
    "  tekrarKarar:r2.karar, bitisAyni:A.nap[B.id]===bitis});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('NAP kanonik maliyeti 0', d.maliyet===0, String(d.maliyet));
  ok('NAP müzakereyle kuruldu', d.karar==='kabul' && d.kuruldu===true, d.karar);
  ok('NAP Etki kesmedi', d.kesinti===0, String(d.kesinti));
  ok('savaşta NAP REDDEDİLİYOR', d.savastaOk===false, d.savastaNeden);
  ok('yürürlükteki NAP tekrar kurulmuyor, süre uzamıyor',
     d.tekrarKarar==='gecersiz' && d.bitisAyni===true, d.tekrarKarar);
}

/* ═══ E. 3 SEED × 360 AY ═══ */
console.log('\nE. 3 SEED × 360 AY — PAZARLIK VE ANTLAŞMA DAĞILIMI');
{
  const seedler=[11,99,404];
  const ozet=[];
  for(const sd of seedler){
    const H=harness(); H.R(KUR(sd));
    const r=H.R([
      "var say={negot:0,kabul:0,red:0,karsi:0,kk:0,kr:0,gecersiz:0,maxTur:0,bekle:0,napMade:0};",
      "var orgN=aiNegotiate;",
      "globalThis.aiNegotiate=function(p,t,g,w,...extra){ say.negot++; var x=orgN(p,t,g,w,...extra); say.maxTur=Math.max(say.maxTur,x.tur||0);if(x.uygulandi&&g.concat(w).some(it=>it.t==='nap'))say.napMade++;if(x.karar==='bekle')say.bekle++;",
      "  if(x.karar==='kabul') say.kabul++; else if(x.karar==='red') say.red++;",
      "  else if(x.karar==='karsi-kabul'){say.karsi++;say.kk++;}",
      "  else if(x.karar==='karsi-red'||x.karar==='karsi-gecersiz'){say.karsi++;say.kr++;}",
      "  else if(x.karar==='gecersiz') say.gecersiz++; return x; };",
      "var egri=[];",
      "function ortRel(){ var t=0,n=0; var c=G.emps.filter(function(x){return !x.dead&&!x.wild;});",
      "  c.forEach(function(x){ c.forEach(function(y){ if(y.id<=x.id) return;",
      "    t+=(x.rel[y.id]||0); n++; }); }); return n?+(t/n).toFixed(1):0; }",
      "var hata='',nan=false,neg=false;",
      "egri.push([0,ortRel()]);",
      "try{ for(var m=1;m<=360;m++){ G.day+=30; monthTick(); G.over=null;",
      "  if(m%90===0) egri.push([m,ortRel()]); } }catch(ex){hata=ex.message;}",
      "globalThis.aiNegotiate=orgN;",
      "var s=0,p=0,a=0,n=0,c=0;",
      "var canli=G.emps.filter(function(x){return !x.dead&&!x.wild;});",
      "canli.forEach(function(x){ for(var k in x.res){var v=x.res[k];",
      "  if(typeof v==='number'){ if(!isFinite(v))nan=true; if(v<-1)neg=true; } }",
      "  canli.forEach(function(y){ if(y.id<=x.id) return; c++;",
      "  if(x.war[y.id]) s++; if(x.pact&&x.pact[y.id]) p++;",
      "  if(x.ally[y.id]) a++; if(x.nap&&x.nap[y.id]>G.day) n++; }); });",
      "return JSON.stringify({say:say,hata:hata,nan:nan,neg:neg,savas:s,pact:p,",
      "  ally:a,nap:n,cift:c,canli:canli.length,sits:(G.sits||[]).length,egri:egri});"].join('\n'));
    let d={}; try{d=JSON.parse(r);}catch(e){ d={hata:'parse'}; }
    ozet.push({sd,d});
    const s=d.say||{};
    ok('seed '+sd+': 360 ay HATASIZ', d.hata==='', d.hata||'ok');
    ok('seed '+sd+': NaN veya negatif stok YOK', d.nan===false && d.neg===false);
    ok('seed '+sd+': boşa geçersiz müzakere YOK', s.gecersiz===0, String(s.gecersiz));
    /* Aday sırası/RNG izi karar dağılımını değiştirir. Her karar/tur
       burada sayılır; kabul ve ret sözleşmeleri aşağıda gerçek,
       kontrollü teklifler üzerinde ayrı ayrı sınanır. */
    ok('seed '+sd+': her müzakere tek bir sonuçla sayıldı',
       s.negot>0 && s.negot===s.kabul+s.red+s.kk+s.kr+s.gecersiz+s.bekle);
    ok('seed '+sd+': müzakere en çok iki tur', s.maxTur<=2, String(s.maxTur));
    ok('seed '+sd+': kampanyada NAP kuruldu (bitişte süresi dolabilir)', s.napMade>0, s.napMade+' yeni NAP');
    ok('seed '+sd+': galaksi kalıcı savaşa KİLİTLENMEDİ',
       d.savas < d.cift, d.savas+'/'+d.cift);
    ok('seed '+sd+': kalıcı ittifak kilidi yok', d.ally < d.cift,
       d.ally+'/'+d.cift);
    ok('seed '+sd+': Situation tetiklenmedi', d.sits===0, String(d.sits));
    ok('seed '+sd+': imparatorluklar hayatta', d.canli>=2, String(d.canli));
  }
  const toplam=ozet.reduce((t,x)=>({karsi:t.karsi+x.d.say.karsi,
    kk:t.kk+x.d.say.kk,kr:t.kr+x.d.say.kr}),{karsi:0,kk:0,kr:0});
  ok('3 seed toplamında GERÇEK karşı teklif üretildi', toplam.karsi>0);
  console.log('\n  ── SİMÜLASYON TABLOSU ──');
  ozet.forEach(({sd,d})=>{
    const s=d.say||{};
    console.log('  seed '+sd+': müzakere '+s.negot+' → kabul '+s.kabul+
      ' · ret '+s.red+' · karşı '+s.karsi+' (kabul '+s.kk+'/ret '+s.kr+
      ') · geçersiz '+s.gecersiz);
    console.log('            savaş '+d.savas+' pact '+d.pact+' ally '+d.ally+
      ' nap '+d.nap+' (çift '+d.cift+')');
    console.log('            ilişki eğrisi: '+
      (d.egri||[]).map(function(x){return x[0]+'ay='+x[1];}).join(' → '));
  });
}

/* 91C: korsan aday filtresi eski üç aylık fixture'daki karşı teklif
   ret sayısını sıfıra indirdi. Karar oranı ürün sözleşmesi değildir.
   aiRespond/aiNegotiate/executeDeal DEĞİŞTİRİLMEDEN iki dal kurulur;
   kabul işlem yapmalı, ret aynı oyun durumunu bırakmalıdır. */
for(const br of [-95,40]){
  const H=harness();H.R(KUR(99));
  const r=H.R(`
    var A=G.emps[1],B=G.emps[2];A.intel=A.intel||{};B.intel=B.intel||{};A.intel[B.id]=B.intel[A.id]=3;
    for(const e of [A,B]){
      e.mem={};e.war={};e.ally={};e.pact={};e.nap={};
      for(const k in e.res)e.res[k]=10000;
    }
    A.rel[B.id]=-95;B.rel[A.id]=${br};
    function foto(){return JSON.stringify({a:A.res,b:B.res,ap:A.pact,bp:B.pact,
      ar:A.rel,br:B.rel,rng:RND_STATE,log:G.log});}
    var before=foto();
    var r=aiNegotiate(A,B,[{t:'pact'}],[{t:'res',r:'ene',v:100}]);
    return JSON.stringify({karar:r.karar,tur:r.tur,uygulandi:r.uygulandi,
      unchanged:foto()===before,pact:!!(A.pact[B.id]&&B.pact[A.id])});
  `);
  let d={};try{d=JSON.parse(r);}catch(e){}
  if(br===-95)ok('gerçek karşı teklif: bütçe aşımı ret, sıfır mutasyon',
    d.karar==='karsi-red'&&d.tur===2&&d.uygulandi===false&&d.unchanged===true,d.karar);
  else ok('gerçek karşı teklif: bütçe içi kabul ve iki yönlü pakt',
    d.karar==='karsi-kabul'&&d.tur===2&&d.uygulandi===true&&d.pact===true,d.karar);
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
    "var A=JSON.stringify({res:e.res, war:e.war, log:(G.log||[]).length});",
    "G._dealFailInject=function(t){ if(t==='after:cost') throw new Error('e'); };",
    "var rb=executeDeal({from:e.id,to:o.id,give:[{t:'res',r:'min',v:5}],want:[]});",
    "delete G._dealFailInject;",
    "var B=JSON.stringify({res:e.res, war:e.war, log:(G.log||[]).length});",
    "/* oyuncu hâlâ müzakere dışı */",
    "var oy1=aiNegotiate(G.emps[1],G.p,[{t:'pact'}],[]);",
    "return JSON.stringify({cogaltma:cog, toplam:top0===e.res.min+o.res.min,",
    "  bos:bos, bosRel:e.rel[o.id],",
    "  rollback:{ok:rb, geriAlindi:A===B},",
    "  oyuncu:{karar:oy1.karar, uyg:oy1.uygulandi}});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('86B: kaynak çoğaltma KAPALI', d.cogaltma===false && d.toplam===true);
  ok('86B: boş anlaşma KAPALI', d.bos===false && d.bosRel===0);
  ok('86C.2: rollback TAM çalışıyor',
     (d.rollback||{}).ok===false && (d.rollback||{}).geriAlindi===true);
  ok('86C.3: oyuncu AI-AI müzakeresine girmiyor',
     (d.oyuncu||{}).karar===null && (d.oyuncu||{}).uyg===false);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
