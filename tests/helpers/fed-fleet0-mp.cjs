'use strict';
/* BETA-FED-FLEET.0 — browser-mp8 MP8_SCEN=L: host + 2 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili, oyuncu başına kesilebilir hat),
   gerçek STARS misafir arayüzü, gerçek dokunma. Yerel Chromium; fiziksel cihaz / gerçek internet / Render DEĞİL.
   L1 misafir B (federasyon başkanı) kendi ana sistem panelinde FEDERAL SİPARİŞ düğmesini ve ortak fonu görür; üye olmayan misafir C fonu / defteri görmez.
   L2 B gerçek düğmeye dokunur → host'ta tek federal iş, bedel ortak fondan bir kez; B dokunduğu anda yerel dünyasını değiştirmez (kabul host ACK'i ve
      güncel aynayla gelir); B'nin kuyruğunda FEDERAL satırı.
   L3 aynı komut çerçevesi hat kopup bağlandıktan sonra yeniden gönderilir (yeniden bağlanma / çift gönderim) → ikinci ödeme ve ikinci iş yok;
      aynı ay yeni komut "ayda bir" ile reddedilir.
   L4 iş gerçek dailyTick ile tamamlanır → TEK federal gemi B'nin (o anki başkan) federal filosu olarak çıkar; B güncel aynada görür.
   L5 başkanlık host'a geçer (B'nin aynası henüz eski): B'nin gerçek düğme dokunuşu host'ta İŞLEM ANINDA reddedilir; fon ve kuyruk değişmez.
   FİKSTÜR (açıkça): host (0) ile B arasında askerî federasyon, başkan B, ortak fon 3000 alaşım + 3000 enerji doğrudan atanır; C ile temas
   (federasyonu görür ama üye değil); B'nin ana sisteminde tersane. Zaman host'ta doğrudan G.day / dailyTick ile ilerletilir (hız 0). */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors}){
  const H=pg.H,B=pg.B,C=pg.C,M=metrics.fedFleet={};
  const eB=await B.evaluate(()=>MP1Join.empireId),eC=await C.evaluate(()=>MP1Join.empireId);
  /* host aynası 700 ms'ye kadar ertelenir: misafirin uyguladığı revizyon host'un O misafir için son ayna revizyonuna ulaşana dek beklenir */
  const mrev=e=>H.evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&!p.mirrorTimer?p.mirrorRev:-1;},e);
  const synced=async(p,ms=30000)=>{await H.evaluate(()=>MP1Host.host.publish());const e=await p.evaluate(()=>MP1Join.empireId),t0=Date.now();
    for(;;){const r=await mrev(e);if(r>=0&&await p.evaluate(r=>MP6Stars.S.rev>=r&&MP6Stars.S.appliedRev===MP6Stars.S.rev,r))break;if(Date.now()-t0>ms)throw Error('ayna eşitlenmedi');await sleep(150);}
    await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!MP6Stars.S.timer&&!(MP6Stars.S.desync&&MP6Stars.S.desync.on),undefined,{timeout:ms,polling:150});};
  const hostFed=()=>H.evaluate(()=>{const f=G.feds.find(x=>x.name==='Filo Testi');const o=[];for(const s of G.sys)for(const q of s.queue)if(q.fed===f.id)o.push({sys:s.id,cls:q.cls,e:q.e,left:q.left,paid:q.fedPaid});
    return {id:f.id,leader:f.leader,fund:{...f.fund},orders:o,fleets:G.fleets.filter(x=>x.federal&&x.fedId===f.id).map(x=>({id:x.id,e:x.e,n:x.ships.length,c:x.ships.map(s=>s.c)})),dup:MP1Host.host.stats.duplicate|0};});
  const home=await H.evaluate(e=>G.emps[e].home,eB);
  const openSys=p=>p.evaluate(h=>{try{UI.closeModal();}catch{}try{UI.act('closeDiplo');}catch{}View.sel=null;View.selSys=G.sys[h];UI.tab('sistem');UI.refresh();},home);
  const btn='#panel [data-a="fedShip"][data-x="'+home+':kor"]';
  const lastRes=(p,kind)=>p.evaluate(()=>MP1Join.results.slice(-1)[0]||null);
  await H.evaluate(({b,c})=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});G.feds=[];delete G.fedFounding;
    for(const e of G.emps){e.overlord=null;e._fedLeaveUntil=0;}
    const ms=[0,b];for(const x of ms)for(const y of ms)if(x!==y){G.emps[x].ally[y]=true;G.emps[x].contact[y]=true;G.emps[x].war[y]=false;G.emps[x].rel[y]=60;}
    for(const x of [0,b])for(const y of [c]){G.emps[x].contact[y]=G.emps[y].contact[x]=true;G.emps[x].war[y]=G.emps[y].war[x]=false;}
    const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Filo Testi',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal'},politicsVersion:96,leader:b,founder:b,members:ms.slice(),laws:{},treasury:0,fund:{ala:3000,ene:3000},
      nextVote:G.day+400,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:80};
    G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};
    const s=G.sys[G.emps[b].home];if(!hasYard(s)){const p=s.planets.find(p=>p.owner===b&&p.col);p.col.b.tersane=(p.col.b.tersane||0)+1;}
    G.day=Math.floor(G.day/30)*30+2;MP1Host.host.publish();},{b:eB,c:eC});
  await synced(B);await synced(C);

  await test('L1 misafir başkan B gerçek sistem panelinde FEDERAL SİPARİŞ + gerçek ortak fonu görür; üye olmayan C fonu / defteri / düğmeyi görmez',async()=>{
    await openSys(B);await B.waitForSelector(btn,{timeout:15000});
    const b=await B.evaluate(sel=>{const f=findFed(G.p);return {leader:f.leader,fund:{...f.fund},view:f.fundView||null,info:(document.getElementById('fedOrderInfo')||{}).textContent||'',disabled:document.querySelector(sel).disabled};},btn);
    const h=await hostFed();M.L1={B:b,host:h.fund};
    assert.equal(b.leader,0,'misafir kendini başkan görür (π)');assert.deepEqual(b.fund,h.fund,'üye gerçek bakiyeyi görür');assert.ok(b.view&&b.view.cap===8,'üye × 4 sınırı defterde');
    assert.match(b.info,/3000 alaşım/);assert.equal(b.disabled,false);
    const c=await C.evaluate(()=>{const f=G.feds.find(x=>x.name==='Filo Testi');return f?{fund:f.fund,view:f.fundView||null,contrib:f.contrib||null,member:f.members.includes(0)}:null;});M.L1.C=c;
    if(c){assert.deepEqual(c.fund,{ala:0,ene:0},'üye olmayana fon gitmez');assert.equal(c.view,null);assert.equal(c.contrib,null);assert.equal(c.member,false);}
    assert.equal(await C.evaluate(()=>document.querySelectorAll('[data-a="fedShip"]').length),0,'C\'de federal sipariş düğmesi yok');
    await shot(B,'l1-b-federal-siparis');});

  let frame=null;
  await test('L2 B gerçek FEDERAL SİPARİŞ düğmesine dokunur → host tersane kuyruğunda TEK federal iş, bedel ortak fondan bir kez; dokunma anında yerel etki yok, kabul host ACK\'i + güncel aynada',async()=>{
    const h0=await hostFed(),cost=await H.evaluate(()=>fedShipCost('kor').ala),r0=await H.evaluate(e=>G.emps[e].res.ala,eB);
    await B.evaluate(()=>{const ws=MP1Join.ws,o=ws.send.bind(ws);window.__fedFrames=[];ws.send=t=>{try{const m=JSON.parse(t);if(m.type==='cmd'&&m.cmd&&m.cmd.kind==='fedShip')window.__fedFrames.push(t);}catch{}return o(t);};});
    const local0=await B.evaluate(h=>({q:G.sys[h].queue.length,fund:findFed(G.p).fund.ala}),home);
    await tap(B,btn);
    const localNow=await B.evaluate(h=>({q:G.sys[h].queue.length,fund:findFed(G.p).fund.ala}),home);
    await wait(H,()=>{const f=G.feds.find(x=>x.name==='Filo Testi');return G.sys.some(s=>s.queue.some(q=>q.fed===f.id));},undefined,20000);
    const h1=await hostFed();frame=await B.evaluate(()=>window.__fedFrames[0]||null);
    await B.waitForFunction(()=>MP1Join.results.some(r=>r.status==='ok'),undefined,{timeout:15000});await synced(B);
    const b1=await B.evaluate(h=>({q:G.sys[h].queue.filter(q=>q.fed!==undefined).map(q=>({e:q.e,cls:q.cls,ala:q.fedPaid.ala})),fund:findFed(G.p).fund.ala,row:[...document.querySelectorAll('#panel *')].some(e=>/FEDERAL/.test(e.textContent)&&/ortak fondan/.test(e.textContent)),btn:(document.querySelector('#panel [data-a="fedShip"]')||{}).disabled}),home);
    M.L2={cost,h0:h0.fund,h1:h1.fund,orders:h1.orders,local0,localNow,B:b1,frame:!!frame};
    assert.equal(h1.orders.length,1,'host kuyruğunda tek federal iş');assert.equal(h1.orders[0].e,eB);assert.equal(h1.orders[0].sys,home);
    assert.equal(h1.fund.ala,h0.fund.ala-cost,'bedel fondan bir kez');assert.equal(await H.evaluate(e=>G.emps[e].res.ala,eB),r0,'B\'nin kişisel alaşımı değişmez');
    assert.deepEqual(localNow,local0,'misafir dokunma anında yerel dünyayı değiştirmez');
    assert.equal(b1.q.length,1);assert.equal(b1.q[0].e,0);assert.equal(b1.fund,h1.fund.ala,'güncel aynada fon');assert.equal(b1.row,true,'kuyrukta FEDERAL satırı');assert.equal(b1.btn,true,'bu ay hakkı kullanıldı → düğme kapalı');
    assert.ok(frame,'gerçek düğmenin komut çerçevesi yakalandı');await shot(B,'l2-b-federal-kuyruk');});

  await test('L3 B\'nin hattı kopup bağlanır, AYNI komut çerçevesi yeniden gönderilir → ikinci ödeme / ikinci iş yok; aynı ay yeni komut reddedilir',async()=>{
    const h0=await hostFed();await lanes.B.down();await sleep(4000);await lanes.B.up();
    await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,{timeout:40000,polling:200});await synced(B);
    const n0=await B.evaluate(()=>MP1Join.results.length);
    await B.evaluate(t=>MP1Join.ws.send(t),frame);
    await B.waitForFunction(n=>MP1Join.results.length>n,n0,{timeout:15000,polling:100});const dup=await B.evaluate(()=>MP1Join.results.slice(-1)[0]);
    const r=await B.evaluate(h=>new Promise(res=>{const c=MP1Join.cmd({kind:'fedShip',sys:h,key:'kor'});const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===c.cid);if(x){clearInterval(t);res(x);}},50);}),home);
    const h1=await hostFed();M.L3={dup,again:r,h0:h0.fund,h1:h1.fund,orders:h1.orders.length,dupStat:[h0.dup,h1.dup]};
    assert.equal(dup.dup,1,'host aynı komut kimliğini tanır (önbellekteki sonuç)');assert.equal(dup.status,'ok');
    assert.notEqual(r.status,'ok');assert.match(String(r.detail),/bu ay/i);
    assert.deepEqual(h1.fund,h0.fund,'ikinci ödeme yok');assert.equal(h1.orders.length,1,'ikinci iş yok');});

  await test('L4 iş gerçek dailyTick ile tamamlanır → tek federal gemi, B\'nin (başkan) federal filosu; ödeme bir kez; B güncel aynada federal filoyu görür',async()=>{
    const h0=await hostFed();
    const n=await H.evaluate(()=>{const f=G.feds.find(x=>x.name==='Filo Testi');let n=0;for(const s of G.sys)for(const q of s.queue)if(q.fed===f.id)n=Math.max(n,Math.ceil(q.left)+1);
      const ft=f.fund;for(let i=0;i<n;i++){G.day+=1;dailyTick(1);}MP1Host.host.publish();return n;});
    const h1=await hostFed();await synced(B);
    const b=await B.evaluate(()=>G.fleets.filter(f=>f.federal).map(f=>({e:f.e,n:f.ships.length,c:f.ships[0].c})));
    M.L4={days:n,h0:h0.fund,h1:h1.fund,fleets:h1.fleets,B:b};
    assert.equal(h1.orders.length,0,'iş kuyruktan kalktı');assert.equal(h1.fleets.length,1,'tek federal filo');assert.equal(h1.fleets[0].e,eB);assert.deepEqual(h1.fleets[0].c,['kor']);
    assert.ok(h1.fund.ala<=h0.fund.ala+1e-9,'tamamlanmada iade / ikinci tahsil yok (yalnız aylık bakım düşebilir)');
    assert.equal(b.length,1);assert.equal(b[0].e,0,'B kendi federal filosunu görür');await shot(B,'l4-b-federal-filo');});

  await test('L5 başkanlık host\'a geçer (B\'nin aynası henüz eski): B\'nin gerçek düğme dokunuşu host\'ta işlem anında reddedilir; fon ve kuyruk değişmez',async()=>{
    await H.evaluate(()=>{G.day=(Math.floor(G.day/30)+1)*30+1;MP1Host.host.publish();});await synced(B);await openSys(B);await B.waitForSelector(btn+':not([disabled])',{timeout:15000});
    const h0=await hostFed();await H.evaluate(()=>{const f=G.feds.find(x=>x.name==='Filo Testi');f.leader=0;});
    const n0=await B.evaluate(()=>MP1Join.results.length);await tap(B,btn);
    await B.waitForFunction(n=>MP1Join.results.length>n,n0,{timeout:15000,polling:100});const r=await B.evaluate(()=>MP1Join.results.slice(-1)[0]);
    const h1=await hostFed();await synced(B);const b=await B.evaluate(()=>({leader:findFed(G.p).leader,btn:document.querySelectorAll('[data-a="fedShip"]').length}));
    M.L5={res:r,h0:h0.fund,h1:h1.fund,orders:[h0.orders.length,h1.orders.length],B:b};
    assert.notEqual(r.status,'ok');assert.equal(r.code,'rules:fed');assert.match(String(r.detail),/başkan/i);
    assert.deepEqual(h1.fund,h0.fund);assert.equal(h1.orders.length,h0.orders.length);assert.notEqual(b.leader,0,'güncel aynada başkan değişti');
    await openSys(B);assert.equal(await B.evaluate(()=>document.querySelectorAll('[data-a="fedShip"]').length),0,'eski başkanda düğme yok');
    const hostOk=await H.evaluate(()=>{const t=serialize();return {save:validSaveEnvelope(JSON.parse(t)),pkg:StarsMP.validatePackage(JSON.stringify(MP1Host.host.snapshot({}).pkg)).ok};});M.L5.hostOk=hostOk;
    assert.equal(hostOk.save,true,'host Save8 geçerli');
    await shot(B,'l5-b-eski-baskan');});
  fs.writeFileSync(path.join(out,'fed-fleet0.json'),JSON.stringify(M,null,1));
};
