import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""   if(!best||score>best.score||score===best.score&&key<best.key)best={key,wanted,score,delta};
  }
  if(best)return best;
 }
 return null;
}""","""   if(!best||score>best.score||score===best.score&&key<best.key)best={key,wanted,score,delta};
  }
  if(best&&aiReplacementGains(e,sys,pl,wanted,queued,best.score,plan))return best;
 }
 return null;
}
/* 96H.11: a producer replaces a working building only when it adds more
   marginal value than the demolition removes, under the same weights.
   Measured (96H.10, 8 x 120): only 41% of replacements built the wanted
   building next; 27% rebuilt the demolished one. Capability buildings
   without resource output (defence, yard) keep the strategic rule. */
function aiReplacementGains(e,sys,pl,wanted,queued,lost,plan){
 if(!Object.keys(BUILDINGS[wanted].g||{}).length)return true;
 const whole=aiBuildingDelta(e,sys,pl,wanted,true);let gain=0;
 for(const r of ['ene','min','yiy','tuk','ala','ara','etk']){
  const weight=r==='ara'?1:r==='etk'?2:2+(plan.rows[r]?.urgency||0)/12;
  gain+=(whole[r]-queued[r])*weight;
 }
 return gain+lost>0;
}""")
open(p,'w',encoding='utf8').write(s)
