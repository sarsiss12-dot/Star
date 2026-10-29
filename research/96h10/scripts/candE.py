# Separate candidate for the seed23 catastrophe: one army hull may exceed the monthly
# alloy budget cap when the stock covers its price above the reserve (96C.1 analogue).
import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
old=""" if(war&&!(inv.counts.ord||0)&&!(inv.pending.ord||0)&&shipBuildAccess(e,'ord').ok&&aiInvasionTarget(e)){
  const seen=state.reasons;state.reasons=[];const bought=buy('ord'),why=state.reasons;"""
new=""" if(war&&!(inv.counts.ord||0)&&!(inv.pending.ord||0)&&shipBuildAccess(e,'ord').ok&&aiInvasionTarget(e)){
  // 96H.10: low alloy income caps the monthly budget below one army's price
  // even when the stock pays it (seed23: budget 48-59, price 70, stock 82-118),
  // so a held siege ends in catastrophe. As 96C.1 does for one basic hull, the
  // army may use that stock above the reserve; every other gate still applies.
  const cap=budget,price=shipCost(e,'ord').ala||0;
  if(price>budget&&(e.res.ala||0)-price>=reserve)budget=price;
  const seen=state.reasons;state.reasons=[];const bought=buy('ord'),why=state.reasons;
  if(!bought)budget=cap;"""
assert s.count(old)==1;s=s.replace(old,new);open(p,'w',encoding='utf8').write(s)
