'use strict';
const fs=require('fs');const FL={ene:120,min:120,yiy:60,ala:100,tuk:60};const R=['ene','min','yiy','tuk','ala'];
const T={};const add=(k)=>T[k]=(T[k]||0)+1;
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));const ev=r.events;
 for(const x of ev){if(x.k!=='dem'||!x.ok)continue;
  const ch=ev.filter(y=>y.k==='choice'&&y.s===x.s&&y.p===x.p&&y.d===x.d&&y.pick===x.b).at(-1);if(!ch)continue;
  const nx=ev.find(y=>y.k==='q'&&y.ok&&y.s===x.s&&y.p===x.p&&y.d>x.d);
  const cls=!nx?'none':nx.b===ch.wanted?'wanted':nx.b===x.b?'same':'other';
  const lost=R.filter(k=>ch.delta[k]< -1e-7);
  const below=lost.some(k=>{const row=ch.rows[k],net=row.n+ch.delta[k];return row.st<FL[k]+Math.max(0,-net)*6;});
  add(cls+(below?':belowReserve':':ok'));
 }}
console.log(JSON.stringify(T,null,0));
