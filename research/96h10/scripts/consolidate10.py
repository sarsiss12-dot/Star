# Derive the 96H.10 research summaries from raw arm10/arm10b runs.
import json,sys,collections,glob,os
sys.path.insert(0,os.path.dirname(__file__))
from armyclass import classify
from cmp10 import metrics,W,SEEDS120
from conq10 import conq
from siege10 import analyse
from ss10 import summ
H=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
o=lambda n,d:json.dump(d,open(f'{H}/out/{n}','w'),indent=1,ensure_ascii=False)
ARMS={'c9':'96H.9','candD':'96H.10 (D)','candDP':'D+P (REJECTED)'}
# 1. army lifecycle under the 96H.9 control (where armies are lost)
life={}
for s in W:
  for a in ARMS:
    life[f'seed{s}-{ARMS[a]}']={w:dict(classify(f'{H}/runs3/{a}-{s}-{w}-240.json')) for w in W[s]}
life['8x120']={ARMS[a]:{s:dict(classify(f'{H}/runs3/{a}-{s}-base-120.json')) for s in SEEDS120} for a in ARMS}
o('ARMY-LIFECYCLE.json',{'note':'arm10 tracker: orders (aiMove of transports), arrivals with/without own warships, losses by tick and context (attack destination = enemy colony at war; other = defence/staging/own systems), clean invasions, stale in-transit army-months','worlds':life})
# 2. campaigns
camp={}
for s in W:
  for a in ARMS:camp[f'seed{s}-240-{ARMS[a]}']={w:{k:v for k,v in metrics(f'{H}/runs3/{a}-{s}-{w}-240.json').items() if k!='rngEnd'} for w in W[s]}
for a in ARMS:camp[f'8x120-{ARMS[a]}']={s:{k:v for k,v in metrics(f'{H}/runs3/{a}-{s}-base-120.json').items() if k!='rngEnd'} for s in SEEDS120}
o('CAMPAIGNS.json',{'note':'5 worlds per seed (base + one-draw placebos: seed11 810/1, 810/3, 780/1, 840/1; seed23 450/1..4), RELOAD_AT=60; 8x120 canonical base worlds','arms':camp})
# 3. conquest quality and retention
cq={}
for s in W:
  for a in ARMS:
    R=[]
    for w in W[s]:R+=conq(f'{H}/runs3/{a}-{s}-{w}-240.json',240)
    cq[f'seed{s}-{ARMS[a]}']=R
o('CONQUESTS-240.json',{'note':'every colony ownership flip: type (temiz=clean army landing, katastrof=6-month siege catastrophe, teslim=surrender), population and building loss in the flipping tick, still held after 12/24 months','arms':cq})
# 4. siege timing (96H.9 control)
sg=[]
for f in sorted(glob.glob(f'{H}/runs2/c9-*-240.json')):sg+=analyse(f)
o('SIEGE-TIMING-96H9.json',{'note':'96H.9 control: siege start, months bombarded, months the attacker owned any army / an army heading there, truce months (incomingArmy), first order and arrival day','captures':sg})
# 5. same-save windows
ss={}
for ck in ['s11pl1-m216','s23pl4-m156','s23pl4-m112']:
  ss[ck]={a:{w or 'base':{k:v for k,v in summ(f'{H}/ss/{ck}-{a}{w}.json').items() if k!='rng'} for w in ['']+['-pl%d'%k for k in (1,2,3,4)]} for a in ('c9','candD','candD2')}
o('SAME-SAVE.json',{'note':'24 months from 96H.9 checkpoints at the natural defect; control, D, D2 (route safety, REJECTED); 4 one-draw placebos each','windows':ss})
# 6. bands
o('BANDS.json',{'D_vs_96H9':json.load(open(f'{H}/band2/BAND.json')),'P_vs_D':json.load(open(f'{H}/band3/BAND.json')),'note':'checkpoint one month before the first decision difference; 4 one-draw placebos at the trigger month for each arm'})
print('ok')
