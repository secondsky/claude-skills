# Supabase PostgreSQL Best Practices

Production-tested PostgreSQL performance optimization and best practices from [Supabase](https://supabase.com). This skill provides 30 reference files across 8 categories, prioritized by impact.

## Overview

This skill helps you write, review, and optimize PostgreSQL queries, schema designs, and database configurations using battle-tested patterns from Supabase's production experience.

**Impact-Prioritized Categories:**

1. **Query Performance** (CRITICAL) - 5 rules
2. **Connection Management** (CRITICAL) - 4 rules
3. **Security & RLS** (CRITICAL) - 3 rules
4. **Schema Design** (HIGH) - 5 rules
5. **Concurrency & Locking** (MEDIUM-HIGH) - 4 rules
6. **Data Access Patterns** (MEDIUM) - 4 rules
7. **Monitoring & Diagnostics** (LOW-MEDIUM) - 3 rules
8. **Advanced Features** (LOW) - 2 rules

## Installation

### Option 1: Install from Claude Skills Marketplace

```bash
/plugin install supabase-postgres-best-practices@claude-skills
```

### Option 2: Install Locally

```bash
cd /path/to/claude-skills
./scripts/install-skill.sh supabase-postgres-best-practices
```

## Usage

Claude Code will automatically discover and propose using this skill when you:

- Write PostgreSQL queries
- Review database schemas
- Optimize query performance
- Configure database connections
- Implement Row Level Security (RLS)
- Design table structures
- Handle database locks and transactions
- Monitor database performance

### Example Prompts

```
"Review this query for performance issues"
"Design a schema for a multi-tenant SaaS application"
"How should I index this table for faster lookups?"
"What's the best way to handle connection pooling?"
"Implement RLS for this table"
```

## What's Included

### 30 Reference Files

Each reference file follows a consistent structure:
- **Impact metrics** (Performance, Security, Reliability)
- **Incorrect pattern** with anti-pattern example
- **Correct pattern** with optimized SQL
- **Explanation** of the optimization
- **When to apply** guidelines

### Progressive Disclosure

The skill uses progressive disclosure:
1. Read `SKILL.md` for main instructions
2. Load reference files on-demand as needed
3. Each reference is self-contained with complete examples

## Key Topics Covered

### Query Performance
- Missing indexes detection
- Composite and covering indexes
- Partial indexes for filtered queries
- Index type selection (B-tree, GiST, GIN, etc.)

### Connection Management
- Connection pooling strategies
- Idle connection timeout
- Connection limits and scaling
- Prepared statements

### Security & RLS
- Row Level Security basics
- RLS performance optimization
- Database privileges and grants

### Schema Design
- Primary key selection
- Foreign key indexes
- Data type optimization
- Table partitioning strategies
- Identifier naming conventions

### Concurrency & Locking
- Short transaction patterns
- Advisory locks
- Deadlock prevention
- SELECT FOR UPDATE SKIP LOCKED

### Data Access Patterns
- Batch inserts
- N+1 query prevention
- Pagination strategies
- UPSERT operations

### Monitoring & Diagnostics
- EXPLAIN ANALYZE usage
- pg_stat_statements analysis
- VACUUM and ANALYZE tuning

### Advanced Features
- Full-text search
- JSONB indexing

## Attribution

This skill is based on the [supabase-postgres-best-practices](https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices) skill from the [Supabase Agent Skills](https://github.com/supabase/agent-skills) repository.

**Original Author:** Supabase
**Source Repository:** https://github.com/supabase/agent-skills
**License:** MIT
**Last Synced:** 2026-02-04

## Standards Compliance

This skill follows the [Agent Skills Open Standard](https://agentskills.io/) and is compatible with:
- Claude Code CLI
- Other Agent Skills-compatible platforms

## Structure

```
supabase-postgres-best-practices/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── README.md                    # This file
└── skills/
    └── supabase-postgres-best-practices/
        ├── SKILL.md             # Main skill file
        ├── AGENTS.md            # Navigation guide
        ├── CLAUDE.md            # Agent assistant file
        └── references/          # 33 reference files
            ├── _template.md
            ├── _sections.md
            ├── _contributing.md
            ├── query-*.md (5 files)
            ├── conn-*.md (4 files)
            ├── security-*.md (3 files)
            ├── schema-*.md (5 files)
            ├── lock-*.md (4 files)
            ├── data-*.md (4 files)
            ├── monitor-*.md (3 files)
            └── advanced-*.md (2 files)
```

## Updates

To sync future updates from the upstream Supabase repository:

1. Check for updates:
   ```bash
   curl -s "https://api.github.com/repos/supabase/agent-skills/commits?path=skills/supabase-postgres-best-practices" | jq -r '.[0].sha'
   ```

2. Download updated files (see original plan for curl commands)

3. Update `metadata.lastSynced` in `.claude-plugin/plugin.json`

4. Run marketplace sync:
   ```bash
   ./scripts/sync-plugins.sh
   ```

## Contributing

While this skill is sourced from Supabase, improvements and fixes can be contributed to:

1. **Upstream (Supabase):** https://github.com/supabase/agent-skills
2. **This repository:** https://github.com/secondsky/claude-skills

## License

MIT License - see [LICENSE](../../LICENSE) file

## Support

- **Supabase Community:** https://supabase.com/docs
- **Claude Skills Issues:** https://github.com/secondsky/claude-skills/issues
- **Original Skill Issues:** https://github.com/supabase/agent-skills/issues

---

**Maintained by:** Claude Skills Contributors
**Original Author:** Supabase Team
**Repository:** https://github.com/secondsky/claude-skills
