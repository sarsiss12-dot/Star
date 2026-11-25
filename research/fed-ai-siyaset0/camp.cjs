// node camp.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9 · CAMP_TENSION=calkantili · CAMP_RIVALS=<preset> · PLACEBO_DAY=<gün>]
// FED-AI-SİYASET.0 kampanya ölçümü: federasyon siyaseti + diplomatik temas / keşif + jointOps hunisi. Dünyaya yazmaz, RNG çekmez:
// sarmalayıcılar sayar; saf tanı hesapları fedFoundRead içinde (alt çizgili önbellekler geri konur) ve her ay RND_STATE / Save8 SHA kaydedilir.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.PL=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.sb.TEN=process.env.CAMP_TENSION||null;h.sb.RIV=process.env.CAMP_RIVALS||null;
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});if(TEN)CFG.tension=TEN;if(RIV&&typeof rivalPreset==='function'){const r=rivalPreset(RIV,AIS);if(r)CFG.aiRivals=r;}
setupGame({...CFG});G.autoSave=false;
var C={ev:{found:0,join:0,leave:0,expel:0,dissolve:0,apply:0,propose:0},rival:{calls:0,apply:0,propose:0,raider:0,none:{}},stay:{calls:0,strained:0,atThreshold:0,noAlt:0,leave:0,conflict:[]},
 votes:{},joint:{create:{},close:{},closeReason:{},arrivedFleets:0,plans:0,captured:0,ctxSides:0,ctxNone:{}},prize:{nests0:0,ruins0:0},snap:[],leaders:{},leaderChanges:0};
const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
{const f=fedPoliticalRecord;fedPoliticalRecord=function(fd,ev,data){if(['found','founded'].includes(ev))C.ev.found++;else if(ev==='join')C.ev.join++;else if(ev==='leave')C.ev.leave++;else if(ev==='expel')C.ev.expel++;
  else if(ev==='vote'&&data){const k=(fd.type||'?')+':'+(data.kind||'basic')+':'+(data.law||'')+(fd.lastVote&&fd.lastVote.motion?fd.lastVote.motion+(fd.lastVote.type?'>'+fd.lastVote.type:''):'');const o=C.votes[k]||(C.votes[k]={n:0,pass:0});o.n++;if(data.passed)o.pass++;}
  else if(ev==='motion'&&data){inc(C.ev,'motion:'+data.kind);}return f.apply(this,arguments);};}
if(typeof aiFedMemberReform==='function'){const f=aiFedMemberReform;aiFedMemberReform=function(){const r=f.apply(this,arguments);if(r)inc(C.ev,'memberReformProposal');return r;};}
{const f=leaveFederation;leaveFederation=function(e){const why=e&&e.aiFedReason;const had=!!findFed(e);const r=f.apply(this,arguments);if(had&&!findFed(e)){C.leaveWhy=C.leaveWhy||[];C.leaveWhy.push({d:Math.floor(G.day),e:e.id,p:personaKey(e)});}return r;};}
{const f=leaveFederation;leaveFederation=function(e){const had=!!findFed(e);const r=f.apply(this,arguments);if(had&&!findFed(e))C.ev.leave++;return r;};}
{const f=fedRemoveMember;fedRemoveMember=function(fd,id,why){if(why==='expel')C.ev.expel++;return f.apply(this,arguments);};}
{const f=fedDissolve;fedDissolve=function(){C.ev.dissolve++;return f.apply(this,arguments);};}
{const f=aiRivalBlocChoice;aiRivalBlocChoice=function(e){C.rival.calls++;const before=JSON.stringify(e.aiFedReason||null);
  const pre=fedFoundRead(()=>{const join=G.emps.filter(o=>o!==e&&e.contact[o.id]&&findFed(o)&&canRequestFederation(e,o).ok).map(o=>aiFedWilling(e,o,findFed(o).type,findFed(o)));
   const jOk=join.filter(a=>a.ok);const type=Object.keys(FED_TYPES).sort((a,b)=>aiFedAffinity(e,b)-aiFedAffinity(e,a)||a.localeCompare(b))[0];
   const founders=G.emps.filter(o=>o!==e&&o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&!fedFoundHuman(o)&&fedFoundCandidate(e,o).ok);
   const fsx=founders.map(o=>({o,s:aiFedAdmissionScore(e,o,type).score})).filter(x=>x.s>=.5),fs=fsx.map(x=>x.s);
   const wq=fsx.map(x=>aiFoundWilling(x.o,e,{type,ballot:'equal',members:[e.id,x.o.id]})),willing=fsx.filter((x,i)=>wq[i].ok);
   if(!willing.length&&wq.length){const w=String(wq[0].why||'?').replace(/[0-9.,]+/g,'#').slice(0,70);C.rival.unwillingWhy=C.rival.unwillingWhy||{};C.rival.unwillingWhy[w]=(C.rival.unwillingWhy[w]||0)+1;}
   const tempo=(G.fedFounding?.proposals||[]).some(p=>G.emps[p.by]?.ai&&Math.floor(p.opened/30)===Math.floor(G.day/30))||(G.feds||[]).some(f=>Math.floor(f.founded/30)===Math.floor(G.day/30));
   const avg=willing.length?willing.slice(0,3).reduce((n,x)=>n+x.s,0)/Math.min(3,willing.length)+aiBlocThreat(e).bonus:0;
   return {willing:willing.length,tempo,pending:aiPendingPoliticalCommitment(e),avg,contacts:G.emps.filter(o=>o!==e&&e.contact[o.id]&&!o.dead&&!o.wild).length,joinable:join.length,joinOk:jOk.length,founders:founders.length,foundersOk:fs.length,cost:fedFoundCost(e,[e.id]),etk:Math.floor(e.res.etk||0),type,crit:aiEconomyPlan(e).critical};});
  const r=f.apply(this,arguments);const after=e.aiFedReason;const changed=JSON.stringify(after||null)!==before;
  if(changed&&after.kind==='apply')C.rival.apply++;else if(changed&&after.kind==='propose')C.rival.propose++;else if(pre.type==='yagmaci'&&!pre.joinOk)C.rival.raider++;
  else{const k=!pre.contacts?'temas-yok':pre.joinOk?'katilim-var-ama-uygulanmadi':pre.crit?'ekonomik-kriz':!pre.founders?'kurucu-aday-yok':!pre.foundersOk?'kurucu-puan<0.5':pre.tempo?'ayni-ay-baska-kurulus':pre.pending?'baska-surece-bagli':!pre.willing?'ortak-istemiyor':pre.etk<pre.cost?'etki-yetersiz':pre.avg<.5?'kurulus-puan<0.5':'diger';inc(C.rival.none,k);}
  return r;};}
{const f=aiFedStayReview;aiFedStayReview=function(e,fd){const s0=e._fedStrain||0;const r=f.apply(this,arguments);
  if(e.ai&&fd.leader!==e.id&&!fd.vote&&G.day-(fd.dutyConsent?.[e.id]?.since??fd.founded)>=720){C.stay.calls++;
   const conflict=fedFoundRead(()=>(45-fedCohesion(fd))/100+(-(e.rel[fd.leader]||0))/150+(.45-aiFedAffinity(e,fd.type))+(aiBlocThreat(e).bonus?0:-.05));
   if(C.stay.conflict.length<4000)C.stay.conflict.push(Math.round(conflict*100)/100);if(conflict>.15)C.stay.strained++;
   if((e._fedStrain||0)>=Math.round(12+8*aiHonesty(e))&&!r)C.stay.noAlt++;if(r)C.stay.leave++;}
  return r;};}
{const f=jointCreate;jointCreate=function(ctx,kind){const r=f.apply(this,arguments);inc(C.joint.create,r.ok?'ok:'+kind:String(r.why||'?').slice(0,70));if(r.ok)C.joint.plans++;return r;};}
{const f=jointClose;jointClose=function(p,state,reason){if(jointActive(p)){inc(C.joint.close,state);inc(C.joint.closeReason,String(reason).slice(0,60));C.joint.arrivedFleets+=(p.fleets||[]).filter(x=>x.arrived).length;}return f.apply(this,arguments);};}
{const f=captureSystem;captureSystem=function(s,owner){const st=new Error().stack||'';if(/jointAdvance/.test(st))C.joint.captured++;return f.apply(this,arguments);};}
{const f=jointAuto;jointAuto=function(){fedFoundRead(()=>{for(const front of G.warLedger?.fronts||[]){if(front.ended!==null||!warLedgerPair(...front.sides))continue;
  for(let i=0;i<2;i++){const sp=front.sides[i];if(!G.emps[sp]||!G.emps[sp].ai)continue;C.joint.ctxSides++;const ctx=jointContext(front.campaign,front.roles[i],sp,front.sides[1-i]);
   if(!ctx){const same=(G.warLedger.fronts||[]).filter(x=>x.campaign===front.campaign&&x.ended===null).flatMap(x=>x.sides.filter((id,j)=>x.roles[j]===front.roles[i]&&id!==sp));
    inc(C.joint.ctxNone,!same.length?'tek-basina':same.some(id=>jointBinding(G.emps[sp],G.emps[id]))?'bagli-ama-cephe-yok':'muttefik-taraf-bagsiz');}}}});
  return f.apply(this,arguments);};}
if(PL!==null){const mt=monthTick;monthTick=function(){if(G.day>=PL&&!globalThis.__pl){globalThis.__pl=true;rnd();}return mt.apply(this,arguments);};}
C.prize.nests0=(G.nests||[]).length;C.prize.ruins0=(G.ruins||[]).length;
function snap(){const ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);const feds=(G.feds||[]).filter(f=>f.members.length);
 const aiIn=f=>f.members.filter(id=>G.emps[id]&&G.emps[id].ai&&!G.emps[id].dead).length;const sizes=feds.map(aiIn).sort((a,b)=>b-a);
 for(const f of feds){if(C.leaders[f.id]!==undefined&&C.leaders[f.id]!==f.leader)C.leaderChanges++;C.leaders[f.id]=f.leader;}
 let pairs=0,cont=0;for(const a of ais)for(const b of ais)if(a!==b){pairs++;if(a.contact[b.id])cont++;}
 return {m:Math.floor(G.day/30),ais:ais.length,feds:feds.map(f=>({id:f.id,t:f.type,n:aiIn(f),age:Math.floor((G.day-f.founded)/30)})),largest:ais.length?+(sizes[0]||0)/ais.length:0,second:ais.length?+(sizes[1]||0)/ais.length:0,
  indep:ais.filter(e=>!findFed(e)).length,contact:pairs?+(cont/pairs).toFixed(3):0,surv:+(ais.reduce((n,e)=>n+G.sys.filter(s=>s.surv.includes(e.id)).length,0)/Math.max(1,ais.length)/G.sys.length).toFixed(3),
  nests:(G.nests||[]).filter(id=>G.sys[id]&&G.sys[id].nest).length,ruins:(G.ruins||[]).length,wars:(G.warLedger?.fronts||[]).filter(f=>f.ended===null).length,
  dead:G.emps.filter(e=>e.ai&&e.dead&&!e.wild&&!e.crisisSide).length,cols:ais.reduce((n,e)=>n+e.colonies.length,0)};}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}const s=snap();if(s.m%12===0)C.snap.push(s);else for(const f of (G.feds||[]))C.leaders[f.id]=C.leaders[f.id]??f.leader;};`);
const sha=()=>crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);
const t0=Date.now(),hashes=[];for(let m=1;m<=+months;m++){h.run('__m()');hashes.push(sha()+':'+h.run('RND_STATE'));}
const r=JSON.parse(h.run('(()=>{const st=C.stay.conflict.slice().sort((a,b)=>a-b);C.stay.conflictQ=st.length?[st[0],st[Math.floor(st.length*.25)],st[Math.floor(st.length*.5)],st[Math.floor(st.length*.75)],st[st.length-1]]:[];delete C.stay.conflict;return JSON.stringify(C);})()'));
r.hashes=hashes;r.sec=Math.round((Date.now()-t0)/1000);fs.writeFileSync(out,JSON.stringify(r));
const last=r.snap.at(-1)||{};
console.log(path.basename(out),JSON.stringify({ev:r.ev,rival:r.rival,stay:r.stay,leaderChanges:r.leaderChanges,joint:{plans:r.joint.plans,close:r.joint.close,arrived:r.joint.arrivedFleets,captured:r.joint.captured,ctxSides:r.joint.ctxSides,ctxNone:r.joint.ctxNone},
 votes:r.votes,leaveWhy:r.leaveWhy,last:{m:last.m,feds:(last.feds||[]).map(f=>f.t[0]+f.n).join(','),largest:last.largest,indep:last.indep,contact:last.contact,surv:last.surv,nests:last.nests,ruins:last.ruins},sec:r.sec}));
