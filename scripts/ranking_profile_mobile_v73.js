/* MMA Manager V73 — isolated ranking/profile fix
   Does not replace existing ranking or profile logic. It only repairs
   the click target for ranking rows/champions and widens profile buttons.
*/
(function(){
  'use strict';
  const STYLE_ID='mma-ranking-profile-mobile-v73-style';
  if(!document.getElementById(STYLE_ID)){
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      .ranking-profile-btn,.ranking .profile-btn,[data-action="profile"]{
        min-width:96px !important;width:auto !important;padding-left:16px !important;padding-right:16px !important;
        min-height:44px !important;white-space:nowrap !important;
      }
      .ranking-champion .ranking-profile-btn,.ranking-row .ranking-profile-btn{min-width:96px !important;}
    `;
    document.head.appendChild(s);
  }
  function findFighter(id){
    if(!id) return null;
    const s=window.s||window.state||window.gameState;
    const pools=[s&&s.fighters,window.fighters,s&&s.world];
    for(const p of pools){
      if(Array.isArray(p)){const f=p.find(x=>String(x.id)===String(id));if(f)return f;}
    }
    return null;
  }
  function openProfile(id){
    const f=findFighter(id); if(!f)return false;
    const candidates=['profile','showFighterProfile','openFighterProfile','fighterProfile','viewFighterProfile'];
    for(const n of candidates){
      if(typeof window[n]==='function'){
        try{window[n](f);return true;}catch(e){try{window[n](f.id);return true;}catch(_){}}
      }
    }
    try{ if(typeof window.profile==='function'){window.profile(f);return true;} }catch(e){}
    return false;
  }
  document.addEventListener('click',function(e){
    const el=e.target.closest && e.target.closest('[data-fighter-id],[data-profile-id],.ranking-profile-btn,.ranking .profile-btn');
    if(!el)return;
    const id=el.dataset.fighterId||el.dataset.profileId||el.getAttribute('data-fighter');
    if(!id)return;
    const f=findFighter(id);
    if(!f)return;
    const ok=openProfile(id);
    if(ok)e.preventDefault();
  },true);
})();
