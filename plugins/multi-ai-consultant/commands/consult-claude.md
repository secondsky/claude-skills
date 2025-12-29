---
name: multi-ai-consultant:consult-claude
description: Consult fresh Claude subagent for unbiased perspective on code problems. Use when stuck in mental rut, need quick second opinion, or want free alternative to external AIs.
allowed-tools:
  - Task
  - Read
---

# Consult Fresh Claude

You are being asked to consult a fresh Claude subagent for a second opinion on a coding problem or architectural decision.

**Why this is useful**: You (the current Claude instance) may have accumulated context biases or locked into a particular approach. A fresh Claude subagent has no conversation history and can provide an unbiased perspective.

## Your Task

1. **Gather Context**: Read relevant files for the problem
2. **Build Prompt**: Create a clear, specific question with context
3. **Launch Subagent**: Use Task tool with general-purpose subagent
4. **Receive Analysis**: Get fresh perspective from subagent
5. **Synthesize**: Compare subagent's analysis with your own reasoning
6. **Present**: Show 5-part synthesis to user
7. **Log Consultation**: Track usage (free, but still log)

---

## Step 1: Gather Context

**You must read relevant files** before launching subagent. The subagent will NOT have access to your conversation history.

```typescript
// Use Read tool to gather context
// For bug: Read the buggy file + related imports
// For architecture: Read key files in the area of concern
```

**Context to gather**:
- The file(s) with the bug or architectural concern
- Related files (imports, dependencies)
- Error messages or logs
- Relevant documentation

**Store context in your working memory** - you'll pass it to the subagent in the prompt.

---

## Step 2: Build Prompt

The prompt must include:
1. **Role**: Tell subagent they're providing a second opinion
2. **Problem statement**: What's wrong or what decision is needed
3. **Question**: Specific question for subagent
4. **Context**: Paste relevant code/files inline
5. **Your analysis**: What the primary Claude instance has tried
6. **Instructions**: Ask for specific format

**Format**:
```
You are providing a second opinion to another Claude Code instance that is stuck on a problem.

Problem: [Brief description]
Question: [Specific question]

Primary Claude's analysis:
- Tried: [What was attempted]
- Current status: [What's happening]
- Hypothesis: [What primary Claude thinks]

Context:

```[language]
[Paste relevant code here]
```

[Additional files or context as needed]

Your task:
1. Analyze the problem with fresh eyes
2. Identify what might have been missed
3. Propose solutions
4. Explain your reasoning
5. Note any risks or trade-offs
```

---

## Step 3: Launch Subagent

Use the **Task tool** with `subagent_type: "general-purpose"`.

```typescript
// Example invocation
Task({
  subagent_type: "general-purpose",
  description: "Fresh perspective on [bug|architecture]",
  prompt: `[Your formatted prompt from Step 2]`
})
```

**Important**:
- Use `general-purpose` subagent (has all tools)
- Keep prompt focused (don't overwhelm with context)
- Ask for specific deliverables
- Give subagent permission to use tools (Read, Grep, etc.) if needed

---

## Step 4: Receive Analysis

The subagent will return a final message with their analysis.

**What to expect**:
- Fresh perspective (no conversation bias)
- May catch things you missed
- May validate your approach
- May suggest completely different direction

**Remember**: The subagent is equally capable but has different context. Neither of you is "right" by default.

---

## Step 5: Synthesize (5-Part Format)

You MUST compare the subagent's analysis with your own reasoning. DO NOT just parrot the subagent's response.

**Required sections**:

### 🤖 My Analysis
- Your original reasoning
- What you tried
- What you think the issue is
- Your proposed solution
- Why you got stuck

### 🔄 Fresh Claude's Analysis
- Subagent's complete response
- Their reasoning
- What they identified
- Their proposed solution

### 🔍 Key Differences
- **Agreement**: Where you and subagent align
- **Divergence**: Where you disagree (explain why)
- **Fresh perspective value**: What did fresh eyes catch?
- **Context advantage**: What did your conversation history help with?
- **Blind spots**: What did each of you miss?

### ⚡ Synthesis
- Combine both perspectives
- Identify root cause (if bug)
- Weigh trade-offs (if architecture)
- Note any conflicting advice and why
- Determine which approach is better (or hybrid)

### ✅ Recommended Action
- Specific, actionable next steps
- File paths and line numbers
- Expected outcome
- Risk assessment
- Why this approach was chosen over alternatives

**End with**: "Should I proceed with this approach?"

---

## Step 6: Log Consultation

```bash
# Create log directory if needed
mkdir -p ~/.claude/ai-consultations

# Log consultation (no cost, but track usage)
echo "$(date -Iseconds),claude-subagent,claude-sonnet-4-5,0,0,0.00,$(pwd)" \
  >> ~/.claude/ai-consultations/consultations.log
```

**Note**: Claude subagents are free (same API call), but we log them to track consultation patterns.

---

## Context Management

**Advantages of Claude subagent**:
- ✅ Free (no additional API cost)
- ✅ Same capabilities as you
- ✅ Can use all tools (Read, Grep, Edit, etc.)
- ✅ Fresh perspective (no conversation bias)
- ✅ Fast (no external API calls)

**Limitations**:
- ❌ No web search (unlike Gemini)
- ❌ No extended thinking mode
- ❌ No grounding/verification
- ❌ Limited by same knowledge cutoff

**When to use Claude subagent**:
- Need fresh eyes on familiar code
- Stuck in a mental rut
- Want quick second opinion
- No need for web research
- Budget-conscious (free)

---

## Example Usage

**Scenario**: State management bug in React app

**Your situation**:
- You've tried 3 different approaches
- Each fix causes new issues
- Convinced the problem is in useEffect
- Spent 20 minutes debugging

**Prompt to subagent**:
```
You are providing a second opinion to another Claude Code instance stuck on a React state bug.

Problem: State updates not reflecting in UI after API call
Question: What's the root cause?

Primary Claude's analysis:
- Tried: Adding state to useEffect dependencies
- Tried: Using useCallback for setState
- Tried: Moving state to parent component
- Current: State updates in console.log but UI doesn't re-render
- Hypothesis: Problem is useEffect dependency array

Context:

```typescript
[Paste component code]
```

Your task: Analyze with fresh eyes. Primary Claude has been focused on useEffect - might be missing something obvious.
```

**Fresh Claude might find**: The component is memoized with `React.memo()` but memo comparison function is incorrect, preventing re-renders. Nothing to do with useEffect.

**Your synthesis would**:
- Acknowledge you tunnel-visioned on useEffect
- Highlight subagent's fresh perspective caught the memo issue
- Note how conversation bias led you astray
- Recommend removing incorrect memo comparison
- Ask user permission to proceed

---

## Error Handling

**Common issues**:
1. **Subagent returns incomplete analysis**: Prompt was too vague, relaunch with clearer instructions
2. **Subagent agrees with you entirely**: May not be helpful, consider external AI with web search
3. **Subagent contradicts but reasoning is flawed**: Trust your deeper context, but investigate their point
4. **Task tool fails**: Check Claude Code CLI status, retry once

**Always**:
- Validate subagent's reasoning (they can be wrong too)
- Combine both perspectives, don't just pick one
- Acknowledge when fresh eyes were helpful
- Acknowledge when your context was crucial

---

## Claude vs Gemini vs Codex

**When to use Fresh Claude**:
- ✅ Quick second opinion needed
- ✅ No budget for external APIs
- ✅ Problem is in code logic (not needing web research)
- ✅ Want fresh perspective on familiar codebase
- ✅ Stuck in mental rut

**When to use Gemini instead**:
- Need web research (latest docs, Stack Overflow, etc.)
- Need extended thinking/reasoning
- Need grounding (verify against sources)
- Complex architectural decisions

**When to use Codex instead**:
- Want OpenAI's perspective specifically
- Already have OpenAI API setup
- Problem involves patterns OpenAI models excel at

---

## Meta-Insight

**This is you asking yourself for help** - but with fresh context. It's like:
- Stepping away from a problem and returning later
- Explaining the problem to a rubber duck
- Getting a coworker to look at your code

**The value is in**:
- Breaking out of cognitive biases
- Challenging assumptions
- Seeing obvious things you overlooked
- Validating or invalidating your approach

**Be honest in synthesis**: If the subagent found something obvious you missed, say so. If they're wrong because they lack context, explain why.

---

## Remember

- ✅ Always gather context before launching subagent
- ✅ Always synthesize (don't parrot)
- ✅ Always log consultation
- ✅ Always ask permission before implementing subagent's suggestions
- ✅ Be honest when fresh eyes find something obvious
- ✅ Be honest when your deeper context was necessary
- ❌ Never assume subagent is always right (they lack conversation context)
- ❌ Never ignore subagent entirely (that's why you consulted them!)
- ❌ Never forget: this is a tool to break cognitive bias, not replace your reasoning

---

**After consultation**: Present synthesis and wait for user approval before implementing any changes.
