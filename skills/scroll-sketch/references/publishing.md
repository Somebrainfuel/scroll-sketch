# Publishing

## One self-contained file
Templates load the library by relative path (`../lib/...`) so they can be edited in place. For publishing, inline it:
```bash
python3 scripts/bundle.py my-page.html my-page.single.html            # full HTML document
python3 scripts/bundle.py my-page.html my-page.fragment.html --fragment # no <html>/<head>/<body>, for hosts that add their own
```
Rough.js and Google Fonts stay as CDN links.

## Where it can live
- **Any static host** (GitHub Pages, Netlify, Cloudflare Pages): upload the single file.
- **WordPress:** create a page, choose a blank or full-width template (sidebars squeeze the chart), add one *Custom HTML* block and paste the `--fragment` output. Some security plugins strip `<script>`; if the chart doesn't appear, check that first.
- **Ghost / Substack / Beehiiv web posts:** Ghost supports an HTML card. Substack and Beehiiv web posts don't run custom scripts, so host the page elsewhere and link to it, using the GIF in the post.
- **Claude artifact:** publish the `--fragment` output. Artifacts allow scripts from cdn.jsdelivr.net/npm and fonts from Google Fonts, so Rough.js and the fonts load as they are.

## Email
Email clients strip scripts, so send GIFs and link each one to the live page.
```bash
node scripts/capture.mjs my-page.html frames/        # every <section class="scrolly" id="..."> on the page
python3 scripts/make_gif.py frames/ gifs/            # one looping GIF and one poster PNG per chart
```
- GIFs come out 1100px wide. Set the image to display at about 550 to 600px in the email so it's sharp on high-resolution screens.
- Keep each GIF under about 3 MB; Gmail clips and slows heavy emails. If one is over, try `--width 880`, fewer colours (`--colors 48`), or a shorter section.
- Link every GIF to the live page and add a line such as "the charts move when you scroll the web version".
- **Outlook on Windows shows only the first frame.** Normally that's the chart before it builds. If many readers use Outlook, add `--poster-first` so the GIF opens on the finished chart for 1.5 seconds, then builds; or use the `-poster.png` instead.
- Alt text: reuse the chart's `aria-label`, which already describes the whole story.

## Requirements
- `capture.mjs`: Node 22 or later, and Chrome or Chromium. It looks for Playwright's cached Chromium, then Google Chrome; set `CHROME=/path/to/chrome` if it can't find one.
- `make_gif.py`, `contact_sheet.py`: Python 3 with Pillow (`pip install pillow`).
- Capturing needs network access for Rough.js and the fonts.
