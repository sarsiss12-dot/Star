'use strict';
const assert=require('assert/strict'),path=require('path');
const {integratedCampaign}=require('./helpers/integrated-campaign');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.message);}}
const cfg={seed:404,size:'buyuk',months:120};
const observed=integratedCampaign(ROOT,cfg);
const bare=integratedCampaign(ROOT,{...cfg,observe:false});
test('ölçüm açık/kapalı gerçek günlük dünya kaydı ve RNG birebir aynı',()=>{
 for(const r of [observed,bare]){assert.equal(r.error,undefined);assert.deepEqual(r.first,{});}
 assert.equal(observed.saveSHA256,bare.saveSHA256);assert.equal(observed.rng,bare.rng);
 assert.equal(observed.steps,bare.steps);assert.deepEqual(observed.stopped,bare.stopped);
});
test('aynı doğal kampanya tekrarında kararlar ve dünya deterministik',()=>{
 const again=integratedCampaign(ROOT,cfg);
 const withoutTime=({ms,...r})=>r;
 assert.deepEqual(withoutTime(again),withoutTime(observed));
});
test('gerçek seçici seçimleri ile motor çağrıları eksiksiz örtüşür',()=>{
 const s=observed.metrics.espionage;
 assert.ok(s.probes>0&&s.noChoice>0);
 for(const [key,count] of Object.entries(s.choices))assert.equal(s.operations[key].attempts,count,key);
 for(const [key,o] of Object.entries(s.operations)){
   assert.equal(o.attempts,o.resolved+o.rejected,key);
   assert.ok(o.caught<=o.resolved,key);
 }
});
test('kapsam dışı diplomasi, gerçek karar ve uygulama ayrı sayılır',()=>{
 const n=observed.metrics.negotiation;
 const total=o=>Object.values(o).reduce((a,b)=>a+b,0);
 assert.ok(n.attempts>0);assert.equal(n.attempts,total(n.outcomes));
 assert.equal(n.outcomes['no-decision']||0,total(n.excluded));
 assert.ok(n.applied<=(n.outcomes.kabul||0)+(n.outcomes['karsi-kabul']||0));
 assert.ok(n.maxRounds<=2);
});
test('temas zorlanmaz, gerçek günlük saat ve normal oyun sonu korunur',()=>{
 assert.equal(observed.initialContacts,0);assert.ok(observed.contacts>0);
 assert.ok(observed.metrics.movement.arrivals>0&&observed.metrics.movement.surveys>0);
 assert.equal(observed.calendarMonths,observed.months);assert.equal(observed.elapsedDays,observed.steps*.5);
 assert.ok(observed.months===120||observed.stopped&&observed.stopped.win===false);
 assert.equal(observed.situations,0);assert.deepEqual(observed.metrics.exceptions,{});
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
