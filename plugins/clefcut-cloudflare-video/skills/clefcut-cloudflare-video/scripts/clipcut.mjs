#!/usr/bin/env node
// clipcut.mjs — cut long videos into social/creator clips: FREE local analysis first
// (probe / segments / sheets / cut / tighten / export / check / preview), Cloudflare
// Workers AI second (CLEF = rate contact sheets, CLAIRIC = read burned-in text),
// verified ffmpeg cutting and platform export last. Single file, zero npm
// dependencies (node: builtins; tesseract.js used opportunistically when present).
// Node 18+. MIT license.
//
// Credits / design lineage:
//   - Infrastructure (env layering, ffmpeg discovery, batching, retry shape, cost gate)
//     adapted from Levanto Labs SageCut (MIT) via the sibling video-qa.mjs skill.
//   - Tolerance-based cutting (try -c copy, measure, re-encode when off), silence
//     removal with kept margins, and the platform compliance-check idea are inspired
//     by kajisho5/ffmpeg-skill (MIT).
//   - The rate rubric (questions.json pass/escalate semantics) follows melvynx's
//     rubric style from the sibling skill.
//
// Env (process env wins, then <cwd>/.env, then ~/.clefcut/.env; values never printed):
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Workers AI: Read, plus Edit unless the
//   token was created from the dashboard template), CLEFCUT_GATEWAY_ID (optional AI
//   Gateway id), CLEFCUT_FFMPEG / CLEFCUT_FFPROBE (optional binary paths), CLEFCUT_YES=1
//   (acts like passing --yes to the cost gate).
//
// Examples:
//   node clipcut.mjs doctor --ping
//   node clipcut.mjs probe talk.mp4 --out probe.json
//   node clipcut.mjs segments probe.json --min 15 --max 90 --count 10
//   node clipcut.mjs sheets talk.mp4 --segments segments.json --out sheets/
//   node clipcut.mjs rate --sheets sheets/ --questions questions.json --model clef-flash
//   node clipcut.mjs read talk.mp4 --segments segments.json --engine auto
//   node clipcut.mjs cut talk.mp4 --plan clips.json --tolerance 0.5
//   node clipcut.mjs tighten clips/hook.mp4
//   node clipcut.mjs export clips/hook.mp4 --platform shorts --variant 9x16-crop --loudnorm
//   node clipcut.mjs check exports/hook_shorts_9x16-crop.mp4 --platform shorts
//   node clipcut.mjs preview clips/hook.mp4 --source talk.mp4 --start 12.5 --end 58.2
//   node clipcut.mjs plan --file clips.json
//   node clipcut.mjs --selftest

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------- constants

const RATE_STATE_TEMPLATE = 'Contact sheet of {N} evenly-spaced frames from one candidate segment of a longer video, reading order left-to-right top-to-bottom. Answer about the segment as a whole.';
const READ_STATE = 'One frame from the middle of a candidate segment of a longer video. Answer from what is visible in this frame.';
const READ_STATE_SHEET = 'A contact sheet of evenly-spaced frames from one candidate segment of a longer video, reading order left-to-right top-to-bottom. Answer about the segment as a whole from what is visible in the sheet.';
const PRICES = { clef: 0.24, 'clef-flash': 0.038, 'clef-omni': 0.15, clairic: 0.10 }; // $/Mtok input; output free
const MAX_IMAGES = 4;                        // API hard cap per request
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;     // 4 MiB per image (fact sheet)
const BATCH_BYTES = 6 * 1024 * 1024;         // pre-split raw PNG bytes per request (8 MiB decoded / 13 MiB body caps)
const GATE_MAX_IMAGES = 240;                 // above this, rate/read(clairic) need --yes
const PACE_MS = 300;                         // minimum delay between API requests
const CHOICE_CONF_FLOOR = 0.5;               // choice answers below this confidence escalate
const TIMEOUT_MS = 120_000;
const RETRIES = 3;                           // 429/5xx: backoff 1s, 2s, 4s (retry-after honored, capped 60s)
const SCENE_THRESHOLD = 0.4;                 // default scene-score cutoff for scene_changes
const SCENE_MAX_CHANGES = 64;                // keep at most this many scene-change points
const SILENCE_FILTER = 'silencedetect=noise=-35dB:d=0.5';
const FADE_S = 0.03;                         // 30 ms audio fades on accurate re-encodes / tighten joins
const SILENT_MAX_DB = -80;                   // one digital-silence tripwire: max volume at/below this = dead audio
const FP_REGION_BYTES = 8 * 1024 * 1024;     // input fingerprint: sha256 of the first AND last 8 MiB

/**
 * Gain expression for a 30 ms de-click at a tighten JOIN (output timeline):
 * ramp down into c, ramp up out of c, gain 1 everywhere else. NOT afade —
 * afade=t=in with st>0 silences everything before st, which would zero every
 * earlier kept piece. Evaluate at t=c: between() is inclusive so the first
 * branch wins and yields 0 — continuous on both sides of the dip.
 */
export function fadeJoinExpr(c, fadeS = FADE_S) {
  return `if(between(t,${fmt(c - fadeS)},${fmt(c)}),(${fmt(c)}-t)/${fadeS},if(between(t,${fmt(c)},${fmt(c + fadeS)}),(t-${fmt(c)})/${fadeS},1))`;
}

const LOUDNORM_TARGET = { I: -14, TP: -1.5, LRA: 11 };
const PLATFORMS = ['youtube', 'shorts', 'tiktok', 'reels', 'x', 'creator'];
const VARIANTS = ['original', '9x16-crop', '9x16-blur'];
const TIGHTEN_DEFAULTS = { thresholdDb: -35, minSilenceS: 0.6, marginS: 0.15, minKeepS: 0.2, maxCuts: 400 };
const DEFAULT_TEXT_FIELDS = { onscreen_text: { type: 'text', instructions: 'All text visible in the frame, in reading order' } };
const IS_WIN = process.platform === 'win32';
const EXE = IS_WIN ? '.exe' : '';
const EXPORT_NAME_RE = new RegExp(`^[A-Za-z0-9._-]+_(${PLATFORMS.join('|')})_(${VARIANTS.join('|')})\\.mp4$`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fmt = (n) => String(+(+n).toFixed(3));

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
  if (!c.accountId || !c.token) throw new UserError('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required (process env, ./.env or ~/.clefcut/.env). Run "clipcut.mjs doctor".');
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

/** Classify one answer. p = defect probability (higher = worse), t = pass threshold, margin = escalate band below t. */
export function classify(p, t, margin = 0.3, escalateOnly = false) {
  if (p == null || !Number.isFinite(p)) return 'escalate';
  if (t == null) return 'pass';
  if (p >= t) return escalateOnly ? 'escalate' : 'fail';
  if (p >= t - margin) return 'escalate';
  return 'pass';
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

/** Rough input tokens for one image: (w/32)*(h/32)+3, capped 1024; 600 (~960px class) when size unknown. */
export function estTokensPerFrame(w, h) {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 600;
  return Math.min(1024, Math.max(1, Math.round(w / 32)) * Math.max(1, Math.round(h / 32)) + 3);
}

// ---------------------------------------------------------------- fingerprints + rotation (pure)

/** sha256 of a buffer, hex. */
export function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * "head:tail" sha256 hex pair over the first and last `region` bytes of a buffer
 * (pure — the selftests feed fixed buffers). For buffers smaller than 2*region the
 * two windows overlap; that is fine, they are hashed independently.
 */
export function headTailHash(buf, region = FP_REGION_BYTES) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const n = Math.max(0, Math.min(region, b.length));
  const head = b.subarray(0, n);
  const tail = b.subarray(b.length - n);
  return `${sha256Hex(head)}:${sha256Hex(tail)}`;
}

/**
 * Input fingerprint: file size in bytes + the "head:tail" sha256 pair over the
 * first/last 8 MiB. A re-render at the same path with the same duration still
 * changes bytes in the head region, so the pair catches swapped files the
 * path/duration warnings miss.
 */
export function fingerprintFile(file) {
  const st = fs.statSync(file);
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const n = Math.min(FP_REGION_BYTES, st.size);
    const head = Buffer.alloc(n);
    if (n > 0) fs.readSync(fd, head, 0, n, 0);
    const tail = Buffer.alloc(n);
    if (n > 0) fs.readSync(fd, tail, 0, n, Math.max(0, st.size - n));
    return { size: st.size, sha256_head_tail: `${sha256Hex(head)}:${sha256Hex(tail)}` };
  } finally {
    if (fd != null) fs.closeSync(fd);
  }
}

/** Fingerprint verdict: true = match, false = MISMATCH, null = not comparable (either side absent). */
export function fingerprintsMatch(a, b) {
  if (!a || !b || a.size == null || b.size == null || !a.sha256_head_tail || !b.sha256_head_tail) return null;
  return a.size === b.size && a.sha256_head_tail === b.sha256_head_tail;
}

/**
 * Signed rotation degrees from an ffprobe stream's side_data_list Display Matrix
 * entry, normalized to (-180, 180]; null when absent or zero. The sign convention
 * varies by producer — only |rot| % 180 === 90 matters for the dimension swap.
 */
export function streamRotation(stream) {
  const list = stream && Array.isArray(stream.side_data_list) ? stream.side_data_list : [];
  let raw = null;
  for (const sd of list) {
    if (!sd || !('rotation' in sd)) continue;
    const n = Number(sd.rotation);
    if (Number.isFinite(n)) { raw = n; break; }
  }
  if (raw == null) return null;
  const norm = ((raw % 360) + 360) % 360;
  const signed = norm > 180 ? norm - 360 : norm;
  return signed === 0 ? null : signed;
}

/** Display dimensions after rotation metadata: at ±90/±270 width/height swap.
 * Returns { width, height, rotated } — non-numeric input keeps null dims. */
export function displayDimsForRotation(width, height, rotation) {
  const w = Number(width); const h = Number(height);
  const r = Number(rotation);
  const rotated = Number.isFinite(r) && Math.abs(r) % 180 === 90;
  const okW = Number.isFinite(w) && w > 0;
  const okH = Number.isFinite(h) && h > 0;
  if (rotated && okW && okH) return { width: h, height: w, rotated: true };
  return { width: okW ? w : null, height: okH ? h : null, rotated: false };
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

/** Run a binary, collect stdout/stderr; optionally write `input` to stdin (drain first: no pipe
 * deadlock). stderr is capped (it is for error messages only) — high-volume parses must target
 * STDOUT (collected as unbounded buffers) or a temp file, NEVER stderr, or a long video
 * silently loses the head of its output. */
function runExe(exe, args, { env = process.env, input = null } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(exe, args, { env, windowsHide: true });
    const out = []; let err = '';
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => { err += d.toString(); if (err.length > 400_000) err = err.slice(-200_000); });
    p.on('error', (e) => reject(new UserError(`${exe} could not start: ${e.message}. Run "clipcut.mjs doctor".`)));
    p.on('close', (code) => resolve({ code, stdout: Buffer.concat(out), stderr: err }));
    if (input) p.stdin.end(input); else p.stdin.end();
  });
}

const runFf = async (bin, args, opts = {}) => {
  const loc = await locate();
  return runExe(bin === 'ffprobe' ? loc.ffprobe : loc.ffmpeg, args, { ...opts, env: loc.env });
};

/** Container facts via ffprobe: duration, dimensions, fps (avg first), VFR guess, audio presence.
 * width/height are DISPLAY dims: rotation metadata (tkhd display matrix, read from
 * stream.side_data_list[].rotation) swaps them at ±90/±270 — ffmpeg autorotates on
 * decode, so downstream filter math and aspect checks must use the display dims. */
async function probeContainer(file) {
  const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  if (r.code !== 0) throw new UserError(`ffprobe failed on ${file}: ${r.stderr.trim().slice(0, 300)}`);
  const j = JSON.parse(r.stdout.toString());
  const v = (j.streams || []).find((s) => s.codec_type === 'video');
  if (!v) throw new UserError(`${file} has no video stream.`);
  const rate = (s) => { const [n, d] = String(s || '0/1').split('/').map(Number); return d ? n / d : n || 0; };
  const rFps = rate(v.r_frame_rate);
  const avgFps = rate(v.avg_frame_rate);
  const duration = Number(j.format && j.format.duration) || Number(v.duration) || 0;
  const rotation = streamRotation(v);
  const dims = displayDimsForRotation(v.width, v.height, rotation);
  return {
    width: dims.width, height: dims.height,
    codedWidth: Number.isFinite(Number(v.width)) ? Number(v.width) : null,
    codedHeight: Number.isFinite(Number(v.height)) ? Number(v.height) : null,
    rotation, rotated: dims.rotated,
    fps: avgFps || rFps || 30, r_frame_rate: rFps, avg_frame_rate: avgFps,
    vfr: rFps > 0 && avgFps > 0 && Math.abs(rFps - avgFps) > 0.5,
    hasAudio: (j.streams || []).some((s) => s.codec_type === 'audio'),
    codec: v.codec_name || null, pixFmt: v.pix_fmt || null,
    duration,
  };
}

/** Facts for the `check` subcommand: one ffprobe pass (container + streams) plus, when an
 * audio stream exists, volumedetect (levels/silence) and loudness (loudnorm JSON with the
 * ebur128 fallback). Unmeasurable facts stay null — never guessed. A hard ffprobe failure
 * throws; a file with no video stream returns measurable: false (rows become WARNs). */
async function probeCheckFacts(file) {
  const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  if (r.code !== 0) throw new UserError(`ffprobe failed on ${file}: ${r.stderr.trim().slice(0, 300)}`);
  const j = JSON.parse(r.stdout.toString());
  const v = (j.streams || []).find((s) => s.codec_type === 'video') || null;
  const a = (j.streams || []).find((s) => s.codec_type === 'audio') || null;
  const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : null; };
  const rate = (s) => { const [n, d] = String(s || '0/1').split('/').map(Number); return d ? n / d : n || 0; };
  const durRaw = num(j.format && j.format.duration) ?? (v ? num(v.duration) : null);
  const rFps = v ? rate(v.r_frame_rate) : 0;
  const avgFps = v ? rate(v.avg_frame_rate) : 0;
  // The moov-box walk only means something on ISO-BMFF containers (mp4/mov family);
  // on anything else faststart is unmeasurable (null), never a false FAIL.
  const container = String((j.format && j.format.format_name) || '');
  const isIsoBmff = /mp4|mov|m4a|3gp|m4v/.test(container);
  let sizeBytes = null;
  try { sizeBytes = fs.statSync(file).size; } catch { /* keep null */ }
  // Display dims: rotation metadata swaps width/height at ±90/±270 (probeContainer parity).
  const rotation = v ? streamRotation(v) : null;
  const dims = v ? displayDimsForRotation(v.width, v.height, rotation) : { width: null, height: null };
  const facts = {
    file,
    measurable: !!v,
    duration: durRaw != null && durRaw > 0 ? +durRaw.toFixed(3) : null,
    width: dims.width,
    height: dims.height,
    rotation,
    fps: avgFps || rFps || null,
    vfr: !!(rFps > 0 && avgFps > 0 && Math.abs(rFps - avgFps) > 0.5),
    videoCodec: v ? v.codec_name || null : null,
    pixFmt: v ? v.pix_fmt || null : null,
    hasAudio: !!a,
    audioCodec: a ? a.codec_name || null : null,
    audioSampleRate: a ? num(a.sample_rate) : null,
    faststart: isIsoBmff ? hasFaststart(file) : null,
    loudness: null,
    silentAudio: null,
    audioMaxDb: null,
    sizeBytes,
  };
  if (a) {
    const rv = await runFf('ffmpeg', ['-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
    const vol = parseVolumedetect(rv.stderr);
    if (vol) {
      facts.audioMaxDb = vol.max;
      facts.silentAudio = vol.max != null ? vol.max <= SILENT_MAX_DB : null;
    }
    const rl = await runFf('ffmpeg', ['-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
    facts.loudness = parseLoudnormJson(rl.stderr);
    if (!facts.loudness) {
      const re = await runFf('ffmpeg', ['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
      facts.loudness = parseEbur128(re.stderr);
    }
  }
  return facts;
}

/** Pixel dimensions of an image file (ffprobe), or nulls. */
async function imageDims(img) {
  try {
    const r = await runFf('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', img]);
    const s = JSON.parse(r.stdout.toString()).streams[0];
    if (s && s.width) return { width: s.width, height: s.height };
  } catch { /* fall through */ }
  return { width: null, height: null };
}

// ---------------------------------------------------------------- ffmpeg output parsers (pure)

/** Escape a path for use as a filtergraph option value (metadata=print:file=...). */
export function escapeFilterPath(p) {
  return String(p).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

/** Parse `metadata=print` output: "frame:N pts:P pts_time:T" lines followed by "lavfi.scene_score=S". */
export function parseSceneMetadata(text) {
  const out = [];
  let t = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const pt = /pts_time:(-?[\d.]+)/.exec(line);
    if (pt) { t = Number(pt[1]); continue; }
    const sc = /lavfi\.scene_score=([\d.eE+-]+)/.exec(line);
    if (sc) out.push({ t: Number.isFinite(t) ? t : null, score: Number(sc[1]) });
  }
  return out;
}

/** Keep the top `cap` local maxima with score >= threshold, returned as ascending timestamps. */
export function sceneMaxima(scenes, threshold = SCENE_THRESHOLD, cap = SCENE_MAX_CHANGES) {
  const c = (scenes || []).filter((s) => s && Number.isFinite(s.t) && Number.isFinite(s.score));
  const peaks = c.filter((s, i) =>
    s.score >= threshold
    && (i === 0 || s.score >= c[i - 1].score)
    && (i === c.length - 1 || s.score > c[i + 1].score));
  return peaks.slice().sort((a, b) => b.score - a.score).slice(0, Math.max(1, cap)).sort((a, b) => a.t - b.t).map((s) => +s.t.toFixed(3));
}

/**
 * Boundary verdict from ONE window's scene scan (absolute timestamps): the max scene score
 * in the window, and whether any scene-change peak lands within `nearS` seconds of t.
 */
export function boundaryScan(windowScenes, t, { threshold = SCENE_THRESHOLD, nearS = 0.5 } = {}) {
  const c = (windowScenes || []).filter((s) => s && Number.isFinite(s.t) && Number.isFinite(s.score));
  const scene_score_max = c.length ? Math.max(...c.map((s) => s.score)) : null;
  const scene_change_near = sceneMaxima(c, threshold).some((pt) => Math.abs(pt - t) <= nearS);
  return { scene_score_max, scene_change_near };
}

/** Parse silencedetect stderr lines into {start, end, duration?}; an unclosed start gets end: null. */
export function parseSilences(text) {
  const out = [];
  let start = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const m1 = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (m1) { start = Number(m1[1]); continue; }
    const m2 = /silence_end:\s*(-?[\d.]+)/.exec(line);
    if (m2) {
      const end = Number(m2[1]);
      const md = /silence_duration:\s*([\d.]+)/.exec(line);
      out.push({ start: start == null ? 0 : start, end, ...(md ? { duration: Number(md[1]) } : {}) });
      start = null;
    }
  }
  if (start != null) out.push({ start, end: null }); // still silent at EOF
  return out;
}

/** Parse loudnorm print_format=json output (the trailing JSON block on stderr). */
export function parseLoudnormJson(text) {
  const s = String(text || '');
  const i = s.lastIndexOf('{');
  const j = i >= 0 ? s.indexOf('}', i) : -1;
  if (i < 0 || j < 0) return null;
  let o = null;
  try { o = JSON.parse(s.slice(i, j + 1)); } catch { return null; }
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const I = o.input_i != null ? num(o.input_i) : null;
  if (I == null) return null;
  return {
    I, TP: o.input_tp != null ? num(o.input_tp) : null,
    LRA: o.input_lra != null ? num(o.input_lra) : null,
    threshold: o.input_thresh != null ? num(o.input_thresh) : null,
  };
}

/** Parse an ebur128 summary (fallback when loudnorm JSON does not parse). */
export function parseEbur128(text) {
  const s = String(text || '');
  const mi = /I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/.exec(s);
  if (!mi) return null;
  const mp = /Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/.exec(s);
  return { I: Number(mi[1]), TP: mp ? Number(mp[1]) : null, LRA: null, threshold: null };
}

/** Parse ffprobe default text output of -show_packets -show_entries packet=pts_time,flags; keep keyframes (flags contain K). Timestamps are rounded UP to the next ms so a copy-mode -ss at the reported time can never land before the keyframe (which would snap back a whole GOP). */
export function parseKeyframes(text) {
  const out = [];
  let pts = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const p = /^pts_time=(-?[\d.]+|N\/A)/.exec(line);
    if (p) { pts = p[1] === 'N/A' ? null : Number(p[1]); continue; }
    const f = /^flags=(\S*)/.exec(line);
    if (f) { if (f[1].includes('K') && pts != null) out.push(Math.ceil(pts * 1000) / 1000); pts = null; }
  }
  return out;
}

/** Latest keyframe timestamp at or before t (a copy-mode -ss snaps to it); null when unknown. */
export function keyframeAtOrBefore(keyframes, t) {
  let best = null;
  for (const k of keyframes || []) if (Number.isFinite(k) && k <= t + 1e-6 && (best == null || k > best)) best = k;
  return best;
}

/** The keyframes BRACKETING t: { before: latest <= t, after: earliest >= t } — nulls when
 * unknown. Feeds cut-report's nearest_keyframes (what the re-encode path snapped past). */
export function bracketKeyframes(keyframes, t) {
  let before = null;
  let after = null;
  for (const k of keyframes || []) {
    if (!Number.isFinite(k)) continue;
    if (k <= t + 1e-6 && (before == null || k > before)) before = k;
    if (k >= t - 1e-6 && (after == null || k < after)) after = k;
  }
  return { before, after };
}

/** Parse volumedetect stderr: { mean, max } in dBFS (either null when absent). Digital
 * silence reports as about -91 dB — used by `tighten` (threshold suggestion) and `check`
 * (silent-audio row). */
export function parseVolumedetect(text) {
  const s = String(text || '');
  const mm = /mean_volume:\s*(-?[\d.]+)\s*dB/.exec(s);
  const xm = /max_volume:\s*(-?[\d.]+)\s*dB/.exec(s);
  if (!mm && !xm) return null;
  const n = (m) => (m ? Number(m[1]) : null);
  return { mean: n(mm), max: n(xm) };
}

/** Max volume in dBFS via volumedetect — null when the file has no readable audio. */
async function measureMaxVolume(file) {
  try {
    const rv = await runFf('ffmpeg', ['-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
    if (rv.code !== 0) return null;
    const vol = parseVolumedetect(rv.stderr);
    return vol ? vol.max : null;
  } catch { return null; }
}

// ---------------------------------------------------------------- segments builder (pure)

/**
 * Build candidate segments from a probe. Boundaries = union of scene_changes and silence
 * ENDS (natural cut points: breath/sentence boundaries + hard scene changes), plus 0 and
 * duration. From each boundary, greedily take the FURTHEST boundary-delimited segment that
 * fits [min, max]; a video shorter than max is itself one candidate. Ranked by
 * scene density x loudness proximity (loudness is the whole-file measurement, so density
 * drives the ranking), capped at `count`; ids seg_001.. in ranked order.
 */
export function buildSegments(probeData, { min = 15, max = 90, count = 10 } = {}) {
  const eps = 0.05;
  const duration = Number(probeData && probeData.duration) || 0;
  if (!(duration > 0)) return { segments: [], notes: ['probe has no duration — cannot build segments'] };
  const inRange = (t) => Number.isFinite(t) && t > eps && t < duration - eps;
  const sceneChanges = (Array.isArray(probeData.scene_changes) ? probeData.scene_changes : []).map(Number).filter(inRange);
  const silenceEnds = (Array.isArray(probeData.silences) ? probeData.silences : []).map((s) => (s ? Number(s.end) : NaN)).filter(inRange);
  const silenceStarts = (Array.isArray(probeData.silences) ? probeData.silences : []).map((s) => (s ? Number(s.start) : NaN)).filter(inRange);
  const sorted = [...new Set([0, duration, ...sceneChanges, ...silenceEnds].map((t) => +t.toFixed(3)))].sort((a, b) => a - b);
  const bounds = [];
  for (const b of sorted) if (!bounds.length || b - bounds[bounds.length - 1] > eps) bounds.push(b);
  const thrRaw = Number(probeData && probeData.scene_threshold);
  const thr = Number.isFinite(thrRaw) && thrRaw > 0 ? thrRaw : SCENE_THRESHOLD;
  const scenesT = (Array.isArray(probeData.scenes) ? probeData.scenes : [])
    .map((s) => (s && Number.isFinite(Number(s.t)) && Number.isFinite(Number(s.score)) && s.score >= thr ? Number(s.t) : null))
    .filter((t) => t != null);
  const loud = probeData && probeData.loudness ? Number(probeData.loudness.I) : NaN;
  const loudProx = Number.isFinite(loud) ? 1 / (1 + Math.abs(loud - LOUDNORM_TARGET.I) / 10) : 1;
  const silenceEdges = [...silenceEnds, ...silenceStarts];
  const nearSilenceEdge = (x) => silenceEdges.some((e) => Math.abs(e - x) <= 0.75);
  const seen = new Set();
  const mk = (start, end) => {
    const key = `${start.toFixed(3)}|${end.toFixed(3)}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const dur = +(end - start).toFixed(3);
    const density = dur > 0 ? scenesT.filter((t) => t >= start && t < end).length / dur : 0;
    return {
      start: +start.toFixed(3), end: +end.toFixed(3), duration: dur,
      score: +(density * loudProx).toFixed(4),
      signals: {
        scenes: sceneChanges.filter((t) => t > start + eps && t < end - eps).length,
        silence_cut: nearSilenceEdge(start) || nearSilenceEdge(end),
      },
    };
  };
  const candidates = [];
  for (let i = 0; i < bounds.length; i++) {
    const s = bounds[i];
    if (s >= duration - eps) continue;
    let bestEnd = null;
    for (let j = i + 1; j < bounds.length; j++) {
      const e = bounds[j];
      if (e - s > max + eps) break;
      if (e - s >= min - eps) bestEnd = e;
    }
    if (bestEnd != null) { const c = mk(s, bestEnd); if (c) candidates.push(c); }
  }
  if (duration <= max + eps) { const c = mk(0, duration); if (c) candidates.push(c); } // whole video fits in max
  candidates.sort((a, b) => b.score - a.score);
  const ranked = candidates.slice(0, Math.max(1, count))
    .map((c, i) => ({ id: `seg_${String(i + 1).padStart(3, '0')}`, rank: i + 1, start: c.start, end: c.end, duration: c.duration, score: c.score, signals: c.signals }));
  return { segments: ranked };
}

/**
 * N equal mechanical segments over [0, duration] — the honest fallback (--even-split) when
 * no content-aware candidate exists. Each is flagged mechanical: true so downstream steps
 * (and humans) know these are equal divisions, not scene/silence-driven picks.
 */
export function evenSplitSegments(duration, n, { sceneChanges = [], silences = [] } = {}) {
  const eps = 0.05;
  const N = Math.max(1, Math.floor(Number(n) || 1));
  const d = Number(duration) || 0;
  const sceneT = (sceneChanges || []).map(Number).filter((t) => Number.isFinite(t));
  const edges = [];
  for (const s of silences || []) {
    if (!s) continue;
    if (Number.isFinite(Number(s.end))) edges.push(Number(s.end));
    if (Number.isFinite(Number(s.start))) edges.push(Number(s.start));
  }
  const out = [];
  for (let i = 0; i < N; i++) {
    const start = +((d * i) / N).toFixed(3);
    const end = +((d * (i + 1)) / N).toFixed(3);
    out.push({
      start, end, duration: +(end - start).toFixed(3), mechanical: true,
      signals: {
        scenes: sceneT.filter((t) => t > start + eps && t < end - eps).length,
        silence_cut: edges.some((e) => Math.abs(e - start) <= 0.75 || Math.abs(e - end) <= 0.75),
      },
    });
  }
  return out;
}

// ---------------------------------------------------------------- cut / export helpers (pure)

/** Compare an output clip's real duration against the requested one. Tolerance is in seconds. */
export function classifyDuration(actualS, requestedS, tolerance = 0.5) {
  const a = Number(actualS); const r = Number(requestedS);
  if (!Number.isFinite(a) || !Number.isFinite(r)) return { error_ms: null, within: false };
  const err = Math.abs(a - r);
  return { error_ms: Math.round(err * 1000), within: err <= tolerance };
}

export function sanitizeSlug(name) {
  const s = String(name || '').replace(/\.[A-Za-z0-9]+$/, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+/, '');
  return s || 'clip';
}

export function exportName(slug, platform, variant) {
  return `${sanitizeSlug(slug)}_${platform}_${variant}.mp4`;
}

/** Validate clips.json. `sourceDuration` (seconds, when known) adds an end-beyond-source
 * warning. Returns { errors, warnings } (never throws). Unknown platform ids are an OPEN
 * LIST: they map to the generic creator profile with a warning, not an error. */
export function validatePlan(plan, sourceDuration = null) {
  const errors = [];
  const warnings = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan) || !Array.isArray(plan.clips) || !plan.clips.length) {
    return { errors: ['needs a non-empty "clips" array — see "clipcut.mjs plan" for the schema'], warnings };
  }
  const seenSlugs = new Set();
  const srcDur = Number(sourceDuration);
  plan.clips.forEach((c, i) => {
    const p = `clips[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${p} must be an object`); return; }
    if (typeof c.slug !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(c.slug)) errors.push(`${p}.slug must be a filename-safe string ([A-Za-z0-9._-], not starting with . or -)`);
    else if (seenSlugs.has(c.slug)) errors.push(`${p}.slug "${c.slug}" is duplicated — slugs must be unique`);
    else seenSlugs.add(c.slug);
    const s = Number(c.start); const e = Number(c.end);
    if (!Number.isFinite(s) || s < 0) errors.push(`${p}.start must be a number >= 0`);
    if (!Number.isFinite(e) || e < 0) errors.push(`${p}.end must be a number >= 0`);
    if (Number.isFinite(s) && Number.isFinite(e) && e <= s) errors.push(`${p}.end must be greater than ${p}.start`);
    if (Number.isFinite(s) && Number.isFinite(e) && e > s) {
      const d = e - s;
      if (d < 5 || d > 600) warnings.push(`${p} "${c.slug}" duration ${fmt(d)}s is outside the 5-600s comfort range`);
    }
    if (Number.isFinite(e) && Number.isFinite(srcDur) && srcDur > 0 && e > srcDur) warnings.push(`${p} "${c.slug}" end ${fmt(e)}s is beyond the source duration ${fmt(srcDur)}s`);
    if (c.variants != null && (!Array.isArray(c.variants) || !c.variants.length || c.variants.some((v) => !VARIANTS.includes(v)))) errors.push(`${p}.variants must be an array of ${VARIANTS.join('|')}`);
    if (c.platforms != null && !Array.isArray(c.platforms)) errors.push(`${p}.platforms must be an array of platform ids`);
    else if (Array.isArray(c.platforms)) {
      if (!c.platforms.length) errors.push(`${p}.platforms must be a non-empty array of platform ids`);
      else for (const pl of c.platforms) if (!PLATFORMS.includes(pl)) warnings.push(`${p}: mapping unknown platform '${pl}' to the generic creator profile`);
    }
  });
  return { errors, warnings };
}

/** Per-clip durations + their total, for plan printing (null = structurally invalid clip). */
export function planDurations(clips) {
  const durations = (clips || []).map((c) => {
    const s = Number(c && c.start); const e = Number(c && c.end);
    return Number.isFinite(s) && Number.isFinite(e) && e > s ? +(e - s).toFixed(3) : null;
  });
  const total = +durations.filter((d) => d != null).reduce((a, b) => a + b, 0).toFixed(3);
  return { durations, total };
}

// ---------------------------------------------------------------- platform specs (single source of truth)

/** Universal container baseline every platform in the table shares (synthesis of the
 * compiled research): H.264 video in yuv420p, AAC audio (48 kHz recommended), MP4 with
 * the moov box at the front (faststart), even (divisible-by-2) dimensions. */
export const PLATFORM_CODEC = { video: 'h264', pixFmt: 'yuv420p', audio: 'aac', sampleRateRecHz: 48000, faststart: true };

/**
 * PLATFORM_SPECS is the SINGLE SOURCE OF TRUTH for per-platform facts. Both the export
 * warnings (platformWarnings) and the `check` subcommand (buildCheckRows) read this
 * table — never copy a number or a hedge out of it into other code. Duration entries
 * carry:
 *   cap              — the `check` FAIL threshold in seconds (null = no practical cap)
 *   mark             — honesty mark: 'verified' | 'community' | 'guidance'
 *   warnFrom / warnInclusive / warnText — the export-warning threshold + exact hedged
 *                      wording (verified caps stated as fact, community-reported
 *                      limits hedged as unverified; tiktok only warns from 570s — the
 *                      3-min figure for it was never verified, standard uploads allow
 *                      up to ~10 min).
 * Aspects are matched with a 0.02 ratio tolerance (same as platformWarnings).
 */
export const PLATFORM_SPECS = {
  youtube: {
    aspects: { accepted: [16 / 9, 1, 9 / 16], vertical: false },
    duration: { cap: null, mark: 'verified', note: '256 GB / 12 h account cap (verified) — no practical limit for clip work' },
    sizeCapBytes: null,
  },
  shorts: {
    aspects: { accepted: [9 / 16], vertical: true },
    duration: {
      cap: 180, mark: 'verified', warnFrom: 180, warnInclusive: false,
      warnText: (d) => `duration ${fmt(d)}s exceeds the 3-minute YouTube Shorts cap (verified)`,
    },
    resolution: { maxShortSide: 1080, mark: 'verified' },
    sizeCapBytes: null,
  },
  tiktok: {
    aspects: { accepted: [9 / 16], vertical: true },
    duration: {
      cap: 600, mark: 'community', warnFrom: 570, warnInclusive: true,
      warnText: (d) => `duration ${fmt(d)}s may exceed community-reported TikTok upload limits (unverified; standard uploads allow up to ~10 min)`,
    },
    resolution: { maxShortSide: 1080, mark: 'community', note: 'informational: 4K uploads get compressed to 1080p (community-reported); 1080p recommended' },
    sizeCapBytes: null,
  },
  reels: {
    aspects: { accepted: [9 / 16], vertical: true },
    duration: {
      cap: 180, mark: 'community', warnFrom: 180, warnInclusive: false,
      warnText: (d) => `duration ${fmt(d)}s may exceed the community-reported 3-minute Reels limit (unverified)`,
    },
    sizeCapBytes: 4 * 1024 * 1024 * 1024, sizeMark: 'community',
  },
  x: {
    aspects: { accepted: [16 / 9, 1, 9 / 16], vertical: false },
    duration: {
      cap: 140, mark: 'community', warnFrom: 140, warnInclusive: false,
      warnText: (d) => `duration ${fmt(d)}s may exceed the community-reported 140s X free-tier limit (unverified; Premium allows up to 4h)`,
    },
    resolution: { maxShortSide: 1080, mark: 'community' },
    sizeCapBytes: 512 * 1024 * 1024, sizeMark: 'community',
  },
  creator: {
    aspects: { accepted: [9 / 16], vertical: true },
    duration: {
      cap: 90, mark: 'guidance', warnFrom: 90, warnInclusive: false,
      warnText: (d) => `duration ${fmt(d)}s exceeds the 60–90s generic creator-platform guidance`,
    },
    sizeCapBytes: null,
  },
};

/** Platform spec warnings from the shared table (duration caps, vertical aspect). */
export function platformWarnings(platform, durationS, dims = {}, variant = 'original') {
  const w = [];
  const d = Number(durationS);
  if (!PLATFORMS.includes(platform)) return w;
  const spec = PLATFORM_SPECS[platform] || {};
  const rule = spec.duration || {};
  if (rule.warnText && Number.isFinite(d) && (rule.warnInclusive ? d >= rule.warnFrom : d > rule.warnFrom)) w.push(rule.warnText(d));
  if (spec.aspects && spec.aspects.vertical) {
    const wd = Number(dims.width); const ht = Number(dims.height);
    if (Number.isFinite(wd) && Number.isFinite(ht) && wd > 0 && ht > 0) {
      const ar = wd / ht;
      if (Math.abs(ar - 9 / 16) > 0.02) w.push(`output is ${wd}x${ht} (~${ar.toFixed(3)}:1), not 9:16 — ${platform} expects vertical 1080x1920 (use --variant 9x16-crop or 9x16-blur)`);
    }
  }
  return w;
}

// ---------------------------------------------------------------- tighten / check (pure)

/**
 * Keep-span builder for `tighten` (silence removal), pure. Each silence [start, end]
 * (end null = silent to EOF) becomes a removal [start+margin, end-margin]: `margin`
 * seconds of silence stay attached to the speech on each side so the joins sound
 * natural. A silence fully eaten by its margins removes nothing. Removals are merged,
 * then kept spans shorter than `minKeep` are dropped (swallowed by their neighboring
 * removals). Returns { keep: [[a,b],...] ascending, cuts: removal count,
 * removedS: seconds removed } over [0, duration].
 */
export function buildKeepSpans(duration, silences, { margin = TIGHTEN_DEFAULTS.marginS, minKeep = TIGHTEN_DEFAULTS.minKeepS } = {}) {
  const dur = Number(duration) || 0;
  const clamp = (x) => Math.max(0, Math.min(dur, x));
  const removals = [];
  for (const s of silences || []) {
    if (!s) continue;
    const st = Number(s.start);
    const en = s.end == null ? dur : Number(s.end);
    if (!Number.isFinite(st) || !Number.isFinite(en) || en <= st) continue;
    const a = clamp(st + margin);
    const b = clamp(en - margin);
    if (b > a) removals.push([a, b]);
  }
  removals.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged = [];
  for (const r of removals) {
    if (merged.length && r[0] <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  let keep = [];
  let t = 0;
  for (const [a, b] of merged) { if (a > t) keep.push([t, a]); t = Math.max(t, b); }
  if (t < dur) keep.push([t, dur]);
  keep = keep.filter((k) => k[1] - k[0] >= minKeep);
  const keptS = keep.reduce((a, k) => a + (k[1] - k[0]), 0);
  const cuts = Math.max(0, keep.length - 1)
    + (keep.length && keep[0][0] > 1e-9 ? 1 : 0)
    + (keep.length && keep[keep.length - 1][1] < dur - 1e-9 ? 1 : 0);
  return { keep, cuts, removedS: +Math.max(0, dur - keptS).toFixed(3) };
}

/** Suggested silencedetect threshold when no silence was found: track mean level + 6 dB,
 * capped at -5 dB (never suggest anything near full scale). null when the mean is unknown. */
export function suggestThreshold(meanDb) {
  if (meanDb == null) return null;
  const m = Number(meanDb);
  if (!Number.isFinite(m)) return null;
  return +Math.min(m + 6, -5).toFixed(1);
}

/**
 * Build the `check` compliance rows from measured facts (pure — feeds the report and the
 * selftests). Null facts fields are UNMEASURABLE: they become WARN "could not measure",
 * never PASS. Row kinds: "judgement" (duration, aspect, loudness — platform-dependent
 * taste) and "format" (objective container facts). Judgement rows FAIL only with a
 * --platform; without one they are evaluated against the generic creator profile (the
 * open-list default) and downgrade to WARN. Format rows enforce in both modes.
 * Each non-PASS row carries a plain `reason` and, when a real fix exists, a `fix`
 * naming the exact clipcut command.
 */
export function buildCheckRows(facts, { platform = null } = {}) {
  const f = facts || {};
  const spec = platform && PLATFORM_SPECS[platform] ? PLATFORM_SPECS[platform] : null;
  const eff = spec || PLATFORM_SPECS.creator; // open-list default: generic creator profile
  const downgrade = !platform;                // judgement FAIL -> WARN without --platform
  const fin = (x) => { const n = x == null ? NaN : Number(x); return Number.isFinite(n) ? n : null; }; // Number(null) is 0 — never let null look measured
  const rows = [];
  const add = (check, kind, status, extra = {}) => {
    const row = { check, kind, status };
    if (extra.reason) row.reason = extra.reason;
    if (extra.fix) row.fix = extra.fix;
    if (extra.note) row.note = extra.note;
    rows.push(row);
  };
  const unmeasurable = (check, kind, why) => add(check, kind, 'WARN', { reason: `could not measure (${why})` });
  const judge = (check, status, extra = {}) => add(check, 'judgement', downgrade && status === 'FAIL' ? 'WARN' : status, extra);
  const fixExport = (variant, tail = '') => `clipcut export ${f.file || '<file>'} --platform ${platform || 'creator'} --variant ${variant}${tail}`;
  const arName = (r) => (Math.abs(r - 9 / 16) < 1e-9 ? '9:16' : Math.abs(r - 16 / 9) < 1e-9 ? '16:9' : '1:1');

  // duration — judgement.
  if (fin(f.duration) == null || !(fin(f.duration) > 0)) {
    unmeasurable('duration', 'judgement', 'ffprobe reported no duration');
  } else {
    const d = fin(f.duration);
    const rule = eff.duration || {};
    const over = rule.cap != null && d > rule.cap;
    const inWarnZone = !over && rule.warnFrom != null && rule.cap != null && rule.warnFrom < rule.cap
      && (rule.warnInclusive ? d >= rule.warnFrom : d > rule.warnFrom);
    // Only VERIFIED caps hard-FAIL: a cap the platform table itself marks
    // community/guidance is reported loudly but never blocks delivery on its own.
    if (over) judge('duration', rule.mark === 'verified' ? 'FAIL' : 'WARN', {
      reason: rule.warnText(d),
      note: `${fmt(d)}s vs the ${rule.cap}s ${platform || 'creator'} cap (${rule.mark}${rule.mark === 'verified' ? '' : ' — reported, not enforced'})`,
      fix: `clipcut cut <source> --plan clips.json (shorten this clip's end — duration is set by the plan)`,
    });
    else if (inWarnZone) judge('duration', 'WARN', { reason: rule.warnText(d), note: `${fmt(d)}s vs the conservative ${rule.warnFrom}s warn threshold` });
    else judge('duration', 'PASS', { note: `${fmt(d)}s${rule.cap != null ? ` (cap ${rule.cap}s, ${rule.mark})` : rule.note ? ` — ${rule.note}` : ''}` });
  }

  // aspect — judgement. width/height are DISPLAY dims (rotation metadata already
  // applied by the probe), so a rotated file is judged by what it shows, not by its
  // coded storage order; a swap is noted so the row explains itself.
  if (fin(f.width) == null || fin(f.height) == null || !(fin(f.width) > 0)) {
    unmeasurable('aspect', 'judgement', 'ffprobe reported no dimensions');
  } else {
    const wd = fin(f.width); const ht = fin(f.height);
    const ar = wd / ht;
    const want = (eff.aspects.accepted || []).map(arName).join(' or ');
    const rotDeg = fin(f.rotation);
    const rotNote = rotDeg != null && Math.abs(rotDeg) % 180 === 90
      ? ` — displays ${wd}x${ht} after rotation metadata (${fmt(rotDeg)}deg)`
      : '';
    if ((eff.aspects.accepted || []).some((r) => Math.abs(ar - r) <= 0.02)) judge('aspect', 'PASS', { note: `${wd}x${ht} (~${ar.toFixed(3)}:1) matches ${want}${rotNote}` });
    else judge('aspect', 'FAIL', {
      reason: `output is ${wd}x${ht} (~${ar.toFixed(3)}:1), not ${want}${platform ? ` — ${platform} expects ${eff.aspects.vertical ? 'vertical 9:16 1080x1920' : want}` : ' — the generic creator profile expects vertical 9:16'}${rotNote}`,
      fix: eff.aspects.vertical ? fixExport('9x16-crop') : undefined,
    });
  }

  // resolution — format: divisible-by-2 (H.264 4:2:0 needs even dimensions).
  if (fin(f.width) == null || fin(f.height) == null || !(fin(f.width) > 0)) unmeasurable('resolution', 'format', 'ffprobe reported no dimensions');
  else if (f.width % 2 !== 0 || f.height % 2 !== 0) add('resolution', 'format', 'FAIL', { reason: `dimensions ${f.width}x${f.height} are not divisible by 2 — H.264 4:2:0 encoding needs even numbers`, fix: fixExport('original') });
  else add('resolution', 'format', 'PASS', { note: `${f.width}x${f.height}, both divisible by 2` });

  // resolution cap — judgement, informational WARN only (never a hard gate): the
  // short side exceeds the max the platform's specs row itself marks.
  if (eff.resolution && eff.resolution.maxShortSide != null && fin(f.width) != null && fin(f.height) != null && fin(f.width) > 0) {
    const shortSide = Math.min(f.width, f.height);
    const cap = eff.resolution.maxShortSide;
    if (shortSide > cap) judge('resolution_cap', 'WARN', {
      reason: `short side ${shortSide}px exceeds the ${cap}px max the ${platform || 'creator'} row marks (${eff.resolution.mark}${eff.resolution.mark === 'verified' ? '' : '-reported, unverified'})${eff.resolution.note ? ` — ${eff.resolution.note}` : ''}`,
      note: 'informational — platforms accept or recompress larger files; no hard gate',
    });
  }

  // fps + VFR/CFR — format (VFR is a compatibility hazard, not a hard reject).
  if (fin(f.fps) == null || !(fin(f.fps) > 0)) unmeasurable('fps', 'format', 'ffprobe reported no frame rate');
  else if (f.vfr) add('fps', 'format', 'WARN', { reason: `variable frame rate suspected (r_frame_rate vs avg_frame_rate differ by > 0.5 fps around ${fmt(f.fps)}fps) — players may judder; a re-encode makes it CFR`, fix: `clipcut cut <source> --plan clips.json --mode accurate, or ${fixExport('9x16-crop')}` });
  else add('fps', 'format', 'PASS', { note: `${fmt(f.fps)}fps, constant (CFR)` });

  // codec / pix_fmt — format: the shared H.264 + yuv420p baseline.
  if (!f.videoCodec) unmeasurable('codec', 'format', 'ffprobe reported no video codec');
  else if (f.videoCodec !== PLATFORM_CODEC.video) add('codec', 'format', 'FAIL', { reason: `video codec ${f.videoCodec} — the platform baseline is ${PLATFORM_CODEC.video} (H.264)`, fix: fixExport('original') });
  else add('codec', 'format', 'PASS', { note: `${PLATFORM_CODEC.video} (${f.videoCodec})` });

  if (!f.pixFmt) unmeasurable('pix_fmt', 'format', 'ffprobe reported no pixel format');
  else if (f.pixFmt !== PLATFORM_CODEC.pixFmt) add('pix_fmt', 'format', 'FAIL', { reason: `pixel format ${f.pixFmt} — the platform baseline is ${PLATFORM_CODEC.pixFmt} (most web/mobile players show nothing else)`, fix: fixExport('original') });
  else add('pix_fmt', 'format', 'PASS', { note: `${PLATFORM_CODEC.pixFmt}` });

  // audio presence / codec / sample rate — format. No audio stream = unmeasurable WARN
  // (platforms accept silent video; it is not a compliance failure).
  if (!f.hasAudio) {
    unmeasurable('audio', 'format', 'no audio stream');
    unmeasurable('audio_sample_rate', 'format', 'no audio stream');
    unmeasurable('loudness', 'judgement', 'no audio stream');
    unmeasurable('silent_audio', 'format', 'no audio stream');
  } else {
    if (!f.audioCodec) unmeasurable('audio', 'format', 'audio stream present but codec not reported');
    else if (f.audioCodec !== PLATFORM_CODEC.audio) add('audio', 'format', 'WARN', { reason: `audio codec ${f.audioCodec}, not ${PLATFORM_CODEC.audio} (AAC) — re-encoding the audio is the safe route`, fix: fixExport('original', ' --loudnorm') });
    else add('audio', 'format', 'PASS', { note: `${PLATFORM_CODEC.audio} audio present` });
    if (fin(f.audioSampleRate) == null) unmeasurable('audio_sample_rate', 'format', 'sample rate not reported');
    else if (f.audioSampleRate === PLATFORM_CODEC.sampleRateRecHz) add('audio_sample_rate', 'format', 'PASS', { note: `${f.audioSampleRate} Hz (recommended)` });
    else if (f.audioSampleRate === 44100) add('audio_sample_rate', 'format', 'PASS', { note: '44100 Hz (widely accepted; 48000 Hz is the recommendation)' });
    else add('audio_sample_rate', 'format', 'WARN', { reason: `audio sample rate ${f.audioSampleRate} Hz is unusual — ${PLATFORM_CODEC.sampleRateRecHz} Hz recommended` });

    // loudness — judgement, measure-only (no platform documents -14 LUFS; it is a web norm).
    // FAIL only for clipping (TP > 0 dBTP) or an over-loud master (I above ~-2 LUFS);
    // the QUIET side is a WARN — no platform documents -14, and platforms turn loud
    // clips down, never up, so a quiet master is taste, not a defect.
    if (!f.loudness || !Number.isFinite(Number(f.loudness.I))) {
      unmeasurable('loudness', 'judgement', 'loudness measurement did not parse (silent or unreadable audio)');
    } else {
      const I = Number(f.loudness.I);
      const TP = f.loudness.TP != null && Number.isFinite(Number(f.loudness.TP)) ? Number(f.loudness.TP) : null;
      const devI = Math.abs(I - LOUDNORM_TARGET.I);
      const clipping = TP != null && TP > 0;
      const overLoud = I > -2;
      const quiet = I < LOUDNORM_TARGET.I - 6;
      const note = `I=${I} LUFS${TP != null ? `, true peak=${TP} dBTP` : ''} vs the -14 LUFS / -1.5 dBTP web target (measure-only)`;
      if (!clipping && !overLoud && devI <= 6 && (TP == null || TP <= -1)) judge('loudness', 'PASS', { note });
      else if (clipping || overLoud) {
        const why = [];
        if (overLoud) why.push(`integrated loudness ${I} LUFS is above -2 LUFS (over-loud master)`);
        if (clipping) why.push(`true peak ${TP} dBTP is above 0 dBTP (clipping)`);
        judge('loudness', 'FAIL', { reason: `${why.join('; ')} (measure-only judgement)`, fix: fixExport('original', ' --loudnorm') });
      } else {
        // WARN zone: quiet master, or a mild peak/loudness deviation — never a hard gate.
        let reason;
        if (quiet) reason = `integrated loudness ${I} LUFS is ${fmt(LOUDNORM_TARGET.I - I)} LU below -14 LUFS — no platform documents -14 (community norm); quiet master, consider export --loudnorm`;
        else if (TP != null && TP > -1) reason = `true peak ${TP} dBTP exceeds -1.5 dBTP (measure-only judgement)`;
        else reason = `integrated loudness ${I} LUFS is ${fmt(devI)} LU from -14 LUFS (measure-only judgement)`;
        judge('loudness', 'WARN', { reason, note, fix: fixExport('original', ' --loudnorm') });
      }
    }

    // silent audio — format: a dead track is a defect, not a style choice.
    if (f.silentAudio == null) unmeasurable('silent_audio', 'format', 'volumedetect did not report levels');
    else if (f.silentAudio) add('silent_audio', 'format', 'FAIL', { reason: `audio measures as digital silence (max level <= ${SILENT_MAX_DB} dBFS) — the audio track is dead` });
    else add('silent_audio', 'format', 'PASS', { note: `max level ${f.audioMaxDb != null ? `${f.audioMaxDb} dBFS` : `above ${SILENT_MAX_DB} dBFS`}` });
  }

  // faststart — format: moov-box walk.
  if (f.faststart === true) add('faststart', 'format', 'PASS', { note: 'moov box before mdat (faststart)' });
  else if (f.faststart === false) add('faststart', 'format', 'FAIL', { reason: 'moov box is not at the front (no faststart) — players must buffer the whole file before playback starts', fix: fixExport('original') });
  else unmeasurable('faststart', 'format', 'not an MP4/MOV-family container (the moov-box walk does not apply)');

  // size — format, only where the table carries a cap (community-reported): WARN, not FAIL.
  // A cap with an unmeasurable size is a WARN like every other unmeasurable fact —
  // never a silently absent row.
  if (eff.sizeCapBytes != null) {
    if (fin(f.sizeBytes) == null) unmeasurable('size', 'format', 'size unknown');
    else {
      const mib = f.sizeBytes / 1024 / 1024;
      const capMib = eff.sizeCapBytes / 1024 / 1024;
      if (f.sizeBytes > eff.sizeCapBytes) add('size', 'format', 'WARN', { reason: `file is ${mib.toFixed(1)} MiB, over the ~${capMib.toFixed(0)} MiB ${platform || 'creator'} cap (${eff.sizeMark}-reported)` });
      else add('size', 'format', 'PASS', { note: `${mib.toFixed(1)} MiB (cap ~${capMib.toFixed(0)} MiB, ${eff.sizeMark}-reported)` });
    }
  }
  return rows;
}

/** True when the mp4 top-level box order is moov-before-mdat (faststart). */
export function hasFaststart(file) {
  let fd;
  try { fd = fs.openSync(file, 'r'); } catch { return false; }
  try {
    let off = 0;
    const hdr = Buffer.alloc(8);
    for (let i = 0; i < 16; i++) {
      const { bytesRead } = fs.readSync(fd, hdr, 0, 8, off);
      if (bytesRead < 8) return false;
      const size = hdr.readUInt32BE(0);
      const type = hdr.subarray(4, 8).toString('latin1');
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      if (size < 8) return false;
      off += size;
    }
    return false;
  } finally { fs.closeSync(fd); }
}

const evenDims = (w, h) => Number.isFinite(w) && Number.isFinite(h) && w % 2 === 0 && h % 2 === 0;

/**
 * Bounded 9:16 crop window for ANY source aspect — the math behind
 * crop='min(iw,ih*9/16)':'min(ih,iw*16/9)': the window never exceeds the frame in either
 * dimension, so scale=1080:1920 always fills. Portrait/taller-than-9:16 sources crop width
 * from iw (the old crop=ih*9/16:ih asked for a WIDER window than the frame and failed).
 */
export function cropTarget(w, h) {
  const wd = Number(w); const ht = Number(h);
  if (!Number.isFinite(wd) || !Number.isFinite(ht) || wd <= 0 || ht <= 0) return { width: null, height: null };
  return { width: Math.min(wd, (ht * 9) / 16), height: Math.min(ht, (wd * 16) / 9) };
}

/**
 * Validated crop anchor: a fraction in [0,1] of the leftover region (0 = flush with
 * the left/top edge, 1 = flush with the right/bottom edge, 0.5 = centered). Clean
 * UserError on anything else — mirrors numFlag's error shape.
 */
export function cropAnchor(raw, name, dflt = 0.5) {
  if (raw == null || raw === true) return dflt;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new UserError(`--${name} must be a number between 0 and 1 (fraction of the leftover region; 0 = left/top edge, 1 = right/bottom edge). Got: ${raw}`);
  return n;
}

/**
 * The 9x16-crop -vf chain, optionally ANCHORED: the bounded crop window is positioned
 * by crop-x/crop-y fractions of the leftover width/height:
 *   x = (iw - out_w) * ax,  y = (ih - out_h) * ay
 * REGRESSION GUARD (selftested as exact string equality): with both anchors at the
 * 0.5 default the returned string is BYTE-IDENTICAL to the historical center-crop
 * filter — the 2-argument crop — so default runs are provably unchanged. Non-default
 * anchors emit the 4-argument crop with the computed x/y expressions.
 */
export function cropAnchorFilter(ax = 0.5, ay = 0.5) {
  const W = "'min(iw,ih*9/16)'";
  const H = "'min(ih,iw*16/9)'";
  const atDefault = (x) => Number.isFinite(Number(x)) && Math.abs(Number(x) - 0.5) < 1e-9;
  const f = (x) => String(+(+x).toFixed(4));
  if (atDefault(ax) && atDefault(ay)) {
    return `crop=${W}:${H},scale=1080:1920,setsar=1`;
  }
  // 4-argument crop: x/y as a fraction of the leftover region. A default anchor is
  // expressed the same way (fraction 0.5) — (iw-out_w)*0.5 IS the centered position.
  const X = `(iw-min(iw,ih*9/16))*${f(ax)}`;
  const Y = `(ih-min(ih,iw*16/9))*${f(ay)}`;
  return `crop=${W}:${H}:'${X}':'${Y}',scale=1080:1920,setsar=1`;
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
  if (!c.accountId || !c.token) throw new UserError('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required (process env, ./.env or ~/.clefcut/.env). Run "clipcut.mjs doctor".');
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
      throw new UserError(redact(`${modelFull}: daily neuron quota exhausted — resets 00:00 UTC (HTTP 429, code 3036). Retrying cannot help; request rejected before processing — nothing was charged.`));
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
 * isolated)` fires once per actual request with the image files that request covered.
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
 * GATE_MAX_IMAGES images require --yes (or CLEFCUT_YES=1). The gate counts IMAGES sent.
 */
function preflightGate(files, dims, { model, size, yes, extraRequests = 0 }) {
  const n = files.length;
  const per = estTokensPerFrame(dims.width, dims.height);
  const requests = Math.ceil(n / Math.max(1, size)) + extraRequests;
  const cost = (n * per * (PRICES[model] ?? 0)) / 1e6;
  console.log(`${n} images → ~${requests} request(s) (batch ≤${size} image(s)) ≈ $${cost.toFixed(4)} input-token estimate at ${model} price (~${per} tokens/image at ${dims.width || '?'}px) (excludes any auto-isolation re-sends)`);
  if (n > GATE_MAX_IMAGES && !yes) {
    throw new UserError(`${n} images is over the ${GATE_MAX_IMAGES}-image comfort limit (estimate above). Pass --yes (or set CLEFCUT_YES=1) to proceed anyway.`);
  }
}

function toDataUri(p) {
  const buf = fs.readFileSync(p);
  if (buf.length > MAX_IMAGE_BYTES) throw new UserError(`${path.basename(p)} is over 4 MiB — regenerate the sheet smaller (or fewer frames per sheet).`);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// ---------------------------------------------------------------- questions schema (identical to sibling)

export function validateQuestions(spec) {
  const bad = (m) => new UserError(`questions.json invalid: ${m} Schema: {"questions": {"<id>": {"type": "noul"|"choice"|"score", "instructions": "...", "criteria": ...}}, "pass": {"<id>": number in (0,1]}, "escalate_margin": 0.3, "severity": {...}, "escalate_only": [...]}`);
  if (!spec || typeof spec !== 'object' || !spec.questions || !Object.keys(spec.questions).length) throw bad('needs a non-empty "questions" object.');
  if (Object.keys(spec.questions).length > 64) throw bad(`too many questions (${Object.keys(spec.questions).length}) — the API allows at most 64.`);
  for (const [id, q] of Object.entries(spec.questions)) {
    if (!['noul', 'choice', 'score'].includes(q.type)) throw bad(`question "${id}": type must be noul, choice or score.`);
    if (!q.instructions) throw bad(`question "${id}": instructions is required.`);
    if (q.type === 'choice') {
      if (typeof q.criteria !== 'object' || Array.isArray(q.criteria) || !q.criteria) throw bad(`question "${id}": choice needs criteria as an OBJECT of option -> description.`);
      const nOpts = Object.keys(q.criteria).length;
      if (nOpts < 2 || nOpts > 255) throw bad(`question "${id}": choice needs 2-255 options (got ${nOpts}).`);
    }
    if (q.type === 'score') {
      if (!Array.isArray(q.criteria) || q.criteria.length < 2) throw bad(`question "${id}": score needs criteria as an ordered ARRAY (worst last), 2-10 levels.`);
      if (q.criteria.length > 10) throw bad(`question "${id}": score criteria allows at most 10 levels (got ${q.criteria.length}).`);
    }
  }
  const pass = spec.pass && typeof spec.pass === 'object' ? spec.pass : {};
  const esc = new Set(Array.isArray(spec.escalate_only) ? spec.escalate_only : []);
  const missing = Object.keys(spec.questions).filter((id) => {
    const t = pass[id];
    return !(esc.has(id) || (typeof t === 'number' && Number.isFinite(t) && t > 0 && t <= 1));
  });
  if (missing.length) throw new UserError(`questions.json invalid: every question id needs a numeric "pass" in (0,1] or a spot in "escalate_only" — missing for: ${missing.join(', ')}.`);
}

// ---------------------------------------------------------------- local OCR (free)

async function localOcrKind() {
  try { createRequire(path.join(process.cwd(), 'package.json')).resolve('tesseract.js'); return 'tesseract.js'; } catch { /* not installed */ }
  try { if ((await runExe('tesseract', ['--version'])).code === 0) return 'system-tesseract'; } catch { /* not on PATH */ }
  return null;
}

/** OCR a list of images with the chosen local engine; rows keyed by `id`. */
async function ocrImages(kind, files) {
  const rows = [];
  // leptonica (used by both engines) rejects symlinked dirs like /tmp on macOS: pass real paths.
  const realPath = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
  if (kind === 'tesseract.js') {
    const T = createRequire(path.join(process.cwd(), 'package.json'))('tesseract.js');
    const worker = await T.createWorker('eng');
    try {
      for (const f of files) {
        const { data } = await worker.recognize(realPath(f.path));
        rows.push({ segment: f.id, file: f.file, engine: 'tesseract.js', text: (data.text || '').trim(), confidence: typeof data.confidence === 'number' ? data.confidence : null });
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
    rows.push({ segment: f.id, file: f.file, engine: 'system-tesseract', text: words.map((c) => c[11].trim()).join(' '), confidence: confs.length ? +(confs.reduce((a, b) => a + b, 0) / confs.length).toFixed(1) : null });
  }
  return rows;
}

// ---------------------------------------------------------------- shared ffmpeg helpers

/** Hidden temp-sibling name for an atomic output: `.<stem>.tmp-<rand><ext>` in the same
 * dir (same filesystem, so renameSync is atomic). The media extension STAYS on the name —
 * ffmpeg picks its muxer from the output extension. */
export function tempSiblingName(name, rand = Math.random().toString(36).slice(2, 10)) {
  const base = path.basename(String(name));
  const ext = path.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `.${stem}.tmp-${rand}${ext}`;
}

/** Matches the temp-sibling names atomicMediaWrite leaves behind on a crash. */
const TEMP_OUTPUT_RE = /^\..+\.tmp-[a-z0-9]+(?:\.[A-Za-z0-9]+)?$/;

/**
 * Atomic media write: `run(tmp)` encodes into a hidden temp sibling, `verify(tmp)`
 * probes it (duration read, faststart box walk, ...) and only then is the temp
 * renameSync'd onto `finalPath`. On ANY failure the temp is removed and a pre-existing
 * final file is left untouched — a failed or truncated encode can never replace good
 * output with a broken file.
 */
async function atomicMediaWrite(finalPath, run, verify) {
  const dir = path.dirname(finalPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, tempSiblingName(finalPath));
  try {
    await run(tmp);
    await verify(tmp);
    fs.renameSync(tmp, finalPath);
  } catch (e) {
    fs.rmSync(tmp, { force: true, recursive: true });
    throw e;
  }
}

/** Managed output dir: every existing entry must be tool-created (isManaged); those are cleared. */
function prepareManagedDir(dir, isManaged, what) {
  if (fs.existsSync(dir)) {
    if (!fs.statSync(dir).isDirectory()) throw new UserError(`output path exists and is not a directory: ${dir}`);
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (!isManaged(e)) throw new UserError(`output dir has unrelated files; choose a fresh --out (found "${e}" in ${dir})`);
    }
    for (const e of entries) fs.rmSync(path.join(dir, e), { force: true, recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Managed output dir that refuses unrelated files but clears ONLY `removeNames` — other
 * managed files from earlier runs survive, so re-running one clip/slug in the same dir
 * works without destroying its siblings. Stale atomic-write temps (`.name.tmp-<rand>`
 * from a crashed run) are always removed: they are this tool's own litter.
 */
function prepareManagedDirKeep(dir, isManaged, removeNames) {
  if (fs.existsSync(dir)) {
    if (!fs.statSync(dir).isDirectory()) throw new UserError(`output path exists and is not a directory: ${dir}`);
    for (const e of fs.readdirSync(dir)) {
      if (!isManaged(e) && !TEMP_OUTPUT_RE.test(e)) throw new UserError(`output dir has unrelated files; choose a fresh --out (found "${e}" in ${dir})`);
    }
    for (const e of fs.readdirSync(dir)) if (TEMP_OUTPUT_RE.test(e)) fs.rmSync(path.join(dir, e), { force: true });
    for (const n of removeNames) fs.rmSync(path.join(dir, n), { force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Contact sheet PNG for [start, end]: `frames` evenly-spaced stills (offset +0.5 cell so
 * cells are cell-midpoints), scale ~480 px wide, tiled in reading order. Manual
 * extract+tile so the cell count is exact regardless of source fps.
 */
async function contactSheet(video, { start, end, frames = 6, outPng, width = 480 }) {
  const dur = Math.max(0, end - start);
  const cols = frames <= 4 ? 2 : 3;
  const rows = Math.ceil(frames / cols);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipcut-sheet-'));
  try {
    for (let i = 1; i <= frames; i++) {
      const ts = Math.max(start, Math.min(end - 0.05, start + ((i - 0.5) * dur) / frames));
      const fp = path.join(tmp, `f${i}.png`);
      const r = await runFf('ffmpeg', ['-v', 'error', '-y', '-ss', fmt(ts), '-i', video, '-frames:v', '1', '-vf', `scale=${width}:-2`, fp]);
      if (r.code !== 0 || !fs.existsSync(fp)) throw new UserError(`sheet frame extraction failed at ${fmt(ts)}s: ${r.stderr.trim().slice(0, 200)}`);
    }
    const rt = await runFf('ffmpeg', ['-v', 'error', '-y', '-start_number', '1', '-i', path.join(tmp, 'f%d.png'), '-vf', `tile=${cols}x${rows}`, '-frames:v', '1', outPng]);
    if (rt.code !== 0) throw new UserError(`contact sheet tiling failed: ${rt.stderr.trim().slice(0, 200)}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

/** Read a duration off a media file (format.duration). */
async function durationOf(file) {
  const r = await runFf('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file]);
  if (r.code !== 0) throw new UserError(`ffprobe failed on ${file}: ${r.stderr.trim().slice(0, 200)}`);
  const d = Number(JSON.parse(r.stdout.toString()).format?.duration);
  if (!Number.isFinite(d) || d <= 0) throw new UserError(`Could not read a duration from ${file}.`);
  return d;
}

/** Load segments.json: { segments, video, duration } — "segments" records video+duration so
 * later steps (sheets/read) can warn when handed a different video. */
function loadSegmentsDoc(p) {
  let j;
  try { j = readJson(p); } catch { throw new UserError(`segments file is not valid JSON: ${p}`); }
  const segs = Array.isArray(j) ? j : (j && Array.isArray(j.segments) ? j.segments : null);
  if (!segs || !segs.length) throw new UserError(`${p} has no segments — run "clipcut.mjs segments <probe.json>" first.`);
  for (const s of segs) {
    if (s == null || !Number.isFinite(Number(s.start)) || !Number.isFinite(Number(s.end)) || Number(s.end) <= Number(s.start)) {
      throw new UserError(`${p} has a segment without numeric start < end: ${JSON.stringify(s).slice(0, 120)}`);
    }
  }
  return {
    segments: segs.map((s, i) => ({ id: s.id || `seg_${String(i + 1).padStart(3, '0')}`, start: Number(s.start), end: Number(s.end) })),
    video: j && typeof j.video === 'string' ? j.video : null,
    duration: j && Number.isFinite(Number(j.duration)) ? Number(j.duration) : null,
  };
}

/** Warn when a derived-from-a-video JSON is used against a different video (path or >1s duration). */
function sameVideoPath(a, b) {
  // realpath both so symlinked dirs (/tmp vs /private/tmp on macOS) don't fire spurious warnings
  const r = (p) => { try { return fs.realpathSync(path.resolve(p)); } catch { return path.resolve(p); } };
  return r(a) === r(b);
}
function warnSourceMismatch(what, derivedVideo, derivedDuration, video, actualDuration) {
  if (derivedVideo && !sameVideoPath(derivedVideo, video)) {
    console.log(`warning: ${what} was built for ${derivedVideo} but got ${path.resolve(video)}`);
  }
  if (derivedDuration != null && Number.isFinite(actualDuration) && Math.abs(derivedDuration - actualDuration) > 1) {
    console.log(`warning: ${what} says the source is ${fmt(derivedDuration)}s but ${path.resolve(video)} is ${fmt(actualDuration)}s (mismatch > 1s)`);
  }
}

/** Sheet list from the sheets.json manifest ONLY — never a PNG glob: a crashed sheets run
 * leaves partial PNGs behind, and rating half a set would look like a complete answer. */
function listSheets(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new UserError(`Sheets dir not found: ${dir}. Run "clipcut.mjs sheets" first.`);
  const mp = path.join(dir, 'sheets.json');
  if (!fs.existsSync(mp)) throw new UserError(`No sheets.json manifest in ${dir} — re-run "clipcut.mjs sheets" into this dir (a partial sheet set is never used).`);
  let manifest;
  try { manifest = readJson(mp); } catch { throw new UserError(`sheets.json in ${dir} is not valid JSON — re-run "clipcut.mjs sheets" into a fresh dir.`); }
  const listed = manifest && Array.isArray(manifest.sheets) ? manifest.sheets : [];
  if (!listed.length) throw new UserError(`sheets.json in ${dir} lists no sheets — re-run "clipcut.mjs sheets".`);
  const files = listed.map((s) => ({ id: s.id, path: path.join(dir, s.file), file: s.file }));
  for (const f of files) if (!fs.existsSync(f.path)) throw new UserError(`Sheet listed but missing on disk: ${f.path}`);
  const framesPer = Number(manifest.frames_per_sheet) || 6;
  return { files, framesPer };
}

// ---------------------------------------------------------------- commands: doctor

async function cmdDoctor(o) {
  const problems = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  console.log(`node                  : ${process.version} ${nodeMajor >= 18 ? 'ok' : 'TOO OLD (need 18+)'}`);
  if (nodeMajor < 18) problems.push('Node older than 18');
  const c = cfg();
  console.log(`CLOUDFLARE_ACCOUNT_ID : ${c.accountId ? `set (from ${envSource('CLOUDFLARE_ACCOUNT_ID')})` : 'missing'}`);
  console.log(`CLOUDFLARE_API_TOKEN  : ${c.token ? `set (from ${envSource('CLOUDFLARE_API_TOKEN')})` : 'missing'}`);
  if (!c.accountId) problems.push('CLOUDFLARE_ACCOUNT_ID missing (needed for rate, read --engine clairic and doctor --ping)');
  if (!c.token) problems.push('CLOUDFLARE_API_TOKEN missing (needed for rate, read --engine clairic and doctor --ping)');
  console.log(`ai gateway            : ${c.gateway ? `configured (${c.gateway})` : 'not configured (direct Workers AI)'}`);
  try {
    const t = await locate();
    if (t.version) console.log(`ffmpeg                : ${t.ffmpeg} (source: ${t.source}) — ${t.version}`);
    else { console.log(`ffmpeg                : FAILED to run (${t.ffmpeg})`); problems.push('no working ffmpeg (compositor packages and PATH all failed — run with CLEFCUT_FFMPEG set)'); }
  } catch (e) { console.log('ffmpeg                : NOT FOUND'); problems.push(`no ffmpeg: ${e.message}`); }
  const kind = await localOcrKind();
  console.log(`ocr tesseract.js      : ${kind === 'tesseract.js' ? 'yes (resolved from project node_modules; downloads English traineddata on first run)' : 'no'}`);
  console.log(`ocr system tesseract  : ${kind === 'system-tesseract' ? 'yes (on PATH)' : 'no'}`);
  if (o.ping) {
    if (!c.accountId || !c.token) { console.log('ping                  : skipped (credentials missing)'); problems.push('cannot ping without credentials'); }
    else {
      const t0 = Date.now();
      try {
        const r = await postAi('@cf/cloudflare/clef-flash', { model: 'clef-flash', state: 'Connectivity check.', questions: { ok: { type: 'noul', instructions: 'Is 2+2 equal to 4?' } } }, {});
        console.log(`ping                  : ok in ${Date.now() - t0}ms — p(yes)=${r && r.answers && r.answers.ok ? r.answers.ok.noul : '?'} tokens in=${r && r.usage ? r.usage.input_tokens : '?'} out=${r && r.usage ? r.usage.output_tokens : '?'}`);
      } catch (e) { console.log(`ping                  : FAILED — ${e.message}`); problems.push(`ping failed: ${e.message}`); }
    }
  }
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall checks ok');
  return problems.length ? 1 : 0;
}

// ---------------------------------------------------------------- commands: probe / segments

async function cmdProbe(video, o) {
  if (!fs.existsSync(video)) throw new UserError(`Video not found: ${video}`);
  const threshold = numFlag(o, 'scene-threshold', SCENE_THRESHOLD, { min: 0, max: 1 });
  const info = await probeContainer(video);
  // (a) scene scores — metadata=print writes EVERY frame to a temp FILE (the file= option):
  // stderr is capped in runExe, so a stderr pass silently drops the head of long videos
  // (~66 B/frame; a 60-min video needs ~7 MB). Parsing the file keeps full coverage.
  const sceneFile = path.join(os.tmpdir(), `clipcut-scenes-${process.pid}-${Date.now()}.txt`);
  let scenes = [];
  try {
    const rs = await runFf('ffmpeg', ['-v', 'error', '-i', video, '-an', '-vf', `select='gte(scene,0)',metadata=print:file=${escapeFilterPath(sceneFile)}`, '-f', 'null', '-']);
    if (rs.code !== 0) throw new UserError(`scene scan failed on ${video}: ${rs.stderr.trim().slice(0, 300)}`);
    scenes = parseSceneMetadata(readTextOrNull(sceneFile) || '');
  } finally { fs.rmSync(sceneFile, { force: true }); }
  const sceneChanges = sceneMaxima(scenes, threshold);
  // (b) silence map (audio only).
  let silences = [];
  if (info.hasAudio) {
    const rsi = await runFf('ffmpeg', ['-i', video, '-vn', '-af', SILENCE_FILTER, '-f', 'null', '-']);
    silences = parseSilences(rsi.stderr)
      .map((s) => (s.end == null && info.duration > s.start ? { ...s, end: +info.duration.toFixed(3) } : s))
      .map((s) => ({ start: +Number(s.start).toFixed(3), end: s.end == null ? null : +Number(s.end).toFixed(3), ...(s.duration != null ? { duration: +Number(s.duration).toFixed(3) } : {}) }));
  }
  // (c) loudness — loudnorm JSON first, ebur128 summary as fallback (whichever parses cleanly).
  let loudness = null;
  if (info.hasAudio) {
    const rl = await runFf('ffmpeg', ['-i', video, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
    loudness = parseLoudnormJson(rl.stderr);
    if (!loudness) {
      const re = await runFf('ffmpeg', ['-i', video, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
      loudness = parseEbur128(re.stderr);
    }
  }
  // (d) keyframes — video packets with the K flag. This prints to STDOUT and runExe never
  // caps stdout (~40 B/packet; a 60-min 30fps video is ~4 MB), so coverage is complete.
  const rk = await runFf('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_packets', '-show_entries', 'packet=pts_time,flags', video]);
  const keyframes = parseKeyframes(rk.stdout.toString());
  const probe = {
    video: path.resolve(video),
    duration: +info.duration.toFixed(3), fps: +info.fps.toFixed(3),
    width: info.width, height: info.height,
    ...(info.rotation != null ? { rotation: info.rotation } : {}),
    vfr: info.vfr, has_audio: info.hasAudio,
    fingerprint: fingerprintFile(video),
    scene_threshold: threshold,
    scenes, scene_changes: sceneChanges,
    silences, loudness, keyframes,
    generated_at: new Date().toISOString(),
  };
  const outPath = o.out || 'probe.json';
  fs.writeFileSync(outPath, JSON.stringify(probe, null, 2));
  console.log(`${path.basename(video)}: ${info.width}x${info.height} @ ${fmt(info.fps)}fps, ${fmt(info.duration)}s${info.rotated ? ` (rotation ${fmt(info.rotation)}deg metadata: coded ${info.codedWidth}x${info.codedHeight}, displays ${info.width}x${info.height})` : ''}${info.vfr ? ' (VFR suspected)' : ''}${info.hasAudio ? '' : ' (no audio)'}`);
  console.log(`scenes: ${scenes.length} scored frame(s) -> ${sceneChanges.length} change point(s) at threshold ${threshold}${sceneChanges.length ? ` (first: ${sceneChanges.slice(0, 5).map(fmt).join(', ')}${sceneChanges.length > 5 ? ', ...' : ''})` : ''}`);
  console.log(`silence: ${silences.length} region(s)${silences.length ? ` (longest ${(Math.max(...silences.map((s) => (s.end ?? info.duration) - s.start))).toFixed(1)}s)` : ''}${info.hasAudio ? '' : ' — skipped, no audio'}`);
  console.log(`loudness: ${loudness ? `I=${loudness.I} LUFS, true peak=${loudness.TP == null ? '?' : loudness.TP} dBTP` : 'unavailable'}${info.hasAudio ? '' : ' — skipped, no audio'}`);
  console.log(`keyframes: ${keyframes.length}${keyframes.length ? ` (first: ${keyframes.slice(0, 5).map(fmt).join(', ')}${keyframes.length > 5 ? ', ...' : ''})` : ''}`);
  console.log(`fingerprint: size ${probe.fingerprint.size} bytes, sha256(head:tail) ${probe.fingerprint.sha256_head_tail.slice(0, 24)}... — carry it into clips.json so cut can refuse a swapped file (--strict)`);
  console.log(`wrote ${outPath}`);
  return 0;
}

async function cmdSegments(probePath, o) {
  if (!probePath) throw new UserError('usage: clipcut.mjs segments <probe.json> [--min 15] [--max 90] [--count 10] [--even-split N] [--out segments.json]');
  let probe;
  try { probe = readJson(probePath); } catch { throw new UserError(`probe file is not valid JSON: ${probePath}`); }
  if (!probe || !Number.isFinite(Number(probe.duration))) throw new UserError(`${probePath} has no "duration" — re-run "clipcut.mjs probe <video>".`);
  const min = numFlag(o, 'min', 15, { min: 0.1 });
  const max = numFlag(o, 'max', 90, { min: 0.1 });
  const count = numFlag(o, 'count', 10, { min: 1, max: 1000 });
  if (min >= max) throw new UserError(`--min (${min}) must be smaller than --max (${max}).`);
  const duration = Number(probe.duration);
  const evenSplit = o['even-split'] != null ? numFlag(o, 'even-split', 2, { min: 1, max: 1000 }) : null;
  let segments = [];
  let notes = null;
  if (evenSplit) {
    segments = evenSplitSegments(duration, evenSplit, {
      sceneChanges: Array.isArray(probe.scene_changes) ? probe.scene_changes : [],
      silences: Array.isArray(probe.silences) ? probe.silences : [],
    }).map((s, i) => ({ id: `seg_${String(i + 1).padStart(3, '0')}`, rank: i + 1, ...s }));
    notes = [`mechanical: --even-split ${evenSplit} produced equal divisions of the video, not content-aware picks`];
  } else {
    const built = buildSegments(probe, { min, max, count });
    segments = built.segments;
    notes = built.notes || null;
    if (!segments.length && duration > max) {
      console.error(`no candidate segments: the video is ${fmt(duration)}s but no boundary-delimited piece fits [${min}, ${max}]s. Lower --min, re-run "clipcut.mjs probe" with a lower --scene-threshold to expose more cut points, or pass --even-split N for N equal mechanical segments.`);
      return 1;
    }
  }
  const doc = {
    probe: path.resolve(probePath), video: probe.video || null, duration: +duration.toFixed(3),
    // inherited so every downstream artifact carries the source's identity
    ...(probe.fingerprint ? { fingerprint: probe.fingerprint } : {}),
    min, max, count, generated_at: new Date().toISOString(),
    segments, ...(notes ? { notes } : {}),
  };
  const outPath = o.out || 'segments.json';
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2));
  console.log(`${segments.length} candidate segment(s) in [${min}, ${max}]s from ${path.basename(probePath)}${evenSplit ? ' (--even-split: mechanical)' : ''}:`);
  for (const s of segments) console.log(`  ${s.id}: ${fmt(s.start)}s-${fmt(s.end)}s (${fmt(s.duration)}s)${s.mechanical ? ' mechanical' : ` score=${s.score} scenes=${s.signals.scenes} silence_cut=${s.signals.silence_cut}`}`);
  console.log(`wrote ${outPath}`);
  return 0;
}

// ---------------------------------------------------------------- commands: sheets

async function cmdSheets(video, o) {
  if (!fs.existsSync(video)) throw new UserError(`Video not found: ${video}`);
  if (!o.segments) throw new UserError('--segments segments.json is required (run "clipcut.mjs segments" first).');
  const doc = loadSegmentsDoc(o.segments);
  const segments = doc.segments;
  const info = await probeContainer(video);
  warnSourceMismatch('the segments file', doc.video, doc.duration, video, info.duration);
  const frames = numFlag(o, 'frames', 6, { min: 1, max: 12 });
  const out = o.out || 'sheets';
  prepareManagedDir(out, (e) => /^seg_[A-Za-z0-9._-]*\.png$/.test(e) || e === 'sheets.json');
  const sheets = [];
  for (const seg of segments) {
    const file = `${seg.id}.png`;
    await contactSheet(video, { start: seg.start, end: seg.end, frames, outPng: path.join(out, file) });
    sheets.push({ id: seg.id, file, start: seg.start, end: seg.end, duration: +(seg.end - seg.start).toFixed(3) });
    console.log(`${file}: ${fmt(seg.start)}s-${fmt(seg.end)}s, ${frames} frames, tile ${frames <= 4 ? 2 : 3}x${Math.ceil(frames / (frames <= 4 ? 2 : 3))}`);
  }
  fs.writeFileSync(path.join(out, 'sheets.json'), JSON.stringify({
    video: path.resolve(video), frames_per_sheet: frames, sheet_width: 480,
    created_at: new Date().toISOString(), sheets,
  }, null, 2));
  console.log(`wrote ${path.join(out, 'sheets.json')} (${sheets.length} sheet(s))`);
  return 0;
}

// ---------------------------------------------------------------- commands: rate (CLEF)

async function cmdRate(o) {
  const sheetsDir = o.sheets || o._[1];
  if (!sheetsDir) throw new UserError('--sheets sheets/ is required (run "clipcut.mjs sheets" first).');
  if (!o.questions) throw new UserError('--questions questions.json is required. See --help for the schema.');
  let spec;
  try { spec = readJson(o.questions); } catch { throw new UserError(`--questions file is not valid JSON: ${o.questions}`); }
  validateQuestions(spec);
  const pass = spec.pass || {};
  const margin = typeof spec.escalate_margin === 'number' ? spec.escalate_margin : 0.3;
  const severity = spec.severity || {};
  const escalateOnly = new Set(spec.escalate_only || []);
  const model = o.model || 'clef-flash';
  if (!['clef', 'clef-flash', 'clef-omni'].includes(model)) throw new UserError('--model must be clef, clef-flash or clef-omni.');
  const size = imageBatchSize(o, 1); // one sheet per request by default: per-segment truth
  requireCreds(); // credentials BEFORE anything is read, gated or sent
  const { files, framesPer } = listSheets(sheetsDir);
  const state = RATE_STATE_TEMPLATE.replace('{N}', String(framesPer));
  const dims = await imageDims(files[0].path);
  preflightGate(files, dims, { model, size, yes: yesFlag(o) });

  const modelFull = `@cf/cloudflare/${model}`;
  const makeBody = (images) => ({ model, state, questions: spec.questions, images });
  const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
  const requestRows = [];
  const parts = []; // {files, result, isolated, needIsolate, superseded}
  const outPath = o.out || 'ratings.json';
  const worstOf = (result) => {
    let worst = 'pass';
    for (const [qid, q] of Object.entries(spec.questions)) {
      const cls = classifyAnswer(q, (result.answers || {})[qid] || null, pass[qid], margin, escalateOnly.has(qid));
      if (cls === 'fail') { worst = 'fail'; break; }
      if (cls === 'escalate') worst = 'escalate';
    }
    return worst;
  };
  const assemble = (complete, error = null) => {
    const segments = [];
    for (const p of parts) {
      if (p.superseded) continue;
      const answers = [];
      let worst = 'pass';
      for (const [qid, q] of Object.entries(spec.questions)) {
        const raw = (p.result.answers || {})[qid] || null;
        const cls = classifyAnswer(q, raw, pass[qid], margin, escalateOnly.has(qid));
        if (cls === 'fail') worst = 'fail';
        else if (cls === 'escalate' && worst !== 'fail') worst = 'escalate';
        answers.push({ question: qid, type: q.type, raw, probability: defectProb(q, raw), classification: cls, severity: severity[qid] || null });
      }
      segments.push({ segment: p.files[0].id, sheets: p.files.map((f) => f.file), isolated: !!p.isolated, worst, answers });
    }
    return {
      model, gateway: o.gateway || cfg().gateway || null, generated_at: new Date().toISOString(), complete, state,
      requests: requestRows, segments, usage,
      cost_estimate_usd: +((usage.input_tokens * (PRICES[model] ?? 0)) / 1e6).toFixed(6),
      ...(error ? { error } : {}),
    };
  };
  const write = (complete, error = null) => fs.writeFileSync(outPath, JSON.stringify(assemble(complete, error), null, 2));
  const emit = (slice, result, isolated) => {
    const u = (result && result.usage) || {};
    usage.input_tokens += u.input_tokens || 0; usage.output_tokens += u.output_tokens || 0; usage.requests += 1;
    requestRows.push({ segments: slice.map((f) => f.id), isolated: !!isolated, usage: u });
    parts.push({ files: slice, result, isolated: !!isolated, needIsolate: worstOf(result) !== 'pass', superseded: false });
    write(false); // incremental: ratings.json rewritten after every request
  };
  try {
    for (const batch of buildBatches(files, { size })) {
      const start = parts.length;
      await requestBatch(modelFull, makeBody, batch, { gateway: o.gateway }, emit);
      const batchParts = parts.slice(start);
      // Auto-isolation: a multi-sheet batch with any fail/escalate is re-asked one image
      // per request; per-segment rows replace the batch rows (usage of both passes recorded).
      if (batch.length > 1 && batchParts.some((p) => p.needIsolate)) {
        for (const p of batchParts) p.superseded = true;
        for (const f of batch) await requestBatch(modelFull, makeBody, [f], { gateway: o.gateway, isolated: true }, emit);
      }
    }
  } catch (e) {
    write(false, redact(e.message)); // fatal mid-run: partial ratings.json stays on disk, then exit 2
    throw e;
  }
  write(true);
  const final = assemble(true);
  const tally = { fail: 0, escalate: 0, pass: 0 };
  for (const s of final.segments) tally[s.worst]++;
  console.log(`model: ${model} — ${usage.requests} request(s), ${final.segments.length} segment(s) rated`);
  console.log(`  fail=${tally.fail} escalate=${tally.escalate} pass=${tally.pass}`);
  const isolatedRows = final.segments.filter((s) => s.isolated).length;
  if (isolatedRows) console.log(`auto-isolation: ${requestRows.filter((r) => r.isolated).length} sheet(s) re-asked one image per request`);
  console.log(usageLine(model, usage));
  console.log(`ratings written to ${outPath}`);
  return tally.fail || tally.escalate ? 1 : 0;
}

// ---------------------------------------------------------------- commands: read (OCR / CLAIRIC)

async function cmdRead(input, o) {
  if (!input) throw new UserError('usage: clipcut.mjs read <video|sheetsDir> --segments segments.json [--engine local|clairic|auto]');
  if (!fs.existsSync(input)) throw new UserError(`Input not found: ${input}`);
  if (!o.segments) throw new UserError('--segments segments.json is required (run "clipcut.mjs segments" first).');
  const segDoc = loadSegmentsDoc(o.segments);
  const segments = segDoc.segments;
  const isDir = fs.statSync(input).isDirectory();
  // Engine chosen ONCE per run and reported.
  const want = o.engine || 'auto';
  let engine = want;
  let engineNote = '';
  if (want === 'local' || want === 'auto') {
    const kind = await localOcrKind();
    if (kind) { engine = kind; if (want === 'auto') engineNote = ` (auto → local: ${kind})`; }
    else if (want === 'local') throw new UserError('No local OCR available. Install one: npm i -D tesseract.js (downloads English traineddata on first run) or install system tesseract. Or use --engine clairic.');
    else { engine = 'clairic'; engineNote = ' (auto → clairic: no local OCR found)'; }
  } else if (want !== 'clairic') throw new UserError('--engine must be local, clairic or auto.');

  const outPath = o.out || 'text.json';
  let fields = DEFAULT_TEXT_FIELDS;
  if (o.fields) {
    try { fields = readJson(o.fields); } catch { throw new UserError(`--fields file is not valid JSON: ${o.fields}`); }
    if (!fields || typeof fields !== 'object' || !Object.keys(fields).length) throw new UserError('fields.json must be a non-empty object of field specs.');
    for (const [id, f] of Object.entries(fields)) if (!f || typeof f !== 'object' || !f.type) throw new UserError(`field "${id}": needs at least {"type": "text"|"number"|...}.`);
  }

  // One image per segment: the sheet (sheets dir input) or the midpoint frame (video input).
  let files;
  let tmpDir = null;
  if (isDir) {
    const listed = listSheets(input).files;
    const byId = new Map(listed.map((f) => [f.id, f]));
    files = segments.map((seg) => byId.get(seg.id)).filter(Boolean);
    const missing = segments.length - files.length;
    if (!files.length) throw new UserError(`No sheet in ${input} matches a segment id from ${o.segments}.`);
    if (missing) console.log(`note: ${missing} segment(s) have no matching sheet in ${input} — skipped`);
    if (engine === 'clairic') requireCreds(); // credentials BEFORE any network
  } else {
    if (engine === 'clairic') requireCreds(); // credentials BEFORE any frame extraction
    warnSourceMismatch('the segments file', segDoc.video, segDoc.duration, input, await durationOf(input));
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clipcut-read-'));
    files = [];
    for (const seg of segments) {
      const mid = seg.start + (seg.end - seg.start) / 2;
      const fp = path.join(tmpDir, `${seg.id}.png`);
      // Width capped at 1280 (no upscaling: min(1280,iw)) to bound tokens/bytes.
      const r = await runFf('ffmpeg', ['-v', 'error', '-y', '-ss', fmt(mid), '-i', input, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", fp]);
      if (r.code !== 0 || !fs.existsSync(fp)) throw new UserError(`midpoint frame extraction failed for ${seg.id} at ${fmt(mid)}s: ${r.stderr.trim().slice(0, 200)}`);
      files.push({ id: seg.id, path: fp, file: `${seg.id}.png` });
    }
  }
  try {
    if (engine !== 'clairic') {
      const rows = await ocrImages(engine, files);
      fs.writeFileSync(outPath, JSON.stringify({ engine: `${engine}${engineNote}`.trim(), complete: true, segments: rows, usage: null }, null, 2));
      console.log(`engine: ${engine}${engineNote} (local, free)`);
      console.log(`wrote ${outPath} (${rows.length} segment record(s))`);
      return 0;
    }
    // clairic: 1 image per request (per-segment truth), paced, incremental writes. The
    // state tells the model WHAT it is looking at: a contact sheet (dir input) or a single
    // midpoint frame (video input).
    const state = isDir ? READ_STATE_SHEET : READ_STATE;
    const dims = await imageDims(files[0].path);
    preflightGate(files, dims, { model: 'clairic', size: 1, yes: yesFlag(o) });
    const usage = { input_tokens: 0, output_tokens: 0, requests: 0 };
    const requestRows = [];
    const rows = [];
    const write = (complete, error = null) => fs.writeFileSync(outPath, JSON.stringify({
      engine: `clairic${engineNote}`, gateway: o.gateway || cfg().gateway || null, generated_at: new Date().toISOString(), complete,
      requests: requestRows, segments: rows, usage, cost_estimate_usd: +((usage.input_tokens * PRICES.clairic) / 1e6).toFixed(6),
      ...(error ? { error } : {}),
    }, null, 2));
    try {
      for (const batch of buildBatches(files, { size: 1 })) {
        await requestBatch('@cf/cloudflare/clairic', (images) => ({ model: 'clairic', state, fields, images }), batch, { gateway: o.gateway }, (slice, result) => {
          const u = (result && result.usage) || {};
          usage.input_tokens += u.input_tokens || 0; usage.output_tokens += u.output_tokens || 0; usage.requests += 1;
          requestRows.push({ segments: slice.map((f) => f.id), usage: u });
          const first = Object.values(result.answers || {})[0] || {};
          rows.push({ segment: slice[0].id, file: slice[0].file, engine: 'clairic', fields: result.answers || {}, text: first.value ?? null, confidence: first.confidence ?? null, p_null: first.p_null ?? null });
        });
        write(false);
      }
    } catch (e) { write(false, redact(e.message)); throw e; }
    write(true);
    console.log(`engine: clairic${engineNote} (${usage.requests} request(s))`);
    console.log(usageLine('clairic', usage));
    if (Object.keys(fields).length > 1) console.log('note: with multiple fields, text/confidence reflect the FIRST field');
    console.log(`wrote ${outPath} (${rows.length} segment record(s))`);
    return 0;
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- commands: cut

async function cmdCut(video, o) {
  if (!fs.existsSync(video)) throw new UserError(`Video not found: ${video}`);
  if (!o.plan) throw new UserError('--plan clips.json is required. See "clipcut.mjs plan" for the schema.');
  let plan;
  try { plan = readJson(o.plan); } catch { throw new UserError(`--plan file is not valid JSON: ${o.plan}`); }
  const mode = o.mode || 'lossless';
  if (!['lossless', 'accurate'].includes(mode)) throw new UserError('--mode must be lossless or accurate.');
  const tolerance = numFlag(o, 'tolerance', 0.5, { min: 0.001 });
  const outdir = o.outdir || 'clips';
  // Probe + validate the source BEFORE touching the output dir: a corrupt source must
  // never empty --outdir (the clear below only runs once the source is known-good).
  const info = await probeContainer(video);
  const v = validatePlan(plan, info.duration);
  if (v.errors.length) throw new UserError(`clips.json invalid: ${v.errors.join('; ')}. See "clipcut.mjs plan" for the schema.`);
  for (const w of v.warnings) console.log(`warning: ${w}`);
  if (typeof plan.video === 'string' && !sameVideoPath(plan.video, video)) {
    console.log(`warning: clips.json was built for ${plan.video} but cutting ${path.resolve(video)}`);
  }
  if (Number.isFinite(Number(plan.duration)) && Math.abs(Number(plan.duration) - info.duration) > 1) {
    console.log(`warning: clips.json says the source is ${fmt(plan.duration)}s but it is ${fmt(info.duration)}s (mismatch > 1s)`);
  }
  // Input fingerprint: when the plan carries one (copied from probe.json), compare it
  // to the ACTUAL file. A re-rendered source at the same path with the same duration
  // still trips this — path/duration checks cannot. Mismatch is a loud warning;
  // --strict turns it into exit 2 BEFORE any cutting (and before the output dir is
  // touched).
  if (plan.fingerprint) {
    const actual = fingerprintFile(video);
    const match = fingerprintsMatch(plan.fingerprint, actual);
    if (match === false) {
      const msg = `fingerprint mismatch: the plan was built from a DIFFERENT file (same path/duration?) — plan fingerprint (size ${plan.fingerprint.size}, sha256 head:tail ${String(plan.fingerprint.sha256_head_tail).slice(0, 16)}...) vs actual (size ${actual.size}, sha256 head:tail ${actual.sha256_head_tail.slice(0, 16)}...) — re-run probe + segments against this file`;
      if (o.strict === true) throw new UserError(`${msg}. --strict refuses to cut; nothing was written`);
      console.log(`warning: ${msg}; pass --strict to refuse`);
    }
  }
  // Managed dir: cut-report.json + any tool-named clip/export output (<slug>.mp4 and the
  // <slug>_<platform>_<variant>.mp4 family) may stay from earlier runs — re-running cut
  // for one clip in the same dir works. Only the stale report is cleared upfront; clip
  // files are replaced by ATOMIC rename (verified temp first), so a failed cut leaves a
  // pre-existing clip untouched instead of a truncated file.
  prepareManagedDirKeep(outdir, (e) => e === 'cut-report.json' || /^[A-Za-z0-9][A-Za-z0-9._-]*\.mp4$/.test(e), ['cut-report.json']);
  if (mode === 'lossless' && info.vfr) console.log(`note: source looks VFR (r=${fmt(info.r_frame_rate)} vs avg=${fmt(info.avg_frame_rate)} fps) — copy cuts may drift; every clip will be re-encoded`);
  // Keyframe map (stdout pass in probe style — never truncated): used for copy-mode
  // start_error_ms AND for nearest_keyframes / lossless_alternative on every re-encode
  // path (accurate mode, VFR fallback, tolerance fallback), so it is fetched for all
  // modes (~40 B/packet; a 60-min 30fps video is ~4 MB — complete coverage).
  const rk = await runFf('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_packets', '-show_entries', 'packet=pts_time,flags', video]);
  const keyframes = parseKeyframes(rk.stdout.toString());

  const outPath = (slug) => path.join(outdir, `${slug}.mp4`);
  const measure = async (f) => durationOf(f);
  /** First packet pts of one stream (null when unreadable) — feeds av_start_skew_s. */
  const firstPacketPts = async (file, sel) => {
    const rp = await runFf('ffprobe', ['-v', 'error', '-select_streams', sel, '-read_intervals', '%+#1', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', file]);
    if (rp.code !== 0) return null;
    const first = rp.stdout.toString().split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0];
    const n = Number(first);
    return Number.isFinite(n) ? n : null;
  };
  const rows = [];
  for (const c of plan.clips) {
    const dur = +(c.end - c.start).toFixed(3);
    const target = outPath(c.slug);
    const fadeStart = Math.max(0, dur - FADE_S).toFixed(3);
    const encodeArgs = (out) => [
      '-v', 'error', '-y', '-ss', fmt(c.start), '-i', video, '-t', fmt(dur),
      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      ...(info.hasAudio ? ['-c:a', 'aac', '-b:a', '192k', '-af', `afade=t=in:st=0:d=${FADE_S},afade=t=out:st=${fadeStart}:d=${FADE_S}`] : []),
      '-movflags', '+faststart', out,
    ];
    const copyArgs = (out) => ['-v', 'error', '-y', '-ss', fmt(c.start), '-i', video, '-t', fmt(dur), '-c', 'copy', '-avoid_negative_ts', 'make_zero', out];
    // Atomic write: encode/copy into a hidden temp sibling, verify (readable duration;
    // faststart on re-encode paths), then rename onto the final name.
    const writeClip = async (argsFor, what, { wantFaststart = false } = {}) => {
      await atomicMediaWrite(target, async (tmp) => {
        const r = await runFf('ffmpeg', argsFor(tmp));
        if (r.code !== 0) throw new UserError(`${what} failed: ${r.stderr.trim().slice(0, 300)}`);
      }, async (tmp) => {
        await durationOf(tmp); // throws when the output is unreadable
        if (wantFaststart && !hasFaststart(tmp)) throw new UserError(`${what}: verification failed — output has no faststart (moov not at the front); nothing written`);
      });
    };
    const bracket = bracketKeyframes(keyframes, c.start);
    const tolMs = Math.round(tolerance * 1000);
    let used = '';
    let command = '';
    let nearestKeyframes = null;
    let losslessAlt = null;
    if (mode === 'accurate' || info.vfr) {
      await writeClip(encodeArgs, `accurate cut of ${c.slug}`, { wantFaststart: true }); used = 're-encode'; command = encodeArgs(target).join(' ');
      nearestKeyframes = bracket;
      losslessAlt = {
        command: `ffmpeg ${copyArgs(target).join(' ')}`,
        reason: mode === 'accurate' ? '--mode accurate was requested (always re-encodes)' : 'source looks VFR — copy cuts can start on a frozen or wrong frame',
      };
    } else {
      await writeClip(copyArgs, `lossless cut of ${c.slug}`); used = 'copy'; command = copyArgs(target).join(' ');
      const first = classifyDuration(await measure(target), dur, tolerance);
      if (!first.within) {
        const snapMs = bracket.before == null ? null : Math.round((c.start - bracket.before) * 1000);
        await writeClip(encodeArgs, `accurate re-cut of ${c.slug}`, { wantFaststart: true }); used = 're-encode (tolerance fallback)'; command = encodeArgs(target).join(' ');
        nearestKeyframes = bracket;
        losslessAlt = {
          command: `ffmpeg ${copyArgs(target).join(' ')}`,
          reason: snapMs != null && snapMs > tolMs
            ? `keyframe snap ${snapMs}ms exceeds tolerance ${tolMs}ms`
            : `copy duration error ${first.error_ms}ms exceeded tolerance ${tolMs}ms${snapMs != null ? ` (start keyframe snap ${snapMs}ms)` : ''}`,
        };
      }
    }
    const actual = await measure(target);
    const { error_ms, within } = classifyDuration(actual, dur, tolerance);
    // Copy mode snaps -ss to the keyframe at-or-before the requested start: record how far
    // earlier than requested the clip actually begins (null when the keyframe map is empty).
    let startErr = null;
    let avSkew = null;
    let avSkewWarn = false;
    if (used === 'copy') {
      const kf = keyframeAtOrBefore(keyframes, c.start);
      startErr = kf == null ? null : Math.round((c.start - kf) * 1000);
      if (info.hasAudio) {
        // Copy-mode joins can start audio and video at slightly different pts. Warning
        // field only — it does NOT change the exit semantics of this command.
        const vPts = await firstPacketPts(target, 'v');
        const aPts = await firstPacketPts(target, 'a');
        if (vPts != null && aPts != null) {
          avSkew = +Math.abs(vPts - aPts).toFixed(3);
          const limit = Math.max(2 / (info.fps || 30), 0.1);
          if (avSkew > limit) {
            avSkewWarn = true;
            console.log(`warning: ${c.slug}: audio starts ${fmt(avSkew)}s away from video (over the ${fmt(limit)}s limit) — copy-mode joins can click or drift; re-cut with --mode accurate if that matters`);
          }
        }
      }
    }
    rows.push({
      slug: c.slug, file: target, mode: used, requested_s: dur, actual_s: +actual.toFixed(3),
      duration_error_ms: error_ms, within_tolerance: within,
      ...(used === 'copy' ? { start_error_ms: startErr } : {}),
      ...(used === 'copy' && avSkew != null ? { av_start_skew_s: avSkew, ...(avSkewWarn ? { av_start_skew_warning: true } : {}) } : {}),
      ...(used !== 'copy' ? { nearest_keyframes: nearestKeyframes, lossless_alternative: losslessAlt } : {}),
      command: `ffmpeg ${command}`,
    });
    console.log(`${c.slug}: mode=${used.startsWith('copy') ? 'copy' : 're-encode'} requested=${fmt(dur)}s actual=${fmt(actual)}s err=${error_ms}ms${used === 'copy' && startErr != null ? ` start_err=${startErr}ms` : ''}${avSkew != null ? ` av_skew=${fmt(avSkew)}s` : ''} ${within ? 'ok' : 'OVER TOLERANCE'}`);
  }
  const report = {
    video: path.resolve(video), plan: path.resolve(o.plan), mode, tolerance_s: tolerance,
    source_vfr: info.vfr, generated_at: new Date().toISOString(), clips: rows,
  };
  fs.writeFileSync(path.join(outdir, 'cut-report.json'), JSON.stringify(report, null, 2));
  console.log(`wrote ${path.join(outdir, 'cut-report.json')}`);
  const failing = rows.filter((r) => !r.within_tolerance);
  if (failing.length) {
    console.log(`attention needed: duration error > ${tolerance}s for: ${failing.map((r) => r.slug).join(', ')}`);
    return 1;
  }
  return 0;
}

// ---------------------------------------------------------------- commands: export

const PLATFORM_NOTES = {
  youtube: 'youtube: long-form accepts most aspect ratios; H.264 High + AAC + faststart (moov at the front) recommended; ~8 Mbps for 1080p SDR at 24-30fps.',
  shorts: 'youtube shorts: vertical up to 3 minutes (verified cap), max 1080p; 9:16 1080x1920 recommended; keep text out of the top ~10% / bottom ~30% (community-measured).',
  tiktok: 'tiktok: 9:16 1080x1920 recommended (community-measured), H.264+AAC MP4; standard uploads allow up to ~10 min (community-reported); keep captions/CTAs clear of the bottom rail (~484px) and right icon rail (~140px) (community-measured).',
  reels: 'instagram reels: 9:16 recommended (1.91:1 minimum), 30+ fps, >=720p; 3-minute limit is community-reported (unverified); ads must keep the bottom 40% free of text/logos.',
  x: 'x: 16:9 / 1:1 / 9:16 accepted, 1080p max; free tier caps uploads at 140s (community-reported; Premium allows up to 4h); no auto-captions — burn them in.',
  creator: 'creator (generic profile): 9:16 1080x1920, H.264+AAC, faststart, even dimensions; aim for 60-90s per clip; keep critical content out of top ~15% / bottom ~30% / right ~10%.',
};

async function measureLoudnorm(file) {
  const r = await runFf('ffmpeg', ['-i', file, '-af', `loudnorm=I=${LOUDNORM_TARGET.I}:TP=${LOUDNORM_TARGET.TP}:LRA=${LOUDNORM_TARGET.LRA}:print_format=json`, '-f', 'null', '-']);
  const m = parseLoudnormJson(r.stderr);
  if (!m || !Number.isFinite(m.I) || !Number.isFinite(m.threshold)) throw new UserError(`loudnorm measurement failed on ${file} (silent or unmeasurable audio).`);
  return m;
}

async function cmdExport(clip, o) {
  if (!clip || !fs.existsSync(clip)) throw new UserError(`Clip not found: ${clip}`);
  const platform = o.platform;
  if (!platform) throw new UserError(`--platform is required: ${PLATFORMS.join('|')}.`);
  if (!PLATFORMS.includes(platform)) throw new UserError(`--platform must be one of ${PLATFORMS.join('|')}. Got: ${platform}`);
  const variant = o.variant || 'original';
  if (!VARIANTS.includes(variant)) throw new UserError(`--variant must be one of ${VARIANTS.join('|')}. Got: ${variant}`);
  // Crop anchors: window-position fractions for 9x16-crop ONLY (0 = left/top edge,
  // 1 = right/bottom edge, 0.5 = centered default). Anywhere else they would do
  // nothing — reject instead of silently ignoring.
  const anchorGiven = o['crop-x'] != null || o['crop-y'] != null;
  if (anchorGiven && variant !== '9x16-crop') throw new UserError('crop anchors apply to 9x16-crop only (on other variants the crop window has no free position)');
  const cropX = cropAnchor(o['crop-x'], 'crop-x');
  const cropY = cropAnchor(o['crop-y'], 'crop-y');
  const outdir = o.out || 'exports';
  const slug = sanitizeSlug(path.basename(clip));
  const target = path.join(outdir, exportName(slug, platform, variant));
  // Managed dir: only this tool's export naming family is allowed (plus this tool's own
  // stale atomic-write temps, which are cleared). The target itself is NOT removed
  // upfront — the write is atomic (verified temp, then rename), so a failed export
  // leaves a pre-existing export untouched instead of nothing.
  if (fs.existsSync(outdir)) {
    if (!fs.statSync(outdir).isDirectory()) throw new UserError(`--out path exists and is not a directory: ${outdir}`);
    for (const e of fs.readdirSync(outdir)) {
      if (!EXPORT_NAME_RE.test(e) && !TEMP_OUTPUT_RE.test(e)) throw new UserError(`output dir has unrelated files; choose a fresh --out (found "${e}" in ${outdir})`);
    }
    for (const e of fs.readdirSync(outdir)) if (TEMP_OUTPUT_RE.test(e)) fs.rmSync(path.join(outdir, e), { force: true });
  }
  fs.mkdirSync(outdir, { recursive: true });

  const info = await probeContainer(clip);
  let af = null;
  let loudnormNote = '';
  if (o.loudnorm === true) {
    if (!info.hasAudio) { loudnormNote = ' (--loudnorm skipped: clip has no audio)'; console.log('note: --loudnorm skipped — clip has no audio'); }
    else {
      const m = await measureLoudnorm(clip); // pass 1: measure
      af = `loudnorm=I=${LOUDNORM_TARGET.I}:TP=${LOUDNORM_TARGET.TP}:LRA=${LOUDNORM_TARGET.LRA}:measured_I=${m.I}:measured_TP=${m.TP ?? LOUDNORM_TARGET.TP}:measured_LRA=${m.LRA ?? LOUDNORM_TARGET.LRA}:measured_thresh=${m.threshold}:linear=true`;
      loudnormNote = ` (loudnorm two-pass: measured I=${m.I} LUFS → target ${LOUDNORM_TARGET.I})`;
    }
  }
  const audioArgs = af
    ? ['-c:a', 'aac', '-b:a', '192k', '-af', af]
    : (info.hasAudio ? ['-c:a', 'copy'] : []);
  const videoEncode = ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p'];
  const faststart = ['-movflags', '+faststart'];

  let args;
  let label;
  let blurFgH = null;
  if (variant === '9x16-blur') {
    const fc = '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]';
    args = ['-v', 'error', '-y', '-i', clip, '-filter_complex', fc, '-map', '[v]', '-map', '0:a?', ...videoEncode, ...audioArgs, ...faststart];
    label = '9x16 blur-pad re-encode';
    if (Number.isFinite(info.width) && info.width > 0) blurFgH = Math.round((info.height * 1080) / info.width);
  } else if (variant === '9x16-crop') {
    // Bounded crop: min(iw,ih*9/16) x min(ih,iw*16/9) never exceeds the frame in either
    // dimension, so ANY aspect (portrait/taller-than-9:16, landscape, square) fills 1080x1920.
    // --crop-x/--crop-y anchor the window inside the leftover region (0.5 = the
    // byte-identical historical center crop; see cropAnchorFilter).
    args = ['-v', 'error', '-y', '-i', clip, '-vf', cropAnchorFilter(cropX, cropY), ...videoEncode, ...audioArgs, ...faststart];
    label = cropX === 0.5 && cropY === 0.5 ? '9x16 center-crop re-encode' : `9x16 anchored-crop re-encode (crop-x ${cropX}, crop-y ${cropY})`;
  } else if (!evenDims(info.width, info.height)) {
    args = ['-v', 'error', '-y', '-i', clip, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', ...videoEncode, ...audioArgs, ...faststart];
    label = `re-encode to even dimensions (${info.width}x${info.height} is odd)`;
  } else if ((info.codec && info.codec !== PLATFORM_CODEC.video) || (info.pixFmt && info.pixFmt !== PLATFORM_CODEC.pixFmt)) {
    // Original-variant baseline from the shared table: even dims are not enough — a
    // non-H.264 or non-yuv420p stream (hevc, vp9, yuv444...) is stream-copied into an
    // export platforms reject, so it re-encodes to the PLATFORM_CODEC baseline.
    args = ['-v', 'error', '-y', '-i', clip, ...videoEncode, ...audioArgs, ...faststart];
    label = `re-encode to the ${PLATFORM_CODEC.video}/${PLATFORM_CODEC.pixFmt} baseline (source is ${info.codec || '?'}/${info.pixFmt || '?'})`;
  } else if (af) {
    args = ['-v', 'error', '-y', '-i', clip, '-c:v', 'copy', ...audioArgs, ...faststart];
    label = 'audio re-encode (loudnorm), video stream-copied';
  } else {
    args = ['-v', 'error', '-y', '-i', clip, '-c', 'copy', ...faststart];
    label = `stream copy remux (already compliant${hasFaststart(clip) ? ', faststart normalized' : ''})`;
  }
  // Atomic write: encode into a hidden temp sibling, verify (readable container + a
  // faststart box walk — every export path adds +faststart), then rename onto the target.
  await atomicMediaWrite(target, async (tmp) => {
    const r = await runFf('ffmpeg', [...args, tmp]);
    if (r.code !== 0) throw new UserError(`export failed (${label}): ${r.stderr.trim().slice(0, 300)}`);
  }, async (tmp) => {
    await probeContainer(tmp);
    if (!hasFaststart(tmp)) throw new UserError(`export verification failed (${label}): output has no faststart (moov not at the front); nothing written`);
  });
  const outInfo = await probeContainer(target);
  const warnings = platformWarnings(platform, outInfo.duration, { width: outInfo.width, height: outInfo.height }, variant);
  console.log(`${PLATFORM_NOTES[platform]}`);
  console.log(`wrote ${target} — ${outInfo.width}x${outInfo.height}, ${fmt(outInfo.duration)}s, faststart=${hasFaststart(target)}${loudnormNote} [${label}]`);
  if (blurFgH != null && blurFgH > 1920) {
    // Taller-than-9:16 portrait: the foreground fitted to 1080px wide is taller than the
    // 1920px canvas, so the overlay centers and the top/bottom fall off the canvas.
    console.log(`warning: 9x16-blur on ${info.width}x${info.height} (taller than 9:16): the foreground fitted to 1080px wide is ~${blurFgH}px tall and exceeds the 1920px canvas — vertical content is cropped`);
  }
  for (const w of warnings) console.log(`warning: ${w}`);
  if (warnings.length) { console.log('attention needed: platform spec warnings above'); return 1; }
  return 0;
}

// ---------------------------------------------------------------- commands: tighten

// AUDIO ROUTE (empirical): kajisho5/ffmpeg-skill reports FFmpeg 8/8.1 `aselect` passing
// every frame through (nothing dropped). Verified locally on ffmpeg 9.0.2 (Homebrew):
// aselect DOES drop correctly here — 3 s wav with one 1 s span removed -> 1.978 s;
// 12 s mp4 keeping 8 s -> audio 8.006 s / video 8.067 s (both tracks dropped the same
// 4 s). CHOSEN ROUTE: direct `select` + `aselect` (+ pts resets) in ONE re-encode,
// guarded by the atomic post-write duration verification — on a build where aselect
// misbehaves (everything passes through) the output duration check fails, the temp is
// deleted and nothing is written, instead of a silently wrong file.
async function cmdTighten(clip, o) {
  if (!clip || !fs.existsSync(clip)) throw new UserError(`Clip not found: ${clip}`);
  const threshold = numFlag(o, 'threshold', TIGHTEN_DEFAULTS.thresholdDb, { min: -100, max: -1 });
  const minSilence = numFlag(o, 'min-silence', TIGHTEN_DEFAULTS.minSilenceS, { min: 0.05, max: 60 });
  const margin = numFlag(o, 'margin', TIGHTEN_DEFAULTS.marginS, { min: 0, max: 2 });
  const minKeep = numFlag(o, 'min-keep', TIGHTEN_DEFAULTS.minKeepS, { min: 0, max: 30 });
  const maxCuts = numFlag(o, 'max-cuts', TIGHTEN_DEFAULTS.maxCuts, { min: 1, max: 5000 });
  const info = await probeContainer(clip); // throws on a missing video stream
  if (!info.hasAudio) throw new UserError(`${clip} has no audio stream — tighten removes silence detected on AUDIO; nothing to tighten.`);
  if (info.vfr) console.log(`warning: VFR source (r=${fmt(info.r_frame_rate)} vs avg=${fmt(info.avg_frame_rate)} fps) — tighten re-times the video to CFR (select + setpts), re-encode forced`);
  const duration = info.duration;
  const rsi = await runFf('ffmpeg', ['-i', clip, '-vn', '-af', `silencedetect=noise=${threshold}dB:d=${minSilence}`, '-f', 'null', '-']);
  const silences = parseSilences(rsi.stderr)
    .map((s) => (s.end == null && duration > s.start ? { ...s, end: +duration.toFixed(3) } : s))
    .map((s) => ({ start: +Number(s.start).toFixed(3), end: s.end == null ? null : +Number(s.end).toFixed(3) }));
  const { keep, cuts, removedS } = buildKeepSpans(duration, silences, { margin, minKeep });

  // Nothing to tighten: measure the track mean level and SUGGEST a threshold (mean + 6 dB,
  // capped at -5 dB) instead of returning an empty nothing.
  if (!keep.length || removedS < 0.05) {
    const rv = await runFf('ffmpeg', ['-i', clip, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
    const vol = parseVolumedetect(rv.stderr);
    const meanDb = vol ? vol.mean : null;
    if (meanDb != null && meanDb <= SILENT_MAX_DB) {
      console.log(`nothing to tighten at threshold ${threshold} dBFS / min-silence ${minSilence}s — and the audio measures as digital silence (mean ${meanDb} dBFS): there is no speech to keep.`);
    } else {
      const suggestion = suggestThreshold(meanDb);
      console.log(`nothing to tighten at threshold ${threshold} dBFS / min-silence ${minSilence}s: no removable silence found${meanDb != null ? ` — the track mean level is ${meanDb} dBFS; try --threshold ${suggestion}` : ''}`);
    }
    return 0;
  }
  if (cuts > maxCuts) {
    throw new UserError(`${cuts} silence cuts exceeds --max-cuts ${maxCuts} (the select filter graph would be oversized). Raise --min-silence (fewer, longer silences), --margin, or --max-cuts.`);
  }

  const stem = sanitizeSlug(path.basename(clip));
  const target = path.join(path.dirname(path.resolve(clip)), `${stem}_tight.mp4`);
  const expr = keep.map(([a, b]) => `between(t,${fmt(a)},${fmt(b)})`).join('+');
  // 30 ms audio de-click at every JOIN (end of kept piece i meets start of piece i+1),
  // placed at the CUMULATIVE output timestamps (post-asetpts the audio is contiguous).
  // NOT afade: afade=t=in with st>0 silences everything BEFORE st, so a fade-in at a
  // join would zero every earlier kept piece. A per-frame conditional volume filter
  // ramps down into each join and back up out of it, leaving all other samples at 1.
  const fadeJoin = fadeJoinExpr;
  const fadeList = [];
  let cum = 0;
  for (let i = 0; i < keep.length - 1; i++) {
    cum += keep[i][1] - keep[i][0];
    fadeList.push(`volume=volume='${fadeJoin(cum)}':eval=frame`);
  }
  const vf = `select='${expr}',setpts=N/FRAME_RATE/TB`;
  const af = [`aselect='${expr}',asetpts=N/SR/TB`, ...fadeList].join(',');
  const expectedS = +keep.reduce((a, k) => a + (k[1] - k[0]), 0).toFixed(3);
  // Single re-encode, written atomically: the temp is verified before it replaces
  // anything at <stem>_tight.mp4 — duration must match the keep-span total AND the
  // output audio must not be silent (duration alone let a broken filter chain ship
  // a digitally-silent file; volumedetect is the backstop).
  const srcVol = await measureMaxVolume(clip);
  await atomicMediaWrite(target, async (tmp) => {
    const r = await runFf('ffmpeg', ['-v', 'error', '-y', '-i', clip, '-vf', vf, '-af', af,
      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
    if (r.code !== 0) throw new UserError(`tighten encode failed: ${r.stderr.trim().slice(0, 300)}`);
  }, async (tmp) => {
    const d = await durationOf(tmp);
    const { within } = classifyDuration(d, expectedS, 0.5);
    if (!within) throw new UserError(`tighten verification failed: output is ${fmt(d)}s but the keep spans total ${fmt(expectedS)}s — this ffmpeg build may not drop audio frames in aselect; no file written.`);
    if (srcVol != null && srcVol > SILENT_MAX_DB) {
      const outVol = await measureMaxVolume(tmp);
      if (outVol != null && outVol <= SILENT_MAX_DB) {
        throw new UserError(`tighten verification failed: the source audio peaks at ${srcVol} dBFS but the output is digitally silent (<= ${SILENT_MAX_DB} dBFS) — a filter chain destroyed the audio; no file written.`);
      }
    }
  });
  const after = await durationOf(target);
  console.log(`tighten: ${path.basename(clip)} -> ${path.basename(target)} (threshold ${threshold} dBFS, min-silence ${minSilence}s, margin ${margin}s, min-keep ${minKeep}s)`);
  console.log(`report: before_s=${fmt(duration)} after_s=${fmt(after)} removed_s=${fmt(Math.max(0, duration - after))} cuts=${cuts}`);
  return 0;
}

// ---------------------------------------------------------------- commands: check

async function cmdCheck(file, o) {
  if (!file || !fs.existsSync(file)) throw new UserError(`File not found: ${file}`);
  const platform = o.platform || null;
  if (platform && !PLATFORMS.includes(platform)) throw new UserError(`--platform must be one of ${PLATFORMS.join('|')} or omitted. Got: ${platform}`);
  const facts = await probeCheckFacts(file);
  const rows = buildCheckRows(facts, { platform });
  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const r of rows) summary[r.status === 'FAIL' ? 'fail' : r.status === 'WARN' ? 'warn' : 'pass']++;
  const outPath = o.out || 'check-report.json';
  fs.writeFileSync(outPath, JSON.stringify({
    file: path.resolve(file), platform, generated_at: new Date().toISOString(),
    rows, summary,
  }, null, 2));
  console.log(`check: ${path.basename(file)}${platform ? ` against ${platform} (duration cap ${PLATFORM_SPECS[platform].duration.cap == null ? 'none' : `${PLATFORM_SPECS[platform].duration.cap}s`} — ${PLATFORM_SPECS[platform].duration.mark})` : ' (no --platform: judgement rows are WARN-only, format rows still enforce)'}`);
  for (const r of rows) {
    console.log(`  ${r.status.padEnd(4)} ${r.check} [${r.kind}]${r.note ? ` — ${r.note}` : ''}`);
    if (r.reason) console.log(`       reason: ${r.reason}`);
    if (r.fix) console.log(`       fix: ${r.fix}`);
  }
  console.log(`summary: ${summary.pass} PASS, ${summary.warn} WARN, ${summary.fail} FAIL`);
  console.log(`wrote ${outPath}`);
  return summary.fail ? 1 : 0;
}

// ---------------------------------------------------------------- commands: preview / plan

const PREVIEW_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*_(?:preview\.png|3s\.mp4|end3s\.mp4)$/;

async function cmdPreview(clip, o) {
  if (!clip || !fs.existsSync(clip)) throw new UserError(`Clip not found: ${clip}`);
  const slug = sanitizeSlug(path.basename(clip));
  const outdir = o.out || 'preview';
  const sheetName = `${slug}_preview.png`;
  const first3Name = `${slug}_3s.mp4`;
  const end3Name = `${slug}_end3s.mp4`;
  // Managed dir: ANY slug's preview outputs may coexist; only THIS slug's files + the
  // report are replaced, so previewing several clips into one dir just works.
  prepareManagedDirKeep(outdir, (e) => e === 'preview.json' || PREVIEW_NAME_RE.test(e), [sheetName, first3Name, end3Name, 'preview.json']);
  const dur = await durationOf(clip);
  await contactSheet(clip, { start: 0, end: dur, frames: 6, outPng: path.join(outdir, sheetName) });
  const sample = async (name, seek, len) => {
    const r = await runFf('ffmpeg', ['-v', 'error', '-y', '-ss', fmt(seek), '-i', clip, '-t', fmt(len), '-vf', 'scale=320:-2', '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(outdir, name)]);
    if (r.code !== 0) throw new UserError(`preview sample ${name} failed: ${r.stderr.trim().slice(0, 300)}`);
  };
  const headLen = Math.min(3, dur);
  const tailLen = Math.min(3, dur);
  await sample(first3Name, 0, headLen);
  await sample(end3Name, Math.max(0, dur - tailLen), tailLen);

  // Boundary check: for each clip edge, a scene-score scan of the SOURCE over [t-1.5, t+1.5]
  // records the max scene score in the window and whether a scene change lands within 0.5s
  // of the boundary (from the window scan itself; --probe cross-checks its scene_changes).
  const boundaries = [];
  let boundariesNote = 'boundary check skipped — pass --source <video> --start S --end E (optional --probe probe.json) to score the clip edges';
  if (o.source) {
    if (!fs.existsSync(o.source)) throw new UserError(`--source not found: ${o.source}`);
    const start = numFlag(o, 'start', null, { min: 0 });
    const end = numFlag(o, 'end', null, { min: 0 });
    if (start == null || end == null) throw new UserError('--source needs --start S and --end E (the clip\'s times in the source) for the boundary check');
    if (end <= start) throw new UserError('--end must be greater than --start');
    let probeData = null;
    if (o.probe) {
      if (!fs.existsSync(o.probe)) throw new UserError(`--probe file not found: ${o.probe}`);
      try { probeData = readJson(o.probe); } catch { throw new UserError(`--probe file is not valid JSON: ${o.probe}`); }
    }
    const srcDur = await durationOf(o.source);
    const scan = async (type, t) => {
      // Start 0.1s early: input-seeking drops the first frame pair, which would
      // understate scene_score_max exactly at the boundary being checked.
      const t0 = Math.max(0, t - 1.6);
      const windowS = +Math.max(0, Math.min(srcDur, t + 1.5) - t0).toFixed(3);
      const tmp = path.join(os.tmpdir(), `clipcut-bound-${process.pid}-${Date.now()}-${type}.txt`);
      let windowScenes = [];
      try {
        const r = await runFf('ffmpeg', ['-v', 'error', '-ss', fmt(t0), '-i', o.source, '-t', fmt(windowS), '-an', '-vf', `select='gte(scene,0)',metadata=print:file=${escapeFilterPath(tmp)}`, '-f', 'null', '-']);
        if (r.code !== 0) throw new UserError(`boundary scan failed at ${fmt(t)}s: ${r.stderr.trim().slice(0, 300)}`);
        // -ss before -i rebases timestamps to the window start — map back to source time.
        windowScenes = parseSceneMetadata(readTextOrNull(tmp) || '')
          .map((s) => (Number.isFinite(s.t) ? { t: +(t0 + s.t).toFixed(3), score: s.score } : s));
      } finally { fs.rmSync(tmp, { force: true }); }
      const res = boundaryScan(windowScenes, t);
      const row = { type, t: +Number(t).toFixed(3), window_s: windowS, scene_score_max: res.scene_score_max, scene_change_near: res.scene_change_near };
      if (probeData && Array.isArray(probeData.scene_changes)) row.probe_scene_change_near = probeData.scene_changes.some((pt) => Math.abs(Number(pt) - t) <= 0.5);
      return row;
    };
    boundaries.push(await scan('start', start), await scan('end', end));
    boundariesNote = '';
  }
  const doc = {
    clip: slug,
    file: path.resolve(clip),
    samples: { sheet: path.join(outdir, sheetName), first3s: path.join(outdir, first3Name), last3s: path.join(outdir, end3Name) },
    boundaries,
    ...(boundariesNote ? { boundaries_note: boundariesNote } : {}),
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outdir, 'preview.json'), JSON.stringify(doc, null, 2));
  console.log(`wrote ${path.join(outdir, sheetName)} (6-frame contact sheet) + ${first3Name} (first ${fmt(headLen)}s) + ${end3Name} (last ${fmt(tailLen)}s) — samples muted, 320px wide`);
  for (const b of boundaries) {
    console.log(`${b.type} @ ${fmt(b.t)}s: max scene score ${b.scene_score_max == null ? 'n/a' : b.scene_score_max.toFixed(3)} over a ${fmt(b.window_s)}s window, scene change within 0.5s: ${b.scene_change_near}${b.probe_scene_change_near != null ? ` (probe agrees: ${b.probe_scene_change_near})` : ''}`);
  }
  if (!boundaries.length) console.log(boundariesNote);
  console.log(`wrote ${path.join(outdir, 'preview.json')}`);
  return 0;
}

function cmdPlan(o) {
  console.log(`clips.json schema (for "cut"):

{
  "video": "/abs/path/talk.mp4",       // optional: recorded source — cut warns on a mismatch
  "duration": 754.2,                   // optional: recorded source duration (seconds)
  "clips": [
    {
      "slug": "hook",                  // required: filename-safe id [A-Za-z0-9._-], unique
      "start": 12.5,                   // required: seconds, >= 0
      "end": 58.2,                     // required: seconds, > start (5-600s recommended)
      "variants": ["9x16-crop"],       // optional: original | 9x16-crop | 9x16-blur
      "platforms": ["shorts", "tiktok"]// optional: open list — known: ${PLATFORMS.join(' | ')}; unknown map to the creator profile
    }
  ]
}

Minimal example: {"clips":[{"slug":"teaser","start":0,"end":30}]}`);
  if (!o.file) return 0;
  let plan;
  try { plan = readJson(o.file); } catch { console.error(`error: --file is not valid JSON: ${o.file}`); return 2; }
  const v = validatePlan(plan);
  for (const e of v.errors) console.error(`invalid: ${e}`);
  for (const w of v.warnings) console.log(`warning: ${w}`);
  if (v.errors.length) { console.error(`clips.json is INVALID (${v.errors.length} error(s))`); return 2; }
  const { durations, total } = planDurations(plan.clips);
  plan.clips.forEach((c, i) => console.log(`  ${c.slug}: ${fmt(c.start)}s-${fmt(c.end)}s (${fmt(durations[i])}s)`));
  console.log(`total: ${fmt(total)}s across ${plan.clips.length} clip(s)`);
  if (v.warnings.length) { console.log(`clips.json is valid with ${v.warnings.length} warning(s)`); return 1; }
  console.log(`clips.json is valid (${plan.clips.length} clip(s))`);
  return 0;
}

// ---------------------------------------------------------------- commands: verify

/**
 * Generic verify step-runner (exported — selftested). Each step's fn returns
 * undefined (PASS), { skip: reason }, { note } / { skip, note }, or throws (FAIL).
 * After a FAIL the remaining steps SKIP with a reason naming the failed step —
 * every verify step depends on the same file, so cascading failures only add noise.
 * Returns { rows, failed }.
 */
export async function runVerifySteps(steps, log = () => {}) {
  const rows = [];
  let aborted = null;
  for (const s of steps || []) {
    let row;
    if (aborted) {
      row = { name: s.name, status: 'SKIP', reason: aborted };
    } else {
      try {
        const r = await s.fn();
        if (r && r.skip) row = { name: s.name, status: 'SKIP', reason: r.skip, ...(r.note ? { note: r.note } : {}) };
        else row = { name: s.name, status: 'PASS', ...(r && r.note ? { note: r.note } : {}) };
      } catch (e) {
        row = { name: s.name, status: 'FAIL', reason: (e && e.message) || String(e) };
        aborted = `earlier step failed: ${s.name}`;
      }
    }
    rows.push(row);
    log(row);
  }
  return { rows, failed: rows.some((r) => r.status === 'FAIL') };
}

/**
 * verify <video> [--net] — real-footage self-test: runs the REAL pipeline commands
 * (probe -> segments -> sheets -> cut -> tighten -> export 9x16-crop -> check ->
 * preview) against the user's own file in a temp dir under os.tmpdir() (always
 * cleaned). Network steps (one clef-flash ping + one clairic image) run only when
 * credentials exist AND --net was passed; otherwise they SKIP with a reason.
 * Per-step PASS/FAIL/SKIP-with-reason, one summary line, exit 1 on any FAIL.
 * Run once per machine and after ffmpeg upgrades.
 */
async function cmdVerify(video, o) {
  if (!video || !fs.existsSync(video)) throw new UserError(`Video not found: ${video}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipcut-verify-'));
  const paths = { probe: null, segments: null, firstSeg: null, sheet: null, clip: null, export: null };
  const steps = [];
  const step = (name, fn) => steps.push({ name, fn });

  step('probe', async () => {
    paths.probe = path.join(tmp, 'probe.json');
    const rc = await cmdProbe(video, { out: paths.probe });
    if (rc !== 0) throw new Error(`probe exited ${rc}`);
    const p = readJson(paths.probe);
    if (!(Number(p.duration) > 0)) throw new Error('probe.json carries no duration');
    if (!p.fingerprint || !p.fingerprint.sha256_head_tail) throw new Error('probe.json carries no fingerprint');
    return { note: `${p.width}x${p.height} @ ${fmt(p.fps)}fps, ${fmt(p.duration)}s, fingerprint size ${p.fingerprint.size}` };
  });

  step('segments', async () => {
    if (!paths.probe) return { skip: 'no probe to build segments from' };
    paths.segments = path.join(tmp, 'segments.json');
    const rc = await cmdSegments(paths.probe, { out: paths.segments });
    const doc = readJson(paths.segments);
    const segs = Array.isArray(doc.segments) ? doc.segments : [];
    if (!segs.length) {
      const dur = Number(readJson(paths.probe).duration) || 0;
      if (dur < 15) return { skip: `video is ${fmt(dur)}s — shorter than the 15s default --min, no candidate expected` };
      throw new Error(`no candidate segments (segments exited ${rc})`);
    }
    paths.firstSeg = segs[0];
    return { note: `${segs.length} candidate(s); using ${segs[0].id} ${fmt(segs[0].start)}s-${fmt(segs[0].end)}s` };
  });

  step('sheets', async () => {
    if (!paths.firstSeg) return { skip: 'no candidate segment to sheet' };
    const sheetsDir = path.join(tmp, 'sheets');
    const trimPath = path.join(tmp, 'segments-first.json');
    const doc = readJson(paths.segments);
    fs.writeFileSync(trimPath, JSON.stringify({ ...doc, segments: [paths.firstSeg] }, null, 2));
    await cmdSheets(video, { segments: trimPath, out: sheetsDir });
    const { files } = listSheets(sheetsDir);
    paths.sheet = files[0].path;
    if (!fs.existsSync(paths.sheet)) throw new Error('no sheet written');
    return { note: `${files.length} sheet(s): ${path.basename(paths.sheet)}` };
  });

  step('cut', async () => {
    if (!paths.firstSeg) return { skip: 'no candidate segment to slice' };
    const seg = paths.firstSeg;
    const sliceEnd = Math.min(seg.end, seg.start + 8);
    if (sliceEnd - seg.start < 1) return { skip: 'segment too short to slice' };
    const planPath = path.join(tmp, 'verify-plan.json');
    fs.writeFileSync(planPath, JSON.stringify({ video: path.resolve(video), clips: [{ slug: 'verify-slice', start: seg.start, end: +sliceEnd.toFixed(3) }] }));
    const clipsDir = path.join(tmp, 'clips');
    const rc = await cmdCut(video, { plan: planPath, outdir: clipsDir, tolerance: 0.5 });
    paths.clip = path.join(clipsDir, 'verify-slice.mp4');
    const report = readJson(path.join(clipsDir, 'cut-report.json'));
    const row = report.clips && report.clips[0];
    if (rc !== 0 || !row) throw new Error(`cut exited ${rc}${row ? ` (duration_error_ms=${row.duration_error_ms})` : ''}`);
    return { note: `mode=${row.mode}, duration_error_ms=${row.duration_error_ms}${row.within_tolerance ? '' : ' (OVER TOLERANCE — cut reported it)'}` };
  });

  step('tighten', async () => {
    if (!paths.clip) return { skip: 'no cut slice to tighten' };
    const info = await probeContainer(paths.clip);
    if (!info.hasAudio) return { skip: 'slice has no audio stream' };
    const rsi = await runFf('ffmpeg', ['-i', paths.clip, '-vn', '-af', `silencedetect=noise=${TIGHTEN_DEFAULTS.thresholdDb}dB:d=${TIGHTEN_DEFAULTS.minSilenceS}`, '-f', 'null', '-']);
    if (!parseSilences(rsi.stderr).length) return { skip: 'no silence detected in the slice (nothing to tighten)' };
    const rc = await cmdTighten(paths.clip, {});
    if (rc !== 0) throw new Error(`tighten exited ${rc}`);
    return { note: 'silence removal ran on the slice' };
  });

  step('export', async () => {
    if (!paths.clip) return { skip: 'no cut slice to export' };
    const outdir = path.join(tmp, 'exports');
    await cmdExport(paths.clip, { platform: 'shorts', variant: '9x16-crop', out: outdir, 'crop-x': '0.5' });
    paths.export = path.join(outdir, exportName('verify-slice', 'shorts', '9x16-crop'));
    if (!fs.existsSync(paths.export)) throw new Error('export wrote no file');
    const info = await probeContainer(paths.export);
    if (info.width !== 1080 || info.height !== 1920) throw new Error(`export dims ${info.width}x${info.height}, expected 1080x1920`);
    return { note: '1080x1920 (9x16-crop, default crop-x 0.5)' };
  });

  step('check', async () => {
    if (!paths.export) return { skip: 'no export to check' };
    const rc = await cmdCheck(paths.export, { platform: 'shorts', out: path.join(tmp, 'check-report.json') });
    const rep = readJson(path.join(tmp, 'check-report.json'));
    const s = rep.summary || { pass: 0, warn: 0, fail: 0 };
    if (rc !== 0) throw new Error(`check exited ${rc} — ${s.fail} FAIL row(s) (see the rows above)`);
    return { note: `${s.pass} PASS, ${s.warn} WARN, ${s.fail} FAIL (WARNs are fine)` };
  });

  step('preview', async () => {
    if (!paths.clip) return { skip: 'no cut slice to preview' };
    const outdir = path.join(tmp, 'preview');
    await cmdPreview(paths.clip, { out: outdir });
    for (const n of ['verify-slice_preview.png', 'verify-slice_3s.mp4', 'verify-slice_end3s.mp4']) {
      if (!fs.existsSync(path.join(outdir, n))) throw new Error(`preview output missing: ${n}`);
    }
    return { note: 'sheet + first3s + end3s samples written' };
  });

  step('rate+read (network)', async () => {
    if (o.net !== true) return { skip: 'network steps skipped — pass --net to include one clef-flash ping + one clairic image (tiny billed call, estimate)' };
    const c = cfg();
    if (!c.accountId || !c.token) return { skip: 'no credentials (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)' };
    if (!paths.sheet) return { skip: 'no sheet to send' };
    const dims = await imageDims(paths.sheet);
    preflightGate([{ path: paths.sheet }], dims, { model: 'clairic', size: 1, yes: yesFlag(o) });
    await postAi('@cf/cloudflare/clef-flash', { model: 'clef-flash', state: 'Connectivity check.', questions: { ok: { type: 'noul', instructions: 'Is 2+2 equal to 4?' } } }, {});
    await requestBatch('@cf/cloudflare/clairic', (images) => ({ model: 'clairic', state: READ_STATE_SHEET, fields: DEFAULT_TEXT_FIELDS, images }), [{ id: 'seg_001', path: paths.sheet, file: path.basename(paths.sheet) }], {}, () => {});
    return { note: 'clef-flash ping ok + one clairic image read (cost gate respected)' };
  });

  try {
    console.log(`verify: ${path.resolve(video)} (temp dir ${tmp}, always cleaned)`);
    const { rows, failed } = await runVerifySteps(steps, (row) => {
      console.log(`  ${row.status.padEnd(4)} ${row.name}${row.reason ? ` — ${row.reason}` : ''}${row.note ? ` — ${row.note}` : ''}`);
    });
    const tally = { PASS: 0, SKIP: 0, FAIL: 0 };
    for (const r of rows) tally[r.status]++;
    console.log(`summary: ${tally.PASS} PASS, ${tally.SKIP} SKIP, ${tally.FAIL} FAIL${failed ? ' — a FAIL means this machine/pipeline is not trustworthy on this file; fix it before real runs' : ' — pipeline healthy on this file'}`);
    return failed ? 1 : 0;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- selftest

async function cmdSelftest() {
  const fails = [];
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  };
  const tmp = path.join(os.tmpdir(), `clipcut-selftest-${Date.now()}.env`);
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
  // validateQuestions: API limits enforced locally (<=64 questions, score 2-10 levels, choice 2-255 options).
  const manyQ = { questions: {}, escalate_only: [] };
  for (let i = 0; i < 65; i++) { manyQ.questions[`q${i}`] = { type: 'noul', instructions: 'x' }; manyQ.escalate_only.push(`q${i}`); }
  eq('validateQuestions rejects >64 questions', /at most 64/.test(vqMsg(manyQ)), true);
  eq('validateQuestions rejects score >10 levels', /10 levels/.test(vqMsg({ questions: { a: { type: 'score', instructions: 'x', criteria: Array.from({ length: 11 }, (_, i) => `lvl${i}`) } }, escalate_only: ['a'] })), true);
  eq('validateQuestions rejects 1-option choice', /2-255 options/.test(vqMsg({ questions: { a: { type: 'choice', instructions: 'x', criteria: { only: 'x' } } }, escalate_only: ['a'] })), true);
  eq('validateQuestions accepts 255-option choice', vqMsg({ questions: { a: { type: 'choice', instructions: 'x', criteria: Object.fromEntries(Array.from({ length: 255 }, (_, i) => [`o${i}`, 'x'])) } }, escalate_only: ['a'] }), '');
  // arg parser: value flags demand a value; clean exit-2 error shape.
  const argMsg = (argv) => { try { parseArgs(argv); return ''; } catch (e) { return e.message; } };
  eq('arg parser missing value errors', /--questions requires a value/.test(argMsg(['rate', '--questions'])), true);
  eq('arg parser flags out value too', /--out requires a value/.test(argMsg(['probe', 'v.mp4', '--out', '--yes'])), true);
  eq('arg parser collects values', parseArgs(['probe', 'v.mp4', '--out', 'x.json']).out, 'x.json');
  eq('arg parser bare boolean flag', parseArgs(['cut', 'v.mp4', '--plan', 'p.json', '--yes']).yes, true);
  // URL builder: the FULL model id appears exactly once.
  eq('url builder single model id', runUrl('acc123', '@cf/cloudflare/clef-flash'), 'https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/@cf/cloudflare/clef-flash');
  eq('token estimate caps at 1024', estTokensPerFrame(3840, 2160), 1024);
  eq('token estimate fallback', estTokensPerFrame(null, null), 600);
  eq('token estimate 960px frame is 513', estTokensPerFrame(960, 540), 513);
  // probe parsers.
  const sceneStderr = [
    'frame:28   pts:1120    pts_time:1.12',
    'lavfi.scene_score=0.000000',
    'frame:29   pts:1160    pts_time:1.16',
    'lavfi.scene_score=0.040000',
    'frame:30   pts:1200    pts_time:1.2',
    'lavfi.scene_score=0.834512',
  ].join('\n');
  eq('scene parser pairs pts_time with score', parseSceneMetadata(sceneStderr), [{ t: 1.12, score: 0 }, { t: 1.16, score: 0.04 }, { t: 1.2, score: 0.834512 }]);
  eq('scene parser ignores other metadata', parseSceneMetadata('frame:1 pts:40 pts_time:0.04\nlavfi.other=1\n'), []);
  eq('scene maxima keeps local peaks', sceneMaxima(parseSceneMetadata(sceneStderr), 0.03), [1.2]);
  eq('scene maxima threshold filters', sceneMaxima(parseSceneMetadata(sceneStderr), 0.9), []);
  const manyScenes = [0, 0.1, 0.9, 0.2, 0.85, 0.1, 0.7, 0.05].map((score, t) => ({ t, score }));
  eq('scene maxima multiple peaks sorted', sceneMaxima(manyScenes, 0.4), [2, 4, 6]);
  eq('scene maxima top-N cap', sceneMaxima(manyScenes, 0.4, 2), [2, 4]);
  const silenceStderr = [
    '[silencedetect @ 0x7fa] silence_start: 19.92',
    '[silencedetect @ 0x7fa] silence_end: 40.06 | silence_duration: 20.14',
    '[silencedetect @ 0x7fa] silence_start: 55.5',
  ].join('\n');
  eq('silence parser pairs start/end + duration', parseSilences(silenceStderr), [{ start: 19.92, end: 40.06, duration: 20.14 }, { start: 55.5, end: null }]);
  eq('silence parser empty', parseSilences('no markers here'), []);
  const loudnormStderr = '[Parsed_loudnorm_0 @ 0x7f8] \n{\n\t"input_i" : "-23.42",\n\t"input_tp" : "-8.61",\n\t"input_lra" : "0.10",\n\t"input_thresh" : "-33.92"\n}\n';
  eq('loudnorm json parser', parseLoudnormJson(loudnormStderr), { I: -23.42, TP: -8.61, LRA: 0.1, threshold: -33.92 });
  eq('loudnorm parser rejects garbage', parseLoudnormJson('nothing here'), null);
  const eburStderr = '[Parsed_ebur128_0 @ 0x7f8] Summary:\n\n  Integrated loudness:\n    I:         -23.4 LUFS\n    Threshold: -33.2 LUFS\n\n  True peak:\n    Peak:      -8.6 dBFS\n';
  eq('ebur128 parser extracts I and peak', parseEbur128(eburStderr), { I: -23.4, TP: -8.6, LRA: null, threshold: null });
  eq('ebur128 parser rejects garbage', parseEbur128('no summary'), null);
  const packetsStderr = '[PACKET]\npts_time=0.000000\nflags=K__\n[/PACKET]\n[PACKET]\npts_time=1.666667\nflags=__\n[/PACKET]\n[PACKET]\npts_time=N/A\nflags=K__\n[/PACKET]\n[PACKET]\npts_time=3.333333\nflags=K__\n[/PACKET]\n';
  eq('keyframe parser picks K flags (ceil to next ms)', parseKeyframes(packetsStderr), [0, 3.334]);
  eq('keyframe parser empty', parseKeyframes(''), []);
  // segments builder.
  const synth = { duration: 100, scene_changes: [20, 40, 60], silences: [{ start: 30, end: 32 }, { start: 50, end: 52 }], scenes: [{ t: 20, score: 0.9 }, { t: 40, score: 0.8 }], loudness: { I: -14, TP: -1.5 } };
  const built = buildSegments(synth, { min: 15, max: 30, count: 10 });
  const boundSet = [0, 20, 32, 40, 52, 60, 100];
  eq('segments all within [min,max]', built.segments.every((s) => s.duration >= 15 - 0.05 && s.duration <= 30 + 0.05), true);
  eq('segments boundaries respected', built.segments.every((s) => boundSet.includes(s.start) && boundSet.includes(s.end)), true);
  eq('segments count cap', buildSegments(synth, { min: 15, max: 30, count: 2 }).segments.length, 2);
  eq('segments ids assigned', buildSegments(synth, { min: 15, max: 30, count: 2 }).segments.map((s) => s.id), ['seg_001', 'seg_002']);
  const whole = buildSegments({ duration: 50, scene_changes: [], silences: [], scenes: [] }, { min: 15, max: 90, count: 10 });
  eq('segments whole video when shorter than max', whole.segments, [{ id: 'seg_001', rank: 1, start: 0, end: 50, duration: 50, score: 0, signals: { scenes: 0, silence_cut: false } }]);
  const silCut = built.segments.find((s) => s.start === 32);
  eq('segments silence_cut at silence end', silCut && silCut.signals.silence_cut, true);
  eq('segments no duration', buildSegments({}, { min: 15, max: 90 }).segments, []);
  // duration-error classifier.
  eq('duration error within tolerance', classifyDuration(15.02, 15, 0.5), { error_ms: 20, within: true });
  eq('duration error over tolerance', classifyDuration(16.2, 15, 0.5), { error_ms: 1200, within: false });
  eq('duration error missing values', classifyDuration(NaN, 15, 0.5), { error_ms: null, within: false });
  // plan validator.
  const badPlan = validatePlan({ clips: [{ slug: 'a b', start: 10, end: 5 }] });
  eq('plan rejects bad slug and start>=end', badPlan.errors.length >= 2, true);
  eq('plan rejects non-array', validatePlan({ clips: 'x' }).errors.length > 0, true);
  eq('plan accepts good plan', validatePlan({ clips: [{ slug: 'ok_clip', start: 0, end: 30 }] }), { errors: [], warnings: [] });
  eq('plan warns outside 5-600s', validatePlan({ clips: [{ slug: 'ok', start: 0, end: 601 }] }).warnings.length, 1);
  eq('plan rejects duplicate slugs', validatePlan({ clips: [{ slug: 'a', start: 0, end: 10 }, { slug: 'a', start: 20, end: 30 }] }).errors.length, 1);
  eq('plan warns when end beyond source duration', validatePlan({ clips: [{ slug: 'ok', start: 0, end: 30 }] }, 20).warnings.length, 1);
  const unkPlat = validatePlan({ clips: [{ slug: 'ok', start: 0, end: 30, platforms: ['nope'] }] });
  eq('plan accepts unknown platform with warning', [unkPlat.errors.length, unkPlat.warnings.length], [0, 1]);
  eq('plan unknown platform maps to creator profile', /mapping unknown platform 'nope' to the generic creator profile/.test(unkPlat.warnings[0]), true);
  // plan per-clip durations + total.
  eq('plan durations and total', planDurations([{ slug: 'a', start: 0, end: 10 }, { slug: 'b', start: 20, end: 30.5 }, { slug: 'bad', start: 5, end: 5 }]), { durations: [10, 10.5, null], total: 20.5 });
  // even-split: N equal mechanical divisions.
  const es = evenSplitSegments(100, 4);
  eq('even split count', es.length, 4);
  eq('even split math', es.map((s) => [s.start, s.end, s.duration]), [[0, 25, 25], [25, 50, 25], [50, 75, 25], [75, 100, 25]]);
  eq('even split flagged mechanical', es.every((s) => s.mechanical === true), true);
  const esSig = evenSplitSegments(100, 2, { sceneChanges: [60], silences: [{ start: 49.5, end: 50.2 }] });
  eq('even split signals computed', [esSig[0].signals.scenes, esSig[1].signals.scenes, esSig[1].signals.silence_cut], [0, 1, true]);
  // bounded 9:16 crop math: the window never exceeds the frame, any aspect fills 1080x1920.
  eq('crop target portrait 720x1600', cropTarget(720, 1600), { width: 720, height: 1280 });
  eq('crop target landscape 1920x1080', cropTarget(1920, 1080), { width: 607.5, height: 1080 });
  eq('crop target square 1080x1080', cropTarget(1080, 1080), { width: 607.5, height: 1080 });
  eq('crop target invalid dims', cropTarget(0, 100), { width: null, height: null });
  // boundary scorer: max window score + scene-change proximity.
  eq('boundary scan near edge', boundaryScan([{ t: 9.5, score: 0.1 }, { t: 9.8, score: 0.9 }], 10), { scene_score_max: 0.9, scene_change_near: true });
  eq('boundary scan not near edge', boundaryScan([{ t: 8.8, score: 0.95 }], 10), { scene_score_max: 0.95, scene_change_near: false });
  eq('boundary scan low scores not changes', boundaryScan([{ t: 9.9, score: 0.1 }], 10), { scene_score_max: 0.1, scene_change_near: false });
  eq('boundary scan empty window', boundaryScan([], 10), { scene_score_max: null, scene_change_near: false });
  // keyframe snap for copy-mode start_error_ms.
  eq('keyframe at or before picks latest', keyframeAtOrBefore([0, 2, 4, 6], 3.1), 2);
  eq('keyframe at or before exact', keyframeAtOrBefore([0, 2, 4], 2), 2);
  eq('keyframe at or before none', keyframeAtOrBefore([5, 6], 3), null);
  // platform warn rules.
  eq('platform x over 140s warns', platformWarnings('x', 150, {}, 'original').length >= 1, true);
  eq('platform x at 140s silent', platformWarnings('x', 140, {}, 'original').length, 0);
  eq('platform shorts over 180s warns', platformWarnings('shorts', 181, { width: 1080, height: 1920 }, 'original').length, 1);
  eq('platform youtube has no duration warn', platformWarnings('youtube', 200, { width: 1920, height: 1080 }, 'original').length, 0);
  eq('platform shorts warns when not 9:16', platformWarnings('shorts', 60, { width: 640, height: 360 }, 'original').length, 1);
  eq('platform shorts silent when 9:16', platformWarnings('shorts', 60, { width: 1080, height: 1920 }, '9x16-crop').length, 0);
  // per-platform duration wording (verified caps as fact, community limits hedged).
  eq('platform shorts warn text', platformWarnings('shorts', 181, { width: 1080, height: 1920 }, 'original')[0], 'duration 181s exceeds the 3-minute YouTube Shorts cap (verified)');
  eq('platform tiktok silent at 181s', platformWarnings('tiktok', 181, { width: 1080, height: 1920 }, 'original').length, 0);
  eq('platform tiktok warns from 570s', platformWarnings('tiktok', 570, { width: 1080, height: 1920 }, 'original')[0], 'duration 570s may exceed community-reported TikTok upload limits (unverified; standard uploads allow up to ~10 min)');
  eq('platform reels warn text', platformWarnings('reels', 181, { width: 1080, height: 1920 }, 'original')[0], 'duration 181s may exceed the community-reported 3-minute Reels limit (unverified)');
  eq('platform creator warn text', platformWarnings('creator', 91, { width: 1080, height: 1920 }, 'original')[0], 'duration 91s exceeds the 60–90s generic creator-platform guidance');
  eq('platform x warn text', platformWarnings('x', 141, {}, 'original')[0], 'duration 141s may exceed the community-reported 140s X free-tier limit (unverified; Premium allows up to 4h)');
  eq('platform tiktok at 569s silent', platformWarnings('tiktok', 569, { width: 1080, height: 1920 }, 'original').length, 0);
  // export naming.
  eq('export name format', exportName('my-clip', 'shorts', '9x16-crop'), 'my-clip_shorts_9x16-crop.mp4');
  eq('export name sanitizes slug', exportName('My Clip!.mp4', 'x', 'original'), 'My-Clip-_x_original.mp4');
  eq('sanitize slug fallback', sanitizeSlug('!!!'), 'clip');
  // platform specs: one table entry per platform id, judgement rows come from it.
  eq('platform specs cover every id', PLATFORMS.every((p) => PLATFORM_SPECS[p] && PLATFORM_SPECS[p].duration && PLATFORM_SPECS[p].aspects), true);
  eq('platform specs marks', PLATFORMS.map((p) => PLATFORM_SPECS[p].duration.mark), ['verified', 'verified', 'community', 'community', 'community', 'guidance']);
  eq('platform specs caps', PLATFORMS.map((p) => PLATFORM_SPECS[p].duration.cap), [null, 180, 600, 180, 140, 90]);
  eq('platform specs vertical flags', PLATFORMS.map((p) => PLATFORM_SPECS[p].aspects.vertical), [false, true, true, true, false, true]);
  // keep-span builder (tighten): margins, merging, min-keep, leading/trailing silence.
  const r1 = buildKeepSpans(20, [{ start: 10, end: 12 }], { margin: 0.15, minKeep: 0.2 });
  eq('keepspans margin keeps silence each side', r1.keep, [[0, 10.15], [11.85, 20]]);
  eq('keepspans one cut + removed total', [r1.cuts, r1.removedS], [1, 1.7]);
  eq('keepspans overlapping silences merge', buildKeepSpans(20, [{ start: 8, end: 10 }, { start: 9.5, end: 12 }], { margin: 0, minKeep: 0.2 }).keep, [[0, 8], [12, 20]]);
  // fadeJoin semantics: translate the ffmpeg expression (if/between) to JS and
  // evaluate it the way ffmpeg would (between inclusive, first-matching if-branch wins).
  {
    const between = (v, a, b) => v >= a && v <= b;
    const splitArgs = (s) => { const out = []; let d = 0; let cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
    const toJs = (s) => {
      s = s.trim();
      if (s.startsWith('if(') && s.endsWith(')')) { const a = splitArgs(s.slice(3, -1)); return `(${toJs(a[0])} ? ${toJs(a[1])} : ${toJs(a[2])})`; }
      if (s.startsWith('between(') && s.endsWith(')')) { const a = splitArgs(s.slice(8, -1)); return `between(${a.map(toJs).join(',')})`; }
      return s;
    };
    const gainAt = (expr, t) => Function('t', 'between', `'use strict'; return (${toJs(expr)});`)(t, between);
    const j = fadeJoinExpr(10, 0.03);
    eq('fadejoin gain 1 far before the join', gainAt(j, 0), 1);
    eq('fadejoin gain 1 far after the join', gainAt(j, 20), 1);
    eq('fadejoin gain 0 at the join center', gainAt(j, 10), 0);
    eq('fadejoin gain ~1 at the outer edge before', Math.abs(gainAt(j, 10 - 0.03) - 1) < 1e-9, true);
    eq('fadejoin gain ~1 at the outer edge after', Math.abs(gainAt(j, 10 + 0.03) - 1) < 1e-9, true);
    eq('fadejoin gain ~0.5 at the ramp midpoints', Math.abs(gainAt(j, 10 - 0.015) - 0.5) < 1e-9 && Math.abs(gainAt(j, 10 + 0.015) - 0.5) < 1e-9, true);
    const j2 = fadeJoinExpr(20, 0.03);
    eq('fadejoin chained joins do not interfere', gainAt(j2, 0) * gainAt(j, 9.985) > 0.4, true); // join at 20 leaves join-at-10's window untouched
  }
  eq('parseVolumedetect max-only line', parseVolumedetect('max_volume: -91.0 dB').max, -91.0);
  eq('keepspans silence fully eaten by margins removes nothing', buildKeepSpans(20, [{ start: 10, end: 10.2 }], { margin: 0.15, minKeep: 0.2 }), { keep: [[0, 20]], cuts: 0, removedS: 0 });
  eq('keepspans null end means silent to EOF', buildKeepSpans(10, [{ start: 8, end: null }], { margin: 0.15, minKeep: 0.2 }).keep, [[0, 8.15]]);
  const tiny = buildKeepSpans(20, [{ start: 5, end: 5.4 }, { start: 5.6, end: 6 }], { margin: 0, minKeep: 0.25 });
  eq('keepspans drops keeps shorter than min-keep', tiny.keep, [[0, 5], [6, 20]]);
  eq('keepspans dropped keep merges its removals', tiny.cuts, 1);
  const edges = buildKeepSpans(20, [{ start: 0, end: 2 }, { start: 18, end: 20 }], { margin: 0.15, minKeep: 0.2 });
  eq('keepspans leading+trailing silence (margin keeps get dropped)', edges.keep, [[1.85, 18.15]]);
  eq('keepspans leading+trailing count 2 cuts', edges.cuts, 2);
  // threshold suggestion: mean + 6 dB, capped at -5.
  eq('suggest threshold mean+6', suggestThreshold(-20), -14);
  eq('suggest threshold caps at -5', suggestThreshold(-2), -5);
  eq('suggest threshold exactly at cap', suggestThreshold(-11), -5);
  eq('suggest threshold unknown mean', suggestThreshold(null), null);
  // keyframe bracketing (nearest_keyframes).
  eq('bracket keyframes middle', bracketKeyframes([0, 2, 4, 6], 3.1), { before: 2, after: 4 });
  eq('bracket keyframes exact hit', bracketKeyframes([0, 2, 4], 2), { before: 2, after: 2 });
  eq('bracket keyframes past end', bracketKeyframes([0, 2, 4], 10), { before: 4, after: null });
  eq('bracket keyframes before start', bracketKeyframes([2, 4], 1), { before: null, after: 2 });
  eq('bracket keyframes empty map', bracketKeyframes([], 5), { before: null, after: null });
  // volumedetect parser.
  eq('volumedetect parser', parseVolumedetect('[Parsed_volumedetect_0 @ 0x1] mean_volume: -23.4 dB | max_volume: -8.6 dB'), { mean: -23.4, max: -8.6 });
  eq('volumedetect parser rejects garbage', parseVolumedetect('nothing'), null);
  // atomic temp naming.
  eq('temp sibling name', tempSiblingName('out.mp4', 'abc123'), '.out.tmp-abc123.mp4');
  eq('temp sibling name unique per rand', tempSiblingName('out.mp4', 'a') !== tempSiblingName('out.mp4', 'b'), true);
  eq('temp sibling keeps the media extension', tempSiblingName('hook.mp4').endsWith('.mp4'), true);
  eq('temp sibling matches the cleanup pattern', TEMP_OUTPUT_RE.test(tempSiblingName('out.mp4')), true);
  // check-row builder on synthetic facts.
  const goodFacts = {
    file: 'hook_shorts_9x16-crop.mp4', duration: 58.2, width: 1080, height: 1920, fps: 30, vfr: false,
    videoCodec: 'h264', pixFmt: 'yuv420p', hasAudio: true, audioCodec: 'aac', audioSampleRate: 48000,
    faststart: true, loudness: { I: -14.2, TP: -2.1 }, silentAudio: false, audioMaxDb: -3.2, sizeBytes: 8 * 1024 * 1024,
  };
  const goodRows = buildCheckRows(goodFacts, { platform: 'shorts' });
  eq('check compliant file all PASS', goodRows.every((r) => r.status === 'PASS'), true);
  eq('check judgement kinds', goodRows.filter((r) => r.kind === 'judgement').map((r) => r.check).sort(), ['aspect', 'duration', 'loudness']);
  eq('check format kinds present', ['codec', 'faststart', 'pix_fmt', 'resolution', 'silent_audio'].every((c) => goodRows.some((r) => r.kind === 'format' && r.check === c)), true);
  const badFacts = { ...goodFacts, duration: 200, width: 640, height: 360 };
  const badRows = buildCheckRows(badFacts, { platform: 'shorts' });
  const durRow = badRows.find((r) => r.check === 'duration');
  const aspRow = badRows.find((r) => r.check === 'aspect');
  eq('check duration FAIL is judgement', [durRow.status, durRow.kind, durRow.reason], ['FAIL', 'judgement', 'duration 200s exceeds the 3-minute YouTube Shorts cap (verified)']);
  eq('check duration fix names the command', /^clipcut cut <source> --plan clips.json/.test(durRow.fix), true);
  eq('check aspect FAIL with crop fix', [aspRow.status, aspRow.kind, aspRow.fix], ['FAIL', 'judgement', 'clipcut export hook_shorts_9x16-crop.mp4 --platform shorts --variant 9x16-crop']);
  const noPlat = buildCheckRows(badFacts, {});
  const nd = noPlat.find((r) => r.check === 'duration');
  const na = noPlat.find((r) => r.check === 'aspect');
  eq('check without platform downgrades judgement rows', [nd.status, na.status], ['WARN', 'WARN']);
  eq('check without platform still has format rows enforcing', noPlat.filter((r) => r.kind === 'format').some((r) => r.check === 'codec'), true);
  const fsBad = buildCheckRows({ ...goodFacts, faststart: false }, { platform: 'shorts' }).find((r) => r.check === 'faststart');
  eq('check faststart FAIL stays FAIL without platform', [fsBad.status, fsBad.fix], ['FAIL', 'clipcut export hook_shorts_9x16-crop.mp4 --platform shorts --variant original']);
  const unmeasurableFacts = { file: 'x.mp4', duration: null, width: null, height: null, fps: null, vfr: false, videoCodec: null, pixFmt: null, hasAudio: false, audioCodec: null, audioSampleRate: null, faststart: null, loudness: null, silentAudio: null, audioMaxDb: null, sizeBytes: null };
  const unRows = buildCheckRows(unmeasurableFacts, { platform: 'shorts' });
  eq('check unmeasurable never PASS', unRows.some((r) => r.status === 'PASS'), false);
  eq('check unmeasurable all WARN with reason', unRows.every((r) => r.status === 'WARN' && /^could not measure/.test(r.reason)), true);
  const noAudio = buildCheckRows({ ...goodFacts, hasAudio: false, audioCodec: null, audioSampleRate: null, loudness: null, silentAudio: null }, { platform: 'shorts' });
  eq('check no-audio rows warn could not measure', noAudio.filter((r) => ['audio', 'audio_sample_rate', 'loudness', 'silent_audio'].includes(r.check)).every((r) => r.status === 'WARN' && r.reason.includes('could not measure')), true);
  const loudBad = buildCheckRows({ ...goodFacts, loudness: { I: -2, TP: 0.5 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check loudness extreme FAIL with loudnorm fix', [loudBad.status, loudBad.kind, loudBad.fix.includes('--loudnorm')], ['FAIL', 'judgement', true]);
  const loudBadNoPlat = buildCheckRows({ ...goodFacts, loudness: { I: -2, TP: 0.5 } }, {}).find((r) => r.check === 'loudness');
  eq('check loudness downgrades without platform', loudBadNoPlat.status, 'WARN');
  const silent = buildCheckRows({ ...goodFacts, silentAudio: true, audioMaxDb: -91 }, { platform: 'shorts' }).find((r) => r.check === 'silent_audio');
  eq('check silent audio FAIL', silent.status, 'FAIL');
  const vfrRow = buildCheckRows({ ...goodFacts, vfr: true }, { platform: 'shorts' }).find((r) => r.check === 'fps');
  eq('check vfr is a format WARN', [vfrRow.status, vfrRow.kind], ['WARN', 'format']);
  const oddRow = buildCheckRows({ ...goodFacts, width: 1081 }, { platform: 'shorts' }).find((r) => r.check === 'resolution');
  eq('check odd resolution FAIL format', [oddRow.status, oddRow.kind], ['FAIL', 'format']);
  // per-platform judgement classification: every platform yields judgement duration+aspect rows.
  eq('check all platforms classify duration/aspect judgement', PLATFORMS.every((p) => {
    const rs = buildCheckRows(goodFacts, { platform: p });
    return ['duration', 'aspect'].every((c) => { const r = rs.find((x) => x.check === c); return r && r.kind === 'judgement'; });
  }), true);
  const yt = buildCheckRows({ ...goodFacts, duration: 4000, width: 1920, height: 1080 }, { platform: 'youtube' });
  eq('check youtube long 16:9 passes duration', yt.find((r) => r.check === 'duration').status, 'PASS');
  eq('check youtube 16:9 aspect passes', yt.find((r) => r.check === 'aspect').status, 'PASS');
  const tt = buildCheckRows({ ...goodFacts, duration: 580 }, { platform: 'tiktok' }).find((r) => r.check === 'duration');
  eq('check tiktok 580s in the warn zone', tt.status, 'WARN');
  const ttOver = buildCheckRows({ ...goodFacts, duration: 650 }, { platform: 'tiktok' }).find((r) => r.check === 'duration');
  eq('check tiktok 650s WARN (community cap reported, not enforced)', [ttOver.status, ttOver.reason, ttOver.note.includes('reported, not enforced')], ['WARN', 'duration 650s may exceed community-reported TikTok upload limits (unverified; standard uploads allow up to ~10 min)', true]);
  // rotation: streamRotation parses the side_data_list Display Matrix entry; ±90/±270
  // swap width/height for display dims; 0/180/absent never swap.
  eq('streamRotation display matrix -90', streamRotation({ side_data_list: [{ side_data_type: 'Display Matrix', rotation: -90 }] }), -90);
  eq('streamRotation string value parses', streamRotation({ side_data_list: [{ side_data_type: 'Display Matrix', rotation: '270' }] }), -90);
  eq('streamRotation zero is null', streamRotation({ side_data_list: [{ side_data_type: 'Display Matrix', rotation: 0 }] }), null);
  eq('streamRotation absent is null', streamRotation({}), null);
  eq('streamRotation no list is null', streamRotation({ side_data_list: 'nope' }), null);
  eq('displayDims swap at -90', displayDimsForRotation(640, 360, -90), { width: 360, height: 640, rotated: true });
  eq('displayDims swap at 270', displayDimsForRotation(1920, 1080, 270), { width: 1080, height: 1920, rotated: true });
  eq('displayDims no swap at 180', displayDimsForRotation(640, 360, 180), { width: 640, height: 360, rotated: false });
  eq('displayDims no swap without rotation', displayDimsForRotation(640, 360, null), { width: 640, height: 360, rotated: false });
  eq('displayDims invalid width stays null (no swap)', displayDimsForRotation(0, 360, -90), { width: null, height: 360, rotated: false });
  // rotation-aware aspect: a coded 1920x1080 file with -90 rotation metadata DISPLAYS
  // 1080x1920 — PASS against a vertical platform with the rotation note (was a false FAIL).
  const rotFacts = { ...goodFacts, width: 1080, height: 1920, rotation: -90 };
  const rotRow = buildCheckRows(rotFacts, { platform: 'shorts' }).find((r) => r.check === 'aspect');
  eq('check aspect PASS on rotated file', [rotRow.status, /displays 1080x1920 after rotation metadata \(-90deg\)/.test(rotRow.note)], ['PASS', true]);
  const rotFacts2 = { ...goodFacts, width: 360, height: 640, rotation: -90 };
  const rotRow2 = buildCheckRows(rotFacts2, { platform: 'shorts' }).find((r) => r.check === 'aspect');
  eq('check rotated portrait aspect PASS note', [rotRow2.status, rotRow2.note.includes('displays 360x640 after rotation metadata')], ['PASS', true]);
  // resolution cap: informational judgement WARN (never FAIL) where the table marks a max.
  const overRes = buildCheckRows({ ...goodFacts, width: 1440, height: 2560 }, { platform: 'shorts' }).find((r) => r.check === 'resolution_cap');
  eq('check over-1080p shorts is judgement WARN', [overRes.status, overRes.kind, overRes.reason.includes('verified'), overRes.reason.includes('1440')], ['WARN', 'judgement', true, true]);
  const overResX = buildCheckRows({ ...goodFacts, width: 1440, height: 2560 }, { platform: 'x' }).find((r) => r.check === 'resolution_cap');
  eq('check over-1080p x is judgement WARN', [overResX.status, overResX.kind], ['WARN', 'judgement']);
  const overResTt = buildCheckRows({ ...goodFacts, width: 2160, height: 3840 }, { platform: 'tiktok' }).find((r) => r.check === 'resolution_cap');
  eq('check tiktok 4K informational WARN mentions compression', [overResTt.status, /4K uploads get compressed/.test(overResTt.reason)], ['WARN', true]);
  eq('check no resolution_cap row at/below cap', buildCheckRows(goodFacts, { platform: 'shorts' }).some((r) => r.check === 'resolution_cap'), false);
  eq('check youtube has no resolution_cap row', buildCheckRows({ ...goodFacts, width: 2160, height: 3840 }, { platform: 'youtube' }).some((r) => r.check === 'resolution_cap'), false);
  eq('check over-res needs a platform with a marked cap', buildCheckRows({ ...goodFacts, width: 1440, height: 2560 }, {}).some((r) => r.check === 'resolution_cap'), false);
  // loudness: quiet side is a WARN with the honest wording + loudnorm fix; only
  // clipping (TP>0) and over-loud (I>-2) hard-FAIL.
  const quiet = buildCheckRows({ ...goodFacts, loudness: { I: -30, TP: -20 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check quiet master WARN not FAIL', [quiet.status, quiet.reason.includes('no platform documents -14'), quiet.reason.includes('quiet master'), /--loudnorm$/.test(quiet.fix)], ['WARN', true, true, true]);
  const clip0 = buildCheckRows({ ...goodFacts, loudness: { I: -30, TP: 0.5 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check clipping TP>0 still FAILs', [clip0.status, clip0.reason.includes('clipping')], ['FAIL', true]);
  const overLoud = buildCheckRows({ ...goodFacts, loudness: { I: -1.5, TP: -3 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check over-loud I>-2 still FAILs', [overLoud.status, overLoud.reason.includes('over-loud')], ['FAIL', true]);
  const mildLoud = buildCheckRows({ ...goodFacts, loudness: { I: -6, TP: -2 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check mild loud-side deviation is WARN', mildLoud.status, 'WARN');
  const mildQuiet = buildCheckRows({ ...goodFacts, loudness: { I: -18, TP: -6 } }, { platform: 'shorts' }).find((r) => r.check === 'loudness');
  eq('check within 6 LU still PASS', mildQuiet.status, 'PASS');
  // size row: a cap with an unmeasurable size is a WARN, not an absent row.
  const sizeUnknown = buildCheckRows({ ...goodFacts, sizeBytes: null }, { platform: 'reels' }).find((r) => r.check === 'size');
  eq('check size unknown under a cap is WARN', [sizeUnknown.status, sizeUnknown.reason], ['WARN', 'could not measure (size unknown)']);
  eq('check size row absent without a cap', buildCheckRows({ ...goodFacts, sizeBytes: null }, { platform: 'shorts' }).some((r) => r.check === 'size'), false);
  // crop anchors: clean rejections outside [0,1]; byte-identical default filter; anchor math.
  const anchorMsg = (raw) => { try { cropAnchor(raw, 'crop-x'); return ''; } catch (e) { return e.message; } };
  eq('crop anchor rejects 1.5', /--crop-x must be a number between 0 and 1/.test(anchorMsg('1.5')), true);
  eq('crop anchor rejects -0.1', anchorMsg('-0.1') !== '', true);
  eq('crop anchor rejects junk', anchorMsg('middle') !== '', true);
  eq('crop anchor accepts 0 and 1', [cropAnchor('0', 'crop-x'), cropAnchor('1', 'crop-y')], [0, 1]);
  eq('crop anchor default when absent', [cropAnchor(null, 'crop-x'), cropAnchor(undefined, 'crop-y')], [0.5, 0.5]);
  eq('crop filter default anchors byte-identical', cropAnchorFilter(0.5, 0.5), "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,setsar=1");
  eq('crop filter anchored right/bottom', cropAnchorFilter(1, 1), "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-min(iw,ih*9/16))*1':'(ih-min(ih,iw*16/9))*1',scale=1080:1920,setsar=1");
  eq('crop filter anchored left/top', cropAnchorFilter(0, 0), "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-min(iw,ih*9/16))*0':'(ih-min(ih,iw*16/9))*0',scale=1080:1920,setsar=1");
  eq('crop filter one-sided anchor keeps full expression', cropAnchorFilter(0.25, 0.5), "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-min(iw,ih*9/16))*0.25':'(ih-min(ih,iw*16/9))*0.5',scale=1080:1920,setsar=1");
  // fingerprints: known-value hash anchors + window math + match logic.
  const SHA_EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const SHA_HELLO = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
  eq('sha256 known vector (empty)', sha256Hex(Buffer.alloc(0)), SHA_EMPTY);
  eq('sha256 known vector (hello)', sha256Hex(Buffer.from('hello')), SHA_HELLO);
  eq('headTailHash small buffer hashes whole twice', headTailHash(Buffer.from('hello')), `${SHA_HELLO}:${SHA_HELLO}`);
  eq('headTailHash empty buffer', headTailHash(Buffer.alloc(0)), `${SHA_EMPTY}:${SHA_EMPTY}`);
  eq('headTailHash window math (region 5 of 11 bytes)', headTailHash(Buffer.from('hello world'), 5), `${sha256Hex(Buffer.from('hello'))}:${sha256Hex(Buffer.from('world'))}`);
  eq('headTailHash window math (region 2 of 5 bytes)', headTailHash(Buffer.from('hello'), 2), `${sha256Hex(Buffer.from('he'))}:${sha256Hex(Buffer.from('lo'))}`);
  const fpTmp = path.join(os.tmpdir(), `clipcut-selftest-fp-${Date.now()}.bin`);
  fs.writeFileSync(fpTmp, Buffer.from('hello world'));
  const fp = fingerprintFile(fpTmp);
  fs.unlinkSync(fpTmp);
  eq('fingerprintFile size + head/tail pair', [fp.size, fp.sha256_head_tail], [11, `${sha256Hex(Buffer.from('hello world'))}:${sha256Hex(Buffer.from('hello world'))}`]);
  eq('fingerprintsMatch identical true', fingerprintsMatch(fp, { size: 11, sha256_head_tail: fp.sha256_head_tail }), true);
  eq('fingerprintsMatch size differs false', fingerprintsMatch(fp, { size: 12, sha256_head_tail: fp.sha256_head_tail }), false);
  eq('fingerprintsMatch hash differs false', fingerprintsMatch(fp, { size: 11, sha256_head_tail: `${SHA_HELLO}:${SHA_HELLO}` }), false);
  eq('fingerprintsMatch absent side null', fingerprintsMatch(fp, null), null);
  eq('fingerprintsMatch empty object null', fingerprintsMatch(fp, {}), null);
  // verify step-runner: fail flips the verdict and cascades skips with reasons.
  const vr = await runVerifySteps([
    { name: 'ok', fn: async () => {} },
    { name: 'skipped', fn: async () => ({ skip: 'because' }) },
    { name: 'boom', fn: async () => { throw new Error('boom'); } },
    { name: 'after', fn: async () => {} },
  ]);
  eq('verify runner rows classify', vr.rows.map((r) => [r.name, r.status]), [['ok', 'PASS'], ['skipped', 'SKIP'], ['boom', 'FAIL'], ['after', 'SKIP']]);
  eq('verify runner skip carries reason', vr.rows[1].reason, 'because');
  eq('verify runner fail carries reason', vr.rows[2].reason, 'boom');
  eq('verify runner cascade names the failed step', vr.rows[3].reason, 'earlier step failed: boom');
  eq('verify runner failed flag flips exit', vr.failed, true);
  const vrOk = await runVerifySteps([{ name: 'ok', fn: async () => ({ note: 'detail' }) }]);
  eq('verify runner all-pass is not failed', [vrOk.failed, vrOk.rows[0].note], [false, 'detail']);
  if (fails.length) { console.error(`\nselftest: ${fails.length} failure(s)`); return 2; }
  console.log('\nselftest: all checks passed');
  return 0;
}

// ---------------------------------------------------------------- help + dispatch

const HELP = `clipcut.mjs — cut long videos into social/creator clips: free local analysis first,
Cloudflare CLEF (decisions) + CLAIRIC (extraction) second, verified ffmpeg cutting and
platform export last.

Usage: node clipcut.mjs <command> [options]
Exit codes: 0 = pass/ok; 1 = attention needed (failed/escalated ratings, cut duration
errors, platform spec warnings, check FAIL rows); 2 = error (fix hint on stderr).

Pipeline: probe (free) -> segments (free) -> sheets (free) -> rate (CLEF, paid) ->
cut (free) -> tighten (free, optional) -> export (free) -> check (free, final gate)
-> preview (free). read (OCR/CLAIRIC) adds burned-in text. Typical loop: probe once,
segments+sheets, rate the sheets, keep the winners as a clips.json plan, then
cut/tighten/export/check/preview those. cut, export and tighten write their media
ATOMICALLY: a verified hidden temp file is renamed over the output only after it
passes a post-write probe (duration / faststart box walk), so a failed encode never
replaces good output with a broken file. probe records a per-file fingerprint
(size + head/tail sha256) that cut can check (--strict refuses a swapped source).
verify <video> runs the whole local pipeline on a real file as a self-test.

Commands:
  doctor [--ping]
                       Node, env vars (set/missing + which file each came from), ffmpeg
                       (CLEFCUT_FFMPEG env -> @remotion/compositor-* -> PATH), OCR engines,
                       AI gateway. --ping adds ONE clef-flash question (the only network
                       call anywhere in doctor).
  probe <video> [--out probe.json] [--scene-threshold 0.4]
                       FREE, local only. Scene scores (ffmpeg select + metadata=print
                       written to a temp FILE — a 60-min video keeps FULL coverage),
                       silence map (silencedetect -35dB/0.5s), loudness (loudnorm JSON,
                       ebur128 fallback), keyframe timestamps (video packets with the K
                       flag; stdout pass, never truncated), container basics + a VFR
                       guess (r_frame_rate vs avg_frame_rate).
                       Output probe.json; --scene-threshold sets the scene-change cutoff.
  segments <probe.json> [--min 15] [--max 90] [--count 10] [--even-split N] [--out segments.json]
                       FREE. Boundaries = union of scene_changes + silence ENDS (natural
                       cut points); from each boundary the longest boundary-delimited
                       segment fitting [min, max] becomes a candidate; a video shorter
                       than max is itself one candidate. Ranked by scene density x
                       loudness proximity, capped at --count, ids seg_001... in ranked
                       order. Each segment records signals: {scenes, silence_cut}.
                       segments.json also records the source {video, duration} so
                       sheets/read can warn on a mismatch. When NO candidate fits and the
                       video is longer than --max, exits 1 with guidance (lower --min /
                       re-probe with a lower --scene-threshold / use --even-split).
                       --even-split N skips the analysis: N equal segments flagged
                       "mechanical": true (honest equal divisions, not content picks).
  sheets <video> --segments segments.json [--out sheets/] [--frames 6]
                       FREE. Per segment: contact sheet PNG of --frames evenly-spaced
                       stills (~480px wide, tile 3x2 for 6, reading order) + a
                       sheets.json manifest. Existing --out may hold only seg_*.png +
                       sheets.json (cleared); anything else is an error.
  rate --sheets sheets/ --questions questions.json [--model clef-flash] [--gateway id]
        [--max-images 1] [--out ratings.json] [--yes]
                       CLEF pass over SHEETS. Default ONE image per request (per-segment
                       truth); set --max-images 2-4 to batch (a failing multi-image batch
                       is auto-isolated and re-asked one image per request). The sheet
                       list comes from the sheets.json manifest ONLY — never a PNG glob
                       (a crashed sheets run leaves partials; missing/empty manifest is a
                       clean error). Credentials
                       are checked BEFORE anything is read or sent; the cost estimate
                       prints before the first request; more than 240 images needs --yes
                       (or CLEFCUT_YES=1). requests are paced >= 300 ms apart and
                       ratings.json is rewritten after every request ("complete": false
                       until the run finishes; a fatal mid-run error still leaves the
                       partial file, then exits 2). Exit 1 when any segment fails or
                       escalates ("attention needed").
  read <video|sheetsDir> --segments segments.json [--engine local|clairic|auto]
       [--fields fields.json] [--out text.json] [--yes]
                       Burned-in text per segment. For a video input the MIDDLE frame of
                       each segment is extracted once, scaled to at most 1280px wide
                       (never upscaled — bounds tokens/bytes); a sheets dir uses the
                       sheets via their manifest. The model is told WHAT it sees: a
                       contact sheet (sheets dir) or a single midpoint frame (video).
                       --engine is chosen ONCE per run and reported: local = tesseract.js
                       or system tesseract (tesseract.js downloads English traineddata on
                       its first run; on an airgapped machine install system tesseract
                       instead); clairic = Cloudflare extraction, 1 image per request,
                       credentials BEFORE any frame extraction, same cost gate / pacing /
                       incremental writes as rate; auto = local when available, else
                       clairic. Default field: {"onscreen_text": {"type": "text"}}.
  cut <video> --plan clips.json [--mode lossless|accurate] [--tolerance 0.5] [--outdir clips/] [--strict]
                       The source is probed and the plan validated BEFORE any previous
                       output is cleared — a corrupt source never empties --outdir. The
                       dir may hold earlier tool-named clip outputs (<slug>.mp4 and the
                       <slug>_<platform>_<variant>.mp4 family): only the stale report is
                       cleared upfront; clips are replaced by ATOMIC verified writes.
                       FINGERPRINT: when the plan carries one (copied from probe.json's
                       "fingerprint": size + head/tail sha256), it is compared to the
                       actual file — a mismatch (same path/duration, different bytes)
                       prints a loud warning; --strict turns it into exit 2 BEFORE any
                       cutting. Lossless first: -ss before -i + -c copy +
                       -avoid_negative_ts make_zero, then the ACTUAL output duration is
                       measured with ffprobe; when the error exceeds --tolerance
                       (seconds) OR the source is VFR, the clip is re-encoded accurately
                       (libx264 crf 18, yuv420p, aac 192k, faststart) with 30 ms audio
                       fades (accurate mode always re-encodes and always fades).
                       cut-report.json records file, mode (copy/re-encode), requested_s,
                       actual_s, duration_error_ms, start_error_ms (copy mode only:
                       requested start vs the keyframe actually used), av_start_skew_s
                       (copy mode with audio only: first video pts vs first audio pts;
                       over max(2 frames, 0.1s) also sets av_start_skew_warning — a
                       WARNING field, it does not change exit semantics) and the exact
                       command per clip. Re-encoded cuts additionally record
                       nearest_keyframes {before, after} (the keyframes bracketing the
                       requested start) and lossless_alternative {command, reason} — the
                       -c copy command that WOULD have run and why it did not (e.g.
                       "keyframe snap 1200ms exceeds tolerance 500ms"). Exit 1 when any
                       clip is still over tolerance at the end (failing slugs listed).
  tighten <clip> [--threshold -35] [--min-silence 0.6] [--margin 0.15] [--min-keep 0.2]
         [--max-cuts 400]
                       Silence removal for a cut clip — make it punchy. Silences are
                       detected on the audio track (silencedetect; --threshold in dBFS,
                       --min-silence in s); --margin s of silence stays attached to each
                       side of kept speech so joins sound natural; kept pieces shorter
                       than --min-keep are dropped; more than --max-cuts cuts is
                       refused with guidance to raise --min-silence (the select filter
                       graph would be oversized). ONE re-encode (crf 18 / medium /
                       yuv420p / aac 192k / +faststart) with 30 ms audio fades at every
                       join. Output <stem>_tight.mp4, written atomically; report line:
                       before_s / after_s / removed_s / cuts. When no silence is found
                       the track mean level is measured and a suggested --threshold is
                       printed (mean + 6 dB, capped at -5 dB) — exit 0 ("nothing to
                       tighten"). AUDIO ROUTE: direct aselect, verified empirically on
                       ffmpeg 9.0.2 (kajisho5/ffmpeg-skill reports 8/8.1 builds pass
                       everything through) — the atomic post-write duration check
                       catches such a build and writes nothing.
  export <clip> --platform youtube|shorts|tiktok|reels|x|creator
         [--variant original|9x16-crop|9x16-blur] [--crop-x 0.5] [--crop-y 0.5]
         [--loudnorm] [--out exports/]
                       original: ensure the shared platform baseline — faststart + even
                       dimensions + h264/yuv420p (stream-copy remux when already
                       compliant; re-encode crf 18 when odd, non-H.264 or non-yuv420p). 9x16-crop:
                       crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,setsar=1
                       — a bounded crop, so ANY aspect (portrait/taller-than-9:16,
                       landscape, square) fills 1080x1920. --crop-x/--crop-y (0..1,
                       default 0.5) ANCHOR the crop window in the leftover region:
                       x=(iw-out_w)*crop-x, y=(ih-out_h)*crop-y — 0 pins the window to
                       the left/top edge, 1 to the right/bottom edge, 0.5 is the exact
                       historical center crop. Anchors apply to 9x16-crop only (clean
                       error elsewhere). 9x16-blur: blurred cover
                       background + centered foreground; a source taller than 9:16 gets
                       a warning that vertical content is cropped. All re-encode paths
                       add -movflags +faststart and yuv420p. --loudnorm runs a two-pass
                       loudnorm (pass 1 measures, pass 2 applies measured_*; target
                       I=-14 LUFS, TP=-1.5). Platform duration warnings come from the
                       SHARED platform table (same single source of truth as check):
                       shorts >180s (verified cap); tiktok >=570s, reels >180s,
                       x >140s (community-reported, unverified); creator >90s (generic
                       guidance); vertical platforms also warn when the output is not
                       9:16 (display dimensions — rotation metadata honored); youtube
                       has no duration warn. The output is written
                       atomically (verified temp, then rename). Exit 1 on any platform
                       warning. Output name: <slug>_<platform>_<variant>.mp4.
  check <file> [--platform youtube|shorts|tiktok|reels|x|creator] [--out check-report.json]
                       Compliance verification — the final gate after export. Rows:
                       duration, aspect (rotation-aware: display dimensions after
                       rotation metadata, so a tkhd-rotated file is judged by what it
                       shows), resolution (divisible-by-2), resolution_cap
                       (informational WARN when the short side exceeds the max the
                       platform's row marks — shorts 1080p verified, x 1080p and
                       tiktok "4K compressed" community; never a hard gate), fps +
                       VFR/CFR, codec, pix_fmt, audio presence/codec, sample rate,
                       faststart (moov-box walk), loudness (measure-only I/TP; FAIL
                       only for clipping TP>0 or over-loud I>-2 LUFS — a QUIET master
                       is a WARN with the loudnorm fix), silent audio, and size where
                       the shared table carries a cap (unmeasurable size = WARN
                       "could not measure (size unknown)", never an absent row). Each
                       row is PASS/WARN/FAIL with kind "format"|"judgement"
                       (duration/aspect/loudness are judgement), a plain-language
                       reason when not PASS, and a fix naming the exact clipcut
                       command when one exists (e.g. "clipcut export <file>
                       --platform shorts --variant 9x16-crop", "clipcut tighten
                       <file>"). UNMEASURABLE facts (probe fails, no audio stream,
                       silent track) are WARN "could not measure" — never PASS.
                       Without --platform, judgement rows are evaluated against the
                       generic creator profile and downgrade to WARN; format rows
                       still enforce. Any FAIL exits 1. Writes check-report.json + a
                       human summary.
  preview <clip> [--source <video> --start S --end E] [--probe probe.json] [--out preview/]
                       FREE, informational (exit 0 = ok, 2 = error). Writes
                       <slug>_preview.png (6-frame contact sheet), <slug>_3s.mp4 (first
                       3s) and <slug>_end3s.mp4 (last 3s) — samples muted, 320px wide.
                       With --source plus the clip's --start/--end it also BOUNDARY-
                       CHECKS both clip edges: a scene-score scan of the SOURCE over
                       [t-1.5, t+1.5] per edge records the max scene score in the
                       window and whether a scene change lands within 0.5s of the
                       boundary (--probe probe.json cross-checks its scene_changes).
                       Writes preview.json: {clip, file, samples: {sheet, first3s,
                       last3s}, boundaries: [{type: "start"|"end", t, window_s,
                       scene_score_max, scene_change_near}]}. The dir may hold ANY
                       slug's preview outputs; only this slug's files are replaced.
  plan [--file clips.json]
                       Print the clips.json schema + a minimal example; with --file,
                       validate the file, print each clip's duration and the total
                       (0 valid, 1 warnings only, 2 invalid). Unknown platform ids are
                       an open list: they map to the generic creator profile with a
                       warning, not an error.
  verify <video> [--net]
                       Real-footage self-test: runs the REAL pipeline commands on the
                       user's own file — probe (incl. fingerprint) -> segments (>=1
                       candidate, or a clean SKIP reason on a <15s file) -> sheets ->
                       cut a short slice from the first segment (duration_error_ms
                       reported) -> tighten on the slice (SKIP with a reason when it
                       has no audio / no silence) -> export 9x16-crop with the default
                       crop anchor (dims verified 1080x1920) -> check the export (WARNs
                       fine, FAILs fail the step) -> preview (files exist). Network
                       steps SKIP with "no credentials"/"pass --net" unless env
                       credentials exist AND --net is given — then ONE clef-flash ping
                       + ONE clairic image, cost gate respected. Per-step
                       PASS/FAIL/SKIP-with-reason + one summary line; exit 1 on any
                       FAIL. Everything runs in a temp dir under os.tmpdir() that is
                       ALWAYS cleaned — nothing touches the project. Run it once per
                       machine and after ffmpeg upgrades.
  --selftest           Built-in unit checks (no network, no ffmpeg needed).

questions.json schema (for rate) — identical to the sibling video-qa skill:
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
    "pass": { "<id>": 0.5 },              // REQUIRED for every id unless in escalate_only:
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

clips.json schema (for cut):
  {
    "video": "/abs/path/talk.mp4",       // optional: recorded source — cut warns when
                                         // the given video (or duration) differs
    "duration": 754.2,                   // optional: recorded source duration (seconds)
    "fingerprint": {                     // optional: copied from probe.json — cut
      "size": 12345,                     // compares it to the actual file and warns on
      "sha256_head_tail": "a..:b.."      // a mismatch; --strict refuses to cut (exit 2)
    },
    "clips": [
      {
        "slug": "hook",                    // required: filename-safe id [A-Za-z0-9._-], unique
        "start": 12.5,                     // required: seconds, >= 0
        "end": 58.2,                       // required: seconds, > start (5-600s recommended;
                                           //   a warning when end > the source duration)
        "variants": ["9x16-crop"],         // optional: original | 9x16-crop | 9x16-blur
        "platforms": ["shorts", "tiktok"]  // optional: open list — known ids ${PLATFORMS.join(' | ')};
                                           //   unknown ids map to the creator profile (warning)
      }
    ]
  }

fields.json schema (for read --engine clairic): {"<id>": {"type": "text", "instructions": "..."}}

Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLEFCUT_GATEWAY_ID (optional),
CLEFCUT_FFMPEG/CLEFCUT_FFPROBE (optional), CLEFCUT_YES=1 (= --yes). Precedence: process env
> ./.env > ~/.clefcut/.env (doctor prints which file — or "process env" — each value came
from). Token values are never printed.

Examples:
  node clipcut.mjs doctor --ping
  node clipcut.mjs probe talk.mp4 --out probe.json
  node clipcut.mjs segments probe.json --min 15 --max 90 --count 10
  node clipcut.mjs sheets talk.mp4 --segments segments.json --out sheets/
  node clipcut.mjs rate --sheets sheets/ --questions questions.json
  node clipcut.mjs read talk.mp4 --segments segments.json --engine auto
  node clipcut.mjs cut talk.mp4 --plan clips.json --tolerance 0.5
  node clipcut.mjs tighten clips/hook.mp4
  node clipcut.mjs export clips/hook.mp4 --platform shorts --variant 9x16-crop --crop-x 1 --loudnorm
  node clipcut.mjs check exports/hook_shorts_9x16-crop.mp4 --platform shorts
  node clipcut.mjs preview clips/hook.mp4 --source talk.mp4 --start 12.5 --end 58.2
  node clipcut.mjs verify talk.mp4`;

/** Flags that must be followed by a value; a missing/true value is a clean exit-2 error. */
const VALUE_FLAGS = new Set(['out', 'scene-threshold', 'min', 'max', 'count', 'frames', 'sheets', 'segments', 'questions', 'fields', 'model', 'gateway', 'max-images', 'engine', 'plan', 'mode', 'tolerance', 'outdir', 'platform', 'variant', 'file', 'source', 'start', 'end', 'probe', 'even-split', 'threshold', 'min-silence', 'margin', 'min-keep', 'max-cuts', 'crop-x', 'crop-y']);

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

function numFlag(o, key, dflt, { min, max } = {}) {
  if (o[key] == null || o[key] === true) return dflt;
  const n = Number(o[key]);
  const lo = min == null ? -Infinity : min;
  const hi = max == null ? Infinity : max;
  if (!Number.isFinite(n) || n < lo || n > hi) {
    const range = Number.isFinite(lo) && Number.isFinite(hi) ? ` between ${lo} and ${hi}` : Number.isFinite(lo) ? ` >= ${lo}` : ` <= ${hi}`;
    throw new UserError(`--${key} must be a number${range}. Got: ${o[key]}`);
  }
  return n;
}

async function main(argv) {
  try {
    const o = parseArgs(argv);
    if (o.selftest) return cmdSelftest();
    const cmd = o._[0];
    if (!cmd || o.help) { console.log(HELP); return 0; }
    switch (cmd) {
      case 'doctor': return await cmdDoctor(o);
      case 'probe': return await cmdProbe(o._[1], o);
      case 'segments': return await cmdSegments(o._[1], o);
      case 'sheets': return await cmdSheets(o._[1], o);
      case 'rate': return await cmdRate(o);
      case 'read': return await cmdRead(o._[1], o);
      case 'cut': return await cmdCut(o._[1], o);
      case 'tighten': return await cmdTighten(o._[1], o);
      case 'export': return await cmdExport(o._[1], o);
      case 'check': return await cmdCheck(o._[1], o);
      case 'preview': return await cmdPreview(o._[1], o);
      case 'verify': return await cmdVerify(o._[1], o);
      case 'plan': return cmdPlan(o);
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

export {
  cmdDoctor, cmdProbe, cmdSegments, cmdSheets, cmdRate, cmdRead, cmdCut, cmdTighten, cmdExport, cmdCheck, cmdPreview, cmdPlan, cmdVerify,
  main,
};
