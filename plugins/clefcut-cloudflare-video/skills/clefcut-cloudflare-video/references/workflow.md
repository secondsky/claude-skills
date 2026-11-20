# Full workflow

SKILL.md carries the condensed loop. This is the full version. `clipcut`
below means `node "<skill-dir>/scripts/clipcut.mjs"`, run from the directory
holding the source video.

## Run artifacts (what the commands actually write)

| Path | Written by | What it is |
|---|---|---|
| `probe.json` | `probe` | Scene-score list, silence ranges, loudness stats, codec/container facts (display dimensions — rotation metadata applied), VFR flag, and the source `fingerprint` (size + head/tail sha256) |
| `segments.json` | `segments` | Candidate segments: id (`seg_NNN`), start, end, rank, and the signals that suggested each one; inherits the probe's `fingerprint` |
| `sheets/seg_NNN.png` + `sheets.json` | `sheets` | One contact sheet per segment (evenly sampled, time-ordered grid) plus the manifest `rate`/`read` read — never a PNG glob |
| `ratings.json` | `rate` | Per-segment answer rows (fail/escalate/pass), severity, `usage`; rewritten after every request |
| `text.json` | `read` | Engine used, per-segment burned-in text and confidence |
| `clips.json` | Agent | The plan `cut` consumes (schema below) |
| `clips/<slug>.mp4` + `clips/cut-report.json` | `cut` | The clips plus per-cut mode (copy/re-encode), `requested_s`, `actual_s`, `duration_error_ms`, `start_error_ms` (copy mode only), `av_start_skew_s` (copy mode with audio only), `nearest_keyframes` + `lossless_alternative` (re-encode paths only), and the exact command |
| `<stem>_tight.mp4` | `tighten` | The silence-removed clip (written next to its input, atomically); the report line `before_s / after_s / removed_s / cuts` prints to the console |
| `exports/<slug>_<platform>_<variant>.mp4` | `export` | Platform variant files (+faststart, optional loudnorm) |
| `check-report.json` | `check` | Per-fact compliance rows (status + kind + reason + fix) and the PASS/WARN/FAIL summary |
| `preview/<slug>_preview.png`, `preview/<slug>_3s.mp4`, `preview/<slug>_end3s.mp4`, `preview/preview.json` | `preview` | 6-frame sheet, muted first-3s/last-3s samples, and per-boundary scene-score results |

## The loop

1. **Doctor.** `clipcut doctor`. Fix everything it reports (env vars, ffmpeg,
   text engines) before anything else. If the token is missing, tell the user
   to put it in the project `.env` or `~/.clefcut/.env` (see
   `templates/env.example`). Never ask for the token in chat. `doctor --ping`
   makes exactly one clef-flash call (the only network call) — use it to
   verify the token works, after asking the user. Also run
   `clipcut verify <video>` once per machine and after every ffmpeg upgrade —
   it exercises the real pipeline steps on a real file (temp dir, always
   cleaned) and reports per-step PASS/FAIL/SKIP so a broken local setup is
   caught before a real run.

2. **Probe (free).** `clipcut probe <video>` writes `probe.json`: scene
   scores, silence ranges, loudness, codec facts, and the VFR flag. Every
   later decision keys off these measurements. Nothing is uploaded.
   `probe.json` also records the source's `fingerprint` (size + sha256 of the
   first/last 8 MiB) — copy it into `clips.json` so `cut` can check it, and
   RE-RUN `probe` after any re-render or re-export of the source: a file at
   the same path with the same duration but different bytes needs a fresh
   fingerprint (and fresh scene/silence maps), or `cut --strict` will
   (correctly) refuse it.

3. **Segments (free).** `clipcut segments probe.json` derives candidates
   from probe evidence — scene cuts and sentence/breath boundaries —
   bounded by `--min`/`--max` duration (defaults 15–90 s; set from the
   genre table in `references/clip-selection.md`). Apply the archetypes
   while reviewing the candidate list: hunt for hooks, demos, stats,
   before/afters, sharp Q&As. If the genre is conversation-heavy, expect
   roughly 8–12 candidates per hour; never manufacture candidates to hit a
   count. When NO candidate fits and the video is longer than `--max`, the
   command exits 1 with guidance (lower `--min`, or re-probe with a lower
   `--scene-threshold` to expose more cut points); `--even-split N` is the
   mechanical fallback — N equal segments flagged `mechanical: true` with
   an honest equal-split warning (see the honesty rule below).

4. **Sheets.** `clipcut sheets <video> --segments segments.json` writes one
   contact sheet per candidate (`sheets/seg_NNN.png`, default 6 frames in
   a 3×2 grid) plus the `sheets.json` manifest. One sheet per segment is
   the unit of rating — do not rate raw frames.

5. **Rate + read.** Copy `templates/questions.example.json` from the skill
   directory into the project as `questions.json` (edit the copy). State
   the candidate count and cost estimate to the user and get the OK
   (example: "10 candidates, 10 sheets ≈ 7,680 tokens ≈ $0.0003 on
   clef-flash, estimate"). Then:
   `clipcut rate --sheets sheets/ --questions questions.json --model clef-flash`
   and `clipcut read <video> --segments segments.json --engine auto`. The
   script prints its own estimate and requires `--yes` above 240 images.
   Borderline answers may be re-rated on full `clef` — one segment, one
   request — before escalating.

6. **Apply the rubric.** Map answers to the 0–10 score per
   `references/clip-selection.md` (5 criteria × 0–2, keep ≥ 7; ±1 agent
   adjustment only with a stated, evidenced reason). Escalations (inside the
   margin, null answers, choice confidence < 0.5) get a personal look at that
   segment's sheet before the candidate is kept or dropped.

7. **User picks.** Present the ranked candidates with scores and one-line
   reasons, plus burned-in text from `read` where it helps (an on-screen stat
   or title often names the clip). The user confirms the final picks through
   the three-question gate (stands alone / fair to the speaker / serves the
   audience). Then write `clips.json` (schema below).

8. **Cut.** `clipcut cut <video> --plan clips.json --tolerance 0.5`.
   Lossless `-c copy` first; a keyframe snap over tolerance upgrades that
   cut to a frame-accurate re-encode with 30 ms audio fades; VFR sources
   always re-encode. Each clip lands in `clips/<slug>.mp4` and is recorded
   in `clips/cut-report.json` — mode (copy/re-encode), `requested_s`,
   `actual_s`, `duration_error_ms`, `start_error_ms` (copy mode only: the
   requested start vs the keyframe actually used), `av_start_skew_s` (copy
   mode with audio only: first video pts vs first audio pts, a warning
   field when over max(2 frames, 0.1 s)), `nearest_keyframes` +
   `lossless_alternative` (re-encode paths only: the keyframes bracketing
   the requested start, and the copy command that would have run with the
   reason it did not), and the exact command. Writes are atomic — a failed
   encode never replaces an existing clip. A cut that finishes over
   tolerance makes the command exit 1.

9. **Tighten (optional).** `clipcut tighten clips/<slug>.mp4` — make the
   clip punchy: remove dead air. Silences are detected at −35 dBFS / 0.6 s
   defaults (`--threshold`, `--min-silence`); 0.15 s of silence stays on
   each side of kept speech (`--margin`) so speech still sounds natural;
   kept pieces under 0.2 s are dropped (`--min-keep`). Output
   `<stem>_tight.mp4` (one re-encode, 30 ms fades at every join, atomic
   write) plus a `before_s / after_s / removed_s / cuts` report line. When
   no silence is found the tool suggests a `--threshold` (mean level + 6 dB,
   capped at −5 dB) and exits 0 — nothing was changed. Use tighten when the
   user wants pace; skip it when pauses carry meaning.

10. **Export.** `clipcut export <clip> --platform <id> --variant 9x16-crop`
    renders the variants each clip lists (`original`, `9x16-crop`,
    `9x16-blur`) with `+faststart`, plus optional two-pass loudnorm
    (`--loudnorm`, about -14 LUFS, TP ≤ -1.5 dBTP). Specs and recipes:
    `references/platform-specs.md`. The 9x16-crop is bounded, so ANY source
    aspect fills 1080x1920 — landscape sources lose most of the width, a
    portrait taller than 9:16 crops vertically (top and bottom). Position the
    window with `--crop-x`/`--crop-y` (0..1, default 0.5 = the exact center
    crop; 0 = left/top edge, 1 = right/bottom edge): pick the anchor from the
    FREE contact sheet (`preview/<slug>_preview.png` or the segment sheet) —
    look where the subject sits, choose the anchor that keeps it in frame,
    and say which anchor you chose and why. Check the
    subject is near frame center before cropping and say so when it is not.
    9x16-blur warns when a taller-than-9:16 source's vertical foreground
    content is cropped. Exports are written atomically.

11. **Check (final gate).** `clipcut check exports/<file>.mp4 --platform
    shorts` verifies the export against the SAME shared platform table the
    export warnings come from: duration, aspect (rotation-aware — judged on
    display dimensions after rotation metadata), resolution
    (divisible-by-2), resolution cap (informational WARN where the platform's
    row marks a max, e.g. the Shorts 1080p cap — never a hard gate), fps +
    VFR/CFR, codec, pix_fmt, audio, sample rate,
    faststart, loudness (measure-only; a quiet master is a WARN with the
    loudnorm fix — only clipping TP>0 or over-loud I>~-2 LUFS FAILs), silent
    audio. Each row is
    PASS/WARN/FAIL with kind `format` or `judgement` (duration, aspect,
    loudness are judgement — platform-dependent taste), a plain reason, and
    the exact fix command when one exists. Without `--platform`, judgement
    rows downgrade to WARN (evaluated against the generic creator profile)
    and format rows still enforce; with `--platform`, any FAIL exits 1.
    Unmeasurable facts (no audio stream, silent track, missing probe data,
    unknown size under a cap) are WARN "could not measure" — never PASS. Run
    it before or alongside
    preview; a FAIL row blocks calling the clip done unless the user
    explicitly accepts the risk.

12. **Preview verify.** `clipcut preview <clip> --source <video> --start S
    --end E --probe probe.json` writes a 6-frame contact sheet
    (`preview/<slug>_preview.png`), muted first-3s and last-3s samples
    (`<slug>_3s.mp4`, `<slug>_end3s.mp4`), and `preview.json`. With
    `--source` plus the clip's `--start`/`--end` it boundary-checks both
    clip edges: a scene-score scan of the SOURCE over [t-1.5, t+1.5] per
    edge records `scene_score_max` and `scene_change_near` (a scene change
    within 0.5 s of the boundary; `--probe probe.json` cross-checks
    `probe.json`'s own scene_changes). Review the samples and the scores
    yourself — agent judgment, not auto-fail: a start edge with
    `scene_change_near=false` AND a high `scene_score_max` can indicate a
    harsh opening. A boundary you judge bad goes back to step 8 with an
    adjusted start/end snapped to a silence-map boundary.

13. **Final report.** Write it after check and preview are clean:
    - **Done**: one line saying what was produced (clips, exports, checks).
    - **Steps**: the commands run and their exit codes (cut, tighten,
      export, check, preview).
    - **Check**: the check summary per export (PASS/WARN/FAIL counts, any
      non-PASS rows with their fix commands).
    - **Look**: the PNGs actually inspected (name them — e.g.
      `preview/hook_preview.png`, `sheets/seg_003.png`) or state plainly
      "pixels were not inspected".
    - **Notes**: duration errors and copy-mode `start_error_ms` /
      `av_start_skew_s` values, cost line (model spend from the runs'
      `usage` numbers where available; every projected number carries the
      word "estimate"), and coverage (segments probed vs rated vs cut).

## Report contract

The final report is only as good as the files behind it:

1. Never report success without the output files — name the actual
   `clips/`, `exports/`, `*_tight.mp4` paths that exist on disk.
2. `Look:` must name the PNGs actually inspected or state "pixels were not
   inspected" — never imply eyes that were not spent.
3. Quote errors verbatim (stderr text), not paraphrased.
4. Unmeasurable facts are warnings, never passes — carry "could not
   measure" rows into the report as-is.
5. Every number traces to a file the run produced (`probe.json`,
   `ratings.json`, `clips/cut-report.json`, `check-report.json`,
   `preview/preview.json`). Do not type numbers no file produced.

## clips.json — the plan file `cut` consumes

Required keys per clip; `cut` ignores extra keys (agents commonly add
`title`, `score`, and `reason`, which survive for the report):

```json
{
  "video": "/abs/path/talk.mp4",
  "duration": 4680.5,
  "fingerprint": { "size": 531443200, "sha256_head_tail": "ab12...:cd34..." },
  "clips": [
    {
      "slug": "hook-pricing-bomb",
      "start": 754.2,
      "end": 800.1,
      "variants": ["original", "9x16-crop", "9x16-blur"],
      "platforms": ["shorts", "tiktok", "reels", "x"]
    }
  ]
}
```

Variant ids are hyphenated: `original`, `9x16-crop`, `9x16-blur`. `video`,
`duration` and `fingerprint` are optional recorded-source fields — `cut`
warns when the given video (or its duration) differs, and the `fingerprint`
(copied verbatim from `probe.json`) catches the case the path/duration
checks cannot: a re-rendered file at the same path with the same duration.
On a fingerprint mismatch `cut` prints a loud warning; `--strict` refuses to
cut (exit 2, nothing written). Validation behavior:

- `platforms` is an OPEN list. Known ids: `youtube`, `shorts`, `tiktok`,
  `reels`, `x`, `creator`. Unknown ids are ACCEPTED with a warning and
  mapped to the generic creator profile — never an error. Any platform list
  in the specs is the same open list; never treat one as exhaustive.
- Duplicate slugs are rejected (invalid plan).
- An `end` beyond the source duration warns (5–600 s per clip is the
  recommended range).

## Equal-split honesty rule

When the user asks for N equal pieces ("cut this into 6 parts"), do not
silently comply: equal-interval cuts often land mid-thought. Run the
mechanical split (`segments probe.json --even-split N` — segments flagged
`mechanical: true` with an honest equal-split warning) only if the user
insists after being told, flag it in the report, and always offer the
boundary-adjusted alternative — the same number of candidates, boundaries
snapped to silence-map sentence/breath points.

## No-model fallback mode

When the user has not authorized uploads, or the API is unavailable, run a
local-only pass: `probe <video>`, `segments probe.json`, and
`read <video> --segments segments.json --engine local`. Rank candidates by
measurement evidence alone (scene density, loudness peaks, silence
boundaries) and present them with scores marked as UNRATED — never as rated
candidates. Say plainly what was not covered: no clip-worthiness model
judgments, no stylized-text reading, and no escalation path.

## Exit semantics

- **Exit 0** = pass/ok — every cut within tolerance, no findings, no
  escalations, no check FAIL.
- **Exit 1** = attention needed — any rating finding, any escalation, a cut
  duration error over tolerance, a platform spec warning, or a `check` FAIL
  row (judgement rows can only FAIL when `--platform` was given). Read the
  run artifacts to see which.
- **Exit 2** = error; the fix hint is on stderr.
- `tighten` with nothing to tighten (including its threshold suggestion) is
  exit 0 — nothing was changed.
- `preview` is informational: exit 0 = ok, 2 = error — never 1.
- `plan --file` validates: 0 = valid, 1 = warnings only, 2 = invalid.

## Hand-off rules

1. Hand the user the final report, the run folder path, and the output clip
   paths, in that order.
2. Every number in the report traces to a file the run produced
   (`probe.json`, `ratings.json`, `clips/cut-report.json`,
   `check-report.json`, `preview/preview.json`). Do not type numbers no
   file produced.
3. If the user wants a clip re-bounded: adjust `clips.json`, re-run `cut`
   for that clip only, then `tighten` / `export` / `check` / `preview` for
   it.
4. If the user asks what the model saw: one contact sheet per candidate
   segment — not raw frames — plus the free probe measurements
   (`probe.json`) that built the candidates.
