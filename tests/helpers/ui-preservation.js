'use strict';
const {createHash}=require('crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
// 93D adds only a scoped science CSS block. Removing that exact, reviewed
// block must restore the untouched canonical 93A.1/93C HTML hash.
// Historical referans-sha.json remains intact; neither half is exempted.
exports.isReviewedUI=source=>{
 const noticeStart=source.indexOf('/* FAZ 94D.1 — compact war notices */'),noticeEnd='/* END FAZ 94D.1 NOTICES */';
 if(noticeStart>=0){const end=source.indexOf(noticeEnd,noticeStart)+noticeEnd.length;
  if(end<noticeStart||hash(source.slice(noticeStart,end))!=='9cba1c96fce1048776124ab24e7d8004d7a8b8597bff742004585d3a878198e2')return false;
  source=source.slice(0,noticeStart-1)+source.slice(end);
 }
 const start=source.indexOf('/* FAZ 93D — scoped science tree');
 const marker='/* END FAZ 93D SCIENCE */\n',last=source.indexOf(marker,start);
 if(start<0||last<0)return false;
 const end=last+marker.length;
 return hash(source.slice(start,end))==='34e939ab23c375214b1adf76c6d892dc2a2c9761cca678c169e7ba7cb7557696' &&
   hash(source.slice(0,start)+source.slice(end))==='d85ef126bdfe642ff9e36e0d2490b271c9e4caf63a903d312082e9abe59a8e41';
};
