'use strict';
const fs=require('fs');const T={dem:0,withChoice:0,nextWanted:0,nextSame:0,nextOther:0,none:0,belowRes:0,belowResSame:0,belowResWanted:0,okSame:0,posScore:0},byKey={};
const R=['ene','min','yiy','tuk','ala'];
for(const f of process.argv.slice(2)){const r=JSON.parse(fs.readFileSync(f,'utf8'));const ev=r.events;
 for(const x of ev){if(x.k!=='dem'||!x.ok)continue;T.dem++;
  const ch=ev.filter(y=>y.k==='choice'&&y.s===x.s&&y.p===x.p&&y.d===x.d&&y.pick===x.b).at(-1);if(!ch){continue;}T.withChoice++;
  // demolished producer of a resource whose stock is below plan reserve
  const below=R.some(k=>ch.delta[k]< -1e-7&&ch.rows[k].st<(ch.rows[k].st,0)+0||false);
  const reserve=k=>{const row=ch.rows[k];return null;};
  const nx=ev.find(y=>y.k==='q'&&y.ok&&y.s===x.s&&y.p===x.p&&y.d>x.d);
  const cls=!nx?'none':nx.b===ch.wanted?'nextWanted':nx.b===x.b?'nextSame':'nextOther';T[cls]++;
  (byKey[x.b]=byKey[x.b]||{})[cls]=(byKey[x.b][cls]||0)+1;
 }}
console.log(JSON.stringify(T));console.log(JSON.stringify(byKey));
