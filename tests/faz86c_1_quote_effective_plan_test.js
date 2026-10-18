#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86C.1: TEK DOĞRULUK KAYNAĞI + EFFECTIVE PLAN
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
 "G.emps.forEach(function(o){ if(o.id && !o.wild && !o.dead){",
 "  G.p.contact[o.id]=true; o.contact[G.p.id]=true; } });",
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
  ok("sw cache = 'stars-v95e3'", /const CACHE = 'stars-v95e3'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu', /KABUK/.test(sw) &&
     /addEventListener\('fetch'/.test(sw) && /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(oku('main.js')));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı: '+k, oku('main.js').includes(k)));
  const dip=oku('diplomacy.js'), ui=oku('ui.js');
  ok('canDeliver artık dealQuote kullanıyor',
     /function canDeliver\([\s\S]{0,400}dealQuote\(/.test(dip));
  ok('canDeliverItems ayrı teslim yardımcısı var',
     /function canDeliverItems\(/.test(dip));
  ok('normalizeDeal effectiveGive/effectiveWant üretiyor',
     /effectiveGive, effectiveWant, redundantItems/.test(dip));
  ok('executeDeal effective plan uyguluyor',
     /applyItems\(a, b, n\.effectiveGive\)/.test(dip) &&
     /applyItems\(b, a, n\.effectiveWant\)/.test(dip));
  ok('drawDeal kanonik quote kullanıyor (iki boolean uydurmuyor)',
     /const deliverable = !!\(qd && qd\.ok\)/.test(ui));
  /* BU FAZDA YAPILMAYANLAR — yanlış iddia bırakılmamalı */
  ok('after:* aşamalı enjeksiyon noktaları AÇILDI (86C.2)',
     /G\._dealFailInject\('after:' \+ it\.t\)/.test(dip) &&
     /G\._dealFailInject\('after:items'\)/.test(dip) &&
     /G\._dealFailInject\('after:cost'\)/.test(dip));
  /* 86C.6: yorumdaki atomiklik sloganı yerine çalışan işlem grafiği. */
  const H=harness(); H.R(KUR);
  const txSonuc=H.R("var old=G.p.mods;var tx=dealTxBegin();G.p.mods={broken:true};dealTxRollback(tx);return G.p.mods===old;");
  ok('mods özgün nesnesine geri bağlanıyor', txSonuc===true || String(txSonuc)==='true');
  ok('açık kök listesi tüm imparatorluk ve sistem/filoları kapsıyor',
     /const DEAL_TX_ROOTS[\s\S]{0,140}'emps'[\s\S]{0,100}'fleets'/.test(dip));
  ok('döngüleri tekilleştiren nesne grafiği günlüğü var',
     /function txCaptureGraph/.test(dip) && /function txRestoreGraph/.test(dip));

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
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(path.join(KOK,'tests','referans-sha.json'),'utf8')); }catch(e){}
  ['audio.js','manifest.json'].forEach(f=>{
    if(!ref||!ref[f]){ ok(f+' referansı var', false); return; }
    const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', h===ref[f], h.slice(0,16));
  });
}

/* ═══ B. BEŞ canDeliver YANLIŞ POZİTİFİ ═══ */
console.log('\nB. canDeliver YANLIŞ POZİTİF MATRİSİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "function sat(ad, items, hazir, of){",
    "  if(hazir) hazir();",
    "  var teklif = of || {from:e.id,to:o.id,give:items,want:[]};",
    "  var v=dealValidity(teklif), q=dealQuote(teklif);",
    "  var ai=aiRespond(o, {from:e.id,to:o.id,give:items,want:[],",
    "    born:teklif.born, expires:teklif.expires});",
    "  return {ad:ad, canDeliver:canDeliver(e,items,o,teklif),",
    "    validityOk:v.ok, quoteOk:q.ok, aiKarar:ai.v,",
    "    neden:(q.reasons||[])[0]||null}; }",
    "var out=[];",
    "out.push(sat('savaşta yalnız NAP',[{t:'nap'}],function(){",
    "  e.war[o.id]=true; o.war[e.id]=true; e.nap={}; o.nap={}; e.res.etk=9999; }));",
    "out.push(sat('fatal bilinmeyen madde',[{t:'ZEHIR'}],function(){",
    "  e.war[o.id]=false; o.war[e.id]=false; }));",
    "out.push(sat('tamamen redundant antlaşma',[{t:'nap'}],function(){",
    "  e.nap={}; o.nap={}; e.res.etk=9999;",
    "  executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]}); }));",
    "out.push(sat('Etki yetersiz (ally 90)',[{t:'ally'}],function(){",
    "  e.res.etk=5; e.ally={}; o.ally={}; }));",
    "e.res.etk=9999; G.day=2000;",
    "out.push(sat('süresi dolmuş teklif',[{t:'res',r:'min',v:10}],null,",
    "  {from:e.id,to:o.id,give:[{t:'res',r:'min',v:10}],want:[],born:1000,expires:1400}));",
    "return JSON.stringify(out);"].join('\n'));
  let d=[]; try{d=JSON.parse(r);}catch(e){}
  d.forEach(x=>{
    ok(x.ad+': canDeliver artık FALSE', x.canDeliver===false, 'neden: '+x.neden);
    ok(x.ad+': quote.ok false', x.quoteOk===false);
    ok(x.ad+': aiRespond KESİN RET', x.aiKarar==='red', x.aiKarar);
  });
}

/* ═══ C. GEÇERSİZ TEKLİFTE aiRespond ═══ */
console.log('\nC. aiRespond GEÇERSİZ TEKLİF REGRESYONLARI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var ai=G.emps[1], e=G.p;ai.intel=ai.intel||{};ai.intel[e.id]=3;",
    "e.res.min=5000; e.res.ene=5000; ai.res.ene=3000;",
    "/* fatal=[] · quote.ok=false · eski hâlde 'kabul' dönüyordu */",
    "e.res.etk=5; e.ally={}; ai.ally={};",
    "var of={from:e.id,to:ai.id,give:[{t:'ally'}],want:[{t:'res',r:'ene',v:20}]};",
    "var q=dealQuote(of);",
    "var A={res:JSON.stringify(e.res), rel:JSON.stringify(e.rel),",
    "  mem:JSON.stringify(ai.mem||{}), log:(G.log||[]).length, rng:RND_STATE};",
    "var r1=aiRespond(ai,of);",
    "var B={res:JSON.stringify(e.res), rel:JSON.stringify(e.rel),",
    "  mem:JSON.stringify(ai.mem||{}), log:(G.log||[]).length, rng:RND_STATE};",
    "/* cömert geçerli teklif */",
    "e.res.etk=9999;",
    "var comar={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:4000}],",
    "  want:[{t:'res',r:'ene',v:50}]};",
    "var r2=aiRespond(ai,comar);",
    "/* yakın geçerli teklif → karşı teklif */",
    "var yakin={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:300}],",
    "  want:[{t:'res',r:'ene',v:500}]};",
    "var r3=aiRespond(ai,yakin);",
    "var r3b=aiRespond(ai,yakin);",
    "/* karşı teklifin kendisi quote'tan geçmeli */",
    "var karsiGecerli=null;",
    "if(r3.v==='karsi'){",
    "  var kq=dealQuote({from:e.id,to:ai.id,",
    "    give:yakin.give.concat(r3.add||[]), want:yakin.want.slice()});",
    "  karsiGecerli=kq.ok; }",
    "return JSON.stringify({fatal:(q.fatal||[]).length, quoteOk:q.ok,",
    "  etkiKarar:r1.v, etkiNeden:(r1.why||'').slice(0,45),",
    "  mutasyonYok:JSON.stringify(A)===JSON.stringify(B),",
    "  comar:r2.v, yakin:r3.v, karsiGecerli:karsiGecerli,",
    "  deterministik:r3.v===r3b.v});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('örnek gerçekten fatal=[] ve quote.ok=false',
     d.fatal===0 && d.quoteOk===false);
  ok('ÖNCE "kabul" → SONRA kesin RET', d.etkiKarar==='red', d.etkiNeden);
  ok('ret gerekçesi anlamlı (Etki yetersizliği)',
     /Etki/.test(d.etkiNeden||''), d.etkiNeden);
  ok('ret sırasında kaynak/ilişki/hafıza/log/RNG DEĞİŞMEDİ',
     d.mutasyonYok===true);
  ok('cömert geçerli teklif → kabul edilebiliyor', d.comar==='kabul', d.comar);
  ok('yakın geçerli teklif → karşı teklif üretebiliyor',
     d.yakin==='karsi'||d.yakin==='kabul', d.yakin);
  ok('karşı teklif içeriği yeniden dealQuote\'tan geçiyor',
     d.karsiGecerli===null || d.karsiGecerli===true, String(d.karsiGecerli));
  ok('karar deterministik', d.deterministik===true);
}

/* ═══ D. BEŞ REDUNDANT ÜRETİM TESTİ ═══ */
console.log('\nD. EFFECTIVE PLAN — REDUNDANT MADDELER');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.etk=9999; e.res.min=9000; e.nap={}; o.nap={};",
    "e.pact={}; o.pact={}; e.spynet={}; o.spynet={};",
    "e.visionFrom={}; o.visionFrom={};",
    "var s={};",
    "/* A) mevcut NAP + yeni kaynak → NAP bitişi AYNI kalmalı */",
    "executeDeal({from:e.id,to:o.id,give:[{t:'nap'}],want:[]});",
    "var napBitis=e.nap[o.id]; var oMin=o.res.min;",
    "var qA=dealQuote({from:e.id,to:o.id,",
    "  give:[{t:'nap'},{t:'res',r:'min',v:200}],want:[]});",
    "var rA=executeDeal({from:e.id,to:o.id,",
    "  give:[{t:'nap'},{t:'res',r:'min',v:200}],want:[]});",
    "s.A={ok:rA, napAyni:e.nap[o.id]===napBitis, transfer:o.res.min-oMin,",
    "  effGive:(qA.norm.effectiveGive||[]).map(function(x){return x.t;}).join(','),",
    "  redundant:(qA.norm.redundantItems||[]).map(function(x){return x.yon+':'+x.t;}).join(','),",
    "  maliyet:qA.cost};",
    "/* B) mevcut pact + yeni spynet → maliyet YALNIZ spynet (120) */",
    "e.res.etk=9999;",
    "executeDeal({from:e.id,to:o.id,give:[{t:'pact'}],want:[]});",
    "var relOnce=e.rel[o.id], memOnce=JSON.stringify(e.mem||{});",
    "var etkOnce=e.res.etk;",
    "var qB=dealQuote({from:e.id,to:o.id,give:[{t:'pact'},{t:'spynet'}],want:[]});",
    "var rB=executeDeal({from:e.id,to:o.id,give:[{t:'pact'},{t:'spynet'}],want:[]});",
    "s.B={ok:rB, maliyet:qB.cost, kesinti:etkOnce-e.res.etk,",
    "  spynetVar:!!(e.spynet&&e.spynet[o.id]),",
    "  effGive:(qB.norm.effectiveGive||[]).map(function(x){return x.t;}).join(','),",
    "  iliskiAyni:e.rel[o.id]===relOnce};",
    "/* C) bir yönde mevcut intel + karşı yönde yeni intel */",
    "e.res.etk=9999; e.visionFrom={}; o.visionFrom={};",
    "executeDeal({from:e.id,to:o.id,give:[{t:'intel'}],want:[]});",
    "var etkC=e.res.etk;",
    "var qC=dealQuote({from:e.id,to:o.id,give:[{t:'intel'}],want:[{t:'intel'}]});",
    "var rC=executeDeal({from:e.id,to:o.id,give:[{t:'intel'}],want:[{t:'intel'}]});",
    "s.C={ok:rC, maliyet:qC.cost, kesinti:etkC-e.res.etk,",
    "  effGive:(qC.norm.effectiveGive||[]).map(function(x){return x.t;}).join(','),",
    "  effWant:(qC.norm.effectiveWant||[]).map(function(x){return x.t;}).join(','),",
    "  redundant:(qC.norm.redundantItems||[]).map(function(x){return x.yon+':'+x.t;}).join(',')};",
    "/* D) bütünü redundant paket */",
    "e.res.etk=9999;",
    "var A2={res:JSON.stringify(e.res), rel:JSON.stringify(e.rel),",
    "  nap:e.nap[o.id], pact:JSON.stringify(e.pact), log:(G.log||[]).length};",
    "var qD=dealQuote({from:e.id,to:o.id,give:[{t:'nap'},{t:'pact'}],want:[]});",
    "var rD=executeDeal({from:e.id,to:o.id,give:[{t:'nap'},{t:'pact'}],want:[]});",
    "var B2={res:JSON.stringify(e.res), rel:JSON.stringify(e.rel),",
    "  nap:e.nap[o.id], pact:JSON.stringify(e.pact), log:(G.log||[]).length};",
    "s.D={ok:rD, quoteOk:qD.ok, maliyet:qD.cost,",
    "  sifirMutasyon:JSON.stringify(A2)===JSON.stringify(B2),",
    "  neden:(qD.reasons||[])[0]};",
    "/* E) redundant maddeyi 10 kez içeren karma paket */",
    "e.res.etk=9999; var oMin2=o.res.min;",
    "var napB2=e.nap[o.id], rel2=e.rel[o.id], log2=(G.log||[]).length;",
    "var coklu=[]; for(var i=0;i<10;i++) coklu.push({t:'nap'});",
    "coklu.push({t:'res',r:'min',v:50});",
    "var qE=dealQuote({from:e.id,to:o.id,give:coklu,want:[]});",
    "var rE=executeDeal({from:e.id,to:o.id,give:coklu,want:[]});",
    "s.E={ok:rE, napAyni:e.nap[o.id]===napB2, iliskiFarki:e.rel[o.id]-rel2,",
    "  transfer:o.res.min-oMin2, logFarki:(G.log||[]).length-log2,",
    "  effGive:(qE.norm.effectiveGive||[]).map(function(x){return x.t;}).join(','),",
    "  normalizations:(qE.normalizations||[]).length};",
    "return JSON.stringify(s);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const A=d.A||{}, B=d.B||{}, C=d.C||{}, D=d.D||{}, E=d.E||{};
  ok('A) mevcut NAP + yeni kaynak: transfer oldu',
     A.ok===true && A.transfer===200, 'transfer '+A.transfer);
  ok('A) NAP bitiş günü BİREBİR aynı kaldı', A.napAyni===true);
  ok('A) effective plan yalnız res içeriyor', A.effGive==='res', A.effGive);
  ok('A) redundant yapısal olarak kaydedildi',
     A.redundant==='give:nap', A.redundant);
  ok('B) mevcut pact + yeni spynet: maliyet YALNIZ spynet (120)',
     B.maliyet===120 && B.kesinti===120, 'quote '+B.maliyet+' kesinti '+B.kesinti);
  ok('B) spynet kuruldu, pact yeniden uygulanmadı',
     B.ok===true && B.spynetVar===true && B.effGive==='spynet', B.effGive);
  ok('B) ilişki yeniden tetiklenmedi', B.iliskiAyni===true);
  ok('C) karşı yön intel: yalnız yeni yön uygulandı',
     C.ok===true && C.effGive==='' && C.effWant==='intel',
     'give['+C.effGive+'] want['+C.effWant+']');
  ok('C) tek doğru ücret (45)', C.maliyet===45 && C.kesinti===45,
     'quote '+C.maliyet+' kesinti '+C.kesinti);
  ok('D) bütünü redundant paket REDDEDİLDİ',
     D.ok===false && D.quoteOk===false, D.neden);
  ok('D) sıfır maliyet, sıfır mutasyon',
     D.maliyet===0 && D.sifirMutasyon===true, 'maliyet '+D.maliyet);
  ok('E) 10× redundant + 1 yeni: NAP süresi uzamadı', E.napAyni===true);
  ok('E) ilişki/bildirim çiftliği yok',
     E.iliskiFarki===0 && E.logFarki===0,
     'ilişki+'+E.iliskiFarki+' log+'+E.logFarki);
  ok('E) yalnız yeni madde uygulandı', E.effGive==='res' && E.transfer===50,
     E.effGive+' transfer '+E.transfer);
  ok('E) yinelenenler normalleştirme olarak raporlandı',
     E.normalizations>=1, String(E.normalizations));
}

/* ═══ E. UI DOĞRULUK METİNLERİ ═══ */
console.log('\nE. UI DOĞRULUK METİNLERİ');
{
  const ui=oku('ui.js'), dip=oku('diplomacy.js');
  ok('"Karşı teklifi kabul et" etiketi', /Karşı teklifi kabul et/.test(ui));
  ok('"Karşı teklifi reddet" etiketi', /Karşı teklifi reddet/.test(ui));
  ok('eski "Orijinali kabul/reddet" KALMADI',
     !/Orijinali kabul et|Orijinali reddet/.test(ui));
  ok('eski "maliyeti toplanır" metni KALDIRILDI',
     !/antlaşma türlerinin\s*\n?\s*maliyeti toplanır/.test(ui));
  ok('gerçek maliyet politikası UI\'da yazılı',
     /en pahalı benzersiz[\s\S]{0,120}%25/.test(ui) && /160 ◈/.test(ui));
  ok('normalizations / redundant / fatal AYRI gösteriliyor',
     /✎ Düzenlendi/.test(ui) && /↺ Zaten yürürlükte/.test(ui) &&
     /⛔ \$\{/.test(ui));
  ok('intel "Sensör Verisi Paylaşımı" olarak adlandırıldı',
     /Sensör Verisi Paylaşımı/.test(dip));
  ok('intel açıklaması ortak casus ağı OLMADIĞINI söylüyor',
     /ortak casus ağı değildir/.test(dip));
}
/* drawDeal gerçekten quote alanlarını kullanıyor mu (davranış) */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.etk=5; e.ally={}; o.ally={};",
    "UI.deal={from:0,to:o.id,give:[{t:'ally'}],want:[]};",
    "UI.drawDeal();",
    "var h=String($('diploPane').innerHTML||'');",
    "return JSON.stringify({uz:h.length,",
    "  uygulanabilirlikUyarisi:/UYGULANABİLİRLİK/.test(h),",
    "  etkiUyarisi:/Etkisi yetersiz|yetersiz Etki/i.test(h),",
    "  maliyetPolitikasi:/en pahalı benzersiz/.test(h)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('drawDeal yetersiz Etki\'yi uygulanabilirlik sorunu olarak gösteriyor',
     d.uygulanabilirlikUyarisi===true && d.etkiUyarisi===true);
  ok('drawDeal doğru maliyet politikasını yazıyor', d.maliyetPolitikasi===true);
}

/* ═══ F. GERÇEK ORTAK DÜŞMAN ═══ */
console.log('\nF. GERÇEK ORTAK DÜŞMAN FAKTÖRÜ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var ai=G.emps[1], e=G.p, ucuncu=G.emps[3];",
    "e.contact[ucuncu.id]=true; ucuncu.contact[e.id]=true;",
    "ai.contact[ucuncu.id]=true; ucuncu.contact[ai.id]=true;",
    "e.nap={}; ai.nap={}; e.res.etk=9999;",
    "var guv={from:e.id,to:ai.id,give:[{t:'nap'}],want:[]};",
    "var maddi={from:e.id,to:ai.id,give:[{t:'res',r:'min',v:100}],want:[]};",
    "/* ortak düşman YOK */",
    "e.war[ucuncu.id]=false; ucuncu.war[e.id]=false;",
    "ai.war[ucuncu.id]=false; ucuncu.war[ai.id]=false;",
    "var g0=evalOffer(ai,guv).factors.foe, m0=evalOffer(ai,maddi).factors.foe;",
    "/* GERÇEK ortak düşman: her iki taraf da üçüncü devletle savaşta */",
    "e.war[ucuncu.id]=true; ucuncu.war[e.id]=true;",
    "ai.war[ucuncu.id]=true; ucuncu.war[ai.id]=true;",
    "var g1=evalOffer(ai,guv).factors.foe, m1=evalOffer(ai,maddi).factors.foe;",
    "var sf=(typeof sharedFoe==='function')?sharedFoe(ai,e):null;",
    "/* ortak savaş KALDIRILINCA yeniden 1.00 */",
    "ai.war[ucuncu.id]=false; ucuncu.war[ai.id]=false;",
    "var g2=evalOffer(ai,guv).factors.foe;",
    "return JSON.stringify({sharedFoe:sf, guvOnce:g0, maddiOnce:m0,",
    "  guvOrtak:g1, maddiOrtak:m1, guvKaldirilinca:g2});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ortak düşman yokken güvenlik faktörü TAM 1.00',
     d.guvOnce===1, String(d.guvOnce));
  ok('sharedFoe gerçekten kuruldu', d.sharedFoe===true, String(d.sharedFoe));
  ok('ortak düşmanla GÜVENLİK maddesinde faktör TAM 1.15',
     d.guvOrtak===1.15, String(d.guvOrtak));
  ok('aynı durumda MADDİ teklifte faktör TAM 1.00',
     d.maddiOrtak===1, String(d.maddiOrtak));
  ok('ortak savaş kaldırılınca güvenlik faktörü 1.00\'a döndü',
     d.guvKaldirilinca===1, String(d.guvKaldirilinca));
}

/* ═══ G. SAFLIK VE ESKİ İDDİALARIN KORUNMASI ═══ */
console.log('\nG. SAFLIK VE REGRESYON');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=5000; e.res.etk=9999;",
    "var of={from:e.id,to:o.id,give:[{t:'res',r:'min',v:100},{t:'pact'}],",
    "  want:[{t:'res',r:'ene',v:20}]};",
    "var A={res:JSON.stringify(e.res), rng:RND_STATE, rel:JSON.stringify(e.rel),",
    "  log:(G.log||[]).length, of:JSON.stringify(of)};",
    "for(var i=0;i<200;i++){ normalizeDeal(of); dealValidity(of); dealQuote(of);",
    "  dealCost(of); canDeliver(e,of.give,o,of); aiRespond(o,of); }",
    "return JSON.stringify({resAyni:JSON.stringify(e.res)===A.res,",
    "  rngAyni:RND_STATE===A.rng, relAyni:JSON.stringify(e.rel)===A.rel,",
    "  logAyni:(G.log||[]).length===A.log,",
    "  teklifBozulmadi:JSON.stringify(of)===A.of});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('1200 çağrı (normalize/validity/quote/cost/canDeliver/aiRespond) SAF',
     d.resAyni && d.rngAyni && d.relAyni && d.logAyni);
  ok('teklif nesnesi mutasyona uğramadı', d.teklifBozulmadi===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; o.res.min=500;",
    "var top0=e.res.min+o.res.min;",
    "var cog=executeDeal({from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:800},{t:'res',r:'min',v:800}],want:[]});",
    "e.rel[o.id]=0; o.rel[e.id]=0;",
    "var bos=executeDeal({from:e.id,to:o.id,give:[],want:[]});",
    "return JSON.stringify({cogaltma:cog, toplamKorundu:top0===e.res.min+o.res.min,",
    "  bos:bos, bosRel:e.rel[o.id]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('86B: kaynak çoğaltma hâlâ KAPALI',
     d.cogaltma===false && d.toplamKorundu===true);
  ok('86B: boş anlaşma hâlâ KAPALI', d.bos===false && d.bosRel===0);
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
