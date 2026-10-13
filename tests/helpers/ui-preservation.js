'use strict';
const {createHash}=require('crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
// 93D adds only a scoped science CSS block. Removing that exact, reviewed
// block must restore the untouched canonical 93A.1/93C HTML hash.
// Historical referans-sha.json remains intact; neither half is exempted.
exports.isReviewedUI=source=>{
 const start=source.indexOf('/* FAZ 93D — scoped science tree');
 const marker='/* END FAZ 93D SCIENCE */\n',last=source.indexOf(marker,start);
 if(start<0||last<0)return false;
 const end=last+marker.length;
 return hash(source.slice(start,end))==='d13aa74046e847dec41fbf8b69326be6cbe124530ca65774fc4a01459969ca0c' &&
   hash(source.slice(0,start)+source.slice(end))==='d85ef126bdfe642ff9e36e0d2490b271c9e4caf63a903d312082e9abe59a8e41';
};
