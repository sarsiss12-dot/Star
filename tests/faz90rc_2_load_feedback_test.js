'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
const tests=[];let pass=0,fail=0;
const test=(name,fn)=>tests.push([name,fn]);
const cfg={name:'Yukleme',race:'insan',traits:[],size:'orta',shape:'sarmal',
 diff:'normal',seed:902,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',
 ruins:'yok',crisis:'kapali',council:'kapali'};
function fresh(local=new Map()){
 const h=runtime({root,local});h.sb.cfg=cfg;
 h.run('setupGame(cfg);View.init();G.autoSave=false;');
 return h;
}
function installReader(h,{text='OK',throwRead=false}={}){
 const made=[];
 h.sb.FileReader=class{
  constructor(){this.result='';made.push(this);}
  readAsText(){if(throwRead)throw Error('read boom');this.result=text;}
 };
 return made;
}
function picker(h){
 return [...h.doc.body.children].reverse().find(e=>e.tagName==='INPUT');
}
function openPicker(h,cb){h.sb.__cb=cb;h.run('uploadSave(__cb)');return picker(h);}
function world(h){return h.run('serialize()');}
function worldWithoutLog(h){const d=JSON.parse(world(h));d.log=[];return JSON.stringify(d);}

test('dosya seçici cancel olayında bir kez tamamlanır ve input kaldırılır',()=>{
 const h=fresh(),calls=[],inp=openPicker(h,(txt,status)=>calls.push([txt,status]));
 assert.ok(inp);inp.emit('cancel');inp.emit('cancel');
 assert.deepEqual(calls,[[null,'cancel']]);assert.equal(picker(h),undefined);
});
test('change olayı dosyasız dönerse iptal sayılır ve input sızmaz',()=>{
 const h=fresh(),calls=[],inp=openPicker(h,(txt,status)=>calls.push([txt,status]));
 inp.files=[];inp.emit('change');
 assert.deepEqual(calls,[[null,'cancel']]);assert.equal(picker(h),undefined);
});
test('FileReader başarı, hata ve abort yolları tek callback ve temizlik üretir',()=>{
 for(const olay of ['load','error','abort']){
  const h=fresh(),made=installReader(h,{text:'KAYIT'}),calls=[];
  const inp=openPicker(h,(txt,status)=>calls.push([txt,status]));
  inp.files=[{name:'a.sav'}];inp.emit('change');assert.equal(made.length,1);
  made[0]['on'+olay]();made[0].onerror&&made[0].onerror();
  assert.deepEqual(calls,olay==='load'?[['KAYIT','ok']]
    :[[null,olay==='abort'?'cancel':'read-error']]);
  assert.equal(picker(h),undefined,olay);
 }
});
test('FileReader readAsText istisnası olay dışına sızmaz',()=>{
 const h=fresh(),calls=[];installReader(h,{throwRead:true});
 const inp=openPicker(h,(txt,status)=>calls.push([txt,status]));inp.files=[{}];
 assert.doesNotThrow(()=>inp.emit('change'));
 assert.deepEqual(calls,[[null,'read-error']]);assert.equal(picker(h),undefined);
});
test('input click istisnası open-error verir ve eklenen inputu kaldırır',()=>{
 const h=fresh(),calls=[],old=h.doc.createElement;
 h.doc.createElement=tag=>{const e=old(tag);if(tag==='input')e.click=()=>{throw Error('picker boom');};return e;};
 assert.doesNotThrow(()=>openPicker(h,(txt,status)=>calls.push([txt,status])));
 assert.deepEqual(calls,[[null,'open-error']]);assert.equal(picker(h),undefined);
});
test('bozuk cihaz kaydı missing değil invalid olarak sınıflanır ve dünya korunur',async()=>{
 const local=new Map(),h=fresh(local),before=world(h),d=JSON.parse(before);
 d.sys[0].p[0]=null;local.set('yildiz:save',JSON.stringify(d));
 assert.equal(await h.run('loadGame()'),false);
 assert.equal(h.run('LAST_LOAD_STATUS'),'invalid');assert.equal(world(h),before);
});
test('eksik cihaz kaydı missing; geçerli kayıt ok olarak sınıflanır',async()=>{
 const local=new Map(),h=fresh(local),save=world(h);local.delete('yildiz:save');
 h.run('MEM_SAVE=null');assert.equal(await h.run('loadGame()'),false);
 assert.equal(h.run('LAST_LOAD_STATUS'),'missing');
 local.set('yildiz:save',save);assert.equal(await h.run('loadGame()'),true);
 assert.equal(h.run('LAST_LOAD_STATUS'),'ok');
});
test('ana menü yapısal bozuk kaydı devam edilebilir göstermez',async()=>{
 const local=new Map(),h=fresh(local),d=JSON.parse(world(h));d.emps[0].res.min='bozuk';
 local.set('yildiz:save',JSON.stringify(d));
 assert.equal(await h.run('refreshContinueBtn()'),false);
 assert.equal(h.elements.get('tContBtn').disabled,true);
 assert.match(h.elements.get('tContSub').textContent,/bozuk|uyumsuz/i);
});
test('dosya seçiminden vazgeçmek hata mesajı üretmez',()=>{
 const h=fresh();h.run('UI.saveMenu()');const before=h.run('G.log.length');
 h.run('UI._hooks.ulsave()');const inp=picker(h);inp.emit('cancel');
 assert.equal(h.run('G.log.length'),before);assert.equal(picker(h),undefined);
});
test('geçersiz dosya açık dünyayı korur ve açık geri bildirim verir',()=>{
 const h=fresh(),before=worldWithoutLog(h),made=installReader(h,{text:'{"v":8}'});
 h.run('UI.saveMenu();UI._hooks.ulsave()');const inp=picker(h);inp.files=[{}];inp.emit('change');made[0].onload();
 assert.equal(worldWithoutLog(h),before);
 assert.match(h.run('G.log[G.log.length-1].m'),/geçerli.*değil.*korunuyor/i);
});
test('geçerli dosya onaydan önce uygulanmaz; onayla yüklenip hızlı kopyaya yazılır',async()=>{
 const local=new Map(),h=fresh(local),d=JSON.parse(world(h));d.day+=30;d.year+=1;
 const txt=JSON.stringify(d),made=installReader(h,{text:txt});
 h.run('UI.saveMenu();UI._hooks.ulsave()');const inp=picker(h);inp.files=[{}];inp.emit('change');made[0].onload();
 assert.notEqual(h.run('G.day'),d.day);assert.ok(h.run('UI._pendingSaveLoad'));
 h.run('UI._hooks.loadConfirm()');
 await Promise.resolve();await Promise.resolve();
 assert.equal(h.run('G.day'),d.day);assert.equal(local.get('yildiz:save'),txt);
 assert.match(h.run('G.log[G.log.length-1].m'),/dosyadan yüklendi/i);
});
test('yükleme onayından vazgeçmek açık dünyayı ve hızlı kaydı değiştirmez',()=>{
 const local=new Map(),h=fresh(local),before=world(h),d=JSON.parse(before);d.day+=99;
 const txt=JSON.stringify(d),made=installReader(h,{text:txt});
 h.run('UI.saveMenu();UI._hooks.ulsave()');const inp=picker(h);inp.files=[{}];inp.emit('change');made[0].onload();
 assert.ok(h.run('UI._pendingSaveLoad'));h.run("UI.act('save')");
 assert.equal(h.run('UI._pendingSaveLoad'),null);assert.equal(world(h),before);
 assert.equal(local.has('yildiz:save'),false);
});
test('cihazdan yükle bozuk kaydı bulunamadı diye raporlamaz',async()=>{
 const local=new Map(),h=fresh(local),d=JSON.parse(world(h));d.fl[0].ships[0]=null;
 local.set('yildiz:save',JSON.stringify(d));h.run('UI.saveMenu();UI._hooks.doload()');
 await Promise.resolve();await Promise.resolve();
 assert.match(h.run('G.log[G.log.length-1].m'),/geçerli.*değil.*korunuyor/i);
 assert.doesNotMatch(h.run('G.log[G.log.length-1].m'),/bulunamadı/i);
});
test('build ve cache 90RC.2 kimliği taşır',()=>{
 assert.match(fs.readFileSync(path.join(root,'main.js'),'utf8'),/const BUILD_ID = '95d'/);
 assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/const CACHE = 'stars-v95d'/);
});
(async()=>{for(const [name,fn] of tests){try{await fn();pass++;console.log('✓ '+name);}
 catch(e){fail++;console.log('✗ '+name+' — '+e.stack);}}
 console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;})();
