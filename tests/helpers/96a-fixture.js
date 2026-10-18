'use strict';
const {fresh}=require('./dispatch-fixture');
const setup=`
G.fleets=[];G.feds=[];G.council=null;G.raids={};G.cfg.pirates=true;G.commerce=Commerce.empty();G.day=120;G.inbox=[];
for(const e of G.emps){e.ai=e.id!==0;e.dead=false;e.wild=false;e.crisisSide=false;e.contact={};e.intel={};e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};e.war={};e.pact={};e.embargo={};e.colonies=[];e.inc={};e.tradeFlow={};e.overlord=null;for(const r in e.res)e.res[r]=100;for(const o of G.emps){e.contact[o.id]=true;e.rel[o.id]=90;e.intel[o.id]=3;}recalcMods(e);}
for(const s of G.sys){s.owner=-1;s.lanes=[];s.x=s.id*90;s.y=0;s.nebulaS=false;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();s.built={};s.nest=false;s.ruin=false;for(const p of s.planets){p.col=null;p.owner=-1;}}
function port(e,s){var p=G.sys[s].planets[0];p.owner=e.id;p.col=JSON.parse(JSON.stringify(template));p.col.e=e.id;p.col.b.liman=1;p.col.b.tersane=0;p.col.pop=30;e.colonies.push({s,p:0});G.sys[s].owner=e.id;e.home=s;}
port(G.p,0);port(G.emps[1],3);for(let i=0;i<3;i++){G.sys[i].lanes.push(i+1);G.sys[i+1].lanes.push(i);}
G.p.pact[1]=G.emps[1].pact[0]=true;
function terms(a=0,b=1,source=0,target=3){return {from:a,to:b,give:[{t:'freight',r:'min',v:12,source,target,every:30,months:12}],want:[{t:'freight',r:'ene',v:8,source:target,target:source,every:30,months:12}]};}
function advanceCargo(days){G.day+=days;Commerce.tick(days);}
function sign(){return executeDeal(terms());}
function total(r){return G.emps.reduce((n,e)=>n+(e.res[r]||0),0)+Commerce.state().convoys.reduce((n,c)=>n+(c.r===r?c.amount:0),0);}
`;
function cargoWorld(){const h=fresh();h.run(setup);return h;}
module.exports={cargoWorld,setup};
