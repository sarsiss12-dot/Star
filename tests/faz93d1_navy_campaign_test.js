'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{campaign}=require('./measure-navy-93d1');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'navy-93d1');
let pass=0,fail=0;function test(n,f){try{f();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const sum=(r,field,classes)=>r.empires.reduce((n,e)=>n+classes.reduce((a,k)=>a+(e[field][k]||0),0),0),mil=['kor','muh','kru','zir','esk'],after={};
for(const seed of [11,99,404]){
 const before=JSON.parse(fs.readFileSync(path.join(dir,`before-${seed}.json`),'utf8'));
 const r=after[seed]=campaign(root,seed);fs.writeFileSync(path.join(__dirname,`navy-94d1-after-${seed}.json`),JSON.stringify(r,null,2));
 test(seed+': real 120 months, bounded science, stronger navy, no negative resources',()=>{
  assert.equal(r.months,120);assert.equal(r.stopped,false);assert.deepEqual(r.negative,[]);assert.ok(sum(r,'orders',mil)>sum(before,'orders',mil)*3);assert.ok(sum(r,'orders',['bil'])<sum(before,'orders',['bil'])*.5);assert.ok(r.empires.every(e=>e.redundantScienceOrders===0));
 });
 test(seed+': civilian inventory reconciles every hull and yard usage stays bounded',()=>{
  for(const e of r.empires){const last=r.monthly.at(-1).find(x=>x.id===e.id);
   for(const k of ['bil','kol','ord','ins']){const lost=Object.values(e.losses).reduce((n,v)=>n+(v[k]||0),0);assert.equal((e.initial[k]||0)+(e.completed[k]||0)+(e.otherGains[k]||0)-lost,last.ships[k]||0,`${e.id}:${k}`);}
   assert.ok(e.busySlotDays<=e.slotDays);assert.ok(e.orders.bil<=31);
  }
 });
}
test('deterministic 120-month replay',()=>{const r=campaign(root,11);assert.equal(r.saveHash,after[11].saveHash);assert.equal(r.rng,after[11].rng);assert.deepEqual(r.empires,after[11].empires);});
test('observer preserves full save and RNG',()=>{const r=campaign(root,11,120,false);assert.equal(r.saveHash,after[11].saveHash);assert.equal(r.rng,after[11].rng);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
