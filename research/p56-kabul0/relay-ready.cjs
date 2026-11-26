'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

const roots=process.argv.slice(2).map(root=>path.resolve(root));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stars-relay-ready-'));
const preload=path.join(temp,'startup-barrier.cjs');
fs.writeFileSync(preload,`const log=console.log;
console.log=function(message,...rest){
 if(typeof message==='string'&&message.startsWith('STARS MP.1 relay ')){
  log.call(this,'signal-listeners='+process.listenerCount('SIGTERM'));
  log.call(this,message,...rest);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,400);
 }else log.call(this,message,...rest);
};`);

function attempt(root,barrier){
 return new Promise(resolve=>{
  const relay=path.join(root,'research/mp1/server/relay.js');
  const child=spawn(process.execPath,barrier?['--require',preload,relay]:[relay],{
   cwd:root,env:{...process.env,MP1_PORT:'0',MP1_BIND:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  let output='',error='',sent=false;
  child.stdout.on('data',data=>{
   output+=data;
   if(!sent&&/STARS MP\.1 relay http:\/\//.test(output)){sent=true;child.kill('SIGTERM');}
  });
  child.stderr.on('data',data=>{error+=data;});
  const timer=setTimeout(()=>child.kill('SIGKILL'),10000);
  child.on('close',(code,signal)=>{
   clearTimeout(timer);
   resolve({root:path.basename(root),barrier,sent,code,signal,listeners:Number(/signal-listeners=(\d+)/.exec(output)?.[1]??-1),error});
  });
 });
}
(async()=>{
 try {
  const results=[];
  for(const root of roots){
   for(let n=0;n<4;n++)results.push(await attempt(root,false));
   for(let n=0;n<2;n++)results.push(await attempt(root,true));
  }
  console.log(JSON.stringify(results,null,2));
 } finally { fs.rmSync(temp,{recursive:true,force:true}); }
})();
