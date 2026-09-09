# Humanize Writing

A Claude Code skill that rewrites AI-generated or AI-sounding text so it reads like a knowledgeable human wrote it on the first try. It detects and removes the recognizable "smell" of AI writing — not any single word, but the combination of predictable structure, hedge-then-assert phrasing, relentless parallelism, significance inflation, and tidy bows on every section.

## When Claude Uses This Skill

Claude will automatically suggest this skill when you're working with:

- Text that "sounds like AI," "sounds like ChatGPT," or is "too robotic"
- Requests to "humanize this," "de-AI this," or "make it sound human / natural"
- Content that "doesn't sound like a person wrote it"

## What the Skill Fixes

The skill runs content through eight editing passes:

1. **Structure tells** — formulaic section shapes, repeated takeaways, "Despite these challenges..." loops
2. **Significance inflation & promotional language** — "pivotal moment," "vibrant," "nestled," "testament to"
3. **AI vocabulary** — "delve," "landscape," "tapestry," "leverage," "myriad" (full list in `references/ai-tells.md`)
4. **Grammar-level patterns** — copula avoidance ("serves as" → "is"), superficial -ing analyses, synonym cycling, false ranges
5. **Rhythm and style** — metronomic sentence length, em dash and boldface overuse, emoji decoration
6. **Hedging, filler, and vague attributions** — "It's important to note," "Experts believe," chatbot artifacts
7. **Connective tissue** — "Moreover," "Furthermore," "That said" used as crutches
8. **Human texture and soul** — opinions, first person where it fits, specific detail, natural mess

After rewriting, it reports a short summary table of what changed per pass. It can also review without rewriting: flagging specific passages, naming the pattern each one triggers, and suggesting concrete alternatives.

The pattern catalog is based on [Wikipedia's "Signs of AI writing" guide](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) and editorial best practices.

## Installation

**Claude Code** (native):

```
/plugin marketplace add secondsky/claude-skills
/plugin install humanize-writing@claude-skills
```

**Codex CLI** (native, via `.codex-plugin/` manifest):

```
codex plugin marketplace add secondsky/claude-skills
```

**Other harnesses** (Cursor, Codex, opencode, Gemini CLI):

```
npx skills add secondsky/claude-skills --skill humanize-writing
```

## Credits

Adapted from [jpeggdev/humanize-writing](https://github.com/jpeggdev/humanize-writing) (MIT). Skill content preserved with frontmatter adapted to this marketplace's conventions.
