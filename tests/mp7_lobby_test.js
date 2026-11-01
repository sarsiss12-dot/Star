'use strict';
/* MP.7 — lobi tasarım kipi: her oyuncu kendi devlet taslağını (tek oyunculu kurulum ekranının CFG alanları) gönderir; galaksi
   OYUN BAŞLARKEN gerçek setupGame(cfg.humans) ile kurulur. Host'un gerçek motoru Node vm'de; mesajlar gerçek protokolle.
   Kanıtlanan: taslak kuralları motorun normalleştiricileri (sessiz düzeltme yok), sahiplik (yalnız kendi taslağı), eski/yinelenen
   taslak, hazır/sıfırlama, AI+insan sınırı, çift başlatma, başlangıç etkileri motorun, MP.4 kaydı tasarlanmış devletlerle sürer,
   eski MP.1 devralma kipi ve tek oyunculu kurulum değişmez. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
const HOST={name:'Host Devleti',race:'klan',mizac:'militarist',physio:'avian',look:'surungen',origin:'kusatilmis',sigil:'simetrik',ethics:{mil:2,aut:0,mat:0,ahl:0},civics:['kale_dok'],traits:[]};
const DB={name:'Saf Akıl Ağı',race:'teknokrasi',mizac:'teknokrasi',physio:'machine',look:'makine',origin:'son_umut',sigil:'simetrik',ethics:{mil:-1,aut:0,mat:2,ahl:0},civics:['sinyal_avci'],traits:[]};
const DC={name:'Okyanus Ticaret Birliği',race:'lonca',mizac:'tuccar',physio:'aquatic',look:'akuatik',origin:'gocebe',sigil:'simetrik',ethics:{mil:0,aut:-1,mat:1,ahl:1},civics:[],traits:[]};
function room(cap=3,ai=5){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.sb.__host=HOST;h.run(MIR);h.run(CORE);
  h.run(`var HOST=JSON.parse(JSON.stringify(__host));
    var MP=StarsMP.createHost({roomId:'r7',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{design:true,hostDraft:()=>HOST,
      generate(s){const {host:_h,...rest}=s;setupGame({...CFG,...HOST,...rest});applyChosenPersona(G.p,HOST.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(${cap});var CF=MP.configure({size:'orta',aiCount:${ai},seed:22});`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
const lres=(h,conn,obj)=>msg(h,conn,{v:1,...obj}).find(m=>m.type==='lresult');
function join(h,conn,name){return msg(h,conn,{v:1,type:'hello',name});}
const st=h=>({save:h.run('typeof G!=="undefined"&&G.emps?serialize():null'),rng:h.run('RND_STATE')});

test('taslak motorun kurallarıyla denetlenir: geçersiz tür/doktrin/köken, bütçe aşan etik, yuva aşan civic, fazla alan, yanlış tür → reddedilir (nedeniyle); geçerli taslak kabul',()=>{
  const h=room();join(h,'b','Bora');
  const bad=[[{...DB,race:'yok'},'draft:race'],[{...DB,mizac:'bilimsel'},'draft:mizac'],[{...DB,origin:'uzayli'},'draft:origin'],[{...DB,ethics:{mil:3,aut:3,mat:3,ahl:0}},'draft:ethics'],
    [{...DB,civics:['burokrasi','gen_oncu','kale_dok']},'draft:civics'],[{...DB,hack:1},'draft:keys'],[{...DB,ethics:{mil:'2'}},'draft:ethics'],[{...DB,name:''},'draft:name'],
    [{...DB,traits:['yok_ozellik']},'draft:traits'],[{...DB,color:'red'},'draft:color'],[{...DB,emblem:{shape:'x',evil:1}},'draft:emblem'],['metin','draft:keys']];
  let rev=1;for(const [d,code] of bad){const r=lres(h,'b',{type:'draft',rev:rev++,draft:d});assert.equal(r.ok,false,code);assert.equal(r.code,code);}
  assert.equal(J(h,'[...MP.state.players.values()].find(p=>p.name==="Bora").draft||null'),null,'nothing stored');
  const r=lres(h,'b',{type:'draft',rev:rev++,draft:DB});assert.equal(r.ok,true);
  assert.equal(J(h,'[...MP.state.players.values()].find(p=>p.name==="Bora").draft.name'),'Saf Akıl Ağı');
});
test('sahiplik ve sıra: taslak bağlantının kendi oyuncusuna yazılır; eski ya da yeniden gönderilen rev reddedilir (stale) ve yenisini ezmez; değişen taslak hazırı sıfırlar; aynı taslak sıfırlamaz',()=>{
  const h=room();join(h,'b','Bora');join(h,'c','Cem');
  assert.equal(lres(h,'b',{type:'draft',rev:5,draft:DB}).ok,true);assert.equal(lres(h,'c',{type:'draft',rev:1,draft:DC}).ok,true);
  assert.equal(lres(h,'b',{type:'draft',rev:4,draft:{...DB,name:'Eski'}}).code,'stale');assert.equal(lres(h,'b',{type:'draft',rev:5,draft:{...DB,name:'Aynı rev'}}).code,'stale');
  const names=()=>J(h,'[...MP.state.players.values()].filter(p=>p.draft).map(p=>p.name+":"+p.draft.name).sort()');
  assert.deepEqual(names(),['Bora:Saf Akıl Ağı','Cem:Okyanus Ticaret Birliği'],'no cross-player write');
  assert.equal(lres(h,'b',{type:'ready',value:true}).ok,true);
  assert.equal(lres(h,'b',{type:'draft',rev:6,draft:DB}).ok,true);assert.equal(J(h,'[...MP.state.players.values()].find(p=>p.name==="Bora").ready'),true,'same draft keeps ready');
  assert.equal(lres(h,'b',{type:'draft',rev:7,draft:{...DB,name:'Yeni Ad'}}).ok,true);assert.equal(J(h,'[...MP.state.players.values()].find(p=>p.name==="Bora").ready'),false,'changed draft resets ready');
  assert.equal(lres(h,'b',{type:'claim',empire:2}).code,'mode','AI takeover is not part of design mode');
  assert.deepEqual(msg(h,'b',{v:1,type:'draft',rev:8,draft:DB,empire:3}).map(m=>m.code),['bad-draft'],'extra fields (e.g. a target player/empire) are rejected');
});
test('hazır ve başlatma: taslaksız hazır olunmaz; herkes hazır olmadan başlamaz; host galaksi ayarı değişince hazırlar sıfırlanır; AI + insan > 11 reddedilir; host taslağı geçersizse başlamaz',()=>{
  const h=room();join(h,'b','Bora');join(h,'c','Cem');
  assert.equal(lres(h,'b',{type:'ready',value:true}).code,'no-draft');
  lres(h,'b',{type:'draft',rev:1,draft:DB});lres(h,'c',{type:'draft',rev:1,draft:DC});lres(h,'b',{type:'ready',value:true});
  assert.equal(J(h,'MP.canStart().why'),'guest-not-ready');assert.equal(J(h,'MP.start().ok'),false);
  lres(h,'c',{type:'ready',value:true});assert.equal(J(h,'MP.canStart().ok'),true);
  assert.equal(J(h,'MP.configure({size:"orta",aiCount:6,seed:22}).ok'),true);assert.equal(J(h,'[...MP.state.players.values()].filter(p=>p.playerId!=="host"&&p.ready).length'),0,'settings change resets ready');
  assert.equal(J(h,'MP.configure({size:"orta",aiCount:10,seed:22}).why'),'too-many-states','10 AI + 2 guests > 11');
  assert.equal(J(h,'MP.setCapacity(4).ok'),true);assert.equal(J(h,'MP.configure({size:"orta",aiCount:9,seed:22}).why'),'too-many-states');
  lres(h,'b',{type:'ready',value:true});lres(h,'c',{type:'ready',value:true});
  h.run('HOST.ethics={mil:3,aut:3,mat:3,ahl:3}');assert.equal(J(h,'MP.canStart().why'),'host-draft');h.run('HOST.ethics={mil:2,aut:0,mat:0,ahl:0}');
  assert.equal(J(h,'MP.canStart().ok'),true);
});
test('başlangıç: galaksi taslaklarla gerçek setupGame\'le kurulur; misafirler koltuk sırasıyla kendi tasarladığı devlete (id 1, 2) atanır; köken/fizyoloji/doktrin etkileri motorun; AI sayısı insanlardan bağımsız; çift başlatma yok; RNG/Save8 deterministik',()=>{
  const run=()=>{const h=room();join(h,'b','Bora');join(h,'c','Cem');lres(h,'b',{type:'draft',rev:1,draft:DB});lres(h,'c',{type:'draft',rev:1,draft:DC});
    lres(h,'b',{type:'ready',value:true});lres(h,'c',{type:'ready',value:true});assert.equal(J(h,'MP.start().ok'),true);return h;};
  const h=run();
  const e=J(h,'G.emps.filter(e=>!e.wild).map(e=>({id:e.id,ai:e.ai,n:e.name,mz:e.mizac,ph:e.physio,org:e.origin,civ:e.civics,eth:e.ethics,lock:e.persLock||null,pop:G.sys[e.home].planets.find(p=>p.col&&p.owner===e.id).col.pop,techs:Object.keys(e.techs).length,fl:G.fleets.filter(f=>f.e===e.id).length}))');
  assert.deepEqual(e.slice(0,3).map(x=>[x.id,x.ai,x.n,x.mz,x.ph,x.org]),[[0,false,'Host Devleti','militarist','avian','kusatilmis'],[1,false,'Saf Akıl Ağı','teknokrasi','machine','son_umut'],[2,false,'Okyanus Ticaret Birliği','tuccar','aquatic','gocebe']]);
  assert.deepEqual(e[1].civ,['sinyal_avci']);assert.deepEqual(e[1].eth,{mil:-1,aut:0,mat:2,ahl:0});assert.equal(e[1].lock,'teknokrasi');
  assert.equal(e[1].pop,5,'son_umut: 5 pop');assert(e[1].techs>0,'son_umut: tier-1 techs');assert.equal(e[2].pop,6,'gocebe: 6 pop');assert(e[2].fl>=5,'gocebe: extra fleets');
  assert.equal(e.filter(x=>x.ai).length,5,'5 AI regardless of 2 humans');
  assert.deepEqual(J(h,'[...MP.state.slots.entries()].sort()').map(x=>x[0]),[0,1,2]);
  assert.equal(J(h,'MP.start().why'),'already-started');assert.equal(J(h,'MP.lobby.phase'),'ingame');
  const h2=run();assert.equal(h2.run('serialize()'),h.run('serialize()'),'same drafts + seed → same world');assert.equal(h2.run('RND_STATE'),h.run('RND_STATE'));
  assert.equal(lres(h,'b',{type:'draft',rev:9,draft:{...DB,name:'Oyun içinde'}}).code,'phase','no draft changes after start');
});
test('ayna ve gizlilik: misafir kendi tasarlanmış devletini devlet 0 olarak görür; diğer insanın taslağı/kaynağı/teknolojisi aynada yok; misafir başkasının devletine komut veremez',()=>{
  const h=room();join(h,'b','Bora');join(h,'c','Cem');lres(h,'b',{type:'draft',rev:1,draft:DB});lres(h,'c',{type:'draft',rev:1,draft:DC});lres(h,'b',{type:'ready',value:true});lres(h,'c',{type:'ready',value:true});h.run('MP.start()');
  const m=msg(h,'b',{v:1,type:'ui',mode:'stars'}).find(x=>x.type==='mirror').full;
  assert.equal(m.emps[0].name,'Saf Akıl Ağı');assert.equal(m.emps[0].mizac,'teknokrasi');
  const c=m.emps.find(x=>x.name==='Okyanus Ticaret Birliği');if(c){assert.equal(Object.values(c.res).reduce((a,b)=>a+b,0),0);assert.equal(Object.keys(c.techs).length,0);}
  const fleetC=J(h,'G.fleets.find(f=>f.e===2).id'),to=J(h,`G.sys[G.emps[2].home].lanes[0]`);
  const r=msg(h,'b',{v:1,type:'cmd',seq:1,cid:'mp7test0001',cmd:{kind:'move',fleet:fleetC,to}}).find(x=>x.type==='result');assert.notEqual(r.status,'ok','cannot order another human\'s fleet');
});
test('MP.4: tasarımla kurulan oyun kaydedilir ve yeni süreçte açılır; tasarlanmış devletler Save8\'de; misafir jetonuyla aynı devlete döner',()=>{
  const h=room();join(h,'b','Bora');join(h,'c','Cem');lres(h,'b',{type:'draft',rev:1,draft:DB});lres(h,'c',{type:'draft',rev:1,draft:DC});lres(h,'b',{type:'ready',value:true});lres(h,'c',{type:'ready',value:true});h.run('MP.start()');
  const tB=J(h,'[...MP.state.players.values()].find(p=>p.name==="Bora").token');const pk=J(h,'MP.snapshot({name:"MP7"})');assert.equal(pk.ok,true);
  const g=runtime({root});g.sb.__rand=rnd(500);g.sb.__out=[];g.sb.__text=JSON.stringify(pk.pkg);g.run(MIR);g.run(CORE);
  assert.equal(g.run(`var V=StarsMP.validatePackage(__text);var LW=V.ok?StarsMP.loadWorld(V.pkg):null;var MP=StarsMP.createHost({roomId:'r7b',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{design:true,generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();MP.lobby.phase`),'resume');
  assert.deepEqual(J(g,'G.emps.slice(0,3).map(e=>[e.name,e.mizac,e.origin,e.ai])'),[['Host Devleti','militarist','kusatilmis',false],['Saf Akıl Ağı','teknokrasi','son_umut',false],['Okyanus Ticaret Birliği','tuccar','gocebe',false]]);
  const a=msg(g,'nb',{v:1,type:'hello',name:'Bora',token:tB}).find(x=>x.type==='assign');assert.equal(a.empireId,1,'returns to its own designed empire');
  assert.equal(J(g,'MP.resumeStart().ok'),true);assert.equal(J(g,'MP.lobby.phase'),'ingame');
});
test('eski MP.1 devralma kipi (design verilmez) aynen: configure galaksiyi kurar, claim çalışır; tek oyunculu setupGame cfg.humans olmadan değişmez',()=>{
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(MIR);h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r1',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true};}}});MP.setCapacity(2);MP.configure({size:'orta',aiCount:5,seed:22});`);
  assert.equal(J(h,'MP.lobby.mode'),'claim');join(h,'b','B');assert.equal(lres(h,'b',{type:'claim',empire:3}).ok,true);assert.equal(lres(h,'b',{type:'draft',rev:1,draft:DB}).code,'mode');
  const s=runtime({root});s.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});`);const s2=runtime({root});s2.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22,humans:undefined});`);
  assert.equal(s.run('serialize()'),s2.run('serialize()'));
  assert.throws(()=>s.run(`setupGame({...CFG,size:'orta',aiCount:2,seed:1,humans:[{race:'insan'},{race:'insan'}]})`),/En az bir AI/);
});
end();
