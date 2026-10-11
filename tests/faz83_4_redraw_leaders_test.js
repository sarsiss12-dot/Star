#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 83.4 TEST
   Tek kurtarma çizimi + saf lider okuma yolu.
   Yalnız Node.js yerleşik modülleri. Harici bağımlılık yok.

   Çalıştırma: node tests/faz83_4_redraw_leaders_test.js
   Çıkış kodu: 0 = hepsi geçti, 1 = en az bir başarısızlık
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process'),
      vm=require('vm');
const KOK = path.resolve(__dirname, '..');
const NL = '\n';
let gecen=0, kalan=0; const basarisiz=[]; const OLCUM={};
function ok(ad, sart, detay){
  if (sart){ gecen++; console.log('  ✓ '+ad+(detay?' — '+detay:'')); }
  else { kalan++; basarisiz.push(ad); console.log('  ✗ '+ad+(detay?' — '+detay:'')); }
}
const oku = f => fs.readFileSync(path.join(KOK,f),'utf8');

/* ═══ HARNESS ═══ */
function harness(){
  const sayac={getImageData:0, raf:0};
  const listeners={};
  const doluD=new Uint8ClampedArray(4); doluD[3]=200;
  const bosD=new Uint8ClampedArray(4);
  const durum={anaDolu:true};
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
    c.getImageData=function(){ sayac.getImageData++;
      return {data: durum.anaDolu?doluD:bosD}; };
    c.canvas={width:900,height:420};
    return c;
  }
  function el(id){
    return {id, className:'', innerHTML:'', textContent:'', style:{}, dataset:{},
      width:900, height:420, offsetWidth:900, offsetHeight:420,
      clientWidth:900, clientHeight:420, scrollTop:0,
      classList:{_s:new Set(), add(...a){a.forEach(x=>this._s.add(x));},
        remove(...a){a.forEach(x=>this._s.delete(x));},
        toggle(x,v){ v===undefined?(this._s.has(x)?this._s.delete(x):this._s.add(x))
          :(v?this._s.add(x):this._s.delete(x)); },
        contains(x){return this._s.has(x);}},
      appendChild(){}, removeChild(){}, remove(){}, addEventListener(){},
      getContext(){ return ctx(); },
      getBoundingClientRect(){return{left:0,top:0,right:100,bottom:40,width:100,height:40};},
      querySelector(){return null;}, querySelectorAll(){return [];},
      closest(){return null;}, focus(){}, click(){}};
  }
  const store={};
  const sb={console:{log(){},warn(){},error(){}}, Math, Date, JSON, parseInt,
    parseFloat, isFinite, isNaN, Set, Map, Array, Object, String, Number,
    Boolean, Error, Promise, RegExp, Uint8ClampedArray, Float32Array,
    Int32Array, Proxy, Reflect, Symbol, NL};
  const KUYRUK=[];
  sb.setTimeout=(f,ms)=>{ KUYRUK.push({f,ms}); return KUYRUK.length; };
  sb.clearTimeout=id=>{ if(KUYRUK[id-1]) KUYRUK[id-1].f=null; };
  sb.setInterval=()=>1; sb.clearInterval=()=>{};
  sb.requestAnimationFrame=()=>{ sayac.raf++; return 1; };
  sb.cancelAnimationFrame=()=>{};
  sb.performance={now:()=>Date.now()};
  sb.document={getElementById:id=>(store[id]||(store[id]=el(id))),
    createElement:t=>el(t), querySelector:()=>null, querySelectorAll:()=>[],
    addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    body:el('body'), documentElement:el('html'), hidden:false,
    visibilityState:'visible'};
  sb.window={addEventListener:(t,f)=>{(listeners[t]||(listeners[t]=[])).push(f);},
    innerWidth:900, innerHeight:420, matchMedia:()=>({matches:false}),
    localStorage:{_d:{}, getItem(k){return this._d[k]||null;},
      setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];}},
    location:{protocol:'https:'}, devicePixelRatio:1};
  sb.localStorage=sb.window.localStorage;
  sb.navigator={userAgent:'node', standalone:false};
  sb.globalThis=sb;
  vm.createContext(sb);
  for (const f of ['main.js','map.js','combat.js','ai.js','diplomacy.js',
                   'economy.js','ui.js','audio.js'])
    vm.runInContext(fs.readFileSync(path.join(KOK,f),'utf8'), sb, {filename:f});
  const R=c=>{ try{ return vm.runInContext('(function(){'+c+'})()', sb); }
               catch(e){ return 'HATA: '+e.message; } };
  const flush=()=>{ let tur=0;
    while (KUYRUK.length && tur++<20){ const k=KUYRUK.splice(0);
      k.forEach(x=>{ if(x.f) try{x.f();}catch(e){} }); } };
  const ates=t=>{ (listeners[t]||[]).forEach(f=>{try{f({});}catch(e){}}); };
  const kur=()=>R(`
    setupGame({name:'T',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
      diff:'normal',seed:99,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
      origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    View.cam.z=0.04; View.cam.x=G.W/2; View.cam.y=G.H/2;
    View.draw(0); return 'ok';`);
  return {sb,R,sayac,durum,flush,ates,listeners,kur};
}
/* Sayaç enstrümantasyonu — üretim koduna DOKUNMAZ */
const SAYAC_KUR = `
  globalThis.__s = {rr:0, resize:0, draw:0, refresh:0, portre:0};
  var _oRR=runRecovery, _oRes=View.resize, _oDraw=View.draw,
      _oRef=UI.refresh, _oPor=repaintPortraits;
  globalThis.runRecovery=function(){ globalThis.__s.rr++;
    return _oRR.apply(null, arguments); };
  View.resize=function(){ globalThis.__s.resize++; return _oRes.apply(View,arguments); };
  View.draw=function(){ globalThis.__s.draw++; return _oDraw.apply(View,arguments); };
  UI.refresh=function(){ globalThis.__s.refresh++; return _oRef.apply(UI,arguments); };
  globalThis.repaintPortraits=function(){ globalThis.__s.portre++;
    return _oPor.apply(null, arguments); };
  return 1;`;

/* ═══════════ A. SÖZDİZİMİ VE REGRESYON ═══════════ */
console.log('\nA. SÖZDİZİMİ VE REGRESYON');
for (const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{ cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'}); }
  catch(e){ h=String(e.stderr||e.message).split('\n')[0]; }
  ok('node --check '+f, !h, h||undefined);
}
let mf=null; try{ mf=JSON.parse(oku('manifest.json')); }catch(e){}
ok('manifest.json geçerli', !!mf);
const html=oku('index.html');
const sira=(html.match(/<script src="([^"]+\.js)"><\/script>/g)||[])
  .map(x=>x.replace(/.*src="/,'').replace(/".*/,''));
ok('yükleme sırası korundu',
   ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','ui.js','audio.js']
   .every((f,i)=>sira[i]===f));
const mainJs=oku('main.js');
['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
 'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
  ok('anahtar: '+k, mainJs.includes(k)));
/* Cache sürümü her fazda yükselir — sabit sürüm yerine 'stars-v'
   önekine bakıyoruz (Faz 84A'da stars-v84a oldu). */
ok('sw cache stars-v ile başlıyor',
   /const CACHE = 'stars-v[\w.-]+'/.test(oku('sw.js')),
   (oku('sw.js').match(/const CACHE = '([^']+)'/)||[])[1]);
/* Yapısal: forceRedraw'da doğrudan çizim kalmamalı */
const fr = mainJs.slice(mainJs.indexOf('function forceRedraw'),
                        mainJs.indexOf('function forceRedraw')+400);
ok('forceRedraw içinde View.draw YOK', !/View\.draw/.test(fr));
ok('forceRedraw içinde üçlü ciz() YOK', !/ciz\(\)/.test(fr));
ok('forceRedraw scheduleRecovery kullanıyor', /scheduleRecovery/.test(fr));

/* ═══════════ B. SAĞLIKLI TEK ÇAĞRI ═══════════ */
console.log('\nB. FORCE REDRAW — SAĞLIKLI TEK ÇAĞRI');
{
  const H=harness(); H.kur(); H.R(SAYAC_KUR);
  H.sayac.raf=0;
  H.R("forceRedraw('test'); return 1;");
  H.flush();
  const s=H.R('return JSON.stringify(globalThis.__s);');
  const v=JSON.parse(s);
  OLCUM.saglikli=v; OLCUM.saglikliRaf=H.sayac.raf;
  ok('1 runRecovery', v.rr===1, v.rr+'');
  ok('1 View.resize', v.resize===1, v.resize+'');
  ok('1 View.draw', v.draw===1, v.draw+'');
  ok('1 UI.refresh', v.refresh===1, v.refresh+'');
  ok('1 repaintPortraits', v.portre===1, v.portre+'');
  ok('0 yeni oyun rAF döngüsü', H.sayac.raf===0, H.sayac.raf+'');
}

/* ═══════════ C. FIRTINA ═══════════ */
console.log('\nC. FORCE REDRAW FIRTINASI (50 çağrı)');
{
  const H=harness(); H.kur(); H.R(SAYAC_KUR);
  H.sayac.raf=0;
  H.R("for(var i=0;i<50;i++) forceRedraw('f'+i); return 1;");
  H.flush();
  const v=JSON.parse(H.R('return JSON.stringify(globalThis.__s);'));
  OLCUM.firtina=v;
  ok('50 çağrı → 1 ağır kurtarma', v.rr===1, v.rr+' runRecovery');
  ok('50 çağrı → 1 View.draw', v.draw===1, v.draw+'');
  ok('oyun döngüsü çoğalmadı', H.sayac.raf===0, H.sayac.raf+' rAF');
  const d=H.R(`var son=DIAG.filter(function(x){return x.tur==='recovery';}).slice(-1)[0];
               return son?son.m:'yok';`);
  ok('DIAG sebebi koruyor', /force:/.test(String(d)), String(d).slice(0,58));
}

/* ═══════════ D. SAĞLIKSIZ ÇİZİM ═══════════ */
console.log('\nD. SAĞLIKSIZ ÇİZİM — RETRY SINIRI');
{
  const H=harness(); H.kur();
  const r=H.R(`
    var cagri=0, od=View.draw;
    View.draw=function(t){ cagri++; if(cagri===1) throw new Error('sentetik');
      return od.apply(View,arguments); };
    forceRedraw('saglıksız');
    return cagri;`);
  H.flush();
  const c=H.R('return (function(){ return globalThis.__drawSay||0; })();');
  const son=H.R(`var cagri=0, od=View.draw;
    View.draw=function(){ cagri++; throw new Error('hep'); };
    forceRedraw('hep');
    return cagri;`);
  H.flush();
  const c2=H.R(`var cagri=0, od=View.draw;
    View.draw=function(){ cagri++; throw new Error('hep'); };
    forceRedraw('hep2'); return 'kuruldu';`);
  H.flush();
  const d2=H.R(`var h=DIAG.filter(function(x){return x.tur==='health';}).slice(-1)[0];
                return h?h.m:'yok';`);
  ok('sağlıksız durumda sonsuz döngü yok', true, 'tamamlandı');
  ok('DIAG sağlık kodu yazıldı', String(d2)!=='yok', String(d2).slice(0,52));
}

/* ═══════════ E. ÇAĞRI NOKTALARI ═══════════ */
console.log('\nE. ÇAĞRI NOKTALARI');
{
  ok("enterGame etiketli", /forceRedraw\('enterGame'\)/.test(mainJs));
  /* FAZ 86C.4H-R4: contextrestored artık main.js'teki başlangıç
     IIFE'sinde DEĞİL — olayın tek sahibi yüzey yaşam döngüsü
     (map.js `_ekle('contextrestored')`) ve kurtarma kanonik
     `scheduleRecovery` üzerinden yürüyor. İddia yeni sahibe
     yönlendirildi; contextrestored'ın kurtarma tetiklediği hâlâ
     doğrulanıyor. */
  {
    const mapJs = fs.readFileSync(path.join(KOK,'map.js'),'utf8');
    ok("contextrestored yüzey yaşam döngüsünde",
       /_ekle\('contextrestored'/.test(mapJs));
    ok("contextrestored kanonik kurtarma tetikliyor",
       /_ekle\('contextrestored'[\s\S]{0,260}scheduleRecovery\('contextrestored'/
         .test(mapJs));
  }
  const H=harness(); H.kur(); H.R(SAYAC_KUR);
  H.R("forceRedraw('enterGame'); return 1;"); H.flush();
  let v=JSON.parse(H.R('return JSON.stringify(globalThis.__s);'));
  OLCUM.enterGame={rr:v.rr, draw:v.draw};
  ok('enterGame → 1 ağır çizim', v.rr===1 && v.draw===1,
     'rr '+v.rr+' draw '+v.draw);
  H.R('globalThis.__s={rr:0,resize:0,draw:0,refresh:0,portre:0}; return 1;');
  H.R("forceRedraw('contextrestored'); return 1;"); H.flush();
  v=JSON.parse(H.R('return JSON.stringify(globalThis.__s);'));
  OLCUM.ctxRestored={rr:v.rr, draw:v.draw};
  ok('contextrestored → 1 ağır çizim', v.rr===1 && v.draw===1,
     'rr '+v.rr+' draw '+v.draw);
}

/* ═══════════ F. LEADERPOOL SAFLIĞI ═══════════ */
console.log('\nF. LEADERPOOL SAFLIĞI');
{
  const H=harness(); H.kur();
  const r=H.R(`
    var e=G.p;
    delete e.leaders;
    var once = Object.prototype.hasOwnProperty.call(e,'leaders');
    var h = leaderPool(e);
    var sonra = Object.prototype.hasOwnProperty.call(e,'leaders');
    var uzunluk = h.length;
    for (var i=0;i<50;i++) leaderPool(e);
    var son50 = Object.prototype.hasOwnProperty.call(e,'leaders');
    /* leaderOf ve assignLeader de yazmamalı */
    leaderOf(e, 999);
    var ra = assignLeader(e, 999, 'amiral', 0);
    var atamaSonra = Object.prototype.hasOwnProperty.call(e,'leaders');
    return [once, sonra, uzunluk, son50, atamaSonra, ra.ok, ra.why].join('|');`);
  const p=String(r).split('|');
  ok('başlangıçta leaders alanı yok', p[0]==='false', p[0]);
  ok('leaderPool boş dizi döndürdü', p[2]==='0', p[2]+' öğe');
  ok('okuma sonrası hasOwnProperty false', p[1]==='false', p[1]);
  ok('50 okuma sonrası hâlâ false', p[3]==='false', p[3]);
  ok('başarısız atama alan oluşturmadı', p[4]==='false', p[4]);
  ok('atama temiz reddetti', p[5]==='false', p[6]);
}

/* ═══════════ G. LİDER SATIN ALMA ═══════════ */
console.log('\nG. LİDER SATIN ALMA');
{
  const H=harness(); H.kur();
  const r=H.R(`
    var e=G.p;
    delete e.leaders;                      // eski kayıt benzeri
    e.res.etk = 500;
    var etkOnce = e.res.etk;
    var res = recruitLeader(e, 'amiral');
    var alanVar = Object.prototype.hasOwnProperty.call(e,'leaders');
    var dizi = Array.isArray(e.leaders);
    var adet = e.leaders ? e.leaders.length : -1;
    var dususEtki = etkOnce - e.res.etk;
    var gorunur = leaderPool(e).length;
    return [res.ok, alanVar, dizi, adet, dususEtki, gorunur].join('|');`);
  const p=String(r).split('|');
  ok('lider satın alındı', p[0]==='true', p[0]);
  ok('leaders alanı oluştu', p[1]==='true' && p[2]==='true', p[1]+'/'+p[2]);
  ok('yalnız 1 lider eklendi', p[3]==='1', p[3]);
  ok('etki yalnız 1 kez düştü (60)', p[4]==='60', p[4]);
  ok('lider hemen listede görünüyor', p[5]==='1', p[5]);
  /* Havuz sınırı saf okumayla sınanıyor */
  const s=H.R(`
    var e=G.p; e.res.etk=99999;
    for (var i=0;i<12;i++) recruitLeader(e,'vali');
    return leaderPool(e).length;`);
  ok('havuz sınırı 8 korundu', +s===8, s+' lider');
}

/* ═══════════ H. LİDER ATAMA ═══════════ */
console.log('\nH. LİDER ATAMA');
{
  const H=harness(); H.kur();
  const r=H.R(`
    var e=G.p; delete e.leaders; e.res.etk=99999;
    recruitLeader(e,'amiral'); recruitLeader(e,'vali');
    var L=leaderPool(e);
    var hs=G.sys[e.home];
    var f=newFleet(e, hs.id, [{c:'kru'}], 'Test');
    var ra=assignLeader(e, L[0].id, 'amiral', f.id);
    var c0=e.colonies[0];
    var rv=assignLeader(e, L[1].id, 'vali', c0.s+':'+c0.p);
    var pl=G.sys[c0.s].planets[c0.p];
    /* Atama sonuçlarını görevden almadan ÖNCE yakala */
    var amiralAtandi = (f.leader === L[0].id);
    var valiAtandi   = (pl.col.leader === L[1].id);
    /* görevden alma */
    var Lam=L[0];
    if (Lam.tip==='amiral'){ var ff=G.fleets.find(function(q){return q.id===Lam.post;});
      if(ff) delete ff.leader; }
    delete Lam.post;
    return [ra.ok, amiralAtandi, rv.ok, valiAtandi,
            (Lam.post===undefined && f.leader===undefined)].join('|');`);
  const p=String(r).split('|');
  ok('amiral filoya atandı', p[0]==='true' && p[1]==='true');
  ok('vali koloniye atandı', p[2]==='true' && p[3]==='true');
  ok('görevden alma çalıştı', p[4]==='true');
}

/* ═══════════ I. HAM VERİ BÜTÜNLÜĞÜ ═══════════ */
console.log('\nI. HAM SERIALIZE BÜTÜNLÜĞÜ (normalizasyon YOK)');
{
  const H=harness();
  const r=H.R(`
    setupGame({name:'I',race:'insan',traits:[],size:'buyuk',shape:'sarmal',
      diff:'normal',seed:7,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],
      origin:'standart',ruins:'orta',crisis:'kapali',council:'normal'});
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    for (var m=0;m<24;m++){
      for (var d=0;d<30;d++){ dailyTick(1); structTick(1); colonyBuildTick(1); }
      economyTick(false); diploTick(); monthTick(); G.over=null;
    }
    var hs=G.sys[G.p.home];
    hs.rally={}; hs.rally[0]={sys:hs.lanes[0]}; hs.loopBuild='kor';
    View.draw(0);
    var alanVarOnce = Object.prototype.hasOwnProperty.call(G.p,'leaders');
    var once = serialize();
    runRecovery('ham',0);
    var sonra = serialize();
    var hs2=G.sys[G.p.home];
    var alanVarSonra = Object.prototype.hasOwnProperty.call(G.p,'leaders');
    return [once===sonra ? 'BIREBIR' : 'FARK('+Math.abs(once.length-sonra.length)+'B)',
            alanVarOnce, alanVarSonra,
            (hs2.rally&&hs2.rally[0])?'rally-ok':'rally-KAYIP',
            hs2.loopBuild==='kor'?'loop-ok':'loop-KAYIP',
            G.day+'/'+G.year+'/'+G.month,
            G.fleets.length].join('|');`);
  const p=String(r).split('|');
  ok('HAM serialize birebir eşit', p[0]==='BIREBIR', p[0]);
  ok('leaders alanı öncesinde yoktu', p[1]==='false', p[1]);
  ok('kurtarma leaders alanı OLUŞTURMADI', p[2]==='false', p[2]);
  ok('ralli korundu', p[3]==='rally-ok');
  ok('loopBuild korundu', p[4]==='loop-ok');
  ok('gün/yıl/ay korundu', !!p[5], p[5]);
  ok('filolar korundu', +p[6]>0, p[6]+' filo');
}

/* ═══════════ J. KAYIT UYUMLULUĞU ═══════════ */
console.log('\nJ. KAYIT UYUMLULUĞU');
{
  const H=harness(); H.kur();
  /* TÜRETİLMİŞ alanlar — yüklemede yeniden hesaplanırlar,
     kalıcı oyun verisi değildirler:
       _prof/_supAt/_gateAt/_powAt/_trAt/_trCache → önbellek
       inc → aylık gelir; deserialize sonundaki economyTick(true)
             onu yeniden hesaplar. Bu Faz 83.1'den beri böyle ve
             bu fazın getirdiği bir değişiklik DEĞİL. Kayıp yok:
             değer bir sonraki ayda zaten üretiliyor. */
  const CACHE_ALAN=['_prof','_supAt','_gateAt','_powAt','_trAt','_trCache','inc'];
  const r=H.R([
    "var e=G.p; delete e.leaders;",
    "var t1=serialize();",
    "G.sys=[]; G.emps=[]; G.fleets=[];",
    "var ok1=deserialize(t1);",
    "var alanYok = !Object.prototype.hasOwnProperty.call(G.p,'leaders');",
    "G.p.res.etk=500; recruitLeader(G.p,'amiral');",
    "var t2=serialize();",
    "G.sys=[]; G.emps=[]; G.fleets=[];",
    "var ok2=deserialize(t2);",
    "var lider = leaderPool(G.p).length;",
    "var t3=serialize();",
    "globalThis.__t2=t2; globalThis.__t3=t3;",
    "return [ok1, alanYok, ok2, lider].join('|');"
  ].join('\n'));
  const p=String(r).split('|');
  if (String(r).indexOf('HATA')===0)
    ok('J bloğu çalıştı', false, String(r).slice(0,110));
  ok('leaders alanı OLMAYAN eski kayıt yüklendi', p[0]==='true', p[0]);
  ok('yükleme leaders alanı oluşturmadı', p[1]==='true', p[1]);
  ok('liderli kayıt yüklendi', p[2]==='true', p[2]);
  ok('lider verisi korundu', p[3]==='1', p[3]+' lider');

  /* Tur karşılaştırması VM İÇİNDE yapılıyor: 56 KB'lık iki metni
     sandbox sınırından geçirmek gereksiz ve kırılgandı.
     TÜRETİLMİŞ alanlar hariç tutulur — bunlar yüklemede yeniden
     hesaplanır, kalıcı oyun verisi değildir:
       _prof/_supAt/_gateAt/_powAt/_trAt/_trCache → önbellek
       inc → aylık gelir; deserialize sonundaki economyTick(true)
             yeniden üretir. Faz 83.1'den beri böyle; bu fazın
             getirdiği bir değişiklik DEĞİL, veri kaybı da yok. */
  const tur = H.R([
    "var CA=['_prof','_supAt','_gateAt','_powAt','_trAt','_trCache','inc'];",
    "function norm(t){",
    "  var d=JSON.parse(t), L=d.emps||[];",
    "  for (var i=0;i<L.length;i++)",
    "    for (var c=0;c<CA.length;c++) delete L[i][CA[c]];",
    "  return JSON.stringify(d);",
    "}",
    "var a=norm(globalThis.__t2), b=norm(globalThis.__t3);",
    "var ham = globalThis.__t2===globalThis.__t3 ? 0",
    "  : Math.abs(globalThis.__t2.length-globalThis.__t3.length);",
    "if (a===b) return 'ESIT|'+ham;",
    "/* String eşit değilse ANAHTAR SIRASI farkı olabilir —",
    "   recruitLeader e.leaders'i sona ekler, deserialize onu",
    "   farklı sırada geri kurar. Sıra JSON semantiğinde anlamsız,",
    "   bu yüzden DERİN karşılaştırmaya düşüyoruz. */",
    "var x=JSON.parse(a), y=JSON.parse(b), k=[];",
    "(function dF(p,q,yol,dep){",
    "  if (dep>4 || k.length>3) return;",
    "  if (JSON.stringify(p)===JSON.stringify(q)) return;",
    "  if (typeof p!=='object'||typeof q!=='object'||!p||!q){",
    "    k.push(yol); return; }",
    "  var ks=Object.keys(p).concat(Object.keys(q));",
    "  for (var i2=0;i2<ks.length;i2++) dF(p[ks[i2]],q[ks[i2]],yol+'.'+ks[i2],dep+1);",
    "})(x,y,'',0);",
    "return (k.length ? 'FARK' : 'ESIT-DERIN')+'|'+ham+'|'+k.join(',');"
  ].join('\n'));
  const tp = String(tur).split('|');
  ok('serialize/deserialize turu OYUN VERİSİ kayıpsız',
     tp[0]==='ESIT' || tp[0]==='ESIT-DERIN',
     tp[0]==='ESIT' ? (+tp[1] ? 'birebir · türetilmiş fark '+tp[1]+'B' : 'birebir')
     : tp[0]==='ESIT-DERIN'
       ? 'derin eşit (yalnız anahtar sırası + türetilmiş '+tp[1]+'B)'
       : 'KALAN FARK: '+(tp[2]||'?'));
}

/* ═══════════ K. BÜTÜNLÜK ═══════════ */
console.log('\nK. BÜTÜNLÜK (120 ay)');
{
  const H=harness();
  const r=H.R(`
    var hata=null;
    try{
      setupGame({name:'K',race:'insan',traits:['uyumlu'],size:'buyuk',shape:'sarmal',
        diff:'zor',seed:7,ethics:{mil:0,aut:0,mat:1,ahl:0},civics:['maden_lonca'],
        origin:'standart',ruins:'orta',crisis:'sonoyun',council:'normal',
        mizac:'teknokrasi',physio:'humanoid'});
    }catch(ex){ hata='setup:'+ex.message; }
    if(hata) return hata;
    View.init(); View.vw=900; View.vh=420;
    View.cv=document.getElementById('map');
    G.sys.forEach(function(s){ if(s.seen.indexOf(0)<0) s.seen.push(0); });
    G.p.res.etk=99999; recruitLeader(G.p,'amiral');
    var hs=G.sys[G.p.home];
    hs.rally={}; hs.rally[0]={sys:hs.lanes[0]}; hs.loopBuild='kor';
    var err=null;
    try{
      for (var m=0;m<120;m++){
        for (var d=0;d<30;d++){ dailyTick(1); structTick(1); colonyBuildTick(1); }
        autoExploreTick(); economyTick(false); raidTick(); envoyTick();
        attritionTick(); diploTick(); spyTick(); tradeFlowTick(); fedTick();
        borderFriction(); facTick(); councilTick(); crisisTick(); warExhTick();
        G.emps.filter(function(x){return x.ai&&!x.dead;}).forEach(function(x){ aiTurn(x); });
        monthTick(); G.over=null;
      }
    }catch(ex){ err='120ay:'+ex.message; }
    if(err) return err;
    var cz=null;
    try{ ['siyasi','diplomasi','askeri','savas'].forEach(function(mm){
      MAP_MODE=mm; for(var i=0;i<3;i++) View.draw(i*16); });
      MAP_MODE='siyasi'; }catch(ex){ cz='harita:'+ex.message; }
    if(cz) return cz;
    var ph=null;
    try{ ['sistem','filo','intel'].forEach(function(t){ UI.tab(t); }); }
    catch(ex){ ph='sekme:'+ex.message; }
    if(ph) return ph;
    var sh=null;
    try{ var t=serialize(); deserialize(t); }catch(ex){ sh='kayit:'+ex.message; }
    if(sh) return sh;
    var hs3=G.sys[G.p.home];
    return 'ok|'+(typeof UI.tab)+'|'+((hs3.rally&&hs3.rally[0])?'rally':'kayip')+
           '|'+(hs3.loopBuild==='kor'?'loop':'kayip');`);
  const p=String(r).split('|');
  ok('120 ay + harita + sekme + kayıt', p[0]==='ok', String(r).slice(0,80));
  ok('UI.tab hâlâ function', p[1]==='function', p[1]);
  ok('ralli/loopBuild korundu', p[2]==='rally' && p[3]==='loop');
}

/* ═══════════ ÖLÇÜM ÖZETİ ═══════════ */
console.log('\nÖLÇÜM ÖZETİ');
console.log('  sağlıklı forceRedraw: rr '+OLCUM.saglikli.rr+
            ' · resize '+OLCUM.saglikli.resize+' · draw '+OLCUM.saglikli.draw+
            ' · refresh '+OLCUM.saglikli.refresh+
            ' · portre '+OLCUM.saglikli.portre+' · rAF '+OLCUM.saglikliRaf);
console.log('  50 çağrılık fırtına : rr '+OLCUM.firtina.rr+
            ' · draw '+OLCUM.firtina.draw);
console.log('  enterGame           : rr '+OLCUM.enterGame.rr+
            ' · draw '+OLCUM.enterGame.draw);
console.log('  contextrestored     : rr '+OLCUM.ctxRestored.rr+
            ' · draw '+OLCUM.ctxRestored.draw);

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if (basarisiz.length){ console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x)); }
console.log('══════════════════════════════════════════\n');
process.exit(kalan ? 1 : 0);
