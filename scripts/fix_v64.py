from pathlib import Path
idx=Path('index.html')
s=idx.read_text(encoding='utf-8')
marker='<script src="scripts/organization_v64.js"></script>'
if marker not in s:
    pos=s.rfind('</body>')
    if pos<0:
        raise SystemExit('No </body> in index.html')
    s=s[:pos]+marker+'\n'+s[pos:]
    idx.write_text(s,encoding='utf-8')

# V65 minimal organization fixes. Do not touch any other mechanics.
org=Path('scripts/organization_v64.js')
o=org.read_text(encoding='utf-8')
o=o.replace('return rand(100,120)', 'return rand(90,150)', 1)
o=o.replace('const offers=generateOffers(f);', 'const existing=(f.organizationOffers||[]).filter(x=>num(x.expires,0)>=day()&&!x.resolved);const offers=existing.length?existing:generateOffers(f);', 1)
org.write_text(o,encoding='utf-8')
print('V64 organization patch ready with V65 minimal fixes')
