# Example: Coding — Add an Auth Provider

## User request

```text
Add a new enterprise SSO provider to our app. I don't know this auth module.
```

## Skill activation

Mode: `blindspot-pass`, followed by `tweakable-plan`, then `implementation-notes`.

## Unknowns matrix snapshot

| Bucket | Example |
|---|---|
| Known knowns | Need a new provider; must integrate with existing auth module |
| Known unknowns | Provider protocol, callback URL rules, identity-linking behavior |
| Unknown knowns | Team conventions for provider templates and middleware mounting |
| Unknown unknowns | Reverted prior attempts, hidden session rules, logout events, auth edge cases |

## First artifact prompt

```text
I'm adding a new enterprise SSO provider, but I don't know the auth module.
Do a blindspot pass over services/auth and related tests before implementation.
Find unknown unknowns, prior failed attempts, hidden middleware/session/identity-linking constraints, and tell me how to prompt you better.
Do not modify code yet.
```

## Follow-up plan prompt

```text
Now write a tweakable implementation plan. Lead with callback URL strategy, identity-linking behavior, session write path, middleware mount point, provider config shape, and rollout flag. Put mechanical tests/refactors below.
```

## During implementation instruction

```text
Keep implementation-notes.md. If code contradicts the plan, choose the conservative option if safe, log it under Deviations, and continue. Pause for auth bypass, data loss, migration, public API, billing, or compliance uncertainty.
```
