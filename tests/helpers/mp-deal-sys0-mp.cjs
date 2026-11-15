'use strict';
/* MP-DEAL-SYS.0 — gerçek STARS arayüzünde host + misafir B + misafir C (ayrı Chromium kalıcı profilleri; B/C yatay telefon, host ayrıca masaüstü).
   Y1 C (kaybeden) gerçek masada Barış + Sistem Devri + Haraç hazırlar (dokunuş); teklif özeti sonucu gösterir; B karşı teklif; C karttan kabul;
      host + B + C: sistemin yeni sahibi B, aynı ödeme takvimi (kalan ödeme, sonraki ödeme, bitiş)
   Y2 bir ödeme gerçekleşir → kaydet → host kapanır → YENİ odada devam → misafirler döner → sonraki ödeme doğru ayda BİR kez
   Y3 teklif beklerken sahiplik değişir → teklif geçersiz, iki tarafa neden; aynı kabul iki kez + host yanıtı sırasında hat donar/kopar → tek uygulama
   Y4 Federasyon: tek dokunuşla İttifak Daveti (misafir → misafir: bekliyor → kabul; misafir → AI: sonuç satırda; çift dokunuş tek teklif);
      host masaüstünde misafire davet; bekleyen federasyon oyu üstte → OY VER penceresi
   Y5 Savaş Merkezi: seçili cepheden destekçi kartı (uygunluk, ret nedeni, kaynak / toprak vaadi şartı) → Destek İste (doğru cephe) → kabul;
      AI adayı sonucu kartta; çift dokunuş tek teklif */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,origin,open,ctx,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,settle,cmd,advance}=X;
 const M=metrics.deal={};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const lid=(p,real)=>p.evaluate(r=>{const me=MP1Join.empireId;return r===me?0:r===0?me:r;},real);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const ensure=async n=>{if(await pg[n].evaluate(e=>!!(window.MP6Stars&&MP6Stars.S.started&&MP1Join.empireId===e),E[n]).catch(()=>false))return;
   await pg[n].goto(origin[n]+'/mp/play?code='+getCode());await wait(pg[n],()=>window.MP1Join&&(MP1Join.ws||document.getElementById('jName')));if(await pg[n].evaluate(()=>!MP1Join.ws&&!!document.querySelector('[data-j="go"]')))await tap(pg[n],'[data-j="go"]');await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);};
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}try{UI.closeDiplo?.();}catch{}document.getElementById('diploPane').classList.remove('show');}).catch(()=>{});
 const hostRec=(p,id,role)=>p.evaluate(([id,role])=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.kind==='aideal'&&r.status==='pending'&&(role==='guest'?r.mp===id:(r.key==='deal:mp71:'+id||r.note&&r.note.key==='mp71:'+id)));return r?r.id:null;},[id,role]);
 const accept=(p,rid)=>p.evaluate(id=>DiplomaticInbox.resolve(id,true,'haracguzar',G.emps),rid);
 const offers=(n0)=>H().evaluate(n0=>MP1Host.host.dip.offers.slice(n0).map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,why:o.why||'',give:o.give.map(i=>i.t+(i.id!==undefined?':'+i.id:'')+(i.r?':'+i.r+':'+i.v:'')),want:o.want.map(i=>i.t+(i.id!==undefined?':'+i.id:'')+(i.r?':'+i.r+':'+i.v:'')+(i.front?':f'+i.front:''))})),n0);
 const sched=(p,who)=>p.evaluate(w=>tributeRows(w===null?G.p:G.emps[w]).map(t=>({r:t.r,v:t.v,pays:t.pays,next:t.next,until:t.until})),who);
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 await H().evaluate(([b,c])=>{for(const e of G.emps)if(!e.wild&&!e.dead){for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.rel[o.id]=Math.max(e.rel[o.id]||0,40);}}
   for(const s of G.sys)for(const id of [0,b,c])if(!s.seen.includes(id))s.seen.push(id);
   for(const id of [b,c]){const e=G.emps[id];for(const r of ['min','ene','ala','yiy','tuk','etk'])e.res[r]=Math.max(e.res[r]||0,6000);const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,3);for(const l of nb)territoryOwnerSet(G.sys[l],id);e.tribute=[];}
   remember(G.emps[c],b,'savasIlan');MP1Host.host.publish();},[E.B,E.C]);
 await settle('y0');

 await test('Y1 Barış + Sistem Devri + Haraç: C gerçek masada (dokunuş) hazırlar, özet sonucu gösterir; B karşı teklif; C karttan kabul; host + B + C aynı yeni sahip ve aynı ödeme takvimi',async()=>{
   const w=await cmd('B',{kind:'war',target:E.C,goal:'boyun',vtype:'haracguzar',war:'none'});assert.equal(w.status,'ok',JSON.stringify(w));await settle('y1-war');
   const bC=await lid(C(),E.B);await closeUI(C());await C().evaluate(b=>{UI.forgetDeal(b);UI.openDeal(b);},bC);await wait(C(),()=>document.querySelector('[data-a="dealSend"]'));
   await tap(C(),'[data-a="dealPact"][data-x="peace"]');await wait(C(),()=>UI.deal.give.concat(UI.deal.want).some(i=>i.t==='peace'));
   await tap(C(),'[data-a="dealAdd"][data-x="give:sys"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));const sysName=await C().evaluate(()=>document.querySelector('#modal [data-a="pickOne"]').innerText);
   await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='sys'));
   await tap(C(),'[data-a="dealAdd"][data-x="give:tribute"]');await wait(C(),()=>document.querySelector('#modal [data-a="pickOne"]'));await tap(C(),'#modal [data-a="pickOne"][data-x="0"]');
   await wait(C(),()=>document.getElementById('dealAmountInput'));await C().fill('#dealAmountInput','20');await tap(C(),'#modal [data-a="amountApply"]');await wait(C(),()=>UI.deal.give.some(i=>i.t==='tribute'));
   const sum=await C().evaluate(()=>document.querySelector('.dealTerms')?.innerText||'');M.y1={sysName,sum:sum.slice(0,600)};await shot(C(),'y1-ozet');
   assert.match(sum,/Sistem Devri/);assert.match(sum,/yeni sahip/);assert.match(sum,/kabul anında/);assert.match(sum,/Haraç/);assert.match(sum,/toplam yük 2400/);
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(C(),'[data-a="dealSend"]');await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);
   const o1=(await offers(n0))[0];M.y1.o1=o1;assert.deepEqual(o1.give.concat(o1.want).map(x=>x.split(':')[0]).sort(),['peace','sys','tribute']);
   const sys=+o1.give.find(x=>x.startsWith('sys:')).split(':')[1];M.y1.sys=sys;
   /* B karşı teklif: haraç 30 */
   const ct=await cmd('B',{kind:'counter',offer:o1.id,give:[{t:'peace'}],want:[{t:'sys',id:sys},{t:'tribute',r:'min',v:30}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
   const cid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('y1-ct');
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},cid,20000);
   const res=await accept(C(),rid);M.y1.accept=res;await wait(H(),([s,b])=>G.sys[s].owner===b,[sys,E.B],20000);await settle('y1-kabul');
   const h=await H().evaluate(([s,b,c])=>({own:G.sys[s].owner,war:!!G.emps[b].war[c],trib:G.emps[c].tribute.map(t=>({to:t.to,r:t.r,v:t.v}))}),[sys,E.B,E.C]);M.y1.host=h;
   assert.equal(h.own,E.B);assert.equal(h.war,false);assert.deepEqual(h.trib,[{to:E.B,r:'min',v:30}]);
   const owners={B:await B().evaluate(s=>G.sys[s].owner,sys),C:await C().evaluate(s=>G.sys[s].owner,sys)};M.y1.owners=owners;assert.equal(owners.B,0,'B aynasında sistem B\'nin');assert.equal(owners.C,await lid(C(),E.B),'C aynasında sistem B\'nin');
   const sH=await sched(H(),E.B),sB=await sched(B(),null),sC=await sched(C(),null);M.y1.sched={sH,sB,sC};assert.equal(sH.length,1);assert.deepEqual(sB,sH,'B ile host aynı takvim');assert.deepEqual(sC,sH,'C ile host aynı takvim');
   await B().evaluate(c=>UI.selectDiplo(c,'relation'),await lid(B(),E.C));await wait(B(),()=>document.querySelector('.dealTribute'));M.y1.bBox=await B().evaluate(()=>document.querySelector('.dealTribute').innerText);await shot(B(),'y1-b-haraç');
   assert.match(M.y1.bBox,/AKTİF HARAÇ/);assert.match(M.y1.bBox,/Sen/);await closeUI(B());});

 await test('Y2 bir ödeme → kaydet → host kapanır → YENİ odada devam → misafirler döner → sonraki ödeme doğru ayda BİR kez',async()=>{
   const day0=await H().evaluate(()=>G.day),nextDay=(Math.floor(day0/30)+1)*30;await advance(Math.ceil(nextDay-day0)+1);
   const l1=await H().evaluate(c=>G.emps[c].tribute[0].last,E.C);M.y2={l1};assert(l1&&l1.p===30,'ilk ödeme: '+JSON.stringify(l1));
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);const sv=await H().evaluate(c=>({day:G.day,trib:JSON.stringify(G.emps[c].tribute)}),E.C);
   await ctx.H.close().catch(()=>{});const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code2=await h.evaluate(()=>MP1Host.code);setCode(code2);await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   for(const n of ['B','C']){await pg[n].goto(origin[n]+'/mp/play?code='+code2);await wait(pg[n],()=>window.MP1Join&&(MP1Join.ws||document.getElementById('jName')));if(await pg[n].evaluate(()=>!MP1Join.ws&&!!document.querySelector('[data-j="go"]')))await tap(pg[n],'[data-j="go"]');await wait(pg[n],e=>MP1Join.empireId===e,E[n],40000);}
   await tap(h,'[data-m="resumeGo"]');await sleep(800);if(await h.evaluate(()=>!!document.getElementById('mp1Sheet')))await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame',undefined,40000);
   for(const n of ['B','C']){await ready(pg[n],E[n]);await pg[n].evaluate(CANON+GUESTLIB);}await settle('y2-devam');
   const after=await H().evaluate(c=>({day:G.day,trib:JSON.stringify(G.emps[c].tribute)}),E.C);M.y2.resume={sv,after};assert.equal(after.trib,sv.trib,'takvim kayıttan aynen');assert.equal(Math.floor(after.day),Math.floor(sv.day));
   await H().evaluate(c=>{window.__tp=0;const f0=tributeTick;tributeTick=function(){const d0=G.emps[c].tribute[0]?.last?.d;const r=f0.apply(this,arguments);if(G.emps[c].tribute[0]?.last?.d!==d0)window.__tp++;return r;};},E.C);
   const d1=await H().evaluate(()=>G.day),n2=(Math.floor(d1/30)+1)*30;await advance(Math.ceil(n2-d1)+5);
   const r2=await H().evaluate(c=>({n:window.__tp,last:G.emps[c].tribute[0].last}),E.C);M.y2.second=r2;assert.equal(r2.n,1,'yeni odada sonraki ödeme bir kez');
   assert(r2.last.d>=n2&&r2.last.d<n2+6,'doğru ay başında: '+JSON.stringify({n2,last:r2.last}));await settle('y2');
   const sH=await sched(H(),E.B),sB=await sched(B(),null);assert.deepEqual(sB,sH,'yeni odada B ile host aynı takvim');});

 await test('Y3 teklif beklerken sahiplik değişir → geçersiz + iki tarafa neden; aynı kabul iki kez + yanıt sırasında hat donar/kopar → tek uygulama',async()=>{
   const pick=await H().evaluate(c=>G.sys.filter(s=>s.owner===c&&s.id!==G.emps[c].home).map(s=>s.id),E.C);assert(pick.length>=2,'C\'nin devredilebilir iki sistemi: '+JSON.stringify(pick));
   let r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'sys',id:pick[0]}],want:[{t:'res',r:'min',v:5}]});assert.equal(r.status,'ok');const o1=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);
   const ai=await H().evaluate(([b,c])=>G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&e.id!==b&&e.id!==c).id,[E.B,E.C]);
   await H().evaluate(([s,a])=>{territoryOwnerSet(G.sys[s],a);MP1Host.host.publish();},[pick[0],ai]);await settle('y3-sahip');
   const st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id),o1);M.y3={invalid:{status:st.status,why:st.why}};assert.equal(st.status,'invalid');assert.match(st.why,/Sistem Devri/);
   const bView=await B().evaluate(()=>MP6Stars.S.J.game.view.dip.offers.slice(-3).map(o=>[o.status,o.why]));M.y3.bView=bView;assert(bView.some(([s,w])=>s==='invalid'&&/Sistem Devri/.test(w)),'B aynı nedeni görür');
   /* çift kabul + kopma */
   r=await cmd('C',{kind:'offer',to:E.B,give:[{t:'sys',id:pick[1]},{t:'tribute',r:'ala',v:10}],want:[]});assert.equal(r.status,'ok');const o2=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('y3-o2');
   const rid=await waitv(B(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},o2,20000);
   const t0=await H().evaluate(c=>G.emps[c].tribute.length,E.C);lanes.B.freeze();const a1=await accept(B(),rid),a2=await accept(B(),rid);M.y3.frozen={a1,a2};
   await lanes.B.down();await sleep(2500);await lanes.B.up();await wait(B(),()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,40000);await ready(B(),E.B);await settle('y3-geri');
   let st2=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,o2);
   if(st2==='pending'){const rid2=await waitv(B(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},o2,20000);M.y3.retry=await accept(B(),rid2);await wait(H(),id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',o2,20000);}
   const again=await cmd('B',{kind:'respond',offer:o2,action:'accept'});M.y3.again=again;assert.notEqual(again.status,'ok','üçüncü kabul işlenmez');
   const fin=await H().evaluate(([s,b,c,id])=>({own:G.sys[s].owner,t:G.emps[c].tribute.length,status:MP1Host.host.dip.offers.find(o=>o.id===id).status}),[pick[1],E.B,E.C,o2]);M.y3.fin=fin;
   assert.equal(fin.status,'accepted');assert.equal(fin.own,E.B);assert.equal(fin.t-t0,1,'haraç bir kez');});

 await test('Y4 Federasyon: tek dokunuş İttifak Daveti (misafir → misafir bekliyor → kabul; misafir → AI sonuç satırda; çift dokunuş tek teklif); host masaüstünde misafire; bekleyen federasyon oyu üstte',async()=>{
   await closeUI(B());await B().evaluate(()=>UI.openFed());await wait(B(),()=>document.querySelector('.allyCand'));const cB=await lid(B(),E.C);
   M.y4={rows:await B().evaluate(()=>[...document.querySelectorAll('.allyCand')].map(r=>r.dataset.ally))};assert(M.y4.rows.includes(String(cB)),'C aday satırında: '+JSON.stringify(M.y4.rows));
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);
   await B().evaluate(c=>{const b=document.querySelector(`[data-a="allyInvite"][data-x="${c}"]`);b.click();b.click();},cB);await closeUI(B());
   await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);await sleep(1500);const os=await offers(n0);M.y4.offers=os;assert.equal(os.filter(o=>o.from===E.B&&o.to===E.C&&o.give.includes('ally')).length,1,'çift dokunuş tek teklif');
   await B().evaluate(()=>UI.openFed());await wait(B(),c=>/Bekliyor/.test(document.querySelector(`.allyCand[data-ally="${c}"] .allyInvState`)?.textContent||''),cB,20000);await shot(B(),'y4-bekliyor');
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},os.find(o=>o.give.includes('ally')).id,20000);await accept(C(),rid);
   await wait(H(),([b,c])=>!!G.emps[b].ally[c],[E.B,E.C],20000);await settle('y4-kabul');
   await B().evaluate(()=>UI.openFed());await wait(B(),c=>/Kabul edildi/.test(document.querySelector(`.allyCand[data-ally="${c}"] .allyInvState`)?.textContent||''),cB,20000);M.y4.bAccepted=true;await shot(B(),'y4-kabul');
   /* misafir → AI */
   const ai=await B().evaluate(()=>{const me=MP1Join.empireId,real=x=>x===0?me:x===me?0:x,cs=MP6Stars.S.J.game.view.dip.contacts;const r=[...document.querySelectorAll('.allyCand [data-a="allyInvite"]')].map(b=>+b.dataset.x).find(id=>cs.some(c=>c.id===real(id)&&!c.h));return r??null;});   /* AI: host'un kişi listesinde insan değil (ayna kabuğu insanlığı göstermez) */
   if(ai!==null){await tap(B(),`[data-a="allyInvite"][data-x="${ai}"]`);await wait(B(),a=>{UI.openFed();const t=document.querySelector(`.allyCand[data-ally="${a}"] .allyInvState`);return t&&!/Gönderiliyor/.test(t.textContent);},ai,20000);
     M.y4.ai=await B().evaluate(a=>document.querySelector(`.allyCand[data-ally="${a}"] .allyInvState`).textContent,ai);assert.match(M.y4.ai,/Kabul edildi|Reddedildi|Karşı teklif|Gönderilemedi/);}
   await closeUI(B());
   /* host masaüstü → misafir C değil (artık müttefik B); host → B daveti */
   await H().evaluate(()=>{G.p.res.etk=Math.max(G.p.res.etk||0,9000);});   /* FİKSTÜR: host'un imzalama Etkisi */
   await H().setViewportSize({width:1280,height:800});await closeUI(H());await H().evaluate(()=>UI.openFed());await wait(H(),()=>document.querySelector('.fedBox'),undefined,20000);
   const hc=await H().evaluate(hs=>{const ids=[...document.querySelectorAll('[data-a="allyInvite"]')].map(b=>+b.dataset.x);return {ids,human:ids.find(id=>hs.includes(id))??null,why:hs.map(id=>[id,!!G.p.ally[id],!!G.p.war[id],typeof canAlly==='function'?canAlly(G.p,G.emps[id]):null,!!findFed(G.p)])};},[E.B,E.C]);M.y4.hostCands=hc;
   assert(hc.human!==null,'host masaüstünde insan aday satırı: '+JSON.stringify(hc));const HB=hc.human;
   const h0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await tap(H(),`[data-a="allyInvite"][data-x="${HB}"]`);await wait(H(),n=>MP1Host.host.dip.offers.length>n,h0,20000).catch(async e=>{await H().evaluate(()=>UI.openFed());M.y4.hostFail=await H().evaluate(b=>document.querySelector(`.allyCand[data-ally="${b}"] .allyInvState`)?.textContent||'',HB);throw e;});
   await H().evaluate(()=>UI.openFed());M.y4.host=await H().evaluate(b=>document.querySelector(`.allyCand[data-ally="${b}"] .allyInvState`)?.textContent||'',HB);assert.match(M.y4.host,/Bekliyor/);await shot(H(),'y4-host-masaustu');await closeUI(H());
   await H().setViewportSize({width:844,height:390});
   /* bekleyen federasyon oyu üstte */
   const fx=await H().evaluate(([b,c])=>{const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test Birliği',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal',defense:'auto'},politicsVersion:96,leader:c,founder:c,members:[c,b],laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
     G.feds.push(f);federationIdentity(f);G.emps[c].res.etk=9000;const r=proposeFedLaw(G.emps[c],'arastirma');MP1Host.host.publish();return {fid:f.id,r:!!(r&&r.ok!==false),vote:!!f.vote};},[E.B,E.C]);M.y4.fed=fx;assert(fx.vote,'oylama açıldı: '+JSON.stringify(fx));await settle('y4-oy');
   await B().evaluate(()=>UI.openFed());await wait(B(),()=>document.querySelector('.fedPending [data-a="fedVoteNow"]'),undefined,20000);M.y4.pending=await B().evaluate(()=>document.querySelector('.fedPending').innerText);await shot(B(),'y4-bekleyen-is');
   await tap(B(),'.fedPending [data-a="fedVoteNow"]');await wait(B(),()=>!document.getElementById('modal').classList.contains('hidden'),undefined,15000);M.y4.voteWin=(await B().evaluate(()=>document.getElementById('modal').innerText)).slice(0,200);await closeUI(B());});

 await test('Y5 Savaş Merkezi: seçili cepheden destekçi kartı (uygunluk / ret nedeni / kaynak + toprak vaadi şartı) → Destek İste doğru cepheye → kabul; AI adayı sonucu kartta; çift dokunuş tek teklif',async()=>{
   const T=await H().evaluate(([b,c])=>G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&!G.emps[b].war[e.id]&&!G.emps[c].war[e.id]).id,[E.B,E.C]);
   await H().evaluate(([b,t])=>remember(G.emps[t],b,'savasIlan'),[E.B,T]);const w=await cmd('B',{kind:'war',target:T,goal:'boyun',vtype:'haracguzar',war:'none'});assert.equal(w.status,'ok',JSON.stringify(w));
   const F=await H().evaluate(([b,t])=>warLedgerFind(b,t).id,[E.B,T]);M.y5={T,F};await settle('y5-war');
   await closeUI(B());await B().evaluate(f=>WarCenterUI.open(f),F);await wait(B(),f=>document.querySelector(`[data-a="warCenterSupport"][data-x="${f}:0"]`),F,30000);
   await tap(B(),`[data-a="warCenterSupport"][data-x="${F}:0"]`);await wait(B(),()=>document.querySelectorAll('.supCand').length>0&&![...document.querySelectorAll('.supGate')].some(g=>g.dataset.ok==='w'),undefined,20000).catch(async e=>{await shot(B(),'y5-tani');M.y5.diag=await B().evaluate(()=>({modal:(document.getElementById('modal').innerText||'').slice(0,400),hidden:document.getElementById('modal').classList.contains('hidden'),ctx:WarCenterUI._supCtx,status:WarCenterUI.status&&{id:WarCenterUI.status.id,sides:WarCenterUI.status.sides},cands:G.emps.filter(e=>!e.dead&&!e.wild&&G.p.contact[e.id]).map(e=>[e.id,!!(WarCenterUI._supCtx&&e.war[WarCenterUI._supCtx.enemy]),e.contact&&e.contact[WarCenterUI._supCtx&&WarCenterUI._supCtx.enemy]]),gates:[...document.querySelectorAll('.supCand')].map(c=>[c.dataset.cand,c.querySelector('.supGate').dataset.ok,c.querySelector('.supGate').innerText]),sent:MP6Stars.S.stats.sent,res:MP1Join.results.slice(-6).map(r=>[r.status,r.code])}));throw e;});
   const cB=await lid(B(),E.C),tB=await lid(B(),T);
   M.y5.cards=await B().evaluate(()=>[...document.querySelectorAll('.supCand')].map(c=>({id:c.dataset.cand,gate:c.querySelector('.supGate').innerText,ok:c.querySelector('.supGate').dataset.ok})));M.y5.head=await B().evaluate(()=>document.querySelector('#warSupportRoot .mini').innerText);await shot(B(),'y5-kartlar');
   assert.match(M.y5.head,/toprak vaadine/);const cc=M.y5.cards.find(c=>c.id===String(cB));assert(cc&&cc.ok==='1',JSON.stringify(M.y5.cards));
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);await B().evaluate(x=>{const b=document.querySelector(`[data-a="warCenterAsk"][data-x="${x}"]`);b.click();b.click();},`${F}:${tB}:${cB}`);
   await wait(H(),n=>MP1Host.host.dip.offers.length>n,n0,20000);await sleep(1500);const os=await offers(n0);M.y5.offers=os;assert.equal(os.filter(o=>o.to===E.C).length,1,'tek teklif');assert(os[0].want.some(x=>x==='warJoin:f'+F),'doğru cephe: '+JSON.stringify(os[0]));
   await wait(B(),c=>/Bekliyor/.test(document.querySelector(`.supCand[data-cand="${c}"] .supState`)?.textContent||''),cB,15000);
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},os[0].id,20000);await accept(C(),rid);
   await wait(H(),([c,t])=>!!G.emps[c].war[t],[E.C,T],20000);await settle('y5-kabul');
   await B().evaluate(([f,s])=>WarCenterUI.support(f,s),[F,0]);M.y5.accepted=await B().evaluate(c=>document.querySelector(`.supCand[data-cand="${c}"] .supState`)?.textContent||'',cB);assert.match(M.y5.accepted,/Kabul edildi/);await shot(B(),'y5-kabul');
   const aiId=await B().evaluate(()=>{const me=MP1Join.empireId,real=x=>x===0?me:x===me?0:x,cs=MP6Stars.S.J.game.view.dip.contacts;return [...document.querySelectorAll('.supCand')].map(c=>+c.dataset.cand).find(id=>cs.some(c=>c.id===real(id)&&!c.h)&&document.querySelector(`.supCand[data-cand="${id}"] [data-a="warCenterAsk"]`)&&!document.querySelector(`.supCand[data-cand="${id}"] [data-a="warCenterAsk"]`).disabled);});
   if(aiId!==undefined&&aiId!==null){await tap(B(),`[data-a="warCenterAsk"][data-x="${F}:${tB}:${aiId}"]`);await wait(B(),a=>{const t=document.querySelector(`.supCand[data-cand="${a}"] .supState`);return t&&!/Gönderiliyor/.test(t.textContent);},aiId,20000);
     M.y5.ai=await B().evaluate(a=>document.querySelector(`.supCand[data-cand="${a}"] .supState`).textContent,aiId);assert.match(M.y5.ai,/Kabul edildi|Reddedildi|Karşı teklif|Gönderilemedi/);}
   await closeUI(B());});
};
