const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{P,make,cfg}=require('./host');
const raw=fs.readFileSync(path.resolve(__dirname,'../../phase96h61/evidence/control/M240-11/control-M240-11-11-checkpoint-60.save'),'utf8'),results=[];
for(const version of ['control','candidate']){
 const h=make(version,cfg(11),raw);const start=h.run('RND_STATE');const rows=[];
 for(const day of [1800,1830,2100,2159,2160,2190]){h.sb.day7=day;h.run(`G.day=day7;var e7=G.emps[1];aiMilitaryCampaign(e7,G.fleets.filter(f=>f.e===1&&isArmed(f)),G.sys.filter(s=>s.owner===1),G.emps.filter(o=>e7.war[o.id]&&!o.wild));`);rows.push(JSON.parse(h.run('JSON.stringify({day:G.day,campaign:G.emps[1].aiCampaign,rng:RND_STATE,orders:G.fleets.filter(f=>f.e===1).map(f=>({id:f.id,mv:f.mv,path:f.path}))})')));assert.equal(h.run('RND_STATE'),start,'campaign consumes no RNG');}
 if(version==='candidate'){
  assert(rows.slice(0,4).every(r=>r.campaign.failedTargets['6']===2160),'deadline stays fixed before expiry');
  assert(!Object.hasOwn(rows[4].campaign.failedTargets,'6'),'expired target becomes eligible');
  assert.equal(rows[4].campaign.lastProgress,2160,'retry starts new progress window');
  assert.notEqual(rows[4].campaign.phase,'supply','supplied force retries campaign');
  assert.equal(rows[5].campaign.lastProgress,2160,'no immediate restall');
  const before=h.run('JSON.stringify(G.emps[1].aiCampaign)');assert(h.run('deserialize(serialize())'));assert.equal(h.run('JSON.stringify(G.emps[1].aiCampaign)'),before,'Save8 preserves retry');
 }
 results.push({version,rows,rngPreserved:true});
}
fs.writeFileSync(path.join(P,'evidence/CAMPAIGN-LIFECYCLE.json'),JSON.stringify(results,null,2));console.log('PASS fixed deadline, expiration, retry progress, no immediate restall, Save8, RNG');
