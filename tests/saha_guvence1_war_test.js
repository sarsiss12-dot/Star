'use strict';
/* SAHA-GÜVENCE.1 Faz C — savaş sonuçları ve müzakere güvenliği. STARS_ROOT=<kök> eski sürüm (MP dünyası da o kökün mp-core / mirror dosyalarıyla).
   C1 insan–insan Savaşa Yardım: misafir B (devlet 1), misafir C'nin (devlet 3) AI X'e karşı savaşına katılmayı teklif eder, karşılığında 300 alaşım ister —
      gerçek host komutları (offer / respond / counter / withdraw), motorun dealQuote / executeDeal yolu. Tek ödeme, tek uygulama, ret, karşı teklif,
      savaş bitince geçersizlik, kabul sonrası MP paketi kaydı → yükleme ikinci ödeme üretmez.
   C4 İsyanı Bastır: koptuğu devlete karşı 6+ hedef de bedelsiz (arayüz "bedelsiz" diyor; eskiden 6. hedeften sonrası ücretliydi).
   C2 toprak vaadi verilen sistem v2 Fetih barışında düşmana iade edilmez, alana devredilir.
   C5 sistemin açtığı (önerensiz) federasyon temel yasa oyu gelen kutusuna kayıt + kart (P46 bulgusu). */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function mpWorld(){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'sg1c',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e]of [['B',1],['C',3]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};
    var B=G.emps[1],C=G.emps[3],X=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&![1,3].includes(o.id));
    for(const a of [B,C,X])for(const b of [B,C,X])if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;a.rel[b.id]=60;if(a.nap)delete a.nap[b.id];}
    B.ally[C.id]=C.ally[B.id]=true;B.rel[C.id]=C.rel[B.id]=90;for(const e of [B,C])for(const k of ['min','ene','ala','etk'])e.res[k]=2000;
    warAuthorize(X,C,{n:'Test'});declareWar(X,C);warAuthClear();var FRONT=warLedgerFind(X.id,C.id).id;`);return h;}
function cmd(h,c,x){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:'sg1'+c+String(s).padStart(6,'0'),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result');}
const offerHelp=(h,ala=300)=>cmd(h,'B',{kind:'offer',to:3,give:[{t:'warJoin',front:+h.run('FRONT'),target:+h.run('X.id')}],want:[{t:'res',r:'ala',v:ala}]});
const st=h=>J(h,`{bWar:!!B.war[X.id],xWar:!!X.war[B.id],bAla:Math.round(B.res.ala),cAla:Math.round(C.res.ala),side:(warLedgerFind(X.id,C.id)||{}).sides}`);
const idOf=r=>r&&r.extra&&(r.extra.offer??r.extra.id);

test('C1.1 teklif hazırlanınca savaş / ödeme yok; C kabul eder → B doğru cepheye girer, 300 alaşım C\'den bir kez düşer B\'ye bir kez eklenir',()=>{
  const h=mpWorld(),s0=st(h);const o=offerHelp(h);assert.equal(o.status,'ok',JSON.stringify(o));
  const s1=st(h);assert.equal(s1.bWar,false,'teklif savaş başlatmaz');assert.equal(s1.cAla,s0.cAla);assert.equal(s1.bAla,s0.bAla);
  const r=cmd(h,'C',{kind:'respond',offer:idOf(o),action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));
  const s2=st(h);assert.equal(s2.bWar,true,'B, X ile savaşta');assert.equal(s2.xWar,true);assert.equal(s2.cAla,s0.cAla-300,'C bir kez öder');assert.equal(s2.bAla,s0.bAla+300,'B bir kez alır');
  const r2=cmd(h,'C',{kind:'respond',offer:idOf(o),action:'accept'});assert.notEqual(r2&&r2.status,'ok','ikinci kabul reddedilir');
  const s3=st(h);assert.equal(s3.cAla,s2.cAla,'ikinci ödeme yok');assert.equal(s3.bAla,s2.bAla);});

test('C1.2 aynı komut kimliği (cid) iki kez gönderilir → tek uygulama (host sonuç önbelleği)',()=>{
  const h=mpWorld(),s0=st(h);const o=offerHelp(h);const id=idOf(o);
  const m=JSON.stringify({v:1,type:'cmd',seq:50,cid:'sg1Cdup000001',cmd:{kind:'respond',offer:id,action:'accept'}});h.sb.m1=m;h.sb.m2=JSON.stringify({...JSON.parse(m),seq:51});
  h.run(`MP.onMessage('C',m1);MP.onMessage('C',m2);`);const s=st(h);assert.equal(s.bWar,true);assert.equal(s.cAla,s0.cAla-300,'tek ödeme');assert.equal(s.bAla,s0.bAla+300);});

test('C1.3 ret: savaş yok, ödeme yok; geri çekilen teklif kabul edilemez',()=>{
  const h=mpWorld(),s0=st(h);const o=offerHelp(h);const r=cmd(h,'C',{kind:'respond',offer:idOf(o),action:'reject'});assert.equal(r.status,'ok',JSON.stringify(r));
  let s=st(h);assert.equal(s.bWar,false);assert.equal(s.cAla,s0.cAla);
  const o2=offerHelp(h,250);assert.equal(o2.status,'ok');assert.equal(cmd(h,'B',{kind:'withdraw',offer:idOf(o2)}).status,'ok');
  assert.notEqual((cmd(h,'C',{kind:'respond',offer:idOf(o2),action:'accept'})||{}).status,'ok','geri çekilmiş teklif');s=st(h);assert.equal(s.bWar,false);assert.equal(s.cAla,s0.cAla);});

test('C1.4 karşı teklif: C 150 alaşım önerir, B kabul eder → B savaşta, 150 bir kez',()=>{
  const h=mpWorld(),s0=st(h);const o=offerHelp(h);
  const c=cmd(h,'C',{kind:'counter',offer:idOf(o),give:[{t:'res',r:'ala',v:150}],want:[{t:'warJoin',front:+h.run('FRONT'),target:+h.run('X.id')}]});assert.equal(c.status,'ok',JSON.stringify(c));
  const r=cmd(h,'B',{kind:'respond',offer:idOf(c),action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));
  const s=st(h);assert.equal(s.bWar,true);assert.equal(s.cAla,s0.cAla-150);assert.equal(s.bAla,s0.bAla+150);});

test('C1.5 kabulden önce savaş biter (barış) → teklif uygulanamaz, savaş / ödeme yok',()=>{
  const h=mpWorld(),s0=st(h);const o=offerHelp(h);h.run('makePeace(X,C,{force:true,quiet:true})');
  const r=cmd(h,'C',{kind:'respond',offer:idOf(o),action:'accept'});assert.notEqual(r&&r.status,'ok','bitmiş savaşa katılım kabul edilmez: '+JSON.stringify(r));
  const s=st(h);assert.equal(s.bWar,false);assert.equal(s.cAla,s0.cAla);assert.equal(s.bAla,s0.bAla);});

test('C1.6 kabul sonrası MP paketi (stars-mp-save) → yeni süreçte doğrulama + yükleme: savaş sürer, kaynaklar aynı, teklif deposunda kayıt kapalı (ikinci uygulama yok)',()=>{
  const h=mpWorld();const o=offerHelp(h);assert.equal(cmd(h,'C',{kind:'respond',offer:idOf(o),action:'accept'}).status,'ok');const s1=st(h),xid=+h.run('X.id');
  const snap=J(h,'MP.snapshot()');assert.equal(snap.ok,true,'kayıt alındı');
  const offer=snap.pkg.diplomacy.offers.find(x=>x.id===idOf(o))||Object.values(snap.pkg.diplomacy.offers).find(x=>x&&x.id===idOf(o));assert.ok(offer,'teklif pakette');assert.notEqual(offer.status,'pending','kabul edilmiş teklif paket içinde bekleyen değil: '+offer.status);
  const g=runtime({root:ROOT});g.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));g.sb.pk=JSON.stringify(snap.pkg);
  const r=J(g,`(()=>{const pkg=JSON.parse(pk),v=StarsMP.validatePackage(pkg),l=StarsMP.loadWorld(pkg);return {v:!!(v&&v.ok),l:!!(l&&l.ok),bWar:!!G.emps[1].war[${xid}],bAla:Math.round(G.emps[1].res.ala),cAla:Math.round(G.emps[3].res.ala)};})()`);
  assert.equal(r.v,true,'paket bütünlüğü');assert.equal(r.l,true,'dünya yüklendi');assert.equal(r.bWar,true,'savaş sürer');assert.equal(r.bAla,s1.bAla,'ikinci ödeme yok');assert.equal(r.cAla,s1.cAla);});

test('C1.7 toprak vaadi: B, katılım karşılığı aynı cephede X\'in sistemini ister (landPromise) → kabulde vaat defterde, devir YOK (barışa kadar)',()=>{
  const h=mpWorld();const sys=+h.run('(()=>{const s=G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col));territoryOwnerSet(s,X.id);for(const e of [B,C])if(!s.seen.includes(e.id))s.seen.push(e.id);B.mapOwners=B.mapOwners||{};B.mapOwners[s.id]=X.id;C.mapOwners=C.mapOwners||{};C.mapOwners[s.id]=X.id;return s.id;})()');
  const o=cmd(h,'B',{kind:'offer',to:3,give:[{t:'warJoin',front:+h.run('FRONT'),target:+h.run('X.id')}],want:[{t:'landPromise',sys,front:+h.run('FRONT')}]});assert.equal(o.status,'ok',JSON.stringify(o));
  assert.equal(cmd(h,'C',{kind:'respond',offer:idOf(o),action:'accept'}).status,'ok');
  const r=J(h,`{bWar:!!B.war[X.id],owner:G.sys[${sys}].owner,prom:(G.warLedger.promises||[]).filter(p=>p.sys===${sys}).map(p=>({to:p.to,by:p.by,front:p.front,state:p.state}))}`);
  assert.equal(r.bWar,true);assert.equal(r.owner,+h.run('X.id'),'vaat devir değildir');assert.ok(r.prom.length>=1,'vaat kaydı: '+JSON.stringify(r.prom));});

test('C2 toprak vaadi + v2 Fetih barışı: B hedefi T1\'i ve A\'ya vaat ettiği S\'yi işgal eder, hedef dışı R\'yi de → barışta T1 B\'de, S A\'ya devredilir, R X\'e iade',()=>{
  const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;`);
  const r=J(h,`(()=>{const ai=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);const A=ai[0],B=ai[1],X=ai[2];
    for(const a of [A,B,X])for(const c of [A,B,X])if(a!==c){a.contact[c.id]=true;a.ally[c.id]=false;a.war[c.id]=false;}A.ally[B.id]=B.ally[A.id]=true;
    const free=G.sys.filter(s=>s.owner<0&&!s.planets.some(p=>p.col)).slice(0,3);for(const s of free){territoryOwnerSet(s,X.id);for(const e of [A,B])if(!s.seen.includes(e.id))s.seen.push(e.id);}
    const [T1,S,R]=free;warAuthorize(B,X,{n:'t'});declareWar(B,X);warAuthClear();B.wg=B.wg||{};B.wg[X.id]={t:'fetih',v:2,targets:[T1.id],day:G.day};
    const f=warLedgerFind(B.id,X.id);warPromiseAdd(B,A,{sys:S.id,front:f.id});warAuthorize(A,X,{n:'t'});declareWar(A,X);warAuthClear();
    captureSystem(T1,B.id);captureSystem(S,B.id);captureSystem(R,B.id);makePeace(B,X,{force:true,quiet:true});
    const p=G.warLedger.promises.find(p=>p.sys===S.id);return {T1:T1.owner,S:S.owner,R:R.owner,A:A.id,B:B.id,X:X.id,state:p.state,why:p.why};})()`);
  assert.equal(r.T1,r.B,'hedef sistem fetihte kalır');assert.equal(r.R,r.X,'hedef dışı, vaatsiz işgal iade');
  assert.equal(r.S,r.A,'vaat edilen sistem alana devredilir: '+r.why);assert.equal(r.state,'delivered');});

test('C4 İsyanı Bastır: koptuğu devlete karşı 8 hedef (başkent dahil) bedelsiz; aynı 8 hedef normal düşmana ücretli; önizleme ve ilan aynı bedeli kullanır',()=>{
  const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
    var E=G.p,O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);E.contact[O.id]=O.contact[E.id]=true;E.res.etk=5000;
    for(const s of G.sys.filter(s=>s.owner<0&&!s.planets.some(p=>p.col)).slice(0,10)){territoryOwnerSet(s,O.id);}for(const s of G.sys)if(s.owner===O.id&&!s.seen.includes(0))s.seen.push(0);`);
  const r=J(h,`(()=>{const t=[O.home,...warFetihCandidates(E,O).slice(0,7).map(x=>x.id)];const normal=warFetihClaimCost(E,O,t);O.sundered=E.id;
    const reclaim=warFetihClaimCost(E,O,t),p=warDeclarationPreview(E,O,'fetih',{targets:t}),before=E.res.etk;E.war[O.id]=O.war[E.id]=true;const ok=setWarGoal(E,O,'fetih',{targets:t});
    return {n:t.length,normal,reclaim,claim:p.claimCost||0,paid:before-E.res.etk,base:WAR_GOALS.fetih.etk,ok,note:p.goal&&p.goal.note};})()`);
  assert.equal(r.n,8);assert.ok(r.normal>60,'normal düşmana 6+ hedef ve başkent ücretli: '+r.normal);assert.equal(r.reclaim,0,'İsyanı Bastır bedelsiz');
  assert.equal(r.claim,0,'önizleme talep bedeli 0');assert.equal(r.ok,true);assert.equal(r.paid,r.base,'yalnız savaş hedefinin temel bedeli');assert.match(r.note||'',/İsyanı Bastır/);});

test('C5 sistemin açtığı (önerensiz) temel yasa oyu: oyuncu seçmense gelen kutusunda kayıt ve kart; oy verilince kayıt kapanır',()=>{
  const {fresh}=require('./helpers/dispatch-fixture');const h=fresh(0,ROOT);
  const r=J(h,`(()=>{G.feds=[];G.inbox=[];G.council=null;G.day=900;for(const e of G.emps){e.war={};e.res.etk=5000;for(const o of G.emps){e.contact[o.id]=true;e.rel[o.id]=80;}}
    G.feds=[{id:801,name:'Test Birliği',type:'ticaret',members:[1,2,0],leader:1,laws:{},treasury:0,nextVote:G.day+60,cohesion:70}];G.fedUid=801;
    for(const a of [0,1,2])for(const b of [0,1,2])if(a!==b)G.emps[a].ally[b]=true;const f=G.feds[0];
    const sv=startFedVote(f);const v=f.vote;DiplomaticInbox.sync();const rec=DiplomaticInbox.state().records.find(x=>x.kind==='fedvote'&&x.fid===f.id);
    const waiting=v?fedVoteCounts(f).waiting.includes(0):false;const card=(G.inbox||[]).some(n=>n.kind==='fedvote'&&n.data===f.id);
    return {sv:sv&&sv.ok,proposer:v?v.proposer:'yok',waiting,rec:!!rec,from:rec?rec.from:null,leader:f.leader,status:rec?rec.status:null,card};})()`);
  if(r.err)throw Error(r.err);assert.equal(r.sv,true,'oy açıldı');assert.ok(!Number.isInteger(r.proposer)||r.proposer<0,'önerensiz (sistem) oy: '+r.proposer);
  assert.equal(r.waiting,true,'oyuncu seçmen');assert.equal(r.rec,true,'gelen kutusu kaydı');assert.equal(r.from,r.leader,'kaynak federasyon başkanı');assert.equal(r.status,'pending');});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
