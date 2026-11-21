# CLAIRIC extraction reference

Cloudflare's extraction model, used by `read --engine clairic`. Facts
verified against Cloudflare docs on 2026-10-20.

**Status: Preview.** Cloudflare serves CLAIRIC "AS IS", it may change or be
discontinued without compensation, and its answers may shift without notice.
Treat its output as evidence to verify against a measurement — never as
ground truth.

## When to pick CLAIRIC over free local OCR

| Situation | Engine |
|---|---|
| Plain, high-contrast burned-in text (titles, lower-thirds, slide headers) | `local` (free; tesseract.js or system tesseract) |
| Stylized fonts, thin weights, text over video or gradients, low contrast | `clairic` |
| A per-field confidence and null-probability is wanted, not just a string | `clairic` |
| No OCR runtime installed and the user accepts upload + cost | `clairic` |
| Offline, or the user has not authorized uploads | `local` only |

Reading burned-in text is this skill's ONLY text source — there is no
speech-to-text — so the engine choice decides what the pipeline knows about
on-screen titles, stats, and slide text, nothing more.

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
  `p_null` high or `confidence` low → escalate by opening the segment sheet.
- Estimates add `mean`, `median`, `p10`, `p90`, `p_below`, `p_above`.
  Forecasts add `steps` (one estimate per step).

`usage`: `{state_tokens?, image_tokens?, schema_tokens?, input_tokens,
output_tokens, passes?}`. Output tokens are zero — CLAIRIC generates no
output tokens and there is no output charge.

## Segment extraction patterns

Clip work needs only `text`, `number`, and `list` — no estimates or
forecasts. For a video input, `read` sends a segment's MIDDLE FRAME (the
frame most likely to carry the burned-in text that persists through the
segment), scaled to at most 1280 px wide, and defaults to 1 image per
request; a sheets directory instead sends the segment's sheet. In both
cases the model is told what it is looking at — a single midpoint frame or
a contact sheet.

Keep it at 1 image per request: CLAIRIC returns one value set per field PER
REQUEST, so per-segment extractions are real only when each request carries
exactly one segment's frame — batching frames from different segments
conflates them into a single answer.

```json
{
  "model": "clairic",
  "state": "Reading burned-in text from the middle frame of one candidate segment of a long video. Text may include a title, lower-thirds, or slide text.",
  "fields": {
    "on_screen_text": { "type": "list", "items": "text", "instructions": "Every word burned into the frame, including small labels, tags, and watermarks" },
    "title": { "type": "text", "instructions": "The largest or most prominent single line of burned-in text" },
    "stat": { "type": "number", "integer": true, "instructions": "Any statistic or count shown as a numeral" }
  },
  "images": ["data:image/png;base64,<MIDDLE_FRAME>"]
}
```

Use what comes back for: naming clips (the title field often IS the slug),
catching segments whose value hinges on an on-screen number the sheet
question cannot read, and flagging existing burned-in captions that a crop
or blur-pad variant would cut off. Numbers are the highest-risk on-screen
elements — extract them typed; never retype them by hand from the image.

## Cost example

`read` caps midpoint frames at 1280 px wide (never upscaled) to bound
tokens and bytes. From a 1080p source the frame arrives as 1280x720 —
roughly 768 to 1,024 image tokens each (see `clef.md` math) — plus a small
`schema_tokens` count per field set and `state_tokens` for the state
string. At $0.10/Mtok input and no output charge, reading the middle frame
of 10 segments from a 1080p source ≈ 7,700–10,200 input tokens ≈
$0.0008–$0.001 plus schema tokens (estimate). State the estimate before
the run.

## curl example

```sh
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clairic \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clairic",
    "state": "Middle frame of a segment from a webinar recording. Slide text and a speaker lower-third may be burned in.",
    "fields": {
      "slide_heading": { "type": "text" },
      "on_screen_numbers": { "type": "list", "items": "number", "instructions": "Every numeral burned into the frame" }
    },
    "images": [
      { "content_type": "image/jpeg", "base64": "<BASE64_BYTES>" }
    ]
  }'
```

(Fields and structure from the Cloudflare clairic docs; substitute your
segment frames and fields.)

## Honest caveats

- Preview status (see top). Expect behavior changes; re-verify extracted
  text against the segment sheet when a decision hangs on it.
- Max 4 images per request — and for per-segment truth keep it at 1.
- Text-field spans index into `state`; with images-only calls the spans have
  nothing to point at — use `value`, `p_null`, and `confidence` instead.
- Fields are split across parallel passes when the field set is large; keep
  the field count small and purposeful rather than extracting everything.
