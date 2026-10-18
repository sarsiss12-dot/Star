'use strict';
const {world}=require('./95e-fixture');
const setup=`
G.fleets=[];G.feds=[];G.council=null;
for(const e of G.emps){e.colonies=[];e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};e.mods.sensor=0;e.home=e.id;e.intel={};e.visionFrom={};e.shareVis={};e.spynet={};}
for(const s of G.sys){s.owner=-1;s.seen=[];s.surv=[];s.lanes=[];s.nebulaS=false;for(const p of s.planets)p.col=null;}
G.sys[0].owner=0;G.sys[0].seen=[0];
G.sys[3].owner=1;G.sys[3].seen=[1];G.sys[8].seen=[1];
for(const [a,b] of [[0,1],[2,3],[3,4],[4,5],[5,6],[6,7]]){G.sys[a].lanes.push(b);G.sys[b].lanes.push(a);}
var donor=newFleet(G.emps[1],6,[{c:'kor'}],'Sensör filosu');
var hidden=newFleet(G.emps[2],10,[{c:'kor'}],'GİZLİ FİLO');
G.vis=new Set([0,1]);G._shareVisSet=null;updateVision();
var key=Object.keys(WAR_GOALS)[0];
`;
function sensorWorld(){const h=world();h.run(setup);return h;}
module.exports={sensorWorld,setup};
