// node rota.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE · CAMP_AI]
// FED-AI-SİYASET.0 Faz E1: jointSelect "Ulaşılabilir ikmalli toplanma noktası veya açık askerî rota yok" reddinin alt nedeni.
// Her ret için her (filo × toplanma adayı) çifti tek alt nedene ayrılır: toplanma-bilinmiyor / toplanma-ikmal-yok / toplanma-tehdit /
// toplanma-rota-yok / toplanma>180g / yuruyus-rota-yok / yuruyus>180g / hedefte-ikmal<=0.4 / gecer. Dünyaya yazmaz (fedFoundRead içinde salt), RNG çekmez.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;
var R={rejects:0,pairs:{},cases:[]};const inc=(o,k)=>o[k]=(o[k]||0)+1;
{const f=jointSelect;jointSelect=function(ctx,kind,target,anchor,cache,replacing){const r=f.apply(this,arguments);
 if(!r.ok&&/toplanma noktası/.test(r.why||''))fedFoundRead(()=>{R.rejects++;const ts=G.sys[target];const cs={};
  const force=[];for(const id of ctx.members){const e=G.emps[id];if(e.ai&&jointTargetOK(e,kind,target,ctx.enemy))force.push(...jointAvailable(e,replacing).fleets);}
  const rallies=new Map();if(kind!=='capture')rallies.set(target,ts);
  for(const id of ctx.members){const e=G.emps[id];for(const s of aiKnownSystems(e).filter(s=>{const k=aiKnownSystem(e,s);return k.owner>=0&&ctx.members.includes(k.owner)&&isSupplyNode(e,s)&&canEnter(e,s)&&!aiObservedThreat(e,s.id);}).sort((a,b)=>dist(a,ts)-dist(b,ts)||a.id-b.id).slice(0,3))rallies.set(s.id,s);}
  const cands=[...rallies.values()].sort((a,b)=>(a.id===target?-1:b.id===target?1:dist(a,ts)-dist(b,ts))||a.id-b.id).slice(0,6);const c2=new Map();
  if(!cands.length)inc(cs,'toplanma-adayi-yok');
  for(const rally of cands)for(const fl of force){const e=G.emps[fl.e],k=aiKnownSystem(e,rally);let why;
   if(!k||k.owner<0||!ctx.members.includes(k.owner))why='toplanma-bilinmiyor';else if(!isSupplyNode(e,rally)||!canEnter(e,rally))why='toplanma-ikmal-yok';else if(aiObservedThreat(e,rally.id)>0)why='toplanma-tehdit';
   else{const g=jointRoute(e,fl,rally.id,c2),pr={...fl,sys:rally.id,mv:null},m=jointRoute(e,pr,target,c2);
    why=!g?'toplanma-rota-yok':g.eta>180?'toplanma>180g':!m?'yuruyus-rota-yok':m.eta>180?'yuruyus>180g':fleetSupply(e,{...pr,sys:target})<=.4?'hedefte-ikmal<=0.4':'gecer';}
   inc(cs,why);inc(R.pairs,why);}
  if(R.cases.length<12)R.cases.push({d:Math.floor(G.day),kind,target,members:ctx.members,force:force.length,rallies:cands.length,cs});});
 return r;};}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);
for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run('JSON.stringify(R)'));fs.writeFileSync(out,JSON.stringify(r));console.log(path.basename(out),JSON.stringify(r).slice(0,1500));
