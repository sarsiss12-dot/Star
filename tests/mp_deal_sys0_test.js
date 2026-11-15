'use strict';
/* MP-DEAL-SYS.0 — Sistem Devri + Haraç çok oyunculu müzakere maddeleri (motorun 'sys' / 'tribute' maddeleri; yeni motor yok).
   N1 AI–AI anlaşması çakışma denetimine girmez (davranış aynı); insan taraflı devirde vaat / Fetih / işgal çakışması dealQuote'ta yakalanır
   N2 misafir C (kaybeden) → misafir B: Barış + Sistem Devri + Haraç; karşı teklif; kabul → sistem B'nin, haraç kaydı, barış; tekrar kabul yok
   N3 bilinmeyen sahiplikteki sistemi isteme reddi (gerekçede gizli sahip yok); devredenin kendi toprak vaadi çakışması gönderene açık
   N4 teklif beklerken sistem sahibi değişir → teklif geçersizleşir, iki tarafa neden; kabul işlenmez
   N5 haraç ödemesi: ay başında bir kez; eksik stokta kısmi ödeme + bildirim; kayıt → yükleme → sonraki ödeme tek kez; takvim satırları
   N6 birleşik teklifte bir madde geçersizse hiçbiri uygulanmaz (kısmi barış / devir / ödeme yok)
   N7 ayna: alıcıya kendisine ödenen haraç, ödeyene kendi yükümlülüğü (π kimlikleri); üçüncü misafire hiçbiri
   N8 karşı teklifte önceki teklifte açıklanan sistem · N9 Destek İste (warJoin) teklifi beklerken savaş kapanırsa geç kabul işlenmez */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=40;e.war[o.id]=false;e.contact[o.id]=true;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
  for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,3);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);e.tribute=[];}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [1,3,4])G.emps[id].res[r]=5000;remember(G.emps[3],1,'savasIlan');remember(G.emps[4],1,'savasIlan');`);
const cSys=h=>J(h,'G.sys.filter(s=>s.owner===3&&s.id!==G.emps[3].home).map(s=>s.id)');
const war=(h)=>{const t=J(h,'warFetihDefault(G.emps[1],G.emps[3]).slice(0,1)');const w=cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:t});assert.equal(w.status,'ok',JSON.stringify(w));return t;};
const last=h=>J(h,'MP.dip.offers.at(-1)');

test('N1 AI–AI devir çakışma denetimine girmez; insan taraflı devirde kendi toprak vaadi çakışması dealQuote\'ta yakalanır',()=>{
  const h=world();prep(h);
  const r=J(h,`(()=>{const a=G.emps[2],b=G.emps[5];
    const s=G.sys.find(s=>s.owner===a.id&&s.id!==a.home);const q=()=>dealQuote({from:a.id,to:b.id,give:[{t:'sys',id:s.id}],want:[],born:G.day,expires:G.day+300});
    const before=JSON.stringify(q());G.warLedger.promises=G.warLedger.promises||[];G.warLedger.promises.push({id:99,campaign:1,front:1,giver:a.id,taker:4,enemy:1,sys:s.id,day:G.day,state:'open'});const after=JSON.stringify(q());
    const s3=G.sys.find(x=>x.owner===3&&x.id!==G.emps[3].home);G.warLedger.promises.push({id:98,campaign:1,front:1,giver:3,taker:4,enemy:5,sys:s3.id,day:G.day,state:'open'});
    const hq=dealQuote({from:3,to:1,give:[{t:'sys',id:s3.id}],want:[],born:G.day,expires:G.day+300});
    return {same:before===after,human:hq.ok,why:hq.reasons};})()`);
  assert.equal(r.same,true,'AI–AI: vaat çakışması dealQuote sonucunu değiştirmez (eski davranış)');assert.equal(r.human,false);assert.match(r.why.join(' '),/toprak vaadi/);
});

test('N2 Barış + Sistem Devri + Haraç: misafir C → misafir B, karşı teklif, kabul; sistem B\'nin, haraç kaydı, barış; ikinci kabul yok',()=>{
  const h=world();prep(h);war(h);const s=cSys(h)[0];assert(s!==undefined,'fikstür sistemi');
  const o=cmd(h,'C',{kind:'offer',to:1,give:[{t:'peace'},{t:'sys',id:s},{t:'tribute',r:'min',v:20}],want:[]});assert.equal(o.status,'ok',JSON.stringify(o));
  const r1=last(h);assert.deepEqual(r1.give.map(i=>i.t),['peace','sys','tribute']);
  const lbl=J(h,`MP.dip.offers.at(-1).give.map(i=>dealLabel(i))`);assert(lbl.some(l=>/Sistem Devri/.test(l))&&lbl.some(l=>/Haraç/.test(l)),JSON.stringify(lbl));
  /* B karşı teklif: aylık 30 */
  const ct=cmd(h,'B',{kind:'counter',offer:r1.id,give:[{t:'peace'}],want:[{t:'sys',id:s},{t:'tribute',r:'min',v:30}]});assert.equal(ct.status,'ok',JSON.stringify(ct));
  const r2=last(h);assert.equal(r2.from,1);assert.equal(r2.to,3);
  const min0=J(h,'G.emps[3].res.min'),day0=J(h,'G.day');
  const acc=cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'});assert.equal(acc.status,'ok',JSON.stringify(acc));
  const st=J(h,`({own:G.sys[${s}].owner,war:!!G.emps[1].war[3],trib:G.emps[3].tribute.map(t=>({to:t.to,r:t.r,v:t.v,until:t.until})),status:MP.dip.offers.find(o=>o.id===${r2.id}).status})`);
  assert.equal(st.own,1,'sistem yeni sahibinde');assert.equal(st.war,false,'barış');assert.equal(st.status,'accepted');
  assert.deepEqual(st.trib,[{to:1,r:'min',v:30,until:day0+3600}],'tek haraç kaydı (10 yıl)');
  assert.notEqual(cmd(h,'C',{kind:'respond',offer:r2.id,action:'accept'}).status,'ok','ikinci kabul yok');
  assert.equal(J(h,'G.emps[3].tribute.length'),1,'haraç bir kez');assert.equal(J(h,'G.emps[3].res.min'),min0,'kabulde ödeme yok (ilk ödeme ay başında)');
});

test('N3 bilinmeyen sahiplikteki sistem istenemez (gerekçede gizli sahip yok); devredenin kendi toprak vaadi gönderene açık yazılır',()=>{
  const h=world();prep(h);const s=cSys(h);
  h.run(`G.emps[1].mapOwners={};for(const id of ${JSON.stringify(s)})G.emps[1].mapOwners[id]=-1;`);   /* B bu sistemlerin sahibini görmedi */
  h.run(`for(const id of ${JSON.stringify(s)}){const x=G.sys[id];x.seen=x.seen.filter(v=>v!==1);}`);
  const bad=cmd(h,'B',{kind:'offer',to:3,give:[],want:[{t:'sys',id:s[0]}]});assert.equal(bad.status,'rejected');assert.match(JSON.stringify(bad.detail),/bilinmiyor/);
  assert.doesNotMatch(JSON.stringify(bad.detail),new RegExp(J(h,'G.emps[3].name')+' →'),'karşı tarafın iç gerekçesi yok');
  h.run(`G.warLedger.promises=G.warLedger.promises||[];G.warLedger.promises.push({id:77,campaign:1,front:1,giver:3,taker:4,enemy:5,sys:${s[1]},day:G.day,state:'open'});`);
  const own=cmd(h,'C',{kind:'offer',to:1,give:[{t:'sys',id:s[1]}],want:[]});assert.equal(own.status,'rejected');assert.match(JSON.stringify(own.detail),/toprak vaadi/);
});

test('N4 teklif beklerken sistem sahibi değişir → teklif geçersizleşir, iki tarafa neden; kabul işlenmez',()=>{
  const h=world();prep(h);const s=cSys(h)[0];
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'sys',id:s}],want:[{t:'res',r:'min',v:10}]}).status,'ok');const r=last(h);
  h.run(`territoryOwnerSet(G.sys[${s}],4);MP.publish();`);
  const st=J(h,`MP.dip.offers.find(o=>o.id===${r.id})`);assert.equal(st.status,'invalid');assert.match(st.why,/Sistem Devri/);
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');assert.equal(J(h,`G.sys[${s}].owner`),4);
});

test('N5 haraç: ay başında bir kez; eksik stokta kısmi ödeme + bildirim; kayıt → yükleme → sonraki ödeme tek kez; takvim satırları',()=>{
  const h=world();prep(h);
  h.run(`G.emps[3].tribute=[{to:1,r:'ala',v:50,until:G.day+3600}];G.emps[3].res.ala=5000;G.emps[1].res.ala=0;`);
  h.run(`var __pays=0;{const f0=tributeTick;tributeTick=function(){const t=G.emps[3].tribute[0],d0=t&&t.last&&t.last.d;const r=f0.apply(this,arguments);const t2=G.emps[3].tribute[0];if(t2&&t2.last&&t2.last.d!==d0)__pays++;return r;};}`);
  const step=n=>h.run(`(()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+${n}&&g++<4000){const pm=Math.floor(G.day/30);G.day+=.5;if(Math.floor(G.day/30)>pm)monthTick();}})()`);
  step(1);assert.equal(J(h,'__pays'),1,'bir ödeme');assert.equal(J(h,'G.emps[3].tribute[0].last.p'),50);const rows=J(h,'tributeRows(G.emps[1])');assert.equal(rows.length,1);assert(rows[0].pays>=118&&rows[0].pays<=120,JSON.stringify(rows));
  assert.match(J(h,'tributeRowText(tributeRows(G.emps[1])[0],1)'),/Sen/);
  /* kayıt → yükleme (Save8) → sonraki ay tek ödeme */
  h.run('var __sv=serialize();');assert.equal(J(h,'deserialize(__sv)'),true,'Save8 yüklendi');h.run('__pays=0;');
  assert.deepEqual(J(h,'G.emps[3].tribute.map(t=>[t.to,t.v,t.last&&t.last.p])'),[[1,50,50]],'takvim + son ödeme kaydı korunur');
  const d1=J(h,'G.emps[3].tribute[0].last.d');step(1);assert.equal(J(h,'__pays'),1,'yüklemeden sonra ödeme bir kez');assert(J(h,'G.emps[3].tribute[0].last.d')-d1>=29,'sonraki ay başında');
  /* eksik stok */
  h.run(`G.emps[3].res.ala=12;`);const n0=h.sb.out.length;step(1);h.run('MP.publish()');
  assert(J(h,'G.emps[3].tribute[0].last.p')<50,'kısmi ödeme kaydı (stok + o ayın üretimi)');
  const notes=h.sb.out.slice(n0).map(([to,t])=>t).filter(t=>/Haraç eksik ödendi/.test(t));assert(notes.length>=1,'eksik ödeme bildirimi uzak insanlara');
  /* sona erme */
  h.run(`G.emps[3].tribute[0].until=G.day+5;`);const n1=h.sb.out.length;step(1);h.run('MP.publish()');assert.equal(J(h,'G.emps[3].tribute.length'),0);
  assert(h.sb.out.slice(n1).some(([to,t])=>/Haraç anlaşması sona erdi/.test(t)),'sona erme bildirimi');
});

test('N6 birleşik teklifte bir madde geçersizse hiçbiri uygulanmaz (kısmi barış / devir / ödeme yok)',()=>{
  const h=world();prep(h);war(h);const s=cSys(h)[0];
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'peace'},{t:'sys',id:s},{t:'tribute',r:'tuk',v:90}],want:[]}).status,'ok');const r=last(h);
  h.run('G.emps[3].res.tuk=0;for(const c of G.emps[3].cols||[]);');   /* haraç kapasitesi kalmadı (stok 0) */
  const pre=J(h,`({own:G.sys[${s}].owner,war:!!G.emps[1].war[3],t:G.emps[3].tribute.length})`);
  const acc=cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'});
  const post=J(h,`({own:G.sys[${s}].owner,war:!!G.emps[1].war[3],t:G.emps[3].tribute.length})`);
  if(acc.status==='ok')assert.fail('kapasitesiz haraçla kabul işlendi: '+JSON.stringify(acc));
  assert.deepEqual(post,pre,'hiçbir madde uygulanmadı');
});

test('N7 ayna: alıcıya kendisine ödenen haraç, ödeyene kendi yükümlülüğü (π); üçüncü misafire hiçbiri',()=>{
  const h=world();prep(h);h.run(`G.emps[3].tribute=[{to:1,r:'min',v:25,until:G.day+900}];`);
  const b=J(h,'(()=>{const w=StarsMirror.build(1);return w.emps.map(e=>e&&e.tribute||null);})()');
  const c=J(h,'StarsMirror.build(3).emps[0].tribute');const d=J(h,'StarsMirror.build(4).emps.map(e=>e&&e.tribute||null)');
  const payer=b.findIndex(t=>t&&t.length);assert(payer>0,'B aynasında ödeyen kabuğunda haraç');assert.equal(b[payer][0].to,0,'alıcı = misafir (0)');assert.equal(b[payer][0].v,25);
  assert.equal(c.length,1);assert.notEqual(c[0].to,0);assert.equal(c[0].v,25);
  assert(d.slice(1).every(t=>!t||!t.length),'üçüncü misafire başkasının haracı gitmez');
});
test('N8 karşı teklif: karşı tarafın önceki teklifinde açıkça sunduğu sistem, sahipliği gözlenmemiş olsa da istenebilir; başka gizli sistem istenemez',()=>{
  const h=world();prep(h);const s=cSys(h);
  h.run(`G.emps[1].mapOwners={};for(const id of ${JSON.stringify(s)}){G.emps[1].mapOwners[id]=-1;const x=G.sys[id];x.seen=x.seen.filter(v=>v!==1);}`);
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'sys',id:s[0]}],want:[{t:'res',r:'min',v:10}]}).status,'ok');const r=last(h);
  const ok=cmd(h,'B',{kind:'counter',offer:r.id,give:[{t:'res',r:'min',v:5}],want:[{t:'sys',id:s[0]}]});assert.equal(ok.status,'ok',JSON.stringify(ok));
  const r2=last(h);const bad=cmd(h,'C',{kind:'counter',offer:r2.id,give:[{t:'sys',id:s[0]}],want:[{t:'res',r:'min',v:5}]});assert.equal(bad.status,'ok','C kendi sistemini yeniden sunabilir');
  const r3=last(h);const hidden=cmd(h,'B',{kind:'counter',offer:r3.id,give:[],want:[{t:'sys',id:s[1]}]});assert.equal(hidden.status,'rejected');assert.match(JSON.stringify(hidden.detail),/bilinmiyor/);
});
test('N9 Savaş Merkezi Destek İste (warJoin, seçili cephe): savaş bekleyen teklif sırasında kapanırsa geç kabul işlenmez, katılım / savaş yok',()=>{
  const h=world();prep(h);war(h);const f=J(h,'(warLedgerFind(1,3)||{}).id');assert(f,'B–C cephesi');
  const o=cmd(h,'B',{kind:'offer',to:4,give:[{t:'res',r:'min',v:50}],want:[{t:'warJoin',front:f,target:3}]});assert.equal(o.status,'ok',JSON.stringify(o));const r=last(h);
  h.run('makePeace(G.emps[1],G.emps[3],{force:true,quiet:true});MP.publish&&MP.publish();');assert.equal(J(h,'!!G.emps[1].war[3]'),false,'barış');
  const min0=J(h,'G.emps[1].res.min');const acc=cmd(h,'D',{kind:'respond',offer:r.id,action:'accept'});
  assert.notEqual(acc.status,'ok','kapanmış cepheye geç kabul işlenmez: '+JSON.stringify(acc));console.log('  N9 geç kabul yanıtı: '+JSON.stringify(acc).slice(0,240));
  assert.equal(J(h,'!!G.emps[4].war[3]'),false,'D savaşa girmedi');assert.equal(J(h,'G.emps[1].res.min'),min0,'bedel ödenmedi');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
