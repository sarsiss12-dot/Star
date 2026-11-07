function supplyDistance(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return 0;
  if (isSupplyNode(e, G.sys[sid])) return 0;
  /* FAZ 63: geçit varsa mesafe sıfır — ağ tek nokta gibi davranır */
  /* PERF.2 B: gateSupplyNodes listesinin üyeliği = hasUsableGate (saf); tüm galaksiyi taramadan aynı denetim. */
  {
    if (hasUsableGate(e, G.sys[sid])) return 0;
    /* Geçide komşuysak da ağa bağlıyız sayılır (1 atlama) */
    const sy0 = G.sys[sid];
    if (sy0 && sy0.lanes)
      for (const l of sy0.lanes) if (hasUsableGate(e, G.sys[l])) return 0;
  }
  /* END PERF.2 B */
  const gorulen = new Set([sid]);
  let sinir = [sid];
  for (let d = 1; d <= SUPPLY_LIMIT + 1; d++){
    const sonraki = [];
    for (const id of sinir){
      for (const l of G.sys[id].lanes){
        if (gorulen.has(l)) continue;
        gorulen.add(l);
        if (isSupplyNode(e, G.sys[l])) return d;
        sonraki.push(l);
      }
    }
    if (!sonraki.length) break;
    sinir = sonraki;
  }
  return SUPPLY_LIMIT + 2;
}
function fleetSupply(e, f){
  if (!f || !f.ships || !f.ships.length) return 1;
  /* ═══ FAZ 59: LOJİSTİK HACK ═══
     Hacklenmiş sistemdeki filo tedarik tabanına düşer — hattın
     içinde olsa bile ikmal alamaz. */
  const bs = f.sys >= 0 ? G.sys[f.sys] : null;
  if (bs && bs.supplyHack && bs.supplyHack > (G.memAge || 0) &&
      bs.supplyHackBy !== f.e)
    return SUPPLY_FLOOR;
  const d = supplyDistance(e, f);
  if (d <= SUPPLY_FREE) return 1;
  /* ═══ FAZ 54: KADEMELİ CEZA ═══
     Eski formül SUPPLY_LIMIT'te sıfıra iniyordu — filo tamamen
     işlevsiz kalıyordu. Artık atlama başına −%15, taban %40:
     uzaktaki ordu zayıflar ama savaşamaz hâle gelmez.
       2 atlama → %100 · 3 → %85 · 4 → %70 · 5 → %55 · 6+ → %40 */
  const asim = d - SUPPLY_FREE;
  return clamp(1 - asim * SUPPLY_STEP, SUPPLY_FLOOR, 1);
}
function explorationContext(e){
  const known=new Set(),visible=new Set(),blocked=reinforcementThreats(e),pirates=new Set();
  // Aynı sensör menzili; görülmeyen düşman filoları veya yuvalar okunmaz.
  const q=[];
  for(const s of G.sys)if(s.owner===e.id)q.push([s.id,0]);
  for(const f of G.fleets)if(f.e===e.id&&f.sys>=0&&f.ships.length)q.push([f.sys,0]);
  if(hasCivic(e,'panopt'))for(const s of G.sys)q.push([s.id,0]);
  const depth=new Map(),range=1+(e.mods.sensor|0);
  for(let i=0;i<q.length;i++){
    const [id,d]=q[i],s=G.sys[id];
    if(!s || depth.has(id)&&depth.get(id)<=d)continue;
    depth.set(id,d);visible.add(id);
    if(d<range&&!s.nebulaS)for(const n of s.lanes)q.push([n,d+1]);
  }
  for(const s of G.sys){
    if((e.id===0?pSeen(s):s.seen.includes(e.id)) || visible.has(s.id) || e.id===0&&pVis(s))known.add(s.id);
  }
  for(const id of known){const s=G.sys[id];
    if(s.nest||s.ruin){blocked.add(id);pirates.add(id);}
    const owner=s.owner>=0?s.owner:claimOf(s);
    if(owner>=0&&owner!==e.id&&hostile(e.id,owner))blocked.add(id);
  }
  for(const f of G.fleets)if(f.e!==e.id&&f.sys>=0&&visible.has(f.sys)&&f.ships.length&&isArmed(f)&&hostile(e.id,f.e))blocked.add(f.sys);
  // Bilinen düğümün komşusu keşif sınırıdır; gizli düğümler üzerinden
  // kestirme veya bilinmeyen yıldız kapısı zinciri kullanılmaz.
  const frontier=new Set(known);
  for(const id of known)for(const n of G.sys[id].lanes)frontier.add(n);
  const gates=[...known].filter(id=>hasUsableGate(e,G.sys[id]));
  return {known,visible,frontier,blocked,pirates,gates,supply:new Map()};
}
function explorationBlock(e,f,id,ctx,from){
  if(!G.sys[id]||!ctx.frontier.has(id))return 'route';
  if(ctx.blocked.has(id))return ctx.pirates.has(id)?'pirate':'threat';
  if(from!==undefined && !pathAllowed(e,f,[id],from))return 'route';
  if(!isArmed(f)){
    if(!ctx.supply.has(id))ctx.supply.set(id,fleetSupply(e,{sys:id,ships:f.ships,e:f.e}));
    if(ctx.supply.get(id)<=SUPPLY_FLOOR+.015)return 'supply';
  }
  return '';
}
