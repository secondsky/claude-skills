## Central thesis

Working with strong agentic models makes an old distinction practical: **the map is not the territory**.

- **Map:** prompts, skills, context, specs, artifacts, and the representation of work supplied to the model.
- **Territory:** the real codebase, production system, real-world constraints, prior work, design taste, and actual implementation environment.
- **Unknowns:** the gap between the map and the territory. Whenever the agent hits an unknown, it guesses what the user wants.

As models become better, quality becomes bottlenecked less by raw model capability and more by the user’s ability to clarify unknowns. Planning helps, but planning is not enough because new unknowns can appear deep in implementation or reveal that the original problem framing was wrong.

## Unknowns taxonomy

| Category | Extracted meaning | How to reduce it |
|---|---|---|
| Known knowns | What the user has explicitly put in the prompt | Preserve, restate, and test against it |
| Known unknowns | Things the user knows they have not figured out | Ask, research, or parameterize |
| Unknown knowns | Things too obvious for the user to write down, but recognizable when seen | Brainstorm, prototype, mock, compare, and get reactions |
| Unknown unknowns | Things the user has not considered at all; missing knowledge or quality standards | Blindspot passes, codebase search, internet/domain research, references, expert-like explainers |

## Operating stance: help the agent help you

The article frames prompting as a balance:

- If too specific, the agent may follow instructions even when a pivot would be better.
- If too vague, the agent fills gaps with generic best practices that may not fit the task.
- The solution is to give the agent context about the user’s starting point: experience level, familiarity with the codebase/domain, current thinking, and where help is needed.

The agent should be treated as a thought partner that can search code, search the internet, iterate quickly, and teach missing vocabulary.

## Pre-implementation patterns

### 1. Blind spot pass

Use when entering a new code area, unfamiliar work, or a domain where the user may not know what questions to ask.

Goal: ask the agent to uncover **unknown unknowns**, explain them, and help the user prompt better.

Useful outputs:

- hidden constraints and potholes
- historical work or prior attempts
- quality standards the user may not know
- questions the user did not know to ask
- a rewritten prompt that incorporates the discoveries

### 2. Brainstorms and prototypes

Use when the user has many **unknown knowns**: criteria they cannot articulate but can recognize when shown.

Goal: make taste, scope, and implementation-shaping preferences visible before real implementation makes them expensive to change.

Typical moves:

- create several divergent design directions
- mock UI with fake data before wiring real routes/state/backend
- search the codebase and brainstorm possible interventions from cheap to ambitious
- use HTML artifacts when visualization helps

### 3. Interviews

Use after brainstorming when unknowns remain.

Goal: have the agent interview the user one question at a time, prioritizing questions whose answers would materially change architecture, implementation, product scope, or UX.

### 4. References

Use when describing the desired result in language would be lossy or inefficient.

Goal: point the agent at a reference implementation, design component, module, library, website section, diagram, or documentation and ask it to understand the semantics before adapting or porting.

The article stresses that source code is often the best reference because it contains richer structure, behavior, and edge cases than a screenshot or prose description.

### 5. Implementation plans

Use when ready to implement.

Goal: ask for an implementation plan that leads with the parts the human is likely to tweak, such as data models, type interfaces, UX flows, or user-facing behavior. Mechanical refactoring can be buried below if the agent can handle it.

## During implementation pattern

### Implementation notes

Planning cannot remove every unknown. The agent may discover edge cases and constraints while building.

Goal: maintain a temporary `implementation-notes.md` or `.html` that records decisions and deviations during the run.

Useful log fields:

- what the plan said
- what the code revealed
- conservative choice made
- why it was safe to continue
- what to revisit next time

## Post-implementation patterns

### Pitches and explainers

Use after the work exists and needs approval.

Goal: package prototypes, specs, and implementation notes into a doc that accelerates reviewer understanding and approvals. The best doc leads with the demo and pre-answers objections experts are likely to raise.

### Quizzes

Use after long agent sessions where the model may have done more than the human realizes.

Goal: generate an explanatory report and quiz so the human can verify they understand the changes before merge. The article’s standard is to merge only after passing the quiz perfectly.

## End-to-end example extracted from the article

The article describes launching a Fable video edited by an agentic coding tool. The process followed the unknowns loop:

1. Start from knowns: code can edit/transcribe videos, but accuracy is uncertain.
2. Ask the agent to explain transcription/Whisper and whether cuts like pauses or filler words can be handled with ffmpeg.
3. Prototype timed UI with Remotion and a transcription to see if the concept works.
4. Encounter visual quality unknowns around color grading.
5. First try variations, then realize the deeper unknown is not knowing what good color grading looks like.
6. Ask the agent to teach color grading vocabulary and quality standards.

## Skill design implications

This package turns the article into an agent skill by making each article pattern operational:

- Article idea: “blindspot pass” → Skill mode with cards, severity, evidence, prompt upgrades.
- Article idea: prototypes reveal unknown knowns → Skill mode with divergent directions and reaction templates.
- Article idea: interview after brainstorming → Skill mode that asks one question at a time by blast radius.
- Article idea: references beat descriptions → Skill mode that requires a semantics map before implementation.
- Article idea: plans should expose likely changes → Skill mode that sorts plans by human-tweak likelihood.
- Article idea: unknowns appear during implementation → Skill mode for implementation notes and deviation logs.
- Article idea: shipping needs buy-in → Skill mode for pitch/explainer docs.
- Article idea: quiz before merge → Skill mode for merge-readiness reports and quizzes.

## Practical maxim

Every explainer, brainstorm, interview, prototype, reference, implementation note, pitch, and quiz is a cheap way to discover what was missing before that missing context becomes expensive to fix.
