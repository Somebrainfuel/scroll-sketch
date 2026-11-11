#!/usr/bin/env python3
"""Scroll Sketch · make_gif.py
Turns the frames from capture.mjs into looping GIFs (one per chart) plus a poster PNG of the finished chart.

usage: python3 make_gif.py <frames-dir> <out-dir> [--width 1100] [--colors 64] [--start-ms 800] [--end-ms 2700] [--prefix name-]
needs: Pillow (pip install pillow)

Why the palette step matters: a GIF holds at most 256 colours, and an accent colour used on a few lines
is a tiny share of the pixels, so plain quantising turns it muddy. The theme colours that capture.mjs
recorded (meta.json) are added as solid swatches before the palette is built, so they come through true.
"""
import argparse, json, os, sys
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('frames'); ap.add_argument('out')
ap.add_argument('--width', type=int, default=1100)
ap.add_argument('--colors', type=int, default=64)
ap.add_argument('--start-ms', type=int, default=800, help='hold on the first frame')
ap.add_argument('--end-ms', type=int, default=2700, help='hold on the finished chart before looping')
ap.add_argument('--frame-ms', type=int, default=100)
ap.add_argument('--prefix', default='')
ap.add_argument('--poster-first', action='store_true',
                help='open on the finished chart for 1.5s before it builds (Outlook on Windows shows only the first frame)')
a = ap.parse_args()

def hex_rgb(h):
    h = h.strip().lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) if len(h) >= 6 else None

meta_path = os.path.join(a.frames, 'meta.json')
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
theme = [c for c in (hex_rgb(x) for x in meta.get('colors', []) if x.startswith('#')) if c]
ground = theme[-1] if theme else (250, 250, 247)
swatch = []
for c in theme[:-1]:  # each colour plus two blends towards the page, for anti-aliased edges
    swatch += [c, tuple(round(c[i] * .55 + ground[i] * .45) for i in range(3)), tuple(round(c[i] * .3 + ground[i] * .7) for i in range(3))]

scenes = meta.get('scenes') or sorted(d for d in os.listdir(a.frames) if os.path.isdir(os.path.join(a.frames, d)))
os.makedirs(a.out, exist_ok=True)
for sc in scenes:
    d = os.path.join(a.frames, sc)
    paths = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    if not paths:
        print(f'{sc}: no frames, skipped'); continue
    imgs = []
    for f in paths:
        im = Image.open(os.path.join(d, f)).convert('RGB')
        imgs.append(im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS))
    picks = [imgs[0], imgs[len(imgs) // 3], imgs[2 * len(imgs) // 3], imgs[-1]]
    sw_h = 40
    strip = Image.new('RGB', (a.width, sum(i.height for i in picks) + sw_h * len(swatch)))
    y = 0
    for i in picks:
        strip.paste(i, (0, y)); y += i.height
    for c in swatch:
        strip.paste(Image.new('RGB', (a.width, sw_h), c), (0, y)); y += sw_h
    pal = strip.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT)
    q = [im.quantize(palette=pal, dither=Image.Dither.NONE) for im in imgs]
    out, dur = [], []
    for f in q:  # merge identical neighbours into one longer frame
        if out and f.tobytes() == out[-1].tobytes(): dur[-1] += a.frame_ms
        else: out.append(f); dur.append(a.frame_ms)
    dur[0] += a.start_ms; dur[-1] += a.end_ms
    if a.poster_first:
        out.insert(0, out[-1]); dur.insert(0, 1500)
    name = a.prefix + sc
    path = os.path.join(a.out, name + '.gif')
    out[0].save(path, save_all=True, append_images=out[1:], duration=dur, loop=0, optimize=True, disposal=1)
    imgs[-1].save(os.path.join(a.out, name + '-poster.png'), optimize=True)
    mb = os.path.getsize(path) / 1e6
    print(f'{name}.gif  {a.width}x{out[0].height}  {len(out)} frames  {sum(dur) / 1000:.1f}s  {mb:.2f} MB' + ('  (over 3 MB: try --width 880)' if mb > 3 else ''))
