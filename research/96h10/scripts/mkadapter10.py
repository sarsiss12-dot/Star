# Build tests/helpers/96h10-preservation.js from the candidate scripts' (old,new) pairs.
import json,sys,subprocess
S='/tmp/claude-0/-home-user-Star/30c40a47-ab4d-5adc-bfe4-309db2bf6d6f/scratchpad/h10/tools'
scripts=sys.argv[1:]
pairs=[]
for sc in scripts:
  src=open(f'{S}/{sc}').read()
  code=src.replace("p=sys.argv[1];s=open(p,encoding='utf8').read()","s=''").replace("open(p,'w',encoding='utf8').write(s)","")
  code=code.replace("def rep(old,new):\n    global s\n    assert s.count(old)==1,old[:90]\n    s=s.replace(old,new)","def rep(old,new):\n    PAIRS.append((old,new))")
  g={'PAIRS':pairs};exec(code,g)
cur=open('/home/user/Star/ai.js').read()
legacy=subprocess.run(['git','-C','/home/user/Star','show','HEAD:ai.js'],capture_output=True,text=True).stdout
# a later script may rewrite text inserted by an earlier one: apply in reverse when stripping
out=["'use strict';","const assert=require('assert/strict');",
"// 96H.10 reviewed army-safety change. Each entry is [current, 96H.9] text,",
"// stripped in reverse order; stripping restores the exact 96H.9 ai.js bytes.","const blocks=["]
for old,new in pairs:
  out.append('['+json.dumps(new,ensure_ascii=False)+',\n'+json.dumps(old,ensure_ascii=False)+'],')
out[-1]=out[-1].rstrip(',')
out+=["];","exports.reviewedH10Blocks=blocks.map(([current])=>current);","exports.stripReviewedH10=source=>{"," if(!source.includes('function aiArmySafe('))return source;",
" for(const [current,legacy]of blocks.slice().reverse()){assert.equal(source.split(current).length,2,'one reviewed 96H.10 block');source=source.replace(current,legacy);}"," return source;","};",""]
open('/home/user/Star/tests/helpers/96h10-preservation.js','w').write('\n'.join(out))
