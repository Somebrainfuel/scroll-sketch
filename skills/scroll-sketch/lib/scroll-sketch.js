/* Scroll Sketch v1.0 · hand-drawn, scroll-driven charts · MIT licence
   Needs Rough.js 4.6 (https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js) loaded first.

   The idea: a chart sits in a tall <section class="scrolly">, pinned with position: sticky.
   Scrolling through the section gives one number, p, from 0 to 1. Your chart's apply(p) turns
   slices of p into steps: seg(p, 0.1, 0.3) is 0 before 10% of the way, 1 after 30%, and rises between.

   Sketch.scene('my-id', {
     caps: [[0, 'Caption shown from the start'], [0.4, 'Caption from 40% onwards']],
     build(ctx) {             // runs on load and whenever the width changes
       ctx.size(400);         // set the drawing height in px (ctx.W is the width)
       ...draw with ctx.rc (Rough.js) and the helpers below...
       return p => { ... };   // runs on every scroll frame: move and toggle, don't redraw
     }
   });
*/
(function (global) {
'use strict';
const NS = 'http://www.w3.org/2000/svg';

/* ---------- small helpers ---------- */
const el = (name, attrs, parent) => {
  const e = document.createElementNS(NS, name);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
// handwritten text. o: size, anchor ('start'|'middle'|'end'), cls ('ink'|'mut' plus 'sw'/'off'), rot (degrees)
const txt = (g, x, y, s, o = {}) => {
  const t = el('text', { x, y, 'text-anchor': o.anchor || 'start', 'font-size': o.size || 14 }, g);
  t.setAttribute('class', o.cls || 'ink');
  if (o.rot) t.setAttribute('transform', `rotate(${o.rot} ${x} ${y})`);
  t.textContent = s;
  return t;
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
// seg: where p sits between a and b, as 0..1
const seg = (p, a, b) => clamp((p - a) / (b - a));
// ease: slow start, slow end
const ease = k => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const fmt = n => Math.round(n).toLocaleString('en-GB');
const show = (node, on) => { node.classList.toggle('on', !!on); return node; };
const pen = { stroke: 'currentColor' };

// reveal a Rough.js shape by drawing along its stroke. Returns k => draw fraction k (0..1).
// Doesn't work on dashed lines (they already use the dash pattern): use reveal() for those.
function grow(g) {
  const ps = [...g.querySelectorAll('path')].map(p => {
    let len = 0; try { len = p.getTotalLength(); } catch (e) { len = 0; }
    p.style.strokeDasharray = `${len} ${len}`; p.style.strokeDashoffset = len;
    return { p, len };
  });
  return k => ps.forEach(({ p, len }) => { p.style.strokeDashoffset = len * (1 - k); });
}

let clipN = 0;
// reveal anything left to right with a growing clip. Returns k => reveal fraction k.
function reveal(ctx, node, o = {}) {
  const id = 'ssclip' + (++clipN);
  const defs = ctx.svg.querySelector('defs') || el('defs', null, ctx.svg);
  const cp = el('clipPath', { id }, defs);
  const x0 = o.from ?? 0, x1 = o.to ?? ctx.W + 20;
  const r = el('rect', { x: x0, y: -60, width: 0, height: ctx.H + 120 }, cp);
  node.setAttribute('clip-path', `url(#${id})`);
  return k => r.setAttribute('width', Math.max(0, (x1 - x0) * k));
}

// a hand-drawn arrow from a to b along a gentle curve (bend: px, + or -).
// o: cls (colour class), w (stroke width), dash ([6,5]), seed, head (size), rough
// Returns { g, line, head, mid, set(k) }: set(k) draws it to k and shows the head at the end.
function arrow(rc, parent, a, b, bend = 0, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const n = [-dy / len, dx / len], c = [(a[0] + b[0]) / 2 + n[0] * bend, (a[1] + b[1]) / 2 + n[1] * bend];
  const q = t => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(q(i / 10));
  const g = el('g', { class: o.cls || 'c-ink' }, parent);
  const line = el('g', null, g);
  const w = o.w || 1.8, seed = o.seed || 3;
  line.appendChild(rc.curve(pts, { ...pen, strokeWidth: w, roughness: o.rough ?? .8, seed, ...(o.dash ? { strokeLineDash: o.dash } : {}) }));
  const ang = Math.atan2(b[1] - pts[9][1], b[0] - pts[9][0]), hl = o.head || 10;
  const head = el('g', { class: 'head' }, g);
  head.appendChild(rc.linearPath([[b[0] - hl * Math.cos(ang - .45), b[1] - hl * Math.sin(ang - .45)], b, [b[0] - hl * Math.cos(ang + .45), b[1] - hl * Math.sin(ang + .45)]], { ...pen, strokeWidth: w, roughness: .4, seed: seed + 1 }));
  const draw = o.dash ? (k => { line.style.opacity = k > 0 ? 1 : 0; }) : grow(line);
  return { g, line, head, mid: q(.5), set(k) { draw(k); show(head, k > .97); } };
}

// the point on a box's edge that faces point t (boxes are {cx, cy, w, h})
function edge(b, t, pad = 4) {
  const dx = t[0] - b.cx, dy = t[1] - b.cy;
  const s = Math.min((b.w / 2 + pad) / Math.max(1e-6, Math.abs(dx)), (b.h / 2 + pad) / Math.max(1e-6, Math.abs(dy)));
  return [b.cx + dx * s, b.cy + dy * s];
}
const centre = b => [b.cx, b.cy];

// a sketched box with centred lines of text. o: cls (outline colour), fs (font size), sw (stroke width), seed
function box(rc, parent, b, lines, o = {}) {
  const g = el('g', { class: 'bx ' + (o.cls || 'c-ink') }, parent);
  el('rect', { x: b.cx - b.w / 2, y: b.cy - b.h / 2, width: b.w, height: b.h, rx: 3, class: 'bfill' }, g);
  g.appendChild(rc.rectangle(b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h, { ...pen, strokeWidth: o.sw || 1.5, roughness: .9, seed: o.seed || 7 }));
  const fs = o.fs || 14, lh = fs * 1.2;
  [].concat(lines).forEach((s, i, all) => txt(g, b.cx, b.cy + (i - (all.length - 1) / 2) * lh + fs * .34, s, { anchor: 'middle', size: fs }));
  return g;
}

// a hidden label (rows of handwritten text with a halo); show(label, true) fades it in.
// o: size, anchor, tone ('ink'|'mut'), lh (line height multiplier)
function label(parent, x, y, rows, o = {}) {
  const g = el('g', { class: 'lab halo' + (o.visible ? ' on' : '') }, parent);
  const size = o.size || 14, lh = size * (o.lh || 1.25);
  [].concat(rows).forEach((s, i) => txt(g, x, y + i * lh, s, { size, anchor: o.anchor || 'start', cls: o.tone || 'ink' }));
  return g;
}

// sketched axes with arrowheads and labels. o: x, y (axis titles), xEnds/yEnds ([low, high] words),
// left, right, top, bottom (margins). Returns { X, Y, L, R, T, B }: X(0..1) and Y(0..1) map to px.
function axes(ctx, o = {}) {
  const { svg, W, H, rc, mob } = ctx;
  const L = o.left ?? 30, R = o.right ?? (mob ? 8 : 14), T = o.top ?? 14, B = o.bottom ?? 50;
  const X = v => L + 10 + v * (W - L - R - 20), Y = v => H - B - 8 - v * (H - B - T - 24);
  const ax = el('g', { class: 'c-ink' }, svg), sw = { ...pen, strokeWidth: 1.8 };
  ax.appendChild(rc.line(L, H - B, W - R, H - B, { ...sw, roughness: 1, seed: ctx.sd() }));
  ax.appendChild(rc.linearPath([[W - R - 9, H - B - 6], [W - R, H - B], [W - R - 9, H - B + 6]], { ...sw, roughness: .6, seed: ctx.sd() }));
  if (o.y !== false) {
    ax.appendChild(rc.line(L, H - B, L, T - 6, { ...sw, roughness: 1, seed: ctx.sd() }));
    ax.appendChild(rc.linearPath([[L - 6, T + 3], [L, T - 6], [L + 6, T + 3]], { ...sw, roughness: .6, seed: ctx.sd() }));
  }
  const al = el('g', { class: 'axl' }, svg), fs = ctx.fs;
  if (o.xEnds) { txt(al, X(0), H - B + 20, o.xEnds[0], { size: fs, cls: 'mut' }); txt(al, X(1), H - B + 20, o.xEnds[1], { size: fs, anchor: 'end', cls: 'mut' }); }
  if (o.x) txt(al, (L + W - R) / 2, H - B + 40, o.x, { anchor: 'middle', size: fs + 1, cls: 'mut' });
  if (o.y) txt(al, L - 10, (T + H - B) / 2, o.y, { anchor: 'middle', size: fs + 1, rot: -90, cls: 'mut' });
  if (o.yEnds && o.y !== false) { txt(al, L - 10, Y(0), o.yEnds[0], { size: fs, rot: -90, cls: 'mut' }); txt(al, L - 10, Y(1), o.yEnds[1], { size: fs, rot: -90, anchor: 'end', cls: 'mut' }); }
  return { X, Y, L, R, T, B };
}

// one pinned, scroll-driven chart. See the comment at the top for the shape of opts.
function scene(id, opts) {
  const sec = document.getElementById(id);
  if (!sec) { console.warn('Scroll Sketch: no section with id', id); return; }
  const host = sec.querySelector('.host'), cap = sec.querySelector('.caption');
  const svg = el('svg', { class: 'ch', 'aria-hidden': 'true' }, host);
  const caps = opts.caps || [];
  let apply = null, lastW = 0, lastC = -1;
  function draw() {
    const W = Math.round(host.clientWidth);
    if (!W || typeof rough === 'undefined') return;
    lastW = W; svg.innerHTML = '';
    let seed = 7;
    const ctx = {
      svg, W, H: 400, mob: W < 560, vh: innerHeight || 720,
      rc: rough.svg(svg, { options: { disableMultiStroke: true } }),
      sd: () => (seed += 7),
      size(h) { ctx.H = Math.round(h); svg.setAttribute('viewBox', `0 0 ${W} ${ctx.H}`); svg.setAttribute('width', W); svg.setAttribute('height', ctx.H); },
    };
    ctx.fs = ctx.mob ? 12.5 : 14;
    ctx.size(400);
    apply = opts.build(ctx);
  }
  function update() {
    const r = sec.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    if (apply) apply(p);
    let c = -1; caps.forEach((row, i) => { if (p >= row[0]) c = i; });
    if (cap && c !== lastC) { lastC = c; cap.textContent = c >= 0 ? caps[c][1] : ''; }
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  new ResizeObserver(() => { if (Math.round(host.clientWidth) !== lastW) { draw(); update(); } }).observe(host);
  draw(); update();
  if (document.fonts) document.fonts.ready.then(() => { draw(); update(); });
}

global.Sketch = { scene, el, txt, clamp, seg, ease, lerp, fmt, show, grow, reveal, arrow, edge, centre, box, label, axes, pen };
})(window);
