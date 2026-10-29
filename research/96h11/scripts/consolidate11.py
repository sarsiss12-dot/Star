import json,glob,hashlib,os,statistics as st,subprocess
S='/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad'
H=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
SEEDS=[11,23,42,99,404,7,123,2026]
L=lambda f:json.load(open(f))
out='pkg/json';os.makedirs(out,exist_ok=True)
# ---- measurements (control 96H.10) ----
agg={'queue':{},'directiveStatus':{},'completed':0,'refund':0,'demolitions':0,'perSeed':{}}
for s in SEEDS:
  r=L(f'runs/c10c-{s}-120.json');ev=r['events'];q=[x for x in ev if x['k']=='q']
  ps={'aiTurnOk':sum(1 for x in q if x['src']=='aiTurn' and x['ok']),'aiTurnFailedAttempt':sum(1 for x in q if x['src']=='aiTurn' and not x['ok']),
      'directiveOk':sum(1 for x in q if x['src']=='directive' and x['ok']),'directiveFailedAttempt':sum(1 for x in q if x['src']=='directive' and not x['ok']),
      'completed':sum(1 for x in ev if x['k']=='done'),'refund':sum(1 for x in ev if x['k']=='refund'),'demolitions':sum(1 for x in ev if x['k']=='dem' and x['ok']),
      'focusChanges':sum(1 for x in ev if x['k']=='f'),'finalSaveSHA':r['finalSaveSHA']}
  ds={}
  for row in r['rows']:
    for k,v in (row.get('mon') or {}).items():k='build' if k.startswith('build:') else k;ds[k]=ds.get(k,0)+v
  ps['directiveStatus']=ds;agg['perSeed'][s]=ps
  for k,v in ds.items():agg['directiveStatus'][k]=agg['directiveStatus'].get(k,0)+v
for k in ('aiTurnOk','aiTurnFailedAttempt','directiveOk','directiveFailedAttempt','completed','refund','demolitions','focusChanges'):agg[k]=sum(p[k] for p in agg['perSeed'].values())
agg.pop('queue')
agg['directiveShareOfPaidOrders']=round(agg['directiveOk']/(agg['directiveOk']+agg['aiTurnOk']),4)
def run(cmd):return subprocess.run(cmd,capture_output=True,text=True,check=True).stdout
agg['churn']=run(['node','tools/churn11.js']+[f'runs/c10-{s}-120.json' for s in SEEDS]).strip().split('\n')
agg['rebuildSameKey']=run(['node','tools/rebuild11.js']+[f'runs/c10-{s}-120.json' for s in SEEDS]).strip().split('\n')[-1]
agg['replacementOutcome']=run(['node','tools/cls11b.js']+[f'runs/c10c-{s}-120.json' for s in SEEDS]).strip()
agg['focusOracleKnapsack6m']=run(['node','tools/knap11.js']+[f'runs/foc-{s}.json' for s in SEEDS]).strip().split('\n')
agg['focusOracleKnapsack12m']=run(['node','tools/knap11.js']+[f'runs/foc-{s}.json' for s in SEEDS],).strip().split('\n')[-1]
foc={}
for s in SEEDS:
  r=L(f'runs/foc-{s}.json');cnt={};flips=cm=0;prev={}
  cap={}
  for x in r['rows'][0]['cols']:
    if x['home'] and (x['e'] not in cap or x['pop']>cap[x['e']]['pop']):cap[x['e']]=x
  sec={'colonyMonths':0,'etkLost':0,'min':0,'ala':0,'ene':0,'ara':0,'yiy':0,'tuk':0}
  for row in r['rows']:
    for c in row['cols']:
      cnt[c['f']]=cnt.get(c['f'],0)+1;k=(c['e'],c['s'],c['p'])
      if k in prev and not c['home']:
        cm+=1;flips+=prev[k]!=c['f']
      prev[k]=c['f']
      if c['home'] and c['f']=='yonetim' and not (cap.get(c['e']) and cap[c['e']]['s']==c['s'] and cap[c['e']]['p']==c['p']):
        Y,Sa=c['alt']['yonetim'],c['alt']['sanayi'];sec['colonyMonths']+=1;sec['etkLost']+=Y['etk']-Sa['etk']
        for r_ in ('min','ala','ene','ara','yiy','tuk'):sec[r_]+=Sa[r_]-Y[r_]
  foc[s]={'colonyMonthsByFocus':cnt,'nonHomeMonthlyFlipRate':round(flips/max(1,cm),4),'secondaryHomeYonetimVsSanayi':{k:round(v,1) for k,v in sec.items()},'finalSaveSHA':r['finalSaveSHA']}
agg['focus']=foc
json.dump(agg,open(f'{out}/MEASUREMENTS.json','w'),indent=1,ensure_ascii=False)
# ---- candidates gross 8x120 ----
gross={}
for a,src in (('R','candR-S-120.json'),('B1','candB-S-120.json'),('M','candM-S-120.json'),('BM','candBM-S-120.json'),('BM2','candBM2-S-120.json'),('BM4','candBM4-S-120.json')):
  ctrl='c10c-S-120.json' if a in('R','B1') else 'c10-S-120.json'
  gross[a]=run(['node','tools/eco11.js','runs/'+ctrl,'runs/'+src]+[str(s) for s in SEEDS]).strip().split('\n')
json.dump({'note':'Single uninterrupted 8 x 120 runs from canonical initial Save8; chaotic, not evidence by themselves','runs':gross},open(f'{out}/GROSS-120.json','w'),indent=1,ensure_ascii=False)
# ---- bands ----
bands={'protocol':'checkpoint one month before first decision difference; each arm main + 4 one-draw placebos (PLACEBO_RNG=1..4 at the next monthTick); flags only when the candidate band does not overlap the control band',
  'B1_120':L('band/BAND.json'),'BM_120':L('band/BAND-c10-candBM.json'),'BM4_120':L('band/BAND-c10-candBM4.json'),'BM_240':L('b240/BAND-c10-candBM.json'),'BM4_240':L('b240/BAND-c10-candBM4.json')}
json.dump(bands,open(f'{out}/BANDS.json','w'),indent=1,ensure_ascii=False)
# crisis traces seed42
tr={}
for d,arms in (('band',('c10','candB','candBM')),('b240',('c10','candBM','candBM2','candBM4'))):
  for a in arms:
    for x in ['','-pl1','-pl2','-pl3','-pl4']:
      f=f'{d}/42-{a}{x}.json'
      if not os.path.exists(f):continue
      r=L(f);c={}
      for row in r['rows']:
        for e in row['emps']:
          if e['crit'] and not e['dead']:
            neg='/'.join(k for k in ('ene','min','tuk','ala') if e['inc'][k]<0 and e['res'][k]< -e['inc'][k]*3);c[f"{e['id']}:{neg}"]=c.get(f"{e['id']}:{neg}",0)+1
      tr[f]=c
json.dump({'definition':'empire-month with ene/min/tuk/ala income < 0 and stock < 3 months of deficit','seed42':tr},open(f'{out}/SEED42-CRISIS.json','w'),indent=1)
# ---- canonical replays ----
can={}
for months,cd,bd,ph in ((120,S+'/h10/c120','c120','candB'),(120,S+'/h10/c120','c120bm','candBM'),(240,S+'/h10/c240b','c240bm','candBM')):
  for s in SEEDS:
    try:a=L(f'{cd}/candD-{s}/summary-candD-{s}.json');b=L(f'{bd}/{ph}-{s}/summary-{ph}-{s}.json')
    except Exception:continue
    can[f'{ph}-{months}-{s}']={'96H.10':a,ph:b}
json.dump(can,open(f'{out}/CANONICAL.json','w'),indent=1)
# ---- source ----
src={'controlAI':H('arms/c10/ai.js'),'arms':{a:H(f'arms/{a}/ai.js') for a in ('candR','candB','candM','candBM','candBM2','candBM4')},
 'inputs':{s:H(f'{S}/h8/c120/control-{s}/control-{s}-initial.save') for s in SEEDS},'checkpoints':{os.path.basename(f):H(f) for f in sorted(glob.glob('ck/*.save'))},
 'controlPinned':'git show 667cf56:ai.js (private copy, not a symlink)','purity':'observer runs reproduce 96H.10 canonical final Save SHA (seeds 11,23,123,2026,404) and each other (8/8)'}
json.dump(src,open(f'{out}/SOURCE.json','w'),indent=1)
print('ok')
