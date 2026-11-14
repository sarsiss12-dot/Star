'use strict';
/* WAR-COALITION.0 — MP: misafirler GERÇEK mp-core komutlarıyla koalisyon kurar. Host her adımı motorun warCoalitionCommand'ında yeniden
   denetler; insan alıcıya davet MP teklif deposundan gider (gelen kutusu kartı), kabulü executeDeal → warPrepareAccept.
   Dünya: helpers/beta-fed-found0-mp-world.cjs (misafir B=1, C=3, D=4). Hedef: AI devlet 2. */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>{h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=40;e.war[o.id]=false;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
  for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
  for(const [a,b] of [[1,3],[1,5]]){G.emps[a].ally[b]=G.emps[b].ally[a]=true;G.emps[a].rel[b]=G.emps[b].rel[a]=90;}(G.emps[5].intel=G.emps[5].intel||{})[1]=3;
  for(const r of ['min','ene','ala','yiy','tuk'])G.emps[1].res[r]=4000;remember(G.emps[2],1,'savasIlan');`);
  return J(h,'warFetihDefault(G.emps[1],G.emps[2]).slice(0,1)');};
const pend=(h,to)=>J(h,`MP.dip.offers.filter(r=>r.status==='pending'&&r.to===${to}).map(r=>r.id)`);

test('K1 misafir planlayan B: koalisyon görünümü salt okunur; toplu davet (AI müttefik + insan C); C karşı teklif verir; B kabul eder; kısmi son onayla ilan; C ve AI savaşa girer',()=>{
  const h=world();const ts=prep(h);const rev0=h.run('MP.state?MP.state.rev:0'),pre=J(h,'(G.warLedger.preparations||[]).length');
  const v=cmd(h,'B',{kind:'warCoalition',target:2,goal:'fetih',targets:ts});assert.equal(v.status,'ok',JSON.stringify(v));
  assert.equal(J(h,'(G.warLedger.preparations||[]).length'),pre,'görünüm hazırlık açmaz');assert.ok(v.extra.candidates.some(c=>c.id===3&&c.group==='near'),'insan müttefik C listede, yakın grupta');
  const s=cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts,list:[{member:3},{member:5,give:[{t:'res',r:'ala',v:300}]}]});assert.equal(s.status,'ok',JSON.stringify(s));
  const by=Object.fromEntries(s.extra.results.map(x=>[x.member,x.result]));assert.equal(by[3],'pending','insana davet gelen kutusuna');const plan=s.extra.plan;
  const offs=pend(h,3);assert.equal(offs.length,1,'C\'nin kutusunda tek davet');
  assert.ok(J(h,`MP.dip.offers.find(r=>r.id===${offs[0]}).want.some(i=>i.t==='warJoin'&&i.plan===${plan}&&i.target===2)`),'davet doğru hazırlığa ve hedefe bağlı');
  const ct=cmd(h,'C',{kind:'counter',offer:offs[0],give:[{t:'warJoin',plan,target:2}],want:[{t:'res',r:'min',v:200}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
  const view=cmd(h,'B',{kind:'warCoalition',target:2}).extra;const cc=view.candidates.find(c=>c.id===3);assert.equal(cc.state,'countered');assert.ok(Number.isSafeInteger(cc.offer));
  const acc=cmd(h,'B',{kind:'respond',offer:cc.offer,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:cc.offer,action:'accept'}).status,'ok','ikinci kabul yok');
  const q=cmd(h,'B',{kind:'warCoalition',target:2}).extra.quote;assert.ok(q.members.includes(3),'insan C kabul edenler arasında: '+JSON.stringify(q));
  const min0=h.run('G.emps[1].res.min');const L=cmd(h,'B',{kind:'warLaunch',id:plan,stamp:q.stamp,mode:'partial'});assert.equal(L.status,'ok',JSON.stringify(L));
  assert.equal(J(h,'!!G.emps[1].war[2]&&!!G.emps[3].war[2]'),true);assert.equal(min0-h.run('G.emps[1].res.min'),200,'C\'nin istediği bedel bir kez');
  assert.deepEqual(J(h,'G.emps[1].wg[2].targets'),ts,'Fetih seçimi ilana taşındı');
  assert.notEqual(cmd(h,'B',{kind:'warLaunch',id:plan,stamp:q.stamp,mode:'partial'}).status,'ok','tekrar gönderim ikinci savaş açmaz');
});
test('K2 gizlilik ve yetki: D, B\'nin hazırlığını / davetlerini göremez ve yönetemez; davet edilmeyen D teklifi yanıtlayamaz',()=>{
  const h=world();const ts=prep(h);const s=cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts,list:[{member:3}]});const plan=s.extra.plan,off=pend(h,3)[0];
  const dv=cmd(h,'D',{kind:'warCoalition',target:2,goal:'fetih',targets:J(h,'warFetihDefault(G.emps[4],G.emps[2]).slice(0,1)')});assert.equal(dv.status,'ok');assert.equal(dv.extra.prep,null,'başkasının hazırlığı görünmez');
  assert.equal(JSON.stringify(dv.extra).includes('"plan":'+plan),false);
  const rd=cmd(h,'D',{kind:'warCenterRead',front:0});assert.equal(rd.extra.preparations.some(p=>p.id===plan),false);
  assert.notEqual(cmd(h,'D',{kind:'warLaunch',id:plan,stamp:'x',mode:'partial'}).status,'ok');assert.notEqual(cmd(h,'D',{kind:'warPrepareWithdraw',id:plan,member:null}).status,'ok');
  assert.notEqual(cmd(h,'D',{kind:'respond',offer:off,action:'accept'}).status,'ok','alıcı olmayan yanıtlayamaz');
  assert.notEqual(cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts,list:[{member:3},{member:3}]}).status,'ok','aynı devlete çift davet listesi reddedilir');
  assert.equal(cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts,list:[{member:3}]}).extra.results[0].result,'skip','bekleyen davet ikinci kez gönderilmez');
  assert.equal(pend(h,3).length,1);
});
test('K3 hedef değişikliği ve iptal: bekleyen insan daveti kapanır (eski şartla kabul edilemez); iptalde açık davetler kapanır',()=>{
  const h=world();const ts=prep(h);const s=cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts,list:[{member:3}]});const plan=s.extra.plan,off=pend(h,3)[0];
  const ts2=J(h,'warFetihDefault(G.emps[1],G.emps[2]).slice(0,2)');const u=cmd(h,'B',{kind:'warPrepareGoal',id:plan,goal:'fetih',targets:ts2});assert.equal(u.status,'ok',JSON.stringify(u));
  assert.equal(J(h,`MP.dip.offers.find(r=>r.id===${off}).status`),'invalid','eski şartlı davet kapandı');assert.notEqual(cmd(h,'C',{kind:'respond',offer:off,action:'accept'}).status,'ok');
  assert.equal(J(h,`warInviteLast(warPreparation(${plan}),3).state`),'closed');
  const s2=cmd(h,'B',{kind:'warInvite',target:2,goal:'fetih',targets:ts2,list:[{member:3}]});assert.equal(s2.extra.results[0].result,'pending','güncel şartlarla yeni davet');
  assert.equal(cmd(h,'B',{kind:'warPrepareWithdraw',id:plan,member:null}).status,'ok');assert.equal(pend(h,3).length,0,'iptalde bekleyen davet kapandı');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
