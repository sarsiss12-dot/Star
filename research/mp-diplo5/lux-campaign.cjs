'use strict';
/* MP-DIPLO5 NF-2b — doğal kampanya ölçümü (kontrol ve aday aynı tohum / ayar).
   Kullanım: node research/mp-diplo5/lux-campaign.cjs <kök> <tohum> <ay> [boyut] [aiSayısı]
   Ölçer: aylık luxGrant kaydı sayısı (yeni hak), hakla açılan (başka kanalı olmayan) lüks bonusu-ay sayısı, hak sahiplerinin mineral/alaşım
   gelir farkı, son Save8 SHA-256. Ölçüm salt okunur: dünyaya yazmaz, RNG çekmez.
   INJECT=<ay>: o ayın sonunda kontrollü tek AI → AI lüks anlaşması (motorun dealQuote → executeDeal yolu; iki kolda aynı seçim, RNG yok);
   sonra alıcının aylık mineral/alaşım geliri ve hakla açılan bonus-ayı izlenir. */
const path=require('path'),crypto=require('crypto'),{runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed='11',months='48',size='orta',ai='6']=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'${size}',aiCount:${+ai}});setupGame({...CFG});G.autoSave=false;
var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};
var __seen=new Set();var __trade=(e,k)=>{const tr=e.trade;if(!(tr&&tr.links&&tr.links.some(l=>l.dis&&!l.bl)))return false;for(const o of G.emps){if(o.dead||o.id===e.id||e.war[o.id])continue;if(!(e.pact&&e.pact[o.id]))continue;if(typeof tradeBlocked==='function'&&tradeBlocked(e,o))continue;if(ownLuxury(o)[k])return true;}return false;};
var __probe=()=>{let grants=0,fresh=[],grantOnly=0,aiai=0;for(const e of G.emps){if(e.dead||!e.luxGrant)continue;for(const k of Object.keys(e.luxGrant)){const g=e.luxGrant[k];grants++;const key=e.id+':'+k+':'+g;
  if(!__seen.has(key)){__seen.add(key);fresh.push({to:e.id,from:g,k,ai:!!e.ai&&!!(G.emps[g]&&G.emps[g].ai),day:Math.floor(G.day)});}
  if(e.luxury&&e.luxury[k]&&!(e.luxOwn&&e.luxOwn[k])&&!__trade(e,k))grantOnly++;}}
  return {grants,fresh,grantOnly};};`);
const rows=[];let grantOnlyMonths=0;const fresh=[];const INJ=+(process.env.INJECT||0);let inj=null;const taker=[];
for(let m=1;m<=+months;m++){h.run('__step()');
  if(INJ&&m===INJ)inj=JSON.parse(h.run(`JSON.stringify((()=>{for(const g of G.emps){if(g.dead||g.wild||!g.ai)continue;for(const k of Object.keys(ownLuxury(g)).sort())for(const t of G.emps){if(t===g||t.dead||t.wild||!t.ai||t.war[g.id]||(t.luxury&&t.luxury[k]))continue;
    const o={from:g.id,to:t.id,give:[{t:'lux',k}],want:[],born:G.day,expires:G.day+300};if(!dealQuote(o).ok)continue;const ok=executeDeal(o);return {m:${m},from:g.id,to:t.id,k,ok};}}return null;})())`));
  if(inj&&inj.ok)taker.push(JSON.parse(h.run(`JSON.stringify((()=>{const t=G.emps[${inj?inj.to:0}];const st=t.colonies.map(c=>G.sys[c.s].planets[c.p].col).filter(Boolean).map(c=>c.stab||0);return {m:${m},min:+((t.inc&&t.inc.min)||0).toFixed(3),ala:+((t.inc&&t.inc.ala)||0).toFixed(3),ara:+((t.inc&&t.inc.ara)||0).toFixed(3),stab:+(st.length?st.reduce((a,b)=>a+b,0)/st.length:0).toFixed(3),lux:!!(t.luxury||{})['${inj?inj.k:''}'],dead:!!t.dead};})())`)));
  const p=JSON.parse(h.run('JSON.stringify(__probe())'));grantOnlyMonths+=p.grantOnly;fresh.push(...p.fresh);rows.push({m,grants:p.grants,grantOnly:p.grantOnly});}
const end=JSON.parse(h.run(`JSON.stringify(G.emps.filter(e=>!e.wild).map(e=>({id:e.id,ai:!!e.ai,dead:!!e.dead,col:e.colonies.length,min:Math.round((e.inc&&e.inc.min)||0),ala:Math.round((e.inc&&e.inc.ala)||0),lux:Object.keys(e.luxury||{}).length,grant:Object.keys(e.luxGrant||{}).length,score:Math.round(typeof empireScore==='function'?empireScore(e):0)})))`));
const sha=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex');
const sum=k=>+taker.reduce((a,r)=>a+r[k],0).toFixed(2);
console.log(JSON.stringify({root:path.basename(path.resolve(root)),inj,takerMonths:taker.length,takerLuxMonths:taker.filter(r=>r.lux).length,takerMin:sum('min'),takerAla:sum('ala'),takerAra:sum('ara'),takerStabAvg:+(taker.length?sum('stab')/taker.length:0).toFixed(2),seed:+seed,months:+months,size,ai:+ai,newGrants:fresh.length,aiaiGrants:fresh.filter(f=>f.ai).length,fresh,grantOnlyMonths,
  lastGrants:rows.at(-1).grants,end,sha}));
