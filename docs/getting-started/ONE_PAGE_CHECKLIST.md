# Skill Compliance Checklist ✅

**Print this page and check off items as you build your skill.**

---

## PRE-BUILD CHECKLIST

Before starting a new skill, verify:

- [ ] Read [START_HERE.md](START_HERE.md) for workflow overview
- [ ] Read [research-protocol.md](../reference/research-protocol.md)
- [ ] Copied template: `cp -r templates/skill-skeleton/ skills/my-skill/`
- [ ] Checked skill doesn't already exist in this repo
- [ ] Checked official Anthropic skills: https://github.com/anthropics/skills
- [ ] Identified target use cases (3-5 concrete examples)
- [ ] Verified this is atomic (one domain, not a bundle)

---

## RESEARCH CHECKLIST

Research completed before building:

- [ ] Checked Context7 MCP for library documentation
- [ ] Verified latest package versions on npm (or via Bun-compatible tooling)
- [ ] Reviewed official documentation (bookmarked URLs)
- [ ] Searched GitHub issues for common problems
- [ ] Built working example project from scratch
- [ ] Documented all errors encountered and fixes
- [ ] Documented research findings

---

## YAML FRONTMATTER CHECKLIST

`SKILL.md` frontmatter is complete and correct:

- [ ] **name**: Present, lowercase hyphen-case (e.g., `my-skill-name`)
- [ ] **name**: Matches directory name exactly
- [ ] **description**: Present and concise (under 150 chars, ideally under 100)
- [ ] **description**: Optimized for system prompt budget (15k chars TOTAL for all 169 skills)
- [ ] **description**: Uses third-person ("This skill should be used when..." not "Use this skill when...")
- [ ] **description**: Includes "Use when" scenarios
- [ ] **description**: Includes keywords (technologies, use cases, error messages)
- [ ] **license**: Present (e.g., `MIT` or `Complete terms in LICENSE.txt`)
- [ ] **allowed-tools** (optional): Included if pre-approving tools
- [ ] **metadata** (optional): Used if custom fields needed

**Example:**
```yaml
---
name: my-skill-name
description: "Provides [technology] knowledge. Use for [use case], [feature], [error]. Keywords: tech, use-case, error"
# Character count: ~100 chars (under 150 target)
license: MIT
---
```

---

## SKILL.MD BODY CHECKLIST

Skill instructions are clear and actionable:

- [ ] Written in **imperative/infinitive form** (verb-first: "To do X, run Y")
- [ ] NOT written in second person (avoid "you should")
- [ ] Quick start section (< 5 minutes to first result)
- [ ] Step-by-step instructions with code examples
- [ ] Configuration examples with actual values
- [ ] Critical rules section ("Always Do" / "Never Do")
- [ ] Common issues section with sources (GitHub issues, etc.)
- [ ] Dependencies clearly listed
- [ ] References to bundled resources (scripts/, references/, assets/)
- [ ] Official documentation links included
- [ ] Package versions documented with "Last Verified" date

---

## BUNDLED RESOURCES CHECKLIST

Resources are properly organized:

- [ ] **scripts/**: Executable code placed here (Python, Bash, etc.)
- [ ] **references/**: Documentation files placed here (schemas, guides)
- [ ] **assets/**: Output files placed here (templates, images, fonts)
- [ ] All resources referenced in SKILL.md body
- [ ] Scripts have proper permissions (chmod +x)
- [ ] No hardcoded secrets or credentials
- [ ] Templates are complete and tested
- [ ] Documentation is current and accurate

---

## README.MD CHECKLIST

Quick reference is complete:

- [ ] Status badge present (Production Ready / Beta / Experimental)
- [ ] Last Updated date current
- [ ] Production tested evidence included
- [ ] Auto-trigger keywords comprehensive
  - [ ] Primary keywords (3-5 exact tech names)
  - [ ] Secondary keywords (5-10 related terms)
  - [ ] Error-based keywords (2-5 common errors)
- [ ] "What This Skill Does" section clear
- [ ] "Known Issues Prevented" table with sources
- [ ] "When to Use / Not Use" sections present
- [ ] Token efficiency metrics documented
- [ ] Quick usage example included

---

## TESTING CHECKLIST

Skill works in practice:

- [ ] Installed skill: `./scripts/install-skill.sh my-skill`
- [ ] Verified symlink: `ls -la ~/.claude/skills/my-skill`
- [ ] Tested auto-discovery: Claude suggests skill when relevant
- [ ] Built example project using skill templates
- [ ] All templates work without errors
- [ ] All scripts execute successfully
- [ ] Configuration files valid
- [ ] Package versions correct
- [ ] HMR/dev server works (if applicable)
- [ ] Production build succeeds (if applicable)
- [ ] Deployed example (if applicable)

---

## COMPLIANCE CHECKLIST

Skill meets official standards:

- [ ] Compared against https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- [ ] Compared against [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)
- [ ] Reviewed [STANDARDS_COMPARISON.md](../reference/STANDARDS_COMPARISON.md)
- [ ] Checked [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md)
- [ ] Referenced working example (tailwind-v4-shadcn or Cloudflare skills)
- [ ] No deprecated patterns used
- [ ] No non-standard frontmatter fields (except allowed-tools, metadata)
- [ ] Writing style consistent (imperative, third-person)

---

## DOCUMENTATION CHECKLIST

All required documentation present:

- [ ] SKILL.md complete
- [ ] README.md complete
- [ ] LICENSE field in frontmatter
- [ ] Research findings documented
- [ ] Templates tested and documented
- [ ] Scripts documented with usage examples
- [ ] References accurate and current
- [ ] Links to official docs work
- [ ] Version numbers current
- [ ] "Last Updated" date accurate

---

## QUALITY GATES CHECKLIST

Before committing:

- [ ] Read entire SKILL.md out loud (catches awkward phrasing)
- [ ] Ask someone unfamiliar to follow instructions (if possible)
- [ ] Built example project in fresh directory
- [ ] No errors in console during development
- [ ] No warnings about deprecated packages
- [ ] Git status clean (no untracked files)
- [ ] Skill name matches directory name
- [ ] All relative paths correct
- [ ] No placeholder text (TODO, FIXME, etc.)
- [ ] No debug code or console.log statements

---

## GIT CHECKLIST

Ready to commit:

- [ ] Working in feature branch (not main)
- [ ] Added skill files: `git add skills/my-skill/`
- [ ] Updated roadmap documentation if needed
- [ ] Commit message descriptive with:
  - [ ] What the skill does
  - [ ] Errors prevented count
  - [ ] Production testing evidence
- [ ] Checked git diff before committing
- [ ] No sensitive data in commit
- [ ] All files have correct permissions

**Commit Template**:
```bash
git commit -m "Add my-skill for [use case]

- Provides [what it does]
- Errors prevented: X
- Package versions: [key-package]@X.Y.Z

Production tested: [evidence/link]
Research documented"
```

---

## POST-COMMIT CHECKLIST

After pushing:

- [ ] Pushed to GitHub: `git push`
- [ ] Created PR if appropriate
- [ ] Updated CHANGELOG.md
- [ ] Verified GitHub Actions pass (if configured)
- [ ] Skill appears in repo
- [ ] README renders correctly on GitHub
- [ ] Links work in GitHub UI
- [ ] Shared with team/community (if applicable)

---

## MAINTENANCE CHECKLIST

Quarterly (every 3 months):

- [ ] Check for package updates: `npm view [package] version`
- [ ] Review GitHub issues for skill-related problems
- [ ] Re-test skill in fresh environment
- [ ] Update "Last Verified" date if still current
- [ ] Update package versions if needed
- [ ] Document breaking changes (if any)
- [ ] Check official Anthropic skills for new patterns

---

## PERIODIC REVIEW ⏰

For maintaining skill quality over time:

- [ ] Run deep-dive review quarterly: `/review-skill <skill-name>`
- [ ] After major package updates: Check GitHub changelog + run review
- [ ] Before marketplace submission: Full audit required
- [ ] Address all 🔴 Critical and 🟡 High issues found
- [ ] Update "Last Verified" date in metadata after review
- [ ] Create research log if significant research performed

**Review Process**: Use this checklist + plugin-dev toolkit for comprehensive validation

---

## FINAL SIGN-OFF

I certify that:

- [ ] ✅ All checklists above are complete
- [ ] ✅ Skill tested and working in production
- [ ] ✅ Compliant with official Anthropic standards
- [ ] ✅ Documentation accurate and current
- [ ] ✅ Token efficiency ≥ 50%
- [ ] ✅ Zero errors from documented issues
- [ ] ✅ Ready for production use

**Skill Name**: ______________________
**Date**: ______________________
**Builder**: ______________________
**Verified By**: ______________________

---

**If all boxes checked: SHIP IT! 🚀**

**If any boxes unchecked**: Go back and complete those items before committing.

---

**Quick Links**:
- [START_HERE.md](START_HERE.md) - Navigation
- [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) - Step-by-step process
- [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md) - What to avoid
- [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) - Example audit
