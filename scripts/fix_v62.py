from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Idempotent: replace our own layer if it already exists.
import re
s=re.sub(r'<script id="MMA_MANAGER_V62_FIX">.*?</script>\s*','',s,flags=re.S)

patch=r'''<script id="MMA_MANAGER_V62_FIX">
(function(){
  'use strict';
  const BUILD='MMA_MANAGER_V62_FIX';
  document.documentElement.dataset.build=BUILD;

  function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
  function orgName(f,h){return h?.org||f?.lastFight?.org||f?.contract?.org||f?.formerContractOrg||'—'}
  function historyKey(h){return [h.day,h.org,h.event,h.opponent,h.result,h.method,h.round].map(x=>String(x??'')).join('|')}

  // --- 1. Contract/fight history -----------------------------------------
  // Contract history is a separate aggregate from the general fight history.
  // One organization gets its own W-L-D + finish breakdown.
  function syncContractHistory(f){
    if(!f)return;
    f.contractHistoryByOrg=f.contractHistoryByOrg||{};
    f.contractHistoryLedger=Array.isArray(f.contractHistoryLedger)?f.contractHistoryLedger:[];
    const seen=new Set(f.contractHistoryLedger);
    const hs=Array.isArray(f.history)?f.history:[];
    for(const h of hs){
      const org=orgName(f,h); if(!org||org==='—')continue;
      const key=historyKey(h)+'|'+org;
      if(seen.has(key))continue;
      seen.add(key);
      const x=f.contractHistoryByOrg[org]||(f.contractHistoryByOrg[org]={wins:0,losses:0,draws:0,ko:0,sub:0,decision:0,fights:0});
      x.fights++;
      if(h.result==='W')x.wins++;else if(h.result==='L')x.losses++;else x.draws++;
      if(h.result==='W'){
        if(h.method==='KO/TKO')x.ko++;else if(h.method==='Submission')x.sub++;else x.decision++;
      }
      f.contractHistoryLedger.push(key);seen.add(key);
    }
    if(f.contractHistoryLedger.length>300)f.contractHistoryLedger=f.contractHistoryLedger.slice(-300);
  }
  function syncAllHistory(){try{(typeof allPool==='function'?allPool():[]).forEach(syncContractHistory);save()}catch(e){console.warn('V62 history sync',e)}}

  function historyHtml(f){
    syncContractHistory(f);
    const map=f.contractHistoryByOrg||{};
    const rows=Object.entries(map).sort((a,b)=>(b[1].fights||0)-(a[1].fights||0)).map(([org,x])=>{
      const finish=x.ko+x.sub;
      return `<div class="v62-contract-history-row"><div><b>${esc(org)}</b><small>${x.fights} ${x.fights===1?'бой':'боёв'} • ${x.ko} KO/TKO • ${x.sub} SUB • ${x.decision} DEC</small></div><strong>${x.wins}-${x.losses}-${x.draws}${finish?`, ${finish} досрочно`:''}</strong></div>`;
    }).join('');
    return `<section id="v62ContractHistory" class="panel v62-contract-history"><div class="section-head"><h3>История контрактов</h3><span>${Object.keys(map).length} орг.</span></div>${rows||'<div class="muted">После первого боя здесь появится статистика по организации.</div>'}</section>`;
  }
  function injectHistoryUI(){
    try{
      const sheet=document.getElementById('sheet'); if(!sheet)return;
      const eye=(sheet.querySelector('.eyebrow')?.textContent||'').trim();
      if(!/^PROFESSIONAL FIGHTER|^FREE AGENT/.test(eye))return;
      const f=typeof currentF==='function'?currentF():null;if(!f)return;
      syncContractHistory(f);
      const old=document.getElementById('v62ContractHistory');if(old)old.remove();
      const box=document.createElement('div');box.innerHTML=historyHtml(f);
      const panel=box.firstElementChild;
      const panels=[...sheet.querySelectorAll('.panel')];
      const target=panels.find(x=>(x.innerText||'').includes('Последние бои'))||panels[panels.length-1];
      if(target)target.before(panel);else sheet.appendChild(panel);
    }catch(e){console.warn('V62 history UI',e)}
  }

  // Poll only for a short period after a fight; also keep loaded saves normalized.
  let lastTick=0;
  function tick(){
    try{
      const fs=typeof allPool==='function'?allPool():[];
      fs.forEach(syncContractHistory);
      const now=Date.now();
      if(now-lastTick>1800){lastTick=now;save();}
      if(document.getElementById('sheet'))injectHistoryUI();
    }catch(e){}
    setTimeout(tick,500);
  }
  setTimeout(tick,300);

  // --- 2. Camp button -----------------------------------------------------
  document.addEventListener('click',function(e){
    const campBtn=e.target.closest?.('[data-campfighter],[data-act="camp"],[data-page="camp"],[data-open-camp]');
    if(!campBtn)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      if(campBtn.dataset.campfighter){
        const f=findById(campBtn.dataset.campfighter);
        if(f)s.selected=s.fighters.findIndex(x=>x.id===f.id);
      }
      save();camp();
    }catch(err){console.error('V62 camp',err);toast('Не удалось открыть лагерь')}
  },true);

  // --- 3. Matchmaking: always expose two viable opponents ----------------
  function v62Matchmake(){
    const f=typeof currentF==='function'?currentF():null;
    if(!f){toast('Выбери бойца');return}
    if(!f.agencyManaged){toast('Сначала подпиши бойца в своё агентство');return}
    if(f.nextFight){toast('У бойца уже есть назначенный бой');return}
    f.fightResolved=false;
    const contracted=!!f.contract;
    const eligibleOrgs=contracted
      ? ORGS.filter(o=>o.name===f.contract.org)
      : ORGS.filter(o=>o.name!=='DWCS'&&(s.managerRating||30)>=Math.max(20,o.unlock-10)).filter(o=>!isTopLeague(o.name)||topLeagueEligible(f,o.name));
    let candidates=[];
    const recent=new Set((f.history||[]).slice(0,4).map(h=>h.opponent).filter(Boolean));
    const fp=getPos(f);
    for(const org of eligibleOrgs){
      let pool=(s.world||[]).filter(x=>x&&x.id!==f.id&&!x.agencyManaged&&!x.retired&&!x.injury&&!x.nextFight&&x.weight===f.weight&&x.org===org.name&&!recent.has(x.name)&&(!isTopLeague(org.name)||topLeagueEligible(x,org.name)));
      // If the recent-rematch rule leaves too few choices, relax only that rule.
      if(pool.length<2){
        pool=(s.world||[]).filter(x=>x&&x.id!==f.id&&!x.agencyManaged&&!x.retired&&!x.injury&&!x.nextFight&&x.weight===f.weight&&x.org===org.name&&(!isTopLeague(org.name)||topLeagueEligible(x,org.name)));
      }
      pool.sort((a,b)=>{
        const ra=getPos(a),rb=getPos(b);
        const rankPenaltyA=(fp>0&&ra>0)?Math.abs(fp-ra)*2:0;
        const rankPenaltyB=(fp>0&&rb>0)?Math.abs(fp-rb)*2:0;
        return (Math.abs(ovr(a)-ovr(f))+rankPenaltyA)-(Math.abs(ovr(b)-ovr(f))+rankPenaltyB);
      });
      for(const o of pool.slice(0,3)){
        if(candidates.some(c=>c.opponent.id===o.id))continue;
        const rp=getPos(o),ranked=fp>0&&fp<=15&&rp>0&&rp<=15;
        const titleFight=!!f.title&&rp>0&&rp<=3;
        const five=titleFight||(ranked&&fp<=5&&rp<=5&&org.level>=8);
        const terms=contractTerms(f,org);
        candidates.push({opponent:o,org:org.name,rounds:five?5:3,date:s.day+rand(14,42),purse:Math.max(terms.purse,Math.round(terms.purse*.45)),rank:rp,event:choice(['Fight Night','Championship Series','Main Event','Fight Night Series'])+' #'+rand(10,99),ranked,titleFight,type:titleFight?'ТИТУЛЬНЫЙ БОЙ':(ranked?'РЕЙТИНГОВЫЙ БОЙ':'ОБЫЧНЫЙ БОЙ'),venue:choice(['Las Vegas Arena','Abu Dhabi Arena','Moscow Arena','New York','Riyadh Arena'])});
      }
    }
    candidates.sort((a,b)=>Math.abs(ovr(a.opponent)-ovr(f))-Math.abs(ovr(b.opponent)-ovr(f)));
    // Free fighters can see two offers; contracted fighters see two opponents in the same promotion.
    candidates=candidates.slice(0,2);
    if(candidates.length<2){
      const org=eligibleOrgs[0];
      if(org){
        const fallback=(s.world||[]).filter(x=>x&&x.id!==f.id&&!x.agencyManaged&&!x.retired&&!x.injury&&!x.nextFight&&x.weight===f.weight&&x.org===org.name);
        fallback.sort((a,b)=>Math.abs(ovr(a)-ovr(f))-Math.abs(ovr(b)-ovr(f)));
        for(const o of fallback){
          if(candidates.some(c=>c.opponent.id===o.id))continue;
          const terms=contractTerms(f,org);candidates.push({opponent:o,org:org.name,rounds:3,date:s.day+rand(14,42),purse:Math.max(terms.purse,Math.round(terms.purse*.45)),rank:getPos(o),event:'Fight Night #'+rand(10,99),ranked:false,titleFight:false,type:'ОБЫЧНЫЙ БОЙ',venue:'Арена'});
          if(candidates.length>=2)break;
        }
      }
    }
    if(!candidates.length){toast(contracted?`В ${f.contract.org} сейчас нет подходящего соперника.`:'Сейчас нет подходящих предложений. Попробуй позже.');return}
    document.getElementById('modal').classList.add('open');
    document.getElementById('sheet').innerHTML=`<div class="eyebrow">${contracted?'КОНТРАК • '+f.contract.org:'РЫНОК БОЁВ • СВОБОДНЫЙ БОЕЦ'}</div><h2>${contracted?'Бои в рамках контракта':'Предложения из разных лиг'}</h2><div class="muted">${f.flag||'🌍'} ${f.name} • ${f.weight} • OVR ${ovr(f)} • ${contracted?`${f.contract.fightsLeft}/${f.contract.length} боя по контракту`:'свободен от лиги'}</div><section class="panel"><div class="notice-strip">${contracted?`У бойца действует контракт с ${f.contract.org}. Другие лиги здесь не участвуют.`:'Это одноразовые бои. После каждого боя лига отдельно решает, предлагать ли долгий контракт.'}</div></section><div class="list" style="margin-top:11px">${candidates.map((c,i)=>`<div class="scout"><div class="fighter-top"><div class="scout-face">${emoji(c.opponent.style)}</div><div class="fighter-info"><div class="fighter-name">${c.opponent.flag||'🌍'} ${c.opponent.name}</div><div class="fighter-sub">${c.opponent.country} • ${c.opponent.style} • ${rec(c.opponent)} • #${c.rank||'—'}</div></div><div class="score">${ovr(c.opponent)}</div></div><div class="tags"><span class="tag">${c.org}</span><span class="tag">${c.type}</span><span class="tag">${c.rounds} раундов</span><span class="tag">${dateLabel(c.date)}</span><span class="tag">+$${c.purse.toLocaleString('ru-RU')}</span></div><div class="scout-actions"><button data-v62-profile="${i}">Профиль</button><button class="primary" data-v62-accept="${i}">Рассмотреть бой</button></div></div>`).join('')}</div><div class="sheet-actions"><button data-v62-close>Закрыть</button></div>`;
    document.querySelectorAll('[data-v62-profile]').forEach(b=>b.onclick=()=>profile(candidates[+b.dataset.v62Profile].opponent,'match'));
    document.querySelectorAll('[data-v62-accept]').forEach(b=>b.onclick=()=>{
      const c=candidates[+b.dataset.v62Accept];
      const min=Math.max(500,Math.round(c.purse*.65)),max=Math.round(c.purse*1.6);
      document.getElementById('sheet').innerHTML=`<div class="eyebrow">ПЕРЕГОВОРЫ О БОЕ</div><div class="title">${f.name} vs ${c.opponent.name}</div><div class="muted">${c.org} • ${c.event} • ${c.rounds} раундов • ${dateLabel(c.date)}</div><section class="panel"><div class="row"><span>Тип</span><b>${c.type}</b></div><div class="row"><span>Гонорар</span><b>$${c.purse.toLocaleString('ru-RU')}</b></div><div style="margin-top:9px"><label class="muted">Твой запрос, $</label><input id="v62FightSalary" class="input" type="number" min="${min}" max="${max}" value="${c.purse}"></div></section><div class="sheet-actions"><button data-v62-back>Назад</button><button class="primary" data-v62-propose>Предложить бой</button></div>`;
      document.querySelector('[data-v62-back]').onclick=()=>v62Matchmake();
      document.querySelector('[data-v62-propose]').onclick=()=>{
        const purse=Math.max(min,Math.min(max,Number(document.getElementById('v62FightSalary').value)||c.purse));
        const chance=Math.round(Math.max(15,Math.min(98,82-Math.max(0,purse-c.purse)/Math.max(1,c.purse)*70)));
        if(Math.random()*100>chance){toast('Лига отказалась от условий');return}
        f.fightResolved=false;
        f.nextFight={opponent:{...c.opponent},org:c.org,event:c.event,rounds:c.rounds,date:c.date,purse,rank:c.rank,ranked:!!c.ranked,type:c.type,titleFight:!!c.titleFight,venue:c.venue||'Арена',card:c.rounds===5?'MAIN EVENT':choice(['PRELIMS','MAIN CARD','CO-MAIN EVENT']),oneFight:!contracted};
        f.campWeek=1;f.campSchedule={};f.currentFightLeague=c.org;f.campStyle=f.campStyle||'balanced';
        save();closeModal();page('home');toast(`Бой согласован: ${c.org}`);
      };
    });
    document.querySelector('[data-v62-close]').onclick=closeModal;
  }
  window.matchmake=v62Matchmake;

  // A completed fight must never poison the next fight with the previous resolved flag.
  const oldSim=window.simulateFight;
  if(typeof oldSim==='function'&&!oldSim.__v62){
    const wrapped=function(f,n){
      if(f&&n&&f.nextFight&&f.nextFight.date===n.date&&f.nextFight.opponent?.id===n.opponent?.id)f.fightResolved=false;
      return oldSim.apply(this,arguments);
    };
    wrapped.__v62=true;window.simulateFight=wrapped;
  }

  // Re-open the fighter profile after every render and keep aggregate history current.
  const oldProfile=window.profile;
  if(typeof oldProfile==='function'&&!oldProfile.__v62){
    const wrappedProfile=function(f,back){syncContractHistory(f);return oldProfile.apply(this,arguments)};
    wrappedProfile.__v62=true;window.profile=wrappedProfile;
  }

  const style=document.createElement('style');
  style.textContent=`
    .v62-contract-history{border-color:#80672a;background:linear-gradient(145deg,#19160d,#0d1116)}
    .v62-contract-history-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #3a3220}
    .v62-contract-history-row:last-child{border-bottom:0}
    .v62-contract-history-row small{display:block;color:#8e98a4;font-size:10px;margin-top:3px}
    .v62-contract-history-row strong{color:#d5ae42;font-size:15px;white-space:nowrap}
  `;
  document.head.appendChild(style);
})();
</script>
'''

s=s.replace('</body>',patch+'\n</body>',1)
s=s.replace('MMA_MANAGER_V61_STABLE_FIX','MMA_MANAGER_V62_FIX',1)
s=s.replace('MMA Manager V61 • Road to Champion','MMA Manager V62 • Road to Champion',1)
p.write_text(s,encoding='utf-8')
print('V62 patch prepared')