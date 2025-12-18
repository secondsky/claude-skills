#!/bin/bash
# Generate marketplace.json from all skills in skills/ directory
# Groups skills into suite plugins with skills arrays (Anthropic-compliant format)
#
# This script was modified from the individual plugin format to suite plugin format
# to match Anthropic's official plugin specification and enable skill discovery.
#
# References:
# - Upstream fix: https://github.com/jezweb/claude-skills/commit/43de3d3
# - Our categorization: planning/SKILL_CATEGORIZATION.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(cd "$SCRIPT_DIR/../skills" && pwd)"
MARKETPLACE_DIR="$(cd "$SCRIPT_DIR/../.claude-plugin" && pwd)"
MARKETPLACE_JSON="$MARKETPLACE_DIR/marketplace.json"

# Ensure we use the Unix 'head' command, not HTTP head
if [ -x "/usr/bin/head" ]; then
  HEAD_CMD="/usr/bin/head"
elif [ -x "/bin/head" ]; then
  HEAD_CMD="/bin/head"
else
  HEAD_CMD="head"
fi

echo "============================================"
echo "Generating marketplace.json for Claude Skills"
echo "Format: Suite Plugins (Anthropic-compliant)"
echo "============================================"
echo ""
echo "Skills directory: $SKILLS_DIR"
echo "Output: $MARKETPLACE_JSON"
echo ""

# Backup existing marketplace.json
if [ -f "$MARKETPLACE_JSON" ]; then
  backup_file="$MARKETPLACE_JSON.backup-$(date +%Y%m%d-%H%M%S)"
  cp "$MARKETPLACE_JSON" "$backup_file"
  echo "✅ Backed up existing marketplace.json to: $(basename "$backup_file")"
  echo ""
fi

# Function to categorize skill into suite plugin
categorize_skill() {
  local skill_name="$1"

  # Cloudflare skills
  if [[ "$skill_name" =~ ^cloudflare- ]]; then
    echo "cloudflare-skills"
  # Mobile skills (check BEFORE frontend to catch react-native-app)
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then
    echo "mobile-skills"
  # Claude Code tooling (check BEFORE ai-skills to avoid claude- prefix match)
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then
    echo "tooling-skills"
  # AI/ML skills
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then
    echo "ai-skills"
  # Frontend framework skills
  elif [[ "$skill_name" =~ ^(nextjs|nuxt-|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then
    echo "frontend-skills"
  # Auth skills
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation) ]]; then
    echo "auth-skills"
  # CMS skills
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then
    echo "cms-skills"
  # Database skills
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-blob|vercel-kv) ]]; then
    echo "database-skills"
  # API skills
  elif [[ "$skill_name" =~ ^(api-|graphql-|rest-api-design|websocket-implementation) ]]; then
    echo "api-skills"
  # Testing skills
  elif [[ "$skill_name" =~ ^(jest-generator|mutation-testing|playwright-testing|test-quality-analysis|vitest-testing) ]]; then
    echo "testing-skills"
  # Security skills
  elif [[ "$skill_name" =~ ^(access-control-rbac|csrf-protection|defense-in-depth-validation|security-headers-configuration|vulnerability-scanning|xss-prevention) ]]; then
    echo "security-skills"
  # WooCommerce skills
  elif [[ "$skill_name" =~ ^woocommerce- ]]; then
    echo "woocommerce-skills"
  # Web development skills
  elif [[ "$skill_name" =~ ^(firecrawl-scraper|hono-routing|image-optimization|internationalization-i18n|payment-gateway-integration|progressive-web-app|push-notification-setup|responsive-web-design|session-management|web-performance-) ]]; then
    echo "web-skills"
  # SEO skills
  elif [[ "$skill_name" =~ ^seo- ]]; then
    echo "seo-skills"
  # Design skills
  elif [[ "$skill_name" =~ ^(design-|interaction-design|kpi-dashboard-design|mobile-first-design) ]]; then
    echo "design-skills"
  # Data/recommendation skills
  elif [[ "$skill_name" =~ ^(recommendation-|sql-query-optimization) ]]; then
    echo "data-skills"
  # Documentation skills
  elif [[ "$skill_name" =~ ^technical-specification ]]; then
    echo "documentation-skills"
  # Architecture skills
  elif [[ "$skill_name" =~ ^(architecture-patterns|health-check-endpoints|microservices-patterns) ]]; then
    echo "architecture-skills"
  # Default to tooling-skills
  else
    echo "tooling-skills"
  fi
}

# Function to get suite plugin description
get_suite_description() {
  local suite_name="$1"

  case "$suite_name" in
    "cloudflare-skills")
      echo "Complete Cloudflare platform skills - Workers, D1, R2, KV, AI, Queues, Durable Objects, and more. Production-tested edge computing solutions."
      ;;
    "ai-skills")
      echo "AI and ML integrations - OpenAI, Gemini, Claude API, Eleven Labs, ML pipelines, and model deployment. Complete AI development toolkit."
      ;;
    "frontend-skills")
      echo "Modern UI frameworks and libraries - React, Vue, Nuxt, Next.js, Tailwind v4, shadcn, TanStack, component libraries, and animations."
      ;;
    "auth-skills")
      echo "Authentication and authorization solutions - Better Auth, Clerk, OAuth implementations. Secure user authentication for modern apps."
      ;;
    "cms-skills")
      echo "Content management systems and static site generators - Sveltia CMS, WordPress, Hugo, Nuxt Content, and content collections."
      ;;
    "database-skills")
      echo "Database, ORM, and data storage solutions - Drizzle ORM, Neon Postgres, Vercel KV/Blob, schema design, and sharding strategies."
      ;;
    "api-skills")
      echo "API design, implementation, and best practices - REST, GraphQL, WebSocket, authentication, versioning, testing, and optimization."
      ;;
    "testing-skills")
      echo "Testing frameworks and quality assurance - Jest, Playwright, Vitest, mutation testing, and test quality analysis tools."
      ;;
    "mobile-skills")
      echo "Mobile app development for iOS and Android - React Native, Swift, app store deployment, mobile testing, and offline support."
      ;;
    "security-skills")
      echo "Security best practices and vulnerability protection - RBAC, CSRF/XSS prevention, security headers, and vulnerability scanning."
      ;;
    "woocommerce-skills")
      echo "WooCommerce development and best practices - Backend development, code review, copywriting guidelines, and development cycle."
      ;;
    "web-skills")
      echo "Web development, optimization, and performance - Hono routing, image optimization, i18n, PWA, WebSocket, and performance auditing."
      ;;
    "seo-skills")
      echo "SEO optimization and keyword research - Keyword cluster building, SEO optimization strategies, and content optimization."
      ;;
    "design-skills")
      echo "UI/UX design and design systems - Design review, design system creation, frontend design, interaction design, and KPI dashboards."
      ;;
    "data-skills")
      echo "Data processing and optimization - Recommendation engines, recommendation systems, and SQL query optimization."
      ;;
    "documentation-skills")
      echo "Documentation and technical writing - Technical specification templates and documentation best practices."
      ;;
    "architecture-skills")
      echo "Software architecture patterns - Architecture patterns, microservices patterns, and health check implementations."
      ;;
    "tooling-skills")
      echo "Development tools, utilities, and workflow automation - MCP servers, project planning, code review, debugging tools, and productivity enhancers."
      ;;
    *)
      echo "Production-ready skills for modern development"
      ;;
  esac
}

# Create temp directory for categorization data (bash 3.2 compatible)
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Counter for tracking progress
count=0
total=$(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)

echo "Categorizing skills into suite plugins..."
echo ""

# Iterate through all skill directories and categorize them
for skill_dir in $(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  if [ ! -d "$skill_dir" ]; then
    continue
  fi

  skill_name=$(basename "$skill_dir")
  skill_md="$skill_dir/SKILL.md"

  count=$((count + 1))

  # Check if SKILL.md exists
  if [ ! -f "$skill_md" ]; then
    printf "[$count/$total] %-40s ⚠️  SKIP (no SKILL.md)\n" "$skill_name"
    continue
  fi

  # Categorize the skill
  category=$(categorize_skill "$skill_name")

  # Add to suite plugin file (one line per skill)
  echo "./skills/$skill_name" >> "$TEMP_DIR/$category"

  printf "[$count/$total] %-40s → %s\n" "$skill_name" "$category"
done

echo ""
echo "Suite plugin summary:"
echo "--------------------"
for suite_file in "$TEMP_DIR"/*; do
  if [ -f "$suite_file" ]; then
    suite_name=$(basename "$suite_file")
    skill_count=$(wc -l < "$suite_file" | tr -d ' ')
    printf "%-25s %3d skills\n" "$suite_name" "$skill_count"
  fi
done
echo ""

# Start generating JSON
cat > "$MARKETPLACE_JSON" << 'EOF_HEADER'
{
  "name": "claude-skills",
  "owner": {
    "name": "Claude Skills Maintainers",
    "email": "maintainers@example.com",
    "url": "https://github.com/secondsky/claude-skills"
  },
  "metadata": {
    "description": "Production-tested skills for Claude Code - Cloudflare, AI, React, Tailwind v4, and modern web development",
    "version": "2.0.0",
    "homepage": "https://github.com/secondsky/claude-skills",
    "pluginRoot": "./"
  },
  "plugins": [
EOF_HEADER

echo "Building suite plugin entries..."

# Generate suite plugin entries (sorted alphabetically)
first=true
for suite_file in $(ls "$TEMP_DIR" | sort); do
  if [ ! -f "$TEMP_DIR/$suite_file" ]; then
    continue
  fi

  # Add comma before each entry except the first
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$MARKETPLACE_JSON"
  fi

  # Convert skill file (one per line) to JSON array
  skills_array=$(cat "$TEMP_DIR/$suite_file" | awk '
    BEGIN { printf "      [" }
    {
      if (NR > 1) printf ","
      printf "\n        \"%s\"", $0
    }
    END { printf "\n      ]" }
  ')

  # Get description
  description=$(get_suite_description "$suite_file")
  description_escaped=$(echo "$description" | sed 's/"/\\"/g')

  # Write suite plugin entry
  cat >> "$MARKETPLACE_JSON" << EOF
    {
      "name": "$suite_file",
      "description": "$description_escaped",
      "source": "./",
      "skills": $skills_array
    }
EOF
done

# Close JSON
cat >> "$MARKETPLACE_JSON" << 'EOF_FOOTER'
  ]
}
EOF_FOOTER

# Validate JSON
if command -v jq &> /dev/null; then
  echo ""
  echo "Validating JSON..."
  if jq empty "$MARKETPLACE_JSON" 2>/dev/null; then
    suite_count=$(jq '.plugins | length' "$MARKETPLACE_JSON")
    total_skills=0
    for suite_file in "$TEMP_DIR"/*; do
      if [ -f "$suite_file" ]; then
        count=$(wc -l < "$suite_file" | tr -d ' ')
        total_skills=$((total_skills + count))
      fi
    done
    echo "✅ Valid JSON generated"
    echo "   - Suite plugins: $suite_count"
    echo "   - Total skills: $total_skills"
  else
    echo "❌ ERROR: Invalid JSON generated"
    exit 1
  fi
else
  echo "⚠️  Warning: jq not installed, skipping JSON validation"
fi

echo ""
echo "============================================"
echo "✅ Marketplace generation complete!"
echo "============================================"
echo ""
echo "Output: $MARKETPLACE_JSON"
echo "Format: Suite plugins with skills arrays"
echo "Skills processed: $count"
echo ""
echo "Next steps:"
echo "1. Review: jq '.plugins[] | {name, skill_count: (.skills | length)}' $MARKETPLACE_JSON"
echo "2. Test locally: /plugin marketplace add file://$(dirname $(dirname $MARKETPLACE_JSON))"
echo "3. Commit: git add .claude-plugin/marketplace.json scripts/generate-marketplace.sh"
echo "4. Push: git push"
echo ""
echo "Installation (after push):"
echo "  /plugin install cloudflare-skills@claude-skills"
echo "  /plugin install ai-skills@claude-skills"
echo "  ... etc"
echo ""
