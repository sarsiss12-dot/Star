'use strict';
// Research only. Production files and original saves remain unchanged.
// The explicitly named causal control changes bombardment in a disposable copy.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const temporaryRoots=new Set();let cleanupInstalled=false;
exports.root=(base,mode)=>{
 if(mode==='base')return base;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-defense0-'+mode+'-'));
 fs.cpSync(base,dir,{recursive:true});temporaryRoots.add(dir);
 if(!cleanupInstalled){cleanupInstalled=true;process.once('exit',()=>{for(const p of temporaryRoots)fs.rmSync(p,{recursive:true,force:true});});}
 // Patch the test copy BEFORE the ledger installs its real wrappers. Patching
 // function.toString() after boot would accidentally replace those closures.
 function replace(name,from,to){const file=name==='invasionTick'?'economy.js':'ai.js',p=path.join(dir,file),src=fs.readFileSync(p,'utf8');assert.equal(src.split(from).length,2,name+' exact experiment seam');fs.writeFileSync(p,src.replace(from,to));}
 if(mode==='no-bombard'){
  replace('invasionTick','if (K.war > 0){','if (K.war > 0 && !(atk.wild && pl.owner===2)){');
  return dir; // ONLY this causal control skips pirate bombardment/RNG draws on actor 2.
 }
 assert(['defense','safe-yard','allied-defense'].includes(mode));
 // Candidate 1: the existing local defense allocation also handles observed
 // non-ledger threats. Never dispatch a weaker remote group into certain loss.
 replace('aiTurn','if (wars.length && armed.length){','if (armed.length && (wars.length || my.some(s=>aiDefenseThreat(e,s)>0))){');
 replace('aiMilitaryCampaign','for(const {f}of candidates){if(power>=t*1.15)break;',
  'if(!wars.length && power+candidates.reduce((n,x)=>n+fleetPower(x.f),0)<t*1.15)continue;\n    for(const {f}of candidates){if(power>=t*1.15)break;');
 if(mode==='allied-defense'){
  // Test of a legally hostile pirate target in already bound allied space:
  // no ledger front, war declaration, promise or other owner's command is forged.
  // Existing local observation, spare-force, route and upkeep gates are reused.
  replace('aiTurn','my.some(s=>aiDefenseThreat(e,s)>0)',
   '(my.some(s=>aiDefenseThreat(e,s)>0)||aiKnownSystems(e).some(s=>{const r=aiKnownSystem(e,s);return r.colonies>0&&r.owner!==e.id&&!!jointBinding(e,G.emps[r.owner])&&aiObservedThreat(e,s.id,false)>0;}))');
  replace('aiMilitaryCampaign','const threatened=my.map(s=>({s,t:aiDefenseThreat(e,s)}))',
   'const help=!wars.length&&my.every(s=>!aiDefenseThreat(e,s))?aiKnownSystems(e).filter(s=>{const r=aiKnownSystem(e,s);return r.owner!==e.id&&r.colonies>0&&!!jointBinding(e,G.emps[r.owner])&&aiObservedThreat(e,s.id,false)>0;}):[];\n  const threatened=my.concat(help).map(s=>({s,t:aiDefenseThreat(e,s)}))');
  replace('aiMilitaryCampaign','const candidates=free.filter(f=>!used.has(f.id)',
   'const spare=s.owner!==e.id?jointAvailable(e).fleets:null;\n    const candidates=free.filter(f=>(!spare||spare.some(g=>g.id===f.id))&&!used.has(f.id)');
  replace('aiMilitaryCampaign','for(const {f}of candidates){if(power>=t*1.15)break;',
   'if(spare&&!aiDeploymentSustainable(e,candidates.map(x=>x.f),s,aiEconomyPlan(e)))continue;\n    for(const {f}of candidates){if(power>=t*1.15)break;');
 }
 if(mode==='safe-yard'){
  // Candidate 2: defer hulls at a visibly occupied yard when the already funded
  // local/arriving fleet cannot contest orbit. No exempt/free replacement hull.
  replace('aiShipProduction','const yard=yards.map(s=>({s,wait:Math.min(...yardCompletionSlots(e,s))}))',
   'const yard=yards.filter(s=>{const danger=aiObservedThreat(e,s.id,false);return !danger || G.fleets.filter(f=>f.e===e.id && isArmed(f) && (f.sys===s.id || f.path.at(-1)===s.id)).reduce((n,f)=>n+fleetPower(f),0)>=danger*1.15;}).map(s=>({s,wait:Math.min(...yardCompletionSlots(e,s))}))');
 }
 return dir;
};
