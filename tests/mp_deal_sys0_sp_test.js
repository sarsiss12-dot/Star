'use strict';
/* MP-DEAL-SYS.0 — tek oyunculu yol (MP yok): S1 tek dokunuş İttifak Daveti AI'ya motorun dealQuote → aiRespond → executeDeal yoluyla;
   sonuç satır durumunda, kabulde ittifak kurulur; doktrin engeli gerekçeli. S2 bekleyen federasyon işleri: bekleyen oy, ret sonrası
   düzenlenebilir kurucu taslağı, uygulanabilir karar; bitmiş karar listelenmez. S3 Savaş Merkezi aday kartı: uygunluk/neden, kaynak ve
   toprak vaadi şartı satırı, Destek İste doğru cepheye. S4 teklif özeti: Sistem Devri sonucu + Toprak Vaadi farkı + haraç toplamı. */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(o!==G.p&&!o.wild){G.p.contact[o.id]=o.contact[G.p.id]=true;G.p.rel[o.id]=o.rel[G.p.id]=80;for(const q of G.emps)if(q!==o&&!q.wild)o.contact[q.id]=true;}G.p.res.etk=9000;
  for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);`);return h;};

test('S1 tek dokunuş İttifak Daveti (AI): kanonik karar yolu; sonuç satırda; kabulde ittifak; doktrin engeli gerekçeli',()=>{
  const h=game();const r=J(h,`(()=>{const out=[];for(const o of G.emps.filter(o=>o.ai&&!o.wild&&!o.dead)){UI.allyInviteSend(o.id);const st=UI.allyInviteState(o.id);out.push({id:o.id,state:st.state,text:st.text,ally:!!G.p.ally[o.id]});}return out;})()`);
  assert(r.length>0);for(const x of r){assert(['accepted','rejected','countered','error'].includes(x.state),JSON.stringify(x));assert(x.text.length>0);assert.equal(x.ally,x.state==='accepted','kabul ⇔ ittifak');}
  const ban=J(h,`(()=>{const o=G.emps.find(o=>o.ai&&!o.wild&&!o.dead&&!G.p.ally[o.id]);const c0=canAlly;canAlly=()=>false;try{UI._allyInv={};UI.allyInviteSend(o.id);return UI.allyInviteState(o.id);}finally{canAlly=c0;}})()`);
  assert.equal(ban.state,'error');assert.match(ban.text,/Doktrin/);
});

test('S2 bekleyen federasyon işleri: bekleyen oy, ret sonrası kadro düzenleme, uygulanabilir karar; bitmiş karar yok',()=>{
  const h=game();const r=J(h,`(()=>{const ai=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal',defense:'auto'},politicsVersion:96,leader:0,founder:0,members:[0,ai[0].id],laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds.push(f);federationIdentity(f);f.vote={id:1,kind:'law',law:'arastirma',yes:[ai[0].id],no:[],opened:G.day,expires:G.day+60,proposer:ai[0].id};
    f.decisions={a:{id:'a',kind:'newWar',target:ai[1].id,by:0,state:'ready',expires:G.day+30},b:{id:'b',kind:'newWar',target:ai[1].id,by:0,state:'done',expires:G.day+30},c:{id:'c',kind:'newWar',target:ai[1].id,by:0,state:'ready',expires:G.day-1}};
    G.fedFounding={v:1,next:2,proposals:[{id:1,by:0,type:'askeri',ballot:'equal',members:[0,ai[2].id,ai[3].id],replies:{[ai[2].id]:{status:'rejected'},[ai[3].id]:{status:'accepted'}},status:'pending',expires:G.day+100,born:G.day}]};
    return UI.fedPendingItems(f).map(x=>[x.kind,x.a,x.x]);})()`);
  assert.deepEqual(r.map(x=>x[0]).sort(),['decision','found','vote'],JSON.stringify(r));assert(r.some(x=>x[1]==='fedVoteNow'));assert(r.some(x=>x[1]==='fedFoundEdit'));
  assert.equal(r.filter(x=>x[0]==='decision').length,1,'bitmiş / süresi geçmiş karar listelenmez');
  const html=J(h,'UI.fedPendingHtml(G.feds.at(-1))');assert.match(html,/BEKLEYEN İŞLER \(3\)/);
});

test('S3 Savaş Merkezi aday kartı: uygunluk / neden, kaynak + toprak vaadi satırı; Destek İste doğru cepheye',()=>{
  const h=game();const r=J(h,`(()=>{const ai=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);const t=ai[0];declareWar(G.p,t);let f=warLedgerFind(0,t.id);
    if(!f)return {skip:'cephe yok'};WarCenterUI.status={id:f.id,sides:[0,t.id],campaign:f.campaign,ended:null};let H0='';const om=UI.openModal,sr=UI.surfaceRender;UI.openModal=h=>{H0=h;};UI.surfaceRender=(el,h)=>{H0=h;};try{WarCenterUI.support(f.id,0);}finally{UI.openModal=om;UI.surfaceRender=sr;}
    const asks=[...H0.matchAll(/data-a="warCenterAsk" data-x="([^"]+)"/g)].map(m=>m[1]),ids=[...H0.matchAll(/data-cand="([0-9]+)"/g)].map(m=>+m[1]);
    return {f:f.id,t:t.id,head:H0,cards:ids.map((id,i)=>({id,ask:asks[i]}))};})()`);
  assert(!r.skip,'fikstür cephesi: '+r.skip);
  assert.match(r.head,/verebileceklerin/);assert.match(r.head,/toprak vaadine/);assert.match(r.head,/supGate/);assert(r.cards.length>0);for(const c of r.cards)assert.equal(c.ask,r.f+':'+r.t+':'+c.id,'düğme doğru cepheye');
});

test('S4 teklif özeti: Sistem Devri sonucu (kabul anında, yeni sahip), Toprak Vaadi farkı, haraç toplam yükü',()=>{
  const h=game();const html=J(h,`(()=>{const o=G.emps.find(o=>o.ai&&!o.wild&&!o.dead);const s=G.sys.find(s=>s.owner===0&&s.id!==G.p.home)||(()=>{const x=G.sys.find(s=>s.owner<0&&G.sys[G.p.home].lanes.includes(s.id));territoryOwnerSet(x,0);return x;})();
    const d={from:0,to:o.id,give:[{t:'sys',id:s.id},{t:'tribute',r:'min',v:15}],want:[{t:'landPromise',sys:o.home,front:1}]};return UI.dealTermsHtml(d,G.p,o);})()`);
  assert.match(html,/Sistem Devri/);assert.match(html,/kabul anında/);assert.match(html,/yeni sahip/);assert.match(html,/toplam yük 1800/);assert.match(html,/Toprak Vaadi/);assert.match(html,/kabulde devir YOK/);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
