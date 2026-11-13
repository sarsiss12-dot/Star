'use strict';
/* MP-P0-DESYNC1 — browser-mp8 MP8_SCEN=D: host + 2 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili, oyuncu başına hat),
   gerçek STARS misafir arayüzü. Yerel Chromium'dur; fiziksel cihaz / gerçek internet / Render DEĞİLDİR.
   D1 gerçek host karar yolu (misafirin MP1Join.cmd'i: internalQuote → internalPolicy) kesirli günde (1650.0001 ≈ 2214.08 ve 1000.1):
      misafir aynası kurulur, öteki misafir etkilenmez, host Save8 ve MP paketi aynı dünyadan doğrulanır. (Taban p25'te FAIL beklenir.)
   D2 bir misafire giden fark kaybolur (otomatik TAM ayna) / reddedilir (dünya güncel değil: son geçerli dünya, emir engeli, sınırlı istek,
      elle YENİDEN EŞİTLE, TANIYI KOPYALA); öteki misafir kesintisiz; aynı devlete dönülür; ilk yeni emir host'ta tam bir kez.
   D3 kalıcı ret + geç iletiler: eski fark / eski ACK revizyonu geri almaz, çift uygulama yok; ret sürerken sayfa yenilenirse başlangıç
      sınırlı denemede durur (YENİDEN DENE), geçerli ayna gelince oyun açılır.
   FİKSTÜR (açıkça): misafir kolonisinde istikrar 40 + kaynak; kesirli gün host'ta doğrudan atanır (gerçek döngüde gün zaten kesirlidir);
   D2/D3'teki "geçersiz süre" host verisine elle konur ve sonra düzeltilir (gerçek kusur D1'de motor yoluyla üretilir). */
const fs=require('fs'),path=require('path');
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,errors,origin}){
  const H=pg.H,C=pg.C;let B=pg.B;const M=metrics.desync1={};
  const eB=await B.evaluate(()=>MP1Join.empireId),eC=await C.evaluate(()=>MP1Join.empireId);
  const st=p=>p.evaluate(()=>{const S=MP6Stars.S,d=S.desync||{good:{}};return {rev:S.rev,applied:S.appliedRev,world:S.appliedWorldRev,day:G.day,on:d.on,gaveUp:d.gaveUp,asks:d.asks,same:d.same,fulls:d.fulls,total:d.total,reason:d.reason,good:d.good,
    recon:S.sync.reconnects,resyncs:S.stats.resyncs,mirrors:S.stats.mirrors,deltas:S.stats.deltas,fail:S.stats.fail||0,blocked:S.stats.staleBlocked||0,late:S.stats.lateDelta||0,lastMs:d.lastRecoveryMs,
    chip:(document.getElementById('mp1Mini')||{}).textContent||'',stale:!!document.getElementById('mpdsStale'),btn:!!document.getElementById('mpdsResync'),name:G.p.name,emp:MP1Join.empireId,acksWaiting:MP6Stars.desync?MP6Stars.desync.acks():null};});
  const synced=async(p,ms=30000)=>{await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&MP6Stars.S.appliedGeneration===MP6Stars.S.gen&&!MP6Stars.S.building&&!MP6Stars.S.timer&&!(MP6Stars.S.desync&&MP6Stars.S.desync.on),undefined,{timeout:ms,polling:150});};
  const pub=()=>H.evaluate(()=>MP1Host.host.publish());
  const tick=d=>H.evaluate(d=>{G.day+=d;MP1Host.host.publish();},d);
  const col=e=>H.evaluate(e=>{const s=G.sys[G.emps[e].home],p=s.planets.find(p=>p.owner===e&&p.col);return {sys:s.id,planet:p.i};},e);
  const send=async(p,c,ms=15000)=>{const r=await p.evaluate(c=>MP1Join.cmd(c),c);if(!r.ok)return {status:'local',why:r.why};
    await p.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,{timeout:ms,polling:100});return p.evaluate(cid=>({cid,...MP1Join.results.filter(x=>x.cid===cid).at(-1)}),r.cid);};
  const hostOk=()=>H.evaluate(()=>{const t=serialize(),d=JSON.parse(t);const ok=validSaveEnvelope(d);const why=typeof saveLoadReject==='function'?saveLoadReject():null;const k=MP1Host.host.snapshot({});const V=StarsMP.validatePackage(JSON.stringify(k.pkg));return {save8:ok,why,pkg:V.ok,pkgWhy:V.why||null,v:d.v,mp:V.ok?V.pkg.mpVersion:null};});
  await H.evaluate(()=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});});
  for(const p of [B,C])await synced(p).catch(()=>{});

  await test('D1 kesirli gün + gerçek host karar yolu (misafir B: internalQuote → internalPolicy): B aynası kurulur, C etkilenmez; host Save8 ve MP paketi geçerli (taban p25: B "kayıt doğrulaması reddetti")',async()=>{
    const rows=[];
    for(const [kind,day] of [['autonomy',1650.0001],['relief',1000.1]]){
      const at=await col(eB);
      await H.evaluate(({e,at,day})=>{G.day=day;if(day>1600){G.year=2214;G.month=8;}const E=G.emps[e],p=G.sys[at.sys].planets[at.planet];p.col.stab=40;delete p.col.crisisPolicy;for(const k of Object.keys(E.res))E.res[k]=Math.max(E.res[k],2000);MP1Host.host.publish();},{e:eB,at,day});
      await synced(B);await synced(C);const c0=await st(C),b0=await st(B);
      const q=await send(B,{kind:'internalQuote',sys:at.sys,planet:at.planet,policy:kind});assert.equal(q.status,'ok');assert(q.extra&&q.extra.ok,'önizleme: '+JSON.stringify(q.extra));
      const r=await send(B,{kind:'internalPolicy',sys:at.sys,planet:at.planet,policy:kind,stamp:q.extra.stamp});assert.equal(r.status,'ok','host kararı uyguladı');
      const pol=await H.evaluate(at=>G.sys[at.sys].planets[at.planet].col.crisisPolicy,at);
      await pub();   // host aynayı 700 ms kısmayla gönderir: politika B'nin KURULMUŞ dünyasında görünene dek beklenir
      const built=await B.waitForFunction(({at,u})=>{const p=G.sys[at.sys].planets[at.planet];return !!(p.col&&p.col.crisisPolicy&&p.col.crisisPolicy.until===u);},{at,u:pol.until},{timeout:20000,polling:150}).then(()=>true,()=>false);
      await synced(C,20000).catch(()=>{});const b=await st(B),c=await st(C);
      const seen=await B.evaluate(at=>{const p=G.sys[at.sys].planets[at.planet];return p.col&&p.col.crisisPolicy?{...p.col.crisisPolicy}:null;},at);
      const h=await hostOk();rows.push({kind,day,pol,built,b:{applied:b.applied,rev:b.rev,on:b.on,reason:b.reason,fail:b.fail-b0.fail},cMoved:c.applied>=c0.applied,cFail:c.fail-c0.fail,seen,host:h});
      await shot(B,'d1-'+kind);
    }
    M.d1=rows;fs.writeFileSync(path.join(out,'d1.json'),JSON.stringify(rows,null,1));
    for(const x of rows){assert.equal(x.pol.until,x.day+(x.kind==='relief'?180:360),'motorun yazdığı süre (yuvarlama yok)');
      assert(x.built&&!x.b.on&&x.b.fail===0,x.kind+' @'+x.day+': B aynası kurulamadı '+JSON.stringify(x.b));assert(x.seen&&x.seen.until===x.pol.until,'B dünyasında aynı politika');
      assert.equal(x.cFail,0,'C etkilenmedi');assert(x.host.save8&&x.host.pkg&&x.host.v===8&&x.host.mp===4,'host Save8 / MP paketi geçerli: '+JSON.stringify(x.host));}
  });

  /* ---- D2 ---- */
  await test('D2 B\'ye giden fark kaybolur → otomatik TAM ayna; B\'nin verisi reddedilir → "dünya güncel değil" (son geçerli dünya, emir engeli, ≤3 otomatik istek, yeniden bağlanma döngüsü yok), elle YENİDEN EŞİTLE + TANIYI KOPYALA; C kesintisiz; aynı devlet; ilk yeni emir tam bir kez',async()=>{
    const R=M.d2={};await synced(B);await synced(C);
    /* (a) kaybolan fark: B sayfasında tek bir mirrorDelta düşürülür (hat açık; host bunu bilmez) */
    const a0=await st(B),c0=await st(C);
    await B.evaluate(()=>{const o=MP6Stars.onMessage;let n=1;MP6Stars.onMessage=function(m){if(n&&m.type==='mirrorDelta'){n--;window.__dsDropped=m.rev;return true;}return o.apply(this,arguments);};window.__dsOn0=o;});
    const t0=Date.now();await tick(2);await sleep(900);await tick(2);
    await B.waitForFunction(m=>MP6Stars.S.stats.mirrors>m,a0.mirrors,{timeout:30000,polling:150});await synced(B,30000);R.lost={ms:Date.now()-t0,dropped:await B.evaluate(()=>window.__dsDropped),after:await st(B)};
    await B.evaluate(()=>{MP6Stars.onMessage=window.__dsOn0;});
    assert(R.lost.dropped>0,'fikstür: fark düşürüldü');assert(R.lost.after.resyncs>a0.resyncs&&R.lost.after.mirrors>a0.mirrors,'boşluk TAM ayna ile kapandı');
    assert.equal(R.lost.after.recon,a0.recon,'yeniden bağlanma gerekmedi');
    /* (b) reddedilen veri: host'ta B kolonisindeki politikanın süresi bozulur (yalnız B'nin aynasında) */
    await synced(B);await synced(C);const at=await col(eB);
    const ship0=await H.evaluate(e=>{const E=G.emps[e];for(const k of Object.keys(E.res))E.res[k]=Math.max(E.res[k],3000);return (G.sys[E.home].queue||[]).length;},eB);
    const good=await st(B);const c1=await st(C);
    await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];p.col.crisisPolicy={v:1,owner:p.owner,kind:'relief',started:G.day,until:G.day+181,after:G.day+360};MP1Host.host.publish();},{at});
    await B.waitForFunction(()=>MP6Stars.S.desync.on,undefined,{timeout:20000,polling:150});
    const s1=await st(B);R.stale=s1;R.staleLog=await B.evaluate(()=>MP6Stars.S.sync.log.slice(-20).map(x=>x.what));await shot(B,'d2-stale');
    assert(s1.on&&s1.reason,'B dünya güncel değil durumunda kalmalı: '+JSON.stringify({s1,log:R.staleLog}).slice(0,1500));
    assert(s1.stale&&/DÜNYA GÜNCEL DEĞİL/.test(s1.chip),'görünür uyarı: '+s1.chip.slice(0,200));assert.equal(s1.reason.code,'crisisPolicy.until','ret nedeni (alan) ayırt edilir');assert.equal(s1.reason.stage,'envelope');
    assert(/crisisPolicy/.test(s1.reason.path),'alan yolu');assert.equal(s1.day,good.day,'son geçerli dünya ekranda (gün geri gitmez / ilerlemez)');assert(s1.good.rev===good.applied,'son geçerli revizyon gösterilir');
    /* emir engeli: dünyayı değiştiren emir gitmez, önizleme gider */
    const blk=await B.evaluate(e=>MP1Join.cmd({kind:'ship',sys:G.p.home,key:'kor'}),eB);assert.deepEqual(blk,{ok:false,why:'stale-world'},'dünya güncel değilken emir engellendi');
    const ro=await send(B,{kind:'internalQuote',sys:at.sys,planet:at.planet,policy:'relief'});assert.equal(ro.status,'ok','salt okuma önizlemesi serbest');
    /* C kesintisiz: host ilerlerken C kurmaya devam eder */
    for(let i=0;i<4;i++){await tick(1);await sleep(700);}
    await synced(C,20000);const c2=await st(C);R.cDuring={before:c1.applied,after:c2.applied,fail:c2.fail-c1.fail,resyncs:c2.resyncs-c1.resyncs};
    assert(c2.applied>c1.applied&&c2.fail===c1.fail&&c2.resyncs===c1.resyncs,'C kesintisiz: '+JSON.stringify(R.cDuring));
    /* sınırlı otomatik istek: aynı nedenle 3 TAM ayna reddi → istek durur; yeniden bağlanma yok */
    await B.waitForFunction(()=>MP6Stars.S.desync.gaveUp,undefined,{timeout:70000,polling:250});const s2=await st(B);R.gaveUp=s2;
    await sleep(8000);const s3=await st(B);R.after8s=s3;
    assert(s2.asks<=3&&s2.same>=3,'≤3 otomatik istek, 3 ardışık tam ret: '+JSON.stringify({asks:s2.asks,same:s2.same,fulls:s2.fulls}));
    assert.equal(s3.resyncs,s2.resyncs,'vazgeçtikten sonra yeni otomatik istek yok');assert.equal(s3.recon,good.recon,'yeniden bağlanma döngüsü yok');
    /* tanı kopyala: gerçek dokunma; jeton / oda kodu / oda anahtarı yok */
    await tap(B,'#mpdsCopy');const diag=await B.evaluate(()=>MP6Stars.S.lastDiagCopy||'');R.diag=diag;fs.writeFileSync(path.join(out,'d2-tani.txt'),diag);
    const code=await H.evaluate(()=>MP1Host.code||''),tok=await B.evaluate(()=>{try{return JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/^mp1:/.test(k)&&k!=='mp1:name'&&k!=='mp1:dev'))||'{}').token||'';}catch{return '';}});
    assert(/DÜNYA GÜNCEL DEĞİL/.test(diag)&&/crisisPolicy\.until/.test(diag)&&/son geçerli r\d+/.test(diag)&&/reddedilen r\d+/.test(diag),'tanı içeriği');
    for(const s of [code,code.replace(/-/g,''),tok].filter(x=>x&&x.length>=4))assert(!diag.includes(s),'tanıda gizli değer yok');
    assert(!/token|jeton|hostKey/i.test(diag));
    /* elle YENİDEN EŞİTLE, veri hâlâ bozuk: tek istek, yine ret, döngü yok */
    const m0=await st(B);await tap(B,'#mpdsResync');await B.waitForFunction(n=>MP6Stars.S.desync.total>n,m0.total,{timeout:20000,polling:200});await sleep(3000);const m1=await st(B);
    R.manualStillBad={resyncs:m1.resyncs-m0.resyncs,total:m1.total-m0.total,on:m1.on};assert(m1.on&&m1.resyncs-m0.resyncs===1,'elle istek tek TAM ayna: '+JSON.stringify(R.manualStillBad));
    /* host verisi düzelir; B farkları KAÇIRIR (hat açık, iletiler düşer) → otomatik yol iyileşemez, elle YENİDEN EŞİTLE dünyayı kurar */
    await B.evaluate(()=>{const o=MP6Stars.onMessage;MP6Stars.onMessage=function(m){if(m.type==='mirrorDelta'){window.__dsDrop=(window.__dsDrop||0)+1;return true;}return o.apply(this,arguments);};window.__dsOn1=o;});
    await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];delete p.col.crisisPolicy;MP1Host.host.publish();},{at});await sleep(1500);await tick(1);await sleep(1200);
    assert.equal((await st(B)).on,true,'fikstür: düzeltme B\'ye ulaşmadı');
    const t1=Date.now();await tap(B,'#mpdsResync');await synced(B,30000);R.manualMs=Date.now()-t1;await B.evaluate(()=>{MP6Stars.onMessage=window.__dsOn1;});R.droppedWhileFixed=await B.evaluate(()=>window.__dsDrop||0);const s4=await st(B);R.recovered=s4;await shot(B,'d2-recovered');
    assert(!s4.on&&!s4.stale,'uyarı kalktı');assert.equal(s4.emp,eB,'aynı devlet');assert.equal(s4.name,good.name,'aynı devlet adı');
    const hday=await H.evaluate(()=>G.day);assert(Math.abs(hday-s4.day)<1e-9,'B dünyası host günüyle eşit');assert.equal(s4.recon,good.recon,'aynı bağlantı / koltuk');
    /* ilk yeni geçerli emir host'ta tam bir kez; engellenen emir kendiliğinden yeniden gönderilmedi */
    assert.equal(await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB),ship0,'engellenen emir host\'a hiç gitmedi');
    const ok=await send(B,{kind:'ship',sys:await B.evaluate(()=>G.p.home),key:'kor'});assert.equal(ok.status,'ok');
    await sleep(500);assert.equal(await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB),ship0+1,'tam bir kez');
    await pub();await synced(B);const s5=await st(B);R.reflected={acksWaiting:s5.acksWaiting,queue:await B.evaluate(()=>(G.sys[G.p.home].queue||[]).length)};
    assert.equal(R.reflected.acksWaiting,0,'onaylı emrin etkisi aynada görünüyor');assert.equal(R.reflected.queue,ship0+1);
    R.cid=ok.cid;fs.writeFileSync(path.join(out,'d2.json'),JSON.stringify(R,null,1));
  });

  /* ---- D3 ---- */
  await test('D3 geç iletiler revizyonu geri almaz / çift uygulamaz; ret sürerken sayfa yenilenirse başlangıç sınırlı denemede durur, geçerli ayna gelince oyun açılır',async()=>{
    const R=M.d3={};await synced(B);const s0=await st(B),q0=await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB);
    /* geç fark: elde olandan eski revizyon */
    const late=await B.evaluate(()=>{const S=MP6Stars.S;const before={rev:S.rev,applied:S.appliedRev,day:G.day};MP6Stars.onMessage({v:1,type:'mirrorDelta',base:S.rev-2,rev:S.rev-1,worldRev:1,ops:{day:[1]}});
      return {before,after:{rev:S.rev,applied:S.appliedRev,day:G.day,late:S.stats.lateDelta||0}};});
    R.lateDelta=late;assert.equal(late.after.rev,late.before.rev,'revizyon geri gitmedi');assert.equal(late.after.day,late.before.day);assert(late.after.late>=1);
    /* geç / yinelenen ACK: D2'deki emrin cid'i yeniden gönderilir → host dup; kuyruk değişmez */
    const cid=M.d2&&M.d2.cid;if(cid){const dup=await B.evaluate(({cid,home})=>{MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid,cmd:{kind:'ship',sys:home,key:'kor'}});return true;},{cid,home:await B.evaluate(()=>G.p.home)});
      await sleep(1500);R.dupResult=await B.evaluate(cid=>MP1Join.results.filter(x=>x.cid===cid).map(x=>({status:x.status,dup:x.dup||0,code:x.code})),cid);
      assert.equal(await H.evaluate(e=>(G.sys[G.emps[e].home].queue||[]).length,eB),q0,'yinelenen emir ikinci kez uygulanmadı');}
    await B.evaluate(()=>{MP1Join.results.push({v:1,type:'result',cid:'eski-ack',status:'ok',rev:1});});await sleep(600);
    const s1=await st(B);R.afterLateAck={rev:s1.rev,applied:s1.applied,on:s1.on,acksWaiting:s1.acksWaiting};assert(s1.applied>=s0.applied&&!s1.on,'geç ACK eşitlemeyi bozmaz');
    /* ret sürerken sayfa yenileme: başlangıç aşaması sınırlı denemede durur (sonsuz döngü yok), host düzelince YENİDEN DENE ile açılır */
    const at=await col(eB);await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];p.col.crisisPolicy={v:1,owner:p.owner,kind:'autonomy',started:G.day,until:G.day+360,after:G.day+719};MP1Host.host.publish();},{at});
    const code=await H.evaluate(()=>MP1Host.code);const t0=Date.now();await B.goto(origin.B+'/mp/play?code='+code);
    await B.waitForFunction(()=>window.MP6Stars&&MP6Stars.S.boot.failed,undefined,{timeout:150000,polling:300});R.bootFailMs=Date.now()-t0;
    const b=await B.evaluate(()=>({fails:MP6Stars.S.boot.fails,tries:MP6Stars.S.boot.tries,err:MP6Stars.S.boot.err,started:MP6Stars.S.started,btn:!!document.getElementById('mp7Retry'),txt:(document.getElementById('mp7BootErr')||{}).textContent||''}));R.boot=b;await shot(B,'d3-boot-failed');
    await sleep(10000);const b2=await B.evaluate(()=>({fails:MP6Stars.S.boot.fails,mirrors:MP6Stars.S.stats.mirrors}));R.bootQuiet=b2;
    assert(!b.started&&b.btn&&/crisisPolicy\.after/.test(b.err),'başlangıç neden + YENİDEN DENE ile durdu: '+JSON.stringify(b));assert.equal(b2.fails,b.fails,'durduktan sonra yeni deneme yok');
    await H.evaluate(({at})=>{const p=G.sys[at.sys].planets[at.planet];delete p.col.crisisPolicy;MP1Host.host.publish();},{at});
    const t1=Date.now();await tap(B,'#mp7Retry');await B.waitForFunction(()=>MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000,polling:200});R.bootRecoverMs=Date.now()-t1;
    await synced(B);const s2=await st(B);R.reopened={emp:s2.emp,name:s2.name};assert.equal(s2.emp,eB);assert.equal(s2.name,s0.name,'aynı devlete döndü');await shot(B,'d3-reopened');
    pg.B=B;fs.writeFileSync(path.join(out,'d3.json'),JSON.stringify(R,null,1));
  });
};
