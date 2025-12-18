# Multi-AI Consultant Setup Guide

Complete installation and configuration guide for the multi-ai-consultant skill.

---

## Prerequisites

- Claude Code CLI installed
- Bun or npm package manager
- Git repository (optional, but recommended for Codex)

---

## 1. Install CLI Tools

### Gemini CLI (Required)

The Gemini CLI provides access to Google's Gemini 2.5 Pro with web search, extended thinking, and grounding capabilities.

**Install**:
```bash
bun add -g @google/generative-ai-cli
```

**Configure API Key**:
```bash
export GEMINI_API_KEY="your-key-here"
```

**Get API Key**: https://aistudio.google.com/apikey

**Add to shell profile** (persist across sessions):
```bash
# For bash
echo 'export GEMINI_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export GEMINI_API_KEY="your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Verify**:
```bash
gemini -p "test" && echo "✅ Gemini CLI working"
```

---

### Codex CLI (Optional)

The Codex CLI provides repo-aware analysis via OpenAI GPT-4.

**Install**:
```bash
bun add -g codex
```

**Configure API Key**:
```bash
export OPENAI_API_KEY="sk-..."
```

**Get API Key**: https://platform.openai.com/api-keys

**Add to shell profile**:
```bash
# For bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.zshrc
source ~/.zshrc
```

**Verify**:
```bash
echo "test" | codex exec - --yolo && echo "✅ Codex CLI working"
```

---

### Fresh Claude (Built-in)

Fresh Claude consultations use the Claude Code Task tool - no additional setup required.

---

## 2. Install Skill

The skill provides slash commands and templates for consultations.

**Method 1: Symlink from Development Location** (recommended for development):
```bash
cd ~/.claude/skills
ln -s /path/to/your/claude-skills/skills/multi-ai-consultant multi-ai-consultant
```

**Method 2: Clone Directly**:
```bash
cd ~/.claude/skills
git clone https://github.com/your-org/claude-skills.git
cd claude-skills/skills
ln -s $(pwd)/multi-ai-consultant ~/.claude/skills/multi-ai-consultant
```

**Verify Installation**:
```bash
ls -la ~/.claude/skills/multi-ai-consultant
# Should show symlink or directory
```

---

## 3. Copy Templates to Project

The skill includes templates that customize AI behavior for consultations.

### GEMINI.md (Project Root)

System instructions for Gemini consultations - enforces 5-part synthesis format and web research.

```bash
# Copy to project root
cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./
```

**What it does**:
- Enforces 5-part response format (My Analysis → Other AI → Differences → Synthesis → Recommendation)
- Prevents parroting (must compare with Claude's analysis)
- Enables web search for latest docs
- Requires specific code references with line numbers

**Auto-loaded**: Gemini CLI automatically reads this file from project root

---

### codex.md (Project Root or ~/.codex/instructions.md)

System instructions for Codex consultations - enforces repo-aware analysis.

```bash
# Copy to project root (project-specific)
cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./

# OR copy to global config (applies to all projects)
mkdir -p ~/.codex
cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ~/.codex/instructions.md
```

**What it does**:
- Enforces 5-part response format
- Requires repo-wide consistency checks
- Mandates impact assessment for changes
- Requires specific file references

**Auto-loaded**: Codex CLI reads from project root first, then falls back to `~/.codex/instructions.md`

---

### .geminiignore (Project Root)

Privacy exclusions beyond `.gitignore` - prevents sensitive files from being sent to Gemini.

```bash
# Copy to project root
cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./
```

**What it excludes**:
- `.env*` files
- Files matching `*secret*`, `*credentials*`, `*password*`
- `.dev.vars` (Cloudflare Workers secrets)
- `wrangler.toml` (may contain sensitive config)
- Build artifacts (node_modules, dist, .next, etc.)
- Large media files
- API keys and tokens

**Auto-loaded**: Gemini CLI respects this file automatically

**Note**: Both CLIs automatically respect `.gitignore` - `.geminiignore` is for extra protection

---

### consultation-log-parser.sh (Optional)

Utility for viewing consultation history and cost tracking.

**Install to ~/bin** (if ~/bin is in PATH):
```bash
mkdir -p ~/bin
cp ~/.claude/skills/multi-ai-consultant/templates/consultation-log-parser.sh ~/bin/
chmod +x ~/bin/consultation-log-parser.sh
```

**Install to /usr/local/bin** (system-wide, requires sudo):
```bash
sudo cp ~/.claude/skills/multi-ai-consultant/templates/consultation-log-parser.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/consultation-log-parser.sh
```

**Usage**:
```bash
consultation-log-parser.sh           # Last 10 consultations
consultation-log-parser.sh --all     # All consultations
consultation-log-parser.sh --summary # Stats only
consultation-log-parser.sh --ai gemini # Filter by AI
```

---

## 4. Privacy Configuration

### Automatic Protection

Both Gemini and Codex CLIs automatically respect `.gitignore` - files in `.gitignore` are never sent.

### Additional Protection (.geminiignore)

Create `.geminiignore` in project root for extra exclusions beyond `.gitignore`:

```gitignore
# Environment and secrets
*.env*
*secret*
*credentials*
*password*
.dev.vars

# Cloudflare Workers config
wrangler.toml

# Build artifacts
node_modules/
dist/
.next/
.nuxt/
out/

# Large files
*.mov
*.mp4
*.zip
*.tar.gz

# Logs
*.log
logs/

# API keys
*apikey*
*api_key*
*api-key*
```

### Pre-Consultation Privacy Check

Claude Code should automatically warn before sending context to external AIs if:
- Sensitive file patterns detected (`.env`, `secret`, `credentials`)
- Not in Git repo (Codex)
- Large context (>100k tokens estimated)

**Prompt**: "About to send context to [AI]. Files include: [list]. Proceed?"

### Manual Verification

Before consultation, verify what will be sent:

```bash
# Check what Gemini will see
ls -la @src/

# Verify gitignore is working
git status --ignored

# Check for sensitive patterns
grep -r "API_KEY\|SECRET\|PASSWORD" .
```

---

## 5. Verification Steps

After installation, verify everything works:

### Test Gemini CLI

```bash
# Basic test
gemini -p "test" && echo "✅ Gemini working"

# API key verification (detailed)
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"

# Should return JSON response (not error)
```

### Test Codex CLI (if installed)

```bash
# Basic test
echo "test" | codex exec - --yolo && echo "✅ Codex working"

# OpenAI API verification (if using OpenAI CLI)
openai api models.list
```

### Test Fresh Claude

Fresh Claude uses the built-in Task tool - no separate verification needed.

```bash
# Verify Claude Code CLI is working
claude --version
```

### Test Skill Discovery

Ask Claude Code a question that would trigger consultation:

```
User: "I'm stuck on this bug and tried one approach already"

Expected: Claude should suggest using multi-ai-consultant skill
```

---

## 6. Cost Tracking Setup

Consultations are automatically logged to `~/.claude/ai-consultations/consultations.log`.

**Log format**:
```csv
timestamp,ai,model,input_tokens,output_tokens,cost,project_path
```

**Example**:
```csv
2025-11-07T14:23:45-05:00,gemini,gemini-2.5-pro,15420,850,0.1834,/Users/name/projects/my-app
2025-11-07T15:10:22-05:00,codex,gpt-4-turbo,8230,430,0.0952,/Users/name/projects/my-app
2025-11-07T16:05:11-05:00,claude-subagent,claude-sonnet-4-5,0,0,0.00,/Users/name/projects/my-app
```

**View logs** (if you installed consultation-log-parser.sh):
```bash
consultation-log-parser.sh --summary
# Output:
# Total consultations: 47
# Gemini: 23 ($4.25), Codex: 12 ($1.85), Fresh Claude: 12 ($0.00)
# Total cost: $6.10
```

---

## 7. Per-Project Configuration

For project-specific settings:

### Project Root Files

```
my-project/
├── GEMINI.md              # Gemini system instructions
├── codex.md               # Codex system instructions (optional)
├── .geminiignore          # Privacy exclusions
├── .gitignore             # Standard git exclusions (auto-respected)
└── ... (your code)
```

### Global Configuration

For settings that apply to all projects:

```
~/.codex/
└── instructions.md        # Global Codex instructions (fallback)

~/.claude/
└── ai-consultations/
    └── consultations.log  # Cost tracking log
```

---

## Troubleshooting Installation

### "command not found: gemini"

**Cause**: Gemini CLI not installed or not in PATH

**Fix**:
```bash
# Reinstall
bun add -g @google/generative-ai-cli

# Check installation
which gemini

# If not in PATH, check global bin location
bun pm bin -g
# Add to PATH if needed
```

### "command not found: codex"

**Cause**: Codex CLI not installed or not in PATH

**Fix**:
```bash
# Reinstall
bun add -g codex

# Check installation
which codex
```

### "API key invalid"

**Cause**: API key not set or incorrect

**Fix**:
```bash
# Check if set
echo $GEMINI_API_KEY
echo $OPENAI_API_KEY

# Set if missing
export GEMINI_API_KEY="your-key"
export OPENAI_API_KEY="sk-..."

# Add to shell profile (persist)
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### "Skill not discovered"

**Cause**: Skill not installed correctly

**Fix**:
```bash
# Check installation
ls -la ~/.claude/skills/multi-ai-consultant

# Check YAML frontmatter exists
head -20 ~/.claude/skills/multi-ai-consultant/SKILL.md

# Reinstall if needed
cd ~/.claude/skills
rm -rf multi-ai-consultant
ln -s /path/to/claude-skills/skills/multi-ai-consultant multi-ai-consultant
```

---

## Next Steps

After setup is complete:

1. **Test with simple consultation**: `/consult-claude "Test consultation"`
2. **Review ai-strengths.md**: Learn when to use each AI
3. **Review commands-reference.md**: Learn detailed command syntax
4. **Try a real scenario**: Use during actual debugging or architecture decision

---

**Last Updated**: 2025-12-17
