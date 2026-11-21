'use strict';
// Collect values immediately after the original host harness serializes each month.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [seed, mode, end] = process.argv.slice(2);
const root = path.resolve(__dirname, '../..');
const name = mode+'-'+seed;
const tmp = path.join(process.env.STARS_WORK || '/tmp/stars-pressure',name);
fs.mkdirSync(tmp,{recursive:true});
const fixture = 'reports/codex/evidence/mp-rakip-doktrinler0/';
const read = file => fs.readFileSync(path.join(process.env.STARS_EVIDENCE_ROOT || root,fixture,file));
const reference = JSON.parse(read('campaign/'+name+'.json')).months;
const cfg = path.join(tmp,'setup.json');
fs.writeFileSync(cfg,read(name+'/RD/setup-'+seed+'-'+mode+'.json'));
const helper = require('../../tests/helpers/runtime');
const runtime = helper.runtime;
const samples = [];
helper.runtime = options => {
  const h = runtime(options), run = h.run;
  h.run = (code,...args) => {
    const result = run(code,...args);
    if(code.includes('function stepMonth()'))run(fs.readFileSync(path.join(__dirname,'politics.js'),'utf8'));
    if(code!=='serialize()') return result;
    const month = samples.length;
    const sha = crypto.createHash('sha256').update(result).digest('hex');
    if(sha!==reference[month].save8 || run('RND_STATE')!==reference[month].rng) throw Error(name+' divergence m'+month);
    if(month%6===0) fs.writeFileSync(path.join(tmp,month+'.save'),result);
    const states=JSON.parse(run(`JSON.stringify(G.emps.filter(e=>e.ai&&!e.wild&&!e.dead&&!e.crisisSide).map(e=>{
      const cols=e.colonies.map(c=>G.sys[c.s].planets[c.p].col).filter(Boolean);
      return {id:e.id,stock:e.res,net:e.inc,pop:cols.reduce((v,c)=>v+c.pop,0),cap:cols.reduce((v,c)=>v+c.cap,0),
        crisis:e.crisis,shortage:e.shortage,goal:e.aiStrategy?.objective?.kind,contracts:G.commerce?.stats?.[e.id]?.deliveries||0};
    }))`));
    samples.push({month,sha,rng:reference[month].rng,states});
    return result;
  };
  process.on('beforeExit',()=>fs.writeFileSync(path.join(__dirname,'raw','politics-'+name+'.json.gz'),require('node:zlib').gzipSync(run('JSON.stringify(politicalLog)'))));
  return h;
};
process.env.STARS_CAMPAIGN_MONTHS=end;
process.argv.splice(2,Infinity,root,'host',cfg,path.join(tmp,'campaign.json'));
require('../mp-rakip-doktrinler0/campaign.cjs');
fs.writeFileSync(path.join(__dirname,'raw',name+'.json.gz'),require('node:zlib').gzipSync(JSON.stringify(samples)+'\n'));
