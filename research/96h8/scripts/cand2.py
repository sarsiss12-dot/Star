import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:80]
    s=s.replace(old,new)
anchor="/* 96F.4: settlement is a new economy, not just a paid hull."
rep(anchor,"""/* 96H.8: an attack order changes real upkeep before any battle. fleetUpkeep
   halves energy upkeep only in own/claimed space and both upkeeps grow with
   the supply gap. A deficit-funded deployment must outlast the 180-day
   campaign hold without entering aiDisbandTick's six-month wartime crisis
   band, i.e. 6+6 months of the projected deficit. Read-only; no RNG. */
function aiDeploymentUpkeep(e,fleets,target){
 const up=1+(e.mods.upMul||0),mob=hasCivic(e,'mobilize')&&!Object.keys(e.war||{}).some(k=>e.war[k])?2:1,at={sys:target.id,mv:null};
 let ene=0,ala=0;
 for(const f of fleets){
  const now=fleetSupply(e,f),then=fleetSupply(e,{sys:target.id,mv:null,ships:f.ships,e:e.id}),home=fleetInHome(e,f)?.5:1,away=fleetInHome(e,at)?.5:1;
  for(const sh of f.ships){ene+=SHIPS[sh.c].up*mob*(away*(1+(1-then)*2.2)-home*(1+(1-now)*2.2));ala+=(SHIPS[sh.c].upA||0)*(now-then)*1.4;}
 }
 return {ene:ene*up,ala:ala*up};
}
function aiDeploymentSustainable(e,fleets,target,plan){
 const d=aiDeploymentUpkeep(e,fleets,target);
 for(const r of ['ene','ala']){const row=plan.rows[r],net=Math.min(e.inc[r]||0,row.net)-d[r];if(net<0&&row.stock<-net*12)return false;}
 return true;
}
/* aiTurn merges idle co-located warships before the campaign decides, so the
   rally stack is indivisible. When it cannot be funded, detach the ships with
   the lowest upkeep per combat power that still meet the need, using the same
   hull-preserving split as the player's fleet split. The leader stays with the
   parent, so detached power is counted without it; the detachment's own size is
   its template cap, so aiFleetTemplate never grows it toward the full-fleet cap. */
function aiCampaignDetachment(e,ready,target,need,plan){
 const rows=[];
 for(const f of ready)f.ships.forEach((sh,i)=>{const p=fleetPower({e:f.e,ships:[sh]});rows.push({f,sh,i,p,cost:(SHIPS[sh.c].up+(SHIPS[sh.c].upA||0))/Math.max(1,p)});});
 rows.sort((a,b)=>a.cost-b.cost||b.p-a.p||a.f.id-b.f.id||a.i-b.i);
 const groups=new Map();let power=0;
 for(const r of rows){if(power>=need)break;if(!groups.has(r.f))groups.set(r.f,[]);groups.get(r.f).push(r.sh);power+=r.p;}
 if(power<need)return null;
 const probes=[...groups].map(([f,ships])=>({e:f.e,sys:f.sys,mv:f.mv,ships}));
 if(!aiDeploymentSustainable(e,probes,target,plan))return null;
 return [...groups].map(([f,ships])=>{
  if(ships.length===f.ships.length)return f;
  f.ships=f.ships.filter(sh=>!ships.includes(sh));
  const nf=newFleet(e,f.sys,ships);nf.ships=ships;nf.stance=f.stance;nf.capTarget=ships.length;return nf;
 });
}
"""+anchor)
rep("""  const failed={...(old?.failedTargets||{})};
  if(old?.target!==undefined&&G.day-(old.lastProgress??old.since??G.day)>540){""","""  const failed={...(old?.failedTargets||{})};
  // 96H.8: a failed-target cooldown is fixed when recorded. Re-stamping it on
  // every deferred turn moved the deadline forward forever; an expired record
  // retries the target with a new progress window.
  const retry=old?.target!==undefined&&Object.hasOwn(failed,old.target)&&failed[old.target]<=G.day;
  if(old?.target!==undefined&&!Object.hasOwn(failed,old.target)&&G.day-(old.lastProgress??old.since??G.day)>540){""")
rep("""  const advanced=!old||old.target!==target.id||reachable>(old.bestPower||0)*1.05||approach<(old.bestDistance??Infinity)-5;
  e.aiCampaign={failedTargets:failed,lastProgress:advanced?G.day:old.lastProgress??old.since,bestPower:Math.max(reachable,old?.target===target.id?old.bestPower||0:0),bestDistance:Math.min(approach,old?.target===target.id?old.bestDistance??Infinity:Infinity),target:target.id,rally:rally.id,phase:reachable<need?'build':gathered<need?'gather':'attack',
    since:old&&old.target===target.id?old.since:G.day,until:old&&old.target===target.id&&old.until>G.day?old.until:G.day+180,
    need,power:reachable,reason:reachable<need?'Tahmini savunma için kuvvet yetersiz':gathered<need?'Ulaşabilir filolar toplanıyor':'Kuvvet birlikte taarruz ediyor'};
  if(gathered>=need){for(const f of ready)aiMove(e,f,target.id);}""","""  const continuing=old?.target===target.id&&!retry;
  const advanced=!continuing||reachable>(old.bestPower||0)*1.05||approach<(old.bestDistance??Infinity)-5;
  // 96H.8: an unfunded full dispatch sends only a funded detachment that, with
  // forces already bound for the target, meets the same need; otherwise wait.
  let send=[],reason='Kuvvet birlikte taarruz ediyor';
  if(gathered>=need){
   const plan=aiEconomyPlan(e);
   if(aiDeploymentSustainable(e,ready,target,plan))send=ready;
   else{
    const committed=G.fleets.filter(f=>f.e===e.id&&isArmed(f)&&!ready.includes(f)&&((f.mv?f.mv.to:f.sys)===target.id||f.path.at(-1)===target.id)).reduce((n,f)=>n+fleetPower(f),0);
    if(committed>=need)reason='Hedefe yeterli kuvvet sevk edildi';
    else{send=aiCampaignDetachment(e,ready,target,need-committed,plan)||[];reason=send.length?'Bakımı karşılanan müfreze taarruz ediyor':null;}
   }
  }
  const fund=gathered>=need&&!reason;
  e.aiCampaign={failedTargets:failed,lastProgress:advanced?G.day:old.lastProgress??old.since,bestPower:Math.max(reachable,continuing?old.bestPower||0:0),bestDistance:Math.min(approach,continuing?old.bestDistance??Infinity:Infinity),target:target.id,rally:rally.id,phase:reachable<need?'build':gathered<need?'gather':fund?'fund':'attack',
    since:continuing?old.since:G.day,until:continuing&&old.until>G.day?old.until:G.day+180,
    need,power:reachable,reason:reachable<need?'Tahmini savunma için kuvvet yetersiz':gathered<need?'Ulaşabilir filolar toplanıyor':fund?'Sefer bakımı mevcut enerji/alaşım stokuyla karşılanamıyor':reason};
  for(const f of send)aiMove(e,f,target.id);""")
open(p,'w',encoding='utf8').write(s)
