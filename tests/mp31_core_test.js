'use strict';
/* MP.3.1: federasyon siyaseti ve vasallık sözleşmeleri — host'un gerçek STARS motorunda (Node vm).
   Yeni siyasi motor yok: requestFederation / proposeFedMotion / castFedVote / acceptFedInvite / leaveFederation /
   proposeFedLaw / vassalOffer / vassalReply. MP yalnız yetki, gizlilik, görünüm ve uzak insanın oyunu AI'dan ayırır.
   Dünya: seed 22, orta, 5 AI; misafir A=1, B=3, C=4; AI 2 ve 5; host 0.
   FİKSTÜR (açıkça): siyasi başlangıç durumu — karşılıklı temas, ittifaklar, Etki ve bir federasyon nesnesi
   (üyeler AI 5 [başkan], AI 2, insan B) motorun kendi biçiminde kurulur (tests/helpers/96e-fixture.js ile aynı şekil).
   Kuruluş fikstürle yapılır, çünkü motorun foundFederation'ı en az iki AI müttefik ister ve bu dünyada yalnız iki AI var. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,C=4,AI2=2,AI5=5,CONN={[A]:'cA',[B]:'cB',[C]:'cC'};
const POLITICS=`
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  const pairs=[[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,5],[2,3],[2,5],[3,5],[4,5],[2,4]];   // C(4) A ve B ile temassız
  for(const [a,b] of pairs){G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].rel[b]=G.emps[b].rel[a]=60;}
  var F={id:100,name:'MP31 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:5,founder:5,members:[5,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);
  for(const id of F.members)recalcMods(G.emps[id]);`;
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r31',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${POLITICS};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c,extra={}){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m31'+conn+String(s).padStart(5,'0'),cmd:c,...extra}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
function lastView(h,who){const conn=CONN[who];let v=null,base=null;for(const [c,t] of h.sb.__out){if(c!==conn)continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){v=JSON.parse(JSON.stringify(m.view));base=m.rev;}else if(m.type==='delta'&&v&&m.base===base){const o=m.ops||{};
    for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}return v;}
const pol=(h,who)=>lastView(h,who).pol;
const token=h=>J(h,'fedVoteToken(F.vote)');
/* AI başkanın gerçek önerisiyle açılan yasa oylaması (motorun proposeFedLaw'u) */
function openLaw(h){return J(h,`(()=>{const k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[5],k,false).ok);var r=proposeFedLaw(G.emps[5],k);MP.publish();return {k,ok:r.ok,pending:!!r.pending};})()`);}

test('kritik: uzak insan B oy vermeden federasyon onun adına evet/hayır kaydetmez; AI değerlendirmesi ve rezerve RNG yalnız AI seçmenler için; motorun eski davranışı insanı AI gibi oylatıyordu',()=>{
  // kontrol: korumasız motor (aynı dünya, installGuards yok) uzak insanın oyunu AI değerlendirmesiyle veriyor
  const raw=runtime({root});raw.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;G.emps[3].ai=false;${POLITICS};
    var k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[5],k,false).ok);proposeFedLaw(G.emps[5],k)`);
  assert.equal(J(raw,'(F.vote?F.vote.yes.concat(F.vote.no):F.lastVote.yesMembers.concat(F.lastVote.noMembers)).includes(3)'),true,'engine without MP guard votes for the remote human (bug reproduced)');
  const h=world(),r0=h.run('RND_STATE');const o=openLaw(h);assert.equal(o.ok,true);assert.equal(o.pending,true,'vote waits for the human');
  assert.deepEqual(J(h,'[F.vote.yes.includes(3),F.vote.no.includes(3),3 in F.vote.assessments,3 in F.vote.reasons]'),[false,false,false,false]);
  assert.deepEqual(J(h,'fedVoteCounts(F).waiting'),[B]);assert.equal(J(h,'F.vote.yes.includes(5)'),true,'AI proposer keeps its explicit proposal vote');
  // RNG: yalnız AI 2 için bir rezerve çekim (öneren 5 çekim yapmaz; insan B hiç)
  const r1=h.run('RND_STATE');h.run(`rndSeed(${JSON.stringify(r0)});rnd();`);assert.equal(h.run('RND_STATE'),r1,'exactly one reserved draw (AI 2)');h.run(`rndSeed(${JSON.stringify(r1)})`);
  const pv=pol(h,B).fed.vote;assert.equal(pv.mine,'wait');assert.deepEqual(pv.waiting,[B]);assert.match(pv.rule,/çoğunluğu|üstünlüğü/);
  assert(lastView(h,B).log.some(x=>/Federasyon oylaması başladı/.test(x.m)),'B notified');
  const tk=token(h),r=cmd(h,B,{kind:'fedVote',fed:100,token:tk,yes:false});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.deepEqual(J(h,'[F.vote,F.lastVote.noMembers.includes(3),F.lastVote.yesMembers.includes(3)]'),[null,true,false],'only B\'s own vote recorded, vote resolved by the engine');
  assert(lastView(h,B).log.some(x=>/Oylama sonucu/.test(x.m)));
});
test('oy = motor: ağdan castFedVote ile doğrudan castFedVote aynı Save8 ve RNG; çift oy, sahte token, süresi dolmuş gündem, üye olmayan ve sahte federasyon reddi',()=>{
  const a=world(),b=world();openLaw(a);openLaw(b);const tk=token(a);
  assert.equal(cmd(a,B,{kind:'fedVote',fed:100,token:'99999',yes:true}).code,'rules:stale');
  const s0=st(a);assert.equal(cmd(a,A,{kind:'fedVote',fed:100,token:tk,yes:true}).code,'no-fed','non-member: federation looks absent');
  assert.equal(cmd(a,A,{kind:'fedVote',fed:424242,token:tk,yes:true}).code,'no-fed');assert.equal(cmd(a,C,{kind:'fedVote',fed:100,token:tk,yes:true}).code,'no-fed');
  assert.equal(cmd(a,B,{kind:'fedVote',fed:100,token:tk,yes:true},{empire:5}).code,'forged-empire');
  assert.equal(cmd(a,B,{kind:'fedVote',fed:100,token:tk,yes:'evet'}).code,'bad-params');assert.deepEqual(st(a),s0,'rejections change nothing');
  assert.equal(cmd(a,B,{kind:'fedVote',fed:100,token:tk,yes:true}).status,'ok');b.run(`if(!castFedVote(G.emps[3],100,${JSON.stringify(tk)},true).ok)throw Error('engine')`);
  assert.equal(a.run('serialize()'),b.run('serialize()'),'MP vote == engine vote');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  assert.equal(cmd(a,B,{kind:'fedVote',fed:100,token:tk,yes:true}).code,'rules:no-vote','resolved vote cannot be voted again');
  // süresi dolan gündem: oy verilmezse motor çekimser sayar, insan adına oy yok
  const h=world();openLaw(h);const t2=token(h);h.run('G.day=F.vote.expires');assert.equal(cmd(h,B,{kind:'fedVote',fed:100,token:t2,yes:true}).code,'rules:expired');
  h.run('finishFedVote(F)');assert.deepEqual(J(h,'[F.lastVote.yesMembers.includes(3),F.lastVote.noMembers.includes(3),F.lastVote.abstain]'),[false,false,1]);
  // host başkasının oyunu veremez
  const k=world();openLaw(k);assert.equal(J(k,`MP.local({kind:'fedVote',fed:100,token:fedVoteToken(F.vote),yes:true}).code`),'no-fed');
});
test('üyelik başvurusu: A, AI üye 5 üzerinden başvurur (60 Etki) → gerçek kabul oylaması → B kendi oyunu verir → davet A\'ya gider, A kendisi kabul eder → gerçek üyelik',()=>{
  const h=world();h.run('for(const id of F.members){G.emps[1].ally[id]=G.emps[id].ally[1]=true;}MP.publish()');
  const o=pol(h,A).others.find(x=>x.fid===100);assert(o&&o.vias.some(v=>v.id===AI5&&v.ok),'A sees the federation through its contacted member');
  const etk=J(h,'G.emps[1].res.etk'),r=cmd(h,A,{kind:'fedRequest',via:AI5});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(J(h,'G.emps[1].res.etk'),etk-60);
  assert.deepEqual(J(h,'[F.vote.motion,F.vote.target,F.vote.applicant]'),['admit',A,A]);assert.deepEqual(J(h,'fedVoteCounts(F).waiting'),[B]);
  assert.equal(J(h,'F.vote.yes.includes(3)||F.vote.no.includes(3)'),false);assert(lastView(h,B).log.some(x=>/oylaması başladı/.test(x.m)));
  assert.equal(pol(h,A).fed,null);assert(pol(h,A).apps.some(x=>x.status==='pending'),'A sees its application status');
  assert.equal(cmd(h,B,{kind:'fedVote',fed:100,token:token(h),yes:true}).status,'ok');
  const passed=J(h,'F.lastVote.passed');
  if(!passed){console.log('   AI üyeler reddetti: '+J(h,'F.lastVote.why'));return;}
  assert.equal(J(h,'F.members.includes(1)'),false,'vote alone does not admit');assert.equal(J(h,'!!F.invites[1]'),true,'invitation awaits the human candidate');
  const inv=pol(h,A).invites.find(x=>x.fid===100);assert(inv&&inv.valid,'invite visible to A');assert(lastView(h,A).log.some(x=>/Federasyon daveti/.test(x.m)));
  assert.equal(cmd(h,A,{kind:'fedReply',fed:100,action:'accept'}).status,'ok');assert.equal(J(h,'F.members.includes(1)'),true);
  assert.equal(cmd(h,A,{kind:'fedReply',fed:100,action:'accept'}).code,'no-invite','same invitation cannot be accepted twice');
  assert.equal(pol(h,A).fed.id,100);assert(pol(h,A).fed.members.some(m=>m.id===A&&m.h===1));
});
test('davet: üye B, A\'yı davet eder (kabul oylaması) → A reddeder; davetin süresi dolunca kabul edilemez; aday başka yükümlülükle ya da vasal olunca davet geçersiz; başarısız işlem üyelik oluşturmaz',()=>{
  const h=world();h.run('F.charter.admission="contact";MP.publish()');
  const r=cmd(h,B,{kind:'fedInvite',target:A});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(J(h,'F.vote.target'),A);
  assert.equal(J(h,'F.vote.yes.includes(3)'),false,'B proposed but must still vote (like the host)');
  assert.equal(cmd(h,B,{kind:'fedVote',fed:100,token:token(h),yes:true}).status,'ok');
  if(!J(h,'F.lastVote.passed')){console.log('   AI üyeler daveti reddetti: '+J(h,'F.lastVote.why'));return;}
  assert.equal(J(h,'!!F.invites[1]'),true);const s0=st(h);assert.equal(cmd(h,C,{kind:'fedReply',fed:100,action:'accept'}).code,'no-invite','someone else cannot accept');assert.deepEqual(st(h),s0);
  assert.equal(cmd(h,A,{kind:'fedReply',fed:100,action:'reject'}).status,'ok');assert.equal(J(h,'F.members.includes(1)||!!F.invites[1]'),false);
  // süre dolumu ve değişen yükümlülükler (motor kuralı)
  const k=world();k.run('F.charter.admission="contact";MP.publish()');cmd(k,B,{kind:'fedInvite',target:A});cmd(k,B,{kind:'fedVote',fed:100,token:token(k),yes:true});
  if(J(k,'!!F.invites[1]')){k.run('F.charter.offense="auto";MP.publish()');const x=cmd(k,A,{kind:'fedReply',fed:100,action:'accept'});assert.equal(x.code,'rules:changed');assert.equal(J(k,'F.members.includes(1)'),false);
    k.run('F.charter.offense="vote";G.day=F.invites[1].expires;MP.publish()');assert.equal(cmd(k,A,{kind:'fedReply',fed:100,action:'accept'}).code,'rules:expired');assert.equal(J(k,'F.members.includes(1)'),false);}
});
test('oy rejimleri: aynı üyelerde eşit / hegemonik / ekonomik / karma / ağırlıklı ağırlıklar motorun fedVoteCounts\'u ile aynı; çoğunluk kuralı metni motordan; sonuç motorla aynı',()=>{
  const out={};
  for(const mode of ['equal','hegemonic','economic','mixed','weighted']){
    const a=world(),b=world();for(const x of [a,b])x.run(`F.charter.ballot=${JSON.stringify(mode)};fedRefreshRepresentation(F,true);MP.publish()`);
    openLaw(a);openLaw(b);const v=pol(a,B).fed.vote,c=J(a,'fedVoteCounts(F)');
    assert.deepEqual(v.w,c.weights,mode+' weights');assert.equal(v.total,Math.round(c.total*1000)/1000);assert.equal(v.rule,J(a,'fedVoteRule(F,fedVoteCounts(F))'));
    assert.equal(pol(a,B).fed.ballot.k,mode);assert.equal(pol(a,B).fed.ballot.d,J(a,`FED_BALLOTS[${JSON.stringify(mode)}].d`));
    const tk=token(a);cmd(a,B,{kind:'fedVote',fed:100,token:tk,yes:true});b.run(`castFedVote(G.emps[3],100,${JSON.stringify(tk)},true)`);
    assert.equal(a.run('serialize()'),b.run('serialize()'),mode+' MP == engine');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
    out[mode]={w:c.weights,passed:J(a,'F.lastVote.passed'),yes:J(a,'F.lastVote.yes'),no:J(a,'F.lastVote.no')};
  }
  console.log('   rejimler: '+Object.entries(out).map(([k,x])=>k+' '+JSON.stringify(x.w)+' '+(x.passed?'KABUL':'RED')+' '+x.yes+'/'+x.no).join(' · '));
});
test('ayrılma: B kendi isteğiyle ayrılır (motorun leaveFederation\'ı = aynı Save8); başkası B\'yi çıkaramaz; açık oylamada B\'nin oyu sayılmaz, diğer oylar silinmez',()=>{
  const a=world(),b=world();openLaw(a);openLaw(b);
  assert.equal(cmd(a,A,{kind:'fedLeave'}).code,'rules:no-fed','non-member cannot leave');assert.equal(J(a,`MP.local({kind:'fedLeave'}).code`),'rules:no-fed');
  const yes0=J(a,'F.vote.yes.slice()');assert.equal(cmd(a,B,{kind:'fedLeave'}).status,'ok');b.run('leaveFederation(G.emps[3])');
  assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  assert.equal(J(a,'F.members.includes(3)'),false);assert.equal(J(a,'G.emps[3]._fedLeaveUntil>G.day'),true);assert.deepEqual(J(a,'[G.emps[3].ally[5],G.emps[5].ally[3]]'),[false,false]);
  if(J(a,'!!F.vote'))assert.deepEqual(J(a,'F.vote.yes'),yes0,'other members\' votes kept');
  assert.equal(pol(a,B).fed,null);
});
test('kuruluş koruması: AI kurucu adayı listesinde uzak insan AI eğilimiyle değil "oyuncunun açık onayı" ile görünür; insan kurucu motor şartlarını (iki AI müttefik) karşılamazsa kuramaz',()=>{
  const h=world();h.run('G.feds=[];for(const e of G.emps)delete e._fedLeaveUntil;for(const [a,b] of [[2,5],[2,1],[5,1]]){G.emps[a].ally[b]=G.emps[b].ally[a]=true;}MP.publish()');
  const q=J(h,'canFoundFed(G.emps[2],"bilimsel","equal").candidates.find(x=>x.id===1)');assert.equal(q.ok,false);assert.match(q.why,/açık üyelik onayı/);
  const r=cmd(h,A,{kind:'fedFound',type:'bilimsel',ballot:'equal'});if(r.status!=='ok'){assert.equal(r.code,'rules:fed');assert(r.detail.length>0);}
  const qq=cmd(h,A,{kind:'fedFoundQuote',type:'askeri',ballot:'equal'});assert.equal(qq.status,'ok');assert(Array.isArray(qq.extra.candidates));
});
test('vasallık insan–insan: B, A\'dan himaye ister (haraçgüzar %20) → A karşı teklif (%10) → eski tur geçersiz → B kabul eder → gerçek sözleşme; ağdan = doğrudan motor (Save8+RNG); vergi sonraki ay motorla akar',()=>{
  const a=world(),b=world();const terms={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
  const qv=cmd(a,B,{kind:'vassalQuote',to:A,mode:'seek',type:'haracguzar',terms});assert.equal(qv.status,'ok');assert.equal(qv.extra.ok,true,JSON.stringify(qv.extra));assert.equal(qv.extra.cost,J(a,'VASSAL_SEEK_COST'));
  assert(qv.extra.est&&'ene' in qv.extra.est,'own estimate only');
  const s0=st(a);const r=cmd(a,B,{kind:'vassalOffer',to:A,mode:'seek',type:'haracguzar',terms});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(r.extra.karar,'pending');
  b.run(`if(!vassalOffer(G.emps[3],G.emps[1],'seek','haracguzar',${JSON.stringify(terms)}).ok)throw Error('engine')`);
  assert.equal(a.run('serialize()'),b.run('serialize()'));assert.notEqual(s0.save,a.run('serialize()'));assert.equal(J(a,'isVassal(G.emps[3])'),false,'offer alone creates nothing');
  const t=pol(a,A).vas.talks.find(x=>x.sub===B);assert.deepEqual([t.to,t.round,t.status,t.kind],[A,1,'pending','new']);assert(lastView(a,A).log.some(x=>/Vasallık teklifi/.test(x.m)));
  assert.equal(cmd(a,C,{kind:'vassalReply',sub:B,id:t.id,round:1,action:'accept'}).code,'no-offer','third party: talk looks absent');
  assert.equal(cmd(a,B,{kind:'vassalReply',sub:B,id:t.id,round:1,action:'accept'}).code,'rules:not-recipient','cannot accept own offer');
  const ct={...terms,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}};
  assert.equal(cmd(a,A,{kind:'vassalReply',sub:B,id:t.id,round:1,action:'counter',terms:{...ct,tax:{ene:.9,min:0,ala:0,yiy:0,tuk:0}}}).code,'rules:terms','invalid tax refused');
  assert.equal(cmd(a,A,{kind:'vassalReply',sub:B,id:t.id,round:1,action:'counter',terms:ct}).status,'ok');b.run(`vassalReply(G.emps[1],3,${JSON.stringify(t.id)},1,'counter',${JSON.stringify(ct)})`);
  assert.equal(cmd(a,A,{kind:'vassalReply',sub:B,id:t.id,round:2,action:'accept'}).code,'rules:not-recipient','the new round belongs to B');
  assert.equal(cmd(a,B,{kind:'vassalReply',sub:B,id:t.id,round:1,action:'accept'}).code,'rules:stale','old round cannot be accepted');
  assert.equal(cmd(a,B,{kind:'vassalReply',sub:B,id:t.id,round:2,action:'accept'}).status,'ok');b.run(`vassalReply(G.emps[3],3,${JSON.stringify(t.id)},2,'accept')`);
  assert.equal(a.run('serialize()'),b.run('serialize()'),'MP == engine');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  assert.deepEqual(J(a,'[G.emps[3].overlord,G.emps[3].vassalContract.terms.tax.ene,G.emps[3].vassalContract.type]'),[A,.1,'haracguzar']);
  assert.equal(cmd(a,B,{kind:'vassalReply',sub:B,id:t.id,round:2,action:'accept'}).code,'rules:closed','cannot apply twice');
  const l=pol(a,A).vas.subs.find(x=>x.sub===B);assert(l&&l.terms.tax.ene===.1);assert.equal(pol(a,B).vas.lord.lord,A);
  const before=J(a,'G.emps[1].res.ene'),paid0=J(a,'G.emps[3].vassalPaidMonth??null');a.run('step(31);MP.publish()');b.run('step(31);MP.publish()');
  assert.equal(a.run('serialize()'),b.run('serialize()'),'tribute month identical to the plain engine');
  assert.notEqual(J(a,'G.emps[3].vassalPaidMonth??null'),paid0,'monthly tribute processed by the engine');console.log('   vergi aktarımı: '+JSON.stringify(J(a,'G.emps[3].vassalTransfer')));
});
test('yeniden müzakere ve barışçıl bağımsızlık: reddedilen yenileme sözleşmeyi değiştirmez; kabul edilen bağımsızlık freeVassal ile biter, savaş yok; reddedilen bağımsızlık bağımsızlık vermez',()=>{
  const h=world();const terms={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:12,sensors:false};
  h.run(`subjugate(G.emps[1],G.emps[3],'haracguzar',${JSON.stringify(terms)},'voluntary');MP.publish()`);   // FİKSTÜR: mevcut sözleşme (motorun subjugate'i)
  const too=cmd(h,B,{kind:'vassalOffer',to:A,mode:'renew',type:'haracguzar',terms:{...terms,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}}});assert.equal(too.code,'rules:engine');assert.match(too.detail[0],/Yeniden müzakere tarihi/);
  h.run('G.emps[3].vassalContract.started-=400;MP.publish()');   // FİKSTÜR: 12 aylık yeniden müzakere tarihi geçmiş sayılır
  const rev0=J(h,'G.emps[3].vassalContract.revision');assert.equal(cmd(h,B,{kind:'vassalOffer',to:A,mode:'renew',type:'haracguzar',terms:{...terms,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}}}).status,'ok');
  let q=J(h,'G.emps[3].vassalTalk');assert.equal(cmd(h,A,{kind:'vassalReply',sub:B,id:q.id,round:1,action:'reject'}).status,'ok');
  assert.deepEqual(J(h,'[G.emps[3].vassalContract.terms.tax.ene,G.emps[3].vassalContract.revision,G.emps[3].overlord]'),[.2,rev0,A],'rejected renewal keeps the contract');
  // bağımsızlık: 12 aylık müzakere soğuması motor kuralı
  const cool=cmd(h,B,{kind:'vassalOffer',to:A,mode:'release',type:'haracguzar',terms});assert.equal(cool.code,'rules:engine');
  h.run('G.emps[3].vassalTalk.finished-=400;G.emps[3]._vassalTalkAfter=0;MP.publish()');   // FİKSTÜR: soğuma geçmiş
  assert.equal(cmd(h,A,{kind:'vassalOffer',to:B,mode:'release',type:'haracguzar',terms}).code,'rules:engine','only the vassal requests independence');
  assert.equal(cmd(h,B,{kind:'vassalOffer',to:A,mode:'release',type:'haracguzar',terms}).status,'ok');q=J(h,'G.emps[3].vassalTalk');assert.equal(q.kind,'release');
  assert.deepEqual(J(h,'[!!G.emps[1].war[3],!!G.emps[3].war[1],G.emps[3].overlord]'),[false,false,A],'request starts no war and grants nothing yet');
  const k=world();k.run(`subjugate(G.emps[1],G.emps[3],'haracguzar',${JSON.stringify(terms)},'voluntary');G.emps[3].vassalContract.started-=400;MP.publish()`);
  assert.equal(cmd(k,B,{kind:'vassalOffer',to:A,mode:'release',type:'haracguzar',terms}).status,'ok');let kq=J(k,'G.emps[3].vassalTalk');
  assert.equal(cmd(k,A,{kind:'vassalReply',sub:B,id:kq.id,round:1,action:'reject'}).status,'ok');assert.deepEqual(J(k,'[G.emps[3].overlord,!!G.emps[1].war[3]]'),[A,false],'refused independence: still vassal, no war');
  assert.equal(cmd(h,A,{kind:'vassalReply',sub:B,id:q.id,round:1,action:'accept'}).status,'ok');
  assert.deepEqual(J(h,'[isVassal(G.emps[3]),G.emps[3].vassalContract.status,!!G.emps[1].war[3]]'),[false,'ended',false],'peaceful independence');
  assert(lastView(h,B).log.some(x=>/Bağımsızsın/.test(x.m)));
});
test('AI ↔ insan vasallık: AI 2\'nin motor işleviyle (seekProtection) insana teklifi insanın kutusunda bekler, AI karar vermez; insan → AI teklifinde vassalDriveAI karar verir',()=>{
  const h=world();h.run('G.emps[1].res.etk=2000;MP.publish()');
  // AI'nın kendi giriş işlevi doğrudan çağrıldı (AI stratejisi bu dünyada bu teklifi doğal olarak üretmedi; doğal AI davranışı sayılmaz)
  const r=J(h,`(()=>{const x=seekProtection(G.emps[2],G.emps[1],'bekci',vassalDefaultTerms('bekci'));MP.publish();return {ok:x.ok,karar:x.karar};})()`);
  if(!r.ok){console.log('   AI 2 → A himaye teklifi motor kuralıyla mümkün değil: '+J(h,'canSeekProtection(G.emps[2],G.emps[1]).why'));}
  else{assert.equal(r.karar,'pending','AI does not decide for the human');const q=J(h,'G.emps[2].vassalTalk');assert.equal(q.to,A);
    assert(pol(h,A).vas.talks.some(t=>t.id===q.id&&t.status==='pending'));assert.equal(cmd(h,A,{kind:'vassalReply',sub:AI2,id:q.id,round:1,action:'reject'}).status,'ok');}
  // insan → AI: C (güçlü) AI 5'ten biat ister; AI motorla yanıtlar
  const t={tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'free',duration:0,renegotiate:24,sensors:false};
  const x=cmd(h,C,{kind:'vassalOffer',to:AI5,mode:'demand',type:'haracguzar',terms:t});assert.equal(x.status,'ok',JSON.stringify(x));
  assert(['accepted','rejected','pending'].includes(x.extra.karar));const q5=J(h,'G.emps[5].vassalTalk');
  if(q5.status==='pending')assert.equal(q5.to,C,'AI counter returns to the human');
  console.log('   insan→AI biat isteği: AI kararı '+q5.status+' (tur '+q5.round+')');
});
test('gizlilik: üçüncü oyuncu C, A–B vasallık müzakeresinin kimliğini, şartlarını, karşı teklifini ve F\'nin oylamasını ağdan hiç almaz',()=>{
  const h=world();const terms={tax:{ene:.15,min:.15,ala:.15,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
  cmd(h,B,{kind:'vassalOffer',to:A,mode:'seek',type:'haracguzar',terms});const q=J(h,'G.emps[3].vassalTalk');
  cmd(h,A,{kind:'vassalReply',sub:B,id:q.id,round:1,action:'counter',terms:{...terms,science:.05}});openLaw(h);h.run('MP.publish()');
  const pk=h.sb.__out.filter(([c])=>c==='cC').map(([,t])=>t).join('\n');
  assert(!pk.includes(q.id),'talk id');assert(!/"ene":0\.15/.test(pk),'terms');{const m=pk.match(/.{0,80}("vote":\{|"waiting":|"eligible":|"cy":).{0,80}/);assert(!m,'no vote data: '+(m&&m[0]));}
  const pc=pol(h,C);assert.deepEqual(pc.vas.talks,[]);assert.equal(pc.fed,null);assert(!pc.others.some(x=>x.vias.some(v=>v.id===A||v.id===B)),'no uncontacted members listed');
  assert.equal(cmd(h,C,{kind:'vassalReply',sub:B,id:q.id,round:2,action:'accept'}).code,cmd(h,C,{kind:'vassalReply',sub:0,id:'0:1',round:1,action:'accept'}).code);
});
test('çakışmalar motor kuralıyla: vasal federasyona başvuramaz; üye vasal olursa motor ne yapıyorsa o (raporlanır); oy sürerken ayrılan üyenin oyu sayılmaz; ölen insanın açık müzakeresi ve daveti geçersizleşir',()=>{
  const h=world(),terms={tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
  h.run('for(const id of F.members){G.emps[1].ally[id]=G.emps[id].ally[1]=true;}');
  h.run(`subjugate(G.emps[4],G.emps[1],'haracguzar',${JSON.stringify(terms)},'voluntary');MP.publish()`);   // FİKSTÜR: A, C'nin vasalı
  const r=cmd(h,A,{kind:'fedRequest',via:AI5});assert.equal(r.code,'rules:fed');assert.match(r.detail[0],/bağımsız/);
  // üye B vasal olursa (motor kuralı): sonuç raporlanır
  const k=world();k.run(`subjugate(G.emps[1],G.emps[3],'haracguzar',${JSON.stringify(terms)},'voluntary');updateFederations();MP.publish()`);
  const still=J(k,'F.members.includes(3)');console.log('   üye B vasal olunca federasyon üyeliği (motor): '+(still?'sürüyor':'sona erdi'));
  // ölen insan: açık vasallık müzakeresi ve federasyon daveti geçersizleşir
  const d=world();cmd(d,B,{kind:'vassalOffer',to:A,mode:'seek',type:'haracguzar',terms});d.run('F.invites[1]={expires:G.day+180,terms:fedCharterKey(F),by:5,vote:"x"};G.emps[1].dead=true;vassalTalkTick();updateFederations();MP.publish()');
  assert.deepEqual(J(d,'[G.emps[3].vassalTalk.status,!!F.invites[1]]'),['invalid',false]);
});
test('kayıt: bekleyen federasyon oylaması ve vasallık müzakeresi kanonik G\'de (Save8) — deserialize(serialize()) sonrası insan kendi kararını verir',()=>{
  const h=world();openLaw(h);const terms={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
  cmd(h,B,{kind:'vassalOffer',to:A,mode:'seek',type:'haracguzar',terms});const tk=token(h),q=J(h,'G.emps[3].vassalTalk');
  h.run('deserialize(serialize());F=fedOf(100);MP.publish()');
  assert.equal(J(h,'fedVoteCounts(fedOf(100)).waiting.includes(3)'),true);assert.equal(cmd(h,B,{kind:'fedVote',fed:100,token:tk,yes:true}).status,'ok');
  assert.equal(cmd(h,A,{kind:'vassalReply',sub:B,id:q.id,round:1,action:'accept'}).status,'ok');assert.equal(J(h,'G.emps[3].overlord'),A);
});
test('yayın Save8\'e dokunmaz: siyaset görünümü (polView) ve bildirim süpürmesi her gün yapılsa da 60 günde Save8 ve RNG yayınsız dünya ile aynı',()=>{
  const a=world(),b=world();openLaw(a);openLaw(b);
  a.run('for(let i=0;i<60;i++){step(1);MP.publish();}');b.run('step(60)');
  assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
});
test('tek oyunculu federasyon ve AI: MP korumaları kurulu ama uzak insan yokken federasyon oylaması, başvuru, yasa, ayrılma ve vasallık RNG/Save8 düz motorla aynı (96E fikstürü)',()=>{
  const {world:w96}=require('./helpers/96e-fixture');
  const ops=`alliances(3);proposeFedLaw(G.emps[1],[...Object.keys(FED_LAWS)].find(k=>canFedLaw(G.emps[1],k,false).ok));if(F.vote)finishFedVote(F);
    G.day+=200;requestFederation(T,G.emps[1]);if(F.vote&&fedVoteCounts(F).waiting.includes(0))castFedVote(E,F.id,fedVoteToken(F.vote),true);
    G.day+=200;startFedVote(F);if(F.vote&&fedVoteCounts(F).waiting.includes(0))castFedVote(E,F.id,fedVoteToken(F.vote),false);
    seekProtection(G.emps[4],G.emps[5],'bekci',vassalDefaultTerms('bekci'));leaveFederation(G.emps[2]);`;
  const a=w96(),b=w96();a.run(ops);
  b.run(CORE);b.run(`var MP=StarsMP.createHost({roomId:'sp',random:n=>'ab'.repeat(n),send(){}});MP.installGuards();${ops}`);
  assert.equal(b.run('serialize()'),a.run('serialize()'));assert.equal(b.run('RND_STATE'),a.run('RND_STATE'));
  assert.equal(b.run('String(fedOpenVote).includes("__mpHumanVoter")'),true,'guard installed');
});
end();
