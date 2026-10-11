'use strict';
// Same real save and production spyTick in an old/new source directory.
const path=require('path');const {runtime}=require('./helpers/runtime');
const root=process.argv[2]||path.resolve(__dirname,'..');
const h=runtime({root});h.loadSave(process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
h.run(`var A=G.p,B=G.emps[1];
 for(const e of G.emps){e.envoy={};e.spy={};}
 for(const e of [A,B]){e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];
 e.mizac='tuccar';e._pers='tuccar';e.war={};e.mods.dipMul=0;e.mods.sensor=0;}
 A.contact[B.id]=B.contact[A.id]=true;A.rel[B.id]=B.rel[A.id]=0;
 A.intel={};A.intelP={};assignEnvoy(A,B.id);
 A.war[B.id]=B.war[A.id]=true;
 G.month++;if(G.month>12){G.month=1;G.year++;}envoyTick();
 var relAfter=A.rel[B.id];spyTick();
 var result={build:BUILD_ID,assignmentType:typeof A.envoy[B.id],
   warRelationGain:relAfter,warIntelProgress:A.intelP[B.id],
   mission:A.envoy[B.id].task||null,activeMonths:A.envoy[B.id].months??null};`);
console.log(JSON.stringify(h.run('result'),null,2));
