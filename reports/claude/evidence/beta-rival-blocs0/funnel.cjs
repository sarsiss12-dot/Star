// BLOC0-1: AI federasyon kuruluş hunisi (salt okuma; RND_STATE her ay denetlenir)
const {runtime}=require('/home/user/Star/tests/helpers/runtime');
const [root,seed,months,ai,size]=[process.argv[2]||'',+process.argv[3],+(process.argv[4]||120),+(process.argv[5]||8),process.argv[6]||'orta'];
const h=runtime(root?{root}:{});
h.run(`setupGame({...CFG,seed:${seed},size:'${size}',aiCount:${ai}});G.autoSave=false;
function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}
function diag(){const r0=RND_STATE;const out=fedFoundRead(()=>{
 const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);const indep=live.filter(e=>e.ai&&!findFed(e)&&!isVassal(e)&&!isPurifier(e));
 const st={indep:indep.length,blocs:(G.feds||[]).length,stage:{},allies:0,contactsIndep:0,willingNoAlly:0,ok2NoAlly:0,why:{}};
 const bump=(o,k)=>o[k]=(o[k]||0)+1;
 for(const e of indep){
  if((e._fedLeaveUntil||0)>G.day){bump(st.stage,'leaveWait');continue;}
  const joinable=G.emps.filter(o=>o!==e&&e.contact[o.id]&&findFed(o)&&canRequestFederation(e,o).ok).filter(o=>aiFedWilling(e,o,findFed(o).type,findFed(o)).ok);
  const type=aiFedType(e),others=G.emps.filter(o=>o!==e&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&!findFed(o)&&!isVassal(o)&&!isPurifier(o));
  const allies=others.filter(o=>e.ally[o.id]&&o.ally[e.id]);st.allies+=allies.length;st.contactsIndep+=others.length;
  const ids=[e.id,...allies.map(o=>o.id)],ballot=aiFedBallot(e,ids),gate=canFoundFed(e,type,ballot);
  const willingAll=others.filter(o=>!o.war[e.id]&&!e.war[o.id]&&!o.dead&&(o._fedLeaveUntil||0)<=G.day&&aiFedWilling(o,e,type,null,ballot,[e.id,...others.map(x=>x.id)]).ok);
  st.willingNoAlly+=willingAll.length;if(willingAll.length>=2)st.ok2NoAlly++;
  for(const o of others){const w=aiFedWilling(o,e,type,null,ballot,[e.id,o.id]);if(!w.ok)bump(st.why,String(w.why).split(':')[0].split(' · ')[0].slice(0,40));}
  if(joinable.length)bump(st.stage,'joinFirst');
  else if(type==='yagmaci')bump(st.stage,'raider');
  else if(allies.length<2)bump(st.stage,allies.length?'oneAlly':'noAlly');
  else if(!gate.ok)bump(st.stage,gate.allies.length<2?'alliesReject':((e.res.etk||0)<gate.cost?'etk':'other'));
  else bump(st.stage,'foundable');
 }
 return st;});if(RND_STATE!==r0)throw Error('diag RNG');return out;}`);
const rows=[];
for(let m=1;m<=months;m++){h.run('step()');const d=JSON.parse(h.run('JSON.stringify(diag())'));d.m=m;rows.push(d);}
const agg={stage:{},why:{}};for(const r of rows){for(const [k,v]of Object.entries(r.stage))agg.stage[k]=(agg.stage[k]||0)+v;for(const [k,v]of Object.entries(r.why))agg.why[k]=(agg.why[k]||0)+v;}
const fin=JSON.parse(h.run(`JSON.stringify({feds:(G.feds||[]).map(f=>({id:f.id,type:f.type,n:f.members.length,founded:f.founded})),founding:(G.fedFounding?.proposals||[]).map(p=>({by:p.by,type:p.type,st:p.status})),reasons:G.emps.filter(e=>e.aiFedReason).map(e=>({e:e.id,...e.aiFedReason}))})`));
const sum=k=>rows.reduce((a,r)=>a+r[k],0);
console.log(JSON.stringify({seed,months,ai,size,indepMonths:sum('indep'),alliesMean:+(sum('allies')/Math.max(1,sum('indep'))).toFixed(2),contactsIndepMean:+(sum('contactsIndep')/Math.max(1,sum('indep'))).toFixed(2),willingNoAllyMean:+(sum('willingNoAlly')/Math.max(1,sum('indep'))).toFixed(2),ok2NoAlly:sum('ok2NoAlly'),stage:agg.stage,why:agg.why,maxBlocs:Math.max(...rows.map(r=>r.blocs)),fin}));
