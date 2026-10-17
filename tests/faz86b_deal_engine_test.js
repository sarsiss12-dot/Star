#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 86B: KANONİK VE ATOMİK ANLAŞMA MOTORU
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
 "G.p.res.etk=5000;",
 "/* GERÇEK madde kaynağı: oyuncuya teknoloji ve ikinci sistem ver */",
 "var _t=Object.keys(TECHS).slice(0,3); _t.forEach(function(t){ G.p.techs[t]=true; });",
 "var _bos=G.sys.filter(function(s){ return s.owner === -1; })[0];",
 "if(_bos) captureSystem(_bos, G.p.id);",
 "return 'ok';"].join('\n');

/* ═══ A. YAPI, DOSYA SINIRI, KARANTİNA ═══ */
console.log('\nA. YAPI VE DOSYA SINIRI');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const dip=oku('diplomacy.js'), ui=oku('ui.js'), mn=oku('main.js');
  ok("sw cache = 'stars-v95e1'", /const CACHE = 'stars-v95e1'/.test(oku('sw.js')));
  ok('kayıt sürümü v:8 KALDI', /v:8, cfg:G\.cfg/.test(mn));
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mn.includes(k)));
  ['normalizeDeal','dealValidity','dealQuote','executeDeal','dealCost',
   'dealExpired','dealTimeLeft','treatyAlreadyActive'].forEach(f=>
    ok('kanonik fonksiyon var: '+f, new RegExp('function '+f+'\\(').test(dip)));
  ok('canDeliver ince sarmalayıcı (ayrı formül kopyası değil)',
     /function canDeliver[\s\S]{0,400}dealValidity\(offer\)/.test(dip));
  /* GÖREV A */
  ok('TEKNOLOJİ HIRSIZLIĞI kendi metoduna taşındı',
     /  intelTechTheft\(\)\{/.test(ui));
  ok('tech theft OPERASYONLAR görünümünde render ediliyor',
     /intelOperations\(\)\{[\s\S]{0,1400}this\.intelTechTheft\(\)/.test(ui));
  ok('stealTech için İKİNCİ render yolu yok',
     (ui.match(/data-a="stealTech"/g)||[]).length===1,
     String((ui.match(/data-a="stealTech"/g)||[]).length));
  ok('sabotageChance etiketi düzeltildi (genel "operasyon başarı" değil)',
     /Özel sabotaj başarı olasılığı/.test(ui) &&
     !/<br>operasyon başarı <b/.test(ui));
  ok('OPS anlatımı korundu (etki kesin, zar yalnız ifşa)',
     /zar yalnız ifşa için atılır/.test(ui));
  /* GÖREV G: eski bypass yolları */
  ok('diploAct artık RNG ile antlaşma imzalamıyor',
     !/rnd\(\) < chance\)\{[\s\S]{0,200}makePact/.test(ui) &&
     !/e\.res\.etk -= 30;/.test(ui) && !/e\.res\.etk -= 40;/.test(ui));
  ok('pactOpen kanonik executeDeal kullanıyor',
     /_hook\('pactYes'[\s\S]{0,900}executeDeal\(teklif\)/.test(ui));
  ok('peaceOpen çift pyes hook hatası düzeltildi',
     (ui.match(/_hook\('pyes'/g)||[]).length===1);
  ok('spynet müzakere masasında erişilebilir',
     /\['spynet','🕸 Casusluk ağı'\]/.test(ui));
  ok('nap müzakere masasında erişilebilir', /\['nap','🛡 Saldırmazlık'\]/.test(ui));
  ok('fesih onay ekranı var', /  unpactConfirm\(id\)\{/.test(ui));
  ok('karşı teklif ayrı kartta (orijinal liste push edilmiyor)',
     !/r\.add\.forEach\(it => d\.give\.push\(it\)\)/.test(ui) &&
     /this\.dealCounter = \{from:o\.id/.test(ui));
}
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
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
  const izinsiz=['audio.js','manifest.json'];
  if(!ref) ok('referans-sha.json okunabildi', false, 'dosya yok');
  else izinsiz.forEach(f=>{
    const h=crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(KOK,f))).digest('hex');
    ok(f+' byte-for-byte aynı', ref[f]===h, (h||'').slice(0,16));
  });
}

/* ═══ B. KANITLANAN ÜÇ İSTİSMARIN SONRASI ═══ */
console.log('\nB. ÖN DENETİMDEKİ İSTİSMARLARIN SONRASI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; o.res.min=500;",
    "var top0=e.res.min+o.res.min;",
    "var teklif={from:e.id,to:o.id,",
    "  give:[{t:'res',r:'min',v:800},{t:'res',r:'min',v:800}],want:[]};",
    "var n=normalizeDeal(teklif);",
    "var v=dealValidity(teklif);",
    "var rngOnce=RND_STATE;",
    "var ok1=executeDeal(teklif);",
    "return JSON.stringify({satirSayisi:n.give.length, birlesikMiktar:n.give[0].v,",
    "  gecerli:v.ok, neden:v.reasons[0], uygulandi:ok1,",
    "  eSonra:e.res.min, oSonra:o.res.min,",
    "  toplamDegisimi:(e.res.min+o.res.min)-top0,",
    "  rngAyni:RND_STATE===rngOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('iki 800 satırı TEK 1600 maddesine birleştirildi',
     d.satirSayisi===1 && d.birlesikMiktar===1600,
     d.satirSayisi+' satır · '+d.birlesikMiktar);
  ok('1000 stok karşısında toplam 1600 REDDEDİLDİ',
     d.gecerli===false && d.uygulandi===false, d.neden);
  ok('hiçbir tarafın kaynağı değişmedi (toplam değişimi 0)',
     d.toplamDegisimi===0 && d.eSonra===1000 && d.oSonra===500,
     'değişim '+d.toplamDegisimi);
  ok('reddedilen teklif RNG tüketmedi', d.rngAyni===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[2];",
    "e.rel[o.id]=0; o.rel[e.id]=0;",
    "var etkOnce=e.res.etk, rngOnce=RND_STATE, logOnce=(G.log||[]).length;",
    "var sonuc=[];",
    "for(var i=0;i<10;i++) sonuc.push(executeDeal({from:e.id,to:o.id,give:[],want:[]}));",
    "return JSON.stringify({hepsiRed:sonuc.every(function(x){return x===false;}),",
    "  iliski:e.rel[o.id], etkDegisimi:etkOnce-e.res.etk,",
    "  rngAyni:RND_STATE===rngOnce, logDegisimi:(G.log||[]).length-logOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('boş anlaşma 10 kez REDDEDİLDİ', d.hepsiRed===true);
  ok('boş anlaşma ilişki üretmedi (0)', d.iliski===0, String(d.iliski));
  ok('boş anlaşma Etki harcamadı', d.etkDegisimi===0);
  ok('boş anlaşma RNG tüketmedi ve log üretmedi',
     d.rngAyni===true && d.logDegisimi===0);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sonuc={};",
    "['nap','pact','ally','intel','spynet','passage'].forEach(function(k,i){",
    "  var o=G.emps[i+1]; if(!o) return;",
    "  e.rel[o.id]=0; o.rel[e.id]=0; e.res.etk=5000;",
    "  var etk0=e.res.etk;",
    "  var t={from:e.id,to:o.id,give:[{t:k}],want:[]};",
    "  var r1=executeDeal(t), rel1=e.rel[o.id], etk1=etk0-e.res.etk;",
    "  var r2=executeDeal(t), rel2=e.rel[o.id];",
    "  var r3=executeDeal(t), rel3=e.rel[o.id];",
    "  sonuc[k]={ilk:r1, ikinci:r2, ucuncu:r3,",
    "    rel1:rel1, relSon:rel3, maliyet:etk1,",
    "    ekMaliyet:(etk0-e.res.etk)-etk1}; });",
    "return JSON.stringify(sonuc);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['nap','pact','ally','intel','spynet','passage'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok(k+': yalnız İLK imza geçerli, sonraki ikisi reddedildi',
       x.ilk===true && x.ikinci===false && x.ucuncu===false,
       'ilk='+x.ilk+' ikinci='+x.ikinci);
    ok(k+': ilişki çiftlenmedi ve ek maliyet kesilmedi',
       x.rel1===x.relSon && x.ekMaliyet===0,
       'ilişki '+x.rel1+'→'+x.relSon+' · ek maliyet '+x.ekMaliyet);
  });
}

/* ═══ C. TEKİLLEŞTİRME VE GEÇERSİZ REFERANS ═══ */
console.log('\nC. TEKİLLEŞTİRME VE GEÇERSİZ REFERANS');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "var sy=G.sys.filter(function(s){return s.owner===e.id && s.id!==e.home;})[0];",
    "var tek=Object.keys(e.techs)[0];",
    "var lx=Object.keys(e.luxOwn||{})[0];",
    "var n1=normalizeDeal({from:0,to:1,give:[{t:'sys',id:sy?sy.id:0},",
    "  {t:'sys',id:sy?sy.id:0}],want:[]});",
    "var n2=normalizeDeal({from:0,to:1,give:[{t:'tech',id:tek},{t:'tech',id:tek}],want:[]});",
    "var n3=normalizeDeal({from:0,to:1,give:[{t:'nap'}],want:[{t:'nap'}]});",
    "var n4=normalizeDeal({from:0,to:1,give:[{t:'ZEHIR'},{t:'res',r:'min',v:-5},",
    "  {t:'res',r:'min',v:0},{t:'sys'},{t:'res',r:'min',v:10}],want:[]});",
    "/* geçersiz referans: kısmi uygulama olmamalı */",
    "e.res.min=1000; o.res.min=1000;",
    "var top0=e.res.min+o.res.min;",
    "var kismi=executeDeal({from:0,to:1,",
    "  give:[{t:'res',r:'min',v:100},{t:'sys',id:9999}],want:[]});",
    "return JSON.stringify({",
    "  sysTek:n1.give.length, techTek:n2.give.length,",
    "  napSimetrik:{give:n3.give.length, want:n3.want.length},",
    "  bozukTemiz:JSON.stringify(n4.give), dusen:n4.dropped.length,",
    "  kismi:kismi, toplamDegisimi:(e.res.min+o.res.min)-top0,",
    "  eMin:e.res.min});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('aynı sistem çoğaltılamıyor (2 → 1)', d.sysTek===1, String(d.sysTek));
  ok('aynı teknoloji çoğaltılamıyor (2 → 1)', d.techTek===1, String(d.techTek));
  ok('simetrik nap tek kanonik maddeye indirildi',
     d.napSimetrik && d.napSimetrik.give===1 && d.napSimetrik.want===0,
     JSON.stringify(d.napSimetrik));
  ok('bozuk/negatif/sıfır madde düşürüldü, geçerli kaldı',
     d.bozukTemiz==='[{"t":"res","r":"min","v":10}]' && d.dusen===4,
     d.bozukTemiz+' · düşen '+d.dusen);
  ok('geçersiz sistem referansı KISMİ uygulama yapmadı',
     d.kismi===false && d.toplamDegisimi===0 && d.eMin===1000,
     'değişim '+d.toplamDegisimi);
}

/* ═══ D. 14 TÜR MATRİSİ ═══ */
console.log('\nD. 14 DEAL_KINDS HATTI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p, sonuc={};",
    "var kinds=Object.keys(DEAL_KINDS);",
    "kinds.forEach(function(k,i){",
    "  var o=G.emps[(i%6)+1]; if(!o) return;",
    "  /* her tür için GERÇEK üretici verisiyle uygulanabilir madde kur */",
    "  var it=null;",
    "  if(k==='res'){ e.res.min=2000; it={t:'res',r:'min',v:50}; }",
    "  else if(k==='tribute'){ e.res.min=9000; it={t:'tribute',r:'min',v:2}; }",
    "  else if(k==='sys'){ var sy=G.sys.filter(function(s){",
    "      return s.owner===e.id && s.id!==e.home;})[0];",
    "    if(!sy){ /* uygun sistem yoksa GERÇEK üretim yoluyla bir tane al */",
    "      var bos=G.sys.filter(function(s){ return s.owner === -1; })[0];",
    "      if(bos){ captureSystem(bos, e.id); sy=bos; } }",
    "    if(sy) it={t:'sys',id:sy.id}; }",
    "  else if(k==='tech'){ it={t:'tech',id:Object.keys(e.techs)[0]}; }",
    "  else if(k==='lux'){ var lx=Object.keys(e.luxOwn||{})[0];",
    "    if(lx) it={t:'lux',k:lx}; }",
    "  else if(k==='peace'){ e.war[o.id]=true; o.war[e.id]=true; it={t:'peace'}; }",
    "  else if(k==='warOn'||k==='peaceWith'){",
    "    var t3=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "      z.id!==o.id;})[0];",
    "    if(k==='peaceWith'){ e.war[t3.id]=true; t3.war[e.id]=true; }",
    "    it={t:k,target:t3.id}; }",
    "  else it={t:k};",
    "  if(!it){ sonuc[k]={atlandi:true}; return; }",
    "  e.res.etk=5000;",
    "  var teklif={from:e.id,to:o.id,give:[it],want:[]};",
    "  var n=normalizeDeal(teklif);",
    "  var v=dealValidity(teklif);",
    "  var q=dealQuote(teklif);",
    "  var ex=q.ok ? executeDeal(teklif) : false;",
    "  sonuc[k]={norm:n.give.length, valid:v.ok, quote:q.ok,",
    "    cost:q.cost, exec:ex, neden:(q.reasons[0]||'').slice(0,40)}; });",
    "return JSON.stringify(sonuc);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  Object.keys(d||{}).forEach(k=>{
    const x=d[k]||{};
    ok('tür "'+k+'": normalize→validate→quote→execute hattı çalıştı',
       x.norm===1 && x.valid===true && x.quote===true && x.exec===true,
       'valid='+x.valid+' quote='+x.quote+' exec='+x.exec+
       ' maliyet='+x.cost+(x.neden?' · '+x.neden:''));
  });
  ok('14 türün tamamı sınandı', Object.keys(d||{}).length===14,
     String(Object.keys(d||{}).length));
}

/* ═══ E. MALİYET POLİTİKASI ═══ */
console.log('\nE. KANONİK MALİYET POLİTİKASI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.etk=5000; e.war[o.id]=true; o.war[e.id]=true;",
    "var tablo={};",
    "['peace','pact','ally','intel','spynet','nap','passage'].forEach(function(k){",
    "  tablo[k]=dealCost({from:0,to:o.id,give:[{t:k}],want:[]}); });",
    "/* çok maddeli: farklı türler TOPLANIR, aynı tür tek sayılır */",
    "var cok=dealCost({from:0,to:o.id,give:[{t:'peace'},{t:'nap'}],",
    "  want:[{t:'pact'}]});",
    "var ayni=dealCost({from:0,to:o.id,give:[{t:'intel'}],want:[{t:'intel'}]});",
    "/* KABUL: maliyet tam bir kez, GÖNDERENDEN */",
    "var etk0=e.res.etk, oEtk0=o.res.etk;",
    "executeDeal({from:0,to:o.id,give:[{t:'peace'}],want:[]});",
    "var kesinti=etk0-e.res.etk, alanKesinti=oEtk0-o.res.etk;",
    "/* RET/geçersiz: sıfır maliyet */",
    "var etk1=e.res.etk;",
    "executeDeal({from:0,to:o.id,give:[],want:[]});",
    "executeDeal({from:0,to:o.id,give:[{t:'sys',id:9999}],want:[]});",
    "return JSON.stringify({tablo:tablo, cokMaddeli:cok, ayniTur:ayni,",
    "  kesinti:kesinti, alanKesinti:alanKesinti,",
    "  gecersizKesinti:etk1-e.res.etk});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const t=d.tablo||{};
  ok('maliyet tablosu korundu (peace 30 · pact 40 · ally 90)',
     t.peace===30 && t.pact===40 && t.ally===90,
     JSON.stringify(t));
  ok('intel 45 · spynet 120 korundu', t.intel===45 && t.spynet===120);
  ok('nap ve passage maliyetsiz (eski davranış)',
     t.nap===0 && t.passage===0);
  /* FAZ 86C: çoklu maliyet politikası KASTEN değişti — düz toplama
     yerine "en pahalı tam + diğerleri %25" (tavan 160). peace 30 +
     nap 0 + pact 40 → 40 + 30×0.25 = 47.5 → 48. İddia gevşetilmedi,
     yeni kanonik politikaya göre güncellendi. */
  ok('çoklu maliyet: en pahalı tam + diğerleri %25 (pact 40 + peace 30 → 48)',
     d.cokMaddeli===48, String(d.cokMaddeli));
  ok('aynı tür iki listede de olsa TEK kez ücretlendirilir (45)',
     d.ayniTur===45, String(d.ayniTur));
  ok('maliyet yalnız GÖNDERENDEN ve TAM BİR KEZ kesildi',
     d.kesinti===30 && d.alanKesinti===0,
     'gönderen '+d.kesinti+' · alan '+d.alanKesinti);
  ok('geçersiz/boş teklifte SIFIR maliyet', d.gecersizKesinti===0,
     String(d.gecersizKesinti));
}

/* ═══ F. HIZLI DÜĞMELER VE FESİH ═══ */
console.log('\nF. HIZLI DÜĞMELER VE FESİH');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.etk=500; e.war[o.id]=true; o.war[e.id]=true;",
    "var sonuc={};",
    "['peace','pact','ally'].forEach(function(k){",
    "  if(k!=='peace'){ e.war[o.id]=false; o.war[e.id]=false; }",
    "  UI.deal=null;",
    "  var etk0=e.res.etk, rng0=RND_STATE, min0=e.res.min;",
    "  UI.diploAct(k, o.id);",
    "  sonuc[k]={etkDegisimi:etk0-e.res.etk, rngAyni:RND_STATE===rng0,",
    "    kaynakAyni:e.res.min===min0,",
    "    muzakereAcildi:!!(UI.deal && UI.deal.to===o.id),",
    "    madde:UI.deal?JSON.stringify(UI.deal.give):null}; });",
    "return JSON.stringify(sonuc);"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ['peace','pact','ally'].forEach(k=>{
    const x=(d||{})[k]||{};
    ok('hızlı '+k+': kaynak 0, RNG 0, doğru maddeyle müzakere açıldı',
       x.etkDegisimi===0 && x.rngAyni===true && x.kaynakAyni===true &&
       x.muzakereAcildi===true && x.madde==='[{"t":"'+k+'"}]',
       'etki '+x.etkDegisimi+' · '+x.madde);
  });
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "makePact(e,o); e.rel[o.id]=50;",
    "UI.diploAct('unpact', o.id);",
    "var md=document.getElementById('modal').innerHTML;",
    "var pakt0=!!(e.pact&&e.pact[o.id]), rel0=e.rel[o.id];",
    "UI._hooks['unpactYes'](0);",
    "UI._hooks['unpactYes'](0);",
    "return JSON.stringify({onayVar:md.length>0,",
    "  sonucGorunur:/−10/.test(md), paktOnce:pakt0,",
    "  paktSonra:!!(e.pact&&e.pact[o.id]),",
    "  relDegisimi:rel0-e.rel[o.id]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('fesih onay ekranı açıldı ve sonucu önceden gösteriyor',
     d.onayVar===true && d.sonucGorunur===true);
  ok('fesih tek dokunuşta YALNIZ BİR kez uygulandı',
     d.paktOnce===true && d.paktSonra===false && d.relDegisimi===10,
     'ilişki −'+d.relDegisimi);
}

/* ═══ G. TEKLİF ÖMRÜ VE KARŞI TEKLİF ═══ */
console.log('\nG. TEKLİF ÖMRÜ VE KARŞI TEKLİF');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var o=G.emps[1]; o.res.min=5000; G.day=1000;",
    "var taze={from:o.id,to:0,give:[{t:'res',r:'min',v:10}],want:[],",
    "  born:900,expires:1440};",
    "var bayat={from:o.id,to:0,give:[{t:'res',r:'min',v:10}],want:[],",
    "  born:100,expires:640};",
    "var eski={from:o.id,to:0,give:[{t:'res',r:'min',v:10}],want:[],born:900};",
    "var eskisiz={from:o.id,to:0,give:[{t:'res',r:'min',v:10}],want:[]};",
    "var qT=dealQuote(taze), qB=dealQuote(bayat);",
    "var pMin0=G.p.res.min;",
    "var exB=executeDeal(bayat);",
    "/* save/load kalan süreyi değiştirmemeli */",
    "UI.aiOffer({from:o.id,to:0,give:[{t:'res',r:'min',v:10}],",
    "  want:[{t:'res',r:'ene',v:5}]});",
    "var not=G.inbox.filter(function(x){return x.kind==='aideal';})[0];",
    "var kalanOnce=dealTimeLeft(not.data);",
    "var k=serialize(); var gunOnce=G.day;",
    "deserialize(k);",
    "var not2=G.inbox.filter(function(x){return x.kind==='aideal';})[0];",
    "return JSON.stringify({tazeOk:qT.ok, tazeKalan:dealTimeLeft(taze),",
    "  bayatOk:qB.ok, bayatNeden:qB.reasons[0], bayatUygulandi:exB,",
    "  minAyni:G.p.res.min===pMin0,",
    "  bornGoc:dealExpired(eski), bornsuz:dealExpired(eskisiz),",
    "  notBorn:not.data.born!==undefined, notExp:not.data.expires!==undefined,",
    "  kalanOnce:kalanOnce, kalanSonra:not2?dealTimeLeft(not2.data):null,",
    "  gunAyni:G.day===gunOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('süresi dolmamış teklif açılabiliyor', d.tazeOk===true,
     d.tazeKalan+' ay kaldı');
  ok('süresi DOLAN teklif uygulanmıyor ve nedeni söyleniyor',
     d.bayatOk===false && d.bayatUygulandi===false &&
     /süresi doldu/.test(d.bayatNeden||''), d.bayatNeden);
  ok('süresi dolan teklif kaynak değiştirmedi', d.minAyni===true);
  ok('born var expires yok → deterministik born+540 göçü',
     d.bornGoc===false);
  ok('ikisi de yoksa süresiz sayılıyor (geriye uyum)', d.bornsuz===false);
  ok('aiOffer teklife born + expires damgası ekledi',
     d.notBorn===true && d.notExp===true);
  ok('save/load kalan süreyi DEĞİŞTİRMEDİ',
     d.kalanOnce===d.kalanSonra && d.kalanOnce!==null,
     d.kalanOnce+' → '+d.kalanSonra);
  ok('yükleme oyun zamanını ilerletmedi', d.gunAyni===true);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var o=G.emps[1]; o.res.min=5000; G.p.res.ene=5000;",
    "UI.aiOffer({from:o.id,to:0,give:[{t:'res',r:'min',v:100}],",
    "  want:[{t:'res',r:'ene',v:50}]});",
    "var not=G.inbox.filter(function(x){return x.kind==='aideal';})[0];",
    "UI.openNote(not.uid);",
    "var md=document.getElementById('modal').innerHTML;",
    "var orjOnce=JSON.stringify(not.data);",
    "/* MASAYA OTUR → karşı teklif kartı; orijinal BOZULMAZ */",
    "UI._hooks['offCounter'](0);",
    "var ctr=UI.dealCounter, dl=UI.deal;",
    "var min0=G.p.res.min, ene0=G.p.res.ene, etk0=G.p.res.etk;",
    "/* düzenlemeye dön → orijinal hâlâ kartta */",
    "UI.act('ctrBack');",
    "var ctr2=UI.dealCounter;",
    "/* reddet → kaynak değişmez */",
    "UI.act('ctrNo');",
    "return JSON.stringify({",
    "  yonVar:/→ sen/.test(md) && /sen →/.test(md),",
    "  kalanVar:/Kalan süre/.test(md), maliyetVar:/İmzalama maliyeti/.test(md),",
    "  ctrVar:!!ctr, ctrKorundu:ctr?JSON.stringify({from:ctr.from,",
    "    give:ctr.give,want:ctr.want}).indexOf('\"v\":100')>=0:false,",
    "  dealAyri:!!dl && dl.from===0,",
    "  geriDonduKart:!!ctr2,",
    "  minAyni:G.p.res.min===min0, eneAyni:G.p.res.ene===ene0,",
    "  etkAyni:G.p.res.etk===etk0,",
    "  ctrTemiz:UI.dealCounter===null});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('teklif ekranı YÖN metni gösteriyor', d.yonVar===true);
  ok('teklif ekranı kalan süre ve imzalama maliyetini gösteriyor',
     d.kalanVar===true && d.maliyetVar===true);
  ok('karşı teklif AYRI kartta; orijinal teklif korundu',
     d.ctrVar===true && d.ctrKorundu===true);
  ok('oyuncunun düzenleme listesi ayrı nesne', d.dealAyri===true);
  ok('"Düzenlemeye dön" orijinal kartı koruyor', d.geriDonduKart===true);
  ok('reddetmek kaynak ve Etki değiştirmedi',
     d.minAyni===true && d.eneAyni===true && d.etkAyni===true);
  ok('ret sonrası karşı teklif kartı temizlendi', d.ctrTemiz===true);
}

/* ═══ H. SAFLIK VE DIŞ ÇAĞRI GUARD'I ═══ */
console.log('\nH. SAFLIK VE GUARD');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var e=G.p,o=G.emps[1];",
    "e.res.min=1000; e.res.etk=5000;",
    "var teklif={from:0,to:o.id,give:[{t:'res',r:'min',v:100},{t:'nap'}],",
    "  want:[{t:'res',r:'ene',v:10}]};",
    "var A={res:JSON.stringify(e.res), oRes:JSON.stringify(o.res),",
    "  rel:JSON.stringify(e.rel), rng:RND_STATE,",
    "  nap:JSON.stringify(e.nap||{}), log:(G.log||[]).length,",
    "  teklif:JSON.stringify(teklif)};",
    "for(var i=0;i<200;i++){ normalizeDeal(teklif); dealValidity(teklif);",
    "  dealQuote(teklif); dealCost(teklif); }",
    "var B={res:JSON.stringify(e.res), oRes:JSON.stringify(o.res),",
    "  rel:JSON.stringify(e.rel), rng:RND_STATE,",
    "  nap:JSON.stringify(e.nap||{}), log:(G.log||[]).length,",
    "  teklif:JSON.stringify(teklif)};",
    "/* executeDeal DIŞARIDAN bozuk kayıtla çağrılsa da guard çalışır */",
    "var top0=e.res.min+o.res.min;",
    "var g1=executeDeal({from:0,to:o.id,give:[{t:'res',r:'min',v:99999}],want:[]});",
    "var g2=executeDeal({from:0,to:9999,give:[{t:'res',r:'min',v:1}],want:[]});",
    "var g3=executeDeal(null);",
    "var g4=executeDeal({from:0,to:o.id,give:'bozuk',want:null});",
    "return JSON.stringify({",
    "  resAyni:A.res===B.res && A.oRes===B.oRes, relAyni:A.rel===B.rel,",
    "  rngAyni:A.rng===B.rng, napAyni:A.nap===B.nap,",
    "  logAyni:A.log===B.log, teklifAyni:A.teklif===B.teklif,",
    "  g1:g1,g2:g2,g3:g3,g4:g4,",
    "  toplamDegisimi:(e.res.min+o.res.min)-top0});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('200 normalize/validate/quote çağrısı kaynakları değiştirmedi',
     d.resAyni===true);
  ok('200 çağrı ilişki/antlaşma/log değiştirmedi',
     d.relAyni===true && d.napAyni===true && d.logAyni===true);
  ok('200 çağrı RNG tüketmedi', d.rngAyni===true);
  ok('normalizeDeal GİRİŞ nesnesini değiştirmedi', d.teklifAyni===true);
  ok('executeDeal dış/bozuk çağrılarda guard\'ları uyguladı',
     d.g1===false && d.g2===false && d.g3===false && d.g4===false,
     [d.g1,d.g2,d.g3,d.g4].join(','));
  ok('bozuk çağrılar kaynak değiştirmedi', d.toplamDegisimi===0);
}

/* ═══ I. AI SMOKE ═══ */
console.log('\nI. AI SMOKE (240 AY)');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var hata='';",
    "function toplamKaynak(){ var t=0;",
    "  G.emps.forEach(function(x){ if(x.dead) return;",
    "    for(var k in x.res) t+=(x.res[k]||0); }); return t; }",
    "var nanVar=false;",
    "try{ for(var m=0;m<240;m++){ G.memAge++; monthTick(); G.over=null;",
    "  G.emps.forEach(function(x){ for(var k in x.res)",
    "    if(!isFinite(x.res[k])) nanVar=true; }); } }",
    "catch(ex){ hata=ex.message; }",
    "var maxOp=0,maxHit=0;",
    "G.emps.forEach(function(x){ maxOp=Math.max(maxOp,(x.opLog||[]).length);",
    "  maxHit=Math.max(maxHit,(x.hitLog||[]).length); });",
    "return JSON.stringify({hata:hata, nanVar:nanVar,",
    "  maxOp:maxOp, maxHit:maxHit, emps:G.emps.length,",
    "  inbox:(G.inbox||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('240 aylık simülasyon hatasız', d.hata==='', d.hata||'ok');
  ok('hiçbir kaynakta NaN oluşmadı', d.nanVar===false);
  ok('log sınırları korundu', d.maxOp<=20 && d.maxHit<=30,
     'opLog '+d.maxOp+' · hitLog '+d.maxHit);
  ok('inbox 6 sınırında', d.inbox<=6, String(d.inbox));
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
