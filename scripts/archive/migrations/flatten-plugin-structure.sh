#!/usr/bin/env bash
#
# flatten-plugin-structure.sh
#
# Migrates nested plugin structure to flat structure
# From: plugins/category/skills/skill-name/
# To:   plugins/skill-name/
#
# This fixes skill discovery issues where Claude Code expects flat plugin structure

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
VERBOSE=false
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"

# Counters
MOVED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

# Usage information
usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Flatten nested plugin structure to fix skill discovery issues.

OPTIONS:
    -d, --dry-run       Show what would be done without making changes
    -v, --verbose       Show detailed output
    -h, --help          Show this help message

EXAMPLES:
    # Preview changes without executing
    $0 --dry-run

    # Run migration with verbose output
    $0 --verbose

    # Run migration
    $0

EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

    case $level in
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        DEBUG)
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
    esac
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log ERROR "Not in a git repository. This script must be run from the repository root."
        exit 1
    fi
}

# Check if we're in the correct directory
check_working_directory() {
    if [[ ! -d "plugins" ]]; then
        log ERROR "plugins/ directory not found. Please run this script from the repository root."
        exit 1
    fi

    if [[ ! -d ".claude-plugin" ]]; then
        log ERROR ".claude-plugin/ directory not found. Please run this script from the repository root."
        exit 1
    fi
}

# Find all nested skill directories
find_nested_skills() {
    find plugins -type d -path "plugins/*/skills/*" -mindepth 3 -maxdepth 3 | sort
}

# Check if target directory already exists
check_target_exists() {
    local target=$1
    if [[ -d "$target" ]]; then
        return 0
    else
        return 1
    fi
}

# Move a single skill directory
move_skill() {
    local source=$1
    local skill_name=$(basename "$source")
    local category_dir=$(dirname "$(dirname "$source")")  # plugins/category
    local target="plugins/$skill_name"
    local temp_target="${target}-temp-migration"

    log DEBUG "Processing: $source -> $target"

    # Check if this is a case where skill name matches category name
    if [[ -d "$target" && "$target" == "$category_dir" ]]; then
        # Special case: plugins/X/skills/X/ -> plugins/X/
        # Need to use temp location to avoid conflicts

        if [[ "$DRY_RUN" == "true" ]]; then
            log INFO "[DRY-RUN] Would move (via temp): $source -> $temp_target -> $target"
        else
            # Move to temp location
            if ! git mv "$source" "$temp_target" >> "$LOG_FILE" 2>&1; then
                log ERROR "Failed to move to temp: $source -> $temp_target"
                ((ERROR_COUNT++))
                return 1
            fi

            # The temp target now exists, will be moved later in a second pass
            log INFO "Moved to temp: $source -> $temp_target (will finalize after cleanup)"
            ((MOVED_COUNT++))
        fi
    else
        # Normal case: different names, can move directly

        # Check if target already exists
        if check_target_exists "$target"; then
            log WARN "Target already exists: $target (skipping $source)"
            ((SKIPPED_COUNT++))
            return 1
        fi

        # Perform the move
        if [[ "$DRY_RUN" == "true" ]]; then
            log INFO "[DRY-RUN] Would move: $source -> $target"
        else
            if git mv "$source" "$target" >> "$LOG_FILE" 2>&1; then
                log INFO "Moved: $source -> $target"
                ((MOVED_COUNT++))
            else
                log ERROR "Failed to move: $source"
                ((ERROR_COUNT++))
                return 1
            fi
        fi
    fi

    return 0
}

# Finalize temp moves - move from plugins/X-temp-migration/ to plugins/X/
finalize_temp_moves() {
    log INFO "Finalizing temporary moves..."

    # Find all temp directories
    while IFS= read -r temp_dir; do
        local final_target=${temp_dir%-temp-migration}
        local skill_name=$(basename "$final_target")

        if [[ "$DRY_RUN" == "true" ]]; then
            log INFO "[DRY-RUN] Would finalize: $temp_dir -> $final_target"
        else
            # Remove old category directory if it still exists and is empty/only has .claude-plugin
            if [[ -d "$final_target" ]]; then
                local has_other_content=$(find "$final_target" -mindepth 1 -maxdepth 1 ! -name ".claude-plugin" ! -name "skills" -print -quit)
                if [[ -z "$has_other_content" ]]; then
                    log DEBUG "Removing old category directory: $final_target"
                    rm -rf "$final_target" >> "$LOG_FILE" 2>&1
                fi
            fi

            # Move temp to final location
            if git mv "$temp_dir" "$final_target" >> "$LOG_FILE" 2>&1; then
                log INFO "Finalized: $temp_dir -> $final_target"
            else
                log ERROR "Failed to finalize: $temp_dir -> $final_target"
                ((ERROR_COUNT++))
            fi
        fi
    done < <(find plugins -mindepth 1 -maxdepth 1 -type d -name "*-temp-migration" | sort)
}

# Remove empty skills directories
cleanup_empty_dirs() {
    log INFO "Cleaning up empty directories..."

    # Find and remove empty skills/ directories
    while IFS= read -r dir; do
        if [[ -z "$(ls -A "$dir")" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log INFO "[DRY-RUN] Would remove empty directory: $dir"
            else
                if rmdir "$dir" >> "$LOG_FILE" 2>&1; then
                    log INFO "Removed empty directory: $dir"
                else
                    log WARN "Failed to remove directory: $dir"
                fi
            fi
        fi
    done < <(find plugins -type d -name "skills" | sort -r)

    # Find and remove empty category directories
    while IFS= read -r dir; do
        # Skip if it's the plugins directory itself
        if [[ "$dir" == "plugins" ]]; then
            continue
        fi

        # Check if directory is empty (only .claude-plugin or completely empty)
        local contents=$(find "$dir" -mindepth 1 -maxdepth 1 ! -name ".claude-plugin" -print -quit)
        if [[ -z "$contents" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log INFO "[DRY-RUN] Would remove empty category directory: $dir"
            else
                if rm -rf "$dir" >> "$LOG_FILE" 2>&1; then
                    log INFO "Removed empty category directory: $dir"
                else
                    log WARN "Failed to remove directory: $dir"
                fi
            fi
        fi
    done < <(find plugins -mindepth 1 -maxdepth 1 -type d | sort -r)
}

# Print summary
print_summary() {
    echo ""
    echo "======================================"
    echo "          Migration Summary           "
    echo "======================================"
    echo -e "${GREEN}Moved:${NC}   $MOVED_COUNT skills"
    echo -e "${YELLOW}Skipped:${NC} $SKIPPED_COUNT skills"
    echo -e "${RED}Errors:${NC}  $ERROR_COUNT skills"
    echo ""
    echo "Log file: $LOG_FILE"
    echo "======================================"
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}This was a DRY RUN. No changes were made.${NC}"
        echo "Run without --dry-run to perform the migration."
    else
        if [[ $ERROR_COUNT -eq 0 ]]; then
            echo -e "${GREEN}Migration completed successfully!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Run: ./scripts/generate-marketplace.sh"
            echo "2. Update scripts in scripts/ directory"
            echo "3. Update documentation (CLAUDE.md, PROJECT_STRUCTURE.md, README.md)"
            echo "4. Validate: find plugins -type d -name skills (should be empty)"
            echo "5. Commit changes with: git add -A && git commit"
        else
            echo -e "${RED}Migration completed with errors. Please review the log file.${NC}"
        fi
    fi
}

# Main execution
main() {
    log INFO "Starting plugin structure migration..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN MODE - No changes will be made"
    fi

    # Pre-flight checks
    check_git_repo
    check_working_directory

    # Find all nested skills
    log INFO "Finding nested skill directories..."
    nested_skills=()
    while IFS= read -r line; do
        nested_skills+=("$line")
    done < <(find_nested_skills)

    local total_skills=${#nested_skills[@]}
    log INFO "Found $total_skills nested skills to migrate"

    if [[ $total_skills -eq 0 ]]; then
        log INFO "No nested skills found. Structure may already be flat."
        exit 0
    fi

    # Confirm before proceeding (unless dry-run)
    if [[ "$DRY_RUN" == "false" ]]; then
        echo ""
        echo -e "${YELLOW}WARNING: This will move $total_skills skill directories${NC}"
        echo "This operation uses git mv to preserve history."
        echo ""
        read -p "Continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log INFO "Migration cancelled by user"
            exit 0
        fi
    fi

    # Process each nested skill
    log INFO "Processing skills..."
    for skill_dir in "${nested_skills[@]}"; do
        move_skill "$skill_dir"
    done

    # Finalize temporary moves (for skills with same name as category)
    finalize_temp_moves

    # Cleanup empty directories
    cleanup_empty_dirs

    # Print summary
    print_summary
}

# Run main function
main
