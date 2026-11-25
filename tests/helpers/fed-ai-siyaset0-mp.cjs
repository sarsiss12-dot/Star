'use strict';
/* FED-AI-SİYASET.0 — FA senaryosu (MP8_SCEN=FA): host + misafir B + misafir C (ayrı Chromium kalıcı profilleri, gerçek STARS arayüzü). Yerel relay + TLS vekili; fiziksel cihaz / Render DEĞİL.
   A1 B başkanlığında federasyon [B, C, AI X, AI Y]; X türe uyumsuz, Y de X'in türünü tercih ediyor → X mevcut proposeFedMotion yoluyla TÜR REFORMU önerir.
      B ve C'de oy kartı (aynadan), AI B / C adına oy yazmaz; B ve C kartı gerçek gelen kutusundan açıp HAYIR'a dokunur → 2/4 (eşik %75 = 3) → reddedilir, tür aynı.
      (B HAYIR + C EVET olsaydı X ve Y ile 3/4 olur, reform geçerdi: insan oyları sonucu belirler.)
   A2 reddedilen ve çözülemeyen uyumsuzluk: X'in sabır sayacı dolunca anayasal ayrılış (alternatif blok var) → yalnız X çıkar; B başkan, C üye, fon aynı;
      B'nin aynası üyelik değişimini görür; X aynı birliğe dönmez (davet edilse de kabul etmez).
   A3 gizlilik: misafir aynasında AI iç alanları (_fedLeft, _fedReformAsk, _fedStrain, aiFedReason) yok; misafir AI'ın reform gerekçesini göremez. */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,settle}=X;
 const M=metrics.fa={};const H=pg.H,B=pg.B,C=pg.C;const EB=await B.evaluate(()=>MP1Join.empireId),EC=await C.evaluate(()=>MP1Join.empireId);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
 const voteCard=p=>wait(p,()=>(G.inbox||[]).some(n=>n.kind==='fedvote')&&DiplomaticInbox.state().records.some(r=>r.kind==='fedvote'&&r.status==='pending'),undefined,25000).then(()=>true).catch(()=>false);

 await test('A0 fikstür (host): B başkanlığında federasyon [B, C, X, Y]; X ve Y aynı farklı türü tercih ediyor',async()=>{
   M.fx=await H.evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});
     const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!isPurifier(o));let pick=null;
     for(const type of Object.keys(FED_TYPES))for(const x of ais){const pref=aiFedType(x);if(pref===type||aiFedAffinity(x,pref)-aiFedAffinity(x,type)<.4)continue;
       const y=ais.find(o=>o!==x&&aiFedAffinity(o,pref)>aiFedAffinity(o,type));if(y&&!pick)pick={type,x,y,pref};}
     if(!pick)return {ok:false};const mem=[b,c,pick.x.id,pick.y.id];
     for(const a of G.emps)if(!a.wild)for(const o of G.emps)if(o!==a&&!o.wild){a.contact[o.id]=true;a.rel[o.id]=Math.max(a.rel[o.id]||0,60);(a.intel||={})[o.id]=Math.max(a.intel[o.id]||0,2);}
     for(const a of mem)for(const o of mem)if(a!==o){G.emps[a].ally[o]=true;G.emps[a].war[o]=false;G.emps[a].rel[o]=90;}
     for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k]||0,3000);
     G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>mem.includes(m)));const id=(G.fedUid=(G.fedUid||0)+1);
     const F={id,name:fedName(null,pick.type),type:pick.type,charter:{...fedDefaultCharter(pick.type),ballot:'equal'},politicsVersion:96,leader:b,founder:b,members:mem,laws:{},treasury:0,fund:{ala:50,ene:50},
       nextVote:G.day+9999,vote:null,founded:G.day-800,typeSince:G.day-800,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:100};
     G.feds.push(F);federationIdentity(F);for(const m of mem)F.dutyConsent[m]={offense:false,since:G.day-800};fedRefreshRepresentation(F,true);MP1Host.host.publish();
     return {ok:true,fed:id,type:pick.type,pref:pick.pref,X:pick.x.id,Y:pick.y.id,mm:aiFedMismatch(pick.x,F)};},[EB,EC]);
   assert.equal(M.fx.ok,true,'uygun AI çifti');assert.ok(M.fx.mm&&M.fx.mm.plausible,'X uyumsuz + destekli '+JSON.stringify(M.fx.mm));await settle('a0');});

 await test('A1 AI X tür reformu önerir; B ve C kart alır, AI insan adına oy yazmaz; B ve C HAYIR (gerçek kart) → reddedilir, tür aynı',async()=>{
   const p=await H.evaluate(([x,id])=>{const F=fedOf(id);const ok=aiFedMemberReform(G.emps[x],F);MP1Host.host.publish();
     return {ok,motion:F.vote&&F.vote.motion,type:F.vote&&F.vote.type,votes:F.vote&&F.vote.votes?Object.keys(F.vote.votes).map(Number):[]};},[M.fx.X,M.fx.fed]);
   M.a1={proposal:p};assert.equal(p.ok,true);assert.equal(p.motion,'reform');assert.equal(p.type,M.fx.pref);
   assert.ok(!p.votes.includes(EB)&&!p.votes.includes(EC),'insan adına oy yok '+JSON.stringify(p.votes));
   const cb=await voteCard(B),cc=await voteCard(C);M.a1.cards={B:cb,C:cc};await shot(B,'a1-b-kart');assert.equal(cb,true,'B kartı');assert.equal(cc,true,'C kartı');
   await closeAll(B);const ub=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').uid);await hit(B,'[data-a="openNote"][data-x="'+ub+'"]');await hit(B,'#inboxNo');
   await closeAll(C);const uc=await C.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').uid);await hit(C,'[data-a="openNote"][data-x="'+uc+'"]');await hit(C,'#inboxNo');
   const done=await H.waitForFunction(id=>{const F=fedOf(id);return F&&!F.vote;},M.fx.fed,{timeout:25000}).then(()=>true).catch(()=>false);
   M.a1.result=await H.evaluate(id=>{const F=fedOf(id);return {type:F.type,reform:!!F.reform,votes:F.lastVote&&F.lastVote.votes||null,last:F.lastVote&&{motion:F.lastVote.motion,passed:F.lastVote.passed,type:F.lastVote.type}};},M.fx.fed);
   assert.equal(done,true,'oylama kapandı (iki insan oyu)');assert.equal(M.a1.result.type,M.fx.type,'tür değişmedi');assert.equal(M.a1.result.last&&M.a1.result.last.passed,false,'reddedildi '+JSON.stringify(M.a1.result));assert.equal(M.a1.result.reform,false,'geçiş başlamadı');await settle('a1');});

 await test('A2 çözülemeyen uyumsuzluk → X anayasal yoldan ayrılır; yalnız X çıkar, B başkan, C üye, fon aynı; B aynası günceller; X geri dönmez',async()=>{
   const r=await H.evaluate(([id,x])=>{const F=fedOf(id),X=G.emps[x],fund0=JSON.stringify(F.fund);let left=false,i=0;
     for(;i<40&&!left;i++){G.day+=30;left=aiFedStayReview(X,F);}
     const back=(()=>{F.invites[x]={expires:G.day+180,by:F.leader,terms:fedCharterKey(F)};X._fedPoliticsAfter=0;X._fedPoliticsMonth=-1;aiFederationPolitics();return F.members.includes(x);})();
     MP1Host.host.publish();return {left,evals:i,members:F.members.slice(),leader:F.leader,fundSame:JSON.stringify(F.fund)===fund0,why:X.aiFedReason&&X.aiFedReason.why,back};},[M.fx.fed,M.fx.X]);
   M.a2=r;if(!r.left){M.a2.note='yaşayabilir alternatif yoktu: ayrılmadı (kural)';assert.ok(r.members.includes(M.fx.X));return;}
   assert.equal(r.members.includes(M.fx.X),false);assert.ok(r.members.includes(EB)&&r.members.includes(EC),'insanlar üye');assert.equal(r.leader,EB);assert.equal(r.fundSame,true);
   assert.match(r.why||'',/tür uyumsuzluğu/);assert.equal(r.back,false,'X davet edilse de dönmez');
   const seen=await wait(B,n=>{const f=(G.feds||[]).find(f=>f.members.includes(0));return f&&f.members.length===n;},r.members.length,20000).then(()=>true).catch(()=>false);
   M.a2.guestSeen=seen;assert.equal(seen,true,'B aynası üyelik değişimini gördü');await settle('a2');});

 await test('A3 gizlilik: misafir aynasında AI iç siyaset alanları (_fedLeft, _fedReformAsk, _fedStrain, aiFedReason) yok',async()=>{
   for(const p of [B,C]){const leak=await p.evaluate(()=>G.emps.filter(e=>e&&('_fedLeft' in e||'_fedReformAsk' in e||'_fedStrain' in e||'aiFedReason' in e)).map(e=>e.id));
     assert.deepEqual(leak,[],'sızıntı yok');}
   M.a3={ok:true};});
};
