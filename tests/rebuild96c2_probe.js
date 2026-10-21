'use strict';
const {strategyWorld}=require('./helpers/96c2-fixture'),h=strategyWorld();
h.run('a.res.ene=0;a.inc.ene=-100;RND_STATE=7;var before=JSON.stringify(a.res);aiWarReview()');
console.log(JSON.stringify({actualWar:h.run('!!a.war[b.id]'),stockUnchanged:h.run('before===JSON.stringify(a.res)'),reason:'Canonical voluntary review checks CB/force, but no energy runway'}));
