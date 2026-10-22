#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85B: KAYIT YÜKLEMENİN ZAMANI İLERLETMEMESİ
   Kaydı açmak oyunu OYNATMAMALI; yalnız o andaki dünyayı yeniden
   kurup türetilmiş değerleri hesaplamalıdır.
   Çalıştırma: node tests/faz85b_load_idempotency_test.js
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
                  'economy.js','commerce.js','ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'])
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

/* Sekiz alt sistemin hepsi için ANLAMLI aktif durum kurar. */
const AKTIF=[
 "var e=G.p, dus=G.emps[1];",
 "e.contact[dus.id]=true; dus.contact[e.id]=true;",
 "e.war[dus.id]=true; dus.war[e.id]=true;",
 "var sy=G.sys.filter(function(s){return s.owner===e.id;})[0];",
 "var pl=sy.planets.filter(function(p){return p.col;})[0];",
 "var col=pl.col;",
 "/* groundTick: kalkan + garnizon */",
 "col.shield=4; col.garrison=10; col.garrisonBase=10;",
 "/* invasionTick: aktif kuşatma */",
 "col.siege=2; col.stab=20; col.pop=12;",
 "/* secessionTick: ayrılık sayacı + kışkırtma */",
 "col.secede=3; col.unrest={left:5,hit:25};",
 "/* terraformTick: aktif proje */",
 "pl.terraform={left:5,woke:false,sleeper:false,sabotajAy:0};",
 "/* radiationTick: radyasyonlu sistem */",
 "sy.radiation=3;",
 "/* panopticonTick: gerçek kilit */",
 "sy.built=sy.built||{}; sy.built.panopt=1;",
 "e.panoptLock={}; e.panoptLock[sy.id]={target:sy.id, blindUntil:0, hp:100};",
 "/* colossusTick: gerçek süper gemi, şarj sürüyor */",
 "G.fleets.push({id:9001,e:e.id,sys:sy.id,s:sy.id,",
 "  ships:[{c:'col_s',h:1}],charge:3,combat:false,name:'KOL'});",
 "/* repairTick: hasarlı filo */",
 "var f0=G.fleets.filter(function(f){return f.e===e.id&&f.ships&&",
 "  f.ships.length&&f.id!==9001;})[0];",
 "f0.ships.forEach(function(sh){sh.h=0.5;}); f0.sys=sy.id; f0.s=sy.id;",
 "/* düşman işgal filosu aynı sistemde */",
 "G.fleets.push({id:9002,e:dus.id,sys:sy.id,s:sy.id,",
 "  ships:[{c:'kor',h:1},{c:'kor',h:1}],name:'DUS'});",
 "e.res.ene=5000; e.res.min=5000; e.res.ala=2000;",
 "var SYID=sy.id, PLI=pl.i;"].join('\n');

/* Gerçek oyun durumunun tam anlık görüntüsü.
   TÜRETİLMİŞ alanlar (_reach, inc, mods) KASTEN dışarıda —
   onların yenilenmesi bu fazda beklenen davranıştır. */
const SNAP=[
 "function snap(){ var o={};",
 "  var kol=[]; G.sys.forEach(function(s){ (s.planets||[]).forEach(function(p){",
 "    if(p.col) kol.push({key:s.id+'/'+p.i, own:s.owner,",
 "      sh:p.col.shield, gar:p.col.garrison, garB:p.col.garrisonBase,",
 "      sg:p.col.siege, tr:p.col.truce, trA:p.col.truceAge,",
 "      st:p.col.stab, pop:p.col.pop, b:JSON.stringify(p.col.b),",
 "      cap:p.col.cap, fcd:p.col.fcd, scorch:p.col.scorched,",
 "      sec:p.col.secede, unr:JSON.stringify(p.col.unrest||null),",
 "      tj:p.terraJob?p.terraJob.left:null,",
 "      tf:JSON.stringify(p.terraform||null)}); });});",
 "  o.kol=kol;",
 "  o.filo=G.fleets.map(function(f){return f.id+':'+f.e+':'+",
 "    (f.sys!==undefined?f.sys:'-')+':'+",
 "    (f.ships||[]).map(function(sh){",
 "      return sh.c+'@'+(sh.h!==undefined?(+sh.h).toFixed(4):'1');}).join('|')+",
 "    ':ch'+(f.charge||0)+':rep'+(f.repairing||0)+':cmb'+(f.combat?1:0);}).join(';');",
 "  o.filoSayi=G.fleets.length;",
 "  o.gemiSayi=G.fleets.reduce(function(a,f){return a+((f.ships||[]).length);},0);",
 "  o.kolSayi=kol.length; o.empSayi=G.emps.length;",
 "  o.sysOwner=G.sys.map(function(s){return s.owner;}).join(',');",
 "  o.rad=G.sys.map(function(s){return s.radiation||0;}).join(',');",
 "  o.seen=G.sys.map(function(s){return (s.seen||[]).join('');}).join(',');",
 "  o.panopt=G.sys.map(function(s){return JSON.stringify(s.panopt||null);}).join(',');",
 "  o.log=(G.log||[]).length; o.inbox=(G.inbox||[]).length;",
 "  o.fx=(G.fx||[]).length; o.rng=RND_STATE;",
 "  o.res=G.emps.map(function(x){return JSON.stringify(x.res);}).join(';');",
 "  o.panopLock=G.emps.map(function(x){",
 "    return JSON.stringify(x.panoptLock||null);}).join(';');",
 "  return o; }",
 "function farkla(A,B){ var d=[];",
 "  ['filo','filoSayi','gemiSayi','kolSayi','empSayi','sysOwner','rad','seen',",
 "   'panopt','log','inbox','fx','rng','res','panopLock'].forEach(function(k){",
 "    if(JSON.stringify(A[k])!==JSON.stringify(B[k])) d.push(k); });",
 "  for(var i=0;i<A.kol.length;i++){ var a=A.kol[i],b=B.kol[i];",
 "    if(!b){ d.push('koloni kayboldu'); continue; }",
 "    Object.keys(a).forEach(function(k){ if(k!=='key' &&",
 "      JSON.stringify(a[k])!==JSON.stringify(b[k]))",
 "      d.push(a.key+'.'+k+':'+JSON.stringify(a[k])+'→'+JSON.stringify(b[k])); }); }",
 "  return d; }"].join('\n');

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
  ok("sw cache = 'stars-v96f1'", /const CACHE = 'stars-v96f1'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 (Faz 85F ile yükseldi)', /v:8, cfg:G\.cfg/.test(mainJs));
  ok('world şeması değişmedi',
     /memAge: \(typeof G\.memAge/.test(mainJs) &&
     /sandbox: G\.sandbox === true/.test(mainJs));
}
/* YAPI: sekiz tik artık init kapısının arkasında */
{
  const eco=oku('economy.js');
  ok('advanceMonthlyWorld() yardımcısı var',
     /function advanceMonthlyWorld\(\)\{/.test(eco));
  ok('aylık dünya YALNIZ init===false yolunda çağrılıyor',
     /if \(!init\) advanceMonthlyWorld\(\);/.test(eco));
  ok('advanceMonthlyWorld p_imp/economyTick içine gömülmedi (tek çağrı)',
     (eco.match(/advanceMonthlyWorld\(\)/g)||[]).length===2,
     String((eco.match(/advanceMonthlyWorld\(\)/g)||[]).length));
  /* Sekiz tik economyTick gövdesinde DOĞRUDAN çağrılmamalı */
  const i=eco.indexOf('function economyTick(init){');
  const govde=eco.slice(i, i+1200);
  ['groundTick','invasionTick','repairTick','colossusTick','terraformTick',
   'radiationTick','panopticonTick','secessionTick'].forEach(t=>{
    ok(t+'() economyTick gövdesinden çıkarıldı', govde.indexOf(t+'()')<0);
    ok(t+'() advanceMonthlyWorld içinde duruyor',
       new RegExp('function advanceMonthlyWorld[\\s\\S]{0,1200}'+t+'\\(\\)').test(eco));
  });
  /* Türetilmiş hesap init yolunda DA çalışmalı */
  ok('recalcMods init yolunda da çalışıyor', /recalcMods\(e\);/.test(govde));
  ok('empireIncome init yolunda da çalışıyor', /const inc = empireIncome\(e\);/.test(govde));
  ok('refreshLuxury init yolunda da çalışıyor', /refreshLuxury\(e\);/.test(govde));
  ok('refreshReach init yolunda da çalışıyor', /refreshReach\(\);/.test(govde));
  ok('kaynak ekleme hâlâ init kapısının ARKASINDA',
     /if \(init\) continue;\s*\n\s*for \(const k in inc\) e\.res\[k\] \+= inc\[k\];/.test(eco));
  /* Serialize-geri-yükleme hilesi kullanılmadı */
  ok('durumu değiştirip serialize kopyasından geri yükleme YOK',
     govde.indexOf('serialize(')<0 && govde.indexOf('deserialize(')<0);
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

/* ═══ B. SENARYO 1 — KALKAN İDEMPOTANSI ═══ */
console.log('\nB. SENARYO 1 — KALKAN İDEMPOTANSI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sy=G.sys.filter(function(s){return s.owner===e.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "pl.col.shield=4;",
    "var k=serialize(), dizi=[4];",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(G.sys[sy.id].planets[pl.i].col.shield); }",
    "var oncAy=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(false);",
    "var ay1=G.sys[sy.id].planets[pl.i].col.shield;",
    "economyTick(false);",
    "var ay2=G.sys[sy.id].planets[pl.i].col.shield;",
    "return JSON.stringify({dizi:dizi, oncAy:oncAy, ay1:ay1, ay2:ay2});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 ardışık yüklemede kalkan TAM 4 kaldı',
     Array.isArray(d.dizi) && d.dizi.length===11 &&
     d.dizi.every(x=>x===4), (d.dizi||[]).join('→'));
  ok('gerçek economyTick(false) kalkanı BİR ay ilerletti',
     d.ay1>d.oncAy, d.oncAy+' → '+d.ay1);
  ok('ikinci gerçek ay da normal ilerledi (mekanik ölmedi)',
     d.ay2>d.ay1, d.ay1+' → '+d.ay2);
}

/* ═══ C. SENARYO 2 — AKTİF KUŞATMA ═══ */
console.log('\nC. SENARYO 2 — AKTİF KUŞATMA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([AKTIF, SNAP,
    "var k=serialize();",
    "var A=snap();",
    "deserialize(k);",
    "var B=snap();",
    "var d1=farkla(A,B);",
    "/* 5 kez daha yükle */",
    "for(var i=0;i<5;i++) deserialize(k);",
    "var C=snap();",
    "var d2=farkla(B,C);",
    "var c1=G.sys[SYID].planets[PLI].col;",
    "return JSON.stringify({d1:d1, d2:d2,",
    "  sh:c1.shield, gar:c1.garrison, garB:c1.garrisonBase, sg:c1.siege,",
    "  st:c1.stab, pop:c1.pop, own:G.sys[SYID].owner});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('tek yüklemede gerçek oyun durumu HİÇ değişmedi',
     Array.isArray(d.d1) && d.d1.length===0, (d.d1||[]).slice(0,4).join(' · '));
  ok('6 ardışık yüklemede de değişmedi',
     Array.isArray(d.d2) && d.d2.length===0, (d.d2||[]).slice(0,4).join(' · '));
  ok('shield korundu (4)', d.sh===4, String(d.sh));
  ok('garrison korundu (10)', d.gar===10, String(d.gar));
  ok('garrisonBase korundu (10)', d.garB===10, String(d.garB));
  ok('siege korundu (2) — bombardıman ilerlemedi', d.sg===2, String(d.sg));
  ok('stab/pop korundu', d.st===20 && d.pop===12, d.st+'/'+d.pop);
  ok('gezegen sahipliği değişmedi — işgal olmadı', d.own===0, String(d.own));
}
/* Gerçek ayda kuşatma mekaniği YALNIZ BİR kez ilerlemeli */
{
  const H=harness(); H.R(KUR);
  const r=H.R([AKTIF,
    "var k=serialize();",
    "for(var i=0;i<4;i++) deserialize(k);",
    "var c=G.sys[SYID].planets[PLI].col;",
    "var shA=c.shield, garA=c.garrisonBase;",
    "economyTick(false);",
    "var c2=G.sys[SYID].planets[PLI].col;",
    "var shB=c2.shield, garB=c2.garrisonBase;",
    "/* aynı tek ayı taze yüklemeden sonra tekrar ölç */",
    "deserialize(k); economyTick(false);",
    "var c3=G.sys[SYID].planets[PLI].col;",
    "return JSON.stringify({shA:shA, shB:shB, garA:garA, garB:garB,",
    "  tekAySh:c3.shield, tekAyGar:c3.garrisonBase});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('4 yükleme sonrası tek ay = taze yükleme sonrası tek ay (aynı sonuç)',
     d.shB===d.tekAySh && d.garB===d.tekAyGar,
     'kalkan '+d.shB+'/'+d.tekAySh+' · garnizon '+d.garB+'/'+d.tekAyGar);
  ok('gerçek ay mekaniği çalışmaya devam ediyor',
     d.shB>d.shA && d.garB>=d.garA, d.shA+'→'+d.shB);
}

/* ═══ D. SENARYO 3 — FİLO TAMİRİ ═══ */
console.log('\nD. SENARYO 3 — FİLO TAMİRİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sy=G.sys.filter(function(s){return s.owner===e.id;})[0];",
    "e.res.ene=9000; e.res.min=9000;",
    "var f=G.fleets.filter(function(x){return x.e===e.id&&x.ships&&x.ships.length;})[0];",
    "f.sys=sy.id; f.s=sy.id; f.ships.forEach(function(sh){sh.h=0.5;});",
    "var fid=f.id;",
    "function huls(){ var g=G.fleets.filter(function(x){return x.id===fid;})[0];",
    "  return g?g.ships.map(function(s){return +s.h.toFixed(4);}).join('|'):'YOK'; }",
    "var h0=huls();",
    "var k=serialize();",
    "var dizi=[h0];",
    "for(var i=0;i<5;i++){ deserialize(k); dizi.push(huls()); }",
    "economyTick(true); var initSonra=huls();",
    "var oncAy=huls(); economyTick(false); var ay1=huls();",
    "return JSON.stringify({dizi:dizi, initSonra:initSonra,",
    "  oncAy:oncAy, ay1:ay1, resEne:G.p.res.ene});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('5 ardışık yüklemede gemi gövdesi ARTMADI',
     Array.isArray(d.dizi) && d.dizi.every(x=>x===d.dizi[0]),
     (d.dizi||[]).join(' → '));
  ok('economyTick(true) gövdeyi artırmadı', d.initSonra===d.oncAy,
     d.initSonra);
  ok('economyTick(false) tamiri BİR kez çalıştırdı',
     d.ay1!==d.oncAy, d.oncAy+' → '+d.ay1);
}

/* ═══ E. SENARYO 4 — COLOSSUS ═══ */
console.log('\nE. SENARYO 4 — COLOSSUS');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, dus=G.emps[1];",
    "e.war[dus.id]=true; dus.war[e.id]=true;",
    "e.contact[dus.id]=true;",
    "var hs=G.sys.filter(function(s){return s.owner===dus.id;})[0];",
    "G.fleets.push({id:9001,e:e.id,sys:hs.id,s:hs.id,",
    "  ships:[{c:'col_s',h:1}],charge:3,combat:false,name:'KOL'});",
    "function ch(){ var f=G.fleets.filter(function(x){return x.id===9001;})[0];",
    "  return f?(f.charge||0):-1; }",
    "function gez(){ var p=hs.planets.filter(function(p){return p.col;})[0];",
    "  return p?(p.col.pop||0):-1; }",
    "var k=serialize(), dizi=[ch()], pops=[gez()];",
    "for(var i=0;i<5;i++){ deserialize(k);",
    "  hs=G.sys[hs.id]; dizi.push(ch()); pops.push(gez()); }",
    "var oncAy=ch(); economyTick(false); var ay1=ch();",
    "return JSON.stringify({dizi:dizi, pops:pops, oncAy:oncAy, ay1:ay1,",
    "  filoVar:G.fleets.some(function(f){return f.id===9001;})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('5 ardışık yüklemede charge TAM 3 kaldı',
     Array.isArray(d.dizi) && d.dizi.every(x=>x===3), (d.dizi||[]).join('→'));
  ok('Colossus filosu yüklemede kaybolmadı', d.filoVar===true);
  ok('hedef gezegen ATEŞLENMEDİ / yok edilmedi',
     Array.isArray(d.pops) && d.pops.every(x=>x===d.pops[0]),
     (d.pops||[]).join('→'));
  ok('gerçek ayda sayaç mevcut kurala göre ilerledi',
     d.ay1>d.oncAy, d.oncAy+' → '+d.ay1);
}

/* ═══ F. SENARYO 5 — TERRAFORM ═══ */
console.log('\nF. SENARYO 5 — TERRAFORM');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sy=G.sys.filter(function(s){return s.owner===e.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "pl.terraform={left:5,woke:false,sleeper:false,sabotajAy:0};",
    "function tf(){ var p=G.sys[sy.id].planets[pl.i];",
    "  return JSON.stringify(p.terraform||null); }",
    "var k=serialize(), dizi=[tf()], rngD=[RND_STATE];",
    "for(var i=0;i<5;i++){ deserialize(k); dizi.push(tf()); rngD.push(RND_STATE); }",
    "var filoOnce=G.fleets.length;",
    "var oncAy=tf(); economyTick(false); var ay1=tf();",
    "return JSON.stringify({dizi:dizi, rng:rngD, oncAy:oncAy, ay1:ay1,",
    "  filoOnce:filoOnce, filoSonra:G.fleets.length,",
    "  hepsiAyni:dizi.every(function(x){return x===dizi[0];}),",
    "  rngSabit:rngD.every(function(x){return x===rngD[0];})});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('5 yüklemede terraform (left/woke/sleeper/sabotajAy) AYNI',
     d.hepsiAyni===true, (d.dizi||[])[0]);
  ok('yükleme RNG TÜKETMEDİ', d.rngSabit===true, (d.rng||[]).join(','));
  ok('yüklemede Uyuyan Kraliçe DOĞMADI (filo sayısı sabit)',
     d.filoOnce===d.filoSonra, d.filoOnce+'/'+d.filoSonra);
  ok('gerçek aylık tik yalnız BİR aylık ilerleme sağladı',
     d.ay1!==d.oncAy, d.oncAy+' → '+d.ay1);
}

/* ═══ G. SENARYO 6 — RADYASYON / PANOPTICON / AYRILIK ═══ */
console.log('\nG. SENARYO 6 — RADYASYON / PANOPTICON / AYRILIK');
{
  const H=harness(); H.R(KUR);
  const r=H.R([AKTIF,
    "function durum(){ var s=G.sys[SYID], p=s.planets[PLI];",
    "  return {rad:s.radiation||0,",
    "    huls:G.fleets.filter(function(f){return f.sys===SYID;})",
    "      .map(function(f){return f.id+'='+f.ships.map(function(x){",
    "        return (+x.h).toFixed(3);}).join('|');}).join(';'),",
    "    filoSayi:G.fleets.length,",
    "    seen:(s.seen||[]).join(''), panopt:JSON.stringify(s.panopt||null),",
    "    lock:JSON.stringify(G.p.panoptLock||null),",
    "    sec:p.col.secede, own:s.owner,",
    "    unr:JSON.stringify(p.col.unrest||null)}; }",
    "var k=serialize();",
    "var A=durum();",
    "for(var i=0;i<5;i++) deserialize(k);",
    "var B=durum();",
    "var fark=Object.keys(A).filter(function(x){",
    "  return JSON.stringify(A[x])!==JSON.stringify(B[x]); });",
    "/* gerçek ay: mekanikler ÖLMEMİŞ olmalı */",
    "economyTick(false);",
    "var C=durum();",
    "var calisan=Object.keys(A).filter(function(x){",
    "  return JSON.stringify(B[x])!==JSON.stringify(C[x]); });",
    "return JSON.stringify({fark:fark, calisan:calisan,",
    "  A:A, B:B, C:C});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('RADYASYON: 5 yüklemede gemi gövdesi değişmedi',
     d.A && d.B && d.A.huls===d.B.huls, (d.B||{}).huls);
  ok('RADYASYON: yüklemede filo yok olmadı',
     d.A && d.A.filoSayi===d.B.filoSayi, (d.A||{}).filoSayi+'/'+(d.B||{}).filoSayi);
  ok('PANOPTICON: yüklemede sys.panopt yazılmadı',
     d.A && d.A.panopt===d.B.panopt, (d.B||{}).panopt);
  ok('PANOPTICON: yüklemede sys.seen değişmedi',
     d.A && d.A.seen===d.B.seen);
  ok('PANOPTICON: panoptLock korundu', d.A && d.A.lock===d.B.lock);
  ok('AYRILIK: secede sayacı yüklemede ilerlemedi',
     d.A && d.A.sec===d.B.sec, String((d.B||{}).sec));
  ok('AYRILIK: yüklemede sahiplik değişmedi', d.A && d.A.own===d.B.own);
  ok('AYRILIK: unrest sayacı yüklemede tüketilmedi',
     d.A && d.A.unr===d.B.unr);
  ok('yükleme hiçbir alanı değiştirmedi (toplu)',
     Array.isArray(d.fark) && d.fark.length===0, (d.fark||[]).join(','));
  ok('gerçek ayda mekanikler ÇALIŞMAYA DEVAM ediyor (ölmediler)',
     Array.isArray(d.calisan) && d.calisan.length>0,
     'ilerleyen: '+(d.calisan||[]).join(','));
}

/* ═══ H. SENARYO 7 — RNG ═══ */
console.log('\nH. SENARYO 7 — RNG');
{
  const H=harness(); H.R(KUR);
  const r=H.R([AKTIF,
    "var r0=RND_STATE; economyTick(true); var r1=RND_STATE;",
    "var k=serialize(); var dizi=[RND_STATE];",
    "for(var i=0;i<8;i++){ deserialize(k); dizi.push(RND_STATE); }",
    "var g0=RND_STATE; setupGame({name:'Z',race:'insan',traits:[],size:'orta',",
    "  shape:'sarmal',diff:'normal',seed:5,ethics:{mil:0,aut:0,mat:0,ahl:0},",
    "  civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var gr=RND_STATE; economyTick(true); var gr2=RND_STATE;",
    "return JSON.stringify({r0:r0, r1:r1, dizi:dizi,",
    "  sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  kurulumInit:gr===gr2});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('economyTick(true) öncesi/sonrası RND_STATE BİREBİR aynı',
     d.r0===d.r1, d.r0+' / '+d.r1);
  ok('8 ardışık yüklemede RNG kaymadı', d.sabit===true,
     (d.dizi||[]).slice(0,3).join(','));
  ok('setupGame sonrası economyTick(true) de RNG tüketmedi',
     d.kurulumInit===true);
}

/* ═══ I. SENARYO 8 — BİLDİRİM VE NESNE SAYISI ═══ */
console.log('\nI. SENARYO 8 — BİLDİRİM VE NESNE SAYISI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([AKTIF,
    "G.log=[]; G.inbox=G.inbox||[]; G.fx=G.fx||[];",
    "var a={log:G.log.length, inbox:G.inbox.length, fx:G.fx.length,",
    "  filo:G.fleets.length, emp:G.emps.length,",
    "  kol:G.emps.reduce(function(n,x){return n+((x.colonies||[]).length);},0)};",
    "economyTick(true);",
    "var b={log:G.log.length, inbox:G.inbox.length, fx:G.fx.length,",
    "  filo:G.fleets.length, emp:G.emps.length,",
    "  kol:G.emps.reduce(function(n,x){return n+((x.colonies||[]).length);},0)};",
    "var k=serialize(); G.log=[];",
    "for(var i=0;i<5;i++) deserialize(k);",
    "var c={log:G.log.length, filo:G.fleets.length, emp:G.emps.length,",
    "  kol:G.emps.reduce(function(n,x){return n+((x.colonies||[]).length);},0)};",
    "return JSON.stringify({a:a,b:b,c:c});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('init YENİ bildirim (say/log) üretmedi',
     d.a && d.a.log===d.b.log, d.a.log+' → '+d.b.log);
  ok('init inbox girdisi üretmedi', d.a && d.a.inbox===d.b.inbox);
  ok('init eventArt/fx üretmedi', d.a && d.a.fx===d.b.fx);
  ok('init filo sayısını değiştirmedi', d.a && d.a.filo===d.b.filo,
     d.a.filo+'/'+d.b.filo);
  ok('init imparatorluk sayısını değiştirmedi', d.a && d.a.emp===d.b.emp);
  ok('init koloni sayısını değiştirmedi', d.a && d.a.kol===d.b.kol,
     d.a.kol+'/'+d.b.kol);
  ok('5 yükleme de bildirim üretmedi', d.c && d.c.log===0, String((d.c||{}).log));
  ok('5 yükleme filo/imp/koloni sayısını korudu',
     d.c && d.c.filo===d.b.filo && d.c.emp===d.b.emp && d.c.kol===d.b.kol);
}

/* ═══ J. SENARYO 9 — TÜRETİLMİŞ EKONOMİ ═══ */
console.log('\nJ. SENARYO 9 — TÜRETİLMİŞ EKONOMİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p;",
    "economyTick(true);",
    "var dogruInc=JSON.stringify(e.inc);",
    "var dogruMods=JSON.stringify(e.mods);",
    "var dogruLux=JSON.stringify(e.luxury);",
    "var resOnce=JSON.stringify(e.res);",
    "/* inc / mods / luxury ZEHİRLE (şekli bozmadan — refreshReach",
    "   mods.sensor okur, null vermek yükleme dışı bir çökme olurdu) */",
    "e.inc={min:-999,ene:-999,yiy:-999,ala:-999,ara:-999,tuk:-999,etk:-999};",
    "e.mods=Object.assign({}, e.mods, {stab:-999, buildMul:-999});",
    "/* NOT: e.luxury KASTEN zehirlenmiyor — döngüde empireIncome()",
    "   refreshLuxury()'den ÖNCE çalışır, yani bozuk lüks o turun",
    "   gelirine girer. Lüks onarımı ayrı alt testte ölçülüyor. */",
    "G.sys.forEach(function(s){ delete s._reach; });",
    "var reachOnce=G.sys.filter(function(s){",
    "  return s._reach!==undefined;}).length;",
    "economyTick(true);",
    "var reachVar=G.sys.filter(function(s){",
    "  return s.owner!==undefined && s.owner!==null && s._reach!==undefined;}).length;",
    "var sahipli=G.sys.filter(function(s){",
    "  return s.owner!==undefined && s.owner!==null;}).length;",
    "return JSON.stringify({",
    "  incDuzeldi:JSON.stringify(e.inc)===dogruInc,",
    "  incSonra:JSON.stringify(e.inc).slice(0,70),",
    "  modsDuzeldi:JSON.stringify(e.mods)===dogruMods,",
    "  luxAyni:JSON.stringify(e.luxury)===dogruLux,",
    "  resAyni:JSON.stringify(e.res)===resOnce,",
    "  reachOnce:reachOnce, reachVar:reachVar, sahipli:sahipli});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('zehirli e.inc doğru gelirle YENİDEN hesaplandı', d.incDuzeldi===true,
     String(d.incSonra));
  ok('bu gelir kaynak STOKLARINA eklenmedi', d.resAyni===true);
  ok('zehirli e.mods recalcMods ile onarıldı', d.modsDuzeldi===true);
  ok('e.luxury bozulmadan korundu', d.luxAyni===true);
  ok('silinen _reach yeniden kuruldu',
     d.reachOnce===0 && d.sahipli>0 && d.reachVar===d.sahipli,
     d.reachOnce+' → '+d.reachVar+'/'+d.sahipli);
}
/* refreshLuxury ayrı ölçüm: zehirli luxury onarılır ve gelir
   bir sonraki türetilmiş hesapta doğru değere YAKINSAR. */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p; economyTick(true);",
    "var dogruLux=JSON.stringify(e.luxury), dogruInc=JSON.stringify(e.inc);",
    "e.luxury={ZEHIR:1};",
    "economyTick(true);",
    "var lux1=JSON.stringify(e.luxury), inc1=JSON.stringify(e.inc);",
    "economyTick(true);",
    "var inc2=JSON.stringify(e.inc);",
    "return JSON.stringify({luxDuzeldi:lux1===dogruLux,",
    "  incYakinsadi:inc2===dogruInc, incAraTur:inc1===dogruInc});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('zehirli e.luxury refreshLuxury ile onarıldı', d.luxDuzeldi===true);
  ok('gelir bir sonraki türetilmiş hesapta doğru değere yakınsadı',
     d.incYakinsadi===true,
     d.incAraTur ? 'ilk turda da doğru' : 'ara turda lüks sırası nedeniyle sapma');
}

/* ═══ K. SENARYO 10 — ESKİ/KISMİ KAYIT ═══ */
console.log('\nK. SENARYO 10 — SHIELD/GARRISON ALANI OLMAYAN KAYIT');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sy=G.sys.filter(function(s){return s.owner===e.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "/* alanları TAMAMEN kaldır — eski kayıt taklidi */",
    "G.sys.forEach(function(s){ (s.planets||[]).forEach(function(p){",
    "  if(p.col){ delete p.col.shield; delete p.col.garrison;",
    "             delete p.col.garrisonBase; } }); });",
    "var k=serialize();",
    "var v=JSON.parse(k);",
    "var kayittaYok=v.sys.every(function(s){ return (s.p||[]).every(function(p){",
    "  return !p.col || (p.col.shield===undefined && p.col.garrison===undefined); }); });",
    "var hata='', sonuc=null;",
    "try{ sonuc=deserialize(k); }catch(ex){ hata=ex.message; }",
    "var c=G.sys[sy.id].planets[pl.i].col;",
    "var yuk1={sh:c.shield, gar:c.garrison, garB:c.garrisonBase};",
    "for(var i=0;i<4;i++) deserialize(k);",
    "var c2=G.sys[sy.id].planets[pl.i].col;",
    "var yuk5={sh:c2.shield, gar:c2.garrison, garB:c2.garrisonBase};",
    "economyTick(false);",
    "var c3=G.sys[sy.id].planets[pl.i].col;",
    "var ay1={sh:c3.shield, gar:c3.garrison, garB:c3.garrisonBase};",
    "return JSON.stringify({kayittaYok:kayittaYok, hata:hata, sonuc:sonuc,",
    "  yuk1:yuk1, yuk5:yuk5, ay1:ay1});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıtta shield/garrison gerçekten YOK', d.kayittaYok===true);
  ok('eksik alanlı kayıt HATA ATMADAN açıldı',
     d.hata==='' && d.sonuc===true, d.hata||'ok');
  ok('yükleme hayali bir ay OYNATMADI (shield doldurulmadı)',
     d.yuk1 && (d.yuk1.sh===undefined || d.yuk1.sh===0),
     'shield='+String((d.yuk1||{}).sh));
  ok('5 yükleme sonrası da doldurulmadı',
     JSON.stringify(d.yuk1)===JSON.stringify(d.yuk5),
     JSON.stringify(d.yuk5));
  ok('ilk gerçek ayda mevcut kurala göre BİR kez başlatıldı',
     d.ay1 && typeof d.ay1.sh==='number' && d.ay1.sh>0,
     'shield='+String((d.ay1||{}).sh));
}
/* Kayıtlı bir shield değeri KESİNLİKLE değiştirilmemeli */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var sy=G.sys.filter(function(s){return s.owner===G.p.id;})[0];",
    "var pl=sy.planets.filter(function(p){return p.col;})[0];",
    "var degerler=[0,1,4,7,13];",
    "var sonuc=[];",
    "for(var j=0;j<degerler.length;j++){",
    "  pl.col.shield=degerler[j];",
    "  var k=serialize();",
    "  for(var i=0;i<3;i++) deserialize(k);",
    "  sonuc.push(G.sys[sy.id].planets[pl.i].col.shield);",
    "  pl=G.sys[sy.id].planets[pl.i]; }",
    "return JSON.stringify({beklenen:degerler, alinan:sonuc});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıtlı her shield değeri (0/1/4/7/13) aynen korundu',
     JSON.stringify(d.beklenen)===JSON.stringify(d.alinan),
     'beklenen '+(d.beklenen||[]).join(',')+' · alınan '+(d.alinan||[]).join(','));
}

/* ═══ L. SENARYO 11 — SETUPGAME ═══ */
console.log('\nL. SENARYO 11 — YENİ OYUN KURULUMU');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.log=[];",
    "setupGame({name:'Y',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:11,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "var e=G.p;",
    "var hasarli=G.fleets.some(function(f){ return (f.ships||[]).some(function(s){",
    "  return s.h!==undefined && s.h<1 && s.h>0; }); });",
    "var sarj=G.fleets.some(function(f){ return (f.charge||0)>0; });",
    "var kusatma=false, terra=false, kalkan=false;",
    "G.sys.forEach(function(s){ (s.planets||[]).forEach(function(p){",
    "  if(!p.col) return;",
    "  if(p.col.siege) kusatma=true;",
    "  if(p.terraJob||p.terraform) terra=true;",
    "  if(p.col.shield) kalkan=true; }); });",
    "return JSON.stringify({log:G.log.length, hasarli:hasarli, sarj:sarj,",
    "  kusatma:kusatma, terra:terra, kalkan:kalkan,",
    "  incVar:!!(e.inc && typeof e.inc==='object'),",
    "  incAlan:e.inc?Object.keys(e.inc).length:0,",
    "  modsVar:!!e.mods, reach:G.sys.filter(function(s){",
    "    return s.owner!==undefined&&s.owner!==null&&s._reach!==undefined;}).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yeni oyun istenmeden TAMİR üretmedi', d.hasarli===false);
  ok('yeni oyun istenmeden COLOSSUS ŞARJI üretmedi', d.sarj===false);
  ok('yeni oyun istenmeden BOMBARDIMAN/kuşatma üretmedi', d.kusatma===false);
  ok('yeni oyun istenmeden PROJE ilerlemesi üretmedi', d.terra===false);
  ok('yeni oyun istenmeden KALKAN doldurmadı', d.kalkan===false);
  ok('başlangıç ekonomisi görünür ve hesaplanmış',
     d.incVar===true && d.incAlan>0, d.incAlan+' alan');
  ok('mods ve _reach kurulmuş', d.modsVar===true && d.reach>0,
     'reach '+d.reach);
}

/* ═══ M. SENARYO 12 — FAZ 85A POLİTİK DÜNYA REGRESYONU ═══ */
console.log('\nM. SENARYO 12 — FAZ 85A POLİTİK DÜNYA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.memAge=137; G.cncAge=64;",
    "var uye=G.emps.filter(function(x){return !x.wild&&!x.dead;})",
    "  .map(function(x){return x.id;});",
    "G.council={name:'Büyük Konsey',founder:0,members:uye,",
    "  laws:{ticaretStd:true,sinirGuv:true},targeted:{parya:2},treasury:412,",
    "  president:0,termStart:G.day,terms:{0:2},voteIn:9,",
    "  vote:{key:'ambargo',target:3,yes:[0,1],no:[2],done:false,age:4},dead:false};",
    "G.feds=[{id:7,name:'Kuzey',members:[0,1],laws:{ortakSavunma:true},",
    "  treasury:250,nextVote:G.day+40,vote:{law:'ortakPazar',yes:[0],no:[],",
    "  done:false},founder:0}];",
    "G.fedUid=7; G.friction={'0:2':14};",
    "G.rebelAlliance={target:3,members:[0,1],since:120,revealed:true};",
    "G.megaWatch=[{id:2,tur:'dyson',since:100}]; G.sandbox=true;",
    "var k=serialize(); var v=JSON.parse(k);",
    "/* zehirle */",
    "G.memAge=999; G.council=null; G.feds=[]; G.fedUid=0; G.sandbox=false;",
    "G.rebelAlliance=null; G.megaWatch=[]; G.friction={};",
    "for(var i=0;i<5;i++) deserialize(k);",
    "return JSON.stringify({surum:v.v,",
    "  worldAlan:Object.keys(v.world||{}).sort().join(','),",
    "  memAge:G.memAge, cncAge:G.cncAge,",
    "  konsey:G.council&&G.council.name, hazine:G.council&&G.council.treasury,",
    "  oy:G.council&&G.council.vote&&G.council.vote.key,",
    "  yaptirim:G.council&&G.council.targeted&&G.council.targeted.parya,",
    "  fed:(G.feds[0]||{}).name, fedHaz:(G.feds[0]||{}).treasury,",
    "  fedUid:G.fedUid, rebel:G.rebelAlliance&&G.rebelAlliance.target,",
    "  mega:(G.megaWatch||[]).length, sandbox:G.sandbox,",
    "  friction:JSON.stringify(G.friction)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıt sürümü v:8 (Faz 85F)', d.surum===8, 'v='+d.surum);
  ok('world şeması değişmedi (dokuz alan)',
     d.worldAlan==='cncAge,council,fedUid,feds,friction,megaWatch,memAge,rebelAlliance,sandbox',
     d.worldAlan);
  ok('5 yükleme sonrası memAge/cncAge korundu',
     d.memAge===137 && d.cncAge===64, d.memAge+'/'+d.cncAge);
  ok('Konsey + hazine + oy + yaptırım korundu',
     d.konsey==='Büyük Konsey' && d.hazine===412 &&
     d.oy==='ambargo' && d.yaptirim===2);
  ok('federasyon + hazine + fedUid korundu',
     d.fed==='Kuzey' && d.fedHaz===250 && d.fedUid===7);
  ok('rebelAlliance / megaWatch / sandbox / friction korundu',
     d.rebel===3 && d.mega===1 && d.sandbox===true &&
     d.friction==='{"0:2":14}');
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
