# Craft: making scroll charts read well

## Timing
- Give each section 400 to 600 viewport heights (`style="--len:440"`). Taller is slower and calmer; under 350 feels rushed.
- One beat per 8 to 15% of scroll. Leave 3 to 5% gaps between beats where nothing changes, so the reader can take in each state.
- Finish by about p = 0.9 and let the complete chart sit for the rest. The last frame is also the GIF's poster and what most people screenshot.
- Captions change with the beats. One sentence each, written as the point, not a description ("Each one makes the first yes smaller", not "Dots move left").

## What's on screen
- The first frame should already say what the chart is: axes and titles, or the boxes, visible at rest. A blank stage looks broken in a thumbnail and in email.
- One accent colour for the thing that matters. Everything else in ink, muted or hatched grey. If two things are accent, neither stands out.
- Accent on shapes, never on text: many brand colours fail contrast as text. Labels stay `ink` or `mut`.
- Mark made-up numbers and curve shapes as illustrative in the `.note` under the chart.

## Labels
- Labels collide more than anything else. Work out where each one ends: estimate about 0.55 × font size per character in Shantell Sans.
- Put labels in empty space and connect them with a dotted leader (`.lead`) rather than squeezing them beside a crowded point.
- When several items share a region, park their labels in a column and order the column so leader lines don't cross (the rightmost item gets the top row).
- Use `label()` or a `.halo` group so text stays readable where it crosses a line.
- Swapping a label in place (`sw` / `off`) reads better than moving two labels around.

## Mobile (under 560px wide)
- Give the chart more height on phones (for example `vh - 240`, capped at about 520px) so items have vertical room.
- Use shorter words or two-line labels, and a smaller font (`ctx.fs` is 12.5 on phones, 14 on desktop).
- Rearrange rather than shrink: a timeline can turn vertical, bars can turn horizontal, a flow diagram can stack. Keep a separate position set for mobile in `STORY` when the layout differs.

## Drawing
- Fixed seeds (`ctx.sd()`) on every Rough.js shape, or shapes re-wobble on each resize.
- `build()` draws everything; the returned `apply(p)` only toggles classes, sets transforms and dash offsets. Redrawing in `apply` makes scrolling stutter.
- To draw a line along its length use `grow()` (dash offset) or `arrow().set(k)`. Dashed lines can't use dash offset, so reveal them with `reveal()` (a growing clip) or a fade.
- Draw backgrounds (hatched regions) first, axes next, then lines, then dots and labels on top. Use `svg.insertBefore(node, svg.firstChild)` to push something to the back.
- Rough.js `fillStyle: 'hachure'` with `hachureGap` 6 to 8 gives the sketchy fill; `fillStyle: 'solid'` for dots.

## Pitfalls that cost time
- **Screenshot clips are in page coordinates.** When capturing a pinned chart, add `scrollY` to the clip's y. (`capture.mjs` does this.)
- **No viewport meta, no mobile layout.** A page without `<meta name="viewport" content="width=device-width,initial-scale=1">` lays out at 980px on phones.
- **`margin: 0` on the stage figure** stops it centring on wide screens. `.stage` already sets `margin: 0 auto`.
- **Fonts load late.** Measurements taken before the handwriting font loads are wrong; `scene()` redraws once `document.fonts.ready` resolves.
- **GIF colours go muddy.** A small accent becomes brown when a 64-colour palette is built from mostly grey frames. `make_gif.py` adds the theme colours as swatches before building the palette.
