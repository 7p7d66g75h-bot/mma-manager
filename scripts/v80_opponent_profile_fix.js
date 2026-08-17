(function(){
  'use strict';
  if(window.__MM_V80_OPP_PROFILE_FIX)return;
  window.__MM_V80_OPP_PROFILE_FIX=true;

  function getPlayer(){
    try{return typeof currentF==='function'?currentF():null}catch(e){return null}
  }
  function getOffers(f){return Array.isArray(f?.organizationOffers)?f.organizationOffers:[]}
  function close(){try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}}
  function openProfile(opponent){
    if(!opponent||typeof profile!=='function')return;
    window.__MM_V80_PROFILE_CONTEXT={fighter:opponent,back:'match'};
    profile(opponent,'match');
  }
  function goBack(){
    const c=window.__MM_V80_PROFILE_CONTEXT;
    close();
    try{
      if(c?.back==='match'){
        const f=getPlayer();
        if(typeof window.__MMA_MANAGER_ORG_OPEN_V72==='function')window.__MMA_MANAGER_ORG_OPEN_V72(f);
        else if(typeof matchmake==='function')matchmake(f);
        return;
      }
      if(c?.back==='market'&&typeof market==='function'){market();return}
      if(typeof page==='function')page('roster');
    }catch(e){try{if(typeof render==='function')render()}catch(_){}
    }
  }

  document.addEventListener('click',function(e){
    const target=e.target?.closest?.('[data-v70-profile]');
    if(!target)return;
    const f=getPlayer(), idx=Number(target.dataset.v70Profile), offers=getOffers(f), offer=offers[idx];
    if(!offer?.opponent)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openProfile(offer.opponent);
  },true);

  document.addEventListener('click',function(e){
    const back=e.target?.closest?.('[data-back-profile]');
    if(back&&window.__MM_V80_PROFILE_CONTEXT){
      e.preventDefault();
      e.stopImmediatePropagation();
      goBack();
      return;
    }
    const deal=e.target?.closest?.('[data-profile-negotiate]');
    const c=window.__MM_V80_PROFILE_CONTEXT;
    if(deal&&c?.fighter){
      e.preventDefault();
      e.stopImmediatePropagation();
      try{
        if(typeof negotiate==='function')negotiate(c.fighter);
      }catch(err){try{console.error('V80 opponent negotiate',err)}catch(_){}
      }
    }
  },true);

  // Clear stale opponent context whenever the modal is closed by another route.
  document.addEventListener('click',function(e){
    if(e.target?.closest?.('[data-v70-close]'))window.__MM_V80_PROFILE_CONTEXT=null;
  },true);
})();
