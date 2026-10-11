'use strict';
const path=require('path');const {runtime}=require('./runtime');
function fresh(actor=0,root=path.resolve(__dirname,'../..')){
 const h=runtime({root});h.loadSave(path.join(__dirname,'../fixtures/stars-2210-06.sav.json'));
 h.run(`var template=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
 G.fleets=[];G.cfg.gates=true;G.log=[];
 for(const e of G.emps){e.colonies=[];e.dead=false;e.wild=false;e.crisisSide=false;
 e.war={};e.ally={};e.passage={};e.civics=[];e.mizac=e._pers='yayilmaci';e.overlord=null;
 for(const k in e.res)e.res[k]=100000;}
 var E=G.emps[${actor}],O=G.emps[${actor===0?1:0}];
 for(const s of G.sys){s.owner=-1;s._reach=0;s.lanes=[];s.queue=[];s.rally={};s.built={};
 s.x=20000+s.id*1000;s.y=20000;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();s.anom=false;
 for(const p of s.planets)p.col=null;delete s.yardLock;delete s.loopBuild;}
 for(let i=0;i<10;i++){G.sys[i].owner=E.id;G.sys[i].x=i*100;G.sys[i].y=0;}
 var Y=G.sys[0];Y.planets[0].col=template;template.e=E.id;template.b.tersane=1;
 E.colonies=[{s:0,p:0}];E.home=0;E.cap=300;
 function link(a,b){G.sys[a].lanes.push(b);G.sys[b].lanes.push(a);}
 for(let i=0;i<5;i++)link(i,i+1);
 var A=newFleet(E,2,[{c:'kor'}],'A'),B=newFleet(E,4,[{c:'kor'}],'B');A.capTarget=B.capTarget=2;
 function finish(){for(const s of G.sys)for(const q of s.queue)q.left=0;dailyTick(.001);}
 function sail(){for(let i=0;i<12;i++)stepFleets(100);}
 `);return h;
}
module.exports={fresh};
