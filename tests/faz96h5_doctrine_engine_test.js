'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.env.STARS_GAME_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
const docs=['militarist','tuccar','pasifist','yayilmaci','izolasyonist','teknokrasi','kriminal','teokrasi'];
function fresh(doc='yayilmaci',role='player'){
 const h=runtime({root});h.sb.doc5=doc;h.run("setupGame({...CFG,name:'Doctrine test',seed:11,size:'kucuk',aiCount:3,mizac:doc5,race:DOCTRINE_RACE[doc5],traits:[],ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',physio:'humanoid',aiOrigins:false,council:'kapali',crisis:'kapali'});G.autoSave=false;var a=G.p;delete doc5");
 if(role==='ai')h.run("a=G.emps[1];a.race=G.p.race;a.mizac=G.p.mizac;a.traits=[];a.civics=[];a.ethics={mil:0,aut:0,mat:0,ahl:0};a.origin='standart';a.physio='humanoid';a._pers=null;a._persAt=-1;a._prof=null;personaOf(a);recalcMods(a)");
 return h;
}
for(const doc of docs){
 test(doc+' valid actual setup preserves doctrine and government',()=>{const h=fresh(doc);h.sb.doc5=doc;assert(h.run('G.p.mizac===doc5&&G.p.race===DOCTRINE_RACE[doc5]&&personaOf(G.p)===PERSONAS[doc5]&&researchDoctrine(G.p)===doc5'));});
 test(doc+' real Save8 preserves identity, stock, research gates and RNG',()=>{const h=fresh(doc);h.run('var stock5=JSON.stringify(a.res),rng5=RND_STATE,doc5=a.mizac,government5=a.race,raw5=serialize(),tech5=JSON.stringify(Object.keys(TECHS).map(k=>[k,researchAccess(a,k).ok]));var loaded5=deserialize(raw5);a=G.p');assert(h.run('loaded5&&JSON.parse(raw5).v===8&&a.mizac===doc5&&a.race===government5&&researchDoctrine(a)===doc5&&JSON.stringify(a.res)===stock5&&RND_STATE===rng5&&JSON.stringify(Object.keys(TECHS).map(k=>[k,researchAccess(a,k).ok]))===tech5'));});
 for(const role of ['player','ai'])test(doc+' '+role+' engine market follows existing doctrine rule',()=>{const h=fresh(doc,role);h.run('G.council={dead:false,members:[0,1],laws:{borsaKur:true}};var before5=JSON.stringify(a.res),rng5=RND_STATE,marketBefore5=JSON.stringify(G.market),r5=marketTrade(a,"min","ala",100)');if(doc==='izolasyonist'){assert(h.run('!r5.ok'),'Purifier must be rejected by the actual engine');assert(h.run('JSON.stringify(a.res)===before5&&RND_STATE===rng5&&JSON.stringify(G.market)===marketBefore5'));}else{assert(h.run('r5.ok&&a.res.min===JSON.parse(before5).min-100&&a.res.ala===JSON.parse(before5).ala+r5.alinan&&RND_STATE===rng5'));}});
}
for(const sat of ['ene','min','ala'])for(const al of ['ene','min','ala'].filter(x=>x!==sat))test('purifier rejection is atomic for '+sat+' to '+al,()=>{const h=fresh('izolasyonist');h.sb.sat5=sat;h.sb.al5=al;h.run('G.council={dead:false,members:[0,1],laws:{borsaKur:true}};var before5=serialize(),rng5=RND_STATE,r5=marketTrade(a,sat5,al5,50)');assert(h.run('!r5.ok&&serialize()===before5&&RND_STATE===rng5'));});
test('closed market remains unavailable to ordinary doctrine',()=>{const h=fresh('tuccar');h.run('var before5=serialize(),rng5=RND_STATE,r5=marketTrade(a,"min","ala",50)');assert(h.run('!r5.ok&&serialize()===before5&&RND_STATE===rng5'));});
test('stale UI trade action cannot debit a purifier',()=>{const h=fresh('izolasyonist');h.run('G.council={dead:false,members:[0,1],laws:{borsaKur:true}};var before5=JSON.stringify(a.res),rng5=RND_STATE,marketBefore5=JSON.stringify(G.market);UI.act("mktTrade","min:ala:50")');assert(h.run('JSON.stringify(a.res)===before5&&RND_STATE===rng5&&JSON.stringify(G.market)===marketBefore5'));});
test('pacifist blood-law civic retains existing peace restriction',()=>{const h=fresh('pasifist');h.run("a.civics=['kan_hukuku'];recalcMods(a)");assert.equal(h.run('canPeace(a,G.emps[1])'),false);});
test('explicit doctrine survives paid ethics reform without arbitrary combination ban',()=>{const h=fresh('pasifist');h.run("a.res.etk=500;var reform5=doReform(a,'mil',1);memTick()");assert(h.run("reform5.ok&&a.res.etk===100&&a.ethics.mil===1&&personaOf(a)===PERSONAS.pasifist&&researchDoctrine(a)==='pasifist'"));});
test('unseen counterpart resources do not enter AI known-resource snapshot',()=>{const h=fresh();h.run('var ai5=G.emps[1],other5=G.emps[2];ai5.contact={};ai5.intel={};ai5.aiIntel={systems:{},fleets:{},resources:{},techs:{}};var knownBefore5=JSON.stringify(aiKnownResources(ai5,other5));other5.res.min=987654;other5.res.ala=123456;var knownAfter5=JSON.stringify(aiKnownResources(ai5,other5))');assert(h.run('knownBefore5===knownAfter5'));});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
