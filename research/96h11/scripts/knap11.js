'use strict';
// Window-pooled fractional knapsack: same research gain from arastir with least (min+ala) loss vs sanayi.
const fs=require('fs');const W=+(process.env.W||6);let TOT={act:0,opt:0,ind:0,gain:0,months:0};
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));const byE={};
 for(const row of r.rows)for(const c of row.cols){if(c.home||!['sanayi','arastir'].includes(c.f))continue;(byE[c.e]=byE[c.e]||[]).push({...c,m:row.m});}
 const indInc={};for(const row of r.rows)for(const c of row.cols)if(c.home){indInc[c.e+':'+row.m]=(c.inc.min||0)+(c.inc.ala||0);}
 let act=0,opt=0,ind=0,gainT=0;
 for(const [e,cs]of Object.entries(byE)){for(let w=0;w<120;w+=W){const x=cs.filter(c=>c.m>w&&c.m<=w+W);if(!x.length)continue;
  const it=x.map(c=>({g:c.alt.arastir.ara-c.alt.sanayi.ara,l:(c.alt.sanayi.min+c.alt.sanayi.ala)-(c.alt.arastir.min+c.alt.arastir.ala),on:c.f==='arastir'}));
  const G=it.filter(i=>i.on).reduce((s,i)=>s+i.g,0),L=it.filter(i=>i.on).reduce((s,i)=>s+i.l,0);if(G<=0)continue;
  it.sort((a,b)=>a.l/a.g-b.l/b.g);let need=G,lo=0;for(const i of it){if(need<=0)break;const t=Math.min(1,need/i.g);lo+=t*i.l;need-=t*i.g;}
  act+=L;opt+=lo;gainT+=G;for(let m=w+1;m<=w+W;m++)ind+=indInc[e+':'+m]||0;}}
 console.log(f.split('/').pop(),'arastir research gain',gainT.toFixed(0),'industry loss actual',act.toFixed(0),'optimal',opt.toFixed(0),'saving',(act-opt).toFixed(0),'= '+(100*(act-opt)/Math.max(1,ind)).toFixed(2)+'% of min+ala income in those windows');
 TOT.act+=act;TOT.opt+=opt;TOT.ind+=ind;TOT.gain+=gainT;}
console.log('TOTAL saving',(TOT.act-TOT.opt).toFixed(0),'of loss',TOT.act.toFixed(0),'(min+ala inc in windows',TOT.ind.toFixed(0)+')');
