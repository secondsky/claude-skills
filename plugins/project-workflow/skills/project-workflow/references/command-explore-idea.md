# /explore-idea - Pre-Planning Exploration

## Overview

**Purpose:** Collaborative exploration and validation BEFORE committing to implementation

**When to use:**
- You have a rough idea but haven't validated the approach
- Multiple tech options and unsure which fits best
- Want research/validation before detailed planning
- Need scope management to prevent feature creep

## What It Does

1. Engages in free-flowing conversation to understand your vision
2. Conducts heavy research (Explore agents, WebSearch, MCP tools)
3. Validates tech stack and architectural decisions
4. Challenges assumptions and prevents scope creep
5. Creates PROJECT_BRIEF.md with validated decisions
6. Recommends: Proceed/Pause/Pivot
7. Seamlessly hands off to /plan-project if proceeding

## Time Savings

**10-15 minutes per project idea**

Eliminates trial-and-error research and prevents building on invalid assumptions.

## Example Usage

```
User: /explore-idea
Claude: Let's explore your project idea! What are you thinking about building?
User: I want to build a chatbot with memory that runs on Cloudflare
Claude: [Conducts research on Cloudflare Durable Objects vs D1 for memory...]
Claude: [Validates approach, creates PROJECT_BRIEF.md]
Claude: Based on research, I recommend proceeding with Durable Objects for memory...
```

## Integration

- **Outputs to**: `/plan-project` (if validated as feasible)
- **Generates**: PROJECT_BRIEF.md
- **Uses**: Explore agents, WebSearch, MCP tools
- **Best followed by**: `/plan-project` when recommended to proceed

## When to Load This Reference

Load this reference when:
- First time using /explore-idea
- Need to understand the research/validation workflow
- Want to see example conversation flow
- Explaining the command to team members
