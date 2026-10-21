'use strict';
// Refresh only suites which began before the final runtime edit. Latest unique
// results replace earlier executions; repeated checks never inflate the total.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'audit96f/final'),file=path.join(dir,'summary.json');
const runtime=fs.readdirSync(root).filter(n=>n.endsWith('.js')||n==='index.html'||n==='manifest.json');
const frozen=Math.max(...runtime.map(n=>fs.statSync(path.join(root,n)).mtimeMs));
const summary=JSON.parse(fs.readFileSync(file)),stale=summary.results.filter(r=>fs.statSync(path.join(dir,r.name+'.log')).mtimeMs-r.durationMs<frozen+2000);
fs.writeFileSync(path.join(__dirname,'audit96f/final-before-freeze-summary.json'),JSON.stringify(summary,null,2));
fs.mkdirSync(path.join(__dirname,'audit96f/before-freeze'),{recursive:true});
for(const r of stale)fs.copyFileSync(path.join(dir,r.name+'.log'),path.join(__dirname,'audit96f/before-freeze',r.name+'.log'));
let next=0;
async function worker(){while(next<stale.length){const previous=stale[next++],started=Date.now();const result=await new Promise(resolve=>{const c=spawn(process.execPath,[path.join(__dirname,previous.name)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});let output='',timer=setTimeout(()=>c.kill('SIGKILL'),180000);c.stdout.on('data',b=>output+=b);c.stderr.on('data',b=>output+=b);c.on('close',exit=>{clearTimeout(timer);const m=output.match(/GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);fs.writeFileSync(path.join(dir,previous.name+'.log'),output);resolve({name:previous.name,exit,durationMs:Date.now()-started,pass:m?+m[1]:0,fail:m?+m[2]:1,details:exit===0?'':output});});});summary.results[summary.results.findIndex(r=>r.name===previous.name)]=result;console.log(result.name+': '+result.pass+'/'+result.fail);}}
(async()=>{await Promise.all(Array.from({length:4},worker));summary.pass=summary.results.reduce((n,r)=>n+r.pass,0);summary.fail=summary.results.reduce((n,r)=>n+r.fail,0);summary.ok=summary.results.every(r=>r.exit===0&&!r.fail);summary.execution={scope:'Latest completed execution of each unique suite after final runtime edit',refreshedSuites:stale.length,frozenAt:new Date(frozen).toISOString(),runtimeSha256:Object.fromEntries(runtime.map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n))).digest('hex')]))};fs.writeFileSync(file,JSON.stringify(summary,null,2));console.log('SUITES: '+summary.suites+' GEÇEN: '+summary.pass+' KALAN: '+summary.fail+' REFRESHED: '+stale.length);process.exitCode=summary.ok?0:1;})();
