'use strict';
/* MP-FIELD-FIX.0 — senaryonun ikinci yarısı (Z5–Z9); bkz. mp-field-fix0-mp.cjs başlığı. */
module.exports=async(X,{E,M,ready,where,closeUI,cards,swipe})=>{const {test,pg,metrics,out,sleep,shot,assert,wait,tap,origin,open,ctx,startRelay,stopRelay,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const saved={};
 const hostCards=()=>H().evaluate(()=>{UI.drawInbox();return [...document.querySelectorAll('#inbox .nCard')].map(c=>(c.querySelector('.nTxt b')||c).textContent.trim());});
 const statusList=p=>p.evaluate(()=>{UI.act('topStatus');const t=document.getElementById('modal').innerText;UI.closeModal();return t;});
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);   /* π: misafirde 0 ↔ kendi gerçek kimliği */

 await test('Z5 kaydet → host ve misafirler kapanır → relay yeniden başlar → host kaydı YENİ odada açar ve misafir yokken devam eder: bekleyen / gizlenen olay doğru, tarih ilerlerken yeni olay ve anomali şeritte ve listede',async()=>{
   await closeUI(H());
   saved.ev=await H().evaluate(()=>{AUTO_EVENT=false;const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);if(evs.length<3)throw Error('olay kataloğu '+evs.length);const a=evs[0],b=evs[1];UI.event(a);UI.event(b);UI.closeModal();
     const nb=G.inbox.find(n=>n.key==='ev:'+b.id);UI.noteSwipe(nb.uid);UI.closeModal();return {a:a.n,b:b.n,keys:G.inbox.map(n=>[n.key,!!n.hidden])};});
   saved.bPending=await H().evaluate(b=>G.emps[b].decisions.pending.filter(n=>n.status==='pending').map(n=>n.id),E.B);
   saved.day=await H().evaluate(()=>Math.floor(G.day));saved.swiped=await B().evaluate(()=>[...MP6Stars.S.swiped]);
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   saved.saveId=await H().evaluate(async()=>(await MP4Save.list())[0].saveId);
   for(const n of ['B','C']){const s=await pg[n].evaluate(id=>JSON.parse(localStorage.getItem('mp4:save:'+id)||'null'),saved.saveId);assert(s&&s.empire===E[n],n+' cihazında kayıt kimliği');}
   for(const n of Object.keys(ctx))await ctx[n].close().catch(()=>{});await stopRelay();metrics.relayPid2=await startRelay();
   const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code1=await h.evaluate(()=>MP1Host.code);assert.notEqual(code1,getCode(),'yeni oda kodu');setCode(code1);M.code1=code1;
   await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   /* misafir yokken devam: DEVAM ET → "n oyuncu bağlı değil" onayı */
   await tap(h,'[data-m="resumeGo"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
   await closeUI(h);const st=await h.evaluate(()=>({day:Math.floor(G.day),keys:G.inbox.map(n=>[n.key,!!n.hidden])}));M.hostAlone={saved:saved.ev,after:st};
   assert.equal(st.day,saved.day,'kayıt tarihi korunur');
   for(const [k,hid] of saved.ev.keys.filter(([k])=>/^ev:/.test(k)))assert(st.keys.some(([k2,h2])=>k2===k&&h2===hid),'olay '+k+' gizli='+hid+' korunur: '+JSON.stringify(st.keys));
   const vis=await hostCards();M.hostAlone.cards=vis;assert(vis.includes(saved.ev.a),'bekleyen olay şeritte: '+JSON.stringify(vis));assert(!vis.includes(saved.ev.b),'gizlenen olay şeritte değil');
   const list=await statusList(h);M.hostAlone.list=list.slice(0,500);assert(list.includes(saved.ev.b),'gizlenen olay ☰ listesinde: '+list.slice(0,300));await shot(h,'z5-host-tek-olaylar');
   /* gerçek oyun döngüsü: tarih ilerler; deterministik tetikleyici (olay + anomali) üretilir */
   await h.evaluate(()=>{MP1Host.host.local({kind:'speed',value:4});});await wait(h,d=>G.day>=d+3,saved.day,60000);await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
   const neu=await h.evaluate(()=>{const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);const c=evs[2];UI.event(c);UI.closeModal();const an=ANOMALIES.find(a=>a.ch&&a.ch.length>1)||ANOMALIES[0];const s=G.sys.find(s=>s.owner===G.p.id&&s.id!==G.p.home)||G.sys[G.p.home];UI.anomaly(an,s);UI.closeModal();return {ev:c.n,an:'Anomali — '+s.name,day:Math.floor(G.day)};});
   const vis2=await hostCards(),list2=await statusList(h);M.hostAlone.newer={neu,cards:vis2,list:list2.slice(0,500)};await shot(h,'z5-host-yeni-olay');
   assert(neu.day>saved.day,'tarih ilerledi');assert(vis2.includes(neu.ev),'yeni olay şeritte: '+JSON.stringify(vis2));assert(vis2.some(t=>t.includes(neu.an.replace('Anomali — ',''))),'yeni anomali şeritte');assert(list2.includes(neu.ev),'yeni olay listede');});

 await test('Z6 misafirler yeni odaya döner: B ana menü ODAYA KATIL + yeni kod, C eski /mp/join bağlantısı → aynı devletler; tarih ve bekleyen kararlar korunur; kaydırılan kart geri gelmez; kimliksiz X "OYUNCU KİMLİĞİ DOĞRULANAMADI"',async()=>{
   const code=getCode();for(const n of ['B','C','X'])if(ctx[n])await ctx[n].close().catch(()=>{});   /* önceki adım yarıda kaldıysa profiller serbest */
   const b=await open('B');await b.addInitScript(TIMERS);await b.goto(origin.B+'/');await wait(b,()=>document.getElementById('mp1Btn'));await tap(b,'#mp1Btn');await tap(b,'[data-m="join"]');
   await b.waitForURL(u=>/\/mp\/play/.test(String(u)),{timeout:20000});await wait(b,()=>document.getElementById('jCode'));await b.fill('#jCode',code);await tap(b,'[data-j="go"]');await ready(b,E.B);
   /* kimliksiz X, C dönmeden (oda dolu değilken) aynı odaya girmeyi dener: oda bulunur, kimlik doğrulanamaz */
   const x=await open('X');await x.addInitScript(TIMERS);await x.goto(origin.X+'/mp/play?code='+code);await wait(x,()=>window.MP1Join&&document.getElementById('jName'));await x.fill('#jName','Xen');await tap(x,'[data-j="go"]');
   await wait(x,()=>MP1Join.screen==='join'&&!!MP1Join.err,undefined,30000);M.visitor=await where(x);await shot(x,'z6-kimlik');await ctx.X.close();
   assert.equal(M.visitor.stage,'kimlik',JSON.stringify(M.visitor));assert.match(M.visitor.status,/OYUNCU KİMLİĞİ DOĞRULANAMADI/);
   const c=await open('C');await c.addInitScript(TIMERS);await c.goto(origin.C+'/mp/join?code='+code);await wait(c,()=>location.pathname==='/mp/play'&&document.getElementById('jName'));
   if(await c.evaluate(()=>!MP1Join.ws))await tap(c,'[data-j="go"]');await ready(c,E.C);
   for(const p of [b,c])await p.evaluate(CANON+GUESTLIB);await settle('z6');
   const hp=await H().evaluate(b=>G.emps[b].decisions.pending.filter(n=>n.status==='pending').map(n=>n.id),E.B);assert.deepEqual(hp,saved.bPending,'B\'nin bekleyen kararları korunur');
   const g=await b.evaluate(()=>({day:Math.floor(G.day),pending:(G.p.decisions?.pending||[]).filter(n=>n.status==='pending').map(n=>n.id),inbox:G.inbox.filter(n=>n.decisionId).map(n=>[n.key,!!n.hidden]),swiped:[...MP6Stars.S.swiped]}));
   const hd=await H().evaluate(()=>Math.floor(G.day));M.rejoin={g,hd,saved:{pending:saved.bPending,swiped:saved.swiped}};if(g.day!==hd){await settle('z6b');g.day=await b.evaluate(()=>Math.floor(G.day));M.rejoin.day2=g.day;}
   assert.equal(g.day,hd,'misafir tarihi host ile aynı');assert.deepEqual(g.pending.sort(),saved.bPending.slice().sort(),'misafirde bekleyen kararlar');
   for(const k of saved.swiped)if(/^personal:/.test(k)){const r=g.inbox.find(([k2])=>k2===k);if(r)assert.equal(r[1],true,'kaydırılmış karar gizli kalır: '+k);}
   await shot(b,'z6-b-dondu');});

 /* ---- Fetih fikstürü: B ile temaslı, savaşta / ittifakta olmayan üç AI ---- */
 await test('Z7 Fetih hedef seçimi: tek sistemli hedefte 0/0 + neden + pasif düğme + Vasallaştırmaya dön; pencere AÇIKKEN keşfedilen sistem listeye girer; başkent dışı hedefle seçim → önizleme → onay → gerçek savaş (misafir); host\'ta aynı kural',async()=>{
   await closeUI(B());
   const fx=await H().evaluate(b=>{const e=G.emps[b],v=humanVisionContext(e).visible;const ok=o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!e.war[o.id]&&!e.ally[o.id]&&!(e.nap?.[o.id]>G.day);
     const ais=G.emps.filter(ok);for(const o of ais){e.contact[o.id]=o.contact[e.id]=true;}
     const far=o=>G.sys.filter(s=>s.owner===o.id&&s.id!==o.home&&!v.has(s.id));
     if(ais.length<3)return {err:'fixture',ais:ais.length};const [t1,t2,t3]=ais;
     /* AÇIK FİKSTÜR: oyun başında AI'lar çoğunlukla yalnız başkentine sahip — T2'ye ve T3'e motorun territoryOwnerSet'iyle başkent dışı sistem verilir
        (T3'ünki B'nin görüşü dışında: B bilmez) */
     const free=(o,hid)=>G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col)&&G.sys[o.home].lanes.includes(s.id)&&(!hid||!v.has(s.id)))||G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col)&&(!hid||!v.has(s.id)));
     if(!G.sys.some(s=>s.owner===t2.id&&s.id!==t2.home))territoryOwnerSet(free(t2,false),t2.id);if(!far(t3).length)territoryOwnerSet(free(t3,true),t3.id);
     if(!far(t3).length)return {err:'fixture-t3'};
     /* T1: tek sistemli hedef (başkent dışı sistemleri sahipsiz; açık fikstür) */for(const s of G.sys.filter(s=>s.owner===t1.id&&s.id!==t1.home))territoryOwnerSet(s,-1);
     const hs=G.sys[t1.home];if(!hs.seen.includes(b))hs.seen.push(b);e.mapOwners=e.mapOwners||{};e.mapOwners[hs.id]=t1.id;
     /* T2: B'nin daha önce gözlediği başkent dışı sistem */const s2=G.sys.find(s=>s.owner===t2.id&&s.id!==t2.home);if(!s2.seen.includes(b))s2.seen.push(b);e.mapOwners[s2.id]=t2.id;
     /* T3: başkent dışı sistemleri B için bilinmiyor (görüş dışında) */const s3=far(t3)[0];for(const s of G.sys.filter(s=>s.owner===t3.id&&s.id!==t3.home)){s.seen=s.seen.filter(x=>x!==b);delete e.mapOwners[s.id];}
     const h3=G.sys[t3.home];if(!h3.seen.includes(b))h3.seen.push(b);e.mapOwners[h3.id]=t3.id;
     MP1Host.host.publish();return {t1:t1.id,t2:t2.id,t3:t3.id,s2:s2.id,s3:s3.id};},E.B);
   M.fetih={fx};assert(!fx.err,'fikstür: üç uygun AI');await settle('z7');
   const L={t1:await lid(B(),fx.t1),t2:await lid(B(),fx.t2),t3:await lid(B(),fx.t3)};
   const openPick=async t=>{await closeUI(B());await B().evaluate(t=>UI.selectDiplo(t,'relation'),t);await wait(B(),t=>document.querySelector(`[data-a="war"][data-x="${t}"]`),t);
     await B().evaluate(t=>{const d=document.querySelector(`[data-a="war"][data-x="${t}"]`).closest('details');if(d)d.open=true;},t);await tap(B(),`[data-a="war"][data-x="${t}"]`);
     await tap(B(),`#modal [data-a="setwg"][data-x="${t}:fetih"]`);await wait(B(),()=>document.querySelector('#modal .mbox.wgPick'));};
   const pick=()=>B().evaluate(()=>{const b=document.querySelector('#modal [data-a="wgGo"]');return {lead:document.querySelector('#wgPickRoot .lead')?.textContent||'',why:[...document.querySelectorAll('#modal .wgWhy')].map(x=>x.textContent),
     n:document.querySelectorAll('#modal [data-a="wgTarget"]').length,ids:[...document.querySelectorAll('#modal [data-a="wgTarget"]')].map(x=>+x.dataset.x),off:!!b&&b.disabled,op:b?+getComputedStyle(b).opacity:1,vas:!!document.querySelector('#modal [data-a="setwg"][data-x$=":boyun"]'),live:!!document.querySelector('#modal .mbox.liveWorld')};});
   /* T1: tek sistemli hedef */
   await openPick(L.t1);const p1=await pick();M.fetih.t1=p1;await shot(B(),'z7-tek-sistem');
   assert.match(p1.lead,/\(0\/0\)/);assert.equal(p1.n,0);assert.equal(p1.off,true,'önizleme pasif');assert(p1.op<0.6,'görsel olarak da pasif (opaklık '+p1.op+')');assert(p1.why.some(t=>/başkent/.test(t)),'neden aynı ekranda: '+JSON.stringify(p1.why));
   assert.equal(p1.vas,true,'Vasallaştırmaya dön çıkışı');assert.equal(p1.live,true,'pencere dünyayı bekletmez (liveWorld)');
   await tap(B(),`#modal [data-a="setwg"][data-x="${L.t1}:boyun"]`);await wait(B(),()=>document.querySelector('#modal [data-a="wgVtype"]'));M.fetih.toVassal=true;
   /* T3: pencere açıkken sistem keşfedilir */
   await openPick(L.t3);const p3a=await pick();assert.equal(p3a.n,0,'başta bilinen başkent dışı sistem yok: '+JSON.stringify(p3a));
   await H().evaluate(([b,s,t])=>{const e=G.emps[b],y=G.sys[s];if(!y.seen.includes(b))y.seen.push(b);e.mapOwners[s]=t;MP1Host.host.publish();},[E.B,fx.s3,fx.t3]);
   await wait(B(),s=>!!document.querySelector(`#modal .mbox.wgPick [data-a="wgTarget"][data-x="${s}"]`),fx.s3,30000);const p3b=await pick();M.fetih.t3={before:p3a,after:p3b};await shot(B(),'z7-acikken-kesif');
   assert(p3b.ids.includes(fx.s3),'pencere kapanmadan listeye girdi');
   /* T2: başkent dışı uygun hedef → seçim → önizleme → onay → gerçek savaş */
   await openPick(L.t2);let p2=await pick();if(!p2.ids.length)throw Error('T2 adayı yok '+JSON.stringify(p2));
   if(!(await B().evaluate(()=>UI._wgSel.targets.length)))await tap(B(),`#modal [data-a="wgTarget"][data-x="${p2.ids.includes(fx.s2)?fx.s2:p2.ids[0]}"]`);
   M.fetih.t2pick=p2;await wait(B(),()=>{const b=document.querySelector('#modal [data-a="wgGo"]');return b&&!b.disabled&&UI._wgSel.targets.length>0;},undefined,15000).catch(async e=>{M.fetih.t2diag=await B().evaluate(()=>({sel:UI._wgSel,open:UI._wgOpen,html:document.getElementById('modal').innerText.slice(0,600)}));await shot(B(),'z7-t2-diag');throw e;});
   const sel=await B().evaluate(()=>UI._wgSel.targets.slice());await tap(B(),'#modal [data-a="wgGo"]');await wait(B(),()=>document.getElementById('warFinalConfirm')&&!document.getElementById('warFinalConfirm').disabled,undefined,30000);
   await shot(B(),'z7-onizleme');await tap(B(),'#warFinalConfirm');await wait(H(),([b,t])=>!!G.emps[b].war[t],[E.B,fx.t2],30000);
   const wg=await H().evaluate(([b,t])=>G.emps[b].wg[t],[E.B,fx.t2]);M.fetih.t2={sel,wg};assert.equal(wg.t,'fetih');assert.deepEqual(wg.targets,sel,'seçim ilana taşındı');
   /* host (tek oyunculu yol, G.p) aynı kural: tek sistemli hedefte neden + pasif */
   await closeUI(H());await H().evaluate(t=>{G.p.contact[t]=G.emps[t].contact[G.p.id]=true;UI.warGoalPick(t,'fetih');},fx.t1);
   const hp=await H().evaluate(()=>({off:document.querySelector('#modal [data-a="wgGo"]').disabled,why:[...document.querySelectorAll('#modal .wgWhy')].map(x=>x.textContent)}));M.fetih.host=hp;await shot(H(),'z7-host');
   assert.equal(hp.off,true);assert(hp.why.length>0);await closeUI(H());});

 await test('Z8 müzakere masası: genel Savaş sözü MP\'de pasif + neden; Savaşa Destek İste → B\'nin aktif cephesi; C ret → yeniden teklif → C karşı teklif → B kabul → C savaşta (tek kez); host → B daveti kabul; kapanan savaşa gecikmiş kabul işlenmez',async()=>{
   await closeUI(B());await closeUI(C());
   const F=await H().evaluate(([b,t])=>warLedgerFind(b,t).id,[E.B,M.fetih.fx.t2]);const cB=await lid(B(),E.C);M.support={F};
   await H().evaluate(([b,c,t])=>{for(const [x,y] of [[b,c],[c,t],[b,t]]){G.emps[x].contact[y]=G.emps[y].contact[x]=true;}MP1Host.host.publish();},[E.B,E.C,M.fetih.fx.t2]);await settle('z8');
   await B().evaluate(c=>{UI.openDeal(c);},cB);await wait(B(),()=>document.querySelector('[data-a="dealSupport"]'));
   const off=await B().evaluate(()=>({warOn:[...document.querySelectorAll('.dealWarOnOff')].map(b=>b.disabled),why:document.querySelector('.dealWarOnWhy')?.textContent||''}));M.support.warOn=off;
   assert(off.warOn.length===2&&off.warOn.every(Boolean),'genel savaş sözü pasif');assert.match(off.why,/Savaşa Destek İste/);
   await tap(B(),'[data-a="dealSupport"]');await wait(B(),F=>!!document.querySelector(`[data-a="dealSupportPick"][data-x^="front:${F}:"]`),F,20000);await shot(B(),'z8-destek-sec');
   const sendFrom=async()=>{await tap(B(),`[data-a="dealSupportPick"][data-x^="front:${F}:"]`);await wait(B(),F=>UI.deal.want.some(i=>i.t==='warJoin'&&i.front===F),F);
     const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);return H().evaluate(()=>MP1Host.host.dip.offers.at(-1));};
   const o1=await sendFrom();M.support.o1={id:o1.id,want:o1.want.map(i=>({t:i.t,front:i.front,target:i.target,l:i.l}))};assert.equal(o1.from,E.B);assert.equal(o1.to,E.C);
   assert(o1.want.some(i=>i.t==='warJoin'&&i.front===F&&i.target===M.fetih.fx.t2),'davet doğru cepheye bağlı');
   const r1=await cmd('C',{kind:'respond',offer:o1.id,action:'reject'});assert.equal(r1.status,'ok');assert.equal(await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,o1.id),'rejected');
   await B().evaluate(c=>{UI.closeDiplo?.();UI.openDeal(c);},cB);await wait(B(),()=>document.querySelector('[data-a="dealSupport"]'));if(!(await B().evaluate(()=>!!document.querySelector('[data-a="dealSupportPick"]'))))await tap(B(),'[data-a="dealSupport"]');
   await wait(B(),F=>!!document.querySelector(`[data-a="dealSupportPick"][data-x^="front:${F}:"]`),F,20000);const o2=await sendFrom();
   const ct=await cmd('C',{kind:'counter',offer:o2.id,give:[{t:'warJoin',front:F,target:M.fetih.fx.t2}],want:[{t:'res',r:'min',v:60}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
   const cid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id),min0=await H().evaluate(b=>G.emps[b].res.min,E.B);
   const acc=await cmd('B',{kind:'respond',offer:cid,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));
   assert.equal(await H().evaluate(([c,t])=>!!G.emps[c].war[t],[E.C,M.fetih.fx.t2]),true,'C desteklediği cephede savaşta');assert.equal(min0-await H().evaluate(b=>G.emps[b].res.min,E.B),60,'bedel bir kez');
   assert.notEqual((await cmd('B',{kind:'respond',offer:cid,action:'accept'})).status,'ok','ikinci kabul yok');
   /* host → B: host'un savaşına destek daveti (host gerçek masası) */
   await closeUI(H());const T4=await H().evaluate(([b,c,ts])=>{const o=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!ts.includes(o.id)&&!G.p.war[o.id]&&!G.emps[b].war[o.id]&&!G.emps[c].war[o.id]);
     for(const x of [G.p.id,b,c]){G.emps[x].contact[o.id]=o.contact[x]=true;}G.p.contact[b]=G.emps[b].contact[G.p.id]=true;G.p.contact[c]=G.emps[c].contact[G.p.id]=true;
     const r=MP1Host.host.local({kind:'war',target:o.id,goal:'boyun',vtype:'haracguzar',war:'none'});MP1Host.host.publish();return {id:o.id,r};},[E.B,E.C,Object.values(M.fetih.fx)]);
   M.support.T4=T4;assert.equal(T4.r.ok,true,JSON.stringify(T4.r));const HF=await H().evaluate(t=>warLedgerFind(G.p.id,t).id,T4.id);
   const hostSend=async to=>{await H().evaluate(b=>{UI.openDeal(b);},to);await wait(H(),()=>document.querySelector('[data-a="dealSupport"]'));await tap(H(),'[data-a="dealSupport"]');
     await wait(H(),F=>!!document.querySelector(`[data-a="dealSupportPick"][data-x^="front:${F}:"]`),HF,20000);await tap(H(),`[data-a="dealSupportPick"][data-x^="front:${HF}:"]`);
     const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(H(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);return H().evaluate(()=>MP1Host.host.dip.offers.at(-1));};
   const ho=await hostSend(E.B);assert(ho.want.some(i=>i.t==='warJoin'&&i.front===HF),'host daveti host cephesine bağlı');await shot(H(),'z8-host-davet');
   const hb=await cmd('B',{kind:'respond',offer:ho.id,action:'accept'});assert.equal(hb.status,'ok',JSON.stringify(hb));assert.equal(await H().evaluate(([b,t])=>!!G.emps[b].war[t],[E.B,T4.id]),true,'B host\'un savaşında');
   /* kapanmış savaşa gecikmiş kabul */
   await H().evaluate(()=>UI.closeDiplo?.());const hc=await hostSend(E.C);await H().evaluate(t=>{makePeace(G.p,G.emps[t],{force:true,quiet:true});MP1Host.host.publish();},T4.id);
   const late=await cmd('C',{kind:'respond',offer:hc.id,action:'accept'});M.support.late=late;assert.notEqual(late.status,'ok','kapanan savaşa gecikmiş kabul işlenmez');
   assert.equal(await H().evaluate(([c,t])=>!!G.emps[c].war[t],[E.C,T4.id]),false);});

 await test('Z9 dünya ilerler ve emirler uygulanır: B gerçek komut yolundan filo emri verir; host günleri ilerler; emir host dünyasında, misafir aynası host ile aynı',async()=>{
   await closeUI(B());const mv=await H().evaluate(b=>{const fs=G.fleets.filter(f=>f.e===b&&f.ships.length&&!f.mv&&!f.path.length&&f.sys>=0&&!f.combat&&!hasShipment(f));for(const f of fs){const to=G.sys[f.sys].lanes.find(l=>__mp8.why(G.emps[b],{kind:'move',fleet:f.id,to:l})===null);if(to!==undefined)return {fleet:f.id,to};}return null;},E.B);
   assert(mv,'hareket edebilen filo');const d0=await H().evaluate(()=>G.day);const r=await cmd('B',{kind:'move',fleet:mv.fleet,to:mv.to});assert.equal(r.status,'ok',JSON.stringify(r));
   await advance(20);const h=await H().evaluate(([f,to,d0])=>{const x=G.fleets.find(q=>q.id===f);return {day:G.day-d0,at:x?x.sys:null,mv:x&&x.mv?x.mv.to:null,path:x?x.path:null};},[mv.fleet,mv.to,d0]);M.world={mv,h};
   assert(h.day>=19,'tarih ilerledi');assert(h.at===mv.to||h.mv===mv.to||(h.path||[]).includes(mv.to),'emir uygulandı: '+JSON.stringify(h));
   const s=await settle('z9');M.world.settle=s;});
};
