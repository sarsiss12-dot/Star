import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""function aiArmyTick(){
  if (typeof isTransport !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&
      isTransport(f) && !f.mv && (!f.path || !f.path.length));
    if (!ordular.length) continue;
""","""/* ═══ 96H.10: KARA ORDUSU GÜVENLİĞİ ═══
   Silahsız taarruz ordusu, görünür düşman savaş gücünün oradaki ya da
   oraya giden kendi savaş filolarını (savunma ayırmasının 1,15 payıyla)
   aştığı bir sisteme gönderilmez. Ölçüm (96H.9): ordu kayıplarının çoğu,
   düşman filosunun tuttuğu kendi kolonisine tek tek yollanıp varışta
   uzay muharebesinde ölen ordulardı. Yalnız görünür bilgi; RNG yok. */
function aiArmySafe(e,sysId){
  const tehdit=aiObservedThreat(e,sysId,false);if(tehdit<=0)return true;
  let guc=0;
  for(const f of G.fleets)if(f.e===e.id&&f.ships.length&&isArmed(f)&&((f.mv?f.mv.to:f.sys)===sysId||f.path.length&&f.path[f.path.length-1]===sysId))guc+=fleetPower(f);
  return guc>=tehdit*1.15;
}
function aiArmyTick(){
  if (typeof isTransport !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const guvenliMi = new Map();
    const guvenli = id => { if (!guvenliMi.has(id)) guvenliMi.set(id, aiArmySafe(e, id)); return guvenliMi.get(id); };
    const dusmanVar = sy => sy.planets.some(pl => pl.col && pl.owner >= 0 && pl.owner !== e.id &&
      (e.war[pl.owner] || (G.emps[pl.owner] && G.emps[pl.owner].wild)));
    /* 96H.10: yoldaki ordu da yeniden değerlendirilir — ama yalnız hedefi
       artık güvenli değilse ya da yabancı hedefte savaşta olunan düşman
       kolonisi kalmadıysa (ele geçirildi, savaş bitti). Ortak sefer ve
       teslimat emirlerine dokunulmaz; geçerli emir yeniden verilmez. */
    const varisOf = f => f.path && f.path.length ? f.path[f.path.length - 1] : (f.mv ? f.mv.to : f.sys);
    const bayat = f => {
      if (!(f.mv || (f.path && f.path.length)) || jointReserved(f) || hasShipment(f)) return false;
      const sy = G.sys[varisOf(f)];
      return !!sy && (!guvenli(sy.id) || (sy.owner !== e.id && !dusmanVar(sy) &&
        !sy.planets.some(pl => pl.col && pl.owner === e.id)));
    };
    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&
      isTransport(f) && (!f.mv && (!f.path || !f.path.length) || bayat(f)));
    if (!ordular.length) continue;
""")
rep("""          if (guc < (sy.def || 0) * .8) continue;
""","""          if (guc < (sy.def || 0) * .8) continue;
          if (!guvenli(sy.id)) continue;            // 96H.10
""")
rep("""          if (!komsuDusman) continue;
""","""          if (!komsuDusman) continue;
          if (!guvenli(sy.id)) continue;            // 96H.10
""")
rep("""          if (!pl || !pl.col) continue;
          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;""","""          if (!pl || !pl.col) continue;
          if (!guvenli(sy.id)) continue;            // 96H.10
          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;""")
rep("""      if (hedef && hedef.id !== ordu.sys && typeof orderMove === 'function'){""","""      if (hedef && hedef.id !== varisOf(ordu) && typeof orderMove === 'function'){""")
open(p,'w',encoding='utf8').write(s)
