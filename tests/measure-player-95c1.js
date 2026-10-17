'use strict';
const fs=require('fs'),path=require('path'),{performance}=require('perf_hooks');
const {fresh}=require('./helpers/dispatch-fixture'),{jointWorld}=require('./helpers/joint-fixture');
const quantile=(xs,q)=>xs.slice().sort((a,b)=>a-b)[Math.min(xs.length-1,Math.floor(xs.length*q))];
function measure(root){
 const h=fresh(0,root);h.run(`setupGame({name:'95C1 bounded routing',race:'insan',traits:[],size:'ulu',shape:'sarmal',diff:'normal',seed:404,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;G.fleets=[];G.feds=[];G.council=null;var E=G.p;
 for(const e of G.emps){e.war={};e.ally={};e.passage={};e.civics=[];e.mizac=e._pers='yayilmaci';}
 for(const s of G.sys){s.owner=0;s.lanes=[];s.x=s.id*100;s.y=0;s.built={};s.nest=false;s.ruin=false;s.seen=G.emps.map(e=>e.id);s.nebulaS=false;}
 for(let i=1;i<G.sys.length;i++){G.sys[i].lanes.push(i-1);G.sys[i-1].lanes.push(i);}
 G.sys[1].owner=1;G.vis=new Set(G.sys.map(s=>s.id));var target=newFleet(E,G.sys.length-1,[{c:'kor'}]);
 var shipments=[];for(let i=0;i<50;i++){var f=newFleet(E,0,[{c:'kor'}]);f.shipment={fleet:target.id,safe:true,state:'ready',attempts:0,next:0};f.joinFleet=target.id;shipments.push(f);}
 var calls=0,raw=0,oldRoute=shipmentRoute,oldPath=findPath;
 shipmentRoute=(...args)=>{calls++;return oldRoute(...args)};findPath=(...args)=>{raw++;return oldPath(...args)};
 function reset(){for(const f of shipments){f.path=[];f.mv=null;f.sys=0;f.shipment.state='ready';f.shipment.attempts=0;f.shipment.next=0;}calls=0;raw=0;}
 `);
 const samples=[];for(let i=0;i<25;i++){h.run('reset()');const t=performance.now();h.run('stepFleets(.001)');if(i>=5)samples.push(performance.now()-t);}
 const routing={systems:h.run('G.sys.length'),waitingShips:50,evaluatedPerTick:h.run('calls'),diagnosticPathCalls:h.run('raw'),medianMs:quantile(samples,.5),p95Ms:quantile(samples,.95),samplesMs:samples};
 h.run('var battleCalls=0;battleCount=()=>{battleCalls++;return 2};UI.topbar();var battleCallsPerRender=battleCalls;');
 const t=performance.now();h.run('for(let i=0;i<1000;i++)UI.topbar()');const ui={renders:1000,ms:performance.now()-t,battleCountCallsPerRender:h.run('battleCallsPerRender')};
 const joint=jointWorld({root});joint.run('var p=plan();jointTick();var calls=0,original=aiKnownRoute;aiKnownRoute=(...args)=>{calls++;return original(...args)};');const start=performance.now();joint.run('for(let i=0;i<1000;i++)jointTick()');
 return {root,routing,ui,stableJointTicks:{ticks:1000,routeCalls:joint.run('calls'),ms:performance.now()-start}};
}
const before=measure(path.resolve(process.argv[2]||path.join(__dirname,'../../baseline95c'))),after=measure(path.resolve(__dirname,'..'));
const result={method:'Sequential Node host; 5 warmups + 20 measured route ticks; 100 systems / 50 blocked real fleets, existing eight-route budget. UI uses mock DOM. No browser/Android FPS or layout claim.',before,after};
fs.writeFileSync(path.join(__dirname,'audit-95c1/performance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
