'use strict';
/* BETA-FED-FLEET.0 (p28 / MP.8.9b25) koruma adaptörü: federal donanma (tek fon, fondan bakım, federal sipariş, MP fedShip, üyeye fon aynası) ve
   sürüm hunk'larını TAM METİNLE geri alır (p27 / MP.8.9b24 baytları, 43a3612). Önce BETA-GALAXY.0 adımını (beta-galaxy0-reviewed) çağırır; stripReviewedGuard önce bunu çağırır.
   Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./beta-fed-fleet0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedFedFleet=(file,source)=>{source=require('./beta-galaxy0-reviewed.cjs').stripReviewedGalaxy(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed FED-FLEET source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique FED-FLEET hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p27 restored');return source;};
