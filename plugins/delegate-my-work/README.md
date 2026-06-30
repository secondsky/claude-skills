# Delegate My Work

Interview yourself about your work, find the **loops** worth handing to AI, and turn each into a buildable spec.

## What it does

`delegate-my-work` runs a relentless, one-question-at-a-time interview (the **grilling** discipline) about how you actually work. It finds recurring **loops** — daily triage, weekly reports, a step repeated on every project — and specs each one for **delegation** to AI at one of three levels:

- **Automate** — AI runs it end-to-end, no human checkpoint.
- **Co-pilot** — AI does the work, you approve a decision-ready brief.
- **Assist** — you run it, AI helps at specific points.

Each loop becomes a spec in `automations/<loop>.md`, detailed enough that an implementer (human or agent) could build it without asking a question. Your tools, channels, and terminology are captured in `NOTES.md`, so the session is stateful and resumable.

## Usage

Auto-discovered — just describe your situation:

> "Help me figure out what AI could take off my plate."
>
> "I keep manually copying these reports every Monday — can this be automated?"

Or run the command with a work area to focus on:

```
/delegate-my-work:delegate email triage
```

Leave the argument empty to have it propose loops from your `NOTES.md`:

```
/delegate-my-work:delegate
```

The interview is driven by the `AskUserQuestion` tool — one question at a time, each with a recommended answer — so you steer by picking an option (or typing your own).

## Output

```
NOTES.md                      # your tools, channels, and terminology
automations/
  email-triage.md             # one spec per loop, ready to build
  weekly-report.md
```

## Keywords

automate my work, delegate to AI, what can AI do for me, half-automate, AI co-pilot, AI assist, workflow automation, find repetitive work, offload tasks, recurring loops, interview, grilling, spec, human-in-the-loop, checkpoint

## Based on

Combines and retargets three skills by Matt Pocock — **grilling** (the interview discipline) and **loop-me** (the loop lens and spec workspace) — built per **writing-great-skills** (leading words, progressive disclosure, sharp completion criteria).
