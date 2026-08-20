/* MMA Manager ranking/profile repair + official mobile rankings design */
(function(){
  'use strict';
  if(window.__MMA_RANKING_PROFILE_REPAIR)return;
  window.__MMA_RANKING_PROFILE_REPAIR=true;

  function state(){return window.s||window.state||window.gameState||null}
  function fighters(){
    const s=state();
    return [s&&s.fighters,s&&s.world,window.fighters,window.world].find(Array.isArray)||[];
  }
  function find(id){return fighters().find(f=>f&&String(f.id)===String(id))||null}
  function open(f){
    if(!f)return false;
    for(const n of ['profile','showFighterProfile','openFighterProfile','fighterProfile','viewFighterProfile']){
      if(typeof window[n]!=='function')continue;
      try{window[n](f);return true}catch(e){}
      try{window[n](f.id);return true}catch(e){}
    }
    return false;
  }
  function id(el){return el?.dataset?.fighterId||el?.dataset?.profileId||el?.dataset?.fighter||el?.getAttribute?.('data-fighter-id')||el?.getAttribute?.('data-profile-id')||el?.getAttribute?.('data-fighter');}

  function style(){
    if(document.getElementById('mma-ranking-official-mobile-style'))return;
    const s=document.createElement('style');s.id='mma-ranking-official-mobile-style';
    s.textContent=`
      .ranking-profile-btn,.ranking .profile-btn,[data-action="profile"],button[onclick*="profile"]{min-width:110px!important;width:auto!important;min-height:44px!important;padding:10px 18px!important;white-space:nowrap!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}
      .mma-ranking-official{position:relative;background:linear-gradient(145deg,#11161c,#090c10);border:1px solid #303740!important;border-radius:12px!important;overflow:hidden;box-shadow:0 12px 32px #0008;margin-bottom:12px}
      .mma-ranking-official .mro-banner{margin:0 0 10px;padding:15px 14px;min-height:118px;display:grid;grid-template-columns:88px 1fr auto;gap:12px;align-items:center;background:radial-gradient(circle at 16% 45%,#55411b 0,#1d1910 32%,#0c1015 70%);border:1px solid #8b6a25;border-radius:10px;box-shadow:inset 0 0 50px #0008}
      .mro-belt{width:78px;height:78px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,#d8b24d,#7c5a18 55%,#211a0c);border:2px solid #e0bd5b;box-shadow:0 4px 20px #000;font-size:40px}
      .mro-kicker{font-size:10px;letter-spacing:1.4px;font-weight:950;color:#d8b24d;text-transform:uppercase;margin-bottom:4px}
      .mro-name{font-size:20px;line-height:1.05;font-weight:950;text-transform:uppercase;letter-spacing:.5px}
      .mro-org{margin-top:7px;color:#aeb6bf;font-size:11px;font-weight:800}
      .mro-record{text-align:right;border:1px solid #d8ad3d;border-radius:8px;padding:8px 10px;background:#080b0f;min-width:84px}.mro-record small{display:block;color:#b8a36a;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.mro-record b{display:block;color:#f1f3f5;font-size:18px;margin-top:3px}
      .mma-ranking-official .rankline{display:grid!important;grid-template-columns:38px minmax(0,1fr) auto!important;gap:9px!important;align-items:center!important;padding:10px 8px!important;margin:0!important;border-bottom:1px solid #292f37!important;background:linear-gradient(90deg,#11161b,#0c1015)!important;min-height:64px}
      .mma-ranking-official .ranknum{font-size:21px!important;font-weight:950!important;text-align:center!important;color:#c7ccd2!important}.mma-ranking-official .ranknum.top{color:#e0b94e!important}
      .mma-ranking-official .record-badge{min-width:76px!important;padding:6px 8px!important;border:1px solid #d2a63c!important;border-radius:7px!important;background:#080b0f!important;color:#f1f3f5!important;font-size:12px!important;font-weight:950!important;box-shadow:0 0 0 1px #d2a63c22 inset}
      .mma-ranking-official .rankline:nth-of-type(3n) .record-badge{border-color:#4cae69!important}.mma-ranking-official .rankline:nth-of-type(5n) .record-badge{border-color:#d2a63c!important}
      .mma-ranking-official .rankline button,.mma-ranking-official .rankline .profile-btn{background:linear-gradient(90deg,#d8b34f,#a77b22)!important;color:#090b0e!important;border-color:#e0bc58!important;border-radius:6px!important;font-size:11px!important;font-weight:950!important;min-width:82px!important;min-height:38px!important;padding:7px 10px!important}
      .mma-ranking-official .rankline button:active{transform:scale(.98)!important}
      .mma-ranking-official .mro-legend{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 8px;background:#0b0f14;border-top:1px solid #2a3038}.mro-legend-item{background:#11161c;border:1px solid #292f37;border-radius:7px;padding:7px;text-align:center;color:#8f98a3;font-size:9px;font-weight:800}.mro-legend-item b{display:block;color:#d5ae42;font-size:13px;margin-bottom:2px}
      @media(max-width:520px){.mma-ranking-official .mro-banner{grid-template-columns:58px minmax(0,1fr) 76px;gap:8px;padding:11px;min-height:96px}.mro-belt{width:54px;height:54px;font-size:28px}.mro-name{font-size:15px}.mro-record{min-width:70px;padding:6px}.mro-record b{font-size:15px}.mma-ranking-official .rankline{grid-template-columns:31px minmax(0,1fr) auto!important;gap:6px!important;padding:8px 5px!important;min-height:58px}.mma-ranking-official .ranknum{font-size:18px!important}.mma-ranking-official .record-badge{min-width:67px!important;font-size:11px!important;padding:5px!important}.mma-ranking-official .rankline button,.mma-ranking-official .rankline .profile-btn{min-width:70px!important;font-size:10px!important;padding:6px 7px!important}}
    `;
    document.head.appendChild(s);
  }

  function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}
  function decorate(){
    style();
    const rows=[...document.querySelectorAll('.rankline')].filter(x=>x.offsetParent!==null);
    if(!rows.length)return;
    const host=rows[0].parentElement?.closest('.panel,.card,section')||rows[0].parentElement;
    if(!host||host.dataset.mmaRankingOfficial==='1')return;
    host.dataset.mmaRankingOfficial='1';
    host.classList.add('mma-ranking-official');
    const first=rows[0];
    const clone=first.cloneNode(true);clone.querySelectorAll('button').forEach(b=>b.remove());
    let name='ЧЕМПИОН ДИВИЗИОНА',rec='—',org='ОФИЦИАЛЬНЫЙ РЕЙТИНГ';
    const badge=clone.querySelector('.record-badge');if(badge)rec=text(badge);
    const nm=clone.querySelector('.fighter-name,.op-name,.fighter-info,.op-info');if(nm)name=text(nm).replace(rec,'').trim()||name;
    const orgEl=clone.querySelector('.rank-meta');if(orgEl)org=text(orgEl);
    const banner=document.createElement('div');banner.className='mro-banner';
    banner.innerHTML='<div class="mro-belt">🏆</div><div><div class="mro-kicker">'+name.replace(/</g,'&lt;')+'</div><div class="mro-name">ЧЕМПИОН</div><div class="mro-org">'+(org||'ОФИЦИАЛЬНЫЙ РЕЙТИНГ')+'</div></div><div class="mro-record"><small>Рекорд</small><b>'+rec.replace(/</g,'&lt;')+'</b></div>';
    host.insertBefore(banner,rows[0]);
    const legend=document.createElement('div');legend.className='mro-legend';legend.innerHTML='<div class="mro-legend-item"><b>↑</b>Поднялся</div><div class="mro-legend-item"><b>—</b>Без изменений</div><div class="mro-legend-item"><b>★</b>Претендент</div>';host.appendChild(legend);
  }

  style();
  document.addEventListener('click',function(e){const el=e.target.closest?.('[data-fighter-id],[data-profile-id],[data-fighter],.ranking-profile-btn,.ranking .profile-btn');if(!el)return;const f=find(id(el));if(f&&open(f)){e.preventDefault();e.stopImmediatePropagation();}},true);
  const mo=new MutationObserver(function(){style();decorate()});mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(decorate,150);setTimeout(decorate,700);setTimeout(decorate,1500);
})();
