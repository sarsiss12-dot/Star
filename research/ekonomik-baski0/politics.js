// Observe only outputs of actual calls made inside the ordinary founding decision.
const politicalLog=[];let decision=null;
const wrapPolitical=(name,observe)=>{
  const base=globalThis[name];globalThis[name]=function(...args){
    const out=base.apply(this,args);if(decision)observe(out,...args);return out;
  };
};
wrapPolitical('aiFedAffinity',(v,e,type)=>{if(e.id===decision.id)decision.affinity[type]=v;});
wrapPolitical('aiRaiderFound',(v,e,ids)=>{decision.raider={ok:!!v,allies:ids.filter(id=>id!==e.id),objective:e.aiStrategy?.objective?.kind};});
wrapPolitical('aiFedWilling',(v,e,founder,type)=>{decision.responses.push([e.id,founder.id,type,v.ok,v.ok?'':v.why]);});
wrapPolitical('fedFoundPropose',(v,e,type)=>{decision.proposal=[type,!!v.ok,v.why];});
const chooseBloc=aiRivalBlocChoice;
aiRivalBlocChoice=function(e){
  const d={day:G.day,id:e.id,affinity:{},responses:[],etk:e.res.etk};decision=d;
  try{return chooseBloc(e);}finally{decision=null;politicalLog.push(d);}
};
