'use strict';
// 96H.9 research harness: one arm from a real Save8 with read-only invasion observers.
// usage: [RELOAD_AT=60] [PLACEBO_DAY=d PLACEBO_RNG=k] node arm9.js <gameRoot> <save> <months> <out.json>
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [root,saveFile,monthsArg,out]=process.argv.slice(2);
const {runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const h=runtime({root:path.resolve(root)});
h.sb.raw9=fs.readFileSync(saveFile,'utf8');if(!h.run('deserialize(raw9)'))throw Error('load failed');h.run('delete raw9');
h.run(fs.readFileSync('/home/user/Star/research/96h61/read-only-metrics.js','utf8'));
h.sb.PL9=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.PLK9=process.env.PLACEBO_RNG?+process.env.PLACEBO_RNG:0;
h.run(`var ev9=[];
if(PL9!==null){const mt9=monthTick;monthTick=function(){if(G.day>=PL9&&!globalThis.pl9){globalThis.pl9=true;for(let i=0;i<PLK9;i++)rnd();}return mt9.apply(this,arguments);};}
const cs9=captureSystem;captureSystem=function(sys,by,cause,only){const before=sys.planets.map(p=>({i:p.i,owner:p.owner,col:!!p.col,pop:p.col?p.col.pop:0})),so=sys.owner;const r=cs9.apply(this,arguments);
 const flips=before.filter(b=>b.col&&sys.planets[b.i].owner!==b.owner).map(b=>({i:b.i,from:b.owner,pop:b.pop}));
 if(flips.length||sys.owner!==so)ev9.push({day:G.day,kind:'capture',sys:sys.id,by,cause,sysFrom:so,flips,colonized:before.some(b=>b.col)});return r;};
const rf9=recordFall;recordFall=function(t){ev9.push({day:G.day,kind:'fall',type:t});return rf9.apply(this,arguments);};
if(typeof warLedgerGround==='function'){const wg9=warLedgerGround;warLedgerGround=function(a,b,lost,red){ev9.push({day:G.day,kind:'ground',atk:a,def:b,armyLost:lost,garrisonReduced:red});return wg9.apply(this,arguments);};}
function upS9(e){let home=0,away=0;const mul0=1+(e.mods.upMul||0);let mob=1;if(hasCivic(e,'mobilize')&&!Object.keys(e.war||{}).some(k=>e.war[k]))mob=2;
 for(const f of G.fleets){if(f.e!==e.id||!f.ships.length)continue;const sup=fleetSupply(e,f),inH=fleetInHome(e,f),m=(inH?.5:1)*mob*(1+(1-sup)*2.2);let b=0;for(const s of f.ships)b+=SHIPS[s.c].up;if(inH)home+=b*m*mul0;else away+=b*m*mul0;}return {home,away};}
const dis9=aiDisbandTick;aiDisbandTick=function(){const n=G.emps.map(e=>G.fleets.filter(f=>f.e===e.id).reduce((a,f)=>a+f.ships.length,0)),u=G.emps.map(e=>e.dead||e.wild||!e.ai?null:upS9(e)),inc=G.emps.map(e=>e.inc?.ene);const r=dis9.apply(this,arguments);G.emps.forEach((e,i)=>{const m=G.fleets.filter(f=>f.e===e.id).reduce((a,f)=>a+f.ships.length,0);if(m<n[i])ev9.push({day:G.day,kind:'disband',e:e.id,ships:n[i]-m,war:Object.keys(e.war).some(k=>e.war[k]),inc:inc[i],upHome:u[i]?.home,upAway:u[i]?.away});});return r;};
const pe9=aiPlanEvent;aiPlanEvent=function(e,k,d={}){if(['campaign-reassessed','campaign-recalled','army-escort','army-recalled','army-target'].includes(k))ev9.push({day:G.day,kind:k,e:e?.id,...d});return pe9(e,k,d);};
function snap9(){
 const sieges=[];
 for(const sys of G.sys){const kuv=orbitForces(sys);for(const pl of sys.planets){if(!pl.col||pl.owner<0)continue;for(const id in kuv){const a=G.emps[id];if(!a||a.dead||a.wild||a.crisisSide||+id===pl.owner||!a.war[pl.owner])continue;const K=kuv[id];if(K.war<=0&&K.ground<=0)continue;
  sieges.push({sys:sys.id,pl:pl.i,atk:+id,def:pl.owner,war:Math.round(K.war),ground:Math.round(K.ground),shield:+(pl.col.shield||0).toFixed(1),cap:shieldCap(pl.col,G.emps[pl.owner],{s:sys.id,i:pl.i}),garrison:+(pl.col.garrison||0).toFixed(1),gbase:+(pl.col.garrisonBase||0).toFixed(1),siege:pl.col.siege||0,truce:pl.col.truce??null,pop:+pl.col.pop.toFixed(1),defEne:+(G.emps[pl.owner].inc?.ene||0).toFixed(1)});}}}
 const armies=G.fleets.filter(f=>f.ships.length&&isTransport(f)&&G.emps[f.e]?.ai).map(f=>({id:f.id,e:f.e,sys:f.sys,to:f.mv?f.mv.to:null,end:f.path.at(-1)??null,ground:Math.round(groundPower(f)),n:f.ships.length,combat:!!f.combat}));
 return {day:G.day,rng:RND_STATE,sieges,armies,emps:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({id:e.id,dead:e.dead,ene:Math.round(e.res.ene),incEne:+(e.inc?.ene||0).toFixed(1),ala:Math.round(e.res.ala),ships:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0),armyShips:G.fleets.filter(f=>f.e===e.id&&isTransport(f)).reduce((n,f)=>n+f.ships.filter(s=>SHIPS[s.c].rol==='ordu').length,0),power:Math.round(readOnlyPowerH5(e)),techs:Object.keys(e.techs).length,colonies:e.colonies.length,systems:G.sys.filter(s=>s.owner===e.id).length,wars:Object.keys(e.war).filter(k=>e.war[k]).map(Number),camp:e.aiCampaign?{phase:e.aiCampaign.phase,target:e.aiCampaign.target,need:e.aiCampaign.need,reason:e.aiCampaign.reason}:null,objective:e.aiStrategy?.objective?.kind||null,crit:['ene','min','tuk','ala'].some(r=>(e.inc?.[r]||0)<0&&(e.res[r]||0)< -(e.inc[r])*3)}))};}`);
const months=+monthsArg,rows=[JSON.parse(h.run('JSON.stringify(snap9())'))];const t0=Date.now();
for(let m=0;m<months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
 if(process.env.RELOAD_AT&&Math.round(h.run('G.day')/30)===+process.env.RELOAD_AT&&!h.run('deserialize(serialize())'))throw Error('reload failed');
 rows.push(JSON.parse(h.run('JSON.stringify(snap9())')));}
const save=h.run('serialize()');const H=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(out,JSON.stringify({root,inputSHA:H(fs.readFileSync(saveFile)),aiSHA:H(fs.readFileSync(path.join(root,'ai.js'))),months,elapsedMs:Date.now()-t0,finalSaveSHA:H(save),rows,events:JSON.parse(h.run('JSON.stringify(ev9)'))}));
fs.writeFileSync(out.replace(/\.json$/,'-final.save'),save);
const ev=JSON.parse(h.run('JSON.stringify(ev9)')),caps=ev.filter(x=>x.kind==='capture');
console.log(JSON.stringify({out:path.basename(out),captures:caps.length,colonyCaptures:caps.filter(x=>x.flips.length).length,falls:ev.filter(x=>x.kind==='fall').reduce((o,x)=>(o[x.type]=(o[x.type]||0)+1,o),{}),ground:ev.filter(x=>x.kind==='ground').length,ms:Date.now()-t0}));
