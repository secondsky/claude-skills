# Advanced SQL Patterns for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/api/storage-api/

Complete guide to advanced SQL features and patterns in Durable Objects SQLite backend.

---

## Overview

Durable Objects SQL storage provides a full SQLite database (1GB limit) with support for:
- Common Table Expressions (CTEs)
- Window functions
- Aggregate functions
- Full-text search (FTS5)
- JSON functions
- Recursive queries
- Transactions
- Triggers

---

## Common Table Expressions (CTEs)

CTEs provide temporary result sets for complex queries.

### Basic CTE

```typescript
// Find users with above-average activity
const result = await this.ctx.storage.sql.exec(`
  WITH avg_activity AS (
    SELECT AVG(activity_count) as avg_count
    FROM user_stats
  )
  SELECT u.id, u.username, us.activity_count
  FROM users u
  JOIN user_stats us ON u.id = us.user_id
  CROSS JOIN avg_activity
  WHERE us.activity_count > avg_activity.avg_count
  ORDER BY us.activity_count DESC
`);
```

### Multiple CTEs

```typescript
// Complex analytics query
const result = await this.ctx.storage.sql.exec(`
  WITH
    daily_totals AS (
      SELECT
        DATE(timestamp / 1000, 'unixepoch') as date,
        COUNT(*) as total_events,
        SUM(value) as total_value
      FROM events
      GROUP BY date
    ),
    weekly_averages AS (
      SELECT
        AVG(total_events) as avg_events,
        AVG(total_value) as avg_value
      FROM daily_totals
      WHERE date >= DATE('now', '-7 days')
    )
  SELECT
    dt.date,
    dt.total_events,
    dt.total_value,
    dt.total_events - wa.avg_events as events_vs_avg,
    dt.total_value - wa.avg_value as value_vs_avg
  FROM daily_totals dt
  CROSS JOIN weekly_averages wa
  ORDER BY dt.date DESC
  LIMIT 30
`);
```

### Recursive CTEs

```typescript
// Hierarchical data (thread replies)
const result = await this.ctx.storage.sql.exec(`
  WITH RECURSIVE thread_tree AS (
    -- Base case: root message
    SELECT id, parent_id, content, 0 as depth
    FROM messages
    WHERE id = ?

    UNION ALL

    -- Recursive case: replies
    SELECT m.id, m.parent_id, m.content, tt.depth + 1
    FROM messages m
    JOIN thread_tree tt ON m.parent_id = tt.id
    WHERE tt.depth < 10  -- Prevent infinite recursion
  )
  SELECT * FROM thread_tree
  ORDER BY depth, id
`, rootMessageId);
```

**Use Cases**:
- Hierarchical data (comments, categories)
- Graph traversal
- Bill of materials
- Organization charts

---

## Window Functions

Window functions perform calculations across rows related to the current row.

### ROW_NUMBER()

```typescript
// Rank messages by user
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    content,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rank
  FROM messages
`);

// Get top 3 messages per user
const top3 = await this.ctx.storage.sql.exec(`
  WITH ranked_messages AS (
    SELECT
      user_id,
      content,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rank
    FROM messages
  )
  SELECT * FROM ranked_messages
  WHERE rank <= 3
`);
```

### RANK() and DENSE_RANK()

```typescript
// Leaderboard with tie handling
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    score,
    RANK() OVER (ORDER BY score DESC) as rank,
    DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank
  FROM leaderboard
`);

// RANK: 1, 2, 2, 4 (gaps after ties)
// DENSE_RANK: 1, 2, 2, 3 (no gaps)
```

### LAG() and LEAD()

```typescript
// Compare with previous/next values
const result = await this.ctx.storage.sql.exec(`
  SELECT
    date,
    value,
    LAG(value) OVER (ORDER BY date) as previous_value,
    LEAD(value) OVER (ORDER BY date) as next_value,
    value - LAG(value) OVER (ORDER BY date) as change_from_prev
  FROM metrics
  ORDER BY date
`);
```

### Running Totals

```typescript
// Cumulative sum
const result = await this.ctx.storage.sql.exec(`
  SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) as running_total
  FROM transactions
  ORDER BY date
`);
```

### Moving Averages

```typescript
// 7-day moving average
const result = await this.ctx.storage.sql.exec(`
  SELECT
    date,
    value,
    AVG(value) OVER (
      ORDER BY date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day
  FROM daily_metrics
  ORDER BY date
`);
```

---

## Aggregate Functions

Advanced aggregation patterns beyond basic COUNT/SUM/AVG.

### GROUP_CONCAT()

```typescript
// Aggregate related values into array
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    GROUP_CONCAT(tag, ',') as tags
  FROM user_tags
  GROUP BY user_id
`);

// Result: user_id=1, tags="javascript,typescript,react"
```

### JSON Aggregation

```typescript
// Build JSON arrays
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    JSON_GROUP_ARRAY(
      JSON_OBJECT(
        'tag', tag,
        'count', count
      )
    ) as tag_data
  FROM user_tags
  GROUP BY user_id
`);

// Result: user_id=1, tag_data=[{"tag":"js","count":5},{"tag":"ts","count":3}]
```

### HAVING with Aggregates

```typescript
// Filter groups by aggregate conditions
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    COUNT(*) as message_count,
    MAX(created_at) as last_message
  FROM messages
  GROUP BY user_id
  HAVING COUNT(*) > 10
    AND MAX(created_at) > ?
  ORDER BY message_count DESC
`, Date.now() - 86400_000); // Active in last 24h
```

---

## Full-Text Search (FTS5)

SQLite FTS5 provides powerful full-text search capabilities.

### Setup FTS5 Table

```typescript
// Create FTS5 virtual table
await this.ctx.storage.sql.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
  USING fts5(
    content,
    user_id UNINDEXED,
    tokenize='porter unicode61'
  )
`);

// Keep FTS table in sync with main table using triggers
await this.ctx.storage.sql.exec(`
  CREATE TRIGGER IF NOT EXISTS messages_ai
  AFTER INSERT ON messages
  BEGIN
    INSERT INTO messages_fts(rowid, content, user_id)
    VALUES (new.id, new.content, new.user_id);
  END
`);

await this.ctx.storage.sql.exec(`
  CREATE TRIGGER IF NOT EXISTS messages_au
  AFTER UPDATE ON messages
  BEGIN
    UPDATE messages_fts
    SET content = new.content, user_id = new.user_id
    WHERE rowid = old.id;
  END
`);

await this.ctx.storage.sql.exec(`
  CREATE TRIGGER IF NOT EXISTS messages_ad
  AFTER DELETE ON messages
  BEGIN
    DELETE FROM messages_fts WHERE rowid = old.id;
  END
`);
```

### Basic Search

```typescript
// Simple search
const result = await this.ctx.storage.sql.exec(`
  SELECT
    m.id,
    m.user_id,
    m.content,
    m.created_at
  FROM messages_fts fts
  JOIN messages m ON m.id = fts.rowid
  WHERE messages_fts MATCH ?
  ORDER BY rank
`, 'cloudflare workers');
```

### Advanced Search Syntax

```typescript
// Phrase search
const phrase = await this.ctx.storage.sql.exec(`
  SELECT * FROM messages_fts
  WHERE messages_fts MATCH '"durable objects"'
`);

// AND search
const and = await this.ctx.storage.sql.exec(`
  SELECT * FROM messages_fts
  WHERE messages_fts MATCH 'cloudflare AND workers'
`);

// OR search
const or = await this.ctx.storage.sql.exec(`
  SELECT * FROM messages_fts
  WHERE messages_fts MATCH 'cloudflare OR workers'
`);

// NOT search
const not = await this.ctx.storage.sql.exec(`
  SELECT * FROM messages_fts
  WHERE messages_fts MATCH 'cloudflare NOT pages'
`);

// Prefix search
const prefix = await this.ctx.storage.sql.exec(`
  SELECT * FROM messages_fts
  WHERE messages_fts MATCH 'cloud*'
`);
```

### Ranked Results with Snippets

```typescript
const result = await this.ctx.storage.sql.exec(`
  SELECT
    m.id,
    m.content,
    snippet(messages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet,
    rank as relevance
  FROM messages_fts fts
  JOIN messages m ON m.id = fts.rowid
  WHERE messages_fts MATCH ?
  ORDER BY rank
  LIMIT 20
`, searchQuery);
```

---

## JSON Functions

SQLite provides powerful JSON manipulation functions.

### JSON Storage

```typescript
// Store JSON data
await this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    profile_data TEXT NOT NULL  -- JSON as TEXT
  )
`);

await this.ctx.storage.sql.exec(`
  INSERT INTO user_profiles (user_id, profile_data)
  VALUES (?, ?)
`, userId, JSON.stringify({
  name: 'John Doe',
  preferences: {
    theme: 'dark',
    notifications: true
  },
  tags: ['developer', 'cloudflare']
}));
```

### JSON Queries

```typescript
// Extract JSON fields
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    JSON_EXTRACT(profile_data, '$.name') as name,
    JSON_EXTRACT(profile_data, '$.preferences.theme') as theme,
    JSON_EXTRACT(profile_data, '$.tags') as tags
  FROM user_profiles
  WHERE user_id = ?
`, userId);

// Filter by JSON values
const darkThemeUsers = await this.ctx.storage.sql.exec(`
  SELECT user_id
  FROM user_profiles
  WHERE JSON_EXTRACT(profile_data, '$.preferences.theme') = 'dark'
`);
```

### JSON Array Operations

```typescript
// Query JSON arrays
const result = await this.ctx.storage.sql.exec(`
  SELECT
    user_id,
    JSON_EXTRACT(profile_data, '$.tags') as tags
  FROM user_profiles
  WHERE JSON_EXTRACT(profile_data, '$.tags') LIKE '%developer%'
`);

// Expand JSON arrays into rows
const expanded = await this.ctx.storage.sql.exec(`
  SELECT
    up.user_id,
    jt.value as tag
  FROM user_profiles up,
    JSON_EACH(JSON_EXTRACT(up.profile_data, '$.tags')) jt
`);
```

### JSON Modification

```typescript
// Update JSON fields
await this.ctx.storage.sql.exec(`
  UPDATE user_profiles
  SET profile_data = JSON_SET(
    profile_data,
    '$.preferences.theme',
    ?
  )
  WHERE user_id = ?
`, 'light', userId);

// Add to JSON array
await this.ctx.storage.sql.exec(`
  UPDATE user_profiles
  SET profile_data = JSON_INSERT(
    profile_data,
    '$.tags[#]',
    ?
  )
  WHERE user_id = ?
`, 'new-tag', userId);
```

---

## Advanced Transaction Patterns

Complex transaction scenarios with proper error handling.

### Nested Transactions (Savepoints)

```typescript
async complexTransaction() {
  try {
    await this.ctx.storage.sql.exec('BEGIN');

    // First operation
    await this.ctx.storage.sql.exec(
      'INSERT INTO accounts (user_id, balance) VALUES (?, ?)',
      userId, 100
    );

    // Savepoint for partial rollback
    await this.ctx.storage.sql.exec('SAVEPOINT sp1');

    try {
      // Risky operation
      await this.ctx.storage.sql.exec(
        'UPDATE accounts SET balance = balance - ? WHERE user_id = ?',
        amount, userId
      );

      // Check balance constraint
      const result = await this.ctx.storage.sql.exec(
        'SELECT balance FROM accounts WHERE user_id = ?',
        userId
      );

      if ((result.rows[0].balance as number) < 0) {
        throw new Error('Insufficient funds');
      }

      // Release savepoint if successful
      await this.ctx.storage.sql.exec('RELEASE sp1');
    } catch (error) {
      // Rollback to savepoint
      await this.ctx.storage.sql.exec('ROLLBACK TO sp1');
      throw error;
    }

    await this.ctx.storage.sql.exec('COMMIT');
  } catch (error) {
    await this.ctx.storage.sql.exec('ROLLBACK');
    throw error;
  }
}
```

### Optimistic Locking

```typescript
async updateWithOptimisticLock(id: number, newValue: string, expectedVersion: number) {
  const result = await this.ctx.storage.sql.exec(`
    UPDATE records
    SET value = ?, version = version + 1
    WHERE id = ? AND version = ?
  `, newValue, id, expectedVersion);

  if (result.rowsWritten === 0) {
    throw new Error('Concurrent modification detected');
  }

  return expectedVersion + 1;
}
```

### Batch Insert with UPSERT

```typescript
// Efficient bulk upsert
async bulkUpsert(records: Array<{id: string, value: number}>) {
  await this.ctx.storage.sql.exec('BEGIN');

  for (const record of records) {
    await this.ctx.storage.sql.exec(`
      INSERT INTO metrics (id, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `, record.id, record.value, Date.now());
  }

  await this.ctx.storage.sql.exec('COMMIT');
}
```

---

## Performance Patterns

Advanced optimization techniques.

### Materialized Views (Manual)

```typescript
// Create summary table
await this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    total_users INTEGER,
    total_messages INTEGER,
    avg_message_length REAL,
    last_updated INTEGER
  )
`);

// Refresh materialized view
async refreshDailyStats(date: string) {
  await this.ctx.storage.sql.exec(`
    INSERT OR REPLACE INTO daily_stats (
      date, total_users, total_messages, avg_message_length, last_updated
    )
    SELECT
      ?,
      COUNT(DISTINCT user_id),
      COUNT(*),
      AVG(LENGTH(content)),
      ?
    FROM messages
    WHERE DATE(created_at / 1000, 'unixepoch') = ?
  `, date, Date.now(), date);
}

// Query materialized view (fast)
const stats = await this.ctx.storage.sql.exec(
  'SELECT * FROM daily_stats WHERE date >= ? ORDER BY date DESC',
  '2025-01-01'
);
```

### Partial Indexes

```typescript
// Index only active records
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_active_sessions
  ON sessions(user_id, last_activity)
  WHERE expires_at > ?
`, Date.now());

// Much smaller index, faster queries for active sessions
const activeSessions = await this.ctx.storage.sql.exec(`
  SELECT * FROM sessions
  WHERE user_id = ? AND expires_at > ?
  ORDER BY last_activity DESC
`, userId, Date.now());
```

### Expression Indexes

```typescript
// Index on computed column
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_day_of_week
  ON events((strftime('%w', timestamp / 1000, 'unixepoch')))
`);

// Fast queries by day of week
const weekendEvents = await this.ctx.storage.sql.exec(`
  SELECT * FROM events
  WHERE strftime('%w', timestamp / 1000, 'unixepoch') IN ('0', '6')
`);
```

---

## Anti-Patterns to Avoid

### ❌ SELECT * in Production

```typescript
// Bad: Returns all columns (wasteful)
const result = await this.ctx.storage.sql.exec('SELECT * FROM messages');

// Good: Select only needed columns
const result = await this.ctx.storage.sql.exec(
  'SELECT id, content, created_at FROM messages'
);
```

### ❌ OFFSET Pagination

```typescript
// Bad: OFFSET gets slower as you paginate further
const page10000 = await this.ctx.storage.sql.exec(
  'SELECT * FROM messages ORDER BY id LIMIT 50 OFFSET 500000'
);

// Good: Cursor-based pagination
const page = await this.ctx.storage.sql.exec(
  'SELECT * FROM messages WHERE id > ? ORDER BY id LIMIT 50',
  lastSeenId
);
```

### ❌ OR Conditions on Different Columns

```typescript
// Bad: Can't use indexes efficiently
const result = await this.ctx.storage.sql.exec(`
  SELECT * FROM users
  WHERE username = ? OR email = ?
`, searchTerm, searchTerm);

// Good: Use UNION
const result = await this.ctx.storage.sql.exec(`
  SELECT * FROM users WHERE username = ?
  UNION
  SELECT * FROM users WHERE email = ?
`, searchTerm, searchTerm);
```

### ❌ Functions on Indexed Columns in WHERE

```typescript
// Bad: Can't use index
const result = await this.ctx.storage.sql.exec(`
  SELECT * FROM events
  WHERE LOWER(category) = ?
`, 'important');

// Good: Store lowercase version or use expression index
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_category_lower
  ON events(LOWER(category))
`);
```

---

## Sources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Cloudflare Durable Objects SQL](https://developers.cloudflare.com/durable-objects/api/storage-api/)
- [SQLite Window Functions](https://www.sqlite.org/windowfunctions.html)
- [SQLite JSON Functions](https://www.sqlite.org/json1.html)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)

---

**Last Updated**: 2025-12-27
**Maintainer**: Claude Skills Team
