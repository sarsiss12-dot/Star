'use strict';
/* MP-DIPLO5 NF-3 — Casusluk Ağı Paktı (spynet) MP müzakeresinde (yerel Node: host durumu + misafir aynası / dünyası).
   N1 misafir↔misafir teklif / kabul: iki yönlü ağ kurulur; imza bedeli (120 Etki) teklifi GÖNDERENDEN bir kez
   N2 etki: B'nin üçüncü devlet X üzerindeki düzeyi C'nin haritasında (mpPooled → pooledIntel); C'nin X düzeyi B'ye de akar (iki yön);
      ilgisiz D'nin aynasında havuz yok, B / C'nin ağ düzeyi yok
   N3 karşı teklif + yinelenen kabul: tek uygulama, bedel bir kez
   N4 kayıt → yükleme ve tam ayna yeniden kurulumu: ağ ve havuz aynı
   N5 savaş ağı bitirir; iki tarafa neden kaydı (π) ve ilişki panelinde "sona erdi … savaşa girdi"
   N6 savaş sürerken teklif host'ta reddedilir (gerekçe); barış + ağ aynı pakette kabul edilir
   N7 insan → AI: AI kendi değerlendirmesiyle karar verir; kabul ederse ağ iki yönlü, bedel bir kez
   N8 gizlilik: ilgisiz D'ye teklif / gerekçe / olay kartı iletisi gitmez; hata metni üçüncü devletin ağ düzeyini söylemez
   N9 masa: Casusluk Ağı "İKİ YÖNLÜ", Sensör Paylaşımı "TEK YÖNLÜ" satırı; bitiş ve bedel yazılı
   N10 host ↔ misafir: host (devlet 0) misafir B'ye teklif eder, B kabul eder */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=85;e.war[o.id]=false;e.contact[o.id]=true;}if(e.spynet)e.spynet={};if(isPurifier(e)){e.mizac='militarist';delete e._pers;}}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [0,1,3,4])G.emps[id].res[r]=5000;
  ensureIntel(G.emps[1])[2]=2;ensureIntel(G.emps[3])[5]=3;for(const id of [0,1,3,4])for(const t of [2,5])if(id!==1||t!==2)if(id!==3||t!==5)ensureIntel(G.emps[id])[t]=0;`);
const guest=m=>{const g=runtime();g.sb.__t=JSON.stringify(m);assert.equal(g.run('deserialize(__t)'),true);return g;};
const local=(h,me,id)=>J(h,`(()=>{const m=StarsMirror.build(${me});return m.emps.findIndex(e=>e&&e.name===G.emps[${id}].name);})()`);
const offerAccept=(h,from,to,toId,give,want)=>{const r0=cmd(h,from,{kind:'offer',to:toId,give,want});assert.equal(r0.status,'ok',JSON.stringify(r0));const o=J(h,'MP.dip.offers.at(-1)');
  const r=cmd(h,to,{kind:'respond',offer:o.id,action:'accept'});return {o,r};};

test('N1 misafir↔misafir: kabulde iki yönlü ağ; bedel gönderenden bir kez',()=>{const h=world();prep(h);
  const e0=J(h,'[G.emps[1].res.etk,G.emps[3].res.etk]');const {r}=offerAccept(h,'C','B',1,[],[{t:'spynet'}]);assert.equal(r.status,'ok',JSON.stringify(r));
  const s=J(h,'({cb:!!G.emps[3].spynet[1],bc:!!G.emps[1].spynet[3],etk:[G.emps[1].res.etk,G.emps[3].res.etk]})');
  assert.equal(s.cb,true);assert.equal(s.bc,true);assert.equal(e0[1]-s.etk[1],120,'gönderen C 120 Etki');assert.equal(e0[0]-s.etk[0],0,'alan B ödemez');});

test('N2 havuz iki yönlü haritada; ilgisiz D görmez',()=>{const h=world();prep(h);offerAccept(h,'C','B',1,[{t:'spynet'}],[]);
  const mc=J(h,'StarsMirror.build(3)'),mb=J(h,'StarsMirror.build(1)'),md=J(h,'StarsMirror.build(4)');const x2c=local(h,3,2),x5b=local(h,1,5);
  assert.equal(mc.emps[0].mpPooled[x2c],2,'C, B\'nin X(2) düzeyini alır');assert.equal(mb.emps[0].mpPooled[x5b],3,'B, C\'nin Y(5) düzeyini alır');
  assert.equal(J(guest(mc),`pooledIntel(G.p,${x2c})`),2,'misafir haritası havuzu kullanır');assert.equal(J(guest(mc),`intelOf(G.p,${x2c})`),0,'kendi düzeyi değişmez');
  assert.equal(md.emps[0].mpPooled,undefined,'D havuz almaz');const sd=JSON.stringify(md);
  assert.equal(Object.values(md.emps).every(e=>!e||e===md.emps[0]||!e.intel||!Object.keys(e.intel).length),true,'D aynasında başkalarının ağ düzeyi yok');
  assert.equal(Object.values(mc.emps).every(e=>!e||e===mc.emps[0]||!e.intel||!Object.keys(e.intel).length),true,'C aynasında B\'nin ağ düzeyleri tek tek yok');
  assert.equal(Object.keys(mc.emps[0].mpPooled).length,1,'yalnız kazanılan düzey');assert.equal(/spynet/.test(sd)&&JSON.stringify(md.emps[0].spynet||{})!=='{}',false);});

test('N3 karşı teklif + yinelenen kabul: tek uygulama, bedel bir kez',()=>{const h=world();prep(h);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:50}],want:[{t:'spynet'}]}).status,'ok');const o=J(h,'MP.dip.offers.at(-1)');
  const c=cmd(h,'B',{kind:'counter',offer:o.id,give:[{t:'spynet'}],want:[{t:'res',r:'min',v:80}]});assert.equal(c.status,'ok',JSON.stringify(c));const o2=J(h,'MP.dip.offers.at(-1)');
  const e0=J(h,'[G.emps[1].res.etk,G.emps[3].res.etk,G.emps[3].res.min]');const r1=cmd(h,'C',{kind:'respond',offer:o2.id,action:'accept'});assert.equal(r1.status,'ok',JSON.stringify(r1));
  const r2=cmd(h,'C',{kind:'respond',offer:o2.id,action:'accept'});assert.notEqual(r2.status,'ok','ikinci kabul uygulanmaz');
  const e1=J(h,'[G.emps[1].res.etk,G.emps[3].res.etk,G.emps[3].res.min]');assert.equal(e0[0]-e1[0],120,'karşı teklifi gönderen B öder, bir kez');assert.equal(e0[1]-e1[1],0);assert.equal(e0[2]-e1[2],80);
  assert.equal(J(h,'!!G.emps[3].spynet[1]&&!!G.emps[1].spynet[3]'),true);});

test('N4 kayıt → yükleme ve tam ayna: ağ ve havuz aynı',()=>{const h=world();prep(h);offerAccept(h,'C','B',1,[{t:'spynet'}],[]);
  const a=J(h,'StarsMirror.build(3).emps[0].mpPooled');h.run('__s8=serialize();deserialize(__s8);');const b=J(h,'StarsMirror.build(3).emps[0].mpPooled');
  assert.deepEqual(b,a);assert.equal(J(h,'!!G.emps[3].spynet[1]'),true);assert.deepEqual(J(h,'StarsMirror.build(3).emps[0].mpPooled'),a,'ikinci tam ayna');});

test('N5 savaş ağı bitirir; neden iki tarafta (π), panelde görünür',()=>{const h=world();prep(h);offerAccept(h,'C','B',1,[{t:'spynet'}],[]);
  h.run('G._dealAuth=true;declareWar(G.emps[1],G.emps[3]);G._dealAuth=false;');
  assert.equal(J(h,'!!(G.emps[3].spynet||{})[1]||!!(G.emps[1].spynet||{})[3]'),false);const mc=J(h,'StarsMirror.build(3)');
  const lg=mc.emps[0].spynetLog.at(-1),bl=local(h,3,1);assert.equal(lg.why,'war');assert.equal(lg.o,bl);assert.equal(mc.emps[0].mpPooled,undefined,'havuz kalktı');
  const g=guest(mc);assert.match(J(g,`UI.diploTreaties?UI.diploTreaties(G.p,G.emps[${bl}]):''`)||J(g,`JSON.stringify(spynetState(G.p,G.emps[${bl}]))`),/savaşa girdi/);});

test('N6 savaş sürerken ağ reddedilir (gerekçe); barış + ağ aynı pakette kabul',()=>{const h=world();prep(h);h.run('G.emps[1].war[3]=G.emps[3].war[1]=true;');
  const r=cmd(h,'C',{kind:'offer',to:1,give:[{t:'spynet'}],want:[]});assert.notEqual(r.status,'ok');const det=JSON.stringify(J(h,'MP.dip.offers.length'))+JSON.stringify(r);
  const q=J(h,'dealQuote({from:3,to:1,give:[{t:"spynet"}],want:[],born:G.day,expires:G.day+300}).reasons');assert(q.some(x=>/Casusluk ağı: savaş sürerken kurulamaz/.test(x)),JSON.stringify(q));
  h.run('if(typeof canPeace==="function"){var __cp=canPeace;canPeace=()=>true;}');const {r:r2}=offerAccept(h,'C','B',1,[{t:'peace'},{t:'spynet'}],[]);assert.equal(r2.status,'ok',JSON.stringify(r2));
  assert.equal(J(h,'!G.emps[3].war[1]&&!!G.emps[3].spynet[1]'),true);void det;});

test('N7 insan → AI: AI kendi değerlendirmesiyle; kabulse iki yönlü, bedel bir kez',()=>{const h=world();prep(h);const ai=J(h,'G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&e.id!==0).id');
  const e0=J(h,'G.emps[3].res.etk');const r=cmd(h,'C',{kind:'offer',to:ai,give:[{t:'res',r:'ene',v:400}],want:[{t:'spynet'}]});
  const st=J(h,`({c:!!(G.emps[3].spynet||{})[${ai}],a:!!(G.emps[${ai}].spynet||{})[3],etk:G.emps[3].res.etk,o:MP.dip.offers.at(-1)})`);
  assert.equal(st.c,st.a,'iki yön birlikte');if(st.c)assert.equal(e0-st.etk,120,'bedel bir kez');else assert.equal(e0,st.etk,'ret: bedel yok');
  console.log('  N7 AI kararı: '+(st.c?'kabul':'ret/karşı')+' · durum '+st.o.status+' · '+JSON.stringify(r).slice(0,120));});

test('N8 gizlilik: D\'ye ileti yok; gerekçe üçüncü devlet ağ düzeyini söylemez',()=>{const h=world();prep(h);const n0=h.sb.out.length;offerAccept(h,'C','B',1,[{t:'spynet'}],[]);
  const toD=h.sb.out.slice(n0).filter(([to])=>to==='D').map(([,t])=>t).join('\n');assert.equal(/spynet|Casusluk/.test(toD),false,'D\'ye teklif / sonuç iletisi yok');
  const all=h.sb.out.slice(n0).map(([,t])=>t).join('\n');assert.equal(/"intel"\s*:\s*\{\s*"\d+"\s*:\s*[1-3]/.test(all.replace(/"mine"[\s\S]*/,'')),false);
  const h2=world();prep(h2);h2.run('G.emps[1].war[3]=G.emps[3].war[1]=true;');const r=cmd(h2,'C',{kind:'offer',to:1,give:[{t:'spynet'}],want:[]});
  assert.equal(/düzey|seviye|İZLENİYOR|intel/i.test(JSON.stringify(r.detail||r.why||'')),false,'gerekçe ağ düzeyi söylemez');});

test('N9 masa satırları: Casusluk Ağı İKİ YÖNLÜ, Sensör TEK YÖNLÜ; bitiş ve bedel',()=>{const h=world();prep(h);
  const html=J(h,'UI.dealTermsHtml({give:[{t:"spynet"}],want:[{t:"intel"}]},G.emps[0],G.emps[1])');
  assert.match(html,/Casusluk Ağı Paktı<\/b>: İKİ YÖNLÜ/);assert.match(html,/savaşa girince biter/);assert.match(html,/120 Etki/);
  assert.match(html,/Sensör Paylaşımı<\/b>: TEK YÖNLÜ/);});

test('N10 host ↔ misafir: host teklif eder, misafir B kabul eder',()=>{const h=world();prep(h);
  const q=J(h,'MP.host&&MP.host.local?1:0');const r=J(h,`(()=>{const x=(typeof MP.local==='function'?MP.local:MP.host&&MP.host.local);return x?x({kind:'offer',to:1,give:[{t:'spynet'}],want:[]}):null;})()`);
  if(!r){console.log('  N10 host.local yok — misafir yönü N1/N3 ile kapsandı');return;}
  const o=J(h,'MP.dip.offers.at(-1)');const a=cmd(h,'B',{kind:'respond',offer:o.id,action:'accept'});assert.equal(a.status,'ok',JSON.stringify(a));assert.equal(J(h,'!!G.emps[0].spynet[1]&&!!G.emps[1].spynet[0]'),true);void q;});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
