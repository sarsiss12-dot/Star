'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const [control,candidate,size,aiCount,seed,months,output]=process.argv.slice(2);
const hash=raw=>createHash('sha256').update(raw).digest('hex');
function start(root){
 const game=runtime({root:path.resolve(root)});
 game.sb.config={size,aiCount:Number(aiCount),seed:Number(seed)};
 game.run(`
  resetSetupNaming();Object.assign(CFG,config);setupGame({...CFG});G.autoSave=false;
  var observations=[];
  function step(){
   G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);
   if(G.day%30===0)monthTick();
  }
  const move=aiMove;
  aiMove=function(e,f,to){
   const s=G.sys[to],prize=!!(s&&(s.nest||s.ruin)&&!s.seen.includes(e.id));
   const old=f.path.slice(),result=move.apply(this,arguments);
   if(result&&old.toString()!==f.path.toString())observations.push({
    kind:prize?'new-visible-prize':'move',day:G.day,by:e.id,fleet:f.id,from:f.sys,to,
    route:f.path.slice(),power:fleetPower(f),guard:prize?s.nest?.hp||s.ruin?.hp:null});
   return result;
  };
  const fed=aiFedWilling;
  aiFedWilling=function(e,o,type,f){
   const result=fed.apply(this,arguments);
   if(e?.ai&&f?.id&&result.why?.includes('doktrinle uyumsuz'))
    observations.push({kind:'incompatible-membership',day:G.day,by:e.id,fed:f.id});
   return result;
  };
  for(const name of ['proposeFedMotion','leaveFederation']){
   const before=globalThis[name];
   globalThis[name]=function(e,...args){
    const f=findFed(e),result=before.apply(this,arguments);
    if(f&&result.ok&&(name==='leaveFederation'||args[0]==='reform'))observations.push({
      kind:name,day:G.day,by:e.id,fed:f.id,type:f.type,arguments:args});
    return result;
   };
  }
 `);
 return game;
}
const arms=[start(control),start(candidate)];
const read=()=>arms.map(g=>g.run('serialize()'));
function days(count){for(const g of arms)g.run(`for(let i=0;i<${count};i++)step()`);}
let same=read(),first=null,hashes=[];
if(same[0]!==same[1])throw Error('Başlangıç Save8 aynı değil');
for(let m=1;m<=Number(months);m++){
 days(60);
 const saves=read();
 hashes.push(saves.map(hash));
 if(saves[0]!==saves[1]){
  // Restore the last common monthly state on both engines. If loading the state
  // normalizes a transient difference, the monthly divergence is still retained.
  for(const [i,g] of arms.entries()){
   g.sb.input=same[i];
   if(!g.run('deserialize(input)'))throw Error('Ortak başlangıç açılamadı');
  }
  for(let i=1;i<=60;i++){
   for(const g of arms)g.run('observations=[]');
   days(1);
   const [a,b]=read();
   if(a===b)continue;
   const [x,y]=[a,b].map(JSON.parse);
   first={month:m,day:y.day,save:[hash(a),hash(b)],rng:[x.rs,y.rs],
    sections:Object.keys(y).filter(k=>JSON.stringify(x[k])!==JSON.stringify(y[k])),
    decisions:arms.map(g=>JSON.parse(g.run('JSON.stringify(observations)')))};
   break;
  }
  break;
 }
 same=saves;
}
const result={size,aiCount:Number(aiCount),seed:Number(seed),checkedMonths:hashes.length,hashes,first};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({size,seed,months:hashes.length,first}));
