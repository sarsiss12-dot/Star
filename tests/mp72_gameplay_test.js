'use strict';
/* MP.7.2 — eksik oynanış işlevleri host'un GERÇEK motorunda (Node vm). Her komut tek oyunculu düğmenin motor işlevini oyuncunun
   kendi devletiyle yürütür: elçi (setEnvoyTask / recallEnvoy), filo bileşimi (setFleetTemplate), inşaat gemisiyle yapı (startStruct),
   koloni otomasyonu (dirTog), bombardıman kipi, ortak askerî destek (jointRequest / jointCancel; motorun devlet-0 koşulu uzak insan için
   genişletildi), federasyon savaş izni (proposeFedWar), ültimatom / himaye (yalnız AI hedef — insan adına zar yok).
   Dünya 1: seed 22, orta, 5 AI, misafir A=1, B=3 (mp3/mp71 testleriyle aynı). Dünya 2: tests/helpers/joint-fixture (oyuncu + iki AI
   müttefik aynı federasyon seferinde, ortak düşman 4) — ortak destek motorunun kendi senaryosu. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),{jointWorld}=require('./helpers/joint-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r72',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},hostNotify(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};step(180);
    for(const a of [0,${A},${B}])for(const b of [0,${A},${B}])if(a!==b)G.emps[a].contact[b]=true;
    for(const e of [0,${A},${B}])for(const r of ['min','ene','etk','ala'])G.emps[e].res[r]=Math.max(G.emps[e].res[r],3000);MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m72'+conn+String(s).padStart(5,'0'),cmd:c}))})`);
  const r=h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');return r;}
const code=r=>r.status==='ok'?'ok':r.code;
function lastView(h,who){const conn=CONN[who];let v=null,base=null;for(const [c,t] of h.sb.__out){if(c!==conn)continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){v=JSON.parse(JSON.stringify(m.view));base=m.rev;}else if(m.type==='delta'&&v&&m.base===base){const o=m.ops||{};
    for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}return v;}

test('elçi: A gerçek elçi penceresinin motor işlevleriyle (setEnvoyTask / recallEnvoy) gönderir, görev değiştirir, geri çağırır; dünya motor çağrısıyla bayt-bayt aynı; Save8 içinde',()=>{
  const h=world(),twin=world();const ai=J(h,`G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&G.emps[${A}].contact[e.id]&&envoyGate(G.emps[${A}],e.id).ok).id`);
  assert.equal(code(cmd(h,A,{kind:'envoy',target:ai,task:'yakinlasma'})),'ok');twin.run(`if(!setEnvoyTask(G.emps[${A}],${ai},'yakinlasma').ok)throw Error('twin')`);
  assert.equal(J(h,`G.emps[${A}].envoy[${ai}].task`),'yakinlasma');assert.equal(h.run('serialize()'),twin.run('serialize()'),'same world as the engine call');
  const task2=J(h,`Object.keys(ENVOY_TASKS).find(k=>k!=='yakinlasma')`);assert.equal(code(cmd(h,A,{kind:'envoy',target:ai,task:task2})),'ok');assert.equal(J(h,`G.emps[${A}].envoy[${ai}].task`),task2);
  assert.equal(J(h,`JSON.parse(serialize()).emps[${A}].envoy[${ai}].task`),task2,'envoy is in Save8');
  assert.equal(code(cmd(h,A,{kind:'envoy',target:ai,task:null})),'ok');assert.equal(J(h,`!!(G.emps[${A}].envoy||{})[${ai}]`),false);
  assert.equal(code(cmd(h,A,{kind:'envoy',target:ai,task:null})),'rules:envoy','recall of a missing envoy refused');
});
test('elçi yetkisi: temas yoksa "yok", bilinmeyen görev bad-params, kapasite dolunca motorun gerekçesi, başka devlet adına alan yok',()=>{
  const h=world();const noC=J(h,`G.emps.find(e=>e.id!==${A}&&!e.dead&&!G.emps[${A}].contact[e.id])?.id??null`);
  if(noC!==null)assert.equal(code(cmd(h,A,{kind:'envoy',target:noC,task:'yakinlasma'})),'no-target');
  assert.equal(code(cmd(h,A,{kind:'envoy',target:0,task:'casus'})),'bad-params');
  assert.equal(code(cmd(h,A,{kind:'envoy',target:0,task:'yakinlasma',empire:0})),'bad-params','no actor field');
  const cap=J(h,`envoyCap(G.emps[${A}])`),ok=J(h,`G.emps.filter(e=>e.id!==${A}&&!e.dead&&!e.wild&&envoyGate(G.emps[${A}],e.id).ok).map(e=>e.id)`);
  for(const id of ok.slice(0,cap))assert.equal(code(cmd(h,A,{kind:'envoy',target:id,task:'yakinlasma'})),'ok');
  if(ok.length>cap){const r=cmd(h,A,{kind:'envoy',target:ok[cap],task:'yakinlasma'});assert.equal(r.code,'rules:engine');assert.match(r.detail[0],/Boşta elçin yok/);}
  assert.deepEqual(J(h,`Object.keys(G.emps[${B}].envoy||{})`),[],'B untouched');
});
test('filo bileşimi: kendi filosunda setFleetTemplate (kaydet / otomatik); başkasının filosu not-owner; geçersiz sayı bad-params',()=>{
  const h=world();const f=J(h,`G.fleets.find(f=>f.e===${A}&&f.ships.length&&fleetDeliveryTarget(G.emps[${A}],f)!==null&&!hasShipment(f)&&!f.federal&&!f.guardLocked).id`);
  const cls=J(h,'fleetTemplateClasses()[0]');
  assert.equal(code(cmd(h,A,{kind:'composition',fleet:f,counts:{[cls]:3},auto:true})),'ok');
  assert.deepEqual(J(h,`[G.fleets.find(x=>x.id===${f}).composition.counts,G.fleets.find(x=>x.id===${f}).composition.auto]`),[{[cls]:3},true]);
  const other=J(h,`G.fleets.find(x=>x.e===${B}&&x.ships.length).id`);assert.equal(code(cmd(h,A,{kind:'composition',fleet:other,counts:{[cls]:1},auto:false})),'not-owner');
  assert.equal(code(cmd(h,A,{kind:'composition',fleet:f,counts:{[cls]:-1},auto:false})),'bad-params');assert.equal(code(cmd(h,A,{kind:'composition',fleet:f,counts:{zzz:1},auto:false})),'bad-params');
});
test('koloni otomasyonu (dirTog) ve bombardıman kipi: yalnız kendi kolonisi / filosu; başkasınınki not-owner; geçersiz kip bad-params',()=>{
  const h=world();const [s,p]=J(h,`(()=>{const c=G.emps[${A}].colonies[0];return [c.s,G.sys[c.s].planets.findIndex(q=>q.i===c.p)];})()`);
  const a0=J(h,`!!G.sys[${s}].planets[${p}].col.auto`);assert.equal(code(cmd(h,A,{kind:'colAuto',sys:s,planet:p})),'ok');assert.equal(J(h,`!!G.sys[${s}].planets[${p}].col.auto`),!a0);
  assert.equal(code(cmd(h,B,{kind:'colAuto',sys:s,planet:p})),'not-owner');
  const f=J(h,`G.fleets.find(f=>f.e===${A}&&f.ships.length).id`);assert.equal(code(cmd(h,A,{kind:'bombMode',fleet:f,mode:'yikici'})),'ok');assert.equal(J(h,`G.fleets.find(x=>x.id===${f}).bombMode`),'yikici');
  assert.equal(code(cmd(h,B,{kind:'bombMode',fleet:f,mode:'hassas'})),'not-owner');assert.equal(code(cmd(h,A,{kind:'bombMode',fleet:f,mode:'nuke'})),'bad-params');
  h.run('MP.publish()');assert(lastView(h,A).log.some(x=>/otomatik inşa|otomasyonu/.test(x.m))&&lastView(h,A).log.some(x=>/bombardıman/i.test(x.m)),'notices go to A only');
  assert(!lastView(h,B).log.some(x=>/bombardıman/i.test(x.m)));
});
test('inşaat gemisiyle yapı (build2 → startStruct): başkasının gemisi not-owner, görmediği sistem "yok", koşul yoksa motorun gerekçesi; hiçbir şey değişmez',()=>{
  const h=world();const s0=h.run('serialize()');const key=J(h,'Object.keys(STRUCTS)[0]'),own=J(h,`G.emps[${A}].home`);
  const other=J(h,`G.fleets.find(x=>x.e===${B}&&x.ships.length).id`);assert.equal(code(cmd(h,A,{kind:'struct',sys:own,key,fleet:other})),'not-owner');
  const unseen=J(h,`G.sys.find(s=>!s.seen.includes(${A}))?.id??null`);if(unseen!==null)assert.equal(code(cmd(h,A,{kind:'struct',sys:unseen,key,fleet:null})),'no-target');
  const r=cmd(h,A,{kind:'struct',sys:own,key:'zzz',fleet:null});assert.equal(r.code,'bad-params');assert.equal(h.run('serialize()'),s0);
});
test('ültimatom / himaye: insan hedefe reddedilir (insan adına zar yok — host\'un kendi arayüzü de); AI hedefte motorun kendi kapısı',()=>{
  const h=world();assert.equal(code(cmd(h,A,{kind:'ultimatum',target:B})),'rules:human');assert.equal(code(cmd(h,A,{kind:'patronage',target:0})),'rules:human');
  const ai=J(h,`G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&G.emps[${A}].contact[e.id]).id`);
  const u=cmd(h,A,{kind:'ultimatum',target:ai});assert.equal(u.code,'rules:diplo');assert.match(u.detail[0],/kriz/i);
  const p=cmd(h,A,{kind:'patronage',target:ai});assert.equal(p.code,'rules:diplo');assert.match(p.detail[0],/desteğinle doğmadı/);
  const r=J(h,`(()=>{const s=crisisActive;crisisActive=()=>true;try{return sendUltimatum(G.p,G.emps[${A}]);}finally{crisisActive=s;}})()`);
  assert.equal(r.ok,false);assert.match(r.why,/zar/);
});
test('federasyon savaş izni (fedWarRequest → proposeFedWar): federasyonsuz devlete motorun gerekçesi; görünmeyen hedef "yok"',()=>{
  const h=world();const ai=J(h,`G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&G.emps[${A}].contact[e.id]).id`);
  const r=cmd(h,A,{kind:'fedWar',target:ai});assert.equal(r.code,'rules:fed');
  const noC=J(h,`G.emps.find(e=>e.id!==${A}&&!e.dead&&!G.emps[${A}].contact[e.id])?.id??null`);if(noC!==null)assert.equal(code(cmd(h,A,{kind:'fedWar',target:noC})),'no-target');
});
test('ortak destek görünümü: yalnız bu oyuncunun destek bağı olan AI müttefikleri ve kendi planları; komut motorun devlet-0 engeline takılmaz (seferi yoksa motorun gerekçesi)',()=>{
  const h=world();h.run('MP.publish()');const v=lastView(h,A);assert(v.joint&&Array.isArray(v.joint.allies)&&Array.isArray(v.joint.plans));
  for(const a of v.joint.allies)assert.equal(J(h,`!!(G.emps[${a.id}].ai&&G.emps[${A}].contact[${a.id}])`),true);
  const ai=J(h,`G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&G.emps[${A}].contact[e.id]).id`),own=J(h,`G.emps[${A}].home`);
  const r=cmd(h,A,{kind:'jointRequest',ally:ai,type:'defend',target:own});assert.equal(r.code,'rules:engine');
  if(J(h,`!!jointBinding(G.emps[${A}],G.emps[${ai}])`))assert.notEqual(r.detail[0],'Siyasi askerî destek yetkisi yok','devlet-0 engeli kalktı');
  assert.equal(code(cmd(h,A,{kind:'jointCancel',plan:999})),'rules:engine');
});
/* ---- Dünya 2: ortak sefer fikstürü; uzak insan = devlet 2 (motorun yamalı jointRequest / jointCancel / jointCreate'i) ---- */
function jw(human){const h=jointWorld({player:true});h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'j',random:()=> 'ab',send(){},kick(){}});MP.installGuards();__mpHumanVoter=id=>${human?'id===2':'false'};${human?'G.emps[2].ai=false;':''}`);return h;}
test('ortak destek: uzak insan (devlet 2) motorun kendi yoluyla AI müttefikten destek ister; plan gerçek AI filosunu kullanır, insanın hiçbir filosu ayrılmaz; yalnız kendi talebini iptal eder; gemiler korunur',()=>{
  const h=jw(true);const r=J(h,`(()=>{const r=jointRequest(G.emps[2],1,'capture',8);return {ok:r.ok,why:r.why,id:r.plan&&r.plan.id,owners:r.plan?r.plan.fleets.map(f=>f.owner):[],req:r.plan&&r.plan.requester};})()`);
  assert.equal(r.ok,true,r.why);assert.equal(r.req,2);assert(r.owners.length&&r.owners.every(o=>o===1),JSON.stringify(r.owners));
  assert.equal(J(h,'G.fleets.filter(f=>f.e===2&&jointReserved(f)).length'),0,'no human fleet reserved');
  assert.equal(J(h,`jointCancel(G.p,${r.id}).ok`),false,'another player cannot cancel');assert.equal(J(h,`jointCancel(G.emps[1],${r.id}).ok`),false);
  const ships=J(h,'G.fleets.reduce((n,f)=>n+f.ships.length,0)');assert.equal(J(h,`jointCancel(G.emps[2],${r.id}).ok`),true);
  assert.equal(J(h,'G.fleets.reduce((n,f)=>n+f.ships.length,0)'),ships);assert.equal(J(h,'G.fleets.filter(f=>jointReserved(f)).length'),0);
});
test('ortak destek "filomu destekle": uzak insanın kendi filosu dayanak; dayanak gücü sahibinin bakışıyla sayılır (motorun devlet-0 varsayımı yalnız uzak insan için genişletildi)',()=>{
  const h=jw(true);const r=J(h,`(()=>{const a=forces[2];const r=jointRequest(G.emps[2],1,'follow',a.id);return {ok:r.ok,why:r.why,anchor:r.plan&&r.plan.anchor,a:a.id,pow:jointAnchorPower(a.id,jointAt(a)),own:fleetPower(a)};})()`);
  assert.equal(r.ok,true,r.why);assert.equal(r.anchor,r.a);assert.equal(r.pow,r.own,'anchor power counted for the remote human');
  const z=jw(false);assert.equal(J(z,`jointAnchorPower(forces[2].id,jointAt(forces[2]))`),0,'without a remote human the engine rule is unchanged (only empire 0)');
});
test('ortak destek eşdeğerliği: uzak insan yokken yamalı motor tek oyunculuyla aynı (oyuncu talebi + 20 gün: Save8 ve RNG birebir); insan olmayan devlet 2 hâlâ reddedilir',()=>{
  const a=jw(false),b=jointWorld({player:true});const run=`var __r=jointRequest(G.p,1,'capture',8);for(let i=0;i<400;i++){G.day+=.05;jointTick();stepFleets(.05);}`;
  a.run(run);b.run(run);assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  assert.equal(J(a,`jointRequest(G.emps[2],1,'capture',8).why`),'Siyasi askerî destek yetkisi yok');
});
end();
