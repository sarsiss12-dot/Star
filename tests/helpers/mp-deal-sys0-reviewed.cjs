'use strict';
/* MP-DEAL-SYS.0 (p35 / MP.8.9b33) koruma adaptörü: Sistem Devri + Haraç çok oyunculu müzakere maddeleri (diplomacy.js dealSysIssues /
   warFetihSettlePreview / dealSysPreview / tributeRows ve insan taraflı dealQuote çakışma denetimi; economy.js tributeTick son ödeme kaydı +
   bildirim; ui.js teklif özeti, aktif haraç takvimi, tek dokunuş İttifak Daveti, bekleyen federasyon işleri; archive-ui.js Savaş Merkezi destekçi
   kartları; mp-core sys/tribute maddeleri, bilgi kapısı, geçersizleşme, haraç bildirimi; mirror haraç takvimi; guest-stars / mp71-dip gönderim ve
   hızlı teklif köprüsü) ve sürüm hunk'larını TAM METİNLE geri alır (p34 / MP.8.9b32 baytları, 043b9c3). Zincirde en yeni adım;
   stripReviewedFieldVerify önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-deal-sys0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedDealSys=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-DEAL-SYS source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-DEAL-SYS hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p34 restored');return source;};
