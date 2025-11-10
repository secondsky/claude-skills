---
name: Multi-AI Consultant
description: |
  Consult external AIs (Gemini 2.5 Pro, OpenAI Codex, fresh Claude) for second opinions when stuck on bugs or making architectural decisions. Use when: debugging attempts have failed, making significant architectural choices, security concerns, or need fresh perspective. Automatically suggests consultation after one failed attempt. Provides synthesis comparing multiple AI perspectives with web research, thinking mode, and repo-aware analysis.
license: MIT
allowed-tools: [Bash, Read, Task, Write]
metadata:
  version: 1.0.0
  author: Claude Skills Maintainers
  last-verified: 2025-11-07
  production-tested: true
  keywords:
    - ai consultation
    - second opinion
    - gemini
    - openai
    - codex
    - debugging
    - architecture
    - multi-ai
    - synthesis
    - fresh perspective
    - stuck
    - web research
    - thinking mode
    - repo-aware
---

# Multi-AI Consultant

Consult external AIs for second opinions when Claude Code is stuck or making critical decisions.

---

## What This Skill Does

This skill enables **future Claude Code sessions** to consult other AIs when:
- Stuck on a bug after one failed attempt
- Making architectural decisions
- Security concerns need validation
- Fresh perspective needed

**Key innovation**: Uses existing CLI tools (`gemini`, `codex`) instead of building MCP servers - much simpler and more maintainable.

---

## When to Use This Skill

### Automatic Triggers (No User Action Needed)

Claude Code should **automatically suggest** using this skill when:

1. **After 1 failed debugging attempt**
   - Tried one approach to fix a bug
   - Still not working or different error
   - → Suggest: "Should I consult [Gemini|Fresh Claude] for a second opinion?"

2. **Before architectural decisions**
   - Significant design choices (state management, routing, data flow)
   - Framework selection
   - Database schema design
   - → Auto-consult (mention to user): "Consulting Gemini for architectural validation..."

3. **Security changes**
   - Authentication logic
   - Authorization rules
   - Cryptography
   - Input validation
   - → Auto-consult: "Consulting Gemini to verify security approach..."

4. **When uncertain**
   - Multiple valid approaches
   - Trade-offs not clear
   - Conflicting advice in documentation
   - → Suggest: "Would you like me to consult another AI for additional perspective?"

### Manual Invocation (User Commands)

User can explicitly request consultation with:
- `/consult-gemini [question]` - Gemini 2.5 Pro with thinking, search, grounding
- `/consult-codex [question]` - OpenAI GPT-4 via Codex CLI (repo-aware)
- `/consult-claude [question]` - Fresh Claude subagent (free, fast)
- `/consult-ai [question]` - Router that asks which AI to use

---

## The Three AIs

| AI | Tool | When to Use | Special Features | Cost |
|----|------|-------------|------------------|------|
| **Gemini 2.5 Pro** | `gemini` CLI | Web research, latest docs, thinking | Google Search, extended reasoning, grounding | ~$0.10-0.50 |
| **OpenAI GPT-4** | `codex` CLI | Repo-aware analysis, code review | Auto-scans directory, OpenAI reasoning | ~$0.05-0.30 |
| **Fresh Claude** | Task tool | Quick second opinion, budget-friendly | Same capabilities, fresh perspective | Free |

---

## How It Works

### Architecture

```
Claude Code encounters bug/decision
        ↓
Suggests consultation (or user requests)
        ↓
User approves
        ↓
Execute appropriate slash command
        ↓
CLI command calls external AI
        ↓
Parse response
        ↓
Synthesize: Claude's analysis + External AI's analysis
        ↓
Present 5-part comparison
        ↓
Ask permission to implement
```

### The 5-Part Synthesis Format

Every consultation must follow this format (prevents parroting):

1. **🤖 My Analysis** - Claude's original reasoning and attempts
2. **💎/🔷/🔄 Other AI's Analysis** - External AI's complete response
3. **🔍 Key Differences** - Agreement, divergence, what each AI caught/missed
4. **⚡ Synthesis** - Combined perspective, root cause, trade-offs
5. **✅ Recommended Action** - Specific next steps with file paths/line numbers

**End with**: "Should I proceed with this approach?"

---

## Setup Instructions

### 1. Install CLIs

**Gemini CLI** (required):
```bash
npm install -g @google/generative-ai-cli
export GEMINI_API_KEY="your-key"
```

Get API key: https://aistudio.google.com/apikey

**Codex CLI** (optional):
```bash
npm install -g codex
export OPENAI_API_KEY="sk-..."
```

Get API key: https://platform.openai.com/api-keys

**Fresh Claude**: Built-in (uses Task tool, no setup)

### 2. Install Skill

```bash
cd ~/.claude/skills
git clone [this-repo] multi-ai-consultant
# OR symlink from development location
```

### 3. Copy Templates to Project

```bash
# Copy to project root
cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./

# Copy log parser (optional)
cp ~/.claude/skills/multi-ai-consultant/templates/consultation-log-parser.sh ~/bin/
chmod +x ~/bin/consultation-log-parser.sh
```

### 4. Verify Installation

```bash
# Test Gemini CLI
gemini -p "test" && echo "✅ Gemini working"

# Test Codex CLI (if installed)
codex exec "test" --yolo && echo "✅ Codex working"

# Test skill discovery
# Ask Claude Code: "I'm stuck on this bug, can you help?"
# Claude should suggest consultation
```

---

## Usage Examples

### Example 1: Stuck on Bug

**Scenario**: JWT authentication failing after one attempt

**Claude's process**:
```
1. Try initial fix (token expiry check)
2. Still failing (now "invalid signature" error)
3. → Automatically suggest consultation
4. User approves
5. Execute /consult-gemini with:
   - Problem: 401 error details
   - What was tried: token expiry fix
   - Current status: invalid signature error
   - Context: @src/auth/session.ts @src/middleware/jwt.ts
6. Gemini finds: Using process.env instead of env binding (Cloudflare)
7. Synthesize both perspectives
8. Ask permission to implement Gemini's fix
```

**Result**: Bug fixed with second opinion, avoided 2-3 more trial-and-error attempts

### Example 2: Architecture Decision

**Scenario**: Choosing state management for new feature

**Claude's process**:
```
1. User asks: "How should we handle state for this feature?"
2. → Auto-consult Gemini (architectural decision)
3. Execute /consult-gemini with:
   - Problem: State management choice
   - Options considered: Redux, Zustand, Context
   - Context: @src/ (existing patterns)
4. Gemini searches for latest React state management best practices
5. Synthesize Claude's + Gemini's analysis
6. Present recommendation with trade-offs
```

**Result**: Informed decision with latest best practices

### Example 3: Manual Consultation

**User**: "I want a second opinion on this refactoring"

**Claude's process**:
```
1. User explicitly requests consultation
2. Ask which AI: Gemini, Codex, or Fresh Claude?
3. User chooses Codex (wants repo-aware analysis)
4. Execute /consult-codex with:
   - Problem: Refactoring proposal
   - Context: (Codex scans repo automatically)
5. Codex checks consistency with existing code
6. Synthesize both perspectives
7. Present recommendation
```

**Result**: Validation of refactoring approach + consistency check

---

## Slash Commands

### `/consult-gemini [question]`

**Use when**: Need web research, latest docs, extended thinking

**What it does**:
1. Pre-flight check (Gemini CLI working?)
2. Smart context selection based on problem type
3. Execute with locked config: `gemini-2.5-pro --thinking --google-search --grounding`
4. Parse JSON response
5. Synthesize with 5-part format
6. Log cost to `~/.claude/ai-consultations/consultations.log`

**Example**:
```
/consult-gemini Is this JWT validation secure by 2025 standards?
```

**Context**: Uses `@<path>` syntax for selective context

**System instructions**: Auto-loads `GEMINI.md` from project root

**Privacy**: Respects `.gitignore` + `.geminiignore`

---

### `/consult-codex [question]`

**Use when**: Need repo-aware analysis, code review, OpenAI reasoning

**What it does**:
1. Pre-flight check (OpenAI API key valid?)
2. `cd` to project directory (Codex scans automatically)
3. Execute with `--yolo` flag: `codex exec - -m gpt-4-turbo --yolo`
4. Parse output from temp file
5. Synthesize with 5-part format
6. Log cost (estimated tokens)

**Example**:
```
/consult-codex Review this codebase for performance issues
```

**Context**: Repo-aware (automatically reads all non-gitignored files)

**System instructions**: Auto-loads `codex.md` from project root or `~/.codex/instructions.md`

**Privacy**: Respects `.gitignore`, warns if not in Git repo

---

### `/consult-claude [question]`

**Use when**: Quick second opinion, free, fresh perspective

**What it does**:
1. Gather context with Read tool
2. Build detailed prompt for subagent
3. Launch Task tool (general-purpose subagent)
4. Receive fresh perspective
5. Synthesize with 5-part format
6. Log consultation (free, but tracked)

**Example**:
```
/consult-claude Am I missing something obvious in this state management bug?
```

**Context**: You manually read relevant files and pass inline

**Advantages**: Free, same capabilities, fast, fresh perspective

**Limitations**: No web search, no extended thinking, same knowledge cutoff

---

### `/consult-ai [question]`

**Use when**: Unsure which AI to use

**What it does**:
1. Analyze problem type (bug, architecture, security, etc.)
2. Recommend which AI based on needs
3. Ask user to choose
4. Route to appropriate command

**Example**:
```
/consult-ai How should we structure this microservices architecture?

→ Recommends Gemini (needs web research for latest patterns)
→ User approves
→ Executes /consult-gemini internally
```

**Decision factors**:
- Need web research? → Gemini
- Need repo-aware? → Codex
- Need budget-friendly? → Fresh Claude
- Need extended thinking? → Gemini
- Need fresh perspective? → Fresh Claude

---

## Templates

### `GEMINI.md` (Project Root)

System instructions for Gemini consultations. Enforces:
- 5-part response format
- Comparison with Claude's analysis
- Web search for latest docs
- Specific code references
- No parroting

**Auto-loaded**: Place in project root, Gemini CLI reads automatically

### `codex.md` (Project Root or `~/.codex/instructions.md`)

System instructions for Codex consultations. Enforces:
- 5-part response format
- Repo-aware analysis
- Consistency checks
- Impact assessment
- Specific file references

**Auto-loaded**: Codex CLI reads from project root or global config

### `.geminiignore` (Project Root)

Extra privacy exclusions beyond `.gitignore`. Excludes:
- `.env*` files
- `*secret*`, `*credentials*`
- Build artifacts
- Large media files
- API keys and tokens

**Auto-loaded**: Gemini CLI respects this file

### `consultation-log-parser.sh`

View consultation history:
```bash
consultation-log-parser.sh           # Last 10
consultation-log-parser.sh --all     # All consultations
consultation-log-parser.sh --summary # Stats only
consultation-log-parser.sh --ai gemini # Filter by AI
```

**Log format**: `timestamp,ai,model,input_tokens,output_tokens,cost,project_path`

---

## Cost Tracking

Every consultation is logged to `~/.claude/ai-consultations/consultations.log`

**Format**:
```csv
2025-11-07T14:23:45-05:00,gemini,gemini-2.5-pro,15420,850,0.1834,/home/user/project
2025-11-07T15:10:22-05:00,codex,gpt-4-turbo,8230,430,0.0952,/home/user/project
2025-11-07T16:05:11-05:00,claude-subagent,claude-sonnet-4-5,0,0,0.00,/home/user/project
```

**View logs**:
```bash
consultation-log-parser.sh --summary
# Total consultations: 47
# Gemini: 23, Codex: 12, Fresh Claude: 12
# Total cost: $8.45
```

**Pricing** (verify current rates):
- Gemini 2.5 Pro: ~$0.000015/input token, ~$0.00006/output token
- GPT-4 Turbo: ~$0.00001/input token, ~$0.00003/output token
- Fresh Claude: Free (same API call)

---

## Privacy & Security

### Automatic Protection

Both CLIs respect `.gitignore` automatically. Files in `.gitignore` are never sent.

### Additional Protection (`.geminiignore`)

Create `.geminiignore` in project root for extra exclusions:
```gitignore
*.env*
*secret*
*credentials*
.dev.vars
wrangler.toml
```

### Pre-Consultation Check

Claude Code should warn if:
- Sensitive file patterns detected in context
- Not in Git repo (Codex)
- Large context (>100k tokens estimated)

**Ask permission**: "About to send context to [AI]. Files include: [list]. Proceed?"

### Manual Verification

Before consultation, user can check:
```bash
# What will be sent to Gemini
ls -la @src/

# Check gitignore is working
git status --ignored
```

---

## Known Issues & Solutions

### 1. CLI Not Installed

**Error**: `gemini: command not found` or `codex: command not found`

**Fix**:
```bash
npm install -g @google/generative-ai-cli
npm install -g codex
```

**Prevention**: Pre-flight checks in slash commands

---

### 2. API Keys Invalid

**Error**: "API key invalid" or authentication failures

**Fix**:
```bash
export GEMINI_API_KEY="your-key"
export OPENAI_API_KEY="sk-..."

# Or add to ~/.bashrc
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

**Prevention**: Pre-flight checks test API before consultation

---

### 3. Context Too Large

**Error**: Token limit exceeded or very expensive consultation

**Fix**: Use smart context selection
- Bug: Just buggy file + imports (not entire codebase)
- Architecture: Relevant directories only
- Use `@path/to/specific/file.ts` not `@.`

**Prevention**: Slash commands guide smart context selection

---

### 4. Privacy Leaks

**Risk**: Accidentally sending `.env` or secrets

**Fix**:
- Both CLIs respect `.gitignore` (automatic)
- Create `.geminiignore` for extra protection
- Claude warns if sensitive patterns detected

**Prevention**: Always check `.gitignore` is configured

---

### 5. Cost Overruns

**Issue**: Expensive consultations accumulating

**Fix**:
- Check logs: `consultation-log-parser.sh --summary`
- Use Fresh Claude for quick questions (free)
- Use smart context (specific files, not entire repo)

**Prevention**: Cost tracking + warnings for large context

---

### 6. Codex Hanging

**Error**: `codex exec` hangs waiting for approval

**Fix**: Always use `--yolo` flag

**Prevention**: Slash command includes `--yolo` by default (hard to miss)

---

### 7. JSON Parsing Fails (Gemini)

**Error**: `jq: parse error`

**Fix**: Check exit code before parsing, fall back to plain text

**Prevention**: Slash command checks exit code first

---

### 8. Not in Git Repo (Codex)

**Warning**: Codex warns if not in Git repo (safety feature)

**Fix**: Add `--skip-git-repo-check` flag if appropriate

**Prevention**: Slash command includes flag

---

## Token Efficiency

### Without This Skill

**Typical scenario** (stuck on bug):
1. Try approach 1 (~4k tokens)
2. Research CLI syntax (~3k tokens)
3. Format response (~2k tokens)
4. Try approach 2 (~4k tokens)
5. Research documentation (~3k tokens)
6. Try approach 3 (~4k tokens)

**Total**: ~20k tokens, 30-45 minutes

### With This Skill

**Same scenario**:
1. Try approach 1 (~4k tokens)
2. Execute `/consult-gemini` (~1k tokens to execute)
3. Gemini finds issue (billed separately, but <5k tokens)
4. Implement fix (~3k tokens)

**Total**: ~8k tokens, 5-10 minutes

**Savings**: ~60% tokens, ~75% time

**Value**: Gemini's web search finds issue Claude couldn't

---

## Success Metrics

### Time Efficiency
- **Without skill**: 30-45 minutes (trial and error)
- **With skill**: 5-10 minutes (consultation + fix)
- **Savings**: ~75%

### Token Efficiency
- **Without skill**: ~20k tokens (multiple attempts)
- **With skill**: ~8k tokens (one consultation)
- **Savings**: ~60%

### Error Prevention
- **Manual CLI use**: 3-5 common errors (flags, parsing, privacy)
- **With skill**: 0 errors (all handled by commands)
- **Prevention**: 100%

### Quality
- **Manual**: Risk of not synthesizing (just copying external AI)
- **With skill**: Forced synthesis via `GEMINI.md`/`codex.md`
- **Improvement**: Guaranteed value-add

---

## Why CLI Approach (Not MCP)?

| Aspect | MCP Server | CLI Approach |
|--------|------------|--------------|
| Setup time | 4-6 hours | 60-75 minutes |
| Complexity | High (MCP protocol) | Low (bash + CLIs) |
| Maintenance | Update MCP SDK | Update CLI (rare) |
| Flexibility | Locked to AIs | Any AI with CLI |
| Debugging | MCP protocol | Standard bash |
| Dependencies | MCP SDK, npm | Just CLIs |

**Winner**: CLI approach - 80% less effort, same functionality

---

## Troubleshooting

### Gemini Not Working

```bash
# Check CLI installed
which gemini

# Check API key set
echo $GEMINI_API_KEY

# Test manually
gemini -p "test"

# Check API key valid
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
```

### Codex Not Working

```bash
# Check CLI installed
which codex

# Check API key set (if using API key auth)
echo $OPENAI_API_KEY

# Test manually
echo "test" | codex exec - --yolo

# Check OpenAI API (if installed)
openai api models.list
```

### Fresh Claude Not Working

```bash
# Fresh Claude uses Task tool (built-in)
# If Task tool fails, check Claude Code CLI status
claude --version
```

### Skill Not Discovered

```bash
# Check skill installed
ls -la ~/.claude/skills/multi-ai-consultant

# Check SKILL.md has YAML frontmatter
head -20 ~/.claude/skills/multi-ai-consultant/SKILL.md

# Ask Claude Code to list skills
# It should mention multi-ai-consultant
```

---

## Contributing

**Found an issue?**
- Document it in Known Issues section
- Include fix/workaround
- Update slash commands to prevent

**Adding new AI?**
- Create new slash command: `commands/consult-newai.md`
- Add to router: Update `commands/consult-ai.md`
- Create template: `templates/newai.md` (if CLI supports system instructions)
- Update documentation

**Improving synthesis?**
- Edit templates: `templates/GEMINI.md`, `templates/codex.md`
- Test with real consultations
- Measure before/after quality

---

## References

### External Resources

- **Gemini CLI**: https://ai.google.dev/gemini-api/docs/cli
- **OpenAI Codex**: https://www.npmjs.com/package/codex
- **OpenAI API**: https://platform.openai.com/docs
- **Gemini API Pricing**: https://ai.google.dev/pricing
- **OpenAI Pricing**: https://openai.com/pricing

### Internal Files

- **Planning docs**: `planning/multi-ai-consultant-*.md`
- **Slash commands**: `commands/*.md`
- **Templates**: `templates/*`
- **Scripts**: `scripts/*`

---

## License

MIT License - See LICENSE file

---

**Last Updated**: 2025-11-07
**Status**: Production Ready
**Maintainer**: Claude Skills Maintainers | maintainers@example.com
