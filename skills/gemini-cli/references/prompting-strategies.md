# AI-to-AI Prompting Best Practices

All gemini-coach commands use AI-to-AI prompting format (based on systematic testing)

---

## Format Structure

```
[Claude Code consulting Gemini for peer review]

Task: [Specific task description]

Provide direct analysis with file:line references. I will synthesize your
findings with mine before presenting to the developer.
```

---

## Why This Format Works

1. **Prevents Role Confusion**: Gemini knows it's advising Claude, not the human developer
2. **Reduces Chattiness**: More direct, less "helpful assistant" framing
3. **Better Output**: File:line references, concrete suggestions  
4. **Peer Review Dynamic**: Two AI systems collaborating

---

## Comparison

**❌ Old Format** (less effective):
```
You're an expert security researcher. Review this code for vulnerabilities...
```
- More verbose
- "Helpful assistant" tone
- Chattier responses

**✅ New Format** (recommended):
```
[Claude Code consulting Gemini for peer review]

Task: Security review - identify vulnerabilities...

Provide direct analysis. I will synthesize findings.
```
- Clear AI-to-AI context
- Direct task description
- Concise output

---

## Custom Prompt Template

```bash
gemini "[Claude Code consulting Gemini for peer review]

Task: [Your specific task here - be concrete]

Provide direct analysis with [file:line | code examples | recommendations].
I will synthesize your findings before presenting to developer." \
--yolo -m gemini-2.5-flash
```

**Key Elements**:
1. `[Claude Code consulting Gemini for peer review]` - AI-to-AI context
2. `Task:` - Specific task
3. `Provide direct analysis...` - Output format
4. `I will synthesize...` - Workflow explanation

---

**Source**: Testing documented in `gemini-experiments.md` (Experiment 1)
