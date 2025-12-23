#!/usr/bin/env bash
# Shared categorization logic for plugin/skill management scripts
# This function is used by both sync-plugins.sh and generate-marketplace.sh

categorize_skill() {
  local skill_name="$1"

  # Cloudflare skills (matches both "cloudflare" parent and "cloudflare-*" children)
  if [[ "$skill_name" =~ ^cloudflare(-|$) ]]; then
    echo "cloudflare"
  # Mobile skills (check BEFORE frontend to catch react-native-app)
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then
    echo "mobile"
  # Claude Code tooling (check BEFORE ai-skills to avoid claude- prefix match)
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then
    echo "tooling"
  # AI/ML skills
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then
    echo "ai"
  # Frontend framework skills (nuxt(-|$) matches both "nuxt" parent and "nuxt-*" children)
  elif [[ "$skill_name" =~ ^(nextjs|nuxt(-|$)|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then
    echo "frontend"
  # Auth skills
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation|api-authentication|session-management) ]]; then
    echo "auth"
  # CMS skills
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then
    echo "cms"
  # Database skills
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-blob|vercel-kv) ]]; then
    echo "database"
  # API skills
  elif [[ "$skill_name" =~ ^(api-|graphql-|rest-api-design|websocket-implementation) ]]; then
    echo "api"
  # Testing skills
  elif [[ "$skill_name" =~ ^(jest-generator|mutation-testing|playwright-testing|test-quality-analysis|vitest-testing) ]]; then
    echo "testing"
  # Security skills
  elif [[ "$skill_name" =~ ^(access-control-rbac|csrf-protection|defense-in-depth-validation|security-headers-configuration|vulnerability-scanning|xss-prevention) ]]; then
    echo "security"
  # WooCommerce skills (matches both "woocommerce" parent and "woocommerce-*" children)
  elif [[ "$skill_name" =~ ^woocommerce(-|$) ]]; then
    echo "woocommerce"
  # Web development skills
  elif [[ "$skill_name" =~ ^(firecrawl-scraper|hono-routing|image-optimization|internationalization-i18n|payment-gateway-integration|progressive-web-app|push-notification-setup|responsive-web-design|web-performance-) ]]; then
    echo "web"
  # SEO skills
  elif [[ "$skill_name" =~ ^seo- ]]; then
    echo "seo"
  # Design skills
  elif [[ "$skill_name" =~ ^(design-|interaction-design|kpi-dashboard-design|mobile-first-design) ]]; then
    echo "design"
  # Data/recommendation skills
  elif [[ "$skill_name" =~ ^(recommendation-|sql-query-optimization) ]]; then
    echo "data"
  # Documentation skills
  elif [[ "$skill_name" =~ ^technical-specification ]]; then
    echo "documentation"
  # Architecture skills
  elif [[ "$skill_name" =~ ^(architecture-patterns|health-check-endpoints|microservices-patterns) ]]; then
    echo "architecture"
  # Default to tooling
  else
    echo "tooling"
  fi
}
