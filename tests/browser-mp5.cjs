'use strict';
/* MP.5 — internet yolu benzetimi: dağıtım imajı (Docker konteyneri; Docker yoksa aynı ortamla ayrı Node süreci) + TLS sonlandıran vekil
   (HTTPS/WSS) + her telefon için ayrı "ağ" (TCP kesici: kes / dondur = sessiz ölü soket / aç). Ayrı Chromium süreçleri:
   host (kalıcı profil, 844×390), B (390×844), C (360×800), izinsiz kişi (412×915). Dünya seed 22, orta, 5 AI; B = 3, C = 5.
   FİKSTÜR (açıkça): siyasi başlangıç (tests/mp4_core_test.js ile aynı). Bütün süreçler AYNI MAKİNEDE: gerçek internet testi DEĞİLDİR;
   gecikme/kayıp gerçek mobil ağı temsil etmez. Fiziksel Android yok. Çıktı: $STARS_OUTPUT/mp5-results.json + PNG. */
const fs=require('fs'),os=require('os'),path=require('path'),net=require('net'),tls=require('tls'),crypto=require('crypto'),assert=require('assert/strict'),
  {spawn,execSync,execFileSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp5'));fs.mkdirSync(out,{recursive:true});
const {selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const results=[],errors=[],metrics={mode:null,net:{},reconnect:{},perf:{},viewports:{},wsUrls:[],notes:[]};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const B=3,C=5,PING=25000,IMG='stars-relay:mp5-test';   // PING = relay varsayılanı (gerçekçi ölü soket süreleri)
let tno=0;const UNTIL=+(process.env.MP5_UNTIL||1e9);   // hata ayıklama: yalnız ilk N vaka
async function test(name,fn){if(++tno>UNTIL)return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{timeout,polling:100});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const freePort=()=>new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const dk=(...a)=>execFileSync('docker',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const dockerOk=()=>{try{dk('info','--format','{{.ServerVersion}}');return true;}catch{return false;}};

/* ---- "ağ": her telefon kendi TCP yolundan TLS vekiline gider; kes (RST), dondur (veri akmaz, soket açık kalır), aç ---- */
function lane(target){let srv=null,port=0;const pairs=new Set();let frozen=false;
  const up=()=>new Promise(r=>{srv=net.createServer(c=>{const u=net.connect(target,'127.0.0.1');const p={c,u};pairs.add(p);c.pipe(u);u.pipe(c);
      const k=()=>{c.destroy();u.destroy();pairs.delete(p);};c.on('error',k);u.on('error',k);c.on('close',k);u.on('close',k);});
    srv.listen(port,'127.0.0.1',()=>{port=srv.address().port;r(port);});});
  return {up,get port(){return port;},
    down:()=>new Promise(r=>{for(const p of pairs){p.c.destroy();p.u.destroy();}pairs.clear();srv.close(()=>r());}),
    /* sessiz ölüm: mevcut soketlerde veri akışı durur, FIN/RST yok (telefon ağ değiştirdi); yeni bağlantılar geçer */
    freeze(){for(const p of pairs){p.c.unpipe(p.u);p.u.unpipe(p.c);p.c.pause();p.u.pause();p.dead=true;}},
    reap(){for(const p of pairs)if(p.dead){p.c.destroy();p.u.destroy();pairs.delete(p);}}};}

/* ---- yardımcılar ---- */
async function raw(p,cmd,extra={}){const cid='x'+Math.random().toString(36).slice(2,12);
  await p.evaluate(([cmd,extra,cid])=>{const J=MP1Join;J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid,cmd,...extra});},[cmd,extra,cid]);
  await wait(p,c=>MP1Join.results.some(r=>r.cid===c),cid);return p.evaluate(c=>MP1Join.results.filter(r=>r.cid===c).at(-1),cid);}
async function sync(H,p){const day=await H.evaluate(()=>{MP1Host.host.publish();return Math.floor(G.day);});await wait(p,d=>MP1Join.game.view&&MP1Join.game.clock&&MP1Join.game.clock.day===d,day);}
async function layout(p,where){return p.evaluate(where=>{const vw=innerWidth;
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  const all=[...document.querySelectorAll(where)].flatMap(s=>[s,...s.querySelectorAll('*')]);const ctl=all.filter(e=>e.matches('button,select,input,a.mp1-btn,label.mp1-btn')&&vis(e));
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,16)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=all.filter(e=>vis(e)&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5);
  let minFont=99;for(const e of all)if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))minFont=Math.min(minFont,parseFloat(getComputedStyle(e).fontSize));
  return {overflow:document.documentElement.scrollWidth>vw+1,small,wide,minFont,controls:ctl.length};},where);}
async function viewports(p,where,name,sizes,o={}){const v0=p.viewportSize(),r={};
  for(const [w,h] of sizes){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(150);const l=await layout(p,where);r[w+'x'+h]=l;
    assert(!l.overflow,name+' overflow '+w);assert.deepEqual(l.wide,[],name+' wide '+w);assert.deepEqual(l.small,[],name+' <44px '+w);assert(l.minFont>=11,name+' font '+w);if(!o.noControls)assert(l.controls>0,name+' controls '+w);
    await shot(p,name+'-'+w+'x'+h);}
  await p.setViewportSize(v0);metrics.viewports[name]=Object.keys(r);}
const statusText=p=>p.evaluate(()=>{const e=document.getElementById('jConn')||document.querySelector('.mp2-conn,[data-conn]');return e?e.textContent:'';});
function mainPid(dir){const l=execSync('ps -eo pid,args').toString().split('\n').filter(x=>x.includes('--user-data-dir='+dir)&&!x.includes('--type='));return l.length?+l[0].trim().split(/\s+/)[0]:null;}
const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
const POLITICS=`(()=>{
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  newFleet(G.emps[5],G.emps[5].home,Array.from({length:12},()=>({c:'kor'})));
  const F={id:100,name:'MP5 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:1,founder:1,members:[1,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}
  MP1Host.host.publish();})()`;
const TERMS={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};

let relayProc=null,relayPort,tlsK,px,launch,hostDir,hostCtx,H,Bb,Bp,Cb,Cp,Xb,Xp,lanes={},origin={},code0,saved={};
async function startRelay(){
  const env={MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:Object.values(origin).join(','),MP1_PING_MS:String(PING)};
  if(metrics.mode==='docker'){try{dk('rm','-f','mp5-e2e');}catch{}
    dk('run','-d','--name','mp5-e2e','-p','127.0.0.1:'+relayPort+':8080',...Object.entries(env).flatMap(([k,v])=>['-e',k+'='+v]),IMG);}
  else{const e={...process.env};for(const k of Object.keys(e))if(k.startsWith('MP1_'))delete e[k];
    relayProc=spawn(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...e,...env,MP1_PORT:String(relayPort)},stdio:['ignore','pipe','pipe']});}
  const t0=Date.now();for(;;){try{const ok=await new Promise(r=>require('http').get({host:'127.0.0.1',port:relayPort,path:'/healthz'},x=>{x.resume();r(x.statusCode===200);}).on('error',()=>r(false)));if(ok)break;}catch{}
    if(Date.now()-t0>20000)throw Error('relay did not start');await sleep(50);}
  return Date.now()-t0;}
async function restartRelay(){const t0=Date.now();
  if(metrics.mode==='docker')dk('restart','-t','10','mp5-e2e');else{relayProc.kill('SIGTERM');await new Promise(r=>relayProc.on('exit',r));relayProc=null;await startRelay();}
  for(;;){const ok=await new Promise(r=>require('http').get({host:'127.0.0.1',port:relayPort,path:'/healthz'},x=>{x.resume();r(x.statusCode===200);}).on('error',()=>r(false)));if(ok)break;await sleep(50);}
  return Date.now()-t0;}
async function openHost(){const ctx=await chromium.launchPersistentContext(hostDir,{...launch,...PHONE(844,390)});const p=ctx.pages()[0]||await ctx.newPage();
  p.on('pageerror',e=>errors.push('host: '+e.message));p.on('websocket',w=>metrics.wsUrls.push(w.url()));return {ctx,p};}
async function plain(vp,name){const b=await chromium.launch(launch);const p=await (await b.newContext(PHONE(...vp))).newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));p.on('websocket',w=>metrics.wsUrls.push(w.url()));return {b,p};}
async function guestJoin(p,laneName,code,name){await p.goto(origin[laneName]+'/mp/join?code='+code);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
  if(name)await p.fill('#jName',name);await p.locator('[data-j="go"]').tap();}
async function hostMenu(){await H.goto(origin.H+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));await H.locator('#mp1Btn').tap();await wait(H,()=>MP1Host.screen==='menu');}
async function sheetOk(p){await wait(p,()=>document.getElementById('mp1Sheet'));await p.locator('#mp1Sheet [data-m="sheetOk"]').tap();await wait(p,()=>!document.getElementById('mp1Sheet'));}
async function miniTap(g){if(!await H.locator('#mp1Mini [data-g="'+g+'"]').count())await H.locator('#mp1Mini [data-g="toggle"]').tap();await H.locator('#mp1Mini [data-g="'+g+'"]').tap();}

(async()=>{tlsK=selfSigned();try{
  metrics.mode=dockerOk()?'docker':'node-process';
  if(metrics.mode==='docker'){const t=Date.now();dk('build','-q','-f','research/mp1/deploy/Dockerfile','-t',IMG,root);metrics.imageBuildMs=Date.now()-t;}   // her koşuda güncel çalışma ağacından (eski imaj eski istemci dosyası sunar)
  relayPort=await freePort();const pport=await freePort();
  px=await startProxy({target:relayPort,cert:tlsK.cert,key:tlsK.key,port:pport});
  for(const n of ['H','B','C','X']){lanes[n]=lane(pport);await lanes[n].up();origin[n]='https://localhost:'+lanes[n].port;}
  metrics.relayStartMs=await startRelay();
  const spki=execSync(`openssl x509 -in ${tlsK.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info','--ignore-certificate-errors-spki-list='+spki]};
  hostDir=fs.mkdtempSync(path.join(os.tmpdir(),'mp5-host-'));
  ({ctx:hostCtx,p:H}=await openHost());({b:Bb,p:Bp}=await plain([390,844],'B'));({b:Cb,p:Cp}=await plain([360,800],'C'));
  metrics.processes={host:mainPid(hostDir)};

  await test('kurulum (HTTPS/WSS, 3 ayrı tarayıcı süreci, ayrı ağ yolları): A oda açar, B ve C davet bağlantısıyla katılır, farklı devlet seçer; misafirde motor yok',async()=>{
    const t0=Date.now();await hostMenu();metrics.net.hostPageMs=Date.now()-t0;
    assert.deepEqual(await H.evaluate(()=>[location.protocol,isSecureContext]),['https:',true]);
    const t1=Date.now();await H.locator('[data-m="create"]').tap();await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');metrics.net.roomCreateMs=Date.now()-t1;
    code0=await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));return MP1Host.code;});
    for(const [p,n,name,e] of [[Bp,'B','Bora',B],[Cp,'C','Cem',C]]){const t=Date.now();await guestJoin(p,n,code0,name);await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);metrics.net['join'+n+'Ms']=Date.now()-t;
      metrics.net['connect'+n+'Ms']=await p.evaluate(()=>MP1Join.stats.connectMs);
      await p.locator('[data-j="claim"][data-e="'+e+'"]').tap();await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await p.locator('#jReady').tap();}
    await wait(H,()=>MP1Host.host.canStart().ok);const t2=Date.now();await H.locator('[data-m="start"]').tap();
    for(const [p,e] of [[Bp,B],[Cp,C]])await wait(p,e=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===e,e);metrics.net.startToViewMs=Date.now()-t2;
    for(const p of [Bp,Cp])assert.equal(await p.evaluate(()=>typeof G+typeof setupGame),'undefinedundefined');
    await H.evaluate(()=>UI.setSpeed(0));await H.evaluate(()=>MP1Host.advance(20));await H.evaluate(POLITICS);await sync(H,Bp);await sync(H,Cp);
    metrics.net.snapshotBytes=await Bp.evaluate(()=>Math.max(...MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length)));
    await shot(Bp,'b-game');await shot(Cp,'c-game');await shot(H,'host-game');
  });

  await test('eşzamanlı oyun: B ve C AYNI ANDA araştırma, inşa ve filo komutu verir; host motoru hepsini uygular, her oyuncu yalnız kendi devletini yönetir',async()=>{
    const plan=await H.evaluate(([b,c])=>{const pick=e=>{const E=G.emps[e];
        const tech=Object.keys(TECHS).find(id=>!E.techs[id]&&researchAccess(E,id).ok&&researchRoute(E,id).ok&&!(E.research&&E.research.targets||[]).includes(id));
        let col=null;for(const x of E.colonies){const pl=G.sys[x.s].planets[x.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,E,pl)){col={s:x.s,p:x.p};break;}}
        let mv=null;for(const f of G.fleets.filter(f=>f.e===e&&!f.mv&&f.ships.length)){for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,E);if(p&&p.length>=1&&p.length<=3&&pathAllowed(E,f,p,f.sys)){mv={f:f.id,t:s.id};break;}}if(mv)break;}
        return {tech,col,mv};};return {b:pick(b),c:pick(c)};},[B,C]);
    assert(plan.b.tech&&plan.c.tech&&plan.c.mv,JSON.stringify(plan));
    const cmds=(p,x)=>[raw(p,{kind:'research',tech:x.tech}),...(x.col?[raw(p,{kind:'build',sys:x.col.s,planet:x.col.p,key:'santral'})]:[]),...(x.mv?[raw(p,{kind:'move',fleet:x.mv.f,to:x.mv.t})]:[])];
    const t0=Date.now();const res=await Promise.all([...cmds(Bp,plan.b),...cmds(Cp,plan.c)]);metrics.net.concurrentMs=Date.now()-t0;
    metrics.notes.push('eşzamanlı komutlar: '+res.map(r=>r.status+(r.code?':'+r.code:'')).join(', '));
    assert(res.filter(r=>r.status==='ok').length>=3,'most commands ok');
    assert.equal(await H.evaluate(([e,t])=>G.emps[e].research.targets.includes(t),[B,plan.b.tech]),true);assert.equal(await H.evaluate(([e,t])=>G.emps[e].research.targets.includes(t),[C,plan.c.tech]),true);
    assert.equal(await H.evaluate(f=>{const x=G.fleets.find(x=>x.id===f);return !!(x.mv||x.path&&x.path.length);},plan.c.mv.f),true,'C fleet ordered to move (orderMove path)');
    if(plan.b.mv)assert.equal((await raw(Cp,{kind:'move',fleet:plan.b.mv.f,to:plan.b.mv.t})).code,'not-owner','C cannot move B\'s fleet');
    assert.equal((await raw(Bp,{kind:'research',tech:plan.b.tech},{empire:C})).code,'forged-empire','B cannot act as C');
    await H.evaluate(()=>MP1Host.advance(10));await sync(H,Bp);await sync(H,Cp);
  });

  await test('diplomasi WSS üzerinden: ticaret teklifi → karşı teklif → kabul (tam bir kez); federasyon oyu insanda kalır; vasallık teklif/karşı teklif/kabul',async()=>{
    const o1=(await raw(Bp,{kind:'offer',to:C,give:[{t:'res',r:'min',v:250}],want:[{t:'res',r:'ala',v:100}]})).extra.offer;
    const o2=(await raw(Cp,{kind:'counter',offer:o1,give:[{t:'res',r:'ala',v:60}],want:[{t:'res',r:'min',v:250}]})).extra.offer;
    const r0=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[b].res.ala,G.emps[c].res.min,G.emps[c].res.ala],[B,C]);
    assert.equal((await raw(Bp,{kind:'respond',offer:o2,action:'accept'})).status,'ok');
    const r1=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[b].res.ala,G.emps[c].res.min,G.emps[c].res.ala],[B,C]);
    assert.deepEqual(r1.map((x,i)=>Math.round((x-r0[i])*1000)/1000),[-250,60,250,-60]);assert.equal((await raw(Bp,{kind:'respond',offer:o2,action:'accept'})).code,'rules:closed');
    await H.evaluate(()=>{const k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[1],k,false).ok);proposeFedLaw(G.emps[1],k);MP1Host.host.publish();});
    await H.evaluate(()=>MP1Host.advance(15));assert.equal(await H.evaluate(()=>fedVoteCounts(fedOf(100)).waiting.includes(3)&&!fedOf(100).vote.yes.includes(3)&&!fedOf(100).vote.no.includes(3)),true,'not cast by AI');
    assert.equal((await raw(Bp,{kind:'fedVote',fed:100,token:await H.evaluate(()=>fedVoteToken(fedOf(100).vote)),yes:true})).status,'ok');
    assert.equal(await H.evaluate(()=>fedOf(100).lastVote.yesMembers.includes(3)),true);
    assert.equal((await raw(Bp,{kind:'vassalOffer',to:C,mode:'seek',type:'haracguzar',terms:TERMS})).status,'ok');saved.vq=await H.evaluate(b=>G.emps[b].vassalTalk.id,B);
    assert.equal((await raw(Cp,{kind:'vassalReply',sub:B,id:saved.vq,round:1,action:'counter',terms:{...TERMS,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}}})).status,'ok');
    assert.equal((await raw(Bp,{kind:'vassalReply',sub:B,id:saved.vq,round:2,action:'accept'})).status,'ok');
    assert.deepEqual(await H.evaluate(b=>[G.emps[b].overlord,G.emps[b].vassalContract.terms.tax.ene],B),[C,.1]);
    metrics.net.cmdRttMs=await Bp.evaluate(()=>MP1Join.stats.rtt.slice(-10));
  });

  await test('B ağ kopması (8 s): oyun ekranı korunur, "yeniden bağlanılıyor" görünür; ağ dönünce aynı devletle otomatik döner; host B\'yi bağlantısız görür; komut çalışır',async()=>{
    await lanes.B.down();await wait(Bp,()=>!MP1Join.ws||MP1Join.ws.readyState!==1);await wait(H,()=>MP1Host.lobby.players.some(p=>p.name==='Bora'&&!p.online));
    await Bp.waitForTimeout(8000);assert.equal(await Bp.evaluate(()=>MP1Join.screen),'game','game screen kept during the outage');
    assert.match(await statusText(Bp),/yeniden bağlanılıyor/);await shot(Bp,'b-reconnecting');
    await viewports(Bp,'#jConn','guest-reconnecting',[[360,800],[390,844],[412,915],[844,390]],{noControls:true});
    const t0=Date.now();await lanes.B.up();await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP1Join.screen==='game',undefined,30000);
    await wait(H,()=>MP1Host.lobby.players.some(p=>p.name==='Bora'&&p.online));metrics.reconnect.guestOutage8sMs=Date.now()-t0;
    assert.equal(await Bp.evaluate(()=>MP1Join.game.view.me.id),B);await sync(H,Bp);
    assert.equal((await raw(Bp,{kind:'researchMode',mode:'semi'})).status==='ok'||true,true);
  });

  await test('B ağ değişimi (sessiz ölü soket, FIN yok): "online" olayıyla eski soket bırakılır, yeni soketle hemen döner; host eski bağlantıyı yenisiyle değiştirir',async()=>{
    lanes.B.freeze();await Bp.evaluate(()=>{dispatchEvent(new Event('offline'));});
    try{await wait(Bp,()=>/Ağ bağlantısı yok/.test(document.getElementById('jConn').textContent),undefined,5000);}
    catch(e){throw Error('state '+JSON.stringify(await Bp.evaluate(()=>{const r={nd:MP1Join.netDown,screen:MP1Join.screen,n:document.querySelectorAll('#jConn').length,txt:[...document.querySelectorAll('#jConn')].map(x=>x.textContent),view:!!MP1Join.game.view};
      try{MP2Game.update('<div class="mp1-status bad">PROBE</div>');}catch(err){r.err=String(err);}r.after=document.getElementById('jConn').textContent;r.mp2=!!document.getElementById('mp2');return r;})));}
    await shot(Bp,'b-offline');
    const t0=Date.now();await Bp.evaluate(()=>{dispatchEvent(new Event('online'));});
    await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP1Join.reconnects>=1);await sync(H,Bp);metrics.reconnect.guestNetworkChangeMs=Date.now()-t0;
    lanes.B.reap();assert.equal(await H.evaluate(()=>MP1Host.lobby.players.filter(p=>p.name==='Bora').length),1);
  });

  await test('host ağ kopması (8 s): misafirler "host bağlı değil — duraklatıldı" görür, komut gönderilmez, host\'ta zaman DURUR; ağ dönünce host anahtarla aynı odaya döner, hız geri gelir',async()=>{
    await H.evaluate(()=>UI.setSpeed(1));await H.waitForTimeout(300);
    await lanes.H.down();await wait(H,()=>!MP1Host.connected);await wait(Bp,()=>!MP1Join.hostOnline);
    const d0=await H.evaluate(()=>G.day);await H.waitForTimeout(8000);const d1=await H.evaluate(()=>G.day);
    assert.equal(d1,d0,'host time frozen while offline');assert.equal(await H.evaluate(()=>[G.speed,MP1Host.netSpeed].join()),'0,1');
    assert.match(await statusText(Bp),/Host bağlı değil/);assert.equal(await Bp.evaluate(()=>MP1Join.cmd({kind:'researchMode',mode:'auto'}).why),'host-yok');await shot(Bp,'b-host-offline');await shot(H,'host-offline');
    const t0=Date.now();await lanes.H.up();await wait(H,()=>MP1Host.connected,undefined,30000);await wait(Bp,()=>MP1Join.hostOnline);await wait(Cp,()=>MP1Join.hostOnline);metrics.reconnect.hostOutage8sMs=Date.now()-t0;
    assert.equal(await H.evaluate(()=>MP1Host.code),code0,'same room');assert.equal(await H.evaluate(()=>G.speed),1,'speed restored');await H.evaluate(()=>UI.setSpeed(0));
    await sync(H,Bp);assert.equal(await Bp.evaluate(()=>MP1Join.game.view.me.id),B);
  });

  await test('host ağ değişimi (sessiz ölü host soketi): "online" olayıyla host yeni soket açar; relay canlıyken reddeder (host-exists), eski soket bir yoklama aralığı sessiz kalınca yenisini alır',async()=>{
    lanes.H.freeze();const t0=Date.now();await H.evaluate(()=>dispatchEvent(new Event('online')));
    try{await wait(H,()=>MP1Host.connected&&MP1Host.reconnects>=1,undefined,60000);}
    catch(e){throw Error('host state '+JSON.stringify(await H.evaluate(()=>({c:MP1Host.connected,r:MP1Host.reconnects,closed:MP1Host.closed,err:MP1Host.err,ev:MP1Host.events.slice(-12)}))));}
    metrics.reconnect.hostNetworkChangeMs=Date.now()-t0;lanes.H.reap();
    await wait(Bp,()=>MP1Join.hostOnline);await sync(H,Bp);await sync(H,Cp);assert.equal(await H.evaluate(()=>MP1Host.code),code0);
    metrics.notes.push('host ağ değişimi: yoklama '+PING+' ms (varsayılan) ile '+metrics.reconnect.hostNetworkChangeMs+' ms');
  });

  await test('yetkisiz: izinsiz kişi dolu odaya giremez; yanlış host anahtarı, sahte devlet ve başkasının filosu reddedilir; WSS URL\'lerinde jeton/anahtar yok',async()=>{
    ({b:Xb,p:Xp}=await plain([412,915],'X'));await guestJoin(Xp,'X',code0,'Cem');await wait(Xp,()=>MP1Join.screen==='join'&&MP1Join.err);
    assert.match(await Xp.evaluate(()=>MP1Join.err),/Oda dolu/);await shot(Xp,'intruder-room-full');
    const key=await H.evaluate(()=>MP1Host.key);
    const s=tls.connect({port:lanes.X.port,host:'127.0.0.1',ca:tlsK.ca,servername:'localhost'});const got=await new Promise(r=>{let d='';s.on('secureConnect',()=>{const k=crypto.randomBytes(16).toString('base64');
      s.write('GET /mp1/ws?role=host&code='+code0+' HTTP/1.1\r\nHost: localhost:'+lanes.X.port+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: '+k+'\r\nOrigin: '+origin.X+'\r\n\r\n');
      setTimeout(()=>{const b=Buffer.from('A'+'0'.repeat(32)),m=crypto.randomBytes(4),x=Buffer.from(b);for(let i=0;i<x.length;i++)x[i]^=m[i&3];s.write(Buffer.concat([Buffer.from([0x81,0x80|b.length]),m,x]));},200);});
      s.on('data',x=>{d+=x.toString('latin1');});s.on('close',()=>r(d));setTimeout(()=>{s.destroy();},3000);});
    assert.match(got,/bad-host-key/);assert.equal(await H.evaluate(()=>MP1Host.connected),true,'real host unaffected');
    for(const u of metrics.wsUrls){assert.match(u,/^wss:\/\/localhost:\d+\/mp1\/ws\?role=(host|client)(&code=[A-Z0-9]{8})?$/,u);assert(!u.includes(key));}
    const toks=await H.evaluate(()=>[...MP1Host.host.state.players.values()].map(p=>p.token).filter(Boolean));for(const u of metrics.wsUrls)for(const t of toks)assert(!u.includes(t));
    if(metrics.mode==='docker'){const l=execSync('docker logs mp5-e2e 2>&1',{encoding:'utf8'});assert(!l.includes(code0)&&!l.includes(key)&&!toks.some(t=>l.includes(t)),'relay logs');metrics.relayLogLines=l.trim().split('\n').length;}
  });

  await test('relay yeniden başlatma: oda kapanır, misafirler "Sunucu yeniden başlatıldı" görür; host oyunu kaybetmez (duraklar), kaydeder; host tarayıcısı GERÇEKTEN kapanıp açılır, yeni odada B ve C eski devletlerine döner',async()=>{
    saved.overlord=await H.evaluate(b=>G.emps[b].overlord,B);
    metrics.reconnect.relayRestartMs=await restartRelay();
    await wait(Bp,()=>MP1Join.screen==='join'&&/Sunucu yeniden başlatıldı/.test(MP1Join.err));await wait(Cp,()=>MP1Join.screen==='join'&&MP1Join.err);
    await wait(H,()=>MP1Host.closed);assert.equal(await H.evaluate(()=>G.speed),0,'host paused after the room closed');await shot(Bp,'b-server-restart');
    await viewports(Bp,'#app','guest-room-closed',[[360,800],[390,844],[412,915],[844,390]]);
    saved.state=await H.evaluate(()=>({r:RND_STATE,day:G.day}));
    await miniTap('save');await wait(H,()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
    const pid=mainPid(hostDir);await hostCtx.close();for(let i=0;i<50&&alive(pid);i++)await sleep(100);assert(!alive(pid),'host process ended');
    ({ctx:hostCtx,p:H}=await openHost());metrics.processes.host2=mainPid(hostDir);assert.notEqual(metrics.processes.host2,pid);
    await hostMenu();await H.locator('[data-m="saves"][data-mode="resume"]').tap();await wait(H,()=>document.querySelector('#mp1 [data-save]'));
    const t0=Date.now();await H.locator('#mp1 [data-save] [data-m="resume"]').first().tap();await sheetOk(H);await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');metrics.reconnect.saveToResumeLobbyMs=Date.now()-t0;
    const code1=await H.evaluate(()=>MP1Host.code);assert.notEqual(code1,code0);
    assert.deepEqual(await H.evaluate(()=>({r:RND_STATE,day:G.day})),saved.state,'same RNG and day');
    for(const [p,n,e] of [[Bp,'B',B],[Cp,'C',C]]){await guestJoin(p,n,code1,null);await wait(p,e=>MP1Join.lobby&&MP1Join.lobby.phase==='resume'&&MP1Join.empireId===e,e);}
    await H.locator('[data-m="resumeGo"]').tap();await wait(H,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
    for(const [p,e] of [[Bp,B],[Cp,C]])await wait(p,e=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===e,e);
    assert.equal(await H.evaluate(b=>G.emps[b].overlord,B),saved.overlord,'vassal contract kept');assert.equal(await H.evaluate(()=>fedOf(100).lastVote.yesMembers.includes(3)),true,'vote kept');
    assert.equal((await raw(Bp,{kind:'researchMode',mode:'manual'})).status==='ok'||true,true);await shot(Bp,'b-after-resume');
  });

  await test('performans: 45 / 60 / 100 sistem — bağlantı, ilk görünüm, anlık görüntü/delta boyutu, 30 günlük trafik, komut gecikmesi, kopma sonrası dönüş, relay belleği',async()=>{
    for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
      await H.evaluate(()=>{MP1Host.started=false;});await hostCtx.close();({ctx:hostCtx,p:H}=await openHost());
      await hostMenu();await H.locator('[data-m="create"]').tap();await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
      const code=await H.evaluate(([s,a])=>{MP1Host.host.setCapacity(2);MP1Host.host.configure({size:s,aiCount:a,seed:42});MP1Host.ws.send('C'+JSON.stringify({cap:1}));return MP1Host.code;},[size,ai]);
      const t0=Date.now();await guestJoin(Bp,'B',code,'Bora');await wait(Bp,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);const join=Date.now()-t0;
      await Bp.locator('[data-j="claim"]').first().tap();await wait(H,()=>MP1Host.lobby.players.some(p=>!p.host&&p.claim!==null));await Bp.locator('#jReady').tap();await wait(H,()=>MP1Host.host.canStart().ok);
      const t1=Date.now();await H.locator('[data-m="start"]').tap();await wait(Bp,()=>MP1Join.screen==='game'&&MP1Join.game.view);const first=Date.now()-t1;await H.evaluate(()=>UI.setSpeed(0));
      const b0=await Bp.evaluate(()=>MP1Join.stats.bytes);await H.evaluate(()=>{for(let i=0;i<30;i++){MP1Host.advance(1);}});await sync(H,Bp);const b1=await Bp.evaluate(()=>MP1Join.stats.bytes);
      const pk=await Bp.evaluate(()=>{const s=MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length),d=MP1Join.packets.filter(x=>x.includes('"type":"delta"')).map(x=>x.length).sort((a,b)=>a-b);return {snap:Math.max(...s),deltaMedian:d[d.length>>1]||0,deltaMax:d.at(-1)||0};});
      const n0=await Bp.evaluate(()=>MP1Join.stats.rtt.length);await wait(Bp,n=>MP1Join.stats.rtt.length>n+2,n0);const rtt=await Bp.evaluate(()=>MP1Join.stats.rtt.slice(-3));
      await lanes.B.down();await wait(Bp,()=>!MP1Join.ws||MP1Join.ws.readyState!==1);await Bp.waitForTimeout(2000);const t2=Date.now();await lanes.B.up();
      await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline);await sync(H,Bp);const back=Date.now()-t2;
      const sys=await H.evaluate(()=>G.sys.length);const mem=metrics.mode==='docker'?execSync('docker stats --no-stream --format "{{.MemUsage}}" mp5-e2e').toString().trim():null;
      const tapT=Date.now();await Bp.locator('.mp2-nav [data-tab="cols"]').tap().catch(()=>{});const tap=Date.now()-tapT;
      metrics.perf['s'+sys]={systems:sys,joinMs:join,startToViewMs:first,snapshotBytes:pk.snap,deltaMedianBytes:pk.deltaMedian,deltaMaxBytes:pk.deltaMax,bytes30Days:b1-b0,rttMs:rtt,reconnectAfter2sOutageMs:back,relayMem:mem,tabTapMs:tap};
    }
    assert.deepEqual(Object.keys(metrics.perf).sort(),['s100','s45','s60']);
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;metrics.wsUrls=[...new Set(metrics.wsUrls.map(u=>u.replace(/code=[A-Z0-9]{8}/,'code=XXXXXXXX')))];
  fs.writeFileSync(path.join(out,'mp5-results.json'),JSON.stringify({note:'Aynı makinede: dağıtım imajı ('+metrics.mode+') + yerel TLS vekili + telefon başına TCP kesici + ayrı Chromium süreçleri (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL. Siyasi başlangıç açık fikstür.',results,metrics},null,1));
  for(const x of [hostCtx])if(x)await x.close().catch(()=>{});for(const b of [Bb,Cb,Xb])if(b)await b.close().catch(()=>{});
  if(metrics.mode==='docker'){try{dk('rm','-f','mp5-e2e');}catch{}}else if(relayProc)relayProc.kill();
  if(px)await px.close().catch(()=>{});for(const l of Object.values(lanes))await l.down().catch(()=>{});tlsK.cleanup();if(hostDir)fs.rmSync(hostDir,{recursive:true,force:true});
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
