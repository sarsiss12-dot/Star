'use strict';
/* MP-DIPLO5 (p38 / MP.8.9b36) koruma adaptörü: NF-2b lüks erişim hakkının ekonomik etkisi (economy.js refreshLuxury → luxGrantApply,
   diplomacy.js luxGrant* / luxChannels, applyItems kabulde yeniden hesap, endTreatiesForWar kancası), NF-3 Casusluk Ağı (savaşta kurulamaz,
   spynetLog / spynetState / spynetPoolView, pooledIntel misafir havuzu), NF-6 Barıştırma (peaceWith cephe + onay, iki aşamalı MP işlemi,
   paket med/link), NF-4 diplomasi kısayolları (ui.js quickTreaty*, mp71-dip mpPendingFind), NF-5 AI warOn kapısı (ai.js aiWarOnGate),
   ui.js teklif özeti satırları, mirror mpLuxGrant / mpPooled / spynetLog, guest-stars köprüleri ve sürüm hunk'larını TAM METİNLE geri alır
   (p37 / MP.8.9b35 baytları, f2e48eb). Zincirde en yeni adım; stripReviewedTechLux önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak
   eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-diplo5-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedDiplo5=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-DIPLO5 source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-DIPLO5 hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p37 restored');return source;};
