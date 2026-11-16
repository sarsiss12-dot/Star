'use strict';
/* MP-DIPLO5 NF-5 — AI müttefik desteği ve vasallık ölçümü (doğal kampanya; salt okunur sarmalayıcılar, RNG çekmez).
   Kullanım: node research/mp-diplo5/support-campaign.cjs <kök> <tohum> <ay> [boyut] [aiSayısı]
   Ölçer: aiPlanEvent (koalisyon hazırlığı / teklif sonucu / iptal nedeni / destek fırsatı), aiRespond kararları (warJoin / warOn / vassal
   içeren teklifler: kabul / ret / karşı + ilk gerekçe), fedDefend (uygun üye, katılan, kaçınan), vassalOffer (mod, AI→AI / AI→insan,
   sonuç: kabul / bekliyor / karşı / ret + gerekçe), vasal-ay ve senyöre ödenen toplam, vasalın senyörüyle birlikte savaştığı ay. */
const path=require('path'),crypto=require('crypto'),{runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed='11',months='120',size='orta',ai='6']=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'${size}',aiCount:${+ai}});setupGame({...CFG});G.autoSave=false;
var M={plan:{},resp:{},fed:{calls:0,eligible:0,joined:0,shirk:0},vas:{},vasMonths:0,vasPaid:0,vasWarWithLord:0,lordWars:0,why:{}};
var inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
var __pe=aiPlanEvent;aiPlanEvent=function(e,kind,d={}){if(e&&e.ai&&e.aiStrategy&&e.aiStrategy.objective){inc(M.plan,kind);if(d&&d.result!==undefined)inc(M.plan,kind+':'+d.result);if(d&&d.why)inc(M.why,kind+':'+String(d.why).slice(0,60));}return __pe.apply(this,arguments);};
var __ar=aiRespond;aiRespond=function(a,o){const r=__ar.apply(this,arguments);const it=[...(o.give||[]),...(o.want||[])].map(i=>i&&i.t);for(const t of ['warJoin','warOn','vassal','peaceWith','spynet','lux']){if(!it.includes(t))continue;inc(M.resp,t+':'+r.v);if(r.v!=='kabul'&&r.why)inc(M.why,'resp-'+t+':'+String(r.why).slice(0,70));}return r;};
var __fd=fedDefend;fedDefend=function(att,vic){const f=findFed(vic);M.fed.calls++;const before=f?f.members.filter(id=>id!==vic.id&&G.emps[id]&&!G.emps[id].war[att.id]).length:0;const r=__fd.apply(this,arguments);
  const after=f?f.members.filter(id=>id!==vic.id&&G.emps[id]&&G.emps[id].war[att.id]).length:0;M.fed.eligible+=before;M.fed.joined+=after;return r;};
if(typeof aiDefenseShirk==='function'){var __sh=aiDefenseShirk;aiDefenseShirk=function(){const r=__sh.apply(this,arguments);if(r)M.fed.shirk++;return r;};}
var __vo=vassalOffer;vassalOffer=function(e,o,mode){const r=__vo.apply(this,arguments);const k=mode+':'+(e&&e.ai?'AI':'H')+'>'+(o&&o.ai?'AI':'H');inc(M.vas,k+':'+(r.ok?(r.kabul?'kabul':(r.karar||'bekle')):'ret'));if(!r.ok&&r.why)inc(M.why,'vas-'+mode+':'+String(r.why).slice(0,70));return r;};
var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};
var __month=()=>{for(const v of G.emps){if(v.dead||v.wild||!isVassal(v))continue;M.vasMonths++;const lord=G.emps[v.overlord];if(!lord)continue;const lw=G.emps.filter(x=>x!==v&&lord.war[x.id]);if(lw.length){M.lordWars++;if(lw.some(x=>v.war[x.id]))M.vasWarWithLord++;}}};`);
for(let m=1;m<=+months;m++){h.run('__step();__month()');}
const out=JSON.parse(h.run(`JSON.stringify({...M,vassalsEnd:G.emps.filter(e=>!e.wild&&!e.dead&&isVassal(e)).map(e=>({id:e.id,lord:e.overlord,type:e.vassalType,paid:Math.round(e.vassalPaid||0),anger:Math.round(e.vassalAnger||0)})),feds:(G.feds||[]).map(f=>({type:f.type,n:f.members.length}))})`));
out.sha=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16);
console.log(JSON.stringify({root:path.basename(path.resolve(root)),seed:+seed,months:+months,size,ai:+ai,...out}));
