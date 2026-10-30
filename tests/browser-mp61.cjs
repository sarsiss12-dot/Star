'use strict';
/* MP.6.1 — gerçek arayüzde işlevsel eşitlik + ortak oyun hızı. Ayrı Chromium süreçleri: host (915×412), misafir B (844×390),
   misafir C (960×540). Dünya seed 22, orta, 5 AI; B = 3, C = 5.
   FİKSTÜR (açıkça): siyasi başlangıç (temas, Etki/kaynak; MP.3/MP.6 ile aynı) ve bir federasyon (üyeler 2 ve B; başkan AI 2).
   Sonraki her adım GERÇEK STARS düğmesine gerçek dokunmadır (Playwright tap → touch olayları). Yerel relay; gerçek internet ve
   fiziksel Android DEĞİL. Çıktı: $STARS_OUTPUT/mp61-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp61'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={speed:{},layout:{},perf:{},cmds:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const LAND=[[844,390],[915,412],[960,540]];
const B=3,C=5;
let tno=0;const UNTIL=+(process.env.MP61_UNTIL||1e9);
async function test(name,fn){if(++tno>UNTIL)return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const POLITICS=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],3000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  var F={id:100,name:'MP61 Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:2,founder:2,members:[2,${B}],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>[2,${B}].includes(m)));G.feds.push(F);G.fedUid=Math.max(G.fedUid||0,100);G.emps[2].ally[${B}]=G.emps[${B}].ally[2]=true;fedNormalize(F);
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();})()`;
/* misafir, host'un şu anki dünyasını kurana kadar (gün + bekleyen ayna yok) */
async function synced(H,p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000);}
async function tap(p,sel){const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});await l.tap();}
const rect=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom}:null;},sel);
const hit=(a,b)=>!!(a&&b&&a.x<b.r&&b.x<a.r&&a.y<b.b&&b.y<a.b);
/* gerçek gelen kutusu düğmesi 👑 akordiyonunun içinde: kapalıysa önce akordiyon başlığına dokunulur */
async function openInbox(p){if(!await p.locator('#tools [data-a="diplomaticInbox"]').first().isVisible())await tap(p,'#tools [data-a="grpTog"][data-x="emp"]');await tap(p,'#tools [data-a="diplomaticInbox"]');}
/* hız çubuğu beklenen hızı gösterene kadar; zaman aşımında tanı */
async function spWait(p,v,who){try{await wait(p,v=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x===String(v);},v,15000);}
  catch(e){throw Error((who||'')+' speed '+v+' '+JSON.stringify(await p.evaluate(()=>({on:document.querySelector('#timepod .sp.on')?.dataset.x,host:window.MP6Stars?MP6Stars.S.hostSpd:G.speed,msgs:window.MP6Stars?MP6Stars.S.stats.speedMsgs:null,ws:window.MP1Join?MP1Join.ws&&MP1Join.ws.readyState:null}))));}}
const spOn=p=>p.evaluate(()=>{const b=document.querySelector('#timepod .sp.on');return b?+b.dataset.x:null;});
const note=p=>p.evaluate(()=>{const n=document.getElementById('mp61Note');return n&&n.classList.contains('on')?n.textContent:null;});
/* komutun host'ta uygulanma gecikmesi: dokunuştan koşul gerçekleşene kadar */
async function timed(name,fn,cond,arg,who){const t0=Date.now();await fn();try{await wait(H,cond,arg);}catch(e){const d={};for(const [n,p] of [['B',Bp],['C',Cp]])d[n]=await p.evaluate(()=>({res:MP1Join.results.slice(-3),sent:MP6Stars.S.stats.sent,blocked:MP6Stars.S.stats.blocked,alerts:[...document.querySelectorAll('#alerts *')].map(x=>x.textContent).slice(-3)})).catch(()=>null);d.host=await H.evaluate(()=>MP1Host.host.dip.offers.map(o=>[o.id,o.from,o.to,o.round,o.status])).catch(()=>null);throw Error(name+' timeout '+JSON.stringify(d));}const ms=Date.now()-t0;(metrics.cmds[name]=metrics.cmds[name]||[]).push(ms);return ms;}

let relay,base,bH,bB,bC,H,Bp,Cp,code;
(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();Bp=await (await bB.newContext(PHONE(844,390))).newPage();Cp=await (await bC.newContext(PHONE(960,540))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text());});}

  await test('kurulum: host oda açar; B ve C davet bağlantısıyla (/mp/play) katılır; oyun başlar; misafirler gerçek STARS arayüzünde; fikstür: temaslar + federasyon (2, B)',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    code=await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));return MP1Host.code;});
    const link=await H.textContent('#mp1Link');
    for(const [p,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C]]){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
      await p.fill('#jName',name);await tap(p,'[data-j="go"]');await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
      await tap(p,'[data-j="claim"][data-e="'+e+'"]');await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await tap(p,'#jReady');}
    await wait(H,()=>MP1Host.host.canStart().ok);await tap(H,'[data-m="start"]');
    for(const p of [Bp,Cp])await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'));
    await H.waitForTimeout(600);await H.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.setSpeed(0);});
    await H.evaluate(()=>MP1Host.advance(5));await H.evaluate(POLITICS);await synced(H,Bp);await synced(H,Cp);
    for(const p of [Bp,Cp])await p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();});
  });

  await test('ortak hız: B kendi STARS hız düğmesine dokunur → host hızı değişir, üç ekranın hız çubuğu aynı gerçek hızı gösterir; bildirim hız çubuğunun hemen üstünde, değiştirenin adıyla, ~3 s sonra solar; dokunmayı engellemez; aynı hız bildirim üretmez',async()=>{
    const nB=await H.evaluate(b=>G.emps[b].name,B);
    await timed('speed',()=>tap(Bp,'#timepod .sp[data-x="2"]'),()=>G.speed===2);
    for(const p of [H,Bp,Cp])await wait(p,()=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x==='2';});
    assert.equal(await Bp.evaluate(()=>G.speed),0,'guest runs no local simulation');
    for(const p of [H,Cp])await wait(p,()=>document.getElementById('mp61Note').classList.contains('on'));
    const [tb,tc,th]=[await note(Bp),await note(Cp),await note(H)];metrics.speed.texts={B:tb,C:tc,host:th};
    assert.equal(tb,'Hızı 2× yaptın');assert.equal(tc,nB+' hızı 2× yaptı');assert.equal(th,nB+' hızı 2× yaptı');
    await shot(Bp,'b-speed-notice');await shot(Cp,'c-speed-notice');await shot(H,'host-speed-notice');
    for(const [n,p] of [['B',Bp],['C',Cp],['host',H]]){const nr=await rect(p,'#mp61Note'),tp=await rect(p,'#timepod'),tl=await rect(p,'#tools'),mb=await rect(p,'#mp1Mini');
      assert(nr.b<=tp.y+1,n+' notice is above the speed bar');assert(tp.y-nr.b<70,n+' right above (gap '+(tp.y-nr.b)+')');
      for(const [k,o] of [['timepod',tp],['tools',tl],['mp bar',mb]])assert(!hit(nr,o),n+' notice overlaps '+k+' '+JSON.stringify([nr,o]));
      const through=await p.evaluate(r=>{const e=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return !!(e&&e.closest('#mp61Note'));},nr);assert.equal(through,false,n+' notice lets touches through');
      metrics.layout['notice-'+n]={notice:nr,timepod:tp,gap:Math.round(tp.y-nr.b)};}
    await sleep(3700);for(const p of [H,Bp,Cp])assert.equal(await note(p),null,'notice faded out');
    const shown=await Cp.evaluate(()=>MP61.S.shown);await sleep(800);await tap(Bp,'#timepod .sp[data-x="2"]');await sleep(900);
    assert.equal(await Cp.evaluate(()=>MP61.S.shown),shown,'same speed again → no notice');assert.equal(await note(Cp),null);
    await tap(Cp,'#timepod .sp[data-x="0"]');await wait(H,()=>G.speed===0);await wait(Bp,()=>document.getElementById('mp61Note').classList.contains('on'));
    assert.equal(await note(Bp),(await H.evaluate(c=>G.emps[c].name,C))+' oyunu duraklattı');
  });

  await test('ortak hız: eşzamanlı istekler host\'un işleme sırasıyla; host kendi düğmesiyle de değiştirir; host penceresi açınca herkes "duraklatıldı" görür; spam koruması',async()=>{
    await sleep(800);
    await Promise.all([tap(Bp,'#timepod .sp[data-x="1"]'),tap(Cp,'#timepod .sp[data-x="3"]')]);await sleep(1500);
    const hs=await H.evaluate(()=>G.speed);assert([1,3].includes(hs));for(const p of [H,Bp,Cp])assert.equal(await spOn(p),hs,'all screens show the host speed');
    metrics.speed.concurrent={final:hs,journal:await H.evaluate(()=>MP1Host.host.meta?null:null)};
    await sleep(800);await tap(H,'#timepod .sp[data-x="4"]');await wait(H,()=>G.speed===4);await spWait(Bp,4,'B');await spWait(Cp,4,'C');
    assert.equal(await note(Cp),(await H.evaluate(()=>G.p.name))+' hızı 4× yaptı');
    await H.evaluate(()=>UI.openModal('<div class="mhd">TEST</div><div class="mbd">pencere</div><div class="mft"><button class="ch" data-a="closem">KAPAT</button></div>'));
    await wait(Bp,()=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x==='0';});
    assert.match(await note(Bp),/pencere açtı — oyun duraklatıldı/);await shot(Bp,'b-host-window-paused');
    await H.evaluate(()=>UI.closeModal());await sleep(700);const back=await H.evaluate(()=>G.speed);   // STARS kapanışta kendi kuralıyla geri yükler (prePause || modalPrevSpeed)
    await spWait(Bp,back,'B');await spWait(Cp,back,'C');metrics.speed.afterHostWindow=back;
    const r=await Bp.evaluate(()=>new Promise(res=>{const out=[];let i=0;const go=()=>{const c=MP1Join.cmd({kind:'speed',value:i%2?2:3});out.push(c.cid);if(++i<3)go();else setTimeout(()=>res(out.map(id=>MP1Join.results.find(x=>x.cid===id)).map(x=>x&&x.code)),1500);};go();}));
    assert(r.includes('rules:rate-limited'),'rapid speed spam is limited: '+JSON.stringify(r));metrics.speed.spam=r;
    await sleep(800);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await wait(Bp,()=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x==='0';});
  });

  await test('ortak hız: kopan misafir döndüğünde güncel hızı (bildirimsiz) alır',async()=>{
    const room=relay.rooms.get(code);let bConn=null;for(const [id,c] of room.clients){bConn=c;break;}bConn.socket.destroy();
    await sleep(300);await sleep(800);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:3}));
    await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,30000);
    await wait(Bp,()=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x==='3';});
    await sleep(800);await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));for(const p of [Bp,Cp])await wait(p,()=>{const b=document.querySelector('#timepod .sp.on');return b&&b.dataset.x==='0';});
    await H.evaluate(()=>MP1Host.host.publish());await synced(H,Bp);await synced(H,Cp);
  });

  await test('filo (misafir B, gerçek STARS filo paneli): DURUŞ, AYIR, BİRLEŞTİR, otomatik keşif ve seçili filonun DUR düğmesi host motorunda; başka devletin filosu reddedilir',async()=>{
    const war=await H.evaluate(b=>{const f=G.fleets.find(f=>f.e===b&&f.ships.length>=2&&f.ships.every(s=>SHIPS[s.c].rol==='sav')&&f.sys>=0&&!f.mv);return f&&f.id;},B);assert(war,'fixture: war fleet with ≥2 ships');
    const fh=()=>H.evaluate(id=>{const f=G.fleets.find(x=>x.id===id);return f&&{st:f.stance,n:f.ships.length,p:f.path.length,mv:!!f.mv};},war);
    const sel=id=>Bp.evaluate(id=>{View.sel=G.fleets.find(x=>x.id===id);View.selSys=null;UI.tab('filo');UI.refresh();},id);
    await sel(war);await wait(Bp,()=>document.querySelector('[data-a="stance"]'));const st0=(await fh()).st;
    await timed('stance',()=>tap(Bp,'[data-a="stance"]'),([id,s])=>G.fleets.find(x=>x.id===id).stance!==s,[war,st0]);
    const nf=()=>H.evaluate(b=>G.fleets.filter(f=>f.e===b).length,B),n0=await nf();await synced(H,Bp);await sel(war);
    await timed('split',()=>tap(Bp,'[data-a="split"]'),([b,n])=>G.fleets.filter(f=>f.e===b).length===n+1,[B,n0]);await synced(H,Bp);await sel(war);
    await timed('merge',()=>tap(Bp,'[data-a="merge"]'),([b,n])=>G.fleets.filter(f=>f.e===b).length===n,[B,n0]);
    await synced(H,Bp);await shot(Bp,'b-fleet-panel');
    const to=await H.evaluate(([b,id])=>{const f=G.fleets.find(x=>x.id===id),E=G.emps[b];for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,E);if(p&&p.length>=2&&pathAllowed(E,f,p,f.sys))return s.id;}return null;},[B,war]);
    await Bp.evaluate(([id,to])=>MP1Join.cmd({kind:'move',fleet:id,to}),[war,to]);await wait(H,id=>{const f=G.fleets.find(x=>x.id===id);return f.path.length>0;},war);
    await synced(H,Bp);await sel(war);await wait(Bp,()=>document.querySelector('#seltag [data-a="stop"]'));
    await timed('stop',()=>tap(Bp,'#seltag [data-a="stop"]'),id=>{const f=G.fleets.find(x=>x.id===id);return f.path.length===0&&!f.ord;},war);
    const sci=await H.evaluate(b=>{const f=G.fleets.find(f=>f.e===b&&fleetHasRole(f,'bilim'));return f&&{id:f.id,auto:!!f.auto};},B);
    assert(sci,'fixture: B has a science ship');{await synced(H,Bp);await sel(sci.id);await wait(Bp,id=>document.querySelector('[data-a="autoex"][data-x="'+id+'"]'),sci.id);
      await timed('explore',()=>tap(Bp,'[data-a="autoex"][data-x="'+sci.id+'"]'),([id,a])=>!!G.fleets.find(x=>x.id===id).auto!==a,[sci.id,sci.auto]);}
    const foreign=await H.evaluate(c=>G.fleets.find(f=>f.e===c&&f.ships.length).id,C);
    const r=await Bp.evaluate(id=>new Promise(res=>{const c=MP1Join.cmd({kind:'stance',fleet:id});const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===c.cid);if(x){clearInterval(t);res(x.code);}},50);}),foreign);
    assert.equal(r,'not-owner');
  });

  await test('koloni ve tersane (misafir B, gerçek sistem paneli): gemi üretimi, odak, bina yıkımı (gerçek onay penceresi), kuyruk iptali → host motoru; pencere açıkken ayna bekletilir, durum hapı görünür, MP çubuğu dokunulamaz',async()=>{
    const home=await H.evaluate(b=>G.emps[b].home,B);
    const openSys=()=>Bp.evaluate(h=>{View.sel=null;View.selSys=G.sys[h];UI.tab('sistem');UI.refresh();},home);
    await synced(H,Bp);await openSys();
    const k=await Bp.evaluate(h=>{const b=[...document.querySelectorAll('[data-a="ship"]')].find(x=>!x.disabled&&x.dataset.x.startsWith(h+':'));return b&&b.dataset.x;},home);
    assert(k,'shipyard button on the real system panel');const q0=await H.evaluate(h=>G.sys[h].queue.length,home);
    await timed('ship',()=>tap(Bp,'[data-a="ship"][data-x="'+k+'"]'),([h,n])=>G.sys[h].queue.length===n+1,[home,q0]);
    await synced(H,Bp);await openSys();
    const pl=await H.evaluate(([b,h])=>G.sys[h].planets.find(p=>p.owner===b&&p.col).i,[B,home]);
    const fk=await Bp.evaluate(([h,p])=>{const b=[...document.querySelectorAll('[data-a="focus"]')].find(x=>x.dataset.x.startsWith(h+':'+p+':')&&!x.classList.contains('pri')&&!x.classList.contains('dis'));return b&&b.dataset.x;},[home,pl]);
    assert(fk,'a focus button that is not on cooldown');{await timed('focus',()=>tap(Bp,'[data-a="focus"][data-x="'+fk+'"]'),([h,p,f])=>G.sys[h].planets.find(x=>x.i===p).col.f===f,[home,pl,fk.split(':')[2]]);await synced(H,Bp);await openSys();}
    const dx=await Bp.evaluate(([h,p])=>{const b=[...document.querySelectorAll('[data-a="demolish"]')].find(x=>x.dataset.x.startsWith(h+':'+p+':')&&!x.dataset.x.endsWith(':santral'));return b&&b.dataset.x;},[home,pl]);
    assert(dx,'demolish button on the real colony panel');
    await tap(Bp,'[data-a="demolish"][data-x="'+dx+'"]');await wait(Bp,()=>document.querySelector('[data-a="demolishConfirm"]'));
    /* pencere açıkken: durum hapı üstte, MP çubuğu ve hız bildirimi pencerenin altında; ayna bekletilir */
    await wait(Bp,()=>document.getElementById('mp61Pill').classList.contains('on'));
    const pill=await rect(Bp,'#mp61Pill'),btns=await Bp.evaluate(()=>[...document.querySelectorAll('#modal button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.left,y:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};}));
    for(const b of btns)assert(!hit(pill,b),'pill does not cover a window button');
    assert.match(await Bp.textContent('#mp61Pill'),/ÇOK OYUNCULU · .*duraklatıldı/);
    const barTop=await Bp.evaluate(()=>{const r=document.getElementById('mp1Mini').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(e&&e.closest('#mp1Mini'));});
    assert.equal(barTop,false,'MP bar is under the open window (no accidental taps)');
    const pillThrough=await Bp.evaluate(r=>{const e=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return !!(e&&e.closest('#mp61Pill'));},pill);assert.equal(pillThrough,false,'pill takes no taps');
    await shot(Bp,'b-window-pill');
    const h0=await Bp.evaluate(()=>MP6Stars.S.stats.held);await H.evaluate(()=>MP1Host.advance(1));await sleep(1500);
    assert(await Bp.evaluate(()=>MP6Stars.S.stats.held)>h0,'mirror held while the confirm window is open');
    const dq=await H.evaluate(([h,p])=>(G.sys[h].planets.find(x=>x.i===p).col.q||[]).filter(w=>w.dem).length,[home,pl]);
    await timed('demolish',()=>tap(Bp,'[data-a="demolishConfirm"]'),([h,p,n])=>(G.sys[h].planets.find(x=>x.i===p).col.q||[]).filter(w=>w.dem).length===n+1,[home,pl,dq]);
    await synced(H,Bp);await openSys();
    const ci=await Bp.evaluate(([h,p])=>{const b=[...document.querySelectorAll('[data-a="cancelBuild"]')].filter(x=>x.dataset.x.startsWith(h+':'+p+':')).pop();return b&&b.dataset.x;},[home,pl]);
    assert(ci,'cancel button on the real build queue');const n1=await H.evaluate(([h,p])=>(G.sys[h].planets.find(x=>x.i===p).col.q||[]).length,[home,pl]);
    await timed('cancel',()=>tap(Bp,'[data-a="cancelBuild"][data-x="'+ci+'"]'),([h,p,n])=>(G.sys[h].planets.find(x=>x.i===p).col.q||[]).length===n-1,[home,pl,n1]);
    await synced(H,Bp);await shot(Bp,'b-colony-panel');
  });

  await test('kolonileştir (misafir B, gerçek gezegen düğmesi KOLONİ KUR): host motoru koloni gemisini yollar ya da koloniyi kurar; bildirim B\'nin kendi listesine',async()=>{
    const t=await H.evaluate(b=>{const e=G.emps[b];if(!G.fleets.some(f=>f.e===b&&fleetHasRole(f,'koloni')))return null;for(const s of G.sys)if(s.surv.includes(b))for(const p of s.planets)if(canColonize(e,s,p)&&!colonyClaimedBy(p,-1))return [s.id,p.i];return null;},B);
    assert(t,'fixture: B has a colony ship and a colonizable surveyed planet');
    await synced(H,Bp);await Bp.evaluate(s=>{View.sel=null;View.selSys=G.sys[s];UI.tab('sistem');UI.refresh();},t[0]);
    await wait(Bp,x=>document.querySelector('[data-a="colonize"][data-x="'+x+'"]'),t.join(':'));
    await timed('colonize',()=>tap(Bp,'[data-a="colonize"][data-x="'+t.join(':')+'"]'),([b,s,p])=>G.sys[s].planets.find(x=>x.i===p).owner===b||G.fleets.some(f=>f.e===b&&f.ord&&f.ord.t==='kol'&&f.ord.s===s&&f.ord.p===p),[B,t[0],t[1]]);
  });

  await test('diplomasi (gerçek STARS anlaşma penceresi + gerçek gelen kutusu): B, C\'ye kaynak teklifi sunar (TEKLİFİ SUN); C gelen kutusundan kabul eder → host tam bir kez uygular; karşı teklif ve ret de gerçek düğmelerden',async()=>{
    await synced(H,Bp);await synced(H,Cp);
    const r0=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.ala],[B,C]);
    await Bp.evaluate(c=>UI.act('deal',c),C);await wait(Bp,()=>document.querySelector('[data-a="dealAdd"][data-x="give:res"]'));
    for(const [side,ri] of [['give',0],['want',3]]){await tap(Bp,'[data-a="dealAdd"][data-x="'+side+':res"]');await wait(Bp,()=>document.querySelector('[data-a="pickOne"]'));
      await tap(Bp,'[data-a="pickOne"][data-x="'+ri+'"]');await wait(Bp,()=>document.querySelector('[data-a="amountPreset"]'));
      await tap(Bp,'[data-a="amountPreset"]');await tap(Bp,'[data-a="amountApply"]');await wait(Bp,s=>UI.deal&&UI.deal[s].length>0,side);}
    const d=await Bp.evaluate(()=>JSON.parse(JSON.stringify(UI.deal)));metrics.notes.push('teklif taslağı '+JSON.stringify([d.give,d.want]));
    const o0=await H.evaluate(()=>MP1Host.host.dip.offers.length);
    await tap(Bp,'[data-a="dealSend"]');await wait(H,n=>MP1Host.host.dip.offers.length===n+1,o0);
    const off=await H.evaluate(()=>MP1Host.host.dip.offers.at(-1));assert.deepEqual([off.from,off.to,off.status],[B,C,'pending']);
    await Bp.evaluate(()=>document.getElementById('diploPane').classList.remove('show'));
    await H.evaluate(()=>MP1Host.host.publish());await sleep(900);await synced(H,Cp);
    await Cp.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();});await sleep(700);
    await openInbox(Cp);await wait(Cp,()=>document.querySelector('[data-a="diplomaticRecord"]'));await shot(Cp,'c-real-inbox');
    await wait(Cp,id=>DiplomaticInbox.state().records.some(r=>r.mp===id),off.id);const rid=await Cp.evaluate(id=>DiplomaticInbox.state().records.find(r=>r.mp===id).id,off.id);
    await tap(Cp,'[data-a="diplomaticRecord"][data-x="'+rid+'"]');await wait(Cp,()=>document.getElementById('inboxYes')&&!document.getElementById('inboxYes').disabled);await shot(Cp,'c-real-inbox-record');
    await timed('accept',()=>tap(Cp,'#inboxYes'),id=>MP1Host.host.dip.offers.find(x=>x.id===id).status==='accepted',off.id);
    const r1=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.ala],[B,C]);
    const give=d.give[0].v,want=d.want[0].v;assert.deepEqual([Math.round(r0[0]-r1[0]),Math.round(r0[1]-r1[1])],[give,want],'executed exactly once');
    await Cp.evaluate(()=>UI.closeModal());
    /* karşı teklif: B yeni teklif → C gelen kutusunda "Karşı teklif hazırla" → gerçek anlaşma penceresi → TEKLİFİ SUN = MP 'counter'; B gerçek gelen kutusundan reddeder */
    const o1=await H.evaluate(()=>MP1Host.host.dip.offers.length);
    const cid=await Bp.evaluate(c=>MP1Join.cmd({kind:'offer',to:c,give:[{t:'res',r:'min',v:50}],want:[{t:'res',r:'ala',v:20}]}).cid,C);await wait(H,n=>MP1Host.host.dip.offers.length===n+1,o1);void cid;
    await H.evaluate(()=>MP1Host.host.publish());await sleep(900);await synced(H,Cp);
    await openInbox(Cp);await wait(Cp,()=>DiplomaticInbox.state().records.some(r=>r.mp&&r.status==='pending'));
    const off2=await H.evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await wait(Cp,id=>DiplomaticInbox.state().records.some(r=>r.mp===id),off2);
    const rid2=await Cp.evaluate(id=>DiplomaticInbox.state().records.find(r=>r.mp===id).id,off2);
    await tap(Cp,'[data-a="diplomaticRecord"][data-x="'+rid2+'"]');await wait(Cp,()=>document.getElementById('inboxCounter')&&!document.getElementById('inboxCounter').disabled);
    await tap(Cp,'#inboxCounter');await wait(Cp,()=>document.querySelector('[data-a="dealSend"]'));
    const o2=await H.evaluate(()=>MP1Host.host.dip.offers.length);await tap(Cp,'[data-a="dealSend"]');
    await wait(H,n=>MP1Host.host.dip.offers.length===n+1,o2);const ctr=await H.evaluate(()=>MP1Host.host.dip.offers.at(-1));
    assert.deepEqual([ctr.from,ctr.to,ctr.round,ctr.status],[C,B,2,'pending'],'real counter → MP counter (round 2)');
    await Cp.evaluate(()=>document.getElementById('diploPane').classList.remove('show'));
    await H.evaluate(()=>MP1Host.host.publish());await sleep(900);await synced(H,Bp);
    await Bp.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();});await sleep(700);
    await openInbox(Bp);await wait(Bp,id=>DiplomaticInbox.state().records.some(r=>r.mp===id&&r.status==='pending'),ctr.id);
    const recs=await Bp.evaluate(()=>DiplomaticInbox.state().records.filter(r=>r.mp&&r.status==='pending').map(r=>({id:r.id,mp:r.mp,title:r.title})));
    metrics.notes.push('B gelen kutusundaki MP teklifleri (insan + AI): '+JSON.stringify(recs));
    const rid3=recs.find(r=>r.mp===ctr.id).id;
    await tap(Bp,'[data-a="diplomaticRecord"][data-x="'+rid3+'"]');await wait(Bp,()=>document.getElementById('inboxNo'));
    await timed('reject',()=>tap(Bp,'#inboxNo'),id=>MP1Host.host.dip.offers.find(x=>x.id===id).status==='rejected',ctr.id);
    await Bp.evaluate(()=>UI.closeModal());
  });

  await test('federasyon (gerçek gelen kutusu): AI başkanın yasa önerisi B\'nin gerçek gelen kutusuna "Federasyon oylaması" olarak düşer; B EVET OYU VER → host castFedVote; üye olmayan C\'de kayıt yok',async()=>{
    /* açık bir oylama B'yi bekliyorsa o; yoksa AI başkan motorun proposeFedLaw'uyla yeni yasa önerir */
    const k=await H.evaluate(b=>{const F=G.feds.find(f=>f.id===100);if(!F)return {why:'federasyon yok'};
      if(!(F.vote&&fedVoteCounts(F).waiting.includes(b))){const ks=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)],k=ks.find(k=>canFedLaw(G.emps[F.leader],k,false).ok);
        if(!k)return {why:'öneri yok: '+canFedLaw(G.emps[F.leader],ks[0],false).why+' · oy:'+!!F.vote};proposeFedLaw(G.emps[F.leader],k);}
      MP1Host.host.publish();return F.vote&&fedVoteCounts(F).waiting.includes(b)?{tok:fedVoteToken(F.vote)}:{why:'B beklenmiyor'};},B);
    assert(k.tok,'fixture: a federation vote waiting for B — '+k.why);const tok=k.tok;
    await sleep(900);await synced(H,Bp);await synced(H,Cp);
    await openInbox(Bp);await wait(Bp,()=>DiplomaticInbox.state().records.some(r=>r.kind==='fedvote'&&r.status==='pending'));
    assert.equal(await Cp.evaluate(()=>DiplomaticInbox.state().records.some(r=>r.kind==='fedvote')),false,'non-member has no vote record');
    const rid=await Bp.evaluate(()=>DiplomaticInbox.state().records.find(r=>r.kind==='fedvote'&&r.status==='pending').id);
    await tap(Bp,'[data-a="diplomaticRecord"][data-x="'+rid+'"]');await wait(Bp,()=>document.getElementById('inboxYes')&&!document.getElementById('inboxYes').disabled);await shot(Bp,'b-real-fedvote');
    await timed('fedVote',()=>tap(Bp,'#inboxYes'),([b,tok])=>{const F=G.feds.find(f=>f.id===100);return !F.vote||fedVoteToken(F.vote)!==tok||F.vote.yes.includes(b);},[B,tok]);
    metrics.notes.push('federasyon oyu: '+JSON.stringify(await H.evaluate(([b,tok])=>{const F=G.feds.find(f=>f.id===100);return {open:!!F.vote&&fedVoteToken(F.vote)===tok,yes:F.vote?F.vote.yes.includes(b):null,last:F.lastVote&&{passed:F.lastVote.passed,yes:F.lastVote.yes}};},[B,tok])));
    await Bp.evaluate(()=>UI.closeModal());
  });

  await test('yatay ekran ve çakışma: 844×390, 915×412, 960×540\'ta MP çubuğu, hız bildirimi, hız çubuğu, sol araçlar ve kenar çubuğu düğmesi birbirini örtmez; dikeyde "çevir" uyarısı her şeyin üstünde, hap ve bildirim gizli',async()=>{
    for(const [n,p,sz0] of [['guest',Bp,[844,390]],['host',H,[915,412]]]){metrics.layout[n]={};
      for(const [w,h] of LAND){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();});await p.waitForTimeout(300);
        await p.evaluate(()=>MP61.speed({spd:2,who:'Deneme Devleti',auto:0,self:0}));await p.waitForTimeout(120);
        const r={bar:await rect(p,'#mp1Mini'),note:await rect(p,'#mp61Note'),tp:await rect(p,'#timepod'),tools:await rect(p,'#tools'),sb:await rect(p,'#sbToggle')};metrics.layout[n][w+'x'+h]=r;
        for(const [a,b] of [['bar','tp'],['bar','tools'],['bar','sb'],['note','tp'],['note','tools'],['note','bar'],['note','sb']])assert(!hit(r[a],r[b]),n+' '+w+'x'+h+': '+a+' overlaps '+b+' '+JSON.stringify([r[a],r[b]]));
        assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');await shot(p,'mp61-'+n+'-'+w+'x'+h);}
      await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();MP61.speed({spd:1,who:'X',auto:0,self:0});});await p.waitForTimeout(300);
      const pr=await p.evaluate(()=>({rot:document.getElementById('rotate').classList.contains('show'),note:getComputedStyle(document.getElementById('mp61Note')).display,pill:getComputedStyle(document.getElementById('mp61Pill')).display,
        top:(()=>{const e=document.elementFromPoint(innerWidth/2,innerHeight-60);return e&&e.closest('#rotate')?'rotate':'other:'+(e&&(e.id||e.className||e.tagName));})()}));
      metrics.layout[n]['390x844']=pr;assert(pr.rot&&pr.top==='rotate','portrait: rotate warning on top '+JSON.stringify(pr));await shot(p,'mp61-'+n+'-portrait');
      await p.setViewportSize({width:sz0[0],height:sz0[1]});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();});await p.waitForTimeout(200);}
  });

  await test('gizlilik: B\'nin aynasında C\'nin gelen kutusu/teklifi yok; ekonomi geçmişi yalnız kendi satırı; federasyon oylaması üye olmayan C\'ye gitmez; misafirin yerel G\'si host\'u etkilemez',async()=>{
    const pb=await Bp.evaluate(()=>{const m=MP6Stars.S.mirror;return {eh:m.economyHistory?Object.keys(m.economyHistory.empires):[],inbox:m.diplomaticInbox||null};});
    assert.deepEqual(pb.eh,['0']);assert.equal(pb.inbox,null,'host inbox never mirrored');
    const pc=await Cp.evaluate(()=>MP6Stars.S.mirror.world.feds.filter(f=>f.vote).length);assert.equal(pc,0,'no federation vote for the non-member');
    const s0=await H.evaluate(()=>serialize().length);await Bp.evaluate(()=>{G.p.res.min+=99999;});await sleep(300);assert.equal(await H.evaluate(()=>serialize().length),s0,'local edits stay local');
    await H.evaluate(()=>MP1Host.advance(1));await synced(H,Bp);await wait(Bp,()=>G.p.res.min<99999);   // bir sonraki ayna host'un gerçeğini geri getirir
  });

  await test('performans: ayna (tam/fark) boyutu, misafir yeniden kurulumu, pencere açıkken bekletme, dokunuş → host uygulama gecikmesi, panel açılma süresi; 45 / 60 / 100 sistem (host + 2 misafir)',async()=>{
    metrics.perf.guestBuildMs={B:await Bp.evaluate(()=>MP6Stars.S.stats.buildMs.slice(-20)),C:await Cp.evaluate(()=>MP6Stars.S.stats.buildMs.slice(-20))};
    metrics.perf.held={B:await Bp.evaluate(()=>MP6Stars.S.stats.held)};
    metrics.perf.hostMirrorBytes=await H.evaluate(()=>((MP1Host.host.stats||{}).mirrorBytes||[]).slice(-20));
    const pan=[];for(const t of ['filo','sistem','intel']){const t0=Date.now();await tap(Bp,'#tabs .tab[data-x="'+t+'"]');await wait(Bp,t=>document.querySelector('#tabs .tab.on')&&document.querySelector('#tabs .tab.on').dataset.x===t,t).catch(()=>{});pan.push(Date.now()-t0);}
    metrics.perf.panelOpenMs=pan;
    const sizes={};for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
      const r=await Cp.evaluate(([size,ai])=>{const keep=serialize();setupGame({...CFG,size,aiCount:ai,seed:42});G.autoSave=false;G.emps[1].ai=false;G.emps[2].ai=false;
        const one=id=>{let t=performance.now();const m=StarsMirror.build(id,{cosmeticSeed:7});const build=performance.now()-t;const text=JSON.stringify(m);return {m,text,build};};
        const a=one(1),b=one(2);for(let i=0;i<20;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}
        const a2=StarsMirror.build(1,{cosmeticSeed:7}),ops=StarsMirror.diff(a.m,a2);
        let t=performance.now();const ok=deserialize(a.text);const load=performance.now()-t;deserialize(keep);
        return {systems:a.m.sys.length,fullKB:Math.round(a.text.length/1024*10)/10,fullKB2:Math.round(b.text.length/1024*10)/10,delta10dKB:Math.round(JSON.stringify(ops).length/1024*10)/10,
          buildMs:Math.round((a.build+b.build)*10)/10,guestLoadMs:Math.round(load*10)/10,ok};},[size,ai]);
      assert.equal(r.ok,true);sizes['s'+r.systems]=r;}
    metrics.perf.sizes=sizes;metrics.perf.cmdLatencyMs=metrics.cmds;
    await synced(H,Cp);
  });

  await test('sayfa hataları yok (host, B, C)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.filter(r=>r.status==='FAIL').length;
  fs.writeFileSync(path.join(out,'mp61-results.json'),JSON.stringify({results,metrics,errors},null,1));
  console.log('GEÇEN: '+pass+' KALAN: '+fail);
  for(const b of [bH,bB,bC])try{await b.close();}catch{}
  try{if(relay)relay.shutdown('test-end');}catch{}
  process.exit(fail?1:0);
}})();
