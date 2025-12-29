---
name: multi-ai-consultant:consult-codex
description: Consult OpenAI Codex (GPT 5.2) for repo-aware code analysis and OpenAI reasoning. Use when need general code review, refactoring suggestions, or different AI perspective.
allowed-tools:
  - Bash
---

# Consult OpenAI Codex

You are being asked to consult OpenAI's GPT 5.2 via the Codex CLI for a second opinion on a coding problem or architectural decision.

## Your Task

1. **Pre-flight Check**: Verify OpenAI API key is valid
2. **Navigate to Project**: Change to project directory (Codex is repo-aware)
3. **Build Prompt**: Create a clear, specific question
4. **Execute Consultation**: Call Codex with auto-approval flags
5. **Parse Response**: Read output from file
6. **Synthesize**: Compare Codex's analysis with your own reasoning
7. **Present**: Show 5-part synthesis to user
8. **Log Cost**: Track tokens and cost

---

## Step 1: Pre-flight Check

```bash
# Test if OpenAI API key is valid
if ! command -v openai &>/dev/null; then
  echo "⚠️  OpenAI CLI not installed (optional for pre-flight check)"
  echo "Attempting Codex consultation anyway..."
else
  if ! openai api models.list &>/dev/null 2>&1; then
    echo "❌ OpenAI API key not working"
    echo ""
    echo "Possible issues:"
    echo "1. API key not set: export OPENAI_API_KEY='sk-...'"
    echo "2. API key invalid: Check https://platform.openai.com/api-keys"
    echo ""
    echo "After fixing, try the consultation again."
    exit 1
  fi
fi

# Check if Codex CLI is installed
if ! command -v codex &>/dev/null; then
  echo "❌ Codex CLI not installed"
  echo ""
  echo "Install with: npm install -g codex"
  echo "Docs: https://www.npmjs.com/package/codex"
  echo ""
  exit 1
fi
```

If pre-flight check fails, stop here and show the error message to the user.

---

## Step 2: Navigate to Project

**Codex is repo-aware**: It automatically scans the current directory for context.

```bash
# Get current project directory
PROJECT_DIR=$(pwd)

# Ensure we're in the right place
echo "📂 Consulting on project: $PROJECT_DIR"
```

**Context behavior**:
- Codex reads all non-gitignored files in directory
- Respects `.gitignore` automatically
- No need for `@<path>` syntax
- Will warn if not in Git repo (can override with `--skip-git-repo-check`)

---

## Step 3: Build Prompt

The prompt must include:
1. **Problem statement**: What's wrong or what decision is needed
2. **Question**: Specific question for Codex
3. **Your analysis**: What you've tried or considered
4. **Note about codebase access**: Remind Codex it has access

**Format**:
```
Problem: [Brief description]
Question: [Specific question]

I've tried: [Your attempts]
Current status: [What's happening now]

(You have access to the codebase in this directory.)
```

**Note**: No need to specify files - Codex automatically has access to the repo.

---

## Step 4: Execute Consultation

**Required flags for non-interactive use**:
- `--yolo` OR `--dangerously-bypass-approvals-and-sandbox` OR `--full-auto`
- `--output-last-message /tmp/codex-response.txt`

**Recommended model**: `gpt-5.2` (latest)

**Full command pattern**:
```bash
PROMPT=$(cat <<'EOF'
[Your formatted prompt here]
EOF
)

# Create temp file for output
RESPONSE_FILE="/tmp/codex-response-$(date +%s).txt"

# Execute Codex (use --yolo to prevent hanging)
echo "$PROMPT" | codex exec - \
  -m gpt-5.2 \
  --yolo \
  --output-last-message "$RESPONSE_FILE" \
  --skip-git-repo-check

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Codex CLI failed (exit code: $EXIT_CODE)"
  echo "Check your API key and internet connection"
  exit 1
fi

# Read response
if [ ! -f "$RESPONSE_FILE" ] || [ ! -s "$RESPONSE_FILE" ]; then
  echo "❌ Codex response file is empty or missing"
  exit 1
fi

ANALYSIS=$(cat "$RESPONSE_FILE")

# Clean up
rm -f "$RESPONSE_FILE"
```

---

## Step 5: Token Estimation

**Note**: Codex CLI doesn't return token counts in output. Estimate for logging.

```bash
# Rough estimation (4 chars = 1 token)
INPUT_TOKENS=$(echo "$PROMPT" | wc -c | awk '{print int($1/4)}')
OUTPUT_TOKENS=$(echo "$ANALYSIS" | wc -c | awk '{print int($1/4)}')

# Add codebase size estimate
CODEBASE_SIZE=$(find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' | xargs wc -c 2>/dev/null | tail -1 | awk '{print int($1/4)}')
INPUT_TOKENS=$((INPUT_TOKENS + CODEBASE_SIZE))
```

---

## Step 6: Synthesize (5-Part Format)

You MUST compare Codex's analysis with your own reasoning. DO NOT just parrot Codex's response.

**Required sections**:

### 🤖 My Analysis
- Your original reasoning
- What you tried
- What you think the issue is
- Your proposed solution

### 🔷 Codex's Analysis
- Codex's complete response
- Include their reasoning
- Include specific file references if provided
- Note any code examples

### 🔍 Key Differences
- **Agreement**: Where you and Codex align
- **Divergence**: Where you disagree (explain why)
- **Codex's catch**: Things Codex found that you missed
- **Your edge**: Things you considered that Codex didn't
- **Repo-aware value**: What having full codebase access added

### ⚡ Synthesis
- Combine both perspectives
- Identify root cause (if bug)
- Weigh trade-offs (if architecture)
- Note any conflicting advice and why

### ✅ Recommended Action
- Specific, actionable next steps
- File paths and line numbers
- Expected outcome
- Risk assessment

**End with**: "Should I proceed with this approach?"

---

## Step 7: Log Cost

```bash
# Calculate cost (GPT 5.2 pricing)
# Input: $0.00001/token, Output: $0.00003/token (example rates, verify current)
COST=$(echo "scale=4; ($INPUT_TOKENS * 0.00001) + ($OUTPUT_TOKENS * 0.00003)" | bc)

# Create log directory if needed
mkdir -p ~/.claude/ai-consultations

# Log consultation
echo "$(date -Iseconds),codex,gpt-5.2,$INPUT_TOKENS,$OUTPUT_TOKENS,$COST,$(pwd)" \
  >> ~/.claude/ai-consultations/consultations.log

# Show cost to user
echo ""
echo "---"
echo "Cost: \$$COST (~$INPUT_TOKENS input + $OUTPUT_TOKENS output tokens, estimated)"
echo "Consultation logged: ~/.claude/ai-consultations/consultations.log"
echo "Note: Codex doesn't return exact token counts, these are estimates"
```

---

## Privacy & Security

**Always respect**:
- `.gitignore` (automatically excluded by Codex CLI)
- Git repo structure (Codex is Git-aware)

**Never send**:
- `.env*` files
- `*secret*` files
- `*credentials*` files
- `node_modules/` (auto-excluded)
- Build artifacts

**Codex warnings**:
- Codex will warn if not in Git repo (safety feature)
- Use `--skip-git-repo-check` to override if needed
- This prevents accidentally sending untracked sensitive files

---

## Error Handling

**Common errors**:
1. **API key invalid**: Show how to set `OPENAI_API_KEY`
2. **CLI hangs**: ALWAYS use `--yolo` flag (critical!)
3. **Not in Git repo**: Add `--skip-git-repo-check` if appropriate
4. **Response file empty**: Check API call succeeded
5. **Network error**: Check internet connection

**Always**:
- Check exit codes
- Verify response file exists and has content
- Provide helpful error messages
- Show how to fix the issue

---

## Codex vs Gemini

**When to use Codex instead of Gemini**:
- General code analysis (Codex is repo-aware automatically)
- Need OpenAI's reasoning style
- Already have OpenAI API key
- Want less setup (no context path specification)

**When to use Gemini instead**:
- Need web research (Google Search)
- Need thinking mode (extended reasoning)
- Need grounding (source verification)
- Want structured output validation
- Need specific file targeting (via `@<path>`)

---

## Example Usage

**Scenario**: React component rendering issue

**Prompt**:
```
Problem: Component re-rendering infinitely causing browser freeze
Question: What's causing the infinite loop?

I've tried: Adding useCallback to handler functions
Current status: Still re-rendering, React DevTools shows state updates

(You have access to the codebase in this directory.)
```

**Codex might find**: Missing dependency in useEffect, or comparing object references in useEffect dependency array

**Your synthesis would**:
- Acknowledge you focused on callbacks
- Highlight Codex caught the useEffect dependencies
- Note Codex's repo-wide analysis found similar patterns elsewhere
- Recommend fixing dependencies + adding eslint rule
- Ask user permission to proceed

---

## Remember

- ✅ Always use `--yolo` flag (prevents hanging)
- ✅ Always use `--output-last-message` (clean output)
- ✅ Always synthesize (don't parrot)
- ✅ Always log cost (even if estimated)
- ✅ Always ask permission before implementing Codex's suggestions
- ✅ Be honest about agreements and disagreements
- ❌ Never skip pre-flight check
- ❌ Never forget `--yolo` flag (CLI will hang!)
- ❌ Never assume Codex is always right

---

**After consultation**: Present synthesis and wait for user approval before implementing any changes.
