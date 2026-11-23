'use strict';
/* TİCARET-AI.0 Faz 0 — TB senaryosu (MP8_SCEN=TB): host + B + C (ayrı Chromium, gerçek STARS misafir arayüzü), yerel relay + TLS; fiziksel cihaz / Render DEĞİL.
   Fikstür: host başkenti h — n1 — n2 — [C limanı n3] — n4 — n5 — [B limanı n6] zinciri (yalnız bu hatlar eklenir). B → host kargosu yalnız C'nin
   ara limanından geçebilir (liman arası ≤3 sıçrama), bu yüzden C'nin B'ye Transit İzni gerekir.
   B0 izin yokken rota yok. B1 C gerçek masadan izni verir, B gelen kutusundan KABUL → rota açılır.
   B2 B gerçek masadan ▣ fiziksel kargo, host KABUL; konvoy n3'ten geçer, host'a bir kez, B'den bir kez; yolda B aynası konumu host ile aynı.
   B3 ikinci kargo yolda iken C izni masadan geri alır → konvoy n3'ten aktarma yapmaz, teslim olmaz, kimseye yazılmaz.
   B4 izin geri verilir, ardından n3 gerçek sahiplik değişimiyle (captureSystem) AI X'e geçer → eski izin X adına sayılmaz, teslim yok, X / C yük almaz. */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,tap,settle,cmd}=X;
 const M=metrics.ai0=metrics.ai0||{};const H=pg.H,B=pg.B,C=pg.C;
 const EB=await B.evaluate(()=>MP1Join.empireId),EC=await C.evaluate(()=>MP1Join.empireId);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const days=n=>H.evaluate(n=>{for(let i=0;i<n;i++){G.day+=1;dailyTick(1);}MP1Host.host.publish();},n);
 const inboxAccept=async(page,match)=>{await closeAll(page);await page.waitForFunction(m=>{MP71Dip.tick();return DiplomaticInbox.state().records.some(r=>r.status==='pending'&&r.kind!=='fedvote'&&(r.mp===m||m===null));},match,{timeout:20000});
   const rid=await page.evaluate(m=>DiplomaticInbox.state().records.filter(r=>r.status==='pending'&&r.kind!=='fedvote'&&(r.mp===m||m===null)).at(-1).id,match);
   await page.evaluate(id=>ArchiveUI.record(id),rid);await hit(page,'#inboxYes');};
 const route=()=>H.evaluate(([b,f])=>!!Commerce.route(G.emps[b],G.p,f.n6,f.h),[EB,M.fx]);

 await test('B0 fikstür: h—n1—n2—[C n3]—n4—n5—[B n6] zinciri; izin yokken B → host rotası yok',async()=>{
   M.fx=await H.evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});const E=[G.p,G.emps[b],G.emps[c]];
     for(const x of E)for(const y of E)if(x!==y){x.contact[y.id]=true;x.war[y.id]=false;x.rel[y.id]=80;if(x.embargo)delete x.embargo[y.id];if(x.portTransit)delete x.portTransit[y.id];}
     for(const x of E)for(const k of ['min','ene','ala','etk'])x.res[k]=3000;
     const h=G.sys[G.p.home],used=new Set([h.id,...E.map(e=>e.home)]);
     const pool=G.sys.filter(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col)&&!used.has(s.id)&&!G.fleets.some(f=>f.sys===s.id));
     const free=[];let cur=h;for(let i=0;i<6;i++){pool.sort((x,y)=>dist(cur,x)-dist(cur,y)||x.id-y.id);cur=pool.shift();free.push(cur);}   /* en yakın komşu zinciri: kısa yolculuk */
     const chain=[h,...free],ids=new Set(free.map(s=>s.id));
     /* zinciri yalıt: n1–n6 yalnız zincir komşularına bağlı (başka sistemlerin onlara hattı kaldırılır) → B → host her yol n3'ten geçer */
     for(const s of G.sys)if(!ids.has(s.id)&&s.lanes.some(x=>ids.has(x)))s.lanes=s.lanes.filter(x=>!ids.has(x));
     for(let i=1;i<chain.length;i++){const s=chain[i];s.lanes=[chain[i-1].id].concat(i+1<chain.length?[chain[i+1].id]:[]);}
     if(!h.lanes.includes(chain[1].id))h.lanes=h.lanes.concat(chain[1].id);
     const hc=h.planets.find(p=>p.col&&p.owner===0).col;hc.b.liman=1;hc.pop=Math.max(hc.pop,120);
     const mk=(s,e)=>{const pl=s.planets[0];pl.owner=e.id;pl.col=JSON.parse(JSON.stringify(hc));pl.col.e=e.id;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];e.colonies.push({s:s.id,p:0});s.owner=e.id;};
     mk(chain[3],G.emps[c]);mk(chain[6],G.emps[b]);
     for(const s of chain)for(const id of [0,b,c])if(!s.seen.includes(id))s.seen.push(id);
     /* taşıyıcı yabancı limanı yalnız tanıyorsa aktarma yapabilir (Commerce.identifiedPort: istihbarat ≥2 ya da anlık sensör görüşü) → B'nin n3'te gözcü gemisi */
     newFleet(G.emps[b],chain[3].id,[{c:'kor'}],'TB gözcü');newFleet(G.emps[b],h.id,[{c:'kor'}],'TB gözcü uç');newFleet(G.p,chain[6].id,[{c:'kor'}],'TB gözcü uç');   /* uç limanlar da karşılıklı tanınmalı */
     updateVision();   /* host görüşü (pVis / G.vis) yeni gözcülerle tazelenir */Commerce.state();MP1Host.host.publish();
     return {h:h.id,n3:chain[3].id,n6:chain[6].id,chain:chain.map(s=>s.id)};},[EB,EC]);
   await settle('b0');M.b0=await route();assert.equal(M.fx.chain.length,7,'yedi sistemlik zincir');assert.equal(M.b0,false,'izinsiz rota yok');});

 await test('B1 C gerçek masadan B\'ye Transit İzni verir, B gelen kutusundan KABUL → izin + rota',async()=>{
   const b=await lid(C,EB);await closeAll(C);await C.evaluate(id=>{UI.forgetDeal(id);UI.openDeal(id);},b);await tap(C,'[data-a="dealAdd"][data-x="give:portTransit"]');await tap(C,'[data-a="dealSend"]');
   const id=await H.waitForFunction(([c,b])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===c&&o.to===b&&o.status==='pending'&&o.give.some(i=>i.t==='portTransit'));return o?o.id:0;},[EC,EB],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await inboxAccept(B,id);await H.waitForFunction(([c,b])=>G.emps[c].portTransit?.[b]>G.day,[EC,EB],{timeout:20000});
   M.b1={offer:id,route:await route()};assert.equal(M.b1.route,true,'izinle rota açıldı');});

 const sendCargo=async(v)=>{const host=await lid(B,0);await closeAll(B);await B.evaluate(o=>UI.act('deal',o),host);await sleep(300);
   await B.evaluate(v=>{UI.deal.give.push({t:'res',r:'min',v});UI.drawDeal();},v);await tap(B,'[data-a="dealCargoMode"][data-x="on"]');await tap(B,'[data-a="dealSend"]');
   const id=await H.waitForFunction(([b,v])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===0&&o.status==='pending'&&o.give.some(i=>i.t==='cargo'&&i.v===v));return o?o.id:0;},[EB,v],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await closeAll(H);await H.evaluate(()=>MP71Dip.sync());await H.waitForFunction(id=>G.inbox.some(n=>n.key==='mp71:'+id),id,{timeout:15000});   /* TA / SG ile aynı host gelen kutusu yolu */
   {const uid=await H.evaluate(id=>G.inbox.find(n=>n.key==='mp71:'+id).uid,id);await hit(H,'[data-a="openNote"][data-x="'+uid+'"]');await hit(H,'#inboxYes');}
   await H.waitForFunction(id=>MP1Host.host.dip.offers.find(o=>o.id===id)?.status==='accepted',id,{timeout:20000});
   return H.evaluate(b=>G.commerce.contracts.filter(c=>c.once&&c.a===b&&c.b===0).at(-1).id,EB);};
 const convoy=cid=>H.evaluate(cid=>{const v=G.commerce.convoys.find(v=>v.contract===cid);return v?{id:v.id,status:v.status,at:v.at,step:v.step,route:v.route,loaded:v.loaded}:null;},cid);

 await test('B2 B gerçek masadan ▣ kargo → host KABUL; konvoy C\'nin ara limanından (n3) geçer, tek teslim, yolda B aynası konumu host ile aynı',async()=>{
   const s0=await H.evaluate(b=>({h:G.p.res.min,b:G.emps[b].res.min,c:G.emps[3]?.res?.min}),EB);const cid=await sendCargo(80);const visited=new Set();let mid=null;
   for(let i=0;i<80;i++){await days(5);const v=await convoy(cid);if(v){visited.add(v.at);if(!mid&&v.status!=='delivered'&&v.step>0){await settle('b2-orta');const g=await B.evaluate(cid=>{const v=(G.commerce?.convoys||[]).find(v=>v.contract===cid);return v?{at:v.at,step:v.step}:null;},cid);const h=await convoy(cid);mid={host:{at:h.at,step:h.step},guest:g};}
     if(v.status==='delivered')break;}}
   const v=await convoy(cid),s1=await H.evaluate(b=>({h:G.p.res.min,b:G.emps[b].res.min}),EB);await days(60);const s2=await H.evaluate(b=>({h:G.p.res.min}),EB);
   M.b2={cid,v,mid,visited:[...visited],s0,s1,s2};
   assert.equal(v.status,'delivered','teslim');assert.ok(v.route.includes(M.fx.n3),'rota C ara limanından');assert.ok(visited.has(M.fx.n3),'konvoy n3\'e vardı');
   assert.equal(Math.round(s1.h-s0.h),80,'host bir kez aldı');assert.equal(Math.round(s0.b-s1.b),80,'B bir kez ödedi');assert.equal(s2.h,s1.h,'ikinci teslim yok');
   assert.ok(mid&&mid.guest&&mid.guest.at===mid.host.at&&mid.guest.step===mid.host.step,'yolda misafir konumu host ile aynı '+JSON.stringify(mid));});

 await test('B3 ikinci kargo yolda iken C izni gerçek masadan geri alır → n3\'ten aktarma yok, teslim yok, kimseye yazılmaz',async()=>{
   const cid=await sendCargo(50);await days(3);const v0=await convoy(cid);
   const b=await lid(C,EB);await closeAll(C);await C.evaluate(id=>{UI.forgetDeal(id);UI.openDeal(id);},b);await tap(C,'[data-a="revokePortTransit"]');
   await H.waitForFunction(([c,b])=>!(G.emps[c].portTransit?.[b]>G.day),[EC,EB],{timeout:20000});
   const s0=await H.evaluate(([b,c])=>({h:G.p.res.min,c:G.emps[c].res.min}),[EB,EC]);await days(400);const v1=await convoy(cid),s1=await H.evaluate(([b,c])=>({h:G.p.res.min,c:G.emps[c].res.min}),[EB,EC]);
   M.b3={cid,v0,v1,s0,s1};
   assert.notEqual(v1.status,'delivered','izinsiz teslim yok');assert.equal(s1.h,s0.h,'host\'a yazılmadı');assert.equal(s1.c,s0.c,'ara liman sahibine yazılmadı');
   assert.ok(!(v1.step>v1.route.indexOf(M.fx.n3)&&v1.route.indexOf(M.fx.n3)>=0&&v0.step<=v0.route.indexOf(M.fx.n3)),'n3\'ten geçmedi '+JSON.stringify({v0,v1}));});

 await test('B4 izin geri verilir, n3 gerçek sahiplik değişimiyle AI X\'e geçer → eski izin X adına sayılmaz; teslim yok, X / C yük almaz',async()=>{
   const r=await cmd('C',{kind:'offer',to:EB,give:[{t:'portTransit'}],want:[]});const id=await H.waitForFunction(([c,b])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===c&&o.to===b&&o.status==='pending'&&o.give.some(i=>i.t==='portTransit'));return o?o.id:0;},[EC,EB],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await cmd('B',{kind:'respond',offer:id,action:'accept'});await H.waitForFunction(([c,b])=>G.emps[c].portTransit?.[b]>G.day,[EC,EB],{timeout:20000});
   const st=await H.evaluate(([b,c,n3])=>{const Xe=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);const s=G.sys[n3];captureSystem(s,Xe.id);MP1Host.host.publish();
     return {x:Xe.id,owner:s.owner,colOwner:s.planets[0].owner,xMin:Xe.res.min,cMin:G.emps[c].res.min,route:!!Commerce.route(G.emps[b],G.p,G.emps[b].colonies.find(k=>G.sys[k.s].planets[k.p].col?.b?.liman)?.s,G.p.home)};},[EB,EC,M.fx.n3]);
   const cid=await sendCargo(40).catch(e=>'ret:'+String(e.message).slice(0,80));await days(400);
   const s1=await H.evaluate(([x,c])=>({xMin:G.emps[x].res.min,cMin:G.emps[c].res.min,h:G.p.res.min}),[st.x,EC]);const v=typeof cid==='number'?await convoy(cid):null;
   M.b4={st,cid,v,s1,offerCmd:r&&r.status};
   assert.equal(st.colOwner,st.x,'n3 limanı X\'e geçti');assert.equal(st.route,false,'X adına izin yok → rota kapalı');
   assert.ok(typeof cid!=='number'||v.status!=='delivered','teslim yok');assert.equal(s1.xMin,st.xMin,'X yük almadı');assert.equal(s1.cMin,st.cMin,'C yük almadı');});
};
