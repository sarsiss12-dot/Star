'use strict';
/* TİCARET-AĞ.2 — MP kargo kaydı (Node, gerçek mp-core komutları; Chromium değil).
   M1 İnsan B → insan C fiziksel kargo teklifi (MP offer), C kabul (respond), konvoy yolda iken MP paketi (snapshot) alınır,
      yeni host çalışma zamanında validatePackage + loadWorld; sözleşme / konvoy / makbuz durumu birebir, iki dünya da teslimi bir kez yapar.
   M2 Aynı respond'un tekrarı (aynı / farklı cid) ikinci sözleşme ya da ödeme üretmez. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(__dirname,'..');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const src=fs.readFileSync(path.join(__dirname,'saha_guvence1_war_test.js'),'utf8');
const {mpWorld,cmd}=new Function('fs','path','crypto','runtime','ROOT','J',src.slice(src.indexOf('function mpWorld'),src.indexOf('const offerHelp'))+';return {mpWorld,cmd};')(fs,path,crypto,runtime,ROOT,J);
function fixture(){const h=mpWorld();
  const fx=J(h,`(()=>{const B=G.emps[1],C=G.emps[3];if(B.war[3]){B.war[3]=C.war[1]=false;}
    const bh=G.sys[B.home],bcol=bh.planets.find(p=>p.col&&p.owner===1).col;bcol.b.liman=1;bcol.pop=Math.max(bcol.pop,120);
    const n=bh.lanes.map(i=>G.sys[i]).find(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col));
    const pl=n.planets[0];pl.owner=3;pl.col=JSON.parse(JSON.stringify(bcol));pl.col.e=3;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];C.colonies.push({s:n.id,p:0});n.owner=3;
    for(const s of [bh,n])for(const id of [1,3])if(!s.seen.includes(id))s.seen.push(id);Commerce.state();
    return {bPort:bh.id,cPort:n.id,route:!!Commerce.route(B,C,bh.id,n.id)};})()`);
  return {h,fx};}
const ST=h=>J(h,`{bMin:Math.round(G.emps[1].res.min),cMin:Math.round(G.emps[3].res.min),k:G.commerce.contracts.length,v:G.commerce.convoys.map(v=>[v.id,v.status,v.loaded,v.at,v.step])}`);
const sail=(h,n)=>h.run(`for(let i=0;i<${n};i++){G.day+=1;Commerce.tick(1);}`);   /* 96a fikstürünün advanceCargo ile aynı */

test('M1 insan–insan kargo teklifi → kabul → yolda MP paketi → yeni host yükler: durum birebir, iki dünya tek teslim',()=>{
  const {h,fx}=fixture();assert.equal(fx.route,true,'B ↔ C rota');
  const o=cmd(h,'B',{kind:'offer',to:3,give:[{t:'cargo',r:'min',v:60}],want:[]});assert.equal(o.status,'ok','teklif: '+JSON.stringify(o).slice(0,200));
  const id=h.run('MP.dip.offers.find(o=>o.from===1&&o.to===3&&o.status==="pending").id');
  const r=cmd(h,'C',{kind:'respond',offer:id,action:'accept'});assert.equal(r.status,'ok','kabul');
  const s0=ST(h);sail(h,3);const s1=ST(h);
  assert.ok(s1.v.length===1&&s1.v[0][1]!=='delivered','konvoy yolda: '+JSON.stringify(s1.v));assert.equal(s0.bMin-s1.bMin,60,'yüklemede B\'den bir kez düştü');
  const snap=J(h,'MP.snapshot()');assert.equal(snap.ok,true,'paket alındı');
  const g=runtime({root:ROOT});g.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));g.sb.pk=JSON.stringify(snap.pkg);
  const v=J(g,`(()=>{const p=JSON.parse(pk);const v=StarsMP.validatePackage(p);if(!v.ok)return {v};StarsMP.loadWorld(p);return {v:{ok:true}};})()`);assert.equal(v.v.ok,true,'paket doğrulandı: '+JSON.stringify(v));
  assert.equal(g.run('JSON.stringify(G.commerce)'),h.run('JSON.stringify(G.commerce)'),'sözleşme / konvoy / makbuz birebir');
  sail(h,200);sail(g,200);const a=ST(h),b=ST(g);
  assert.deepEqual(b,a,'iki dünya aynı sonuca varır');assert.equal(a.cMin-s1.cMin,60,'C bir kez aldı');assert.equal(a.v[0][1],'delivered');});

test('M2 aynı respond tekrarı (aynı cid / farklı cid) ikinci sözleşme ya da ödeme üretmez',()=>{
  const {h}=fixture();cmd(h,'B',{kind:'offer',to:3,give:[{t:'cargo',r:'min',v:40}],want:[]});const id=h.run('MP.dip.offers.find(o=>o.from===1&&o.to===3&&o.status==="pending").id');
  const r1=cmd(h,'C',{kind:'respond',offer:id,action:'accept'});const a=ST(h);
  h.sb.message=JSON.stringify({v:1,type:'cmd',seq:99,cid:'sg1C000001',cmd:{kind:'respond',offer:id,action:'accept'}});h.run(`MP.onMessage('C',message)`);
  const r3=cmd(h,'C',{kind:'respond',offer:id,action:'accept'});const b=ST(h);
  assert.equal(r1.status,'ok');assert.notEqual(r3.status,'ok','farklı cid ile ikinci kabul reddedilir');assert.deepEqual(b,a,'ikinci sözleşme / ödeme yok');});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
