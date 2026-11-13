'use strict';
/* BETA-FED-FLEET.0 uyumluluk: GERÇEK p27 kaynağıyla (43a3612, git show ile sabit kopya) üretilen Save8 ve MP paketi (mpVersion 4) adayda yüklenir.
   FİKSTÜR (açıkça): p27 dünyasında devlet 1 ile 2 arasında askerî federasyon + Ortak Filo yasası; p27'nin kendi fedTick'i 3 ay çalışır →
   eski (tüketicisiz) f.treasury birikir; ayrıca p27 biçiminde bir federal filo (f.federal) verilir. Adayda: hazine bir kez fona geçer,
   ard arda kaydet/yükle toplam kaynağı değiştirmez, federal filo korunur; p27 MP paketi doğrulanır, bozuk bütünlük reddedilir. */
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const commit='43a36127d5bf66918ff4a7f89ae515ca40149789';let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+e.stack);}};
const control=fs.mkdtempSync(path.join(os.tmpdir(),'fedfleet0-compat-'));
try{
  for(const f of [...Object.keys(JSON.parse(fs.readFileSync('RELEASE-MANIFEST.json')).files),'research/mp0/mp-core.js']){const d=path.join(control,f);fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,cp.execFileSync('git',['show',commit+':'+f],{maxBuffer:8*1024*1024}));}
  const old=runtime({root:control});old.run(fs.readFileSync(path.join(control,'research/mp0/mp-core.js'),'utf8'));
  old.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.autoSave=false;G.feds=[];const ms=[1,2];for(const a of ms)for(const b of ms)if(a!==b){G.emps[a].ally[b]=true;G.emps[a].contact[b]=true;G.emps[a].war[b]=false;}
    const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Eski Federasyon',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal'},politicsVersion:96,leader:1,founder:1,members:ms.slice(),laws:{filo:{since:G.day,by:1}},treasury:0,fund:{ala:50,ene:50},nextVote:G.day+400,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};
    G.feds.push(f);federationIdentity(f);for(const id of ms){f.dutyConsent[id]={offense:false,since:G.day};G.emps[id].res.ala=Math.max(G.emps[id].res.ala,500);}
    for(let i=0;i<3;i++)fedTick();const fl=newFleet(G.emps[1],G.emps[1].home,[{c:'kor'}],'Federal Donanma');fl.federal=true;fl.fedId=f.id;
    var save=serialize(),host=StarsMP.createHost({roomId:'old27',random:k=>'ab'.repeat(k),send(){}}),pkg=host.snapshot({}).pkg;`);
  const t0=JSON.parse(old.run(`JSON.stringify({treasury:G.feds[0].treasury,fund:G.feds[0].fund,res:[G.emps[1].res.ala,G.emps[2].res.ala],fleet:G.fleets.filter(f=>f.federal).length,build:BUILD_ID})`));
  const save=old.run('save'),pkg=JSON.parse(old.run('JSON.stringify(pkg)'));
  test('C0 fikstür gerçek p27 kaynağında: Ortak Filo katkısı tüketicisiz hazinede birikmiş (taban davranışı)',()=>{assert.equal(t0.build,'96h10p27');assert.ok(t0.treasury>=24,JSON.stringify(t0));assert.equal(t0.fleet,1);});
  const total=h=>JSON.parse(h.run(`JSON.stringify((()=>{const f=G.feds[0];return {ala:G.emps[1].res.ala+G.emps[2].res.ala+f.fund.ala+(f.treasury||0),fund:f.fund.ala,treasury:f.treasury||0,fleets:G.fleets.filter(x=>x.federal&&x.fedId===f.id).length};})())`));
  test('C1 p27 Save8 adayda yüklenir; eski hazine BİR KEZ fona geçer; iki ardışık kaydet/yükle toplamı değiştirmez; federal filo korunur',()=>{
    const a=runtime();a.sb.s=save;assert.equal(a.run('deserialize(s)'),true);const x1=total(a);
    assert.equal(x1.treasury,0);assert.ok(Math.abs(x1.fund-(t0.fund.ala+t0.treasury))<1e-9,'hazine fona: '+JSON.stringify({x1,t0}));assert.equal(x1.fleets,1);
    const s2=a.run('serialize()'),b=runtime();b.sb.s=s2;assert.equal(b.run('deserialize(s)'),true);const x2=total(b);
    const s3=b.run('serialize()'),c=runtime();c.sb.s=s3;assert.equal(c.run('deserialize(s)'),true);const x3=total(c);
    assert.deepEqual(x2,x1);assert.deepEqual(x3,x1,'ikinci yükleme parayı çoğaltmaz');assert.equal(s3,s2,'kaydet/yükle sabit nokta');
    assert.ok(Math.abs(x1.ala-(t0.res[0]+t0.res[1]+t0.fund.ala+t0.treasury))<1e-9,'toplam kaynak korunur');});
  test('C2 p27 MP paketi (mpVersion 4) adayda doğrulanır ve yüklenir (aynı hazine aktarımı); bozuk bütünlük reddedilir',()=>{
    const h=runtime();h.sb.pkg=pkg;h.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));assert.equal(pkg.build,'96h10p27');
    assert.equal(h.run('StarsMP.validatePackage(pkg).ok'),true,JSON.stringify(JSON.parse(h.run('JSON.stringify(StarsMP.validatePackage(pkg))'))));
    const r=JSON.parse(h.run('JSON.stringify(StarsMP.loadWorld(pkg))'));assert.equal(r.ok,true,JSON.stringify(r));const x=total(h);assert.equal(x.treasury,0);assert.ok(Math.abs(x.fund-(t0.fund.ala+t0.treasury))<1e-9);
    h.sb.bad=JSON.parse(JSON.stringify(pkg));h.run('bad.integrity.save8="00"');assert.equal(h.run('StarsMP.validatePackage(bad).ok'),false);});
}finally{fs.rmSync(control,{recursive:true,force:true});console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;}
