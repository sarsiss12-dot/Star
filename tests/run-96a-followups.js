'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(__dirname,'audit-96a/followups');fs.mkdirSync(out,{recursive:true});
const initial=JSON.parse(fs.readFileSync(path.join(__dirname,'audit-96a/full/summary.json')));
const names=initial.results.filter(x=>(x.fail||x.exit)&&!['faz83_2_brand_test.js','faz83_3_render_recovery_test.js'].includes(x.name)).map(x=>x.name);let next=0;const results=[];
async function worker(){while(next<names.length){const name=names[next++];await new Promise(resolve=>{const p=spawn(process.execPath,[path.join(__dirname,name)],{cwd:root,stdio:['ignore','pipe','pipe']});let s='';p.stdout.on('data',b=>s+=b);p.stderr.on('data',b=>s+=b);const timer=setTimeout(()=>p.kill('SIGKILL'),300000);p.on('close',exit=>{clearTimeout(timer);const m=s.match(/GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);const r={name,exit,pass:m?+m[1]:0,fail:m?+m[2]:1};results.push(r);fs.writeFileSync(path.join(out,name+'.log'),s);console.log(name+': '+r.pass+'/'+r.fail);if(r.fail)console.log(s.split('\n').filter(x=>x.includes('✗')).join('\n'));resolve();});});}}
(async()=>{await Promise.all([worker(),worker()]);fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({results},null,2));process.exitCode=results.some(x=>x.exit||x.fail)?1:0;})();
