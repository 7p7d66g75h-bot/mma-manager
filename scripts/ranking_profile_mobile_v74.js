/* MMA Manager V74 — ranking/profile repair, isolated and mobile-first. */
(function(){
  'use strict';
  if (window.__MMA_RANKING_PROFILE_V74) return;
  window.__MMA_RANKING_PROFILE_V74 = true;

  const STYLE_ID='mma-ranking-profile-v74-style';
  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      .ranking-profile-btn,.ranking .profile-btn,[data-action="profile"],
      button[onclick*="profile"],button[onclick*="Profile"]{
        min-width:110px!important;width:auto!important;padding:10px 18px!important;
        min-height:44px!important;line-height:1.15!important;white-space:nowrap!important;
        flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
      }
      .ranking-row,.ranking-champion{cursor:default}
      .ranking-row .ranking-profile-btn,.ranking-champion .ranking-profile-btn{min-width:110px!important}
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  function getState(){return window.s||window.state||window.gameState||null}
  function findFighter(id){
    if(id==null||id==='') return null;
    const st=getState();
    const pools=[st&&st.fighters,st&&st.world,window.fighters,window.world];
    for(const p of pools){
      if(Array.isArray(p)){
        const f=p.find(x=>String(x&&x.id)===String(id));
        if(f) return f;
      }
    }
    return null;
  }
  function openProfile(f){
    if(!f) return false;
    const names=['profile','showFighterProfile','openFighterProfile','fighterProfile','viewFighterProfile'];
    for(const n of names){
      const fn=window[n];
      if(typeof fn!=='function') continue;
      try{fn(f);return true}catch(e){}
      try{fn(f.id);return true}catch(e){}
    }
    return false;
  }
  function idFrom(el){
    return el?.dataset?.fighterId || el?.dataset?.profileId || el?.dataset?.fighter ||
      el?.getAttribute?.('data-fighter-id') || el?.getAttribute?.('data-profile-id') || el?.getAttribute?.('data-fighter');
  }
  function handle(e){
    const t=e.target?.closest?.('[data-fighter-id],[data-profile-id],[data-fighter],.ranking-profile-btn,.ranking .profile-btn');
    if(!t) return;
    const id=idFrom(t); if(!id) return;
    const f=findFighter(id); if(!f) return;
    if(openProfile(f)){e.preventDefault();e.stopImmediatePropagation();}
  }
  installStyle();
  document.addEventListener('click',handle,true);
  new MutationObserver(installStyle).observe(document.documentElement,{childList:true,subtree:true});
})();
