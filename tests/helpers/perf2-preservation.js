'use strict';
const assert=require('assert/strict');
// PERF.2 reviewed performance change. Each entry is [current, MP.7.5 (96h10p4)] text; stripping restores the exact
// pre-PERF.2 bytes of ai.js (read-only AI evaluation window: shadow income / fresh trade reuse) and main.js (direct gate
// check in supplyDistance). Behaviour equivalence is proven separately (byte-identical Save8/RNG, research/perf2).
const ai=[
[
"/* PERF.2 A: okuma-yalnız AI değerlendirme penceresi. Aşağıdaki işlevlerin en dış çağrısı süresince\n   dünya değişmez (yalnız eşzamanlı geri yüklenen gölge koloniler). Bu sürede devletin değişmemiş\n   gölge geliri ve liman sayısı değişmeyen gölgenin taze ticaret sonucu devlet başına bir kez\n   hesaplanır. Pencere bitince atılır; Save8'e girmez, RNG kullanmaz, pencere dışında davranış aynen. */\nconst AI_INCOME_WINDOW={depth:0,old:new Map(),trade:new Map()};\nfunction aiIncomeWindow(fn){\n const W=AI_INCOME_WINDOW;\n return function(){if(W.depth++===0){W.old.clear();W.trade.clear();}try{return fn.apply(this,arguments);}finally{if(--W.depth===0){W.old.clear();W.trade.clear();}}};\n}\nfunction aiShadowIncome(e){\n const W=AI_INCOME_WINDOW;if(!W.depth)return empireIncome({...e},false);\n let v=W.old.get(e);if(!v){v=empireIncome({...e},false);W.old.set(e,v);}return {...v};\n}\n/* END PERF.2 A WINDOW */\n",
""
],
[
"  const original=pl.col,old=aiShadowIncome(e);let next;\n  const W=AI_INCOME_WINDOW,same=W.depth>0&&(b.liman||0)===(pl.col.b.liman||0),tr=same?W.trade.get(e):null;\n  try{pl.col={...original,b};const sh=tr?{...e,_trAt:tr.at,_trCache:tr.cache,_trSig:tr.sig}:{...e,_trAt:-1,_trCache:null};next=empireIncome(sh,false);if(same&&!tr)W.trade.set(e,{at:sh._trAt,cache:sh._trCache,sig:sh._trSig});}\n  finally{pl.col=original;}\n",
"  const original=pl.col,old=empireIncome({...e},false);let next;\n  try{pl.col={...original,b};next=empireIncome({...e,_trAt:-1,_trCache:null},false);}\n  finally{pl.col=original;}\n"
],
[
" const income=Math.floor(e.aiFedReview?.day/30)===Math.floor(G.day/30)?aiShadowIncome(e):e.inc;\n",
" const income=Math.floor(e.aiFedReview?.day/30)===Math.floor(G.day/30)?empireIncome({...e},false):e.inc;\n"
],
[
"old=aiFedBudget(e,aiShadowIncome(e)).net,restore=[];",
"old=aiFedBudget(e,empireIncome({...e},false)).net,restore=[];"
],
[
"/* PERF.2 A: pencere işlevleri (en dış çağrı pencereyi açar/kapatır). */\naiEconomyPlan=aiIncomeWindow(aiEconomyPlan);aiEconomicOrder=aiIncomeWindow(aiEconomicOrder);aiDemolitionChoice=aiIncomeWindow(aiDemolitionChoice);\naiStrategicBuildingNeeds=aiIncomeWindow(aiStrategicBuildingNeeds);aiColonyForecast=aiIncomeWindow(aiColonyForecast);aiRecoveryInvestment=aiIncomeWindow(aiRecoveryInvestment);\n/* END PERF.2 A WRAP */\n",
""
]
];
const main=[
[
"  /* PERF.2 B: gateSupplyNodes listesinin üyeliği = hasUsableGate (saf); tüm galaksiyi taramadan aynı denetim. */\n  {\n    if (hasUsableGate(e, G.sys[sid])) return 0;\n    /* Geçide komşuysak da ağa bağlıyız sayılır (1 atlama) */\n    const sy0 = G.sys[sid];\n    if (sy0 && sy0.lanes)\n      for (const l of sy0.lanes) if (hasUsableGate(e, G.sys[l])) return 0;\n  }\n  /* END PERF.2 B */\n",
"  const kapilar = gateSupplyNodes(e);\n  if (kapilar.length){\n    if (kapilar.indexOf(sid) >= 0) return 0;\n    /* Geçide komşuysak da ağa bağlıyız sayılır (1 atlama) */\n    const sy0 = G.sys[sid];\n    if (sy0 && sy0.lanes)\n      for (const l of sy0.lanes) if (kapilar.indexOf(l) >= 0) return 0;\n  }\n"
]
];
function strip(source,blocks,marker,label){
 if(!source.includes(marker))return source;
 for(const [current,legacy]of blocks.slice().reverse()){assert.equal(source.split(current).length,2,'one reviewed PERF.2 block: '+label);source=source.replace(current,legacy);}
 return source;
}
exports.reviewedP2Blocks={ai:ai.map(([c])=>c),main:main.map(([c])=>c)};
exports.stripReviewedP2Ai=source=>strip(source,ai,'/* END PERF.2 A WINDOW */','ai.js');
exports.stripReviewedP2Main=source=>strip(source,main,'/* END PERF.2 B */','main.js');
exports.stripReviewedP2=(name,source)=>name==='ai.js'?exports.stripReviewedP2Ai(source):name==='main.js'?exports.stripReviewedP2Main(source):source;
