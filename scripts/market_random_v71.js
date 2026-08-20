(function(){
  'use strict';
  if(window.__MM_MARKET_RANDOM_V71)return;
  window.__MM_MARKET_RANDOM_V71=true;

  function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
  function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function buildMarketPool(force){
    const st=state();if(!st||!Array.isArray(st.world))return false;
    const managed=new Set((st.fighters||[]).map(f=>f?.id).filter(Boolean));
    const pool=st.world.filter(f=>f&&!managed.has(f.id)&&!f.contract&&!f.retired&&!f.nextFight&&Number(f.rating||0)<82);
    if(!pool.length)return false;
    if(!force&&Array.isArray(st.marketPool)&&st.marketPool.length){const valid=st.marketPool.filter(id=>pool.some(f=>f.id===id));if(valid.length>=Math.min(5,pool.length))return false;}
    shuffle(pool);const selected=[];const usedWeight=new Set();const usedOrg=new Set();
    for(const f of pool){if(selected.length>=5)break;const diverse=!usedWeight.has(f.weight)||!usedOrg.has(f.org);if(diverse){selected.push(f);usedWeight.add(f.weight);usedOrg.add(f.org)}}
    for(const f of pool){if(selected.length>=5)break;if(!selected.includes(f))selected.push(f)}
    st.marketPool=selected.map(f=>f.id);st.marketRefresh=Number(st.day||1);st.marketCareerToken=st.marketCareerToken||('C'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));saveSafe();return true;
  }
  function openMarket(force){buildMarketPool(!!force);try{if(typeof window.market==='function')window.market();else if(typeof market==='function')market()}catch(e){console.error('V71 market open',e)}}
  document.addEventListener('click',function(e){
    const refresh=e.target?.closest?.('[data-refresh-market]');
    if(refresh){e.preventDefault();e.stopImmediatePropagation();openMarket(true);try{if(typeof toast==='function')toast('Рынок бойцов обновлён.')}catch(_){}return;}
    const marketButton=e.target?.closest?.('[data-act="market"]');
    if(marketButton){e.preventDefault();e.stopImmediatePropagation();openMarket(false);return;}
  },true);

  function allFighters(){const st=state();return [...(st?.fighters||[]),...(st?.world||[])];}
  function findFighterByName(name){if(!name)return null;const n=String(name).trim();return allFighters().find(f=>f&&String(f.name||'').trim()===n)||null;}
  function findFighterById(id){if(id==null||id==='')return null;return allFighters().find(f=>f&&String(f.id)===String(id))||null;}
  function openFighterProfile(f){
    if(!f)return false;
    for(const n of ['profile','showFighterProfile','openFighterProfile','fighterProfile','viewFighterProfile']){
      const fn=window[n];if(typeof fn!=='function')continue;
      try{fn(f,'rankings');return true}catch(e){}
      try{fn(f.id);return true}catch(e){}
    }
    return false;
  }
  function widen(){
    if(!document.getElementById('mma-ranking-profile-v74-style')){
      const s=document.createElement('style');s.id='mma-ranking-profile-v74-style';
      s.textContent=`
        [data-profile-rank-btn],.rankline button,.ranking button,.ranking-profile-btn,.ranking .profile-btn{
          min-width:112px!important;width:auto!important;min-height:44px!important;padding:10px 18px!important;
          white-space:nowrap!important;flex:0 0 auto!important;box-sizing:border-box!important;
          display:inline-flex!important;align-items:center!important;justify-content:center!important;touch-action:manipulation!important;
        }
        .rankline{grid-template-columns:34px minmax(0,1fr) 50px 112px!important;}
        .championship-card{cursor:pointer!important;touch-action:manipulation!important;}
        .championship-card .champion-name{min-width:0;overflow-wrap:anywhere;}
        .v74-champion-profile{display:block!important;width:100%!important;margin-top:9px!important;min-height:44px!important;padding:10px 14px!important;box-sizing:border-box!important;}
      `;document.head.appendChild(s);
    }
  }
  function patchChampions(){
    document.querySelectorAll('.championship-card').forEach(card=>{
      if(card.dataset.v74ProfileReady==='1')return;
      const name=(card.querySelector('.champion-name')?.textContent||'').trim();if(!name||name==='ВАКАНТНО')return;
      const f=findFighterByName(name);if(!f)return;card.dataset.v74ProfileReady='1';
      const btn=document.createElement('button');btn.className='v74-champion-profile';btn.type='button';btn.textContent='Профиль чемпиона';
      btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openFighterProfile(f)},true);card.appendChild(btn);
      card.addEventListener('click',ev=>{if(ev.target.closest('button'))return;openFighterProfile(f)},true);
    });
  }
  function patchRankRows(){
    document.querySelectorAll('.rankline').forEach(row=>{
      const btn=row.querySelector('[data-profile-rank-btn],.ranking-profile-btn,.profile-btn,button');if(!btn)return;
      btn.style.minWidth='112px';btn.style.minHeight='44px';
      if(btn.dataset.v74Bound==='1')return;btn.dataset.v74Bound='1';
      btn.addEventListener('click',function(ev){
        const id=btn.getAttribute('data-fighter-id')||btn.getAttribute('data-profile-id')||row.getAttribute('data-fighter-id')||row.getAttribute('data-profile-id');
        let f=findFighterById(id);
        if(!f){const txt=(row.textContent||'').replace(/Профиль чемпиона|Профиль/g,'').trim();f=allFighters().find(x=>x?.name&&txt.includes(x.name))||null;}
        if(f&&openFighterProfile(f)){ev.preventDefault();ev.stopImmediatePropagation();}
      },true);
    });
  }
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('.rankline button,[data-profile-rank-btn],.ranking-profile-btn,.ranking .profile-btn');
    if(b){const row=b.closest('.rankline');if(row){const id=b.getAttribute('data-fighter-id')||b.getAttribute('data-profile-id')||row.getAttribute('data-fighter-id')||row.getAttribute('data-profile-id');let f=findFighterById(id);if(!f){const txt=(row.textContent||'').replace(/Профиль/g,'').trim();f=allFighters().find(x=>x?.name&&txt.includes(x.name))||null;}if(f&&openFighterProfile(f)){e.preventDefault();e.stopImmediatePropagation();return;}}}
    const card=e.target?.closest?.('.championship-card');if(card&&!e.target.closest('button')){const f=findFighterByName(card.querySelector('.champion-name')?.textContent);if(f&&openFighterProfile(f)){e.preventDefault();e.stopImmediatePropagation();}}
  },true);
  const observer=new MutationObserver(()=>{try{widen();patchChampions();patchRankRows()}catch(e){}});observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{widen();patchChampions();patchRankRows()},100);
  window.__MMA_MARKET_RANDOM_V71={refresh:()=>buildMarketPool(true),open:()=>openMarket(false),rankingPatch:'V74'};
})();
