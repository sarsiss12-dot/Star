'use strict';
/* MP.7.2 — eksik oynanış işlevleri gerçek STARS düğmeleriyle: elçi, filo bileşimi, savaş filolarını birleştirme, koloni otomasyonu,
   bombardıman kipi, ortak askerî destek (MP.7.1 test altyapısı: aynı oda / tasarım / başlatma yardımcıları).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp72-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp72'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const results=[],errors=[],metrics={};
async function test(name,fn){const t0=Date.now();
  try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1800)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'allow'});
const freePort=()=>new Promise(res=>{const s=require('net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
const wait=(p,fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{timeout,polling:100});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
let tapFail=0;
const tap=async(p,sel)=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});try{await l.tap({timeout:8000});}
  catch(e){const n='tapfail-'+(++tapFail);await shot(p,n);throw Error('tap '+sel+' ['+n+'] '+JSON.stringify(await p.evaluate(sel=>{const m=document.getElementById('modal'),sh=document.getElementById('mp1Sheet'),el=document.querySelector(sel),r=el&&el.getBoundingClientRect();
    const top=r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {who:G.p.name,modal:m&&!m.classList.contains('hidden')?m.textContent.slice(0,160):'',sheet:sh?sh.textContent.slice(0,200):'',diplo:document.getElementById('diploPane').classList.contains('show'),
      box:r&&[r.x,r.y,r.width,r.height],top:top&&(top.id||top.className||top.tagName),vw:[innerWidth,innerHeight]};},sel)));}};
async function design(p,o){
  /* kurulum ekranı dikeyde doldurulur (MP.7 testiyle aynı); oyun yatay görünümde oynanır */
  const vp=p.viewportSize();if(vp.width>vp.height)await p.setViewportSize({width:vp.height,height:vp.width});
  try{await design0(p,o);}finally{await p.setViewportSize(vp);}
}
async function design0(p,o){
  await wait(p,()=>!document.getElementById('menu').classList.contains('hidden')&&document.querySelector('#setup [data-a="mizacSet"]'));
  await p.fill('#empName',o.name);await tap(p,'#setup [data-a="mizacSet"][data-x="'+o.mizac+'"]');
  await tap(p,'#setup [data-a="step"][data-x="etik"]');for(const x of o.ethics)await tap(p,'#setup [data-a="ethic"][data-x="'+x+'"]');
  await tap(p,'#setup [data-a="step"][data-x="civic"]');for(const c of o.civics)await tap(p,'#setup [data-a="civic"][data-x="'+c+'"]');
  await tap(p,'#setup [data-a="step"][data-x="koken"]');await tap(p,'#setup [data-a="origin"][data-x="'+o.origin+'"]');
  await tap(p,'#setup [data-a="start"]');
  try{await wait(p,()=>document.getElementById('menu').classList.contains('hidden'),undefined,10000);}
  catch(e){await shot(p,'design-fail-'+o.mizac);throw Error('kurulum kapanmadı: '+await p.evaluate(()=>(UI.setupError||'')+' | '+(document.querySelector('#setup .err,#setup .setupError')||{}).textContent));}
}
async function room(H,cap,guests){
  await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup&&window.MP71Dip);
  await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
  if(cap>2){await H.selectOption('#mp7Cap',String(cap));await wait(H,c=>MP1Host.lobby.capacity===c,cap);}
  await tap(H,'#mp7EditMe');await design(H,{name:'Kızıl Muhafız',mizac:'militarist',origin:'standart',ethics:['mil:2'],civics:['kale_dok']});
  const link=await H.textContent('#mp1Link');
  for(const [p,name,d] of guests){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jName',name);await tap(p,'[data-j="go"]');
    await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'));
    await tap(p,'#jEditMe');await wait(p,()=>document.getElementById('mp7Head'));await design(p,d);
    await wait(p,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));await tap(p,'#jReady');}
  await wait(H,()=>MP1Host.host.canStart().ok);await H.waitForTimeout(300);await shot(H,'room-lobby-'+guests.length);
  /* MP.7.1 düzeltmesi: kurulumu kapatan dokunuşun sentetik tıklaması lobi düğmesine düşmez (yatayda ODAYI KAPAT sorusu açılıyordu) */
  assert.equal(await H.evaluate(()=>{const s=document.getElementById('mp1Sheet');return s?s.textContent:'';}),'','ghost click opened a lobby sheet');
  await tap(H,'[data-m="start"]');
  for(const [p] of guests)await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,40000);
  /* fikstür: insan devletler arası temas + başlangıç stoğu (motorun teklif kuralları aynen) */
  await H.evaluate(n=>{const hs=[0,...Array.from({length:n},(_,i)=>i+1)];for(const a of hs){const A=G.emps[a];A.res.min=Math.max(A.res.min,2000);A.res.ene=Math.max(A.res.ene,2000);A.res.etk=Math.max(A.res.etk,400);
    for(const b of hs)if(a!==b){A.contact[b]=true;A.rel[b]=40;}}MP1Host.host.publish();},guests.length);
  /* başlangıçta açılan tek oyunculu tanıtım penceresi kapatılır (pencere açıkken misafirde ayna bekletilir — MP.6.1) */
  await H.waitForTimeout(1200);   // tek oyunculu danışman penceresi oyun girişinden 420 ms sonra açılır
  for(const p of [H,...guests.map(g=>g[0])]){const open=await p.evaluate(()=>{const m=document.getElementById('modal');return m&&!m.classList.contains('hidden')?(m.querySelector('.mhd')||m).textContent.trim().slice(0,40):'';});
    metrics.startModal=(metrics.startModal||[]).concat(open);
    if(open){const b=await p.$('#modal [data-a="advClose"],#modal [data-a="closem"]');if(b)await tap(p,'#modal [data-a="advClose"],#modal [data-a="closem"]');else await p.evaluate(()=>UI.closeModal());
      await wait(p,()=>document.getElementById('modal').classList.contains('hidden'));}}
  for(const [p] of guests)await wait(p,n=>G.emps.filter(e=>e.id!==0&&G.p.contact[e.id]).length>=n,guests.length);
  return link;
}
/* gerçek anlaşma penceresi: kaynak maddesi ekle (Kaynak → kaynak seç → miktar → TASLAĞA EKLE) */
async function addRes(p,side,r,v){
  await tap(p,'#diploPane [data-a="dealAdd"][data-x="'+side+':res"]');const idx=['min','ene','yiy','ala','tuk','etk'].indexOf(r);
  await tap(p,'#modal [data-a="pickOne"][data-x="'+idx+'"]');await tap(p,'#modal [data-a="amountPreset"][data-x="'+v+'"]');await tap(p,'#modal [data-a="amountApply"]');
  await wait(p,()=>document.getElementById('modal').classList.contains('hidden'));
}
const openDeal=(p,id)=>p.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'deal');},id);
const cardUid=(p,key)=>wait(p,k=>(G.inbox||[]).some(n=>n.key===k),key).then(()=>p.evaluate(k=>G.inbox.find(n=>n.key===k).uid,key));
async function openCard(p,key){const uid=await cardUid(p,key);
  /* diplomasi sayfası tam ekran (yatay telefon): kartlara dönmek için oyuncu gibi ✕ ile kapatılır */
  if(await p.evaluate(()=>document.getElementById('diploPane').classList.contains('show')))await tap(p,'#diploPane [data-a="closeDiplo"]');await tap(p,'#inbox [data-a="openNote"][data-x="'+uid+'"]');await wait(p,()=>document.getElementById('inboxYes')||document.querySelector('#modal .archiveDetail'));}
/* yatay telefon: pencere ekranda, onay/ret düğmeleri görünür ve üst üste binmez */
async function layout(p,sels){return p.evaluate(sels=>{const vw=innerWidth,vh=innerHeight,m=document.querySelector('#modal .modalBox,#modal > div')||document.getElementById('modal'),rs=sels.map(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();
  return {s,x:r.x,y:r.y,w:r.width,h:r.height,top:(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)||{}).id||''};});
  const bad=[];for(const r of rs){if(!r){bad.push('yok');continue;}if(r.x<0||r.y<0||r.x+r.w>vw+1||r.y+r.h>vh+1)bad.push(r.s+' ekran dışı '+JSON.stringify(r));}
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];if(a&&b&&a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)bad.push('üst üste '+a.s+' / '+b.s);}
  const mr=m.getBoundingClientRect();return {bad,vw,vh,modal:[mr.x,mr.y,mr.width,mr.height]};},sels);}
const D=H=>H.evaluate(()=>MP1Host.host.dip.offers.map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,why:o.why,round:o.round,prev:o.prev})));
let relay,px,base,tls,bH,bB,bC;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  const H=await (await bH.newContext(PHONE(844,390))).newPage(),Bp=await (await bB.newContext(PHONE(800,360))).newPage();
  for(const [n,p] of [['host',H],['B',Bp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}

  const real=(p,id)=>p.evaluate(id=>{const me=MP1Join.empireId;return id===0?me:id===me?0:id;},id);
  /* ---------- A: host + 1 misafir (B 800×360) ---------- */
  await test('A1 oda, iki tasarım, başlat; misafirde desteklenmeyen eylem envanteri 68 → 46 (22 eylem bağlandı / yerel görünüm); ayrı MP paneli yok',async()=>{
    await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}]]);
    await wait(Bp,()=>MP6Stars.S.unsupported&&MP6Stars.S.unsupported.length>0);
    metrics.unsupported=await Bp.evaluate(()=>MP6Stars.S.unsupported);metrics.jointPatched=await Bp.evaluate(()=>!!MP6Stars.S.jointPatched);
    for(const a of ['envoy','envoyTask','envoyRecall','compositionEdit','compositionSave','compositionAuto','mergeArmed','dirTog','bombMode','build2','jointPrepare','jointChooseTarget','jointRequest','jointCancel','fedWarRequest','ultimatum','patronage','aimSet','aimCancel','rallySet','warPauseToggle','dismissBattleReport'])
      assert(!metrics.unsupported.includes(a),a+' still unsupported');
    assert.equal(metrics.unsupported.length,46,JSON.stringify(metrics.unsupported));assert.equal(metrics.jointPatched,true,'joint panel bound to host data');
    assert.equal(await Bp.evaluate(()=>!!document.getElementById('mp6DipBtn')||!!document.getElementById('mp3HostBtn')),false);
  });
  let ai;
  await test('A2 elçi: B gerçek İLİŞKİ sayfasından ELÇİ GÖNDER → elçi penceresinde görev seçer (dokunma) → host motoru uygular; yeniden açınca MEVCUT GÖREV; GERİ ÇEK → host kaydı siler',async()=>{
    /* fikstür: B ile bir AI arasında temas (yeni oyunda henüz yok); elçi kuralları motorun */
    ai=await H.evaluate(()=>{const B=G.emps[1],o=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!B.war[e.id]);B.contact[o.id]=o.contact[B.id]=true;MP1Host.host.publish();return envoyGate(B,o.id).ok?o.id:-1;});
    assert(ai>0,'envoy gate');
    await wait(Bp,id=>G.p.contact[id],ai);
    await Bp.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'relation');},ai);await tap(Bp,'#diploPane [data-a="envoy"][data-x="'+ai+'"]');
    await wait(Bp,()=>document.querySelector('#modal [data-a="envoyTask"]'));await shot(Bp,'a2-b-envoy-menu');
    const L=await layout(Bp,['#modal [data-a="envoyTask"][data-x="'+ai+':yakinlasma"]']);assert.deepEqual(L.bad,[],JSON.stringify(L));
    await tap(Bp,'#modal [data-a="envoyTask"][data-x="'+ai+':yakinlasma"]');
    await wait(H,id=>G.emps[1].envoy&&G.emps[1].envoy[id]&&G.emps[1].envoy[id].task==='yakinlasma',ai);
    await wait(Bp,id=>G.p.envoy&&G.p.envoy[id],ai);await Bp.evaluate(()=>UI.closeModal());
    await Bp.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'relation');},ai);await wait(Bp,id=>/ELÇİ GÖREVİ/.test((document.querySelector('#diploPane [data-a="envoy"][data-x="'+id+'"]')||{}).textContent||''),ai);
    await tap(Bp,'#diploPane [data-a="envoy"][data-x="'+ai+'"]');await wait(Bp,()=>document.querySelector('#modal [data-a="envoyRecall"]'));await shot(Bp,'a2-b-envoy-current');
    await tap(Bp,'#modal [data-a="envoyRecall"]');await wait(H,id=>!(G.emps[1].envoy||{})[id],ai);
  });
  let fid;
  await test('A3 filo bileşimi: B kendi filosunu seçer, BİLEŞİMİ OLUŞTUR penceresinde sayı yazar, KAYDET (dokunma) → host setFleetTemplate; OTOMATİK TAKVİYE düğmesi → host açar/kapatır',async()=>{
    await Bp.evaluate(()=>UI.closeModal());await Bp.evaluate(()=>document.getElementById('diploPane').classList.remove('show'));
    fid=await H.evaluate(()=>G.fleets.find(f=>f.e===1&&f.ships.length&&fleetDeliveryTarget(G.emps[1],f)!==null&&!hasShipment(f)&&!f.federal&&!f.guardLocked).id);
    await Bp.evaluate(id=>{View.sel=G.fleets.find(f=>f.id===id);UI.tab('filo');UI.refresh();},fid);
    await tap(Bp,'[data-a="compositionEdit"][data-x="'+fid+'"]');await wait(Bp,()=>document.getElementById('modal')&&document.querySelector('#modal [data-a="compositionSave"]'));
    const cls=await Bp.evaluate(()=>fleetTemplateClasses()[0]);await Bp.fill('#fc-'+cls,'2');await shot(Bp,'a3-b-composition');
    const L=await layout(Bp,['#modal [data-a="compositionSave"]']);assert.deepEqual(L.bad,[],JSON.stringify(L));
    await tap(Bp,'#modal [data-a="compositionSave"]');
    await wait(H,([id,c])=>{const f=G.fleets.find(x=>x.id===id);return f.composition&&f.composition.counts[c]===2;},[fid,cls]);
    const auto0=await H.evaluate(id=>G.fleets.find(x=>x.id===id).composition.auto,fid);
    await wait(Bp,id=>{const f=G.fleets.find(x=>x.id===id);return f&&f.composition;},fid);await Bp.evaluate(()=>{UI.keepScroll=true;UI.refresh();});
    await tap(Bp,'[data-a="compositionAuto"][data-x="'+fid+'"]');await wait(H,([id,a])=>G.fleets.find(x=>x.id===id).composition.auto===!a,[fid,auto0]);
  });
  await test('A4 savaş filolarını birleştir: B\'nin aynı sistemde iki savaş filosu (fikstür) → sistem panelindeki "SAVAŞ FİLOSUNU BİRLEŞTİR" (dokunma) → host MP.6.1 merge komutu',async()=>{
    const sys=await H.evaluate(id=>{const f=G.fleets.find(x=>x.id===id);const s=f.sys>=0?f.sys:G.emps[1].home;newFleet(G.emps[1],s,[{c:'kor'},{c:'kor'}],'Test Filosu');newFleet(G.emps[1],s,[{c:'kor'}],'Test Filosu 2');MP1Host.host.publish();return s;},fid);
    const n0=await H.evaluate(s=>G.fleets.filter(f=>f.e===1&&f.sys===s&&f.ships.length&&isArmed(f)).length,sys);assert(n0>=2);
    await wait(Bp,([s,n])=>G.fleets.filter(f=>f.e===0&&f.sys===s&&f.ships.length&&isArmed(f)).length>=n,[sys,n0]);
    await Bp.evaluate(s=>{View.sel=G.fleets.find(f=>f.e===0&&f.sys===s&&isArmed(f));UI.tab('filo');UI.refresh();},sys);
    await tap(Bp,'[data-a="mergeArmed"][data-x="'+sys+'"]');await wait(H,([s,n])=>G.fleets.filter(f=>f.e===1&&f.sys===s&&f.ships.length&&isArmed(f)).length<n,[sys,n0]);
  });
  await test('A5 koloni otomasyonu: B kendi gezegeninin OTOMATİK İNŞAYI AÇ / KAPAT düğmesi (dokunma) → host col.auto; bombardıman kipi gerçek UI.act yolundan → host',async()=>{
    const [s,p,a0]=await H.evaluate(()=>{const c=G.emps[1].colonies[0],pl=G.sys[c.s].planets.find(q=>q.i===c.p);return [c.s,pl.i,!!pl.col.auto];});
    await Bp.evaluate(s=>{UI.closeModal();View.selSys=G.sys[s];View.sel=null;UI.tab('sistem');UI.refresh();},s);
    const sel='[data-a="dirTog"][data-x="'+s+':'+p+'"]';
    if(!await Bp.$(sel))await Bp.evaluate(()=>{for(const d of document.querySelectorAll('#panel details'))d.open=true;});
    await tap(Bp,sel);await wait(H,([s,p,a])=>!!G.sys[s].planets.find(q=>q.i===p).col.auto===!a,[s,p,a0]);
    await Bp.evaluate(id=>UI.act('bombMode',id+':yikici'),fid);await wait(H,id=>G.fleets.find(x=>x.id===id).bombMode==='yikici',fid);
  });
  await test('A6 ortak askerî destek: B ile AI müttefik aynı savaş seferinde (fikstür); B\'nin İLİŞKİ sayfasındaki gerçek "Ortak askerî koordinasyon" bölümü host verisiyle; BÖLGEYİ SAVUN → TALEBİ GÖNDER → host motoru (jointRequest) değerlendirir; plan oluşursa iptal edilir',async()=>{
    const fx=await H.evaluate(id=>{const B=G.emps[1],ally=G.emps.find(e=>e.ai&&!e.dead&&!e.wild),foe=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&e!==ally);B.contact[ally.id]=ally.contact[B.id]=true;
      B.ally[ally.id]=ally.ally[B.id]=true;for(const x of [B,ally]){x.war[foe.id]=foe.war[x.id]=true;x.wg=x.wg||{};x.wg[foe.id]={t:'fetih',targets:[foe.home],start:G.day};}
      ally.contact[foe.id]=foe.contact[ally.id]=true;B.contact[foe.id]=foe.contact[B.id]=true;
      warLedgerOpen(B.id,foe.id);warLedgerOpen(ally.id,foe.id,{sponsor:B.id,enemy:foe.id,kind:'alliance'});for(const x of [B,ally,foe])aiObserve(x);const hs=G.sys[B.home];ally.aiIntel=ally.aiIntel||{v:1,systems:{}};ally.aiIntel.systems[hs.id]={owner:B.id,defense:sysDefense(hs),day:G.day};if(!hs.seen.includes(ally.id))hs.seen.push(ally.id);MP1Host.host.publish();
      return {ally:ally.id,foe:foe.id,home:B.home};},fid);
    try{await wait(Bp,a=>{const v=MP1Join.game.view;return v&&v.joint&&v.joint.allies.some(x=>x.id===a&&x.shared);},fx.ally,15000);}
    catch(e){metrics.jointDbg={guest:await Bp.evaluate(()=>MP1Join.game.view&&MP1Join.game.view.joint),host:await H.evaluate(([a,f])=>{const B=G.emps[1];
      return {fx:[a,f],bind:jointBinding(B,G.emps[a]),war:[B.war[f],G.emps[a].war[f]],ally:[B.ally[a],G.emps[a].ally[1]],fronts:G.warLedger.fronts.filter(x=>x.ended===null).map(x=>[x.campaign,x.sides,x.roles]),
        hv:(()=>{try{return MP1Host.host.viewFor([...MP1Host.host.state.players.values()].find(p=>p.empireId===1)).joint;}catch(err){return String(err);}})()};},[fx.ally,fx.foe])};throw e;}
    await Bp.evaluate(([a,id])=>{UI.closeModal();View.sel=G.fleets.find(f=>f.id===id);View.selSys=G.sys[G.p.home];UI.openDiplo();UI.selectDiplo(a,'relation');},[fx.ally,fid]);
    await wait(Bp,()=>document.querySelector('#diploPane .jointOps'));
    await Bp.evaluate(()=>{const d=document.querySelector('#diploPane .jointOps');d.open=true;d.scrollIntoView();});
    await wait(Bp,a=>document.querySelector('#diploPane [data-a="jointPrepare"][data-x^="'+a+':defend:"]:not([disabled])'),fx.ally);await shot(Bp,'a6-b-joint-panel');
    await tap(Bp,'#diploPane [data-a="jointPrepare"][data-x^="'+fx.ally+':defend:"]');await wait(Bp,()=>document.querySelector('#modal [data-a="jointSend"]'));await shot(Bp,'a6-b-joint-confirm');
    const n0=await H.evaluate(()=>MP1Host.host.state.journal?MP1Host.host.state.journal.length:0);
    await tap(Bp,'#modal [data-a="jointSend"]');
    metrics.jointFeedback=await (await Bp.waitForFunction(()=>{const f=UI._jointFeedback||'';return /^(Kabul|Ret): /.test(f)&&!/host'a gönderildi/.test(f)?f:false;},undefined,{timeout:30000,polling:50})).jsonValue();
    assert.doesNotMatch(metrics.jointFeedback,/Siyasi askerî destek yetkisi yok/,'not blocked by the old player-0 rule');
    const plan=await H.evaluate(()=>(G.jointOps&&G.jointOps.plans||[]).find(p=>p.requester===1&&jointActive(p)));metrics.jointPlan=!!plan;
    if(plan){assert(plan.fleets.every(f=>f.owner!==1),'human fleets never reserved');await wait(Bp,()=>document.querySelector('[data-a="jointCancel"]'));
      await Bp.evaluate(()=>{const d=document.querySelector('#diploPane .jointOps');if(d)d.open=true;});await tap(Bp,'[data-a="jointCancel"]');
      await wait(H,id=>!jointActive(G.jointOps.plans.find(p=>p.id===id)),plan.id);}
    await shot(Bp,'a6-b-joint-result');
  });
  await test('A7 yetki: B host\'un filosunun bileşimini / kipini değiştiremez, host kolonisinin otomasyonunu değiştiremez, temas kurmadığı devlete elçi gönderemez (host\'ta hiçbir şey değişmez)',async()=>{
    const cmd=(c)=>Bp.evaluate(c=>new Promise(res=>{const cid=MP1Join.cmd(c).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x.code||x.status);}},50);}),c);
    const hf=await H.evaluate(()=>G.fleets.find(f=>f.e===0&&f.ships.length).id),hc=await H.evaluate(()=>{const c=G.p.colonies[0];return [c.s,G.sys[c.s].planets.find(q=>q.i===c.p).i];});
    const snap=()=>H.evaluate(([f,c])=>JSON.stringify([G.fleets.find(x=>x.id===f).composition||null,G.fleets.find(x=>x.id===f).bombMode||null,!!G.sys[c[0]].planets.find(q=>q.i===c[1]).col.auto]),[hf,hc]),s0=await snap();
    assert.equal(await cmd({kind:'composition',fleet:hf,counts:{},auto:true}),'not-owner');assert.equal(await cmd({kind:'bombMode',fleet:hf,mode:'yikici'}),'not-owner');
    assert.equal(await cmd({kind:'colAuto',sys:hc[0],planet:hc[1]}),'not-owner');
    const noC=await H.evaluate(()=>(G.emps.find(e=>e.id!==1&&!e.dead&&!G.emps[1].contact[e.id])||{}).id);if(noC!==undefined)assert.equal(await cmd({kind:'envoy',target:noC,task:'yakinlasma'}),'no-target');
    assert.equal(await snap(),s0,'host fleet / colony unchanged');
  });
  /* ---------- B: host + 2 misafir (B 800×360, C 915×412) ---------- */
  const H2=await (await bH.newContext(PHONE(844,390))).newPage(),B2=await (await bB.newContext(PHONE(800,360))).newPage(),C2=await (await bC.newContext(PHONE(915,412))).newPage();
  for(const [n,p] of [['host2',H2],['B2',B2],['C2',C2]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  await test('B1 host + 2: C (915×412) insan B\'ye gerçek pencereden elçi gönderir → host uygular; B\'nin aynasında C\'nin elçi haritası yok (gizlilik); B, C\'nin filosunu yönetemez',async()=>{
    await room(H2,3,[[B2,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}],[C2,'Cem',{name:'Okyanus Ticaret Birliği',mizac:'tuccar',origin:'standart',ethics:['aut:-1','mat:1'],civics:['maden_lonca']}]]);
    const bLocal=await real(C2,1);
    await C2.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'relation');},bLocal);await tap(C2,'#diploPane [data-a="envoy"][data-x="'+bLocal+'"]');
    await wait(C2,()=>document.querySelector('#modal [data-a="envoyTask"]'));await shot(C2,'b1-c-envoy-menu');
    await tap(C2,'#modal [data-a="envoyTask"][data-x="'+bLocal+':yakinlasma"]');await wait(H2,()=>G.emps[2].envoy&&G.emps[2].envoy[1]);
    await H2.evaluate(()=>MP1Host.host.publish());await B2.waitForTimeout(1500);
    const leak=await B2.evaluate(()=>{const c=MP6Stars.S.mirror.emps.find(e=>e.name==='Okyanus Ticaret Birliği');return c?Object.keys(c.envoy||{}).length:0;});assert.equal(leak,0);
    const cf=await H2.evaluate(()=>G.fleets.find(f=>f.e===2&&f.ships.length).id);
    const r=await B2.evaluate(id=>new Promise(res=>{const cid=MP1Join.cmd({kind:'composition',fleet:id,counts:{},auto:true}).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x.code||x.status);}},50);}),cf);
    assert.equal(r,'not-owner');
  });
  await test('sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp72-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
