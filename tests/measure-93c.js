'use strict';
// Deterministic stress observation; no machine-speed pass threshold.
const fs=require('fs'),{performance}=require('perf_hooks'),{fresh}=require('./helpers/dispatch-fixture');
const h=fresh();h.run(`
while(G.sys.length<400){const id=G.sys.length;G.sys.push({...G.sys[9],id,name:'Perf '+id,x:id*100,y:0,planets:[],lanes:[],queue:[],built:{},owner:E.id,seen:[E.id],surv:[E.id]});}
for(let i=0;i<G.sys.length;i++){G.sys[i].owner=E.id;G.sys[i].lanes=[];if(i>0)link(i-1,i);}
for(let i=10;i<300;i+=10)G.sys[i].built.tersane_h=1;
A.sys=399;A.x=G.sys[399].x;E.techs.m_muhrip=E.techs.m_kruvazor=E.techs.m_zirhli=true;
setFleetTemplate(E,A,{kor:15,muh:10,kru:5},true);
var graphs=0,old=reinforcementRoutes;reinforcementRoutes=function(...a){graphs++;return old(...a)};
`);
let t=performance.now();h.run('var result=reinforceFleet(E,A)');const planningMs=performance.now()-t;
t=performance.now();h.run('fleetAutoReinforceTick();for(let i=0;i<1000;i++)fleetAutoReinforceTick()');const idleMs=performance.now()-t;
const out={systems:h.run('G.sys.length'),yards:h.run('G.sys.filter(s=>s.owner===E.id&&yardCount(s)>0).length'),planningMs,idle1000CallsMs:idleMs,graphSearches:h.run('graphs'),orders:h.run('result.siparis'),platform:'Node VM on host; not Android timing'};
fs.writeFileSync('tests/performance-93c.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
