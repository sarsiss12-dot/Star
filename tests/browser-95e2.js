'use strict';
// Real Chromium checks. Install Playwright, set STARS_CHROMIUM_PATH to a runnable binary.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright'),{world}=require('./helpers/95e-fixture');
const root=path.resolve(process.env.STARS_BROWSER_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_BROWSER_OUTPUT||path.join(__dirname,'audit-95e2/browser'));
fs.mkdirSync(out,{recursive:true});
const save=world().run('serialize()'),results=[],errors=[];let page,browser,server,serveOldWorker=false;
const eq=(a,b=true)=>assert.equal(a,b);
async function reset(){await page.setViewportSize({width:740,height:360});await page.evaluate(save=>{
 if(!deserialize(save))throw Error('fixture load failed');$('title').classList.add('hidden');enterGame(true);UI.closeModal();UI.act("closeDiplo");UI.setSpeed(0);
 window.offer95=(give=[{t:'res',r:'min',v:23}],want=[])=>({from:1,to:0,give,want,born:G.day,expires:G.day+180});
 window.add95=(give,want)=>{UI.aiOffer(offer95(give,want));return DiplomaticInbox.state().records.at(-1);};
 window.fed95=(members=[0,1,2])=>{const f={id:100,name:'Test Federasyonu',type:'bilimsel',leader:1,founder:1,members,laws:{},charter:fedDefaultCharter('bilimsel'),fund:{ene:0,ala:0},treasury:0,founded:0,typeSince:0,dutySince:{defense:0,offense:0},dutyConsent:{},invites:{},decisions:{},cohesion:70,nextVote:1000};G.feds=[f];fedNormalize(f);return f;};
 window.testRecord=null;
},save);}
async function test(name,fn){if(process.env.STARS_BROWSER_FILTER&&!name.includes(process.env.STARS_BROWSER_FILTER))return;const before=errors.length;try{await reset();await fn();assert.equal(errors.length,before,'pageerror: '+errors.slice(before).join('; '));results.push({name,ok:true});console.log('✓ '+name);}catch(e){results.push({name,ok:false,error:e.stack});console.log('✗ '+name+' — '+e.message);}}
const value=code=>page.evaluate(code);
async function show(code){await value(code+';ArchiveUI.record(testRecord.id)');}
const flows={
 trade:`testRecord=add95([{t:'pact'},{t:'res',r:'min',v:23}])`,
 sensor:`testRecord=add95([{t:'intel'}],[{t:'intel'}])`,
 legacySensor:`UI.notify({kind:'pact',data:{from:1,tur:'intel'},title:'Sensör'});testRecord=DiplomaticInbox.state().records.at(-1)`,
 alliance:`testRecord=add95([{t:'ally'}])`,
 peace:`G.p.war[1]=G.emps[1].war[0]=true;UI.notify({kind:'peace',data:1,title:'Barış'});testRecord=DiplomaticInbox.state().records.at(-1)`,
 invite:`var f=fed95([1,2,3]);f.charter.admission='vote';f.invites[0]={by:1,expires:G.day+180,terms:fedCharterKey(f)};DiplomaticInbox.sync();testRecord=DiplomaticInbox.state().records.at(-1)`,
 fedvote:`var f=fed95();f.vote={id:1,law:'ticaret',kind:'basic',proposer:1,opened:G.day,expires:G.day+90,eligible:[0,1,2],yes:[],no:[]};DiplomaticInbox.sync();testRecord=DiplomaticInbox.state().records.at(-1)`,
 vassal:`var o=G.emps[1];o.home=1;o.freeUntil=0;G.sys[1].owner=1;o.intel[0]=3;G.p.passage[1]=o.passage[0]=true;o.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,day:G.day}]))};newFleet(G.p,0,Array.from({length:100},()=>({c:'kor'})));newFleet(o,1,[{c:'kor'}]);UI.notify({kind:'submit',data:{from:1,tehdit:4},title:'Himaye'});testRecord=DiplomaticInbox.state().records.at(-1)`
};
(async()=>{
 server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);res.end();return;}if(name==='/sw.js'&&serveOldWorker)b=Buffer.from(b.toString().replace('stars-v96a','stars-v95e3'));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-webgl']});
 const context=await browser.newContext({viewport:{width:740,height:360},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>typeof ArchiveUI!=='undefined');
 for(const [kind,code]of Object.entries(flows)){
  await test(kind+' accepts through actual nested DOM click once',async()=>{
   await show(code);const gate=await value('DiplomaticInbox.gate(testRecord)');eq(gate.ok);const before=await value('G.emps.map(e=>({...e.res}))');
   const q=gate.quote;await page.locator('#inboxYes').evaluate(el=>{const span=document.createElement('span');span.textContent='Karar';el.appendChild(span);});await page.locator('#inboxYes span').click();
   eq(await value('testRecord.status'),'accepted');
   const after=await value('JSON.stringify(G.emps.map(e=>e.res))');
   if(kind==='trade')eq(await value('G.p.res.min'),before[0].min+23);
   if(q){eq(await value('G.emps[1].res.etk'),before[1].etk-q.cost);eq(await value('G.p.res.etk'),before[0].etk);}
   // A stale detached DOM button and a replayed payload must not transfer anything twice.
   await value(`document.body.dispatchEvent(new MouseEvent('click',{bubbles:true}));DiplomaticInbox.resolve(testRecord.id,true);`);
   eq(await value('JSON.stringify(G.emps.map(e=>e.res))'),after);
   if(kind==='invite')eq(await value('G.feds[0].members.filter(x=>x===0).length'),1);
   if(kind==='vassal'){eq(await value('G.emps[1].overlord'),0);eq(await value('G.emps[1].res.etk'),before[1].etk-90);}
  });
  await test(kind+' rejection actual click preserves resource balances',async()=>{
   await show(code);const before=await value('JSON.stringify(G.emps.map(e=>e.res))');await page.click('#inboxNo');eq(await value('testRecord.status'),'rejected');eq(await value('JSON.stringify(G.emps.map(e=>e.res))'),before);
  });
 }
 await test('counter click opens canonical draft and keeps original pending',async()=>{await show('testRecord=add95()');const before=await value('JSON.stringify(G.emps.map(e=>e.res))');await page.click('#inboxCounter');eq(await value('UI.deal.from===0&&UI.deal.to===1&&UI.deal.want[0].v===23'));eq(await value('testRecord.status'),'pending');eq(await value('JSON.stringify(G.emps.map(e=>e.res))'),before);});
 await test('invalid stock disables accept and counter and explains reason',async()=>{await show('testRecord=add95();G.emps[1].res.min=0');eq(await page.locator('#inboxYes').isDisabled());eq(await page.locator('#inboxCounter').isDisabled());assert.ok((await page.locator('#inboxReason').innerText()).length>5);const before=await value('G.p.res.min');await page.locator('#inboxYes').dispatchEvent('click');eq(await value('G.p.res.min'),before);});
 await test('stale close and replacement modal callbacks stay inert',async()=>{await show('testRecord=add95();window.before95=G.p.res.min');await value('window.old95=UI._hooks.inboxYes');await page.click('[data-a="closem"]');await value('old95()');eq(await value('G.p.res.min'),await value('before95'));await value('ArchiveUI.record(testRecord.id);window.old95=UI._hooks.inboxYes;UI.opLogMenu();old95()');eq(await value('testRecord.status'),'pending');});
 await test('load another world invalidates old DOM and action closure',async()=>{await show('testRecord=add95()');await value('window.old95=UI._hooks.inboxYes;window.button95=document.querySelector("#inboxYes");deserialize(serialize());window.before95=G.p.res.min;old95();button95.click()');eq(await value('G.p.res.min'),await value('before95'));eq(await value('DiplomaticInbox.pending()'),1);});
 await test('expired offer and receipts persist without second payment',async()=>{await show('testRecord=add95()');await page.click('#inboxYes');await value('window.id95=testRecord.id;window.before95=G.p.res.min;deserialize(serialize());ArchiveUI.record(id95)');eq(await page.locator('#inboxYes').count(),0);eq(await value('G.p.res.min'),await value('before95'));await value('testRecord=add95([{t:"res",r:"min",v:24}]);G.day=testRecord.expires;ArchiveUI.record(testRecord.id)');eq(await value('testRecord.status'),'expired');eq(await page.locator('#inboxYes').count(),0);});
 await test('remote confirmation actual click enqueues once with deferred cost',async()=>{await value('window.before95=JSON.stringify(G.p.res);ArchiveUI.build(G.fleets.find(f=>f.name==="Usta").id)');await page.selectOption('#remoteTarget','2');eq(await page.locator('#remoteConfirm').isDisabled(),false);await page.click('#remoteConfirm');eq(await value('Object.values(G.construction.queues).flat().length'),1);eq(await value('JSON.stringify(G.p.res)'),await value('before95'));});
 await test('closed and loaded remote confirmation callbacks stay inert',async()=>{await value('ArchiveUI.build(G.fleets.find(f=>f.name==="Usta").id);window.old95=UI._hooks.remoteConfirm');await page.click('[data-a="closem"]');await value('old95();ArchiveUI.build(G.fleets.find(f=>f.name==="Usta").id);window.old95=UI._hooks.remoteConfirm;deserialize(serialize());old95()');eq(await value('Object.values(G.construction.queues).flat().length'),0);});
 await test('dates use news day and proposal born; remain frozen after save/load',async()=>{await value('testRecord=add95();recordNews({category:"war",empires:[0],title:"Tarih"});window.dates95=[ArchiveUI.date(testRecord),ArchiveUI.date(G.news.records[0])];G.day+=60;G.month+=2;deserialize(serialize());window.after95=[ArchiveUI.date(G.diplomaticInbox.records[0]),ArchiveUI.date(G.news.records[0])];ArchiveUI.open("inbox")');eq(await value('JSON.stringify(dates95)===JSON.stringify(after95)'));assert.ok(!(await page.locator('#archiveRows').innerText()).includes('NaN'));eq(await value('ArchiveUI.date({year:2210,month:1,day:0})'),'2210.01 · gün 0');eq(await value('ArchiveUI.date({year:2210,month:1,day:NaN})'),'Tarih bilinmiyor');});
 await test('65 records pagination, filtering, detail return and mode state',async()=>{
  await value('for(let i=0;i<65;i++)recordNews({key:"row"+i,category:"war",empires:[0],title:"Haber "+i,text:"Uzun açıklama ".repeat(60)});ArchiveUI.open()');eq(await page.locator('.archiveRow').count(),30);
  await page.locator('[data-a="archiveMore"]').click();eq(await page.locator('.archiveRow').count(),60);
  await page.locator('#archiveRows').evaluate(el=>el.scrollTop=500);const scroll=await page.locator('#archiveRows').evaluate(el=>el.scrollTop);
  const target=page.locator('[data-a="newsDetail"]').nth(15);await target.click();const id=await value('ArchiveUI.selected');await page.click('.archiveTabs [data-a="news"]');eq(await page.locator('.archiveRow').count(),60);eq(await value('ArchiveUI.selected'),id);assert.ok(Math.abs(await page.locator('#archiveRows').evaluate(el=>el.scrollTop)-scroll)<50);
  await page.fill('#archiveSearch','Haber 6');eq(await page.locator('.archiveRow').count(),6);await page.click('.archiveTabs [data-a="diplomaticInbox"]');await page.click('.archiveTabs [data-a="news"]');eq(await page.inputValue('#archiveSearch'),'Haber 6');
 });
 await test('pin and unread controls update and preserve selection',async()=>{await value('recordNews({category:"war",empires:[0],title:"Sabit haber"});ArchiveUI.open()');await page.click('[data-a="newsDetail"]');await page.click('[data-a="newsPin"]');await page.click('.mft [data-a="news"]');await page.click('[data-a="newsPinned"]');eq(await page.locator('.archiveRow').count(),1);eq(await value('ArchiveUI.pinnedOnly'));await page.click('[data-a="newsUnread"]');eq(await page.locator('.archiveRow').count(),0);});
 for(const [width,height]of [[740,360],[360,740],[1280,720]])await test(width+'x'+height+' bounded dense list and fixed header with independent scroll',async()=>{
  await page.setViewportSize({width,height});await value('for(let i=0;i<40;i++)recordNews({key:"layout"+i,category:"war",empires:[0],title:"Uzun haber başlığı ".repeat(20),text:"Çok uzun açıklama ".repeat(60)});ArchiveUI.open()');
  const geometry=await page.locator('.archiveShell').evaluate(box=>{const rows=document.querySelector('#archiveRows'),header=box.querySelector('.mhd'),r=rows.getBoundingClientRect();return {width:box.getBoundingClientRect().width,height:box.getBoundingClientRect().height,x:box.getBoundingClientRect().x,scrollWidth:rows.scrollWidth,clientWidth:rows.clientWidth,scrollHeight:rows.scrollHeight,clientHeight:rows.clientHeight,rowHeight:rows.querySelector('.archiveRow').getBoundingClientRect().height,header:header.getBoundingClientRect().top,visible:Math.floor(r.height/rows.querySelector('.archiveRow').getBoundingClientRect().height),docOverflow:document.documentElement.scrollWidth>innerWidth};});
  eq(geometry.x,0);assert.ok(geometry.width<=width&&geometry.height<=height);assert.ok(geometry.scrollWidth<=geometry.clientWidth+1);assert.ok(geometry.scrollHeight>geometry.clientHeight);eq(geometry.docOverflow,false);if(width===740)assert.ok(geometry.visible>=4,JSON.stringify(geometry));
  await page.locator('#archiveRows').evaluate(el=>el.scrollTop=500);eq(await page.locator('.archiveShell .mhd').evaluate(el=>el.getBoundingClientRect().top),geometry.header);
  fs.writeFileSync(path.join(out,'layout-'+width+'x'+height+'.json'),JSON.stringify(geometry,null,2));
  if(width===740&&process.env.STARS_SCREENSHOT)await page.screenshot({path:process.env.STARS_SCREENSHOT});
 });
 await page.setViewportSize({width:740,height:360});
 await test('unknown empire and location do not become navigable',async()=>{await value('recordNews({category:"war",empires:[1],title:"Bilinen",text:"Kayıt",system:2});delete G.p.contact[1];G.sys[2].seen=[];ArchiveUI.open()');eq(await page.locator('[data-a="newsEmpire"]').count(),0);await page.click('[data-a="newsDetail"]');eq(await page.locator('[data-a="newsLocation"]').count(),0);eq(await page.locator('[data-a="newsEmpire"]').count(),0);});
 await test('known empire and location click reach identity and same map camera',async()=>{await value('recordNews({category:"war",empires:[0],title:"Konum",system:2});window.cam95=View.cam;ArchiveUI.open()');await page.click('[data-a="newsDetail"]');await page.click('[data-a="newsLocation"]');eq(await value('View.selSys.id'),2);eq(await value('View.cam===cam95'));await value('ArchiveUI.open()');await page.click('[data-a="newsEmpire"]');eq(await page.locator('#diploPane').evaluate(e=>e.classList.contains('show')));});
 await test('supplemental topbar war access does not overlap resource strip',async()=>{
  await value('for(let i=1;i<7;i++)G.p.war[i]=true;G.minNote=42;UI.topbar()');const g=await page.evaluate(()=>{const a=$('resourceStrip').getBoundingClientRect(),b=$('topStatusBtn').getBoundingClientRect();return {a:a.right,b:b.left,w:b.width,right:b.right};});assert.ok(g.a<=g.b+1&&g.w>=36&&g.right<=740,JSON.stringify(g));
 });
 await test('supplemental portrait archive remains clickable above rotation advice',async()=>{
  await page.setViewportSize({width:360,height:740});await value('UI.checkOrient();recordNews({category:"war",empires:[0],title:"Dikey haber"});ArchiveUI.open()');await page.click('[data-a="newsDetail"]');eq(await value('G.news.records[0].read'));await page.click('.mft [data-a="news"]');eq(await page.locator('.archiveRow').count(),1);
 });
 await test('supplemental read-all refreshes tab count and keeps list position',async()=>{
  await value('for(let i=0;i<20;i++)recordNews({key:"read"+i,category:"war",empires:[0],title:"Okunacak "+i});ArchiveUI.open()');await page.locator('#archiveRows').evaluate(el=>el.scrollTop=200);const scroll=await page.locator('#archiveRows').evaluate(el=>el.scrollTop);await page.click('[data-a="newsReadAll"]');eq(await value('GalacticNews.unread()'),0);assert.ok((await page.locator('.archiveTabs [data-a="news"]').innerText()).includes('· 0'));eq(await page.locator('#archiveRows').evaluate(el=>el.scrollTop),scroll);
 });
 await test('supplemental actual speed and war pause setting buttons work',async()=>{
  await page.click('#timepod [data-a="spd"][data-x="1"]');eq(await value('G.speed'),1);await page.click('#timepod [data-a="spd"][data-x="0"]');eq(await value('G.speed'),0);await value('UI.saveMenu();window.warpause95=WAR_PAUSE_ON');await page.click('[data-a="warPauseToggle"]');eq(await value('WAR_PAUSE_ON!==warpause95'));
 });
 for(const type of ['askeri','bilimsel','ticaret'])await test('supplemental '+type+' federation actual founding click with exactly 220 Influence',async()=>{
  await value(`G.feds=[];G.council=null;G.day=800;for(const e of G.emps){e.home=e.id;e.inc={ene:100,min:100,etk:20};e.ethics={mil:0,aut:0,mat:0,ahl:0};e.persLock=e.mizac='yayilmaci';delete e._prof;delete e._pers;for(const o of G.emps){e.contact[o.id]=true;e.rel[o.id]=80;e.intel[o.id]=3;}}for(let i=0;i<4;i++)G.sys[i].owner=i;for(const id of [1,2])G.p.ally[id]=G.emps[id].ally[0]=true;G.emps[1].ally[2]=G.emps[2].ally[1]=true;G.p.res.etk=220;UI.openFed()`);
  const pane=await page.locator('#diploPane').innerText();assert.ok(pane.includes('Toplam müttefik')&&pane.includes('Gerekli asgari üye / AI ortak'));const button=page.locator('[data-a="foundFed"][data-x="'+type+'"]');if(!await button.evaluate(el=>el.closest('details').open))await button.locator('..').locator('summary').click();await button.click();eq(await value('G.feds.length'),1);eq(await value('G.feds[0].type'),type);eq(await value('G.feds[0].members.length'),3);eq(await value('G.p.res.etk'),0);
 });
 await test('extended inbox 65 proposals list and detail return preserve page and scroll',async()=>{
  await value('for(let i=1;i<=65;i++)add95([{t:"res",r:"min",v:i}]);ArchiveUI.open("inbox")');eq(await page.locator('.archiveRow').count(),30);assert.ok(!(await page.locator('#archiveRows').innerText()).includes('NaN'));await page.locator('[data-a="archiveMore"]').click();eq(await page.locator('.archiveRow').count(),60);await page.locator('[data-a="diplomaticRecord"]').nth(45).click();const id=await value('ArchiveUI.selected'),scroll=await value('ArchiveUI.scroll');await page.click('.mft [data-a="diplomaticInbox"]');eq(await page.locator('.archiveRow').count(),60);eq(await value('ArchiveUI.selected'),id);eq(await page.locator('#archiveRows').evaluate(el=>el.scrollTop),scroll);
 });
 await test('extended existing offer modal accepts through its already routed button',async()=>{
  await value('testRecord=add95();window.before95=G.p.res.min;UI.aiDealOpen(testRecord.note.data)');await page.click('[data-a="offYes"]');eq(await value('testRecord.status'),'accepted');eq(await value('G.p.res.min-before95'),23);
 });
 await test('touch swipe scrolls the archive without moving the header',async()=>{
  await value('for(let i=0;i<40;i++)recordNews({key:"touch"+i,category:"war",empires:[0],title:"Dokunma "+i});ArchiveUI.open()');
  const client=await context.newCDPSession(page);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:460,y:310}]});
  for(let y=290;y>=170;y-=20){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:460,y}]});await page.waitForTimeout(25);}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);assert.ok(await page.locator('#archiveRows').evaluate(el=>el.scrollTop)>0);eq(await page.locator('.archiveShell .mhd').evaluate(el=>el.getBoundingClientRect().top),0);await client.detach();
 });
 await test('archive scope clears on ordinary modal and other sizes stay unchanged',async()=>{await value('ArchiveUI.open();UI.openModal("<div class=mbd>Normal</div>")');eq(await page.locator('#modal').evaluate(e=>e.classList.contains('archiveHost')),false);eq(await page.locator('.archiveShell').count(),0);});
 await test('real service worker installs 96A shell and serves offline modules',async()=>{
  await value('UI.closeModal()');await page.evaluate(async()=>{await saveGame();await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
  // Worker lifecycle: activate prior 95E.2 cache name, then upgrade to current 95E.3.
  serveOldWorker=true;await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});await page.waitForFunction(async()=>{const k=await caches.keys();return k.includes('stars-v95e3')&&!k.includes('stars-v96a');});
  serveOldWorker=false;await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});await page.waitForFunction(async()=>{const k=await caches.keys();return k.includes('stars-v96a')&&!k.includes('stars-v95e3');});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('stars-v96a'));const cached=await page.evaluate(async()=>{const c=await caches.open('stars-v96a');return Promise.all(['./archive-ui.js','./inbox.js','./news.js','./index.html'].map(async u=>!!await c.match(u)));});assert.ok(cached.every(Boolean));
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof ArchiveUI!=='undefined');eq(await page.evaluate(async()=>{const save=await storeGet('yildiz:save');return !!save&&JSON.parse(save).v===8;}));await context.setOffline(false);
 });
 const report={browser:browser.version(),physicalAndroid:false,viewportEmulation:true,pass:results.filter(r=>r.ok).length,fail:results.filter(r=>!r.ok).length,pageErrors:errors,results};fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2));console.log('BROWSER GEÇEN: '+report.pass+' KALAN: '+report.fail);process.exitCode=report.fail?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
