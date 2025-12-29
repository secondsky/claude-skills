---
name: bun:init
description: Initialize a new Bun project with optional framework selection
arguments:
  - name: project-name
    description: Name of the project to create
    required: false
  - name: template
    description: Template to use (hono, next, nuxt, sveltekit, tanstack, basic)
    required: false
---

# Bun Project Initialization

Initialize a new Bun project with the best configuration for the selected template.

## Process

1. **Determine project type** - Ask user if template not specified
2. **Create project structure** - Use appropriate scaffolding
3. **Configure for Bun** - Ensure Bun-optimized settings
4. **Install dependencies** - Run `bun install`
5. **Initialize git** - Set up git repository
6. **Show next steps** - Guide user on what to do next

## Templates

### Basic (default)
```bash
bun init
```
Creates minimal Bun project with TypeScript.

### Hono
```bash
bun create hono {project-name}
```
Creates Hono API project optimized for Bun.

### Next.js
```bash
bunx create-next-app@latest {project-name}
```
Creates Next.js project with Bun package manager.

### Nuxt
```bash
bunx nuxi@latest init {project-name}
```
Creates Nuxt 3 project with Bun runtime.

### SvelteKit
```bash
bunx sv create {project-name}
```
Creates SvelteKit project with Bun adapter.

### TanStack Start
```bash
bunx create-tanstack-start@latest {project-name}
```
Creates TanStack Start full-stack React project.

## Post-Initialization

After scaffolding, apply these Bun-specific optimizations:

1. **Update package.json scripts** to use `bun --bun` where beneficial
2. **Create bunfig.toml** with recommended settings
3. **Add .gitignore** entries for Bun-specific files
4. **Configure TypeScript** for Bun types

## Example bunfig.toml

```toml
[install]
auto-install = true

[run]
bun = true

[test]
coverage = true
```

## Questions to Ask

If template not provided:
- "What type of project do you want to create?"
  - API/Backend (Hono)
  - React Full-Stack (Next.js or TanStack Start)
  - Vue Full-Stack (Nuxt)
  - Svelte Full-Stack (SvelteKit)
  - Basic TypeScript

If project name not provided:
- "What should the project be called?"

## Success Output

After initialization, display:
1. Project structure summary
2. Key files created
3. Available scripts
4. Command to start development
