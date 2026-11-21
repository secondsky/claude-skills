# Clip selection: the authoritative rubric

THE single source of truth for what makes a candidate worth cutting: the five
criteria as CLEF questions (exact wording — the same text as
`templates/questions.example.json`), the thresholds, the 0–10 mapping, the
candidate archetypes, the genre-to-duration table, and the boundary rules.
SKILL.md carries only the summary.

## Defect-direction convention

Every question is worded so a HIGH value means a PROBLEM is present:

- The four `noul` questions are phrased as defect questions — a high `noul`
  probability (the probability the answer is yes) means the defect is there.
- `visual_energy` is a 0–4 score whose levels run from most energetic (0) to
  most static (4), so a higher score also means worse.
- The script reduces every answer to a 0–1 defect probability: noul → the
  `noul` value; score → `score / (levels - 1)`; choice → the HIGHEST
  probability among the options named in `defect_options` (Math.max over
  their probabilities, NOT their sum).

## The five criteria as CLEF questions

Ask all five in ONE `rate` request per segment sheet (clef-flash default):

| Id | Type | Exact `instructions` |
|---|---|---|
| `opens_on_action` | `noul` | "The image is a contact sheet of one candidate segment; cells run in time order and span the whole segment. Does the segment open on throat-clearing, greetings, filler words such as 'so' or 'and', or dead air, so that no real content appears within roughly the first second?" |
| `complete_thought` | `noul` | "Does the segment fail to read as one complete, self-contained idea from start to finish, for example by covering only half of an idea or by drifting between two separate topics?" |
| `ends_clean` | `noul` | "Does the segment end mid-sentence, mid-word, or in the middle of a visual action, so that the ending feels chopped off rather than finished?" |
| `needs_context` | `noul` | "Would a viewer who sees only this segment be confused because it refers to people, events, numbers, or earlier statements that are never shown or explained inside the segment itself?" |
| `visual_energy` | `score` | "Rate the visual energy of the segment for a sound-off, scroll-fast feed. Level 0 is the most energetic; level 4 is a frozen screen." Criteria (lowest first): "Strong visual energy: frequent motion, action, expressive faces, or on-screen text that keeps changing" / "Moderate visual energy: regular cuts, gestures, or text changes" / "Mild visual energy: one mostly static shot with occasional movement" / "Minimal visual energy: a nearly frozen screen" / "No visual energy: a single static screen, like a still image" |

## Thresholds, escalate band, confidence floor

- `pass` per question (defect probability at or above it = FAIL): the four
  noul questions 0.5; `visual_energy` 0.75 (reduction = score/4, so score
  ≥ 3 — minimal or no energy — fails, at minor severity).
- `escalate_margin` 0.3: a defect probability at or above `pass - 0.3` but
  below `pass` escalates to agent review of that segment's sheet. Null and
  missing answers always escalate.
- Choice questions (if a custom bank adds any): escalate when the answer's
  OWN confidence is below the fixed 0.5 floor — the floor, never the pass
  threshold. A choice question without `defect_options` NEVER fails on
  probabilities: its defect probability is 0, so it can only escalate on
  low confidence. Pass thresholds bind the noul/score defect probability.
- `escalate_only` is empty in the default bank — every question can fail.

## Mapping answers to the 0–10 score

Five criteria × 0–2 points, keep candidates scoring ≥ 7:

| Criterion | 2 points | 1 point | 0 points |
|---|---|---|---|
| opens_on_action (noul defect p) | p < 0.25 | 0.25 ≤ p ≤ 0.6 | p > 0.6 |
| complete_thought (noul defect p) | p < 0.25 | 0.25 ≤ p ≤ 0.6 | p > 0.6 |
| ends_clean (noul defect p) | p < 0.25 | 0.25 ≤ p ≤ 0.6 | p > 0.6 |
| needs_context (noul defect p) | p < 0.25 | 0.25 ≤ p ≤ 0.6 | p > 0.6 |
| visual_energy (score s, 0 energetic – 4 static) | s ≤ 1 | 1 < s ≤ 2.5 | s > 2.5 |

The agent may adjust a segment's total by ±1 with a stated reason backed by
the sheet or the maps (a striking stat read by `read`, a silence-map boundary
fix). Never adjust silently, never adjust more than ±1, and always show the
model's raw numbers next to the adjusted total.

## Candidate archetypes

Hunt for these shapes when building segments (adapted from clueso-ai/skills):

- A strong hook or bold claim
- A concrete demo of one specific outcome
- A striking stat or quote
- A clear before/after
- A Q&A moment with a sharp, complete answer

## Genre-to-duration table

Bounds for `segments --min/--max` (adapted from eachlabs/skills):

| Genre | Look for | Duration |
|---|---|---|
| Gaming | kills, wins, fails, reactions | 15–60 s |
| Sports | scores, plays, celebrations | 30–90 s |
| Podcasts | quotes, insights, debates | 30–120 s |
| Webinars | key points, demos, Q&A | 60–180 s |
| Meetings | decisions, action items | 2–5 min |

Feed platforms reward roughly 30–90 s; TikTok and Reels reward a tighter cut
and a faster hook; professional-feed platforms outside the specs table
tolerate slightly
longer. Outside these genres, the generic creator profile (60–90 s) applies.

## Boundary rules

- Split at a natural sentence or breath boundary — taken from the free
  silence map, never guessed — not mid-word, and not mid-action for anything
  visual.
- Clips open on real content within the first second: no throat-clearing
  lead-in.
- Self-containment test: every candidate must read as a complete thought
  with zero context. If a moment needs setup, either push the start earlier
  to include the minimum setup, or it is not a good candidate.
- Never cut inside a word (the silence map is the guardrail; `cut` reports
  `duration_error_ms` for the mechanical side).

## Triage, not truth — and the human gate

Scores rank candidates for review; they do not decide. Roughly 8–12
candidates per hour of conversational footage is the normal density — never
manufacture weak candidates to hit a count. Before any clip is cut, the user
confirms the picks, and the agent applies the three-question human gate
(adapted from the opus-clip lineage in social-media-skills):

1. Does the clip stand on its own?
2. Does it represent the speaker fairly?
3. Does it serve the audience?

A "no" to any question drops or re-bounds the clip regardless of its score.
When the user asks for N equal pieces, do the mechanical split if they
insist, but flag that equal-interval cuts often land mid-thought and offer
boundary-adjusted alternatives (see `workflow.md`).
