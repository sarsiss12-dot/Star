'use strict';
// Controlled browser/automation diagnosis. No STARS runtime mutation and no synthetic JS click.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const out=process.env.STARS_OUTPUT||'/tmp/stars-beta-p02/touch';fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{const b=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});try{
 for(const mode of ['static','replace'])for(const method of ['locator','touchscreen','sequential']){
  const c=await b.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await c.newPage(),events=[];p.setDefaultTimeout(8000);await p.exposeBinding('__touchLog',(_,r)=>events.push(r));
  await p.setContent(`<style>body{margin:0;background:#121c29;color:white}#box{position:absolute;left:20px;top:160px}button{min-width:44px;min-height:44px;touch-action:manipulation} .open button{width:400px}</style><div id="box"><button id="mp6Conn">👥</button></div><script>let serial=0,ids=new WeakMap();window.clicks=0;const describe=e=>{if(!ids.has(e))ids.set(e,++serial);return {node:ids.get(e),id:e.id,connected:e.isConnected}};for(const type of ['pointerdown','pointerup','touchstart','touchend','click'])addEventListener(type,e=>{const t=e.changedTouches?.[0]||e;__touchLog({event:type,at:performance.now(),trusted:e.isTrusted,target:describe(e.target),x:t.clientX,y:t.clientY});},true);document.getElementById('box').addEventListener('click',()=>{clicks++;if('${mode}'==='replace'){box.classList.toggle('open');box.innerHTML='<button id="mp6Conn">'+(clicks%2?'ÇOK OYUNCULU · bağlı':'👥')+'</button>';}});</script>`);
  const cdp=await c.newCDPSession(p),samples=[];let error=null;
  for(let i=0;i<(Number(process.env.BETA02_TOUCH_COUNT)||12);i++){
   const l=p.locator('#mp6Conn');if(method!=='locator')await l.tap({trial:true,timeout:8000});const rect=await l.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.id,[x,y]),'mp6Conn');
   const at=Date.now();try{
    if(method==='locator')await l.tap({timeout:8000});
    else if(method==='touchscreen')await p.touchscreen.tap(x,y);
    else {await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    const n=await p.evaluate(()=>clicks);assert.equal(n,i+1,'exactly one trusted input per request');samples.push({i,ms:Date.now()-at,clicks:n,x,y});
   }catch(e){error={name:e.name,message:e.message,stack:e.stack};await p.screenshot({path:path.join(out,mode+'-'+method+'-failure.png')});break;}
  }
  const r={mode,method,status:error?'FAIL':'PASS',samples,error,after:await p.evaluate(()=>({clicks,ready:document.readyState,html:box.innerHTML})),events};rows.push(r);fs.writeFileSync(path.join(out,'touch.json'),JSON.stringify(rows,null,2));console.log(r.status+' '+mode+' '+method+' '+samples.length+' completed, '+r.after.clicks+' clicks');await c.close();
 }
 }finally{await b.close();const fail=rows.filter(x=>x.status==='FAIL').length;console.log('GEÇEN: '+(rows.length-fail)+' KALAN: '+fail);process.exitCode=fail?1:0}})().catch(e=>{console.error(e);process.exitCode=1});
