#!/bin/bash
# Consultation Log Parser
# Parse and display AI consultation history from ~/.claude/ai-consultations/consultations.log

LOG_FILE="$HOME/.claude/ai-consultations/consultations.log"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "No consultation log found at: $LOG_FILE"
  echo ""
  echo "Consultations will be logged automatically when you use:"
  echo "  /consult-gemini"
  echo "  /consult-codex"
  echo "  /consult-claude"
  exit 0
fi

# Parse command-line arguments
SHOW_ALL=false
FILTER_AI=""
FILTER_PROJECT=""
SHOW_SUMMARY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --all|-a)
      SHOW_ALL=true
      shift
      ;;
    --ai)
      FILTER_AI="$2"
      shift 2
      ;;
    --project|-p)
      FILTER_PROJECT="$2"
      shift 2
      ;;
    --summary|-s)
      SHOW_SUMMARY=true
      shift
      ;;
    --help|-h)
      echo "Usage: consultation-log-parser.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --all, -a           Show all consultations (default: last 10)"
      echo "  --ai <name>         Filter by AI (gemini|codex|claude-subagent)"
      echo "  --project, -p <dir> Filter by project directory"
      echo "  --summary, -s       Show summary statistics only"
      echo "  --help, -h          Show this help message"
      echo ""
      echo "Examples:"
      echo "  consultation-log-parser.sh                    # Last 10 consultations"
      echo "  consultation-log-parser.sh --all              # All consultations"
      echo "  consultation-log-parser.sh --ai gemini        # Only Gemini consultations"
      echo "  consultation-log-parser.sh --summary          # Summary statistics"
      echo "  consultation-log-parser.sh -p ~/my-project    # Consultations for specific project"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Apply filters
FILTERED_LOG="$LOG_FILE"

if [ -n "$FILTER_AI" ]; then
  FILTERED_LOG=$(mktemp)
  grep ",$FILTER_AI," "$LOG_FILE" > "$FILTERED_LOG"
fi

if [ -n "$FILTER_PROJECT" ]; then
  TEMP_LOG=$(mktemp)
  grep ",$FILTER_PROJECT" "$FILTERED_LOG" > "$TEMP_LOG"
  FILTERED_LOG="$TEMP_LOG"
fi

# Show summary if requested
if [ "$SHOW_SUMMARY" = true ]; then
  echo "=== AI Consultation Summary ==="
  echo ""

  # Total consultations
  TOTAL=$(wc -l < "$FILTERED_LOG")
  echo "Total consultations: $TOTAL"
  echo ""

  # By AI
  echo "By AI:"
  awk -F',' '{print $2}' "$FILTERED_LOG" | sort | uniq -c | sort -rn | while read count ai; do
    echo "  $ai: $count"
  done
  echo ""

  # By model
  echo "By model:"
  awk -F',' '{print $3}' "$FILTERED_LOG" | sort | uniq -c | sort -rn | while read count model; do
    echo "  $model: $count"
  done
  echo ""

  # Total cost
  TOTAL_COST=$(awk -F',' '{sum+=$6} END {printf "%.2f", sum}' "$FILTERED_LOG")
  echo "Total cost: \$$TOTAL_COST"
  echo ""

  # Total tokens
  INPUT_TOKENS=$(awk -F',' '{sum+=$4} END {print sum}' "$FILTERED_LOG")
  OUTPUT_TOKENS=$(awk -F',' '{sum+=$5} END {print sum}' "$FILTERED_LOG")
  echo "Total tokens:"
  echo "  Input: $INPUT_TOKENS"
  echo "  Output: $OUTPUT_TOKENS"
  echo "  Combined: $((INPUT_TOKENS + OUTPUT_TOKENS))"

  exit 0
fi

# Show consultations
echo "=== AI Consultation Log ==="
echo ""

# Determine how many to show
if [ "$SHOW_ALL" = true ]; then
  LINES=$(wc -l < "$FILTERED_LOG")
else
  LINES=10
fi

# Format and display
echo "Showing last $LINES consultation(s):"
echo ""

tail -n "$LINES" "$FILTERED_LOG" | while IFS=',' read -r timestamp ai model input_tokens output_tokens cost project; do
  # Format timestamp
  DATE=$(date -d "$timestamp" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$timestamp")

  # Format cost
  COST_FORMATTED=$(printf "%.4f" "$cost")

  # Format tokens
  TOTAL_TOKENS=$((input_tokens + output_tokens))

  # Get project name (basename)
  PROJECT_NAME=$(basename "$project")

  # Color by AI (if terminal supports it)
  if [ -t 1 ]; then
    case "$ai" in
      gemini)
        AI_COLOR="\033[1;35m" # Magenta
        ;;
      codex)
        AI_COLOR="\033[1;36m" # Cyan
        ;;
      claude-subagent)
        AI_COLOR="\033[1;33m" # Yellow
        ;;
      *)
        AI_COLOR="\033[1;37m" # White
        ;;
    esac
    RESET_COLOR="\033[0m"
  else
    AI_COLOR=""
    RESET_COLOR=""
  fi

  # Display
  echo -e "${AI_COLOR}[$DATE] $ai ($model)${RESET_COLOR}"
  echo "  Project: $PROJECT_NAME"
  echo "  Tokens: ${input_tokens} in + ${output_tokens} out = ${TOTAL_TOKENS} total"
  echo "  Cost: \$${COST_FORMATTED}"
  echo ""
done

# Show summary at bottom
TOTAL=$(wc -l < "$FILTERED_LOG")
if [ "$TOTAL" -gt "$LINES" ]; then
  echo "---"
  echo "Showing $LINES of $TOTAL consultations"
  echo "Use --all to show all consultations"
fi

# Clean up temp files
if [ -n "$TEMP_LOG" ]; then
  rm -f "$TEMP_LOG"
fi
if [ "$FILTERED_LOG" != "$LOG_FILE" ]; then
  rm -f "$FILTERED_LOG"
fi
