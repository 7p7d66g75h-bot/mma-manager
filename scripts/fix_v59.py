from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# V59/V60 must be idempotent: the old V53 layer may already be gone.
s, _ = re.subn(r'<script id="MMA_MANAGER_V53_PRESERVE_MECHANICS">.*?</script>\s*', '', s, count=1, flags=re.S)

# Keep contract history only on fighter profiles and make the existing panel clickable.
new_history = r"""function v52HistoryUI(){try{
  const sheet=document.getElementById('sheet');
  if(!sheet)return;
  const old=sheet.querySelector('#v52HistoryPanel');
  if(old)old.remove();
  const eye=(sheet.querySelector('.eyebrow')?.textContent||'').trim();
  const isProfile=eye.startsWith('PROFESSIONAL FIGHTER')||eye.startsWith('FREE AGENT');
  if(!isProfile)return;
  const f=typeof currentF==='function'?currentF():null;
  if(!f)return;
  v52SyncCurrentContract(f);
  const entries=f.contractHistory||[];
  const box=document.createElement('section');
  box.id='v52HistoryPanel';
  box.className='panel v52-history';
  box.style.cursor='pointer';
  box.setAttribute('role','button');
  box.setAttribute('tabindex','0');
  box.innerHTML=`<div class="section-head"><h3>История контрактов</h3><span>${entries.length}</span></div><div class="muted">Нажми, чтобы посмотреть историю контрактов бойца.</div>`;
  const anchor=[...sheet.querySelectorAll('.panel')].find(x=>(x.innerText||'').includes('Контракт'));
  if(anchor)anchor.after(box);else sheet.appendChild(box);
  const open=()=>{
    const oldOverlay=document.getElementById('v52HistoryOverlay');if(oldOverlay)oldOverlay.remove();
    const ov=document.createElement('div');ov.id='v52HistoryOverlay';ov.className='v52-contract-overlay';
    ov.innerHTML=`<div class="v52-contract-card"><div class="section-head"><h3>История контрактов</h3><button id="v52HistoryClose">×</button></div><div class="muted" style="margin-bottom:12px">${f.name} • ${f.weight} • ${f.country||''}</div>${entries.length?entries.map(h=>{const label=h.status==='fired'?'УВОЛЕН':h.status==='ended'?'ЗАВЕРШЁН':h.status==='left'?'УШЁЛ САМ':h.status==='warning'?'ПРЕДУПРЕЖДЕНИЕ':h.status==='final_warning'?'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ':'ДЕЙСТВУЕТ';return `<div class="v52-history-entry"><b>${h.org||'Лига'} — ${label}</b><small>${h.date||dateLabel(h.day||s.day)}${h.reason?' • '+h.reason:''}</small>${h.fights?`<small>Контракт: ${h.fights} боёв • $${Number(h.salary||0).toLocaleString('ru-RU')} / бой</small>`:''}</div>`}).join(''):'<div class="muted">Контрактов пока нет.</div>'}<div class="sheet-actions" style="position:static;margin-top:14px"><button id="v52HistoryClose2" class="primary">Закрыть</button></div></div>`;
    document.body.appendChild(ov);
    const close=()=>ov.remove();
    ov.querySelector('#v52HistoryClose').onclick=close;
    ov.querySelector('#v52HistoryClose2').onclick=close;
    ov.addEventListener('click',e=>{if(e.target===ov)close()});
  };
  box.onclick=open;
  box.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')open()};
}catch(e){console.warn('V60 history UI',e)}}
"""
if 'function v52HistoryUI(){try{' in s:
    s, _ = re.subn(r'function v52HistoryUI\(\)\{try\{.*?\}\}\s*new MutationObserver', new_history + 'new MutationObserver', s, count=1, flags=re.S)

# One compatibility layer: existing contract termination + reliable camp selection.
patch = r"""
<script id="MMA_MANAGER_V60_FIX">
(function(){'use strict';
  function current60(){return typeof currentF==='function'?currentF():null}
  function addHistory60(f,status,reason,extra){
    if(!f)return;
    f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[];
    f.contractHistory.unshift(Object.assign({org:f.contract?.org||f.formerContractOrg||'—',status,reason,day:s.day,date:dateLabel(s.day)},extra||{}));
    f.contractHistory=f.contractHistory.slice(0,50);
  }
  function terminate60(f){
    if(!f?.contract){toast('У бойца нет действующего контракта');return}
    const org=f.contract.org,left=f.contract.fightsLeft??f.contract.length??0;
    const ov=document.createElement('div');ov.className='v52-contract-overlay';ov.id='v60TerminateOverlay';
    ov.innerHTML=`<div class="v52-contract-card"><div style="font-size:46px;text-align:center">⚠️</div><div class="eyebrow" style="text-align:center">РАСТОРЖЕНИЕ КОНТРАКТА</div><div class="v51-warning-title">Расторгнуть контракт?</div><div class="v51-warning-sub">${f.name} • ${org} • осталось ${left} боёв.</div><div class="sheet-actions" style="position:static;margin-top:18px"><button id="v60TermBack">Отмена</button><button id="v60TermYes" class="red">Да, расторгнуть</button></div></div>`;
    document.body.appendChild(ov);
    ov.querySelector('#v60TermBack').onclick=()=>ov.remove();
    ov.querySelector('#v60TermYes').onclick=()=>{addHistory60(f,'left','Контракт расторгнут менеджером',{fightsLeft:left});f.formerContractOrg=org;f.formerContractReason='Контракт расторгнут менеджером';f.contract=null;f.leagueOffers=[];f.currentFightLeague=null;save();ov.remove();profile(f,'roster');toast(`${f.name}: контракт с ${org} расторгнут`)};
  }
  document.addEventListener('click',function(e){
    const term=e.target.closest?.('[data-terminate-contract]');
    if(term){e.preventDefault();e.stopImmediatePropagation();terminate60(current60());return}
    const change=e.target.closest?.('[data-change-camp]');
    if(change){e.preventDefault();e.stopImmediatePropagation();const f=current60();if(!f)return;f.campChanging=true;f.campStyle=null;save();camp();return}
    const style=e.target.closest?.('[data-campstyle]');
    if(style){e.preventDefault();e.stopImmediatePropagation();const f=current60();if(!f)return;f.campStyle=style.dataset.campstyle;f.preferredCampStyle=style.dataset.campstyle;f.campChanging=false;save();camp();return}
  },true);

  // The profile/roster "Организовать бой" action must open matchmaking directly,
  // not navigate to the news/events screen.
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('[data-fighter-match]');
    if(b){
      e.preventDefault();e.stopImmediatePropagation();
      const f=s.fighters[Number(b.dataset.fighterMatch)];
      if(!f){toast('Боец не найден');return}
      s.selected=s.fighters.findIndex(x=>x.id===f.id);
      save();
      matchmake();
      return;
    }
  },true);

  // If the management sheet uses the existing button, make that button direct too.
  const oldManage=window.manageFighter;
  if(typeof oldManage==='function' && !oldManage.__v60Wrapped){
    window.manageFighter=oldManage;
    window.manageFighter.__v60Wrapped=true;
  }

  const st=document.createElement('style');
  st.textContent='.contract-terminate{display:block!important;width:100%;margin-top:9px}.v52-history{cursor:pointer}';
  document.head.appendChild(st);
  window.MMA_MANAGER_V60_FIX=true;
})();
</script>
"""
# Replace an existing V60 block rather than stacking copies.
s = re.sub(r'<script id="MMA_MANAGER_V60_FIX">.*?</script>\s*', '', s, count=1, flags=re.S)
s=s.replace('</body>', patch+'\n</body>', 1)
s=s.replace('MMA_MANAGER_V53_PRESERVE_MECHANICS','MMA_MANAGER_V60_STABLE_FIX',1)
s=s.replace('MMA_MANAGER_V59_STABLE_FIX','MMA_MANAGER_V60_STABLE_FIX',1)
s=s.replace('<title>MMA Manager V53 • Road to Champion</title>','<title>MMA Manager V60 • Road to Champion</title>',1)
s=s.replace('<title>MMA Manager V59 • Road to Champion</title>','<title>MMA Manager V60 • Road to Champion</title>',1)

# Directly fix the existing management button: keep the same button, change only its action.
old='document.querySelector("[data-fighter-fight]").onclick=()=>{closeModal();page("events")}'
new='document.querySelector("[data-fighter-fight]").onclick=()=>{closeModal();s.selected=s.fighters.findIndex(x=>x.id===f.id);save();matchmake()}'
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('patched',len(s))