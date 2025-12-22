# SEO Keyword Cluster Builder

Organize keywords into topic clusters and plan content hub architecture with strategic internal linking.

## Overview

This skill transforms unorganized keyword research into structured content strategies by:
- Grouping related keywords into thematic clusters
- Designing pillar page and cluster content architecture
- Planning internal linking strategies
- Creating content priority roadmaps
- Estimating traffic opportunities

## When to Use

- Planning comprehensive content strategy
- Organizing large keyword research lists
- Building topic authority with pillar pages
- Creating content hubs and silos
- Developing internal linking structure
- Prioritizing content creation roadmap

## Quick Start

Provide keywords and let Claude organize them:

```
"Help me organize these 30 keywords about email marketing into topic clusters"
"Create a content hub architecture for [topic]"
"Group these keywords and suggest pillar pages"
```

## Output

Receives structured cluster analysis including:
- Organized keyword groups by theme
- Pillar page recommendations
- Cluster content article suggestions
- Internal linking strategy
- Content priority roadmap
- Implementation checklist

## Features

### Topic Clustering
- Group keywords by semantic similarity
- Identify search intent (informational, commercial, transactional)
- Organize by user journey stage
- Recommend content types

### Content Architecture
- Pillar page planning (2000-4000 words)
- Cluster content structure (800-1500 words each)
- Hub-and-spoke model design
- Content hierarchy visualization

### Internal Linking Strategy
- Bidirectional link planning
- Anchor text recommendations
- Link placement context
- Hub-and-spoke connectivity

### Content Prioritization
- Phase-based roadmap (Foundation → Expansion → Depth)
- High-volume keyword targeting
- Quick win identification
- Resource allocation guidance

## Clustering Patterns

### Feature-Based
```
Pillar: "Email Marketing Software"
├── Email Marketing Features
├── Email Marketing Automation
└── Email Marketing Analytics
```

### Problem-Solution
```
Pillar: "CRM for Small Business"
├── How to Choose a CRM
├── CRM Implementation Guide
└── Common CRM Mistakes
```

### Comparison-Based
```
Pillar: "Project Management Tools Comparison"
├── Asana vs Monday.com
├── Best Free PM Tools
└── PM Tools for Remote Teams
```

### Stage-Based
```
Pillar: "Content Marketing Guide"
├── Content Strategy Planning
├── Content Creation Process
└── Content Performance Measurement
```

## Best Practices

### 1. Be Specific
- Provide exact content titles and structures
- Include specific word counts and keyword targets
- Show clear content hierarchies

### 2. Use Templates
- Provide copy-paste ready formats
- Include adaptable examples
- Show clear content hierarchies

### 3. Include Context
- Explain why recommendations matter
- Include search volume data
- Estimate traffic opportunity

### 4. Stay Current
- Use latest SEO best practices
- Consider current algorithm priorities
- Include freshness strategies

## Internal Linking Guidelines

### Anchor Text Examples

**Good**:
- "project management best practices"
- "how to implement agile methodology"
- "comparison of top CRM platforms"

**Bad**:
- "click here" ❌
- "this article" ❌
- "project management project management" ❌

### Link Structure

```
Every cluster article links:
→ To pillar page (1 link)
→ To 2-3 related cluster articles
← From pillar page (receives link)
```

## Success Metrics

Track these KPIs:
- **Traffic**: Organic sessions per cluster
- **Rankings**: Average position for target keywords
- **Engagement**: Time on page, pages per session
- **Authority**: Backlinks to pillar pages

## Structure

```
seo-keyword-cluster-builder/
├── SKILL.md          # Main skill (423 lines)
└── README.md         # This file
```

All content is contained in the main SKILL.md file for easy access.

## Example Output

```markdown
# SEO Keyword Cluster Analysis

**Clusters Identified**: 3
**Total Keywords**: 28
**Traffic Opportunity**: 15.2K monthly searches

## Cluster 1: Software Selection
**Search Intent**: Commercial
**Traffic Opportunity**: 8.4K/month

Keywords:
1. project management software (2.4k vol)
2. best project management tools (1.8k vol)
3. project management apps (1.2k vol)

Recommended Content:
- Pillar: "Complete Guide to Project Management Software"
- Cluster 1: "Best Project Management Tools 2024"
- Cluster 2: "Project Management Apps Comparison"
- Cluster 3: "Top PM Software Features"

Internal Linking:
[Pillar] ↔ [Cluster 1]
    ↕         ↕
[Cluster 2] → [Cluster 3]
```

## Content Calendar Integration

```markdown
| Month | Week | Type | Title | Keyword | Status |
|-------|------|------|-------|---------|--------|
| Jan | 1 | Pillar | [Title] | [keyword] | Planning |
| Jan | 2 | Cluster | [Title] | [keyword] | In Progress |
```

## Installation

```bash
# Install to Claude Code skills directory
./scripts/install-skill.sh seo-keyword-cluster-builder

# Verify installation
ls ~/.claude/skills/seo-keyword-cluster-builder
```

## Philosophy

> "Focus on delivering value quickly and clearly!"

Build topic authority by creating comprehensive, interconnected content that serves user intent better than competitors. Topic clusters help search engines understand your expertise while providing users with complete information.

## Version

- **Created**: 2024-01-21
- **Status**: Production ready
- **Compliance**: Follows Claude Code best practices

## Related Skills

- **seo-optimizer**: Optimize individual content pieces for search rankings
- **content-collections**: Organize and manage content systematically
