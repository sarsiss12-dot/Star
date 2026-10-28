from pathlib import Path
import subprocess,json,re,os
P=Path(__file__).resolve().parents[1];root=P.parent/'Star';out=P/'evidence/regression';out.mkdir(exist_ok=True)
names=['faz95a_strategic_ai_test.js','faz96f_strategy_test.js','faz96f_memory_test.js','faz96gd2_war_memory_test.js','faz96h52_politics_test.js','faz96h61_alliance_test.js','faz96f4_trade_test.js','faz96f4_colony_test.js','faz96f3_purchase_test.js','faz96g2_setup_test.js']
rows=[]
for name in names:
 r=subprocess.run(['node',str(root/'tests'/name)],capture_output=True,text=True,cwd=root,env=os.environ)
 text=r.stdout+r.stderr;(out/(name+'.log')).write_text(text);m=re.search(r'GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)',text)
 rows.append({'suite':name,'exit':r.returncode,'pass':int(m[1])if m else 0,'fail':int(m[2])if m else 1});print(name,rows[-1],flush=True)
(out/'summary.json').write_text(json.dumps(rows,indent=2))
