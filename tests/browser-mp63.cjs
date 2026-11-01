'use strict';
/* MP.6.3 — akıllı duraklatma (+ sonraki bölümlerde ortak savaş ganimeti, federasyon/vasallık kararları, statüko kalıcılığı).
   Ayrı Chromium süreçleri: host (915×412), misafir B (844×390), misafir C (960×540). Dünya seed 22, orta, 5 AI; B = 3, C = 5.
   FİKSTÜR (açıkça): siyasi başlangıç (temas, kaynak). Olay/karar pencereleri motorun KENDİ giriş noktalarıyla tetiklenir
   (UI.event: duraklatan olay bildirimi; declareWar: AI'nın host'a savaş ilanı → 'warstart'; AI ilanı motorun anlaşma yetkisi G._dealAuth ile); sonraki her adım gerçek STARS
   düğmesine gerçek dokunmadır (Playwright tap → touch olayları). Yerel relay; gerçek internet ve fiziksel Android DEĞİL.
   Çıktı: $STARS_OUTPUT/mp63-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp63'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={pause:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const B=3,C=5;
let tno=0;const UNTIL=+(process.env.MP63_UNTIL||1e9);
const ONLY=process.env.MP63_ONLY||'';
async function test(name,fn){if(++tno>UNTIL||ONLY&&tno>1&&!new RegExp(ONLY).test(name)&&!name.startsWith('sayfa'))return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const POLITICS=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],3000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();})()`;
async function synced(H,p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000).catch(async e=>{throw Error('synced: host day '+d+' guest '+JSON.stringify(await p.evaluate(()=>({day:G.day,timer:!!MP6Stars.S.timer,modal:!document.getElementById('modal').classList.contains('hidden')&&document.querySelector('#modal .mhd')?.textContent,held:MP6Stars.S.stats.held}))));});}
async function tap(p,sel){const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});await l.tap();}
async function openInbox(p){if(!await p.locator('#tools [data-a="diplomaticInbox"]').first().isVisible())await tap(p,'#tools [data-a="grpTog"][data-x="emp"]');await tap(p,'#tools [data-a="diplomaticInbox"]');}
const spOn=p=>p.evaluate(()=>{const b=document.querySelector('#timepod .sp.on');return b?+b.dataset.x:null;});
async function spWait(p,v,who){try{await wait(p,v=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x===String(v);},v,15000);}
  catch(e){throw Error((who||'')+' speed '+v+' '+JSON.stringify(await p.evaluate(()=>({on:document.querySelector('#timepod .sp.on')?.dataset.x,spd:typeof G!=='undefined'?G.speed:null,pz:window.MP1Host&&MP1Host.pause?MP1Host.pause.state():null,
    host:window.MP6Stars?MP6Stars.S.hostSpd:null}))));}}
/* FİKSTÜR: oyun akarken motorun KENDİ doğal karar bildirimleri (ör. keşifte anomali) de gelir ve doğru biçimde 1×'e indirir.
   Senaryoların belirleyici olması için testin kendi tetiklemediği duraklatan bildirimler kutudan alınır (sayılır, kanıta yazılır). */
const DROP_NATURAL=`(()=>{const mine=window.__mine||[],d=G.inbox.filter(n=>(n.pause||['warstart','wardec'].includes(n.kind))&&!mine.includes(n.uid));if(d.length){G.inbox=G.inbox.filter(n=>!d.includes(n));UI.drawInbox();}return d.map(n=>n.kind);})()`;
async function dropNatural(){const d=await H.evaluate(DROP_NATURAL);if(d.length)metrics.notes.push({naturalDecisionsDropped:d});return d;}
async function all(v,label){
  const once=async t=>{await wait(H,([v,D])=>{const d=eval(D);if(d.length)(window.__dropped=window.__dropped||[]).push(...d);return G.speed===v;},[v,DROP_NATURAL],t);
    for(const p of [Bp,Cp])await wait(p,v=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x===String(v);},v,t);};
  for(let i=0;;i++){try{await once(i<2?8000:25000);await spWait(H,v,label+' host');return;}catch(e){if(i<2)continue;
    throw Error(label+': '+JSON.stringify(await H.evaluate(()=>({spd:G.speed,pz:MP1Host.pause.state(),ev:MP1Host.events.slice(-6)})))+' B '+await spOn(Bp)+' C '+await spOn(Cp));}}}
async function allOld(v,label){
  await spWait(H,v,label+' host');await spWait(Bp,v,label+' B');await spWait(Cp,v,label+' C');}
const note=p=>p.evaluate(()=>{const n=document.getElementById('mp61Note');return n&&n.classList.contains('on')?n.textContent:null;});
const lastNote=p=>p.evaluate(()=>MP61.S.note);
const modalOpen=p=>p.evaluate(()=>!document.getElementById('modal').classList.contains('hidden'));
async function setHidden(page,hidden){return page.evaluate(h=>{Object.defineProperty(document,'hidden',{get:()=>h,configurable:true});
  Object.defineProperty(document,'visibilityState',{get:()=>h?'hidden':'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));},hidden);}
/* motorun kendi olay giriş noktası: otomatik çözülemeyen (karar isteyen) bir olay → duraklatan bildirim */
const FIRE_EVENT=`(()=>{const ev=EVENTS.find(e=>e.ch&&e.ch.length>1&&!G.inbox.some(n=>n.key==='ev:'+e.id));if(AUTO_EVENT)throw Error('AUTO_EVENT');UI.event(ev);const u=G.inbox.find(n=>n.key==='ev:'+ev.id).uid;(window.__mine=window.__mine||[]).push(u);return u;})()`;
async function hostOpenNote(uid){await tap(H,'#inbox .nCard[data-x="'+uid+'"]');await wait(H,()=>!document.getElementById('modal').classList.contains('hidden'));}
async function hostResolveEvent(){await tap(H,'#modal [data-a="evch"]');await wait(H,()=>document.querySelector('#modal [data-a="closem"]'));await tap(H,'#modal [data-a="closem"]');
  await wait(H,()=>document.getElementById('modal').classList.contains('hidden'));}

let relay,base,bH,bB,bC,H,Bp,Cp;
(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();Bp=await (await bB.newContext(PHONE(844,390))).newPage();Cp=await (await bC.newContext(PHONE(960,540))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text());});}

  await test('kurulum: host oda açar; B ve C davet bağlantısıyla (/mp/play) katılır; oyun başlar; fikstür: temaslar + kaynak',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await H.evaluate(()=>{try{localStorage.removeItem('mp63:decisionPause');}catch{}});
    await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));});
    const link=await H.textContent('#mp1Link');
    for(const [p,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C]]){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
      await p.fill('#jName',name);await tap(p,'[data-j="go"]');await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
      await tap(p,'[data-j="claim"][data-e="'+e+'"]');await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await tap(p,'#jReady');}
    await wait(H,()=>MP1Host.host.canStart().ok);await tap(H,'[data-m="start"]');
    for(const p of [Bp,Cp])await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'));
    assert.equal(await H.evaluate(()=>!!(window.StarsPause&&MP1Host.pause)),true,'smart pause policy loaded on the host page');
    await H.waitForTimeout(600);await H.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.setSpeed(0);});
    await H.evaluate(()=>MP1Host.advance(5));await H.evaluate(POLITICS);await synced(H,Bp);await synced(H,Cp);
    for(const p of [Bp,Cp])await p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();});
    await H.evaluate(()=>{G.inbox=[];UI.drawInbox();});
  });

  await test('A1/A2 sıradan paneller: host KAYIT VE AYARLAR penceresini, B gelen kutusunu gerçek düğmeyle açar — ortak hız 2× kalır, host\'ta ve misafirlerde zaman ilerler, "duraklatıldı" bildirimi yok',async()=>{
    await tap(Bp,'#timepod .sp[data-x="2"]');await all(2,'start 2×');await sleep(3600);
    const shown0=await Cp.evaluate(()=>MP61.S.shown);
    await tap(H,'#tools [data-a="save"]');await wait(H,()=>/KAYIT VE AYARLAR/.test(document.getElementById('modal').textContent));
    const d0=await H.evaluate(()=>G.day),g0=await Cp.evaluate(()=>G.day);await sleep(2500);
    const d1=await H.evaluate(()=>G.day),g1=await Cp.evaluate(()=>G.day);
    assert.equal(await H.evaluate(()=>G.speed),2,'host ordinary window keeps 2×');assert(d1>d0,'host time advances with its window open');assert(g1>g0,'guest world advances meanwhile');
    for(const p of [H,Bp,Cp])assert.equal(await spOn(p),2);
    await shot(H,'a1-host-settings-open');await shot(Cp,'a1-c-running');
    await openInbox(Bp);await wait(Bp,()=>!document.getElementById('modal').classList.contains('hidden'));await sleep(1200);
    assert.equal(await H.evaluate(()=>G.speed),2,'guest ordinary window keeps 2×');assert.equal(await spOn(Cp),2);
    assert.equal(await Cp.evaluate(()=>MP61.S.shown),shown0,'no speed notice at all for ordinary windows');
    await tap(H,'#modal [data-a="closem"]');await Bp.evaluate(()=>UI.closeModal());await sleep(900);await all(2,'after closing');
    assert.equal(await H.evaluate(()=>G.speed),2,'closing restores nothing (nothing was changed) '+JSON.stringify(await H.evaluate(()=>({pz:MP1Host.pause.state(),inbox:G.inbox.map(n=>[n.kind,n.uid,n.pause]),log:MP1Host.pause.S.log.slice(-8)}))));
    metrics.pause.ordinary={hostDays:+(d1-d0).toFixed(2),guestDays:+(g1-g0).toFixed(2),suppressed:await H.evaluate(()=>MP1Host.pauseStats.suppressed)};
  });

  await test('A3–A5 karar penceresi + manuel duraklatma: 3× → host\'a karar isteyen olay (1×, herkes nedenini görür) → host olayı açar (1×) → B gerçek ⏸ → host kararı verip kapatır → oyun DURAKLI kalır → C 3× seçer → 3×',async()=>{
    await tap(Cp,'#timepod .sp[data-x="3"]');await all(3,'3×');
    const uid=await H.evaluate(FIRE_EVENT);await all(1,'decision → 1×');
    assert.equal(await H.evaluate(()=>MP1Host.pause.state().reason),'decision');
    await wait(Bp,()=>/karar penceresinde/.test(MP61.S.note||''));assert.equal(await lastNote(Bp),'Host bir karar penceresinde — oyun 1× yavaşladı');
    assert.equal(await lastNote(H),'Karar penceresi açık — oyun 1× yavaşladı');await shot(Bp,'a3-b-decision-slow');
    await hostOpenNote(uid);await sleep(700);assert.equal(await H.evaluate(()=>G.speed),1,'decision window on screen → still 1×');
    assert.deepEqual(await H.evaluate(()=>MP1Host.pause.state().dec.map(d=>d.state)),['open']);await shot(H,'a3-host-event-open');
    await tap(Bp,'#timepod .sp[data-x="0"]');await all(0,'B manual pause');
    await wait(Cp,()=>/oyunu duraklattı/.test(MP61.S.note||''));
    await hostResolveEvent();await sleep(1500);
    assert.equal(await H.evaluate(()=>G.speed),0,'window closed → the game stays paused (manual pause wins)');for(const p of [Bp,Cp])assert.equal(await spOn(p),0);
    assert.deepEqual(await H.evaluate(()=>MP1Host.pause.state().dec),[],'decision token cleared once');
    await tap(Cp,'#timepod .sp[data-x="3"]');await all(3,'C unpause → 3×');
    metrics.pause.scenario=await H.evaluate(()=>MP1Host.pause.S.log.slice(-12));
  });

  await test('A3b otomatik duraklatma açık (host MP çubuğundaki gerçek ayar): karar olayı oyunu durdurur; karar bitince önceki geçerli hız (3×) döner; aynı bildirim iki kez kilit biriktirmez',async()=>{
    await tap(H,'#mp1Mini [data-g="toggle"]');await wait(H,()=>document.getElementById('mp63Dpause'));
    await tap(H,'#mp63Dpause');await wait(H,()=>/DURAKLAT$/.test(document.getElementById('mp63Dpause').textContent));await tap(H,'#mp1Mini [data-g="toggle"]');
    const uid=await H.evaluate(FIRE_EVENT);await all(0,'auto-pause on → 0');
    await H.evaluate(uid=>{const n=G.inbox.find(x=>x.uid===uid);UI.notify({...n,uid:undefined});},uid);   // aynı anahtarlı bildirim ikinci kez
    assert.equal(await H.evaluate(()=>MP1Host.pause.state().dec.length),1,'same notice twice → one token');
    await hostOpenNote(uid);await hostResolveEvent();await all(3,'decision done → previous 3×');
    await tap(H,'#mp1Mini [data-g="toggle"]');await tap(H,'#mp63Dpause');await wait(H,()=>/YAVAŞLAT$/.test(document.getElementById('mp63Dpause').textContent));await tap(H,'#mp1Mini [data-g="toggle"]');
  });

  await test('A6/A7 birden çok neden: bekleyen karar (1×) + host arka plana geçer (0, MP.5 güvenli duraklatma, misafir komutu reddedilir) → öne gelir: karar hâlâ bekliyor (1×) → host kararı kapatır → 3×',async()=>{
    const uid=await H.evaluate(FIRE_EVENT);await all(1,'pending decision');
    await setHidden(H,true);await wait(H,()=>G.speed===0&&MP1Host.host.lobby.pause==='host-background');
    await wait(Bp,()=>(document.getElementById('jConn')||{}).textContent&&/arka plana/.test(document.getElementById('jConn').textContent)||MP6Stars.S.hostSpd===0);
    const rej=await Bp.evaluate(()=>new Promise(res=>{const c=MP1Join.cmd({kind:'speed',value:4});setTimeout(()=>res((MP1Join.results.find(x=>x.cid===c.cid)||{}).code||c.why),1500);}));
    assert.equal(rej,'paused','speed command refused while the host is in the background');
    assert.deepEqual(await H.evaluate(()=>Object.keys(MP1Host.pause.state().caps)),['background']);
    await setHidden(H,false);await wait(H,()=>!MP1Host.host.lobby.pause);await all(1,'foreground: decision still pending');
    await hostOpenNote(uid);await hostResolveEvent();await all(3,'all reasons gone → 3×');
  });

  await test('A7b manuel duraklatma + arka plan: B duraklatır → host arka plan/ön plan → oyun DURAKLI kalır (eski hız geri yüklenmez) → B 2× seçer',async()=>{
    await tap(Bp,'#timepod .sp[data-x="0"]');await all(0,'B pause');
    await setHidden(H,true);await wait(H,()=>MP1Host.host.lobby.pause==='host-background');await sleep(600);await setHidden(H,false);await wait(H,()=>!MP1Host.host.lobby.pause);
    await sleep(1200);assert.equal(await H.evaluate(()=>G.speed),0,'background end does not restart a manually paused game');
    await tap(Bp,'#timepod .sp[data-x="2"]');await all(2,'B 2×');
  });

  await test('A8 kayıt + yeniden bağlanma: karar 1×\'de tutarken kayıt paketi ortak hızı (2×) yazar; host ağı kopar (0) ve döner → eski modal kaydı değil karar kuralı (1×); karar kapanınca 2×',async()=>{
    const uid=await H.evaluate(FIRE_EVENT);await all(1,'decision');await hostOpenNote(uid);
    assert.equal(await H.evaluate(()=>MP1Host.host.snapshot({}).pkg.session.speed),2,'save keeps the shared speed, not the temporary 1×');
    const r0=await H.evaluate(()=>MP1Host.reconnects||0);
    await H.evaluate(()=>{dispatchEvent(new Event('online'));});   // ağ değişimi: eski soket bırakılır, anahtarla yeniden bağlanır
    await wait(H,r0=>MP1Host.connected&&(MP1Host.reconnects||0)>r0,r0,30000);await sleep(800);
    assert.equal(await H.evaluate(()=>G.speed),1,'after reconnect: the decision rule (1×), no stale modal speed');
    for(const p of [Bp,Cp])await wait(p,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,30000);
    await hostResolveEvent();await all(2,'decision closed → 2×');
    assert.equal(await H.evaluate(()=>UI.prePause||0),0);
  });

  await test('A3c savaş bildirimi tek oyunculu "Savaşa katılınca duraklat" tercihini izler: AÇIK → AI\'nın savaş ilanı oyunu durdurur; host ayarı gerçek düğmeyle KAPATIR → sonraki ilanda 1×',async()=>{
    assert.equal(await H.evaluate(()=>WAR_PAUSE_ON),true,'WAR_PAUSE_ON '+await H.evaluate(()=>{try{return localStorage.getItem('yh_warpause')+'/'+WAR_PAUSE_REV;}catch(e){return e.message;}}));
    const ids=await H.evaluate(()=>[1,2,4].filter(id=>!G.emps[id].dead&&!G.p.war[id]));
    await dropNatural();await H.evaluate(x=>{const o=UI.notify.bind(UI);UI.notify=function(it){const r=o(it);if(it&&it.kind==='warstart')(window.__mine=window.__mine||[]).push(it.uid);return r;};G._dealAuth=true;try{declareWar(G.emps[x],G.p);}finally{G._dealAuth=false;}},ids[0]);await all(0,'war notice + WAR_PAUSE_ON → paused');
    assert.equal(await H.evaluate(()=>G.inbox.some(n=>n.kind==='warstart')),true);
    let uid=await H.evaluate(()=>G.inbox.find(n=>n.kind==='warstart').uid);await hostOpenNote(uid);await tap(H,'#modal [data-a="closem"]');await all(2,'war notice acknowledged → 2×');
    await tap(H,'#tools [data-a="save"]');await wait(H,()=>document.querySelector('#modal [data-a="warPauseToggle"]'));await tap(H,'#modal [data-a="warPauseToggle"]');
    await wait(H,()=>WAR_PAUSE_ON===false);await tap(H,'#modal [data-a="closem"]');await sleep(500);await all(2,'settings window did not touch the speed');
    assert.deepEqual(await H.evaluate(()=>MP1Host.pause.state().dec.filter(d=>(window.__mine||[]).includes(d.uid))),[],'no decision token from the settings window');
    await H.evaluate(x=>{G._dealAuth=true;try{declareWar(G.emps[x],G.p);}finally{G._dealAuth=false;}},ids[1]);await all(1,'war notice + auto-pause off → 1×');
    uid=await H.evaluate(()=>G.inbox.filter(n=>n.kind==='warstart').at(-1).uid);await hostOpenNote(uid);await tap(H,'#modal [data-a="closem"]');await all(2,'→ 2×');
    await tap(H,'#tools [data-a="save"]');await tap(H,'#modal [data-a="warPauseToggle"]');await wait(H,()=>WAR_PAUSE_ON===true);await tap(H,'#modal [data-a="closem"]');
    await tap(Bp,'#timepod .sp[data-x="0"]');await all(0,'end: paused');
  });

  /* ═══ B. ortak savaş ganimeti paylaşımı ═══
     FİKSTÜR (açıkça; Node mp63_settle_test ile aynı yol): host T=2'ye savaş ilan eder, B ve AI M=4 motorun 'warOn' anlaşmasıyla
     katılır; T'nin dört boş sistemi kurulup captureSystem ile ele geçirilir (host 1, B 2, M 1); cepheler makePeace ile kapanır.
     C (5) sefer dışıdır. Sonrası gerçek STARS düğmelerine gerçek dokunma. */
  const SFIX=`(()=>{for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
    for(const id of [0,3,4,2])for(const o of [0,1,2,3,4,5])G.emps[id].war[o]=G.emps[o].war[id]=false;
    var P=G.p,Bq=G.emps[3],Tt=G.emps[2],Mm=G.emps[4];declareWar(P,Tt);executeDeal({from:3,to:0,give:[{t:'warOn',target:2}],want:[]});executeDeal({from:4,to:0,give:[{t:'warOn',target:2}],want:[]});
    var land=G.sys.filter(s=>!s.planets.some(p=>p.col)&&s.owner!==0&&s.owner!==3&&s.owner!==4).slice(0,4);land.forEach((s,i)=>{s.owner=2;captureSystem(s,[0,3,3,4][i]);});
    window.__land=land.map(s=>s.id);var c=warLedgerFind(0,2).campaign;makePeace(P,Tt);if(Bq.war[2])makePeace(Bq,Tt);if(Mm.war[2])makePeace(Mm,Tt);window.__camp=c;
    G.inbox=G.inbox.filter(n=>n.kind!=='warstart');UI.drawInbox();MP1Host.host.publish();return {c,ok:settlementPreview(P,c).ok};})()`;
  const closeAll=p=>p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
  async function agenda(p){await closeAll(p);await p.evaluate(()=>UI.openDiplo());await wait(p,()=>document.getElementById('diploPane').classList.contains('show'));}
  const modalText=p=>p.evaluate(()=>document.getElementById('modal').textContent.replace(/\s+/g,' '));
  let camp=null;
  await test('B1/B2 iki insan + AI ortak seferi kapattı: B gerçek diplomasi merkezinde taslağı açar; katkı puanları ve önerilen paylar host motorundan; "Alıcıyı değiştir" host önizlemesiyle; C hiçbir şey görmez',async()=>{
    const r=await H.evaluate(SFIX);assert.equal(r.ok,true,'fixture: closed joint campaign');camp=r.c;
    await synced(H,Bp);await synced(H,Cp);await wait(Bp,c=>MP1Join.game.view.settle&&MP1Join.game.view.settle.drafts.includes(c),camp).catch(async e=>{throw Error('drafts: guest '+JSON.stringify(await Bp.evaluate(()=>MP1Join.game.view.settle))+' host '+JSON.stringify(await H.evaluate(c=>({v:MP1Host.host.viewFor(G.emps[3]).settle,ctx:settlementContext(G.emps[3],c)}),camp)));});
    assert.deepEqual(await Cp.evaluate(()=>MP1Join.game.view.settle),{offers:[],drafts:[]},'C (outside the campaign) sees no settlement');
    await agenda(Bp);await wait(Bp,()=>document.querySelector('#diploPane [data-a="shareOpen"]'));await tap(Bp,'#diploPane [data-a="shareOpen"]');
    await wait(Bp,()=>/ORTAK SAVAŞ PAYLAŞIMI/.test(document.getElementById('modal').textContent));
    const t=await modalText(Bp);assert.match(t,/İncelenecek taslak/);assert.match(t,/katkı \d+/);assert.equal((t.match(/ağırlık 1/g)||[]).length,4,'4 captured systems');
    const hostQ=await H.evaluate(c=>{const q=settlementPreview(G.emps[3],c);return q.shares.map(s=>[s.id,s.points,s.allocated]);},camp);
    const guestQ=await Bp.evaluate(c=>{const q=Object.values(MP6Stars.SET.quotes).find(x=>x.ok);return q.shares.map(s=>[s.id,s.points,s.allocated]);},camp);
    const loc=id=>id===0?3:id===3?0:id;assert.deepEqual(guestQ.map(([id,p,a])=>[loc(id),p,a]),hostQ,'contribution and shares = host engine preview');
    await shot(Bp,'b1-b-draft');
    const to0=await Bp.evaluate(()=>Object.values(MP6Stars.SET.quotes).find(x=>x.ok).rows[0].to);
    await tap(Bp,'#modal [data-a="shareNext"]');await wait(Bp,to0=>{const q=Object.entries(MP6Stars.SET.quotes).find(([k,x])=>!k.endsWith('|null')&&x.ok);return q&&q[1].rows[0].to!==to0&&/ORTAK SAVAŞ PAYLAŞIMI/.test(document.getElementById('modal').textContent);},to0);
    metrics.settle={hostShares:hostQ};
    await tap(Bp,'#modal [data-a="closem"]');
  });
  await test('B3/B4 B taslağı sunar (oyu yalnız B\'nin; AI ortak kendi değerlendirmesiyle; host oyu yok) → host kendi gerçek penceresinde onaylar → B "Onaylı paylaşımı uygula" → devir host\'ta BİR KEZ; B\'ye ve host\'a sonuç bildirimi',async()=>{
    await agenda(Bp);await tap(Bp,'#diploPane [data-a="shareOpen"]');await wait(Bp,()=>document.querySelector('#modal [data-a="shareSend"]'));
    await tap(Bp,'#modal [data-a="shareSend"]');await wait(H,c=>(G.settlements.offers||[]).some(o=>o.campaign===c),camp);
    const o=await H.evaluate(c=>{const o=G.settlements.offers.filter(x=>x.campaign===c).at(-1);return {id:o.id,proposer:o.proposer,state:o.state,votes:o.votes.map(v=>[v.by,v.yes])};},camp);
    metrics.settle.offer=o;assert.equal(o.proposer,B);assert.deepEqual(o.votes.map(v=>v[0]).sort(),[B,4].sort(),'B (proposer) + AI M; host has not voted');
    assert.equal(o.state,'pending','AI partner accepted on its own assessment; waiting for the host '+JSON.stringify(o));
    await wait(H,()=>/Ortak savaş paylaşımı önerildi/.test(document.getElementById('mp3HostToast')?.textContent||'')||G.log.some(l=>/Ortak savaş paylaşımı önerildi/.test(l.m)));
    await agenda(H);await tap(H,'#diploPane [data-a="shareOpen"]');await wait(H,()=>document.querySelector('#modal [data-a="shareYes"]'));await shot(H,'b3-host-vote');
    const own0=await H.evaluate(()=>window.__land.map(id=>G.sys[id].owner));
    await tap(H,'#modal [data-a="shareYes"]');await wait(H,id=>settlementOffer(id).state==='approved',o.id);
    await closeAll(Bp);await synced(H,Bp);await wait(Bp,id=>{const x=MP6Stars.SET.offers.get(id);return x&&x.state==='approved'&&x.apply&&x.apply.ok;},o.id);
    await agenda(Bp);await tap(Bp,'#diploPane [data-a="shareOpen"]');await wait(Bp,()=>document.querySelector('#modal [data-a="shareApply"]:not([disabled])'));await shot(Bp,'b4-b-apply');
    await tap(Bp,'#modal [data-a="shareApply"]');await wait(H,id=>settlementOffer(id).state==='applied',o.id);
    const after=await H.evaluate(id=>{const x=settlementOffer(id);return {own:window.__land.map(s=>G.sys[s].owner),want:window.__land.map(s=>x.rows.find(r=>r.sys===s).to),by:x.receipt.by,n:x.receipt.transfers.length};},o.id);
    assert.deepEqual(after.own,after.want,'ownership = the approved rows');assert.equal(after.by,B);metrics.settle.applied={before:own0,...after};
    const again=await Bp.evaluate(id=>new Promise(res=>{const c=MP1Join.cmd({kind:'settleApply',offer:id});setTimeout(()=>res((MP1Join.results.find(x=>x.cid===c.cid)||{}).code),1500);}),o.id);
    assert.equal(again,'rules:engine','second application refused');assert.deepEqual(await H.evaluate(()=>window.__land.map(id=>G.sys[id].owner)),after.own,'no double transfer');
    await H.evaluate(()=>MP1Host.host.publish());await wait(Bp,()=>(MP1Join.game.view.log||[]).some(n=>/tamamlandı — \d+ devir/.test(n.m)));
    assert.equal(await Cp.evaluate(()=>(MP1Join.game.view.log||[]).some(n=>/paylaşım/i.test(n.m))),false,'C gets no notice');
    await closeAll(Bp);await synced(H,Bp);await agenda(Bp);await tap(Bp,'#diploPane [data-a="shareOpen"]');await wait(Bp,()=>/Paylaşım uygulandı/.test(document.getElementById('modal').textContent));await shot(Bp,'b4-b-applied');
    await closeAll(Bp);await closeAll(H);
  });
  /* ═══ C. federasyon: GERÇEK kuruluş + karar + oy + hibe; D. vasallık: himaye talebi ═══
     FİKSTÜR (açıkça): AI'ların gözlem kaydı (e.aiIntel.systems, motorun biçimi), B ile motorun kabul ettiği iki AI arasında ittifaklar, savaşlar kapalı,
     kaynak. Kuruluş, önerge, oy ve hibe gerçek STARS düğmelerine gerçek dokunmadır. */
  const FFIX=`(()=>{for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}for(const e of G.emps){if(e.wild)continue;e.aiIntel=e.aiIntel||{};e.aiIntel.systems=e.aiIntel.systems||{};
      for(const s of G.sys)if(s.owner>=0)e.aiIntel.systems[s.id]={owner:s.owner,defense:sysDefense(s),colonies:s.planets.filter(p=>p.col).length,capital:G.emps[s.owner]&&G.emps[s.owner].home===s.id,day:G.day};}
    for(const a of [2,3,4,5,0])for(const b of [2,3,4,5,0])if(a!==b&&G.emps[a].war[b])makePeace(G.emps[a],G.emps[b]);
    for(const e of G.emps)if(!e.wild)for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],3000);
    for(const x of [1,2,4])G.emps[x].rel[3]=G.emps[3].rel[x]=80;G.day+=1;
    /* kurucu ortaklar motorun kendi kabul kararıyla seçilir (önceki testlerin savaşı AI hafızasında güveni düşürmüş olabilir) */
    const pick=[1,2,4].filter(x=>!findFed(G.emps[x])&&aiFedWilling(G.emps[x],G.emps[3],'bilimsel').ok).slice(0,2);window.__founders=pick;
    G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>[3,...pick].includes(m)));for(const a of [3,...pick])for(const b of [3,...pick])if(a!==b)G.emps[a].ally[b]=true;
    for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();const q=canFoundFed(G.emps[3],'bilimsel','equal');
    return q.ok?pick:JSON.stringify(q.reasons.concat((q.candidates||[]).map(c=>c.id+':'+c.why)));})()`;
  const openDetails=p=>p.evaluate(()=>{for(const d of document.querySelectorAll('#diploPane details'))d.open=true;});
  /* pencere host'un yanıtıyla yeniden çizilince katlanmış bölümler kapanır: bölümleri açıp yeniden dene */
  async function tapIn(p,sel){let err;for(let i=0;i<6;i++){await openDetails(p);try{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded({timeout:2000}).catch(()=>{});await l.tap({timeout:3000});return;}catch(e){err=e;await sleep(400);}}throw err;}
  async function fedPane(p,tab){await closeAll(p);await synced(H,p);await p.evaluate(()=>UI.openFed());await wait(p,()=>document.getElementById('diploPane').classList.contains('show'));
    if(tab){await tap(p,'#diploPane [data-a="fedTab"][data-x="'+tab+'"]');await sleep(300);}await openDetails(p);}
  async function inboxRecord(p,pred,ready='#inboxYes'){await closeAll(p);await synced(H,p);await openInbox(p);
    await wait(p,pr=>DiplomaticInbox.state().records.some(r=>r.status==='pending'&&new Function('r','return '+pr)(r)),pred).catch(async e=>{throw Error('record '+pred+' '+JSON.stringify(await p.evaluate(()=>({recs:DiplomaticInbox.state().records.map(r=>[r.id,r.kind,r.status,r.fid]),
      talks:G.emps.filter(x=>x.vassalTalk).map(x=>[x.id,x.vassalTalk.lord,x.vassalTalk.sub,x.vassalTalk.to,x.vassalTalk.status]),modal:!document.getElementById('modal').classList.contains('hidden'),held:MP6Stars.S.stats.held,day:G.day}))));});
    const id=await p.evaluate(pr=>DiplomaticInbox.state().records.find(r=>r.status==='pending'&&new Function('r','return '+pr)(r)).id,pred);
    await tap(p,'[data-a="diplomaticRecord"][data-x="'+id+'"]');await wait(p,sel=>{const b=document.querySelector(sel);return b&&!b.disabled;},ready);}
  await test('C1 GERÇEK federasyon kuruluşu: B kuruluş penceresinde (uygunluk host motorundan) BİLİMSEL KUR\'a dokunur → host\'ta B + motorun kabul ettiği iki bağımsız AI müttefik ile federasyon; başkan B',async()=>{
    const founders=await H.evaluate(FFIX);assert(Array.isArray(founders)&&founders.length===2,'fixture meets the engine condition: '+founders);metrics.fed={founders};
    await fedPane(Bp);await wait(Bp,()=>document.querySelector('#diploPane [data-a="foundFed"][data-x="bilimsel:equal"]:not([disabled])'),undefined,20000);
    await shot(Bp,'c1-b-found-window');await tapIn(Bp,'#diploPane [data-a="foundFed"][data-x="bilimsel:equal"]');
    await wait(H,()=>(G.feds||[]).some(f=>f.founder===3||f.leader===3));
    const f=await H.evaluate(()=>{const f=G.feds.find(f=>f.leader===3);return {id:f.id,m:f.members.slice().sort((a,b)=>a-b),leader:f.leader,ballot:fedCharter(f).ballot,type:f.type};});
    assert.deepEqual(f.m,[3,...founders].sort((a,b)=>a-b));assert.equal(f.leader,3);assert.equal(f.type,'bilimsel');metrics.fed.founded=f;
  });
  await test('C2 anayasa önergesi + oy: B YÖNETİM sekmesinde "oy rejimi" önergesine dokunur; B\'nin oyu otomatik DEĞİL (AI üyeler kendi değerlendirmesiyle); B gerçek gelen kutusundan EVET; sonuç federasyonun kuralıyla (≥%75)',async()=>{
    await fedPane(Bp,'manage');const x=await Bp.evaluate(()=>{const b=[...document.querySelectorAll('#diploPane [data-a="fedMotion"]')].find(b=>!b.disabled&&/^charter:ballot:/.test(b.dataset.x));return b&&b.dataset.x;});
    assert(x,'charter/ballot motion button enabled');await tapIn(Bp,'#diploPane [data-a="fedMotion"][data-x="'+x+'"]');
    await wait(H,()=>{const f=G.feds.find(f=>f.leader===3);return f&&f.vote&&f.vote.motion==='charter';});
    const v0=await H.evaluate(()=>{const v=G.feds.find(f=>f.leader===3).vote;return {yes:v.yes.slice(),no:v.no.slice(),tok:fedVoteToken(v)};});
    assert(!v0.yes.includes(3)&&!v0.no.includes(3),'B not auto-voted '+JSON.stringify(v0));
    await inboxRecord(Bp,"r.kind==='fedvote'");await shot(Bp,'c2-b-ballot');await tap(Bp,'#inboxYes');
    await wait(H,t=>{const f=G.feds.find(f=>f.leader===3);return !f.vote||fedVoteToken(f.vote)!==t||f.vote.yes.includes(3);},v0.tok);
    const r2=await H.evaluate(x=>{const f=G.feds.find(f=>f.leader===3);return {open:!!f.vote,ballot:fedCharter(f).ballot,want:x.split(':')[2]};},x);
    metrics.fed.charter={aiVotes:v0,result:r2};
    if(!r2.open)assert.equal(r2.ballot===r2.want,v0.yes.length>=2,'outcome follows the 75% rule with B\'s yes');
    await closeAll(Bp);
  });
  await test('C3 acil hibe: başkan B gerçek ACİL HİBE düğmesine dokunur → federal fona motorun miktarı, B\'nin kaynağından; B\'ye kendi bildirimi',async()=>{
    const f0=await H.evaluate(()=>{const f=G.feds.find(f=>f.leader===3);return {fund:{...(f.fund||{ala:0,ene:0})},ala:G.emps[3].res.ala};});
    await fedPane(Bp);let found=await Bp.locator('#diploPane [data-a="fedGrant"]').count();
    for(const t of ['general','manage','military','members','laws','votes']){if(found)break;await fedPane(Bp,t);found=await Bp.locator('#diploPane [data-a="fedGrant"]').count();}
    assert(found,'grant button present');await tapIn(Bp,'#diploPane [data-a="fedGrant"]');
    await wait(H,a=>G.emps[3].res.ala<a-1,f0.ala);const f1=await H.evaluate(()=>{const f=G.feds.find(f=>f.leader===3);return {fund:f.fund,ala:G.emps[3].res.ala,g:GRANT_ALA};});
    assert.equal(Math.round(f1.fund.ala-(f0.fund.ala||0)),f1.g);await H.evaluate(()=>MP1Host.host.publish());await wait(Bp,()=>(MP1Join.game.view.log||[]).some(n=>/ACİL HİBE/.test(n.m)));
    await closeAll(Bp);
  });
  await test('D1 himaye talebi: C (zayıf) gerçek vasallık penceresinden B\'den himaye ister (giriş kapısı host kararı); karar B\'nin: B gerçek gelen kutusundan KABUL → C, B\'nin vasalı',async()=>{
    await H.evaluate(()=>{for(let i=0;i<4;i++)newFleet(G.emps[3],G.emps[3].home,Array.from({length:12},()=>({c:'kor'})));G.emps[3]._powAt=-1;G.emps[5]._powAt=-1;G.feds=G.feds.filter(f=>!f.members.includes(5));MP1Host.host.publish();});
    await wait(Cp,()=>{const c=(MP1Join.game.view.pol.vas.cand||[]).find(x=>x.id===3);return c&&!c.seek;}).catch(async e=>{throw Error('seek gate '+JSON.stringify(await Cp.evaluate(()=>MP1Join.game.view.pol.vas.cand)));});
    await closeAll(Cp);await synced(H,Cp);await Cp.evaluate(()=>{UI.openDiplo();UI.selectDiplo(3,'relation');});await wait(Cp,()=>document.getElementById('diploPane').classList.contains('show'));await openDetails(Cp);
    await wait(Cp,()=>document.querySelector('#diploPane [data-a="vsOpen"][data-x="3:seek"]:not([disabled])')).catch(async e=>{throw Error('vsOpen '+JSON.stringify(await Cp.evaluate(()=>({btn:[...document.querySelectorAll('#diploPane [data-a="vsOpen"]')].map(b=>[b.dataset.x,b.disabled]),txt:document.getElementById('diploPane').textContent.replace(/\s+/g,' ').match(/.{0,80}(vasal|himaye|Himaye).{0,120}/gi)}))));});await tapIn(Cp,'#diploPane [data-a="vsOpen"][data-x="3:seek"]');
    await wait(Cp,()=>document.querySelector('[data-a="vsSend"]'));await shot(Cp,'d1-c-seek');await tap(Cp,'[data-a="vsSend"]');
    await wait(H,()=>G.emps[5].vassalTalk&&G.emps[5].vassalTalk.status==='pending'&&G.emps[5].vassalTalk.mode==='seek');
    assert.equal(await H.evaluate(()=>G.emps[5].vassalTalk.to),3,'decision belongs to B (no AI decision for a human lord)');
    await inboxRecord(Bp,"r.kind==='vassal'",'[data-a="vsReply"][data-x="accept"]');await shot(Bp,'d1-b-vassal-inbox');await tap(Bp,'[data-a="vsReply"][data-x="accept"]');
    await wait(H,()=>G.emps[5].overlord===3);assert.equal(await H.evaluate(()=>vassalContractOf(G.emps[5]).lord),3);
    const third=await H.evaluate(()=>{const v=MP1Host.host.polView(G.p).vas;return [v.lord,v.subs.length,v.talks.length];});assert.deepEqual(third,[null,0,0],'host (third party) sees no contract/negotiation');
    await closeAll(Bp);await closeAll(Cp);
  });
  await test('sayfa hataları yok (host, B, C)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.filter(r=>r.status==='FAIL').length;
  try{metrics.notes.push({naturalDecisionsDroppedInWait:await H.evaluate(()=>window.__dropped||[])});}catch{}
  fs.writeFileSync(path.join(out,'mp63-results.json'),JSON.stringify({results,metrics,errors},null,1));
  console.log('GEÇEN: '+pass+' KALAN: '+fail);
  for(const b of [bH,bB,bC])try{await b.close();}catch{}
  try{if(relay)relay.shutdown('test-end');}catch{}
  process.exit(fail?1:0);
}})();
