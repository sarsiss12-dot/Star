'use strict';
// SAHA-ENTEGRE.0 performans: aynı tohum, kontrol (p47+PR#64) ve aday ardışık; ay başına ms (gerçek gün adımları + monthTick) ve AI turu dahil.
// Kullanım: node benchSE.cjs <kontrolKök> <adayKök> <size> <ai> <ay> <tekrar> <çıkış.json>
const path=require('path'),fs=require('fs');
const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [ctl,cand,size,ai,months,reps,out]=process.argv.slice(2);
const STEP=`var __m=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`;
function run(root,seed){const h=runtime({root:path.resolve(root)});h.run(`resetSetupNaming();Object.assign(CFG,{seed:${seed},size:'${size}',aiCount:${+ai}});setupGame({...CFG});G.autoSave=false;`+STEP);
  const t=[];for(let m=0;m<+months;m++){const a=process.hrtime.bigint();h.run('__m()');t.push(Number(process.hrtime.bigint()-a)/1e6);}
  const fin=require('crypto').createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);return {t,fin};}
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*(s.length-1)))];};
const res={size,ai:+ai,months:+months,reps:+reps,ctl:[],cand:[]};
function warm(root){const h=runtime({root:path.resolve(root)});h.run(`resetSetupNaming();Object.assign(CFG,{seed:7,size:'${size}',aiCount:${+ai}});setupGame({...CFG});G.autoSave=false;`+STEP);for(let m=0;m<3;m++)h.run('__m()');}
warm(ctl);warm(cand);   // JIT ısınması (ölçülmez)
for(let r=0;r<+reps;r++)for(const [k,root] of (r%2?[['cand',cand],['ctl',ctl]]:[['ctl',ctl],['cand',cand]])){const x=run(root,11);res[k].push(x);console.log(k,r,'toplam',x.t.reduce((a,b)=>a+b,0).toFixed(0),'ms medyan',q(x.t,.5).toFixed(1),'p95',q(x.t,.95).toFixed(1),'fin',x.fin);}
const all=k=>res[k].flatMap(x=>x.t);
res.summary={ctl:{median:q(all('ctl'),.5),p95:q(all('ctl'),.95),total:all('ctl').reduce((a,b)=>a+b,0)/+reps},cand:{median:q(all('cand'),.5),p95:q(all('cand'),.95),total:all('cand').reduce((a,b)=>a+b,0)/+reps},
  sameWorld:res.ctl.every((x,i)=>x.fin===res.cand[i].fin)};
res.summary.p95Delta=(res.summary.cand.p95/res.summary.ctl.p95-1)*100;res.summary.totalDelta=(res.summary.cand.total/res.summary.ctl.total-1)*100;
console.log(JSON.stringify(res.summary));fs.writeFileSync(out,JSON.stringify(res,(k,v)=>k==='t'?v.map(n=>+n.toFixed(2)):v,1));
