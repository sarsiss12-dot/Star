'use strict';
/* FIELD-WAR-SIEGE.0 — browser-mp8 MP8_SCEN=K: host + 1 misafir (ayrı Chromium, üretim relay SÜRECİ + TLS vekili), gerçek STARS misafir arayüzü,
   gerçek dokunma. Yerel Chromium; fiziksel cihaz / gerçek internet / Render DEĞİL.
   K1 misafir B kendi FİLO sekmesinde SEVKİYATLAR → "Bekleyenleri Yeniden Dene (3)" (rota açılan, otomatik sınırdaki, kapalı rotalı, hedefi kayıp,
      yoldaki); çift gerçek dokunuş → host'ta TEK shipmentRetryAll; sonuç metni host yanıtından; başka devletin sevkiyatı değişmez.
   K2 B'nin 36K filosu düşman (AI) başkentinde, host'ta son direniş ateşkesi: misafirin SİSTEM panelinde "Kara ordusu bekleniyor … ateşkes" (ayna: yetkili
      truce alanı); host barış yapar → misafirde "⏸ KUŞATMA DURDU — … savaş sona erdi (…, gün n)" (ayna: kamu savaş sonu özeti).
   FİKSTÜR (açıkça): host'ta sevkiyatlar ve filolar newFleet ile kurulur, bir sistemin hatları kesilir; ateşkes alanı doğrudan yazılır. Zaman host'ta hız 0. */
module.exports=async function({test,pg,metrics,out,sleep,shot,assert,wait,tap}){
  const H=pg.H,B=pg.B,M=metrics.fieldWarSiege={};
  const eB=await B.evaluate(()=>MP1Join.empireId);
  const mrev=e=>H.evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&!p.mirrorTimer?p.mirrorRev:-1;},e);
  const synced=async(p,ms=30000)=>{await H.evaluate(()=>MP1Host.host.publish());const e=await p.evaluate(()=>MP1Join.empireId),t0=Date.now();
    for(;;){const r=await mrev(e);if(r>=0&&await p.evaluate(r=>MP6Stars.S.rev>=r&&MP6Stars.S.appliedRev===MP6Stars.S.rev,r))break;if(Date.now()-t0>ms)throw Error('ayna eşitlenmedi');await sleep(150);}
    await p.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building&&!MP6Stars.S.timer&&!(MP6Stars.S.desync&&MP6Stars.S.desync.on),undefined,{timeout:ms,polling:150});};
  const clean=p=>p.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();});
  await H.evaluate(()=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});});

  await test('K1 misafir FİLO → SEVKİYATLAR → "Bekleyenleri Yeniden Dene (3)": çift dokunuş host\'ta tek uygulama; sonuç metni host yanıtı; başka devlete dokunulmaz',async()=>{
    const fx=await H.evaluate(b=>{const A=G.emps[b];for(const s of G.sys)if(!s.seen.includes(b))s.seen.push(b);
      const far=G.sys.find(s=>s.id!==A.home&&!G.sys[A.home].lanes.includes(s.id)&&(s.owner<0||s.owner===b)&&(findPathAllowed(A,{ships:[{c:'kor'}],e:b},A.home,s.id)||[]).length>1);
      const ana=newFleet(A,far.id,[{c:'kor'}]);ana.name='Araştırma 3';
      const ship=(e,name,d)=>{const f=newFleet(e,e.home,[{c:'kor'},{c:'muh'}]);f.name=name;f.shipment={...d,attempts:d.attempts||0,next:d.next||0,origin:e.home};if(d.fleet!==undefined)f.joinFleet=d.fleet;else f.rallyTo=d.sys;f.path=[];return f;};
      const iso=G.sys.find(s=>s.id!==A.home&&s.id!==far.id&&s.owner<0&&!s.planets.some(p=>p.col)&&!(findPathAllowed(A,{ships:[{c:'kor'}],e:b},A.home,far.id)||[]).includes(s.id));
      for(const l of iso.lanes)G.sys[l].lanes=G.sys[l].lanes.filter(x=>x!==iso.id);iso.lanes=[];if(typeof TRADE_PATHS!=='undefined')TRADE_PATHS.clear?.();
      ship(A,'Arran',{fleet:ana.id,state:'blocked',attempts:2,next:G.day+40,reason:'Bilinen düşman tehdidi — güvenli rota yok'});ship(A,'Lyrdex-59',{fleet:ana.id,state:'paused',attempts:4,reason:'Bilinen düşman tehdidi — güvenli rota yok'});
      ship(A,'Kapalı',{sys:iso.id,state:'blocked',attempts:1,next:G.day+5});const gone=newFleet(A,A.home,[{c:'kor'}]);ship(A,'Kayıp',{fleet:gone.id,state:'blocked',attempts:1});G.fleets.splice(G.fleets.indexOf(gone),1);
      const m=ship(A,'Yolda',{sys:far.id,state:'moving'});m.path=findPath(A.home,far.id,A);
      const other=G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&e.id!==b);const o=ship(other,'Yabancı',{sys:G.sys[other.home].lanes[0],state:'paused',attempts:4});
      window.__retryCalls=0;const orig=shipmentRetryAll;window.shipmentRetryAll=function(){__retryCalls++;return orig.apply(this,arguments);};
      window.__res0=JSON.stringify(A.res);MP1Host.host.publish();return {ana:ana.id,other:o.id};},eB);
    await synced(B);await clean(B);
    await B.evaluate(()=>{View.sel=G.fleets.find(f=>f.e===0&&f.name==='Araştırma 3')||null;});await tap(B,'#tabs [data-x="filo"]');
    await B.waitForSelector('#panel [data-a="shipmentRetryAll"]',{timeout:15000});
    const lbl=await B.locator('#panel [data-a="shipmentRetryAll"]').innerText();M.label=lbl;assert.match(lbl,/Bekleyenleri Yeniden Dene \(3\)/);
    const list=await B.locator('#panel .shipmentsAll').innerText();for(const n of ['Arran','Lyrdex-59','Kapalı','Kayıp','Yolda'])assert.ok(list.includes(n),n);assert.ok(!list.includes('Yabancı'));
    await B.locator('#panel .shipmentsAll').scrollIntoViewIfNeeded();await shot(B,'k1-once');
    const b=B.locator('#panel [data-a="shipmentRetryAll"]').first();await b.scrollIntoViewIfNeeded();await b.tap();await b.tap({force:true,noWaitAfter:true}).catch(()=>{});
    await B.waitForFunction(()=>!!document.querySelector('#panel .shipmentRetryResult')&&!UI._shipmentRetryPending,undefined,{timeout:20000});
    const host=await H.evaluate(([b,oid])=>({n:__retryCalls,st:G.fleets.filter(f=>f.e===b&&f.shipment).map(f=>[f.name,f.shipment.state]),other:G.fleets.find(f=>f.id===oid).shipment.state,res:__res0===JSON.stringify(G.emps[b].res)}),[eB,fx.other]);
    await synced(B);
    const g=await B.evaluate(()=>({res:document.querySelector('#panel .shipmentRetryResult')?.innerText,lbl:document.querySelector('#panel [data-a="shipmentRetryAll"]')?.innerText}));
    M.K1={host,guest:g};assert.equal(host.n,1,'host\'ta tek uygulama');assert.equal(host.other,'paused','başka devletin sevkiyatı değişmedi');assert.equal(host.res,true,'kaynak değişmez');
    assert.equal(g.res,'2 yola çıktı · 1 güvenli rota bekliyor · 1 hedef bulunamadı — hedef değiştir · 1 zaten yolda');assert.match(g.lbl,/\(1\)/);
    await shot(B,'k1-sonra');});

  await test('K2 misafirin SİSTEM paneli: ateşkeste "Kara ordusu bekleniyor", barıştan sonra "KUŞATMA DURDU — savaş sona erdi" (host durumundan)',async()=>{
    const T=await H.evaluate(b=>{const A=G.emps[b],S=G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&e.id!==b&&e.id!==0);S.civics=[];A.contact[S.id]=S.contact[A.id]=true;
      if(!A.war[S.id]){warAuthorize(A,S,{n:'t'});declareWar(A,S);warAuthClear();}
      const T=G.sys[S.home],P=T.planets.find(p=>p.col&&p.owner===S.id);const f=newFleet(A,T.id,[{c:'kor'}]);while(fleetPower(f)<36000)f.ships.push({c:'kor',h:1});f.name='Ana 36K';
      if(!T.surv.includes(b))T.surv.push(b);P.col.shield=0;P.col.garrison=2;P.col.truce=0;P.col.truceAge=5;window.__K2={s:S.id,t:T.id};MP1Host.host.publish();return T.id;},eB);
    await synced(B);await clean(B);await B.evaluate(t=>{View.selSys=G.sys[t];},T);await tap(B,'#tabs [data-x="sistem"]');
    await B.waitForFunction(()=>/GEZEGEN SAVAŞI/.test(document.getElementById('panel').innerText),undefined,{timeout:15000});
    let txt=await B.locator('#panel').innerText();M.truce=txt.split('\n').filter(l=>/ateşkes|Kara ordusu|GEZEGEN/.test(l));assert.match(txt,/Kara ordusu bekleniyor — son direniş korunuyor \(ateşkes 5\/18 ay\)/);
    await B.locator('#panel .siegeSt').first().scrollIntoViewIfNeeded();await shot(B,'k2-ateskes');
    await H.evaluate(b=>{if(!makePeace(G.emps[b],G.emps[__K2.s],'agreement',b))throw Error('barış yok');MP1Host.host.publish();},eB);
    await synced(B);await B.evaluate(()=>UI.refresh());await B.waitForFunction(()=>/KUŞATMA DURDU/.test(document.getElementById('panel').innerText),undefined,{timeout:15000});
    txt=await B.locator('#panel').innerText();M.stop=txt.split('\n').filter(l=>/KUŞATMA DURDU|Kuşatma durdu/.test(l));assert.match(txt,/Kuşatma durdu — gezegen sahibiyle savaş sona erdi \(Diplomatik barış [^,]+, gün \d+\)/);
    await B.locator('#panel .siegeSt[data-code="nowar"]').first().scrollIntoViewIfNeeded();await shot(B,'k2-durdu');});
};
