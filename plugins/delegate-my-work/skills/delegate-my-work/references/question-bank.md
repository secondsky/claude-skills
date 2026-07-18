# Question Bank -- Grilling Employee Work Loops

Ready question trees for common employee work. Use them to seed step 4 -- walk branches one question at a time, each with a recommended answer. These are starting points, not a script; follow the loop where it actually goes.

Every domain shares a spine: **trigger -> sources -> work -> tool access -> data sensitivity -> delegation level -> checkpoint & brief -> fallback -> failures**.

## Access check spine

Use these when a loop may depend on a tool:

- **Current access:** Which of these can you use today: ChatGPT/OpenAI, Claude, Microsoft Copilot, Google Workspace AI, Excel/PowerPoint add-ins, no-code/RPA, coding agents, or internal automation tools?
- **Approval path:** If the recommended tool is not available, is admin install, manager approval, IT/security approval, or procurement needed?
- **Policy:** Are there rules about uploading customer, financial, HR, legal, source-code, or confidential company data to external tools?
- **Fallback:** If the preferred tool is unavailable, what route would still help this week: manual bridge, Office script, spreadsheet template, no-code flow, internal IT request, or future-ready spec?

## Spreadsheets / Excel / data cleanup

- **Likely trigger:** schedule (weekly/monthly report) or event (new file exported).
- **Sources:** Excel/CSV files, SharePoint/OneDrive, Google Sheets, CRM exports, finance systems, reference tables.
- **Candidate level:** Co-pilot for reviewed outputs; Automate if field mappings and validations are stable.
- **Access check:** Excel desktop/web? Power Query? Office Scripts? VBA allowed? Microsoft Copilot? Excel add-ins? ChatGPT/Claude file upload allowed? Power Automate or RPA available?
- **Fallbacks:** Power Query template, formulas/macros, manual upload/export, Office Scripts, Power Automate, buildable automation spec.
- **Grill:** What columns always appear? What errors are common? What counts as a clean row? What formulas or pivots are trusted today? Which rows need human review? Where should the cleaned output land?

## Decks / PowerPoint / presentations

- **Likely trigger:** schedule (weekly/monthly deck) or event (meeting, project update, sales review).
- **Sources:** prior deck, outline, spreadsheet/report, CRM/dashboard screenshots, brand templates, speaker notes.
- **Candidate level:** Assist or Co-pilot -- AI drafts slides; human approves narrative and visuals.
- **Access check:** PowerPoint desktop/web? Microsoft Copilot? approved PowerPoint add-in? ChatGPT/Claude file upload? brand asset access? chart export access?
- **Fallbacks:** slide outline plus manual template fill, copied chart exports, Copilot draft, buildable deck-generation spec.
- **Grill:** Who reads the deck? What decision should it support? Which slides repeat? What data updates each time? Which brand/template rules are fixed? What must never be auto-published?

## Email / chat triage

- **Likely trigger:** event -- new email or message arrives; or schedule -- morning review.
- **Sources:** Outlook/Gmail, Teams/Slack, prior threads, CRM, contact lists, calendar.
- **Candidate level:** Co-pilot -- AI drafts replies and sorting; human approves sends.
- **Access check:** Outlook/Gmail AI features? Microsoft Copilot? ChatGPT/Claude allowed with message content? CRM access? rules/filters allowed? automation platform access?
- **Fallbacks:** saved response snippets, inbox rules, manual review checklist, draft-only assistant, IT-built workflow.
- **Grill:** Which messages are in scope? What marks a message reply-worthy? What can be archived or labeled without review? Which senders/topics are sensitive? What must a draft show to approve quickly?

## Meetings / follow-ups / action items

- **Likely trigger:** event -- meeting ends; or schedule -- daily recap.
- **Sources:** calendar, transcript/notes, meeting chat, project tracker, CRM, shared docs.
- **Candidate level:** Assist or Co-pilot -- AI summarizes, drafts follow-ups, or creates tasks; human approves external sends.
- **Access check:** meeting transcription allowed? Teams/Zoom/Meet AI? Copilot? ChatGPT/Claude upload allowed? project tracker integration? calendar access?
- **Fallbacks:** note-taking template, manual action-item checklist, transcript summary prompt, task import CSV, IT workflow.
- **Grill:** Which meetings repeat? Who receives follow-ups? What task fields are required? What should be private? What needs approval before sending?

## CRM / admin updates

- **Likely trigger:** event -- call, email, form, status change; or schedule -- daily cleanup.
- **Sources:** CRM, email, forms, calendar, spreadsheets, support tickets.
- **Candidate level:** Co-pilot for suggested updates; Automate for deterministic field updates.
- **Access check:** CRM automation permissions? API access? approved AI assistant with CRM data? no-code connector? service account? admin approval?
- **Fallbacks:** import template, checklist, saved prompt, no-code flow, internal IT ticket.
- **Grill:** Which fields change? What evidence supports each update? What fields are risky? What must be logged? What errors require rollback or manager review?

## Reporting / dashboards / status updates

- **Likely trigger:** schedule -- daily, weekly, monthly, per sprint.
- **Sources:** spreadsheets, BI dashboards, analytics, project trackers, CRM, finance systems.
- **Candidate level:** Automate for numbers; Co-pilot for narrative the human signs off.
- **Access check:** dashboard export access? spreadsheet access? Copilot/ChatGPT/Claude allowed for summaries? no-code scheduler? internal API?
- **Fallbacks:** export checklist, spreadsheet template, scheduled reminder, manual summary prompt, buildable reporting spec.
- **Grill:** What exact metrics, from where? What counts as worth flagging? Who reads it and what decision do they make? Which numbers need reconciliation? Can a numbers-only version send unreviewed?

## File / folder handling

- **Likely trigger:** event -- file arrives; or schedule -- cleanup/archive.
- **Sources:** SharePoint, OneDrive, Google Drive, Dropbox, email attachments, naming rules, folder conventions.
- **Candidate level:** Automate if naming/move rules are stable; Co-pilot if classification is ambiguous.
- **Access check:** file automation permissions? Power Automate/Zapier/Make? AI classification allowed? script execution? admin approval?
- **Fallbacks:** naming checklist, watched-folder convention, manual bridge, no-code flow, IT-built automation.
- **Grill:** What files are in scope? What naming pattern is correct? What makes a file ambiguous? What should never move automatically? Who owns cleanup if classification fails?

## Invoice / expense / finance operations

- **Likely trigger:** event -- invoice/receipt arrives; or schedule -- batch review.
- **Sources:** email attachments, AP system, expense tool, vendor list, purchase orders, spreadsheets.
- **Candidate level:** Co-pilot for extraction and review; Automate only for well-defined low-risk cases.
- **Access check:** finance system permissions? OCR/AI extraction approved? external AI blocked for financial data? RPA/no-code tools? audit requirements?
- **Fallbacks:** manual extraction template, approval checklist, internal OCR/RPA route, future-ready spec for IT/security.
- **Grill:** Which fields are required? What makes an invoice suspicious? What approvals are mandatory? What audit trail is required? What should happen when vendor/PO data does not match?
