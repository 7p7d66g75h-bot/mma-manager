(function(){
  'use strict';
  if(window.__MM_V77_FIX)return;
  window.__MM_V77_FIX=true;

  const getState=()=>{try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}};
  const safeSave=()=>{try{if(typeof save==='function')save()}catch(e){}};
  const safeClose=()=>{try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}};
  const notify=t=>{try{if(typeof toast==='function')toast(t)}catch(e){}};

  const originalProfile=window.profile;
  const originalMarket=window.market;

  if(typeof originalProfile==='function'){
    window.profile=function(f,back){
      if(!f){notify('Боец не найден');return;}
      originalProfile(f,back||'roster');

      // IMPORTANT: use the game's real negotiate(f) action. V77 previously
      // attempted to call nonexistent manageFighter(), so the button appeared
      // to do nothing for an opponent already under contract.
      const negotiateBtn=document.querySelector('[data-profile-negotiate]');
      if(negotiateBtn){
        negotiateBtn.onclick=function(e){
          e?.preventDefault?.();
          e?.stopImmediatePropagation?.();
          try{
            if(typeof negotiate==='function') negotiate(f);
            else notify('Переговоры временно недоступны');
          }catch(err){
            try{console.error('V77 negotiate error',err)}catch(_){}
          }
        };
      }

      const backBtn=document.querySelector('[data-back-profile]');
      if(backBtn){
        backBtn.onclick=function(e){
          e?.preventDefault?.();
          e?.stopImmediatePropagation?.();
          safeClose();
          try{
            if(back==='match'||back==='matchmake') matchmake();
            else if(back==='home') page('home');
            else if(back==='market') market();
            else if(back==='rankings') rankings();
            else if(back==='event') newsCenter();
            else if(back==='prefight') fight();
            else page('roster');
          }catch(err){try{render()}catch(_){}}
        };
      }
    };
  }

  // Opponent profile opened from the fight-organization screen must return to
  // matchmaking, not to Home. This keeps the selected fighter and opponent.
  try{
    const oldAct=window.act;
    if(typeof oldAct==='function'){
      window.act=function(a){
        if(a==='profileOpp'){
          const f=(typeof currentF==='function'?currentF():null);
          if(f?.nextFight?.opponent){
            profile(f.nextFight.opponent,'match');
            return;
          }
        }
        return oldAct.apply(this,arguments);
      };
    }
  }catch(e){}

  // Randomize free-agent market while preserving the original UI and contract
  // mechanics.
  if(typeof originalMarket==='function'){
    window.market=function(){
      const st=getState();
      if(!st)return originalMarket();
      try{
        const managed=new Set((st.fighters||[]).map(x=>x?.id).filter(Boolean));
        const pool=(st.world||[]).filter(f=>f&&!managed.has(f.id)&&!f.contract&&Number(f.rating||ovr(f))<82);
        for(let i=pool.length-1;i>0;i--){
          const j=Math.floor(Math.random()*(i+1));
          [pool[i],pool[j]]=[pool[j],pool[i]];
        }
        st.marketPool=pool.slice(0,5).map(f=>f.id);
        st.marketRefresh=st.day;
        safeSave();
      }catch(e){}
      return originalMarket.apply(this,arguments);
    };
  }

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
