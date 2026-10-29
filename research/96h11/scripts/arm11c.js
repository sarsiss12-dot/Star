'use strict';
// 96H.11 research harness: colony economy observers (read-only, no RNG).
// usage: [RELOAD_AT=60] [PLACEBO_DAY=d PLACEBO_RNG=k] node arm11.js <gameRoot> <save> <months> <out.json>
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [root,saveFile,monthsArg,out]=process.argv.slice(2);
const {runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const h=runtime({root:path.resolve(root)});
h.sb.raw11=fs.readFileSync(saveFile,'utf8');if(!h.run('deserialize(raw11)'))throw Error('load failed');h.run('delete raw11');
h.run(fs.readFileSync('/home/user/Star/research/96h61/read-only-metrics.js','utf8'));
h.sb.PL=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.PLK=process.env.PLACEBO_RNG?+process.env.PLACEBO_RNG:0;
h.run(`var EV=[],PH=null,MON={};
if(PL!==null){const mt=monthTick;monthTick=function(){if(G.day>=PL&&!globalThis.pl11){globalThis.pl11=true;for(let i=0;i<PLK;i++)rnd();}return mt.apply(this,arguments);};}
function isAI(e){return e&&e.ai&&!e.wild&&!e.crisisSide&&e.id!==0;}
{const d=directiveTick;directiveTick=function(){PH='directive';try{return d.apply(this,arguments);}finally{PH=null;}};}
{const a=aiTurn;aiTurn=function(e){PH=isAI(e)?'aiTurn':null;try{return a.apply(this,arguments);}finally{PH=null;}};}
{const ds=directiveStatus;directiveStatus=function(e,col){const r=ds.apply(this,arguments);if(isAI(e)&&PH==='directive'){const k=r.dur?(r.why||'?').replace(/[0-9]+/g,'#'):'build:'+r.bina;MON[k]=(MON[k]||0)+1;}return r;};}
{const q=queueBuilding;queueBuilding=function(e,sys,pl,key){const r=q.apply(this,arguments);if(isAI(e))EV.push({d:G.day,k:'q',src:PH||'other',e:e.id,s:sys.id,p:pl.i,b:key,ok:!!r,f:pl.col&&pl.col.f,auto:!!(pl.col&&pl.col.auto)});return r;};}
{const sf=setFocus;setFocus=function(e,sys,pl,key){const from=pl.col&&pl.col.f,r=sf.apply(this,arguments);if(isAI(e)&&r)EV.push({d:G.day,k:'f',e:e.id,s:sys.id,p:pl.i,from,to:key,home:e.home===sys.id});return r;};}
if(typeof queueDemolish==='function'){const qd=queueDemolish;queueDemolish=function(e,sys,pl,key){const r=qd.apply(this,arguments);if(isAI(e))EV.push({d:G.day,k:'dem',src:PH||'other',e:e.id,s:sys.id,p:pl.i,b:key,ok:!!r});return r;};}
{const cb=colonyBuildTick;colonyBuildTick=function(dt){const before=new Map();for(const s of G.sys)for(const pl of s.planets)if(pl.col&&pl.col.q&&pl.col.q.length&&isAI(G.emps[pl.owner]))before.set(s.id*100+pl.i,{w:pl.col.q[0],n:(pl.col.b[pl.col.q[0].key]||0),len:pl.col.q.length});
 const r=cb.apply(this,arguments);
 for(const [k,x]of before){const s=G.sys[Math.floor(k/100)],pl=s.planets[k%100];if(!pl.col)continue;if(pl.col.q[0]===x.w)continue;const n=pl.col.b[x.w.key]||0;
  EV.push({d:G.day,k:x.w.dem?'demDone':(n>x.n?'done':'refund'),e:pl.owner,s:s.id,p:pl.i,b:x.w.key,tot:x.w.tot});}
 return r;};}
{const dc=aiDemolitionChoice;aiDemolitionChoice=function(e,sys,pl,needs){const r=dc.apply(this,arguments);if(isAI(e)){const plan=aiEconomyPlan(e);EV.push({d:G.day,k:'choice',e:e.id,s:sys.id,p:pl.i,needs:[...new Set(needs)].slice(0,6),pick:r&&r.key,wanted:r&&r.wanted,delta:r&&Object.fromEntries(Object.entries(r.delta).map(([k,v])=>[k,+v.toFixed(2)])),rows:Object.fromEntries(Object.entries(plan.rows).map(([k,v])=>[k,{n:+v.net.toFixed(1),u:+v.urgency.toFixed(1),st:Math.round(v.stock)}]))});}return r;};}
{const eo=aiEconomicOrder;aiEconomicOrder=function(e,sys,pl,legacy){const r=eo.apply(this,arguments);if(isAI(e)&&EV.some(x=>x.k==='demDone'&&x.s===sys.id&&x.p===pl.i&&G.day-x.d<=120&&G.day>=x.d)){const plan=aiEconomyPlan(e);EV.push({d:G.day,k:'order',src:PH,e:e.id,s:sys.id,p:pl.i,legacy:[...new Set(legacy)].slice(0,8),res:r.slice(0,6),rows:Object.fromEntries(Object.entries(plan.rows).map(([k,v])=>[k,{n:+v.net.toFixed(1),u:+v.urgency.toFixed(1),st:Math.round(v.stock)}]))});}return r;};}
{const re=aiRecoverEconomy;aiRecoverEconomy=function(e){PH='recovery';try{return re.apply(this,arguments);}finally{PH=isAI(e)?'aiTurn':null;}};}
function snap11(){return {day:G.day,rng:RND_STATE,mon:MON,emps:G.emps.filter(isAI).map(e=>{let b=0,slots=0,used=0,cols=0;const foc={};for(const c of e.colonies){const pl=G.sys[c.s].planets[c.p];if(!pl.col)continue;cols++;used+=colonyUsed(pl.col);slots+=colonySlots(pl.col,e,pl);foc[pl.col.f||'-']=(foc[pl.col.f||'-']||0)+1;}
  return {id:e.id,dead:e.dead,res:Object.fromEntries(['ene','min','ala','yiy','tuk','ara','etk'].map(r=>[r,Math.round(e.res[r]||0)])),inc:Object.fromEntries(['ene','min','ala','yiy','tuk','ara','etk'].map(r=>[r,+(e.inc?.[r]||0).toFixed(2)])),
   techs:Object.keys(e.techs).length,cols,used,slots,foc,crit:['ene','min','tuk','ala'].some(r=>(e.inc?.[r]||0)<0&&(e.res[r]||0)< -(e.inc[r])*3),food:(e.inc?.yiy||0)<0&&(e.res.yiy||0)< -(e.inc.yiy)*3,ships:G.fleets.filter(f=>f.e===e.id).reduce((n,f)=>n+f.ships.length,0),power:Math.round(readOnlyPowerH5(e))};})};}`);
const months=+monthsArg,rows=[];const t0=Date.now();
for(let m=0;m<months;m++){h.run('MON={}');h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
 if(process.env.RELOAD_AT&&Math.round(h.run('G.day')/30)===+process.env.RELOAD_AT&&!h.run('deserialize(serialize())'))throw Error('reload failed');
 rows.push(JSON.parse(h.run('JSON.stringify(snap11())')));}
const save=h.run('serialize()');const H=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(out,JSON.stringify({root,inputSHA:H(fs.readFileSync(saveFile)),aiSHA:H(fs.readFileSync(path.join(root,'ai.js'))),months,elapsedMs:Date.now()-t0,finalSaveSHA:H(save),rows,events:JSON.parse(h.run('JSON.stringify(EV)'))}));
fs.writeFileSync(out.replace(/\.json$/,'-final.save'),save);
console.log(out,Date.now()-t0);
