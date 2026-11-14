'use strict';
/* FIELD-WAR-SIEGE.0 (p32 / MP.8.9b29) koruma adaptörü: yorgunluk kapanışının tek yolu (warExhaustionClose, exhaustion-lock, tek bildirim,
   önizleme yorgunluk tahmini), kuşatmada eski sayaç / bekletilen ordu düzeltmesi + kuşatma durum metni (siegeStatus/siegeStopRows/siegeEndView),
   Bekleyenleri Yeniden Dene (shipmentRetryAll + SEVKİYATLAR bölümü + MP shipmentRetryAll komutu / misafir sarmalayıcı) ve sürüm hunk'larını
   TAM METİNLE geri alır (p31 / MP.8.9b28 baytları, 03a3aa4). Zincirde en yeni adım; stripReviewedWarGoals önce bunu çağırır.
   Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./field-war-siege0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedFieldSiege=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed FIELD-WAR-SIEGE source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique FIELD-WAR-SIEGE hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p31 restored');return source;};
