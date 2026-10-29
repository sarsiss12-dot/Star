# Fresh experiment root (fails if it exists): symlinks to repo runtime/test files,
# PINNED private copies of ai.js (from git <rev>, default HEAD) and the manifest,
# then optional candidate scripts applied to the private ai.js.
import os,sys,json,hashlib,subprocess
dest=sys.argv[1];rev=os.environ.get('REV','HEAD');scripts=sys.argv[2:];repo='/home/user/Star'
os.makedirs(dest)
for n in os.listdir(repo):
  p=os.path.join(repo,n)
  if os.path.isfile(p) and n not in ('ai.js','RELEASE-MANIFEST.json'):os.symlink(p,os.path.join(dest,n))
os.symlink(os.path.join(repo,'tests'),os.path.join(dest,'tests'))
for n in ('ai.js','RELEASE-MANIFEST.json'):
  open(os.path.join(dest,n),'wb').write(subprocess.run(['git','-C',repo,'show',rev+':'+n],capture_output=True,check=True).stdout)
for sc in scripts:subprocess.run(['python3',sc,os.path.join(dest,'ai.js')],check=True)
subprocess.run(['node','--check',os.path.join(dest,'ai.js')],check=True)
m=json.load(open(os.path.join(dest,'RELEASE-MANIFEST.json')));m['files']['ai.js']=hashlib.sha256(open(os.path.join(dest,'ai.js'),'rb').read()).hexdigest()
json.dump(m,open(os.path.join(dest,'RELEASE-MANIFEST.json'),'w'),indent=2);print(dest,m['files']['ai.js'])
