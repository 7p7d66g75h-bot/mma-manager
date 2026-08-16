(function(){'use strict';
const ID='MMA_MANAGER_V75_REFUSAL_FIX';
if(window[ID])return;window[ID]=true;

function getState(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
function getFighter(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
function day(){return Number(getState()?.day||1)}
function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
function closeSafe(){try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}}
function notifySafe(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function offerAt(f,index){const a=Array.isArray(f?.organizationOffers)?f.organizationOffers:[];return a[Number(index)]}

/*
  RULE: the FIRST refusal of an offered opponent immediately suspends the fighter.
  The offer window is closed and the entire current batch is discarded. This makes
  it impossible to click Refuse on the same opponent two or three times.
*/
function applyRefusal(f,o){
  if(!f||!o)return;
  f.refusalDiscipline=f.refusalDiscipline&&typeof f.refusalDiscipline==='object'?f.refusalDiscipline:{};
  const d=f.refusalDiscipline;
  d.total=Math.max(0,Number(d.total)||0)+1;
  d.suspensions=Math.max(0,Number(d.suspensions)||0)+1;
  d.level=Math.max(1,Number(d.level)||0);
  d.suspendedUntil=Math.max(Number(d.suspendedUntil)||0,day()+14);
  const oppId=String(o.opponent?.id||o.opponent?.name||'unknown');
  d.byOpponent=d.byOpponent&&typeof d.byOpponent==='object'?d.byOpponent:{};
  d.byOpponent[oppId]=Math.max(0,Number(d.byOpponent[oppId])||0)+1;
  f.refusedOpponentIds=Array.isArray(f.refusedOpponentIds)?f.refusedOpponentIds:[];
  if(!f.refusedOpponentIds.includes(oppId))f.refusedOpponentIds.push(oppId);
  f.refusalHistory=Array.isArray(f.refusalHistory)?f.refusalHistory:[];
  f.refusalHistory.push({day:day(),type:'opponent_refusal',opponentId:oppId,opponent:o.opponent?.name||'',org:o.org});
  f.reputationHooks=f.reputationHooks||{accepted:0,refused:0,majorRefusals:0};
  f.reputationHooks.refused=Number(f.reputationHooks.refused||0)+1;
  f.offerCooldownUntil=d.suspendedUntil;

  /* Discard the whole batch, not just the clicked card. */
  f.organizationOffers=[];
  f.leagueOffers=[];
  f.refusalOfferBatchSize=0;
  saveSafe();
  closeSafe();
  if(typeof page==='function')page('home');
  notifySafe('Отказ от боя: отстранение на 14 дней. Окно выбора соперника закрыто. После отстранения будут сформированы новые предложения.');
}

/* Window capture fires before the old V74 document-capture handler. */
window.addEventListener('click',function(e){
  const b=e.target.closest?.('[data-v70-refuse]');
  if(!b)return;
  const f=getFighter();
  const o=offerAt(f,b.dataset.v70Refuse);
  if(!f||!o)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  applyRefusal(f,o);
},true);

/* Prevent a refused opponent from returning in the next generated offer batch. */
(function patchAvailableOpponent(){
  if(window.__V75_AVAILABLE_PATCH)return;
  window.__V75_AVAILABLE_PATCH=true;
  const old=window.availableOpponent;
  if(typeof old!=='function')return;
  window.availableOpponent=function(f,x){
    if(!old(f,x))return false;
    const ids=Array.isArray(f?.refusedOpponentIds)?f.refusedOpponentIds.map(String):[];
    const id=String(x?.id||x?.name||'');
    return !ids.includes(id);
  };
})();
})();
