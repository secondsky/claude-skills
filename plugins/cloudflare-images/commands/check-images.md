---
name: cloudflare-images:check
description: Run comprehensive health check and configuration validation for Cloudflare Images. Tests API connectivity, verifies authentication, checks transformations enabled, lists variants, and shows quota usage.
---

# Check Cloudflare Images Configuration

Run a complete health check of your Cloudflare Images setup including API connectivity, authentication, transformations, variants, and quota.

## What This Command Does

When you run `/check-images`, Claude will:
1. Verify environment variables are set correctly
2. Test API connectivity
3. Validate authentication (account ID + API token)
4. Check if transformations are enabled for zone
5. List all configured variants
6. Show storage quota and usage
7. Display recent images
8. Verify CDN caching status

## Usage

```
/check-images
```

No arguments required - the command will automatically discover configuration from environment variables.

## Implementation

Run the following checks in sequence:

### 1. Verify Environment Variables

```bash
echo "📋 Checking environment variables..."

if [ -z "$CF_ACCOUNT_ID" ]; then
  echo "❌ CF_ACCOUNT_ID not set"
  echo "   Set in .env: CF_ACCOUNT_ID=your_account_id"
  exit 1
else
  echo "✅ CF_ACCOUNT_ID: ${CF_ACCOUNT_ID:0:8}..."
fi

if [ -z "$CF_API_TOKEN" ]; then
  echo "❌ CF_API_TOKEN not set"
  echo "   Set in .env: CF_API_TOKEN=your_api_token"
  exit 1
else
  echo "✅ CF_API_TOKEN: ${CF_API_TOKEN:0:10}..."
fi

if [ -z "$CF_ACCOUNT_HASH" ]; then
  echo "⚠️  CF_ACCOUNT_HASH not set (optional for delivery URLs)"
else
  echo "✅ CF_ACCOUNT_HASH: ${CF_ACCOUNT_HASH}"
fi

echo ""
```

### 2. Test API Connectivity

```bash
echo "🔌 Testing API connectivity..."

API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

if [ "$API_RESPONSE" = "200" ]; then
  echo "✅ API connectivity: OK"
else
  echo "❌ API connectivity failed (HTTP $API_RESPONSE)"
  echo "   Verify CF_ACCOUNT_ID and CF_API_TOKEN are correct"
  exit 1
fi

echo ""
```

### 3. Validate Authentication

```bash
echo "🔑 Validating authentication..."

AUTH_RESULT=$(curl -s \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

AUTH_SUCCESS=$(echo "$AUTH_RESULT" | jq -r '.success')

if [ "$AUTH_SUCCESS" = "true" ]; then
  echo "✅ Authentication: Valid"

  # Check permissions
  IMAGES_COUNT=$(echo "$AUTH_RESULT" | jq -r '.result.images | length')
  echo "   Images accessible: $IMAGES_COUNT"
else
  echo "❌ Authentication failed"
  ERRORS=$(echo "$AUTH_RESULT" | jq -r '.errors[].message')
  echo "   Error: $ERRORS"
  exit 1
fi

echo ""
```

### 4. Check Transformations Status

```bash
echo "🎨 Checking transformations..."

# Note: Transformations are always enabled for Cloudflare Images
# This checks if zone-based transformations are available

if [ ! -z "$CF_ZONE_ID" ]; then
  POLISH_STATUS=$(curl -s \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/settings/polish" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    | jq -r '.result.value')

  echo "✅ Zone Polish: $POLISH_STATUS"
else
  echo "ℹ️  Zone transformations: Not configured (CF_ZONE_ID not set)"
  echo "   Cloudflare Images transformations are always available"
fi

echo ""
```

### 5. List Variants

```bash
echo "📐 Listing configured variants..."

VARIANTS=$(curl -s \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

VARIANTS_SUCCESS=$(echo "$VARIANTS" | jq -r '.success')

if [ "$VARIANTS_SUCCESS" = "true" ]; then
  VARIANT_COUNT=$(echo "$VARIANTS" | jq -r '.result.variants | length')
  echo "✅ Variants configured: $VARIANT_COUNT/100"

  if [ "$VARIANT_COUNT" -gt 0 ]; then
    echo ""
    echo "   Configured variants:"
    echo "$VARIANTS" | jq -r '.result.variants[] | "   • \(.id): \(.options.width // "auto")x\(.options.height // "auto") (\(.options.fit // "scale-down"))"'
  else
    echo "   No custom variants configured (using flexible transformations)"
  fi
else
  echo "⚠️  Could not list variants"
fi

echo ""
```

### 6. Show Storage Quota and Usage

```bash
echo "💾 Checking storage quota..."

STATS=$(curl -s \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/stats" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

STATS_SUCCESS=$(echo "$STATS" | jq -r '.success')

if [ "$STATS_SUCCESS" = "true" ]; then
  IMAGES_COUNT=$(echo "$STATS" | jq -r '.result.count.current')
  IMAGES_ALLOWED=$(echo "$STATS" | jq -r '.result.count.allowed')

  echo "✅ Storage usage:"
  echo "   Images stored: $IMAGES_COUNT"

  if [ "$IMAGES_ALLOWED" != "null" ]; then
    PERCENT_USED=$(echo "scale=1; $IMAGES_COUNT * 100 / $IMAGES_ALLOWED" | bc)
    echo "   Quota: $IMAGES_COUNT / $IMAGES_ALLOWED ($PERCENT_USED%)"
  else
    echo "   Quota: Unlimited (paid plan)"
  fi
else
  echo "⚠️  Could not retrieve storage stats"
fi

echo ""
```

### 7. Display Recent Images

```bash
echo "🖼️  Recent images..."

RECENT=$(curl -s \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?per_page=5" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

RECENT_SUCCESS=$(echo "$RECENT" | jq -r '.success')

if [ "$RECENT_SUCCESS" = "true" ]; then
  IMAGE_COUNT=$(echo "$RECENT" | jq -r '.result.images | length')

  if [ "$IMAGE_COUNT" -gt 0 ]; then
    echo "✅ Last $IMAGE_COUNT uploaded images:"
    echo ""
    echo "$RECENT" | jq -r '.result.images[] | "   ID: \(.id)\n   Uploaded: \(.uploaded)\n   Filename: \(.filename)\n   Variants: \(.variants | length)\n"'
  else
    echo "ℹ️  No images uploaded yet"
  fi
else
  echo "⚠️  Could not retrieve recent images"
fi

echo ""
```

### 8. Test Image Delivery (If Images Exist)

```bash
echo "🌐 Testing image delivery..."

if [ "$IMAGE_COUNT" -gt 0 ] && [ ! -z "$CF_ACCOUNT_HASH" ]; then
  # Get first image ID
  SAMPLE_ID=$(echo "$RECENT" | jq -r '.result.images[0].id')

  # Test delivery
  DELIVERY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://imagedelivery.net/${CF_ACCOUNT_HASH}/${SAMPLE_ID}/public")

  if [ "$DELIVERY_STATUS" = "200" ]; then
    echo "✅ Image delivery: Working"
    echo "   Test URL: https://imagedelivery.net/${CF_ACCOUNT_HASH}/${SAMPLE_ID}/public"

    # Check CDN caching
    CACHE_STATUS=$(curl -s -I "https://imagedelivery.net/${CF_ACCOUNT_HASH}/${SAMPLE_ID}/public" \
      | grep -i "cf-cache-status" | awk '{print $2}' | tr -d '\r')

    if [ ! -z "$CACHE_STATUS" ]; then
      echo "   CDN Cache: $CACHE_STATUS"
    fi
  else
    echo "❌ Image delivery failed (HTTP $DELIVERY_STATUS)"
    echo "   Verify CF_ACCOUNT_HASH is correct"
  fi
elif [ "$IMAGE_COUNT" = 0 ]; then
  echo "ℹ️  No images to test delivery"
elif [ -z "$CF_ACCOUNT_HASH" ]; then
  echo "ℹ️  Cannot test delivery (CF_ACCOUNT_HASH not set)"
fi

echo ""
```

### 9. Summary

```bash
echo "========================================="
echo "✅ Cloudflare Images Health Check Complete"
echo "========================================="
echo ""
echo "Configuration:"
echo "  Account ID: ${CF_ACCOUNT_ID:0:8}..."
echo "  Account Hash: ${CF_ACCOUNT_HASH:-Not set}"
echo "  Zone ID: ${CF_ZONE_ID:-Not configured}"
echo ""
echo "Status:"
echo "  API: Connected ✅"
echo "  Authentication: Valid ✅"
echo "  Images: $IMAGES_COUNT stored"
echo "  Variants: $VARIANT_COUNT configured"
echo ""
echo "Next Steps:"
echo "  • Upload test image: See templates/worker-upload.ts"
echo "  • Configure variants: Run /generate-variant"
echo "  • Validate config: Run /validate-config"
echo ""
```

## Expected Output

When everything is configured correctly:

```
📋 Checking environment variables...
✅ CF_ACCOUNT_ID: 1a2b3c4d...
✅ CF_API_TOKEN: abc123def4...
✅ CF_ACCOUNT_HASH: Vi7wi5KSItxGFsWRG2Us6Q

🔌 Testing API connectivity...
✅ API connectivity: OK

🔑 Validating authentication...
✅ Authentication: Valid
   Images accessible: 42

🎨 Checking transformations...
✅ Zone Polish: lossless

📐 Listing configured variants...
✅ Variants configured: 3/100

   Configured variants:
   • thumbnail: 300x300 (cover)
   • medium: 800x800 (scale-down)
   • large: 1600x1600 (scale-down)

💾 Checking storage quota...
✅ Storage usage:
   Images stored: 42
   Quota: Unlimited (paid plan)

🖼️  Recent images...
✅ Last 5 uploaded images:

   ID: 2cdc28f0-017a-49c4-9ed7-87056c83901
   Uploaded: 2025-01-15T10:30:00.000Z
   Filename: product-photo.jpg
   Variants: 4

🌐 Testing image delivery...
✅ Image delivery: Working
   Test URL: https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../public
   CDN Cache: HIT

=========================================
✅ Cloudflare Images Health Check Complete
=========================================

Configuration:
  Account ID: 1a2b3c4d...
  Account Hash: Vi7wi5KSItxGFsWRG2Us6Q
  Zone ID: 9z8y7x6w...

Status:
  API: Connected ✅
  Authentication: Valid ✅
  Images: 42 stored
  Variants: 3 configured

Next Steps:
  • Upload test image: See templates/worker-upload.ts
  • Configure variants: Run /generate-variant
  • Validate config: Run /validate-config
```

## Troubleshooting

### Error: CF_ACCOUNT_ID not set

**Solution**: Add to `.env` file:
```bash
CF_ACCOUNT_ID=your_account_id_here
```

Get account ID from Cloudflare dashboard: Account > Workers & Pages > Account ID

### Error: API connectivity failed (HTTP 401)

**Solution**: Invalid API token. Create new token:
1. Go to Cloudflare dashboard
2. My Profile > API Tokens > Create Token
3. Use "Edit Cloudflare Images" template
4. Copy token to `.env`: `CF_API_TOKEN=your_token_here`

### Error: Authentication failed

**Solution**: Verify permissions:
- Token must have "Cloudflare Images:Edit" permission
- Token must be scoped to correct account

### Warning: No custom variants configured

**Solution**: This is normal if using flexible transformations. Create variants with:
```
/generate-variant
```

## Related Commands

- `/validate-config` - Validate wrangler.jsonc and bindings
- `/generate-variant` - Create new variant interactively

## Related References

- `references/api-reference.md` - Complete API documentation
- `references/variants-guide.md` - Variant configuration
- `references/setup-guide.md` - Initial setup guide
