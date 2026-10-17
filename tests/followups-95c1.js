'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const names=['faz85e_event_inbox_continuity_test.js','faz86b_deal_engine_test.js','faz86c_1_quote_effective_plan_test.js','faz86c_2_transaction_test.js','faz86c_strict_deal_ai_test.js','faz87d_offer_repetition_test.js','faz95c1_diplomacy_test.js'];
const dir=path.join(__dirname,'logs-95c1-followup');fs.mkdirSync(dir,{recursive:true});let next=0;const results=[];
async function worker(){while(next<names.length){const name=names[next++],start=Date.now();const result=await new Promise(resolve=>{
 const p=spawn(process.execPath,[path.join(__dirname,name)],{cwd:path.resolve(__dirname,'..'),env:process.env,stdio:['ignore','pipe','pipe']});let output='';p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>output+=d);const timer=setTimeout(()=>p.kill('SIGKILL'),180000);
 p.on('close',(exit,signal)=>{clearTimeout(timer);fs.writeFileSync(path.join(dir,name+'.log'),output);const m=output.match(/GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);resolve({name,exit:exit??1,signal,durationMs:Date.now()-start,pass:m?+m[1]:0,fail:m?+m[2]:1});});
 });results.push(result);console.log(JSON.stringify(result));}}
(async()=>{await Promise.all([worker(),worker()]);results.sort((a,b)=>a.name.localeCompare(b.name));const summary={suites:results.length,pass:results.reduce((n,r)=>n+r.pass,0),fail:results.reduce((n,r)=>n+r.fail,0),ok:results.every(r=>r.exit===0&&!r.fail),results};fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));console.log(`GEÇEN: ${summary.pass} KALAN: ${summary.fail}`);process.exitCode=summary.ok?0:1;})();
