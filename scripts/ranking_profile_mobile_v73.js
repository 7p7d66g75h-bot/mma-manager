/* MMA Manager ranking/profile repair — loaded as an isolated patch. */
(function(){
  'use strict';
  if(window.__MMA_RANKING_PROFILE_REPAIR)return;
  window.__MMA_RANKING_PROFILE_REPAIR=true;

  function state(){return window.s||window.state||window.gameState||null}
  function fighters(){
    const s=state();
    return [s&&s.fighters,s&&s.world,window.fighters,window.world].find(Array.isArray)||[];
  }
  function find(id){return fighters().find(f=>f&&String(f.id)===String(id))||null}
  function open(f){
    if(!f)return false;
    for(const n of ['profile','showFighterProfile','openFighterProfile','fighterProfile','viewFighterProfile']){
      if(typeof window[n]!=='function')continue;
      try{window[n](f);return true}catch(e){}
      try{window[n](f.id);return true}catch(e){}
    }
    return false;
  }
  function id(el){
    return el?.dataset?.fighterId||el?.dataset?.profileId||el?.dataset?.fighter||el?.getAttribute?.('data-fighter-id')||el?.getAttribute?.('data-profile-id')||el?.getAttribute?.('data-fighter');
  }
  function style(){
    if(document.getElementById('mma-ranking-profile-repair-style'))return;
    const s=document.createElement('style');s.id='mma-ranking-profile-repair-style';
    s.textContent='.ranking-profile-btn,.ranking .profile-btn,[data-action="profile"],button[onclick*="profile"]{min-width:110px!important;width:auto!important;min-height:44px!important;padding:10px 18px!important;white-space:nowrap!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}';
    document.head.appendChild(s);
  }
  style();
  document.addEventListener('click',function(e){
    const el=e.target.closest?.('[data-fighter-id],[data-profile-id],[data-fighter],.ranking-profile-btn,.ranking .profile-btn');
    if(!el)return;
    const f=find(id(el));
    if(f&&open(f)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  new MutationObserver(style).observe(document.documentElement,{childList:true,subtree:true});
})();
