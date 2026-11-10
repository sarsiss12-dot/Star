'use strict';
const assert=require('node:assert/strict');
const {fresh:makeFresh}=require('./helpers/dispatch-fixture');const root=process.env.STARS_CONTROL_ROOT||(process.argv.includes('--baseline')?require('./helpers/beta-stability0-control.cjs').root():undefined);const fresh=actor=>makeFresh(actor,root);
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('PASS '+name);}catch(e){fail++;console.log('FAIL '+name+'\n'+e.stack);}}
const yes=(h,code)=>assert.equal(h.run(code),true,code);
for(const actor of (process.argv.includes('--baseline')?[0]:[0,1]))test('merge references owner '+actor,()=>{
 const h=fresh(actor);h.run(`A.sys=B.sys=2;queueFleetShip(E,Y,'kor',A);var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:A.id,state:'ready',attempts:0,next:0};N.joinFleet=A.id;Y.rally[E.id]={fleet:A.id};
 ${actor===0?'View.sel=B;UI.mergeFleets();':'mergeFleetInto(E,B,[A]);'}`);
 yes(h,'!G.fleets.includes(A)&&B.ships.length===2');
 yes(h,'Y.queue[0].delivery.fleet===B.id&&Y.rally[E.id].fleet===B.id&&N.shipment.fleet===B.id&&N.joinFleet===B.id');
});
test('full split transfers references; partial keeps original',()=>{
 const h=fresh();h.run(`queueFleetShip(E,Y,'kor',A);var old=A.id,nf=splitType(E,A,'kor',1);`);
 yes(h,'!G.fleets.includes(A)&&Y.queue[0].delivery.fleet===nf.id');
 h.run(`nf.ships.push({c:'kor',h:.73});var sf=splitType(E,nf,'kor',1);`);
 yes(h,'G.fleets.includes(nf)&&Y.queue[0].delivery.fleet===nf.id&&sf.ships[0].h===.73');
});
if(process.argv.includes('--baseline')){console.log(JSON.stringify({pass,fail}));process.exitCode=fail?1:0;return;}
test('missing target holds paid orders on load without changing hulls, cost or RNG',()=>{
 const h=fresh();h.run(`queueFleetShip(E,Y,'kor',A);var paid=JSON.stringify(Y.queue[0].paid),left=Y.queue[0].left;G.fleets=G.fleets.filter(f=>f!==A);var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:A.id,state:'lost',attempts:0,next:0};var rng=RND_STATE;deserialize(serialize());E=G.emps[0];Y=G.sys[0];`);
 yes(h,'Y.queue.length===1&&JSON.stringify(Y.queue[0].paid)===paid&&Y.queue[0].left===left&&Y.queue[0].delivery.hold===true&&RND_STATE===rng');
 h.run('var before=serialize();for(let i=0;i<5;i++)dailyTick(1);');yes(h,'Y.queue.length===1&&Y.queue[0].left===left');
});
test('reported-size synthetic fixture: 112 shipments, 117 paid orders preserved; no historical ships invented',()=>{
 const h=fresh();h.run(`A.id=1;B.id=1945;G.fleets=[];
 for(let i=0;i<27;i++){const f=newFleet(E,i<14?2:4,[{c:'kru'}]);f.shipment={fleet:1,state:'lost',attempts:0,next:0};}
 for(let i=0;i<85;i++){const f=newFleet(O,3,[{c:'kor'}]);f.shipment={fleet:998877,state:'lost',attempts:0,next:0};}
 for(let i=0;i<117;i++)Y.queue.push({e:E.id,cls:'kru',left:31,tot:60,paid:{ala:i===116?205:100},delivery:{fleet:i<4?1:1945}});
 var old=serialize(),rng=RND_STATE;deserialize(old);E=G.emps[0];O=G.emps[1];Y=G.sys[0];
 var groups=fleetRecoveryGroups(E),before=JSON.stringify(E.res),stamp=fleetRecoveryStamp(groups[0]);`);
 yes(h,'G.fleets.length===112&&G.fleets.reduce((n,f)=>n+f.ships.length,0)===112');
 yes(h,'groups.length===2&&groups[0].ships.length===27&&groups[0].jobs.length===4&&groups[1].jobs.length===113');
 yes(h,'Y.queue.reduce((n,q)=>n+q.paid.ala,0)===11805&&Y.queue.every(q=>q.left===31&&q.delivery.hold)');
 yes(h,`fleetRecoveryAction(E,1,'merge',undefined,stamp).ok`);
 yes(h,'G.fleets.filter(f=>f.e===0).length===2&&G.fleets.filter(f=>f.e===0).reduce((n,f)=>n+f.ships.length,0)===27');
 h.run(`var T=newFleet(E,5,[{c:'kor'}]);var g=fleetRecoveryGroups(E)[0],sig=fleetRecoveryStamp(g);var r=fleetRecoveryAction(E,1,'retarget',{fleet:T.id},sig),r2=fleetRecoveryAction(E,1,'retarget',{fleet:T.id},sig);`);
 yes(h,'r.ok&&!r2.ok&&Y.queue.slice(0,4).every(q=>q.delivery.fleet===T.id&&!q.delivery.hold)&&Y.queue.length===117');
 yes(h,'JSON.stringify(E.res)===before&&RND_STATE===rng');
 h.run(`var txt=serialize();deserialize(txt);E=G.emps[0];Y=G.sys[0];`);
 yes(h,'Y.queue.length===117&&Y.queue.reduce((n,q)=>n+q.paid.ala,0)===11805&&G.fleets.reduce((n,f)=>n+f.ships.length,0)===113');
 h.run(`O=G.emps[1];O.home=3;G.sys[3].owner=O.id;var foreignBefore=JSON.stringify(O.res);aiRecoverShipments(O);`);
 yes(h,'G.fleets.filter(f=>f.e===O.id).reduce((n,f)=>n+f.ships.length,0)===85&&!fleetRecoveryGroups(O).length&&JSON.stringify(O.res)===foreignBefore');
});
test('AI orphan recovery uses same paid jobs and bounded monthly decision',()=>{
 const h=fresh(1);h.run(`var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:1234567,state:'lost',attempts:0,next:0};queueShip(E,Y,'kor');Y.queue[0].delivery={fleet:1234567,hold:true};restoreFleetReferences();var before=JSON.stringify(E.res),rng=RND_STATE;aiRecoverShipments(E);`);
 yes(h,'N.shipment.fleet===A.id&&Y.queue.length===1&&Y.queue[0].delivery.fleet===A.id&&JSON.stringify(E.res)===before&&RND_STATE===rng');
});
test('real combat kills target once; audit and paid jobs remain',()=>{
 const h=fresh();h.run(`queueFleetShip(E,Y,'kor',A);var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:A.id,state:'ready',attempts:0,next:0};var id=A.id;applyDamage(E,[A],100000,O);stepFleets(.001);`);
 yes(h,'!G.fleets.some(f=>f.id===id)&&Y.queue.length===1&&Y.queue[0].delivery.hold&&N.ships.length===1&&N.shipment.state==="lost"');
 yes(h,'G.fleetJournal.filter(r=>r.fleet===id).length===1&&G.fleetJournal[0].reason==="combat"&&G.fleetJournal[0].ships===1&&G.fleetJournal[0].power>0');
});
test('real low-supply attrition leaves reinforcements alive',()=>{
 const h=fresh();h.run(`queueFleetShip(E,Y,'kor',A);var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:A.id,state:'ready',attempts:0,next:0};A.sys=9;A.x=G.sys[9].x;A.y=G.sys[9].y;G.sys[9].owner=O.id;G.sys[9].lanes=[];E.origin='standart';A.ships[0].h=.061;var supply=fleetSupply(E,A);attritionTick();`);
 yes(h,'supply<1&&!G.fleets.includes(A)&&Y.queue[0].delivery.hold');
 yes(h,'G.fleetJournal.find(r=>r.fleet===A.id).reason==="attrition"');
});
test('ownership, stale group, foreign target and unknown system rejected atomically',()=>{
 const h=fresh();h.run(`G.fleets=G.fleets.filter(f=>f!==A);queueShip(E,Y,'kor');Y.queue[0].delivery={fleet:1};var N=newFleet(E,0,[{c:'kor'}]);N.shipment={fleet:1,state:'lost',attempts:0,next:0};var g=fleetRecoveryGroups(E)[0],sig=fleetRecoveryStamp(g),before=serialize();`);
 yes(h,`!fleetRecoveryAction(O,1,'retarget',{fleet:B.id}).ok&&!fleetRecoveryAction(E,1,'retarget',{fleet:B.id},'stale').ok&&!fleetRecoveryAction(E,1,'retarget',{sys:999999},sig).ok&&serialize()===before`);
 h.run(`var foreign=newFleet(O,0,[{c:'kor'}]);before=serialize();`);
 yes(h,`!fleetRecoveryAction(E,1,'retarget',{fleet:foreign.id},sig).ok&&serialize()===before`);
});
test('bounded audit validator / old saves; pure UI does not mutate canonical state or RNG',()=>{
 const h=fresh();h.run(`var before=serialize(),rng=RND_STATE;fleetRecoveryGroups(E);UI.fleetRecoverySummary();UI.topStatusItems();`);
 yes(h,'serialize()===before&&RND_STATE===rng');
 h.run(`for(let i=0;i<300;i++)fleetRemovalRecord(A,'rule');var saved=serialize();deserialize(saved);`);
 yes(h,'G.fleetJournal.length===256&&JSON.parse(saved).v===8');
 h.run(`var bad=JSON.parse(serialize());bad.fleetJournal=[{id:1,owner:999999},...bad.fleetJournal];deserialize(JSON.stringify(bad));`);
 yes(h,'G.fleetJournal.length===256');
});
console.log(JSON.stringify({pass,fail}));process.exitCode=fail?1:0;
