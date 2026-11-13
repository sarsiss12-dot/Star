'use strict';
/* BETA-FED-FLEET.0 — MP host 'fedShip' komutu. Gerçek mp-core + mirror.js, Node vm (tests/helpers/runtime.js), orta / 5 AI / seed 23.
   FİKSTÜR (açıkça): host 0 + misafir B=1, C=3 (federasyon üyeleri) + D=4 (üye değil). Federasyon {1,3,0}, başkan 1 (misafir B),
   ortak fon doğrudan atanır. Komutlar gerçek MP iletisiyle (MP.onMessage, bağlantı kimliği = devlet). */
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const {world:base,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+e.stack);}};
function world(){
  const h=base();
  h.run(`(()=>{const ms=[1,3,0],type='askeri';const f={id:(G.fedUid=(G.fedUid||0)+1),name:'MP Federasyonu',type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:1,founder:1,members:ms.slice(),laws:{},treasury:0,fund:{ala:2000,ene:2000},nextVote:G.day+60,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};
    for(const id of [1,3,0,4]){const e=G.emps[id];for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],5000);const s=G.sys[e.home];if(!hasYard(s)){const p=s.planets.find(p=>p.owner===id&&p.col);p.col.b.tersane=(p.col.b.tersane||0)+1;}}
    globalThis.__fid=f.id;})()`);
  return h;
}
const raw=(h,c,cid,x)=>{const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid,cmd:x});h.run(`MP.onMessage('${c}',message)`);return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result');};
const fund=h=>J(h,'G.feds.find(f=>f.id===__fid).fund');
const orders=h=>J(h,'(()=>{const o=[];for(const s of G.sys)for(const q of s.queue)if(q.fed===__fid)o.push({sys:s.id,cls:q.cls,e:q.e,left:q.left,paid:q.fedPaid});return o;})()');
const home=(h,id)=>J(h,`G.emps[${id}].home`);
const order=(h,c,id,cls='kor',sys=null)=>cmd(h,c,{kind:'fedShip',sys:sys===null?home(h,id):sys,key:cls});
const costKor=h=>J(h,"fedShipCost('kor').ala");

test('M1 misafir başkan (B=1) federal siparişi host doğrular; bedel fondan bir kez, tersane kuyruğunda tek iş, kişisel kaynak değişmez',()=>{
  const h=world(),f0=fund(h),r0=J(h,'G.emps[1].res.ala'),c=costKor(h);
  const r=order(h,'B',1);assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(fund(h).ala,f0.ala-c,'bedel fondan bir kez');assert.equal(J(h,'G.emps[1].res.ala'),r0,'başkanın kişisel alaşımı değişmez');
  const o=orders(h);assert.equal(o.length,1);assert.equal(o[0].e,1);assert.equal(o[0].sys,home(h,1));assert.equal(o[0].paid.ala,c);
});
test('M2 başkan olmayan üye (C=3), üye olmayan (D=4), başkasının tersanesi ve sınıf dışı reddedilir; fon değişmez',()=>{
  const h=world(),f0=fund(h);
  const c=order(h,'C',3);assert.notEqual(c.status,'ok');assert.equal(c.code,'rules:fed',JSON.stringify(c));assert.match(String(c.detail),/başkan/i);
  const d=order(h,'D',4);assert.notEqual(d.status,'ok',JSON.stringify(d));
  const o=cmd(h,'B',{kind:'fedShip',sys:home(h,3),key:'kor'});assert.notEqual(o.status,'ok','başkasının tersanesi');
  const k=cmd(h,'B',{kind:'fedShip',sys:home(h,1),key:'kolon'});assert.notEqual(k.status,'ok','geçersiz/sivil sınıf');
  assert.deepEqual(fund(h),f0);assert.equal(orders(h).length,0);
});
test('M3 aynı komut kimliği (yeniden bağlanma / çift gönderim) ikinci ödeme ve ikinci iş üretmez; aynı ay ikinci sipariş reddedilir',()=>{
  const h=world(),f0=fund(h),c=costKor(h),x={kind:'fedShip',sys:home(h,1),key:'kor'};
  const a=raw(h,'B','fedfleetB000001',x),b=raw(h,'B','fedfleetB000001',x);
  assert.equal(a.status,'ok');assert.equal(b.status,'ok','aynı cid önbellekteki sonucu döner');
  assert.equal(fund(h).ala,f0.ala-c);assert.equal(orders(h).length,1);
  const d=order(h,'B',1);assert.notEqual(d.status,'ok');assert.match(String(d.detail),/bu ay/i);assert.equal(fund(h).ala,f0.ala-c);assert.equal(orders(h).length,1);
});
test('M4 başkanlık değişince önceki başkanın (B) siparişi işlem anında reddedilir; yeni başkan (C) sipariş verebilir; bekleyen iş federasyonda kalır',()=>{
  const h=world();assert.equal(order(h,'B',1).status,'ok');
  h.run('G.feds.find(f=>f.id===__fid).leader=3;G.day=(Math.floor(G.day/30)+1)*30;');
  const b=order(h,'B',1);assert.notEqual(b.status,'ok');assert.match(String(b.detail),/başkan/i);
  assert.equal(orders(h).length,1,'önceki başkanın bekleyen işi federasyonda');
  const c=order(h,'C',3);assert.equal(c.status,'ok',JSON.stringify(c));assert.equal(orders(h).length,2);
});
test('M5 ayna: üyeler (B, C) gerçek fon + bakım defterini görür; üye olmayan (D) görmez; katkı kaydı ve sipariş tersaneleri hiç gitmez',()=>{
  const h=world();assert.equal(order(h,'B',1).status,'ok');h.run(`fedContribute(G.feds.find(f=>f.id===__fid),3,'ala',77)`);
  const f=fund(h);
  for(const id of [1,3]){const m=J(h,`StarsMirror.build(${id}).world.feds.find(f=>f.id===__fid)`);
    assert.deepEqual(m.fund,{ala:f.ala,ene:f.ene},'üye gerçek bakiye');assert.equal(m.fundView.queued,1);assert.equal(m.fundView.cap,12);
    assert.ok(m.fundView.upkeep&&typeof m.fundView.upkeep.ene==='number');assert.equal(m.fundView.monthUsed,true);
    assert.equal(m.contrib,undefined,'katkı kaydı aynaya girmez');assert.ok(m.fundView.orders.every(o=>o.sys===undefined),'sipariş tersanesi aynaya girmez');}
  const all=J(h,'StarsMirror.build(4).world.feds');const d=all.find(f=>f.id===J(h,'__fid'));
  if(d){assert.deepEqual(d.fund,{ala:0,ene:0},'üye olmayana fon gitmez');assert.equal(d.fundView,undefined);assert.equal(d.contrib,undefined);}
  assert.ok(!JSON.stringify(J(h,'StarsMirror.build(4).world')).includes('fundView'),'üye olmayanın aynasında defter yok');
});
test('M6 misafir aynası misafir motorunda yüklenir; misafir başkan kendi tersanesinde aynı teklif kuralını görür (ayda bir, fon, sınır)',()=>{
  const h=world();h.run('var __mw=JSON.stringify(StarsMirror.build(1))');const w=h.run('__mw');
  const g=runtime();g.sb.__w=w;assert.equal(g.run('deserialize(__w)'),true,'misafir motoru aynayı kabul eder: '+g.run('JSON.stringify(saveLoadReject())'));
  const q=J(g,`(()=>{const f=G.feds[0];const q=fedShipQuote(G.emps[0],G.emps[0].home,'kor');return {ok:q.ok,why:q.why||null,leader:f.leader,fund:f.fund};})()`);
  assert.equal(q.leader,0,'misafir kendini başkan görür (π)');assert.equal(q.ok,true,JSON.stringify(q));
  assert.equal(order(h,'B',1).status,'ok');h.run('__mw=JSON.stringify(StarsMirror.build(1))');g.sb.__w=h.run('__mw');assert.equal(g.run('deserialize(__w)'),true);
  const q2=J(g,`(()=>{const q=fedShipQuote(G.emps[0],G.emps[0].home,'kor');return {ok:q.ok,why:q.why||null};})()`);
  assert.equal(q2.ok,false);assert.match(q2.why,/bu ay/i,'aylık hak aynadaki defterden');
  const qq=J(g,'(()=>{const o=[];for(const s of G.sys)for(const q of s.queue||[])if(q.fed!==undefined)o.push({e:q.e,cls:q.cls,ala:q.fedPaid.ala});return o;})()');
  assert.equal(qq.length,1);assert.equal(qq[0].e,0,'kendi kuyruğunda federal iş görünür');
});
test('M7 tamamlanınca federal gemi o anki başkana federal filo olarak çıkar; ödeme bir kez, iş kuyruktan kalkar',()=>{
  const h=world(),c=costKor(h);assert.equal(order(h,'B',1).status,'ok');const f1=fund(h);
  const n=J(h,"(()=>{let n=0;for(const s of G.sys)for(const q of s.queue)if(q.fed===__fid)n=Math.max(n,Math.ceil(q.left)+2);return n;})()");
  for(let i=0;i<n;i++)h.run('G.day+=1;dailyTick(1);');
  assert.equal(orders(h).length,0);const fl=J(h,'G.fleets.filter(f=>f.federal&&f.fedId===__fid).map(f=>({e:f.e,n:f.ships.length,c:f.ships[0].c}))');
  assert.equal(fl.length,1);assert.equal(fl[0].e,1);assert.equal(fl[0].c,'kor');
  assert.equal(f1.ala,2000-c);assert.equal(J(h,'G.fleets.filter(f=>f.federal).length'),1,'tek gemi');
  const m=J(h,`StarsMirror.build(1).fl.filter(f=>f.federal)`);assert.equal(m.length,1,'misafir başkan güncel aynada federal filoyu görür');assert.equal(m[0].e,0);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
