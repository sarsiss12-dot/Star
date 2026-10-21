'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),baseline=process.env.STARS_96B_ROOT||path.resolve(root,'../baseline-96b'),out=path.join(__dirname,'audit-96c/campaign'),results=[];
const jobs=[];for(const seed of [11,99,404])jobs.push({seed,phase:'96b-final',source:baseline},{seed,phase:'96c-acceptance',source:root});jobs.push({seed:11,phase:'96c-acceptance-replay',source:root});
for(const {seed,phase,source}of jobs){
 const file=path.join(out,phase+'-'+seed+'.json');
 const r=spawnSync(process.execPath,[path.join(__dirname,'measure-ai-96c.js'),source,String(seed),file],{cwd:root,encoding:'utf8',timeout:300000,maxBuffer:8e6});
 fs.writeFileSync(file+'.log',(r.stdout||'')+(r.stderr||''));results.push({phase,seed,exit:r.status,error:r.error?.message});console.log(phase+'/'+seed+': '+r.status);
}
fs.writeFileSync(path.join(out,'final-run.json'),JSON.stringify({method:'Sequential campaign jobs, alternating baseline/current per seed, followed by identical seed-11 replay. Host timing is not Android FPS.',results},null,2));process.exitCode=results.some(r=>r.exit!==0)?1:0;
