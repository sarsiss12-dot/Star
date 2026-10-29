'use strict';
// 96H.11 analysis of arm11 runs: dual build usage, focus flips, completions.
const fs=require('fs');const files=process.argv.slice(2);
const T={};const add=(o,k,v=1)=>o[k]=(o[k]||0)+v;
for(const f of files){const r=JSON.parse(fs.readFileSync(f,'utf8'));const ev=r.events;
 const q=ev.filter(x=>x.k==='q');const S={};
 for(const x of q)add(S,x.src+(x.ok?':ok':':fail'));
 const okq=q.filter(x=>x.ok),bySrc={};for(const x of okq){bySrc[x.src]=bySrc[x.src]||{};add(bySrc[x.src],x.b);}
 const done=ev.filter(x=>x.k==='done'),ref=ev.filter(x=>x.k==='refund');
 // queue time: match done with the most recent ok q of same colony+building
 const pend=new Map(),wait=[];for(const x of ev){const key=x.s+':'+x.p+':'+x.b;if(x.k==='q'&&x.ok){(pend.get(key)||pend.set(key,[]).get(key)).push(x);}
  if(x.k==='done'||x.k==='refund'){const a=pend.get(key);if(a&&a.length){const y=a.shift();wait.push({src:y.src,b:x.b,d:x.d-y.d,k:x.k});}}}
 const fl=ev.filter(x=>x.k==='f');const perCol={};for(const x of fl)add(perCol,x.e+':'+x.s+':'+x.p);
 const flips=fl.filter(x=>x.from);const pairs={};for(const x of flips)add(pairs,x.from+'>'+x.to);
 const mon={};for(const row of r.rows)for(const [k,v]of Object.entries(row.mon||{}))add(mon,k,v);
 const last=r.rows.at(-1);const autos=null;
 const avg=a=>a.length?(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1):'-';
 console.log('==',f.split('/').pop(),'final',r.finalSaveSHA.slice(0,10));
 console.log(' queue',JSON.stringify(S));
 console.log(' okBySrc',JSON.stringify(bySrc));
 console.log(' done',done.length,'refund',ref.length,'dem',ev.filter(x=>x.k==='dem'&&x.ok).length,'demDone',ev.filter(x=>x.k==='demDone').length);
 console.log(' wait days aiTurn',avg(wait.filter(w=>w.src==='aiTurn').map(w=>w.d)),'directive',avg(wait.filter(w=>w.src==='directive').map(w=>w.d)));
 console.log(' focus sets',fl.length,'flips',flips.length,'colonies',Object.keys(perCol).length,'pairs',JSON.stringify(pairs));
 console.log(' directiveStatus',JSON.stringify(mon));
 console.log(' final foc',JSON.stringify(last.emps.filter(e=>!e.dead).map(e=>e.foc)));
 console.log(' slots used/slots',last.emps.filter(e=>!e.dead).map(e=>e.used+'/'+e.slots).join(' '));
}
