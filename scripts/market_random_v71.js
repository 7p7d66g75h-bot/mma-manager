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

    // A new career starts with marketPool=null. Existing careers keep their current
    // market until the player explicitly refreshes it or the day changes.
    if(!force&&Array.isArray(st.marketPool)&&st.marketPool.length) {
      const valid=st.marketPool.filter(id=>pool.some(f=>f.id===id));
      if(valid.length>=Math.min(5,pool.length))return false;
    }

    shuffle(pool);
    // Prefer a mixed market rather than five fighters with the same weight/org.
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

  // Intercept only market-opening controls. Other buttons and game mechanics are untouched.
  document.addEventListener('click',function(e){
    const refresh=e.target?.closest?.('[data-refresh-market]');
    if(refresh){
      e.preventDefault();e.stopImmediatePropagation();
      openMarket(true);
      try{if(typeof toast==='function')toast('Рынок бойцов обновлён.') }catch(_){ }
      return;
    }
    const marketButton=e.target?.closest?.('[data-act="market"]');
    if(marketButton){
      e.preventDefault();e.stopImmediatePropagation();
      openMarket(false);
      return;
    }
  },true);

  // Expose a tiny diagnostic hook without altering gameplay.
  window.__MMA_MARKET_RANDOM_V71={
    refresh:function(){return buildMarketPool(true)},
    open:function(){openMarket(false)}
  };
})();