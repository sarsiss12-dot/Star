'use strict';
/* MP.6.4 — oyuncuya özel galaktik haberler. Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI; uzak insanlar B=3, C=5.
   Motor haber bilgisini olay anında yalnız host'un (G.p) bakışıyla donduruyordu; misafirin aynasında haber yoktu.
   FİKSTÜR (açıkça): temas haritası (C, 2 ve 4 ile temassız), istihbarat seviyeleri motorun alanına (e.intel).
   Kanıtlanan: gerçek motor olayları (declareWar → 'war', makePeace → 'peace') motorun kuralıyla her oyuncunun kendi bakışında;
   taraf olan "doğrudan katılım" görür; temassız devlet içeren haber gitmez; üçüncü taraf savaşı yalnız istihbarat ≥3 ile;
   görünmeyen sistemdeki olay gitmez; host'un oyuncu kapsamlı haberi misafire gitmez; ayna motorun Save8 haber biçiminde ve
   motorun deserialize'ı kabul eder; π yeniden numaralandırma; RNG/Save8 değişmez. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const B=3,C=5;
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(MIR);h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r64h',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');
    for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=0;}
    for(const x of [2,4]){G.emps[${C}].contact[x]=false;G.emps[x].contact[${C}]=false;}MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const news=(h,id)=>J(h,`MP.newsOf(${id})`);
const keys=(h,id)=>news(h,id).map(r=>r.key);

test('taraf olan uzak insan kendi savaş ilanını "doğrudan katılım" ile görür; temassız C görmez; host\'un listesi ayrı',()=>{
  const h=world();h.run(`G._dealAuth=true;try{declareWar(G.emps[2],G.emps[${B}]);}finally{G._dealAuth=false;}`);
  const nb=news(h,B).filter(r=>r.category==='war');assert(nb.length>=1,'B sees the war it is part of');assert.equal(nb[0].knowledge,'Doğrudan katılım');
  assert.equal(news(h,C).filter(r=>r.category==='war').length,0,'C has no contact with 2 → nothing');
});
test('üçüncü taraf savaşı (AI 2 ↔ AI 1) motorun kuralıyla: B ancak istihbarat ≥3 ile görür; ≤2 iken görmez',()=>{
  const h=world();h.run(`G.emps[${B}].intel={1:2,2:2};G._dealAuth=true;try{declareWar(G.emps[2],G.emps[1]);}finally{G._dealAuth=false;}`);
  assert.equal(news(h,B).filter(r=>r.category==='war').length,0,'intel 2: no knowledge');
  h.run(`makePeace(G.emps[2],G.emps[1]);G.emps[${B}].intel={1:3};G._dealAuth=true;try{declareWar(G.emps[1],G.emps[4]);}finally{G._dealAuth=false;}`);
  const w=news(h,B).filter(r=>r.category==='war');assert(w.length>=1,'intel 3 on a party → B learns');assert.equal(w[0].knowledge,'Diplomatik istihbarat (seviye 3)');
  assert(!news(h,B).some(r=>r.category==='peace'),'the earlier peace (intel ≤2 at that time) stays unknown: knowledge frozen at the event');
});
test('sistem olayı: B\'nin keşfetmediği / görmediği sistemdeki olay gitmez; kendi sistemindeki olay "doğrudan katılım"; host\'un oyuncu kapsamlı haberi misafire gitmez',()=>{
  const h=world();const hb=J(h,`G.emps[${B}].home`),far=J(h,`G.sys.find(s=>!s.seen.includes(${B})).id`);
  h.run(`recordNews({category:'territory',empires:[${B}],system:${hb},key:'t1',title:'Sahiplik değişti',text:'x'});recordNews({category:'territory',empires:[1],system:${far},key:'t2',title:'Sahiplik değişti',text:'y'});
    recordNews({category:'espionage',scope:'player',empires:[0,1],key:'p1',title:'Casusluk — test',text:'host only'});`);
  const kb=keys(h,B);assert(kb.includes('t1'));assert(!kb.includes('t2'),'unseen system');assert(!kb.includes('p1'),'host player-scope news never reaches a guest');
  assert(!keys(h,C).includes('t1'),'C is not a party and does not see the home of B now');
});
test('ayna: haberler motorun Save8 biçiminde (news.records), π ile numaralandırılmış; motorun deserialize\'ı kabul eder; host günlüğü/haberleri girmez; RNG/Save8 değişmez',()=>{
  const h=world();const s0=h.run('serialize()'),r0=h.run('RND_STATE');h.run(`G._dealAuth=true;try{declareWar(G.emps[2],G.emps[${B}]);}finally{G._dealAuth=false;}`);
  const s1=h.run('serialize()'),r1=h.run('RND_STATE');void s0;void r0;
  const m=JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${B},{cosmeticSeed:7,news:MP.newsOf(${B})}))`));
  assert.equal(m.news.v,1);assert(m.news.records.length>=1);assert(m.news.records.every(r=>r.empires.every(x=>x.id!==B)),'own id renumbered to 0');
  assert(m.news.records.some(r=>r.empires.some(x=>x.id===0)));assert.deepEqual(m.news.hidden,[]);
  const g=runtime({root});g.sb.__t=JSON.stringify(m);assert.equal(g.run('deserialize(__t)'),true);assert(J(g,'GalacticNews.state().records.length')>=1);
  assert.equal(h.run('serialize()'),s1);assert.equal(h.run('RND_STATE'),r1,'mirror/news fan-out consume no RNG and change no Save8');
});
end();
