from pathlib import Path
import json,subprocess,concurrent.futures
P=Path(__file__).resolve().parents[1];base={'name':'Matched 96F','race':'insan','traits':[],'size':'orta','aiCount':5,'shape':'sarmal','diff':'normal','seed':11,'ethics':{'mil':0,'aut':0,'mat':0,'ahl':0},'civics':[],'origin':'standart','ruins':'yok','crisis':'kapali','council':'kapali'}
settings=[('base',{}),('systems30',{'size':'kucuk'}),('systems60',{'size':'buyuk'}),('systems80',{'size':'devasa'}),('systems100',{'size':'ulu'}),('AI1',{'aiCount':1}),('AI7',{'aiCount':7}),('AI11',{'aiCount':11}),('ring',{'shape':'halka'}),('cluster',{'shape':'kume'}),('hard',{'diff':'zor'}),('originsOff',{'aiOrigins':False}),('origins100',{'aiOriginChance':100}),('council',{'council':'normal'}),('noPirates',{'pirates':False}),('largeSparse',{'size':'ulu','aiCount':1})]
def run(it):
 tag,x=it;j={'version':'control','tag':'pregame-'+tag,'config':{**base,**x},'months':24,'out':str(P/'evidence/pregame')};f=P/'jobs'/('pregame-'+tag+'.json');f.write_text(json.dumps(j))
 with(P/'evidence'/('pregame-'+tag+'.log')).open('w')as o:r=subprocess.run(['node',str(P/'scripts/host.js'),str(f)],stdout=o,stderr=subprocess.STDOUT)
 print(tag,r.returncode,flush=True);return {'tag':tag,'exit':r.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as ex:r=list(ex.map(run,settings))
(P/'evidence/pregame-runs.json').write_text(json.dumps(r,indent=2));assert all(x['exit']==0 for x in r)
