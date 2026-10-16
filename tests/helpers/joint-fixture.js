'use strict';
const {fresh}=require('./dispatch-fixture');
function jointWorld({root,player=false,type='askeri'}={}){
 const h=fresh(0,root);h.sb.player=player;h.sb.type=type;
 h.run(`G.day=100.5;G.memAge=3;G.fleets=[];G.feds=[];G.council=null;G.jointOps=typeof jointEmpty==='function'?jointEmpty():undefined;G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.cfg.gates=true;
 for(const e of G.emps){e.ai=e.id!==0;e.dead=false;e.wild=false;e.crisisSide=false;e.colonies=[];e.home=e.id;e.contact={};e.intel={};e.aiIntel=undefined;e.war={};e.ally={};e.wg={};e.passage={};e.mem={};e.grudge={};e.nap={};e.warSince={};e.warDefense={};e.cap=500;e._powAt=-1;e.mods.sensor=0;e.mods.spdMul=0;e.structs={};e.inc={ene:50,min:40,yiy:30,ala:25,tuk:10,ara:40,etk:20};for(const k in e.res)e.res[k]=10000;for(const o of G.emps)if(e!==o){e.contact[o.id]=true;e.rel[o.id]=65;}}
 for(const s of G.sys){s.owner=-1;s.x=10000+s.id*100;s.y=10000;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();s.lanes=[];s.def=0;s.nest=false;s.ruin=false;s.nebulaS=false;s.built={};s.work=[];s.queue=[];for(const p of s.planets)p.col=null;}
 for(let i=0;i<7;i++){const s=G.sys[i];s.owner=i;s.x=i*120;s.y=0;const p=s.planets[0];p.col=JSON.parse(JSON.stringify(template));p.owner=i;p.col.e=i;p.col.b={};G.emps[i].colonies=[{s:i,p:0}];}
 G.sys[7].owner=1;G.sys[7].x=380;G.sys[7].y=50;G.sys[8].owner=4;G.sys[8].x=580;G.sys[8].y=50;
 link(1,7);link(2,7);link(3,7);link(7,8);link(8,4);link(0,7);link(5,7);link(6,7);
 var ids=player?[0,1,2]:[1,2,3],enemy=4;
 var fed={id:100,name:'Ortak Test',type,leader:ids[0],founder:ids[0],members:ids.slice(),laws:{},charter:fedDefaultCharter(type),fund:{ene:0,ala:0},treasury:0,founded:0,typeSince:0,dutySince:{defense:0,offense:0},dutyConsent:{},invites:{},decisions:{},cohesion:70,nextVote:1000};G.feds=[fed];
 for(const a of ids)for(const b of ids)if(a!==b)G.emps[a].ally[b]=true;
 for(const id of ids){G.emps[id].war[enemy]=G.emps[enemy].war[id]=true;G.emps[id].wg[enemy]={t:'fetih',targets:[8],start:G.day};}
 var rootFront=warLedgerOpen(ids[0],enemy);for(const id of ids.slice(1))warLedgerOpen(id,enemy,{sponsor:ids[0],enemy,kind:'federation'});
 var guards=ids.map(id=>newFleet(G.emps[id],id,[{c:'kor'}],'Ana savunma '+id));
 var forces=ids.map((id,i)=>newFleet(G.emps[id],id,Array.from({length:10+i*5},()=>({c:'kor'})),'Destek '+id));forces[0].ships[0].c='zir';var anchor=player?forces[0]:null;
 for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};
 function observe(){for(const e of G.emps)aiObserve(e);}
 function context(){return jointContext(rootFront.campaign,0,ids[0],enemy);}
 function plan(kind='capture',target=8){var r=jointCreate(context(),kind,target);if(!r.ok)throw Error(r.why);return r.plan;}
 function tick(days=1){for(let i=0;i<days*20;i++){G.day+=.05;if(typeof jointTick==='function')jointTick();stepFleets(.05);}}
 observe();`);return h;
}
module.exports={jointWorld};
