'use strict';
/* MP-TECHLUX.0 — Teknoloji, Lüks Mal ve 👁 İstihbarat (sensör paylaşımı) gerçek STARS arayüzünde: host + misafir B + misafir C (ayrı Chromium kalıcı profilleri).
   T1 C gerçek masada (dokunuş) B'ye teknoloji verir, B'den lüks mal ister (liste host'un dealAssets yanıtından, İZLENİYOR); özet teknolojinin
      sağladığını ve lüks erişiminin etkisini gösterir; B karttan "Masaya otur" → karşılık ekler → karşı teklif; C karttan kabul → host: B'de
      teknoloji, C'de erişim kaydı (veren B); B ve C aynaları doğru
   T2 istihbaratı yetmeyen B: "İstiyorum" teknoloji / lüks düğmeleri pasif + görünür neden; host listesi dönmez
   T3 birleşik teklif (teknoloji + kaynak) beklerken veren teknolojiyi kaybeder → teklif gerekçeyle geçersiz (iki tarafta), kabul işlenmez,
      hiçbir madde uygulanmaz (host durumu)
   T4 C'nin lüks teklifini B iki kez kabul eder + yanıt sırasında hat donar / kopar → tek erişim kaydı, tek ödeme
   T5 👁 İstihbarat: C gerçek masada B'den görüş ister → B kabul → B filosu yeni sisteme → C haritasında (G.vis) görünür; host ve B'de değil
   T6 kaydet → host kapanır → YENİ oda → misafirler döner → teknoloji, erişim kayıtları ve sensör paylaşımı aynı
   T7 insan → AI: C, AI'ya teknoloji verir (gerçek masa); sonuç motorun aiRespond kararı, kabulde AI'da teknoloji */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const M=metrics.techlux={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}try{UI.closeDiplo?.();}catch{}document.getElementById('diploPane').classList.remove('show');}).catch(()=>{});
 const rec=(p,id)=>waitv(p,id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},id,20000);
 const accept=(p,rid)=>p.evaluate(id=>DiplomaticInbox.resolve(id,true,undefined,G.emps),rid);
 const pick=async(p,label)=>{await wait(p,()=>document.querySelector('#modal [data-a="pickOne"]'));const i=await p.evaluate(n=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].findIndex(b=>b.innerText.includes(n)),label);if(i<0)throw Error('listede yok: '+label);await tap(p,`#modal [data-a="pickOne"][data-x="${i}"]`);};
 const openDeal=async(p,to)=>{await closeUI(p);await p.evaluate(b=>{UI.forgetDeal(b);UI.openDeal(b);},to);await wait(p,()=>document.querySelector('[data-a="dealSend"]'));};
 const offersN=()=>H().evaluate(()=>MP1Host.host.dip.offers.length);
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 const fx=await H().evaluate(([b,c])=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});
   const ai=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead);for(const e of ai)if(isPurifier(e)){e.mizac='militarist';delete e._pers;}
   for(const e of G.emps)if(!e.wild&&!e.dead){for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.rel[o.id]=Math.max(e.rel[o.id]||0,70);e.war[o.id]=false;}e.intel={};if(e.visionFrom)e.visionFrom={};}
   for(const id of [b,c]){const e=G.emps[id];for(const r of ['min','ene','ala','yiy','tuk','etk'])e.res[r]=Math.max(e.res[r]||0,6000);}
   const free=t=>!(TECHS[t].requirements||[]).length,T=Object.keys(TECHS).filter(free).filter(t=>!G.emps[b].techs[t]&&!G.emps[c].techs[t]);
   const tC=T[0],tC2=T[1],tB=T[2];G.emps[c].techs[tC]=true;G.emps[c].techs[tC2]=true;G.emps[b].techs[tB]=true;
   const K=Object.keys(LUXURY);   /* lüks mal gerçekçi kaynakla: ana gezegene (misafir de luxOwn'u kolonilerinden hesaplar) — B: K0, C: K1 */
   for(const [id,k] of [[b,K[0]],[c,K[1]]]){const e=G.emps[id],pl=G.sys[e.home].planets.find(p=>p.col&&p.owner===id);pl.lux=k;refreshLuxury(e);}G.emps[c].intel[b]=2;
   const vis=id=>humanVisionContext(G.emps[id]).visible,Xs=G.sys.find(s=>s.owner<0&&!vis(0).has(s.id)&&!vis(b).has(s.id)&&!vis(c).has(s.id));
   MP1Host.host.publish();return {tC,tC2,tB,nC:TECHS[tC].n,nC2:TECHS[tC2].n,K0:K[0],K1:K[1],L0:LUXURY[K[0]].n,L1:LUXURY[K[1]].n,X:Xs.id,AI:ai[0].id};},[E.B,E.C]);
 M.fx=fx;await settle('t0');
 

 await test('T1 C gerçek masada teknoloji verir + B\'den lüks ister (host listesi, İZLENİYOR); özet; B karşı teklif; C kabul → B\'de teknoloji, C\'de erişim kaydı',async()=>{
   const bC=await lid(C(),E.B);await openDeal(C(),bC);
   await tap(C(),'[data-a="dealAdd"][data-x="give:tech"]');await pick(C(),fx.nC);await wait(C(),t=>UI.deal.give.some(i=>i.t==='tech'&&i.id===t),fx.tC);
   await tap(C(),'[data-a="dealAdd"][data-x="want:lux"]');await pick(C(),fx.L0);await wait(C(),k=>UI.deal.want.some(i=>i.t==='lux'&&i.k===k),fx.K0);
   const sum=await C().evaluate(()=>[...document.querySelectorAll('.dealAssetRow')].map(x=>x.innerText).join(' | '));M.t1={sum:sum.slice(0,700)};await shot(C(),'t1-ozet');
   assert.match(sum,/Teknoloji/);assert.match(sum,/kabul anında/);assert.match(sum,/Lüks mal erişimi/);
   const n0=await offersN();await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o1=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.t1.o1={id:o1.id,give:o1.give,want:o1.want};assert.deepEqual(o1.give.map(i=>i.t+':'+(i.id||i.k)),['tech:'+fx.tC]);assert.deepEqual(o1.want.map(i=>i.t+':'+(i.id||i.k)),['lux:'+fx.K0]);
   await settle('t1-o1');const rid=await rec(B(),o1.id);const lbl=await B().evaluate(id=>{const r=DiplomaticInbox.state().records.find(r=>r.id===id);const d=r.note?.data||r.data;return d.give.concat(d.want).map(i=>dealLabel(i)).join(' | ');},rid);M.t1.bCard=lbl;
   assert(lbl.includes(fx.nC),'kart teknolojiyi okur');assert(lbl.includes(fx.L0),'kart lüks malı okur');
   await closeUI(B());await B().evaluate(id=>{const r=DiplomaticInbox.state().records.find(r=>r.id===id);UI.aiDealOpen(r.note?.data||r.data);},rid);await tap(B(),'#modal [data-a="offCounter"]');
   await wait(B(),()=>document.querySelector('[data-a="dealSend"]')&&UI.deal.give.some(i=>i.t==='lux'));
   await tap(B(),'[data-a="dealAdd"][data-x="want:res"]');await wait(B(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(B(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(B(),()=>document.getElementById('dealAmountInput'));await B().fill('#dealAmountInput','15');await tap(B(),'#modal [data-a="amountApply"]');await wait(B(),()=>UI.deal.want.some(i=>i.t==='res'));await shot(B(),'t1-b-karsi');
   const n1=await offersN();await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n1,20000);
   const o2=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.t1.o2={id:o2.id,from:o2.from,give:o2.give,want:o2.want};assert.equal(o2.from,E.B);
   await settle('t1-o2');const rid2=await rec(C(),o2.id);M.t1.accept=await accept(C(),rid2);await wait(H(),([b,t])=>!!G.emps[b].techs[t],[E.B,fx.tC],20000);await settle('t1-kabul');
   const h=await H().evaluate(([b,c,t,k])=>({bt:!!G.emps[b].techs[t],ct:!!G.emps[c].techs[t],g:(G.emps[c].luxGrant||{})[k],bown:!!G.emps[b].luxOwn[k]}),[E.B,E.C,fx.tC,fx.K0]);M.t1.host=h;
   assert.deepEqual(h,{bt:true,ct:true,g:E.B,bown:true});
   const bm=await B().evaluate(t=>!!G.p.techs[t],fx.tC),cm=await C().evaluate(k=>G.p.luxGrant&&G.p.luxGrant[k],fx.K0);M.t1.mirror={bm,cm,bLocal:await lid(C(),E.B)};assert.equal(bm,true);assert.equal(cm,M.t1.mirror.bLocal);});

 await test('T2 istihbaratı yetmeyen B: "İstiyorum" teknoloji / lüks pasif + görünür neden; host listesi dönmez',async()=>{
   const cB=await lid(B(),E.C);await openDeal(B(),cB);
   const ui=await B().evaluate(()=>({tech:document.querySelector('[data-a="dealAdd"][data-x="want:tech"]').disabled,lux:document.querySelector('[data-a="dealAdd"][data-x="want:lux"]').disabled,why:document.querySelector('.dealAssetWhy')?.innerText||''}));M.t2={ui};
   assert.equal(ui.tech,true);assert.equal(ui.lux,true);assert.match(ui.why,/İZLENİYOR/);await shot(B(),'t2-neden');
   const a=await cmd('B',{kind:'dealAssets',to:E.C});M.t2.ro=a;assert.equal(a.status,'ok');const ex=await B().evaluate(cid=>(MP1Join.results.filter(y=>y.cid===cid).at(-1)||{}).extra,a.cid);M.t2.extra=ex;
   assert.equal(ex.intel,false);assert.equal(ex.tech,undefined);await closeUI(B());});

 await test('T3 birleşik teklif (teknoloji + kaynak) beklerken veren teknolojiyi kaybeder → geçersiz (iki tarafta neden), kabul işlenmez, hiçbir madde uygulanmaz',async()=>{
   const r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'tech',id:fx.tC2},{t:'res',r:'ala',v:40}],want:[]});assert.equal(r.status,'ok',JSON.stringify(r));
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);const pre=await H().evaluate(([b,c,t])=>({bt:!!G.emps[b].techs[t],ala:[G.emps[b].res.ala,G.emps[c].res.ala]}),[E.B,E.C,fx.tC2]);
   await H().evaluate(([c,t])=>{delete G.emps[c].techs[t];MP1Host.host.publish();},[E.C,fx.tC2]);await settle('t3');
   const st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id),oid);M.t3={status:st.status,why:st.why};assert.equal(st.status,'invalid');assert.match(st.why,/Teknoloji/);
   const views={B:await B().evaluate(()=>MP6Stars.S.J.game.view.dip.offers.slice(-3).map(o=>[o.status,o.why])),C:await C().evaluate(()=>MP6Stars.S.J.game.view.dip.offers.slice(-3).map(o=>[o.status,o.why]))};M.t3.views=views;
   for(const n of ['B','C'])assert(views[n].some(([s,w])=>s==='invalid'&&/Teknoloji/.test(w)),n+' nedeni görür');
   const acc=await cmd('B',{kind:'respond',offer:oid,action:'accept'});assert.notEqual(acc.status,'ok');
   const post=await H().evaluate(([b,c,t])=>({bt:!!G.emps[b].techs[t],ala:[G.emps[b].res.ala,G.emps[c].res.ala]}),[E.B,E.C,fx.tC2]);assert.deepEqual(post,pre,'hiçbir madde uygulanmadı');});

 await test('T4 C\'nin lüks teklifini B iki kez kabul eder + hat donar / kopar → tek erişim kaydı, tek ödeme',async()=>{
   const r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'lux',k:fx.K1}],want:[{t:'res',r:'min',v:25}]});assert.equal(r.status,'ok',JSON.stringify(r));
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('t4-o');const rid=await rec(B(),oid);const min0=await H().evaluate(b=>G.emps[b].res.min,E.B);
   lanes.B.freeze();const a1=await accept(B(),rid),a2=await accept(B(),rid);M.t4={a1,a2};
   await lanes.B.down();await sleep(2500);await lanes.B.up();await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await ready(B(),E.B);await settle('t4-geri');
   let st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,oid);
   if(st==='pending'){const rid2=await rec(B(),oid);M.t4.retry=await accept(B(),rid2);await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',oid,20000);}
   const again=await cmd('B',{kind:'respond',offer:oid,action:'accept'});assert.notEqual(again.status,'ok');
   const h=await H().evaluate(([b,k,id])=>({g:(G.emps[b].luxGrant||{})[k],min:G.emps[b].res.min,st:MP1Host.host.dip.offers.find(o=>o.id===id).status}),[E.B,fx.K1,oid]);M.t4.host={...h,min0};
   assert.equal(h.st,'accepted');assert.equal(h.g,E.C);assert.equal(min0-h.min,25,'tek ödeme');});

 await test('T5 👁 İstihbarat: C gerçek masada B\'den görüş ister → B kabul → B filosu yeni sisteme → C haritasında görünür; host ve B haritasında değil (paylaşım yönü)',async()=>{
   const bC=await lid(C(),E.B);await openDeal(C(),bC);await tap(C(),'[data-a="dealAdd"][data-x="want:intel"]');await wait(C(),()=>UI.deal.want.some(i=>i.t==='intel'));
   const n0=await offersN();await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('t5-o');const rid=await rec(B(),oid);await accept(B(),rid);
   await wait(H(),([c,b])=>!!(G.emps[c].visionFrom||{})[b],[E.C,E.B],20000);
   const before=await C().evaluate(x=>G.vis.has(x),fx.X);
   await H().evaluate(([b,x])=>{const f=G.fleets.find(f=>f.e===b&&f.ships.length);f.sys=x;f.mv=null;MP1Host.host.publish();},[E.B,fx.X]);await settle('t5-filo');
   const after=await waitv(C(),x=>G.vis.has(x)||null,fx.X,20000).catch(()=>false);
   const hostSees=await H().evaluate(x=>humanVisionContext(G.p).visible.has(x),fx.X),bDir=await H().evaluate(([b,c])=>!!(G.emps[b].visionFrom||{})[c],[E.B,E.C]);
   M.t5={before,after,hostSees,bDir};assert.equal(before,false);assert.equal(after,true,'C haritasında görünür');assert.equal(hostSees,false,'ilgisiz host görmez');assert.equal(bDir,false,'yön: B, C\'den almaz');
   await C().evaluate(x=>{View.centerOn?View.centerOn(x):0;},fx.X).catch(()=>{});await shot(C(),'t5-c-harita');});

 await test('T6 kaydet → host kapanır → YENİ oda → misafirler döner → teknoloji, erişim kayıtları ve sensör paylaşımı aynı',async()=>{
   const snap=()=>H().evaluate(([b,c])=>JSON.stringify({bt:Object.keys(G.emps[b].techs).sort(),cg:G.emps[c].luxGrant||{},cv:G.emps[c].visionFrom||{}}),[E.B,E.C]);const before=await snap();
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   await ctx.H.close().catch(()=>{});const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code2=await h.evaluate(()=>MP1Host.code);setCode(code2);await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   for(const n of ['B','C']){await pg[n].goto(origin[n]+'/mp/play?code='+code2);await wait(pg[n],()=>window.MP1Join&&(MP1Join.ws||document.getElementById('jName')));if(await pg[n].evaluate(()=>!MP1Join.ws&&!!document.querySelector('[data-j="go"]')))await tap(pg[n],'[data-j="go"]');await wait(pg[n],e=>MP1Join.empireId===e,E[n],40000);}
   await tap(h,'[data-m="resumeGo"]');await sleep(800);if(await h.evaluate(()=>!!document.getElementById('mp1Sheet')))await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame',undefined,40000);
   for(const n of ['B','C']){await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);}await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await settle('t6-devam');
   const after=await snap();M.t6={before,after};assert.equal(after,before,'aynı');
   M.t6.c={g:await C().evaluate(k=>(G.p.luxGrant||{})[k],fx.K0),vis:await C().evaluate(x=>G.vis.has(x),fx.X)};assert.equal(M.t6.c.vis,true,'yeni odada C görüşü');assert(M.t6.c.g!==undefined,'yeni odada C erişim kaydı');});

 await test('T7 insan → AI: C gerçek masada AI\'ya teknoloji verir; sonuç motorun aiRespond kararı; kabulde AI\'da teknoloji',async()=>{
   const aC=await lid(C(),fx.AI),tName=await H().evaluate(t=>TECHS[t].n,fx.tC);await openDeal(C(),aC);
   await tap(C(),'[data-a="dealAdd"][data-x="give:tech"]');await pick(C(),tName);await wait(C(),()=>UI.deal.give.some(i=>i.t==='tech'));
   const n0=await offersN();await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));const has=await H().evaluate(([a,t])=>!!G.emps[a].techs[t],[fx.AI,fx.tC]);M.t7={status:o.status,by:o.by,has};
   assert(['accepted','rejected','countered'].includes(o.status),JSON.stringify(M.t7));assert.equal(has,o.status==='accepted','kabul ⇔ AI\'da teknoloji');await closeUI(C());});
};
