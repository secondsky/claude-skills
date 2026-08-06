# Example: Product/Design — Review Queue Dashboard

## User request

```text
I need a better review queue dashboard, but I have no visual taste and don't know what's possible.
```

## Skill activation

Mode: `brainstorm-prototype`, optionally followed by `one-question-interview`.

## Unknowns matrix snapshot

| Bucket | Example |
|---|---|
| Known knowns | Need a dashboard for review queue items |
| Known unknowns | Target user, data density, primary action, device context |
| Unknown knowns | User taste: dense ops console vs calm editorial vs workflow board |
| Unknown unknowns | Existing queue status semantics, stale item handling, reviewer mental model |

## First artifact prompt

```text
Create one standalone HTML prototype with 4 wildly different dashboard directions using the same fake review queue data. Make each design philosophy obvious. Under each direction, include steal/skip notes and open questions. End with a reaction template I can paste back.
```

## Follow-up interview prompt

```text
Interview me one question at a time about the remaining dashboard ambiguity. Prioritize questions where my answer changes information architecture or data model.
```
