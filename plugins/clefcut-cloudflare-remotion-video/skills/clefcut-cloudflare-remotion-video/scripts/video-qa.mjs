#!/usr/bin/env node
// video-qa.mjs — frame-level QA for Remotion renders: free local frame checks + OCR first,
// Cloudflare Workers AI decision (CLEF) + extraction (CLAIRIC) models second. Single file,
// zero npm dependencies (node: builtins; tesseract.js used opportunistically when present).
// Node 18+. MIT license. Design adapted from Levanto Labs SageCut (MIT): ffmpeg/compositor
// discovery, image batching, retry shape.
//
// Env (process env wins, then <cwd>/.env, then ~/.clefcut/.env; values never printed):
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Workers AI: Read, plus Edit unless the
//   token was created from the dashboard template), CLEFCUT_GATEWAY_ID (optional AI
//   Gateway id), CLEFCUT_FFMPEG / CLEFCUT_FFPROBE (optional binary paths), CLEFCUT_YES=1
//   (acts like passing --yes to the cost gate).
//
// Usage: node video-qa.mjs --help | doctor [--ping] | frames <video> [--fps N] [--width W]
//   [--out dir] [--frames A-B] [--test-width [N]] [--safe shorts|tiktok|reels|creator] [--diff]
//   [--sheet] | check <framesDir> [--declared declared.json] [--ink-threshold 12] | compare
//   <a.png> <b.png> (or two frame dirs) [--out compare.png] | text <framesDir|video> |
//   ask <framesDir|video> --questions q.json | extract <framesDir|video> --fields f.json |
//   synthesize <framesDir> --out dir | --selftest

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------- constants

const QA_STATE = 'Motion-graphics QA frame from a Remotion render. Answer per question.';
const PRICES = { clef: 0.24, 'clef-flash': 0.038, 'clef-omni': 0.15, clairic: 0.10 }; // $/Mtok input; output free
const MAX_IMAGES = 4;                        // API hard cap per request
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;     // 4 MiB per image (fact sheet)
const BATCH_BYTES = 6 * 1024 * 1024;         // pre-split raw PNG bytes per request (8 MiB decoded / 13 MiB body caps)
const GATE_MAX_FRAMES = 240;                 // above this, ask/text/extract need --yes
const PACE_MS = 300;                         // minimum delay between API requests
const CHOICE_CONF_FLOOR = 0.5;               // choice answers below this confidence escalate
const TIMEOUT_MS = 120_000;
const RETRIES = 3;                           // 429/5xx: backoff 1s, 2s, 4s (retry-after honored, capped 60s)
const CHECKS = { blackMean: 16, blackStd: 4, frozenDiff: 0.5, flashJump: 60 };
const SEVERITY = { black: 'major', frozen: 'major', flash: 'minor', ink: 'minor' };
const INK = { threshold: 12, minFraction: 0.005 };

// UI-occlusion safe zones per platform — the SINGLE SOURCE OF TRUTH for the numbers.
// Docs (SKILL.md, references/*) reference this table by name and never repeat the values.
// frac zones: top/bottom are fractions of the frame HEIGHT, right of the WIDTH. px zones
// (tiktok) are absolute at the reference size and scale uniformly with frame_width /
// ref.width. All zones are community-measured overlays of where the platform's own UI
// covers the video. For Reels the official ads-only guideline is a bottom 40% keep-out;
// this table keeps the community-measured 30% so organic and paid content share one overlay.
const SAFE_ZONES = {
  creator: { zones: [{ edge: 'top', frac: 0.15 }, { edge: 'bottom', frac: 0.30 }, { edge: 'right', frac: 0.10 }] },
  shorts: { zones: [{ edge: 'top', frac: 0.10 }, { edge: 'bottom', frac: 0.30 }] },
  tiktok: { ref: { width: 1080, height: 1920 }, zones: [{ edge: 'top', px: 130 }, { edge: 'bottom', px: 484 }, { edge: 'right', px: 140 }] },
  reels: { zones: [{ edge: 'top', frac: 0.14 }, { edge: 'bottom', frac: 0.30 }, { edge: 'right', frac: 0.06 }] },
};

/** Pixel rects {x,y,w,h} for a platform's occlusion zones on a w x h frame. */
export function safeZoneRects(platform, w, h) {
  const spec = SAFE_ZONES[platform];
  if (!spec) throw new UserError(`--safe must be one of: ${Object.keys(SAFE_ZONES).join(', ')}. Got: ${platform}`);
  const s = spec.ref ? w / spec.ref.width : 1;
  return spec.zones.map((z) => {
    const band = Math.max(1, Math.round(z.frac != null ? (z.edge === 'right' ? z.frac * w : z.frac * h) : z.px * s));
    const v = Math.min(band, z.edge === 'right' ? w : h);
    if (z.edge === 'top') return { x: 0, y: 0, w, h: v };
    if (z.edge === 'bottom') return { x: 0, y: h - v, w, h: v };
    return { x: w - v, y: 0, w: v, h };
  });
}

/** Median luma of a gray buffer via a 256-bin histogram (O(n); frames are large). */
export function medianLuma(buf) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < buf.length; i++) hist[buf[i]]++;
  const half = Math.ceil(buf.length / 2);
  let acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= half) return v; }
  return 255;
}

/** Fraction of pixels deviating more than `thr` from the median — how much of the frame is "drawn". */
export function inkFraction(buf, median, thr) {
  if (!buf.length) return 0;
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (Math.abs(buf[i] - median) > thr) n++;
  return n / buf.length;
}

/** Argument check for `compare` (pure): null when the positional list is exactly two inputs. */
export function compareArgError(args) {
  if (!args || args.length === 0) return 'compare needs two inputs: compare <before.png> <after.png> [--out compare.png] (or two frame dirs).';
  if (args.length === 1) return 'compare needs TWO inputs (before and after); got one.';
  if (args.length > 2) return `compare takes exactly two inputs (before and after); got ${args.length}.`;
  return null;
}

const DEFAULT_TEXT_FIELDS = { onscreen_text: { type: 'text', instructions: 'All text visible in the frame, in reading order' } };
const IS_WIN = process.platform === 'win32';
const EXE = IS_WIN ? '.exe' : '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

class UserError extends Error {}

// ---------------------------------------------------------------- env + redaction

/** Parse .env text into a KEY=VALUE map. Handles comments, quotes, `export `. */
export function parseEnvText(text) {
  const out = {};
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, '');
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    else { const c = val.indexOf(' #'); if (c > 0) val = val.slice(0, c).trim(); }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) out[key] = val;
  }
  return out;
}

/**
 * Layer .env file contents under the process env. `layers` is ordered LOWEST precedence
 * first (home .env, then project .env so the project wins); process env always wins.
 * Returns { env, sources } where sources maps each file-provided key to its label.
 */
export function mergeEnvLayered(processEnv, layers) {
  const file = {};
  const sources = {};
  for (const { text, label } of layers || []) {
    for (const [k, v] of Object.entries(parseEnvText(text || ''))) {
      file[k] = v;
      sources[k] = label;
    }
  }
  return { env: { ...file, ...processEnv }, sources };
}

let ENV_CACHE = null;
const PROJ_ENV_PATH = () => path.join(process.cwd(), '.env');
const HOME_ENV_PATH = () => path.join(os.homedir(), '.clefcut', '.env');
const readTextOrNull = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
function mergedEnv() {
  if (ENV_CACHE) return ENV_CACHE;
  const home = HOME_ENV_PATH();
  const proj = PROJ_ENV_PATH();
  ENV_CACHE = mergeEnvLayered(process.env, [
    { text: readTextOrNull(home), label: home },   // home first...
    { text: readTextOrNull(proj), label: proj },   // ...so the project file overrides it
  ]);
  return ENV_CACHE;
}

/** Where a config value came from: "process env", a file path, or null. Never the value. */
function envSource(key) {
  if (process.env[key] != null && process.env[key] !== '') return 'process env';
  return (mergedEnv().sources || {})[key] || null;
}

const cfg = () => {
  const e = mergedEnv().env;
  return { accountId: e.CLOUDFLARE_ACCOUNT_ID || '', token: e.CLOUDFLARE_API_TOKEN || '', gateway: e.CLEFCUT_GATEWAY_ID || '' };
};

function requireCreds() {
  const c = cfg();
  if (!c.accountId || !c.token) throw new UserError('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required (process env, ./.env or ~/.clefcut/.env). Run "video-qa.mjs doctor".');
}

const yesFlag = (o) => o.yes === true || String(mergedEnv().env.CLEFCUT_YES ?? '').trim() === '1';

/** Replace the API token (and account id) anywhere in a string so it can never be printed. */
export function redact(s) {
  const { token, accountId } = cfg();
  let out = String(s);
  if (token && token.length >= 8) out = out.split(token).join('***REDACTED***');
  if (accountId && accountId.length >= 8) out = out.split(accountId).join('***ACCOUNT***');
  return out;
}

// ---------------------------------------------------------------- small pure helpers

export function chunkAll(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Parse "A-B" or "A" into {a, b} (inclusive, 0-based); null when invalid. */
export function splitRange(s) {
  const m = /^(\d+)(?:-(\d+))?$/.exec(String(s || '').trim());
  if (!m) return null;
  const a = Number(m[1]); const b = m[2] == null ? a : Number(m[2]);
  return b >= a ? { a, b } : null;
}

/** Classify one answer. p = defect probability (higher = worse), t = pass threshold, margin = escalate band below t. */
export function classify(p, t, margin = 0.3, escalateOnly = false) {
  if (p == null || !Number.isFinite(p)) return 'escalate';
  if (t == null) return 'pass';
  if (p >= t) return escalateOnly ? 'escalate' : 'fail';
  if (p >= t - margin) return 'escalate';
  return 'pass';
}

/** Full classification of one raw answer: defect probability + the fixed choice-confidence floor. */
export function classifyAnswer(q, raw, passT, margin = 0.3, escalateOnly = false) {
  const cls = classify(defectProb(q, raw), passT, margin, escalateOnly);
  // Choice answers escalate on low confidence against a FIXED 0.5 floor — never the pass threshold.
  if (q.type === 'choice' && cls === 'pass' && raw && typeof raw.confidence === 'number' && raw.confidence < CHOICE_CONF_FLOOR) return 'escalate';
  return cls;
}

/**
 * Split files into request batches: at most `size` files AND at most `maxBytes` of raw PNG
 * bytes per batch (starts a new batch when the next file would overflow). Keeps requests
 * under the 8 MiB decoded / 13 MiB body caps without waiting for a 413.
 */
export function buildBatches(files, { size = MAX_IMAGES, maxBytes = BATCH_BYTES, sizeOf = null } = {}) {
  const max = Math.max(1, size);
  const sz = sizeOf || ((f) => { try { return fs.statSync(f.path).size; } catch { return 0; } });
  const out = [];
  let cur = [];
  let curBytes = 0;
  for (const f of files) {
    const b = sz(f);
    if (cur.length && (cur.length + 1 > max || curBytes + b > maxBytes)) { out.push(cur); cur = []; curBytes = 0; }
    cur.push(f);
    curBytes += b;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Rough input tokens for one frame: (w/32)*(h/32)+3, capped 1024; 600 (~960px class) when size unknown. */
export function estTokensPerFrame(w, h) {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 600;
  return Math.min(1024, Math.max(1, Math.round(w / 32)) * Math.max(1, Math.round(h / 32)) + 3);
}

function meanStd(buf) {
  let s = 0, s2 = 0;
  for (let i = 0; i < buf.length; i++) { s += buf[i]; s2 += buf[i] * buf[i]; }
  const n = buf.length || 1;
  const mean = s / n;
  return { mean, std: Math.sqrt(Math.max(0, s2 / n - mean * mean)) };
}

function meanAbsDiff(a, b) {
  let s = 0; const n = Math.min(a.length, b.length) || 1;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s / n;
}

// ---------------------------------------------------------------- ffmpeg (Remotion compositor first)

let FFMPEG_CACHE = null;

function compositorDirs(root) {
  const dirs = [];
  let dir = path.resolve(root);
  for (;;) {
    const nm = path.join(dir, 'node_modules', '@remotion');
    try { for (const e of fs.readdirSync(nm)) if (/^compositor-/.test(e)) dirs.push(path.join(nm, e)); } catch { /* not here */ }
    const up = path.dirname(dir);
    if (up === dir) return dirs;
    dir = up;
  }
}

/** One @remotion/compositor-* package as a candidate toolchain (no spawn test here). */
function compositorCandidate(pkgDir) {
  const pick = (names) => names.map((n) => path.join(pkgDir, n)).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  const ffmpeg = pick([`ffmpeg${EXE}`, path.join('bin', `ffmpeg${EXE}`)]);
  if (!ffmpeg) return null;
  const ffprobe = pick([`ffprobe${EXE}`, path.join('bin', `ffprobe${EXE}`)]) || `ffprobe${EXE}`;
  const env = { ...process.env };
  const lib = [path.dirname(ffmpeg), path.join(pkgDir, 'lib'), path.join(pkgDir, 'bin')].filter((p) => fs.existsSync(p)).join(':');
  if (process.platform === 'darwin') env.DYLD_LIBRARY_PATH = [lib, env.DYLD_LIBRARY_PATH].filter(Boolean).join(':');
  else if (process.platform === 'linux') env.LD_LIBRARY_PATH = [lib, env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  else if (IS_WIN) env.PATH = [lib, env.PATH || env.Path].filter(Boolean).join(';');
  return { ffmpeg, ffprobe, env, source: `remotion:${path.basename(pkgDir)}` };
}

/**
 * Resolve the ffmpeg toolchain: env override, then every @remotion/compositor-* candidate
 * (spawn-tested; failures fall through to the next), then system PATH. The first binary
 * that actually runs `ffmpeg -version` wins.
 */
async function locate() {
  if (FFMPEG_CACHE) return FFMPEG_CACHE;
  const candidates = [];
  if (process.env.CLEFCUT_FFMPEG) {
    candidates.push({ ffmpeg: process.env.CLEFCUT_FFMPEG, ffprobe: process.env.CLEFCUT_FFPROBE || path.join(path.dirname(process.env.CLEFCUT_FFMPEG), `ffprobe${EXE}`), env: { ...process.env }, source: 'env (CLEFCUT_FFMPEG)' });
  }
  for (const pkgDir of compositorDirs(process.cwd()).sort()) {
    const c = compositorCandidate(pkgDir);
    if (c) candidates.push(c);
  }
  candidates.push({ ffmpeg: `ffmpeg${EXE}`, ffprobe: `ffprobe${EXE}`, env: { ...process.env }, source: 'PATH' });
  let last = null;
  for (const c of candidates) {
    last = c;
    try {
      const v = await runExe(c.ffmpeg, ['-version'], { env: c.env });
      if (v.code === 0) { c.version = v.stdout.toString().split('\n')[0]; return (FFMPEG_CACHE = c); }
    } catch { /* spawn/access failure — try the next candidate */ }
  }
  return (FFMPEG_CACHE = last); // PATH fallback; downstream errors surface naturally
}

/** Run a binary, collect stdout/stderr; optionally write `input` to stdin (drain first: no pipe deadlock). */
function runExe(exe, args, { env = process.env, input = null } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(exe, args, { env, windowsHide: true });
    const out = []; let err = '';
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => { err += d.toString(); if (err.length > 400_000) err = err.slice(-200_000); });
    p.on('error', (e) => reject(new UserError(`${exe} could not start: ${e.message}. Run "video-qa.mjs doctor".`)));
    p.on('close', (code) => resolve({ code, stdout: Buffer.concat(out), stderr: err }));
    if (input) p.stdin.end(input); else p.stdin.end();
  });
}

const runFf = async (bin, args, opts = {}) => {
  const loc = await locate();
  return runExe(bin === 'ffprobe' ? loc.ffprobe : loc.ffmpeg, args, { ...opts, env: loc.env });
};

// Frame-accurate passthrough: ffmpeg >= 5.1 uses -fps_mode, ffmpeg 8 removed -vsync,
// ancient builds know neither. Probe once, cache the flag that works.
let SYNC_FLAG;
async function syncFlagArgs() {
  if (SYNC_FLAG !== undefined) return SYNC_FLAG;
  const { ffmpeg, env } = await locate();
  for (const cand of [['-fps_mode', 'passthrough'], ['-vsync', '0'], []]) {
    try {
      const r = await runExe(ffmpeg, ['-v', 'error', '-f', 'lavfi', '-i', 'nullsrc=s=64x64', ...cand, '-frames:v', '1', '-f', 'null', '-'], { env });
      if (r.code === 0) return (SYNC_FLAG = cand);
    } catch { /* try next */ }
  }
  return (SYNC_FLAG = []);
}

async function probe(video) {
  const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video]);
  if (r.code !== 0) throw new UserError(`ffprobe failed on ${video}: ${r.stderr.trim().slice(0, 300)}`);
  const j = JSON.parse(r.stdout.toString());
  const v = (j.streams || []).find((s) => s.codec_type === 'video');
  if (!v) throw new UserError(`${video} has no video stream.`);
  const [num, den] = String(v.avg_frame_rate || v.r_frame_rate || '30/1').split('/').map(Number);
  const fps = den ? num / den : num || 30;
  return { width: v.width, height: v.height, fps };
}

// ---------------------------------------------------------------- frames on disk

function listFrames(dir) {
  let manifest = null;
  const mp = path.join(dir, 'manifest.json');
  if (fs.existsSync(mp)) {
    try { manifest = readJson(mp); } catch { throw new UserError(`manifest.json in ${dir} is not valid JSON — re-run "frames" into a fresh dir.`); }
  }
  const pngs = fs.readdirSync(dir).filter((f) => /^frame_\d{6}\.png$/.test(f)).sort();
  if (manifest && Array.isArray(manifest.files)) {
    const names = manifest.files.map((f) => f && f.file);
    if (names.length !== pngs.length || names.some((n, i) => n !== pngs[i])) {
      throw new UserError(`stale frames dir — re-run frames into a fresh dir (manifest lists ${names.length} frame(s) but ${pngs.length} PNG file(s) are present in ${dir}).`);
    }
  }
  const useManifest = manifest && Array.isArray(manifest.files) && manifest.files.length === pngs.length;
  const files = useManifest
    ? manifest.files.map((f) => ({ index: f.index, path: path.join(dir, f.file), file: f.file }))
    : pngs.map((f, i) => ({ index: i, path: path.join(dir, f), file: f }));
  return { dir, files, fps: (manifest && (manifest.fps_used || manifest.fps_source)) || null, manifest };
}

/** Which tool-managed artifacts exist on disk in a frames dir (order: frames,test,diff,safe,sheet). */
export function dirArtifacts(dir) {
  const out = ['frames'];
  for (const k of ['test', 'diff', 'safe']) {
    const p = path.join(dir, k);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) out.push(k);
  }
  if (fs.existsSync(path.join(dir, 'sheet.png'))) out.push('sheet');
  return out;
}

/**
 * Extract PNG frames from a video into out/ (frame_%06d.png + manifest.json).
 * If out/ already exists it must hold ONLY tool-managed artifacts — frame_%06d.png, manifest.json,
 * findings.json (written by `check`), sheet.png, and the test/, diff/ and safe/ subdirs (written
 * here) — those are cleared so a range re-extract can never leave stale frames behind — anything
 * else in the dir is an error (choose a fresh --out). manifest.count = frames exported THIS run.
 */
async function extractFrames(video, { fps = null, width = null, out, range = null, testWidth = null, safe = null, diff = false, sheet = false }) {
  const info = await probe(video);
  const managed = (e) => /^frame_\d{6}\.png$/.test(e) || ['manifest.json', 'findings.json', 'sheet.png'].includes(e) || ['test', 'diff', 'safe'].includes(e) && fs.statSync(path.join(out, e)).isDirectory();
  if (fs.existsSync(out)) {
    if (!fs.statSync(out).isDirectory()) throw new UserError(`--out path exists and is not a directory: ${out}`);
    const entries = fs.readdirSync(out);
    for (const e of entries) {
      if (!managed(e)) {
        throw new UserError(`output dir has unrelated files; choose a fresh --out (found "${e}" in ${out})`);
      }
    }
    for (const e of entries) if (managed(e)) fs.rmSync(path.join(out, e), { force: true, recursive: true });
  }
  const vf = [];
  if (fps) vf.push(`fps=${fps}`);
  if (range) vf.push(`select=between(n\\,${range.a}\\,${range.b})`); // frame-accurate range (0-based)
  if (width != null) vf.push(`scale=${width}:-2`);                   // omitted width = native size, no scale filter
  const sync = await syncFlagArgs();
  const args = ['-v', 'error', '-y', '-i', video, ...(vf.length ? ['-vf', vf.join(',')] : []), ...sync, path.join(out, 'frame_%06d.png')];
  fs.mkdirSync(out, { recursive: true });
  const r = await runFf('ffmpeg', args);
  if (r.code !== 0) throw new UserError(`ffmpeg frame export failed: ${r.stderr.trim().slice(0, 300)}`);
  const pngs = fs.readdirSync(out).filter((f) => /^frame_\d{6}\.png$/.test(f)).sort();
  if (!pngs.length) throw new UserError(`No frames produced for ${video}${range ? ` in range ${range.a}-${range.b}` : ''}.`);
  if (testWidth != null) {
    fs.mkdirSync(path.join(out, 'test'), { recursive: true });
    const rt = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, 'frame_%06d.png'), '-vf', `scale=${testWidth}:-2`, ...sync, path.join(out, 'test', 'frame_%06d.png')]);
    if (rt.code !== 0) throw new UserError(`test-frame export failed: ${rt.stderr.trim().slice(0, 300)}`);
  }
  if (safe) {
    // Safe-zone frames: copies of the TEST-width frames with translucent red boxes over the
    // platform's UI occlusion zones (rects scale with the frame — see SAFE_ZONES).
    const tdir = path.join(out, 'test');
    const first = fs.readdirSync(tdir).filter((f) => /^frame_\d{6}\.png$/.test(f)).sort()[0];
    const pst = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(tdir, first)]);
    const st = JSON.parse(pst.stdout.toString()).streams[0];
    if (!st || !st.width) throw new UserError(`Could not probe test frame ${first}.`);
    const boxes = safeZoneRects(safe, st.width, st.height).map((rc) => `drawbox=x=${rc.x}:y=${rc.y}:w=${rc.w}:h=${rc.h}:color=red@0.30:t=fill`).join(',');
    fs.mkdirSync(path.join(out, 'safe'), { recursive: true });
    const rs = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', path.join(tdir, 'frame_%06d.png'), '-vf', boxes, ...sync, path.join(out, 'safe', 'frame_%06d.png')]);
    if (rs.code !== 0) throw new UserError(`safe-zone frame export failed: ${rs.stderr.trim().slice(0, 300)}`);
  }
  if (diff) {
    fs.mkdirSync(path.join(out, 'diff'), { recursive: true });
    const rd = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, 'frame_%06d.png'), '-vf', 'tblend=all_mode=difference,eq=contrast=8', ...sync, path.join(out, 'diff', 'diff_%06d.png')]);
    if (rd.code !== 0) throw new UserError(`diff-frame export failed: ${rd.stderr.trim().slice(0, 300)}`);
  }
  if (sheet) {
    const count = pngs.length;
    // 8-column contact sheet, at most 64 frames (evenly sampled when longer); rows made
    // explicit because some ffmpeg builds reject tile=Nx0.
    const step = Math.max(1, Math.ceil(count / 64));
    const selected = Math.floor((count - 1) / step) + 1;
    const cols = 8;
    const rows = Math.ceil(selected / cols);
    const tile = count > 64 ? `select=not(mod(n\\,${step})),scale=320:-2,tile=${cols}x${rows}` : `scale=320:-2,tile=${cols}x${rows}`;
    const rs = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, 'frame_%06d.png'), '-vf', tile, '-frames:v', '1', path.join(out, 'sheet.png')]);
    if (rs.code !== 0) throw new UserError(`contact sheet export failed: ${rs.stderr.trim().slice(0, 300)}`);
  }
  const start = range ? range.a : 0;
  const scaledH = Math.round(info.height * width / info.width);
  const height = width != null ? scaledH - (scaledH % 2) : info.height;
  const manifest = {
    source: path.resolve(video), width: width != null ? width : info.width, height, fps_source: info.fps, fps_used: fps || null,
    frame_start: start, count: pngs.length, created_at: new Date().toISOString(), artifacts: dirArtifacts(out),
    command: `ffmpeg ${args.join(' ')}`, files: pngs.map((f, i) => ({ index: start + i, file: f })),
  };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { dir: out, files: manifest.files.map((f) => ({ index: f.index, path: path.join(out, f.file), file: f.file })), fps: fps || info.fps, manifest };
}

/** Accepts a frames dir or a video file (video -> temp frames at native width; caller cleans up). */
async function resolveFrames(input) {
  if (!fs.existsSync(input)) throw new UserError(`Input not found: ${input}`);
  if (fs.statSync(input).isDirectory()) return { ...listFrames(input), temp: false };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clefcut-frames-'));
  const r = await extractFrames(input, { out: tmp });
  return { ...r, temp: true };
}

function cleanupTemp(resolved, o) {
  if (resolved && resolved.temp && !(o && o['keep-temp'])) fs.rmSync(resolved.dir, { recursive: true, force: true });
}

/** Pixel size of the resolved frames: manifest dimensions, else probe the first frame. */
async function frameDims(resolved) {
  const m = resolved.manifest;
  if (m && Number(m.width) > 0 && Number(m.height) > 0) return { width: Number(m.width), height: Number(m.height) };
  if (resolved.files && resolved.files.length) {
    try {
      const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', resolved.files[0].path]);
      const s = JSON.parse(r.stdout.toString()).streams[0];
      if (s && s.width) return { width: s.width, height: s.height };
    } catch { /* fall through */ }
  }
  return { width: null, height: null };
}

function toDataUri(p) {
  const buf = fs.readFileSync(p);
  if (buf.length > MAX_IMAGE_BYTES) throw new UserError(`${path.basename(p)} is over 4 MiB — re-export frames with a smaller --width.`);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/** Decode a list of PNGs to gray rawvideo via one image2pipe ffmpeg call. */
async function decodeGray(files, w, h) {
  const size = w * h;
  const input = Buffer.concat(files.map((f) => fs.readFileSync(f.path)));
  const sync = await syncFlagArgs();
  const r = await runFf('ffmpeg', ['-v', 'error', '-f', 'image2pipe', '-c:v', 'png', '-i', 'pipe:0', ...sync, '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], { input });
  const frames = [];
  for (let off = 0; off + size <= r.stdout.length; off += size) frames.push(r.stdout.subarray(off, off + size));
  if (frames.length !== files.length) throw new UserError(`Decoded ${frames.length} of ${files.length} frames (expected ${w}x${h}). If frame sizes differ, re-export with "video-qa.mjs frames".`);
  return frames;
}

// ---------------------------------------------------------------- Cloudflare API layer

const API_BASE = 'https://api.cloudflare.com/client/v4/accounts';

/** POST endpoint for a FULL model id (@cf/cloudflare/...) — the id goes in verbatim, exactly once. */
export function runUrl(accountId, modelFull) {
  return `${API_BASE}/${accountId}/ai/run/${modelFull}`;
}

let LAST_FETCH_AT = 0; // pacing: >= 300 ms between request starts

/**
 * POST /ai/run/<full model id>. Envelope {success,result,errors}. Retries 429 (except daily
 * quota 3036) and 5xx with backoff; retry-after honored, capped at 60 s. 413 -> e.code=413.
 */
async function postAi(modelFull, body, { gateway } = {}) {
  const c = cfg();
  if (!c.accountId || !c.token) throw new UserError('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required (process env, ./.env or ~/.clefcut/.env). Run "video-qa.mjs doctor".');
  const gw = gateway || c.gateway;
  const headers = { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' };
  if (gw) headers['cf-aig-gateway-id'] = gw; // routes the call through an AI Gateway
  const url = runUrl(c.accountId, modelFull);
  const payload = JSON.stringify(body);
  let delay = 1000;
  for (let attempt = 0; ; attempt++) {
    const gap = Date.now() - LAST_FETCH_AT;
    if (gap < PACE_MS) await sleep(PACE_MS - gap);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers, body: payload, signal: ac.signal });
    } catch (e) {
      LAST_FETCH_AT = Date.now();
      clearTimeout(timer);
      if (attempt >= RETRIES) throw new UserError(redact(`network error calling ${modelFull}: ${e.message}`));
      await sleep(delay); delay *= 2; continue;
    }
    LAST_FETCH_AT = Date.now();
    clearTimeout(timer);
    if (res.status === 413) { const e = new Error('request too large'); e.code = 413; throw e; }
    const raw = await res.text();
    let json = null; try { json = JSON.parse(raw); } catch { /* non-json body */ }
    const firstErr = json && Array.isArray(json.errors) && json.errors[0] ? json.errors[0] : null;
    const errCode = firstErr ? Number(firstErr.code) : NaN;
    if (res.status === 429 && errCode === 3036) {
      throw new UserError(redact(`${modelFull}: daily neuron quota exhausted — resets 00:00 UTC (HTTP 429, code 3036). Retrying cannot help; nothing was sent.`));
    }
    if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
      const ra = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : delay);
      delay *= 2; continue;
    }
    if (res.ok && json && json.success) return json.result;
    const msg = json && Array.isArray(json.errors) && json.errors.length ? JSON.stringify(json.errors) : raw.slice(0, 400);
    const again = res.status === 429 || res.status >= 500 ? ` still failing after ${RETRIES + 1} attempts` : '';
    throw new UserError(redact(`${modelFull}${again} (HTTP ${res.status}): ${msg}`));
  }
}

/** Run a body per image batch; on 413 recursively bisect the batch down to 1 image. */
async function runImageBatches(modelFull, makeBody, images, opts, onResult = null) {
  try {
    const result = await postAi(modelFull, makeBody(images), opts);
    if (onResult) onResult(images.length, result);
    return [{ images, result }];
  } catch (e) {
    if (e.code === 413 && images.length > 1) {
      const half = Math.ceil(images.length / 2);
      const a = await runImageBatches(modelFull, makeBody, images.slice(0, half), opts, onResult);
      const b = await runImageBatches(modelFull, makeBody, images.slice(half), opts, onResult);
      return [...a, ...b];
    }
    throw e;
  }
}

/**
 * One request per file batch (413 bisection inside keeps order). `emit(slice, result,
 * isolated)` fires once per actual request with the frame files that request covered.
 */
async function requestBatch(modelFull, makeBody, batch, { gateway, isolated = false } = {}, emit) {
  const images = batch.map((f) => toDataUri(f.path));
  let bi = 0;
  await runImageBatches(modelFull, makeBody, images, { gateway }, (count, result) => {
    const slice = batch.slice(bi, bi + count);
    bi += count;
    emit(slice, result, isolated);
  });
}

/** Parse + validate --max-images (>= 1, capped at the API limit); default per command. */
function imageBatchSize(o, dflt) {
  const raw = o['max-images'] != null ? o['max-images'] : dflt;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) throw new UserError(`--max-images must be >= 1. Got: ${raw}`);
  return Math.min(Math.floor(n), MAX_IMAGES);
}

const costEstimate = (model, usage) => (usage.input_tokens * (PRICES[model] ?? 0)) / 1e6;
const usageLine = (model, u) => `usage: ${u.input_tokens} input tokens, ${u.output_tokens} output tokens — cost estimate $${costEstimate(model, u).toFixed(6)} (estimate, ${model} at $${PRICES[model]}/Mtok input, output free)`;

/**
 * Pre-flight cost gate: print the request/cost estimate BEFORE anything is sent; runs over
 * GATE_MAX_FRAMES frames require --yes (or CLEFCUT_YES=1).
 */
function preflightGate(files, dims, { model, size, yes, extraRequests = 0 }) {
  const n = files.length;
  const per = estTokensPerFrame(dims.width, dims.height);
  const requests = Math.ceil(n / Math.max(1, size)) + extraRequests;
  const cost = (n * per * (PRICES[model] ?? 0)) / 1e6;
  console.log(`${n} frames → ~${requests} requests (batch ≤${size} images) ≈ $${cost.toFixed(4)} input-token estimate at ${model} price (~${per} tokens/frame at ${dims.width || '?'}px)`);
  if (extraRequests > 0) console.log(`controls: ${extraRequests} control frame(s) sent in their own request(s)`);
  if (n > GATE_MAX_FRAMES && !yes) {
    throw new UserError(`${n} frames is over the ${GATE_MAX_FRAMES}-frame comfort limit (estimate above). Pass --yes (or set CLEFCUT_YES=1) to proceed anyway.`);
  }
}

// ---------------------------------------------------------------- local checks (free)

export function computeFindings(frames, stats, t) {
  const out = [];
  const n = frames.length;
  const means = []; const stds = []; const diffs = [null];
  for (let i = 0; i < n; i++) {
    const ms = meanStd(stats.data[i]);
    means.push(ms.mean); stds.push(ms.std);
    if (i > 0) diffs.push(meanAbsDiff(stats.data[i], stats.data[i - 1]));
  }
  // time_s always from the manifest frame INDEX (ranges keep true wall time), never array position.
  const finding = (i, check, value, threshold) => out.push({ frame: frames[i].index, file: frames[i].file, time_s: +(frames[i].index / (stats.fps || 30)).toFixed(3), check, value: +value.toFixed(3), threshold, severity: SEVERITY[check] });
  for (let i = 0; i < n; i++) if (means[i] < t.blackMean && stds[i] < t.blackStd) finding(i, 'black', means[i], t.blackMean);
  let runStart = -1;
  for (let i = 1; i <= n; i++) {
    const low = i < n && diffs[i] < t.frozenDiff; // frame i is near-identical to frame i-1
    if (low && runStart < 0) runStart = i;
    if (!low && runStart >= 0) {
      if (i - runStart >= t.frozenRun) for (let j = runStart; j < i; j++) finding(j, 'frozen', diffs[j], t.frozenDiff);
      runStart = -1;
    }
    if (i < n) {
      const jump = Math.abs(means[i] - means[i - 1]);
      if (jump > t.flashJump) finding(i, 'flash', jump, t.flashJump);
    }
  }
  // ink — almost nothing drawn: pixels deviating > threshold from the frame's MEDIAN luma;
  // a featureless frame (flat fill, missing layer) has an ink_fraction below the floor.
  const inkThreshold = t.inkThreshold == null ? INK.threshold : t.inkThreshold;
  const inkMin = t.inkMin == null ? INK.minFraction : t.inkMin;
  for (let i = 0; i < n; i++) {
    const frac = inkFraction(stats.data[i], medianLuma(stats.data[i]), inkThreshold);
    if (frac < inkMin) finding(i, 'ink', frac, inkMin);
  }
  return out;
}

function loadDeclared(p) {
  let j;
  try { j = readJson(p); } catch { throw new UserError(`--declared file is not valid JSON: ${p}`); }
  const bad = (m) => new UserError(`declared.json invalid: ${m} Schema: {"cuts":[n,...], "holds":[[a,b],...], "blackouts":[[a,b],...], "effects":[[a,b],...]} (frame numbers, inclusive).`);
  const numArr = (v, name) => {
    if (v == null) return [];
    if (!Array.isArray(v) || v.some((x) => !Number.isInteger(x))) bad(`${name} must be an array of frame numbers`);
    return v;
  };
  const pairArr = (v, name) => {
    if (v == null) return [];
    if (!Array.isArray(v) || v.some((r) => !Array.isArray(r) || r.length !== 2 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || r[1] < r[0])) bad(`${name} must be an array of [start,end] frame pairs (inclusive)`);
    return v;
  };
  return { cuts: numArr(j.cuts, 'cuts'), holds: pairArr(j.holds, 'holds'), blackouts: pairArr(j.blackouts, 'blackouts'), effects: pairArr(j.effects, 'effects') };
}

/** Split findings into real findings and declared-intentional ones (with the declaring reason). */
export function applyDeclared(findings, declared) {
  if (!declared) return { findings, suppressed: [] };
  const cuts = Array.isArray(declared.cuts) ? declared.cuts : [];
  const inRange = (f, list) => (Array.isArray(list) ? list : []).some(([a, b]) => f >= a && f <= b);
  const nearCut = (f) => cuts.some((c) => Math.abs(f - c) <= 2);
  const keep = []; const suppressed = [];
  for (const f of findings) {
    let reason = null;
    if (f.check === 'flash') {
      if (nearCut(f.frame)) reason = 'flash within 2 frames of a declared cut';
      else if (inRange(f.frame, declared.effects)) reason = 'flash inside declared effects';
    } else if (f.check === 'frozen' && inRange(f.frame, declared.holds)) {
      reason = 'frozen inside a declared hold';
    } else if (f.check === 'black') {
      if (inRange(f.frame, declared.blackouts)) reason = 'black inside a declared blackout';
      else if (nearCut(f.frame)) reason = 'black within 2 frames of a declared cut';
    } else if (f.check === 'ink') {
      if (inRange(f.frame, declared.blackouts)) reason = 'ink inside a declared blackout';
      else if (inRange(f.frame, declared.holds)) reason = 'ink inside a declared hold';
    }
    if (reason) suppressed.push({ ...f, suppressed_reason: reason });
    else keep.push(f);
  }
  return { findings: keep, suppressed };
}

async function cmdCheck(dir, o) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new UserError(`Frames dir not found: ${dir}. Run "video-qa.mjs frames <video> --out <dir>" first.`);
  const declared = o.declared ? loadDeclared(o.declared) : null;
  const { files, fps, manifest } = listFrames(dir);
  if (!files.length) throw new UserError(`No PNG frames in ${dir}.`);
  const fpsAssumed = !fps;
  const fpsUsed = fps || 30;
  if (fpsAssumed) console.error(`warning: ${manifest ? 'manifest.json records no fps' : 'no manifest.json — fps unknown'}; assuming 30 fps for time_s`);
  const probe0 = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', files[0].path]);
  const s0 = JSON.parse(probe0.stdout.toString()).streams[0];
  const data = await decodeGray(files, s0.width, s0.height);
  const num = (k, d) => { const v = Number(o[k]); return o[k] != null && o[k] !== true && Number.isFinite(v) ? v : d; };
  // Frozen runs are time-based: >= max(3, round(1.5 × fps)) frames (~1.5 s); --frozen-run overrides (in frames).
  const t = {
    blackMean: num('black-mean', CHECKS.blackMean), blackStd: num('black-std', CHECKS.blackStd),
    frozenDiff: num('frozen-diff', CHECKS.frozenDiff), frozenRun: num('frozen-run', Math.max(3, Math.round(1.5 * fpsUsed))),
    flashJump: num('flash-jump', CHECKS.flashJump),
    inkThreshold: num('ink-threshold', INK.threshold), inkMin: INK.minFraction,
  };
  const { findings, suppressed } = applyDeclared(computeFindings(files, { data, fps: fpsUsed }, t), declared);
  const outPath = o.out || path.join(dir, 'findings.json');
  fs.writeFileSync(outPath, JSON.stringify({
    source: path.resolve(dir), checked: files.length, fps_used: fpsUsed, fps_assumed: fpsAssumed,
    thresholds: t, ...(declared ? { declared: o.declared } : {}), findings, suppressed,
  }, null, 2));
  const counts = {};
  for (const f of findings) counts[f.check] = (counts[f.check] || 0) + 1;
  console.log(`checked ${files.length} frames at ${s0.width}x${s0.height} (${fpsUsed} fps${fpsAssumed ? ', assumed' : ''})`);
  console.log(`black/blank: ${counts.black || 0} finding(s) | frozen: ${counts.frozen || 0} | flash/pop: ${counts.flash || 0} | ink (almost nothing drawn): ${counts.ink || 0}`);
  if (suppressed.length) console.log(`suppressed by --declared: ${suppressed.length} finding(s) (${[...new Set(suppressed.map((s) => s.check))].join(', ')}) — see "suppressed" in ${outPath}`);
  console.log(`${findings.length ? 'findings' : 'clean — findings'} written to ${outPath}`);
  return findings.length ? 1 : 0;
}

// ---------------------------------------------------------------- local OCR (free)

async function localOcrKind() {
  try { createRequire(path.join(process.cwd(), 'package.json')).resolve('tesseract.js'); return 'tesseract.js'; } catch { /* not installed */ }
  try { if ((await runExe('tesseract', ['--version'])).code === 0) return 'system-tesseract'; } catch { /* not on PATH */ }
  return null;
}

async function ocrFrames(kind, files) {
  const rows = [];
  // leptonica (used by both engines) rejects symlinked dirs like /tmp on macOS: pass real paths.
  const realPath = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
  if (kind === 'tesseract.js') {
    const T = createRequire(path.join(process.cwd(), 'package.json'))('tesseract.js');
    const worker = await T.createWorker('eng');
    try {
      for (const f of files) {
        const { data } = await worker.recognize(realPath(f.path));
        rows.push({ frame: f.index, file: f.file, engine: 'tesseract.js', text: (data.text || '').trim(), confidence: typeof data.confidence === 'number' ? data.confidence : null });
      }
    } finally { await worker.terminate(); }
    return rows;
  }
  for (const f of files) {
    const r = await runExe('tesseract', [realPath(f.path), 'stdout', '--psm', '6', 'tsv']);
    if (r.code !== 0) throw new UserError(`tesseract failed on ${f.file}: ${r.stderr.trim().slice(0, 200)}`);
    const cols = r.stdout.toString().split('\n').map((l) => l.split('\t'));
    const words = cols.filter((c) => c.length >= 12 && c[0] === '5' && c[11] && c[11].trim()); // tsv level 5 = word
    const confs = words.map((c) => Number(c[10])).filter((x) => Number.isFinite(x) && x >= 0);
    rows.push({ frame: f.index, file: f.file, engine: 'system-tesseract', text: words.map((c) => c[11].trim()).join(' '), confidence: confs.length ? +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(1) : null });
  }
  return rows;
}

// ---------------------------------------------------------------- commands

async function cmdText(input, o) {
  const want = o.engine || 'auto';
  let engine = want;
  if (want === 'local' || want === 'auto') {
    const kind = await localOcrKind();
    if (kind) engine = kind;
    else if (want === 'local') throw new UserError('No local OCR available. Install one: npm i -D tesseract.js (downloads English traineddata on first run) or install system tesseract. Or use --engine clairic.');
    else engine = 'clairic';
  }
  if (engine !== 'clairic') {
    const resolved = await resolveFrames(input);
    let result;
    try {
      const { files } = resolved;
      if (!files.length) throw new UserError('No frames found.');
      result = { engine, complete: true, frames: await ocrFrames(engine, files), usage: null };
      console.log(`engine: ${engine} (local, free)`);
    } finally { cleanupTemp(resolved, o); }
    const outPath = o.out || 'text.json';
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`wrote ${outPath} (${result.frames.length} frame record(s))`);
    return 0;
  }
  // clairic: credentials FIRST (before any frame extraction), then gate, then paced requests.
  requireCreds();
  const size = imageBatchSize(o, 1); // per-frame answers are the truth CLAIRIC gives: 1 frame/request by default
  const resolved = await resolveFrames(input);
  try {
    const { files } = resolved;
    if (!files.length) throw new UserError('No frames found.');
    const fields = o.fields ? readJson(o.fields) : DEFAULT_TEXT_FIELDS;
    const dims = await frameDims(resolved);
    preflightGate(files, dims, { model: 'clairic', size, yes: yesFlag(o) });
    const outPath = o.out || 'text.json';
    const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
    const requestRows = []; const frames = [];
    const write = (complete, error = null) => fs.writeFileSync(outPath, JSON.stringify({
      engine: 'clairic', gateway: o.gateway || cfg().gateway || null, generated_at: new Date().toISOString(), complete,
      requests: requestRows, frames, usage, cost_estimate_usd: +((usage.input_tokens * PRICES.clairic) / 1e6).toFixed(6),
      ...(error ? { error } : {}),
    }, null, 2));
    try {
      for (const batch of buildBatches(files, { size })) {
        await requestBatch('@cf/cloudflare/clairic', (images) => ({ model: 'clairic', state: QA_STATE, fields, images }), batch, { gateway: o.gateway }, (slice, result) => {
          const u = (result && result.usage) || {};
          usage.input_tokens += u.input_tokens || 0; usage.output_tokens += u.output_tokens || 0; usage.requests += 1;
          requestRows.push({ frames: slice.map((f) => f.index), usage: u });
          const first = Object.values(result.answers || {})[0] || {};
          frames.push({ frame: slice[0].index, frames: slice.map((f) => f.index), engine: 'clairic', fields: result.answers || {}, text: first.value ?? null, confidence: first.confidence ?? null });
        });
        write(false);
      }
    } catch (e) { write(false, redact(e.message)); throw e; }
    write(true);
    console.log(`engine: clairic (${usage.requests} request(s))`);
    console.log(usageLine('clairic', usage));
    if (Object.keys(fields).length > 1) console.log('note: with multiple fields, text/confidence reflect the FIRST field');
    console.log(`wrote ${outPath} (${frames.length} frame record(s))`);
    return 0;
  } finally { cleanupTemp(resolved, o); }
}

export function validateQuestions(spec) {
  const bad = (m) => new UserError(`questions.json invalid: ${m} Schema: {"questions": {"<id>": {"type": "noul"|"choice"|"score", "instructions": "...", "criteria": ...}}, "pass": {"<id>": number in (0,1]}, "escalate_margin": 0.3, "severity": {...}, "escalate_only": [...]}`);
  if (!spec || typeof spec !== 'object' || !spec.questions || !Object.keys(spec.questions).length) throw bad('needs a non-empty "questions" object.');
  for (const [id, q] of Object.entries(spec.questions)) {
    if (!['noul', 'choice', 'score'].includes(q.type)) throw bad(`question "${id}": type must be noul, choice or score.`);
    if (!q.instructions) throw bad(`question "${id}": instructions is required.`);
    if (q.type === 'choice' && (typeof q.criteria !== 'object' || Array.isArray(q.criteria) || !q.criteria)) throw bad(`question "${id}": choice needs criteria as an OBJECT of option -> description.`);
    if (q.type === 'score' && (!Array.isArray(q.criteria) || q.criteria.length < 2)) throw bad(`question "${id}": score needs criteria as an ordered ARRAY (worst last), 2-10 levels.`);
  }
  const pass = spec.pass && typeof spec.pass === 'object' ? spec.pass : {};
  const esc = new Set(Array.isArray(spec.escalate_only) ? spec.escalate_only : []);
  const missing = Object.keys(spec.questions).filter((id) => {
    const t = pass[id];
    return !(esc.has(id) || (typeof t === 'number' && Number.isFinite(t) && t > 0 && t <= 1));
  });
  if (missing.length) throw new UserError(`questions.json invalid: every question id needs a numeric "pass" in (0,1] or a spot in "escalate_only" — missing for: ${missing.join(', ')}.`);
}

/** Defect probability (higher = worse). noul: p(yes). score: level/(levels-1). choice: p of "defect_options". */
export function defectProb(q, a) {
  if (!a) return null;
  if (q.type === 'noul') return typeof a.noul === 'number' ? a.noul : null;
  if (q.type === 'score') { const n = q.criteria.length - 1; return typeof a.score === 'number' && n > 0 ? a.score / n : null; }
  if (q.type === 'choice') {
    if (!Array.isArray(q.defect_options) || !q.defect_options.length) return a.choice == null ? null : 0;
    const probs = a.probabilities || {};
    return Math.max(...q.defect_options.map((k) => (typeof probs[k] === 'number' ? probs[k] : 0)), 0);
  }
  return null;
}

function loadControls(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new UserError(`--controls dir not found: ${dir}`);
  let trips = {};
  let hasJson = false;
  const jp = path.join(dir, 'controls.json');
  if (fs.existsSync(jp)) {
    hasJson = true;
    try { for (const e of readJson(jp)) trips[e.file] = e.trips || []; } catch { throw new UserError(`controls.json in ${dir} is not valid JSON.`); }
  }
  const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort()
    .map((f) => ({ index: `ctrl:${f}`, path: path.join(dir, f), file: f, control: true, trips: trips[f] || null }));
  if (!files.length) throw new UserError(`No control PNGs in ${dir}. Run "video-qa.mjs synthesize".`);
  return { files, hasJson };
}

/** How many controls have at least one trips id that maps to a real question id. */
export function controlsCoverage(controls, questionIds) {
  const q = new Set(questionIds);
  const mapped = controls.filter((c) => (c.trips || []).some((t) => q.has(t)));
  return { total: controls.length, mappedCount: mapped.length, anyMapped: mapped.length > 0 };
}

async function cmdAsk(input, o) {
  if (!o.questions) throw new UserError('--questions questions.json is required. See --help for the schema.');
  const spec = readJson(o.questions);
  validateQuestions(spec);
  const pass = spec.pass || {};
  const margin = typeof spec.escalate_margin === 'number' ? spec.escalate_margin : 0.3;
  const severity = spec.severity || {};
  const escalateOnly = new Set(spec.escalate_only || []);
  const model = o.model || 'clef';
  if (!['clef', 'clef-flash', 'clef-omni'].includes(model)) throw new UserError('--model must be clef, clef-flash or clef-omni.');
  const size = imageBatchSize(o, MAX_IMAGES);
  requireCreds(); // credentials BEFORE any frame extraction
  const resolved = await resolveFrames(input);
  try {
    const { files } = resolved;
    if (!files.length) throw new UserError('No frames found.');
    const dims = await frameDims(resolved);
    const qids = Object.keys(spec.questions);
    const ctl = o.controls ? loadControls(o.controls) : null;
    let controlsNote = '';
    const baseReasons = [];
    if (ctl) {
      const cov = controlsCoverage(ctl.files, qids);
      if (!ctl.hasJson) controlsNote = 'controls: no controls.json — controls are not validated';
      else if (!cov.anyMapped) {
        controlsNote = `WARNING: 0 of ${cov.total} controls map to any question id — controls validated nothing`;
        baseReasons.push(controlsNote);
      }
    }
    if (controlsNote) console.log(controlsNote);
    preflightGate(files, dims, { model, size, yes: yesFlag(o), extraRequests: ctl ? ctl.files.length : 0 });

    const modelFull = `@cf/cloudflare/${model}`;
    const makeBody = (images) => ({ model, state: QA_STATE, questions: spec.questions, images });
    const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
    const requestRows = [];
    const parts = []; // {files, result, isolated, isControl, needIsolate, superseded}
    const outPath = o.out || 'answers.json';
    const assemble = (complete, error = null) => {
      const answers = [];
      for (const p of parts) {
        if (p.superseded || p.isControl) continue;
        for (const [qid, q] of Object.entries(spec.questions)) {
          const raw = (p.result.answers || {})[qid] || null;
          const prob = defectProb(q, raw);
          const cls = classifyAnswer(q, raw, pass[qid], margin, escalateOnly.has(qid));
          answers.push({ frame: p.files[0].index, frames: p.files.map((f) => f.index), frames_in_request: p.files.length, isolated: !!p.isolated, question: qid, type: q.type, raw, probability: prob, classification: cls, severity: severity[qid] || null });
        }
      }
      const reasons = [...baseReasons];
      const controlRows = [];
      for (const p of parts) {
        if (!p.isControl || p.superseded) continue;
        const ctrl = p.files[0];
        for (const qid of (ctrl.trips || []).filter((t) => qids.includes(t))) {
          const q = spec.questions[qid];
          const raw = (p.result.answers || {})[qid] || null;
          const prob = defectProb(q, raw);
          const cls = classifyAnswer(q, raw, pass[qid], margin, escalateOnly.has(qid));
          controlRows.push({ control: ctrl.file, question: qid, trips_expected: true, probability: prob, classification: cls });
          // Controls are known-bad: one that should trip a question but did not marks the run unreliable.
          if (pass[qid] != null && (prob == null || prob < pass[qid])) reasons.push(`control ${ctrl.file} did not trip "${qid}" (p=${prob} < ${pass[qid]})`);
        }
      }
      const unreliable = reasons.length > 0;
      return {
        model, gateway: o.gateway || cfg().gateway || null, generated_at: new Date().toISOString(), complete,
        requests: requestRows, answers, controls: controlRows, unreliable, unreliable_reasons: reasons, usage,
        cost_estimate_usd: +((usage.input_tokens * (PRICES[model] ?? 0)) / 1e6).toFixed(6),
        ...(error ? { error } : {}),
      };
    };
    const write = (complete, error = null) => fs.writeFileSync(outPath, JSON.stringify(assemble(complete, error), null, 2));
    const emit = (slice, result, isolated) => {
      const u = (result && result.usage) || {};
      usage.input_tokens += u.input_tokens || 0; usage.output_tokens += u.output_tokens || 0; usage.requests += 1;
      requestRows.push({ frames: slice.filter((f) => !f.control).map((f) => f.index), controls: slice.filter((f) => f.control).map((f) => f.file), isolated: !!isolated, usage: u });
      let worst = 'pass';
      for (const [qid, q] of Object.entries(spec.questions)) {
        const cls = classifyAnswer(q, (result.answers || {})[qid] || null, pass[qid], margin, escalateOnly.has(qid));
        if (cls === 'fail') { worst = 'fail'; break; }
        if (cls === 'escalate') worst = 'escalate';
      }
      parts.push({ files: slice, result, isolated: !!isolated, isControl: slice.length > 0 && slice.every((f) => f.control), needIsolate: worst !== 'pass', superseded: false });
      write(false); // incremental: answers.json is rewritten after every request
    };
    try {
      if (ctl) {
        // Controls travel in their OWN request(s), one control per request, never mixed with real frames.
        for (const batch of buildBatches(ctl.files, { size: 1 })) {
          await requestBatch(modelFull, makeBody, batch, { gateway: o.gateway }, emit);
        }
      }
      for (const batch of buildBatches(files, { size })) {
        const start = parts.length;
        await requestBatch(modelFull, makeBody, batch, { gateway: o.gateway }, emit);
        const batchParts = parts.slice(start);
        // Auto-isolation: a multi-frame batch with any fail/escalate is re-asked one frame
        // per request; per-frame rows replace the batch rows (usage of both passes recorded).
        if (batch.length > 1 && batchParts.some((p) => p.needIsolate)) {
          for (const p of batchParts) p.superseded = true;
          for (const f of batch) await requestBatch(modelFull, makeBody, [f], { gateway: o.gateway, isolated: true }, emit);
        }
      }
    } catch (e) {
      write(false, redact(e.message)); // fatal mid-run: partial answers.json is on disk, then exit 2
      throw e;
    }
    const final = assemble(true);
    fs.writeFileSync(outPath, JSON.stringify(final, null, 2));
    const tally = {};
    for (const a of final.answers) (tally[a.question] = tally[a.question] || { fail: 0, escalate: 0, pass: 0 })[a.classification]++;
    console.log(`model: ${model} — ${usage.requests} request(s), ${final.answers.length} answer row(s)`);
    for (const [qid, t] of Object.entries(tally)) console.log(`  ${qid}: fail=${t.fail} escalate=${t.escalate} pass=${t.pass}`);
    const isolatedRows = final.answers.filter((a) => a.isolated).length;
    if (isolatedRows) console.log(`auto-isolation: ${requestRows.filter((r) => r.isolated).length} frame(s) re-asked one image per request (${isolatedRows} per-frame answer rows)`);
    if (final.controls.length) console.log(`control row(s): ${final.controls.length} (control answers are excluded from the tally)`);
    if (final.unreliable) console.log(`unreliable: YES — ${final.unreliable_reasons.join('; ')}`);
    console.log(usageLine(model, usage));
    console.log(`answers written to ${outPath}`);
    return final.answers.some((a) => a.classification !== 'pass') || final.unreliable ? 1 : 0;
  } finally { cleanupTemp(resolved, o); }
}

async function cmdExtract(input, o) {
  if (!o.fields) throw new UserError('--fields fields.json is required: {"<id>": {"type": "text", "instructions": "...", ...}}');
  const fields = readJson(o.fields);
  if (!fields || typeof fields !== 'object' || !Object.keys(fields).length) throw new UserError('fields.json must be a non-empty object of field specs.');
  for (const [id, f] of Object.entries(fields)) if (!f || typeof f !== 'object' || !f.type) throw new UserError(`field "${id}": needs at least {"type": "text"|"number"|...}.`);
  const size = imageBatchSize(o, 1); // per-frame answers are the truth CLAIRIC gives: 1 frame/request by default
  requireCreds(); // credentials BEFORE any frame extraction
  const resolved = await resolveFrames(input);
  try {
    const { files } = resolved;
    if (!files.length) throw new UserError('No frames found.');
    const dims = await frameDims(resolved);
    preflightGate(files, dims, { model: 'clairic', size, yes: yesFlag(o) });
    const outPath = o.out || 'extract.json';
    const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
    const requestRows = []; const rows = [];
    const write = (complete, error = null) => fs.writeFileSync(outPath, JSON.stringify({
      model: 'clairic', gateway: o.gateway || cfg().gateway || null, generated_at: new Date().toISOString(), complete,
      requests: requestRows, frames: rows, usage, cost_estimate_usd: +((usage.input_tokens * PRICES.clairic) / 1e6).toFixed(6),
      ...(error ? { error } : {}),
    }, null, 2));
    try {
      for (const batch of buildBatches(files, { size })) {
        await requestBatch('@cf/cloudflare/clairic', (images) => ({ model: 'clairic', state: QA_STATE, fields, images }), batch, { gateway: o.gateway }, (slice, result) => {
          const u = (result && result.usage) || {};
          usage.input_tokens += u.input_tokens || 0; usage.output_tokens += u.output_tokens || 0; usage.requests += 1;
          requestRows.push({ frames: slice.map((f) => f.index), usage: u });
          const clean = {};
          for (const [k, v] of Object.entries(result.answers || {})) clean[k] = { type: v.type, value: v.value ?? null, p_null: v.p_null ?? null, confidence: v.confidence ?? null };
          rows.push({ frame: slice[0].index, frames: slice.map((f) => f.index), fields: clean, truncated: result.truncated || false });
        });
        write(false);
      }
    } catch (e) { write(false, redact(e.message)); throw e; }
    write(true);
    console.log(`model: clairic — ${usage.requests} request(s), ${rows.length} extraction row(s)`);
    console.log(usageLine('clairic', usage));
    console.log(`wrote ${outPath}`);
    return 0;
  } finally { cleanupTemp(resolved, o); }
}

async function cmdSynthesize(dir, o) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new UserError(`Frames dir not found: ${dir}.`);
  const { files } = listFrames(dir);
  if (!files.length) throw new UserError(`No PNG frames in ${dir}.`);
  if (!o.out) throw new UserError('--out controlsDir is required.');
  const mid = files[Math.floor((files.length - 1) / 2)];
  const st = JSON.parse((await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', mid.path])).stdout.toString()).streams[0];
  if (!st || !st.width) throw new UserError(`Could not probe ${mid.file}.`);
  if (st.width <= 96) throw new UserError(`Frames must be wider than 96px for the shift control (got ${st.width}).`);
  // Ghost control = the most-different consecutive pair (decode gray like `check` does).
  let pair = [files[0], files[Math.min(1, files.length - 1)]];
  try {
    const gray = await decodeGray(files, st.width, st.height);
    let bestD = -1; let bestI = 1;
    for (let i = 1; i < files.length; i++) {
      const d = meanAbsDiff(gray[i], gray[i - 1]);
      if (d > bestD) { bestD = d; bestI = i; }
    }
    pair = [files[bestI - 1], files[bestI]];
  } catch { /* keep the fallback pair */ }
  fs.mkdirSync(o.out, { recursive: true });
  const run1 = async (name, args) => {
    const r = await runFf('ffmpeg', args);
    if (r.code !== 0) throw new UserError(`control synthesis failed (${name}): ${r.stderr.trim().slice(0, 300)}`);
  };
  const controls = [];
  const black = `control_black_${mid.index}.png`;
  await run1('black', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=black:s=${st.width}x${st.height}`, '-frames:v', '1', path.join(o.out, black)]);
  controls.push({ file: black, defect: 'fully black / blank frame', trips: ['dead_frame'], source_frame: mid.index });
  if (files.length >= 2) {
    const ghost = `control_ghost_${pair[0].index}.png`;
    await run1('ghost', ['-v', 'error', '-y', '-i', pair[0].path, '-i', pair[1].path, '-filter_complex', 'blend=all_mode=average', '-frames:v', '1', path.join(o.out, ghost)]);
    controls.push({ file: ghost, defect: `ghost / double exposure (frames ${pair[0].index}+${pair[1].index}, the most-different consecutive pair, blended 50/50)`, trips: ['overlap'], source_frame: pair[0].index });
  }
  const shift = `control_shift_${mid.index}.png`;
  await run1('shift', ['-v', 'error', '-y', '-i', mid.path, '-vf', 'crop=iw-96:ih:96:0', '-frames:v', '1', path.join(o.out, shift)]);
  controls.push({ file: shift, defect: 'content cut 96px off the left edge (text misalignment / hard crop)', trips: ['text_integrity'], source_frame: mid.index });
  fs.writeFileSync(path.join(o.out, 'controls.json'), JSON.stringify(controls.map((c) => ({ ...c, size: `${st.width}x${st.height}` })), null, 2));
  for (const c of controls) console.log(`wrote ${path.join(o.out, c.file)} (${c.defect}; trips: ${c.trips.join(', ')})`);
  console.log(`wrote ${path.join(o.out, 'controls.json')} — controls are known-bad; use with "ask --controls ${o.out}"`);
  return 0;
}

// ---------------------------------------------------------------- compare (before/after proof)

/** probe an image's pixel size (throws a clean error for non-images). */
async function imgDims(p) {
  const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', p]);
  if (r.code !== 0) throw new UserError(`Not a readable image: ${p}`);
  const st = JSON.parse(r.stdout.toString()).streams[0];
  if (!st || !st.width) throw new UserError(`No image stream in ${p}.`);
  return { w: st.width, h: st.height };
}

/** PNGs named frame_%06d.png in a dir, keyed by frame number. */
function frameNumMap(dir) {
  const m = new Map();
  for (const f of fs.readdirSync(dir)) {
    const mm = /^frame_(\d{6})\.png$/.exec(f);
    if (mm) m.set(Number(mm[1]), path.join(dir, f));
  }
  return m;
}

/**
 * Side-by-side proof image. Two PNGs -> one same-height hstack (the taller input is scaled
 * down to the shorter height; no text is burned in — the JSON index carries the mapping).
 * Two frame DIRS -> ONE combined contact sheet of matching frame numbers (each pair an
 * hstack, pairs vstacked; <= 64 pairs, evenly sampled when there are more) + the JSON index.
 */
async function cmdCompare(args, o) {
  const bad = compareArgError(args);
  if (bad) throw new UserError(bad);
  const [a, b] = args.map((p) => path.resolve(p));
  for (const p of [a, b]) if (!fs.existsSync(p)) throw new UserError(`Input not found: ${p}`);
  const aDir = fs.statSync(a).isDirectory();
  const bDir = fs.statSync(b).isDirectory();
  if (aDir !== bDir) throw new UserError('compare needs two PNG files or two frame dirs — got one of each.');
  const out = o.out || 'compare.png';
  const jsonOut = /\.[^./]+$/.test(out) ? out.replace(/\.[^./]+$/, '') + '.json' : `${out}.json`;
  const index = { generated_at: new Date().toISOString(), out, ...(aDir ? { type: 'dirs' } : { type: 'files' }) };

  if (!aDir) {
    const dA = await imgDims(a);
    const dB = await imgDims(b);
    const H = Math.min(dA.h, dB.h); // scale the taller reference down to the shorter height
    let fc;
    if (dA.h === dB.h) fc = '[0:v][1:v]hstack=inputs=2[out]';
    else if (dA.h > dB.h) fc = `[0:v]scale=-2:${H}[a];[a][1:v]hstack=inputs=2[out]`;
    else fc = `[1:v]scale=-2:${H}[b];[0:v][b]hstack=inputs=2[out]`;
    const r = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', a, '-i', b, '-filter_complex', fc, '-map', '[out]', '-frames:v', '1', '-update', '1', out]);
    if (r.code !== 0) throw new UserError(`compare failed: ${r.stderr.trim().slice(0, 300)}`);
    const done = await imgDims(out);
    fs.writeFileSync(jsonOut, JSON.stringify({ ...index, left: a, right: b, width: done.w, height: done.h }, null, 2));
    console.log(`wrote ${out} (${done.w}x${done.h}; left is ${path.basename(a)}, right is ${path.basename(b)}) + index ${jsonOut}`);
    return 0;
  }

  const mapA = frameNumMap(a);
  const mapB = frameNumMap(b);
  const shared = [...mapA.keys()].filter((k) => mapB.has(k)).sort((x, y) => x - y);
  if (!shared.length) throw new UserError(`No matching frame numbers between ${a} and ${b} (frames must be named frame_%06d.png).`);
  let included = shared;
  if (shared.length > 64) {
    const step = Math.ceil(shared.length / 64); // same sampling convention as the contact sheet
    included = shared.filter((_, i) => i % step === 0);
  }
  const dA = await imgDims(mapA.get(shared[0]));
  const dB = await imgDims(mapB.get(shared[0]));
  const H = Math.min(dA.h, dB.h);
  const evenW = (w, h) => 2 * Math.max(1, Math.round((w * H / h) / 2));
  const wA = dA.h === H ? dA.w : evenW(dA.w, dA.h);
  const wB = dB.h === H ? dB.w : evenW(dB.w, dB.h);
  const Wmax = wA + wB + 8 - ((wA + wB + 8) % 2); // pad target: absorbs scale rounding between differently-sized dirs
  const chains = included.map((_, i) => {
    const l = `[${2 * i}:v]${dA.h === H ? '' : `scale=-2:${H},`}null[l${i}]`;
    const r = `[${2 * i + 1}:v]${dB.h === H ? '' : `scale=-2:${H},`}null[r${i}]`;
    const pair = `[l${i}][r${i}]hstack=inputs=2,pad=${Wmax}:${H}:0:0:color=black[p${i}]`;
    return `${l};${r};${pair}`;
  });
  const stack = included.length > 1
    ? `${chains.join(';')};${included.map((_, i) => `[p${i}]`).join('')}vstack=inputs=${included.length}[out]`
    : `${chains[0]};[p0]null[out]`;
  const inputs = included.flatMap((n) => ['-i', mapA.get(n), '-i', mapB.get(n)]);
  const r = await runFf('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', stack, '-map', '[out]', '-frames:v', '1', '-update', '1', out]);
  if (r.code !== 0) throw new UserError(`compare failed: ${r.stderr.trim().slice(0, 300)}`);
  const inSet = new Set(included);
  fs.writeFileSync(jsonOut, JSON.stringify({
    ...index, left_dir: a, right_dir: b, height: H, sheet_pairs: included.length,
    sampled: included.length < shared.length ? `${included.length} of ${shared.length} pairs (evenly sampled) in the sheet; ALL pairs listed below` : false,
    pairs: shared.map((n) => ({ frame: n, left: mapA.get(n), right: mapB.get(n), in_sheet: inSet.has(n) })),
  }, null, 2));
  console.log(`compared ${shared.length} matching frame(s): wrote ${out} (${included.length} side-by-side pair(s)) + index ${jsonOut}`);
  if (included.length < shared.length) console.log(`note: the sheet holds ${included.length} of ${shared.length} pairs (evenly sampled); the index lists every pair`);
  return 0;
}

async function cmdDoctor(o) {
  const problems = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  console.log(`node               : ${process.version} ${nodeMajor >= 18 ? 'ok' : 'TOO OLD (need 18+)'}`);
  if (nodeMajor < 18) problems.push('Node older than 18');
  const c = cfg();
  console.log(`CLOUDFLARE_ACCOUNT_ID : ${c.accountId ? `set (from ${envSource('CLOUDFLARE_ACCOUNT_ID')})` : 'missing'}`);
  console.log(`CLOUDFLARE_API_TOKEN  : ${c.token ? `set (from ${envSource('CLOUDFLARE_API_TOKEN')})` : 'missing'}`);
  if (!c.accountId) problems.push('CLOUDFLARE_ACCOUNT_ID missing (needed for ask/extract/text --engine clairic and doctor --ping)');
  if (!c.token) problems.push('CLOUDFLARE_API_TOKEN missing (needed for ask/extract/text --engine clairic and doctor --ping)');
  console.log(`ai gateway          : ${c.gateway ? `configured (${c.gateway})` : 'not configured (direct Workers AI)'}`);
  try {
    const t = await locate();
    if (t.version) console.log(`ffmpeg              : ${t.ffmpeg} (source: ${t.source}) — ${t.version}`);
    else { console.log(`ffmpeg              : FAILED to run (${t.ffmpeg})`); problems.push('no working ffmpeg (compositor packages and PATH all failed — run with CLEFCUT_FFMPEG set)'); }
  } catch (e) { console.log('ffmpeg              : NOT FOUND'); problems.push(`no ffmpeg: ${e.message}`); }
  const kind = await localOcrKind();
  console.log(`ocr tesseract.js    : ${kind === 'tesseract.js' ? 'yes (resolved from project node_modules; downloads English traineddata on first run)' : 'no'}`);
  console.log(`ocr system tesseract: ${kind === 'system-tesseract' ? 'yes (on PATH)' : 'no'}`);
  if (o.ping) {
    if (!c.accountId || !c.token) { console.log('ping                : skipped (credentials missing)'); problems.push('cannot ping without credentials'); }
    else {
      const t0 = Date.now();
      try {
        const r = await postAi('@cf/cloudflare/clef-flash', { model: 'clef-flash', state: 'Connectivity check.', questions: { ok: { type: 'noul', instructions: 'Is 2+2 equal to 4?' } } }, {});
        console.log(`ping                : ok in ${Date.now() - t0}ms — p(yes)=${r && r.answers && r.answers.ok ? r.answers.ok.noul : '?'} tokens in=${r && r.usage ? r.usage.input_tokens : '?'} out=${r && r.usage ? r.usage.output_tokens : '?'}`);
      } catch (e) { console.log(`ping                : FAILED — ${e.message}`); problems.push(`ping failed: ${e.message}`); }
    }
  }
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall checks ok');
  return problems.length ? 1 : 0;
}

async function cmdFrames(video, o) {
  if (!fs.existsSync(video)) throw new UserError(`Video not found: ${video}`);
  const out = o.out || 'frames';
  const range = o.frames ? splitRange(o.frames) : null;
  if (o.frames && !range) throw new UserError(`--frames must look like A-B or A (0-based). Got: ${o.frames}`);
  const fps = o.fps ? Number(o.fps) : null;
  if (o.fps && (!Number.isFinite(fps) || fps <= 0)) throw new UserError(`--fps must be a positive number. Got: ${o.fps}`);
  let width = null;
  if (o.width != null) {
    width = Number(o.width);
    if (!Number.isFinite(width) || width < 16) throw new UserError('--width must be a number >= 16 (or omit it for native video width).');
  }
  let testWidth = null;
  if (o['test-width'] != null) {
    testWidth = o['test-width'] === true ? 350 : Number(o['test-width']);
    if (!Number.isFinite(testWidth) || testWidth < 16) throw new UserError('--test-width must be a number >= 16 (default 350).');
  }
  let safe = null;
  if (o.safe != null) {
    safe = String(o.safe);
    if (!SAFE_ZONES[safe]) throw new UserError(`--safe must be one of: ${Object.keys(SAFE_ZONES).join(', ')}. Got: ${o.safe}`);
    if (testWidth == null) throw new UserError('--safe requires --test-width: safe-zone frames are shaded copies of the TEST-width frames (the red boxes scale with the frame). Re-run with --test-width --safe <platform>.');
  }
  const r = await extractFrames(video, { fps, width, out, range, testWidth, safe, diff: o.diff === true, sheet: o.sheet === true });
  console.log(`exported ${r.files.length} frame(s) to ${out} (frame_start=${range ? range.a : 0}, width=${width != null ? width : 'native'}, fps=${fps || `source ${r.fps}`}, artifacts: ${r.manifest.artifacts.join('+')}) — wrote ${path.join(out, 'manifest.json')}`);
  return 0;
}

// ---------------------------------------------------------------- selftest

async function cmdSelftest() {
  const fails = [];
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  };
  const tmp = path.join(os.tmpdir(), `clefcut-selftest-${Date.now()}.env`);
  fs.writeFileSync(tmp, '# comment\nFOO=bar\nQUOTED="hello world"\nSQ=\'single\'\nexport EXPORTED=yes\n; semi\nNUM=42\nHASH=a # trailing\n');
  const parsed = parseEnvText(fs.readFileSync(tmp, 'utf8'));
  fs.unlinkSync(tmp);
  eq('env parser basic', parsed.FOO, 'bar');
  eq('env parser quotes', parsed.QUOTED, 'hello world');
  eq('env parser single quotes', parsed.SQ, 'single');
  eq('env parser export', parsed.EXPORTED, 'yes');
  eq('env parser number stays string', parsed.NUM, '42');
  eq('env parser inline comment', parsed.HASH, 'a');
  // .env precedence: home first, project overrides, process env wins over both.
  const layered = mergeEnvLayered({ PROC: 'yes' }, [
    { text: 'ONLY_HOME=home\nSHARED=home', label: 'home.env' },
    { text: 'SHARED=proj', label: 'proj.env' },
  ]);
  eq('env precedence project wins over home', layered.env.SHARED, 'proj');
  eq('env precedence home still applies', layered.env.ONLY_HOME, 'home');
  eq('env precedence process env wins', layered.env.PROC, 'yes');
  eq('env precedence source label', layered.sources.SHARED, 'proj.env');
  eq('chunk 17 by 4', chunkAll(Array.from({ length: 17 }, (_, i) => i), 4).map((c) => c.length), [4, 4, 4, 4, 1]);
  eq('chunk 0', chunkAll([], 4), []);
  eq('classify 0.9 vs 0.5 fail', classify(0.9, 0.5, 0.3, false), 'fail');
  eq('classify 0.4 in margin escalate', classify(0.4, 0.5, 0.3, false), 'escalate');
  eq('classify 0.1 pass', classify(0.1, 0.5, 0.3, false), 'pass');
  eq('classify null escalate', classify(null, 0.5, 0.3, false), 'escalate');
  eq('classify escalate_only', classify(0.99, 0.5, 0.3, true), 'escalate');
  eq('classify no threshold pass', classify(0.99, null, 0.3, false), 'pass');
  eq('range A-B', splitRange('5-10'), { a: 5, b: 10 });
  eq('range A', splitRange('7'), { a: 7, b: 7 });
  eq('range bad', splitRange('x'), null);
  const realToken = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_API_TOKEN = 'tok_selftest_secret123';
  ENV_CACHE = null;
  eq('redact token', redact('Authorization failed for tok_selftest_secret123').includes('tok_selftest_secret123'), false);
  process.env.CLOUDFLARE_API_TOKEN = realToken;
  ENV_CACHE = null;
  eq('defectProb noul', defectProb({ type: 'noul' }, { noul: 0.7 }), 0.7);
  eq('defectProb score', defectProb({ type: 'score', criteria: ['a', 'b', 'c', 'd'] }, { score: 3 }), 1);
  eq('defectProb choice', defectProb({ type: 'choice', defect_options: ['bad'] }, { choice: 'bad', probabilities: { bad: 0.8 } }), 0.8);
  eq('defectProb missing', defectProb({ type: 'noul' }, null), null);
  // choice confidence floor: escalate below 0.5, NEVER against the pass threshold.
  eq('choice confidence floor escalates', classifyAnswer({ type: 'choice', defect_options: ['bad'] }, { choice: 'ok', probabilities: { ok: 0.95, bad: 0.05 }, confidence: 0.3 }, 0.5, 0.3, false), 'escalate');
  eq('choice confidence never uses pass threshold', classifyAnswer({ type: 'choice', defect_options: ['bad'] }, { choice: 'ok', probabilities: { ok: 0.9, bad: 0.1 }, confidence: 0.85 }, 0.9, 0.3, false), 'pass');
  // batch builder: <= size files AND <= 6 MiB cumulative raw bytes per batch.
  const MiB = 1024 * 1024;
  eq('batch builder byte cap splits', buildBatches([{ path: 'a', b: 4 * MiB }, { path: 'b', b: 3 * MiB }, { path: 'c', b: 100 }], { size: 4, sizeOf: (f) => f.b }).map((x) => x.length), [1, 2]);
  eq('batch builder respects max count', buildBatches([{ path: 'a', b: 1 }, { path: 'b', b: 1 }, { path: 'c', b: 1 }, { path: 'd', b: 1 }, { path: 'e', b: 1 }], { size: 2, sizeOf: (f) => f.b }).map((x) => x.length), [2, 2, 1]);
  eq('batch builder single oversized file alone', buildBatches([{ path: 'a', b: 7 * MiB }, { path: 'b', b: 1 }], { size: 4, sizeOf: (f) => f.b }).map((x) => x.length), [1, 1]);
  // validateQuestions: every id needs numeric pass in (0,1] or escalate_only.
  const vqMsg = (spec) => { try { validateQuestions(spec); return ''; } catch (e) { return e.message; } };
  eq('validateQuestions rejects missing pass', /missing for: bad_id/.test(vqMsg({ questions: { ok_id: { type: 'noul', instructions: 'x' }, bad_id: { type: 'noul', instructions: 'x' } }, pass: { ok_id: 0.5 } })), true);
  eq('validateQuestions rejects pass out of range', vqMsg({ questions: { a: { type: 'noul', instructions: 'x' } }, pass: { a: 1.5 } }) !== '', true);
  eq('validateQuestions accepts escalate_only', vqMsg({ questions: { a: { type: 'noul', instructions: 'x' } }, escalate_only: ['a'] }), '');
  // time_s from manifest frame index, not array position.
  const zFrames = [{ index: 10, file: 'frame_000001.png' }, { index: 11, file: 'frame_000002.png' }];
  const zf = computeFindings(zFrames, { data: [Buffer.alloc(16), Buffer.alloc(16)], fps: 10 }, { blackMean: 16, blackStd: 4, frozenDiff: 0.5, frozenRun: 99, flashJump: 60 });
  eq('time_s from manifest index', zf.length && zf[0].time_s, 1);
  // controls mapping warning.
  eq('controls mapping warning fires', controlsCoverage([{ file: 'a.png', trips: ['dead_frame'] }], ['overlap', 'text_integrity']).anyMapped, false);
  eq('controls mapping ok', controlsCoverage([{ file: 'a.png', trips: ['dead_frame'] }], ['dead_frame']).mappedCount, 1);
  eq('controls mapping no trips never maps', controlsCoverage([{ file: 'a.png', trips: null }], ['dead_frame']).anyMapped, false);
  // declared.json suppression.
  const dec = applyDeclared(
    [{ frame: 30, check: 'flash' }, { frame: 40, check: 'flash' }, { frame: 50, check: 'frozen' }],
    { cuts: [30], holds: [[45, 60]] },
  );
  eq('declared suppresses flash near cut', dec.suppressed.filter((s) => s.check === 'flash').map((s) => s.frame), [30]);
  eq('declared suppresses frozen in hold', dec.suppressed.map((s) => s.check), ['flash', 'frozen']);
  eq('declared keeps unrelated findings', dec.findings.map((s) => s.frame), [40]);
  // declared.json suppression for ink: blackouts and holds windows.
  const decInk = applyDeclared([{ frame: 5, check: 'ink' }, { frame: 9, check: 'ink' }, { frame: 20, check: 'ink' }], { blackouts: [[4, 6]], holds: [[8, 10]] });
  eq('declared suppresses ink in blackout+hold', decInk.findings.map((s) => s.frame), [20]);
  eq('declared ink suppression reasons', decInk.suppressed.map((s) => s.suppressed_reason), ['ink inside a declared blackout', 'ink inside a declared hold']);
  // safe-zone rect math: fractions -> px on a 350-wide (350x622) test frame.
  eq('safe zones creator on 350px frame', safeZoneRects('creator', 350, 622), [
    { x: 0, y: 0, w: 350, h: 93 },
    { x: 0, y: 435, w: 350, h: 187 },
    { x: 315, y: 0, w: 35, h: 622 },
  ]);
  eq('safe zones tiktok scaled by width/1080', safeZoneRects('tiktok', 350, 622), [
    { x: 0, y: 0, w: 350, h: 42 },
    { x: 0, y: 465, w: 350, h: 157 },
    { x: 305, y: 0, w: 45, h: 622 },
  ]);
  eq('safe zones native 1080 keeps px values', safeZoneRects('tiktok', 1080, 1920), [
    { x: 0, y: 0, w: 1080, h: 130 },
    { x: 0, y: 1436, w: 1080, h: 484 },
    { x: 940, y: 0, w: 140, h: 1920 },
  ]);
  const szErr = () => { try { safeZoneRects('nope', 100, 100); return ''; } catch (e) { return e.message; } };
  eq('safe zones unknown platform errors', /--safe must be one of: creator, shorts, tiktok, reels/.test(szErr()), true);
  // ink math on synthetic buffers: blank vs busy.
  eq('median luma flat buffer', medianLuma(Buffer.alloc(200, 200)), 200);
  eq('median luma lower-middle on even count', medianLuma(Buffer.from([10, 20, 30, 200])), 20);
  eq('ink fraction blank is 0', inkFraction(Buffer.alloc(200, 200), medianLuma(Buffer.alloc(200, 200)), 12), 0);
  const busyBuf = Buffer.alloc(200, 200);
  for (let i = 0; i < 10; i++) busyBuf[i] = 40;
  eq('ink fraction busy 5%', +(inkFraction(busyBuf, 200, 12).toFixed(4)), 0.05);
  eq('ink fraction threshold boundary excluded', inkFraction(Buffer.from([100, 112, 88, 100]), 100, 12), 0);
  const inkF = computeFindings([{ index: 0, file: 'frame_000000.png' }], { data: [Buffer.alloc(64, 128)], fps: 30 }, { blackMean: 16, blackStd: 4, frozenDiff: 0.5, frozenRun: 99, flashJump: 60 });
  eq('ink finding fires on featureless frame', inkF.map((f) => f.check), ['ink']);
  const busy2 = Buffer.alloc(100, 128);
  for (let i = 0; i < 10; i++) busy2[i] = 250;
  const inkF2 = computeFindings([{ index: 0, file: 'frame_000000.png' }], { data: [busy2], fps: 30 }, { blackMean: 16, blackStd: 4, frozenDiff: 0.5, frozenRun: 99, flashJump: 60 });
  eq('no ink finding on busy frame', inkF2.length, 0);
  // compare arg validation.
  eq('compare args empty errors', /two inputs/.test(String(compareArgError([]))), true);
  eq('compare args one errors', /TWO inputs/.test(String(compareArgError(['a.png']))), true);
  eq('compare args two ok', compareArgError(['a.png', 'b.png']), null);
  eq('compare args three errors', /exactly two/.test(String(compareArgError(['a', 'b', 'c']))), true);
  // artifacts list: "safe" appears only when a safe/ subdir exists (i.e. only with --safe).
  const artDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clefcut-artifacts-'));
  eq('artifacts frames only on fresh dir', dirArtifacts(artDir), ['frames']);
  fs.mkdirSync(path.join(artDir, 'test'));
  fs.writeFileSync(path.join(artDir, 'frame_000000.png'), '');
  eq('artifacts gains test but not safe', dirArtifacts(artDir), ['frames', 'test']);
  fs.mkdirSync(path.join(artDir, 'safe'));
  eq('artifacts gains safe only when safe/ exists', dirArtifacts(artDir), ['frames', 'test', 'safe']);
  fs.rmSync(artDir, { recursive: true, force: true });
  // arg parser: value flags demand a value; --test-width may be bare (defaults to 350 later).
  const argMsg = (argv) => { try { parseArgs(argv); return ''; } catch (e) { return e.message; } };
  eq('arg parser missing value errors', /--questions requires a value/.test(argMsg(['ask', 'v.mp4', '--questions'])), true);
  eq('arg parser flags out value too', /--out requires a value/.test(argMsg(['frames', 'v.mp4', '--out', '--diff'])), true);
  eq('arg parser bare test-width allowed', parseArgs(['frames', 'v.mp4', '--test-width'])['test-width'], true);
  eq('arg parser test-width with value', parseArgs(['frames', 'v.mp4', '--test-width', '200'])['test-width'], '200');
  // URL builder: the FULL model id appears exactly once.
  eq('url builder single model id', runUrl('acc123', '@cf/cloudflare/clef-flash'), 'https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/@cf/cloudflare/clef-flash');
  eq('token estimate caps at 1024', estTokensPerFrame(3840, 2160), 1024);
  eq('token estimate fallback', estTokensPerFrame(null, null), 600);
  if (fails.length) { console.error(`\nselftest: ${fails.length} failure(s)`); return 2; }
  console.log('\nselftest: all checks passed');
  return 0;
}

// ---------------------------------------------------------------- help + dispatch

const HELP = `video-qa.mjs — Remotion video QA: free local frame checks + OCR first, Cloudflare CLEF (decisions) and CLAIRIC (extraction) second.

Usage: node video-qa.mjs <command> [options]
Exit codes: 0 = pass/ok; 1 = attention needed (findings, escalations, or unreliable controls); 2 = error (fix hint on stderr).

Commands:
  doctor [--ping]      Node, env vars (set/missing + which file each came from), ffmpeg, OCR engines, gateway.
                       --ping adds ONE clef-flash question (the only network call).
  frames <video> [--fps N] [--width W] [--out dir] [--frames A-B] [--test-width [N]]
               [--safe shorts|tiktok|reels|creator] [--diff] [--sheet]
                       Export frame_%06d.png + manifest.json. Default fps = full source fps.
                       --width omitted = NATIVE video width (no rescale); an explicit W scales to W px.
                       A-B is 0-based, frame-accurate (applies after optional --fps).
                       Re-extracting (e.g. a range) into an existing --out is allowed only when the
                       dir holds just tool-managed artifacts — those are cleared first, so no stale
                       frames survive; manifest.count = frames exported by THIS run.
                       ANY other file in the dir is an error — choose a fresh --out.
                       --test-width [N] (N defaults to 350): also write test/frame_%06d.png scaled to N px.
                       --safe <platform> (requires --test-width): also write safe/frame_%06d.png —
                       copies of the TEST-width frames with translucent red boxes (red@0.30, ffmpeg
                       drawbox) over that platform's UI occlusion zones, scaled proportionally to
                       the frame. Zone numbers live in ONE place — the SAFE_ZONES constant table in
                       this script (community-measured; for Reels the official ads-only guideline
                       is bottom 40%, the overlay keeps the community 30% zone); docs reference it.
                       --diff: also write diff/diff_%06d.png — consecutive-frame absolute difference,
                       amplified (tblend=all_mode=difference,eq=contrast=8).
                       --sheet: also write sheet.png — 8-column contact sheet (explicit tile rows, ≤64 frames),
                       capped at 64 frames (evenly sampled when there are more).
                       manifest.artifacts records what exists: ["frames","test","diff","safe","sheet"].
  check <framesDir> [--out findings.json] [--declared declared.json] [--black-mean 16] [--black-std 4]
        [--frozen-diff 0.5] [--frozen-run N] [--flash-jump 60] [--ink-threshold 12]
                       LOCAL, free: black/blank, frozen, flash/pop and ink checks per frame.
                       time_s comes from the manifest frame INDEX; without a manifest fps is
                       unknown and 30 is assumed (a warning is printed).
                       Frozen = a run of near-identical frames >= max(3, round(1.5 x fps)) frames
                       (~1.5 s); --frozen-run overrides the threshold (in frames).
                       ink — almost nothing drawn: per frame the median luma is computed and
                       ink_fraction = the fraction of pixels deviating more than --ink-threshold
                       (default 12) from it; ink_fraction < 0.005 is a finding (minor).
  declared.json (for check --declared) — intentional-edit map, frame numbers, inclusive:
        {"cuts":[n,...], "holds":[[a,b],...], "blackouts":[[a,b],...], "effects":[[a,b],...]}
        Suppresses (moved to "suppressed" in findings.json with the declaring reason, and
        excluded from the exit code): flash within 2 frames of a cut or inside effects;
        frozen inside holds; black inside blackouts or within 2 frames of a cut;
        ink inside blackouts or holds.
  compare <before.png> <after.png> [--out compare.png]
          (or compare <beforeDir> <afterDir> [--out compare.png])
                       Fix-round proof image, side by side. Two PNGs -> one same-height hstack:
                       the TALLER input is scaled down to the shorter height, the shorter passes
                       through unchanged. Two frame DIRS -> ONE combined contact sheet of matching
                       frame numbers (each pair an hstack, pairs stacked; <= 64 pairs, evenly
                       sampled when more). No text labels are burned in (no font dependency) —
                       the mapping (which file is left, which is right) is carried by the JSON
                       index written next to the output: <out minus extension>.json.
  text <framesDir|video> [--engine local|clairic|auto] [--fields fields.json] [--max-images 1]
       [--out text.json] [--yes] [--keep-temp]
                       On-screen text. local = tesseract.js or system tesseract — note
                       tesseract.js downloads English traineddata on first run; on an airgapped
                       machine install system tesseract instead. clairic = Cloudflare extraction:
                       credentials are checked BEFORE any frames are extracted, a cost estimate
                       prints before the first request (>240 frames needs --yes), requests are
                       paced >= 300 ms apart, text.json is rewritten after every request, and the
                       default is 1 frame per request (per-frame answers are the truth CLAIRIC
                       gives). NOTE: with multiple fields, text/confidence reflect the FIRST field.
  ask <framesDir|video> --questions questions.json [--model clef|clef-flash|clef-omni]
      [--gateway id] [--max-images 4] [--out answers.json] [--controls dir] [--yes] [--keep-temp]
                       CLEF pass: batches of <= --max-images frames and <= 6 MiB raw PNG bytes
                       per request. Credentials are checked before any frame extraction; the cost
                       estimate prints after resolving frames and before the first request; more
                       than 240 frames requires --yes (or CLEFCUT_YES=1). Requests are paced
                       >= 300 ms apart and answers.json is rewritten after every request
                       ("complete": false until the run finishes; a fatal mid-run error still
                       leaves the partial file, then exits 2).
                       Controls (from synthesize) go in their OWN requests, never mixed with real
                       frames, and are excluded from the main tally. With a controls.json whose
                       trips ids match no question id: "0 of N controls map to any question id —
                       controls validated nothing" and the run is marked unreliable. Without
                       controls.json the controls are simply not validated (stated in the output).
                       Auto-isolation: a multi-frame batch with any fail/escalate is re-asked one
                       image per request and per-frame rows (with their true frame number) replace
                       the batch rows; usage of both passes is recorded.
                       Exit 1 when any answer fails or escalates, or the run is unreliable.
  extract <framesDir|video> --fields fields.json [--max-images 1] [--out extract.json] [--yes] [--keep-temp]
                       CLAIRIC typed extraction. Default 1 frame per request; same credentials-
                       first, cost gate (>240 frames needs --yes), incremental writes and pacing
                       as ask.
  synthesize <framesDir> --out controlsDir
                       Free positive controls: black (trips dead_frame), ghost = the two most
                       different consecutive frames blended 50/50 (trips overlap), 96px cut off
                       the left edge (trips text_integrity) + controls.json.
  --selftest           Built-in unit checks (no network).

questions.json schema (for ask):
  {
    "questions": {
      "<id>": {
        "type": "noul" | "choice" | "score",
        "instructions": "...",            // required
        "criteria": { "opt": "desc" }     // choice: OBJECT (required)
        "criteria": ["ok", ..., "worst"]  // score: ordered ARRAY, worst LAST (required)
        "defect_options": ["opt"]         // choice, optional: options that mean "defect"
      }
    },
    "pass": { "<id>": 0.5 },              // REQUIRED for every id unless it is in escalate_only:
                                         // numeric, in (0,1]; defect-prob >= t => fail
    "escalate_margin": 0.3,               // defect-prob >= t - margin => escalate (default 0.3)
    "severity": { "<id>": "blocker" | "major" | "minor" },
    "escalate_only": ["<id>"]             // these ids never fail; fail becomes escalate
  }
  Defect probability: noul => answer.noul (yes = defect present);
  score => score / (levels-1) (highest level = worst);
  choice => probability of the question's "defect_options" (or 0 when absent).
  null/missing answers always escalate. Choice answers escalate when their OWN confidence
  is < 0.5 (fixed floor, never the pass threshold).

Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLEFCUT_GATEWAY_ID (optional),
CLEFCUT_FFMPEG/CLEFCUT_FFPROBE (optional), CLEFCUT_YES=1 (= --yes). Precedence: process env
> ./.env > ~/.clefcut/.env (doctor prints which file — or "process env" — each value came
from). Token values are never printed.`;

/** Flags that must be followed by a value; a missing/true value is a clean exit-2 error. */
const VALUE_FLAGS = new Set(['fps', 'width', 'out', 'frames', 'questions', 'fields', 'model', 'gateway', 'max-images', 'engine', 'controls', 'declared', 'black-mean', 'black-std', 'frozen-diff', 'frozen-run', 'flash-jump', 'ink-threshold', 'safe']);

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { out._.push(...argv.slice(i + 1)); break; }
    if (a === '--help' || a === '-h') { out.help = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next != null && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
      if (VALUE_FLAGS.has(key) && out[key] === true) throw new UserError(`--${key} requires a value`);
    } else out._.push(a);
  }
  return out;
}

async function main(argv) {
  try {
    const o = parseArgs(argv);
    if (o.selftest) return cmdSelftest();
    const cmd = o._[0];
    if (!cmd || o.help) { console.log(HELP); return 0; }
    switch (cmd) {
      case 'doctor': return await cmdDoctor(o);
      case 'frames': return await cmdFrames(o._[1], o);
      case 'check': return await cmdCheck(o._[1], o);
      case 'compare': return await cmdCompare(o._.slice(1), o);
      case 'text': return await cmdText(o._[1], o);
      case 'ask': return await cmdAsk(o._[1], o);
      case 'extract': return await cmdExtract(o._[1], o);
      case 'synthesize': return await cmdSynthesize(o._[1], o);
      default: throw new UserError(`Unknown command: ${cmd}. Run with --help.`);
    }
  } catch (e) {
    if (e instanceof UserError) { console.error(`error: ${redact(e.message)}`); return 2; }
    console.error(`error: ${redact(e && e.stack ? e.stack : String(e))}`);
    return 2;
  }
}

// Symlink-safe: compare the REAL path of argv[1] (a symlink resolves to this file).
let invokedDirectly = false;
if (process.argv[1]) {
  try { invokedDirectly = pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { /* unreadable argv[1] */ }
}
if (invokedDirectly) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });

export { cmdCheck, cmdFrames, cmdDoctor, cmdText, cmdAsk, cmdExtract, cmdSynthesize, main };
