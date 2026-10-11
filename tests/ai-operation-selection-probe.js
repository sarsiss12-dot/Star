'use strict';
const path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
function measure(root,seed,steps=120){
  const h=runtime({root:path.resolve(root)});
  h.loadSave(process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`for(const e of G.emps){
    if(e.dead||e.wild)continue;
    for(const r in e.res)e.res[r]=50000;
    e.intel={};e.intelP={};e.opLog=[];e.hitLog=[];
    for(const o of G.emps)if(o!==e&&!o.dead&&!o.wild){
      e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=-20;
    }
  }
  var stats={calls:0,executed:0,rejected:0,types:{},reasons:{},
    special:{stealTech:{calls:0,resolved:0,rejected:0},incite:{calls:0,resolved:0,rejected:0}},
    selectedInvalid:0,quotaViolations:0,maxResolvedPerActorStep:0,pickRngChanges:0};
  var resolved={};
  function countQuota(e,r){if(!r.ok)return;
    const id=G.memAge+':'+e.id;resolved[id]=(resolved[id]||0)+1;
    stats.maxResolvedPerActorStep=Math.max(stats.maxResolvedPerActorStep,resolved[id]);
    if(resolved[id]>(hasCivic(e,'shadow')?2:1))stats.quotaViolations++;
  }
  var oldRun=runOp,oldSteal=stealTech,oldIncite=inciteRebellion,oldPick=aiPickOp;
  runOp=function(e,o,k){stats.calls++;const r=oldRun(e,o,k);countQuota(e,r);
    if(r.ok){stats.executed++;stats.types[k]=(stats.types[k]||0)+1;}
    else{stats.rejected++;stats.reasons[r.msg]=(stats.reasons[r.msg]||0)+1;}return r;};
  stealTech=function(e,o){const s=stats.special.stealTech;s.calls++;const r=oldSteal(e,o);
    s[r.ok?'resolved':'rejected']++;countQuota(e,r);return r;};
  inciteRebellion=function(e,o){const s=stats.special.incite;s.calls++;const r=oldIncite(e,o);
    s[r.ok?'resolved':'rejected']++;countQuota(e,r);return r;};
  aiPickOp=function(e,o){const rng=RND_STATE,k=oldPick(e,o);
    if(rng!==RND_STATE)stats.pickRngChanges++;
    if(k&&Object.prototype.hasOwnProperty.call(OPS,k)&&!opQuote(e,o,k).ok)stats.selectedInvalid++;
    return k;};
  rndSeed(${seed});
  for(let step=0;step<${steps};step++){G.day+=30;G.memAge++;aiOpsTick();}
  `);
  const world=h.run('JSON.stringify([G.emps,G.sys,G.fleets,G.log,G.inbox,RND_STATE,G.day,G.memAge])');
  return {seed,steps,...JSON.parse(h.run('JSON.stringify(stats)')),
    rng:h.run('RND_STATE'),stateSha256:crypto.createHash('sha256').update(world).digest('hex')};
}
module.exports={measure};
if(require.main===module){
  const root=process.argv[2]||path.join(__dirname,'..');
  console.log(JSON.stringify({kind:'Operation-only laboratory; contact/intel/resources prepared; no daily exploration/economy; special resolved is not success',
    runs:[11,99,404].map(seed=>measure(root,seed))},null,2));
}
