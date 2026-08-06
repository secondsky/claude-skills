# Mode B — Triage an existing tech-debt backlog

You're here because the user is assessing existing code, not making a change right now. Goal: systematically identify, categorize, and prioritize debt, and produce a remediation plan that can run alongside feature work.

## Categories

Classify every item into exactly one primary category (use the second-most-fitting only if it's truly mixed, and note both).

| Type | Examples | Risk if unfixed |
|------|----------|-----------------|
| **Code debt** | Duplicated logic, poor abstractions, magic numbers, dead code | Bugs, slow development |
| **Architecture debt** | Monolith that should be split, wrong data store, missing service boundary | Scaling limits, hard to change |
| **Test debt** | Low coverage, flaky tests, missing integration tests, no CI gates | Regressions ship to production |
| **Dependency debt** | Outdated libraries, unmaintained deps, pinned ancient versions | Security vulnerabilities, blocked upgrades |
| **Documentation debt** | Missing runbooks, outdated READMEs, tribal knowledge, no ADRs | Onboarding pain, single points of failure |
| **Infrastructure debt** | Manual deploys, no monitoring/alerting, no IaC, no backups | Incidents, slow recovery |

## Prioritization framework

Score each item on three axes:

- **Impact (1–5):** How much does it slow the team down *today*? Bugs it causes, hours it burns, features it blocks.
- **Risk (1–5):** What happens if we *don't* fix it? Security exposure, outage likelihood, talent lock-in.
- **Effort (1–5, inverted):** How hard is the fix? Note that **lower effort → higher priority** — a cheap high-impact win beats an expensive one.

Compute:

```
Priority = (Impact + Risk) × (6 − Effort)
```

The `(6 − Effort)` term inverts effort so a 1-day fix (Effort=1 → ×5) outranks a quarter-long one (Effort=5 → ×1). Range: 2 (low/low × hard) to 50 (high/high × easy).

Higher score = fix sooner. Use the raw number to break ties and to group into phases.

## Worked example — scoring three items

| Item | Category | Impact | Risk | Effort | Priority |
|---|---|---|---|---|---|
| Auth library 3 major versions behind, has known CVE | Dependency | 4 | 5 | 3 | (4+5)×3 = **27** |
| Duplicated checkout logic across 3 entry points | Code | 4 | 3 | 2 | (4+3)×4 = **28** |
| No runbook for the primary incident path | Documentation | 3 | 4 | 1 | (3+4)×5 = **35** |

Reading: the runbook (cheap, real risk) edges out the checkout duplication (also cheap) and the auth upgrade (high value but bigger). The numbers are a tie-breaker for judgment, not a replacement for it — a security CVE at priority 27 still goes first regardless of a doc item at 35; call that out in the plan.

## Output contract

Produce, in this order:

1. **Prioritized list** — one row per item: category, short description, Impact/Risk/Effort scores, computed Priority, and a one-line **business justification** (the cost of *not* fixing it, in team velocity, risk, or dollars — not "the code is ugly").
2. **Estimated effort per item** — in concrete units the team plans in (hours, days, sprints). Range if uncertain ("2–3 days").
3. **Phased remediation plan** — group items into phases that can run **alongside feature work**, not as a big-bang freeze:
   - **Phase 0 — quick wins:** Priority ≥ ~30 and Effort ≤ 2. Knock out in the current sprint alongside features.
   - **Phase 1 — high-leverage:** highest Priority items regardless of effort, scheduled explicitly.
   - **Phase 2 — background:** low-Effort items folded into "when you touch this area, also fix X."
   - **Phase 3 — strategic:** large Architecture/Dependency items needing dedicated planning; these become their own tickets/epics.
4. **"Do alongside" call-outs** — items small enough to attach to upcoming feature work ("when you next touch checkout, collapse the 3 duplicated paths"). This is where triage hands off to Mode A: each "do alongside" becomes a Mode A rework when that change happens.

## Scope of the audit

Match the audit's breadth to what the user asked:

- **"What should we refactor in this module?"** → triage that module only. Deep, specific.
- **"Tech-debt audit the codebase."** → survey all six categories at the breadth of the whole repo, but keep each item to one line; depth comes in Phase 1 when items are picked up.

Either way, don't boil the ocean. A prioritized list of 10 sharp items beats a 200-item dump nobody reads.

## Bottom line

Categorize → score → prioritize → plan alongside feature work. Hand each "do alongside" item to Mode A when its change comes up.
