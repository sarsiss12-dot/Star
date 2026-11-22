'use strict';
const fs=require('node:fs'),path=require('node:path');
const {runtime}=require('../../tests/helpers/runtime');
const [root,file,out]=process.argv.slice(2);
const h=runtime({root:path.resolve(root),processGlobal:true});
h.sb.input=fs.readFileSync(file,'utf8');h.sb.now=()=>Number(process.hrtime.bigint())/1e6;
h.run(`
 var metrics={};
 for(const k of ['route','freightPlan','aiPartnerOffers','aiPortInvestment','aiTransitRequest','aiPorts','aiTerms','aiOpportunityTick','aiRouteSignature','remainingRoute']){
  if(!Commerce[k])continue;const f=Commerce[k],row=metrics[k]={calls:0,ms:0};
  Commerce[k]=function(...args){const t=now();try{return f.apply(this,args);}finally{row.ms+=now()-t;row.calls++;}};
 }
 function replay(){
  if(!deserialize(input))throw Error('Save8');G.autoSave=false;
  for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}monthTick();
 }
 replay();for(const row of Object.values(metrics)){row.calls=0;row.ms=0;}
 for(let i=0;i<4;i++)replay();
`);
fs.writeFileSync(out,JSON.stringify(JSON.parse(h.run('JSON.stringify(metrics)')),null,2)+'\n');
