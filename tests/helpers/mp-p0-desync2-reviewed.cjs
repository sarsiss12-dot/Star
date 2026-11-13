'use strict';
/* MP-P0-DESYNC2 (p27: p26 + BETA-MOBILE-HUD.0 kaynağı) koruma adaptörü: p27 hunk'larını TAM METİNLE geri alır (p26 kaynak baytları). Önce geçici AI koruması
   adımını (mp-p0-guard-reviewed) çağırır; stripReviewedDesync1 önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-p0-desync2-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedDesync2=(file,source)=>{source=require('./mp-p0-guard-reviewed.cjs').stripReviewedGuard(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed DESYNC2 source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique DESYNC2 hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p26 restored');return source;};
