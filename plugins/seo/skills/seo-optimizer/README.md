# SEO Optimizer

Comprehensive SEO analysis and content optimization skill for improving search engine rankings.

## Overview

This skill analyzes content across multiple dimensions to provide actionable SEO recommendations:
- **Keyword analysis**: Placement, density, LSI keywords
- **Readability metrics**: Flesch score, sentence length, passive voice
- **Technical SEO**: Meta tags, URL optimization, image alt text
- **Content quality**: Word count, E-A-T signals, content gaps
- **Competitive analysis**: Compare against top-ranking content

## When to Use

- Optimizing blog posts or articles for search rankings
- Conducting content audits
- Improving existing content performance
- Planning new content with SEO in mind
- Analyzing competitor content strategies

## Quick Start

Simply ask Claude to optimize your content:

```
"Optimize this blog post for the keyword 'project management tools'"
"Analyze this article for SEO improvements"
"What SEO issues does my content have?"
```

## Output

Receives comprehensive SEO analysis report including:
- Overall score with breakdown
- Quick wins (high-impact, low-effort fixes)
- Detailed analysis by category
- Before/after examples
- Prioritized implementation checklist
- Estimated impact and timeframe

## Features

### Keyword Analysis
- Primary and secondary keyword identification
- Density calculation (target: 1-2%)
- Placement verification (title, H1, first 100 words)
- LSI keyword suggestions

### Readability Assessment
- Flesch Reading Ease score
- Grade level estimation
- Sentence length analysis
- Passive voice detection
- Transition word usage

### Technical SEO
- Meta title optimization (50-60 chars)
- Meta description crafting (150-160 chars)
- URL slug recommendations
- Image alt text validation
- Internal linking opportunities

### Content Quality
- Word count adequacy assessment
- Content depth evaluation
- E-A-T signal identification
- Content freshness check
- Competitor gap analysis

## Priority Levels

- **Critical** 🚨: Fix immediately (missing meta tags, broken links)
- **High Priority** ⚠️: Important improvements (readability, structure)
- **Medium Priority** 📋: Enhancement opportunities (featured snippets, schema)

## Best Practices

- User experience first, optimization second
- Write for humans, optimize for search engines
- Provide specific, actionable recommendations
- Consider search intent (informational, commercial, transactional)
- Focus on genuine value creation

## Structure

```
seo-optimizer/
├── SKILL.md                          # Main skill (184 lines)
├── README.md                         # This file
└── references/
    ├── analysis-framework.md         # Detailed analysis instructions
    └── output-templates.md           # Complete report templates & examples
```

## References

- **analysis-framework.md**: Deep dive into each analysis area with formulas, code examples, and detailed checklists
- **output-templates.md**: Complete SEO report template, example workflows, and implementation guides

## Examples

### Quick Win Example
```markdown
❌ Current: "Ultimate Guide"
✅ Improved: "Ultimate Guide to Project Management Tools"
Impact: High | Time: 1 minute
```

### Readability Example
```markdown
Flesch Score: 52 → Target: 60-70
Actions:
- Shorten 8 long sentences (>30 words)
- Convert 5 passive to active voice
- Add transitions to 6 paragraphs
Expected improvement: +12 points
```

## Installation

```bash
# Install to Claude Code skills directory
./scripts/install-skill.sh seo-optimizer

# Verify installation
ls ~/.claude/skills/seo-optimizer
```

## Version

- **Created**: 2024-01-21
- **Status**: Production ready
- **Compliance**: Follows Claude Code best practices
