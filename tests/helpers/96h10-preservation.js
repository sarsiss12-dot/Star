'use strict';
const assert=require('assert/strict');
// 96H.10 reviewed army-safety change. Each entry is [current, 96H.9] text,
// stripped in reverse order; stripping restores the exact 96H.9 ai.js bytes.
const blocks=[
["/* ═══ 96H.10: KARA ORDUSU GÜVENLİĞİ ═══\n   Silahsız taarruz ordusu, görünür düşman savaş gücünün oradaki ya da\n   oraya giden kendi savaş filolarını (savunma ayırmasının 1,15 payıyla)\n   aştığı bir sisteme gönderilmez. Ölçüm (96H.9): ordu kayıplarının çoğu,\n   düşman filosunun tuttuğu kendi kolonisine tek tek yollanıp varışta\n   uzay muharebesinde ölen ordulardı. Yalnız görünür bilgi; RNG yok. */\nfunction aiArmySafe(e,sysId){\n  const tehdit=aiObservedThreat(e,sysId,false);if(tehdit<=0)return true;\n  let guc=0;\n  for(const f of G.fleets)if(f.e===e.id&&f.ships.length&&isArmed(f)&&((f.mv?f.mv.to:f.sys)===sysId||f.path.length&&f.path[f.path.length-1]===sysId))guc+=fleetPower(f);\n  return guc>=tehdit*1.15;\n}\nfunction aiArmyTick(){\n  if (typeof isTransport !== 'function') return;\n  for (const e of G.emps){\n    if (e.dead || e.wild || !e.ai) continue;\n\n    const guvenliMi = new Map();\n    const guvenli = id => { if (!guvenliMi.has(id)) guvenliMi.set(id, aiArmySafe(e, id)); return guvenliMi.get(id); };\n    const dusmanVar = sy => sy.planets.some(pl => pl.col && pl.owner >= 0 && pl.owner !== e.id &&\n      (e.war[pl.owner] || (G.emps[pl.owner] && G.emps[pl.owner].wild)));\n    /* 96H.10: yoldaki ordu da yeniden değerlendirilir — ama yalnız hedefi\n       artık güvenli değilse ya da yabancı hedefte savaşta olunan düşman\n       kolonisi kalmadıysa (ele geçirildi, savaş bitti). Ortak sefer ve\n       teslimat emirlerine dokunulmaz; geçerli emir yeniden verilmez. */\n    const varisOf = f => f.path && f.path.length ? f.path[f.path.length - 1] : (f.mv ? f.mv.to : f.sys);\n    const bayat = f => {\n      if (!(f.mv || (f.path && f.path.length)) || jointReserved(f) || hasShipment(f)) return false;\n      const sy = G.sys[varisOf(f)];\n      return !!sy && (!guvenli(sy.id) || (sy.owner !== e.id && !dusmanVar(sy) &&\n        !sy.planets.some(pl => pl.col && pl.owner === e.id)));\n    };\n    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&\n      isTransport(f) && (!f.mv && (!f.path || !f.path.length) || bayat(f)));\n    if (!ordular.length) continue;\n",
"function aiArmyTick(){\n  if (typeof isTransport !== 'function') return;\n  for (const e of G.emps){\n    if (e.dead || e.wild || !e.ai) continue;\n\n    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&\n      isTransport(f) && !f.mv && (!f.path || !f.path.length));\n    if (!ordular.length) continue;\n"],
["          if (guc < (sy.def || 0) * .8) continue;\n          if (!guvenli(sy.id)) continue;            // 96H.10\n",
"          if (guc < (sy.def || 0) * .8) continue;\n"],
["          if (!komsuDusman) continue;\n          if (!guvenli(sy.id)) continue;            // 96H.10\n",
"          if (!komsuDusman) continue;\n"],
["          if (!pl || !pl.col) continue;\n          if (!guvenli(sy.id)) continue;            // 96H.10\n          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;",
"          if (!pl || !pl.col) continue;\n          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;"],
["      if (hedef && hedef.id !== varisOf(ordu) && typeof orderMove === 'function'){",
"      if (hedef && hedef.id !== ordu.sys && typeof orderMove === 'function'){"]
];
exports.reviewedH10Blocks=blocks.map(([current])=>current);
exports.stripReviewedH10=source=>{
 if(!source.includes('function aiArmySafe('))return source;
 for(const [current,legacy]of blocks.slice().reverse()){assert.equal(source.split(current).length,2,'one reviewed 96H.10 block');source=source.replace(current,legacy);}
 return source;
};
