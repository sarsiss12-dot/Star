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
async function test(name,fn){if(++tno>UNTIL||ONLY&&tno>1&&!name.includes(ONLY)&&!name.startsWith('sayfa'))return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const POLITICS=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],3000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();})()`;
async function synced(H,p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000);}
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
    await wait(H,()=>WAR_PAUSE_ON===false);await tap(H,'#modal [data-a="closem"]');await sleep(500);assert.equal(await H.evaluate(()=>G.speed),2,'settings window did not touch the speed');
    await H.evaluate(x=>{G._dealAuth=true;try{declareWar(G.emps[x],G.p);}finally{G._dealAuth=false;}},ids[1]);await all(1,'war notice + auto-pause off → 1×');
    uid=await H.evaluate(()=>G.inbox.filter(n=>n.kind==='warstart').at(-1).uid);await hostOpenNote(uid);await tap(H,'#modal [data-a="closem"]');await all(2,'→ 2×');
    await tap(H,'#tools [data-a="save"]');await tap(H,'#modal [data-a="warPauseToggle"]');await wait(H,()=>WAR_PAUSE_ON===true);await tap(H,'#modal [data-a="closem"]');
    await tap(Bp,'#timepod .sp[data-x="0"]');await all(0,'end: paused');
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
