import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
  for (const c of e.colonies){""","""  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
  /* 96H.11: başkent tipi odak (Yönetim) başkent sistemindeki ilk kolonidedir.
     Aynı sistemdeki diğer koloniler ortak kuralla seçilir. Ölçüm (96H.10,
     8 × 120): 4 seed'de ikincil anavatan kolonileri sürekli Yönetim'de;
     seed11'de 120 ayda +605 Etki için 4392 mineral, 1622 alaşım, 3674 enerji. */
  const capital = e.colonies.find(c => c.s === e.home && G.sys[c.s].planets[c.p].col && G.sys[c.s].planets[c.p].owner === e.id);
  for (const c of e.colonies){""")
rep("""    if (e.home === sys.id) want = 'yonetim';""","""    if (c === capital) want = 'yonetim';""")
open(p,'w',encoding='utf8').write(s)
