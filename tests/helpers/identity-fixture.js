'use strict';
const {fresh}=require('./dispatch-fixture');
function identityWorld(){const h=fresh();h.run(`G.feds=[];G.council=null;G.inbox=[];G.day=800;
 for(const e of G.emps){e.ai=e.id!==0;e.home=e.id;e.contact={};e.intel={};e.war={};e.ally={};e.nap={};e.overlord=null;e.civics=[];e.persLock=e.mizac='yayilmaci';delete e._prof;delete e._pers;for(const o of G.emps){e.contact[o.id]=true;e.intel[o.id]=3;}for(const r in e.res)e.res[r]=100000;}
 for(let i=0;i<G.emps.length;i++){G.sys[i].owner=i;G.sys[i].x=80+i*100;G.sys[i].y=80+(i%2)*80;G.sys[i].seen=[0];}
 G.vis=new Set(G.emps.map(e=>e.id));View.vw=900;View.vh=420;View.cam={x:450,y:180,z:.8};normalizeIdentities();
 function federation(ids=[1,2,3],type='askeri'){const f={id:1,type,name:fedName(null,type),members:ids,leader:ids[0],founder:ids[0],laws:{},charter:fedDefaultCharter(type),founded:0,dutySince:{defense:0,offense:0},dutyConsent:{}};G.feds.push(f);fedNormalize(f);return f;}
 var key=Object.keys(WAR_GOALS)[0];
 `);return h;}
module.exports={identityWorld};
