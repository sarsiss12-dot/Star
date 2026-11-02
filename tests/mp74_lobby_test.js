'use strict';
/* MP.7.4 — lobi kapasitesi ve çift katılımın host (mp-core) tarafı. Gerçek telefon gözlemi: host 2 insan seçince misafir bazen "oda dolu"
   alıp lobiye geçemiyordu. Kök neden: çift KATIL'ın ilk soketi (ya da jetonu kaydedilmeden kapanan sekme) host'ta bağsız bir oyuncu
   kaydı bırakıyor, kayıt kapasiteyi doldurmaya devam ediyordu. Düzeltme: oyun başlamadan, oda doluyken en eski bağsız kayıt yer açar. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
function lobbyWorld(cap){
  const h=runtime({root});h.sb.__rand=n=>crypto.randomBytes(n).toString('hex');h.sb.__out=[];h.sb.__kick=[];
  h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r1',random:__rand,send:(c,t)=>__out.push([c,t]),kick:(c,w)=>__kick.push([c,w]),
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});MP.installGuards();`);
  assert.equal(json(h,`MP.configure({size:'orta',aiCount:5,seed:22})`).ok,true);
  if(cap)assert.equal(json(h,`MP.setCapacity(${cap})`).ok,true);
  return h;
}
const json=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msgs(h,conn,from=0){return h.sb.__out.slice(from).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function send(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return msgs(h,conn,n);}
const hello=(h,conn,name,token)=>send(h,conn,{v:1,type:'hello',name,...(token?{token}:{})});
const assigned=r=>r.find(m=>m.type==='assign');
const denied=r=>(r.find(m=>m.type==='error')||{}).code;
const guests=h=>json(h,'MP.lobbyView().players.filter(p=>!p.host).length');
test('kapasite 2/3/4: host + 1/2/3 misafir girer; bir fazlası "oda dolu"',()=>{
  for(const cap of [2,3,4]){const h=lobbyWorld(cap);
    for(let i=1;i<cap;i++)assert(assigned(hello(h,'c'+i,'P'+i)),'cap '+cap+' guest '+i);
    assert.equal(denied(hello(h,'cx','Fazla')),'room-full','cap '+cap);assert.equal(guests(h),cap-1);}
});
test('çift KATIL (host tarafı): ilk soketin bağsız kaydı koltuk tutmaz — ikinci soket kapasite 2\'de lobiye girer',()=>{
  const h=lobbyWorld(2);
  assert(assigned(hello(h,'c1','Bora')));h.run("MP.onLeave('c1')");   // ilk soket kapandı (jeton istemciye kaydedilmeden)
  const r=hello(h,'c2','Bora');assert(assigned(r),JSON.stringify(r));assert.equal(guests(h),1,'one seat');
  assert.equal(json(h,'MP.stats.ghostSeats'),1);
});
test('bağlı oyuncu ve jetonla dönen oyuncu korunur: bağlı misafir varken yeni gelen reddedilir; bağsız misafir jetonuyla kendi kaydına döner',()=>{
  const h=lobbyWorld(2);const a=assigned(hello(h,'c1','Ayşe'));
  assert.equal(denied(hello(h,'c2','Yabancı')),'room-full','connected guest keeps the seat');
  h.run("MP.onLeave('c1')");const back=assigned(hello(h,'c3','Ayşe',a.token));assert.equal(back.playerId,a.playerId,'same record with the token');
  assert.equal(guests(h),1);
});
test('kapasite değişimi bağlı oyuncuyu atmaz; odada fazla oyuncu varken düşürülemez',()=>{
  const h=lobbyWorld(4);for(let i=1;i<=3;i++)assigned(hello(h,'c'+i,'P'+i));
  assert.equal(json(h,'MP.setCapacity(3)').why,'too-many');assert.equal(guests(h),3);
  h.run("MP.onLeave('c3')");
  assert.equal(json(h,'MP.setCapacity(3)').why,'too-many','disconnected record still counted until replaced (MP.5 reconnect)');
  assert.equal(h.sb.__kick.length,0,'nobody kicked');
});
test('oyun başladıktan sonra bağsız koltuk yeni gelene verilmez (game-started)',()=>{
  const h=lobbyWorld(2);const c=assigned(hello(h,'c1','Bora'));
  const claim=send(h,'c1',{v:1,type:'claim',empire:3}).find(m=>m.type==='lresult');
  assert.equal(claim.ok,true,JSON.stringify(claim));
  send(h,'c1',{v:1,type:'ready',value:true});const st=json(h,'MP.start()');assert.equal(st.ok,true,JSON.stringify(st));
  h.run("MP.onLeave('c1')");assert.equal(denied(hello(h,'c9','Yabancı')),'game-started');void c;
});
end();
