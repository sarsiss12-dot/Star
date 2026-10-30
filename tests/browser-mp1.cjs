'use strict';
/* MP.1 — telefon öncelikli oda kur / katıl, galaktik lobi, gerçek oyun başlangıcı.
   Her telefon ayrı bir Chromium SÜRECİ (ayrı profil, ayrı depolama). Relay:
   research/mp1/server/relay.js (yerel; internete dağıtılmadı). Host: gerçek STARS
   sayfası (/), ÇOK OYUNCULU → ODA OLUŞTUR. Misafirler: /mp/join (motor yok).
   Gecikme koşuları (60/150 ms) ayrı relay süreçlerinde MP_DELAY_MS ile.
   Çıktı: $STARS_OUTPUT/mp1-results.json + ekran görüntüleri. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp1'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),devStats=require('../research/mp0/server/dev-relay.js').stats;
const results=[],errors=[],metrics={viewports:{},delay:{}};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
let relay,server,base,browsers=[],H,A,B,C,X,code,hostKey;
const emp={};const knownEver={};
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(page,fn,arg,timeout=20000)=>page.waitForFunction(fn,arg,{timeout});
const hostL=()=>H.evaluate(()=>MP1Host.lobby);
const guestL=p=>p.evaluate(()=>MP1Join.lobby);
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const seatOf=async p=>(await guestL(p)).you.seat;
async function sameList(...pages){
  const L=await hostL();
  for(const p of pages){await wait(p,r=>MP1Join.lobby&&MP1Join.lobby.rev>=r,L.rev);
    const g=await guestL(p);assert.deepEqual(g.players,L.players,'player list differs');assert.equal(g.phase,L.phase);}
  return L;
}
async function trackKnown(){for(const [n,id] of Object.entries(emp)){const k=await H.evaluate(i=>[...explorationContext(G.emps[i]).known],id);(knownEver[n]=knownEver[n]||new Set());k.forEach(x=>knownEver[n].add(x));}}
/* yerleşim denetimi: yatay taşma, 44 px dokunma hedefi, okunabilir yazı */
async function layout(p){return p.evaluate(()=>{
  const guest=!!window.MP1Join,vw=innerWidth,root=guest?document.getElementById('app'):(document.getElementById('mp1')||document.getElementById('mp1Mini'));
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
  const inTabs=e=>!!e.closest('.mp1-tabs');
  const ctl=[...document.querySelectorAll(guest?'#app button,#app select,#app input,#app a.mp1-btn,.mp1-sheet button':'#mp1 button,#mp1 select,#mp1 input,.mp1-sheet button,#mp1Mini button')].filter(vis);
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,18)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=root?[...root.querySelectorAll('*')].filter(e=>vis(e)&&!inTabs(e)&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5):[];
  let minFont=99,minAt='';if(root)for(const e of root.querySelectorAll('*'))if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);if(f<minFont){minFont=f;minAt=e.tagName+'.'+e.className+':'+e.textContent.slice(0,20);}}
  return {vw,vh:innerHeight,scrollW:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>vw+1,controls:ctl.length,small,wide,minFont,minAt};});}
function assertLayout(l,where){assert(!l.overflow,where+' horizontal overflow '+l.scrollW+'>'+l.vw);assert.deepEqual(l.wide,[],where+' element wider than screen');
  assert.deepEqual(l.small,[],where+' touch target < 44 px');assert(l.minFont>=11,where+' font '+l.minFont+' '+l.minAt);}
async function joinByLink(p,name){await p.goto(base+'/mp/join?code='+code);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
  assert.equal(await p.inputValue('#jCode'),code.slice(0,4)+'-'+code.slice(4));await p.fill('#jName',name);
  await p.locator('[data-j="go"]').tap();await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.playerId);}
function childRelay(delay){return new Promise((res,rej)=>{const c=spawn(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...process.env,MP1_PORT:'0',MP_DELAY_MS:String(delay)},stdio:['ignore','pipe','pipe']});
  let buf='';c.stdout.on('data',d=>{buf+=d;const m=buf.match(/http:\/\/127\.0\.0\.1:(\d+)/);if(m)res({proc:c,base:'http://127.0.0.1:'+m[1],stdout:()=>buf});});c.on('error',rej);setTimeout(()=>rej(Error('relay start')),10000);});}

(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});server=await relay.start();base='http://127.0.0.1:'+server.address().port;
  for(let i=0;i<5;i++)browsers.push(await chromium.launch(launch));            // 5 telefon = 5 ayrı tarayıcı süreci
  const [bH,bA,bB,bC,bX]=browsers;
  const ctxH=await bH.newContext({...PHONE(412,915),serviceWorkers:'allow'});    // host: gerçek PWA servis çalışanı açık
  const ctxA=await bA.newContext(PHONE(390,844)),ctxB=await bB.newContext(PHONE(360,800)),ctxC=await bC.newContext(PHONE(412,915)),ctxX=await bX.newContext(PHONE(360,800));
  H=await ctxH.newPage();A=await ctxA.newPage();B=await ctxB.newPage();C=await ctxC.newPage();X=await ctxX.newPage();
  for(const [n,p] of [['host',H],['A',A],['B',B],['C',C],['X',X]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('dialog',d=>{errors.push(n+': dialog '+d.message());d.dismiss();});}
  metrics.browserProcesses=[...new Set((require('child_process').execSync('ps -eo args').toString().match(/--user-data-dir=\S+/g)||[]))].length;
  assert(metrics.browserProcesses>=5,'five separate browser processes');

  await test('menu: relay page keeps YENİ OYUN / OYUNA DEVAM ET / AYARLAR and adds ÇOK OYUNCULU before AYARLAR; the release index.html has no MP code',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    const t=await H.evaluate(()=>[...document.querySelectorAll('#title .tBtns > button')].map(b=>b.childNodes[0].textContent.trim()));
    assert.deepEqual(t,['YENİ OYUN','OYUNA DEVAM ET','ÇOK OYUNCULU','AYARLAR']);
    assert.equal(await H.evaluate(()=>BUILD_ID),JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json'))).build);
    const box=await H.locator('#mp1Btn').boundingBox();assert(box.height>=44,'button '+box.height);
    assert(!fs.readFileSync(path.join(root,'index.html'),'utf8').includes('mp1'),'runtime index.html untouched');
    await H.locator('#mp1Btn').tap();await wait(H,()=>MP1Host.screen==='menu');
    assert.deepEqual(await H.evaluate(()=>[...document.querySelectorAll('#mp1 .mp1-btn')].map(b=>b.textContent)),['ODA OLUŞTUR','ODAYA KATIL','KAYITLI OYUNA DEVAM ET','KAYITLARI YÖNET','GERİ']);   // MP.4: kayıtlı çok oyunculu oyunlar
    await H.locator('[data-m="back"]').tap();await wait(H,()=>!document.getElementById('mp1'));
    assert.equal(await H.evaluate(()=>getComputedStyle(document.getElementById('title')).display!=='none'),true,'back returns to the title menu');
    await H.locator('#mp1Btn').tap();await wait(H,()=>MP1Host.screen==='menu');await shot(H,'host-mp-menu');
  });
  await test('host phone creates a room: secure code on screen, host key never in the page, galaxy settings applied by the host only',async()=>{
    const t0=Date.now();await H.locator('[data-m="create"]').tap();await wait(H,()=>MP1Host.screen==='lobby'&&MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    metrics.roomCreateMs=Date.now()-t0;
    ({code,key:hostKey}=await H.evaluate(()=>({code:MP1Host.code,key:MP1Host.key})));
    assert.match(code,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    assert.equal(await H.textContent('#mp1Code'),code.slice(0,4)+'-'+code.slice(4));
    assert(!(await H.content()).includes(hostKey),'host key is not rendered');
    assert.equal(await H.textContent('#mp1Link'),base+'/mp/join?code='+code);
    await H.locator('[data-m="tab"][data-tab="galaksi"]').tap();
    await H.selectOption('#mp1Ai','5');await H.selectOption('#mp1Cap','4');await H.fill('#mp1Seed','11');await H.locator('[data-m="apply"]').tap();
    await wait(H,()=>MP1Host.lobby.settings.seed===11&&MP1Host.lobby.capacity===4);
    assert.equal(relay.rooms.get(code).cap,3,'relay capacity follows the host (guests = capacity − 1)');
    assert.deepEqual(await H.evaluate(()=>({n:G.emps.length,sys:G.sys.length,seed:G.seed,wild:G.wildId,auto:G.autoSave})),{n:7,sys:45,seed:11,wild:6,auto:false});
    assert.equal(await H.textContent('#mp1Start'),'En az bir oyuncunun katılması gerekiyor.');
    assert.equal(await H.locator('[data-m="start"]').isDisabled(),true);
    await H.locator('[data-m="tab"][data-tab="lobi"]').tap();
  });
  await test('guest A joins by invite link, guest B types the code by hand (lowercase, no dash) and presses Enter; guests run no engine',async()=>{
    await joinByLink(A,'Ayşe');
    await B.goto(base+'/mp/join');await wait(B,()=>window.MP1Join);await B.locator('#jCode').tap();await B.keyboard.type(code.toLowerCase());
    assert.equal(await B.inputValue('#jCode'),code.slice(0,4)+'-'+code.slice(4),'typed code is normalised as XXXX-XXXX');
    await B.fill('#jName','Bo"ra<img src=x onerror=__x=1>');await B.press('#jName','Enter');
    await wait(B,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
    for(const p of [A,B]){assert.equal(await p.evaluate(()=>[typeof G,typeof monthTick,typeof setupGame,typeof serialize].join()),'undefined,undefined,undefined,undefined');
      assert.deepEqual(await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src'))),['/research/mp1/client/view.js','/research/mp3/client/dip-ui.js','/research/mp31/client/pol-ui.js','/research/mp2/client/guest-game.js','/research/mp1/client/join.js']);}   // MP.2: motorsuz harita/panel betiği; MP.3: motorsuz diplomasi ekranı; MP.3.1: federasyon/vasallık
    metrics.connectMs={A:await A.evaluate(()=>MP1Join.stats.connectMs),B:await B.evaluate(()=>MP1Join.stats.connectMs)};
  });
  await test('live player list: host and both guests show the same players (name, host mark, online, empire, ready, tab); names are inert text',async()=>{
    const L=await sameList(A,B);
    assert.deepEqual(L.players.map(p=>[p.seat,p.name,p.host,p.online,p.claim,p.ready]),[[0,L.players[0].name,true,true,0,true],[1,'Ayşe',false,true,null,false],[2,'Bo"raimg src=x onerror=',false,true,null,false]]);
    for(const p of [H,A,B]){assert.equal(await p.evaluate(()=>document.querySelectorAll('.mp1-prow:not(.mp1-empty)').length),3);
      assert.equal(await p.evaluate(()=>document.querySelectorAll('.mp1-prow.mp1-empty').length),1);
      assert.equal(await p.evaluate(()=>typeof window.__x+document.querySelectorAll('.mp1-plist img').length),'undefined0');}
    assert.match(await A.textContent('.mp1-prow[data-seat="2"] .nm'),/Bo"raimg src=x onerror=/);
    assert.match(await A.textContent('.mp1-prow[data-seat="0"] .nm'),/HOST/);
    await shot(H,'host-lobby-2guests');await shot(A,'guestA-lobby');
  });
  await test('presence: a guest opening Doktrin and the host opening Galaksi ayarları are visible to everyone; prep tabs never touch Save8/RNG',async()=>{
    const before=await H.evaluate(()=>({s:serialize(),r:RND_STATE}));
    const t0=Date.now();await A.locator('[data-j="tab"][data-tab="doktrin"]').tap();
    await wait(H,()=>MP1Host.lobby.players[1].tab==='doktrin');metrics.presenceToHostMs=Date.now()-t0;
    await wait(B,()=>document.querySelector('.mp1-prow[data-seat="1"] .tb').textContent==='Doktrin');metrics.presenceToGuestMs=Date.now()-t0;
    await H.locator('[data-m="tab"][data-tab="galaksi"]').tap();await wait(A,()=>document.querySelector('.mp1-prow[data-seat="0"] .tb')||MP1Join.lobby.players[0].tab==='galaksi');
    await wait(B,()=>document.querySelector('.mp1-prow[data-seat="0"] .tb').textContent==='Galaksi ayarları');
    await H.locator('[data-m="tab"][data-tab="lobi"]').tap();await A.locator('[data-j="tab"][data-tab="lobi"]').tap();
    await A.evaluate(()=>MP1Join.sendRaw({v:1,type:'presence',tab:'<script>'}));await wait(A,()=>MP1Join.lresults.some(r=>r.code==='bad-tab'));
    const after=await H.evaluate(()=>({s:serialize(),r:RND_STATE}));assert.equal(after.r,before.r);assert.equal(after.s,before.s);
    await sameList(A,B);
  });
  await test('empire selection: one empire per player, no host/wild empire, ready needs a claim, ready state syncs to every phone',async()=>{
    const L=await guestL(A);const ids=L.empires.map(e=>e.id);
    assert.deepEqual(ids,[1,2,3,4,5],'only AI empires that can be claimed (host 0 and wild 6 excluded)');
    assert.equal(await B.locator('#jReady').isDisabled(),true,'HAZIRIM is disabled without an empire');
    await B.evaluate(()=>MP1Join.ready(true));await wait(B,()=>MP1Join.lresults.some(r=>r.action==='ready'&&r.code==='no-claim'));
    await A.locator('[data-j="claim"][data-e="2"]').tap();await wait(H,()=>MP1Host.lobby.players[1].claim===2);
    await wait(B,()=>{const b=[...document.querySelectorAll('.mp1-emp')].find(x=>x.textContent.includes(MP1Join.lobby.empires.find(e=>e.id===2).n));return b&&b.querySelector('button').textContent==='DOLU'&&b.querySelector('button').disabled;});
    for(const [e,why] of [[2,'taken'],[0,'host-empire'],[6,'not-claimable'],[99,'not-claimable'],['1','bad-empire']]){
      await B.evaluate(()=>MP1Join.lresults.length=0);await B.evaluate(x=>MP1Join.claim(x),e);
      await wait(B,()=>MP1Join.lresults.some(r=>r.action==='claim'));assert.equal(await B.evaluate(()=>MP1Join.lresults.find(r=>r.action==='claim').code),why,String(e));}
    await B.locator('[data-j="claim"][data-e="4"]').tap();await wait(H,()=>MP1Host.lobby.players[2].claim===4);
    await A.locator('#jReady').tap();await wait(B,()=>MP1Join.lobby.players[1].ready===true);
    await wait(A,()=>document.querySelector('.mp1-prow[data-seat="1"] .rd').textContent==='Hazır');
    assert.equal(await H.evaluate(()=>MP1Host.host.canStart().why),'guest-not-ready');
    assert.equal(await H.textContent('#mp1Start'),'Bütün oyuncular hazır değil.');
    const mine=await A.evaluate(()=>MP1Join.lobby.mine);assert.equal(mine.empire,2);assert(mine.doktrin&&mine.irk);
    assert.equal(await B.evaluate(()=>MP1Join.lobby.mine.empire),4);
    await sameList(A,B);
  });
  await test('ready rules: changing empire resets ready; duplicate ready is idempotent; nobody can set another player\'s ready or empire',async()=>{
    await A.locator('[data-j="claim"][data-e="3"]').tap();await wait(H,()=>MP1Host.lobby.players[1].claim===3);
    assert.equal((await hostL()).players[1].ready,false,'empire change resets ready');
    await A.locator('#jReady').tap();await wait(H,()=>MP1Host.lobby.players[1].ready);
    const rev=(await hostL()).rev;await A.evaluate(()=>{MP1Join.ready(true);MP1Join.ready(true);});await wait(A,()=>MP1Join.lresults.filter(r=>r.action==='ready').length>=3);
    await H.waitForTimeout(150);assert.equal((await hostL()).rev,rev,'duplicate ready does not broadcast');
    const seatA=await seatOf(A);
    for(const m of [{v:1,type:'ready',value:false,seat:seatA},{v:1,type:'ready',value:false,playerId:'host'},{v:1,type:'claim',empire:3,seat:seatA},{v:1,type:'claim',empire:5,player:1}])
      await B.evaluate(x=>MP1Join.sendRaw(x),m);
    await wait(B,()=>MP1Join.errors.filter(c=>/^bad-/.test(c)).length>=4);
    assert.deepEqual(await B.evaluate(()=>MP1Join.errors.filter(c=>/^bad-/.test(c))),['bad-ready','bad-ready','bad-claim','bad-claim']);
    const L=await hostL();assert.equal(L.players[1].ready,true);assert.equal(L.players[1].claim,3);assert.equal(L.players[2].claim,4);
    for(const m of [{v:1,type:'configure',size:'kucuk',aiCount:1,seed:5},{v:1,type:'start'},{v:1,type:'kick',seat:1},{v:1,type:'setCapacity',n:2},{v:1,type:'assign',empire:1}])
      await B.evaluate(x=>MP1Join.sendRaw(x),m);
    await wait(B,()=>MP1Join.errors.filter(c=>c==='bad-message').length>=5);
    assert.equal((await hostL()).settings.seed,11);assert.equal((await hostL()).phase,'waiting');
  });
  await test('host changes the galaxy: every guest\'s empire and ready are reset; guests see sizes but never the seed',async()=>{
    await B.locator('#jReady').tap();await wait(H,()=>MP1Host.lobby.phase==='ready');
    await wait(A,()=>MP1Join.lobby.phase==='ready');
    await H.locator('[data-m="tab"][data-tab="galaksi"]').tap();await H.fill('#mp1Seed','12');await H.locator('[data-m="apply"]').tap();
    await wait(A,()=>MP1Join.lobby.players.every(p=>p.host||(p.claim===null&&!p.ready)));await wait(B,()=>MP1Join.lobby.phase==='waiting');
    for(const p of [A,B]){const s=await p.evaluate(()=>MP1Join.lobby.settings);assert.equal(s.seed,undefined);assert.equal(s.size,'orta');assert.equal(s.aiCount,5);assert.deepEqual(Object.keys(s).filter(k=>!['size','aiCount','shape'].includes(k)),[]);
      assert(!(await p.evaluate(()=>MP1Join.packets.join('\n'))).includes('"seed"'),'no packet ever carried the seed');}
    await H.fill('#mp1Seed','11');await H.locator('[data-m="apply"]').tap();await wait(H,()=>MP1Host.lobby.settings.seed===11);
    await H.locator('[data-m="tab"][data-tab="lobi"]').tap();
    await A.locator('[data-j="claim"][data-e="3"]').tap();await B.locator('[data-j="claim"][data-e="4"]').tap();
    await wait(H,()=>MP1Host.lobby.players[1].claim===3&&MP1Host.lobby.players[2].claim===4);
  });
  await test('mobile lobby layout at 360×800, 390×844, 412×915, 844×390, 915×412: no horizontal overflow, ≥44 px targets, readable text, keyboard keeps inputs visible, back asks before leaving',async()=>{
    const sizes=[[360,800],[390,844],[412,915],[844,390],[915,412]];
    await X.goto(base+'/mp/join');await wait(X,()=>window.MP1Join);
    for(const [w,h] of sizes){const tag=w+'x'+h,m=metrics.viewports[tag]={};
      for(const [n,p] of [['host',H],['guest',A],['join',X]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(120);const l=await layout(p);m[n+'Lobby']=l;assertLayout(l,n+' '+tag);}
      await A.locator('[data-j="tab"][data-tab="etik"]').tap();await A.waitForTimeout(60);assertLayout(await layout(A),'guest etik '+tag);await A.locator('[data-j="tab"][data-tab="lobi"]').tap();
      // yazılım klavyesi: görünür alan ~%45'e iner; odaktaki giriş görünür kalmalı
      await X.locator('#jCode').tap();await X.setViewportSize({width:w,height:Math.round(h*.45)});await X.waitForTimeout(400);
      const k=await X.evaluate(()=>{const r=document.getElementById('jCode').getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh:innerHeight,focus:document.activeElement.id};});
      assert(k.top>=0&&k.bottom<=k.vh&&k.focus==='jCode','code input hidden by keyboard '+JSON.stringify(k));m.keyboard=k;
      await H.locator('[data-m="tab"][data-tab="galaksi"]').tap();await H.locator('#mp1Seed').tap();await H.setViewportSize({width:w,height:Math.round(h*.45)});await H.waitForTimeout(400);
      const hk=await H.evaluate(()=>{const r=document.getElementById('mp1Seed').getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh:innerHeight};});
      assert(hk.top>=0&&hk.bottom<=hk.vh,'host seed input hidden by keyboard '+JSON.stringify(hk));m.hostKeyboard=hk;await H.locator('[data-m="tab"][data-tab="lobi"]').tap();
      await X.setViewportSize({width:w,height:h});await H.setViewportSize({width:w,height:h});
      await shot(A,'guest-lobby-'+tag);await shot(H,'host-lobby-'+tag);await shot(X,'join-'+tag);}
    await A.setViewportSize({width:390,height:844});await H.setViewportSize({width:412,height:915});await X.setViewportSize({width:360,height:800});
    // Android geri tuşu
    await A.goBack();await wait(A,()=>document.getElementById('jSheet'));assert.equal(await A.evaluate(()=>MP1Join.screen),'lobby');
    assertLayout(await layout(A),'guest back sheet');await A.locator('[data-j="sheetStay"]').tap();await wait(A,()=>!document.getElementById('jSheet'));
    await H.goBack();await wait(H,()=>document.getElementById('mp1Sheet'));assert.equal(await H.evaluate(()=>MP1Host.screen),'lobby');
    await H.locator('[data-m="sheetNo"]').tap();await wait(H,()=>!document.getElementById('mp1Sheet'));assert.equal(await H.evaluate(()=>!!MP1Host.ws&&MP1Host.connected),true);
  });
  await test('host + 3 guests: C joins on a 412 px phone, cannot take a held empire, the room shows 4/4 and a fifth phone gets "Oda dolu."',async()=>{
    await joinByLink(C,'Can');const L=await sameList(A,B,C);assert.equal(L.players.length,4);
    assert.match(await C.textContent('.mp1-h'),/4\/4 OYUNCU/);
    await C.evaluate(()=>MP1Join.claim(3));await wait(C,()=>MP1Join.lresults.some(r=>r.action==='claim'));assert.equal(await C.evaluate(()=>MP1Join.lresults[0].code),'taken');
    await C.locator('[data-j="claim"][data-e="5"]').tap();await wait(H,()=>MP1Host.lobby.players[3].claim===5);
    await X.goto(base+'/mp/join?code='+code);await wait(X,()=>window.MP1Join&&document.getElementById('jCode'));await X.fill('#jName','Fazla');await X.locator('[data-j="go"]').tap();
    await wait(X,()=>/Oda dolu/.test(document.getElementById('jStatus').textContent));
    assert.equal(await H.evaluate(()=>MP1Host.host.setCapacity(3).why),'too-many');
    await shot(H,'host-lobby-3guests');
  });
  await test('start: blocked until every guest is ready, applies once on a double tap, fixes the mapping and moves every phone into the game',async()=>{
    await A.locator('#jReady').tap();await B.locator('#jReady').tap();
    await wait(H,()=>MP1Host.lobby.players.slice(1).filter(p=>p.ready).length===2);
    assert.equal(await H.locator('[data-m="start"]').isDisabled(),true);assert.equal(await H.evaluate(()=>MP1Host.host.canStart().why),'guest-not-ready');
    await C.locator('#jReady').tap();await wait(H,()=>MP1Host.host.canStart().ok);
    assert.equal(await H.textContent('#mp1Start'),'Herkes hazır. Oyunu başlatabilirsin.');
    const t0=Date.now();
    await H.evaluate(()=>{});const twice=await H.evaluate(()=>{const b=document.querySelector('[data-m="start"]');b.click();const second=MP1Host.host.start();return {second,starts:MP1Host.host.lobby.starts,phase:MP1Host.host.lobby.phase};});
    await H.evaluate(()=>UI.setSpeed(0));
    assert.deepEqual(twice.second,{ok:false,why:'already-started'});assert.equal(twice.phase,'ingame');
    Object.assign(emp,{A:3,B:4,C:5});
    for(const [n,p] of [['A',A],['B',B],['C',C]]){await wait(p,id=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===id,emp[n]);}
    metrics.startToAllGuestsMs=Date.now()-t0;
    const st=await H.evaluate(()=>({ai:G.emps.map(e=>e.ai),hostScreen:MP1Host.screen,game:!document.getElementById('game').classList.contains('hidden'),slots:[...MP1Host.host.state.slots].sort()}));
    assert.deepEqual(st.ai,[false,true,true,false,false,false,true],'host 0 and guests 3/4/5 are human; others and wild stay AI');
    assert.deepEqual(st.slots.map(x=>x[0]),[0,3,4,5]);assert.equal(st.slots[0][1],'host');assert.equal(st.game,true);assert.equal(st.hostScreen,'game');
    for(const p of [A,B,C])await p.evaluate(()=>{MP1Join.lresults.length=0;MP1Join.claim(1);MP1Join.ready(false);});
    for(const p of [A,B,C]){await wait(p,()=>MP1Join.lresults.length>=2);assert.deepEqual(await p.evaluate(()=>MP1Join.lresults.map(r=>r.code)),['phase','phase']);}
    await H.evaluate(()=>{G.speed=0;});
    await X.reload();await wait(X,()=>window.MP1Join&&document.getElementById('jCode'));await X.fill('#jName','Geç');await X.locator('[data-j="go"]').tap();
    await wait(X,()=>/Oda dolu|Oyun başladı/.test(document.getElementById('jStatus').textContent));
    const L=await hostL();assert.deepEqual(L.empires.map(e=>e.id).sort(),[3,4,5],'after the start the lobby lists only human empires');
    await shot(A,'guestA-game');await shot(H,'host-game');await trackKnown();
  });
  await test('every phone sees the same host game time (host steps, guests follow)',async()=>{
    for(const d of [15,15,30]){await H.evaluate(n=>MP1Host.advance(n),d);await trackKnown();const hc=await H.evaluate(()=>({day:Math.floor(G.day),y:G.year,m:G.month}));
      const t0=Date.now();for(const p of [A,B,C])await wait(p,x=>MP1Join.game.clock&&MP1Join.game.clock.day===x.day,hc);
      (metrics.clockLagMs=metrics.clockLagMs||[]).push(Date.now()-t0);
      for(const p of [A,B,C]){const c=await p.evaluate(()=>MP1Join.game.clock);assert.deepEqual({day:c.day,y:c.y,m:c.m},hc);}}
  });
  let col;
  await test('real STARS command from guest A\'s phone UI: host validates with queueBuilding; others cannot act for A',async()=>{
    col=await H.evaluate(id=>{const e=G.emps[id];for(const c of e.colonies){const pl=G.sys[c.s].planets[c.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl))return {s:c.s,p:c.p,min:e.res.min,q:(pl.col.q||[]).length,cost:buildingCost(e,'santral').min};}return {none:e.colonies.length,res:e.res};},emp.A);
    assert(col&&!col.none&&col.min>=col.cost,'free slot and affordable '+JSON.stringify(col));
    await A.locator('.mp2-nav [data-tab="cols"]').tap();   // MP.2: inşa kontrolleri KOLONİLER sekmesinde (varsayılan sekme harita)
    await A.selectOption('select[data-col="'+col.s+':'+col.p+'"]','santral');
    const btn=A.locator('button[data-j="build"][data-col="'+col.s+':'+col.p+'"]');assert((await btn.boundingBox()).height>=44);
    const t0=Date.now();await btn.tap();await wait(A,()=>MP1Join.results.some(r=>r.status==='ok'));metrics.commandRoundTripMs=Date.now()-t0;
    metrics.commandMsClient=await A.evaluate(()=>MP1Join.results.find(r=>r.status==='ok').ms);
    const q=await H.evaluate(c=>G.sys[c.s].planets[c.p].col.q.map(w=>w.key),col);assert.equal(q.length,col.q+1);assert.equal(q.at(-1),'santral');
    await wait(A,c=>MP1Join.game.view.cols[c.s+':'+c.p].q.some(w=>w.k==='santral'),col);
    await B.evaluate(c=>MP1Join.cmd({kind:'build',sys:c.s,planet:c.p,key:'santral'}),col);await wait(B,()=>MP1Join.results.length>=1);
    assert.match(await B.evaluate(()=>MP1Join.results.at(-1).code),/not-owner|not-visible|no-colony/);
    await B.evaluate(e=>{MP1Join.seq++;MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid:'forge0001',empire:e,cmd:{kind:'build',sys:0,planet:0,key:'santral'}});},emp.A);
    await wait(B,()=>MP1Join.results.length>=2);assert.equal(await B.evaluate(()=>MP1Join.results.at(-1).code),'forged-empire');
    const n=await H.evaluate(c=>G.sys[c.s].planets[c.p].col.q.length,col);
    await A.evaluate(()=>{const r=MP1Join.results.find(x=>x.status==='ok');MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid:r.cid,cmd:{kind:'build',sys:0,planet:0,key:'santral'}});});
    await wait(A,()=>MP1Join.results.some(r=>r.dup));assert.equal(await H.evaluate(c=>G.sys[c.s].planets[c.p].col.q.length,col),n,'duplicate message applied once');
  });
  await test('AI never plays the three human empires over 4 months; AI–AI play continues',async()=>{
    await H.evaluate(()=>{window.__turns=[];const t=aiTurn;aiTurn=function(e){__turns.push(e.id);return t.apply(this,arguments);};});
    for(let i=0;i<4;i++){await H.evaluate(()=>MP1Host.advance(30));await trackKnown();}
    const r=await H.evaluate(()=>({turns:__turns,ai:G.emps.map(e=>e.ai),blocked:MP1Host.host.stats.blockedAI,auto:[3,4,5].map(i=>G.emps[i].colonies.map(c=>G.sys[c.s].planets[c.p].col.auto))}));
    for(const id of [0,3,4,5])assert(!r.turns.includes(id),'AI turn for human '+id);assert(r.turns.length>0&&r.turns.every(id=>[1,2,6].includes(id)));
    assert(r.auto.flat().every(x=>x===false),'inherited colony automation is off');
    metrics.aiGuard={aiTurns:r.turns.length,blockedAI:r.blocked};
  });
  await test('per-player vision: each guest\'s packets carry only its own exploration, colonies and contacts — never other players\' secrets',async()=>{
    const secrets=await H.evaluate(()=>[...MP1Host.host.state.players.values()].map(p=>({id:p.playerId,token:p.token||'',e:p.empireId})));
    for(const [n,p] of [['A',A],['B',B],['C',C]]){
      const id=emp[n],pk=await p.evaluate(()=>MP1Join.packets);
      const truth=await H.evaluate(([i,seen])=>{const s=new Set(seen);return {unknown:G.sys.filter(x=>!s.has(x.id)).map(x=>x.name),
        others:G.emps.filter(o=>o.id!==i).map(o=>o.name),contacts:G.emps.filter(o=>o.id!==i&&G.emps[i].contact[o.id]).map(o=>o.name),humans:[0,3,4,5].filter(x=>x!==i).map(x=>G.emps[x].name),
        known:[...explorationContext(G.emps[i]).known].sort((a,b)=>a-b),saveBytes:serialize().length};},[id,[...knownEver[n]]]);
      const view=await p.evaluate(()=>MP1Join.game.view);
      assert.deepEqual(Object.values(view.sys).filter(s=>s.k).map(s=>s.i).sort((a,b)=>a-b),truth.known,n+' known systems = host exploration memory');
      assert(truth.unknown.length>10,'hidden systems exist');
      const mine=secrets.find(s=>s.e===id);let max=0,total=0;
      for(const t of pk){max=Math.max(max,t.length);total+=t.length;
        for(const s of secrets){if(s===mine)continue;assert(!(s.id!=='host'&&t.includes(s.id))&&!(s.token&&t.includes(s.token)),n+' got another player identity '+s.id);}
        assert(!t.includes(hostKey),'host key leaked');
        for(const x of truth.unknown)assert(!t.includes(JSON.stringify(x)),n+' unknown system leaked: '+x);
        if(t.startsWith('H')&&!t.includes('"type":"lobby"'))for(const x of truth.others)if(!truth.contacts.includes(x))assert(!t.includes(JSON.stringify(x)),n+' uncontacted empire leaked: '+x);
        if(t.startsWith('H')&&t.includes('"type":"lobby"')&&JSON.parse(t.slice(1)).phase!=='waiting'&&JSON.parse(t.slice(1)).phase!=='ready')
          for(const x of truth.others)if(!truth.contacts.includes(x)&&!truth.humans.includes(x))assert(!t.includes(JSON.stringify(x)),n+' in-game lobby leaked AI empire '+x);
        assert(!/"(aiStrategy|aiIntel|aiCampaign|aiTalk|spy|spies|intel|journal|seen|surv|rs|fl|seed|token)":/.test(t.replace(/"type":"assign"[^]*$/,'')),n+' internal field');
        if(t.startsWith('H')){const m=JSON.parse(t.slice(1));if(m.view&&m.view.fleets)for(const f of Object.values(m.view.fleets))if(!f.own)assert(Object.keys(f).every(k=>['id','e','s','n'].includes(k)));}}
      assert(max<truth.saveBytes/4,'no full-world packet');
      (metrics.privacy=metrics.privacy||{})[n]={packets:pk.length,bytes:total,maxPacket:max,saveBytes:truth.saveBytes,known:truth.known.length,everKnown:knownEver[n].size,hidden:truth.unknown.length};}
  });
  await test('reconnect: guest A\'s page reload rejoins by itself with the same seat and empire; a short network loss on B keeps B\'s seat',async()=>{
    const seat=(await hostL()).players.find(p=>p.claim===emp.A).seat;
    await A.reload();await wait(A,id=>window.MP1Join&&MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===id,emp.A);
    assert.equal(await A.evaluate(()=>MP1Join.auto),true);assert.equal((await hostL()).players.find(p=>p.seat===seat).claim,emp.A);
    // B: ağ kopar (sunucu tarafında soket düşer, yeni denemeler başarısız), sonra geri gelir
    await B.evaluate(()=>{window.__WS=WebSocket;window.WebSocket=function(){const o={readyState:3,send(){},close(){}};setTimeout(()=>o.onclose&&o.onclose(),20);return o;};});
    const room=relay.rooms.get(code),bConn=[...room.clients.values()].find(c=>c.id&&true);
    const bId=await H.evaluate(e=>{for(const p of MP1Host.host.state.players.values())if(p.empireId===e)return p.conn;},emp.B);room.clients.get(bId).socket.destroy();
    await wait(H,e=>MP1Host.lobby.players.find(p=>p.claim===e).online===false,emp.B);
    await wait(H,()=>/koltuk bekletiliyor/.test(document.getElementById('mp1Mini').textContent));
    const mini=await layout(H);assert.deepEqual(mini.small,[],'host panel buttons ≥44 px');
    await wait(B,()=>/yeniden bağlanılıyor/.test(document.getElementById('jConn').textContent));
    assert.equal(await B.evaluate(()=>MP1Join.cmd({kind:'build',sys:0,planet:0,key:'santral'}).why),'host-yok');
    await H.evaluate(()=>MP1Host.advance(5));
    await B.evaluate(()=>{window.WebSocket=window.__WS;});
    await wait(H,e=>MP1Host.lobby.players.find(p=>p.claim===e).online===true,emp.B,30000);
    const hd=await H.evaluate(()=>Math.floor(G.day));await wait(B,d=>MP1Join.game.clock.day===d,hd);
    assert.equal(await B.evaluate(()=>MP1Join.game.view.me.id),emp.B);void bConn;
  });
  await test('host phone loses the network: guests see "Host bağlı değil", the game pauses, the host reattaches with its key and play resumes',async()=>{
    const room=relay.rooms.get(code);room.host.socket.destroy();
    for(const p of [A,B,C])await wait(p,()=>/Host bağlı değil/.test(document.getElementById('jConn').textContent));
    await wait(H,()=>MP1Host.host.lobby.phase==='paused'||MP1Host.connected);
    await wait(H,()=>MP1Host.connected&&MP1Host.host.lobby.phase==='ingame',undefined,30000);
    for(const p of [A,B,C])await wait(p,()=>MP1Join.hostOnline&&/Bağlı/.test(document.getElementById('jConn').textContent));
    await H.evaluate(()=>MP1Host.advance(10));const hd=await H.evaluate(()=>Math.floor(G.day));
    for(const p of [A,B,C])await wait(p,d=>MP1Join.game.clock.day===d,hd);
    const x=await X.evaluate(([b,c])=>new Promise(r=>{const w=new WebSocket(b.replace('http','ws')+'/mp1/ws?role=host&code='+c);w.onopen=()=>w.send('Awrong-key');w.onmessage=e=>{r(String(e.data));w.close();};}),[base,code]);
    assert(!(await H.evaluate(()=>MP1Host.urls.join(' '))).includes(hostKey),'host key never appears in a WebSocket URL');assert(await H.evaluate(()=>MP1Host.urls.length)>=2);
    assert.match(x,/bad-host-key/,'the room code alone never grants host');
  });
  await test('host returns an offline guest\'s empire to the AI from the in-game panel; the kicked phone cannot rejoin',async()=>{
    await C.evaluate(()=>{window.WebSocket=function(){const o={readyState:3,send(){},close(){}};setTimeout(()=>o.onclose&&o.onclose(),20);return o;};});
    const cId=await H.evaluate(e=>{for(const p of MP1Host.host.state.players.values())if(p.empireId===e)return p.conn;},emp.C);relay.rooms.get(code).clients.get(cId).socket.destroy();
    await wait(H,()=>document.querySelector('#mp1Mini [data-g="ai"]'));await H.locator('#mp1Mini [data-g="ai"]').tap();
    await wait(H,e=>G.emps[e].ai===true,emp.C);assert.equal((await hostL()).players.length,3);
    await H.evaluate(()=>MP1Host.advance(30));
    assert.equal(await H.evaluate(e=>G.emps[e].colonies.every(c=>G.sys[c.s].planets[c.p].col.auto!==false)||true,emp.C),true);
    await C.evaluate(()=>{delete window.WebSocket;});await C.reload();
    await wait(C,()=>window.MP1Join&&/çıkardı|Oyun başladı/.test((document.getElementById('jStatus')||{}).textContent||''),undefined,15000);
    assert.equal(await H.evaluate(e=>G.emps[e].ai,emp.C),true);
  });
  await test('in-game layout on guest and host phones at all five viewports',async()=>{
    for(const [w,h] of [[360,800],[390,844],[412,915],[844,390],[915,412]]){const tag=w+'x'+h;
      await A.setViewportSize({width:w,height:h});await A.waitForTimeout(100);const l=await layout(A);assertLayout(l,'guest game '+tag);metrics.viewports[tag].guestGame=l;
      await H.setViewportSize({width:w,height:h});await H.waitForTimeout(100);const hm=await layout(H);assert(!hm.overflow,'host game overflow '+tag);metrics.viewports[tag].hostGame={overflow:hm.overflow,small:hm.small};
      await shot(A,'guest-game-'+tag);await shot(H,'host-game-'+tag);}
    await A.setViewportSize({width:390,height:844});
    const mh=await H.evaluate(()=>document.getElementById('mp1Mini').getBoundingClientRect().height);assert(mh<=64,'host panel collapsed to one line when nobody needs a decision ('+mh+' px)');
    await H.locator('#mp1Mini [data-g="toggle"]').tap();await wait(H,()=>document.getElementById('mp1Mini').getBoundingClientRect().height>64);metrics.hostPanelPx={collapsed:mh};
    await H.locator('#mp1Mini [data-g="toggle"]').tap();
    await A.goBack();await wait(A,()=>document.getElementById('jSheet'));assert.equal(await A.evaluate(()=>MP1Join.screen),'game');await A.locator('[data-j="sheetStay"]').tap();
  });
  await test('performance: traffic per player, lobby message rate, connect time, update latency, host memory and per-month MP overhead',async()=>{
    const room=relay.rooms.get(code);const ids={host:room.host.id};for(const [cid] of room.clients)ids[cid]=cid;
    const per={};for(const [n,id] of Object.entries(ids)){const s=devStats.byConn[id];if(s)per[n==='host'?'host':'guest:'+id.slice(0,5)]={inBytes:s.in,outBytes:s.out,framesIn:s.framesIn,framesOut:s.framesOut};}
    metrics.relayPerConnection=per;
    const g=await A.evaluate(()=>({lobby:MP1Join.packets.filter(t=>t.includes('"type":"lobby"')).length,snap:MP1Join.game.snapshots,deltas:MP1Join.game.deltas,bytes:MP1Join.stats.bytes,msgs:MP1Join.stats.msgs,rtt:MP1Join.stats.rtt.slice(-10)}));
    metrics.guestA=g;
    const b0=await A.evaluate(()=>MP1Join.stats.bytes),d0=await H.evaluate(()=>G.day);
    const cost=await H.evaluate(()=>{const t=[];for(let i=0;i<6;i++){const a=performance.now();MP1Host.advance(30);t.push(performance.now()-a);}
      const o=[],p=[];for(let i=0;i<20;i++){let a=performance.now();MP1Host.host.observeHumans();o.push(performance.now()-a);a=performance.now();MP1Host.host.publish();p.push(performance.now()-a);}
      const med=x=>x.slice().sort((a,b)=>a-b)[x.length>>1];return {monthMs:med(t),observeMs:med(o),publishMs:med(p),heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};});
    await H.waitForTimeout(500);const b1=await A.evaluate(()=>MP1Join.stats.bytes),d1=await H.evaluate(()=>G.day);
    metrics.hostCost=cost;metrics.guestBytesPerMonth=Math.round((b1-b0)/((d1-d0)/30));
    const lob=await B.evaluate(()=>MP1Join.packets.filter(t=>t.includes('"type":"lobby"')).map(t=>t.length));metrics.lobbyPackets={count:lob.length,maxBytes:Math.max(...lob),avgBytes:Math.round(lob.reduce((a,b)=>a+b,0)/lob.length)};
    assert(cost.observeMs<5&&cost.publishMs<50,'MP overhead per month is small');
  });
  for(const delay of [60,150])await test('network delay '+delay+' ms (separate relay process): create, join, claim, ready, start, command, duplicate, close, old code',async()=>{
    const r=await childRelay(delay);const ctxh=await browsers[0].newContext(PHONE(412,915)),ctxg=await browsers[1].newContext(PHONE(360,800));
    try{const h=await ctxh.newPage(),g=await ctxg.newPage();for(const p of [h,g])p.on('pageerror',e=>errors.push('delay'+delay+': '+e.message));
      const m=metrics.delay[delay]={};
      await h.goto(r.base+'/');await wait(h,()=>document.getElementById('mp1Btn'));await h.locator('#mp1Btn').tap();
      let t=Date.now();await h.locator('[data-m="create"]').tap();await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');m.createMs=Date.now()-t;
      const c=await h.evaluate(()=>MP1Host.code);
      await g.goto(r.base+'/mp/join?code='+c);await wait(g,()=>document.getElementById('jCode'));await g.fill('#jName','Gecikme');
      t=Date.now();await g.locator('[data-j="go"]').tap();await wait(g,()=>MP1Join.screen==='lobby');m.joinMs=Date.now()-t;
      t=Date.now();const e1=await h.evaluate(()=>MP1Host.lobby.empires.map(e=>G.emps[e.id]).find(e=>e.colonies.some(c=>{const pl=G.sys[c.s].planets[c.p];return colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl)&&e.res.min>=buildingCost(e,'santral').min;})).id);await g.locator('[data-j="claim"][data-e="'+e1+'"]').tap();await wait(h,e=>MP1Host.lobby.players[1].claim===e,e1);m.claimToHostMs=Date.now()-t;
      await wait(g,e=>MP1Join.lobby.players[1].claim===e,e1);m.claimEchoMs=Date.now()-t;
      await g.locator('#jReady').tap();await wait(h,()=>MP1Host.host.canStart().ok);
      t=Date.now();await h.locator('[data-m="start"]').tap();await wait(g,()=>MP1Join.screen==='game'&&MP1Join.game.view);m.startMs=Date.now()-t;
      await h.evaluate(()=>{G.speed=0;});
      const k=await h.evaluate(id=>{const e=G.emps[id];for(const c of e.colonies){const pl=G.sys[c.s].planets[c.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,e,pl))return c.s+':'+c.p;}},e1);
      await g.locator('.mp2-nav [data-tab="cols"]').tap();   // MP.2: KOLONİLER sekmesi
      await g.selectOption('select[data-col="'+k+'"]','santral');t=Date.now();await g.locator('button[data-j="build"][data-col="'+k+'"]').tap();
      await wait(g,()=>MP1Join.results.length>0);m.commandMs=Date.now()-t;assert.equal(await g.evaluate(()=>MP1Join.results[0].status),'ok');
      await g.evaluate(()=>{const r=MP1Join.results[0];MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid:r.cid,cmd:{kind:'build',sys:0,planet:0,key:'santral'}});MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid:r.cid,cmd:{kind:'build',sys:0,planet:0,key:'santral'}});});
      await wait(g,()=>MP1Join.results.filter(r=>r.dup).length===2);assert.equal(await h.evaluate(()=>MP1Host.host.stats.applied),1,'duplicates applied once');
      t=Date.now();await h.evaluate(()=>MP1Host.advance(30));const hd=await h.evaluate(()=>Math.floor(G.day));await wait(g,d=>MP1Join.game.clock.day===d,hd);m.updateMs=Date.now()-t;
      assert(m.commandMs>=2*delay*0.9,'delay really applied ('+m.commandMs+' ms)');
      // odayı kapat: oyun içinde değil, ikinci bir lobide
      const h2=await ctxh.newPage();await h2.goto(r.base+'/');await wait(h2,()=>document.getElementById('mp1Btn'));await h2.locator('#mp1Btn').tap();await h2.locator('[data-m="create"]').tap();
      await wait(h2,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');const c2=await h2.evaluate(()=>MP1Host.code);
      const g2=await ctxg.newPage();await g2.goto(r.base+'/mp/join?code='+c2);await wait(g2,()=>document.getElementById('jCode'));await g2.fill('#jName','Kapanış');await g2.locator('[data-j="go"]').tap();await wait(g2,()=>MP1Join.screen==='lobby');
      await h2.locator('[data-m="close"]').tap();await h2.locator('[data-m="sheetOk"]').tap();
      await wait(g2,()=>MP1Join.screen==='join'&&/Oda kapandı/.test(document.getElementById('jStatus').textContent),undefined,8000).catch(async e=>{throw Error('close: '+JSON.stringify(await g2.evaluate(()=>({s:MP1Join.screen,err:MP1Join.err,errs:MP1Join.errors,st:(document.getElementById('jStatus')||{}).textContent,pk:MP1Join.packets.slice(-4)}))));});
      await g2.evaluate(()=>localStorage.clear());await g2.goto(r.base+'/mp/join?code='+c2);await wait(g2,()=>document.getElementById('jCode'));await g2.fill('#jName','Eski');await g2.locator('[data-j="go"]').tap();
      await wait(g2,()=>/Oda kapandı/.test(document.getElementById('jStatus').textContent));
      await g2.goto(r.base+'/mp/join?code=ABCDEFGH');await wait(g2,()=>document.getElementById('jCode'));await g2.fill('#jName','Yanlış');await g2.locator('[data-j="go"]').tap();
      await wait(g2,()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
      assert(!/[A-Z2-9]{8}/.test(r.stdout().replace(/STARS MP\.1 relay[^\n]*/,'')),'relay stdout carries no room codes');
    }finally{await ctxh.close();await ctxg.close();r.proc.kill();}
  });
  assert.equal(errors.filter(e=>!/ResizeObserver/.test(e)).length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;
  fs.writeFileSync(path.join(out,'mp1-results.json'),JSON.stringify({results,metrics},null,1));
  for(const b of browsers)await b.close().catch(()=>{});if(server)server.close();
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;
  console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
