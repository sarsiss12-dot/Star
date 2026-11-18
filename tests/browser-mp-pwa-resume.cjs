'use strict';
// Gerçek Chromium, aynı profil ve gerçek CacheStorage. Vekil yalnız sürüm geçişini ve tek eski betiği üretir.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const net=require('node:net');
const {setTimeout:delay}=require('node:timers/promises');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const old=path.resolve(process.env.STARS_P40_ROOT||'../Star-p40');
const out=path.resolve(process.env.STARS_OUTPUT||'../p43-evidence/pwa');
const viewport={width:844,height:390};
const summary={cases:{},failures:[]};
const contexts=[];
const shot=(p,name)=>p.screenshot({path:path.join(out,name+'.png')});
const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:20000});
const tap=async(p,selector)=>{const l=p.locator(selector).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:10000});};
const startRelay=async dir=>{const relay=require(path.join(dir,'research/mp1/server/relay.js')).create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});
  const server=await relay.start();return {relay,server,port:server.address().port};};

async function proxyFor(relay){
  const state={httpPort:relay.port,wsPort:relay.port,dropHttp:false,oldScript:null,staleAnswers:0,tunnels:new Set()};
  const server=http.createServer((req,res)=>{
    if(state.dropHttp){req.socket.destroy();return;}
    const url=new URL(req.url,'http://localhost');
    if(state.oldScript&&url.pathname==='/main.js'&&url.searchParams.has('mp-release')){
      state.staleAnswers++;res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});return res.end(state.oldScript);
    }
    const upstream=http.request({port:state.httpPort,host:'127.0.0.1',path:req.url,method:req.method,headers:req.headers},r=>{
      res.writeHead(r.statusCode,r.headers);r.pipe(res);
    });
    upstream.on('error',()=>res.destroy());req.pipe(upstream);
  });
  server.on('upgrade',(req,socket,head)=>{
    const upstream=net.createConnection({port:state.wsPort,host:'127.0.0.1'},()=>{
      const headers=[];for(let i=0;i<req.rawHeaders.length;i+=2)headers.push(req.rawHeaders[i]+': '+req.rawHeaders[i+1]);
      upstream.write(req.method+' '+req.url+' HTTP/'+req.httpVersion+'\r\n'+headers.join('\r\n')+'\r\n\r\n');
      if(head.length)upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    const url=new URL(req.url,'http://localhost');
    const tunnel={socket,upstream,role:url.searchParams.get('role')};state.tunnels.add(tunnel);
    const close=()=>{state.tunnels.delete(tunnel);socket.destroy();upstream.destroy();};
    socket.on('error',close).on('close',close);upstream.on('error',close).on('close',close);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {state,server,origin:'http://127.0.0.1:'+server.address().port};
}
async function profile(base,name){
  const c=await chromium.launchPersistentContext(path.join(base,name),{
    executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],
    viewport,isMobile:true,hasTouch:true,serviceWorkers:'allow'
  });
  contexts.push(c);return c;
}
async function design(p,name){
  await p.setViewportSize({width:390,height:844});
  await p.fill('#empName',name);
  await tap(p,'#setup [data-a="mizacSet"][data-x="teknokrasi"]');
  await tap(p,'#setup [data-a="step"][data-x="etik"]');
  await tap(p,'#setup [data-a="ethic"][data-x="mat:2"]');
  await tap(p,'#setup [data-a="ethic"][data-x="mil:-1"]');
  await tap(p,'#setup [data-a="step"][data-x="civic"]');
  await tap(p,'#setup [data-a="civic"][data-x="sinyal_avci"]');
  await tap(p,'#setup [data-a="step"][data-x="koken"]');
  await tap(p,'#setup [data-a="origin"][data-x="standart"]');
  await tap(p,'#setup [data-a="start"]');
  await wait(p,()=>document.getElementById('menu').classList.contains('hidden'));
  await p.setViewportSize(viewport);
}
const ready=p=>wait(p,()=>window.MP1Join?.screen==='game'&&window.MP6Stars?.S.started&&window.MP6Stars.S.appliedRev>0);
const identity=p=>p.evaluate(()=>({save:MP1Join.saveId,empire:MP1Join.empireId,name:G.p.name}));
async function join(p,manualCode){
  await p.locator('#jCode').waitFor();
  if(manualCode)await p.fill('#jCode',manualCode);
  if(!await p.locator('#jName').inputValue())await p.fill('#jName','P40 Misafir');
  await tap(p,'[data-j="go"]');
}
async function order(h,g,label){
  const e=(await identity(g)).empire;
  const yard=()=>g.evaluate(()=>{UI.closeModal();View.sel=null;View.selSys=G.sys[G.p.home];UI.tab('sistem');UI.refresh();
    return {sid:G.p.home,rows:[...document.querySelectorAll('#panel .shipCancelBtn')].filter(b=>b.getAttribute('aria-label').startsWith(SHIPS.kor.n)).length};});
  const first=await yard(),state=()=>h.evaluate(({e,s})=>({queue:G.sys[s].queue.filter(q=>q.e===e&&q.cls==='kor').length,
    ala:G.emps[e].res.ala,min:G.emps[e].res.min,cost:shipCost(G.emps[e],'kor')}),{e,s:first.sid});
  const before=await state();assert.equal(first.rows,before.queue);
  const r0=await g.evaluate(()=>MP1Join.results.length);
  const since=Date.now();
  await tap(g,`#panel [data-a="ship"][data-x="${first.sid}:kor"]`);
  const ack=await (await wait(g,n=>MP1Join.results.slice(n).find(r=>r.status),r0)).jsonValue();
  const ackMs=Date.now()-since,after=await state();
  assert.equal(ack.status,'ok',JSON.stringify(ack));assert.equal(after.queue,before.queue+1);
  await wait(g,n=>(G.sys[G.p.home].queue||[]).filter(q=>q.cls==='kor').length===n,after.queue);
  const guest=await yard();assert.equal(guest.rows,first.rows+1);
  const paid={min:before.min-after.min,ala:before.ala-after.ala};
  for(const [k,v] of Object.entries(paid))assert(Math.abs(v-(before.cost[k]||0))<1e-7,k+' tek kesinti');
  const result={accept:ack.status,before:before.queue,host:after.queue,guest:guest.rows,paid,ackMs,guestMs:Date.now()-since};
  await shot(g,label);console.log('PASS '+label+' '+JSON.stringify(result));return result;
}

async function main(){
  fs.mkdirSync(out,{recursive:true});
  const profiles=fs.mkdtempSync(path.join(os.tmpdir(),'stars-pwa-'));
  const p40=await startRelay(old),candidate=await startRelay(root),proxy=await proxyFor(p40);
  const {state,origin}=proxy;
  let profileH;
  try{
    profileH=await profile(profiles,'host');let h=profileH.pages()[0];
    const profileB=await profile(profiles,'guest'),b=profileB.pages()[0];
    await h.goto(origin+'/');await tap(h,'#mp1Btn');await tap(h,'[data-m="create"]');
    await wait(h,()=>MP1Host.lobby?.mode==='design');
    assert(await h.evaluate(()=>{Object.assign(CFG,{size:'orta',aiCount:5,seed:22});return MP1Host.host.configure({size:'orta',aiCount:5,seed:22}).ok;}));
    await tap(h,'#mp7EditMe');await design(h,'P40 Host');
    const oldCode=await h.evaluate(()=>MP1Host.code);
    await b.goto(origin+'/mp/play?code='+oldCode);await join(b);
    await tap(b,'#jEditMe');await design(b,'P40 Devleti');await tap(b,'#jReady');
    await wait(h,()=>MP1Host.host.canStart().ok);await tap(h,'[data-m="start"]');await ready(b);
    await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
    await wait(b,async()=>navigator.serviceWorker.controller&&await caches.has('stars-v96h10p40'));
    // İlk açılışta MP ekleri worker kurulmadan yüklenebilir. Kontrollü normal yenileme bunları da önbelleğe alır.
    await b.reload();await ready(b);
    await wait(b,async()=>!!await caches.match('/research/mp1/client/join.js'));
    const id=await identity(b);
    const cacheBuild=await b.evaluate(async()=>{const c=await caches.open('stars-v96h10p40');return /96h10p40/.test(await (await c.match('/main.js')).text());});
    assert(cacheBuild);assert.equal(id.empire,1);
    summary.cases.p40={cache:'stars-v96h10p40',empire:id.empire,oldOrder:await order(h,b,'p40-order')};
    await h.evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(h,()=>MP1Host.lastSave?.ok);
    await profileH.close();

    state.httpPort=state.wsPort=candidate.port;
    profileH=await profile(profiles,'host');h=profileH.pages()[0];await h.goto(origin+'/');
    summary.version=await (await h.request.get(origin+'/mp/version')).json();
    assert.equal(await h.evaluate(()=>BUILD_ID),summary.version.build);
    await tap(h,'#mp1Btn');await tap(h,'[data-m="saves"][data-mode="resume"]');
    await tap(h,'#mp1 [data-save] [data-m="resume"]');await tap(h,'#mp1Sheet [data-m="sheetOk"]');
    await wait(h,()=>MP1Host.lobby?.phase==='resume');const code=await h.evaluate(()=>MP1Host.code);assert.notEqual(code,oldCode);
    await tap(h,'[data-m="resumeGo"]');await tap(h,'#mp1Sheet [data-m="sheetOk"]');
    await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
    await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
    const hostUnassigned=()=>h.evaluate(()=>[...MP1Host.host.state.players.values()].filter(p=>p.empireId!==0&&p.conn).length);
    assert.equal(await hostUnassigned(),0);

    const invite='/mp/play?code='+code+'&from=invite#test',manual='/mp/play';
    state.httpPort=p40.port;
    const g1=await profileB.newPage(),g2=await profileB.newPage();
    const oldPaths=[[g1,invite,'invite'],[g2,manual,'manual']];
    for(const [g,url] of oldPaths){
      await g.goto(origin+url);
      await wait(g,()=>navigator.serviceWorker.controller&&window.MP1Join);
    }
    await b.evaluate(async urls=>{await Promise.all(urls.map(url=>fetch(url)));},[invite,manual]);
    await wait(b,async urls=>(await Promise.all(urls.map(url=>caches.match(url)))).every(Boolean),[invite.split('#')[0],manual]);
    // Eski sayfalar bellekte açıkken, aynı origin artık yalnız yeni relay'i sunar.
    state.httpPort=candidate.port;
    const probes=[];
    for(const [g,,kind] of oldPaths){
      let ws=0;g.on('websocket',s=>{if(s.url().includes('role=client'))ws++;});
      assert.equal(await g.evaluate(()=>BUILD_ID),'96h10p40');
      await join(g,kind==='manual'?code:null);
      await wait(g,()=>document.getElementById('mp6App').innerText.includes('Oyun sürümü eski'));
      const t=Date.now();const before=await g.locator('#mp6App').innerText();await shot(g,'old-'+kind+'-initial');
      probes.push({g,kind,t,before,sockets:()=>ws});
    }
    await delay(33500);
    for(const {g,kind,t,before,sockets} of probes){
      const after=await g.locator('#mp6App').innerText();assert.match(after,/Oyun sürümü eski/);
      const info=await g.evaluate(()=>({socket:MP1Join.ws?.readyState??null,hostOnline:MP1Join.hostOnline,empire:MP1Join.empireId,hasCode:new URL(location.href).searchParams.has('code')}));
      await shot(g,'old-'+kind+'-after30');
      summary.cases[kind]={elapsedMs:Date.now()-t,sockets:sockets(),warningBefore:/Oyun sürümü eski/.test(before),warningAfter:true,...info};
      if(sockets()!==1||info.socket!==null)summary.failures.push(kind+': sürüm reddinden sonra eski sayfa yeniden bağlandı veya soket açık kaldı');
      assert.equal(info.empire,null);assert.equal(info.hostOnline,false);
      console.log(kind+' '+JSON.stringify(summary.cases[kind]));
    }
    assert.equal(await hostUnassigned(),0,'eski istemci host koltuğu alamaz');
    await b.close();
    for(const [g,,kind] of oldPaths){
      await g.reload();await wait(g,()=>typeof BUILD_ID==='string');assert.equal(await g.evaluate(()=>BUILD_ID),summary.version.build);
      assert.equal(new URL(g.url()).searchParams.get('code'),kind==='invite'?code:null);
      await join(g,kind==='manual'?code:null);await ready(g);assert.deepEqual(await identity(g),id);
      summary.cases[kind].sameSaveAndEmpire=true;
      if(kind==='invite'){
        await g.evaluate(()=>{window.__priorSocket=MP1Join.ws;});
        for(const x of state.tunnels)if(x.role==='client'){x.upstream.destroy();x.socket.destroy();}
        await wait(g,()=>MP1Join.ws!==window.__priorSocket&&MP1Join.assigned&&MP1Join.hostOnline&&MP1Join.ws?.readyState===1);
        assert.deepEqual(await identity(g),id);summary.cases.reconnect={newSocket:true,sameSaveAndEmpire:true};
      }
      await g.close();
    }

    // Profil korunur. Yalnız yeni SRI URL'sindeki main.js için p40 baytları döner.
    const m=await profileB.newPage(),messages=[];m.on('console',x=>messages.push(x.text()));
    state.oldScript=fs.readFileSync(path.join(old,'main.js'));
    await m.goto(origin+invite);await m.locator('#mpReleaseRetry').waitFor({state:'visible'});
    assert.equal(state.staleAnswers,1);assert.match(await m.locator('#mpReleaseMessage').innerText(),/Oyun sürümü eski/);
    assert(messages.some(s=>s.includes('integrity')&&s.includes('main.js')),'Chromium SRI reddi');
    await wait(h,()=>[...MP1Host.host.state.players.values()].every(p=>p.empireId===0||!p.conn));
    assert.equal(await hostUnassigned(),0);await shot(m,'mixed-warning');
    state.oldScript=null;
    state.dropHttp=true;
    await tap(m,'#mpReleaseRetry');
    await wait(m,()=>document.getElementById('mpReleaseMessage').innerText.includes('Güncelleme alınamadı'));
    state.dropHttp=false;
    await tap(m,'#mpReleaseRetry');await ready(m);assert.deepEqual(await identity(m),id);
    assert.equal(new URL(m.url()).searchParams.get('from'),'invite');assert.equal(new URL(m.url()).hash,'#test');
    const previous=await m.evaluate(()=>MP1Join.results.length);assert.equal(previous,0,'otomatik gemi emri yok');
    summary.cases.mixed={staleReplies:state.staleAnswers,sri:true,offlineRetry:true,sameSaveAndEmpire:true,firstOrder:await order(h,m,'updated-order')};
    console.log('PASS aynı sürüm katılımı, yeniden bağlantı ve eski tek betik → güncelleme → ilk emir');
    assert.deepEqual(summary.failures,[]);
  }finally{
    fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(summary,null,2)+'\n');
    for(const c of contexts.reverse())await c.close().catch(()=>{});
    proxy.server.closeAllConnections();proxy.server.close();
    for(const {relay,server} of [p40,candidate]){relay.shutdown();server.closeAllConnections();}
    fs.rmSync(profiles,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
