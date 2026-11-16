'use strict';
/* MP-TECHLUX.0 — tek oyunculu yol ve masa arayüzü.
   S1 tek oyunculu teknoloji maddesi (AI veren / alan) motorun dealQuote → executeDeal yoluyla aynen: kabulde alıcının araştırmasına eklenir
   S2 tek oyunculu lüks mal maddesi aynen: kabulde alıcının luxGrant kaydı veren devlete bağlanır; MEVCUT MOTOR bu kayıttan lüks bonusu üretmez
      (refreshLuxury luxGrant'ı okumaz) — bu fazda değiştirilmedi, açık iş (NF-2b)
   S3 teklif özeti: teknolojinin alıcıya sağladığı (techBenefits) ve erişim koşulu; lüks mal erişiminin motordaki gerçek etkisi
   S4 istihbarat yetmezken "İstiyorum" tarafında düğmenin yanında görünür neden */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
const game=()=>{const h=runtime();h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
  for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=90;}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
  for(const e of G.emps)refreshLuxury(e);var __A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);`);return h;};

test('S1 tek oyunculu teknoloji: AI → oyuncu kabulde araştırmaya eklenir (motor yolu)',()=>{const h=game();
  const r=J(h,`(()=>{const g=__A[0],t0=Object.keys(TECHS).find(t=>!G.p.techs[t]&&!(TECHS[t].requirements||[]).length);if(!t0)return {skip:1};g.techs[t0]=true;   /* fikstür: AI'da oyuncunun bilmediği teknoloji */const t=Object.keys(g.techs).find(t=>!G.p.techs[t]&&researchAccess(G.p,t).ok);
    const o={from:g.id,to:0,give:[{t:'tech',id:t}],want:[],born:G.day,expires:G.day+300};const q=dealQuote(o);const ok=q.ok&&executeDeal(o);return {ok,has:!!G.p.techs[t],still:!!g.techs[t]};})()`);
  assert(!r.skip,'fikstür');assert.equal(r.ok,true);assert.equal(r.has,true);assert.equal(r.still,true);});

test('S2 tek oyunculu lüks mal: kabulde luxGrant kaydı; mevcut motor bu kayıttan lüks bonusu üretmez (değiştirilmedi)',()=>{const h=game();
  const r=J(h,`(()=>{const g=__A.find(o=>Object.keys(o.luxOwn||{}).some(k=>!(G.p.luxOwn||{})[k]));if(!g)return {skip:1};const k=Object.keys(g.luxOwn).find(k=>!(G.p.luxOwn||{})[k]);
    const o={from:g.id,to:0,give:[{t:'lux',k}],want:[],born:G.day,expires:G.day+300};const ok=dealQuote(o).ok&&executeDeal(o);refreshLuxury(G.p);return {ok,grant:G.p.luxGrant[k]===g.id,lux:!!(G.p.luxury||{})[k]};})()`);
  assert(!r.skip,'fikstür');assert.equal(r.ok,true);assert.equal(r.grant,true);assert.equal(r.lux,false,'mevcut motor: erişim kaydı bonus üretmez (NF-2b)');});

test('S3 teklif özeti: teknolojinin sağladığı + erişim koşulu; lüks erişiminin gerçek etkisi',()=>{const h=game();
  const r=J(h,`(()=>{const o=__A[0];const t=Object.keys(TECHS).find(t=>TECHS[t].e&&Object.keys(TECHS[t].e).length&&!G.p.techs[t]);const k=Object.keys(LUXURY)[0];
    return UI.dealTermsHtml({give:[{t:'lux',k}],want:[{t:'tech',id:t}]},G.p,o)+'|'+JSON.stringify(techBenefits(t));})()`);
  const [html,b]=r.split('|');const ben=JSON.parse(b);assert.match(html,/Teknoloji/);assert.match(html,/kabul anında/);assert(ben.effects.length&&html.includes(ben.effects[0].replace(/[<>&]/g,'')),'sağladığı etki satırda');
  assert.match(html,/Lüks mal erişimi/);assert.match(html,/bonus üretmez/);});

test('S4 istihbarat yetmezken "İstiyorum" tarafında görünür neden',()=>{const h=game();
  const r=J(h,`(()=>{const o=__A[0];G.p.intel={};UI.deal={from:0,to:o.id,give:[],want:[]};UI.diploPage='deal';let H='';const r0=UI.renderDiplo;UI.renderDiplo=(h)=>{H=h;};try{UI.drawDeal();}finally{UI.renderDiplo=r0;}return H;})()`);
  assert.match(r,/dealAssetWhy/);assert.match(r,/İZLENİYOR istihbaratı gerekir/);});
test('S5 gelen kutusu kaydı / karşı teklif teknoloji kimliğini korur (encodeOffer): etiket adla, kabul yolu madde geçerli (p36: "✦ ?" ve katalog dışı)',()=>{const h=game();
  const r=J(h,`(()=>{const g=__A[0],t=Object.keys(TECHS).find(t=>!G.p.techs[t]&&!(TECHS[t].requirements||[]).length);g.techs[t]=true;
    const e=encodeOffer({from:g.id,to:0,give:[{t:'tech',id:t}],want:[],born:G.day,expires:G.day+300});const q=dealQuote(e);return {id:e.give[0].id,t,lbl:dealLabel(e.give[0]),ok:q.ok,why:q.reasons};})()`);
  assert.equal(r.id,r.t);assert(!/\?/.test(r.lbl),r.lbl);assert.equal(r.ok,true,JSON.stringify(r.why));});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
