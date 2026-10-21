'use strict';
const path=require('path'),{fresh}=require('./dispatch-fixture');
function strategyWorld(root=path.resolve(__dirname,'../..')){const h=fresh(1,root);h.run(`
var a=E,b=O;for(const e of G.emps){e.dead=![a.id,b.id].includes(e.id);e.overlord=null;e.fed=null;e.factions=[];e.war={};e.ally={};e.embargo={};e.pact={};e.nap={};e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};e.aiTalk={};e.exh={};e.res={ene:2000,min:3000,yiy:1000,ala:800,tuk:1000,ara:0,etk:1000};e.inc={ene:100,min:50,yiy:10,ala:30,tuk:8,ara:20,etk:6};e.megaReserve=e.colossusReserve=0;e.crisis=false;e.shortage=false;e.contact={};e.intel={};e.rel={};e.techs={};recalcMods(e);}
G.day=1200;G.month=4;G.year=2213;G.fleets=[];G.feds=[];G.jointOps={v:1,seq:1,plans:[],cooldowns:{}};G.commerce=Commerce.empty();G.construction=RemoteConstruction.empty();G.council=null;
for(const s of G.sys){s.owner=-1;s.lanes=[];s.built={};s.work=[];s.nest=false;s.ruin=false;s.nebulaS=false;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();s.x=s.id*90;s.y=0;for(const p of s.planets){p.owner=-1;p.col=null;}}
function colony96(e,id){var p=G.sys[id].planets[0];p.owner=e.id;p.col=JSON.parse(JSON.stringify(template));p.col.e=e.id;p.col.pop=30;p.col.b={santral:3,maden:2,dokum:1,fabrika:1,liman:1,tersane:1,lab:1};p.col.q=[];G.sys[id].owner=e.id;e.colonies=[{s:id,p:0}];e.home=id;}
colony96(a,0);colony96(b,2);link(0,1);link(1,2);a.cap=200;b.cap=200;a.contact[b.id]=b.contact[a.id]=true;a.intel[b.id]=3;b.intel[a.id]=3;a.rel[b.id]=b.rel[a.id]=-90;
var f=newFleet(a,0,Array.from({length:10},()=>({c:'kor'})),'Asıl filo'),foe=newFleet(b,2,[{c:'kor'}],'Rakip');remember(a,b.id,'sistemAldi');a._powAt=b._powAt=-1;RND_STATE=1;aiObserve(a);aiObserve(b);a.aiIntel.systems[2]={owner:b.id,defense:sysDefense(G.sys[2]),colonies:1,capital:true,day:G.day};AI_VIEW_CACHE.delete(a);aiProfile(a);
`);return h;}
module.exports={strategyWorld};
