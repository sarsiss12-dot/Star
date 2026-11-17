'use strict';
/* MP-SYNC-FED.1 (p39 / MP.8.9b38) koruma adaptörü: NF-9 federasyon savunma çağrısı (diplomacy.js fedDefenseCalls, ui.js fedGovernance '🛡 Savunma çağrıları'
   kutusu, mp-core pol.fed.defCalls + p39 paket uyumu, guest-stars fedDefenseCalls / canFedMotion(joinWar) host satırı), mirror.js çatışan yabancı filo
   (combat), sürüm hunk'ları (main BUILD_ID, sw CACHE, view / relay MP sürümü) TAM METİNLE geri alınır (p38 / MP.8.9b37 baytları, 1a6e404).
   Zincirde en yeni adım; stripReviewedSyncFed0 önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-sync-fed1-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedSyncFed1=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-SYNC-FED.1 source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-SYNC-FED.1 hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p38 / MP.8.9b37 restored');return source;};
