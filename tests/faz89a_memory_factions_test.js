'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(actor=0,target=1){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var E=G.emps[${actor}],A=G.emps[${target}],B=G.emps[3],C=G.emps[4];
   for(const e of [E,A,B,C]){
     e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];e.opLog=[];e.hitLog=[];e.whisperLog=[];
     e.mem={};e.war={};e.ally={};e.res.etk=10000;e.res.ara=0;e.intel={};
     for(const o of [E,A,B,C])if(e!==o){e.contact[o.id]=true;e.intel[o.id]=3;e.rel[o.id]=0;}
   }
   E.techs={};A.techs={t_tarim:true};E.name='GERCEK_AKTOR_871';C.name='MASUM_871';
   G.council=null;var messages=[];say=function(msg){messages.push(msg);};
   function dice(values){globalThis.draws=0;globalThis.rnd=function(){draws++;return values.shift()??.999;};}
   function state(){return JSON.stringify([G.emps,G.sys,G.log,G.inbox,RND_STATE]);}
 `);return h;
}

for(const actor of [0,2])for(const success of [false,true])test(`anlık ifşa eski komplo/sabotajı korur actor=${actor} success=${success}`,()=>{
 const h=fresh(actor);h.run(`remember(A,C.id,'komplo');remember(A,C.id,'sabotaj');remember(B,C.id,'komplo');
 var before=JSON.stringify([A.mem[C.id],B.mem[C.id]]);dice([${success?0:.999},0]);var r=runWhisper(E,A,B,C);`);
 eq(h.run('r.ifsa'));eq(h.run('JSON.stringify([A.mem[C.id],B.mem[C.id]])'),h.run('before'));
});
test('aynı ayın iki iftirası birleşmez; yalnız çözülen temizlenir',()=>{
 const h=fresh();h.run(`remember(A,C.id,'komplo');dice([0,.999]);var r1=playerWhisper(A,B,C);
 dice([0,.999]);var r2=playerWhisper(A,B,C);G.memAge+=3;dice([0]);counterIntelTick();`);
 eq(h.run('r1.source!==r2.source'));eq(h.run('A.mem[C.id].length'),2);
 eq(h.run('A.mem[C.id].some(m=>m.source===r2.source)'));eq(h.run('A.mem[C.id].some(m=>!m.source)'));
});
test('gecikmeli ifşa başka failin komplo izini korur',()=>{
 const h=fresh();h.run(`dice([0,.999]);var r1=playerWhisper(A,B,C);
 var X=G.emps[2];X.dead=false;X.wild=false;X.civics=[];X.res.etk=10000;X.contact[A.id]=X.contact[B.id]=true;
 A.contact[X.id]=B.contact[X.id]=true;X.contact[C.id]=true;
 dice([0,.999]);var r2=runWhisper(X,A,B,C);G.memAge+=3;dice([0]);counterIntelTick();`);
 eq(h.run('r2.resolved'));eq(h.run('A.mem[C.id].length'),1);eq(h.run('A.mem[C.id][0].source'),h.run('r2.source'));
});
test('kaynak taşımayan eski v8 fısıltı ifşası anıları topluca silmez',()=>{
 const h=fresh();h.run(`remember(A,C.id,'komplo');var before=JSON.stringify(A.mem[C.id]);
 E.whisperLog=[{a:A.id,b:B.id,blame:C.id,ok:true,t:0}];G.memAge=3;dice([0]);counterIntelTick();`);
 eq(h.run('E.whisperLog[0].found'));eq(h.run('JSON.stringify(A.mem[C.id])'),h.run('before'));
});
for(const actor of [0,2])test('gerçek falseFlag → deepInvestigate yalnız ilgili sabotajı siler actor='+actor,()=>{
 const h=fresh(actor);h.run(`remember(A,C.id,'sabotaj');remember(A,C.id,'komplo');var before=JSON.stringify(A.mem[C.id]);
 dice([0,.999]);var r=falseFlagOp(E,A,C,'sabotaj');var source=A.hitLog[0].source;
 dice([0,0]);var d=deepInvestigate(A);`);
 eq(h.run('r.basarili'));eq(h.run('d.cozuldu'));eq(h.run('typeof source'),'string');
 eq(h.run('JSON.stringify(A.mem[C.id])'),h.run('before'));
});
test('eski kaynak taşımayan hitLog ifşası gerçek sabotajı korur',()=>{
 const h=fresh();h.run(`remember(A,C.id,'sabotaj');var before=JSON.stringify(A.mem[C.id]);
 A.hitLog=[{t:0,by:C.id,framed:E.id,known:true,k:'sabotaj'}];dice([0,0]);deepInvestigate(A);`);
 eq(h.run('JSON.stringify(A.mem[C.id])'),h.run('before'));
});
test('sahteKanit → hedefli sorusturma yalnız dosya anısını temizler',()=>{
 const h=fresh();h.run(`A.hitLog=[{t:0,k:'sabotaj',by:B.id,known:false}];remember(A,C.id,'komplo');
 var before=JSON.stringify(A.mem[C.id]);dice([.999,0]);var r=runOp(E,C,'sahteKanit');
 dice([.999,0]);var d=runOp(B,C,'sorusturma');`);
 eq(h.run('r.ok'));eq(h.run('d.ok'));eq(h.run('JSON.stringify(A.mem[C.id])'),h.run('before'));
});
test('yakalanan sahteKanit önceki farklı masum dosyalarını doğru taraftan temizler',()=>{
 const h=fresh();h.run(`remember(A,C.id,'komplo');remember(A,B.id,'komplo');
 var before=JSON.stringify(A.mem);A.hitLog=[{t:0,k:'sabotaj',by:2,known:false},{t:0,k:'sabotaj',by:2,known:false}];
 dice([.999,0]);var r=runOp(E,B,'sahteKanit');dice([0,0]);var d=runOp(E,C,'sahteKanit');`);
 eq(h.run('r.ok'));eq(h.run('d.ok'));eq(h.run('A.mem[B.id].length'),1);eq(h.run('A.mem[C.id].length'),1);
 eq(h.run('A.mem[B.id][0].source===undefined&&A.mem[C.id][0].source===undefined'));
});
test('v8 kaynak kimliklerini ve sıradaki kimliği korur; yükleme RNG/günü değiştirmez',()=>{
 const h=fresh();h.run(`dice([0,.999]);var r=playerWhisper(A,B,C);
 var source=r.source,seq=E.memoryEventSeq,age=G.memAge,day=G.day,rng=RND_STATE;var save=serialize();deserialize(save);`);
 eq(h.run('G.emps[0].whisperLog[0].source'),h.run('source'));
 eq(h.run('G.emps[1].mem[4][0].source'),h.run('source'));
 eq(h.run('G.emps[0].memoryEventSeq'),h.run('seq'));eq(h.run('RND_STATE'),h.run('rng'));
 eq(h.run('G.day'),h.run('day'));eq(h.run('G.memAge'),h.run('age'));
 eq(h.run('memoryEvent(G.emps[0])!==source'));
});
test('tür bazında normal anı birleştirmesi korunur',()=>{
 const h=fresh();h.run(`remember(A,C.id,'komplo');var v=A.mem[C.id][0].v;remember(A,C.id,'komplo');`);
 eq(h.run('A.mem[C.id].length'),1);eq(h.run('A.mem[C.id][0].v<v'));
});
test('reddedilen fısıltı olay kimliği üretmez',()=>{
 const h=fresh();h.run(`E.res.etk=0;var before=state();var r=runWhisper(E,A,B,C);`);
 eq(h.run('r.resolved'),false);eq(h.run('state()'),h.run('before'));
});
for(const [mood,amount,expected] of [[98,18,2],[3,-14,-3],[100,18,0],[0,-14,0],[50,18,18]])
test(`fraksiyon günlüğü gerçek değişimi bildirir ${mood}/${amount}`,()=>{
 const h=fresh();h.run(`E.ethics={};E.factions=[{k:'halk',mood:${mood},pow:100,log:[]}];facShift(E,'halk',${amount},'test');`);
 eq(h.run('E.factions[0].mood'),mood+expected);eq(h.run('E.factions[0].log[0].v'),expected);
 if(expected===0)eq(h.run('messages.length'),0);
});
test('Uzlaşı talep metni gerçekleşen ceza ile aynı',()=>{
 const h=fresh();h.run(`E.ethics={};for(const ax in ETHIC_PERKS){for(const sign of ['pos','neg'])
 if(ETHIC_PERKS[ax][sign].some(p=>p.k==='consensus'))E.ethics[ax]=sign==='pos'?3:-3;}
 E.factions=[{k:'halk',mood:50,pow:100,leader:'TEST',log:[],demand:{left:1,txt:'talep'}}];
 var html='';UI.openModal=function(s){html=s;};UI.facDemandOpen('halk');facShift(E,'halk',-14,'talep karşılanmadı');`);
 eq(h.run("hasPerk(E,'consensus')"));eq(h.run('Math.round(E.factions[0].mood)'),42);
 eq(h.run('E.factions[0].log[0].v'),-8);eq(h.run('html.includes("karşılamazsan -8 memnuniyet")'));
});
test('mutlu fraksiyon modları recalcMods içinde üretim etkisine bağlanır',()=>{
 const h=fresh();h.run(`E.factions=[{k:'bilim',mood:50,pow:100,log:[]}];recalcMods(E);var before=E.mods.araMul;
 E.factions[0].mood=100;recalcMods(E);var effect=facMods(E).araMul;`);
 eq(h.run('Math.abs(E.mods.araMul-before-effect)<1e-9'));eq(h.run('effect>0'));
});
test('13 civic flag kendi katalog girdisini tanır; counter hâlâ kaldırılmıştır',()=>{
 const h=fresh();eq(h.run(`Object.entries(CIVICS).every(([k,c])=>hasCivic({civics:[k]},c.flag))`));
 eq(h.run('Object.keys(CIVICS).length'),13);eq(h.run("Object.values(CIVICS).some(c=>c.flag==='counter')"),false);
 eq(h.run("hasCivic({civics:Object.keys(CIVICS)},'counter')"),false);
});
test('Panoptikon karşı istihbaratı kendi mevcut formülüyle artırır',()=>{
 const h=fresh();h.run(`A.civics=[];recalcMods(A);var before=counterIntel(A);A.civics=['panoptikon'];recalcMods(A);var after=counterIntel(A);`);
 eq(h.run('after>before'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
