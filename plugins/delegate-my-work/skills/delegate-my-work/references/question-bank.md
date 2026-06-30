# Question Bank — Grilling Loops by Work Domain

Ready question trees for common kinds of work. Use them to seed the grilling in step 3 — walk the branches one question at a time, each with a recommended answer. These are starting points, not a script; follow the loop where it actually goes.

Every domain shares a spine: **trigger → sources → the work → delegation level → checkpoint & brief → failures**. The notes below pre-fill the likely shape so the grilling can confirm or overturn it fast.

## Comms / email / message triage

- **Likely trigger:** event — a new message arrives.
- **Sources:** inbox or channel, sender history, prior threads, a contacts/CRM list.
- **Candidate level:** Co-pilot — AI drafts replies and sorts; the human approves sends.
- **Checkpoint:** before anything is sent or deleted.
- **Grill:** Which messages are in scope vs. ignored? What marks a message reply-worthy? What may be auto-archived with no review? What must a draft contain to be approvable at a glance? Which senders or topics must never be auto-handled?

## Reporting / dashboards / status updates

- **Likely trigger:** schedule — daily, weekly, per sprint.
- **Sources:** analytics, databases, spreadsheets, project trackers.
- **Candidate level:** Automate (numbers) or Co-pilot (numbers + a narrative the human signs off).
- **Checkpoint:** before the report reaches its audience.
- **Grill:** What exact metrics, from where? What counts as "worth flagging" in the narrative? Who reads it and what decision do they make from it? Is a numbers-only version safe to send unreviewed?

## Code review / pull requests

- **Likely trigger:** event — a PR is opened or updated.
- **Sources:** the diff, the codebase, CI results, linked issues, style guides.
- **Candidate level:** Co-pilot — AI reviews and comments; the human approves merges.
- **Checkpoint:** before approve/merge.
- **Grill:** What classes of issue matter (correctness, security, style)? What may be auto-commented vs. needs a human? What must block a merge? Which paths or repos are out of scope?

## Content / writing / drafting

- **Likely trigger:** event (a request) or schedule (a cadence — a weekly post).
- **Sources:** briefs, prior pieces, style/brand guides, research notes.
- **Candidate level:** Co-pilot — AI drafts; the human edits and publishes.
- **Checkpoint:** before publish.
- **Grill:** What is the brief and where does it come from? What voice and constraints are fixed? What research must precede a draft? What does "ready to edit" look like vs. "ready to publish"?

## Data entry / migration / reconciliation

- **Likely trigger:** event (a new record/file) or schedule (a batch).
- **Sources:** source systems, target systems, mapping rules, validation rules.
- **Candidate level:** Automate, if the rules are exhaustive; else Co-pilot for the exceptions.
- **Checkpoint:** on exceptions and ambiguous rows only — **push right** past the clean ones.
- **Grill:** What is the exact field mapping? What makes a row ambiguous? What is the rollback if a batch is wrong? What sample proves a clean run?

## Scheduling / ops / routine admin

- **Likely trigger:** event (a request) or schedule (a recurring duty).
- **Sources:** calendars, queues, runbooks, ticketing.
- **Candidate level:** Co-pilot or Assist — judgment and stakes vary.
- **Checkpoint:** before anything irreversible (a booking, a charge, a customer-facing action).
- **Grill:** What is reversible vs. not? What constraints or preferences are fixed? What is the escalation when the routine hits something off-script?

## Research / monitoring / alerting

- **Likely trigger:** schedule (a sweep) or event (a threshold crossed).
- **Sources:** the web, feeds, internal metrics, watchlists.
- **Candidate level:** Automate the watch; Co-pilot the response.
- **Checkpoint:** before acting on a finding — the watch itself runs unattended.
- **Grill:** What exactly is watched, and how often? What threshold makes a finding worth surfacing? What does the alert brief show? What is noise that must be suppressed?
