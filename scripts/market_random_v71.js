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

    /* V78 — official mobile rankings visual system, designed for 9:16 */
    .mm-rank-shell{
      background:linear-gradient(145deg,#11161c,#080b0f)!important;
      border:1px solid #303740!important;border-radius:14px!important;
      overflow:hidden!important;box-shadow:0 14px 34px #0009!important;margin-bottom:12px!important;
    }
    .mm-rank-org-banner{
      min-height:78px;padding:14px 15px;display:flex;align-items:center;gap:12px;
      background:radial-gradient(circle at 78% 25%,#80622555,transparent 38%),linear-gradient(105deg,#171d24,#0b0f14);
      border-bottom:1px solid #3a3423;position:relative;overflow:hidden;
    }
    .mm-rank-org-banner:after{content:"";position:absolute;right:-35px;top:-45px;width:150px;height:150px;border:1px solid #d5ae4238;border-radius:50%;box-shadow:0 0 0 16px #d5ae4210,0 0 0 32px #d5ae4208}
    .mm-rank-org-mark{width:52px;height:52px;display:grid;place-items:center;border:1px solid #9c792c;border-radius:10px;background:linear-gradient(145deg,#3a2c12,#14110b);color:#e3be55;font-weight:1000;font-size:15px;letter-spacing:1px;z-index:1;flex:none}
    .mm-rank-org-copy{min-width:0;z-index:1}.mm-rank-org-copy small{display:block;color:#9da6af;font-size:9px;letter-spacing:1.6px;font-weight:900;text-transform:uppercase}.mm-rank-org-copy b{display:block;color:#f3f4f5;font-size:20px;line-height:1.05;margin-top:3px}.mm-rank-org-copy span{display:block;color:#d5ae42;font-size:10px;font-weight:800;margin-top:4px}
    .mm-rank-champion{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 14px;background:linear-gradient(90deg,#18150e,#11161b);border-bottom:1px solid #2d3136}
    .mm-rank-belt{width:54px;height:42px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(145deg,#8f6d24,#2c2110);border:1px solid #b28b36;color:#f2d06a;font-size:22px;box-shadow:inset 0 0 18px #0008}
    .mm-rank-champion small{display:block;color:#d5ae42;font-size:9px;letter-spacing:1.3px;font-weight:950;text-transform:uppercase}.mm-rank-champion b{display:block;font-size:15px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mm-rank-champion span{display:block;color:#8f99a4;font-size:10px;margin-top:2px}.mm-rank-champion .mm-crown{font-size:23px;color:#d5ae42}
    .mm-rank-section-title{padding:10px 14px 6px;display:flex;justify-content:space-between;align-items:center;color:#8f99a4;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;font-weight:900}.mm-rank-section-title b{color:#d5ae42;font-size:10px}
    .mm-rank-shell .rankline{padding:9px 10px!important;margin:0 8px;border-bottom:1px solid #252b32!important;border-radius:7px;grid-template-columns:31px minmax(0,1fr) 50px 88px!important}
    .mm-rank-shell .rankline:first-of-type{background:linear-gradient(90deg,#d5ae4214,transparent)}
    .mm-rank-shell .ranknum{font-size:17px}.mm-rank-shell .ranknum.top{font-size:20px;text-shadow:0 0 12px #d5ae4255}
    .mm-rank-shell [data-profile-rank-btn]{width:88px!important;min-width:88px!important;background:linear-gradient(135deg,#d7b24a,#987222)!important;border-color:#d8b550!important;color:#080a0d!important;border-radius:7px!important;font-weight:950!important;box-shadow:0 4px 10px #0007!important}
    .mm-rank-shell .mm-record-badge{min-width:74px!important;padding:5px 6px!important;border-color:#92732d!important;background:#0d1116!important;box-shadow:inset 0 0 0 1px #d5ae4212!important}
    .mm-rank-footer{padding:10px 12px;color:#77818c;font-size:9px;line-height:1.45;border-top:1px solid #252b32;background:#0b0f13}.mm-rank-footer b{color:#bfc6cc}
    @media(max-width:430px){
      .mm-rank-org-banner{min-height:70px;padding:12px}.mm-rank-org-mark{width:46px;height:46px;font-size:13px}.mm-rank-org-copy b{font-size:18px}
      .mm-rank-champion{grid-template-columns:48px minmax(0,1fr) 24px;padding:9px 11px}.mm-rank-belt{width:48px;height:38px}.mm-rank-champion b{font-size:14px}
      .mm-rank-shell .rankline{grid-template-columns:27px minmax(0,1fr) 48px 80px!important;margin:0 5px;padding:8px 6px!important}.mm-rank-shell [data-profile-rank-btn]{width:80px!important;min-width:80px!important;padding:8px 5px!important;font-size:11px}.mm-rank-shell .mm-record-badge{min-width:70px!important;font-size:11px}
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
      f.contract={org:org,length:3,fightsLeft:3,salary:Math.max(500,Math.round(Number(f.purse||f.salary||1000))),signedDay:Number(st.day||1),rankingContract:true};
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

  function findRankContainer(){
    const lines=[...document.querySelectorAll('.rankline')];
    if(!lines.length)return null;
    return lines[0].closest('.panel')||lines[0].parentElement;
  }
  function patchOfficialRankDesign(){
    const container=findRankContainer();
    if(!container||container.dataset.mmOfficialRank==='1')return;
    container.dataset.mmOfficialRank='1';
    const org=(container.querySelector('.rank-meta b')?.textContent||'UFC').trim()||'UFC';
    const championName=(container.querySelector('.championship-card .champion-name')?.textContent||container.querySelector('.champion-name')?.textContent||'ЧЕМПИОН').trim();
    const shell=document.createElement('div');shell.className='mm-rank-shell';
    const banner=document.createElement('div');banner.className='mm-rank-org-banner';banner.innerHTML='<div class="mm-rank-org-mark">'+org.slice(0,7)+'</div><div class="mm-rank-org-copy"><small>Официальный рейтинг</small><b>'+org+'</b><span>Весовая категория • WORLD RANKINGS</span></div>';
    const champ=document.createElement('div');champ.className='mm-rank-champion';champ.innerHTML='<div class="mm-rank-belt">◈</div><div><small>ЧЕМПИОН</small><b>'+championName.replace(/</g,'&lt;')+'</b><span>Текущий обладатель титула</span></div><div class="mm-crown">♛</div>';
    const title=document.createElement('div');title.className='mm-rank-section-title';title.innerHTML='<span>Официальный рейтинг</span><b>ТОП-15</b>';
    shell.append(banner,champ,title);
    const footer=document.createElement('div');footer.className='mm-rank-footer';footer.innerHTML='<b>Рейтинг обновляется автоматически</b> после результатов боёв. Позиция зависит от качества побед, активности и уровня оппозиции.';
    const lines=[...container.querySelectorAll('.rankline')];
    lines.forEach(line=>shell.appendChild(line));shell.appendChild(footer);
    container.replaceWith(shell);
  }

  ensureRankingContracts();
  function patchAll(){
    try{ensureRankingContracts();patchChampionCards();patchRecordBadges();patchFreeAgentLabels();patchOfficialRankDesign()}catch(e){console.warn('V78 ranking design',e)}
  }

  const observer=new MutationObserver(function(){try{patchAll()}catch(e){console.warn('V78 observer',e)}});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(patchAll,100);
  setTimeout(patchAll,700);
  setTimeout(patchAll,1800);

  window.__MMA_MARKET_RANDOM_V71={refresh:function(){return buildMarketPool(true)},open:function(){openMarket(false)},rankingPatch:'V78'};
})();