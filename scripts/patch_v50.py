from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old = 's.fighters?.forEach(f=>{if(f.contract&&!f.contract.org){f.contract.org="LFA";f.contract.fightsLeft=f.contract.fightsLeft??f.contract.length??3}});'
new = 's.fighters?.forEach(f=>{if(f.contract&&!f.contract.org){f.contract.org="LFA";f.contract.fightsLeft=f.contract.fightsLeft??f.contract.length??3}if(f.contract){f.contract.refusalCount=f.contract.refusalCount||0;f.contract.refusalWindowStart=f.contract.refusalWindowStart||s.day}});'
if old in s:
    s = s.replace(old, new, 1)

marker = 'function _matchmakeHeavy(){'
helpers = '''function refusalPenalty(f){
 let c=f?.contract;if(!c)return 0;
 let count=Number(c.refusalCount||0);
 if(c.refusalWindowStart&&s.day-c.refusalWindowStart>180){c.refusalCount=0;c.refusalWindowStart=s.day;count=0}
 return Math.min(.45,count*.12);
}
function registerFightRefusal(f){
 if(!f?.contract)return;
 let c=f.contract;
 if(!c.refusalWindowStart||s.day-c.refusalWindowStart>180){c.refusalWindowStart=s.day;c.refusalCount=0}
 c.refusalCount=(c.refusalCount||0)+1;
 let n=c.refusalCount;
 if(n===1){c.refusalWarning=1;logNews(`${f.name} получил предупреждение от ${c.org} за отказ от предложенного боя.`,"CONTRACT");save();toast("Предупреждение: лига недовольна отказом от боя");return}
 if(n===2){c.refusalWarning=2;logNews(`${f.name} получил последнее предупреждение от ${c.org}: слишком много отказов от боёв.`,"CONTRACT");save();toast("Последнее предупреждение: следующий частый отказ может привести к увольнению");return}
 let oldOrg=c.org;f.formerContractOrg=oldOrg;f.contract=null;f.leagueFired=true;f.leagueFiredDay=s.day;f.currentFightLeague=null;logNews(`${oldOrg} расторг контракт с ${f.name} из-за неоднократных отказов от боёв.`,"CONTRACT");save();toast(`${oldOrg}: контракт расторгнут из-за отказов от боёв`);
}
function acceptFightDisciplineBonus(f){
 if(!f?.contract)return;
 let c=f.contract;
 if((c.refusalCount||0)>0)c.refusalCount=Math.max(0,c.refusalCount-1);
 if(c.refusalCount===0)c.refusalWarning=0;
}
function rankingAccess(f){
 let p=refusalPenalty(f),base=15-Math.floor(p*20);
 return Math.max(6,base);
}
function titleAccess(f){return refusalPenalty(f)<.36;}
'''
if marker in s and 'function registerFightRefusal' not in s:
    s = s.replace(marker, helpers + marker, 1)

old = 'let rp=getPos(o), ranked=(fp>0&&fp<=15&&rp>0&&rp<=15);\n     let titleFight=isChamp&&rp<=3;'
new = 'let rp=getPos(o), ranked=(fp>0&&fp<=rankingAccess(f)&&rp>0&&rp<=15);\n     let titleFight=isChamp&&titleAccess(f)&&fp<=5&&rp<=3;'
if old in s:
    s = s.replace(old, new, 1)

old = '<div class="scout-actions"><button data-mmprofile="${i}">Профиль</button><button class="primary" data-accept="${i}">Рассмотреть бой</button></div>'
new = '<div class="scout-actions"><button data-mmprofile="${i}">Профиль</button><button class="primary" data-accept="${i}">Рассмотреть бой</button><button data-refuse="${i}">Отказать</button></div>'
if old in s:
    s = s.replace(old, new, 1)

old = 'document.querySelectorAll("[data-mmprofile]").forEach(b=>b.onclick=()=>profile(candidates[+b.dataset.mmprofile].opponent,"match"));\n document.querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>{'
new = 'document.querySelectorAll("[data-mmprofile]").forEach(b=>b.onclick=()=>profile(candidates[+b.dataset.mmprofile].opponent,"match"));\n document.querySelectorAll("[data-refuse]").forEach(b=>b.onclick=()=>{if(contracted)registerFightRefusal(f);matchmake()});\n document.querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>{'
if old in s:
    s = s.replace(old, new, 1)

old = 'f.fightResolved=false;f.nextFight={opponent:{...c.opponent},org:c.org,event:c.event,rounds:c.rounds,date:c.date,purse,rank:c.rank,ranked:!!c.ranked,type:c.type,titleFight:!!c.titleFight,venue:choice(["Las Vegas Arena","Abu Dhabi Arena","Moscow Arena","Las Vegas","New York","Riyadh Arena"]),card:c.rounds===5?"MAIN EVENT":choice(["PRELIMS","MAIN CARD","CO-MAIN EVENT"]),oneFight:!contracted};'
new = 'f.fightResolved=false;f.nextFight={opponent:{...c.opponent},org:c.org,event:c.event,rounds:c.rounds,date:c.date,purse,rank:c.rank,ranked:!!c.ranked,type:c.type,titleFight:!!c.titleFight,venue:choice(["Las Vegas Arena","Abu Dhabi Arena","Moscow Arena","Las Vegas","New York","Riyadh Arena"]),card:c.rounds===5?"MAIN EVENT":choice(["PRELIMS","MAIN CARD","CO-MAIN EVENT"]),oneFight:!contracted};\n     acceptFightDisciplineBonus(f);'
if old in s:
    s = s.replace(old, new, 1)

old = '<section class="panel"><div class="notice-strip">${contracted?`У бойца действует контракт с ${f.contract.org}. Другие лиги здесь не участвуют.`:`Это одноразовые бои. После каждого боя лига отдельно решает, предлагать ли долгий контракт.`}</div></section>'
new = '<section class="panel"><div class="notice-strip">${contracted?`У бойца действует контракт с ${f.contract.org}. Другие лиги здесь не участвуют.${(f.contract.refusalCount||0)>0?` Отказы: ${f.contract.refusalCount}/2 до риска увольнения.`:""}`:`Это одноразовые бои. После каждого боя лига отдельно решает, предлагать ли долгий контракт.`}</div></section>'
if old in s:
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('V50 patch applied')
