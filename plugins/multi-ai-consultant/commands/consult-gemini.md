---
name: multi-ai-consultant:consult-gemini
description: Consult Google Gemini 3 Pro for second opinion with web research, extended thinking, and grounding. Use when need latest docs, architectural decisions, or security verification.
allowed-tools:
  - Bash
  - Read
---

# Consult Gemini 3 Pro

You are being asked to consult Google Gemini 3 Pro for a second opinion on a coding problem or architectural decision.

## Your Task

1. **Pre-flight Check**: Verify Gemini CLI is working
2. **Gather Context**: Determine what context to send (bug vs architecture)
3. **Build Prompt**: Create a clear, specific question with context
4. **Execute Consultation**: Call Gemini with locked configuration
5. **Parse Response**: Extract the analysis from JSON output
6. **Synthesize**: Compare Gemini's analysis with your own reasoning
7. **Present**: Show 5-part synthesis to user
8. **Log Cost**: Track tokens and cost

---

## Step 1: Pre-flight Check

```bash
# Test if Gemini CLI is working
if ! gemini -p "test" &>/dev/null 2>&1; then
  echo "❌ Gemini CLI not working"
  echo ""
  echo "Possible issues:"
  echo "1. Gemini CLI not installed: npm install -g @google/generative-ai-cli"
  echo "2. API key not set: export GEMINI_API_KEY='your-key-here'"
  echo "3. API key invalid: Check https://aistudio.google.com/apikey"
  echo ""
  echo "After fixing, try the consultation again."
  exit 1
fi
```

If pre-flight check fails, stop here and show the error message to the user.

---

## Step 2: Smart Context Selection

**For bug/error problems**:
- Include the specific file with the bug
- Include related files (imports, dependencies)
- Include error messages and stack traces
- Use `@path/to/file.ts` syntax

**For architecture decisions**:
- Include relevant source directories
- Include documentation if available
- Use `@src/` or `@path/to/feature/` syntax

**For general questions**:
- Use `@.` for entire codebase (if small)
- Or use `@src/` for source only

**Context size guidance**:
- Small bug: 1-3 files
- Architecture: 1-2 directories
- Full codebase: Only if <10k tokens estimated

---

## Step 3: Build Prompt

The prompt must include:
1. **Problem statement**: What's wrong or what decision is needed
2. **Question**: Specific question for Gemini
3. **Your analysis**: What you've tried or considered
4. **Context**: File paths using `@<path>` syntax

**Format**:
```
Problem: [Brief description]
Question: [Specific question]

I've tried: [Your attempts]
Current status: [What's happening now]

Context: @path/to/file1.ts @path/to/file2.ts
```

---

## Step 4: Execute Consultation

**Locked Configuration** (always use these flags):
```bash
gemini -m gemini-3-pro \
  --thinking \
  --google-search \
  --grounding \
  --output-format json
```

**Full command pattern**:
```bash
PROMPT=$(cat <<'EOF'
[Your formatted prompt here]
EOF
)

RESPONSE=$(echo "$PROMPT" | gemini \
  -m gemini-3-pro \
  --thinking \
  --google-search \
  --grounding \
  --output-format json 2>/dev/null)

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Gemini API call failed (exit code: $EXIT_CODE)"
  echo "Check your API key and internet connection"
  exit 1
fi
```

---

## Step 5: Parse Response

```bash
# Extract the analysis text
ANALYSIS=$(echo "$RESPONSE" | jq -r '.response.text')

# Extract token counts for cost tracking
INPUT_TOKENS=$(echo "$RESPONSE" | jq -r '.stats.inputTokens')
OUTPUT_TOKENS=$(echo "$RESPONSE" | jq -r '.stats.outputTokens')

# Check if parsing succeeded
if [ -z "$ANALYSIS" ] || [ "$ANALYSIS" == "null" ]; then
  echo "❌ Failed to parse Gemini response"
  echo "Raw response:"
  echo "$RESPONSE"
  exit 1
fi
```

---

## Step 6: Synthesize (5-Part Format)

You MUST compare Gemini's analysis with your own reasoning. DO NOT just parrot Gemini's response.

**Required sections**:

### 🤖 My Analysis
- Your original reasoning
- What you tried
- What you think the issue is
- Your proposed solution

### 💎 Gemini's Analysis
- Gemini's complete response
- Include their reasoning process
- Include any web research findings
- Include any grounding citations

### 🔍 Key Differences
- **Agreement**: Where you and Gemini align
- **Divergence**: Where you disagree (explain why)
- **Gemini's catch**: Things Gemini found that you missed
- **Your edge**: Things you considered that Gemini didn't
- **Web research value**: What Google Search added

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
# Calculate cost (Gemini 3 Pro pricing)
# Input: $0.000015/token, Output: $0.00006/token (example rates, verify current)
COST=$(echo "scale=4; ($INPUT_TOKENS * 0.000015) + ($OUTPUT_TOKENS * 0.00006)" | bc)

# Create log directory if needed
mkdir -p ~/.claude/ai-consultations

# Log consultation
echo "$(date -Iseconds),gemini,gemini-3-pro,$INPUT_TOKENS,$OUTPUT_TOKENS,$COST,$(pwd)" \
  >> ~/.claude/ai-consultations/consultations.log

# Show cost to user
echo ""
echo "---"
echo "Cost: \$$COST ($INPUT_TOKENS input + $OUTPUT_TOKENS output tokens)"
echo "Consultation logged: ~/.claude/ai-consultations/consultations.log"
```

---

## Privacy & Security

**Always respect**:
- `.gitignore` (automatically excluded by Gemini CLI)
- `.geminiignore` (if present in project root)

**Never send**:
- `.env*` files
- `*secret*` files
- `*credentials*` files
- `node_modules/`
- Build artifacts

**If user has sensitive files in context**: Warn before sending and ask permission.

---

## Error Handling

**Common errors**:
1. **API key invalid**: Show how to set `GEMINI_API_KEY`
2. **Context too large**: Suggest narrowing context
3. **JSON parsing fails**: Fall back to plain text output
4. **Rate limit**: Suggest waiting 60 seconds
5. **Network error**: Check internet connection

**Always**:
- Check exit codes
- Validate JSON before parsing
- Provide helpful error messages
- Show how to fix the issue

---

## Example Usage

**Scenario**: JWT authentication bug

**Prompt**:
```
Problem: 401 error on /login route after token refresh
Question: Is the JWT validation logic correct?

I've tried: Updating token expiry check in src/auth/session.ts:47
Current status: Now getting "invalid signature" error instead of 401

Context: @src/auth/session.ts @src/middleware/jwt.ts
```

**Gemini might find**: Using `process.env.JWT_SECRET` instead of `env.JWT_SECRET` (Cloudflare Workers specific)

**Your synthesis would**:
- Acknowledge you focused on timing issues
- Highlight Gemini caught the env binding issue
- Note Gemini's web search found recent Cloudflare docs
- Recommend fixing env binding + adding database update
- Ask user permission to proceed

---

## Remember

- ✅ Always use locked config (gemini-3-pro with all flags)
- ✅ Always synthesize (don't parrot)
- ✅ Always log cost
- ✅ Always ask permission before implementing Gemini's suggestions
- ✅ Be honest about agreements and disagreements
- ❌ Never skip pre-flight check
- ❌ Never send sensitive files
- ❌ Never assume Gemini is always right

---

**After consultation**: Present synthesis and wait for user approval before implementing any changes.
