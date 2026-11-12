'use strict';
/* BETA-EVENT-UX.1 — tarihsel "FEDERASYON KURULDU tekrar tekrar çıkıyor / eski karar kartı takılı kalıyor" senaryosu (browser-mp8 MP8_SCEN=F:
   host + 2 misafir, ayrı Chromium, üretim relay süreci + TLS vekili, gerçek STARS misafir arayüzü, gerçek dokunma).
   Akış: host gerçek kuruluş penceresinden B'yi davet eder → B karttan davet penceresini açıp KABUL → host son onay → federasyon kurulur.
   Sonra: B sonuç kartını açıp kapatır (görüldü), 5 yayın + gün ilerlemesi, B'nin hattı kopup bağlanır, B sayfası yenilenir, host dünyası
   kayıttan yeniden yüklenir (serialize → deserialize), sonunda AYNI federasyonda gerçekten yeni bir yasa oylaması açılıp sonuçlanır.
   Her aşamada B, C (üye değil) ve host'ta görünür "kuruldu" kartları, kapanmış oy kartları ve yeni kartlar sayılır.
   FİKSTÜR (açıkça): host ile B arasında temas + ittifak, etki; önceki federasyon / kuruluş kayıtları temiz. Yerel Chromium; Render DEĞİL. */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors,origin,guestGo,getCode}){
  const H=pg.H,M=metrics.ux1={phases:[]};let B=pg.B;const C=pg.C;
  const count=p=>p.evaluate(()=>({kur:G.inbox.filter(n=>!n.hidden&&n.kind==='fedfoundResult').length+[...document.querySelectorAll('#inbox .nInfo')].filter(e=>/kuruldu/i.test(e.textContent)).length,
    dom:[...document.querySelectorAll('#inbox .nCard')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,70)),
    staleVote:G.inbox.filter(n=>n.kind==='fedvote'&&!(fedOf(n.data)?.vote&&fedVoteCounts(fedOf(n.data)).waiting.includes(G.p.id))).length,
    staleFound:G.inbox.filter(n=>n.kind==='fedfound').length,records:DiplomaticInbox.state().records.filter(r=>r.kind==='fedfoundResult').length}));
  const synced=async p=>{await H.evaluate(()=>MP1Host.host.publish());await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!MP6Stars.S.timer,undefined,{timeout:30000,polling:150}).catch(()=>{});await sleep(400);await p.evaluate(()=>{try{UI.drawInbox();}catch{}});};
  const phase=async(name)=>{await synced(B);await synced(C);await H.evaluate(()=>{UI.drawInbox();});const row={name,B:await count(B),C:await count(C),H:await count(H)};M.phases.push(row);console.log('  '+name+' '+JSON.stringify({B:row.B.kur,Bstale:row.B.staleVote+row.B.staleFound,C:row.C.kur,H:row.H.kur}));return row;};

  await test('F1 gerçek kuruluş: host kuruluş penceresinden B\'yi davet eder, B karttan KABUL, host son onay → federasyon; B\'de ve host\'ta "kuruldu" en çok bir kez',async()=>{
    await H.evaluate(()=>{UI.closeModal();MP1Host.host.local({kind:'speed',value:0});G.feds=[];delete G.fedFounding;G.diplomaticInbox=DiplomaticInbox.empty();G.inbox=[];
      for(const e of G.emps){e.overlord=null;e._fedLeaveUntil=0;e.res.etk=10000;}const a=0,b=1;G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].ally[b]=G.emps[b].ally[a]=true;G.emps[a].war[b]=G.emps[b].war[a]=false;
      MP1Host.host.publish();UI.openFed();});
    await B.waitForFunction(()=>!findFed(G.p)&&!G.fedFounding,undefined,{timeout:20000});
    await tap(H,'[data-a="fedFoundType"][data-x="bilimsel"]');await tap(H,'[data-a="fedFoundSelect"][data-x="1"]');await tap(H,'[data-a="fedFoundStart"]');
    await H.waitForFunction(()=>G.fedFounding?.proposals.length===1,undefined,{timeout:15000});await B.waitForFunction(()=>G.inbox.some(n=>n.kind==='fedfound'),undefined,{timeout:20000});
    if(await B.locator('#diploPane').evaluate(e=>e.classList.contains('show')))await B.evaluate(()=>UI.act('closeDiplo'));
    const uid=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedfound').uid);await tap(B,'#inbox [data-a="openNote"][data-x="'+uid+'"]');await tap(B,'#inboxYes');await B.evaluate(()=>UI.closeModal());
    await H.waitForFunction(()=>Object.values(fedFoundGet(1).replies).every(r=>r.status==='accepted'),undefined,{timeout:20000});
    await H.evaluate(()=>UI.openFed());await tap(H,'[data-a="fedFoundFinish"][data-x="1"]');await H.waitForFunction(()=>G.feds.length===1,undefined,{timeout:15000});
    await H.evaluate(()=>UI.act('closeFed'));await B.waitForFunction(()=>!!findFed(G.p),undefined,{timeout:20000});
    const r=await phase('a-kuruldu');await shot(B,'f1-b-founded');
    assert(r.B.kur<=1&&r.H.kur<=1,'en çok bir kuruldu kartı');assert.equal(r.C.kur,0,'üye olmayan C\'de yok');assert.equal(r.B.staleFound,0,'davet kartı kalmadı');});

  await test('F2 B sonuç kartını açıp kapatır; ardından 5 yayın + gün, hat kopması / yeniden bağlanma, sayfa yenileme, host dünyasının kayıttan yeniden yüklenmesi: "kuruldu" ve eski davet / oy kartı bir daha doğmaz',async()=>{
    const open=await B.evaluate(()=>{const n=G.inbox.find(n=>!n.hidden&&n.kind==='fedfoundResult');if(n)return {k:'note',uid:n.uid};const i=[...document.querySelectorAll('#inbox .nInfo')].find(e=>/kuruldu/i.test(e.textContent));return i?{k:'info',x:i.dataset.x}:null;});
    M.opened=open;
    if(open&&open.k==='note'){await tap(B,'#inbox [data-a="openNote"][data-x="'+open.uid+'"]');await sleep(300);await B.evaluate(()=>UI.closeModal());}
    else if(open)await tap(B,'#inbox [data-a="instNote"][data-x="'+open.x+'"]'),await sleep(300),await B.evaluate(()=>{UI.closeModal();try{UI.act('closeFed');}catch{}});
    const H0=await H.evaluate(()=>{const n=G.inbox.find(n=>!n.hidden&&n.kind==='fedfoundResult');return n?n.uid:null;});if(H0!==null){await H.evaluate(u=>{UI.openNote(u);UI.closeModal();},H0);}
    const rows=[];rows.push(await phase('b-acildi'));
    for(let i=0;i<5;i++){await H.evaluate(()=>{G.day+=3;MP1Host.host.publish();});await sleep(500);}rows.push(await phase('c-5-yayin'));
    await lanes.B.down();await sleep(2500);await lanes.B.up();await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP6Stars.S.appliedRev===MP6Stars.S.rev,undefined,{timeout:40000,polling:250});
    rows.push(await phase('d-yeniden-baglanma'));
    const code=await H.evaluate(()=>MP1Host.code);await B.goto(origin.B+'/mp/play?code='+code);
    await B.waitForFunction(()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await sleep(1500);
    rows.push(await phase('e-sayfa-yenileme'));
    await H.evaluate(()=>{const s=serialize();UI.closeModal();if(!deserialize(s))throw Error('reload');G.speed=0;MP1Host.host.publish();UI.refresh();});await sleep(1500);
    rows.push(await phase('f-host-kayit-yukleme'));await shot(B,'f2-b-after-reload');
    for(const r of rows){assert.equal(r.B.kur,0,r.name+': B\'de kuruldu kartı yeniden doğdu '+JSON.stringify(r.B.dom));assert.equal(r.B.staleVote+r.B.staleFound,0,r.name+': takılı kart '+JSON.stringify(r.B.dom));
      assert.equal(r.H.kur,0,r.name+': host\'ta yeniden doğdu '+JSON.stringify(r.H.dom));assert.equal(r.C.kur,0,r.name+': C');}});

  await test('F3 aynı federasyonda gerçekten yeni karar: host yasa önerir → B\'de tek yeni oy kartı; B karttan EVET; sonuçlanınca B ve host\'ta tek "oylaması sonuçlandı" kartı; "kuruldu" yine yok; kapanmış oy kartı kalmaz',async()=>{
    const k=await H.evaluate(()=>{const F=G.feds[0],ks=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)],k=ks.find(k=>canFedLaw(G.p,k,false).ok);if(!k)return null;proposeFedLaw(G.p,k);UI.closeModal();MP1Host.host.publish();return {k,tok:F.vote&&fedVoteToken(F.vote)};});
    assert(k&&k.tok,'fikstür: yeni oylama '+JSON.stringify(k));
    await B.waitForFunction(()=>G.inbox.filter(n=>n.kind==='fedvote').length===1,undefined,{timeout:20000});
    const uid=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').uid);
    await B.waitForFunction(u=>document.querySelector('#inbox [data-a="noteQuick"][data-x="'+u+':y"]'),uid,{timeout:15000}).catch(async e=>{M.f3diag=await B.evaluate(u=>{const it=G.inbox.find(n=>n.uid===u);return {it:it&&{key:it.key,hidden:it.hidden},rec:UI.noteRecord(it)&&{s:UI.noteRecord(it).status,w:UI.noteRecord(it)._mpWait},recs:DiplomaticInbox.state().records.filter(r=>r.kind==='fedvote').map(r=>({k:r.key,s:r.status,nk:r.note&&r.note.key})),html:document.getElementById('inbox').innerHTML.slice(0,1500),modal:!document.getElementById('modal').classList.contains('hidden'),defer:UI._deferInbox,ptr:UI._surfacePointers&&UI._surfacePointers.size};},uid);fs.writeFileSync(path.join(out,'event-ux1-mp.json'),JSON.stringify(M,null,1));throw e;});
    await tap(B,'#inbox [data-a="noteQuick"][data-x="'+uid+':y"]');
    await H.waitForFunction(()=>{const F=G.feds[0];return !F.vote||F.vote.yes.includes(1);},undefined,{timeout:20000});
    await H.evaluate(()=>{const F=G.feds[0];if(F.vote){const t=fedVoteToken(F.vote);if(fedVoteCounts(F).waiting.includes(0))castFedVote(G.p,F.id,t,true);if(F.vote)finishFedVote(F);}UI.closeModal();MP1Host.host.publish();});
    await B.waitForFunction(()=>[...document.querySelectorAll('#inbox .nInfo')].some(e=>/oylaması sonuçlandı/.test(e.textContent)),undefined,{timeout:20000});
    const r=await phase('g-yeni-karar');await shot(B,'f3-b-new-result');
    const res=x=>x.dom.filter(t=>/oylaması sonuçlandı/.test(t)).length;
    assert.equal(res(r.B),1,'B tek sonuç kartı');assert.equal(res(r.H),1,'host tek sonuç kartı');assert.equal(r.B.kur+r.H.kur,0,'kuruldu yok');assert.equal(r.B.staleVote,0,'kapanmış oy kartı yok');
    assert.deepEqual(errors,[],'sayfa hataları');});
  await test('F4 üyelik başvurusu (C, gerçek fedRequest komutu): C\'de "Üyelik başvurun oylamada" kartı; üye B\'nin oy kartı "Üyelik başvurusu — C"; oy kabul → C\'de KABUL / REDDET davet kartı; C karttan KABUL → host\'ta üye; kart kalkar; C\'de tek komut',async()=>{
    const eC=await H.evaluate(()=>[...MP1Host.host.state.players.values()].filter(p=>p.playerId!=='host').sort((a,b)=>a.seat-b.seat)[1].empireId);
    await H.evaluate(c=>{const F=G.feds[0];G.emps[c].res.etk=5000;for(const id of F.members){G.emps[c].contact[id]=G.emps[id].contact[c]=true;G.emps[c].rel[id]=G.emps[id].rel[c]=60;}MP1Host.host.publish();},eC);
    await synced(C);const res=await C.evaluate(async()=>{const r=MP1Join.cmd({kind:'fedRequest',via:0});const t=Date.now();while(!MP1Join.results.some(x=>x.cid===r.cid)&&Date.now()-t<10000)await new Promise(q=>setTimeout(q,100));const x=MP1Join.results.find(x=>x.cid===r.cid);return x&&{status:x.status,code:x.code,detail:x.detail};});
    M.f4req=res;assert.equal(res&&res.status,'ok','başvuru komutu '+JSON.stringify(res));
    await synced(B);await synced(C);
    await C.waitForFunction(()=>[...document.querySelectorAll('#inbox .nInfo')].some(e=>/Üyelik başvurun/.test(e.textContent)),undefined,{timeout:20000});
    await B.waitForFunction(()=>G.inbox.some(n=>n.kind==='fedvote'&&/Üyelik başvurusu/.test(n.sub)),undefined,{timeout:20000});
    const sub=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').sub),cName=await H.evaluate(c=>G.emps[c].name,eC);
    M.f4sub=sub;await shot(B,'f4-b-admit-card');await shot(C,'f4-c-applied-card');
    const uid=await B.evaluate(()=>G.inbox.find(n=>n.kind==='fedvote').uid);await B.waitForFunction(u=>document.querySelector('#inbox [data-a="noteQuick"][data-x="'+u+':y"]'),uid,{timeout:15000});
    await tap(B,'#inbox [data-a="noteQuick"][data-x="'+uid+':y"]');
    await H.waitForFunction(()=>{const F=G.feds[0];return !F.vote||F.vote.yes.includes(1);},undefined,{timeout:20000});
    await H.evaluate(()=>{const F=G.feds[0];if(F.vote){const t=fedVoteToken(F.vote);if(fedVoteCounts(F).waiting.includes(0))castFedVote(G.p,F.id,t,true);if(F.vote)finishFedVote(F);}UI.closeModal();MP1Host.host.publish();});
    const inv=await H.evaluate(c=>!!(G.feds[0].invites||{})[c],eC);M.f4inv=inv;assert(inv,'oy kabul → C\'ye davet');
    await synced(C);await C.waitForFunction(()=>document.querySelector('#inbox [data-a="instDecide"][data-x$=":y"]'),undefined,{timeout:20000});await shot(C,'f4-c-invite-card');
    const sent0=await C.evaluate(()=>MP6Stars.S.stats.sent.fedReply|0);
    await tap(C,'#inbox [data-a="instDecide"][data-x$=":y"]');await C.evaluate(()=>{const b=document.querySelector('#inbox [data-a="instDecide"][data-x$=":y"]');if(b)UI.act('instDecide',b.dataset.x);});
    await H.waitForFunction(c=>G.feds[0].members.includes(c),eC,{timeout:20000});await synced(C);
    await C.waitForFunction(()=>!document.querySelector('#inbox [data-a="instDecide"]'),undefined,{timeout:20000});
    const sent=await C.evaluate(()=>MP6Stars.S.stats.sent.fedReply|0);M.f4sent=sent-sent0;
    assert.equal(sub,'Üyelik başvurusu — '+cName);assert.equal(sent-sent0,1,'tek fedReply komutu');});

  await test('F5 başkan değişimi: host (başkan) federasyondan ayrılır (gerçek leaveFederation) → B ve C\'de tek "Federasyon başkanı değişti" kartı; yeniden bağlanmada tekrar doğmaz',async()=>{
    await H.evaluate(()=>{G.day+=1;leaveFederation(G.p);MP1Host.host.publish();});
    for(const p of [B,C]){await synced(p);await p.waitForFunction(()=>[...document.querySelectorAll('#inbox .nInfo')].some(e=>/Federasyon başkanı değişti/.test(e.textContent)),undefined,{timeout:20000});}
    const n=p=>p.evaluate(()=>[...document.querySelectorAll('#inbox .nInfo')].filter(e=>/Federasyon başkanı değişti/.test(e.textContent)).length);
    assert.equal(await n(B),1);assert.equal(await n(C),1);await shot(C,'f5-c-leader-card');
    await lanes.C.down();await sleep(2500);await lanes.C.up();await C.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP6Stars.S.appliedRev===MP6Stars.S.rev,undefined,{timeout:40000,polling:250});
    await synced(C);assert.equal(await n(C),1,'yeniden bağlanmada tekil');
    for(const p of [B,C])assert.deepEqual(await p.evaluate(()=>({note:MP6Stars.S.sync.note,crash:MP6Stars.S.stats.crash||0,fail:MP6Stars.S.stats.fail||0})),{note:'',crash:0,fail:0},'P0 eşitleme sağlam');
    assert.deepEqual(errors,[],'sayfa hataları');});
  fs.writeFileSync(path.join(out,'event-ux1-mp.json'),JSON.stringify(M,null,1));
};
