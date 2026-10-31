'use strict';
/* MP.6.3 — ortak savaş ganimeti paylaşımı, uzak insan katılımcılarla. Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI.
   Uzak insanlar A=1 (sefer dışı), B=3 (host'un savaş ortağı); AI ortak M=4; düşman T=2.
   FİKSTÜR (faz92b ile aynı yol, açıkça): temas + keşif; host T'ye savaş ilan eder, B ve M motorun 'warOn' anlaşmasıyla katılır;
   T'nin dört boş sistemi kurulup captureSystem ile ele geçirilir (host 1, B 2, M 1); üç cephe makePeace ile kapanır.
   Kanıtlanan: uzak insan AI sanılmaz (otomatik oy yok), oyunu yalnız kendisi verir, ret hakkı korunur, onayı olmadan devir yok;
   yalnız katılımcı görür; eski taslak reddedilir; aynı devir iki kez uygulanmaz; MP.4 kayıt/yükleme sonrası sürer; Save8/RNG. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const A=1,B=3,M=4,T=2;let metricsNote=null;
const FIX=`for(const e of G.emps){if(e.wild)continue;e.war={};e.ally={};e.res.etk=Math.max(e.res.etk,1000);for(const o of G.emps)if(!o.wild)e.contact[o.id]=true;}
  for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
  var P=G.p,Bp=G.emps[${B}],Tt=G.emps[${T}],Mm=G.emps[${M}];
  declareWar(P,Tt);executeDeal({from:${B},to:0,give:[{t:'warOn',target:${T}}],want:[]});executeDeal({from:${M},to:0,give:[{t:'warOn',target:${T}}],want:[]});
  var land=G.sys.filter(s=>!s.planets.some(p=>p.col)).slice(0,4);land.forEach((s,i)=>{s.owner=${T};captureSystem(s,[0,${B},${B},${M}][i]);});
  var campaign=warLedgerFind(0,${T}).campaign;makePeace(P,Tt);if(Bp.war[${T}])makePeace(Bp,Tt);if(Mm.war[${T}])makePeace(Mm,Tt);`;
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.sb.__hn=[];h.run(MIR);h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r63s',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},hostNotify:(m,c)=>__hn.push(m),
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cB'?'Bora':'Ada'}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${FIX};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function cmd(h,who,c){const conn=who===A?'cA':'cB',s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  return msg(h,conn,{v:1,type:'cmd',seq:s,cid:'m63s'+conn+String(s).padStart(5,'0'),cmd:c}).find(m=>m.type==='result');}
/* MP.2 görünümü (snapshot/delta ile giden): host'un viewFor'u — misafirin aldığıyla aynı nesne */
const view=(h,conn)=>{h.run('MP.publish()');const e=conn==='cA'?A:B;return J(h,`MP.viewFor(G.emps[${e}])`);};
const notes=(h,id)=>J(h,`MP.viewFor(G.emps[${id}]).log.map(n=>n.m)`);
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const offer=h=>J(h,'G.settlements.offers.at(-1)');

test('motor bulgusu ve koruma: AI ortağın önerisinde uzak insan adına OTOMATİK OY YOK (motor yalnız devlet 0\'ı atlıyordu); AI ortağın kendi değerlendirmesi kalır; RNG tüketilmez',()=>{
  const src=fs.readFileSync(path.join(root,'diplomacy.js'),'utf8');assert(src.includes('if(id===e.id||id===0)continue; // oyuncunun oyu hiçbir koşulda otomatik değil'),'engine text (guard anchor) unchanged');
  /* kontrol: korumasız motor (yalnız motor + aynı fikstür) uzak insanın yerine settlementOpinion oyu yazar */
  const c=runtime({root});c.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.emps[${A}].ai=false;G.emps[${B}].ai=false;${FIX};var q=settlementPreview(Mm,campaign);var r=settlementSubmit(Mm,campaign,q.stamp)`);
  assert.equal(J(c,'G.settlements.offers[0].votes.some(v=>v.by===3)'),true,'control: unguarded engine writes an automatic vote for the remote human');
  const h=world();const r0=h.run('RND_STATE');
  const r=J(h,'(()=>{const q=settlementPreview(Mm,campaign);return settlementSubmit(Mm,campaign,q.stamp);})()');assert.equal(r.ok,true);
  const o=offer(h);assert.deepEqual(o.votes.map(v=>v.by),[M],'only the AI proposer voted; host (0) and remote human (3) did not');assert.equal(o.state,'pending');
  assert.equal(h.run('RND_STATE'),r0,'no RNG consumed');
  h.run('MP.publish()');assert(notes(h,B).some(m=>/Ortak savaş paylaşımı önerildi/.test(m)),'B is told in its own list');
  assert(h.sb.__hn.some(m=>/Ortak savaş paylaşımı önerildi/.test(m)),'host is told too');
});
test('aylık gündem: AI önerir ama insan katılımlı teklifi KENDİ uygulamaz; uzak insan önerici olmaz',()=>{
  const h=world();const r=J(h,'settlementAgendaTick()');const o=J(h,'G.settlements.offers');
  assert(o.every(x=>x.proposer!==B),'remote human never auto-proposes');assert(o.every(x=>!x.votes.some(v=>v.by===B)),'no automatic vote for B');
  assert.equal(r.applied,0,'never auto-applied while a human is a member');
});
test('yalnız katılımcı görür: A (sefer dışı) için taslak/teklif yok, komutları "yok" (no-offer); B görünümünde teklif + taslak; damga ve mizaç gitmez',()=>{
  const h=world();let vA=view(h,'cA'),vB=view(h,'cB');
  assert.deepEqual(vA.settle,{offers:[],drafts:[]});assert.deepEqual(vB.settle.drafts,[J(h,'campaign')]);
  assert.equal(cmd(h,A,{kind:'settleQuote',campaign:J(h,'campaign'),assign:null}).code,'no-offer');
  h.run('(()=>{const q=settlementPreview(Mm,campaign);settlementSubmit(Mm,campaign,q.stamp);})()');const id=offer(h).id;
  for(const k of ['settleVote','settleApply','settleWithdraw'])assert.equal(cmd(h,A,{kind:k,offer:id,...(k==='settleVote'?{yes:true}:{})}).code,'no-offer',k);
  vA=view(h,'cA');vB=view(h,'cB');assert.deepEqual(vA.settle.offers,[]);assert.equal(vB.settle.offers.length,1);
  const t=JSON.stringify(vB.settle);assert(!t.includes('"protocol"')&&!t.includes('persona')&&!t.includes('"stamp":"{'),'raw stamp / personas never sent');
  assert(!JSON.stringify(vA).includes('Ortak savaş'),'A gets no notice');
});
test('B kendi oyunu verir: EVET yalnız B adına; ikinci oy reddedilir; host oyu gelince oybirliği → B UYGULA → devir bir kez; ikinci uygulama reddedilir',()=>{
  const h=world();h.run('(()=>{const q=settlementPreview(Mm,campaign);settlementSubmit(Mm,campaign,q.stamp);})()');const o0=offer(h);
  assert.equal(cmd(h,B,{kind:'settleVote',offer:o0.id,yes:true}).status,'ok');let o=offer(h);assert.deepEqual(o.votes.map(v=>v.by),[M,B]);assert.equal(o.state,'pending','host has not voted');
  assert.equal(cmd(h,B,{kind:'settleVote',offer:o0.id,yes:true}).code,'rules:engine','duplicate vote refused');
  assert.equal(cmd(h,B,{kind:'settleApply',offer:o0.id}).code,'rules:engine','no transfer before every approval');
  const owners0=J(h,'land.map(s=>s.owner)');
  assert.equal(J(h,`MP.local({kind:'settleVote',offer:${o0.id},yes:true}).ok`),true,'host votes for itself (host.local, same rules)');o=offer(h);assert.equal(o.state,'approved');
  h.run('MP.publish()');assert(notes(h,B).some(m=>/oybirliğiyle onaylandı/.test(m)));
  const s0=st(h);const bad=cmd(h,A,{kind:'settleApply',offer:o0.id});assert.equal(bad.code,'no-offer');assert.deepEqual(st(h),s0,'refused command: Save8 and RNG unchanged');
  assert.equal(cmd(h,B,{kind:'settleApply',offer:o0.id}).status,'ok');o=offer(h);assert.equal(o.state,'applied');assert.equal(o.receipt.by,B);
  const owners1=J(h,'land.map(s=>s.owner)');assert.deepEqual(owners1,J(h,'land.map(s=>G.settlements.offers.at(-1).rows.find(r=>r.sys===s.id).to)'),'ownership = the approved rows');
  metricsNote={before:owners0,after:owners1};
  assert.equal(cmd(h,B,{kind:'settleApply',offer:o0.id}).code,'rules:engine','second application refused');assert.deepEqual(J(h,'land.map(s=>s.owner)'),owners1,'no double transfer');
  h.run('MP.publish()');assert(notes(h,B).some(m=>/tamamlandı — \d+ devir/.test(m)),'B: own result notice');
});
test('B önerir: host taslağı (settleQuote) → eski damga "stale" → doğru damgayla sun; oyu B\'nin; AI ortak kendi değerlendirmesiyle; B\'nin alıcı değişikliği motor önizlemesinden',()=>{
  const h=world();const c=J(h,'campaign');
  const q=cmd(h,B,{kind:'settleQuote',campaign:c,assign:null});assert.equal(q.status,'ok');const out=q.extra;assert.equal(out.ok,true);assert.match(out.stamp,/^[0-9a-f]{16}$/);
  assert.deepEqual(out.members,[0,B,M]);assert.equal(out.rows.length,4);
  const k=out.rows[0].key,a={};for(const r of out.rows)a[r.key]=r.to;a[k]=M;
  const q2=cmd(h,B,{kind:'settleQuote',campaign:c,assign:a}).extra;assert.equal(q2.rows[0].to,M,'engine preview with B\'s assignment');assert.equal(q2.stamp,out.stamp,'same campaign stamp');
  assert.equal(cmd(h,B,{kind:'settleSubmit',campaign:c,stamp:'0000000000000000',assign:a}).code,'rules:stale','old draft revalidated on the host');
  assert.equal(cmd(h,B,{kind:'settleSubmit',campaign:c,stamp:out.stamp,assign:a}).status,'ok');
  const o=offer(h);assert.equal(o.proposer,B);assert.equal(o.rows[0].to,M);assert.deepEqual(o.votes.map(v=>v.by).sort(),[B,M].sort(),'B (proposer) + AI M opinion; host not');
  assert.equal(cmd(h,B,{kind:'settleSubmit',campaign:c,stamp:out.stamp,assign:a}).code,'rules:engine','second open offer for the same side refused');
});
test('ret hakkı ve geri çekme: B reddeder → teklif reddedildi, host artık oy veremez; geri çekmeyi yalnız önerici yapar',()=>{
  const h=world();h.run('(()=>{const q=settlementPreview(Mm,campaign);settlementSubmit(Mm,campaign,q.stamp);})()');const id=offer(h).id;
  assert.equal(cmd(h,B,{kind:'settleWithdraw',offer:id}).code,'rules:engine','B is not the proposer');
  assert.equal(cmd(h,B,{kind:'settleVote',offer:id,yes:false}).status,'ok');assert.equal(offer(h).state,'rejected');
  assert.equal(J(h,`MP.local({kind:'settleVote',offer:${id},yes:true}).ok`),false);
  h.run('MP.publish()');assert(notes(h,B).some(m=>/reddedildi/.test(m)));
  const c=J(h,'campaign'),q=cmd(h,B,{kind:'settleQuote',campaign:c,assign:null}).extra;assert.equal(cmd(h,B,{kind:'settleSubmit',campaign:c,stamp:q.stamp,assign:null}).status,'ok');
  const id2=offer(h).id;assert.equal(cmd(h,B,{kind:'settleWithdraw',offer:id2}).status,'ok');assert.equal(offer(h).state,'withdrawn');
});
test('görünmeyen toprak: satır kimliği maskelenir (h<n>, sistem yok); B bu durumda kabul edemez (motor: keşif gerekli)',()=>{
  const h=world();h.run(`land[0].seen=land[0].seen.filter(id=>id!==${B});land[0].surv=land[0].surv.filter(id=>id!==${B});`);
  h.run('(()=>{const q=settlementPreview(Mm,campaign);settlementSubmit(Mm,campaign,q.stamp);})()');const id=offer(h).id;
  const v=view(h,'cB').settle.offers[0];const hid=v.rows.filter(r=>!r.vis);assert.equal(hid.length,1);assert.deepEqual([hid[0].sys,hid[0].planet,hid[0].why],[-1,null,'']);assert.match(hid[0].key,/^h\d+$/);
  assert(!JSON.stringify(v).includes('"s:'+J(h,'land[0].id')+'"'),'hidden system key not sent');
  const r=cmd(h,B,{kind:'settleVote',offer:id,yes:true});assert.equal(r.code,'rules:engine');assert.match(r.detail[0],/keşif/);
  assert.equal(cmd(h,B,{kind:'settleVote',offer:id,yes:false}).status,'ok','rejection stays possible');
});
test('MP.4 kayıt/yükleme: bekleyen teklif Save8 ile kalır; yeni süreçte B aynı devlete döner ve KENDİ oyunu verir; süre uzamaz',()=>{
  const h=world();h.run('(()=>{const q=settlementPreview(Mm,campaign);settlementSubmit(Mm,campaign,q.stamp);})()');const o0=offer(h);
  const tB=h.sb.__out.filter(([c,t])=>c==='cB'&&t.includes('"type":"assign"')).map(([,t])=>JSON.parse(t)).at(-1).token;
  const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);
  const g=runtime({root});g.sb.__rand=rnd(500);g.sb.__out=[];g.sb.__text=text;g.run(MIR);g.run(CORE);
  assert.equal(J(g,`(()=>{var V=StarsMP.validatePackage(__text);if(!V.ok)return V;var LW=StarsMP.loadWorld(V.pkg);if(!LW.ok)return LW;
    globalThis.MP=StarsMP.createHost({roomId:'r63r',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();globalThis.seq={};return {ok:true};})()`).ok,true);
  msg(g,'cB',{v:1,type:'hello',name:'Bora',token:tB});assert.equal(J(g,'MP.resumeStart().ok'),true);
  const o=J(g,'G.settlements.offers.at(-1)');assert.deepEqual([o.id,o.state,o.expires],[o0.id,'pending',o0.expires],'offer survives, expiry unchanged');
  const v=view(g,'cB');assert.equal(v.settle.offers[0].id,o0.id);
  assert.equal(cmd(g,B,{kind:'settleVote',offer:o0.id,yes:true}).status,'ok');assert.deepEqual(J(g,'G.settlements.offers.at(-1).votes.map(v=>v.by)'),[M,B]);
  g.run('G.day=G.settlements.offers.at(-1).expires+1;settlementTick()');assert.equal(J(g,'G.settlements.offers.at(-1).state'),'expired','180-day life is the engine\'s');
  assert.equal(J(g,`MP.local({kind:'settleVote',offer:${o0.id},yes:true}).ok`),false);
});
end();
