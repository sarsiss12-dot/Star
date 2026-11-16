'use strict';
/* MP-WARON.0 — Genel Savaş Sözü (warOn) çok oyunculu müzakerede: son tarihli söz (insan veren), kabulde savaş İLAN EDİLMEZ.
   W1 misafir C → misafir B: söz + karşılık; B karşı teklifte son tarihi değiştirir; C kabul eder → tek söz kaydı (karşı teklifin tarihiyle),
      savaş yok, karşılık bir kez; ikinci kabul yok
   W2 C savaşı normal savaş ilanı komutuyla açar → söz "tutuldu", iki tarafa bildirim
   W3 son tarih geçer → "çiğnendi": B 'paktBozdu' hatırlar, B'nin ilişkisi −20, kamu haberinde hedefin adı yok
   W4 imkânsızlaşma: hedef elenir → "düştü" (ceza yok); son tarihte Konsey yasağı → "düştü" (ceza yok)
   W5 geçersiz şartlar: insan veren son tarihsiz, AI veren son tarihli, geçmiş tarih, taraflardan birine karşı, zaten savaşta, aynı söz ikinci kez;
      bekleyen teklifte söz uygulanamaz olursa teklif gerekçeyle geçersizleşir
   W6 birleşik teklif (kaynak + Sistem Devri + Haraç + söz): söz geçersizse hiçbir madde uygulanmaz
   W7 ayna / gizlilik: veren ve alan sözü görür (π kimlikleri), hedef ve üçüncü taraf görmez; teklif hedefin diplomasi görünümünde yok
   W8 kayıt: Save8 gidiş-dönüşte aynı söz, aynı kalan süre; yüklemeden sonra süre dolumu bir kez işlenir
   W9 insan → AI: misafirin AI'dan istediği söz (son tarihsiz) motorun aiRespond kararıyla; misafirin AI'ya verdiği son tarihli söz
      kabulde kayıt olur; aynı cid yeniden gönderim tek teklif */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const X=5;   /* hedef AI */
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=40;e.war[o.id]=false;e.contact[o.id]=true;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
  for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,3);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);e.tribute=[];}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [1,3,4])G.emps[id].res[r]=5000;G.p.res.etk=9000;G.emps[5].mizac='militarist';delete G.emps[5]._pers;`);   /* fikstür: hedef AI izolasyonist değil (motor her anlaşmayı yasaklar) */
const last=h=>J(h,'MP.dip.offers.at(-1)');
const day=h=>J(h,'Math.floor(G.day)');
const heard=(h,c,re)=>h.sb.out.some(([to,t])=>to===c&&re.test(t));   /* not uzak insanın aynası / görünümü (log) üzerinden gider */

test('W1 söz + karşılık: karşı teklifte son tarih değişir, kabulde tek söz kaydı (savaş yok), karşılık bir kez, ikinci kabul yok',()=>{
  const h=world();prep(h);const d0=day(h);
  const o=cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+90}],want:[{t:'res',r:'min',v:100}]});assert.equal(o.status,'ok',JSON.stringify(o));
  const r1=last(h);assert.deepEqual(r1.give,[{t:'warOn',target:X,until:d0+90}]);
  const lbl=J(h,`dealLabel(MP.dip.offers.at(-1).give[0])`);assert.match(lbl,/Savaş sözü/);assert.match(lbl,/son tarih/);
  const ct=cmd(h,'B',{kind:'counter',offer:r1.id,give:[{t:'res',r:'min',v:100}],want:[{t:'warOn',target:X,until:d0+180}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
  const r2=last(h);const min0=J(h,'[G.emps[1].res.min,G.emps[3].res.min]');
  const acc=cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));
  const st=J(h,`({p:G.emps[3].warPledges,war:!!G.emps[3].war[${X}],min:[G.emps[1].res.min,G.emps[3].res.min]})`);
  assert.equal(st.war,false,'kabulde savaş ilan edilmez');assert.equal(st.p.length,1);
  assert.deepEqual({to:st.p[0].to,target:st.p[0].target,until:st.p[0].until,state:st.p[0].state},{to:1,target:X,until:d0+180,state:'open'});
  assert.equal(st.min[0],min0[0]-100);assert.equal(st.min[1],min0[1]+100);
  assert.notEqual(cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'}).status,'ok','ikinci kabul yok');
  assert.equal(J(h,'G.emps[3].warPledges.length'),1);assert.equal(J(h,'G.emps[1].res.min'),st.min[0],'karşılık bir kez');
});

test('W2 söz normal savaş ilanıyla tutulur: C savaş komutu → "tutuldu", iki tarafa bildirim',()=>{
  const h=world();prep(h);const d0=day(h);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+120}],want:[]}).status,'ok');const r=last(h);
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const t=J(h,`warFetihDefault(G.emps[3],G.emps[${X}]).slice(0,1)`);const w=cmd(h,'C',{kind:'war',target:X,goal:'fetih',targets:t});assert.equal(w.status,'ok',JSON.stringify(w));
  const p=J(h,'G.emps[3].warPledges[0]');assert.equal(p.state,'kept');assert.match(p.why,/Savaş başladı/);
  h.run('MP.publish&&MP.publish()');
  for(const c of ['B','C'])assert(heard(h,c,/Savaş sözü tutuldu/),c+' bildirimi');
  h.run('warPledgeTick()');assert.equal(J(h,'G.emps[3].warPledges[0].state'),'kept','tutulmuş söz yeniden işlenmez');
});

test('W3 son tarih geçer: "çiğnendi", B paktBozdu hatırlar, ilişki −20, haberde hedef adı yok',()=>{
  const h=world();prep(h);const d0=day(h);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+60}],want:[]}).status,'ok');const r=last(h);
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const rel0=J(h,'G.emps[1].rel[3]');h.run(`G.day=${d0+30};warPledgeTick();`);assert.equal(J(h,'G.emps[3].warPledges[0].state'),'open','süre dolmadan açık');
  h.run(`G.day=${d0+61};warPledgeTick();`);
  const st=J(h,`({p:G.emps[3].warPledges[0],rel:G.emps[1].rel[3],mem:(G.emps[1].mem[3]||[]).map(m=>m.k),news:(typeof GalacticNews!=='undefined'?GalacticNews.state().items||[]:[]).filter(n=>/Savaş sözü/.test(n.title||'')).map(n=>n.text)})`);
  assert.equal(st.p.state,'broken');assert.equal(st.rel,Math.max(-100,rel0-20));assert(st.mem.includes('paktBozdu'));
  const tn=J(h,`G.emps[${X}].name`);for(const t of st.news)assert(!t.includes(tn),'haber hedefin adını vermez');
  h.run(`G.day=${d0+200};warPledgeTick();`);assert.equal(J(h,'G.emps[1].rel[3]'),st.rel,'ceza bir kez');
});

test('W4 imkânsızlaşma: hedef elenir → düştü; son tarihte Konsey yasağı → düştü; ikisinde ceza yok',()=>{
  const h=world();prep(h);const d0=day(h);
  for(const u of [90,91])assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:u===90?X:2,until:d0+u}],want:[]}).status,'ok');
  const offs=J(h,'MP.dip.offers.slice(-2).map(o=>o.id)');for(const id of offs)assert.equal(cmd(h,'B',{kind:'respond',offer:id,action:'accept'}).status,'ok');
  const rel0=J(h,'G.emps[1].rel[3]');
  h.run(`G.emps[${X}].dead=true;warPledgeTick();`);
  h.run(`var __cb=councilBlocksWar;councilBlocksWar=(a,b)=>b&&b.id===2?true:__cb(a,b);G.day=${d0+95};warPledgeTick();councilBlocksWar=__cb;`);
  const p=J(h,'G.emps[3].warPledges.map(p=>[p.target,p.state,p.why])');
  assert.deepEqual(p.map(x=>x[1]),['void','void'],JSON.stringify(p));assert.match(p[0][2],/Hedef elendi/);assert.match(p[1][2],/Konsey/);
  assert.equal(J(h,'G.emps[1].rel[3]'),rel0,'imkânsızlaşan sözde ceza yok');assert(!J(h,'((G.emps[1].mem||{})[3]||[]).map(m=>m.k)').includes('paktBozdu'));
});

test('W5 geçersiz şartlar gerekçeli; bekleyen teklifteki söz uygulanamaz olursa teklif geçersizleşir',()=>{
  const h=world();prep(h);const d0=day(h);
  const no=(c,x,re)=>{const r=cmd(h,c,x);assert.notEqual(r.status,'ok',JSON.stringify(x));if(re)assert.match(JSON.stringify(r.detail||r.code),re,JSON.stringify(r));};
  no('C',{kind:'offer',to:1,give:[{t:'warOn',target:X}],want:[]},/son tarihli/);
  no('C',{kind:'offer',to:1,want:[{t:'warOn',target:X}],give:[{t:'res',r:'min',v:5}]},/son tarihli/);
  no('C',{kind:'offer',to:2,want:[{t:'warOn',target:X,until:d0+90}],give:[{t:'res',r:'min',v:5}]},/AI savaş sözünü/);
  no('C',{kind:'offer',to:1,give:[{t:'warOn',target:1,until:d0+90}],want:[]});
  no('C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+5000}],want:[]},/en çok/);
  h.run(`G.emps[3].war[2]=G.emps[2].war[3]=true;`);no('C',{kind:'offer',to:1,give:[{t:'warOn',target:2,until:d0+90}],want:[]});h.run(`G.emps[3].war[2]=G.emps[2].war[3]=false;`);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+90}],want:[]}).status,'ok');const r=last(h);
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  no('C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+120}],want:[]},/zaten açık/);
  /* bekleyen teklif: veren hedefle savaşa girerse söz yeni yükümlülük doğurmaz → teklif geçersiz, iki tarafa neden */
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:2,until:d0+90}],want:[]}).status,'ok');const p=last(h);
  h.run(`G.emps[3].war[2]=G.emps[2].war[3]=true;MP.publish&&MP.publish();`);
  const st=J(h,`MP.dip.offers.find(o=>o.id===${p.id})`);assert.notEqual(st.status,'pending','bekleyen teklif kapanır: '+JSON.stringify(st));
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:p.id,action:'accept'}).status,'ok');
});

test('W6 birleşik teklif: söz kabulde geçersizse kaynak / Sistem Devri / Haraç uygulanmaz',()=>{
  const h=world();prep(h);const d0=day(h);const s=J(h,'G.sys.find(s=>s.owner===3&&s.id!==G.emps[3].home).id');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+90},{t:'sys',id:s},{t:'tribute',r:'min',v:10},{t:'res',r:'ala',v:50}],want:[]}).status,'ok');const r=last(h);
  h.run(`G.emps[3].warPledges=[{id:1,to:1,target:${X},day:${d0},until:${d0+200},state:'open'}];`);   /* aynı söz başka yoldan açıldı → kabulde geçersiz */
  const pre=J(h,`({own:G.sys[${s}].owner,t:G.emps[3].tribute.length,ala:G.emps[3].res.ala,p:G.emps[3].warPledges.length})`);
  const acc=cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'});assert.notEqual(acc.status,'ok',JSON.stringify(acc));
  assert.deepEqual(J(h,`({own:G.sys[${s}].owner,t:G.emps[3].tribute.length,ala:G.emps[3].res.ala,p:G.emps[3].warPledges.length})`),pre,'kısmi uygulama yok');
});

test('W7 ayna / gizlilik: veren ve alan görür, hedef insan ve üçüncü taraf görmez',()=>{
  const h=world();prep(h);const d0=day(h);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:4,until:d0+90}],want:[]}).status,'ok');const r=last(h);
  const dv=J(h,`MP.dipView?MP.dipView(G.emps[4]).offers.map(o=>o.id):[]`);assert(!dv.includes(r.id),'hedefin diplomasi görünümünde teklif yok');
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const b=J(h,'StarsMirror.build(1).emps.map((e,i)=>e&&e.warPledges?[i,e.warPledges]:null).filter(Boolean)');
  assert.equal(b.length,1);assert.equal(b[0][1][0].to,0,'alan = misafir (0)');assert.equal(b[0][1][0].target,4);
  const c=J(h,'StarsMirror.build(3).emps[0].warPledges');assert.equal(c.length,1);assert.equal(c[0].to,1);
  const d=J(h,'StarsMirror.build(4)');assert(d.emps.every(e=>!e||!e.warPledges||!e.warPledges.length),'hedef sözü görmez');
  assert(!JSON.stringify(d).includes('"warPledges"'),'hedefin aynasında söz alanı yok');
  const host=J(h,'warPledgeRows(G.p,null)');assert.equal(host.length,0,'üçüncü taraf (host) satırı yok');
});

test('W8 kayıt: Save8 gidiş-dönüş aynı söz ve kalan süre; yüklemeden sonra süre dolumu bir kez',()=>{
  const h=world();prep(h);const d0=day(h);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'warOn',target:X,until:d0+90}],want:[]}).status,'ok');const r=last(h);
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  const before=J(h,'warPledgeRows(G.emps[1],G.emps[3])');const s8=h.run('serialize()');
  h.run('G.emps[3].warPledges=null;');assert.equal(h.run('deserialize('+JSON.stringify(s8)+')'),true);
  assert.deepEqual(J(h,'warPledgeRows(G.emps[1],G.emps[3])'),before,'aynı söz, aynı kalan süre');
  h.run(`G.day=${d0+91};warPledgeTick();warPledgeTick();`);assert.equal(J(h,'G.emps[3].warPledges[0].state'),'broken');
  assert.equal(J(h,'(G.emps[1].mem[3]||[]).filter(m=>m.k==="paktBozdu").length'),1,'bir kez');
});

test('W9 insan → AI: AI\'dan söz (son tarihsiz) aiRespond kararıyla; AI\'ya son tarihli söz kayıt olur; aynı cid tek teklif',()=>{
  const h=world();prep(h);const d0=day(h);h.run(`G.emps[2].rel[3]=G.emps[3].rel[2]=90;G.emps[2].rel[${X}]=-80;`);
  const a=cmd(h,'C',{kind:'offer',to:2,give:[{t:'res',r:'min',v:4000}],want:[{t:'warOn',target:X}]});
  const ai=J(h,`({war:!!G.emps[2].war[${X}],p:G.emps[2].warPledges||null})`);
  assert(['ok','rejected'].includes(a.status),JSON.stringify(a));assert.equal(ai.p,null,'AI son tarihli söz kaydı yazmaz');
  if(a.status==='ok'&&a.extra&&/kabul/i.test(JSON.stringify(a.extra)))assert.equal(ai.war,true,'AI kabul ettiyse hemen ilan');
  const g=cmd(h,'C',{kind:'offer',to:2,give:[{t:'warOn',target:X,until:d0+90}],want:[]});assert.equal(g.status,'ok',JSON.stringify(g));
  const pl=J(h,'G.emps[3].warPledges||[]');if(pl.length)assert.deepEqual([pl[0].to,pl[0].target,pl[0].state],[2,X,'open']);
  const n0=J(h,'MP.dip.offers.length'),x={v:1,type:'cmd',seq:900,cid:'fed0C000900',cmd:{kind:'offer',to:1,give:[{t:'warOn',target:2,until:d0+90}],want:[]}};
  h.sb.message=JSON.stringify(x);h.run(`MP.onMessage('C',message)`);h.sb.message=JSON.stringify({...x,seq:901});h.run(`MP.onMessage('C',message)`);
  assert.equal(J(h,'MP.dip.offers.length'),n0+1,'aynı cid tek teklif');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
