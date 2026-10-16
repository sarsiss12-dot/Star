'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs'),path=require('path');
const results=[];
for(const phase of ['94d','94d1']){
 const root=path.resolve(__dirname,'../../faz'+phase),h=runtime({root,native:true,width:900,height:420});
 h.run(`setupGame({name:'War map benchmark',race:'insan',traits:[],size:'ulu',shape:'sarmal',diff:'normal',seed:404,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;View.init();for(const s of G.sys){s.seen.push(0);s.surv.push(0);}G.vis=new Set(G.sys.map(s=>s.id));G.p.intel={};for(const e of G.emps){e.war={};G.p.contact[e.id]=true;G.p.intel[e.id]=3;}for(let i=0;i<4;i++){G.emps[i].war[i+1]=true;G.emps[i+1].war[i]=true;}View.cam={x:G.W/2,y:G.H/2,z:.065};var rng=RND_STATE;`);
 for(const mode of phase==='94d'?['savas']:['savas','diplomasi']){
  h.sb.mode=mode;h.run(`MAP_MODE=mode;${phase==='94d1'?'WAR_LINKS_ON=true;':''}View.bcache=null;View.draw(1);View.draw(2);`);
  const samples=[];for(let i=0;i<40;i++){const t=performance.now();h.run('View.draw(1234)');samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);
  results.push({phase,mode,systems:h.run('G.sys.length'),frames:40,medianMs:samples[20],p95Ms:samples[38],rngUnchanged:h.run('rng===RND_STATE')});
 }
}
fs.writeFileSync(path.join(__dirname,'audit-94d1/war-map-performance.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
