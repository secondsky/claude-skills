# CLEF model reference

Decision models for `rate` runs. Facts verified against Cloudflare docs on
2026-10-20. Clef-family GA/Preview status is not labeled in the docs; treat
the models as production-priced but subject to change. CLAIRIC (the
extraction model) is explicitly Preview — see `clairic.md`.

## Models

| Model | URL path id | Body `model` selector | Input $/Mtok | Output | Context | Media |
|---|---|---|---|---|---|---|
| Clef | `@cf/cloudflare/clef` | `"clef"` | $0.24 | $0 (no output charge) | 65,536 tok | up to 4 images |
| Clef-flash | `@cf/cloudflare/clef-flash` | `"clef-flash"` | $0.038 | $0 | 24,576 tok | up to 4 images |
| Clef-omni | `@cf/cloudflare/clef-omni` | `"clef-omni"` | $0.15 | $0 | ~64,000 tok (docs pages disagree slightly: 64,000 vs 65,536) | 4 images + 4 audio + 2 video |

The full `@cf/...` id goes in the URL path; the SHORT selector goes in the
body (clef family). Clef is a 27B dense multimodal decision model; clef-flash
is a fast 9B; clef-omni is a 30B MoE (3B active). Weights are open-sourced
under Apache 2.0.

Clef-omni media extras (the only variant that takes audio/video):

- `audio`: max 4 clips, WAV or MP3, each ≤ 8 MiB and ≤ 300 s. ~780 tokens/min.
- `videos`: max 2, MP4 or WebM, each ≤ 16 MiB and ≤ 60 s, sampled at 2 fps.
  Up to 256 tokens/s at max resolution (~8,600 tokens/min at ~480p).
- Audio + video combined ≤ 16 MiB decoded. A video's soundtrack is heard only
  when EVERY video in the request has one.

## Endpoint and auth

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/cloudflare/clef
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
Content-Type: application/json
```

The token needs Workers AI - Read (and Edit unless created from the dashboard
template). An AI-Gateway-only token returns 401 (error code 10000) — use a
Workers AI token.

Response envelope: `{"result": {...}, "success": true, "errors": [], "messages": []}`.
The model payload lives in `result`. Check `success` before reading `result`.

## Request body

| Field | Required | Notes |
|---|---|---|
| `model` | yes | Short selector: `"clef"`, `"clef-flash"`, or `"clef-omni"` |
| `state` | yes | String or structured data. For clip rating it describes the sheet: genre, source length, segment time range, and that the image is a time-ordered contact sheet. Long text is truncated to fit; media + questions that overflow the context FAIL the request instead of truncating |
| `questions` | yes | Object: question id → typed question. 1–64 questions. Ids: letters, digits, `_`, `.`, `-` (≤100 chars). Answers come back keyed by the same ids |
| `images` | no | Max 4. PNG, JPEG, or WebP, embedded only (no remote URLs). Each ≤ 4 MiB and ≤ 16 megapixels; 8 MiB total decoded; whole body ≤ 13 MiB. Item forms: data URL string `"data:image/png;base64,..."` or object `{"content_type": "image/png", "base64": "..."}` |
| `audio`, `videos` | no | Clef-omni only (limits above). Clef and clef-flash schemas have no such properties |

## Question types

- `type: "noul"` — yes/no question. `instructions` (required). Optional
  `criteria` OBJECT with `true` and `false` keys describing what values near 1
  and near 0 mean. Returns the probability the answer is yes.
- `type: "choice"` — pick one option. `instructions` (required) plus `criteria`
  (required, OBJECT) mapping option id → description; 2–255 options.
- `type: "score"` — ordered rubric rating. `instructions` (required) plus
  `criteria` (required, ARRAY) of ordered level descriptions, lowest first,
  indexed from 0; 2–10 levels.

## Response shapes (inside `result`)

Top level: `model` (string), `answers` (object keyed by question id), `usage`
(object). All required, always present.

- noul: `{"type": "noul", "noul": <0..1>}` — `noul` is the probability the
  answer is yes. The field is named `noul`, not `probability`.
- choice: `{"type": "choice", "choice": "<top option id>", "probabilities": {"<option>": <0..1>, ...}, "confidence": <0..1>}`. Probabilities sum to 1.
- score: `{"type": "score", "score": <number — probability-weighted level, can land between levels>, "legend": {"<level index as string>": <description>}, "probabilities": {"<level>": <0..1>}, "confidence": <0..1>}`
- usage: `{"input_tokens": <int>, "output_tokens": <int>}` — output tokens are
  not billed on clef models. Use `input_tokens` for real cost accounting.

Clef-omni responses use the identical structure.

## State-string example for clip rating

The state tells the model what it is looking at before the questions (the
question text below is abridged; the canonical wording lives in
`templates/questions.example.json`):

```json
{
  "model": "clef-flash",
  "state": "Rating one candidate segment of a 62-minute podcast video. The image is a contact sheet: cells run left-to-right, top-to-bottom in time order and evenly sample the whole segment. Segment starts at 00:12:34 of the source and runs 46 seconds.",
  "questions": {
    "opens_on_action": { "type": "noul", "instructions": "Does the segment open on throat-clearing, greetings, filler words, or dead air, so that no real content appears within roughly the first second?" }
  },
  "images": ["data:image/png;base64,<SHEET_BASE64>"]
}
```

## Picking a model

The `rate` command selects with `--model clef|clef-flash|clef-omni`
(default `clef-flash`).

- `clef-flash` — the RATING DEFAULT: cheap triage over candidate sheets
  ($0.038/Mtok). 24,576-token context is ample for one sheet plus the
  rubric questions.
- `clef` — BORDERLINE RE-RATES: when a flash answer lands inside the
  escalate band on a clip the agent or user cares about, re-ask that one
  segment on clef (larger context, 65,536 tokens, strongest of the
  text+image pair) before escalating to agent review.
- `clef-omni` — only when the check genuinely needs audio or video in the
  request (does the segment SOUND energetic). Do not use it for still
  sheets. Scope note: `clipcut.mjs` sends STILL IMAGES only — sheets and
  single frames. A clef-omni request carrying `audio` or `videos` is outside
  what the script builds — an agent doing that hand-builds the request
  outside this tool.

## Per-request answers and the isolation pattern

CLEF returns ONE answer per question PER REQUEST. `rate` exploits this: it
sends one sheet per request by default (one segment = one answer), and its
`--max-images 2`–`4` batching mode auto-isolates — any multi-image request
whose answer fails or escalates is re-asked one image per request so the
final rows stay per-image with the true image number (usage of both passes
recorded). Hand-built requests must follow the same pattern: never read a
4-image batch answer as a per-image verdict.

## Errors and retries

| Status / code | Meaning | Action |
|---|---|---|
| 400 / 5007 | No such model or task | Fix the model id (full id in URL, selector in body) |
| 400 / 5004 | Invalid base64 | Re-encode the image |
| 403 / 5035 | Model requires Workers Paid plan | Switch model or ask the user to upgrade |
| 413 / 3006 | Request too large | Fewer or smaller images per request (max 4 anyway) |
| 429 / 3036 | Daily free 10,000-neuron allocation exhausted | FAIL FAST — do not retry; tell the user; resume next UTC day or on a paid plan |
| 429 / 3040 | Capacity temporarily exceeded | Retry with backoff |

The error `code` (3036, 3040, ...) is in the JSON error BODY, not just the
HTTP status: `{"errors": [{"code": 3036, ...}]}` — parse it before deciding
to retry, because 429 alone is ambiguous between "quota gone" (do not retry)
and "capacity" (retry). Cloudflare's only documented retry hint for 429/3040
is "please try again". Retry with exponential backoff + jitter on 429/3040
(capacity) and 5xx; NEVER retry 429/3036 (quota — retrying cannot help until
00:00 UTC). A 401 body format is not documented; report the raw status. When
routing through an AI Gateway, retries can instead be delegated to the
gateway via `cf-aig-max-attempts` and related headers (see
`ai-gateway-and-mcp.md`). Rate limits per account per model apply (300 rpm in
the general bucket; the docs do not state which bucket clef falls in — treat
as approximate and rely on 429 handling).

## Token math (worked example)

Image cost: sides rounded to multiples of 32 px (scaled up under ~256x256,
down over ~1 megapixel), tokens = (width/32) x (height/32) patches + 3 marker
tokens, capped at 1,024 per image.

- Default 6-frame sheet (3×2 tiles of ~480-px-wide cells): 1440x540 →
  45 x 17 = 765 patches + 3 = 768 tokens.
- 960x540-class image (the ≤4-frame sheet layout; `read` frames below the
  1280-px cap): 30 x 17 = 510 patches + 3 = 513 tokens.
- 10 default sheets ≈ 7,680 input tokens → clef ≈ $0.0018, clef-flash ≈
  $0.0003 (estimates; state them as estimates).
- 100 default sheets ≈ 76,800 tokens → clef ≈ $0.018, clef-flash ≈ $0.003
  (estimates).
- Free-tier check: 10,000 neurons/day free. Clef costs 21,818 neurons per
  million input tokens, clef-flash 3,455 — so the free day covers roughly
  0.46 Mtok of clef (~600 default sheets) or ~2.9 Mtok of flash (~3,800
  default sheets), approximate arithmetic, not a promise.

## Node fetch example (with retry)

```js
// Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Workers AI Read/Edit).
// Retries 429 capacity (code 3040) and 5xx with exponential backoff + jitter.
// Fails fast on 429 quota (code 3036) — the code is parsed from the JSON
// error body, because HTTP 429 alone cannot tell quota from capacity.
const RUN_URL = (modelId) =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${modelId}`;

async function runClef(body, { attempts = 5 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(RUN_URL("@cf/cloudflare/clef-flash"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json(); // { result, success, errors, messages }
      if (!json.success) throw new Error(`API error: ${JSON.stringify(json.errors)}`);
      return json.result; // .answers.<id>.noul is a 0..1 float
    }
    const errBody = await res.json().catch(() => ({}));
    const code = errBody?.errors?.[0]?.code; // e.g. 3036 quota, 3040 capacity
    if (res.status === 429 && code === 3036) {
      throw new Error("daily neuron quota exhausted — do not retry; resets 00:00 UTC");
    }
    const retryable = (res.status === 429 && code !== 3036) || res.status >= 500;
    if (!retryable || i === attempts - 1) {
      throw new Error(`HTTP ${res.status} (code ${code ?? "?"}): ${JSON.stringify(errBody)}`);
    }
    await new Promise((r) => setTimeout(r, (2 ** i) * 1000 + Math.random() * 500));
  }
}
```

## Honest caveats

- The GA/Preview label for clef, clef-flash, and clef-omni is not stated in
  the docs; only CLAIRIC is explicitly Preview.
- Which rate-limit bucket clef models fall in (300 rpm vs paid-plan 20/50 rpm)
  is not published; expect 429s and handle them.
- The `legend` keys in score answers are level indexes as strings (per the
  output schema); no live response example is published, so parse keys as
  strings, not integers.
- If media + questions overflow the context window, the request fails — it
  does not truncate. Keep sheets under the token cap and question text short.
