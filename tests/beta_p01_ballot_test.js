'use strict';
const assert=require('assert/strict'),{fresh}=require('./helpers/dispatch-fixture');let pass=0,fail=0;
function test(n,f){try{f();pass++;console.log('PASS '+n)}catch(e){fail++;console.log('FAIL '+n+' '+e.stack)}}
function world(){const h=fresh(0,process.env.STARS_CONTROL_ROOT||undefined);h.run(`G.council={name:'Test',members:[0,1],laws:{},targeted:{},treasury:0,president:0,terms:{},voteIn:12,dead:false,vote:{key:'ticaretStd',target:null,yes:[],no:[],speeches:[],done:false,age:0,sponsor:null,opened:G.day}};UI.openCouncil();var voteRef=G.council.vote;`);return h;}
test('SP aynı insanın oyu iki kez listeye yazılamaz',()=>{const h=world();h.run("UI.act('cncYes');UI.act('cncYes')");assert.equal(h.run('voteRef.yes.filter(x=>x===G.p.id).length'),1);});
test('eski Konsey düğmesi aynı kanunun yeni oylamasına oy veremez',()=>{const h=world();h.run("var oldToken=typeof councilVoteToken==='function'?councilVoteToken(G.council.vote):'ticaretStd:';G.council.vote.opened+=30;UI.act('cncYes',oldToken)");assert.equal(h.run('G.council.vote.yes.length'),0);});
test('sonuçlanmış oylamada düğme pasif; ikinci dokunma panel değiştirmez',()=>{const h=world();h.run("UI.act('cncNo');UI.openDiplo();UI.act('cncNo')");assert.equal(h.run("$('diploPane')._surfaceKey.startsWith('diplo:')"),true);assert.equal(h.run('voteRef.no.length'),1);});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
