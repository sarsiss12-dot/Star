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
// Uzun kampanyalar aynı CPU kotasını paylaşınca 180 sn sınırına ulaşıyordu.
const exclusive=new Set(['faz86f_ai_balance_test.js','faz89b_daily_campaign_test.js','faz91b_campaign_observer_test.js','faz96g2_setup_test.js']);
const regular=tests.filter(name=>!exclusive.has(name));
const heavy=tests.filter(name=>exclusive.has(name));
const runStarted=Date.now();
const results=[];
async function runSuite(name){
    const result=await new Promise(resolve=>{
      const child=spawn(process.execPath,[path.join(__dirname,name)],{
        cwd:path.resolve(__dirname,'..'),env:process.env,stdio:['ignore','pipe','pipe']
      });
      let text='',settled=false,timedOut=false;const started=Date.now();
      child.stdout.on('data',b=>text+=b);child.stderr.on('data',b=>text+=b);
      const timer=setTimeout(()=>{timedOut=child.kill('SIGKILL');},timeout);
      function finish(code,signal=null,error=null){
        if(settled)return;settled=true;clearTimeout(timer);
        const m=text.match(/GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);
        const exit=code??1;
        if(logs)fs.writeFileSync(path.join(logs,name+'.log'),text);
        const pass=m?+m[1]:0,fail=m?+m[2]:1;
        const status=timedOut?'TIMEOUT':exit||fail?'FAIL':pass>0?'PASS':'NOT RUN';
        resolve({name,status,exit,exitCode:code,signal,timedOut,durationMs:Date.now()-started,pass,fail,...(error?{error}:{}),
          details:status==='PASS'?'':text.split('\n').filter(s=>s.includes('✗')||s.includes('Error')).join('\n')});
      }
      child.on('error',e=>finish(null,null,e.message));child.on('close',(code,signal)=>finish(code,signal));
    });
    results.push(result);
    console.log(`${result.name}: ${result.pass}/${result.fail} (exit ${result.exit}) ${result.status}`);
    if(result.details)console.error(result.details);
}
(async()=>{
  const queue=regular.values();
  await Promise.all(Array.from({length:Math.min(concurrency,regular.length)},async()=>{
    for(const name of queue)await runSuite(name);
  }));
  for(const name of heavy)await runSuite(name);
  results.sort((a,b)=>a.name.localeCompare(b.name));
  const summary={suites:results.length,skipped:all.filter(n=>!tests.includes(n)),
    concurrency,timeoutMs:timeout,durationMs:Date.now()-runStarted,exclusive:heavy,
    pass:results.reduce((s,r)=>s+r.pass,0),fail:results.reduce((s,r)=>s+r.fail,0),
    ok:results.every(r=>r.exit===0&&r.fail===0),results};
  if(logs)fs.writeFileSync(path.join(logs,'summary.json'),JSON.stringify(summary,null,2));
  if(summary.skipped.length)console.log('SKIPPED (not verified): '+summary.skipped.join(', '));
  console.log(`SUITES: ${summary.suites} GEÇEN: ${summary.pass} KALAN: ${summary.fail}`);
  process.exitCode=summary.ok?0:1;
})();
