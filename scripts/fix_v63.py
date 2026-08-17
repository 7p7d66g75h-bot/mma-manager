from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# V61 was an override layered on top of the original matchmaking system.
s=re.sub(r'<script id="MMA_MANAGER_V61_FIX">.*?</script>\s*', '', s, flags=re.S)
# Replace the V59 camp/history compatibility layer with a single stable handler.
s=re.sub(r'<script id="MMA_MANAGER_V59_FIX">.*?</script>\s*', '', s, flags=re.S)

patch=r'''<script id="MMA_MANAGER_V63_FIX">
(function(){'use strict';
  try{ if(typeof matchmake==='function') window.matchmake=matchmake; }catch(e){}
  function fighter(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
  function openCampFor(f){
    if(!f)return;
    const idx=(s.fighters||[]).findIndex(x=>x&&x.id===f.id);
    if(idx<0){toast('Боец не в ростере');return}
    s.selected=idx; save(); camp();
  }
  document.addEventListener('click',function(e){
    const change=e.target.closest?.('[data-change-camp]');
    if(change){e.preventDefault();e.stopImmediatePropagation();const f=fighter();if(!f)return;f.campChanging=true;f.campStyle=null;save();camp();return;}
    const style=e.target.closest?.('[data-campstyle]');
    if(style){e.preventDefault();e.stopImmediatePropagation();const f=fighter();if(!f)return;f.campStyle=style.dataset.campstyle;f.preferredCampStyle=style.dataset.campstyle;f.campChanging=false;save();camp();return;}
    const profileCamp=e.target.closest?.('[data-profile-camp]');
    if(profileCamp){e.preventDefault();e.stopImmediatePropagation();const f=fighter();openCampFor(f);return;}
  },true);
  function ensureHistory(f){f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[];}
  function orgRecords(f){const map={};const hs=Array.isArray(f.history)?f.history:[];for(const h of hs){const org=h.org||h.organization||f.formerContractOrg||f.contract?.org;if(!org)continue;const x=map[org]||(map[org]={w:0,l:0,d:0,ko:0,sub:0,fights:0});x.fights++;if(h.result==='W')x.w++;else if(h.result==='L')x.l++;else x.d++;if(h.result==='W'&&h.method==='KO/TKO')x.ko++;if(h.result==='W'&&h.method==='Submission')x.sub++;}const co=f.contract?.org;if(co&&!map[co])map[co]={w:0,l:0,d:0,ko:0,sub:0,fights:0};return map;}
  function renderOrgHistory(f){ensureHistory(f);const map=orgRecords(f);const entries=f.contractHistory||[];const rows=Object.entries(map).sort((a,b)=>b[1].fights-a[1].fights).map(([org,x])=>`<div class="v63-org-row"><div><b>${org}</b><small>${x.fights} боёв • ${x.ko} KO/TKO • ${x.sub} SUB</small></div><strong>${x.w}-${x.l}-${x.d}</strong></div>`).join('');const events=entries.map(h=>{const label=h.status==='fired'?'УВОЛЕН':h.status==='ended'?'ЗАВЕРШЁН':h.status==='left'?'УШЁЛ САМ':h.status==='warning'?'ПРЕДУПРЕЖДЕНИЕ':h.status==='final_warning'?'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ':'ДЕЙСТВУЕТ';return `<div class="v52-history-entry"><b>${h.org||'Лига'} — ${label}</b><small>${h.date||dateLabel(h.day||s.day)}${h.reason?' • '+h.reason:''}</small>${h.fights?`<small>Контракт: ${h.fights} боёв • $${Number(h.salary||0).toLocaleString('ru-RU')} / бой</small>`:''}</div>`}).join('');const ov=document.createElement('div');ov.id='v63HistoryOverlay';ov.className='v52-contract-overlay';ov.innerHTML=`<div class="v52-contract-card"><div class="section-head"><h3>История организаций</h3><button data-v63-close>×</button></div><div class="muted" style="margin-bottom:12px">${f.name} • рекорд отдельно в каждой организации</div><section class="panel"><div class="section-head"><h3>Рекорд по организациям</h3><span>${Object.keys(map).length}</span></div>${rows||'<div class="muted">После первого боя здесь появится рекорд организации.</div>'}</section><section class="panel"><div class="section-head"><h3>История контрактов</h3><span>${entries.length}</span></div>${events||'<div class="muted">Контрактов пока нет.</div>'}</section><div class="sheet-actions" style="position:static;margin-top:14px"><button class="primary" data-v63-close2>Закрыть</button></div></div>`;document.body.appendChild(ov);const close=()=>ov.remove();ov.querySelector('[data-v63-close]').onclick=close;ov.querySelector('[data-v63-close2]').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});}
  function historyButtonHandler(e){const b=e.target.closest?.('#v52HistoryPanel,.v52-history,.v51-contract-history');if(!b)return;const f=fighter();if(!f)return;e.preventDefault();e.stopImmediatePropagation();document.getElementById('v52HistoryOverlay')?.remove();document.getElementById('v63HistoryOverlay')?.remove();renderOrgHistory(f);}
  document.addEventListener('click',historyButtonHandler,true);
  const st=document.createElement('style');st.textContent='.v63-org-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #2b3138}.v63-org-row:last-child{border-bottom:0}.v63-org-row small{display:block;color:#8e98a4;font-size:10px;margin-top:3px}.v63-org-row strong{color:#d5ae42;font-size:17px;white-space:nowrap}#v52HistoryPanel,.v52-history{cursor:pointer;user-select:none;-webkit-user-select:none}';document.head.appendChild(st);window.MMA_MANAGER_V63_FIX=true;
})();
</script>
'''
s=s.replace('</body>',patch+'\n</body>',1)
s=s.replace('MMA_MANAGER_V61_RESTORED','MMA_MANAGER_V63_RESTORED').replace('MMA_MANAGER_V61_FIX','MMA_MANAGER_V63_FIX')
s=s.replace('<title>MMA Manager V61 • Road to Champion</title>','<title>MMA Manager V63 • Road to Champion</title>')
loader='<script src="scripts/organization_v64.js"></script>\n'
if loader not in s:s=s.replace('</body>',loader+'</body>',1)
# V79 must be loaded after the organization runtime. The V63 workflow regenerates index.html
# on every push, so this loader is part of the canonical patch and cannot disappear.
v79='<script src="scripts/v79_opponent_profile_fix.js?v=79"></script>\n'
if v79 not in s:s=s.replace('</body>',v79+'</body>',1)
p.write_text(s,encoding='utf-8')
print('V63 patched with V79 opponent profile runtime')
