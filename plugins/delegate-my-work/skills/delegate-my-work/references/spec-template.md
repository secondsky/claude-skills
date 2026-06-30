# Spec Template — `automations/<loop>.md`

Write one spec per loop in the user's `automations/` directory. The spec is the source of truth for what gets built; it must meet the **definition of done** — buildable by an implementer with no open questions.

## Structure

```markdown
# <Loop name>

**Delegation level:** Automate | Co-pilot | Assist

## Loop
What recurs, and how often. One or two sentences.

## Trigger
Event or schedule — the exact condition that fires each run.

## Inputs & sources
Every input the run needs, and where each comes from.

## Steps
The work itself, in order. Each step concrete enough to build.

## Checkpoint & brief
Where the human is asked (or "none" for Automate). What the brief shows — the
decision-ready summary, and the link down to the asset.

## Failure handling
What happens on bad input, an error, or an off-script case. The escalation path.

## Definition of done (build checklist)
- [ ] Trigger is unambiguous.
- [ ] Every input has a named source.
- [ ] Every step is buildable as written.
- [ ] Delegation level is decided.
- [ ] Checkpoint is placed (or declared none) and pushed as far right as it goes.
- [ ] Failure handling covers bad input and errors.
- [ ] An implementer could build this without asking a question.
```

## Worked example

```markdown
# Morning email triage

**Delegation level:** Co-pilot

## Loop
Every weekday morning, sort the overnight inbox and draft replies to anything
that needs one. ~30–60 messages.

## Trigger
Schedule — 08:00 local, weekdays. (Could move to event-triggered per message
later; schedule chosen to batch the human's one review.)

## Inputs & sources
- Overnight messages — Gmail inbox, since last run.
- Sender history & prior threads — Gmail.
- "VIP" and "never-auto" sender lists — NOTES.md.

## Steps
1. Pull messages since last run.
2. Classify each: reply-needed, FYI, or archive.
3. Auto-archive FYI/newsletter mail (no review).
4. Draft a reply for each reply-needed message, grounded in its thread.
5. Assemble a brief: one line per drafted reply, plus each VIP message.

## Checkpoint & brief
One checkpoint, after all drafts exist (pushed right — the human reviews once).
Brief: a list — sender, one-line summary, the draft's first line, and a link to
each full draft. No sends, and no deletes of reply-needed mail, happen before
approval. VIP senders are never auto-archived.

## Failure handling
Can't classify a message → leave it untouched and flag it in the brief. Draft
generation fails → list the message with no draft; do not block the rest.

## Definition of done (build checklist)
- [x] Trigger is unambiguous.
- [x] Every input has a named source.
- [x] Every step is buildable as written.
- [x] Delegation level is decided.
- [x] Checkpoint is placed and pushed right.
- [x] Failure handling covers bad input and errors.
- [x] An implementer could build this without asking a question.
```
