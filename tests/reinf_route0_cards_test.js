'use strict';
/* REINF-ROUTE.0 — Haberler → Sevkiyatlar / FİLO → SEVKİYATLAR: ana filo yok olunca ona giden takviyeler tek kartta
   (fleetRecoveryGroups — Toplu Kurtarma ile aynı gruplama, eski filo kimliğine göre). STARS_ROOT=<kök> ile p39 aynı vakalar. */
const assert=require('assert/strict');const path=require('path');
const {fresh}=require('./helpers/dispatch-fixture');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
function world(){const h=fresh(0,ROOT);h.run(`
  function ship(target,sys,n,c){const f=newFleet(E,sys,Array.from({length:n},()=>({c:c||'kor'})));f.shipment={fleet:target.id,safe:true,origin:0,state:'ready',attempts:0,next:0};f.joinFleet=target.id;return f;}
  function kill(f){fleetLost(f,'combat');f.ships=[];G.fleets=G.fleets.filter(x=>x!==f);}
  function cards(){const h=UI.shipmentsSection();return {html:h,cards:(h.match(/class="box shipLostCard"/g)||[]).length,rows:(h.match(/shipmentAllRow/g)||[]).length,
    heads:[...h.matchAll(/<b>(Filo #\\d+ · Hedef kayıp · \\d+ takviye gemisi)<\\/b>/g)].map(m=>m[1]),at:[...h.matchAll(/class="mini shipLostAt">([^:<]+): (\\d+) gemi/g)].map(m=>m[1]+'='+m[2])};}`);return h;}
test('C1 40 gemi / tek eski hedef → tek kart; sınıf, sayı, bekleme sistemleri ve kurtarma düğmeleri kartta',()=>{
  const h=world();
  const r=h.run(`for(let i=0;i<20;i++)ship(A,0,1);for(let i=0;i<10;i++)ship(A,1,1,'muh');for(let i=0;i<5;i++)ship(A,3,2);kill(A);var c=cards();
    ({cards:c.cards,rows:c.rows,heads:c.heads,at:c.at.join(','),recov:(c.html.match(/data-a="fleetRecovery" data-x="(\\d+)"/)||[])[1],menus:(c.html.match(/data-a="shipmentMenu"/g)||[]).length,muh:/10 × /.test(c.html),aid:A.id})`);
  assert.equal(r.cards,1,'tek kart (ayrı satır: '+r.rows+')');assert.equal(r.rows,0,'kayıp hedefli sevkiyatlar ayrı satırda tekrarlanmaz');
  assert.equal(r.heads[0],'Filo #'+r.aid+' · Hedef kayıp · 40 takviye gemisi');assert.equal(r.recov,String(r.aid),'TOPLU KURTARMA aynı grup');
  assert.equal(r.menus,35,'her sevkiyatın SEVKİYATI YÖNET düğmesi kartın içinde');assert.equal(r.muh,true,'sınıf sayıları');
  assert.ok(/=20/.test(r.at)&&/=10/.test(r.at),'sistem başına sayım: '+r.at);
});
test('C2 aynı adlı iki farklı eski filo → iki kart; toplamlar ayrı',()=>{
  const h=world();
  const r=h.run(`B.name=A.name;for(let i=0;i<3;i++)ship(A,0,1);for(let i=0;i<4;i++)ship(B,1,2);kill(A);kill(B);var c=cards();({cards:c.cards,heads:c.heads})`);
  assert.equal(r.cards,2);assert.ok(r.heads.some(x=>/ 3 takviye/.test(x))&&r.heads.some(x=>/ 8 takviye/.test(x)),JSON.stringify(r.heads));
});
test('C3 farklı sistemlere dağılmış + kayıt / devam sonrası toplam aynı',()=>{
  const h=world();
  const r=h.run(`for(const s of [0,1,2,3,4])for(let i=0;i<s+1;i++)ship(A,s,2);kill(A);var c0=cards();var ok=deserialize(serialize());var c1=cards();
    ({ok,h0:c0.heads.join('|'),h1:c1.heads.join('|'),a0:c0.at.join(','),a1:c1.at.join(',')})`);
  assert.equal(r.ok,true);assert.ok(/ 30 takviye/.test(r.h0),r.h0);assert.equal(r.h1,r.h0,'yüklemeden sonra aynı kart');assert.equal(r.a1,r.a0);
});
test('C4 Haberler penceresinde Sevkiyatlar sekmesi aynı bölümü açar',()=>{
  const h=world();
  const r=h.run(`for(let i=0;i<4;i++)ship(A,0,1);kill(A);var ok=ArchiveUI.act('shipmentsNews');var m=document.getElementById('modal');({ok,mode:ArchiveUI.mode,html:(m&&m.innerHTML)||''})`);
  assert.equal(r.mode,'ship');assert.ok(/shipLostCard/.test(r.html)&&/Sevkiyatlar · /.test(r.html),'sekme + kart');
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);
process.exitCode=fail?1:0;
