'use strict';
/* BETA-EVENT-UX.0 — çok oyunculu federasyon / Konsey olay kartları (browser-mp8 MP8_SCEN=E: host + 2 misafir, ayrı Chromium, üretim relay
   süreci + TLS vekili, gerçek STARS misafir arayüzü, gerçek dokunma).
   FİKSTÜR (açıkça, host'ta): insan devletleri ve iki AI arasında temas; B + iki AI'dan oluşan federasyon (host ve C üye DEĞİL);
   host + B + C + AI'lardan oluşan Konsey. Sonraki her adım motorun kendi işlevi (proposeFedLaw, castFedVote, startCouncilVote) ya da
   misafirin gerçek kart düğmesidir. Bu yerel Chromium'dur; gerçek Render / fiziksel cihaz DEĞİLDİR. */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors}){
  const H=pg.H,B=pg.B,C=pg.C,M=metrics.eux={};
  const seats=await H.evaluate(()=>[...MP1Host.host.state.players.values()].filter(p=>p.playerId!=='host').sort((a,b)=>a.seat-b.seat).map(p=>p.empireId));
  const [eB,eC]=seats;M.seats={B:eB,C:eC};
  const synced=async(p)=>{await H.evaluate(()=>MP1Host.host.publish());await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!MP6Stars.S.timer,undefined,{timeout:30000,polling:150}).catch(()=>{});};
  const both=async()=>{await synced(B);await synced(C);};
  const cards=(p)=>p.evaluate(()=>({inbox:G.inbox.filter(n=>!n.hidden).map(n=>({kind:n.kind,key:n.key,uid:n.uid})),info:[...document.querySelectorAll('#inbox .nInfo')].map(e=>e.textContent.replace(/\s+/g,' ').trim())}));
  const p0=(p)=>p.evaluate(()=>({note:MP6Stars.S.sync.note,crash:MP6Stars.S.stats.crash||0,applied:MP6Stars.S.appliedRev===MP6Stars.S.rev,fail:MP6Stars.S.stats.fail||0}));

  await test('E1 fikstür: B + 2 AI federasyonu (host ve C üye değil), AI başkanın gerçek yasa önerisi → B\'nin üst çubuğunda "Federasyon oylaması" kartı (hızlı EVET / HAYIR); C\'de ve host\'ta kart yok',async()=>{
    const r=await H.evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});
      const ai=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).slice(0,2).map(e=>e.id),all=[0,b,c,...ai];
      for(const e of G.emps)if(all.includes(e.id))for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],3000);
      for(const a of all)for(const x of all)if(a!==x){G.emps[a].contact[x]=true;G.emps[a].rel[x]=60;}
      const F={id:100,name:'EUX Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:ai[0],founder:ai[0],members:[ai[0],ai[1],b],laws:{},fund:{ala:0,ene:0},treasury:0,
        founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
      G.feds=[F];G.fedUid=100;for(const a of F.members)for(const x of F.members)if(a!==x)G.emps[a].ally[x]=true;fedNormalize(F);for(const id of all)recalcMods(G.emps[id]);
      const ks=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)],k=ks.find(k=>canFedLaw(G.emps[F.leader],k,false).ok);if(!k)return {why:'öneri yok'};proposeFedLaw(G.emps[F.leader],k);
      MP1Host.host.publish();return {ai,k,tok:F.vote&&fedVoteToken(F.vote),wait:F.vote&&fedVoteCounts(F).waiting};},[eB,eC]);
    M.fed=r;assert(r.tok&&r.wait.includes(eB),'fikstür: B\'yi bekleyen oylama '+JSON.stringify(r));
    await both();await B.waitForFunction(()=>G.inbox.some(n=>n.kind==='fedvote'),undefined,{timeout:20000,polling:200});
    const b=await cards(B),c=await cards(C),h=await H.evaluate(()=>G.inbox.filter(n=>n.kind==='fedvote').length);
    M.e1={b,c,h};assert.equal(b.inbox.filter(n=>n.kind==='fedvote').length,1,'B\'de tek oy kartı');
    assert.equal(c.inbox.filter(n=>n.kind==='fedvote').length,0,'üye olmayan C\'de kart yok');assert.equal(h,0,'üye olmayan host\'ta kart yok');
    assert.equal(await B.locator('#inbox [data-a="noteQuick"][data-x$=":y"]').count(),1,'B kartında hızlı EVET');
    await shot(B,'e1-b-fedvote-card');
    /* ayna yeniden kurulumlarında tekil (yeni ayna → kart tekrar doğmaz) */
    for(let i=0;i<3;i++){await H.evaluate(()=>{G.day+=1;MP1Host.host.publish();});await synced(B);}
    assert.equal((await cards(B)).inbox.filter(n=>n.kind==='fedvote').length,1,'yeniden kurulumda tekil');});

  await test('E2 B karttan hızlı EVET (gerçek dokunma) → host castFedVote tam bir kez; bekleme durumu görünür; çift dokunma ikinci komut göndermez; oy verilince kart düşer',async()=>{
    const sent0=await B.evaluate(()=>{window.__euxSay=[];const s0=window.say;window.say=function(m,c){window.__euxSay.push(String(m));return s0.apply(this,arguments);};return MP6Stars.S.stats.sent.fedVote|0;});
    await tap(B,'#inbox [data-a="noteQuick"][data-x$=":y"]');
    const wait1=await B.waitForFunction(()=>{const t=document.querySelector('#inbox .nqWait');return t?t.textContent:(!G.inbox.some(n=>n.kind==='fedvote')?'(kart kalktı)':false);},undefined,{timeout:3000,polling:50}).then(h=>h.jsonValue(),()=>'');
    await B.evaluate(()=>{const it=G.inbox.find(n=>n.kind==='fedvote');if(it)UI.noteQuickAct(it.uid+':y');});   // ikinci dokunma (aynı kart)
    await H.waitForFunction(b=>{const F=G.feds[0];return (F.vote?F.vote.yes:(F.lastVote?.yesMembers||[])).includes(b);},eB,{timeout:20000,polling:150});
    const yes=await H.evaluate(b=>{const F=G.feds[0];return (F.vote?F.vote.yes:(F.lastVote?.yesMembers||[])).filter(x=>x===b).length;},eB);
    const sent=await B.evaluate(()=>MP6Stars.S.stats.sent.fedVote|0);
    await both();await B.waitForFunction(()=>!G.inbox.some(n=>n.kind==='fedvote'),undefined,{timeout:20000,polling:200});
    M.e2={wait1,yes,sent:sent-sent0};assert.equal(yes,1,'host\'ta tam bir oy');assert.equal(sent-sent0,1,'tek komut');const said=await B.evaluate(()=>window.__euxSay);M.e2.said=said;assert(/bekleniyor/.test(wait1)||said.some(m=>/yanıt bekleniyor/.test(m)),'bekleme durumu görünür: '+wait1+' '+JSON.stringify(said));
    assert.deepEqual(await p0(B),{note:'',crash:0,applied:true,fail:0},'P0: misafir eşitlemesi sağlam');});

  await test('E3 oylama sonuçlanınca (AI üyeler motorla oy verir) B\'de "Federasyon oylaması sonuçlandı" bilgi kartı; C\'de yok; host hızı değişmez; kart tekil, ayna yenilemesi / yeniden bağlanma yeniden doğurmaz; dokununca federasyon paneli',async()=>{
    await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));const spd0=await H.evaluate(()=>({g:G.speed|0,want:MP1Host.pause?MP1Host.pause.state().want:null}));
    await H.evaluate(()=>{const F=G.feds[0];if(F.vote){const t=fedVoteToken(F.vote);for(const id of fedVoteCounts(F).waiting)if(G.emps[id].ai)castFedVote(G.emps[id],F.id,t,true);if(F.vote)finishFedVote(F);}MP1Host.host.publish();});
    await both();await B.waitForFunction(()=>[...document.querySelectorAll('#inbox .nInfo')].some(e=>/oylaması sonuçlandı/.test(e.textContent)),undefined,{timeout:20000,polling:200});
    const spd1=await H.evaluate(()=>({g:G.speed|0,want:MP1Host.pause?MP1Host.pause.state().want:null}));
    const b=await cards(B),c=await cards(C);M.e3={b:b.info,c:c.info,spd0,spd1};
    assert.equal(b.info.filter(t=>/oylaması sonuçlandı/.test(t)).length,1,'B\'de tek sonuç kartı');assert.equal(c.info.filter(t=>/EUX|oylaması sonuçlandı/.test(t)).length,0,'C\'de kart yok (gizlilik)');
    assert.deepEqual(spd1,spd0,'bilgi kartı host hızını değiştirmez');
    await shot(B,'e3-b-fed-result-card');
    for(let i=0;i<3;i++){await H.evaluate(()=>MP1Host.host.publish());await sleep(800);}
    assert.equal((await cards(B)).info.filter(t=>/oylaması sonuçlandı/.test(t)).length,1,'ayna yenilemesinde tekil');
    await lanes.B.down();await sleep(2500);await lanes.B.up();
    await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP6Stars.S.appliedRev===MP6Stars.S.rev,undefined,{timeout:40000,polling:250});
    assert.equal((await cards(B)).info.filter(t=>/oylaması sonuçlandı/.test(t)).length,1,'yeniden bağlanmada tekil');
    await H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
    await B.locator('#inbox .nInfo').filter({hasText:'oylaması sonuçlandı'}).first().tap();await sleep(500);
    M.e3open=await B.evaluate(()=>({diplo:document.getElementById('diploPane').classList.contains('show'),fed:!!document.querySelector('#diploPane .fedBox'),left:document.querySelectorAll('#inbox .nInfo').length}));
    assert(M.e3open.diplo,'federasyon paneli açıldı '+JSON.stringify(M.e3open));await B.evaluate(()=>UI.act('closeFed'));});

  await test('E4 Konsey: host + B + C + AI üyeler; gerçek startCouncilVote → host, B ve C\'de "KONSEY OYLAMASI" kartı; C karttan HAYIR, B karttan EVET (gerçek dokunma) → host castCouncilVote tam bir kez; sonuçlanınca kamu "Konsey kararı" bilgi kartı herkeste',async()=>{
    const r=await H.evaluate(([b,c])=>{G.cfg.council='acik';const ai=G.feds[0].members.filter(x=>x!==b);
      G.council={name:'EUX Konseyi',founder:ai[0],members:[0,b,c,...ai],laws:{},targeted:{},treasury:0,president:ai[0],termStart:G.day,terms:{[ai[0]]:1},voteIn:30,vote:null,dead:false};
      startCouncilVote();MP1Host.host.publish();const v=G.council.vote;return v&&{key:v.key,done:v.done,yes:v.yes,no:v.no};},[eB,eC]);
    M.cnc=r;assert(r&&!r.done&&![eB,eC].some(x=>r.yes.includes(x)||r.no.includes(x)),'fikstür: insanları bekleyen oylama '+JSON.stringify(r));
    await both();for(const p of [B,C])await p.waitForFunction(()=>G.inbox.some(n=>n.kind==='cncvote'),undefined,{timeout:20000,polling:200});
    assert.equal(await H.evaluate(()=>G.inbox.filter(n=>n.kind==='cncvote').length),1,'host\'ta kart');
    const uB=await B.evaluate(()=>G.inbox.find(n=>n.kind==='cncvote').uid),uC=await C.evaluate(()=>G.inbox.find(n=>n.kind==='cncvote').uid);
    await shot(C,'e4-c-council-card');
    await tap(C,'#inbox [data-a="noteQuick"][data-x="'+uC+':n"]');await tap(B,'#inbox [data-a="noteQuick"][data-x="'+uB+':y"]');
    await H.waitForFunction(([b,c])=>{const v=G.council.vote||G.council.lastVote;return v&&v.yes.includes(b)&&v.no.includes(c);},[eB,eC],{timeout:20000,polling:150});
    const counts=await H.evaluate(([b,c])=>{const v=G.council.vote||G.council.lastVote;return {b:v.yes.filter(x=>x===b).length+v.no.filter(x=>x===b).length,c:v.yes.filter(x=>x===c).length+v.no.filter(x=>x===c).length};},[eB,eC]);
    assert.deepEqual(counts,{b:1,c:1},'her insan tam bir oy');
    /* host da kendi kartından oy verir → oylama sonuçlanır (motor insanları bekler) */
    const uH=await H.evaluate(()=>{UI.closeModal();UI.drawInbox();const n=G.inbox.find(n=>n.kind==='cncvote');return n&&n.uid;});
    if(uH){await H.waitForTimeout(400);await tap(H,'#inbox [data-a="noteQuick"][data-x="'+uH+':y"]');}
    await H.waitForFunction(()=>!G.council.vote||G.council.vote.done,undefined,{timeout:20000,polling:150}).catch(()=>{});
    const done=await H.evaluate(()=>({open:!!(G.council.vote&&!G.council.vote.done),last:G.council.lastVote&&{passed:G.council.lastVote.passed,key:G.council.lastVote.eventKey}}));M.e4={counts,done};
    await both();
    if(!done.open){for(const p of [B,C])await p.waitForFunction(()=>[...document.querySelectorAll('#inbox .nInfo')].some(e=>/Konsey kararı/.test(e.textContent)),undefined,{timeout:20000,polling:200});}
    for(const p of [B,C])assert.equal(await p.evaluate(()=>G.inbox.filter(n=>n.kind==='cncvote').length),0,'oy verilen kart kalmaz');
    M.e4.info={B:(await cards(B)).info,C:(await cards(C)).info};await shot(B,'e4-b-council-result');
    assert(!done.open,'oylama sonuçlandı '+JSON.stringify(done));});

  await test('E5 P0 koruması: olaylar sonrasında misafir dünyası güncel, eşitleme notu yok, kurulum istisnası yok; misafir gemi emri host ACK\'iyle sıraya girer; sayfa hatası yok',async()=>{
    for(const p of [B,C])assert.deepEqual(await p0(p),{note:'',crash:0,applied:true,fail:0});
    const r=await B.evaluate(async()=>{const y=G.sys.find(s=>s.owner===0&&hasYard(s));if(!y)return {skip:'tersane yok'};const q0=(y.queue||[]).length,n=MP1Join.results.length;const c=MP1Join.cmd({kind:'ship',sys:y.id,key:'kor'});
      const t=Date.now();while(!MP1Join.results.some(x=>x.cid===c.cid)&&Date.now()-t<10000)await new Promise(r=>setTimeout(r,100));const res=MP1Join.results.find(x=>x.cid===c.cid);return {y:y.id,q0,status:res&&res.status};});
    M.e5=r;if(!r.skip){assert.equal(r.status,'ok');await synced(B);assert(await B.evaluate(a=>(G.sys[a.y].queue||[]).length>a.q0,r),'sıra misafir aynasında');}
    assert.deepEqual(errors,[],'sayfa hataları');});
  fs.writeFileSync(path.join(out,'event-ux0-mp.json'),JSON.stringify(M,null,1));
};
