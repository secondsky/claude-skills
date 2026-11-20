# CLAIRIC extraction reference

Cloudflare's extraction model, used by `text --engine clairic` and `extract`.
Facts verified against Cloudflare docs on 2026-10-20.

**Status: Preview.** Cloudflare serves CLAIRIC "AS IS", it may change or be
discontinued without compensation, and its answers may shift without notice.
Treat
its output as evidence to verify against a measurement — never as ground truth.

## When to pick CLAIRIC over free local OCR

| Situation | Engine |
|---|---|
| Plain, high-contrast text at full resolution; script-integrity compare | `local` (free; tesseract.js or system tesseract) |
| Stylized fonts, thin weights, text over video or gradients, low contrast | `clairic` |
| You need a per-field confidence and null-probability, not just a string | `clairic` |
| No OCR runtime installed and the user accepts upload + cost | `clairic` |
| Offline, or the user has not authorized uploads | `local` only |

Integrity-vs-script stays local at full resolution even when legibility uses
CLAIRIC at test width (the SageCut split — see SKILL.md).

## Endpoint and request body

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/cloudflare/clairic
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
```

| Field | Required | Notes |
|---|---|---|
| `model` | yes | `"clairic"` or `"@cf/cloudflare/clairic"` — both accepted |
| `state` | no (default `""`) | Text to read from. Must be non-empty unless images are sent. Text answers are spans into this string, so `state` matters for text fields |
| `fields` | yes | Object: field name → typed field spec. 1 or more. Name pattern: letter or `_` first, then letters/digits/`_ . -` (≤64 chars). Fields that do not fit next to the state in one 8,192-token pass are split across parallel passes |
| `images` | no | Max 4. PNG/JPEG/WebP, ≤ 4 MiB each, 8 MiB total decoded, whole body ≤ 16 MiB. Same item forms as clef: data URL or `{content_type, base64}`. No remote URLs |
| `reference_date` | no | ISO date that anchors dates written without a year |
| `options` | no | `include_quantiles` (adds 99 percentiles to estimates), `return_state_text` (returns the text spans index into) |

## Field types

The `type` enum is exactly: `text`, `number`, `date`, `time`, `datetime`,
`duration`, `list`, `estimate`, `forecast`.

| Sub-field | Applies to | Meaning |
|---|---|---|
| `instructions` | all | What the field should contain |
| `unit` | number, duration | Unit label. Durations: `seconds` (default), `minutes`, `hours`, `days`, `weeks`, `months`, `years` |
| `integer` | number, duration | Force an integer |
| `decimals` (0–6) | number, duration, number lists | Decimal places |
| `items` (`text` / `number` / `date`) | list | Required: what the list holds |
| `min` / `max` | estimate, forecast | Required range. Numbers, or ISO dates for date estimates |
| `step` | estimate | Grid of the estimate: positive number (days for dates), or `"month"` / `"year"` |
| `scale` (`linear` / `log`) | estimate | Default `linear` |
| `null_threshold` (>0 to 1) | all | Probability of null above which `value` is returned as null (default 0.5) |
| `horizon` (1–64) | forecast | Number of steps |
| `interval` | forecast | `step`, `minute`, `hour`, `day`, `week`, `month`, `quarter`, `year` |

## Response shape (inside `result`)

Top level: `model`, `answers` (keyed by field name), `truncated` (boolean),
`state_text` (only when requested), `usage`.

Each field answer: `{type, value, guess?, p_null?, confidence?, span?, spans?,
mean?, median?, p10?, p90?, p_below?, p_above?, quantiles?, steps?}`. Required:
`type` and `value`.

- `value` is `null` when the input does not determine it (extract/compute);
  an empty list means "no matches".
- `span`: `[start, end]` character offsets into `state` (text/number/date
  answers). `spans`: array of pairs (list answers). With images-only calls
  there is no state to index, so rely on `value` + `confidence`.
- `p_null` and `confidence` are the fields the escalation policy keys on:
  `p_null` high or `confidence` low → escalate by opening the frame.
- Estimates add `mean`, `median`, `p10`, `p90`, `p_below`, `p_above`.
  Forecasts add `steps` (one estimate per step).

`usage`: `{state_tokens?, image_tokens?, schema_tokens?, input_tokens,
output_tokens, passes?}`. Output tokens are zero — CLAIRIC generates no output
tokens and there is no output charge.

## Video-frame extraction patterns

Frame QA does not need `estimate`/`forecast`; use `text`, `number`, and `list`.
The same fields object feeds `text --engine clairic --fields fields.json` and
`extract <framesDir|video> --fields fields.json` (both required for
`extract`).

Both commands default to 1 image per request (overridable with
`--max-images`). Keep it at 1 for frame QA: CLAIRIC returns one value set per
field PER REQUEST, so per-frame extractions are real only when each request
carries exactly one frame — batching >1 image conflates the frames into a
single answer. (With multiple fields, `text`'s per-frame `text`/`confidence`
reflect the FIRST field.)

```json
{
  "model": "clairic",
  "state": "Frame QA batch. Each image is one frame of a motion-graphics video, 960 px wide.",
  "fields": {
    "on_screen_text": { "type": "list", "items": "text", "instructions": "Every word visible in the frame, including small labels and tags" },
    "headline": { "type": "text", "instructions": "The largest single line of text in the frame" },
    "price": { "type": "number", "decimals": 2, "unit": "USD", "instructions": "Any price or money amount shown" },
    "stat": { "type": "number", "integer": true, "instructions": "Any count or statistic shown as a numeral" }
  },
  "images": ["data:image/png;base64,<FRAME_1>", "data:image/png;base64,<FRAME_2>"]
}
```

Compare `on_screen_text` against the script/measurements locally; compare
`headline`-style fields against the schedule's declared text. Numbers are the
highest-risk on-screen elements — extract them typed and diff them against the
script numbers; never retype them by hand from the image.

## Cost example

One 960×540 frame ≈ 513 image tokens (see `clef.md` math), plus a small
`schema_tokens` count per field set and `state_tokens` for the state string.
At $0.10/Mtok input and no output charge, 1,000 frames ≈ 513,000 input tokens
≈ $0.05 plus schema tokens (estimate). State the estimate before the run.

## curl example

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clairic \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clairic",
    "state": "Invoice INV-2291 from Northwind Supply, issued 2026-09-02, net 30. 4 pallets at $250.00 each, shipping $80.00.",
    "fields": {
      "invoice_number": { "type": "text" },
      "total": { "type": "number", "decimals": 2, "unit": "USD", "instructions": "Amount due including shipping" }
    },
    "images": [
      { "content_type": "image/jpeg", "base64": "<BASE64_BYTES>" }
    ]
  }'
```

(Fields and structure from the Cloudflare clairic docs; substitute your frame
images and QA fields.)

## Honest caveats

- Preview status (see top). Expect behavior changes; re-run controls when the
  skill or the model is updated.
- Max 4 images per request — the script batches; hand-built requests must
  respect it.
- Text-field spans index into `state`; with images-only calls the spans have
  nothing to point at — use `value`, `p_null`, and `confidence` instead.
- Fields are split across parallel passes when the field set is large; keep
  the field count small and purposeful rather than extracting everything.
