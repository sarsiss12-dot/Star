'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cargoWorld}=require('./helpers/96a-fixture');
function world(){
 const h=cargoWorld();
 h.run(`G.sys[3].planets[0].col=null;G.emps[1].colonies=[];
 port(G.emps[1],9);port(G.emps[2],3);port(G.emps[3],6);
 for(let i=0;i<5;i++){port(G.emps[i],20+i);G.sys[20+i].planets[0].col.b.liman=0;}
 for(let i=3;i<9;i++)link(i,i+1);
 function grant(id,to){return executeDeal({from:id,to,give:[{t:'portTransit'}],want:[]});}
 function rights(){for(const id of [2,3])for(const to of [0,1])if(!grant(id,to))throw Error('grant '+id+' '+to);}
 function path(){return Commerce.route(G.p,G.emps[1],0,9);}
 function cargo(){return executeDeal(terms(0,1,0,9));}
 function sailDays(n){for(let i=0;i<n;i++)advanceCargo(1);}
 var swap={from:0,to:1,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]};
 function capacity(){for(const id of [0,3,6,9])G.sys[id].planets[0].col.pop=120;}
 `);
 return h;
}
test('100 sistem, dokuz sıçrama, iki yabancı ara liman ve gerçek teslimat',()=>{
 const h=world();assert.equal(h.run('G.sys.length'),100);
 assert.equal(h.run('path()'),null);assert.equal(h.run('rights();path().join()'),'0,1,2,3,4,5,6,7,8,9');
 assert.equal(h.run('cargo()'),true);
 h.run('sailDays(2);Commerce.cancel(1,G.p);var v=G.commerce.convoys[0];');
 assert.equal(h.run('v.loaded'),12);assert.equal(h.run('G.emps[1].res.min'),100);
 h.run('sailDays(54)');assert.equal(h.run('v.status'),'delivered');assert.equal(h.run('G.emps[1].res.min'),112);
 assert.equal(h.run('G.p.res.min'),88);
});
for(const [name,change] of Object.entries({
 'ilk liman yıkıldı':'G.sys[3].planets[0].col.b.liman=0',
 'ikinci liman yıkıldı':'G.sys[6].planets[0].col.b.liman=0',
 'dört sıçramalık boşluk':'G.sys[3].planets[0].col.b.liman=0;port(G.emps[2],4)',
 'askerî geçiş yeterli değil':'revokePortTransit(G.emps[2],G.p);G.emps[2].passage[0]=true',
 'abluka':'G.sys[3].cr=1',
 'ambargo':'G.emps[2].embargo[0]=true',
 'izin süresi doldu':'G.day+=360',
 'liman üçüncü devlete devredildi':'captureSystem(G.sys[3],4,"transfer")',
}))test(name,()=>{const h=world();h.run('rights();'+change);assert.equal(h.run('path()'),null);});
test('federasyon yasası üyelik boyunca aktarmaya izin verir',()=>{
 const h=world();h.run("rights();revokePortTransit(G.emps[2],G.p);G.feds=[{id:1,members:[0,2],laws:{ticaret:true}}]");
 assert.equal(h.run('!!path()'),true);assert.equal(h.run('G.feds[0].members.pop();path()'),null);
});
test('devralan devletin kendi izni, geri alma ve ayrı gezegen sahipliği',()=>{
 const h=world();h.run('rights();captureSystem(G.sys[3],4,"conquest",G.sys[3].planets[0])');
 assert.equal(h.run('path()'),null);assert.equal(h.run('grant(4,0);!!path()'),true);
 assert.equal(h.run('captureSystem(G.sys[3],2,"transfer");revokePortTransit(G.emps[4],G.p);!!path()'),true);
 assert.equal(h.run('territoryOwnerSet(G.sys[3],5);!!path()'),true);
});
test('açık alternatif yol ve döngüsüz rota',()=>{
 const h=world();h.run('rights();port(G.p,10);link(2,10);link(10,4);link(10,5);G.sys[3].cr=1;link(1,4)');
 assert.equal(h.run('var p=path();p.includes(10)&&new Set(p).size===p.length'),true);
});
test('yüklemeden önce çıkış kaybı iki stoğu da korur',()=>{
 const h=world();h.run('rights();cargo();captureSystem(G.sys[0],4,"transfer");sailDays(5)');
 assert.equal(h.run('G.commerce.convoys.length'),0);assert.equal(h.run('G.p.res.min'),100);assert.equal(h.run('G.emps[1].res.ene'),100);
});
test('yoldaki kargo çıkış limanının kaybından sonra da alıcıya ulaşır',()=>{
 const h=world();h.run('rights();cargo();sailDays(8);Commerce.cancel(1,G.p);captureSystem(G.sys[0],4,"transfer");sailDays(60)');
 assert.equal(h.run('G.emps[1].res.min'),112);assert.equal(h.run('G.p.res.min'),88);assert.equal(h.run('G.emps[4].res.ene'),100);
});
test('varış devri meşru alıcının başka limanına tek teslimat yapar',()=>{
 const h=world();h.run('rights();cargo();sailDays(10);Commerce.cancel(1,G.p);captureSystem(G.sys[9],4,"transfer");port(G.emps[1],10);link(8,10);sailDays(80)');
 assert.equal(h.run('G.commerce.convoys[0].target'),10);assert.equal(h.run('G.emps[4].res.min'),100);assert.equal(h.run('G.emps[1].res.min'),112);
});
test('tek takas imza, yükleme, Save8/RNG tekrarı, varış ve makbuz',()=>{
 const h=world();h.run('capacity();rights();if(!deserialize(serialize()))throw Error("fixture")');assert.equal(h.run('executeDeal(swap)'),true);assert.equal(h.run('G.p.res.min'),100);
 h.run('sailDays(10);var snap=serialize(),rng=RND_STATE;');assert.equal(h.run('G.p.res.min'),0);assert.equal(h.run('G.emps[1].res.min'),100);
 h.run('sailDays(100);var later=serialize(),endRng=RND_STATE;');
 assert.equal(h.run('G.emps[1].res.min'),200);assert.equal(h.run('G.p.res.ene'),150);assert.equal(h.run('G.commerce.convoys.length'),2);
 assert.equal(h.run('deserialize(snap)&&RND_STATE===rng'),true);h.run('sailDays(100)');
 const first=JSON.parse(h.run('later')),second=JSON.parse(h.run('serialize()'));
 assert.deepEqual(second.commerce,first.commerce);
 assert.deepEqual(second.emps.map(e=>e.res),first.emps.map(e=>e.res));
 assert.equal(h.run('RND_STATE===endRng'),true);
 // The loader invalidates p47 derived empire caches. Replaying the identical Save8 must be byte-exact.
 h.run('var replay=serialize();deserialize(snap);sailDays(100)');
 assert.equal(h.run('replay===serialize()&&RND_STATE===endRng'),true);
});
test('kapalı rota ya da geri alınan işlem stok, izin ve sözleşme bırakmaz',()=>{
 const h=world();h.run('capacity();var before=serialize()');assert.equal(h.run('executeDeal(swap)'),false);assert.equal(h.run('before===serialize()'),true);
 h.run('rights();before=serialize();G._dealFailInject=k=>{if(k==="after:items")throw Error("fault")}');
 assert.equal(h.run('executeDeal(swap)'),false);assert.equal(h.run('delete G._dealFailInject;before===serialize()'),true);
});
test('yük kaybından sonra aynı gün ikinci ödeme ya da geri doğuş yok',()=>{
 const h=world();h.run('capacity();rights();executeDeal(swap);sailDays(5);var v=G.commerce.convoys[0];Commerce.finish(v,"destroyed","kontrol");Commerce.tick(1);sailDays(100)');
 assert.equal(h.run('v.lost'),100);assert.equal(h.run('G.emps[1].res.min'),100);assert.equal(h.run('G.p.res.min'),0);assert.equal(h.run('G.commerce.convoys.length'),2);
});
test('tek pakette liman izni ve sevkiyat her sırada atomik imzalanır',()=>{
 const h=world();h.run(`capacity();rights();captureSystem(G.sys[3],1,'transfer');port(G.p,5);
 var o=terms(0,1,0,9);o.want.push({t:'portTransit'});`);
 assert.equal(h.run('!!path()'),false);
 assert.equal(h.run('executeDeal(o)'),true);
 assert.equal(h.run('!!path()&&G.emps[1].portTransit[0]>G.day'),true);
});
test('ara liman kaybı aynı kargoyu konumu korunarak alternatif hatta geçirir',()=>{
 const h=world();h.run(`rights();cargo();sailDays(6);Commerce.cancel(1,G.p);var v=G.commerce.convoys[0],id=v.id,oldX=v.x,oldT=v.t;
 port(G.p,10);G.sys[10].x=G.sys[3].x+1;link(2,10);link(10,4);captureSystem(G.sys[3],4,'conquest');Commerce.tick(0);`);
 assert.equal(h.run('v.x===oldX&&v.t===oldT'),true);
 h.run('sailDays(60)');assert.equal(h.run('v.id===id&&v.route.includes(10)&&v.receipt===id'),true);
 assert.equal(h.run('G.emps[1].res.min'),112);assert.equal(h.run('G.p.res.min'),88);
});
test('ara liman hakkı kesildiğinde 180 gün sonunda kargo bir kez kayba yazılır',()=>{
 const h=world();h.run(`rights();cargo();sailDays(6);Commerce.cancel(1,G.p);var v=G.commerce.convoys[0],x=v.x;
 revokePortTransit(G.emps[2],G.p);sailDays(1);var start=v.blockedSince;sailDays(179);`);
 assert.equal(h.run('v.x===x&&v.amount===12&&v.status==="blocked"'),true);
 h.run('sailDays(1)');assert.equal(h.run('v.lost===12&&v.amount===0&&v.finished-start===180'),true);
 assert.equal(h.run('G.emps[1].res.min'),100);
});
test('AI gerçek ihtiyacı açan belirli bir izin için bütçeli teklif verir',()=>{
 const h=world();h.run(`
 var a=G.emps[5],b=G.emps[1],o=G.emps[2];
 port(a,0);a.pact[b.id]=b.pact[a.id]=true;
 G.sys[6].planets[0].owner=2;G.sys[6].owner=2;o.colonies.push({s:6,p:0});
 o.portTransit={1:G.day+360};a.inc={min:100,ene:-5};b.inc={ene:100,min:-5};
 a.res.min=b.res.ene=500;a.res.ene=b.res.min=30;a.res.etk=500;
 var A=Commerce.aiBalance(a),B=Commerce.aiBalance(b),before=a.res.etk;
 var result=Commerce.aiTransitRequest(a,b,A,B,{routes:96});`);
 assert.equal(h.run('result'),true);assert.equal(h.run('o.portTransit[a.id]>G.day'),true);
 assert.equal(h.run('!!Commerce.route(a,b,0,9)'),true);
 assert.equal(h.run('a.res.etk<before'),true);
 assert.equal(h.run('Commerce.aiTransitRequest(a,b,A,B,{routes:96})'),false);
});
