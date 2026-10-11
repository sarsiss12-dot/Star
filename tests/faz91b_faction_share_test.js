'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.message);}}
function fresh(weights=[60,25,15]){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.sb.weights=weights;
 h.run(`var E=G.emps[1];for(const e of G.emps)e.dead=e!==E;
 E.dead=false;E.wild=false;E.civics=[];E.perks=[];E.ethics={mil:0,aut:0,mat:0,ahl:0};
 E.factions=weights.map((pow,i)=>({k:['asker','bilim','tuccar'][i],pow,mood:50,log:[],demand:null}));
 var factions=E.factions,refs=E.factions.slice(),rng=RND_STATE;
 function total(){return E.factions.reduce((sum,f)=>sum+f.pow,0);}`);return h;
}
for(const weights of [[60,25,15],[78,12,10],[80,10,10]])test('darbe sonrası toplam %100 '+weights,()=>{
 const h=fresh(weights);h.run('facCoup(E,E.factions[0])');assert.equal(h.run('total()'),100);
 assert.equal(h.run('E.factions===factions&&E.factions.every((f,i)=>f===refs[i])'),true);
 assert.equal(h.run('RND_STATE'),h.run('rng'));assert.equal(h.run('E.ethics.mil'),2);
 assert.equal(h.run('E.factions[0].mood'),55);
});
for(const weights of [[33,33,33],[34,34,34],[33.3,33.3,33.4]])test('aylık pay yuvarlaması toplamı korur '+weights,()=>{
 const h=fresh(weights);h.run('facTick()');assert.equal(h.run('total()'),100);
 assert.equal(h.run('E.factions.every(f=>Number.isInteger(f.pow)&&f.pow>=0&&f.pow<=100)'),true);
});
test('art arda darbelerde toplam ve nesne kimlikleri korunur',()=>{
 const h=fresh();h.run('for(var i=0;i<12;i++)facCoup(E,E.factions[i%3])');
 assert.equal(h.run('total()'),100);assert.equal(h.run('E.factions.every((f,i)=>f===refs[i])'),true);
});
test('darbe sonrası düzeltilmiş paylar v8 yüklemede aynı kalır',()=>{
 const h=fresh();h.run('facCoup(E,E.factions[0]);var before=JSON.stringify(E.factions);var saved=serialize();var loaded=deserialize(saved)');
 assert.equal(h.run('loaded'),true);assert.equal(h.run('JSON.parse(saved).v'),8);
 assert.equal(h.run('JSON.stringify(G.emps[1].factions)'),h.run('before'));
 assert.equal(h.run('G.emps[1].factions.reduce((sum,f)=>sum+f.pow,0)'),100);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
