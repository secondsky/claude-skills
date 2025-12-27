#!/usr/bin/env bash
#
# migration-generator.sh
#
# Generates Durable Objects migration entries for wrangler.jsonc
#
# What it does:
# - Prompts for migration type (new, rename, delete, transfer)
# - Generates migration JSON with proper structure
# - Validates class names against existing bindings
# - Appends to wrangler.jsonc migrations array
# - Provides migration tag versioning
#
# Usage:
#   ./migration-generator.sh
#   ./migration-generator.sh --interactive  # Interactive mode (default)
#   ./migration-generator.sh --new MyDO     # Quick new class migration
#
# Migration Types:
#   new      - Add new Durable Object class (new_sqlite_classes)
#   rename   - Rename existing class (renamed_classes)
#   delete   - Delete class (deleted_classes)
#   transfer - Transfer class to another script (transferred_classes)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="wrangler.jsonc"
BACKUP_FILE="wrangler.jsonc.bak"
INTERACTIVE_MODE=true

# ============================================================================
# Helper Functions
# ============================================================================

error() {
  echo -e "${RED}❌ ERROR: $1${NC}" >&2
  exit 1
}

warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}" >&2
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

prompt() {
  echo -e "${CYAN}$1${NC}"
}

header() {
  echo ""
  echo "=================================================="
  echo "$1"
  echo "=================================================="
  echo ""
}

# ============================================================================
# Parse Arguments
# ============================================================================

parse_args() {
  if [[ $# -eq 0 ]]; then
    INTERACTIVE_MODE=true
    return
  fi

  case $1 in
    --interactive)
      INTERACTIVE_MODE=true
      ;;
    --new)
      if [[ $# -lt 2 ]]; then
        error "Usage: $0 --new <ClassName>"
      fi
      INTERACTIVE_MODE=false
      MIGRATION_TYPE="new"
      CLASS_NAME="$2"
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --interactive        Interactive mode (default)"
      echo "  --new <ClassName>    Quick new class migration"
      echo "  --help               Show this help message"
      echo ""
      echo "Migration Types:"
      echo "  new      Add new Durable Object class"
      echo "  rename   Rename existing class"
      echo "  delete   Delete class"
      echo "  transfer Transfer class to another script"
      exit 0
      ;;
    *)
      error "Unknown option: $1. Use --help for usage."
      ;;
  esac
}

# ============================================================================
# Validation Functions
# ============================================================================

validate_prerequisites() {
  # Check for wrangler.jsonc
  if [[ ! -f "$CONFIG_FILE" ]]; then
    error "wrangler.jsonc not found. Create it first."
  fi

  # Check for jq
  if ! command -v jq &> /dev/null; then
    error "jq is required. Install: brew install jq"
  fi

  # Validate JSON syntax
  if ! grep -v '^\s*//' "$CONFIG_FILE" | jq '.' &> /dev/null; then
    error "Invalid JSON/JSONC syntax in $CONFIG_FILE"
  fi
}

get_existing_classes() {
  grep -v '^\s*//' "$CONFIG_FILE" | jq -r '.durable_objects.bindings[]?.class_name // empty' 2>/dev/null || echo ""
}

get_existing_migrations() {
  grep -v '^\s*//' "$CONFIG_FILE" | jq -r '.migrations // [] | length' 2>/dev/null || echo "0"
}

get_next_tag() {
  local count
  count=$(get_existing_migrations)
  echo "v$((count + 1))"
}

# ============================================================================
# Interactive Prompts
# ============================================================================

prompt_migration_type() {
  header "Select Migration Type"

  echo "1) New class       (new_sqlite_classes)"
  echo "2) Rename class    (renamed_classes)"
  echo "3) Delete class    (deleted_classes)"
  echo "4) Transfer class  (transferred_classes)"
  echo ""

  read -p "Enter choice [1-4]: " choice

  case $choice in
    1) MIGRATION_TYPE="new" ;;
    2) MIGRATION_TYPE="rename" ;;
    3) MIGRATION_TYPE="delete" ;;
    4) MIGRATION_TYPE="transfer" ;;
    *) error "Invalid choice: $choice" ;;
  esac

  success "Selected migration type: $MIGRATION_TYPE"
}

prompt_class_name() {
  local prompt_text="$1"

  echo ""
  prompt "$prompt_text"

  # Show existing classes
  local existing_classes
  existing_classes=$(get_existing_classes)
  if [[ -n "$existing_classes" ]]; then
    info "Existing classes:"
    while IFS= read -r class; do
      echo "  - $class"
    done <<< "$existing_classes"
    echo ""
  fi

  read -p "Class name: " CLASS_NAME

  if [[ -z "$CLASS_NAME" ]]; then
    error "Class name cannot be empty"
  fi

  # Validate PascalCase
  if [[ ! "$CLASS_NAME" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
    warning "Class name should be PascalCase (e.g., MyDurableObject)"
  fi
}

prompt_rename_details() {
  prompt_class_name "Enter old class name:"
  OLD_CLASS_NAME="$CLASS_NAME"

  prompt_class_name "Enter new class name:"
  NEW_CLASS_NAME="$CLASS_NAME"
}

prompt_transfer_details() {
  prompt_class_name "Enter class name to transfer:"

  echo ""
  prompt "Enter destination script name:"
  read -p "Script name: " SCRIPT_NAME

  if [[ -z "$SCRIPT_NAME" ]]; then
    error "Script name cannot be empty"
  fi
}

prompt_migration_tag() {
  local next_tag
  next_tag=$(get_next_tag)

  echo ""
  prompt "Enter migration tag (default: $next_tag):"
  read -p "Tag: " MIGRATION_TAG

  if [[ -z "$MIGRATION_TAG" ]]; then
    MIGRATION_TAG="$next_tag"
  fi

  success "Migration tag: $MIGRATION_TAG"
}

# ============================================================================
# Migration Generation
# ============================================================================

generate_new_migration() {
  cat << EOF
{
  "tag": "$MIGRATION_TAG",
  "new_sqlite_classes": ["$CLASS_NAME"]
}
EOF
}

generate_rename_migration() {
  cat << EOF
{
  "tag": "$MIGRATION_TAG",
  "renamed_classes": [
    {
      "from": "$OLD_CLASS_NAME",
      "to": "$NEW_CLASS_NAME"
    }
  ]
}
EOF
}

generate_delete_migration() {
  cat << EOF
{
  "tag": "$MIGRATION_TAG",
  "deleted_classes": ["$CLASS_NAME"]
}
EOF
}

generate_transfer_migration() {
  cat << EOF
{
  "tag": "$MIGRATION_TAG",
  "transferred_classes": [
    {
      "from": "$CLASS_NAME",
      "from_script": "$(basename "$(pwd)")",
      "to_script": "$SCRIPT_NAME"
    }
  ]
}
EOF
}

generate_migration_json() {
  case $MIGRATION_TYPE in
    new)      generate_new_migration ;;
    rename)   generate_rename_migration ;;
    delete)   generate_delete_migration ;;
    transfer) generate_transfer_migration ;;
    *)        error "Unknown migration type: $MIGRATION_TYPE" ;;
  esac
}

# ============================================================================
# Config File Update
# ============================================================================

backup_config() {
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  success "Backed up $CONFIG_FILE to $BACKUP_FILE"
}

append_migration() {
  local migration_json="$1"

  # Read current config (strip comments)
  local config
  config=$(grep -v '^\s*//' "$CONFIG_FILE")

  # Check if migrations array exists
  local has_migrations
  has_migrations=$(echo "$config" | jq 'has("migrations")' 2>/dev/null || echo "false")

  if [[ "$has_migrations" == "false" ]]; then
    # Create migrations array
    config=$(echo "$config" | jq --argjson migration "$migration_json" '. + {migrations: [$migration]}')
  else
    # Append to existing migrations array
    config=$(echo "$config" | jq --argjson migration "$migration_json" '.migrations += [$migration]')
  fi

  # Write back to file (preserve formatting)
  echo "$config" | jq '.' > "$CONFIG_FILE"

  success "Migration added to $CONFIG_FILE"
}

# ============================================================================
# Display and Confirmation
# ============================================================================

display_migration() {
  local migration_json="$1"

  header "Generated Migration"

  echo "$migration_json" | jq '.'
  echo ""
}

confirm_action() {
  echo ""
  prompt "Add this migration to $CONFIG_FILE? [y/N]"
  read -p "> " confirm

  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    warning "Migration cancelled"
    exit 0
  fi
}

# ============================================================================
# Post-Migration Instructions
# ============================================================================

show_instructions() {
  header "Migration Added Successfully! 🎉"

  echo "Next steps:"
  echo ""

  case $MIGRATION_TYPE in
    new)
      echo "1. Export the new Durable Object class in your Worker:"
      echo "   export class $CLASS_NAME extends DurableObject { ... }"
      echo ""
      echo "2. Add binding to wrangler.jsonc:"
      echo "   \"durable_objects\": {"
      echo "     \"bindings\": ["
      echo "       { \"name\": \"$(echo "$CLASS_NAME" | tr '[:lower:]' '[:upper:]')\", \"class_name\": \"$CLASS_NAME\" }"
      echo "     ]"
      echo "   }"
      echo ""
      echo "3. Deploy:"
      echo "   wrangler deploy"
      ;;

    rename)
      echo "1. Rename the class in your Worker:"
      echo "   export class $NEW_CLASS_NAME extends DurableObject { ... }"
      echo ""
      echo "2. Update binding in wrangler.jsonc:"
      echo "   Change class_name from \"$OLD_CLASS_NAME\" to \"$NEW_CLASS_NAME\""
      echo ""
      echo "3. Deploy:"
      echo "   wrangler deploy"
      echo ""
      warning "Existing DO instances will continue using old class name internally"
      ;;

    delete)
      echo "1. Remove the class from your Worker"
      echo ""
      echo "2. Remove binding from wrangler.jsonc"
      echo ""
      echo "3. Deploy:"
      echo "   wrangler deploy"
      echo ""
      warning "All data in deleted DOs will be permanently lost!"
      ;;

    transfer)
      echo "1. Move class to destination script: $SCRIPT_NAME"
      echo ""
      echo "2. Update bindings in both scripts"
      echo ""
      echo "3. Deploy both scripts:"
      echo "   wrangler deploy (this script)"
      echo "   wrangler deploy --name $SCRIPT_NAME"
      echo ""
      info "DO instances will be accessible from new script"
      ;;
  esac

  echo ""
  echo "Verify migration:"
  echo "  cat $CONFIG_FILE"
  echo ""
  echo "Rollback (if needed):"
  echo "  cp $BACKUP_FILE $CONFIG_FILE"
  echo ""

  success "Migration configuration complete!"
}

# ============================================================================
# Main Function
# ============================================================================

main() {
  parse_args "$@"

  header "Durable Objects Migration Generator"

  validate_prerequisites

  if [[ "$INTERACTIVE_MODE" == "true" ]]; then
    prompt_migration_type

    case $MIGRATION_TYPE in
      new)
        prompt_class_name "Enter new class name:"
        ;;
      rename)
        prompt_rename_details
        ;;
      delete)
        prompt_class_name "Enter class name to delete:"
        ;;
      transfer)
        prompt_transfer_details
        ;;
    esac

    prompt_migration_tag
  else
    # Non-interactive: use provided values
    MIGRATION_TAG=$(get_next_tag)
  fi

  # Generate migration JSON
  MIGRATION_JSON=$(generate_migration_json)

  # Display for review
  display_migration "$MIGRATION_JSON"

  if [[ "$INTERACTIVE_MODE" == "true" ]]; then
    confirm_action
  fi

  # Backup and update config
  backup_config
  append_migration "$MIGRATION_JSON"

  # Show next steps
  show_instructions
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"
