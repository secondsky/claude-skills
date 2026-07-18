# Delegate My Work

Interview employees about their recurring work, confirm which tools they can actually access, and turn each loop into a practical AI delegation plan.

## What it does

`delegate-my-work` runs a relentless, one-question-at-a-time interview (the **grilling** discipline) about how someone actually works. It finds recurring **loops** -- daily triage, weekly reports, spreadsheet cleanup, deck updates, CRM chores, meeting follow-ups -- and specs each one for **delegation** to AI at one of three levels:

- **Automate** -- AI or automation runs it end-to-end, no human checkpoint.
- **Co-pilot** -- AI does the work, the employee approves a decision-ready brief.
- **Assist** -- the employee runs it, AI helps at specific points.

The skill does not assume a tool exists or is approved. It first builds a **tool access map** in `NOTES.md`, covering tools such as ChatGPT/OpenAI, Claude, Microsoft Copilot, Excel and PowerPoint add-ins, Google Workspace AI, no-code/RPA tools, coding agents, internal APIs, and IT-approved automation platforms.

Each loop becomes a spec in `automations/<loop>.md` with:

- preferred tool route
- access status
- fallback route
- approval or install needs
- data sensitivity
- manual version
- buildable automation version

## Access statuses

Every recommended tool route is marked with one of these statuses:

- **Available**
- **Available with admin approval**
- **Unavailable**
- **Blocked by policy**
- **Unknown - verify**

If the preferred route is unavailable or uncertain, the spec includes an alternative path. For example, if an Excel or PowerPoint extension is unavailable, the fallback might be manual upload/export, Office Scripts, VBA, Power Query, Microsoft Copilot, no-code/RPA, or a future-ready automation spec.

## Usage

Auto-discovered -- just describe the situation:

> "Help me figure out what AI could take off my plate."
>
> "I keep manually copying these reports every Monday, but I don't know which tools I'm allowed to use."
>
> "Can you find workflows my team could automate without assuming we have every AI tool?"

Or run the command with a work area to focus on:

```text
/delegate-my-work:delegate email triage
```

Leave the argument empty to have it propose loops from `NOTES.md`:

```text
/delegate-my-work:delegate
```

The interview uses the host question tool when available -- one question at a time, each with a recommended answer -- so the employee can steer by picking an option or typing their own.

## Output

```text
NOTES.md                      # role, tools, channels, terminology, access map
automations/
  email-triage.md             # preferred route + fallback + buildable spec
  weekly-report.md
```

## Keywords

automate my work, delegate to AI, what can AI do for me, employee productivity, tool access, AI access, fallback path, half-automate, AI co-pilot, AI assist, workflow automation, recurring work, repetitive tasks, Excel automation, PowerPoint automation, Microsoft Copilot, ChatGPT, Claude, no-code automation, human-in-the-loop, checkpoint

## Based on

Combines and retargets three skills by Matt Pocock -- **grilling** (the interview discipline) and **loop-me** (the loop lens and spec workspace) -- built per **writing-great-skills** (leading words, progressive disclosure, sharp completion criteria).
