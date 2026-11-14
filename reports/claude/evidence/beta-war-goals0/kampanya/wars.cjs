// BETA-WAR-GOALS.0 kampanya: kontrol p30 (sabit kopya) / aday (sabit kopya) × Galaktik Gerilim. Ölçüm kancaları RNG çekmez.
const path=require('path');
const [root,arm,seed,months,ai,size,tension]=[process.argv[2],process.argv[3],+process.argv[4],+(process.argv[5]||120),+(process.argv[6]||8),process.argv[7]||'orta',process.argv[8]||''];
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const h=runtime({root});
h.run(`setupGame({...CFG,seed:${seed},size:'${size}',aiCount:${ai}${tension&&tension!=='dengeli'?",tension:'"+tension+"'":''}});G.autoSave=false;`+(arm==='placebo'?'rnd();':'')+`
 globalThis.__w={ff:0,ffFramed:0,ffInstantWar:0,ffReveal:0,ffRevealOffers:0,subj:{},fetihBack:0,vassalOffers:0};
 if(typeof falseFlagOp==='function'){const _f=falseFlagOp;falseFlagOp=function(e,t,p,k){const r=_f.apply(this,arguments);if(e&&e.ai&&r&&r.ok){__w.ff++;if(r.framed){__w.ffFramed++;if(r.savas)__w.ffInstantWar++;}}return r;};}
 if(typeof warFalseFlagRevealed==='function'){const _r=warFalseFlagRevealed;warFalseFlagRevealed=function(){const r=_r.apply(this,arguments);if(r){__w.ffReveal++;__w.ffRevealOffers+=(r.offers||[]).length;}return r;};}
 {const _s=subjugate;subjugate=function(l,s,t,c,src='forced'){const r=_s.apply(this,arguments);if(r){const k=src||'forced';__w.subj[k]=(__w.subj[k]||0)+1;}return r;};}
 if(typeof warFetihSettle==='function'){const _fs=warFetihSettle;warFetihSettle=function(){const r=_fs.apply(this,arguments);__w.fetihBack+=r.length;return r;};}
 if(typeof aiCoalitionSend==='function'){const _c=aiCoalitionSend;aiCoalitionSend=function(e,o,give,want){if((give||[]).concat(want||[]).some(i=>i.t==='vassal'))__w.vassalOffers++;return _c.apply(this,arguments);};}
 function step(){for(let i=0;i<60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}`);
const rows=[];
for(let m=1;m<=months;m++){h.run('step()');h.sb.__M=m;
 rows.push(JSON.parse(h.run(`JSON.stringify((()=>{const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);const feds=(G.feds||[]).filter(f=>f.members.filter(id=>G.emps[id]&&!G.emps[id].dead).length>=2);
  const sizes=feds.map(f=>f.members.filter(id=>!G.emps[id].dead).length).sort((a,b)=>b-a);
  return {m:__M,live:live.length,blocs:feds.length,share:live.length?(sizes[0]||0)/live.length:0,wars:G.emps.reduce((n,e)=>n+Object.values(e.war||{}).filter(Boolean).length,0)/2,ids:feds.map(f=>f.id)};})())`)));
 if(m===120||m===months)rows[rows.length-1].snap=JSON.parse(h.run(`JSON.stringify((()=>{const fr=(G.warLedger?.fronts||[]).filter(f=>!f.legacy);const goal=f=>{const g=(f.goals||[]).find(g=>g.by===f.sides[0]);return g?g.type:'yok';};
  const ended=fr.filter(f=>f.ended!==null),dur=ended.map(f=>(f.ended-f.opened)/30).sort((a,b)=>a-b),cnt=(xs,k)=>xs.reduce((o,x)=>{const v=k(x);o[v]=(o[v]||0)+1;return o;},{});
  return {fronts:fr.length,declared:fr.filter(f=>f.parent===null).length,goals:cnt(fr.filter(f=>f.parent===null),goal),entry:cnt(fr,f=>f.entryKind),endReason:cnt(ended,f=>String(f.endReason||'').split('|')[0]),
   durMed:dur.length?+dur[Math.floor(dur.length/2)].toFixed(1):null,durMean:dur.length?+(dur.reduce((a,b)=>a+b,0)/dur.length).toFixed(1):null,active:fr.filter(f=>f.ended===null).length,
   oath:G.emps.reduce((n,e)=>n+(e.oathLog||[]).length,0),oathKinds:cnt(G.emps.flatMap(e=>e.oathLog||[]),x=>x.kind),vassals:G.emps.filter(e=>!e.dead&&e.overlord!==null&&e.overlord!==undefined).length,
   promises:(G.warLedger?.promises||[]).length,fedWar:fr.filter(f=>f.fedWar).length,dead:G.emps.filter(e=>e.dead&&!e.wild).length,w:{...__w}};})())`));}
const summ=M=>{const rs=rows.filter(r=>r.m<=M);if(rs.length<M)return null;const tail=rs.filter(r=>r.m>M/2),lv={};for(const r of rs)for(const id of r.ids)lv[id]=(lv[id]||0)+1;const life=Object.values(lv).sort((a,b)=>b-a);
 return {months:M,meanShareLate:+(tail.reduce((a,r)=>a+r.share,0)/tail.length).toFixed(3),maxBlocs:Math.max(...rs.map(r=>r.blocs)),monthsMulti:rs.filter(r=>r.blocs>=2).length,secondBlocMonths:life[1]||0,
  warMonths:rs.reduce((a,r)=>a+r.wars,0),meanWars:+(rs.reduce((a,r)=>a+r.wars,0)/rs.length).toFixed(2),...rs[rs.length-1].snap};};
console.log(JSON.stringify({arm,seed,ai,size,tension:tension||'dengeli',at120:summ(120),at240:months>=240?summ(240):null}));
