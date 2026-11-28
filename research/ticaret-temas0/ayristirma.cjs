'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const [root,dir,seed='11',size='s500',count='16',months='36']=process.argv.slice(2);
const campaign=path.resolve(__dirname,'../ticaret-kok-neden0/campaign.cjs');
const variants={
  'kesif-kapali': `{const original=explorationContext;explorationContext=function(e){return original(e);};}`,
  'eski-harita': `nativeChartKnown=(s,id)=>s.seen.includes(id);`,
  'eski-liman': `Commerce.identifiedPort=function(viewer,s,owner){
    return viewer===owner||!!owner&&this.known(viewer,s)&&(intelOf(viewer,owner.id)>=2||
     (viewer===G.p?pVis(s):aiView(viewer).ctx.visible.has(s.id)));
  };`,
};
for(const [name,observation] of Object.entries(variants)){
  const observer=path.join(dir,name+'.js');
  fs.writeFileSync(observer,observation+'\n'+fs.readFileSync(path.resolve(__dirname,'temas-gozlemi.js'),'utf8'));
  const out=path.join(dir,name+'.json');
  const result=spawnSync(process.execPath,[campaign,seed,months,out,root,size,count],
    {stdio:'inherit',env:{...process.env,STARS_FAST_CAMPAIGN:'1',STARS_OBSERVER:observer}});
  if(result.status!==0)process.exit(result.status||1);
}
