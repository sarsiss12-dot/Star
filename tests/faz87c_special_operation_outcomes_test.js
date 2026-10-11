'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
function eq(a,b=true){assert.equal(a,b);}
function fresh(actor=0,target=1){
  const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
  h.run(`var A=G.emps[${actor}],B=G.emps[${target}];
    for(const e of [A,B]){
      e.dead=false;e.wild=false;e.crisisSide=false;e.civics=[];e.opLog=[];e.hitLog=[];
      e.intel={};e.war={};e.ally={};e.mem={};e.res.etk=10000;e.res.ara=0;
    }
    A.contact[B.id]=true;B.contact[A.id]=true;A.intel[B.id]=3;B.intel[A.id]=3;
    A.rel[B.id]=0;B.rel[A.id]=0;A.techs={};B.techs={t_tarim:true};
    var cp=B.colonies[0],sy=G.sys[cp.s],pl=sy.planets[cp.p];
    B.home=-1;sy.lanes.push(A.home);pl.martial_law=0;pl.col.stab=30;pl.col.secede=0;
    var logs=[];UI.alert=function(msg){logs.push(msg);};
    function snapshot(){return JSON.stringify([G.emps,G.sys,G.log,G.inbox,RND_STATE]);}
    function dice(outcome){var values=outcome==='basari'?[0,0]:outcome==='ifsa'?[.999,0]:[.999,.999];
      globalThis.calls=0;globalThis.rnd=function(){calls++;return values.shift()??.999;};}
    function execute(key){return key==='stealTech'?stealTech(A,B):inciteRebellion(A,B);}
  `);return h;
}
for(const key of ['stealTech','incite'])for(const outcome of ['basari','ifsa','sonucsuz'])
for(const [role,actor,target] of [['oyuncu',0,1],['AI→oyuncu',1,0],['AI→AI',1,3]])
test(key+' '+outcome+' '+role+': gerçek etki, tek bedel ve iki bakış açısı',()=>{
  const h=fresh(actor,target),cost=key==='stealTech'?90:120;
  h.run(`var before=A.res.etk;var stab=pl.col.stab;var sec=pl.col.secede;
    B.name='HEDEF_87C';A.name='GIZLI_AKTOR_87C';dice('${outcome}');var r=execute('${key}');`);
  eq(h.run('r.ok'));eq(h.run('r.outcome'),outcome);eq(h.run('r.basarili'),outcome==='basari');
  eq(h.run('r.caught'),outcome==='ifsa');eq(h.run('before-A.res.etk'),cost);eq(h.run('r.cost'),cost);
  eq(h.run('A.opLog.length'),1);eq(h.run('A.opLog[0].outcome'),outcome);
  eq(h.run('A.opLog[0].actorSummary===r.msg'));eq(h.run('A.opLog[0].cost'),cost);
  eq(h.run('B.hitLog.length'),outcome==='sonucsuz'?0:1);
  if(outcome!=='sonucsuz'){
    eq(h.run('B.hitLog[0].known'),outcome==='ifsa');eq(h.run('B.hitLog[0].by'),actor);
    eq(h.run('B.hitLog[0].outcome'),outcome);
    if(key==='incite')eq(h.run("B.hitLog[0].k==='kiskirt'&&Number.isInteger(B.hitLog[0].sys)&&Number.isInteger(B.hitLog[0].pi)"));
  }
  if(key==='stealTech'){
    eq(h.run('A.res.ara'),outcome==='basari'?h.run('Math.round(TECHS.t_tarim.c*.5)'):0);
    eq(h.run('!!A.techs.t_tarim'),false); // veri puanı, doğrudan teknoloji açma değil
    eq(h.run('calls'),2);
  }else{
    eq(h.run('stab-pl.col.stab'),outcome==='basari'?25:0);
    eq(h.run('pl.col.secede-sec'),outcome==='basari'?10:0);
    eq(h.run('calls'),outcome==='basari'?1:2);
  }
  if(actor!==0&&target===0){
    eq(h.run("logs.join(' ').includes('GIZLI_AKTOR_87C')"),outcome==='ifsa');
    eq(h.run('logs.length'),outcome==='sonucsuz'?0:1);
    h.run('var small=UI.intelFiles();UI.opLogMenu();');
    eq(h.run("small.includes('GIZLI_AKTOR_87C')"),outcome==='ifsa');
    eq(h.doc.getElementById('modal').innerHTML.includes('GIZLI_AKTOR_87C'),outcome==='ifsa');
  }
});
for(const key of ['stealTech','incite'])for(const [name,setup] of [
  ['eski hedef','B={...B};'],['temassız','A.contact[B.id]=false;'],
  ['ölü aktör','A.dead=true;'],['kendisi','B=A;'],['yetersiz etki','A.res.etk=0;']
])test(key+' '+name+': ret; masraf, RNG veya kayıt yok',()=>{
  const h=fresh();h.run(`${setup}var before=snapshot();var r=execute('${key}');`);
  eq(h.run('r.ok'),false);eq(h.run('snapshot()===before'));
});
for(const key of ['stealTech','incite'])test(key+' AI aylık yolu tek actor kaydı ve tek kota tüketir',()=>{
  const h=fresh(1,3);
  h.run(`for(const e of G.emps)e.ai=false;A.ai=true;A.contact={[B.id]:true};
    aiPickOp=function(){return '${key}';};rnd=function(){return 0;};
    var before=A.res.etk;aiOpsTick();`);
  eq(h.run('A.opLog.length'),1);eq(h.run('B.hitLog.length'),1);
  eq(h.run('before-A.res.etk'),key==='stealTech'?90:120);
  eq(h.run('A.opLog[0].outcome'),'basari');
});
for(const key of ['stealTech','incite'])for(const outcome of ['basari','ifsa','sonucsuz'])
test(key+' oyuncu eylemi '+outcome+': iki dosyada aynı sonuç ve ücret',()=>{
  const h=fresh();h.run(`dice('${outcome}');UI.act('${key}',String(B.id));
    var small=UI.intelFiles();UI.opLogMenu();`);
  eq(h.run('A.opLog.length'),1);eq(h.run('A.opLog[0].outcome'),outcome);
  const label={basari:'BAŞARILI',ifsa:'İFŞA OLDU',sonucsuz:'SONUÇSUZ'}[outcome];
  assert.ok(h.run('small').includes(label));assert.ok(h.doc.getElementById('modal').innerHTML.includes(label));
  const cost=key==='stealTech'?90:120;
  assert.ok(h.run('small').includes(cost+' ◈ harcandı'));
  assert.ok(h.doc.getElementById('modal').innerHTML.includes(cost+' ◈ harcandı'));
});
test('eski özel kayıttan başarı uydurulmaz; ham anahtar veya TEMİZ etiketi yok',()=>{
  const h=fresh();h.run("A.opLog=[{k:'stealTech',o:B.id,t:0,caught:false}];var small=UI.intelFiles();UI.opLogMenu();");
  for(const html of [h.run('small'),h.doc.getElementById('modal').innerHTML]){
    assert.ok(html.includes('sonuç kaydedilmemiş'));assert.ok(html.includes('Teknoloji Verisi Hırsızlığı'));
    assert.ok(!html.includes('TEMİZ')&&!html.includes('BAŞARILI'));
  }
});
test('kayıtlar sınırlı ve v8 yükleme sonrası sonuç/ücret/anonimlik aynı',()=>{
  const h=fresh();h.run(`for(let i=0;i<35;i++){dice('basari');stealTech(A,B);}
    var before=JSON.stringify([A.opLog,B.hitLog]);var txt=serialize();deserialize(txt);
    A=G.p;B=G.emps[1];var after=JSON.stringify([A.opLog,B.hitLog]);`);
  eq(h.run('A.opLog.length'),20);eq(h.run('B.hitLog.length'),30);eq(h.run('before===after'));
  eq(h.run('JSON.parse(txt).v'),8);
});
test('başarı kaydı, olay görseli hata atsa da gerçek etkiyle birlikte tutulur',()=>{
  const h=fresh();h.run(`UI.eventArt=function(){throw Error('injected-art');};dice('basari');
    var threw=false;try{stealTech(A,B);}catch(e){threw=true;}`);
  eq(h.run('threw'),false);eq(h.run('A.opLog.length'),1);eq(h.run('B.hitLog.length'),1);
  eq(h.run('A.res.ara>0'));
  eq(h.run("DIAG.some(x=>x.tur==='op-presentation'&&x.m.includes('injected-art'))"));
  // 91A: sunum hatası ayrıdır; motor hataları için transaction iddiası yok.
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
