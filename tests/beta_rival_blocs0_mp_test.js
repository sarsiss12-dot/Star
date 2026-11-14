'use strict';
/* BETA-RIVAL-BLOCS.0 — MP: misafir insanlar ittifaksız kuruluşu ve ittifaksız üye davetini GERÇEK mp-core komutlarıyla yapar.
   Host her adımı motorun kendi işlevinde yeniden denetler; çift komut ikinci federasyon / bedel yaratmaz. */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const unally=(h,ids)=>h.run(`for(const a of ${JSON.stringify(ids)})for(const b of ${JSON.stringify(ids)})if(a!==b)G.emps[a].ally[b]=false;`);
test('M1 misafir B, misafir C ile ittifaksız kuruluş: fedFoundStart → C fedFoundReply → B fedFoundFinish; ittifak + federasyon birlikte, tek bedel, çift son onay reddedilir',()=>{
  const h=world();unally(h,[1,3]);h.run('var e0=G.emps[1].res.etk');
  const q=cmd(h,'B',{kind:'fedFoundPlan',type:'askeri',ballot:'equal',members:[3]});assert.equal(q.status,'ok',JSON.stringify(q));
  const s=cmd(h,'B',{kind:'fedFoundStart',type:'askeri',ballot:'equal',members:[3]});assert.equal(s.status,'ok',JSON.stringify(s));
  const id=h.run('G.fedFounding.proposals.find(p=>p.by===1).id');
  assert.equal(h.run('G.emps[1].ally[3]||G.emps[3].ally[1]'),false);
  assert.equal(cmd(h,'C',{kind:'fedFoundReply',id,accept:true}).status,'ok');
  const f=cmd(h,'B',{kind:'fedFoundFinish',id});assert.equal(f.status,'ok',JSON.stringify(f));
  assert.deepEqual(J(h,'findFed(G.emps[1]).members'),[1,3]);assert.equal(h.run('G.emps[1].ally[3]&&G.emps[3].ally[1]'),true);
  assert.equal(h.run('e0-G.emps[1].res.etk'),h.run('fedFoundCost(G.emps[1])'));
  const again=cmd(h,'B',{kind:'fedFoundFinish',id});assert.notEqual(again.status,'ok');assert.equal(h.run('G.feds.length'),1);assert.equal(h.run('e0-G.emps[1].res.etk'),h.run('fedFoundCost(G.emps[1])'));
});
test('M2 misafir C reddeder: federasyon ve ittifak yok; misafir B yetkisiz yanıt veremez',()=>{
  const h=world();unally(h,[1,3]);cmd(h,'B',{kind:'fedFoundStart',type:'askeri',ballot:'equal',members:[3]});const id=h.run('G.fedFounding.proposals.find(p=>p.by===1).id');
  assert.notEqual(cmd(h,'B',{kind:'fedFoundReply',id,accept:true}).status,'ok','öneren kendi adına yanıt vermez');
  assert.equal(cmd(h,'C',{kind:'fedFoundReply',id,accept:false}).status,'ok');assert.notEqual(cmd(h,'B',{kind:'fedFoundFinish',id}).status,'ok');
  assert.equal(h.run('G.feds.length'),0);assert.equal(h.run('G.emps[1].ally[3]||G.emps[3].ally[1]'),false);
});
test('M3 ittifaksız üye daveti: misafir B federasyonuna ittifaksız misafir D\'yi fedInvite ile önerir; oy + D fedReply kabul → üyelik ve bütün üyelerle ittifak; ikinci kabul reddedilir',()=>{
  const h=world();unally(h,[1,3,4]);h.run('G.emps[1].ally[3]=G.emps[3].ally[1]=true;');
  cmd(h,'B',{kind:'fedFoundStart',type:'askeri',ballot:'equal',members:[3]});const id=h.run('G.fedFounding.proposals.find(p=>p.by===1).id');cmd(h,'C',{kind:'fedFoundReply',id,accept:true});cmd(h,'B',{kind:'fedFoundFinish',id});
  h.run('var F=findFed(G.emps[1]);F.nextVote=G.day+9999;');assert.equal(h.run('G.emps[4].ally[1]||G.emps[4].ally[3]'),false);
  const r=cmd(h,'B',{kind:'fedInvite',target:4});assert.equal(r.status,'ok',JSON.stringify(r));
  const token=h.run('fedVoteToken(F.vote)');for(const c of ['B','C'])cmd(h,c,{kind:'fedVote',fed:h.run('F.id'),token,yes:true});
  if(h.run('!!F.vote'))h.run('fedResolveVote(F)');
  assert.ok(h.run('!!F.invites[4]'),'oydan sonra D için davet');assert.equal(h.run('findFed(G.emps[4])'),null,'insan adına kabul yok');
  assert.equal(cmd(h,'D',{kind:'fedReply',fed:h.run('F.id'),action:'accept'}).status,'ok');
  assert.equal(h.run('findFed(G.emps[4])===F'),true);assert.equal(h.run('[1,3].every(id=>G.emps[4].ally[id]&&G.emps[id].ally[4])'),true);
  assert.notEqual(cmd(h,'D',{kind:'fedReply',fed:h.run('F.id'),action:'accept'}).status,'ok');assert.equal(h.run('F.members.filter(x=>x===4).length'),1);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
