# Multi-AI Consultant Commands Reference

Complete reference for all slash commands and their usage.

---

## Commands Overview

| Command | AI | Use When | Cost | Speed |
|---------|----|-----------| -----|-------|
| `/consult-gemini` | Gemini 2.5 Pro | Web research, latest docs, extended thinking | ~$0.10-0.50 | Slower |
| `/consult-codex` | OpenAI GPT-4 | Repo-aware analysis, code review | ~$0.05-0.30 | Medium |
| `/consult-claude` | Fresh Claude | Quick second opinion, budget-friendly | Free | Fast |
| `/consult-ai` | Router | Unsure which AI to use | Varies | Varies |

---

## /consult-gemini [question]

Consult Gemini 2.5 Pro with web search, extended thinking, and grounding.

### Use When

- Need web research for latest documentation
- Require extended thinking for complex reasoning
- Security concerns need validation with current standards
- Architectural decisions require latest best practices
- Grounding/fact-checking is important

### Syntax

```
/consult-gemini [question]
```

### Examples

```
/consult-gemini Is this JWT validation secure by 2025 standards?

/consult-gemini What's the recommended React 19 pattern for this data fetching scenario?

/consult-gemini Latest best practices for microservices architecture?
```

### How It Works

1. **Pre-flight check**: Verifies Gemini CLI is installed and API key is valid
2. **Smart context selection**: Based on problem type (bug, architecture, security)
   - Bug: Buggy file + direct imports only
   - Architecture: Relevant directories (not entire repo)
   - Security: Security-related files + config
3. **Execute command**:
   ```bash
   gemini -p "[question]" --model gemini-2.5-pro --thinking --google-search --grounding @path/to/context
   ```
4. **Parse JSON response**: Extract answer from Gemini's JSON output
5. **Synthesize**: Present 5-part comparison (My Analysis → Other AI → Differences → Synthesis → Recommendation)
6. **Log cost**: Append to `~/.claude/ai-consultations/consultations.log`

### Configuration

**Locked config** (cannot be changed):
- Model: `gemini-2.5-pro` (latest)
- Thinking mode: Enabled
- Google Search: Enabled
- Grounding: Enabled

### Context Selection

Uses `@<path>` syntax for selective context:

```bash
# Bug context (minimal)
@src/auth/session.ts @src/middleware/jwt.ts

# Architecture context (relevant directories)
@src/components/ @src/hooks/ @src/lib/

# Security context (security + config)
@src/auth/ @src/middleware/ @.env.example @wrangler.toml
```

### System Instructions

Auto-loads `GEMINI.md` from project root (if present). Enforces:
- 5-part response format (prevents parroting)
- Comparison with Claude's analysis
- Web search for latest docs
- Specific code references with line numbers
- No assumptions - verify everything

### Privacy

**Automatic protection**:
- Respects `.gitignore` (all files in `.gitignore` excluded)
- Respects `.geminiignore` (extra exclusions)

**Pre-consultation check**:
- Warns if sensitive file patterns detected
- Lists files being sent
- Asks permission before proceeding

**Sensitive patterns**:
- `.env*`, `*secret*`, `*credentials*`, `*password*`
- `*.key`, `*.pem`, `*.crt`
- `wrangler.toml`, `.dev.vars`

### Cost

**Pricing** (verify current rates at https://ai.google.dev/pricing):
- Input: ~$0.000015/token
- Output: ~$0.00006/token

**Typical consultation**:
- Bug: ~15k input + ~1k output = ~$0.25-0.35
- Architecture: ~20k input + ~1.5k output = ~$0.35-0.50
- Simple question: ~5k input + ~500 tokens = ~$0.08-0.12

### Exit Codes

- `0`: Success
- `1`: Gemini CLI error
- `2`: API key invalid
- `3`: JSON parsing failed (fallback to plain text)

---

## /consult-codex [question]

Consult OpenAI GPT-4 via Codex CLI with repo-aware analysis.

### Use When

- Need repo-wide consistency checks
- Code review across multiple files
- Impact assessment for changes
- Finding similar patterns in codebase
- Prefer OpenAI reasoning style

### Syntax

```
/consult-codex [question]
```

### Examples

```
/consult-codex Review this codebase for performance bottlenecks

/consult-codex Find all places where this authentication pattern is used

/consult-codex Check if this refactoring is consistent with existing code style
```

### How It Works

1. **Pre-flight check**: Verifies OpenAI API key is valid and Codex CLI installed
2. **Navigate to project**: `cd` to project directory (Codex scans automatically)
3. **Verify Git repo**: Warns if not in Git repo (safety feature)
4. **Execute command**:
   ```bash
   cd /path/to/project
   echo "[question]" | codex exec - -m gpt-4-turbo --yolo
   ```
5. **Parse output**: Extract response from temp file
6. **Synthesize**: Present 5-part comparison
7. **Log cost**: Estimate tokens and append to log

### Configuration

**Model**: `gpt-4-turbo` (default)

**Flags**:
- `--yolo`: Skip confirmation (required for non-interactive use)
- `--skip-git-repo-check`: Optional, use if not in Git repo

### Context Selection

**Automatic**: Codex scans entire directory (repo-aware)

**Respects**:
- `.gitignore` (excluded files never sent)
- Maximum context limits

**Warning**: Will warn if:
- Not in Git repo
- Large number of files (>1000)
- Total context >100k tokens

### System Instructions

Auto-loads from (in order):
1. `codex.md` in project root (project-specific)
2. `~/.codex/instructions.md` (global fallback)

**Enforces**:
- 5-part response format
- Repo-wide consistency checks
- Impact assessment for changes
- Specific file references with line numbers

### Privacy

**Automatic protection**:
- Respects `.gitignore`
- Warns if not in Git repo (suggests initializing)

**Pre-consultation check**:
- Lists number of files being sent
- Estimates total tokens
- Asks permission before proceeding

### Cost

**Pricing** (verify current rates at https://openai.com/pricing):
- Input: ~$0.00001/token (GPT-4 Turbo)
- Output: ~$0.00003/token

**Typical consultation**:
- Single file review: ~2k input + ~500 output = ~$0.03-0.05
- Repo-wide analysis: ~10k input + ~1k output = ~$0.10-0.15
- Architecture review: ~15k input + ~1.5k output = ~$0.15-0.25

### Exit Codes

- `0`: Success
- `1`: Codex CLI error
- `2`: API key invalid
- `3`: Not in Git repo (can be overridden)

### Common Issues

**"Waiting for approval"**: Use `--yolo` flag (slash command includes this by default)

**"Not in Git repo"**: Add `--skip-git-repo-check` flag or initialize Git repo

---

## /consult-claude [question]

Consult a fresh Claude subagent for second opinion (free, fast).

### Use When

- Quick second opinion needed
- Budget-friendly option required
- Fresh perspective (no conversation history bias)
- Sanity check on logic
- No web research needed

### Syntax

```
/consult-claude [question]
```

### Examples

```
/consult-claude Am I missing something obvious in this state management bug?

/consult-claude Quick sanity check - is this approach reasonable?

/consult-claude Second opinion on this refactoring idea
```

### How It Works

1. **Gather context**: Use Read tool to load relevant files
2. **Build detailed prompt**: Include Claude's analysis + user question + context
3. **Launch Task tool**: Create general-purpose subagent
4. **Receive fresh perspective**: Subagent analyzes with no prior conversation history
5. **Synthesize**: Present 5-part comparison
6. **Log consultation**: Track usage (free, but logged)

### Context Selection

**Manual**: You read files and pass inline

```bash
# Read relevant files first
Read src/auth/session.ts
Read src/middleware/jwt.ts

# Then consult with inline context
/consult-claude [question] with context from session.ts and jwt.ts
```

### Advantages

- **Free**: No API cost (uses same Claude Code session)
- **Fast**: No external API calls
- **Same capabilities**: Can use Read, Grep, Edit, etc.
- **Fresh perspective**: No conversation history bias

### Limitations

- **No web search**: Can't access latest documentation
- **No extended thinking**: Standard Claude reasoning
- **Same knowledge cutoff**: No access to information after training

### System Instructions

Uses standard Claude Code capabilities:
- Read, Grep, Glob for code analysis
- Edit, Write for modifications
- Bash for running commands

### Privacy

- **No external transmission**: Everything stays local
- No additional privacy concerns beyond normal Claude Code usage

### Cost

**Free** - uses existing Claude Code session

**Logged for tracking**:
- Timestamp
- AI: `claude-subagent`
- Model: `claude-sonnet-4-5`
- Tokens: 0 (free tier)
- Cost: $0.00

---

## /consult-ai [question]

Router command that recommends which AI to use based on question type.

### Use When

- Unsure which AI is best for the question
- Want recommendation based on needs
- First time using multi-ai-consultant

### Syntax

```
/consult-ai [question]
```

### Examples

```
/consult-ai How should we structure this microservices architecture?
→ Recommends Gemini (needs web research for latest patterns)

/consult-ai Review this codebase for consistency
→ Recommends Codex (repo-aware analysis)

/consult-ai Quick sanity check on this approach
→ Recommends Fresh Claude (fast, free, sufficient)
```

### How It Works

1. **Analyze problem type**: Categorize question (bug, architecture, security, code review, etc.)
2. **Assess requirements**:
   - Need web research? → Gemini
   - Need repo-aware? → Codex
   - Need budget-friendly? → Fresh Claude
   - Need extended thinking? → Gemini
   - Need fresh perspective? → Fresh Claude
3. **Recommend AI**: Present recommendation with reasoning
4. **Ask user to choose**: User approves or selects different AI
5. **Route to command**: Internally executes chosen command

### Decision Factors

| Need | Recommended AI | Reason |
|------|----------------|---------|
| Web research | Gemini | Google Search enabled |
| Latest docs | Gemini | Can search current documentation |
| Extended thinking | Gemini | Complex multi-step reasoning |
| Repo-aware | Codex | Auto-scans entire directory |
| Consistency check | Codex | Cross-file analysis |
| Code review | Codex | Pattern recognition across files |
| Budget-friendly | Fresh Claude | Free |
| Quick opinion | Fresh Claude | Fast, no API cost |
| Fresh perspective | Fresh Claude | No conversation history |

### Example Routing

**Architecture question**:
```
User: /consult-ai How should we structure our API routes?

Claude: "Analyzing question... Recommends Gemini for:
- Need to research latest REST/GraphQL patterns
- May require web search for current best practices
- Extended thinking for trade-off analysis

Should I consult Gemini, or would you prefer Codex (repo-aware) or Fresh Claude (free)?"

User: "Gemini"

Claude: [Internally executes /consult-gemini How should we structure our API routes?]
```

---

## Cost Tracking

All consultations are automatically logged for cost tracking and analysis.

### Log Location

```
~/.claude/ai-consultations/consultations.log
```

### Log Format

CSV format with the following columns:
```
timestamp,ai,model,input_tokens,output_tokens,cost,project_path
```

### Example Entries

```csv
2025-11-07T14:23:45-05:00,gemini,gemini-2.5-pro,15420,850,0.1834,/Users/name/projects/my-app
2025-11-07T15:10:22-05:00,codex,gpt-4-turbo,8230,430,0.0952,/Users/name/projects/my-app
2025-11-07T16:05:11-05:00,claude-subagent,claude-sonnet-4-5,0,0,0.00,/Users/name/projects/my-app
```

### Viewing Logs

**Using consultation-log-parser.sh** (if installed):

```bash
# Last 10 consultations
consultation-log-parser.sh

# All consultations
consultation-log-parser.sh --all

# Summary only
consultation-log-parser.sh --summary
# Output:
# Total consultations: 47
# Gemini: 23 ($4.25), Codex: 12 ($1.85), Fresh Claude: 12 ($0.00)
# Total cost: $6.10

# Filter by AI
consultation-log-parser.sh --ai gemini
consultation-log-parser.sh --ai codex
consultation-log-parser.sh --ai claude
```

**Manual viewing**:

```bash
# View entire log
cat ~/.claude/ai-consultations/consultations.log

# Last 10 entries
tail -10 ~/.claude/ai-consultations/consultations.log

# Filter by date
grep "2025-11-07" ~/.claude/ai-consultations/consultations.log

# Calculate total cost (requires awk)
awk -F, '{sum+=$6} END {print "Total: $" sum}' ~/.claude/ai-consultations/consultations.log
```

### Cost Calculation

**Gemini pricing** (verify at https://ai.google.dev/pricing):
- Input: ~$0.000015/token
- Output: ~$0.00006/token

**OpenAI pricing** (verify at https://openai.com/pricing):
- Input: ~$0.00001/token
- Output: ~$0.00003/token

**Formula**:
```
cost = (input_tokens × input_price) + (output_tokens × output_price)
```

**Example** (Gemini):
```
15,420 input × $0.000015 = $0.2313
850 output × $0.00006 = $0.0510
Total = $0.2823 ≈ $0.28
```

### Budget Management

**Set spending limits**:
1. Check logs weekly: `consultation-log-parser.sh --summary`
2. Track cost per project
3. Use Fresh Claude for quick questions (free)
4. Use smart context selection (reduce token usage)

**Cost optimization**:
- Use specific files, not entire repo
- Start with Fresh Claude, upgrade if needed
- Combine multiple questions in one consultation

---

**Last Updated**: 2025-12-17
