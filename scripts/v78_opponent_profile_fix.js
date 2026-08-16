(function(){
  'use strict';
  if(window.__MM_V78_FIX)return;
  window.__MM_V78_FIX=true;

  // The V77 patch incorrectly redirected "Вести дела" to a nonexistent
  // manageFighter() function. The original profile action is negotiate(f),
  // which is the correct action for both free agents and contracted opponents.
  const originalProfile=window.profile;
  if(typeof originalProfile==='function'){
    window.profile=function(f,back){
      if(!f)return;
      originalProfile(f,back||'roster');
      const ng=document.querySelector('[data-profile-negotiate]');
      if(ng){
        ng.onclick=function(e){
          e.preventDefault();
          e.stopImmediatePropagation();
          try{
            if(typeof negotiate==='function') negotiate(f);
          }catch(err){
            try{console.error('V78 negotiate error',err)}catch(_){}
          }
        };
      }
      const backBtn=document.querySelector('[data-back-profile]');
      if(backBtn){
        backBtn.onclick=function(e){
          e.preventDefault();
          e.stopImmediatePropagation();
          try{closeModal()}catch(_){}
          try{
            if(back==='match'||back==='matchmake') matchmake();
            else if(back==='market') market();
            else if(back==='rankings') rankings();
            else if(back==='event') newsCenter();
            else if(back==='prefight') fight();
            else if(back==='home') page('home');
            else page('roster');
          }catch(err){
            try{render()}catch(_){}
          }
        };
      }
    };
  }

  // When the opponent profile is opened from the currently organized fight,
  // return to matchmaking. "home" was wrong here and made the navigation feel
  // broken.
  try{
    const oldAct=window.act;
    if(typeof oldAct==='function'){
      window.act=function(a){
        if(a==='profileOpp'){
          const f=typeof currentF==='function'?currentF():null;
          if(f?.nextFight?.opponent){
            profile(f.nextFight.opponent,'match');
            return;
          }
        }
        return oldAct.apply(this,arguments);
      };
    }
  }catch(_){}
})();
