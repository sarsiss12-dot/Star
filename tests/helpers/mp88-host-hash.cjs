'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports=async(H,B,out,meta)=>{
 assert(['raw','settled'].includes(meta.mode));
 await H.evaluate(()=>{
  window.__hash88={writes:[]};
  const fields=['_powAt','_powC','_pressAt','_press'];
  const cache=()=>G.emps.map(e=>Object.fromEntries(fields.filter(k=>Object.hasOwn(e,k)).map(k=>[k,e[k]])));
  for(const k of ['totalPower','borderPressure','tradeInfo']){const f=window[k];window[k]=function(...args){if(__hash88.writes.length>=1000)return f.apply(this,args);const before=JSON.stringify(cache());try{return f.apply(this,args);}finally{const after=JSON.stringify(cache());if(before!==after&&__hash88.writes.length<1000)__hash88.writes.push({fn:k,day:G.day,before:JSON.parse(before),after:JSON.parse(after),stack:new Error().stack});}};}
 });
 const rows=[];
 for(let i=0;i<8;i++){
  const start=performance.now();
  const h=await H.evaluate(mode=>{const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();
   MP1Host.host.publish();if(mode==='settled'){UI.keepScroll=true;UI.refresh();}return {day:G.day,save:serialize(),rng:RND_STATE};},meta.mode);
  await B.waitForFunction(d=>G.day===d&&!MP6Stars.S.building,h.day,{timeout:15000,polling:50});
  const mirror=await B.evaluate(()=>JSON.stringify(MP6Stars.S.mirror));rows.push({step:i+1,...h,sha:sha(h.save),mirror,mirrorSha:sha(mirror)});
  await B.waitForTimeout(Math.max(0,900-(performance.now()-start)));
 }
 const writes=await H.evaluate(()=>__hash88.writes);
 fs.writeFileSync(path.join(out,'host-hash88.json.gz'),zlib.gzipSync(JSON.stringify({meta,rows,writes})));
 const summary={mode:meta.mode,steps:rows.map(({save,mirror,...r})=>r),writes:writes.length};fs.writeFileSync(path.join(out,'host-hash88-summary.json'),JSON.stringify(summary,null,2));console.log('HASH88 '+meta.mode+' samples='+rows.length);return summary;
};
