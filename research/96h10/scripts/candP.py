# On top of candD: the "do not stack two armies" penalty reads other armies'
# destinations (idle: their system), so co-located armies stop all moving away together.
import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""          const zaten = G.fleets.some(f3 => f3 !== ordu && f3.e === e.id &&
            f3.sys === sy.id && isTransport(f3));""","""          const zaten = G.fleets.some(f3 => f3 !== ordu && f3.e === e.id &&
            f3.ships.length && varisOf(f3) === sy.id && isTransport(f3));""")
rep("""          const zaten = G.fleets.some(f => f !== ordu && f.e === e.id &&
            f.sys === sy.id && isTransport(f));""","""          /* 96H.10: aynı ayda karar veren ordular birbirinin VARIŞ noktasına
             bakar; aynı kolonideki iki ordu birlikte ayrılıp her ay
             ileri-geri gitmez. */
          const zaten = G.fleets.some(f => f !== ordu && f.e === e.id &&
            f.ships.length && varisOf(f) === sy.id && isTransport(f));""")
open(p,'w',encoding='utf8').write(s)
