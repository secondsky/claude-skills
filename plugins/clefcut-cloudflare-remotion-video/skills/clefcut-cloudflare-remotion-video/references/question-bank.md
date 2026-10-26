# Question bank

Questions for `ask` runs, adapted from the SageCut question bank to the CLEF
question types (`noul`, `choice`, `score`). A ready-to-use file lives at
`templates/questions.example.json`.

## The convention (state it, keep it)

Every question in this bank is written so that a HIGH answer means the defect
is PRESENT:

- `noul`: the answer `noul` is the probability the answer is YES — so every
  noul question asks "is the defect present?", never "is this good?".
- `score`: `criteria` are ordered worst-last (best level at index 0, worst at
  the highest index), so a higher score is always worse.

This is why `legible_feed` below asks "is any word hard to read?" while the
original SageCut question asked "can every word be read?" and failed on "no".
Mixing the two phrasings in one bank makes pass lines unreadable — do not.

## Pass lines and escalation (authoritative copy)

THIS file is the authoritative copy of the escalation rules. SKILL.md carries
only a summary pointing here.

The script reduces EVERY answer to a 0–1 defect probability (higher = worse):

- `noul` → the `noul` value (the probability of yes).
- `score` → `score / (levels - 1)` — so with 5 levels, native score 2 becomes
  0.5.
- `choice` → the probability of the question's `defect_options`.

The question file then carries per-question thresholds and one margin:

- `pass` is the defect threshold per question: numeric, in (0,1]. A defect
  probability at or above `pass` is a FAIL — a finding.
- `escalate_margin` (default 0.3): a defect probability at or above
  `pass - margin` but below `pass` escalates: open the frame.
- Null and missing answers ALWAYS escalate.
- `choice` answers escalate when their OWN `confidence` is below the fixed
  0.5 floor (never the pass threshold).
- Ids listed in the top-level `escalate_only` array never produce findings; a
  would-be fail becomes an escalate. `severity` is a top-level map of
  id → blocker | major | minor.

## Gate questions (the 9)

| Id | Type | Severity | Asked on | Escalation (defect probability) |
|---|---|---|---|---|
| `staging_order` | score (4 levels) | major | `sheet.png` contact-sheet cells (`frames --sheet`) | pass 0.67 (native level 2 of 3): at/above fails; 0.37–0.67 escalates |
| `dead_frame` | noul | minor | full-resolution frames | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `pop` | noul | major | `diff/frame_%06d.png` images (`frames --diff`) | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `abrupt_change` | noul | major | `diff/frame_%06d.png` images (`frames --diff`) | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `overlap` | noul | major | full-resolution frames | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `legible_feed` | noul | **blocker** | `test/frame_%06d.png` frames (`frames --test-width`, default 350) | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `ui_occlusion` | noul | major | `safe/frame_%06d.png` frames (`frames --test-width --safe <platform>`) | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `text_integrity` | noul | major | full-resolution frames | pass 0.5: at/above fails; 0.2–0.5 escalates |
| `hierarchy` | score (5 levels) | major | full-resolution frames | escalate_only, line 0.5 (native 2 of 4): never a finding, only opens |

`pop` and `abrupt_change` are defined on the DIFF images — consecutive-frame
absolute difference, amplified (`frames --diff` writes them as
`diff/frame_%06d.png`; the diff image at index i is the change BETWEEN
frames i-1 and i, attributed to the later frame); bright areas in a diff
image are what changed between the two frames. `legible_feed` is asked on
frames resized to the TEST WIDTH (`frames --test-width`; N defaults to 350
px — the feed-size perception frame; a smaller N such as 210 for a 9:16 feed
or 375 for 1:1 can be passed explicitly), because legibility is a perception
question at feed size, not at desktop size. `staging_order` reads the cells
of `sheet.png` (`frames --sheet`) — the cells are in time order but carry NO
labels. `ui_occlusion` is asked on the SAFE-ZONE frames —
`frames --test-width --safe shorts|tiktok|reels|creator` writes
`safe/frame_%06d.png` copies of the test-width frames with translucent red
boxes over the platform's UI occlusion zones; the zone numbers live in ONE
place, the `SAFE_ZONES` constant table in `scripts/video-qa.mjs`
(community-measured; for Reels the official ads-only guideline is a bottom
40% keep-out, which the overlay deliberately does not use so organic and
paid content share one overlay). The remaining questions run on the
full-resolution frames.

Because each question is defined on a different artifact, an `ask` run is
ONE PASS PER ARTIFACT, each pass with its own question file: the main frames
dir, then `test/`, `diff/`, `safe/`, and a per-sheet dir for
`staging_order` (see `references/workflow.md`, step 7). The cost gate is per
pass — sum the estimates when quoting a total.

Exact instruction wording (the authoritative copy is
`templates/questions.example.json`):

- `staging_order` (score, criteria best→worst): "Cells are in time order,
  left-to-right, top-to-bottom, and carry no labels. Assume the elements are
  meant to arrive in a sensible reading order for this composition (e.g.
  background or main claim before supporting details). How far is this
  sequence from a clean one-at-a-time arrival order, where each element
  finishes arriving before the next one starts?" Levels: 0 "Every element
  finishes arriving before the next one starts, in a sensible reading order"
  / 1 "Order is correct, but one element is still settling as the next one
  starts" / 2 "One element starts while the previous element is still visibly
  arriving" / 3 "Two or more elements arrive at once, or an element arrives
  clearly out of order".
- `dead_frame` (noul): "Is this frame essentially empty: a flat background
  with at most one small mark and nothing a viewer can read?"
- `pop` (noul, asked on a frame-diff image): "This is a difference image of
  two consecutive frames inside a transition (not a hard cut). Bright areas
  changed between the two frames. Does a large part of the picture change in
  this single step, so that it would read as a pop or glitch instead of smooth
  motion?"
- `abrupt_change` (noul, on a frame-diff image): "This is a difference image
  of two frames a few milliseconds apart. Bright areas changed. Does a large
  part of the picture change at once (a pop or a hard fill), instead of a
  small object moving?"
- `overlap` (noul): "Does any text sit on top of other text or on a busy
  graphic so that a word is hard to read, or does a moving shape or card cross
  a label?"
- `legible_feed` (noul, BLOCKER, at test width): "This frame is shown at
  phone-feed size. Ignore decorative text that is part of an object, texture
  or background. All other on-screen text counts, including small labels,
  tags and numbers. Is any such word blurred, merged with another line, or
  too small to read without zooming?"
- `ui_occlusion` (noul, on safe-zone frames): "This frame has translucent red
  boxes shaded over the APPROXIMATE areas where the platform's interface
  (buttons, captions, icons) typically covers the video (community-measured
  zones; exact placement varies by device and app version). Is any text or key
  graphic inside the shaded red zones?"
- `text_integrity` (noul): "Is any on-screen word partly hidden, split into
  two colours, overlapped by another word, or followed by a stray fragment of
  text, so that a word could be misread as another word or looks broken?"
- `hierarchy` (score, escalate_only, criteria best→worst): "How unclear is the
  reading order of this frame? Higher means worse." Levels: 0 "One obvious
  read path; tiers clearly separated by size, weight and space" / 1 "Clear
  order; tiers distinct; minor crowding" / 2 "Readable order, but two tiers
  look nearly the same size or weight" / 3 "Entry point exists but the second
  read is ambiguous" / 4 "No clear entry point; elements compete equally".

## Sweep and problem questions

For the sampled model pass on longer videos (adapted from the SageCut sweep).
All noul; all defect-phrased per the convention.

| Id | Instructions |
|---|---|
| `cut` | "Is any word or letter cut off by the edge of the picture, broken, or partly hidden by something?" |
| `over` | "Does any text sit on top of a busy picture, shape or object, instead of on a plain background, so that the letters are harder to read?" |
| `overlap` | "Does any text overlap other text, so that the letters touch or cross?" |
| `glitch` | "Is there a visible rendering glitch in this picture: a dark band, a smear, a hole, a torn or doubled shape, or a stray object?" |
| `legible` (at test width) | "At this small size, is any large word or number hard to read?" |

## Positive controls

Every question in a run ships with a control: a frame with a KNOWN defect,
made from the user's own frames. Controls travel in their OWN requests (one
control per request), never mixed with real frames (`ask --controls <dir>`).
If CLEF answers "no defect" on a control, the "pass" answers to that question
in that run are unreliable — the script marks the run `unreliable` and exits
1; say so in the report and let the measurement decide. When a controls.json's
`trips` ids match NO question id in the bank, `ask --controls` warns
("0 of N controls map to any question id — controls validated nothing") and
ALSO marks the run unreliable: unmapped controls are decorative.

Make controls with the free `synthesize` command:

```
node "<skill-dir>/scripts/video-qa.mjs" synthesize <framesDir> --out <controlsDir>
```

It builds exactly three controls and writes `controls.json` with the trips
ALREADY MAPPED to the default bank ids — re-map them only when the bank uses
different ids:

| Control file | Recipe (what synthesize runs) | Known-bad defect | `trips` emitted |
|---|---|---|---|
| `control_black_<n>.png` | lavfi `color=black:s=WxH` | Fully black / blank frame | `dead_frame` |
| `control_ghost_<n>.png` | the two most-different consecutive frames, blended 50/50 (`blend=all_mode=average`) | Ghost / double exposure | `overlap` |
| `control_shift_<n>.png` | 96px cut off the left edge (`crop=iw-96:ih:96:0`) | Content shifted / hard-cropped edge | `text_integrity` |

Manual recipes, when a control `synthesize` does not make
(`frames/frame_000120.png` stands for any frame from the run — note the
`frame_%06d.png` naming `frames` writes):

```sh
# frozen: one frame duplicated 4x side by side — a known dead hold
ffmpeg -i frames/frame_000120.png -filter_complex "[0][0][0][0]hstack=4" -frames:v 1 controls/freeze.png

# cut: a crop window sliced through content near the edge — known cut-off text
ffmpeg -i frames/frame_000120.png -vf "crop=iw-96:ih:96:0" -frames:v 1 controls/cut.png
```

Add matching entries to `controls.json` (`{"file": "freeze.png", "defect":
"frozen motion", "trips": ["dead_frame", "pop"]}`) so `ask` knows what each
control must trip.

Build controls from the user's OWN frames (brand, palette, and rendering
intact), never from stock images — the point is to prove the model can see
defects in this video's visual language.

## Writing new questions

1. One question, one defect. Plain words about what a viewer sees.
2. Phrase it so high = defect present (the convention above).
3. Give it a control. A question about a defect that cannot exist in your
   frames still needs one — without it, a row of "pass" answers proves nothing.
4. Keep it general: do not name objects that only one video has.
5. Ratings use `score` with ordered, behavior-described levels (2–10, worst
   last); yes/no uses `noul`. Use `choice` only when the answer is genuinely a
   pick among options, and give it a `defect_options` array naming the options
   that mean "defect" — without it the defect probability is always 0 and the
   question can never fail. The default bank uses noul and score only.
6. A model "fail" without a supporting measurement is an item to check, not
   yet a finding. The measurement decides.
