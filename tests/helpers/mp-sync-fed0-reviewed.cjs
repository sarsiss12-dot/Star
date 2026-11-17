'use strict';
/* MP-SYNC-FED.0 (p38 / MP.8.9b37) koruma adaptörü: S1 Barıştırma son onayı (mp-core peaceWithClose / peaceWithFinalGate; respond, peaceWithLinkReply,
   dipSweep dalları), S2 misafir eşitleme notunun pencere üstü hapa gitmesi (guest-stars chip) ve sürüm işareti (view.js / relay.js) hunk'larını TAM METİNLE
   geri alır (p38 / MP.8.9b36 baytları, 0ecb080). stripReviewedDiplo5 önce bunu çağırır; bu da önce stripReviewedSyncFed1 (MP-SYNC-FED.1) çağırır. Hash gevşetilmez: tanınmayan kaynak eski
   incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-sync-fed0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedSyncFed0=(file,source)=>{source=require('./mp-sync-fed1-reviewed.cjs').stripReviewedSyncFed1(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-SYNC-FED.0 source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-SYNC-FED.0 hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p38 restored');return source;};
