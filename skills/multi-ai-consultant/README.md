# Multi-AI Consultant

**Get second opinions from Gemini, OpenAI, or fresh Claude when stuck or making critical decisions.**

---

## Quick Start

```bash
# Install skill
cd ~/.claude/skills
git clone [this-repo] multi-ai-consultant

# Setup APIs
export GEMINI_API_KEY="your-key"  # Required
export OPENAI_API_KEY="sk-..."    # Optional

# Copy templates to your project
cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./

# Start using
# Claude Code will automatically suggest consultations when stuck
```

---

## Auto-Trigger Keywords

This skill activates when you say:

### Stuck/Need Help
- "I'm stuck"
- "still not working"
- "this isn't working"
- "can't figure out"
- "no idea why"
- "need help"
- "need a second opinion"
- "want another perspective"

### Architecture/Design
- "architecture decision"
- "how should we structure"
- "which approach is better"
- "design question"
- "choosing between"
- "what's the best way to"

### Security
- "is this secure"
- "security concern"
- "vulnerability"
- "authentication"
- "authorization"
- "validation"

### Manual Commands
- `/consult-gemini [question]`
- `/consult-codex [question]`
- `/consult-claude [question]`
- `/consult-ai [question]`

---

## The Three AIs

| AI | Best For | Cost | Speed |
|----|----------|------|-------|
| **Gemini 2.5 Pro** | Web research, latest docs, thinking | ~$0.10-0.50 | Slower |
| **OpenAI Codex** | Repo-aware analysis, code review | ~$0.05-0.30 | Medium |
| **Fresh Claude** | Quick opinion, fresh perspective | Free | Fast |

---

## How It Works

1. **You get stuck** on a bug after one attempt
2. **Claude suggests** consulting another AI
3. **You approve**
4. **External AI analyzes** the problem with fresh eyes
5. **Claude synthesizes** both perspectives in 5-part format:
   - 🤖 Claude's analysis
   - 💎/🔷/🔄 Other AI's analysis
   - 🔍 Key differences
   - ⚡ Synthesis
   - ✅ Recommended action
6. **You decide** which approach to take

**Result**: Better solutions, faster debugging, fresh perspectives

---

## Example

**You**: "Fix this JWT auth bug"

**Claude**: *Tries token expiry fix → Still failing*

**Claude**: "I've tried one approach without success. Should I consult Gemini for a fresh perspective?"

**You**: "yes"

**Claude**: *Executes `/consult-gemini` internally*

**Gemini**: *Searches web → Finds Cloudflare Workers don't support `process.env` → Suggests `env.JWT_SECRET`*

**Claude**: *Synthesizes both analyses → Shows 5-part comparison → Asks permission*

**You**: "proceed"

**Claude**: *Implements fix → ✅ Working*

**Time saved**: 20-30 minutes of trial-and-error

---

## Setup

### 1. Install CLIs

```bash
# Gemini (required)
npm install -g @google/generative-ai-cli
export GEMINI_API_KEY="your-key"
# Get key: https://aistudio.google.com/apikey

# Codex (optional)
npm install -g codex
export OPENAI_API_KEY="sk-..."
# Get key: https://platform.openai.com/api-keys
```

### 2. Install Skill

```bash
cd ~/.claude/skills
git clone [this-repo] multi-ai-consultant
```

### 3. Copy Templates

```bash
# In your project root
cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./
cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./
```

### 4. Test

```bash
# Test Gemini
gemini -p "test" && echo "✅ Working"

# Test Codex (if installed)
codex exec "test" --yolo && echo "✅ Working"

# Ask Claude Code
# "I'm stuck on this bug"
# → Should suggest consultation
```

---

## Usage

### Automatic (Recommended)

Just work normally. Claude Code will suggest consultations when:
- Stuck after one failed attempt
- Making architectural decisions
- Security concerns

### Manual

```bash
# Specific AI
/consult-gemini Is this JWT implementation secure?
/consult-codex Review this codebase for code smells
/consult-claude Quick sanity check on this approach

# Let Claude choose
/consult-ai How should we structure this microservices architecture?
```

---

## Features

✅ **Automatic triggers** - Suggests consultation when stuck
✅ **Forced synthesis** - Prevents parroting external AI
✅ **Smart context** - Selective file inclusion
✅ **Cost tracking** - Logs every consultation
✅ **Privacy protected** - Respects `.gitignore` + `.geminiignore`
✅ **Three AI options** - Gemini (web search), Codex (repo-aware), Fresh Claude (free)
✅ **Pre-flight checks** - Verifies CLIs work before calling
✅ **Error handling** - Helpful messages for common issues

---

## Cost

**Typical consultation**:
- Gemini: ~$0.10-0.50 (depending on context size)
- Codex: ~$0.05-0.30 (depending on codebase size)
- Fresh Claude: Free

**View spending**:
```bash
consultation-log-parser.sh --summary
```

**Estimated ROI**: 20-30 minutes saved per bug = worth the cost

---

## Privacy

**Automatic protection**:
- Both CLIs respect `.gitignore`
- Never sends `node_modules/`, `.env*`, etc.

**Extra protection**:
- Create `.geminiignore` for additional exclusions
- Claude warns if sensitive files detected

**You control**:
- Approve before each consultation
- See what context will be sent
- Choose which AI (or decline)

---

## Why This Works

**Problem**: Claude Code sometimes gets stuck in a mental rut or lacks latest info

**Solution**: External AIs provide:
- Fresh perspective (different reasoning)
- Web research (Gemini's Google Search)
- Repo-aware analysis (Codex's auto-scan)
- Latest documentation (Gemini's grounding)

**Result**: Better solutions, faster debugging, informed decisions

---

## When NOT to Use

❌ Simple bugs you haven't tried fixing yet
❌ Typos or syntax errors
❌ Questions answered by reading docs
❌ Budget is absolute $0 (use Fresh Claude only)

---

## Troubleshooting

**Gemini not working?**
```bash
npm install -g @google/generative-ai-cli
export GEMINI_API_KEY="your-key"
```

**Codex not working?**
```bash
npm install -g codex
export OPENAI_API_KEY="sk-..."
```

**Skill not discovered?**
```bash
ls -la ~/.claude/skills/multi-ai-consultant
# Check SKILL.md exists and has YAML frontmatter
```

**Too expensive?**
- Use Fresh Claude (free) for quick opinions
- Use Gemini only for complex problems
- Check logs: `consultation-log-parser.sh --summary`

---

## Documentation

- **Full docs**: See `SKILL.md`
- **Planning**: See `planning/multi-ai-consultant-*.md`
- **CLI reference**: See `references/`
- **Examples**: See `examples/`

---

## Contributing

**Found an issue?** Document in SKILL.md Known Issues

**Want to add an AI?** Create `commands/consult-newai.md`

**Improving synthesis?** Edit `templates/GEMINI.md` or `templates/codex.md`

---

## License

MIT

---

**Last Updated**: 2025-11-07
**Status**: Production Ready
**Maintainer**: Claude Skills Maintainers | maintainers@example.com
