(function(){
  'use strict';
  if(window.__MMA_RANKING_CONTRACTS_V76)return;
  window.__MMA_RANKING_CONTRACTS_V76=true;

  function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
  function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
  function findFighter(id){
    const st=state();
    if(!st)return null;
    return [...(st.fighters||[]),...(st.world||[])].find(f=>f&&f.id===id)||null;
  }
  function invalidOrg(v){
    if(!v)return true;
    const x=String(v).trim().toLowerCase();
    return !x||x==='свободный агент'||x==='свободный агент.'||x==='free agent'||x==='free agents';
  }
  function assignOrg(f){
    if(!f)return false;
    if(f.contract?.org && invalidOrg(f.org)){
      f.org=f.contract.org;
      f.orgLevel=Number(f.orgLevel||0)||6;
      return true;
    }
    if(!invalidOrg(f.org))return false;
    try{
      if(typeof randomWorldOrg==='function'){
        const o=randomWorldOrg(f);
        if(o?.name){f.org=o.name;f.orgLevel=Number(o.level||6);return true;}
      }
    }catch(e){}
    const r=Number(f.rating||0);
    const pool=r>=82?['UFC','PFL','ONE Championship','RIZIN','ACA']:r>=76?['RIZIN','ACA','KSW','LFA','ONE Championship']:r>=68?['LFA','KSW','ACA','Cage Warriors','Ares FC']:['Cage Warriors','Ares FC','BRAVE CF'];
    f.org=pool[Math.floor(Math.random()*pool.length)];
    f.orgLevel=Number(f.orgLevel||0)||6;
    return true;
  }
  function migrateWorldOrganizations(){
    const st=state();
    if(!st||!Array.isArray(st.world))return false;
    let changed=false;
    for(const f of st.world){
      if(!f||f.retired)continue;
      if(assignOrg(f))changed=true;
    }
    if(changed)saveSafe();
    return changed;
  }

  function patchRankingRows(){
    if(typeof rankingRows!=='function' && typeof window.rankingRows!=='function')return;
    window.rankingRows=function(arr,limit){
      const list=Array.isArray(arr)?arr.slice(0,limit||15):[];
      return list.map((r,i)=>{
        const f=findFighter(r?.id);
        const record=(typeof rec==='function'&&f)?rec(f):`${f?.wins||0}-${f?.losses||0}-${f?.draws||0}`;
        const org=f?.org||f?.contract?.org||'Свободный агент';
        const contract=f?.contract?.org?`<span class="rank-contract">КОНТРАК: ${f.contract.org}</span>`:'';
        return `<div class="rankline rankline-v76" data-profile-rank="${r.id}" role="button">
          <div class="ranknum ${i<3?'top':''}">${i+1}</div>
          <div class="rank-fighter-main">
            <b>${f?.flag||'🌍'} ${r.name||f?.name||'Боец'}</b>
            <div class="rank-meta-v76"><span>${f?.country||''}</span><span>${org}</span><span>${f?.weight||''}</span></div>
            <span class="rank-record-badge"><small>РЕКОРД</small><strong>${record}</strong></span>${contract}
          </div>
          <b class="gold rank-score-v76">${r.score||0}</b>
          <button class="rank-profile-v76" data-profile-rank-btn="${r.id}" type="button">Профиль</button>
        </div>`;
      }).join('');
    };
  }

  const style=document.createElement('style');
  style.id='mma-manager-v76-ranking-style';
  style.textContent=`
    .rankline-v76{grid-template-columns:34px minmax(0,1fr) auto auto!important;gap:8px!important;align-items:center!important;}
    .rank-fighter-main{min-width:0;display:block!important;}
    .rank-meta-v76{display:flex;gap:6px;flex-wrap:wrap;margin-top:3px;color:#8e98a4;font-size:10px;}
    .rank-meta-v76 span{white-space:nowrap;}
    .rank-record-badge{display:inline-flex!important;align-items:center!important;gap:6px!important;margin-top:6px!important;padding:4px 8px!important;border:1px solid rgba(213,174,66,.5)!important;border-radius:7px!important;background:linear-gradient(180deg,rgba(213,174,66,.16),rgba(213,174,66,.06))!important;color:#f4f5f6!important;vertical-align:middle!important;}
    .rank-record-badge small{font-size:8px!important;letter-spacing:.8px!important;color:#c8a849!important;font-weight:900!important;}
    .rank-record-badge strong{font-size:13px!important;font-weight:950!important;letter-spacing:.2px!important;}
    .rank-contract{display:inline-flex!important;margin:6px 0 0 5px!important;padding:4px 7px!important;border-radius:6px!important;background:rgba(72,165,109,.12)!important;border:1px solid rgba(72,165,109,.3)!important;color:#78d39a!important;font-size:9px!important;font-weight:900!important;vertical-align:middle!important;}
    .rank-profile-v76{min-width:100px!important;width:100px!important;min-height:44px!important;padding:9px 10px!important;white-space:nowrap!important;flex:none!important;}
    .rank-score-v76{min-width:34px!important;text-align:center!important;}
    @media(max-width:520px){
      .rankline-v76{grid-template-columns:30px minmax(0,1fr) auto!important;}
      .rank-profile-v76{grid-column:2/-1!important;width:100%!important;min-width:0!important;margin-top:4px!important;}
      .rank-score-v76{grid-column:3!important;grid-row:1!important;}
      .rank-fighter-main{grid-column:2!important;grid-row:1!important;}
    }
  `;
  document.head.appendChild(style);

  migrateWorldOrganizations();
  patchRankingRows();
  try{if(typeof updateRankings==='function')updateRankings()}catch(e){}
  try{if(typeof save==='function')save()}catch(e){}

  const observer=new MutationObserver(()=>{
    if(!window.__MMA_RANKING_CONTRACTS_V76_REPATCH){
      window.__MMA_RANKING_CONTRACTS_V76_REPATCH=true;
      setTimeout(()=>{window.__MMA_RANKING_CONTRACTS_V76_REPATCH=false;patchRankingRows();},0);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});

  /* V80 — restore the original button/navigation behaviour.
     The visual ranking patch must never replace or swallow existing controls.
     Only bind a fallback when the original handler is absent. */
  function fallbackClick(e){
    const t=e.target?.closest?.('button,[role="button"]');
    if(!t)return;

    if(t.matches('[data-profile-rank-btn]')){
      const id=t.getAttribute('data-profile-rank-btn');
      const f=findFighter(id);
      if(!f)return;
      e.preventDefault();
      e.stopPropagation();
      try{if(typeof profile==='function')profile(f,'rankings')}catch(err){console.error('V80 profile',err)}
      return;
    }

    if(t.matches('[data-page]') && typeof page==='function'){
      e.preventDefault();e.stopPropagation();
      page(t.getAttribute('data-page'));
      return;
    }

    if(t.matches('[data-rankleague]') && typeof rankings==='function'){
      e.preventDefault();e.stopPropagation();
      const st=state();
      if(st){st.rankLeague=t.getAttribute('data-rankleague');st.rankSection='rankings';saveSafe();}
      rankings();
      return;
    }

    if(t.matches('[data-ranksection]') && typeof rankings==='function'){
      e.preventDefault();e.stopPropagation();
      const st=state();
      if(st){st.rankSection=t.getAttribute('data-ranksection');saveSafe();}
      rankings();
      return;
    }

    if(t.matches('[data-league-rank]') && typeof rankings==='function'){
      e.preventDefault();e.stopPropagation();
      const st=state();
      if(st){st.rankLeague=t.getAttribute('data-league-rank');st.rankSection='rankings';saveSafe();}
      rankings();
      return;
    }

    if(t.matches('[data-league-roster]') && typeof page==='function'){
      e.preventDefault();e.stopPropagation();
      page('roster');
      return;
    }
  }

  /* Window capture runs before document-level capture handlers from older patches. */
  window.addEventListener('click',fallbackClick,true);
  window.addEventListener('pointerup',function(e){
    const t=e.target?.closest?.('[data-profile-rank-btn]');
    if(!t)return;
    /* Do not double-fire if the click path already handled it. */
    if(t.dataset.v80Handled==='1'){delete t.dataset.v80Handled;return;}
    t.dataset.v80Handled='1';
    const f=findFighter(t.getAttribute('data-profile-rank-btn'));
    if(f){e.preventDefault();e.stopPropagation();try{profile(f,'rankings')}catch(_){} }
  },true);

  /* Remove only the dangerous ranking visual wrapper styles from V78 if it exists.
     We keep the new visual styling itself, but ensure no ranking element can become
     a click-blocking overlay. */
  const safety=document.createElement('style');
  safety.id='mma-manager-v80-button-safety';
  safety.textContent=`
    .mm-rank-shell,.mm-rank-org-banner,.mm-rank-champion,.mm-rank-section-title{pointer-events:auto!important;}
    .mm-rank-shell button,.mm-rank-shell [role="button"]{pointer-events:auto!important;touch-action:manipulation!important;}
    .rank-profile-v76{position:relative!important;z-index:5!important;pointer-events:auto!important;touch-action:manipulation!important;}
  `;
  document.head.appendChild(safety);
})();
