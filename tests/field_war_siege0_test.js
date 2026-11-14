'use strict';
/* FIELD-WAR-SIEGE.0 — saha raporu: (1) elle ilan edilen savaş kendiliğinden kapanıyor, (2) 36K filo kuşatmada ilerleme görmüyor,
   (3) bekleyen askerî sevkiyatlar tek tek yeniden denenmek zorunda. Kontrollü fikstür (kullanıcı kaydı eklenmedi).
   STARS_ROOT=<kök> ile aynı test eski ağaçta koşturulur (ilk FAIL kanıtı: reports/claude/evidence/field-war-siege0/). */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};

function world(){
  const h=runtime({root:ROOT});
  h.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5,pirates:false});G.autoSave=false;var A=G.p,S=G.emps[1];S.name='Synarth Sığınağı';
   A.contact[S.id]=S.contact[A.id]=true;for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);S.civics=[];A.civics=A.civics.filter(c=>c!=='kan_hukuku');
   for(const l of G.sys[S.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,3))territoryOwnerSet(G.sys[l],S.id);
   var T=G.sys[S.home],P=T.planets.find(p=>p.col&&p.owner===S.id);
   globalThis.__log=[];const _say=say;say=function(m,c){__log.push({d:Math.floor(G.day),m:String(m)});return _say.apply(this,arguments);};
   function month(n=1){for(let i=0;i<n*60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}
   function big(sys){const f=newFleet(A,sys,[{c:'kor'}]);while(fleetPower(f)<36000)f.ships.push({c:'kor',h:1});return f;}
   function fronts(){return G.warLedger.fronts.filter(f=>f.sides.includes(0)&&f.sides.includes(S.id)).map(f=>({id:f.id,o:Math.floor(f.opened),e:f.ended===null?null:Math.floor(f.ended),r:f.endReason}));}`);
  return h;
}

/* ═══ 1 — savaşın kendiliğinden kapanması ═══ */
test('W1 yeni savaş + olağan barış: tek cephe, kapanış nedeni / tarafı / tarihi defterde',()=>{
  const h=world();h.run(`declareWar(A,S);month(2);makePeace(A,S,'agreement',0);`);
  const f=J(h,'fronts()');assert.equal(f.length,1);assert.ok(f[0].e!==null);assert.match(f[0].r,/^agreement\|actor:0/);
  assert.equal(h.run('!!A.war[S.id]||!!S.war[A.id]'),false);
});
function exhaustTo100(h){h.run(`S.exh=S.exh||{};S.exh[A.id]=99.5;`);let m=0;while(m<4&&h.run('!!A.war[S.id]')){h.run('month(1)');m++;}return m;}
test('W2 geçerli zorunlu barış (Synarth %100 yorgunluk): tek kapanış, "çekildi" tarafı Synarth, tek oyuncu bildirimi; yorgunluk 55',()=>{
  const h=world();h.run(`declareWar(A,S);month(1);__log.length=0;`);exhaustTo100(h);
  const f=J(h,'fronts()');assert.equal(f.length,1);assert.match(f[0].r,new RegExp('^exhaustion\\|actor:'+1));
  assert.equal(h.run('!!A.war[S.id]'),false);assert.equal(h.run('Math.round(S.exh[A.id])'),55);
  const lines=J(h,'__log.filter(l=>/YORGUNLU|barış imzalandı|kendiliğinden durdu|savaştan çekildi/i.test(l.m)&&!/[-+][0-9]+ — /.test(l.m))');
  assert.equal(lines.length,1,'tek bildirim: '+JSON.stringify(lines));assert.match(lines[0].m,/SAVAŞ YORGUNLUĞU %100/);assert.match(lines[0].m,/Savaş #\d+/);
});
test('W3 zorunlu ateşkes (Kan Hukuku barışı yasaklar): makePeace defteri tutar, neden exhaustion-lock, "barış imzalandı" denmez',()=>{
  const h=world();h.run(`S.civics=['kan_hukuku'];declareWar(A,S);setWarGoal(A,S,'fetih',{targets:warFetihDefault(A,S)});month(1);__log.length=0;`);exhaustTo100(h);
  const f=J(h,'fronts()');assert.equal(f.length,1);assert.ok(f[0].e!==null,'cephe kapandı');assert.match(f[0].r,/^exhaustion-lock\|actor:1/);
  assert.equal(h.run('!!(A.wg&&A.wg[S.id])'),false,'savaş hedefi temizlendi');
  const lines=J(h,'__log.filter(l=>/YORGUNLU|barış imzalandı|kendiliğinden durdu|savaştan çekildi/i.test(l.m)&&!/[-+][0-9]+ — /.test(l.m))');
  assert.equal(lines.length,1,JSON.stringify(lines));assert.match(lines[0].m,/zorunlu ateşkes/);assert.doesNotMatch(lines[0].m,/barış imzalandı/);
});
test('W4 aynı hedefe art arda iki elle yeniden ilan: önizleme yorgunluk riskini gösterir; her savaş ayrı cephe, bir kez kapanır, toprak bir kez el değiştirir',()=>{
  const h=world();h.run(`declareWar(A,S);month(1);`);exhaustTo100(h);
  const owners0=J(h,'G.sys.map(s=>s.owner)');   /* yalnız A ↔ S arasındaki el değiştirme sayılır (öteki AI'lar genişleyebilir) */
  for(let r=1;r<=2;r++){
    const pv=J(h,`(()=>{const p=warDeclarationPreview(A,S,'fetih',{targets:warFetihDefault(A,S)});return {ok:p.ok,exh:p.exh,risks:p.risks.filter(x=>/yorgunlu/i.test(x))};})()`);
    assert.equal(pv.ok,true);assert.ok(pv.exh&&Number.isFinite(pv.exh.foe),'önizleme: rakibin yorgunluğu (tahmin ya da kesin) '+JSON.stringify(pv.exh));
    assert.ok(pv.risks.length>=1,'risk satırı: '+JSON.stringify(pv));
    h.run(`declareWar(A,S);setWarGoal(A,S,'fetih',{targets:warFetihDefault(A,S)});`);const d0=h.run('Math.floor(G.day)');
    assert.equal(J(h,'fronts().filter(f=>f.e===null).length'),1,'tek açık cephe');
    h.run(`S.exh[A.id]=99.5;`);let m=0;while(m<4&&h.run('!!A.war[S.id]')){h.run('month(1)');m++;}
    const f=J(h,'fronts()');assert.equal(f.length,1+r);const last=f[f.length-1];assert.ok(last.o>=d0&&last.e!==null&&last.e>=last.o);
    assert.match(last.r,/^exhaustion\|actor:1/);
  }
  const closes=J(h,'G.warLedger.fronts.filter(f=>f.sides.includes(0)&&f.sides.includes(S.id)).map(f=>f.ended)');assert.equal(new Set(closes).size,closes.length,'aynı cephe iki kez kapanmaz');
  const now=J(h,'G.sys.map(s=>s.owner)');assert.equal(now.filter((o,i)=>(owners0[i]===1&&o===0)||(owners0[i]===0&&o===1)).length,0,'işgalsiz savaşlarda A ↔ S toprak değişmez');
});
test('W5 Fetih v2 zorunlu barış: hedef dışı işgal tam bir kez iade edilir; hedef sistem kazanana kalır; ikinci devir yok',()=>{
  const h=world();h.run(`var ts=warFetihDefault(A,S);declareWar(A,S);setWarGoal(A,S,'fetih',{targets:ts.slice(0,1)});
    var X=G.sys.find(s=>s.owner===S.id&&s.id!==S.home&&s.id!==ts[0]),Y=G.sys[ts[0]];captureSystem(X,A.id);captureSystem(Y,A.id);
    var moves=[];const _c=captureSystem;captureSystem=function(s,to,m){moves.push([s.id,to,m||'']);return _c.apply(this,arguments);};S.exh=S.exh||{};`);
  assert.equal(J(h,'[X.owner,Y.owner]').join(),'0,0');assert.ok(J(h,'warLedgerFind(0,1).occupation.length')>=2);
  h.run(`S.exh[A.id]=99.5;`);let m=0;while(m<4&&h.run('!!A.war[S.id]')){h.run('month(1)');m++;}
  assert.equal(h.run('!!A.war[S.id]'),false);assert.equal(h.run('X.owner'),1,'hedef dışı sistem iade');assert.equal(h.run('Y.owner'),0,'hedef sistem kalır');
  assert.equal(J(h,'moves.filter(x=>x[0]===X.id)').length,1,'tek iade: '+h.run('JSON.stringify(moves)'));
  h.run('month(2)');assert.equal(J(h,'moves.filter(x=>x[0]===X.id||x[0]===Y.id)').length,1,'kapanıştan sonra ikinci devir yok');
});
test('W6 kayıt/yükleme: yeniden ilan edilmiş savaş ve yorgunluk aynı kalır; yüklemeden sonraki kapanış aynı gün ve nedenle',()=>{
  const h=world();h.run(`declareWar(A,S);month(1);`);exhaustTo100(h);h.run(`declareWar(A,S);month(2);var SAVE=serialize();`);
  h.run(`S.exh[A.id]=99.5;`);let m=0;while(m<4&&h.run('!!A.war[S.id]')){h.run('month(1)');m++;}const a=J(h,'fronts()');
  const g=world();g.sb.SAVE=h.run('SAVE');assert.equal(g.run('deserialize(SAVE)'),true);g.run('A=G.p;S=G.emps[1];');assert.equal(g.run('!!A.war[S.id]'),true);
  g.run(`S.exh[A.id]=99.5;`);m=0;while(m<4&&g.run('!!A.war[S.id]')){g.run('month(1)');m++;}assert.deepEqual(J(g,'fronts()'),a);
});

/* ═══ 2 — kuşatma ═══ */
function siege(sc){
  const h=world();h.run(`warAuthorize(A,S,{n:'t'});declareWar(A,S);warAuthClear();S.exh={};A.exh={};`);
  if(sc==='ally')h.run("var Z=G.emps[2];Z.ally[S.id]=S.ally[Z.id]=true;newFleet(Z,T.id,[{c:'ord'}]);");
  h.run(`var F=big(T.id);var flips=0,lastOwner=P.owner;`);
  if(sc==='army')h.run(`newFleet(A,G.sys[T.lanes[0]].id,[{c:'ord'},{c:'ord'},{c:'ord'}]).path=[T.id];`);
  if(sc==='held')h.run(`var tf=newFleet(A,A.home,[{c:'ord'},{c:'ord'}]);tf.path=findPath(A.home,T.id,A)||[];tf.jointHoldUntil=G.day+99999;`);
  if(sc==='blockedShip')h.run(`var tf=newFleet(A,A.home,[{c:'ord'},{c:'ord'}]);tf.shipment={sys:T.id,state:'paused',attempts:4,next:0,reason:'Rota kapalı'};tf.rallyTo=T.id;tf.path=[];`);
  const rows=[];
  for(let m=1;m<=30;m++){
    h.run('month(1);if(P.owner!==lastOwner){flips++;lastOwner=P.owner;}');
    if(sc==='peace'&&m===3)h.run("makePeace(A,S,'agreement',0)");
    rows.push(J(h,`{m:${m},owner:P.owner,shield:Math.round(P.col.shield||0),garr:Math.round(P.col.garrison||0),siege:P.col.siege||0,truce:P.col.truce!==undefined,st:typeof siegeStatus==='function'?siegeStatus(T,P,0):null,war:!!A.war[S.id],stop:typeof siegeStopRows==='function'?siegeStopRows(T,A).length:0}`));
    if(rows[rows.length-1].owner===0)break;
  }
  return {h,rows,flips:h.run('flips')};
}
test('K1 sürekli savaş, kara ordusuz bombardıman: 6 ay ilerleme (1/6 … 6/6) ve tek sahiplik değişimi',()=>{
  const {rows,flips}=siege('bombard');const last=rows[rows.length-1];assert.equal(last.owner,0,JSON.stringify(rows.slice(-3)));assert.ok(rows.length<=8,'ay: '+rows.length);assert.equal(flips,1);
  assert.ok(rows.some(r=>r.st&&r.st.code==='siege'&&/Bombardıman ilerlemesi \d\/6 ay/.test(r.st.text)),JSON.stringify(rows.map(r=>r.st)));
});
test('K2 kara ordusu çıkarması: kalkan düşükken bir iki ayda alınır, tek sahiplik değişimi',()=>{
  const {rows,flips}=siege('army');assert.equal(rows[rows.length-1].owner,0);assert.ok(rows.length<=2,JSON.stringify(rows));assert.equal(flips,1);
});
test('K3 bekletilen (yürümeyen) kara ordusu son direnişi ateşkeste TUTMAZ: bombardıman kural süresinde sonuçlanır',()=>{
  const {rows}=siege('held');assert.equal(rows[rows.length-1].owner,0,'30 ayda alınmadı: '+JSON.stringify(rows.slice(0,8)));assert.ok(rows.length<=8,'ay '+rows.length);
  assert.ok(!rows.some(r=>r.truce),'bekletilen ordu yüzünden ateşkes yok');
});
test('K4 rotası kapalı (otomatik deneme sınırında) ordu sevkiyatı "yolda" sayılmaz',()=>{
  const {rows}=siege('blockedShip');assert.equal(rows[rows.length-1].owner,0);assert.ok(rows.length<=8);assert.ok(!rows.some(r=>r.truce));
});
test('K5 kuşatma ortasında barış: sayaç sıfırlanır, garnizon toparlanır, panel somut neden söyler; yeni savaş eski sayaçtan devam etmez',()=>{
  const {h,rows}=siege('peace');assert.notEqual(rows[rows.length-1].owner,0);
  const after=rows.slice(4);assert.ok(after.every(r=>r.siege===0),'barıştan sonra sayaç 0: '+JSON.stringify(after.slice(0,3)));
  assert.ok(after[after.length-1].garr>after[0].garr,'garnizon toparlanır');
  const st=after[0].st;assert.equal(st.code,'nowar');assert.match(st.text,/Kuşatma durdu — gezegen sahibiyle savaş sona erdi/);
  assert.equal(after[0].stop,1,'sistem panelinde KUŞATMA DURDU satırı');
});
test('K6 müttefik kara birlikleri garnizonu destekliyor: durum metni gerçek nedeni söyler',()=>{
  const {rows}=siege('ally');const stuck=rows.filter(r=>r.st&&r.st.code==='allied');assert.ok(stuck.length>=1,JSON.stringify(rows.slice(0,4).map(r=>r.st)));
});
test('K7 kalkan yüksekken "Kalkan düşürülüyor"; ateşkeste "Kara ordusu bekleniyor"',()=>{
  const h=world();h.run(`warAuthorize(A,S,{n:'t'});declareWar(A,S);warAuthClear();var F=big(T.id);P.col.shield=60;`);
  assert.equal(J(h,'siegeStatus(T,P,0)').code,'shield');assert.match(J(h,'siegeStatus(T,P,0)').text,/^Kalkan düşürülüyor/);
  h.run('P.col.shield=0;P.col.truce=0;P.col.truceAge=3;');const st=J(h,'siegeStatus(T,P,0)');assert.equal(st.code,'truce');assert.match(st.text,/Kara ordusu bekleniyor.*3\/18/);
});
test('K8 MP aynası: savaşta ve yörüngede olan misafir ateşkes/destek alanlarını, barıştan sonra yalnız kamu savaş sonunu görür; yörüngede değilse hiçbiri',()=>{
  const h=world();h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`warAuthorize(A,S,{n:'t'});declareWar(A,S);warAuthClear();var F=big(T.id);if(!T.surv.includes(0))T.surv.push(0);P.col.truce=0;P.col.truceAge=4;P.col.reinforced=12;`);
  const pick=()=>J(h,`(()=>{const w=StarsMirror.build(0);const s=w.sys.find(x=>x.i===T.id);const p=s&&s.p.find(x=>x.i===P.i);return p&&p.col?{truce:p.col.truce,ta:p.col.truceAge,re:p.col.reinforced,se:p.col.siegeEnd}:null;})()`);
  let c=pick();assert.equal(c.truce,0);assert.equal(c.ta,4);assert.equal(c.re,12);
  h.run(`makePeace(A,S,'agreement',0);`);c=pick();assert.equal(c.truce,undefined);assert.ok(c.se&&c.se.r==='agreement',JSON.stringify(c));
  h.run(`F.sys=A.home;`);c=pick();assert.ok(!(c&&c.se),'yörüngede değil');
});

/* ═══ 3 — Bekleyenleri Yeniden Dene ═══ */
function shipWorld(){
  const h=world();h.run(`var ana=newFleet(A,A.home,[{c:'kor'}]);ana.name='Araştırma 3';
   var nb=G.sys[A.home].lanes.map(i=>G.sys[i]),far=G.sys.find(s=>s.id!==A.home&&!G.sys[A.home].lanes.includes(s.id)&&findPath(A.home,s.id,A));
   function ship(name,d){const f=newFleet(A,A.home,[{c:'kor'},{c:'muh'}]);f.name=name;f.shipment={...d,attempts:d.attempts||0,next:d.next||0,origin:A.home};if(d.fleet!==undefined)f.joinFleet=d.fleet;else f.rallyTo=d.sys;f.path=[];return f;}
   var iso=G.sys.find(s=>s.id!==A.home&&s.id!==far.id&&s.owner<0&&!s.planets.some(p=>p.col)&&!(findPath(A.home,far.id,A)||[]).includes(s.id));for(const l of iso.lanes){G.sys[l].lanes=G.sys[l].lanes.filter(x=>x!==iso.id);}var isoL=iso.lanes;iso.lanes=[];if(typeof TRADE_PATHS!=='undefined')TRADE_PATHS.clear?.();
   ana.sys=far.id;
   var a1=ship('Arran',{fleet:ana.id,state:'blocked',attempts:2,next:G.day+40,reason:'Bilinen düşman tehdidi — güvenli rota yok'});
   var a2=ship('Lyrdex-59',{fleet:ana.id,state:'paused',attempts:4,reason:'Bilinen düşman tehdidi — güvenli rota yok'});
   var b1=ship('Kapalı',{sys:iso.id,state:'blocked',attempts:1,next:G.day+5});
   var gone=newFleet(A,A.home,[{c:'kor'}]);var l1=ship('Kayıp',{fleet:gone.id,state:'blocked',attempts:1,next:G.day+5});gone.ships.length=0;G.fleets.splice(G.fleets.indexOf(gone),1);
   var m1=ship('Yolda',{sys:far.id,state:'moving'});m1.path=findPath(A.home,far.id,A);
   var RES0=JSON.stringify(A.res),SHIPS0=G.fleets.filter(f=>f.e===0).reduce((n,f)=>n+f.ships.length,0);`);
  return h;
}
test('S1 tek liste, tek dokunuş: rota açılan iki (biri otomatik sınırda) yola çıkar, kapalı rota bekler, kayıp hedef bildirilir, yoldaki dokunulmaz; kaynak/gemi değişmez',()=>{
  const h=shipWorld();const list=J(h,'shipmentRetryList(A).map(r=>[r.f.name,r.cls])');
  assert.deepEqual(Object.fromEntries(list),{Arran:'retry','Lyrdex-59':'retry',Kapalı:'retry',Kayıp:'lost',Yolda:'moving'});
  const m1p=J(h,'m1.path');const r=J(h,'shipmentRetryAll(A)');assert.equal(r.ok,true);
  assert.deepEqual({mv:r.counts.moved,bl:r.counts.blocked,lo:r.counts.lost,mo:r.counts.moving},{mv:2,bl:1,lo:1,mo:1},JSON.stringify(r));
  assert.equal(r.text,'2 yola çıktı · 1 güvenli rota bekliyor · 1 hedef bulunamadı — hedef değiştir · 1 zaten yolda');
  assert.ok(J(h,'a1.path.length>0&&a2.path.length>0'));assert.equal(J(h,'a2.shipment.state'),'moving');assert.equal(J(h,'b1.shipment.state'),'blocked');
  assert.equal(J(h,'l1.shipment.state'),'lost');assert.deepEqual(J(h,'m1.path'),m1p);
  assert.equal(h.run('JSON.stringify(A.res)'),h.run('RES0'));assert.equal(h.run('G.fleets.filter(f=>f.e===0).reduce((n,f)=>n+f.ships.length,0)'),h.run('SHIPS0'));
  assert.match(J(h,'shipmentStatus(l1)'),/yeni hedef seç/);
});
test('S2 çift dokunuş: ikinci çağrı yola çıkanları yeniden başlatmaz (zaten yolda), yolları değişmez',()=>{
  const h=shipWorld();h.run('shipmentRetryAll(A)');const p=J(h,'[a1.path,a2.path]');const r=J(h,'shipmentRetryAll(A)');
  assert.equal(r.counts.moved,0);assert.equal(r.counts.moving,3);assert.deepEqual(J(h,'[a1.path,a2.path]'),p);
});
test('S3 ortak rota bütçesi: 11 bekleyen → 8 rota hesabı şimdi, 3 sırada; sonraki filo adımında aranır',()=>{
  const h=shipWorld();h.run(`for(let i=0;i<8;i++)ship('Ek'+i,{fleet:ana.id,state:'paused',attempts:4});`);
  const r=J(h,'shipmentRetryAll(A)');assert.equal(r.counts.moved+r.counts.blocked,8,JSON.stringify(r));assert.equal(r.counts.queued,3);assert.match(r.text,/3 rota hesabı sırada/);
  h.run('stepFleets(.5)');assert.equal(h.run('G.fleets.filter(f=>f.e===0&&f.shipment&&f.shipment.state==="ready").length'),0);
});
test('S4 kayıt/yükleme: sevkiyat durumları ve yolları korunur; yüklemeden sonra yeniden deneme aynı sonucu verir',()=>{
  const h=shipWorld();h.sb.SAVE=h.run('serialize()');const r1=J(h,'shipmentRetryAll(A).counts');
  const g=world();g.sb.SAVE=h.sb.SAVE;assert.equal(g.run('deserialize(SAVE)'),true);g.run('A=G.p;');
  assert.deepEqual(J(g,'shipmentRetryList(A).map(r=>[r.f.name,r.cls])').length,5);
  assert.deepEqual(J(g,'shipmentRetryAll(A).counts'),r1);
  g.sb.S2=g.run('serialize()');const k=world();k.sb.S2=g.sb.S2;assert.equal(k.run('deserialize(S2)'),true);
  assert.deepEqual(J(k,'G.fleets.filter(f=>f.e===0&&f.shipment).map(f=>[f.name,f.shipment.state])'),J(g,'G.fleets.filter(f=>f.e===0&&f.shipment).map(f=>[f.name,f.shipment.state])'));
});
test('S5 MP: misafir yalnız kendi sevkiyatlarını yeniden dener; başka oyuncununkine dokunmaz; boşsa açık ret',()=>{
  const {world:mw,cmd}=require('./helpers/beta-fed-found0-mp-world.cjs');if(ROOT!==path.resolve(__dirname,'..'))throw Error('MP denetimi yalnız çalışma ağacında');
  const h=mw();h.run(`for(const e of G.emps)for(const o of G.emps)if(e!==o){e.ally[o.id]=false;}
    function ship(e,d){const f=newFleet(e,e.home,[{c:'kor'}]);f.shipment={...d,attempts:4,next:0,origin:e.home};f.rallyTo=d.sys;f.path=[];return f;}
    var nb1=G.sys[G.emps[1].home].lanes[0],nb3=G.sys[G.emps[3].home].lanes[0];var b=ship(G.emps[1],{sys:nb1,state:'paused'}),c=ship(G.emps[3],{sys:nb3,state:'paused'});`);
  const r=cmd(h,'B',{kind:'shipmentRetryAll'});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(r.extra.counts.moved,1);assert.match(r.extra.text,/1 yola çıktı/);
  assert.equal(h.run('c.shipment.state'),'paused','C\'nin sevkiyatı değişmedi');
  const again=cmd(h,'B',{kind:'shipmentRetryAll'});assert.notEqual(again.status,'ok');assert.match(again.code,/nothing-to-retry/);
  assert.notEqual(cmd(h,'B',{kind:'shipmentRetryAll',fleet:h.run('c.id')}).status,'ok','fazla alan reddedilir');
});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
