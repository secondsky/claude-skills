# Vocabulary — Delegate My Work

The operational language for specifying a loop. Reach for a term only when a loop calls for it — never as a checklist. Mandate nothing structural: a loop needs no AI, no checkpoint, and no schedule unless the grilling shows it does.

## loop

A recurring pattern in the user's work: a daily triage, a weekly report, a step repeated across every project. Picturing the work as loops within loops reveals how predictable it is — which is what makes a loop worth **delegating**. Use the lens to find loops worth specifying, and to propose ones the user has not noticed.

## delegate

Hand a loop to AI — fully, partly, or as support. How much is handed over is the **delegation level** (Automate / Co-pilot / Assist), defined in `SKILL.md`.

## trigger

What fires each run of the loop:

- **event** — something happens (a new email, a new issue, a file dropped).
- **schedule** — a clock fires (every morning, every Friday).

Event-triggering is usually more efficient: the loop runs exactly when there is work, not on a guess.

## checkpoint

A human-in-the-loop point where the user is asked to verify or decide before the loop proceeds. Automate loops have none; Co-pilot loops have one or few; Assist loops are mostly checkpoints — the human leads.

## push right

Defer the checkpoint as far as it will go. Do maximal work before involving the human, so they are asked once, late, with everything prepared — not interrupted early for a decision that could wait.

## brief

What a checkpoint presents: a tight, decision-ready summary — what was produced, why, and a link down to the asset itself — never the raw output. The user reads a brief, not a draft. Speed of review is imperative.

## definition of done

A spec is done when an implementer agent could build the automation without asking a single question, with the delegation level decided and its checkpoint placed. Nothing is done while a question remains.
