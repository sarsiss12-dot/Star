'use strict';
/* MP.7.4 — gerçek telefon gözlemlerinin düzeltmeleri: 5 karakterli oda kodu, KATIL'a hızlı çift / üçlü dokunma (tek koltuk), kapasite,
   küçük çok oyunculu düğmesi, bildirim kartını gerçek dokunmayla kaydırma, karttan KABUL / REDDET / KARŞI TEKLİF (host sonucu beklenir).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp75-perf.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp75perf'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const results=[],errors=[],metrics={};
const CPU=Number(process.env.MP75_CPU||1);if(![1,4].includes(CPU))throw Error('MP75_CPU 1|4');
const WIN=+(process.env.MP75_WINDOW||3);   /* PERF.2: gerçek döngü ölçüm penceresi (oyun ayı); varsayılan 3 = MP.7.5 */
const PANE=process.env.MP75_PANE||'diplo',SIZE=process.env.MP75_SIZE||'orta',AI=+(process.env.MP75_AI||5),CHECK=(process.env.MP75_MONTHS||'60,120').split(',').map(Number);
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
  await require('./helpers/mp83-join-touch.cjs').joinBurst(p,taps,tapAt);}
async function room(H,cap,guests){
  await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup&&window.MP71Dip);
  await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
  if(cap>2){await H.selectOption('#mp7Cap',String(cap));await wait(H,c=>MP1Host.lobby.capacity===c,cap);}
  {const r=await H.evaluate(([s,a,z])=>{Object.assign(CFG,{size:s,aiCount:a,seed:z});return MP1Host.host.configure({size:s,aiCount:a,seed:z});},[SIZE,AI,+(process.env.MP75_SEED||22)]);if(!r.ok)throw Error('configure '+JSON.stringify(r));}
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

/* ölçüm kancaları: host ay adımı + yayın; misafir ayna kurulumu + yenileme; iki sayfada uzun görev (longtask) ve açık panelin baştan yazılması */
async function instrument(p,host){await p.evaluate(host=>{const T=window.__perf={month:[],publish:[],build:[],refresh:[],deserialize:[],frames:[],measuring:false,lastFrame:null,start:0,long:[],paneRewrites:0,mut:0};
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())T.long.push(Math.round(e.duration));}).observe({entryTypes:['longtask']});}catch{}
  const raf=t=>{if(T.measuring){if(T.lastFrame!==null)T.frames.push(t-T.lastFrame);T.lastFrame=t;}requestAnimationFrame(raf);};requestAnimationFrame(raf);
  if(!host){const ds=window.deserialize;window.deserialize=function(){const t=performance.now();try{return ds.apply(this,arguments);}finally{T.deserialize.push(performance.now()-t);}};}
  if(host){const mt=window.monthTick;window.monthTick=function(){const t=performance.now();try{return mt.apply(this,arguments);}finally{T.month.push(performance.now()-t);}};
    const h=MP1Host.host,pb=h.publish;h.publish=function(){const t=performance.now();try{return pb.apply(this,arguments);}finally{T.publish.push(performance.now()-t);}};}
  else{const rf=UI.refresh;UI.refresh=function(){const t=performance.now();try{return rf.apply(this,arguments);}finally{T.refresh.push(performance.now()-t);}};}
  const pane=document.getElementById('diploPane');new MutationObserver(ms=>{for(const m of ms){T.mut++;if(m.target===pane&&m.type==='childList'&&m.addedNodes.length)T.paneRewrites++;}}).observe(pane,{childList:true,subtree:true});},host);}
const stat=a=>{if(!a.length)return {n:0};const s=[...a].sort((x,y)=>x-y),q=k=>+s[Math.min(s.length-1,Math.floor(s.length*k))].toFixed(1);return {n:a.length,med:q(.5),p95:q(.95),max:+s[s.length-1].toFixed(1)};};
async function snap(H,Bp,label){
  const h=await H.evaluate(()=>{const T=window.__perf;return {month:T.month.splice(0),publish:T.publish.splice(0),long:T.long.splice(0),day:G.day,seed:G.seed,systems:G.sys.length,states:G.emps.filter(e=>!e.wild).length,alive:G.emps.filter(e=>!e.wild&&!e.dead).length,humans:[...MP1Host.host.state.players.values()].filter(p=>p.empireId!==null&&!p.visitor).length,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,
    mirrors:(MP1Host.host.stats||{}).mirrors||null};});
  const g=await Bp.evaluate(()=>{const T=window.__perf,S=MP6Stars.S;const b=S.stats.buildMs.slice();return {refresh:T.refresh.splice(0),deserialize:T.deserialize.splice(0),frames:T.frames.splice(0),windowMs:performance.now()-T.start,long:T.long.splice(0),builds:S.stats.builds,buildMs:b,minGap:S.minGap,
    paneRewrites:T.paneRewrites,mut:T.mut,deltas:S.stats.deltas,surfaceKept:S.stats.surfaceKept||0,touchHeld:S.stats.touchHeld||0,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};});
  const row={label,month:Math.floor(h.day/30),context:{seed:h.seed,systems:h.systems,states:h.states,alive:h.alive,humans:h.humans,pane:PANE},host:{monthTick:stat(h.month),publish:stat(h.publish),longtask:stat(h.long),heapMB:h.heap},
    guest:{build:stat(g.buildMs),deserialize:stat(g.deserialize),refresh:stat(g.refresh),rafMs:stat(g.frames),rafFps:g.frames.length*1000/g.windowMs,windowMs:g.windowMs,longtask:stat(g.long),builds:g.builds,deltas:g.deltas,minGap:g.minGap,paneRewrites:g.paneRewrites,mutations:g.mut,surfaceKept:g.surfaceKept,heapMB:g.heap}};
  metrics.rows=(metrics.rows||[]).concat(row);console.log('ROW '+JSON.stringify(row));return row;}
// Yalnız ölçüm: WebSocket payload boyutu/sıklığı; içerik ve kimlik doğrulama verisi kaydedilmez.
function wire(page){let rx=[],tx=[],start=performance.now();page.on('websocket',ws=>{ws.on('framereceived',f=>rx.push(Buffer.byteLength(f.payload)));ws.on('framesent',f=>tx.push(Buffer.byteLength(f.payload)));});
 return {reset(){rx=[];tx=[];start=performance.now();},snap(){const seconds=(performance.now()-start)/1000;return {seconds,rx:{sizes:stat(rx),payloadBytes:rx.reduce((a,b)=>a+b,0),messagesPerSecond:rx.length/seconds},tx:{sizes:stat(tx),payloadBytes:tx.reduce((a,b)=>a+b,0),messagesPerSecond:tx.length/seconds}};}};}
let relay,px,base,tls,bH,bB;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB]=await Promise.all([0,1].map(()=>chromium.launch(launch)));
  const H=await (await bH.newContext(PHONE(844,390))).newPage(),Bp=await (await bB.newContext(PHONE(800,360))).newPage();
  const wires={host:wire(H),guest:wire(Bp)},cpuSessions=[await H.context().newCDPSession(H),await Bp.context().newCDPSession(Bp)];
  for(const [n,p] of [['host',H],['B',Bp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));}
  await test('uzun oyun ölçümü: '+SIZE+' / '+AI+' AI, misafirde diplomasi paneli açık, en yüksek hız; '+CHECK.join('/')+'. ay',async()=>{
    await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']},1]]);
    assert.equal(await H.evaluate(()=>G.seed),+(process.env.MP75_SEED||22),'gerçek dünya tohumu istenen ölçüm tohumu olmalı');
    await instrument(H,true);await instrument(Bp,false);
    await Bp.evaluate(p=>{if(p==='council')UI.openCouncil();else UI.openDiplo();},PANE);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:4}));
    /* oyun olayları pencere açıp oyunu duraklatabilir (tek oyunculu davranış): ölçüm penceresinde pencereler kapatılır, hız yeniden istenir */
    const drive=async m=>{for(;;){const st=await H.evaluate(m=>{const md=document.getElementById('modal');if(md&&!md.classList.contains('hidden'))UI.closeModal();
        if(G.speed<4)MP1Host.host.local({kind:'speed',value:4});return {done:G.day>=m*30||!!G.over};},m);
      await Bp.evaluate(()=>{const md=document.getElementById('modal');if(md&&!md.classList.contains('hidden'))UI.closeModal();if(!document.getElementById('diploPane').classList.contains('show'))UI.openDiplo();});
      if(PANE==='council')await Bp.evaluate(()=>{if(document.getElementById('diploPane')._surfaceKey!=='council')UI.openCouncil();});
      if(st.done)return;await H.waitForTimeout(3000);}};
    /* hızlı ilerletme: host simülasyonu sayfa içinde ölçüm noktasının 2 ay öncesine kadar (PERF.1 mp-host adımları + her gün yayın;
       monthTick host sarmalayıcısıyla observeHumans çağırır; misafir aynaları alır). Sonra 2 oyun ayı gerçek döngü en yüksek hızda ölçülür. */
    const ff=async m=>{for(;;){const d=await H.evaluate(([m,w])=>{MP1Host.host.local({kind:'speed',value:0});const md=document.getElementById('modal');if(md&&!md.classList.contains('hidden'))UI.closeModal();
        for(let i=0;i<60&&G.day<m*30-w*30;i++){const b=Math.floor(G.day/30),d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
          if(Math.floor(G.day/30)>b)monthTick();if(Math.floor(G.day)!==d0)MP1Host.host.publish();}return G.day;},[m,WIN]);
      await H.waitForTimeout(30);if(d>=m*30-WIN*30)return;}};
    const reset=async()=>{for(const p of [H,Bp])await p.evaluate(()=>{const T=window.__perf;for(const k of ['month','publish','build','refresh','deserialize','frames','long'])T[k]=[];T.paneRewrites=0;T.mut=0;T.measuring=true;T.lastFrame=null;T.start=performance.now();if(window.MP6Stars)MP6Stars.S.stats.buildMs=[];});};
    const t0=Date.now();for(const m of CHECK){const f0=Date.now();await ff(m);metrics['ffS_m'+m]=Math.round((Date.now()-f0)/1000);await H.waitForTimeout(2500);for(const c of cpuSessions)await c.send('Emulation.setCPUThrottlingRate',{rate:CPU});await reset();wires.host.reset();wires.guest.reset();await drive(m);
      await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await H.waitForTimeout(1500);const r=await snap(H,Bp,'m'+m);assert(r.month>=m&&r.host.monthTick.n>=WIN,'ölçüm hedef aya ulaşmalı ve pencerenin ay adımları çalışmalı');r.cpuRate=CPU;r.requestedSeed=+(process.env.MP75_SEED||22);r.wire={host:wires.host.snap(),guest:wires.guest.snap()};for(const p of [H,Bp])await p.evaluate(()=>{window.__perf.measuring=false;});for(const c of cpuSessions)await c.send('Emulation.setCPUThrottlingRate',{rate:1});r.wallS=Math.round((Date.now()-t0)/1000);
      await Bp.evaluate(()=>{if(!document.getElementById('diploPane').classList.contains('show'))UI.openDiplo();});await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:4}));}
  });
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{metrics.errors=errors;fs.writeFileSync(path.join(out,'mp75-perf.json'),JSON.stringify({results,metrics,size:SIZE,ai:AI},null,2));
  for(const b of [bH,bB])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
