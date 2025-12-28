#!/bin/bash
# Test better-auth endpoints health
# Usage: ./test-auth-health.sh [base-url]

set -e

BASE_URL="${1:-http://localhost:8787}"
AUTH_PATH="/api/auth"

echo "Testing better-auth endpoints at: $BASE_URL$AUTH_PATH"
echo ""

# Test session endpoint
echo "1. Testing GET $AUTH_PATH/session..."
SESSION_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$AUTH_PATH/session" 2>/dev/null)
SESSION_CODE=$(echo "$SESSION_RESPONSE" | tail -n1)
if [ "$SESSION_CODE" = "200" ] || [ "$SESSION_CODE" = "401" ]; then
  echo "   Status: $SESSION_CODE (expected 200 or 401)"
else
  echo "   Status: $SESSION_CODE (unexpected - check your auth routes)"
fi

# Test sign-in endpoint exists
echo ""
echo "2. Testing POST $AUTH_PATH/sign-in/email (without body)..."
SIGNIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$AUTH_PATH/sign-in/email" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
SIGNIN_CODE=$(echo "$SIGNIN_RESPONSE" | tail -n1)
if [ "$SIGNIN_CODE" = "400" ] || [ "$SIGNIN_CODE" = "422" ]; then
  echo "   Status: $SIGNIN_CODE (expected - endpoint exists and validates)"
elif [ "$SIGNIN_CODE" = "404" ]; then
  echo "   Status: $SIGNIN_CODE (endpoint not found - check emailAndPassword config)"
else
  echo "   Status: $SIGNIN_CODE"
fi

# Test sign-up endpoint exists
echo ""
echo "3. Testing POST $AUTH_PATH/sign-up/email (without body)..."
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$AUTH_PATH/sign-up/email" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
SIGNUP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
if [ "$SIGNUP_CODE" = "400" ] || [ "$SIGNUP_CODE" = "422" ]; then
  echo "   Status: $SIGNUP_CODE (expected - endpoint exists and validates)"
elif [ "$SIGNUP_CODE" = "404" ]; then
  echo "   Status: $SIGNUP_CODE (endpoint not found - check emailAndPassword config)"
else
  echo "   Status: $SIGNUP_CODE"
fi

echo ""
echo "Health check complete."
echo ""
echo "Next steps:"
echo "  - If endpoints return 404, verify your auth routes are mounted correctly"
echo "  - If using Cloudflare Workers, ensure D1 binding is configured"
echo "  - Check CORS if testing from browser"
