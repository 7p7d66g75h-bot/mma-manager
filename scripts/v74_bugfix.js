(function(){'use strict';
const ID='MMA_MANAGER_V74_BUGFIX';
if(window[ID])return;window[ID]=true;

/* ---------- ROUND GATE ----------
   A round may advance only after its timer has actually run and reached 0:00.
   We intentionally do not trust the mere presence/state of the Next Round button.
*/
const st={roundKey:null,sawRunning:false,consumed:false,lastText:''};
function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim()}
function visible(el){if(!el)return false;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity||'1')>0&&r.width>0&&r.height>0}
function getRoundKey(){
  const nodes=[...document.querySelectorAll('.round,[data-round],.fightbox')].filter(visible);
  const t=nodes.map(text).join(' ');
  const m=t.match(/(?:РАУНД|ROUND)\s*([0-9]+)/i);
  return m?m[1]:null;
}
function getClock(){
  const clocks=[...document.querySelectorAll('.clock,[data-round-clock]')].filter(visible);
  for(const el of clocks){
    const m=text(el).match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
    if(m)return Number(m[1])*60+Number(m[2]);
  }
  return null;
}
function nextButtons(){
  return [...document.querySelectorAll('#nextRoundBtn,button')].filter(b=>visible(b)&&/следующ(?:ий|ая)\s+раунд|next\s+round/i.test(text(b)));
}
function lockButtons(){for(const b of nextButtons()){b.disabled=true;b.classList.add('v74-round-locked');b.style.pointerEvents='none';b.style.display='none'}}
function unlockButtons(){for(const b of nextButtons()){b.disabled=false;b.classList.remove('v74-round-locked');b.style.pointerEvents='auto';b.style.display=''}}
function gate(){
  const bs=nextButtons();if(!bs.length)return;
  const key=getRoundKey();const clock=getClock();
  if(key!==st.roundKey){st.roundKey=key;st.sawRunning=false;st.consumed=false;st.lastText='';lockButtons()}
  if(clock!==null && clock>0){st.sawRunning=true;st.consumed=false;lockButtons();return}
  if(clock===0 && st.sawRunning && !st.consumed){unlockButtons();return}
  lockButtons();
}
setInterval(gate,50);
new MutationObserver(gate).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','class','disabled']});
document.addEventListener('click',function(e){
  const b=e.target.closest?.('#nextRoundBtn,button');
  if(!b||!(/следующ(?:ий|ая)\s+раунд|next\s+round/i.test(text(b))))return;
  const clock=getClock();
  if(!st.sawRunning||clock!==0||st.consumed){e.preventDefault();e.stopImmediatePropagation();gate();return}
  st.consumed=true;lockButtons();
},true);

/* ---------- REFUSAL DISCIPLINE ----------
   Refusing the same opponent repeatedly must never directly fire the manager.
   Three refusals trigger suspension first. A later threshold while already on
   the discipline track can trigger dismissal; the first threshold is always a
   suspension, never a firing.
*/
function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
function fighter(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
function day(){return Number(state()?.day||1)}
function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
function closeSafe(){try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}}
function notify(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function recInit(f){
  f.refusalDiscipline=f.refusalDiscipline&&typeof f.refusalDiscipline==='object'?f.refusalDiscipline:{};
  const d=f.refusalDiscipline;
  d.total=Math.max(0,Number(d.total)||0);
  d.level=Math.max(0,Number(d.level)||0);
  d.suspensions=Math.max(0,Number(d.suspensions)||0);
  d.byOpponent=d.byOpponent&&typeof d.byOpponent==='object'?d.byOpponent:{};
  d.suspendedUntil=Math.max(0,Number(d.suspendedUntil)||0);
  return d;
}
function getOffer(index,f){const arr=Array.isArray(f.organizationOffers)?f.organizationOffers:[];return arr[Number(index)]}
function renderRemaining(f){
  const arr=f.organizationOffers||[];
  if(arr.length&&typeof renderOffers==='function'){renderOffers(f,arr);return true}
  if(arr.length&&typeof renderOfferList==='function'){renderOfferList(f,arr);return true}
  closeSafe();if(typeof page==='function')page('home');return false;
}
function customRefuse(f,o){
  if(!f||!o)return;
  const d=recInit(f);
  const oppId=String(o.opponent?.id||o.opponent?.name||'unknown');
  d.total++;
  d.byOpponent[oppId]=Math.max(0,Number(d.byOpponent[oppId])||0)+1;
  f.refusalHistory=Array.isArray(f.refusalHistory)?f.refusalHistory:[];
  f.refusalHistory.push({day:day(),type:'free',opponentId:oppId,opponent:o.opponent?.name||'',org:o.org});
  f.reputationHooks=f.reputationHooks||{accepted:0,refused:0,majorRefusals:0};
  f.reputationHooks.refused=Number(f.reputationHooks.refused||0)+1;

  const arr=(f.organizationOffers||[]).filter(x=>x.id!==o.id);
  f.organizationOffers=arr;

  // Every third refusal enters suspension BEFORE any possible dismissal.
  if(d.total%3===0){
    const suspensionDays=14;
    d.suspensions++;
    d.suspendedUntil=Math.max(Number(d.suspendedUntil)||0,day()+suspensionDays);
    d.level=Math.max(d.level,1);
    f.offerCooldownUntil=Math.max(Number(f.offerCooldownUntil)||0,d.suspendedUntil);
    // Never allow the old refusal routine to fire the manager here.
    saveSafe();closeSafe();if(typeof page==='function')page('home');
    notify(`Дисциплинарное взыскание: отстранение на ${suspensionDays} дней. Увольнения за этот отказ нет.`);
    return;
  }
  saveSafe();
  if(arr.length){renderRemaining(f);notify(`Бой с ${o.opponent?.name||'соперником'} отклонён. Остальные предложения доступны.`);return}
  closeSafe();if(typeof page==='function')page('home');
  const cooldown=Math.max(Number(f.offerCooldownUntil)||0,day()+7);
  f.offerCooldownUntil=cooldown;saveSafe();
  notify(`Предложение отклонено. Новые предложения будут недоступны ${Math.max(1,cooldown-day())} дней.`);
}

document.addEventListener('click',function(e){
  const b=e.target.closest?.('[data-v70-refuse]');if(!b)return;
  const f=fighter();if(!f||f.contract)return; // contract refusals keep their dedicated contract rules
  const o=getOffer(b.dataset.v70Refuse,f);if(!o)return;
  e.preventDefault();e.stopImmediatePropagation();
  customRefuse(f,o);
},true);

})();
