'use strict';
const assert=require('assert/strict');
exports.stripReviewedH63=source=>{
 const current='!Array.isArray(p.members)||p.members.length<(jointActive(p)?2:1)||',legacy='!Array.isArray(p.members)||p.members.length<2||';
 if(!source.includes(current))return source;
 assert.equal(source.split(current).length,2,'one reviewed closed joint-plan Save8 guard');return source.replace(current,legacy);
};
