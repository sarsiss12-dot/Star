# On top of candD: army routes avoid systems that are not army-safe (destination exempt).
import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""function aiMove(e,f,to){
  const route=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,to);""","""function aiMove(e,f,to,nodeAllowed=null){
  const route=aiKnownRoute(e,f,f.mv?f.mv.to:f.sys,to,e,null,nodeAllowed);""")
rep("""      if (hedef && hedef.id !== varisOf(ordu) && typeof orderMove === 'function'){
        aiMove(e,ordu,hedef.id);""","""      if (hedef && hedef.id !== varisOf(ordu) && typeof orderMove === 'function'){
        /* 96H.10: rota da görünür düşman gücünün tuttuğu ara sistemlerden geçmez */
        aiMove(e,ordu,hedef.id,id => id === hedef.id || guvenli(id));""")
open(p,'w',encoding='utf8').write(s)
