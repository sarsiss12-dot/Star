'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const mockOnly=process.argv.includes('--mock-only');
const all=fs.readdirSync(__dirname).filter(n=>n.endsWith('_test.js')).sort();
const selected=process.env.STARS_TEST_FILTER;
const tests=all.filter(n=>(!mockOnly || !n.includes('_native_canvas_')) && (!selected || n.includes(selected)));
const concurrency=Math.max(1,Math.min(4,Number(process.env.STARS_TEST_WORKERS)||2));
const timeout=Math.max(1000,Math.min(300000,Number(process.env.STARS_TEST_TIMEOUT_MS)||180000));
const logs=process.env.STARS_TEST_LOGS;
if(logs)fs.mkdirSync(logs,{recursive:true});
let next=0;
const results=[];
async function worker(){
  while(next<tests.length){
    const name=tests[next++];
    const result=await new Promise(resolve=>{
      const child=spawn(process.execPath,[path.join(__dirname,name)],{
        cwd:path.resolve(__dirname,'..'),env:process.env,stdio:['ignore','pipe','pipe']
      });
      let text='',settled=false;const started=Date.now();
      child.stdout.on('data',b=>text+=b);child.stderr.on('data',b=>text+=b);
      const timer=setTimeout(()=>child.kill('SIGKILL'),timeout);
      function finish(exit,error){
        if(settled)return;settled=true;clearTimeout(timer);
        const m=text.match(/GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);
        if(logs)fs.writeFileSync(path.join(logs,name+'.log'),text);
        resolve({name,exit,durationMs:Date.now()-started,pass:m?+m[1]:0,fail:m?+m[2]:1,...(error?{error}:{}),
          details:exit===0?'':text.split('\n').filter(s=>s.includes('✗')||s.includes('Error')).join('\n')});
      }
      child.on('error',e=>finish(1,e.message));child.on('close',(code,signal)=>finish(code??1,signal));
    });
    results.push(result);
    console.log(`${result.name}: ${result.pass}/${result.fail} (exit ${result.exit})`);
    if(result.details)console.error(result.details);
  }
}
(async()=>{
  await Promise.all(Array.from({length:Math.min(concurrency,tests.length)},worker));
  results.sort((a,b)=>a.name.localeCompare(b.name));
  const summary={suites:results.length,skipped:all.filter(n=>!tests.includes(n)),
    pass:results.reduce((s,r)=>s+r.pass,0),fail:results.reduce((s,r)=>s+r.fail,0),
    ok:results.every(r=>r.exit===0&&r.fail===0),results};
  if(logs)fs.writeFileSync(path.join(logs,'summary.json'),JSON.stringify(summary,null,2));
  if(summary.skipped.length)console.log('SKIPPED (not verified): '+summary.skipped.join(', '));
  console.log(`SUITES: ${summary.suites} GEÇEN: ${summary.pass} KALAN: ${summary.fail}`);
  process.exitCode=summary.ok?0:1;
})();
