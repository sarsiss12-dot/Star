'use strict';
const assert=require('assert/strict'),path=require('path');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(process.env.STARS_TEST_ROOT||path.join(__dirname,'..'));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+' — '+e.message);}}
function fresh(player=false,onlyWild=false){
 const h=runtime({root:ROOT});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.sb.__target=player?0:3;h.sb.__onlyWild=onlyWild;
 h.run(`var E=G.emps[2],W=G.emps[1],O=G.emps[__target];G.fleets=[];G.day=1000;
 for(const e of G.emps){e.dead=![E,W,O].includes(e)||(e===O&&__onlyWild);e.wild=e===W;
 e.crisisSide=false;e.civics=[];e.race='insan';e.ethics={};e.mizac=e._pers='dengeli';
 e.war={};e.ally={};e.pact={};e.rel={};e.contact={};e.mem={};recalcMods(e);
 for(const o of G.emps){e.contact[o.id]=true;e.rel[o.id]=100;}for(const k in e.res)e.res[k]=1000;}
 E._prof={war:0,exp:.2,sci:.2,eco:1,dip:1,turtle:0};
 var calls=[],offers=[],gate=[],oldNeg=aiNegotiate,oldOffer=UI.aiOffer,oldPact=canPact,oldAlly=canAlly;
 aiNegotiate=function(a,b,g,w,...extra){var r=oldNeg(a,b,g,w,...extra);calls.push({to:b.id,type:g.map(x=>x.t),result:r});return r;};
 UI.aiOffer=function(o){offers.push(o);return oldOffer.call(this,o);};
 canPact=function(a,b){gate.push({t:'pact',to:b.id});return oldPact(a,b);};
 canAlly=function(a,b){gate.push({t:'ally',to:b.id});return oldAlly(a,b);};
 // Deterministic opportunity roll; producers, receiver, quote and commit stay real.
 rnd=()=>.06;`);return h;
}
test('korsan ilk adayken gerçek pakt sonraki normal devlete ulaşır',()=>{
 const h=fresh();h.run('aiTurn(E)');
 assert.equal(h.run('calls.some(x=>x.to===W.id)'),false);
 assert.equal(h.run('calls.some(x=>x.to===O.id&&x.type.includes("pact")&&x.result.uygulandi)'),true);
 assert.equal(h.run('E.pact[O.id]&&O.pact[E.id]'),true);
});
test('korsan ilk adayken gerçek ittifak sonraki normal devlete ulaşır',()=>{
 const h=fresh();h.run('aiTurn(E)');
 assert.equal(h.run('calls.some(x=>x.to===O.id&&x.type.includes("ally")&&x.result.uygulandi)'),true);
 assert.equal(h.run('E.ally[O.id]&&O.ally[E.id]'),true);
});
test('korsan uygunluk ve fırsat kapısından önce elenir',()=>{
 const h=fresh();h.run('aiTurn(E)');assert.equal(h.run('gate.some(x=>x.to===W.id)'),false);
});
test('yalnız korsan varsa sonuçsuz müzakere bile başlatılmaz',()=>{
 const h=fresh(false,true);h.run('aiTurn(E)');assert.equal(h.run('calls.length'),0);
 assert.equal(h.run('gate.some(x=>x.to===W.id)'),false);
});
test('oyuncuya pakt ve ittifak onaya sunulur, otomatik kurulmaz',()=>{
 const h=fresh(true);h.run('aiTurn(E)');
 assert.equal(h.run('offers.some(o=>o.to===0&&o.want.some(x=>x.t==="pact"))'),true);
 assert.equal(h.run('offers.some(o=>o.to===0&&o.want.some(x=>x.t==="ally"))'),true);
 assert.equal(h.run('!!E.pact[0]||!!E.ally[0]'),false);
 assert.equal(h.run('calls.some(x=>x.to===0)'),false);
});
test('kanonik müzakere kapısı korsanı hâlâ mutasyonsuz reddeder',()=>{
 const h=fresh();h.run('var before=serialize(),rng=RND_STATE;var r=oldNeg(E,W,[{t:"pact"}],[])');
 assert.equal(h.run('r.uygulandi'),false);assert.equal(h.run('r.tur'),0);
 assert.equal(h.run('serialize()'),h.run('before'));assert.equal(h.run('RND_STATE'),h.run('rng'));
});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
