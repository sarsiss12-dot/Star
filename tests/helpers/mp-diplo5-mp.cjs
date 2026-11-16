'use strict';
/* MP-DIPLO5 — gerçek STARS arayüzünde host + misafir B + misafir C + misafir D (ayrı Chromium kalıcı profilleri, yatay telefon, üretim kipi relay,
   oyuncu başına kesilebilir hat). D yalnız gizlilik profili ve Barıştırma'da diğer savaşan.
   U1 NF-2b: C gerçek masada B'den lüks ister (host listesi) → B kabul → host'ta C'de bonus; C'nin misafir dünyasında aynı bonus ve "erişim hakkı";
      D'nin aynasında hak bilgisi yok
   U2 NF-3: B gerçek masada (dokunuş) C'ye Casusluk Ağı önerir (satır İKİ YÖNLÜ) → C iki kez kabul + hat donar / kopar → tek ağ, bedel bir kez;
      C'nin haritası B'nin üçüncü devlet düzeyini havuzdan alır; D'ye ne ağ ne düzey gider
   U3 NF-6: B, D ile savaşta; C gerçek masada Barıştırma seçer (yalnız bildiği savaş, Cephe #) → B kabul → "mediating" (dünya değişmez) →
      KAYIT → host kapanır → YENİ oda → D onay kartını kabul eder → barış + karşılık birlikte, bir kez
   U4 NF-4: B İLİŞKİ sayfasında C'ye tek dokunuş Saldırmazlık (çift dokunuş) → tek teklif "Bekliyor"; sayfa yenilenir → satır yine "Bekliyor",
      yeniden dokunuş ikinci teklif üretmez; C kabul → B satırı "Kabul edildi"
   U5 birleşik teklif (lüks + casusluk ağı + kaynak) gönderilirken C'nin hattı kopar → taslak host yanıtına kadar korunur; yeniden gönderim tek kayıt;
      B kabul → hepsi tek işlemde; kabul anında geçersiz madde (lüks kaynağı kaybı) varsa hiçbir şey uygulanmaz
   U6 insan → AI son tarihsiz Savaş Sözü: erişimsiz hedefte AI gerekçeyle reddeder (NF-5) */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd}=X;
 const M=metrics.diplo5={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C,D=()=>pg.D;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}try{UI.closeDiplo?.();}catch{}document.getElementById('diploPane').classList.remove('show');}).catch(()=>{});
 const rec=(p,id)=>waitv(p,id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},id,20000);
 const accept=(p,rid)=>p.evaluate(id=>DiplomaticInbox.resolve(id,true,undefined,G.emps),rid);
 const pick=async(p,label)=>{await wait(p,()=>document.querySelector('#modal [data-a="pickOne"]'));const i=await p.evaluate(n=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].findIndex(b=>b.innerText.includes(n)),label);if(i<0)throw Error('listede yok: '+label);await tap(p,`#modal [data-a="pickOne"][data-x="${i}"]`);};
 const openDeal=async(p,to)=>{await closeUI(p);await p.evaluate(b=>{UI.forgetDeal(b);UI.openDeal(b);},to);await wait(p,()=>document.querySelector('[data-a="dealSend"]'));};
 const offersN=()=>H().evaluate(()=>MP1Host.host.dip.offers.length);
 const relink=async(n)=>{await wait(pg[n],()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await ready(pg[n],E[n]);};
 for(const n of ['B','C','D'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 const fx=await H().evaluate(([b,c,d])=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});
   const ai=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead);for(const e of ai)if(isPurifier(e)){e.mizac='militarist';delete e._pers;}
   for(const e of G.emps)if(!e.wild&&!e.dead){for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.rel[o.id]=Math.max(e.rel[o.id]||0,70);e.war[o.id]=false;if(e.nap)delete e.nap[o.id];}e.intel={};if(e.spynet)e.spynet={};}
   for(const id of [b,c,d]){const e=G.emps[id];for(const r of ['min','ene','ala','yiy','tuk','etk'])e.res[r]=Math.max(e.res[r]||0,6000);}
   for(const e of G.emps)if(!e.wild)for(const cc of e.colonies){const p=G.sys[cc.s].planets[cc.p];if(p.lux==='ipek'||p.lux==='kristal')p.lux=null;}
   const home=e=>G.sys[e.home].planets.find(p=>p.col&&p.owner===e.id);home(G.emps[b]).lux='ipek';home(G.emps[c]).lux='kristal';for(const e of G.emps)if(!e.dead)refreshLuxury(e);
   G.emps[c].intel[b]=3;G.emps[b].intel[ai[0].id]=3;   /* C, B'yi SIZILMIŞ izler (lüks listesi + B'nin savaşlarını bilir); B'nin AI X üzerinde ağı var */
   MP1Host.host.publish();return {X:ai[0].id,AI:ai[1].id};},[E.B,E.C,E.D]);
 M.fx=fx;await settle('u0');

 await test('U1 NF-2b: C lüks ister → B kabul → C\'de bonus host ve misafir dünyasında aynı; D hak bilgisini görmez',async()=>{
   const bC=await lid(C(),E.B);await openDeal(C(),bC);await tap(C(),'[data-a="dealAdd"][data-x="want:lux"]');await pick(C(),'Vakum İpeği');await wait(C(),()=>UI.deal.want.some(i=>i.t==='lux'&&i.k==='ipek'));
   await tap(C(),'[data-a="dealAdd"][data-x="give:res"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(C(),()=>document.getElementById('dealAmountInput'));await C().fill('#dealAmountInput','30');await tap(C(),'#modal [data-a="amountApply"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='res'));
   const row=await C().evaluate(()=>(document.querySelector('.dealAssetRow[data-kind="lux"]')||{}).innerText||'');M.u1={row};assert.match(row,/bonusu açılır/);await shot(C(),'u1-ozet');
   const n0=await offersN();await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
   await settle('u1-o');const rid=await rec(B(),oid);await accept(B(),rid);await wait(H(),c=>!!(G.emps[c].luxury||{}).ipek,E.C,20000);await settle('u1-kabul');
   const h=await H().evaluate(c=>({lux:!!G.emps[c].luxury.ipek,min:+G.emps[c].mods.minMul.toFixed(6)}),E.C);const g=await C().evaluate(()=>({lux:!!G.p.luxury.ipek,min:+G.p.mods.minMul.toFixed(6),net:/erişim hakkı/.test(UI.luxGrantHtml(G.p))}));
   const dm=await H().evaluate(d=>JSON.stringify(StarsMirror.build(d)),E.D);M.u1={...M.u1,h,g,dLeak:/mpLuxGrant|"luxGrant":\{"ipek"/.test(dm)};
   assert.equal(h.lux,true);assert.deepEqual({lux:g.lux,min:g.min},{lux:h.lux,min:h.min},'misafir = host');assert.equal(g.net,true);assert.equal(M.u1.dLeak,false,'D görmez');});

 await test('U2 NF-3: B Casusluk Ağı önerir (İKİ YÖNLÜ); C çift kabul + hat donar / kopar → tek ağ, bedel bir kez; havuz C haritasında; D\'ye sızmaz',async()=>{
   const cB=await lid(B(),E.C);await openDeal(B(),cB);await tap(B(),'[data-a="dealPact"][data-x="spynet"]');await wait(B(),()=>UI.deal.give.some(i=>i.t==='spynet')||UI.deal.want.some(i=>i.t==='spynet'));
   const row=await B().evaluate(()=>(document.querySelector('.dealIntelRow[data-kind="spynet"]')||{}).innerText||'');assert.match(row,/İKİ YÖNLÜ/);await shot(B(),'u2-satir');
   const etk0=await H().evaluate(b=>G.emps[b].res.etk,E.B);const n0=await offersN();await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('u2-o');const rid=await rec(C(),oid);
   lanes.C.freeze();const a1=await accept(C(),rid),a2=await accept(C(),rid);await lanes.C.down();await sleep(2500);await lanes.C.up();await relink('C');await settle('u2-geri');
   let st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,oid);if(st==='pending'){const r2=await rec(C(),oid);await accept(C(),r2);await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',oid,20000);}
   assert.notEqual((await cmd('C',{kind:'respond',offer:oid,action:'accept'})).status,'ok');await settle('u2-son');
   const h=await H().evaluate(([b,c,x])=>({net:!!(G.emps[c].spynet||{})[b]&&!!(G.emps[b].spynet||{})[c],etk:G.emps[b].res.etk,pool:pooledIntel(G.emps[c],x)}),[E.B,E.C,fx.X]);
   const xC=await lid(C(),fx.X),xD=await lid(D(),fx.X);const g=await C().evaluate(x=>({pool:pooledIntel(G.p,x),own:intelOf(G.p,x)}),xC);const dg=await D().evaluate(x=>({pool:pooledIntel(G.p,x),mp:!!G.p.mpPooled}),xD);
   M.u2={a1,a2,h:{...h,etk0},g,dg};assert.equal(h.net,true);assert.equal(etk0-h.etk,120,'bedel bir kez');assert.equal(g.pool,3,'C haritası B\'nin düzeyini havuzdan alır');assert.equal(g.own,0);assert.deepEqual(dg,{pool:0,mp:false},'D\'ye sızmaz');});

 await test('U3 NF-6: C Barıştırma (yalnız bilinen savaş, Cephe #) → B kabul → mediating → kayıt → YENİ oda → D onaylar → barış + karşılık bir kez',async()=>{
   const f=await H().evaluate(([b,d])=>{G._dealAuth=true;declareWar(G.emps[b],G.emps[d]);G._dealAuth=false;MP1Host.host.publish();return peaceWithFront(G.emps[b],G.emps[d]);},[E.B,E.D]);await settle('u3-savas');
   const bC=await lid(C(),E.B),dC=await lid(C(),E.D);await openDeal(C(),bC);await tap(C(),'[data-a="dealAdd"][data-x="want:peaceWith"]');
   await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));const list=await C().evaluate(()=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].map(b=>b.innerText));M.u3={list,front:f};
   assert(list.some(t=>t.includes('Cephe #'+f)&&/insan/.test(t)),JSON.stringify(list));await tap(C(),'#modal [data-a="pickOne"][data-x="'+list.findIndex(t=>t.includes('Cephe #'+f))+'"]');
   await wait(C(),d=>UI.deal.want.some(i=>i.t==='peaceWith'&&i.target===d),dC);
   await tap(C(),'[data-a="dealAdd"][data-x="give:res"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(C(),()=>document.getElementById('dealAmountInput'));await C().fill('#dealAmountInput','200');await tap(C(),'#modal [data-a="amountApply"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='res'));
   const row=await C().evaluate(()=>(document.querySelector('.peaceWithRow')||{}).innerText||'');assert.match(row,/ayrı barış onayı/);await shot(C(),'u3-masa');
   const n0=await offersN();await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
   await settle('u3-o');const rid=await rec(B(),oid);const r0=await H().evaluate(c=>G.emps[c].res,E.C);await accept(B(),rid);
   await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='mediating',oid,20000);const mid=await H().evaluate(([id,b,d,c])=>({o:MP1Host.host.dip.offers.find(o=>o.id===id),war:!!G.emps[b].war[d],res:G.emps[c].res}),[oid,E.B,E.D,E.C]);
   assert.equal(mid.war,true,'ilk aşamada savaş sürer');assert.equal(mid.res.min,r0.min,'ödeme yok');const lk=mid.o.med.link;
   /* kayıt → host kapanır → YENİ oda */
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   await ctx.H.close().catch(()=>{});const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code2=await h.evaluate(()=>MP1Host.code);setCode(code2);await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   for(const n of ['B','C','D']){await pg[n].goto(origin[n]+'/mp/play?code='+code2);await wait(pg[n],()=>window.MP1Join&&(MP1Join.ws||document.getElementById('jName')));if(await pg[n].evaluate(()=>!MP1Join.ws&&!!document.querySelector('[data-j="go"]')))await tap(pg[n],'[data-j="go"]');await wait(pg[n],e=>MP1Join.empireId===e,E[n],40000);}
   await tap(h,'[data-m="resumeGo"]');await sleep(800);if(await h.evaluate(()=>!!document.getElementById('mp1Sheet')))await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame',undefined,40000);
   for(const n of ['B','C','D']){await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);}await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await settle('u3-devam');
   const after=await H().evaluate(([id,lk])=>[MP1Host.host.dip.offers.find(o=>o.id===id).status,MP1Host.host.dip.offers.find(o=>o.id===lk).status],[oid,lk]);assert.deepEqual(after,['mediating','pending'],'yeni odada işlem sürer');
   const ridD=await rec(D(),lk);const card=await D().evaluate(id=>{const r=DiplomaticInbox.state().records.find(r=>r.id===id);const d=r.note?.data||r.data;return {items:d.give.concat(d.want).map(i=>dealLabel(i)).join(' | '),title:r.title||'',sub:r.sub||''};},ridD);M.u3.dCard=card;
   const cName=await H().evaluate(c=>G.emps[c].name,E.C);assert.match(card.title,/Barıştırma onayı/);assert(card.sub.includes(cName),'kart aracıyı adıyla gösterir: '+card.sub);
   await accept(D(),ridD);await wait(H(),([b,d])=>!G.emps[b].war[d],[E.B,E.D],20000);await settle('u3-onay');
   const fin=await H().evaluate(([id,lk,c,b])=>({o:MP1Host.host.dip.offers.find(o=>o.id===id).status,l:MP1Host.host.dip.offers.find(o=>o.id===lk).status,cmin:G.emps[c].res.min,bmin:G.emps[b].res.min}),[oid,lk,E.C,E.B]);
   M.u3.fin={...fin,cmin0:r0.min};assert.deepEqual([fin.o,fin.l],['accepted','accepted']);assert.equal(r0.min-fin.cmin,200,'karşılık bir kez');
   assert.notEqual((await cmd('D',{kind:'respond',offer:lk,action:'accept'})).status,'ok','ikinci onay yok');});

 await test('U4 NF-4: B İLİŞKİ → C\'ye tek dokunuş Saldırmazlık (çift dokunuş); sayfa yenilenir → "Bekliyor" sürer, ikinci teklif yok; C kabul → "Kabul edildi"',async()=>{
   const cB=await lid(B(),E.C);await closeUI(B());await B().evaluate(c=>UI.selectDiplo(c,'relation'),cB);await wait(B(),()=>document.querySelector('.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]'));
   const n0=await offersN();const sel='.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]';const l=B().locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await l.tap({force:true,timeout:1500}).catch(()=>{});
   await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);await sleep(800);const n1=await offersN();assert.equal(n1-n0,1,'çift dokunuş tek teklif');
   await wait(B(),()=>(document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyState')||{}).dataset?.state==='pending',undefined,20000).catch(async()=>{await B().evaluate(c=>UI.selectDiplo(c,'relation'),cB);});
   await shot(B(),'u4-bekliyor');await B().reload();await ready(B(),E.B,60000);await B().evaluate(CANON+GUESTLIB);await settle('u4-yenile');
   await closeUI(B());await B().evaluate(c=>UI.selectDiplo(c,'relation'),cB);await wait(B(),()=>document.querySelector('.quickTreaty[data-kind="nap"]'));
   const st=await B().evaluate(()=>({state:(document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyState')||{}).dataset?.state||'',dis:document.querySelector('.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]').disabled}));M.u4={st};
   assert.deepEqual(st,{state:'pending',dis:true},'yenilemeden sonra bekliyor');await B().evaluate(()=>UI.act('quickTreaty',document.querySelector('.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]').dataset.x));await sleep(1500);
   assert.equal(await offersN(),n1,'yenilemeden sonra ikinci teklif yok');const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
   await settle('u4-o');const rid=await rec(C(),oid);await accept(C(),rid);await wait(H(),([b,c])=>G.emps[b].nap&&G.emps[b].nap[c]>G.day,[E.B,E.C],20000);await settle('u4-kabul');
   await B().evaluate(c=>UI.selectDiplo(c,'relation'),cB);const fin=await waitv(B(),()=>{const s=document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyState');return s&&s.dataset.state==='accepted'?s.innerText:null;},undefined,20000);
   M.u4.fin=fin;await shot(B(),'u4-kabul');});

 await test('U5 birleşik teklif (lüks + kaynak) gönderilirken C hattı kopar → taslak korunur, tek kayıt; kabul anında lüks geçersizse hiçbir şey uygulanmaz',async()=>{
   const bC=await lid(C(),E.B);await openDeal(C(),bC);await C().evaluate(()=>{UI.deal.give=[{t:'lux',k:'kristal'},{t:'res',r:'ala',v:20}];UI.deal.want=[{t:'res',r:'min',v:10}];UI.drawDeal();});await wait(C(),()=>document.querySelector('[data-a="dealSend"]'));
   const n0=await offersN();lanes.C.freeze();await tap(C(),'[data-a="dealSend"]');await sleep(1200);const kept=await C().evaluate(()=>!!(UI.deal&&UI.deal.give.some(i=>i.t==='lux')));
   await lanes.C.down();await sleep(2500);await lanes.C.up();await relink('C');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,40000).catch(()=>{});
   const tx=await C().evaluate(()=>MP6Stars.S.dealTrace?MP6Stars.S.dealTrace.slice(-6):[]);let n1=await offersN();
   if(n1===n0){await C().evaluate(()=>{try{MP6Stars.S.dealTxTick&&MP6Stars.S.dealTxTick();}catch{}});await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,40000);n1=await offersN();}
   M.u5={kept,added:n1-n0,trace:tx};assert.equal(kept,true,'taslak host yanıtına kadar korunur');assert.equal(n1-n0,1,'tek kayıt');
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);const pre=await H().evaluate(([b,c])=>({ala:[G.emps[b].res.ala,G.emps[c].res.ala],g:JSON.stringify(G.emps[b].luxGrant||{})}),[E.B,E.C]);
   await H().evaluate(c=>{const e=G.emps[c];for(const cc of e.colonies){const p=G.sys[cc.s].planets[cc.p];if(p.lux==='kristal')p.lux=null;}refreshLuxury(e);MP1Host.host.publish();},E.C);await settle('u5-kayip');
   const st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id),oid);assert.equal(st.status,'invalid',JSON.stringify(st));
   assert.notEqual((await cmd('B',{kind:'respond',offer:oid,action:'accept'})).status,'ok');
   const post=await H().evaluate(([b,c])=>({ala:[G.emps[b].res.ala,G.emps[c].res.ala],g:JSON.stringify(G.emps[b].luxGrant||{})}),[E.B,E.C]);assert.deepEqual(post,pre,'kısmi uygulama yok');M.u5.why=st.why;});

 await test('U6 NF-5: insan → AI son tarihsiz Savaş Sözü — erişimsiz hedefte AI gerekçeyle reddeder',async()=>{
   const pair=await H().evaluate(b=>{const B=G.emps[b];const A=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead);for(const a of A)for(const x of A){if(a===x)continue;
     const o={from:b,to:a.id,give:[{t:'res',r:'min',v:900}],want:[{t:'warOn',target:x.id}],born:G.day,expires:G.day+300};const q=dealQuote(o);if(q.ok&&!warSupportReach(a,x,B,[]))return {a:a.id,x:x.id};}return null;},E.B);
   M.u6={pair};if(!pair){console.log('  U6: quote\'u geçen erişimsiz AI çifti yok — Node A1 ile kapsandı');return;}
   const n0=await offersN();const r=await cmd('B',{kind:'offer',to:pair.a,give:[{t:'res',r:'min',v:900}],want:[{t:'warOn',target:pair.x}]});await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));const war=await H().evaluate(([a,x])=>!!G.emps[a].war[x],[pair.a,pair.x]);M.u6={...M.u6,r,status:o.status,why:o.why,war};
   assert.equal(o.status,'rejected',JSON.stringify(M.u6));assert.match(o.why,/askerî erişim/);assert.equal(war,false,'savaş ilan edilmedi');});
};
