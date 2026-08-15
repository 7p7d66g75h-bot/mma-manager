from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if 'MMA_MANAGER_V52_CONTRACT_FIX' in s:
    raise SystemExit(0)

# V51 accidentally duplicated the acceptance discipline bonus call three times.
s = s.replace(
    '     acceptFightDisciplineBonus(f);\n     acceptFightDisciplineBonus(f);\n     acceptFightDisciplineBonus(f);',
    '     acceptFightDisciplineBonus(f);',
    1,
)

# Mark the current league contract in history when it is accepted through the actual offers UI.
old_accept = 'f.contract={org:x.org,length:x.fights,fightsLeft:x.fights,salary:x.salary,fee:0,source:"league_offer"};f.leagueOffers=[];logNews(`${f.name} принял контракт ${x.org}: ${x.fights} боя.`);save();closeModal();page("roster");toast(`${f.name}: контракт с ${x.org}`)'
new_accept = 'f.contract={org:x.org,length:x.fights,fightsLeft:x.fights,salary:x.salary,fee:0,source:"league_offer"};f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[];f.contractHistory.unshift({org:x.org,status:"active",reason:"Подписан контракт",day:s.day,date:dateLabel(s.day),fights:x.fights,salary:x.salary});f.leagueOffers=[];logNews(`${f.name} принял контракт ${x.org}: ${x.fights} боя.`);save();closeModal();page("roster");toast(`${f.name}: контракт с ${x.org}`)'
s = s.replace(old_accept, new_accept, 1)

css = r'''<style id="contract-fix-v52-css">
.v52-contract-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,.96)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;overflow:auto!important}.v52-contract-card{width:min(700px,100%);max-height:94dvh;overflow:auto;background:linear-gradient(155deg,#171b21,#080b0f);border:2px solid #9b2d2d;border-radius:18px;padding:22px;box-shadow:0 25px 100px #000}.v52-reasons{display:grid;gap:7px;margin-top:12px}.v52-reasons button{text-align:left}.v52-reasons button.selected{border-color:#d5ae42;background:#292314}.v52-risk{margin:14px 0;padding:13px;border:1px solid #653838;background:#211416;border-radius:10px}.v52-history{margin-top:10px}.v52-history-entry{padding:10px 0;border-bottom:1px solid #2b3138}.v52-history-entry:last-child{border-bottom:0}.v52-history-entry small{display:block;color:#8e98a4;margin-top:3px}.v52-active{color:#63c78a}.v52-fired{color:#dc7777}.v52-ended{color:#d5ae42}.v52-left{color:#8eb4e6}
</style>'''

js = r'''<script id="MMA_MANAGER_V52_CONTRACT_FIX">
(function(){'use strict';
const V52_REASONS={injury:'Травма / плохое состояние',weight:'Проблемы со сгонкой веса',camp:'Слишком короткий срок подготовки',opponent:'Слишком сильный соперник',money:'Не устроили условия',personal:'Личные причины',refuse:'Просто отказался'};
function v52Ensure(f){if(!f)return;f.contractHistory=Array.isArray(f.contractHistory)?f.contractHistory:[];f.discipline=f.discipline||{};f.discipline.refusals=Array.isArray(f.discipline.refusals)?f.discipline.refusals:[];}
function v52Recent(f){v52Ensure(f);const cutoff=(s.day||1)-180;f.discipline.refusals=f.discipline.refusals.filter(x=>Number(x.day||0)>cutoff);return f.discipline.refusals;}
function v52AddHistory(f,entry){v52Ensure(f);f.contractHistory.unshift(entry);if(f.contractHistory.length>50)f.contractHistory.length=50;}
function v52Level(n){return n>=3?'ВЫСОКИЙ РИСК':n===2?'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ':n===1?'ПРЕДУПРЕЖДЕНИЕ':'НОРМА';}
function v52ShowWarning(f,offer){
 v52Ensure(f);const old=document.getElementById('v52ContractWarning');if(old)old.remove();const n=v52Recent(f).length;const ov=document.createElement('div');ov.id='v52ContractWarning';ov.className='v52-contract-overlay';
 ov.innerHTML=`<div class="v52-contract-card"><div style="font-size:54px;text-align:center">⚠️</div><div class="eyebrow" style="text-align:center">ДЕЙСТВУЮЩИЙ КОНТРАК • ${String(f.contract?.org||'Лига')}</div><div class="v51-warning-title">Вы уверены, что хотите отказаться?</div><div class="v51-warning-sub">Вы можете отказаться от боя, но лига учитывает такие решения в дисциплинарной истории.</div><div class="v52-risk"><b>Внимание:</b> частые отказы могут привести к расторжению контракта с вами.</div><div class="row"><span>Отказов за последние 180 дней</span><b>${n}</b></div><div class="row"><span>Текущий риск</span><b>${v52Level(n)}</b></div><div class="eyebrow" style="margin-top:14px">ПОЧЕМУ ОТКАЗЫВАЕТЕСЬ?</div><div class="v52-reasons">${Object.entries(V52_REASONS).map(([k,v],i)=>`<button data-v52-reason="${k}" class="${i===0?'selected':''}">${v}</button>`).join('')}</div><div class="sheet-actions" style="position:static;margin-top:16px"><button id="v52Back" >Вернуться к предложению</button><button id="v52Confirm" class="red">Да, отказаться</button></div></div>`;
 document.body.appendChild(ov);let reason='injury';ov.querySelectorAll('[data-v52-reason]').forEach(b=>b.onclick=()=>{reason=b.dataset.v52Reason;ov.querySelectorAll('[data-v52-reason]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 ov.querySelector('#v52Back').onclick=()=>ov.remove();
 ov.querySelector('#v52Confirm').onclick=()=>{
   const org=f.contract?.org||offer?.org||'Лига';const day=s.day||1;const arr=v52Recent(f);arr.push({day,org,reason,opponent:offer?.opponent?.name||'',type:offer?.type||'contract_fight'});const total=arr.length;f.discipline.trust=Math.max(0,100-total*18);
   if(total===1){v52AddHistory(f,{org,status:'warning',reason:`Отказ: ${V52_REASONS[reason]}`,day,date:dateLabel(day)});}
   else if(total===2){v52AddHistory(f,{org,status:'final_warning',reason:`Отказ: ${V52_REASONS[reason]}`,day,date:dateLabel(day)});}
   else {v52AddHistory(f,{org,status:'fired',reason:`Уволен лигой: ${total} отказа за 180 дней`,day,date:dateLabel(day)});f.formerContractOrg=org;f.formerContractReason=`Уволен лигой: частые отказы от боёв (${total} за 180 дней)`;f.contract=null;f.leagueFired=true;f.leagueFiredDay=day;f.org='Свободный агент';f.orgLevel=0;}
   f.discipline.warnings=Math.max(Number(f.discipline.warnings||0),Math.min(total,3));
   if(typeof logNews==='function')logNews(`${f.name}: ${total>=3?'контракт расторгнут из-за частых отказов':total===2?'получено последнее предупреждение':'получено предупреждение'} (${org}).`,'CONTRACT');
   save();ov.remove();closeModal();page('home');toast(total>=3?'Контракт расторгнут':total===2?'Последнее предупреждение':'Предупреждение лиги');
 };
}

// The original V51 handler listened for data-decline-offer, but the real matchmaking screen uses data-refuse.
// Capture the real button before its old onclick handler and replace the contracted-fighter path.
document.addEventListener('click',function(e){const btn=e.target.closest?.('[data-refuse]');if(!btn)return;const f=typeof currentF==='function'?currentF():null;if(!f?.contract)return;e.preventDefault();e.stopImmediatePropagation();v52ShowWarning(f,{org:f.contract.org});},true);

// Replace the real offers renderer so accepting a league contract always creates a durable history entry.
const oldRenderOffersOnly=window.renderOffersOnly;
window.renderOffersOnly=function(f,offers){
 if(!f)return;if(!Array.isArray(offers))offers=[];f.leagueOffers=offers;
 const sheet=document.getElementById('sheet');if(!sheet)return;
 sheet.innerHTML=`<div class="eyebrow">ПРЕДЛОЖЕНИЯ ОТ ЛИГ</div><div class="title">${f.name}</div><div class="muted">Предложения появились после результата. Ты не обязан принимать ни одно.</div><section class="panel">${offers.map((x,i)=>`<div class="event" style="margin-top:9px"><div class="section-head"><b>${x.org}</b><span class="gold">${x.fights} боя</span></div><div class="row"><span>Гонорар</span><b>$${Number(x.salary||0).toLocaleString('ru-RU')} / бой</b></div><div class="actions"><button class="primary" data-v52-accept-offer="${i}">Принять</button><button data-v52-decline-offer="${i}">Отказать</button></div></div>`).join('')}</section><div class="sheet-actions"><button data-v52-offers-done>Закончить</button></div>`;
 sheet.querySelector('[data-v52-offers-done]').onclick=()=>{closeModal();page('home')};
 sheet.querySelectorAll('[data-v52-accept-offer]').forEach(btn=>btn.onclick=()=>{const x=offers[+btn.dataset.v52AcceptOffer];if(!x)return;f.contract={org:x.org,length:x.fights,fightsLeft:x.fights,salary:x.salary,fee:0,source:'league_offer'};v52AddHistory(f,{org:x.org,status:'active',reason:'Подписан контракт',day:s.day,date:dateLabel(s.day),fights:x.fights,salary:x.salary});f.leagueOffers=[];logNews(`${f.name} принял контракт ${x.org}: ${x.fights} боя.`);save();closeModal();page('roster');toast(`${f.name}: контракт с ${x.org}`)});
 sheet.querySelectorAll('[data-v52-decline-offer]').forEach(btn=>btn.onclick=()=>{offers.splice(+btn.dataset.v52DeclineOffer,1);f.leagueOffers=offers;if(!offers.length){closeModal();page('home');toast('Все предложения отклонены');return}window.renderOffersOnly(f,offers)});
};

// Seed the current contract into history for old saves, then expose history on the fighter profile.
function v52SyncCurrentContract(f){v52Ensure(f);if(f.contract){const exists=f.contractHistory.some(h=>h.status==='active'&&h.org===f.contract.org);if(!exists)v52AddHistory(f,{org:f.contract.org,status:'active',reason:'Действующий контракт',day:f.contract.started||s.day,date:dateLabel(f.contract.started||s.day),fights:f.contract.length,salary:f.contract.salary});}}
function v52HistoryUI(){try{const sheet=document.getElementById('sheet');if(!sheet)return;const f=typeof currentF==='function'?currentF():null;if(!f)return;v52SyncCurrentContract(f);let box=document.getElementById('v52HistoryPanel');if(box)box.remove();const entries=f.contractHistory||[];box=document.createElement('section');box.id='v52HistoryPanel';box.className='panel v52-history';box.innerHTML=`<div class="section-head"><h3>История контрактов</h3><span>${entries.length}</span></div>${entries.length?entries.map(h=>{const cls=h.status==='fired'?'v52-fired':h.status==='ended'?'v52-ended':h.status==='left'?'v52-left':'v52-active';const label=h.status==='fired'?'УВОЛЕН':h.status==='ended'?'ЗАВЕРШЁН':h.status==='left'?'УШЁЛ САМ':h.status==='warning'?'ПРЕДУПРЕЖДЕНИЕ':h.status==='final_warning'?'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ':'ДЕЙСТВУЕТ';return`<div class="v52-history-entry"><b>${h.org||'Лига'} — <span class="${cls}">${label}</span></b><small>${h.date||dateLabel(h.day||s.day)}${h.reason?' • '+h.reason:''}</small>${h.fights?`<small>Контракт: ${h.fights} боёв • $${Number(h.salary||0).toLocaleString('ru-RU')} / бой</small>`:''}</div>`}).join(''):'<div class="muted">Контрактов пока нет.</div>'}`;const anchor=[...sheet.querySelectorAll('.panel')].find(x=>(x.innerText||'').includes('Контракт'));if(anchor)anchor.after(box);else sheet.appendChild(box);}catch(e){console.warn('V52 history UI',e)}}
new MutationObserver(()=>setTimeout(v52HistoryUI,0)).observe(document.body,{childList:true,subtree:true});setTimeout(v52HistoryUI,300);
window.MMA_MANAGER_V52_CONTRACT_FIX=true;
})();
</script>'''

if '</head>' in s:
    s = s.replace('</head>', css + '</head>', 1)
if '</body>' in s:
    s = s.replace('</body>', js + '\n</body>', 1)

# New cache/build marker.
s = s.replace('const BUILD="MMA_MANAGER_V51_CONTRACT_HISTORY";', 'const BUILD="MMA_MANAGER_V52_CONTRACT_FIX";', 1)
s = s.replace('<title>MMA Manager V51 • Road to Champion</title>', '<title>MMA Manager V52 • Road to Champion</title>', 1)

p.write_text(s, encoding='utf-8')
print('V52 patch applied')