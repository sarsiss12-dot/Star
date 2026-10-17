#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 84B: DEVLET EKRANI VASALLIK / HEGEMONYA TEKRAR TEMİZLİĞİ
   Yalnız Node.js yerleşik modülleri. Harici bağımlılık yok.
   Çalıştırma: node tests/faz84b_vassal_state_dedup_test.js
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

/* ═══════════════════════════════════════════════════════════════════
   GÜVENİLİR FONKSİYON GÖVDESİ ÇIKARICI
   Dengeli süslü parantez — dize, şablon dizesi, yorum ve regex
   literalleri atlanır. `ui.js` genelinde "vasal" saymak YANLIŞ olur;
   yalnız p_imp() gövdesi ölçülür.
   ═══════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════
   HARNESS — tarayıcısız DOM/canvas taklidi
   ═══════════════════════════════════════════════════════════════════ */
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

/* Ortak kurulum — perki OLMAYAN nötr ideolojili oyuncu */
const KUR_NOTR = [
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "G.p.ethics={mil:0,aut:0,mat:0,ahl:0};",
 "return 'ok';"].join('\n');

/* Perki OLAN oyuncu (mil:3 → ideoloji yetenekleri açılır) */
const KUR_PERK = [
 "setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',",
 " diff:'normal',seed:99,ethics:{mil:3,aut:0,mat:0,ahl:0},civics:[],",
 " origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
 "View.init(); View.vw=900; View.vh=420;",
 "View.cv=document.getElementById('map');",
 "G.p.ethics={mil:3,aut:0,mat:0,ahl:0};",
 "return 'ok';"].join('\n');

/* ═══ A. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA ═══ */
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
     ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','audio.js']
     .every((f,i)=>sira[i]===f));
  const mainJs=oku('main.js');
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mainJs.includes(k)));
  ok("sw cache = 'stars-v95e1'", /const CACHE = 'stars-v95e1'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
}
/* SITUATION KARANTİNASI */
{
  const eco=oku('economy.js'), dip=oku('diplomacy.js'), mn=oku('main.js');
  ok('SITUATIONS kataloğu duruyor', /const SITUATIONS\s*=/.test(eco));
  ok('situationsTick tanımı duruyor', /function situationsTick/.test(eco));
  ok('situationsTick çağrısı PASİF (yorumlu)',
     /\/\/\s*if \(typeof situationsTick/.test(dip) &&
     !/^\s*if \(typeof situationsTick === 'function'\) situationsTick\(\);/m.test(dip));
  ok("DURUMLAR sekmesi gizli", /\/\/ \{k:'durum'/.test(mn));
  const H=harness(); H.R(KUR_NOTR);
  const sit=H.R([
    "G.sits=[]; G.sitDone={};",
    "for (var m=0;m<200;m++){ G.memAge++; monthTick(); G.over=null; }",
    "return String((G.sits||[]).length);"].join('\n'));
  ok('200 ayda situation tetiklenmedi', String(sit)==='0', String(sit));
}
/* DEĞİŞMEMESİ GEREKEN DOKUZ DOSYA */
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

/* ═══ B. TEKRAR TESTİ — p_imp() GÖVDESİNDE TEK KANONİK YOL ═══ */
console.log('\nB. TEKRAR TESTİ (yalnız p_imp gövdesi)');
{
  const ui=oku('ui.js');
  const govde=fnGovde(ui,'p_imp(');
  /* Fonksiyon bulunamazsa test KESİN başarısız olur */
  ok('p_imp() gövdesi güvenilir biçimde çıkarıldı', govde!==null,
     govde ? govde.split('\n').length+' satır' : 'BULUNAMADI');
  if(govde===null){
    console.log('\n  ⛔ p_imp() çıkarılamadı — tekrar ölçümü yapılamaz.');
    kalan++; basarisiz.push('p_imp gövdesi çıkarılamadı');
  } else {
    const say=re=>(govde.match(re)||[]).length;
    ok('eski "FAZ 8: hegemonya" bloğu kalmadı',
       say(/FAZ 8: hegemonya\b/g)===0, String(say(/FAZ 8: hegemonya\b/g)));
    ok('eski "FAZ 8: hegemonya ve vasallık" bloğu kalmadı',
       say(/FAZ 8: hegemonya ve vasall[ıi]k/g)===0);
    ok('eski "FAZ 8: hegemonya durumu" bloğu kalmadı',
       say(/FAZ 8: hegemonya durumu/g)===0);
    ok('TEK kanonik FAZ 84B bölümü var',
       say(/FAZ 84B: KANON[İI]K VASALLIK/g)===1,
       String(say(/FAZ 84B: KANON[İI]K VASALLIK/g)));
    ok('vasal durum başlığı tam bir kez',
       say(/VASALLIK DURUMU/g)===1, String(say(/VASALLIK DURUMU/g)));
    ok('hegemonya başlığı tam bir kez',
       say(/HEGEMONYA — VASALLARIN/g)===1, String(say(/HEGEMONYA — VASALLARIN/g)));
    ok('isyan düğmesi p_imp içinde tam bir kez',
       say(/data-a="revolt"/g)===1, String(say(/data-a="revolt"/g)));
    /* Aynı değeri tekrar tekrar hesaplama yasağı */
    ok('vassalLoyaltyInfo() render başına 1 çağrı',
       say(/vassalLoyaltyInfo\(/g)===1, String(say(/vassalLoyaltyInfo\(/g)));
    ok('hegemonyWeight() render başına 1 çağrı',
       say(/hegemonyWeight\(/g)===1, String(say(/hegemonyWeight\(/g)));
    ok('vassalCapBonus() render başına 1 çağrı',
       say(/vassalCapBonus\(/g)===1, String(say(/vassalCapBonus\(/g)));
    ok('vassalsOf(e) tek kez çözülüyor',
       say(/vassalsOf\(e\)/g)===1, String(say(/vassalsOf\(e\)/g)));
    ok('isVassal(e) tek kez çözülüyor',
       say(/isVassal\(e\)/g)===1, String(say(/isVassal\(e\)/g)));
    /* Kanonik bölüm PERK KOŞULUNUN DIŞINDA olmalı */
    const kapi=govde.indexOf('if (perks.length){');
    const kanon=govde.indexOf('FAZ 84B: KANON');
    ok('kanonik bölüm perk koşulundan ÖNCE (dışında)',
       kapi>0 && kanon>0 && kanon<kapi,
       'kanon@'+kanon+' perkKapı@'+kapi);
  }
  /* Kapsam dışı gösterimlere dokunulmadı */
  ok('sağ panel "⛓ SÜZERENLİK" alanı duruyor',
     (ui.match(/<div class="ph">⛓ SÜZERENL[İI]K<\/div>/g)||[]).length===1);
  ok('Diplomasi panelindeki vasallık özeti duruyor',
     /FAZ 8: vasall[ıi]k ili[şs]kisi/.test(ui));
  ok('Süzerenlik müzakere modalı duruyor', /SÜZERENLİK MÜZAKERESİ/.test(ui));
}

/* ═══ C. ÖLÜ EYLEM TESTİ ═══ */
console.log('\nC. ÖLÜ UI EYLEMLERİ');
{
  const ui=oku('ui.js'), html=oku('index.html');
  const hepsi=ui+html;
  ok("case 'vassalDemand' kaldırıldı",
     (ui.match(/case 'vassalDemand'/g)||[]).length===0);
  ok("case 'vassalSeek' kaldırıldı",
     (ui.match(/case 'vassalSeek'/g)||[]).length===0);
  ok('proje genelinde vassalDemand referansı sıfır',
     (hepsi.match(/vassalDemand/g)||[]).length===0);
  ok('proje genelinde vassalSeek referansı sıfır',
     (hepsi.match(/vassalSeek/g)||[]).length===0);
  /* Kanonik müzakere yolu AYNEN duruyor */
  ok("case 'vsOpen' kanonik yol olarak duruyor",
     (ui.match(/case 'vsOpen'/g)||[]).length===1);
  ok("case 'vsType' kanonik yol olarak duruyor",
     (ui.match(/case 'vsType'/g)||[]).length===1);
  ok("case 'vsCancel' kanonik yol olarak duruyor",
     (ui.match(/case 'vsCancel'/g)||[]).length===1);
  ok("case 'vsSend' kanonik yol olarak duruyor",
     (ui.match(/case 'vsSend'/g)||[]).length===1);
  ok('vsOpen için gerçek data-a üreticisi var',
     (ui.match(/data-a="vsOpen"/g)||[]).length>=1);
  ok('vsSend çift dokunma koruması duruyor',
     /if \(!this\.vs \|\| this\.vs\.gonderildi\) break;/.test(ui));
  /* Kabul/ret hesabı diplomacy.js'te kalmalı */
  const dip=oku('diplomacy.js');
  ok('demandVassal hesabı diplomacy.js\'te', /function demandVassal/.test(dip));
  ok('seekProtection hesabı diplomacy.js\'te', /function seekProtection/.test(dip));
}
/* Davranışsal: modal açmak kaynak harcamaz, iptal veri değiştirmez */
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, o=G.emps[1];",
    "G.emps.forEach(function(x){G.emps.forEach(function(y){",
    "  if(x.id!==y.id&&!x.wild&&!y.wild) x.contact[y.id]=true; });});",
    "var once=serialize();",
    "UI.act('vsOpen', o.id+':demand');",
    "UI.act('vsType', 'bekci');",
    "UI.act('vsCancel');",
    "var sonra=serialize();",
    "function norm(t){var d=JSON.parse(t),L=d.emps||[];",
    "  for(var i=0;i<L.length;i++){delete L[i]._pers;delete L[i]._persAt;delete L[i]._prof;}",
    "  /* FAZ 85A: council artik kayitta. pariahMap() `pariahs` alanini",
    "     TEMBEL uretir (targeted.parya'dan turetilir) — personaOf()",
    "     onbellegiyle ayni sinif, gercek oyun verisi degil. */",
    "  if(d.world&&d.world.council) delete d.world.council.pariahs;",
    "  return JSON.stringify(d);}",
    "return (norm(once)===norm(sonra)?'AYNI':'FARKLI')+'|'+String(UI.vs);"].join('\n'));
  const p=String(r).split('|');
  ok('vsOpen→vsType→vsCancel oyun verisini değiştirmedi', p[0]==='AYNI', p[0]);
  ok('iptal sonrası müzakere durumu temizlendi', p[1]==='null', p[1]);
}

/* ═══ D. SENARYO 1 — BAĞIMSIZ + VASALSIZ + PERKSİZ ═══ */
console.log('\nD. SENARYO 1 — BAĞIMSIZ + VASALSIZ + PERKSİZ');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p;",
    "delete e.overlord; delete e.vassalType;",
    "G.emps.forEach(function(x){ if(x.id!==e.id) delete x.overlord; });",
    "var perk=perksOf(e).length;",
    "var once=serialize();",
    "var html='', hata='';",
    "try{ html=String(UI.p_imp()||''); }catch(ex){ hata=ex.message; }",
    "var sonra=serialize();",
    "function norm(t){var d=JSON.parse(t),L=d.emps||[];",
    "  for(var i=0;i<L.length;i++){delete L[i]._pers;delete L[i]._persAt;delete L[i]._prof;}",
    "  /* FAZ 85A: council artik kayitta. pariahMap() `pariahs` alanini",
    "     TEMBEL uretir (targeted.parya'dan turetilir) — personaOf()",
    "     onbellegiyle ayni sinif, gercek oyun verisi degil. */",
    "  if(d.world&&d.world.council) delete d.world.council.pariahs;",
    "  return JSON.stringify(d);}",
    "return JSON.stringify({perk:perk, hata:hata, uz:html.length,",
    "  vasalBaslik:(html.match(/VASALLIK DURUMU/g)||[]).length,",
    "  hegBaslik:(html.match(/HEGEMONYA — VASALLARIN/g)||[]).length,",
    "  revolt:(html.match(/data-a=\"revolt\"/g)||[]).length,",
    "  veri:(norm(once)===norm(sonra)?'AYNI':'FARKLI')});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (senaryo geçerli)', d.perk===0, 'perk='+d.perk);
  ok('p_imp() hata atmadı', d.hata==='' && d.uz>0, d.hata||(d.uz+' bayt'));
  ok('vasallık durum kartı ÇIKMADI', d.vasalBaslik===0, String(d.vasalBaslik));
  ok('hegemonya bölümü ÇIKMADI', d.hegBaslik===0, String(d.hegBaslik));
  ok('isyan düğmesi ÇIKMADI', d.revolt===0, String(d.revolt));
  ok('oyun verisi değişmedi', d.veri==='AYNI', d.veri);
}

/* ═══ E. SENARYO 2 — PERKSİZ OYUNCU VASAL (ESKİ ERİŞİLEBİLİRLİK HATASI) ═══ */
console.log('\nE. SENARYO 2 — PERKSİZ OYUNCU VASAL');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar';",
    "e.vassalAnger=48; e.vassalPaid=13.5;",
    "e.contact[lord.id]=true;",
    "var perk=perksOf(e).length;",
    "var LI=vassalLoyaltyInfo(e);",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perk, lord:lord.name, tur:VASSAL_TYPES.haracguzar.n,",
    "  kart:(html.match(/VASALLIK DURUMU/g)||[]).length,",
    "  vasalisin:(html.match(/DEVLET[İI]N[İI]N VASALISIN/g)||[]).length,",
    "  lordGoruntu:html.split(esc(lord.name)).length-1,",
    "  turGoruntu:html.indexOf(VASSAL_TYPES.haracguzar.n)>=0,",
    "  turAcik:html.indexOf(VASSAL_TYPES.haracguzar.d.slice(0,30))>=0,",
    "  arzu:html.indexOf('48/100')>=0,",
    "  sadakatDurum:LI?html.indexOf(LI.durum)>=0:false,",
    "  sadakatYon:LI?html.indexOf(LI.yon)>=0:false,",
    "  sonVergi:html.indexOf('13.5')>=0,",
    "  revolt:(html.match(/data-a=\"revolt\"/g)||[]).length,",
    "  liDurum:LI?LI.durum:null});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki yok (hata senaryosu geçerli)', d.perk===0, 'perk='+d.perk);
  ok('durum kartı TAM BİR KEZ görünüyor', d.kart===1, String(d.kart));
  ok('"...DEVLETİNİN VASALISIN" tam bir kez', d.vasalisin===1, String(d.vasalisin));
  ok('SENYÖR ADI görünüyor (eski hata: görünmüyordu)',
     d.lordGoruntu>=1, d.lord+' ×'+d.lordGoruntu);
  ok('vasal TÜRÜ görünüyor', d.turGoruntu===true, d.tur);
  ok('vasal türü AÇIKLAMASI görünüyor', d.turAcik===true);
  ok('bağımsızlık arzusu 48/100 görünüyor', d.arzu===true);
  ok('sadakat DURUMU görünüyor', d.sadakatDurum===true, d.liDurum||'');
  ok('sadakat YÖNÜ görünüyor', d.sadakatYon===true);
  ok('son vergi bilgisi görünüyor', d.sonVergi===true, '13.5');
  ok('bağımsızlık düğmesi görünüyor (eski hata: yoktu)',
     d.revolt===1, String(d.revolt));
}

/* ═══ F. SENARYO 3 — ÖFKE 54: DÜĞME KİLİTLİ ═══ */
console.log('\nF. SENARYO 3 — ÖFKE 54 (KİLİTLİ)');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar'; e.vassalAnger=54;",
    "e.contact[lord.id]=true;",
    "var html=String(UI.p_imp()||'');",
    "var kilitli=/<button class=\"abtn dis\"[^>]*data-a=\"revolt\"/.test(html);",
    "var aktif=/<button class=\"abtn dgr\"[^>]*data-a=\"revolt\"/.test(html);",
    "/* playerRevolt sayacı */",
    "var sayac=0, org=playerRevolt;",
    "globalThis.playerRevolt=function(){ sayac++; return org.apply(null,arguments); };",
    "var vasalOnce=isVassal(e), savasOnce=!!(e.war&&e.war[lord.id]);",
    "UI.act('revolt');",
    "var vasalSonra=isVassal(e), savasSonra=!!(e.war&&e.war[lord.id]);",
    "globalThis.playerRevolt=org;",
    "return JSON.stringify({kilitli:kilitli, aktif:aktif, cagri:sayac,",
    "  vasalOnce:vasalOnce, vasalSonra:vasalSonra,",
    "  savasOnce:savasOnce, savasSonra:savasSonra});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('düğme KİLİTLİ (dis) sınıfıyla çizildi', d.kilitli===true);
  ok('düğme aktif (dgr) DEĞİL', d.aktif===false);
  ok('öfke 54\'te isyan GERÇEKLEŞMEDİ — hâlâ vasal',
     d.vasalOnce===true && d.vasalSonra===true);
  ok('öfke 54\'te savaş ilan EDİLMEDİ',
     d.savasOnce===false && d.savasSonra===false);
}

/* ═══ G. SENARYO 4 — ÖFKE 55+: TEK DOKUNUŞ = TEK ÇAĞRI ═══ */
console.log('\nG. SENARYO 4 — ÖFKE 55 VE ÜZERİ (AKTİF)');
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar'; e.vassalAnger=55;",
    "e.contact[lord.id]=true;",
    "var html=String(UI.p_imp()||'');",
    "var aktif=/<button class=\"abtn dgr\"[^>]*data-a=\"revolt\"/.test(html);",
    "var dugmeSayisi=(html.match(/data-a=\"revolt\"/g)||[]).length;",
    "var sayac=0, org=playerRevolt;",
    "globalThis.playerRevolt=function(){ sayac++; return org.apply(null,arguments); };",
    "UI.act('revolt');",
    "var cagri1=sayac;",
    "var vasalSonra=isVassal(e), savasSonra=!!(e.war&&e.war[lord.id]);",
    "globalThis.playerRevolt=org;",
    "return JSON.stringify({aktif:aktif, dugmeSayisi:dugmeSayisi, cagri:cagri1,",
    "  vasalSonra:vasalSonra, savasSonra:savasSonra});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('öfke 55\'te düğme AKTİF (dgr)', d.aktif===true);
  ok('ekranda TEK isyan düğmesi var (çift handler yok)',
     d.dugmeSayisi===1, String(d.dugmeSayisi));
  ok('tek dokunuş TAM BİR playerRevolt() çağrısı üretti',
     d.cagri===1, String(d.cagri)+' çağrı');
  ok('isyan başarılı — vasallık koptu', d.vasalSonra===false);
  ok('senyöre TEK savaş ilan edildi', d.savasSonra===true);
}
/* Çift savaş ilanı olmadığını ayrıca doğrula */
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar'; e.vassalAnger=80;",
    "e.contact[lord.id]=true;",
    "var sayac=0, org=playerRevolt;",
    "globalThis.playerRevolt=function(){ sayac++; return org.apply(null,arguments); };",
    "UI.act('revolt');",
    "var ilk=sayac, savas1=!!(e.war&&e.war[lord.id]);",
    "/* ikinci dokunuş: artık vasal değil → yeni savaş açılmamalı */",
    "UI.act('revolt');",
    "var ikinci=sayac, savas2=!!(e.war&&e.war[lord.id]);",
    "globalThis.playerRevolt=org;",
    "return JSON.stringify({ilk:ilk, ikinci:ikinci, savas1:savas1, savas2:savas2,",
    "  hala:isVassal(e)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('ikinci dokunuş yeni bir isyan BAŞLATMADI',
     d.ilk===1 && d.ikinci===2 && d.hala===false,
     'çağrı '+d.ilk+'→'+d.ikinci);
  ok('savaş durumu ikinci dokunuşta bozulmadı',
     d.savas1===true && d.savas2===true);
}

/* ═══ H. SENARYO 5 — ÜÇ FARKLI TÜRDE VASAL ═══ */
console.log('\nH. SENARYO 5 — ÜÇ FARKLI TÜRDE VASAL');
{
  const H=harness(); H.R(KUR_PERK);
  const r=H.R([
    "var e=G.p;",
    "delete e.overlord; delete e.vassalType;",
    "var tip=['haracguzar','bekci','akademik'], ad=[], kur=[];",
    "for (var i=0;i<3;i++){",
    "  var v=G.emps[i+2]; if(!v) continue;",
    "  v.overlord=e.id; v.vassalType=tip[i]; v.vassalAnger=(i===0?70:20);",
    "  v.vassalPaid=0; delete v.vassalSci;",
    "  if(tip[i]==='haracguzar'){ v.vassalPaid=9.5; }",
    "  if(tip[i]==='akademik'){ v.vassalPaid=4.4; v.vassalSci=4.4; }",
    "  ad.push(v.name); kur.push(tip[i]);",
    "}",
    "var cap=vassalCapBonus(e), hw=hegemonyWeight(e);",
    "var html=String(UI.p_imp()||'');",
    "var tekrar={}; ad.forEach(function(n){ tekrar[n]=html.split(esc(n)).length-1; });",
    "return JSON.stringify({ad:ad, kur:kur, tekrar:tekrar, cap:cap, hw:hw,",
    "  perk:perksOf(e).length,",
    "  hegBaslik:(html.match(/HEGEMONYA — VASALLARIN/g)||[]).length,",
    "  sayiBaslik:html.indexOf('VASALLARIN (3)')>=0,",
    "  haracAd:(html.match(new RegExp(VASSAL_TYPES.haracguzar.n,'g'))||[]).length,",
    "  bekciAd:(html.match(new RegExp(VASSAL_TYPES.bekci.n,'g'))||[]).length,",
    "  akadAd:(html.match(new RegExp(VASSAL_TYPES.akademik.n,'g'))||[]).length,",
    "  vergiSatir:(html.match(/Aylık vergi geliri/g)||[]).length,",
    "  vergiDeger:html.indexOf('>9.5<')>=0,",
    "  arasSatir:(html.match(/Aylık araştırma aktarımı/g)||[]).length,",
    "  arasDeger:html.indexOf('>4.4<')>=0,",
    "  capSatir:(html.match(/Bekçi filo kapasitesi/g)||[]).length,",
    "  capDeger:html.indexOf('+'+cap+'<')>=0,",
    "  konseySatir:(html.match(/Konsey oy ağırlığı katkısı/g)||[]).length,",
    "  riskUyari:(html.match(/isyan riski/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('oyuncunun perki VAR (eski yolla da görünürdü)', d.perk>0, 'perk='+d.perk);
  ok('üç vasal da kuruldu', (d.ad||[]).length===3, (d.kur||[]).join(','));
  (d.ad||[]).forEach(n=>ok('vasal TAM BİR KEZ listelendi: '+n,
     d.tekrar[n]===1, '×'+d.tekrar[n]));
  ok('hegemonya başlığı tam bir kez', d.hegBaslik===1, String(d.hegBaslik));
  ok('başlıkta vasal sayısı (3) doğru', d.sayiBaslik===true);
  ok('Haraçgüzar türü tam bir kez yazıldı', d.haracAd===1, String(d.haracAd));
  ok('Sınır Bekçisi türü tam bir kez yazıldı', d.bekciAd===1, String(d.bekciAd));
  ok('Akademik Vasal türü tam bir kez yazıldı', d.akadAd===1, String(d.akadAd));
  ok('haraca bağlı ÖDEME doğru kaynaktan (vassalPaid=9.5)',
     d.vergiSatir===1 && d.vergiDeger===true);
  ok('akademik ARAŞTIRMA doğru kaynaktan (vassalSci=4.4)',
     d.arasSatir===1 && d.arasDeger===true);
  ok('bekçi KAPASİTE katkısı doğru kaynaktan (vassalCapBonus)',
     d.capSatir===1 && d.capDeger===true, '+'+d.cap);
  ok('toplamlar YALNIZ BİR KEZ gösterildi',
     d.vergiSatir===1 && d.arasSatir===1 && d.capSatir===1);
  ok('riskli vasal için uyarı çıktı (öfke 70)', d.riskUyari===1, String(d.riskUyari));
}
/* Konsey AÇIKKEN oy ağırlığı katkısı gerçekten çizilmeli — ve yalnız bir kez */
{
  const H=harness(); H.R(KUR_PERK);
  const r=H.R([
    "var e=G.p; delete e.overlord; delete e.vassalType;",
    "var tip=['haracguzar','bekci','akademik'], uye=[e.id];",
    "for (var i=0;i<3;i++){ var v=G.emps[i+2]; if(!v) continue;",
    "  v.overlord=e.id; v.vassalType=tip[i]; v.vassalAnger=20;",
    "  v.vassalPaid=(i===0?9.5:i===2?4.4:0); if(i===2) v.vassalSci=4.4;",
    "  uye.push(v.id); }",
    "G.council={name:'Test Konseyi', founder:e.id, members:uye, laws:{},",
    "  targeted:{}, treasury:0, president:e.id, termStart:G.day, terms:{},",
    "  voteIn:12, vote:null, dead:false};",
    "var hw=hegemonyWeight(e);",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({hw:hw, konseyVar:councilExists(),",
    "  satir:(html.match(/Konsey oy ağırlığı katkısı/g)||[]).length,",
    "  deger:html.indexOf('+'+hw.toFixed(1)+'<')>=0,",
    "  vergiSatir:(html.match(/Aylık vergi geliri/g)||[]).length,",
    "  arasSatir:(html.match(/Aylık araştırma aktarımı/g)||[]).length,",
    "  capSatir:(html.match(/Bekçi filo kapasitesi/g)||[]).length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('konsey kuruldu ve hegemonya ağırlığı > 0',
     d.konseyVar===true && d.hw>0, 'hw='+(d.hw||0).toFixed(2));
  ok('konsey oy ağırlığı katkısı TAM BİR KEZ gösterildi',
     d.satir===1, String(d.satir));
  ok('konsey ağırlığı doğru değerle gösterildi', d.deger===true);
  ok('toplamların hepsi konseyle birlikte de tek satır',
     d.vergiSatir===1 && d.arasSatir===1 && d.capSatir===1);
}
/* Perksiz oyuncu da vasallarını görmeli */
{
  const H=harness(); H.R(KUR_NOTR);
  const r=H.R([
    "var e=G.p; delete e.overlord;",
    "var v=G.emps[2]; v.overlord=e.id; v.vassalType='bekci'; v.vassalAnger=10;",
    "var html=String(UI.p_imp()||'');",
    "return JSON.stringify({perk:perksOf(e).length,",
    "  heg:(html.match(/HEGEMONYA — VASALLARIN/g)||[]).length,",
    "  ad:html.split(esc(v.name)).length-1});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('PERKSİZ oyuncu da vasallarını görüyor',
     d.perk===0 && d.heg===1 && d.ad===1,
     'perk='+d.perk+' heg='+d.heg+' ad×'+d.ad);
}

/* ═══ I. RENDER SAFİYETİ ═══ */
console.log('\nI. RENDER SAFİYETİ');
{
  const H=harness(); H.R(KUR_PERK);
  const r=H.R([
    "var e=G.p, lord=G.emps[1];",
    "e.overlord=lord.id; e.vassalType='haracguzar'; e.vassalAnger=44; e.vassalPaid=7.2;",
    "e.contact[lord.id]=true;",
    "var tip=['haracguzar','bekci','akademik'];",
    "for (var i=0;i<3;i++){ var v=G.emps[i+3]; if(!v) continue;",
    "  v.overlord=e.id; v.vassalType=tip[i]; v.vassalAnger=30+i*10;",
    "  v.vassalPaid=(i===0?6:i===2?3.3:0); if(i===2) v.vassalSci=3.3; }",
    "var once=serialize();",
    "var oncKaynak=JSON.stringify(e.res), oncOfke=e.vassalAnger,",
    "    oncSenyor=e.overlord, oncTur=e.vassalType,",
    "    oncSavas=JSON.stringify(e.war||{}), oncRel=JSON.stringify(e.rel||{}),",
    "    oncVasal=G.emps.map(function(x){return x.id+':'+x.overlord+':'+x.vassalType;}).join(',');",
    "for (var k=0;k<40;k++) String(UI.p_imp()||'');",
    "var sonra=serialize();",
    "var sonKaynak=JSON.stringify(e.res), sonOfke=e.vassalAnger,",
    "    sonSenyor=e.overlord, sonTur=e.vassalType,",
    "    sonSavas=JSON.stringify(e.war||{}), sonRel=JSON.stringify(e.rel||{}),",
    "    sonVasal=G.emps.map(function(x){return x.id+':'+x.overlord+':'+x.vassalType;}).join(',');",
    "function norm(t){var d=JSON.parse(t),L=d.emps||[];",
    "  for(var i=0;i<L.length;i++){delete L[i]._pers;delete L[i]._persAt;delete L[i]._prof;}",
    "  /* FAZ 85A: council artik kayitta. pariahMap() `pariahs` alanini",
    "     TEMBEL uretir (targeted.parya'dan turetilir) — personaOf()",
    "     onbellegiyle ayni sinif, gercek oyun verisi degil. */",
    "  if(d.world&&d.world.council) delete d.world.council.pariahs;",
    "  return JSON.stringify(d);}",
    "return JSON.stringify({",
    "  birebir:(once===sonra),",
    "  veriAyni:(norm(once)===norm(sonra)),",
    "  hamFark:Math.abs(once.length-sonra.length),",
    "  kaynak:(oncKaynak===sonKaynak), ofke:(oncOfke===sonOfke),",
    "  senyor:(oncSenyor===sonSenyor), tur:(oncTur===sonTur),",
    "  savas:(oncSavas===sonSavas), rel:(oncRel===sonRel),",
    "  vasal:(oncVasal===sonVasal)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('40 render sonrası KAYNAKLAR değişmedi', d.kaynak===true);
  ok('40 render sonrası VASALLIK İLİŞKİSİ değişmedi', d.vasal===true);
  ok('40 render sonrası ÖFKE değişmedi', d.ofke===true);
  ok('40 render sonrası SENYÖR değişmedi', d.senyor===true);
  ok('40 render sonrası VASAL TÜRÜ değişmedi', d.tur===true);
  ok('40 render sonrası DİPLOMASİ (rel) değişmedi', d.rel===true);
  ok('40 render sonrası SAVAŞ durumu değişmedi', d.savas===true);
  /* Faz 84A'da belgelenen personaOf() önbelleği: BU FAZDA DÜZELTİLMİYOR.
     Ham fark ayrı gösterilir, gerçek oyun verisi mutasyonuyla karıştırılmaz. */
  ok('40 render sonrası OYUN VERİSİ değişmedi',
     d.birebir===true || d.veriAyni===true,
     d.birebir ? 'birebir'
       : 'oyun verisi aynı · yalnız personaOf() önbelleği '+d.hamFark+
         'B (Faz 84A\'da belgelendi, kapsam dışı)');
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
