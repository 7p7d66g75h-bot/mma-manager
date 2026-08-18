(function(){
  'use strict';
  if(window.__MM_MARKET_RANDOM_V71)return;
  window.__MM_MARKET_RANDOM_V71=true;

  function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
  function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function buildMarketPool(force){
    const st=state();
    if(!st||!Array.isArray(st.world))return false;
    const managed=new Set((st.fighters||[]).map(f=>f?.id).filter(Boolean));
    const pool=st.world.filter(f=>f&&!managed.has(f.id)&&!f.contract&&!f.retired&&!f.nextFight&&Number(f.rating||0)<82);
    if(!pool.length)return false;

    if(!force&&Array.isArray(st.marketPool)&&st.marketPool.length) {
      const valid=st.marketPool.filter(id=>pool.some(f=>f.id===id));
      if(valid.length>=Math.min(5,pool.length))return false;
    }

    shuffle(pool);
    const selected=[];
    const usedWeight=new Set();
    const usedOrg=new Set();
    for(const f of pool){
      if(selected.length>=5)break;
      const diverse=!usedWeight.has(f.weight)||!usedOrg.has(f.org);
      if(diverse){selected.push(f);usedWeight.add(f.weight);usedOrg.add(f.org)}
    }
    for(const f of pool){
      if(selected.length>=5)break;
      if(!selected.includes(f))selected.push(f);
    }

    st.marketPool=selected.map(f=>f.id);
    st.marketRefresh=Number(st.day||1);
    st.marketCareerToken=st.marketCareerToken||('C'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    saveSafe();
    return true;
  }

  function openMarket(force){
    buildMarketPool(!!force);
    try{
      if(typeof window.market==='function')window.market();
      else if(typeof market==='function')market();
    }catch(e){console.error('V71 market open',e)}
  }

  document.addEventListener('click',function(e){
    const refresh=e.target?.closest?.('[data-refresh-market]');
    if(refresh){
      e.preventDefault();e.stopImmediatePropagation();
      openMarket(true);
      try{if(typeof toast==='function')toast('Рынок бойцов обновлён.')}catch(_){ }
      return;
    }
    const marketButton=e.target?.closest?.('[data-act="market"]');
    if(marketButton){
      e.preventDefault();e.stopImmediatePropagation();
      openMarket(false);
      return;
    }
  },true);

  /* V72 ranking UI: keep the existing ranking data/handlers intact.
     We only enlarge the existing Profile controls and add a safe profile route
     for champion cards, which previously had no profile button at all. */
  function findFighterByName(name){
    const st=state();
    if(!st||!name)return null;
    const pool=[...(st.fighters||[]),...(st.world||[])];
    return pool.find(f=>f&&f.name===name)||null;
  }
  function openFighterProfile(f){
    if(!f)return;
    try{
      if(typeof profile==='function'){
        profile(f,'rankings');
        return;
      }
    }catch(err){console.error('V72 profile open',err)}
    try{toast('Профиль бойца не найден')}catch(_){ }
  }

  const style=document.createElement('style');
  style.id='mma-manager-v72-ranking-ui';
  style.textContent=`
    [data-profile-rank-btn]{
      min-width:92px!important;
      width:92px!important;
      min-height:44px!important;
      padding:9px 10px!important;
      white-space:nowrap!important;
      flex:none!important;
    }
    .rankline{grid-template-columns:34px minmax(0,1fr) 50px 92px!important;}
    .championship-card{cursor:pointer;touch-action:manipulation;}
    .championship-card .champion-name{min-width:0;overflow-wrap:anywhere;}
    .v72-champion-profile{display:block;width:100%;margin-top:9px;min-height:44px!important;}
  `;
  document.head.appendChild(style);

  function patchChampionCards(){
    document.querySelectorAll('.championship-card').forEach(card=>{
      if(card.dataset.v72ProfileReady==='1')return;
      const nameEl=card.querySelector('.champion-name');
      if(!nameEl)return;
      const name=(nameEl.textContent||'').trim();
      if(!name||name==='ВАКАНТНО')return;
      const f=findFighterByName(name);
      if(!f)return;
      card.dataset.v72ProfileReady='1';
      const btn=document.createElement('button');
      btn.className='v72-champion-profile';
      btn.textContent='Профиль чемпиона';
      btn.type='button';
      btn.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();
        openFighterProfile(f);
      });
      card.appendChild(btn);
      card.addEventListener('click',function(ev){
        if(ev.target.closest('button'))return;
        openFighterProfile(f);
      });
    });
  }

  /* The rankings screen is rendered dynamically. A lightweight observer only
     watches for the new champion cards; it does not touch gameplay state. */
  const observer=new MutationObserver(function(){
    try{patchChampionCards()}catch(e){console.warn('V72 champion patch',e)}
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(patchChampionCards,100);

  window.__MMA_MARKET_RANDOM_V71={
    refresh:function(){return buildMarketPool(true)},
    open:function(){openMarket(false)},
    rankingPatch:'V72'
  };
})();