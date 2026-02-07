# START HERE 👋

**Welcome to claude-skills!** This is your entry point for building production-ready skills for Claude Code.

---

## 0️⃣ Prerequisites (REQUIRED)

**Install official plugin development tools first**:

```bash
/plugin install plugin-dev@claude-code-marketplace
```

This provides foundational knowledge for hooks, MCP, structure, agents, commands, and skills.

**Then proceed to**:
- [PLUGIN_DEV_BEST_PRACTICES.md](PLUGIN_DEV_BEST_PRACTICES.md) - Repository workflows
- [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) - 5-minute skill creation

---

## What Do You Want To Do?

### 🆕 Build a New Skill

**Option 1: Official Plugin-Dev Workflow** (Recommended for first-timers):
```bash
# Use guided creation workflow (8 phases with validation)
/plugin-dev:create-plugin
```

**What you get**:
- Step-by-step guidance through plugin creation
- Automatic scaffolding (SKILL.md, plugin.json, README.md)
- Built-in validation and quality checks
- Access to official skills for hooks, MCP, agents

**When to use**: First time, need structure guidance, want hooks/MCP/agents

---

**Option 2: Manual Repository Workflow** (5 minutes for experienced users):
1. Copy the template: `cp -r templates/skill-skeleton/ skills/my-skill-name/`
2. Fill in the TODOs in `SKILL.md` and `README.md`
3. Add your resources (scripts, references, assets)
4. Install locally: `./scripts/install-skill.sh my-skill-name`
5. Test by mentioning it to Claude Code
6. Verify with [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md)

**When to use**: Building 2nd+ skill, fast iteration, repository-specific needs

**Detailed Workflow**: See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) | [PLUGIN_DEV_BEST_PRACTICES.md](PLUGIN_DEV_BEST_PRACTICES.md)

---

### ✅ Verify an Existing Skill

**Compliance Check**:
- Use [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) for quick verification
- See [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) for example audit
- Check against [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)

---

### 🔬 Research Before Building

**Research Protocol**:
1. Read [planning/research-protocol.md](planning/research-protocol.md)
2. Check Context7 MCP for library docs
3. Verify latest package versions on npm
4. Document findings in `planning/research-logs/`
5. Build working example first

---

### 📚 Understand the Standards

**Official Documentation**:
- Anthropic Skills Repo: https://github.com/anthropics/skills
- Agent Skills Spec: [anthropics/skills/agent_skills_spec.md](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)
- Our Standards Doc: [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)
- Comparison: [STANDARDS_COMPARISON.md](../reference/STANDARDS_COMPARISON.md)

---

### 📝 Learn From Examples

**Working Examples**:
- **Gold Standard**: `~/.claude/skills/tailwind-v4-shadcn/`
- **Cloudflare Suite** (7 production skills):
  - cloudflare-d1
  - cloudflare-d1
  - cloudflare-r2
  - cloudflare-kv
  - cloudflare-workers-ai
  - cloudflare-vectorize
  - cloudflare-queues
- **Official Examples**: https://github.com/anthropics/skills

---

## Quick Reference Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  START: I want to build a skill for [technology]           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 1. RESEARCH                  │
        │ • Check Context7 MCP         │
        │ • Verify package versions    │
        │ • Build working example      │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 2. COPY TEMPLATE             │
        │ cp -r templates/skill-       │
        │   skeleton/ skills/my-skill/ │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 3. FILL TODOS                │
        │ • Edit SKILL.md frontmatter  │
        │ • Write instructions         │
        │ • Add README keywords        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 4. ADD RESOURCES             │
        │ • scripts/ (executable code) │
        │ • references/ (docs)         │
        │ • assets/ (templates)        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 5. TEST LOCALLY              │
        │ ./scripts/install-skill.sh   │
        │ • Ask Claude to use skill    │
        │ • Verify discovery works     │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 6. VERIFY COMPLIANCE         │
        │ Check ONE_PAGE_CHECKLIST.md  │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 7. COMMIT                    │
        │ • git add skills/my-skill    │
        │ • git commit with details    │
        │ • git push                   │
        └──────────────────────────────┘
```

---

## Key Files Quick Reference

| File | Purpose | When To Read |
|------|---------|--------------|
| **START_HERE.md** (this file) | Navigation hub | Always (entry point) |
| **CLAUDE.md** | Project context | When working on this repo |
| **ONE_PAGE_CHECKLIST.md** | Quick verification | Before committing |
| **QUICK_WORKFLOW.md** | 5-minute process | Building new skill |
| **templates/SKILL-TEMPLATE.md** | Copy-paste starter | Building new skill |
| **[claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)** | Official standards | Understanding requirements |
| **[research-protocol.md](../reference/research-protocol.md)** | Research process | Before building skill |
| **CLOUDFLARE_SKILLS_AUDIT.md** | Example audit | Learning compliance |

---

## Project Status (2025-11-20)

### ✅ Completed (169 skills) - All Production-Ready!

All 169 skills are complete, tested, and available. View full list:
- **README.md** - Complete skill listing with descriptions
- **CLAUDE.md** - Organized by category (26 Cloudflare, 10 AI, 7 Frontend, etc.)
- **skills/** directory - Run `ls skills/` to see all

**Recent Additions**:
- OpenAI Agents SDK, Claude Agent SDK, Google Gemini API
- TinaCMS, Sveltia CMS for content management
- TypeScript MCP, FastMCP for MCP server development
- Project Planning, Session Management for workflow automation
- Vercel platform skills (KV, Blob, Neon Postgres)

**Skill Categories**:
- Cloudflare Platform (26 skills)
- AI & Machine Learning (10 skills)
- Frontend & UI (7 skills)
- Auth & Security (3 skills)
- Content Management (2 skills)
- Database & ORM (4 skills)
- Tooling & Planning (4 skills)

---

## Common Questions

**Q: Where do I start after clearing context?**
A: Read this file, then go to [CLAUDE.md](CLAUDE.md) for project context.

**Q: How do I know if my skill is correct?**
A: Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) - if all boxes check, you're good!

**Q: Where are the templates?**
A: `templates/skill-skeleton/` - copy this entire directory to start a new skill.

**Q: What if I forget the workflow?**
A: See [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) for step-by-step instructions.

**Q: How do I verify against official Anthropic standards?**
A: See [STANDARDS_COMPARISON.md](../reference/STANDARDS_COMPARISON.md)

---

## Need Help?

1. Check [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md) for what NOT to do
2. Look at existing skills in `skills/` directory for working examples
3. Review [CONTRIBUTING.md](../guides/CONTRIBUTING.md) for contribution guidelines
4. Open an issue: https://github.com/secondsky/claude-skills/issues

---

## External Resources

- **Official Anthropic Skills**: https://github.com/anthropics/skills
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/skills
- **Support Articles**:
  - [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
  - [Creating custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- **Engineering Blog**: [Equipping agents with skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

---

**Ready to build?** Start with the quick workflow above or dive into [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) for details!

**Questions about the project?** Read [CLAUDE.md](CLAUDE.md) for full context.

**Just need to verify?** Check [ONE_PAGE_CHECKLIST.md](ONE_PAGE_CHECKLIST.md) and you're done.
