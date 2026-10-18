'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{performance}=require('perf_hooks');
const {fresh}=require('./helpers/dispatch-fixture'),{setup,sensorWorld}=require('./helpers/95e3-fixture');
const root=path.resolve(__dirname,'..'),baseline=process.env.STARS_BASELINE_ROOT;
if(!baseline)throw Error('STARS_BASELINE_ROOT required');
const old=fresh(0,baseline),now=fresh(0,root);for(const h of [old,now])h.run(setup);
const operations=`var scout=newFleet(G.p,0,[{c:'bil'}],'Kontrol');scout.auto=true;var rng=RND_STATE;var ctx=explorationContext(G.p);var route=JSON.stringify([Array.from(ctx.known),Array.from(ctx.visible),Array.from(ctx.frontier)]);doSurvey(scout,G.sys[0]);var comparison=JSON.stringify({route,scout:scout.path,ships:scout.ships,seen:G.sys.map(s=>s.seen),surv:G.sys.map(s=>s.surv),rng:RND_STATE});`;
for(const h of [old,now])h.run(operations);
assert.equal(now.run('comparison'),old.run('comparison'));
const h=sensorWorld();h.run('G.p.visionFrom[1]=true;shareVision(G.emps[1],G.p)');
function timing(code,runs){h.run(code);const t=performance.now();for(let i=0;i<runs;i++)h.run(code);return (performance.now()-t)/runs;}
const measurement={systems:h.run('G.sys.length'),fleets:h.run('G.fleets.length'),nativeRefreshAverageMs:timing('refreshSharedVision()',100),cached10000pVisAverageMs:timing('for(let i=0;i<10000;i++)pVis(G.sys[6])',10),scienceNoTreatyMatchesBaseline:true,physicalAndroid:false,caveat:'Concurrent host load; bounded sensor fixture, not a device FPS or large-galaxy benchmark. pVis scan exclusion is asserted separately.'};
fs.writeFileSync(path.join(root,'tests/audit-95e3/performance-science.json'),JSON.stringify(measurement,null,2));console.log(measurement);
