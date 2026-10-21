'use strict';
const {fresh}=require('./dispatch-fixture');
function world(members=[0,1,2]){
 const h=fresh();h.sb.members96=members;
 h.run(`G.day=360.5;G.year=2211;G.month=1;G.memAge=12;G.feds=[];G.council=null;G.fleets=[];G.log=[];G.inbox=[];G.diplomaticInbox=DiplomaticInbox.empty();
 for(const s of G.sys){s.owner=-1;s.nest=false;s.ruin=false;s.nebulaS=false;s.def=0;s.built={};s.work=[];s.lanes=[];s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();for(const p of s.planets)p.col=null;}
 for(const e of G.emps){e.ai=e.id!==0;e.dead=false;e.wild=false;e.crisisSide=false;e.overlord=null;e.origin='standart';e.colonies=[];e.home=e.id;e.civics=[];e.mizac=e.persLock='yayilmaci';delete e._pers;delete e._persAt;delete e._prof;e.war={};e.ally={};e.nap={};e.pact={};e.spy={};e.contact={};e.intel={};e.mem={};e.grudge={};e.aiIntel=undefined;e.ethics={mil:0,aut:0,mat:0,ahl:0};e.inc={ene:50,min:40,ala:30,yiy:30,tuk:20,ara:50,etk:10};for(const k in e.res)e.res[k]=10000;for(const o of G.emps)if(o!==e){e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=60;}}
 for(let i=0;i<7;i++){G.sys[i].owner=i;G.sys[i].x=i*100;G.sys[i].y=0;if(i>0){G.sys[i].lanes.push(i-1);G.sys[i-1].lanes.push(i);}newFleet(G.emps[i],i,[{c:'kor'},{c:'kor'}]);}
 var F={id:100,name:'96E Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:members96[0],founder:members96[0],members:members96.slice(),laws:{},fund:{ala:0,ene:0},treasury:0,founded:0,typeSince:0,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:10000};G.feds=[F];G.fedUid=100;
 for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;
 for(const e of G.emps){e.aiIntel={v:1,systems:Object.fromEntries(G.sys.filter(s=>s.seen.includes(e.id)).map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};recalcMods(e);}
 var E=G.p,T=G.emps[3];UI.fedVote=()=>{};
 function alliances(target){for(const id of F.members){G.emps[target].ally[id]=G.emps[id].ally[target]=true;}}
 function approve(){if(F.vote){const v=F.vote;v.yes=v.eligible.filter(id=>id!==0);v.no=[];return v.eligible.includes(0)?castFedVote(E,F.id,fedVoteToken(v),true):finishFedVote(F);}}
 `);return h;
}
module.exports={world};
