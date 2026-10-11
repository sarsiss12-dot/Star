'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const {fresh:combat}=require('./helpers/combat-feedback-fixture');
const {campaign}=require('./helpers/daily-campaign');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function economy(){const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var E=G.p;E.race='insan';E.physio='humanoid';E.civics=[];E.ethics={};
 for(const c of E.colonies){var pl=G.sys[c.s].planets[c.p];pl.col.pop=200;}
 newFleet(E,E.home,Array.from({length:80},()=>({c:'muh'})));
 E.res.ene=0;E.res.yiy=0;economyTick(true);`);return h;}
test('enerji ve yiyecek açığı aynı ayda iki stoğu da sıfırlar',()=>{const h=economy();
 eq(h.run('E.inc.ene<0&&E.inc.yiy<0'));h.run('economyTick(false)');eq(h.run('E.res.ene'),0);eq(h.run('E.res.yiy'),0);eq(h.run('E.crisis'),'enerji');});
test('art arda çift kıtlık yiyecek borcu biriktirmez',()=>{const h=economy();h.run('for(var i=0;i<3;i++){G.day+=30;economyTick(false);}');eq(h.run('E.res.yiy'),0);});
test('yalnız yiyecek açığı kendi krizini korur',()=>{const h=economy();h.run('E.res.ene=100000;economyTick(false)');eq(h.run('E.res.yiy'),0);eq(h.run('E.crisis'),'yiyecek');});
test('yükleme/saf ekonomi stokları onarma bahanesiyle değiştirmez',()=>{const h=economy();h.run('E.res.yiy=-3;var before=E.res.yiy,rng=RND_STATE;economyTick(true)');eq(h.run('E.res.yiy'),-3);eq(h.run('RND_STATE'),h.run('rng'));});
test('kayıplı gerçek tur raporunda payda tur başındaki gemilerdir',()=>{const h=combat(ROOT,['muh'],['kor','kor']);
 h.run('S.cr=1;SHIPS.muh.dmg=100000;combatTick(.5)');eq(h.run('S.battleReport.last.ships[1]'),2);eq(h.run('S.battleReport.last.ready[1]<=S.battleReport.last.ships[1]'));});
test('rapor paneli turun başlangıcını açıkça belirtir',()=>{const h=combat(ROOT);h.run('combatTick(.5);View.selSys=S');eq(h.run('UI.p_sistem().includes("Tur başında ateş açabilen / toplam gemi")'));});
test('eski tutarsız rapor yüklenirken yalnız son tur ayrıntısı düşer',()=>{const h=combat(ROOT);h.run(`combatTick(.5);S.battleReport.last.ready=[3,3];S.battleReport.last.ships=[1,1];
 var before=S.battleReport.rounds,save=serialize();deserialize(save);`);eq(h.run('G.sys[0].battleReport.last'),null);eq(h.run('G.sys[0].battleReport.rounds'),h.run('before'));});
test('yeni rapor v8 kaydet yüklede aynı kalır',()=>{const h=combat(ROOT);h.run('combatTick(.5);var before=JSON.stringify(S.battleReport);deserialize(serialize())');eq(h.run('JSON.stringify(G.sys[0].battleReport)'),h.run('before'));});
for(const seed of [11,99,404])test('gerçek günlük kampanya seed '+seed,()=>{
 const r=campaign(ROOT,seed,120);console.log('CAMPAIGN '+JSON.stringify(r));
 assert.equal(r.error,undefined);assert.deepEqual(r.first,{});eq(r.initialContacts,0);assert.ok(r.contacts>0&&r.surveys>0&&r.arrivals>0);
 assert.ok(r.battles>0&&r.negotiations>0&&r.ops>0);eq(r.calendarMonths,r.months);eq(r.elapsedDays,r.steps*.5);eq(r.situations,0);
 assert.ok(r.months===120||r.stopped&&r.stopped.win===false&&r.months>0);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
