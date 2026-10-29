import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""    else if (e.crisis === 'mineral') want = 'sanayi';""","""    else if (e.crisis === 'mineral' || ['ene','min','ala','tuk'].some(r => (e.inc[r] || 0) < 0)) want = 'sanayi';   // 96H.11""")
open(p,'w',encoding='utf8').write(s)
