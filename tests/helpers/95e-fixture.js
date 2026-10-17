'use strict';
const {fresh}=require('./dispatch-fixture');
function world(){const h=fresh();h.run(`G.news=GalacticNews.empty();G.diplomaticInbox=DiplomaticInbox.empty();G.construction=RemoteConstruction.empty();G._newsSetup=false;G.day=120;G.year=2210;G.month=5;G.feds=[];G.council=null;G.fleets=[];G.inbox=[];
for(const e of G.emps){e.ai=e.id!==0;e.dead=false;e.wild=false;e.crisisSide=false;e.contact={};e.intel={};e.overlord=null;e.mods.sensor=0;e.mods.buildMul=0;e.ally={};e.war={};e.nap={};e.pact={};e.embargo={};e.spynet={};e.visionFrom={};e.shareVis={};e.passage={};for(const o of G.emps)if(e!==o){e.contact[o.id]=true;e.rel[o.id]=65;}}
for(const s of G.sys){s.owner=-1;s.built={};s.work=[];s.nest=false;s.ruin=false;s.nebulaS=false;s.surv=G.emps.map(e=>e.id);s.seen=s.surv.slice();s.lanes=[];s.x=10000+s.id*100;s.y=10000;}
for(let i=0;i<7;i++){G.sys[i].owner=0;G.sys[i].x=i*50;G.sys[i].y=0;}
for(let i=0;i<6;i++)link(i,i+1);G.vis=new Set(G.sys.map(s=>s.id));G._shareVisSet=null;
var builder=newFleet(G.p,0,[{c:'ins'}],'Usta');
function offer(n=10){return {from:1,to:0,give:[{t:'res',r:'min',v:n}],want:[],born:G.day,expires:G.day+180};}
function addOffer(n=10){UI.aiOffer(offer(n));return DiplomaticInbox.state().records.at(-1);}
function federation(members=[0,1,2]){var f={id:100,name:'Test Federasyonu',type:'bilimsel',leader:1,founder:1,members,laws:{},charter:fedDefaultCharter('bilimsel'),fund:{ene:0,ala:0},treasury:0,founded:0,typeSince:0,dutySince:{defense:0,offense:0},dutyConsent:{},invites:{},decisions:{},cohesion:70,nextVote:1000};G.feds=[f];fedNormalize(f);return f;}
`);return h;}
function harness(){let pass=0,fail=0;return {test(n,f){try{f();pass++;console.log('✓ '+n)}catch(e){fail++;console.log('✗ '+n+' — '+e.stack)}},end(){console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;}};}
module.exports={world,harness};
