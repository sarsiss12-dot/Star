'use strict';
/* SAHA-GÜVENCE.1 — SG senaryosu (MP8_SCEN=SG): host + B (misafir, gerçek STARS arayüzü, ayrı Chromium). Yerel relay + TLS vekili; fiziksel cihaz / Render DEĞİL.
   G1 insan–insan Savaşa Yardım: B (misafir) host'un AI X'e karşı savaşına katılmayı teklif eder, 300 alaşım ister (gerçek masa düğmeleri);
      host kartı gerçek gelen kutusundan açar ve KABUL'e dokunur → B savaşta, 300 alaşım host'tan bir kez düşer B'ye bir kez eklenir; B'nin aynası
      savaşı ve kaynağı görür; aynı kayıt ikinci kez kabul edilemez, ödeme tekrar etmez.
   G2 misafirin filosu eskortsuz kalıp muharebede yok olur → misafirin bildirim listesinde YENİLGİ + "silahsız gemi … eskortu kalmayınca" (host günlüğü değil).
   G3 sistemin açtığı (önerensiz) federasyon temel yasa oyu: misafirde kart + gelen kutusu kaydı; misafir KABUL'e dokunur → host oyu kaydeder. */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,tap,settle}=X;
 const M=metrics.sg1={};const H=pg.H,B=pg.B;const EB=await B.evaluate(()=>MP1Join.empireId);
 const lid=real=>B.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});   /* Diplomasi paneli modal değil (#diploPane): kart şeridini örter */
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};

 await test('G0 fikstür (host): AI X host\'a savaş açar; B host\'un müttefiki, X ile savaşta değil; kaynaklar',async()=>{
   M.fx=await H.evaluate(b=>{MP1Host.host.local({kind:'speed',value:0});const H=G.p,Bx=G.emps[b],Xe=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);
     for(const a of [H,Bx,Xe])for(const c of [H,Bx,Xe])if(a!==c){a.contact[c.id]=true;a.ally[c.id]=false;a.war[c.id]=false;a.rel[c.id]=60;if(a.nap)delete a.nap[c.id];if(a.peaceAt)delete a.peaceAt[c.id];}
     H.ally[b]=Bx.ally[0]=true;H.rel[b]=Bx.rel[0]=90;for(const e of [H,Bx])for(const k of ['min','ene','ala','etk'])e.res[k]=3000;
     warAuthorize(Xe,H,{n:'Test'});declareWar(Xe,H);warAuthClear();MP1Host.host.publish();return {X:Xe.id,front:warLedgerFind(Xe.id,0).id};},EB);
   await settle('g0');assert.ok(Number.isInteger(M.fx.front));});

 await test('G1 B gerçek masadan "Savaşa Yardım Teklif Et" + 300 alaşım İSTE → host gelen kutusundan KABUL → tek ödeme, B savaşta, B aynası görür; ikinci kabul yok',async()=>{
   const host=await lid(0);await closeAll(B);await B.evaluate(o=>UI.act('deal',o),host);await sleep(500);
   await tap(B,'[data-a="dealHelp"]');
   const row=await wait(B,()=>!!document.querySelector('.dealHelp [data-a="dealHelpPick"]:not([disabled])'),undefined,15000).then(()=>true).catch(()=>false);
   assert.equal(row,true,'host\'un savaşı katılınabilir satır');await tap(B,'.dealHelp [data-a="dealHelpPick"]');
   await B.evaluate(()=>{UI.deal.want.push({t:'res',r:'ala',v:300});UI.drawDeal();});await shot(B,'g1-yardim-teklifi');
   const before=await H.evaluate(([b,x])=>({h:G.p.res.ala,b:G.emps[b].res.ala,war:!!G.emps[b].war[x]}),[EB,M.fx.X]);
   await tap(B,'[data-a="dealSend"]');
   const id=await H.waitForFunction(b=>{const o=MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===0&&o.status==='pending'&&o.give.some(i=>i.t==='warJoin'));return o?o.id:0;},EB,{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await closeAll(H);await H.evaluate(()=>MP71Dip.sync());await H.waitForFunction(id=>G.inbox.some(n=>n.key==='mp71:'+id),id,{timeout:15000});
   const uid=await H.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,id);await hit(H,'[data-a="openNote"][data-x="'+uid+'"]');await shot(H,'g1-host-kart');await hit(H,'#inboxYes');
   await H.waitForFunction(([b,x])=>!!G.emps[b].war[x],[EB,M.fx.X],{timeout:15000});
   const after=await H.evaluate(([b,x])=>({h:G.p.res.ala,b:G.emps[b].res.ala,war:!!G.emps[b].war[x],side:warLedgerFind(x,0).sides}),[EB,M.fx.X]);
   const Xl=await lid(M.fx.X);const seen=await wait(B,x=>!!G.p.war[x],Xl,20000).then(()=>true).catch(()=>false);
   const dup=await H.evaluate(id=>MP1Host.host.local({kind:'respond',offer:id,action:'accept'}),id);
   const after2=await H.evaluate(b=>({h:G.p.res.ala,b:G.emps[b].res.ala}),EB);M.g1={before,after,after2,dup:dup&&(dup.why||dup.code||dup.ok),guestSeesWar:seen};
   await shot(B,'g1-misafir-savasta');
   assert.equal(before.war,false);assert.equal(after.war,true,'B savaşa girdi');assert.equal(Math.round(before.h-after.h),300,'host bir kez öder');assert.equal(Math.round(after.b-before.b),300,'B bir kez alır');
   assert.equal(seen,true,'misafir aynasında savaş');assert.notEqual(dup&&dup.ok,true,'ikinci kabul yok');assert.equal(after2.h,after.h);assert.equal(after2.b,after.b);});

 await test('G2 misafirin eskortsuz ordusu muharebede yok olur → misafirin bildirim listesinde YENİLGİ + eskortsuz imha açıklaması',async()=>{
   const sid=await H.evaluate(([b,x])=>{const Bx=G.emps[b],Xe=G.emps[x];const S=G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col)&&!G.fleets.some(f=>f.sys===s.id));
     newFleet(Bx,S.id,[{c:'kor'}].concat([...Array(6)].map(()=>({c:'ord'}))),'G2 ordu');newFleet(Xe,S.id,[...Array(8)].map(()=>({c:'zir'})),'G2 X');if(!S.seen.includes(b))S.seen.push(b);
     for(let d=0;d<4;d++){G.day+=.5;dailyTick(.5);}MP1Host.host.publish();return S.id;},[EB,M.fx.X]);
   const ok=await wait(B,()=>(G.log||[]).some(l=>/YENİLGİ — .* muharebesi/.test(l.m)&&/eskortu kalmayınca/.test(l.m)),undefined,20000).then(()=>true).catch(()=>false);
   M.g2={sys:sid,log:await B.evaluate(()=>(G.log||[]).slice(-4).map(l=>l.m)),hostLog:await H.evaluate(()=>(G.log||[]).slice(-6).map(l=>l.m).filter(m=>/eskortu/.test(m)))};
   await shot(B,'g2-misafir-yenilgi');assert.equal(ok,true,'misafir YENİLGİ bildirimi: '+JSON.stringify(M.g2.log));assert.deepEqual(M.g2.hostLog,[],'host günlüğüne değil');});

 await test('G3 sistemin açtığı federasyon oyu: misafirde kart + gelen kutusu; misafir KABUL → host oyu kaydeder',async()=>{
   const f=await H.evaluate(b=>{const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide).slice(1,3);const mem=[ais[0].id,0,b,ais[1].id];
     for(const a of mem)for(const c of mem)if(a!==c){G.emps[a].ally[c]=true;G.emps[a].war[c]=false;}
     G.feds=(G.feds||[]).filter(x=>!x.members.some(m=>mem.includes(m)));const id=(G.fedUid=(G.fedUid||800)+1);
     G.feds.push({id,name:'Test Birliği',type:'ticaret',members:mem,leader:ais[0].id,laws:{},treasury:0,nextVote:G.day+60,cohesion:70});const F=G.feds.at(-1);
     const r=startFedVote(F);MP1Host.host.publish();return {id,ok:r&&r.ok,proposer:F.vote?F.vote.proposer:null,token:F.vote?fedVoteToken(F.vote):null};},EB);
   assert.equal(f.ok,true,'oy açıldı');
   const card=await wait(B,()=>(G.inbox||[]).some(n=>n.kind==='fedvote')&&DiplomaticInbox.state().records.some(r=>r.kind==='fedvote'&&r.status==='pending'),undefined,20000).then(()=>true).catch(()=>false);
   await shot(B,'g3-misafir-oy-karti');assert.equal(card,true,'misafirde oy kartı + kayıt');
   await closeAll(B);const uid=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').uid);await hit(B,'[data-a="openNote"][data-x="'+uid+'"]');await hit(B,'#inboxYes');
   const voted=await H.waitForFunction(([id,b])=>{const F=fedOf(id);return !F||!F.vote||F.vote.votes&&F.vote.votes[b]!==undefined||!fedVoteCounts(F).waiting.includes(b);},[f.id,EB],{timeout:20000}).then(()=>true).catch(()=>false);
   M.g3={...f,voted};assert.equal(voted,true,'host misafirin oyunu kaydetti');});
};
