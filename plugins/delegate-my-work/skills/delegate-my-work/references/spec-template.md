# Spec Template -- `automations/<loop>.md`

Write one spec per loop in the user's `automations/` directory. The spec is the source of truth for what gets built, adopted, or run manually. It must meet the **definition of done**: buildable or runnable by an implementer with no open questions.

## Structure

```markdown
# <Loop name>

**Delegation level:** Automate | Co-pilot | Assist
**Preferred tool route:** Existing AI assistant | Office add-in/extension | Coding/agentic builder | No-code/RPA/API automation | Manual bridge | Do not automate yet
**Access status:** Available | Available with admin approval | Unavailable | Blocked by policy | Unknown - verify
**Fallback route:** <specific alternate path>

## Loop
What recurs, how often, and why it matters. One or two sentences.

## Trigger
Event or schedule -- the exact condition that fires each run.

## Inputs & sources
Every input the run needs, and where each comes from.

## Tool access & approval
- Preferred tool: <tool or platform>
- Access status: <one of the exact statuses>
- Approval or install needed: <none, admin install, IT/security review, service account, API access, etc.>
- Blocked route, if any: <tool/path that would work but is unavailable or unsafe>
- Fallback route: <specific alternate route>

## Data sensitivity
What sensitive data is involved, what must stay inside approved systems, and what cannot be sent to unapproved tools.

## Employee workflow
What the employee does before, during, and after the loop. Keep this plain enough for a nontechnical employee to follow.

## Steps
The work itself, in order. Each step concrete enough to build or run.

## Checkpoint & brief
Where the human is asked (or "none" for Automate). What the brief shows: decision-ready summary, changes made, risks, and links to inspect output.

## Manual version
The best human-run version if AI or automation access is unavailable today.

## Buildable automation version
The implementation-ready version: integration points, permissions, outputs, and exact behavior.

## Failure handling
What happens on bad input, an error, denied access, missing approval, or an off-script case. Include the escalation path.

## Acceptance test
The sample run or scenario that proves the loop works.

## Definition of done (build checklist)
- [ ] Trigger is unambiguous.
- [ ] Every input has a named source.
- [ ] Preferred route is stated.
- [ ] Access status uses the approved statuses.
- [ ] Fallback route is stated.
- [ ] Approval or install need is stated.
- [ ] Data sensitivity is addressed.
- [ ] Every step is buildable or runnable as written.
- [ ] Delegation level is decided.
- [ ] Checkpoint is placed (or declared none) and pushed as far right as it goes.
- [ ] Failure handling covers bad input, denied access, and errors.
- [ ] Acceptance test proves the loop.
- [ ] An implementer could build or support this without asking a question.
```

## Worked example

```markdown
# Monday sales report cleanup

**Delegation level:** Co-pilot
**Preferred tool route:** No-code/RPA/API automation
**Access status:** Available
**Fallback route:** Manual bridge using Excel Power Query and a saved review checklist.

## Loop
Every Monday morning, clean the exported sales CSV, refresh the summary table,
and prepare a short update for the sales manager. ~45 minutes per week.

## Trigger
Schedule -- Mondays at 08:30 local, after the CRM export is available.

## Inputs & sources
- Weekly sales CSV -- CRM export folder in SharePoint.
- Account owner list -- Excel table in `Sales Ops/Reference/account-owners.xlsx`.
- Prior report format -- `Sales Ops/Reports/weekly-sales-template.xlsx`.

## Tool access & approval
- Preferred tool: Power Automate flow plus Excel Online script.
- Access status: Available.
- Approval or install needed: none for the employee; service account review needed before team-wide rollout.
- Blocked route, if any: Excel AI add-in is unavailable.
- Fallback route: refresh a Power Query template manually, then paste the brief into email.

## Data sensitivity
Contains customer names and revenue. Keep files in SharePoint and do not upload
to unapproved external AI tools.

## Employee workflow
The employee drops the CRM export into the SharePoint folder, reviews the
generated brief, fixes flagged rows if needed, and sends the approved summary.

## Steps
1. Watch the SharePoint folder for a new Monday CRM export.
2. Validate required columns: account, owner, stage, amount, close date.
3. Normalize owner names using the account owner list.
4. Refresh the summary table in the weekly report template.
5. Flag missing owners, duplicate accounts, or rows with invalid dates.
6. Assemble a brief with totals, changed pipeline, flagged rows, and a link to the workbook.

## Checkpoint & brief
One checkpoint after the workbook and brief are ready. The brief shows totals,
top changes, flagged rows, and a link to the workbook. No email is sent before
approval.

## Manual version
Use the Power Query template, refresh it manually, review the flagged rows tab,
and copy the saved summary format into email.

## Buildable automation version
Build a Power Automate flow triggered by the SharePoint upload. Run an Excel
Online script to validate and refresh the workbook, then create a draft email
with the brief and workbook link.

## Failure handling
Missing columns -> stop and send a brief listing missing fields. Invalid rows ->
leave them in the flagged rows tab and continue with valid rows. Permission
failure -> tell the employee which SharePoint or service account access is missing.

## Acceptance test
Given last Monday's CRM export with one missing owner and one invalid date, the
flow produces the refreshed workbook, flags both rows, and drafts the email
without sending it.

## Definition of done (build checklist)
- [x] Trigger is unambiguous.
- [x] Every input has a named source.
- [x] Preferred route is stated.
- [x] Access status uses the approved statuses.
- [x] Fallback route is stated.
- [x] Approval or install need is stated.
- [x] Data sensitivity is addressed.
- [x] Every step is buildable or runnable as written.
- [x] Delegation level is decided.
- [x] Checkpoint is placed and pushed right.
- [x] Failure handling covers bad input, denied access, and errors.
- [x] Acceptance test proves the loop.
- [x] An implementer could build or support this without asking a question.
```
