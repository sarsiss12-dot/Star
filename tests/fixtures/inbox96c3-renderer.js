// Exact 96C.3 UI method for read-only DOM comparison; canonical ZIP bfce5e5b...
  drawInbox(){
    const box = $('inbox');
    if (!box) return;
    const list = G.inbox || [];
    if (!list.length){ box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = list.map(it =>
      `<button class="nCard ${it.cls||''}" data-a="openNote" data-x="${it.uid}">
         <span class="nIco">${it.ico||'✉'}</span>
         <span class="nTxt"><b>${esc(it.title)}</b><i>${esc(it.sub||'')}</i></span>
         <span class="nGo">›</span>
       </button>`).join('');
  },
