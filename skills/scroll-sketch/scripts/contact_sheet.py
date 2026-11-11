#!/usr/bin/env python3
"""Scroll Sketch · contact_sheet.py
One image showing each chart at several points in its scroll, for a quick visual check of
overlaps, clipped labels and empty steps without watching the whole animation.

usage: python3 contact_sheet.py <frames-dir> <out.png> [--at 0.2,0.45,0.7,1] [--width 1400]
"""
import argparse, json, os
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('frames'); ap.add_argument('out')
ap.add_argument('--at', default='0.2,0.45,0.7,1')
ap.add_argument('--width', type=int, default=1400)
a = ap.parse_args()
at = [float(x) for x in a.at.split(',')]
meta_path = os.path.join(a.frames, 'meta.json')
scenes = json.load(open(meta_path))['scenes'] if os.path.exists(meta_path) else sorted(d for d in os.listdir(a.frames) if os.path.isdir(os.path.join(a.frames, d)))

cols, cell = 2, a.width // 2
rows = []
for sc in scenes:
    fs = sorted(f for f in os.listdir(os.path.join(a.frames, sc)) if f.endswith('.png'))
    for t in at:
        f = fs[min(len(fs) - 1, round(t * (len(fs) - 1)))]
        im = Image.open(os.path.join(a.frames, sc, f)).convert('RGB')
        im = im.resize((cell, round(im.height * cell / im.width)))
        ImageDraw.Draw(im).text((8, 6), f'{sc}  p={t:.2f}', fill=(200, 40, 40))
        rows.append(im)
grid = [rows[i:i + cols] for i in range(0, len(rows), cols)]
H = sum(max(i.height for i in r) for r in grid)
sheet = Image.new('RGB', (a.width, H), 'white')
y = 0
for r in grid:
    for j, im in enumerate(r): sheet.paste(im, (j * cell, y))
    y += max(i.height for i in r)
sheet.save(a.out)
print(f'wrote {a.out} ({len(rows)} views)')
