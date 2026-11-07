'use strict';
/* PERF.1 — performans değişikliği davranışı değiştirmez.
   Kontrol motoru = aynı runtime dosyaları, economy.js ve economic-ledger.js PERF.1 bloklarından tam metinle arındırılmış
   (tests/helpers/perf1-preservation.js; MP.6.4 / 96H.10 baytları). Aday = çalışma ağacı. Aynı Save8 (gerçek seed 11, 228. ay
   geç oyun kaydı: federasyonlar, ticaret ağı, savaşlar) iki ayrı vm'de aynı adımlarla ilerletilir; her ay Save8 ve RNG birebir.
   Ayrıca: ticaret rotası önbelleği radyasyon / şerit / yeni dünya değişince sıfırlanır ve her saklı rota taze findPath ile aynıdır;
   EconomyLedger'in ara nesnesiz stock/snapshot/changedSince'i eski ifadelerle aynı sonucu verir. */
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),P=require('./helpers/perf1-preservation');
const originalStrip=P.stripReviewedP1,stripSetup=require('./helpers/beta-setup0-preservation.cjs').stripReviewedSetup0;P.stripReviewedP1=(f,s)=>originalStrip(f,stripSetup(f,s));
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const SAVE=fs.readFileSync(path.join(__dirname,'fixtures/96h10/seed11-month228-occupied-colony.save'),'utf8');
const FILES=['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','commerce.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'];
function controlRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'perf1-control-'));
  for(const f of FILES)fs.writeFileSync(path.join(dir,f),P.stripReviewedP1(f,fs.readFileSync(path.join(root,f),'utf8')));
  return dir;
}
const STEP=`G.autoSave=false;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}`;
function world(r){const h=runtime({root:r});h.sb.__s=SAVE;assert.equal(h.run('deserialize(__s)'),true);h.run(STEP);return h;}

test('arındırılmış kaynaklar PERF.1 öncesi baytların kendisi: economy.js 96H.9/96H.10 özeti, economic-ledger.js MP.6.4 özeti',()=>{
  assert.equal(sha(P.stripReviewedP1('economy.js',fs.readFileSync(path.join(root,'economy.js'),'utf8'))),'5d412d488760ae2b7193b13822b747788130b63ed782e62bfbd3223154b69d22');
  assert.equal(sha(P.stripReviewedP1('economic-ledger.js',fs.readFileSync(path.join(root,'economic-ledger.js'),'utf8'))),'67d07f3ee4777cd7c246c8b37dda7cf1577cf86c19a6edeba68945a5d3063501');
  for(const f of ['economy.js','economic-ledger.js'])assert.notEqual(P.stripReviewedP1(f,fs.readFileSync(path.join(root,f),'utf8')),fs.readFileSync(path.join(root,f),'utf8'),f+' carries the reviewed PERF.1 block');
});
test('kontrol ve aday aynı geç oyun Save8\'inden 3 ay: her ay Save8 ve RNG birebir; aday ticaret rotasını yeniden hesaplamaz',()=>{
  const dir=controlRoot();try{
    const c=world(dir),a=world(root);
    a.run('var __fp=0,__fp0=findPath;findPath=function(){__fp++;return __fp0.apply(this,arguments);}');c.run('var __fp=0,__fp0=findPath;findPath=function(){__fp++;return __fp0.apply(this,arguments);}');
    for(let m=0;m<3;m++){c.run('__step()');a.run('__step()');
      assert.equal(sha(a.run('serialize()')),sha(c.run('serialize()')),'Save8 month '+(m+1));assert.equal(a.run('RND_STATE'),c.run('RND_STATE'),'RNG month '+(m+1));}
    assert(+a.run('__fp')*20<+c.run('__fp'),'candidate findPath calls '+a.run('__fp')+' vs control '+c.run('__fp'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('ticaret rotası önbelleği: her saklı rota taze findPath ile aynı; radyasyon, şerit dizisi ve yeni dünya önbelleği sıfırlar',()=>{
  const h=world(root);
  const check=()=>JSON.parse(h.run(`JSON.stringify((()=>{const m=tradePathMemo();let n=0,bad=0;for(const [k,v] of m){const a=Math.floor(k/65536),b=k%65536;n++;if(JSON.stringify(findPath(a,b))!==JSON.stringify(v))bad++;}return {n,bad};})())`));
  h.run('for(const e of G.emps)if(!e.dead)tradeLinks(e)');let r=check();assert(r.n>10,'cached routes '+r.n);assert.equal(r.bad,0);
  const s0=h.run('TRADE_PATHS.memo.size');
  h.run('var __rs=G.sys.find(s=>!s.radiation&&s.lanes.length>2);__rs.radiation=true');assert.equal(+h.run('tradePathMemo().size'),0,'radiation change resets');
  h.run('for(const e of G.emps)if(!e.dead)tradeLinks(e)');r=check();assert.equal(r.bad,0,'after radiation');assert(r.n>0);
  h.run('__rs.lanes=__rs.lanes.slice()');assert.equal(+h.run('tradePathMemo().size'),0,'lane array replacement resets');
  h.run('for(const e of G.emps)if(!e.dead)tradeLinks(e)');const oldSys=h.run('var __old=G.sys;1');void oldSys;h.sb.__s2=SAVE;h.run('deserialize(__s2)');
  assert.equal(h.run('TRADE_PATHS.sys===__old'),false,'a loaded world never reuses the previous world memo (deserialize itself recomputes income → fresh entries)');
  h.run('tradePathMemo()');assert.equal(h.run('TRADE_PATHS.sys===G.sys'),true);r=check();assert.equal(r.bad,0,'after load');void s0;
});
test('EconomyLedger: stock / snapshot / changedSince eski ifadelerle aynı (anahtar sırası, clean kuralı, eksik devlet, NaN/sonsuz)',()=>{
  const h=world(root);
  const r=JSON.parse(h.run(`JSON.stringify((()=>{const L=EconomyLedger,out=[];
    const oldStock=e=>Object.fromEntries(L.keys.map(k=>[k,L.clean(e.res?.[k])])),oldSnap=()=>Object.fromEntries(G.emps.map(e=>[e.id,oldStock(e)]));
    const oldChanged=b=>G.emps.some(e=>Object.entries(oldStock(e)).some(([k,v])=>v!==b[e.id]?.[k]));
    for(const e of G.emps)out.push(JSON.stringify(L.stock(e))===JSON.stringify(oldStock(e)));
    out.push(JSON.stringify(L.snapshot())===JSON.stringify(oldSnap()));
    let b=L.snapshot();out.push(L.changedSince(b)===oldChanged(b)&&L.changedSince(b)===false);
    G.emps[3].res.min+=1;out.push(L.changedSince(b)===oldChanged(b)&&L.changedSince(b)===true);
    b=L.snapshot();G.emps[2].res.ala=NaN;out.push(L.changedSince(b)===oldChanged(b));b=L.snapshot();G.emps[2].res.ala=Infinity;out.push(L.changedSince(b)===oldChanged(b));
    b=L.snapshot();delete b[4];out.push(L.changedSince(b)===oldChanged(b)&&L.changedSince(b)===true);
    const sav=G.emps[5].res;G.emps[5].res=undefined;out.push(JSON.stringify(L.stock(G.emps[5]))===JSON.stringify(oldStock(G.emps[5])));G.emps[5].res=sav;
    return out;})())`));
  assert(r.length>8);assert(r.every(Boolean),JSON.stringify(r));
});
end();
