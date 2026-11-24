'use strict';
/* TİCARET-SON-EKSİKLER.0 — insan sahipli çok taraflı transit onayı ve liman izni yenileme (gerçek çalışma zamanı; STARS_ROOT=<kök> eski sürümü koşar).
   Fikstür: a=2 (liman 10, mineral açığı / enerji fazlası), b=3 (tersi). Hat 10-11-…; ≤3 sıçrama kuralıyla yalnız ara limanlar durak olursa rota var.
   Tek ara liman: b'nin limanı 16, ara liman 13. İki ara liman: b'nin limanı 19, ara limanlar 13 ve 16 (iki ayrı sahip).
   İnsan taraflar: devlet 0 (tek oyunculu oyuncu / host) ve __mpHumanVoter ile uzak insan sayılan devlet 5 (misafir benzetimi).
   M1 tek insan limanı iki taşıyıcı · M2 ilk onay var ikinci bekliyor · M3 ikinci ret · M4 ilk onaydan sonra oyuncu ayrıldı · M5 tekrar edilen onay
   M6 onay sonrası liman fethi · M7 onay sırasında savaş · M8 yetersiz Etki · M9 iki ayrı insan limanı · M10 bekleyen işlemle Save8 · M11 tamamlanmış işlemle Save8
   M12 yenileme öncesi uyarı (60 / 30 / 0, tekrar yok) · M13 geçerli iznin yenilenmesi (bitişten uzar; pencere dışında reddedilir) · M14 bitmiş iznin yeniden verilmesi
   M15 yenileme reddi · M16 yoldaki konvoy, izin biter, yenilenmez · M17 izin yenilenir, konvoy devam eder (tek teslim)
   Ek: H1 oyuncunun kendi koridor talebi (AI sahip → tek işlem), H2 oyuncu talebi insan sahip onayı bekler, A1 AI yenileme (aiPermitRenew) tek ödeme,
   A2 kullanılmayan izin yenilenmez, K1 memo anahtarları en büyük kimliklerde çakışmaz, K2 bozuk kayıt reddedilir. */
const assert=require('assert/strict'),path=require('path');const {fresh}=require('./helpers/dispatch-fixture');const {setup}=require('./helpers/96a-fixture');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
/* O.two: iki ara liman (13 = O.c, 16 = O.d, b limanı 19); değilse 13 = O.c, b limanı 16. O.guest: uzak insan sayılan devletler. */
function world(O={}){const h=fresh(0,ROOT);h.run(setup);h.sb.OPT=JSON.stringify(O);h.run(`(function(){const O=JSON.parse(OPT);
  globalThis.__mpHumanVoter=id=>(O.guest||[]).includes(id);
  for(const e of G.emps){e.contact={};e.intel={};e.res.etk=300;}
  const ids=[0,2,3,4,5,6];for(const x of ids)for(const y of ids)if(x!==y){G.emps[x].contact[y]=true;G.emps[x].rel=G.emps[x].rel||{};G.emps[x].rel[y]=60;(G.emps[x].intel||={})[y]=3;(G.emps[x].mem||={})[y]=[{v:60,d:G.day,k:'t'}];}
  for(const s of G.sys)if(s.id>=10&&s.id<=19)s.lanes=[];const last=O.two?19:16;for(let i=10;i<last;i++)link(i,i+1);
  port(G.emps[2],10);port(G.emps[3],last);port(G.emps[O.c??0],13);if(O.two)port(G.emps[O.d??5],16);
  for(const id of [10,13,16,19])if(G.sys[id].planets[0].col){G.sys[id].planets[0].col.pop=120;G.sys[id].planets[0].col.q=[];}
  const a=G.emps[2],b=G.emps[3];for(const id of [2,3,4,5,6])G.emps[id].ai=true;
  a.res.ala=b.res.ala=200;a.res.min=20;a.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};a.res.ene=600;b.res.min=600;b.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};b.res.ene=20;
  a.pact[3]=b.pact[2]=true;Commerce.state();})()`);return h;}
const ask=h=>J(h,`(()=>{const a=G.emps[2],b=G.emps[3],bud={routes:96};const r=Commerce.aiTransitRequest(a,b,Commerce.aiBalance(a),Commerce.aiBalance(b),bud);return !!r;})()`);
const snap=h=>J(h,`({etk:G.emps.map(e=>Math.round(e.res.etk)),pt:G.emps.map(e=>Object.fromEntries(Object.entries(e.portTransit||{}).filter(([k,v])=>v>G.day))),
  tx:(G.commerce.transit||[]).map(t=>({id:t.id,st:t.st,votes:t.votes,legs:t.legs.map(l=>l.o+':'+l.c),why:t.why})),contracts:G.commerce.contracts.filter(c=>!Commerce.closed(c)).length,
  notes:(G.inbox||[]).filter(n=>n.kind==='transit').length})`);
const vote=(h,id,yes,who=0)=>J(h,`Commerce.transitVote(G.emps[${who}],${id},${yes})`);

test('M1 tek insan limanı: AI iki taşıyıcı için talep açar; onaydan önce izin/ödeme yok; onayla iki izin + düzenli sözleşme tek işlemde',()=>{
  const h=world({c:0});const s0=snap(h);assert.equal(ask(h),true,'talep açıldı');const s1=snap(h);
  assert.equal(s1.tx.length,1);assert.equal(s1.tx[0].st,'pending');assert.deepEqual(s1.tx[0].votes,{0:'pending'});assert.deepEqual(s1.tx[0].legs.sort(),['0:2','0:3']);
  assert.deepEqual(s1.etk,s0.etk,'onaydan önce ödeme yok');assert.deepEqual(s1.pt[0],{},'onaydan önce izin yok');assert.ok(s1.notes>=1,'oyuncuya kart');
  const r=vote(h,1,true);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.st,'committed');const s2=snap(h);
  assert.ok(s2.pt[0][2]&&s2.pt[0][3],'iki taşıyıcıya ayrı izin');assert.equal(s2.etk[2]-s0.etk[2],-36);assert.equal(s2.etk[3]-s0.etk[3],-36);assert.equal(s2.etk[0]-s0.etk[0],72);
  assert.equal(s2.contracts,1,'a–b düzenli sözleşmesi');assert.equal(s2.tx[0].st,'committed');});
test('M2 iki insan limanı: ilk onay var, ikinci bekliyor → hiçbir izin / ödeme yok, durum bekliyor',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);assert.equal(ask(h),true);const t=snap(h).tx[0];
  assert.deepEqual(t.votes,{0:'pending',5:'pending'},'iki ayrı sahip ayrı onay');assert.deepEqual(t.legs.sort(),['0:2','0:3','5:2','5:3']);
  const r=vote(h,1,true,0);assert.equal(r.st,'pending');const s1=snap(h);assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],{});assert.deepEqual(s1.pt[5],{});
  assert.equal(s1.tx[0].votes[0],'yes');assert.equal(s1.contracts,0);
  const forge=vote(h,1,true,4);assert.equal(forge.ok,false,'taraf olmayan onay veremez');assert.match(forge.why,/yetkin yok/);});
test('M3 ikinci sahip reddeder → talep reddedildi, kısmi izin ya da ödeme yok',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);ask(h);vote(h,1,true,0);const r=vote(h,1,false,5);assert.equal(r.st,'rejected');
  const s1=snap(h);assert.equal(s1.tx[0].st,'rejected');assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],{});assert.deepEqual(s1.pt[5],{});
  assert.equal(vote(h,1,true,0).ok,false,'sonuçlanan talep yeniden onaylanamaz');});
test('M4 ilk onaydan sonra ikinci oyuncu ayrıldı (artık uzak insan değil): talep başarıya dönmez, süre bitince expired, ödeme yok',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);ask(h);vote(h,1,true,0);h.run('globalThis.__mpHumanVoter=()=>false');
  h.run('for(let i=0;i<260;i++){G.day+=.5;Commerce.tick(.5);}');const s1=snap(h);
  assert.equal(s1.tx[0].st,'expired',JSON.stringify(s1.tx));assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],{});
  const late=vote(h,1,true,5);assert.equal(late.ok,false);assert.match(late.why,/sonuçlandı|süresi/);});
test('M5 tekrar edilen onay paketi: aynı karar ikinci kez uygulanmaz, ödeme bir kez',()=>{
  const h=world({c:0});const s0=snap(h);ask(h);const r1=vote(h,1,true);const r2=vote(h,1,true);assert.equal(r1.st,'committed');assert.equal(r2.ok,false);
  const s1=snap(h);assert.equal(s1.etk[0]-s0.etk[0],72,'tek ödeme');assert.equal(s1.contracts,1,'tek sözleşme');
  const h2=world({two:true,c:0,d:5,guest:[5]});ask(h2);vote(h2,1,true,0);const again=vote(h2,1,true,0);assert.equal(again.ok,false);assert.match(again.why,/zaten kayıtlı/);});
test('M6 onaydan sonra ara liman fethedildi: eski sahibin onayı kullanılmaz, talep geçersiz, ödeme yok',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);ask(h);vote(h,1,true,0);
  h.run('(()=>{const p=G.sys[13].planets[0];p.owner=4;p.col.e=4;G.sys[13].owner=4;G.emps[0].colonies=G.emps[0].colonies.filter(c=>c.s!==13);G.emps[4].colonies.push({s:13,p:0});})()');
  const r=vote(h,1,true,5);assert.equal(r.ok,false);assert.match(r.why,/Koşullar değişti|Rota artık/);const s1=snap(h);
  assert.equal(s1.tx[0].st,'invalid');assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],{});assert.deepEqual(s1.pt[5],{});assert.deepEqual(s1.pt[4],{});});
test('M7 onay sırasında savaş başladı: talep geçersiz, izin yok',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);ask(h);vote(h,1,true,0);h.run('G.emps[5].war[2]=G.emps[2].war[5]=true;');
  const r=vote(h,1,true,5);assert.equal(r.ok,false);assert.match(r.why,/savaşta|Rota/);const s1=snap(h);assert.equal(s1.tx[0].st,'invalid');assert.deepEqual(s1.etk,s0.etk);});
test('M8 yetersiz Etki: son onayda taşıyıcının Etki\'si yetmiyor → geçersiz, kısmi ödeme yok',()=>{
  const h=world({c:0});ask(h);h.run('G.emps[3].res.etk=50;');const s0=snap(h);const r=vote(h,1,true);assert.equal(r.ok,false);assert.match(r.why,/Etki yetersiz/);
  const s1=snap(h);assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],{});assert.equal(s1.contracts,0);});
test('M9 iki ayrı insan limanı: iki sahip de kendi izinlerini onaylar → dört izin, her sahibe +72, tek sözleşme',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});const s0=snap(h);ask(h);vote(h,1,true,0);const r=vote(h,1,true,5);assert.equal(r.st,'committed',JSON.stringify(r));
  const s1=snap(h);assert.ok(s1.pt[0][2]&&s1.pt[0][3]&&s1.pt[5][2]&&s1.pt[5][3],'dört izin');assert.equal(s1.etk[0]-s0.etk[0],72);assert.equal(s1.etk[5]-s0.etk[5],72);
  assert.equal(s1.etk[2]-s0.etk[2],-72);assert.equal(s1.etk[3]-s0.etk[3],-72);assert.equal(s1.contracts,1);});
test('M10 bekleyen işlemle Save8: kayıt/yükleme aynı durum, sonra son onay bir kez uygular',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});ask(h);vote(h,1,true,0);const save=h.run('serialize()');const before=snap(h);
  const h2=world({two:true,c:0,d:5,guest:[5]});h2.sb.SAVE=save;assert.equal(h2.run('deserialize(SAVE)'),true,'yüklendi');h2.run('globalThis.__mpHumanVoter=id=>id===5');
  const s=snap(h2);assert.deepEqual(s.tx,before.tx,'aynı onay durumu');assert.deepEqual(s.etk,before.etk);
  const r=vote(h2,1,true,5);assert.equal(r.st,'committed');const s1=snap(h2);assert.equal(s1.etk[0]-before.etk[0],72);assert.equal(vote(h2,1,true,5).ok,false);});
test('M11 tamamlanmış işlemle Save8: yüklemede yeniden uygulanmaz, ödeme / izin aynı',()=>{
  const h=world({c:0});ask(h);vote(h,1,true);const save=h.run('serialize()'),before=snap(h);const h2=world({c:0});h2.sb.SAVE=save;assert.equal(h2.run('deserialize(SAVE)'),true);
  const s=snap(h2);assert.deepEqual(s.etk,before.etk);assert.deepEqual(s.pt,before.pt);assert.equal(s.tx[0].st,'committed');assert.equal(vote(h2,1,true).ok,false);
  h2.run('for(let i=0;i<20;i++){G.day+=.5;Commerce.tick(.5);}');assert.deepEqual(snap(h2).etk,before.etk,'tick ödeme tekrarlamaz');});
test('M12 yenileme uyarısı: oyuncunun kullandığı izin için 60 / 30 / 0 günde birer kart, tekrar yok',()=>{
  const h=world({c:4});h.run('G.emps[4].portTransit={0:G.day+64};Commerce.tick(0);');
  const notes=()=>J(h,'(G.inbox||[]).filter(n=>n.kind==="transit").map(n=>n.title)');
  h.run('for(let i=0;i<10;i++){G.day+=.5;Commerce.tick(.5);}');assert.equal(notes().length,1,'60 gün: '+JSON.stringify(notes()));assert.match(notes()[0],/60 gün/);
  h.run('for(let i=0;i<20;i++){G.day+=.5;Commerce.tick(.5);}');assert.equal(notes().length,1,'tekrar yok');
  h.run('for(let i=0;i<50;i++){G.day+=.5;Commerce.tick(.5);}');assert.equal(notes().length,2);assert.match(notes()[1],/30 gün/);
  h.run('for(let i=0;i<70;i++){G.day+=.5;Commerce.tick(.5);}');assert.equal(notes().length,3);assert.match(notes()[2],/süresi doldu/);
  h.run('for(let i=0;i<70;i++){G.day+=.5;Commerce.tick(.5);}');assert.equal(notes().length,3,'bitişten sonra yeni uyarı yok');});
test('M13 geçerli iznin yenilenmesi: son 60 günde bitişten 360 gün uzar; daha erken aynı madde yürürlükte sayılır',()=>{
  const h=world({c:4});const r=J(h,`(()=>{const o=G.emps[4],c=G.emps[2],offer={from:2,to:4,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]};
    o.portTransit={2:G.day+100};const early=dealQuote(offer).norm.effectiveWant.some(i=>i.t==='portTransit');o.portTransit[2]=G.day+50;const end0=o.portTransit[2],e0=c.res.etk,ok=executeDeal(offer);
    return {early,ok,ext:o.portTransit[2]-end0,pay:e0-c.res.etk,again:dealQuote(offer).norm.effectiveWant.some(i=>i.t==='portTransit')};})()`);
  assert.equal(r.early,false,'pencere dışında izin maddesi yürürlükte sayılır (uygulanmaz)');assert.equal(r.ok,true);assert.equal(r.ext,360,'bitişten uzadı');assert.equal(r.pay,36,'tek bedel');assert.equal(r.again,false,'yenilemeden hemen sonra madde yeniden yürürlükte sayılır');});
test('M14 süresi bitmiş izin yeniden verilir: bugünden 360 gün',()=>{
  const h=world({c:4});const r=J(h,`(()=>{const o=G.emps[4];o.portTransit={2:G.day-10};const ok=executeDeal({from:2,to:4,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]});return {ok,left:o.portTransit[2]-G.day};})()`);
  assert.equal(r.ok,true);assert.equal(r.left,360);});
test('M15 yenileme reddi: insan sahip gelen kutusunda reddeder → izin uzamaz, ödeme yok',()=>{
  const h=world({c:0});const r=J(h,`(()=>{const o=G.p,c=G.emps[2];o.portTransit={2:G.day+40};const end0=o.portTransit[2],e0=c.res.etk;
    const sent=UI.aiOffer({from:2,to:0,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]});const rec=DiplomaticInbox.state().records.find(x=>x.kind==='aideal'&&x.status==='pending');
    const res=DiplomaticInbox.resolve(rec.id,false);return {sent:!!sent,res,end:o.portTransit[2]-end0,pay:e0-c.res.etk};})()`);
  assert.equal(r.sent,true);assert.equal(r.res.ok,true);assert.equal(r.end,0,'süre aynı');assert.equal(r.pay,0,'ödeme yok');});
/* M16 / M17: tek ara liman koridoru, iki taşıyıcı da 4'ün izniyle; konvoy yoldayken izin biter (yenilenmez) ya da yenilenir. */
function convoyWorld(renew){const h=world({c:4});return J(h,`(()=>{const o=G.emps[4];o.portTransit={2:G.day+40,3:G.day+40};
  const n={from:2,to:3,give:[{t:'freight',r:'ene',v:12,source:10,target:16,every:30,months:12}],want:[{t:'freight',r:'min',v:8,source:16,target:10,every:30,months:12}]};
  const ok=executeDeal(n);const etkA=G.emps[2].res.etk;let renewed=null;
  for(let d=0;d<300;d++){G.day+=.5;Commerce.tick(.5);G.day+=.5;Commerce.tick(.5);
   if(${renew}&&renewed===null&&o.portTransit[2]-G.day<20){renewed=executeDeal({from:2,to:4,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]})&&executeDeal({from:3,to:4,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]});}}
  const v=Commerce.state().convoys,rec=v.filter(x=>x.status==='delivered');
  return {ok,renewed,conv:v.map(x=>({id:x.id,st:x.status,e:x.e,del:x.delivered,lost:x.lost,receipt:x.receipt})),dup:rec.length!==new Set(rec.map(x=>x.receipt)).size,
   books:v.every(x=>Math.abs(x.loaded-x.amount-x.delivered-x.lost)<1e-6),paid:etkA-G.emps[2].res.etk,end:o.portTransit[2]-G.day};})()`);}
test('M16 yoldaki konvoy ve izin bitişi (yenileme yok): izinsiz ara limandan geçilmez, bekleme sonrası kayıp; muhasebe tutarlı, çift teslim yok',()=>{
  const r=convoyWorld(false);assert.equal(r.ok,true);assert.ok(r.conv.length>=2,'konvoylar yüklendi '+JSON.stringify(r.conv));
  assert.ok(r.conv.some(x=>x.st==='destroyed'||x.lost>0||x.st==='blocked'),'izin bitince en az bir konvoy durur / kaybolur '+JSON.stringify(r.conv));
  assert.equal(r.dup,false);assert.equal(r.books,true);assert.equal(r.paid,0,'yenileme ödemesi yok');});
test('M17 izin yoldayken yenilenir: konvoy devam eder ve tek kez teslim edilir; bedel bir kez',()=>{
  const r=convoyWorld(true);assert.equal(r.renewed,true);assert.ok(r.end>50,'izin uzadı '+r.end);const after=r.conv.filter(x=>x.st!=='preparing');
  assert.ok(after.length>=4&&after.every(x=>x.st==='delivered'||x.st==='moving'),'kayıp yok '+JSON.stringify(r.conv));assert.equal(r.dup,false);assert.equal(r.books,true);assert.equal(r.paid,36,'tek yenileme bedeli');});
test('H1 oyuncunun koridor talebi, AI sahip: iki yön izinleri tek işlemde verilir (kendi ve ortağın Etki\'siyle)',()=>{
  const h=world({c:4});h.run('G.p.pact[3]=G.emps[3].pact[0]=true;G.emps[0].colonies=[];port(G.p,10);G.emps[2].colonies=[];');const s0=snap(h);
  const r=J(h,'Commerce.transitAsk(G.p,G.emps[3],10,16)');assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.st,'committed');const s1=snap(h);
  assert.ok(s1.pt[4][0]&&s1.pt[4][3]);assert.equal(s1.etk[0]-s0.etk[0],-36);assert.equal(s1.etk[3]-s0.etk[3],-36);assert.equal(s1.etk[4]-s0.etk[4],72);});
test('H2 oyuncunun koridor talebi, insan sahip (uzak insan): sahip onaylayana dek bekler; VAZGEÇ ile kapanır, ödeme yok',()=>{
  const h=world({c:5,guest:[5]});h.run('G.p.pact[3]=G.emps[3].pact[0]=true;G.emps[0].colonies=[];port(G.p,10);G.emps[2].colonies=[];');const s0=snap(h);
  const r=J(h,'Commerce.transitAsk(G.p,G.emps[3],10,16)');assert.equal(r.st,'pending');assert.deepEqual(snap(h).tx[0].votes,{5:'pending'});
  assert.equal(J(h,'Commerce.transitCancel(G.emps[5],1)').ok,false,'yalnız talep eden geri çeker');const c=J(h,'Commerce.transitCancel(G.p,1)');assert.equal(c.st,'cancelled');
  assert.deepEqual(snap(h).etk,s0.etk);assert.equal(vote(h,1,true,5).ok,false);});
test('A1 AI yenileme: aktif sözleşmenin kullandığı izin son 60 günde bir kez, tek bedelle yenilenir; bekleme süresinde ikinci istek yok',()=>{
  const h=world({c:4});const r=J(h,`(()=>{const o=G.emps[4];o.portTransit={2:G.day+300,3:G.day+300};
   executeDeal({from:2,to:3,give:[{t:'freight',r:'ene',v:12,source:10,target:16,every:30,months:24}],want:[{t:'freight',r:'min',v:8,source:16,target:10,every:30,months:24}]});
   o.portTransit[2]=G.day+45;const e0=G.emps[2].res.etk,end0=o.portTransit[2];Commerce.aiPermitRenew(G.emps[2]);const e1=G.emps[2].res.etk;Commerce.aiPermitRenew(G.emps[2]);
   return {pay:e0-e1,pay2:e1-G.emps[2].res.etk,ext:o.portTransit[2]-end0};})()`);
  assert.equal(r.pay,36);assert.equal(r.pay2,0,'ikinci istek yok');assert.equal(r.ext,360);});
test('A2 AI yenileme: izni kullanan aktif sözleşme yoksa ya da Etki yetersizse yenileme istenmez',()=>{
  const h=world({c:4});const r=J(h,`(()=>{const o=G.emps[4];o.portTransit={2:G.day+45};const e0=G.emps[2].res.etk;Commerce.aiPermitRenew(G.emps[2]);
   return {pay:e0-G.emps[2].res.etk,end:o.portTransit[2]-G.day};})()`);assert.equal(r.pay,0);assert.equal(r.end,45);});
test('K1 rota memo anahtarları: en büyük devlet (63) ve sistem (999) kimliklerinde çakışma yok, aralık dışı memo atlanır',()=>{
  const keys=new Set();for(const a of [0,1,62,63])for(const b of [0,1,62,63])for(const f of [0,1,998,999])for(const t of [0,1,998,999])keys.add(((a*256+b)*65536+f)*65536+t);
  assert.equal(keys.size,4*4*4*4);assert.ok(((63*256+63)*65536+999)*65536+999<Number.MAX_SAFE_INTEGER);const r=new Set();for(const a of [0,63])for(const s of [0,999])r.add(a*65536+s);assert.equal(r.size,4);});
test('K2 bozuk transit onay kaydı reddedilir (oy değeri / sahipsiz oy / kimlik sayacı)',()=>{
  const h=world({two:true,c:0,d:5,guest:[5]});ask(h);const save=JSON.parse(h.run('serialize()'));const bad=[s=>{s.commerce.transit[0].votes[0]='belki';},s=>{s.commerce.transit[0].votes[4]='yes';},s=>{s.commerce.nextTransit=1;},s=>{s.commerce.transit[0].st='committed';}];
  for(const f of bad){const s=JSON.parse(JSON.stringify(save));f(s);const h2=world({two:true,c:0,d:5,guest:[5]});h2.sb.SAVE=JSON.stringify(s);assert.equal(h2.run('deserialize(SAVE)'),false,'reddedilmeli');}});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
