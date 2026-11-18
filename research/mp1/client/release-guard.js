'use strict';
// Bu betik relay tarafından MP katılım sayfasının başına, oyun betiklerinden önce yerleştirilir.
(() => {
  const {release, build}=document.currentScript.dataset;
  let blocked=false;
  let busy=false;
  const warning='Oyun sürümü eski veya eksik. Güncelle ve yeniden katıl.';

  function show(message=warning){
    const box=document.getElementById('mpReleaseNotice');
    if(!box)return;
    box.hidden=false;
    document.getElementById('mpReleaseMessage').textContent=message;
    document.getElementById('mpReleaseRetry').disabled=busy;
  }

  function requireUpdate(){
    blocked=true;
    show();
  }

  async function update(){
    if(busy)return;
    busy=true;
    show('Güncelleme için sunucuya bağlanılıyor…');
    const abort=new AbortController();
    const timeout=setTimeout(()=>abort.abort(),8000);
    try{
      const url=new URL(location.href);
      const refresh=String(Date.now());
      const check=await fetch('/mp/version?mp-refresh='+refresh,{cache:'no-store',signal:abort.signal});
      if(!check.ok||!/^application\/json\b/i.test(check.headers.get('content-type')||''))throw Error('version');
      const version=await check.json();
      if(!/^[0-9a-f]{64}$/.test(version.release))throw Error('release');
      url.searchParams.set('mp-refresh',refresh);
      location.replace(url.href);
    }catch{
      busy=false;
      show('Güncelleme alınamadı. İnternet bağlantını kontrol edip tekrar dene.');
    }finally{
      clearTimeout(timeout);
    }
  }

  window.StarsMPRelease={
    get stamp(){return blocked?null:release;},
    build,
    requireUpdate
  };
  // SRI yükleme hatası, join.js veya oyun motoru çalışmasa bile bu katmana ulaşır.
  addEventListener('error',event=>{
    if(event.target?.tagName==='SCRIPT'&&event.target.integrity)requireUpdate();
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('mpReleaseRetry')?.addEventListener('click',update);
    if(blocked)show();
  });
})();
