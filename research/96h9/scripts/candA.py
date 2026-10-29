import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
anchor="/* 93D.1: physical hulls, paid pending jobs, upkeep and bounded monthly budget. */"
rep(anchor,"""/* 96H.9: an actual siege is the only invasion opening aiArmyTick acts on:
   own warships in orbit of an enemy colony at war, with aiArmyTick's own
   tests (shield at most 55, power at least 80% of the system defence).
   Read-only; observed through the empire's own fleet. */
function aiSiegeOpportunity(e){
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
 let orders=0;
 // 96H.9: a 70-alloy army never fits after cheaper warships drain the monthly
 // alloy each war month. While a real siege has no army, its actual price is a
 // derived reservation (like aiRecoveryInvestment), not a grant.
 const siege=war&&!(inv.counts.ord||0)&&!(inv.pending.ord||0)&&shipBuildAccess(e,'ord').ok&&aiSiegeOpportunity(e);
 let armyHold=siege?(shipCost(e,'ord').ala||0):0;""")
rep(""" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve){note('alloy-budget-reserve');return false;}""",""" if((c.ala||0)>budget||(e.res.ala||0)-(c.ala||0)<reserve+(cls==='ord'?0:armyHold)){note('alloy-budget-reserve');return false;}""")
rep(""" const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);""",""" if(siege&&buy('ord'))armyHold=0;
 const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);""")
open(p,'w',encoding='utf8').write(s)
