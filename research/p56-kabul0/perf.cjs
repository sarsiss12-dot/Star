'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [control,candidate,output,...files]=process.argv.slice(2);
const count=Number(process.env.SAMPLES||8);
if(!Number.isInteger(count)||count<2||count%2)throw Error('SAMPLES çift sayı olmalı');
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const now=()=>Number(process.hrtime.bigint())/1e6;
const cpu=()=>{const t=process.cpuUsage();return (t.user+t.system)/1000;};
function engine(root){
 const h=runtime({root:path.resolve(root)});
 h.sb.realClock=now;h.sb.cpuClock=cpu;
 h.run(`
 var totals={},reforms=[],reform=null;
 function month(){
  G.autoSave=false;G.speed=0;const m=Math.floor(G.day/30);
  do{G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);}while(Math.floor(G.day/30)===m);
  monthTick();
 }
 function profile(){
  for(const name of ['aiFedMismatch','aiFedStayReview','aiFedMemberReform','proposeFedMotion','dealTxBegin','jointTick']){
   const f=globalThis[name];if(typeof f!=='function')continue;
   globalThis[name]=function(...args){
    const old=reform;
    if(name==='proposeFedMotion'&&args[1]==='reform'){
     const [e,,params]=args;reform={by:e.id,at:G.day,fed:findFed(e)?.id,type:params.type,copies:[]};reforms.push(reform);
    }
    const start=realClock(),startCpu=cpuClock();let result;
    try{return result=f.apply(this,args);}finally{
     const elapsed=realClock()-start,cpuMs=cpuClock()-startCpu,group=(totals[name]||={n:0,ms:0,cpuMs:0});group.n++;group.ms+=elapsed;group.cpuMs+=cpuMs;
     if(name==='dealTxBegin'&&reform)reform.copies.push({ms:elapsed,cpuMs});
     if(name==='proposeFedMotion'&&reform!==old){reform.ms=elapsed;reform.cpuMs=cpuMs;reform.ok=!!result?.ok;reform=old;}
    }
   };
  }
 }
 `);return h;
}
function sample(h,raw){
 h.sb.input=raw; assert(h.run('deserialize(input)'));
 const rngBefore=h.run('RND_STATE');
 const start=now(),cpuStart=cpu();h.run('month()');
 const cpuMs=cpu()-cpuStart,ms=now()-start;
 return {ms,cpuMs,rngBefore,rngAfter:h.run('RND_STATE'),save:sha(h.run('serialize()'))};
}
function stat(a){
 const x=a.slice().sort((a,b)=>a-b),q=f=>{const j=(x.length-1)*f,i=Math.floor(j);return x[i]+(j-i)*(x[Math.ceil(j)]-x[i]);};
 return {mean:x.reduce((n,v)=>n+v,0)/x.length,median:q(.5),p95:q(.95)};
}
function pair(left,right,raw){
 const engines=[engine(left),engine(right)],arms=[[],[]];
 for(const h of engines)sample(h,raw);
 for(let n=0;n<count/2;n++)for(const arm of (n%2?[1,0,0,1]:[0,1,1,0]))arms[arm].push(sample(engines[arm],raw));
 for(const rows of arms)assert(rows.every(x=>x.save===rows[0].save&&x.rngAfter===rows[0].rngAfter),'Aynı kol yeniden oynatmada farklı');
 const delta={};
 for(const k of ['ms','cpuMs']){
  const [a,b]=arms.map(rows=>stat(rows.map(x=>x[k])));
  delta[k]={a,b,percent:Object.fromEntries(Object.keys(a).map(m=>[m,100*(b[m]/a[m]-1)]))};
 }
 return {arms,delta};
}
function instrument(root,raw){
 const h=engine(root);h.run('profile()');
 // Warm up from the identical input, then record method calls in a separate replay.
 sample(h,raw);h.run('totals={};reforms=[]');
 return {...sample(h,raw),...JSON.parse(h.run('JSON.stringify({totals,reforms})'))};
}
const results={};
for(const file of files){
 const raw=fs.readFileSync(file,'utf8'),by=engine(candidate);
 by.sb.input=raw;assert(by.run('deserialize(input)'));by.run('month()');const post=by.run('serialize()');
 const input=[['migration',raw],['steady',post]];
 for(const [label,text] of input){
  const key=path.basename(file)+':'+label;
  const profiles=[instrument(control,text),instrument(candidate,text)];
  if(process.env.PROFILE_ONLY==='1'){results[key]={input:sha(text),profiles};}
  else{
   const ab=pair(control,candidate,text);
   for(const i of [0,1])assert.equal(profiles[i].save,ab.arms[i][0].save,'Profil oyunu değiştirdi');
   results[key]={input:sha(text),profiles,ab,...(label==='steady'?{aa:pair(control,control,text)}:{})};
  }
  fs.writeFileSync(output,JSON.stringify(results,null,2)+'\n');
  console.log(key,JSON.stringify({cpu:results[key].ab?.delta.cpuMs.percent,reforms:profiles.map(r=>r.reforms.length)}));
 }
}
