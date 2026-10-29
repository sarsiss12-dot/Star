'use strict';
/* MP.0 — iki ayrı gerçek Chromium süreci + yerel geliştirme relay'i.
   Host: gerçek STARS oyun sayfası (/mp/host), gerçek seed11 galaksisi.
   İstemci: motor yüklemeyen ayrı sayfa (/mp/client), ayrı tarayıcı süreci.
   Üçüncü bağlam: aynı istemci sürecinde ayrı depolamalı yetkisiz katılımcı.
   Çıktı: $STARS_OUTPUT/mp0-results.json, ekran görüntüleri. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp0'));fs.mkdirSync(out,{recursive:true});
const relay=require('../research/mp0/server/dev-relay.js'),{runtime}=require('./helpers/runtime');
const ROOM='mp0-seed11',P2=3,results=[],errors=[],metrics={};
let server,base,bHost,bClient,H,Cp,M,hostCtx,cliCtx,malCtx;
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
/* Sayısal tolerans: Chromium V8 ile Node V8 arasında galaksi koordinatlarının son
   ondalık basamağı farklı olabiliyor (bilinen faz95d ortam farkı). Bu, istemcilerin
   bağımsız simülasyon yürütmemesi gerektiğinin doğrudan kanıtıdır; sayılır, raporlanır. */
const fp={n:0,max:0,paths:[]};
function firstDiff(a,b,p=''){
  if(typeof a==='number'&&typeof b==='number'){if(a===b)return null;const d=Math.abs(a-b),tol=1e-9*Math.max(1,Math.abs(a),Math.abs(b));if(d<=tol){fp.n++;fp.max=Math.max(fp.max,d/Math.max(1,Math.abs(a)));if(fp.paths.length<5)fp.paths.push(p);return null;}return p+' host='+a+' replay='+b;}
  if(a&&b&&typeof a==='object'&&typeof b==='object'){let first=null;for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=firstDiff(a[k],b[k],p+'/'+k);if(d&&!first)first=d;}return first;}
  return JSON.stringify(a)===JSON.stringify(b)?null:p+' host='+JSON.stringify(a)?.slice(0,160)+' replay='+JSON.stringify(b)?.slice(0,160);}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const wait=(page,fn,arg,timeout=20000)=>page.waitForFunction(fn,arg,{timeout});
const known=()=>H.evaluate(id=>[...explorationContext(G.emps[id]).known],P2);
const knownSeen=new Set();
async function track(){for(const id of await known())knownSeen.add(id);}
(async()=>{try{
  server=await relay.start(0);base='http://127.0.0.1:'+server.address().port;
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
  bHost=await chromium.launch(launch);bClient=await chromium.launch(launch);       // iki ayrı tarayıcı süreci
  hostCtx=await bHost.newContext({serviceWorkers:'block',viewport:{width:844,height:390}});
  cliCtx=await bClient.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  malCtx=await bClient.newContext({serviceWorkers:'block'});
  H=await hostCtx.newPage();Cp=await cliCtx.newPage();M=await malCtx.newPage();
  for(const [n,p] of [['host',H],['client',Cp],['third',M]])p.on('pageerror',e=>errors.push(n+': '+e.message));
  // iki ayrı tarayıcı süreci: ayrı --user-data-dir profilleri
  metrics.browserProfiles=[...new Set((require('child_process').execSync('ps -eo args').toString().match(/--user-data-dir=\S+/g)||[]))].length;
  assert(metrics.browserProfiles>=2,'two separate browser processes');

  await test('single-player shell is unchanged: / loads without MP code and every runtime file is served byte-identical to the manifest',async()=>{
    const m=JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json')));
    for(const [n,h] of Object.entries(m.files)){const r=await fetch(base+'/'+n);assert.equal(sha(Buffer.from(await r.arrayBuffer())),h,n);}
    await H.goto(base+'/');await wait(H,()=>typeof UI!=='undefined'&&typeof setupGame==='function');
    assert.equal(await H.evaluate(()=>typeof StarsMP+'/'+typeof MPHostAPI),'undefined/undefined');
    assert.equal(await H.evaluate(()=>BUILD_ID),m.build);
  });
  await test('host starts the real seed11 galaxy in its own browser process and registers the room',async()=>{
    await H.goto(base+'/mp/host?room='+ROOM);await wait(H,()=>window.MPHostAPI&&typeof UI!=='undefined');
    const r=await H.evaluate(()=>MPHostAPI.start({...CFG,seed:11}));
    assert.deepEqual(r,{seed:11,systems:45,emps:7});await wait(H,()=>MPHostAPI.connected);
    metrics.hostStart=await H.evaluate(()=>({day:G.day,rng:RND_STATE,speed:G.speed,p:G.p.id}));
  });
  await test('second browser process joins: gets a player identity, no empire, and runs no simulation',async()=>{
    await Cp.goto(base+'/mp/client?room='+ROOM+'&name=Ay%C5%9Fe');await wait(Cp,()=>MPClient.playerId);
    const c=await Cp.evaluate(()=>({pid:MPClient.playerId,e:MPClient.empireId,engine:[typeof G,typeof monthTick,typeof dailyTick,typeof setupGame,typeof serialize].join(','),
      scripts:[...document.scripts].map(s=>s.getAttribute('src'))}));
    assert.equal(c.e,null);assert.equal(c.engine,'undefined,undefined,undefined,undefined,undefined');assert.deepEqual(c.scripts,['mp-client.js']);
    metrics.client2=c.pid;
    await Cp.evaluate(()=>MPClient.send({kind:'build',sys:0,planet:0,key:'santral'}));await wait(Cp,()=>MPClient.results.length===1);
    assert.equal(await Cp.evaluate(()=>MPClient.results[0].code),'no-empire');
  });
  await test('host assigns empire 3 to the second player; the client receives its own filtered snapshot',async()=>{
    const pid=metrics.client2;assert.deepEqual(await H.evaluate(([p,e])=>MPHostAPI.assign(p,e),[pid,P2]),{ok:true});
    await wait(Cp,e=>MPClient.view&&MPClient.view.me.id===e,P2);
    const truth=await H.evaluate(id=>({known:[...explorationContext(G.emps[id]).known].sort((a,b)=>a-b),cols:G.emps[id].colonies.map(c=>c.s+':'+c.p),ai:G.emps[id].ai,host:G.p.id}),P2);
    const v=await Cp.evaluate(()=>({known:Object.values(MPClient.view.sys).filter(s=>s.k).map(s=>s.i).sort((a,b)=>a-b),cols:Object.keys(MPClient.view.cols),me:MPClient.view.me.id,all:Object.keys(MPClient.view.sys).length}));
    assert.deepEqual(v.known,truth.known);assert.deepEqual(v.cols,truth.cols);assert.equal(truth.ai,false);assert.equal(truth.host,0);assert.notEqual(v.me,truth.host);
    assert(v.known.length<10&&v.all===45);await track();
  });
  await test('both players observe the same host game time (deterministic host steps)',async()=>{
    for(const d of [15,15,15]){await H.evaluate(n=>MPHostAPI.advance(n),d);await track();
      const hc=await H.evaluate(()=>({day:Math.floor(G.day),y:G.year,m:G.month}));
      await wait(Cp,x=>MPClient.clock&&MPClient.clock.day===x.day,hc);
      const cc=await Cp.evaluate(()=>MPClient.clock);assert.deepEqual({day:cc.day,y:cc.y,m:cc.m},hc);}
  });
  let col;
  await test('real build command from the client UI: host validates with queueBuilding, result is visible on both sides',async()=>{
    col=await H.evaluate(id=>{const e=G.emps[id];for(const c of e.colonies){const pl=G.sys[c.s].planets[c.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl))return {s:c.s,p:c.p,min:e.res.min,q:(pl.col.q||[]).length,cost:buildingCost(e,'santral').min};}},P2);
    assert(col,'free slot');
    await Cp.selectOption('select[data-col="'+col.s+':'+col.p+'"]','santral');
    const btn=Cp.locator('button[data-build="'+col.s+':'+col.p+'"]');const box=await btn.boundingBox();assert(box.height>=44);
    await btn.tap();await wait(Cp,()=>MPClient.results.some(r=>r.status==='ok'));
    const r=await Cp.evaluate(()=>MPClient.results.find(r=>r.status==='ok'));metrics.commandRttMs=r.ms;
    const h=await H.evaluate(([id,c])=>{const e=G.emps[id],pl=G.sys[c.s].planets.find(p=>p.i===c.p);return {min:e.res.min,q:pl.col.q.map(w=>w.key)};},[P2,col]);
    assert.equal(h.min,col.min-col.cost);assert.equal(h.q.length,col.q+1);assert.equal(h.q.at(-1),'santral');
    await wait(Cp,c=>MPClient.view.cols[c.s+':'+c.p].q.length===c.q+1,col);
    const v=await Cp.evaluate(c=>({q:MPClient.view.cols[c.s+':'+c.p].q.map(w=>w.k),min:MPClient.view.me.res.min}),col);
    assert.equal(v.q.at(-1),'santral');assert.equal(v.min,Math.round(h.min*10)/10);
  });
  await test('duplicate packet: the same command id sent twice is applied exactly once',async()=>{
    const before=await H.evaluate(([id,c])=>({min:G.emps[id].res.min,q:G.sys[c.s].planets.find(p=>p.i===c.p).col.q.length,applied:MPHostAPI.stats().applied}),[P2,col]);
    await Cp.evaluate(c=>{const m={v:1,type:'cmd',seq:++MPClient.seq,cid:'dup-'+Date.now(),cmd:{kind:'build',sys:c.s,planet:c.p,key:'maden'}};MPClient.sendRaw(m);MPClient.sendRaw(m);},col);
    await wait(Cp,()=>MPClient.results.filter(r=>r.cid.startsWith('dup-')).length===2);
    const rs=await Cp.evaluate(()=>MPClient.results.filter(r=>r.cid.startsWith('dup-')).map(r=>({s:r.status,dup:!!r.dup})));
    assert.deepEqual(rs,[{s:'ok',dup:false},{s:'ok',dup:true}]);
    const after=await H.evaluate(([id,c])=>({min:G.emps[id].res.min,q:G.sys[c.s].planets.find(p=>p.i===c.p).col.q.length,applied:MPHostAPI.stats().applied}),[P2,col]);
    assert.equal(after.q,before.q+1);assert.equal(after.applied,before.applied+1);assert.equal(after.min,before.min-120);
  });
  await test('unauthorized, forged, unknown, malformed, oversized and stale commands are refused; canonical Save8 unchanged',async()=>{
    const before=await H.evaluate(()=>serialize());
    const h0=await H.evaluate(()=>{const c=G.p.colonies[0];return {s:c.s,p:c.p};});
    const tech=await H.evaluate(id=>Object.keys(BUILDINGS).find(k=>BUILDINGS[k].tech&&!G.emps[id].techs[BUILDINGS[k].tech]),P2);
    const n0=await Cp.evaluate(()=>MPClient.results.length);
    await Cp.evaluate(([h0,c,tech])=>{
      const s=()=>++MPClient.seq,id=()=>'adv-'+Math.random().toString(36).slice(2,12);
      MPClient.sendRaw({v:1,type:'cmd',seq:s(),cid:id(),cmd:{kind:'build',sys:h0.s,planet:h0.p,key:'santral'}});          // başkasının gezegeni
      MPClient.sendRaw({v:1,type:'cmd',seq:s(),cid:id(),empire:0,cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}});    // sahte devlet kimliği
      MPClient.sendRaw({v:1,type:'cmd',seq:s(),cid:id(),cmd:{kind:'declareWar',target:0}});                                // bilinmeyen tür
      MPClient.sendRaw({v:1,type:'cmd',seq:s(),cid:id(),cmd:{kind:'build',sys:c.s,planet:c.p,key:'__proto__'}});           // prototip anahtarı
      MPClient.sendRaw({v:1,type:'cmd',seq:s(),cid:id(),cmd:{kind:'build',sys:c.s,planet:c.p,key:tech}});                  // teknoloji kuralı
      MPClient.sendRaw({v:1,type:'cmd',seq:1,cid:id(),cmd:{kind:'build',sys:c.s,planet:c.p,key:'santral'}});               // eski sıra
      MPClient.ws.send('{bad json');MPClient.ws.send('x'.repeat(10000));
    },[h0,col,tech]);
    await wait(Cp,n=>MPClient.results.length>=n+6&&MPClient.errors.length>=2,n0);
    const codes=await Cp.evaluate(n=>MPClient.results.slice(n).map(r=>r.code),n0),errs=await Cp.evaluate(()=>MPClient.errors.slice(-2));
    assert.deepEqual(codes,['not-owner','forged-empire','unknown-kind','bad-params','rules:tech','stale-seq']);assert.deepEqual(errs.sort(),['bad-json','too-big']);
    assert.equal(await H.evaluate(()=>serialize()),before);
  });
  await test('a third isolated browser context cannot impersonate player 2 or take its empire',async()=>{
    await M.goto(base+'/mp/client?room='+ROOM+'&name=Mallory');await wait(M,()=>MPClient.playerId);
    const m=await M.evaluate(()=>({pid:MPClient.playerId,e:MPClient.empireId}));assert.notEqual(m.pid,metrics.client2);assert.equal(m.e,null);
    // sahte jeton: yeni ve yetkisiz bir oyuncu olur
    await M.evaluate(()=>MPClient.sendRaw({v:1,type:'hello',name:'Mallory',token:'0'.repeat(32)}));await wait(M,p=>MPClient.playerId!==p,m.pid);
    assert.equal(await M.evaluate(()=>MPClient.empireId),null);
    await M.evaluate(c=>MPClient.send({kind:'build',sys:c.s,planet:c.p,key:'santral'}),col);await wait(M,()=>MPClient.results.length===1);
    assert.equal(await M.evaluate(()=>MPClient.results[0].code),'no-empire');
    const pid=await M.evaluate(()=>MPClient.playerId);
    assert.equal((await H.evaluate(([p,e])=>MPHostAPI.assign(p,e),[pid,P2])).why,'taken');assert.equal((await H.evaluate(p=>MPHostAPI.assign(p,0),pid)).why,'host-empire');
    const pk=await M.evaluate(()=>MPClient.packets.join('\n'));
    const tok=await Cp.evaluate(()=>JSON.parse(sessionStorage.getItem('mp0:'+MPClient.room)).token);
    assert(!pk.includes(tok)&&!pk.includes(metrics.client2)&&!pk.includes('"snapshot"'));
    metrics.third=pid;
  });
  await test('host canonical result equals a plain-engine replay of the host journal (Node vm, same seed and commands)',async()=>{
    const host=await H.evaluate(()=>({save:serialize(),journal:MPHostAPI.host.state.journal,rng:RND_STATE,day:G.day,cfg:G.cfg}));
    const h=runtime({root});h.sb.__r=n=>crypto.randomBytes(n).toString('hex');h.sb.__o=[];
    h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
    h.sb.HC=host.cfg;
    h.run(`setupGame(HC);if(HC.mizac)applyChosenPersona(G.p,HC.mizac);G.autoSave=false;var MP=StarsMP.createHost({roomId:'r',random:__r,send:(c,t)=>__o.push([c,t])});MP.installGuards();
      MP.onMessage('c',JSON.stringify({v:1,type:'hello',name:'x'}));var pid=[...MP.state.players.keys()].find(k=>k!=='host');
      function stepTo(d){while(G.day<d){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}}`);
    h.sb.J=host.journal;h.sb.D=host.day;
    h.run(`let seq=0;for(const j of J){stepTo(j.day);if(j.assign)MP.assign(pid,j.empireId);else MP.onMessage('c',JSON.stringify({v:1,type:'cmd',seq:++seq,cid:'rp'+String(seq).padStart(8,'0'),cmd:j.cmd}));}stepTo(D)`);
    const a=JSON.parse(host.save),b=JSON.parse(h.run('serialize()'));
    const differ=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));
    metrics.replay={journal:host.journal.length,differingKeys:differ,rngEqual:host.rng===h.run('RND_STATE')};
    assert(host.rng===h.run('RND_STATE'));
    metrics.replay.firstDiffIgnoringLog=firstDiff({...a,log:0},{...b,log:0});
    for(const k of ['sys','emps','fl','nf','day','year','month','rs','seed','commerce','jointOps','warLedger'])assert.equal(firstDiff(a[k],b[k],k),null);
    // yalnız arayüz kaynaklı alanlar farklı olabilir (host sayfasındaki karşılama mesajı / görünüm tercihleri)
    metrics.replay.floatLastDigit=fp;
    assert(firstDiff({...a,log:0,viewPrefs:0},{...b,log:0,viewPrefs:0})===null);   // günlük: host sayfasının karşılama mesajı
  });
  await test('real-time host loop: the client follows the running game clock (speed 1, then pause)',async()=>{
    const b0=await Cp.evaluate(()=>({b:MPClient.stats.bytes,n:MPClient.stats.msgs})),d0=await H.evaluate(()=>G.day);
    await H.evaluate(()=>UI.setSpeed(3));await H.waitForTimeout(4000);await H.evaluate(()=>UI.setSpeed(0));
    const hd=await H.evaluate(()=>Math.floor(G.day));assert(hd>45);
    await wait(Cp,d=>MPClient.clock.day===d,hd);await track();
    const b1=await Cp.evaluate(()=>({b:MPClient.stats.bytes,n:MPClient.stats.msgs}));
    metrics.live={speed:3,seconds:4,days:Math.round((await H.evaluate(()=>G.day))-d0),clientBytes:b1.b-b0.b,clientMsgs:b1.n-b0.n,bytesPerSecond:Math.round((b1.b-b0.b)/4)};
  });
  await test('gap and stale packets: a dropped delta triggers a safe resync; an old packet never overwrites newer state',async()=>{
    const old=await Cp.evaluate(()=>MPClient.packets.filter(t=>t.startsWith('H')&&t.includes('"type":"delta"'))[0]);
    await Cp.evaluate(()=>{MPClient.dropNext=1;});
    const r0=await Cp.evaluate(()=>MPClient.stats.resyncs);
    await H.evaluate(()=>MPHostAPI.advance(30));await H.evaluate(()=>MPHostAPI.advance(30));await track();
    await wait(Cp,r=>MPClient.stats.resyncs>r,r0);
    const hd=await H.evaluate(()=>Math.floor(G.day));await wait(Cp,d=>MPClient.clock.day===d,hd);
    const s0=await Cp.evaluate(()=>MPClient.stats.staleIgnored),rev=await Cp.evaluate(()=>MPClient.rev);
    await Cp.evaluate(t=>MPClient._inject(t),old);
    assert.equal(await Cp.evaluate(()=>MPClient.stats.staleIgnored),s0+1);assert.equal(await Cp.evaluate(()=>MPClient.rev),rev);
    const fresh=await H.evaluate(id=>JSON.stringify(MPHostAPI.host.viewFor(G.emps[id])),P2);
    assert.equal(await Cp.evaluate(()=>JSON.stringify(MPClient.view)),fresh);    // delta zinciri = taze görünüm
  });
  await test('AI never acts for the human empire over 6 months: no AI turn, no automatic deal, no inherited automation',async()=>{
    await H.evaluate(()=>{window.__turns=[];window.__deals=[];const t=aiTurn;aiTurn=function(e){__turns.push(e.id);return t.apply(this,arguments)};
      const d=executeDeal;executeDeal=function(o){const r=d.apply(this,arguments);if(r)__deals.push([o.from,o.to]);return r};});
    for(let i=0;i<6;i++){await H.evaluate(()=>MPHostAPI.advance(30));await track();}
    const r=await H.evaluate(id=>({turns:__turns,deals:__deals,ai:G.emps[id].ai,auto:G.emps[id].colonies.map(c=>G.sys[c.s].planets[c.p].col.auto),blocked:MPHostAPI.stats().blockedAI,
      journal:MPHostAPI.host.state.journal.filter(j=>!j.assign).length}),P2);
    assert(!r.turns.includes(P2)&&r.turns.length>0);assert(!r.deals.some(([a,b])=>a===P2||b===P2));assert.equal(r.ai,false);assert(r.auto.every(x=>x===false));
    metrics.aiGuard={aiTurns:r.turns.length,dealsWithHuman:0,blockedAI:r.blocked,humanCommands:r.journal};
  });
  await test('leak scan: every packet received by player 2 carries only empire-3 knowledge',async()=>{
    const pk=await Cp.evaluate(()=>MPClient.packets);
    const truth=await H.evaluate(([id,seen])=>{const s=new Set(seen);return {unknown:G.sys.filter(x=>!s.has(x.id)).map(x=>x.name),
      others:G.emps.filter(o=>o.id!==id).map(o=>o.name),contacts:G.emps.filter(o=>o.id!==id&&G.emps[id].contact[o.id]).map(o=>o.name),
      saveBytes:serialize().length,hostRng:String(RND_STATE)};},[P2,[...knownSeen]]);
    assert(truth.unknown.length>25,'test needs hidden systems');
    let max=0,total=0;
    for(const t of pk){max=Math.max(max,t.length);total+=t.length;
      for(const n of truth.unknown)assert(!t.includes(JSON.stringify(n)),'unknown system leaked: '+n);
      for(const n of truth.others)if(!truth.contacts.includes(n))assert(!t.includes(JSON.stringify(n)),'uncontacted empire leaked: '+n);
      assert(!/"(aiStrategy|aiIntel|aiCampaign|aiTalk|spy|spies|intel|journal|seen|surv|rs|fl)":/.test(t),'internal field leaked');
      assert(!t.includes(metrics.third),'other player id leaked');
      if(t.startsWith('H')){const m=JSON.parse(t.slice(1));const v=m.view||{};
        for(const sec of ['me','cols'])if(m.type==='delta'&&m.ops&&m.ops.up&&m.ops.up.cols)for(const c of Object.values(m.ops.up.cols))assert(c.s!==undefined);
        if(v.emps)for(const e of Object.values(v.emps))assert.deepEqual(Object.keys(e).sort(),['col','id','n','rel','war']);
        if(v.fleets)for(const f of Object.values(v.fleets))if(!f.own)assert(Object.keys(f).every(k=>['id','e','s','n'].includes(k)));}}
    assert(max<truth.saveBytes/4,'no full-world packet');
    metrics.client={packets:pk.length,bytes:total,maxPacket:max,saveBytes:truth.saveBytes,knownSystemsEver:knownSeen.size,hiddenSystems:truth.unknown.length};
  });
  await test('client reload reconnects to the same player and empire with a full snapshot; sequence numbers continue',async()=>{
    const pid=metrics.client2;await Cp.reload();await wait(Cp,e=>MPClient.view&&MPClient.view.me.id===e,P2);
    assert.equal(await Cp.evaluate(()=>MPClient.playerId),pid);
    await Cp.evaluate(c=>MPClient.send({kind:'focus',sys:c.s,planet:c.p,key:'sanayi'}),col);
    await wait(Cp,()=>MPClient.results.length>=1);const r=await Cp.evaluate(()=>MPClient.results.at(-1));
    assert(['ok','rejected'].includes(r.status));assert.notEqual(r.code,'stale-seq');
    if(r.status==='ok')assert.equal(await H.evaluate(([id,c])=>G.sys[c.s].planets.find(p=>p.i===c.p).col.f,[P2,col]),'sanayi');
  });
  let bundle;
  await test('host disconnect pauses the client: no commands, no clock change, no local simulation',async()=>{
    bundle=await H.evaluate(()=>MPHostAPI.bundle());
    const day=await Cp.evaluate(()=>MPClient.clock.day);await H.close();
    await wait(Cp,()=>!MPClient.host);
    assert.match(await Cp.textContent('#status'),/Host bağlı değil/);
    assert.equal((await Cp.evaluate(()=>MPClient.send({kind:'build',sys:0,planet:0,key:'santral'}))).why,'host-yok');
    await Cp.waitForTimeout(2500);assert.equal(await Cp.evaluate(()=>MPClient.clock.day),day);
    await Cp.screenshot({path:path.join(out,'client-host-left-390.png')});
  });
  await test('host resumes from Save8 + separate session metadata: same seats, same empire, same day; commands work again',async()=>{
    H=await hostCtx.newPage();H.on('pageerror',e=>errors.push('host2: '+e.message));
    await H.goto(base+'/mp/host?room='+ROOM);await wait(H,()=>window.MPHostAPI&&typeof UI!=='undefined');
    const r=await H.evaluate(b=>MPHostAPI.resume(b.save,b.meta),bundle);assert.deepEqual(r,{ok:true});await wait(H,()=>MPHostAPI.connected);
    await wait(Cp,e=>MPClient.host&&MPClient.view&&MPClient.view.me.id===e,P2);
    assert.equal(await Cp.evaluate(()=>MPClient.playerId),metrics.client2);
    const hd=await H.evaluate(()=>Math.floor(G.day));assert.equal(hd,Math.floor(JSON.parse(bundle.save).day));
    await wait(Cp,d=>MPClient.clock&&MPClient.clock.day===d,hd);
    const q=()=>H.evaluate(([id,c])=>({n:(G.sys[c.s].planets.find(p=>p.i===c.p).col.q||[]).length,min:G.emps[id].res.min}),[P2,col]);
    const b0=await q(),n0=await Cp.evaluate(()=>MPClient.results.length);
    await Cp.evaluate(c=>MPClient.send({kind:'build',sys:c.s,planet:c.p,key:'santral'}),col);
    await wait(Cp,n=>MPClient.results.length>n,n0);assert.equal(await Cp.evaluate(()=>MPClient.results.at(-1).status),'ok');
    const b1=await q();assert.equal(b1.n,b0.n+1);assert.equal(b1.min,b0.min-110);
    await Cp.evaluate(([c,i])=>MPClient.send({kind:'cancel',sys:c.s,planet:c.p,index:i}),[col,b1.n-1]);
    await wait(Cp,n=>MPClient.results.length>n+1,n0);assert.equal(await Cp.evaluate(()=>MPClient.results.at(-1).status),'ok');
    const b2=await q();assert.equal(b2.n,b0.n);assert.equal(b2.min,b0.min);              // iptal: birebir iade
    await wait(M,()=>MPClient.host&&MPClient.playerId);assert.equal(await M.evaluate(()=>MPClient.empireId),null);
    assert.equal(await H.evaluate(()=>G.emps[3].ai),false);
  });
  await test('performance sample: snapshot/delta size, publish and command cost, RTT, heap, monthly simulation time',async()=>{
    await H.evaluate(()=>{window.__mt=[];const m=monthTick;monthTick=function(){const t=performance.now();const r=m.apply(this,arguments);__mt.push(performance.now()-t);return r};});
    for(let i=0;i<6;i++)await H.evaluate(()=>MPHostAPI.advance(30));
    await Cp.waitForTimeout(4500);
    const hs=await H.evaluate(()=>({stats:MPHostAPI.stats(),mt:__mt,heap:performance.memory&&performance.memory.usedJSHeapSize}));
    const cs=await Cp.evaluate(()=>({rtt:MPClient.stats.rtt,heap:performance.memory&&performance.memory.usedJSHeapSize,msgs:MPClient.stats.msgs,bytes:MPClient.stats.bytes}));
    const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:null,mx=a=>a.length?Math.max(...a):null;
    metrics.perf={snapshotBytes:hs.stats.snapshotBytes,deltaBytesAvg:avg(hs.stats.deltaBytes),deltaBytesMax:mx(hs.stats.deltaBytes),publishMsAvg:avg(hs.stats.publishMs),publishMsMax:mx(hs.stats.publishMs),
      commandMsAvg:avg(hs.stats.commandMs),monthTickMsAvg:avg(hs.mt),monthTickMsMax:mx(hs.mt),pingRttMsAvg:avg(cs.rtt),pingRttMsMax:mx(cs.rtt),hostHeapBytes:hs.heap,clientHeapBytes:cs.heap,
      clientMsgs:cs.msgs,clientBytes:cs.bytes,hostMsgsOut:hs.stats.out,hostBytesOut:hs.stats.bytesOut,relay:relay.stats.framesOut};
    assert(metrics.perf.pingRttMsAvg!==null&&metrics.perf.deltaBytesMax<64*1024);
  });
  await test('client layout on phone portrait and landscape: 44 px touch targets, no horizontal overflow',async()=>{
    for(const [w,h] of [[390,844],[844,390]]){await Cp.setViewportSize({width:w,height:h});await Cp.waitForTimeout(200);
      const r=await Cp.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,min:Math.min(...[...document.querySelectorAll('button,select')].map(b=>b.getBoundingClientRect().height))}));
      assert(r.min>=44&&r.sw<=r.cw+1,JSON.stringify(r));await Cp.screenshot({path:path.join(out,'client-'+w+'x'+h+'.png')});}
    await H.screenshot({path:path.join(out,'host-844x390.png')});
  });
  await test('no uncaught page errors in host, client or third context',()=>assert.deepEqual(errors,[]));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}finally{
  fs.writeFileSync(path.join(out,'mp0-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  await bHost?.close();await bClient?.close();server?.close();
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
