'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
function summarize(p){const parent=new Map(),nodes=new Map(p.nodes.map(n=>[n.id,n]));for(const n of p.nodes)for(const c of n.children||[])parent.set(c,n.id);
 const self=new Map(),total=new Map(),key=id=>{const c=nodes.get(id).callFrame;return (c.functionName||'(anon)')+' '+c.url.split('/').at(-1)+':'+(c.lineNumber+1);};
 (p.samples||[]).forEach((id,i)=>{const t=p.timeDeltas[i]||0;self.set(key(id),(self.get(key(id))||0)+t);const seen=new Set();for(let n=id;n!==undefined;n=parent.get(n)){const k=key(n);if(!seen.has(k)){seen.add(k);total.set(k,(total.get(k)||0)+t);}}});
 const top=m=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([fn,us])=>({fn,ms:+(us/1000).toFixed(2)}));return {samples:p.samples?.length||0,wallMs:(p.endTime-p.startTime)/1000,self:top(self),inclusive:top(total)};
}
module.exports=async function checkpoint(H,B,out,m){
 const host=await H.evaluate(()=>MP1Host.host.snapshot({}));if(!host.ok)throw Error('checkpoint');
 const guest=await B.evaluate(()=>serialize());fs.writeFileSync(path.join(out,'host-m'+m+'.json'),JSON.stringify(host.pkg));fs.writeFileSync(path.join(out,'guest-m'+m+'.save'),guest);
 if(process.env.MP86_CAPTURE==='1'){console.log('CAPTURE checkpoint '+m);return;}
 const cp=async(page,label,fn)=>{const c=await page.context().newCDPSession(page);await c.send('Emulation.setCPUThrottlingRate',{rate:4});await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:1000});await c.send('Profiler.start');await fn();const {profile}=await c.send('Profiler.stop');fs.writeFileSync(path.join(out,label+'.cpuprofile.gz'),zlib.gzipSync(JSON.stringify(profile)));fs.writeFileSync(path.join(out,label+'-summary.json'),JSON.stringify(summarize(profile),null,2));await c.send('Emulation.setCPUThrottlingRate',{rate:1});await c.detach();};
 await cp(B,'guest-frame-m'+m,()=>B.waitForTimeout(5000));
 await cp(B,'guest-load-m'+m,()=>B.evaluate(s=>{for(let i=0;i<10;i++)if(!deserialize(s))throw Error('load');},guest));
 await cp(H,'host-step-m'+m,()=>H.evaluate(()=>{for(let j=0;j<3;j++){for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}MP1Host.host.publish();}}));
 console.log('PROFILE checkpoint '+m+' captured');
};
