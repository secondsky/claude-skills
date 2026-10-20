# ClefCut Video — long videos into creator clips on Cloudflare

Status: Beta (CLAIRIC is in Preview) · Last updated: 2026-10-20

`clefcut-cloudflare-video` is a Claude Code skill that cuts a long local
video into short clips for creator platforms, staged so almost everything is
free: local ffmpeg analysis builds scene, silence, and loudness maps and
derives candidate segments; one contact sheet per segment goes to Cloudflare
Workers AI (CLEF for clip-worthiness rating, CLAIRIC for burned-in text) —
pennies at most per run; the agent applies a scoring rubric, the user
confirms the picks, and every cut is verified by its reported duration
error. It is the sibling of `clefcut-cloudflare-remotion-video` (Remotion
QA): same free-first philosophy, different job.

## The 8-step pipeline

1. **Probe** — free local maps: scene scores, silence ranges, loudness, VFR
   flag. Nothing uploaded.
2. **Segments** — free candidate segments from map evidence.
3. **Sheets** — one contact sheet per candidate segment.
4. **Rate + read** — CLEF clip-worthiness questions on each sheet;
   burned-in text via free local OCR or CLAIRIC.
5. **Rubric + user confirms** — answers map to a 0–10 score per segment; the
   user picks the final clips.
6. **Cut** — lossless `-c copy` within a 0.5 s keyframe tolerance, else
   frame-accurate re-encode; every cut reports `duration_error_ms`.
7. **Export** — platform variants per clip (original / 9:16 crop / 9:16
   blur-pad), `+faststart`, optional loudness normalization.
8. **Preview verify** — per output clip: a 6-frame contact sheet, muted
   first/last-3s samples, and a ±1.5 s scene-score boundary check recorded
   in `preview.json`.

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

3. Run the doctor from the directory holding the video:

   ```
   node "<plugin>/skills/clefcut-cloudflare-video/scripts/clipcut.mjs" doctor
   ```

   It checks env vars, ffmpeg, and text-engine availability.

4. First run: say OK to the sheet-upload notice and cost estimate the agent
   shows you (a 60-minute video with 10 candidates sends 10 default sheets
   ≈ 7,680 tokens ≈ $0.0003 on clef-flash, estimate), then let the loop run
   (probe → segments → sheets → rate + read → ranked candidates → your
   picks → cut → export → preview).

Every command exits 0 = pass/ok; 1 = attention needed (findings,
escalations, a duration error over tolerance, or a platform spec warning);
2 = error (the fix hint is on stderr). `preview` is informational — 0 or 2
only, never 1.

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
- **Error terms**: duration_error_ms exceeded, keyframe snap, stale frames
  dir, daily neuron quota exhausted, 429 3036

## Known issues prevented

The tool and workflow are shaped to prevent specific failure modes:

| Failure mode | How it is prevented |
|---|---|
| Cuts silently landing on the wrong keyframe | Every cut defaults to lossless `-c copy` but reports `duration_error_ms` (and `start_error_ms` for copy-mode cuts); a snap beyond the 0.5 s tolerance triggers a frame-accurate re-encode, and a cut that still misses returns exit 1 |
| Frozen or wrong first frame on variable-frame-rate video | `probe` flags VFR sources and `cut` forces re-encode for them |
| Clicks and pops at cut boundaries | 30 ms audio fades on both edges of every re-encoded cut |
| Clips that start mid-word or end mid-thought | Boundaries snap to sentence/breath points from the free silence map, and the rubric scores openings and endings |
| Cost runaway on rating | `rate` sends ONE sheet per request (not per frame), prints a candidate/cost estimate first, and requires `--yes` above 240 images |
| Stale sheets reused across runs | Sheets live in a managed `sheets/` dir; re-running clears only the managed files (`seg_*.png` + `sheets.json`) and refuses directories holding unrelated content |

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
