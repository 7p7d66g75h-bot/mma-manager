(function(){
  'use strict';
  if(window.__MM_V77_FIX)return;
  window.__MM_V77_FIX=true;

  const getState=()=>{try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}};
  const safeSave=()=>{try{if(typeof save==='function')save()}catch(e){}};
  const safeClose=()=>{try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}};
  const notify=t=>{try{if(typeof toast==='function')toast(t)}catch(e){}};
  const currentFighter=()=>{try{return typeof currentF==='function'?currentF():null}catch(e){return null}};

  // Keep the market randomization from V77.
  const originalMarket=window.market;
  if(typeof originalMarket==='function'){
    window.market=function(){
      const st=getState();
      try{
        if(st){
          const managed=new Set((st.fighters||[]).map(x=>x?.id).filter(Boolean));
          const pool=(st.world||[]).filter(f=>f&&!managed.has(f.id)&&!f.contract&&Number(f.rating||ovr(f))<82);
          for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
          st.marketPool=pool.slice(0,5).map(f=>f.id);
          st.marketRefresh=st.day;
          safeSave();
        }
      }catch(e){}
      return originalMarket.apply(this,arguments);
    };
  }

  // IMPORTANT: profile() and the profile button handlers are declared in the
  // main game's lexical scope, so replacing window.profile is not enough.
  // Capture the actual DOM clicks before the game's own handlers. This fixes
  // opponent profiles opened from the organization-fight screen.
  document.addEventListener('click',function(e){
    const target=e.target?.closest?.('[data-back-profile]');
    if(target){
      const sheet=document.getElementById('sheet');
      if(!sheet)return;
      const heading=sheet.querySelector('.hero h2')?.textContent?.trim()||'';
      const f=currentFighter();
      const isOpponent=!!(f?.organizationOffers||[]).some(o=>o?.opponent?.name===heading)
        || !!(f?.nextFight?.opponent?.name===heading);
      if(isOpponent){
        e.preventDefault();
        e.stopImmediatePropagation();
        safeClose();
        try{if(typeof matchmake==='function')matchmake();else if(typeof window.matchmake==='function')window.matchmake()}catch(_){try{render()}catch(__){}}
        return;
      }
    }

    const negotiateBtn=e.target?.closest?.('[data-profile-negotiate]');
    if(negotiateBtn){
      const sheet=document.getElementById('sheet');
      const heading=sheet?.querySelector('.hero h2')?.textContent?.trim()||'';
      const f=currentFighter();
      // Find the opponent represented by the profile in the current offer batch.
      const offer=(f?.organizationOffers||[]).find(o=>o?.opponent?.name===heading);
      const opponent=offer?.opponent || (f?.nextFight?.opponent?.name===heading?f.nextFight.opponent:null);
      if(opponent){
        e.preventDefault();
        e.stopImmediatePropagation();
        try{
          // Use the game's real profile negotiation function, not the local
          // organization_v64 negotiation function.
          if(typeof negotiate==='function') negotiate(opponent);
          else notify('Переговоры временно недоступны');
        }catch(err){try{console.error('Opponent negotiation error',err)}catch(_){} }
        return;
      }
    }
  },true);

  // Existing ranking/profile buttons.
  function bindExisting(){
    document.querySelectorAll('[data-profile-rank-btn]').forEach(b=>{
      if(b.__v77)return;
      b.__v77=true;
      b.addEventListener('click',function(e){
        e.stopImmediatePropagation();
        try{profile(findById(this.dataset.profileRankBtn),'rankings')}catch(_){ }
      },true);
    });
  }
  setTimeout(bindExisting,0);
  setTimeout(bindExisting,500);
})();
