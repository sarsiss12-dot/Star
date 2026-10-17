'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const {stress}=require('./diplomacy-repeat-probe');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
const eq=(a,b=true)=>assert.equal(a,b);
function fresh(){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var E=G.emps[1],B=G.emps[3];
   for(const e of [E,B,G.p]){e.dead=false;e.wild=false;e.civics=[];e.mizac=e._pers='yayilmaci';e.war={};e.ally={};
     for(const k in e.res)e.res[k]=10000;}
   E.contact[0]=B.contact[0]=G.p.contact[E.id]=G.p.contact[B.id]=true;
   E.rel[0]=B.rel[0]=G.p.rel[E.id]=G.p.rel[B.id]=50;
   G.inbox=[];delete G.p.offerRefusals;
   var offer={from:E.id,to:0,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]};
   function open(off=offer){UI.aiOffer(off);var n=G.inbox.find(x=>x.kind==='aideal');if(!n)throw Error('offer missing');UI.openNote(n.uid);}
   function state(){return JSON.stringify([G.emps,G.sys,G.inbox,RND_STATE]);}
 `);return h;
}
test('12 zorlanmış aylık tekrar: tek teklif ve tek ilişki bedeli',()=>{
 const s=stress(ROOT);eq(s.delivered,1);eq(s.declineDelta,-5);eq(s.expiredOfferRenewed);
});
test('ret masraf/RNG tüketmez, 27 ay hatırlanır ve çift dokunuş tek ceza verir',()=>{
 const h=fresh();h.run(`open();var reject=UI._hooks.offNo;var res=JSON.stringify([E.res,G.p.res]),rng=RND_STATE;
   reject();reject();var wait=playerOfferWait(offer);`);
 eq(h.run('wait'),810);eq(h.run('E.rel[0]'),45);eq(h.run('G.p.offerRefusals.length'),1);
 eq(h.run('JSON.stringify([E.res,G.p.res])===res&&RND_STATE===rng'));
});
for(const [delta,expected] of [[809,false],[810,true],[811,true]])
test('ret sınırı '+delta+' gün: bildirim '+expected,()=>{
 const h=fresh();h.run(`open();UI._hooks.offNo();G.day+=${delta};UI.aiOffer(offer);`);
 eq(h.run('G.inbox.length>0'),expected);
});
test('damga ve madde sırası ret kapısını aşamaz',()=>{
 const h=fresh();h.run(`offer.give.push({t:'res',r:'yiy',v:80});open();UI._hooks.offNo();
   var reverse={...offer,give:offer.give.slice().reverse(),born:G.day+1,expires:G.day+700};
   var old=state();UI.aiOffer(reverse);`);
 eq(h.run('G.inbox.length'),0);eq(h.run('state()===old'));
});
test('farklı miktar ve farklı devlet aynı gün teklif gönderebilir',()=>{
 const h=fresh();h.run(`open();UI._hooks.offNo();
   UI.aiOffer({...offer,give:[{t:'res',r:'min',v:150}]});UI.aiOffer({...offer,from:B.id});`);
 eq(h.run('G.inbox.length'),2);
});
for(const t of ['nap','pact','ally'])test(t+' reddi de aynı şartı bekletir',()=>{
 const h=fresh();h.run(`offer={from:E.id,to:0,give:[{t:'${t}'}],want:[]};open();UI._hooks.offNo();UI.aiOffer(offer);`);
 eq(h.run('G.inbox.length'),0);eq(h.run('playerOfferWait(offer)'),810);
});
test('kapatmak ret sayılmaz',()=>{
 const h=fresh();h.run('open();UI.closeModal();UI.aiOffer(offer);');
 eq(h.run('E.rel[0]'),50);eq(h.run('playerOfferWait(offer)'),0);eq(h.run("typeof DiplomaticInbox!=='undefined'?DiplomaticInbox.pending():G.inbox.length"),1);
});
test('karşı teklif hazırlamak ret sayılmaz, karşı kartın reddi sayılır',()=>{
 const h=fresh();h.run(`open();UI._hooks.offCounter();var before=playerOfferWait(offer);UI.act('ctrNo');UI.act('ctrNo');`);
 eq(h.run('before'),0);eq(h.run('playerOfferWait(offer)'),810);eq(h.run('E.rel[0]'),45);
});
test('kabul iki kez uygulanamaz ve ret düğmesi sonra ceza veremez',()=>{
 const h=fresh();eq(h.run('dealQuote(offer).ok'));h.run(`open();var yes=UI._hooks.offYes,no=UI._hooks.offNo;
   var min=G.p.res.min,ene=G.p.res.ene;yes();var relation=E.rel[0];yes();no();`);
 eq(h.run('G.p.res.min-min'),100);eq(h.run('G.p.res.ene-ene'),-50);
 eq(h.run('playerOfferWait(offer)'),0);eq(h.run('E.rel[0]===relation'));
});
test('eski dünyadaki açık ret/kabul düğmeleri yeni kaydı değiştiremez',()=>{
 const h=fresh();h.run(`open();var no=UI._hooks.offNo,yes=UI._hooks.offYes;var txt=serialize();deserialize(txt);
   var before=state();no();yes();`);eq(h.run('state()===before'));
});
test('başka pencere açılınca eski teklif callbackleri etkisiz',()=>{
 const h=fresh();h.run(`open();var no=UI._hooks.offNo,yes=UI._hooks.offYes;UI.opLogMenu();
   var before=state();no();yes();`);eq(h.run('state()===before'));
});
test('yeni teklif eski teklif callbackini geçersiz kılar',()=>{
 const h=fresh();h.run(`open();var no=UI._hooks.offNo;UI.aiDealOpen({...offer,from:B.id});
   var before=state();no();`);eq(h.run('state()===before'));
});
test('v8 ret süresini korur, eski callback kalıcı kayda müdahale edemez',()=>{
 const h=fresh();h.run(`open();UI._hooks.offNo();G.day+=100;var before=playerOfferWait(offer),rng=RND_STATE;
   var txt=serialize();deserialize(txt);UI.aiOffer(offer);`);
 eq(h.run('playerOfferWait(offer)'),710);eq(h.run('RND_STATE===rng'));eq(h.run('G.inbox.length'),0);eq(h.run('JSON.parse(txt).v'),8);
});
test('ret kaydı olmayan eski v8 ilk teklife açıktır',()=>{
 const h=fresh();h.run('var txt=serialize();deserialize(txt);UI.aiOffer(offer);');eq(h.run('G.inbox.length'),1);
});
test('süresi dolmuş kutu kopyası yeni teklifle yenilenir, farklı teklif korunur',()=>{
 const h=fresh();h.run(`UI.aiOffer(offer);var first=G.inbox[0];G.day=first.data.expires+1;
   UI.aiOffer({...offer,from:B.id});var other=G.inbox.at(-1);UI.aiOffer(offer);`);
 eq(h.run('G.inbox.length'),2);eq(h.run('G.inbox.includes(other)'));
 eq(h.run('G.inbox.filter(n=>n.data.from===E.id&&!dealExpired(n.data)).length'),1);
});
test('canlı aynı teklif yeniden eklenmez, ömrü uzatılmaz',()=>{
 const h=fresh();h.run('UI.aiOffer(offer);var first=JSON.stringify(G.inbox);G.day+=30;UI.aiOffer(offer);');
 eq(h.run('JSON.stringify(G.inbox)===first'));
});
test('zaten süresi dolmuş teklifi reddetmek yeni bekleme veya ilişki cezası yaratmaz',()=>{
 const h=fresh();h.run('offer.expires=G.day-1;UI.aiDealOpen(offer);UI._hooks.offNo();');
 eq(h.run('playerOfferWait(offer)'),0);eq(h.run('E.rel[0]'),50);
});
test('bekleme kontrolü saf; bozuk eski kayıt tolere edilir',()=>{
 const h=fresh();h.run(`G.p.offerRefusals=[null,{key:'x',until:'NaN'}];var before=state();
   for(let i=0;i<100;i++)playerOfferWait(offer);`);eq(h.run('state()===before'));
});
test('ret defteri sınırlı; süresi geçen kayıtlar yeni rette temizlenir',()=>{
 const h=fresh();h.run(`for(let i=0;i<80;i++)recordPlayerOfferRefusal({...offer,give:[{t:'res',r:'min',v:i+1}]});
   var count=G.p.offerRefusals.length;G.day+=811;recordPlayerOfferRefusal(offer);`);
 eq(h.run('count'),64);eq(h.run('G.p.offerRefusals.length'),1);
});
test('ret sonrası aynı kutu kopyası silinir, farklı şartlar kalır',()=>{
 const h=fresh();h.run(`UI.aiOffer(offer);UI.aiOffer({...offer,give:[{t:'res',r:'min',v:200}]});
   recordPlayerOfferRefusal(offer);`);eq(h.run('G.inbox.length'),1);eq(h.run('G.inbox[0].data.give[0].v'),200);
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
