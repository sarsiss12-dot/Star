'use strict';
// Small real-touch focus/scroll race, using the existing local relay and Chromium infrastructure.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright'),relay=require('../research/mp1/server/relay');
const out=process.env.STARS_OUTPUT||'/tmp/star-mp88/input';fs.mkdirSync(out,{recursive:true});
(async()=>{const r=relay.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});let b;try{
 const server=await r.start();b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:800,height:360},isMobile:true,hasTouch:true,deviceScaleFactor:2});const c=await p.context().newCDPSession(p),events=[];
 await p.exposeBinding('__race88',(_,e)=>events.push(e));await p.addInitScript(()=>{for(const k of ['pointerdown','pointerup','touchstart','touchend','click','scroll'])addEventListener(k,e=>{const t=e.changedTouches?.[0],x=t?t.clientX:e.clientX,y=t?t.clientY:e.clientY;window.__race88({event:k,path:location.pathname,j:e.target?.closest?.('[data-j]')?.dataset.j,x,y,scroll:document.getElementById('mp6App')?.scrollTop,at:performance.now(),trusted:e.isTrusted}).catch(()=>{});},true);});
 if(process.env.MP88_CONTROL)await p.route('**/join.js',q=>q.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.MP88_CONTROL,'utf8')}));
 const url='http://127.0.0.1:'+server.address().port+'/mp/play';await p.goto(url);await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));
 await p.fill('#jCode','ZZZZZ');await p.waitForTimeout(350);await p.fill('#jName','Bora');
 const point=await p.evaluate(()=>{const el=document.querySelector('[data-j=go]'),r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await p.waitForTimeout(320);
 const during=await p.evaluate(({x,y})=>({scroll:document.getElementById('mp6App').scrollTop,hit:document.elementFromPoint(x,y)?.closest('[data-j]')?.dataset.j}),point);
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(500);
 const result={control:!!process.env.MP88_CONTROL,point,during,path:new URL(p.url()).pathname,events};fs.writeFileSync(path.join(out,'input-race.json'),JSON.stringify(result,null,2));
 if(process.env.MP88_CONTROL){assert.equal(result.path,'/','baseline must reproduce wrong navigation');assert.equal(events.find(e=>e.event==='pointerdown').j,'go');assert.equal(events.find(e=>e.event==='pointerup').j,'go');assert(events.some(e=>e.event==='click'&&e.j==='home'));console.log('REPRODUCED A1: original code trusted tap navigates to /');}
 else{assert.equal(result.path,'/mp/play');assert.equal(during.hit,'go');assert.equal(events.filter(e=>e.event==='click'&&e.j==='go').length,1);assert(!events.some(e=>e.event==='click'&&e.j==='home'));await p.waitForFunction(()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
  await p.goto(url);await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jName','Bora');await p.waitForTimeout(350);
  const idle=await p.evaluate(()=>document.getElementById('mp6App').scrollTop);assert(idle>0,'idle input scrolling must still work');
  await p.goto(url);await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jCode','ZZZZZ');await p.fill('#jName','Bora');
  await require('./helpers/mp83-join-touch.cjs').joinBurst(p,3,async(_,x,y)=>{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});});
  assert.equal(new URL(p.url()).pathname,'/mp/play');await p.waitForFunction(()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
  await p.setViewportSize({width:960,height:540});await p.goto(url);await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jCode','ZZZZZ');await p.fill('#jName','Bora');
  await require('./helpers/mp83-join-touch.cjs').joinBurst(p,3,async(_,x,y)=>{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});});assert.equal(new URL(p.url()).pathname,'/mp/play');await p.waitForFunction(()=>/geçersiz/.test(document.getElementById('jStatus').textContent));
  console.log('PASS A1: single correct click; idle scroll preserved; fresh-coordinate triple join safe at 800x360 and 960x540');}
 }finally{await b?.close();r.shutdown();}})().catch(e=>{console.error(e);process.exitCode=1});
