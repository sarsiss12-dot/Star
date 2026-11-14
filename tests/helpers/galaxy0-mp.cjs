'use strict';
/* BETA-GALAXY.0 — browser-mp8 MP8_SCEN=S: host + 1 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili, oyuncu başına kesilebilir hat).
   Oda: orta galaksi, KÜMELİ şekil, kolonileştirilebilir gezegen çarpanı 2×, 5 AI, tohum 22 (host'un gerçek configure yolu).
   S1 host galaksisi rota denetiminden geçmiş; misafir aynı koordinatları, bildiği sistemlerde aynı hatları ve gezegenleri alır.
   S2 hız mesajı gelirken misafirin dünya güncellemesi kesilir (hat kapalı, host hız değiştirir ve yayınlar) → hat açılınca mevcut yeniden
      eşitleme toparlar (misafir revizyonu host'a ulaşır, "dünya güncel değil" kalmaz).
   S3 toparlanma sonrası misafirin gerçek üretim emri (ship) ve filo emri (move) host'ta ve misafirin aynasında aynı sonucu verir.
   Yerel Chromium; Render / fiziksel cihaz DEĞİL. */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors}){
  const H=pg.H,B=pg.B,M=metrics.galaxy0={};
  const eB=await B.evaluate(()=>MP1Join.empireId);
  const mrev=e=>H.evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&!p.mirrorTimer?p.mirrorRev:-1;},e);
  const synced=async(ms=30000)=>{await H.evaluate(()=>MP1Host.host.publish());const t0=Date.now();
    for(;;){const r=await mrev(eB);if(r>=0&&await B.evaluate(r=>MP6Stars.S.rev>=r&&MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!(MP6Stars.S.desync&&MP6Stars.S.desync.on),r))break;if(Date.now()-t0>ms)throw Error('ayna eşitlenmedi');await sleep(150);}};
  const send=async c=>{const r=await B.evaluate(c=>MP1Join.cmd(c),c);if(!r.ok)return {status:'local',why:r.why};await B.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,{timeout:15000,polling:100});return B.evaluate(cid=>MP1Join.results.find(x=>x.cid===cid),r.cid);};
  await H.evaluate(()=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});});await synced();

  await test('S1 kümeli + 2× oda: host galaksisi rota denetiminden geçti; misafir aynı koordinatları, bildiği sistemlerde aynı hatları ve gezegenleri alır',async()=>{
    const h=await H.evaluate(()=>({cfg:{shape:G.cfg.shape,planetMul:G.cfg.planetMul},route:LAST_GALAXY_ROUTE,mul:LAST_PLANET_MUL,gen:LAST_GALAXY_GEN,n:G.sys.length,
      xy:G.sys.map(s=>[Math.round(s.x),Math.round(s.y)]),lanes:G.sys.map(s=>s.lanes.slice().sort((a,b)=>a-b)),pl:G.sys.map(s=>s.planets.map(p=>p.t))}));
    const g=await B.evaluate(()=>({n:G.sys.length,xy:G.sys.map(s=>[Math.round(s.x),Math.round(s.y)]),lanes:G.sys.map(s=>s.lanes.slice().sort((a,b)=>a-b)),pl:G.sys.map(s=>s.planets.map(p=>p.t)),known:G.sys.filter(s=>s.seen.includes(0)).map(s=>s.id)}));
    const laneOk=g.lanes.every((l,i)=>l.every(x=>h.lanes[i].includes(x))),known=g.known.filter(i=>g.pl[i].length),plOk=known.every(i=>JSON.stringify(g.pl[i])===JSON.stringify(h.pl[i]));
    M.S1={cfg:h.cfg,route:h.route,mul:h.mul,gen:h.gen,systems:[h.n,g.n],knownSystems:g.known.length,laneSubset:laneOk,knownPlanetsEqual:plOk};
    assert.equal(h.cfg.shape,'kumeli');assert.equal(h.cfg.planetMul,2);assert.equal(h.route.ok,true);assert.equal(h.route.components,1);assert.equal(h.mul.mul,2);assert.ok(h.mul.after.normal>h.mul.before.normal);
    assert.equal(g.n,h.n);assert.deepEqual(g.xy,h.xy,'aynı koordinatlar');assert.equal(laneOk,true,'misafir hatları host hatlarının alt kümesi');assert.ok(known.length>0&&plOk,'bilinen sistemlerde gezegenler aynı');
    await shot(B,'s1-b-kumeli-2x');});

  await test('S2 hız mesajı gelirken misafirin dünya güncellemesi kesilir → hat açılınca mevcut yeniden eşitleme toparlar; dünya güncel değil kalmaz',async()=>{
    const r0=await B.evaluate(()=>MP6Stars.S.rev);await lanes.B.down();
    await H.evaluate(()=>{MP1Host.host.local({kind:'speed',value:1});});await sleep(2500);
    await H.evaluate(()=>{for(let i=0;i<8;i++){G.day+=1;dailyTick(1);}MP1Host.host.publish();MP1Host.host.local({kind:'speed',value:0});});await sleep(1500);
    const cut=await B.evaluate(()=>({rev:MP6Stars.S.rev,day:G.day}));await lanes.B.up();
    await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,{timeout:40000,polling:200});await synced(40000);
    const after=await B.evaluate(()=>({rev:MP6Stars.S.rev,applied:MP6Stars.S.appliedRev,day:G.day,stale:!!(MP6Stars.S.desync&&MP6Stars.S.desync.on),speed:G.speed})),host=await H.evaluate(()=>({day:G.day,speed:G.speed}));
    M.S2={r0,cut,after,host};assert.equal(after.stale,false);assert.ok(Math.abs(after.day-host.day)<1e-6,'misafir host günüyle aynı: '+JSON.stringify({after,host}));assert.equal(after.speed,host.speed);});

  await test('S3 toparlanma sonrası misafirin gerçek üretim (ship) ve filo (move) emri host\'ta ve misafir aynasında aynı sonucu verir',async()=>{
    const home=await H.evaluate(e=>G.emps[e].home,eB);
    const q0=await H.evaluate(h=>G.sys[h].queue.length,home);const r1=await send({kind:'ship',sys:home,key:'kor'});
    await synced();const q=await H.evaluate(h=>G.sys[h].queue.map(x=>[x.cls,x.e]),home),qg=await B.evaluate(h=>G.sys[h].queue.map(x=>[x.cls,x.e]),home);
    const fl=await H.evaluate(e=>{const f=G.fleets.find(f=>f.e===e&&f.sys===G.emps[e].home&&isArmed(f)&&!f.mv);const s=G.sys[f.sys];const to=s.lanes.find(l=>G.sys[l]);f.path=[];return {id:f.id,to};},eB);
    const r2=await send({kind:'move',fleet:fl.id,to:fl.to});await synced();
    const hm=await H.evaluate(id=>{const f=G.fleets.find(f=>f.id===id);return {path:f.path.slice(),mvTo:f.mv?f.mv.to:null};},fl.id),gm=await B.evaluate(id=>{const f=G.fleets.find(f=>f.id===id);return f?{path:f.path.slice(),mvTo:f.mv?f.mv.to:null}:null;},fl.id);
    M.S3={ship:{res:r1&&r1.status,host:q,guest:qg},move:{res:r2&&r2.status,host:hm,guest:gm}};
    assert.equal(r1.status,'ok');assert.equal(q.length,q0+1);assert.equal(qg.length,q.length,'üretim kuyruğu iki tarafta aynı');
    assert.equal(r2.status,'ok');assert.ok(hm.path.includes(fl.to)||hm.mvTo===fl.to,JSON.stringify(hm));assert.deepEqual(gm,hm,'filo emri iki tarafta aynı');
    await shot(B,'s3-b-emirler');});
  fs.writeFileSync(path.join(out,'galaxy0-mp.json'),JSON.stringify(M,null,1));
};
