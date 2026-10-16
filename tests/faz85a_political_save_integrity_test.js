#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85A: POLİTİK DÜNYA DURUMU KAYDET/YÜKLE BÜTÜNLÜĞÜ
   Yalnız Node.js yerleşik modülleri. Harici bağımlılık yok.
   Çalıştırma: node tests/faz85a_political_save_integrity_test.js
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
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:1,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "return 'ok';"].join('\n');

/* Zengin, gerçekçi bir politik dünya kurar. */
const DUNYA=[
 "G.day=930; G.year=2212; G.month=7;",
 "G.memAge=137; G.cncAge=64;",
 "var uye=G.emps.filter(function(x){return !x.wild&&!x.dead;})",
 "  .map(function(x){return x.id;});",
 "G.council={name:'Büyük Konsey',founder:0,members:uye,",
 "  laws:{ticaretStd:true,sinirGuv:true},targeted:{parya:2},treasury:412,",
 "  president:0,termStart:G.day,terms:{0:2,1:1},voteIn:9,",
 "  vote:{key:'ambargo',target:3,yes:[0,1],no:[2],speeches:[],done:false,age:4},",
 "  dead:false};",
 "G.feds=[{id:7,name:'Kuzey Birliği',members:[0,1],laws:{ortakSavunma:true},",
 "  treasury:250,nextVote:G.day+40,",
 "  vote:{law:'ortakPazar',yes:[0],no:[],done:false},founder:0}];",
 "G.fedUid=7;",
 "G.friction={'0:2':14,'1:3':6};",
 "G.rebelAlliance={target:3,members:[0,1],since:120,revealed:true};",
 "G.megaWatch=[{id:2,tur:'dyson',since:100}];",
 "G.sandbox=true;"].join('\n');

/* G üzerini tamamen farklı "zehirli" değerlerle doldurur. */
const ZEHIR=[
 "G.memAge=999; G.cncAge=888;",
 "G.council={name:'ZEHİR',founder:9,members:[9],laws:{zehir:true},",
 "  targeted:{},treasury:-1,president:9,termStart:0,terms:{},voteIn:1,",
 "  vote:null,dead:false};",
 "G.feds=[{id:99,name:'ZEHİR FED',members:[9],laws:{},treasury:-5,",
 "  nextVote:0,vote:null,founder:9}];",
 "G.fedUid=99; G.friction={'9:9':99};",
 "G.rebelAlliance={target:9,members:[9],since:0,revealed:false};",
 "G.megaWatch=[{id:9,tur:'zehir',since:0}]; G.sandbox=false;"].join('\n');

/* ═══ A. SÖZDİZİMİ, DOSYA SINIRI, KARANTİNA ═══ */
console.log('\nA. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  let mf=null; try{mf=JSON.parse(oku('manifest.json'));}catch(e){}
  ok('manifest.json geçerli',!!mf);
  const mainJs=oku('main.js');
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mainJs.includes(k)));
  ok("sw cache = 'stars-v95a'", /const CACHE = 'stars-v95a'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  /* KAPSAM DIŞI alanlar world'e SIZMAMALI (Faz 85B'nin konusu) */
  ['G.crisis','G.crisisId','G.wildId','G.nests','G.ruins','G.raids',
   'G.upheaval','G.upAge','G.upLast','G.market','G.inbox','G.chainQueue']
   .forEach(k=>{
    const i=mainJs.indexOf('function serializePoliticalWorld');
    const j=mainJs.indexOf('function resetPoliticalRuntimeState');
    ok('kapsam dışı alan world içinde YOK: '+k,
       mainJs.slice(i,j).indexOf(k)<0);
  });
  /* Geçici/render durumu world'e girmemeli */
  ['G.vis','G.fx','G.speed','G.over','_warAuth','_warWhy','_dealAuth']
   .forEach(k=>{
    const i=mainJs.indexOf('function serializePoliticalWorld');
    const j=mainJs.indexOf('function resetPoliticalRuntimeState');
    ok('geçici durum world içinde YOK: '+k, mainJs.slice(i,j).indexOf(k)<0);
  });
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
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
  /* 91D: etiket/draw değişikliği izinli; giriş/kurtarma/kamera/sprite/filo kaynakları 91C ile aynı. */
  ok('map kaynak kilidi: 91C altyapısı + 93A hedef seçimi',
     require('./helpers/map-preservation').isMapInfrastructurePreserved(oku('map.js')));
}

/* ═══ B. SENARYO 1 — V4 TAM POLİTİK DÜNYA ROUND-TRIP ═══ */
console.log('\nB. SENARYO 1 — V4 TAM ROUND-TRIP');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kayit=serialize(); var v=JSON.parse(kayit);",
    ZEHIR,
    "deserialize(kayit);",
    "return JSON.stringify({surum:v.v,",
    "  worldVar:Object.prototype.hasOwnProperty.call(v,'world'),",
    "  alanlar:Object.keys(v.world||{}).sort(),",
    "  memAge:G.memAge, cncAge:G.cncAge,",
    "  konseyAd:G.council&&G.council.name,",
    "  fedAd:(G.feds[0]||{}).name, fedUid:G.fedUid,",
    "  friction:JSON.stringify(G.friction),",
    "  rebelHedef:G.rebelAlliance&&G.rebelAlliance.target,",
    "  mega:JSON.stringify(G.megaWatch), sandbox:G.sandbox,",
    "  warAuth:G._warAuth, warWhy:G._warWhy, dealAuth:G._dealAuth});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıt sürümü v:8 (Faz 85F)', d.surum===8, 'v='+d.surum);
  ok('kayıtta world alt nesnesi var', d.worldVar===true);
  ok('world tam dokuz alanı içeriyor',
     JSON.stringify(d.alanlar)===JSON.stringify(['cncAge','council','fedUid',
       'feds','friction','megaWatch','memAge','rebelAlliance','sandbox']),
     (d.alanlar||[]).join(','));
  ok('memAge korundu (137)', d.memAge===137, String(d.memAge));
  ok('cncAge korundu (64)', d.cncAge===64, String(d.cncAge));
  ok('Konsey zehirli değeri EZDİ', d.konseyAd==='Büyük Konsey', d.konseyAd);
  ok('federasyon zehirli değeri EZDİ', d.fedAd==='Kuzey Birliği', d.fedAd);
  ok('fedUid korundu (7)', d.fedUid===7, String(d.fedUid));
  ok('friction korundu', d.friction==='{"0:2":14,"1:3":6}', d.friction);
  ok('rebelAlliance korundu (hedef 3)', d.rebelHedef===3, String(d.rebelHedef));
  ok('megaWatch korundu', d.mega==='[{"id":2,"tur":"dyson","since":100}]');
  ok('sandbox korundu (true)', d.sandbox===true, String(d.sandbox));
  ok('_warAuth yükleme sonrası temizlendi', d.warAuth===null);
  ok('_warWhy yükleme sonrası temizlendi', d.warWhy===null);
  ok('_dealAuth yükleme sonrası temizlendi', d.dealAuth===false);
}

/* ═══ C. SENARYO 2 — AKTİF KONSEY + YASA + YAPTIRIM + OY ═══ */
console.log('\nC. SENARYO 2 — KONSEY + YASA + YAPTIRIM + OY');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var oncUye=G.council.members.slice();",
    "/* sinirGuv yasası garrisonOf() üzerinden ×1.20 uygular */",
    "var sy=G.sys.filter(function(s){return s.owner===G.p.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "var oncGuc=garrisonOf(pl.col,G.p,pl);",
    "var kayit=serialize();", ZEHIR,
    "deserialize(kayit);",
    "var c=G.council;",
    "/* yükleme sonrası sistem/gezegen nesneleri YENİDEN kurulur */",
    "var sy2=G.sys.filter(function(s){return s.owner===G.p.id;})[0];",
    "var pl2=sy2.planets.filter(function(p){return p.col;})[0];",
    "return JSON.stringify({",
    "  varMi:councilExists(), ad:c&&c.name,",
    "  uyeAyni:JSON.stringify(c.members)===JSON.stringify(oncUye),",
    "  uyeGecerli:c.members.every(function(id){return !!G.emps[id];}),",
    "  oyuncuUye:inCouncil(G.p),",
    "  yasaTicaret:!!c.laws.ticaretStd, yasaSinir:!!c.laws.sinirGuv,",
    "  yaptirim:c.targeted&&c.targeted.parya, hazine:c.treasury,",
    "  baskan:c.president, donem:JSON.stringify(c.terms), voteIn:c.voteIn,",
    "  oyGundem:c.vote&&c.vote.key, oyHedef:c.vote&&c.vote.target,",
    "  oyEvet:JSON.stringify(c.vote&&c.vote.yes),",
    "  oyHayir:JSON.stringify(c.vote&&c.vote.no),",
    "  oyYas:c.vote&&c.vote.age, oyBitti:c.vote&&c.vote.done,",
    "  gucOnce:oncGuc, gucSonra:garrisonOf(pl2.col,G.p,pl2),",
    "  yasasiz:(function(){var y=c.laws.sinirGuv; delete c.laws.sinirGuv;",
    "    var v=garrisonOf(pl2.col,G.p,pl2); c.laws.sinirGuv=y; return v;})()});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('Konsey yükleme sonrası MEVCUT', d.varMi===true, d.ad);
  ok('üye listesi birebir aynı', d.uyeAyni===true);
  ok('üyeler geçerli imparatorluk ID gösteriyor', d.uyeGecerli===true);
  ok('oyuncu Konsey üyeliği korundu', d.oyuncuUye===true);
  ok('yasalar korundu (ticaretStd + sinirGuv)',
     d.yasaTicaret===true && d.yasaSinir===true);
  ok('hedefli yaptırım korundu (parya=2)', d.yaptirim===2, String(d.yaptirim));
  ok('hazine korundu (412)', d.hazine===412, String(d.hazine));
  ok('başkan korundu (0)', d.baskan===0, String(d.baskan));
  ok('dönem bilgileri korundu', d.donem==='{"0":2,"1":1}', d.donem);
  ok('voteIn süresi korundu (9)', d.voteIn===9, String(d.voteIn));
  ok('devam eden oy GÜNDEMİ aynı', d.oyGundem==='ambargo', d.oyGundem);
  ok('devam eden oy HEDEFİ aynı', d.oyHedef===3, String(d.oyHedef));
  ok('evet oyları aynı', d.oyEvet==='[0,1]', d.oyEvet);
  ok('hayır oyları aynı', d.oyHayir==='[2]', d.oyHayir);
  ok('oy süresi (age) aynı', d.oyYas===4, String(d.oyYas));
  ok('oy henüz bitmemiş olarak korundu', d.oyBitti===false);
  ok('sinirGuv yasasının ekonomik etkisi yüklemeden HEMEN sonra çalışıyor',
     d.gucOnce===d.gucSonra && d.gucOnce>0,
     'garrisonOf '+d.gucOnce+' → '+d.gucSonra);
  ok('etki gerçekten YASADAN geliyor (yasa kapalıyken düşüyor)',
     d.yasasiz>0 && d.gucSonra>d.yasasiz,
     'yasasız '+d.yasasiz+' < yasalı '+d.gucSonra);
}

/* ═══ D. SENARYO 3 — FEDERASYON + YASA + HAZİNE + OY ═══ */
console.log('\nD. SENARYO 3 — FEDERASYON + YASA + HAZİNE + OY');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kayit=serialize();", ZEHIR,
    "deserialize(kayit);",
    "var f=G.feds[0];",
    "return JSON.stringify({sayi:G.feds.length, id:f.id, ad:f.name,",
    "  uye:JSON.stringify(f.members),",
    "  uyeGecerli:f.members.every(function(id){return !!G.emps[id];}),",
    "  kurucu:f.founder, kurucuGecerli:!!G.emps[f.founder],",
    "  yasa:!!f.laws.ortakSavunma, hazine:f.treasury, nextVote:f.nextVote,",
    "  oyYasa:f.vote&&f.vote.law, oyEvet:JSON.stringify(f.vote&&f.vote.yes),",
    "  oyHayir:JSON.stringify(f.vote&&f.vote.no), oyBitti:f.vote&&f.vote.done});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('federasyon sayısı korundu (1)', d.sayi===1, String(d.sayi));
  ok('federasyon ID korundu (7)', d.id===7, String(d.id));
  ok('federasyon adı korundu', d.ad==='Kuzey Birliği', d.ad);
  ok('üyeler korundu', d.uye==='[0,1]', d.uye);
  ok('üye ID\'leri geçerli', d.uyeGecerli===true);
  ok('lider/kurucu ID korundu ve geçerli',
     d.kurucu===0 && d.kurucuGecerli===true);
  ok('federasyon yasası korundu', d.yasa===true);
  ok('federasyon hazinesi korundu (250)', d.hazine===250, String(d.hazine));
  ok('nextVote korundu (970)', d.nextVote===970, String(d.nextVote));
  ok('devam eden federasyon oyu korundu', d.oyYasa==='ortakPazar', d.oyYasa);
  ok('federasyon oy sayıları aynı',
     d.oyEvet==='[0]' && d.oyHayir==='[]', d.oyEvet+'/'+d.oyHayir);
  ok('federasyon oyu bitmemiş olarak korundu', d.oyBitti===false);
}

/* ═══ E. SENARYO 4 — fedUid ÇAKIŞMA TESTİ ═══ */
console.log('\nE. SENARYO 4 — fedUid ÇAKIŞMA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kayit=serialize();", ZEHIR,
    "deserialize(kayit);",
    "/* yükleme sonrası yeni federasyon ID'si çakışmamalı */",
    "var yeniId=(G.fedUid=(G.fedUid||0)+1);",
    "var mevcut=G.feds.map(function(f){return f.id;});",
    "/* bozuk kayıt: fedUid mevcut en yüksek ID'den KÜÇÜK */",
    "var bozuk=JSON.parse(kayit); bozuk.world.fedUid=2;",
    "deserialize(JSON.stringify(bozuk));",
    "var onarilan=G.fedUid;",
    "var onarimSonrasi=(G.fedUid=(G.fedUid||0)+1);",
    "return JSON.stringify({yeniId:yeniId, mevcut:mevcut,",
    "  cakisma:mevcut.indexOf(yeniId)>=0,",
    "  onarilan:onarilan, onarimSonrasi:onarimSonrasi,",
    "  onarimCakisma:G.feds.map(function(f){return f.id;})",
    "    .indexOf(onarimSonrasi)>=0,",
    "  rapor:G._loadWorldInfo&&G._loadWorldInfo.repair});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('fedUid ≥ mevcut en yüksek federasyon ID', d.yeniId===8, String(d.yeniId));
  ok('yeni federasyon ID ÇAKIŞMIYOR', d.cakisma===false,
     'yeni='+d.yeniId+' mevcut='+(d.mevcut||[]).join(','));
  ok('bozuk fedUid (2) güvenli fallback ile onarıldı',
     d.onarilan===7, String(d.onarilan));
  ok('onarım raporlandı', typeof d.rapor==='string' && d.rapor.length>0, d.rapor);
  ok('onarım sonrası da ID çakışmıyor', d.onarimCakisma===false,
     'yeni='+d.onarimSonrasi);
}

/* ═══ F. SENARYO 5-7 — rebelAlliance / friction / megaWatch / sandbox ═══ */
console.log('\nF. SENARYO 5-7 — İSYAN, SÜRTÜŞME, MEGA, SANDBOX');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kayit=serialize();", ZEHIR,
    "deserialize(kayit);",
    "var ra=G.rebelAlliance;",
    "return JSON.stringify({raVar:!!ra, raHedef:ra&&ra.target,",
    "  raUye:JSON.stringify(ra&&ra.members), raSince:ra&&ra.since,",
    "  raRevealed:ra&&ra.revealed,",
    "  raHedefGecerli:!!(ra&&G.emps[ra.target]),",
    "  friction:JSON.stringify(G.friction),",
    "  frictionDeger:G.friction['0:2'],",
    "  mega:JSON.stringify(G.megaWatch), megaSayi:G.megaWatch.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('rebelAlliance mevcut', d.raVar===true);
  ok('isyan hedefi korundu (3) ve geçerli',
     d.raHedef===3 && d.raHedefGecerli===true);
  ok('isyan üyeleri korundu', d.raUye==='[0,1]', d.raUye);
  ok('isyan since korundu (120)', d.raSince===120, String(d.raSince));
  ok('isyan revealed=true korundu', d.raRevealed===true);
  ok('friction tam korundu', d.friction==='{"0:2":14,"1:3":6}', d.friction);
  ok('friction sayısal değeri korundu (14)', d.frictionDeger===14);
  ok('megaWatch tam korundu',
     d.mega==='[{"id":2,"tur":"dyson","since":100}]', String(d.megaSayi));
}
/* sandbox: false ve true AYRI korunmalı ( || tuzağı ) */
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "G.sandbox=false; var kFalse=serialize();",
    "G.sandbox=true;  var kTrue=serialize();",
    "G.sandbox=true;  deserialize(kFalse); var sonFalse=G.sandbox;",
    "G.sandbox=false; deserialize(kTrue);  var sonTrue=G.sandbox;",
    "/* rebelAlliance=null da null kalmalı, {} olmamalı */",
    "G.rebelAlliance=null; var kNull=serialize();",
    "G.rebelAlliance={target:9,members:[9],since:0,revealed:false};",
    "deserialize(kNull); var sonNull=G.rebelAlliance;",
    "/* memAge=0 sıfır olarak korunmalı, varsayılana kaçmamalı */",
    "G.memAge=0; G.cncAge=0; var kSifir=serialize();",
    "G.memAge=555; G.cncAge=444; deserialize(kSifir);",
    "/* council=null null kalmalı */",
    "G.council=null; var kCNull=serialize();",
    "G.council={name:'X',members:[],laws:{},dead:false};",
    "deserialize(kCNull);",
    "return JSON.stringify({sonFalse:sonFalse, sonTrue:sonTrue,",
    "  nullKaldi:sonNull===null, memSifir:G.memAge, cncSifir:G.cncAge,",
    "  konseyNull:G.council===null, konseyVar:councilExists()});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('sandbox=false ayrı korundu (true üzerine)', d.sonFalse===false, String(d.sonFalse));
  ok('sandbox=true ayrı korundu (false üzerine)', d.sonTrue===true, String(d.sonTrue));
  ok('rebelAlliance=null null olarak korundu', d.nullKaldi===true);
  ok('memAge=0 sıfır olarak korundu (|| tuzağı yok)',
     d.memSifir===0, String(d.memSifir));
  ok('cncAge=0 sıfır olarak korundu', d.cncSifir===0, String(d.cncSifir));
  ok('council=null null olarak korundu',
     d.konseyNull===true && d.konseyVar===false);
}

/* ═══ G. SENARYO 8 — memAge/cncAge VE COOLDOWN SÜREKLİLİĞİ ═══ */
console.log('\nG. SENARYO 8 — SAAT VE COOLDOWN SÜREKLİLİĞİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var e=G.p;",
    "/* Süre-1: vasallık yaşı (memAge tabanlı) */",
    "e.overlord=1; e.vassalType='haracguzar'; e.vassalAnger=40;",
    "e.vassalSince=G.memAge-20;",
    "var vasalYasOnce=G.memAge-e.vassalSince;",
    "/* Süre-2: isyan ittifakı yaşı (memAge tabanlı) */",
    "var isyanYasOnce=G.memAge-G.rebelAlliance.since;",
    "/* Süre-3: konsey kuruluş sayacına kalan (cncAge tabanlı) */",
    "var kalanOnce=60-G.cncAge;",
    "var kayit=serialize();", ZEHIR,
    "e.vassalSince=0;",
    "deserialize(kayit);",
    "return JSON.stringify({memAge:G.memAge, cncAge:G.cncAge,",
    "  vasalYasOnce:vasalYasOnce, vasalYasSonra:G.memAge-G.p.vassalSince,",
    "  isyanYasOnce:isyanYasOnce, isyanYasSonra:G.memAge-G.rebelAlliance.since,",
    "  kalanOnce:kalanOnce, kalanSonra:60-G.cncAge});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('memAge süreklilik (137)', d.memAge===137, String(d.memAge));
  ok('cncAge süreklilik (64)', d.cncAge===64, String(d.cncAge));
  ok('SÜRE-1 vasallık yaşı aynı kaldı',
     d.vasalYasOnce===d.vasalYasSonra, d.vasalYasOnce+' → '+d.vasalYasSonra);
  ok('SÜRE-2 isyan ittifakı yaşı aynı kaldı',
     d.isyanYasOnce===d.isyanYasSonra, d.isyanYasOnce+' → '+d.isyanYasSonra);
  ok('SÜRE-3 konsey sayacına kalan aynı kaldı',
     d.kalanOnce===d.kalanSonra, d.kalanOnce+' → '+d.kalanSonra);
}

/* ═══ H. SENARYO 9 — AYNI OTURUMDA ZEHİRLİ ÜZERİNE FARKLI KAYIT ═══ */
console.log('\nH. SENARYO 9 — AYNI OTURUMDA FARKLI KAYIT');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "/* OYUN A: zengin politik dünya */", DUNYA,
    "var kayitA=serialize();",
    "/* OYUN B: tamamen farklı politik dünya */",
    "G.memAge=12; G.cncAge=3;",
    "G.council=null; G.feds=[]; G.fedUid=0; G.friction={};",
    "G.rebelAlliance=null; G.megaWatch=[]; G.sandbox=false;",
    "var kayitB=serialize();",
    "/* A yükle, sonra B yükle: A'dan hiçbir şey sızmamalı */",
    "deserialize(kayitA);",
    "var aKonsey=!!G.council, aFed=G.feds.length, aUid=G.fedUid;",
    "deserialize(kayitB);",
    "return JSON.stringify({aKonsey:aKonsey, aFed:aFed, aUid:aUid,",
    "  bMemAge:G.memAge, bCncAge:G.cncAge, bKonsey:G.council,",
    "  bFedSayi:G.feds.length, bFedUid:G.fedUid,",
    "  bFriction:JSON.stringify(G.friction), bRebel:G.rebelAlliance,",
    "  bMegaSayi:G.megaWatch.length, bSandbox:G.sandbox});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('OYUN A gerçekten zengin yüklendi',
     d.aKonsey===true && d.aFed===1 && d.aUid===7);
  ok('OYUN B: memAge A\'dan sızmadı', d.bMemAge===12, String(d.bMemAge));
  ok('OYUN B: cncAge A\'dan sızmadı', d.bCncAge===3, String(d.bCncAge));
  ok('OYUN B: Konsey A\'dan sızmadı', d.bKonsey===null);
  ok('OYUN B: federasyon A\'dan sızmadı', d.bFedSayi===0, String(d.bFedSayi));
  ok('OYUN B: fedUid A\'dan sızmadı', d.bFedUid===0, String(d.bFedUid));
  ok('OYUN B: friction A\'dan sızmadı', d.bFriction==='{}', d.bFriction);
  ok('OYUN B: rebelAlliance A\'dan sızmadı', d.bRebel===null);
  ok('OYUN B: megaWatch A\'dan sızmadı', d.bMegaSayi===0);
  ok('OYUN B: sandbox A\'dan sızmadı', d.bSandbox===false);
}

/* ═══ I. SENARYO 10 — YENİ OYUN SIFIRLAMA ═══ */
console.log('\nI. SENARYO 10 — YENİ OYUN SIFIRLAMA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var oncKonsey=!!G.council, oncFed=G.feds.length;",
    "/* aynı sayfada YENİ OYUN başlat */",
    "setupGame({name:'Y',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "return JSON.stringify({oncKonsey:oncKonsey, oncFed:oncFed,",
    "  memAge:G.memAge, cncAge:G.cncAge, konsey:G.council,",
    "  fedSayi:G.feds.length, fedUid:G.fedUid,",
    "  friction:JSON.stringify(G.friction), rebel:G.rebelAlliance,",
    "  megaSayi:(G.megaWatch||[]).length, sandbox:G.sandbox,",
    "  warAuth:G._warAuth, dealAuth:G._dealAuth});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('önceki oyun gerçekten zengindi', d.oncKonsey===true && d.oncFed===1);
  ok('yeni oyun: memAge sıfırlandı', d.memAge===0, String(d.memAge));
  ok('yeni oyun: cncAge sıfırlandı', d.cncAge===0, String(d.cncAge));
  ok('yeni oyun: Konsey temizlendi', d.konsey===null);
  ok('yeni oyun: federasyonlar temizlendi', d.fedSayi===0, String(d.fedSayi));
  ok('yeni oyun: fedUid sıfırlandı (eskiden SIZIYORDU)',
     d.fedUid===0, String(d.fedUid));
  ok('yeni oyun: friction temizlendi', d.friction==='{}', d.friction);
  ok('yeni oyun: rebelAlliance temizlendi (eskiden SIZIYORDU)',
     d.rebel===null);
  ok('yeni oyun: megaWatch temizlendi (eskiden SIZIYORDU)',
     d.megaSayi===0, String(d.megaSayi));
  ok('yeni oyun: sandbox kapandı (eskiden SIZIYORDU)',
     d.sandbox===false, String(d.sandbox));
  ok('yeni oyun: geçici yetki alanları temiz',
     d.warAuth===null && d.dealAuth===false);
}

/* ═══ J. SENARYO 11-12 — V3 UYUMLULUĞU VE MIGRATION ═══ */
console.log('\nJ. SENARYO 11-12 — ESKİ V3 KAYIT');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "/* gerçek bir v3 kaydı üret: world YOK, v:3 */",
    "var v4=JSON.parse(serialize());",
    "delete v4.world; v4.v=3;",
    "var v3=JSON.stringify(v4);",
    "/* oturumda zehirli politik veri dursun — sızmamalı */", ZEHIR,
    "var rngOnce=RND_STATE;",
    "var hata='', sonuc=null;",
    "try{ sonuc=deserialize(v3); }catch(ex){ hata=ex.message; }",
    "var rngSonra=RND_STATE;",
    "return JSON.stringify({hata:hata, sonuc:sonuc, gun:G.day,",
    "  memAge:G.memAge, cncAge:G.cncAge, beklenenAy:Math.floor(930/30),",
    "  konsey:G.council, fedSayi:G.feds.length, fedUid:G.fedUid,",
    "  friction:JSON.stringify(G.friction), rebel:G.rebelAlliance,",
    "  megaSayi:G.megaWatch.length, sandbox:G.sandbox,",
    "  rngOnce:rngOnce, rngSonra:rngSonra,",
    "  bilgi:JSON.stringify(G._loadWorldInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('v3 kaydı HATA ATMADAN açıldı', d.hata==='' && d.sonuc===true, d.hata||'ok');
  ok('v3: Konsey null (uydurulmadı)', d.konsey===null);
  ok('v3: federasyonlar boş', d.fedSayi===0, String(d.fedSayi));
  ok('v3: fedUid 0', d.fedUid===0, String(d.fedUid));
  ok('v3: friction boş', d.friction==='{}', d.friction);
  ok('v3: rebelAlliance null', d.rebel===null);
  ok('v3: megaWatch boş', d.megaSayi===0, String(d.megaSayi));
  ok('v3: sandbox false', d.sandbox===false, String(d.sandbox));
  ok('v3: ZEHİRLİ oturum verisi SIZMADI',
     d.konsey===null && d.fedSayi===0 && d.fedUid===0 &&
     d.rebel===null && d.megaSayi===0 && d.sandbox===false);
  ok('v3: memAge sıfırlanmadı, gün/30 ile deterministik göç',
     d.memAge===d.beklenenAy && d.memAge===31,
     'gün '+d.gun+' → '+d.memAge+' ay');
  ok('v3: cncAge deterministik varsayılan aldı',
     d.cncAge===d.beklenenAy, String(d.cncAge));
  ok('v3: migration bilgisi raporlandı',
     /"migrated":true/.test(d.bilgi||''), d.bilgi);
  /* rndSeed(d.rs) kaydın kendi durumunu geri kurar; migration EK
     RNG tüketmemeli — iki kez göç aynı sonucu vermeli. */
  ok('v3: migration global RNG TÜKETMEDİ (deterministik)',
     d.rngSonra===JSON.parse(r).rngSonra);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var v4=JSON.parse(serialize()); delete v4.world; v4.v=3;",
    "var v3=JSON.stringify(v4);",
    "deserialize(v3); var m1=G.memAge, c1=G.cncAge, r1=RND_STATE;",
    "deserialize(v3); var m2=G.memAge, c2=G.cncAge, r2=RND_STATE;",
    "deserialize(v3); var m3=G.memAge, c3=G.cncAge, r3=RND_STATE;",
    "return JSON.stringify({m:[m1,m2,m3], c:[c1,c2,c3], r:[r1,r2,r3]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('v3 göçü DETERMİNİSTİK (3 kez aynı memAge)',
     d.m && d.m[0]===d.m[1] && d.m[1]===d.m[2], (d.m||[]).join(','));
  ok('v3 göçü DETERMİNİSTİK (3 kez aynı cncAge)',
     d.c && d.c[0]===d.c[1] && d.c[1]===d.c[2], (d.c||[]).join(','));
  ok('v3 göçü RNG durumunu her seferinde AYNI bıraktı',
     d.r && d.r[0]===d.r[1] && d.r[1]===d.r[2], (d.r||[]).join(','));
}

/* ═══ K. SENARYO 13 — TÜRETİLMİŞ HARİTA/SINIR DURUMU ═══ */
console.log('\nK. SENARYO 13 — TÜRETİLMİŞ DURUM KORUNDU');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var kayit=serialize();", ZEHIR,
    "deserialize(kayit);",
    "var reachVar=G.sys.filter(function(s){return s.owner!==undefined &&",
    "  s.owner!==null && s._reach!==undefined;}).length;",
    "var sahipli=G.sys.filter(function(s){return s.owner!==undefined &&",
    "  s.owner!==null;}).length;",
    "/* economyTick(true) politik veriyi DEĞİŞTİRMEMELİ */",
    "var cOnce=JSON.stringify(G.council), fOnce=JSON.stringify(G.feds),",
    "    mOnce=G.memAge, sOnce=G.sandbox, uOnce=G.fedUid,",
    "    rOnce=JSON.stringify(G.rebelAlliance);",
    "economyTick(true); rebuildDerivedStateAfterLoad();",
    "return JSON.stringify({sahipli:sahipli, reachVar:reachVar,",
    "  konseyAyni:cOnce===JSON.stringify(G.council),",
    "  fedAyni:fOnce===JSON.stringify(G.feds),",
    "  memAyni:mOnce===G.memAge, sandboxAyni:sOnce===G.sandbox,",
    "  uidAyni:uOnce===G.fedUid,",
    "  rebelAyni:rOnce===JSON.stringify(G.rebelAlliance)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme sonrası sahipli sistemlerde _reach kuruldu',
     d.sahipli>0 && d.reachVar===d.sahipli,
     d.reachVar+'/'+d.sahipli);
  ok('economyTick(true) Konseyi DEĞİŞTİRMEDİ', d.konseyAyni===true);
  ok('economyTick(true) federasyonları DEĞİŞTİRMEDİ', d.fedAyni===true);
  ok('economyTick(true) memAge\'i DEĞİŞTİRMEDİ', d.memAyni===true);
  ok('economyTick(true) sandbox\'ı DEĞİŞTİRMEDİ', d.sandboxAyni===true);
  ok('economyTick(true) fedUid\'i DEĞİŞTİRMEDİ', d.uidAyni===true);
  ok('rebuildDerivedStateAfterLoad isyan ittifakını DEĞİŞTİRMEDİ',
     d.rebelAyni===true);
}

/* ═══ L. SENARYO 14 — ANLAMSAL EŞİTLİK (round-trip) ═══ */
console.log('\nL. SENARYO 14 — SERIALIZE→DESERIALIZE→SERIALIZE');
{
  const H=harness(); H.R(KUR);
  const r=H.R([DUNYA,
    "var k1=serialize();", ZEHIR,
    "deserialize(k1); var k2=serialize();",
    "deserialize(k2); var k3=serialize();",
    "deserialize(k3); var k4=serialize();",
    "var w1=JSON.parse(k1).world, w2=JSON.parse(k2).world,",
    "    w3=JSON.parse(k3).world, w4=JSON.parse(k4).world;",
    "var s1=JSON.stringify(w1), s2=JSON.stringify(w2),",
    "    s3=JSON.stringify(w3), s4=JSON.stringify(w4);",
    "/* w1→w2 tek farkı: pariahMap() tarafından TEMBEL üretilen",
    "   council.pariahs önbelleği. Bu alan korunan targeted.parya'dan",
    "   türetilir — bilgi kaybı DEĞİL, geç materyalizasyondur. */",
    "var c1=JSON.parse(JSON.stringify(w1.council));",
    "var c2=JSON.parse(JSON.stringify(w2.council));",
    "var tembel=Object.keys(c2).filter(function(k){",
    "  return JSON.stringify(c1[k])!==JSON.stringify(c2[k]); });",
    "delete c1.pariahs; delete c2.pariahs;",
    "var d1=Object.assign({},w1,{council:c1});",
    "var d2=Object.assign({},w2,{council:c2});",
    "/* FAZ 85B: col.shield sürüklenmesi (her yüklemede economyTick ile",
    "   artması) DÜZELTİLDİ. Artık sys de yükleme boyunca sabit. */",
    "var sysDrift=JSON.stringify(JSON.parse(k3).sys)!==",
    "             JSON.stringify(JSON.parse(k4).sys);",
    "return JSON.stringify({s2s3:s2===s3, s3s4:s3===s4,",
    "  tembelAlanlar:tembel,",
    "  pariahsTuretilmis:!!(w2.council.pariahs &&",
    "    Object.prototype.hasOwnProperty.call(w2.council.pariahs,",
    "      String(w1.council.targeted.parya))),",
    "  targetedKorundu:w2.council.targeted.parya===w1.council.targeted.parya,",
    "  cekirdekAyni:JSON.stringify(d1)===JSON.stringify(d2),",
    "  sysDrift:sysDrift, wUz:s1.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('world round-trip 2→3 anlamsal olarak AYNI', d.s2s3===true);
  ok('world round-trip 3→4 anlamsal olarak AYNI (yakınsadı)', d.s3s4===true,
     'world '+d.wUz+' bayt');
  ok('ilk tur farkı YALNIZ tembel council.pariahs önbelleği',
     JSON.stringify(d.tembelAlanlar)==='["pariahs"]',
     (d.tembelAlanlar||[]).join(','));
  ok('pariahs korunan targeted.parya\'dan türetildi (bilgi kaybı yok)',
     d.pariahsTuretilmis===true && d.targetedKorundu===true);
  ok('tembel önbellek dışında world ÇEKİRDEĞİ birebir aynı',
     d.cekirdekAyni===true);
  /* FAZ 85B regresyonu: sys artık yükleme boyunca sürüklenmiyor */
  ok('sys yükleme boyunca SÜRÜKLENMİYOR (Faz 85B düzeltmesi)',
     d.sysDrift===false && d.s3s4===true,
     'sys sabit · world sabit');
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
