'use strict';
/* REINF-ROUTE.0 — X senaryosu: host + B (misafir, gerçek STARS arayüzü, ayrı Chromium). Misafir B'nin ana filosu düşman (AI) sistemine girer.
   X1 sipariş sınırdan ÖNCE: B FİLO panelinden gerçek dokunuşla FİLO TAKVİYESİ (reinf) → host kuyruğu; sonra ana filo düşman sistemine geçer,
      üretim biter → zincir: tersane çıkışı → hareket → ana filo gemi sayısı artar (host gerçeği + B aynası).
   X2 ana filo düşman sistemindeyken B gerçek dokunuşla OTOMATİK TAKVİYE: AÇIK → host'un fleetAutoReinforceTick'i sipariş verir (p39'da uzak insan için hiç
      sipariş yoktu) → teslim → B aynasında gemi sayısı artar.
   X3 ana filo yok olur, ona giden 4 sevkiyat → B Haberler → Sevkiyatlar sekmesinde TEK kart "Filo #id · Hedef kayıp · n takviye gemisi" (host'un
      aynı işleviyle aynı başlık), kart TOPLU KURTARMA düğmesi taşır. */
module.exports=async X=>{const {test,pg,metrics,sleep,shot,assert,wait,tap,settle,advance}=X;
 const M=metrics.reinf={};const H=pg.H,B=pg.B;const EB=await B.evaluate(()=>MP1Join.empireId);
 const hostShips=id=>H.evaluate(id=>{const f=G.fleets.find(f=>f.id===id);return f?f.ships.length:0;},id);
 const guestShips=id=>B.evaluate(id=>{const f=G.fleets.find(f=>f.id===id&&f.e===0);return f?f.ships.length:0;},id);
 const openFleet=id=>B.evaluate(id=>{try{UI.closeModal();}catch{}const f=G.fleets.find(f=>f.id===id&&f.e===0);if(!f)return false;View.sel=f;UI.tab('filo');UI.refresh();return true;},id);
 /* üretimi bitir: yalnız bu filoya teslimatlı işler; host gerçek gün adımı */
 const finishFor=id=>H.evaluate(id=>{let n=0;for(const s of G.sys)for(const q of s.queue||[])if(q.delivery&&q.delivery.fleet===id){q.left=0;n++;}return n;},id);
 const chain=async(id,before,label)=>{const out={before};for(let i=0;i<40;i++){await advance(3);const r=await H.evaluate(id=>{const N=G.fleets.filter(f=>f.joinFleet===id&&f.ships.length);
     return {ship:N.length,moving:N.filter(f=>f.path.length||f.mv).length,st:N.map(f=>shipmentStatus(f)).slice(0,2),main:(G.fleets.find(f=>f.id===id)||{ships:[]}).ships.length};},id);
     if(r.ship&&out.exit===undefined)out.exit=i;if(r.moving&&out.move===undefined)out.move=i;out.last=r;if(r.main>before)break;}
   out.main=await hostShips(id);M[label]=out;return out;};

 await test('X0 fikstür: B ana filosu + bileşim, AI ile savaş, ulaşılabilir AI sistemi (host)',async()=>{
   M.fx=await H.evaluate(b=>{const e=G.emps[b];for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k]||0,20000);
     const yard=G.sys.find(s=>s.owner===b&&yardCount(s)>0);if(!yard)return {err:'B tersanesi yok'};
     const ai=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);
     for(const a of ai){e.ally[a.id]=a.ally[b]=false;if(e.nap)delete e.nap[a.id];if(a.nap)delete a.nap[b];if(a.peaceAt)delete a.peaceAt[b];
       if(!e.war[a.id]){warAuthorize(a,e,{n:'Test dış saldırı'});declareWar(a,e);warAuthClear();}
       const A=newFleet(e,yard.id,[{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'}],'Taarruz');
       /* yalnız hedef sistem B'ye bilinir yapılır (sınırı geçen ana filo onu görür); öteki AI sistemlerinin bilinirliği değişmez */
       for(const s of G.sys){if(s.owner!==a.id)continue;
         const had=s.seen.includes(b);if(!had)s.seen.push(b);
         const keep=G.fleets;G.fleets=G.fleets.filter(f=>f!==A&&!(f.e===a.id&&f.sys===s.id));   /* fikstür: hedefteki AI filoları kaldırılır (görünür filo varken girilmez — ayrı Node vakası R7) */
         /* sürümden bağımsız seçim (p39 kontrolüyle aynı hedef): bilinen hiper-yol + geçiş izni; güvenli rota kararı sınanan motorun */
         const raw=findPath(yard.id,s.id,e);if(!raw||!pathAllowed(e,{e:b,ships:[{c:'kor'}]},raw,yard.id)){G.fleets=keep;if(!had)s.seen.splice(s.seen.indexOf(b),1);continue;}
         {   /* fikstür: hedefteki AI filoları kaldırılır (görünür filo varken girilmez — ayrı Node vakası R7) */
           const F=newFleet(e,yard.id,[{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'}],'1. Taarruz Filosu');
           const t=setFleetTemplate(e,F,{kor:7},false);MP1Host.host.publish();return {fleet:F.id,yard:yard.id,target:s.id,ai:a.id,t:t.ok,name:s.name,path:raw.join('>')};}}
       G.fleets=G.fleets.filter(f=>f!==A);}
     return {err:'ulaşılabilir AI sistemi yok',diag:G.emps.filter(o=>o.ai&&!o.dead).map(a=>({a:a.id,war:!!e.war[a.id],sys:G.sys.filter(s=>s.owner===a.id).map(s=>{const p=findPath(yard.id,s.id,e)||[],th=reinforcementThreats(e);return s.id+':'+p.map(x=>x+(th.has(x)?(th.armed&&th.armed.has(x)?'A':'T'):'')).join('>')+(p.length?(pathAllowed(e,{e:b,ships:[{c:'kor'}]},p,yard.id)?'':' !allow'):'');})}))};},EB);
   assert(!M.fx.err,JSON.stringify(M.fx));await settle('x0');assert.equal(await guestShips(M.fx.fleet),6,'B aynasında ana filo');});

 await test('X1 sipariş sınırdan önce (B gerçek dokunuş FİLO TAKVİYESİ), ana filo düşman sistemine geçer, üretim sonra biter → katılır; B aynasında 7',async()=>{
   assert(await openFleet(M.fx.fleet),'B FİLO paneli');const sel='[data-a="reinf"][data-x="'+M.fx.fleet+'"]';
   await B.locator(sel).first().scrollIntoViewIfNeeded();await shot(B,'x1-b-takviye-paneli');await tap(B,sel);
   await wait(H,id=>G.sys.some(s=>(s.queue||[]).some(q=>q.delivery&&q.delivery.fleet===id)),M.fx.fleet,20000);
   await H.evaluate(({id,t})=>{const F=G.fleets.find(f=>f.id===id);F.sys=t;F.path=[];F.mv=null;MP1Host.host.publish();},{id:M.fx.fleet,t:M.fx.target});
   M.x1finish=await finishFor(M.fx.fleet);const c=await chain(M.fx.fleet,6,'x1');
   assert(c.exit!==undefined,'tersaneden çıktı');assert(c.move!==undefined,'yola çıktı: '+JSON.stringify(c.last));assert.equal(c.main,7,'host: ana filo büyüdü '+JSON.stringify(c.last));
   await settle('x1');assert.equal(await guestShips(M.fx.fleet),7,'B aynası: 7 gemi');await openFleet(M.fx.fleet);await shot(B,'x1-b-katildi');});

 await test('X2 ana filo düşman sistemindeyken B gerçek dokunuşla OTOMATİK TAKVİYE: AÇIK → host sipariş verir → teslim; B aynasında 8',async()=>{
   await H.evaluate(({id,b})=>{const F=G.fleets.find(f=>f.id===id);setFleetTemplate(G.emps[b],F,{kor:8},false);MP1Host.host.publish();},{id:M.fx.fleet,b:EB});await settle('x2a');
   assert(await openFleet(M.fx.fleet));const sel='[data-a="compositionAuto"][data-x="'+M.fx.fleet+'"]';await B.locator(sel).first().scrollIntoViewIfNeeded();await tap(B,sel);
   await wait(H,id=>!!G.fleets.find(f=>f.id===id).composition.auto,M.fx.fleet,20000);
   let q=0;for(let i=0;i<10&&!q;i++){await advance(1);q=await H.evaluate(id=>G.sys.reduce((n,s)=>n+(s.queue||[]).filter(q=>q.delivery&&q.delivery.fleet===id).length,0),M.fx.fleet);}
   M.x2reason=await H.evaluate(id=>G.fleets.find(f=>f.id===id).composition.reason,M.fx.fleet);assert.equal(q,1,'otomatik sipariş: '+M.x2reason);
   await finishFor(M.fx.fleet);const c=await chain(M.fx.fleet,7,'x2');assert.equal(c.main,8,'host: '+JSON.stringify(c.last));
   await settle('x2');assert.equal(await guestShips(M.fx.fleet),8,'B aynası: 8 gemi');});

 await test('X3 ana filo yok olunca 4 sevkiyat → B Haberler → Sevkiyatlar: tek kart, host ile aynı başlık, TOPLU KURTARMA',async()=>{
   M.x3=await H.evaluate(({id,b})=>{const e=G.emps[b],F=G.fleets.find(f=>f.id===id);F.composition.auto=false;const yard=G.sys.find(s=>s.owner===b&&yardCount(s)>0);
     for(let i=0;i<4;i++){const n=newFleet(e,yard.id,[{c:'kor'}]);n.shipment={fleet:id,safe:true,origin:yard.id,state:'ready',attempts:0,next:0};n.joinFleet=id;}
     fleetLost(F,'combat');F.ships=[];G.fleets=G.fleets.filter(f=>f!==F);
     const g=fleetRecoveryGroups(e).filter(g=>g.id===id);MP1Host.host.publish();return {groups:g.length,ships:g[0]?g[0].ships.reduce((n,f)=>n+f.ships.length,0):0};},{id:M.fx.fleet,b:EB});
   await settle('x3');
   await B.evaluate(()=>{try{UI.closeModal();}catch{}ArchiveUI.open('news');});await tap(B,'.archiveTabs [data-a="shipmentsNews"]');
   await wait(B,()=>!!document.querySelector('#archiveShip'),undefined,10000);
   const g=await B.evaluate(()=>{const c=[...document.querySelectorAll('#archiveShip .shipLostCard')];return {n:c.length,head:c.map(x=>x.querySelector('summary b').textContent),recov:c.map(x=>!!x.querySelector('[data-a="fleetRecovery"]')),tab:document.querySelector('.archiveTabs [data-a="shipmentsNews"]').textContent};});
   M.x3guest=g;await B.evaluate(()=>{const d=document.querySelector('#archiveShip .shipLostCard');if(d)d.open=true;});await shot(B,'x3-b-sevkiyatlar-kart');
   assert.equal(g.n,1,'tek kart');assert.equal(g.head[0],'Filo #'+M.fx.fleet+' · Hedef kayıp · '+M.x3.ships+' takviye gemisi');assert.equal(g.recov[0],true);
   await B.evaluate(()=>{try{UI.closeModal();}catch{}});});
};
