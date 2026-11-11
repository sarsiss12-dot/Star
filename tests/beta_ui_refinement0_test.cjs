'use strict';const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');const h=runtime();h.run(`setupGame({...CFG,seed:23,size:'orta',aiCount:5});var s=G.sys[G.p.home],p=s.planets.find(p=>p.col);p.col.q=[{key:'maden',left:10,tot:20}];`);let pass=0,fail=0;function test(n,f){try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+' '+e.message);}}
test('T1 branching choices distinct and delayed',()=>{const x=JSON.parse(h.run('JSON.stringify(CHAINS.grev1.ch.map(c=>UI.choiceExplanation(c)))'));assert.equal(new Set(x).size,3);assert(x.every(s=>/şimdi|aşamada/i.test(s)));});
test('T7 queue key never undefined',()=>{assert(!h.run('ColonyUI.html()').includes('undefined'));});
test('T2 own colony compact',()=>{assert(!h.run('ColonyUI.planet(G.p,s,p)').includes('FETİH / KUŞATMA'));});
test('read only UI',()=>{h.run('var before=serialize(),rng=RND_STATE;ColonyUI.html();ColonyUI.planet(G.p,s,p);ColonyUI.stabilityNote(G.p,s,p);UI.p_sistem();CHAINS.grev1.ch.forEach(c=>UI.choiceExplanation(c));');assert(h.run('serialize()===before&&RND_STATE===rng'));});
console.log(JSON.stringify({pass,fail}));process.exitCode=fail?1:0;
