'use strict';
/* PERF.2 — host AI performansı davranışı değiştirmez.
   Kontrol motoru = aynı runtime dosyaları, ai.js ve main.js PERF.2 bloklarından tam metinle arındırılmış
   (tests/helpers/perf2-preservation.js; MP.7.5 / 96h10p4 baytları). Aday = çalışma ağacı. Aynı gerçek geç oyun Save8'i
   (orta galaksi, 6 AI devleti, seed 404, 60. ay; 96h10p4 kontrol kökünden; 4 federasyon üyesi) iki ayrı vm'de aynı adımlarla ilerletilir; her ay Save8 ve RNG birebir, karar işlevlerinin çağrı sayısı aynı.
   Ayrıca: okuma-yalnız AI penceresi (A) pencere dışında hiçbir şey saklamaz, pencere sonunda boşalır, hata olsa da kapanır;
   pencere içinde gölge gelir / taze ticaret sonucu pencere kapalıyken hesaplananla aynı; liman değişen aday saklanmaz.
   supplyDistance'ın doğrudan geçit denetimi (B) eski gateSupplyNodes listesiyle her filo ve her sistem için aynı sonucu verir. */
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture'),P=require('./helpers/perf2-preservation');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const SAVE=fs.readFileSync(path.join(__dirname,'fixtures/perf2/orta6-s404-m60.save'),'utf8');
const FILES=['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','commerce.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','commerce-ui.js','economic-ledger.js','economy-ui.js','audio.js'];
const BUILD=/const BUILD_ID = '[^']*';/;
function controlRoot(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'perf2-control-'));
  for(const f of FILES)fs.writeFileSync(path.join(dir,f),P.stripReviewedP2(f,fs.readFileSync(path.join(root,f),'utf8')));
  return dir;
}
const STEP=`G.autoSave=false;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}}`;
const COUNT=`var __n={};for(const k of ['empireIncome','aiBuildingDelta','aiEconomyPlan','queueBuilding','queueShip','aiMove','executeDeal']){const o=globalThis[k];__n[k]=0;globalThis[k]=function(){__n[k]++;return o.apply(this,arguments);};}`;
function world(r){const h=runtime({root:r});h.sb.__s=SAVE;assert.equal(h.run('deserialize(__s)'),true);h.run(STEP);return h;}

test('arındırılmış kaynaklar PERF.2 öncesi baytların kendisi: ai.js ve main.js MP.7.5 (96h10p4) özeti',()=>{
  const ai=fs.readFileSync(path.join(root,'ai.js'),'utf8'),main=fs.readFileSync(path.join(root,'main.js'),'utf8');
  assert.equal(sha(P.stripReviewedP2('ai.js',ai)),'11485356c0e75c39d9dabb2fc06b50bfb425598d3d08a2b767fc691c39ce51c6');
  assert.equal(sha(P.stripReviewedP2('main.js',main).replace(BUILD,"const BUILD_ID = '96h10p4';")),'3b259d32d22877bae16cfbd5e59f2abed0ec829146cf690e0eb460e75f76ba00');
  assert.notEqual(P.stripReviewedP2('ai.js',ai),ai);assert.notEqual(P.stripReviewedP2('main.js',main),main);
  assert.equal(P.stripReviewedP2('economy.js','x'),'x');
});
test('kontrol ve aday aynı geç oyun Save8\'inden 3 ay: her ay Save8 ve RNG birebir; karar çağrıları aynı, gelir hesabı daha az',()=>{
  const dir=controlRoot();try{
    const c=world(dir),a=world(root);c.run(COUNT);a.run(COUNT);
    for(let m=0;m<3;m++){c.run('__step()');a.run('__step()');
      assert.equal(sha(a.run('serialize()')),sha(c.run('serialize()')),'Save8 month '+(m+1));assert.equal(a.run('RND_STATE'),c.run('RND_STATE'),'RNG month '+(m+1));}
    const nc=JSON.parse(c.run('JSON.stringify(__n)')),na=JSON.parse(a.run('JSON.stringify(__n)'));
    for(const k of ['aiBuildingDelta','aiEconomyPlan','queueBuilding','queueShip','aiMove','executeDeal'])assert.equal(na[k],nc[k],k);
    assert(na.empireIncome<nc.empireIncome*.8,'empireIncome '+na.empireIncome+' vs '+nc.empireIncome);
    assert.equal(a.run('AI_INCOME_WINDOW.depth+AI_INCOME_WINDOW.old.size+AI_INCOME_WINDOW.trade.size'),0,'window empty after the month');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('AI penceresi: dışarıda saklama yok; içeride gölge gelir bir kez ve kopya; hata olsa da kapanır',()=>{
  const h=world(root);
  const r=JSON.parse(h.run(`JSON.stringify((()=>{const e=G.emps.find(x=>x.ai&&!x.dead&&x.colonies.length),o=empireIncome;let n=0;empireIncome=function(){n++;return o.apply(this,arguments);};
    const out={};aiShadowIncome(e);aiShadowIncome(e);out.outside=n;n=0;
    const w=aiIncomeWindow(()=>{const x=aiShadowIncome(e),y=aiShadowIncome(e);x.ene=-1e9;const z=aiShadowIncome(e);return {same:x===y,eq:JSON.stringify(y)===JSON.stringify(z),keys:Object.keys(z).join(),ref:JSON.stringify(z)===JSON.stringify(o({...e},false))};});
    Object.assign(out,w());out.inside=n;   /* ref karşılaştırması sarılmamış özgün işlevi çağırır */
    out.after=AI_INCOME_WINDOW.depth+AI_INCOME_WINDOW.old.size;
    try{aiIncomeWindow(()=>{aiShadowIncome(e);throw Error('x');})();}catch{}out.afterThrow=AI_INCOME_WINDOW.depth+AI_INCOME_WINDOW.old.size;
    empireIncome=o;return out;})())`));
  assert.equal(r.outside,2,'outside the window every call recomputes');assert.equal(r.inside,1,'inside: once');
  assert.equal(r.same,false,'a copy is returned');assert.equal(r.eq,true,'caller mutation does not leak');assert.equal(r.keys,'min,ene,yiy,ala,ara,etk,tuk');
  assert.equal(r.ref,true);assert.equal(r.after,0);assert.equal(r.afterThrow,0);
});
test('pencere içi aiBuildingDelta = pencere kapalıyken (federasyon üyesi, her koloni ve bina); liman değişen aday ticaret sonucunu saklamaz',()=>{
  const h=world(root);
  const r=JSON.parse(h.run(`JSON.stringify((()=>{const fed=G.emps.filter(e=>!e.dead&&e.colonies.length&&findFed(e));let n=0,bad=0,port=0;
    for(const e of fed.slice(0,4)){const cols=e.colonies.map(c=>[G.sys[c.s],G.sys[c.s].planets[c.p]]).filter(([s,p])=>p.col&&p.owner===e.id).slice(0,4);
      const keys=['santral','maden','liman','lab','fabrika'];const plain=[];
      for(const [s,p] of cols)for(const k of keys)for(const q of [false,true])plain.push(JSON.stringify(aiBuildingDelta(e,s,p,k,q)));
      const win=aiIncomeWindow(()=>{const o=[];for(const [s,p] of cols)for(const k of keys)for(const q of [false,true]){o.push(JSON.stringify(aiBuildingDelta(e,s,p,k,q)));if(k==='liman'&&AI_INCOME_WINDOW.trade.size)port+=0;}return o;})();
      for(let i=0;i<plain.length;i++){n++;if(plain[i]!==win[i])bad++;}}
    const e=fed[0],[s,p]=[G.sys[e.colonies[0].s],G.sys[e.colonies[0].s].planets[e.colonies[0].p]];
    const onlyPort=aiIncomeWindow(()=>{aiBuildingDelta(e,s,p,'liman');return AI_INCOME_WINDOW.trade.size;})();
    return {fed:fed.length,n,bad,onlyPort};})())`));
  assert(r.fed>0,'federation members in fixture');assert(r.n>=20,'compared '+r.n);assert.equal(r.bad,0);
  assert.equal(r.onlyPort,0,'a port-changing shadow is never stored');
});
test('supplyDistance doğrudan geçit denetimi = gateSupplyNodes listesi (her filo, her sistem; geçit eklenince de)',()=>{
  const h=world(root);
  const r=JSON.parse(h.run(`JSON.stringify((()=>{
    const old=(e,f)=>{const sid=f.sys>=0?f.sys:(f.mv?f.mv.to:-1);if(sid<0)return 0;if(isSupplyNode(e,G.sys[sid]))return 0;const k=gateSupplyNodes(e);
      if(k.length){if(k.indexOf(sid)>=0)return 0;const s0=G.sys[sid];if(s0&&s0.lanes)for(const l of s0.lanes)if(k.indexOf(l)>=0)return 0;}
      const seen=new Set([sid]);let fr=[sid];for(let d=1;d<=SUPPLY_LIMIT+1;d++){const nx=[];for(const id of fr)for(const l of G.sys[id].lanes){if(seen.has(l))continue;seen.add(l);if(isSupplyNode(e,G.sys[l]))return d;nx.push(l);}if(!nx.length)break;fr=nx;}return SUPPLY_LIMIT+2;};
    const run=()=>{let n=0,bad=0;for(const e of G.emps.filter(x=>!x.dead)){for(const f of G.fleets.filter(f=>f.e===e.id)){n++;if(supplyDistance(e,f)!==old(e,f))bad++;}
      for(const s of G.sys){const f={sys:s.id,ships:[{c:'kor'}],e:e.id};n++;if(supplyDistance(e,f)!==old(e,f))bad++;}}return {n,bad};};
    const a=run();let gates=0;for(const s of G.sys)if(s.owner>=0&&s.lanes.length>3&&gates<6){s.built=s.built||{};if(s.built.kapi===undefined){s.built.kapi=s.owner;gates++;}}
    const b=run();return {a,b,gates};})())`));
  assert(r.a.n>300,'compared '+r.a.n);assert.equal(r.a.bad,0);assert(r.gates>0);assert.equal(r.b.bad,0,'with gates');
});
end();
