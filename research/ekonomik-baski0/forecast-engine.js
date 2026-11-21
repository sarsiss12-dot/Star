// Disposable forecast on an isolated Save8. No projected stock is credited to the game.
const pressureKeys=['ene','min','yiy','tuk','ala'];
function growthAt(e,s,p,h){
  const c=p.col;
  if(e.crisis==='yiyecek'||e.crisis==='mineral')return Math.max(1,c.pop-Math.floor(h/5));
  if(e.crisis||hasCivic(e,'sleep')||c.pop>=c.cap)return c.pop;
  const food=clamp(((e.foodNeed>0?e.res.yiy/(12*e.foodNeed):1)-.5)*.3,-.25,.2);
  const speed=.30*(1+e.mods.growMul+(physioOf(e).growMul||0)+(focusMods(c).growMul||0)+(c.b.klinik?.35:0)+(planetTrait(c)?.grow||0)+food)*habOf(e,p)/70*clamp(c.stab/60,.3,1.25);
  return c.pop+Math.min(Math.ceil(c.cap-c.pop),Math.max(0,Math.floor(c.grow+h*speed)));
}
function predict(e,h){
  const plan=aiEconomyPlan(e), arrivals=[], population=[], old=aiShadowIncome(e);
  for(const c of e.colonies){
    const s=G.sys[c.s],p=s.planets[c.p];if(!p.col||p.owner!==e.id)continue;
    population.push({s,p,now:p.col.pop,mid:growthAt(e,s,p,h/2),end:growthAt(e,s,p,h)});
    let days=0;
    for(const job of p.col.q||[]){
      days+=job.left;
      if(BUILDINGS[job.key])arrivals.push({days,kind:job.key,delta:aiBuildingDelta(e,s,p,job.key,false,job.dem?-1:1)});
    }
  }
  for(const s of G.sys){
    if(!s.queue?.length)continue;
    const slots=Array(yardCount(s)).fill(0);if(!slots.length)continue;
    for(const job of s.queue){
      if(job.e!==e.id||!SHIPS[job.cls]||!shipBuildAccess(e,job.cls).ok)continue;
      const index=slots.indexOf(Math.min(...slots)),days=slots[index]+job.left;slots[index]=days;
      const up=Math.max(.1,1+(e.mods.upMul||0)),mobilize=hasCivic(e,'mobilize')&&!Object.values(e.war||{}).some(Boolean);
      arrivals.push({days,kind:job.cls,delta:{ene:-SHIPS[job.cls].up*up*(mobilize?2:1),ala:-(SHIPS[job.cls].upA||0)*up}});
    }
  }
  let mid;
  try{
    for(const c of population)c.p.col.pop=c.mid;
    mid=empireIncome({...e,_trAt:-1,_trCache:null},false);
  }finally{for(const c of population)c.p.col.pop=c.now;}
  const contracts=(G.commerce?.contracts||[]).filter(c=>!Commerce.closed(c));
  const sums={};
  for(const r of pressureKeys){
    const jobs=arrivals.reduce((n,j)=>n+Math.max(0,h-j.days/30)*(j.delta[r]||0),0);
    let exportDue=0,conditionalImport=0;
    for(const c of contracts)for(const l of c.legs)if(l.r===r){
      const term=Math.max(0,Math.min(h,(c.until-G.day)/30))*l.v*30/l.every;
      if(l.e===e.id)exportDue+=term;if(l.to===e.id)conditionalImport+=term;
    }
    const net=e.inc[r]+mid[r]-old[r];
    const adjusted=aiFedBudget(e,{...e.inc,[r]:net+jobs/h}).net[r]-(plan.vassal[r]||0)-exportDue/h;
    const stock=plan.rows[r].stock;
    sums[r]={stock:e.res[r],available:stock,current:e.inc[r],planned:plan.rows[r].net,simple:Math.max(0,e.res[r]+h*e.inc[r]),
      budget:Math.max(0,stock+h*plan.rows[r].net),timed:Math.max(0,stock+h*adjusted),adjusted,conditionalImport,exportDue,jobs};
  }
  return {id:e.id,h,pop:population.reduce((n,c)=>n+c.now,0),forecastPop:population.reduce((n,c)=>n+c.end,0),
    upkeep:[e.fleetUp,e.fleetAlloyUp],dues:plan.federation,orders:arrivals.map(({days,kind})=>[days,kind]),sums};
}
