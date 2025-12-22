# Mutation Testing Skill

Validate test effectiveness with Stryker (TypeScript) and mutmut (Python).

## Overview

Expert guidance for mutation testing - finding weak tests by introducing deliberate code mutations and checking if tests catch them.

## Core Concept

- **Mutants**: Small code changes introduced automatically
- **Killed**: Test fails with mutation (good)
- **Survived**: Test passes with mutation (weak test)
- **Score**: Percentage killed (aim for 80%+)

## When to Use

- Validate test effectiveness
- Find weak assertions
- Improve test quality
- After achieving high code coverage
- Before major releases

## Tools Supported

- **Stryker** (TypeScript/JavaScript)
- **mutmut** (Python)

## Quick Start

```bash
# TypeScript (Stryker)
bunx stryker run
open reports/mutation/html/index.html

# Python (mutmut)
uv run mutmut run
uv run mutmut results
```

## Auto-Trigger Keywords

- mutation testing
- test effectiveness
- weak tests
- stryker
- mutmut
- test validation
- code mutations

## Source

Adapted from [laurigates/dotfiles](https://github.com/laurigates/dotfiles)
