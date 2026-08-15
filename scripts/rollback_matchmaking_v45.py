from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old=r'''function _matchmakeHeavy(){
 let f=currentF();
 if(!f){toast("Выбери бойца");return}
 if(!f.agencyManaged){toast("Сначала подпиши бойца в своё агентство");return}
 if(f.nextFight){toast("У бойца уже есть назначенный бой");return}
 let contracted=!!f.contract;
 let eligibleOrgs=contracted
   ? ORGS.filter(o=>o.name===f.contract.org)
   : ORGS.filter(o=>o.name!=="DWCS" && (s.managerRating||30)>=Math.max(20,o.unlock-10)).filter(o=>!isTopLeague(o.name)||topLeagueEligible(f,o.name));
 let rows=[];
 let recentOpponents=new Set((f.history||[]).slice(0,3).map(h=>h.opponent).filter(Boolean));
 let matchIndex=new Map();
 for(const x of s.world){
   if(!x||x.agencyManaged||x.name===f.name||x.weight!==f.weight||recentOpponents.has(x.name))continue;
   const key=x.org+"|"+x.weight; let arr=matchIndex.get(key);
   if(!arr){arr=[];matchIndex.set(key,arr)} arr.push(x);
 }
 eligibleOrgs.forEach(org=>{
   let pool=(matchIndex.get(org.name+"|"+f.weight)||[]).filter(x=>!isTopLeague(org.name)||topLeagueEligible(x,org.name));
   const rankMap=new Map((s.rankingsByOrg?.[org.name]?.[f.weight]||[]).map(r=>[r.id,r.rank])); let fp=rankMap.get(f.id)||999;
   let isChamp=!!f.title;
   let opps=pool.filter(x=>{
     let rp=rankMap.get(x.id)||999;
     if(isChamp) return rp>0&&rp<=8;
     if(fp>0&&fp<=15) return rp>0&&Math.abs(rp-fp)<=8;
     return Math.abs(ovr(x)-ovr(f))<=12;
   }).sort((a,b)=>Math.abs(ovr(a)-ovr(f))-Math.abs(ovr(b)-ovr(f)));
   opps.slice(0,1).forEach(o=>{
     let rp=getPos(o), ranked=(fp>0&&fp<=15&&rp>0&&rp<=15);
     let titleFight=isChamp&&rp<=3;
     let fiveRounds=(titleFight||((ranked&&fp<=5&&rp<=5&&org.level>=8)));
     let terms=contractTerms(f,org);
     rows.push({titleFight:isTitleFightPair(f,o,org.name),opponent:o,org:org.name,rounds:fiveRounds?5:3,date:s.day+rand(14,42),purse:Math.max(terms.purse,Math.round(terms.purse*.45)),rank:rp,event:choice(["Fight Night","Championship Series","Main Event","Fight Night Series"])+" #"+rand(10,99),ranked,type:titleFight?"ТИТУЛЬНЫЙ БОЙ":(ranked?"РЕЙТИНГОВЫЙ БОЙ":"ОБЫЧНЫЙ БОЙ"),titleFight});
   });
 });
 let candidates=[];
 rows.sort(()=>Math.random()-.5).forEach(r=>{
   if(candidates.length>=2)return;
   if(!candidates.some(x=>x.org===r.org))candidates.push(r);
 });
 if(!candidates.length){toast(contracted?`В ${f.contract.org} сейчас нет подходящего соперника.`:"Сейчас нет подходящих предложений. Попробуй позже.");return}
 document.getElementById("modal").classList.add("open");
 document.getElementById("sheet").innerHTML=`<div class="eyebrow">${contracted?"КОНТРАК • "+f.contract.org:"РЫНОК БОЁВ • СВОБОДНЫЙ БОЕЦ"}</div>
 <h2>${contracted?"Бои в рамках контракта":"Предложения из разных лиг"}</h2>
 <div class="muted">${f.flag||"🌍"} ${f.name} • ${f.weight} • OVR ${ovr(f)} • ${contracted?`${f.contract.fightsLeft}/${f.contract.length} боя по контракту`:'свободен от лиги'}</div>
 <section class="panel"><div class="notice-strip">${contracted?`У бойца действует контракт с ${f.contract.org}. Другие лиги здесь не участвуют.`:`Это одноразовые бои. После каждого боя лига отдельно решает, предлагать ли долгий контракт.`}</div></section>
 <div class="list" style="margin-top:11px">${candidates.map((c,i)=>`<div class="scout"><div class="fighter-top"><div class="scout-face">${emoji(c.opponent.style)}</div><div class="fighter-info"><div class="fighter-name">${c.opponent.flag||"🌍"} ${c.opponent.name}</div><div class="fighter-sub">${c.opponent.country} • ${c.opponent.style} • ${rec(c.opponent)} • #${c.rank||"—"}</div></div><div class="score">${ovr(c.opponent)}</div></div><div class="tags"><span class="tag">${c.org}</span><span class="tag">${c.type}</span><span class="tag">${c.rounds} раундов</span><span class="tag">${dateLabel(c.date)}</span><span class="tag">+$${c.purse.toLocaleString("ru-RU")}</span></div><div class="scout-actions"><button data-mmprofile="${i}">Профиль</button><button class="primary" data-accept="${i}">Рассмотреть бой</button></div></div>`).join("")}</div><div class="sheet-actions"><button data-close>Закрыть</button></div>`;
 document.querySelectorAll("[data-mmprofile]").forEach(b=>b.onclick=()=>profile(candidates[+b.dataset.mmprofile].opponent,"match"));
 document.querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>{
   let c=candidates[+b.dataset.accept],min=Math.max(500,Math.round(c.purse*.65)),max=Math.round(c.purse*1.6);
   document.getElementById("sheet").innerHTML=`<div class="eyebrow">ПЕРЕГОВОРЫ О БОЕ</div><div class="title">${f.name} vs ${c.opponent.name}</div><div class="muted">${c.org} • ${c.event} • ${c.rounds} раундов • ${dateLabel(c.date)}</div><section class="panel"><div class="row"><span>Тип</span><b>${c.type}</b></div><div class="row"><span>Гонорар</span><b>$${c.purse.toLocaleString("ru-RU")}</b></div><div style="margin-top:9px"><label class="muted">Твой запрос, $</label><input id="fightSalary" class="input" type="number" min="${min}" max="${max}" value="${c.purse}"></div></section><div class="sheet-actions"><button data-back-mm>Назад</button><button class="primary" data-propose-fight>Предложить бой</button></div>`;
   document.querySelector("[data-back-mm]").onclick=()=>matchmake();
   document.querySelector("[data-propose-fight]").onclick=()=>{
     let purse=Math.max(min,Math.min(max,Number(document.getElementById("fightSalary").value)||c.purse));
     let chance=Math.round(Math.max(15,Math.min(98,82-Math.max(0,purse-c.purse)/Math.max(1,c.purse)*70)));
     if(Math.random()*100>chance){toast("Лига отказалась от условий");return}
     f.fightResolved=false;f.nextFight={opponent:{...c.opponent},org:c.org,event:c.event,rounds:c.rounds,date:c.date,purse,rank:c.rank,ranked:!!c.ranked,type:c.type,titleFight:!!c.titleFight,venue:choice(["Las Vegas Arena","Abu Dhabi Arena","Moscow Arena","Las Vegas","New York","Riyadh Arena"]),card:c.rounds===5?"MAIN EVENT":choice(["PRELIMS","MAIN CARD","CO-MAIN EVENT"]),oneFight:!contracted};
     f.preferredCampStyle=f.preferredCampStyle||null;f.campStyle=f.preferredCampStyle||defaultCampStyleForFighter(f);f.campPerformance=f.campStyle==="peak"?8:(f.campStyle==="conditioning"?5:3);f.campWeek=1;f.campSchedule={};f.currentFightLeague=c.org;
     logNews(`${f.name} принял бой в ${c.org} против ${c.opponent.name}.`);save();closeModal();page("home");toast(`Бой согласован: ${c.org}`);
   };
 });
 document.querySelector("[data-close]").onclick=closeModal;
}
'''

pattern=r'function _matchmakeHeavy\(\)\{.*?\n\}\n\nconst CAMP_STYLES='
new=old+'\nconst CAMP_STYLES='
s2,n=re.subn(pattern,new,s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'expected one matchmaking function, found {n}')
s=s2
s=s.replace('MMA_MANAGER_V63_RESTORED','MMA_MANAGER_V45_MATCHMAKING_RESTORED',1)
p.write_text(s,encoding='utf-8')
print('V45 matchmaking restored')