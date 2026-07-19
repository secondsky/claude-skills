# Testing for forced browsing & auth-enforcement bypass

> OSS port of mukul975's `bypassing-authentication-with-forced-browsing`. Burp Suite was already optional in the original; this version makes OSS the primary path throughout.

## Sub-agent mission

You are dispatched to discover unprotected pages, APIs, and admin/debug interfaces on a target via directory and forced browsing, then validate whether authentication is enforced across them. You drive ffuf / Gobuster / Feroxbuster / SecLists / curl. Report findings with severity, evidence, and the matching defensive plugin for remediation.

## Inputs

- **task:** the user's verbatim request (e.g. "find hidden admin endpoints on `stage.example.com`").
- **target / scope:** the base URL and any in-scope paths. Confirmed by the orchestrator's gate.
- **ack_state:** `confirmed` (live-target) or `n/a` (static review of a route map).
- **context (optional):** known route list, framework, deployed file tree.

## Tools

```bash
# Install (documentation — do not install at authoring time)
brew install ffuf gobuster feroxbuster            # or: go install github.com/ffuf/ffuf/v2@latest
# SecLists wordlists
git clone --depth 1 https://github.com/danielmiessler/SecLists.git ~/SecLists
```

Paid tools (Burp Suite) are optional and never required. For the swap table, `SEE: references/oss-tool-map.md`.

## Methodology

### Step 1 — Enumerate hidden directories and files

Use SecLists wordlists with ffuf (or Gobuster / Feroxbuster). Filter for non-404 responses.

```bash
# Directory enumeration
# `-t 5 -p 0.1` (or `-rate 20`) is the default for shared/owned dev targets; higher
# thread counts risk DoS and are refused by the red-flags list unless the user
# explicitly owns the target and confirms capacity. See `-t 50` note below.
ffuf -u https://TARGET/FUZZ \
     -w ~/SecLists/Discovery/Web-Content/raft-medium-directories.txt \
     -mc 200,204,301,302,307,401,403 \
     -t 5 -p 0.1 -rate 20 \
     -o findings-dirs.json -of json

# File enumeration (common extensions)
ffuf -u https://TARGET/FUZZ \
     -w ~/SecLists/Discovery/Web-Content/raft-medium-files.txt \
     -e .php,.asp,.aspx,.jsp,.html,.js,.json,.env,.yaml,.yml,.xml,.bak,.old,.sql,.log,.git \
     -mc 200,204,301,302,307,401,403 \
     -t 5 -p 0.1 -rate 20 \
     -o findings-files.json -of json
```

Rate-limit politely — `-p 0.1` (100ms delay) and/or `-rate 20` are the defaults shown above for shared/owned dev infra. For owned, high-capacity dev targets only (you have explicitly confirmed the target is yours and can absorb the load), `-t 50` without rate-limiting is acceptable; the red-flags list otherwise refuses DoS-volume fuzzing regardless of ownership claims.

### Step 2 — Discover admin / debug interfaces

Targeted wordlists for admin panels, debug routes, dev tooling:

```bash
ffuf -u https://TARGET/FUZZ \
     -w ~/SecLists/Discovery/Web-Content/raft-large-directories.txt \
     -mc 200,204,301,302,307,401,403
ffuf -u https://TARGET/admin/FUZZ \
     -w ~/SecLists/Discovery/Web-Content/cmd-admin-panel.txt \
     -mc 200,204,301,302,401,403
```

Also check common admin paths directly:

```bash
for path in admin administrator wp-admin cpanel dashboard debug actuator health env metrics console phpinfo; do
  echo "==> /$path"
  curl -sk -o /dev/null -w "%{http_code} %{url_effective}\n" "https://TARGET/$path"
done
```

### Step 3 — Test auth enforcement (the core of forced-browsing)

This step is the heart of the skill: confirm whether **authenticated** and **unauthenticated** requests return different responses for protected resources. Drop the original skill's "Use Burp Intruder" instruction; the ffuf `-mc 200` pattern is the drop-in replacement.

```bash
# Send the list of discovered URLs WITHOUT cookies/session; flag any 200s
ffuf -u https://TARGET/FUZZ \
     -w discovered-urls.txt \
     -mc 200 \
     -t 20 \
     -o unauth-200s.json -of json

# Compare against the same list WITH a valid session
ffuf -u https://TARGET/FUZZ \
     -w discovered-urls.txt \
     -H "Cookie: session=<valid-session-cookie>" \
     -mc 200 \
     -t 20 \
     -o auth-200s.json -of json
```

Any URL that returns **200 without the cookie** but requires authentication is a forced-browsing finding.

### Step 4 — Test HTTP-method-based auth bypass

Some frameworks enforce auth on GET but not on PUT/PATCH/DELETE/HEAD/OPTIONS:

```bash
URL="https://TARGET/admin/users"
for method in GET POST PUT PATCH DELETE HEAD OPTIONS TRACE; do
  echo "==> $method $URL"
  curl -sk -X "$method" -o /dev/null -w "%{http_code}\n" "$URL"
done
```

A `200` on a non-GET method for a protected resource is a finding.

### Step 5 — Test path traversal + URL-normalization bypass

Try path traversal and encoding tricks that bypass poorly-implemented auth filters:

```bash
# Normalization bypass patterns
for path in "admin" "admin/" "admin/." "admin%2f" "admin%2F" "//admin" "/./admin" "/admin;/" "/admin%20/" "/admin..;/"; do
  echo "==> /$path"
  curl -sk -o /dev/null -w "%{http_code}\n" "https://TARGET/$path"
done
```

### Step 6 — Discover backup / config files

Use SecLists' sensitive-file wordlists:

```bash
ffuf -u https://TARGET/FUZZ \
     -w ~/SecLists/Discovery/Web-Content/sensitive-files.txt \
     -mc 200 \
     -t 20
```

**Sensitive-file checklist** (check directly even without wordlist hits):

- `.env`, `.env.local`, `.env.production`
- `.git/config`, `.git/HEAD`, `.git/index`
- `.htaccess`, `.htpasswd`
- `backup.sql`, `dump.sql`, `db.bak`
- `web.config`, `config.php`, `wp-config.php`
- `package.json`, `composer.json` (informational but useful)
- `swagger.json`, `openapi.yaml` (API surface disclosure)
- `Dockerfile`, `docker-compose.yml`
- `id_rsa`, `id_ed25519` (SSH key leakage — rare but critical)

```bash
for f in .env .env.local .env.production .git/config .git/HEAD .htaccess .htpasswd \
         backup.sql dump.sql web.config config.php wp-config.php package.json \
         swagger.json openapi.yaml Dockerfile docker-compose.yml id_rsa; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" "https://TARGET/$f")
  [ "$code" = "200" ] && echo "EXPOSED: /$f ($code)"
done
```

## Common mistakes

- **Forgetting the `-mc` filter.** Without it, ffuf returns every URL including 404s. Always filter on meaningful status codes.
- **Hammering production rate.** Use `-p` or `-rate` to throttle; the gate's red-flags list refuses DoS-volume requests.
- **Reporting 200s without checking auth.** A 200 on `/login` is expected, not a finding. The finding is a 200 on a protected resource **without** credentials.
- **Skipping the methods test.** GET may be enforced while PUT is not. Always test the method matrix.
- **Not re-trying path normalization.** Different frameworks normalize differently — try multiple encodings.

## Quick reference — status-code meaning (for triage)

| Code | Meaning in forced browsing |
|---|---|
| 200 (unauth) | **Potential finding** — protected resource reachable without auth. |
| 200 (auth only) | Expected — resource is enforced. |
| 401 / 403 | Auth enforced — not a finding, but confirms the route exists. |
| 301 / 302 | Redirect — follow to see where it lands; may reveal auth flow. |
| 404 | Not found — route doesn't exist (or is hidden behind a generic 404). |
| 500 | Error — may indicate the route exists but the request is malformed; investigate. |

## OWASP / MITRE references

- **OWASP A01:2021** — Broken Access Control.
- **OWASP A04:2021** — Insecure Design.
- **MITRE ATT&CK** — T1190 (Exploit Public-Facing Application), T1083 (File and Directory Discovery), T1087 (Account Discovery).

## Remediation

For the matching defensive pattern in this repo, `SEE: references/defensive-cross-refs.md`. Typical matches:

- Forced browsing / broken access control → `defense-in-depth-validation` (multi-layer validation) + framework-native auth middleware.
- Exposed secrets / config files → `vulnerability-scanning` (pre-deploy secret scanning) + `security-headers-configuration` (for deny rules).

## Sub-agent return contract

```json
{
  "findings": [
    {
      "vuln": "Forced browsing: /admin/users reachable without auth",
      "severity": "high | medium | low | info",
      "evidence": "curl -s https://TARGET/admin/users -> 200 (no Cookie); with Cookie -> 200 with admin data",
      "owasp": "A01:2021",
      "mitre": ["T1190"],
      "remediation": "Enforce authentication + authorization on /admin/* in the routing layer.",
      "defensive_plugin": "defense-in-depth-validation"
    }
  ],
  "routes_enumerated": 1234,
  "summary": "Discovered 1 forced-browsing finding and 2 exposed config files."
}
```
