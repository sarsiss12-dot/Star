'use strict';
/* MP-FIELD-VERIFY.0 — Z senaryosunun son kabul adımları (Z5–Z9'un ardından; bkz. mp-field-fix0-mp.cjs başlığı).
   Akış zaten: kaydet → host kapanır → yeni oda → host tek başına olaylar → misafirler kendi devletine döner → Fetih savaşı → destek daveti → filo emri.
   Z10 dönen misafir B olay kartına DOKUNUR ve karar verir (host'ta bir kez); filo emrini gerçek motor işlevinden (orderMove) verir → host uygular, B haritası aynı
   Z11 Q6: B gerçek masada "Savaşa Destek İste" (cephe) + TOPRAK VAADİ (dokunuş) → host'a. Canlı dünya güncellenirken taslak korunur. Hat DONAR (gönderilen
       çerçeve kaybolur) → TEKLİFİ SUN → "yanıt bekleniyor", taslak durur; tekrar basış; hat kopar/döner → aynı işlem (cid) yeniden gider → host'ta TEK kayıt,
       doğru cephe ve sistem; host gelen kutusunda kart; iz (taslak → gönderim → yeniden → yanıt → ileti) aynı işlem kimliğiyle
   Z12 ret (host duraklatıldı) → açık neden, taslak düzenlenebilir; sonra aynı taslak kabul edilir (tek kayıt). Soket KAPANIRKEN basış → "bağlantı yok",
       taslak durur; bağlantı dönünce tek kayıt. Host karşı teklifi → B kabul → host cephede savaşta, vaat TEK kez yazılır; savaş kapanınca gecikmiş kabul işlenmez
   Z13 ikinci kayıt/devam: devam lobisinde DAVET PAYLAŞ bağlantısı (B), eski oda kodu (oda aşaması), aynı profilde açık ikinci sekme (koltuk başka sekmede),
       C ana menüden yeni kodla; DEVAM ET; aynı odada C'nin hattı kopar / döner → aynı devlet, tarih ilerler, C'nin filo emri host'ta ve C haritasında */
module.exports=async(X,{E,M,ready,where,closeUI,cards,ensure})=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const V=M.verify={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const hostRecInstall=()=>H().evaluate(()=>{window.__hostRec=id=>{try{MP71Dip.tick();}catch{}return DiplomaticInbox.state().records.find(r=>r.kind==='aideal'&&(r.key==='deal:mp71:'+id||r.note&&r.note.key==='mp71:'+id))||null;};});
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const offersFrom=(n0,from)=>H().evaluate(([n0,from])=>MP1Host.host.dip.offers.slice(n0).filter(o=>o.from===from).map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,
   give:o.give.map(i=>({t:i.t,sys:i.sys,front:i.front,r:i.r,v:i.v})),want:o.want.map(i=>({t:i.t,front:i.front,target:i.target}))})),[n0,from]);
 const bState=()=>B().evaluate(()=>{const S=MP6Stars.S,d=UI.deal;return {msg:UI.dealMsg||'',tx:S.dealTx?{id:S.dealTx.id,tries:S.dealTx.tries,sent:S.dealTx.sent}:null,
   give:d?d.give.map(i=>i.t+(i.sys!==undefined?':'+i.sys:'')+(i.r?':'+i.r+':'+i.v:'')):null,want:d?d.want.map(i=>i.t+(i.front!==undefined?':'+i.front:'')):null,
   page:UI.diploPage,shown:document.getElementById('diploPane').classList.contains('show'),builds:S.stats.builds,trace:(S.dealTrace||[]).slice(-14)};});
 const moveOrder=async(n,e)=>{const mv=await H().evaluate(b=>{const fs=G.fleets.filter(f=>f.e===b&&f.ships.length&&!f.mv&&!f.path.length&&f.sys>=0&&!f.combat&&!hasShipment(f));
     for(const f of fs){const to=G.sys[f.sys].lanes.find(l=>__mp8.why(G.emps[b],{kind:'move',fleet:f.id,to:l})===null);if(to!==undefined)return {fleet:f.id,from:f.sys,to};}return null;},e);
   assert(mv,n+': hareket edebilen filo');
   /* gerçek STARS yolu: misafirde motorun orderMove'u (rota menüsünün çağırdığı işlev) MP 'move' komutuna iner */
   const sent=await pg[n].evaluate(([f,to])=>orderMove(G.fleets.find(x=>x.id===f),to),[mv.fleet,mv.to]);assert.equal(sent,true,n+': emir gönderildi');
   await wait(H(),([f,to])=>{const x=G.fleets.find(q=>q.id===f);return !!x&&(x.sys===to||x.mv&&x.mv.to===to||(x.path||[]).includes(to));},[mv.fleet,mv.to],20000);
   await advance(4);await settle('emir-'+n);
   const h=await H().evaluate(f=>{const x=G.fleets.find(q=>q.id===f);return x?{sys:x.sys,mv:x.mv?x.mv.to:null,path:x.path.slice()}:null;},mv.fleet);
   const g=await pg[n].evaluate(f=>{const x=G.fleets.find(q=>q.id===f);return x?{sys:x.sys,mv:x.mv?x.mv.to:null,path:x.path.slice()}:null;},mv.fleet);
   assert(h&&(h.sys===mv.to||h.mv===mv.to||h.path.includes(mv.to)),n+': emir host dünyasında '+JSON.stringify(h));assert.deepEqual(g,h,n+': misafir haritasında filo host ile aynı');return {mv,h,g};};

 await test('Z10 dönen misafir B: olay kartına dokunup karar verir (host\'ta bir kez, kart kalkar); filo emri gerçek motor işlevinden → host uygular, B haritasında aynı',async()=>{
   await ensure('B');await closeUI(B());
   const q=await H().evaluate(b=>{const e=G.emps[b];for(const k of ['e2','e3','e5','e6','e7','e1','e4']){const r=enqueueDecision(e,'event',k);if(r.ok){MP1Host.host.publish();return {id:r.id,k};}}return null;},E.B);
   assert(q,'deterministik olay kuyruğa girdi');V.decision={q};
   const uid=await waitv(B(),id=>{const n=(G.inbox||[]).find(n=>n.decisionId===id&&!n.hidden);return n&&document.querySelector(`#inbox .nCard[data-x="${n.uid}"]`)?n.uid:null;},q.id,20000);
   await tap(B(),`#inbox .nCard[data-x="${uid}"]`);await wait(B(),()=>!document.getElementById('modal').classList.contains('hidden')&&document.querySelector('#modal [data-a="evch"]'),undefined,15000);await shot(B(),'z10-olay-karari');
   await tap(B(),'#modal [data-a="evch"][data-x="0"]');
   await wait(H(),([b,id])=>G.emps[b].decisions.pending.find(n=>n.id===id)?.status==='resolved',[E.B,q.id],20000);await settle('z10');
   V.decision.after=await B().evaluate(id=>({card:(G.inbox||[]).some(n=>n.decisionId===id),modal:!document.getElementById('modal').classList.contains('hidden')}),q.id);
   assert.equal(V.decision.after.card,false,'karar verilen kart kalktı');
   const again=await cmd('B',{kind:'eventChoice',id:q.id,choice:0});V.decision.again=again;assert.notEqual(again.status,'ok','ikinci karar işlenmez');
   await closeUI(B());V.move=await moveOrder('B',E.B);});

 await test('Z11 Q6 toprak vaadi + destek teklifi: gerçek masada dokunuşla taslak; canlı dünyada taslak korunur; hat donunca gönderim kaybolsa da taslak + "yanıt bekleniyor"; tekrar basış ve yeniden bağlanma ÇİFT KAYIT üretmez; host\'ta tek kayıt doğru cephe/sistemle, host gelen kutusunda',async()=>{
   await ensure('B');await closeUI(B());await closeUI(H());
   const F=M.support.F,T=M.fetih.fx.t2;V.q6={F,T};
   assert.equal(await H().evaluate(([b,t])=>!!G.emps[b].war[t],[E.B,T]),true,'B hâlâ Fetih cephesinde');
   V.q6.fx=await H().evaluate(([b,t])=>{G.p.contact[t]=G.emps[t].contact[G.p.id]=true;G.p.contact[b]=G.emps[b].contact[G.p.id]=true;
     let add=[];if(warFetihCandidates(G.emps[b],G.emps[t]).length<2){const v=humanVisionContext(G.emps[b]).visible;add=G.sys.filter(s=>v.has(s.id)&&s.owner<0&&s.seen.includes(b)).slice(0,2);for(const s of add)territoryOwnerSet(s,t);}   /* FİKSTÜR: vaat edilecek bilinen düşman sistemi */
     MP1Host.host.publish();return {added:add.map(s=>s.id),cand:warFetihCandidates(G.emps[b],G.emps[t]).map(x=>x.id)};},[E.B,T]);
   await settle('z11');const hB=await lid(B(),0);V.q6.hostLocal=hB;
   /* taslak: gerçek düğmelere dokunuş */
   await B().evaluate(h=>{try{UI.closeDiplo?.();}catch{}UI.forgetDeal(h);UI.openDeal(h);},hB);await wait(B(),()=>document.querySelector('[data-a="dealSupport"]'),undefined,15000);
   await tap(B(),'[data-a="dealSupport"]');await wait(B(),F=>!!document.querySelector(`[data-a="dealSupportPick"][data-x^="front:${F}:"]`),F,20000);
   await tap(B(),`[data-a="dealSupportPick"][data-x^="front:${F}:"]`);await wait(B(),F=>UI.deal.want.some(i=>i.t==='warJoin'&&i.front===F),F);
   await wait(B(),()=>document.querySelector('[data-a="dealPromise"]'),undefined,15000);const picks=await B().evaluate(()=>[...document.querySelectorAll('[data-a="dealPromise"]')].map(b=>b.dataset.x));V.q6.picks=picks;
   const pick=picks[0];await tap(B(),`[data-a="dealPromise"][data-x="${pick}"]`);await wait(B(),s=>UI.deal.give.some(i=>i.t==='landPromise'&&i.sys===s),+pick.split(':')[0]);
   const draft=await bState();V.q6.draft=draft;await shot(B(),'z11-taslak');
   /* canlı dünya: host oyunu yürütür, B aynası en az 3 kez yeniden kurulur; taslak ve açık sayfa korunur */
   await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:2}));await wait(B(),n=>MP6Stars.S.stats.builds>=n+3,draft.builds,40000);await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await settle('z11-canli');
   const live=await bState();V.q6.live={builds:live.builds-draft.builds,give:live.give,want:live.want,page:live.page,shown:live.shown};
   assert.deepEqual([live.give,live.want,live.page,live.shown],[draft.give,draft.want,'deal',true],'canlı ayna taslağı ve açık masayı korur');
   /* hat DONAR: soket açık sanılır, gönderilen çerçeve host'a ulaşmaz */
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);V.q6.n0=n0;lanes.B.freeze();
   await tap(B(),'[data-a="dealSend"]');const s1=await bState();V.q6.frozenSend=s1;await shot(B(),'z11-yanit-bekleniyor');
   assert(s1.tx,'işlem açık (yanıt bekleniyor): '+JSON.stringify(s1.msg));assert.match(s1.msg,/yanıt bekleniyor/i);
   assert.deepEqual([s1.give,s1.want],[draft.give,draft.want],'taslak host yanıtına kadar korunur');
   await sleep(1500);await tap(B(),'[data-a="dealSend"]');const s2=await bState();V.q6.rePress=s2.msg;assert.match(s2.msg,/çift teklif oluşmaz|yanıt bekliyor/i);
   assert.equal(await H().evaluate(()=>MP1Host.host.dip.offers.length),n0,'donmuş hatta host henüz kayıt görmedi');
   await lanes.B.down();await sleep(2500);await lanes.B.up();await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);
   await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,45000);await sleep(10000);await B().evaluate(()=>MP6Stars.S.dealTx&&UI.dealSend());   /* gecikmiş yanıttan sonra bir basış daha */
   await sleep(3000);const offs=await offersFrom(n0,E.B);V.q6.offers=offs;
   assert.equal(offs.length,1,'host\'ta TEK kayıt: '+JSON.stringify(offs));const o=offs[0];V.q6.offer=o.id;
   assert.equal(o.to,0);const lp=o.give.find(i=>i.t==='landPromise');assert(lp&&lp.front===F&&lp.sys===+pick.split(':')[0],'vaat doğru cephe + sistem '+JSON.stringify(o.give));
   assert(o.want.some(i=>i.t==='warJoin'&&i.front===F&&i.target===T),'katılım isteği doğru cephe');
   await wait(B(),()=>!MP6Stars.S.dealTx,undefined,20000);const s3=await bState();V.q6.final={msg:s3.msg,give:s3.give,want:s3.want};
   assert.match(s3.msg,/Teklif gönderildi|zaten bekliyor/,'son ileti: '+s3.msg);assert.deepEqual([s3.give,s3.want],[[],[]],'başarıdan sonra taslak temizlendi');
   const tr=s3.trace.filter(x=>x.tx===s1.tx.id);V.q6.trace=tr;const steps=tr.map(x=>x.step);
   for(const st of ['draft','send','reply','msg'])assert(steps.includes(st),'iz adımı '+st+': '+JSON.stringify(steps));assert(steps.some(s=>/^resend/.test(s)),'yeniden gönderim izi');
   assert.equal(tr.find(x=>x.step==='reply').offer,o.id,'iz: host yanıtı aynı kaydı gösterir');
   await hostRecInstall();V.q6.hostInbox=await H().evaluate(([id])=>{const r=window.__hostRec(id);return {record:r?{status:r.status,key:r.key}:null,cards:(G.inbox||[]).filter(n=>n.key==='mp71:'+id).length};},[o.id]);
   assert(V.q6.hostInbox.record&&V.q6.hostInbox.record.status==='pending'&&V.q6.hostInbox.cards===1,'teklif host\'un gelen kutusunda: '+JSON.stringify(V.q6.hostInbox));await shot(H(),'z11-host-gelen');});

 await test('Z12 ret ve bağlantı hatası taslağı korur; karşı teklif + kabul vaadi TEK kez yazar; savaş kapanınca gecikmiş kabul işlenmez',async()=>{
   await ensure('B');const F=V.q6.F,T=V.q6.T,hB=V.q6.hostLocal;
   const reopen=async extra=>{await B().evaluate(([h,x])=>{UI.openDeal(h);if(x)UI.deal.give.push(x);UI.drawDeal();},[hB,extra]);await wait(B(),()=>UI.deal&&document.querySelector('[data-a="dealSend"]'));};
   /* (a) host REDDİ (duraklatma) → açık neden, taslak düzenlenebilir */
   await B().evaluate(h=>{UI.forgetDeal(h);},hB);await reopen(null);
   await tap(B(),'[data-a="dealSupport"]');await wait(B(),F=>!!document.querySelector(`[data-a="dealSupportPick"][data-x^="front:${F}:"]`),F,20000);await tap(B(),`[data-a="dealSupportPick"][data-x^="front:${F}:"]`);
   await wait(B(),()=>document.querySelector('[data-a="dealPromise"]'),undefined,15000);const pick=await B().evaluate(()=>[...document.querySelectorAll('[data-a="dealPromise"]')].map(b=>b.dataset.x).at(-1));
   await tap(B(),`[data-a="dealPromise"][data-x="${pick}"]`);await B().evaluate(()=>{UI.deal.give.push({t:'res',r:'min',v:1});UI.drawDeal();});   /* önceki bekleyen tekliften farklı içerik */
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await H().evaluate(()=>MP1Host.host.setPaused(true,'host'));
   await tap(B(),'[data-a="dealSend"]');await wait(B(),()=>!MP6Stars.S.dealTx,undefined,20000);const rj=await bState();V.reject={msg:rj.msg,give:rj.give,want:rj.want};await shot(B(),'z12-ret');
   assert.match(rj.msg,/Host reddetti/);assert.match(rj.msg,/taslak korunuyor/i);assert(rj.give.some(x=>/^landPromise/.test(x))&&rj.want.some(x=>/^warJoin/.test(x)),'ret sonrası taslak duruyor '+JSON.stringify(rj));
   await H().evaluate(()=>MP1Host.host.setPaused(false));await settle('z12-devam');
   await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);await wait(B(),()=>!MP6Stars.S.dealTx,undefined,20000);
   const od=await offersFrom(n0,E.B);assert.equal(od.length,1,'düzenlenmiş taslak tek kayıt');V.reject.offer=od[0].id;
   /* (b) soket KAPANIRKEN basış (hostOnline henüz düşmedi) → "bağlantı yok", taslak durur; bağlantı dönünce tek kayıt */
   await reopen({t:'res',r:'min',v:2});const n1=await H().evaluate(()=>MP1Host.host.dip.offers.length);
   const cl=await B().evaluate(()=>{const ws=MP1Join.ws;ws.close();const st0=ws.readyState,on0=MP1Join.hostOnline;UI.dealSend();return {st0,on0,msg:UI.dealMsg,tx:!!MP6Stars.S.dealTx,give:UI.deal&&UI.deal.give.length};});V.closing=cl;
   assert.match(cl.msg,/Bağlantı yok/,'kapanan sokette açık ileti: '+cl.msg);assert(cl.give>=2,'taslak korunur');
   await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await settle('z12-baglanti');await sleep(3000);
   assert.equal(await H().evaluate(()=>MP1Host.host.dip.offers.length),n1,'kaybolan komut sessizce "gönderildi" sayılmaz; host\'ta kayıt yok');
   await B().evaluate(h=>UI.openDeal(h),hB);await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n1,20000);await sleep(2000);
   const oc=await offersFrom(n1,E.B);assert.equal(oc.length,1,'bağlantı dönünce tek kayıt');V.closing.offer=oc[0].id;
   /* (c) host karşı teklifi → B gelen kutusu kaydından kabul → host cephede savaşta, vaat bir kez */
   const a=V.q6.offer,sys=V.q6.offers[0].give.find(i=>i.t==='landPromise').sys,min0=await H().evaluate(b=>G.emps[b].res.min,E.B),pr0=await H().evaluate(()=>(G.warLedger.promises||[]).length);
   const ct=await H().evaluate(([a,F,T,s])=>MP1Host.host.local({kind:'counter',offer:a,give:[{t:'warJoin',front:F,target:T}],want:[{t:'landPromise',sys:s,front:F},{t:'res',r:'min',v:3}]}),[a,F,T,sys]);V.counter={ct};
   assert.equal(ct.ok,true,'host karşı teklifi: '+JSON.stringify(ct));const cid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('z12-karsi');
   const rec=await waitv(B(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},cid,20000);
   const res=await B().evaluate(id=>DiplomaticInbox.resolve(DiplomaticInbox.state().records.find(r=>r.id===id),true),rec);V.counter.accept=res;
   await wait(H(),([h,t])=>!!G.emps[h].war[t],[0,T],20000);await settle('z12-kabul');
   const after=await H().evaluate(([b,s])=>({min:G.emps[b].res.min,promises:(G.warLedger.promises||[]).filter(p=>p.sys===s).map(p=>({sys:p.sys,front:p.front,giver:p.giver,taker:p.taker,state:p.state})),n:(G.warLedger.promises||[]).length}),[E.B,sys]);V.counter.after=after;
   assert.equal(min0-after.min,3,'karşı teklif bedeli bir kez');assert.equal(after.n-pr0,1,'vaat TEK kez yazıldı: '+JSON.stringify(after));assert.equal(after.promises.filter(p=>p.front===F).length,1);
   assert.notEqual((await cmd('B',{kind:'respond',offer:cid,action:'accept'})).status,'ok','ikinci kabul yok');
   /* (d) savaş kapanınca (B–hedef barış) bekleyen eski teklifin gecikmiş kabulü işlenmez */
   await H().evaluate(([b,t])=>{makePeace(G.emps[b],G.emps[t],{force:true,quiet:true});MP1Host.host.publish();},[E.B,T]);const pr1=await H().evaluate(()=>(G.warLedger.promises||[]).length);
   await hostRecInstall();const late=await H().evaluate(([id])=>{const r=window.__hostRec(id);return r?{via:'inbox',...DiplomaticInbox.resolve(r,true)}:{via:'local',...MP1Host.host.local({kind:'respond',offer:id,action:'accept'})};},[V.closing.offer]);V.late=late;
   assert.notEqual(late&&late.ok,true,'kapanan cepheye gecikmiş kabul işlenmez: '+JSON.stringify(late));assert.equal(await H().evaluate(()=>(G.warLedger.promises||[]).length),pr1,'yeni vaat yazılmadı');});

 await test('Z13 ikinci kayıt/devam: DAVET PAYLAŞ bağlantısı (B) + eski oda kodu + aynı profilde ikinci sekme + C ana menüden; DEVAM ET; aynı odada C kopar/döner → aynı devlet, tarih ilerler, C filo emri host\'ta ve C haritasında',async()=>{
   for(const n of ['B','C'])await ensure(n);const old=getCode();
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);const day0=await H().evaluate(()=>Math.floor(G.day));
   await ctx.H.close().catch(()=>{});
   const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code2=await h.evaluate(()=>MP1Host.code);assert.notEqual(code2,old);setCode(code2);V.rejoin2={old,code2};
   await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   /* eski sekme: C'nin sayfası eski odada açık kaldı → oyuna geri dönmez, durum ekranda */
   await sleep(3000);V.rejoin2.oldTab=await where(C());
   /* DAVET PAYLAŞ: devam lobisindeki gerçek düğme (navigator.share yakalanır) */
   await h.evaluate(()=>{window.__share=null;navigator.share=x=>{window.__share=x;return Promise.resolve();};});await tap(h,'[data-m="share"]');const share=await h.evaluate(()=>window.__share);V.rejoin2.share=share;
   assert(share&&/\/mp\/play\?code=/.test(share.url),'davet bağlantısı '+JSON.stringify(share));const shareUrl=share.url.replace(/^https?:\/\/[^/]+/,origin.B);
   await B().goto(shareUrl);await wait(B(),()=>window.MP1Join&&document.getElementById('jName'));if(await B().evaluate(()=>!MP1Join.ws))await tap(B(),'[data-j="go"]');
   await wait(B(),e=>MP1Join.empireId===e,E.B,40000);V.rejoin2.bLobby=await where(B());assert.match(V.rejoin2.bLobby.search,new RegExp('code='+code2));
   /* aynı profilde ikinci sekme: koltuk başka sekmede — ilk sekme koltuğunu korur */
   const b2=await ctx.B.newPage();await b2.goto(origin.B+'/mp/play?code='+code2);await wait(b2,()=>window.MP1Join&&document.getElementById('jName'));if(await b2.evaluate(()=>!MP1Join.ws))await tap(b2,'[data-j="go"]');
   await wait(b2,()=>!!MP1Join.err||MP1Join.empireId!==null,undefined,30000);await sleep(2000);V.rejoin2.secondTab=await where(b2);await shot(b2,'z13-ikinci-sekme');
   const b1=await where(B());V.rejoin2.firstTab=b1;await b2.close();
   /* eski / yanlış oda kodu: C ana menüden eski kodu girer → oda aşaması, oyun açılmaz */
   const c=C();await c.goto(origin.C+'/');await wait(c,()=>document.getElementById('mp1Btn'));await tap(c,'#mp1Btn');await tap(c,'[data-m="join"]');
   await c.waitForURL(u=>/\/mp\/play/.test(String(u)),{timeout:20000});await wait(c,()=>document.getElementById('jCode'));await c.fill('#jCode',old);await tap(c,'[data-j="go"]');
   await wait(c,()=>MP1Join.screen==='join'&&!!MP1Join.err,undefined,30000).catch(()=>{});V.rejoin2.oldCode=await where(c);await shot(c,'z13-eski-kod');
   assert.notEqual(V.rejoin2.oldCode.started,true,'eski kodla oyuna girilmez');assert(['oda','baglanti'].includes(V.rejoin2.oldCode.stage),'eski kod aşaması: '+JSON.stringify(V.rejoin2.oldCode));
   /* C yeni kodla */
   await c.fill('#jCode',code2);await tap(c,'[data-j="go"]');await wait(c,e=>MP1Join.empireId===e,E.C,40000);
   await tap(h,'[data-m="resumeGo"]');await sleep(800);if(await h.evaluate(()=>!!document.getElementById('mp1Sheet')))await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame',undefined,40000);await ready(B(),E.B);await ready(c,E.C);for(const p of [B(),c])await p.evaluate(CANON+GUESTLIB);await settle('z13');
   assert.equal(b1.e,E.B,'ilk sekme koltuğunu korudu');assert.notEqual(V.rejoin2.secondTab.e===E.B&&V.rejoin2.secondTab.started,true,'ikinci sekme aynı koltuğu çalmaz');
   assert.equal(await H().evaluate(()=>Math.floor(G.day)),day0,'kayıt tarihi');
   /* aynı odada kopma / dönüş */
   await lanes.C.down();await sleep(3000);await lanes.C.up();await wait(c,()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await ready(c,E.C);
   const d1=await H().evaluate(()=>G.day);V.rejoin2.move=await moveOrder('C',E.C);assert(await H().evaluate(d=>G.day>d,d1),'tarih ilerledi');
   assert.equal(await c.evaluate(()=>MP1Join.empireId),E.C,'aynı devlet');await shot(c,'z13-c-dondu');});
};
