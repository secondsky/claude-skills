# GitHub Issue Templates Guide

**Created**: 2026-02-07
**Status**: Active
**Location**: `.github/ISSUE_TEMPLATE/`

## Overview

This repository uses 7 skill-specific GitHub issue templates to guide users in reporting bugs, proposing features, and requesting optimizations. Unlike generic templates, these are tailored to the unique characteristics of Claude Code skills.

## Available Templates

### 1. Skill Bug Report (`skill-bug-report.yml`)
**Purpose**: Report incorrect or outdated skill content/instructions

**Use when**:
- Package versions in skills are outdated
- Code templates don't work
- Instructions are incorrect or conflict with official docs
- Missing error documentation

**Key fields**:
- Plugin/Skill Name
- Skill Version (from plugin.json)
- Issue Type (dropdown with 7 options)
- Skill Discovery Context (auto vs manual)
- Package versions (actual vs recommended)

**Labels**: `bug`, `skill-content`

---

### 2. New Skill Proposal (`new-skill-proposal.yml`)
**Purpose**: Propose entirely new skills for the marketplace

**Use when**:
- Proposing a new technology/framework skill
- Have production testing evidence
- Want to contribute a new skill

**Key fields**:
- Proposed Skill Name (kebab-case)
- Category (dropdown with 18 categories)
- Technology/Framework with version
- Production Testing Evidence (required)
- Token Budget Estimate
- Standards Compliance Checklist
- Contribution Commitment

**Labels**: `enhancement`, `new-skill`

**Requirements**:
- Must read ONE_PAGE_CHECKLIST.md
- Must read claude-code-skill-standards.md
- Must provide production testing evidence
- Must commit to contributing

---

### 3. Skill Enhancement (`skill-enhancement.yml`)
**Purpose**: Suggest improvements to existing skills

**Use when**:
- Existing skill is missing examples/templates
- Need more troubleshooting documentation
- Want to add error documentation
- Suggesting progressive disclosure improvements

**Key fields**:
- Plugin/Skill Name
- Enhancement Type (dropdown with 7 options)
- Token Budget Impact (increase/decrease/neutral)
- Supporting References
- Use Case description

**Labels**: `enhancement`, `skill-content`

---

### 4. Skill Documentation (`skill-documentation.yml`)
**Purpose**: Report issues with skill documentation

**Use when**:
- Documentation is incorrect/outdated
- Missing "When to Load References" section
- SKILL.md is too long (>500 lines)
- Code examples don't work
- Missing version information

**Key fields**:
- Documentation Type (SKILL.md, README.md, references/, templates/, etc.)
- File Path within plugin
- Issue Type (dropdown with 10 options)
- Current Documentation quote
- Suggested Improvement
- Related Standards

**Labels**: `documentation`, `skill-content`

---

### 5. Marketplace/Installation Issue (`marketplace-issue.yml`)
**Purpose**: Report marketplace, installation, or discovery problems

**Use when**:
- Skill not discoverable by Claude
- Installation failed (symlink issues)
- plugin.json validation errors
- Skill not listed in marketplace.json
- Version mismatches

**Key fields**:
- Issue Type (dropdown with 7 options)
- Installation Method (marketplace / manual / cloned repo)
- Claude Discovery Context (what you asked, did Claude propose?)
- System Information (OS, Claude Code version, path)
- Validation Output

**Labels**: `bug`, `marketplace`

---

### 6. Skill Optimization Request (`skill-optimization.yml`)
**Purpose**: Request optimization for token budget or refactoring

**Use when**:
- SKILL.md exceeds 500 lines
- Need to extract sections to references/
- Token budget concerns (15k char system prompt limit)
- Missing progressive disclosure structure

**Key fields**:
- Optimization Type (dropdown with 7 options)
- Current SKILL.md Line Count
- Target Line Count
- Sections to Extract (identify large sections)
- Proposed Approach (structure plan)
- Token Budget Impact (estimated reduction)
- Standards Compliance Checklist

**Labels**: `enhancement`, `skill-optimization`

---

### 7. Template Chooser (`config.yml`)
**Purpose**: Configure issue template chooser and contact links

**Features**:
- Enables blank issues for edge cases
- Contact links to:
  - Documentation (CLAUDE.md)
  - Getting Started guide
  - Official Claude Code docs
  - GitHub Discussions

---

## GitHub Labels

The templates use a combination of existing and skill-specific labels:

### Existing Labels (use as-is)
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation

### New Skill-Specific Labels
Created via `gh label create`:

- `skill-content` (#0E8A16): Issues related to skill content/instructions
- `new-skill` (#1D76DB): Proposals for new skills
- `marketplace` (#5319E7): Marketplace/installation issues
- `skill-optimization` (#FBCA04): Token budget/refactoring optimization

---

## How Users Access Templates

1. Navigate to: https://github.com/secondsky/claude-skills/issues/new/choose
2. Template chooser displays all 7 templates
3. User selects appropriate template
4. Form auto-fills with:
   - Title prefix (e.g., `[Skill Bug]: `)
   - Labels (e.g., `bug`, `skill-content`)
   - Assignee (`secondsky`)
5. User completes required fields
6. Submit issue

---

## Documentation Integration

Each template links to relevant repository documentation:

### skill-bug-report.yml
- [ONE_PAGE_CHECKLIST.md](../getting-started/ONE_PAGE_CHECKLIST.md)
- [COMMON_MISTAKES.md](../reference/COMMON_MISTAKES.md)
- [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)

### new-skill-proposal.yml
- [START_HERE.md](../getting-started/START_HERE.md)
- [QUICK_WORKFLOW.md](../getting-started/QUICK_WORKFLOW.md)
- [ONE_PAGE_CHECKLIST.md](../getting-started/ONE_PAGE_CHECKLIST.md)
- [research-protocol.md](../reference/research-protocol.md)

### skill-documentation.yml
- [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md)
- [STANDARDS_COMPARISON.md](../reference/STANDARDS_COMPARISON.md)
- [ONE_PAGE_CHECKLIST.md Section 3](../getting-started/ONE_PAGE_CHECKLIST.md#section-3-documentation-quality)

### marketplace-issue.yml
- [CLAUDE.md Section: Installing Skills](../../CLAUDE.md#installing-skills)
- [PLUGIN_DEV_BEST_PRACTICES.md Section 8](PLUGIN_DEV_BEST_PRACTICES.md#section-8-marketplace-management)
- `scripts/sync-plugins.sh` documentation

### skill-optimization.yml
- [PLUGIN_DEV_BEST_PRACTICES.md Section 5 (Progressive Disclosure)](PLUGIN_DEV_BEST_PRACTICES.md#section-5-progressive-disclosure)
- [ONE_PAGE_CHECKLIST.md Section 2 (Token Budget)](../getting-started/ONE_PAGE_CHECKLIST.md#2-token-budget-optimization)

---

## Template Design Principles

### 1. Skill-Specific Context
Generic templates don't capture:
- Skill metadata (plugin name, version, discovery method)
- Token budget concerns (15k char system prompt limit)
- Progressive disclosure structure
- Production testing evidence

### 2. Progressive Disclosure
Templates use dropdowns to:
- Guide users to provide complete information
- Reduce free-form errors
- Ensure consistency

### 3. Pre-submission Checklists
Every template includes:
- Search for duplicates (required)
- Read relevant documentation (varies by template)
- Compliance verification (for proposals/optimizations)

### 4. Repository-Specific Categories
- 18 skill categories (tooling, frontend, cloudflare, ai, etc.)
- 169 plugins containing 167 skills
- Installation methods (marketplace, manual, full repo clone)
- Two-tier structure (plugins vs skills)

---

## Verification

After pushing templates to GitHub:

### Structural Verification
```bash
# Count templates (should be 7)
ls -1 .github/ISSUE_TEMPLATE/*.yml | wc -l

# Verify YAML headers
for file in .github/ISSUE_TEMPLATE/*.yml; do
  echo "=== $(basename $file) ===";
  head -5 "$file";
done
```

### GitHub UI Verification
1. Visit: https://github.com/secondsky/claude-skills/issues/new/choose
2. Verify all 7 templates appear
3. Test each template:
   - Form renders correctly
   - Dropdowns have all options
   - Required fields marked
   - Links work
4. Submit test issue (close after verification)

### Label Verification
```bash
# List all labels
gh label list --repo secondsky/claude-skills

# Verify skill-specific labels exist
gh label list --repo secondsky/claude-skills | grep -E "skill-content|new-skill|marketplace|skill-optimization"
```

---

## Maintenance

### When to Update Templates

**Quarterly** (or when categories/structure changes):
- Update category dropdown in `new-skill-proposal.yml` (currently 18 categories)
- Verify documentation links still resolve
- Check for new template field needs

**When Standards Change**:
- Update compliance checklists
- Add/remove pre-submission requirements
- Update documentation links

**When New Issues Reveal Gaps**:
- Add missing dropdown options
- Improve field descriptions
- Add new required fields

### How to Update Templates

1. Edit YAML files in `.github/ISSUE_TEMPLATE/`
2. Test locally (forms don't render until pushed to GitHub)
3. Commit and push changes
4. Verify on GitHub: https://github.com/secondsky/claude-skills/issues/new/choose
5. Submit test issue to verify changes work

---

## Common User Workflows

### Reporting a Skill Bug
1. User encounters error using cloudflare-d1 skill
2. Navigate to Issues > New Issue
3. Select "Skill Bug Report"
4. Fill in:
   - Plugin: cloudflare-d1
   - Version: 3.0.0
   - Issue Type: "Broken code templates"
   - Description, steps, environment
5. Submit → Auto-labeled `bug`, `skill-content`, assigned to `secondsky`

### Proposing a New Skill
1. User wants to add Remix skill
2. Navigate to Issues > New Issue
3. Select "New Skill Proposal"
4. Fill in:
   - Name: remix-framework
   - Category: frontend
   - Technology: Remix v2.5.0
   - Production evidence (required)
   - Complete compliance checklist
5. Submit → Auto-labeled `enhancement`, `new-skill`

### Requesting Optimization
1. User notices SKILL.md is 742 lines
2. Navigate to Issues > New Issue
3. Select "Skill Optimization Request"
4. Fill in:
   - Current: 742 lines
   - Target: <500 lines
   - Sections to extract (specific lines)
   - Proposed approach
5. Submit → Auto-labeled `enhancement`, `skill-optimization`

---

## Success Metrics

**Immediate** (After push):
- ✅ 7 YAML templates created
- ✅ Template chooser appears on GitHub
- ✅ All templates render correctly
- ✅ Contact links work
- ✅ Documentation links resolve

**Within 1 Week**:
- [ ] At least 1 real issue submitted using templates
- [ ] Labels auto-apply correctly
- [ ] Users provide complete information
- [ ] No template confusion reported

**Within 1 Month**:
- [ ] 5+ issues submitted using templates
- [ ] Template fields capture all needed info
- [ ] Issue triage time reduced (less back-and-forth)
- [ ] Template adoption rate >80%

---

## Troubleshooting

### Template Not Appearing
1. Verify YAML syntax (use online validator)
2. Check file is in `.github/ISSUE_TEMPLATE/` directory
3. Ensure pushed to `main` branch (templates only work on default branch)
4. Clear browser cache and reload

### Form Validation Errors
1. Check `validations: required: true` on critical fields
2. Verify dropdown options don't have syntax errors
3. Test field descriptions for clarity

### Links Not Working
1. Verify paths are correct (relative to repository root)
2. Check for typos in URLs
3. Ensure referenced files exist in repository

### Labels Not Auto-Applying
1. Verify labels exist in repository: `gh label list`
2. Check YAML `labels: []` array syntax
3. Ensure label names match exactly (case-sensitive)

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project overview and context
- [ONE_PAGE_CHECKLIST.md](../getting-started/ONE_PAGE_CHECKLIST.md) - Quality standards
- [claude-code-skill-standards.md](../reference/claude-code-skill-standards.md) - Official standards
- [PLUGIN_DEV_BEST_PRACTICES.md](PLUGIN_DEV_BEST_PRACTICES.md) - Development practices

---

**Last Updated**: 2026-02-07
**Maintainer**: Claude Skills Maintainers
