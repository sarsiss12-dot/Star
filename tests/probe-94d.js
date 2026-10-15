'use strict';
const {fresh}=require('./helpers/dispatch-fixture'),{runtime}=require('./helpers/runtime');
const path=require('path'),fs=require('fs');const root=path.resolve(process.argv[2]||'.');
const h=fresh(0,root);
h.run(`G.feds=[];G.council=null;delete O.freeUntil;E.embargo={[O.id]:true};O.embargo={[E.id]:true};subjugate(E,O);var embargoAfter={player:!!E.embargo[O.id],vassal:!!O.embargo[E.id],effective:embargoOn(E,O.id)};`);
const borders=[];
for(const seed of [11,99,404]){const v=runtime({root,native:true});v.sb.seed=seed;
 v.run(`setupGame({name:'Border probe',race:'insan',traits:[],size:'orta',shape:'sarmal',diff:'normal',seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});economyTick(true);View.init();var border=View.buildBorders(),home=G.sys[G.p.home];var key=View.bkey;View.cam.z=.7;View.cam.x+=100;View.buildBorders();var stable=key===View.bkey;`);
 borders.push({seed,home:JSON.parse(v.run('JSON.stringify({x:home.x,y:home.y,reach:home._reach,extendsLeft:home.x-home._reach<0})')),rect:JSON.parse(v.run('JSON.stringify(border._worldRect||{x:0,y:0,w:G.W,h:G.H})')),panZoomKeepsGeometry:v.run('stable')});
}
console.log(JSON.stringify({root,embargoAfter:JSON.parse(h.run('JSON.stringify(embargoAfter)')),borders},null,2));
