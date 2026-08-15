from pathlib import Path

idx = Path('index.html')
s = idx.read_text(encoding='utf-8')
old = '<script src="scripts/organization_v64.js"></script>'
new = '<script src="scripts/organization_v64.js?v=67"></script>'
if old in s and new not in s:
    s = s.replace(old, new, 1)
# Force a new browser build marker without changing gameplay logic.
s = s.replace('const BUILD="MMA_MANAGER_V45_MATCHMAKING_RESTORED";', 'const BUILD="MMA_MANAGER_V67_REFUSAL_RUNTIME";', 1)
idx.write_text(s, encoding='utf-8')

org = Path('scripts/organization_v64.js')
o = org.read_text(encoding='utf-8')
old_penalty = "function freePenalty(count){if(count<=0)return 0;if(count===1)return rand(10,20);if(count===2)return rand(20,50);if(count===3)return rand(50,90);return rand(90,150)}"
new_penalty = "function freePenalty(count){count=Math.max(1,Math.floor(Number(count)||1));if(count===1)return Math.floor(10+Math.random()*11);if(count===2)return Math.floor(20+Math.random()*31);if(count===3)return Math.floor(50+Math.random()*41);return Math.floor(90+Math.random()*61)}"
if old_penalty not in o:
    raise SystemExit('Expected freePenalty function not found')
o = o.replace(old_penalty, new_penalty, 1)
# Make the batch size authoritative and never derive it from the remaining list.
old_refusal = "const r=Math.max(1,rejected),t=Math.max(r,total||r);"
new_refusal = "const r=Math.max(1,Math.floor(Number(rejected)||1)),t=Math.max(r,Math.floor(Number(total)||r));"
o = o.replace(old_refusal, new_refusal, 1)
org.write_text(o, encoding='utf-8')
print('V67 refusal runtime/cache fix applied')
