---
name: gemini-cli
description: |
  Use Google Gemini CLI directly from Claude Code for second opinions, architectural advice, debugging help, code reviews, and security audits. Leverage Gemini's 1M+ context window for comprehensive code analysis using the official gemini command-line tool.

  Use when: Need second opinion on architectural decisions, stuck debugging after 2+ attempts, writing security-sensitive code (auth, payments, data handling), planning large refactors (5+ files), approaching 70%+ context capacity, unfamiliar with technology stack, want to compare Flash vs Pro model recommendations, need comprehensive codebase analysis, or consulting Gemini for peer review on critical code changes.

  Keywords: gemini-cli, google gemini, gemini command line, second opinion, model comparison, gemini-2.5-flash, gemini-2.5-pro, architectural decisions, debugging assistant, code review gemini, security audit gemini, 1M context window, AI pair programming, gemini consultation, flash vs pro, AI-to-AI prompting, peer review, codebase analysis, gemini CLI tool, shell gemini, command line AI assistant, gemini architecture advice, gemini debug help, gemini security scan, gemini code compare
license: MIT
metadata:
  version: 2.0.0
  production_tested: true
  gemini_cli_version: 0.13.0+
  last_verified: 2025-11-13
  token_savings: ~60-70%
  errors_prevented: 6+
---

# Gemini CLI

**Leverage Gemini's 1M+ context window as your AI pair programmer within Claude Code workflows.**

This skill teaches Claude Code how to use the official Google Gemini CLI (`gemini` command) to get second opinions, architectural advice, debugging help, and comprehensive code reviews. Based on production testing with the official CLI tool.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [When to Use Gemini Consultation](#when-to-use-gemini-consultation)
3. [Installation](#installation)
4. [Using Gemini CLI](#using-gemini-cli)
5. [Model Selection: Flash vs Pro](#model-selection-flash-vs-pro)
6. [Proactive Consultation Patterns](#proactive-consultation-patterns)
7. [AI-to-AI Prompting Best Practices](#ai-to-ai-prompting-best-practices)
8. [Common Use Cases](#common-use-cases)
9. [Integration Examples](#integration-examples)
10. [Troubleshooting & Known Issues](#troubleshooting--known-issues)

---

## Quick Start

**Prerequisites**:
- Gemini CLI installed (`bun add -g @google/gemini-cli`)
- Authenticated with Google account (run `gemini` once to authenticate)

**Basic Usage Patterns**:

```bash
# Quick question (non-interactive with -p flag)
gemini -p "Should I use D1 or KV for session storage?"

# Code review with file context (using --all-files)
gemini --all-files -p "Review this auth implementation for security issues"

# Architecture advice using Pro model
gemini -m gemini-2.5-pro -p "Best way to handle WebSockets in Cloudflare Workers?"

# Pipe file content for review
cat src/auth.ts | gemini -p "Review this authentication code for security vulnerabilities"

# Interactive mode for follow-up questions
gemini -i "Help me debug this authentication error"
```

---

## When to Use Gemini Consultation

### ALWAYS Consult (Critical Scenarios)

Claude Code should **automatically invoke Gemini** in these situations:

1. **Major Architectural Decisions**
   - Example: "Should I use D1 or KV for session storage?"
   - Example: "Durable Objects vs Workflows for long-running tasks?"
   - Why: Gemini provides complementary perspective, may prioritize different concerns
   - **Pattern**: `gemini -m gemini-2.5-pro -p "[architectural question]"`

2. **Security-Sensitive Code Changes**
   - Authentication systems
   - Payment processing
   - Data handling (PII, sensitive data)
   - API key/secret management
   - Why: Gemini 2.5 Pro excels at security audits
   - **Pattern**: `cat [security-file] | gemini -m gemini-2.5-pro -p "Security audit this code"`

3. **Large Refactors**
   - Affecting 5+ files
   - Core architecture changes
   - Database schema migrations
   - Why: Fresh perspective prevents tunnel vision
   - **Pattern**: `gemini --all-files -m gemini-2.5-pro -p "Review this refactoring plan"`

4. **Stuck Debugging (2+ Failed Attempts)**
   - Error persists after 2 debugging attempts
   - Stack trace unclear
   - Intermittent bugs
   - Why: Different reasoning approach may spot root cause
   - **Pattern**: `gemini -p "Help debug: [error message]" < error.log`

5. **Context Window Pressure (70%+ Full)**
   - Approaching token limit
   - Need to offload analysis to Gemini
   - Why: Gemini's 1M context can handle large code files
   - **Pattern**: `cat large-file.ts | gemini -p "Analyze this code structure"`

### OPTIONALLY Consult

6. **Unfamiliar Technology**
   - Using library/framework for first time
   - Experimenting with new patterns
   - Why: Gemini may have more recent training data
   - **Pattern**: `gemini -p "Best practices for [new technology]"`

7. **Code Reviews**
   - Before committing major changes
   - Pull request preparation
   - Why: Catches edge cases and improvements
   - **Pattern**: `git diff | gemini -p "Review these changes"`

---

## Installation

### 1. Install Gemini CLI

```bash
bun add -g @google/gemini-cli
```

### 2. Authenticate

```bash
gemini
```

Follow the authentication prompts to link your Google account.

### 3. Verify Installation

```bash
gemini --version
```

Should show version 0.13.0 or higher.

### 4. Test Connection

```bash
gemini -p "What is 2+2?"
```

---

## Using Gemini CLI

### Core Command Patterns

#### Non-Interactive Mode (`-p` flag)

Best for Claude Code integration:

```bash
# Direct question
gemini -p "Your question here"

# With model selection
gemini -m gemini-2.5-flash -p "Quick debugging question"
gemini -m gemini-2.5-pro -p "Complex architectural decision"

# With file context via pipe
cat src/auth.ts | gemini -p "Review this code"

# With all files in current directory
gemini --all-files -p "Analyze project structure"

# With stdin input
echo "Error: Cannot connect to database" | gemini -p "Help debug this error"
```

#### Interactive Mode (`-i` flag)

For follow-up conversations:

```bash
# Start interactive session with initial prompt
gemini -i "Let's discuss the architecture"

# Interactive with model selection
gemini -m gemini-2.5-pro -i "Help me design a database schema"
```

#### YOLO Mode (`-y` flag)

Auto-accepts all actions (use with caution):

```bash
# Dangerous: Auto-executes suggested commands
gemini -y -p "Fix all linting errors"
```

⚠️ **Warning**: YOLO mode can execute commands without confirmation. Only use in trusted environments.

---

## Model Selection: Flash vs Pro

### gemini-2.5-flash (Default)

**Characteristics**:
- Fast response time: ~5-25 seconds
- Good quality for most tasks
- Lower cost
- Safe for general questions

**Use For**:
- Code reviews
- Debugging
- General questions
- Quick consultations
- When speed matters

**Example**:
```bash
gemini -m gemini-2.5-flash -p "Review this function for performance issues"
```

### gemini-2.5-pro

**Characteristics**:
- Response time: ~15-30 seconds
- Excellent quality, thorough analysis
- Higher cost
- Best for critical decisions

**Use For**:
- Architecture decisions (critical)
- Security audits (thorough)
- Complex reasoning tasks
- Major refactoring plans
- When accuracy > speed

**Example**:
```bash
gemini -m gemini-2.5-pro -p "Security audit this authentication system"
```

### How to Choose

```
Quick question? → Flash
Security/architecture? → Pro
Debugging? → Flash (try Pro if stuck)
Code review? → Flash
Refactoring 5+ files? → Pro
```

---

## Proactive Consultation Patterns

### Pattern 1: Architecture Decision

**Trigger**: User asks about technology choice
**Claude Action**: Automatically consult Gemini for second opinion

```bash
# Claude runs:
gemini -m gemini-2.5-pro -p "Compare D1 vs KV for session storage in Cloudflare Workers. Consider: read/write patterns, cost, performance, complexity."

# Then synthesizes both perspectives
```

### Pattern 2: Security Review

**Trigger**: Working on auth/payment/sensitive code
**Claude Action**: Request Gemini security audit

```bash
# Claude runs:
cat src/auth/verify-token.ts | gemini -m gemini-2.5-pro -p "Security audit this authentication code. Check for: token validation, timing attacks, injection vulnerabilities, error handling."
```

### Pattern 3: Debugging Assistance

**Trigger**: Error persists after 2 attempts
**Claude Action**: Get Gemini's perspective

```bash
# Claude runs:
echo "[error message and stack trace]" | gemini -p "Help debug this error. What's the likely root cause?"
```

### Pattern 4: Code Review

**Trigger**: Major changes ready to commit
**Claude Action**: Request comprehensive review

```bash
# Claude runs:
git diff HEAD | gemini --all-files -p "Review these changes for: correctness, edge cases, performance, security, best practices."
```

---

## AI-to-AI Prompting Best Practices

### How Claude Should Format Prompts to Gemini

**✅ GOOD: Context-Rich, Specific**
```bash
gemini -m gemini-2.5-pro -p "I'm building a Cloudflare Worker with user authentication. Should I use D1 or KV for storing session data? Consider: 1) Session reads on every request, 2) TTL-based expiration, 3) Cost under 10M requests/month, 4) Deployment complexity."
```

**❌ BAD: Vague, No Context**
```bash
gemini -p "D1 or KV?"
```

### Prompt Structure Template

```
[Context: What you're building]
[Question]
[Considerations: Key factors (numbered)]
```

### Example: Architecture Decision

```bash
gemini -m gemini-2.5-pro -p "
Context: Building a real-time collaborative editing app on Cloudflare Workers.

Question: Should I use Durable Objects or Workflows for managing document state?

Considerations:
1. Need to handle WebSocket connections (100+ simultaneous users per document)
2. Document state must be consistent across all clients
3. Need to persist changes every 5 seconds
4. Budget: <\$100/month at 1000 documents
5. Simple deployment preferred
"
```

---

## Common Use Cases

### 1. Technology Selection

```bash
# Compare two technologies
gemini -m gemini-2.5-pro -p "Compare Drizzle ORM vs raw SQL for Cloudflare D1. Consider: type safety, performance, query complexity, bundle size."
```

### 2. Security Audit

```bash
# Audit authentication code
cat src/middleware/auth.ts | gemini -m gemini-2.5-pro -p "
Security audit this authentication middleware. Check for:
1. Token validation vulnerabilities
2. Timing attack risks
3. Error handling leaks
4. CSRF protection
5. Rate limiting
"
```

### 3. Debugging Root Cause

```bash
# Analyze error logs
tail -100 error.log | gemini -p "
These errors started appearing after deploying auth changes. What's the likely root cause?

Context:
- Added JWT validation middleware
- Using @cloudflare/workers-jwt
- Errors only on /api/* routes
"
```

### 4. Code Review

```bash
# Review pull request changes
git diff main...feature-branch | gemini --all-files -p "
Review this pull request. Focus on:
1. Breaking changes
2. Edge cases not handled
3. Performance implications
4. Security concerns
"
```

### 5. Refactoring Plan

```bash
# Plan large refactor
gemini --all-files -m gemini-2.5-pro -p "
I want to refactor this Express app to Cloudflare Workers with Hono. Analyze the codebase and suggest:
1. Migration order (which routes first)
2. Potential blockers (middleware that won't work)
3. Testing strategy
4. Deployment plan
"
```

### 6. Performance Optimization

```bash
# Analyze performance
cat src/api/heavy-endpoint.ts | gemini -p "
This endpoint is slow (500ms+ response time). Identify performance bottlenecks and suggest optimizations.

Context:
- Cloudflare Worker
- Fetches data from 3 external APIs
- Processes 1000+ items
"
```

---

## Integration Examples

### Example 1: Claude Consulting Gemini Automatically

**Scenario**: User asks architectural question

```
User: "Should I use D1 or KV for storing user sessions?"

Claude (internal): This is an architectural decision. Consult Gemini for second opinion.

[Runs: gemini -m gemini-2.5-pro -p "Compare D1 vs KV for user session storage in Cloudflare Workers..."]

Claude (to user): "I've consulted Gemini for a second opinion. Here's what we both think:

My perspective: [Claude's analysis]
Gemini's perspective: [Gemini's analysis]

Key differences: [synthesis]
Recommendation: [combined recommendation]"
```

### Example 2: Security Review Before Commit

```
User: "Ready to commit these auth changes"

Claude (internal): Security-sensitive code. Request Gemini audit.

[Runs: cat src/auth/*.ts | gemini -m gemini-2.5-pro -p "Security audit..."]

Claude (to user): "I've reviewed the code and consulted Gemini for security concerns:

Gemini identified: [security issues]
Additional checks I recommend: [Claude's additions]

Safe to commit after addressing: [list]"
```

### Example 3: Debugging Assistance

```
User: "Still getting this error after trying your suggestions: [error]"

Claude (internal): Two failed attempts. Consult Gemini for fresh perspective.

[Runs: echo "[error details]" | gemini -p "Help debug..."]

Claude (to user): "Let me get a second opinion from Gemini...

Gemini suggests: [Gemini's diagnosis]
This makes sense because: [Claude's analysis]
Let's try: [combined solution]"
```

---

## Troubleshooting & Known Issues

### Issue 1: Not Authenticated

**Error**: `Error: Not authenticated`

**Solution**:
```bash
gemini
# Follow authentication prompts
```

### Issue 2: Model Not Found

**Error**: `Error: Model not found: gemini-2.5-flash-lite`

**Cause**: Model deprecated or renamed

**Solution**:
```bash
# Use stable models
gemini -m gemini-2.5-flash -p "Your question"
gemini -m gemini-2.5-pro -p "Your question"
```

### Issue 3: Rate Limit

**Error**: `Error: Rate limit exceeded`

**Solution**: Wait 1-5 minutes, then retry

**Prevention**: Space out requests

### Issue 4: Large File Context

**Error**: File too large for context

**Solution**: Use `--all-files` carefully or pipe specific sections

```bash
# Instead of:
gemini --all-files -p "Review everything"

# Do:
cat src/specific-file.ts | gemini -p "Review this file"
```

### Issue 5: Command Hangs

**Cause**: Interactive mode when expecting non-interactive

**Solution**: Always use `-p` flag for non-interactive commands

```bash
# ✅ Correct
gemini -p "Question"

# ❌ Wrong (will hang waiting for input)
gemini "Question"
```

---

## Production Best Practices

### 1. Always Use `-p` for Automation

```bash
# ✅ Good for scripts
gemini -p "Question"

# ❌ Bad for scripts (interactive)
gemini
```

### 2. Select Model Based on Criticality

```bash
# Architecture/security → Pro
gemini -m gemini-2.5-pro -p "[critical question]"

# Debugging/review → Flash
gemini -m gemini-2.5-flash -p "[general question]"
```

### 3. Provide Context in Prompts

```bash
# ✅ Good
gemini -p "Context: Building Cloudflare Worker. Question: Best auth pattern? Considerations: 1) Stateless, 2) JWT, 3) <100ms overhead"

# ❌ Bad
gemini -p "Best auth?"
```

### 4. Pipe File Content for Reviews

```bash
# ✅ Good
cat src/auth.ts | gemini -p "Review for security"

# ❌ Inefficient
gemini -p "Review src/auth.ts" # Gemini has to read file separately
```

### 5. Handle Errors Gracefully

```bash
# Add error handling
if output=$(gemini -p "Question" 2>&1); then
  echo "Gemini says: $output"
else
  echo "Gemini consultation failed, proceeding with Claude's recommendation"
fi
```

### 6. Synthesize, Don't Just Forward

**❌ BAD**: Just paste Gemini's response
```
User: "Should I use D1?"
Claude: [runs gemini] "Gemini says: [paste]"
```

**✅ GOOD**: Synthesize both perspectives
```
User: "Should I use D1?"
Claude: [runs gemini]
"I've consulted Gemini for a second opinion:

My analysis: [Claude's perspective]
Gemini's analysis: [Gemini's perspective]
Key differences: [synthesis]
Recommendation: [unified answer]"
```

---

## Version History

**2.0.0** (2025-11-13):
- Complete rewrite for official Gemini CLI (removed gemini-coach wrapper)
- Direct CLI integration patterns
- Simplified to core use cases
- Updated command examples for `gemini` CLI v0.13.0+

**1.0.0** (2025-11-08):
- Initial release with gemini-coach wrapper
- Production testing and experimentation
- 8+ documented errors prevented

---

## Related Skills

- [google-gemini-api](../google-gemini-api/) - Gemini API integration via SDK
- [google-gemini-embeddings](../google-gemini-embeddings/) - Gemini embeddings for RAG
- [google-gemini-file-search](../google-gemini-file-search/) - Managed RAG with Gemini

---

## License

MIT - See [LICENSE](../../LICENSE)

---

## Support

- **Issues**: https://github.com/jezweb/claude-skills/issues
- **Email**: jeremy@jezweb.net
- **Official Gemini CLI**: https://github.com/google-gemini/gemini-cli
