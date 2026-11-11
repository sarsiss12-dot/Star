'use strict';
const fs=require('fs'),path=require('path');
const out=process.env.STARS_OUTPUT||path.resolve('reports/codex/evidence/beta-ai-quality0'),saves=process.env.AIQ_SAVE_ROOT||'/tmp/aiq0-saves';
const rows=[];
for(const name of fs.readdirSync(path.join(out,'campaigns')).sort()){
 const d=JSON.parse(fs.readFileSync(path.join(out,'campaigns',name))),s=d.summary,rawPath=path.join(saves,name.replace(/\.json$/,'-final.sav'));if(!fs.existsSync(rawPath))throw Error('Missing generated campaign checkpoint: '+rawPath);
 const raw=JSON.parse(fs.readFileSync(rawPath)),ai=d.samples.at(-1).empires,byEmpire={};
 for(const x of d.samples.slice(1))for(const e of x.empires){const row=byEmpire[e.id]||(byEmpire[e.id]={criticalMonths:0,longestCriticalRun:0,run:0,zeroMonths:0,resources:{}}),critical=['ene','min','yiy','ala','tuk'].filter(k=>e.inc[k]<0&&e.res[k]/-e.inc[k]<3);
  if(critical.length&&!e.dead){row.criticalMonths++;row.run++;row.longestCriticalRun=Math.max(row.longestCriticalRun,row.run);}else row.run=0;
  if(critical.some(k=>e.res[k]===0))row.zeroMonths++;
  for(const k of critical)row.resources[k]=(row.resources[k]||0)+1;
 }
 for(const e of ai)Object.assign(byEmpire[e.id],{doctrine:e.doctrine,colonies:e.colonies,techs:e.techs,ships:e.ships,goal:e.strategy?.kind,progress:e.strategy?.progress,stats:e.strategy?.stats});
 const wars=raw.warLedger.fronts.map(f=>({id:f.id,sides:f.sides,born:f.born,ended:f.ended,ending:f.ending,reason:f.reason,metrics:f.metrics}));
 rows.push({summary:s,byEmpire,wars,federations:(raw.world.feds||[]).map(f=>({id:f.id,type:f.type,members:f.members,history:f.history})),commerce:raw.commerce.stats,subjects:raw.emps.filter(e=>e.overlord!==null&&e.overlord!==undefined).map(e=>({id:e.id,lord:e.overlord,anger:e.vassalAnger,contract:e.vassalContract,talk:e.vassalTalk,history:e.vassalTalkHistory})),finalResources:Object.fromEntries(['min','ene','yiy','ala','tuk','etk'].map(k=>[k,ai.reduce((n,e)=>n+e.res[k],0)]))});
}
fs.writeFileSync(path.join(out,'analysis.json'),JSON.stringify(rows,null,2));
for(const r of rows)console.log([r.summary.seed,r.summary.months,r.summary.initialSystems,r.summary.ai,r.summary.criticalEmpireMonths,r.summary.zeroStockMonths,r.summary.finalColonies,r.summary.finalTechs,r.summary.finalShips,r.summary.plansCompleted,r.summary.plansFailed,r.summary.vassals,r.wars.length,r.federations.length,(r.summary.timing.monthTick.ms/r.summary.months).toFixed(1)].join(' | '));
