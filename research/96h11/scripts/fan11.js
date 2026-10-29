'use strict';
const fs=require('fs');
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));
 const cnt={},flip={n:0,cm:0};const prev=new Map();const ratio=[];let mixedMonths=0,econMonths=0;
 const tl={};
 for(const row of r.rows){const byE={};
  for(const c of row.cols){cnt[c.f]=(cnt[c.f]||0)+1;const k=c.e+':'+c.s+':'+c.p;if(prev.has(k)&&!c.home){flip.cm++;if(prev.get(k)!==c.f)flip.n++;}prev.set(k,c.f);
   (byE[c.e]=byE[c.e]||[]).push(c);
   if(!c.home&&(c.f==='sanayi'||c.f==='arastir')){const a=c.alt;const gAra=a.arastir.ara-a.sanayi.ara,lMin=a.sanayi.min-a.arastir.min,lAla=a.sanayi.ala-a.arastir.ala;if(gAra>0.5)ratio.push({e:c.e,m:row.m,r:(lMin+lAla)/gAra,gAra,lMin,lAla,pop:c.pop});}}
  for(const [e,cs]of Object.entries(byE)){const c0=cs[0];(tl[e]=tl[e]||[]).push(row.m+':'+(c0.inc.ara>=c0.T?'+':'-')+cs.filter(c=>!c.home).map(c=>c.f[0]).join(''));}
 }
 const rs=ratio.map(x=>x.r).sort((a,b)=>a-b),q=p=>rs[Math.floor(p*(rs.length-1))]?.toFixed(2);
 console.log('==',f,'colony-months',JSON.stringify(cnt),'nonhome flips',flip.n,'/',flip.cm,(100*flip.n/flip.cm).toFixed(1)+'%');
 console.log(' loss(min+ala)/gain(ara) arastir vs sanayi: n',rs.length,'p10',q(.1),'p50',q(.5),'p90',q(.9));
 // per empire-month spread (max/min ratio across colonies same month)
 const g={};for(const x of ratio){const k=x.e+':'+x.m;(g[k]=g[k]||[]).push(x.r);}let spread=[];for(const v of Object.values(g))if(v.length>=2)spread.push(Math.max(...v)/Math.max(.01,Math.min(...v)));spread.sort((a,b)=>a-b);
 console.log(' within-empire-month spread max/min: n',spread.length,'p50',spread[Math.floor(spread.length/2)]?.toFixed(2),'p90',spread[Math.floor(spread.length*.9)]?.toFixed(2));
 for(const [e,t]of Object.entries(tl))console.log(' e'+e,t.slice(0,40).join(' '));
}
