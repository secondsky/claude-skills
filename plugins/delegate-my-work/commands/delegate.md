---
name: delegate-my-work:delegate
description: Interview me about my work, map accessible tools, and spec recurring loops for delegation to AI.
argument-hint: "[work area to examine, or leave empty to find loops]"
---

Run the **delegate-my-work** skill as a stateful grilling session.

Target: $ARGUMENTS

If the target is empty, start from `NOTES.md`, the user's world, and the user's tool access map, then propose loops worth delegating.

Follow the skill's discipline exactly:

- Grill relentlessly, **one question at a time**, via the host question tool -- recommended answer first.
- Map tool access before recommending a route. Use the exact statuses: **Available**, **Available with admin approval**, **Unavailable**, **Blocked by policy**, **Unknown - verify**.
- Classify each loop as **Automate**, **Co-pilot**, or **Assist**, and place its checkpoint.
- Write one spec per loop to `automations/<loop>.md`, including preferred route, access status, fallback route, approval/install needs, and data sensitivity.
- Keep grilling each loop until it meets the skill's definition of done.

The steps, vocabulary, and spec format live in the skill and its `references/` -- follow them there.
