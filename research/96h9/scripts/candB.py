import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
anchor="/* 93D.1: physical hulls, paid pending jobs, upkeep and bounded monthly budget. */"
rep(anchor,"""/* 96H.9: the army must be bought while the campaign still prepares. Once the
   fleet is deployed its upkeep consumes the wartime energy runway that every
   hull purchase needs, so a siege never receives an army. Invasion intent is
   the campaign's own known colonised enemy target, or an actual siege seen
   through the empire's own fleet with aiArmyTick's tests (shield at most 55,
   power at least 80% of the system defence). Read-only. */
function aiInvasionTarget(e){
 const c=e.aiCampaign,t=c&&c.until>G.day&&['build','gather','fund','attack'].includes(c.phase)?G.sys[c.target]:null,r=aiKnownSystem(e,t);
 if(r&&r.colonies>0&&e.war[r.owner])return t;
 for(const sys of G.sys){
  let war=0;for(const f of G.fleets)if(f.e===e.id&&f.sys===sys.id&&!f.mv&&f.ships.length&&isArmed(f))war+=fleetPower(f);
  if(!war||war<(sys.def||0)*.8)continue;
  if(sys.planets.some(pl=>pl.col&&pl.owner>=0&&pl.owner!==e.id&&e.war[pl.owner]&&(pl.col.shield||0)<=55))return sys;
 }
 return null;
}
"""+anchor)
rep(""" const limit=Math.min(war?10:6,Math.max(1,yards.reduce((n,s)=>n+yardCount(s),0)*(war?3:2)));
 let orders=0;""",""" const limit=Math.min(war?10:6,Math.max(1,yards.reduce((n,s)=>n+yardCount(s),0)*(war?3:2)));
 let orders=0,armyHold=0;""")
rep(""" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve){note('alloy-budget-reserve');return false;}""",""" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve+(cls==='ord'?0:armyHold)){note('alloy-budget-reserve');return false;}""")
rep(""" const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);""",""" // A 70-alloy army never fits after cheaper warships drain each war month's
 // alloy. With invasion intent and no army, try it first; if only its alloy
 // price is missing, that price is a derived reservation (as in
 // aiRecoveryInvestment), never a grant. Other failing gates change nothing.
 if(war&&!(inv.counts.ord||0)&&!(inv.pending.ord||0)&&shipBuildAccess(e,'ord').ok&&aiInvasionTarget(e)){
  const seen=state.reasons;state.reasons=[];const bought=buy('ord'),why=state.reasons;
  state.reasons=seen.concat(why.filter(k=>!seen.includes(k)));
  if(!bought&&why.length===1&&why[0]==='alloy-budget-reserve')armyHold=shipCost(e,'ord').ala||0;
 }
 const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);""")
open(p,'w',encoding='utf8').write(s)
