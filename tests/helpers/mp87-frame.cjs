'use strict';
// Opt-in local relay benchmark, reuses browser-mp75-perf's real lobby/TLS/mobile setup.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),zlib=require('zlib');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const stat=a=>{assert(a.length,'zero samples');const s=[...a].sort((a,b)=>a-b);return {n:s.length,med:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1)};};
module.exports=async(H,B,out)=>{
 const input=process.env.MP87_SAVE||'reports/codex/evidence/mp86/capture-host-m120.save',save=fs.readFileSync(input,'utf8');
 const cosmetic=JSON.parse(fs.readFileSync('reports/codex/evidence/mp86/capture-guest-m120.save','utf8')).seed;
 const context=await H.evaluate(({save,cosmetic})=>{MP1Host.host.local({kind:'speed',value:0});if(!deserialize(save))throw Error('checkpoint load');G.speed=0;G.autoSave=false;UI.closeModal();
  const orig=StarsMirror.build;StarsMirror.build=function(e,o){return orig(e,{...o,cosmeticSeed:cosmetic});};
  MP1Host.host.publish();return {day:G.day,over:!!G.over,seed:G.seed,systems:G.sys.length,states:G.emps.filter(e=>!e.wild).length,guestWasAI:G.emps[1].ai,alive:G.emps.filter(e=>!e.wild&&!e.dead).length};},{save,cosmetic});
 assert(!context.over,'active fixture required');
 // Archived SP worlds may be inspected through actor 1, but never simulated or converted to human.
 const frozen=process.env.MP87_FROZEN==='1';if(context.guestWasAI)assert(frozen,'AI archive must be read-only');
 await B.evaluate(()=>{UI.closeModal();MP1Join.sendRaw({v:1,type:'resync'});});
 await B.waitForFunction(d=>G.day===d&&MP6Stars.S.started&&!MP6Stars.S.building,context.day,{timeout:30000});
 await B.evaluate(()=>{UI.closeModal();View.fit();View.sel=G.fleets.find(f=>f.e===0)||null;UI.openDiplo();});
 const sessions=[];for(const p of [H,B]){const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});sessions.push(c);}
 if(process.env.MP88_HASH){try{return await require('./mp88-host-hash.cjs')(H,B,out,{input,cosmetic,context,mode:process.env.MP88_HASH});}finally{for(const c of sessions)await c.detach();}}
 await B.evaluate(()=>{
  const T=window.__frame87={active:false,draw:[],refresh:[],deserialize:[],tick:[],sprites:[],worldImage:[],borders:[],fleetLabels:[],frames:[],long:[],samples:[],events:[],inputs:[],last:null,pending:null,input:null};
  const wrap=(o,k,a)=>{const f=o[k];o[k]=function(...args){const t=performance.now();try{return f.apply(this,args);}finally{if(T.active)T[a].push(performance.now()-t);}};};
  wrap(window,'deserialize','deserialize');for(const [k,a] of [['refresh','refresh'],['tick','tick'],['paintSprites','sprites']])wrap(UI,k,a);
  for(const [k,a] of [['drawWorldImage','worldImage'],['buildBorders','borders'],['drawFleetOwnerLabels','fleetLabels']])wrap(View,k,a);
  const orig=MP6Stars.onMessage;MP6Stars.onMessage=function(m){if(T.active&&['mirror','mirrorDelta'].includes(m.type)){T.pending={at:performance.now(),type:m.type,builds:MP6Stars.S.stats.builds,day:m.full?.day};T.events.push({type:m.type,at:T.pending.at});}return orig.apply(this,arguments);};
  const d=View.draw;View.draw=function(...args){const t=performance.now();try{return d.apply(this,args);}finally{if(T.active){const end=performance.now();T.draw.push(end-t);if(T.pending&&MP6Stars.S.stats.builds>T.pending.builds&&!MP6Stars.S.building){T.samples.push({type:T.pending.type,receiveToDraw:end-T.pending.at,day:G.day,build:MP6Stars.S.stats.buildMs.at(-1),gap:MP6Stars.S.minGap});T.pending=null;}if(T.input){T.inputs.push(end-T.input);T.input=null;}}}};
  document.addEventListener('pointerdown',e=>{if(T.active&&e.target.closest('#diploPane [data-a="diploFilter"][data-x="all"]'))T.input=performance.now();},true);
  new PerformanceObserver(l=>{if(T.active)for(const e of l.getEntries())T.long.push(e.duration);}).observe({type:'longtask'});
  const raf=t=>{if(T.active){if(T.last!==null)T.frames.push(t-T.last);T.last=t;}requestAnimationFrame(raf);};requestAnimationFrame(raf);
 });
 await B.waitForTimeout(1800);
 await B.evaluate(()=>{const T=__frame87;T.active=true;T.start=performance.now();T.selection=View.sel?.id??null;});
 const nodeTimes=[],hostHashes=[];
 for(let i=0;i<18;i++){
  const count=await B.evaluate(()=>__frame87.samples.length),t=performance.now();
  const h=await H.evaluate(({frozen})=>{if(!frozen){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}
   MP1Host.host.publish();return {day:G.day,save:serialize(),rng:RND_STATE};},{frozen});hostHashes.push({sha:hash(h.save),rng:h.rng});
  if(frozen)await B.evaluate(()=>MP1Join.sendRaw({v:1,type:'resync'}));
  await B.waitForFunction(({count,day})=>__frame87.samples.length>count&&G.day===day,{count,day:h.day},{timeout:15000,polling:50});nodeTimes.push(performance.now()-t);
  if(i%3===0){const point=await B.evaluate(()=>{for(const el of document.querySelectorAll('#diploPane [data-a="diploFilter"][data-x="all"]')){const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(r.width&&r.height&&x>0&&x<innerWidth&&y>0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y)))return {x,y};}throw Error('no exposed diplomacy target');});
   await sessions[1].send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await sessions[1].send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  if(i%6===5)console.log('FRAME87 step '+(i+1));
  await B.waitForTimeout(Math.max(0,900-(performance.now()-t)));
 }
 const raw=await B.evaluate(()=>{const T=__frame87;T.active=false;return {...T,windowMs:performance.now()-T.start,day:G.day,rng:RND_STATE,mirror:JSON.stringify(MP6Stars.S.mirror),serialized:serialize(),selected:View.sel?.id??null,paneOpen:document.getElementById('diploPane').classList.contains('show'),fail:MP6Stars.S.stats.fail||0};});
 assert.equal(raw.fail,0);assert.equal(raw.samples.length,18);assert.equal(raw.inputs.length,6,'six actual pointer-to-draw samples');assert.equal(raw.selected,raw.selection);assert(raw.paneOpen,'panel must remain open');
 const mirrorSha=hash(raw.mirror),saveSha=hash(raw.serialized);delete raw.mirror;delete raw.serialized;
 const result={arm:process.env.MP87_CONTROL?'mp85':'mp86',input,sourceSha:hash(save),cosmetic,context,frozen,cpu:4,viewport:[800,360],raw,hostHashes,mirrorSha,saveSha,nodeTimes,
  summary:Object.fromEntries(['draw','refresh','deserialize','tick','sprites','worldImage','borders','fleetLabels','frames','inputs'].map(k=>[k,stat(raw[k])])),receiveToDraw:stat(raw.samples.map(s=>s.receiveToDraw)),nodeToDraw:stat(nodeTimes),longtask:{n:raw.long.length,...(raw.long.length?stat(raw.long):{})},rafPerSec:raw.frames.length*1000/raw.windowMs};
 if(process.env.MP87_TRACE==='1'){
  const c=await B.context().newCDPSession(B);await c.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,blink,cc',transferMode:'ReturnAsStream'});
  await B.waitForTimeout(5000);const done=new Promise(resolve=>c.once('Tracing.tracingComplete',resolve));await c.send('Tracing.end');const {stream}=await done;const chunks=[];
  for(;;){const r=await c.send('IO.read',{handle:stream});chunks.push(Buffer.from(r.data,r.base64Encoded?'base64':'utf8'));if(r.eof)break;}await c.send('IO.close',{handle:stream});
  const trace=Buffer.concat(chunks);fs.writeFileSync(path.join(out,'frame-trace.json.gz'),zlib.gzipSync(trace));
  const events=JSON.parse(trace).traceEvents,groups={};for(const e of events)if(e.ph==='X'&&e.dur){const k=e.name;const a=groups[k]||(groups[k]=[]);a.push(e.dur/1000);}
  result.trace=Object.entries(groups).map(([name,a])=>({name,totalMs:a.reduce((x,y)=>x+y,0),...stat(a)})).sort((a,b)=>b.totalMs-a.totalMs).slice(0,60);await c.detach();
 }
 for(const c of sessions)await c.detach();
 fs.writeFileSync(path.join(out,'frame87.json'),JSON.stringify(result,null,2));console.log('FRAME87 '+JSON.stringify({arm:result.arm,context,summary:result.summary,receiveToDraw:result.receiveToDraw,rafPerSec:result.rafPerSec}));return {arm:result.arm,context,receiveToDraw:result.receiveToDraw,rafPerSec:result.rafPerSec};
};
