import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,old[:90]
    s=s.replace(old,new)
rep("""function aiEconomicOrder(e,sys,pl,legacy){
 const plan=aiEconomyPlan(e),resourceBuilding={ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'};
 const ranked=Object.keys(resourceBuilding).filter(r=>{const row=plan.rows[r];return row.net<0&&row.months<12||row.stock<Math.max(120,row.reserve)&&row.urgency>12;}).sort((a,b)=>plan.rows[b].urgency-plan.rows[a].urgency||a.localeCompare(b));""","""function aiUrgentResource(plan,r){const row=plan.rows[r];return row.net<0&&row.months<12||row.stock<Math.max(120,row.reserve)&&row.urgency>12;}
function aiEconomicOrder(e,sys,pl,legacy){
 const plan=aiEconomyPlan(e),resourceBuilding={ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'};
 const ranked=Object.keys(resourceBuilding).filter(r=>aiUrgentResource(plan,r)).sort((a,b)=>plan.rows[b].urgency-plan.rows[a].urgency||a.localeCompare(b));""")
rep("""  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
""","""  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
  const sanayiNeed = e.crisis === 'mineral' || (plan => ['ene','min','ala','tuk'].some(r => aiUrgentResource(plan, r)))(aiEconomyPlan(e));
""")
rep("""    else if (e.crisis === 'mineral') want = 'sanayi';""","""    else if (sanayiNeed) want = 'sanayi';""")
open(p,'w',encoding='utf8').write(s)
