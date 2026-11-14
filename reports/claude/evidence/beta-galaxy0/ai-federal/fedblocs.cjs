const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,arm,seed,months]=[process.argv[2],process.argv[3],+process.argv[4],+(process.argv[5]||120)];
const h=runtime(root?{root}:{});h.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:8});G.autoSave=false;`+(arm==='placebo'?'rnd();':'')+
 `function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`);
const rows=[];
for(let m=1;m<=months;m++){h.run('step()');h.sb.__M=m;
 rows.push(JSON.parse(h.run(`JSON.stringify((()=>{const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);const feds=(G.feds||[]).filter(f=>f.members.filter(id=>G.emps[id]&&!G.emps[id].dead).length>=2);
  const sizes=feds.map(f=>f.members.filter(id=>!G.emps[id].dead).length).sort((a,b)=>b-a);const inFed=new Set(feds.flatMap(f=>f.members));
  return {m:__M,live:live.length,blocs:feds.length,top:sizes[0]||0,share:live.length?(sizes[0]||0)/live.length:0,indep:live.filter(e=>!inFed.has(e.id)).length,sizes};})())`)));}
const tail=rows.filter(r=>r.m>60);
const out={arm,seed,months,maxShare:Math.max(...rows.map(r=>r.share)),meanShareLate:tail.reduce((a,r)=>a+r.share,0)/tail.length,maxBlocs:Math.max(...rows.map(r=>r.blocs)),monthsMulti:rows.filter(r=>r.blocs>=2).length,meanIndepLate:tail.reduce((a,r)=>a+r.indep,0)/tail.length,maxTop:Math.max(...rows.map(r=>r.top)),final:rows[rows.length-1]};
console.log(JSON.stringify(out));
