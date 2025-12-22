# AI Strengths Comparison

Quick reference for choosing the right AI for consultation.

---

## At a Glance

| Capability | Gemini 2.5 Pro | OpenAI Codex | Fresh Claude |
|------------|----------------|--------------|--------------|
| **Web Search** | ✅ Google Search | ❌ No | ❌ No |
| **Extended Thinking** | ✅ Yes | ⚠️ Basic | ⚠️ Basic |
| **Grounding** | ✅ Source verification | ❌ No | ❌ No |
| **Repo-Aware** | ⚠️ Manual (`@path`) | ✅ Auto-scan | ⚠️ Manual (Read) |
| **Fresh Perspective** | ⚠️ Okay | ⚠️ Okay | ✅ Best |
| **Cost** | 💰 ~$0.10-0.50 | 💰 ~$0.05-0.30 | ✅ Free |
| **Speed** | ⚠️ Slower | ⚠️ Medium | ✅ Fast |
| **Context Window** | 1M tokens | ~128k tokens | 200k tokens |
| **Latest Docs** | ✅ Search | ❌ Knowledge cutoff | ❌ Knowledge cutoff |

---

## Decision Matrix

### Use Gemini When:

✅ **Need web research**
- Latest documentation
- Recent blog posts
- Stack Overflow discussions
- Security advisories (CVEs)
- Framework changelogs

✅ **Complex reasoning needed**
- Architectural decisions
- Trade-off analysis
- Multi-step debugging

✅ **Need verification**
- Security implementations
- Best practices validation
- Compliance requirements

**Example scenarios**:
- "Is this JWT implementation secure by 2025 standards?"
- "What's the recommended way to structure microservices?"
- "Latest React 19 patterns for this use case?"

---

### Use Codex When:

✅ **Repo-aware analysis needed**
- Consistency checks across files
- Finding similar patterns
- Impact assessment
- Duplicate code detection

✅ **Code review**
- Code smells
- Refactoring opportunities
- Design patterns
- Test coverage

✅ **OpenAI reasoning preferred**
- Strong general reasoning
- Pattern recognition
- Code quality assessment

**Example scenarios**:
- "Review this codebase for performance bottlenecks"
- "Find all places where this pattern is used"
- "Check consistency with existing code style"

---

### Use Fresh Claude When:

✅ **Quick second opinion**
- Fast turnaround needed
- Simple questions
- Sanity checks

✅ **Budget-friendly**
- No API cost
- Unlimited consultations

✅ **Fresh perspective**
- Breaking out of mental rut
- Challenging assumptions
- Obvious things overlooked

**Example scenarios**:
- "Am I missing something obvious?"
- "Quick sanity check on this approach"
- "Is my logic sound here?"

---

## Cost vs. Value

### Gemini ($0.10-0.50)

**Worth it when**:
- Need latest docs/patterns (web search)
- Security critical
- Architecture decision
- Stuck on complex problem

**Not worth it when**:
- Simple logic bug
- No need for external knowledge
- Budget is tight

---

### Codex ($0.05-0.30)

**Worth it when**:
- Need repo-wide analysis
- Consistency matters
- Impact assessment needed
- Already have OpenAI setup

**Not worth it when**:
- Small single-file bug
- Don't need repo context
- Have Gemini API but not OpenAI

---

### Fresh Claude (Free)

**Worth it when**:
- Always (it's free!)
- Quick questions
- Fresh perspective needed
- No external knowledge needed

**Not worth it when**:
- Need web research (can't do it)
- Need latest docs (knowledge cutoff)
- Need grounding/verification

---

## Combination Strategies

### First → Second → Third

**Strategy 1: Free → Paid if needed**
1. Try Fresh Claude (free, fast)
2. If still stuck → Gemini (web research)
3. If still stuck → Codex (different reasoning)

**Strategy 2: Paid for complex problems**
1. Try Gemini (most capable)
2. If need repo context → Codex
3. If want third opinion → Fresh Claude

**Strategy 3: Budget-conscious**
1. Try Fresh Claude (free)
2. Try Codex (cheaper, ~$0.05-0.30)
3. Try Gemini only if necessary (~$0.10-0.50)

---

## Special Capabilities

### Gemini's Unique Features

**Google Search**:
- Finds latest documentation
- Discovers recent blog posts
- Checks Stack Overflow
- Finds security advisories

**Extended Thinking**:
- Complex multi-step reasoning
- Deep analysis
- Trade-off evaluation

**Grounding**:
- Verifies facts against sources
- Cites documentation
- Reduces hallucination

**Use when**: Latest info or complex reasoning critical

---

### Codex's Unique Features

**Repo-Aware**:
- Automatically scans entire directory
- Finds similar patterns
- Checks consistency
- Assesses impact

**Cross-File Analysis**:
- Traces imports
- Finds all usages
- Identifies breaking changes

**Use when**: Codebase context critical

---

### Fresh Claude's Unique Features

**Fresh Perspective**:
- No conversation history bias
- Challenges your assumptions
- Catches obvious mistakes

**Free**:
- Unlimited consultations
- No API cost

**Same Capabilities**:
- Can use Read, Grep, Edit
- Same Claude model
- Just different context

**Use when**: Breaking mental rut or budget matters

---

## When to Consult Multiple AIs

**Scenario 1: High-stakes decision**
- Architecture choice for new system
- Security implementation
- Performance optimization

**Process**:
1. Gemini (web research + thinking)
2. Codex (repo consistency check)
3. Fresh Claude (sanity check)
4. Synthesize all three perspectives

**Cost**: ~$0.15-0.80 total
**Value**: High confidence in critical decision

---

**Scenario 2: Stuck after one AI**
- Consulted Gemini, still stuck
- Need different perspective

**Process**:
1. Already tried Gemini
2. Try Codex (different reasoning style)
3. Or Fresh Claude (fresh perspective)

**Cost**: +$0.05-0.30 or free
**Value**: Different angle may unlock solution

---

**Scenario 3: Validation**
- Implemented solution from Gemini
- Want second opinion

**Process**:
1. Gemini suggests solution
2. Fresh Claude validates (free)
3. Proceed if both agree

**Cost**: Original Gemini + free validation
**Value**: Confidence in solution

---

## Summary

**Default choice**: **Fresh Claude** (free, fast, fresh perspective)

**Upgrade to Gemini when**: Need web research, latest docs, complex reasoning

**Upgrade to Codex when**: Need repo-wide analysis, consistency checks

**Multiple AIs when**: High-stakes decisions, still stuck, need validation

---

**Last Updated**: 2025-11-07
**Source**: planning/multi-ai-consultant-spec.md
