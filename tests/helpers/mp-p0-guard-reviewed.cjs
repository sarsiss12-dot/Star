'use strict';
/* MP-P0-DESYNC2 geçici AI koruması (MP.8.9b24, yalnız MP kaynakları) koruma adaptörü: hunk'ları TAM METİNLE geri alır (p27 / MP.8.9b23 baytları). Zincirde en yeni adım;
   stripReviewedDesync2 önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-p0-guard-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const {stripReviewedSPMapWar}=require('./sp-map-war0-reviewed.cjs');
exports.stripReviewedGuard=(file,source)=>{source=stripReviewedSPMapWar(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed GUARD source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique GUARD hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p27 restored');return source;};
