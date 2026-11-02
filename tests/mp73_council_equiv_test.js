'use strict';
/* MP.7.3 — konsey yamalarının eşdeğerliği (uzun koşu; mp73_council_test.js'ten ayrıldı, run-all süre sınırı için).
   Uzak insan yokken installGuards'ın konsey yamaları (agendaTick, startCouncilVote, councilTick / joinCouncil sarmalı,
   finishCouncilVote, claimPermanent, bribeVote / blackmailVote, playerRevolt / playerWhisper) tek oyunculuyla aynı: Save8 ve RNG birebir. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();if(typeof MP!=="undefined"&&MP.observeHumans)MP.observeHumans();}}}';
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const DAYS=Number(process.env.MP73_EQUIV_DAYS)||9000;
test('konsey eşdeğerliği: uzak insan yokken yamalı konsey motoru (gündem, kampanya, oylama, otomatik katılım) '+Math.round(DAYS/360)+' yıl tek oyunculuyla aynı: Save8 ve RNG birebir',()=>{
  const mk=guard=>{const h=runtime({root});h.run(CORE);h.run(`${STEP}setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;${guard?"var MP=StarsMP.createHost({roomId:'q',random:()=>'ab',send(){},kick(){}});MP.installGuards();":''}`);return h;};
  const a=mk(true),b=mk(false);const t0=Date.now();a.run(`step(${DAYS})`);const t1=Date.now();b.run(`step(${DAYS})`);
  console.log('  süre: kollar '+(t1-t0)+' / '+(Date.now()-t1)+' ms; konsey kuruldu: '+J(a,'!!G.council')+'; yasa sayısı: '+J(a,'G.council?(G.council.laws||[]).length:0'));
  assert(J(a,'!!G.council'),'council formed during the run');assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
});
end();
