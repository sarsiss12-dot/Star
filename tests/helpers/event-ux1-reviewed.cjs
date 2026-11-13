'use strict';
/* BETA-EVENT-UX.1 (p25) koruma adaptörü: p25 hunk'larını TAM METİNLE geri alır (p24 kaynak baytları). Önce MP-P0-DESYNC1 (p26)
   adımını çağırır; stripReviewedEventUx0 önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./beta-event-ux1-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedEventUx1=(file,source)=>{source=require('./mp-p0-desync1-reviewed.cjs').stripReviewedDesync1(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed EVENT-UX.1 source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique EVENT-UX.1 hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p24 restored');return source;};
