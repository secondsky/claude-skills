# Archive: Historical Design Review Approaches

**Status**: Archived for reference
**Date Archived**: 2025-11-20
**Current Approach**: See [../SKILL.md](../SKILL.md)

---

## About This Archive

This directory contains previous approaches to design reviews that were used before the consolidated **design-review Claude Code skill** was created. These files are preserved for historical reference and may contain useful patterns or insights.

### Archived Files

1. **design-review-agent.md** - Agent configuration with tool list and methodology
2. **design-review-slash-command.md** - Slash command approach
3. **design-review-claude-md-snippet.md** - CLAUDE.md integration snippet
4. **README-workflow.md** - Original workflow documentation

---

## Current Approach

**The design-review skill has replaced these approaches** by:

1. **Consolidating all content** into a single, comprehensive skill
2. **Following official Claude Code skill standards** (YAML frontmatter, progressive disclosure)
3. **Integrating with existing skills** (playwright-testing, chrome-devtools)
4. **Providing structured outputs** (report templates, checklists)
5. **Ensuring discoverability** through comprehensive keywords

### Migration Summary

**Content from design-review-agent.md:**
- ✅ 7-phase methodology migrated to SKILL.md
- ✅ Communication principles (problems over prescriptions) migrated
- ✅ Triage matrix (Blocker/High/Medium/Nitpick) migrated
- ✅ Tool references updated to use skills (playwright-testing, chrome-devtools)

**Content from design-principles-example.md:**
- ✅ S-Tier design checklist migrated to references/design-principles-s-tier.md
- ✅ Design philosophy integrated into references/visual-polish.md
- ✅ Typography, spacing, color guidance preserved

**Content from slash-command approach:**
- ✅ Workflow patterns integrated into SKILL.md
- ✅ Review structure preserved in assets/review-report-template.md

**Content from CLAUDE.md snippet:**
- ✅ Project-level integration guidance preserved
- ✅ Workflow documentation updated in README.md

---

## Why These Approaches Were Archived

### 1. Agent Configuration (design-review-agent.md)

**Previous approach:**
- Defined as an agent with tool list and model specification
- Required manual configuration for each project

**Why replaced:**
- Claude Code skills are more discoverable (YAML frontmatter)
- Skills follow official Anthropic standards
- Skills use progressive disclosure (load only what's needed)
- Skills integrate better with the Claude Code ecosystem

### 2. Slash Command (design-review-slash-command.md)

**Previous approach:**
- Required user to invoke `/design-review` manually
- Slash command expanded to full prompt

**Why replaced:**
- Skills are automatically discovered based on keywords
- No manual invocation needed ("review the design" triggers skill)
- Skills provide better structure (YAML metadata, reference files)
- Skills follow repository conventions

### 3. CLAUDE.md Snippet (design-review-claude-md-snippet.md)

**Previous approach:**
- Project-specific integration via CLAUDE.md file
- Required copying snippet to each project

**Why replaced:**
- Skill is globally available across all projects
- No per-project setup required
- Easier to maintain (update skill once, all projects benefit)
- Skills can still be customized per-project if needed

---

## Using Archived Content

**If you want to reference these approaches:**

1. **For agent configuration patterns:** See design-review-agent.md for detailed tool lists and agent structure
2. **For slash command syntax:** See design-review-slash-command.md for command formatting
3. **For CLAUDE.md integration:** See design-review-claude-md-snippet.md for project-specific customization

**However, we recommend:**
- Using the current design-review skill (../SKILL.md)
- Following the 7-phase methodology as documented
- Using the provided templates (../assets/)
- Referencing the detailed guides (../references/)

---

## Evolution of Design Review Approach

### v1.0 (Agent Configuration)
- Manual agent configuration per project
- Tool list and methodology in agent prompt
- Flexible but required setup

### v2.0 (Slash Command)
- User-invoked slash command
- Expanded prompt with full instructions
- Easier invocation, still manual

### v3.0 (CLAUDE.md Snippet)
- Project-level integration
- Automatic for projects with snippet
- Required per-project setup

### v4.0 (Claude Code Skill) ← **Current**
- Official Claude Code skill structure
- YAML frontmatter for discoverability
- Progressive disclosure (references/)
- Global availability
- Standards-compliant
- Integration with other skills

---

## Questions or Issues?

If you're looking for specific content from archived files:

1. **7-phase methodology:** See [../SKILL.md](../SKILL.md)
2. **WCAG checklist:** See [../references/accessibility-wcag.md](../references/accessibility-wcag.md)
3. **Design principles:** See [../references/visual-polish.md](../references/visual-polish.md) and [../references/design-principles-s-tier.md](../references/design-principles-s-tier.md)
4. **Browser tools:** See [../references/browser-tools-reference.md](../references/browser-tools-reference.md)
5. **Report templates:** See [../assets/review-report-template.md](../assets/review-report-template.md)

---

**Last Updated**: 2025-11-20
**Maintainer**: Claude Skills Repository
