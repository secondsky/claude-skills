# Full workflow

SKILL.md carries the condensed loop. This is the full version, run from the
user's Remotion project root. `video-qa` below means
`node "<skill-dir>/scripts/video-qa.mjs"`.

## Run-folder artifacts (what the commands actually write)

| Path | Written by | What it is |
|---|---|---|
| `frames/frame_%06d.png` | `frames` | Native-width frames (no rescale unless `--width W`) |
| `test/frame_%06d.png` | `frames --test-width [N]` | Test-width copies for legibility questions (N defaults to 350) |
| `diff/diff_%06d.png` | `frames --diff` | Amplified consecutive-frame difference images for pop/abrupt-change questions |
| `sheet.png` | `frames --sheet` | 8-column contact sheet (capped at 64 evenly sampled frames) for staging-order questions |
| `manifest.json` | `frames` | Frame list, fps, and `artifacts` — which of the above exist |
| `findings.json` | `check` | Per-frame black/frozen/flash findings (and `suppressed` with `--declared`) |
| `text.json` | `text` | Engine used, each frame's OCR text and confidence |
| `answers.json` | `ask` | Per-frame classification rows, controls tally, `unreliable` flag, `usage` |
| `extract.json` | `extract` | Per-frame typed values with `p_null` and `confidence` per field |
| controls dir | `synthesize --out <dir>` | Control PNGs + `controls.json` (kept outside the frames dir) |
| `opened.json` | Agent | Every frame the agent opened and why (see step 8) |

## The loop

1. **Doctor.** `video-qa doctor`. Fix everything it reports (env vars, ffmpeg,
   text engines) before anything else. If the token is missing, tell the user
   to put it in the project `.env` or `~/.clefcut/.env` (see
   `templates/env.example`). Never ask for the token in chat. `doctor --ping`
   makes exactly one clef-flash call (the only network call) — use it to
   verify the token works before the first paid run, after asking the user.

2. **Schedule / script check.** If the project has a schedule or script file
   (timing plan, beat list, or copy doc), verify the frame math BEFORE
   rendering: each beat's duration × fps = its frame count, cuts and holds are
   declared, and text in the script matches what the composition renders. A
   timing bug caught here costs seconds; caught after render it costs the
   whole render plus every downstream check. This is also where
   `declared.json` is derived (see the next section).

3. **Render.**
   `npx remotion render <id> out/<name>.mp4 --codec h264 --crf 17 --color-space bt709`
   — h264 at CRF 17 for a reviewable master; bt709 for predictable color.

4. **Frames.** `video-qa frames out/<name>.mp4` writes native-width frames by
   default; add `--test-width` (legibility), `--diff` (pop/abrupt-change), and
   `--sheet` (staging order) as the question bank needs. Note the run folder:
   all artifacts in the table above live there.

5. **Check (free, local, every frame).** `video-qa check <framesDir>` —
   black/blank, frozen, and flash checks, measured not guessed. Every finding
   arrives with its measurement (check type, value, threshold, severity). Run
   it with `--declared declared.json` so intentional edits are suppressed, not
   flagged. This pass is free: run it on every frame, every time.

6. **Text.** `video-qa text <framesDir> --engine local|clairic|auto`.
   Integrity-vs-script runs free on full-resolution frames with the local
   engine. Legibility is NOT decided here — it is a test-width perception
   question for step 7. With `auto`, the engine is chosen once for the whole
   run (local when a local engine is installed, otherwise CLAIRIC); the run
   report states which engine produced the results.

7. **Ask CLEF, with controls.**
   `video-qa ask <framesDir|video> --questions questions.json --controls <dir>`
   (add `--model clef-flash` for cheap sweeps; default is `clef`). Start from
   the default bank at `templates/questions.example.json` or a project copy.
   Before the run: synthesize positive controls from the user's own frames
   with `video-qa synthesize <framesDir> --out <controlsDir>` (black, ghost,
   and 96px-left-edge-shift controls plus `controls.json`, with trips already
   mapped to the default bank ids — re-map them if the bank uses different
   ids). Before the run: state the estimated frame count and cost and get the
   OK; the script also prints its own estimate and requires `--yes` above 240
   frames. On videos longer than ~15 s, run the sampled sweep (e.g.
   `frames --fps 2`) and full-read only flagged ranges. Controls travel in
   their OWN requests (one control per request), never mixed with real frames,
   and are excluded from the main tally; a control that does not trip its
   question marks the run `unreliable` in `answers.json` and returns exit
   code 1 — so does a controls.json whose trips map to no question id. If
   that happens, say so in the report and let measurements decide. Batches
   sweep first; failures are auto-isolated per frame (see Exit semantics
   below).

8. **Reconcile and open frames.** For every question answer:
   - Model and measurement agree → accept. No open.
   - Answer fails (at/above pass line) → finding.
   - Null, low confidence, or within the escalate margin of the pass line →
     open the frame.
   - Model and measurement DISAGREE → the measurement decides the finding;
     the opened frame explains why. This is the core rule: open a frame only
     on disagreement or escalation, never for comfort.

   Before opening any frame, append an entry to `opened.json` in the run
   folder (create the file with an empty array if absent). Fields —
   `measurement` holds only values the commands actually emit (check values
   and thresholds, OCR text, clef probabilities):

   ```json
   {
     "frame": 120,
     "time_s": 4.0,
     "question": "pop",
     "model_answer": "noul 0.11",
     "measurement": "check flash jump 74.2 (threshold 60) at frame 120",
     "reason": "model and measurement disagree",
     "finding": "bright flash inside the card transition, not a declared effect"
   }
   ```

   Add `finding` after the frame has been looked at. The entry count is the
   "frames opened by the agent" number in the report.

9. **Critics.** Select at most 32 frames: frames with findings, settled beats,
   transitions, arrivals, motion peaks. Start three parallel subagents
   (craft, clarity, freshness), each with `CLEFCUT-CRITIC-<run-id>` as the
   first prompt line. Critics see only their frames, the brand info, and the
   rubric. Craft + clarity score 1–10 (pass = 8+ both); freshness gives a
   verdict only. Never approve your own hero element.

10. **Fix.** Fix the defects in the composition. Re-render. Re-run steps 4–9.
    Maximum 3 fix rounds; then stop and report what is still open.

11. **Re-check changed ranges.** After a fix round, do not re-run the model
    pass on the whole video: re-extract only the changed range into a FRESH
    `--out` dir (`frames <video> --frames A-B --out range1/`; A-B is 0-based
    and frame-accurate) and re-run check/text/ask on those frames. The script
    also auto-clears managed files (frame PNGs + manifest.json) when
    re-extracting into an existing frames dir, and REFUSES a dir that holds
    any unrelated file — a fresh dir per range avoids both stale frames and
    the refusal. Unchanged frames keep their earlier verdicts. This is the
    main cost saver on iterations.

12. **Final report.** On the exact file the user will deliver, re-verify any
    range touched since the last pass, then write the report:

    - **Findings table**: one row per finding — id, severity, frame, what was
      wrong, the fix, and before/after frame paths (both image files).
    - **Cost line**: model spend from the runs' `usage` numbers where
      available, prefixed with the plan and prices used; any projected or
      non-usage-sourced number carries the word "estimate".
    - **Coverage statement**, three counts, so the reader knows what was
      actually checked: frames measured (local, all) vs frames model-read
      (sampled or flagged) vs frames critic-seen (≤32).
    - **Open items**: anything unresolved after 3 rounds, any control that
      failed (which makes those answers unreliable), and any finding
      suppressed as declared design (with its declaring reason).

## declared.json — declaring intentional edits

Frozen, black, and flash findings are cross-checked against the project's
DECLARED cuts, holds, blackouts, and effects before becoming findings.
`check --declared declared.json` moves matching findings to `suppressed` in
findings.json (with the declaring reason) and excludes them from the exit
code. Frame numbers are inclusive:

```json
{ "cuts": [30, 75], "holds": [[120, 180]], "blackouts": [[0, 12]], "effects": [[200, 208]] }
```

Suppression rules: flash within 2 frames of a cut or inside `effects`; frozen
inside `holds`; black inside `blackouts` or within 2 frames of a cut.

Derive the numbers from the Remotion schedule or composition source, not by
eyeballing: `cuts` at frame boundaries where `<Sequence from={...}>` elements
start/end or the timeline visibly switches scenes (from × fps); `holds` where
motion is deliberately frozen (a held frame, a paused spring, a still card);
`blackouts` for intentional black ranges (intro card, dip-to-black); `effects`
for deliberate strobes/flashes. The schedule check in step 2 produces exactly
this frame math.

## Exit semantics, cost gate, isolation

- **Exit 0** = all pass. **Exit 1** = attention needed — any finding, any
  escalation, or an unreliable controls run. **Exit 2** = error; the fix hint
  is on stderr.
- **Cost gate**: `text` (clairic), `ask`, and `extract` print a
  frame/request/cost estimate before the first request; more than 240 frames
  requires `--yes` (or `CLEFCUT_YES=1`). State the estimate to the user and
  get the OK before any of these runs, regardless of the gate.
- **Isolation**: `ask` sends batches first; any multi-frame batch containing
  a fail or escalate is auto-isolated — re-asked one image per request — and
  per-frame rows replace the batch rows in answers.json (usage of both passes
  is recorded). Escalations from a batch sweep may therefore include the
  isolation pass.

## Question-file schema

The schema `ask` reads (run the script with `--help` for its authoritative
copy); `templates/questions.example.json` is a ready-to-use instance:

```json
{
  "questions": {
    "<id>": {
      "type": "noul" | "choice" | "score",
      "instructions": "one defect, phrased so high = defect present",
      "criteria": [ "level 0 (best)", "...", "level N (worst)" ],
      "defect_options": ["option-id"]
    }
  },
  "pass": { "<id>": 0.5 },
  "escalate_margin": 0.3,
  "severity": { "<id>": "blocker" | "major" | "minor" },
  "escalate_only": ["<id>"]
}
```

- `criteria` is required for `score` (an ordered array of 2–10 levels, WORST
  LAST) and for `choice` (an object of option → description); noul omits it.
  `defect_options` (choice only) names the options that mean "defect".
- Every answer is reduced to a 0–1 defect probability: noul → the `noul`
  value (probability of yes); score → `score / (levels - 1)`; choice → the
  probability of the `defect_options`.
- `pass` is the defect threshold per question: defect probability at or above
  it is a FAIL (finding).
- `escalate_margin` (default 0.3): defect probability at or above
  `pass - margin` but below `pass` escalates (open the frame). Null and
  missing answers always escalate.
- `severity` and `escalate_only` are top-level maps, not per-question fields.
  Ids in `escalate_only` never produce findings; a would-be fail becomes an
  escalate.

Question wording, controls, and recipes: `references/question-bank.md`.

## No-model fallback mode

When the user has not authorized uploads, or the API is unavailable, run a
local-only pass: `video-qa text --engine local`, then `frames` + `check`, and
skip `ask` entirely. Report it as a LOCAL-ONLY PASS, never as full QA, and say
what was not covered: no perception checks (legibility at test width), no
staging or hierarchy judgments, and no controls — local-only covers
measurements and text integrity only.

## Hand-off rules

1. Hand the user the final report, the run folder path, and the delivered
   file path, in that order.
2. Every number in the report traces to a file in the run folder (findings,
   usage, opened.json). Do not type numbers that no file produced.
3. If the user asks for a small change to a delivered video: fix in the
   composition, re-render, re-check only the changed ranges. This skill does
   not splice or patch delivered files.
4. If the user asks what the critics saw: the critics do not scroll through
   the whole video — every frame was measured locally, the flagged and
   sampled frames were read by CLEF, and the critics looked only at the ≤32
   selected frames (plus `sheet.png` when a contact sheet was generated).
