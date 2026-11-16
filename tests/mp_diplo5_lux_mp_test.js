'use strict';
/* MP-DIPLO5 NF-2b — MP: lüks erişim hakkının etkisini yetkili host üretir; ayna yalnız o oyuncuya açık bilgiyi taşır.
   M1 misafir C, misafir B'den ipek erişimi alır (gerçek offer/respond); host'ta C.luxury.ipek; C'nin aynasında mpLuxGrant.ipek ok;
      aynadan kurulan misafir dünyasında luxury.ipek + aynı mineral çarpanı (host ile eşit); ilgisiz D'nin aynasında hak bilgisi yok
   M2 B kaynağını kaybeder (host) → C aynasında hak askıda 'source' ve misafir dünyasında bonus yok; misafir B'nin gizli kolonisini bilmese de
      host kararı geçerli (ayna B'nin ipek gezegenini göstermese bile)
   M3 aynı kabul tekrar (aynı cid) / ikinci tam ayna / yeniden kurulum bonusu çoğaltmaz; savaşta hak biter ve C'nin aynasında 'war' geçmişi (veren π) */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [1,3,4])G.emps[id].res[r]=5000;
  var __pl=e=>G.sys[e.colonies[0].s].planets[e.colonies[0].p];
  for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}
  __pl(G.emps[1]).lux='ipek';for(const e of G.emps)if(!e.dead)refreshLuxury(e);ensureIntel(G.emps[3])[1]=2;`);
const guest=m=>{const g=runtime();g.sb.__t=JSON.stringify(m);assert.equal(g.run('deserialize(__t)'),true,'misafir aynayı kurar');return g;};
const accept=h=>{assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:20}],want:[{t:'lux',k:'ipek'}]}).status,'ok');const o=J(h,'MP.dip.offers.at(-1)');
  const r=cmd(h,'B',{kind:'respond',offer:o.id,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));return o;};

test('M1 host hak etkisini üretir; C aynası + misafir dünyası aynı bonus; D görmez',()=>{const h=world();prep(h);
  const m0=J(h,'G.emps[3].mods.minMul');accept(h);
  const host=J(h,'({lux:!!G.emps[3].luxury.ipek,min:G.emps[3].mods.minMul})');assert.equal(host.lux,true);assert.equal(+(host.min-m0).toFixed(6),.1);
  const mc=J(h,'StarsMirror.build(3)');assert.deepEqual(mc.emps[0].mpLuxGrant,{ipek:{ok:true}});
  const g=guest(mc);const gv=J(g,'({lux:!!G.p.luxury.ipek,min:G.p.mods.minMul,ch:luxChannels(G.p).find(c=>c.k==="ipek").ch})');
  assert.equal(gv.lux,true,'misafir dünyasında bonus');assert.equal(+gv.min.toFixed(6),+host.min.toFixed(6),'misafir çarpanı host ile aynı');assert.deepEqual(gv.ch,['hak']);
  const md=J(h,'StarsMirror.build(4)');assert.equal(JSON.stringify(md).includes('mpLuxGrant'),false,'D aynasında hak durumu yok');
  assert.equal(Object.values(md.emps).some(e=>e&&e.luxGrant&&Object.keys(e.luxGrant).length),false,'D, B→C hakkını görmez');
});

test('M2 B kaynağını kaybeder → C aynasında askıda (source), misafir dünyasında bonus yok',()=>{const h=world();prep(h);accept(h);
  h.run('__pl(G.emps[1]).lux=null;refreshLuxury(G.emps[1]);refreshLuxury(G.emps[3]);');
  const mc=J(h,'StarsMirror.build(3)');assert.deepEqual(mc.emps[0].mpLuxGrant,{ipek:{ok:false,code:'source'}});
  const g=guest(mc);assert.equal(J(g,'!!G.p.luxury.ipek'),false);assert.match(J(g,'UI.luxGrantHtml(G.p)'),/askıda — veren bu malın kendi kaynağını kaybetti/);
  /* host kararı kaynak: B'nin ipek gezegeni geri gelir ama misafir aynası bunu göstermese de host 'ok' der */
  h.run('__pl(G.emps[1]).lux="ipek";refreshLuxury(G.emps[1]);refreshLuxury(G.emps[3]);');const m2=J(h,'StarsMirror.build(3)');
  m2.emps[0].mpLuxGrant.ipek.ok===true||assert.fail('host ok');for(const s of m2.sys||[])for(const p of (s&&s.planets)||[])if(p&&p.lux==='ipek')delete p.lux;
  assert.equal(J(guest(m2),'!!G.p.luxury.ipek'),true,'misafir host kararını kullanır');
});

test('M3 tekrar kabul / tam ayna yeniden kurulum çoğaltmaz; savaş hakkı bitirir (geçmiş π)',()=>{const h=world();prep(h);const o=accept(h);
  const again=cmd(h,'B',{kind:'respond',offer:o.id,action:'accept'});assert.notEqual(again.status,'ok','ikinci kabul uygulanmaz');
  const a=J(guest(J(h,'StarsMirror.build(3)')),'G.p.mods.minMul'),b=J(guest(J(h,'StarsMirror.build(3)')),'G.p.mods.minMul');assert.equal(a,b);
  assert.equal(J(h,'G.emps[3].mods.minMul'),a,'host = misafir');
  h.run('G._dealAuth=true;declareWar(G.emps[1],G.emps[3]);G._dealAuth=false;');
  const mc=J(h,'StarsMirror.build(3)');assert.equal(Object.keys(mc.emps[0].mpLuxGrant||{}).length,0,'hak bitti');
  const log=mc.emps[0].luxGrantLog.at(-1);const bLocal=J(h,'(()=>{const m=StarsMirror.build(3);return m.emps.findIndex(e=>e&&e.name===G.emps[1].name);})()');
  assert.equal(log.why,'war');assert.equal(log.g,bLocal,'veren kimliği misafir bakışında (π)');
  assert.equal(J(guest(mc),'!!G.p.luxury.ipek'),false);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
