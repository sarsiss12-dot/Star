// Trace aiMove/fleet moves of actor A's big fleets with caller stack (read-only hooks, no RNG).
const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,A,months,minShips]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');h.sb.A=+A;h.sb.MIN=+(minShips||10);
h.run(`var tr=[];function stk(){return (new Error().stack.split('\\n').slice(3,9).map(l=>(l.match(/at ([\\w.$<>]+)/)||[])[1]).filter(Boolean).join('<'));}
 const mv0=aiMove;aiMove=function(e,f,to){if(e.id===A&&f.ships.length>=MIN){const last=f.path.at(-1)??f.mv?.to;if(last!==to)tr.push({day:G.day,f:f.id,n:f.ships.length,from:f.sys,to,toOwner:G.sys[to]?.owner,phase:e.aiCampaign?.phase,ctarget:e.aiCampaign?.target,rally:e.aiCampaign?.rally,by:stk()});}return mv0.apply(this,arguments);};
 {const mf0=orderMove;orderMove=function(f,to,...a){if(f.e===A&&f.ships.length>=MIN){const last=f.path.at(-1)??f.mv?.to;if(last!==to)tr.push({day:G.day,f:f.id,n:f.ships.length,from:f.sys,to,raw:1,by:stk()});}return mf0.call(this,f,to,...a);};}`);
for(let m=0;m<+months;m++)h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
console.log(h.run('JSON.stringify(tr)'),h.run('RND_STATE'));
