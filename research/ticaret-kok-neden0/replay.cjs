'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),crypto=require('node:crypto');
const [file,out,id1,id2]=process.argv.slice(2),input=fs.readFileSync(file,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const data={input:sha(input),worlds:{}};
for(const arm of ['H0','holdPair','placebo']){
 const h=runtime();Object.assign(h.sb,{input,arm,ids:[Number(id1),Number(id2)]});
 h.run(`
 if(!deserialize(input))throw Error('Save8');G.autoSave=false;
 const runs=[],decisions=[],oldExecute=executeDeal,oldFinish=Commerce.finish;
 const party=o=>ids.includes(o.from)&&ids.includes(o.to);
 executeDeal=function(o){
  const freight=(o.give||[]).concat(o.want||[]).some(i=>i.t==='freight');
  if(freight&&party(o)&&arm==='holdPair'){decisions.push([G.day,'withheld',o.from,o.to]);return false;}
  const r=oldExecute.apply(this,arguments);
  if(freight&&party(o)&&r)decisions.push([G.day,'signed',o.from,o.to]);
  return r;
 };
 Commerce.finish=function(v,kind,reason){
  const r=oldFinish.apply(this,arguments);
  if(r&&party({from:v.e,to:v.to}))decisions.push([G.day,kind,v.e,v.to,v.r,v.delivered,v.lost]);
  return r;
 };
 function month(i){
  if(i===0&&arm==='placebo')rnd();
  const m=Math.floor(G.day/30);
  do{G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}while(Math.floor(G.day/30)===m);
  monthTick();
  runs.push({day:G.day,rng:RND_STATE,states:ids.map(id=>{
   const e=G.emps[id];return {id,col:e.colonies.length,ships:G.fleets.filter(f=>f.e===id).reduce((n,f)=>n+f.ships.length,0),tech:Object.keys(e.techs||{}).length,
    crisis:e.crisis||null,stock:{...e.res},net:{...e.inc}};})});
 }`);
 const initial=h.run('serialize()');const months=[];
 for(let i=0;i<18&&!h.run('G.over');i++){
  h.run('month('+i+')');months.push(sha(h.run('serialize()')));
 }
 data.worlds[arm]={initial:sha(initial),months,...JSON.parse(h.run('JSON.stringify({runs,decisions})'))};
}
for(const arm of ['holdPair','placebo']){
 const a=data.worlds.H0,b=data.worlds[arm];
 const m=a.months.findIndex((x,i)=>x!==b.months[i]),rng=a.runs.findIndex((x,i)=>x.rng!==b.runs[i]?.rng);
 data.worlds[arm].firstChanges={save:m>=0?a.runs[m].day:null,rng:rng>=0?a.runs[rng].day:null};
}
fs.writeFileSync(out,JSON.stringify(data)+'\n');
