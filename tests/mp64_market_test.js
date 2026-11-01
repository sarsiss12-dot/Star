'use strict';
/* MP.6.4 — Galaktik Borsa, uzak insanlarla. Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI; uzak insanlar B=3, C=5.
   FİKSTÜR (açıkça): Galaktik Konsey motorun kendi biçiminde (diplomacy.js 4482 alanları) ve "Galaktik Borsayı Kur" yasası
   (laws.borsaKur) — borsa motorda yalnız bu yasayla açılır; kaynak.
   Kanıtlanan: takas motorun marketTrade'i; fiyat host'ta işlem anında; gördüğü fiyat eskiyse 'stale' (işlem yok); eşzamanlı
   iki alım host sırasıyla, ikincisi yeni fiyatla yeniden onay ister; bakiye/miktar/kapalı borsa motor gerekçesiyle; kaynak
   çoğalmaz (muhasebe tam); aynı cid ikinci kez uygulanmaz; reddedilen komut Save8/RNG değiştirmez; görünüm yalnız herkese açık
   fiyatlar; MP.4 kayıt/yükleme sonrası fiyatlar. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const B=3,C=5,CONN={[B]:'cB',[C]:'cC'};
const COUNCIL=`G.council={name:councilName(),founder:2,members:[0,1,2,3,4,5],laws:{borsaKur:true},targeted:{},treasury:0,president:2,termStart:G.day,terms:{},voteIn:12,vote:null,dead:false};marketInit();`;
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(open=true){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r64m',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c==='cB'?'Bora':'Cem'}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};for(const e of G.emps)if(!e.wild)for(const k of ['ene','min','ala'])e.res[k]=2000;${open?COUNCIL:''}MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function cmd(h,who,c,cid){const conn=CONN[who],s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  return msg(h,conn,{v:1,type:'cmd',seq:s,cid:cid||('m64m'+conn+String(s).padStart(6,'0')),cmd:c}).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const quote=(h,sat,al,n)=>J(h,`marketQuote(${JSON.stringify(sat)},${JSON.stringify(al)},${n}).alinan`);
const res=(h,id)=>J(h,`({ene:G.emps[${id}].res.ene,min:G.emps[${id}].res.min,ala:G.emps[${id}].res.ala})`);

test('kapalı borsa: motorun gerekçesi; görünümde open 0; reddedilen komut Save8/RNG değiştirmez',()=>{
  const h=world(false);assert.equal(J(h,`MP.viewFor(G.emps[${B}]).mkt.open`),0);const s0=st(h);
  const r=cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:100});assert.equal(r.code,'rules:market');assert.match(r.detail[0],/Borsa henüz kurulmadı/);assert.deepEqual(st(h),s0);
});
test('alım-satım: B min → ala (motorun marketTrade\'i; komisyon, fiyat kayması motorun); C ala satar; muhasebe tam, kaynak çoğalmaz; bildirim kendine',()=>{
  const h=world();const v=J(h,`MP.viewFor(G.emps[${B}]).mkt`);assert.equal(v.open,1);assert.deepEqual(Object.keys(v.mul).sort(),['ala','ene','min']);
  const b0=res(h,B),exp=quote(h,'min','ala',300),r0=h.run('RND_STATE');
  const r=cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:300,expect:Math.round(exp*100)/100});assert.equal(r.status,'ok');
  const b1=res(h,B);assert.equal(b0.min-b1.min,300);assert(Math.abs((b1.ala-b0.ala)-exp)<1e-6,'received exactly the host quote');assert.equal(h.run('RND_STATE'),r0,'no RNG');
  const c0=res(h,C),e2=quote(h,'ala','ene',50);assert.equal(cmd(h,C,{kind:'market',sat:'ala',al:'ene',amount:50,expect:Math.round(e2*100)/100}).status,'ok');
  const c1=res(h,C);assert.equal(c0.ala-c1.ala,50);assert(Math.abs((c1.ene-c0.ene)-e2)<1e-6);
  assert.deepEqual([res(h,C).min,res(h,B).ene],[c0.min,b0.ene],'unrelated balances untouched');
  h.run('MP.publish()');assert(J(h,`MP.viewFor(G.emps[${B}]).log.map(n=>n.m)`).some(m=>/💱 300/.test(m)));assert(!J(h,`MP.viewFor(G.emps[${C}]).log.map(n=>n.m)`).some(m=>/💱 300/.test(m)),'C does not see B\'s trade');
});
test('eşzamanlı: B ve C aynı anda aynı fiyatı görüp ala alır; host sırayla işler — ikinci istek fiyat kaydığı için "stale" (güncel teklifle), yeniden onayla geçer; toplam doğru',()=>{
  const h=world();const exp=Math.round(quote(h,'min','ala',1500)*100)/100;const b0=res(h,B),c0=res(h,C);
  const rb=cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:1500,expect:exp}),rc=cmd(h,C,{kind:'market',sat:'min',al:'ala',amount:1500,expect:exp});
  assert.equal(rb.status,'ok');assert.equal(rc.code,'rules:stale','second order revalidated at the new price');assert.deepEqual(res(h,C),c0,'stale: nothing applied');
  const fresh=+rc.detail[1];assert(fresh<exp,'buying ala made it dearer: '+fresh+' < '+exp);
  assert.equal(cmd(h,C,{kind:'market',sat:'min',al:'ala',amount:1500,expect:fresh}).status,'ok');
  const b1=res(h,B),c1=res(h,C);assert(Math.abs((b1.ala-b0.ala)-exp)<.01);assert(Math.abs((c1.ala-c0.ala)-fresh)<.01);assert.equal(b0.min-b1.min+c0.min-c1.min,3000);
});
test('geçersiz: yetersiz bakiye, sıfır/negatif/ondalık miktar, aynı kaynak, bilinmeyen kaynak, fazla alan — işlem yok; aynı cid ikinci kez uygulanmaz',()=>{
  const h=world();const s0=st(h);
  let r=cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:999999});assert.equal(r.code,'rules:market');assert.match(r.detail[0],/Yeterli/);
  for(const bad of [{amount:0},{amount:-5},{amount:2.5},{al:'min'},{sat:'etk'},{amount:10,extra:1}])assert.equal(cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:10,...bad}).code,'bad-params',JSON.stringify(bad));
  assert.deepEqual(st(h),s0,'no change for any refused order');
  const ok=cmd(h,B,{kind:'market',sat:'ene',al:'min',amount:100},'m64mdup0001');assert.equal(ok.status,'ok');const s1=st(h);
  const d=cmd(h,B,{kind:'market',sat:'ene',al:'min',amount:100},'m64mdup0001');assert(d.dup);assert.deepEqual(st(h),s1,'duplicate not applied');
});
test('MP.4: fiyat çarpanları (Save8 G.market) kayıt/yükleme sonrası aynı; görünüm yeniden kurulur',()=>{
  const h=world();cmd(h,B,{kind:'market',sat:'min',al:'ala',amount:800});const mul=J(h,'G.market.mul');const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);
  const g=runtime({root});g.sb.__rand=rnd(800);g.sb.__out=[];g.sb.__text=text;g.run(CORE);
  assert.equal(J(g,`(()=>{var V=StarsMP.validatePackage(__text);if(!V.ok)return V;var LW=StarsMP.loadWorld(V.pkg);if(!LW.ok)return LW;
    globalThis.MP=StarsMP.createHost({roomId:'r64n',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(){return {ok:false};}},resume:V.pkg});globalThis.seq={};return {ok:true};})()`).ok,true);
  assert.deepEqual(J(g,'G.market.mul'),mul);assert.deepEqual(J(g,`MP.viewFor(G.emps[${B}]).mkt.mul`),mul);
});
end();
