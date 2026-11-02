'use strict';
/* MP.7.1 — TEK STARS ARAYÜZÜ: insanlar arası teklifler gerçek anlaşma penceresi ve gerçek gelen kutusunda (ayrı MP diplomasi paneli yok).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp71-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp71'));fs.mkdirSync(out,{recursive:true});
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

  /* ---------- A: host + 1 misafir (zorunlu senaryo) ---------- */
  await test('A1 oda, iki tasarım (gerçek kurulum ekranı), başlat; ikisi de haritayı görür; ayrı ÇOK OYUNCULU DİPLOMASİ paneli ve düğmesi YOK (host ve misafir)',async()=>{
    await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}]]);
    for(const p of [H,Bp]){const x=await p.evaluate(()=>({map:!!document.getElementById('map')&&!document.getElementById('game').classList.contains('hidden'),
      btn:!!document.getElementById('mp3HostBtn')||!!document.getElementById('mp6DipBtn'),panel:!!document.getElementById('mp3Host'),txt:/ÇOK OYUNCULU DİPLOMASİ/.test(document.body.innerText)}));
      assert.deepEqual(x,{map:true,btn:false,panel:false,txt:false});}
    assert.equal(await Bp.evaluate(()=>G.p.name),'Saf Akıl Ağı');await shot(H,'a1-host-map');await shot(Bp,'a1-b-map');
    /* diğer paneller denetimi: misafirde MP komutu olmayan (soluk + uyarı) gerçek STARS eylemleri — envanter (MULTIPLAYER-MP71-SONUC.md) */
    await wait(Bp,()=>MP6Stars.S.unsupported&&MP6Stars.S.unsupported.length>0&&document.getElementById('mp6Disabled').textContent.length>0);
    metrics.unsupported=await Bp.evaluate(()=>MP6Stars.S.unsupported);assert(!metrics.unsupported.includes('dealSend')&&!metrics.unsupported.includes('tab'),'view/supported actions are not dimmed');
    /* Ekonomi Merkezi görünüm eylemi misafirde çalışır (engellenmez): kaynak seçimi */
    const eco=await Bp.evaluate(()=>{const b0=JSON.stringify(MP6Stars.S.stats.blocked);UI.act('globalPane','ekonomi');UI.act('ecoPick','ene');const r={res:EconomyUI.resource,blocked:JSON.stringify(MP6Stars.S.stats.blocked)===b0};UI.act('closeDiplo');return r;});
    assert.deepEqual(eco,{res:'ene',blocked:true});metrics.hooks=await Bp.evaluate(()=>[...MP6Stars.S.hooks].sort());
  });
  let o1;
  if(process.env.MP71_STOP==='A1')throw Error('stop');
  await test('A2 host GERÇEK anlaşma penceresinden B\'ye teklif sunar (kaynak ver / kaynak iste); pencerede insan oyuncu notu; teklif host deposunda bekler, B\'nin stoğu host\'a gösterilmez',async()=>{
    await openDeal(H,1);await wait(H,()=>document.getElementById('mp71DealBox')&&/insan oyuncu/.test(document.getElementById('mp71DealBox').textContent));
    await addRes(H,'give','min',50);await addRes(H,'want','ene',10);
    const leak=await H.evaluate(()=>[...document.querySelectorAll('#diploPane .mini')].some(e=>e.textContent.startsWith('🔒')&&e.textContent.includes(G.emps[1].name+' →')));assert.equal(leak,false);
    await shot(H,'a2-host-deal');await tap(H,'#diploPane [data-a="dealSend"]');
    await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===0&&o.to===1&&o.status==='pending'));o1=(await D(H)).find(o=>o.from===0&&o.to===1).id;
    await wait(H,()=>/BEKLEYEN TEKLİFLERİN \(1\)/.test((document.getElementById('mp71DealBox')||{}).textContent||''));await shot(H,'a2-host-deal-pending');
  });
  await test('A3 B teklifi GERÇEK gelen kutusu kartından açar, yatay 800×360\'ta KABUL ET / REDDET / Karşı teklif görünür ve çakışmaz; KABUL ET → host uygular (kaynaklar el değiştirir), iki tarafta Kabul edildi',async()=>{
    const b0=await H.evaluate(()=>[G.emps[1].res.min,G.emps[0].res.ene]);
    await openCard(Bp,'mp71:'+o1);await shot(Bp,'a3-b-inbox-record');
    assert.match(await Bp.textContent('#mp71Context'),/Çok oyunculu teklif/);assert.doesNotMatch(await Bp.textContent('#modal'),/27 ay/);
    const L=await layout(Bp,['#inboxYes','#inboxNo','#inboxCounter']);assert.deepEqual(L.bad,[],JSON.stringify(L));
    await tap(Bp,'#inboxYes');await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',o1);
    const b1=await H.evaluate(()=>[G.emps[1].res.min,G.emps[0].res.ene]);assert(b1[0]>=b0[0]+50-1e-6&&b1[1]>=b0[1]+10-1e-6,JSON.stringify([b0,b1]));
    await wait(Bp,()=>!(G.inbox||[]).some(n=>typeof n.key==='string'&&n.key.startsWith('mp71:')));
    await H.keyboard.press('Escape').catch(()=>{});await H.evaluate(()=>{document.getElementById('diploPane').classList.remove('show');ArchiveUI.open('inbox');});
    await tap(H,'#mp71SentTab');await wait(H,id=>{const r=document.querySelector('.mp71Row[data-offer="'+id+'"] .archiveState');return r&&r.textContent==='Kabul edildi';},o1);await shot(H,'a3-host-sent-accepted');
    await H.evaluate(()=>UI.closeModal());
  });
  let o2,c2;
  await test('A4 B gerçek anlaşma penceresinden host\'a teklif; host GERÇEK gelen kutusu kartından açar → Karşı teklif hazırla → anlaşma penceresi (orijinal saklı kart) → TEKLİFİ SUN = karşı teklif; B kartı görür ve REDDEDER; B\'nin Gönderilen sekmesi durumu gösterir',async()=>{
    await Bp.evaluate(()=>UI.closeModal());const me=1;await openDeal(Bp,me);   // B'nin aynasında host = devlet 1 (π)
    await wait(Bp,()=>document.getElementById('mp71DealBox'));await addRes(Bp,'give','ene',100);await addRes(Bp,'want','min',10);
    await tap(Bp,'#diploPane [data-a="dealSend"]');await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===1&&o.to===0&&o.status==='pending'));
    o2=(await D(H)).find(o=>o.from===1&&o.to===0&&o.status==='pending').id;
    await H.evaluate(()=>MP71Dip.tick());await openCard(H,'mp71:'+o2);await shot(H,'a4-host-inbox-record');
    const L=await layout(H,['#inboxYes','#inboxNo','#inboxCounter']);assert.deepEqual(L.bad,[],JSON.stringify(L));
    await tap(H,'#inboxCounter');await wait(H,()=>document.getElementById('diploPane').classList.contains('show')&&UI.dealCounter&&MP71Dip.counter);
    await addRes(H,'want','ene',10);await shot(H,'a4-host-counter-draft');await tap(H,'#diploPane [data-a="dealSend"]');
    await wait(H,id=>MP1Host.host.dip.offers.some(o=>o.prev===id&&o.from===0&&o.status==='pending'),o2);c2=(await D(H)).find(o=>o.prev===o2).id;
    assert.equal((await D(H)).find(o=>o.id===o2).status,'countered');
    await openCard(Bp,'mp71:'+c2);assert.match(await Bp.textContent('#modal'),/Karşı teklif/);await tap(Bp,'#inboxNo');
    await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='rejected',c2);
    await Bp.evaluate(()=>{UI.closeModal();ArchiveUI.open('inbox');});await tap(Bp,'#mp71SentTab');
    await wait(Bp,id=>{const r=document.querySelector('.mp71Row[data-offer="'+id+'"] .archiveState');const row=document.querySelector('.mp71Row[data-offer="'+id+'"] .mp71-st');return r&&r.textContent==='Karşı teklif'&&row&&/Karşı teklif geldi · reddedildi/.test(row.textContent);},o2);await shot(Bp,'a4-b-sent');
    /* host'un gerçek gelen kutusunda geçmiş: B'nin teklifi "Karşı teklif gönderildi" durumunda */
    await wait(H,()=>DiplomaticInbox.state().records.some(r=>r.kind==='aideal'&&r.from===1&&r.status==='countered'));
  });
  let o3;
  await test('A5 GERİ ÇEK: host anlaşma sayfasındaki "BEKLEYEN TEKLİFLERİN" kutusundan iki adımlı onayla geri çeker; B\'nin kartı kalkar, gelen kutusu geçmişinde Geçersizleşti · Gönderen geri çekti; çift dokunuş tek komut',async()=>{
    await Bp.evaluate(()=>UI.closeModal());await openDeal(H,1);await addRes(H,'give','min',10);await tap(H,'#diploPane [data-a="dealSend"]');
    await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===0&&o.to===1&&o.status==='pending'));o3=(await D(H)).find(o=>o.from===0&&o.to===1&&o.status==='pending').id;
    await cardUid(Bp,'mp71:'+o3);
    await tap(H,'#mp71DealBox [data-mp71="dealWithdrawAsk"][data-x="'+o3+'"]');await H.waitForTimeout(500);await shot(H,'a5-host-withdraw-confirm');
    const w0=await H.evaluate(()=>MP71Dip.stats.withdraws);await H.locator('#mp71DealBox [data-mp71="dealWithdrawYes"]').first().tap();await H.locator('#mp71DealBox [data-mp71="dealWithdrawYes"]').first().tap({timeout:500}).catch(()=>{});
    await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='invalid',o3);assert.equal(await H.evaluate(()=>MP71Dip.stats.withdraws)-w0,1);
    await wait(Bp,k=>!(G.inbox||[]).some(n=>n.key===k),'mp71:'+o3);
    await Bp.evaluate(()=>ArchiveUI.open('inbox'));await wait(Bp,()=>[...document.querySelectorAll('#archiveRows .archiveRow')].some(r=>/geri çekti/.test(r.textContent)&&/Geçersizleşti/.test(r.textContent)));await shot(Bp,'a5-b-inbox-history');
  });
  await test('A6 açık pencere korunur: B Gönderilen sekmesi açıkken host B\'nin teklifini kabul eder → satır yerinde "Kabul edildi" olur (pencere kapanmaz, liste öğesi aynı); B\'nin anlaşma taslağı yeni ayna gelince korunur',async()=>{
    await Bp.evaluate(()=>UI.closeModal());await openDeal(Bp,1);await addRes(Bp,'give','ene',50);await tap(Bp,'#diploPane [data-a="dealSend"]');
    await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===1&&o.to===0&&o.status==='pending'));const id=(await D(H)).find(o=>o.from===1&&o.to===0&&o.status==='pending').id;
    await Bp.evaluate(()=>{document.getElementById('diploPane').classList.remove('show');ArchiveUI.open('inbox');});await tap(Bp,'#mp71SentTab');
    await wait(Bp,id=>document.querySelector('.mp71Row[data-offer="'+id+'"]'),id);await Bp.evaluate(()=>{document.getElementById('archiveRows').__keep=1;});
    await H.evaluate(()=>MP71Dip.tick());await openCard(H,'mp71:'+id);await tap(H,'#inboxYes');await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id);
    await wait(Bp,id=>{const r=document.querySelector('.mp71Row[data-offer="'+id+'"] .archiveState');return r&&r.textContent==='Kabul edildi';},id);
    assert.equal(await Bp.evaluate(()=>document.getElementById('archiveRows').__keep===1&&!document.getElementById('modal').classList.contains('hidden')),true,'open window kept');
    await shot(Bp,'a6-b-sent-live');await H.evaluate(()=>UI.closeModal());
    /* taslak korunur: B anlaşma sayfasında yarım taslak; host yeni ayna üretir (gün ilerler) */
    await Bp.evaluate(()=>UI.closeModal());await openDeal(Bp,1);await addRes(Bp,'give','min',10);
    const b0=await Bp.evaluate(()=>MP6Stars.S.stats.builds);await wait(Bp,b=>MP6Stars.S.stats.builds>b+1,b0);   // oyun 1× akıyor: host yeni günlerde ayna farkı yayımlar
    assert.deepEqual(await Bp.evaluate(()=>[document.getElementById('diploPane').classList.contains('show'),UI.diploPage,UI.deal&&UI.deal.give.length]),[true,'deal',1]);
  });
  await test('A7 yetkisiz ve yinelenen kararlar host\'ta reddedilir (kendi teklifine yanıt, başkasının teklifini geri çekme, sonuçlanmış teklife ikinci kabul); bağlantı kopması sırasında gelen teklif dönüşte kartta, tek uygulama',async()=>{
    const cmd=(c)=>Bp.evaluate(c=>new Promise(res=>{const cid=MP1Join.cmd(c).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x.code||x.status);}},50);}),c);
    assert.equal(await cmd({kind:'respond',offer:o2,action:'accept'}),'rules:not-recipient');
    assert.equal(await cmd({kind:'withdraw',offer:o3}),'rules:not-sender');
    assert.equal(await cmd({kind:'respond',offer:o1,action:'accept'}),'rules:closed');
    await Bp.evaluate(()=>{UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
    await Bp.context().setOffline(true);
    await openDeal(H,1);await addRes(H,'give','min',10);await tap(H,'#diploPane [data-a="dealSend"]');
    await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===0&&o.to===1&&o.status==='pending'));const id=(await D(H)).find(o=>o.from===0&&o.to===1&&o.status==='pending').id;
    await Bp.waitForTimeout(2500);await Bp.context().setOffline(false);
    const m0=await H.evaluate(()=>G.emps[1].res.min);await openCard(Bp,'mp71:'+id);await tap(Bp,'#inboxYes');
    await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id);
    assert.equal(await cmd({kind:'respond',offer:id,action:'accept'}),'rules:closed');
    assert(Math.abs(await H.evaluate(()=>G.emps[1].res.min)-m0-10)<1,'applied exactly once');
  });
  await test('A8 kayıt: MP.4 paketi teklif deposunu (Gönderilen / geçmiş durumları) ve host\'un gerçek gelen kutusu kayıtlarını (Save8) taşır; paket doğrulanır',async()=>{
    const r=await H.evaluate(()=>{const s=MP1Host.host.snapshot({});const v=StarsMP.validatePackage(JSON.stringify(s.pkg));const sv=JSON.parse(s.pkg.save8);
      return {ok:s.ok&&v.ok,st:s.pkg.diplomacy.offers.map(o=>o.status).sort(),inbox:(sv.diplomaticInbox||{records:[]}).records.filter(r=>r.kind==='aideal'&&r.from===1).map(r=>r.status).sort()};});
    assert.equal(r.ok,true);assert(r.st.includes('accepted')&&r.st.includes('countered')&&r.st.includes('invalid')&&r.st.includes('rejected'),JSON.stringify(r.st));
    assert(r.inbox.includes('countered')&&r.inbox.includes('accepted'),JSON.stringify(r.inbox));
  });

  /* ---------- B: host + 2 misafir — insan ↔ insan (host aracı, karar insanların) ---------- */
  const H2=await (await bH.newContext(PHONE(844,390))).newPage(),B2=await (await bB.newContext(PHONE(800,360))).newPage(),C2=await (await bC.newContext(PHONE(915,412))).newPage();
  for(const [n,p] of [['host2',H2],['B2',B2],['C2',C2]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  let bc,cb;
  await test('B1 host + 2 misafir: B, C\'ye gerçek anlaşma penceresinden teklif; C 915×412\'de gerçek gelen kutusu kartından açar, Karşı teklif hazırla → TEKLİFİ SUN; B karşı teklifi kartından KABUL EDER; host uygular',async()=>{
    await room(H2,3,[[B2,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}],[C2,'Cem',{name:'Okyanus Ticaret Birliği',mizac:'tuccar',origin:'standart',ethics:['aut:-1','mat:1'],civics:['maden_lonca']}]]);
    await openDeal(B2,2);await wait(B2,()=>/insan oyuncu/.test((document.getElementById('mp71DealBox')||{}).textContent||''));
    await addRes(B2,'give','min',100);await addRes(B2,'want','ene',50);await tap(B2,'#diploPane [data-a="dealSend"]');
    await wait(H2,()=>MP1Host.host.dip.offers.some(o=>o.from===1&&o.to===2&&o.status==='pending'));bc=(await D(H2)).find(o=>o.from===1&&o.to===2).id;
    await openCard(C2,'mp71:'+bc);await shot(C2,'b1-c-inbox-record');const L=await layout(C2,['#inboxYes','#inboxNo','#inboxCounter']);assert.deepEqual(L.bad,[],JSON.stringify(L));
    await tap(C2,'#inboxCounter');await wait(C2,()=>document.getElementById('diploPane').classList.contains('show')&&UI.dealCounter);
    await tap(C2,'#diploPane [data-a="dealRm"][data-x="give:0"]');await addRes(C2,'give','ene',10);await shot(C2,'b1-c-counter');await tap(C2,'#diploPane [data-a="dealSend"]');
    await wait(H2,id=>MP1Host.host.dip.offers.some(o=>o.prev===id&&o.from===2&&o.status==='pending'),bc);cb=(await D(H2)).find(o=>o.prev===bc).id;
    /* ölçüm sırasında ekonomi akmasın: ortak hız host komutuyla 0 (gerçek hız düğmesiyle aynı yol), sonra geri */
    await H2.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await H2.waitForTimeout(300);
    const m0=await H2.evaluate(()=>[G.emps[1].res.min,G.emps[2].res.min,G.emps[1].res.ene,G.emps[2].res.ene]);
    await openCard(B2,'mp71:'+cb);await shot(B2,'b1-b-counter-record');await tap(B2,'#inboxYes');
    await wait(H2,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',cb);
    const m1=await H2.evaluate(()=>[G.emps[1].res.min,G.emps[2].res.min,G.emps[1].res.ene,G.emps[2].res.ene]);
    await H2.evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));
    const d=m1.map((x,i)=>Math.round(x-m0[i]));assert.deepEqual(d,[-100,100,10,-10],JSON.stringify([m0,m1]));   // karşı teklifin şartları: C 10 enerji verir, 100 mineral alır
  });
  await test('B2 gizlilik ve yetki: host\'un gelen kutusunda / görünümünde B–C teklifi yok; C\'nin aynasında B\'nin stoğu yok; C, B–C karşı teklifini (kendi gönderdiği) kabul edemez',async()=>{
    const h=await H2.evaluate(()=>({recs:DiplomaticInbox.state().records.filter(r=>r.from===1||r.from===2).length,view:MP1Host.host.dipView(G.p).offers.length,cards:(G.inbox||[]).filter(n=>String(n.key).startsWith('mp71:')).length}));
    assert.deepEqual(h,{recs:0,view:0,cards:0});
    const c=await C2.evaluate(()=>{const b=MP6Stars.S.mirror.emps.find(e=>e.name==='Saf Akıl Ağı');return Object.values(b.res).reduce((a,x)=>a+(+x||0),0);});assert.equal(c,0);
    const r=await C2.evaluate(id=>new Promise(res=>{const cid=MP1Join.cmd({kind:'respond',offer:id,action:'accept'}).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x.code);}},50);}),cb);
    assert.equal(r,'rules:not-recipient');
  });
  await test('B3 B\'nin Gönderilen sekmesi (yatay 800×360): satır, şartlar, durum; ayrıntıda yanıt ve geri dönüş düğmeleri ekranda',async()=>{
    await B2.evaluate(()=>{UI.closeModal();ArchiveUI.open('inbox');});await tap(B2,'#mp71SentTab');
    await wait(B2,id=>{const r=document.querySelector('.mp71Row[data-offer="'+id+'"] .archiveState');const row=document.querySelector('.mp71Row[data-offer="'+id+'"] .mp71-st');return r&&row&&/Karşı teklif geldi · kabul edildi/.test(row.textContent);},bc);
    await tap(B2,'.mp71Row[data-offer="'+bc+'"] [data-mp71="detail"]');await wait(B2,()=>document.getElementById('mp71SentDetail'));await shot(B2,'b3-b-sent-detail');
    const L=await layout(B2,['#modal [data-mp71="sent"]']);assert.deepEqual(L.bad,[],JSON.stringify(L));
  });
  await test('sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp71-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
