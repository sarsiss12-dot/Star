'use strict';
/* TİCARET-SON-EKSİKLER.0 — TZ senaryosu (MP8_SCEN=TZ): host + B + C ayrı Chromium (gerçek STARS misafir arayüzü), üretim relay süreci + TLS vekili; fiziksel cihaz / Render DEĞİL.
   Fikstür: yalıtılmış zincir [host + AI X  s0] — s1 — s2 — [C s3] — s4 — s5 — [B s6] — s7 — s8 — [AI Y s9] (≤3 sıçrama: ara limanlar şart).
   Z1 AI X ↔ Y koridoru iki ayrı misafir limanından geçer: talep, iki misafirde aynadan kart; B kartla Liman izinleri → ONAYLA → host'ta B 'yes', izin / ödeme yok, B'de bekleme
   Z2 B'nin hattı kopar ve döner: bekleyen talep ve B'nin onayı korunur; aynı onayın tekrarı host'ta reddedilir, ödeme yok
   Z3 C kartla ONAYLA → host tek işlem: dört izin, sahiplere +72, X–Y sözleşmesi; iki misafir aynası Uygulandı, kart kalkar, şart miktarları misafire gitmez
   Z4 host ↔ B koridoru (C limanı): host talep eder, C kartla REDDET → reddedildi, kısmi izin / ödeme yok, B'nin kartı kalkar
   Z5 izin yenileme: C'nin B'ye izni 40 gün → B Liman izinleri → YENİLEME İSTE → masa (izin + 36 ◈) → C gelen kutusundan KABUL → bitişten +360; host, B ve C aynı bitişi görür
   Z6 kayıt → kapanış → relay yeniden → yeni oda → misafirler döner: transit kayıtları ve X–Y konvoyu birebir; kargo bir kez teslim */
const assert=require('assert/strict');
module.exports=async X=>{const {test,pg,metrics,sleep,shot,wait,tap,settle,cmd,origin,open,ctx,startRelay,stopRelay,getCode,setCode,CANON,HOSTLIB,GUESTLIB,TIMERS,lanes}=X;
 const M=metrics.tz=metrics.tz||{};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;
 const EB=await B().evaluate(()=>MP1Join.empireId),EC=await C().evaluate(()=>MP1Join.empireId);
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const closeAll=p=>p.evaluate(()=>{try{UI.closeModal();}catch{}try{if(document.getElementById('diploPane')?.classList.contains('show'))UI.act('closeDiplo');}catch{}});
 const hit=async(p,s)=>{const l=p.locator(s).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:8000});};
 const days=n=>H().evaluate(n=>{for(let i=0;i<n;i++){G.day+=1;dailyTick(1);}MP1Host.host.publish();},n);
 const HT=()=>H().evaluate(()=>(G.commerce.transit||[]).map(t=>({id:t.id,st:t.st,votes:t.votes})));
 const etk=()=>H().evaluate(f=>Object.fromEntries([0,f.b,f.c,f.x,f.y].map(id=>[id,Math.round(G.emps[id].res.etk)])),M.fx);
 const permits=()=>H().evaluate(f=>Object.fromEntries([0,f.b,f.c].map(id=>[id,Object.keys(G.emps[id].portTransit||{}).filter(k=>G.emps[id].portTransit[k]>G.day).map(Number).sort((a,b)=>a-b)])),M.fx);
 const guestTx=(p,id)=>p.evaluate(id=>{const t=(G.commerce?.transit||[]).find(t=>t.id===id);return t?{st:t.st,votes:t.votes,terms:t.terms===undefined?null:'VAR',trade:t.trade||0}:null;},id);
 const card=(p,id)=>p.evaluate(id=>(G.inbox||[]).find(n=>n.key==='mptransit:'+id)?.uid||0,id);
 const openCard=async(p,id)=>{await closeAll(p);await wait(p,id=>(G.inbox||[]).some(n=>n.key==='mptransit:'+id),id,20000);await p.evaluate(()=>UI.drawInbox());const uid=await card(p,id);await hit(p,'#inbox [data-a="openNote"][data-x="'+uid+'"]');
   await wait(p,id=>!!document.querySelector('#modal .transitReq[data-tx="'+id+'"]'),id,10000);};

 await test('Z0 fikstür: yalıtılmış 10 sistemlik zincir; host + X s0, C s3, B s6, Y s9; izinsiz X → Y ve host → B rotası yok',async()=>{
   M.fx=await H().evaluate(([b,c])=>{MP1Host.host.local({kind:'speed',value:0});const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&![0,b,c].includes(o.id)),Xe=ais[0],Ye=ais[1];
     const E=[G.p,G.emps[b],G.emps[c],Xe,Ye];for(const x of E)for(const y of E)if(x!==y){x.contact[y.id]=true;x.war[y.id]=false;x.rel[y.id]=80;(x.intel||={})[y.id]=3;(x.mem||={})[y.id]=[{v:80,d:G.day,k:'t'}];if(x.embargo)delete x.embargo[y.id];if(x.portTransit)delete x.portTransit[y.id];if(x.nap)delete x.nap[y.id];}
     for(const x of E)for(const k of ['min','ene','ala','etk'])x.res[k]=3000;
     const used=new Set(E.map(e=>e.home));const pool=G.sys.filter(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col)&&!used.has(s.id)&&!G.fleets.some(f=>f.sys===s.id));
     const start=pool.find(s=>s.planets.length>=2);if(!start)throw Error('iki gezegenli sistem yok');pool.splice(pool.indexOf(start),1);
     const chain=[start];let cur=start;for(let i=0;i<9;i++){pool.sort((x,y)=>dist(cur,x)-dist(cur,y)||x.id-y.id);cur=pool.shift();chain.push(cur);}
     const ids=new Set(chain.map(s=>s.id));for(const s of G.sys)if(!ids.has(s.id)&&s.lanes.some(x=>ids.has(x)))s.lanes=s.lanes.filter(x=>!ids.has(x));
     chain.forEach((s,i)=>{s.lanes=[];s.cr=0;if(i)s.lanes.push(chain[i-1].id);if(i<9)s.lanes.push(chain[i+1].id);});
     const tpl=G.sys[G.p.home].planets.find(p=>p.col&&p.owner===0).col;
     const mk=(s,e,k=0)=>{const pl=s.planets[k];pl.owner=e.id;pl.col=JSON.parse(JSON.stringify(tpl));pl.col.e=e.id;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];e.colonies.push({s:s.id,p:k});s.owner=e.id;};
     mk(chain[0],G.p,0);mk(chain[0],Xe,1);mk(chain[3],G.emps[c]);mk(chain[6],G.emps[b]);mk(chain[9],Ye);
     (Xe.pact||={})[Ye.id]=(Ye.pact||={})[Xe.id]=true;Xe.res.min=20;Xe.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};Xe.res.ene=600;Ye.res.min=600;Ye.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};Ye.res.ene=20;
     for(const s of chain){s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();}
     updateVision();Commerce.state();MP1Host.host.publish();const f={b,c,x:Xe.id,y:Ye.id,chain:chain.map(s=>s.id)};window.TZ=f;
     return {...f,xy:!!Commerce.route(Xe,Ye,chain[0].id,chain[9].id),hb:!!Commerce.route(G.p,G.emps[b],chain[0].id,chain[6].id)};},[EB,EC]);
   await settle('z0');assert.equal(M.fx.xy,false);assert.equal(M.fx.hb,false);});

 await test('Z1 AI koridoru iki misafir limanından: iki misafirde kart; B ONAYLA (dokunuş) → host\'ta B onayladı, izin / ödeme yok, B\'de bekleme',async()=>{
   M.e0=await etk();const ok=await H().evaluate(()=>{const X=G.emps[TZ.x],Y=G.emps[TZ.y],bud={routes:96};const r=Commerce.aiTransitRequest(X,Y,Commerce.aiBalance(X),Commerce.aiBalance(Y),bud);MP1Host.host.publish();return !!r;});
   assert.equal(ok,true,'AI talep açtı');assert.deepEqual((await HT())[0].votes,{[EB]:'pending',[EC]:'pending'});await settle('z1a');
   await openCard(B(),1);await openCard(C(),1).then(()=>closeAll(C()));await shot(B(),'tz-z1-b-kart');
   await hit(B(),'#modal [data-a="transitVote"][data-x="1:1"]');await H().waitForFunction(b=>G.commerce.transit[0].votes[b]==='yes',EB,{timeout:20000});await settle('z1b');
   await B().evaluate(()=>UI.act('commerceTransit','1'));await sleep(300);const wt=await B().evaluate(()=>!!document.querySelector('#modal .transitReq[data-tx="1"] .transitWait'));
   M.z1={host:await HT(),guestB:await guestTx(B(),1),guestC:await guestTx(C(),1),etk:await etk(),pt:await permits(),wait:wt};await shot(B(),'tz-z1-b-bekliyor');
   assert.equal(M.z1.host[0].st,'pending');assert.deepEqual(M.z1.etk,M.e0,'ödeme yok');assert.equal(Object.values(M.z1.pt).flat().length,0,'izin yok');assert.equal(M.z1.wait,true,'B bekleme metni');
   assert.equal(M.z1.guestB.votes['0'],'yes');assert.equal(M.z1.guestC.votes['0'],'pending');assert.equal(M.z1.guestB.terms,null,'şart miktarları misafire gitmez');assert.equal(M.z1.guestB.trade,1);});

 await test('Z2 B hattı kopar → döner: bekleyen talep ve B\'nin onayı korunur; aynı onayın tekrarı reddedilir, ödeme yok',async()=>{
   await closeAll(B());await lanes.B.down();await sleep(1500);await lanes.B.up();await ready(B(),EB,60000);await settle('z2');
   const g=await guestTx(B(),1);const again=await cmd('B',{kind:'transitVote',id:1,yes:true});M.z2={g,again,host:await HT(),etk:await etk()};
   assert.equal(g.st,'pending');assert.equal(g.votes['0'],'yes','onay korundu');assert.notEqual(again.status,'ok','ikinci onay reddedildi '+JSON.stringify(again));assert.deepEqual(M.z2.etk,M.e0);});

 await test('Z3 C ONAYLA (dokunuş) → tek işlem: dört izin, sahiplere +72, X–Y sözleşmesi; iki misafir aynası Uygulandı, kart kalkar',async()=>{
   await openCard(C(),1);await hit(C(),'#modal [data-a="transitVote"][data-x="1:1"]');await H().waitForFunction(()=>G.commerce.transit[0].st==='committed',undefined,{timeout:20000});await settle('z3');
   const e=await etk(),pt=await permits(),f=M.fx,k=await H().evaluate(f=>G.commerce.contracts.filter(c=>!Commerce.closed(c)&&[c.a,c.b].includes(f.x)&&[c.a,c.b].includes(f.y)).length,f);
   M.z3={e,pt,k,gB:await guestTx(B(),1),gC:await guestTx(C(),1),cardB:await card(B(),1),cardC:await card(C(),1)};await shot(C(),'tz-z3-c-uygulandi');
   assert.deepEqual(pt[f.b],[f.x,f.y].sort((a,b)=>a-b));assert.deepEqual(pt[f.c],[f.x,f.y].sort((a,b)=>a-b));assert.equal(e[f.b]-M.e0[f.b],72);assert.equal(e[f.c]-M.e0[f.c],72);assert.equal(e[f.x]-M.e0[f.x],-72);
   assert.equal(k,1,'X–Y sözleşmesi');assert.equal(M.z3.gB.st,'committed');assert.equal(M.z3.gC.st,'committed');assert.equal(M.z3.cardB,0,'B kartı kalktı');assert.equal(M.z3.cardC,0);});

 await test('Z4 host ↔ B koridoru C limanından: host talep eder, C REDDET (dokunuş) → reddedildi; kısmi izin / ödeme yok, B kartı kalkar',async()=>{
   const e0=await etk(),p0=await permits();const r=await H().evaluate(()=>{const r=Commerce.transitAsk(G.p,G.emps[TZ.b],TZ.chain[0],TZ.chain[6]);MP1Host.host.publish();return r;});
   assert.equal(r.st,'pending',JSON.stringify(r));await settle('z4a');await openCard(C(),r.id);await hit(C(),'#modal [data-a="transitVote"][data-x="'+r.id+':0"]');
   await H().waitForFunction(id=>G.commerce.transit.find(t=>t.id===id).st==='rejected',r.id,{timeout:20000});await settle('z4b');
   M.z4={id:r.id,e:await etk(),pt:await permits(),gB:await guestTx(B(),r.id),cardB:await card(B(),r.id)};
   assert.deepEqual(M.z4.e,e0);assert.deepEqual(M.z4.pt,p0);assert.equal(M.z4.gB.st,'rejected');assert.equal(M.z4.cardB,0);});

 await test('Z5 izin yenileme MP: C → B izni 40 gün; B YENİLEME İSTE → masa (izin + 36 ◈) → C KABUL → bitişten +360; host / B / C aynı bitiş',async()=>{
   const end0=await H().evaluate(f=>{G.emps[f.c].portTransit[f.b]=G.day+40;MP1Host.host.publish();return G.emps[f.c].portTransit[f.b];},M.fx);await settle('z5a');
   await closeAll(B());await B().evaluate(()=>UI.act('commerceTransit'));await sleep(300);const lc=await B().evaluate(c=>{const me=MP1Join.empireId;return c===me?0:c===0?me:c;},EC);
   await hit(B(),'#modal .permitRow[data-o="'+lc+'"] [data-a="transitRenewAsk"]');const draft=await B().evaluate(()=>({give:UI.deal?.give,want:UI.deal?.want}));
   assert.deepEqual(draft.want,[{t:'portTransit'}]);assert.deepEqual(draft.give,[{t:'res',r:'etk',v:36}]);await tap(B(),'[data-a="dealSend"]');
   const id=await H().waitForFunction(([b,c])=>{const o=MP1Host.host.dip.offers.find(o=>o.from===b&&o.to===c&&o.status==='pending'&&o.want.some(i=>i.t==='portTransit'));return o?o.id:0;},[EB,EC],{timeout:20000,polling:200}).then(h=>h.jsonValue());
   await cmd('C',{kind:'respond',offer:id,action:'accept'});await H().waitForFunction(([b,c,e])=>G.emps[c].portTransit[b]>e+300,[EB,EC,end0],{timeout:20000});await settle('z5b');
   const host=await H().evaluate(f=>G.emps[f.c].portTransit[f.b],M.fx);
   const gb=await B().evaluate(c=>{const me=MP1Join.empireId,l=c===me?0:c===0?me:c;return G.emps[l].portTransit?.[0];},EC);
   const gc=await C().evaluate(b=>{const me=MP1Join.empireId,l=b===me?0:b===0?me:b;return G.p.portTransit?.[l];},EB);
   M.z5={end0,host,gb,gc};assert.ok(Math.abs(host-end0-360)<1e-6,'bitişten +360');assert.ok(Math.abs(gb-host)<1e-6,'B aynası aynı bitiş');assert.ok(Math.abs(gc-host)<1e-6,'C aynası aynı bitiş');});

 await test('Z6 kayıt → kapanış → relay yeniden → yeni oda → misafirler döner: transit kayıtları ve X–Y konvoyu birebir; kargo bir kez teslim',async()=>{
   let v=null;for(let i=0;i<30;i++){await days(2);v=await H().evaluate(f=>G.commerce.convoys.find(v=>v.e===f.x&&v.status!=='delivered'&&v.step>0)||null,M.fx);if(v)break;}
   assert.ok(v,'X–Y konvoyu yolda');M.cv=v.id;await closeAll(H());const pre=await H().evaluate(()=>JSON.stringify(G.commerce));const preRec=await H().evaluate(f=>({y:G.emps[f.y].res.min,x:G.emps[f.x].res.ene}),M.fx);
   await H().evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(H(),()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
   for(const n of Object.keys(ctx))await ctx[n].close().catch(()=>{});await stopRelay();await startRelay();
   const h=await open('H');await h.addInitScript(TIMERS);await h.goto(origin.H+'/');await wait(h,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
   await tap(h,'#mp1Btn');await wait(h,()=>MP1Host.screen==='menu');await tap(h,'[data-m="saves"][data-mode="resume"]');await wait(h,()=>document.querySelector('#mp1 [data-save]'));
   await tap(h,'#mp1 [data-save] [data-m="resume"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');
   await wait(h,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');const code1=await h.evaluate(()=>MP1Host.code);assert.notEqual(code1,getCode());setCode(code1);await h.evaluate(CANON);await h.evaluate(HOSTLIB);
   await tap(h,'[data-m="resumeGo"]');await wait(h,()=>document.getElementById('mp1Sheet'));await tap(h,'#mp1Sheet [data-m="sheetOk"]');await wait(h,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
   await h.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await closeAll(h);const post=await H().evaluate(()=>JSON.stringify(G.commerce));assert.equal(post,pre,'G.commerce (transit dahil) birebir');
   const code=getCode();const b=await open('B');await b.addInitScript(TIMERS);await b.goto(origin.B+'/mp/play?code='+code);await wait(b,()=>window.MP1Join&&document.getElementById('jName'));if(await b.evaluate(()=>!MP1Join.ws))await tap(b,'[data-j="go"]');await ready(b,EB);
   const c=await open('C');await c.addInitScript(TIMERS);await c.goto(origin.C+'/mp/play?code='+code);await wait(c,()=>window.MP1Join&&document.getElementById('jName'));if(await c.evaluate(()=>!MP1Join.ws))await tap(c,'[data-j="go"]');await ready(c,EC);
   for(const p of [b,c])await p.evaluate(CANON+GUESTLIB);await settle('z6');const gB=await guestTx(b,1);
   await H().evaluate(()=>{window.TZ=window.TZ||{};});await H().evaluate(f=>{window.TZ=f;},M.fx);
   let st=null;for(let i=0;i<120;i++){await days(3);st=await H().evaluate(id=>G.commerce.convoys.find(v=>v.id===id)?.status,M.cv);if(['delivered','destroyed','raided'].includes(st))break;}
   const rec=await H().evaluate(id=>{const v=G.commerce.convoys.find(v=>v.id===id);return {status:v.status,receipt:v.receipt,id:v.id,delivered:v.delivered,loaded:v.loaded,at:v.at,step:v.step,len:v.route.length,reason:v.reason,day:Math.floor(G.day)};},M.cv);
   await days(40);const rec2=await H().evaluate(id=>{const v=G.commerce.convoys.find(v=>v.id===id);return {status:v.status,delivered:v.delivered};},M.cv);
   M.z6={gB,rec,rec2};assert.equal(gB.st,'committed','misafir dönüşte talep durumu');assert.equal(rec.status,'delivered',JSON.stringify(rec));assert.equal(rec.receipt,rec.id,'tek makbuz');assert.deepEqual(rec2,{status:'delivered',delivered:rec.delivered},'ikinci teslim yok');});
};
