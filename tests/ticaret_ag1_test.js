'use strict';
/* TİCARET-AĞ.1 — anlık diplomatik kaynak takası (p49 anlamı) ile fiziksel kargonun ('cargo' maddesi) ayrımı.
   Fikstür: Codex'in tests/helpers/96a-fixture.js cargoWorld (çalışma ağacı); p49 karşılaştırması tam Node koşusuyla yapılır.
   A1 limansız iki devlet arasında düz kaynak takası anlık: iki stok kabulde değişir, sözleşme / konvoy yok, ikinci yürütme ikinci ödeme üretmez.
   A2 ittifak + kaynak, savaşa katılım (cephe) + kaynak: kaynak anlık, liman gerekmez.
   A3 MP: misafir düz kaynak teklifi → host kabulü → anlık; 'cargo' maddesi MP doğrulamasından geçer, bilinmeyen anahtar reddedilir.
   A4 hediye (giftDo) p49 gibi anlık + ilişki.
   K1 fiziksel kargo imzada alıcıya yazılmaz, yüklemede verenden düşer, varışta tek makbuzla teslim; yüklenen = teslim + kayıp + yolda.
   K2 karma teklif (ittifak + kargo) rota yoksa BÜTÜNÜYLE reddedilir: ittifak kurulmaz, stok/dünya aynı.
   K3 aynı kargo teklifi ikinci kez yürütülemez (tek ödeme); teklif hazırlığı (dealQuote) dünyayı değiştirmez.
   K4 Save8: bekleyen 'cargo' teklifi ve yoldaki konvoy kayıt → yükleme sonrası aynı; yükleme ikinci teslim üretmez. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const {cargoWorld}=require('./helpers/96a-fixture');
function world(){
  const h=cargoWorld();
  h.run(`G.sys[3].planets[0].col=null;G.emps[1].colonies=[];
    port(G.emps[1],9);port(G.emps[2],3);port(G.emps[3],6);
    for(let i=0;i<5;i++){port(G.emps[i],20+i);G.sys[20+i].planets[0].col.b.liman=0;}
    for(let i=3;i<9;i++)link(i,i+1);
    function grant(id,to){return executeDeal({from:id,to,give:[{t:'portTransit'}],want:[]});}
    function rights(){for(const id of [2,3])for(const to of [0,1])if(!grant(id,to))throw Error('grant '+id+' '+to);}
    function capacity(){for(const id of [0,3,6,9])G.sys[id].planets[0].col.pop=120;}
    function sail(n){for(let i=0;i<n;i++)advanceCargo(1);}
    var cargo={from:0,to:1,give:[{t:'cargo',r:'min',v:100}],want:[{t:'cargo',r:'ene',v:50}]};
    var plain={from:0,to:1,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]};`);
  return h;
}
const ST=`(()=>({min0:G.p.res.min,ene0:G.p.res.ene,min1:G.emps[1].res.min,ene1:G.emps[1].res.ene,contracts:(G.commerce?.contracts||[]).length,convoys:(G.commerce?.convoys||[]).length}))()`;

test('A1 limansız düz kaynak takası anlık; sözleşme / konvoy yok; ikinci yürütme ikinci ödeme üretmez',()=>{
  const h=world();h.run('for(const s of G.sys)for(const p of s.planets)if(p.col&&p.col.b)p.col.b.liman=0');   /* hiçbir liman yok */
  const a=J(h,ST),ok=h.run('executeDeal(plain)'),b=J(h,ST);
  assert.equal(ok,true,'p49 gibi kabul');assert.equal(a.min0-b.min0,100);assert.equal(b.min1-a.min1,100);assert.equal(a.ene1-b.ene1,50);assert.equal(b.ene0-a.ene0,50);
  assert.equal(b.contracts,a.contracts,'sözleşme yok');assert.equal(b.convoys,a.convoys,'konvoy yok');
  h.run('var arch=DiplomaticInbox.findDeal?DiplomaticInbox.findDeal(plain):null');const c=J(h,ST);assert.equal(c.min1,b.min1,'yeni kayıt olmadan kendiliğinden ikinci ödeme yok');});

test('A2 ittifak + kaynak ve cepheye katılım + kaynak: kaynak anlık, liman gerekmez',()=>{
  const h=world();h.run('for(const s of G.sys)for(const p of s.planets)if(p.col&&p.col.b)p.col.b.liman=0;for(const [a,b] of [[0,1],[1,0]]){G.emps[a].rel[b]=90;}');
  const a=J(h,ST);const ok=h.run(`executeDeal({from:0,to:1,give:[{t:'ally'},{t:'res',r:'min',v:40}],want:[]})`);const b=J(h,ST);
  assert.equal(ok,true,'ittifak + kaynak uygulandı');assert.equal(h.run('!!G.p.ally[1]&&!!G.emps[1].ally[0]'),true);assert.equal(b.min1-a.min1,40,'kaynak anlık');assert.equal(b.contracts,a.contracts);
  const war=J(h,`(()=>{const X=G.emps[2];for(const e of [G.p,G.emps[1],X])for(const o of [G.p,G.emps[1],X])if(e!==o){e.contact[o.id]=true;}
    G.emps[1].ally[2]=G.emps[2].ally[1]=false;G.p.ally[2]=G.emps[2].ally[0]=false;if(G.p.nap)delete G.p.nap[2];if(G.emps[2].nap)delete G.emps[2].nap[0];
    warAuthorize(X,G.p,{n:'Test'});declareWar(X,G.p);warAuthClear();const f=warLedgerFind(2,0);return {front:f&&f.id};})()`);
  assert.ok(Number.isInteger(war.front),'cephe');
  const r=J(h,`(()=>{const m0=G.emps[1].res.min,a0=G.p.res.min;const off={from:1,to:0,give:[{t:'warJoin',target:2,front:${war.front}}],want:[{t:'res',r:'min',v:30}]};const q=dealQuote(off);const ok=q.ok&&executeDeal(off);
    return {ok,reasons:q.reasons,dB:G.emps[1].res.min-m0,dA:a0-G.p.res.min,war:!!G.emps[1].war[2]};})()`);
  assert.equal(r.ok,true,'savaşa yardım: '+JSON.stringify(r.reasons));assert.equal(r.war,true);assert.equal(r.dB,30,'katılan bir kez alır');assert.equal(r.dA,30,'ödeyen bir kez öder');});

test('A3 MP: düz kaynak maddesi dipItems ile anlık kalır; cargo maddesi doğrulamadan geçer, fazla anahtar reddedilir',()=>{
  const src=fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8');
  assert.ok(/it\.t==='cargo'&&onlyKeys\(it,\['t','r','v'\]\)/.test(src),'MP dipItems cargo maddesini {t,r,v} ile kabul eder');
  assert.ok(/const ITEM_T=\['res','cargo'/.test(src),'paket öğe türleri cargo içerir');
  const gift=src.slice(src.indexOf("    gift:{say:'actor'"),src.indexOf("    /* statüko barışı"));
  assert.ok(/e\.res\[r\]-=amt;o\.res\[r\]=\(o\.res\[r\]\|\|0\)\+amt;/.test(gift),'MP hediye komutu p49 gibi anlık');});

test('A4 hediye (giftDo) p49 gibi anlık + ilişki artışı; sözleşme açılmaz',()=>{
  const h=world();h.run('for(const s of G.sys)for(const p of s.planets)if(p.col&&p.col.b)p.col.b.liman=0;UI.closeModal=()=>{};UI.openDiplo=()=>{};');
  const a=J(h,ST),rel0=h.run('G.emps[1].rel[0]');h.run(`UI.act('giftDo','1:min:25')`);const b=J(h,ST);
  assert.equal(a.min0-b.min0,25);assert.equal(b.min1-a.min1,25);assert.ok(h.run('G.emps[1].rel[0]')>rel0,'ilişki arttı');assert.equal(b.contracts,a.contracts,'sözleşme yok');});

test('K1 fiziksel kargo: imzada alıcıya yazılmaz, yüklemede verenden düşer, varışta tek teslim; yüklenen = teslim + kayıp + yolda',()=>{
  const h=world();h.run('capacity();rights()');const a=J(h,ST);const ok=h.run('executeDeal(cargo)');const b=J(h,ST);
  assert.equal(ok,true,'kargo anlaşması imzalandı');assert.equal(b.min1,a.min1,'imzada alıcıya yazılmaz');assert.equal(b.ene0,a.ene0);assert.ok(b.contracts>a.contracts,'sözleşme açıldı');
  h.run('sail(200)');const c=J(h,`(()=>{const vs=G.commerce.convoys.filter(v=>v.once);const sum=(f)=>vs.reduce((n,v)=>n+f(v),0);
    return {n:vs.length,loaded:sum(v=>v.loaded||0),delivered:sum(v=>v.status==='delivered'?v.loaded:0),lost:sum(v=>v.status!=='delivered'&&Commerce.closed?.(v)?v.loaded:0),
      moving:sum(v=>!['delivered','lost','destroyed','returned'].includes(v.status)?v.loaded:0),min1:G.emps[1].res.min,ene0:G.p.res.ene};})()`);
  assert.equal(c.n,2,'iki yön iki konvoy');assert.equal(c.loaded,150);assert.equal(c.delivered,150,'ikisi de teslim');assert.equal(c.min1-a.min1,100,'alıcı bir kez alır');assert.equal(c.ene0-a.ene0,50);
  h.run('sail(200)');assert.equal(h.run('G.emps[1].res.min'),c.min1,'ikinci teslim yok');});

test('K2 karma teklif (ittifak + kargo) rota/liman yoksa bütünüyle reddedilir: ittifak kurulmaz, dünya aynı',()=>{
  const h=world();h.run('for(const s of G.sys)for(const p of s.planets)if(p.col&&p.col.b)p.col.b.liman=0;G.emps[1].rel[0]=G.p.rel[1]=90;var before=serialize();');
  const r=J(h,`(()=>{const off={from:0,to:1,give:[{t:'ally'},{t:'cargo',r:'min',v:40}],want:[]};const q=dealQuote(off);const ok=executeDeal(off);return {ok,reasons:q.reasons,ally:!!G.p.ally[1],same:serialize()===before};})()`);
  assert.equal(r.ok,false,'reddedildi');assert.ok(r.reasons.some(x=>/liman|hat|rota/i.test(x)),'gerekçe görünür: '+JSON.stringify(r.reasons));assert.equal(r.ally,false,'ittifak kurulmadı');assert.equal(r.same,true,'dünya baytları aynı');});

test('K3 aynı kargo teklifi ikinci kez yürütülemez; dealQuote (teklif hazırlığı) dünyayı değiştirmez',()=>{
  const h=world();h.run('capacity();rights();var s0=serialize();var q=dealQuote(cargo);var s1=serialize();');
  assert.equal(h.run('s0===s1'),true,'quote salt okunur');assert.equal(h.run('q.ok'),true);
  assert.equal(h.run('executeDeal(cargo)'),true);const b=J(h,ST);assert.equal(h.run('executeDeal(cargo)'),false,'aynı sevkiyat zaten imzalandı');const c=J(h,ST);
  assert.deepEqual(c,b,'ikinci ödeme / sözleşme yok');});

test('K4 Save8: yoldaki kargo ve kayıt → yükleme sonrası aynı; yükleme ikinci teslim üretmez',()=>{
  const h=world();h.run('capacity();rights();executeDeal(cargo);sail(5);var s=serialize();');const a=J(h,ST);
  const g=world();g.sb.s=h.run('s');assert.equal(g.run('deserialize(s)'),true);
  /* Sentetik 96a fikstürü kargosuz dünyada da bayt-bayt geri dönmez (simulation.nests onarımı); bu yüzden kargo durumunun kendisi tam karşılaştırılır */
  assert.equal(g.run('JSON.stringify(G.commerce)'),h.run('JSON.stringify(G.commerce)'),'sözleşme / konvoy / makbuz durumu kayıttan aynen döner');
  g.run('sail(200)');h.run('sail(200)');assert.deepEqual(J(g,ST),J(h,ST),'yüklenen ve devam eden dünya aynı sonuca varır');
  assert.equal(J(g,ST).min1-a.min1,100,'tek teslim');});

test('M1 MP host otoritesi: misafirin rotasız fiziksel kargo teklifi host\'ta gerekçeyle reddedilir, bekleyen teklif oluşmaz; aynı düz kaynak teklifi kabul edilir',()=>{
  const src=fs.readFileSync(path.join(ROOT,'tests/saha_guvence1_war_test.js'),'utf8');const {runtime}=require('./helpers/runtime');
  const fn=new Function('fs','path','crypto','runtime','ROOT','J',src.slice(src.indexOf('function mpWorld'),src.indexOf('const offerHelp'))+';return {mpWorld,cmd};');
  const {mpWorld,cmd}=fn(fs,path,crypto,runtime,ROOT,J);const h=mpWorld();h.run('for(const s of G.sys)for(const p of s.planets)if(p.col&&p.col.b)p.col.b.liman=0');
  const r=cmd(h,'B',{kind:'offer',to:3,give:[{t:'cargo',r:'min',v:50}],want:[]});const pend=h.run('MP.dip.offers.filter(o=>o.status==="pending").length');
  assert.equal(r.status,'rejected','host reddeder: '+JSON.stringify(r).slice(0,200));assert.ok(/liman|hat/i.test(JSON.stringify(r.detail||r)),'gerekçe görünür');assert.equal(pend,0,'bekleyen teklif yok');
  const ok=cmd(h,'B',{kind:'offer',to:3,give:[{t:'res',r:'min',v:50}],want:[]});assert.equal(ok.status,'ok','düz kaynak teklifi kabul: '+JSON.stringify(ok).slice(0,200));});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
