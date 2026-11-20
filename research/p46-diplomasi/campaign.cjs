'use strict';
// Tek dünya / işçi. Gözlem noktaları p46 kararının kendi yerel değerlerini okur.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), zlib=require('node:zlib');
const {runtime}=require('../../tests/helpers/runtime');
const [mode, seedText, monthsText='180']=process.argv.slice(2), seed=Number(seedText);
if(!['normal','turbulent','medium','calm'].includes(mode))throw Error(mode);
const h=runtime({processGlobal:true});
h.run(`setupGame({...CFG,size:setupSizeKey(100),aiCount:9,seed:${seed},...${mode==='medium'?"{aiRivals:rivalPreset('orta',9)}":mode==='turbulent'?"{tension:'calkantili'}":mode==='calm'?"{tension:'sakin'}":"{}"}});G.autoSave=false;
const trace=[],rows=[], logEvent=(kind,data)=>trace.push({day:G.day,kind,...JSON.parse(JSON.stringify(data))});
const wrap=(name,after)=>{const orig=globalThis[name];globalThis[name]=function(...args){const r=orig.apply(this,args);after(r,...args);return r;};};
wrap('aiNegotiate',(r,a,b,g,w)=>logEvent('talk',{a:a.id,b:b.id,g,w,...r}));
wrap('executeDeal',(ok,o)=>logEvent('deal',{ok,o,allied:!!G.emps[o.from]?.ally?.[o.to],pact:!!G.emps[o.from]?.pact?.[o.to],contract:o.give?.[0]?.t==='freight'?G.commerce?.contracts.at(-1)?.id:undefined}));
const finishFreight=Commerce.finish;Commerce.finish=function(v,status,...args){const prev=v.delivered,r=finishFreight.call(this,v,status,...args);if(v.delivered>prev)logEvent('arrival',{a:v.e,b:v.to,contract:v.contract,resource:v.r,qty:v.delivered-prev,sys:v.target});return r;};
wrap('makePeace',(ok,a,b,reason)=>{if(ok)logEvent('peace',{a:a.id,b:b.id,reason:reason||'default',warAfter:!!a.war[b.id],fronts:G.warLedger.fronts.filter(f=>f.ended===null).map(f=>f.sides)});});
wrap('settlementSubmit',(r,e,c)=>logEvent('shareProposal',{e:e.id,c,r}));
wrap('settlementApply',(r,e,id)=>logEvent('shareApply',{e:e.id,id,r}));
wrap('vassalOffer',(r,a,b,mode,type)=>logEvent('vassalOffer',{a:a.id,b:b.id,mode,type,r}));
wrap('subjugate',(r,a,b,type)=>logEvent('vassal',{a:a.id,b:b.id,type,overlord:b.overlord}));
wrap('warPromiseFrontEnded',(_,f)=>logEvent('peaceOutcome',{front:f.id,promises:G.warLedger.promises||[]}));
wrap('fedPoliticalRecord',(_,f,event,d)=>logEvent('politics',{fed:f.id,type:f.type,event,d}));
wrap('diplomaticSupportEvidence',(ok,f,h,b)=>logEvent('supportEvidence',{ok,h:h.id,b:b.id,c:f.campaign}));
wrap('declareWar',(ok,a,b)=>{if(ok)logEvent('war',{a:a.id,b:b.id});});
wrap('aiPlanEvent',(_,e,k,d)=>{if(/coalition|support-opportunity/.test(k))logEvent(k,{e:e.id,d});});
const playerOffer=UI.aiOffer;UI.aiOffer=function(o,...args){logEvent('playerOffer',{o});return playerOffer.call(this,o,...args);};
function month(){for(let i=0;i<60&&!G.over;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}
function sample(){const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide);
rows.push({day:G.day,live:live.map(e=>e.id),feds:G.feds.map(f=>({id:f.id,type:f.type,m:[...f.members],fund:{...f.fund},laws:{...f.laws},charter:{...f.charter},founded:f.founded})),deliveries:live.reduce((n,e)=>n+(G.commerce?.stats?.[e.id]?.deliveries||0),0),rng:RND_STATE});}
`);
const anchor='if(join&&(!found||join.a.score+.03>=found.score))';
const src=h.run('aiRivalBlocChoice.toString()');if(!src.includes(anchor))throw Error(anchor);
h.run(src.replace(anchor,`logEvent('choice',{id:e.id,join:join&&{id:join.o.id,score:join.a.score,eta:join.a.eta},found,threat,cost,stock:e.res.etk,pool:pool.map(x=>[x.o.id,x.s]),tempo});`+anchor));
const personas=h.run('G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>[e.id,personaKey(e)])');
h.run('sample()'); const hashes={};
for(let m=0;m<=Number(monthsText);m++){
 if(m)h.run('month();sample()');
 if(m%30===0||h.run('!!G.over'))hashes[m]=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex');
 if(h.run('!!G.over'))break;
}
const result={mode,seed,personas,hashes,rows:h.run('rows'),events:h.run('trace')};
fs.writeFileSync(path.join(__dirname,'raw',mode+'-'+seed+'.json.gz'),zlib.gzipSync(JSON.stringify(result)));
