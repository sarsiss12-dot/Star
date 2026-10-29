'use strict';
const fs=require('fs');let T={dem:0,next:0,same:0,same6:0,none:0},keys={};
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));const by={};
 for(const x of r.events)if((x.k==='q'&&x.ok)||x.k==='dem'&&x.ok||x.k==='demDone')(by[x.s+':'+x.p]=by[x.s+':'+x.p]||[]).push(x);
 let s={dem:0,same:0,same6:0};
 for(const v of Object.values(by))for(let i=0;i<v.length;i++){const x=v[i];if(x.k!=='dem')continue;T.dem++;s.dem++;
  const nx=v.slice(i+1).find(y=>y.k==='q'&&y.e===x.e);if(!nx){T.none++;continue;}T.next++;
  if(nx.b===x.b){T.same++;s.same++;keys[x.b]=(keys[x.b]||0)+1;if(nx.d-x.d<=180){T.same6++;s.same6++;}}}
 console.log(f.split('/').pop(),JSON.stringify(s));}
console.log('TOTAL',JSON.stringify(T),'same-key rebuild by key',JSON.stringify(keys));
