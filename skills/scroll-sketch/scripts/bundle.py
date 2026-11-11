#!/usr/bin/env python3
"""Scroll Sketch · bundle.py
Makes one self-contained HTML file from a page that links the library by relative path:
local <link rel="stylesheet"> and <script src> files are inlined; CDN links (Rough.js, Google Fonts) stay.

usage: python3 bundle.py <page.html> <out.html> [--fragment]
  --fragment  drop <!doctype>, <html>, <head> and <body> wrappers (for hosts that add their own,
              such as a WordPress Custom HTML block or a Claude artifact)
"""
import re, sys, os

if len(sys.argv) < 3:
    sys.exit(__doc__)
src, dst, fragment = sys.argv[1], sys.argv[2], '--fragment' in sys.argv
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding='utf-8').read()
local = lambda u: not re.match(r'^(https?:)?//', u)

def css(m):
    href = m.group(1)
    if not local(href): return m.group(0)
    return '<style>\n' + open(os.path.join(base, href), encoding='utf-8').read() + '\n</style>'

def js(m):
    s = m.group(1)
    if not local(s): return m.group(0)
    code = open(os.path.join(base, s), encoding='utf-8').read().replace('</script', '<\\/script')
    return '<script>\n' + code + '\n</script>'

html = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>', css, html)
html = re.sub(r'<script\s+src="([^"]+)"\s*>\s*</script>', js, html)
if fragment:
    head = re.search(r'<head>(.*?)</head>', html, re.S)
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S)
    keep = re.sub(r'<meta\s+(charset|name="viewport")[^>]*>\s*', '', head.group(1)) if head else ''
    html = keep.strip() + '\n' + (body.group(1).strip() if body else '')
open(dst, 'w', encoding='utf-8').write(html)
print(f'wrote {dst} ({os.path.getsize(dst) // 1024} KB)')
