---
name: scroll-sketch
description: >-
  Build hand-drawn, scroll-driven chart stories (scrollytelling), where a chart pins on screen and
  draws itself step by step as the reader scrolls, in a sketchy marker style, then export each chart
  as a GIF for email. Use this whenever someone wants an animated, interactive or builds-as-you-scroll
  chart for a newsletter, blog post, essay, report or explainer; wants hand-drawn, sketchy or
  notebook-style charts (for example like Ben's Bites); wants to turn an article's argument into a
  visual story; or needs chart GIFs for Substack, Kit, Mailchimp, Beehiiv or other email, even if they
  never say scrollytelling. Includes 12 starter templates (curve shift, 2x2 quadrant move, count-up
  dot grid, before/after bars, flow reroute, timeline, funnel, flywheel, S-curve jump, waterfall,
  market size, break-even).
---

# Scroll Sketch

Scroll Sketch makes charts that feel sketched on a notepad and build up as the reader scrolls. Each chart sits in a tall section and stays pinned on screen (`position: sticky`). How far the reader has scrolled through that section is one number, `p`, from 0 to 1, and slices of `p` drive each step: a line draws, dots drop in, a label swaps, an arrow names the point. Email can't run code, so each chart can also be exported as a looping GIF that links to the live page.

Everything is plain HTML, CSS and JavaScript plus Rough.js from a CDN. There's no build step.

## What's in this skill

| Path | What it is |
|---|---|
| `lib/scroll-sketch.js` | The small library: `scene()` pins and drives a chart; helpers for axes, arrows, boxes, labels and reveals |
| `lib/scroll-sketch.css` | Layout and theme tokens (neutral sketchbook look) |
| `lib/themes/` | Example brand theme to copy (Business Design Labs) |
| `templates/` | 12 working pages, one per story shape, each with its story in one editable `STORY` block |
| `scripts/capture.mjs` | Scrolls each chart in headless Chrome and saves frames |
| `scripts/make_gif.py` | Frames to looping GIFs plus a poster PNG |
| `scripts/contact_sheet.py` | One image of each chart at several scroll points, for checking layout |
| `scripts/bundle.py` | Inlines the library to make one self-contained HTML file |
| `references/story-shapes.md` | Which template fits which story, with the beats of each. Read when choosing a template |
| `references/craft.md` | Layout, timing, labels, mobile and the pitfalls that cost time. Read before building or changing drawing code |
| `references/publishing.md` | Getting it onto a website, WordPress, a Claude artifact, and into email as GIFs. Read before delivering |

## Workflow

### 1. Find the move
Read the user's piece (or ask for it). Name the single claim each chart must make in one sentence, such as "three businesses are making the first yes smaller". Then pick the story shape that makes that claim visible: something shifts, something is big, something connects, something changes over time. `references/story-shapes.md` maps shapes to the 12 templates. One chart per claim; most posts need one to three.

### 2. Write the beats before any code
Write 4 to 7 steps as caption sentences, each with the scroll point where it starts, for example `[0.36, 'IKEA: second-hand costs around 60% less than new.']`. Decide what the reader sees at the first frame and at the last. The beats are the story; the code only performs them. Leave gaps between beats so each state can be read, and end with about 10% of scroll where the finished chart just sits.

Show the user the beats when the story is theirs to judge (a newsletter, a pitch). For a quick demo, go ahead.

### 3. Start from the nearest template
Copy the template and the `lib/` folder next to the user's work (templates load `../lib/...`), or bundle it (step 6). Change the `STORY` block first: words, numbers, positions (0 to 1), steps and timing. Touch the drawing code only when the shape itself differs. When no template fits, build from the library helpers (cheat-sheet below) using a template as the skeleton.

Use only facts from the user's source. When a curve, position or number is illustrative, say so in the `.note` under the chart, because these charts look authoritative and readers will take them as data.

### 4. Theme it
The default is a neutral sketchbook look. For a brand, override the CSS tokens in a small theme file loaded after `scroll-sketch.css`; `lib/themes/business-design-labs.css` shows the pattern. Keep `--accent` for shapes (lines, dots, outlines, arrows) and keep text in `--ink` or `--muted`: brand colours are often too light for text.

### 5. Check it, desktop and phone
```bash
node scripts/capture.mjs page.html /tmp/ss && python3 scripts/contact_sheet.py /tmp/ss /tmp/ss.png
node scripts/capture.mjs page.html /tmp/ssm --mobile --width 600 && python3 scripts/contact_sheet.py /tmp/ssm /tmp/ssm.png
```
Look at both sheets. Fix labels that overlap each other, dots, boxes or axes; text clipped at the edge; steps where nothing visible happens; and an accent used on text. `references/craft.md` lists the usual fixes. Two or three passes is normal.

### 6. Deliver
- **One file:** `python3 scripts/bundle.py page.html out.html` (add `--fragment` for a WordPress Custom HTML block or a Claude artifact, which supply their own `<head>`).
- **Email GIFs:** `node scripts/capture.mjs page.html frames/` then `python3 scripts/make_gif.py frames/ gifs/`. Each GIF is about 1100px wide and loops; keep each under about 3 MB (use `--width 880` if not).
- Tell the user how to publish: the live page on their site, and in the email each GIF linking to it. `references/publishing.md` has the details, including the Outlook first-frame caveat.

## Library cheat-sheet

```js
const { scene, axes, arrow, box, label, reveal, grow, show, seg, ease, lerp, txt, el, edge, centre, fmt, pen } = Sketch;
scene('chart', {
  caps: [[0, 'First caption'], [0.4, 'Caption from 40%']],
  build(ctx) {                 // ctx: svg, W, H, mob (<560px), vh, rc (Rough.js), sd() (next seed), fs (font size)
    ctx.size(420);             // drawing height in px
    const { X, Y } = axes(ctx, { x: 'across', y: 'up', xEnds: ['low', 'high'] });   // X(0..1), Y(0..1) → px
    const line = el('g', { class: 'c-ink' }, ctx.svg);
    line.appendChild(ctx.rc.curve(points, { ...pen, strokeWidth: 2.4, seed: ctx.sd() }));
    const drawLine = reveal(ctx, line);                 // k => clip-reveal left to right
    const a = arrow(ctx.rc, ctx.svg, [x1, y1], [x2, y2], 20, { cls: 'c-accent' });   // a.set(k) draws it
    const b = box(ctx.rc, ctx.svg, { cx, cy, w: 120, h: 44 }, ['two', 'lines']);
    const note = label(ctx.svg, x, y, ['handwritten', 'note'], { anchor: 'middle' }); // show(note, true)
    return p => { drawLine(seg(p, 0, .1)); a.set(seg(p, .2, .3)); show(note, p > .4); };
  },
});
```

Colour classes on a group set `currentColor`: `c-ink`, `c-muted`, `c-accent`, `c-alt` (second accent), `c-hatch`. Text classes: `ink`, `mut`. Items with class `it` or `lab` fade in when `show(node, true)` adds `on`; `sw` + `off` swaps text in place; `dim` fades something back.

`build` runs on load and again when the width changes, so draw everything there with fixed seeds (`ctx.sd()`); the function it returns runs on every scroll frame, so it should only move and toggle things.
