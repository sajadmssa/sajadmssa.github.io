#!/usr/bin/env python3
"""Replace the placeholder domain everywhere (canonical, og:image, sitemap, robots).
Usage:  python3 tools/set-domain.py https://your-site.pages.dev
Run it from the project root (the folder that contains index.html)."""
import sys, pathlib
if len(sys.argv) != 2 or not sys.argv[1].startswith('http'):
    sys.exit('usage: python3 tools/set-domain.py https://your-domain')
new = sys.argv[1].rstrip('/'); old = 'https://YOUR-DOMAIN.example'; n = 0
for p in pathlib.Path('.').rglob('*'):
    if p.suffix in ('.html', '.xml', '.txt', '.js', '.json') and p.is_file():
        s = p.read_text(encoding='utf8')
        if old in s: p.write_text(s.replace(old, new), encoding='utf8'); n += 1
print(f'updated {n} files -> {new}')
