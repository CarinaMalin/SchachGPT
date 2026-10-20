// Apply before the stylesheet renders to avoid a bright flash on dark screens.
(() => {
  const key='schachgpt-theme-v1';
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let preference=null;
  try { preference=localStorage.getItem(key); } catch {}
  if(!['light','dark'].includes(preference))preference=null;
  function apply(theme){
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#141e1b':'#f7f6f0');
    const button=document.getElementById('theme-toggle');
    if(button){button.setAttribute('aria-pressed',String(theme==='dark'));button.textContent=theme==='dark'?'☀ Hell':'☾ Dunkel';}
  }
  apply(preference||(system.matches?'dark':'light'));
  system.addEventListener('change',e=>{if(!preference)apply(e.matches?'dark':'light');});
  document.addEventListener('DOMContentLoaded',()=>{
    apply(document.documentElement.dataset.theme);
    document.getElementById('theme-toggle').addEventListener('click',()=>{
      preference=document.documentElement.dataset.theme==='dark'?'light':'dark';
      apply(preference);
      try {localStorage.setItem(key,preference);} catch {}
    });
  });
})();
