'use strict';
// Isolate the same full-month simulation in real Chromium. No world timer during CPU timing.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{create}=require('../../research/mp1/server/relay');
const root=process.env.CHECKPOINT_DIR||'/tmp/stars-p43',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let br,relay;
(async()=>{relay=create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});const srv=await relay.start(),url='http://127.0.0.1:'+srv.address().port;
 br=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 for(const key of (process.argv.length>2?process.argv.slice(2):['100-9-11-m120','500-16-11-m3','500-16-11-m120'])){
  const txt=fs.readFileSync(path.join(root,key+'.save'),'utf8'),result={key,sha:sha(txt),chrome:br.version(),runs:[]};
  // Independent page for the normal production frame() loop at maximum speed.
  {const ctx=await br.newContext({viewport:{width:844,height:390}}),p=await ctx.newPage();await p.goto(url);await p.waitForFunction(()=>typeof deserialize==='function');
   await p.evaluate(txt=>{if(!deserialize(txt))throw Error('load');enterGame(true);UI.closeModal();UI.setSpeed(0);G.autoSave=false;
    for(let i=0;i<56;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}
    const f=window.monthTick;window.live={months:[],frames:[],long:[],on:false};
    window.monthTick=function(){const t=performance.now();try{return f.apply(this,arguments);}finally{if(live.on)live.months.push(performance.now()-t);}};
    const raf=t=>{if(live.on&&live.last)live.frames.push(t-live.last);live.last=t;requestAnimationFrame(raf);};requestAnimationFrame(raf);
    new PerformanceObserver(l=>{if(live.on)for(const x of l.getEntries())live.long.push(x.duration);}).observe({entryTypes:['longtask']});},txt);
   await p.waitForTimeout(1200);await p.evaluate(()=>{live.on=true;live.startDay=G.day;UI.setSpeed(4);});const t=Date.now();
   while(Date.now()-t<18000){await p.waitForTimeout(400);if(await p.evaluate(()=>{if(!$('modal').classList.contains('hidden'))UI.closeModal();if(G.speed!==4)UI.setSpeed(4);return live.months.length>=3||G.over;}))break;}
   result.live=await p.evaluate(()=>{live.on=false;return {...live,endDay:G.day,heap:performance.memory.usedJSHeapSize};});await ctx.close();}
  for(const arm of ['base','pilot','pilot','base']){
   const ctx=await br.newContext({viewport:{width:844,height:390}}),p=await ctx.newPage();await p.goto(url);await p.waitForFunction(()=>typeof deserialize==='function');
   await p.evaluate(({txt,arm})=>{if(!deserialize(txt))throw Error('load');G.autoSave=false;G.speed=0;
    window.oneMonth=()=>{const before=Math.floor(G.day/30);while(!G.over&&Math.floor(G.day/30)===before){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>before)monthTick();}};
    if(arm==='pilot'){window.auditOwned=null;const old=window.influenceAt.toString(),s=old.replace('of G.sys','of (window.auditOwned||G.sys)');if(s===old)throw Error('influence anchor');window.influenceAt=(0,eval)('('+s+')');
     for(const k of ['explorationContext','reinforcementThreats']){const fn=window[k];window[k]=function(...a){if(window.auditOwned)return fn.apply(this,a);window.auditOwned=G.sys.filter(s=>s.owner>=0&&s._reach);try{return fn.apply(this,a);}finally{window.auditOwned=null;}};}}
    oneMonth();},{txt,arm});
   const rows=[];for(let i=0;i<10;i++){const x=await p.evaluate(()=>{const t=performance.now();oneMonth();const ms=performance.now()-t;return {ms,day:G.day,rng:RND_STATE,s:serialize()};});rows.push({ms:x.ms,day:x.day,rng:x.rng,sha:sha(x.s)});}
   result.runs.push({arm,rows});await ctx.close();}
  result.equal=result.runs.every(r=>r.rows.every((x,i)=>x.sha===result.runs[0].rows[i].sha&&x.rng===result.runs[0].rows[i].rng&&x.day===result.runs[0].rows[i].day));
  fs.writeFileSync(path.join(__dirname,'raw','chromium-'+key+'.json'),JSON.stringify(result));console.log(key,result.equal);assert(result.equal);}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await br?.close();relay?.shutdown();});
