'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const cfg={name:'Kayıt sınırı',race:'insan',traits:[],size:'orta',shape:'sarmal',
 diff:'normal',seed:90,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',
 ruins:'yok',crisis:'kapali',council:'kapali'};
const tests=[];let pass=0,fail=0;
const test=(name,fn)=>tests.push([name,fn]);
function fresh(){const h=runtime({root});h.sb.cfg=cfg;
 h.run('setupGame(cfg);View.init();View.selSys=G.sys[G.p.home];View.sel=G.fleets[0];G.speed=2;');
 return h;}
function capture(h){return {save:h.run('serialize()'),rng:h.run('RND_STATE'),
 refs:h.run('[G,G.cfg,G.sys,G.emps,G.fleets,G.p,G.fleets[0],View.sel,View.selSys,View.cv,View.g]'),
 view:h.run('JSON.stringify({cam:View.cam,route:View.route,routed:View.routed,speed:G.speed})'),
 timers:[...h.timers.keys()],raf:[...h.raf.keys()],local:[...h.local]};}
function unchanged(h,b){assert.equal(h.run('serialize()'),b.save,'kalıcı kayıt');
 assert.equal(h.run('RND_STATE'),b.rng,'RNG');
 const refs=h.run('[G,G.cfg,G.sys,G.emps,G.fleets,G.p,G.fleets[0],View.sel,View.selSys,View.cv,View.g]');
 refs.forEach((v,i)=>assert.equal(v,b.refs[i],'nesne kimliği '+i));
 assert.equal(h.run('JSON.stringify({cam:View.cam,route:View.route,routed:View.routed,speed:G.speed})'),b.view);
 assert.deepEqual([...h.timers.keys()],b.timers);assert.deepEqual([...h.raf.keys()],b.raf);
 assert.deepEqual([...h.local],b.local);}
const corruptions=[
 ['gezegen null',d=>d.sys[0].p[0]=null],
 ['gezegen sayı',d=>d.sys[0].p[0]=7],
 ['gemi null',d=>d.fl[0].ships[0]=null],
 ['gemi sınıfı eksik',d=>delete d.fl[0].ships[0].c],
 ['filo kimliği yinelenmiş',d=>d.fl.push({...d.fl[0]})],
 ['kaynak metin',d=>d.emps[0].res.min='BOZUK'],
 ['kaynak null',d=>d.emps[1].res.ene=null],
 ['kaynak anahtarı eksik',d=>delete d.emps[0].res.yiy],
 ['kaynak dizi',d=>d.emps[0].res=[]],
 ['gün eksik',d=>delete d.day],
 ['gün negatif',d=>d.day=-1],
 ['yıl metin',d=>d.year='2210'],
 ['ay sıfır',d=>d.month=0],
 ['ay 13',d=>d.month=13],
 ['ayar kökü dizi',d=>d.cfg=[]]
];
for(const [name,mutate] of corruptions)test('ret ve sıfır mutasyon: '+name,()=>{
 const h=fresh(),before=capture(h),d=JSON.parse(before.save);
 // Başka zamana ait kaydı temsil eder; kısmi atama mutlaka fark edilir.
 d.day+=360;d.year++;d.emps[0].res.min+=777;mutate(d);h.sb.bad=JSON.stringify(d);
 assert.equal(h.run('deserialize(bad)'),false);unchanged(h,before);
 // Ret sonrası aynı oturumda geçerli bir kayıt açılabilmeli.
 h.sb.good=before.save;assert.equal(h.run('deserialize(good)'),true);
 assert.equal(h.run('G.day'),JSON.parse(before.save).day);
});
test('localStorage loadGame bozuk kayıtta false döner, açık dünya ve depodaki kayıt korunur',async()=>{
 const h=fresh(),d=JSON.parse(h.run('serialize()'));d.day+=900;d.fl[0].ships[0]=null;
 h.local.set('yildiz:save',JSON.stringify(d));const b=capture(h);
 assert.equal(await h.run('loadGame()'),false);unchanged(h,b);
});
test('gerçek eski v8 kaydı tekrar yüklenir; gün kaynak RNG aynı kalır',()=>{
 const h=fresh();h.sb.good=fs.readFileSync(path.join(root,'tests/fixtures/stars-2210-06.sav.json'),'utf8');
 assert.equal(h.run('deserialize(good)'),true);
 const b=h.run('JSON.stringify([G.day,RND_STATE,G.emps.map(e=>e.res)])');
 for(let i=0;i<3;i++)assert.equal(h.run('deserialize(good)'),true);
 assert.equal(h.run('JSON.stringify([G.day,RND_STATE,G.emps.map(e=>e.res)])'),b);
});
test('kesirli gün/kaynak, boş filo ve eski negatif stok zarf kapısında bozulmaz',()=>{
 const h=fresh(),d=JSON.parse(h.run('serialize()'));d.day=0.5;d.emps[0].res.min=1.25;
 d.emps[1].res.ene=-3.5;d.fl=[];h.sb.good=JSON.stringify(d);
 assert.equal(h.run('validSaveEnvelope(JSON.parse(good))'),true);
 assert.equal(h.run('deserialize(good)'),true);
 assert.equal(h.run('G.day'),0.5);assert.equal(h.run('G.p.res.min'),1.25);
});
test('eski kayıtta world/threats/events/W/H gibi ek alanlar zorunlu hale gelmez',()=>{
 const h=fresh(),d=JSON.parse(h.run('serialize()'));
 for(const k of ['world','threats','campaign','simulation','events','W','H'])delete d[k];
 h.sb.good=JSON.stringify(d);assert.equal(h.run('deserialize(good)'),true);
 assert.equal(h.run('Number.isFinite(G.W)&&Number.isFinite(G.H)'),true);
});
(async()=>{for(const [name,fn] of tests){try{await fn();pass++;console.log('✓ '+name);}
 catch(e){fail++;console.log('✗ '+name+' — '+e.message.slice(0,300));}}
 console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;})();
