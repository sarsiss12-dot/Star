'use strict';
// Read-only marginal value of one existing building (removal delta, sign flipped) per AI colony; no RNG/state change.
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const h=runtime({root:path.resolve('arms/c10')});const R=['ene','min','ala','yiy','tuk','ara','etk'];const acc={};
for(const f of process.argv.slice(2)){h.sb.raw=fs.readFileSync(f,'utf8');if(!h.run('deserialize(raw)'))throw Error(f);
 const rows=JSON.parse(h.run(`(()=>{const raw=serialize(),rng=RND_STATE,out=[];for(const e of G.emps){if(!e.ai||e.dead||e.wild||e.crisisSide||e.id===0)continue;for(const c of e.colonies){const sys=G.sys[c.s],pl=sys.planets[c.p];if(!pl.col||pl.owner!==e.id)continue;for(const k of Object.keys(pl.col.b)){if(!pl.col.b[k])continue;const d=aiBuildingDelta(e,sys,pl,k,false,-1);out.push({k,d:Object.fromEntries(${JSON.stringify(R)}.map(r=>[r,-(d[r]||0)])),cost:buildingCost(e,k)});}}}if(raw!==serialize()||rng!==RND_STATE)throw Error('impure');return JSON.stringify(out);})()`));
 for(const x of rows){(acc[x.k]=acc[x.k]||{n:0,cost:x.cost,v:Object.fromEntries(R.map(r=>[r,[]]))}).n++;for(const r of R)acc[x.k].v[r].push(x.d[r]);}}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?+s[Math.floor(s.length/2)].toFixed(2):0;};
const out={};for(const [k,x]of Object.entries(acc)){const m=Object.fromEntries(R.map(r=>[r,med(x.v[r])]));out[k]={n:x.n,cost:x.cost,medianNetPerMonth:m};
 const pay=x.cost.min&&m.min>0?+(x.cost.min/m.min).toFixed(1):null;out[k].paybackMonthsOwnMineral=pay;}
console.log(JSON.stringify(out,null,1));
