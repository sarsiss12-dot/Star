'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),pins=require('./beta-scale0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedScale0=(file,source)=>{const p=pins[file];if(!p)return source;assert.equal(sha(source),p.afterSha256,file+' exact reviewed SCALE candidate');for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique reviewed SCALE hunk');source=source.replace(h.after,h.before);}assert.equal(sha(source),p.beforeSha256,file+' exact SETUP.1 restored');return source;};
