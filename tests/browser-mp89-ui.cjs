'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright'),relayMod=require('../research/mp1/server/relay');
const out=process.env.STARS_OUTPUT||'/tmp/star-mp89/ui',save=fs.readFileSync(path.join(__dirname,'fixtures/stars-2210-06.sav.json'),'utf8');fs.mkdirSync(out,{recursive:true});
const fixture=fs.readFileSync(path.join(__dirname,'helpers/96e-fixture.js'),'utf8').match(/h\.run\(`([\s\S]*?)`\)/)[1];
const results=[],errors=[];let relay,b,ctx,p;
async function test(name,fn){try{const data=await fn();results.push({name,status:'PASS',data});console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:e.stack});console.log('FAIL '+name+' '+e.stack);if(p)await p.evaluate(()=>({viewport:[innerWidth,innerHeight],path:location.pathname,scale:UI.getUIScale?.(),modal:document.getElementById('modal')?.innerHTML.slice(0,1500),title:document.getElementById('title')?.className,menu:document.getElementById('menu')?.className})).then(d=>fs.writeFileSync(path.join(out,'fail-'+results.length+'-dom.json'),JSON.stringify(d,null,2))).catch(()=>{});await p?.screenshot({path:path.join(out,'fail-'+results.length+'.png')}).catch(()=>{});}fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify({results,errors},null,2));}
(async()=>{try{relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});const s=await relay.start(),base='http://127.0.0.1:'+s.address().port;b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
for(const [w,h,mobile] of [[1280,720,false],[1366,768,false],[1920,1080,false],[2560,1440,false],[3440,1440,false],[800,360,true],[960,540,true]].filter(([w])=>!process.env.MP89_WIDTH||w===Number(process.env.MP89_WIDTH)).filter(([w])=>!process.env.BETA0_WIDTHS||process.env.BETA0_WIDTHS.split(',').map(Number).includes(w))){
 ctx=await b.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});p=await ctx.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
 const cpuRate=(process.env.BETA0_CPU_VIEWS||'').split(',').includes(String(w))?4:1;if(cpuRate===4){const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});}
 if(process.env.BETA0_DIAG==='1')await require('./helpers/beta0-ui-diag.cjs')(p,out,String(w));
 const shot=n=>p.screenshot({path:path.join(out,w+'-'+n+'.png')});
 const world=async()=>{await p.evaluate(s=>{deserialize(s);$('title').classList.add('hidden');enterGame(true);LOOP.on=false;G.autoSave=false;UI.setSpeed(0);UI.closeModal();UI.setSpeed(0);UI.modalPrevSpeed=0;UI.checkOrient();},save);};
 if(process.env.MP89_PANEL_ONLY){await p.goto(base);await p.waitForFunction(()=>typeof UI!=='undefined'&&UI.getUIScale);await p.evaluate(()=>UI.uiScaleReady);if(process.env.MP89_PANEL_SCALE)await p.evaluate(v=>UI.setUIScale(v),Number(process.env.MP89_PANEL_SCALE));}
 if(!process.env.MP89_ONLY_SCALE&&!process.env.MP89_PANEL_ONLY)await test(w+'x'+h+' menu + setup',async()=>{await p.goto(base);await p.waitForFunction(()=>typeof UI!=='undefined'&&UI.getUIScale);await p.evaluate(()=>UI.uiScaleReady);await shot('menu');
 if(process.env.MP89_TRACE==='1'){
  const file=path.join(out,w+'-modal-trace.jsonl');await p.exposeBinding('__ui89trace',(_,d)=>fs.appendFileSync(file,JSON.stringify(d)+'\n'));
  await p.evaluate(()=>{const log=kind=>__ui89trace({kind,t:performance.now(),head:document.querySelector('#modal .mhd')?.innerText,controls:!!document.getElementById('uiScaleSelect'),scale:UI.getUIScale(),stack:new Error().stack}).catch(()=>{});const open=UI.openModal;UI.openModal=function(){const r=open.apply(this,arguments);log('openModal');return r;};const save=UI.saveMenu;UI.saveMenu=function(){const r=save.apply(this,arguments);log('saveMenu-after');return r;};new MutationObserver(()=>log('mutation')).observe(document.getElementById('modal'),{childList:true,subtree:true});});
 }
 await p.locator('[data-a="tNew"]').first().click();await shot('setup');});
 if(!process.env.MP89_ONLY_SCALE&&!process.env.MP89_RETAKE)await test(w+'x'+h+' game and panels',async()=>{await world();assert(!await p.locator('#rotate').evaluate(e=>e.classList.contains('show')));const audit=[];
  for(const [name,fn] of [['map',()=>{View.selSys=G.sys[G.p.home];UI.tab('sistem');UI.refresh();}],['production',()=>{View.selSys=G.sys[G.p.home];UI.tab('sistem');UI.refresh();document.querySelector('.buildingGrid')?.scrollIntoView({block:'center'});}],['fleet',()=>{View.sel=G.fleets.find(f=>f.e===0&&f.ships.length);UI.tab('filo');UI.refresh();}],['science',()=>UI.openScience()],['diplo',()=>UI.openDiplo()],['notification',()=>UI.alert('MP89 ekran denetimi — örnek yerel bildirim','sci')],['federation',()=>UI.openFed()],['vassal',()=>UI.act('vsOpen','1:demand')],['spy',()=>UI.tab('intel')],['council',()=>UI.openCouncil()],['settings',()=>UI.saveMenu()]]){
   await p.evaluate(()=>{UI.closeModal();document.getElementById('diploPane').classList.remove('show');});if(name==='federation')await p.evaluate(f=>{window.members96=[0,1,2];eval(f);},fixture);await p.evaluate(fn);await p.waitForFunction(()=>[...document.querySelectorAll('#modal:not(.hidden),#modal:not(.hidden) .mbox,#diploPane.show,#diploPane.show .dpBox')].every(el=>!el.getAnimations().some(a=>a.playState==='running'&&Number.isFinite(a.effect.getComputedTiming().activeDuration))),undefined,{timeout:8000});await shot(name);
   audit.push(await p.evaluate(name=>{const els=[...document.querySelectorAll('#modal:not(.hidden) .mbox,#diploPane.show .dpBox,#sidebar:not(.off)')];return {name,boxes:els.map(e=>{const r=e.getBoundingClientRect();return {class:e.className,rect:[r.x,r.y,r.width,r.height],scroll:[e.scrollHeight,e.clientHeight]};}),overflow:document.documentElement.scrollWidth>innerWidth};},name));
  }if(process.env.MP89_PANEL_ONLY)for(const row of audit)for(const b of row.boxes){const [x,y,bw,bh]=b.rect;assert(x>=-1&&y>=-1&&x+bw<=w+1&&y+bh<=h+1,row.name+' final bounds');}return audit;
 });
 if(process.env.MP89_ONLY_SCALE){await p.goto(base);await p.waitForFunction(()=>typeof UI!=='undefined'&&UI.getUIScale);}
 if(!mobile&&!process.env.MP89_RETAKE&&!process.env.MP89_PANEL_ONLY)await test(w+' desktop scales',async()=>{await world();return require('./helpers/mp89-scale.cjs')(p,out,String(w),async()=>{await p.reload();await p.waitForFunction(()=>typeof UI!=='undefined'&&UI.getUIScale);await world();});});
 else if(mobile&&!process.env.MP89_RETAKE)await test(w+' touch + scale limit',async()=>{await p.evaluate(()=>UI.saveMenu());assert(await p.locator('[data-a="uiScaleUp"]').isDisabled());assert.equal(await p.evaluate(()=>UI.getUIScale().effective),100);await p.locator('#modal .mhd [data-a="closem"]').tap();await shot('touch-closed');});
 if(!process.env.MP89_ONLY_SCALE&&!process.env.MP89_PANEL_ONLY)await test(w+' PC/touch inputs + MP lobby',async()=>{
  await world();await p.evaluate(()=>{View.cam.x=G.W/2;View.cam.y=G.H/2;View.cam.z=.4;View.draw();});
  const before=await p.evaluate(()=>({...View.cam}));await p.mouse.move(w/2,h/2);await p.mouse.wheel(0,-100);await p.waitForTimeout(100);
  assert((await p.evaluate(()=>View.cam.z))>before.z,'wheel zoom');
  const old=await p.evaluate(()=>({...View.cam}));await p.mouse.move(w/2,h/2);await p.mouse.down();await p.mouse.move(w/2+70,h/2+25,{steps:6});await p.mouse.up();
  const moved=await p.evaluate(()=>({...View.cam}));assert(Math.abs(moved.x-old.x)>10,'mouse drag');
  const selected=await p.evaluate(()=>[View.sel?.id,View.selSys?.id]);await p.mouse.click(w/2,h/2,{button:'right'});assert.deepEqual(await p.evaluate(()=>[View.sel?.id,View.selSys?.id]),selected,'right click no game command');
  await p.evaluate(()=>UI.saveMenu());await p.locator('#uiScaleSelect').focus();const scaleProof=process.env.BETA0_DIAG==='1'?await require('./helpers/beta0-ui-scale.cjs')(p,mobile):null;await p.keyboard.press('ArrowDown');await p.keyboard.press('Escape');assert(await p.locator('#modal').evaluate(e=>e.classList.contains('hidden')),'Escape closes modal');
  let browserZoom=null;if(process.env.BETA0_DIAG==='1'){
   const read=()=>p.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visual:visualViewport?.scale}));
   const before=await read();await p.keyboard.press('Control+Equal');await p.waitForTimeout(100);const plus=await read();await p.keyboard.press('Control+Minus');await p.waitForTimeout(100);const minus=await read();await p.keyboard.press('Control+Digit0');
   browserZoom={before,plus,minus,status:JSON.stringify(before)!==JSON.stringify(plus)?'OBSERVED':'NOT RUN',note:'Native keyboard shortcuts in headless Chromium; unchanged metrics do not prove browser zoom.'};
  }
  await p.setViewportSize({width:w-80,height:h-30});await p.setViewportSize({width:w,height:h});assert(!await p.locator('#rotate').evaluate(e=>e.classList.contains('show')));
  if(!mobile)await p.evaluate(()=>UI.setUIScale(125));
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('mp1Btn'));const end=process.env.MP89_TRACE==='1'?await require('./helpers/mp89-menu-diag.cjs')(p,out):null;let error;try{await p.locator('#mp1Btn')[mobile?'tap':'click']({timeout:8000});await p.locator('[data-m="create"]').click({timeout:8000});}catch(e){error=e;throw e;}finally{if(end)await end(error);}
  await p.waitForFunction(()=>MP1Host.lobby?.phase==='waiting');await shot('mp-lobby');
  await p.locator('#mp7EditMe').click({timeout:8000});await p.waitForFunction(()=>document.getElementById('mp7Head'));await shot('mp-design');
  return {wheel:true,drag:true,rightClick:true,keyboardFocusEscape:true,resize:true,lobbyDesign:true,cpuRate,scaleProof,browserZoom};
 });
 await ctx.close();ctx=null;
}
}catch(e){console.error(e);results.push({name:'FATAL',status:'FAIL',error:e.stack});}finally{await ctx?.close();await b?.close();relay?.shutdown();fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify({results,errors},null,2));console.log('TOTAL '+results.filter(r=>r.status==='PASS').length+'/'+results.filter(r=>r.status==='FAIL').length);process.exitCode=results.some(r=>r.status==='FAIL')||errors.length?1:0;}})();
