'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright'),relayMod=require('../research/mp1/server/relay'),{runtime}=require('./helpers/runtime');
const out=process.env.STARS_OUTPUT||'/tmp/stability-sp';fs.mkdirSync(out,{recursive:true});
const h=runtime();h.run(`setupGame({...CFG,seed:99,size:'orta',aiCount:5});`);const fixture=h.run('('+require('./helpers/beta-stability0-fixture.cjs').prepare.toString()+')(0)'),save=h.run('serialize()');
const rows=[],errors=[];let relay,b;
(async()=>{try{
 relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});const a=await relay.start();b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 for(const [width,height,mobile]of[[1920,1080,false],[800,360,true],[915,412,true],[960,540,true]]){
  const ctx=await b.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.stack));
  const hit=async s=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();if(mobile)await l.tap({timeout:8000});else await l.click({timeout:8000});};
  try{
   await p.goto('http://127.0.0.1:'+a.address().port);await p.waitForFunction(()=>typeof deserialize==='function');
   await p.evaluate(save=>{if(!deserialize(save))throw Error('load');$('title').classList.add('hidden');enterGame(true);G.autoSave=false;UI.closeModal();UI.setSpeed(0);},save);
   const rng=await p.evaluate(()=>RND_STATE),before=await p.evaluate(()=>serialize());
   await p.evaluate(f=>UI.act('fleetRecovery',f.lost),fixture);assert.equal(await p.evaluate(()=>serialize()),before);assert.equal(await p.evaluate(()=>RND_STATE),rng);
   assert.match(await p.locator('#modal').innerText(),/Savaşta tam kayıp/);
   await hit('#modal [data-a="fleetRecoveryDo"][data-x$=":hold"]');assert.match(await p.locator('#fleetRecoveryResult').innerText(),/UYGULANDI/);
   await hit('#fleetRecoveryResult [data-a="fleetRecovery"]');await hit('#modal [data-a="fleetRecoveryDo"][data-x$=":merge"]');
   assert.equal(await p.evaluate(f=>fleetRecoveryGroups(G.p).find(g=>g.id===f.lost).ships.length,fixture),1);
   await hit('#fleetRecoveryResult [data-a="fleetRecovery"]');const index=await p.evaluate(f=>UI._fleetRecoveryPending.choices.findIndex(c=>c.target.fleet===f.target),fixture);
   const stock=await p.evaluate(()=>({...G.p.res}));await hit('#modal [data-a="fleetRecoveryDo"][data-x$=":'+index+'"]');
   assert.match(await p.locator('#fleetRecoveryResult').innerText(),/UYGULANDI/);await hit('#modal [data-a="fleetRecoveryDo"][data-x$=":'+index+'"]');
   assert.equal(await p.evaluate(f=>G.fleets.find(x=>x.id===f.target).ships.length,fixture),28);assert.deepEqual(await p.evaluate(()=>({...G.p.res})),stock);
   assert.equal(await p.evaluate(f=>G.sys[f.sys].queue.filter(q=>q.delivery?.fleet===f.target).length,fixture),2);
   await p.screenshot({path:path.join(out,'sp-recovery-'+width+'.png')});rows.push({viewport:[width,height],status:'PASS',native:mobile?'touch':'mouse',pureOpen:true,realCauseVisible:true,holdMergeRetarget:true,duplicateNoExtraShips:true,paidOrders:2,reinforcementHulls:27});console.log('PASS SP '+width+'x'+height);
  }catch(e){rows.push({viewport:[width,height],status:'FAIL',error:e.stack});console.log('FAIL '+e.stack);await p.screenshot({path:path.join(out,'sp-fail-'+width+'.png')});}finally{await ctx.close();}
 }
}catch(e){rows.push({name:'FATAL',status:'FAIL',error:e.stack});console.log(e.stack);}finally{await b?.close();relay?.shutdown();rows.push({name:'page errors',status:errors.length?'FAIL':'PASS',errors});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,2));console.log(`GEÇEN: ${rows.filter(r=>r.status==='PASS').length} KALAN: ${rows.filter(r=>r.status==='FAIL').length}`);if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;}})();
