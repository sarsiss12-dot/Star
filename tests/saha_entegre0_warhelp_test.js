'use strict';
/* SAHA-ENTEGRE.0 Faz D — "Savaşa Yardım Teklif Et": warJoin VER listesinde (veren alanın savaşına katılır). Aynı motor: dealQuote /
   executeDeal / aiRespond. STARS_ROOT=<kök> eski sürüm (warHelpOptions yok → vakalar FAIL). */
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
function world(){const h=runtime({root:ROOT});h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  var E=G.p,ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide),O=ais[0],X=ais[1];
  for(const a of [E,O,X])for(const b of [E,O,X])if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;if(a.nap)delete a.nap[b.id];}
  E.rel[O.id]=O.rel[E.id]=60;E.res.ala=5000;O.res.ala=5000;O.res.min=5000;warAuthorize(X,O,{n:'t'});declareWar(X,O);warAuthClear();
  var F=warLedgerFind(O.id,X.id);E.intel=E.intel||{};E.intel[O.id]=3;   /* SIZILMIŞ: üçüncü taraf savaşı bilinir */
  var S2=G.sys.find(s=>s.owner<0&&!s.planets.some(p=>p.col));territoryOwnerSet(S2,X.id);if(!S2.seen.includes(E.id))S2.seen.push(E.id);`);return h;}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
test('D1 seçenek: alanın (O) bildiğim açık savaşı listelenir, uygun; benim tarafım olmayan savaş',()=>{const h=world();
  const r=J(h,`(()=>{const rows=warHelpOptions(E,O);return {n:rows.length,row:rows[0],front:F&&F.id,mine:warSupportOptions(E,O).length};})()`);
  assert.ok(r.front,'fikstür savaşı');assert.equal(r.n,1);assert.equal(r.row.front,r.front);assert.equal(r.row.ok,true,r.row.why);});
test('D2 teklif hazırlamak savaş başlatmaz, ödeme yapmaz; dealQuote geçerli (warJoin VER + 300 alaşım İSTE)',()=>{const h=world();
  const r=J(h,`(()=>{const res=JSON.stringify([E.res,O.res]);const offer={from:E.id,to:O.id,give:[{t:'warJoin',front:F.id,target:X.id}],want:[{t:'res',r:'ala',v:300}],born:G.day,expires:G.day+30};
    const q=dealQuote(offer);return {ok:q.ok,why:q.why||q.reasons||null,war:!!E.war[X.id],same:res===JSON.stringify([E.res,O.res])};})()`);
  assert.equal(r.ok,true,JSON.stringify(r.why));assert.equal(r.war,false);assert.equal(r.same,true);});
test('D3 kabul (executeDeal): E savaşa O tarafında girer, 300 alaşım bir kez gelir; ikinci uygulama reddedilir',()=>{const h=world();
  const r=J(h,`(()=>{const ala0=E.res.ala,o0=O.res.ala;const offer={from:E.id,to:O.id,give:[{t:'warJoin',front:F.id,target:X.id}],want:[{t:'res',r:'ala',v:300}],born:G.day,expires:G.day+30};
    const ok=executeDeal(offer);const got=E.res.ala-ala0,paid=o0-O.res.ala;const again=dealQuote(offer).ok;return {ok:!!ok,war:!!E.war[X.id]&&!!X.war[E.id],got,paid,again};})()`);
  assert.equal(r.ok,true);assert.equal(r.war,true,'katılım');assert.equal(r.got,300);assert.equal(r.paid,300);assert.equal(r.again,false,'aynı teklif ikinci kez geçerli değil');});
test('D4 savaş biterse gecikmiş teklif geçersiz; ödeme yok',()=>{const h=world();
  const r=J(h,`(()=>{const offer={from:E.id,to:O.id,give:[{t:'warJoin',front:F.id,target:X.id}],want:[{t:'res',r:'ala',v:300}],born:G.day,expires:G.day+30};
    makePeace(O,X,{force:true,quiet:true});const ala0=E.res.ala;const q=dealQuote(offer);const ok=q.ok?executeDeal(offer):false;return {q:q.ok,ok:!!ok,war:!!E.war[X.id],ala:E.res.ala-ala0,rows:warHelpOptions(E,O).length};})()`);
  assert.equal(r.q,false);assert.equal(r.ok,false);assert.equal(r.war,false);assert.equal(r.ala,0);assert.equal(r.rows,0,'bitmiş savaş listelenmez');});
test('D5 toprak vaadi aynı cephe için istenebilir; AI yanıtı (aiRespond) kabul / ret / karşı teklif biçiminde döner, dünyayı değiştirmez',()=>{const h=world();
  const r=J(h,`(()=>{const sys=S2;if(!sys.seen.includes(E.id))sys.seen.push(E.id);
    const offer={from:E.id,to:O.id,give:[{t:'warJoin',front:F.id,target:X.id}],want:[{t:'landPromise',sys:sys.id,front:F.id}],born:G.day,expires:G.day+30};
    const q=dealQuote(offer);const st=JSON.stringify([E.war,O.res,E.res]);const a=aiRespond(O,q.norm||offer);return {q:q.ok,why:q.why||q.reasons,kind:a&&(a.kabul!==undefined?'kabul:'+a.kabul:Object.keys(a).join(',')),same:st===JSON.stringify([E.war,O.res,E.res])};})()`);
  assert.equal(r.q,true,JSON.stringify(r.why));assert.ok(r.kind,'AI yanıtı');assert.equal(r.same,true,'aiRespond salt değerlendirme');});
test('D6 masa arayüzü: 🛡 Savaşa Yardım Teklif Et → cephe seçilince VER listesinde warJoin; tekrar dokunuş kaldırır',()=>{const h=world();
  const r=J(h,`(()=>{UI.openDeal?UI.openDeal(O.id):UI.deal={to:O.id,give:[],want:[]};if(!UI.deal)UI.deal={to:O.id,give:[],want:[]};UI.deal.to=O.id;UI._dealHelp=O.id;
    const html=UI.dealHelpHtml(UI.deal,E,O);UI.dealHelpPick('front:'+F.id+':'+X.id);const on=UI.deal.give.some(i=>i.t==='warJoin'&&i.front===F.id);UI.dealHelpPick('front:'+F.id+':'+X.id);
    return {html:/SAVAŞA YARDIM TEKLİF ET/.test(html)&&/dealHelpPick/.test(html),on,off:!UI.deal.give.some(i=>i.t==='warJoin')};})()`);
  assert.equal(r.html,true);assert.equal(r.on,true);assert.equal(r.off,true);});
test('D7 bilinmeyen savaş listelenmez (istihbarat yok); müttefikin savaşı ittifakla görünür',()=>{const h=world();
  const r=J(h,`(()=>{E.intel[O.id]=0;const a=warHelpOptions(E,O).length;E.ally[O.id]=O.ally[E.id]=true;const b=warHelpOptions(E,O).length;return {a,b};})()`);
  assert.equal(r.a,0,'gizli savaş sızmaz');assert.equal(r.b,1,'müttefik savaşı görünür');});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
