# Interview Techniques - Deep Dive

Cross-cutting skills for conducting effective specification interviews.

---

## Contradiction Detection

### Pattern Recognition
Watch for contradictions between:
- What the plan says vs what the person says
- Earlier answers vs later answers
- Stated priorities vs implied priorities
- Written requirements vs verbal clarifications

### Surfacing Technique
When you detect a contradiction:

1. **State both positions neutrally**:
   "Earlier you mentioned [X], but just now you said [Y]."

2. **Ask for clarification without judgment**:
   "Help me understand how these fit together."

3. **Accept either resolution**:
   "Which is correct, or are they both true in different contexts?"

### Example Phrases
- "I want to make sure I understand correctly. You said [X] earlier, and now [Y]. Which takes priority?"
- "These seem to conflict. Is there something I'm missing that reconciles them?"
- "The plan says [X], but you're describing [Y]. Should we update the plan?"

---

## Follow-Up Probing

### The "5 Whys" Technique
Keep asking "why" to get to root causes:
1. "Why do you need that feature?"
2. "Why is that important?"
3. "Why does that matter to users?"
4. "Why can't they do that today?"
5. "Why is now the right time to solve this?"

### The "Give Me An Example" Technique
Abstract answers become concrete with examples:
- "Can you give me a specific example of when that would happen?"
- "Walk me through a real scenario where a user would do that."
- "What would that look like in practice?"

### The "What If" Technique
Test edge cases and assumptions:
- "What if [assumption] is wrong?"
- "What if [edge case] happens?"
- "What if users don't do what we expect?"

### The "How Would You Know" Technique
Make success measurable:
- "How would you know if this is working?"
- "What would you see that tells you it's broken?"
- "What metric would prove this was worth building?"

---

## Thread Tracking

### The Open Loop Method
Keep a mental (or actual) list of topics to return to:
1. When an answer reveals complexity, note it
2. Continue with current topic to completion
3. Return to open loops before concluding

### Example Phrases
- "I want to come back to something you mentioned earlier about [X]."
- "Before we move on, let's revisit the point about [Y]."
- "That reminds me of something you said earlier. Can we connect those?"

### When to Open a Thread
- Answer mentions something unexpected
- Answer is vague and needs detail later
- Answer conflicts with earlier information
- Answer reveals a risk or constraint

---

## Assumption Surfacing

### Technique
Make implicit beliefs explicit:
1. Listen for assumptions embedded in statements
2. Ask about them directly without judgment
3. Document confirmed assumptions

### Common Hidden Assumptions
- "Users will..." (How do you know?)
- "The system can..." (Has this been verified?)
- "We'll have time to..." (What if we don't?)
- "They'll understand..." (What if they don't?)

### Example Phrases
- "It sounds like you're assuming [X]. Is that correct?"
- "What if [assumption] turns out to be wrong?"
- "Have we validated that [assumption] is true?"
- "What evidence do we have for [assumption]?"

---

## Summarization Checkpoints

### When to Summarize
- After every 3-5 questions
- When transitioning between phases
- After complex or contradictory discussions
- Before making major conclusions

### Summarization Template
"Let me confirm my understanding:
- [Key point 1]
- [Key point 2]
- [Key point 3]
Is that accurate, or did I miss something?"

### Benefits of Summarizing
- Confirms understanding before building on it
- Gives the interviewee a chance to correct
- Shows you're actively listening
- Creates natural transitions between topics

---

## Adaptive Depth

### Reading Complexity Signals
**Go Deeper When**:
- Answers reveal unexpected complexity
- Interviewee uses hedging language ("maybe", "probably")
- Multiple stakeholders have different views
- Answer contradicts previous information
- High-risk areas are mentioned casually

**Move Faster When**:
- Topic is well-documented in the plan
- Answers are confident and consistent
- Area is low-risk and straightforward
- Interviewee's expertise is clear

### Depth Adjustment Phrases
**To Go Deeper**:
- "Let's explore that more. Tell me about..."
- "That sounds important. Can you elaborate?"
- "I want to make sure I understand the nuances here."

**To Move Faster**:
- "That's clear. Let's move on to..."
- "Good, that matches what the plan says. Next question..."
- "That makes sense. What about..."

---

## Handling Difficult Responses

### Vague Answers
- "Can you be more specific?"
- "What would that look like in practice?"
- "Give me a concrete example."

### "I Don't Know" Answers
- "Who would know?"
- "What would you need to find out?"
- "What's your best guess, and how confident are you?"

### Overly Long Answers
- "Let me make sure I captured the key point: [summary]"
- "That's helpful. The core of it is [summary], right?"
- "To summarize that..."

### Defensive Responses
- "I'm not questioning the decision, just trying to understand it fully."
- "This is great context. Help me understand [specific aspect]."
- "I want to document this accurately. Could you clarify..."

---

## Question Sequencing

### Funnel Technique
Start broad, then narrow:
1. "Tell me about the overall goal."
2. "What are the main components?"
3. "Let's dive into [specific component]."
4. "What about [specific edge case within that component]?"

### Reverse Funnel
Start specific, then broaden:
1. "Walk me through this specific scenario."
2. "How does this relate to the broader system?"
3. "What other scenarios follow a similar pattern?"
4. "What's the general principle here?"

### Phase Transitions
When moving between interview phases:
- "Great, I have a good understanding of [previous phase topic]. Now let's talk about [new phase topic]."
- "Before we move on, is there anything else about [previous topic] I should know?"

---

## Signs the Interview Is Going Well

- Answers are getting more specific, not vaguer
- Interviewee is actively thinking, not reciting
- New information is emerging, not just repeating the plan
- Contradictions are being resolved, not ignored
- Both parties are learning something

## Signs the Interview Needs Adjustment

- Interviewee seems frustrated or defensive
- Answers are becoming more vague
- Same ground is being covered repeatedly
- Important topics are being avoided
- Time is running out with major gaps remaining
