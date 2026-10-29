'use strict';
const fs=require('fs');const agg={dem:0,churn12:0,churn24:0,pairs:{},same:0,dup:0,dirMonths:0,head:[],behind:[],paidWaiting:0};
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));const ev=r.events;
 const built=new Map();// colony:key -> [days]
 for(const x of ev){const c=x.s+':'+x.p;
  if(x.k==='done'){const k=c+':'+x.b;(built.get(k)||built.set(k,[]).get(k)).push(x.d);}
  if(x.k==='dem'&&x.ok){agg.dem++;const a=built.get(c+':'+x.b)||[];const last=a.filter(d=>d<=x.d).at(-1);
   if(last!==undefined&&x.d-last<=360)agg.churn12++;if(last!==undefined&&x.d-last<=720)agg.churn24++;agg.pairs[x.b]=(agg.pairs[x.b]||0)+1;}}
 // same month same colony: directive ok and aiTurn ok
 const bym={};for(const x of ev)if(x.k==='q'&&x.ok){const k=Math.floor(x.d/30)+':'+x.s+':'+x.p;(bym[k]=bym[k]||[]).push(x);}
 for(const v of Object.values(bym)){const d=v.filter(x=>x.src==='directive'),a=v.filter(x=>x.src==='aiTurn');if(d.length)agg.dirMonths++;if(d.length&&a.length){agg.same++;if(a.some(x=>d.some(y=>y.b===x.b)))agg.dup++;}}
 // queue wait: approximate head-wait = tot (build days); behind = (done day - queue day) - tot
 const pend=new Map();for(const x of ev){const key=x.s+':'+x.p+':'+x.b;if(x.k==='q'&&x.ok)(pend.get(key)||pend.set(key,[]).get(key)).push(x);
  if(x.k==='done'){const a=pend.get(key);if(a&&a.length){const y=a.shift();agg.head.push(x.tot);agg.behind.push(Math.max(0,x.d-y.d-x.tot));}}}
}
const avg=a=>(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1),frac=a=>(100*a.filter(x=>x>0.5).length/a.length).toFixed(1);
console.log('demolitions',agg.dem,'of a building completed <=12m earlier',agg.churn12,'<=24m',agg.churn24,'by key',JSON.stringify(agg.pairs));
console.log('colony-months with directive order',agg.dirMonths,'also aiTurn order same colony',agg.same,'same building',agg.dup);
console.log('build days avg',avg(agg.head),'wait behind another job avg',avg(agg.behind),'share with wait',frac(agg.behind)+'%');
