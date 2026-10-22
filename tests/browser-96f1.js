'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),parent=process.env.STARS_96D_ROOT||path.resolve(root,'../source96f'),out=path.join(__dirname,'audit96f1/browser');fs.mkdirSync(out,{recursive:true});
const fixture=fs.readFileSync(path.join(__dirname,'helpers/96e-fixture.js'),'utf8').match(/h\.run\(`([\s\S]*?)`\)/)[1],save=fs.readFileSync(path.join(__dirname,'fixtures/stars-2210-06.sav.json'),'utf8');
let server,browser,context,page,old=false;const results=[],errors=[];const v=s=>page.evaluate(s);
async function test(name,fn){try{await fn();results.push({name,status:'PASS'});console.log('✓ '+name)}catch(e){results.push({name,status:'FAIL',error:e.stack});console.log('✗ '+name+' '+e.message);await page.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{})}}
async function fresh(width=740,height=360){old=false;await context.setOffline(false);await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof BUILD_ID!=='undefined'&&typeof ArchiveUI!=='undefined');}
async function game(members=[0,1,2],width=740,height=360){await fresh(width,height);await page.evaluate(save=>{deserialize(save);window.colTemplateF=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));$('title').classList.add('hidden');enterGame(true);UI.setSpeed(0);LOOP.on=false;UI.closeModal()},save);await page.evaluate(m=>window.members96=m,members);await page.evaluate(fixture);await v('View.init();View.fit();G.speed=0;UI.refresh();UI.closeModal()');}
async function clickRecord(kind){const id=await v('DiplomaticInbox.state().records.find(r=>r.kind==='+JSON.stringify(kind)+').id');await page.locator('[data-a="diplomaticRecord"][data-x="'+id+'"]').click();return id;}
async function bounded(){assert.equal(await v('document.documentElement.scrollWidth<=innerWidth+1'),true);}
(async()=>{try{
 server=http.createServer((q,r)=>{const base=old?parent:root,pathname=new URL(q.url,'http://localhost').pathname,file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(base+path.sep)){r.writeHead(403).end();return}fs.readFile(file,(e,b)=>{if(e){r.writeHead(404).end();return}r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/json');r.end(b)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-webgl','--disable-dev-shm-usage']});context=await browser.newContext({viewport:{width:740,height:360},isMobile:true,hasTouch:true});page=await context.newPage();page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[360,740],[740,360],[1280,720]])await test(width+'x'+height+' real pregame toggle and all four probability choices',async()=>{
  await fresh(width,height);await page.click('[data-a="tNew"]');await page.locator('[data-a="step"][data-x="galaksi"]').click();assert.equal(await v('CFG.aiOrigins'),true);assert.equal(await v('aiOriginChance(CFG)'),35);
  for(const chance of [20,35,60,100]){await page.locator('[data-a="aiOriginChance"][data-x="'+chance+'"]').click();assert.equal(await v('CFG.aiOriginChance'),chance)}
  await page.locator('[data-a="togAIOrigins"]').click();assert.equal(await v('CFG.aiOrigins'),false);assert.equal(await page.locator('[data-a="aiOriginChance"]:disabled').count(),4);await page.locator('[data-a="togAIOrigins"]').click();assert.equal(await v('CFG.aiOrigins'),true);await bounded();await page.screenshot({path:path.join(out,'setup-'+width+'x'+height+'.png')});
 });
 for(const [width,height]of [[740,360],[1280,720]])await test(width+'x'+height+' diplomacy invite actual click, inbox ballot, actual AI membership',async()=>{
  await game([0,1,2],width,height);await v('alliances(3);UI.openDiplo();UI.selectDiploIdentity(3)');await page.locator('[data-a="fedDipInvite"]').click();assert.equal(await v('F.members.includes(3)'),false);assert.equal(await v('F.vote.yes.includes(0)'),false);
  await v('ArchiveUI.open("inbox")');await clickRecord('fedvote');await page.locator('#inboxYes').click();assert.equal(await v('fedOf(100).members.includes(3)'),true);assert.equal(await v('G.emps[3].ally[0]&&G.p.ally[3]'),true);await bounded();
 });
 await test('solved federation founding path: enabled button creates real membership and charges once',async()=>{
  await game([0,1,2]);await v('G.feds=[];window.foundBefore96=G.p.res.etk;UI.openFed()');
  assert.equal(await v('canFoundFed(G.p,"askeri").ok'),true);
  await page.locator('[data-a="foundFed"][data-x="askeri"]').click();
  assert.equal(await v('findFed(G.p).members.includes(1)&&findFed(G.p).members.includes(2)'),true);
  assert.equal(await v('foundBefore96-G.p.res.etk'),220);assert.equal(await v('G.feds.length'),1);await bounded();
 });
 await test('mobile nonfounder application actual button and final inbox accept change membership',async()=>{
  await game([1,2,4]);await v('alliances(0);UI.openDiplo();UI.selectDiploIdentity(2)');await page.locator('[data-a="fedDipRequest"]').click();assert.equal(await v('F.members.includes(0)'),false);assert.equal(await v('F.invites[0].by'),2);await v('ArchiveUI.open("inbox")');await clickRecord('invite');assert.ok(!(await page.locator('#modal').innerText()).includes('NaN'));await page.screenshot({path:path.join(out,'mobile-invitation.png')});await page.locator('#inboxYes').click();assert.equal(await v('F.members.includes(0)'),true);assert.equal(await v('G.p.ally[4]&&G.emps[4].ally[0]'),true);await bounded();
 });
 await test('inbox reject actual click, duplicate prevention, expiry and reload',async()=>{
  await game([1,2,4]);await v('alliances(0);requestFederation(G.p,G.emps[2]);DiplomaticInbox.sync();deserialize(serialize());F=fedOf(100);E=G.p;ArchiveUI.open("inbox")');await clickRecord('invite');await page.locator('#inboxNo').click();assert.equal(await v('!!findFed(G.p)'),false);assert.equal(await v('DiplomaticInbox.state().records.find(r=>r.kind==="invite").status'),'rejected');assert.equal(await v('requestFederation(G.p,G.emps[2]).ok'),false);
  await game([1,2,4]);await v('alliances(0);requestFederation(G.p,G.emps[2]);DiplomaticInbox.sync();G.day=F.invites[0].expires;updateFederations();ArchiveUI.open("inbox")');await clickRecord('invite');assert.equal(await page.locator('#inboxYes').count(),0);assert.equal(await v('F.members.includes(0)'),false);
 });
 await test('AI application presents player ballot; informational record has no decision bypass',async()=>{
  await game();await v('alliances(3);requestFederation(T,G.emps[1]);ArchiveUI.open("inbox")');await clickRecord('fedrequest');assert.equal(await page.locator('#inboxYes,#inboxNo').count(),0);await page.locator('[data-a="diplomaticInbox"]').last().click();await clickRecord('fedvote');await page.locator('#inboxNo').click();assert.equal(await v('F.lastVote.noMembers.includes(0)'),true);assert.equal(await v('F.members.includes(3)'),true);
 });
 await test('founding action opens existing foundation screen with real requirements',async()=>{
  await game();await v('G.feds=[];UI.openDiplo();UI.selectDiploIdentity(3)');await page.getByRole('button',{name:'Federasyon Kurma Teklifi',exact:true}).click();assert.equal(await page.locator('.fedBox').count(),1);assert.ok((await page.locator('.fedBox').innerText()).includes('2'));await bounded();
 });
 await test('real Canvas portraits and WebAudio smoke remain available',async()=>{
  await game();assert.equal(await v('(()=>{const hashes=new Set(Object.keys(LOOKS).map(look=>ART.portraitFull({look,seed:33,scale:2}).toDataURL()));return hashes.size})()'),8);
  await page.click('#tools [data-a="save"]');await v('AUDIO.start();AUDIO.setMuted(false);AUDIO.configure({musicOn:true,effectsOn:true});AUDIO.play("ok")');assert.equal(await v('typeof AudioContext!=="undefined"&&AUDIO.diagnostics().state==="running"&&typeof AUDIO.settings().music==="number"'),true);
 });
 await test('mobile genetic choices use shared budget, conflict and removal gates',async()=>{
  await fresh(360,740);await page.click('[data-a="tNew"]');await page.locator('[data-a="step"][data-x="fizyo"]').click();
  await page.locator('[data-a="trait"][data-x="yavas_ureyen"]').click();await page.locator('[data-a="trait"][data-x="dayanikli"]').click();await page.locator('[data-a="trait"][data-x="ustun_zeka"]').click();await page.locator('[data-a="trait"][data-x="cevher_sezgi"]').click();assert.equal(await v('traitCost(CFG.traits)'),3);
  await page.locator('[data-a="trait"][data-x="savascı"]').click();assert.equal(await v('CFG.traits.includes("savascı")'),false);await page.locator('[data-a="trait"][data-x="yavas_ureyen"]').click();assert.equal(await v('CFG.traits.includes("yavas_ureyen")'),true);await bounded();
 });
 await test('mobile civic radical consumes both slots through real clicks',async()=>{
  await fresh(360,740);await page.click('[data-a="tNew"]');await page.locator('[data-a="step"][data-x="civic"]').click();await page.locator('[data-a="civic"][data-x="yildiz_yiyen"]').click();assert.equal(await v('civicUsed(CFG.civics)'),2);await page.locator('[data-a="civic"][data-x="maden_lonca"]').click();assert.equal(await v('CFG.civics.length'),1);await bounded();
 });
 await test('player devour actual confirmation updates resources and renders wreck without errors',async()=>{
  await game();await v('G.p.civics=["yildiz_yiyen"];G.p.hunger=40;var sy=G.sys[G.p.home];sy.owner=0;sy.surv=[0];sy.nest=null;sy.ruin=null;var pp={i:sy.planets.length,t:"tok",sz:20,owner:-1,col:null,name:"Browser Yem",seed:99};sy.planets.push(pp);newFleet(G.p,sy.id,[{c:"kor"}]);View.selSys=sy;UI.tab("sistem");UI.refresh()');
  const sid=await v('sy.id'),pid=await v('pp.i'),funds=await v('G.p.res.min');await page.locator('[data-a="devour"][data-x="'+sid+':'+pid+'"]').click();assert.equal(await v('pp.devoured===undefined'),true);await page.locator('[data-a="devourConfirm"]').click();assert.equal(await v('pp.t'),"enkaz");assert.ok(await v('G.p.res.min')>funds);assert.equal(await v('G.p.hunger'),10);await bounded();await page.screenshot({path:path.join(out,'devour-after.png')});
 });
 await test('stale destructive confirmation cannot act on restored save',async()=>{
  await game();await v('G.p.civics=["yildiz_yiyen"];var sy=G.sys[G.p.home];sy.owner=0;sy.surv=[0];sy.nest=null;sy.ruin=null;var pp={i:sy.planets.length,t:"tok",sz:20,owner:-1,col:null,name:"Stale Yem",seed:99};sy.planets.push(pp);newFleet(G.p,sy.id,[{c:"kor"}]);UI.act("devour",sy.id+":"+pp.i);var beforeSave=serialize();deserialize(beforeSave);var stock=G.p.res.min;UI.act("devourConfirm","")');assert.equal(await v('G.p.res.min===stock'),true);
 });
 for(const [w,h]of [[640,360],[740,360]])await test(w+'x'+h+' actual battle report X touch, reopen, save and new report',async()=>{
  await game([0,1,2],w,h);await v('G.fleets=[];var S=G.sys[0];G.p.war[3]=G.emps[3].war[0]=true;var A=newFleet(G.p,0,[{c:"muh"}]),B=newFleet(G.emps[3],0,[{c:"kor"}]);S.cr=1;SHIPS.muh.dmg=100000;combatTick(.1);View.selSys=S;UI.tab("sistem");window.reportF=JSON.stringify(S.battleReport);window.fleetF=JSON.stringify(G.fleets)');
  const button=page.locator('[data-a="dismissBattleReport"]');assert.equal(await button.count(),1);const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);await button.tap();
  assert.equal(await v('JSON.stringify(G.sys[0].battleReport)===reportF&&JSON.stringify(G.fleets)===fleetF'),true);assert.equal(await v('View.selSys.id'),0);
  await v('UI.tab("sistem");UI.refresh()');assert.equal(await button.count(),0);await v('deserialize(serialize());View.selSys=G.sys[0];UI.tab("sistem");UI.refresh()');assert.equal(await button.count(),0);
  await v('G.day+=30;var B=newFleet(G.emps[3],0,[{c:"kor"}]);G.sys[0].cr=1;combatTick(.1);UI.refresh()');assert.equal(await button.count(),1);await bounded();
  await page.screenshot({path:path.join(out,'battle-X-'+w+'.png')});
 });
 await test('portrait gameplay retains the existing rotate-to-landscape guidance',async()=>{await game([0,1,2],360,740);assert.equal(await page.locator('#rotate').isVisible(),true);});
 for(const zoom of [.12,.18,.35,.7])await test('real Canvas habitat shapes at zoom '+zoom+' with labels independent',async()=>{
  await game([0,1,2],740,360);await page.evaluate(z=>{const s=G.sys[0];s.planets.forEach(p=>{p.t='cor';p.owner=-1;p.col=null});s.planets[0].t='gay';s.planets[1].t='gay';s.planets[1].owner=0;s.planets[1].col=JSON.parse(JSON.stringify(colTemplateF));s.surv=[0];s.seen=[0];G.p.mapHabitats={};G.vis=new Set([0]);G._sensorVision=new Map();observePlayerHabitats();View.cam.x=s.x;View.cam.y=s.y;View.cam.z=z;View.draw(performance.now());},zoom);
  assert.equal(await v('playerHabitatMark(G.sys[0])'),3);assert.equal(await v('View._habitatDraws>=1'),true);
  assert.equal(await v('(()=>{const s=G.sys[0],p=View.w2s(s.x,s.y),sr=Math.max(2.2,s.star.r*View.cam.z*1.5),x=Math.floor(p.x+sr-2),y=Math.floor(p.y-sr-11),cv=View.cv,d=View.g.getImageData(Math.max(0,x),Math.max(0,y),24,20).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+1]>d[i]*1.3&&d[i+1]>140)n++;return n>3})()'),true);
  if(zoom===.18)await page.screenshot({path:path.join(out,'habitats-far.png')});
 });
 await test('habitat observation and draw never expose hidden current colonization',async()=>{
  await game();await v('var s=G.sys[0];s.planets.forEach(p=>{p.t="cor";p.col=null;p.owner=-1});s.planets[0].t="gay";s.surv=[0];G.p.mapHabitats={};G.vis=new Set([0]);G._sensorVision=new Map();observePlayerHabitats();G.vis=new Set();s.planets[0].t="enkaz";observePlayerHabitats()');assert.equal(await v('playerHabitatMark(G.sys[0])'),1);
  await v('G.sys[0].surv=[]');assert.equal(await v('playerHabitatMark(G.sys[0])'),0);
 });
 await test('existing diplomacy panel respects low and high strategic intelligence',async()=>{
  await game();await v('G.emps[3].aiStrategy={objective:{kind:"regional"},plan:{stage:"ready",enemy:0,target:0}};G.p.intel[3]=0;UI.openDiplo();UI.selectDiploIdentity(3)');assert.equal((await page.locator('#diploPane').innerText()).includes('Bölgesel üstünlük'),false);
  await v('G.p.intel[3]=3;UI.selectDiploIdentity(3)');assert.equal((await page.locator('#diploPane').innerText()).includes('Bölgesel üstünlük'),true);await bounded();
 });
 await test('96F cached shell upgrades to96F.1, v8 save survives and new shell loads offline',async()=>{
  await fresh();old=true;await page.reload();await page.waitForFunction(()=>BUILD_ID==='96f');await v('setupGame({...CFG,size:"kucuk",seed:11});localStorage.setItem("upgrade96e",serialize())');
  await v('(async()=>{const r=await navigator.serviceWorker.register("./sw.js");await r.update();await navigator.serviceWorker.ready})()');await page.waitForFunction(async()=>(await caches.keys()).includes('stars-v96f'));await page.reload();await page.waitForFunction(()=>BUILD_ID==='96f');old=false;
  await v('(async()=>{const r=await navigator.serviceWorker.ready;await r.update()})()');await page.waitForFunction(async()=>{const names=await caches.keys();return names.includes('stars-v96f1')&&!names.includes('stars-v96f')});await page.reload();await page.waitForFunction(()=>BUILD_ID==='96f1');await context.setOffline(true);await page.reload();await page.waitForFunction(()=>BUILD_ID==='96f1'&&typeof AUDIO!=='undefined');assert.equal(await v('deserialize(localStorage.getItem("upgrade96e"))&&JSON.parse(serialize()).v===8'),true);await context.setOffline(false);
 });
 }finally{
 const summary={browser:browser?.version(),pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,results,pageErrors:errors,physicalAndroid:'NOT RUN',subjectiveListening:'NOT RUN'};fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log('BROWSER GEÇEN: '+summary.pass+' KALAN: '+summary.fail);if(browser)await browser.close();if(server)server.close();process.exitCode=summary.fail||errors.length?1:0;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
