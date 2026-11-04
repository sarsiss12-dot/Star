'use strict';
/* MP.7.5 — savaş/barış tutarlılığı (AI → misafir barışı karttan, AKTİF SAVAŞLAR), misafirde açık panel yerinde güncellenir (yeniden yazılmaz),
   MP düğmesi sol araç sütununda, dokunmatik miktar düğmeleri (klavye açılmaz), karar bekleyen olayı kaydırma + ☰ listesinden açma.
   (MP.7.4 başlığı:) gerçek telefon gözlemlerinin düzeltmeleri: 5 karakterli oda kodu, KATIL'a hızlı çift / üçlü dokunma (tek koltuk), kapasite,
   küçük çok oyunculu düğmesi, bildirim kartını gerçek dokunmayla kaydırma, karttan KABUL / REDDET / KARŞI TEKLİF (host sonucu beklenir).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp75-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp75'));fs.mkdirSync(out,{recursive:true});
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
  catch(e){const n='tapfail-'+(++tapFail);fs.writeFileSync(path.join(out,n+'-playwright-error.json'),JSON.stringify({selector:sel,name:e.name,message:e.message,stack:e.stack},null,2));await shot(p,n);throw Error('tap '+sel+' ['+n+'] '+JSON.stringify(await p.evaluate(sel=>{const m=document.getElementById('modal'),sh=document.getElementById('mp1Sheet'),el=document.querySelector(sel),r=el&&el.getBoundingClientRect();
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
    metrics['joinErrors_'+name]=await p.evaluate(()=>MP1Join.errors.slice());
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

const cardSel=uid=>'#inbox .nCard[data-x="'+uid+'"]';
let relay,px,base,tls,bH,bB;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB]=await Promise.all([0,1].map(()=>chromium.launch(launch)));
  const H=await (await bH.newContext(PHONE(844,390))).newPage(),Bp=await (await bB.newContext(PHONE(915,412))).newPage();
  for(const [n,p] of [['host',H],['B',Bp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|WebSocket connection/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  await test('A1 oda + başlangıç; MP düğmesi host ve misafirde sol araç sütununda (#tools), hız kutusu / kaynak çubuğu / araç düğmeleriyle örtüşmez; açılınca panel, kapanınca sütuna döner',async()=>{
    await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']},1]]);
    for(const [p,sel,n] of [[H,'#mp1Mini [data-g="toggle"]','host'],[Bp,'#mp6Conn','B']]){
      await wait(p,()=>{const m=document.getElementById('mp1Mini');return m&&m.parentNode&&m.parentNode.id==='tools';});
      const r=await p.evaluate(()=>{const R=e=>e&&e.getBoundingClientRect(),m=R(document.getElementById('mp1Mini')),hit=(a,b)=>a&&b&&a.width&&b.width&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
        const others=[...document.querySelectorAll('#tools .tool, #timepod, #topbar, #convoyToggle')].filter(e=>!e.contains(document.getElementById('mp1Mini'))&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible'&&!(e.closest('.grpOut')&&!e.closest('.grpOut').classList.contains('open')));   // kapalı açılır grup görünmez
        return {m:[m.x,m.y,m.width,m.height],overlap:others.filter(e=>hit(m,R(e))).map(e=>e.id||e.className),inView:m.y>=0&&m.bottom<=innerHeight};});
      metrics['dock_'+n]=r;assert.deepEqual(r.overlap,[],n+' '+JSON.stringify(r));assert.equal(r.inView,true);await shot(p,'a1-'+n+'-dock');
      await tap(p,sel);await wait(p,()=>{const m=document.getElementById('mp1Mini');return m.parentNode.id!=='tools'&&!m.classList.contains('mp74-compact');});
      await tap(p,sel);await wait(p,()=>document.getElementById('mp1Mini').parentNode.id==='tools');}
  });
  await test('A2 misafirde açık panel yerinde güncellenir: diplomasi sayfası açıkken oyun ilerler, ayna birçok kez kurulur, panel baştan yazılmaz (surfaceKept)',async()=>{
    await Bp.evaluate(()=>{UI.openDiplo();const pane=document.getElementById('diploPane');window.__rw=0;new MutationObserver(ms=>{for(const m of ms)if(m.target===pane&&m.addedNodes.length)window.__rw++;}).observe(pane,{childList:true});});
    const b0=await Bp.evaluate(()=>MP6Stars.S.stats.builds);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:3}));
    await wait(Bp,b=>MP6Stars.S.stats.builds>=b+6,b0,60000);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
    metrics.pane=await Bp.evaluate(b=>({builds:MP6Stars.S.stats.builds-b,rewrites:window.__rw,kept:MP6Stars.S.stats.surfaceKept,minGap:MP6Stars.S.minGap,open:document.getElementById('diploPane').classList.contains('show')}),b0);
    assert(metrics.pane.builds>=6);assert.equal(metrics.pane.open,true);assert(metrics.pane.rewrites<=1,JSON.stringify(metrics.pane));assert(metrics.pane.kept>=6);
    await Bp.evaluate(()=>{UI.closeDiplo?UI.closeDiplo():document.getElementById('diploPane').classList.remove('show');});
  });
  await test('A3 savaş / barış: misafir AI ile savaşta; AI barış teklifi misafirin kartına gelir; KABUL (dokunma) → host\'ta savaş biter; AKTİF SAVAŞLAR üst sayaçla aynı sayıyı gösterir',async()=>{
    const x=await H.evaluate(()=>{const a=G.emps[1];const o=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!a.war[e.id]&&!(a.ally&&a.ally[e.id]));a.contact[o.id]=o.contact[a.id]=true;declareWar(a,o);MP1Host.host.publish();return o.id;});
    await wait(Bp,()=>UI.topStatusItems().wars>=1);
    const L=await Bp.evaluate(()=>{UI.act('activeWars');return {n:UI.activeWarsList().length,top:UI.topStatusItems().wars,html:document.getElementById('modal').textContent};});
    metrics.activeWars=L;assert.equal(L.n,L.top);assert.match(L.html,/AKTİF SAVAŞLAR/);await shot(Bp,'a3-b-active-wars');await Bp.evaluate(()=>UI.closeModal());
    const id=await H.evaluate(x=>{const e=G.emps[x];e.lastOffer=e.lastOffer||{};e.lastOffer[1]=G.day;UI.peaceOffer(e);MP1Host.host.publish();const o=MP1Host.host.dip.offers.filter(o=>o.from===x&&o.to===1&&o.status==='pending').at(-1);return o?o.id:null;},x);
    if(!id)metrics.peaceFailure=await H.evaluate(x=>({day:G.day,ai:x,aiIsAI:G.emps[x].ai,guestIsAI:G.emps[1].ai,wars:G.emps[x].war,lastOffer:G.emps[x].lastOffer,offers:MP1Host.host.dip.offers.map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,give:o.give,want:o.want}))}),x);
    assert(id,'AI peace offer to the guest');const key='mp71:'+id;
    await Bp.waitForFunction(k=>{const n=(G.inbox||[]).find(n=>n.key===k);return n&&document.querySelector('#inbox [data-x="'+n.uid+':y"]');},key,{timeout:30000,polling:100});
    const b=await Bp.evaluate(k=>{const n=G.inbox.find(n=>n.key===k),r=document.querySelector('#inbox [data-x="'+n.uid+':y"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},key);
    await shot(Bp,'a3-b-peace-card');await tapAt(Bp,b.x,b.y);
    await wait(H,([id,x])=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted'&&!G.emps[1].war[x]&&!G.emps[x].war[1],[id,x]);
    await wait(Bp,()=>UI.activeWarsList().length===UI.topStatusItems().wars);
    metrics.afterPeace=await Bp.evaluate(()=>({wars:UI.topStatusItems().wars,list:UI.activeWarsList().length}));
  });
  await test('A4 dokunmatik miktar: filo bileşimi penceresinde SIFIR / −50 / −10 / +10 / +50 (dokunma), klavye açılmaz; anlaşma miktarında pencerenin kendi düğmeleri korunur (çift kontrol yok)',async()=>{
    await Bp.evaluate(()=>{UI.openDiplo();UI.selectDiplo(1,'deal');});
    await tap(Bp,'#diploPane [data-a="dealAdd"][data-x="give:res"]');await tap(Bp,'#modal [data-a="pickOne"][data-x="0"]');
    /* anlaşma miktarı penceresinin kendi ±10 ve hazır miktar düğmeleri var: ek satır eklenmez (çift kontrol yok) */
    await wait(Bp,()=>document.getElementById('dealAmountInput'));await shot(Bp,'a4-b-deal-qty');
    assert.equal(await Bp.evaluate(()=>document.querySelectorAll('#modal .qtySteps').length),0,'no duplicate stepper next to the window\'s own amount buttons');
    await Bp.evaluate(()=>{UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
    const fid=await H.evaluate(()=>G.fleets.find(f=>f.e===0&&f.ships.length&&!f.federal).id);
    await H.evaluate(id=>{View.sel=G.fleets.find(f=>f.id===id);UI.tab('filo');UI.refresh();},fid);await tap(H,'[data-a="compositionEdit"][data-x="'+fid+'"]');
    await wait(H,()=>document.querySelector('#modal .qtySteps'));const first=await H.evaluate(()=>document.querySelector('#modal input[id^="fc-"]').id);
    const steps=await H.evaluate(()=>[...document.querySelector('#modal .qtySteps').querySelectorAll('.qtyStep')].map(b=>b.textContent));metrics.fleetSteps=steps;
    assert.deepEqual(steps.slice(0,5),['SIFIR','−50','−10','+10','+50']);
    const c0=+(await H.inputValue('#'+first));await H.locator('#modal .qtySteps').first().locator('.qtyStep:text-is("+10")').tap();
    assert.equal(+(await H.inputValue('#'+first)),c0+10);assert.notEqual(await H.evaluate(()=>document.activeElement&&document.activeElement.tagName),'INPUT','keyboard not opened');
    await H.locator('#modal .qtySteps').first().locator('.qtyStep:text-is("SIFIR")').tap();assert.equal(+(await H.inputValue('#'+first)),0);await shot(H,'a4-host-fleet-qty');await H.evaluate(()=>UI.closeModal());
  });
  await test('A5 karar bekleyen olay kaydırılınca gizlenir (silinmez), ☰ durum listesinde kalır ve oradan aynı karar penceresi açılır',async()=>{
    await H.evaluate(()=>{UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
    await H.evaluate(()=>UI.notify({kind:'criswarn',data:2400,ico:'🔮',pause:false,title:'KRİZ KEHANETİ',sub:'deneme',key:'cw:t75'}));
    const u=await H.evaluate(()=>G.inbox.find(n=>n.key==='cw:t75').uid);await swipe(H,cardSel(u),230);
    await wait(H,u=>!document.querySelector('#inbox .nCard[data-x="'+u+'"]')&&G.inbox.find(n=>n.uid===u).hidden,u);
    assert.equal(await H.evaluate(u=>UI.topStatusItems().items.some(i=>i.x===String(u)),u),true);
    await H.evaluate(u=>UI.act('openNote',String(u)),u);await wait(H,()=>/KRİZ KEHANETİ/.test(document.getElementById('modal').textContent));await H.evaluate(()=>UI.closeModal());
  });
  await test('sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp75-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
