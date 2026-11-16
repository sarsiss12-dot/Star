'use strict';
/* MP-WARON.0 — Genel Savaş Sözü gerçek STARS arayüzünde: host (insan, masaüstü) + misafir B + misafir C (ayrı Chromium kalıcı profilleri, yatay telefon).
   V1 C gerçek müzakere masasında (dokunuş) B'ye üçüncü devlet X'e karşı son tarihli savaş sözü + karşılık (kaynak) hazırlar; özet "İLAN EDİLMEZ";
      B gelen kutusu kartından "Masaya otur" → ⏱ ile son tarihi değiştirir → karşı teklif; C karttan kabul eder → host'ta tek söz, savaş yok;
      B ve C aynada sözü görür (alan / veren), host'un (üçüncü taraf) satırı yok
   V2 kaydet → host kapanır → YENİ odada devam → misafirler döner → aynı söz, aynı kalan süre; C söz panelindeki düğmeyle NORMAL savaş ilanı
      akışından (hedef → önizleme → son onay) savaşı açar → söz "Tutuldu", B'de de
   V3 ikinci söz (hedef Y) son tarihe kadar tutulmaz → "Çiğnendi": B 'sözünü çiğnedi' hatırlar, ilişki −20; iki aynada durum
   V4 geçersiz şart (insan veren son tarihsiz) gerekçeli ret; hedef elenince söz "Düştü" (ceza yok); aynı kabul iki kez + yanıt sırasında hat
      donar / kopar → tek söz
   V6 host → misafir (masaüstü): söz → ret → yeniden → geri çekme (iptal); misafir → host: söz → host kabul → kayıt + paneller
   V5 Savaş Merkezi "Şartlı Teklif…" taslağı (p35 açığı): taslak düzenlenir, ayna yeniden kurulur ve masa yeniden açılır → taslak korunur */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const M=metrics.waron={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}try{UI.closeDiplo?.();}catch{}document.getElementById('diploPane').classList.remove('show');}).catch(()=>{});
 const rec=(p,id)=>waitv(p,id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},id,20000);
 const accept=(p,rid)=>p.evaluate(id=>DiplomaticInbox.resolve(id,true,undefined,G.emps),rid);
 const pledges=c=>H().evaluate(c=>(G.emps[c].warPledges||[]).map(p=>({id:p.id,to:p.to,target:p.target,until:p.until,state:p.state,why:p.why||''})),c);
 const box=(p,o)=>p.evaluate(o=>{UI.selectDiplo(o,'relation');return null;},o).then(()=>waitv(p,()=>document.querySelector('.warPledgeBox')?.innerText||null,undefined,20000));
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 const fx=await H().evaluate(([b,c])=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});G.feds=[];
   const ai=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead);for(const e of ai)if(isPurifier(e)){e.mizac='militarist';delete e._pers;}
   for(const e of G.emps)if(!e.wild&&!e.dead){for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.rel[o.id]=Math.max(e.rel[o.id]||0,40);e.war[o.id]=false;e.ally[o.id]=false;if(e.nap)delete e.nap[o.id];}}
   for(const s of G.sys)for(const id of [0,b,c])if(!s.seen.includes(id))s.seen.push(id);
   for(const id of [b,c]){const e=G.emps[id];for(const r of ['min','ene','ala','yiy','tuk','etk'])e.res[r]=Math.max(e.res[r]||0,6000);e.warPledges=[];}
   MP1Host.host.publish();return {X:ai[0].id,Y:ai[1].id,Z:ai[2].id,W:ai[3]?ai[3].id:ai[0].id};},[E.B,E.C]);
 M.fx=fx;await settle('v0');

 await test('V1 C gerçek masada son tarihli savaş sözü + karşılık; özet İLAN EDİLMEZ; B karttan "Masaya otur" → ⏱ → karşı teklif; C kabul → tek söz, savaş yok; B/C aynada, host satırı yok',async()=>{
   const bC=await lid(C(),E.B),xC=await lid(C(),fx.X),xName=await C().evaluate(x=>G.emps[x].name,xC);
   await closeUI(C());await C().evaluate(b=>{UI.forgetDeal(b);UI.openDeal(b);},bC);await wait(C(),()=>document.querySelector('[data-a="dealSend"]'));
   await tap(C(),'[data-a="dealAdd"][data-x="give:warOn"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));
   const idx=await C().evaluate(n=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].findIndex(b=>b.innerText.trim().startsWith(n)),xName);assert(idx>=0,'hedef listede: '+xName);
   await tap(C(),`#modal [data-a="pickOne"][data-x="${idx}"]`);await wait(C(),()=>/Son tarih/.test(document.getElementById('modal')?.innerText||''));await shot(C(),'v1-son-tarih');
   await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='warOn'&&Number.isInteger(i.until)));
   await tap(C(),'[data-a="dealAdd"][data-x="want:res"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(C(),()=>document.getElementById('dealAmountInput'));await C().fill('#dealAmountInput','100');await tap(C(),'#modal [data-a="amountApply"]');await wait(C(),()=>UI.deal.want.some(i=>i.t==='res'));
   const sum=await C().evaluate(()=>document.querySelector('.dealPledgeRow[data-mode="pledge"]')?.innerText||'');M.v1={sum:sum.slice(0,500)};await shot(C(),'v1-ozet');
   assert.match(sum,/Genel Savaş Sözü/);assert.match(sum,/İLAN EDİLMEZ/);assert.match(sum,/son tarih/);assert.match(sum,new RegExp(xName));
   const d0=await H().evaluate(()=>Math.floor(G.day)),n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o1=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.v1.o1={id:o1.id,give:o1.give,want:o1.want};
   const w1=o1.give.find(i=>i.t==='warOn');assert(w1&&w1.target===fx.X&&w1.until>=d0+89&&w1.until<=d0+91,JSON.stringify(o1.give));
   /* B: gerçek gelen kutusu kaydı → "Masaya otur" (karşı teklif) → ⏱ → gönder */
   await settle('v1-o1');const rid=await rec(B(),o1.id);const lbl=await B().evaluate(id=>{const r=DiplomaticInbox.state().records.find(r=>r.id===id);return (r.note?.data||r.data||{}).give?.map(i=>dealLabel(i)).join(' | ');},rid);M.v1.bLabel=lbl;
   assert.match(lbl||'',/Savaş sözü/);assert.match(lbl||'',/son tarih/);
   await closeUI(B());await B().evaluate(id=>{const r=DiplomaticInbox.state().records.find(r=>r.id===id);UI.aiDealOpen(r.note?.data||r.data);},rid);await wait(B(),()=>document.querySelector('#modal [data-a="offCounter"]'));
   await tap(B(),'#modal [data-a="offCounter"]');await wait(B(),()=>document.querySelector('[data-a="dealPledgeDays"]'));const u0=await B().evaluate(()=>UI.deal.want.find(i=>i.t==='warOn').until);
   await tap(B(),'[data-a="dealPledgeDays"]');await wait(B(),u=>UI.deal.want.find(i=>i.t==='warOn').until!==u,u0);const u1=await B().evaluate(()=>UI.deal.want.find(i=>i.t==='warOn').until);M.v1.counterDays={u0,u1};await shot(B(),'v1-b-karsi');
   const n1=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n1,20000);
   const o2=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.v1.o2={id:o2.id,from:o2.from,want:o2.want};assert.equal(o2.from,E.B);assert.equal(o2.want.find(i=>i.t==='warOn').until,u1,'karşı teklifin son tarihi');
   await settle('v1-o2');const rid2=await rec(C(),o2.id);const min0=await H().evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.min],[E.B,E.C]);
   M.v1.accept=await accept(C(),rid2);await wait(H(),c=>(G.emps[c].warPledges||[]).length===1,E.C,20000);await settle('v1-kabul');
   const p=await pledges(E.C);M.v1.host=p;assert.equal(p.length,1);assert.deepEqual([p[0].to,p[0].target,p[0].until,p[0].state],[E.B,fx.X,u1,'open']);
   assert.equal(await H().evaluate(([c,x])=>!!G.emps[c].war[x],[E.C,fx.X]),false,'kabulde savaş yok');
   const min1=await H().evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.min],[E.B,E.C]);M.v1.min={min0,min1};assert(min1[0]<min0[0]&&min1[1]>min0[1],'karşılık ödendi');
   M.v1.bBox=await box(B(),await lid(B(),E.C));M.v1.cBox=await box(C(),bC);await shot(B(),'v1-b-soz');await shot(C(),'v1-c-soz');
   assert.match(M.v1.bBox,/Sana verilen söz/);assert.match(M.v1.cBox,/Senin sözün/);assert.match(M.v1.cBox,/Sözü yerine getir/);
   assert.equal((await H().evaluate(()=>warPledgeRows(G.p,null))).length,0,'host (üçüncü taraf) satırı yok');
   await closeUI(B());await closeUI(C());});

 await test('V2 kaydet → host kapanır → YENİ oda → misafirler döner → aynı söz; C söz panelinden NORMAL savaş ilanı → "Tutuldu" (B de görür)',async()=>{
   const before=await H().evaluate(([b,c])=>JSON.stringify(warPledgeRows(G.emps[b],G.emps[c])),[E.B,E.C]);
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   await ctx.H.close().catch(()=>{});const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code2=await h.evaluate(()=>MP1Host.code);setCode(code2);await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   for(const n of ['B','C']){await pg[n].goto(origin[n]+'/mp/play?code='+code2);await wait(pg[n],()=>window.MP1Join&&(MP1Join.ws||document.getElementById('jName')));if(await pg[n].evaluate(()=>!MP1Join.ws&&!!document.querySelector('[data-j="go"]')))await tap(pg[n],'[data-j="go"]');await wait(pg[n],e=>MP1Join.empireId===e,E[n],40000);}
   await tap(h,'[data-m="resumeGo"]');await sleep(800);if(await h.evaluate(()=>!!document.getElementById('mp1Sheet')))await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame',undefined,40000);
   for(const n of ['B','C']){await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);}await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await settle('v2-devam');
   const after=await H().evaluate(([b,c])=>JSON.stringify(warPledgeRows(G.emps[b],G.emps[c])),[E.B,E.C]);M.v2={before,after};assert.equal(after,before,'aynı söz, aynı kalan süre');
   const bC=await lid(C(),E.B),xC=await lid(C(),fx.X);const cBox=await box(C(),bC);M.v2.cBox=cBox;assert.match(cBox,/kalan/);
   await tap(C(),`.warPledgeBox [data-a="war"][data-x="${xC}"]`);await C().waitForSelector(`#modal [data-a="setwg"][data-x="${xC}:boyun"]`,{timeout:15000});
   await tap(C(),`#modal [data-a="setwg"][data-x="${xC}:boyun"]`);await C().waitForSelector('#modal [data-a="wgGo"]',{timeout:15000});
   if(await C().evaluate(()=>document.querySelector('#modal [data-a="wgGo"]').disabled)){await tap(C(),'#modal [data-a="wgVtype"]');}
   await tap(C(),'#modal [data-a="wgGo"]');await wait(C(),()=>document.getElementById('warFinalConfirm')&&!document.getElementById('warFinalConfirm').disabled,undefined,30000);await shot(C(),'v2-son-onay');
   assert.equal(await H().evaluate(([c,x])=>!!G.emps[c].war[x],[E.C,fx.X]),false,'son onaydan önce savaş yok');
   await tap(C(),'#warFinalConfirm');await wait(H(),([c,x])=>!!G.emps[c].war[x],[E.C,fx.X],30000);await settle('v2-ilan');
   const p=await pledges(E.C);M.v2.host=p;assert.equal(p[0].state,'kept');
   await closeUI(B());M.v2.bBox=await box(B(),await lid(B(),E.C));assert.match(M.v2.bBox,/Tutuldu/);await shot(B(),'v2-b-tutuldu');await closeUI(B());await closeUI(C());});

 await test('V3 ikinci söz (hedef Y) son tarihe kadar tutulmaz → "Çiğnendi": B sözünü çiğnedi hatırlar, ilişki −20; iki aynada durum',async()=>{
   const d0=await H().evaluate(()=>Math.floor(G.day));const r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'warOn',target:fx.Y,until:d0+40}],want:[]});assert.equal(r.status,'ok',JSON.stringify(r));
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);const a=await cmd('B',{kind:'respond',offer:oid,action:'accept'});assert.equal(a.status,'ok',JSON.stringify(a));
   const rel0=await H().evaluate(([b,c])=>G.emps[b].rel[c],[E.B,E.C]);await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));
   const dNow=await H().evaluate(()=>G.day);await advance(Math.ceil(d0+40-dNow)+35);
   const p=(await pledges(E.C)).find(x=>x.target===fx.Y);const h=await H().evaluate(([b,c])=>({rel:G.emps[b].rel[c],mem:((G.emps[b].mem||{})[c]||[]).map(m=>m.k)}),[E.B,E.C]);M.v3={p,h,rel0};
   assert.equal(p.state,'broken',JSON.stringify(p));assert(h.mem.includes('paktBozdu'));assert(h.rel<=rel0-19,'ilişki düştü: '+JSON.stringify({rel0,h}));await settle('v3');
   M.v3.bBox=await box(B(),await lid(B(),E.C));M.v3.cBox=await box(C(),await lid(C(),E.B));assert.match(M.v3.bBox,/Çiğnendi/);assert.match(M.v3.cBox,/Çiğnendi/);await shot(C(),'v3-c-cignendi');await closeUI(B());await closeUI(C());});

 await test('V4 geçersiz şart gerekçeli; hedef elenince "Düştü" (ceza yok); aynı kabul iki kez + hat donar / kopar → tek söz',async()=>{
   const bad=await cmd('C',{kind:'offer',to:E.B,give:[{t:'warOn',target:fx.Z}],want:[]});const det=await C().evaluate(cid=>(MP1Join.results.filter(y=>y.cid===cid).at(-1)||{}).detail||null,bad.cid);M.v4={bad,det};assert.equal(bad.status,'rejected');assert.equal(bad.code,'rules:quote');assert.match(JSON.stringify(det||''),/son tarihli/);
   const d0=await H().evaluate(()=>Math.floor(G.day));let r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'warOn',target:fx.Z,until:d0+200}],want:[{t:'res',r:'ala',v:5}]});assert.equal(r.status,'ok',JSON.stringify(r));
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('v4-o');const rid=await rec(B(),oid);
   const n0=(await pledges(E.C)).length;lanes.B.freeze();const a1=await accept(B(),rid),a2=await accept(B(),rid);M.v4.frozen={a1,a2};
   await lanes.B.down();await sleep(2500);await lanes.B.up();await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await ready(B(),E.B);await settle('v4-geri');
   let st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,oid);
   if(st==='pending'){const rid2=await rec(B(),oid);M.v4.retry=await accept(B(),rid2);await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',oid,20000);}
   const again=await cmd('B',{kind:'respond',offer:oid,action:'accept'});M.v4.again=again;assert.notEqual(again.status,'ok');
   const ps=await pledges(E.C);M.v4.after=ps;assert.equal(ps.length-n0,1,'tek söz');
   const rel0=await H().evaluate(([b,c])=>G.emps[b].rel[c],[E.B,E.C]);await H().evaluate(z=>{G.emps[z].dead=true;warPledgeTick();MP1Host.host.publish();},fx.Z);await settle('v4-elendi');
   const pz=(await pledges(E.C)).find(x=>x.target===fx.Z);M.v4.void=pz;assert.equal(pz.state,'void');assert.match(pz.why,/Hedef elendi/);
   assert.equal(await H().evaluate(([b,c])=>G.emps[b].rel[c],[E.B,E.C]),rel0,'ceza yok');M.v4.bBox=await box(B(),await lid(B(),E.C));assert.match(M.v4.bBox,/Düştü/);await closeUI(B());});

 await test('V5 Savaş Merkezi "Şartlı Teklif…" taslağı: düzenlenir, ayna yeniden kurulur ve masa yeniden açılır → taslak korunur',async()=>{
   const f=await H().evaluate(([c,x])=>warLedgerFind(c,x)?.id,[E.C,fx.X]);assert(f,'C–X cephesi');const bC=await lid(C(),E.B),xC=await lid(C(),fx.X);
   await closeUI(C());await C().evaluate(([f,c,x])=>{WarCenterUI.status={id:f,sides:[0,x],campaign:f,ended:null};WarCenterUI.support(f,0);},[f,0,xC]);
   await wait(C(),b=>!!document.querySelector(`.supCand[data-cand="${b}"] [data-a="warCenterCompose"]`),bC,30000);await tap(C(),`.supCand[data-cand="${bC}"] [data-a="warCenterCompose"]`);
   await wait(C(),f=>UI.deal&&UI.deal.want.some(i=>i.t==='warJoin'&&i.front===f),f,20000);
   await tap(C(),'[data-a="dealAdd"][data-x="give:res"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(C(),()=>document.getElementById('dealAmountInput'));await C().fill('#dealAmountInput','40');await tap(C(),'#modal [data-a="amountApply"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='res'));
   const d1=await C().evaluate(()=>JSON.stringify(UI.deal));
   await H().evaluate(()=>{MP1Host.host.publish();});await settle('v5-ayna');await sleep(1500);const d2=await C().evaluate(()=>JSON.stringify(UI.deal));
   await closeUI(C());await C().evaluate(b=>UI.openDeal(b),bC);await wait(C(),()=>document.querySelector('[data-a="dealSend"]'));const d3=await C().evaluate(()=>JSON.stringify(UI.deal));
   const items=await C().evaluate(()=>[...document.querySelectorAll('.dealItem span')].map(s=>s.innerText));M.v5={f,d1,d2,d3,items};await shot(C(),'v5-taslak');
   const pick=s=>{const d=JSON.parse(s);return JSON.stringify({to:d.to,give:d.give,want:d.want});};
   assert.equal(pick(d2),pick(d1),'ayna yeniden kurulunca taslak aynı');assert.equal(pick(d3),pick(d1),'masa yeniden açılınca taslak aynı');
   assert(items.some(x=>/Destek|Katıl|Cephe/i.test(x))&&items.length>=2,'iki madde masada: '+JSON.stringify(items));await closeUI(C());});

 await test('V6 host → misafir (masaüstü masası): söz → B reddeder → host yeniden gönderir ve geri çeker (iptal); misafir → host: B söz verir, host kabul eder → kayıt + iki panel',async()=>{
   await closeUI(H());const wName=await H().evaluate(w=>G.emps[w].name,fx.W);
   await H().evaluate(b=>{UI.forgetDeal(b);UI.openDeal(b);},E.B);await wait(H(),()=>document.querySelector('[data-a="dealSend"]'));
   await tap(H(),'[data-a="dealAdd"][data-x="give:warOn"]');await wait(H(),()=>document.querySelector('#modal [data-a="pickOne"]'));
   const idx=await H().evaluate(n=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].findIndex(b=>b.innerText.trim().startsWith(n)),wName);assert(idx>=0,'host hedef listesinde: '+wName);
   await tap(H(),`#modal [data-a="pickOne"][data-x="${idx}"]`);await wait(H(),()=>/Son tarih/.test(document.getElementById('modal')?.innerText||''));await tap(H(),'#modal [data-a="pickOne"][data-x="1"]');
   await wait(H(),()=>UI.deal.give.some(i=>i.t==='warOn'&&Number.isInteger(i.until)));const hs=await H().evaluate(()=>document.querySelector('.dealPledgeRow')?.innerText||'');M.v6={hostSum:hs.slice(0,300)};assert.match(hs,/İLAN EDİLMEZ/);await shot(H(),'v6-host-masa');
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(H(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o1=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.v6.o1={id:o1.id,from:o1.from,to:o1.to,give:o1.give};assert.equal(o1.from,0);assert.equal(o1.to,E.B);assert(o1.give.some(i=>i.t==='warOn'&&i.target===fx.W&&i.until),'host sözü son tarihli');
   await settle('v6-o1');const r1=await rec(B(),o1.id);M.v6.reject=await B().evaluate(id=>DiplomaticInbox.resolve(id,false,undefined,G.emps),r1);
   await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='rejected',o1.id,20000);assert.equal((await H().evaluate(()=>(G.p.warPledges||[]).length)),0,'ret: söz yok');
   const re=await H().evaluate(([b,w,u])=>MP1Host.host.local({kind:'offer',to:b,give:[{t:'warOn',target:w,until:u}],want:[]}),[E.B,fx.W,o1.give.find(i=>i.t==='warOn').until]);assert.equal(re.ok,true,JSON.stringify(re));
   const o2=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);const wd=await H().evaluate(id=>MP1Host.host.local({kind:'withdraw',offer:id}),o2);M.v6.withdraw=wd;assert.equal(wd.ok,true,JSON.stringify(wd));
   await settle('v6-geri');const late=await cmd('B',{kind:'respond',offer:o2,action:'accept'});M.v6.late=late;assert.notEqual(late.status,'ok','geri çekilen teklif kabul edilemez');assert.equal((await H().evaluate(()=>(G.p.warPledges||[]).length)),0);
   /* misafir → host */
   const hB=await lid(B(),0),yB=await lid(B(),fx.Y),yName=await B().evaluate(y=>G.emps[y].name,yB);await closeUI(B());
   await B().evaluate(h=>{UI.forgetDeal(h);UI.openDeal(h);},hB);await wait(B(),()=>document.querySelector('[data-a="dealSend"]'));
   await tap(B(),'[data-a="dealAdd"][data-x="give:warOn"]');await wait(B(),()=>document.querySelector('#modal [data-a="pickOne"]'));
   const j=await B().evaluate(n=>[...document.querySelectorAll('#modal [data-a="pickOne"]')].findIndex(b=>b.innerText.trim().startsWith(n)),yName);assert(j>=0,'B hedef listesinde: '+yName);
   await tap(B(),`#modal [data-a="pickOne"][data-x="${j}"]`);await wait(B(),()=>/Son tarih/.test(document.getElementById('modal')?.innerText||''));await tap(B(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(B(),()=>UI.deal.give.some(i=>i.t==='warOn'&&Number.isInteger(i.until)));const n1=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(B(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n1,20000);
   const o3=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1));M.v6.o3={id:o3.id,from:o3.from,to:o3.to,give:o3.give};assert.equal(o3.from,E.B);assert.equal(o3.to,0);
   const hr=await waitv(H(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.kind==='aideal'&&r.status==='pending'&&(r.key==='deal:mp71:'+id||r.note&&r.note.key==='mp71:'+id));return r?r.id:null;},o3.id,20000);
   M.v6.hostAccept=await H().evaluate(id=>DiplomaticInbox.resolve(id,true,undefined,G.emps),hr);await wait(H(),b=>(G.emps[b].warPledges||[]).length===1,E.B,20000);await settle('v6-kabul');
   const pb=await pledges(E.B);M.v6.pb=pb;assert.deepEqual([pb[0].to,pb[0].target,pb[0].state],[0,fx.Y,'open']);
   M.v6.hostBox=await box(H(),E.B);M.v6.bBox=await box(B(),hB);assert.match(M.v6.hostBox,/Sana verilen söz/);assert.match(M.v6.bBox,/Senin sözün/);await shot(H(),'v6-host-panel');await closeUI(H());await closeUI(B());});
};
