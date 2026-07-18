# Vocabulary -- Delegate My Work

The operational language for specifying a loop. Reach for a term only when a loop calls for it -- never as a checklist. Mandate nothing structural: a loop needs no AI, no checkpoint, and no schedule unless the grilling shows it does.

## loop

A recurring pattern in the user's work: a daily triage, a weekly report, a deck update, a spreadsheet cleanup, a file handoff, or a step repeated across every project. Picturing the work as loops within loops reveals how predictable it is, which is what makes a loop worth **delegating**.

## delegate

Hand a loop to AI or automation -- fully, partly, or as support. How much is handed over is the **delegation level** (Automate / Co-pilot / Assist), defined in `SKILL.md`.

## tool access map

The record in `NOTES.md` of tools the employee can actually use. Each relevant tool must have one of these statuses:

- **Available**
- **Available with admin approval**
- **Unavailable**
- **Blocked by policy**
- **Unknown - verify**

Do not infer availability from tool existence. Ask, inspect workspace evidence when available, or mark `Unknown - verify`.

## preferred route

The best path for supporting or automating the loop given the employee's access, data sensitivity, policy constraints, and desired delegation level. A preferred route can be an existing assistant, Office add-in, coding/agentic builder, no-code/RPA/API automation, manual bridge, or a decision not to automate yet.

## fallback route

The alternative path if the preferred route is unavailable, blocked, too expensive, or not approved. Every loop should have a fallback unless the preferred route is confirmed available and policy-safe. Fallbacks should keep the employee moving, not merely say "wait for access."

## blocked route

A route that would otherwise fit the work but cannot be used because access is unavailable, policy blocks it, data sensitivity is too high, or required admin approval is missing. Name the blocker and choose a fallback.

## manual bridge

A human-run process improvement that makes the work easier now while a tool, approval, or build is pending. Examples: a checklist, template, saved prompt, naming convention, export/import routine, spreadsheet formula, or handoff note. Use this when all AI routes are blocked or uncertain.

## trigger

What fires each run of the loop:

- **event** -- something happens (a new email, a file arrives, a meeting ends, a CRM record changes).
- **schedule** -- a clock fires (every morning, every Friday, at month end).

Event-triggering is usually more efficient: the loop runs exactly when there is work, not on a guess.

## checkpoint

A human-in-the-loop point where the user is asked to verify or decide before the loop proceeds. Automate loops have none; Co-pilot loops have one or few; Assist loops are mostly checkpoints because the human leads.

## push right

Defer the checkpoint as far as it will go. Do maximal work before involving the human, so they are asked once, late, with everything prepared -- not interrupted early for a decision that could wait.

## brief

What a checkpoint presents: a tight, decision-ready summary of what was produced, why, what changed, and where to inspect the asset. The user reviews a brief, not raw output.

## data sensitivity

The privacy, compliance, customer, financial, HR, legal, or company-confidential risk in the loop's inputs and outputs. Sensitive loops need approved tools, minimum necessary data, and often an IT/security checkpoint before implementation.

## definition of done

A spec is done when it states preferred route, access status, fallback route, approval/install need, data sensitivity, delegation level, and checkpoint placement, and an implementer could build the automation or support workflow without asking a single question.
