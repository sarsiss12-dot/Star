'use strict';
/* SAHA-ENTEGRE.0 — SE senaryosu (MP8_SCEN=SE): host + B (misafir, gerçek STARS arayüzü, ayrı Chromium).
   H1 Büyük armalar düğmesi misafirde çalışır (eski: UI.act kapısı engelliyordu).
   H2 Lojistik açık, filo seçili değil: kendi ikmal limanları + ipucu (yalnız renk değil).
   H3 Savaş Merkezi'nde savaş yorgunluğu: host'un yetkili değeri (%88) + %85 uyarısı; rakibinki BİLİNMİYOR.
   H4 Fetih: 5'ten fazla hedef HARİTADAN HEDEF SEÇ ile gerçek harita dokunuşlarıyla seçilir; host önizlemesi talep bedelini verir.
   H5 TÜMÜNÜ KENARA AL: kartlar gizlenir, karar verilmez.
   H6 Savaşa Yardım Teklif Et: müttefikin savaşına katılım VER + alaşım İSTE → host'a gider (no-target değil), host kaydı warJoin taşır. */
module.exports=async X=>{const {test,pg,metrics,sleep,shot,assert,wait,tap,settle,advance}=X;
 const M=metrics.saha={};const H=pg.H,B=pg.B;const EB=await B.evaluate(()=>MP1Join.empireId);
 const lid=real=>B.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const closeB=()=>B.evaluate(()=>{try{UI.closeModal();}catch{}});
 /* Harita aracı düğmeleri 'Harita' grubunun içinde: grup kapalıysa gerçek dokunuşla aç */
 const mapGroup=async p=>{const open=await p.evaluate(()=>{const o=document.getElementById('outMap');return !!o&&o.classList.contains('open');});if(!open)await tap(p,'#grpMap .grpHead');await sleep(300);};   /* grpTog: açıklık 'open' sınıfı */

 await test('H0 fikstür (host): AI O ↔ AI X savaşta, B ile O müttefik; AI F B\'ye savaş açar, B yorgunluğu 88; F\'ye 8 bilinen sistem',async()=>{
   M.fx=await H.evaluate(b=>{const e=G.emps[b],ai=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);const [O,X,F]=ai;
     for(const a of [e,O,X,F])for(const c of [e,O,X,F])if(a!==c){a.contact[c.id]=true;a.ally[c.id]=false;a.war[c.id]=false;if(a.nap)delete a.nap[c.id];if(a.peaceAt)delete a.peaceAt[c.id];}
     e.ally[O.id]=O.ally[e.id]=true;e.rel[O.id]=O.rel[e.id]=80;for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k]||0,8000);O.res.ala=8000;
     warAuthorize(X,O,{n:'Test'});declareWar(X,O);warAuthClear();warAuthorize(F,e,{n:'Test'});declareWar(F,e);warAuthClear();e.exh=e.exh||{};e.exh[F.id]=88;
     const free=G.sys.filter(s=>s.owner<0&&!s.planets.some(p=>p.col)).slice(0,8);e.mapOwners=e.mapOwners||{};for(const s of free){territoryOwnerSet(s,F.id);if(!s.seen.includes(b))s.seen.push(b);e.mapOwners[s.id]=F.id;}   /* misafir yalnız GÖZLEDİĞİ sahipliği bilir: fikstür gözlemi kaydeder */
     for(const s of G.sys)if(s.owner===F.id&&!s.seen.includes(b))s.seen.push(b);
     MP1Host.host.publish();return {O:O.id,X:X.id,F:F.id,fsys:G.sys.filter(s=>s.owner===F.id).length,front:warLedgerFind(O.id,X.id).id};},EB);
   await settle('h0');assert.ok(M.fx.fsys>=8,JSON.stringify(M.fx));});

 await test('H1 misafir "Büyük armalar" düğmesi çalışır (kapı engeli yok)',async()=>{
   const b0=await B.evaluate(()=>BIG_EMBLEMS_ON);await mapGroup(B);await tap(B,'#bigEmblemsBtn');await sleep(300);
   const b1=await B.evaluate(()=>({on:BIG_EMBLEMS_ON,blocked:(document.querySelector('.toast')||{}).textContent||''}));M.h1={b0,...b1};
   assert.equal(b1.on,!b0,'arma kipi değişti');await shot(B,'h1-buyuk-armalar');if(b1.on){await mapGroup(B);await tap(B,'#bigEmblemsBtn');}});

 await test('H2 lojistik: filo seçili değilken ikmal limanları + ipucu (misafir ve host)',async()=>{
   for(const [n,p] of [['B',B],['H',H]]){await p.evaluate(()=>{View.sel=null;});const was=await p.evaluate(()=>LOGI_ON);await mapGroup(p);if(!was)await tap(p,'#logiBtn');await sleep(700);
     const r=await p.evaluate(()=>({on:LOGI_ON,ports:(View._logiHintPorts||[]).length}));M['h2'+n]=r;assert.equal(r.on,true);assert.ok(r.ports>0,n+': ikmal limanı çizildi '+JSON.stringify(r));
     await shot(p,'h2-lojistik-'+n);await mapGroup(p);await tap(p,'#logiBtn');}});

 await test('H3 misafir Savaş Merkezi: yorgunluk %88 + %85 uyarısı (host değeri), rakip BİLİNMİYOR',async()=>{
   await closeB();await B.evaluate(()=>UI.act('activeWars'));
   const ok=await wait(B,()=>/class="exhBar"/.test(document.getElementById('modal').innerHTML),undefined,15000).then(()=>true).catch(()=>false);
   const html=await B.evaluate(()=>document.getElementById('modal').innerHTML);M.h3={ok,pct:/%88/.test(html),warn:/%85'i geçti/.test(html),unk:/BİLİNMİYOR/.test(html)};
   await shot(B,'h3-savas-yorgunlugu');assert.equal(ok,true,'çubuk');assert.equal(M.h3.pct,true);assert.equal(M.h3.warn,true);assert.equal(M.h3.unk,true);await closeB();});

 await test('H4 misafir HARİTADAN HEDEF SEÇ: 6+ sistem gerçek harita dokunuşuyla; host önizlemesi talep bedeli > 0',async()=>{
   const F=await lid(M.fx.F);await closeB();await B.evaluate(f=>{UI._wgSels={};UI._wgSel=null;UI.warGoalPick(f,'fetih');UI._wgSel.targets=[];UI.warGoalPick(f,'fetih');},F);
   await tap(B,'[data-a="wgMap"]');await sleep(400);
   const ids=await B.evaluate(f=>warFetihCandidates(G.p,G.emps[f],{capital:true}).map(x=>x.id),F);M.h4={cands:ids.length};
   for(const id of ids.slice(0,7)){await B.evaluate(id=>{const s=G.sys[id];View.cam.x=s.x;View.cam.y=s.y;},id);await sleep(150);
     const pt=await B.evaluate(id=>{const s=G.sys[id],p=View.w2s(s.x,s.y),r=document.getElementById('map').getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y};},id);
     await B.touchscreen.tap(pt.x,pt.y);await sleep(250);}
   M.h4.picked=await B.evaluate(()=>View.claimPick?View.claimPick.targets.length:-1);await shot(B,'h4-harita-secim');
   await tap(B,'#claimBar [data-a="claimDone"]');await sleep(400);
   M.h4.sel=await B.evaluate(()=>UI._wgSel.targets.length);
   await tap(B,'.mbox.wgPick [data-a="wgGo"]');
   const ok=await wait(B,()=>/Talep bedeli/.test(document.getElementById('modal').innerHTML),undefined,15000).then(()=>true).catch(()=>false);
   M.h4.preview=ok;M.h4.cost=await B.evaluate(()=>{const m=/Talep bedeli: <b>(\d+) Etki/.exec(document.getElementById('modal').innerHTML);return m?+m[1]:0;});
   await shot(B,'h4-onizleme-bedel');assert.ok(M.h4.picked>=6,'haritadan seçilen '+M.h4.picked);assert.equal(M.h4.sel,M.h4.picked,'TAMAM seçimi pencereye taşıdı');
   assert.equal(ok,true,'host önizlemesi');assert.ok(M.h4.cost>0,'talep bedeli');await closeB();});

 await test('H5 misafir TÜMÜNÜ KENARA AL: kartlar gizlenir, karar verilmez',async()=>{
   await closeB();const r=await B.evaluate(()=>{UI.notify({kind:'info',title:'Test bildirimi 1',sub:'a',ico:'ℹ',cls:'sci',key:'t1'});UI.notify({kind:'info',title:'Test bildirimi 2',sub:'b',ico:'ℹ',cls:'sci',key:'t2'});UI.drawInbox();
     return {card:!!document.querySelector('#inbox [data-a="noteStashAll"]')};});
   assert.equal(r.card,true,'kart');await tap(B,'#inbox [data-a="noteStashAll"]');await sleep(300);
   const after=await B.evaluate(()=>(G.inbox||[]).filter(n=>!n.hidden).length);M.h5={...r,after};assert.equal(after,0);});

 await test('H6 misafir Savaşa Yardım Teklif Et: müttefik O\'nun X savaşına katılım VER + 300 alaşım İSTE → host kaydı',async()=>{
   const O=await lid(M.fx.O);await closeB();await B.evaluate(o=>UI.act('deal',o),O);await sleep(500);
   await tap(B,'[data-a="dealHelp"]');
   const row=await wait(B,()=>!!document.querySelector('.dealHelp [data-a="dealHelpPick"]:not([disabled])'),undefined,15000).then(()=>true).catch(()=>false);
   assert.equal(row,true,'host\'tan katılınabilir savaş satırı');await tap(B,'.dealHelp [data-a="dealHelpPick"]');
   const give=await B.evaluate(()=>UI.deal.give.filter(i=>i.t==='warJoin').length);
   await B.evaluate(()=>{UI.deal.want.push({t:'res',r:'ala',v:300});UI.drawDeal();});await shot(B,'h6-yardim-teklifi');
   const before=await H.evaluate(b=>({war:!!G.emps[b].war[G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide)[1].id],ala:G.emps[b].res.ala}),EB);
   await tap(B,'[data-a="dealSend"]');await sleep(2500);
   const after=await H.evaluate(([b,x])=>({war:!!G.emps[b].war[x],ala:G.emps[b].res.ala,offers:(MP1Host.host.dip&&MP1Host.host.dip.offers||[]).length}),[EB,M.fx.X]);
   const trace=await B.evaluate(()=>(MP6Stars.S.dealTrace||[]).slice(-4));M.h6={give,before,after,trace};
   assert.equal(give,1,'VER listesinde warJoin');
   assert.ok(!JSON.stringify(trace).includes('no-target'),'host kapısı reddetmedi: '+JSON.stringify(trace));
   assert.ok(trace.some(t=>t.k==='reply'||t.kind==='reply'||/reply/.test(JSON.stringify(t))),'host yanıtı geldi: '+JSON.stringify(trace));
   await closeB();});
};
