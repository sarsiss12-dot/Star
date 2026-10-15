'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs'),path=require('path');
const results=[];
for(const phase of ['94c','94d']){
 const root=path.resolve(__dirname,'../../faz'+phase),h=runtime({root,native:true,width:900,height:420});
 h.run(`setupGame({name:'94D UI benchmark',race:'insan',traits:[],size:'ulu',shape:'sarmal',diff:'normal',seed:404,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;View.init();for(const s of G.sys){s.seen.push(0);s.surv.push(0);}G.vis=new Set(G.sys.map(s=>s.id));View.cam={x:G.W/2,y:G.H/2,z:.065,a:0,tilt:1};var rng=RND_STATE;`);
 for(const zoom of [.065,.3]){
  h.sb.zoom=zoom;h.run('View.cam.z=zoom;View.draw(1);View.draw(2)');
  const samples=[];for(let i=0;i<40;i++){const t=performance.now();h.run('View.draw(1234)');samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);results.push({phase,zoom,systems:h.run('G.sys.length'),frames:40,medianMs:samples[20],p95Ms:samples[38],rngUnchanged:h.run('rng===RND_STATE')});
 }
}
fs.writeFileSync(path.join(__dirname,'audit-94d/render-performance.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
