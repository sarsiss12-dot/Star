'use strict';
/* MP-FIELD-FIX.0 — son Render denemesinin dört saha bulgusu, NORMAL oyuncu girişleriyle (gerçek dokunuş / fare, gerçek STARS arayüzü).
   Host + misafir B + misafir C, her biri ayrı Chromium kalıcı profili; X = bu kayda kimliği olmayan üçüncü profil.
   Z1 katılım yolları (ana menü ODAYA KATIL, eski /mp/join bağlantısı, davet /mp/play) → tam STARS arayüzü, aynı devlet
   Z2 katılım başarısızlığında aşama (oda / kimlik / bağlantı) ekranda
   Z3 canlı MP olay şeridi: fare ve dokunmayla kaydırma, ayna / yeniden bağlanma / sayfa yenileme kartı geri getirmez, sonraki olay görünür, karar host'ta bir kez
   Z4 takviye sevkiyatındaki filoyu birleştirme: geçerli ret Türkçe, aynı uyarılar birleşir, karar kartları etkilenmez
   Z5 kaydet → host ve misafirler kapanır → relay yeniden başlar → host kaydı YENİ odada açar; misafir yokken olaylar (bekleyen / gizli / yeni)
   Z6 misafirler yeni odaya ana menüden ve eski bağlantıyla döner → aynı devlet, tarih, bekleyen kararlar; kimliksiz X "kimlik" aşamasında
   Z7 Fetih hedef seçimi: tek sistemli hedef, başkent dışı hedef, pencere açıkken keşfedilen sistem; seçim → önizleme → onay → gerçek savaş
   Z8 müzakere masasından Savaşa Destek İste: cephe bağlı davet, ret / karşı teklif / kabul, kapanmış savaşa gecikmiş kabul
   Z9 dünya ilerler, verilen emirler uygulanır */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,startRelay,stopRelay,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const M=metrics.field={};const fs=require('fs'),path=require('path');
 const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const where=p=>p.evaluate(()=>({path:location.pathname,search:location.search,full:!!window.MP6Stars,basic:!!document.querySelector('.mp2-tabs,#mp2Tabs')||!window.MP6Stars&&!!window.MP1Join,
   started:!!(window.MP6Stars&&MP6Stars.S.started),e:window.MP1Join?MP1Join.empireId:null,stage:document.getElementById('jStatus')?.dataset.stage||null,status:document.getElementById('jStatus')?.textContent||''}));
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}}).catch(()=>{});
 const E={};   /* gerçek devlet kimlikleri */
 /* testler birbirinden bağımsız: önceki adım oyuncuyu oyun dışında bıraktıysa davet bağlantısıyla (/mp/play?code=) geri döner */
 const ensure=async n=>{if(await pg[n].evaluate(e=>!!(window.MP6Stars&&MP6Stars.S.started&&MP1Join.empireId===e),E[n]).catch(()=>false))return;
   await pg[n].goto(origin[n]+'/mp/play?code='+getCode());await wait(pg[n],()=>window.MP1Join&&document.getElementById('jName'));if(await pg[n].evaluate(()=>!MP1Join.ws))await tap(pg[n],'[data-j="go"]');await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);};
 const cards=p=>p.evaluate(()=>[...document.querySelectorAll('#inbox .nCard')].map(c=>({uid:+c.dataset.x,t:(c.querySelector('.nTxt b')||c).textContent.trim(),kind:(G.inbox||[]).find(n=>n.uid===+c.dataset.x)?.kind||null})));
 /* kart sürükleme: fare (pointerType mouse) ya da dokunma (CDP Input.dispatchTouchEvent → pointerType touch) */
 async function swipe(p,uid,how){const box=await p.locator(`#inbox .nCard[data-x="${uid}"]`).first().boundingBox();if(!box)throw Error('card '+uid+' not visible');
   const y=box.y+box.height/2,x0=box.x+box.width*0.3,x1=x0+Math.max(160,box.width*0.6);
   if(how==='mouse'){await p.mouse.move(x0,y);await p.mouse.down();for(let i=1;i<=8;i++)await p.mouse.move(x0+(x1-x0)*i/8,y);await p.mouse.up();}
   else{const s=await p.context().newCDPSession(p);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});
     for(let i=1;i<=8;i++)await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/8,y}]});await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await s.detach();}
   await p.waitForTimeout(500);}

 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 await test('Z1 katılım yolları: B ana menü ÇOK OYUNCULU → ODAYA KATIL, C eski /mp/join?code= bağlantısı → ikisi de tam STARS arayüzü (/mp/play), oda kodu korunur, kendi devleti',async()=>{
   const code=getCode();M.E=E;
   /* B: oyun sekmesini kapatıp ana sayfadan gerçek menü yoluyla döner (koltuk host'ta bekler) */
   await B().goto(origin.B+'/');await wait(B(),()=>document.getElementById('mp1Btn'));await tap(B(),'#mp1Btn');await tap(B(),'[data-m="join"]');
   await B().waitForURL(u=>/\/mp\/(play|join)/.test(String(u)),{timeout:20000});await B().waitForTimeout(800);M.menuJoin=await where(B());await shot(B(),'z1-ana-menu-katil');
   assert.equal(M.menuJoin.path,'/mp/play','ana menü ODAYA KATIL tam arayüze gider: '+JSON.stringify(M.menuJoin));assert.equal(M.menuJoin.full,true);
   await B().fill('#jCode',code);await tap(B(),'[data-j="go"]');await ready(B(),E.B);
   /* C: eski /mp/join bağlantısı (yer imi / eski davet) — yönlenme kodu ve kimliği korur */
   await C().goto(origin.C+'/mp/join?code='+code);await C().waitForTimeout(1500);M.oldLink=await where(C());await shot(C(),'z1-eski-baglanti');
   assert.equal(M.oldLink.path,'/mp/play','eski /mp/join tam arayüze yönlenir: '+JSON.stringify(M.oldLink));assert.match(M.oldLink.search,new RegExp('code='+code));
   if(!M.oldLink.started){await wait(C(),()=>document.getElementById('jName'));if(await C().evaluate(()=>document.querySelector('[data-j="go"]')&&!MP1Join.ws))await tap(C(),'[data-j="go"]');}
   await ready(C(),E.C);M.after={B:await where(B()),C:await where(C())};
   assert.equal(M.after.B.e,E.B);assert.equal(M.after.C.e,E.C);});

 await test('Z2 katılım başarısızlığında aşama ekranda: yanlış kod → ODA BULUNAMADI; bağlantı yok → BAĞLANTI KESİLDİ (X: ayrı profil, bu odada kimliği yok)',async()=>{
   const x=await open('X');await x.addInitScript(TIMERS);await x.goto(origin.X+'/mp/play?code=ZZZZZ');await wait(x,()=>window.MP1Join&&document.getElementById('jName'));
   await x.fill('#jName','Xen');await tap(x,'[data-j="go"]');await wait(x,()=>MP1Join.screen==='join'&&!!MP1Join.err,undefined,20000);M.badCode=await where(x);await shot(x,'z2-oda-bulunamadi');
   assert.equal(M.badCode.stage,'oda',JSON.stringify(M.badCode));assert.match(M.badCode.status,/ODA BULUNAMADI/);
   await x.context().setOffline(true);await x.fill('#jCode',getCode());await tap(x,'[data-j="go"]');await wait(x,()=>MP1Join.screen==='join'&&!!MP1Join.err,undefined,20000);M.offline=await where(x);
   await x.context().setOffline(false);await shot(x,'z2-baglanti');assert.equal(M.offline.stage,'baglanti',JSON.stringify(M.offline));assert.match(M.offline.status,/BAĞLANTI/);
   await ctx.X.close();});

 await test('Z3 canlı MP olay şeridi: B kartı FAREYLE, sonra DOKUNARAK kaydırır → kart kalkar, karar ☰ listesinde; host ayna yeniler, bağlantı kopup döner, sayfa yenilenir → kart geri gelmez; sonraki olay görünür; karar host\'ta bir kez',async()=>{
   await ensure('B');await ensure('C');await closeUI(B());
   const row=await H().evaluate(b=>{const e=G.emps[b];const r1=enqueueDecision(e,'event','e4'),r2=enqueueDecision(e,'anomaly','a1',e.home);MP1Host.host.publish();return {r1,r2,pending:e.decisions.pending.filter(n=>n.status==='pending').map(n=>({id:n.id,kind:n.kind}))};},E.B);
   M.events={enq:row};assert(row.r1.ok&&row.r2.ok,'deterministik olaylar kuyruğa girdi '+JSON.stringify(row));
   await wait(B(),()=>document.querySelectorAll('#inbox .nCard').length>=2,undefined,20000);const c0=await cards(B());M.events.cards0=c0;await shot(B(),'z3-kartlar');
   const ev=c0.find(c=>c.kind==='event'),an=c0.find(c=>c.kind==='anomaly');
   assert(ev&&an,'olay + anomali kartı: '+JSON.stringify(c0));
   await swipe(B(),ev.uid,'mouse');let c1=await cards(B());M.events.afterMouse=c1;assert(!c1.some(c=>c.t===ev.t),'fareyle kaydırılan kart kalktı '+JSON.stringify(c1));
   await swipe(B(),an.uid,'touch');c1=await cards(B());M.events.afterTouch=c1;assert(!c1.some(c=>c.t===an.t),'dokunarak kaydırılan kart kalktı '+JSON.stringify(c1));
   const listed=await B().evaluate(()=>{UI.act('topStatus');const t=document.getElementById('modal').innerText;UI.closeModal();return t;});M.events.statusList=listed.slice(0,600);
   assert(listed.includes(ev.t.split(' ')[0])||/Kayıp|Olay|karar/i.test(listed),'karar durum listesinde erişilebilir');
   /* dünya güncellemesi */
   await advance(3);await settle('z3-ayna');c1=await cards(B());assert(!c1.some(c=>c.t===ev.t||c.t===an.t),'ayna kartı geri getirmez '+JSON.stringify(c1));
   /* yeniden bağlanma (aynı sayfa) */
   await lanes.B.down();await sleep(2500);await lanes.B.up();await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await settle('z3-yeniden-baglanti');
   c1=await cards(B());assert(!c1.some(c=>c.t===ev.t||c.t===an.t),'yeniden bağlanma kartı geri getirmez '+JSON.stringify(c1));
   /* sayfa yenileme (Android arka plan dönüşü) */
   await B().reload();await ready(B(),E.B);await B().evaluate(CANON+GUESTLIB);await settle('z3-yenileme');await B().waitForTimeout(800);
   c1=await cards(B());M.events.afterReload=c1;assert(!c1.some(c=>c.t===ev.t||c.t===an.t),'sayfa yenilemesi kapatılan kartı geri getirmez '+JSON.stringify(c1));
   /* sonraki olay normal görünür */
   await H().evaluate(b=>{enqueueDecision(G.emps[b],'event','e1');MP1Host.host.publish();},E.B);
   await wait(B(),n=>document.querySelectorAll('#inbox .nCard').length>n,c1.length,20000);M.events.next=await cards(B());await shot(B(),'z3-sonraki-olay');
   /* gizlenen karar listeden açılır ve host'ta BİR KEZ işlenir */
   const dec=await B().evaluate(t=>{const n=G.inbox.find(n=>n.hidden&&n.kind==='event'&&n.title===t);return n?{uid:n.uid,id:n.decisionId}:null;},ev.t);assert(dec,'gizli karar kaydı misafirde duruyor');
   const before=await H().evaluate(([b,id])=>G.emps[b].decisions.pending.find(n=>n.id===id)?.status,[E.B,dec.id]);
   await B().evaluate(u=>UI.act('openNote',u),dec.uid);await wait(B(),()=>!document.getElementById('modal').classList.contains('hidden')&&document.querySelector('#modal [data-a="evch"]'));
   await tap(B(),'#modal [data-a="evch"][data-x="0"]');await wait(H(),([b,id])=>G.emps[b].decisions.pending.find(n=>n.id===id)?.status!=='pending',[E.B,dec.id],20000);
   const after=await H().evaluate(([b,id])=>({st:G.emps[b].decisions.pending.find(n=>n.id===id)?.status,done:(G.emps[b].decisions.done||[]).filter(n=>n.id===id).length}),[E.B,dec.id]);M.events.resolved={before,after};
   const again=await cmd('B',{kind:'eventChoice',id:dec.id,choice:0});M.events.again=again;assert.notEqual(again.status,'ok','ikinci karar işlenmez');});

 await test('Z4 takviye sevkiyatındaki filoyu birleştirme: host kuralı geçerli (ret), gerekçe Türkçe, art arda aynı uyarı tek satırda birleşir; karar kartları etkilenmez',async()=>{
   await ensure('B');await closeUI(B());
   const fx=await H().evaluate(b=>{const e=G.emps[b],home=G.sys[e.home];const a=newFleet(e,home.id,[{c:'kor'}]),t=newFleet(e,home.id,[{c:'kor'}]);
     a.shipment={fleet:t.id,state:'ready',attempts:0,next:0};   /* FİKSTÜR: takviye sevkiyatındaki filo (motorun sevkiyat kaydı biçimi) */MP1Host.host.publish();return {a:a.id,t:t.id,sys:home.id,has:hasShipment(a)};},E.B);M.ship={fx};
   const direct=await cmd('B',{kind:'merge',fleet:fx.a});M.ship.direct=direct;assert.equal(direct.code,'rules:shipment','kök: sevkiyattaki filo birleştirilmek istenince host rules:shipment döner');
   await settle('z4');const cards0=await cards(B());
   await B().evaluate(f=>{View.sel=G.fleets.find(x=>x.id===f);},fx.a);
   for(let i=0;i<3;i++){await B().evaluate(()=>UI.act('merge'));await B().waitForTimeout(250);}
   await B().evaluate(s=>UI.act('mergeArmed',s),fx.sys);await B().waitForTimeout(1500);
   const al=await B().evaluate(()=>[...document.querySelectorAll('#alerts .alert')].map(d=>d.textContent));M.ship.alerts=al;await shot(B(),'z4-uyari');
   assert(!al.some(t=>/rules:/.test(t)),'ham kod gösterilmez: '+JSON.stringify(al));assert(al.some(t=>/sevkiyat/i.test(t)),'Türkçe sevkiyat gerekçesi');
   assert(al.filter(t=>/Önce sevkiyatı iptal et/.test(t)).length<=1,'aynı uyarı tek satırda: '+JSON.stringify(al));
   assert.deepEqual(await cards(B()),cards0,'ret uyarıları karar kartlarına dokunmaz');
   const st=await H().evaluate(([a,t])=>({a:!!G.fleets.find(f=>f.id===a),t:!!G.fleets.find(f=>f.id===t)}),[fx.a,fx.t]);assert.deepEqual(st,{a:true,t:true},'ret: filolar değişmedi');});

 if(process.env.FIELD_STOP==='4')return;
 await require('./mp-field-fix0-mp2.cjs')(X,{E,M,ready,where,closeUI,cards,swipe});
};
