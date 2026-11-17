'use strict';
/* MP-SYNC-FED.0 S1 — Barıştırma son onayı: asıl teklifin istihbarat şartı (dipAssetGate) ikinci aşamada da denetlenir.
   p38 kusuru: normal MP kabulü "İstiyorum" teknoloji / lüks için İZLENİYOR şartını yeniden denetler; iki aşamalı Barıştırma'nın son onay dalı
   yalnız dealQuote çağırıyordu → ilk kabulden sonra aracının istihbaratı düşse de diğer savaşanın onayı lüks / teknoloji aktarımını yapıyordu.
   W1 ilk kabul → aracının (C) B üzerindeki istihbaratı İZLENİYOR altına düşer → D onaylar: hiçbir şey uygulanmaz (barış yok, lüks yok, ödeme yok),
      işlem iki tarafta gerekçeyle kapanır; D'ye giden metin aracının istihbaratını / pazarlık ayrıntısını söylemez (p38: lüks + barış uygulanıyordu)
   W2 aynı durum süpürmede (D henüz dokunmadan): yayında kapanır, D'nin kartı "koşullar değişti" der, C ve B ayrıntılı nedeni görür
   W3 istisna: istenen madde karşı tarafın önceki teklifinde AÇIKÇA sunulmuşsa (karşı teklif zinciri) istihbarat düşse de son onay geçer;
      bu istisna MP paketi → yeni host sonrasında da korunur
   W4 olumlu yol: şartlar geçerliyken paket → YENİ host → D onayı → barış + lüks + ödeme birlikte, bir kez; ikinci onay "closed"
   W5 ret / geri çekme / çift dokunuş / gecikmiş onay (savaş başka yolla bitti) — hiçbir şey uygulanmaz, ikinci etki yok
   W6 cephe değişti / taraf elendi / birleşik teklifin maddesi geçersiz → kapanır, kısmi uygulama yok; D'ye ayrıntı gitmez */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
const crypto=require('crypto');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
/* beta-fed-found0-mp-world ile aynı kurulum; kök seçilebilir (p38 kontrol kökünde yeniden üretim) */
function world(){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'fed0',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:23});for(const [c,e]of [['B',1],['C',3],['D',4]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}if(!MP.start().ok)throw Error('start');var seq={};G.feds=[];for(const e of G.emps){e.overlord=null;e.civics=[];}
  for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}if(isPurifier(e)){e.mizac='militarist';delete e._pers;}e.intel={};}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [0,1,2,3,4])G.emps[id].res[r]=5000;
  var __pl=e=>G.sys[e.colonies[0].s].planets[e.colonies[0].p];for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}
  __pl(G.emps[1]).lux='ipek';for(const e of G.emps)if(!e.dead)refreshLuxury(e);
  G._dealAuth=true;declareWar(G.emps[1],G.emps[4]);G._dealAuth=false;G.emps[3].intel[1]=3;var __F=()=>peaceWithFront(G.emps[1],G.emps[4]);`);return h;}
function cmd(h,c,x){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:'fed0'+c+String(s).padStart(6,'0'),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result')||{};}
const notesTo=(h,c,n0)=>h.sb.out.slice(n0).filter(([to])=>to===c).map(([,t])=>t).join('\n');
const W=h=>J(h,'({war:!!G.emps[1].war[4],lux:!!((G.emps[3].luxGrant||{}).ipek),cmin:G.emps[3].res.min,bmin:G.emps[1].res.min})');
/* C aracı: B'den lüks ister + B'nin D ile savaşını bitirmesini; karşılık 300 mineral. B kabul eder → mediating */
const start=(h,opt={})=>{const f=J(h,'__F()');let O;
  if(opt.counter){/* karşı teklif zinciri: B önce C'ye lüksü AÇIKÇA sunar, C karşı teklifle aynı maddeyi ister */
    const r0=cmd(h,'B',{kind:'offer',to:3,give:[{t:'lux',k:'ipek'}],want:[{t:'res',r:'min',v:500}]});assert.equal(r0.status,'ok',JSON.stringify(r0));const P=J(h,'MP.dip.offers.at(-1)');
    const rc=cmd(h,'C',{kind:'counter',offer:P.id,give:[{t:'res',r:'min',v:300}],want:[{t:'lux',k:'ipek'},{t:'peaceWith',target:4,front:f}]});assert.equal(rc.status,'ok',JSON.stringify(rc));
    O=J(h,'MP.dip.offers.at(-1)');}
  else{const r0=cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:300}],want:[{t:'lux',k:'ipek'},{t:'peaceWith',target:4,front:f}]});assert.equal(r0.status,'ok',JSON.stringify(r0));O=J(h,'MP.dip.offers.at(-1)');}
  const r1=cmd(h,'B',{kind:'respond',offer:O.id,action:'accept'});assert.equal(r1.status,'ok',JSON.stringify(r1));
  const s=J(h,`({O:MP.dip.offers.find(x=>x.id===${O.id})})`);assert.equal(s.O.status,'mediating');return {O:s.O,L:s.O.med.link,f};};
const st=(h,id)=>J(h,`MP.dip.offers.find(x=>x.id===${id})`);

test('W1 ilk kabulden sonra aracının istihbaratı düşer → D onayı hiçbir şey uygulamaz; iki tarafta gerekçe; D\'ye ayrıntı gitmez',()=>{const h=world();const w0=W(h);const {O,L}=start(h);
  h.run('G.emps[3].intel[1]=1;');const n0=h.sb.out.length;const r=cmd(h,'D',{kind:'respond',offer:L,action:'accept'});
  const w1=W(h);assert.deepEqual(w1,w0,'p38: barış + lüks + ödeme uygulanıyordu — hiçbir madde uygulanmamalı ('+JSON.stringify(r)+')');
  assert.notEqual(r.status,'ok');const toD=notesTo(h,'D',n0)+JSON.stringify(r);assert.equal(/İZLENİYOR|istihbarat|Vakum|ipek|lüks|mineral/i.test(toD),false,'D\'ye aracının istihbaratı / pazarlık ayrıntısı gitmez: '+toD.slice(0,300));
  h.run('MP.publish&&MP.publish();');assert.equal(st(h,O.id).status,'invalid','asıl işlem kapanır');assert.equal(st(h,L).status,'invalid');
  assert.match(st(h,O.id).why,/İZLENİYOR|istihbarat/,'aracı / veren gerçek nedeni görür');});

test('W2 süpürme: D dokunmadan istihbarat düşer → yayında kapanır; D genel neden, C/B ayrıntılı neden',()=>{const h=world();const w0=W(h);const {O,L}=start(h);
  h.run('G.emps[3].intel[1]=0;');const n0=h.sb.out.length;h.run('MP.publish&&MP.publish();');
  const o=st(h,O.id),l=st(h,L);assert.equal(o.status,'invalid');assert.equal(l.status,'invalid');assert.match(o.why,/İZLENİYOR|istihbarat/);
  assert.equal(/İZLENİYOR|istihbarat|ipek|lüks/i.test(l.why+notesTo(h,'D',n0)),false,'D\'nin kaydı / bildirimi genel: '+l.why);
  assert.deepEqual(W(h),w0);});

test('W3 istisna: istenen madde karşı tarafın önceki teklifinde açıkça sunulmuşsa son onay geçer; paket → yeni host sonrasında da',()=>{const h=world();const w0=W(h);const {O,L}=start(h,{counter:true});
  h.run('G.emps[3].intel[1]=0;');h.run('MP.publish&&MP.publish();');assert.equal(st(h,O.id).status,'mediating','istisna: kapanmaz');
  h.run('var pkg=MP.snapshot({}).pkg;');const b=runtime({root:ROOT});b.sb.pkg=J(h,'pkg');b.sb.rand=k=>'ab'.repeat(k);b.sb.out=[];
  b.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));b.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error(valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();MP.publish&&MP.publish();`);
  assert.equal(J(b,`MP.dip.offers.find(x=>x.id===${O.id}).status`),'mediating','yeni host\'ta istisna korunur');
  const r=cmd(h,'D',{kind:'respond',offer:L,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));
  const w1=W(h);assert.equal(w1.war,false);assert.equal(w1.lux,true);assert.equal(w0.cmin-w1.cmin,300,'karşılık bir kez');});

test('W4 olumlu yol: paket → yeni host → D onayı → barış + lüks + ödeme bir kez; ikinci onay closed',()=>{const h=world();const w0=W(h);const {O,L}=start(h);
  h.run('var pkg=MP.snapshot({}).pkg;');const b=runtime({root:ROOT});b.sb.pkg=J(h,'pkg');b.sb.rand=k=>'ab'.repeat(k);b.sb.out=[];
  b.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));b.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error(valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();`);
  assert.deepEqual(J(b,`[MP.dip.offers.find(x=>x.id===${O.id}).status,MP.dip.offers.find(x=>x.id===${L}).status]`),['mediating','pending']);
  const r=cmd(h,'D',{kind:'respond',offer:L,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));const w1=W(h);
  assert.deepEqual({war:w1.war,lux:w1.lux,paid:w0.cmin-w1.cmin,got:w1.bmin-w0.bmin},{war:false,lux:true,paid:300,got:300});
  assert.equal(cmd(h,'D',{kind:'respond',offer:L,action:'accept'}).code,'rules:closed');assert.deepEqual(W(h),w1,'ikinci etki yok');});

test('W5 ret / geri çekme / çift dokunuş / gecikmiş onay: hiçbir şey uygulanmaz',()=>{
  let h=world(),w0=W(h);let s=start(h);assert.equal(cmd(h,'D',{kind:'respond',offer:s.L,action:'reject'}).status,'ok');assert.equal(cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'}).code,'rules:closed');assert.deepEqual(W(h),w0,'ret');
  h=world();w0=W(h);s=start(h);assert.equal(cmd(h,'C',{kind:'withdraw',offer:s.O.id}).status,'ok');assert.equal(cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'}).code,'rules:closed');assert.deepEqual(W(h),w0,'geri çekme');
  h=world();w0=W(h);s=start(h);const a=cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'}),b2=cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'});assert.equal(a.status,'ok');assert.notEqual(b2.status,'ok');
  const w1=W(h);assert.equal(w0.cmin-w1.cmin,300,'çift dokunuş tek ödeme');
  h=world();w0=W(h);s=start(h);h.run('makePeace(G.emps[1],G.emps[4],"agreement",null,{force:true,quiet:true});G.day+=20;G._dealAuth=true;declareWar(G.emps[1],G.emps[4]);G._dealAuth=false;');
  const late=cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'});assert.notEqual(late.status,'ok');const w2=W(h);assert.equal(w2.war,true,'yeni savaş sürer');assert.equal(w2.lux,false);assert.equal(w2.cmin,w0.cmin);});

test('W6 cephe değişti / taraf elendi / birleşik maddenin kaynağı kayboldu → kapanır, kısmi yok, D\'ye ayrıntı yok',()=>{
  for(const [k,code] of [['elendi','G.emps[4].dead=true;'],['kaynak','__pl(G.emps[1]).lux=null;refreshLuxury(G.emps[1]);']]){const h=world();const w0=W(h);const s=start(h);h.run(code);
    const n0=h.sb.out.length;const r=cmd(h,'D',{kind:'respond',offer:s.L,action:'accept'});h.run('MP.publish&&MP.publish();');
    assert.notEqual(r.status,'ok',k);assert.equal(st(h,s.O.id).status,'invalid',k);const w1=W(h);assert.equal(w1.lux,false,k);assert.equal(w1.cmin,w0.cmin,k+' ödeme yok');
    assert.equal(/ipek|lüks|Vakum|mineral|elinde değil/i.test(notesTo(h,'D',n0)+JSON.stringify(r)+st(h,s.L).why),false,k+': D\'ye pazarlık ayrıntısı gitmez');}});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
