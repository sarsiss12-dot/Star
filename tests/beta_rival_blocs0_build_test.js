'use strict';
/* BETA-RIVAL-BLOCS.0 — koloni panelinden otomatik inşaat gemisi. Gerçek runtime (Node vm) + gerçek mp-core (misafir komutu).
   FİKSTÜR (açıkça): hedef = oyuncunun başkenti; gerektiğinde dört sistemin hatları küçük bir grafa yeniden bağlanır
   (X–N–T yakın ama N'de bilinen korsan yuvası; Y–M–T uzak ve güvenli). */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(){
  const h=runtime();h.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5,pirates:false});G.autoSave=false;var E=G.p,T=G.sys[E.home];
   for(const k of Object.keys(E.res))E.res[k]=99999;G.fleets=G.fleets.filter(f=>!(f.e===0&&f.ships.some(s=>s.c==='ins')));
   var KEY=Object.keys(STRUCTS).find(k=>structAllowed(E,T,k)&&k!=='kapi');
   function ins(sys,name){const f=newFleet(E,sys,[{c:'ins'}],name);return f;}
   function rewire(){const ids=G.sys.filter(s=>s.owner<0&&s.id!==T.id&&!G.emps.some(e=>e.home===s.id)).slice(0,4).map(s=>s.id);const [X,N,Y,M]=ids;
     for(const s of G.sys)s.lanes=s.lanes.filter(l=>!ids.includes(l));for(const id of ids)G.sys[id].lanes=[];
     const link=(a,b)=>{G.sys[a].lanes.push(b);G.sys[b].lanes.push(a);};link(X,N);link(N,T.id);link(Y,M);link(M,T.id);
     G.sys[X].x=T.x+60;G.sys[X].y=T.y;G.sys[N].x=T.x+30;G.sys[N].y=T.y+5;G.sys[Y].x=T.x-260;G.sys[Y].y=T.y;G.sys[M].x=T.x-130;G.sys[M].y=T.y+5;
     for(const id of ids){const s=G.sys[id];if(!s.seen.includes(0))s.seen.push(0);if(!s.surv.includes(0))s.surv.push(0);}
     G.sys[N].nest=true;if(typeof TRADE_PATHS!=='undefined')TRADE_PATHS.clear?.();return {X,N,Y,M};}`);
  return h;
}
const run=(h,days)=>h.run(`for(let i=0;i<${days};i++){G.day+=1;dailyTick(1);structTick(1);RemoteConstruction.tick();}`);
test('C1 gemi hedefte: tahmini varış 0, görev inşa başlar, bedel BİR KEZ kesilir; aynı yapı ikinci kez kuyruğa girmez',()=>{
  const h=world();assert.ok(h.run('!!KEY'),'uygun yapı');h.run('var f=ins(T.id,"İnş A");var before={...E.res};var r=RemoteConstruction.autoOrder(E,T.id,KEY);');
  assert.equal(h.run('r.ok'),true,h.run('r.why'));assert.equal(h.run('r.eta'),0);assert.equal(h.run('r.fleet'),h.run('f.id'));
  const again=J(h,'RemoteConstruction.autoOrder(E,T.id,KEY)');assert.equal(again.ok,false);assert.match(again.why,/zaten/);
  run(h,3);assert.equal(h.run('RemoteConstruction.tasks(f)[0]?.state'),'building');
  const paid=J(h,'Object.fromEntries(Object.entries(structCost(E,KEY)).map(([k,v])=>[k,before[k]-E.res[k]]))'),cost=J(h,'structCost(E,KEY)');
  for(const k of Object.keys(cost))assert.ok(Math.abs(paid[k]-cost[k])<=cost[k]*.001+1e-6||paid[k]>=cost[k],k+': '+JSON.stringify({paid,cost}));
  const n=J(h,'T.work.filter(w=>w.key===KEY).length');assert.equal(n,1,'tek inşaat');
});
test('C2 daha yakın geminin yolu bilinen yuvayla kapalı: rota süresiyle en erken varacak GÜVENLİ gemi seçilir',()=>{
  const h=world();h.run('var g=rewire();var near=ins(g.X,"Yakın");var far=ins(g.Y,"Uzak");var r=RemoteConstruction.autoOrder(E,T.id,KEY);');
  assert.equal(h.run('r.ok'),true,h.run('r.why'));assert.equal(h.run('r.fleet'),h.run('far.id'),'uzak ama güvenli gemi');assert.ok(h.run('r.eta')>0);
  h.run('G.sys[g.N].nest=false;RemoteConstruction.cancel(far,r.task.id);var r2=RemoteConstruction.autoOrder(E,T.id,KEY);');
  assert.equal(h.run('r2.fleet'),h.run('near.id'),'yol açılınca daha erken varacak yakın gemi');
});
test('C3 bütün gemiler meşgul: açık neden + isteğe bağlı kuyruk; mevcut iş kesilmez',()=>{
  const h=world();h.run(`var f=ins(T.id,"İnş B");var K2=Object.keys(STRUCTS).find(k=>k!==KEY&&structAllowed(E,T,k)&&k!=='kapi');var t0=RemoteConstruction.autoOrder(E,T.id,KEY);var r=RemoteConstruction.autoOrder(E,T.id,K2);`);
  assert.ok(h.run('!!K2'),'ikinci yapı');assert.equal(h.run('t0.ok'),true);assert.equal(h.run('r.ok'),false);assert.match(h.run('r.why'),/meşgul/);assert.equal(h.run('r.canQueue'),true);
  h.run('var q=RemoteConstruction.autoOrder(E,T.id,K2,{queue:true});');assert.equal(h.run('q.ok&&q.queued'),true,h.run('q.why'));
  assert.deepEqual(J(h,'RemoteConstruction.tasks(f).map(t=>t.key)'),J(h,'[KEY,K2]'),'ilk iş başta kalır');
});
test('C4 gemi yok: "İnşaat gemisi gerekli" — panel seçenekleri görünür ama pasif; ilk üretim bilgisi (insReady) Save8\'de korunur',()=>{
  const h=world();h.run('E.insReady=true;');const r=J(h,'RemoteConstruction.autoOrder(E,T.id,KEY)');assert.equal(r.ok,false);assert.equal(r.noShips,true);assert.match(r.why,/İnşaat gemisi gerekli/);
  const html=h.run('UI.autoBuildHtml(E,T)');assert.match(html,/İnşaat gemisi gerekli/);assert.match(html,/data-a="autoBuild"[^>]*disabled/);
  h.run('var s=serialize();E.insReady=false;var ok=deserialize(s);');assert.equal(h.run('ok&&G.p.insReady'),true);
  const fresh=runtime();fresh.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.fleets=G.fleets.filter(f=>!(f.e===0&&f.ships.some(s=>s.c==='ins')));`);
  assert.equal(fresh.run('UI.autoBuildHtml(G.p,G.sys[G.p.home])'),'','hiç inşaat gemisi üretilmemiş eski oyunda bölüm yok');
  fresh.run(`newFleet(G.p,G.p.home,[{c:'ins'}]);`);assert.match(fresh.run('UI.autoBuildHtml(G.p,G.sys[G.p.home])'),/OTOMATİK İNŞAAT GEMİSİ/,'eski kayıtta mevcut inşaat gemisi varsa erişilebilir');
});
test('C5 tersaneden ilk İNŞ çıkınca insReady yazılır (yalnız insan; AI alanı değişmez)',()=>{
  const h=world();h.run(`delete E.insReady;T.queue.push({cls:'ins',e:0,left:0,tot:1});for(let i=0;i<2;i++){G.day+=1;dailyTick(1);}`);assert.equal(h.run('E.insReady'),true);
  assert.equal(h.run('G.emps.some(e=>e.ai&&e.insReady)'),false);
});
test('C6 Save8: otomatik görev (auto, eta) yüklenir ve inşa sürer; kayıttan sonra rota panel çiziminde HESAPLANMAZ',()=>{
  const h=world();h.run('var g=rewire();var far=ins(g.Y,"Uzak");var r=RemoteConstruction.autoOrder(E,T.id,KEY);var s=serialize();var ok=deserialize(s);');
  assert.equal(h.run('ok'),true);const t=J(h,'Object.values(RemoteConstruction.state().queues).flat()[0]');assert.equal(t.auto,true);assert.ok(t.eta>0);
  h.run('var calls=0;const eg=explorationGraph;explorationGraph=function(){calls++;return eg.apply(this,arguments);};var html=UI.autoBuildHtml(G.p,G.sys[G.p.home]);explorationGraph=eg;');
  assert.equal(h.run('calls'),0,'panel çizimi rota aramaz');assert.match(h.run('html'),/tahmini varış/);
  run(h,400);assert.ok(J(h,'G.sys[G.p.home].built?.[KEY]===0||G.sys[G.p.home].work.some(w=>w.key===KEY)'),'yapı başladı/tamamlandı');
});
test('C7 MP: misafir B gerçek remoteAuto komutu — gemiyi host seçer; çift tıklama ikinci görevi reddeder',()=>{
  const {world:mpw,cmd}=require('./helpers/beta-fed-found0-mp-world.cjs');const h=mpw();
  h.run(`var B=G.emps[1],TB=G.sys[B.home];for(const k of Object.keys(B.res))B.res[k]=99999;var KB=Object.keys(STRUCTS).find(k=>structAllowed(B,TB,k)&&k!=='kapi');G.fleets=G.fleets.filter(f=>!(f.e===1&&f.ships.some(s=>s.c==='ins')));var fb=newFleet(B,TB.id,[{c:'ins'}]);`);
  const r=cmd(h,'B',{kind:'remoteAuto',sys:h.run('TB.id'),key:h.run('KB'),queue:false});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(h.run('RemoteConstruction.tasks(fb).length'),1);
  const r2=cmd(h,'B',{kind:'remoteAuto',sys:h.run('TB.id'),key:h.run('KB'),queue:false});assert.notEqual(r2.status,'ok');assert.equal(h.run('RemoteConstruction.tasks(fb).length'),1);
  const r3=cmd(h,'C',{kind:'remoteAuto',sys:h.run('TB.id'),key:h.run('KB'),queue:false});assert.notEqual(r3.status,'ok','başkasının sistemine emir yok');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
