'use strict';
// Commerce deliveries (same definition as campaign-96f1 summary: alive empires' Commerce stats) from final saves.
const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const root=process.argv[2];const h=runtime({root:path.resolve(root)});const out={};
for(const f of process.argv.slice(3)){h.sb.raw=fs.readFileSync(f,'utf8');if(!h.run('deserialize(raw)'))throw Error(f);
 out[path.basename(f)]=JSON.parse(h.run('JSON.stringify({all:G.emps.reduce((n,e)=>n+((Commerce.state().stats[e.id]||{}).deliveries||0),0)})')).all;}
console.log(JSON.stringify(out));
