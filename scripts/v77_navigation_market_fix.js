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

  // Profile navigation: preserve the real destination instead of relying on the old
  // generic fallback to roster. This is especially important for opponent profiles.
  if(typeof originalProfile==='function'){
    window.profile=function(f,back){
      if(!f){notify('Боец не найден');return;}
      window.__MM_V77_PROFILE_BACK=back||'roster';
      originalProfile(f,back||'roster');
      const btn=document.querySelector('[data-back-profile]');
      if(btn){
        btn.onclick=function(e){
          e?.preventDefault?.();
          e?.stopPropagation?.();
          const b=window.__MM_V77_PROFILE_BACK;
          safeClose();
          if(b==='match'||b==='matchmake'){
            try{matchmake();}catch(_){try{page('home')}catch(__){}}
          }else if(b==='home'){
            try{page('home')}catch(_){try{render()}catch(__){}}
          }else if(b==='market'){
            try{market();}catch(_){try{page('market')}catch(__){}}
          }else if(b==='rankings'){
            try{rankings();}catch(_){try{page('rankings')}catch(__){}}
          }else if(b==='event'){
            try{newsCenter();}catch(_){try{page('news')}catch(__){}}
          }else if(b==='prefight'){
            try{fight();}catch(_){try{page('home')}catch(__){}}
          }else{
            try{page('roster')}catch(_){try{render()}catch(__){}}
          }
        };
      }

      // For a fighter already represented by the manager, "Вести дела" must open
      // management rather than starting a second recruitment negotiation.
      const manage=document.querySelector('[data-profile-negotiate]');
      if(manage){
        const st=getState();
        const managed=!!st?.fighters?.some(x=>x&&x.id===f.id);
        if(managed && typeof manageFighter==='function'){
          manage.onclick=function(e){
            e?.preventDefault?.();
            e?.stopPropagation?.();
            safeClose();
            manageFighter(f);
          };
        }
      }
    };
  }

  // Opponent profile entry point: explicitly mark the source as HOME so its
  // Back button can never fall through to the roster.
  try{
    const oldAct=window.act;
    if(typeof oldAct==='function'){
      window.act=function(a){
        if(a==='profileOpp'){
          const f=(typeof currentF==='function'?currentF():null);
          if(f?.nextFight?.opponent){
            profile(f.nextFight.opponent,'home');
            return;
          }
        }
        return oldAct.apply(this,arguments);
      };
    }
  }catch(e){}

  // Randomize the free-agent market while keeping the original market UI,
  // affordability rules and contract mechanics intact.
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

  // Existing pages may have been rendered before this script overrides profile().
  // Rebind opponent/profile buttons whenever they are present.
  function bindExisting(){
    document.querySelectorAll('[data-profile-rank-btn]').forEach(b=>{
      if(b.__v77)return; b.__v77=true;
      b.addEventListener('click',function(e){
        e.stopImmediatePropagation();
        try{profile(findById(this.dataset.profileRankBtn),'rankings')}catch(_){ }
      },true);
    });
  }
  setTimeout(bindExisting,0);
  setTimeout(bindExisting,500);
})();
