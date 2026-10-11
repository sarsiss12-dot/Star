'use strict';
// Explicit measurement, not part of run-all.js. No forced contacts or player bot.
const fs=require('fs'),path=require('path');
const {integratedCampaign}=require('./helpers/integrated-campaign');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/measure-91b.js OUTPUT.json [months]');
const months=Number(process.argv[3]||240);
if(!Number.isInteger(months)||months<1)throw Error('months must be a positive integer');
const gameBuild=fs.readFileSync(path.join(root,'main.js'),'utf8').match(/const BUILD_ID = '([^']+)'/)[1];
const report={phase:'91B',gameBuild,environment:'Node + fake DOM, actual production mechanics',
  scope:'No player actions; natural contacts; normal defeat stops a run; crisis and council off',runs:[]};
for(const size of ['buyuk','ulu'])for(const seed of [11,99,404]){
  const r=integratedCampaign(root,{seed,size,months});report.runs.push(r);
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({size,seed,months:r.months,stop:r.stopped,first:r.first,error:r.error,
    metrics:r.metrics,ms:r.ms}));
}
process.exitCode=report.runs.some(r=>r.error||Object.keys(r.first).length)?1:0;
