'use strict';
// MP.8.3: 250 ms odak kaydırması sonrası eski koordinat GERİ'ye gider; güncel hedef KATIL'da kalır.
const {chromium}=require('playwright');
const relay=require('../research/mp1/server/relay');
(async()=>{const r=relay.create({MP1_PORT:'0',MP1_BIND:'127.0.0.1',MP1_DEV:'1'});let b;try{
const server=await r.start();b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const p=await b.newPage({viewport:{width:800,height:360},isMobile:true,hasTouch:true,deviceScaleFactor:2});
p.on('framenavigated',f=>{if(f===p.mainFrame())console.log('NAV',new URL(f.url()).pathname)});
await p.goto('http://127.0.0.1:'+server.address().port+'/mp/play');await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));
await p.fill('#jName','Bora');const box=await p.locator('[data-j=go]').boundingBox();
const sample=()=>p.evaluate(({x,y})=>{const a=document.getElementById('mp6App'),g=document.querySelector('[data-j=go]'),b=g.getBoundingClientRect(),t=document.elementFromPoint(x,y);return {go:[b.x,b.y,b.width,b.height],appScroll:a.scrollTop,focus:document.activeElement.id,hit:t&&{tag:t.tagName,j:t.dataset.j,href:t.getAttribute('href')}};},{x:box.x+box.width/2,y:box.y+box.height/2});
console.log('IMMEDIATE',await sample());await p.waitForTimeout(350);console.log('AFTER_FOCUS_TIMER',await sample());
const assert=require('assert/strict');const old=await sample();assert.equal(old.hit.j,'home');
await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await p.waitForURL('**/');console.log('STALE_POINT_NAV',new URL(p.url()).pathname);
await p.goto('http://127.0.0.1:'+server.address().port+'/mp/play');await p.waitForFunction(()=>window.MP1Join&&document.getElementById('jName'));
await p.fill('#jCode','ZZZZZ');await p.fill('#jName','Bora');await p.waitForTimeout(350);
await require('./helpers/mp83-join-touch.cjs').joinBurst(p,3,async(page,x,y)=>page.touchscreen.tap(x,y));
await p.waitForFunction(()=>/geçersiz/.test(document.getElementById('jStatus').textContent));assert.equal(new URL(p.url()).pathname,'/mp/play');console.log('FRESH_POINT_NAV /mp/play; invalid code shown; PASS');
}finally{await b?.close();r.shutdown();}})().catch(e=>{console.error(e);process.exitCode=1});
