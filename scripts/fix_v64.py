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
print('V64 organization patch ready')
