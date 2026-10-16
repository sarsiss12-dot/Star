#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.2: GERÇEK ANLAŞMA TRANSACTION'I
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
const KUR=[
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "G.emps.forEach(function(x){ G.emps.forEach(function(y){",
 "  if(x.id!==y.id && !x.wild && !y.wild && !x.dead && !y.dead)",
 "    x.contact[y.id]=true; }); });",
 "economyTick(true); return 'ok';"].join('\n');
/* Tüm kalıcı kökleri kapsayan anlık görüntü. */
const FOTO=[
 "function foto(){ return JSON.stringify({",
 "  sysOwner:G.sys.map(function(s){return s.owner;}).join(','),",
 "  kol:G.emps.map(function(x){return (x.colonies||[]).length;}).join(','),",
 "  kolDetay:G.sys.map(function(s){return (s.planets||[]).map(function(p){",
 "    return p.col?[p.col.pop,p.col.stab,p.col.owner].join('/'):'';}).join('');}).join('|'),",
 "  filo:G.fleets.length+':'+G.fleets.map(function(f){",
 "    return f.id+'@'+f.e+'#'+((f.ships||[]).length);}).join(','),",
 "  dead:G.emps.map(function(x){return x.dead?1:0;}).join(','),",
 "  res:G.emps.map(function(x){return JSON.stringify(x.res);}).join(';'),",
 "  rel:G.emps.map(function(x){return JSON.stringify(x.rel);}).join(';'),",
 "  mem:G.emps.map(function(x){return JSON.stringify(x.mem||{});}).join(';'),",
 "  war:G.emps.map(function(x){return JSON.stringify(x.war);}).join(';'),",
 "  ally:G.emps.map(function(x){return JSON.stringify(x.ally);}).join(';'),",
 "  nap:G.emps.map(function(x){return JSON.stringify(x.nap||{});}).join(';'),",
 "  pact:G.emps.map(function(x){return JSON.stringify(x.pact||{});}).join(';'),",
 "  proxy:G.emps.map(function(x){return JSON.stringify(x.proxyWar||{});}).join(';'),",
 "  peaceAt:G.emps.map(function(x){return JSON.stringify(x.peaceAt||{});}).join(';'),",
 "  fac:G.emps.map(function(x){return (x.factions||[]).map(function(f){",
 "    return f.k+':'+Math.round(f.pow||0);}).join('+');}).join('|'),",
 "  feds:JSON.stringify(G.feds||[]), council:JSON.stringify(G.council||null),",
 "  fall:JSON.stringify(G.fallStats||{}), sab:JSON.stringify(G.sabStats||{}),",
 "  log:(G.log||[]).length, inbox:(G.inbox||[]).length, inboxUid:G.inboxUid,",
 "  rng:RND_STATE,",
 "  authVar:('_dealAuth' in G)+'/'+('_warAuth' in G)+'/'+('_warWhy' in G),",
 "  auth:String(G._dealAuth)+'/'+String(G._warAuth)+'/'+String(G._warWhy)}); }"].join('\n');

/* ═══ A. DOSYA SINIRI VE KARANTİNA ═══ */
console.log('\nA. DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const dip=oku('diplomacy.js'), mn=oku('main.js');
  ok("sw cache = 'stars-v95a'", /const CACHE = 'stars-v95a'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, mn.includes(k)));
  ['dealTxBegin','dealTxRollback','dealTxRestoreAuth','txCaptureGraph',
   'txRestoreGraph','dealPostcondition','canPromiseWarOn'].forEach(f=>
    ok('kanonik fonksiyon: '+f, new RegExp('function '+f+'\\(').test(dip)));
  ok('yan etki tamponu say() içinde', /if \(G\._sideBuf\)\{ G\._sideBuf\.push/.test(mn));
  ok('flushSideBuffer commit sonrası yayımlıyor',
     /function flushSideBuffer/.test(mn) && /flushSideBuffer\(buf\)/.test(dip));
  ok('doğrudan UI etkisi de tamponlanıyor (deferUI)',
     /function deferUI/.test(mn) && /deferUI\(UI\.warDeclared/.test(dip));
  ok('yüzeysel dealJournal/dealRollback KALDIRILDI',
     !/function dealJournal\(/.test(dip) && !/function dealRollback\(/.test(dip));
  ok('istisna executeDeal dışına SIZMIYOR (catch daima false döner)',
     /catch\(err\)\{[\s\S]{0,420}return false;/.test(dip));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
  ok('DURUMLAR sekmesi gizli', /\/\/ \{k:'durum'/.test(mn));
  const H=harness(); H.R(KUR);
  const sit=H.R(["G.sits=[]; G.sitDone={};",
    "for (var m=0;m<200;m++){ G.day+=30; monthTick(); G.over=null; }",
    "return String((G.sits||[]).length);"].join('\n'));
  ok('200 ayda situation tetiklenmedi', String(sit)==='0', String(sit));
}
{
  /* FAZ 86C.4H: map.js ve main.js bu hotfix'te DEĞİŞİYOR
     (pointer yaşam döngüsü + yükleme sonrası kurtarma), bu
     yüzden korunan kümeden çıkarıldılar. */
  /* FAZ 86C.4H-R1: ui.js bu turda DEĞİŞİYOR (mapFix kanonik
     sırası), korunan kümeden çıkarıldı. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json'].forEach(f=>{
    if(!ref||!ref[f]){ ok(f+' referansı var', false); return; }
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
}

/* ═══ B. İKİ DOĞRULUK HATASI ═══ */
console.log('\nB. REDUNDANT PEACE VE warOn SÖZÜ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.war[o.id]=false; o.war[e.id]=false; e.res.min=5000; e.res.etk=9999;",
    "var oMin=o.res.min;",
    "var of={from:e.id,to:o.id,give:[{t:'peace'},{t:'res',r:'min',v:10}],want:[]};",
    "var n=normalizeDeal(of), q=dealQuote(of), r1=executeDeal(of);",
    "/* tek başına redundant peace hâlâ reddedilmeli */",
    "var q2=dealQuote({from:e.id,to:o.id,give:[{t:'peace'}],want:[]});",
    "/* gerçek savaşta peace hâlâ geçerli */",
    "e.war[o.id]=true; o.war[e.id]=true;",
    "e.exh=e.exh||{}; e.exh[o.id]=99; o.exh=o.exh||{}; o.exh[e.id]=99;",
    "e.warSince=e.warSince||{}; e.warSince[o.id]=0;",
    "var q3=dealQuote({from:e.id,to:o.id,give:[{t:'peace'}],want:[]});",
    "return JSON.stringify({effGive:(n.effectiveGive||[]).map(function(x){return x.t;}),",
    "  redundant:(n.redundantItems||[]).map(function(x){return x.yon+':'+x.t;}),",
    "  quoteOk:q.ok, giveFail:q.giveFail, exec:r1, transfer:o.res.min-oMin,",
    "  tekBasinaRedundant:q2.ok, gercekSavastaOk:q3.ok});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('redundant peace + yeni res: quote GEÇERLİ', d.quoteOk===true,
     JSON.stringify(d.giveFail));
  ok('effective plan yalnız res içeriyor',
     JSON.stringify(d.effGive)==='["res"]', JSON.stringify(d.effGive));
  ok('redundant peace yapısal olarak kaydedildi',
     JSON.stringify(d.redundant)==='["give:peace"]');
  ok('anlaşma yürüdü ve yalnız res aktarıldı',
     d.exec===true && d.transfer===10, 'transfer '+d.transfer);
  ok('tek başına redundant peace hâlâ REDDEDİLİYOR',
     d.tekBasinaRedundant===false);
  ok('gerçek savaşta peace hâlâ GEÇERLİ', d.gercekSavastaOk===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2], C=G.emps[3];",
    "A.res.etk=9999; A.war[C.id]=false; C.war[A.id]=false;",
    "var authOnce=('_warAuth' in G)+'/'+('_dealAuth' in G);",
    "var q=dealQuote({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "var authSonra=('_warAuth' in G)+'/'+('_dealAuth' in G);",
    "var rngOnce=RND_STATE;",
    "for(var i=0;i<50;i++) dealQuote({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "var pr=canPromiseWarOn(A,C);",
    "/* saf: aynı girdi aynı sonuç */",
    "var d1=JSON.stringify(canPromiseWarOn(A,C)), d2=JSON.stringify(canPromiseWarOn(A,C));",
    "/* geçersiz hedefler */",
    "var kendi=canPromiseWarOn(A,A);",
    "var wild=canPromiseWarOn(A,G.emps.filter(function(x){return x.wild;})[0]);",
    "var temassiz=(function(){ var t=G.emps[4]; var y=A.contact[t.id];",
    "  A.contact[t.id]=false; var z=canPromiseWarOn(A,t); A.contact[t.id]=y; return z; })();",
    "/* zaten savaşta → redundant */",
    "A.war[C.id]=true; C.war[A.id]=true;",
    "var zaten=canPromiseWarOn(A,C);",
    "var qz=dealQuote({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "A.war[C.id]=false; C.war[A.id]=false;",
    "/* gerçekten uygulanabiliyor mu */",
    "var ex=executeDeal({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "return JSON.stringify({quoteOk:q.ok, neden:(q.reasons||[])[0]||null,",
    "  authOnce:authOnce, authSonra:authSonra, rngAyni:RND_STATE===rngOnce,",
    "  saf:d1===d2, pr:pr.ok, kendi:kendi.why, wild:wild.why,",
    "  temassiz:temassiz.why, zatenRedundant:!!zaten.redundant,",
    "  zatenQuote:qz.ok, exec:ex,",
    "  savasKuruldu:!!(A.war[C.id]&&C.war[A.id])});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('AI warOn sözü quote\'ta GEÇERLİ', d.quoteOk===true, d.neden);
  ok('canPromiseWarOn geçici yetki alanlarına DOKUNMUYOR',
     d.authOnce===d.authSonra, d.authOnce+' → '+d.authSonra);
  ok('50 quote çağrısı RNG tüketmedi', d.rngAyni===true);
  ok('canPromiseWarOn SAF ve deterministik', d.saf===true && d.pr===true);
  ok('kendine savaş sözü reddedildi', /kendine/.test(d.kendi||''), d.kendi);
  ok('korsana savaş sözü reddedildi', /korsan/.test(d.wild||''), d.wild);
  ok('temassız hedefe savaş sözü reddedildi',
     /temas/.test(d.temassiz||''), d.temassiz);
  ok('zaten savaştaysa redundant sayılıyor',
     d.zatenRedundant===true && d.zatenQuote===false);
  ok('warOn gerçekten uygulanabiliyor',
     d.exec===true && d.savasKuruldu===true);
}

/* ═══ C. DERİN ROLLBACK — KOLONİLİ SİSTEM ═══ */
console.log('\nC. KOLONİLİ SİSTEM DEVRİ — 8 AŞAMALI ENJEKSİYON');
{
  const H=harness(); H.R(KUR);
  const r=H.R([FOTO,
    "var e=G.p,o=G.emps[1];",
    "var bos=G.sys.filter(function(s){return s.owner===-1;})[0];",
    "captureSystem(bos, e.id);",
    "bos.planets[0].col={pop:8, stab:60, b:{}, cap:10, owner:e.id};",
    "e.colonies=e.colonies||[]; e.colonies.push({s:bos.id,p:0});",
    "e.res.etk=9999; e.res.min=3000;",
    "var teklif={from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:100},{t:'sys',id:bos.id}],want:[]};",
    "var s={};",
    "['before:res','after:res','before:sys','after:sys',",
    " 'after:items','after:cost','after:goodwill','son'].forEach(function(nk){",
    "  var A=foto();",
    "  G._dealFailInject=function(t){ if(t===nk) throw new Error('enj'); };",
    "  var ok2=false,h='';",
    "  try{ ok2=executeDeal(JSON.parse(JSON.stringify(teklif))); }catch(ex){h=ex.message;}",
    "  delete G._dealFailInject;",
    "  s[nk]={ok:ok2, sizan:h, geriAlindi:A===foto()}; });",
    "var A2=foto(); var son=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "s.son2={ok:son, degisti:A2!==foto(), yeniSahip:G.sys[bos.id].owner===o.id};",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['before:res','after:res','before:sys','after:sys',
   'after:items','after:cost','after:goodwill','son'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok('"'+k+'": TAM geri alma, sıfır sızıntı',
       x.ok===false && x.geriAlindi===true && x.sizan==='',
       'geriAlindi='+x.geriAlindi+' sızan="'+x.sizan+'"');
  });
  const z=d.son2||{};
  ok('enjeksiyonsuz teklif gerçekten uygulandı',
     z.ok===true && z.degisti===true && z.yeniSahip===true);
}

/* ═══ D. warOn VE peace ZİNCİRLERİ ═══ */
console.log('\nD. ÜÇÜNCÜ TARAF VE VEKİL SAVAŞ ZİNCİRLERİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([FOTO,
    "var A=G.emps[1], B=G.emps[2], C=G.emps[3], D=G.emps[4];",
    "A.res.etk=9999; A.war[C.id]=false; C.war[A.id]=false;",
    "C.ally[D.id]=true; D.ally[C.id]=true;",
    "var teklif={from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]};",
    "var s={};",
    "['before:warOn','after:warOn','after:items','after:cost','son'].forEach(function(nk){",
    "  var X=foto();",
    "  G._dealFailInject=function(t){ if(t===nk) throw new Error('e'); };",
    "  var ok2=false,h='';",
    "  try{ ok2=executeDeal(JSON.parse(JSON.stringify(teklif))); }catch(ex){h=ex.message;}",
    "  delete G._dealFailInject;",
    "  s[nk]={ok:ok2, sizan:h, geriAlindi:X===foto()}; });",
    "var X2=foto(); var son=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "s.son2={ok:son, degisti:X2!==foto(), savas:!!(A.war[C.id]&&C.war[A.id])};",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['before:warOn','after:warOn','after:items','after:cost','son'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok('warOn "'+k+'": üçüncü taraf zinciri TAM geri alındı',
       x.ok===false && x.geriAlindi===true && x.sizan==='', 'geri='+x.geriAlindi);
  });
  ok('warOn enjeksiyonsuz uygulandı ve savaş kuruldu',
     (d.son2||{}).ok===true && (d.son2||{}).savas===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([FOTO,
    "var A=G.emps[1], B=G.emps[2], E=G.emps[5];",
    "A.war[B.id]=true; B.war[A.id]=true;",
    "A.exh=A.exh||{}; A.exh[B.id]=99; B.exh=B.exh||{}; B.exh[A.id]=99;",
    "A.warSince=A.warSince||{}; A.warSince[B.id]=0;",
    "E.war[B.id]=true; B.war[E.id]=true;",
    "E.proxyWar=E.proxyWar||{}; E.proxyWar[B.id]=A.id;",
    "A.res.etk=9999;",
    "var teklif={from:A.id,to:B.id,give:[{t:'peace'}],want:[]};",
    "var s={};",
    "['before:peace','after:peace','after:items','son'].forEach(function(nk){",
    "  var X=foto();",
    "  G._dealFailInject=function(t){ if(t===nk) throw new Error('e'); };",
    "  var ok2=false,h='';",
    "  try{ ok2=executeDeal(JSON.parse(JSON.stringify(teklif))); }catch(ex){h=ex.message;}",
    "  delete G._dealFailInject;",
    "  s[nk]={ok:ok2, sizan:h, geriAlindi:X===foto()}; });",
    "var X2=foto(); var son=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "s.son2={ok:son, degisti:X2!==foto(), baris:!A.war[B.id], vekil:!E.war[B.id]};",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['before:peace','after:peace','after:items','son'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok('peace "'+k+'": vekil savaş zinciri TAM geri alındı',
       x.ok===false && x.geriAlindi===true && x.sizan==='', 'geri='+x.geriAlindi);
  });
  const z=d.son2||{};
  ok('peace enjeksiyonsuz: barış kuruldu VE vekil savaş çözüldü',
     z.ok===true && z.baris===true && z.vekil===true);
}

/* ═══ E. 14 TÜRÜN TAMAMI ═══ */
console.log('\nE. 14 TÜR — UYGULAMA VE POSTCONDITION');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1],C=G.emps[3];",
    "var out={};",
    "function dene(ad, items, hazir){ if(hazir) hazir(); e.res.etk=9999;",
    "  out[ad]=executeDeal({from:e.id,to:o.id,give:items,want:[]}); }",
    "e.res.min=5000; e.res.ala=2000; e.tribute=[]; o.luxGrant={};",
    "var yeniTech=Object.keys(TECHS).filter(function(t){return !o.techs[t];})[0];",
    "e.techs[yeniTech]=true;",
    "dene('res',[{t:'res',r:'min',v:100}]);",
    "dene('tribute',[{t:'tribute',r:'min',v:5}]);",
    "dene('tech',[{t:'tech',id:yeniTech}]);",
    "dene('lux',[{t:'lux',k:Object.keys(e.luxury||{})[0]}]);",
    "dene('nap',[{t:'nap'}],function(){e.nap={};o.nap={};});",
    "dene('pact',[{t:'pact'}],function(){e.pact={};o.pact={};});",
    "dene('intel',[{t:'intel'}],function(){e.visionFrom={};o.visionFrom={};});",
    "dene('spynet',[{t:'spynet'}],function(){e.spynet={};o.spynet={};});",
    "dene('passage',[{t:'passage'}],function(){e.passage={};o.passage={};});",
    "dene('ally',[{t:'ally'}],function(){e.ally={};o.ally={};});",
    "dene('peace',[{t:'peace'}],function(){e.war[o.id]=true;o.war[e.id]=true;",
    "  e.exh={}; e.exh[o.id]=99; o.exh={}; o.exh[e.id]=99;",
    "  e.warSince={}; e.warSince[o.id]=0;});",
    "dene('warOn',[{t:'warOn',target:C.id}],function(){e.war[C.id]=false;C.war[e.id]=false;});",
    "dene('peaceWith',[{t:'peaceWith',target:C.id}],function(){",
    "  e.war[C.id]=true;C.war[e.id]=true; e.exh=e.exh||{}; e.exh[C.id]=99;",
    "  C.exh={}; C.exh[e.id]=99; e.warSince=e.warSince||{}; e.warSince[C.id]=0;});",
    "var bos=G.sys.filter(function(s){return s.owner===-1;})[0];",
    "if(bos){ captureSystem(bos,e.id); dene('sys',[{t:'sys',id:bos.id}]); }",
    "else out.sys='sistem yok';",
    "return JSON.stringify(out);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['res','tribute','sys','tech','lux','peace','nap','pact','ally',
   'warOn','peaceWith','intel','spynet','passage'].forEach(k=>{
    ok('tür "'+k+'": normalize→validate→quote→execute başarılı',
       d[k]===true, String(d[k]));
  });
}

/* ═══ F. YAN ETKİ TAMPONU ═══ */
console.log('\nF. BİLDİRİM VE YAN ETKİ TAMPONU');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2], C=G.emps[3];",
    "A.res.etk=9999; A.war[C.id]=false; C.war[A.id]=false;",
    "G.log=[]; G.inbox=G.inbox||[];",
    "var teklif={from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]};",
    "/* BAŞARISIZ: hiç bildirim kalmamalı */",
    "var log0=(G.log||[]).length, inbox0=(G.inbox||[]).length;",
    "var alertSay=0; var orgAlert=UI.alert;",
    "UI.alert=function(m,c){ alertSay++; return orgAlert.call(UI,m,c); };",
    "G._dealFailInject=function(t){ if(t==='after:warOn') throw new Error('e'); };",
    "var r1=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "delete G._dealFailInject;",
    "var basarisiz={ok:r1, logFarki:(G.log||[]).length-log0,",
    "  inboxFarki:(G.inbox||[]).length-inbox0, alert:alertSay};",
    "/* BAŞARILI: bildirimler TAM BİR KEZ */",
    "alertSay=0; var log1=(G.log||[]).length;",
    "var r2=executeDeal(JSON.parse(JSON.stringify(teklif)));",
    "UI.alert=orgAlert;",
    "var logYeni=(G.log||[]).slice(log1);",
    "var tekrar=false; var gorulen={};",
    "logYeni.forEach(function(x){ if(gorulen[x.m]) tekrar=true; gorulen[x.m]=1; });",
    "return JSON.stringify({basarisiz:basarisiz,",
    "  basarili:{ok:r2, logFarki:logYeni.length, alert:alertSay, tekrar:tekrar,",
    "    ornek:(logYeni[0]||{}).m}});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const F=d.basarisiz||{}, S=d.basarili||{};
  ok('BAŞARISIZ işlem HİÇ bildirim bırakmadı',
     F.ok===false && F.logFarki===0 && F.inboxFarki===0,
     'log+'+F.logFarki+' inbox+'+F.inboxFarki);
  ok('BAŞARISIZ işlem UI.alert ÇAĞIRMADI', F.alert===0, String(F.alert));
  ok('BAŞARILI işlem bildirimleri yayımladı', S.ok===true && S.logFarki>0,
     'log+'+S.logFarki);
  ok('bildirimler TAM BİR KEZ (tekrar yok)', S.tekrar===false, S.ornek);
  ok('başarılı işlemde UI.alert bildirim sayısı kadar çağrıldı',
     S.alert===S.logFarki, S.alert+' / '+S.logFarki);
}

/* ═══ G. RNG VE YETKİ ALANLARI ═══ */
console.log('\nG. RNG VE GEÇİCİ YETKİ ALANLARI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var A=G.emps[1], B=G.emps[2], C=G.emps[3];",
    "A.res.etk=9999;",
    "/* rollback RNG'yi birebir geri almalı */",
    "A.war[C.id]=false; C.war[A.id]=false;",
    "var rng0=RND_STATE;",
    "G._dealFailInject=function(t){ if(t==='after:warOn') throw new Error('e'); };",
    "executeDeal({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "delete G._dealFailInject;",
    "var rngGeri=RND_STATE===rng0;",
    "/* yetki alanı VARLIĞI geri gelmeli */",
    "delete G._dealAuth; delete G._warAuth;",
    "var v0=('_dealAuth' in G)+'/'+('_warAuth' in G);",
    "G._dealFailInject=function(t){ if(t==='after:items') throw new Error('e'); };",
    "executeDeal({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "delete G._dealFailInject;",
    "var v1=('_dealAuth' in G)+'/'+('_warAuth' in G);",
    "/* önceden VAR olan değer korunmalı */",
    "G._dealAuth='ONCEKI';",
    "var basarili=executeDeal({from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]});",
    "var v2=G._dealAuth;",
    "return JSON.stringify({rngGeri:rngGeri, yokOnce:v0, yokSonra:v1,",
    "  varDeger:v2, basarili:basarili});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('rollback RNG durumunu BİREBİR geri aldı', d.rngGeri===true);
  ok('yetki alanı YOKSA rollback sonrası yine YOK',
     d.yokOnce===d.yokSonra && d.yokOnce==='false/false',
     d.yokOnce+' → '+d.yokSonra);
  ok('yetki alanı VARSA önceki DEĞERİ korunur (koşulsuz false değil)',
     d.varDeger==='ONCEKI', String(d.varDeger));
  ok('başarılı işlem yine de yürüdü', d.basarili===true);
}

/* ═══ H. SAFLIK VE ESKİ REGRESYONLAR ═══ */
console.log('\nH. SAFLIK VE ESKİ REGRESYONLAR');
{
  const H=harness(); H.R(KUR);
  const r=H.R([FOTO,
    "var e=G.p,o=G.emps[1];",
    "e.res.min=5000; e.res.etk=9999;",
    "var of={from:e.id,to:o.id,give:[{t:'res',r:'min',v:100},{t:'pact'}],",
    "  want:[{t:'res',r:'ene',v:20}]};",
    "var A=foto(), ofStr=JSON.stringify(of);",
    "for(var i=0;i<200;i++){ normalizeDeal(of); dealValidity(of); dealQuote(of);",
    "  dealCost(of); canDeliver(e,of.give,o,of); }",
    "return JSON.stringify({safMi:A===foto(), teklifBozulmadi:JSON.stringify(of)===ofStr});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('1000 saf çağrı hiçbir kalıcı kökü değiştirmedi', d.safMi===true);
  ok('teklif nesnesi mutasyona uğramadı', d.teklifBozulmadi===true);
}
{
  const H=harness(); H.R(KUR);
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
    "var rel1=e.rel[o.id];",
    "var n2=executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "return JSON.stringify({cogaltma:cog, toplamKorundu:top0===e.res.min+o.res.min,",
    "  bos:bos, bosRel:e.rel[o.id], nap:[n1,n2], relSabit:e.rel[o.id]===rel1});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('86B: kaynak çoğaltma KAPALI',
     d.cogaltma===false && d.toplamKorundu===true);
  ok('86B: boş anlaşma KAPALI', d.bos===false && d.bosRel===0);
  ok('86B: yürürlükteki antlaşma farm\'ı KAPALI',
     JSON.stringify(d.nap)==='[true,false]' && d.relSabit===true);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
