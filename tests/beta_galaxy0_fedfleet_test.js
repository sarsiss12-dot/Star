'use strict';
/* BETA-GALAXY.0 — federal filo bölünme / birleşme ve başkanın ayrılması. Gerçek runtime Node vm'de; MP komutu gerçek mp-core.
   FİKSTÜR (açıkça): tests/beta_fed_fleet0_test.js ile aynı federasyon kurulumu (devlet 0 başkan, 0–1 üye), federal filo doğrudan kurulur. */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(){
  const h=runtime({root:path.resolve(__dirname,'..')});h.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;`);
  h.run(`(()=>{const ms=[0,1],type='askeri';for(const a of ms)for(const b of ms)if(a!==b){G.emps[a].ally[b]=true;G.emps[a].contact[b]=true;G.emps[a].war[b]=false;G.emps[a].rel[b]=60;}
    const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test',type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:0,founder:0,members:ms.slice(),laws:{},treasury:0,fund:{ala:3000,ene:3000},nextVote:G.day+400,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds.push(f);federationIdentity(f);for(const id of ms){f.dutyConsent[id]={offense:false,since:G.day};const e=G.emps[id];for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],5000);const s=G.sys[e.home];if(!hasYard(s)){const p=s.planets.find(p=>p.owner===id&&p.col);p.col.b.tersane=(p.col.b.tersane||0)+1;}}
    globalThis.__fid=f.id;const fl=newFleet(G.emps[0],G.emps[0].home,[{c:'kru'},{c:'kru'},{c:'kor'},{c:'kor'}],'Federal Donanma');fl.federal=true;fl.fedId=f.id;globalThis.__ff=fl;})()`);
  return h;
}
const books=h=>J(h,`({up:fleetUpkeep(G.emps[0]),upA:fleetAlloyUpkeep(G.emps[0]),usage:fleetUsage(G.emps[0]),fed:fedFleetUpkeep(G.feds.find(f=>f.id===__fid),false),fedShips:G.fleets.filter(f=>f.federal&&f.fedId===__fid).reduce((n,f)=>n+f.ships.length,0),own:G.fleets.filter(f=>f.e===0&&!f.federal).reduce((n,f)=>n+f.ships.length,0)})`);
test('S1 federal filo türüne göre bölünür (splitType): yeni filo aynı federasyonda; başkanın kişisel bakımı/kapasitesi ve fon bakımı değişmez',()=>{
  const h=world(),b0=books(h);const nf=J(h,`(()=>{const n=splitType(G.emps[0],__ff,'kor',2);return {federal:!!n.federal,fedId:n.fedId,e:n.e,ships:n.ships.length};})()`);const b1=books(h);
  assert.deepEqual(nf,{federal:true,fedId:J(h,'__fid'),e:0,ships:2});assert.deepEqual(b1,b0);
});
test('S2 MP split komutu (misafir başkan, gerçek mp-core): yarıya bölünen federal filo federal kalır',()=>{
  const {world:mpw,cmd}=require('./helpers/beta-fed-found0-mp-world.cjs');const h=mpw();
  h.run(`(()=>{const ms=[1,0];const f={id:(G.fedUid=(G.fedUid||0)+1),name:'MP',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal'},politicsVersion:96,leader:1,founder:1,members:ms,laws:{},treasury:0,fund:{ala:1000,ene:1000},nextVote:G.day+400,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds.push(f);federationIdentity(f);const fl=newFleet(G.emps[1],G.emps[1].home,[{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'}],'Federal');fl.federal=true;fl.fedId=f.id;globalThis.__mf=fl;})()`);
  const id=J(h,'__mf.id'),r=cmd(h,'B',{kind:'split',fleet:id});assert.equal(r.status,'ok',JSON.stringify(r));
  const fl=J(h,`G.fleets.filter(f=>f.e===1&&f.sys===__mf.sys&&f.federal).map(f=>({id:f.id,n:f.ships.length,fedId:f.fedId}))`);
  assert.equal(fl.length,2,JSON.stringify(fl));assert.equal(fl.reduce((n,f)=>n+f.n,0),4);assert.ok(fl.every(f=>f.fedId===J(h,'__mf.fedId')),JSON.stringify(fl));
});
test('S3 federal ve kişisel filo birleşmez (motor reddi, açık gerekçe); aynı federasyonun iki filosu birleşir; AI otomatik birleştirmesi federali kişisele katmaz',()=>{
  const h=world();const r=J(h,`(()=>{const own=newFleet(G.emps[0],G.emps[0].home,[{c:'kor'}],'Kişisel');const a=mergeFleetInto(G.emps[0],own,[__ff]);const b=mergeFleetInto(G.emps[0],__ff,[own]);
    const half=splitType(G.emps[0],__ff,'kor',1);const c=mergeFleetInto(G.emps[0],__ff,[half]);return {a,b,c,ff:__ff.ships.length,own:own.ships.length,ownFed:!!own.federal};})()`);
  assert.equal(r.a.ok,false);assert.match(r.a.why,/Federal ve kişisel/);assert.equal(r.b.ok,false);assert.equal(r.c.ok,true);assert.equal(r.ff,4);assert.equal(r.own,1);assert.equal(r.ownFed,false);
  const ai=J(h,`(()=>{const ai=G.emps.find(e=>e.ai&&!e.wild&&e.id!==1);const s=ai.home;G.fleets=G.fleets.filter(f=>!(f.e===ai.id&&f.sys===s));const p=newFleet(ai,s,[{c:'kru'},{c:'kru'}]);const q=newFleet(ai,s,[{c:'kor'}]);q.federal=true;q.fedId=99;
    try{aiTurn(ai);}catch(err){}return {pFed:!!p.federal,qAlive:G.fleets.includes(q),qShips:q.ships.length,pShips:p.ships.length};})()`);
  assert.equal(ai.pFed,false);assert.equal(ai.qShips,1,'federal filo AI birleştirmesinde kişisele katılmadı');
});
for(const path of ['tamamlanma','aylık tarama'])test('S4 başkan sipariş sürerken federasyondan ayrılır ('+path+' önce): eski başkanın tersanesinde gemi teslim edilmez, bedel fona BİR KEZ döner; başkanlık devredilir',()=>{
  const h=world();const cost=J(h,"fedShipCost('kor').ala");const r0=J(h,`orderFederalShip(G.emps[0],G.emps[0].home,'kor')`);assert.equal(r0.ok,true);
  h.run(`G.emps[2].ally[0]=G.emps[0].ally[2]=true;G.emps[2].ally[1]=G.emps[1].ally[2]=true;G.feds.find(f=>f.id===__fid).members.push(2);leaveFederation(G.emps[0]);for(const e of G.emps){e.inc.ala=0;e.inc.ene=0;}`);
  const mid=J(h,`({leader:(G.feds.find(f=>f.id===__fid)||{}).leader,orders:G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.fed===__fid).length,0),fund:G.feds.find(f=>f.id===__fid).fund.ala,ships:G.fleets.filter(x=>x.federal&&x.fedId===__fid).reduce((n,x)=>n+x.ships.length,0)})`);
  const t=J(h,path==='tamamlanma'?`(()=>{const f=G.feds.find(f=>f.id===__fid);for(let i=0;i<60;i++){G.day+=1;dailyTick(1);}const a=f.fund.ala;const up=fedFleetUpkeep(f,false).ala;fedFundTick();return {afterDays:a,up,afterScan:f.fund.ala};})()`
    :`(()=>{const f=G.feds.find(f=>f.id===__fid);const up=fedFleetUpkeep(f,false).ala;fedFundTick();const a=f.fund.ala;for(let i=0;i<60;i++){G.day+=1;dailyTick(1);}return {up,afterScan:a,afterDays:f.fund.ala};})()`);
  const end=J(h,`({orders:G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.fed===__fid).length,0),ships:G.fleets.filter(x=>x.federal&&x.fedId===__fid).reduce((n,x)=>n+x.ships.length,0),fund:G.feds.find(f=>f.id===__fid).fund.ala})`);
  assert.notEqual(mid.leader,0);assert.equal(mid.orders,1);assert.equal(end.orders,0,'iş kapandı');assert.equal(end.ships,mid.ships,'yeni federal gemi teslim edilmedi');
  const expected=mid.fund+cost-t.up;assert.ok(Math.abs(end.fund-expected)<1e-6,'iade tam bir kez: '+JSON.stringify({mid,t,end,cost}));
});
test('S5 başkan değişir ama üye kalır: geçerli sipariş devralınır, gemi O ANKİ başkana federal doğar (F6 ile aynı kural), ödeme bir kez',()=>{
  const h=world();const r0=J(h,`orderFederalShip(G.emps[0],G.emps[0].home,'kor')`);assert.equal(r0.ok,true);const f0=J(h,'G.feds.find(f=>f.id===__fid).fund.ala');
  h.run(`G.feds.find(f=>f.id===__fid).leader=1;for(let i=0;i<60;i++){G.day+=1;dailyTick(1);}`);
  const r=J(h,`({orders:G.sys.reduce((n,s)=>n+s.queue.filter(q=>q.fed===__fid).length,0),newShip:G.fleets.filter(x=>x.federal&&x.fedId===__fid&&x!==__ff).map(x=>({e:x.e,c:x.ships.map(s=>s.c)})),fund:G.feds.find(f=>f.id===__fid).fund.ala})`);
  assert.equal(r.orders,0);assert.deepEqual(r.newShip,[{e:1,c:['kor']}]);assert.equal(r.fund,f0,'tamamlanmada ek ödeme/iade yok');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
