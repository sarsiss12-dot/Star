const {fresh}=require('./helpers/dispatch-fixture'),path=require('path');
const h=fresh(0,path.resolve(process.argv[2]||path.join(__dirname,'..')));
h.run(`for(const e of G.emps){e.pact={};for(const k in e.res)e.res[k]=0;e.inc={};}E.pact[O.id]=true;O.pact[E.id]=true;G.sys[1].owner=O.id;Y.planets[0].col.b.liman=1;G.sys[1].planets[0].col=JSON.parse(JSON.stringify(Y.planets[0].col));G.sys[1].planets[0].col.e=O.id;O.colonies=[{s:1,p:0}];E.trade={vol:90,links:[{a:0,b:1,dis:true,bl:false}]};E.inc.min=100;O.inc.ene=100;var before=E.res.min+O.res.min+E.res.ene+O.res.ene;tradeFlowTick();var after=E.res.min+O.res.min+E.res.ene+O.res.ene;`);
console.log(JSON.stringify({root:process.argv[2],before:h.run('before'),after:h.run('after'),created:h.run('after-before')}));
