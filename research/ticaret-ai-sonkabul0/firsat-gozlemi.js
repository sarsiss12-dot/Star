/* campaign.cjs tarafından aynı VM'de yüklenen, oyun kararı üretmeyen gözlem. */
{
  const BASE = {ene:80, min:60, yiy:40, ala:60, tuk:40};
  const resources = Object.keys(BASE);
  const productive = {ene:'santral', min:'maden', yiy:'ciftlik', ala:'dokum', tuk:'fabrika'};
  const stages = [
    'no-contact', 'political', 'no-pact', 'no-export', 'no-port',
    'unknown-port', 'no-route', 'no-barter', 'other-resource', 'quote-rejected',
    'unacceptable', 'late', 'timely'
  ];
  const original = observe;
  const openEpisodes = new Set();
  T.tradeAudit = {episodes:[], budget:[], forecast:[]};
  const pendingBudget = [];
  const oldNote = AIDiagnostics.note;
  AIDiagnostics.note = function(code, a, b, why) {
    if (code === 'trade-route-budget' && a?.id && b?.id) pendingBudget.push([a.id,b.id]);
    return oldNote.call(this, code, a, b, why);
  };

  function travelDays(path) {
    return 2 * Commerce.prepareDays + path.slice(1).reduce((days,id,i) =>
      days + Math.max(1, dist(G.sys[path[i]], G.sys[id]) / Commerce.speed), 0);
  }

  // This branch is used only with a separately restored monthly world.
  function alternatives(e, b, r, aBalance, daysToReserve) {
    if (!e.contact?.[b.id] || !b.contact?.[e.id]) return {stage:'no-contact'};
    const gate = Commerce.pairGate(e,b);
    if (gate) return {stage:gate === 'Genel ticaret anlaşması yok' ? 'no-pact' : 'political', gate};
    const bBalance = Commerce.aiBalance(b);
    if (bBalance[r].export < 1) return {stage:'no-export'};
    if (!tradeHubs(e).length || !tradeHubs(b).length) return {stage:'no-port'};
    if (!tradeHubs(b).some(id => Commerce.identifiedPort(e,G.sys[id],b))) return {stage:'unknown-port'};
    const ports = Commerce.aiPorts(e,b,{routes:96});
    if (!ports) return {stage:'no-route'};
    const offer = Commerce.aiTerms(e,b,aBalance,bBalance,ports);
    if (!offer) return {stage:'no-barter'};
    const [received] = offer.want;
    const [sent] = offer.give;
    if (received.r !== r) return {stage:'other-resource', resource:received.r};
    const quote = dealQuote(offer);
    if (!quote.ok) return {stage:'quote-rejected', why:quote.reasons[0]};
    const incoming = Commerce.route(b,e,received.source,received.target,{avoidObserved:true,volume:received.v});
    const outgoing = Commerce.route(e,b,sent.source,sent.target,{avoidObserved:true,volume:sent.v});
    if (!incoming || !outgoing) return {stage:'no-route'};
    // Evaluate contract economics with the same AI value function; the audit
    // makes no random response call and does not promise the actual vote.
    const eValue = Commerce.aiValue(e,{from:b.id,to:e.id,give:offer.want,want:offer.give});
    const bValue = Commerce.aiValue(b,offer);
    const days = travelDays(incoming);
    return {stage:eValue.net<=0 || bValue.net<=0 ? 'unacceptable' : days>daysToReserve ? 'late' : 'timely',
      partner:b.id, days, backDays:travelDays(outgoing), received, sent, value:[eValue.net,bValue.net]};
  }

  function forecast(e, resource, row, shipments) {
    const runRate = -row.net / 30;
    const deadline = Math.max(0,(row.stock-BASE[resource])/runRate);
    // Only stock already loaded, with known live route and nonzero amount.
    // Treat even that stock as a scenario rather than a certain receipt.
    const arrivals = shipments.filter(v => v.to === e.id && v.r === resource &&
        v.amount > 0 && ['moving','preparing'].includes(v.status)).map(v => {
      const eta = Math.max(0,v.depart-G.day) + v.route.slice(v.step+1).reduce((days,id,i) =>
        days + Math.max(1,dist(G.sys[v.route[v.step+i]],G.sys[id])/Commerce.speed)*(i===0 ? 1-v.t : 1),0);
      return {id:v.id,eta,amount:v.amount};
    }).sort((a,b) => a.eta-b.eta || a.id-b.id);
    const onTime = arrivals.filter(v => v.eta<=deadline).reduce((sum,v) => sum+v.amount,0);
    return {deadline, arrivals, onTime, ifOnTimeDeadline:deadline+onTime/runRate};
  }

  observe = function() {
    const actual = original();
    const states = G.emps.filter(ai);
    const shipments = Commerce.state().convoys.filter(v => !Commerce.terminal(v));
    const ep = [], budget = [];
    for (const e of states) {
      const balance = Commerce.aiBalance(e);
      for (const resource of resources) {
        const row = balance[resource], key = e.id+':'+resource;
        if (row.net>=0 || (row.stock-BASE[resource])*30 > -row.net*180) {
          openEpisodes.delete(key);
          continue;
        }
        const projected = forecast(e,resource,row,shipments);
        if (projected.arrivals.length) T.tradeAudit.forecast.push({day:G.day,e:e.id,resource,row,...projected});
        for (const [a,b] of pendingBudget) if (a===e.id || b===e.id)
          budget.push({e:e.id,b:a===e.id?b:a,resource,deadline:projected.deadline});
        if (openEpisodes.has(key)) continue;
        openEpisodes.add(key);
        ep.push({e:e.id,resource,row,deadline:projected.deadline,ports:tradeHubs(e).length});
      }
    }
    pendingBudget.length = 0;
    if (!ep.length && !budget.length) return actual;
    const saved = serialize();
    try {
      // Nothing is evaluated on the live world. The launcher supplies a
      // second independent VM for policy-free counterfactual quotation.
      const audit = JSON.parse(probeAudit(saved,JSON.stringify({ep,budget})));
      T.tradeAudit.episodes.push(...audit.episodes);
      T.tradeAudit.budget.push(...audit.budget);
    } catch (error) {
      throw Error('Fırsat gözlemi: '+error.message);
    }
    return actual;
  };

  globalThis.evaluateAudit = function(spec) {
    const result = {episodes:[],budget:[]};
    for (const item of spec.ep) {
      const e = G.emps[item.e];
      const balance = Commerce.aiBalance(e);
      const options = G.emps.filter(b=>ai(b)&&b!==e).map(b=>({b:b.id,...alternatives(e,b,item.resource,balance,item.deadline)}));
      const ordered = options.slice().sort((a,b)=>stages.indexOf(b.stage)-stages.indexOf(a.stage));
      const build = productive[item.resource];
      const local = e.colonies.flatMap(c=>{
        const s=G.sys[c.s], p=s?.planets[c.p];
        if (!p?.col) return [];
        const price=buildingOrderCost(e,p,build), port=buildingOrderCost(e,p,'liman');
        return [{s:c.s,q:p.col.q?.length||0,production:price?aiBuildingDelta(e,s,p,build)[item.resource]||0:0,
          productionCost:price||null,portCost:port||null}];
      });
      result.episodes.push({day:G.day,...item,best:ordered[0]?.stage,options,local});
    }
    for(const item of spec.budget){
      const e=G.emps[item.e],b=G.emps[item.b];
      result.budget.push({day:G.day,...item,...alternatives(e,b,item.resource,Commerce.aiBalance(e),item.deadline)});
    }
    return result;
  };
}
