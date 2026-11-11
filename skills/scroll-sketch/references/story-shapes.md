# Story shapes: which template fits

Pick by the claim the chart has to make, not by the data you happen to have.

| Claim sounds like… | Shape | Template |
|---|---|---|
| "X moved it to a better place" | Something shifts | `01-curve-shift`, `02-quadrant-move` |
| "It's bigger / faster / cheaper than you think" | How big | `03-count-up`, `04-before-after` |
| "The route changed" | How it connects | `05-flow-reroute`, `08-flywheel` |
| "It happened in this order" | Over time | `06-timeline`, `09-s-curve-jump` |
| "Here's where people drop out" | Drop-off | `07-funnel` |
| "Here's where the money goes" | Bridge | `10-waterfall` |
| "Here's the size of the prize" | Nested | `11-market-size` |
| "Here's when it pays" | Crossing lines | `12-break-even` |

## The templates

**01 · Curve shift.** Items sit on a known curve (demand, adoption, price) and slide to a better spot.
Beats: curve draws → items appear with parked labels → a region is marked ("not yet") → each item slides along the curve, its label swapping to the new name → a closing arrow names the move.
Example: three businesses making the first yes smaller (New Combinations, Issue 1).

**02 · Quadrant move.** A 2×2 where an item changes quadrant.
Beats: axes and quadrant names → items land → the key item moves with a trail → note names the move.
Example: Netflix from DVDs by mail to streaming to its own originals.

**03 · Count up.** A grid of unit dots fills, then the maths.
Beats: dots fill with a running count → the total lands → a handwritten sum appears line by line → the answer is underlined → one dot is circled to make it personal.
Example: Holo's 20,000 paying businesses, ≈ $21 each a month.

**04 · Before / after bars.** Bars grow, then one collapses or jumps.
Beats: bars grow → the "after" bar changes, its label swapping → a difference annotation.
Example: 120ft's robots learning a skill in 7 hours instead of 7 weeks.

**05 · Flow reroute.** Boxes and arrows: the old route, then a new one through someone.
Beats: the first flow → the existing workaround (dashed) → the new box appears and the old route dims → the new route draws → money and data flow back.
Example: IKEA's second-hand marketplace.

**06 · Timeline.** Milestones on a hand-drawn line, then a bracketed phase.
Beats: line draws → milestones drop in → a phase is bracketed with a note.
Example: Amazon beyond books, 1994 to 2007.

**07 · Funnel.** Stages narrow; the drop-off between each is marked.
Beats: stages draw with counts → drop-offs are hatched with % lost → the biggest drop is circled.
Example: an illustrative free-trial funnel.

**08 · Flywheel.** A loop of causes that feeds itself.
Beats: nodes appear → arrows draw in order → the loop closes → it speeds up → the centre label lands.
Example: Amazon's flywheel as Bezos sketched it.

**09 · S-curve jump.** One adoption curve tops out while the next one rises.
Beats: first curve draws → a marker ("you are here", or a key date) → the second curve rises past it → note on the jump.
Example: Kodak built the first digital camera in 1975 and didn't jump.

**10 · Waterfall.** From a starting value through each step to the result.
Beats: start bar → each step floats down (or up) with its value → the final bar in accent.
Example: where an illustrative £4 flat white goes.

**11 · Market size.** Nested circles: total market, the part you can serve, the part you can win.
Beats: TAM → SAM → SOM, each with a plain-English label → the SOM ring in accent → a share callout.
Example: an illustrative bookkeeping app for sole traders.

**12 · Break-even.** Cost and revenue lines cross; profit fills beyond.
Beats: fixed costs → total costs → revenue → the crossing is circled → profit area fills.
Example: illustrative fixed costs of £60,000, price £50, variable cost £20 → 2,000 units.

## When nothing fits
Combine helpers. Most new shapes are a mix of: things appearing (`it` + `show`), things drawing (`reveal`, `grow`, `arrow().set`), things moving (a transform interpolated with `ease(seg(p, a, b))`) and labels swapping (`sw`/`off`). Start from the template whose layout is closest and change the drawing code.
