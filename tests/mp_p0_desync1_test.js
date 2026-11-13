'use strict';
/* MP-P0-DESYNC1 — misafir dünyası "Galaksi verisi kurulamadı: kayıt doğrulaması reddetti" ile donuyordu (gerçek Render bildirimi,
   2214.08 civarı; ekran görüntüsünde reddedilen alan görünmüyor). Yerelde kanıtlanan kusur: applyInternalPolicy süreleri
   `started + gün` diye yazar; validInternalPolicy ise `until - started === gün` diye ÇIKARARAK denetliyordu. Kesirli günde
   (dt adımlı oyun saati) kayan nokta farkı motorun kendi yazdığı değeri reddeder:
     1000.1 + 180 − 1000.1 = 179.9999999999999   ·   1650.0001 + 720 − 1650.0001 = 720.0000000000002
   Bu dosya düzeltmeden ÖNCE FAIL, sonra PASS olmak üzere yazıldı. Gerçek host karar yolu: misafirin MP komutu internalQuote →
   internalPolicy (motorun internalPolicyQuote / applyInternalPolicy'si). Aynı kanonik dünyadan: fark paketi (mirrorDelta),
   tam ayna (resync), host Save8 ve MP kayıt paketi motorun kendi deserialize'ıyla yüklenebilmeli. Yanlış sahip, yanlış tür, yanlış
   süre ve geçersiz tarih yine reddedilir (doğrulama gevşetilmez, tarih yuvarlanmaz, Save8 sürümü değişmez). */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIRROR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update('ds1:'+(n++)).digest('hex').slice(0,k*2);}
const DRAFT=(name,mizac)=>({name,race:'klan',mizac,physio:'avian',look:'surungen',origin:'standart',sigil:'simetrik',ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],traits:[]});
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const take=(h,conn)=>{const o=h.sb.__out.filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));h.sb.__out=h.sb.__out.filter(([c])=>c!==conn);return o;};
function cmd(h,conn,c){h.run(`seq.${conn}=(seq.${conn}||0)+1`);const s=h.run('seq.'+conn),cid='ds1'+conn+String(s).padStart(5,'0');
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid,cmd:c}))})`);
  return h.sb.__out.filter(([k])=>k===conn).map(([,t])=>JSON.parse(t)).filter(m=>m.type==='result'&&m.cid===cid).at(-1);}
function world(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(MIRROR);h.run(CORE);
  h.sb.__D=DRAFT('Kızıl Muhafız','militarist');h.sb.__G=[DRAFT('Saf Akıl Ağı','teknokrasi'),DRAFT('Yeşil Birlik','tuccar')];
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'ds1',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>__D,generate(s){const{host,...rest}=s;setupGame({...CFG,...__D,...rest});G.autoSave=false;return{ok:true};}}});
    MP.installGuards();MP.setCapacity(3);var __cfg=MP.configure({size:'orta',aiCount:5,seed:22});
    __G.forEach((d,i)=>{const c='g'+i;MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:'G'+i}));MP.onMessage(c,JSON.stringify({v:1,type:'draft',rev:1,draft:d}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));});
    var __st=MP.start();__G.forEach((d,i)=>MP.onMessage('g'+i,JSON.stringify({v:1,type:'ui',mode:'stars'})));var seq={};`);
  assert.deepEqual(J(h,'[__cfg,__st]'),[{ok:true},{ok:true}]);
  return h;
}
/* misafir motoru: ilk tam ayna + sonraki farklar, misafirin yaptığı gibi (StarsMirror.apply → deserialize) */
function guest(h,conn){const g=runtime({root});g.run(MIRROR);const msgs=take(h,conn),full=msgs.filter(m=>m.type==='mirror').at(-1);assert(full,'başlangıç tam aynası');
  g.sb.__m=full.full;g.sb.__rev=full.rev;assert.equal(g.run('deserialize(JSON.stringify(__m))'),true,'başlangıç aynası kurulur');return g;}
function feed(g,msgs){let n=0,ok=true;for(const m of msgs){if(m.type==='mirror'){g.sb.__m=m.full;g.sb.__rev=m.rev;n++;}
  else if(m.type==='mirrorDelta'){assert.equal(m.base,g.sb.__rev,'fark tabanı misafirin elindeki revizyon');g.sb.__ops=m.ops;g.run('StarsMirror.apply(__m,__ops)');g.sb.__rev=m.rev;n++;}}
  if(n)ok=g.run('deserialize(JSON.stringify(__m))');return {n,ok};}
/* MP.7 tasarım kipi: g0 = devlet 1. Kolonide müdahale gerektiren huzursuzluk + bedel (fikstür; karar ve uygulama motorun yolundan) */
function prepare(h,day,kind){
  return J(h,`(()=>{G.day=${day};const e=G.emps[1],s=G.sys[e.home],p=s.planets.find(p=>p.owner===1&&p.col);p.col.stab=40;delete p.col.crisisPolicy;
    for(const k of Object.keys(e.res))e.res[k]=Math.max(e.res[k],1000);return {sys:s.id,planet:p.i,kind:${JSON.stringify(kind)}};})()`);
}
function decide(h,at){
  const q=cmd(h,'g0',{kind:'internalQuote',sys:at.sys,planet:at.planet,policy:at.kind});assert.equal(q.status,'ok');assert.equal(q.extra.ok,true,'önizleme: '+q.extra.why);
  const r=cmd(h,'g0',{kind:'internalPolicy',sys:at.sys,planet:at.planet,policy:at.kind,stamp:q.extra.stamp});assert.equal(r.status,'ok','host kararı uyguladı');
  return {q:q.extra,r:r.extra,pol:J(h,`G.sys[${at.sys}].planets[${at.planet}].col.crisisPolicy`)};
}
const CASES=[
  ['relief',1000.1,180,360,'Halkı yatıştır · G.day=1000.1 (180 gün → 179.9999999999999)'],
  ['autonomy',1650.0001,360,720,'Yerel özerklik · G.day=1650.0001 ≈ 2214.08 (720 gün bekleme → 720.0000000000002)']];
for(const [kind,day,days,cool,label] of CASES){
  test('A '+label+': host kararı → fark paketi, tam ayna, host Save8 ve MP paketi aynı dünyadan yüklenir',()=>{
    const h=world(),g=guest(h,'g0'),g1=guest(h,'g1');h.run('step(1);MP.publish()');feed(g,take(h,'g0'));feed(g1,take(h,'g1'));
    const at=prepare(h,day,kind),d=decide(h,at);
    /* motorun yazdığı değerler: yuvarlama yok */
    assert.equal(d.pol.started,day);assert.equal(d.pol.until,day+days);assert.equal(d.pol.after,day+cool);assert.equal(d.pol.owner,1);assert.equal(d.pol.kind,kind);
    assert.equal(J(h,`G.day`),day,'gün kesirli kalır (yuvarlanmaz)');
    /* 1) fark paketi (misafirin aynası) */
    h.run('MP.publish()');const a=feed(g,take(h,'g0'));assert(a.n>=1,'g0 fark paketi aldı');
    assert.equal(a.ok,true,'fark paketi uygulanmış ayna motorun deserialize\'ıyla kurulur');
    assert.equal(J(g,`G.sys[${at.sys}].planets[${at.planet}].col.crisisPolicy.until`),day+days,'misafirin dünyasında aynı süre');
    /* öteki misafir etkilenmez (politika yalnız sahibinin aynasında) */
    const b=feed(g1,take(h,'g1'));assert.equal(b.ok,true,'öteki misafir kurmaya devam eder');
    /* 2) tam ayna (yeniden eşitleme) */
    h.run(`MP.onMessage('g0',JSON.stringify({v:1,type:'resync'}))`);const full=take(h,'g0').filter(m=>m.type==='mirror').at(-1);assert(full,'resync tam ayna üretir');
    const gf=runtime({root});gf.sb.__t=JSON.stringify(full.full);assert.equal(gf.run('deserialize(__t)'),true,'tam ayna kurulur');
    /* 3) host Save8 — aynı kanonik dünya */
    const s8=h.run('serialize()'),hs=runtime({root});hs.sb.__t=s8;assert.equal(hs.run('deserialize(__t)'),true,'host Save8 yüklenir');
    assert.equal(JSON.parse(s8).v,8,'Save8 sürümü değişmez');assert.equal(J(hs,`G.sys[${at.sys}].planets[${at.planet}].col.crisisPolicy`).until,day+days,'yüklenen host dünyasında politika aynı');
    /* 4) MP kayıt paketi (mpVersion 4) → doğrula → yükle */
    const pkg=h.run('JSON.stringify(MP.snapshot({}).pkg)'),hp=runtime({root});hp.sb.__rand=rnd(900);hp.run(MIRROR);hp.run(CORE);hp.sb.__p=pkg;
    assert.deepEqual(J(hp,`(()=>{const V=StarsMP.validatePackage(__p);const L=V.ok?StarsMP.loadWorld(V.pkg):null;return {v:V.ok,why:V.why||null,l:!!(L&&L.ok),lw:L&&L.why||null,mp:V.ok?V.pkg.mpVersion:null};})()`),{v:true,why:null,l:true,lw:null,mp:4});
    assert.equal(hp.run('serialize()'),hs.run('serialize()'),'paketten yüklenen dünya = aynı Save8\'in motorun kendi yüklemesi (bayt bayt)');
  });
}
test('B koruma gevşemez: yanlış sahip, yanlış tür, yanlış süre (bir ulp bile), yanlış bekleme ve geçersiz tarih reddedilir',()=>{
  const h=world();const at=prepare(h,1650.0001,'autonomy');decide(h,at);const s8=JSON.parse(h.run('serialize()'));
  const p=s8.sys[at.sys].p[at.planet],base=JSON.stringify(p.col.crisisPolicy);
  const tryLoad=mut=>{p.col.crisisPolicy=JSON.parse(base);mut(p.col.crisisPolicy);const r=runtime({root});r.sb.__t=JSON.stringify(s8);return r.run('deserialize(__t)');};
  assert.equal(tryLoad(()=>{}),true,'özgün değer geçerli');
  const bad={
    'sahip = devlet sayısı':x=>{x.owner=s8.emps.length;},'sahip negatif':x=>{x.owner=-1;},'sahip kesirli':x=>{x.owner=1.5;},
    'bilinmeyen tür':x=>{x.kind='martial';},'tür/süre uyuşmazlığı (relief)':x=>{x.kind='relief';},
    'süre +1 gün':x=>{x.until+=1;},'süre bir ulp eksik':x=>{x.until=x.until-x.until*Number.EPSILON;},'süre yuvarlanmış başlangıçla':x=>{x.until=Math.round(x.started)+360;},
    'bekleme −1 gün':x=>{x.after-=1;},'başlangıç negatif':x=>{x.started=-1;x.until=x.started+360;x.after=x.started+720;},'başlangıç NaN (JSON null)':x=>{x.started=null;},
    'fazla alan':x=>{x.extra=1;},'sürüm 2':x=>{x.v=2;}};
  for(const [n,f] of Object.entries(bad))assert.equal(tryLoad(f),false,n+' reddedilmeli');
});
test('C ret nedeni ayırt edilir: aşama · kısa kod · alan yolu; değer / jeton / oda anahtarı yok',()=>{
  const h=world();const at=prepare(h,1000.1,'relief');decide(h,at);const s8=JSON.parse(h.run('serialize()'));
  s8.sys[at.sys].p[at.planet].col.crisisPolicy.until+=1;const r=runtime({root});r.sb.__t=JSON.stringify(s8);
  assert.equal(r.run('deserialize(__t)'),false);
  assert.equal(r.run('typeof saveLoadReject'),'function','motor son reddin nedenini verir');
  const why=J(r,'saveLoadReject()');assert.deepEqual(Object.keys(why).sort(),['code','path','stage']);
  assert.equal(why.stage,'envelope');assert.equal(why.code,'crisisPolicy.until');assert.equal(why.path,'sys['+at.sys+'].p['+at.planet+'].col.crisisPolicy');
  r.sb.__t='{bozuk';assert.equal(r.run('deserialize(__t)'),false);assert.equal(J(r,'saveLoadReject()').stage,'json');
  r.sb.__t=JSON.stringify({...s8,day:-1});assert.equal(r.run('deserialize(__t)'),false);assert.deepEqual(J(r,'saveLoadReject()'),{stage:'envelope',code:'day',path:'day'});
  r.sb.__t=JSON.stringify(s8).replace('"until":'+(1000.1+181),'"until":'+(1000.1+180));assert.equal(r.run('deserialize(__t)'),true,'geçerli kayıt');assert.equal(J(r,'saveLoadReject()'),null,'başarılı yüklemede ret kaydı temizlenir');
  assert(!/token|jeton|key|anahtar/i.test(JSON.stringify(why)));
});
end();
