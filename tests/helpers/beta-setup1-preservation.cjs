'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),pins=require('./beta-setup1-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedSetup1=(file,source)=>{
 source=require('./beta-scale0-preservation.cjs').stripReviewedScale0(file,source);
 const p=pins[file];if(!p)return source;
 assert.equal(sha(source),p.afterSha256,file+' exact reviewed candidate');
 for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique reviewed hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),p.beforeSha256,file+' canonical source restored');return source;
};
