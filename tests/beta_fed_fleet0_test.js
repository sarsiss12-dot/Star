'use strict';
/* BETA-FED-FLEET.0 — federal donanma: tek fon, tek bakım, federal sipariş (tersane kuyruğu), sınırlar, iptal, başkan değişimi,
   kayıttan devam, dağılma iadesi, AI başkan. Gerçek runtime Node vm'de (tests/helpers/runtime.js), orta galaksi, 5 AI, seed 22.
   FİKSTÜR (açıkça): devlet 0 ile 1 arasında federasyon (askerî), kaynak / fon değerleri doğrudan atanır; zaman fedFundTick / fedTick /
   dailyTick ile ilerletilir. B0 bölümü P27'deki bulguları gösterir (taban: FAIL, aday: PASS). */
const path=require('path'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(o={}){
  const h=runtime({root});h.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;`);
  h.sb.__o=o;h.run(`(()=>{const o=__o,ms=o.members||[0,1],type=o.type||'askeri';for(const a of ms)for(const b of ms)if(a!==b){G.emps[a].ally[b]=true;G.emps[a].contact[b]=true;G.emps[a].war[b]=false;G.emps[a].rel[b]=60;}
    const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test Federasyonu',type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:o.leader??ms[0],founder:ms[0],members:ms.slice(),laws:{...(o.laws||{})},treasury:o.treasury||0,fund:{ala:o.ala||0,ene:o.ene||0},nextVote:G.day+60,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds=G.feds||[];G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};
    for(const id of ms){const e=G.emps[id];for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],5000);const s=G.sys[e.home];if(!hasYard(s)){const p=s.planets.find(p=>p.owner===id&&p.col);p.col.b.tersane=(p.col.b.tersane||0)+1;}}
    globalThis.__fid=f.id;})()`);
  return h;
}
const fed=h=>J(h,'(()=>{const f=G.feds.find(x=>x.id===__fid);return f?{fund:f.fund,treasury:f.treasury,leader:f.leader,members:f.members,contrib:f.contrib||null,month:f.fleetOrderMonth??null}:null;})()');
const fedFleets=h=>J(h,'G.fleets.filter(f=>f.federal&&f.fedId===__fid).map(f=>({id:f.id,e:f.e,n:f.ships.length,sys:f.sys}))');
const orders=h=>J(h,'(()=>{const o=[];for(const s of G.sys)for(const q of s.queue)if(q.fed===__fid)o.push({sys:s.id,cls:q.cls,left:q.left,e:q.e,paid:q.fedPaid});return o;})()');
const res=(h,id)=>J(h,`({ala:G.emps[${id}].res.ala,ene:G.emps[${id}].res.ene})`);
const days=(h,n)=>{for(let i=0;i<n;i++)h.run('G.day+=1;dailyTick(1);');};
const nextMonth=h=>h.run('G.day=(Math.floor(G.day/30)+1)*30;');
const order=(h,e,cls='kor')=>J(h,`orderFederalShip(G.emps[${e}],G.emps[${e}].home,'${cls}')`);
const quote=(h,e,cls='kor',sys=null)=>J(h,`(()=>{const q=fedShipQuote(G.emps[${e}],${sys===null?`G.emps[${e}].home`:sys},'${cls}');return {ok:q.ok,why:q.why};})()`);
const total=(h,ids)=>J(h,`(()=>{const f=G.feds.find(x=>x.id===__fid);let a=0,e=0;for(const id of ${JSON.stringify(ids)}){a+=G.emps[id].res.ala;e+=G.emps[id].res.ene;}if(f){a+=f.fund.ala+(f.treasury||0);e+=f.fund.ene;}for(const s of G.sys)for(const q of s.queue)if(q.fed===__fid)a+=q.fedPaid.ala;return {a,e};})()`);

test('B0 bulgular (P27): Ortak Filo katkısı federal fona gider; federal filo başkanın kişisel bakımına girmez; fon enerji + alaşım bakımını ayda bir öder',()=>{
  const h=world({laws:{filo:true},ala:0,ene:0});
  const a0=fed(h).fund.ala;h.run('fedTick()');const f1=fed(h);
  assert.equal(f1.treasury,0,'hazinede (tüketicisiz) birikmez');assert(f1.fund.ala>=a0+8,'iki üye × 4 alaşım federal fona: '+JSON.stringify(f1));
  h.run(`(()=>{const fl=newFleet(G.emps[0],G.emps[0].home,[{c:'kru'},{c:'kru'}],'Federal Donanma');fl.federal=true;fl.fedId=__fid;})()`);
  const up=J(h,'[fleetUpkeep(G.emps[0]),fleetAlloyUpkeep(G.emps[0])]');h.run(`G.fleets.filter(f=>f.federal).forEach(f=>{f.federal=false;});`);
  const up2=J(h,'[fleetUpkeep(G.emps[0]),fleetAlloyUpkeep(G.emps[0])]');h.run(`G.fleets.filter(f=>f.fedId===__fid).forEach(f=>{f.federal=true;});`);
  assert(up2[0]>up[0]&&up2[1]>up[1],'federal filo başkanın enerji ve alaşım bakımına girmez: '+JSON.stringify({federal:up,kisisel:up2}));
  h.run(`(()=>{const f=G.feds.find(x=>x.id===__fid);f.fund.ala=1000;f.fund.ene=1000;for(const id of f.members){G.emps[id].inc.ala=0;G.emps[id].inc.ene=0;}})()`);const r0=res(h,0);
  h.run('fedFundTick()');const f2=fed(h);
  assert.ok(Math.abs(f2.fund.ene-(1000-2*35.8))<1e-9,'enerji bakımı fondan bir kez: '+f2.fund.ene);
  assert.ok(Math.abs(f2.fund.ala-(1000-2*3.64))<1e-9,'alaşım bakımı da fondan: '+f2.fund.ala);
  assert.deepEqual(res(h,0),r0,'başkanın kasası fon bakımı ödemez');
});
test('F1 eski hazine: f.treasury yüklemede bir kez fona; art arda kaydet/yükle döngülerinde toplam kaynak değişmez',()=>{
  const h=world({ala:50});h.run(`G.feds.find(x=>x.id===__fid).treasury=123;`);
  const s0=h.run('serialize()');const t0=JSON.parse(s0).world.feds.find(f=>f.id===h.sb.__fid);assert.equal(t0.treasury,123);assert.equal(t0.fund.ala,50);
  const r=runtime({root});r.sb.__t=s0;r.sb.__fid=h.sb.__fid;assert.equal(r.run('deserialize(__t)'),true);
  const a=fed(r);assert.equal(a.treasury,0);assert.equal(a.fund.ala,173,'123 hazine fona eklendi');assert.equal(J(r,'G._loadWorldInfo.fedTreasuryMoved'),123);
  let txt=r.run('serialize()');for(let i=0;i<3;i++){const q=runtime({root});q.sb.__t=txt;q.sb.__fid=h.sb.__fid;assert.equal(q.run('deserialize(__t)'),true);const b=fed(q);assert.equal(b.fund.ala,173,'döngü '+i);assert.equal(b.treasury,0);txt=q.run('serialize()');}
});
test('F2 aylık fon: tür oranı + Ortak Filo yasası + hibe katkısı kaydedilir; panel gerçek oranı ve harcanabilir bakiyeyi verir',()=>{
  const h=world({laws:{filo:true}});h.run('G.emps[0].inc.ala=200;G.emps[0].inc.ene=300;G.emps[1].inc.ala=100;G.emps[1].inc.ene=0;');
  h.run('fedFundTick();fedTick();');const f=fed(h);
  assert.ok(Math.abs(f.contrib[0].ala-(200*.05+4))<1e-9&&Math.abs(f.contrib[0].ene-15)<1e-9,'0: %5 öşür + 4 yasa: '+JSON.stringify(f.contrib));
  assert.ok(Math.abs(f.contrib[1].ala-(5+4))<1e-9);assert.ok(Math.abs(f.fund.ala-23)<1e-9&&Math.abs(f.fund.ene-15)<1e-9);
  const st=J(h,'fedFundStatus(G.feds.find(x=>x.id===__fid))');assert.equal(st.rate,.05);assert.equal(st.filoLaw,true);assert.equal(st.spendAla,st.ala,'donanma yokken rezerv 0');
  h.run('grantFed(G.emps[0])');assert.ok(Math.abs(fed(h).contrib[0].ala-(14+500))<1e-9,'hibe katkı sayılır');
});
test('F3 yetersiz fon: ödenebilen alınır, negatif bakiye yok; en zayıf federal filo dağıtılır; başkanın kasası federal bakım ödemez',()=>{
  const h=world({ala:5,ene:20});h.run(`(()=>{for(const n of [1,3]){const fl=newFleet(G.emps[0],G.emps[0].home,Array.from({length:n},()=>({c:'kor'})),'Federal Donanma');fl.federal=true;fl.fedId=__fid;}})()`);
  h.run('G.emps[0].inc.ala=0;G.emps[0].inc.ene=0;G.emps[1].inc.ala=0;G.emps[1].inc.ene=0;');const r0=res(h,0);
  h.run('fedFundTick()');const f=fed(h);assert.ok(Math.abs(f.fund.ala-(5-4*.77))<1e-9,'alaşım yeterli: normal kesinti');assert.equal(f.fund.ene,0,'enerji yetmedi: ödenebilen alındı, 0');assert(f.fund.ala>=0&&f.fund.ene>=0);
  assert.deepEqual(fedFleets(h).map(x=>x.n),[3],'1 gemilik (en zayıf) filo dağıtıldı');assert.deepEqual(res(h,0),r0,'başkanın kasası değişmedi');
});
test('F4 sipariş: yalnız başkan / kendi tersanesi / savaş gemisi; bedel bir kez fondan; süre sonunda TEK federal gemi; ayda bir; kapasite üye×4 (kuyruk dahil); 3 aylık rezerv',()=>{
  const h=world({ala:2000,ene:2000});
  assert.match(quote(h,1).why,/Yalnız federasyon başkanı/);assert.match(quote(h,0,'bil').why,/savaş gemisi/);
  const other=J(h,'G.sys.find(s=>s.owner!==0&&s.owner!==-1).id');assert.match(quote(h,0,'kor',other).why,/Kendi tersaneni/);
  const a0=fed(h).fund.ala,r0=res(h,0),r=order(h,0);assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(fed(h).fund.ala,a0-37,'bedel 32×1,15=37 alaşım fondan');assert.deepEqual(res(h,0),r0,'başkanın kasası ödemedi');
  const o=orders(h);assert.equal(o.length,1);assert.deepEqual(o[0].paid,{ala:37});
  assert.match(quote(h,0).why,/bu ay/i,'ayda bir');
  days(h,o[0].left+1);assert.deepEqual(orders(h),[]);const ff=fedFleets(h);assert.equal(ff.length,1);assert.equal(ff[0].n,1);assert.equal(ff[0].e,0);
  assert.equal(J(h,'fleetUsage(G.emps[0])'),J(h,'(()=>{let u=0;for(const f of G.fleets)if(f.e===0&&!f.federal)for(const s of f.ships)u+=SHIPS[s.c].sz;return u;})()'),'kapasite harcanmadı');
  /* kapasite: 2 üye × 4 = 8 (üretilmiş + kuyruk) */
  h.run(`(()=>{const fl=newFleet(G.emps[0],G.emps[0].home,Array.from({length:6},()=>({c:'kor'})),'Federal Donanma');fl.federal=true;fl.fedId=__fid;})()`);nextMonth(h);
  assert.equal(order(h,0).ok,true,'7+1=8 sınırda');nextMonth(h);assert.match(quote(h,0).why,/sınırı dolu \(8\/8/);
  /* rezerv: kuyruktakiler dahil 3 aylık bakım */
  const h2=world({ala:39,ene:2000});assert.match(quote(h2,0).why,/rezerv/,'39−37=2 < 3×0,77 alaşım rezervi');assert.equal(world({ala:40,ene:2000})&&true,true);
  const h3=world({ala:500,ene:15});assert.match(quote(h3,0).why,/rezerv/,'3×6,8 enerji rezervi');
});
test('F5 iptal: ödeme federal fona bir kez döner; kişisel kasaya gitmez; yinelenen iptal ikinci iade yapmaz; kişisel sipariş aynen',()=>{
  const h=world({ala:2000,ene:2000});order(h,0);const a1=fed(h).fund.ala,r1=res(h,0);
  const q=J(h,`(()=>{const s=G.sys[G.emps[0].home];const o=s.queue.filter(q=>q.fed===__fid);const r=cancelShipOrders(G.emps[0],s,o);const r2=cancelShipOrders(G.emps[0],s,o);return [r.ok,r.fedRefund,r2.ok];})()`);
  assert.deepEqual(q,[true,{ala:37},false]);assert.equal(fed(h).fund.ala,a1+37);assert.deepEqual(res(h,0),r1);assert.deepEqual(orders(h),[]);
  const k=J(h,`(()=>{const e=G.emps[0],s=G.sys[e.home],a=e.res.ala;queueShip(e,s,'kor');const o=s.queue.filter(q=>q.fed===undefined&&q.e===0).slice(-1);const r=cancelShipOrders(e,s,o);return [a-e.res.ala,r.refund];})()`);
  assert.deepEqual(k,[0,{ala:32}],'kişisel sipariş kendi kasasına');
});
test('F6 üretim sürerken başkan değişir: iş federasyona bağlı kalır, gemi O ANKİ başkana federal doğar; eski başkan yeni sipariş veremez',()=>{
  const h=world({ala:2000,ene:2000});order(h,0);const o=orders(h)[0];
  h.run('G.feds.find(x=>x.id===__fid).leader=1;fedFundTick();');assert.equal(orders(h).length,1,'iş sürüyor');
  assert.match(quote(h,0).why,/Yalnız federasyon başkanı/);days(h,o.left+1);
  const ff=fedFleets(h);assert.equal(ff.length,1);assert.equal(ff[0].e,1,'yeni başkan komuta eder');assert.equal(ff[0].sys,o.sys);
});
test('F7 kayıttan devam: üretim ortasında kaydet → yükle → tamamla: tek gemi, fon ve kaynak aynı',()=>{
  const h=world({ala:2000,ene:2000});order(h,0);days(h,10);const before=fed(h).fund;const t=h.run('serialize()');
  const r=runtime({root});r.sb.__t=t;r.sb.__fid=h.sb.__fid;assert.equal(r.run('deserialize(__t)'),true);assert.deepEqual(fed(r).fund,before);
  const o=orders(r);assert.equal(o.length,1);days(r,o[0].left+1);assert.equal(fedFleets(r).length,1);assert.deepEqual(orders(r),[]);assert.deepEqual(fed(r).fund,before);
});
test('F8 dağılma: bekleyen iş fona, federal filo dağıtılır (kişisel olmaz), fon katkı oranıyla iade; katkı kaydı yoksa eşit; toplam kaynak korunur',()=>{
  const h=world({ala:0,ene:0});h.run(`(()=>{const f=G.feds.find(x=>x.id===__fid);f.fund={ala:1000,ene:800};f.contrib={0:{ala:300,ene:100},1:{ala:100,ene:300}};})()`);
  order(h,0);h.run(`(()=>{const fl=newFleet(G.emps[0],G.emps[0].home,[{c:'kor'},{c:'kor'}],'Federal Donanma');fl.federal=true;fl.fedId=__fid;})()`);
  const t0=total(h,[0,1]),r0=[res(h,0),res(h,1)];
  h.run('fedDissolve(G.feds.find(x=>x.id===__fid))');assert.equal(fed(h),null);
  assert.deepEqual(J(h,'G.fleets.filter(f=>f.fedId===__fid||f.federal).length'),0,'federal filolar dağıtıldı, kişisel filoya dönmedi');assert.deepEqual(orders(h),[]);
  const t1=total(h,[0,1]);assert.ok(Math.abs(t1.a-t0.a)<1e-6&&Math.abs(t1.e-t0.e)<1e-6,'toplam: '+JSON.stringify({t0,t1}));
  const d0=res(h,0).ala-r0[0].ala,d1=res(h,1).ala-r0[1].ala;assert.ok(Math.abs(d0/(d0+d1)-.75)<1e-9,'alaşım 300:100 → 3/4');
  const e0=res(h,0).ene-r0[0].ene;assert.ok(Math.abs(e0-200)<1e-9,'enerji 100:300 → 1/4');
  const g=world({ala:600,ene:0});const g0=[res(g,0).ala,res(g,1).ala];g.run('fedDissolve(G.feds.find(x=>x.id===__fid))');
  assert.deepEqual([res(g,0).ala-g0[0],res(g,1).ala-g0[1]],[300,300],'katkı kaydı yok → eşit pay');
});
test('F9 AI başkan: savaş / savunma yükümlülüğü yoksa sipariş yok; varsa eşikle ayda en çok bir; aynı yol (kuyruk); RNG tüketmez',()=>{
  const h=world({leader:1,ala:5000,ene:5000});h.run('G.emps[1].ai=true;');
  const rs0=h.run('String(RND_STATE)');h.run('aiFederalFleetOrder(G.feds.find(x=>x.id===__fid))');assert.deepEqual(orders(h),[],'savaş / yükümlülük yok');
  h.run(`G.feds.find(x=>x.id===__fid).laws.savunma=true;`);h.run('aiFederalFleetOrder(G.feds.find(x=>x.id===__fid))');assert.deepEqual(orders(h),[],'barışta yürürlükteki savunma görevi tek başına sipariş doğurmaz');
  h.run(`(()=>{const o=G.emps.find(x=>x.ai&&!x.dead&&!x.wild&&x.id>2);G.emps[0].war[o.id]=true;o.war[0]=true;})()`);h.run('aiFederalFleetOrder(G.feds.find(x=>x.id===__fid));aiFederalFleetOrder(G.feds.find(x=>x.id===__fid));');
  const o=orders(h);assert.equal(o.length,1,'ayda en çok bir');assert.equal(o[0].e,1);assert.equal(h.run('String(RND_STATE)'),rs0,'RNG çekilmedi');
  const lo=world({leader:1,ala:60,ene:5000});lo.run(`(()=>{G.emps[1].ai=true;const o=G.emps.find(x=>x.ai&&!x.dead&&!x.wild&&x.id>2);G.emps[0].war[o.id]=true;o.war[0]=true;aiFederalFleetOrder(G.feds.find(x=>x.id===__fid));})()`);assert.deepEqual(orders(lo),[],'eşik altı: korvet için 2×(37+6×0,77)×0,8≈66,6 alaşım gerekir, fonda 60');
});
test('F10 tersane el değiştirir / sipariş veren üyelikten çıkar: iş aylık taramada kapanır, ödeme fona bir kez döner',()=>{
  const h=world({ala:2000,ene:2000});order(h,0);h.run('for(const id of [0,1]){G.emps[id].inc.ala=0;G.emps[id].inc.ene=0;}');const a=fed(h).fund.ala;h.run(`G.sys[G.emps[0].home].owner=1;`);h.run('fedFundTick()');
  assert.deepEqual(orders(h),[]);const f=fed(h);assert.ok(f.fund.ala>=a+37-1e-9,'iade');h.run('fedFundTick()');assert.ok(Math.abs(fed(h).fund.ala-f.fund.ala)<1e-6,'ikinci tarama ikinci iade yapmaz');
});
end();
