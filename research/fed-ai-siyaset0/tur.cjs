// node tur.cjs <kök> <tohum> <tür> <ay> <çıkış.json>   [CAMP_SIZE=ulu CAMP_AI=9 · START=60]
// FED-AI-SİYASET.0 Faz C: federasyon türlerinin kontrollü karşılaştırması. Aynı tohumla START. aya kadar doğal oyun; o anda aynı üç AI
// (en çok kolonili, birbirine bağlı, Arındırıcı olmayan) mevcut birliklerinden ayrılır ve <tür> federasyonu kurar (foundFederation ile aynı nesne
// yapısı, başkan en büyük). Sonra <ay> ay doğal oyun. Üye başına ölçüm (başlangıç → son): teknoloji sayısı, araştırma / enerji / alaşım geliri,
// filo gücü ve bakımı, koloni, savaş (ilan / katılım), federal filo, fon, gerçek teslimatlı ticaret sözleşmesi, ayrılma / reform. Türe kural eklemez.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,type,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);h.sb.START=+(process.env.START||60);h.sb.TYPE=type;
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};
for(let i=0;i<START;i++)__m();
var ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&!isPurifier(e)).sort((a,b)=>b.colonies.length-a.colonies.length||a.id-b.id);
var M=[ais[0]];for(const o of ais.slice(1)){if(M.length>=3)break;if(M.every(m=>m.contact[o.id]&&!m.war[o.id]))M.push(o);}
for(const e of M)if(findFed(e))leaveFederation(e);
var F={id:(G.fedUid=(G.fedUid||0)+1),name:fedName(null,TYPE),type:TYPE,charter:{...fedDefaultCharter(TYPE),ballot:'equal'},politicsVersion:96,leader:M[0].id,founder:M[0].id,
 members:M.map(e=>e.id),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+60,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:G.warLedger?.next||1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
G.feds=G.feds||[];G.feds.push(F);federationIdentity(F);for(const id of F.members){F.dutyConsent[id]={offense:false,since:G.day};for(const p of F.members)if(p!==id){G.emps[id].ally[p]=true;G.emps[id].contact[p]=true;}}
fedRefreshRepresentation(F,true);fedPoliticalRecord(F,'founded',{type:TYPE,ballot:'equal'});for(const e of M)recalcMods(e);
var T={wars:0,joins:0,leaves:0,reforms:0,deals:0};
{const f=declareWar;declareWar=function(a,b,o){const was=a&&b&&a.war[b.id];const r=f.apply(this,arguments);if(a&&b&&!was&&a.war[b.id]&&M.includes(a)&&!b.wild){if(o&&o.kind)T.joins++;else T.wars++;}return r;};}
{const f=leaveFederation;leaveFederation=function(e){const had=findFed(e)===F;const r=f.apply(this,arguments);if(had&&findFed(e)!==F)T.leaves++;return r;};}
var stat=()=>fedFoundRead(()=>M.map(e=>({id:e.id,p:personaKey(e),dead:!!e.dead,techs:Object.keys(e.techs||{}).length,ara:+(e.inc?.ara||0).toFixed(1),ene:+(e.inc?.ene||0).toFixed(1),ala:+(e.inc?.ala||0).toFixed(1),
 power:Math.round(totalPower(e)),cols:e.colonies.length,sys:G.sys.filter(s=>s.owner===e.id).length,inFed:findFed(e)===F,deliv:(G.commerce?.stats?.[e.id]?.deliveries||0),res:{ene:Math.round(e.res.ene||0),ala:Math.round(e.res.ala||0),ara:Math.round(e.res.ara||0)}})));
var S0=stat();`);
for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run(`JSON.stringify({type:TYPE,start:S0,end:stat(),T,fed:{alive:G.feds.includes(F),type:F.type,members:F.members.slice(),fund:F.fund,federal:G.fleets.filter(f=>f.federal&&F.members.includes(f.e)).length,contracts:(G.commerce&&G.commerce.contracts||[]).filter(c=>c&&c.status==='active'&&(F.members.includes(c.a)||F.members.includes(c.b))).length,inner:(G.commerce&&G.commerce.contracts||[]).filter(c=>c&&F.members.includes(c.a)&&F.members.includes(c.b)).length}})`));
fs.writeFileSync(out,JSON.stringify(r));
const sum=(L,k)=>L.reduce((n,x)=>n+(+x[k]||0),0);
console.log(path.basename(out),type,'Δteknoloji',sum(r.end,'techs')-sum(r.start,'techs'),'araştırma',sum(r.start,'ara').toFixed(0)+'→'+sum(r.end,'ara').toFixed(0),'enerji',sum(r.start,'ene').toFixed(0)+'→'+sum(r.end,'ene').toFixed(0),
 'güç',sum(r.start,'power')+'→'+sum(r.end,'power'),'koloni',sum(r.start,'cols')+'→'+sum(r.end,'cols'),'savaş',r.T.wars,'katılım',r.T.joins,'ayrılma',r.T.leaves,'teslimat',sum(r.end,'deliv')-sum(r.start,'deliv'),'fed',JSON.stringify(r.fed));
