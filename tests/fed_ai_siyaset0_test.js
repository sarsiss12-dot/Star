'use strict';
/* FED-AI-SİYASET.0 — kontrollü vakalar (gerçek çalışma zamanı; STARS_ROOT=<kök> eski sürümü koşar, p55'te yeni vakalar FAIL beklenir).
   Fikstür: orta / 5 AI / tohum 22. F = federasyon (foundFederation ile aynı nesne yapısı), lider L, üyeler A, B, C (AI); üyelik 800 gün önce.
   F3  uyumlu üye: 24 değerlendirmede ayrılma ve reform önergesi yok
   F4a uyumsuz üye (tercih edilen türün uyumu ≥0,35 fazla), destek yok, alternatif blok var → sabır sayacı dolunca anayasaya uygun ayrılış
   F4b aynı üye, yaşayabilir alternatif yok → ayrılmaz (sayaç dolsa da)
   F4c uyumsuz üye, diğer üyelerin yarısı da aynı türü tercih ediyor → üye REFORM ÖNERGESİ açar (mevcut oylama), ayrılmaz
   F4d reform oylamada reddedilmiş (lastVote) → çözülemeyen uyumsuzluk → sayaç işler
   F5  lider üye yolundan önergede bulunmaz; insan üye adına AI önergesi / ayrılma yok
   F6  ekonomik krizdeki üye pahalı yasaya gerekçeli düşük oy verir (mevcut aiFedVoteAssessment)
   T1  fiziksel varış temas kurar; T2 keşfedilmemiş uzak devletle temas yok
   T3  bilinen (sensör menzilindeki) ama hiç girilmemiş korsan yuvası güçlü AI filosunun av hedefi olur (p55: yalnız "seen")
   T5  AI'ın bilmediği (görülmemiş, istihbaratta olmayan) yuva av listesine girmez */
const assert=require('assert/strict'),path=require('path');const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(O={}){const h=runtime({root:ROOT});h.sb.OPT=JSON.stringify(O);h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:true});setupGame({...CFG});G.autoSave=false;
 var OPT=JSON.parse(OPT),ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!isPurifier(o)),L=ais[0],A=ais[1],B=ais[2],C=ais[3],X=ais[4]||null;
 for(const a of G.emps)for(const b of G.emps)if(a!==b&&!a.wild&&!b.wild){a.contact[b.id]=true;a.rel[b.id]=100;(a.intel||={})[b.id]=3;}
 for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k],2000);
 var mk=(type,members,leader)=>{const f={id:(G.fedUid=(G.fedUid||0)+1),name:fedName(null,type),type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:leader.id,founder:leader.id,
   members:members.map(e=>e.id),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day-800,typeSince:G.day-800,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:100};
  G.feds=G.feds||[];G.feds.push(f);federationIdentity(f);for(const id of f.members){f.dutyConsent[id]={offense:false,since:G.day-800};for(const p of f.members)if(p!==id)G.emps[id].ally[p]=true;}fedRefreshRepresentation(f,true);return f;};
 var F=mk(OPT.type||'bilimsel',(OPT.members||['B','A','C']).map(k=>({L,A,B,C}[k])),{L,A,B,C}[OPT.leader||'B']);`);return h;}
const gap=(h,who)=>J(h,`(()=>{const e=${who};const p=aiFedType(e);return {pref:p,type:F.type,gap:p===F.type?0:+(aiFedAffinity(e,p)-aiFedAffinity(e,F.type)).toFixed(2),ok:typeof aiFedMismatch==='function'?!!aiFedMismatch(e,F):null};})()`);
const review=(h,who,n)=>J(h,`(()=>{let left=false,days=0;for(let i=0;i<${n};i++){G.day+=30;if(aiFedStayReview(${who},F)){left=true;days=i+1;break;}}return {left,days,strain:${who}._fedStrain||0,inFed:F.members.includes(${who}.id)};})()`);

test('F3 uyumlu üye (tür uyumu ≥ tercih − 0,35): 24 değerlendirmede ayrılma yok, üye reform önergesi yok',()=>{
  const h=world({});const g=gap(h,'C');assert.ok(g.gap<.35,'fikstür uyumu '+JSON.stringify(g));
  const r=review(h,'C',24),prop=J(h,`(()=>{const v0=!!F.vote;const ok=typeof aiFedMemberReform==='function'?aiFedMemberReform(C,F):false;return {ok,vote:!!F.vote&&!v0};})()`);
  assert.equal(r.left,false,JSON.stringify({g,r}));assert.equal(prop.ok,false);assert.equal(prop.vote,false);});
test('F4a uyumsuz üye, destek yok, yaşayabilir alternatif var: sabır sayacı dolunca anayasaya uygun ayrılış (gerekçe tür uyumsuzluğu)',()=>{
  const h=world({});const g=gap(h,'A');assert.ok(g.gap>=.35,'fikstür uyumsuzluğu '+JSON.stringify(g));
  const alt=J(h,`(()=>({cand:fedFoundCandidate(A,L).ok,score:+aiFedAdmissionScore(A,L,aiFedType(A)).score.toFixed(2)}))()`);
  const r=review(h,'A',30),why=J(h,"(A.aiFedReason&&A.aiFedReason.why)||''");
  if(alt&&alt.cand&&alt.score>=.55){assert.equal(r.left,true,JSON.stringify({g,alt,r}));assert.equal(r.inFed,false);assert.match(why,/tür uyumsuzluğu/);assert.ok(r.days>=4,'sabır: hemen ayrılmaz');}
  else assert.equal(r.left,false,'alternatif yoksa ayrılmaz '+JSON.stringify(alt));});
test('F8 çalkantı yok: tür uyumsuzluğuyla ayrılan üye aynı birliğe (türü değişmedikçe) geri başvurmaz / daveti kabul etmez; 5 yıl sonra da; aynı reformu 4 yıl yeniden önermez',()=>{
  const h=world({});const r=review(h,'A',30);if(!r.left)return;
  const x=J(h,`(()=>{G.day+=1800;const joinable=canRequestFederation(A,B).ok;const left=aiFedLeftRecently(A,F);F.invites[A.id]={expires:G.day+180,by:B.id,terms:fedCharterKey(F)};A._fedPoliticsAfter=0;A._fedPoliticsMonth=-1;
    aiFederationPolitics();return {left,inFed:F.members.includes(A.id),joinable};})()`);
  assert.equal(x.left,true);assert.equal(x.inFed,false,'davet kabul edilmedi '+JSON.stringify(x));
  const h2=world({members:['B','A','L','C']});const y=J(h2,`(()=>{const a=aiFedMemberReform(A,F);G.day+=400;F.vote=null;const b=aiFedMemberReform(A,F);return {a,b,mm:aiFedMismatch(A,F)};})()`);
  assert.equal(y.a,true);assert.equal(y.b,false,'aynı reform 4 yıl tekrar önerilmez '+JSON.stringify(y));});
test('F4b uyumsuz üye, yaşayabilir alternatif yok (bütün diğerleri aynı federasyonda): sayaç dolsa da ayrılmaz',()=>{
  const h=world({});
  h.run(`for(const o of G.emps)if(!F.members.includes(o.id)&&o!==A)A.contact[o.id]=false;`);
  const r=review(h,'A',40);assert.equal(r.left,false,JSON.stringify(r));assert.ok(r.strain>=12,'sayaç işledi '+r.strain);});
test('F4c uyumsuz üye ve üyelerin yarısı aynı türü tercih ediyor: üye mevcut oylamayla REFORM önergesi açar (150 Etki), ayrılmaz',()=>{
  const h=world({members:['B','A','L','C']});const g=gap(h,'A');assert.ok(g.gap>=.35,JSON.stringify(g));
  /* AI üyeler oylamada hemen oy verir; oylama aynı adımda sonuçlanabilir (sonuç f.lastVote) */
  const r=J(h,`(()=>{const etk=A.res.etk;const ok=aiFedMemberReform(A,F);const v=F.vote||F.lastVote||{};return {ok,motion:v.motion,type:v.type,proposer:v.proposer,passed:v.passed??null,paid:etk-A.res.etk,after:A._fedPoliticsAfter-G.day,yes:v.yes,no:v.no};})()`);
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.motion,'reform');assert.equal(r.type,g.pref);assert.equal(r.proposer,h.run('A.id'));assert.equal(r.paid,150);assert.ok(r.after>=359);
  console.log('  F4c oylama: '+JSON.stringify({passed:r.passed,yes:r.yes,no:r.no}));
  assert.equal(J(h,'aiFedMemberReform(A,F)'),false,'aynı tür için ikinci önerge yok (bekleme / sonuç)');
  if(r.passed===false)assert.equal(J(h,'aiFedMismatch(A,F).unresolved'),true,'reddedilen reform → çözülemeyen uyumsuzluk');});
test('F4d reform reddedilmiş (lastVote): çözülemeyen uyumsuzluk sabır sayacını işletir',()=>{
  const h=world({members:['B','A','L','C']});const g=gap(h,'A');
  h.run(`F.lastVote={motion:'reform',type:'${g.pref}',passed:false,day:G.day};`);const m=J(h,'aiFedMismatch(A,F)');assert.equal(m.unresolved,true);assert.equal(m.plausible,false);
  const r=review(h,'A',3);assert.ok(r.strain>=3,'sayaç '+JSON.stringify(r));});
test('F5 lider (B) üye yolunu kullanmaz; insan üye adına AI reform önergesi / ayrılma yok',()=>{
  const h=world({members:['B','A','L','C']});
  const r=J(h,`(()=>{const a=aiFedMemberReform(B,F);A.ai=false;const b=aiFedMemberReform(A,F);let left=false;for(let i=0;i<30;i++){G.day+=30;if(aiFedStayReview(A,F))left=true;}return {a,b,left,vote:!!F.vote};})()`);
  assert.deepEqual(r,{a:false,b:false,left:false,vote:false});});
test('F7 tür reformu oyu doktrine göre: aynı türü tercih eden üye evet, karşı türü tercih eden üye hayır (ilişki 100 iken de)',()=>{
  const h=world({members:['B','A','L','C']});const r=J(h,`(()=>{const v={kind:'motion',motion:'reform',type:aiFedType(A),proposer:A.id};const w=o=>+aiFedVoteWant(o,F,v).toFixed(2);return {L:w(L),C:w(C),B:w(B),relC:C.rel[A.id]};})()`);
  assert.ok(r.L>=.5,'L destekler '+JSON.stringify(r));assert.ok(r.C<.5,'C reddeder '+JSON.stringify(r));assert.ok(r.B<.5,'lider B (bilimsel) reddeder '+JSON.stringify(r));});
test('F6 ekonomik krizdeki üye pahalı yasaya (ortak donanma) gerekçeli düşük oy verir',()=>{
  const h=world({type:'askeri'});const r=J(h,`(()=>{const v={kind:'inner',law:'ortakDon',proposer:B.id};const a=aiFedVoteAssessment(A,F,v).score;A.res.ene=1;A.res.ala=1;A.inc={...(A.inc||{}),ene:-40,ala:-20};const b=aiFedVoteAssessment(A,F,v);return {a:+a.toFixed(2),b:+b.score.toFixed(2),f:b.factors.map(x=>x.n).join(' | ')};})()`);
  assert.ok(r.b<r.a,JSON.stringify(r));assert.match(r.f,/ekonomik|bütçe/i);});
test('T1 fiziksel varış temas kurar (arrive); T2 keşfedilmemiş uzak devletle temas yok',()=>{
  const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;`);
  const r=J(h,`(()=>{const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild),a=ais[0],b=ais[1],c=ais[2];const before=!!a.contact[b.id];const f=newFleet(a,a.home,[{c:'kor'}],'t');f.sys=b.home;arrive(f,G.sys[b.home]);
   return {before,after:!!a.contact[b.id]&&!!b.contact[a.id],third:!!a.contact[c.id]};})()`);
  assert.equal(r.before,false);assert.equal(r.after,true);assert.equal(r.third,false,'üçüncü devlet temas kazanmaz');});
function prizeWorld(){const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:true});setupGame({...CFG});G.autoSave=false;
 var a=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide)[0];for(const o of G.emps)if(!o.wild){a.war[o.id]=false;o.war[a.id]=false;}
 var nestSys=G.sys.find(s=>s.nest&&!s.seen.includes(a.id)&&!s.surv.includes(a.id)&&s.lanes.some(l=>!G.sys[l].nest&&!G.sys[l].ruin));
 var big=newFleet(a,a.home,Array.from({length:12},()=>({c:'kru'})),'güç');big.path=[];big.mv=null;
 var run=()=>{const r0=rnd;rnd=()=>0.01;try{aiTurn(a);}finally{rnd=r0;}return {target:big.path.at(-1)??null,nest:nestSys&&nestSys.id};};`);return h;}
test('T3 sensör menzilindeki (aiKnownSystem) ama hiç girilmemiş korsan yuvası güçlü AI filosunun av hedefi olur',()=>{
  const h=prizeWorld();const r=J(h,`(()=>{if(!nestSys)return {skip:true};const adj=nestSys.lanes.find(l=>!G.sys[l].nest&&!G.sys[l].ruin);if(adj===undefined)return {skip:true};big.sys=adj;territoryOwnerSet(G.sys[adj],a.id);G.day+=.1;const known=!!aiKnownSystem(a,nestSys),seen=nestSys.seen.includes(a.id),pw=fleetPower(big),hp=nestSys.nest.hp;
   const out=run();return {...out,known,seen,pw,hp};})()`);
  assert.ok(!r.skip,'fikstür yuvası');assert.equal(r.seen,false);assert.equal(r.known,true,'yuva sensörde görünür');
  if(r.pw>900&&r.pw>r.hp*.35)assert.equal(r.target,r.nest,JSON.stringify(r));});
test('T5 AI’ın bilmediği (görülmemiş, istihbaratta yok) yuva av listesine girmez',()=>{
  const h=prizeWorld();const r=J(h,`(()=>{if(!nestSys)return {skip:true};const known=!!aiKnownSystem(a,nestSys);const out=run();return {...out,known};})()`);
  assert.ok(!r.skip);if(!r.known)assert.notEqual(r.target,r.nest,JSON.stringify(r));});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
