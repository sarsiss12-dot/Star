'use strict';
/* TİCARET-SON-EKSİKLER.0 — MP çok taraflı transit onayı (Node, gerçek mp-core komutları + ayna; Chromium değil).
   Düzen: host = devlet 0 (insan), misafir B = 1, misafir C = 3. Ayrılmış 10 sistemlik zincir s0…s9 (≤3 sıçrama kuralıyla ara limanlar şart).
   P1 AI X (s0) ↔ AI Y (s9) ticareti, ara limanlar C (s3) ve B (s6): iki ayrı insan sahibe talep; ayna yalnız taraflara, şart miktarları gitmez
   P2 B'nin oyu: aynı cid tekrarı önbellekten, farklı cid ikinci oy reddedilir, taraf olmayan / talep etmeyen geri çekemez, sahte devlet reddedilir
   P3 C onaylar → dört izin, her sahibe +72, X–Y sözleşmesi tek; C reddederse (P4) hiçbir izin / ödeme yok
   P5 B onayından sonra MP paketi → yeni host: aynı onay durumu, C'nin onayı yeni host'ta bir kez uygular (kopma / yeni oda)
   P6 host A (s0) ile misafir B (s6) arasında, C'nin limanı (s3) üzerinden insan başlatmalı koridor: B'nin ödeme onayı + C'nin liman onayı */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function mpWorld(kind){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));h.sb.KIND=kind;
  h.run(`var MP=StarsMP.createHost({roomId:'tse0',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e]of [['B',1],['C',3]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};
    var A=G.emps[0],B=G.emps[1],C=G.emps[3],ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&![0,1,3].includes(o.id)),X=ais[0],Y=ais[1],Z=ais[2];
    for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.war[b.id]=false;a.ally[b.id]=false;a.rel[b.id]=60;(a.intel||={})[b.id]=3;(a.mem||={})[b.id]=[{v:60,d:G.day,k:'t'}];if(a.nap)delete a.nap[b.id];if(a.embargo)delete a.embargo[b.id];}
    for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k],400);
    const tpl=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
    const free=G.sys.filter(s=>s.planets.length&&!s.planets.some(p=>p.col)&&s.owner<0).slice(0,10);if(free.length<10)throw Error('fikstür');
    const ids=new Set(free.map(s=>s.id));for(const s of G.sys)s.lanes=s.lanes.filter(x=>!ids.has(x));
    free.forEach((s,i)=>{s.lanes=[];s.x=-40000+i*90;s.y=-40000;s.cr=0;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();});for(let i=0;i<9;i++){free[i].lanes.push(free[i+1].id);free[i+1].lanes.push(free[i].id);}
    function port(e,s){const p=s.planets[0];p.owner=e.id;p.col=JSON.parse(JSON.stringify(tpl));p.col.e=e.id;p.col.b={liman:1};p.col.pop=120;p.col.q=[];e.colonies.push({s:s.id,p:0});s.owner=e.id;}
    var S=free.map(s=>s.id);
    if(KIND==='ai'){port(X,free[0]);port(C,free[3]);port(B,free[6]);port(Y,free[9]);(X.pact||={})[Y.id]=(Y.pact||={})[X.id]=true;
      X.res.min=20;X.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};X.res.ene=600;Y.res.min=600;Y.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};Y.res.ene=20;}
    else{port(A,free[0]);port(C,free[3]);port(B,free[6]);}
    Commerce.state();`);return h;}
function cmd(h,c,x,cid){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:cid||'tse'+c+String(s).padStart(6,'0'),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result');}
const ST=h=>J(h,`({etk:Object.fromEntries([A,B,C,X,Y].map(e=>[e.id,Math.round(e.res.etk)])),pt:Object.fromEntries([A,B,C].map(e=>[e.id,Object.keys(e.portTransit||{}).filter(k=>e.portTransit[k]>G.day).map(Number).sort((a,b)=>a-b)])),
  tx:(G.commerce.transit||[]).map(t=>({st:t.st,votes:t.votes})),k:G.commerce.contracts.filter(c=>!Commerce.closed(c)).length})`);
const aiAsk=h=>J(h,'(()=>{const bud={routes:96};return !!Commerce.aiTransitRequest(X,Y,Commerce.aiBalance(X),Commerce.aiBalance(Y),bud);})()');

test('P1 AI koridoru iki ayrı insan limanından geçer: talep iki misafire ayrı oy; ayna yalnız taraflara, AI şart miktarları gitmez',()=>{
  const h=mpWorld('ai');assert.equal(aiAsk(h),true,'talep açıldı');const s=ST(h);assert.equal(s.tx.length,1);assert.deepEqual(s.tx[0].votes,{1:'pending',3:'pending'});
  const mB=J(h,'StarsMirror.build(1,{cosmeticSeed:1,log:[],news:[]}).commerce.transit'),mZ=J(h,'StarsMirror.build(Z.id,{cosmeticSeed:1,log:[],news:[]}).commerce.transit||null');
  assert.equal(mB.length,1);assert.equal(mB[0].votes['0'],'pending','misafir kendi oyunu 0 kimliğiyle görür');assert.equal(mB[0].trade,1);assert.equal(mB[0].terms,undefined,'şart miktarları gitmez');
  assert.equal(mZ,null,'taraf olmayana gitmez');assert.equal(Object.values(s.pt).flat().length,0,'onaydan önce izin yok');});
test('P2 B oyu: aynı cid önbellekten, farklı cid ikinci oy reddedilir; geri çekme / sahte devlet reddedilir; onaydan sonra hâlâ izin yok',()=>{
  const h=mpWorld('ai');aiAsk(h);const e0=ST(h).etk;const r1=cmd(h,'B',{kind:'transitVote',id:1,yes:true},'tseBdup0001');assert.equal(r1.status,'ok',JSON.stringify(r1));
  h.sb.message=JSON.stringify({v:1,type:'cmd',seq:50,cid:'tseBdup0001',cmd:{kind:'transitVote',id:1,yes:true}});const n=h.sb.out.length;h.run(`MP.onMessage('B',message)`);
  const dup=h.sb.out.slice(n).map(([to,t])=>JSON.parse(t)).find(m=>m.type==='result');assert.equal(dup.dup,1,'aynı cid önbellekten');
  const r2=cmd(h,'B',{kind:'transitVote',id:1,yes:true});assert.notEqual(r2.status,'ok','ikinci oy');
  assert.notEqual(cmd(h,'B',{kind:'transitCancel',id:1}).status,'ok','talep etmeyen geri çekemez');
  const forged=(()=>{const n2=h.sb.out.length;h.sb.message=JSON.stringify({v:1,type:'cmd',seq:90,empire:3,cid:'tseBforge01',cmd:{kind:'transitVote',id:1,yes:true}});h.run(`MP.onMessage('B',message)`);return h.sb.out.slice(n2).map(([to,t])=>JSON.parse(t)).find(m=>m.type==='result');})();
  assert.equal(forged.status,'rejected');assert.match(String(forged.code),/forged/);const s=ST(h);assert.deepEqual(s.tx[0].votes,{1:'yes',3:'pending'});assert.deepEqual(s.etk,e0);assert.equal(Object.values(s.pt).flat().length,0);});
test('P3 C onaylar → iki sahibin dört izni, her sahibe +72, taşıyıcılardan −72, tek X–Y sözleşmesi',()=>{
  const h=mpWorld('ai');aiAsk(h);const s0=ST(h);cmd(h,'B',{kind:'transitVote',id:1,yes:true});const r=cmd(h,'C',{kind:'transitVote',id:1,yes:true});assert.equal(r.status,'ok',JSON.stringify(r));
  const s=ST(h),x=h.run('X.id'),y=h.run('Y.id');assert.equal(s.tx[0].st,'committed');assert.deepEqual(s.pt[1],[x,y].sort((a,b)=>a-b));assert.deepEqual(s.pt[3],[x,y].sort((a,b)=>a-b));
  assert.equal(s.etk[1]-s0.etk[1],72);assert.equal(s.etk[3]-s0.etk[3],72);assert.equal(s.etk[x]-s0.etk[x],-72);assert.equal(s.etk[y]-s0.etk[y],-72);assert.equal(s.k,1);
  assert.notEqual(cmd(h,'C',{kind:'transitVote',id:1,yes:true}).status,'ok','uygulanan talep yeniden onaylanamaz');});
test('P4 C reddeder → talep reddedildi, kısmi izin / ödeme yok (B önceden onaylamıştı)',()=>{
  const h=mpWorld('ai');aiAsk(h);const s0=ST(h);cmd(h,'B',{kind:'transitVote',id:1,yes:true});const r=cmd(h,'C',{kind:'transitVote',id:1,yes:false});assert.equal(r.status,'ok');
  const s=ST(h);assert.equal(s.tx[0].st,'rejected');assert.deepEqual(s.etk,s0.etk);assert.equal(Object.values(s.pt).flat().length,0);assert.equal(s.k,0);});
test('P5 B onayından sonra MP paketi → yeni host: aynı onay durumu; C\'nin onayı yeni host\'ta bir kez uygular, eski host\'ta oy yok',()=>{
  const h=mpWorld('ai');aiAsk(h);cmd(h,'B',{kind:'transitVote',id:1,yes:true});const snap=J(h,'MP.snapshot()');assert.equal(snap.ok,true);
  const g=runtime({root:ROOT});g.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));g.sb.pk=JSON.stringify(snap.pkg);
  const v=J(g,`(()=>{const p=JSON.parse(pk);const v=StarsMP.validatePackage(p);if(!v.ok)return v;StarsMP.loadWorld(p);return {ok:true};})()`);assert.equal(v.ok,true,JSON.stringify(v));
  assert.equal(g.run('JSON.stringify(G.commerce.transit)'),h.run('JSON.stringify(G.commerce.transit)'),'onay kaydı birebir');
  const r=J(g,'(()=>{globalThis.__mpHumanVoter=id=>id===1||id===3;const e0=G.emps[3].res.etk;const a=Commerce.transitVote(G.emps[3],1,true),b=Commerce.transitVote(G.emps[3],1,true);return {a,b,d:G.emps[3].res.etk-e0};})()');
  assert.equal(r.a.st,'committed');assert.equal(r.b.ok,false);assert.equal(r.d,72,'tek ödeme');});
test('P6 host A ↔ misafir B koridoru C limanından: B ödeme onayı + C liman onayı; sırayla, son onayda tek işlem',()=>{
  const h=mpWorld('human');const s0=ST(h);const r=J(h,'Commerce.transitAsk(A,B,S[0],S[6])');assert.equal(r.st,'pending',JSON.stringify(r));
  assert.deepEqual(ST(h).tx[0].votes,{1:'pending',3:'pending'},'B (ödeyen) ve C (sahip) ayrı onay');
  assert.equal(cmd(h,'C',{kind:'transitVote',id:1,yes:true}).status,'ok');let s=ST(h);assert.equal(s.tx[0].st,'pending');assert.deepEqual(s.etk,s0.etk,'B onaylamadan ödeme yok');
  assert.equal(cmd(h,'B',{kind:'transitVote',id:1,yes:true}).status,'ok');s=ST(h);assert.equal(s.tx[0].st,'committed');assert.deepEqual(s.pt[3],[0,1]);
  assert.equal(s.etk[0]-s0.etk[0],-36);assert.equal(s.etk[1]-s0.etk[1],-36);assert.equal(s.etk[3]-s0.etk[3],72);
  const mC=J(h,'StarsMirror.build(3,{cosmeticSeed:1,log:[],news:[]}).commerce.transit[0]');assert.equal(mC.st,'committed');assert.ok(mC.done!==undefined);});
test('P7 misafir aynası (bekleyen + sonuçlanmış talep) misafir çalışma zamanında motorun deserialize doğrulamasından geçer',()=>{
  const h=mpWorld('ai');aiAsk(h);cmd(h,'B',{kind:'transitVote',id:1,yes:true});
  for(const id of [1,3]){const m=h.run(`JSON.stringify(StarsMirror.build(${id},{cosmeticSeed:1,log:[],news:[]}))`);const g=runtime({root:ROOT});g.sb.M=m;
    assert.equal(g.run('deserialize(M)'),true,'ayna yüklendi '+id);const t=J(g,'G.commerce.transit');assert.equal(t.length,1);assert.equal(t[0].votes['0'],id===1?'yes':'pending');}
  cmd(h,'C',{kind:'transitVote',id:1,yes:false});const m=h.run('JSON.stringify(StarsMirror.build(3,{cosmeticSeed:1,log:[],news:[]}))');const g=runtime({root:ROOT});g.sb.M=m;assert.equal(g.run('deserialize(M)'),true);assert.equal(J(g,'G.commerce.transit[0].st'),'rejected');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
