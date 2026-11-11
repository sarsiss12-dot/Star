'use strict';
// Research candidates only. None is installed in production by this module.
exports.install=(h,mode)=>{
 if(mode==='base')return;
 if(mode==='goods-upkeep'){exports.install(h,'upkeep');exports.install(h,'goods-trade');return;}
 if(mode==='goods-input'){exports.install(h,'goods-trade');exports.install(h,'input-plan');return;}
 if(mode==='mineral-input'){exports.install(h,'trade');exports.install(h,'input-plan');return;}
 if(mode==='save')h.run(`
  var recoveryInvestment0=aiRecoveryInvestment;
  aiRecoveryInvestment=function(e,plan){const old=recoveryInvestment0(e,plan);if(old)return old;
   if(!plan.critical||!(plan.rows.tuk.net<0&&plan.rows.tuk.months<3))return null;
   const key='maden',cost=buildingCost(e,key),wait=(cost.min-plan.rows.min.stock)/Math.min(e.inc.min||0,plan.rows.min.net);
   if(!(wait>0&&wait<=12))return null;
   const viable=e.colonies.some(c=>{const s=G.sys[c.s],p=s?.planets[c.p];return p?.owner===e.id&&p.col&&(p.col.b.maden||0)+colonyQueuedOf(p.col,key)<BUILDINGS.maden.max&&['ene','min','yiy','ala','tuk'].every(r=>{const d=aiBuildingDelta(e,s,p,key)[r],net=plan.rows[r].net+d;return d>=0||net>=0||plan.rows[r].stock>=-net*6;});});
   return viable?{key,resource:'min',months:wait,cost}:null;
  };`);
 else if(mode==='hold')h.run(`
  var recoveryQueueBuilding0=queueBuilding,recoveryQueueShip0=queueShip;
  function holdRecoverySpending(e,cost){if(!e.ai||e.dead||!(cost.min>0))return false;const p=aiEconomyPlan(e);return p.rows.tuk.net<0&&p.rows.tuk.months<3&&p.rows.min.stock<BUILDINGS.fabrika.c.min;}
  queueBuilding=function(e,s,p,k){if(holdRecoverySpending(e,buildingCost(e,k))&&!['maden','ciftlik','fabrika','santral'].includes(k))return false;return recoveryQueueBuilding0.apply(this,arguments);};
  queueShip=function(e,s,k){if(holdRecoverySpending(e,shipCost(e,k))&&!aiObservedThreat(e,e.home,false))return false;return recoveryQueueShip0.apply(this,arguments);};`);
 else if(mode==='trade')h.run(`
  var recoverTrade0=aiRecoverEconomy;
  aiRecoverEconomy=function(e){if(recoverTrade0(e))return true;if(!e.ai||e.id===0||e.dead||e.aiTalk?.recoveryTrade?.until>G.day)return false;
   const p=aiEconomyPlan(e);if(!(p.rows.tuk.net<0&&p.rows.tuk.months<3&&p.rows.min.stock<BUILDINGS.fabrika.c.min))return false;
   const want=Math.min(120,Math.ceil(BUILDINGS.fabrika.c.min-p.rows.min.stock));
   const sellers=G.emps.filter(o=>o.ai&&o.id!==0&&o!==e&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&!e.war[o.id]&&(e.rel[o.id]||0)>20).sort((a,b)=>(e.rel[b.id]||0)-(e.rel[a.id]||0)||a.id-b.id);
   for(const r of['ene','ala']){const price=Math.ceil(want*1.4/(r==='ene'?1:3.2)*1.2);if(p.rows[r].stock-price<p.rows[r].reserve)continue;
    for(const o of sellers){const n=aiNegotiate(e,o,[{t:'res',r,v:price}],[{t:'res',r:'min',v:want}],true);if(n.uygulandi){(e.aiTalk||(e.aiTalk={})).recoveryTrade={until:G.day+120};return true;}}
   }return false;
  };`);
 else if(mode==='goods-trade')h.run(`
  var goodsRecover0=aiRecoverEconomy;
  aiRecoverEconomy=function(e){if(goodsRecover0(e))return true;if(!e.ai||e.id===0||e.dead||e.aiTalk?.recoveryTrade?.until>G.day)return false;
   const p=aiEconomyPlan(e),need=['tuk','yiy'].filter(r=>p.rows[r].net<0&&p.rows[r].months<3).sort((a,b)=>p.rows[a].months-p.rows[b].months)[0];if(!need)return false;
   const amount=Math.min(120,Math.ceil(-p.rows[need].net*6-p.rows[need].stock));if(amount<10)return false;
   const sellers=G.emps.filter(o=>o.ai&&o.id!==0&&o!==e&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&!e.war[o.id]&&(e.rel[o.id]||0)>20).sort((a,b)=>(e.rel[b.id]||0)-(e.rel[a.id]||0)||a.id-b.id);
   for(const r of['ene','ala']){const price=Math.ceil(amount*1.25);if(p.rows[r].net<0||p.rows[r].stock-price<p.rows[r].reserve)continue;
    for(const o of sellers){const n=aiNegotiate(e,o,[{t:'res',r,v:price}],[{t:'res',r:need,v:amount}],true);if(n.uygulandi){(e.aiTalk||(e.aiTalk={})).recoveryTrade={until:G.day+120};return true;}}
   }return false;
  };`);
 else if(mode==='input-plan'||mode==='input-upkeep'){
  if(mode==='input-upkeep')exports.install(h,'upkeep');
  h.run(`var inputInvestment0=aiRecoveryInvestment;
   aiRecoveryInvestment=function(e,plan){const normal=inputInvestment0(e,plan);if(normal)return normal;
    if(!(plan.rows.tuk.net<0&&plan.rows.tuk.months<3))return null;
    const need=e.colonies.some(c=>{const s=G.sys[c.s],p=s?.planets[c.p];if(!p?.col||p.owner!==e.id||(p.col.b.fabrika||0)+colonyQueuedOf(p.col,'fabrika')>=BUILDINGS.fabrika.max)return false;
     const delta=aiBuildingDelta(e,s,p,'fabrika'),net=plan.rows.min.net+delta.min;return net<0&&plan.rows.min.stock-BUILDINGS.fabrika.c.min<-net*6;});
    if(!need)return null;
    const cost=buildingCost(e,'maden'),rate=Math.min(e.inc.min||0,plan.rows.min.net),wait=rate>0?Math.max(0,(cost.min-plan.rows.min.stock)/rate):Infinity;
    if(wait>12)return null;
    const viable=e.colonies.some(c=>{const s=G.sys[c.s],p=s?.planets[c.p];if(!p?.col||p.owner!==e.id||(p.col.b.maden||0)+colonyQueuedOf(p.col,'maden')>=BUILDINGS.maden.max)return false;
     const d=aiBuildingDelta(e,s,p,'maden');return d.min>0&&['ene','min','yiy','tuk','ala'].every(r=>d[r]>=0||plan.rows[r].net+d[r]>=0||plan.rows[r].stock+Math.max(0,Math.min(e.inc[r]||0,plan.rows[r].net))*wait-(cost[r]||0)>=-(plan.rows[r].net+d[r])*6);});
    return viable?{key:'maden',resource:'min',months:wait,cost}:null;
   };`);
 }
 else if(mode==='upkeep')h.run(`
  ${exports.upkeepSource()}
 `);
 else throw Error('Unknown recovery candidate '+mode);
};
exports.upkeepSource=()=>`function aiRecoverEconomy(e){
 if(!e.ai||e.id===0||e.dead||e.aiTalk?.['economy-recovery']?.until>G.day)return false;
 const min=e.res.min||0,legacy=min<BUILDINGS.maden.c.min&&((e.inc.min||0)<0||e.crisis==='enerji'&&(e.res.ene||0)<=0);
 let input=false,plan;
 if(!legacy&&min<BUILDINGS.maden.c.min&&!Object.keys(e.war||{}).some(id=>e.war[id]&&!G.emps[id]?.wild)){
  plan=aiEconomyPlan(e);input=plan.rows.tuk.net<0&&plan.rows.tuk.months<3&&plan.rows.min.net>0&&plan.rows.min.net<BUILDINGS.fabrika.u.min;
 }
 if(!legacy&&!input)return false;
 const candidates=[];
 for(const c of e.colonies){const sys=G.sys[c.s],pl=sys?.planets[c.p];if(!pl?.col||pl.owner!==e.id||colonyJobs(pl.col)>0)continue;
  for(const [key,n]of Object.entries(pl.col.b)){
   if(!n||['santral','maden','ciftlik','liman','tersane'].includes(key))continue;
   const d=aiBuildingDelta(e,sys,pl,key,false,-1);
   const benefit=(((e.inc.min||0)<0||input)?Math.max(0,d.min)*3:0)+(e.crisis==='enerji'?Math.max(0,d.ene)*3:0);
   if(benefit<=0||d.yiy<0&&(e.inc.yiy||0)<0||d.tuk<0&&(e.inc.tuk||0)<0)continue;
   if(input&&!['ene','min','yiy','tuk','ala'].every(r=>d[r]>=0||plan.rows[r].net+d[r]>=0||plan.rows[r].stock>=-(plan.rows[r].net+d[r])*6))continue;
   candidates.push({sys,pl,key,score:benefit-Math.max(0,-d.ala)*.4-Math.max(0,-d.ara)*.15});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||a.sys.id-b.sys.id||a.key.localeCompare(b.key));
 const pick=candidates[0];if(!pick||pick.score<=0||!queueDemolish(e,pick.sys,pick.pl,pick.key))return false;
 (e.aiTalk||(e.aiTalk={}))['economy-recovery']={until:G.day+120,reason:'Paid demolition: '+pick.key};
 AIDiagnostics.note('recovery:demolish',e,null,pick.key+'; inputs/upkeep stop only on completion; actual refund only');return true;
}`;
