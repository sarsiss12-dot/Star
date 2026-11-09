'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright'),relayMod=require('../research/mp1/server/relay');
const out=path.resolve(process.env.STARS_OUTPUT||'/tmp/war-center-ui');fs.mkdirSync(out,{recursive:true});const rows=[],errors=[];let relay,browser;
(async()=>{try{
 relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});const server=await relay.start();browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 for(const [w,h,mobile] of [[1920,1080,false],[800,360,true],[915,412,true],[960,540,true]]){
  const context=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.stack));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>typeof WarCenterUI!=='undefined');
  const hit=async s=>{const l=p.locator(s).first();if(mobile)await l.tap({timeout:8000});else await l.click({timeout:8000});};
  await p.evaluate(()=>{setupGame({...CFG,seed:23,size:'orta',aiCount:11});G.autoSave=false;G.feds=[];G.council=null;G.day=900;for(const e of G.emps){e.ai=false;e.ally={};e.war={};e.nap={};e.peaceAt={};e.civics=[];e.factions=null;e.mizac='militarist';e.res.etk=100000;e.contact=Object.fromEntries(G.emps.filter(x=>!x.wild).map(x=>[x.id,true]));}G.p.intel=Object.fromEntries(G.emps.map(e=>[e.id,3]));for(let n=1;n<9;n++){declareWar(G.p,G.emps[n]);G.day++;makePeace(G.p,G.emps[n]);}declareWar(G.p,G.emps[1]);declareWar(G.p,G.emps[2]);declareWar(G.emps[3],G.emps[4]);$('title').classList.add('hidden');enterGame(true);UI.closeModal();UI.modalPrevSpeed=0;UI.setSpeed(0);LOOP.on=false;UI.topbar();});
  await p.waitForTimeout(1200);if(await p.locator('#modal').evaluate(e=>!e.classList.contains('hidden')))await hit('#modal [data-a="advClose"],#modal [data-a="closem"]');await p.evaluate(()=>{UI.modalPrevSpeed=0;UI.setSpeed(0);LOOP.on=false;});
  assert(await p.evaluate(()=>{const button=$('topStatusBtn');for(let i=0;i<30;i++)UI.topbar();return button===$('topStatusBtn');}),'unchanged HUD replaced target');
  const before=await p.evaluate(()=>({save:serialize(),rng:RND_STATE,z:View.cam.z}));
  for(const scale of mobile?[100]:[80,100,125]){await p.evaluate(s=>UI.setUIScale(s),scale);for(let repeat=0;repeat<2;repeat++){
   await hit('#topStatusBtn');const pick=p.locator('#modal [data-a="pickOne"]').filter({hasText:'⚔ Savaş Merkezi ·'});assert.equal(await pick.count(),1);assert((await pick.innerText()).includes('Savaş Merkezi'));if(mobile)await pick.tap({timeout:8000});else await pick.click({timeout:8000});
   for(const tab of ['known','past','mine']){await hit('[data-a="warCenterTab"][data-x="'+tab+'"]');assert.equal(await p.evaluate(()=>WarCenterUI.tab),tab);}
   await hit('[data-a="warCenterDetail"]');assert((await p.locator('#modal').innerText()).includes('SAVAŞ MERKEZİ'));await p.screenshot({path:path.join(out,w+'-scale'+scale+'-detail.png')});await hit('[data-a="warCenter"]');await p.screenshot({path:path.join(out,w+'-scale'+scale+'-list.png')});await hit('#modal [data-a="closem"]');
  }await p.screenshot({path:path.join(out,w+'-scale'+scale+'.png')});rows.push({name:w+'x'+h+' scale'+scale+' open/reopen/tabs/detail/close',status:'PASS'});}
  assert.deepEqual(await p.evaluate(()=>({save:serialize(),rng:RND_STATE,z:View.cam.z})),before);
  const news=await p.evaluate(()=>G.news.records.find(r=>r.key==='war-end:1').id);await p.evaluate(id=>ArchiveUI.detail(id),news);assert((await p.locator('[data-war-status="war-end:1"]').innerText()).includes('SONA ERDİ'));assert.equal(await p.evaluate(()=>WarCenterUI.front),1);await hit('[data-a="warCenter"]');await hit('[data-a="warCenterTab"][data-x="past"]');await p.screenshot({path:path.join(out,w+'-history.png')});rows.push({name:w+' historical news stable ID',status:'PASS'});await context.close();
 }
 }catch(e){rows.push({name:'browser',status:'FAIL',error:e.stack});console.error(e.stack);if(browser)for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(await p.evaluate(()=>({modal:$('modal').innerText,scale:UI.getUIScale(),index:WarCenterUI.index})).catch(()=>({})),null,2));}}
 finally{await browser?.close();relay?.shutdown();if(errors.length)rows.push({name:'pageerrors',status:'FAIL',errors});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,2));console.log('GEÇEN: '+rows.filter(r=>r.status==='PASS').length+' KALAN: '+rows.filter(r=>r.status==='FAIL').length);process.exitCode=rows.some(r=>r.status==='FAIL')?1:0;}
})();
