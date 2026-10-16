#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 84C: DEVLET EKRANI PERK KAPISI / ERİŞİLEBİLİRLİK ONARIMI
   Yalnız Node.js yerleşik modülleri. Harici bağımlılık yok.
   Çalıştırma: node tests/faz84c_state_visibility_gate_test.js
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

/* ═══ GÜVENİLİR FONKSİYON GÖVDESİ ÇIKARICI ═══
   Dengeli süslü parantez; dize, şablon dizesi, yorum ve regex atlanır.
   ui.js GENELİNDE kelime SAYILMAZ — yalnız p_imp() gövdesi ölçülür. */
function fnGovde(src, baslik){
  const i=src.indexOf(baslik);
  if(i<0) return null;
  const ac=src.indexOf('{', i);
  if(ac<0) return null;
  let d=0,dz=null,kac=false,sy=false,by=false,re=false;
  for(let p=ac;p<src.length;p++){
    const c=src[p], n=src[p+1];
    if(kac){kac=false;continue;}
    if(dz){ if(c==='\\'){kac=true;continue;} if(c===dz) dz=null; continue; }
    if(sy){ if(c==='\n') sy=false; continue; }
    if(by){ if(c==='*'&&n==='/'){by=false;p++;} continue; }
    if(re){ if(c==='\\'){kac=true;continue;} if(c==='/'||c==='\n') re=false; continue; }
    if(c==='/'&&n==='/'){sy=true;p++;continue;}
    if(c==='/'&&n==='*'){by=true;p++;continue;}
    if(c==='"'||c==="'"||c==='`'){dz=c;continue;}
    if(c==='/'){
      let q=p-1; while(q>=0&&/\s/.test(src[q]))q--;
      const on=src[q];
      if(on===undefined||'(,=:[!&|?{};+-*%~^'.includes(on)){re=true;continue;}
    }
    if(c==='{')d++;
    else if(c==='}'){ d--; if(d===0) return src.slice(ac+1,p); }
  }
  return null;
}

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
const KUR=(mil)=>[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:"+mil+",aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "G.p.ethics={mil:"+mil+",aut:0,mat:0,ahl:0};",
 "return 'ok';"].join('\n');
const KUR_NOTR=KUR(0), KUR_PERK=KUR(3);
const NORM=[
 "function norm(t){var d=JSON.parse(t),L=d.emps||[];",
 "  for(var i=0;i<L.length;i++){delete L[i]._pers;delete L[i]._persAt;delete L[i]._prof;}",
 "  /* FAZ 85A: council artik kayitta. pariahMap() `pariahs` alanini",
 "     TEMBEL uretir (targeted.parya'dan turetilir) — personaOf()",
 "     onbellegiyle ayni sinif, gercek oyun verisi degil. */",
 "  if(d.world&&d.world.council) delete d.world.council.pariahs;",
 "  return JSON.stringify(d);}"].join('\n');

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
  const html=oku('index.html');
  const sira=(html.match(/<script src="([^"]+\.js)"><\/script>/g)||[])
    .map(x=>x.replace(/.*src="/,'').replace(/".*/,''));
  ok('yükleme sırası değişmedi',
     ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','ui.js','audio.js']
     .every((f,i)=>sira[i]===f));
  const mainJs=oku('main.js');
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mainJs.includes(k)));
  ok("sw cache = 'stars-v94d1'", /const CACHE = 'stars-v94d1'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF (yorumlu)',
     /\/\/\s*if \(typeof situationsTick/.test(dip) &&
     !/^\s*if \(typeof situationsTick === 'function'\) situationsTick\(\);/m.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
  const H=harness(); H.R(KUR_NOTR);
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
}

/* ═══ B. YAPI — PERK KAPISI DARALTILDI MI? (yalnız p_imp gövdesi) ═══ */
console.log('\nB. PERK KAPISI YAPISI');
{
  const ui=oku('ui.js');
  const govde=fnGovde(ui,'p_imp(');
  ok('p_imp() gövdesi güvenilir biçimde çıkarıldı', govde!==null,
     govde ? govde.split('\n').length+' satır' : 'BULUNAMADI');
  if(govde===null){
    console.log('\n  ⛔ p_imp() çıkarılamadı — yapı ölçümü yapılamaz.');
    kalan++; basarisiz.push('p_imp gövdesi çıkarılamadı');
  } else {
    const say=re=>(govde.match(re)||[]).length;
    const kapi=govde.indexOf('if (perks.length){');
    ok('perk kapısı p_imp içinde tam bir kez var',
       say(/if \(perks\.length\)\{/g)===1, String(say(/if \(perks\.length\)\{/g)));
    /* Devlet-geneli bölümler kapının ÖNCESİNDE (dışında) olmalı */
    [['MİZAÇ VE İTİBAR','MİZAÇ VE İTİBAR'],
     ['galaktik itibar (honorOf)','honorOf(e)'],
     ['diplomatik ağırlık (voteWeightBreakdown)','voteWeightBreakdown(e)'],
     ['ambargo baskısı (embargoPressure)','embargoPressure(e)'],
     ['Galaktik Parya (isPariah)','isPariah(e)'],
     ['danışman düğmesi (advShow)','data-a="advShow"'],
     ['Galaktik Tehdit (threatLabel)','threatLabel(e.threat'],
     ['Parya adayı (PARIAH_THREAT)','PARIAH_THREAT']].forEach(([ad,ipuc])=>{
      const i=govde.indexOf(ipuc);
      ok(ad+' perk kapısının DIŞINDA', i>=0 && kapi>=0 && i<kapi,
         i<0?'BULUNAMADI':'@'+i+' < kapı@'+kapi);
    });
    /* Kapının içinde YALNIZ ideoloji yetenekleri kalmalı */
    const iBas=govde.indexOf('İDEOLOJİ YETENEKLERİ');
    ok('İDEOLOJİ YETENEKLERİ başlığı kapının İÇİNDE', iBas>kapi,
       '@'+iBas+' > kapı@'+kapi);
    ok('perks.forEach kapının İÇİNDE',
       govde.indexOf('perks.forEach')>kapi);
    ok('perk açma açıklaması else dalında duruyor',
       /\} else \{\s*\n\s*h \+= `<div class="mini">Bir etik eksenini 2 veya 3/.test(govde));
    /* Tekrar oluşmamalı */
    ok('MİZAÇ VE İTİBAR başlığı tam bir kez',
       say(/MİZAÇ VE İTİBAR/g)===1, String(say(/MİZAÇ VE İTİBAR/g)));
    ok('advShow düğmesi p_imp içinde tam bir kez',
       say(/data-a="advShow"/g)===1, String(say(/data-a="advShow"/g)));
    ok('İDEOLOJİ YETENEKLERİ başlığı tam bir kez',
       say(/İDEOLOJİ YETENEKLERİ/g)===1);
    ok('perk açma açıklaması tam bir kez',
       say(/Bir etik eksenini 2 veya 3/g)===1);
    /* FAZ 84B kanonik vasallık bölümü DEĞİŞMEDEN duruyor */
    ok('FAZ 84B kanonik vasallık bölümü hâlâ TEK',
       say(/FAZ 84B: KANON[İI]K VASALLIK/g)===1);
    ok('vasallık bölümü hâlâ perk kapısının dışında',
       govde.indexOf('FAZ 84B: KANON')<kapi);
    ok('isyan düğmesi hâlâ tam bir kez', say(/data-a="revolt"/g)===1);
  }
}

/* ═══ C. SENARYO 1 — PERKSİZ NORMAL DEVLET ═══ */
console.log('\nC. SENARYO 1 — PERKSİZ NORMAL DEVLET');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; G.council=null;",
    "var P=personaOf(e), hn=honorOf(e);",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length,",
    "  mizacBaslik:(html.match(/MİZAÇ VE İTİBAR/g)||[]).length,",
    "  mizacAd:html.split(P.n).length-1,",
    "  mizacAcik:html.indexOf(P.d.slice(0,25))>=0,",
    "  itibar:(html.match(/Galaktik itibar/g)||[]).length,",
    "  itibarAcik:(html.match(/Sözünde durmak yükseltir/g)||[]).length,",
    "  danisman:(html.match(/data-a=\"advShow\"/g)||[]).length,",
    "  acklama:(html.match(/Bir etik eksenini 2 veya 3/g)||[]).length,",
    "  ideoBaslik:(html.match(/İDEOLOJİ YETENEKLERİ/g)||[]).length,",
    "  perkKarti:(html.match(/✧ /g)||[]).length, hn:hn});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('MİZAÇ VE İTİBAR başlığı görünür (eski hata: görünmüyordu)',
     d.mizacBaslik===1, String(d.mizacBaslik));
  ok('mizaç ADI görünür', d.mizacAd>=1, '×'+d.mizacAd);
  ok('mizaç AÇIKLAMASI görünür', d.mizacAcik===true);
  ok('galaktik itibar görünür (tam bir kez)', d.itibar===1, 'honor='+d.hn);
  ok('itibar açıklaması görünür', d.itibarAcik===1);
  ok('DANIŞMANI AÇ düğmesi tam bir kez görünür', d.danisman===1, String(d.danisman));
  ok('ideoloji açma açıklaması tam bir kez görünür', d.acklama===1);
  ok('İDEOLOJİ YETENEKLERİ başlığı görünmez (perk yok)', d.ideoBaslik===0);
  ok('perk kartı görünmez', d.perkKarti===0, String(d.perkKarti));
}

/* ═══ D. SENARYO 2 — PERKLİ DEVLET ═══ */
console.log('\nD. SENARYO 2 — PERKLİ DEVLET');
{
  const H=harness(); H.R(KUR_PERK);
  const r=H.R([
    "var e=G.p; G.council=null;",
    "var pk=perksOf(e), P=personaOf(e);",
    "var html=String(UI.p_imp()||'');",
    "var tekrar=pk.map(function(p){return p.n+'='+(html.split(p.n).length-1);});",
    "return JSON.stringify({perk:pk.length, tekrar:tekrar,",
    "  hepsiBirKez:pk.every(function(p){return (html.split(p.n).length-1)===1;}),",
    "  mizacBaslik:(html.match(/MİZAÇ VE İTİBAR/g)||[]).length,",
    "  mizacAd:html.split(P.n).length-1,",
    "  itibar:(html.match(/Galaktik itibar/g)||[]).length,",
    "  danisman:(html.match(/data-a=\"advShow\"/g)||[]).length,",
    "  ideoBaslik:(html.match(/İDEOLOJİ YETENEKLERİ/g)||[]).length,",
    "  acklama:(html.match(/Bir etik eksenini 2 veya 3/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki VAR (senaryo geçerli)', d.perk>0, 'perk='+d.perk);
  ok('MİZAÇ VE İTİBAR yine YALNIZ BİR KEZ', d.mizacBaslik===1, String(d.mizacBaslik));
  ok('mizaç adı yalnız bir kez', d.mizacAd===1, '×'+d.mizacAd);
  ok('galaktik itibar yalnız bir kez', d.itibar===1, String(d.itibar));
  ok('danışman düğmesi yalnız bir kez', d.danisman===1, String(d.danisman));
  ok('İDEOLOJİ YETENEKLERİ başlığı bir kez', d.ideoBaslik===1, String(d.ideoBaslik));
  ok('her perk tam bir kez görünür', d.hepsiBirKez===true, (d.tekrar||[]).join(' · '));
  ok('perk açma açıklaması GÖRÜNMEZ', d.acklama===0, String(d.acklama));
}

/* ═══ E. SENARYO 3 — PERKSİZ + KONSEY ═══ */
console.log('\nE. SENARYO 3 — PERKSİZ + KONSEY ÜYESİ');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p;",
    "G.council=null;",
    "var yokHtml=String(UI.p_imp()||'');",
    "var uye=G.emps.filter(function(x){return !x.wild && !x.dead;})",
    "  .map(function(x){return x.id;});",
    "G.council={name:'K',founder:e.id,members:uye,laws:{},targeted:{},treasury:0,",
    "  president:e.id,termStart:G.day,terms:{},voteIn:12,vote:null,dead:false};",
    "var B=voteWeightBreakdown(e);",
    "var varHtml=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length,",
    "  konseyVar:councilExists(),",
    "  yok:(yokHtml.match(/Diplomatik ağırlık/g)||[]).length,",
    "  var:(varHtml.match(/Diplomatik ağırlık/g)||[]).length,",
    "  toplam:varHtml.indexOf('>'+B.toplam+'<')>=0,",
    "  kirilim:varHtml.indexOf(B.sistem+' sistem · '+B.nufus+' nüfus')>=0,",
    "  onurKatki:varHtml.indexOf('onur '+(B.onur>0?'+':'')+B.onur)>=0,",
    "  B:{toplam:B.toplam,onur:B.onur,carpan:B.carpan}});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('KONSEY YOKKEN diplomatik ağırlık GÖRÜNMEZ', d.yok===0, String(d.yok));
  ok('KONSEY VARKEN diplomatik ağırlık görünür (tam bir kez)',
     d.konseyVar===true && d.var===1, String(d.var));
  ok('ağırlık TOPLAMI voteWeightBreakdown değeriyle çizildi',
     d.toplam===true, 'toplam='+(d.B&&d.B.toplam));
  ok('ağırlık KIRILIMI (sistem/nüfus/etki) çizildi', d.kirilim===true);
  ok('ONUR KATKISI kırılımda korundu', d.onurKatki===true,
     'onur='+(d.B&&d.B.onur)+' ×'+(d.B&&d.B.carpan));
}

/* ═══ F. SENARYO 4 — PERKSİZ + AMBARGO ═══ */
console.log('\nF. SENARYO 4 — PERKSİZ + AMBARGO');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; G.council=null;",
    "var temiz=String(UI.p_imp()||'');",
    "var n=0;",
    "for(var i=1;i<G.emps.length && n<3;i++){ var x=G.emps[i];",
    "  if(!x||x.wild||x.dead) continue;",
    "  x.embargo=x.embargo||{}; x.embargo[e.id]=true; n++; }",
    "var ep=embargoPressure(e);",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length, epN:ep.n,",
    "  temizAmbargo:(temiz.match(/Ambargo baskısı/g)||[]).length,",
    "  ambargo:(html.match(/Ambargo baskısı/g)||[]).length,",
    "  sayi:html.indexOf('>'+ep.n+' devlet<')>=0,",
    "  uyari:(html.match(/Ticaret yolların kesik/g)||[]).length,",
    "  parya:(html.match(/GALAKTİK PARYA/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('ambargo YOKKEN satır çıkmıyor', d.temizAmbargo===0, String(d.temizAmbargo));
  ok('PERKSİZ oyuncu ambargo baskısını görüyor',
     d.ambargo===1, 'ambargo satırı ×'+d.ambargo);
  ok('ambargo yapan devlet SAYISI doğru gösterildi',
     d.sayi===true, d.epN+' devlet');
  ok('ambargo uyarı metni tam bir kez', d.uyari===1);
  ok('Parya kartı ambargo ile birlikte ÇIKMADI', d.parya===0, String(d.parya));
}

/* ═══ G. SENARYO 5 — PERKSİZ + GALAKTİK PARYA ═══ */
console.log('\nG. SENARYO 5 — PERKSİZ + GALAKTİK PARYA');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p;",
    "var uye=G.emps.filter(function(x){return !x.wild && !x.dead;})",
    "  .map(function(x){return x.id;});",
    "G.council={name:'K',founder:e.id,members:uye,laws:{},targeted:{},treasury:0,",
    "  president:e.id,termStart:G.day,terms:{},voteIn:12,vote:null,dead:false};",
    "/* hem ambargo hem parya aynı anda kurulur */",
    "var n=0;",
    "for(var i=1;i<G.emps.length && n<3;i++){ var x=G.emps[i];",
    "  if(!x||x.wild||x.dead) continue;",
    "  x.embargo=x.embargo||{}; x.embargo[e.id]=true; n++; }",
    "addPariah(e.id);",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length, parya:isPariah(e),",
    "  paryaKart:(html.match(/⛔ GALAKTİK PARYA/g)||[]).length,",
    "  paryaAcik:(html.match(/Konsey seni galaksiden dışladı/g)||[]).length,",
    "  ambargo:(html.match(/Ambargo baskısı/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('oyuncu gerçekten Parya', d.parya===true);
  ok('PERKSİZ oyuncu Parya kartını görüyor', d.paryaKart===1, String(d.paryaKart));
  ok('Parya açıklaması tam bir kez', d.paryaAcik===1);
  ok('Parya varken ambargo satırı ÜST ÜSTE BİNMİYOR',
     d.ambargo===0, 'ambargo satırı ×'+d.ambargo);
}

/* ═══ H. SENARYO 6 — PERKSİZ + YÜKSEK TEHDİT ═══ */
console.log('\nH. SENARYO 6 — PERKSİZ + YÜKSEK TEHDİT');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; G.council=null;",
    "e.threat=0; var sifir=String(UI.p_imp()||'');",
    "e.threat=30; var saibeli=String(UI.p_imp()||'');",
    "e.threat=85; var yuksek=String(UI.p_imp()||'');",
    "e.threatFrozen=52; var donmus=String(UI.p_imp()||'');",
    "delete e.threatFrozen;",
    "return JSON.stringify({perk:perksOf(e).length,",
    "  esik:PARIAH_THREAT,",
    "  sifirEtiket:(sifir.match(/⚠ (GALAKTİK TEHDİT|tehlikeli|şaibeli)/g)||[]).length,",
    "  saibeliEtiket:(saibeli.match(/⚠ şaibeli/g)||[]).length,",
    "  saibeliAday:(saibeli.match(/PARYA ADAYISIN/g)||[]).length,",
    "  yuksekEtiket:(yuksek.match(/⚠ GALAKTİK TEHDİT/g)||[]).length,",
    "  yuksekAday:(yuksek.match(/PARYA ADAYISIN/g)||[]).length,",
    "  donmus:(donmus.match(/kriz\\s+boyunca askıda/g)||[]).length,",
    "  tl30:threatLabel(30), tl85:threatLabel(85)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('tehdit 0: hiçbir tehdit etiketi çıkmaz', d.sifirEtiket===0, String(d.sifirEtiket));
  ok('tehdit 30: "şaibeli" etiketi görünür (perksiz)',
     d.saibeliEtiket===1, 'threatLabel(30)='+d.tl30);
  ok('tehdit 30: Parya adayı uyarısı ÇIKMAZ (eşik '+d.esik+')',
     d.saibeliAday===0, String(d.saibeliAday));
  ok('tehdit 85: "GALAKTİK TEHDİT" etiketi görünür',
     d.yuksekEtiket===1, 'threatLabel(85)='+d.tl85);
  ok('tehdit 85: PARYA ADAYISIN uyarısı görünür (perksiz)',
     d.yuksekAday===1, String(d.yuksekAday));
  ok('kriz askıya alma bilgisi perksiz oyuncuda görünür',
     d.donmus===1, String(d.donmus));
}

/* ═══ I. SENARYO 7 — DANIŞMAN ═══ */
console.log('\nI. SENARYO 7 — DANIŞMAN');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; G.council=null;",
    "var html=String(UI.p_imp()||'');",
    "var dugme=(html.match(/data-a=\"advShow\"/g)||[]).length;",
    "var sayac=0, org=UI.advisorOpen;",
    "UI.advisorOpen=function(){ sayac++; return org.apply(this,arguments); };",
    "UI.act('advShow');",
    "var tek=sayac;",
    "UI.advisorOpen=org;",
    "return JSON.stringify({perk:perksOf(e).length, dugme:dugme, tek:tek,",
    "  modalVar:!!(G.over||UI.modalAcik||true)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('data-a="advShow" p_imp içinde TAM BİR KEZ', d.dugme===1, String(d.dugme));
  ok('tek dokunuş danışmanı TAM BİR KEZ açtı', d.tek===1, String(d.tek)+' çağrı');
  ok('çift handler yok (tek düğme + tek çağrı)', d.dugme===1 && d.tek===1);
}

/* ═══ J. SENARYO 8 — FAZ 84B VASALLIK REGRESYONU ═══ */
console.log('\nJ. SENARYO 8 — FAZ 84B VASALLIK REGRESYONU');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar';",
    "e.vassalAnger=62; e.vassalPaid=13.5; e.contact[lord.id]=true;",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length,",
    "  kart:(html.match(/VASALLIK DURUMU/g)||[]).length,",
    "  vasalisin:(html.match(/DEVLET[İI]N[İI]N VASALISIN/g)||[]).length,",
    "  lord:html.split(esc(lord.name)).length-1,",
    "  revolt:(html.match(/data-a=\"revolt\"/g)||[]).length,",
    "  aktif:/<button class=\"abtn dgr\"[^>]*data-a=\"revolt\"/.test(html),",
    "  mizac:(html.match(/MİZAÇ VE İTİBAR/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('PERKSİZ vasal oyuncu vasallık kartını görüyor', d.kart===1, String(d.kart));
  ok('senyör adı görünüyor', d.lord>=1, '×'+d.lord);
  ok('bağımsızlık düğmesi korundu (öfke 62 → aktif)',
     d.revolt===1 && d.aktif===true);
  ok('84C bilgileri 84B kartıyla birlikte görünüyor', d.mizac===1);
}
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; delete e.overlord; delete e.vassalType;",
    "var tip=['haracguzar','bekci','akademik'], ad=[];",
    "for (var i=0;i<3;i++){ var v=G.emps[i+2]; if(!v) continue;",
    "  v.overlord=e.id; v.vassalType=tip[i]; v.vassalAnger=20;",
    "  v.vassalPaid=(i===0?9.5:i===2?4.4:0); if(i===2) v.vassalSci=4.4;",
    "  ad.push(v.name); }",
    "var html=String(UI.p_imp()||'');",
    "var tekrar={}; ad.forEach(function(n){ tekrar[n]=html.split(esc(n)).length-1; });",
    "return JSON.stringify({perk:perksOf(e).length, ad:ad, tekrar:tekrar,",
    "  hepsiBir:ad.every(function(n){return (html.split(esc(n)).length-1)===1;}),",
    "  heg:(html.match(/HEGEMONYA — VASALLARIN/g)||[]).length,",
    "  vergi:(html.match(/Aylık vergi geliri/g)||[]).length,",
    "  aras:(html.match(/Aylık araştırma aktarımı/g)||[]).length,",
    "  cap:(html.match(/Bekçi filo kapasitesi/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('üç vasal türü PERKSİZ oyuncuda birer kez listelendi',
     d.hepsiBir===true, Object.values(d.tekrar||{}).join(','));
  ok('hegemonya başlığı hâlâ tam bir kez', d.heg===1, String(d.heg));
  ok('toplamlar hâlâ birer satır',
     d.vergi===1 && d.aras===1 && d.cap===1,
     'vergi'+d.vergi+' araş'+d.aras+' kap'+d.cap);
}

/* ═══ K. SENARYO 9 — RENDER SAFİYETİ ═══ */
console.log('\nK. SENARYO 9 — RENDER SAFİYETİ');
{
  const H=harness(); H.R(KUR_PERK);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "var uye=G.emps.filter(function(x){return !x.wild && !x.dead;})",
    "  .map(function(x){return x.id;});",
    "G.council={name:'K',founder:e.id,members:uye,laws:{},targeted:{},treasury:0,",
    "  president:e.id,termStart:G.day,terms:{},voteIn:12,vote:null,dead:false};",
    "e.threat=85; e.honor=-20;",
    "for(var i=1;i<4;i++){ if(G.emps[i]){ G.emps[i].embargo=G.emps[i].embargo||{};",
    "  G.emps[i].embargo[e.id]=true; } }",
    "var tip=['haracguzar','bekci','akademik'];",
    "for (var j=0;j<3;j++){ var v=G.emps[j+3]; if(!v) continue;",
    "  v.overlord=e.id; v.vassalType=tip[j]; v.vassalAnger=30+j*10; }",
    NORM,
    "var once=serialize();",
    "var oKay=JSON.stringify(e.res), oOnur=honorOf(e), oTeh=e.threat,",
    "    oEtik=JSON.stringify(e.ethics), oPerk=perksOf(e).length,",
    "    oSavas=JSON.stringify(e.war||{}), oRel=JSON.stringify(e.rel||{}),",
    "    oAmb=embargoPressure(e).n,",
    "    oVas=G.emps.map(function(x){return x.id+':'+x.overlord+':'+x.vassalType;}).join(',');",
    "for (var k=0;k<40;k++) String(UI.p_imp()||'');",
    "var sonra=serialize();",
    "var sKay=JSON.stringify(e.res), sOnur=honorOf(e), sTeh=e.threat,",
    "    sEtik=JSON.stringify(e.ethics), sPerk=perksOf(e).length,",
    "    sSavas=JSON.stringify(e.war||{}), sRel=JSON.stringify(e.rel||{}),",
    "    sAmb=embargoPressure(e).n,",
    "    sVas=G.emps.map(function(x){return x.id+':'+x.overlord+':'+x.vassalType;}).join(',');",
    "return JSON.stringify({birebir:(once===sonra),",
    "  veriAyni:(norm(once)===norm(sonra)),",
    "  hamFark:Math.abs(once.length-sonra.length),",
    "  kaynak:(oKay===sKay), onur:(oOnur===sOnur), tehdit:(oTeh===sTeh),",
    "  etik:(oEtik===sEtik), perk:(oPerk===sPerk), savas:(oSavas===sSavas),",
    "  rel:(oRel===sRel), ambargo:(oAmb===sAmb), vasal:(oVas===sVas)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('40 render sonrası KAYNAKLAR değişmedi', d.kaynak===true);
  ok('40 render sonrası ONUR değişmedi', d.onur===true);
  ok('40 render sonrası TEHDİT değişmedi', d.tehdit===true);
  ok('40 render sonrası AMBARGO değişmedi', d.ambargo===true);
  ok('40 render sonrası ETİKLER değişmedi', d.etik===true);
  ok('40 render sonrası PERKLER değişmedi', d.perk===true);
  ok('40 render sonrası VASALLIK değişmedi', d.vasal===true);
  ok('40 render sonrası SAVAŞLAR değişmedi', d.savas===true);
  ok('40 render sonrası İLİŞKİLER değişmedi', d.rel===true);
  /* personaOf() önbelleği bu fazda DÜZELTİLMİYOR (main.js kapsam dışı) */
  ok('40 render sonrası GERÇEK OYUN VERİSİ değişmedi',
     d.birebir===true || d.veriAyni===true,
     d.birebir ? 'birebir'
       : 'oyun verisi aynı · yalnız personaOf() önbelleği '+d.hamFark+
         'B (Faz 84A/84B\'de belgelendi, kapsam dışı)');
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
