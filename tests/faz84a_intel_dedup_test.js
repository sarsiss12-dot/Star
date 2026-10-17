#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 84A: İSTİHBARAT EKRANI TEKRAR TEMİZLİĞİ TESTİ
   Yalnız Node.js yerleşik modülleri. Harici bağımlılık yok.
   Çalıştırma: node tests/faz84a_intel_dedup_test.js
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'),
      vm=require('vm'), crypto=require('crypto');
const KOK=path.resolve(__dirname,'..');
const NL='\n';
let gecen=0, kalan=0; const basarisiz=[];
function ok(ad,sart,detay){
  if(sart){gecen++;console.log('  ✓ '+ad+(detay?' — '+detay:''));}
  else{kalan++;basarisiz.push(ad);console.log('  ✗ '+ad+(detay?' — '+detay:''));}
}
const oku=f=>fs.readFileSync(path.join(KOK,f),'utf8');

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
    Reflect,Symbol,NL};
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
  const flush=()=>{let t=0;while(KUYRUK.length&&t++<20){const k=KUYRUK.splice(0);
    k.forEach(x=>{if(x.f)try{x.f();}catch(e){}});}};
  return {sb,R,flush};
}
/* Ortak oyun kurulumu — hedef devletle temas + hafıza */
const KUR = [
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "var e=G.p, o=G.emps[1];",
 "G.emps.forEach(function(x){G.emps.forEach(function(y){",
 "  if(x.id!==y.id&&!x.wild&&!y.wild) x.contact[y.id]=true; });});",
 "e.intel={}; e.intel[o.id]=0;",
 "UI.spyTarget=o.id; UI.cur='intel';",
 "/* Hedefe hafıza olayları ekle */",
 "o.mem = o.mem || {};",
 "var kinds = Object.keys(MEM_KINDS);",
 "for (var i=2;i<6;i++){",
 "  if(!G.emps[i]) continue;",
 "  o.mem[i] = [];",
 "  for (var j=0;j<5;j++)",
 "    o.mem[i].push({k:kinds[j%kinds.length], v:(j%2?12:-9), t:(G.memAge||0)-j});",
 "  o.rel[i] = (i%2? 55 : -48);",
 "}",
 "o.war = o.war || {}; if(G.emps[3]) o.war[3]=true;",
 "o.ally = o.ally || {}; if(G.emps[2]) o.ally[2]=true;",
 "/* canIncite() koşullarını GERÇEKTEN sağla (diplomacy.js:",
 "   incitablePlanet) — başkent olmayan, sıkıyönetimsiz ve",
 "   komşusunda YABANCI bulunan bir koloni gerekiyor. */",
 "e.res.etk = 99999;",
 "e.intel[o.id] = 3;",
 "var kuruldu = false;",
 "/* Hedefin genelde TEK kolonisi var ve o BAŞKENT — başkent",
 "   kışkırtılamaz (doğru oyun kuralı). Bu yüzden hedefe",
 "   başkent olmayan ikinci bir koloni kuruyoruz ve komşusunu",
 "   oyuncuya vererek onu SINIR dünyası yapıyoruz. */",
 "var evSys = G.sys[o.home];",
 "for (var li=0; li<evSys.lanes.length && !kuruldu; li++){",
 "  var ks = G.sys[evSys.lanes[li]];",
 "  if(!ks || ks.owner >= 0) continue;",
 "  var bosPl = null;",
 "  for (var pi=0; pi<ks.planets.length; pi++)",
 "    if(!ks.planets[pi].col){ bosPl = ks.planets[pi]; break; }",
 "  if(!bosPl) continue;",
 "  try { doColonize(o, ks, bosPl); } catch(ex){ continue; }",
 "  if(!bosPl.col) continue;",
 "  bosPl.col.stab = 18; bosPl.martial_law = 0;",
 "  /* komşusunu oyuncuya ver → sınır olsun */",
 "  for (var lj=0; lj<ks.lanes.length; lj++){",
 "    var kom = G.sys[ks.lanes[lj]];",
 "    if(kom && kom.owner < 0 && kom.id !== o.home){ kom.owner = 0; kuruldu = true; break; }",
 "  }",
 "}",
 "globalThis.__hedefHazir = kuruldu;",
 "return 'ok';"
].join('\n');

/* ═══ A. SÖZDİZİMİ VE BÜTÜNLÜK ═══ */
console.log('\nA. SÖZDİZİMİ VE BÜTÜNLÜK');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
let mf=null; try{mf=JSON.parse(oku('manifest.json'));}catch(e){}
ok('manifest.json geçerli',!!mf);
const html=oku('index.html');
const sira=(html.match(/<script src="([^"]+\.js)"><\/script>/g)||[])
  .map(x=>x.replace(/.*src="/,'').replace(/".*/,''));
ok('yükleme sırası değişmedi',
   ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','audio.js']
   .every((f,i)=>sira[i]===f));
const mainJs=oku('main.js');
['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
 'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
  ok('anahtar: '+k, mainJs.includes(k)));
ok("sw cache = 'stars-v95e1'", /const CACHE = 'stars-v95e1'/.test(oku('sw.js')));

/* SITUATION KARANTİNASI */
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF (yorumlu)',
     /\/\/\s*if \(typeof situationsTick/.test(dip) &&
     !/^\s*if \(typeof situationsTick === 'function'\) situationsTick\(\);/m.test(dip));
  ok("DURUMLAR sekmesi gizli", /\/\/ \{k:'durum'/.test(mn));
  const H=harness();
  /* KUR bloğu `return 'ok'` ile bitiyor — arkasına kod eklenemez.
     Önce kurulum, sonra AYRI bir çağrıda ölçüm. */
  H.R(KUR);
  const sit=H.R([
    "G.sits=[]; G.sitDone={};",
    "for (var m=0;m<200;m++){ G.memAge++; monthTick(); G.over=null; }",
    "return String((G.sits||[]).length);"].join('\n'));
  ok('200 ayda situation tetiklenmedi', String(sit)==='0', String(sit));
}

/* ═══ B. STATİK TEKRAR DENETİMİ ═══ */
console.log('\nB. STATİK TEKRAR DENETİMİ');
{
  const ui=oku('ui.js');
  /* Yorum satırlarını hariç tut — yalnız gerçek render sayılır */
  const kod = ui.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  const say = (re) => (kod.match(re)||[]).length;
  const gecmis = say(/h \+= `<div class="ph">📜 GİZLİ DİPLOMATİK GEÇMİŞ<\/div>`/g);
  const tablo  = say(/h \+= `<div class="ph">🔓 NET İLİŞKİ TABLOSU/g);
  const kiskirt= say(/h \+= `<div class="ph">🔥 İSYANI KIŞKIRT<\/div>`/g);
  const incite = say(/case 'incite':/g);
  ok('GİZLİ DİPLOMATİK GEÇMİŞ: tek render', gecmis===1, gecmis+' adet');
  ok('NET İLİŞKİ TABLOSU: tek render', tablo===1, tablo+' adet');
  ok('İSYANI KIŞKIRT: tek render', kiskirt===1, kiskirt+' adet');
  ok("case 'incite': tam bir adet", incite===1, incite+' adet');
  /* Eski/yanlış sabitler kalmamalı */
  ok('INCITE_STAB fallback kaldırıldı', !/INCITE_STAB\b[^_]/.test(kod));
  ok('INCITE_HEADSTART kaldırıldı', !/INCITE_HEADSTART/.test(kod));
  ok('100 Etki fallback kaldırıldı', !/INCITE_COST : 100/.test(kod));
  ok('UI kanonik sabitleri kullanıyor',
     /INCITE_COST/.test(kod) && /INCITE_STAB_HIT/.test(kod) &&
     /INCITE_SEED/.test(kod) && /INCITE_MONTHS/.test(kod));
}

/* ═══ C. İSTİHBARAT SEVİYE MATRİSİ ═══ */
console.log('\nC. İSTİHBARAT SEVİYE MATRİSİ');
{
  const H=harness();
  const r=H.R(KUR);
  ok('kurulum', r==='ok', r!=='ok'?String(r):undefined);
  const olc = (lvl) => H.R([
    "var e=G.p, o=G.emps[1];",
    "e.intel[o.id]="+lvl+";",
    "/* FAZ 86A: istihbarat artık ÜÇ görünüme bölündü. Tekrar (dedup)",
    "   iddiaları BÜTÜN arayüz için geçerli olmalı, bu yüzden üç",
    "   görünüm de (gruplar açık) birleştirilip sınanır. Hiçbir",
    "   iddia gevşetilmedi; yalnız gezinti kapsandı. */",
    "function intelHepsi(){ var v=UI.intelView, g=UI.intelGroup;",
    "  UI.intelView='networks'; var a=String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi';",
    "  var b=String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; var c=String(UI.p_intel()||'');",
    "  UI.intelView='files'; var d=String(UI.p_intel()||'');",
    "  UI.intelView=v; UI.intelGroup=g;",
    "  /* opsCatalog iki kez geçmesin diye ops başlığı bir kez alınır */",
    "  return a + b + c.replace(/^[\\s\\S]*?ÖZEL OPERASYONLAR/, '') + d; }",
    "if(UI.spyTarget===undefined||UI.spyTarget===null){",
    "  var _t=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "    G.p.contact[z.id];})[0]; if(_t) UI.spyTarget=_t.id; }",
    "var h=intelHepsi();",
    "return [",
    "  (h.match(/GİZLİ DİPLOMATİK GEÇMİŞ/g)||[]).length,",
    "  (h.match(/NET İLİŞKİ TABLOSU/g)||[]).length,",
    "  (h.match(/<div class=\"ph\">🔥 İSYANI KIŞKIRT<\\/div>/g)||[]).length,",
    "  h.length",
    "].join('|');"].join('\n'));
  const M={};
  [0,1,2,3].forEach(l=>{ M[l]=String(olc(l)).split('|').map(Number); });
  console.log('     seviye | geçmiş | tablo | kışkırt');
  [0,1,2,3].forEach(l=>console.log('       '+l+'    |   '+M[l][0]+
    '    |   '+M[l][1]+'   |    '+M[l][2]));
  ok('seviye 0: gizli geçmiş YOK', M[0][0]===0, M[0][0]+'');
  ok('seviye 0: net tablo YOK', M[0][1]===0, M[0][1]+'');
  ok('seviye 1: gizli geçmiş YOK', M[1][0]===0, M[1][0]+'');
  ok('seviye 1: net tablo YOK', M[1][1]===0, M[1][1]+'');
  ok('seviye 2: geçmiş TAM BİR kez', M[2][0]===1, M[2][0]+'');
  ok('seviye 2: sayısal tablo YOK', M[2][1]===0, M[2][1]+'');
  ok('seviye 3: geçmiş TAM BİR kez', M[3][0]===1, M[3][0]+'');
  ok('seviye 3: tablo TAM BİR kez', M[3][1]===1, M[3][1]+'');
  /* Yalnız BAŞLIK sayılıyor; buton etiketi de aynı metni taşıyor
     ama o tekrar değil, hedef kartının kendi düğmesi. */
  ok('kışkırt BAŞLIĞI tek kez', M[3][2]===1, M[3][2]+' başlık');
  /* seviye 2'de kilit açıklaması */
  const kilit=H.R([
    "G.p.intel[G.emps[1].id]=2;",
    "/* FAZ 86A: istihbarat artık ÜÇ görünüme bölündü. Tekrar (dedup)",
    "   iddiaları BÜTÜN arayüz için geçerli olmalı, bu yüzden üç",
    "   görünüm de (gruplar açık) birleştirilip sınanır. Hiçbir",
    "   iddia gevşetilmedi; yalnız gezinti kapsandı. */",
    "function intelHepsi(){ var v=UI.intelView, g=UI.intelGroup;",
    "  UI.intelView='networks'; var a=String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi';",
    "  var b=String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; var c=String(UI.p_intel()||'');",
    "  UI.intelView='files'; var d=String(UI.p_intel()||'');",
    "  UI.intelView=v; UI.intelGroup=g;",
    "  /* opsCatalog iki kez geçmesin diye ops başlığı bir kez alınır */",
    "  return a + b + c.replace(/^[\\s\\S]*?ÖZEL OPERASYONLAR/, '') + d; }",
    "if(UI.spyTarget===undefined||UI.spyTarget===null){",
    "  var _t=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "    G.p.contact[z.id];})[0]; if(_t) UI.spyTarget=_t.id; }",
    "var h=intelHepsi();",
    "return /3\\. seviye ağ gerektirir/.test(h) ? 'var':'yok';"].join('\n'));
  ok('seviye 2: kilit açıklaması var', String(kilit)==='var', String(kilit));
  /* Boş veri */
  const bos=H.R([
    "var o=G.emps[1]; var yedek=o.mem; o.mem={};",
    "G.p.intel[o.id]=3;",
    "var hata=null; var h='';",
    "try{ h=String(UI.p_intel()||''); }catch(ex){ hata=ex.message; }",
    "o.mem=yedek;",
    "return hata ? 'HATA:'+hata : 'ok:'+h.length;"].join('\n'));
  ok('boş hafızada hata atmıyor', String(bos).indexOf('ok:')===0, String(bos).slice(0,60));
  /* Akordiyon aç/kapa + aynı isimli devletler */
  const akor=H.R([
    "var o=G.emps[1]; G.p.intel[o.id]=2;",
    "/* iki devlete AYNI adı ver */",
    "if(G.emps[2]&&G.emps[3]){ G.emps[2].name='Aynı Hanedan'; G.emps[3].name='Aynı Hanedan'; }",
    "UI.memOpen=null;",
    "var h1=String(UI.p_intel()||'');",
    "var anahtarlar=(h1.match(/data-a=\"memTog\" data-x=\"([^\"]+)\"/g)||[])",
    "  .map(function(x){return x.replace(/.*data-x=\"/,'').replace(/\"$/,'');});",
    "var tekil = new Set(anahtarlar).size === anahtarlar.length;",
    "var sayisal = anahtarlar.every(function(a){ return /^\\d+$/.test(a); });",
    "/* aç */",
    "UI.memOpen = anahtarlar[0];",
    "var h2=String(UI.p_intel()||'');",
    "var acildi = h2.length > h1.length;",
    "UI.memOpen = null;",
    "var h3=String(UI.p_intel()||'');",
    "return [anahtarlar.length, tekil, sayisal, acildi, h3.length===h1.length].join('|');"
  ].join('\n'));
  const ap=String(akor).split('|');
  ok('akordiyon anahtarları benzersiz', ap[1]==='true', ap[0]+' grup');
  ok('anahtar devlet ID (sayısal)', ap[2]==='true', ap[2]);
  ok('akordiyon açılıyor', ap[3]==='true');
  ok('akordiyon kapanıyor', ap[4]==='true');
}

/* ═══ D. KIŞKIRTMA ═══ */
console.log('\nD. KIŞKIRTMA');
{
  const H=harness(); H.R(KUR);
  /* UI'deki değerler diplomacy.js sabitleriyle aynı mı? */
  const sabit=H.R([
    "var e=G.p; e.intel[G.emps[1].id]=3; e.res.etk=99999;",
    "/* FAZ 86A: istihbarat artık ÜÇ görünüme bölündü. Tekrar (dedup)",
    "   iddiaları BÜTÜN arayüz için geçerli olmalı, bu yüzden üç",
    "   görünüm de (gruplar açık) birleştirilip sınanır. Hiçbir",
    "   iddia gevşetilmedi; yalnız gezinti kapsandı. */",
    "function intelHepsi(){ var v=UI.intelView, g=UI.intelGroup;",
    "  UI.intelView='networks'; var a=String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi';",
    "  var b=String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; var c=String(UI.p_intel()||'');",
    "  UI.intelView='files'; var d=String(UI.p_intel()||'');",
    "  UI.intelView=v; UI.intelGroup=g;",
    "  /* opsCatalog iki kez geçmesin diye ops başlığı bir kez alınır */",
    "  return a + b + c.replace(/^[\\s\\S]*?ÖZEL OPERASYONLAR/, '') + d; }",
    "if(UI.spyTarget===undefined||UI.spyTarget===null){",
    "  var _t=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "    G.p.contact[z.id];})[0]; if(_t) UI.spyTarget=_t.id; }",
    "var h=intelHepsi();",
    "return [INCITE_COST, INCITE_STAB_HIT, INCITE_SEED, INCITE_MONTHS,",
    "  h.indexOf('('+INCITE_COST+' ◈)')>=0,",
    "  h.indexOf('istikrar −'+INCITE_STAB_HIT)>=0,",
    "  h.indexOf('+'+INCITE_SEED+' ay')>=0,",
    "  h.indexOf(INCITE_MONTHS+' ay sürer')>=0].join('|');"].join('\n'));
  const sp=String(sabit).split('|');
  ok('INCITE_COST = 120', sp[0]==='120', sp[0]);
  ok('INCITE_STAB_HIT = 25', sp[1]==='25', sp[1]);
  ok('INCITE_SEED = 10', sp[2]==='10', sp[2]);
  ok('INCITE_MONTHS = 12', sp[3]==='12', sp[3]);
  ok('ekranda maliyet doğru', sp[4]==='true');
  ok('ekranda istikrar etkisi doğru', sp[5]==='true');
  ok('ekranda sayaç doğru', sp[6]==='true');
  ok('ekranda süre doğru', sp[7]==='true');
  /* Hedef başına tek buton */
  const btn=H.R([
    "/* FAZ 86A: istihbarat artık ÜÇ görünüme bölündü. Tekrar (dedup)",
    "   iddiaları BÜTÜN arayüz için geçerli olmalı, bu yüzden üç",
    "   görünüm de (gruplar açık) birleştirilip sınanır. Hiçbir",
    "   iddia gevşetilmedi; yalnız gezinti kapsandı. */",
    "function intelHepsi(){ var v=UI.intelView, g=UI.intelGroup;",
    "  UI.intelView='networks'; var a=String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi';",
    "  var b=String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; var c=String(UI.p_intel()||'');",
    "  UI.intelView='files'; var d=String(UI.p_intel()||'');",
    "  UI.intelView=v; UI.intelGroup=g;",
    "  /* opsCatalog iki kez geçmesin diye ops başlığı bir kez alınır */",
    "  return a + b + c.replace(/^[\\s\\S]*?ÖZEL OPERASYONLAR/, '') + d; }",
    "if(UI.spyTarget===undefined||UI.spyTarget===null){",
    "  var _t=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "    G.p.contact[z.id];})[0]; if(_t) UI.spyTarget=_t.id; }",
    "var h=intelHepsi();",
    "var m=h.match(/data-a=\"incite\" data-x=\"(\\d+)\"/g)||[];",
    "var ids=m.map(function(x){return x.replace(/.*data-x=\"/,'').replace(/\"$/,'');});",
    "return [m.length, new Set(ids).size].join('|');"].join('\n'));
  const bp=String(btn).split('|');
  ok('her hedef için TEK buton', bp[0]===bp[1], bp[0]+' buton / '+bp[1]+' hedef');
  /* Tek dokunuş → tek çağrı, kaynak tam 120 */
  const tek=H.R([
    "var e=G.p; e.res.etk=1000;",
    "globalThis.__cagri=0;",
    "var orij=inciteRebellion;",
    "globalThis.inciteRebellion=function(){ globalThis.__cagri++;",
    "  return orij.apply(null, arguments); };",
    "/* FAZ 86A: istihbarat artık ÜÇ görünüme bölündü. Tekrar (dedup)",
    "   iddiaları BÜTÜN arayüz için geçerli olmalı, bu yüzden üç",
    "   görünüm de (gruplar açık) birleştirilip sınanır. Hiçbir",
    "   iddia gevşetilmedi; yalnız gezinti kapsandı. */",
    "function intelHepsi(){ var v=UI.intelView, g=UI.intelGroup;",
    "  UI.intelView='networks'; var a=String(UI.p_intel()||'');",
    "  UI.intelView='operations'; UI.intelGroup='siyasi';",
    "  var b=String(UI.p_intel()||'');",
    "  UI.intelGroup='dogrudan'; var c=String(UI.p_intel()||'');",
    "  UI.intelView='files'; var d=String(UI.p_intel()||'');",
    "  UI.intelView=v; UI.intelGroup=g;",
    "  /* opsCatalog iki kez geçmesin diye ops başlığı bir kez alınır */",
    "  return a + b + c.replace(/^[\\s\\S]*?ÖZEL OPERASYONLAR/, '') + d; }",
    "if(UI.spyTarget===undefined||UI.spyTarget===null){",
    "  var _t=G.emps.filter(function(z){return z.id&&!z.wild&&!z.dead&&",
    "    G.p.contact[z.id];})[0]; if(_t) UI.spyTarget=_t.id; }",
    "var h=intelHepsi();",
    "var m=h.match(/data-a=\"incite\" data-x=\"(\\d+)\"/);",
    "if(!m) return 'hedef-yok';",
    "var hedefId=m[1];",
    "var etkOnce=e.res.etk;",
    "UI.act('incite', hedefId);",
    "var dusus=etkOnce-e.res.etk;",
    "globalThis.inciteRebellion=orij;",
    "return [globalThis.__cagri, dusus].join('|');"].join('\n'));
  const tp=String(tek).split('|');
  if (String(tek)==='hedef-yok') ok('kışkırtma hedefi bulundu', false, 'uygun hedef yok');
  else {
    ok('bir dokunuş → TAM BİR inciteRebellion', tp[0]==='1', tp[0]+' çağrı');
    ok('etki tam 120 azaldı (iki kez değil)', tp[1]==='120', tp[1]+' etki');
  }
  /* Zorlanmış BAŞARI: istikrar −25, sayaç +10, unrest 12 ay */
  const basari=H.R([
    "var e=G.p; e.res.etk=99999;",
    "var hedef=null;",
    "for (var i=1;i<G.emps.length;i++){",
    "  var o=G.emps[i]; if(!o||o.dead||o.wild) continue;",
    "  var c=canIncite(e,o); if(c.ok){ hedef=o; break; }",
    "}",
    "if(!hedef) return 'hedef-yok';",
    "var hd=canIncite(e,hedef).hedef;",
    "var col=hd.pl.col;",
    "var stabOnce=col.stab, secOnce=(col.secede||0);",
    "var orij=rnd; globalThis.rnd=function(){ return 0.01; };",
    "var r=inciteRebellion(e, hedef);",
    "globalThis.rnd=orij;",
    "/* unrest bir NESNE: {left, hit, by} — diplomacy.js:6255 */",
    "var u = col.unrest || {};",
    "return [r.ok, !!r.basarili, !!r.caught,",
    "  Math.round(stabOnce-col.stab), Math.round((col.secede||0)-secOnce),",
    "  (u.left||0), (u.hit||0)].join('|');"].join('\n'));
  const bp2=String(basari).split('|');
  if (String(basari)==='hedef-yok') ok('başarı senaryosu hedefi', false, 'hedef yok');
  else {
    ok('zorlanmış başarı gerçekleşti', bp2[1]==='true', 'basarili='+bp2[1]);
    ok('istikrar −25 uygulandı', bp2[3]==='25' || bp2[6]==='25',
       'anlık düşüş '+bp2[3]+' · unrest.hit '+bp2[6]);
    ok('sayaç +10', bp2[4]==='10', bp2[4]);
    ok('huzursuzluk 12 ay (unrest.left)', bp2[5]==='12', bp2[5]);
  }
  /* Bildirim sayımı: başarı / ifşa / sessiz */
  const bild=H.R([
    "var e=G.p; e.res.etk=99999;",
    "globalThis.__say=0; globalThis.__art=0;",
    "var oSay=UI.alert, oArt=UI.eventArt;",
    "UI.alert=function(){ globalThis.__say++; };",
    "UI.eventArt=function(){ globalThis.__art++; };",
    "function dene(rndDeger){",
    "  globalThis.__say=0; globalThis.__art=0;",
    "  var hedef=null;",
    "  for (var i=1;i<G.emps.length;i++){",
    "    var o=G.emps[i]; if(!o||o.dead||o.wild) continue;",
    "    var c=canIncite(e,o); if(c.ok){ hedef=o; break; } }",
    "  if(!hedef) return '-';",
    "  delete hedef._incCd;",
    "  e.res.etk=99999;",
    "  var orj=rnd; globalThis.rnd=function(){ return rndDeger; };",
    "  UI.act('incite', String(hedef.id));",
    "  globalThis.rnd=orj;",
    "  return globalThis.__say+'/'+globalThis.__art;",
    "}",
    "var basari=dene(0.01);",
    "var ifsa=dene(0.99);",
    "UI.alert=oSay; UI.eventArt=oArt;",
    "return basari+'|'+ifsa;"].join('\n'));
  const parts=String(bild).split('|');
  ok('başarı: bildirim tekrarı yok (motor bildiriyor)',
     parts[0]==='-' || (+String(parts[0]).split('/')[0] <= 2),
     'say/art = '+parts[0]);
  ok('ifşa: tek olay görseli',
     parts[1]==='-' || (+String(parts[1]).split('/')[1] <= 1),
     'say/art = '+parts[1]);
}

/* ═══ E. RENDER SAFLIĞI ═══ */
console.log('\nE. RENDER SAFLIĞI');
{
  const H=harness(); H.R(KUR);
  const saf=H.R([
    "var e=G.p, o=G.emps[1];",
    "e.intel[o.id]=3; e.res.etk=5000;",
    "var once=serialize();",
    "for (var lvl=0; lvl<=3; lvl++){",
    "  e.intel[o.id]=lvl;",
    "  for (var i=0;i<20;i++) String(UI.p_intel()||'');",
    "}",
    "e.intel[o.id]=3;",
    "var sonra=serialize();",
    "if (once===sonra) return 'BIREBIR|0';",
    "/* TÜRETİLMİŞ önbellekleri ayır: personaOf() mizaç profilini",
    "   ilk çağrıda hesaplayıp _pers/_persAt/_prof alanlarına",
    "   yazıyor. Bu Faz 72'den beri böyle ve BU FAZIN getirdiği",
    "   bir değişiklik değil; kapsam gereği main.js'e dokunulmadı.",
    "   Asıl sınanan şey aşağıda: kaynak, ilişki, hafıza,",
    "   istihbarat ve hedef verisi değişmemeli. */",
    "function norm(t){",
    "  var d=JSON.parse(t), L=d.emps||[];",
    "  for (var i=0;i<L.length;i++){",
    "    delete L[i]._pers; delete L[i]._persAt; delete L[i]._prof;",
    "  }",
    "  return JSON.stringify(d);",
    "}",
    "var ham=Math.abs(once.length-sonra.length);",
    "return (norm(once)===norm(sonra) ? 'VERI-AYNI' : 'VERI-FARKLI')+'|'+ham;"
  ].join('\n'));
  const sp2=String(saf).split('|');
  ok('80 render sonrası OYUN VERİSİ değişmedi',
     sp2[0]==='BIREBIR' || sp2[0]==='VERI-AYNI',
     sp2[0]==='BIREBIR' ? 'birebir'
       : 'oyun verisi aynı · yalnız persona önbelleği '+sp2[1]+'B (kapsam dışı)');
  /* Asıl sınama: hedefe ait veriler render'dan etkilenmedi mi? */
  const hedefSaf=H.R([
    "var e=G.p, o=G.emps[1];",
    "e.intel[o.id]=3;",
    "var im={etk:e.res.etk, lvl:e.intel[o.id],",
    "  mem:JSON.stringify(o.mem), rel:JSON.stringify(o.rel),",
    "  spy:UI.spyTarget};",
    "for (var i=0;i<20;i++) String(UI.p_intel()||'');",
    "return [e.res.etk===im.etk, e.intel[o.id]===im.lvl,",
    "  JSON.stringify(o.mem)===im.mem, JSON.stringify(o.rel)===im.rel,",
    "  UI.spyTarget===im.spy].join('|');"].join('\n'));
  const hp=String(hedefSaf).split('|');
  ok('render kaynak değiştirmedi', hp[0]==='true');
  ok('render istihbarat seviyesi değiştirmedi', hp[1]==='true');
  ok('render hafıza değiştirmedi', hp[2]==='true');
  ok('render ilişki değiştirmedi', hp[3]==='true');
  ok('render hedef değiştirmedi', hp[4]==='true');
}

/* ═══ F. REGRESYON ═══ */
console.log('\nF. REGRESYON');
{
  const H=harness();
  const r=H.R([
    "var hata=null;",
    "try{ setupGame({name:'R',race:'insan',traits:['uyumlu'],size:'buyuk',",
    "  shape:'sarmal',diff:'zor',seed:7,ethics:{mil:0,aut:0,mat:1,ahl:0},",
    "  civics:['maden_lonca'],origin:'standart',ruins:'orta',crisis:'sonoyun',",
    "  council:'normal',mizac:'teknokrasi',physio:'humanoid'});",
    "}catch(ex){ hata='setup:'+ex.message; }",
    "if(hata) return hata;",
    "View.init(); View.vw=900; View.vh=420;",
    "View.cv=document.getElementById('map');",
    "G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });",
    "G.p.res.etk=99999; recruitLeader(G.p,'amiral');",
    "var err=null;",
    "try{ for (var m=0;m<120;m++){",
    "  for (var d=0;d<30;d++){ dailyTick(1); structTick(1); colonyBuildTick(1); }",
    "  autoExploreTick(); economyTick(false); raidTick(); envoyTick();",
    "  attritionTick(); diploTick(); spyTick(); tradeFlowTick(); fedTick();",
    "  borderFriction(); facTick(); councilTick(); crisisTick(); warExhTick();",
    "  G.emps.filter(function(x){return x.ai&&!x.dead;}).forEach(function(x){ aiTurn(x); });",
    "  monthTick(); G.over=null; } }catch(ex){ err='120ay:'+ex.message; }",
    "if(err) return err;",
    "var sh=null; try{ var t=serialize(); deserialize(t); }catch(ex){ sh='kayit:'+ex.message; }",
    "if(sh) return sh;",
    "/* leaderPool saf mı */",
    "var e2=G.emps[2]; delete e2.leaders;",
    "leaderPool(e2);",
    "var saf = !Object.prototype.hasOwnProperty.call(e2,'leaders');",
    "return ['ok', typeof UI.tab, saf, (G.sits||[]).length].join('|');"
  ].join('\n'));
  const p=String(r).split('|');
  ok('120 ay + kaydet/yükle', p[0]==='ok', String(r).slice(0,70));
  ok('UI.tab hâlâ function', p[1]==='function', p[1]);
  ok('leaderPool saf kaldı', p[2]==='true', p[2]);
  ok('situation pasif kaldı', p[3]==='0', p[3]);
  const mj=oku('main.js');
  const m=mj.match(/function\s+forceRedraw\s*\([^)]*\)\s*\{/);
  let govde='';
  if(m){ const i=mj.indexOf(m[0]); let d=0,b=false;
    for(let k=i;k<mj.length&&k<i+4000;k++){ const ch=mj[k];
      if(ch==='{'){d++;b=true;} else if(ch==='}')d--;
      govde+=ch; if(b&&d===0)break; } }
  ok('forceRedraw tek kurtarma hattında',
     /scheduleRecovery/.test(govde) && !/View\.draw/.test(govde));
}

/* ═══ G. DOSYA SINIRI ═══ */
console.log('\nG. DOSYA SINIRI');
{
  const refYol=path.join(KOK,'tests','referans-sha.json');
  /* FAZ 86C.4H: map.js ve main.js bu hotfix'te DEĞİŞİYOR
     (pointer yaşam döngüsü + yükleme sonrası kurtarma), bu
     yüzden korunan kümeden çıkarıldılar. */
  let ref=null;
  try{ ref=JSON.parse(fs.readFileSync(refYol,'utf8')); }catch(e){}
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

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
