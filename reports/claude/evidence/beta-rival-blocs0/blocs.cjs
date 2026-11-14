// p29 kontrol / plasebo / aday: blok dağılımı + kuruluş/katılım/ayrılma nedenleri + ihanet + Sahte Bayrak sayaçları
const path=require('path');
const [root,arm,seed,months,ai,size]=[process.argv[2]||'/home/user/Star',process.argv[3],+process.argv[4],+(process.argv[5]||120),+(process.argv[6]||8),process.argv[7]||'orta'];
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const h=runtime({root});
h.run(`setupGame({...CFG,seed:${seed},size:'${size}',aiCount:${ai}});G.autoSave=false;`+(arm==='placebo'?'rnd();':'')+
`globalThis.__ev={found:0,apply:0,join:0,leave:0,propose:0,expel:0,shirk:0,oathAlly:0,oathNap:0,dissolve:0,reasons:{}};
 const _fr=fedPoliticalRecord;fedPoliticalRecord=function(f,reason,data){const k=reason==='founded'?'found':reason==='join'?'join':reason==='leave'?'leave':reason==='expel'?'expel':null;if(k)__ev[k]++;return _fr.apply(this,arguments);};
 const _dw=declareWar;declareWar=function(a,b,s){const wasAlly=a&&b&&a.ally[b.id]&&b.ally[a.id],nap=!!(a&&a.nap&&a.nap[b.id]>G.day);const r=_dw.apply(this,arguments);if(r&&r.ok&&a.ai){if(wasAlly)__ev.oathAlly++;else if(nap)__ev.oathNap++;}return r;};
 const _fd=fedDissolve;fedDissolve=function(f){__ev.dissolve++;return _fd.apply(this,arguments);};
 globalThis.__ff={budget:0,cooldown:0,target:0,patsy:0,chanceSum:0,attempts:0,instantWar:0,framedNoWar:0,exposed:0,silent:0,delayedWar:0,revealed:0,revealWar:0,byAhl:{},ops:[]};
 const _ffo=falseFlagOp;falseFlagOp=function(e,t,p2,tur){const r=_ffo.apply(this,arguments);if(e&&e.ai&&r&&r.ok){__ff.attempts++;const a=String((e.ethics&&e.ethics.ahl)||0);__ff.byAhl[a]=(__ff.byAhl[a]||0)+1;
   if(r.framed){r.savas?__ff.instantWar++:__ff.framedNoWar++;const w=(t.hitLog||[]).slice().reverse().find(w=>w.framed===e.id&&w.by===p2.id);__ff.ops.push({d:G.day,e:e.id,t:t.id,p:p2.id,war:!!r.savas,src:w&&w.source,rev:false});}
   else if(r.caught)__ff.exposed++;else __ff.silent++;}return r;};
 const _fft=aiFalseFlagTick;aiFalseFlagTick=function(){const r0=RND_STATE;fedFoundRead(()=>{for(const e of G.emps){if(e.dead||e.wild||e.crisisSide||!e.ai)continue;if((e.res.etk||0)<260)continue;__ff.budget++;if(e._ffCd&&e._ffCd>(G.memAge||0))continue;__ff.cooldown++;
   const prof=aiProfile(e),P=personaOf(e),mz=P?P.n:'';let sans=.03;if(mz==='Fanatik Arındırıcılar')sans+=.03;if(hasCivic(e,'shadow'))sans+=.05;if(prof.dip>.6)sans+=.02;
   const hs=G.emps.filter(o=>!o.dead&&!o.wild&&!o.crisisSide&&o.id!==e.id&&e.contact[o.id]&&intelOf(e,o.id)>=2&&aiOpPolicy(e,o,'falseFlag'));if(!hs.length)continue;__ff.target++;
   let ok=false;for(const t of hs){for(const p2 of G.emps){if(p2.dead||p2.wild||p2.crisisSide||p2.id===e.id||p2.id===t.id||!e.contact[p2.id])continue;if(!aiOpPolicy(e,p2,'falseFlag')||intelOf(e,t.id)<3)continue;if(-(t.rel[p2.id]||0)>=25){ok=true;break;}}if(ok)break;}
   if(ok){__ff.patsy++;__ff.chanceSum+=sans;}}});if(RND_STATE!==r0)throw Error('ff diag rng');return _fft.apply(this,arguments);};
 const _dw2=declareWar;declareWar=function(a,b,s){const was=!!(a&&b&&a.war[b.id]);const r=_dw2.apply(this,arguments);if(r&&r.ok&&!was){
   for(const o of __ff.ops){if(o.t===a.id&&o.p===b.id&&!o.war&&!o.dw&&G.day-o.d<=1080&&(a.mem?.[b.id]||[]).some(m=>m.source===o.src)){o.dw=G.day;__ff.delayedWar++;}
     if(o.rev&&o.t===a.id&&o.e===b.id&&!o.rw&&G.day-o.rev<=1080){o.rw=G.day;__ff.revealWar++;}}}return r;};
 function ffReveal(){for(const o of __ff.ops){if(o.rev)continue;const t=G.emps[o.t];if((t.hitLog||[]).some(w=>w.source===o.src&&w.framed===undefined&&w.by===o.e)){o.rev=G.day;__ff.revealed++;}}}
 function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`);
const rows=[],lives={};
for(let m=1;m<=months;m++){h.run('step();ffReveal()');h.sb.__M=m;
 const r=JSON.parse(h.run(`JSON.stringify((()=>{const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);const feds=(G.feds||[]).filter(f=>f.members.filter(id=>G.emps[id]&&!G.emps[id].dead).length>=2);
  const sizes=feds.map(f=>f.members.filter(id=>!G.emps[id].dead).length).sort((a,b)=>b-a);const inFed=new Set(feds.flatMap(f=>f.members));
  for(const e of G.emps){const r=e.aiFedReason;if(r&&r.day>G.day-30){const k=r.kind+': '+String(r.why).split(' · ')[0].slice(0,70);__ev.reasons[k]=(__ev.reasons[k]||0)+1;if(r.kind==='shirk')__ev.shirk++;if(r.kind==='propose')__ev.propose++;if(r.kind==='apply')__ev.apply++;}}
  return {m:__M,live:live.length,blocs:feds.length,top:sizes[0]||0,share:live.length?(sizes[0]||0)/live.length:0,indep:live.filter(e=>!inFed.has(e.id)).length,sizes,ids:feds.map(f=>f.id)};})())`));
 rows.push(r);for(const id of r.ids)lives[id]=(lives[id]||0)+1;}
const ev=JSON.parse(h.run('JSON.stringify(__ev)')),ff=JSON.parse(h.run('JSON.stringify({...__ff,ops:__ff.ops.length})')),oath=JSON.parse(h.run('JSON.stringify(G.emps.filter(e=>e.oathLog).flatMap(e=>e.oathLog.map(x=>({e:e.id,ahl:e.ethics.ahl,...x}))))'));
const summ=M=>{const rs=rows.filter(r=>r.m<=M),tail=rs.filter(r=>r.m>M/2),lv={};for(const r of rs)for(const id of r.ids)lv[id]=(lv[id]||0)+1;const life=Object.values(lv).sort((a,b)=>b-a);
 return {months:M,maxShare:+Math.max(...rs.map(r=>r.share)).toFixed(3),meanShareLate:+(tail.reduce((a,r)=>a+r.share,0)/tail.length).toFixed(3),maxBlocs:Math.max(...rs.map(r=>r.blocs)),monthsMulti:rs.filter(r=>r.blocs>=2).length,meanIndepLate:+(tail.reduce((a,r)=>a+r.indep,0)/tail.length).toFixed(2),firstFedMonth:(rs.find(r=>r.blocs>0)||{}).m||null,shareAt60:(rs.find(r=>r.m===Math.min(60,M))||{}).share,secondBlocMonths:life[1]||0,blocs:life.length,final:rs[rs.length-1]};};
const out={arm,seed,ai,size,at120:summ(Math.min(120,months)),at240:months>=240?summ(240):null,ev:{...ev,reasons:undefined},ff,oath,reasons:ev.reasons};
console.log(JSON.stringify(out));
