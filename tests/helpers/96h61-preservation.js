'use strict';
const assert=require('assert/strict'),{createHash}=require('crypto');
exports.stripReviewedH61=source=>{
 const start=source.indexOf('/* Normal bilateral withdrawal.'),end=source.indexOf('function aiReviewAlliances(){',start),block=source.slice(start,end);
 assert.equal(createHash('sha256').update(block).digest('hex'),"7e6a5c6abc026bef2b6dfdcb0a2f05c70b9aa970810c3fd2e8810c563c0ef74a",'exact reviewed H61 alliance helper');
 source=source.slice(0,start)+source.slice(end);
 const call='        applyAllianceEnd(e,o);\n';assert.equal(source.split(call).length,2,'one reviewed AI delegation');
 return source.replace(call,"        e.ally[o.id] = false; o.ally[e.id] = false;\n        e.rel[o.id] = clamp(e.rel[o.id] - 15, -100, 100);\n        o.rel[e.id] = clamp(o.rel[e.id] - 15, -100, 100);\n        remember(o, e.id, 'paktBozdu');\n        for (const w of G.emps){\n          if (w.dead || w.wild || w.id === e.id || w.id === o.id) continue;\n          if (rnd() < .5) remember(w, e.id, 'paktBozdu');\n        }\n        setColdWar(e, o, COLD_WAR_TURNS);\n");
};
