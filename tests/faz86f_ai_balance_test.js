'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const SAVE=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);}
function fresh(){
 const h=runtime();h.loadSave(SAVE);
 h.run(`var A=G.p,B=G.emps[1],C=G.emps[3],D=G.emps[4];
 for(const e of G.emps){
  if(e.wild||e.crisisSide)continue;
  e.dead=false;e.civics=[];e.mizac='tuccar';e._pers='tuccar';e.persLock='tuccar';
  e.ethics={mil:0,aut:0,mat:0,ahl:0};e.envoy={};e.war={};e.pact={};e.nap={};e.ally={};
  e.spy={};e.intel={};e.intelP={};e.contact={};e.rel={};
  for(const o of G.emps){if(o===e||o.wild||o.crisisSide)continue;e.contact[o.id]=true;e.rel[o.id]=0;}
  for(const r of ['min','ene','yiy','tuk','ala','etk'])e.res[r]=10000;
  recalcMods(e);e.mods.dipMul=0;e.mods.sensor=0;
 }
 G.speed=0;
 function nextEnvoyMonth(){G.month++;if(G.month>12){G.month=1;G.year++;}envoyTick();}
 function state(){return JSON.stringify({G,RND_STATE});}
 var offer={from:A.id,to:B.id,give:[{t:'res',r:'min',v:500}],want:[{t:'res',r:'ene',v:100}]};
 `);
 return h;
}

const {scenario}=require('./diplomacy-balance-probe');
function trade(h){h.run(`var P=B,T=C;P.intel[T.id]=T.intel[P.id]=3;P.rel[T.id]=T.rel[P.id]=40;P.res.min=1;P.res.ene=P.res.ala=P.res.tuk=0;
 P.techs={};T.techs={};P.luxOwn={};T.luxOwn={};
 var techs=Object.keys(TECHS).map(id=>({id,value:itemValue(T,{t:'tech',id},P)})).filter(x=>x.value>0).sort((a,b)=>a.value-b.value||a.id.localeCompare(b.id));
 var offer={from:P.id,to:T.id,give:[{t:'res',r:'min',v:1}],want:[{t:'res',r:'ene',v:10}]};
 `);}
test('Teknoloji paylaşımı satıcıda sıfır olsa da taviz bütçesinde pozitif',()=>{
 const h=fresh();trade(h);h.run("var it={t:'tech',id:techs.at(-1).id};P.techs[it.id]=true;var q={from:P.id,to:T.id,give:[{t:'pact'}],want:[]};var b=aiCounterBudget(P,T,q,[it]);");
 eq(h.run('itemValue(P,it,T)'),0);eq(h.run('b.extraValue===itemValue(T,it,P)'));assert.ok(h.run('b.extraValue')>0);
});
test('Kaynak tavizi satıcının kendi ihtiyacından değerlenir',()=>{
 const h=fresh();trade(h);h.run("var q={from:P.id,to:T.id,give:[{t:'pact'}],want:[]};var it={t:'res',r:'min',v:30};");
 eq(h.run('aiCounterBudget(P,T,q,[it]).extraValue===itemValue(P,it,T)'));
});
test('Hediye kaynak antlaşma bütçesini şişirmez',()=>{
 const h=fresh();trade(h);h.run("var q={from:P.id,to:T.id,give:[{t:'pact'}],want:[]};var base=aiCounterBudget(P,T,q,[]);q.give.push({t:'res',r:'min',v:9000});");
 eq(h.run('aiCounterBudget(P,T,q,[]).cap===base.cap'));
});
test('Aynı simetrik antlaşma iki yönde bütçeyi ikiye katlamaz',()=>{
 const h=fresh();trade(h);h.run("var q={from:P.id,to:T.id,give:[{t:'pact'}],want:[]};var base=aiCounterBudget(P,T,q,[]);q.want.push({t:'pact'});");
 eq(h.run('aiCounterBudget(P,T,q,[]).cap===base.cap'));
});
test('Redundant NAP yeni taviz bütçesi üretmez',()=>{
 const h=fresh();trade(h);h.run("P.nap[T.id]=T.nap[P.id]=G.day+300;var q={from:P.id,to:T.id,give:[{t:'nap'}],want:[]};");eq(h.run('aiCounterBudget(P,T,q,[]).cap'),0);
});
test('Simetrik madde want yönünde de gerçek fayda verir',()=>{
 const h=fresh();trade(h);h.run("var q={from:P.id,to:T.id,give:[],want:[{t:'pact'}]};");near(h.run('aiCounterBudget(P,T,q,[]).cap'),h.run("itemValue(P,{t:'pact'},T)*.6"));
});
test('Olumsuz ittifak değeri pozitif taviz bütçesine dönüşmez',()=>{
 const h=fresh();trade(h);h.run("P.rel[T.id]=-90;var q={from:P.id,to:T.id,give:[{t:'ally'}],want:[]};");eq(h.run('aiCounterBudget(P,T,q,[]).cap'),0);
});
test('Saf takasta kendi fazlası yoksa ek taviz kabul bütçesi yok',()=>{
 const h=fresh();trade(h);h.run("offer.give=[{t:'res',r:'min',v:1000}];offer.want=[{t:'res',r:'ene',v:10}];");eq(h.run('aiCounterBudget(P,T,offer,[]).cap'),0);
});
test('Saf takasta kendi fazlası varsa sınırlı bütçe hesaplanır',()=>{
 const h=fresh();trade(h);h.run("offer.give=[{t:'res',r:'min',v:1}];offer.want=[{t:'res',r:'ene',v:1000}];");assert.ok(h.run('aiCounterBudget(P,T,offer,[]).cap')>0);
});
test('Bütçe saf ve deterministik; RNG, kaynak, hafıza veya teklif değişmez',()=>{
 const h=fresh();trade(h);h.run("var before=state(),text=JSON.stringify(offer);for(let i=0;i<50;i++)aiCounterBudget(P,T,offer,[{t:'res',r:'min',v:20}]);");eq(h.run('state()===before'));eq(h.run('JSON.stringify(offer)===text'));
});
test('Gerçek AI küçük açık için en pahalı teknoloji yerine yeterli en küçüğü ister',()=>{
 const h=fresh();trade(h);h.run(`P.techs=Object.fromEntries(techs.map(x=>[x.id,true]));
 var ev=evalOffer(T,offer),gap=-ev.net*1.06,scale=Math.max(.35,ev.gainMul||1);
 var eligible=techs.filter(x=>x.value*scale>=gap);var r=aiRespond(T,offer);`);
 assert.ok(h.run('eligible.length')>2);eq(h.run('r.v'),'karsi');eq(h.run('r.add.length'),1);
 near(h.run('itemValue(T,r.add[0],P)'),h.run('eligible[0].value'));
 assert.ok(h.run('itemValue(T,r.add[0],P)<techs.at(-1).value'));
 eq(h.run("dealQuote({...offer,give:offer.give.concat(r.add)}).ok"));
 assert.ok(h.run('evalOffer(T,{...offer,give:offer.give.concat(r.add)}).net')>0);
});
test('Teknoloji sıralaması katalog/nesne ekleme sırasından bağımsız',()=>{
 const h=fresh();trade(h);h.run("P.techs=Object.fromEntries(techs.map(x=>[x.id,true]));var first=JSON.stringify(aiRespond(T,offer).add);P.techs=Object.fromEntries(techs.slice().reverse().map(x=>[x.id,true]));");eq(h.run('JSON.stringify(aiRespond(T,offer).add)===first'));
});
test('Bilinen teknoloji karşı teklife tekrar eklenmez',()=>{
 const h=fresh();trade(h);h.run("P.techs=Object.fromEntries(techs.map(x=>[x.id,true]));T.techs={...P.techs};var r=aiRespond(T,offer);");eq(h.run('r.v'),'red');
});
test('Teknoloji yetmiyorsa sonsuz döngü olmadan ret verir',()=>{
 const h=fresh();trade(h);h.run("P.techs={[techs[0].id]:true};offer.want[0].v=9000;var r=aiRespond(T,offer);");eq(h.run('r.v'),'red');
});
test('Kaynak yeterliyse teknoloji paylaşımı istenmez',()=>{
 const h=fresh();trade(h);h.run("P.res.ala=1000;P.techs=Object.fromEntries(techs.map(x=>[x.id,true]));var r=aiRespond(T,offer);");eq(h.run('r.v'),'karsi');eq(h.run("r.add.every(x=>x.t==='res')"));
});
test('Üst bütçeyi aşan teknoloji gerçek aiNegotiate kapısında reddedilir',()=>{
 const h=fresh();trade(h);h.run(`var it={t:'tech',id:techs.at(-1).id};P.techs[it.id]=true;
 var original=aiRespond;aiRespond=()=>({v:'karsi',add:[it],why:'kontrollü alıcı talebi'});
 var before=state();var r=aiNegotiate(P,T,[{t:'pact'}],[]);aiRespond=original;`);
 eq(h.run('r.karar'),'karsi-red');eq(h.run('r.uygulandi'),false);eq(h.run('state()===before'));
});
test('Bütçe içindeki teknoloji gerçek transaction ile paylaşılır',()=>{
 const h=fresh();trade(h);h.run(`var it={t:'tech',id:techs[0].id};P.techs[it.id]=true;P.rel[T.id]=-10;
 var original=aiRespond;aiRespond=()=>({v:'karsi',add:[it],why:'kontrollü alıcı talebi'});
 var r=aiNegotiate(P,T,[{t:'nap'}],[]);aiRespond=original;`);
 eq(h.run('r.karar'),'karsi-kabul');eq(h.run('r.uygulandi'));eq(h.run('!!T.techs[it.id]'));eq(h.run('!!P.techs[it.id]'));eq(h.run('P.nap[T.id]>G.day'));
});
test('Kabul yolu bozulmaz, oyuncu aiNegotiate tarafından otomatik kabul edilmez',()=>{
 const h=fresh();trade(h);h.run("var before=state();var r=aiNegotiate(A,T,[{t:'nap'}],[]);");eq(h.run('r.uygulandi'),false);eq(h.run('state()===before'));
 h.run("var r=aiNegotiate(P,T,[{t:'nap'}],[]);");eq(h.run('r.uygulandi'));eq(h.run('r.tur'),1);
});
test('Reddedilen orijinal teklif için ikinci tur veya Etki kesintisi yok',()=>{
 const h=fresh();trade(h);h.run("P.techs={};aiProfile(T);var before=state();var r=aiNegotiate(P,T,offer.give,offer.want);");eq(h.run('r.karar'),'red');eq(h.run('r.tur'),1);eq(h.run('state()===before'));
});
// Long-run invariants, not a desired acceptance ratio. Each run uses actual monthly code.
for(const seed of [11,99,404])test('Temaslı 360 ay: '+seed+'; gerçek saat, bütçe ve durum bütünlüğü',()=>{
 const r=scenario({seed});eq(r.final.memAge-r.initial.memAge,360);eq(r.final.day-r.initial.day,10800);
 eq(r.final.calendar[0]-r.initial.calendar[0],30);eq(r.fixture.rngUnchanged);eq(r.fixture.after,21);
 eq(r.metrics.invalidStates.length,0);eq(r.metrics.execFail,0);eq(r.metrics.situationTicks,0);assert.ok(r.metrics.calls>0);
 assert.ok(r.metrics.maxTurns<=2);eq(r.metrics.exec,Object.values(r.byTreaty).reduce((s,x)=>s+x.exec,0));
 eq(r.metrics.calls,Object.values(r.totals).reduce((s,x)=>s+x,0));assert.ok(r.byTreaty.nap.exec>0);
 near(Object.values(r.attribution).reduce((s,x)=>s+x,0),r.final.total-r.initial.total);
 assert.ok(r.final.treaties.war<r.final.pairs);assert.ok(r.final.treaties.ally<r.final.pairs);
});
test('Ölçüm sarmalayıcıları RNG ve oyun sonucunu değiştirmez',()=>{
 const a=scenario({seed:11,months:120}),b=scenario({seed:11,months:120,instrument:false});eq(a.rng,b.rng);eq(a.behaviorSha,b.behaviorSha);
});
test('Aynı seed ve aynı aylık fixture aynı pazarlık dizisini üretir',()=>{
 const a=scenario({seed:99,months:90}),b=scenario({seed:99,months:90});eq(a.behaviorSha,b.behaviorSha);eq(JSON.stringify(a.records),JSON.stringify(b.records));
});
test('Temas fixture olmadan AI-AI müzakeresi olmadığını açıkça ölçer',()=>{
 const r=scenario({seed:11,months:120,contact:false});eq(r.fixture.before,0);eq(r.fixture.after,0);eq(r.metrics.calls,0);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
