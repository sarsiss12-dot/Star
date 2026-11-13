'use strict';
/* MP-P0-DESYNC2 — geçici AI koruması, browser-mp8 MP8_SCEN=G: host + 2 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili, oyuncu
   başına kesilebilir hat), gerçek STARS misafir arayüzü. Oda seçeneği lobide host'un gerçek dokunuşuyla açılır. Yerel Chromium; Render DEĞİL.
   FİKSTÜR (açıkça): B'nin devleti bir AI ile savaşta; AI'nın güçlendirilmiş savaş filosu B'nin ana sisteminde; B'ye ana sisteme komşu bir dost
   sistem verilir; B'nin ana sistemdeki savaş filosunun emri temizlenir. "Kalıcı tam ayna reddi" D2 ile aynı yoldan: host'ta B kolonisindeki
   politika süresi bir gün bozulur (yalnız B'nin aynasında), sonra düzeltilir. Oyun akarken ölçülür (hız 1). */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors,origin}){
  const H=pg.H,B=pg.B,C=pg.C,M=metrics.guard={};
  const eB=await B.evaluate(()=>MP1Join.empireId),eC=await C.evaluate(()=>MP1Join.empireId);
  const pidOf=e=>H.evaluate(e=>[...MP1Host.host.state.players.values()].find(p=>p.empireId===e).playerId,e);
  const gs=async e=>H.evaluate(pid=>MP1Host.host.guardState(pid),await pidOf(e));
  const jg=()=>H.evaluate(()=>MP1Host.host.state.journal.filter(r=>String(r.playerId).startsWith('guard:')).map(r=>({kind:r.cmd.kind,fleet:r.cmd.fleet,to:r.cmd.to,emp:r.empireId})));
  const spd=v=>H.evaluate(v=>{try{UI.closeModal();}catch{}return MP1Host.host.local({kind:'speed',value:v});},v);
  const gst=p=>p.evaluate(()=>{const S=MP6Stars.S;return {stale:!!S.desync.on,guard:S.guard||null,summary:S.guardSummary||null,applied:S.appliedRev,rev:S.rev,day:G.day,reports:S.stats.reports|0,chip:(document.getElementById('mp1Mini')||{}).textContent||'',emp:MP1Join.empireId,name:G.p.name,gblocked:S.stats.guardBlocked|0};});
  const col=e=>H.evaluate(e=>{const s=G.sys[G.emps[e].home],p=s.planets.find(p=>p.owner===e&&p.col);return {sys:s.id,planet:p.i};},e);
  const hostDay=()=>H.evaluate(()=>G.day);
  /* tehdit fikstürü koruma BAŞLADIĞI ANDA kurulur (önceden kurulursa akan oyunda muharebe filoyu koruma başlamadan yok edebilir) */
  const threat=()=>H.evaluate(e=>{const E=G.emps[e],home=G.sys[E.home],ai=G.emps.find(x=>x.ai&&!x.dead&&!x.wild&&!x.crisisSide&&x.id!==e&&x.id>2&&G.fleets.some(f=>f.e===x.id&&isArmed(f)&&f.ships.length));
    E.war[ai.id]=true;ai.war[E.id]=true;E.contact[ai.id]=true;ai.contact[E.id]=true;
    const af=G.fleets.filter(f=>f.e===ai.id&&isArmed(f)&&f.ships.length).sort((a,b)=>fleetPower(b)-fleetPower(a))[0];const base=af.ships.slice();for(let i=0;i<5;i++)for(const sh of base)af.ships.push(JSON.parse(JSON.stringify(sh)));
    /* güvenli dost sistem: komşu boş sistemde motorun kendi doColonize'ıyla koloni (sahiplik gerçek döngüde de kalır) */
    const safe=home.lanes.map(i=>G.sys[i]).find(s=>s.owner<0&&s.planets.some(p=>!(p.owner>=0)&&!p.col))||home.lanes.map(i=>G.sys[i]).find(s=>s.planets.some(p=>!(p.owner>=0)&&!p.col));doColonize(E,safe,safe.planets.find(p=>!(p.owner>=0)&&!p.col));
    const mine=G.fleets.find(f=>f.e===E.id&&f.sys===home.id&&!f.mv&&isArmed(f));if(mine){mine.path=[];mine.ord=null;}
    /* düşman, güvenli sistem dışındaki en uzak komşudan ana sisteme YOLA ÇIKAR (varış birkaç gün sonra): aynı sisteme konan filo, korumanın 2 sn'lik
       nabzından önce muharebeyle filoyu yok edebiliyordu (ilk koşu tanısı). Yaklaşan düşman = tehdit (f.mv.to). */
    const from=home.lanes.filter(i=>i!==safe.id).map(i=>G.sys[i]).sort((a,b)=>dist(b,home)-dist(a,home))[0];
    af.sys=from.id;af.mv=null;af.x=from.x;af.y=from.y;af.path=[home.id];af.stance='agresif';
    MP1Host.host.publish();return {home:home.id,safe:safe.id,ai:ai.id,enemy:af.id,mine:mine?mine.id:null,enemyPow:fleetPower(af),minePow:mine?fleetPower(mine):0};},eB);
  const fx={};
  M.fixture=fx;
  const lobbyGuard=await B.evaluate(()=>!!(MP1Join.lobby&&MP1Join.lobby.guard));

  await test('G1 oda seçeneği lobide gerçek dokunuşla açıldı; misafirler seçeneği görür; kısa paket kaybı (8 sn hat kesik) → hızlı toparlanma, koruma başlamaz',async()=>{
    assert.equal(metrics.guardOption,true);assert.equal(lobbyGuard,true,'B lobide seçeneği görür');
    await spd(1);await sleep(1500);
    const t0=Date.now();await lanes.B.down();await sleep(8000);await lanes.B.up();
    await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline&&MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.desync.on,undefined,{timeout:40000,polling:250});
    M.shortLoss={recoverMs:Date.now()-t0};await sleep(30000);
    const g=await gs(eB);M.shortLoss.guard=g;assert.equal(g.active,false,'kısa kayıpta koruma yok');assert.deepEqual(await jg(),[],'AI emri yok');
  });

  await test('G2 kalıcı tam ayna reddi (oyun akarken): ≤30 sn koruma yok; ~30 sn sonra yalnız B korumaya geçer, B ve oda bildirim görür, B\'nin tehdit altındaki filosu güvenli sisteme çekilir; C oynar; B\'nin emri host\'ta reddedilir; host duraklatınca sayaç ilerlemez',async()=>{
    const R=M.persistent={};const at=await col(eB);R.at=at;
    /* önce DURAKLATILMIŞ oyunda kalıcı ret: sayaç ilerlemez */
    await spd(0);await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];p.col.crisisPolicy={v:1,owner:p.owner,kind:'relief',started:G.day,until:G.day+181,after:G.day+360};MP1Host.host.publish();},{at});
    await B.waitForFunction(()=>MP6Stars.S.desync.on,undefined,{timeout:20000,polling:200});await sleep(40000);
    R.paused=await gs(eB);assert.equal(R.paused.active,false,'duraklatmada koruma başlamaz');assert.equal(R.paused.wait,0,'duraklatmada sayaç 0');
    /* oyun akar: 30 sn */
    const t0=Date.now();await spd(1);await sleep(20000);R.at20=await gs(eB);assert.equal(R.at20.active,false,'20. sn\'de koruma yok');
    await H.waitForFunction(pid=>MP1Host.host.guardState(pid).active,await pidOf(eB),{timeout:30000,polling:250});R.startMs=Date.now()-t0;
    assert(R.startMs>=28000,'≈30 sn bekleme: '+R.startMs);
    R.C=await gs(eC);assert.equal(R.C.active,false,'C korumada değil');
    await B.waitForFunction(()=>!!MP6Stars.S.guard,undefined,{timeout:15000,polling:200});const b=await gst(B);R.B=b;assert.equal(b.guard.reason,'sync');assert.equal(b.emp,eB,'koltuk / devlet B\'de');
    Object.assign(fx,await threat());M.fixture=fx;assert(fx.mine!==null&&fx.enemyPow>fx.minePow,'fikstür: düşman üstün '+JSON.stringify(fx));
    await H.waitForFunction(()=>MP1Host.host.state.journal.some(r=>String(r.playerId).startsWith('guard:')),undefined,{timeout:15000,polling:250}).catch(async e=>{
      R.diag=await H.evaluate(({e,fx})=>{const E=G.emps[e],f=G.fleets.find(x=>x.id===fx.mine),af=G.fleets.find(x=>x.id===fx.enemy),vis=StarsMP.actorVision(E);
        return {speed:G.speed,phase:MP1Host.host.lobby.phase,paused:MP1Host.host.state.paused,guard:MP1Host.host.guardState([...MP1Host.host.state.players.values()].find(p=>p.empireId===e).playerId),
          mine:f&&{sys:f.sys,mv:f.mv,path:f.path,ord:f.ord,explore:f.explore,auto:f.auto,ships:f.ships.length,pow:fleetPower(f)},enemy:af&&{sys:af.sys,mv:af.mv,e:af.e,ships:af.ships.length,pow:fleetPower(af)},
          war:E.war[fx.ai],visHome:vis.has(fx.home),safeOwner:G.sys[fx.safe].owner,homeLanes:G.sys[fx.home].lanes,own:G.sys.filter(s=>s.owner===e).map(s=>s.id),stats:{g:MP1Host.host.stats.guardOrders|0,pe:MP1Host.host.stats.publishErrors|0,le:MP1Host.host.stats.lastPublishError||null}};},{e:eB,fx});
      fs.writeFileSync(path.join(out,'g2-diag.json'),JSON.stringify(R,null,1));throw e;});
    const j=await jg();R.orders=j;assert(j.length>=1&&j.every(r=>r.kind==='move'&&r.emp===eB),'yalnız B\'nin move emirleri: '+JSON.stringify(j));assert(j.some(r=>r.fleet===fx.mine),'tehdit altındaki savaş filosu');
    assert(j.every(r=>r.to!==fx.home));
    R.hostLog=await H.evaluate(()=>(MP1Host.guardLog||[]).slice(-3));assert(R.hostLog.some(x=>x.on),'host bildirimi');
    R.Cnote=await C.evaluate(()=>MP6Stars.S.sync.log.slice(-10).map(x=>x.what));await shot(B,'g2-b-guard');await shot(H,'g2-host-guard');
    /* B'nin emri: istemci yerelde engeller; doğrudan gönderilen emri host reddeder */
    const loc=await B.evaluate(()=>MP1Join.cmd({kind:'ship',sys:G.p.home,key:'kor'}));R.local=loc;assert(loc.ok===false&&['stale-world','guard-active'].includes(loc.why),'yerel engel (dünya güncel değilken önce stale-world): '+JSON.stringify(loc));
    const rawCid='gdraw'+Date.now().toString(36);await B.evaluate(cid=>{MP1Join.seq++;MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid,cmd:{kind:'ship',sys:G.p.home,key:'kor'}});},rawCid);
    await B.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),rawCid,{timeout:15000});R.raw=await B.evaluate(cid=>MP1Join.results.find(x=>x.cid===cid),rawCid);assert.equal(R.raw.code,'guard-active','host reddi');
    /* C oynar: emri işlenir, dünyası ilerler */
    const cq0=await H.evaluate(e=>{const E=G.emps[e];for(const k of Object.keys(E.res))E.res[k]=Math.max(E.res[k],3000);return (G.sys[E.home].queue||[]).length;},eC);
    const cr=await C.evaluate(()=>MP1Join.cmd({kind:'ship',sys:G.p.home,key:'kor'}));assert(cr.ok);await C.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid&&x.status==='ok'),cr.cid,{timeout:15000});
    R.cQueue=[cq0,await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eC)];assert.equal(R.cQueue[1],cq0+1,'C\'nin emri tam bir kez');
    const cd0=(await gst(C)).day;await sleep(5000);R.cDays=(await gst(C)).day-cd0;assert(R.cDays>0,'C\'nin dünyası ilerliyor');
    fs.writeFileSync(path.join(out,'g2.json'),JSON.stringify(R,null,1));
  });

  await test('G3 iade: host verisi düzelir → B dünyasını kurar, bu oturumun TAM aynasını uygular → host korumayı kapatır; B özet görür; ilk insan emri tam bir kez; AI yeni emir vermez; geç eşitleme bildirimi / geç fark durumu değiştirmez',async()=>{
    const R=M.release={};const at=M.persistent.at,n0=(await jg()).length;
    const t0=Date.now();await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];delete p.col.crisisPolicy;MP1Host.host.publish();},{at});
    await H.waitForFunction(pid=>!MP1Host.host.guardState(pid).active,await pidOf(eB),{timeout:60000,polling:250});R.releaseMs=Date.now()-t0;
    await B.waitForFunction(()=>!MP6Stars.S.guard&&!!MP6Stars.S.guardSummary&&!MP6Stars.S.desync.on,undefined,{timeout:20000,polling:200});const b=await gst(B);R.B=b;
    assert(b.summary.orders>=1&&b.summary.actions.length>=1,'dönen oyuncuya özet: '+JSON.stringify(b.summary));assert.equal(b.emp,eB);await shot(B,'g3-b-returned');
    const q0=await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB);
    const r=await B.evaluate(()=>MP1Join.cmd({kind:'ship',sys:G.p.home,key:'kor'}));assert(r.ok,'ilk insan emri gönderildi');await B.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,{timeout:15000});
    R.first=await B.evaluate(cid=>MP1Join.results.find(x=>x.cid===cid),r.cid);assert.equal(R.first.status,'ok');
    await sleep(800);R.queue=[q0,await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB)];assert.equal(R.queue[1],q0+1,'tam bir kez');
    const n1=(await jg()).length;await sleep(10000);R.ordersAfter=(await jg()).length-n1;assert.equal(R.ordersAfter,0,'iade sonrası AI emri yok');assert(n1>=n0);
    /* geç / eski eşitleme bildirimi ve geç fark */
    await B.evaluate(()=>{MP1Join.sendRaw({v:1,type:'synced',rev:1,full:true,stale:true});const S=MP6Stars.S;MP6Stars.onMessage({v:1,type:'mirrorDelta',base:S.rev-2,rev:S.rev-1,worldRev:1,ops:{day:[1]}});});
    await sleep(35000);R.late=await gs(eB);assert.equal(R.late.active,false,'geç "güncel değil" bildirimi tek başına (oturum güncel) korumayı yeniden başlatmaz');
    fs.writeFileSync(path.join(out,'g3.json'),JSON.stringify(R,null,1));
  });

  await test('G4 tekrar kopma: B\'nin hattı 40 sn kesik (oyun akarken) → koruma (kopma); hat açılınca aynı koltuk/devlet, TAM ayna, iade; seçenek MP kaydında',async()=>{
    const R=M.reconnect={};const t0=Date.now();await lanes.B.down();
    await H.waitForFunction(pid=>MP1Host.host.guardState(pid).active,await pidOf(eB),{timeout:90000,polling:250}).catch(()=>{});R.guardMs=Date.now()-t0;R.state=await gs(eB);
    await lanes.B.up();
    await B.waitForFunction(()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,{timeout:60000,polling:250});
    await H.waitForFunction(pid=>!MP1Host.host.guardState(pid).active,await pidOf(eB),{timeout:60000,polling:250});R.backMs=Date.now()-t0;
    const b=await gst(B);R.B=b;assert.equal(b.emp,eB);
    R.pkg=await H.evaluate(()=>{const k=MP1Host.host.snapshot({});return k.ok?{aiGuard:k.pkg.session.settings.aiGuard,mp:k.pkg.mpVersion,v:JSON.parse(k.pkg.save8).v}:k;});
    assert.equal(R.state.active,true,'kopma 30 sn sonra korumaya geçti ('+R.guardMs+' ms): '+JSON.stringify(R.state));assert(R.guardMs>=30000,'en az 30 sn: '+R.guardMs);assert.deepEqual(R.pkg,{aiGuard:true,mp:4,v:8});
    await spd(0);fs.writeFileSync(path.join(out,'g4.json'),JSON.stringify(R,null,1));
  });
};
