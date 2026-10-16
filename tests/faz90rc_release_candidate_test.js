'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;const tests=[];function test(n,fn){tests.push([n,fn]);}
function fresh(){const h=runtime({root:ROOT});h.run(`setupGame({name:'RC',race:'insan',traits:[],size:'orta',shape:'sarmal',diff:'normal',seed:90,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;economyTick(true);`);return h;}
function stable(h){
 const d=JSON.parse(h.run('serialize()'));
 /* Yüklemede bilinçli olarak yeniden kurulan AI önbellekleri kalıcı dünya
    karşılaştırmasına dahil değildir. Diğer bütün kayıt zarfı karşılaştırılır. */
 for(const e of d.emps||[]){delete e._prof;delete e._supAt;delete e._gateAt;}
 return JSON.stringify(d);
}
function swHost(missing=false){
 const events={},deleted=[],names=['stars-v89b','stars-v95c','other-app-cache'];let skipped=0,claimed=0,added=null;
 const caches={open:async()=>({addAll:async list=>{added=[...list];if(missing)throw Error('missing shell');}}),
  keys:async()=>[...names],delete:async n=>{deleted.push(n);return true;},match:async()=>null};
 const self={addEventListener:(k,f)=>events[k]=f,skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{claimed++;}}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),{self,caches,fetch:async()=>({status:200,type:'basic',clone(){return this;}}),Promise});
 async function emit(k){let p;events[k]({waitUntil:x=>p=x,request:{method:'GET'}});return p;}
 return {emit,deleted,get skipped(){return skipped;},get claimed(){return claimed;},get added(){return added;}};
}
test('dağıtımın ana çalışma dosyaları mevcut ve boş değil',()=>{for(const f of ['index.html','manifest.json','main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','ui.js','audio.js','sw.js'])assert.ok(fs.statSync(path.join(ROOT,f)).size>0,f);});
test('index script sırası üretim bağımlılık sırasıyla aynı',()=>{const s=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const got=[...s.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(got,['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','ui.js','audio.js']);});
test('manifest kapsamı, başlangıcı ve landscape modu yerel',()=>{const m=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.json')));assert.equal(m.start_url,'./index.html');assert.equal(m.scope,'./');assert.equal(m.orientation,'landscape');assert.equal(m.display,'standalone');assert.ok(m.icons.length>=2);});
test('SW kabuğu gerçek yerel dosyaların tamamına karşılık gelir',async()=>{const h=swHost();await h.emit('install');assert.equal(h.skipped,1);for(const ref of h.added){const f=ref==='./'?'index.html':ref.replace(/^\.\//,'');assert.ok(fs.existsSync(path.join(ROOT,f)),ref);}});
test('eksik kabukta install reddedilir ve skipWaiting çalışmaz',async()=>{const h=swHost(true);await assert.rejects(h.emit('install'),/missing shell/);assert.equal(h.skipped,0);});
test('activate yalnız eski Stars cachelerini siler',async()=>{const h=swHost();await h.emit('activate');assert.deepEqual(h.deleted,['stars-v89b']);assert.equal(h.claimed,1);});
test('temiz kurulum v8 kayıt üretir ve aynı kaydı açar',()=>{const h=fresh();const before=stable(h),save=h.run('serialize()');assert.equal(JSON.parse(save).v,8);assert.equal(h.run('deserialize('+JSON.stringify(save)+')'),true);assert.equal(stable(h),before);});
test('aynı güncel kayıt 10 kez yüklenince kalıcı durum ve RNG aynı',()=>{const h=fresh(),save=h.run('serialize()'),before=stable(h);h.sb.__s=save;h.run('for(var i=0;i<10;i++)if(!deserialize(__s))throw Error("load")');assert.equal(stable(h),before);});
test('gerçek eski v8 kayıt 10 kez deterministik yüklenir',()=>{const h=fresh(),save=fs.readFileSync(path.join(ROOT,'tests/fixtures/stars-2210-06.sav.json'),'utf8');h.sb.__s=save;assert.equal(h.run('deserialize(__s)'),true);const before=stable(h);h.run('for(var i=0;i<10;i++)deserialize(__s)');assert.equal(stable(h),before);});
for(const [name,mutate] of [
 ['imparatorluk kökü eksik',d=>delete d.emps],['sistem kimliği yinelenmiş',d=>d.sys[1].i=0],
 ['sistem gezegenleri eksik',d=>delete d.sys[0].p],['filo sahibi geçersiz',d=>{if(d.fl.length)d.fl[0].e=999;else d.fl.push({id:99,e:999,ships:[]});}]
])test('yapısal bozuk kayıt dünyayı değiştirmez: '+name,()=>{const h=fresh(),before=stable(h),d=JSON.parse(h.run('serialize()'));mutate(d);h.sb.__bad=JSON.stringify(d);assert.equal(h.run('deserialize(__bad)'),false);assert.equal(stable(h),before);});
test('saveGame/loadGame aynı depolama anahtarıyla round-trip yapar',async()=>{const local=new Map(),h=runtime({root:ROOT,local});h.run(`setupGame({name:'RC',race:'insan',traits:[],size:'orta',shape:'sarmal',diff:'normal',seed:90,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});G.autoSave=false;economyTick(true);`);const before=stable(h);assert.equal(await h.run('saveGame()'),true);assert.ok(local.has('yildiz:save'));h.run('G.day+=999;G.p.res.min+=777');assert.equal(await h.run('loadGame()'),true);assert.equal(stable(h),before);});
test('BUILD ve cache RC adı taşıyor',()=>{assert.match(fs.readFileSync(path.join(ROOT,'main.js'),'utf8'),/const BUILD_ID = '95c'/);assert.match(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),/const CACHE = 'stars-v95c'/);});
(async()=>{for(const [n,fn] of tests){try{await fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+e.stack);}}console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;})();
