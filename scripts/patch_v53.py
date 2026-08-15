from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'MMA_MANAGER_V53_PRESERVE_MECHANICS' in s:
    raise SystemExit(0)

s=s.replace('const BUILD="MMA_MANAGER_V52_CONTRACT_FIX";', 'const BUILD="MMA_MANAGER_V53_PRESERVE_MECHANICS";', 1)
s=s.replace('<title>MMA Manager V52 • Road to Champion</title>', '<title>MMA Manager V53 • Road to Champion</title>', 1)

# Preserve the existing contractTerms implementation and wrap it instead of replacing it.
if 'function contractTermsLegacy(' not in s:
    s=s.replace('function contractTerms(', 'function contractTermsLegacy(', 1)

css=r'''<style id="v53-preserve-mechanics-css">
.v53-contract-dock{position:fixed;z-index:45;left:0;right:0;bottom:61px;display:none;background:rgba(10,13,17,.97);border-top:1px solid #3a414b;box-shadow:0 -8px 24px #0008;padding:7px max(8px,env(safe-area-inset-left)) 7px max(8px,env(safe-area-inset-right));backdrop-filter:blur(12px)}
.v53-contract-dock.show{display:block}.v53-contract-inner{width:min(760px,100%);margin:auto;display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center}.v53-contract-main{min-width:0}.v53-contract-main b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v53-contract-main span{display:block;color:#8e98a4;font-size:10px;margin-top:2px}.v53-contract-dock button{min-height:38px;padding:7px 9px;font-size:10px}.v53-history-panel{position:fixed;z-index:2147483646;left:0;right:0;bottom:0;top:0;background:#000b;display:none;align-items:flex-end}.v53-history-panel.open{display:flex}.v53-history-sheet{width:min(760px,100%);max-height:80dvh;overflow:auto;background:#0b0f14;border:1px solid #303740;border-radius:15px 15px 0 0;padding:15px;margin:auto auto 0}.v53-history-entry{padding:10px 0;border-bottom:1px solid #292f37}.v53-history-entry:last-child{border-bottom:0}
</style>'''

js=r'''<script id="MMA_MANAGER_V53_PRESERVE_MECHANICS">
(function(){'use strict';
  // V53 is additive: old mechanics remain authoritative unless explicitly corrected below.
  const OLD_CONTRACT_TERMS = typeof contractTermsLegacy==='function' ? contractTermsLegacy : null;
  window.contractTerms = function(f,org){
    let base=OLD_CONTRACT_TERMS ? OLD_CONTRACT_TERMS(f,org) : {salary:0,purse:0};
    base=base||{};
    if(org && org.name==='UFC'){
      // UFC's established base contract must never collapse to regional-level money.
      const ufcBase=150000;
      const wins=Number(f?.wins||0);
      const experienceBonus=Math.min(50000,Math.max(0,wins-3)*10000);
      const salary=ufcBase+experienceBonus;
      base.salary=Math.max(Number(base.salary||0),salary);
      base.purse=Math.max(Number(base.purse||0),salary);
    }
    return base;
  };

  function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
  function current(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
  function ensure(f){if(!f)return;f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[]}
  function addHistory(f,status,reason,extra={}){ensure(f);f.contractHistory.unshift(Object.assign({org:f.contract?.org||f.formerContractOrg||f.currentFightLeague||'—',status,reason,day:s.day,date:typeof dateLabel==='function'?dateLabel(s.day):`День ${s.day}`},extra));f.contractHistory=f.contractHistory.slice(0,50)}

  function terminateContract(f){
    if(!f?.contract){toast('У бойца нет действующего контракта');return}
    const org=f.contract.org;
    const left=f.contract.fightsLeft ?? f.contract.length ?? 0;
    if(!confirm(`Расторгнуть контракт ${f.name} с ${org}?\n\nОставшиеся бои: ${left}.`))return;
    addHistory(f,'left','Контракт расторгнут менеджером',{fightsLeft:left});
    f.formerContractOrg=org;
    f.formerContractReason='Контракт расторгнут менеджером';
    f.contract=null;
    f.leagueOffers=[];
    f.matchmakeSeen=[];
    f.currentFightLeague=null;
    save();
    if(typeof updateRankings==='function')updateRankings();
    renderDock();
    if(typeof manageFighter==='function')manageFighter(f); else if(typeof page==='function')page('roster');
    toast(`${f.name}: контракт с ${org} расторгнут`);
  }

  function renderHistory(f){
    ensure(f);
    const entries=f.contractHistory||[];
    const old=document.getElementById('v53HistoryPanel');if(old)old.remove();
    const panel=document.createElement('div');panel.id='v53HistoryPanel';panel.className='v53-history-panel';
    panel.innerHTML=`<div class="v53-history-sheet"><div class="section-head"><h3>История контрактов</h3><span>${entries.length}</span></div>${entries.length?entries.map(h=>{const label={active:'ПОДПИСАН',ended:'ЗАВЕРШЁН',left:'РАСТОРГНУТ',fired:'УВОЛЕН',warning:'ПРЕДУПРЕЖДЕНИЕ',final_warning:'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ'}[h.status]||String(h.status||'СОБЫТИЕ').toUpperCase();return `<div class="v53-history-entry"><b>${esc(h.org||'Лига')} — ${label}</b><div class="muted">${esc(h.date||('День '+h.day))}${h.reason?' • '+esc(h.reason):''}</div>${h.fights?`<div class="muted">Контракт: ${h.fights} боёв • $${Number(h.salary||0).toLocaleString('ru-RU')} / бой</div>`:''}</div>`}).join(''):'<div class="muted">История контрактов пока пуста.</div>'}<div class="sheet-actions"><button id="v53HistoryClose">Закрыть</button></div></div>`;
    document.body.appendChild(panel);panel.classList.add('open');panel.addEventListener('click',e=>{if(e.target===panel||e.target.closest('#v53HistoryClose'))panel.remove()});
  }

  function renderDock(){
    let dock=document.getElementById('v53ContractDock');
    if(!dock){dock=document.createElement('div');dock.id='v53ContractDock';dock.className='v53-contract-dock';document.body.appendChild(dock)}
    const f=current();
    if(!f?.contract){dock.classList.remove('show');dock.innerHTML='';return}
    const c=f.contract;const left=c.fightsLeft??c.length??0;
    dock.innerHTML=`<div class="v53-contract-inner"><div class="v53-contract-main"><b>КОНТРАК • ${esc(c.org)}</b><span>${esc(f.name)} • осталось ${left} ${left===1?'бой':'боя'} • $${Number(c.salary||0).toLocaleString('ru-RU')} / бой</span></div><button data-v53-history>История</button><button class="red" data-v53-terminate>Расторгнуть</button></div>`;
    dock.classList.add('show');
  }

  // Fix the existing camp-change action without removing the original camp system.
  document.addEventListener('click',function(e){
    const change=e.target.closest?.('[data-change-camp]');
    if(change){
      e.preventDefault();e.stopImmediatePropagation();
      const f=current();if(!f)return;
      f.campChanging=true;save();if(typeof camp==='function')camp();return;
    }
    const style=e.target.closest?.('[data-campstyle]');
    if(style){
      e.preventDefault();e.stopImmediatePropagation();
      const f=current(),id=style.dataset.campstyle;if(!f||!id)return;
      f.campStyle=id;f.preferredCampStyle=id;f.campChanging=false;save();
      if(typeof camp==='function')camp();
    }
    if(e.target.closest?.('[data-v53-history]')){e.preventDefault();e.stopImmediatePropagation();const f=current();if(f)renderHistory(f)}
    if(e.target.closest?.('[data-v53-terminate]')){e.preventDefault();e.stopImmediatePropagation();terminateContract(current())}
  },true);

  // Make every newly rendered screen reflect the current fighter's contract.
  new MutationObserver(()=>{try{renderDock()}catch(e){}}).observe(document.body,{childList:true,subtree:true});
  setTimeout(renderDock,250);
  window.V53PreserveMechanics={terminateContract,renderHistory,renderDock};
})();
</script>'''

if '</head>' in s:
    s=s.replace('</head>',css+'</head>',1)
if '</body>' in s:
    s=s.replace('</body>',js+'\n</body>',1)
else:
    s += js

p.write_text(s,encoding='utf-8')
print('V53 preserve-mechanics patch applied')
