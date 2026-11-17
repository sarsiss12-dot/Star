'use strict';
/* MP-SYNC-FED.0 S3 — kayıttan dönüş uyumluluğu (MP paketi, Node).
   R1 adayda (p38 + bu faz) kaydedilen paket: bekleyen Barıştırma onayı + açık federasyon oyu + gündem kuyruğu + tersane kuyruğu + bekleyen insan→insan
      teklifi → YENİ host (kayıtlı oyuna devam): hepsi aynı; yayın Barıştırma kaydını kapatmaz; oy / kuyruk devam eder; tersane öğesi tek
   R2 aynı paket ESKİ sürümde (STARS_OLD_ROOTS="p37:<kök>,p33:<kök>"): çökmeden reddedilir; neden kodu o sürümün kendi arayüz metnine (PKG_WHY) karşılık gelir
      (kullanıcı anlaşılır gerekçe görür). Kök verilmezse NOT RUN.
   R3 p33 kökünde (STARS_P33_ROOT) kaydedilen paket (açık federasyon oyu + bekleyen insan teklifi + tersane kuyruğu) adayda doğrulanır, yüklenir, yeni host
      kurulur; durumlar korunur, oy verilebilir. Kök verilmezse NOT RUN. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{runtime}=require('./helpers/runtime');
const CAND=path.resolve(__dirname,'..');
let pass=0,fail=0,notrun=0;const test=(n,f)=>{try{const r=f();if(r==='NOT RUN'){notrun++;console.log('NOT RUN '+n);return;}pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const roots=String(process.env.STARS_OLD_ROOTS||'').split(',').filter(Boolean).map(x=>{const i=x.indexOf(':');return {name:x.slice(0,i),dir:path.resolve(x.slice(i+1))};});
/* host + B(1) + C(3) + D(4); federasyon 0/1/3 (motorun kendi kuruluş yolu); B, D ile savaşta; C'nin B'de istihbaratı 3 */
function world(root,{peace=true}={}){const h=runtime({root});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'res0',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:23});
    for(const [c,e]of [['B',1],['C',3],['D',4]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}if(!MP.start().ok)throw Error('start');var seq={};
    G.day=900;G.council=null;G.feds=[];for(const e of G.emps){e.overlord=null;e.civics=[];e.mizac='militarist';e.factions=null;e.nap={};e.peaceAt={};}
    for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}e.intel={};}
    for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [0,1,2,3,4])G.emps[id].res[r]=5000;
    fedFoundPropose(G.p,'bilimsel','equal',[1,3]);fedFoundReply(G.emps[1],1,true);fedFoundReply(G.emps[3],1,true);if(!fedFoundFinish(G.p,1).ok)throw Error('found');var F=G.feds[0],laws=Object.keys(FED_LAWS).filter(k=>!F.laws[k]);
    for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}
    G.sys[G.emps[1].colonies[0].s].planets[G.emps[1].colonies[0].p].lux='ipek';for(const e of G.emps)if(!e.dead)refreshLuxury(e);
    G._dealAuth=true;declareWar(G.emps[1],G.emps[4]);G._dealAuth=false;G.emps[3].intel[1]=3;`);return h;}
function cmd(h,c,x){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:'res0'+c+String(s).padStart(6,'0'),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result')||{};}
/* tam durum: açık oy (B oy verdi), gündemde C'nin önerisi, B'nin tersane öğesi, D→C bekleyen teklif; peace: C aracılığıyla B kabul etti → Barıştırma onayı D'de bekliyor */
function fill(h,{peace=true}={}){
  if(!h.run('proposeFedLaw(G.p,laws[0]).ok'))throw Error('active vote');
  assert.equal(cmd(h,'B',{kind:'fedVote',fed:h.run('F.id'),token:h.run('fedVoteToken(F.vote)'),yes:true}).status,'ok');
  assert.equal(cmd(h,'C',{kind:'fedLaw',law:h.run('laws[1]')}).status,'ok');
  const home=h.run('G.emps[1].home'),cls=h.run(`Object.keys(SHIPS).find(k=>SHIPS[k].c&&!SHIPS[k].req)||'kor'`);
  const sh=cmd(h,'B',{kind:'ship',sys:home,key:cls});assert.equal(sh.status,'ok','tersane '+JSON.stringify(sh));
  const dc=cmd(h,'D',{kind:'offer',to:3,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]});assert.equal(dc.status,'ok','D→C '+JSON.stringify(dc));
  let O=null;if(peace){const f=h.run('peaceWithFront(G.emps[1],G.emps[4])');const r0=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:300}],want:[{t:'lux',k:'ipek'},{t:'peaceWith',target:4,front:f}]});assert.equal(r0.status,'ok',JSON.stringify(r0));
    O=J(h,'MP.dip.offers.at(-1)');assert.equal(cmd(h,'B',{kind:'respond',offer:O.id,action:'accept'}).status,'ok');O=J(h,`MP.dip.offers.find(x=>x.id===${O.id})`);assert.equal(O.status,'mediating');}
  return {O,home,cls};}
const state=h=>J(h,`({tok:F.vote&&fedVoteToken(F.vote),yes:F.vote&&F.vote.yes.slice(),agenda:(F.agenda?F.agenda.items:[]).map(r=>[r.id,r.by,r.law]),q:G.sys[G.emps[1].home].queue.filter(q=>q.e===1).map(q=>[q.cls,q.left]),
  offers:MP.dip.offers.map(o=>[o.id,o.from,o.to,o.status,o.med?o.med.link:0]),war:!!G.emps[1].war[4]})`);
function cold(pkg,root=CAND){const b=runtime({root});b.sb.pkg=pkg;b.sb.out=[];b.sb.rand=k=>'ab'.repeat(k);b.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));b.run(fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error('validate:'+valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();var F=G.feds[0];`);return b;}

test('R1 aday paketi → yeni host: Barıştırma onayı, açık oy, gündem, tersane, bekleyen teklif korunur (son onayın yeni host\'ta tek kez uygulanışı: mp_sync_fed0_peacewith W4)',()=>{
  const a=world(CAND);const {O}=fill(a);const before=state(a);a.run('var pkg=MP.snapshot({}).pkg;');const b=cold(J(a,'pkg'));
  assert.deepEqual(state(b),before,'yeni host aynı durumu taşır');
  const L=J(b,`MP.dip.offers.find(x=>x.id===${O.med.link})`);assert.equal(L.status,'pending');assert.equal(L.to,4,'onay D\'de');
  /* yeni host'ta D yeniden bağlanmadan önce süpürme (yayın) durumu bozmaz */
  b.run('MP.publish&&MP.publish();');assert.equal(J(b,`MP.dip.offers.find(x=>x.id===${O.id}).status`),'mediating','yayın asıl kaydı kapatmaz (şartlar geçerli)');
  /* tersane öğesi tek; kuyrukta ikinci ödeme yok */
  assert.equal(J(b,'G.sys[G.emps[1].home].queue.filter(q=>q.e===1).length'),before.q.length);
  /* oy yeni host'ta tamamlanır, sıradaki gündem açılır; B ikinci kez oy veremez */
  assert.equal(b.run(`castFedVote(G.emps[1],F.id,'${before.tok}',true).ok`),false);
  b.run(`castFedVote(G.emps[3],F.id,fedVoteToken(F.vote),true);if(F.vote&&fedVoteToken(F.vote)==='${before.tok}')castFedVote(G.p,F.id,fedVoteToken(F.vote),true);`);
  assert.equal(b.run('F.vote&&F.vote.law'),before.agenda[0][2],'sıradaki gündem açıldı');});

test('R2 bekleyen Barıştırma içeren aday paketi eski sürümde çökmeden ve anlaşılır gerekçeyle reddedilir',()=>{
  if(!roots.length)return 'NOT RUN';const a=world(CAND);fill(a);a.run('var pkg=MP.snapshot({}).pkg;');const pkg=J(a,'pkg');const out=[];
  for(const r of roots){const h=runtime({root:r.dir});h.sb.pkg=JSON.stringify(pkg);h.run(fs.readFileSync(path.join(r.dir,'research/mp0/mp-core.js'),'utf8'));
    const v=J(h,'StarsMP.validatePackage(pkg)');const src=fs.readFileSync(path.join(r.dir,'research/mp1/client/mp1-host.js'),'utf8');const m=src.match(/const PKG_WHY=(\{[\s\S]*?\});/);
    const W=m?Function('return '+m[1])():{};const text=v.ok?null:(W[v.why]||null);out.push({root:r.name,ok:v.ok,why:v.why,text});
    assert.equal(v.ok,false,r.name+': eski sürüm yeni paketi kabul etmemeli');assert(text,r.name+': gerekçe kodunun arayüz metni var ('+v.why+')');}
  console.log('  R2 '+JSON.stringify(out));});

test('R3 p33 kökünde üretilen MP paketi adayda açılır: açık oy, bekleyen teklif, tersane kuyruğu korunur; oy verilebilir',()=>{
  const P33=process.env.STARS_P33_ROOT;if(!P33)return 'NOT RUN';const a=world(path.resolve(P33));fill(a,{peace:false});const before=state(a);a.run('var pkg=MP.snapshot({}).pkg;');const pkg=J(a,'pkg');
  assert.equal(pkg.build,'96h10p33','paket gerçekten p33 sürümüyle üretildi');const b=cold(pkg);
  const after=state(b);assert.deepEqual(after,before,'p33 paketi adayda aynı durum');
  b.run(`castFedVote(G.emps[3],F.id,fedVoteToken(F.vote),true);if(F.vote&&fedVoteToken(F.vote)==='${before.tok}')castFedVote(G.p,F.id,fedVoteToken(F.vote),true);`);
  assert.equal(b.run('F.lastVote&&F.lastVote.law'),J(a,'F.vote.law'),'p33 oyu adayda sonuçlandı');
  console.log('  R3 build '+pkg.build+' → aday; teklif '+before.offers.length+', kuyruk '+before.q.length+', gündem '+before.agenda.length);});

console.log(`GEÇEN: ${pass} KALAN: ${fail}${notrun?' NOT RUN: '+notrun:''}`);if(fail)process.exitCode=1;
