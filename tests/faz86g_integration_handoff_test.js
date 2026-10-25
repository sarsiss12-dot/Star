'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(__dirname,'..');
const SAVE=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function fresh(){
  const h=runtime({root:ROOT});h.loadSave(SAVE);
  h.run(`var A=G.p,B=G.emps[1],C=G.emps[3];
    for(const e of [A,B,C]){
      e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};
      e.mizac='tuccar';e._pers='tuccar';e.persLock='tuccar';e.contact=e.contact||{};
      e.war=e.war||{};e.nap=e.nap||{};e.pact=e.pact||{};e.ally=e.ally||{};
      e.rel=e.rel||{};e.mem={};e._prof=null;e.res.etk=10000;
    }
    for(const x of [A,B,C])for(const y of [A,B,C])if(x!==y){x.contact[y.id]=true;x.rel[y.id]=20;x.war[y.id]=false;}
    G.council=null;G.feds=[];G.speed=0;`);
  return h;
}
function setTreaties(h,a='A',b='B'){
  h.run(`${a}.nap[${b}.id]=${b}.nap[${a}.id]=G.day+900;
    ${a}.pact[${b}.id]=${b}.pact[${a}.id]=true;
    ${a}.ally[${b}.id]=${b}.ally[${a}.id]=true;`);
}

test('Normal savaş başlangıcı NAP, pakt ve ittifakı iki yönde kapatır',()=>{
  const h=fresh();setTreaties(h);h.run('var ok=declareWar(A,B);');eq(h.run('ok'));
  eq(h.run('A.war[B.id]&&B.war[A.id]'));eq(h.run('A.nap[B.id]===undefined&&B.nap[A.id]===undefined'));
  eq(h.run('A.pact[B.id]===false&&B.pact[A.id]===false'));eq(h.run('A.ally[B.id]===false&&B.ally[A.id]===false'));
  eq(h.run("B.mem[A.id].some(m=>m.k==='ihanet')"));
});
test('Yalnız NAP ihaneti paktBozdu hafızası üretir ve süreyi siler',()=>{
  const h=fresh();h.run('A.nap[B.id]=B.nap[A.id]=G.day+900;var ok=declareWar(A,B);');eq(h.run('ok'));
  eq(h.run("B.mem[A.id].some(m=>m.k==='paktBozdu')"));eq(h.run('A.nap[B.id]===undefined&&B.nap[A.id]===undefined'));
});
test('Başarısız savaş ilanı yürürlükteki antlaşmaları değiştirmez',()=>{
  const h=fresh();setTreaties(h);h.run("A.civics=['golge_kons'];var before=JSON.stringify([A.nap,B.nap,A.pact,B.pact,A.ally,B.ally]);var ok=declareWar(A,B);");
  eq(h.run('ok'),false);eq(h.run('JSON.stringify([A.nap,B.nap,A.pact,B.pact,A.ally,B.ally])===before'));eq(h.run('!A.war[B.id]&&!B.war[A.id]'));
});
test('Konsey yasağını çiğneyen oyuncu ortak savaş kurulumundan geçer',()=>{
  const h=fresh();setTreaties(h);h.run(`G.council={dead:false,members:[A.id],laws:{savasYasak:true},targeted:{savasYasak:B.id}};
    var ok=declareWar(A,B);`);eq(h.run('ok'));eq(h.run('A.war[B.id]&&B.war[A.id]'));
  eq(h.run('A.warSince[B.id]===G.day&&B.warSince[A.id]===G.day'));
  eq(h.run('A.warStart[B.id]===G.day&&B.warStart[A.id]===G.day'));
  eq(h.run('A.nap[B.id]===undefined&&!A.pact[B.id]&&!A.ally[B.id]'));
  eq(h.run('!G.council.members.includes(A.id)'));eq(h.run("B.mem[A.id].some(m=>m.k==='ihanet')"));
});
test('Savaş sürerken eski NAP alanı aktif veya redundant sayılmaz',()=>{
  const h=fresh();h.run(`A.war[B.id]=B.war[A.id]=true;A.nap[B.id]=B.nap[A.id]=G.day+900;
    var active=treatyAlreadyActive(A,B,{t:'nap'});var q=dealQuote({from:A.id,to:B.id,give:[{t:'nap'}],want:[]});`);
  eq(h.run('active'),false);eq(h.run('q.ok'),false);eq(h.run('q.norm.redundantItems.length'),0);
  eq(h.run("q.reasons.some(x=>x.includes('savaş sürerken'))"));
});
test('Diplomasi özeti bozuk ara durumda savaş ve antlaşmaları birlikte göstermez',()=>{
  const h=fresh();setTreaties(h);h.run('A.war[B.id]=B.war[A.id]=true;var html=UI.diploTreaties(A,B);');
  eq(h.run("html.includes('Savaş')"));eq(h.run("html.includes('Saldırmazlık')"),false);
  eq(h.run("html.includes('Ticaret paktı')"),false);eq(h.run("html.includes('İttifak')"),false);
});
test('Eski kayıt göçü savaşla çakışan üç antlaşmayı temizler',()=>{
  const h=fresh();setTreaties(h);h.run(`A.war[B.id]=B.war[A.id]=true;var oldDay=G.day,oldRng=RND_STATE;
    var txt=serialize();var ok=deserialize(txt);A=G.p;B=G.emps[1];`);eq(h.run('ok'));
  eq(h.run('G.day===oldDay&&RND_STATE===oldRng'));eq(h.run('G._loadTreatyInfo.pairs'),1);
  eq(h.run('G._loadTreatyInfo.nap===1&&G._loadTreatyInfo.pact===1&&G._loadTreatyInfo.ally===1'));
  eq(h.run('A.nap[B.id]===undefined&&B.nap[A.id]===undefined&&!A.pact[B.id]&&!B.pact[A.id]&&!A.ally[B.id]&&!B.ally[A.id]'));
});
test('Göç tek yönlü çakışmayı da temizler, savaşsız antlaşmaya dokunmaz',()=>{
  const h=fresh();h.run(`A.war[B.id]=true;B.war[A.id]=false;A.nap[B.id]=G.day+900;B.pact[A.id]=true;A.ally[B.id]=true;
    A.nap[C.id]=C.nap[A.id]=G.day+800;var r=normalizeWarTreaties();`);
  eq(h.run('r.pairs===1&&r.nap===1&&r.pact===1&&r.ally===1'));
  eq(h.run('A.nap[B.id]===undefined&&B.nap[A.id]===undefined&&!A.pact[B.id]&&!B.pact[A.id]&&!A.ally[B.id]&&!B.ally[A.id]'));
  eq(h.run('A.nap[C.id]>G.day&&C.nap[A.id]>G.day'));
});
test('Göç saf ve tekrar çalıştırılabilir; ikinci geçiş sıfır değişikliktir',()=>{
  const h=fresh();setTreaties(h);h.run('A.war[B.id]=B.war[A.id]=true;var day=G.day,rng=RND_STATE,logs=G.log.length;var one=normalizeWarTreaties(),two=normalizeWarTreaties();');
  eq(h.run('one.pairs'),1);eq(h.run('two.pairs'),0);eq(h.run('G.day===day&&RND_STATE===rng&&G.log.length===logs'));
});
test('Göç savaşta kalmış süresi dolmuş NAP alanını da kaldırır',()=>{
  const h=fresh();h.run('A.war[B.id]=B.war[A.id]=true;A.nap[B.id]=B.nap[A.id]=G.day-1;var r=normalizeWarTreaties();');
  eq(h.run('r.pairs===1&&r.nap===1'));eq(h.run('A.nap[B.id]===undefined&&B.nap[A.id]===undefined'));
});
test('Barıştan sonra yeni NAP teklifi eski süre yüzünden engellenmez',()=>{
  const h=fresh();h.run('A.nap[B.id]=B.nap[A.id]=G.day+900;declareWar(A,B);makePeace(A,B);var q=dealQuote({from:A.id,to:B.id,give:[{t:"nap"}],want:[]});');
  eq(h.run('q.ok'));eq(h.run('q.norm.redundantItems.length'),0);
});
test('warOn transaction rollback NAPı geri getirir; commit onu kapatır',()=>{
  const h=fresh();h.run(`A.nap[C.id]=C.nap[A.id]=G.day+900;var offer={from:A.id,to:B.id,give:[{t:'warOn',target:C.id}],want:[]};
    G._dealFailInject=t=>{if(t==='after:warOn')throw Error(t)};var failed=executeDeal(offer);delete G._dealFailInject;`);
  eq(h.run('failed'),false);eq(h.run('!A.war[C.id]&&!C.war[A.id]&&A.nap[C.id]>G.day&&C.nap[A.id]>G.day'));
  h.run('var done=executeDeal(offer);');eq(h.run('done'));eq(h.run('A.war[C.id]&&C.war[A.id]'));
  eq(h.run('A.nap[C.id]===undefined&&C.nap[A.id]===undefined'));
});
test('Sürüm, PWA kabuğu ve kayıt sürümü 86G ile tutarlı',()=>{
  const main=fs.readFileSync(path.join(ROOT,'main.js'),'utf8'),sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
  assert.match(main,/const BUILD_ID = '96h31r1';/);assert.match(sw,/const CACHE = 'stars-v96h31r1';/);
  for(const file of ['index.html','main.js','ui.js','map.js','ai.js','diplomacy.js','economy.js','combat.js','audio.js','manifest.json']){
    assert.ok(fs.existsSync(path.join(ROOT,file)),file);assert.ok(sw.includes(`'./${file}'`),file+' kabukta yok');
  }
  const h=fresh();eq(h.run('JSON.parse(serialize()).v'),8);
});
test('86F AI bütçesi ve bağımsız Radar/Lojistik durumu korunur',()=>{
  const h=fresh();h.run(`var q={from:A.id,to:B.id,give:[{t:'pact'}],want:[]};var cap=aiCounterBudget(A,B,q,[]).cap;
    MAP_MODE='diplomasi';RADAR_ON=true;LOGI_ON=true;`);
  assert.ok(h.run('cap')>0);eq(h.run("MAP_MODE==='diplomasi'&&RADAR_ON&&LOGI_ON"));
  assert.match(fs.readFileSync(path.join(ROOT,'map.js'),'utf8'),/MAP_MODE \+ '\\|' \+ \(RADAR_ON\?'R':'-'\) \+ \(LOGI_ON\?'L':'-'\)/);
});
test('Gerçek oyuncu kaydı yüklenir ve temel dünya alanları sonludur',()=>{
  const h=fresh();assert.ok(h.run('G.sys.length')>=60);assert.ok(h.run('G.emps.length')>=8);
  eq(h.run('Number.isFinite(G.W)&&Number.isFinite(G.H)&&G.W>=500&&G.H>=500'));
  eq(h.run('Number.isFinite(G.p.res.min)&&Number.isFinite(G.day)&&Number.isFinite(RND_STATE)'));
});
test('Kaynak ZIP kimliği paket içi manifestte sabittir',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sha-86g.json'),'utf8'));
  eq(manifest.sourceZip,'stars-faz86f.zip');
  eq(manifest.sourceSha256,'bc693ee97b4c0a7dd4b0610c0f2179d6c9f0729099c210cb335808b2967fbc8d');
});

console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
