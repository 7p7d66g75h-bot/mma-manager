from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'MMA_MANAGER_V54_PROFILE_HISTORY' in s:
    raise SystemExit(0)
if 'MMA_MANAGER_V53_PRESERVE_MECHANICS' not in s:
    raise SystemExit('V53 marker not found')
s=s.replace('MMA_MANAGER_V53_PRESERVE_MECHANICS','MMA_MANAGER_V54_PROFILE_HISTORY',1)
old='''  const OLD_CONTRACT_TERMS = typeof contractTermsLegacy === 'function' ? contractTermsLegacy : null;
  window.contractTerms = function(f,org){
    let base=OLD_CONTRACT_TERMS ? OLD_CONTRACT_TERMS(f,org) : {salary:0,purse:0};
    base=base||{};
    if(org && org.name==="UFC"){
      const ufcBase=150000;
      const wins=Number(f?.wins||0);
      const experienceBonus=Math.min(50000,Math.max(0,wins-3)*10000);
      const salary=ufcBase+experienceBonus;
      base.salary=Math.max(Number(base.salary||0),salary);
      base.purse=Math.max(Number(base.purse||0),salary);
    }
    return base;
  };'''
new='''  const OLD_CONTRACT_TERMS = typeof contractTermsLegacy === 'function' ? contractTermsLegacy : null;
  if(OLD_CONTRACT_TERMS) window.contractTerms = OLD_CONTRACT_TERMS;'''
if old in s:
    s=s.replace(old,new,1)
else:
    raise SystemExit('V53 UFC override block not found')
patch=r'''<script id="MMA_MANAGER_V54_PROFILE_HISTORY">
(function(){'use strict';
  const css=document.createElement('style');css.id='v54-css';css.textContent='.v53-contract-dock{display:none!important}.v54-history-overlay{position:fixed;inset:0;background:#000c;z-index:2147483647;display:flex;align-items:flex-end}.v54-history-sheet{width:min(760px,100%);max-height:90dvh;overflow:auto;background:#0b0f14;border:1px solid #303740;border-radius:15px 15px 0 0;padding:15px;margin:auto auto 0}.v54-history-entry{padding:10px 0;border-bottom:1px solid #292f37}.v54-history-entry:last-child{border-bottom:0}';document.head.appendChild(css);
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m))}
  function ensure(f){if(f)f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[]}
  function records(f){const m={};(f.history||[]).forEach(h=>{const o=h.org||'Неизвестная лига';m[o]??={w:0,l:0,d:0};if(h.result==='W')m[o].w++;else if(h.result==='L')m[o].l++;else if(h.result==='D')m[o].d++});return m}
  function showHistory(f){if(!f)return;ensure(f);document.getElementById('v54HistoryOverlay')?.remove();const rs=records(f),orgs=Object.keys(rs),rows=orgs.map(o=>`<div class="row"><span><b>${esc(o)}</b><br><span class="muted">Рекорд в лиге</span></span><b>${rs[o].w}-${rs[o].l}${rs[o].d?'-'+rs[o].d:''}</b></div>`).join('');const hist=f.contractHistory||[];const labels={active:'ПОДПИСАН',ended:'ЗАВЕРШЁН',left:'РАСТОРГНУТ',fired:'УВОЛЕН',warning:'ПРЕДУПРЕЖДЕНИЕ',final_warning:'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ'};const entries=hist.map(h=>`<div class="v54-history-entry"><b>${esc(h.org||'Лига')} — ${labels[h.status]||String(h.status||'СОБЫТИЕ').toUpperCase()}</b><div class="muted">${esc(h.date||('День '+(h.day||'')))}${h.reason?' • '+esc(h.reason):''}</div>${h.fights?`<div class="muted">${h.fights} боёв${h.salary!=null?' • $'+Number(h.salary).toLocaleString('ru-RU')+' / бой':''}</div>`:''}</div>`).join('');const ov=document.createElement('div');ov.id='v54HistoryOverlay';ov.className='v54-history-overlay';ov.innerHTML=`<div class="v54-history-sheet"><div class="eyebrow">КАРЬЕРА БОЙЦА</div><div class="title">История контрактов</div><section class="panel"><div class="section-head"><h3>Лиги и рекорды</h3><span>${orgs.length}</span></div>${rows||'<div class="muted">Боев в лигах пока нет.</div>'}</section><section class="panel"><div class="section-head"><h3>Контракты</h3><span>${hist.length}</span></div>${entries||'<div class="muted">История контрактов пока пуста.</div>'}</section><div class="sheet-actions"><button id="v54HistoryClose">Закрыть</button></div></div>`;document.body.appendChild(ov);ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('#v54HistoryClose'))ov.remove()})}
  function addHistoryButton(f){if(!f)return;const sheet=document.getElementById('sheet');if(!sheet)return;const actions=sheet.querySelector('.sheet-actions');if(!actions||actions.querySelector('[data-v54-history]'))return;const b=document.createElement('button');b.dataset.v54History='1';b.textContent='История контрактов';b.onclick=()=>showHistory(f);actions.prepend(b)}
  setTimeout(()=>{if(typeof window.profile==='function'&&!window.__v54ProfileWrap){const orig=window.profile;window.profile=function(f,back){window.__v54ProfileFighter=f;const r=orig.apply(this,arguments);setTimeout(()=>addHistoryButton(f),0);return r};window.__v54ProfileWrap=true}},0);
  document.addEventListener('click',e=>{const h=e.target.closest?.('[data-v54-history]');if(h){e.preventDefault();e.stopImmediatePropagation();showHistory(window.__v54ProfileFighter);return}const term=e.target.closest?.('[data-terminate-contract]');if(term){e.preventDefault();e.stopImmediatePropagation();const f=window.__v54ProfileFighter||currentF?.();if(f&&window.V53PreserveMechanics?.terminateContract)window.V53PreserveMechanics.terminateContract(f);return}const campBtn=e.target.closest?.('[data-profile-camp]');if(campBtn){e.preventDefault();e.stopImmediatePropagation();const f=window.__v54ProfileFighter||currentF?.();if(f){closeModal();const i=s.fighters.findIndex(x=>x.id===f.id);if(i>=0){s.selected=i;save();camp()}}return}},true);
  const d=document.getElementById('v53ContractDock');if(d)d.remove();
  if(window.V53PreserveMechanics)window.V53PreserveMechanics.renderDock=()=>{const d=document.getElementById('v53ContractDock');if(d)d.remove()};
  window.MMA_MANAGER_V54_PROFILE_HISTORY=true;
})();
</script>
'''
s=s.replace('</body>',patch+'</body>')
p.write_text(s,encoding='utf-8')
print('V54 patched')
