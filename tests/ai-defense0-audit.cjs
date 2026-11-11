'use strict';
// Verifies evidence, source isolation and a byte-identical unobserved replay.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const out=process.env.STARS_OUTPUT||'/tmp/defense0-audit',base='d8e1d250b69f17a68469462db3b1b987cc83b7b0',manifest=JSON.parse(fs.readFileSync('RELEASE-MANIFEST.json','utf8'));fs.mkdirSync(out,{recursive:true});
const files=[...Object.keys(manifest.files),'RELEASE-MANIFEST.json','research/mp0/mp-core.js','research/mp1/server/relay.js','research/mp1/client/view.js','research/mp6/mirror.js','research/mp6/client/guest-stars.js'];
const hashes={};for(const f of files){const b=fs.readFileSync(f),control=cp.execFileSync('git',['show',base+':'+f],{maxBuffer:16*1024*1024});assert(b.equals(control),f+' production unchanged');hashes[f]=crypto.createHash('sha256').update(b).digest('hex');}
const h=runtime(),raw=fs.readFileSync('/tmp/aiq0-saves/p23-404-60-ulu-9-final.sav','utf8');h.sb.raw=raw;assert(h.run('deserialize(raw)'));h.run('G.autoSave=false;');
for(let m=1;m<=60;m++){h.run('for(let i=0;i<60;i++){var d=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>d)monthTick();}');
 if(m===60){const p='reports/codex/evidence/beta-ai-defense0/combat-replay/base.json',observed=JSON.parse(fs.existsSync(p)?fs.readFileSync(p,'utf8'):require('zlib').gunzipSync(fs.readFileSync(p+'.gz')).toString());assert.equal(h.run('RND_STATE'),observed.summary.rng);}
}
const saved=h.run('serialize()'),observedSave=fs.readFileSync(process.env.DEFENSE_OBSERVED_SAVE||'/tmp/defense0-pure-finals/base-final.sav','utf8');
const equal=saved===observedSave; // Failure is retained: caches/observer reads must be reported, never normalized.
const differences=[];function diff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],p+'.'+k);}else if(differences.length<100)differences.push({path:p,unobserved:a,observed:b});}if(!equal)diff(JSON.parse(saved),JSON.parse(observedSave));
const result={build:manifest.build,productionUnchanged:true,hashes,unobservedSHA:crypto.createHash('sha256').update(saved).digest('hex'),observedSHA:crypto.createHash('sha256').update(observedSave).digest('hex'),rawSaveEqual:equal,rngEqual:true,differences};fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(result,null,2));assert(equal,'unobserved60-month Save8 must equal observed control exactly');console.log('PASS all production+MP bytes unchanged /60months raw Save8 and RNG equal with and without observer');
