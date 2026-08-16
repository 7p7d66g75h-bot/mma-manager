(function(){'use strict';
const V='MMA_MANAGER_V1_FIGHT_CONTRACT';
if(window.__MM_V1_FIGHT_CONTRACT)return; window.__MM_V1_FIGHT_CONTRACT=true;
function getF(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
function fmt(n){return Number(n||0).toLocaleString('ru-RU')}
function sig(f){const x=f&&f.nextFight;if(!x)return '';return [x.org,x.opponent?.id||x.opponent?.name||'',x.date,x.purse,x.titleFight?'T':'N'].join('|')}
function closeSafe(){try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}}
function openContract(f){const x=f?.nextFight;if(!x)return;const purse=Number(x.purse||0);const winBonus=Number(x.winBonus||purse);const ppv=Number(x.ppvPercent||((x.titleFight||Number(x.rank||999)<=5)?2:(Number(x.rank||999)<=15?1:0.5)));x.contractTerms={type:'ONE_FIGHT',purse,winBonus,ppvPercent:ppv,signed:false};saveSafe();const modal=document.getElementById('modal'),sheet=document.getElementById('sheet');if(!modal||!sheet)return;modal.classList.add('open');sheet.innerHTML=`<div class="eyebrow">КОНТРАК НА БОЙ</div><div class="title">${f.name} vs ${x.opponent?.name||'Соперник'}</div><div class="muted">${x.org||'Организация'} • ${x.type||'Бой'} • ${typeof dateLabel==='function'?dateLabel(x.date):'Дата боя'}</div><section class="panel"><div class="notice-strip">Переговоры завершены. Организация подготовила контракт на один бой. Проверь условия перед подписанием.</div><div class="row"><span>Гонорар за выход</span><b>$${fmt(purse)}</b></div><div class="row"><span>Бонус за победу</span><b>$${fmt(winBonus)}</b></div><div class="row"><span>PPV</span><b>${ppv}%</b></div><div class="row"><span>Соперник</span><b>#${x.rank||'—'} • ${x.opponent?.name||''}</b></div><div class="row"><span>Раунды</span><b>${x.rounds||3}</b></div><div class="row"><span>Тип</span><b>${x.type||'Бой'}</b></div><div class="row"><span>Дата</span><b>${typeof dateLabel==='function'?dateLabel(x.date):x.date}</b></div></section><div class="sheet-actions"><button data-contract-cancel>Назад</button><button class="primary" data-contract-sign>Подписать бой</button></div>`;sheet.querySelector('[data-contract-sign]').onclick=()=>{x.contractTerms.signed=true;x.signedFightContract=true;saveSafe();closeSafe();try{if(typeof notify==='function')notify(`${f.name}: контракт на бой подписан.`)}catch(e){}try{if(typeof toast==='function')toast('Контракт на бой подписан')}catch(e){}};sheet.querySelector('[data-contract-cancel]').onclick=()=>{closeSafe()}}
let initialized=false,seen='';
function tick(){const f=getF();if(!f){setTimeout(tick,400);return}const ss=sig(f);if(!initialized){seen=ss;initialized=true;setTimeout(tick,400);return}if(ss&&ss!==seen&&!f.nextFight?.signedFightContract){seen=ss;openContract(f)}else if(!ss){seen=''}setTimeout(tick,350)}
setTimeout(tick,500);

/* V76: opponent-profile navigation + randomized market. Existing mechanics remain intact. */
(function(){
  let originalProfile=null, originalMarket=null, profileCtx=null;
  const st=()=>{try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}};
  const safeSave=()=>{try{if(typeof save==='function')save()}catch(e){}};
  const msg=t=>{try{if(typeof toast==='function')toast(t)}catch(e){}};
  function installProfile(){
    if(originalProfile||typeof window.profile!=='function')return;
    originalProfile=window.profile;
    window.profile=function(f,back){profileCtx={fighter:f||null,back:back||'roster'};return originalProfile.apply(this,arguments)};
  }
  function backProfile(){
    try{closeSafe();const back=profileCtx?.back||'roster';
      if(back==='market'&&typeof market==='function'){market();return}
      if(back==='match'&&window.MM_ORGANIZATION_V72?.open){window.MM_ORGANIZATION_V72.open();return}
      if(typeof page==='function')page(back);
    }catch(e){msg('Не удалось вернуться назад')}
  }
  function installProfileButtons(){
    if(!profileCtx?.fighter)return;
    const sheet=document.getElementById('sheet'),modal=document.getElementById('modal');if(!sheet||!modal?.classList.contains('open'))return;
    sheet.querySelectorAll('button').forEach(b=>{
      if(b.__mmV76)return;
      const text=(b.textContent||'').trim().toLowerCase();
      if(text==='назад'){
        b.__mmV76=true;b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();backProfile()};
      }else if(text.includes('вести дела')||text.includes('управлять')){
        b.__mmV76=true;b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();try{closeSafe();if(typeof manageFighter==='function')manageFighter(profileCtx.fighter);else if(typeof negotiate==='function')negotiate(profileCtx.fighter)}catch(err){msg('Не удалось открыть управление бойцом')}}};
      }
    });
  }
  function installMarket(){
    if(originalMarket||typeof window.market!=='function')return;
    originalMarket=window.market;
    window.market=function(){
      const x=st();if(x){try{
        const pool=(x.world||[]).filter(f=>!x.fighters?.some(a=>a.id===f.id)&&!f.contract&&Number(f.rating||0)<82);
        if(pool.length>=5){for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}x.marketPool=pool.slice(0,5).map(f=>f.id);x.marketRefresh=x.day;safeSave();}
      }catch(e){}}
      return originalMarket.apply(this,arguments);
    };
  }
  function bindRefresh(){
    const b=document.querySelector('[data-refresh-market]');if(!b||b.__mmV76)return;b.__mmV76=true;
    b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();const x=st();if(!x)return;const pool=(x.world||[]).filter(f=>!x.fighters?.some(a=>a.id===f.id)&&!f.contract&&Number(f.rating||0)<82);if(!pool.length){msg('Сейчас нет доступных свободных бойцов');return}for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}x.marketPool=pool.slice(0,5).map(f=>f.id);x.marketRefresh=x.day;safeSave();if(typeof market==='function')market()};
  }
  function loop(){installProfile();installMarket();installProfileButtons();bindRefresh();setTimeout(loop,500)}
  setTimeout(loop,250);
})();
})();