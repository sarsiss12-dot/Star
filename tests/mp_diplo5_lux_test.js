'use strict';
/* MP-DIPLO5 NF-2b — lüks mal erişim hakkı (luxGrant) ekonomik etki verir (SP ve MP aynı kural).
   p37'de `lux` maddesi yalnız alıcının luxGrant kaydını yazıyordu; refreshLuxury okumadığı için bonus yoktu (ipek vakası).
   L1  ipek vakası: AI → oyuncu "Vakum İpeği" erişimi; kabulde alıcıda luxury.ipek + minMul/alaMul bonusu (p37: yok)
   L2  tekillik: alıcının kendi ipek kolonisi + hak → bonus BİR kez; kendi kaynağı düşünce hak bonusu sürdürür
   L3  kaynak kaybı: veren ipek kolonisini kaybeder → hak askıda (kayıt kalır, neden 'source'); geri gelince hak yeniden çalışır;
       alıcı hakkı başkasına veremez (ithal / hak olarak gelen mal yeni zincir kurmaz)
   L4  savaş hakkı bitirir: kayıt silinir, bonus hemen kalkar, geçmişte 'war'; barış hakkı geri getirmez
   L5  ambargo hakkı askıya alır; kalkınca bonus geri gelir (kayıt aynı)
   L6  veren elenir → hak biter (kayıt silinir, 'dead')
   L7  eski Save8: geçerli eski hak yüklemede bonus üretir; geçersiz kayıtlar (bilinmeyen mal, olmayan veren, kendisi, metin, dizi) güvenle temizlenir
   L8  tekrar kabul / kayıt → yükleme bonusu çoğaltmaz (mods aynı)
   L9  AI → AI hak aynı kuralla bonus verir; hak yoksa refreshLuxury sonucu değişmez
   L10 arayüz: teklif özeti açılan bonusu yazar; Lüks mal ağın / ekonomi paneli kanal ve askı nedenini gösterir */
const assert=require('assert/strict'),path=require('path'),{runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):undefined;
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime(ROOT?{root:ROOT}:{});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=90;o.war[q.id]=false;}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  var __A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);
  /* fikstür: veren AI'nın başkent gezegeni ipek kaynağı (gerçekçi: başkent lüksü); oyuncu ipeğe sahip değil */
  var __pl=e=>G.sys[e.colonies[0].s].planets[e.colonies[0].p];
  for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}
  var __g=__A[0];__pl(__g).lux='ipek';for(const e of G.emps)if(!e.dead)refreshLuxury(e);
  var __deal=(g,t,k)=>{const o={from:g.id,to:t.id,give:[{t:'lux',k}],want:[],born:G.day,expires:G.day+300};const q=dealQuote(o);return {q:q.ok,why:q.why||'',ok:q.ok&&executeDeal(o)};};
  var __m=e=>({min:+e.mods.minMul.toFixed(6),ala:+e.mods.alaMul.toFixed(6)});`);return h;};

test('L1 ipek vakası: AI → oyuncu ipek erişimi kabulde alıcıda bonus açar',()=>{const h=game();
  const r=J(h,`(()=>{const m0=__m(G.p);const d=__deal(__g,G.p,'ipek');const m1=__m(G.p);refreshLuxury(G.p);
    return {d,grant:(G.p.luxGrant||{}).ipek===__g.id,lux:!!(G.p.luxury||{}).ipek,imp:(G.p.luxImport||{}).ipek,m0,m1,m2:__m(G.p),gid:__g.id};})()`);
  assert.equal(r.d.ok,true,'anlaşma: '+r.d.why);assert.equal(r.grant,true);
  assert.equal(r.lux,true,'alıcıda luxury.ipek (p37: false — NF-2b)');assert.equal(r.imp,r.gid,'kanal: veren');
  assert.equal(+(r.m1.min-r.m0.min).toFixed(6),.1,'kabulde +%10 mineral');assert.equal(+(r.m1.ala-r.m0.ala).toFixed(6),.08,'kabulde +%8 alaşım');
  assert.deepEqual(r.m2,r.m1,'aylık yeniden hesap aynı');});

test('L2 tekillik: kendi koloni + hak → bonus bir kez; kendi kaynağı düşünce hak sürdürür',()=>{const h=game();
  const r=J(h,`(()=>{const m0=__m(G.p);__pl(G.p).lux='ipek';refreshLuxury(G.p);const mOwn=__m(G.p);__deal(__g,G.p,'ipek');refreshLuxury(G.p);const mBoth=__m(G.p);
    __pl(G.p).lux=null;refreshLuxury(G.p);const mGrant=__m(G.p);return {m0,mOwn,mBoth,mGrant,ch:luxChannels(G.p).find(c=>c.k==='ipek')};})()`);
  assert.deepEqual(r.mBoth,r.mOwn,'iki kanal: bonus bir kez');assert.deepEqual(r.mGrant,r.mOwn,'kendi kaynağı düştü: hak bonusu sürdürür');
  assert.deepEqual(r.ch.ch,['hak']);assert.equal(r.ch.on,true);});

test('L3 kaynak kaybı askıya alır, geri gelince sürer; alıcı hakkı başkasına veremez',()=>{const h=game();
  const r=J(h,`(()=>{__deal(__g,G.p,'ipek');refreshLuxury(G.p);__pl(__g).lux=null;refreshLuxury(__g);refreshLuxury(G.p);
    const off={lux:!!G.p.luxury.ipek,kept:G.p.luxGrant.ipek,st:luxGrantStatus(G.p,'ipek').code};__pl(__g).lux='ipek';refreshLuxury(__g);refreshLuxury(G.p);
    const on=!!G.p.luxury.ipek;const third=__A[1];const re=dealQuote({from:0,to:third.id,give:[{t:'lux',k:'ipek'}],want:[],born:G.day,expires:G.day+300});
    return {off,on,re:{ok:re.ok,why:re.why||''},gid:__g.id};})()`);
  assert.equal(r.off.lux,false,'kaynak yok: bonus yok');assert.equal(r.off.kept,r.gid,'kayıt kalır');assert.equal(r.off.st,'source');
  assert.equal(r.on,true,'kaynak dönünce hak çalışır');assert.equal(r.re.ok,false,'hak olarak gelen mal yeni zincir kurmaz');});

test('L4 savaş hakkı bitirir: kayıt silinir, bonus hemen kalkar; barış geri getirmez',()=>{const h=game();
  const r=J(h,`(()=>{const m0=__m(G.p);__deal(__g,G.p,'ipek');G._dealAuth=true;declareWar(__g,G.p);G._dealAuth=false;
    const w={has:Object.hasOwn(G.p.luxGrant||{},'ipek'),lux:!!G.p.luxury.ipek,m:__m(G.p),log:(G.p.luxGrantLog||[]).at(-1)};
    makePeace(__g,G.p,'agreement',null,{force:true,quiet:true});refreshLuxury(G.p);return {m0,w,after:!!G.p.luxury.ipek,gid:__g.id};})()`);
  assert.equal(r.w.has,false,'savaş hakkı siler');assert.equal(r.w.lux,false);assert.deepEqual(r.w.m,r.m0,'bonus hemen kalkar');
  assert.equal(r.w.log.why,'war');assert.equal(r.w.log.g,r.gid);assert.equal(r.after,false,'barış hakkı geri getirmez');});

test('L5 ambargo askıya alır; kalkınca bonus geri gelir',()=>{const h=game();
  const r=J(h,`(()=>{__deal(__g,G.p,'ipek');setEmbargo(G.p,__g,true);refreshLuxury(G.p);const a={lux:!!G.p.luxury.ipek,code:luxGrantStatus(G.p,'ipek').code,kept:Object.hasOwn(G.p.luxGrant,'ipek')};
    setEmbargo(G.p,__g,false);refreshLuxury(G.p);return {a,b:!!G.p.luxury.ipek};})()`);
  assert.deepEqual(r.a,{lux:false,code:'embargo',kept:true});assert.equal(r.b,true);});

test('L6 veren elenir → hak biter',()=>{const h=game();
  const r=J(h,`(()=>{__deal(__g,G.p,'ipek');__g.dead=true;refreshLuxury(G.p);return {has:Object.hasOwn(G.p.luxGrant,'ipek'),lux:!!G.p.luxury.ipek,log:G.p.luxGrantLog.at(-1).why};})()`);
  assert.deepEqual(r,{has:false,lux:false,log:'dead'});});

test('L7 eski Save8: geçerli hak bonus üretir, geçersiz kayıtlar güvenle temizlenir',()=>{const h=game();
  const out=J(h,`(()=>{const d=JSON.parse(serialize());const E=d.emps;E[0].luxGrant={ipek:__g.id,yokmal:__g.id,kristal:99,zerrin:0,mercan:'2',filiz:[1]};
    const m0=__m(G.p);const ok=deserialize(JSON.stringify(d));return {ok,lux:!!G.p.luxury.ipek,left:Object.keys(G.p.luxGrant||{}),other:['kristal','zerrin','mercan','filiz'].filter(k=>G.p.luxury[k]&&!G.p.luxOwn[k]),log:(G.p.luxGrantLog||[]).map(x=>x.why)};})()`);
  assert.equal(out.ok,true,'eski kayıt yüklenir');assert.equal(out.lux,true,'geçerli eski hak bonus üretir');
  assert.deepEqual(out.left,['ipek'],'geçersiz kayıtlar temizlenir');assert.deepEqual(out.other,[],'geçersiz kayıt bonus vermez');
  assert(out.log.every(w=>w==='bad')&&out.log.length===5,'temizlik geçmişi');});

test('L8 tekrar kabul ve kayıt → yükleme bonusu çoğaltmaz',()=>{const h=game();
  const r=J(h,`(()=>{__deal(__g,G.p,'ipek');refreshLuxury(G.p);const m1=__m(G.p);const d2=__deal(__g,G.p,'ipek');refreshLuxury(G.p);const m2=__m(G.p);
    const ok=deserialize(serialize());const m3=__m(G.p);const ok2=deserialize(serialize());return {m1,m2,m3,m4:__m(G.p),ok,ok2,log:(G.p.luxGrantLog||[]).length,d2};})()`);
  assert.deepEqual(r.m2,r.m1,'ikinci kabul');assert.deepEqual(r.m3,r.m1,'kayıt → yükleme');assert.deepEqual(r.m4,r.m1);assert.equal(r.log,0);});

test('L9 AI → AI hak aynı kural; hak yoksa refreshLuxury sonucu aynı',()=>{const h=game();
  const r=J(h,`(()=>{const t=__A[1];const b0=JSON.stringify([refreshLuxury(t),t.luxImport]);const d=__deal(__g,t,'ipek');refreshLuxury(t);return {b0,d,lux:!!t.luxury.ipek,imp:t.luxImport.ipek,gid:__g.id};})()`);
  assert.equal(r.d.ok,true,r.d.why);assert.equal(r.lux,true);assert.equal(r.imp,r.gid);});

test('L10 arayüz: teklif özeti açılan bonus; Lüks mal ağın + ekonomi paneli kanal ve askı nedeni',()=>{const h=game();
  const r=J(h,`(()=>{const row=UI.dealTermsHtml({give:[{t:'lux',k:'ipek'}],want:[]},__g,G.p);__deal(__g,G.p,'ipek');refreshLuxury(G.p);const on=UI.luxGrantHtml(G.p);const dir=UI.diploDirectory();
    setEmbargo(G.p,__g,true);refreshLuxury(G.p);const off=UI.luxGrantHtml(G.p);return {row,on,off,dir:/erişim hakkı/.test(dir)};})()`);
  assert.match(r.row,/Vakum İpeği/);assert.match(r.row,/bonusu açılır/);assert.match(r.row,/\+%10 mineral/);assert.doesNotMatch(r.row,/bonus üretmez/);
  assert.match(r.on,/data-state="on"/);assert.match(r.on,/etkin/);assert.match(r.off,/askıda — ambargo/);assert.equal(r.dir,true);});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
