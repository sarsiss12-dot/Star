'use strict';
// Exact snapshot comparison. No cache stripping, canonicalization or serializer changes.
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict');
const [aFile,bFile,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const read=f=>JSON.parse(zlib.gunzipSync(fs.readFileSync(f))),a=read(aFile),b=read(bFile);
function diff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return [];if(!a||!b||typeof a!=='object'||typeof b!=='object')return [{path:p,a,b}];return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p+'/'+k));}
function category(p){if(/^\/(rs|day|month|year)$/.test(p))return 'rng-time';if(/^\/emps\/\d+\/_/.test(p))return 'cache-derived';if(/^\/viewPrefs\//.test(p))return 'ui-presentation';if(/^\/(fl|sys)\//.test(p)||/^\/emps\/\d+\/(colonies|techs|research)/.test(p))return 'fleet-colony-tech';if(/^\/(commerce|economyHistory|diplomaticInbox)\//.test(p)||/^\/emps\/\d+\/(res|inc|war|rel|ally)/.test(p))return 'economy-diplomacy';return 'canonical-game';}
assert.equal(a.rows.length,8);assert.equal(b.rows.length,8);assert.equal(a.meta.mode,b.meta.mode);
const rows=a.rows.map((x,i)=>{const y=b.rows[i],d=diff(JSON.parse(x.save),JSON.parse(y.save)).map(r=>({...r,category:category(r.path)}));return {step:i+1,shaEqual:x.sha===y.sha,rngEqual:x.rng===y.rng,mirrorEqual:x.mirror===y.mirror,diff:d};});
const first=rows.find(r=>!r.shaEqual);if(first){fs.writeFileSync(path.join(out,'first-a.save'),a.rows[first.step-1].save);fs.writeFileSync(path.join(out,'first-b.save'),b.rows[first.step-1].save);}
const report={mode:a.meta.mode,firstDifferent:first?.step??null,rows,categories:Object.fromEntries(['canonical-game','economy-diplomacy','fleet-colony-tech','rng-time','ui-presentation','cache-derived','async-external'].map(k=>[k,rows.flatMap(r=>r.diff).filter(r=>r.category===k).length]))};
fs.writeFileSync(path.join(out,'field-comparison.json'),JSON.stringify(report,null,2));
assert(rows.every(r=>r.rngEqual&&r.mirrorEqual),'RNG or exact mirror differs');
if(a.meta.mode==='settled')assert(rows.every(r=>r.shaEqual),'full settled Save8 bytes differ');
console.log(JSON.stringify({mode:report.mode,firstDifferent:report.firstDifferent,categories:report.categories,allRngAndMirrorEqual:true,fullHostBytesEqual:rows.every(r=>r.shaEqual)}));
