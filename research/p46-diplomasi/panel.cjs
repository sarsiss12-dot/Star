'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const save=fs.readFileSync(process.argv[2],'utf8'),root=path.resolve(__dirname,'../..');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 try{
  await p.route('http://stars.test/**',async route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html';
   if(!/^[a-z0-9.-]+$/.test(name)||!fs.existsSync(path.join(root,name)))return route.abort();
   await route.fulfill({path:path.join(root,name)});
  });
  await p.goto('http://stars.test/');await p.evaluate(s=>{
   if(!deserialize(s))throw Error('Save8');$('title').classList.add('hidden');enterGame(true);
   UI.closeModal();UI.setSpeed(0);G.autoSave=false;
   window.obs=[];document.addEventListener('click',ev=>{const a=ev.target.closest('[data-a]')?.dataset.a;
    if(!['diploPane','diploPick'].includes(a))return;const t=performance.now();
    requestAnimationFrame(()=>requestAnimationFrame(()=>obs.push({a,ms:performance.now()-t})));
   },true);
  },save);
  if(process.argv[3]==='frames'){
   const result=await p.evaluate(async()=>{
    // Gerçek frame döngüsü ve hız kademesi 4. Bildirim duraklatmaları ayrıca kaydedilir.
    const start=G.day, frames=[], pauses=[];UI.setSpeed(4);
    let last=await new Promise(r=>requestAnimationFrame(r)),limit=last+60000;
    while(G.day<start+31 && last<limit && !G.over){
     const t=await new Promise(r=>requestAnimationFrame(r));frames.push([G.day,t-last]);last=t;
     if(!G.speed){pauses.push(G.day);break;}
    }
    UI.setSpeed(0);
    for(let i=0;i<3;i++){const t=await new Promise(r=>requestAnimationFrame(r));frames.push([G.day,t-last]);last=t;}
    return {start,end:G.day,frames,pauses};
   });
   fs.writeFileSync(path.join(__dirname,'raw','frames.json'),JSON.stringify(result));return;
  }
  const hit=async sel=>{await p.locator(sel).first().tap();};
  for(let i=0;i<13;i++){
   await hit('[data-a="grpTog"][data-x="emp"]');await hit('#outEmp [data-a="diploPane"]');
   if(!(await p.locator('[data-a="diploPick"]').count()))await hit('[data-a="diploNav"][data-x="states"]');
   await hit('[data-a="diploPick"]');await p.waitForFunction(n=>obs.length>=n,2*(i+1));await hit('[data-a="closeDiplo"]');
  }
  const result=await p.evaluate(async()=>{
   const intervals=[],ticks=[],full=[];
   let old=await new Promise(r=>requestAnimationFrame(r));
   for(let i=0;i<121;i++){
    const t=await new Promise(r=>requestAnimationFrame(r));intervals.push(t-old);old=t;
   }
   for(let k=0;k<7;k++){
    const t0=performance.now();for(let i=0;i<60;i++){
     const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
     if(Math.floor(G.day/30)>m){const t=performance.now();monthTick();ticks.push(performance.now()-t);}
    }full.push(performance.now()-t0);await new Promise(r=>requestAnimationFrame(r));
   }
   return {day:G.day,clicks:obs.slice(2),stationaryMap:intervals.slice(1),monthTick:ticks.slice(1),fullMonth:full.slice(1)};
  });
  result.browser=b.version();result.input=require('node:crypto').createHash('sha256').update(save).digest('hex');
  fs.writeFileSync(path.join(__dirname,'raw','panel.json'),JSON.stringify(result,null,1));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
