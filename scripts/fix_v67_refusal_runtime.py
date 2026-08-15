from pathlib import Path

idx = Path('index.html')
s = idx.read_text(encoding='utf-8')
old = '<script src="scripts/organization_v64.js"></script>'
new = '<script src="scripts/organization_v64.js?v=69"></script>'
if old in s and new not in s:
    s = s.replace(old, new, 1)
s = s.replace('organization_v64.js?v=67', 'organization_v64.js?v=69')
s = s.replace('organization_v64.js?v=68', 'organization_v64.js?v=69')
s = s.replace('const BUILD="MMA_MANAGER_V67_REFUSAL_RUNTIME";', 'const BUILD="MMA_MANAGER_V69_POSTFIGHT";', 1)

# Add a real post-fight report without replacing the existing result screen.
marker = '<div class="fr-method">${method}</div>'
report = '''<div class="fr-method">${method}</div>
     <div id="frCareerReport" class="fr-career-report">
       <div class="fr-report-head">ПОСЛЕДСТВИЯ БОЯ</div>
       <div class="fr-report-grid">
         <div><small>Рейтинг мира</small><b id="frRankChange">—</b></div>
         <div><small>Рейтинг дивизиона</small><b id="frDivRankChange">—</b></div>
         <div><small>Заработано</small><b id="frMoneyEarned">—</b></div>
         <div><small>Отношение с лигой</small><b id="frLeagueRelation">—</b></div>
       </div>
       <div id="frConsequences" class="fr-report-note"></div>
     </div>'''
if marker in s and 'id="frCareerReport"' not in s:
    s = s.replace(marker, report, 1)

# Capture pre-fight rankings and calculate league relationship before the existing ranking update.
needle = 'logNews(`${f.name} ${win?"победил":"проиграл"} ${o.name} — ${method}${method==="Decision"||method==="Split Decision"?` (${scoreLines.join(", ")})`:""}.`);\n updateRankings();save();'
replacement = '''const frWorldRankBefore=typeof getPos==='function'?Number(getPos(f)||0):0;
 const frDivRankBefore=(()=>{try{const a=s.rankingsByOrg?.[n.org]?.[f.weight]||[];return Number(a.find(x=>x.id===f.id)?.rank||0)}catch(e){return 0}})();
 f.leagueRelations=f.leagueRelations||{};
 const frRelBefore=Number(f.leagueRelations[n.org]??55);
 const frRelDelta=win?(n.titleFight?6:4):-3;
 f.leagueRelations[n.org]=Math.max(0,Math.min(100,frRelBefore+frRelDelta));
 f.lastFightReport={day:s.day,org:n.org,win,method,earned:Math.round(win?n.purse:n.purse*.35),worldRankBefore:frWorldRankBefore,divRankBefore:frDivRankBefore,relationBefore:frRelBefore,relationAfter:f.leagueRelations[n.org]};
 logNews(`${f.name} ${win?"победил":"проиграл"} ${o.name} — ${method}${method==="Decision"||method==="Split Decision"?` (${scoreLines.join(", ")})`:""}.`);
 updateRankings();save();'''
if needle in s and 'frWorldRankBefore' not in s:
    s = s.replace(needle, replacement, 1)

# Populate the report after rankings have been updated and before the existing buttons are shown.
needle2 = 'document.body.appendChild(overlay);\n\n // Show the announcement immediately;'
replacement2 = '''document.body.appendChild(overlay);
 const frWorldRankAfter=typeof getPos==='function'?Number(getPos(f)||0):0;
 const frDivRankAfter=(()=>{try{const a=s.rankingsByOrg?.[n.org]?.[f.weight]||[];return Number(a.find(x=>x.id===f.id)?.rank||0)}catch(e){return 0}})();
 const frEarn=Math.round(win?n.purse:n.purse*.35);
 const frWorldDelta=(frWorldRankBefore&&frWorldRankAfter)?(frWorldRankBefore-frWorldRankAfter):0;
 const frDivDelta=(frDivRankBefore&&frDivRankAfter)?(frDivRankBefore-frDivRankAfter):0;
 const frFmt=x=>Number(x||0).toLocaleString('ru-RU');
 const frChange=(before,after,delta)=>before&&after?`#${before} → #${after} ${delta>0?'🟢 +'+delta:delta<0?'🔴 '+delta:'—'}`:'Без изменения';
 const frRankEl=document.getElementById('frRankChange'); if(frRankEl)frRankEl.textContent=frChange(frWorldRankBefore,frWorldRankAfter,frWorldDelta);
 const frDivEl=document.getElementById('frDivRankChange'); if(frDivEl)frDivEl.textContent=frChange(frDivRankBefore,frDivRankAfter,frDivDelta);
 const frMoneyEl=document.getElementById('frMoneyEarned'); if(frMoneyEl)frMoneyEl.textContent='$'+frFmt(frEarn);
 const frRelEl=document.getElementById('frLeagueRelation'); if(frRelEl)frRelEl.textContent=`${frRelBefore} → ${f.leagueRelations[n.org]} ${frRelDelta>0?'🟢 +'+frRelDelta:'🔴 '+frRelDelta}`;
 const frNote=document.getElementById('frConsequences'); if(frNote){const bits=[];if(win&&frWorldDelta>0)bits.push(`Ты поднялся на ${frWorldDelta} позиц${frWorldDelta===1?'ию':'ий'} в мировом рейтинге.`);else if(!win&&frWorldDelta<0)bits.push(`Ты опустился на ${Math.abs(frWorldDelta)} позиц${Math.abs(frWorldDelta)===1?'ию':'ий'} в мировом рейтинге.`);if(n.titleFight&&win)bits.push('🏆 Победа в титульном бою усилила статус в лиге.');if(win&&f.winStreak>=3)bits.push(`🔥 Серия побед: ${f.winStreak}.`);frNote.textContent=bits.join(' ')||'Бой завершён. Позиция и условия карьеры обновлены.';}
 save();

 // Show the announcement immediately;'''
if needle2 in s and 'frWorldRankAfter' not in s:
    s = s.replace(needle2, replacement2, 1)

idx.write_text(s, encoding='utf-8')

org = Path('scripts/organization_v64.js')
o = org.read_text(encoding='utf-8')
old_penalty = "function freePenalty(count){if(count<=0)return 0;if(count===1)return rand(10,20);if(count===2)return rand(20,50);if(count===3)return rand(50,90);return rand(90,150)}"
new_penalty = "function freePenalty(count){count=Math.max(1,Math.floor(Number(count)||1));if(count===1)return Math.floor(10+Math.random()*11);if(count===2)return Math.floor(20+Math.random()*31);if(count===3)return Math.floor(50+Math.random()*41);return Math.floor(90+Math.random()*61)}"
if old_penalty in o:
    o = o.replace(old_penalty, new_penalty, 1)
old_refusal = "const r=Math.max(1,rejected),t=Math.max(r,total||r);"
new_refusal = "const r=Math.max(1,Math.floor(Number(rejected)||1)),t=Math.max(r,Math.floor(Number(total)||r));"
o = o.replace(old_refusal, new_refusal, 1)
# Entry-level purses: inexperienced fighters should not earn established-fighter money.
old_offer = "let purse=Math.max(250,Math.round(num(base.purse,org.purse||1000)*(0.78+Math.random()*0.38)));"
new_offer = "let purse=Math.max(250,Math.round(num(base.purse,org.purse||1000)*(0.78+Math.random()*0.38)));const exp=(f.wins||0)+(f.losses||0)+(f.draws||0);if(exp<=3&&!f.title){const entryBase={ACA:1500,LFA:1200,KSW:1400,\"Cage Warriors\":900,\"Ares FC\":900,\"BRAVE CF\":1000,RIZIN:2000,\"ONE Championship\":2200,PFL:2500,UFC:3500};const skill=Math.max(0,ovr(f)-60)*45;const entryCap=(entryBase[org.name]||1000)+skill;purse=Math.min(purse,Math.round(entryCap));}"
if old_offer in o:
    o = o.replace(old_offer, new_offer, 1)
org.write_text(o, encoding='utf-8')
print('V69 post-fight report and realistic entry purses applied')
