const {world,J}=require('/home/user/Star/tests/helpers/beta-fed-found0-mp-world.cjs');
process.chdir('/home/user/Star');
const h=world();
const r=J(h,`(()=>{const out=[];const m0=G.year*12+G.month;for(let i=0;i<36*60&&G.year*12+G.month<m0+36;i++){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}
 return {humans:G.emps.filter(e=>!e.ai&&!e.wild).map(e=>({id:e.id,p:e===G.p,pend:(e.decisions?.pending||[]).map(n=>n.kind+':'+n.catalog+':'+n.status),inbox:e===G.p?(G.inbox||[]).filter(n=>['event','chain','anomaly'].includes(n.kind)).map(n=>n.kind+':'+n.title):null,queue:e.decisions?.queue?.length})),re:G.cfg.randomEvents};})()`);
console.log(JSON.stringify(r,null,1));
