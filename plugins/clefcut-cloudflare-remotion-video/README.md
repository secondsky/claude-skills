# ClefCut — Remotion video QA on Cloudflare

Status: Beta (CLAIRIC is in Preview) · Last updated: 2026-10-25

`clefcut-cloudflare-remotion-video` is a Claude Code skill that quality-checks
rendered Remotion videos in staged cost layers: free local measurements on
every frame, cheap Cloudflare Workers AI model reads (CLEF for yes/no and
rating questions, CLAIRIC for typed text extraction) on the frames that
matter, and agent eyes only where a model and a measurement disagree. The QA
design is adapted from SageCut by Levanto Labs (MIT) — see
[Attribution](#attribution).

## The 4 cost layers

| Layer | What runs | Cost |
|---|---|---|
| 1 | ffmpeg frame extraction + free local checks (black/blank, frozen, flash, ink) + free local OCR (tesseract.js or system tesseract) | Free, offline |
| 2 | Cloudflare CLEF reads frames and answers yes/no + rating questions | Cents per 1,000 frames (estimate) |
| 3 | Cloudflare CLAIRIC extracts typed text and numbers from frames | Cents per 1,000 frames (estimate) |
| 4 | Three subagent critics on ≤32 selected frames; the main agent opens a frame only on a model-vs-measurement disagreement | The expensive layer — kept rare by design |

Rough math: a 960-px-class 16:9 frame costs about 513 input tokens (estimate).
At list prices (input tokens only; none of these models charge output tokens)
that is about $0.12 per 1,000 frames on clef, $0.02 on clef-flash, and $0.05
on clairic (estimates). A 300-frame run is about $0.04 on clef and $0.006 on
clef-flash (estimate). Workers AI also includes 10,000 free neurons per day.

Also in the box:

- `compare` — fix-round proof images: two PNGs (or two frame dirs, paired on
  true frame indices from the manifests) become one side-by-side PNG plus a
  JSON index; unpaired frames are listed.
- `--safe shorts|tiktok|reels|creator` zone frames — test-width copies with
  translucent red boxes over the platform's UI occlusion zones, plus `--diff`
  difference images and `--sheet` contact sheets, so the model passes read
  the artifact each question was written for.
- A five-part report contract (Done / Steps / Check / Look / Notes) — every
  number in the final report traces to a run file, and anything not measured
  is reported as unknown, never as a pass.

## Quick start

1. Install the plugin (lines below).
2. Set environment variables — copy `templates/env.example` to your Remotion
   project's `.env` (or `~/.clefcut/.env`) and fill in:

   ```
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-token   # needs Workers AI permission; never commit
   # CLEFCUT_GATEWAY_ID=default      # optional: AI Gateway routing
   # CLEFCUT_FFMPEG=/path/to/ffmpeg  # optional
   ```

   Create the token in the Cloudflare dashboard with Workers AI - Read (plus
   Edit unless created from the dashboard template). Never paste it into a
   chat and never commit it.

3. Run the doctor from your Remotion project root:

   ```
   node "<plugin>/skills/clefcut-cloudflare-remotion-video/scripts/video-qa.mjs" doctor
   ```

   It checks env vars, ffmpeg, and text-engine availability.

4. First run: render with
   `npx remotion render <id> out/<name>.mp4 --codec h264 --crf 17 --color-space bt709`,
   say OK to the frame upload and spend estimate the agent shows you, then let
   the QA loop run (frames → free checks → text → model questions with
   positive controls → reconcile → critics → fix, max 3 rounds).

Every QA command exits 0 = all pass; 1 = attention needed (any finding, any
escalation, or controls unreliable); 2 = error (the fix hint is on stderr).

## Choosing a text engine

| Engine | Cost | Best at | Watch out |
|---|---|---|---|
| `local` | Free, offline | Plain, high-contrast text; script-integrity checks at full resolution (`npm i -D tesseract.js`, or system tesseract) | Weaker on stylized fonts, low contrast, rotated text |
| `clairic` | ~$0.10/Mtok input, no output charge | Stylized and low-contrast text; typed numbers with confidence scores; nothing to install | Frames are uploaded; Preview model, behavior may change |
| `auto` | Free when a local engine is installed; CLAIRIC pricing otherwise | Default choice — the engine is chosen ONCE per run: local when a local engine is installed, otherwise CLAIRIC for the whole run; the run report states which engine produced the results | Costs money for the whole run whenever no local engine is available |

## Auto-Trigger Keywords

Load this skill when the request matches any of these.

- **Primary**: remotion video qa, video review, frame check, motion graphics
  qa, clef, clairic, cloudflare workers ai
- **Secondary**: frame extraction, ffmpeg frames, on-screen text ocr,
  tesseract, legibility check, ai gateway, decision model, extraction model,
  video quality gate, brand consistency
- **Error terms**: unreliable controls, stale frames dir, daily neuron quota
  exhausted, 429 3036, model name is invalid, no ffmpeg found

## Install

Claude Code:

```
/plugin marketplace add https://github.com/secondsky/claude-skills
/plugin install clefcut-cloudflare-remotion-video@claude-skills
```

Cross-harness (Cursor, opencode, Gemini CLI, and other `skills`-compatible
agents):

```
npx skills add secondsky/claude-skills --skill clefcut-cloudflare-remotion-video
```

Codex CLI:

```
codex plugin marketplace add secondsky/claude-skills
```

Then browse `/plugins` in the Codex TUI to install.

## Known issues prevented

The tool and workflow are shaped to prevent specific failure modes:

| Failure mode | How it is prevented |
|---|---|
| Stale-frame misattribution | Re-extraction into an existing frames dir auto-clears managed files (frame PNGs, manifest.json, findings.json, sheet.png, and the test/, diff/ and safe/ subdirs) and refuses dirs holding unrelated files; use a fresh `--out` per re-checked range |
| Cost runaway without an estimate | The script prints a frame/request/cost estimate before the first request and requires `--yes` above 240 frames |
| Per-batch answers read as per-frame | CLEF answers once per question PER REQUEST; the script auto-isolates failing batches one frame per request so final answers.json rows are per-frame |
| Controls that validate nothing | `ask --controls` warns "0 of N controls map to any question id" and marks the run unreliable when no control trips map to the bank's question ids |
| Token leakage | Token values are never printed; the API token lives in env files, not chat |
| Design flagged as defects | `check --declared declared.json` suppresses frozen/black/flash findings that match declared cuts, holds, blackouts, or effects and records them as suppressed |

## Honest limitations

- **CLAIRIC is in Preview.** Cloudflare may change or discontinue it; treat
  its extractions as evidence to verify, never as ground truth. (Clef family
  models carry no explicit GA/Preview label in the docs.)
- **Motion graphics, not camera footage.** The frozen-frame and color checks
  are tuned for rendered motion graphics; do not expect them to behave on
  camera footage.
- **No splice / GOP patching.** For a change to a delivered video, fix the
  composition and re-render; the skill re-checks only the changed ranges
  rather than patching the delivered file.
- **No Claude-cost accounting.** The skill tracks Workers AI spend (with the
  word "estimate" where numbers are projected), not the agent's own token
  spend.
- **Render time is unchanged.** QA reads renders; it does not speed them up.

## Attribution

The QA design — the layered cost model, the gate and sweep question sets, the
positive-control method, the escalation rules, and the critic rubric — is
adapted from **SageCut by Levanto Labs** (MIT):
https://github.com/levantolabs/sagecut-release. The original routes model
reads through the Sage API; this plugin replaces that path with Cloudflare
Workers AI (CLEF + CLAIRIC) and keeps free local OCR as a user choice. See
`THIRD_PARTY_NOTICES.md` for the full license text.
