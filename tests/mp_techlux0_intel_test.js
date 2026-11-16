'use strict';
/* MP-TECHLUX.0 — 👁 İstihbarat (sensör paylaşımı) maddesi uçtan uca (yerel, Node: host durumu + misafir aynası).
   I1 misafir C, misafir B'den görüş ister (want intel); B kabul eder → C.visionFrom[B]; B yeni bir sisteme filo götürür → o sistem C'nin
      aynasında görünür (mpVisible + sahiplik), önce görünmüyordu; ilgisiz misafir D görmez; YÖN: B, C'nin sensörlerini almaz
   I2 yeniden bağlanma: ayna yeniden kurulunca (tam ayna) görüş aynı; B ile C savaşa girerse paylaşım kalkar
   I3 B'nin aynasında "sensör paylaşımı" kaydı C'nin kabuğunda değil, C'nin kendi aynasında görünür (veren / alan yönü) */
const assert=require('assert/strict'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}if(e.visionFrom)e.visionFrom={};if(e.shareVis)e.shareVis={};}
  for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [1,3,4])G.emps[id].res[r]=5000;
  /* fikstür: hiçbir insanın şu an görmediği bir hedef sistem X (B'nin filosu oraya ışınlanır) */
  var __vis=id=>humanVisionContext(G.emps[id]).visible;var __X=G.sys.find(s=>s.owner<0&&!__vis(1).has(s.id)&&!__vis(3).has(s.id)&&!__vis(4).has(s.id)).id;
  var __F=G.fleets.find(f=>f.e===1&&f.ships.length);`);
const mv=(h,id)=>J(h,`StarsMirror.build(${id}).mpVisible`);

test('I1 C, B\'den görüş ister; B kabul; B filosu yeni sisteme → C aynasında görünür (önce değil); D görmez; B, C\'nin sensörlerini almaz',()=>{
  const h=world();prep(h);const X=J(h,'__X');
  assert.equal(mv(h,3).includes(X),false,'önce C görmez');
  assert.equal(cmd(h,'C',{kind:'offer',to:1,give:[{t:'res',r:'min',v:20}],want:[{t:'intel'}]}).status,'ok');const r=J(h,'MP.dip.offers.at(-1)');
  assert.equal(cmd(h,'B',{kind:'respond',offer:r.id,action:'accept'}).status,'ok');
  assert.deepEqual(J(h,'({c:!!(G.emps[3].visionFrom||{})[1],b:!!(G.emps[1].visionFrom||{})[3]})'),{c:true,b:false},'yön: C, B\'den alır');
  h.run('__F.sys=__X;__F.mv=null;');
  const c=J(h,'StarsMirror.build(3)'),d=mv(h,4),b=mv(h,1);
  assert.equal(c.mpVisible.includes(X),true,'C aynasında X görünür');assert.equal(c.sys[X].n.length>0,true,'C sistemi adıyla görür');
  assert.equal(d.includes(X),false,'ilgisiz D görmez');
  const cOnly=[...J(h,'[...__vis(3)]')].filter(id=>!J(h,`nativeSensorVision(G.emps[1]).has(${id})`)&&!J(h,`explorationContext(G.emps[1]).visible.has(${id})`));
  assert(cOnly.length>0&&cOnly.every(id=>!b.includes(id)),'B, C\'nin kendi sensörlerini almaz');
});

test('I2 yeniden kurulum aynı görüş; savaşta paylaşım kalkar',()=>{
  const h=world();prep(h);const X=J(h,'__X');h.run('G.emps[3].visionFrom={1:true};__F.sys=__X;__F.mv=null;');
  const a=mv(h,3),b2=mv(h,3);assert.deepEqual(a,b2,'tam ayna yeniden kurulumu aynı');assert(a.includes(X));
  h.run('G.emps[1].war[3]=G.emps[3].war[1]=true;');assert.equal(mv(h,3).includes(X),false,'savaşta paylaşım yok');
});

test('I3 kayıt yönü aynada: C kendi aynasında "B\'den görüş", B\'nin aynasında C kabuğunda görünür',()=>{
  const h=world();prep(h);h.run('G.emps[3].visionFrom={1:true};');
  const c=J(h,'StarsMirror.build(3)'),b=J(h,'StarsMirror.build(1)');
  assert.equal(!!(c.emps[0].visionFrom||{})[1],true,'C: B\'den görüş');assert.equal(!!(b.emps[0].visionFrom||{})[3],false,'B kendisi almıyor');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
