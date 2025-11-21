# Claude Skills - Project Context

**Repository**: https://github.com/secondsky/claude-skills
**Purpose**: Production-ready skills for Claude Code CLI
**Owner**: Claude Skills Maintainers
**Status**: Active Development | 114 Skills Complete
**Last Updated**: 2025-11-20
**Last Audit**: 2025-11-20 (Baseline: 100% Pass)

---

## What This Repository Is

This is a curated collection of **production-tested Claude Code skills** for building modern web applications. Skills are modular capabilities that extend Claude's knowledge in specific domains, enabling faster development with fewer errors.

**Focus**: Claude Code CLI skills (not claude.ai web interface)

**Target Audience**: Developers building with Cloudflare, React, Tailwind v4, and AI integrations.

---

## Quick Navigation

**👋 First Time Here?** → Read [START_HERE.md](START_HERE.md)
**🔨 Building a Skill?** → See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
**✅ Verifying Work?** → Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

## ⚠️ CRITICAL: Skill Review Process

**ALWAYS use the `skill-review` skill when reviewing skills in this repository.**

When asked to review skills:
1. **DO NOT** manually check versions/dates
2. **DO** use the installed `skill-review` skill which provides a 14-phase comprehensive audit
3. The skill-review skill is located at `skills/skill-review/SKILL.md`
4. It covers: version accuracy, date freshness, documentation quality, error catalog completeness, template validation, and more

Example: "Review the cloudflare-worker-base skill" → Use skill-review skill, not manual inspection

---

## ⚠️ CRITICAL: Manual Review & Refactoring Process

**ALWAYS use MANUAL approaches when reviewing and refactoring skills.**

### What This Means:

**✅ ALLOWED:**
- Using existing scripts in `scripts/` directory (e.g., `review-skill.sh`, `check-versions.sh`)
- Using standard tools: Read, Edit, Write, Grep, Glob, Bash
- Manual analysis and judgment
- Reading files to understand structure
- Using skill-review skill (which is a skill, not automation)

**❌ FORBIDDEN:**
- Creating NEW Python/shell scripts to automate refactoring
- Using sed/awk to programmatically rewrite large sections
- Batch processing multiple files without human review of each change
- Auto-generating content via scripts
- ANY automation that bypasses manual review of changes

### Why Manual Process is Required:

1. **Human Judgment**: Skills require context-aware decisions about what to extract vs keep
2. **Quality Control**: Each change must be reviewed for accuracy and clarity
3. **Consistency**: Manual review ensures adherence to skill standards
4. **Traceability**: Manual changes are easier to review in PRs
5. **Error Prevention**: Automation can introduce subtle errors that break skills

### Correct Refactoring Process (Manual):

**Phase 13: Fix Implementation** from skill-review skill:

1. **Read & Analyze** (Manual):
   - Read entire SKILL.md
   - Identify sections >100 lines that can be extracted
   - Determine what MUST stay in SKILL.md (Quick Start, Top 3-5 errors)

2. **Extract Sections** (Manual):
   - Read the section to extract
   - Copy content to new `references/<name>.md` file using Write tool
   - Review extracted content for completeness

3. **Update SKILL.md** (Manual):
   - Read current section in SKILL.md
   - Use Edit tool to replace with:
     - Brief summary (2-3 sentences)
     - Pointer: "Load `references/<name>.md` when..."
   - Review the edit to ensure clarity

4. **Add "When to Load References"** (Manual):
   - Use Edit tool to add new section explaining WHEN to load each reference
   - This is the KEY section for Claude to know what to load when

5. **Verify** (Manual):
   - Read final SKILL.md
   - Count lines: should be <500
   - Check all pointers are correct
   - Ensure "When to Load References" section is clear

**Time Estimate**: 30 min - 2 hours per skill (depending on complexity)
**This is INTENTIONAL** - quality over speed!

---

## Official Standards We Follow

This repo aligns with **official Anthropic standards**:

- **Official Skills Repo**: https://github.com/anthropics/skills
- **Agent Skills Spec**: [agent_skills_spec.md](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- **Skill Creator Guide**: [skill-creator/SKILL.md](https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md)
- **Our Standards Doc**: [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md)
- **Comparison**: [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

**Last Verified**: 2025-10-29

---

## Directory Structure

```
claude-skills/
├── START_HERE.md                 # ← Read this first!
├── CLAUDE.md                     # ← You are here
├── ONE_PAGE_CHECKLIST.md         # Quick verification
├── QUICK_WORKFLOW.md             # 5-minute skill creation
├── README.md                     # Public-facing overview
├── CONTRIBUTING.md               # Contribution guidelines
├── CLOUDFLARE_SKILLS_AUDIT.md    # Example compliance audit
├── ATOMIC-SKILLS-SUMMARY.md      # Skill philosophy
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
│
├── skills/                       # ← All production skills (114 total)
│   ├── tailwind-v4-shadcn/       # Gold standard example
│   ├── cloudflare-worker-base/   # Foundation skill
│   ├── ai-sdk-core/              # AI integration
│   ├── openai-agents/            # OpenAI Agents SDK
│   ├── project-planning/         # Planning automation
│   └── [108 more skills...]      # Run ls skills/ for full list
│
├── templates/                    # ← Templates for new skills
│   ├── SKILL-TEMPLATE.md         # Copy-paste SKILL.md starter
│   ├── README-TEMPLATE.md        # Copy-paste README starter
│   └── skill-skeleton/           # Complete directory to copy
│       ├── SKILL.md
│       ├── README.md
│       ├── scripts/
│       ├── references/
│       └── assets/
│
├── planning/                     # Planning & research docs
│   ├── claude-code-skill-standards.md
│   ├── research-protocol.md
│   ├── skills-roadmap.md
│   ├── verification-checklist.md
│   ├── STANDARDS_COMPARISON.md
│   ├── COMMON_MISTAKES.md
│   └── research-logs/            # Per-skill research
│
├── scripts/                      # Automation scripts
│   ├── install-skill.sh          # Symlink skill to ~/.claude/skills/
│   ├── install-all.sh            # Install all skills
│   └── check-versions.sh         # Verify package versions
│
└── examples/                     # Working example projects
    └── cloudflare-worker-base-test/
```

---

## Current Status (2025-11-20)

### ✅ Completed Skills (114)

**Baseline Audit (2025-11-20):** All 114 skills passed automated validation with 100% compliance. Zero critical/high/medium issues detected in structure, YAML frontmatter, or file organization.

All 114 skills are production-ready and organized by domain:

**Cloudflare Platform** (23 skills):
- cloudflare-worker-base, cloudflare-d1, cloudflare-r2, cloudflare-kv
- cloudflare-workers-ai, cloudflare-vectorize, cloudflare-queues, cloudflare-workflows
- cloudflare-durable-objects, cloudflare-agents, cloudflare-mcp-server, cloudflare-turnstile
- cloudflare-nextjs, cloudflare-cron-triggers, cloudflare-email-routing
- cloudflare-hyperdrive, cloudflare-images, cloudflare-browser-rendering
- cloudflare-zero-trust-access, cloudflare-full-stack-scaffold, cloudflare-full-stack-integration
- cloudflare-manager, cloudflare-sandbox

**AI & Machine Learning** (19 skills):
- ai-sdk-core, ai-sdk-ui, openai-api, openai-agents, openai-assistants, openai-responses
- google-gemini-api, google-gemini-embeddings, google-gemini-file-search, gemini-cli
- claude-api, claude-agent-sdk, thesys-generative-ui, elevenlabs-agents
- ai-elements-chatbot, better-chatbot, better-chatbot-patterns
- multi-ai-consultant, nano-banana-prompts

**Frontend & UI** (25 skills):
- tailwind-v4-shadcn, react-hook-form-zod, tanstack-query, zustand-state-management
- nextjs, hono-routing, firecrawl-scraper, inspira-ui, aceternity-ui, shadcn-vue
- base-ui-react, auto-animate, motion, nuxt-v4, nuxt-ui-v4, frontend-design
- tanstack-router, tanstack-start, tanstack-table, pinia-v3, pinia-colada
- ultracite, zod, hugo, wordpress-plugin-core

**Auth & Security** (2 skills):
- clerk-auth, better-auth

**Content Management** (4 skills):
- sveltia-cms, nuxt-content, nuxt-seo, content-collections

**Database & ORM** (4 skills):
- drizzle-orm-d1, neon-vercel-postgres, vercel-kv, vercel-blob

**Tooling & Development** (37 skills):
- **Planning & Project Management**: project-planning, project-session-management, project-workflow
- **MCP & Integration**: typescript-mcp, fastmcp, mcp-dynamic-orchestrator, mcp-management
- **Code Quality**: skill-review, code-review, dependency-upgrade, verification-before-completion
- **Testing**: jest-generator, playwright-testing, vitest-testing, mutation-testing, test-quality-analysis, api-testing
- **Architecture & Patterns**: api-design-principles, architecture-patterns, microservices-patterns
- **Debugging & Analysis**: systematic-debugging, root-cause-tracing, sequential-thinking, defense-in-depth-validation
- **Automation**: github-project-automation, open-source-contributions, claude-code-bash-patterns
- **Tools**: chrome-devtools, swift-best-practices, claude-hook-writer, turborepo
- **Feature Development**: feature-dev, design-review
- **WooCommerce**: woocommerce-backend-dev, woocommerce-code-review, woocommerce-copy-guidelines, woocommerce-dev-cycle

**Quality Standards**:
- ✅ All production-tested
- ✅ Fully compliant with official Anthropic standards
- ✅ 100% pass rate on automated baseline audit (2025-11-20)
- ✅ Package versions verified current
- ✅ Average token savings: 60-70%
- ✅ 395+ documented errors prevented across all skills

**Audit Details:**
- Last Baseline Audit: 2025-11-20
- Automated validation: 114/114 skills passed
- Issues found: 0 Critical, 0 High, 0 Medium
- Next reviews: Tier 1 foundation skills (manual verification)
- Full report: `planning/COMPREHENSIVE_REVIEW_SUMMARY.md`

---

## Development Workflow

### Standard Workflow (From Scratch)

```
1. RESEARCH
   • Read planning/research-protocol.md
   • Check Context7 MCP for library docs
   • Verify latest package versions (npm view)
   • Document in planning/research-logs/

2. TEMPLATE
   • Copy: cp -r templates/skill-skeleton/ skills/new-skill/
   • Fill TODOs in SKILL.md
   • Fill TODOs in README.md
   • Add resources (scripts/, references/, assets/)

3. TEST
   • Install: ./scripts/install-skill.sh new-skill
   • Test discovery: Ask Claude Code to use skill
   • Build example project to verify templates work

4. VERIFY
   • Check ONE_PAGE_CHECKLIST.md
   • Compare with planning/claude-code-skill-standards.md
   • Run check-versions.sh if applicable

5. COMMIT
   • git add skills/new-skill
   • git commit -m "Add new-skill for [use case]"
   • Update planning/skills-roadmap.md
   • git push

6. MARKETPLACE
   • Generate marketplace: ./scripts/generate-marketplace.sh
   • Verify: jq '.plugins | length' .claude-plugin/marketplace.json
   • git add .claude-plugin/marketplace.json scripts/generate-marketplace.sh
   • git commit -m "Update marketplace with new-skill"
   • git push
```

### Quick Workflow (Experienced)

```bash
# 1. Copy template
cp -r templates/skill-skeleton/ skills/my-skill/

# 2. Edit SKILL.md and README.md (fill TODOs)
# 3. Add resources

# 4. Test
./scripts/install-skill.sh my-skill

# 5. Verify & Commit
git add skills/my-skill && git commit -m "Add my-skill" && git push

# 6. Update marketplace
./scripts/generate-marketplace.sh
git add .claude-plugin/marketplace.json && git commit -m "Update marketplace with my-skill" && git push
```

---

## Key Principles

### 1. Atomic Skills Philosophy
- **One skill = One domain** (e.g., D1 database, not "all Cloudflare services")
- **Composable**: Claude combines skills automatically
- **Reusable**: Same skill works across different frameworks
- **Maintainable**: Update one skill, benefits all use cases

### 2. Production Quality
- All skills must be **tested in production**
- Package versions must be **current** (verified regularly)
- Known issues must be **documented with sources** (GitHub issues, etc.)
- Token efficiency must be **measured** (≥50% savings)

### 3. Official Standards Compliance
- YAML frontmatter: `name` and `description` (required)
- Optional fields: `license`, `allowed-tools`, `metadata`
- Directory structure: `scripts/`, `references/`, `assets/` (official)
- Writing style: Imperative/infinitive form, third-person descriptions
- See [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)

### 4. Progressive Disclosure
- **Metadata** (name + description): Always in context (~100 words)
- **SKILL.md body**: Loaded when skill triggers (<5k words)
- **Bundled resources**: Loaded as needed by Claude

---

## Commands & Scripts

Note: Bun is the preferred runtime and package manager for Node-based workflows in this repo. npm/pnpm examples remain supported equivalents.

### Installing Skills

```bash
# Install single skill (creates symlink to ~/.claude/skills/)
./scripts/install-skill.sh cloudflare-worker-base

# Install all skills
./scripts/install-all.sh

# Verify installation
ls -la ~/.claude/skills/
```

### Development

```bash
# Check package versions
./scripts/check-versions.sh skills/cloudflare-worker-base/

# Create new skill from template
cp -r templates/skill-skeleton/ skills/new-skill-name/
```

### Testing

```bash
# After installing skill, ask Claude Code:
"Use the cloudflare-worker-base skill to set up a new project"

# Claude should discover and propose using the skill automatically
```

### Git Workflow

```bash
# Create feature branch
git checkout -b add-new-skill

# Make changes
git add skills/new-skill/
git commit -m "Add new-skill for [use case]

- Description of what it does
- Token savings: ~XX%
- Errors prevented: X

Production tested: [evidence]"

# Push and create PR
git push origin add-new-skill
```

---

## Quality Standards

### Before Committing (Checklist)

Use [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) to verify:

- [ ] YAML frontmatter valid (name + description)
- [ ] Description includes "Use when" scenarios
- [ ] Keywords comprehensive (technologies, use cases, errors)
- [ ] Third-person description style
- [ ] Instructions in imperative form
- [ ] Resources organized (scripts/, references/, assets/)
- [ ] Templates tested and working
- [ ] Package versions current
- [ ] Known issues documented with sources
- [ ] LICENSE field present (MIT)
- [ ] README.md has auto-trigger keywords
- [ ] Tested in ~/.claude/skills/
- [ ] Token efficiency measured (≥50%)

### Compliance Verification

Compare against:
1. [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md) - Our standards
2. [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md) - Official vs ours
3. [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) - Example audit
4. https://github.com/anthropics/skills - Official reference

---

## Token Efficiency Metrics

**Why This Matters**: Skills save massive amounts of tokens by preventing trial-and-error.

| Scenario | Without Skill | With Skill | Savings |
|----------|---------------|------------|---------|
| Setup Tailwind v4 + shadcn | ~15k tokens, 2-3 errors | ~5k tokens, 0 errors | ~67% |
| Cloudflare Worker setup | ~12k tokens, 1-2 errors | ~4k tokens, 0 errors | ~67% |
| D1 Database integration | ~10k tokens, 2 errors | ~4k tokens, 0 errors | ~60% |
| **Average** | **~12k tokens** | **~4.5k tokens** | **~62%** |

**Errors Prevented**: All 6-8 documented errors per skill = 100% error prevention

---

## Common Pitfalls to Avoid

See [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) for detailed examples.

**Quick List**:
- ❌ Missing YAML frontmatter (skill invisible to Claude)
- ❌ Non-standard frontmatter fields (use only name, description, license, allowed-tools, metadata)
- ❌ Second-person descriptions ("You should..." instead of "This skill should be used when...")
- ❌ Vague descriptions (no "Use when" scenarios)
- ❌ Missing keywords (reduces discoverability)
- ❌ Outdated package versions
- ❌ Untested templates
- ❌ No production validation

---

## External Resources

### Official Anthropic
- **Skills Repository**: https://github.com/anthropics/skills
- **Skills Spec**: https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- **Skill Creator**: https://github.com/anthropics/skills/blob/main/skill-creator/SKILL.md
- **Engineering Blog**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

### Support Articles
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)

### Claude Code Docs
- **Skills Documentation**: https://docs.claude.com/en/docs/claude-code/skills
- **Overview**: https://docs.claude.com/en/docs/claude-code/overview

---

## Maintenance

### Regular Tasks

**Quarterly** (Every 3 months):
- Check package versions: `scripts/check-versions.sh`
- Update to latest stable versions
- Re-test all skills
- Update "Last Verified" dates

**When Package Updates**:
- Check breaking changes in changelog
- Update skill templates
- Test thoroughly
- Document migration if needed

**When Standards Change**:
- Review official Anthropic skills repo
- Update planning/claude-code-skill-standards.md
- Update planning/STANDARDS_COMPARISON.md
- Audit existing skills for compliance

---

## Getting Help

**Documentation Issues?**
- Check [START_HERE.md](START_HERE.md) for navigation
- Read [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md)
- Review working examples in `skills/` directory

**Technical Issues?**
- Open issue: https://github.com/secondsky/claude-skills/issues
- Email: maintainers@example.com
- Check official Claude Code docs

**Want to Contribute?**
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Use templates in `templates/`
- Follow [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md)
- Verify with [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

---

## Project Goals

### Short Term (Next 3 Months)
- Complete Batch 2 skills (clerk-auth, hono-routing, react-hook-form-zod)
- Add Batch 3 (tanstack-query)
- Maintain 100% compliance with official standards
- Keep all package versions current

### Long Term (Next Year)
- Expand to 20+ production skills
- Community contributions
- Validation/packaging scripts (à la Anthropic)
- Automated testing for skill discovery
- Public skill marketplace compatibility

---

## Success Metrics

**Quality**:
- ✅ 100% compliance with official Anthropic standards
- ✅ All skills production-tested
- ✅ Package versions current (checked quarterly)
- ✅ Zero reported errors from documented issues

**Efficiency**:
- ✅ Average 60%+ token savings
- ✅ 100% error prevention (vs manual setup)
- ✅ Sub-5-minute skill creation (with templates)
- ✅ First-try skill discovery rate: 95%+

**Adoption**:
- ✅ 9 skills in production
- ✅ GitHub stars: Growing
- ✅ Community contributions: Welcome
- ✅ Deployed examples: Verified working

---

**Last Updated**: 2025-11-12
**Next Review**: 2026-02-12 (Quarterly)
**Maintainer**: Claude Skills Maintainers | maintainers@example.com | https://github.com/secondsky/claude-skills
