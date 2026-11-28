/* Aynı doğal kampanyada oynanışa yazmadan kaynak-devlet günü sayımı. */
{
  const base = {ene:80,min:60,yiy:40,ala:60,tuk:40};
  const keys = Object.keys(base);
  const firstActivePorts = new Map();
  const surveys = T.dailyEconomy = {resourceDays:{},growth:[],firstActivePorts:[],portOrders:[]};
  const daily = dailyTick, monthly = observe;
  dailyTick = function(dt) {
    const result = daily.apply(this,arguments);
    for (const e of G.emps.filter(ai)) {
      const days = surveys.resourceDays[e.id] ||= Object.fromEntries(keys.map(r=>[r,{below:0,empty:0}]));
      for (const r of keys) {
        if (!(e.inc?.[r]<0)) continue;
        if (e.res[r]<base[r]) days[r].below+=dt;
        if (e.res[r]<=1e-9) days[r].empty+=dt;
      }
    }
    return result;
  };
  const queue = queueBuilding;
  queueBuilding = function(e,s,p,key) {
    const result = queue.apply(this,arguments);
    if (result && key==='liman' && ai(e)) surveys.portOrders.push({day:G.day,e:e.id,system:s.id,planet:p.i});
    return result;
  };
  observe = function() {
    const states = monthly();
    const ships = {};
    for (const f of G.fleets) if (f.ships.length) ships[f.e]=(ships[f.e]||0)+fleetPower(f);
    const empires = G.emps.filter(ai).map(e=>{
      const ports = tradeHubs(e);
      for (const id of ports) {
        const token=e.id+':'+id;
        if (!firstActivePorts.has(token)) firstActivePorts.set(token,{day:G.day,e:e.id,system:id});
      }
      return {id:e.id,power:ships[e.id]||0,science:e.inc?.ara||0,tech:Object.values(e.techs||{}).filter(Boolean).length,
        open:Commerce.state().contracts.filter(c=>!Commerce.closed(c)&&[c.a,c.b].includes(e.id)).length};
    });
    surveys.growth.push({day:G.day,empires});
    surveys.firstActivePorts=[...firstActivePorts.values()];
    return states;
  };
}
