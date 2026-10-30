'use strict';
/* MP.1.1 — üretim kipindeki relay, TLS sonlandıran ters vekil arkasında, HTTPS/WSS üzerinden
   iki ayrı Chromium sürecinden (host telefon + misafir telefon) uçtan uca akış.
   Sertifika yerel ve kendinden imzalı; Chromium yalnız bu sertifikanın SPKI özetine güvenir
   (--ignore-certificate-errors-spki-list), genel sertifika denetimi kapatılmaz.
   BU GERÇEK İNTERNET TESTİ DEĞİLDİR: hepsi aynı makinede, gerçek TCP/TLS yığınıyla.
   Ayrıca: arka plan/ekran kilidi (görünürlük + Page Lifecycle dondurma), 4× CPU kısıtlı
   host maliyeti (45/60/100 sistem), istemci kaynakları.
   Çıktı: $STARS_OUTPUT/mp11-results.json + ekran görüntüleri. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp11'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const results=[],errors=[],metrics={};
let relay,px,base,bH,bG,bX,H,Gp,ctxH,code,hostKey;
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(page,fn,arg,timeout=20000)=>page.waitForFunction(fn,arg,{timeout,polling:100});   // rAF arka plan sekmesinde durur
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const freePort=()=>new Promise(res=>{const s=require('net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
async function setHidden(page,hidden){return page.evaluate(h=>{Object.defineProperty(document,'hidden',{get:()=>h,configurable:true});
  Object.defineProperty(document,'visibilityState',{get:()=>h?'hidden':'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));},hidden);}

(async()=>{const tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info','--ignore-certificate-errors-spki-list='+spki]};
  bH=await chromium.launch(launch);bG=await chromium.launch(launch);bX=await chromium.launch(launch);       // 3 ayrı tarayıcı süreci
  ctxH=await bH.newContext({...PHONE(412,915),serviceWorkers:'allow'});const ctxG=await bG.newContext(PHONE(360,800));
  H=await ctxH.newPage();Gp=await ctxG.newPage();
  for(const [n,p] of [['host',H],['guest',Gp]])p.on('pageerror',e=>errors.push(n+': '+e.message));
  const perf={};for(const [n,p] of [['host',H],['guest',Gp]]){perf[n]=await p.context().newCDPSession(p);await perf[n].send('Performance.enable');}

  await test('HTTPS: game page and MP layer load over TLS through the reverse proxy; plain HTTP on the relay port is redirected; secure context',async()=>{
    const t0=Date.now();await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));metrics.hostPageLoadMs=Date.now()-t0;
    const s=await H.evaluate(()=>({proto:location.protocol,secure:isSecureContext,build:BUILD_ID}));assert.deepEqual(s,{proto:'https:',secure:true,build:'96h10'});
    const r=await new Promise((ok,no)=>require('http').get({host:'127.0.0.1',port:rs.address().port,path:'/mp/join?code=X',headers:{host:'localhost:'+pport}},x=>{x.resume();ok(x);}).on('error',no));
    assert.equal(r.statusCode,308);assert.equal(r.headers.location,base+'/mp/join?code=X');
    const hs=await H.evaluate(async()=>{const r=await fetch('/healthz');return [r.status,await r.text()];});assert.deepEqual(hs,[200,'{"ok":true}']);
  });
  await test('host phone opens a room over WSS; the host key never appears in a URL or on the page',async()=>{
    await H.locator('#mp1Btn').tap();await wait(H,()=>MP1Host.screen==='menu');const t0=Date.now();await H.locator('[data-m="create"]').tap();
    await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');metrics.roomCreateMs=Date.now()-t0;
    ({code,key:hostKey}=await H.evaluate(()=>({code:MP1Host.code,key:MP1Host.key})));
    const urls=await H.evaluate(()=>MP1Host.urls);assert(urls.every(u=>u.startsWith('wss://localhost:')&&!u.includes(hostKey)),urls.join());
    assert(!(await H.content()).includes(hostKey));assert.equal(await H.textContent('#mp1Link'),base+'/mp/play?code='+code);
    await H.evaluate(()=>MP1Host.host.configure({size:'orta',aiCount:5,seed:11}));
  });
  await test('guest phone (separate browser process) opens the HTTPS invite link and joins over WSS; the guest page loads no engine',async()=>{
    const link=(await H.textContent('#mp1Link')).replace('/mp/play?','/mp/join?');const t0=Date.now();await Gp.goto(link);   // MP.6: bu paketin misafir vakaları hafif istemciyle (/mp/join); gerçek arayüz browser-mp6'daawait wait(Gp,()=>window.MP1Join&&document.getElementById('jCode'));
    await Gp.fill('#jName','Ayşe');await Gp.locator('[data-j="go"]').tap();await wait(Gp,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);metrics.inviteToLobbyMs=Date.now()-t0;
    const g=await Gp.evaluate(()=>({proto:location.protocol,ws:MP1Join.ws&&MP1Join.ws.url,engine:typeof G+typeof setupGame,connectMs:MP1Join.stats.connectMs}));
    assert.equal(g.proto,'https:');assert.match(g.ws,/^wss:\/\/localhost:\d+\/mp1\/ws\?role=client&code=/);assert.equal(g.engine,'undefinedundefined');metrics.guestConnectMs=g.connectMs;
    await wait(H,()=>MP1Host.lobby.players.length===2);await shot(Gp,'guest-lobby-https');
  });
  await test('lobby over the internet path: claim, ready, start; both phones show the same players and game time',async()=>{
    await Gp.locator('[data-j="claim"][data-e="3"]').tap();await wait(H,()=>MP1Host.lobby.players[1].claim===3);
    await Gp.locator('#jReady').tap();await wait(H,()=>MP1Host.host.canStart().ok);
    const rev=await H.evaluate(()=>MP1Host.lobby.rev);await wait(Gp,r=>MP1Join.lobby.rev>=r,rev);
    assert.deepEqual(await Gp.evaluate(()=>MP1Join.lobby.players),await H.evaluate(()=>MP1Host.lobby.players));
    const t0=Date.now();await H.locator('[data-m="start"]').tap();await wait(Gp,()=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===3);metrics.startMs=Date.now()-t0;
    await H.evaluate(()=>UI.setSpeed(0));
    for(const d of [15,30]){await H.evaluate(n=>MP1Host.advance(n),d);const hd=await H.evaluate(()=>Math.floor(G.day));await wait(Gp,x=>MP1Join.game.clock.day===x,hd);}
    assert.deepEqual(await H.evaluate(()=>G.emps.map(e=>e.ai)),[false,true,true,false,true,true,true]);
  });
  await test('real STARS command from the guest phone over WSS: santral is queued by the host engine and shown on both sides',async()=>{
    const col=await H.evaluate(()=>{const e=G.emps[3];for(const c of e.colonies){const pl=G.sys[c.s].planets[c.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl))return {s:c.s,p:c.p,q:(pl.col.q||[]).length};}});
    assert(col,'free slot');await Gp.locator('.mp2-nav [data-tab="cols"]').tap();   // MP.2: KOLONİLER sekmesi
    await Gp.selectOption('select[data-col="'+col.s+':'+col.p+'"]','santral');
    const t0=Date.now();await Gp.locator('button[data-j="build"][data-col="'+col.s+':'+col.p+'"]').tap();await wait(Gp,()=>MP1Join.results.some(r=>r.status==='ok'));metrics.commandMs=Date.now()-t0;
    assert.equal(await H.evaluate(c=>G.sys[c.s].planets[c.p].col.q.at(-1).key,col),'santral');
    await wait(Gp,c=>MP1Join.game.view.cols[c.s+':'+c.p].q.some(w=>w.k==='santral'),col);
    await Gp.waitForTimeout(6500);metrics.rttMs=await Gp.evaluate(()=>MP1Join.stats.rtt.slice());assert(metrics.rttMs.length>=1);
  });
  await test('Android background / screen lock on the host: game pauses safely, guests see why, commands are refused, frozen tab resumes at the old speed',async()=>{
    await H.evaluate(()=>UI.setSpeed(1));
    // gerçek arka plan: aynı bağlamda başka sekme öne gelir (Chromium başsız kipte görünürlük değişmezse taklit edilir)
    const other=await ctxH.newPage();await other.goto('about:blank');await other.bringToFront();await H.waitForTimeout(300);
    let real=await H.evaluate(()=>document.visibilityState==='hidden');if(!real)await setHidden(H,true);
    metrics.backgroundMethod=real?'gerçek görünürlük (öne başka sekme)':'görünürlük olayı taklidi';
    await wait(H,()=>G.speed===0&&MP1Host.host.lobby.pause==='host-background');
    await wait(Gp,()=>/arka plana aldı/.test(document.getElementById('jConn').textContent));await shot(Gp,'guest-host-background');
    const cdp=await ctxH.newCDPSession(H);
    try{
      await cdp.send('Page.setWebLifecycleState',{state:'frozen'}).catch(e=>{metrics.freezeError=e.message;});   // Android sekmeyi dondurur
      const n0=await Gp.evaluate(()=>MP1Join.results.length),q0=await H.evaluate(()=>0).catch(()=>null);void q0;
      await Gp.evaluate(()=>{const v=MP1Join.game.view,c=Object.values(v.cols)[0];MP1Join.cmd({kind:'build',sys:c.s,planet:c.p,key:'santral'});});
      await Gp.waitForTimeout(2500);metrics.freezeApplied=(await Gp.evaluate(()=>MP1Join.results.length))===n0;
      await cdp.send('Page.setWebLifecycleState',{state:'active'}).catch(()=>{});
      await wait(Gp,n=>MP1Join.results.length>n,n0);assert.equal(await Gp.evaluate(()=>MP1Join.results.at(-1).code),'paused','the command is refused, not applied, while the host is in the background');
    }finally{await cdp.send('Page.setWebLifecycleState',{state:'active'}).catch(()=>{});if(real)await H.bringToFront();else await setHidden(H,false);await other.close();}
    await wait(H,()=>G.speed===1&&!MP1Host.host.lobby.pause);await wait(Gp,()=>/^Bağlı/.test(document.getElementById('jConn').textContent));
    await H.evaluate(()=>UI.setSpeed(0));
    assert.equal(await H.evaluate(()=>MP1Host.connected),true,'WSS survived the freeze');
  });
  await test('network loss and recovery over WSS: guest drop keeps the seat; guest page reload rejoins by itself; host drop pauses and the host reattaches with its key',async()=>{
    const room=relay.rooms.get(code);const gid=[...room.clients.keys()][0];room.clients.get(gid).socket.destroy();
    await wait(H,()=>MP1Host.lobby.players[1].online===false);await wait(H,()=>MP1Host.lobby.players[1].online===true,undefined,30000);
    await Gp.reload();await wait(Gp,()=>window.MP1Join&&MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===3);
    const t0=Date.now();relay.rooms.get(code).host.socket.destroy();
    await wait(Gp,()=>/Host bağlı değil|host bağlantısı/.test(document.getElementById('jConn').textContent));
    await wait(H,()=>MP1Host.connected&&MP1Host.host.lobby.phase==='ingame',undefined,30000);metrics.hostRecoveryMs=Date.now()-t0;
    await wait(Gp,()=>/^Bağlı/.test(document.getElementById('jConn').textContent));
    await H.evaluate(()=>MP1Host.advance(10));const hd=await H.evaluate(()=>Math.floor(G.day));await wait(Gp,d=>MP1Join.game.clock.day===d,hd);
    assert(!(await H.evaluate(()=>MP1Host.urls.join(' '))).includes(hostKey));
  });
  await test('attacks from a third browser: foreign origin refused, wrong code, fake host, room full — each with a clear Turkish message',async()=>{
    const X=await (await bX.newContext(PHONE(360,800))).newPage();X.on('pageerror',e=>errors.push('X: '+e.message));
    const d0=relay.stats.denied.origin||0;
    await X.goto('https://127.0.0.1:'+pport+'/mp/join?code='+code);await wait(X,()=>document.getElementById('jCode'));await X.fill('#jName','Kötü');await X.locator('[data-j="go"]').tap();
    await wait(X,()=>/Bağlanılamadı/.test(document.getElementById('jStatus').textContent));assert.equal(relay.stats.denied.origin,d0+1,'origin https://127.0.0.1 is not in MP1_ORIGINS');
    await X.goto(base+'/mp/join?code=ZZZZZZZZ');await wait(X,()=>document.getElementById('jCode'));await X.fill('#jName','Yanlış');await X.locator('[data-j="go"]').tap();
    await wait(X,()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
    const fake=await X.evaluate(([b,c])=>new Promise(r=>{const w=new WebSocket(b.replace('https','wss')+'/mp1/ws?role=host&code='+c);w.onopen=()=>w.send('Asahte-anahtar');w.onmessage=e=>{r(String(e.data));w.close();};}),[base,code]);
    assert.match(fake,/bad-host-key/);
    await X.goto(base+'/mp/join?code='+code);await wait(X,()=>document.getElementById('jCode'));await X.fill('#jName','Fazla');await X.locator('[data-j="go"]').tap();
    await wait(X,()=>/Oda dolu|Oyun başladı/.test(document.getElementById('jStatus').textContent));await shot(X,'third-room-full');
  });
  await test('resources: guest phone and host phone memory/CPU during play; traffic through the TLS proxy',async()=>{
    const pm=async p=>{const c=p===H?perf.host:perf.guest;const m=(await c.send('Performance.getMetrics')).metrics;const g=k=>(m.find(x=>x.name===k)||{}).value;
      return {heapMB:Math.round(g('JSHeapUsedSize')/1048576*10)/10,taskSec:Math.round(g('TaskDuration')*100)/100,nodes:g('Nodes')};};
    metrics.guestResources=await pm(Gp);metrics.hostResources=await pm(H);metrics.proxyBytes=px.bytes();
    metrics.guestBytes=await Gp.evaluate(()=>MP1Join.stats.bytes);metrics.guestMsgs=await Gp.evaluate(()=>MP1Join.stats.msgs);
    assert(metrics.guestResources.heapMB<metrics.hostResources.heapMB&&metrics.guestResources.taskSec<metrics.hostResources.taskSec,'guest page is much lighter than the host '+JSON.stringify([metrics.guestResources,metrics.hostResources]));
  });
  await test('host cost on a mid-range phone approximation (4× CPU throttle): month simulation, vision memory and publish at 45 / 60 / 100 systems',async()=>{
    const P=await ctxH.newPage();await P.goto(base+'/');await wait(P,()=>typeof setupGame==='function'&&window.StarsMP);
    const cdp=await ctxH.newCDPSession(P);const run=()=>P.evaluate(()=>{
      const hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');const outRows=[];
      for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
        setupGame({...CFG,size,aiCount:ai,seed:11});G.autoSave=false;let bytes=0;
        const mp=StarsMP.createHost({roomId:'perf',random:hex,send:(c,t)=>{bytes+=t.length;}});mp.installGuards();
        mp.onMessage('g',JSON.stringify({v:1,type:'hello',name:'P'}));const pid=[...mp.state.players.keys()].find(k=>k!=='host');mp.assign(pid,1);
        const month=[],obs=[],pub=[];
        for(let m=0;m<4;m++){let a=performance.now();for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}
          month.push(performance.now()-a);a=performance.now();mp.observeHumans();obs.push(performance.now()-a);a=performance.now();mp.publish();pub.push(performance.now()-a);}
        const med=x=>Math.round(x.slice().sort((p,q)=>p-q)[x.length>>1]*10)/10;
        outRows.push({systems:G.sys.length,empires:G.emps.length,monthMs:med(month),observeMs:med(obs),publishMs:med(pub),bytesPerMonth:Math.round(bytes/4),heapMB:Math.round(performance.memory.usedJSHeapSize/1048576)});}
      return outRows;});
    metrics.hostCostNormal=await run();await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});metrics.hostCost4x=await run();await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
    for(const r of metrics.hostCost4x)assert(r.publishMs<100&&r.observeMs<20,'MP overhead stays small: '+JSON.stringify(r));
    assert.deepEqual(metrics.hostCost4x.map(r=>r.systems),[45,60,100]);await P.close();
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp11-results.json'),JSON.stringify({note:'Yerel makine: gerçek TCP/TLS yığını, kendinden imzalı sertifika, TLS ters vekili. Gerçek internet ya da fiziksel Android DEĞİL.',results,metrics},null,1));
  for(const b of [bH,bG,bX])if(b)await b.close().catch(()=>{});if(px)await px.close();if(relay)relay.shutdown('test-end');tls.cleanup();
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
