'use strict';
const {runtime}=require('./helpers/runtime');
function campaign(root,seed,months=120){
 const h=runtime({root});
 h.sb.__seed=seed;h.sb.__months=months;
 const started=Date.now();
 const data=h.run(`
 setupGame({name:'89B',race:'insan',traits:[],size:'buyuk',shape:'sarmal',diff:'normal',seed:__seed,
 ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
 G.autoSave=false;economyTick(true);
 var stats={seed:__seed,months:0,steps:0,surveys:0,arrivals:0,battles:0,negotiations:0,ops:0,first:{},stopped:null};
 function pairs(){var n=0;for(const a of G.emps)for(const b of G.emps)
 if(a.id<b.id&&!a.wild&&!b.wild&&a.contact[b.id]&&b.contact[a.id])n++;return n;}
 stats.initialContacts=pairs();stats.settlement={submitted:0,applied:0,blocked:0,calls:0};
 var agenda0=settlementAgendaTick;settlementAgendaTick=function(){const r=agenda0();stats.settlement.calls++;for(const k of ['submitted','applied','blocked'])stats.settlement[k]+=r[k];return r;};
 var survey0=doSurvey,arrive0=arrive,battle0=battleRound,negot0=aiNegotiate,op0=runOp;
 doSurvey=function(...a){stats.surveys++;return survey0(...a);};
 arrive=function(...a){stats.arrivals++;return arrive0(...a);};
 battleRound=function(...a){stats.battles++;return battle0(...a);};
 aiNegotiate=function(...a){stats.negotiations++;return negot0(...a);};
 runOp=function(...a){stats.ops++;return op0(...a);};
 function issue(k,d){if(!stats.first[k])stats.first[k]={day:G.day,...d};}
 for(const name of ['economyTick','raidTick','envoyTick','attritionTick','upheavalTick','diploTick','spyTick','fakeTick','facTick','councilTick','crisisTick','warExhTick','planetCharTick','tributeTick','tradeFlowTick','fedTick','borderFriction','updateVision','aiTurn']){
   const original=globalThis[name];globalThis[name]=function(...args){const result=original(...args);
     for(const e of G.emps)if(!e.dead&&!e.wild)for(const [k,v] of Object.entries(e.res))
       if(!Number.isFinite(v)||v<-.00001)issue('stockPhase',{stage:name,emp:e.id,key:k,value:v,race:e.race,res:{...e.res}});
     return result;};
 }
 var startDay=G.day,startMonth=G.year*12+G.month;
 try{for(var i=0;i<__months*60;i++){
   var prev=Math.floor(G.day/30);G.day+=.5;
   dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
   if(Math.floor(G.day/30)>prev){monthTick();stats.months++;
     for(const e of G.emps){if(e.dead||e.wild)continue;
       for(const [k,v] of Object.entries(e.res))if(!Number.isFinite(v)||v<-.00001)issue('stock',{emp:e.id,key:k,value:v});
       if(e.factions){const sum=e.factions.reduce((s,f)=>s+f.pow,0);if(sum!==100)issue('factionTotal',{emp:e.id,sum});}
     }
   }
   for(const f of G.fleets){if(!Number.isFinite(f.x)||!Number.isFinite(f.y))issue('fleetFinite',{id:f.id});
     if(!G.emps[f.e]||f.sys>=0&&!G.sys[f.sys]||(f.path||[]).some(id=>!G.sys[id]))issue('fleetRef',{id:f.id});}
   for(const s of G.sys){const r=s.battleReport;if(r&&r.last&&r.last.ready.some((n,j)=>n>r.last.ships[j]))issue('reportCount',{sys:s.id,last:r.last});}
   stats.steps++;
   if(G.over){stats.stopped={win:G.over.win,txt:G.over.txt};break;}
 }}catch(e){stats.error=e.stack;}
 stats.settlement.offers=(G.settlements?.offers||[]).length;stats.settlement.states={};for(const o of G.settlements?.offers||[])stats.settlement.states[o.state]=(stats.settlement.states[o.state]||0)+1;
 stats.settlement.fronts=(G.warLedger?.fronts||[]).length;stats.settlement.coalitionFronts=(G.warLedger?.fronts||[]).filter(f=>f.parent!==null).length;
 stats.contacts=pairs();stats.elapsedDays=G.day-startDay;stats.calendarMonths=G.year*12+G.month-startMonth;
 stats.fleets=G.fleets.length;stats.alive=G.emps.filter(e=>!e.dead&&!e.wild).length;
 stats.situations=(G.sits||[]).length;stats.rng=RND_STATE;
 JSON.stringify(stats);
 `);
 return {...JSON.parse(data),ms:Date.now()-started};
}
const path=require('path'),fs=require('fs');const results=[];for(const seed of [11,99,404]){const r=campaign(path.resolve(__dirname,'..'),seed,240);results.push(r);console.log(JSON.stringify(r));fs.writeFileSync(path.join(__dirname,'campaign-92d.json'),JSON.stringify(results,null,2));}
