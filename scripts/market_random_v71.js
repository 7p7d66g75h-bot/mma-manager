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
    .mm-record-badge{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-width:72px!important;
      padding:4px 8px!important;
      border:1px solid rgba(212,175,55,.42)!important;
      border-radius:7px!important;
      background:rgba(212,175,55,.08)!important;
      color:#f1f1f1!important;
      font-weight:800!important;
      letter-spacing:.2px!important;
      line-height:1.15!important;
      white-space:nowrap!important;
    }
    .mm-contract-badge{
      display:inline-flex!important;
      align-items:center!important;
      margin-left:6px!important;
      padding:3px 7px!important;
      border-radius:6px!important;
      background:rgba(48,190,112,.12)!important;
      border:1px solid rgba(48,190,112,.28)!important;
      color:#79e0a7!important;
      font-size:11px!important;
      font-weight:700!important;
      white-space:nowrap!important;
    }
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

  function patchRecordBadges(){
    const rx=/^\s*\d+\s*-\s*\d+(?:\s*-\s*\d+)?\s*$/;
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length||el.classList.contains('mm-record-badge'))return;
      const text=(el.textContent||'').trim();
      if(!rx.test(text))return;
      const p=el.parentElement;
      if(!p||/button|input|textarea/i.test(el.tagName))return;
      el.classList.add('mm-record-badge');
      el.setAttribute('aria-label','Рекорд бойца: '+text);
    });
  }

  function rankingOrganizations(){
    const st=state();
    const out=[];
    const map=st?.rankingsByOrg||{};
    Object.keys(map).forEach(org=>{
      const byWeight=map[org]||{};
      Object.keys(byWeight).forEach(weight=>{
        const list=Array.isArray(byWeight[weight])?byWeight[weight]:[];
        list.forEach(x=>{if(x&&x.id)out.push({id:x.id,org})});
      });
    });
    return out;
  }

  function ensureRankingContracts(){
    const st=state();
    if(!st||!Array.isArray(st.world))return false;
    const managed=new Set((st.fighters||[]).map(f=>f?.id).filter(Boolean));
    const byId=new Map(st.world.filter(Boolean).map(f=>[f.id,f]));
    const assignments=rankingOrganizations();
    const assigned=new Map();
    assignments.forEach(x=>{if(!assigned.has(x.id))assigned.set(x.id,x.org)});
    let changed=false;
    assigned.forEach((org,id)=>{
      const f=byId.get(id);
      if(!f||managed.has(id)||f.retired||f.agencyManaged||f.nextFight) return;
      const current=f.contract?.org;
      if(current) return;
      f.org=f.org||org;
      f.contract={
        org:org,
        length:3,
        fightsLeft:3,
        salary:Math.max(500,Math.round(Number(f.purse||f.salary||1000))),
        signedDay:Number(st.day||1),
        rankingContract:true
      };
      changed=true;
    });
    if(changed)saveSafe();
    return changed;
  }

  function patchFreeAgentLabels(){
    const st=state();
    if(!st)return;
    const all=[...(st.world||[]),...(st.fighters||[])];
    const byName=new Map(all.filter(f=>f?.name).map(f=>[f.name,f]));
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length)return;
      const t=(el.textContent||'').trim();
      if(!/^Свободн(ый агент|ая)$/.test(t))return;
      const parent=el.parentElement;
      if(!parent)return;
      const nameEl=parent.querySelector('.fighter-name,.fighter-info,.champion-name');
      const name=nameEl?.textContent?.replace(/^[^A-Za-zА-Яа-яЁё0-9]*/,'').trim();
      const f=byName.get(name);
      const org=f?.contract?.org||f?.org;
      if(!org)return;
      el.textContent=org;
      el.classList.add('mm-contract-badge');
    });
  }

  ensureRankingContracts();
  function patchAll(){
    try{
      ensureRankingContracts();
      patchChampionCards();
      patchRecordBadges();
      patchFreeAgentLabels();
    }catch(e){console.warn('V73 ranking repair',e)}
  }

  const observer=new MutationObserver(function(){
    try{patchAll()}catch(e){console.warn('V73 observer',e)}
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(patchAll,100);
  setTimeout(patchAll,700);

  window.__MMA_MARKET_RANDOM_V71={
    refresh:function(){return buildMarketPool(true)},
    open:function(){openMarket(false)},
    rankingPatch:'V73'
  };
})();