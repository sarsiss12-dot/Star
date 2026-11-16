'use strict';
/* MP-TECHLUX.0 (p37 / MP.8.9b35) koruma adaptörü: Genel Savaş Sözü son tarih kuralı (warPledgeLeft / warPledgeInTime / warPledgeExpire /
   warPledgeStartedInTime; savaş ilanı kancası ve ay başı denetimi aynı kural), Teknoloji + Lüks Mal çok oyunculu müzakere (mp-core tech / lux
   maddeleri, dipAssetGate İZLENİYOR şartı teklif + karşı teklif + kabulde, dipAssetIssue süpürmesi, salt okunur dealAssets), main.js encodeOffer
   teknoloji kimliği (metin), ui.js teklif özeti dealAssetTermsRow + görünür istihbarat nedeni + son gün metni, mirror luxGrant (π) ve gezegen lux
   alanı, guest-stars / mp71-dip gönderim ve "İstiyorum" listesi, sürüm hunk'larını TAM METİNLE geri alır (p36 / MP.8.9b34 baytları, 81f5029).
   Zincirde en yeni adım; stripReviewedWarOn önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-techlux0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedTechLux=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-TECHLUX source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-TECHLUX hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p36 restored');return source;};
