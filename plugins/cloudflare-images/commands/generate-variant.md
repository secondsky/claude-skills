---
name: cloudflare-images:generate-variant
description: Interactive variant generator for Cloudflare Images. Prompts for variant name, dimensions, fit mode, and quality, then generates API call to create the variant and optionally adds configuration to wrangler.jsonc.
---

# Generate Cloudflare Images Variant

Interactive tool for creating named variants for Cloudflare Images. Walks through variant configuration and generates the API call to create it.

## What This Command Does

When you run `/generate-variant`, Claude will:
1. Prompt for variant configuration (name, dimensions, fit, quality)
2. Validate variant name and options
3. Generate API call to create variant
4. Execute API call (if confirmed)
5. Output variant configuration
6. Optionally add variant to `wrangler.jsonc`

## Usage

```
/generate-variant
```

Claude will ask interactive questions to gather variant configuration.

## Variant Configuration Options

### Variant Name
- **Format**: Alphanumeric + hyphens only
- **Max length**: 32 characters
- **Examples**: `thumbnail`, `avatar-lg`, `product-preview`
- **Reserved**: Cannot use `public` (default variant)

### Dimensions
- **Width**: 1-9999 pixels (optional)
- **Height**: 1-9999 pixels (optional)
- **Note**: At least one dimension required

### Fit Modes
- **scale-down** (default): Never enlarge, preserve aspect ratio
- **contain**: Resize to fit within box, preserve aspect ratio
- **cover**: Resize to cover entire box, crop if needed
- **crop**: Crop to exact dimensions
- **pad**: Resize to fit, pad with background color

### Quality
- **Range**: 1-100
- **Default**: 85
- **Recommendations**:
  - Thumbnails: 80
  - Product photos: 85
  - Hero images: 90

### Optional Parameters
- **Background**: Color for padding (hex format: `#FFFFFF`)
- **Metadata**: `keep` | `copyright` | `none` (default: `none`)
- **Blur**: 1-250 pixels (for blur effect)

## Implementation

### Step 1: Interactive Configuration

Ask user for each parameter:

```
Variant Name (e.g., thumbnail, avatar-lg):
> thumbnail

Width (pixels, leave empty for auto):
> 300

Height (pixels, leave empty for auto):
> 300

Fit mode:
1. scale-down (never enlarge, default)
2. contain (fit within box)
3. cover (cover entire box, crop if needed)
4. crop (crop to exact dimensions)
5. pad (fit and pad with background)
> 3

Quality (1-100, default 85):
> 85

Background color for padding (optional, e.g., #FFFFFF):
> (skip)

Metadata (keep/copyright/none, default none):
> none

Blur radius (optional, 1-250):
> (skip)
```

### Step 2: Validate Configuration

```bash
# Validate variant name
VARIANT_NAME="thumbnail"

if [[ ! "$VARIANT_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "❌ Invalid variant name"
  echo "   Use only: a-z, 0-9, hyphens"
  exit 1
fi

if [ ${#VARIANT_NAME} -gt 32 ]; then
  echo "❌ Variant name too long (max 32 characters)"
  exit 1
fi

if [ "$VARIANT_NAME" = "public" ]; then
  echo "❌ Cannot use reserved name 'public'"
  exit 1
fi

echo "✅ Variant name valid: $VARIANT_NAME"

# Validate dimensions
WIDTH=300
HEIGHT=300

if [ -z "$WIDTH" ] && [ -z "$HEIGHT" ]; then
  echo "❌ At least one dimension (width or height) required"
  exit 1
fi

if [ ! -z "$WIDTH" ] && ([ "$WIDTH" -lt 1 ] || [ "$WIDTH" -gt 9999 ]); then
  echo "❌ Width must be between 1 and 9999"
  exit 1
fi

if [ ! -z "$HEIGHT" ] && ([ "$HEIGHT" -lt 1 ] || [ "$HEIGHT" -gt 9999 ]); then
  echo "❌ Height must be between 1 and 9999"
  exit 1
fi

echo "✅ Dimensions valid: ${WIDTH}x${HEIGHT}"

# Validate fit mode
FIT="cover"
VALID_FITS=("scale-down" "contain" "cover" "crop" "pad")

if [[ ! " ${VALID_FITS[@]} " =~ " ${FIT} " ]]; then
  echo "❌ Invalid fit mode: $FIT"
  echo "   Valid: scale-down, contain, cover, crop, pad"
  exit 1
fi

echo "✅ Fit mode valid: $FIT"

# Validate quality
QUALITY=85

if [ ! -z "$QUALITY" ] && ([ "$QUALITY" -lt 1 ] || [ "$QUALITY" -gt 100 ]); then
  echo "❌ Quality must be between 1 and 100"
  exit 1
fi

echo "✅ Quality valid: $QUALITY"
```

### Step 3: Build Variant Configuration

```bash
echo ""
echo "📐 Variant Configuration:"
echo "  Name: $VARIANT_NAME"
echo "  Dimensions: ${WIDTH}x${HEIGHT}"
echo "  Fit: $FIT"
echo "  Quality: $QUALITY"

if [ ! -z "$BACKGROUND" ]; then
  echo "  Background: $BACKGROUND"
fi

if [ ! -z "$METADATA" ] && [ "$METADATA" != "none" ]; then
  echo "  Metadata: $METADATA"
fi

if [ ! -z "$BLUR" ]; then
  echo "  Blur: ${BLUR}px"
fi

echo ""
```

### Step 4: Generate API Call

```bash
# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "id": "$VARIANT_NAME",
  "options": {
    "width": ${WIDTH},
    "height": ${HEIGHT},
    "fit": "$FIT",
    "metadata": "${METADATA:-none}"
  },
  "neverRequireSignedURLs": true
}
EOF
)

# Add optional parameters
if [ ! -z "$BACKGROUND" ]; then
  PAYLOAD=$(echo "$PAYLOAD" | jq ".options.background = \"$BACKGROUND\"")
fi

if [ ! -z "$BLUR" ]; then
  PAYLOAD=$(echo "$PAYLOAD" | jq ".options.blur = $BLUR")
fi

if [ ! -z "$QUALITY" ]; then
  PAYLOAD=$(echo "$PAYLOAD" | jq ".options.quality = $QUALITY")
fi

echo "🔧 Generated API Payload:"
echo "$PAYLOAD" | jq .
echo ""
```

### Step 5: Execute API Call

```bash
echo "📤 Creating variant via API..."

# Check environment variables
if [ -z "$CF_ACCOUNT_ID" ] || [ -z "$CF_API_TOKEN" ]; then
  echo "❌ Missing environment variables"
  echo "   Required: CF_ACCOUNT_ID, CF_API_TOKEN"
  echo ""
  echo "   Set in .env:"
  echo "   CF_ACCOUNT_ID=your_account_id"
  echo "   CF_API_TOKEN=your_api_token"
  exit 1
fi

# Create variant
RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Variant created successfully!"
  echo ""
  echo "Variant details:"
  echo "$RESPONSE" | jq -r '.result | "  ID: \(.id)\n  Never require signed URLs: \(.neverRequireSignedURLs)"'
  echo ""
  echo "Options:"
  echo "$RESPONSE" | jq '.result.options'
else
  echo "❌ Variant creation failed"
  echo ""
  echo "Errors:"
  echo "$RESPONSE" | jq -r '.errors[] | "  [\(.code)] \(.message)"'
  exit 1
fi

echo ""
```

### Step 6: Test Variant

```bash
echo "🧪 Testing variant..."

if [ ! -z "$CF_ACCOUNT_HASH" ]; then
  # Check if any images exist
  IMAGES=$(curl -s \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?per_page=1" \
    -H "Authorization: Bearer ${CF_API_TOKEN}")

  IMAGE_COUNT=$(echo "$IMAGES" | jq -r '.result.images | length')

  if [ "$IMAGE_COUNT" -gt 0 ]; then
    SAMPLE_ID=$(echo "$IMAGES" | jq -r '.result.images[0].id')

    # Test variant URL
    VARIANT_URL="https://imagedelivery.net/${CF_ACCOUNT_HASH}/${SAMPLE_ID}/${VARIANT_NAME}"

    VARIANT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VARIANT_URL")

    if [ "$VARIANT_STATUS" = "200" ]; then
      echo "✅ Variant accessible"
      echo "   Test URL: $VARIANT_URL"
    else
      echo "⚠️  Variant not accessible yet (HTTP $VARIANT_STATUS)"
      echo "   May take a few seconds to propagate"
    fi
  else
    echo "ℹ️  No images uploaded yet - cannot test variant"
    echo "   Upload an image to test: See templates/worker-upload.ts"
  fi
else
  echo "ℹ️  CF_ACCOUNT_HASH not set - cannot generate test URL"
fi

echo ""
```

### Step 7: Add to wrangler.jsonc (Optional)

```bash
echo "Would you like to add this variant to wrangler.jsonc for reference? (y/n)"
read -r ADD_TO_WRANGLER

if [ "$ADD_TO_WRANGLER" = "y" ] || [ "$ADD_TO_WRANGLER" = "Y" ]; then
  if [ -f "wrangler.jsonc" ]; then
    echo ""
    echo "📝 Add to wrangler.jsonc manually:"
    echo ""
    echo "// Add to comments for documentation:"
    echo "// Variants:"
    echo "//   - $VARIANT_NAME: ${WIDTH}x${HEIGHT} ($FIT, q=$QUALITY)"
    echo ""
    echo "Or use in TypeScript:"
    echo "const variants = {"
    echo "  $VARIANT_NAME: {"
    echo "    width: $WIDTH,"
    echo "    height: $HEIGHT,"
    echo "    fit: '$FIT',"
    echo "    quality: $QUALITY"
    echo "  }"
    echo "};"
  else
    echo "ℹ️  wrangler.jsonc not found in current directory"
  fi
fi

echo ""
```

### Step 8: Summary and Usage

```bash
echo "========================================="
echo "✅ Variant '$VARIANT_NAME' Created"
echo "========================================="
echo ""
echo "Usage in HTML:"
echo "<img src=\"https://imagedelivery.net/\${ACCOUNT_HASH}/\${IMAGE_ID}/$VARIANT_NAME\" alt=\"...\" />"
echo ""
echo "Usage in React/Next.js:"
echo "<Image"
echo "  src=\"https://imagedelivery.net/\${ACCOUNT_HASH}/\${IMAGE_ID}/$VARIANT_NAME\""
echo "  alt=\"...\""
echo "  width={$WIDTH}"
echo "  height={$HEIGHT}"
echo "/>"
echo ""
echo "Usage in Cloudflare Worker:"
echo "const imageUrl = \`https://imagedelivery.net/\${env.ACCOUNT_HASH}/\${imageId}/$VARIANT_NAME\`;"
echo ""
echo "Flexible transformations (alternative):"
echo "https://imagedelivery.net/\${ACCOUNT_HASH}/\${IMAGE_ID}/public?width=$WIDTH&height=$HEIGHT&fit=$FIT&quality=$QUALITY"
echo ""
echo "Next steps:"
echo "  • List all variants: /check-images"
echo "  • Create another variant: /generate-variant"
echo "  • Test upload: See templates/worker-upload.ts"
echo ""
```

## Example Session

```
/generate-variant

Variant Name (e.g., thumbnail, avatar-lg):
> product-medium

Width (pixels, leave empty for auto):
> 800

Height (pixels, leave empty for auto):
> 800

Fit mode:
1. scale-down (never enlarge, default)
2. contain (fit within box)
3. cover (cover entire box, crop if needed)
4. crop (crop to exact dimensions)
5. pad (fit and pad with background)
> 1

Quality (1-100, default 85):
> 85

Background color for padding (optional, e.g., #FFFFFF):
>

Metadata (keep/copyright/none, default none):
> none

Blur radius (optional, 1-250):
>

✅ Variant name valid: product-medium
✅ Dimensions valid: 800x800
✅ Fit mode valid: scale-down
✅ Quality valid: 85

📐 Variant Configuration:
  Name: product-medium
  Dimensions: 800x800
  Fit: scale-down
  Quality: 85

🔧 Generated API Payload:
{
  "id": "product-medium",
  "options": {
    "width": 800,
    "height": 800,
    "fit": "scale-down",
    "metadata": "none",
    "quality": 85
  },
  "neverRequireSignedURLs": true
}

📤 Creating variant via API...
✅ Variant created successfully!

Variant details:
  ID: product-medium
  Never require signed URLs: true

Options:
{
  "width": 800,
  "height": 800,
  "fit": "scale-down",
  "metadata": "none",
  "quality": 85
}

🧪 Testing variant...
✅ Variant accessible
   Test URL: https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/abc123.../product-medium

=========================================
✅ Variant 'product-medium' Created
=========================================

Usage in HTML:
<img src="https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/product-medium" alt="..." />

Usage in React/Next.js:
<Image
  src="https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/product-medium"
  alt="..."
  width={800}
  height={800}
/>

Usage in Cloudflare Worker:
const imageUrl = `https://imagedelivery.net/${env.ACCOUNT_HASH}/${imageId}/product-medium`;

Flexible transformations (alternative):
https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/public?width=800&height=800&fit=scale-down&quality=85

Next steps:
  • List all variants: /check-images
  • Create another variant: /generate-variant
  • Test upload: See templates/worker-upload.ts
```

## Common Use Cases

### Thumbnail Variant
```
Name: thumbnail
Width: 300
Height: 300
Fit: cover
Quality: 80
```

### Avatar Variants
```
Small: 48x48, cover, q=80
Medium: 96x96, cover, q=85
Large: 192x192, cover, q=85
```

### Product Photo Variants
```
Small: 400x400, scale-down, q=85
Medium: 800x800, scale-down, q=85
Large: 1600x1600, scale-down, q=90
```

### Hero Image Variants
```
Mobile: 768px width, scale-down, q=85
Tablet: 1024px width, scale-down, q=85
Desktop: 1920px width, scale-down, q=90
```

## Troubleshooting

### Error: Invalid variant name

**Solution**: Use only lowercase letters, numbers, and hyphens. Max 32 characters.

### Error: Variant already exists

**Solution**: Choose a different name or delete the existing variant:
```bash
curl -X DELETE \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants/${VARIANT_NAME}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}"
```

### Error: Maximum variants reached

**Solution**: Delete unused variants. Limit is 100 variants per account.

### Error: Missing CF_ACCOUNT_ID or CF_API_TOKEN

**Solution**: Set environment variables in `.env`:
```bash
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
```

## Related Commands

- `/check-images` - List all existing variants
- `/validate-config` - Verify configuration is correct

## Related References

- `references/variants-guide.md` - Complete variant documentation
- `references/transformation-options.md` - All transformation parameters
- `references/api-reference.md` - API documentation
