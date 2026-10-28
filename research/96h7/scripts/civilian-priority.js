// Test-only transform of the existing paid naval allocator; no new budget.
function civilianPriority7(source){
 const old=" const count=c=>(inv.counts[c]||0)+(inv.pending[c]||0);\n const targets=colonizeTargets(e),wantCol=Math.min(e.colonies.length<6?3:2,targets.length);\n";
 if(!source.includes(old))throw Error('allocator source drift');
 source=source.replace(old,'');
 const begin=" const classes=['zir','kru','muh','kor','esk'].filter(c=>shipBuildAccess(e,c).ok);";
 const prep=old+" const expansionFirst=!war&&!visibleDanger&&!plan.critical&&!underDefended&&['regional','economy'].includes(e.aiStrategy?.objective?.kind);\n let earlyColony=false;\n if(expansionFirst&&count('kol')<wantCol&&targets.slice(0,5).some(t=>aiColonyReady(e,G.sys[t.s],G.sys[t.s].planets[t.p],{purchase:true})))earlyColony=buy('kol');\n";
 source=source.replace(begin,prep+begin).replace(" if(count('kol')<wantCol&&targets.slice", " if(!earlyColony&&count('kol')<wantCol&&targets.slice");
 return source;
}
if(typeof module!=='undefined')module.exports={civilianPriority7};
