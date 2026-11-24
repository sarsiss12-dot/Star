'use strict';
/* SAVAŞ-DESTEK-AI.0 — gerçek STARS arayüzünde host + misafir B + misafir C (ayrı Chromium kalıcı profilleri, yatay telefon).
   D1 B'nin savaşı (B → AI T): B Savaş Merkezi → ASKERÎ DESTEK İSTE → adaylar uygun önde, müttefik C ilk sırada + gerekçe etiketi;
      UYGUN n ADAYA DESTEK İSTE (dokunuş, çift basış) → host'ta her uygun adaya TEK teklif; C karttan kabul → C aynı sefere katılır;
      ikinci toplu basış yeni teklif üretmez
   D2 AI S (A1'in saldırısında zorlanan) müttefiki misafir C'den yardım ister (aiWarHelpAsk, host): C'nin gelen kutusunda kart, C adına
      karar yok; B (taraf değil) kaydı görmez; C reddeder → savaş / ödeme yok */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,wait,tap,settle,cmd,CANON,GUESTLIB}=X;
 const M=metrics.sda={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}try{UI.closeDiplo?.();}catch{}document.getElementById('diploPane').classList.remove('show');}).catch(()=>{});
 const offers=n0=>H().evaluate(n0=>MP1Host.host.dip.offers.slice(n0).map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,want:o.want.map(i=>i.t+(i.front?':f'+i.front:'')),give:o.give.map(i=>i.t)})),n0);
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 /* FİKSTÜR: temas + görünürlük + kaynak; B ile C müttefik; T (AI) B'ye karşı hedef; C'nin ve bir AI adayın silahlı filosu T başkentine komşu (erişim) */
 const fx=await H().evaluate(([b,c])=>{for(const e of G.emps)if(!e.wild&&!e.dead)for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.rel[o.id]=Math.max(e.rel[o.id]||0,20);(e.intel||={})[o.id]=3;}
   for(const s of G.sys)for(const e of G.emps)if(!s.seen.includes(e.id))s.seen.push(e.id);
   for(const e of G.emps)for(const r of ['min','ene','ala','etk'])e.res[r]=Math.max(e.res[r]||0,4000);
   const B=G.emps[b],Cg=G.emps[c];B.ally[c]=Cg.ally[b]=true;B.rel[c]=Cg.rel[b]=85;
   const ais=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead&&!e.crisisSide&&!isPurifier(e)&&!(typeof hasCivic==='function'&&hasCivic(e,'shadow')));const T=ais[0],A1=ais[1],S=ais[2]||ais[1];
   for(const o of [Cg,A1,S])for(let i=0;i<3;i++)newFleet(o,o.home,[{c:'kru'},{c:'kru'}],'güç');
   const ts=G.sys[T.home],adj=ts.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||ts;for(const f of G.fleets.filter(f=>[c,A1.id].includes(f.e)&&isArmed(f))){f.sys=adj.id;f.mv=null;}
   remember(T,b,'savasIlan');MP1Host.host.publish();return {T:T.id,A1:A1.id,S:S.id};},[E.B,E.C]);
 Object.assign(E,fx);M.fx=fx;await settle('d0');

 await test('D1 misafir B: Savaş Merkezi → destek adayları sıralı + gerekçeli → toplu destek (çift basış) → her uygun adaya tek teklif; C kabul → aynı sefer; ikinci toplu basış teklif üretmez',async()=>{
   const w=await cmd('B',{kind:'war',target:E.T,goal:'boyun',vtype:'haracguzar',war:'none'});assert.equal(w.status,'ok',JSON.stringify(w));
   const F=await H().evaluate(([b,t])=>warLedgerFind(b,t).id,[E.B,E.T]);M.d1={F};await settle('d1-war');
   await closeUI(B());await B().evaluate(f=>WarCenterUI.open(f),F);await wait(B(),f=>document.querySelector(`[data-a="warCenterSupport"][data-x="${f}:0"]`),F,30000);
   await tap(B(),`[data-a="warCenterSupport"][data-x="${F}:0"]`);await wait(B(),()=>document.querySelectorAll('.supCand').length>0&&![...document.querySelectorAll('.supGate')].some(g=>g.dataset.ok==='w'),undefined,20000);
   const cB=await lid(B(),E.C);M.d1.cards=await B().evaluate(()=>[...document.querySelectorAll('.supCand')].map(c=>({id:+c.dataset.cand,tier:+c.dataset.tier,ok:c.querySelector('.supGate').dataset.ok,txt:c.querySelector('.bt').innerText})));
   M.d1.frame=await B().evaluate(()=>!!document.querySelector('#modal>.mbox #warSupportRoot'));await shot(B(),'d1-adaylar');
   const ok=M.d1.cards.filter(c=>c.ok==='1');assert.ok(ok.length>=1,JSON.stringify(M.d1.cards));const bad=M.d1.cards.findIndex(c=>c.ok!=='1');assert.ok(bad<0||M.d1.cards.slice(bad).every(c=>c.ok!=='1'),'uygunlar önde');
   assert.equal(ok[0].id,cB,'müttefik C ilk sırada');assert.match(ok[0].txt,/müttefik/);assert.equal(M.d1.frame,true,'pencere çerçevesi');
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);
   if(ok.length>1){await B().evaluate(()=>{const b=document.getElementById('warSupportAll');b.click();b.click();});}else await tap(B(),`[data-a="warCenterAsk"][data-x="${F}:${await lid(B(),E.T)}:${cB}"]`);
   await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);await wait(B(),()=>![...document.querySelectorAll('.supState')].some(s=>s.dataset.state==='sending'),undefined,20000);await sleep(1500);
   const all=await offers(n0);M.d1.allOffers=all;const os=all.filter(o=>o.from===E.B);M.d1.offers=os;
   M.d1.states=await B().evaluate(()=>[...document.querySelectorAll('.supCand')].map(c=>({id:+c.dataset.cand,state:c.querySelector('.supState')?.dataset.state||'',text:(c.querySelector('.supState')?.textContent||'').slice(0,120)})));
   const okIds=ok.map(c=>c.id);assert.ok(M.d1.states.filter(s=>okIds.includes(s.id)).every(s=>s.state),'her uygun adaya bir istek (durum satırı) '+JSON.stringify(M.d1.states));
   const per={};for(const o of os)per[o.to]=(per[o.to]||0)+1;assert.ok(Object.values(per).every(n=>n===1),'aday başına tek teklif '+JSON.stringify(per));assert.equal(per[E.C],1,'C teklifi');
   assert.ok(os.every(o=>o.want.includes('warJoin:f'+F)),'doğru cephe');
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},os.find(o=>o.to===E.C).id,20000);
   await C().evaluate(id=>DiplomaticInbox.resolve(id,true,'haracguzar',G.emps),rid);await wait(H(),([c,t])=>!!G.emps[c].war[t],[E.C,E.T],20000);
   const camp=await H().evaluate(([b,c,t])=>warLedgerFind(c,t).campaign===warLedgerFind(b,t).campaign,[E.B,E.C,E.T]);assert.equal(camp,true,'aynı sefer');await settle('d1-kabul');
   await B().evaluate(([f,s])=>WarCenterUI.support(f,s),[F,0]);M.d1.accepted=await B().evaluate(c=>document.querySelector(`.supCand[data-cand="${c}"] .supState`)?.textContent||'',cB);assert.match(M.d1.accepted,/Kabul edildi/);
   const n1=await H().evaluate(()=>MP1Host.host.dip.offers.length),again=await B().evaluate(([f,t])=>WarCenterUI.askAll(f,t),[F,await lid(B(),E.T)]);await sleep(1500);
   assert.equal(again,0,'ikinci toplu basış');assert.equal(await H().evaluate(()=>MP1Host.host.dip.offers.length),n1,'yeni teklif yok');await shot(B(),'d1-kabul');await closeUI(B());});

 await test('D2 AI S zorlanınca müttefiki misafir C\'den yardım ister: C kutusunda kart (C adına karar yok), B görmez; C reddeder → savaş / ödeme yok',async()=>{
   /* düşman U = A1 (C, D1'de T ile savaşa girdiği için T'ye karşı aday olamaz) */
   const r=await H().evaluate(([c,t,s])=>{const S=G.emps[s],T=G.emps[t],Cg=G.emps[c];S.ally[c]=Cg.ally[s]=true;S.rel[c]=Cg.rel[s]=90;for(let i=0;i<6;i++)newFleet(T,T.home,[{c:'zir'},{c:'zir'},{c:'zir'},{c:'zir'}],'güç');
     if(!T.war[s]){warAuthorize(T,S,{n:'t'});declareWar(T,S);warAuthClear();}for(const o of G.emps)if(o!==S&&o.id!==c)S.rel[o.id]=Math.min(S.rel[o.id]||0,10);
     if(S.aiTalk&&S.aiTalk.warHelp)delete S.aiTalk.warHelp;const n0=MP1Host.host.dip.offers.length,res0=JSON.stringify(Cg.res),ok=aiWarHelpAsk(S);MP1Host.host.publish();
     return {ok,n0,res0,why:ok?null:{strained:true,cw:!!Cg.war[t],gate:warSupportGate(Cg,S,{t:'warJoin',front:(warLedgerFind(S.id,t)||{}).id,target:t})},offer:MP1Host.host.dip.offers.slice(n0).map(o=>({id:o.id,from:o.from,to:o.to}))};},[E.C,E.A1,E.S]);
   M.d2=r;assert.equal(r.ok,true,'istek '+JSON.stringify(r));const o=r.offer.find(x=>x.to===E.C&&x.from===E.S);assert.ok(o,'C\'ye teklif '+JSON.stringify(r.offer));await settle('d2-istek');
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const x=DiplomaticInbox.state().records.find(x=>x.mp===id&&x.status==='pending');return x?x.id:null;},o.id,20000);
   const bSees=await B().evaluate(id=>{try{MP71Dip.tick();}catch{}return DiplomaticInbox.state().records.some(x=>x.mp===id);},o.id);assert.equal(bSees,false,'taraf olmayan B görmez');
   assert.equal(await H().evaluate(([c,u])=>!!G.emps[c].war[u],[E.C,E.A1]),false,'C adına katılım yok');
   await shot(C(),'d2-kart');await C().evaluate(id=>DiplomaticInbox.resolve(id,false,null,G.emps),rid);
   await wait(H(),id=>MP1Host.host.dip.offers.find(x=>x.id===id).status!=='pending',o.id,20000);const st=await H().evaluate(id=>MP1Host.host.dip.offers.find(x=>x.id===id).status,o.id);M.d2.status=st;
   assert.equal(st,'rejected');assert.equal(await H().evaluate(([c,u])=>!!G.emps[c].war[u],[E.C,E.A1]),false,'ret → savaş yok');await settle('d2-ret');});
};
