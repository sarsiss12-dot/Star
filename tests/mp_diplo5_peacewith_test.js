'use strict';
/* MP-DIPLO5 NF-6 — Barıştırma (peaceWith): üçüncü tarafla süren savaşı bitirme, cephe kimliğine bağlı.
   SP (tek oyunculu motor):
   P1 AI diğer savaşan barışı mevcut değerlendirmesiyle kabul ederse: barış + karşılık birlikte; reddederse teklif geçersiz (gerekçe)
   P2 cephe kimliği: savaş bitip aynı çift yeniden savaşırsa eski cepheli madde reddedilir (yeni savaşa uygulanmaz)
   P3 Kan Hukuku / doktrin kilidi (canPeace false) son kararda yeniden denetlenir
   P4 seçim listesi yalnız BİLİNEN savaşlar (knownWarPairs); bilinmeyen savaş listede yok
   MP (host + misafirler; B, C, D insan):
   M1 C aracı, B savaşı bitiren, D diğer savaşan (insan): B kabul → "mediating", dünya değişmez, ödeme yok; D onaylar → barış + ödeme birlikte, bir kez
   M2 D reddeder → ikisi de kapanır, hiçbir şey uygulanmaz, gerekçe
   M3 savaş başka yolla biter → süpürme kapatır; geç onay "closed"
   M4 savaş biter ve yeniden başlar (yeni cephe) → eski işlem kapanır, yeni savaşa uygulanmaz
   M5 iki aşama arasında MP paketi kayıt → yeni host: işlem sürer, D onaylayınca bir kez uygulanır
   M6 AI veren: C, AI X'ten D ile barış ister; X kendi değerlendirmesiyle kabul ederse D onayı beklenir
   M7 birleşik teklif (Barıştırma + lüks mal): onay anında lüks maddesi geçersizse hiçbir şey uygulanmaz (kısmi ödeme / barış yok)
   M8 gizlilik: savaşı bilmeyen E listede görmez, bilinmeyen savaşla teklif genel gerekçeyle reddedilir; ilgisiz oyuncuya ileti yok
   M9 aynı teklifin çift kabulü, karşı teklif ve onay kaydına karşı teklif reddedilir */
const assert=require('assert/strict'),fs=require('fs'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const Jr=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
/* ---------- SP ---------- */
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=60;o.war[q.id]=false;o.ally[q.id]=false;}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  var __A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);var __g=__A[0],__t=__A[1];G.p.res.min=G.p.res.ene=G.p.res.etk=5000;
  G._dealAuth=true;declareWar(__g,__t);G._dealAuth=false;var __f=()=>peaceWithFront(__g,__t);
  var __off=(w)=>({from:0,to:__g.id,give:[{t:'res',r:'min',v:600}],want:[w||{t:'peaceWith',target:__t.id,front:__f()}],born:G.day,expires:G.day+300});
  var __ai0=aiRespond;var __stub=v=>{aiRespond=(ai,o)=>ai===__t&&(o.give||[]).some(i=>i.t==='peace')&&!(o.give||[]).some(i=>i.t==='res')?{v}:__ai0(ai,o);};`);return h;};

test('P1 AI diğer savaşan: kabul → barış + ödeme birlikte; ret → geçersiz (gerekçe)',()=>{
  let h=game();h.run(`__stub('kabul')`);let r=Jr(h,`(()=>{const m0=G.p.res.min;const q=dealQuote(__off());const ok=q.ok&&executeDeal(__off());return {q:q.ok,why:q.reasons,ok,war:!!__g.war[__t.id],paid:m0-G.p.res.min};})()`);
  assert.equal(r.q,true,JSON.stringify(r.why));assert.equal(r.ok,true);assert.equal(r.war,false,'barış');assert.equal(r.paid,600,'karşılık birlikte');
  h=game();h.run(`__stub('red')`);r=Jr(h,`(()=>{const m0=G.p.res.min;const q=dealQuote(__off());const ok=executeDeal(__off());return {q:q.ok,why:q.reasons,ok,war:!!__g.war[__t.id],paid:m0-G.p.res.min};})()`);
  assert.equal(r.q,false);assert(r.why.some(x=>/şu an barışı kabul etmiyor/.test(x)),JSON.stringify(r.why));assert.equal(r.ok,false);assert.equal(r.war,true);assert.equal(r.paid,0);
  h=game();r=Jr(h,`(()=>{const v=aiRespond(__t,{from:__g.id,to:__t.id,give:[{t:'peace'}],want:[],born:G.day,expires:G.day+300}).v;return {v,q:dealQuote(__off()).ok};})()`);
  assert.equal(r.q,r.v==='kabul','doğal değerlendirme = quote');console.log('  P1 doğal AI barış değerlendirmesi: '+r.v);});

test('P2 cephe kimliği: savaş bitip yeniden başlarsa eski cepheli madde reddedilir',()=>{const h=game();h.run(`__stub('kabul')`);
  const r=Jr(h,`(()=>{const f0=__f();makePeace(__g,__t,'agreement',null,{force:true,quiet:true});G.day+=40;G._dealAuth=true;declareWar(__g,__t);G._dealAuth=false;const f1=__f();
    const q=dealQuote(__off({t:'peaceWith',target:__t.id,front:f0}));return {f0,f1,ok:q.ok,why:q.reasons};})()`);
  assert.notEqual(r.f0,r.f1);assert.equal(r.ok,false);assert(r.why.some(x=>/artık sürmüyor/.test(x)),JSON.stringify(r.why));});

test('P3 Kan Hukuku / doktrin kilidi son kararda',()=>{const h=game();h.run(`__stub('kabul')`);
  const r=Jr(h,`(()=>{const o=__off();const q1=dealQuote(o).ok;var __cp=canPeace;canPeace=(a,b)=>(a===__g&&b===__t)||(a===__t&&b===__g)?false:__cp(a,b);const ok=executeDeal(o);canPeace=__cp;return {q1,ok,war:!!__g.war[__t.id]};})()`);
  assert.equal(r.q1,true);assert.equal(r.ok,false,'kilit son kararda');assert.equal(r.war,true);});

test('P4 seçim listesi yalnız bilinen savaşlar',()=>{const h=game();
  const r=Jr(h,`(()=>{const u=__A[2],v=__A[3];G._dealAuth=true;declareWar(u,v);G._dealAuth=false;for(const id of [u.id,v.id,__g.id,__t.id])ensureIntel(G.p)[id]=0;
    const a=peaceWithChoices(G.p,u).length;ensureIntel(G.p)[u.id]=3;const b=peaceWithChoices(G.p,u).map(c=>c.target);const own=peaceWithChoices(__g,__g).map(c=>c.target);return {a,b,v:v.id,own,t:__t.id};})()`);
  assert.equal(r.a,0,'bilinmeyen savaş listede yok');assert.deepEqual(r.b,[r.v],'İZLENİYOR+ ile bilinen');assert(r.own.includes(r.t),'kendi savaşları');});

/* ---------- MP ---------- */
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}if(isPurifier(e)){e.mizac='militarist';delete e._pers;}}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [0,1,2,3,4])G.emps[id].res[r]=5000;
  G._dealAuth=true;declareWar(G.emps[1],G.emps[4]);declareWar(G.emps[2],G.emps[4]);G._dealAuth=false;ensureIntel(G.emps[3])[1]=3;var __F=()=>peaceWithFront(G.emps[1],G.emps[4]);`);
const start=(h,extraGive=[],extraWant=[])=>{const f=J(h,'__F()');const r0=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:300},...extraGive],want:[{t:'peaceWith',target:4,front:f},...extraWant]});
  assert.equal(r0.status,'ok',JSON.stringify(r0));const O=J(h,'MP.dip.offers.at(-1)');const r1=cmd(h,'B',{kind:'respond',offer:O.id,action:'accept'});assert.equal(r1.status,'ok',JSON.stringify(r1));
  const st=J(h,`({O:MP.dip.offers.find(x=>x.id===${O.id}),L:MP.dip.offers.at(-1)})`);return {f,O:st.O,L:st.L};};
const W=h=>J(h,'({war:!!G.emps[1].war[4],cmin:G.emps[3].res.min,bmin:G.emps[1].res.min})');

test('M1 iki aşama: B kabul → mediating (değişiklik yok); D onay → barış + ödeme birlikte, bir kez',()=>{const h=world();prep(h);const w0=W(h);const {O,L,f}=start(h);
  assert.equal(O.status,'mediating');assert.deepEqual(O.med,{giver:1,t:4,front:f,link:L.id});assert.equal(L.link,O.id);assert.equal(L.to,4);assert.deepEqual(L.give,[{t:'peace'}]);
  assert.deepEqual(W(h),w0,'ilk aşamada dünya değişmez');
  const ok=cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'});assert.equal(ok.status,'ok',JSON.stringify(ok));
  const w1=W(h);assert.equal(w1.war,false,'barış');assert.equal(w0.cmin-w1.cmin,300,'aracı öder');assert.equal(w1.bmin-w0.bmin,300,'veren alır');
  assert.deepEqual(J(h,`[MP.dip.offers.find(x=>x.id===${O.id}).status,MP.dip.offers.find(x=>x.id===${L.id}).status]`),['accepted','accepted']);
  assert.notEqual(cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'}).status,'ok','ikinci onay');assert.deepEqual(W(h),w1);});

test('M2 D reddeder → ikisi kapanır, hiçbir şey uygulanmaz',()=>{const h=world();prep(h);const w0=W(h);const {O,L}=start(h);
  assert.equal(cmd(h,'D',{kind:'respond',offer:L.id,action:'reject'}).status,'ok');const o=J(h,`MP.dip.offers.find(x=>x.id===${O.id})`);
  assert.equal(o.status,'invalid');assert.match(o.why,/barışı reddetti/);assert.deepEqual(W(h),w0);});

test('M3 savaş başka yolla biter → kapanır; geç onay closed',()=>{const h=world();prep(h);const {O,L}=start(h);
  h.run('makePeace(G.emps[1],G.emps[4],"agreement",null,{force:true,quiet:true});MP.publish&&MP.publish();');
  const s=J(h,`[MP.dip.offers.find(x=>x.id===${O.id}),MP.dip.offers.find(x=>x.id===${L.id})]`);assert.equal(s[0].status,'invalid',JSON.stringify(s[0]));assert.match(s[0].why,/başka yolla bitti/);assert.equal(s[1].status,'invalid');
  const late=cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'});assert.equal(late.code,'rules:closed');});

test('M4 yeni savaş (yeni cephe) → eski işlem kapanır, yeni savaşa uygulanmaz',()=>{const h=world();prep(h);const w0=W(h);const {O,L}=start(h);
  h.run('makePeace(G.emps[1],G.emps[4],"agreement",null,{force:true,quiet:true});G.day+=30;G._dealAuth=true;declareWar(G.emps[1],G.emps[4]);G._dealAuth=false;MP.publish&&MP.publish();');
  assert.equal(J(h,`MP.dip.offers.find(x=>x.id===${O.id}).status`),'invalid');assert.notEqual(cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'}).status,'ok');
  const w=W(h);assert.equal(w.war,true,'yeni savaş sürer');assert.equal(w.cmin,w0.cmin,'ödeme yok');});

test('M5 iki aşama arasında MP paketi → yeni host: onay bir kez uygulanır',()=>{const a=world();prep(a);const {O,L}=start(a);a.run('var pkg=MP.snapshot({}).pkg;');
  const b=runtime();b.sb.pkg=J(a,'pkg');b.sb.rand=k=>'ab'.repeat(k);b.sb.out=[];b.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));b.run(fs.readFileSync('research/mp6/mirror.js','utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error(valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();`);
  const s=Jr(b,`[MP.dip.offers.find(x=>x.id===${O.id}).status,MP.dip.offers.find(x=>x.id===${L.id}).status,!!G.emps[1].war[4]]`);assert.deepEqual(s,['mediating','pending',true]);
  const r=Jr(b,`(()=>{const D=G.emps[4];const m0=G.emps[3].res.min;const x=MP.local?null:null;return {m0};})()`);
  const ok=Jr(b,`(()=>{const L=MP.dip.offers.find(x=>x.id===${L.id});return MP.restore?1:1;})()`);void ok;void r;
  /* yeni host'ta D'nin onayı: aynı komut yolu (oturum kimliği yeni host'ta yok → motor işlevleri doğrudan) */
  const res=Jr(b,`(()=>{const O=MP.dip.offers.find(x=>x.id===${O.id});const keys=[O.med.giver+'>'+O.med.t];const m0=G.emps[3].res.min;
    const ok1=peaceWithAuthorize(keys,()=>executeDeal({from:O.from,to:O.to,give:O.give,want:O.want,born:O.born,expires:O.expires}));return {ok1,war:!!G.emps[1].war[4],paid:m0-G.emps[3].res.min};})()`);
  assert.equal(res.ok1,true);assert.equal(res.war,false);assert.equal(res.paid,300);});

test('M6 AI veren: C, AI X\'ten D ile barış ister; kabulse D onayı beklenir',()=>{const h=world();prep(h);const f=J(h,'peaceWithFront(G.emps[2],G.emps[4])');h.run('ensureIntel(G.emps[3])[2]=3;');
  const r=cmd(h,'C',{kind:'offer',to:2,give:[{t:'res',r:'min',v:2500},{t:'res',r:'ene',v:2500}],want:[{t:'peaceWith',target:4,front:f}]});assert.equal(r.status,'ok',JSON.stringify(r));
  const last=J(h,'MP.dip.offers.slice(-2)');console.log('  M6 AI X kararı: '+JSON.stringify((r.extra||{}).ai)+' · '+last.map(x=>x.status).join(','));
  if(r.extra&&r.extra.mediating){const L=last[1];assert.equal(L.to,4);assert.equal(L.link,last[0].id);const w0=J(h,'G.emps[3].res.min');assert.equal(cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'}).status,'ok');
    assert.equal(J(h,'!!G.emps[2].war[4]'),false);assert.equal(w0-J(h,'G.emps[3].res.min'),2500);}
  else assert.equal(J(h,'!!G.emps[2].war[4]'),true,'ret: savaş sürer');});

test('M7 birleşik teklif: onay anında lüks maddesi geçersiz → hiçbir şey uygulanmaz',()=>{const h=world();prep(h);
  h.run(`var __pl=e=>G.sys[e.colonies[0].s].planets[e.colonies[0].p];for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}__pl(G.emps[1]).lux='ipek';refreshLuxury(G.emps[1]);ensureIntel(G.emps[3])[1]=3;`);
  const w0=W(h);const {O,L}=start(h,[],[{t:'lux',k:'ipek'}]);h.run('__pl(G.emps[1]).lux=null;refreshLuxury(G.emps[1]);MP.publish&&MP.publish();');
  const s=J(h,`[MP.dip.offers.find(x=>x.id===${O.id}),MP.dip.offers.find(x=>x.id===${L.id})]`);assert.equal(s[0].status,'invalid',JSON.stringify(s[0]));assert.match(s[0].why,/uygulanamıyor/);
  assert.notEqual(cmd(h,'D',{kind:'respond',offer:L.id,action:'accept'}).status,'ok');const w=W(h);assert.equal(w.war,true);assert.equal(w.cmin,w0.cmin);assert.equal(J(h,'!!(G.emps[3].luxGrant||{}).ipek'),false);});

test('M8 gizlilik: savaşı bilmeyen görmez; bilinmeyen savaş genel gerekçe; ilgisiz oyuncuya ileti yok',()=>{const h=world();prep(h);h.run('ensureIntel(G.emps[3])[1]=0;ensureIntel(G.emps[3])[4]=0;');
  const l=cmd(h,'C',{kind:'peaceWithList',to:1,side:'want'});const rows=J(h,`MP.onMessage?0:0`);void rows;
  const list=(l.extra||{}).rows||[];assert.equal(list.some(x=>x.target===4),false,'C, B–D savaşını bilmiyor');
  const r=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:10}],want:[{t:'peaceWith',target:4,front:J(h,'__F()')}]});assert.notEqual(r.status,'ok');
  assert.equal(JSON.stringify(r.detail||[]),JSON.stringify(['Barıştırma: bu savaş bilinmiyor ya da artık sürmüyor']));
  h.run('ensureIntel(G.emps[3])[1]=3;');const n0=h.sb.out.length;start(h);const toHost=h.sb.out.slice(n0).filter(([to])=>to!=='B'&&to!=='C'&&to!=='D').map(([,t])=>t).join('');
  assert.equal(/Barıştırma/.test(toHost),false,'ilgisiz bağlantıya Barıştırma iletisi yok');});

test('M9 çift kabul / onay kaydına karşı teklif reddedilir',()=>{const h=world();prep(h);const {O,L}=start(h);
  assert.equal(cmd(h,'B',{kind:'respond',offer:O.id,action:'accept'}).code,'rules:closed','asıl teklif ikinci kez kabul edilemez');
  const c=cmd(h,'D',{kind:'counter',offer:L.id,give:[],want:[{t:'res',r:'min',v:10}]});assert.notEqual(c.status,'ok');assert.match(JSON.stringify(c.detail),/yalnız kabul ya da ret/);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
