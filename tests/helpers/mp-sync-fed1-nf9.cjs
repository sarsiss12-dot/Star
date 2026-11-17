'use strict';
/* MP-SYNC-FED.1 — M senaryosu: NF-9 federasyon savunma çağrısı gerçek STARS arayüzünde (host + B + C üyeler, D federasyon dışı; ayrı Chromium profilleri).
   M1 fikstür: host / B / C federasyonu (motorun kuruluş yolu), AI C'ye saldırır (C savunmada). B'nin aynasında C'nin savaşı YOK (gizlilik), D'de federasyon yok.
   M2 B federasyon penceresi → ASKERÎ sekmesi → "Savunma desteği talep et" (gerçek dokunuş) → host'ta acil savunma oyu; C'ye oy kartı, D'ye değil; ikinci dokunuş
      ikinci kuyruk / oy üretmez. p38'de B'nin panelinde bu düğme yoktu (eski ölçüt intelOf ≥3 / aynadaki savaş).
   M3 host'un kendi paneli aynı satırı "Oylanıyor" gösterir; D'nin görünümünde savunma çağrısı yok.
   M4 oy açıkken AI host'a saldırır → C kendi panelinden host'un savunması için talep açar → kuyruğa girer; B'nin panelinde "Gündem kuyruğunda · sıra 1". */
module.exports=async X=>{const {test,pg,metrics,sleep,shot,assert,wait,tap,settle}=X;
 const M=metrics.nf9={};const H=()=>pg.H;const E={};for(const n of ['B','C','D'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 const lid=(n,real)=>pg[n].evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const openMil=n=>pg[n].evaluate(()=>{try{UI.closeModal();}catch{}UI.openFed();UI.fedTab='military';UI.openFed();return document.getElementById('diploPane').classList.contains('show')&&UI.fedTab==='military';});
 const closeFed=n=>pg[n].evaluate(()=>{const b=document.querySelector('#diploPane [data-a="closeFed"]');if(b)b.click();else document.getElementById('diploPane').classList.remove('show');});
 const panel=n=>pg[n].evaluate(()=>{const m=document.getElementById('diploPane');return {calls:[...m.querySelectorAll('.fedDefCall')].map(c=>({front:+c.dataset.front,state:c.dataset.state,txt:c.innerText.slice(0,160),btn:!!c.querySelector('[data-a="fedMotion"]:not([disabled])')})),
   oldBtns:[...m.querySelectorAll('[data-a="fedMotion"]')].map(b=>b.dataset.x).filter(x=>/^joinWar:/.test(x))};});

 await test('M1 fikstür: host / B / C federasyonu, AI C\'ye saldırır; B aynasında C\'nin savaşı yok, D federasyonda değil',async()=>{
   M.fx=await H().evaluate(([b,c,d])=>{for(const e of G.emps){e.civics=e.civics||[];for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;}e.intel={};}
     for(const id of [0,b,c])for(const r of ['min','ene','ala','etk'])G.emps[id].res[r]=Math.max(G.emps[id].res[r],5000);
     G.feds=[];const pr=fedFoundPropose(G.p,'bilimsel','equal',[b,c]);if(!pr.ok)return {err:'propose '+pr.why};const pid=pr.id??pr.proposal?.id??1;
     fedFoundReply(G.emps[b],pid,true);fedFoundReply(G.emps[c],pid,true);const r=fedFoundFinish(G.p,pid);if(!r.ok)return {err:'finish '+r.why};const F=G.feds[0];
     const ai=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);const a=ai[0];for(const id of F.members)G.emps[id].ally[a.id]=a.ally[id]=false;
     warAuthorize(a,G.emps[c],{n:'Test dış saldırı'});declareWar(a,G.emps[c]);warAuthClear();MP1Host.host.publish();
     return {fid:F.id,members:F.members.slice(),attacker:a.id,front:warLedgerFind(a.id,c).id,other:ai[1].id,hostIntel:intelOf(G.p,c)};},[E.B,E.C,E.D]);
   assert(!M.fx.err,JSON.stringify(M.fx));await settle('m1');
   const bWar=await pg.B.evaluate(([c,a])=>!!G.emps[c].war[a],[await lid('B',E.C),await lid('B',M.fx.attacker)]);assert.equal(bWar,false,'B aynasında C–saldırgan savaşı yok');
   assert.equal(await pg.D.evaluate(()=>!!findFed(G.p)),false,'D federasyonda değil');});

 await test('M2 B gerçek dokunuşla "Savunma desteği talep et" → host\'ta acil savunma oyu; C\'ye oy kartı, D\'ye değil; ikinci dokunuş ikinci kuyruk / oy üretmez',async()=>{
   assert(await openMil('B'),'federasyon penceresi açık');
   /* açık ASKERÎ sekmesi yeni ayna kurulumundan sonra korunur mu (misafirde her kurulum yeni G.emps) */
   const b0=await pg.B.evaluate(()=>MP6Stars.S.stats.builds);await H().evaluate(()=>{G.day+=1;MP1Host.host.publish();});await wait(pg.B,b0=>MP6Stars.S.stats.builds>b0,b0,20000).catch(()=>{});await sleep(800);
   M.tabAfterRebuild=await pg.B.evaluate(()=>({tab:UI.fedTab,shown:document.getElementById('diploPane').classList.contains('show'),hasCalls:!!document.querySelector('#diploPane .fedDefCall')}));
   const pb=await panel('B');M.bPanel=pb;await shot(pg.B,'m2-b-savunma-cagrisi');
   const t=await lid('B',M.fx.attacker),s=await lid('B',E.C),x='joinWar:'+t+':'+s;
   assert(pb.calls.some(c=>c.front===M.fx.front&&c.state==='open'&&c.btn),'B panelinde açık savunma çağrısı ve etkin düğme: '+JSON.stringify(pb));
   const sel='#diploPane .fedDefCall [data-a="fedMotion"][data-x="'+x+'"]';await pg.B.locator(sel).scrollIntoViewIfNeeded();await tap(pg.B,sel);
   await wait(H(),f=>!!(G.feds[0].vote&&G.feds[0].vote.motion==='joinWar'&&G.feds[0].vote.defenseFront===f),M.fx.front,20000);
   const h0=await H().evaluate(()=>({tok:fedVoteToken(G.feds[0].vote),agenda:JSON.stringify(G.feds[0].agenda||null)}));
   await openMil('B');const again=await pg.B.locator(sel).count();M.secondTap={buttons:again};
   if(again)await tap(pg.B,sel);await sleep(2000);
   const h1=await H().evaluate(()=>({tok:fedVoteToken(G.feds[0].vote),agenda:JSON.stringify(G.feds[0].agenda||null)}));
   assert.deepEqual(h1,h0,'ikinci dokunuş ikinci kuyruk / oy üretmedi');await closeFed('B');await settle('m2');
   const cards=async n=>pg[n].evaluate(()=>G.inbox.filter(x=>x.kind==='fedvote').length);M.cards={C:await cards('C'),D:await cards('D')};
   assert(M.cards.C>=1,'C\'ye oy kartı');assert.equal(M.cards.D,0,'D\'ye oy kartı yok');});

 await test('M3 host paneli aynı satırı "Oylanıyor" gösterir; D\'nin görünümünde savunma çağrısı yok',async()=>{
   const hp=await H().evaluate(()=>{try{UI.closeModal();}catch{}UI.openFed();UI.fedTab='military';UI.openFed();const m=document.getElementById('diploPane');const r=[...m.querySelectorAll('.fedDefCall')].map(c=>({front:+c.dataset.front,state:c.dataset.state}));const b=m.querySelector('[data-a="closeFed"]');if(b)b.click();return r;});
   M.hostPanel=hp;assert(hp.some(c=>c.front===M.fx.front&&c.state==='voting'),'host: oylanıyor '+JSON.stringify(hp));
   const dv=await pg.D.evaluate(()=>{const v=MP1Join.game&&MP1Join.game.view;return JSON.stringify(v&&v.pol||{}).includes('defCalls');});assert.equal(dv,false,'D görünümünde defCalls yok');});

 await test('M4 oy açıkken AI host\'a saldırır → C kendi panelinden talep açar → kuyrukta; B panelinde "Gündem kuyruğunda · sıra 1"',async()=>{
   M.fx2=await H().evaluate(first=>{const F=G.feds[0];for(const a of G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&o.id!==first&&!F.members.includes(o.id))){for(const id of F.members){G.emps[id].ally[a.id]=a.ally[id]=false;if(G.emps[id].nap)delete G.emps[id].nap[a.id];if(a.nap)delete a.nap[id];if(a.peaceAt)delete a.peaceAt[id];}
     warAuthorize(a,G.p,{n:'Test dış saldırı'});declareWar(a,G.p);warAuthClear();const fr=warLedgerFind(a.id,0);if(fr){MP1Host.host.publish();return {front:fr.id,attacker:a.id};}}return {err:'saldırgan yok'};},M.fx.attacker);
   assert(!M.fx2.err,JSON.stringify(M.fx2));
   await settle('m4');assert(await openMil('C'),'C penceresi');const x='joinWar:'+(await lid('C',M.fx2.attacker))+':'+(await lid('C',0));const sel='#diploPane .fedDefCall [data-a="fedMotion"][data-x="'+x+'"]';
   await pg.C.locator(sel).scrollIntoViewIfNeeded();await tap(pg.C,sel);
   await wait(H(),f=>(G.feds[0].agenda?.items||[]).some(r=>r.defenseFront===f),M.fx2.front,20000);await closeFed('C');await settle('m4b');
   assert(await openMil('B'));const pb=await panel('B');M.bPanel2=pb;await shot(pg.B,'m4-b-kuyruk');await closeFed('B');
   assert(pb.calls.some(c=>c.front===M.fx.front&&c.state==='voting'),'ilk çağrı oylanıyor');assert(pb.calls.some(c=>c.front===M.fx2.front&&c.state==='queued'&&/sıra 1/.test(c.txt)),'ikinci çağrı sırada: '+JSON.stringify(pb.calls));});
};
