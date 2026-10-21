'use strict';
const {cargoWorld}=require('./96a-fixture');
function warWorld(){const h=cargoWorld();h.run(`
var a=G.p;
for(const e of G.emps){e.dead=e.id>3;e.ai=false;e.ally={};e.pact={};e.embargo={};e.smuggle={};e.origin='standart';e.race='insan';e.crisis=false;e.ethics={mil:0,aut:0,mat:0,ahl:0};e.civics=[];e.extra={};e.techs={};e.factions=[];for(const r in e.res)e.res[r]=2000;}
for(const e of G.emps)e.colonies=[];for(const s of G.sys){s.owner=-1;s.lanes=[];s.built={};s.cr=0;s.x=s.id*90;for(const p of s.planets){p.col=null;p.owner=-1;}}
port(a,0);port(a,1);port(G.emps[1],2);port(G.emps[2],3);port(G.emps[3],4);
for(let i=0;i<10;i++){G.sys[i].lanes.push(i+1);G.sys[i+1].lanes.push(i);}G.sys[0].lanes.push(3,4);G.sys[3].lanes.push(0);G.sys[4].lanes.push(0);
for(const e of G.emps.filter(e=>!e.dead)){for(const o of G.emps.filter(e=>!e.dead)){if(e!==o)e.pact[o.id]=true;}for(const c of e.colonies){const p=G.sys[c.s].planets[0];p.col.b={santral:5,maden:2,dokum:2,fabrika:2,ciftlik:3,liman:2,tersane:1};p.col.pop=40;}e.home=e.id===0?0:e.colonies[0].s;recalcMods(e);}
G.council={dead:false,members:[0,1,2,3],president:3,laws:{},targeted:{},pariahs:{},vote:null};
var fleet=newFleet(a,10,Array.from({length:12},()=>({c:'kor'})),'Uzak operasyon');
for(const e of G.emps.filter(e=>!e.dead)){e._trAt=-1;e.trade=tradeInfo(e);recalcMods(e);e.inc=empireIncome(e);}
function enact(key,target=null){G.council.vote={key,target,yes:[1,2,3],no:[],done:false,sponsor:3};finishCouncilVote();}
function refresh(){for(const e of G.emps.filter(e=>!e.dead))e._trAt=-1;for(const e of G.emps.filter(e=>!e.dead))e.trade=tradeInfo(e);for(const e of G.emps.filter(e=>!e.dead)){recalcMods(e);e.inc=empireIncome(e);}}
function measure(){refresh();var report=a._incomeDetail;
var stock=a.res.ene,net=a.inc.ene,cor=shipCost(a,'kor');return {energyProduction:report.sum.ene.production,energyConsumption:report.sum.ene.consumption,networkEnergy:report.rows.filter(x=>x.r==='ene'&&x.name==='Ticaret ağı üretim katkısı').reduce((n,x)=>n+x.n,0),openLinks:a.trade.links.filter(l=>!l.bl).length,networkMul:a.trade.mul,energyNet:net,alloyNet:a.inc.ala,energyUpkeep:fleetUpkeep(a),alloyUpkeep:fleetAlloyUpkeep(a),supply:fleetSupply(a,fleet),distance:supplyDistance(a,fleet),remoteEnergyMultiplier:1+(1-fleetSupply(a,fleet))*2.2,stock,monthsToZero:net<0?stock/-net:null,capacity:a.cap,usage:fleetUsage(a),power:totalPower(a),shipCost:cor,affordableHulls:Math.floor(Math.max(0,Math.min((a.res.ala||0)/(cor.ala||1),a.cap-fleetUsage(a)))),embargo:embargoPressure(a),embargoMods:embargoMods(a),councilMods:councilMods(a),pariah:isPariah(a),blocksWar:councilBlocksWar(G.emps[1],a),pacts:Object.values(a.pact).filter(Boolean).length};}
`);return h;}
module.exports={warWorld};
