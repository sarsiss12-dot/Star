// node camp.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9 · PLACEBO_DAY=<gün>: o günden sonraki ilk ay başında tek rnd() · CAMP_TENSION=calkantili]
// SAVAŞ-DESTEK-AI.0 Faz L: savaş / destek kampanya ölçümü. Dünyaya yazmaz, RNG çekmez (yalnız sarmalayıcı sayaçlar; plasebo kolu bilerek tek rnd()).
// Ölçülen: savaş ilanları (ilan eden AI mı, saldıran / savunan, gerekçe), warJoin kabulleri (kim, kime, cephe, ödeme), AI yardım istekleri
// (war-help-ask) ve gönüllü destek (support-opportunity) olayları, aiRespond warJoin kararları (kabul / karşı / ret + neden),
// katılan devletin cephe katkısı (ledger metrics: imha, kayıp, hasar, sistem; "pasif" = hepsi 0), koloni kayıpları, elenenler,
// federasyon boyutları, aylık açık savaş sayısı, ay ay Save8 SHA-256 (ilk ayrışma için).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.PL=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);h.sb.TEN=process.env.CAMP_TENSION||null;
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});if(TEN)CFG.tension=TEN;setupGame({...CFG});G.autoSave=false;
var C={wars:[],joins:[],asks:[],opp:[],resp:{},respWhy:{},monthsWar:[],colLost:{},first:null};
const pk=e=>typeof personaKey==='function'?personaKey(e):(e.mizac||'?');
{const f=declareWar;declareWar=function(a,b,support){const was=!!(a&&b&&a.war&&a.war[b.id]);const r=f.apply(this,arguments);if(a&&b&&!was&&a.war[b.id])C.wars.push({d:Math.floor(G.day),a:a.id,b:b.id,ai:!!a.ai,pa:pk(a),support:!!support});return r;};}
{const f=executeDeal;executeDeal=function(o){const items=[...(o.give||[]).map(i=>[o.from,o.to,i]),...(o.want||[]).map(i=>[o.to,o.from,i])].filter(x=>x[2].t==='warJoin');const r=f.apply(this,arguments);
  if(r&&items.length)for(const [joiner,sponsor,it] of items){const pay=(o.give||[]).concat(o.want||[]).filter(i=>i.t==='res').map(i=>i.r+':'+i.v).join(',');C.joins.push({d:Math.floor(G.day),joiner,sponsor,front:it.front??null,plan:it.plan??null,target:it.target,pj:pk(G.emps[joiner]),pay,human:!G.emps[joiner].ai||!G.emps[sponsor].ai});}return r;};}
{const f=aiPlanEvent;aiPlanEvent=function(e,kind,d){if(kind==='war-help-ask')C.asks.push({d:Math.floor(G.day),e:e.id,...d});if(kind==='support-opportunity')C.opp.push({d:Math.floor(G.day),e:e.id,...d});return f.apply(this,arguments);};}
{const f=aiRespond;aiRespond=function(ai,offer){const r=f.apply(this,arguments);if((offer.want||[]).some(i=>i.t==='warJoin')){const k=pk(ai)+':'+r.v;C.resp[k]=(C.resp[k]||0)+1;if(r.v==='red'){const w=String(r.why||'').slice(0,60);C.respWhy[w]=(C.respWhy[w]||0)+1;}}return r;};}
if(PL!==null){const mt=monthTick;monthTick=function(){if(G.day>=PL&&!globalThis.__pl){globalThis.__pl=true;rnd();}return mt.apply(this,arguments);};}
var COL0=Object.fromEntries(G.emps.map(e=>[e.id,e.colonies.length]));
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}
  const open=(G.warLedger?.fronts||[]).filter(f=>f.ended===null).length;C.monthsWar.push(open);};
function fin(){const fr=G.warLedger?.fronts||[];const real=e=>e&&!e.wild&&!e.crisisSide;
 const joinedFronts=fr.filter(f=>f.parent!==null&&f.parent!==undefined&&real(G.emps[f.sides[0]])&&real(G.emps[f.sides[1]])).map(f=>{const s=f.sponsor,j=f.sides.find(id=>id!==s&&id!==undefined);
   const ji=j===undefined?-1:f.sides.indexOf(j);const m=ji>=0?f.metrics?.[ji]||{}:{};return {id:f.id,j:j??null,ended:f.ended,kind:f.entryKind||null,destroyed:m.shipsDestroyed||0,lost:m.shipsLost||0,dmg:Math.round(m.damageDealt||0),sys:Array.isArray(m.systems)?m.systems.length:(m.systems||0),passive:!(m.shipsDestroyed||m.shipsLost||m.damageDealt||(Array.isArray(m.systems)?m.systems.length:m.systems))};});
 const em=G.emps.filter(e=>e.ai&&real(e)).map(e=>({id:e.id,p:pk(e),dead:!!e.dead,col:e.colonies.length,col0:COL0[e.id]||0,sys:G.sys.filter(s=>s.owner===e.id).length,fleets:G.fleets.filter(f=>f.e===e.id).length}));
 const feds=(G.feds||[]).filter(f=>!f.dissolved).map(f=>(f.members||[]).length);
 return {fronts:fr.length,rootFronts:fr.filter(f=>f.parent===null).length,joinedFronts,em,feds,day:Math.floor(G.day)};}
`);
const sha=()=>crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);
const t0=Date.now(),hashes=[];for(let m=1;m<=+months;m++){h.run('__m()');hashes.push(sha());}
const r=JSON.parse(h.run('JSON.stringify({wars:C.wars,joins:C.joins,asks:C.asks,opp:C.opp,resp:C.resp,respWhy:C.respWhy,monthsWar:C.monthsWar,fin:fin()})'));r.hashes=hashes;r.sec=Math.round((Date.now()-t0)/1000);
fs.writeFileSync(out,JSON.stringify(r));
const jf=r.fin.joinedFronts,dead=r.fin.em.filter(e=>e.dead).length,colLost=r.fin.em.reduce((n,e)=>n+Math.max(0,e.col0-e.col),0);
console.log(path.basename(out),JSON.stringify({wars:r.wars.length,aiWars:r.wars.filter(w=>w.ai&&!w.support).length,supportWars:r.wars.filter(w=>w.support).length,joins:r.joins.length,asks:r.asks.length,askApplied:r.asks.filter(a=>a.applied).length,opp:r.opp.length,
  joinedFronts:jf.length,passive:jf.filter(x=>x.passive).length,jDestroyed:jf.reduce((n,x)=>n+x.destroyed,0),jLost:jf.reduce((n,x)=>n+x.lost,0),jSys:jf.reduce((n,x)=>n+x.sys,0),warMonths:r.monthsWar.reduce((a,b)=>a+b,0),dead,colLost,feds:r.fin.feds,resp:r.resp,sec:r.sec,last:hashes.at(-1)}));
