'use strict';
/* TİCARET-AI.1 — TR senaryosu (MP8_SCEN=TR): yolda fiziksel kargo varken MP kaydı → herkes kapanır → relay yeniden başlar → host kaydı YENİ odada açar →
   misafirler yeni kodla döner → kargo tam BİR kez teslim edilir. Host + B + C ayrı Chromium profili, üretim relay süreci + TLS vekili; fiziksel cihaz / Render DEĞİL.
   R0 TB fikstürü (h—n1—n2—[C n3]—n4—n5—[B n6], yalıtılmış zincir) + C'nin B'ye Transit İzni (MP komutları).
   R1 B gerçek masadan ▣ kargo, host gelen kutusundan KABUL; konvoy yola çıkar (yüklendi, teslim edilmedi); B'den bir kez düşer.
   R2 host kaydeder → kapanış → relay yeniden → yeni oda → DEVAM ET: sözleşme / konvoy / makbuz durumu kayıt öncesiyle aynı; kayıp ödeme / yük yok.
   R3 B ana menü ODAYA KATIL + yeni kod, C davet bağlantısı; B aynasında konvoy konumu host ile aynı.
   R4 oyun ilerler: kargo bir kez teslim (host +v, B yeniden ödemez), 60 gün sonra ikinci teslim yok; B aynasında teslim edildi. */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,tap,settle,cmd,origin,open,ctx,startRelay,stopRelay,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS}=X;
 const M=metrics.ai1=metrics.ai1||{};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const V=80;
 const EB=await B().evaluate(()=>MP1Join.empireId),EC=await C().evaluate(()=>MP1Join.empireId);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const days=n=>H().evaluate(n=>{for(let i=0;i<n;i++){G.day+=1;dailyTick(1);}MP1Host.host.publish();},n);
 const stock=()=>H().evaluate(([b,c])=>({h:Math.round(G.p.res.min),b:Math.round(G.emps[b].res.min),c:Math.round(G.emps[c].res.min)}),[EB,EC]);
 const convoy=cid=>H().evaluate(cid=>{const v=G.commerce.convoys.find(v=>v.contract===cid);return v?{id:v.id,status:v.status,at:v.at,step:v.step,loaded:v.loaded,route:v.route}:null;},cid);
 const commerceJson=()=>H().evaluate(()=>JSON.stringify(G.commerce));

 await test('R0 TB fikstürü + C → B Transit İzni (MP komutu); izinle B → host rotası açık',async()=>{
   M.fx=await H().evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});const E=[G.p,G.emps[b],G.emps[c]];
     for(const x of E)for(const y of E)if(x!==y){x.contact[y.id]=true;x.war[y.id]=false;x.rel[y.id]=80;if(x.embargo)delete x.embargo[y.id];if(x.portTransit)delete x.portTransit[y.id];}
     for(const x of E)for(const k of ['min','ene','ala','etk'])x.res[k]=3000;
     const h=G.sys[G.p.home],used=new Set([h.id,...E.map(e=>e.home)]);
     const pool=G.sys.filter(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col)&&!used.has(s.id)&&!G.fleets.some(f=>f.sys===s.id));
     const free=[];let cur=h;for(let i=0;i<6;i++){pool.sort((x,y)=>dist(cur,x)-dist(cur,y)||x.id-y.id);cur=pool.shift();free.push(cur);}
     const chain=[h,...free],ids=new Set(free.map(s=>s.id));
     for(const s of G.sys)if(!ids.has(s.id)&&s.lanes.some(x=>ids.has(x)))s.lanes=s.lanes.filter(x=>!ids.has(x));
     for(let i=1;i<chain.length;i++){const s=chain[i];s.lanes=[chain[i-1].id].concat(i+1<chain.length?[chain[i+1].id]:[]);}
     if(!h.lanes.includes(chain[1].id))h.lanes=h.lanes.concat(chain[1].id);
     const hc=h.planets.find(p=>p.col&&p.owner===0).col;hc.b.liman=1;hc.pop=Math.max(hc.pop,120);
     const mk=(s,e)=>{const pl=s.planets[0];pl.owner=e.id;pl.col=JSON.parse(JSON.stringify(hc));pl.col.e=e.id;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];e.colonies.push({s:s.id,p:0});s.owner=e.id;};
     mk(chain[3],G.emps[c]);mk(chain[6],G.emps[b]);
     for(const s of chain)for(const id of [0,b,c])if(!s.seen.includes(id))s.seen.push(id);
     newFleet(G.emps[b],chain[3].id,[{c:'kor'}],'TR gözcü');newFleet(G.emps[b],h.id,[{c:'kor'}],'TR gözcü uç');newFleet(G.p,chain[6].id,[{c:'kor'}],'TR gözcü uç');
     updateVision();Commerce.state();MP1Host.host.publish();return {h:h.id,n3:chain[3].id,n6:chain[6].id};},[EB,EC]);
   await cmd('C',{kind:'offer',to:EB,give:[{t:'portTransit'}],want:[]});
   const id=await H().waitForFunction(([c,b])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===c&&o.to===b&&o.status==='pending'&&o.give.some(i=>i.t==='portTransit'));return o?o.id:0;},[EC,EB],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await cmd('B',{kind:'respond',offer:id,action:'accept'});await H().waitForFunction(([c,b])=>G.emps[c].portTransit?.[b]>G.day,[EC,EB],{timeout:20000});
   M.r0={route:await H().evaluate(([b,f])=>!!Commerce.route(G.emps[b],G.p,f.n6,f.h),[EB,M.fx])};assert.equal(M.r0.route,true,'izinle rota');});

 await test('R1 B gerçek masadan ▣ kargo → host gelen kutusundan KABUL; konvoy yolda (yüklendi, teslim edilmedi), B\'den bir kez düştü',async()=>{
   const s0=await stock();const host=await lid(B(),0);await closeAll(B());await B().evaluate(o=>UI.act('deal',o),host);await sleep(300);
   await B().evaluate(v=>{UI.deal.give.push({t:'res',r:'min',v});UI.drawDeal();},V);await tap(B(),'[data-a="dealCargoMode"][data-x="on"]');await tap(B(),'[data-a="dealSend"]');
   const id=await H().waitForFunction(([b,v])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===0&&o.status==='pending'&&o.give.some(i=>i.t==='cargo'&&i.v===v));return o?o.id:0;},[EB,V],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await closeAll(H());await H().evaluate(()=>MP71Dip.sync());await H().waitForFunction(id=>G.inbox.some(n=>n.key==='mp71:'+id),id,{timeout:15000});
   {const uid=await H().evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,id);await hit(H(),'[data-a="openNote"][data-x="'+uid+'"]');await hit(H(),'#inboxYes');}
   await H().waitForFunction(id=>MP1Host.host.dip.offers.find(o=>o.id===id)?.status==='accepted',id,{timeout:20000});
   M.cid=await H().evaluate(b=>G.commerce.contracts.filter(c=>c.once&&c.a===b&&c.b===0).at(-1).id,EB);
   let v=null;for(let i=0;i<40;i++){await days(2);v=await convoy(M.cid);if(v&&v.step>0)break;}
   M.r1={s0,s1:await stock(),v};
   assert.ok(v&&v.status!=='delivered'&&v.step>0,'konvoy yolda '+JSON.stringify(v));assert.equal(M.r1.s0.b-M.r1.s1.b,V,'B\'den bir kez düştü');assert.equal(M.r1.s1.h,M.r1.s0.h,'henüz teslim yok');});

 await test('R2 host kaydeder → kapanış → relay yeniden → YENİ oda → DEVAM ET: ticaret durumu (sözleşme / konvoy / makbuz) ve stoklar kayıt öncesiyle birebir',async()=>{
   await closeAll(H());S0=await commerceJson();M.preSave={stock:await stock(),v:await convoy(M.cid),day:await H().evaluate(()=>Math.floor(G.day))};
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   M.saveId=await H().evaluate(async()=>(await MP4Save.list())[0].saveId);
   for(const n of Object.keys(ctx))await ctx[n].close().catch(()=>{});await stopRelay();metrics.relayPidTR=await startRelay();
   const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code1=await h.evaluate(()=>MP1Host.code);assert.notEqual(code1,getCode(),'yeni oda kodu');setCode(code1);M.code1=code1;
   await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   await tap(h,'[data-m="resumeGo"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
   await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await closeAll(h);
   M.postLoad={stock:await stock(),v:await convoy(M.cid),day:await H().evaluate(()=>Math.floor(G.day))};
   assert.equal(await commerceJson(),S0,'G.commerce birebir');assert.deepEqual(M.postLoad.stock,M.preSave.stock,'stoklar aynı');assert.equal(M.postLoad.day,M.preSave.day,'tarih aynı');});

 await test('R3 B ana menü ODAYA KATIL + yeni kod, C davet bağlantısı → kendi devletleri; B aynasında konvoy host ile aynı',async()=>{
   const code=getCode();
   const b=await open('B');await b.addInitScript(TIMERS);await b.goto(origin.B+'/');await wait(b,()=>document.getElementById('mp1Btn'));await tap(b,'#mp1Btn');await tap(b,'[data-m="join"]');
   await b.waitForURL(u=>/\/mp\/play/.test(String(u)),{timeout:20000});await wait(b,()=>document.getElementById('jCode'));await b.fill('#jCode',code);await tap(b,'[data-j="go"]');await ready(b,EB);
   const c=await open('C');await c.addInitScript(TIMERS);await c.goto(origin.C+'/mp/play?code='+code);await wait(c,()=>window.MP1Join&&document.getElementById('jName'));
   if(await c.evaluate(()=>!MP1Join.ws))await tap(c,'[data-j="go"]');await ready(c,EC);
   for(const p of [b,c])assert.equal(await p.evaluate(()=>MP1Join.saveId),M.saveId,'aynı kayıt kimliği');
   for(const p of [b,c])await p.evaluate(CANON+GUESTLIB);await settle('r3');
   const g=await b.evaluate(cid=>{const v=(G.commerce?.convoys||[]).find(v=>v.contract===cid);return v?{at:v.at,step:v.step,status:v.status}:null;},M.cid),hv=await convoy(M.cid);
   M.r3={guest:g,host:{at:hv.at,step:hv.step,status:hv.status}};await shot(b,'tr-r3-b-donus');
   assert.deepEqual(M.r3.guest,M.r3.host,'B aynasında konvoy host ile aynı');});

 await test('R4 oyun ilerler: kargo BİR kez teslim (host +80, B yeniden ödemez); 60 gün sonra ikinci teslim yok; B aynasında teslim edildi',async()=>{
   let v=null;for(let i=0;i<80;i++){await days(5);v=await convoy(M.cid);if(v.status==='delivered'||v.status==='destroyed'||v.status==='lost')break;}
   const s1=await stock();await days(60);const s2=await stock();await settle('r4');
   const g=await B().evaluate(cid=>{const v=(G.commerce?.convoys||[]).find(v=>v.contract===cid);return v?v.status:null;},M.cid);
   M.r4={v,s1,s2,guest:g};
   assert.equal(v.status,'delivered','teslim');assert.equal(s1.h-M.preSave.stock.h,V,'host kayıt öncesine göre tam +80');assert.equal(s1.b,M.preSave.stock.b,'B yeniden ödemedi');
   assert.deepEqual(s2,s1,'ikinci teslim yok');assert.equal(g,'delivered','B aynasında teslim edildi');});
};
let S0=null;
