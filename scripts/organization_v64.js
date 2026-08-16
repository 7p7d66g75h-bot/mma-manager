(function(){'use strict';
const V='MMA_MANAGER_ORG_RUNTIME_V70';
if(window.__MM_ORG_RUNTIME_V70)return;window.__MM_ORG_RUNTIME_V70=true;

function state(){try{return typeof s!=='undefined'?s:window.s}catch(e){return window.s}}
function fighter(){try{return typeof currentF==='function'?currentF():null}catch(e){return null}}
function day(){return Number(state()?.day||1)}
function num(v,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
function rnd(a,b){return typeof rand==='function'?rand(a,b):Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
function closeSafe(){try{if(typeof closeModal==='function')closeModal();else document.getElementById('modal')?.classList.remove('open')}catch(e){}}
function notifySafe(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function ovrSafe(f){try{return typeof ovr==='function'?ovr(f):num(f.rating,70)}catch(e){return num(f.rating,70)}}
function recSafe(f){try{return typeof rec==='function'?rec(f):`${f.wins||0}-${f.losses||0}-${f.draws||0}`}catch(e){return `${f.wins||0}-${f.losses||0}-${f.draws||0}`}}
function dateSafe(d){try{return typeof dateLabel==='function'?dateLabel(d):`День ${d}`}catch(e){return `День ${d}`}}
function orgs(){try{return typeof ORGS!=='undefined'?ORGS:Array.isArray(window.ORGS)?window.ORGS:[]}catch(e){return Array.isArray(window.ORGS)?window.ORGS:[]}}
function topLeague(name){return name==='UFC'||name==='PFL'}
function topEligible(f,name){try{return typeof topLeagueEligible==='function'?topLeagueEligible(f,name):(name==='UFC'?ovrSafe(f)>=78&&num(f.wins)>=8:ovrSafe(f)>=72&&num(f.wins)>=6)}catch(e){return true}}
function rankMap(org,w){const st=state();return new Map((st?.rankingsByOrg?.[org]?.[w]||[]).map(x=>[x.id,num(x.rank,999)]))}
function rankOf(f,org){return rankMap(org,f.weight).get(f.id)||999}
function ensure(f){if(!f)return;f.organizationOffers=Array.isArray(f.organizationOffers)?f.organizationOffers:[];f.leagueOffers=Array.isArray(f.leagueOffers)?f.leagueOffers:[];f.refusalHistory=Array.isArray(f.refusalHistory)?f.refusalHistory:[];f.reputationHooks=f.reputationHooks||{accepted:0,refused:0,majorRefusals:0}}
function recentOpponents(f){return new Set((f.history||[]).slice(0,4).map(h=>h.opponent).filter(Boolean))}
function availableOpponent(f,x){return !!(x&&x.id!==f.id&&!x.agencyManaged&&!x.retired&&!x.injury&&!x.nextFight&&x.weight===f.weight&&!recentOpponents(f).has(x.name))}

function candidatePool(f,org){
 const st=state();const world=Array.isArray(st?.world)?st.world:[];const rm=rankMap(org.name,f.weight);const fp=rankOf(f,org.name);const isChamp=!!f.title;
 let pool=world.filter(x=>availableOpponent(f,x)&&x.org===org.name);
 const filtered=pool.filter(x=>{const r=rm.get(x.id)||999;if(isChamp)return r>=1&&r<=8;if(fp<=15)return r>=1&&r<=15&&Math.abs(r-fp)<=8;return Math.abs(ovrSafe(x)-ovrSafe(f))<=14});
 return (filtered.length?filtered:pool).sort((a,b)=>Math.abs(ovrSafe(a)-ovrSafe(f))-Math.abs(ovrSafe(b)-ovrSafe(f)));
}

function purseFor(f,org,titleFight){
 let purse=num(org.purse,1000);
 try{const fn=typeof contractTerms==='function'?contractTerms:null;const legacy=typeof contractTermsLegacy==='function'?contractTermsLegacy:null;const t=fn?fn(f,org):(legacy?legacy(f,org):{purse});purse=num(t?.purse,t?.salary||purse)}catch(e){}
 const experience=num(f.wins)+num(f.losses)+num(f.draws);
 // Keep debut/very early career money at the low end, especially in regional leagues.
 if(experience<=3&&!f.title){
   const regionalCap=Math.max(1200,Math.min(5000,Math.round((num(org.level,6)*500)+(ovrSafe(f)-60)*45)));
   purse=Math.min(purse,regionalCap);
 }
 if(titleFight)purse=Math.round(purse*1.8);else if(rankOf(f,org.name)<=5)purse=Math.round(purse*1.2);
 return Math.max(250,Math.round(purse*(0.9+Math.random()*0.2)));
}

function makeOffer(f,org,o){
 const rm=rankMap(org.name,f.weight),r=rm.get(o.id)||999,fp=rankOf(f,org.name);const title=!!f.title&&r>0&&r<=5;const ranked=r<=15&&fp<=15;const rounds=title?5:3;
 return {id:'V70-'+Date.now()+'-'+Math.random(),org:org.name,short:org.short,opponent:{...o},opponentRank:r,ranked,type:title?'ТИТУЛЬНЫЙ БОЙ':(ranked?'РЕЙТИНГОВЫЙ БОЙ':'ОБЫЧНЫЙ БОЙ'),titleFight:title,rounds,date:day()+rnd(14,42),purse:purseFor(f,org,title),event:pick(['Fight Night','Championship Series','Main Event','Fight Night Series'])+' #'+rnd(10,99),expires:day()+7};
}

function generate(f){
 ensure(f);const st=state();if(!st)return[];
 if(f.nextFight)return[];
 if(num(f.offerCooldownUntil)>day())return[];
 const contracted=!!f.contract;
 let leagueList=contracted?orgs().filter(o=>o.name===f.contract.org):orgs().filter(o=>o.name!=='DWCS'&&(num(st.managerRating,30)>=Math.max(20,num(o.unlock,0)))&&(!topLeague(o.name)||topEligible(f,o.name)));
 let collected=[];const usedOpp=new Set();const usedOrg=new Set();
 for(const org of leagueList.slice().sort(()=>Math.random()-.5)){
   if(collected.length>=(contracted?3:5))break;if(usedOrg.has(org.name))continue;
   const pool=candidatePool(f,org);if(!pool.length)continue;
   const o=pool.find(x=>!usedOpp.has(x.id))||pool[0];
   if(!o)continue;
   collected.push(makeOffer(f,org,o));usedOpp.add(o.id);usedOrg.add(org.name);
 }
 // Free-agent fallback: if the strict league pass found nothing, use actual leagues that have a valid same-weight opponent.
 if(!contracted&&collected.length===0){
   const world=Array.isArray(st.world)?st.world:[];const candidates=world.filter(x=>availableOpponent(f,x)&&x.org&&orgs().some(o=>o.name===x.org&&o.name!=='DWCS'));
   const byOrg=new Map();for(const x of candidates){if(!byOrg.has(x.org))byOrg.set(x.org,[]);byOrg.get(x.org).push(x)}
   for(const [name,pool] of [...byOrg.entries()].sort(()=>Math.random()-.5)){
     if(collected.length>=5)break;const org=orgs().find(o=>o.name===name);if(!org)continue;const o=pool.sort((a,b)=>Math.abs(ovrSafe(a)-ovrSafe(f))-Math.abs(ovrSafe(b)-ovrSafe(f)))[0];if(o)collected.push(makeOffer(f,org,o));
   }
 }
 // Contract fallback: same contracted league only. We deliberately do not fabricate an opponent from another promotion.
 f.organizationOffers=collected;f.refusalOfferBatchSize=collected.length;saveSafe();return collected;
}

function renderOffers(f,offers){
 const modal=document.getElementById('modal'),sheet=document.getElementById('sheet');if(!modal||!sheet)return;
 modal.classList.add('open');
 sheet.innerHTML=`<div class="eyebrow">ОРГАНИЗАЦИЯ БОЯ</div><div class="title">Предложения для ${f.name}</div><div class="muted">${f.contract?`Контракт: ${f.contract.org} • ${f.contract.fightsLeft}/${f.contract.length} боёв`:'Свободный агент • предложения из разных лиг'}</div><section class="panel"><div class="notice-strip">${f.contract?'Действующий контракт: предложения только из своей лиги.':'Доступны одноразовые бои. После боя можно отдельно рассматривать контракт лиги.'}</div></section><div class="list">${offers.map((x,i)=>`<div class="scout"><div class="fighter-top"><div class="scout-face">${typeof emoji==='function'?emoji(x.opponent.style):'🥊'}</div><div class="fighter-info"><div class="fighter-name">${x.opponent.flag||'🌍'} ${x.opponent.name}</div><div class="fighter-sub">${x.org} • ${x.opponent.country||''} • ${recSafe(x.opponent)} • ${x.opponentRank&&x.opponentRank<999?'#'+x.opponentRank:'без рейтинга'}</div></div><div class="score">${ovrSafe(x.opponent)}</div></div><div class="tags"><span class="tag">${x.org}</span><span class="tag">${x.type}</span><span class="tag">${x.rounds} раундов</span><span class="tag">${dateSafe(x.date)}</span><span class="tag">+$${x.purse.toLocaleString('ru-RU')}</span></div><div class="scout-actions"><button data-v70-profile="${i}">Профиль</button><button class="primary" data-v70-negotiate="${i}">Организовать бой</button><button class="red" data-v70-refuse="${i}">Отказаться</button></div></div>`).join('')}</div><div class="sheet-actions"><button data-v70-close>Закрыть</button></div>`;
 sheet.querySelector('[data-v70-close]').onclick=closeSafe;
 sheet.querySelectorAll('[data-v70-profile]').forEach(b=>b.onclick=()=>{const x=offers[+b.dataset.v70Profile];if(x&&typeof profile==='function')profile(x.opponent,'match')});
 sheet.querySelectorAll('[data-v70-negotiate]').forEach(b=>b.onclick=()=>negotiate(f,offers[+b.dataset.v70Negotiate]));
 sheet.querySelectorAll('[data-v70-refuse]').forEach(b=>b.onclick=()=>decline(f,offers[+b.dataset.v70Refuse]));
}

function negotiate(f,o){
 const sheet=document.getElementById('sheet');if(!sheet)return;const min=Math.max(250,Math.round(o.purse*.65)),max=Math.max(min,Math.round(o.purse*1.65));
 sheet.innerHTML=`<div class="eyebrow">ПЕРЕГОВОРЫ ПО БОЮ</div><div class="title">${f.name} vs ${o.opponent.name}</div><div class="muted">${o.org} • ${o.type} • ${o.rounds} раундов • ${dateSafe(o.date)}</div><section class="panel"><div class="row"><span>Предложение лиги</span><b>$${o.purse.toLocaleString('ru-RU')}</b></div><div class="row"><span>Соперник</span><b>#${o.opponentRank&&o.opponentRank<999?o.opponentRank:'—'} • ${recSafe(o.opponent)}</b></div><div style="margin-top:9px"><label class="muted">Твой запрос, $</label><input id="v70Salary" class="input" type="number" min="${min}" max="${max}" value="${o.purse}"></div><div class="notice-strip">Слишком высокий запрос снижает шанс согласия организации.</div></section><div class="sheet-actions"><button data-v70-back>Назад</button><button class="primary" data-v70-accept>Предложить бой</button></div>`;
 sheet.querySelector('[data-v70-back]').onclick=()=>renderOffers(f,f.organizationOffers||[]);
 sheet.querySelector('[data-v70-accept]').onclick=()=>{const purse=Math.max(min,Math.min(max,num(document.getElementById('v70Salary')?.value,o.purse)));const chance=Math.max(15,Math.min(98,Math.round(88-Math.max(0,purse-o.purse)/Math.max(1,o.purse)*70)));if(Math.random()*100>chance){notifySafe('Лига не согласилась на эти финансовые условия.');return}acceptFight(f,o,purse)};
}

function acceptFight(f,o,purse){
 ensure(f);f.organizationOffers=[];f.leagueOffers=[];f.fightResolved=false;f.currentFightLeague=o.org;
 f.nextFight={opponent:{...o.opponent},org:o.org,event:o.event,rounds:o.rounds,date:o.date,purse,rank:o.opponentRank,ranked:!!o.ranked,type:o.type,titleFight:!!o.titleFight,venue:pick(['Las Vegas Arena','Abu Dhabi Arena','Moscow Arena','Riyadh Arena','London']),card:o.rounds===5?'MAIN EVENT':pick(['PRELIMS','MAIN CARD','CO-MAIN EVENT']),oneFight:!f.contract};
 f.campWeek=0;f.campSchedule={};f.campStyle=f.preferredCampStyle||((typeof defaultCampStyleForFighter==='function')?defaultCampStyleForFighter(f):'balanced');f.campPerformance=3;
 // Do NOT consume contract fights here. Existing career logic consumes the fight when it is actually completed.
 f.reputationHooks.accepted=num(f.reputationHooks.accepted)+1;
 saveSafe();closeSafe();if(typeof page==='function')page('home');notifySafe(`Бой согласован: ${o.org} vs ${o.opponent.name}`);
}

function freeRefusalPenalty(total){total=Math.max(1,Math.floor(total));if(total===1)return rnd(10,20);if(total===2)return rnd(20,50);if(total===3)return rnd(50,90);return rnd(90,150)}
function decline(f,o){
 ensure(f);const arr=f.organizationOffers||[];const total=num(f.refusalOfferBatchSize,arr.length||1);const isContract=!!f.contract;
 if(isContract){
   // Existing contract-discipline overlays listen for data-refuse; this button intentionally uses that attribute.
   // If no overlay is present, fall back to the existing discipline function rather than inventing new rules.
   if(typeof registerFightRefusal==='function'){registerFightRefusal(f);return}
 }
 f.organizationOffers=arr.filter(x=>x.id!==o.id);f.reputationHooks.refused=num(f.reputationHooks.refused)+1;
 if(!f.organizationOffers.length){const days=freeRefusalPenalty(total);f.offerCooldownUntil=Math.max(num(f.offerCooldownUntil),day()+days);f.refusalHistory.push({day:day(),type:'free',rejected:total,total});f.reputationHooks.majorRefusals=(f.reputationHooks.majorRefusals||0)+(total>=3?1:0);saveSafe();closeSafe();if(typeof page==='function')page('home');notifySafe(`После отказа от ${total} предложени${total===1?'я':'й'} новые предложения будут недоступны ${days} дней.`);return}
 saveSafe();renderOffers(f,f.organizationOffers);
}

function openFlow(f){
 ensure(f);if(!f){notifySafe('Выбери бойца');return}if(!f.agencyManaged){notifySafe('Сначала подпиши бойца в своё агентство');return}if(f.nextFight){notifySafe('У бойца уже есть назначенный бой');return}
 const now=day();const existing=f.organizationOffers.filter(x=>num(x.expires,0)>=now&&!x.resolved);
 const offers=existing.length?existing:generate(f);
 if(!offers.length){notifySafe(f.contract?`В ${f.contract.org} пока нет доступного соперника в ${f.weight}.`:'Сейчас нет подходящих предложений.');return}
 renderOffers(f,offers);
}

function handleButton(e){
 const b=e.target.closest?.('[data-fighter-match],[data-profile-match],[data-fighter-fight],[data-act="match"]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const st=state();let f=fighter();
 const idx=b.dataset.fighterMatch;
 if(idx!==undefined&&Array.isArray(st?.fighters)){st.selected=Math.max(0,Math.min(st.fighters.length-1,Number(idx)));f=st.fighters[st.selected];saveSafe()}
 openFlow(f);
}
// Capture phase deliberately intercepts only the organization-entry buttons. All other existing gameplay handlers remain untouched.
document.addEventListener('click',handleButton,true);

// Public bridge for any existing code path that explicitly calls window.matchmake.
window.__MMA_MANAGER_ORG_OPEN_V70=openFlow;
window.matchmake=openFlow;
})();