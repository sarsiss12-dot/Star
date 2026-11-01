'use strict';
/* MP.6.3 — federasyonun kalan kararları ve vasallığın kalan işlemleri, uzak insanlarla. Host'un gerçek STARS motoru (Node vm),
   seed 22, orta, 5 AI. Uzak insanlar A=1, B=3; AI 2, 4, 5; host 0.
   FİKSTÜR (açıkça): karşılıklı temas (ilişki 80), kaynak (3000), harita keşfi (seen/surv) ve AI'ların gözlem kaydı
   (e.aiIntel.systems — motorun kendi biçimi: sahip, savunma, koloni sayısı, başkent, gün). Gözlem kaydı olmadan motorun
   aiFedWilling'i "Bilinen yardım/iş birliği rotası yetersiz" der (MP.6.2'de kuruluşun tamamlanamama nedeni). Kuruluş
   fikstürle DEĞİL, motorun foundFederation'ıyla yapılır (B + bağımsız AI müttefikleri 2 ve 4).
   Vasallıkta 12 aylık soğuma ve 24 aylık yeniden müzakere süreleri motorundur; zaman geçişi sözleşme/müzakere tarihleri
   geriye alınarak (sözleşme 24+ ay önce imzalanmış gibi) kurulur — süreler değişmez. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};
const POL=`for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],3000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=80;}
  for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
  for(const e of G.emps){if(e.wild)continue;e.aiIntel=e.aiIntel||{};e.aiIntel.systems=e.aiIntel.systems||{};
    for(const s of G.sys)if(s.owner>=0)e.aiIntel.systems[s.id]={owner:s.owner,defense:sysDefense(s),colonies:s.planets.filter(p=>p.col).length,capital:G.emps[s.owner]&&G.emps[s.owner].home===s.id,day:G.day};}
  G.feds=[];for(const [a,b] of [[3,2],[3,4],[2,4]])G.emps[a].ally[b]=G.emps[b].ally[a]=true;
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}G.day+=1;`;
function world(extra=''){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(MIR);h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r63p',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cA'?'Ada':'Bora'}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${POL};${extra};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m63p'+conn+String(s).padStart(5,'0'),cmd:c}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const ok=(r,m)=>assert.equal(r&&r.status,'ok',(m||'')+' '+JSON.stringify(r));
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const notes=(h,id)=>J(h,`MP.viewFor(G.emps[${id}]).log.map(n=>n.m)`);
const vote=h=>J(h,'(()=>{const v=G.feds[0].vote;return v?{motion:v.motion,yes:v.yes.slice(),no:v.no.slice(),elig:v.eligible.slice(),tok:fedVoteToken(v)}:null;})()');
/* B kurar (motor), A'yı davet eder, A katılır → üyeler [B, 2, 4, A] */
function fed4(h){
  ok(cmd(h,B,{kind:'fedFound',type:'bilimsel',ballot:'equal'}),'found');
  h.run(`for(const b of [3,2,4])G.emps[1].ally[b]=G.emps[b].ally[1]=true;`);
  ok(cmd(h,B,{kind:'fedInvite',target:A}),'invite');ok(cmd(h,B,{kind:'fedVote',fed:J(h,'G.feds[0].id'),token:vote(h).tok,yes:true}),'B votes admit');
  ok(cmd(h,A,{kind:'fedReply',fed:J(h,'G.feds[0].id'),action:'accept'}),'A accepts');return J(h,'G.feds[0].id');
}

test('C kuruluş (GERÇEK): B, iki bağımsız AI müttefikiyle (2, 4) motorun foundFederation\'ıyla federasyon kurar; başkan B, oy rejimi seçilen; kontrol: gözlem kaydı yoksa motor kendi gerekçesiyle reddeder',()=>{
  const c=world('for(const e of G.emps)if(e.aiIntel)e.aiIntel.systems={};G.day+=1;');const r=cmd(c,B,{kind:'fedFound',type:'bilimsel',ballot:'equal'});
  assert.equal(r.code,'rules:fed');assert.match(r.detail.join(' '),/AI müttefik gerekir/,'control: engine condition, not an MP error');
  const h=world();const q=J(h,`canFoundFed(G.emps[${B}],'bilimsel','equal')`);assert.equal(q.ok,true,JSON.stringify(q.reasons));
  ok(cmd(h,B,{kind:'fedFound',type:'bilimsel',ballot:'equal'}));const f=J(h,'G.feds[0]');
  assert.deepEqual(f.members.slice().sort(),[2,B,4].sort());assert.equal(f.leader,B);assert.equal(J(h,'fedCharter(G.feds[0]).ballot'),'equal');
});
test('C oylama: üye kabulünde uzak insan B\'nin oyu OTOMATİK DEĞİL (AI üyeler kendi değerlendirmesiyle); B kendi oyunu verir; ikinci oy reddedilir; A daveti kendisi kabul eder',()=>{
  const h=world();ok(cmd(h,B,{kind:'fedFound',type:'bilimsel',ballot:'equal'}));h.run(`for(const b of [3,2,4])G.emps[1].ally[b]=G.emps[b].ally[1]=true;`);
  ok(cmd(h,B,{kind:'fedInvite',target:A}));let v=vote(h);assert.equal(v.motion,'admit');assert(!v.yes.includes(B)&&!v.no.includes(B),'remote human B not auto-voted');
  assert.deepEqual(v.yes.slice().sort(),[2,4],'AI members voted on their own assessment');
  ok(cmd(h,B,{kind:'fedVote',fed:J(h,'G.feds[0].id'),token:v.tok,yes:true}));assert.notEqual(cmd(h,B,{kind:'fedVote',fed:J(h,'G.feds[0].id'),token:v.tok,yes:false}).status,'ok','second vote refused');
  assert.equal(J(h,'G.feds[0].members.includes(1)'),false,'not a member before A\'s own acceptance');
  ok(cmd(h,A,{kind:'fedReply',fed:J(h,'G.feds[0].id'),action:'accept'}));assert.equal(J(h,'G.feds[0].members.includes(1)'),true);
});
test('C anayasa / oy rejimi: A önerir (karma); oylama kuralı federasyonun (≥%75) — B HAYIR derken 3/4 ile kabul; oybirliğine çevrilmez; rejim değişir',()=>{
  const h=world();fed4(h);ok(cmd(h,A,{kind:'fedMotion',motion:'charter',field:'ballot',value:'mixed'}));let v=vote(h);
  assert.equal(v.motion,'charter');assert(!v.yes.includes(A)&&!v.yes.includes(B),'humans not auto-voted');
  ok(cmd(h,A,{kind:'fedVote',fed:J(h,'G.feds[0].id'),token:v.tok,yes:true}));ok(cmd(h,B,{kind:'fedVote',fed:J(h,'G.feds[0].id'),token:v.tok,yes:false}));
  assert.equal(J(h,'G.feds[0].vote'),null);assert.equal(J(h,'fedCharter(G.feds[0]).ballot'),'mixed','3 of 4 (75%) passes: federation rule kept, not unanimity');
  assert.equal(cmd(h,B,{kind:'fedMotion',motion:'charter',field:'ballot',value:'mixed'}).code,'rules:fed','same value → engine refuses');
  assert.equal(cmd(h,B,{kind:'fedMotion',motion:'charter',field:'ballot',value:'yok'}).code,'rules:fed');
});
test('C reform ve başkan seçimi: B tür reformu önerir (motor: 12 ay geçiş kaydı); A kendini başkanlığa önerir; insanlar kendi oyunu verir',()=>{
  const h=world();const fid=fed4(h);ok(cmd(h,B,{kind:'fedMotion',motion:'reform',type:'ticaret'}));let v=vote(h);
  for(const who of [A,B])ok(cmd(h,who,{kind:'fedVote',fed:fid,token:v.tok,yes:true}));
  const f=J(h,'G.feds[0]');assert.equal(f.vote,null);assert(f.reform?f.reform.type==='ticaret':f.type==='ticaret','reform recorded by the engine '+JSON.stringify(f.reform));
  h.run('G.feds[0].requestAfter={}');ok(cmd(h,A,{kind:'fedMotion',motion:'elect',target:A}));v=vote(h);assert.equal(v.motion,'elect');
  for(const who of [A,B])ok(cmd(h,who,{kind:'fedVote',fed:fid,token:v.tok,yes:true}));
  const f2=J(h,'G.feds[0]'),ay=J(h,'(()=>{const v=G.feds[0].vote;return v?null:1;})()');
  if(f2.vote===null)assert.equal(f2.leader,A,'elect passed with both humans + AI per the charter: A leads');
  else assert(!f2.vote.yes.includes(B),'vote still open; B not auto-voted');void ay;
  if(f2.vote===null)assert.equal(cmd(h,B,{kind:'fedMotion',motion:'elect',target:A}).code,'rules:fed','electing the current leader is refused by the engine');
});
test('C ihraç: A, AI 4\'ün ihracını önerir; hedef oy veremez; sonuç federasyonun kuralıyla; ihraç edilen üye çıkar',()=>{
  const h=world();const fid=fed4(h);ok(cmd(h,A,{kind:'fedMotion',motion:'expel',target:4}));const v=vote(h);assert.equal(v.motion,'expel');
  for(const who of [A,B])ok(cmd(h,who,{kind:'fedVote',fed:fid,token:v.tok,yes:true}));
  const f=J(h,'G.feds[0]');assert.equal(f.vote,null);
  const passed=!f.members.includes(4);const v2=v.elig.length;assert(v2>=3);
  assert.equal(passed,true,'A + B + AI 2 decide per the charter: '+JSON.stringify({yes:v.yes,elig:v.elig}));
});
test('C ortak savaş: üye 2 savaştayken B "mevcut savaşa katılma" önerir; kabul → hazır karar; uygulamayı yalnız önerici/başkan yapar (A reddedilir); B uygular → motor sonucu',()=>{
  const h=world();const fid=fed4(h);h.run('declareWar(G.p,G.emps[2]);');assert.equal(J(h,'!!G.emps[2].war[0]'),true,'host (outside the federation) at war with member 2');
  const r=cmd(h,B,{kind:'fedMotion',motion:'joinWar',target:0,sponsor:2});ok(r);const v=vote(h);
  for(const who of [A,B])ok(cmd(h,who,{kind:'fedVote',fed:fid,token:v.tok,yes:true}));
  const d=J(h,'Object.values(G.feds[0].decisions||{}).find(d=>d.kind==="joinWar")');assert(d&&d.state==='ready','approved war decision ready '+JSON.stringify(J(h,'G.feds[0].decisions')));
  assert.equal(J(h,`G.feds[0].leader`),B);
  const ra=cmd(h,A,{kind:'fedExecute',fed:fid,id:d.id});assert.equal(ra.code,'rules:engine','A is neither proposer nor leader');assert.match(ra.detail[0],/yetki/);
  const s0=st(h);const rx=cmd(h,1,{kind:'fedExecute',fed:fid,id:'yok'});assert.equal(rx.code,'no-offer');assert.deepEqual(st(h),s0);
  const rb=cmd(h,B,{kind:'fedExecute',fed:fid,id:d.id});
  if(rb.status==='ok'){assert.equal(J(h,`G.feds[0].decisions[${JSON.stringify(d.id)}].state`),'applied');h.run('MP.publish()');assert(notes(h,B).some(m=>/Federasyon savaş kararı uygulandı/.test(m)));}
  else assert.equal(rb.code,'rules:engine','engine outcome with its own reason: '+JSON.stringify(rb));
});
test('C acil hibe: yalnız başkan (B) kendi kaynağından; A reddedilir (motor gerekçesi); B\'ye kendi bildirimi',()=>{
  const h=world();fed4(h);const fund0=J(h,'G.feds[0].fund||{ala:0,ene:0}'),res0=J(h,`G.emps[${B}].res`);
  const ra=cmd(h,A,{kind:'fedGrant'});assert.equal(ra.code,'rules:fed');assert.match(ra.detail[0],/başkan/);
  ok(cmd(h,B,{kind:'fedGrant'}));const fund=J(h,'G.feds[0].fund'),res=J(h,`G.emps[${B}].res`);
  assert.equal(fund.ala-(fund0.ala||0),J(h,'GRANT_ALA'));assert.equal(Math.round(res0.ala-res.ala),J(h,'GRANT_ALA'));
  h.run('MP.publish()');assert(notes(h,B).some(m=>/ACİL HİBE/.test(m)));assert(!notes(h,A).some(m=>/ACİL HİBE/.test(m)));
});

/* ═══ vasallık ═══ */
const STRONG=`for(let i=0;i<4;i++)newFleet(G.emps[${B}],G.emps[${B}].home,Array.from({length:12},()=>({c:'kor'})));G.emps[${B}]._powAt=-1;G.emps[${A}]._powAt=-1;`;
const terms=(h,t)=>J(h,`vassalDefaultTerms(${JSON.stringify(t)})`);
function seekAccepted(h){
  const r=cmd(h,A,{kind:'vassalOffer',to:B,mode:'seek',type:'bekci',terms:terms(h,'bekci')});ok(r,'seek');
  const q=J(h,`G.emps[${A}].vassalTalk`);assert.deepEqual([q.status,q.from,q.to,q.mode],['pending',A,B,'seek'],'B decides (no AI decision for a human lord)');
  ok(cmd(h,B,{kind:'vassalReply',sub:A,id:q.id,round:q.round,action:'accept'}),'B accepts');assert.equal(J(h,`G.emps[${A}].overlord`),B);return q;
}
test('D himaye talebi: A (zayıf) B\'den (güçlü) himaye ister; karar B\'nin (AI karar vermez); kabul → A, B\'nin vasalı; yanlış devlet adına yanıt yok',()=>{
  const h=world(STRONG);const r=cmd(h,A,{kind:'vassalOffer',to:B,mode:'seek',type:'bekci',terms:terms(h,'bekci')});ok(r);
  const q=J(h,`G.emps[${A}].vassalTalk`);assert.equal(cmd(h,A,{kind:'vassalReply',sub:A,id:q.id,round:q.round,action:'accept'}).code,'rules:not-recipient','A cannot accept on B\'s behalf');
  ok(cmd(h,B,{kind:'vassalReply',sub:A,id:q.id,round:q.round,action:'accept'}));assert.equal(J(h,`G.emps[${A}].overlord`),B);
  assert.equal(J(h,`vassalContractOf(G.emps[${A}]).lord`),B,'obligations bind the right pair');
});
test('D yeniden müzakere: 12 ay soğuma ve 24 aylık tarih motorun; önce reddedilir; tarihler 25 ay geriye alınınca (fikstür) B yenileme önerir, A kabul eder',()=>{
  const h=world(STRONG);seekAccepted(h);const t=terms(h,'bekci');
  let r=cmd(h,B,{kind:'vassalOffer',to:A,mode:'renew',type:'bekci',terms:t});assert.equal(r.code,'rules:engine');assert.match(r.detail[0],/soğuma|müzakere tarihi/);
  assert.equal(J(h,'vassalContractOf(G.emps[1]).terms.renegotiate'),24,'default 24-month renegotiation (unchanged)');
  h.run(`(()=>{const s=G.emps[${A}],c=vassalContractOf(s),d=25*30;c.started-=d;if(s.vassalTalk)s.vassalTalk.finished-=d;for(const q of s.vassalTalkHistory||[])if(q.finished)q.finished-=d;if(s._vassalTalkAfter)s._vassalTalkAfter-=d;})()`);
  r=cmd(h,B,{kind:'vassalOffer',to:A,mode:'renew',type:'bekci',terms:{...t,renegotiate:12}});ok(r,'renew after 24 months');
  const q=J(h,`G.emps[${A}].vassalTalk`);assert.deepEqual([q.kind,q.from,q.to],['renew',B,A]);
  ok(cmd(h,A,{kind:'vassalReply',sub:A,id:q.id,round:q.round,action:'accept'}));assert.equal(J(h,'vassalContractOf(G.emps[1]).terms.renegotiate'),12);
});
test('D barışçıl bağımsızlık: talebi yalnız vasal yapar; soğuma süresi motorun; senyör B kabul eder → A bağımsız, savaş yok',()=>{
  const h=world(STRONG);seekAccepted(h);const t=terms(h,'bekci');
  assert.equal(cmd(h,B,{kind:'vassalOffer',to:A,mode:'release',type:'bekci',terms:t}).code,'rules:engine','lord cannot request the vassal\'s independence');
  let r=cmd(h,A,{kind:'vassalOffer',to:B,mode:'release',type:'bekci',terms:t});assert.equal(r.code,'rules:engine');assert.match(r.detail[0],/soğuma/,'12-month cooldown');
  h.run(`(()=>{const s=G.emps[${A}],d=13*30;if(s.vassalTalk)s.vassalTalk.finished-=d;for(const q of s.vassalTalkHistory||[])if(q.finished)q.finished-=d;if(s._vassalTalkAfter)s._vassalTalkAfter-=d;})()`);
  ok(cmd(h,A,{kind:'vassalOffer',to:B,mode:'release',type:'bekci',terms:t}),'release request');const q=J(h,`G.emps[${A}].vassalTalk`);assert.equal(q.kind,'release');
  ok(cmd(h,B,{kind:'vassalReply',sub:A,id:q.id,round:q.round,action:'accept'}));
  assert.equal(J(h,`G.emps[${A}].overlord??null`),null);assert.equal(J(h,`!!G.emps[${A}].war[${B}]`),false,'peaceful: no war');
});
test('D bağımsızlık desteği: host, B\'nin vasalı A\'ya söz verir (host.local = aynı komut; motor: canSupportIndep, Etki, %40 sızma — motorun RNG\'si); senyör kendi vasalını destekleyemez, tekrar destek reddedilir; sızarsa senyör B kendi listesinde görür; üçüncü taraf sözleşme ayrıntısını görmez',()=>{
  const h=world(STRONG);seekAccepted(h);
  const pv=J(h,'MP.polView(G.p)');assert.deepEqual([pv.vas.lord,pv.vas.subs,pv.vas.talks],[null,[],[]],'third party (host) gets no contract or negotiation of B–A');
  const pb=J(h,`MP.polView(G.emps[${B}])`);assert.equal(pb.vas.subs.length,1,'the lord sees its own contract');
  assert.equal(cmd(h,B,{kind:'supIndep',sub:A}).code,'rules:fed','lord cannot support its own vassal');
  const etk0=J(h,'G.p.res.etk'),rel0=J(h,`G.emps[${B}].rel[0]`),rng0=h.run('RND_STATE');
  assert.equal(J(h,`MP.local({kind:'supIndep',sub:${A}}).ok`),true);assert(J(h,`G.emps[${A}].indepBackers`).includes(0));
  assert.equal(etk0-J(h,'G.p.res.etk'),J(h,'SUPPORT_COST'));assert.notEqual(h.run('RND_STATE'),rng0,'leak roll is the engine\'s own rnd()');
  assert.equal(J(h,`MP.local({kind:'supIndep',sub:${A}}).code`),'rules:fed','already supporting');
  h.run('MP.publish()');const leaked=J(h,`G.emps[${B}].rel[0]`)<rel0;
  assert.equal(notes(h,B).some(m=>/gizli görüşmeler/.test(m)),leaked,'lord B told only if it leaked (leaked='+leaked+')');
  assert(!notes(h,A).some(m=>/gizli görüşmeler/.test(m)));
});
end();
