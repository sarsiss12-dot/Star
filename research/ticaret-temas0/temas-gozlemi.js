/* Natural campaign observer. Never writes to Save8 or consumes RNG. */
{
  const initial=new Set(G.emps.filter(ai).map(e=>e.id));
  const active=new Map();
  const found=new Set();
  const signed=new Set();
  const visits=T.contactAudit={moves:[],contacts:[],months:[],charts:[],pacts:[],scienceLosses:[]};
  const pair=(a,b)=>a<b?a+':'+b:b+':'+a;
  const note=AIDiagnostics.note;
  AIDiagnostics.note=function(code,e,other,detail){
    if(code==='scout-shared-target'){
      const [fleet,system]=detail.split(':').map(Number);
      const move={day:G.day,actor:e.id,partner:other.id,fleet,system};
      active.set(fleet,move);
      visits.moves.push(move);
    }
    return note.apply(this,arguments);
  };
  const arrival=arrive;
  arrive=function(f,s){
    const e=G.emps[f.e],old=new Set(Object.keys(e.contact||{}).filter(id=>e.contact[id]).map(Number));
    const target=f.explore?.target,move=active.get(f.id);
    const result=arrival.apply(this,arguments);
    for(const id of Object.keys(e.contact||{}).map(Number)){
      if(old.has(id)||!e.contact[id]||!initial.has(e.id)||!initial.has(id)||!G.emps[id].contact[e.id])continue;
      const key=pair(e.id,id);if(!found.has(key)){
        found.add(key);
        const shared=move?.system===s.id&&move.partner===id&&target===s.id;
        visits.contacts.push({day:G.day,a:e.id,b:id,system:s.id,fleet:f.id,
          method:shared?'paylasimli-fiziksel':scienceExplorer(f)?'bilim-fiziksel':'diger-fiziksel'});
      }
    }
    if(move&&target!==move.system)active.delete(f.id);
    return result;
  };
  const share=shareVision;
  shareVision=function(giver,taker){
    const added=share.apply(this,arguments);
    if(added&&giver&&taker)visits.charts.push({day:G.day,from:giver.id,to:taker.id,added});
    return added;
  };
  const execute=executeDeal;
  executeDeal=function(offer){
    const ok=execute.apply(this,arguments);
    const key=pair(offer.from,offer.to);
    if(ok&&!signed.has(key)&&[...(offer.give||[]),...(offer.want||[])].some(i=>i.t==='pact')){
      signed.add(key);visits.pacts.push({day:G.day,from:offer.from,to:offer.to});
    }
    return ok;
  };
  const recordLoss=fleetLost;
  fleetLost=function(f,why){
    if(f?.ships?.some(ship=>ship.c==='bil'))visits.scienceLosses.push({day:G.day,e:f.e,fleet:f.id,why});
    return recordLoss.apply(this,arguments);
  };
  const monthly=observe;
  observe=function(){
    const rows=monthly();
    const alive=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);
    const pairs=[],grants=[];
    for(const a of alive)for(const b of alive)if(a!==b){
      if(initial.has(a.id)&&initial.has(b.id)&&a.id<b.id&&a.contact[b.id]&&b.contact[a.id])pairs.push(pair(a.id,b.id));
      if(sensorShareActive(a,b))grants.push([b.id,a.id,!!a.visionFrom?.[b.id],!!a.shareVis?.[b.id]]);
    }
    const empires=alive.filter(ai).map(e=>({id:e.id,contacts:alive.filter(o=>o!==e&&e.contact[o.id]).length,
      pacts:alive.filter(o=>o!==e&&e.pact[o.id]&&o.pact[e.id]).length,
      sciences:G.fleets.filter(f=>f.e===e.id&&scienceExplorer(f)).length,
      wars:alive.filter(o=>o!==e&&e.war[o.id]).length,
      open:Commerce.state().contracts.filter(k=>!Commerce.closed(k)&&[k.a,k.b].includes(e.id)).length}));
    const biggest=Math.max(0,...(G.feds||[]).map(f=>f.members.filter(id=>alive.some(e=>e.id===id)).length))/alive.length;
    visits.months.push({day:G.day,pairs,grants,empires,biggest});
    return rows;
  };
}
