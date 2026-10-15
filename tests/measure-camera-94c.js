'use strict';
const {runtime}=require('./helpers/runtime'),fs=require('fs'),path=require('path');
const results=[];
for(const phase of ['94b','94c']){
 const root=path.resolve(__dirname,'../../faz'+phase),h=runtime({root,native:true,width:900,height:420});
 h.run(`setupGame({name:'Camera benchmark',race:'insan',traits:[],size:'ulu',shape:'sarmal',diff:'normal',seed:404,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;View.init();for(const s of G.sys){s.seen.push(0);s.surv.push(0);}G.vis=new Set(G.sys.map(s=>s.id));View.cam={x:G.W/2,y:G.H/2,z:.065,a:.35,tilt:1};var rng=RND_STATE;`);
 for(const tilt of phase==='94c'?[1,.78]:[1]){
  h.sb.tilt=tilt;h.run('View.cam.tilt=tilt;View.draw(1);View.draw(2)');
  const samples=[];for(let i=0;i<40;i++){const t=performance.now();h.run('View.draw(1234)');samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);results.push({phase,tilt,systems:100,frames:40,medianMs:samples[20],p95Ms:samples[38],rngUnchanged:h.run('rng===RND_STATE')});
  if(phase==='94c'&&tilt===.78)fs.writeFileSync('/tmp/stars94c-map.png',h.doc.getElementById('map').toBuffer('image/png'));
 }
}
fs.writeFileSync(path.join(__dirname,'audit-94c/camera-performance.json'),JSON.stringify(results,null,2));console.log(results);
