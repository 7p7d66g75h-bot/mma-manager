from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Remove old compatibility layers that this patch owns, then rebuild the stable layer.
s = re.sub(r'<script id="MMA_MANAGER_V60_FIX">.*?</script>\s*', '', s, flags=re.S)
s = re.sub(r'<script id="MMA_MANAGER_V61_FIX">.*?</script>\s*', '', s, flags=re.S)

patch = r'''
<script id="MMA_MANAGER_V61_FIX">
(function(){'use strict';
  // V61: matchmaking must never depend on the animated loader or a deferred frame.
  // The previous flow could leave "Подбираем соперника…" visible when the callback
  // chain was interrupted. We now run matchmaking synchronously and always clean UI.
  function hideLoader(){
    document.querySelectorAll('#speedLoader').forEach(e=>{e.classList.remove('show');e.style.display='none'});
  }
  function showLoader(){
    const nodes=document.querySelectorAll('#speedLoader');
    nodes.forEach(e=>{e.classList.remove('show');e.style.display='none'});
    const e=nodes[0];
    if(e){e.querySelector('span')?.replaceChildren(document.createTextNode('Подбираем соперника…'));e.classList.add('show');e.style.display='flex'}
  }
  function directMatchmake(){
    const f=typeof currentF==='function'?currentF():null;
    if(!f){toast('Выбери бойца');return}
    if(!f.agencyManaged){
      // Legacy saves may have roster fighters without the agency flag.
      if((s.fighters||[]).some(x=>x.id===f.id))f.agencyManaged=true;
      else {toast('Сначала подпиши бойца в своё агентство');return}
    }
    if(f.nextFight){toast('У бойца уже есть назначенный бой');return}
    showLoader();
    try{
      if(typeof _matchmakeHeavy!=='function')throw new Error('matchmaking function missing');
      _matchmakeHeavy();
    }catch(err){
      console.error('V61 matchmaking error',err);
      // Guaranteed fallback: find one same-weight world fighter without expensive indexing.
      try{
        const recent=new Set((f.history||[]).slice(0,5).map(h=>h.opponent).filter(Boolean));
        const pool=(s.world||[]).filter(x=>x&&x.id!==f.id&&!x.agencyManaged&&!x.retired&&!x.injury&&!x.nextFight&&x.weight===f.weight&&!recent.has(x.name));
        pool.sort((a,b)=>Math.abs(ovr(a)-ovr(f))-Math.abs(ovr(b)-ovr(f)));
        const o=pool[0];
        if(!o)throw err;
        const org=f.contract?.org||o.org||'ACA';
        const terms=typeof contractTerms==='function'?contractTerms(f,ORGS.find(x=>x.name===org)||ORGS.find(x=>x.name==='ACA')):{purse:5000};
        const candidate={opponent:o,org,event:'Fight Night #'+rand(10,99),rounds:3,date:s.day+14,purse:Math.max(500,terms.purse||5000),rank:getPos(o),ranked:false,type:'ОБЫЧНЫЙ БОЙ',titleFight:false};
        hideLoader();
        document.getElementById('modal').classList.add('open');
        document.getElementById('sheet').innerHTML=`<div class="eyebrow">МАТЧМЕЙКИНГ</div><div class="title">${f.name} vs ${o.name}</div><div class="muted">${candidate.org} • ${dateLabel(candidate.date)} • 3 раунда</div><section class="panel"><div class="row"><span>Соперник</span><b>${o.name}</b></div><div class="row"><span>Рекорд</span><b>${rec(o)}</b></div><div class="row"><span>Гонорар</span><b>$${candidate.purse.toLocaleString('ru-RU')}</b></div></section><div class="sheet-actions"><button data-v61-close>Закрыть</button><button class="primary" data-v61-accept>Предложить бой</button></div>`;
        document.querySelector('[data-v61-close]').onclick=closeModal;
        document.querySelector('[data-v61-accept]').onclick=()=>{f.nextFight={opponent:{...o},org:candidate.org,event:candidate.event,rounds:3,date:candidate.date,purse:candidate.purse,rank:candidate.rank,ranked:false,type:candidate.type,titleFight:false,venue:'Арена',card:'MAIN CARD',oneFight:!f.contract};f.currentFightLeague=candidate.org;f.campStyle=f.preferredCampStyle||defaultCampStyleForFighter(f);f.campWeek=1;f.campSchedule={};save();closeModal();page('home');toast('Бой согласован')};
        return;
      }catch(fallbackErr){
        toast('Не удалось подобрать соперника');
        console.error('V61 fallback matchmaking error',fallbackErr);
      }
    }finally{
      hideLoader();
    }
  }
  // Override the entry point used by every existing matchmaking button.
  window.matchmake=directMatchmake;
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('[data-fighter-match],[data-profile-match],[data-fighter-fight]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(b.dataset.fighterMatch!=null){
      const f=s.fighters[Number(b.dataset.fighterMatch)];
      if(f)s.selected=s.fighters.findIndex(x=>x.id===f.id);
    }
    directMatchmake();
  },true);
  window.MMA_MANAGER_V61_FIX=true;
})();
</script>
'''
s=s.replace('</body>',patch+'\n</body>',1)
s=s.replace('MMA_MANAGER_V60_STABLE_FIX','MMA_MANAGER_V61_STABLE_FIX')
s=s.replace('MMA_MANAGER_V59_STABLE_FIX','MMA_MANAGER_V61_STABLE_FIX')
s=s.replace('<title>MMA Manager V59 • Road to Champion</title>','<title>MMA Manager V61 • Road to Champion</title>')
s=s.replace('<title>MMA Manager V60 • Road to Champion</title>','<title>MMA Manager V61 • Road to Champion</title>')
p.write_text(s,encoding='utf-8')
print('patched',len(s))