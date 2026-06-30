---
name: delegate-my-work
description: Interview the user to find recurring loops in their work and spec each one for delegation to AI. Use when the user wants to automate, half-automate, or offload repetitive work, asks what AI could take off their plate, or runs the delegate-my-work command.
license: MIT
---

# Delegate My Work

Interview the user about their work to find **loops** — recurring patterns worth handing to AI — and write one buildable spec per loop. A job, pictured as loops within loops, reveals how predictable its work really is; that predictability is what makes a loop worth **delegating**.

The method is **grilling**: relentless, one question at a time. The output is specs in the user's workspace that an implementer could build without asking a question.

## The grilling discipline

Interview the user relentlessly about one loop until reaching a shared, buildable understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. Attach a **recommended answer** to every question.

Ask **one question at a time**, waiting for the answer before continuing. Asking several at once is bewildering.

If a question can be answered by exploring the user's files, codebase, or workspace, explore instead of asking.

## Asking with the question tool

Drive each question through `AskUserQuestion` (the harness question tool):

- Ask **exactly one** question per call — never batch.
- Offer 2–4 options. Put the **recommended answer first** and append `(Recommended)` to its label.
- Let the built-in **Other** option carry free-text answers; do not add an "Other" of your own.

If `AskUserQuestion` is unavailable, ask the same one question in plain text, still with a recommended answer. The discipline is one-at-a-time and recommended either way.

## The three delegation levels

Classify every loop by how much of it AI takes, which is set by where the human stays in the loop:

- **Automate** — AI runs the loop end-to-end. No **checkpoint**.
- **Co-pilot** — AI does the work; the human verifies a **brief** at a **checkpoint**, then it proceeds. (Half-automated.)
- **Assist** — the human runs the loop; AI helps at specific points. (Supported.)

Mandate nothing structural: a loop needs no AI, no checkpoint, and no schedule unless the grilling shows it does. The operational vocabulary for a spec — **trigger**, **checkpoint**, **push right**, **brief** — is defined in `references/vocabulary.md`; reach for it while grilling a loop.

## The workspace

State lives in the user's working directory, not in this skill:

- `NOTES.md` — the user's world: the tools they use, the channels they process, and their own terms for both. The source of loops to find.
- `automations/<loop>.md` — one spec per loop. The source of truth for what gets built.

## Steps

Run these in order. Each ends on its completion criterion; do not advance until it is met.

1. **Ground in the user's world.** Read `NOTES.md`. If it is absent or thin, grill about their world — tools, channels, terminology, the shape of their week — before specifying anything. Sharpen fuzzy terms into canonical ones as they surface, and record them. *Done when `NOTES.md` describes their world in their own vocabulary.*

2. **Pick a loop.** If the user named a work area (the command argument), take it. Otherwise read `NOTES.md` and propose loops through the loop lens — including ones the user has not noticed. *Done when one named loop is on the table.*

3. **Grill the loop.** Walk its design tree one question at a time: its **trigger** (an event, or a schedule?); its inputs and sources; the work itself, step by step; the **delegation level**; where the **checkpoint** sits and how far right it can be pushed; what the **brief** shows; how failures and edge cases are handled. For ready question trees by work type, load `references/question-bank.md`. *Done when no open question remains on any branch.*

4. **Place the human.** Choose the level — Automate, Co-pilot, or Assist. For Co-pilot and Assist, place the checkpoint and **push it right**: do maximal work before involving the human, so they are asked once, late, with everything prepared. *Done when the level is chosen and its checkpoint placed — or declared none, for Automate.*

5. **Write the spec.** Write `automations/<loop>.md` using the structure in `references/spec-template.md`. *Done when it meets the definition of done below.*

6. **Next loop.** Ask whether another loop is worth specifying, then repeat from step 2. *Done when the user is out of loops worth delegating.*

## Definition of done

A spec is done when an implementer agent could build the automation **without asking a single question**, with the delegation level decided and its checkpoint placed. Grill until then; nothing is done while a question remains.

## Additional resources

- `references/vocabulary.md` — trigger, checkpoint, push right, brief, and the loop/delegate anchors. Load while grilling and placing the human (steps 3–4).
- `references/question-bank.md` — grilling question trees per work domain. Load when grilling a specific loop (step 3).
- `references/spec-template.md` — the `automations/<loop>.md` structure and a worked example. Load when writing a spec (step 5).
