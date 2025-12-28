# gemini-cli

**Status**: ✅ Production-Ready | v2.0.0 | Last Updated: 2025-11-13

Use the official Google Gemini CLI directly from Claude Code for second opinions, architectural advice, debugging help, and comprehensive code reviews using Gemini's 1M+ context window.

---

## Auto-Trigger Keywords

This skill should activate when Claude Code encounters these scenarios:

### Commands
- `gemini` (official CLI tool)
- `gemini-cli` (installation package)
- `gemini-2.5-flash`, `gemini-2.5-pro` (model names)

### Use Cases
- "second opinion"
- "consult Gemini"
- "peer review"
- "architectural decision"
- "stuck debugging" (after 2+ attempts)
- "security audit"
- "compare implementations"
- "model comparison"
- "Flash vs Pro"
- "1M context window"
- "large codebase analysis"

### Technologies
- Google Gemini
- Gemini CLI
- @google/gemini-cli
- AI pair programming
- AI-to-AI prompting

### Scenarios (Proactive)
- Major architectural decisions (D1 vs KV, Durable Objects vs Workflows, etc.)
- Security-sensitive code (auth, payments, data handling)
- Large refactors (5+ files, core architecture changes)
- Context approaching 70%+ full
- Unfamiliar technology stack
- Debugging failures (2+ attempts on same bug)

---

## When to Use

### ✅ Use This Skill When:

- [ ] User asks major architectural question ("Should I use D1 or KV for sessions?")
- [ ] Writing security-sensitive code (auth, payments, PII)
- [ ] Planning large refactor (5+ files or core architecture)
- [ ] Stuck debugging after 2+ failed attempts
- [ ] Context approaching 70%+ capacity, need full codebase analysis
- [ ] Unfamiliar with technology stack or library
- [ ] Need to compare two implementations (old vs new, alternative approaches)
- [ ] User explicitly requests Gemini consultation
- [ ] Want complementary perspective on critical decision
- [ ] Need 1M+ context window for comprehensive analysis

### ❌ Don't Use This Skill When:

- [ ] Simple questions answerable with Claude's knowledge
- [ ] Trivial code reviews (small, non-critical changes)
- [ ] Every single decision (reserve for critical scenarios)
- [ ] API rate limits exceeded
- [ ] No internet connection available

---

## Quick Example

**Scenario**: User asks "Should I use D1 or KV for session storage?"

**Claude's Workflow**:
```bash
# 1. Detect architectural decision
# 2. Inform user: "Consulting Gemini for second opinion..."

# 3. Get Gemini's perspective (Pro model)
gemini -m gemini-2.5-pro -p "I'm building a Cloudflare Worker with 1000-5000 DAU. Should I use D1 or KV for session storage? Consider: 1) Session reads on every request, 2) TTL-based expiration after 30 days, 3) Remember me functionality, 4) Multi-device tracking, 5) Cost under $50/month."

# 4. Synthesize both perspectives
# 5. Present unified recommendation
```

**User sees**:
```
Based on consultation with Gemini:

**My Perspective**: Both viable, depends on priorities
- KV excels at read performance (sub-millisecond)
- D1 provides better querying for multi-device tracking

**Gemini's Perspective** (2.5-Pro): D1 recommended
- Strong consistency is critical for sessions
- Query flexibility for "remember me" across devices
- Cost effective at this scale

**Recommendation**: Start with D1
```

---

## Installation

### Via Marketplace (Recommended)

```bash
# Add marketplace
/plugin marketplace add https://github.com/jezweb/claude-skills

# Install skill
/plugin install gemini-cli@claude-skills
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/jezweb/claude-skills.git
cd claude-skills

# Symlink skill
ln -s $(pwd)/skills/gemini-cli ~/.claude/skills/gemini-cli
```

### Install Gemini CLI

```bash
# Install official Gemini CLI
npm install -g @google/gemini-cli

# Authenticate
gemini

# Test
gemini --version
gemini -p "What is 2+2?"
```

---

## Features

### Core Capabilities

- ✅ **Direct CLI Integration**: Use official `gemini` command (no wrapper needed)
- ✅ **Model Selection**: Flash (fast) vs Pro (thorough)
- ✅ **1M+ Context Window**: Analyze large code files
- ✅ **Non-Interactive Mode**: Perfect for Claude Code automation (`-p` flag)
- ✅ **File Context**: Pipe files or use `--all-files`
- ✅ **AI-to-AI Prompting**: Optimized prompts for Gemini from Claude

### Use Cases Covered

1. **Architecture Decisions**: Technology selection, pattern choices
2. **Security Audits**: Authentication, payments, sensitive data handling
3. **Debugging Assistance**: Root cause analysis after failed attempts
4. **Code Reviews**: Before commits, pull requests
5. **Refactoring Plans**: Large-scale changes (5+ files)
6. **Performance Optimization**: Bottleneck identification

---

## Usage Patterns

### Pattern 1: Quick Consultation

```bash
gemini -p "Should I use Drizzle ORM or raw SQL for Cloudflare D1?"
```

### Pattern 2: Security Review

```bash
cat src/auth/middleware.ts | gemini -m gemini-2.5-pro -p "Security audit this auth middleware"
```

### Pattern 3: Code Review

```bash
git diff HEAD | gemini --all-files -p "Review these changes for edge cases and security"
```

### Pattern 4: Architecture Advice

```bash
gemini -m gemini-2.5-pro -p "Best way to handle WebSocket state in Cloudflare Durable Objects? Consider: 1) 100+ concurrent connections, 2) Persistence requirements, 3) Failover"
```

### Pattern 5: Debugging

```bash
echo "[error message]" | gemini -p "Help debug this error. What's the likely root cause?"
```

---

## Comparison: gemini-cli vs google-gemini-api

| Feature | gemini-cli (this skill) | google-gemini-api |
|---------|------------------------|-------------------|
| **Purpose** | Second opinions, peer review | Direct API integration |
| **Context** | Full codebase (1M+ tokens) | Request-specific |
| **Integration** | Command-line tool | SDK (@google/genai) |
| **Use Case** | AI-to-AI consultation | Building Gemini-powered apps |
| **Best For** | Architecture, security audits | Chat, embeddings, function calling |

**Use both**: gemini-cli for consulting Gemini, google-gemini-api for building with Gemini.

---

## Related Skills

- **[google-gemini-api](../google-gemini-api/)** - Gemini API integration via SDK
- **[google-gemini-embeddings](../google-gemini-embeddings/)** - Gemini embeddings for RAG
- **[google-gemini-file-search](../google-gemini-file-search/)** - Managed RAG with Gemini
- **[openai-api](../openai-api/)** - Alternative for second opinions

---

## Known Issues

1. **Model Deprecation**: `gemini-2.5-flash-lite` removed (use `flash` or `pro`)
2. **Rate Limits**: Space out requests if hitting limits
3. **Large Files**: Use `--all-files` carefully (can exceed context)

See [SKILL.md](SKILL.md) for complete troubleshooting guide.

---

## Version History

**2.0.0** (2025-11-13):
- ✨ Complete rewrite for official Gemini CLI (removed gemini-coach wrapper)
- ✨ Direct CLI integration patterns
- ✨ Simplified to core use cases
- ✨ Updated for gemini CLI v0.13.0+

**1.0.0** (2025-11-08):
- Initial release with gemini-coach wrapper
- Production testing and experimentation

---

## Contributing

Issues and improvements welcome:
- **Issues**: https://github.com/jezweb/claude-skills/issues
- **Email**: jeremy@jezweb.net

---

## License

MIT - See [LICENSE](../../LICENSE)

---

**Maintained by**: Jeremy Dawes | [Jezweb](https://jezweb.com.au)
