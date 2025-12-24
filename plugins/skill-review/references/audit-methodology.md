# Audit Methodology - skill-review

This document contains the detailed methodology, audit phases, validation rules, and error prevention catalog for the skill-review skill.

---

## 15-Phase Audit Process

The skill-review performs a systematic 15-phase deep-dive audit:

1. **Pre-review Setup** - Initialize environment, load skill files, verify directory structure
2. **Standards Compliance** - Exact YAML validation rules against official Anthropic specifications
3. **Official Docs Verification** - Context7/WebFetch to validate against current official documentation
4. **Code Examples Audit** - Verify all code examples are syntactically correct and use current APIs
5. **Cross-File Consistency** - Check consistency between SKILL.md, README.md, and reference files
6. **Dependency Version Checks** - Verify package versions are current using npm view
7. **Progressive Disclosure Architecture Review** - Validate proper use of references/ structure
8. **Conciseness & Degrees of Freedom Audit** - Check for over-explanation and unnecessary constraints
9. **Anti-Pattern Detection** - Identify outdated patterns, deprecated APIs, or incorrect usage
10. **Testing & Evaluation Review** - Verify production testing claims and evaluation metrics
11. **Security & MCP Considerations** - Check for security issues and MCP server compatibility
12. **Issue Categorization by Severity** - Classify findings as 🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low
13. **Resource Inventory & Coverage Audit** - Mandatory check of existing references before condensation
14. **Fix Implementation** - Auto-fix unambiguous issues, ask user only for architectural decisions
15. **Post-Fix Verification** - Validate all changes, verify YAML syntax, run skill discovery tests

---

## Official Claude Best Practices Enforced

The skill-review enforces these official Anthropic standards:

### YAML Frontmatter Standards
- **name**: Maximum 64 characters, lowercase with hyphens only
- **description**: Maximum 1,024 characters
- **license**: MIT (recommended)
- Valid metadata fields only (no custom undocumented fields)

**⚠️ System Prompt Budget**: Claude Code has a 15,000 character TOTAL budget across ALL installed skills combined (not per skill). With 114 skills in this repository, average description must be <130 chars to fit within budget. Verbose descriptions cause random skills to be silently omitted. Keep descriptions <100 chars. Source: https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/

### SKILL.md File Standards
- **Line count**: <500 lines maximum
- **Writing style**: Third-person, imperative/infinitive verb forms
- **Progressive disclosure**: Maximum one level deep (references/)
- **Multi-model testing**: Must be verified across different Claude versions

### Code Quality Standards
- All code examples must be syntactically valid
- Use current API versions (check official docs)
- No Windows-specific paths (use forward slashes)
- No hardcoded credentials or sensitive data
- Consistent terminology throughout

### Reference File Standards
- H2 (##) as top-level headings in reference files
- Clear "Load when..." instructions in SKILL.md
- No circular dependencies between references
- Each reference <500 lines (encourage splitting if needed)

---

## Error Prevention Catalog

The skill-review prevents these common documentation issues:

### Documentation Issues
- **Outdated documentation**: Content that doesn't match current package versions
- **Incorrect API patterns**: Examples using deprecated or incorrect API calls
- **Contradictory examples**: Code that conflicts with explanatory text
- **Version drift**: Examples referencing old package versions
- **Broken links**: Dead links to external resources or internal references
- **Stale "Last Verified" dates**: Dates >3 months old without version checks
- **Verbose descriptions**: >200 chars contributing to system prompt budget exhaustion (15k char TOTAL across all skills)

### Technical Issues
- **YAML errors**: Invalid YAML frontmatter syntax
- **Schema inconsistencies**: Violating official skill schema
- **Missing dependencies**: Imports/requires without package.json entries
- **Windows paths**: Backslashes instead of forward slashes
- **TODO markers**: Unresolved TODO/FIXME comments in production code
- **Inconsistent terminology**: Using different terms for same concept

### Structure Issues
- **Over-explained content**: Unnecessary verbosity violating progressive disclosure
- **Missing progressive disclosure**: Monolithic SKILL.md instead of references/
- **Circular references**: Reference files that depend on each other
- **Orphaned files**: Files in repository not referenced from SKILL.md

---

## Verification Methodology

The skill-review combines multiple verification approaches:

### Automated Technical Checks
- **YAML syntax validation**: Parse YAML frontmatter programmatically
- **Package version checks**: Use `npm view <package>@latest version`
- **Link validation**: HTTP HEAD requests to external URLs
- **TODO marker detection**: Grep for TODO/FIXME/XXX patterns
- **Character counting**: Validate frontmatter description ≤1,024 chars
- **Line counting**: Validate SKILL.md <500 lines

### AI-Powered Verification
- **Context7 MCP**: Query official documentation for current APIs
- **WebFetch**: Fetch and analyze official changelog/migration guides
- **Code analysis**: Verify example code matches official patterns
- **Semantic consistency**: Check explanations match code examples

### Output Format
- **Severity classification**: 🔴 Critical / 🟡 High / 🟠 Medium / 🟢 Low
- **Evidence citations**: GitHub issue URLs, official docs, npm changelogs
- **Detailed remediation plan**: Specific file/line changes required
- **Auto-fix capability**: Straightforward fixes applied automatically

---

## Production Testing Verification

The skill-review has been production-tested on real audits:

### better-auth v2.0.0 Audit (2025-11-08)
- **Critical/High issues found**: 6
- **Incorrect code removed**: 665 lines
- **Correct patterns added**: 1,931 lines
- **Breaking changes detected**: Session handling API, plugin system
- **Migration guide created**: Complete v1 → v2 upgrade path

This demonstrates the skill's ability to:
- Detect major version breaking changes
- Identify large-scale incorrect patterns
- Generate comprehensive remediation plans
- Create developer-friendly migration guides

---

**Related**: See `audit-report-template.md` for the standard output format and `multi-skill-tracking.md` for batch audit workflows.
