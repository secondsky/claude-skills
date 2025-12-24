# Root Cause Tracing Skill

Systematically trace bugs backward through call stack to find original trigger.

## Overview

This skill provides a methodology for tracing bugs that manifest deep in the call stack back to their original source. Instead of fixing symptoms where errors appear, it guides tracing backward through the call chain to fix at the root cause.

## The Tracing Process

1. **Observe the Symptom** - Note where error appears
2. **Find Immediate Cause** - What code directly causes this?
3. **Ask: What Called This?** - Trace the call chain upward
4. **Keep Tracing Up** - What values were passed?
5. **Find Original Trigger** - Where did bad data originate?

## When to Use

- Error happens deep in execution (not at entry point)
- Stack trace shows long call chain
- Unclear where invalid data originated
- Need to find which test/code triggers the problem
- Treating symptoms isn't fixing the issue

## Key Principle

**NEVER fix just where the error appears.** Trace back to find the original trigger, then fix at source. After fixing, add defense-in-depth validation at each layer the data passes through.

## Stack Trace Tips

- Use `console.error()` in tests (not logger - may be suppressed)
- Log BEFORE the dangerous operation, not after it fails
- Include context: directory, cwd, environment variables
- Capture stack with `new Error().stack`

## Auto-Trigger Keywords

- root cause analysis
- stack trace debugging
- call chain tracing
- backward debugging
- symptom vs cause
- original trigger
- data flow tracing
- debug instrumentation

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
