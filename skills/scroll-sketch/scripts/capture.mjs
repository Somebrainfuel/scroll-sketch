#!/usr/bin/env node
// Scroll Sketch · capture.mjs
// Scrolls through every pinned chart on a page in headless Chrome and saves one PNG per step,
// cropped to the chart and its caption. make_gif.py turns the frames into GIFs.
//
// usage: node capture.mjs <page.html | url> <out-dir> [--width 1100] [--mobile] [--dark] [--only id1,id2] [--step-ms 110]
// needs: Node 22+ and Chrome or Chromium (set CHROME=/path/to/chrome if it isn't found)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const args = process.argv.slice(2);
const VALUED = ['--width', '--only', '--step-ms'];   // flags that take a value; --mobile and --dark don't
const flags = {}, pos = [];
for (let i = 0; i < args.length; i++) {
  if (VALUED.includes(args[i])) flags[args[i].slice(2)] = args[++i];
  else if (args[i].startsWith('--')) flags[args[i].slice(2)] = true;
  else pos.push(args[i]);
}
const opt = (name, dflt) => flags[name] ?? dflt;
const [src, out] = pos;
if (!src || !out) { console.error('usage: node capture.mjs <page.html | url> <out-dir> [--width 1100] [--mobile] [--dark] [--only id1,id2]'); process.exit(1); }
const WIDTH = +opt('width', 1100), MOBILE = !!opt('mobile', false), DARK = !!opt('dark', false), STEP = +opt('step-ms', 110);
const ONLY = opt('only', '') ? String(opt('only')).split(',') : null;
const url = /^https?:|^file:/.test(src) ? src : pathToFileURL(resolve(src)).href;

function findChrome() {
  if (process.env.CHROME && existsSync(process.env.CHROME)) return process.env.CHROME;
  const pw = join(homedir(), process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
  const cands = [];
  if (existsSync(pw)) for (const d of readdirSync(pw)) {
    if (d.startsWith('chromium_headless_shell-')) for (const s of readdirSync(join(pw, d))) cands.push(join(pw, d, s, 'chrome-headless-shell'));
    if (d.startsWith('chromium-')) cands.push(join(pw, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'), join(pw, d, 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium'), join(pw, d, 'chrome-linux/chrome'));
  }
  cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
  return cands.find(existsSync);
}
const CHROME = findChrome();
if (!CHROME) { console.error('Chrome not found. Install Chrome, or set CHROME=/path/to/chrome.'); process.exit(1); }

const PORT = 9300 + Math.floor(Math.random() * 600);
const VW = MOBILE ? 390 : 860, VH = MOBILE ? 844 : 860;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', `--user-data-dir=${join(tmpdir(), 'scroll-sketch-' + PORT)}`, `--window-size=${VW},${VH}`, 'about:blank'], { stdio: 'ignore' });

let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  let list;
  for (let t = 0; t < 60 && !list; t++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { await sleep(200); } }
  if (!list) throw new Error('Chrome did not start');
  ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); const p = m.id && pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };

  await send('Page.enable'); await send('Runtime.enable');
  // layout at 1x; each screenshot is scaled so the output is WIDTH px wide
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: MOBILE });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: DARK ? 'dark' : 'light' }] });
  await send('Page.navigate', { url });
  for (let t = 0; t < 80; t++) { await sleep(250); if (await ev(`document.readyState==='complete' && typeof rough!=='undefined' && document.fonts.status==='loaded'`)) break; }
  await sleep(600);
  if (!(await ev(`typeof rough!=='undefined'`))) throw new Error('Rough.js did not load (offline?)');

  const scenes = await ev(`[...document.querySelectorAll('section.scrolly[id]')].map(s=>({id:s.id, vh:s.offsetHeight/innerHeight}))`);
  const colors = await ev(`(()=>{const cs=getComputedStyle(document.documentElement);return ['--accent','--accent-2','--ink','--muted','--ground'].map(v=>cs.getPropertyValue(v).trim()).filter(Boolean)})()`);
  const todo = scenes.filter(s => !ONLY || ONLY.includes(s.id));
  if (!todo.length) throw new Error('No <section class="scrolly" id="..."> found' + (ONLY ? ' matching --only' : ''));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'meta.json'), JSON.stringify({ url, colors, mobile: MOBILE, dark: DARK, scenes: todo.map(s => s.id) }, null, 2));

  for (const sc of todo) {
    const dir = join(out, sc.id); mkdirSync(dir, { recursive: true });
    const frames = Math.max(30, Math.round(sc.vh * 18)); // about 18 frames per screen of scrolling
    await ev(`(async()=>{const s=document.getElementById('${sc.id}');scrollTo(0,s.offsetTop+1);await new Promise(r=>setTimeout(r,500))})()`);
    // the pinned stage sits still on screen; measure it once (screen coordinates)
    const box = await ev(`(()=>{const s=document.getElementById('${sc.id}');const f=(s.querySelector('figure')||s.querySelector('.host')).getBoundingClientRect(),c=s.querySelector('.caption');const cr=c?c.getBoundingClientRect():f;
      const pad=${MOBILE ? 8 : 24},x=Math.max(0,Math.min(f.left,cr.left)-pad),y=Math.max(0,Math.min(f.top,cr.top)-20),r=Math.min(innerWidth,Math.max(f.right,cr.right)+pad),b=Math.min(innerHeight,Math.max(f.bottom,cr.bottom)+16);return {x,y,width:r-x,height:b-y}})()`);
    const scale = WIDTH / box.width;
    for (let i = 0; i <= frames; i++) {
      const sy = await ev(`(()=>{const s=document.getElementById('${sc.id}');scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*${i / frames});return scrollY})()`);
      await sleep(STEP); // lets fades play between frames, close to real time
      // screenshot clips are in page coordinates, so add the scroll offset
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...box, y: box.y + sy, scale } });
      writeFileSync(join(dir, String(i).padStart(3, '0') + '.png'), Buffer.from(shot.data, 'base64'));
    }
    console.log(`${sc.id}: ${frames + 1} frames`);
  }
} catch (e) {
  console.error('capture failed:', e.message); process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill();
}
