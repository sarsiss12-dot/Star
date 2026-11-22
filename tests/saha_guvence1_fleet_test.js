'use strict';
/* SAHA-GÜVENCE.1 Faz B2 — fetihten ÖNCE yörünge muharebesinde filo kaybı yolları (Issue #66'nın ikinci olası yolu).
   Gerçek dailyTick muharebesi (tests/fixtures/96h9/seed11-month66-siege.save, sistem 13 = devlet 1).
   Bulgu: silahlı gemisi kalmayan tarafın silahsız gemileri (Taarruz Ordusu …) muharebe sonunda HASAR ALMADAN imha edilir (combat.js
   "silahsız kalanlar imha" — tasarım kuralı, değiştirilmedi). Eksik olan: (1) oyuncuya nedeninin söylenmemesi, (2) uzak insan (misafir)
   tarafına muharebe sonucunun hiç bildirilmemesi (motor ZAFER/YENİLGİ satırını yalnız devlet 0'a yazıyordu). STARS_ROOT=<kök> eski sürüm. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
const SAVE=fs.readFileSync(path.join(__dirname,'fixtures/96h9/seed11-month66-siege.save'),'utf8');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function load(){const h=runtime({root:ROOT});h.sb.raw=SAVE;assert.equal(h.run('deserialize(raw)'),true);
  h.run(`G.autoSave=false;var A=G.emps[0],D=G.emps[1],S=G.sys[13];A.war[1]=D.war[0]=true;if(A.ally)A.ally[1]=false;if(D.ally)D.ally[0]=false;G.fleets=G.fleets.filter(f=>f.sys!==S.id);
    var mk=(e,n,c)=>[...Array(n)].map(()=>({c}));var said=[];var __s=say;say=function(t,c){said.push(String(t).replace(/<[^>]+>/g,''));return __s.apply(this,arguments);};`);return h;}
const step=(h,n)=>h.run(`for(let d=0;d<${n};d++){G.day+=.5;dailyTick(.5);}`);

test('B2.1 eskortsuz ordu: 3 korvet + 12 Taarruz Ordusu, güçlü düşman filosu → korvetler muharebede, 12 ordu gemisi aynı adımda kural ile; kayıt "combat"',()=>{
  const h=load();h.run(`var f=newFleet(A,S.id,mk(0,3,'kor').concat(mk(0,12,'ord')),'Karma');newFleet(D,S.id,mk(1,10,'zir'),'Dus');`);step(h,1);
  const r=J(h,`{alive:G.fleets.includes(f),j:(G.fleetJournal||[]).filter(r=>r.fleet===f.id).map(r=>({reason:r.reason,ships:r.ships,classes:r.classes}))}`);
  assert.equal(r.alive,false,'filo yok oldu (kural — değiştirilmedi)');assert.equal(r.j.length,1);assert.equal(r.j[0].reason,'combat');assert.equal(r.j[0].classes.ord,12,'12 ordu gemisi hasarsız imha (eskortsuz kural)');});

test('B2.2 oyuncuya neden söylenir: muharebe raporunda "12 silahsız gemi (Taarruz Ordusu ×12) eskortu kalmayınca hasar almadan imha edildi"; okuma dünyayı / RNG\'yi değiştirmez',()=>{
  const h=load();h.run(`var f=newFleet(A,S.id,mk(0,3,'kor').concat(mk(0,12,'ord')),'Karma');newFleet(D,S.id,mk(1,10,'zir'),'Dus');`);step(h,1);
  const before=crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),rng=h.run('JSON.stringify(G.rs||null)');
  const r=J(h,`(()=>{const x=battleUnarmedLost(S,0);View.selSys=S;const html=UI.sysPanel?UI.sysPanel(S):'';return {x,t:battleUnarmedText(x)};})()`);
  assert.equal(r.x.n,12);assert.deepEqual(r.x.classes,{ord:12});assert.match(r.t,/12 silahsız gemi \(Taarruz Ordusu ×12\) eskortu kalmayınca hasar almadan imha edildi/);
  assert.equal(crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),before,'Save8 aynı');assert.equal(h.run('JSON.stringify(G.rs||null)'),rng,'RNG aynı');
  const src=fs.readFileSync(path.join(ROOT,'ui.js'),'utf8');assert.ok(/battleUnarmedLost\(s,0\)/.test(src),'sistem panelindeki muharebe raporu satırı');});

test('B2.3 kazanılan muharebe: 8 zırhlı + 12 ordu (karma 15K) zayıf düşmana karşı — sağ kalan hiçbir gemi kural ile silinmez, ordu sayısı aynı',()=>{
  const h=load();h.run(`var f=newFleet(A,S.id,mk(0,8,'zir').concat(mk(0,12,'ord')),'Karma');var e=newFleet(D,S.id,mk(1,3,'kor'),'Dus');`);step(h,30);
  const r=J(h,`{alive:G.fleets.includes(f),ord:f.ships.filter(s=>s.c==='ord').length,zir:f.ships.filter(s=>s.c==='zir').length,enemy:G.fleets.includes(e),j:(G.fleetJournal||[]).filter(r=>r.fleet===f.id).length}`);
  assert.equal(r.enemy,false,'düşman yenildi');assert.equal(r.alive,true);assert.equal(r.ord,12,'ordu gemileri yerinde');assert.ok(r.zir>=1);assert.equal(r.j,0,'kayıp kaydı yok');});

test('B2.4 ordu ayrı filoda, savaş filosu ayrı filoda (aynı sistem): taraf silahlı sayılır, ordu filosu silinmez',()=>{
  const h=load();h.run(`var o=newFleet(A,S.id,mk(0,12,'ord'),'Ordu');var w=newFleet(A,S.id,mk(0,8,'zir'),'Savas');newFleet(D,S.id,mk(1,3,'kor'),'Dus');`);step(h,30);
  const r=J(h,`{o:G.fleets.includes(o)&&o.ships.length,w:G.fleets.includes(w)}`);assert.equal(r.o,12);assert.equal(r.w,true);});

test('B2.5 iki büyük savaş filosu: kayıplar yalnız muharebe hasarından, kaybeden filo "combat" kaydıyla; kazananın sağ gemisi silinmez',()=>{
  const h=load();h.run(`var a=newFleet(A,S.id,mk(0,14,'zir'),'A');var d=newFleet(D,S.id,mk(1,10,'zir'),'D');`);step(h,40);
  const r=J(h,`{a:G.fleets.includes(a)?a.ships.length:0,d:G.fleets.includes(d)?d.ships.length:0,ja:(G.fleetJournal||[]).filter(r=>r.fleet===a.id).map(r=>r.reason)}`);
  assert.ok(r.a>0||r.d>0,'bir taraf kaldı');if(r.a>0)assert.deepEqual(r.ja,[],'kazanan filoya kayıp kaydı yok');});

test('B2.6 MP: uzak insan (misafir B, devlet 1) muharebeyi kaybeder → B\'nin bildirim listesine YENİLGİ + eskortsuz imha açıklaması; host günlüğüne değil',()=>{
  /* helpers/beta-fed-found0-mp-world.cjs ile aynı dünya, ama STARS_ROOT kökünün mp-core / mirror dosyalarıyla */
  const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'sg1',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:23});
    for(const [c,e]of [['B',1],['C',3]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}if(!MP.start().ok)throw Error('start');`);
  h.run(`var B=G.emps[1],X=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&o.id!==1),S=G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col));B.ally[X.id]=X.ally[B.id]=false;B.war[X.id]=X.war[B.id]=true;
    G.fleets=G.fleets.filter(f=>f.sys!==S.id);var bf=newFleet(B,S.id,[...Array(2)].map(()=>({c:'kor'})).concat([...Array(9)].map(()=>({c:'ord'}))),'B ordu');newFleet(X,S.id,[...Array(10)].map(()=>({c:'zir'})),'X');
    var log0=G.log.length;for(let d=0;d<4;d++){G.day+=.5;dailyTick(.5);}`);
  const r=J(h,`{alive:G.fleets.includes(bf),notes:MP.viewFor(B).log.map(x=>x.m),host:G.log.slice(log0).map(x=>x.m).filter(m=>/muharebe/.test(m)),wiped:(G.fleetJournal||[]).filter(r=>r.owner===1&&r.sys===S.id&&r.reason==='combat').reduce((n,r)=>n+(r.classes.ord||0),0)}`);
  assert.equal(r.alive,false);const nt=r.notes.find(m=>/YENİLGİ — .* muharebesi/.test(m));assert.ok(nt,'misafire muharebe sonucu: '+JSON.stringify(r.notes));
  assert.ok(r.wiped>0,'eskortsuz imha oldu');assert.ok(nt.includes(r.wiped+' silahsız gemi (Taarruz Ordusu ×'+r.wiped+') eskortu kalmayınca'),nt);assert.deepEqual(r.host,[],'host günlüğüne başkasının muharebesi yazılmadı');});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
