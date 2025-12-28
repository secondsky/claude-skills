#!/bin/bash

# Security Audit Script for Cloudflare Workers
#
# Features:
# - Security headers check
# - CORS configuration test
# - Rate limiting verification
# - SSL/TLS validation
# - Content Security Policy analysis
# - HSTS verification
#
# Usage:
#   ./security-audit.sh <url>
#
# Examples:
#   ./security-audit.sh https://api.example.com
#   ./security-audit.sh https://api.example.com --verbose

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
URL=""
VERBOSE=false
OUTPUT_FILE=""

# Counters
PASS=0
FAIL=0
WARN=0

# Logging
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARN++)); }
debug() { [ "$VERBOSE" = true ] && echo -e "${BLUE}[DEBUG]${NC} $1"; }

# Usage
usage() {
    cat << EOF
Security Audit Script for Cloudflare Workers

Usage: $0 <url> [options]

Options:
  -v, --verbose     Verbose output
  -o, --output FILE Save results to file
  -h, --help        Show this help

Examples:
  $0 https://api.example.com
  $0 https://api.example.com --verbose
  $0 https://api.example.com -o audit-results.txt

EOF
    exit 0
}

# Parse arguments
parse_args() {
    if [ $# -eq 0 ]; then
        usage
    fi

    URL="$1"
    shift

    while [ $# -gt 0 ]; do
        case "$1" in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Validate URL
    if ! [[ "$URL" =~ ^https?:// ]]; then
        echo "Error: Invalid URL. Must start with http:// or https://"
        exit 1
    fi
}

# Check dependencies
check_deps() {
    for cmd in curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            echo "Error: $cmd is required"
            exit 1
        fi
    done
}

# Fetch headers
fetch_headers() {
    local url="$1"
    curl -sI -X GET --max-time 30 "$url" 2>/dev/null
}

# Get specific header
get_header() {
    local headers="$1"
    local name="$2"
    echo "$headers" | grep -i "^$name:" | sed "s/^$name: *//i" | tr -d '\r'
}

# ============================================
# SECURITY CHECKS
# ============================================

check_https() {
    echo ""
    echo "=== HTTPS Check ==="

    if [[ "$URL" =~ ^https:// ]]; then
        pass "URL uses HTTPS"
    else
        fail "URL does not use HTTPS"
    fi
}

check_security_headers() {
    local headers="$1"

    echo ""
    echo "=== Security Headers ==="

    # X-Content-Type-Options
    local xcto=$(get_header "$headers" "X-Content-Type-Options")
    if [ "$xcto" = "nosniff" ]; then
        pass "X-Content-Type-Options: nosniff"
    elif [ -n "$xcto" ]; then
        warn "X-Content-Type-Options: $xcto (expected: nosniff)"
    else
        fail "X-Content-Type-Options header missing"
    fi

    # X-Frame-Options
    local xfo=$(get_header "$headers" "X-Frame-Options")
    if [ "$xfo" = "DENY" ] || [ "$xfo" = "SAMEORIGIN" ]; then
        pass "X-Frame-Options: $xfo"
    elif [ -n "$xfo" ]; then
        warn "X-Frame-Options: $xfo (expected: DENY or SAMEORIGIN)"
    else
        fail "X-Frame-Options header missing"
    fi

    # X-XSS-Protection
    local xxss=$(get_header "$headers" "X-XSS-Protection")
    if [[ "$xxss" == *"1"* ]] && [[ "$xxss" == *"mode=block"* ]]; then
        pass "X-XSS-Protection: $xxss"
    elif [ -n "$xxss" ]; then
        warn "X-XSS-Protection: $xxss (expected: 1; mode=block)"
    else
        warn "X-XSS-Protection header missing (deprecated but still recommended)"
    fi

    # Referrer-Policy
    local rp=$(get_header "$headers" "Referrer-Policy")
    if [ -n "$rp" ]; then
        if [[ "$rp" == *"strict-origin"* ]] || [[ "$rp" == *"no-referrer"* ]]; then
            pass "Referrer-Policy: $rp"
        else
            warn "Referrer-Policy: $rp (consider strict-origin-when-cross-origin)"
        fi
    else
        fail "Referrer-Policy header missing"
    fi
}

check_hsts() {
    local headers="$1"

    echo ""
    echo "=== HSTS Check ==="

    local hsts=$(get_header "$headers" "Strict-Transport-Security")
    if [ -n "$hsts" ]; then
        # Check max-age
        if [[ "$hsts" =~ max-age=([0-9]+) ]]; then
            local max_age="${BASH_REMATCH[1]}"
            if [ "$max_age" -ge 31536000 ]; then
                pass "HSTS max-age: $max_age (>= 1 year)"
            elif [ "$max_age" -ge 2592000 ]; then
                warn "HSTS max-age: $max_age (consider >= 1 year)"
            else
                fail "HSTS max-age: $max_age (too short, minimum 30 days recommended)"
            fi
        fi

        # Check includeSubDomains
        if [[ "$hsts" == *"includeSubDomains"* ]]; then
            pass "HSTS includeSubDomains present"
        else
            warn "HSTS missing includeSubDomains"
        fi

        # Check preload
        if [[ "$hsts" == *"preload"* ]]; then
            pass "HSTS preload present"
        else
            info "HSTS preload not present (optional)"
        fi
    else
        fail "Strict-Transport-Security header missing"
    fi
}

check_csp() {
    local headers="$1"

    echo ""
    echo "=== Content Security Policy ==="

    local csp=$(get_header "$headers" "Content-Security-Policy")
    if [ -n "$csp" ]; then
        pass "Content-Security-Policy present"

        debug "CSP: $csp"

        # Check for unsafe directives
        if [[ "$csp" == *"'unsafe-inline'"* ]]; then
            warn "CSP contains 'unsafe-inline' (security risk)"
        fi

        if [[ "$csp" == *"'unsafe-eval'"* ]]; then
            warn "CSP contains 'unsafe-eval' (security risk)"
        fi

        # Check for default-src
        if [[ "$csp" == *"default-src"* ]]; then
            pass "CSP has default-src directive"
        else
            warn "CSP missing default-src directive"
        fi

        # Check for frame-ancestors
        if [[ "$csp" == *"frame-ancestors"* ]]; then
            pass "CSP has frame-ancestors directive"
        else
            warn "CSP missing frame-ancestors directive"
        fi
    else
        # Check for CSP Report-Only
        local csp_ro=$(get_header "$headers" "Content-Security-Policy-Report-Only")
        if [ -n "$csp_ro" ]; then
            warn "Only Content-Security-Policy-Report-Only present (not enforced)"
        else
            fail "Content-Security-Policy header missing"
        fi
    fi
}

check_permissions_policy() {
    local headers="$1"

    echo ""
    echo "=== Permissions Policy ==="

    local pp=$(get_header "$headers" "Permissions-Policy")
    if [ -n "$pp" ]; then
        pass "Permissions-Policy present"
        debug "Permissions-Policy: $pp"

        # Check for sensitive features
        if [[ "$pp" == *"camera=()"* ]]; then
            pass "Camera disabled"
        fi

        if [[ "$pp" == *"microphone=()"* ]]; then
            pass "Microphone disabled"
        fi

        if [[ "$pp" == *"geolocation=()"* ]]; then
            pass "Geolocation disabled"
        fi
    else
        warn "Permissions-Policy header missing"
    fi
}

check_cors() {
    local headers="$1"

    echo ""
    echo "=== CORS Check ==="

    # Make request with Origin header
    local cors_headers=$(curl -sI -X OPTIONS \
        -H "Origin: https://evil.com" \
        -H "Access-Control-Request-Method: POST" \
        --max-time 30 "$URL" 2>/dev/null)

    local acao=$(get_header "$cors_headers" "Access-Control-Allow-Origin")
    if [ "$acao" = "*" ]; then
        warn "CORS allows all origins (*) - may be insecure"
    elif [ "$acao" = "https://evil.com" ]; then
        fail "CORS reflects arbitrary origin - VULNERABLE"
    elif [ -n "$acao" ]; then
        pass "CORS origin restricted: $acao"
    else
        pass "CORS not enabled for unauthorized origins"
    fi

    local acac=$(get_header "$cors_headers" "Access-Control-Allow-Credentials")
    if [ "$acac" = "true" ] && [ "$acao" = "*" ]; then
        fail "CORS allows credentials with wildcard origin - VULNERABLE"
    fi
}

check_server_info() {
    local headers="$1"

    echo ""
    echo "=== Server Information Disclosure ==="

    local server=$(get_header "$headers" "Server")
    if [ -n "$server" ]; then
        warn "Server header present: $server (information disclosure)"
    else
        pass "Server header not present"
    fi

    local powered_by=$(get_header "$headers" "X-Powered-By")
    if [ -n "$powered_by" ]; then
        warn "X-Powered-By header present: $powered_by (information disclosure)"
    else
        pass "X-Powered-By header not present"
    fi
}

check_rate_limiting() {
    echo ""
    echo "=== Rate Limiting Check ==="

    # Check for rate limit headers
    local headers=$(fetch_headers "$URL")

    local rl_limit=$(get_header "$headers" "X-RateLimit-Limit")
    local rl_remaining=$(get_header "$headers" "X-RateLimit-Remaining")
    local retry_after=$(get_header "$headers" "Retry-After")

    if [ -n "$rl_limit" ] || [ -n "$rl_remaining" ]; then
        pass "Rate limiting headers present"
        debug "X-RateLimit-Limit: $rl_limit"
        debug "X-RateLimit-Remaining: $rl_remaining"
    else
        warn "No rate limiting headers detected"
    fi
}

check_cookies() {
    local headers="$1"

    echo ""
    echo "=== Cookie Security ==="

    local cookies=$(echo "$headers" | grep -i "^Set-Cookie:" || true)
    if [ -n "$cookies" ]; then
        while IFS= read -r cookie; do
            local name=$(echo "$cookie" | sed 's/Set-Cookie: \([^=]*\)=.*/\1/i')

            if [[ "$cookie" == *"Secure"* ]]; then
                pass "Cookie '$name' has Secure flag"
            else
                fail "Cookie '$name' missing Secure flag"
            fi

            if [[ "$cookie" == *"HttpOnly"* ]]; then
                pass "Cookie '$name' has HttpOnly flag"
            else
                warn "Cookie '$name' missing HttpOnly flag"
            fi

            if [[ "$cookie" == *"SameSite"* ]]; then
                if [[ "$cookie" == *"SameSite=Strict"* ]]; then
                    pass "Cookie '$name' has SameSite=Strict"
                elif [[ "$cookie" == *"SameSite=Lax"* ]]; then
                    pass "Cookie '$name' has SameSite=Lax"
                else
                    warn "Cookie '$name' has SameSite=None (requires Secure)"
                fi
            else
                warn "Cookie '$name' missing SameSite attribute"
            fi
        done <<< "$cookies"
    else
        info "No cookies set"
    fi
}

# ============================================
# MAIN
# ============================================

print_summary() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    AUDIT SUMMARY                             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "  ${GREEN}PASS:${NC} $PASS"
    echo -e "  ${YELLOW}WARN:${NC} $WARN"
    echo -e "  ${RED}FAIL:${NC} $FAIL"
    echo ""

    if [ $FAIL -gt 0 ]; then
        echo -e "${RED}Security issues detected. Please review and fix.${NC}"
        exit 1
    elif [ $WARN -gt 0 ]; then
        echo -e "${YELLOW}Some warnings found. Consider addressing them.${NC}"
        exit 0
    else
        echo -e "${GREEN}All checks passed!${NC}"
        exit 0
    fi
}

main() {
    parse_args "$@"
    check_deps

    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              CLOUDFLARE WORKERS SECURITY AUDIT               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Target: $URL"
    echo "Date:   $(date)"

    # Fetch headers once
    info "Fetching headers..."
    HEADERS=$(fetch_headers "$URL")

    if [ -z "$HEADERS" ]; then
        fail "Could not fetch headers from $URL"
        print_summary
        exit 1
    fi

    debug "Headers:"
    debug "$HEADERS"

    # Run checks
    check_https
    check_security_headers "$HEADERS"
    check_hsts "$HEADERS"
    check_csp "$HEADERS"
    check_permissions_policy "$HEADERS"
    check_cors "$HEADERS"
    check_server_info "$HEADERS"
    check_rate_limiting
    check_cookies "$HEADERS"

    # Print summary
    print_summary
}

# Capture output if output file specified
if [ -n "$OUTPUT_FILE" ]; then
    main "$@" 2>&1 | tee "$OUTPUT_FILE"
else
    main "$@"
fi
