'use strict';
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'audit-96c');let failures=0;
for(const phase of ['95e2','95e3','96a','96b','96c']){
 const folder=path.join(out,'browser-final-'+phase),r=spawnSync(process.execPath,[path.join(__dirname,'browser-'+phase+'.js')],{cwd:root,env:{...process.env,STARS_BROWSER_OUTPUT:folder},encoding:'utf8',timeout:180000,maxBuffer:8e6});
 fs.writeFileSync(path.join(out,'browser-final-'+phase+'.log'),(r.stdout||'')+(r.stderr||''));console.log(phase+': '+r.status);if(r.status!==0)failures++;
}process.exitCode=failures?1:0;
