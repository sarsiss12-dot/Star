'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const root=require('./helpers/beta-stability0-control.cjs').root();
const out=process.env.STARS_OUTPUT||'/tmp/stability-ai';fs.mkdirSync(out,{recursive:true});
const prepare=require('./helpers/beta-er0-fixture.cjs').prepare;
const step='for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}';
const a=runtime({root});a.run('setupGame({...CFG,seed:23,size:"orta",aiCount:8});G.autoSave=false;');a.run('('+prepare.toString()+')(3)');a.run('G.emps[3].res.tuk=5000;');
// Reuse the p21 proven source path; retain the real event and its -12 outcome.
a.run(`var shocks=[],survey0=doSurvey;doSurvey=function(f,s){const e=empOf(f),b=e.colonies.map(c=>G.sys[c.s].planets[c.p].col.stab),min=e.res.min,r=survey0.apply(this,arguments);if(e.id===3&&e.res.min-min===520&&e.colonies.every((c,i)=>G.sys[c.s].planets[c.p].col.stab===b[i]-12))shocks.push({day:G.day,system:s.id,actor:3,min:520,stability:-12});return r;};`);
for(let m=0;m<4;m++)a.run(step);const shock=JSON.parse(a.run('JSON.stringify(shocks)'));assert(shock.some(s=>s.system===35&&s.day===1007));
const start=a.run('serialize()'),rows=[];
for(const mode of ['off','p21','candidate']){
 const h=runtime(mode==='p21'||mode==='off'?{root}:{});h.sb.start=start;assert(h.run('deserialize(start)'));
 if(mode==='off')h.run('aiInternalCrisis=function(){};');
 h.run(`var policies=[],apply0=applyInternalPolicy;applyInternalPolicy=function(e,s,p,k,stamp){const b={...e.res},r=apply0.apply(this,arguments);if(e.id===3&&r.ok)policies.push({day:G.day,system:s.id,kind:k,paid:Object.fromEntries(Object.keys(e.res).filter(k=>e.res[k]!==b[k]).map(k=>[k,b[k]-e.res[k]])),stab:p.col.stab,counter:p.col.secede||0});return r;};`);
 const samples=[],t=Date.now();
 for(let month=0;month<=24;month++){
  samples.push({month,...JSON.parse(h.run(`JSON.stringify({day:G.day,rng:RND_STATE,schism:G.emps[3].schism||0,resources:G.emps[3].res,crisis:G.emps[3].crisis,shortage:!!G.emps[3].shortage,colonies:G.emps[3].colonies.map(c=>({s:c.s,p:c.p,owner:G.sys[c.s].planets[c.p].owner,stab:G.sys[c.s].planets[c.p].col.stab,target:colonyStabilityTarget(G.emps[3],G.sys[c.s],G.sys[c.s].planets[c.p]),counter:G.sys[c.s].planets[c.p].col.secede||0,policy:G.sys[c.s].planets[c.p].col.crisisPolicy?.kind||null}))})`))});
  if(month<24)h.run(step);
 }
 rows.push({mode,allAIActive:true,months:24,ms:Date.now()-t,samples,policies:JSON.parse(h.run('JSON.stringify(policies)'))});
 console.log('PASS measured '+mode+' all-AI 24 months; final colonies '+samples.at(-1).colonies.length+' / policies '+rows.at(-1).policies.length);
}
// Positive and negative decisions are checked independently from noisy campaigns.
for(const poor of [false,true]){const h=runtime();h.run('setupGame({...CFG,seed:23,size:"orta",aiCount:8});');h.run('('+prepare.toString()+')(3)');h.run(`var e=G.emps[3];for(const k in e.res)e.res[k]=${poor?0:100000};for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(c.s!==e.home){p.col.stab=20;p.col.secede=24;}}var before=serialize(),rng=RND_STATE;aiInternalCrisis(e);var policies=e.colonies.filter(c=>G.sys[c.s].planets[c.p].col.crisisPolicy);`);assert.equal(h.run('policies.length'),poor?0:1);assert(h.run('RND_STATE===rng'));if(poor)assert(h.run('serialize()===before'));}
fs.writeFileSync(path.join(out,'quality.json'),JSON.stringify({control:'838f2c392b2cffa9198b88388d1f905e5c744604',checkpointSha256:require('crypto').createHash('sha256').update(start).digest('hex'),shock,rows,positive:true,negative:true,aiCrisisRulesChanged:false},null,2));
console.log('PASS positive / insufficient budget negative; original ruins event unchanged');
