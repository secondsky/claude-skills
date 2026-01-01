# Phase 3: User Experience - Deep Dive

Extended guidance for understanding users and designing great experiences.

---

## User Persona Questions

**Primary Users**:
- "Describe a specific person who will use this. What's their name, role, daily routine?"
- "What's their technical sophistication level?"
- "What are they trying to accomplish when they use this?"

**User Segments**:
- "How do different user types differ in their needs?"
- "What do novice users need that experts don't?"
- "What do power users need that casual users don't?"

**User Context**:
- "Where are users when they use this? (desk, mobile, noisy environment)"
- "What device(s) do they use?"
- "How much time do they have? (rushed vs. focused)"

---

## User Flow Questions

**Happy Path**:
- "Walk me through the ideal user journey from start to finish."
- "What are the key decision points?"
- "How long should this take? What's the target?"

**Alternative Paths**:
- "What are the common variations of this flow?"
- "What do users do when they change their mind midway?"
- "How do users recover from mistakes?"

**Edge Cases**:
- "What happens when the user has no data yet?"
- "What happens when the user has too much data?"
- "What happens when the user is interrupted midway?"

---

## UI State Questions

**Loading States**:
- "What do users see while waiting?"
- "How do we indicate progress? (spinner, skeleton, percentage)"
- "What's the maximum acceptable wait time?"

**Empty States**:
- "What do users see when there's no data?"
- "How do we guide them to populate it?"
- "What's the first-run experience?"

**Error States**:
- "What errors can users encounter?"
- "What do the error messages say? (exact copy)"
- "What actions can users take to recover?"

**Success States**:
- "How do we confirm success?"
- "What's the celebration moment?"
- "What's the next action after success?"

---

## Cognitive Load Questions

**Mental Models**:
- "What concepts must users understand to use this?"
- "What metaphors are we using? (folders, cards, streams)"
- "What prior experience can users draw on?"

**Learning Curve**:
- "How long until a new user is productive?"
- "What's the 'aha moment' when things click?"
- "What's the most confusing part for new users?"

**Memory Load**:
- "How much must users remember vs. what's shown?"
- "What context do users need to maintain across sessions?"
- "How do we reduce cognitive burden?"

---

## Emotion Mapping Questions

**Emotional Journey**:
- "How should users feel at each step of the flow?"
- "Where might users feel frustrated? Confused? Delighted?"
- "What moments should feel magical?"

**Trust Building**:
- "What builds user trust in this product?"
- "What might make users suspicious or hesitant?"
- "How do we communicate reliability and safety?"

**Delight Opportunities**:
- "Where can we exceed expectations?"
- "What small touches would surprise and delight?"
- "What makes this feel premium vs commodity?"

---

## Failure Recovery Questions

**Error Prevention**:
- "How do we prevent errors before they happen?"
- "What validation happens in real-time vs on submit?"
- "How do we guide users toward valid input?"

**Error Messages**:
- "What exactly does the error message say?"
- "Does it explain what went wrong AND how to fix it?"
- "Is the tone helpful, not blaming?"

**Undo & Recovery**:
- "Can users undo actions? Which ones?"
- "How long do they have to undo?"
- "What happens when undo isn't possible?"

---

## Accessibility Questions

**Standards**:
- "What WCAG level are we targeting? (A, AA, AAA)"
- "Are there legal requirements? (ADA, Section 508)"
- "What assistive technologies must we support?"

**Keyboard Navigation**:
- "Can everything be done with keyboard only?"
- "What's the tab order?"
- "Are there keyboard shortcuts for power users?"

**Screen Readers**:
- "What will screen readers announce for each element?"
- "Are images described with alt text?"
- "Are dynamic changes announced?"

**Visual Design**:
- "What's the contrast ratio for text?"
- "Can users resize text without breaking layout?"
- "Is color alone never used to convey meaning?"

---

## Persona Development Template

```markdown
## Persona: [Name]

**Demographics**:
- Role: [Job title/role]
- Age range: [X-Y]
- Technical skill: [Novice/Intermediate/Expert]

**Goals**:
- Primary goal: [What they're trying to accomplish]
- Secondary goals: [Other objectives]

**Pain Points**:
- Current frustration: [What's painful today]
- Fear: [What they want to avoid]

**Context**:
- Device: [Desktop/Mobile/Tablet]
- Environment: [Office/Home/On-the-go]
- Time available: [Rushed/Focused]

**Quote**: "[Something this persona might say]"
```

---

## Red Flags to Watch For

- **No specific personas**: "Our users are everyone"
- **Assumption of expertise**: Designing for yourself, not actual users
- **Happy path only**: No consideration of errors or edge cases
- **Ignoring accessibility**: "We'll add it later"
- **No user research**: "We know what users want"
- **Feature bloat**: Adding features without removing complexity

When you encounter these, probe deeper and advocate for the user.
