'use strict';
/* SAHA-ENTEGRE.0 Faz B — fetih talebi: 5 hedef / 12 aday sınırı kalktı, Etki bedeli, başkent, İsyanı Bastır, haritadan seçim, AI aynı.
   Dünya: yeni oyun (seed 22, orta, 5 AI); hedef devlete 20 sistem verilir ve oyuncuya bilinir yapılır. STARS_ROOT=<kök> eski sürüm. */
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log("✓ "+n);}catch(e){fail++;console.log("✗ "+n+" — "+String(e&&e.message||e).split("\n").slice(0,process.env.V?8:1).join(" | "));}}
function world(extra=''){
  const h=runtime({root:ROOT});
  h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
    var E=G.p,O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide);E.contact[O.id]=O.contact[E.id]=true;E.res.etk=5000;
    var free=G.sys.filter(s=>s.owner<0&&!s.planets.some(p=>p.col)).slice(0,19);for(const s of free){territoryOwnerSet(s,O.id);}
    for(const s of G.sys)if(s.owner===O.id&&!s.seen.includes(0))s.seen.push(0);
    ${extra}`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
test('B1 aday listesi 12 ile sınırlı değil (20+ bilinen sistem)',()=>{const h=world();
  const r=J(h,`{n:warFetihCandidates(E,O).length,cap:warFetihCandidates(E,O,{capital:true}).length,owned:G.sys.filter(s=>s.owner===O.id).length}`);
  assert.ok(r.owned>=20,'fikstür');assert.ok(r.n>12,'aday '+r.n);assert.equal(r.cap,r.owned,'başkent dahil bütün bilinen sistemler');});
test('B2 altıdan fazla hedef: geçerli, bedel artan Etki, ilanda bir kez düşülür',()=>{const h=world();
  const r=J(h,`(()=>{const t=warFetihCandidates(E,O).slice(0,9).map(x=>x.id),cost=warFetihClaimCost(E,O,t),before=E.res.etk;
    const opt=warGoalOptions(E,O,'fetih',{targets:t}),p=warDeclarationPreview(E,O,'fetih',{targets:t});
    E.war[O.id]=O.war[E.id]=true;const ok=setWarGoal(E,O,'fetih',{targets:t});return {opt:!!opt,cost,pcost:p.cost,claim:p.claimCost,ok,paid:before-E.res.etk,base:WAR_GOALS.fetih.etk,len:E.wg[O.id].targets.length};})()`);
  assert.equal(r.opt,true,'9 hedef geçerli');assert.ok(r.cost>0,'5 sonrası bedel');assert.equal(r.claim,r.cost);assert.equal(r.pcost,r.base+r.cost,'önizleme toplamı');
  assert.equal(r.ok,true);assert.equal(r.paid,r.base+r.cost,'tek seferde ödendi');assert.equal(r.len,9);});
test('B3 ilk 5 hedef bedelsiz (eski kural); Etki yetmezse önizleme engeller ve ilan olmaz',()=>{const h=world();
  const r=J(h,`(()=>{const t5=warFetihCandidates(E,O).slice(0,5).map(x=>x.id),t12=warFetihCandidates(E,O).slice(0,12).map(x=>x.id);
    const c5=warFetihClaimCost(E,O,t5);E.res.etk=WAR_GOALS.fetih.etk+1;const p=warDeclarationPreview(E,O,'fetih',{targets:t12});E.war[O.id]=O.war[E.id]=true;
    const ok=setWarGoal(E,O,'fetih',{targets:t12});return {c5,blk:p.blockers.some(b=>/Yetersiz Etki/.test(b)),ok,etk:E.res.etk,want:WAR_GOALS.fetih.etk+1};})()`);
  assert.equal(r.c5,0);assert.equal(r.blk,true);assert.equal(r.ok,false);assert.equal(r.etk,r.want,'Etki düşülmedi');});
test('B4 başkent hedeflenebilir (+60 Etki); tek sistemli devlet hedefsiz kalmaz',()=>{const h=world(`for(const s of G.sys)if(s.owner===O.id&&s.id!==O.home)territoryOwnerSet(s,-1);`);
  const r=J(h,`(()=>{const c=warFetihCandidates(E,O,{capital:true});const t=[O.home];return {n:c.length,cap:c[0]&&c[0].capital,old:warFetihCandidates(E,O).length,opt:!!warGoalOptions(E,O,'fetih',{targets:t}),cost:warFetihClaimCost(E,O,t),
    ok:warDeclarationPreview(E,O,'fetih',{targets:t}).blockers.filter(b=>/Fetih hedefleri/.test(b)).length};})()`);
  assert.equal(r.n,1,'tek sistem aday');assert.equal(r.cap,true);assert.equal(r.old,0,'AI varsayılanı başkentsiz (eski)');assert.equal(r.opt,true);assert.equal(r.cost,60);assert.equal(r.ok,0);});
test('B5 İsyanı Bastır: koptuğu devlete karşı başkent dahil bedelsiz',()=>{const h=world(`O.sundered=E.id;E.sundered=O.id;`);
  const r=J(h,`(()=>{const t=[O.home,...warFetihCandidates(E,O).slice(0,3).map(x=>x.id)];const p=warDeclarationPreview(E,O,'fetih',{targets:t});return {cost:warFetihClaimCost(E,O,t),reclaim:warFetihReclaim(E,O),note:p.goal&&p.goal.note};})()`);
  assert.equal(r.reclaim,true);assert.equal(r.cost,0);assert.ok(/İsyanı Bastır/.test(r.note),r.note);});
test('B6 AI seçimi eskisiyle aynı: en çok 3 başkent dışı hedef, bedel 0',()=>{const h=world();
  const r=J(h,`(()=>{const c=aiWarGoalChoice(O,E,null),t=c.opts&&c.opts.targets||[];return {key:c.key,n:t.length,home:t.includes(E.home),cost:t.length?warFetihClaimCost(O,E,t):0};})()`);
  assert.ok(r.n<=3);assert.equal(r.home,false);assert.equal(r.cost,0);});
test('B7 arayüz: liste 40 satırla sayfalı, arama süzer; HARİTADAN HEDEF SEÇ dokunuşu seçimi değiştirir, İPTAL geri alır, TAMAM korur',()=>{const h=world();
  const r=J(h,`(()=>{UI.warGoalPick(O.id,'fetih');const m=document.getElementById('modal'),H0=m.innerHTML;const rows0=(H0.match(/class="ch wgT/g)||[]).length,hasMap=/data-a="wgMap"/.test(H0);
    const s=UI._wgSel;s.targets=[];const c=warFetihCandidates(E,O,{capital:true});
    UI.claimPickStart(O.id);const on=!!View.claimPick,bar=!!document.getElementById('claimBar');
    View.tap?0:0;UI.claimPickToggle(G.sys[c[0].id]);UI.claimPickToggle(G.sys[c[1].id]);UI.claimPickToggle(G.sys[c[1].id]);const mid=View.claimPick.targets.slice();
    UI.claimPickEnd(false);const afterCancel=UI._wgSel.targets.length;
    UI.claimPickStart(O.id);UI.claimPickToggle(G.sys[c[2].id]);UI.claimPickToggle(G.sys[c[3].id]);UI.claimPickEnd(true);const kept=UI._wgSel.targets.slice();
    const again=/mbox war liveWorld wgPick/.test(document.getElementById('modal').innerHTML);
    s.q=G.sys[c[5].id].name;const filt=UI.wgListHtml(c,s);return {rows0,hasMap,on,bar,mid,afterCancel,kept,again,want:[c[2].id,c[3].id],c0:c[0].id,filtOne:(filt.match(/class="ch wgT/g)||[]).length,
    noBar:(()=>{const b=document.getElementById('claimBar');return !b||!b.innerHTML;})()};})()`);
  if(process.env.V)console.log(JSON.stringify(r));
  assert.equal(r.hasMap,true);assert.ok(r.rows0<=40&&r.rows0>0,'ilk sayfa '+r.rows0);assert.equal(r.on,true);assert.equal(r.bar,true);
  assert.deepEqual(r.mid,[r.c0],'aç / kapa');assert.equal(r.afterCancel,0,'İPTAL eski seçim');assert.deepEqual(r.kept,r.want,'TAMAM seçimi korur');assert.equal(r.again,true,'pencereye döndü');
  assert.ok(r.filtOne>=1&&r.filtOne<5,'arama süzer');assert.equal(r.noBar,true);});
test('B8 harita dokunuşu (View.tap) seçim kipinde sistem panelini açmaz, seçimi değiştirir',()=>{const h=world();
  const r=J(h,`(()=>{UI.warGoalPick(O.id,'fetih');UI._wgSel.targets=[];const c=warFetihCandidates(E,O,{capital:true}),s=G.sys[c[0].id];UI.claimPickStart(O.id);
    const pos=View.worldToScreen?View.worldToScreen(s.x,s.y):null;let via='fn';if(pos&&typeof View.tap==='function'){View.tap(pos);via='tap';}else UI.claimPickToggle(s);
    return {via,t:View.claimPick&&View.claimPick.targets.slice(),sel:View.selSys&&View.selSys.id,id:s.id};})()`);
  assert.deepEqual(r.t,[r.id],'dokunuşla seçildi ('+r.via+')');assert.notEqual(r.sel,r.id,'sistem paneline geçmedi');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
