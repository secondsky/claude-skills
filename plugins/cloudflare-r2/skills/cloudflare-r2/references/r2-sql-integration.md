# R2 SQL Integration

**Last Updated**: 2025-12-27
**Status**: NEW FEATURE (2025)

Query data stored in R2 using distributed SQL without extraction or ETL pipelines. Analyze structured data directly in object storage.

---

## Overview

R2 SQL is a distributed SQL engine that allows querying data stored in R2 buckets without moving it. Query CSV, JSON, Parquet, and other structured formats directly from R2 using standard SQL syntax.

**Key Benefits**:
- **No ETL required** - Query data in place without extraction
- **Cost-effective** - No data egress fees, pay only for compute
- **Scalable** - Distributed execution across Cloudflare's network
- **Standard SQL** - Use familiar SQL syntax and tools
- **Real-time analytics** - Query fresh data instantly

**Use Cases**:
- Log analysis and monitoring
- Business intelligence and reporting
- Data exploration and ad-hoc queries
- Analytics on large datasets
- Serverless data warehousing

---

## Supported Data Formats

R2 SQL can query these file formats:

| Format | Description | Best For |
|--------|-------------|----------|
| **Parquet** | Columnar format, highly compressed | Large datasets, analytics |
| **CSV** | Comma-separated values | Simple tabular data |
| **JSON** | JavaScript Object Notation | Semi-structured data, logs |
| **NDJSON** | Newline-delimited JSON | Streaming logs, events |
| **ORC** | Optimized Row Columnar | Hadoop ecosystem data |
| **Avro** | Binary serialization format | Schema evolution needs |

**Recommended**: Parquet for best performance and compression.

---

## Getting Started

### 1. Store Queryable Data in R2

```typescript
import { Hono } from 'hono';

type Bindings = {
  DATA_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload CSV data
app.post('/upload/logs', async (c) => {
  const csvData = `timestamp,level,message,user_id
2025-01-15T10:00:00Z,INFO,"User login",123
2025-01-15T10:01:00Z,ERROR,"Failed payment",456
2025-01-15T10:02:00Z,INFO,"User logout",123`;

  await c.env.DATA_BUCKET.put('logs/2025-01-15.csv', csvData, {
    httpMetadata: {
      contentType: 'text/csv',
    },
    customMetadata: {
      format: 'csv',
      schema: 'timestamp,level,message,user_id',
    },
  });

  return c.json({ success: true });
});

// Upload Parquet data (binary format)
app.post('/upload/analytics', async (c) => {
  const parquetData = await c.req.arrayBuffer(); // From analytics pipeline

  await c.env.DATA_BUCKET.put('analytics/2025-01-15.parquet', parquetData, {
    httpMetadata: {
      contentType: 'application/octet-stream',
    },
    customMetadata: {
      format: 'parquet',
      partitionDate: '2025-01-15',
    },
  });

  return c.json({ success: true });
});

export default app;
```

### 2. Query Data with R2 SQL

**SQL Query Syntax**:

```sql
-- Query CSV files
SELECT
  timestamp,
  level,
  message,
  user_id
FROM r2('my-bucket/logs/*.csv')
WHERE level = 'ERROR'
  AND timestamp >= '2025-01-15'
ORDER BY timestamp DESC
LIMIT 100;

-- Query Parquet files
SELECT
  date,
  COUNT(*) as events,
  SUM(revenue) as total_revenue,
  AVG(session_duration) as avg_duration
FROM r2('my-bucket/analytics/*.parquet')
WHERE date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY date
ORDER BY date;

-- Join multiple datasets
SELECT
  u.user_id,
  u.username,
  COUNT(e.event_id) as event_count,
  MAX(e.timestamp) as last_active
FROM r2('my-bucket/users/*.csv') u
LEFT JOIN r2('my-bucket/events/*.parquet') e
  ON u.user_id = e.user_id
WHERE e.timestamp >= '2025-01-01'
GROUP BY u.user_id, u.username
ORDER BY event_count DESC;
```

### 3. Execute Queries from Workers

```typescript
type Bindings = {
  DATA_BUCKET: R2Bucket;
  R2_SQL: R2SQLEngine; // SQL engine binding
};

const app = new Hono<{ Bindings: Bindings }>();

// Execute SQL query
app.post('/query', async (c) => {
  const { sql, params } = await c.req.json();

  try {
    const result = await c.env.R2_SQL.execute(sql, params);

    return c.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      columns: result.columns,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
    }, 400);
  }
});

// Predefined analytics query
app.get('/analytics/daily-summary', async (c) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  const sql = `
    SELECT
      level,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users
    FROM r2('data-bucket/logs/${date}*.csv')
    GROUP BY level
    ORDER BY count DESC
  `;

  const result = await c.env.R2_SQL.execute(sql);

  return c.json({
    date,
    summary: result.rows,
  });
});

export default app;
```

---

## SQL Syntax and Functions

### Supported SQL Operations

**SELECT Statements**:
```sql
SELECT column1, column2, aggregate_func(column3)
FROM r2('bucket/path/*.format')
WHERE condition
GROUP BY column1, column2
HAVING aggregate_condition
ORDER BY column1 DESC
LIMIT 1000;
```

**Aggregate Functions**:
- `COUNT(*)`, `COUNT(DISTINCT column)`
- `SUM(column)`, `AVG(column)`
- `MIN(column)`, `MAX(column)`
- `STDDEV(column)`, `VARIANCE(column)`

**String Functions**:
- `CONCAT(str1, str2)`
- `SUBSTRING(str, start, length)`
- `UPPER(str)`, `LOWER(str)`
- `TRIM(str)`, `LTRIM(str)`, `RTRIM(str)`
- `REGEXP_MATCHES(str, pattern)`

**Date/Time Functions**:
- `DATE(timestamp)`
- `EXTRACT(field FROM timestamp)`
- `DATE_TRUNC(precision, timestamp)`
- `NOW()`, `CURRENT_DATE`, `CURRENT_TIME`

**Conditional Logic**:
```sql
SELECT
  CASE
    WHEN level = 'ERROR' THEN 'Critical'
    WHEN level = 'WARN' THEN 'Important'
    ELSE 'Normal'
  END as priority,
  COUNT(*) as count
FROM r2('bucket/logs/*.csv')
GROUP BY priority;
```

---

## Performance Optimization

### Partitioning Data

Organize data by date/category for faster queries:

```
data-bucket/
├── logs/
│   ├── 2025-01-15/
│   │   ├── application.csv
│   │   └── api.csv
│   ├── 2025-01-16/
│   │   ├── application.csv
│   │   └── api.csv
└── analytics/
    ├── 2025-01/
    │   ├── users.parquet
    │   └── events.parquet
```

**Query specific partitions**:
```sql
-- Query only January 15 data
SELECT *
FROM r2('data-bucket/logs/2025-01-15/*.csv')
WHERE level = 'ERROR';

-- Query entire month (slower, scans all files)
SELECT *
FROM r2('data-bucket/logs/2025-01-*/*.csv')
WHERE level = 'ERROR';
```

### Use Parquet for Large Datasets

Convert CSV to Parquet for 10x better performance:

```typescript
// Example: Convert CSV logs to Parquet daily
import parquet from 'parquetjs';

async function convertCSVToParquet(csvKey: string, env: Bindings) {
  // Fetch CSV data
  const csvObject = await env.DATA_BUCKET.get(csvKey);
  const csvText = await csvObject?.text();

  if (!csvText) return;

  // Parse CSV
  const rows = parseCSV(csvText);

  // Define Parquet schema
  const schema = new parquet.ParquetSchema({
    timestamp: { type: 'TIMESTAMP_MILLIS' },
    level: { type: 'UTF8' },
    message: { type: 'UTF8' },
    user_id: { type: 'INT64' },
  });

  // Write Parquet file
  const writer = await parquet.ParquetWriter.openStream(schema);

  for (const row of rows) {
    await writer.appendRow(row);
  }

  await writer.close();

  // Upload Parquet to R2
  const parquetKey = csvKey.replace('.csv', '.parquet');
  await env.DATA_BUCKET.put(parquetKey, writer.outputStream, {
    httpMetadata: {
      contentType: 'application/octet-stream',
    },
  });

  console.log(`Converted ${csvKey} to ${parquetKey}`);
}
```

### Columnar Projection

Select only needed columns for faster queries:

```sql
-- Good: Select specific columns
SELECT timestamp, user_id, revenue
FROM r2('bucket/analytics/*.parquet')
WHERE date = '2025-01-15';

-- Bad: Select all columns (slower)
SELECT *
FROM r2('bucket/analytics/*.parquet')
WHERE date = '2025-01-15';
```

### Predicate Pushdown

Filter early for better performance:

```sql
-- Good: Filter in WHERE clause
SELECT COUNT(*)
FROM r2('bucket/logs/*.csv')
WHERE timestamp >= '2025-01-15'
  AND level = 'ERROR';

-- Bad: Filter in application code (processes all rows)
SELECT *
FROM r2('bucket/logs/*.csv');
-- Then filter in application
```

---

## Common Patterns

### Pattern 1: Daily Log Analysis

```sql
-- Analyze application errors by hour
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  level,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users
FROM r2('logs-bucket/app-logs/2025-01-15/*.csv')
WHERE level IN ('ERROR', 'FATAL')
GROUP BY hour, level
ORDER BY hour DESC, error_count DESC;
```

### Pattern 2: User Activity Dashboard

```sql
-- User engagement metrics
SELECT
  date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(*) as total_events,
  SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchases,
  SUM(CASE WHEN event_type = 'purchase' THEN amount ELSE 0 END) as revenue
FROM r2('analytics-bucket/events/*.parquet')
WHERE date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY date
ORDER BY date;
```

### Pattern 3: Funnel Analysis

```sql
-- Conversion funnel from signup to purchase
WITH funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_type = 'signup' THEN 1 ELSE 0 END) as signed_up,
    MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as added_cart,
    MAX(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) as checked_out,
    MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchased
  FROM r2('analytics-bucket/events/*.parquet')
  WHERE date >= '2025-01-01'
  GROUP BY user_id
)
SELECT
  SUM(signed_up) as signups,
  SUM(added_cart) as cart_adds,
  SUM(checked_out) as checkouts,
  SUM(purchased) as purchases,
  ROUND(100.0 * SUM(added_cart) / SUM(signed_up), 2) as signup_to_cart_pct,
  ROUND(100.0 * SUM(checked_out) / SUM(added_cart), 2) as cart_to_checkout_pct,
  ROUND(100.0 * SUM(purchased) / SUM(checked_out), 2) as checkout_to_purchase_pct
FROM funnel;
```

### Pattern 4: Time-Series Analysis

```sql
-- 7-day moving average of revenue
WITH daily_revenue AS (
  SELECT
    date,
    SUM(amount) as revenue
  FROM r2('sales-bucket/transactions/*.parquet')
  WHERE date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  GROUP BY date
)
SELECT
  date,
  revenue,
  AVG(revenue) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7d
FROM daily_revenue
ORDER BY date;
```

---

## Integration with Analytics Tools

### Grafana Dashboard

```typescript
// Grafana data source endpoint
app.post('/grafana/query', async (c) => {
  const { targets, range } = await c.req.json();

  const results = [];

  for (const target of targets) {
    const sql = buildSQLFromTarget(target, range);
    const result = await c.env.R2_SQL.execute(sql);

    results.push({
      target: target.target,
      datapoints: result.rows.map(row => [row.value, row.timestamp]),
    });
  }

  return c.json(results);
});

function buildSQLFromTarget(target: any, range: any) {
  return `
    SELECT
      timestamp,
      ${target.metric} as value
    FROM r2('${target.bucket}/${target.path}')
    WHERE timestamp BETWEEN '${range.from}' AND '${range.to}'
    ORDER BY timestamp
  `;
}
```

### Jupyter Notebooks (Python)

```python
import requests
import pandas as pd

def query_r2_sql(sql):
    response = requests.post(
        'https://my-worker.example.workers.dev/query',
        json={'sql': sql}
    )
    data = response.json()
    return pd.DataFrame(data['rows'])

# Query and analyze in Pandas
df = query_r2_sql("""
    SELECT date, revenue, users
    FROM r2('analytics-bucket/daily-metrics/*.parquet')
    WHERE date >= '2025-01-01'
    ORDER BY date
""")

# Pandas analysis
print(df.describe())
print(df.corr())

# Plotting
import matplotlib.pyplot as plt
df.plot(x='date', y='revenue')
plt.show()
```

---

## Limitations and Constraints

### Query Limits

- **Maximum query time**: 30 seconds
- **Maximum result size**: 10 MB
- **Maximum row count**: 100,000 rows per query
- **File size limit**: No limit, but larger files take longer to scan

### Unsupported Features

- **Mutations**: INSERT, UPDATE, DELETE not supported (read-only)
- **Transactions**: No transaction support
- **User-defined functions**: Custom SQL functions not available
- **Stored procedures**: Not supported
- **Views**: Cannot create persistent views (use CTEs)

### Data Format Requirements

- **CSV**: Must have header row
- **JSON**: Must be valid JSON or NDJSON
- **Parquet**: Must be valid Parquet format
- **Compression**: Gzip and Snappy supported, others may not work

---

## Cost Optimization

### Query Cost Factors

1. **Data scanned**: Pay per GB scanned
2. **Query complexity**: Complex joins cost more
3. **Result size**: Large result sets cost more
4. **Compression**: Compressed files reduce scan costs

### Optimization Strategies

```typescript
// 1. Query only needed date ranges
const sql = `
  SELECT * FROM r2('logs/2025-01-15/*.csv')  -- Good: specific date
  -- Not: r2('logs/*/*.csv')  -- Bad: scans everything
`;

// 2. Use columnar formats (Parquet)
// Parquet scans only queried columns vs CSV scans entire file

// 3. Partition data by date
// Store: logs/YYYY-MM-DD/app.parquet
// Not: logs/app-YYYY-MM-DD.parquet

// 4. Compress files
await env.BUCKET.put('data.parquet.gz', compressedData, {
  httpMetadata: {
    contentEncoding: 'gzip',
  },
});

// 5. Cache frequent queries
const cacheKey = `query-result:${hashSQL(sql)}`;
const cached = await env.CACHE.get(cacheKey);

if (cached) {
  return c.json(JSON.parse(cached));
}

const result = await c.env.R2_SQL.execute(sql);
await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
```

---

## Troubleshooting

### Query Timeout Errors

**Error**: "Query exceeded maximum execution time (30s)"

**Solutions**:
- Add date filters to reduce data scanned
- Use Parquet instead of CSV
- Partition data by date
- Limit result size with LIMIT clause

### Schema Mismatch Errors

**Error**: "Column 'user_id' not found"

**Solutions**:
- Check CSV header row matches query
- Verify Parquet schema with `parquet-tools`
- Ensure all files have consistent schema

### Out of Memory Errors

**Error**: "Query exceeded memory limit"

**Solutions**:
- Reduce result size with LIMIT
- Use aggregation instead of returning raw rows
- Query smaller date ranges
- Split large queries into smaller chunks

---

## Official Documentation

- **R2 SQL Overview**: https://developers.cloudflare.com/r2/sql/
- **SQL Syntax Reference**: https://developers.cloudflare.com/r2/sql/syntax/
- **Supported Functions**: https://developers.cloudflare.com/r2/sql/functions/
- **Performance Guide**: https://developers.cloudflare.com/r2/sql/performance/

---

**Query your R2 data with SQL - no ETL required!**
