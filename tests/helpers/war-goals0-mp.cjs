'use strict';
/* BETA-WAR-GOALS.0 — browser-mp8 MP8_SCEN=W: host + 1 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili), gerçek STARS misafir arayüzü,
   gerçek dokunma. Yerel Chromium; fiziksel cihaz / gerçek internet / Render DEĞİL.
   W1 misafir B gerçek ilişki sayfasında SAVAŞ HEDEFİ SEÇ → iki hedef (Fetih / Vasallaştırma) → Fetih sistem seçimi → ÖNİZLEME (host warQuote: meşruiyet,
      tutum) → ONAYLA; host'ta v2 Fetih kaydı ve seçilen hedefler; dokunma anında yerel savaş yok (kabul host ACK'iyle).
   W2 B gerçek müzakere masasında "Teslim iste: Akademik" → TESLİM ÖNİZLEMESİ (kapanan / süren cepheler) → TEKLİFİ SUN; AI host'ta motorun aiRespond'u
      ile karar verir; kabulde vasallık + cephe kapanır; aynı komut çerçevesi yeniden gönderilince ikinci teklif / devir yok.
   W3 B gerçek koloni (sistem) panelinden OTOMATİK İNŞAAT GEMİSİ düğmesi → host remoteAuto → B'nin İNŞ gemisi atanır; panel güncel aynada görevi gösterir.
   FİKSTÜR (açıkça): host B'ye ve hedef AI'ya başkent çevresinden en çok 4 boş sistem verir, temas/keşif açar; W2 öncesi hedefin yorgunluğu 95, B'ye
   güçlü filo ve hedef başkentte kuşatma filoları (teslim baskısı); hedefin sistemlerinde B'nin gözcü filoları (misafirin kendi sensör gözlemi); W3 öncesi B'ye bir İNŞ gemisi ve bol kaynak. Zaman host'ta hız 0. */
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors}){
  const H=pg.H,B=pg.B,M=metrics.warGoals={};
  const eB=await B.evaluate(()=>MP1Join.empireId);
  const mrev=e=>H.evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&!p.mirrorTimer?p.mirrorRev:-1;},e);
  const synced=async(p,ms=30000)=>{await H.evaluate(()=>MP1Host.host.publish());const e=await p.evaluate(()=>MP1Join.empireId),t0=Date.now();
    for(;;){const r=await mrev(e);if(r>=0&&await p.evaluate(r=>MP6Stars.S.rev>=r&&MP6Stars.S.appliedRev===MP6Stars.S.rev,r))break;if(Date.now()-t0>ms)throw Error('ayna eşitlenmedi');await sleep(150);}
    await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!MP6Stars.S.timer&&!(MP6Stars.S.desync&&MP6Stars.S.desync.on),undefined,{timeout:ms,polling:150});};
  const X=await H.evaluate(b=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});G.feds=[];
    const x=G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&e.id!==b&&e.id!==0).id;
    for(const e of [G.emps[b],G.emps[x]]){for(const o of G.emps)if(o!==e&&!o.wild){e.contact[o.id]=o.contact[e.id]=true;e.ally[o.id]=o.ally[e.id]=false;e.war[o.id]=o.war[e.id]=false;}e.overlord=null;e.civics=[];e.res.etk=5000;}
    for(const s of G.sys)for(const e of [b,x])if(!s.seen.includes(e))s.seen.push(e);
    for(const id of [b,x]){const e=G.emps[id];const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],id);}
    G.emps[b].nap={};G.emps[x].nap={};for(const s of G.sys.filter(s=>s.owner===x))newFleet(G.emps[b],s.id,[{c:'kor'}],'Gözcü '+s.id);   /* FİKSTÜR: hedefin sistemlerini misafirin kendi sensörü görür */
    MP1Host.host.publish();return x;},eB);
  M.target=X;await synced(B);
  const clean=p=>p.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();});

  await test('W1 misafir gerçek SAVAŞ HEDEFİ SEÇ → Fetih → sistem seçimi → host önizlemesi (meşruiyet + tutum) → ONAYLA; host v2 Fetih kaydı, seçilen hedefler',async()=>{
    await clean(B);await B.evaluate(x=>UI.selectDiplo(x,'relation'),X);
    await B.waitForSelector(`[data-a="war"][data-x="${X}"]`,{state:'attached',timeout:15000});await B.evaluate(x=>{const d=document.querySelector(`[data-a="war"][data-x="${x}"]`).closest('details');if(d)d.open=true;},X);
    await tap(B,`[data-a="war"][data-x="${X}"]`);await B.waitForSelector(`#modal [data-a="setwg"][data-x="${X}:fetih"]`,{timeout:15000});
    const goals=await B.evaluate(()=>[...document.querySelectorAll('#modal [data-a="setwg"]')].map(b=>b.dataset.x.split(':')[1]));M.menu=goals;assert.deepEqual(goals,['fetih','boyun'],'Savaş İlan Et yalnız iki hedef sunar');
    await tap(B,`#modal [data-a="setwg"][data-x="${X}:fetih"]`);await B.waitForSelector('#modal [data-a="wgGo"]',{timeout:15000});
    const picked=await B.evaluate(()=>UI._wgSel.targets.slice());assert.ok(picked.length>=1,'varsayılan hedefler');
    await tap(B,'#modal [data-a="wgGo"]');await B.waitForSelector('#warFinalConfirm',{timeout:20000});
    const pv=await B.locator('#modal').innerText();M.preview=pv.slice(0,1200);assert.match(pv,/GEREKÇELER VE MEŞRUİYET/);assert.match(pv,/TAHMİNİ TUTUMLAR/);assert.match(pv,/HEDEF: FETİH/);
    await shot(B,'w1-onizleme');const localWar0=await B.evaluate(x=>!!G.p.war[x],X);
    await tap(B,'#warFinalConfirm');
    await wait(H,([b,x])=>!!G.emps[b].war[x],[eB,X],20000);const hw=await H.evaluate(([b,x])=>G.emps[b].wg[x],[eB,X]);M.W1={goal:hw,picked};
    assert.equal(localWar0,false);assert.equal(hw.t,'fetih');assert.equal(hw.v,2);assert.deepEqual(hw.targets,picked,'host misafirin seçtiği hedefleri kaydetti');
    await synced(B);assert.equal(await B.evaluate(x=>!!G.p.war[x],X),true,'misafir güncel aynada savaşı görür');});

  let frame=null;
  await test('W2 misafir gerçek müzakere masasında "Teslim iste" (Akademik) → TESLİM ÖNİZLEMESİ → TEKLİFİ SUN; AI motorun aiRespond\'u ile karar verir; kabulde vasallık + cephe kapanır; çerçeve tekrarı ikinci teklif üretmez',async()=>{
    await H.evaluate(([b,x])=>{const X=G.emps[x];X.exh=X.exh||{};X.exh[b]=95;for(let i=0;i<20;i++)newFleet(G.emps[b],G.emps[b].home,[{c:'kor'},{c:'kor'},{c:'muh'}]);for(let i=0;i<4;i++)newFleet(G.emps[b],X.home,[{c:'kor'},{c:'kor'},{c:'muh'}]);G.emps[b]._powAt=-1;X._powAt=-1;MP1Host.host.publish();},[eB,X]);await clean(B);await synced(B);
    await clean(B);await B.evaluate(x=>UI.openDeal(x),X);await B.waitForSelector('[data-a="dealVassal"][data-x="want:akademik"]',{timeout:15000});
    await tap(B,'[data-a="dealVassal"][data-x="want:akademik"]');await B.waitForFunction(()=>/TESLİM ÖNİZLEMESİ/.test(document.getElementById('diploPane').innerText),undefined,{timeout:10000});
    const box=await B.evaluate(()=>[...document.querySelectorAll('#diploPane .box')].map(b=>b.innerText).find(t=>/TESLİM ÖNİZLEMESİ/.test(t))||'');M.W2box=box.slice(0,600);assert.match(box,/Kapanan cepheler/);await shot(B,'w2-teslim-onizleme');
    await B.evaluate(()=>{const ws=MP1Join.ws,o=ws.send.bind(ws);window.__wf=[];ws.send=t=>{try{const m=JSON.parse(t);if(m.type==='cmd'&&m.cmd&&m.cmd.kind==='offer')window.__wf.push(t);}catch{}return o(t);};});
    const off0=await H.evaluate(()=>MP1Host.host.dip.offers.length);
    await tap(B,'[data-a="dealSend"]');
    await wait(H,n=>MP1Host.host.dip.offers.length>n,off0,20000);
    const r=await H.evaluate(([b,x])=>{const o=MP1Host.host.dip.offers.at(-1);return {status:o.status,why:o.why||'',overlord:G.emps[x].overlord,war:!!(G.emps[b].war[x]||G.emps[x].war[b])};},[eB,X]);M.W2=r;
    assert.ok(['accepted','rejected','countered','pending'].includes(r.status),JSON.stringify(r));
    if(r.status==='accepted'){assert.equal(r.overlord,eB,'vasallık kuruldu');assert.equal(r.war,false,'cephe kapandı');}
    frame=await B.evaluate(()=>window.__wf[0]||null);assert.ok(frame,'gerçek komut çerçevesi');
    const n1=await H.evaluate(()=>MP1Host.host.dip.offers.length);await B.evaluate(f=>MP1Join.ws.send(f),frame);await sleep(1500);
    const n2=await H.evaluate(()=>MP1Host.host.dip.offers.length);assert.equal(n2,n1,'aynı çerçeve ikinci teklif üretmez');
    await clean(B);await B.evaluate(()=>{try{UI.act('closeDiplo');}catch{}});await synced(B);M.W2.guestSees=await B.evaluate(x=>({overlord:G.emps[x].overlord,war:!!G.p.war[x]}),X);});

  await test('W3 misafir gerçek koloni panelinden OTOMATİK İNŞAAT GEMİSİ → host remoteAuto; misafirin İNŞ gemisi atanır; güncel aynada panel görevi gösterir',async()=>{
    const key=await H.evaluate(b=>{const e=G.emps[b],T=G.sys[e.home];for(const k of Object.keys(e.res))e.res[k]=99999;e.insReady=true;G.fleets=G.fleets.filter(f=>!(f.e===b&&f.ships.some(s=>s.c==='ins')));
      newFleet(e,T.id,[{c:'ins'}],'İnş W3');MP1Host.host.publish();return Object.keys(STRUCTS).find(k=>structAllowed(e,T,k)&&k!=='kapi');},eB);
    assert.ok(key,'uygun yapı');await clean(B);await B.evaluate(()=>{try{UI.act('closeDiplo');}catch{}});await synced(B);
    const home=await B.evaluate(()=>{try{UI.act('closeDiplo');}catch{}View.sel=null;View.selSys=G.sys[G.p.home];UI.tab('sistem');UI.refresh();return G.p.home;});
    const sel=`#panel [data-a="autoBuild"][data-x="${home}:${key}"]`;await B.waitForSelector(sel,{timeout:15000});await shot(B,'w3-panel-once');
    await tap(B,sel);
    await wait(H,b=>Object.values(RemoteConstruction.state().queues).flat().some(t=>t.empire===b&&t.auto),eB,20000);
    const t=await H.evaluate(b=>{const t=Object.values(RemoteConstruction.state().queues).flat().find(t=>t.empire===b&&t.auto);return {key:t.key,fleet:G.fleets.find(f=>f.id===t.fleet)?.name,state:t.state,auto:t.auto};},eB);M.W3=t;
    assert.equal(t.key,key);assert.equal(t.fleet,'İnş W3');
    await synced(B);await B.evaluate(()=>{UI.tab('sistem');UI.refresh();});await B.waitForSelector('#panel .autoTask',{timeout:15000});
    const txt=await B.locator('#panel .autoTask').first().innerText();M.W3.panel=txt.slice(0,200);await shot(B,'w3-panel-gorev');assert.match(txt,/İnş W3|tahmini varış|İnşa/);});
};
