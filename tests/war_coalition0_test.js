'use strict';
/* WAR-COALITION.0 — savaş ilanında koalisyon (motor). Aynı hazırlık kaydı (G.warLedger.preparations), aynı teklif motoru (dealQuote /
   aiRespond / executeDeal), aynı hedef doğrulaması (warDeclarationPreview). FİKSTÜR (açıkça): orta harita, seed 22, 6 AI; temas/keşif açık;
   başkent çevresinde birkaç sistem; 2 ve 3 oyuncunun müttefiki ve oyuncu hakkında SIZILMIŞ istihbaratlı (karşı teklif kurabilir). */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
function world(){const h=runtime();h.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:6,pirates:false});G.autoSave=false;var A=G.p,T=G.emps[1];
 for(const e of G.emps){e.res.etk=5000;e.civics=[];for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=60;}}
 for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
 for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
 for(const id of [2,3]){A.ally[id]=G.emps[id].ally[0]=true;A.rel[id]=G.emps[id].rel[0]=90;(G.emps[id].intel=G.emps[id].intel||{})[0]=3;}
 for(const r of ['min','ene','ala','yiy','tuk'])A.res[r]=4000;remember(T,0,'savasIlan');var TS=warFetihDefault(A,T);`);return h;}
const cmd=(h,c)=>J(h,`warCoalitionCommand(A,${JSON.stringify(c)})`);
const fet=(h,n=1)=>({goal:'fetih',targets:J(h,'TS').slice(0,n)});

test('C1 tek başına: görünüm hazırlık açmaz, kaynak/teklif/savaş yok; önizleme doğrudan ilanla aynı imza; geçersiz Fetih seçimi engel olur',()=>{
  const h=world();const res0=J(h,'A.res'),day0=h.run('G.day');
  const v=cmd(h,{kind:'warCoalition',target:1,...fet(h)});assert.equal(v.ok,true);assert.equal(v.extra.prep,null);assert.equal(v.extra.quote,null);
  assert.equal(v.extra.preview.signature,J(h,`warDeclarationPreview(A,T,'fetih',{targets:TS.slice(0,1)}).signature`),'tek doğrulama');
  assert.deepEqual(J(h,'A.res'),res0);assert.equal(J(h,'(G.warLedger.preparations||[]).length'),0);assert.equal(J(h,'!!A.war[1]'),false);assert.equal(h.run('G.day'),day0);
  const bad=cmd(h,{kind:'warCoalition',target:1,goal:'fetih',targets:[J(h,'T.home')]});assert.equal(bad.extra.preview.ok,false);assert.match(bad.extra.preview.blockers.join(),/Geçersiz savaş hedefi seçimi/);
  const vas=cmd(h,{kind:'warCoalition',target:1,goal:'boyun',vtype:'akademik',war:'none'});assert.equal(vas.extra.preview.ok,true);assert.equal(vas.extra.preview.goal.vtype,'akademik');
});
test('C2 karışık koalisyon: kaynaklı kabul, karşı teklif (kabul), ret, engelli aday; kısmi son onay yalnız geçerli kabullerle; bedel bir kez; bekleyen davet kapanır',()=>{
  const h=world();h.run(`T.nap=T.nap||{};G.emps[6].nap=G.emps[6].nap||{};G.emps[6].nap[1]=T.nap[6]=G.day+9999;`);   // 6: hedefle saldırmazlık paktı
  const v0=cmd(h,{kind:'warCoalition',target:1,...fet(h)}).extra;const c6=v0.candidates.find(c=>c.id===6);assert.equal(c6.state,'blocked');assert.equal(c6.why,'Hedefle saldırmazlık paktı var');
  assert.ok(v0.candidates.findIndex(c=>c.id===2)<v0.candidates.findIndex(c=>c.id===4),'müttefikler önce');
  const r=cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:2,give:[{t:'res',r:'ala',v:400}]},{member:3},{member:5}]});assert.equal(r.ok,true,JSON.stringify(r));
  const by=Object.fromEntries(r.extra.results.map(x=>[x.member,x.result]));assert.equal(by[2],'accepted',JSON.stringify(r.extra.results));assert.equal(by[3],'countered');assert.equal(by[5],'rejected');
  const plan=r.extra.plan;assert.equal(cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:2}]}).extra.results[0].result,'skip','kabul etmiş devlete ikinci davet yok');
  const ct=J(h,`warCoalitionView(A,1).candidates.find(c=>c.id===3)`);assert.equal(ct.state,'countered');assert.ok(ct.counter.want.some(i=>i.t==='res'),'karşı teklifin istediği kaynak görünür');
  assert.equal(cmd(h,{kind:'warInviteReply',id:plan,member:3,action:'accept'}).ok,true);assert.notEqual(cmd(h,{kind:'warInviteReply',id:plan,member:3,action:'accept'}).ok,true,'çift kabul yok');
  h.run(`warCoalitionInvite(A,${plan},[{member:4}])`);   // 4 cevap bekleyen olarak kalırsa kapanmalı; AI hemen yanıtlar → kaydı bekleyene çevir
  h.run(`{const v=warInviteLast(warPreparation(${plan}),4);if(v){v.state='pending';v.expires=G.day+100;}}`);
  const q=J(h,`warCoalitionQuote(A,${plan})`);assert.equal(q.ok,true);assert.deepEqual(q.members.sort(),[2,3]);assert.ok(q.own.ala>=400,'kabul edilen kaynak bedeli toplamda: '+JSON.stringify(q.own));assert.deepEqual(q.pending,[4]);
  const res0=J(h,'A.res');const L=cmd(h,{kind:'warLaunch',id:plan,stamp:q.stamp,mode:'partial'});assert.equal(L.ok,true,JSON.stringify(L));
  assert.equal(J(h,'!!A.war[1]&&!!G.emps[2].war[1]&&!!G.emps[3].war[1]&&!G.emps[5].war[1]&&!G.emps[4].war[1]'),true);
  assert.deepEqual(J(h,'A.wg[1].targets'),J(h,'TS').slice(0,1),'seçilen Fetih sistemleri ilana kadar taşındı');
  const spent=res0.ala-J(h,'A.res.ala');assert.equal(spent,q.own.ala,'kaynak bedeli bir kez');
  assert.equal(J(h,`warInviteLast(warPreparation(${plan}),4).state`),'closed','bekleyen davet ilan öncesi teklif olarak kapandı');
  assert.notEqual(cmd(h,{kind:'warLaunch',id:plan,stamp:q.stamp,mode:'partial'}).ok,true,'ikinci savaş yok');assert.equal(J(h,'G.warLedger.fronts.filter(f=>f.sides.includes(0)&&f.sides.includes(1)).length'),1);
  /* savaş başladıktan sonra yeni davet doğru cepheye bağlanır; eski plan maddesi kabul edilemez */
  const f=J(h,'warLedgerFind(0,1).id');assert.equal(J(h,`dealQuote({from:0,to:4,give:[],want:[{t:'warJoin',front:${f},target:1}],born:G.day,expires:G.day+30}).norm.want[0].front`),f);
  assert.equal(J(h,`dealQuote({from:0,to:4,give:[],want:[{t:'warJoin',plan:${plan},target:1}],born:G.day,expires:G.day+30}).ok`),false,'eski hazırlık maddesi yeni cepheye taşınmaz');
});
test('C3 şart değişikliği: Fetih hedefi değişince kabul yeniden onay ister, son onaya girmez; bütçe düşünce kart gerekçe verir; damga değişir',()=>{
  const h=world();const r=cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:2,give:[{t:'res',r:'ala',v:400}]}]});const plan=r.extra.plan;assert.equal(r.extra.results[0].result,'accepted');
  const s1=J(h,`warCoalitionQuote(A,${plan}).stamp`);const u=cmd(h,{kind:'warPrepareGoal',id:plan,...fet(h,2)});assert.equal(u.ok,true);assert.deepEqual(u.extra.stale,[2]);
  const q=J(h,`warCoalitionQuote(A,${plan})`);assert.deepEqual(q.members,[]);assert.match(q.invalid[0].why,/Savaş hedefi değişti/);assert.notEqual(q.stamp,s1);
  assert.equal(J(h,`warCoalitionView(A,1).candidates.find(c=>c.id===2).state`),'stale');
  assert.equal(cmd(h,{kind:'warLaunch',id:plan,stamp:s1,mode:'partial'}).ok,false,'eski damga ile başlatılamaz');
  const re=cmd(h,{kind:'warInvite',target:1,...fet(h,2),list:[{member:2,give:[{t:'res',r:'ala',v:400}]}]});assert.equal(re.extra.results[0].result,'accepted','güncel şartlarla yeniden onay');
  assert.deepEqual(J(h,`warCoalitionQuote(A,${plan}).members`),[2]);
  h.run('A.res.ala=100');const q2=J(h,`warCoalitionQuote(A,${plan})`);assert.deepEqual(q2.members,[]);assert.equal(q2.invalid[0].member,2);assert.ok(q2.invalid[0].why.length>3,'gerekçe: '+q2.invalid[0].why);
  console.log('  bütçe düşünce: '+q2.invalid[0].why);assert.notEqual(q2.stamp,J(h,`(()=>{A.res.ala=4000;const s=warCoalitionQuote(A,${plan}).stamp;A.res.ala=100;return s;})()`),'kadro değişince damga değişir → oyuncu güncel özeti yeniden onaylar');
  h.run('A.res.ala=4000;G.emps[2].ally[1]=T.ally[2]=true;');const q3=J(h,`warCoalitionQuote(A,${plan})`);assert.deepEqual(q3.members,[]);assert.ok(q3.invalid.some(x=>x.member===2),'katılımcının koşulu değişti → gerekçeli dışarıda');
});
test('C4 kayıt/yükleme: açık hazırlık, hedef seçenekleri, davetler ve kabuller korunur; eski seçeneksiz hazırlık eski kurallarıyla açılır ve başlar',()=>{
  const h=world();const r=cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:2,give:[{t:'res',r:'ala',v:400}]},{member:3}]});const plan=r.extra.plan;
  const v1=J(h,'warCoalitionView(A,1)');h.sb.S=h.run('serialize()');const g=world();g.sb.S=h.sb.S;assert.equal(g.run('deserialize(S)'),true);g.run('A=G.p;T=G.emps[1];');
  const v2=J(g,'warCoalitionView(A,1)');assert.deepEqual(v2.prep,v1.prep);assert.deepEqual(v2.candidates.map(c=>[c.id,c.state]),v1.candidates.map(c=>[c.id,c.state]));assert.deepEqual(v2.quote.members,v1.quote.members);
  const L=J(g,`warPrepareLaunch(A,${plan},warCoalitionQuote(A,${plan}).stamp,'partial')`);assert.equal(L.ok,true);
  /* eski Save8 biçimi: opts/invites/sig yok — eski yolla (kısmi değil) başlar */
  const o=world();o.run(`var pl=warPrepareCreate(A,1,'harac');`);const pid=o.run('pl.id');assert.equal(o.run(`warPreparation(${pid}).opts===undefined`),true);
  o.run(`var offer={from:0,to:2,give:[{t:'res',r:'ala',v:600}],want:[{t:'warJoin',plan:${pid},target:1}],born:G.day,expires:G.day+30};`);assert.equal(J(o,'executeDeal(offer)'),true);
  o.sb.S=o.run('serialize()');const k=world();k.sb.S=o.sb.S;assert.equal(k.run('deserialize(S)'),true);k.run('A=G.p;');assert.equal(k.run(`warPreparation(${pid}).commitments[0].sig===undefined`),true);
  const q=J(k,`warPrepareQuote(A,${pid})`);assert.equal(q.ok,true);assert.equal(J(k,`warPrepareLaunch(A,${pid},${JSON.stringify(q.stamp)}).ok`),true);assert.equal(J(k,'A.wg[1].t'),'harac');
});
test('C5 iptal / süre / eleme: kapanan hazırlığın daveti uygulanamaz; süre dolan davet "Süresi doldu"; hedef elenince başlatılamaz',()=>{
  const h=world();const r=cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:3}]});const plan=r.extra.plan;
  h.run(`{const v=warInviteLast(warPreparation(${plan}),3);v.state='pending';v.expires=G.day+10;}`);h.run('G.day+=11');
  assert.equal(J(h,`warCoalitionView(A,1).candidates.find(c=>c.id===3).state`),'expired');
  assert.equal(cmd(h,{kind:'warPrepareWithdraw',id:plan,member:null}).ok,true);
  assert.equal(J(h,`executeDeal({from:3,to:0,give:[{t:'warJoin',plan:${plan},target:1}],want:[],born:G.day,expires:G.day+30})`),false,'iptal edilen hazırlığa katılım yok');
  const r2=cmd(h,{kind:'warInvite',target:1,...fet(h),list:[{member:2,give:[{t:'res',r:'ala',v:400}]}]});const p2=r2.extra.plan;assert.notEqual(p2,plan,'yeni hazırlık, eski davetler taşınmaz');
  h.run('T.dead=true;');const q=J(h,`warCoalitionQuote(A,${p2})`);assert.equal(q.ok,false);assert.match(q.why,/Hedef devlet artık yok/);
});
test('C6 AI ve eski çağrılar: seçeneksiz hazırlıkta kısmi olmayan warPrepareQuote/Launch eski davranışla aynı (kabul yoksa ret)',()=>{
  const h=world();h.run(`var pl=warPrepareCreate(A,1,'harac');`);const q=J(h,'warPrepareQuote(A,pl.id)');assert.equal(q.ok,false);assert.match(q.why,/En az bir açık kabul/);
  assert.equal(h.run('warPreparation(pl.id).invites===undefined'),true,'kullanılmayan yeni alan yazılmaz');assert.equal(J(h,'Object.keys(warPreparation(pl.id)).sort().join()'),'commitments,expires,goal,id,opened,owner,state,target');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
