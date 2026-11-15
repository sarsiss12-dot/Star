'use strict';
/* MP-FIELD-VERIFY.0 (p34 / MP.8.9b32) koruma adaptörü: misafir komutu kapalı / kapanan sokette artık sessizce "gönderildi" sayılmaz (join.js J.cmd,
   aynı cid ile yeniden gönderim), misafir anlaşma teklifi tek işlem (taslak host yanıtına kadar korunur, yanıtsız teklif aynı cid ile yeniden gider,
   ret / bağlantı hatasında taslak düzenlenebilir; guest-stars.js) ve MP sürüm hunk'larını TAM METİNLE geri alır (p34 / MP.8.9b31 baytları, 0ec6017).
   Zincirde en yeni adım; stripReviewedFieldFix önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-field-verify0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedFieldVerify=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-FIELD-VERIFY source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-FIELD-VERIFY hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p34 restored');return source;};
