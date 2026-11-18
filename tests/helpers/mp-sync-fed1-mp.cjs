'use strict';
/* MP-SYNC-FED.1 — J senaryosu: kayıttan devam ve ilk tersane emri (gerçek STARS arayüzü, ayrı Chromium profilleri, üretim relay süreci + TLS vekili).
   J1 kayıt öncesi: host'un bekleyen + gizlenmiş olayı, misafir B'nin kendi bekleyen kararı. Host kaydeder → herkes kapanır → relay yeniden başlar →
      host kaydı YENİ odada açar, misafir yokken DEVAM ET; host olayları korunur; gerçek döngüde tarih ilerler; yeni host olayı + anomali + bilim zinciri ve
      B'ye ait yeni olay + anomali (motorun giriş noktaları UI.event / UI.anomaly / UI.chain; uzak insanda enqueueDecision) üretilir. Doğal olay üretimi ayrıca sayılır.
   J2 B ana menü ODAYA KATIL + yeni kod, C davet bağlantısı → kendi devletleri; B'nin kayıt öncesi + host-tek-başına kararları B'nin şeridinde / ☰ listesinde,
      host'un olayları B'de değil; C'de B'nin olayı yok
   J3 B'nin İLK gemi siparişi gerçek dokunuşla (sistem paneli → tersane düğmesi), uzun süren gemi. Üç sonuç ayrı ölçülür: host kabulü (sonuç iletisi),
      host tersane kuyruğunda kayıt, B'nin kendi tersane ekranında aynı sipariş (✕ iptal düğmesi). Kaynak tam bir kez düşer.
   J4 yanıt kaybı: host'un B'ye 'result' iletisi düşürülür; B aynı komutu AYNI cid ile yeniden gönderir (istemcinin yeniden gönderim yolu) → host tek sipariş,
      tek kaynak kesintisi; yinelenen yanıt 'dup'. Ardından B'nin tersane ekranında tek satır. */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,startRelay,stopRelay,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,advance}=X;
 const M=metrics.fed1={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};const S={};
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}}).catch(()=>{});
 const hostCards=()=>H().evaluate(()=>{UI.drawInbox();return [...document.querySelectorAll('#inbox .nCard')].map(c=>(c.querySelector('.nTxt b')||c).textContent.trim());});
 const guestCards=p=>p.evaluate(()=>{UI.drawInbox();return [...document.querySelectorAll('#inbox .nCard')].map(c=>(c.querySelector('.nTxt b')||c).textContent.trim());});
 const statusList=p=>p.evaluate(()=>{UI.act('topStatus');const t=document.getElementById('modal').innerText;UI.closeModal();return t;});
 const pendingOf=e=>H().evaluate(b=>(G.emps[b].decisions?.pending||[]).filter(n=>n.status==='pending').map(n=>({id:n.id,key:n.key})),e);
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);

 await test('J1 kayıt → kapanış → yeni oda → host tek başına: kayıt öncesi bekleyen/gizli olay korunur; tarih ilerler; host ve B için yeni olay/anomali/bilim zinciri üretilir',async()=>{
   await closeUI(H());
   S.ev=await H().evaluate(b=>{AUTO_EVENT=false;const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);const a=evs[0],c=evs[1];UI.event(a);UI.event(c);UI.closeModal();
     const nc=G.inbox.find(n=>n.key==='ev:'+c.id);UI.noteSwipe(nc.uid);UI.closeModal();
     const rb=UI.event(evs[3],G.emps[b]);MP1Host.host.publish();return {a:a.n,c:c.n,bEv:evs[3].n,rb,keys:G.inbox.map(n=>[n.key,!!n.hidden])};},E.B);
   assert(S.ev.rb&&S.ev.rb.ok,'B kararı kuyruğa girdi '+JSON.stringify(S.ev.rb));
   S.bPend0=await pendingOf(E.B);S.day=await H().evaluate(()=>Math.floor(G.day));
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   S.saveId=await H().evaluate(async()=>(await MP4Save.list())[0].saveId);
   for(const n of Object.keys(ctx))await ctx[n].close().catch(()=>{});await stopRelay();metrics.relayPid2=await startRelay();
   const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code1=await h.evaluate(()=>MP1Host.code);assert.notEqual(code1,getCode(),'yeni oda kodu');setCode(code1);M.code1=code1;
   await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   await tap(h,'[data-m="resumeGo"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
   await closeUI(h);const st=await h.evaluate(()=>({day:Math.floor(G.day),keys:G.inbox.map(n=>[n.key,!!n.hidden])}));
   assert.equal(st.day,S.day,'kayıt tarihi korunur');
   for(const [k,hid] of S.ev.keys.filter(([k])=>/^ev:/.test(k)))assert(st.keys.some(([k2,h2])=>k2===k&&h2===hid),'olay '+k+' gizli='+hid+' korunur');
   assert.deepEqual(await pendingOf(E.B),S.bPend0,'B\'nin bekleyen kararı kayıtla korunur');
   const vis=await hostCards();assert(vis.includes(S.ev.a),'bekleyen olay şeritte');assert(!vis.includes(S.ev.c),'gizlenen olay şeritte değil');
   const list=await statusList(h);assert(list.includes(S.ev.c),'gizlenen olay ☰ listesinde');
   /* gerçek döngü: olaylar açık (AUTO_EVENT kapalı, olay ayarı kayıttaki gibi); 2 ay ilerle, doğal kararları say */
   const nat0=await h.evaluate(([b,c])=>({h:G.inbox.length,b:(G.emps[b].decisions?.pending||[]).filter(n=>n.status==='pending').length,c:(G.emps[c].decisions?.pending||[]).filter(n=>n.status==='pending').length}),[E.B,E.C]);
   await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:4}));await wait(h,d=>G.day>=d+30,S.day,180000);await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
   const nat1=await h.evaluate(([b,c])=>({h:G.inbox.length,b:(G.emps[b].decisions?.pending||[]).filter(n=>n.status==='pending').length,c:(G.emps[c].decisions?.pending||[]).filter(n=>n.status==='pending').length,day:Math.floor(G.day)}),[E.B,E.C]);
   M.natural={before:nat0,after:nat1};
   S.neu=await h.evaluate(b=>{const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);const c=evs[2];UI.event(c);UI.closeModal();
     const an=ANOMALIES.find(a=>a.ch&&a.ch.length>1)||ANOMALIES[0];const s=G.sys.find(s=>s.owner===G.p.id&&s.id!==G.p.home)||G.sys[G.p.home];UI.anomaly(an,s);UI.closeModal();
     const chId=Object.keys(CHAINS)[0];UI.chain(chId);UI.closeModal();
     const be=G.emps[b],an2=ANOMALIES.filter(a=>a.ch&&a.ch.length>1)[1]||an,bs=G.sys[be.home];const chB=Object.keys(CHAINS).find(k=>k!==chId&&!(be.decisions?.pending||[]).some(n=>n.status==='pending'&&n.key==='chain:'+k+':'));const r1=UI.chain(chB,be),r2=UI.anomaly(an2,bs,be);MP1Host.host.publish();
     return {ev:c.n,an:s.name,chain:CHAINS[chId].n,bEv:CHAINS[chB].n,bAn:an2.n,r1,r2,day:Math.floor(G.day)};},E.B);
   assert(S.neu.r1&&S.neu.r1.ok&&S.neu.r2&&S.neu.r2.ok,'B için yeni karar ve anomali kuyruğa girdi '+JSON.stringify(S.neu));
   const vis2=await hostCards(),list2=await statusList(h);M.hostAlone={saved:S.ev,neu:S.neu,cards:vis2};await shot(h,'j1-host-yeni-olaylar');
   assert(S.neu.day>S.day,'tarih ilerledi');assert(vis2.includes(S.neu.ev),'yeni olay host şeridinde');assert(vis2.some(t=>t.includes(S.neu.an)),'yeni anomali host şeridinde');
   assert(vis2.includes(S.neu.chain)||list2.includes(S.neu.chain),'bilim zinciri host şeridinde / listesinde');assert(!vis2.includes(S.neu.bEv),'B\'nin olayı host şeridinde değil');
   S.bPend1=await pendingOf(E.B);assert.equal(S.bPend1.length,S.bPend0.length+2+(nat1.b-nat0.b),'B\'de kayıt öncesi + yeni 2 karar (+ doğal)');});

 await test('J2 misafirler yeni kodla döner (B ana menü ODAYA KATIL, C davet bağlantısı): B\'nin kayıt öncesi ve host-tek-başına kararları B\'de; host / C olayları B\'de değil',async()=>{
   const code=getCode();
   const b=await open('B');await b.addInitScript(TIMERS);await b.goto(origin.B+'/');await wait(b,()=>document.getElementById('mp1Btn'));await tap(b,'#mp1Btn');await tap(b,'[data-m="join"]');
   await b.waitForURL(u=>/\/mp\/play/.test(String(u)),{timeout:20000});await wait(b,()=>document.getElementById('jCode'));await b.fill('#jCode',code);await tap(b,'[data-j="go"]');await ready(b,E.B);
   const c=await open('C');await c.addInitScript(TIMERS);await c.goto(origin.C+'/mp/play?code='+code);await wait(c,()=>window.MP1Join&&document.getElementById('jName'));
   if(await c.evaluate(()=>!MP1Join.ws))await tap(c,'[data-j="go"]');await ready(c,E.C);
   for(const p of [b,c])await p.evaluate(CANON+GUESTLIB);await settle('j2');
   const g=await b.evaluate(()=>({day:Math.floor(G.day),pending:(G.p.decisions?.pending||[]).filter(n=>n.status==='pending').map(n=>n.key),inbox:G.inbox.filter(n=>n.decisionId!==undefined).map(n=>[n.title,!!n.hidden])}));
   const bc=await guestCards(b),bl=await statusList(b),cc=await guestCards(c);M.rejoin={g,cards:bc,cCards:cc,list:bl.slice(0,600)};await shot(b,'j2-b-olaylar');
   assert.deepEqual(g.pending.slice().sort(),S.bPend1.map(r=>r.key).sort(),'B aynasında bekleyen kararlar host ile aynı');
   for(const t of [S.ev.bEv,S.neu.bEv])assert(bc.includes(t)||bl.includes(t),'B kendi olayını görür: '+t+' · '+JSON.stringify(bc));
   assert(bc.some(x=>x.includes(S.neu.bAn))||bl.includes(S.neu.bAn),'B kendi anomalisini görür');
   for(const t of [S.ev.a,S.neu.ev])assert(!bc.includes(t),'host olayı B şeridinde değil: '+t);
   for(const t of [S.ev.bEv,S.neu.bEv])assert(!cc.includes(t),'B\'nin olayı C şeridinde değil');});

 /* B'nin ilk gemi siparişi: gerçek sistem paneli, gerçek dokunuş; en uzun inşa süreli kurulabilir gemi */
 const pickShip=()=>B().evaluate(()=>{const s=G.sys[G.p.home];const ks=Object.keys(SHIPS).filter(k=>!SHIPS[k].crisisOnly&&shipBuildAccess(G.p,k).ok);
   const ok=ks.filter(k=>{const c=shipCost(G.p,k);return Object.keys(c).every(r=>G.p.res[r]>=c[r]);});ok.sort((a,b)=>shipProductionDays(G.p,b)-shipProductionDays(G.p,a));return {sys:s.id,k:ok[0],n:ok[0]&&SHIPS[ok[0]].n,cost:ok[0]&&shipCost(G.p,ok[0]),days:ok[0]&&shipProductionDays(G.p,ok[0])};});
 const openYard=sid=>B().evaluate(sid=>{UI.closeModal();document.getElementById('diploPane')?.classList.remove('show');View.sel=null;View.selSys=G.sys[sid];UI.tab('sistem');UI.refresh();},sid);
 const yardRows=(sid,name)=>B().evaluate(([sid,name])=>[...document.querySelectorAll('#panel .shipCancelBtn')].filter(b=>(b.getAttribute('aria-label')||'').startsWith(name)).length,[sid,name]);
 const hostQ=(sid,e,k)=>H().evaluate(([sid,e,k])=>G.sys[sid].queue.filter(q=>q.e===e&&q.cls===k).map(q=>({left:Math.round(q.left),tot:Math.round(q.tot)})),[sid,e,k]);
 const hostRes=e=>H().evaluate(e=>({...G.emps[e].res}),e);

 await test('J3 B\'nin ilk gemi siparişi gerçek dokunuşla: host kabulü, host tersane kuyruğu ve B\'nin tersane ekranı ayrı ölçülür; kaynak bir kez düşer',async()=>{
   await H().evaluate(b=>{const e=G.emps[b];for(const r of ['min','ala','ene'])e.res[r]=Math.max(e.res[r],20000);MP1Host.host.publish();},E.B);await settle('j3');
   const sh=await pickShip();assert(sh.k,'kurulabilir gemi');S.ship=sh;await openYard(sh.sys);
   const q0=(await hostQ(sh.sys,E.B,sh.k)).length,res0=await hostRes(E.B),y0=await yardRows(sh.sys,sh.n),r0=await B().evaluate(()=>MP1Join.results.length);
   const sel='#panel [data-a="ship"][data-x="'+sh.sys+':'+sh.k+'"]';await B().locator(sel).scrollIntoViewIfNeeded();const t0=Date.now();await tap(B(),sel);
   let tAck=null,tHost=null,tGuest=null,ack=null;
   for(;Date.now()-t0<30000&&(tAck===null||tHost===null||tGuest===null);){
     if(tAck===null){ack=await B().evaluate(n0=>{const x=MP1Join.results.slice(n0).find(r=>r.status);return x?{status:x.status,code:x.code||null,cid:x.cid}:null;},r0);if(ack)tAck=Date.now()-t0;}
     if(tHost===null&&(await hostQ(sh.sys,E.B,sh.k)).length>q0)tHost=Date.now()-t0;
     if(tGuest===null){await openYard(sh.sys);if(await yardRows(sh.sys,sh.n)>y0)tGuest=Date.now()-t0;}
     await sleep(100);}
   const q1=await hostQ(sh.sys,E.B,sh.k),res1=await hostRes(E.B);const paid={};for(const r in sh.cost)paid[r]=Math.round(res0[r]-res1[r]);
   M.firstOrder={ship:sh.n,k:sh.k,ack,tAckMs:tAck,tHostQueueMs:tHost,tGuestYardMs:tGuest,host:q1,paid,cost:sh.cost};await shot(B(),'j3-b-tersane');
   assert.equal(ack&&ack.status,'ok','host kabulü: '+JSON.stringify(ack));assert(tHost!==null,'host kuyruğunda kayıt');assert(tGuest!==null,'B tersane ekranında sipariş');
   assert.equal(q1.length,q0+1,'tek sipariş');assert(q1.at(-1).tot>=sh.days-1,'uzun süren sipariş ('+q1.at(-1).tot+' gün)');
   for(const r in sh.cost)assert(Math.abs(paid[r]-Math.round(sh.cost[r]))<=1,'kaynak tam bir kez: '+r+' '+paid[r]+'/'+sh.cost[r]);});

 await test('J4 yanıt kaybı + AYNI cid ile yeniden gönderim: tek sipariş, tek kaynak kesintisi, yinelenen yanıt; B tersane ekranında tek yeni satır',async()=>{
   const sh=S.ship;const q0=(await hostQ(sh.sys,E.B,sh.k)).length,res0=await hostRes(E.B),y0=await yardRows(sh.sys,sh.n);
   await H().evaluate(()=>{if(window.__dropInstalled)return;window.__dropInstalled=true;window.__drop=null;window.__dropped={};const S0=WebSocket.prototype.send;
     WebSocket.prototype.send=function(d){const D=window.__drop;if(D&&typeof d==='string'&&d[0]==='T'&&Date.now()<D.until){const i=d.indexOf('\n');if(d.slice(1,i)===String(D.conn)){try{const m=JSON.parse(d.slice(i+1));if(D.types.includes(m.type)){window.__dropped[m.type]=(window.__dropped[m.type]||0)+1;return;}}catch{}}}return S0.call(this,d);};});
   const conn=await H().evaluate(e=>[...MP1Host.host.state.players.values()].find(p=>p.empireId===e).conn,E.B);
   await H().evaluate(c=>{window.__drop={conn:c,types:['result'],until:Date.now()+4000};},conn);
   const capture=()=>B().evaluate(()=>window.__j4ShipFrames);
   await B().evaluate(()=>{
     const ws=MP1Join.ws,send=ws.send;
     window.__j4ShipFrames=[];
     ws.send=function(data){
       const m=JSON.parse(data);
       if(m.type==='cmd'&&m.cmd?.kind==='ship')window.__j4ShipFrames.push({cid:m.cid,seq:m.seq});
       return send.call(this,data);
     };
   });
   const sel='#panel [data-a="ship"][data-x="'+sh.sys+':'+sh.k+'"]';
   await B().locator(sel).scrollIntoViewIfNeeded();const t0=Date.now();await tap(B(),sel);
   const first=(await capture())[0];assert(first,'tersane dokunuşu gemi emri gönderdi');
   await wait(H(),([sid,e,k,n])=>G.sys[sid].queue.filter(q=>q.e===e&&q.cls===k).length>n,[sh.sys,E.B,sh.k,q0],20000);
   const tHostQueueMs=Date.now()-t0;
   const lost=await B().evaluate(cid=>!MP1Join.results.some(r=>r.cid===cid),first.cid);await sleep(4200);
   assert.equal((await capture()).length,1,'kayıp yanıt farklı kimlikle otomatik sipariş üretmez');
   /* İstemcinin tekrar yolu, ilk komutun hem kimliğini hem sırasını korur. */
   const again=await B().evaluate(([sid,k,cid])=>MP1Join.cmd({kind:'ship',sys:sid,key:k},cid),[sh.sys,sh.k,first.cid]);
   const rep=await (await wait(B(),cid=>{const x=MP1Join.results.filter(r=>r.cid===cid);return x.length?x.map(r=>({status:r.status,dup:!!r.dup})):null;},first.cid,20000)).jsonValue();
   const tAckMs=Date.now()-t0;
   await settle('j4');await openYard(sh.sys);
   const y1=await yardRows(sh.sys,sh.n),tGuestYardMs=Date.now()-t0;
   const q1=(await hostQ(sh.sys,E.B,sh.k)).length,res1=await hostRes(E.B);const paid={};for(const r in sh.cost)paid[r]=Math.round(res0[r]-res1[r]);
   const frames=await capture();assert.deepEqual(frames,[first,first],'tekrar ilk cid ve seq ile gönderilir');
   M.resend={lost,again:{ok:again.ok,cid:again.cid===first.cid},rep,q0,q1,y0,y1,paid,tHostQueueMs,tAckMs,tGuestYardMs,dropped:await H().evaluate(()=>window.__dropped)};
   assert.equal(lost,true,'ilk yanıt gerçekten kayboldu');assert.equal(again.cid,first.cid,'aynı cid');assert(rep.some(r=>r.status==='ok'),'yanıt geldi '+JSON.stringify(rep));
   assert.equal(q1,q0+1,'tek sipariş');assert.equal(y1,y0+1,'B tersanesinde tek yeni satır');
   for(const r in sh.cost)assert(Math.abs(paid[r]-Math.round(sh.cost[r]))<=1,'tek kaynak kesintisi: '+r+' '+paid[r]+'/'+sh.cost[r]);});
};
