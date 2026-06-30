---
name: delegate-my-work:delegate
description: Interview me about my work and spec recurring loops for delegation to AI.
argument-hint: "[work area to examine, or leave empty to find loops]"
model: opus
---

Run the **delegate-my-work** skill as a stateful grilling session.

Target: $ARGUMENTS

If the target is empty, start from `NOTES.md` and the user's world, and propose loops worth delegating.

Follow the skill's discipline exactly:

- Grill relentlessly, **one question at a time**, via `AskUserQuestion` — recommended answer first.
- Classify each loop as **Automate**, **Co-pilot**, or **Assist**, and place its checkpoint.
- Write one spec per loop to `automations/<loop>.md`, and keep grilling each until it meets the skill's definition of done.

The steps, vocabulary, and spec format live in the skill and its `references/` — follow them there.
