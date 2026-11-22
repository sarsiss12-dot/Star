'use strict';
/* TİCARET-AĞ.1 — TA senaryosu (MP8_SCEN=TA): host + B + C (ayrı Chromium, gerçek STARS misafir arayüzü). Yerel relay + TLS vekili; fiziksel cihaz / Render DEĞİL.
   A0 fikstür (host): host / B / C limanları, host ↔ B doğrudan hiperhat, kapasite, kaynak.
   A1 B (800×360) gerçek masadan 100 mineral ekler, "▣ Fiziksel Kargo ile Gönder"e dokunur, gönderir; host gelen kutusundan KABUL eder.
      Dört aşama ayrı: (1) misafir komutu host'a ulaştı (bekleyen teklif, madde 'cargo') (2) host kabul etti (teklif kapandı)
      (3) dünya değişti (tek seferlik sözleşme; imzada host'a yazılmadı) (4) B aynası kendi sözleşmesini görüyor.
   A2 konvoy yüklenir (B'den düşer), host'a varışta bir kez yazılır, B aynası teslimi görür; sonra ikinci teslim yok; ikinci kabul reddedilir.
   A3 C gerçek masadan varsayılan "Anlık Kaynak Takası" ile 40 enerji hediye teklifi gönderir → host kabul → anlık; sözleşme / konvoy yok (liman gerekmez).
   A4 gizlilik: C'nin aynasında B'nin sözleşmesi / konvoyu yok. */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,tap,settle}=X;
 const M=metrics.ag1={};const H=pg.H,B=pg.B,C=pg.C;
 const EB=await B.evaluate(()=>MP1Join.empireId),EC=await C.evaluate(()=>MP1Join.empireId);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const days=(n)=>H.evaluate(n=>{for(let i=0;i<n*2;i++){G.day+=.5;dailyTick(.5);}MP1Host.host.publish();},n);
 const accept=async(id)=>{await closeAll(H);await H.evaluate(()=>MP71Dip.sync());await H.waitForFunction(id=>G.inbox.some(n=>n.key==='mp71:'+id),id,{timeout:15000});
   const uid=await H.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,id);await hit(H,'[data-a="openNote"][data-x="'+uid+'"]');await hit(H,'#inboxYes');};

 await test('A0 fikstür (host): limanlar, host ↔ B hiperhat, kapasite, kaynak, temas',async()=>{
   M.fx=await H.evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});const E=[G.p,G.emps[b],G.emps[c]],B=G.emps[b];
     for(const x of E)for(const y of E)if(x!==y){x.contact[y.id]=true;x.war[y.id]=false;x.rel[y.id]=80;if(x.embargo)delete x.embargo[y.id];}
     for(const x of E)for(const k of ['min','ene','ala'])x.res[k]=3000;
     /* host limanı başkentte; B'ye host başkentinin hiperhat komşusu boş sistemde liman (96a fikstürü port() ile aynı kurgu) */
     const hh=G.sys[G.p.home],hcol=hh.planets.find(p=>p.col&&p.owner===0);hcol.col.b.liman=1;hcol.col.pop=Math.max(hcol.col.pop,120);
     const n=hh.lanes.map(i=>G.sys[i]).find(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col));
     const pl=n.planets[0];pl.owner=B.id;pl.col=JSON.parse(JSON.stringify(hcol.col));pl.col.e=B.id;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];B.colonies.push({s:n.id,p:0});n.owner=B.id;
     for(const s of [hh,n])for(const id of [0,b])if(!s.seen.includes(id))s.seen.push(id);
     MP1Host.host.publish();return {hostHome:hh.id,bPort:n.id,route:!!Commerce.route(B,G.p,n.id,hh.id)};},[EB,EC]);
   await settle('a0');assert.equal(M.fx.route,true,'host ↔ B rota');});

 await test('A1 B (800×360) gerçek masa: 100 mineral + "Fiziksel Kargo ile Gönder" → host gelen kutusundan KABUL; dört aşama ayrı',async()=>{
   await B.setViewportSize({width:800,height:360});const host=await lid(B,0);await closeAll(B);await B.evaluate(o=>UI.act('deal',o),host);await sleep(400);
   await B.evaluate(()=>{UI.deal.give.push({t:'res',r:'min',v:100});UI.drawDeal();});
   const btn='[data-a="dealCargoMode"][data-x="on"]';await B.locator(btn).first().scrollIntoViewIfNeeded();
   const vis=await B.evaluate(s=>{const el=document.querySelector(s);const r=el.getBoundingClientRect();const at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {w:r.width,h:r.height,in:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,top:!!(at&&(at===el||el.contains(at)))};},btn);
   await tap(B,btn);await shot(B,'a1-kargo-secimi-800x360');
   const item=await B.evaluate(()=>UI.deal.give.map(i=>i.t));M.a1={vis,item};
   assert.equal(vis.in&&vis.top,true,'800×360: kargo düğmesi görünür ve üstte '+JSON.stringify(vis));assert.deepEqual(item,['cargo'],'madde fiziksel kargoya döndü');
   const before=await H.evaluate(b=>({h:G.p.res.min,b:G.emps[b].res.min,c:(G.commerce?.contracts||[]).length}),EB);
   M.a1q=await B.evaluate(()=>{const d=UI.deal;const q=dealQuote({from:0,to:d.to,give:d.give,want:d.want});return {ok:q.ok,reasons:q.reasons,dis:document.querySelector('[data-a="dealSend"]')?.disabled};});console.log('  A1q '+JSON.stringify(M.a1q));
   await tap(B,'[data-a="dealSend"]');
   const id=await H.waitForFunction(b=>{const o=MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===0&&o.status==='pending'&&o.give.some(i=>i.t==='cargo'));return o?o.id:0;},EB,{timeout:20000,polling:200}).then(h=>h.jsonValue());   /* (1) */
   await accept(id);
   const st=await H.waitForFunction(id=>{const o=MP1Host.host.dip.offers.find(o=>o.id===id);return o&&o.status!=='pending'?o.status:null;},id,{timeout:15000}).then(h=>h.jsonValue());   /* (2) */
   const w=await H.evaluate(([b,id])=>{const c=(G.commerce.contracts||[]).find(c=>c.once&&c.a===b&&c.b===0||c.once&&c.a===0&&c.b===b);return {c:c?{id:c.id,legs:c.legs.map(l=>[l.e,l.to,l.r,l.v])}:null,h:G.p.res.min};},[EB,id]);   /* (3) */
   const seen=await wait(B,cid=>(G.commerce?.contracts||[]).some(c=>c.id===cid&&c.legs.some(l=>l.e===0&&l.r==='min')),w.c&&w.c.id,20000).then(()=>true).catch(()=>false);   /* (4) */
   M.a1={...M.a1,offer:id,status:st,contract:w.c,hostAfterSign:w.h,before,guestSees:seen};M.cid=w.c&&w.c.id;M.offer=id;M.before=before;
   assert.equal(st,'accepted','(2) host kabul etti');assert.ok(w.c,'(3) tek seferlik sözleşme');assert.equal(w.h,before.h,'(3) imzada host stoğuna yazılmadı');assert.equal(seen,true,'(4) B aynası sözleşmeyi görüyor');});

 await test('A2 yükleme B\'den düşer, varışta host\'a bir kez yazılır, B aynası teslimi görür; ikinci teslim / ikinci kabul yok',async()=>{
   let st=null;for(let i=0;i<40&&!(st&&st.done);i++){await days(5);st=await H.evaluate(cid=>{const vs=G.commerce.convoys.filter(v=>v.contract===cid);return {done:vs.length>0&&vs.every(v=>v.status==='delivered'),vs:vs.map(v=>[v.status,v.loaded])};},M.cid);}
   const after=await H.evaluate(b=>({h:G.p.res.min,b:G.emps[b].res.min}),EB);
   const gs=await wait(B,cid=>(G.commerce?.convoys||[]).some(v=>v.contract===cid&&v.status==='delivered'),M.cid,20000).then(()=>true).catch(()=>false);
   await days(60);const later=await H.evaluate(b=>({h:G.p.res.min,b:G.emps[b].res.min}),EB);
   const dup=await H.evaluate(id=>MP1Host.host.local({kind:'respond',offer:id,action:'accept'}),M.offer);
   M.a2={st,after,later,guestDelivered:gs,dup:dup&&(dup.code||dup.why||dup.ok)};
   assert.equal(st&&st.done,true,'konvoy teslim: '+JSON.stringify(st));assert.equal(Math.round(after.h-M.before.h),100,'host bir kez aldı');assert.equal(Math.round(M.before.b-after.b),100,'B bir kez ödedi (yüklemede)');
   assert.equal(gs,true,'B aynası teslimi görüyor');assert.equal(later.h,after.h,'ikinci teslim yok');assert.notEqual(dup&&dup.ok,true,'ikinci kabul yok');});

 await test('A3 C varsayılan "Anlık Kaynak Takası" ile 40 enerji hediye teklifi → host KABUL → anlık; sözleşme / konvoy yok',async()=>{
   const host=await lid(C,0);await closeAll(C);await C.evaluate(o=>UI.act('deal',o),host);await sleep(400);
   await C.evaluate(()=>{UI.deal.give.push({t:'res',r:'ene',v:40});UI.drawDeal();});
   const mode=await C.evaluate(()=>document.querySelector('.dealCargoMode')?.dataset.mode||null);
   const before=await H.evaluate(c=>({h:G.p.res.ene,c:G.emps[c].res.ene,k:G.commerce.contracts.length,v:G.commerce.convoys.length}),EC);
   await tap(C,'[data-a="dealSend"]');
   const id=await H.waitForFunction(c=>{const o=MP1Host.host.dip.offers.find(o=>o.from===c&&o.to===0&&o.status==='pending'&&o.give.some(i=>i.t==='res'));return o?o.id:0;},EC,{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await accept(id);await H.waitForFunction(id=>MP1Host.host.dip.offers.find(o=>o.id===id)?.status!=='pending',id,{timeout:15000});
   const after=await H.evaluate(c=>({h:G.p.res.ene,c:G.emps[c].res.ene,k:G.commerce.contracts.length,v:G.commerce.convoys.length}),EC);
   M.a3={mode,before,after};
   assert.equal(mode,'instant','varsayılan anlık');assert.equal(Math.round(after.h-before.h),40,'host anında aldı');assert.equal(Math.round(before.c-after.c),40,'C anında ödedi');
   assert.equal(after.k,before.k,'sözleşme yok');assert.equal(after.v,before.v,'konvoy yok');});

 await test('A4 gizlilik: C aynasında B\'nin sözleşmesi / konvoyu yok',async()=>{
   const c=await C.evaluate(()=>({k:(G.commerce?.contracts||[]).length,v:(G.commerce?.convoys||[]).length}));M.a4=c;
   assert.equal(c.k,0,'C sözleşme görmüyor');assert.equal(c.v,0,'C konvoy görmüyor');});
};
