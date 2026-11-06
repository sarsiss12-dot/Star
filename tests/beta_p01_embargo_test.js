'use strict';
const assert=require('assert/strict'),{fresh}=require('./helpers/dispatch-fixture');let pass=0,fail=0;
function test(n,f){try{f();pass++;console.log('PASS '+n)}catch(e){fail++;console.log('FAIL '+n+' '+e.stack)}}
function world(){const h=fresh(0,process.env.STARS_CONTROL_ROOT||undefined);h.run(`G.feds=[];G.council=null;for(const e of G.emps){e.embargo={};e.ally={};e.ai=e.id>1;for(const o of G.emps)if(o!==e)e.contact[o.id]=true;}trustOf=()=>-100;var rs=RND_STATE;`);return h;}
test('host ve uzak insan adına düşük güvende kişisel ambargo uygulanmaz',()=>{const h=world();h.run('embargoTick()');assert.equal(h.run('Object.keys(G.emps[0].embargo).length'),0);assert.equal(h.run('Object.keys(G.emps[1].embargo).length'),0);assert.equal(h.run('RND_STATE'),h.run('rs'));});
test('AI otomatik ambargo davranışı korunur',()=>{const h=world();h.run('embargoTick()');assert.equal(h.run('G.emps[2].embargo[0]'),true);});
test('insanın bilinçli ambargosu yüksek güvende kendiliğinden kaldırılmaz',()=>{const h=world();h.run('setEmbargo(G.emps[1],G.emps[2],true,"oyuncu kararı");trustOf=()=>100;embargoTick()');assert.equal(h.run('G.emps[1].embargo[2]'),true);});
test('Konsey yaptırımı kişisel ambargo tablosundan bağımsız kalır',()=>{const h=world();h.run('G.council={pariahs:{2:{since:0}},targeted:{}};embargoTick()');assert.equal(h.run('embargoOn(G.emps[0],2)'),true);assert.equal(h.run('!!G.emps[0].embargo[2]'),false);});
test('kriz insanın manuel ambargosunu kaldırmaz; AI gevşemesi korunur',()=>{const h=world();h.run('setEmbargo(G.emps[1],G.emps[2],true,"oyuncu kararı");setEmbargo(G.emps[2],G.emps[0],true,"AI kararı");crisisActive=()=>true;crisisPressure=()=>1;rnd=()=>0;crisisDiplomacyTick()');assert.equal(h.run('G.emps[1].embargo[2]'),true);assert.equal(h.run('!!G.emps[2].embargo[0]'),false);});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
