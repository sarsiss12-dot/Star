'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const file=process.argv[2]||'/tmp/aiq0-saves/p23-404-60-ulu-9-final.sav',out=process.env.STARS_OUTPUT||'/tmp/defense0-diagnose',raw=fs.readFileSync(file),h=runtime();fs.mkdirSync(out,{recursive:true});h.sb.raw=raw.toString();assert(h.run('deserialize(raw)'));h.run('G.autoSave=false;var E=G.emps[2];aiObserve(E);');
const info=JSON.parse(h.run(`JSON.stringify({day:G.day,month:G.memAge,seed:G.seed,systems:G.sys.length,name:E.name,home:E.home,homeName:G.sys[E.home].name,resources:E.res,income:E.inc,plan:aiEconomyPlan(E),shipPlan:E.aiShipPlan,inventory:aiShipInventory(E),observedThreat:aiObservedThreat(E,E.home,false),defenseThreat:aiDefenseThreat(E,G.sys[E.home]),strategicFacts:aiStrategicFacts(E),strategy:E.aiStrategy,campaign:E.aiCampaign,
 knownPirates:G.fleets.filter(f=>f.sys===E.home&&hostile(E.id,f.e)).map(f=>({id:f.id,owner:f.e,wild:!!G.emps[f.e].wild,power:fleetPower(f),classes:f.ships.map(s=>s.c)})),
 hulls:['kor','esk','muh','kru','zir','ord'].map(cls=>({cls,access:shipBuildAccess(E,cls),price:shipCost(E,cls),definition:SHIPS[cls],sustainable:aiShipPurchaseSustainable(E,cls,aiEconomyPlan(E),{},true)})),
 colonies:E.colonies.map(c=>{const s=G.sys[c.s],p=s.planets[c.p];return {sys:c.s,planet:c.p,stab:p.col.stab,target:colonyStabilityTarget(E,s,p),bombed:p.col.bombed,bombKip:p.col.bombKip,shield:p.col.shield,garrison:p.col.garrison,buildings:p.col.b,jobs:p.col.q,fortressCost:buildingCost(E,'kale'),fortressAffordable:Object.entries(buildingCost(E,'kale')).every(([r,n])=>E.res[r]>=n)};}),
 federation:findFed(E),fronts:(G.warLedger?.fronts||[]).filter(f=>f.ended===null&&f.sides.includes(E.id)),
 contacts:G.emps.filter(o=>o!==E&&!o.dead&&E.contact[o.id]).map(o=>({id:o.id,name:o.name,ai:o.ai,wild:!!o.wild,relation:E.rel[o.id],ally:!!E.ally[o.id],pact:!!E.pact?.[o.id],intel:E.intel[o.id],knownPower:aiKnownPower(E,o),protection:aiProtection(E,o),binding:jointBinding(E,o),canDeclare:canDeclareWarOn(E,o)}))})`));
// Actual public gates in an isolated replay; no automatic acceptance is added.
h.run('var stock=JSON.stringify(E.res),beforeRng=RND_STATE;aiSubmitTick();var request=jointRequest(E,4,"defend",E.home);');
info.legalAidReplay=JSON.parse(h.run('JSON.stringify({jointRequestAsAI:request,protectionTalk:E.vassalTalk||null,submitCooldown:E._submitCd||null,resourcesUnchanged:stock===JSON.stringify(E.res),rngUnchanged:beforeRng===RND_STATE})'));
// Test identity substitution only: show the next public gate without issuing
// or accepting any offer. A real AI is not the local human in jointRequest.
h.run('var originalPlayer=G.p;G.p=E;var asPlayer=jointRequest(E,4,"defend",E.home);G.p=originalPlayer;');
info.legalAidReplay.sameIdentityPlayerGate=JSON.parse(h.run('JSON.stringify(asPlayer)'));
info.sourceSHA=crypto.createHash('sha256').update(raw).digest('hex');assert.equal(info.sourceSHA,'7d1037e1da8387e5a917ec4d258c718bdfbdc26b51b6e24c867482e96a94ab74');assert.equal(info.observedThreat,3848);assert.equal(info.defenseThreat,3848);assert.equal(info.knownPirates.length,13);assert(info.colonies.every(c=>c.stab===0&&c.target>0));assert.equal(fs.readFileSync(file).compare(raw),0);
fs.writeFileSync(path.join(out,'diagnosis.json'),JSON.stringify(info,null,2));console.log('PASS same checkpoint / observed threat3848 / real ship, fortress and legal help gates / original unchanged');
