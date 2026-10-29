import sys
p=sys.argv[1];s=open(p,encoding='utf8').read()
old="""  for(const f of send)aiMove(e,f,target.id);
  for(const f of force){
    if(f.mv||f.path.length||f.sys===rally.id||ready.includes(f))continue;
    aiMove(e,f,rally.id);
  }"""
new="""  for(const f of send)aiMove(e,f,target.id);
  // 96H.9: a force that reached the campaign target holds the siege. Pulling
  // every idle fleet back to the rally each AI turn broke bombardment within a
  // month and left arriving armies without an escort.
  for(const f of force){
    if(f.mv||f.path.length||f.sys===rally.id||f.sys===target.id||ready.includes(f))continue;
    aiMove(e,f,rally.id);
  }"""
assert s.count(old)==1;s=s.replace(old,new);open(p,'w',encoding='utf8').write(s)
