from pathlib import Path
p=Path(__file__).resolve().parents[1]/'candidate/ai.js'
s=p.read_text()
a="""  if(old?.target!==undefined&&G.day-(old.lastProgress??old.since??G.day)>540){failed[old.target]=G.day+360;aiPlanEvent(e,'campaign-reassessed',{target:old.target,reason:'18 ay sefer ilerlemesi yok'});}"""
b="""  // A failed-target deadline is fixed until it expires; retry starts a new
  // progress window instead of extending the same cooldown every AI turn.
  const retry=old?.target!==undefined&&Object.hasOwn(failed,old.target)&&failed[old.target]<=G.day;
  if(old?.target!==undefined&&!Object.hasOwn(failed,old.target)&&G.day-(old.lastProgress??old.since??G.day)>540){failed[old.target]=G.day+360;aiPlanEvent(e,'campaign-reassessed',{target:old.target,reason:'18 ay sefer ilerlemesi yok'});}"""
assert s.count(a)==1;s=s.replace(a,b)
a="""  const advanced=!old||old.target!==target.id||reachable>(old.bestPower||0)*1.05||approach<(old.bestDistance??Infinity)-5;
  e.aiCampaign={failedTargets:failed,lastProgress:advanced?G.day:old.lastProgress??old.since,bestPower:Math.max(reachable,old?.target===target.id?old.bestPower||0:0),bestDistance:Math.min(approach,old?.target===target.id?old.bestDistance??Infinity:Infinity),target:target.id,rally:rally.id,phase:reachable<need?'build':gathered<need?'gather':'attack',
    since:old&&old.target===target.id?old.since:G.day,until:old&&old.target===target.id&&old.until>G.day?old.until:G.day+180,"""
b="""  const continuing=old?.target===target.id&&!retry;
  const advanced=!continuing||reachable>(old.bestPower||0)*1.05||approach<(old.bestDistance??Infinity)-5;
  e.aiCampaign={failedTargets:failed,lastProgress:advanced?G.day:old.lastProgress??old.since,bestPower:Math.max(reachable,continuing?old.bestPower||0:0),bestDistance:Math.min(approach,continuing?old.bestDistance??Infinity:Infinity),target:target.id,rally:rally.id,phase:reachable<need?'build':gathered<need?'gather':'attack',
    since:continuing?old.since:G.day,until:continuing&&old.until>G.day?old.until:G.day+180,"""
assert s.count(a)==1;p.write_text(s.replace(a,b))
