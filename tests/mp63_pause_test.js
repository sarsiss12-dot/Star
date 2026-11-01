'use strict';
/* MP.6.3 — akıllı duraklatma: nedenleri ayrı tutan politika (research/mp63/client/mp63-pause.js) ve MP.6.1 'speed' komutuyla birlikte
   çalışması (mp-core opts.speedInfo). Host'un gerçek STARS motoru (Node vm), seed 22, uzak insanlar A=1, B=3.
   Kanıtlanan:
   - politika: uygulanan = min(son açık seçim, neden üst sınırları); manuel duraklatma önceliklidir; nedenler birbirini silmez;
     aynı pencere iki kez açılınca belirteç birikmez; bekleyen karar açık hız komutuyla "görüldü" sayılır, ekrandaki karar
     penceresi kapanana dek sürer; küçültülen (kutuya geri konan) karar yeniden bekleyen olur.
   - mp-core: 'same' denetimi ortak hıza (want) göre; tutulan seçimde iletide want/hold; her 'speed' iletisinde artan n;
     kayıt paketine ortak hız (want) yazılır; dönen oyuncu güncel durumu bildirimsiz alır; RNG tüketilmez. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const PAUSE=fs.readFileSync(path.join(root,'research/mp63/client/mp63-pause.js'),'utf8');
const StarsPause=require('../research/mp63/client/mp63-pause.js');
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};

test('politika: 3× → karar penceresi 1× → misafir duraklatır → pencere kapanır, oyun DURAKLI kalır → duraklatma kaldırılınca seçilen hız',()=>{
  const P=StarsPause.create({want:3});const inbox=new Set();
  assert.equal(P.effective(),3);
  inbox.add(7);P.decPending(7,1);assert.equal(P.effective(),1,'decision (auto-pause off) → lowest active speed');assert.equal(P.reason(),'decision');
  P.decOpen(7,1);inbox.delete(7);assert.equal(P.effective(),1,'window on screen keeps 1×');
  let r=P.command(0);assert.deepEqual([r.want,r.effective],[0,0],'guest manual pause');assert.equal(P.reason(),null,'manual pause is not an internal reason');
  P.decClose(u=>inbox.has(u));assert.equal(P.effective(),0,'closing the window does NOT restart the game');
  r=P.command(3);assert.deepEqual([r.want,r.effective,r.held],[3,3,null],'unpause → the chosen shared speed');
});
test('politika: karar bitince önceki geçerli hız döner; otomatik duraklatma açıksa 0; aynı pencere iki kez açılınca birikmez',()=>{
  const P=StarsPause.create({want:2});const inbox=new Set([1]);
  P.decPending(1,0);assert.equal(P.effective(),0,'auto-pause on → keeps the pause preference');
  assert.equal(P.decPending(1,0),false,'same notice twice → no second token');P.decOpen(1,0);inbox.delete(1);P.decOpen(1,0);
  assert.equal(P.state().dec.length,1,'re-opening the same window does not stack');
  P.decClose(u=>inbox.has(u));assert.equal(P.effective(),2,'decision done → previous valid speed');assert.equal(P.state().dec.length,0);
});
test('politika: birden çok neden — bir pencerenin kapanması başkasının nedenini silmez; arka plan/ağ birbirinden bağımsız',()=>{
  const P=StarsPause.create({want:4});const inbox=new Set([5,6]);
  P.decPending(5,1);P.decPending(6,1);P.decOpen(5,1);inbox.delete(5);
  P.decClose(u=>inbox.has(u));assert.equal(P.effective(),1,'note 6 still pending in the inbox → still 1×');
  P.set('background',0);assert.equal(P.effective(),0);assert.equal(P.reason(),'background');
  P.set('offline',0);P.clear('background');assert.equal(P.effective(),0,'offline still holds after background clears');assert.equal(P.reason(),'offline');
  P.clear('offline');assert.equal(P.effective(),1);
  inbox.delete(6);P.reconcile(u=>inbox.has(u),false);assert.equal(P.effective(),4,'note resolved elsewhere → token dropped');
  assert.equal(P.set('engine',0),true);assert.equal(P.set('engine',0),false,'same reason twice does not stack');P.clear('engine');assert.equal(P.effective(),4);
});
test('politika: açık hız komutu bekleyen kararları "görüldü" sayar, ekrandaki karar penceresi kapanana dek tutar; küçültülen karar yeniden bekler',()=>{
  const P=StarsPause.create({want:3});const inbox=new Set([1,2]);
  P.decPending(1,1);P.decPending(2,1);P.decOpen(2,1);inbox.delete(2);
  let r=P.command(4);assert.equal(r.acked,1,'pending (not on screen) acknowledged');assert.deepEqual([r.want,r.effective,r.held],[4,1,'decision'],'open window still holds 1×');
  inbox.add(2);P.reconcile(u=>inbox.has(u),false);assert.deepEqual(P.state().dec,[{uid:2,cap:1,state:'pending'}],'minimised window → pending again');
  assert.equal(P.effective(),1);r=P.command(4);assert.equal(r.effective,4,'acknowledged → shared speed');
  P.command(2);P.set('background',0);P.command(3);assert.equal(P.effective(),0,'a speed command never overrides background safety');P.clear('background');assert.equal(P.effective(),3);
});

function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];h.sb.__hs=[];h.sb.__now=1e6;
  h.run(MIR);h.run(CORE);h.run(PAUSE);
  /* host sayfasındaki bağlamanın (mp1-host.js) motor-dışı çekirdeği: ortak hız komutu → politika → uygulanan hız */
  h.run(`var PZ=StarsPause.create({want:0}),started=false;function applySpeed(){G.speed=PZ.effective();}
    var MP=StarsMP.createHost({roomId:'r63',random:__rand,now:()=>__now,send:(c,t)=>__out.push([c,t]),kick(){},onSpeed:i=>__hs.push(i),
      setSpeed:v=>{if(started){PZ.command(v);applySpeed();}else G.speed=v;},speedInfo:()=>started?{want:PZ.want,reason:PZ.reason()}:null,
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cB'?'Bora':'Ada'}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');started=true;PZ.setWant(3);applySpeed();MP.speedSync(null);var seq={};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.sb.__now+=1000;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m63'+conn+String(s).padStart(5,'0'),cmd:c}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const msgs=(h,conn,type)=>h.sb.__out.filter(([c])=>c===conn).map(([,t])=>JSON.parse(t)).filter(m=>m.type===type);

test('mp-core + politika: 3× → host karar penceresi 1× (misafire "decision", ad yok) → misafir duraklatır → pencere kapanır, herkes duraklı → misafir 3× seçer',()=>{
  const h=world();const r0=h.run('RND_STATE');assert.equal(J(h,'G.speed'),3);
  h.run(`PZ.decPending(41,1);PZ.decOpen(41,1);applySpeed();MP.speedSync(PZ.reason());`);
  assert.equal(J(h,'G.speed'),1,'decision window → 1× (shared speed still 3×)');
  let [b]=msgs(h,'cB','speed').slice(-1);assert.deepEqual([b.spd,b.auto,b.reason,b.who,b.want,b.hold],[1,1,'decision',null,3,'decision'],'guest sees why, never the host empire name');
  assert.equal(cmd(h,B,{kind:'speed',value:0}).status,'ok','guest manual pause');assert.equal(J(h,'G.speed'),0);
  [b]=msgs(h,'cA','speed').slice(-1);assert.deepEqual([b.spd,b.auto,b.who,b.want],[0,0,'Bora',undefined],'explicit pause notice to the others (no hold: applied = chosen)');
  h.run(`PZ.decClose(()=>false);applySpeed();MP.speedSync(PZ.reason());`);
  assert.equal(J(h,'G.speed'),0,'closing the decision window does NOT restart the game');
  const n0=msgs(h,'cA','speed').length;h.run('MP.speedSync(PZ.reason())');assert.equal(msgs(h,'cA','speed').length,n0,'no needless speed notice');
  assert.equal(cmd(h,A,{kind:'speed',value:3}).status,'ok');assert.equal(J(h,'G.speed'),3,'unpause → the chosen shared speed');
  assert.equal(h.run('RND_STATE'),r0,'no RNG consumed');
});
test('mp-core + politika: tutulan seçim — "same" ortak hıza göre; iletide want/hold; artan n; kayıt paketine ortak hız; dönen oyuncu bildirimsiz güncel durum',()=>{
  const h=world();h.run(`PZ.decPending(9,1);PZ.decOpen(9,1);applySpeed();MP.speedSync(PZ.reason());`);
  assert.equal(cmd(h,B,{kind:'speed',value:3}).code,'rules:same','shared speed already 3× (only held) → same, no notice');
  assert.equal(cmd(h,B,{kind:'speed',value:1}).status,'ok','1× is a real change of the shared speed');assert.equal(J(h,'G.speed'),1);
  h.sb.__now+=1000;const r=cmd(h,B,{kind:'speed',value:4});assert.equal(r.status,'ok');assert.equal(J(h,'G.speed'),1,'held by the open decision window');
  const all=msgs(h,'cA','speed'),last=all.at(-1);assert.deepEqual([last.spd,last.want,last.hold,last.who],[1,4,'decision','Bora']);
  for(let i=1;i<all.length;i++)assert(all[i].n>all[i-1].n,'speed messages carry an increasing n');
  const pkg=J(h,'MP.snapshot({}).pkg');assert.equal(pkg.session.speed,4,'the save keeps the shared speed, not the temporary 1×');
  h.run(`MP.onLeave('cB');MP.onMessage('cB2',JSON.stringify({v:1,type:'hello',name:'Bora',token:${JSON.stringify(J(h,"[...MP.meta().players].find(p=>p.empireId===3).token"))}}))`);
  const back=msgs(h,'cB2','speed').at(-1);assert.deepEqual([back.spd,back.want,back.hold,back.silent],[1,4,'decision',1],'rejoining player gets the current state silently');
  h.run(`PZ.decClose(()=>false);applySpeed();MP.speedSync(PZ.reason());`);assert.equal(J(h,'G.speed'),4,'window closed → the chosen 4×');
  const fin=msgs(h,'cA','speed').at(-1);assert.deepEqual([fin.spd,fin.auto,fin.want],[4,1,undefined]);
});
test('politika yoksa (opts.speedInfo verilmez) MP.6.1 davranışı aynen: same G.speed\'e göre, iletide want/hold yok',()=>{
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];h.sb.__now=1e6;
  h.run(MIR);h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r63b',random:__rand,now:()=>__now,send:(c,t)=>__out.push([c,t]),kick(){},
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.setCapacity(2);MP.configure({size:'orta',aiCount:5,seed:22});MP.onMessage('cB',JSON.stringify({v:1,type:'hello',name:'Bora'}));MP.onMessage('cB',JSON.stringify({v:1,type:'claim',empire:3}));MP.onMessage('cB',JSON.stringify({v:1,type:'ready',value:true}));
    if(!MP.start().ok)throw Error('start');G.speed=2;var seq={};`);
  assert.equal(cmd(h,B,{kind:'speed',value:2}).code,'rules:same');assert.equal(cmd(h,B,{kind:'speed',value:1}).status,'ok');
  const m=msgs(h,'cB','speed').at(-1);assert.deepEqual([m.spd,m.want,m.hold],[1,undefined,undefined]);
});
end();
