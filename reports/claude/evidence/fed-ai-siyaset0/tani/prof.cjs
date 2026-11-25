const fs=require('fs'),path=require('path');const {runtime}=require('/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/wt-trade/tests/helpers/runtime');
const [root,save,n]=process.argv.slice(2);const now=()=>Number(process.hrtime.bigint())/1e6;
const out={};for(let k=0;k<+(n||3);k++){const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(save,'utf8');h.sb.__now=now;
 h.run(`deserialize(S);G.autoSave=false;G.speed=0;var T={};const W=(name)=>{if(typeof globalThis[name]!=='function')return;const f=globalThis[name];globalThis[name]=function(){const t=__now();try{return f.apply(this,arguments);}finally{T[name]=(T[name]||0)+__now()-t;}};};
 ['aiTurn','aiFederationPolitics','aiFedStayReview','aiFedMemberReform','aiFedMismatch','aiFedDoctrineBar','aiFedWilling','aiRivalBlocChoice','jointTick','monthTick','dailyTick'].forEach(W);
 var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);
 const t=now();h.run('__m()');const tot=now()-t;const T=JSON.parse(h.run('JSON.stringify(T)'));T.total=tot;for(const[k,v]of Object.entries(T))(out[k]=out[k]||[]).push(+v.toFixed(1));}
console.log(path.basename(root),JSON.stringify(out));
