const fs=require('fs'),path=require('path');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,save]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');h.sb.__now=()=>Number(process.hrtime.bigint())/1e6;
console.log(h.run(`JSON.stringify((()=>{const t=[];let n=0,arr=0,obj=0;for(let i=0;i<7;i++){const a=__now();const tx=dealTxBegin();t.push(__now()-a);n=tx.records.length;if(!i){for(const r of tx.records){if(Array.isArray(r.obj))arr++;else obj++;}}dealTxRollback(tx);}
 t.sort((x,y)=>x-y);return {records:n,arr,obj,medMs:+t[3].toFixed(1),minMs:+t[0].toFixed(1)};})())`));
