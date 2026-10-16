#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86A: İSTİHBARAT KOMUTA MERKEZİ
   Görünümler · saf ön kontrol · onay/tek çalıştırma · geri bildirim
   Çalıştırma: node tests/faz86a_intel_command_center_test.js
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
 "G.p.intel={}; G.emps.forEach(function(o){ if(o.id && !o.wild && !o.dead)",
 "  G.p.intel[o.id]=3; });",
 "G.p.res.etk=5000; G.p.res.ala=5000;",
 "UI.intelView=null; UI.intelGroup=''; UI.spyTarget=null;",
 "return 'ok';"].join('\n');

/* ═══ A. YAPI, DOSYA SINIRI, KARANTİNA ═══ */
console.log('\nA. YAPI, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const ui=oku('ui.js'), dip=oku('diplomacy.js'), ai=oku('ai.js');
  ok("sw cache = 'stars-v95b'", /const CACHE = 'stars-v95b'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK/fetch/activate korundu',
     /KABUK/.test(sw) && /addEventListener\('fetch'/.test(sw) &&
     /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(oku('main.js')));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, oku('main.js').includes(k)));
  /* E: ölü case kaldırıldı */
  ok("_spyOpenEski case'i KALDIRILDI",
     (ui.match(/case '_spyOpenEski'/g)||[]).length===0);
  ok('_spyOpenEski proje çapında sıfır referans',
     (ui+dip+ai+oku('index.html')).indexOf('_spyOpenEski')<0 ||
     /KALDIRILDI/.test(ui.slice(ui.indexOf('_spyOpenEski')-200,
                                ui.indexOf('_spyOpenEski')+80)));
  /* E: tek OPS render yolu */
  ok('OPS kataloğunun TEK UI render yolu var',
     (ui.match(/for \(const k in OPS\)/g)||[]).length===1,
     String((ui.match(/for \(const k in OPS\)/g)||[]).length));
  ok('opsMenu kanonik yola yönlendiriyor (ikinci katalog yok)',
     /opsMenu\(id\)\{[\s\S]{0,300}this\.intelView = 'operations'/.test(ui));
  /* E: intelOf saf okuma */
  ok('intelOf artık e.intel YAZMIYOR (saf okuma)',
     !/function intelOf\(e, id\)\{\s*\n\s*if \(!e\.intel\) e\.intel = \{\};/.test(dip));
  ok('ensureIntel yardımcısı eklendi', /function ensureIntel\(e\)/.test(dip));
  /* C/D: kanonik fonksiyonlar */
  ['opQuote','opViable','opCostOf','opRiskOf','opVictimHint'].forEach(f=>
    ok('kanonik fonksiyon var: '+f, new RegExp('function '+f+'\\(').test(dip)));
  ['opConfirm','opExecute','opsCatalog','intelNetworks','intelOperations',
   'intelFiles','intelNav'].forEach(f=>
    ok('UI metodu var: '+f, new RegExp('  '+f+'\\(').test(ui)));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF', /\/\/\s*if \(typeof situationsTick/.test(dip));
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
}

/* ═══ B. ÜÇ GÖRÜNÜM ═══ */
console.log('\nB. ÜÇ GÖRÜNÜM VE GEZİNTİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "UI.spyTarget=null; UI.intelView=null;",
    "var ag=String(UI.p_intel()||'');",
    "UI.spyTarget=1; UI.intelView='operations';",
    "var op=String(UI.p_intel()||'');",
    "UI.intelView='files'; var dos=String(UI.p_intel()||'');",
    "function c(h,re){return (h.match(re)||[]).length;}",
    "/* hedefsiz OPERASYONLAR: boş ekran değil, yönlendirme */",
    "UI.spyTarget=null; UI.intelView='operations';",
    "var opBos=String(UI.p_intel()||'');",
    "return JSON.stringify({agUz:ag.length, opUz:op.length, dosUz:dos.length,",
    "  nav:c(ag,/data-a=\"intelView\"/g),",
    "  agOps:c(ag,/data-a=\"opAsk\"/g), opOps:c(op,/data-a=\"opAsk\"/g),",
    "  agDosya:c(ag,/SANA YAPILANLAR/g), dosDosya:c(dos,/SANA YAPILANLAR/g),",
    "  opOzel:c(op,/ÖZEL OPERASYONLAR/g), agOzel:c(ag,/ÖZEL OPERASYONLAR/g),",
    "  bosYonlendirme:c(opBos,/data-a=\"intelView\" data-x=\"networks\"/g),",
    "  bosAciklama:opBos.indexOf('HEDEF SEÇİLMEDİ')>=0,",
    "  tabFn:(typeof UI.tab)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('üç görünüm gezinti düğmesi var', d.nav===3, String(d.nav));
  ok('AĞLAR görünümü operasyon düğmesi RENDER ETMİYOR', d.agOps===0);
  ok('OPERASYONLAR görünümü operasyon düğmesi üretiyor', d.opOps>0,
     String(d.opOps)+' düğme');
  ok('DOSYALAR yalnız DOSYALAR görünümünde', d.agDosya===0 && d.dosDosya===1);
  ok('özel operasyon grupları yalnız OPERASYONLAR görünümünde',
     d.opOzel===1 && d.agOzel===0);
  ok('pasif görünüm HTML\'i hiç üretilmiyor (CSS ile gizlenmiyor)',
     d.agOps===0 && d.agDosya===0 && d.agOzel===0);
  ok('hedefsiz OPERASYONLAR boş ekran yerine AĞLAR\'a yönlendiriyor',
     d.bosYonlendirme===1 && d.bosAciklama===true);
  ok('UI.tab hâlâ function', d.tabFn==='function');
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "UI.act('spyOpen','2');",
    "var a={cur:UI.cur, hedef:UI.spyTarget, gorunum:UI.intelView,",
    "  tabFn:(typeof UI.tab)};",
    "/* normal giriş: son güvenli görünüm korunur */",
    "UI.act('intelView','files'); UI.tab('intel');",
    "var b={gorunum:UI.intelView, tabFn:(typeof UI.tab)};",
    "/* aynı adlı iki devlet sayısal ID ile ayrışır */",
    "G.emps[3].name = G.emps[2].name;",
    "UI.act('spySel','3');",
    "/* Seçim OPERASYONLAR görünümünü açar; hedef ID\'si opAsk",
    "   data-x\'inde \"3:\" öneki olarak görünür. AĞLAR görünümünde ise",
    "   satır düğmesi data-x=\"3\" taşır. İkisi de sınanır. */",
    "var opH=String(UI.p_intel()||'');",
    "UI.intelView='networks'; var agH=String(UI.p_intel()||'');",
    "UI.intelView='operations';",
    "var c={hedef:UI.spyTarget, gorunum:UI.intelView,",
    "  html:/data-x=\"3:[a-zA-Z]+\"/.test(opH) && agH.indexOf('data-x=\"3\"')>=0};",
    "/* grup akordiyonu: aynı anda tek grup */",
    "UI.act('intelGroup','siyasi'); var g1=UI.intelGroup;",
    "UI.act('intelGroup','dogrudan'); var g2=UI.intelGroup;",
    "UI.act('intelGroup','dogrudan'); var g3=UI.intelGroup;",
    "var op=String(UI.p_intel()||'');",
    "return JSON.stringify({a:a,b:b,c:c,g1:g1,g2:g2,g3:g3,",
    "  acikGrup:(op.match(/class=\"ivBody\"/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const a=d.a||{}, b=d.b||{}, c=d.c||{};
  ok('spyOpen → UI.cur === intel', a.cur==='intel', a.cur);
  ok('spyOpen → doğru hedef', a.hedef===2, String(a.hedef));
  ok('spyOpen → OPERASYONLAR görünümü', a.gorunum==='operations', a.gorunum);
  ok('spyOpen sonrası UI.tab hâlâ function', a.tabFn==='function');
  ok('normal girişte son güvenli görünüm korunuyor',
     b.gorunum==='files' && b.tabFn==='function', b.gorunum);
  ok('aynı adlı iki devlet sayısal ID ile karışmıyor',
     c.hedef===3 && c.html===true);
  ok('grup akordiyonu tekli çalışıyor (ikinci dokunuş kapatır)',
     d.g1==='siyasi' && d.g2==='dogrudan' && d.g3==='');
  ok('aynı anda en fazla bir grup açık', d.acikGrup<=1, String(d.acikGrup));
}

/* ═══ C. SAF ÖN KONTROL ═══ */
console.log('\nC. SAF ÖN KONTROL (opQuote)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "var q=opQuote(e,o,'calTech');",
    "var alanlar=Object.keys(q).sort().join(',');",
    "/* SAFLIK: 200 çağrı hiçbir şeyi değiştirmemeli */",
    "var resOnce=JSON.stringify(e.res), rngOnce=RND_STATE;",
    "var intelOnce=JSON.stringify(e.intel), relOnce=JSON.stringify(e.rel);",
    "var hitOnce=JSON.stringify(o.hitLog||[]), opOnce=JSON.stringify(e.opLog||[]);",
    "for(var i=0;i<200;i++) for(var k in OPS) opQuote(e,o,k);",
    "return JSON.stringify({alanlar:alanlar,",
    "  resAyni:JSON.stringify(e.res)===resOnce, rngAyni:RND_STATE===rngOnce,",
    "  intelAyni:JSON.stringify(e.intel)===intelOnce,",
    "  relAyni:JSON.stringify(e.rel)===relOnce,",
    "  hitAyni:JSON.stringify(o.hitLog||[])===hitOnce,",
    "  opAyni:JSON.stringify(e.opLog||[])===opOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('opQuote alanları tam',
     d.alanlar==='afford,cost,desc,ico,key,lvlHave,lvlNeed,name,ok,op,risk,riskPct,viable,viableDesc,why',
     d.alanlar);
  ok('opQuote SAF: 2400 çağrı kaynak değiştirmedi', d.resAyni===true);
  ok('opQuote SAF: RNG tüketmedi', d.rngAyni===true);
  ok('opQuote SAF: intel/ilişki değişmedi',
     d.intelAyni===true && d.relAyni===true);
  ok('opQuote SAF: hitLog/opLog oluşmadı',
     d.hitAyni===true && d.opAyni===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "/* 1) yetersiz ağ */",
    "e.intel[o.id]=0; var yetersizAg=opQuote(e,o,'isyan');",
    "e.intel[o.id]=3;",
    "/* 2) yetersiz kaynak */",
    "var eskiEtk=e.res.etk; e.res.etk=1;",
    "var yetersizKay=opQuote(e,o,'isyan'); e.res.etk=eskiEtk;",
    "/* 3) uygun hedef yok */",
    "var hedefYok=opQuote(e,o,'ambargoKir');",
    "/* 4) uygulanabilir */",
    "var uygun=opQuote(e,o,'isyan');",
    "return JSON.stringify({",
    "  ag:{ok:yetersizAg.ok, why:yetersizAg.why},",
    "  kay:{ok:yetersizKay.ok, why:yetersizKay.why, afford:yetersizKay.afford},",
    "  hedef:{ok:hedefYok.ok, why:hedefYok.why, viable:hedefYok.viable},",
    "  uygun:{ok:uygun.ok, viable:uygun.viable, d:uygun.viableDesc}});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yetersiz ağ: kilitli ve gerekçesi net',
     (d.ag||{}).ok===false && /istihbarat seviyesi/.test((d.ag||{}).why||''),
     (d.ag||{}).why);
  ok('yetersiz kaynak: kilitli ve gerekçesi net',
     (d.kay||{}).ok===false && (d.kay||{}).afford===false,
     (d.kay||{}).why);
  ok('uygun hedef yok: kilitli ve gerekçesi net',
     (d.hedef||{}).ok===false && (d.hedef||{}).viable===false,
     (d.hedef||{}).why);
  ok('uygulanabilir hedef: açık ve açıklamalı',
     (d.uygun||{}).ok===true && (d.uygun||{}).viable===true,
     (d.uygun||{}).d);
}
/* Ekrandaki maliyet/risk = gerçek yürütme */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "/* etik/civic ile maliyet DEĞİŞSİN */",
    "e.mods = e.mods || {}; e.mods.opCost = 0.5;",
    "var q=opQuote(e,o,'isyan');",
    "var html=UI.opsCatalog(o.id);",
    "var ekranMaliyet=html.indexOf(String(q.cost.etk))>=0;",
    "var ekranRisk=html.indexOf('%'+q.riskPct)>=0;",
    "var oncEtk=e.res.etk;",
    "var r1=runOp(e,o,'isyan');",
    "var gercekKesinti=oncEtk-e.res.etk;",
    "/* risk eşleşmesi: aynı RND_STATE'te aynı caught sonucu */",
    "var st=RND_STATE;",
    "var q2=opQuote(e,o,'sabotaj');",
    "rndSeed(st); var beklenenCaught = rnd() < q2.risk;",
    "rndSeed(st); var r2=runOp(e,o,'sabotaj');",
    "return JSON.stringify({tabanMaliyet:OPS.isyan.cost.etk,",
    "  quoteMaliyet:q.cost.etk, gercekKesinti:gercekKesinti,",
    "  ekranMaliyet:ekranMaliyet, ekranRisk:ekranRisk,",
    "  quoteRisk:q2.risk, beklenenCaught:beklenenCaught,",
    "  gercekCaught:r2.caught});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('değiştirilmiş maliyet tabandan farklı (senaryo geçerli)',
     d.quoteMaliyet!==d.tabanMaliyet,
     'taban '+d.tabanMaliyet+' → '+d.quoteMaliyet);
  ok('ekrandaki maliyet = opQuote maliyeti', d.ekranMaliyet===true);
  ok('ekrandaki maliyet = GERÇEK kesinti',
     d.gercekKesinti===d.quoteMaliyet,
     d.quoteMaliyet+' = '+d.gercekKesinti);
  ok('ekrandaki ifşa riski = opQuote riski', d.ekranRisk===true);
  ok('önizlenen risk aynı RNG değerinde runOp sonucuyla ÖRTÜŞÜYOR',
     d.beklenenCaught===d.gercekCaught,
     'beklenen '+d.beklenenCaught+' · gerçek '+d.gercekCaught);
}

/* ═══ D. ONAY, TEK ÇALIŞTIRMA, SONUÇ ═══ */
console.log('\nD. ONAY / TEK ÇALIŞTIRMA / SONUÇ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "UI.spyTarget=o.id; UI.intelView='operations';",
    "var resOnce=JSON.stringify(e.res), rngOnce=RND_STATE;",
    "var hitOnce=(o.hitLog||[]).length, opOnce=(e.opLog||[]).length;",
    "/* ÖNİZLEME: sıfır mutasyon */",
    "UI.act('opAsk', o.id+':isyan');",
    "var md=document.getElementById('modal').innerHTML;",
    "var onizleme={res:JSON.stringify(e.res)===resOnce, rng:RND_STATE===rngOnce,",
    "  hit:(o.hitLog||[]).length===hitOnce, op:(e.opLog||[]).length===opOnce,",
    "  modalVar:md.length>0, onayBtn:md.indexOf('data-a=\"opGo\"')>=0,",
    "  iptalBtn:md.indexOf('data-a=\"closem\"')>=0,",
    "  maliyetVar:/Maliyet/.test(md), riskVar:/İfşa riski/.test(md),",
    "  etkiVar:/BEKLENEN ETKİ/.test(md), diploVar:/İFŞA OLURSA/.test(md)};",
    "/* İPTAL: hâlâ sıfır mutasyon */",
    "UI.act('closem');",
    "var iptal={res:JSON.stringify(e.res)===resOnce, rng:RND_STATE===rngOnce,",
    "  hit:(o.hitLog||[]).length===hitOnce, op:(e.opLog||[]).length===opOnce};",
    "/* ÇİFT ONAY → TEK operasyon */",
    "var cagri=0; var org=runOp;",
    "globalThis.runOp=function(a,b,c){ cagri++; return org(a,b,c); };",
    "UI.act('opAsk', o.id+':isyan');",
    "var payload=document.getElementById('modal').innerHTML.match(/data-a=\"opGo\"\\s+data-x=\"([^\"]+)\"/)[1];",
    "UI.act('opGo', payload);",
    "UI.act('opGo', payload);",
    "globalThis.runOp=org;",
    "var sonMd=document.getElementById('modal').innerHTML;",
    "return JSON.stringify({onizleme:onizleme, iptal:iptal,",
    "  runOpCagri:cagri, kesinti:JSON.parse(resOnce).etk-e.res.etk,",
    "  hitArtis:(o.hitLog||[]).length-hitOnce,",
    "  opLogArtis:(e.opLog||[]).length-opOnce,",
    "  sonucEkrani:/OPERASYON SONUCU/.test(sonMd),",
    "  gercekSonuc:/GERÇEK SONUÇ/.test(sonMd),",
    "  ifsaDurumu:/İfşa/.test(sonMd),",
    "  kapatBtn:/data-a=\"opDone\"/.test(sonMd)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const o1=d.onizleme||{}, ip=d.iptal||{};
  ok('önizleme modalı açıldı ve onay/iptal içeriyor',
     o1.modalVar===true && o1.onayBtn===true && o1.iptalBtn===true);
  ok('önizleme maliyet/risk/etki/diplomatik sonuç gösteriyor',
     o1.maliyetVar===true && o1.riskVar===true &&
     o1.etkiVar===true && o1.diploVar===true);
  ok('ÖNİZLEME sıfır mutasyon ve sıfır RNG',
     o1.res===true && o1.rng===true && o1.hit===true && o1.op===true);
  ok('İPTAL sıfır mutasyon ve sıfır RNG',
     ip.res===true && ip.rng===true && ip.hit===true && ip.op===true);
  ok('ÇİFT onay → TAM BİR runOp çağrısı', d.runOpCagri===1,
     String(d.runOpCagri)+' çağrı');
  ok('kaynak yalnız BİR kez kesildi', d.kesinti===110, String(d.kesinti));
  ok('hitLog tam BİR kayıt', d.hitArtis===1, String(d.hitArtis));
  ok('opLog tam BİR kayıt (oyuncu operasyonu artık yazılıyor)',
     d.opLogArtis===1, String(d.opLogArtis));
  ok('yapılandırılmış SONUÇ ekranı gösterildi',
     d.sonucEkrani===true && d.gercekSonuc===true && d.ifsaDurumu===true);
  ok('sonuç ekranı OPERASYONLAR görünümüne dönüş sunuyor',
     d.kapatBtn===true);
}
/* Uygun hedef yok → sıfır maliyet, sıfır RNG, sıfır log */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "Object.keys(TECHS).forEach(function(t){ e.techs[t]=true; });",
    "var sonuc={};",
    "['calTech','ambargoKir'].forEach(function(key){",
    "  var resOnce=JSON.stringify(e.res), rngOnce=RND_STATE;",
    "  var hitOnce=(o.hitLog||[]).length, opOnce=(e.opLog||[]).length;",
    "  var r=runOp(e,o,key);",
    "  sonuc[key]={ok:r.ok, why:(r.msg||''),",
    "    kaynak:JSON.stringify(e.res)===resOnce, rng:RND_STATE===rngOnce,",
    "    hit:(o.hitLog||[]).length===hitOnce,",
    "    op:(e.opLog||[]).length===opOnce}; });",
    "return JSON.stringify(sonuc);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['calTech','ambargoKir'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok(k+': uygun hedef yok → ok:false ve açıklayıcı gerekçe',
       x.ok===false && (x.why||'').length>0, x.why);
    ok(k+': SIFIR kaynak, SIFIR RNG, SIFIR log',
       x.kaynak===true && x.rng===true && x.hit===true && x.op===true);
  });
}
/* AI: tam bir kayıt, çift kayıt yok */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var a=G.emps[1], o=G.emps[2];",
    "/* 87A: gerçek AI hedef yolu gibi önce temas kurulmalı. */",
    "a.contact[o.id]=o.contact[a.id]=true;",
    "a.intel={}; a.intel[o.id]=3; a.res.etk=5000; a.res.ala=5000;",
    "a.opLog=[];",
    "var r1=runOp(a,o,'isyan');",
    "var tekCagri=a.opLog.length;",
    "/* aiOpsTick yolu: 120 ay simülasyon */",
    "G.emps.forEach(function(x){ if(x.id&&!x.wild&&!x.dead){ x.opLog=[];",
    "  x.intel=x.intel||{}; } });",
    "var hata='';",
    "try{ for(var m=0;m<120;m++){ G.memAge++; if(typeof aiOpsTick==='function') aiOpsTick(); } }",
    "catch(ex){ hata=ex.message; }",
    "var maxOp=0, maxHit=0, ciftVar=false;",
    "G.emps.forEach(function(x){",
    "  var L=x.opLog||[]; if(L.length>maxOp) maxOp=L.length;",
    "  var Hh=x.hitLog||[]; if(Hh.length>maxHit) maxHit=Hh.length;",
    "  for(var i=1;i<L.length;i++)",
    "    if(L[i].t===L[i-1].t && L[i].k===L[i-1].k && L[i].o===L[i-1].o)",
    "      ciftVar=true; });",
    "return JSON.stringify({tekCagri:tekCagri, hata:hata,",
    "  maxOp:maxOp, maxHit:maxHit, ciftVar:ciftVar,",
    "  opSinir:maxOp<=20, hitSinir:maxHit<=30});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('AI standart runOp operasyonu opLog\'a TAM BİR kez yazıldı',
     d.tekCagri===1, String(d.tekCagri));
  ok('120 aylık AI simülasyonu hatasız', d.hata==='', d.hata||'ok');
  ok('AI çift kayıt oluşturmadı', d.ciftVar===false);
  ok('opLog/hitLog üst sınırları korundu',
     d.opSinir===true && d.hitSinir===true,
     'opLog max '+d.maxOp+' · hitLog max '+d.maxHit);
}

/* ═══ E. MAĞDUR GERİ BİLDİRİMİ VE SIZINTI ═══ */
console.log('\nE. MAĞDUR GERİ BİLDİRİMİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var a=G.emps[1], p=G.p;",
    "a.intel={}; a.intel[p.id]=3; a.res.etk=9000; a.res.ala=9000;",
    "p.hitLog=[];",
    "/* Sabote edilecek GERÇEK tesis: oyuncunun sisteminde kuyruk aç.",
    "   opViable bunu doğru şekilde şart koşuyor. */",
    "var psy=G.sys.filter(function(s){return s.owner===p.id;})[0];",
    "psy.queue.push({k:'kor', left:5});",
    "var st=RND_STATE;",
    "var q=opQuote(a,p,'sabotaj');",
    "a.mods=a.mods||{};",
    "var mesajlar=[]; var os=say;",
    "globalThis.say=function(m){ mesajlar.push(String(m)); };",
    "var denedi=0, r1=null;",
    "while(denedi<40){ denedi++;",
    "  if(!psy.queue.length) psy.queue.push({k:'kor', left:5});",
    "  r1=runOp(a,p,'sabotaj');",
    "  if(r1.ok && !r1.caught) break; a.res.etk=9000; a.res.ala=9000; }",
    "globalThis.say=os;",
    "var temizMesaj=mesajlar.filter(function(m){",
    "  return m.indexOf('fail bilinmiyor')>=0; });",
    "var failAdi=a.name;",
    "/* İZOLASYON: döngüde YAKALANMIŞ denemeler de kayıt bıraktı ve",
    "   onlarda fail adı HAKLI OLARAK görünür (known:true). Sızıntı",
    "   iddiası yalnız YAKALANMAYAN kayıt için anlamlıdır, bu yüzden",
    "   kutuda sadece o kayıt bırakılır. */",
    "p.hitLog = (p.hitLog||[]).filter(function(w){ return !w.known; }).slice(-1);",
    "UI.intelView='files'; UI.spyTarget=null;",
    "var dosHtml=String(UI.p_intel()||'');",
    "var sonKayit=(p.hitLog||[])[p.hitLog.length-1]||{};",
    "return JSON.stringify({",
    "  yakalandi:!!r1.caught, kayitVar:(p.hitLog||[]).length>0,",
    "  known:!!sonKayit.known,",
    "  gozlemMesaji:temizMesaj.length>0,",
    "  mesajOrnek:(temizMesaj[0]||mesajlar[mesajlar.length-1]||'').slice(0,70),",
    "  eskiBelirsizMesaj:mesajlar.some(function(m){",
    "    return m.indexOf('Bir şeyler ters gidiyor')>=0; }),",
    "  failAdiSizdi:dosHtml.indexOf(failAdi)>=0,",
    "  failBilinmiyorGoruntu:dosHtml.indexOf('FAİL BİLİNMİYOR')>=0,",
    "  failIdSizdi:new RegExp('\"by\"\\\\s*:\\\\s*'+a.id).test(dosHtml)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yakalanmayan saldırı üretildi', d.yakalandi===false && d.kayitVar===true);
  ok('mağdur GÖZLEMLENEBİLİR etkiyi görüyor (fail açıklanmadan)',
     d.gozlemMesaji===true, d.mesajOrnek);
  ok('eski belirsiz "Bir şeyler ters gidiyor" mesajı kaldırıldı',
     d.eskiBelirsizMesaj===false);
  ok('DOSYALAR görünümünde fail ADI sızmıyor', d.failAdiSizdi===false);
  ok('DOSYALAR görünümünde fail ID sızmıyor', d.failIdSizdi===false);
  ok('bilinmeyen fail açıkça "FAİL BİLİNMİYOR" gösteriliyor',
     d.failBilinmiyorGoruntu===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var a=G.emps[1], p=G.p;",
    "a.intel={}; a.intel[p.id]=3; a.res.etk=9000; a.res.ala=9000;",
    "p.hitLog=[];",
    "var psy=G.sys.filter(function(s){return s.owner===p.id;})[0];",
    "var denedi=0, r1=null;",
    "while(denedi<60){ denedi++;",
    "  if(!psy.queue.length) psy.queue.push({k:'kor', left:5});",
    "  r1=runOp(a,p,'sabotaj');",
    "  if(r1.ok && r1.caught) break; a.res.etk=9000; a.res.ala=9000; }",
    "UI.intelView='files';",
    "var dosHtml=String(UI.p_intel()||'');",
    "return JSON.stringify({yakalandi:!!r1.caught,",
    "  failGoruntu:dosHtml.indexOf(a.name.slice(0,18))>=0,",
    "  sucustu:dosHtml.indexOf('suçüstü')>=0});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yakalanan saldırıda FAİL doğru görünüyor',
     d.yakalandi===true && d.failGoruntu===true);
  ok('dosya durumu "suçüstü" olarak gösteriliyor', d.sucustu===true);
}

/* ═══ F. ambargoKir DOĞRULUĞU ═══ */
console.log('\nF. ambargoKir HEDEF DOĞRULUĞU');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, A=G.emps[1], B=G.emps[2];",
    "/* YALNIZ B ambargo uyguluyor; hedef olarak A seçiliyor */",
    "A.embargo={}; B.embargo={}; B.embargo[e.id]=true;",
    "e.smuggle={};",
    "var qA=opQuote(e,A,'ambargoKir'), qB=opQuote(e,B,'ambargoKir');",
    "var rA=runOp(e,A,'ambargoKir');",
    "var kacakA=JSON.stringify(e.smuggle);",
    "var hitA=(A.hitLog||[]).length, hitB=(B.hitLog||[]).length;",
    "var rB=runOp(e,B,'ambargoKir');",
    "return JSON.stringify({",
    "  qA:{ok:qA.ok, why:qA.why}, qB:{ok:qB.ok},",
    "  rA:{ok:rA.ok, msg:(rA.msg||'').slice(0,44)},",
    "  kacakA:kacakA, hitA:hitA, hitB:hitB,",
    "  rB:{ok:rB.ok, msg:(rB.msg||'').slice(0,44)},",
    "  kacakSon:JSON.stringify(e.smuggle),",
    "  hitBSon:(B.hitLog||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ambargo UYGULAMAYAN hedef için operasyon KİLİTLİ',
     (d.qA||{}).ok===false, (d.qA||{}).why);
  ok('ambargo uygulayan hedef için AÇIK', (d.qB||{}).ok===true);
  ok('yanlış hedefte runOp reddedildi, kaçakçılık kurulmadı',
     (d.rA||{}).ok===false && d.kacakA==='{}', d.kacakA);
  ok('yanlış hedefte MAĞDUR kaydı oluşmadı (kimlik tutarsızlığı yok)',
     d.hitA===0 && d.hitB===0);
  ok('doğru hedefte operasyon çalıştı ve AYNI devletin hattı delindi',
     (d.rB||{}).ok===true && /^\{"2":\d+\}$/.test(d.kacakSon||''),
     d.kacakSon);
  ok('delinen hat ile mağdur kaydı AYNI devlet', d.hitBSon===1,
     'B.hitLog='+d.hitBSon);
}

/* ═══ G. RENDER SAFİYETİ VE KAYIT ═══ */
console.log('\nG. RENDER SAFİYETİ VE v8 KAYIT');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p;",
    "e.spy={}; e.spy[1]=true; e.intelP={}; e.intelP[1]=7;",
    "e.hitLog=[{t:1,k:'sabotaj',by:2,caught:false,known:false}];",
    "e.opLog=[{t:2,k:'isyan',o:1,caught:false,actorSummary:'test'}];",
    "G.log=[];",
    "var A={res:JSON.stringify(e.res), intel:JSON.stringify(e.intel),",
    "  intelP:JSON.stringify(e.intelP), spy:JSON.stringify(e.spy),",
    "  hit:JSON.stringify(e.hitLog), op:JSON.stringify(e.opLog),",
    "  rel:JSON.stringify(e.rel), rng:RND_STATE};",
    "for(var i=0;i<40;i++){",
    "  UI.intelView='networks'; UI.spyTarget=1; String(UI.p_intel()||'');",
    "  UI.intelView='operations'; String(UI.p_intel()||'');",
    "  UI.intelView='files'; String(UI.p_intel()||''); }",
    "var B={res:JSON.stringify(e.res), intel:JSON.stringify(e.intel),",
    "  intelP:JSON.stringify(e.intelP), spy:JSON.stringify(e.spy),",
    "  hit:JSON.stringify(e.hitLog), op:JSON.stringify(e.opLog),",
    "  rel:JSON.stringify(e.rel), rng:RND_STATE};",
    "/* save→load: v8 içinde korunuyor mu */",
    "var k=serialize(); var v=JSON.parse(k);",
    "e.hitLog=[]; e.opLog=[];",
    "deserialize(k);",
    "UI.intelView='files'; var dos=String(UI.p_intel()||'');",
    "return JSON.stringify({",
    "  resAyni:A.res===B.res, intelAyni:A.intel===B.intel,",
    "  intelPAyni:A.intelP===B.intelP, spyAyni:A.spy===B.spy,",
    "  hitAyni:A.hit===B.hit, opAyni:A.op===B.op,",
    "  relAyni:A.rel===B.rel, rngAyni:A.rng===B.rng,",
    "  log:(G.log||[]).length, surum:v.v,",
    "  hitKorundu:(G.p.hitLog||[]).length===1,",
    "  opKorundu:(G.p.opLog||[]).length===1,",
    "  dosGoruntu:dos.indexOf('FAİL BİLİNMİYOR')>=0 &&",
    "    dos.indexOf('İsyan Kışkırt')>=0});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('120 render kaynakları değiştirmedi', d.resAyni===true);
  ok('120 render intel seviyesi/ilerlemesini değiştirmedi',
     d.intelAyni===true && d.intelPAyni===true);
  ok('120 render casus atamasını değiştirmedi', d.spyAyni===true);
  ok('120 render hitLog/opLog değiştirmedi',
     d.hitAyni===true && d.opAyni===true);
  ok('120 render ilişkileri ve RNG\'yi değiştirmedi',
     d.relAyni===true && d.rngAyni===true);
  ok('120 render bildirim üretmedi', d.log===0, String(d.log));
  ok('kayıt sürümü v:8 KALDI', d.surum===8, 'v='+d.surum);
  ok('hitLog/opLog save→load sonrası korundu',
     d.hitKorundu===true && d.opKorundu===true);
  ok('DOSYALAR görünümü yüklemeden sonra aynı sonucu gösteriyor',
     d.dosGoruntu===true);
}
/* Boş loglu ve tek hedefli render hatasız */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p; e.hitLog=[]; e.opLog=[]; e.spy={}; e.intelP={};",
    "var hata='';",
    "try{",
    "  UI.spyTarget=null; UI.intelView='networks'; String(UI.p_intel()||'');",
    "  UI.intelView='operations'; String(UI.p_intel()||'');",
    "  UI.intelView='files'; String(UI.p_intel()||'');",
    "  UI.spyTarget=1; UI.intelView='networks'; String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi'; String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; String(UI.p_intel()||'');",
    "  UI.spyTarget=999; String(UI.p_intel()||'');",
    "}catch(ex){ hata=ex.message; }",
    "return JSON.stringify({hata:hata, tabFn:(typeof UI.tab)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('hedefsiz / tek hedefli / boş loglu / geçersiz hedefli render hatasız',
     d.hata==='', d.hata||'ok');
  ok('tüm akışlardan sonra UI.tab hâlâ function', d.tabFn==='function');
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
