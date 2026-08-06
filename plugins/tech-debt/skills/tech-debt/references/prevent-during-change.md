# Mode A — Prevent tech debt during a change

You're here because the user is actively making a change (implementing/finishing/reviewing a feature, fix, or refactor) and wants it clean. This is the `zero-tech-debt` stance: rework the change as if the intended UX and architecture had existed from day one.

## Core principle

**Optimize for the code that should exist — don't minimize the diff from the old code.**

The temptation while editing is to keep the change small by preserving the old shape and bolting the new behavior on (a mode flag, a wrapper, a fallback branch). That preservation is how debt is born. Instead, reshape toward the end state and let the diff be what it has to be.

## Steps

1. **State the intended end state in one or two sentences.** Product intent, not implementation history. If you can't state it, stop and ask — you can't rework toward an undefined target. This single sentence is the ruler every later decision is measured against.

2. **Search for actual callers before keeping anything for compatibility.** Before you preserve a mode, prop, wrapper, route alias, or fallback, grep the codebase (and any known consumers) for callers. **If it has no current caller, delete it.** "Might be used later" is not a caller. Unreferenced compat is dead weight you'll maintain forever.

3. **Reshape to the final product surface.** Prefer one clear component or flow over a mode flag that switches between two shapes. Splitting is warranted only when it creates an obvious boundary — state, layout, controls, or domain commands — not as a way to avoid touching the old code.

4. **Consolidate shared rules into a single location.** Feature flags, permissions, route gating, URL state, and command naming should each live in one place. Duplicating a rule across the new and old paths guarantees they drift.

5. **Verify the intended flow.** Run the happy path and anything you deleted assumptions from — navigation, permissions, state transitions. Deleted compat can break a caller you missed in step 2; a test or manual check catches it now.

## Rules

- **Optimize for the code that should exist**, not for the smallest diff from the old code.
- **Delete dead compatibility paths** instead of making them better. A better bandaid is still a bandaid.
- **Do not invent a generic framework for one feature.** Speculate-generalize nothing. Generalize after the second concrete need, not before.
- **Keep the refactor scoped** to the change at hand so the final shape stays coherent. Don't opportunistically rewrite adjacent code; do delete the cruft your change makes unreachable.
- **Prefer names that describe product intent** (`PasswordResetEmail`) over implementation history (`LegacyV2Notifier`). The name is the first thing future readers see.

## Before / after — collapsing a mode flag

The flagship rule is "prefer one clear component over mode flags." A `mode` prop that branches a single component into two unrelated shapes is the most common debt introduced during edits.

Before — one component, two shapes welded together by a flag:

```tsx
// ❌ One component, two unrelated shapes fused by a mode flag.
// Each new requirement touches both branches; they drift over time.
function Notification({ mode, user, systemAlert }: NotificationProps) {
  if (mode === "user") {
    return (
      <Card>
        <Avatar src={user.avatar} />
        <Text>{user.name} sent you a message.</Text>
      </Card>
    );
  }
  return (
    <Banner tone={systemAlert.severity}>
      <Text>{systemAlert.message}</Text>
    </Banner>
  );
}
```

After — two clear components, each with one shape:

```tsx
// ✅ Two components with an obvious boundary (different data, different surface).
// Each can evolve independently; no shared branch to drift.
function UserMessage({ user }: { user: User }) {
  return (
    <Card>
      <Avatar src={user.avatar} />
      <Text>{user.name} sent you a message.</Text>
    </Card>
  );
}

function SystemBanner({ alert }: { alert: SystemAlert }) {
  return (
    <Banner tone={alert.severity}>
      <Text>{alert.message}</Text>
    </Banner>
  );
}
```

Call sites that used to pass `mode="user"` / `mode="system"` now render the right component directly. If a call site genuinely needs to switch between them, that switch is routing logic — put it at the call site, not welded into the component.

This is one example, not a recipe. The rule generalizes: when an edit would add a branch that exists only to preserve the old shape, split instead.

## Red flags — when NOT to apply Mode A

- **Greenfield where the end state is genuinely unknown.** You can't rework toward a target you haven't defined. Build the first cut, apply Mode A once the shape proves out.
- **Intentionally temporary change** — a feature-flagged rollout, an A/B variant, an incident hotfix you'll revert. The flag *is* the end state for now. Re-evaluate when the flag is supposed to come down.
- **Frozen/legacy surface with an explicit "do not touch" boundary.** Deleting the compat there can break out-of-tree consumers you can't see. Triage it (Mode B) and surface the risk instead of deleting silently.
- **The "end state" you'd build requires a much larger refactor than the change at hand.** Note it for triage; don't expand the scope of this change beyond what stays coherent.

When in doubt, state the end state (step 1) and let that sentence decide. If it says the compat survives, it survives for a reason you can name.
