'use strict';
/* WAR-COALITION.0 — browser-mp8 MP8_SCEN=Q: host + 2 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili), gerçek STARS misafir arayüzü,
   gerçek dokunma. Yerel Chromium; fiziksel cihaz / gerçek internet / Render DEĞİL.
   Q1 misafir B (planlayan): ilişki sayfası → SAVAŞ → Fetih → tek savaş ilanı akışı; MÜTTEFİKLERİ ÇAĞIR'da insan C ve AI müttefik Y seçilir,
      "Davetleri Gönder (2)" ÇİFT dokunuş → host'ta tek hazırlık, C'ye tek teklif; Y karşı teklif verir (B hakkında sızmış istihbarat).
   Q2 misafir C (davet alan): gerçek gelen kutusu kartı (hedef, desteklenen taraf, amaç, başlangıç, son gün); C karşı teklif verir (MP1Join.cmd);
      B akışta C ve Y kartlarında "Kabul Et"; C, Y'nin teklifini ve B'nin hazırlığını göremez.
   Q3 B "2 Destekçiyle Savaş İlan Et" ÇİFT dokunuş → tek cephe, C ve Y savaşta, bedeller bir kez; C'nin aynasında savaş görünür.
   FİKSTÜR (açıkça): host'ta temas/keşif açılır, hedefe başkent çevresinden sistem verilir, B–C ve B–Y ittifakı, Y'ye B hakkında istihbarat, B'ye kaynak. */
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,wait,tap}){
  const H=pg.H,B=pg.B,C=pg.C,M=metrics.coalition={};
  const eB=await B.evaluate(()=>MP1Join.empireId),eC=await C.evaluate(()=>MP1Join.empireId);
  const mrev=e=>H.evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&!p.mirrorTimer?p.mirrorRev:-1;},e);
  const synced=async(p,ms=30000)=>{await H.evaluate(()=>MP1Host.host.publish());const e=await p.evaluate(()=>MP1Join.empireId),t0=Date.now();
    for(;;){const r=await mrev(e);if(r>=0&&await p.evaluate(r=>MP6Stars.S.rev>=r&&MP6Stars.S.appliedRev===MP6Stars.S.rev,r))break;if(Date.now()-t0>ms)throw Error('ayna eşitlenmedi');await sleep(150);}};
  const clean=p=>p.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();try{UI.act('closeDiplo');}catch{}});
  const fx=await H.evaluate(([b,c])=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});G.feds=[];
    const X=G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&![0,b,c].includes(e.id)),Y=G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&![0,b,c,X.id].includes(e.id));
    for(const e of G.emps){if(e.wild)continue;e.civics=[];e.overlord=null;e.res.etk=5000;for(const o of G.emps)if(o!==e&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=40;}}
    for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
    for(const e of [G.emps[b],X]){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
    for(const id of [c,Y.id]){G.emps[b].ally[id]=G.emps[id].ally[b]=true;G.emps[b].rel[id]=G.emps[id].rel[b]=90;}(Y.intel=Y.intel||{})[b]=3;
    for(const r of ['min','ene','ala','yiy','tuk'])G.emps[b].res[r]=4000;remember(X,b,'savasIlan');
    const gate=G.sys[X.home].lanes[0];for(let i=0;i<3;i++)newFleet(Y,gate,[{c:'kor'},{c:'kor'},{c:'muh'}]);for(let i=0;i<4;i++)newFleet(G.emps[b],G.emps[b].home,[{c:'kor'},{c:'kor'},{c:'muh'}]);   /* Y'nin hedefe erişimi ve B'nin gücü (AI katılım değerlendirmesi) */
    MP1Host.host.publish();return {X:X.id,Y:Y.id};},[eB,eC]);
  M.fixture={B:eB,C:eC,...fx};await synced(B);await synced(C);
  const nameOf=id=>H.evaluate(id=>G.emps[id].name,id);
  const XN=await nameOf(fx.X),YN=await nameOf(fx.Y),CN=await nameOf(eC),BN=await nameOf(eB);
  const lid=(p,name)=>p.evaluate(n=>G.emps.findIndex(e=>e&&e.name===n),name);
  const xB=await lid(B,XN),yB=await lid(B,YN),cB=await lid(B,CN);M.local={xB,yB,cB};

  await test('Q1 misafir B gerçek ilişki sayfasından SAVAŞ → Fetih → tek akış; C (insan) + Y (AI) seçilir; "Davetleri Gönder (2)" çift dokunuş → host\'ta tek hazırlık, C\'ye tek teklif; Y karşı teklif',async()=>{
    await clean(B);await B.evaluate(x=>UI.selectDiplo(x,'relation'),xB);
    await B.waitForSelector(`[data-a="war"][data-x="${xB}"]`,{state:'attached',timeout:15000});await B.evaluate(x=>{const d=document.querySelector(`[data-a="war"][data-x="${x}"]`).closest('details');if(d)d.open=true;},xB);
    await tap(B,`[data-a="war"][data-x="${xB}"]`);await B.waitForSelector(`#modal [data-a="setwg"][data-x="${xB}:fetih"]`,{timeout:15000});
    await tap(B,`#modal [data-a="setwg"][data-x="${xB}:fetih"]`);await B.waitForSelector('#modal [data-a="wgGo"]',{timeout:15000});await tap(B,'#modal [data-a="wgGo"]');
    await B.waitForSelector('#warCoalRoot .coalSummary',{timeout:20000});await shot(B,'q1-akis-acilis');
    await tap(B,'.coalAllies > summary');await B.waitForSelector(`[data-a="coalPick"][data-x="${cB}"]`,{timeout:10000});
    await B.evaluate(()=>{window.__coalActs=[];const o=WarCoal.act.bind(WarCoal);WarCoal.act=function(a,x){__coalActs.push(a+':'+x);return o(a,x);};});
    await tap(B,`[data-a="coalPick"][data-x="${cB}"]`);
    /* Y için "Şart ekle": 400 Alaşım (gerçek ±50 düğmeleri, klavye yok) */
    await tap(B,`[data-a="coalTerms"][data-x="${yB}"]`);for(let i=0;i<8;i++){await B.waitForSelector(`[data-a="coalAmt"][data-x="${yB}:ala:50"]`,{timeout:5000});await tap(B,`[data-a="coalAmt"][data-x="${yB}:ala:50"]`);}
    await tap(B,`[data-a="coalTermsDone"][data-x="${yB}"]`);
    M.Q1acts=await B.evaluate(()=>({acts:__coalActs,picks:WarCoal.st&&WarCoal.st.picks,st:!!WarCoal.st}));
    await B.waitForFunction(()=>/Davetleri Gönder \(2\)/.test(document.getElementById('coalSend')?.innerText||''),undefined,{timeout:5000}).catch(()=>{});   /* dokunuştan hemen sonra yüzey güncellemesi ~250 ms ertelenir (mevcut surfaceRender kuralı) */
    const lbl=await B.locator('#coalSend').innerText();assert.match(lbl,/Davetleri Gönder \(2\)/);
    const off0=await H.evaluate(()=>MP1Host.host.dip.offers.length);
    const btn=B.locator('#coalSend');await btn.scrollIntoViewIfNeeded();await btn.tap();await btn.tap({force:true,noWaitAfter:true}).catch(()=>{});
    await wait(H,([b,x])=>(G.warLedger.preparations||[]).some(p=>p.owner===b&&p.target===x&&(p.invites||[]).length>=2),[eB,fx.X],20000);
    await sleep(1500);
    const h=await H.evaluate(([b,x,c,y,n])=>{const ps=(G.warLedger.preparations||[]).filter(p=>p.owner===b&&p.target===x);const p=ps[0];return {preps:ps.length,opts:p.opts,inv:p.invites.map(v=>[v.member,v.state]),toC:MP1Host.host.dip.offers.slice(n).filter(o=>o.to===c).length};},[eB,fx.X,eC,fx.Y,off0]);
    M.Q1=h;assert.equal(h.preps,1,'tek hazırlık');assert.equal(h.toC,1,'C\'ye tek teklif');assert.ok(['accepted','countered'].includes(Object.fromEntries(h.inv)[fx.Y]),JSON.stringify(h));assert.equal(Object.fromEntries(h.inv)[eC],'pending');
    M.Q1.yTerms=await H.evaluate(([b,x,y])=>{const p=(G.warLedger.preparations||[]).find(p=>p.owner===b&&p.target===x),v=p.invites.find(v=>v.member===y);return v.terms&&v.terms.give;},[eB,fx.X,fx.Y]);
    await B.waitForFunction(([c,y])=>['countered','accepted'].includes(document.querySelector(`.coalCard[data-member="${y}"]`)?.dataset.state)&&document.querySelector(`.coalCard[data-member="${c}"]`)?.dataset.state==='pending',[cB,yB],{timeout:15000});
    await shot(B,'q1-davetler');});

  await test('Q2 misafir C gerçek gelen kutusu kartı (desteklenen taraf, hedef, amaç, başlangıç, son gün) → karşı teklif; B akışta C ve Y için "Kabul Et"; C, Y\'nin teklifini ve B\'nin hazırlığını görmez',async()=>{
    const off=await H.evaluate(([b,c])=>MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===c&&o.status==='pending').id,[eB,eC]);
    await synced(C);await wait(C,k=>(G.inbox||[]).some(n=>n.key===k),'mp71:'+off,20000);
    await C.evaluate(()=>{try{UI.drawInbox();}catch{}});await C.waitForFunction(n=>(document.getElementById('inbox')?.innerText||'').includes(n+' yanında'),BN,{timeout:10000}).catch(()=>{});
    M.cardDiag=await C.evaluate(k=>{const n=G.inbox.find(n=>n.key===k);let brief=null,err=null;try{brief=UI.diplomaticBrief(n);}catch(e){err=String(e&&e.stack||e).slice(0,400);}
      let draw=null;try{UI.drawInbox();}catch(e){draw=String(e&&e.stack||e).slice(0,400);}return {brief,err,draw,hidden:n.hidden,inboxHtml:(document.getElementById('inbox')?.innerHTML||'').slice(0,300),raw:typeof MP71Dip!=='undefined'&&MP71Dip.offerByKey?JSON.stringify(MP71Dip.offerByKey(k)).slice(0,400):null};},'mp71:'+off);
    const card=await C.evaluate(k=>{const n=G.inbox.find(n=>n.key===k);return [n.t,n.d,n.title,n.text,n.body].filter(Boolean).join(' | ')+' || '+(document.getElementById('inbox')?.innerText||'');},'mp71:'+off);M.card=card.slice(0,900);
    assert.match(card,new RegExp(BN+' yanında'));assert.match(card,new RegExp(XN));assert.match(card,/Fetih/);assert.match(card,/ilan ettiği anda başlar/);assert.match(card,/en geç gün \d+/);
    await shot(C,'q2-davet-karti');
    const plan=await H.evaluate(([b,x])=>(G.warLedger.preparations||[]).find(p=>p.owner===b&&p.target===x).id,[eB,fx.X]);
    const rd=await C.evaluate(()=>new Promise(r=>MP6Stars.warCenterRead(0,r)));assert.equal((rd.preparations||[]).some(p=>p.id===plan),false,'C, B\'nin hazırlığını görmez');
    const leak=await C.evaluate(y=>{const d=MP1Join.game?.view?.dip||{};return (d.offers||[]).filter(o=>o.from===y||o.to===y).length;},fx.Y);assert.equal(leak,0,'Y\'nin teklifi / kabulü C\'ye sızmaz');
    const r=await C.evaluate(([id,plan,x])=>new Promise(res=>{const c=MP1Join.cmd({kind:'counter',offer:id,give:[{t:'warJoin',plan,target:x}],want:[{t:'res',r:'min',v:150}]});if(!c.ok)return res(c);const t=setInterval(()=>{const r=MP1Join.results.find(r=>r.cid===c.cid);if(r){clearInterval(t);res(r);}},100);}),[off,plan,fx.X]);
    assert.equal(r.status,'ok',JSON.stringify(r));
    await B.evaluate(()=>WarCoal.load());await B.waitForFunction(c=>document.querySelector(`.coalCard[data-member="${c}"]`)?.dataset.state==='countered',cB,{timeout:20000});
    M.Q2={};await shot(B,'q2-karsi-teklifler');
    await tap(B,`[data-a="coalReply"][data-x="${cB}:accept"]`);await B.waitForFunction(c=>document.querySelector(`.coalCard[data-member="${c}"]`)?.dataset.state==='accepted',cB,{timeout:20000});
    if(await B.evaluate(y=>document.querySelector(`.coalCard[data-member="${y}"]`)?.dataset.state,yB)==='countered'){await tap(B,`[data-a="coalReply"][data-x="${yB}:accept"]`);M.Q2.yCounterAccepted=true;}
    await B.waitForFunction(y=>document.querySelector(`.coalCard[data-member="${y}"]`)?.dataset.state==='accepted',yB,{timeout:20000});
    await B.waitForFunction(()=>/2 Destekçiyle/.test(document.getElementById('warFinalConfirm')?.innerText||''),undefined,{timeout:8000}).catch(()=>{});
    const btn=await B.locator('#warFinalConfirm').innerText();M.Q2.button=btn;assert.match(btn,/2 Destekçiyle Savaş İlan Et/);await shot(B,'q2-son-onay');});

  await test('Q3 B "2 Destekçiyle Savaş İlan Et" çift dokunuş → tek cephe; C ve Y savaşta; Fetih seçimi ve bedeller bir kez; C\'nin aynasında savaş',async()=>{
    const res0=await H.evaluate(b=>({...G.emps[b].res}),eB);
    const btn=B.locator('#warFinalConfirm');await btn.scrollIntoViewIfNeeded();await btn.tap();await btn.tap({force:true,noWaitAfter:true}).catch(()=>{});
    await wait(H,([b,x])=>!!G.emps[b].war[x],[eB,fx.X],20000);await sleep(1500);
    const h=await H.evaluate(([b,x,c,y])=>({fronts:G.warLedger.fronts.filter(f=>f.sides.includes(b)&&f.sides.includes(x)).length,c:!!G.emps[c].war[x],y:!!G.emps[y].war[x],wg:G.emps[b].wg[x],res:{...G.emps[b].res},state:(G.warLedger.preparations||[]).find(p=>p.owner===b&&p.target===x).state}),[eB,fx.X,eC,fx.Y]);
    M.Q3={...h,spent:Object.fromEntries(Object.keys(res0).map(k=>[k,Math.round(res0[k]-h.res[k])]).filter(([,v])=>v))};
    assert.equal(h.fronts,1,'tek savaş');assert.equal(h.c,true);assert.equal(h.y,true);assert.equal(h.state,'launched');assert.equal(h.wg.t,'fetih');assert.equal(h.wg.v,2);
    assert.equal(M.Q3.spent.min,150,'C\'nin istediği 150 Mineral bir kez: '+JSON.stringify(M.Q3.spent));
    await synced(C);assert.equal(await C.evaluate(n=>{const x=G.emps.findIndex(e=>e&&e.name===n);return !!G.p.war[x];},XN),true,'C aynasında savaşı görür');await shot(B,'q3-ilan');});
};
