// Canonical 96h52 AI review, retained only as an equivalence-test oracle.
function aiReviewAlliances(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    const prof = aiProfile(e);
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id || !e.ally[o.id]) continue;

      let bound = 0;
      if (typeof findFed === 'function'){
        const fe = findFed(e), fo = findFed(o);
        if (fe && fo && fe === fo) bound += 40;
      }
      if (typeof councilExists === 'function' && councilExists() &&
          inCouncil(e) && inCouncil(o)) bound += 15;
      for (const x of G.emps)
        if (!x.dead && !x.wild && x.id !== e.id && x.id !== o.id &&
            e.war[x.id] && aiKnownWar(e,o,x)) bound += 35;

      const strain = (-trustOf(e, o.id)) + (-e.rel[o.id] * .4) - bound + (prof.war - .5) * 20;
      if (strain > 45 && rnd() < .05){
        e.ally[o.id] = false; o.ally[e.id] = false;
        e.rel[o.id] = clamp(e.rel[o.id] - 15, -100, 100);
        o.rel[e.id] = clamp(o.rel[e.id] - 15, -100, 100);
        remember(o, e.id, 'paktBozdu');
        for (const w of G.emps){
          if (w.dead || w.wild || w.id === e.id || w.id === o.id) continue;
          if (rnd() < .5) remember(w, e.id, 'paktBozdu');
        }
        setColdWar(e, o, COLD_WAR_TURNS);
        if (o.id === 0)
          say('İTTİFAK BOZULDU — ' + e.name + ' anlaşmayı feshetti (' +
              COLD_WAR_TURNS + ' tur soğuk savaş)', 'war');
        else if (e.id !== 0)
          say(e.name + ' ile ' + o.name + ' arasındaki ittifak dağıldı');
      }
    }
  }
}

