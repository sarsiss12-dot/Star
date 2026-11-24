'use strict';
/* TİCARET-TAMAMLAMA.0 Faz A — Transit İzni (gerçek çalışma zamanı; STARS_ROOT=<kök> eski sürümü koşar).
   Fikstür: a=2 (liman 10, mineral açığı / enerji fazlası), b=3 (liman 16, tersi), sahip o=4 (liman 13). Hat 10-11-…-16 (6 sıçrama): ≤3 sıçrama kuralıyla
   yalnız 13'teki liman ara durak olursa rota var; geri yön (b → a) da aynı limandan geçer → iki taşıyıcı da izin ister.
   T1 iki yönlü koridor: iki izin, her biri kendi Etki'siyle (−36 / −36, sahip +72); ertesi ay a–b freight sözleşmesi
   T2 bekleme: aynı ay ikinci çağrı rota / Etki harcamaz
   T3 tek yönlü (b zaten izinli): yalnız a izin alır, b ikinci izin almaz
   T4 aradaki liman yok: hiçbir istek, Etki harcanmaz
   T5 insan sahip + iki yön: çok taraflı onay talebi (SON-EKSİKLER.0); insan adına izin / ödeme yok
   T6 insan sahip + tek yön: teklif insanın gelen kutusuna gider (AI izni kendisi oluşturamaz)
   T7 düşük güven: sahip karşı teklifi teklif edenin tavanını aşar → izin / Etki yok
   T8 kısmi hata (ikinci portTransit maddesinde motor hatası): hiçbir izin ve ödeme kalmaz, bekleme süreleri kalır
   T9 izin taşıyıcı başına: a'nın izni b'ye geçmez (portRight)
   T10 izin süresi: 360 gün sonra izin biter, rota kapanır; erken geri alma (revokePortTransit) rota kapatır
   T11 federasyon ticaret yasası: üye sahibin limanı izinsiz açık; ayrılınca kapanır; zaten hakkı olan için izin istenmez
   T12 alternatif rota: yolda izin geri alınır, ikinci izinli ara liman varsa konvoy yeniden plan yapıp teslim eder (tek teslim) */
const assert=require('assert/strict'),path=require('path');const {fresh}=require('./helpers/dispatch-fixture');const {setup}=require('./helpers/96a-fixture');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(O={}){const h=fresh(0,ROOT);h.run(setup);h.sb.OPT=JSON.stringify(O);h.run(`(function(){const O=JSON.parse(OPT);const own=O.owner??4;
  for(const e of G.emps){e.contact={};e.intel={};e.res.etk=300;}
  const ids=[2,3,4,5,0];for(const x of ids)for(const y of ids)if(x!==y){G.emps[x].contact[y]=true;G.emps[x].rel=G.emps[x].rel||{};G.emps[x].rel[y]=O.rel??60;(G.emps[x].intel||={})[y]=3;(G.emps[x].mem||={})[y]=[{v:O.trust??60,d:G.day,k:'t'}];}
  for(const s of G.sys)if(s.id>=10&&s.id<=19)s.lanes=[];for(let i=10;i<16;i++)link(i,i+1);
  port(G.emps[2],10);port(G.emps[3],16);if(!O.noRelay)port(G.emps[own],13);
  if(O.alt){link(10,17);link(17,18);link(18,19);link(19,16);port(G.emps[5],18);}   /* ikinci koridor 10-17-[5:18]-19-16 */
  for(const id of [10,16,13,18])if(G.sys[id].planets[0].col){G.sys[id].planets[0].col.pop=120;G.sys[id].planets[0].col.q=[];}
  const a=G.emps[2],b=G.emps[3];a.ai=b.ai=true;G.emps[4].ai=G.emps[5].ai=true;
  a.res.ala=b.res.ala=200;a.res.min=20;a.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};a.res.ene=600;b.res.min=600;b.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};b.res.ene=20;
  a.pact[3]=b.pact[2]=true;
  if(O.bRight)(G.emps[own].portTransit||={})[3]=G.day+360;
  Commerce.state();})()`);return h;}
const call=(h,extra='')=>J(h,`(()=>{const a=G.emps[2],b=G.emps[3];${extra}
  const own=G.emps.find(e=>e.id!==2&&e.id!==3&&tradeHubs(e).includes(13))||G.emps[4];const e0=[a.res.etk,b.res.etk,own.res.etk],ib=(G.inbox||[]).length;
  const bud={routes:96};const r=Commerce.aiTransitRequest(a,b,Commerce.aiBalance(a),Commerce.aiBalance(b),bud);
  return {r:!!r,used:96-bud.routes,aRight:own.portTransit?.[2]>G.day,bRight:own.portTransit?.[3]>G.day,etk:[a.res.etk-e0[0],b.res.etk-e0[1],own.res.etk-e0[2]].map(Math.round),
   inbox:(G.inbox||[]).length-ib,coolA:a.aiTalk?.['portTransit:3']?.until>G.day,coolB:b.aiTalk?.['portTransit:2']?.until>G.day};})()`);

test('T1 iki yönlü koridor: iki izin, her taşıyıcı kendi Etki\'siyle; ertesi ay a–b freight sözleşmesi',()=>{
  const h=world();const r=call(h);assert.equal(r.r,true,'istek uygulandı '+JSON.stringify(r));assert.ok(r.aRight&&r.bRight,'iki izin');assert.deepEqual(r.etk,[-36,-36,72],'her biri 36');
  h.run('G.day+=31;Commerce.state().aiAt={};Commerce.aiOpportunityTick();');const c=J(h,'Commerce.state().contracts.filter(c=>!c.once).map(c=>[c.a,c.b])');assert.deepEqual(c,[[2,3]],'sözleşme');});
test('T2 bekleme: aynı ay ikinci çağrı rota ya da Etki harcamaz',()=>{const h=world();call(h);const r=call(h);assert.equal(r.used,0);assert.deepEqual(r.etk,[0,0,0]);});
test('T3 tek yönlü (b zaten izinli): yalnız a izin alır; b ikinci izin almaz',()=>{const h=world({bRight:true});const r=call(h);assert.equal(r.aRight,true);assert.deepEqual(r.etk,[-36,0,36]);assert.equal(r.coolB,false,'b için istek yok');});
test('T4 aradaki liman yok: istek yok, Etki harcanmaz',()=>{const r=call(world({noRelay:true}));assert.equal(r.r,false);assert.deepEqual(r.etk,[0,0,0]);});
/* TİCARET-SON-EKSİKLER.0: p51–p53'te insan sahibe iki yönlü istek HİÇ gönderilmiyordu (bilinen sınırlama). Artık çok taraflı onay talebi açılır;
   değişmeyen kural: insan adına izin ya da ödeme yazılmaz, karar insanındır. Ayrıntılı vakalar tests/ticaret_son_eksikler0_test.js. */
test('T5 insan sahip + iki yön: çok taraflı onay talebi açılır; insan onaylamadan izin / ödeme yok',()=>{const h=world({owner:0});const r=call(h);const tx=J(h,'(G.commerce.transit||[]).map(t=>({st:t.st,votes:t.votes,legs:t.legs.length}))');
  assert.equal(r.r,true,'talep açıldı');assert.deepEqual(tx,[{st:'pending',votes:{0:'pending'},legs:2}]);assert.deepEqual(r.etk,[0,0,0]);assert.equal(r.aRight||r.bRight,false);assert.ok(r.inbox>=1,'oyuncuya transit kartı');});
test('T6 insan sahip + tek yön: teklif insanın gelen kutusuna gider, izin kendiliğinden oluşmaz',()=>{
  const h=world({owner:0,bRight:true});const r=call(h);const rec=J(h,'(DiplomaticInbox.state?.().records||[]).filter(x=>x.status==="pending").map(x=>x.kind)');
  assert.equal(r.aRight,false,'insan adına izin yok');assert.deepEqual(r.etk,[0,0,0],'ödeme kabulden önce yok');assert.ok(r.inbox>0||rec.length>0,'teklif gelen kutusunda '+JSON.stringify({r,rec}));});
test('T7 düşük güven: pahalı karşı teklif → izin ve Etki yok',()=>{const r=call(world({trust:0}));assert.equal(r.aRight||r.bRight,false);assert.deepEqual(r.etk,[0,0,0]);});
test('T8 kısmi hata: ikinci izin motor hatasıyla düşerse hiçbir izin / ödeme kalmaz, bekleme süreleri kalır',()=>{
  const h=world();const r=call(h,`let n=0;G._dealFailInject=k=>{if(k==='before:portTransit'&&++n===2)throw Error('enjekte');};`);h.run('delete G._dealFailInject');
  assert.equal(r.aRight,false,'a izni geri alındı');assert.equal(r.bRight,false);assert.deepEqual(r.etk,[0,0,0],'ödeme yok');assert.ok(r.coolA&&r.coolB,'bekleme kalır (spam yok)');});
test('T9 izin taşıyıcı başına: a\'nın izni b\'ye geçmez',()=>{const h=world();const r=J(h,`(()=>{const o=G.emps[4];(o.portTransit||={})[2]=G.day+360;
  return {a:Commerce.portRight(o,G.emps[2]),b:Commerce.portRight(o,G.emps[3]),fwd:!!Commerce.route(G.emps[2],G.emps[3],10,16),back:!!Commerce.route(G.emps[3],G.emps[2],16,10)};})()`);
  assert.deepEqual(r,{a:true,b:false,fwd:true,back:false});});
test('T10 izin süresi ve erken geri alma: süre bitince ve revokePortTransit ile rota kapanır',()=>{const h=world();const r=J(h,`(()=>{const o=G.emps[4],a=G.emps[2],b=G.emps[3];(o.portTransit||={})[2]=G.day+360;
  const r0=!!Commerce.route(a,b,10,16);G.day+=361;const r1=!!Commerce.route(a,b,10,16);G.day-=361;const r2=!!Commerce.route(a,b,10,16);const rv=revokePortTransit(o,a);const r3=!!Commerce.route(a,b,10,16);return {r0,r1,r2,rv,r3};})()`);
  assert.deepEqual(r,{r0:true,r1:false,r2:true,rv:true,r3:false});});
test('T11 federasyon ticaret yasası: üye sahibin limanı izinsiz açık; ayrılınca kapanır; hakkı olan için izin istenmez',()=>{
  const h=world();const r=J(h,`(()=>{const o=G.emps[4],a=G.emps[2],b=G.emps[3];const f={id:'tt1',name:'TT',members:[2,3,4],leader:4,laws:{ticaret:true},type:'ticaret',founded:G.day,votes:[]};(G.feds||(G.feds=[])).push(f);
  const has=findFed(a)===f;const r0=[Commerce.portRight(o,a),Commerce.portRight(o,b),!!Commerce.route(a,b,10,16),!!Commerce.route(b,a,16,10)];
  const e0=a.res.etk;const req=Commerce.aiTransitRequest(a,b,Commerce.aiBalance(a),Commerce.aiBalance(b),{routes:96});
  f.members=[3,4];const r1=[Commerce.portRight(o,a),!!Commerce.route(a,b,10,16)];return {has,r0,req:!!req,etk:a.res.etk-e0,r1};})()`);
  assert.equal(r.has,true,'federasyon bulundu');assert.deepEqual(r.r0,[true,true,true,true],'yasa izin sayılır');assert.equal(r.etk,0,'izin istenmedi');assert.deepEqual(r.r1,[false,false],'ayrılınca kapanır');});
test('T12 alternatif rota: yolda izin geri alınır, ikinci izinli ara liman varsa konvoy yeniden plan yapar ve tek kez teslim eder',()=>{
  const h=world({alt:true});const r=J(h,`(()=>{const a=G.emps[2],b=G.emps[3],o=G.emps[4],o2=G.emps[5];(o.portTransit||={})[2]=G.day+360;(o2.portTransit||={})[2]=G.day+360;
  /* yalnız 13 üzerinden giden ilk rotayı zorlamak için ikinci koridoru geçici kapat */
  const keep=G.sys[17].lanes.slice();G.sys[10].lanes=G.sys[10].lanes.filter(x=>x!==17);G.sys[17].lanes=G.sys[17].lanes.filter(x=>x!==10);
  const ok=executeDeal({from:2,to:3,give:[{t:'cargo',r:'ene',v:40}],want:[]});
  G.sys[10].lanes.push(17);G.sys[17].lanes.push(10);const b0=b.res.ene;
  for(let i=0;i<3;i++){G.day+=1;Commerce.tick(1);}const v0=JSON.parse(JSON.stringify(Commerce.state().convoys.at(-1)));revokePortTransit(o,a);
  for(let i=0;i<300;i++){G.day+=1;Commerce.tick(1);}const v=Commerce.state().convoys.at(-1);const b1=b.res.ene;for(let i=0;i<60;i++){G.day+=1;Commerce.tick(1);}
  return {ok,r0:v0.route,status:v.status,route:v.route,got:Math.round(b1-b0),again:Math.round(b.res.ene-b1)};})()`);
  assert.equal(r.ok,true,'kargo kabul');assert.ok(r.r0.includes(13),'ilk rota 13 '+JSON.stringify(r.r0));assert.equal(r.status,'delivered','teslim '+JSON.stringify(r));assert.ok(r.route.includes(18),'alternatif 18 '+JSON.stringify(r.route));
  assert.equal(r.got,40,'tek teslim');assert.equal(r.again,0,'ikinci teslim yok');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
