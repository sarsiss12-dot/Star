'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),baseline=path.resolve(root,'../star96f1'),raw=fs.readFileSync(path.join(__dirname,'fixtures/96f3/96F1-11-turn-2370-1.save'),'utf8'),out=path.join(__dirname,'audit96f3/browser-performance.json');
let browser,server;const rows=[];
(async()=>{try{
 server=http.createServer((q,r)=>{const u=new URL(q.url,'http://localhost'),old=u.pathname.startsWith('/old/'),base=old?baseline:root,relative=u.pathname.replace(/^\/(old|new)\//,'');const file=path.resolve(base,relative||'index.html');if(!file.startsWith(base+path.sep)){r.writeHead(403).end();return}fs.readFile(file,(err,b)=>{if(err){r.writeHead(404).end();return}r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');r.end(b)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-webgl','--disable-dev-shm-usage']});
 for(const [label,url]of [['96F1','old'],['96F3','new']]){
  const context=await browser.newContext({viewport:{width:740,height:360},isMobile:true,hasTouch:true}),page=await context.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/'+url+'/');await page.waitForFunction(()=>typeof deserialize==='function');
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const row=await page.evaluate(raw=>{
   const restore=()=>{deserialize(raw);for(const x of JSON.parse(raw).emps)for(const k of ['inc','cgNeed','foodNeed'])if(x[k]!==undefined)G.emps[x.id][k]=x[k];G.speed=0;LOOP.on=false;};
   restore();const e=G.emps[1],c=e.colonies[0],s=G.sys[c.s],p=s.planets[c.p],keys=['maden','santral','ciftlik','lab','dokum','fabrika','liman'];
   const samples=[],before=serialize(),rng=RND_STATE;let checksum=0;
   for(let i=0;i<7;i++){const t=performance.now();for(let n=0;n<100;n++){const d=aiBuildingDelta(e,s,p,keys[n%keys.length]);checksum+=d.ene+d.min;}samples.push(performance.now()-t);}
   const pure=before===serialize()&&rng===RND_STATE,turns=[];
   for(let n=0;n<22;n++){restore();const t=performance.now();aiTurn(G.emps[1]);if(n>=2)turns.push(performance.now()-t);}
   const quantile=(a,q)=>a.slice().sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*q))];
   return {build:BUILD_ID,cpuThrottle:4,pure,checksum,forecast100:{samples,medianMs:quantile(samples,.5),p95Ms:quantile(samples,.95)},turn:{samples:turns,medianMs:quantile(turns,.5),p95Ms:quantile(turns,.95),over50ms:turns.filter(n=>n>50).length},heapBytes:performance.memory?.usedJSHeapSize||null};
  },raw);row.phase=label;assert(row.pure,'forecasts may not change saved game/RNG');rows.push(row);await context.close();
 }
 const result={status:'PASS',browser:browser.version(),scope:'Same real seed11 day2370 Save v8, mobile landscape/touch Chromium, 4x CPU throttle. 7x100 forecasts and 20 timed actual AI turns per source. Shared host load; not physical Android, FPS or whole-galaxy benchmark.',rows};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
