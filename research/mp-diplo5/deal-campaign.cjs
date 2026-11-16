'use strict';
/* MP-DIPLO5 — doğal kampanyada anlaşma / diplomasi sayacı (kontrol ve aday aynı tohum / ayar).
   Kullanım: node research/mp-diplo5/deal-campaign.cjs <kök> <tohum> <ay> [boyut] [aiSayısı]
   Sayar (salt okunur sarmalayıcılar; RNG çekmez, dünyaya yazmaz): executeDeal başarı/başarısızlık madde türüne göre, AI–AI peaceWith
   teklifleri (dealQuote ok / ret), warJoin / warOn, vasallık / koruma (vassalOffer / seekProtection / subjugate…), aylık Save8 SHA. */
const path=require('path'),crypto=require('crypto'),{runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed='11',months='120',size='orta',ai='6']=process.argv.slice(2);
const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'${size}',aiCount:${+ai}});setupGame({...CFG});G.autoSave=false;
var __C={deals:{},fail:{},pwQuote:{ok:0,no:0,why:{}},calls:{}};var __kinds=o=>[...new Set([...(o.give||[]),...(o.want||[])].map(i=>i&&i.t))].sort().join('+');
var __ex=executeDeal;executeDeal=function(o,...a){const r=__ex.call(this,o,...a);const k=__kinds(o||{});(r?__C.deals:__C.fail)[k]=((r?__C.deals:__C.fail)[k]||0)+1;return r;};
var __dq=dealQuote;dealQuote=function(o,...a){const q=__dq.call(this,o,...a);if(o&&[...(o.give||[]),...(o.want||[])].some(i=>i&&i.t==='peaceWith')){if(q.ok)__C.pwQuote.ok++;else{__C.pwQuote.no++;const w=String((q.reasons||[])[0]||'').replace(/[A-ZÇĞİÖŞÜ][\\wçğıöşü' -]* (şu an|\\(insan)/,'X $1').slice(0,60);__C.pwQuote.why[w]=(__C.pwQuote.why[w]||0)+1;}}return q;};
for(const f of ['vassalOffer','seekProtection','subjugate','warJoinApply','declareWar','makePeace','aiFedDefend','fedDefend','warPrepareAccept'])if(typeof globalThis[f]==='function'){const o0=globalThis[f];globalThis[f]=function(...a){__C.calls[f]=(__C.calls[f]||0)+1;return o0.apply(this,a);};}
var __step=()=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+1&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`);
const shas=[];for(let m=1;m<=+months;m++){h.run('__step()');if(m%12===0)shas.push(crypto.createHash('sha256').update(h.run('serialize()')).digest('hex').slice(0,16));}
const C=JSON.parse(h.run('JSON.stringify(__C)'));
const vas=JSON.parse(h.run('JSON.stringify(G.emps.filter(e=>!e.wild).map(e=>({id:e.id,dead:!!e.dead,ov:e.overlord??null,vt:e.vassalType||null})))'));
console.log(JSON.stringify({root:path.basename(path.resolve(root)),seed:+seed,months:+months,size,ai:+ai,...C,vassals:vas.filter(v=>v.ov!==null).length,shas}));
