#!/bin/bash

#
# Cloudflare Access JWT Testing Tool
#
# This script helps test and debug Access JWT tokens by:
# - Decoding the JWT payload
# - Discovering the JWKS public keys published by the Access team domain
# - Displaying token claims in readable format
# - Validating expiration and issuer
#
# IMPORTANT — what this script DOES NOT do:
#   It does NOT cryptographically verify the JWT signature. Confirming that
#   a `kid` exists in the team's JWKS only proves that the issuing team has
#   that key; it does not prove the token was signed by that key. Real
#   signature verification requires Web Crypto (`crypto.subtle.verify`),
#   which is not practical in pure shell. For production verification, use
#   the template at:
#       templates/jwt-validation-manual.ts
#   which performs the full `crypto.subtle.verify('RSASSA-PKCS1-v1_5', ...)`
#   flow on the Worker.
#
# Usage:
#   # Preferred: pass JWT via env var so it does not land in shell history.
#   CF_ACCESS_JWT="eyJhbGciOi..." ./test-access-jwt.sh [team-domain]
#
#   # Or via stdin:
#   echo "eyJhbGciOi..." | ./test-access-jwt.sh [team-domain]
#
#   # Positional argument works but is DISCOURAGED - it will be visible in
#   # your shell history and process listings.
#   ./test-access-jwt.sh "eyJhbGciOi..." [team-domain]
#
# Examples:
#   CF_ACCESS_JWT="eyJhbGciOi..." ./test-access-jwt.sh "your-team.cloudflareaccess.com"
#   ./test-access-jwt.sh "eyJhbGciOi..." "your-team.cloudflareaccess.com"
#
# Dependencies:
#   - jq (for JSON parsing)
#   - base64 (standard on most systems)
#   - curl (for fetching public keys)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check dependencies
check_dependencies() {
  if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Install with: apt install jq (Ubuntu) or brew install jq (macOS)"
    exit 1
  fi

  if ! command -v base64 &> /dev/null; then
    print_error "base64 is not installed"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    print_error "curl is not installed"
    exit 1
  fi
}

# Decode base64url (JWT uses base64url encoding, not standard base64)
base64url_decode() {
  local input="$1"
  # Add padding if needed
  local padded="$input"
  case $((${#input} % 4)) in
    2) padded="${input}==" ;;
    3) padded="${input}=" ;;
  esac
  # Replace URL-safe characters
  echo "$padded" | tr '_-' '/+' | base64 -d 2>/dev/null
}

# Extract and decode JWT header
decode_header() {
  local jwt="$1"
  local header=$(echo "$jwt" | cut -d'.' -f1)
  base64url_decode "$header"
}

# Extract and decode JWT payload
decode_payload() {
  local jwt="$1"
  local payload=$(echo "$jwt" | cut -d'.' -f2)
  base64url_decode "$payload"
}

# Extract signature
get_signature() {
  local jwt="$1"
  echo "$jwt" | cut -d'.' -f3
}

# Fetch Access public keys
fetch_public_keys() {
  local team_domain="$1"
  local certs_url="https://${team_domain}/cdn-cgi/access/certs"

  print_info "Fetching public keys from: $certs_url"

  local response=$(curl -s "$certs_url")

  if [ -z "$response" ]; then
    print_error "Failed to fetch public keys"
    return 1
  fi

  echo "$response"
}

# Validate token expiration
check_expiration() {
  local exp="$1"
  local now=$(date +%s)

  if [ "$exp" -lt "$now" ]; then
    print_error "Token is EXPIRED"
    local expired_ago=$((now - exp))
    echo "  Expired $expired_ago seconds ago"
    return 1
  else
    print_success "Token is NOT expired"
    local expires_in=$((exp - now))
    echo "  Expires in $expires_in seconds ($((expires_in / 60)) minutes)"
    return 0
  fi
}

# Format Unix timestamp to readable date
format_timestamp() {
  local timestamp="$1"
  date -d "@$timestamp" 2>/dev/null || date -r "$timestamp" 2>/dev/null || echo "Unknown"
}

# Main function
main() {
  echo "=================================="
  echo "Cloudflare Access JWT Testing Tool"
  echo "=================================="
  echo

  # Check dependencies
  check_dependencies

  # Resolve the JWT in priority order:
  #   1. $CF_ACCESS_JWT env var  (preferred - not recorded in shell history)
  #   2. stdin                   (also preferred - piped in, not in argv)
  #   3. $1 positional argument  (DISCOURAGED - visible in `ps`, shell history)
  # The optional team-domain argument is positional regardless.
  TEAM_DOMAIN=""

  if [ -n "$CF_ACCESS_JWT" ]; then
    JWT="$CF_ACCESS_JWT"
    # Team domain may still be passed as $1.
    TEAM_DOMAIN="${1:-}"
  elif [ $# -ge 1 ]; then
    # Heuristic: if $1 contains a dot and looks like a JWT (3 dot-separated
    # parts), treat it as the token. Otherwise treat it as the team domain
    # and read the token from stdin.
    if [ $# -ge 2 ] || echo "$1" | grep -q '^[A-Za-z0-9_-]\+\.[A-Za-z0-9_-]\+\.[A-Za-z0-9_-]\+$'; then
      JWT="$1"
      TEAM_DOMAIN="${2:-}"
      print_warning "JWT passed as a positional argument - it may be recorded in your shell history and process listings. Prefer CF_ACCESS_JWT env var or stdin."
    else
      TEAM_DOMAIN="$1"
      if [ -t 0 ]; then
        print_error "Missing JWT token. Pass via CF_ACCESS_JWT env var or stdin."
        echo
        echo "Usage:"
        echo "  CF_ACCESS_JWT=\"<jwt>\" $0 [team-domain]"
        echo "  echo \"<jwt>\" | $0 [team-domain]"
        echo "  $0 <jwt> [team-domain]   # discouraged"
        exit 1
      fi
      JWT=$(cat)
    fi
  else
    # No args at all: try stdin.
    if [ -t 0 ]; then
      print_error "Missing JWT token. Pass via CF_ACCESS_JWT env var, stdin, or positional arg."
      echo
      echo "Usage:"
      echo "  CF_ACCESS_JWT=\"<jwt>\" $0 [team-domain]"
      echo "  echo \"<jwt>\" | $0 [team-domain]"
      echo "  $0 <jwt> [team-domain]   # discouraged"
      exit 1
    fi
    JWT=$(cat)
  fi

  if [ -z "$JWT" ]; then
    print_error "Empty JWT token"
    exit 1
  fi

  # Validate JWT format (should have 3 parts separated by dots)
  local parts=$(echo "$JWT" | tr '.' '\n' | wc -l)
  if [ "$parts" -ne 3 ]; then
    print_error "Invalid JWT format. Expected 3 parts (header.payload.signature), got $parts"
    exit 1
  fi

  echo "=== JWT HEADER ==="
  HEADER_JSON=$(decode_header "$JWT")
  echo "$HEADER_JSON" | jq '.' 2>/dev/null || echo "$HEADER_JSON"
  echo

  echo "=== JWT PAYLOAD ==="
  PAYLOAD_JSON=$(decode_payload "$JWT")
  echo "$PAYLOAD_JSON" | jq '.' 2>/dev/null || echo "$PAYLOAD_JSON"
  echo

  # Extract key fields
  KID=$(echo "$HEADER_JSON" | jq -r '.kid' 2>/dev/null || echo "")
  ALG=$(echo "$HEADER_JSON" | jq -r '.alg' 2>/dev/null || echo "")

  EMAIL=$(echo "$PAYLOAD_JSON" | jq -r '.email // empty' 2>/dev/null || echo "")
  COMMON_NAME=$(echo "$PAYLOAD_JSON" | jq -r '.common_name // empty' 2>/dev/null || echo "")
  GROUPS=$(echo "$PAYLOAD_JSON" | jq -r '.groups // empty' 2>/dev/null || echo "")
  COUNTRY=$(echo "$PAYLOAD_JSON" | jq -r '.country // empty' 2>/dev/null || echo "")
  AUD=$(echo "$PAYLOAD_JSON" | jq -r '.aud[0] // empty' 2>/dev/null || echo "")
  ISS=$(echo "$PAYLOAD_JSON" | jq -r '.iss // empty' 2>/dev/null || echo "")
  EXP=$(echo "$PAYLOAD_JSON" | jq -r '.exp // empty' 2>/dev/null || echo "")
  IAT=$(echo "$PAYLOAD_JSON" | jq -r '.iat // empty' 2>/dev/null || echo "")

  echo "=== TOKEN INFORMATION ==="

  # Determine token type
  if [ -n "$EMAIL" ]; then
    print_info "Token Type: User Authentication"
    echo "  Email: $EMAIL"
    [ -n "$GROUPS" ] && echo "  Groups: $GROUPS"
    [ -n "$COUNTRY" ] && echo "  Country: $COUNTRY"
  elif [ -n "$COMMON_NAME" ]; then
    print_info "Token Type: Service Token"
    echo "  Service Name: $COMMON_NAME"
  else
    print_warning "Unknown token type"
  fi

  echo

  # Algorithm
  echo "Algorithm: $ALG"
  echo "Key ID (kid): $KID"
  echo

  # Issuer
  if [ -n "$ISS" ]; then
    echo "Issuer: $ISS"

    # Extract team domain from issuer if not provided
    if [ -z "$TEAM_DOMAIN" ]; then
      TEAM_DOMAIN=$(echo "$ISS" | sed 's|https://||' | sed 's|/$||')
      print_info "Extracted team domain from issuer: $TEAM_DOMAIN"
    fi
  fi
  echo

  # Audience
  if [ -n "$AUD" ]; then
    echo "Audience (AUD): $AUD"
  fi
  echo

  # Timestamps
  if [ -n "$IAT" ]; then
    echo "Issued At (iat):"
    echo "  Timestamp: $IAT"
    echo "  Date: $(format_timestamp "$IAT")"
  fi
  echo

  if [ -n "$EXP" ]; then
    echo "Expires At (exp):"
    echo "  Timestamp: $EXP"
    echo "  Date: $(format_timestamp "$EXP")"
    echo
    check_expiration "$EXP"
  fi
  echo

  # -------------------------------------------------------------------
  # JWKS key discovery (NOT signature verification)
  #
  # The check below only confirms that the Access team publishes a key
  # whose `kid` matches the token header's `kid`. It does NOT prove that
  # the token was actually signed by that key. Real verification needs
  # crypto.subtle.verify, which is implemented in the production template
  # at templates/jwt-validation-manual.ts (verifyJWTSignature).
  # -------------------------------------------------------------------
  if [ -n "$TEAM_DOMAIN" ] && [ -n "$KID" ]; then
    echo "=== JWKS KEY DISCOVERY (signature NOT verified by this script) ==="

    KEYS_JSON=$(fetch_public_keys "$TEAM_DOMAIN")

    if [ $? -eq 0 ] && [ -n "$KEYS_JSON" ]; then
      # Check if key exists
      KEY_EXISTS=$(echo "$KEYS_JSON" | jq -r ".keys[] | select(.kid == \"$KID\") | .kid" 2>/dev/null || echo "")

      if [ -n "$KEY_EXISTS" ]; then
        print_info "Public key found for kid: $KID (key discovery only)"
        echo
        echo "  Key details:"
        echo "$KEYS_JSON" | jq ".keys[] | select(.kid == \"$KID\")" 2>/dev/null || echo "  (Unable to parse key)"
      else
        print_error "Public key NOT found for kid: $KID"
        echo
        echo "Available keys:"
        echo "$KEYS_JSON" | jq -r '.keys[].kid' 2>/dev/null || echo "(Unable to parse keys)"
      fi
    else
      print_warning "Could not fetch public keys"
    fi
  else
    print_warning "Skipping JWKS key discovery (team domain or kid not available)"
  fi

  echo
  echo "=== SUMMARY ==="

  if [ -n "$EMAIL" ]; then
    echo "✓ User: $EMAIL"
  elif [ -n "$COMMON_NAME" ]; then
    echo "✓ Service: $COMMON_NAME"
  fi

  if [ -n "$EXP" ]; then
    check_expiration "$EXP" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      print_warning "Token DECODED (signature NOT verified by this script - for production verification use the template at templates/jwt-validation-manual.ts which performs crypto.subtle.verify)"
    else
      print_error "Token is expired"
    fi
  else
    print_warning "Token DECODED (signature NOT verified by this script - for production verification use the template at templates/jwt-validation-manual.ts which performs crypto.subtle.verify)"
  fi

  echo
  print_info "Done!"
}

# Run main function
main "$@"
