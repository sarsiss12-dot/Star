'use strict';
// SAHA-GÜVENCE.1 B3 — fetih sonrası ordu korunması (PR #64) AI dengesine etkisi. node army.cjs <kök> <tohum> <ay> <plasebo 0|1> <çıkış.json>
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,seed,months,placebo,out]=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:"ulu",aiCount:9},${process.env.ARMY_CFG||"{}"});setupGame({...CFG});G.autoSave=false;${+placebo?'rnd();':''}
var M={caps:[],armyCaps:{},garr:[],fallTypes:{},months:[]};
var __cs=captureSystem;captureSystem=function(sys,att){const e=G.emps[att];if(e&&e.ai&&!e.wild&&!e.crisisSide){const armies=G.fleets.filter(f=>f.e===att&&f.sys===sys.id&&isTransport(f));
  M.caps.push({d:Math.floor(G.day),sys:sys.id,att,from:sys.owner,armies:armies.map(f=>f.id),ord:armies.reduce((n,f)=>n+f.ships.filter(s=>s.c==='ord').length,0)});
  for(const f of armies)M.armyCaps[att+':'+f.id]=(M.armyCaps[att+':'+f.id]||0)+1;}return __cs.apply(this,arguments);};
var __rf=recordFall;recordFall=function(t){M.fallTypes[t]=(M.fallTypes[t]||0)+1;return __rf.apply(this,arguments);};
var __m=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`);
const t0=Date.now();
for(let m=1;m<=+months;m++){h.run('__m()');if(m%12===0)h.run(`M.months.push({m:${m},ai:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({id:e.id,dead:!!e.dead,sys:G.sys.filter(s=>s.owner===e.id).length,
  ord:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.filter(s=>s.c==='ord').length,0),war:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.filter(s=>SHIPS[s.c].dmg>0).length,0),
  ala:Math.round(e.res.ala||0),min:Math.round(e.res.min||0)})),wars:G.emps.reduce((n,e)=>n+Object.values(e.war||{}).filter(Boolean).length,0)/2,
  lostOrdRule:(G.fleetJournal||[]).filter(r=>r.reason==='rule'&&r.classes.ord).length,lostCombat:(G.fleetJournal||[]).filter(r=>r.reason==='combat').length});`);}
const r=JSON.parse(h.run(`JSON.stringify((()=>{const ac=Object.values(M.armyCaps);const garr=G.sys.filter(s=>s.owner>=0).flatMap(s=>s.planets.filter(p=>p.col&&p.col.garrison!==undefined).map(p=>p.col.garrison));
  return {seed:${+seed},placebo:${+placebo},caps:M.caps.length,capsWithArmy:M.caps.filter(c=>c.armies.length).length,armies:ac.length,reuse:ac.filter(n=>n>1).length,maxChain:ac.length?Math.max(...ac):0,
    fallTypes:M.fallTypes,garrMean:garr.length?Math.round(garr.reduce((a,b)=>a+b,0)/garr.length):0,alive:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide&&!e.dead).length,months:M.months,capsLog:M.caps};})())`));
r.sec=Math.round((Date.now()-t0)/1000);fs.writeFileSync(out,JSON.stringify(r));
console.log(JSON.stringify({seed:r.seed,placebo:r.placebo,caps:r.caps,capsWithArmy:r.capsWithArmy,armies:r.armies,reuse:r.reuse,maxChain:r.maxChain,falls:r.fallTypes,garr:r.garrMean,alive:r.alive,sec:r.sec}));
