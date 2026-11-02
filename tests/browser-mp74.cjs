'use strict';
/* MP.7.4 — gerçek telefon gözlemlerinin düzeltmeleri: 5 karakterli oda kodu, KATIL'a hızlı çift / üçlü dokunma (tek koltuk), kapasite,
   küçük çok oyunculu düğmesi, bildirim kartını gerçek dokunmayla kaydırma, karttan KABUL / REDDET / KARŞI TEKLİF (host sonucu beklenir).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp74-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp74'));fs.mkdirSync(out,{recursive:true});
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

/* gerçek dokunma (Chromium CDP Input.dispatchTouchEvent → pointer/touch olayları) */
async function touch(p){if(!p.__cdp)p.__cdp=await p.context().newCDPSession(p);return p.__cdp;}
async function tapAt(p,x,y){const c=await touch(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function swipe(p,sel,dx){const c=await touch(p),b=await p.locator(sel).first().boundingBox();if(!b)throw Error('no '+sel);const x=b.x+b.width/2,y=b.y+b.height/2;
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+(i%2)}]});await p.waitForTimeout(16);}
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);}
async function joinTaps(p,link,name,taps){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jName',name);
  const b=await p.locator('[data-j="go"]').boundingBox();for(let i=0;i<taps;i++){await tapAt(p,b.x+b.width/2,b.y+b.height/2);await p.waitForTimeout(25);}}
async function room(H,cap,guests){
  await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup&&window.MP71Dip);
  await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
  if(cap>2){await H.selectOption('#mp7Cap',String(cap));await wait(H,c=>MP1Host.lobby.capacity===c,cap);}
  await tap(H,'#mp7EditMe');await design(H,{name:'Kızıl Muhafız',mizac:'militarist',origin:'standart',ethics:['mil:2'],civics:['kale_dok']});
  const link=await H.textContent('#mp1Link');
  for(const [p,name,d,taps] of guests){await joinTaps(p,link,name,taps||1);
    await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'),undefined,40000);
    metrics['joinErrors_'+name]=await p.evaluate(()=>MP1Join.errors.slice());await p.waitForTimeout(800);   // lobi açılışındaki 700 ms dokunma yutma penceresi (MP.7.4)
    await tap(p,'#jEditMe');await wait(p,()=>document.getElementById('mp7Head'));await design(p,d);
    await wait(p,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));await tap(p,'#jReady');}
  await wait(H,()=>MP1Host.host.canStart().ok);await H.waitForTimeout(300);await shot(H,'room-lobby-'+guests.length);
  await tap(H,'[data-m="start"]');
  for(const [p] of guests)await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,40000);
  await H.evaluate(n=>{const hs=[0,...Array.from({length:n},(_,i)=>i+1)];for(const a of hs){const A=G.emps[a];A.res.min=Math.max(A.res.min,2000);A.res.ene=Math.max(A.res.ene,2000);A.res.etk=Math.max(A.res.etk,400);
    for(const b of hs)if(a!==b){A.contact[b]=true;A.rel[b]=40;}}MP1Host.host.publish();},guests.length);
  await H.waitForTimeout(1200);
  for(const p of [H,...guests.map(g=>g[0])]){const open=await p.evaluate(()=>{const m=document.getElementById('modal');return m&&!m.classList.contains('hidden');});
    if(open){const b=await p.$('#modal [data-a="advClose"],#modal [data-a="closem"]');if(b)await tap(p,'#modal [data-a="advClose"],#modal [data-a="closem"]');else await p.evaluate(()=>UI.closeModal());
      await wait(p,()=>document.getElementById('modal').classList.contains('hidden'));}}
  for(const [p] of guests)await wait(p,n=>G.emps.filter(e=>e.id!==0&&G.p.contact[e.id]).length>=n,guests.length);
  return link;
}
const D=H=>H.evaluate(()=>MP1Host.host.dip.offers.map(o=>({id:o.id,from:o.from,to:o.to,status:o.status})));
/* host → misafir teklifi (host'un gerçek MP komutu; MP.7.1 köprüsünün kullandığı yol) */
async function hostOffer(H,to,v){const r=await H.evaluate(([to,v])=>MP1Host.host.local({kind:'offer',to,give:[{t:'res',r:'ene',v}],want:[]}),[to,v]);
  const id=await (await H.waitForFunction(([to,v])=>{const o=MP1Host.host.dip.offers.filter(o=>o.from===0&&o.to===to&&o.status==='pending'&&o.give[0]&&o.give[0].v===v).at(-1);return o?o.id:false;},[to,v],{timeout:15000,polling:100})).jsonValue();void r;return id;}
const cardSel=uid=>'#inbox .nCard[data-x="'+uid+'"]';
let relay,px,base,tls,bH,bB,bC;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  const H=await (await bH.newContext(PHONE(844,390))).newPage(),Bp=await (await bB.newContext(PHONE(800,360))).newPage();
  for(const [n,p] of [['host',H],['B',Bp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|WebSocket connection/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  const roomOf=()=>[...relay.rooms.values()].at(-1);
  await test('A1 5 karakterli kod: host kodu 5 karakter ve tiresiz; davet bağlantısı kodu taşır; yanlış kod reddedilir; KATIL\'a hızlı ÜÇ dokunma (600 ms gecikmeli ağ) tek koltuk, "oda dolu" yok; iki telefon oyuna girer',async()=>{
    /* yanlış kod: gerçek giriş ekranı */
    await Bp.goto(base+'/mp/play');await wait(Bp,()=>window.MP1Join&&document.getElementById('jCode'));
    await Bp.fill('#jCode','zzzzz');await Bp.fill('#jName','Bora');await tap(Bp,'[data-j="go"]');await wait(Bp,()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
    const cdp=await touch(Bp);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:600,downloadThroughput:-1,uploadThroughput:-1});
    const link=await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']},3]]);
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    const r=roomOf();metrics.relayClients=r.clients.size;metrics.relayDenied={...relay.stats.denied};metrics.ghostSeats=await H.evaluate(()=>MP1Host.host.stats.ghostSeats|0);
    assert.match(r.code,/^[A-HJ-NP-Z2-9]{5}$/);assert.equal(r.clients.size,1,'one seat for one phone');
    assert.equal(await H.evaluate(()=>MP1Host.lobby.players.filter(p=>!p.host).length),1);
    assert.deepEqual(metrics.joinErrors_Bora.filter(e=>e==='room-full'),[],'no room-full on triple tap');
    metrics.link=link.replace(/code=.*/,'code=…');assert.match(link,/\/mp\/play\?code=[A-HJ-NP-Z2-9]{5}$/);
  });
  await test('A2 küçük çok oyunculu düğmesi: host ve misafirde varsayılan "👥 n" (haritayı ve hız kutusunu kapatmaz); dokununca mevcut panel (kod, durum, KAYDET), tekrar dokununca kapanır',async()=>{
    for(const [p,sel] of [[H,'#mp1Mini [data-g="toggle"]'],[Bp,'#mp6Conn']]){
      await wait(p,()=>{const m=document.getElementById('mp1Mini');return m&&m.classList.contains('mp74-compact')&&m.getClientRects().length>0;});
      const r=await p.evaluate(()=>{const a=document.getElementById('mp1Mini').getBoundingClientRect(),t=document.getElementById('timepod'),b=t&&t.getBoundingClientRect();
        return {w:a.width,h:a.height,text:document.getElementById('mp1Mini').textContent.trim(),overlap:!!b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height};});
      metrics['pill_'+(p===H?'host':'B')]=r;assert(r.w<=130&&r.h<=60,JSON.stringify(r));assert.match(r.text,/👥\s*\d/);assert.equal(r.overlap,false,'pill overlaps the time box');
      await shot(p,'a2-'+(p===H?'host':'b')+'-pill');
      await tap(p,sel);await wait(p,()=>!document.getElementById('mp1Mini').classList.contains('mp74-compact'));
      const t=await p.textContent('#mp1Mini');assert.match(t,/ÇOK OYUNCULU/);if(p===H){assert.match(t,/[A-HJ-NP-Z2-9]{5}/);assert.match(t,/OYUNU KAYDET/);}else assert.match(t,/MP\.7\.4/);
      await shot(p,'a2-'+(p===H?'host':'b')+'-open');
      await tap(p,sel);await wait(p,()=>document.getElementById('mp1Mini').classList.contains('mp74-compact'));}
  });
  await test('A3 kaydırma (gerçek dokunma): küçük hareket kartı kapatmaz; sağa kaydırınca teklif kartı kalkar, karar Gelen kutusunda BEKLER, ayna yenilenince kart geri gelmez; host\'ta teklif bekler',async()=>{
    const id=await hostOffer(H,1,11);const key='mp71:'+id;await wait(Bp,k=>(G.inbox||[]).some(n=>n.key===k),key);const uid=await Bp.evaluate(k=>G.inbox.find(n=>n.key===k).uid,key);
    await shot(Bp,'a3-b-card');
    await swipe(Bp,cardSel(uid),30);assert.equal(await Bp.evaluate(k=>G.inbox.some(n=>n.key===k),key),true,'small move keeps the card');
    await swipe(Bp,cardSel(uid),230);await wait(Bp,k=>!G.inbox.some(n=>n.key===k),key);
    assert.equal(await Bp.evaluate(id=>(DiplomaticInbox.state().records.find(r=>r.mp===id)||{}).status,id),'pending','decision kept in the inbox');
    await H.evaluate(()=>MP1Host.host.publish());await Bp.waitForTimeout(3500);
    assert.equal(await Bp.evaluate(k=>G.inbox.some(n=>n.key===k),key),false,'card does not come back after mirror refresh');
    assert.equal((await D(H)).find(o=>o.id===id).status,'pending');
    /* host: AI dışı bilgi kartı sola kaydırılır */
    await H.evaluate(()=>UI.notify({kind:'wardec',data:3,ico:'⚔',pause:false,title:'SAVAŞ İLANI',sub:'deneme',key:'wd:t74'}));const hu=await H.evaluate(()=>G.inbox.find(n=>n.key==='wd:t74').uid);
    await swipe(H,cardSel(hu),-230);await wait(H,()=>!G.inbox.some(n=>n.key==='wd:t74'));
  });
  await test('A4 karttan hızlı karar (misafir): KABUL gerçek dokunmayla → host kabul eder, kaynak bir kez aktarılır; ÇİFT dokunma tek "respond"; REDDET; KARŞI TEKLİF gerçek anlaşma penceresini açar',async()=>{
    await Bp.evaluate(()=>{const c0=MP1Join.cmd;window.__cmds=[];MP1Join.cmd=function(c){__cmds.push(c.kind);return c0.apply(this,arguments);};});
    const id=await hostOffer(H,1,13),key='mp71:'+id;
    /* ayna her yenilendiğinde kartın uid'si değişir: düğmeler her seferinde teklif anahtarından bulunur */
    const btns=k=>Bp.evaluate(k=>{const n=(G.inbox||[]).find(n=>n.key===k);if(!n)return [];return [...document.querySelectorAll('#inbox [data-x^="'+n.uid+':"]')].map(b=>{const r=b.getBoundingClientRect();return {t:b.textContent,x:b.dataset.x.split(':')[1],in:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight,h:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2};});},k);
    await Bp.waitForFunction(k=>{const n=(G.inbox||[]).find(n=>n.key===k);return n&&document.querySelectorAll('#inbox [data-x^="'+n.uid+':"]').length===3;},key,{timeout:30000,polling:100});
    const L=await btns(key);await shot(Bp,'a4-b-quick');
    metrics.quickButtons=L.map(b=>[b.t,b.in,b.h]);assert.deepEqual(L.map(b=>b.t),['KABUL','REDDET','KARŞI TEKLİF']);assert(L.every(b=>b.in&&b.h>=44),JSON.stringify(L));
    const e0=await Bp.evaluate(()=>G.p.res.ene);const yb=L.find(b=>b.x==='y');
    await tapAt(Bp,yb.cx,yb.cy);await tapAt(Bp,yb.cx,yb.cy);
    await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id);await Bp.waitForTimeout(800);
    assert.equal(await Bp.evaluate(()=>__cmds.filter(k=>k==='respond').length),1,'double tap sends one command');
    await wait(Bp,([k,id])=>!G.inbox.some(n=>n.key===k)&&(DiplomaticInbox.state().records.find(r=>r.mp===id)||{}).status==='accepted',[key,id]);
    await wait(Bp,e=>G.p.res.ene>=e+13,e0);
    const tapQuick=async(k,c)=>{await Bp.waitForFunction(k=>{const n=(G.inbox||[]).find(n=>n.key===k);return n&&document.querySelectorAll('#inbox [data-x^="'+n.uid+':"]').length===3;},k,{timeout:30000,polling:100});
      const b=(await btns(k)).find(b=>b.x===c);await tapAt(Bp,b.cx,b.cy);};
    const id2=await hostOffer(H,1,17);await tapQuick('mp71:'+id2,'n');
    await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='rejected',id2);
    const id3=await hostOffer(H,1,19);await tapQuick('mp71:'+id3,'c');
    await wait(Bp,()=>document.getElementById('diploPane').classList.contains('show')||!document.getElementById('modal').classList.contains('hidden'));await shot(Bp,'a4-b-counter');
    metrics.counterView=await Bp.evaluate(()=>(document.querySelector('#diploPane.show,#modal:not(.hidden)')||{}).textContent.slice(0,200));
    assert.match(metrics.counterView,/teklif|TEKLİF|Müzakere|MÜZAKERE/i);
    assert.equal((await D(H)).find(o=>o.id===id3).status,'pending','counter screen does not decide');
    await Bp.evaluate(()=>{UI.closeModal();try{UI.closeDiplo&&UI.closeDiplo();}catch{}document.getElementById('diploPane').classList.remove('show');});
  });
  await test('A5 host karttan hızlı karar: B → host teklifi host kartında KABUL (dokunma) → kabul, bir kez',async()=>{
    const r=await Bp.evaluate(()=>MP1Join.cmd({kind:'offer',to:0,give:[{t:'res',r:'min',v:23}],want:[]}));void r;
    const id=await (await H.waitForFunction(()=>{const o=MP1Host.host.dip.offers.filter(o=>o.from===1&&o.to===0&&o.status==='pending').at(-1);return o?o.id:false;},undefined,{timeout:15000,polling:100})).jsonValue();
    await H.evaluate(()=>MP71Dip.tick());await wait(H,k=>(G.inbox||[]).some(n=>n.key===k),'mp71:'+id).catch(()=>{});
    const uid=await H.evaluate(id=>{const n=(G.inbox||[]).find(n=>typeof n.key==='string'&&n.key.includes(String(id)))||(G.inbox||[]).filter(n=>n.kind==='aideal').at(-1);return n?n.uid:null;},id);
    assert(uid,'host card');await wait(H,u=>document.querySelector('#inbox [data-x="'+u+':y"]'),uid);const m0=await H.evaluate(()=>G.p.res.min);
    await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));const m1=await H.evaluate(()=>G.p.res.min);   // ölçüm sırasında ay geliri işlemesin (gerçek hız komutu)
    await tap(H,'#inbox [data-x="'+uid+':y"]');await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id);
    assert.equal(await H.evaluate(m=>Math.round(G.p.res.min-m),m1),23);void m0;await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));
  });
  /* ---------- B: host + 2 (C 915×412); kapasite 3; dördüncü telefon reddedilir ---------- */
  for(const p of [H,Bp])await p.close().catch(()=>{});
  const H2=await (await bH.newContext(PHONE(844,390))).newPage(),B2=await (await bB.newContext(PHONE(800,360))).newPage(),C2=await (await bC.newContext(PHONE(915,412))).newPage();
  for(const [n,p] of [['host2',H2],['B2',B2],['C2',C2]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|WebSocket connection/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  await test('B1 kapasite 3: host + 2 misafir (ikisi de çift dokunmayla) girer, tek koltuk tutar; dördüncü telefon "Oda dolu." görür; host küçük düğmede 👥 3',async()=>{
    const link=await room(H2,3,[[B2,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']},2],[C2,'Cem',{name:'Okyanus Ticaret Birliği',mizac:'tuccar',origin:'standart',ethics:['aut:-1','mat:1'],civics:['maden_lonca']},2]]);
    assert.equal(roomOf().clients.size,2);assert.equal(await H2.evaluate(()=>MP1Host.lobby.players.filter(p=>!p.host).length),2);
    await wait(H2,()=>/👥\s*3/.test(document.getElementById('mp1Mini').textContent));
    const D4=await (await bC.newContext(PHONE(800,360))).newPage();await D4.goto(link);await wait(D4,()=>window.MP1Join&&document.getElementById('jName'));await D4.fill('#jName','Dördüncü');await tap(D4,'[data-j="go"]');
    await wait(D4,()=>/game-started|dolu|başladı/i.test(document.getElementById('jStatus')?document.getElementById('jStatus').textContent:''));metrics.fourth=await D4.textContent('#jStatus');await shot(D4,'b1-fourth');
    assert.equal(roomOf().clients.size,2,'fourth phone holds no seat');
  });
  await test('sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp74-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
