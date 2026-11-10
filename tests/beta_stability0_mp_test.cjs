'use strict';
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;function test(n,f){try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+e.stack);}}
test('B host-authorized merge redirects paid jobs; duplicate has no second effect',()=>{
 const h=world();h.run(`var E=G.emps[1],sys=G.sys[E.home],p=sys.planets.find(p=>p.col);p.col.b.tersane=1;
 var A=newFleet(E,sys.id,[{c:'kor'}]),B=newFleet(E,sys.id,[{c:'kor'}]);queueFleetShip(E,sys,'kor',A);`);
 const old=h.run('A.id'),root=h.run('B.id');assert.equal(cmd(h,'B',{kind:'merge',fleet:root}).status,'ok');
 assert(h.run('sys.queue.at(-1).delivery.fleet===B.id&&!G.fleets.includes(A)'));
 const a=cmd(h,'B',{kind:'merge',fleet:root});assert.notEqual(a.status,'ok');
 assert(h.run('G.fleetJournal.some(r=>r.fleet===A.id&&r.replacement===B.id)'));
});
test('B bulk recovery: exact ACK, replay, C ownership, private mirror and rally π',()=>{
 const h=world();h.run(`var E=G.emps[1],sys=G.sys[E.home];sys.planets.find(p=>p.col).col.b.tersane=1;sys.queue=[];
 var T=newFleet(E,sys.id,[{c:'kor'}]),lost=2000000000;sys.rally={1:{fleet:lost},3:{fleet:987654321}};
 queueShip(E,sys,'kor');sys.queue.at(-1).delivery={fleet:lost,hold:true};
 for(let i=0;i<4;i++){const n=newFleet(E,sys.id,[{c:'kor'}]);n.shipment={fleet:lost,state:'lost',attempts:0,next:0};}
 var g=fleetRecoveryGroups(E).find(g=>g.id===lost),stamp=fleetRecoveryStamp(g),before=JSON.stringify(E.res),rng=RND_STATE;
 var mir=StarsMirror.build(1);`);
 assert.equal(h.run('mir.sys[sys.id].ry[0].fleet'),2000000000);assert.deepEqual(h.run('JSON.stringify(Object.keys(mir.sys[sys.id].ry))'),'["0"]','only the own rally may enter the mirror');assert.equal(h.run('mir.sys[sys.id].q[0].e'),0);
 const packet={kind:'fleetRecovery',id:2000000000,action:'retarget',target:{fleet:h.run('T.id')},stamp:h.run('stamp')};
 const before=h.run('serialize()');assert.notEqual(cmd(h,'C',packet).status,'ok');assert.equal(h.run('serialize()'),before);
 assert.equal(cmd(h,'B',packet).status,'ok');assert.notEqual(cmd(h,'B',packet).status,'ok');
 assert(h.run('JSON.stringify(E.res)===before&&RND_STATE===rng&&sys.queue.length===1&&sys.queue[0].delivery.fleet===T.id'));
 assert(h.run('T.ships.length===5'));h.run('var mB=StarsMirror.build(1),mC=StarsMirror.build(3);');
 assert(h.run('mB.fleetJournal.length>0&&mB.fleetJournal.every(r=>r.owner===0)&&mC.fleetJournal.every(r=>r.owner===0)&&!mC.fleetJournal.some(r=>r.fleet===T.id)'));
 assert(h.run('!mC.sys[sys.id].q.length&&!mC.sys[sys.id].ry'));
});
test('untrusted extra actor keys and foreign destination rejected',()=>{
 const h=world();assert.notEqual(cmd(h,'B',{kind:'fleetRecovery',id:1,action:'hold',stamp:'0',owner:0}).status,'ok');
});
console.log(JSON.stringify({pass,fail}));if(fail)process.exitCode=1;
