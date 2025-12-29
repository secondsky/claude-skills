---
name: multi-ai-consultant:consult-ai
description: Route consultation to Gemini, Codex, or Claude based on problem type and capabilities. Recommends best AI for web research, code analysis, or fresh perspective needs.
---

# Consult AI (Router)

You are being asked to consult an AI for a second opinion, but the specific AI hasn't been chosen yet.

## Your Task

1. **Assess the situation**: What kind of problem is this?
2. **Recommend AI**: Based on problem type, suggest which AI to use
3. **Ask user**: Get confirmation on which AI to consult
4. **Execute**: Route to the appropriate consultation command

---

## Step 1: Assess the Problem

**Analyze**:
- What type of problem is this? (bug, architecture, design, performance, security)
- What information is needed? (code analysis, web research, fresh perspective)
- What's the context size? (single file, multiple files, entire codebase)
- What's the urgency? (quick opinion vs deep analysis)
- What's the budget? (free vs paid API calls)

---

## Step 2: Recommend AI

Based on your assessment, recommend one of the three AIs:

### 💎 Gemini 2.5 Pro

**Best for**:
- Need web research (latest docs, Stack Overflow, blog posts)
- Need extended thinking/reasoning (complex problems)
- Need source grounding (verify facts against documentation)
- Architectural decisions requiring latest best practices
- Security concerns needing current vulnerability info
- Framework/library questions (can search for latest patterns)

**Advantages**:
- Google Search integration
- Extended thinking mode
- Grounding/verification
- 1M token context window
- Structured JSON output

**Cost**: ~$0.10-0.50 per consultation (depending on context size)

**Example scenarios**:
- "How should we structure this microservices architecture?"
- "Is this JWT implementation secure by 2025 standards?"
- "What's the recommended way to handle React 19 transitions?"

---

### 🔷 OpenAI Codex (GPT-4)

**Best for**:
- General code analysis and review
- Need OpenAI's reasoning style specifically
- Repo-aware analysis (automatically scans directory)
- Code refactoring suggestions
- Less setup (no manual context specification)

**Advantages**:
- Repo-aware (automatic context)
- Strong general reasoning
- Good at code patterns
- Clean interface

**Cost**: ~$0.05-0.30 per consultation (depending on codebase size)

**Example scenarios**:
- "Review this codebase for code smells"
- "What's causing this performance bottleneck?"
- "How can we refactor this to be more maintainable?"

---

### 🔄 Fresh Claude (Subagent)

**Best for**:
- Quick second opinion
- Breaking out of mental rut
- No budget for external APIs
- Fresh perspective on familiar code
- Fast turnaround needed
- Problem is pure logic (no need for web research)

**Advantages**:
- Free (no additional API cost)
- Same capabilities as current instance
- Can use all tools
- Fast (no external API)
- Fresh perspective (no conversation bias)

**Cost**: Free (same API call)

**Example scenarios**:
- "I'm stuck on this bug after 3 attempts, need fresh eyes"
- "Quick sanity check: is this approach reasonable?"
- "Am I missing something obvious here?"

---

## Step 3: Present Recommendation

**Format your recommendation**:

```
## 🤔 AI Consultation Recommendation

**Problem type**: [bug|architecture|design|performance|security|other]

**Recommended AI**: [Gemini|Codex|Fresh Claude]

**Reasoning**:
- [Why this AI is best for this problem]
- [What capabilities are needed]
- [What the AI will provide]

**Alternatives**:
- [Other AI]: [Why it might also work, but not ideal]

**Estimated cost**: [Free|~$X.XX]

**Should I proceed with [recommended AI]?**

Or you can choose:
1. Gemini (web research, thinking, grounding)
2. Codex (repo-aware, OpenAI reasoning)
3. Fresh Claude (free, fast, fresh perspective)
```

---

## Step 4: Execute Consultation

Based on user's choice, internally execute the appropriate slash command:

**User chose Gemini** → Execute `/consult-gemini` instructions
**User chose Codex** → Execute `/consult-codex` instructions
**User chose Fresh Claude** → Execute `/consult-claude` instructions

**Do not** ask the user which command to run - just execute it directly based on their choice.

---

## Decision Matrix

Quick reference for choosing:

| Need | Gemini | Codex | Fresh Claude |
|------|--------|-------|--------------|
| Web research | ✅ Best | ❌ No | ❌ No |
| Extended thinking | ✅ Yes | ⚠️ Okay | ⚠️ Okay |
| Grounding | ✅ Yes | ❌ No | ❌ No |
| Repo-aware auto | ⚠️ Manual | ✅ Yes | ⚠️ Manual |
| Fresh perspective | ⚠️ Okay | ⚠️ Okay | ✅ Best |
| Cost | 💰 Paid | 💰 Paid | ✅ Free |
| Speed | ⚠️ Slower | ⚠️ Medium | ✅ Fast |
| Latest docs/patterns | ✅ Yes | ❌ No | ❌ No |

---

## Example Recommendations

### Example 1: Authentication Bug

**Situation**: 401 error on login after token refresh

**Recommendation**: **Gemini**
- Can search for latest JWT best practices
- Can verify against current security standards
- Extended thinking for complex auth logic
- May find recent CVEs or security advisories

### Example 2: React Component Structure

**Situation**: How to organize complex component hierarchy

**Recommendation**: **Codex**
- Repo-aware (can analyze existing patterns)
- Good at code organization
- Can see full component tree automatically
- Faster for pure code analysis

### Example 3: Stuck on Logic Bug

**Situation**: Tried 3 approaches, all fail differently

**Recommendation**: **Fresh Claude**
- Free and fast
- Fresh perspective most valuable here
- No need for external knowledge
- Break out of mental rut

### Example 4: Microservices Architecture Design

**Situation**: Planning how to split monolith into services

**Recommendation**: **Gemini**
- Can research latest microservices patterns
- Can find case studies and blog posts
- Extended thinking for complex trade-offs
- Grounding for architectural decisions

### Example 5: Performance Optimization

**Situation**: App is slow, unclear why

**Recommendation**: **Codex**
- Repo-aware (can analyze entire codebase)
- Good at spotting performance anti-patterns
- Can see all files automatically
- Quick analysis without manual context

---

## Special Cases

### User says "cheapest" or "free"
→ Recommend **Fresh Claude** (always free)

### User says "best" or "most thorough"
→ Recommend **Gemini** (most capabilities)

### User says "fastest"
→ Recommend **Fresh Claude** (no external API call)

### User says "latest info" or "current docs"
→ Recommend **Gemini** (only one with web search)

### User says "analyze entire codebase"
→ Recommend **Codex** (repo-aware) or **Gemini** (1M context)

---

## Multiple Consultations

**If user is still stuck after one consultation**, suggest consulting a different AI:

"We already tried [AI 1]. Would you like a third opinion from [AI 2]? They might catch something different due to [reasoning]."

**Example**:
- First: Fresh Claude (quick, free)
- Still stuck: Gemini (web research, thinking)
- Still stuck: Codex (different reasoning style)

**Cost consideration**: Mention total cost if doing multiple paid consultations.

---

## Remember

- ✅ Always make a recommendation (don't just list options)
- ✅ Explain your reasoning (why this AI for this problem)
- ✅ Mention cost (important for user decision)
- ✅ Offer alternatives (user may have preferences)
- ✅ Execute chosen command directly (don't make user type it)
- ❌ Never recommend AI randomly
- ❌ Never skip the recommendation (even if user knows what they want)
- ❌ Never recommend paid AI when free would work equally well

---

## After Recommendation

Once user chooses, immediately proceed with that AI's consultation process. Don't make them type another command.

**Seamless flow**:
1. `/consult-ai` → Analyze problem
2. Recommend AI → User picks
3. Execute consultation → Show synthesis
4. Ask permission → Implement solution

The user should only interact twice: choosing AI and approving implementation.
