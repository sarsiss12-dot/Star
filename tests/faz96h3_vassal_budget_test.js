'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const {strategyWorld}=require(base+'/tests/helpers/96c2-fixture');
const root=process.env.STARS_GAME_ROOT||base;
const crypto=require('crypto'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const results=[];
function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:String(error.stack)});}}
function world(){const h=strategyWorld(root);h.run(`a.overlord=b.id;a.vassalType='haracguzar';a.edicts={};a.vassalAnger=0;vassalInstall(b,a,'haracguzar',vassalDefaultTerms('haracguzar'),'test');a.inc={ene:100,min:50,ala:30,yiy:10,tuk:8,ara:20,etk:6};`);return h;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,JSON.stringify({a,b}));
test('all contract resources and science use gross positive income once',()=>{const h=world();h.run(`a.vassalContract.terms.tax={ene:.3,min:.2,ala:.1,yiy:.1,tuk:.1};a.vassalContract.terms.science=.1;var p=aiEconomyPlan(a)`);for(const [r,v]of Object.entries({ene:30,min:10,ala:3,yiy:1,tuk:.8,ara:2})){near(h.run('p.vassal.'+r),v);near(h.run('p.rows.'+r+'.net'),h.run('a.inc.'+r)-v);}});
test('decision-free calls preserve raw save and RNG and repeat exactly',()=>{const h=world();h.run(`var before=serialize(),rng=RND_STATE,p=JSON.stringify(aiEconomyPlan(a)),q=JSON.stringify(aiEconomyPlan(a))`);assert.equal(h.run('before===serialize()&&rng===RND_STATE&&p===q'),true);});
test('paid month marker does not erase recurring next-month obligation or double-charge stock',()=>{const h=world();h.run(`vassalTick();var paidStock=a.res.min,p=aiEconomyPlan(a)`);near(h.run('p.rows.min.stock'),h.run('paidStock'));near(h.run('p.rows.min.net'),40);});
test('estimate nominal dues equal actual fully funded transfer and actual tick stays idempotent',()=>{const h=world();h.run(`var dues=aiVassalBudget(a,a.inc),before={...a.res};vassalTick();var one={...a.res};vassalTick();`);for(const r of ['ene','min','ala','yiy','tuk','ara']){near(h.run('before.'+r+'-one.'+r),h.run('dues.'+r));near(h.run('one.'+r),h.run('a.res.'+r));}});
test('insufficient stock caps real transfer while forecast retains production liability',()=>{const h=world();h.run(`a.res.min=1;var due=aiVassalBudget(a,a.inc).min;vassalTick()`);near(h.run('due'),10);near(h.run('a.vassalTransfer.paid.min'),1);near(h.run('a.res.min'),0);near(h.run('aiEconomyPlan(a).rows.min.net'),40);});
test('negative and zero income never generate tax refund or add tax deficit',()=>{const h=world();h.run(`a.inc.min=-12;a.inc.ene=0;var p=aiEconomyPlan(a)`);near(h.run('p.rows.min.net'),-12);near(h.run('p.vassal.min'),0);near(h.run('p.vassal.ene'),0);});
test('extra tax and science edicts are independent real monthly liabilities',()=>{const h=world();h.run(`a.vassalContract.terms.science=.1;a.res.ara=100;a.edicts={ekVergi:{since:G.memAge||0},bilimPayi:{since:G.memAge||0}};var due=aiVassalBudget(a,a.inc),before={...a.res};vassalTick();edictTick();`);near(h.run('due.min'),15);near(h.run('due.ara'),5.6);near(h.run('before.min-a.res.min'),15);near(h.run('before.ara-a.res.ara'),5.6);});
test('legacy vassal contract matches actual default rates',()=>{const h=world();h.run(`delete a.vassalContract;var due=aiVassalBudget(a,a.inc),before={...a.res};vassalTick()`);near(h.run('due.min'),10);near(h.run('before.min-a.res.min'),10);});
test('expired contract forecast is clear before payment lifecycle processes expiry',()=>{const h=world();h.run(`a.vassalContract.expires=G.day;var due=aiVassalBudget(a,a.inc)`);near(h.run('due.min'),0);h.run('vassalTalkTick()');assert.equal(h.run('isVassal(a)'),false);near(h.run('aiEconomyPlan(a).vassal.min'),0);});
test('independence and dead lord end forecast; third-party war alone preserves dues',()=>{const h=world();h.run(`a.war[0]=true;var wartime=aiVassalBudget(a,a.inc).min;b.dead=true;var lordDead=aiVassalBudget(a,a.inc).min;b.dead=false;freeVassal(a,'test');var free=aiVassalBudget(a,a.inc).min`);near(h.run('wartime'),10);near(h.run('lordDead'),0);near(h.run('free'),0);});
test('renewed terms are used immediately without a stale tax cache',()=>{const h=world();h.run(`var old=aiVassalBudget(a,a.inc).min,t=vassalDefaultTerms('haracguzar');t.tax.min=.1;vassalInstall(b,a,'haracguzar',t,'renegotiated');var fresh=aiVassalBudget(a,a.inc).min`);near(h.run('old'),10);near(h.run('fresh'),5);});
test('lord does not pre-credit unguaranteed future vassal receipts',()=>{const h=world();h.run(`var due=aiEconomyPlan(b)`);near(h.run('due.vassal.min'),0);near(h.run('due.rows.min.net'),50);});
test('federation and vassal percentages use the same gross base and only one deduction each',()=>{const h=world();h.run(`G.feds=[{id:'fixture',members:[a.id,b.id],leader:b.id,type:'ticaret',laws:{},fund:{ene:0,ala:0}}];var p=aiEconomyPlan(a)`);near(h.run('p.vassal.ene'),20);near(h.run('p.federation.ene'),4);near(h.run('p.rows.ene.net'),76);});
test('Save v8 reload preserves exact liability without mutation',()=>{const h=world();h.run(`var raw=serialize();deserialize(raw);a=G.emps[a.id];var saved=serialize(),rng=RND_STATE,p=aiEconomyPlan(a)`);assert.equal(h.run('serialize()===saved&&RND_STATE===rng'),true);near(h.run('p.vassal.min'),Math.max(0,h.run('a.inc.min'))*.2);});

// Deterministic recurring-flow fixture, separate from the real seed campaigns.
// The H0 function is loaded verbatim to compare the actual purchase gate.
function purchaseCase(monthsOfMaintenance){
 const h=world(),source=fs.readFileSync(path.join(__dirname,'baselines/96h0/ai.js'),'utf8');
 const start=source.indexOf('function aiEconomyPlan('),end=source.indexOf('/* A stock-zero',start);
 assert(start>=0&&end>start);h.run(source.slice(start,end).replace('function aiEconomyPlan(','function baselineEconomyH0('));
 h.sb.cashMonthsH3=monthsOfMaintenance;
 h.run(`G.feds=[];a.vassalContract.terms.tax={ene:.2,min:0,ala:0,yiy:0,tuk:0};a.vassalContract.terms.science=0;
 for(const r in a.res)a.res[r]=10000;for(const r in a.inc)a.inc[r]=100;
 var maintenanceH3=SHIPS.kor.up*Math.max(.1,1+(a.mods.upMul||0))*(hasCivic(a,'mobilize')&&!Object.values(a.war||{}).some(Boolean)?2:1);
 var exportH3=maintenanceH3*2,priceH3=shipCost(a,'kor').ene||0;
 a.inc.ene=exportH3;a.res.ene=priceH3+cashMonthsH3*maintenanceH3;
 G.commerce=Commerce.empty();G.commerce.contracts=[{id:1,status:'active',legs:[{e:a.id,r:'ene',v:exportH3,every:30}]}];
 var oldGateH3=aiShipPurchaseSustainable(a,'kor',baselineEconomyH0(a)),newGateH3=aiShipPurchaseSustainable(a,'kor',aiEconomyPlan(a));
 // Follow six recurring payments using the real tax engine. Future production
 // here is a declared fixed fixture after the extra hull maintenance.
 a.res.ene-=priceH3;a.inc.ene=maintenanceH3;a.ai=false;var unpaidMonthH3=null,transferH3=[];
 for(let month=1;month<=6;month++){G.day+=30;a.res.ene+=a.inc.ene;vassalTick();transferH3.push(a.vassalTransfer.paid.ene);if(a.res.ene+1e-8>=exportH3)a.res.ene-=exportH3;else if(unpaidMonthH3===null)unpaidMonthH3=month;}
 `);return h;
}
test('tax-aware purchase gate rejects a legacy-approved runway that misses a real sixth monthly payment',()=>{const h=purchaseCase(6.6);assert.equal(h.run('oldGateH3'),true);assert.equal(h.run('newGateH3'),false);assert.equal(h.run('unpaidMonthH3'),6);assert(h.run('transferH3.every(v=>Math.abs(v-maintenanceH3*.2)<1e-8)'));});
test('a funded taxed purchase remains allowed and pays every real monthly tax without a resource grant',()=>{const h=purchaseCase(9);assert.equal(h.run('oldGateH3&&newGateH3'),true);assert.equal(h.run('unpaidMonthH3'),null);assert(h.run('a.res.ene>0&&transferH3.every(v=>Math.abs(v-maintenanceH3*.2)<1e-8)'));});

if(process.env.STARS_A1_RESULT)fs.writeFileSync(process.env.STARS_A1_RESULT,JSON.stringify({freshRerun:true,root,sourceHashes:Object.fromEntries(Object.keys(JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json'))).files).map(n=>[n,hash(fs.readFileSync(path.join(root,n)))])),runnerSHA256:hash(fs.readFileSync(__filename)),results,pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length},null,2));
for(const x of results)console.log(x.status+' '+x.name+(x.error?'\n'+x.error:''));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;

console.log("GEÇEN: "+results.filter(x=>x.status==="PASS").length+" KALAN: "+results.filter(x=>x.status==="FAIL").length);
