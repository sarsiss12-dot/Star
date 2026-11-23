import json,glob,os,sys
base=os.path.dirname(os.path.abspath(__file__));keys=sorted({os.path.basename(f)[:-5] for f in glob.glob(base+'/run*/*.json')})
def q(xs,p):xs=sorted(xs);i=(len(xs)-1)*p;lo=int(i);hi=min(lo+1,len(xs)-1);return xs[lo]+(xs[hi]-xs[lo])*(i-lo)
for k in keys:
  A=[];B=[];eq=[];per=[]
  for f in sorted(glob.glob(base+'/run*/'+k+'.json')):
    d=json.load(open(f));a=[s['ms'] for s in d['samples'][0]];b=[s['ms'] for s in d['samples'][1]];A+=a;B+=b;eq.append(d['equal']);per.append(round(d['delta'],2))
  print(k,'runs',len(per),'tek koşu Δp95%',per,'birleşik p50',round(q(A,.5),1),round(q(B,.5),1),'p95',round(q(A,.95),1),round(q(B,.95),1),'dp95=%.2f'%((q(B,.95)/q(A,.95)-1)*100),'equal',eq)
