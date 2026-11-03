'use strict';
// Same immutable guest Save8, fresh browser contexts; no live service or simulation ticks.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const [rootArg,blockFile,saveFile,outFile]=process.argv.slice(2),root=path.resolve(rootArg),block=fs.readFileSync(blockFile,'utf8'),save=fs.readFileSync(saveFile,'utf8');
const server=http.createServer((q,r)=>{const n=new URL(q.url,'http://localhost').pathname,f=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!f.startsWith(root+path.sep))return r.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return r.writeHead(404).end();r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/json');r.end(b);});});
(async()=>{let browser;const rows=[],pixelsOnly=process.env.MP86_PIXELS_ONLY==='1';try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 for(let round=0;round<(pixelsOnly?1:4);round++)for(const candidate of pixelsOnly?[true]:(round%2?[true,false]:[false,true])){
  const context=await browser.newContext({viewport:{width:800,height:360},isMobile:true,hasTouch:true}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof deserialize==='function'&&typeof UI!=='undefined');
  const c=await context.newCDPSession(page);await c.send('Emulation.setCPUThrottlingRate',{rate:4});if(candidate){await page.evaluate(()=>{window.__originalNebula86=ART.nebula;});await page.addScriptTag({content:block});}
  const pixelCases=candidate?await page.evaluate(()=>{let cases=0;for(const [seed,w,h] of [[404,128,128],[-7,128,64],[22,32,32]]){const a=__originalNebula86(seed,w,h),b=ART.nebula(seed,w,h),c=ART.nebula(seed,w,h),data=x=>x.getContext('2d').getImageData(0,0,w,h).data,A=data(a),B=data(b),C=data(c);if(b===c||A.some((v,i)=>v!==B[i]||v!==C[i]))throw Error('browser pixels differ');cases++;}return cases;}):0;
  if(pixelsOnly){rows.push({pixelCases,errors});await context.close();continue;}
  const r=await page.evaluate(s=>{LOOP.on=false;if(!deserialize(s)||!deserialize(s))throw Error('warm load');const samples=[],rng=RND_STATE;
   for(let i=0;i<12;i++){const t=performance.now();if(!deserialize(s))throw Error('load');samples.push(performance.now()-t);}
   if(RND_STATE!==rng)throw Error('rng');return {samples,rng:String(RND_STATE),serialized:serialize(),day:G.day,seed:G.seed};},save);
  r.sha256=crypto.createHash('sha256').update(r.serialized).digest('hex');delete r.serialized;assert.equal(errors.length,0);rows.push({round,candidate,...r,errors});await context.close();
 }
 if(pixelsOnly){assert.equal(rows[0].pixelCases,3);assert.equal(rows[0].errors.length,0);fs.writeFileSync(outFile,JSON.stringify({kind:'browser-pixels',cases:3,ok:true},null,2));console.log('Browser pixel cases: 3 PASS');return;}
 assert(rows.every(r=>r.sha256===rows[0].sha256&&r.rng===rows[0].rng),'Save8/RNG mismatch');
 const stat=a=>{const s=a.sort((x,y)=>x-y);return {n:s.length,median:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)]};};
 const result={save:path.basename(saveFile),inputSha256:crypto.createHash('sha256').update(save).digest('hex'),cpu:4,viewport:[800,360],rows,control:stat(rows.filter(r=>!r.candidate).flatMap(r=>r.samples)),candidate:stat(rows.filter(r=>r.candidate).flatMap(r=>r.samples)),equivalent:true};
 fs.writeFileSync(outFile,JSON.stringify(result,null,2));console.log(JSON.stringify({save:result.save,control:result.control,candidate:result.candidate,equivalent:true}));
 }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
