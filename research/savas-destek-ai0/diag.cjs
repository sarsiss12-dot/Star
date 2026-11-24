// node diag.cjs <kök> <tohum> <ay> [boyut ai]  — SAVAŞ-DESTEK-AI.0 tanı: açık AI cephelerinde her ay (dünyaya yazmadan, RNG çekmeden)
// (1) savaşan AI zorlanıyor mu, aday havuzu neden boş (müttefik / fed / dost yok; kapı nedenleri); (2) gönüllü destek (support-opportunity)
// her potansiyel destekçi için hangi koşulda düşüyor (müttefik değil, düşmanla ilişki > −25, kapı, bütçe, erişim, aiCoalitionSafe).
const path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,size='ulu',ais='9']=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'${size}',aiCount:${+ais}});setupGame({...CFG});G.autoSave=false;
var D={wars:[],strained:0,warMonths:0,poolWhy:{},gateWhy:{},oppWhy:{},oppSafe:{}};const inc=(o,k)=>o[k]=(o[k]||0)+1;
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}diag();};
function diag(){const fr=(G.warLedger?.fronts||[]).filter(f=>f.ended===null&&f.parent===null);
 for(const f of fr)for(const sid of f.sides){const e=G.emps[sid],enemy=G.emps[f.sides.find(i=>i!==sid)];if(!e?.ai||e.wild||e.crisisSide||!enemy||enemy.wild||enemy.crisisSide)continue;D.warMonths++;
  const me=f.sides.indexOf(e.id),m=f.metrics?.[me]||{},own=aiKnownPower(e,e),theirs=aiKnownPower(e,enemy);const strained=theirs>own*.9||(m.shipsLost||0)>(m.shipsDestroyed||0)+2||(e.exh?.[enemy.id]||0)>=25;if(strained)D.strained++;
  const fed=findFed(e);for(const o of G.emps){if(o===e||o===enemy||o.dead||o.wild||o.crisisSide)continue;
   let why=!e.contact[o.id]?'temas yok':isPurifier(o)?'arındırıcı':aiKnownWar(e,o,enemy)?'zaten savaşta':!(e.ally[o.id]||fed&&fed===findFed(o)||(e.rel[o.id]||0)>=40)?'müttefik/fed/dost değil':null;
   if(!why){const g=warSupportGate(o,e,{t:'warJoin',front:f.id,target:enemy.id});why=g.ok?'UYGUN':'kapı: '+String(g.why).slice(0,50);if(!g.ok)inc(D.gateWhy,String(g.why).slice(0,50));}
   inc(D.poolWhy,why);
   /* gönüllü destek: o bu savaşta e'ye (sponsor) destek önerir mi */
   if(o.ai){let w=!aiCoalitionSafe(o)?'aiCoalitionSafe değil':!o.ally[e.id]?'sponsor müttefik değil':(o.rel[enemy.id]||0)>-25?'düşmanla ilişki > −25':!warSupportGate(o,e,{front:f.id,target:enemy.id}).ok?'kapı':!aiWarBudget(o,enemy).ok?'bütçe':!(warSupportReach(o,enemy,e,[])||warSupportReach(o,enemy,e,[{t:'passage'}]))?'erişim':'OLASI';inc(D.oppWhy,w);
    if(w==='aiCoalitionSafe değil'){const k=!o.aiStrategy?.objective?'hedef yok':o.aiStrategy.objective.kind==='recovery'?'recovery':Object.keys(o.war||{}).some(id=>o.war[id]&&!G.emps[id]?.wild)?'kendi savaşı':Math.max(0,...Object.values(o.exh||{}))>45?'yorgunluk':aiPendingPoliticalCommitment(o)?'siyasi taahhüt':aiFedWarBurden(o).short?'fed yükü':aiEconomyPlan(o).critical?'ekonomi kriz':'?';inc(D.oppSafe,k);}}}}}
`);
for(let m=1;m<=+months;m++)h.run('__m()');
console.log(JSON.stringify(JSON.parse(h.run('JSON.stringify(D)')),null,1));
