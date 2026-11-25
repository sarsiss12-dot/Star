'use strict';
/* FED-AI-SİYASET.0 — MP: AI üye sesi / çıkışı insan üyeli federasyonda (gerçek mp-core host + installGuards; misafirler B=1, C=3, D=4; AI 2, 5).
   M1 AI üye (2, yağmacı tercih) reform önergesi açar; oylama insan başkan B oy verene kadar açık kalır, AI insan adına oy yazmaz; B fedVote ile reddeder → tür değişmez.
   M2 insan üye (D) uyumsuz birlikte: AI yolu D adına önerge açmaz, ayrılmaz; 40 ay aiFederationPolitics sonrasında D üye kalır.
   M3 AI üye ayrılırsa yalnız kendisi ayrılır; insan üyeler, başkan ve fon dokunulmaz; insan başkanın federasyonu dağılmaz. */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const MK=`var mk=(type,members,leader)=>{const f={id:(G.fedUid=(G.fedUid||0)+1),name:fedName(null,type),type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader,founder:leader,
   members:members.slice(),laws:{},treasury:0,fund:{ala:40,ene:40},nextVote:G.day+9999,vote:null,founded:G.day-800,typeSince:G.day-800,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:100};
  G.feds=G.feds||[];G.feds.push(f);federationIdentity(f);for(const id of f.members){f.dutyConsent[id]={offense:false,since:G.day-800};for(const p of f.members)if(p!==id)G.emps[id].ally[p]=true;}fedRefreshRepresentation(f,true);return f;};`;
test('M1 AI üye reform önergesi: oylama insan başkanın oyunu bekler, AI insan adına oy yazmaz; insan reddi → tür değişmez, önerge tekrarlanmaz',()=>{
  const h=world();h.run(MK+`var F=mk('bilimsel',[1,2,5],1);`);
  const m=J(h,'aiFedMismatch(G.emps[2],F)');assert.ok(m&&m.plausible,'fikstür: AI 2 uyumsuz ve destekli '+JSON.stringify(m));
  assert.equal(h.run('aiFedMemberReform(G.emps[2],F)'),true,'AI üye önerge açtı');
  const v=J(h,'F.vote&&{motion:F.vote.motion,type:F.vote.type,votes:F.vote.votes||null}');assert.ok(v&&v.motion==='reform'&&v.type==='yagmaci','açık reform oylaması '+JSON.stringify(v));
  assert.equal(h.run('!!(F.vote.votes&&F.vote.votes[1]!==undefined)'),false,'insan başkan adına oy yazılmadı');
  const left=h.run('Number.isFinite(F.vote.expires)?F.vote.expires-G.day:999');for(let i=0;i<3;i++)h.run('G.day+='+Math.max(1,Math.floor((left-2)/3))+';aiFederationPolitics();');
  assert.equal(h.run('!!F.vote&&F.vote.motion==="reform"'),true,'insan oyu gelmeden (süre içinde) oylama kapanmadı');assert.equal(h.run('!!(F.vote.votes&&F.vote.votes[1]!==undefined)'),false);
  const r=cmd(h,'B',{kind:'fedVote',fed:h.run('F.id'),token:h.run('fedVoteToken(F.vote)'),yes:false});assert.equal(r.status,'ok',JSON.stringify(r));
  if(h.run('!!F.vote'))h.run('fedResolveVote(F)');
  assert.equal(h.run('F.type'),'bilimsel','reform reddedildi (%75 yok)');assert.equal(h.run('!!F.reform'),false);
  assert.equal(h.run('G.day+=60;F.vote=null;aiFedMemberReform(G.emps[2],F)'),false,'aynı reform 4 yıl tekrar önerilmez');});
test('M2 insan üye uyumsuz birlikte: AI yolu insan adına önerge açmaz, ayrılmaz; 40 ay sonra üyelik aynen',()=>{
  const h=world();h.run(MK+`var F=mk('yagmaci',[2,4,5],2);`);
  assert.equal(h.run('aiFedMemberReform(G.emps[4],F)'),false);
  const r=J(h,`(()=>{let left=0;for(let i=0;i<40;i++){G.day+=30;if(aiFedStayReview(G.emps[4],F))left++;aiFederationPolitics();}return {left,inFed:F.members.includes(4),strain:G.emps[4]._fedStrain||0,reason:G.emps[4].aiFedReason||null};})()`);
  assert.deepEqual([r.left,r.inFed,r.strain,r.reason],[0,true,0,null],JSON.stringify(r));});
test('M3 AI üyenin anayasal ayrılışı yalnız kendisini çıkarır: insan başkan, insan üye, fon ve federasyon sürer',()=>{
  const h=world();h.run(MK+`var F=mk('bilimsel',[1,2,3],1);`);const fund0=J(h,'F.fund');
  h.run('leaveFederation(G.emps[2]);');
  assert.deepEqual(J(h,'F.members'),[1,3]);assert.equal(h.run('F.leader'),1);assert.equal(h.run('G.feds.includes(F)'),true);assert.deepEqual(J(h,'F.fund'),fund0);
  assert.equal(h.run('findFed(G.emps[1])===F&&findFed(G.emps[3])===F'),true);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
