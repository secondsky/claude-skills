---
name: cloudflare-images:validate-config
description: Validate wrangler.jsonc configuration, verify Cloudflare Images bindings, check environment variables, and test Workers integration. Ensures correct setup for using Cloudflare Images with Cloudflare Workers.
---

# Validate Cloudflare Images Configuration

Comprehensive validation of `wrangler.jsonc`, environment variables, and Cloudflare Images bindings for Workers integration.

## What This Command Does

When you run `/validate-config`, Claude will:
1. Check if `wrangler.jsonc` exists and has valid JSON
2. Verify images binding configuration
3. Validate environment variables (`.env`, `.dev.vars`)
4. Test API token permissions
5. Check account ID matches binding
6. Verify Worker can access IMAGES binding
7. Validate transformation endpoints
8. Check for common configuration issues

## Usage

```
/validate-config
```

Run from your Cloudflare Worker project root (where `wrangler.jsonc` is located).

## Implementation

Run the following validation checks:

### 1. Check wrangler.jsonc Exists

```bash
echo "📁 Checking project structure..."

if [ ! -f "wrangler.jsonc" ]; then
  echo "❌ wrangler.jsonc not found"
  echo "   Run: wrangler init"
  exit 1
else
  echo "✅ wrangler.jsonc found"
fi

echo ""
```

### 2. Validate wrangler.jsonc Syntax

```bash
echo "📝 Validating wrangler.jsonc syntax..."

# Check if valid JSON (with comments allowed for JSONC)
if jq empty wrangler.jsonc 2>/dev/null; then
  echo "✅ Valid JSON syntax"
else
  # Try stripping comments and validating
  if grep -v '^\s*//' wrangler.jsonc | jq empty 2>/dev/null; then
    echo "✅ Valid JSONC syntax (with comments)"
  else
    echo "❌ Invalid JSON syntax in wrangler.jsonc"
    echo "   Check for trailing commas, missing quotes, etc."
    exit 1
  fi
fi

echo ""
```

### 3. Verify Images Binding Configuration

```bash
echo "🔗 Checking images binding..."

BINDING_EXISTS=$(jq -r 'has("images")' wrangler.jsonc 2>/dev/null)

if [ "$BINDING_EXISTS" = "true" ]; then
  echo "✅ images binding configured"

  # Validate binding structure
  BINDING_COUNT=$(jq -r '.images | length' wrangler.jsonc)
  echo "   Bindings configured: $BINDING_COUNT"

  # Check each binding
  for i in $(seq 0 $(($BINDING_COUNT - 1))); do
    BINDING_NAME=$(jq -r ".images[$i].binding" wrangler.jsonc)
    BINDING_ACCOUNT=$(jq -r ".images[$i].account_id" wrangler.jsonc)

    if [ "$BINDING_NAME" != "null" ]; then
      echo "   • Binding: $BINDING_NAME"
    else
      echo "   ⚠️  Binding $i missing 'binding' field (default: IMAGES)"
    fi

    if [ "$BINDING_ACCOUNT" != "null" ]; then
      echo "     Account: ${BINDING_ACCOUNT:0:8}..."
    else
      echo "     ⚠️  No account_id specified (will use account from wrangler auth)"
    fi
  done
else
  echo "❌ No images binding configured"
  echo ""
  echo "   Add to wrangler.jsonc:"
  echo '   {
     "images": [
       {
         "binding": "IMAGES",
         "account_id": "your_account_id"
       }
     ]
   }'
  exit 1
fi

echo ""
```

### 4. Validate Environment Variables

```bash
echo "🔐 Checking environment variables..."

# Check .env file
if [ -f ".env" ]; then
  echo "✅ .env file found"

  if grep -q "CF_ACCOUNT_ID" .env; then
    ACCOUNT_ID=$(grep "CF_ACCOUNT_ID" .env | cut -d '=' -f2)
    echo "   CF_ACCOUNT_ID: ${ACCOUNT_ID:0:8}..."
  else
    echo "   ⚠️  CF_ACCOUNT_ID not set in .env"
  fi

  if grep -q "CF_API_TOKEN" .env; then
    API_TOKEN=$(grep "CF_API_TOKEN" .env | cut -d '=' -f2)
    echo "   CF_API_TOKEN: ${API_TOKEN:0:10}..."
  else
    echo "   ⚠️  CF_API_TOKEN not set in .env"
  fi

  if grep -q "CF_ACCOUNT_HASH" .env; then
    ACCOUNT_HASH=$(grep "CF_ACCOUNT_HASH" .env | cut -d '=' -f2)
    echo "   CF_ACCOUNT_HASH: $ACCOUNT_HASH"
  else
    echo "   ℹ️  CF_ACCOUNT_HASH not set (optional for delivery URLs)"
  fi
else
  echo "⚠️  .env file not found"
  echo "   Create .env with:"
  echo "   CF_ACCOUNT_ID=your_account_id"
  echo "   CF_API_TOKEN=your_api_token"
fi

# Check .dev.vars file (for wrangler dev)
echo ""
if [ -f ".dev.vars" ]; then
  echo "✅ .dev.vars file found (for local development)"
else
  echo "ℹ️  .dev.vars not found (optional - for wrangler dev)"
  echo "   Create .dev.vars for local secrets"
fi

echo ""
```

### 5. Verify Account ID Matches

```bash
echo "🔍 Verifying account ID consistency..."

# Get account ID from wrangler.jsonc
WRANGLER_ACCOUNT=$(jq -r '.images[0].account_id // empty' wrangler.jsonc)

# Get account ID from .env
if [ -f ".env" ]; then
  ENV_ACCOUNT=$(grep "CF_ACCOUNT_ID" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

if [ ! -z "$WRANGLER_ACCOUNT" ] && [ ! -z "$ENV_ACCOUNT" ]; then
  if [ "$WRANGLER_ACCOUNT" = "$ENV_ACCOUNT" ]; then
    echo "✅ Account IDs match"
    echo "   wrangler.jsonc: ${WRANGLER_ACCOUNT:0:8}..."
    echo "   .env: ${ENV_ACCOUNT:0:8}..."
  else
    echo "❌ Account ID mismatch!"
    echo "   wrangler.jsonc: ${WRANGLER_ACCOUNT:0:8}..."
    echo "   .env: ${ENV_ACCOUNT:0:8}..."
    echo "   These should match for consistent behavior"
  fi
elif [ -z "$WRANGLER_ACCOUNT" ]; then
  echo "ℹ️  No account_id in wrangler.jsonc (using default account)"
elif [ -z "$ENV_ACCOUNT" ]; then
  echo "ℹ️  CF_ACCOUNT_ID not set in .env"
fi

echo ""
```

### 6. Test API Token Permissions

```bash
echo "🔑 Testing API token permissions..."

if [ -f ".env" ] && grep -q "CF_API_TOKEN" .env && grep -q "CF_ACCOUNT_ID" .env; then
  source .env

  # Test Images API access
  IMAGES_TEST=$(curl -s \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?per_page=1" \
    -H "Authorization: Bearer ${CF_API_TOKEN}")

  IMAGES_SUCCESS=$(echo "$IMAGES_TEST" | jq -r '.success')

  if [ "$IMAGES_SUCCESS" = "true" ]; then
    echo "✅ API token has Images:Read permission"

    # Test if can list variants (requires Edit permission)
    VARIANTS_TEST=$(curl -s \
      "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants" \
      -H "Authorization: Bearer ${CF_API_TOKEN}")

    VARIANTS_SUCCESS=$(echo "$VARIANTS_TEST" | jq -r '.success')

    if [ "$VARIANTS_SUCCESS" = "true" ]; then
      echo "✅ API token has Images:Edit permission"
    else
      echo "⚠️  API token missing Images:Edit permission"
      echo "   Required for uploads and variant management"
    fi
  else
    echo "❌ API token invalid or missing Images permissions"
    ERRORS=$(echo "$IMAGES_TEST" | jq -r '.errors[].message')
    echo "   Error: $ERRORS"
  fi
else
  echo "⚠️  Cannot test API token (missing .env or credentials)"
fi

echo ""
```

### 7. Check Worker TypeScript Types

```bash
echo "📦 Checking TypeScript configuration..."

if [ -f "src/index.ts" ] || [ -f "src/worker.ts" ]; then
  echo "✅ TypeScript Worker found"

  # Check for proper Env interface
  if grep -r "interface Env" src/ >/dev/null 2>&1; then
    echo "   ✅ Env interface defined"

    # Check if IMAGES binding is typed
    if grep -r "IMAGES.*any\|IMAGES.*Fetcher" src/ >/dev/null 2>&1; then
      echo "   ✅ IMAGES binding typed in Env interface"
    else
      echo "   ⚠️  IMAGES binding not found in Env interface"
      echo ""
      echo "   Add to Env interface:"
      echo "   interface Env {"
      echo "     IMAGES: any; // Cloudflare Images binding"
      echo "   }"
    fi
  else
    echo "   ⚠️  No Env interface found"
    echo "   Define Env interface for type safety"
  fi
else
  echo "ℹ️  No TypeScript Worker found (using JavaScript)"
fi

echo ""
```

### 8. Validate Transformation Configuration

```bash
echo "🎨 Checking transformation configuration..."

# Check if using zone-based transformations
if jq -e '.zone_id' wrangler.jsonc >/dev/null 2>&1; then
  ZONE_ID=$(jq -r '.zone_id' wrangler.jsonc)
  echo "✅ Zone ID configured: ${ZONE_ID:0:8}..."

  # Could test Polish settings here if API token available
else
  echo "ℹ️  No zone_id configured"
  echo "   Zone-based transformations require zone_id in wrangler.jsonc"
  echo "   Cloudflare Images transformations work without zone"
fi

echo ""
```

### 9. Common Issues Check

```bash
echo "⚠️  Checking for common issues..."

ISSUES_FOUND=0

# Check 1: .gitignore includes sensitive files
if [ -f ".gitignore" ]; then
  if grep -q ".env" .gitignore && grep -q ".dev.vars" .gitignore; then
    echo "✅ .gitignore includes .env and .dev.vars"
  else
    echo "❌ .gitignore missing .env or .dev.vars"
    echo "   Add to .gitignore:"
    echo "   .env"
    echo "   .dev.vars"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
fi

# Check 2: Node modules installed
if [ -f "package.json" ]; then
  if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
  else
    echo "⚠️  Node modules not installed"
    echo "   Run: npm install"
  fi
fi

# Check 3: Wrangler version
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER_VERSION=$(wrangler --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  echo "✅ Wrangler installed: v$WRANGLER_VERSION"

  # Check if version is recent (3.x+)
  MAJOR_VERSION=$(echo $WRANGLER_VERSION | cut -d '.' -f1)
  if [ "$MAJOR_VERSION" -ge 3 ]; then
    echo "   ✅ Using Wrangler 3.x (recommended)"
  else
    echo "   ⚠️  Using Wrangler $MAJOR_VERSION.x (upgrade to 3.x recommended)"
  fi
else
  echo "❌ Wrangler not installed"
  echo "   Install: npm install -g wrangler"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ "$ISSUES_FOUND" = 0 ]; then
  echo ""
  echo "✅ No common issues detected"
fi

echo ""
```

### 10. Summary and Next Steps

```bash
echo "========================================="
echo "Configuration Validation Complete"
echo "========================================="
echo ""

if [ "$BINDING_EXISTS" = "true" ] && [ "$IMAGES_SUCCESS" = "true" ]; then
  echo "✅ Configuration is valid!"
  echo ""
  echo "Next steps:"
  echo "  1. Deploy worker: wrangler deploy"
  echo "  2. Test upload: See templates/worker-upload.ts"
  echo "  3. Check health: /check-images"
  echo "  4. Create variants: /generate-variant"
else
  echo "⚠️  Configuration needs attention"
  echo ""
  echo "Required fixes:"
  if [ "$BINDING_EXISTS" != "true" ]; then
    echo "  • Add images binding to wrangler.jsonc"
  fi
  if [ "$IMAGES_SUCCESS" != "true" ]; then
    echo "  • Verify CF_API_TOKEN has Images permissions"
  fi
  echo ""
  echo "See references/setup-guide.md for complete setup instructions"
fi

echo ""
```

## Expected Output (Valid Configuration)

```
📁 Checking project structure...
✅ wrangler.jsonc found

📝 Validating wrangler.jsonc syntax...
✅ Valid JSONC syntax (with comments)

🔗 Checking images binding...
✅ images binding configured
   Bindings configured: 1
   • Binding: IMAGES
     Account: 1a2b3c4d...

🔐 Checking environment variables...
✅ .env file found
   CF_ACCOUNT_ID: 1a2b3c4d...
   CF_API_TOKEN: abc123def4...
   CF_ACCOUNT_HASH: Vi7wi5KSItxGFsWRG2Us6Q

✅ .dev.vars file found (for local development)

🔍 Verifying account ID consistency...
✅ Account IDs match
   wrangler.jsonc: 1a2b3c4d...
   .env: 1a2b3c4d...

🔑 Testing API token permissions...
✅ API token has Images:Read permission
✅ API token has Images:Edit permission

📦 Checking TypeScript configuration...
✅ TypeScript Worker found
   ✅ Env interface defined
   ✅ IMAGES binding typed in Env interface

🎨 Checking transformation configuration...
ℹ️  No zone_id configured
   Zone-based transformations require zone_id in wrangler.jsonc
   Cloudflare Images transformations work without zone

⚠️  Checking for common issues...
✅ .gitignore includes .env and .dev.vars
✅ Node modules installed
✅ Wrangler installed: v3.91.0
   ✅ Using Wrangler 3.x (recommended)

✅ No common issues detected

=========================================
Configuration Validation Complete
=========================================

✅ Configuration is valid!

Next steps:
  1. Deploy worker: wrangler deploy
  2. Test upload: See templates/worker-upload.ts
  3. Check health: /check-images
  4. Create variants: /generate-variant
```

## Troubleshooting

### Error: wrangler.jsonc not found

**Solution**: Initialize Worker project:
```bash
wrangler init my-project
cd my-project
```

### Error: Invalid JSON syntax

**Solution**: Check `wrangler.jsonc` for:
- Trailing commas
- Unquoted property names
- Missing closing braces/brackets

Use a JSON validator or IDE with JSON support.

### Error: No images binding configured

**Solution**: Add to `wrangler.jsonc`:
```json
{
  "name": "my-worker",
  "main": "src/index.ts",
  "images": [
    {
      "binding": "IMAGES",
      "account_id": "your_account_id_here"
    }
  ]
}
```

### Error: Account ID mismatch

**Solution**: Ensure same account ID in both places:
- `wrangler.jsonc`: `images[0].account_id`
- `.env`: `CF_ACCOUNT_ID`

### Error: API token missing Images permissions

**Solution**: Create new API token with Images permissions:
1. Cloudflare Dashboard > My Profile > API Tokens
2. Create Token > Use template "Edit Cloudflare Images"
3. Add to `.env`: `CF_API_TOKEN=new_token_here`

### Warning: IMAGES binding not typed

**Solution**: Add to TypeScript Env interface:
```typescript
interface Env {
  IMAGES: any; // Cloudflare Images binding
  // ... other bindings
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // env.IMAGES is now typed
  }
}
```

## Related Commands

- `/check-images` - Test API connectivity and health
- `/generate-variant` - Create image variant interactively

## Related References

- `references/setup-guide.md` - Initial setup instructions
- `references/api-reference.md` - API documentation
- `templates/worker-upload.ts` - Complete Worker example
