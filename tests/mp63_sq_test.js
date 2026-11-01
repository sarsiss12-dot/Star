'use strict';
/* MP.6.3 — statüko barışı tekliflerinin MP.4 kayıt paketinde kalıcılığı. Host'un gerçek STARS motoru (Node vm), seed 22, orta,
   5 AI; uzak insanlar A=1, B=3. FİKSTÜR: temas + kaynak; A ile B savaşta (declareWar).
   Kanıtlanan: teklif paketin diplomasi bölümünde (isteğe bağlı 'sq'); yeni süreçte yükleme sonrası B aynı devlete dönünce
   bekleyen teklifini görür; yanıt host'ta bir kez işlenir; süre yapay uzamaz (mutlak gün; dolmuşsa 'expired'); eski (sq'suz)
   paket aynen doğrulanır ve yüklenir; Save8 değişmez (teklif deposu Save8 dışında). */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r63q',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cA'?'Ada':'Bora'}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};
    for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
    for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=40;}
    declareWar(G.emps[${A}],G.emps[${B}]);MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function cmd(h,who,c){const conn=CONN[who],s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  return msg(h,conn,{v:1,type:'cmd',seq:s,cid:'m63q'+conn+String(s).padStart(5,'0')+String(Math.random()).slice(2,6),cmd:c}).find(m=>m.type==='result');}
const token=(h,conn)=>h.sb.__out.filter(([c,t])=>c===conn&&t.includes('"type":"assign"')).map(([,t])=>JSON.parse(t)).at(-1).token;
function reopen(text,day){
  const g=runtime({root});g.sb.__rand=rnd(900);g.sb.__out=[];g.sb.__text=text;g.run(CORE);
  const r=J(g,`(()=>{var V=StarsMP.validatePackage(__text);if(!V.ok)return V;var LW=StarsMP.loadWorld(V.pkg);if(!LW.ok)return LW;${day!==undefined?'G.day='+day+';':''}
    globalThis.MP=StarsMP.createHost({roomId:'r63r',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();globalThis.seq={};return {ok:true};})()`);
  assert.equal(r.ok,true,JSON.stringify(r));return g;
}
function back(g,h,who){const conn=CONN[who];msg(g,conn,{v:1,type:'hello',name:who===A?'Ada':'Bora',token:token(h,conn)});}
const sqOf=(h,id)=>J(h,`MP.viewFor(G.emps[${id}]).dip.sq`);

test('A → B statüko teklifi; host kaydeder; yeni süreçte devam: B aynı devlete döner, bekleyen teklifini görür; reddi BİR KEZ işlenir; Save8 teklif içermez',()=>{
  const h=world();assert.equal(cmd(h,A,{kind:'statusQuo',target:B}).status,'ok');
  const q0=J(h,'MP.snapshot({}).pkg');assert.equal(q0.diplomacy.sq.length,1);assert.deepEqual(Object.keys(q0.diplomacy.sq[0]).sort(),['born','expires','from','status','to']);
  assert(!q0.save8.includes('"sq"'),'not in Save8');
  const g=reopen(JSON.stringify(q0));back(g,h,A);back(g,h,B);assert.equal(J(g,'MP.resumeStart().ok'),true);
  const v=sqOf(g,B);assert.equal(v.length,1);assert.deepEqual([v[0].from,v[0].to,v[0].status,v[0].expires],[A,B,'pending',q0.diplomacy.sq[0].expires],'pending, expiry unchanged');
  assert.equal(sqOf(g,A).length,1,'the proposer sees it too');
  const s0=g.run('serialize()');
  assert.equal(cmd(g,B,{kind:'statusQuoReply',from:A,accept:false}).status,'ok');assert.equal(J(g,'MP.viewFor(G.emps[3]).dip.sq[0].status'),'rejected');
  assert.equal(cmd(g,B,{kind:'statusQuoReply',from:A,accept:false}).code,'no-offer','processed once');
  assert.equal(cmd(g,B,{kind:'statusQuoReply',from:A,accept:true}).code,'no-offer');assert.equal(g.run('serialize()'),s0,'rejection does not touch Save8');
  assert.equal(J(g,'G.emps[1].war[3]'),true,'war continues after rejection');
});
test('kabul de bir kez: yüklemeden sonra B kabul eder → motorun statusQuoPeace\'i ya da motorun gerekçesi; tekrar yanıt "yok"',()=>{
  const h=world();cmd(h,A,{kind:'statusQuo',target:B});const g=reopen(JSON.stringify(J(h,'MP.snapshot({}).pkg')));back(g,h,A);back(g,h,B);J(g,'MP.resumeStart().ok');
  const can=J(g,`canStatusQuo(G.emps[${B}],G.emps[${A}]).ok`),r=cmd(g,B,{kind:'statusQuoReply',from:A,accept:true});
  if(can){assert.equal(r.status,'ok');assert.equal(J(g,'G.emps[1].war[3]'),false,'peace applied once');assert.equal(cmd(g,B,{kind:'statusQuoReply',from:A,accept:true}).code,'no-offer');}
  else assert.equal(r.code,'rules:diplo','engine refusal with its own reason');
});
test('süre yapay uzamaz: kayıt 180 gün sonra yüklenirse teklif "expired"; yanıt "yok"; misafir görünümünde süresi dolmuş',()=>{
  const h=world();cmd(h,A,{kind:'statusQuo',target:B});const pkg=J(h,'MP.snapshot({}).pkg');
  const g=reopen(JSON.stringify(pkg),pkg.diplomacy.sq[0].expires+1);back(g,h,B);J(g,'MP.resumeStart().ok');
  assert.equal(sqOf(g,B)[0].status,'expired');assert.equal(cmd(g,B,{kind:'statusQuoReply',from:A,accept:true}).code,'no-offer');
});
test('geriye uyum: teklifsiz paket MP.6.2 biçimindedir (sq alanı yok) ve aynen yüklenir; bozuk sq (uzatılmış süre) reddedilir',()=>{
  const h=world();const pkg=J(h,'MP.snapshot({}).pkg');assert.equal('sq' in pkg.diplomacy,false,'no new field when there is nothing to store');
  const g=reopen(JSON.stringify(pkg));back(g,h,B);assert.equal(J(g,'MP.resumeStart().ok'),true);
  cmd(h,A,{kind:'statusQuo',target:B});const p2=J(h,'MP.snapshot({}).pkg');p2.diplomacy.sq[0].expires+=500;
  const re=J(h,`(()=>{const p=${JSON.stringify(p2)};const body={};for(const k of Object.keys(p))if(k!=='integrity')body[k]=p[k];body.save8=p.integrity.save8;
    p.integrity.body=StarsMP.sha256(StarsMP.canon(body));return StarsMP.validatePackage(JSON.stringify(p));})()`);
  assert.deepEqual([re.ok,re.why],[false,'offers'],'integrity recomputed: the sq rule itself refuses an extended expiry');
});
end();
