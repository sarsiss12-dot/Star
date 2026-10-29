# Create a fresh experiment root (fails if it already exists): symlinks to the repo
# runtime/test files, a private ai.js produced by the given candidate scripts.
import os,sys,json,hashlib,subprocess
dest=sys.argv[1];scripts=sys.argv[2:];repo='/home/user/Star'
os.makedirs(dest)
for n in os.listdir(repo):
  p=os.path.join(repo,n)
  if os.path.isfile(p) and n not in ('ai.js','RELEASE-MANIFEST.json'):os.symlink(p,os.path.join(dest,n))
os.symlink(os.path.join(repo,'tests'),os.path.join(dest,'tests'))
open(os.path.join(dest,'ai.js'),'wb').write(open(os.path.join(repo,'ai.js'),'rb').read())
for sc in scripts:subprocess.run(['python3',sc,os.path.join(dest,'ai.js')],check=True)
subprocess.run(['node','--check',os.path.join(dest,'ai.js')],check=True)
m=json.load(open(os.path.join(repo,'RELEASE-MANIFEST.json')));m['files']['ai.js']=hashlib.sha256(open(os.path.join(dest,'ai.js'),'rb').read()).hexdigest()
json.dump(m,open(os.path.join(dest,'RELEASE-MANIFEST.json'),'w'),indent=2);print(dest,m['files']['ai.js'])
