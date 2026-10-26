# ClefCut Video — long videos into creator clips on Cloudflare

Status: Beta (CLAIRIC is in Preview) · Last updated: 2026-10-25

`clefcut-cloudflare-video` is a Claude Code skill that cuts a long local
video into short clips for creator platforms, staged so almost everything is
free: local ffmpeg analysis builds scene, silence, and loudness maps and
derives candidate segments; one contact sheet per segment goes to Cloudflare
Workers AI (CLEF for clip-worthiness rating, CLAIRIC for burned-in text) —
pennies at most per run; the agent applies a scoring rubric, the user
confirms the picks, and every cut is verified by its reported duration
error. It is the sibling of `clefcut-cloudflare-remotion-video` (Remotion
QA): same free-first philosophy, different job.

## The 9-step pipeline

| # | Step | Cost | What happens |
|---|---|---|---|
| 1 | **Probe** | free | Local maps: scene scores, silence ranges, loudness, VFR flag, rotation-aware container facts, plus a per-file fingerprint (size + head/tail sha256). Nothing uploaded. |
| 2 | **Segments** | free | Candidate segments from map evidence. |
| 3 | **Sheets** | free | One contact sheet per candidate segment. |
| 4 | **Rate + read** | paid (pennies) | CLEF clip-worthiness questions on each sheet; burned-in text via free local OCR or CLAIRIC. |
| 5 | **Rubric + user confirms** | free | Answers map to a 0–10 score per segment; the user picks the final clips. |
| 6 | **Cut** | free | Lossless `-c copy` within a 0.5 s keyframe tolerance, else frame-accurate re-encode; every cut reports `duration_error_ms`; atomic writes; optional fingerprint check (`--strict` refuses a plan built from a different file). |
| 7 | **Tighten (optional)** | free | Silence removal with 0.15 s speech margins, one re-encode, dead-audio guard; `before_s`/`after_s`/`removed_s`/`cuts` reported. |
| 8 | **Export** | free | Platform variants per clip (original / 9:16 crop with `--crop-x`/`--crop-y` anchoring / 9:16 blur-pad), `+faststart`, optional loudness normalization. |
| 9 | **Check + preview verify (final gate)** | free | `check` verifies every export against the shared platform table (aspect is rotation-aware; quiet masters WARN, only clipping/over-loud FAIL); `preview` adds a 6-frame contact sheet, muted first/last-3s samples, and a ±1.5 s scene-score boundary check recorded in `preview.json`. |

## Platform coverage (open list)

This skill targets YouTube, YouTube Shorts, TikTok, Instagram Reels, X
(Twitter), and other creator video platforms — an open list, never a closed
one. Any platform outside the verified specs table uses the generic creator
profile: 9:16 1080x1920, 60–90 seconds or less, H.264 + AAC in an MP4 with
`+faststart`, and critical content kept out of the top ~15%, bottom ~30%,
and right ~10% of the frame. Specs that could not be re-verified from
official pages are marked as community-measured; check the platform's own
help pages when precision matters.

## Quick start

1. Install the plugin (lines below).
2. Set environment variables — copy `templates/env.example` to the project's
   `.env` (or `~/.clefcut/.env`) and fill in:

   ```
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-token   # needs Workers AI permission; never commit
   # CLEFCUT_GATEWAY_ID=default      # optional: AI Gateway routing
   # CLEFCUT_FFMPEG=/path/to/ffmpeg  # optional
   ```

   Create the token in the Cloudflare dashboard with Workers AI - Read (plus
   Edit unless created from the dashboard template). Never paste it into a
   chat and never commit it.

3. Run the doctor from the directory holding the video, then a real-footage
   self-test (run `verify` once per machine and after ffmpeg upgrades):

   ```
   node "<plugin>/skills/clefcut-cloudflare-video/scripts/clipcut.mjs" doctor
   node "<plugin>/skills/clefcut-cloudflare-video/scripts/clipcut.mjs" verify talk.mp4
   ```

   Doctor checks env vars, ffmpeg, and text-engine availability. `verify`
   runs the real pipeline steps (probe → segments → sheets → cut → tighten →
   export 9x16-crop → check → preview) on your file in a temp dir and
   reports per-step PASS/FAIL/SKIP — network steps stay off unless `--net`
   is passed.

4. First run: say OK to the sheet-upload notice and cost estimate the agent
   shows you (a 60-minute video with 10 candidates sends 10 default sheets
   ≈ 7,680 tokens ≈ $0.0003 on clef-flash, estimate), then let the loop run
   (probe → segments → sheets → rate + read → ranked candidates → your
   picks → cut → tighten → export → check → preview).

Every command exits 0 = pass/ok; 1 = attention needed (findings,
escalations, a duration error over tolerance, a platform spec warning, or a
`check` FAIL row); 2 = error (the fix hint is on stderr). `preview` is
informational — 0 or 2 only, never 1. `plan --file` uses 0 = valid,
1 = warnings only, 2 = invalid. `tighten` with nothing to tighten is exit 0.

## Choosing a text engine

| Engine | Cost | Best at | Watch out |
|---|---|---|---|
| `local` | Free, offline | Plain, high-contrast burned-in text (`npm i -D tesseract.js` — first run downloads English data — or system tesseract) | Weaker on stylized fonts, low contrast, rotated text |
| `clairic` | ~$0.10/Mtok input, no output charge | Stylized and low-contrast text; typed numbers with confidence scores; nothing to install | Frames are uploaded; Preview model, behavior may change |
| `auto` | Free when a local engine is installed; CLAIRIC pricing otherwise | Default choice — the engine is chosen ONCE per run: local when a local engine is installed, otherwise CLAIRIC for the whole run; the run report states which engine produced the results | Costs money for the whole run whenever no local engine is available |

## Auto-Trigger Keywords

Load this skill when the request matches any of these.

- **Primary**: cut video into clips, clip cutter, youtube shorts from long
  video, tiktok clips, instagram reels, repurpose video, highlight clips
- **Secondary**: scene detection, silence detection, keyframe cut, 9:16
  crop, blur pad, faststart, loudness normalize, clef, clairic, cloudflare
  workers ai, burned-in text ocr
- **Error terms**: duration_error_ms exceeded, keyframe snap, No sheets.json
  manifest, output dir has unrelated files, daily neuron quota exhausted,
  429 3036

## Known issues prevented

The tool and workflow are shaped to prevent specific failure modes:

| Failure mode | How it is prevented |
|---|---|
| Cuts silently landing on the wrong keyframe | Every cut defaults to lossless `-c copy` but reports `duration_error_ms` (and `start_error_ms` for copy-mode cuts); a snap beyond the 0.5 s tolerance triggers a frame-accurate re-encode, and a cut that still misses returns exit 1 |
| A failed or truncated encode replacing good output with a broken file | `cut`, `export` and `tighten` write ATOMICALLY — the encode lands in a hidden temp sibling, is verified (duration probe, faststart box walk), and only then is renamed over the final name; on any failure the temp is removed and a pre-existing output is left untouched |
| A broken filter chain shipping digitally-silent audio from `tighten` | A post-write dead-audio guard: when the source peaks above the −80 dBFS floor but the output measures at/below it, the file is refused and nothing is written |
| Unverified platform numbers blocking delivery | Duration caps the platform table marks community/guidance WARN ("reported, not enforced") even with `--platform`; only verified caps (e.g. the Shorts 3-minute limit) hard-FAIL; over-resolution and quiet-loudness rows are informational WARNs too |
| False aspect FAILs on rotated phone footage | `check` and the export warnings use DISPLAY dimensions — rotation metadata (±90°/±270°) swaps width/height, and the PASS note says "displays WxH after rotation metadata" |
| A plan built from a different file at the same path | `probe` records a fingerprint (size + sha256 of the first/last 8 MiB); `cut` warns on a mismatch and `--strict` refuses to cut before anything is written |
| Frozen or wrong first frame on variable-frame-rate video | `probe` flags VFR sources; `cut` forces re-encode for them and `tighten` warns that it re-times VFR to CFR |
| Clicks and pops at cut boundaries | 30 ms audio fades on both edges of every re-encoded cut and at every tighten join |
| Clips that start mid-word or end mid-thought | Boundaries snap to sentence/breath points from the free silence map, and the rubric scores openings and endings |
| Cost runaway on rating | `rate` sends ONE sheet per request (not per frame), prints a candidate/cost estimate first, and requires `--yes` above 240 images |
| Stale sheets reused across runs | Sheets live in a managed `sheets/` dir driven by the `sheets.json` manifest ONLY (never a PNG glob); re-running clears only the managed files and refuses directories holding unrelated content |

## Install

Claude Code:

```
/plugin marketplace add https://github.com/secondsky/claude-skills
/plugin install clefcut-cloudflare-video@claude-skills
```

Cross-harness (Cursor, opencode, Gemini CLI, and other `skills`-compatible
agents):

```
npx skills add secondsky/claude-skills --skill clefcut-cloudflare-video
```

Codex CLI:

```
codex plugin marketplace add secondsky/claude-skills
```

Then browse `/plugins` in the Codex TUI to install.

## Attribution

The pipeline design is assembled from several open projects with thanks —
the lossless-cut-with-tolerance and verified-duration pattern
(kajisho5/ffmpeg-skill), the 5-criteria clip-scoring rubric
(melvynx/video-agent-skills), candidate archetypes and self-containment
criteria (clueso-ai/skills), the genre-to-duration table (eachlabs/skills),
the three-question clip gate from the opus-clip lineage
(social-media-skills/skills), the clips JSON contract idea
(dkyazzentwatwa/vid-clipper), the 30 ms fade and boundary-review self-eval
rules (browser-use/video-use), and the free-first philosophy shared with our
sibling plugin's SageCut lineage (levantolabs/sagecut-release). See
`THIRD_PARTY_NOTICES.md` for licenses and details.

## Honest limitations

- **No speech-to-text.** Audio transcription is out of scope; the only text
  this skill "sees" is burned-in on-screen text read by OCR.
- **No caption generation or burning.** It does not write, style, or overlay
  captions.
- **Local files only.** No video downloading, no publishing or uploading to
  any platform.
- **Community-measured specs are marked.** Safe zones, some duration caps,
  and loudness behavior could not be re-verified from official pages; they
  carry UNVERIFIED marks in the reference and should be checked against the
  platform's own help pages when precision matters.
- **CLAIRIC is in Preview.** Treat its extractions as evidence to verify,
  never as ground truth. (Clef family models carry no explicit GA/Preview
  label in the docs.)
- **No render-quality improvement.** Cutting and repackaging only — no
  denoising, stabilizing, or upscaling; render time is not reduced either.
