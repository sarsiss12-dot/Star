#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   STARS — FAZ 85E: BİLDİRİM/KARAR KUYRUĞU SÜREKLİLİĞİ
                    + AI TEKLİF KİMLİĞİ + STATÜKO BARIŞI ROTASI
   Çalıştırma: node tests/faz85e_event_inbox_continuity_test.js
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
      firstElementChild:null,
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
 // 95C.1: inbox identity fixtures must be valid offers, including mutual contact.
 "G.emps.forEach(function(x){ if(x.id){ G.p.contact[x.id]=true; x.contact[0]=true; } });",
 "return 'ok';"].join('\n');

/* Kaydedilebilir HER kind'dan bir örnek üretir. */
const TUM_KINDLER=[
 "var ev=EVENTS[0], an=ANOMALIES[0];",
 "var sy=G.sys[3]; var o1=G.emps[1], o2=G.emps[2];",
 "var zincirId=Object.keys(CHAINS)[0];",
 "UI.notify({kind:'chain',   data:zincirId, ico:'c', title:'zincir', sub:'s'});",
 "UI.notify({kind:'event',   data:ev, ico:'e', title:'olay', sub:'s'});",
 "UI.notify({kind:'anomaly', data:{a:an, sys:sy}, ico:'a', title:'anom', sub:'s'});",
 "UI.notify({kind:'peace',   data:o1.id, ico:'p', title:'baris', sub:'s'});",
 "UI.notify({kind:'pact',    data:{from:o1.id,tur:'intel'}, ico:'k', title:'pakt', sub:'s'});",
 "UI.notify({kind:'submit',  data:{from:o2.id,tehdit:o1.id}, ico:'t', title:'tabi', sub:'s'});",
 "UI.notify({kind:'border',  data:{id:o2.id,len:7}, ico:'b', title:'sinir', sub:'s'});",
 "UI.notify({kind:'fedvote', data:4, ico:'f', title:'fedoy', sub:'s'});",
 "UI.notify({kind:'wardec',  data:o1.id, ico:'w', title:'savas', sub:'s'});",
 "UI.notify({kind:'facdem',  data:'mil', ico:'d', title:'fraksiyon', sub:'s'});",
 "UI.notify({kind:'faccoup', data:'darbe', ico:'g', title:'darbe', sub:'s'});",
 "UI.notify({kind:'criswarn',data:2225, ico:'!', title:'uyari', sub:'s'});",
 "UI.notify({kind:'crisis',  data:2, ico:'x', title:'kriz', sub:'s'});",
 "UI.notify({kind:'crisend', data:o1.id, ico:'y', title:'krizson', sub:'s'});",
 "UI.notify({kind:'cncvote', data:'ambargo', ico:'v', title:'konseyoy', sub:'s'});",
 "UI.notify({kind:'cncnew',  data:o1.id, ico:'n', title:'konsey', sub:'s'});",
 "UI.notify({kind:'sqOffer', data:o1.id, ico:'q', title:'statuko', sub:'s'});",
 "UI.aiOffer({from:o2.id,to:0,give:[{t:'res',r:'ene',v:100}],",
 "  want:[{t:'res',r:'min',v:50}]});"].join('\n');
/* notify 6 bildirim sınırı uygular; test için sınırı geçici genişletmek
   yerine kutuyu DOĞRUDAN kurup UID'leri elle veriyoruz. */
const KUTU_KUR=[
 "function ekle(it){ it.uid=(G.inboxUid=(G.inboxUid||0)+1); it.born=G.day;",
 "  G.inbox.push(it); }",
 "G.inbox=[]; G.inboxUid=0;"].join('\n');

/* ═══ A. SÖZDİZİMİ, DOSYA SINIRI, KARANTİNA ═══ */
console.log('\nA. SÖZDİZİMİ, DOSYA SINIRI VE KARANTİNA');
for(const f of fs.readdirSync(KOK).filter(x=>x.endsWith('.js'))){
  let h=null;
  try{cp.execFileSync(process.execPath,['--check',path.join(KOK,f)],{stdio:'pipe'});}
  catch(e){h=String(e.stderr||e.message).split('\n')[0];}
  ok('node --check '+f,!h,h||undefined);
}
{
  const mainJs=oku('main.js'), uiJs=oku('ui.js');
  ['yildiz:save','yh_audio','yh_advisor','yh_autoev','yh_bg','yh_radar',
   'yh_templates','__yh_probe','__yh_diag'].forEach(k=>
    ok('depolama anahtarı korundu: '+k, mainJs.includes(k)));
  ok("sw cache = 'stars-v95e2'", /const CACHE = 'stars-v95e2'/.test(oku('sw.js')));
  const sw=oku('sw.js');
  ok('sw KABUK listesi duruyor', /KABUK/.test(sw));
  ok('sw fetch davranışı duruyor', /addEventListener\('fetch'/.test(sw));
  ok('sw activate davranışı duruyor', /addEventListener\('activate'/.test(sw));
  ok('kayıt sürümü v:8 (Faz 85F ile yükseldi)', /v:8, cfg:G\.cfg/.test(mainJs));
  ['world: serializePoliticalWorld','threats: serializeCrisisWorld',
   'campaign: serializeCampaignWorld'].forEach(x=>
    ok('önceki bölüm korundu: '+x.split(':')[0], mainJs.indexOf(x)>=0));
  ok('events bölümü eklendi', /events: serializeEventsWorld\(\)/.test(mainJs));
  ok('chainQueue campaign içinde KALDI (events\'e kopyalanmadı)',
     /chainQueue: jsonSafeClone/.test(mainJs) &&
     mainJs.slice(mainJs.indexOf('function serializeEventsWorld'),
                 mainJs.indexOf('function resetEventsRuntimeState'))
       .indexOf('chainQueue')<0);
  /* Sıra */
  const ip=mainJs.indexOf('restorePoliticalWorld(d.world');
  const ic=mainJs.indexOf('restoreCrisisWorld(d.threats');
  const ik=mainJs.indexOf('restoreCampaignWorld(d.campaign');
  const ie=mainJs.indexOf('restoreEventsWorld(d.events');
  const ir=mainJs.indexOf('rebuildDerivedStateAfterLoad(true);', ie);
  const iec=mainJs.indexOf('economyTick(true);', ie);
  ok('restoreEventsWorld world/threats/campaign SONRASINDA',
     ie>ik && ik>ic && ic>ip && ip>0);
  ok('restoreEventsWorld rebuildDerivedStateAfterLoad ÖNCESİNDE', ir>ie);
  ok('restoreEventsWorld economyTick(true) ÖNCESİNDE', iec>ie);
  ok('setupGame merkezî resetEventsRuntimeState kullanıyor',
     /resetEventsRuntimeState\(\);/.test(mainJs));
  /* Beyaz liste ve yasaklı alanlar */
  ok('NOTE_FIELDS beyaz listesi tanımlı',
     /const NOTE_FIELDS = \['uid','kind','ico','cls','pause','title','sub','key','born'\]/.test(mainJs));
  ok('reset minNote/minRaw temizliyor',
     /delete G\.minNote; delete G\.minRaw;/.test(mainJs));
  const encBlok=mainJs.slice(mainJs.indexOf('function serializeEventsWorld'),
                             mainJs.indexOf('function resetEventsRuntimeState'));
  ['G.minRaw','G.minNote','innerHTML','_hook'].forEach(k=>
    ok('kayıt bloğunda yasaklı alan YOK: '+k, encBlok.indexOf(k)<0));
  /* sqOffer rotası ve teklif singleton'ı */
  ok("openNote'ta sqOffer case'i var", /case 'sqOffer': this\.sqOfferOpen/.test(uiJs));
  ok('sqOfferOpen üretim fonksiyonu var', /  sqOfferOpen\(fromId\)\{/.test(uiJs));
  ok('aiOffer artık teklifin TAMAMINI data\'da taşıyor',
     /this\.notify\(\{kind:'aideal', data:kendi/.test(uiJs));
  ok('aiDealOpen tekil pendingOffer\'dan OKUMUYOR',
     !/const offer = this\.pendingOffer;/.test(uiJs));
  ok('pendingOffer artık doğruluğun kaynağı değil (atama kalmadı)',
     (uiJs.match(/this\.pendingOffer = /g)||[]).length===0,
     String((uiJs.match(/this\.pendingOffer/g)||[]).length)+' referans');
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

/* ═══ B. ÜRETİCİ/TÜKETİCİ ROTA MATRİSİ ═══ */
console.log('\nB. ÜRETİCİ/TÜKETİCİ ROTA MATRİSİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "var kinds=['sqOffer','pact','submit','cncnew','cncvote','aideal',",
    "  'fedvote','chain','event','anomaly','peace','facdem','faccoup',",
    "  'criswarn','crisis','crisend','wardec','border'];",
    "var codecVar={}, tuketici={};",
    "kinds.forEach(function(k){",
    "  codecVar[k]=!!(NOTE_CODEC[k] || NOTE_EMP_KINDS.indexOf(k)>=0 ||",
    "    NOTE_NUM_KINDS.indexOf(k)>=0 || NOTE_STR_KINDS.indexOf(k)>=0); });",
    "/* Tüketici: openNote gerçekten bir açıcı çağırıyor mu? */",
    "var acildi=null; var org={};",
    "['chainOpen','eventOpen','anomalyOpen','peaceOpen','pactOpen','submitOpen',",
    " 'borderOpen','fedVoteOpen','warDecOpen','facDemandOpen','facCoupOpen',",
    " 'crisisWarnOpen','crisisOpen','crisisEndOpen','councilVoteOpen',",
    " 'councilNewOpen','aiDealOpen','sqOfferOpen'].forEach(function(m){",
    "  org[m]=UI[m]; UI[m]=function(){ acildi=m; }; });",
    "var ornek={sqOffer:1, pact:{from:1,tur:'intel'}, submit:{from:1,tehdit:2},",
    "  cncnew:1, cncvote:'ambargo', aideal:{from:1,to:0,give:[],want:[]},",
    "  fedvote:4, chain:Object.keys(CHAINS)[0], event:EVENTS[0],",
    "  anomaly:{a:ANOMALIES[0], sys:G.sys[3]}, peace:1, facdem:'mil',",
    "  faccoup:'darbe', criswarn:2225, crisis:2, crisend:1, wardec:1,",
    "  border:{id:1,len:7}};",
    "kinds.forEach(function(k){",
    "  G.inbox=[]; G.inboxUid=0; acildi=null;",
    "  UI.notify({kind:k, data:ornek[k], ico:'x', title:'t', sub:'s'});",
    "  var uid=G.inbox[0]?G.inbox[0].uid:-1;",
    "  UI.openNote(uid);",
    "  tuketici[k]=acildi; });",
    "Object.keys(org).forEach(function(m){ UI[m]=org[m]; });",
    "return JSON.stringify({codecVar:codecVar, tuketici:tuketici});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  const kinds=['sqOffer','pact','submit','cncnew','cncvote','aideal','fedvote',
    'chain','event','anomaly','peace','facdem','faccoup','criswarn','crisis',
    'crisend','wardec','border'];
  kinds.forEach(k=>{
    ok('kind "'+k+'": codec var ve tüketici rotası çalışıyor',
       !!(d.codecVar||{})[k] && !!(d.tuketici||{})[k],
       'codec='+(d.codecVar||{})[k]+' tüketici='+((d.tuketici||{})[k]||'YOK'));
  });
}

/* ═══ C. HER KIND İÇİN ROUND-TRIP ═══ */
console.log('\nC. SERIALIZE → ZEHİRLE → DESERIALIZE');
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "var ev=EVENTS[0], an=ANOMALIES[0], sy=G.sys[3];",
    "var zid=Object.keys(CHAINS)[0];",
    "ekle({kind:'chain', data:zid, ico:'c', title:'zincir', sub:'s'});",
    "ekle({kind:'event', data:ev, ico:'e', title:'olay', sub:'s', pause:true});",
    "ekle({kind:'anomaly', data:{a:an, sys:sy}, ico:'a', title:'anom', sub:'s'});",
    "ekle({kind:'pact', data:{from:1,tur:'intel'}, ico:'k', title:'pakt', sub:'s'});",
    "ekle({kind:'border', data:{id:2,len:7}, ico:'b', title:'sinir', sub:'s'});",
    "ekle({kind:'sqOffer', data:1, ico:'q', title:'statuko', sub:'s'});",
    "var k=serialize(); var v=JSON.parse(k);",
    "var ham=JSON.stringify(v.events);",
    "/* ZEHİRLE */",
    "G.inbox=[{kind:'ZEHIR',uid:99,data:9,title:'z'}]; G.inboxUid=99;",
    "deserialize(k);",
    "var kutu=G.inbox;",
    "return JSON.stringify({",
    "  sayi:kutu.length, sira:kutu.map(function(x){return x.kind;}).join(','),",
    "  uidler:kutu.map(function(x){return x.uid;}).join(','),",
    "  chainData:kutu[0].data, chainGecerli:!!CHAINS[kutu[0].data],",
    "  evAyniNesne:kutu[1].data===EVENTS[0],",
    "  evFonk:typeof (kutu[1].data.ch[0].f),",
    "  anAyniNesne:kutu[2].data.a===ANOMALIES[0],",
    "  anSysAyni:kutu[2].data.sys===G.sys[3],",
    "  pactData:JSON.stringify(kutu[3].data),",
    "  borderData:JSON.stringify(kutu[4].data),",
    "  sqData:kutu[5].data,",
    "  pauseKorundu:kutu[1].pause===true,",
    "  hamKayit:ham});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('altı bildirim de geri geldi (zehri ezdi)', d.sayi===6, String(d.sayi));
  ok('SIRA korundu', d.sira==='chain,event,anomaly,pact,border,sqOffer', d.sira);
  ok('UID\'ler korundu', d.uidler==='1,2,3,4,5,6', d.uidler);
  ok('chain: kararlı zincir kimliği geri geldi', d.chainGecerli===true, d.chainData);
  ok('event: EVENTS kataloğundaki GERÇEK nesneye bağlandı',
     d.evAyniNesne===true);
  ok('event: seçenek FONKSİYONU yeniden kuruldu', d.evFonk==='function', d.evFonk);
  ok('anomaly: ANOMALIES ve G.sys üzerinden yeniden kuruldu',
     d.anAyniNesne===true && d.anSysAyni===true);
  ok('pact payload\'ı korundu', d.pactData==='{"from":1,"tur":"intel"}', d.pactData);
  ok('border payload\'ı korundu', d.borderData==='{"id":2,"len":7}', d.borderData);
  ok('sqOffer payload\'ı korundu', d.sqData===1, String(d.sqData));
  ok('pause bayrağı korundu', d.pauseKorundu===true);
  /* Kayıt içeriği temiz olmalı */
  const ham=d.hamKayit||'';
  ok('kayıtta FONKSİYON yok', ham.indexOf('function')<0);
  ok('kayıtta tam EVENT nesnesi yok (yalnız evId)',
     ham.indexOf('evId')>=0 && ham.indexOf('"ch":[')<0);
  ok('kayıtta tam SYS nesnesi yok (yalnız sysId)',
     ham.indexOf('sysId')>=0 && ham.indexOf('"planets"')<0);
  ok('kayıtta HTML yok', ham.indexOf('<div')<0 && ham.indexOf('innerHTML')<0);
}

/* ═══ D. EVENT / ANOMALY SEÇENEĞİ TAM BİR KEZ ═══ */
console.log('\nD. YENİDEN KURULAN REFERANSLARLA SEÇENEK ÇALIŞTIRMA');
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "var ev=EVENTS[0];",
    "ekle({kind:'event', data:ev, ico:'e', title:'olay', sub:'s'});",
    "var k=serialize();",
    "G.inbox=[]; G.inboxUid=0;",
    "deserialize(k);",
    "/* seçenek fonksiyonunu say */",
    "var sayac=0; var hedef=G.inbox[0].data;",
    "var orgF=hedef.ch[0].f;",
    "hedef.ch[0].f=function(g,r){ sayac++; return orgF(g,r); };",
    "UI.openNote(G.inbox[0].uid);",
    "/* Hook'lar DOM click dinleyicisiyle dağıtılır; harness'ta üretim",
    "   yolunun ta kendisi olan UI._hooks[...] doğrudan çağrılır. */",
    "UI._hooks['evch'](0);",
    "hedef.ch[0].f=orgF;",
    "return JSON.stringify({cagri:sayac, kataloglaAyni:hedef===EVENTS[0]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('event yüklemeden sonra katalog nesnesine bağlı', d.kataloglaAyni===true);
  ok('seçilen event fonksiyonu TAM BİR KEZ çalıştı', d.cagri===1,
     String(d.cagri)+' çağrı');
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "var an=ANOMALIES[0], sy=G.sys[3];",
    "ekle({kind:'anomaly', data:{a:an, sys:sy}, ico:'a', title:'an', sub:'s'});",
    "var k=serialize(); G.inbox=[]; G.inboxUid=0;",
    "deserialize(k);",
    "var d0=G.inbox[0].data;",
    "var sayac=0; var orgF=d0.a.ch[0].f;",
    "d0.a.ch[0].f=function(g,r){ sayac++; return orgF(g,r); };",
    "UI.openNote(G.inbox[0].uid);",
    "UI._hooks['anomch'](0);",
    "d0.a.ch[0].f=orgF;",
    "return JSON.stringify({cagri:sayac, anAyni:d0.a===ANOMALIES[0],",
    "  sysAyni:d0.sys===G.sys[3]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('anomaly ID + sistem ID üzerinden yeniden kuruldu',
     d.anAyni===true && d.sysAyni===true);
  ok('seçilen anomaly seçeneği TAM BİR KEZ çalıştı', d.cagri===1,
     String(d.cagri)+' çağrı');
}
/* Kaybolmuş referans güvenle düşürülür */
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "ekle({kind:'event', data:EVENTS[0], ico:'e', title:'o', sub:'s'});",
    "ekle({kind:'peace', data:1, ico:'p', title:'p', sub:'s'});",
    "var k=serialize();",
    "var b=JSON.parse(k);",
    "b.events.inbox[0].data.evId='YOK_BOYLE';",
    "b.events.inbox[1].data=9999;",
    "b.events.inbox.push({uid:77, kind:'BILINMEYEN', data:1, title:'x'});",
    "var resOnce=JSON.stringify(G.p.res), relOnce=JSON.stringify(G.p.rel);",
    "var warOnce=JSON.stringify(G.p.war);",
    "var hata='';",
    "try{ deserialize(JSON.stringify(b)); }catch(ex){ hata=ex.message; }",
    "return JSON.stringify({hata:hata, kutu:G.inbox.length,",
    "  dropped:(G._loadEventsInfo||{}).dropped,",
    "  resAyni:JSON.stringify(G.p.res)===resOnce,",
    "  relAyni:JSON.stringify(G.p.rel)===relOnce,",
    "  warAyni:JSON.stringify(G.p.war)===warOnce});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('kayıp event / ölü devlet / bilinmeyen kind HATA ATMADI',
     d.hata==='', d.hata||'ok');
  ok('üç geçersiz payload da güvenle düşürüldü', d.kutu===0 && d.dropped===3,
     'kutu='+d.kutu+' düşen='+d.dropped);
  ok('onarım kaynak/ilişki/savaş durumunu DEĞİŞTİRMEDİ',
     d.resAyni===true && d.relAyni===true && d.warAyni===true);
}

/* ═══ E. AI TEKLİFLERİ BİRBİRİNİ EZMİYOR ═══ */
console.log('\nE. AI TEKLİF KİMLİĞİ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.inbox=[]; G.inboxUid=0;",
    "var A=G.emps[1], B=G.emps[2];",
    "UI.aiOffer({from:A.id,to:0,give:[{t:'res',r:'ene',v:100}],",
    "  want:[{t:'res',r:'min',v:50}]});",
    "UI.aiOffer({from:B.id,to:0,give:[{t:'res',r:'ala',v:9}],",
    // Initial player research stock is zero; offer identity is tested with deliverable minerals.
    "  want:[{t:'res',r:'min',v:7}]});",
    "/* AYNI devletten ŞARTLARI FARKLI ikinci teklif */",
    "UI.aiOffer({from:A.id,to:0,give:[{t:'res',r:'yiy',v:33}],",
    "  want:[{t:'res',r:'etk',v:11}]});",
    "/* BİREBİR AYNI teklif tekrar — tekrarlanmamalı */",
    "UI.aiOffer({from:A.id,to:0,give:[{t:'res',r:'ene',v:100}],",
    "  want:[{t:'res',r:'min',v:50}]});",
    "var teklifler=G.inbox.filter(function(x){return x.kind==='aideal';});",
    "var k=serialize();",
    "G.inbox=[]; G.inboxUid=0;",
    "deserialize(k);",
    "var y=G.inbox.filter(function(x){return x.kind==='aideal';});",
    "function ozet(t){ return t.map(function(x){ return x.data.from+':'+",
    "  x.data.give.map(function(g){return g.r+g.v;}).join('')+'>'+",
    "  x.data.want.map(function(g){return g.r+g.v;}).join(''); }); }",
    "/* İlkini aç ve KABUL et */",
    "var ilk=y[0], ikinci=y[1];",
    "var ikinciOnce=JSON.stringify(ikinci.data);",
    "UI.openNote(ilk.uid);",
    "var modal1=document.getElementById('modal').innerHTML;",
    "UI._hooks['offNo'](0);",
    "var kalan=G.inbox.filter(function(x){return x.kind==='aideal';});",
    "var ikinciSonra=JSON.stringify(",
    "  kalan.filter(function(x){return x.uid===ikinci.uid;})[0].data);",
    "/* İkinciyi aç: KENDİ şartlarını göstermeli */",
    "UI.openNote(ikinci.uid);",
    "var modal2=document.getElementById('modal').innerHTML;",
    "return JSON.stringify({once:ozet(teklifler), sonra:ozet(y),",
    "  sayiOnce:teklifler.length, sayiSonra:y.length,",
    "  modal1Ala:modal1.indexOf('100')>=0, modal1Bos:modal1.length===0,",
    "  modal2Var:modal2.length>0, modal2Kendi:modal2.indexOf('9')>=0,",
    "  ikinciDegismedi:ikinciOnce===ikinciSonra,",
    "  pendingOffer:(UI.pendingOffer===undefined||UI.pendingOffer===null)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('üç FARKLI teklif ayrı ayrı kuyrukta (birebir aynısı tekrarlanmadı)',
     d.sayiOnce===3, String(d.sayiOnce)+' teklif');
  ok('aynı devletten şartları farklı iki teklif AYRI kaldı',
     Array.isArray(d.once) && d.once.filter(x=>x.startsWith('1:')).length===2,
     (d.once||[]).join(' · '));
  ok('teklifler yüklemeden sonra KENDİ give/want içeriğini koruyor',
     JSON.stringify(d.once)===JSON.stringify(d.sonra),
     (d.sonra||[]).join(' · '));
  ok('İLK teklif açılabildi (eskiden "geçerliliğini yitirdi" diyordu)',
     d.modal1Bos===false && d.modal1Ala===true);
  ok('bir teklifi reddetmek DİĞERİNİ değiştirmedi', d.ikinciDegismedi===true);
  ok('ikinci teklif KENDİ şartlarıyla açıldı',
     d.modal2Var===true && d.modal2Kendi===true);
  ok('tekil UI.pendingOffer artık doğruluğun kaynağı değil',
     d.pendingOffer===true);
}

/* ═══ F. sqOffer KARAR EKRANI ═══ */
console.log('\nF. sqOffer STATÜKO BARIŞI');
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.inbox=[]; G.inboxUid=0;",
    "var o=G.emps[1];",
    "G.p.war[o.id]=true; o.war[G.p.id]=true;",
    "G.p.exh=G.p.exh||{}; o.exh=o.exh||{};",
    "G.p.exh[o.id]=99; o.exh[G.p.id]=99;",
    "G.p.warSince=G.p.warSince||{}; G.p.warSince[o.id]=0;",
    "UI.notify({kind:'sqOffer', data:o.id, ico:'q', cls:'sci', pause:true,",
    "  title:'STATÜKO', sub:'s', key:'sq:'+o.id});",
    "var uid=G.inbox[0].uid;",
    "UI.openNote(uid);",
    "var md=document.getElementById('modal').innerHTML;",
    "/* KABUL: statusQuoPeace tam bir kez */",
    "var sayac=0; var org=statusQuoPeace;",
    "globalThis.statusQuoPeace=function(a,b){ sayac++; return org(a,b); };",
    "UI._hooks['sqYes'](0);",
    "var tekDokunus=sayac;",
    "UI._hooks['sqYes'](0);",
    "var ciftDokunus=sayac;",
    "globalThis.statusQuoPeace=org;",
    "return JSON.stringify({modalVar:md.length>0,",
    "  modalAd:md.indexOf(o.name)>=0, modalStatuko:md.indexOf('STATÜKO')>=0,",
    "  modalDonma:md.indexOf('fiili sahibinde')>=0,",
    "  kabulBtn:md.indexOf('sqYes')>=0, retBtn:md.indexOf('sqNo')>=0,",
    "  sonraBtn:md.indexOf('sqLater')>=0,",
    "  tek:tekDokunus, cift:ciftDokunus,",
    "  savasBitti:!G.p.war[o.id]});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('sqOffer tıklanınca GERÇEK modal açıldı (eskiden hiçbir şey olmuyordu)',
     d.modalVar===true);
  ok('modal teklifi yapan devleti gösteriyor', d.modalAd===true);
  ok('modal statüko sonucunu ve donma uyarısını gösteriyor',
     d.modalStatuko===true && d.modalDonma===true);
  ok('Kabul / Reddet / Daha sonra düğmeleri var',
     d.kabulBtn===true && d.retBtn===true && d.sonraBtn===true);
  ok('kabul statusQuoPeace\'i TAM BİR KEZ çağırdı', d.tek===1, String(d.tek));
  ok('çift dokunuş İKİNCİ barış üretmedi', d.cift===1,
     'ilk '+d.tek+' → ikinci '+d.cift);
  ok('savaş gerçekten bitti', d.savasBitti===true);
}
/* RET hiçbir şey değiştirmez */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.inbox=[]; G.inboxUid=0;",
    "var o=G.emps[1];",
    "G.p.war[o.id]=true; o.war[G.p.id]=true;",
    "G.p.exh=G.p.exh||{}; G.p.exh[o.id]=99; o.exh=o.exh||{}; o.exh[G.p.id]=99;",
    "G.p.warSince=G.p.warSince||{}; G.p.warSince[o.id]=0;",
    "UI.notify({kind:'sqOffer', data:o.id, ico:'q', title:'S', sub:'s'});",
    "var resOnce=JSON.stringify(G.p.res);",
    "var ownOnce=G.sys.map(function(s){return s.owner;}).join(',');",
    "var relOnce=JSON.stringify(G.p.rel);",
    "var cd=o._sqCd;",
    "var sayac=0; var org=statusQuoPeace;",
    "globalThis.statusQuoPeace=function(a,b){ sayac++; return org(a,b); };",
    "UI.openNote(G.inbox[0].uid);",
    "UI._hooks['sqNo'](0);",
    "globalThis.statusQuoPeace=org;",
    "return JSON.stringify({cagri:sayac,",
    "  resAyni:JSON.stringify(G.p.res)===resOnce,",
    "  ownAyni:G.sys.map(function(s){return s.owner;}).join(',')===ownOnce,",
    "  relAyni:JSON.stringify(G.p.rel)===relOnce,",
    "  savasSuruyor:G.p.war[o.id]===true, cdAyni:o._sqCd===cd});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('RET statusQuoPeace çağırmadı', d.cagri===0, String(d.cagri));
  ok('RET sahiplik veya kaynak değiştirmedi',
     d.ownAyni===true && d.resAyni===true);
  ok('RET yeni ceza uydurmadı (ilişki değişmedi)', d.relAyni===true);
  ok('RET sonrası savaş sürüyor', d.savasSuruyor===true);
  ok('mevcut AI cooldown davranışı korundu', d.cdAyni===true);
}
/* GEÇERSİZ/ESKİ teklif + DAHA SONRA */
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.inbox=[]; G.inboxUid=0;",
    "var o=G.emps[1];",
    "/* savaş YOK — teklif eskimiş */",
    "UI.notify({kind:'sqOffer', data:o.id, ico:'q', title:'S', sub:'s'});",
    "var sayac=0; var org=statusQuoPeace;",
    "globalThis.statusQuoPeace=function(a,b){ sayac++; return org(a,b); };",
    "UI.openNote(G.inbox[0].uid);",
    "var md=document.getElementById('modal').innerHTML;",
    "globalThis.statusQuoPeace=org;",
    "/* DAHA SONRA yolu */",
    "G.inbox=[]; G.inboxUid=0;",
    "G.p.war[o.id]=true; o.war[G.p.id]=true;",
    "G.p.exh=G.p.exh||{}; G.p.exh[o.id]=99;",
    "G.p.warSince=G.p.warSince||{}; G.p.warSince[o.id]=0;",
    "UI.notify({kind:'sqOffer', data:o.id, ico:'q', title:'S', sub:'s'});",
    "var uid=G.inbox[0].uid;",
    "UI.openNote(uid);",
    "var kutuAcikken=G.inbox.length;",
    "UI._hooks['sqLater'](0);",
    "UI._hooks['sqLater'](0);",
    "return JSON.stringify({eskiModal:md.indexOf('GEÇERSİZ')>=0,",
    "  eskiCagri:sayac, kutuAcikken:kutuAcikken,",
    "  geriDondu:G.inbox.filter(function(x){return x.uid===uid;}).length,",
    "  toplam:G.inbox.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('eskimiş sqOffer "geçersiz" ekranı gösterdi', d.eskiModal===true);
  ok('eskimiş teklif statusQuoPeace ÇAĞIRMADI', d.eskiCagri===0, String(d.eskiCagri));
  ok('açılınca bildirim kutudan çıktı', d.kutuAcikken===0);
  ok('DAHA SONRA bildirimi TAM BİR KOPYA olarak geri koydu',
     d.geriDondu===1 && d.toplam===1,
     'kopya='+d.geriDondu+' toplam='+d.toplam);
}

/* ═══ G. UID / DEDUPE / SIRA / seenChains ═══ */
console.log('\nG. UID, DEDUPE VE seenChains');
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "ekle({kind:'peace', data:1, ico:'p', title:'a', sub:'s'});",
    "ekle({kind:'wardec', data:2, ico:'w', title:'b', sub:'s'});",
    "ekle({kind:'crisis', data:2, ico:'c', title:'c', sub:'s'});",
    "var k=serialize();",
    "var dizi=[];",
    "for(var i=0;i<10;i++){ deserialize(k);",
    "  dizi.push(G.inbox.length+':'+G.inbox.map(function(x){",
    "    return x.uid+x.kind;}).join('|')); }",
    "/* inboxUid onarımı: kayıtta düşük UID */",
    "var b=JSON.parse(k); b.events.inboxUid=1;",
    "deserialize(JSON.stringify(b));",
    "var onarilan=G.inboxUid;",
    "UI.notify({kind:'peace', data:2, ico:'p', title:'yeni', sub:'s'});",
    "var yeniUid=G.inbox[G.inbox.length-1].uid;",
    "var uidler=G.inbox.map(function(x){return x.uid;});",
    "var cakisma=uidler.length!==new Set(uidler).size;",
    "return JSON.stringify({sabit:dizi.every(function(x){return x===dizi[0];}),",
    "  ilk:dizi[0], son:dizi[9], onarilan:onarilan, yeniUid:yeniUid,",
    "  cakisma:cakisma});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('10 ardışık yükleme inbox\'ı ÇOĞALTMADI ve sırasını değiştirmedi',
     d.sabit===true, d.ilk);
  ok('inboxUid en büyük UID\'den küçükse güvenle yükseltildi',
     d.onarilan===3, '1 → '+d.onarilan);
  ok('sonraki bildirimin UID\'si mevcutlarla ÇAKIŞMIYOR',
     d.yeniUid===4 && d.cakisma===false, 'yeni uid='+d.yeniUid);
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([
    "G.seenChains={}; var zid=Object.keys(CHAINS)[0];",
    "G.seenChains[zid]=true;",
    "var k=serialize();",
    "G.seenChains={ZEHIR:true};",
    "for(var i=0;i<5;i++) deserialize(k);",
    "var korundu=JSON.stringify(G.seenChains);",
    "/* başlamış temel zincir yeniden seçilmemeli */",
    "/* Gerçek üretim yolu maybeEvent(): işaretli zincir havuza",
    "   ALINMAZ, yani yeniden seçilmez. */",
    "var yenidenSecildi=false;",
    "var orgChain=UI.chain;",
    "UI.chain=function(id){ if(id===zid) yenidenSecildi=true; };",
    "for(var t=0;t<300;t++) maybeEvent();",
    "UI.chain=orgChain;",
    "var yine=!!G.seenChains[zid] && !yenidenSecildi;",
    "/* yeni oyun temizlemeli */",
    "setupGame({name:'Y',race:'insan',traits:[],size:'orta',shape:'sarmal',",
    "  diff:'normal',seed:5,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],",
    "  origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});",
    "return JSON.stringify({korundu:korundu, zid:zid, yine:yine,",
    "  yeniSeen:JSON.stringify(G.seenChains),",
    "  yeniInbox:JSON.stringify(G.inbox), yeniUid:G.inboxUid,",
    "  openNote:UI._openNote, pending:UI.pendingOffer,",
    "  minNote:G.minNote, minRaw:G.minRaw});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('seenChains kaydet/yükle sonrası korundu (zehri ezdi)',
     d.korundu==='{"'+d.zid+'":true}', d.korundu);
  ok('başlamış zincir 300 denemede YENİDEN SEÇİLMEDİ', d.yine===true);
  ok('setupGame seenChains\'i temizledi', d.yeniSeen==='{}', d.yeniSeen);
  ok('setupGame inbox ve inboxUid\'i temizledi',
     d.yeniInbox==='[]' && d.yeniUid===0);
  ok('setupGame _openNote / pendingOffer temizledi',
     d.openNote===null && (d.pending===null||d.pending===undefined));
  ok('setupGame minNote / minRaw temizledi',
     (d.minNote===undefined||d.minNote===null) &&
     (d.minRaw===undefined||d.minRaw===null));
}

/* ═══ H. AÇIK MODAL SNAPSHOT + minRaw ═══ */
console.log('\nH. AÇIK MODAL VE minRaw');
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "ekle({kind:'peace', data:1, ico:'p', title:'acik', sub:'s'});",
    "var uid=G.inbox[0].uid;",
    "UI.openNote(uid);",
    "var kutuBos=G.inbox.length;",
    "var acikVar=!!UI._openNote;",
    "/* kayıt anında modal AÇIK */",
    "var k=serialize();",
    "/* runtime DEĞİŞMEMELİ */",
    "var sonraAcik=!!UI._openNote, sonraKutu=G.inbox.length;",
    "var v=JSON.parse(k);",
    "G.inbox=[]; G.inboxUid=0;",
    "/* Modal DOM'u deserialize tarafından temizlenmez; otomatik",
    "   açılma ölçümü için önce elle boşaltılır. */",
    "document.getElementById('modal').innerHTML='';",
    "deserialize(k);",
    "var geri=G.inbox.filter(function(x){return x.uid===uid;});",
    "var modalAcikMi=document.getElementById('modal').innerHTML.length>0;",
    "/* minRaw kayda girmemeli */",
    "G.minRaw={html:'<div>HAM MODAL HTML</div>', cls:'sci'};",
    "var k2=serialize();",
    "deserialize(k2);",
    "return JSON.stringify({kutuBos:kutuBos, acikVar:acikVar,",
    "  runtimeDegismedi:sonraAcik===acikVar && sonraKutu===kutuBos,",
    "  kayittaVar:JSON.stringify(v.events.inbox).indexOf('\"uid\":'+uid)>=0,",
    "  geriDondu:geri.length, otomatikAcildi:modalAcikMi,",
    "  minRawKayitta:JSON.stringify(JSON.parse(k2)).indexOf('HAM MODAL HTML')>=0,",
    "  minRawSonra:G.minRaw});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('bildirim açılınca kutudan çıktı ve _openNote\'a alındı',
     d.kutuBos===0 && d.acikVar===true);
  ok('serialize AÇIK bildirimi runtime state\'i DEĞİŞTİRMEDEN yakaladı',
     d.kayittaVar===true && d.runtimeDegismedi===true);
  ok('yüklemede açık bildirim inbox\'a TEK KOPYA döndü', d.geriDondu===1,
     String(d.geriDondu));
  ok('yükleme bildirimi OTOMATİK AÇMADI', d.otomatikAcildi===false);
  ok('ham minRaw modal HTML\'i kayda GİRMEDİ', d.minRawKayitta===false);
  ok('yükleme minRaw\'ı güvenle temizledi',
     d.minRawSonra===undefined || d.minRawSonra===null);
}

/* ═══ I. V6 GÖÇÜ + YÜKLEME BÜTÜNLÜĞÜ ═══ */
console.log('\nI. V6 GÖÇÜ VE YÜKLEME BÜTÜNLÜĞÜ');
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "ekle({kind:'peace', data:1, ico:'p', title:'a', sub:'s'});",
    "G.seenChains={x:true};",
    "var v7=JSON.parse(serialize()); delete v7.events; v7.v=6;",
    "var v6=JSON.stringify(v7);",
    "G.inbox=[{kind:'ZEHIR',uid:99,data:1,title:'z'}]; G.inboxUid=99;",
    "G.seenChains={ZEHIR:true};",
    "var s=[], rr=[], hata=''; G.log=[];",
    "for(var i=0;i<3;i++){",
    "  try{ deserialize(v6); }catch(ex){ hata=ex.message; }",
    "  s.push(JSON.stringify({i:G.inbox,u:G.inboxUid,c:G.seenChains}));",
    "  rr.push(RND_STATE); }",
    "return JSON.stringify({hata:hata, inbox:JSON.stringify(G.inbox),",
    "  uid:G.inboxUid, seen:JSON.stringify(G.seenChains),",
    "  log:(G.log||[]).length,",
    "  determinist:s[0]===s[1]&&s[1]===s[2],",
    "  rngSabit:rr.every(function(x){return x===rr[0];}),",
    "  bilgi:JSON.stringify(G._loadEventsInfo)});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('v6 kaydı HATA ATMADAN açıldı', d.hata==='', d.hata||'ok');
  ok('v6 göçü boş ve deterministik events kurdu',
     d.inbox==='[]' && d.uid===0 && d.seen==='{}',
     'inbox='+d.inbox+' uid='+d.uid);
  ok('zehirli oturum değerleri TAŞINMADI', d.inbox==='[]' && d.seen==='{}');
  ok('göç bildirim üretmedi', d.log===0, String(d.log));
  ok('göç DETERMİNİSTİK (3 tekrar aynı)', d.determinist===true);
  ok('göç RNG TÜKETMEDİ', d.rngSabit===true);
  ok('kurtarılamayan bilgi dürüstçe raporlandı',
     /KURTARILAMADI/.test(d.bilgi||''), (d.bilgi||'').slice(0,70));
}
{
  const H=harness(); H.R(KUR);
  const r=H.R([KUTU_KUR,
    "var ev=EVENTS[0], an=ANOMALIES[0];",
    "ekle({kind:'event', data:ev, ico:'e', title:'o', sub:'s'});",
    "ekle({kind:'anomaly', data:{a:an, sys:G.sys[3]}, ico:'a', title:'a', sub:'s'});",
    "ekle({kind:'peace', data:1, ico:'p', title:'p', sub:'s'});",
    "var A={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  war:G.emps.map(function(e){return JSON.stringify(e.war);}).join(';'),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  filo:G.fleets.length, rng:RND_STATE};",
    "G.log=[]; var k=serialize();",
    "for(var i=0;i<10;i++) deserialize(k);",
    "var B={res:G.emps.map(function(e){return JSON.stringify(e.res);}).join(';'),",
    "  rel:G.emps.map(function(e){return JSON.stringify(e.rel);}).join(';'),",
    "  war:G.emps.map(function(e){return JSON.stringify(e.war);}).join(';'),",
    "  own:G.sys.map(function(s){return s.owner;}).join(','),",
    "  filo:G.fleets.length, rng:RND_STATE};",
    "return JSON.stringify({resAyni:A.res===B.res, relAyni:A.rel===B.rel,",
    "  warAyni:A.war===B.war, ownAyni:A.own===B.own,",
    "  filoAyni:A.filo===B.filo, rngAyni:A.rng===B.rng,",
    "  log:(G.log||[]).length,",
    "  modalAcik:document.getElementById('modal').innerHTML.length>0,",
    "  kutu:G.inbox.length});"].join('\n'));
  let d={}; try{d=JSON.parse(r);}catch(e){}
  ok('yükleme kaynakları değiştirmedi', d.resAyni===true);
  ok('yükleme ilişkileri ve savaşları değiştirmedi',
     d.relAyni===true && d.warAyni===true);
  ok('yükleme sistem sahipliğini ve filoları değiştirmedi',
     d.ownAyni===true && d.filoAyni===true);
  ok('yükleme RNG tüketmedi', d.rngAyni===true);
  ok('yükleme hiçbir bildirimi OTOMATİK AÇMADI', d.modalAcik===false);
  ok('yükleme hiçbir seçeneği çalıştırmadı (bildirim üretilmedi)',
     d.log===0, String(d.log));
  ok('10 yüklemeden sonra kutu hâlâ 3 bildirim', d.kutu===3, String(d.kutu));
}

console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: '+gecen+'   KALAN: '+kalan);
if(basarisiz.length){console.log('  BAŞARISIZ:');
  basarisiz.forEach(x=>console.log('    · '+x));}
console.log('══════════════════════════════════════════\n');
process.exit(kalan?1:0);
