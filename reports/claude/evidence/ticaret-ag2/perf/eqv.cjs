// node eqv.cjs <kök> <save> <ay>: daraltılmış işlem (varsayılan) vs tam işlem (G._dealTxFull) — her ay Save8 SHA-256 + RNG
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,save,months]=process.argv.slice(2);const arms=[];
for(const full of [false,true]){const h=runtime({root:path.resolve(root)});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
 h.run(`G.autoSave=false;${full?'G._dealTxFull=true;':''}var NS=0;var __s=dealTxScope;dealTxScope=function(){const r=__s.apply(this,arguments);if(r)NS++;return r;};
 var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}};`);
 const rows=[];for(let m=0;m<+months;m++){h.run('__m()');const s=h.run('(()=>{const f=G._dealTxFull;delete G._dealTxFull;const s=serialize();if(f)G._dealTxFull=f;return s;})()');rows.push(crypto.createHash('sha256').update(s).digest('hex').slice(0,16)+':'+h.run('RND_STATE'));}
 arms.push({full,rows,scoped:h.run('NS')});}
const diff=arms[0].rows.findIndex((r,i)=>r!==arms[1].rows[i]);
console.log(JSON.stringify({save:path.basename(save),months:+months,scopedDeals:arms[0].scoped,fullArmScoped:arms[1].scoped,firstDiff:diff,equal:diff<0}));
