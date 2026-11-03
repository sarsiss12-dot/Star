'use strict';
// MP.8.4 kimlik/güvenlik denetimi: mevcut eksikleri görünür kılar; kalıcılık uygulaması değildir.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {world,harness}=require('./helpers/95e-fixture');const {test,end}=harness();
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const note=`G.inbox=[];G.inboxUid=0;UI.notify({kind:'event',data:EVENTS[0],key:'mp84:event',title:'Denetim',pause:true});var n=G.inbox[0];`;
test('gizlenen karar Save8 olay codecinde korunur fakat hidden taşınmaz; menü erişimi sürer',()=>{
 const h=world();h.run(note);h.run('UI.noteSwipe(n.uid)');assert.equal(J(h,'n.hidden'),true);
 assert(J(h,'UI.topStatusItems().items.some(i=>i.x===String(n.uid))'));
 const events=J(h,'serializeEventsWorld()');assert.equal(events.inbox.length,1);assert(!Object.hasOwn(events.inbox[0],'hidden'));
 h.sb.__save=h.run('serialize()');assert(h.run('deserialize(__save)'));assert.equal(J(h,'!!G.inbox[0].hidden'),false);
 assert(J(h,'UI.topStatusItems().items.some(i=>i.x===String(G.inbox[0].uid))'));
});
test('farklı kayıtlar aynı seed/uid/key/born/payload taşıyabilir; olay fingerprinti kayıt kimliği değildir',()=>{
 const h=world();h.run(note);const a=h.run('serialize()'),event=h.run('JSON.stringify(serializeEventsWorld())'),rng=h.run('RND_STATE');
 h.run('G.p.res.min+=1');const b=h.run('serialize()');assert.notEqual(a,b);assert.equal(h.run('JSON.stringify(serializeEventsWorld())'),event);
 assert.equal(h.run('RND_STATE'),rng);assert.equal(JSON.parse(a).seed,JSON.parse(b).seed);
 assert(!Object.hasOwn(JSON.parse(a),'saveId'));assert.notEqual(crypto.createHash('sha256').update(a).digest('hex'),crypto.createHash('sha256').update(b).digest('hex'));
});
test('aynı checkpoint tekrar yüklenince yeni bildirimde uid/key/born yeniden kullanılabilir',()=>{
 const h=world();h.run('G.inbox=[];G.inboxUid=0');const checkpoint=h.run('serialize()');h.run(note);const a=J(h,'serializeEventsWorld().inbox[0]');
 h.sb.__save=checkpoint;assert(h.run('deserialize(__save)'));h.run(note.replace('EVENTS[0]','EVENTS[1]'));
 const b=J(h,'serializeEventsWorld().inbox[0]');assert.equal(a.uid,b.uid);assert.equal(a.key,b.key);assert.equal(a.born,b.born);assert.notDeepEqual(a.data,b.data);
});
test('gizlenen diplomatik teklif kayıttan sonra Gelen Kutusunda karar bekler; kabul kaynakları yalnız bir kez değiştirir',()=>{
 const h=world();h.run('var r=addOffer(17),rid=r.id,uid=G.inbox.at(-1).uid;UI.noteSwipe(uid)');assert.equal(J(h,'r.status'),'pending');
 h.sb.__save=h.run('serialize()');assert(h.run('deserialize(__save)'));h.run('var before=G.p.res.min;var result=DiplomaticInbox.resolve(rid,true,"haracguzar",G.emps)');
 assert(J(h,'result.ok'));assert.equal(J(h,'G.p.res.min-before'),17);h.run('DiplomaticInbox.resolve(rid,true,"haracguzar",G.emps)');assert.equal(J(h,'G.p.res.min-before'),17);
});
test('misafir aynası global olay kuyruğunu ve özgün RNG/seed bilgisini dışarı taşımaz',()=>{
 const h=world();h.run(note);h.run(fs.readFileSync(path.join(__dirname,'../research/mp6/mirror.js'),'utf8'));
 const m=J(h,'StarsMirror.build(1,{cosmeticSeed:123,log:[],news:[]})');assert(!Object.hasOwn(m,'events'));assert.equal(m.seed,123);assert.equal(m.rs,1);assert.equal(m.emps[0].id,0);
});
end();
