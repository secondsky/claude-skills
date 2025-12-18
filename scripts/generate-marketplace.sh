#!/bin/bash
# Generate marketplace.json from all skills in skills/ directory
# Extracts metadata from SKILL.md frontmatter

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

# Function to extract description from SKILL.md
extract_description() {
  local skill_md="$1"
  local description=""
  
  # Extract description (handle single-line, multi-line with |, and multi-line with >)
  # First try single-line format
  description=$(awk '/^description:/{if($0 !~ /[\|>]$/){gsub(/^description: */, ""); print; exit}}' "$skill_md")
  
  # If not found or empty, try multi-line format with | or >
  if [ -z "$description" ]; then
    description=$(awk '
      /^description: [\|>]/{flag=1; next}
      /^[a-z-]+:/{flag=0}
      flag && /^  /{gsub(/^  /, ""); line=line $0 " "}
      END{gsub(/ $/, "", line); print line}
    ' "$skill_md")
  fi
  
  # If description is still empty or problematic, return empty
  if [ -z "$description" ] || [ "$description" = "|" ] || [ "$description" = ">" ]; then
    echo ""
    return
  fi
  
  echo "$description"
}

# Function to extract keywords
extract_keywords() {
  local description="$1"
  local skill_md="$2"
  local keywords_raw=""

  # Priority 1: Try to extract from description (Keywords: line within description text)
  keywords_raw=$(echo "$description" | sed -n 's/.*Keywords:[[:space:]]*\(.*\)/\1/p' | tr -d '"' | tr -d "'")

  # Priority 2: If no keywords in description, try metadata.keywords YAML list
  if [ -z "$keywords_raw" ]; then
    keywords_raw=$(extract_metadata_keywords "$skill_md")
  fi

  # Priority 3: If still no keywords, try top-level keywords: YAML list
  if [ -z "$keywords_raw" ]; then
    keywords_raw=$(awk '/^keywords:/{flag=1; next} /^[a-z-]+:/{flag=0} flag && /^  - /{gsub(/^  - /, ""); print}' "$skill_md" | tr '\n' ',' | sed 's/,$//')
  fi

  # Clean up and convert to JSON array (limit to 50 keywords for better discoverability)
  if [ -n "$keywords_raw" ]; then
    echo "$keywords_raw" | sed 's/,/\n/g' | sed 's/^ *//;s/ *$//' | grep -v '^$' | $HEAD_CMD -50 | awk '
      BEGIN { printf "[" }
      {
        gsub(/\\/, "\\\\")
        gsub(/"/, "")
        if (NR > 1) printf ","
        printf "\"%s\"", $0
      }
      END { printf "]" }
    '
  else
    echo "[]"
  fi
}

# Function to clean description (remove Keywords line, limit to 2048 chars to prevent truncation)
clean_description() {
  local description="$1"
  echo "$description" | sed 's/Keywords:.*$//' | tr -d '"' | tr -d "'" | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | $HEAD_CMD -c 2048
}

# Function to extract metadata field from SKILL.md (e.g., version, last_verified)
extract_metadata_field() {
  local skill_md="$1"
  local field="$2"
  local value=""

  # Look for field within metadata: block
  # Pattern: metadata: ... field: value
  value=$(awk -v field="$field" '
    /^metadata:/{in_meta=1; next}
    /^[a-z-]+:/ && !/^  /{in_meta=0}
    in_meta && $0 ~ "^  "field":" {
      gsub(/^  [a-z_-]+: */, "")
      gsub(/^ *"/, "")
      gsub(/" *$/, "")
      gsub(/^ *'"'"'/, "")
      gsub(/'"'"' *$/, "")
      print
      exit
    }
  ' "$skill_md")

  echo "$value"
}

# Function to extract keywords from metadata.keywords YAML list
extract_metadata_keywords() {
  local skill_md="$1"
  local keywords=""

  # Look for keywords: list within metadata: block
  keywords=$(awk '
    /^metadata:/{in_meta=1; next}
    /^[a-z-]+:/ && !/^  /{in_meta=0}
    in_meta && /^  keywords:/{in_kw=1; next}
    in_meta && in_kw && /^    - /{gsub(/^    - /, ""); print; next}
    in_meta && in_kw && /^  [a-z]/{in_kw=0}
  ' "$skill_md" | tr '\n' ',' | sed 's/,$//')

  echo "$keywords"
}

# Function to determine category based on keywords and skill name
determine_category() {
  local skill_name="$1"
  local keywords="$2"
  local description="$3"
  
  # Convert to lowercase for easier matching
  local text=$(echo "$skill_name $keywords $description" | tr '[:upper:]' '[:lower:]')
  
  # Category rules (order matters - more specific first)
  # Use word boundaries (\b) to avoid false positives (e.g., "orm" matching "transform")
  # Priority: Skill name patterns > specific categories > general categories

  # 1. Cloudflare: Skill name starts with "cloudflare-"
  if echo "$skill_name" | grep -q "^cloudflare-"; then
    echo "cloudflare"
  # 2. Database: Check skill names first (vercel-kv, vercel-blob, neon-vercel-postgres)
  elif echo "$skill_name" | grep -q -E "^vercel-kv$|^vercel-blob$|^neon-|^drizzle-"; then
    echo "database"
  # 3. Auth: Skill names with auth/clerk
  elif echo "$skill_name" | grep -q -E "auth|clerk"; then
    echo "auth"
  # 4. Tooling: Specific tooling skill names
  elif echo "$skill_name" | grep -q -E "^skill-review$|^dependency-|^project-|^mcp-|^typescript-|^github-|^open-source-|^swift-|^claude-code-bash"; then
    echo "tooling"
  # 5. CMS: Content management systems
  elif echo "$text" | grep -q -E "\bcms\b|\btinacms\b|\bsveltia\b|\bwordpress\b"; then
    echo "cms"
  # 6. AI: Core AI/ML tools (check before frontend to catch AI-specific skills)
  elif echo "$skill_name" | grep -q -E "^ai-|^openai-|^claude-|^gemini-|^elevenlabs-|chatbot|prompt"; then
    echo "ai"
  elif echo "$text" | grep -q -E "\bllm\b|\bopenai\b|\bclaude\b|\bgemini\b|\bagents\b|\bembeddings\b|\belevenlabs\b|\bchatbot\b|\bprompt\b"; then
    echo "ai"
  # 7. Frontend: UI frameworks and components (broad category)
  elif echo "$text" | grep -q -E "\breact\b|\bnextjs\b|\btailwind\b|\bshadcn\b|\bvue\b|\bnuxt\b|\bsvelte\b|\bfrontend\b|\bcomponents\b|\btanstack\b|\bzustand\b|\banimation\b|\bmotion\b|\binspira\b|\baceternity\b|\bui\b"; then
    echo "frontend"
  # 8. Database: Content-based (fallback)
  elif echo "$text" | grep -q -E "\bdatabase\b|\borm\b|\bdrizzle\b|\bpostgres\b|\bkv\b|\bblob\b|\bsql\b"; then
    echo "database"
  # 9. Tooling: Content-based (fallback)
  elif echo "$text" | grep -q -E "\bmcp\b|\btypescript\b|\bplanning\b|\bhugo\b|\bgithub\b|\btooling\b|\bdependency\b|\bswift\b|\bbash\b"; then
    echo "tooling"
  else
    echo "other"
  fi
}

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
    "version": "1.0.0",
    "homepage": "https://github.com/secondsky/claude-skills",
    "pluginRoot": "./skills"
  },
  "plugins": [
EOF_HEADER

# Counter for tracking progress
count=0
total=$(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
skill_entries=()

echo "Processing skills..."
echo ""

# Iterate through all skill directories (sorted alphabetically)
for skill_dir in $(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  if [ ! -d "$skill_dir" ]; then
    continue
  fi

  skill_name=$(basename "$skill_dir")
  skill_md="$skill_dir/SKILL.md"

  count=$((count + 1))
  printf "[$count/$total] %-40s" "$skill_name"

  # Check if SKILL.md exists, if not try plugin.json
  if [ ! -f "$skill_md" ]; then
    # Check for existing plugin.json
    plugin_json="$skill_dir/.claude-plugin/plugin.json"
    if [ -f "$plugin_json" ] && command -v jq &> /dev/null; then
      echo "📦 (using plugin.json)"
      
      # Extract from plugin.json
      description=$(jq -r '.description // ""' "$plugin_json")
      keywords_json=$(jq -r '.keywords // []' "$plugin_json")
      
      if [ -z "$description" ]; then
        description="Production-ready skill for $skill_name"
      fi
      
      description_escaped=$(echo "$description" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')
      category=$(determine_category "$skill_name" "$keywords_json" "$description")
      
      # Create JSON entry
      skill_entry=$(cat << EOF
    {
      "name": "$skill_name",
      "source": "./skills/$skill_name",
      "description": "$description_escaped",
      "version": "1.0.0",
      "category": "$category",
      "keywords": $keywords_json,
      "author": {
        "name": "Jeremy Dawes",
        "email": "jeremy@jezweb.net"
      },
      "license": "MIT",
      "repository": "https://github.com/secondsky/claude-skills"
    }
EOF
)
      
      skill_entries+=("$skill_entry")
      continue
    else
      echo "⚠️  SKIP (no SKILL.md or plugin.json)"
      continue
    fi
  fi

  # Extract metadata from SKILL.md
  description=$(extract_description "$skill_md")

  if [ -z "$description" ]; then
    description="Production-ready skill for $skill_name"
    echo "⚠️  WARN (using default description)"
  else
    echo "✅"
  fi

  # Extract version from metadata.version (fallback to 1.0.0)
  version=$(extract_metadata_field "$skill_md" "version")
  if [ -z "$version" ]; then
    version="1.0.0"
  fi

  keywords_json=$(extract_keywords "$description" "$skill_md")
  description_clean=$(clean_description "$description")
  category=$(determine_category "$skill_name" "$keywords_json" "$description_clean")

  # Escape description for JSON
  description_escaped=$(echo "$description_clean" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')

  # Create JSON entry with actual version from metadata
  # Note: Only standard marketplace fields allowed (no custom fields like lastVerified)
  skill_entry=$(cat << EOF
    {
      "name": "$skill_name",
      "source": "./skills/$skill_name",
      "description": "$description_escaped",
      "version": "$version",
      "category": "$category",
      "keywords": $keywords_json,
      "author": {
        "name": "Claude Skills Maintainers",
        "email": "maintainers@example.com"
      },
      "license": "MIT",
      "repository": "https://github.com/secondsky/claude-skills"
    }
EOF
)
  
  skill_entries+=("$skill_entry")
done

echo ""
echo "Building final JSON..."

# Write all skill entries with proper comma separation
for i in "${!skill_entries[@]}"; do
  echo "${skill_entries[$i]}" >> "$MARKETPLACE_JSON"
  if [ $i -lt $((${#skill_entries[@]} - 1)) ]; then
    echo "," >> "$MARKETPLACE_JSON"
  fi
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
    skill_count=$(jq '.plugins | length' "$MARKETPLACE_JSON")
    echo "✅ Valid JSON generated with $skill_count skills"
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
echo "Skills processed: $count"
echo ""
echo "Next steps:"
echo "1. Review: cat $MARKETPLACE_JSON | jq '.plugins[] | .name' | sort"
echo "2. Test: /plugin marketplace add https://github.com/secondsky/claude-skills"
echo "3. Commit: git add .claude-plugin/marketplace.json && git commit -m 'Update marketplace with all skills'"
echo ""
