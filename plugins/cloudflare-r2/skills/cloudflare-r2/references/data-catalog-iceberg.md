# R2 Data Catalog with Apache Iceberg

**Last Updated**: 2025-12-27
**Status**: NEW FEATURE (2025)

Manage structured data in R2 using Apache Iceberg table format with versioning, time-travel queries, schema evolution, and integration with analytics tools.

---

## Overview

R2 Data Catalog provides built-in Apache Iceberg support for managing structured data in object storage. Iceberg is an open table format that enables ACID transactions, schema evolution, and efficient query performance on large datasets.

**Key Features**:
- **Table versioning** - Track changes over time with snapshots
- **Time-travel queries** - Query data as it existed at any point in time
- **Schema evolution** - Add/remove columns without rewriting data
- **Partition evolution** - Change partitioning without data migration
- **ACID transactions** - Atomic writes with snapshot isolation
- **Metadata management** - Efficient file tracking and pruning

**Use Cases**:
- Data lakes and lakehouses
- Analytics on large datasets
- Compliance and audit trails (time-travel)
- Schema evolution without downtime
- Integration with Spark, Snowflake, Trino, Presto

---

## Apache Iceberg Basics

### What is Apache Iceberg?

Iceberg is a high-performance table format for huge analytic datasets. It solves problems with traditional data lake formats:

| Feature | Traditional Parquet | Apache Iceberg |
|---------|---------------------|----------------|
| **ACID transactions** | No | Yes |
| **Time travel** | No | Yes (snapshot-based) |
| **Schema evolution** | Rewrite data | Update metadata only |
| **Partition evolution** | Rewrite data | Update metadata only |
| **Hidden partitioning** | Manual partition management | Automatic |
| **Snapshot isolation** | No | Yes |
| **Table statistics** | None | Built-in (for query optimization) |

### Iceberg Table Structure

```
r2://my-bucket/warehouse/
├── database1/
│   └── table1/
│       ├── metadata/
│       │   ├── v1.metadata.json      # Table schema v1
│       │   ├── v2.metadata.json      # Table schema v2
│       │   ├── snap-123.avro         # Snapshot manifest
│       │   └── snap-456.avro
│       └── data/
│           ├── part-00001.parquet
│           ├── part-00002.parquet
│           └── ...
```

**Metadata files** track schema, snapshots, and data files
**Data files** contain actual table data (Parquet format)
**Snapshots** represent table state at a point in time

---

## Creating Iceberg Tables

### Option 1: Using R2 Data Catalog API

```typescript
import { Hono } from 'hono';

type Bindings = {
  DATA_BUCKET: R2Bucket;
  CATALOG: DataCatalog; // Iceberg catalog binding
};

const app = new Hono<{ Bindings: Bindings }>();

// Create Iceberg table
app.post('/catalog/create-table', async (c) => {
  const { namespace, tableName, schema } = await c.req.json();

  const table = await c.env.CATALOG.createTable({
    namespace: namespace,     // e.g., "sales" or "logs"
    name: tableName,          // e.g., "transactions"
    schema: {
      fields: [
        { id: 1, name: 'transaction_id', type: 'long', required: true },
        { id: 2, name: 'user_id', type: 'long', required: true },
        { id: 3, name: 'amount', type: 'decimal(10,2)', required: true },
        { id: 4, name: 'timestamp', type: 'timestamptz', required: true },
        { id: 5, name: 'status', type: 'string', required: false },
      ],
    },
    partitionSpec: {
      fields: [
        { sourceId: 4, transform: 'day', name: 'transaction_day' },  // Partition by day
      ],
    },
    location: `r2://data-bucket/warehouse/${namespace}/${tableName}`,
  });

  return c.json({
    success: true,
    table: table.name,
    location: table.location,
    snapshot: table.currentSnapshotId,
  });
});

export default app;
```

### Option 2: Using Spark SQL

```python
from pyspark.sql import SparkSession

# Configure Spark for R2 with Iceberg
spark = SparkSession.builder \
    .config('spark.sql.catalog.r2', 'org.apache.iceberg.spark.SparkCatalog') \
    .config('spark.sql.catalog.r2.type', 'rest') \
    .config('spark.sql.catalog.r2.uri', 'https://catalog-api.example.workers.dev') \
    .config('spark.sql.catalog.r2.warehouse', 'r2://my-bucket/warehouse') \
    .getOrCreate()

# Create table with SQL
spark.sql("""
    CREATE TABLE r2.sales.transactions (
        transaction_id BIGINT,
        user_id BIGINT,
        amount DECIMAL(10,2),
        timestamp TIMESTAMP,
        status STRING
    )
    USING iceberg
    PARTITIONED BY (days(timestamp))
    LOCATION 'r2://data-bucket/warehouse/sales/transactions'
""")
```

---

## Inserting Data

### Append New Data

```python
# Spark DataFrame to Iceberg table
from pyspark.sql import functions as F

# Create sample data
transactions = spark.createDataFrame([
    (1, 101, 99.99, '2025-01-15 10:00:00', 'completed'),
    (2, 102, 149.50, '2025-01-15 11:30:00', 'completed'),
    (3, 103, 79.99, '2025-01-15 12:00:00', 'pending'),
], ['transaction_id', 'user_id', 'amount', 'timestamp', 'status'])

# Append to Iceberg table (creates new snapshot)
transactions.writeTo('r2.sales.transactions').append()
```

### Overwrite Data

```python
# Overwrite specific partition
transactions.writeTo('r2.sales.transactions') \
    .overwritePartitions()  # Overwrites only affected partitions
```

### Upsert (Merge)

```python
# Merge/upsert data
spark.sql("""
    MERGE INTO r2.sales.transactions t
    USING updates u
    ON t.transaction_id = u.transaction_id
    WHEN MATCHED THEN
        UPDATE SET t.status = u.status
    WHEN NOT MATCHED THEN
        INSERT *
""")
```

---

## Time-Travel Queries

### Query Historical Data

```python
# Query table as of specific timestamp
spark.sql("""
    SELECT *
    FROM r2.sales.transactions
    FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00'
    WHERE amount > 100
""")

# Query specific snapshot by ID
spark.sql("""
    SELECT *
    FROM r2.sales.transactions
    FOR SYSTEM_VERSION AS OF 12345678
    WHERE status = 'completed'
""")

# Query snapshot 3 days ago
spark.sql("""
    SELECT *
    FROM r2.sales.transactions
    FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP - INTERVAL 3 DAYS
""")
```

### List Snapshots

```python
# View snapshot history
spark.sql("""
    SELECT
        made_current_at,
        snapshot_id,
        parent_id,
        operation,
        summary
    FROM r2.sales.transactions.snapshots
    ORDER BY made_current_at DESC
""")
```

---

## Schema Evolution

### Add Columns

```python
# Add new column without rewriting data
spark.sql("""
    ALTER TABLE r2.sales.transactions
    ADD COLUMNS (
        payment_method STRING COMMENT 'Payment type (card, cash, crypto)',
        discount_applied DECIMAL(10,2) DEFAULT 0.0
    )
""")

# Existing data: new columns are NULL
# New data: columns populated
```

### Rename Columns

```python
# Rename column (metadata-only operation)
spark.sql("""
    ALTER TABLE r2.sales.transactions
    RENAME COLUMN status TO transaction_status
""")
```

### Drop Columns

```python
# Drop column (metadata-only, data not deleted)
spark.sql("""
    ALTER TABLE r2.sales.transactions
    DROP COLUMN discount_applied
""")
```

### Change Column Type

```python
# Promote int to long (safe operation)
spark.sql("""
    ALTER TABLE r2.sales.transactions
    ALTER COLUMN user_id TYPE BIGINT
""")
```

---

## Partition Evolution

### Add Partitioning

```python
# Change partitioning scheme
spark.sql("""
    ALTER TABLE r2.sales.transactions
    DROP PARTITION FIELD transaction_day
""")

spark.sql("""
    ALTER TABLE r2.sales.transactions
    ADD PARTITION FIELD hours(timestamp)  -- Partition by hour instead
""")
```

**Note**: Iceberg handles partition evolution automatically - old data stays in old partitions, new data uses new partitions.

---

## Maintenance Operations

### Expire Old Snapshots

```python
# Remove snapshots older than 7 days
spark.sql("""
    CALL r2.system.expire_snapshots(
        table => 'sales.transactions',
        older_than => TIMESTAMP '2025-01-08 00:00:00',
        retain_last => 5  -- Keep at least 5 snapshots
    )
""")
```

### Remove Orphan Files

```python
# Delete data files not referenced by any snapshot
spark.sql("""
    CALL r2.system.remove_orphan_files(
        table => 'sales.transactions',
        older_than => TIMESTAMP '2025-01-08 00:00:00'
    )
""")
```

### Rewrite Data Files

```python
# Compact small files into larger ones
spark.sql("""
    CALL r2.system.rewrite_data_files(
        table => 'sales.transactions',
        strategy => 'binpack',
        options => map('target-file-size-bytes', '536870912')  -- 512MB files
    )
""")
```

### Rewrite Manifests

```python
# Optimize metadata files
spark.sql("""
    CALL r2.system.rewrite_manifests('sales.transactions')
""")
```

---

## Integration with Analytics Tools

### Snowflake External Tables

```sql
-- Create external table pointing to Iceberg in R2
CREATE EXTERNAL TABLE sales.transactions
WITH LOCATION = 'r2://data-bucket/warehouse/sales/transactions/'
FILE_FORMAT = (TYPE = PARQUET)
CATALOG = 'iceberg_catalog'
AUTO_REFRESH = TRUE;

-- Query from Snowflake
SELECT * FROM sales.transactions WHERE amount > 100;
```

### Trino/Presto Queries

```sql
-- Configure Iceberg catalog
-- In catalog/iceberg.properties:
connector.name=iceberg
iceberg.catalog.type=rest
iceberg.rest.uri=https://catalog-api.example.workers.dev
iceberg.rest.warehouse=r2://my-bucket/warehouse

-- Query from Trino
SELECT
    DATE_TRUNC('day', timestamp) as day,
    COUNT(*) as transactions,
    SUM(amount) as total_amount
FROM iceberg.sales.transactions
WHERE timestamp >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY 1
ORDER BY 1;
```

### DuckDB Integration

```python
import duckdb

# Connect to Iceberg table in R2
conn = duckdb.connect()

conn.execute("""
    INSTALL iceberg;
    LOAD iceberg;
""")

# Query Iceberg table
result = conn.execute("""
    SELECT *
    FROM iceberg_scan('r2://data-bucket/warehouse/sales/transactions')
    WHERE amount > 100
""").fetchdf()

print(result)
```

---

## Workers Integration

### Query Iceberg from Workers

```typescript
type Bindings = {
  CATALOG: DataCatalog;
  R2_SQL: R2SQLEngine;
};

const app = new Hono<{ Bindings: Bindings }>();

// Query Iceberg table with R2 SQL
app.get('/analytics/recent-transactions', async (c) => {
  const sql = `
    SELECT
      transaction_id,
      user_id,
      amount,
      timestamp,
      status
    FROM iceberg.sales.transactions
    WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  const result = await c.env.R2_SQL.execute(sql);

  return c.json({
    transactions: result.rows,
    count: result.rowCount,
  });
});

// Get table schema
app.get('/catalog/tables/:namespace/:table/schema', async (c) => {
  const namespace = c.req.param('namespace');
  const tableName = c.req.param('table');

  const table = await c.env.CATALOG.loadTable(namespace, tableName);

  return c.json({
    name: table.name,
    schema: table.schema,
    partitionSpec: table.partitionSpec,
    currentSnapshot: table.currentSnapshotId,
    location: table.location,
  });
});

// List table snapshots
app.get('/catalog/tables/:namespace/:table/snapshots', async (c) => {
  const namespace = c.req.param('namespace');
  const tableName = c.req.param('table');

  const snapshots = await c.env.CATALOG.listSnapshots(namespace, tableName);

  return c.json({
    snapshots: snapshots.map(s => ({
      snapshotId: s.snapshotId,
      parentId: s.parentId,
      timestamp: s.timestampMillis,
      operation: s.operation,
      summary: s.summary,
    })),
  });
});

export default app;
```

---

## Performance Best Practices

### 1. Choose Appropriate Partitioning

```python
# Good: Partition by date for time-series data
PARTITIONED BY (days(timestamp))

# Bad: Too many partitions (high cardinality)
PARTITIONED BY (user_id)  # Millions of partitions

# Good: Multi-level partitioning
PARTITIONED BY (days(timestamp), bucket(16, user_id))
```

### 2. Hidden Partitioning

Iceberg automatically handles partitioning:

```python
# Write data without specifying partitions
transactions.writeTo('r2.sales.transactions').append()

# Iceberg automatically partitions by days(timestamp)
# No need to organize files manually
```

### 3. File Size Optimization

```python
# Configure target file size (512MB recommended)
spark.conf.set('write.target-file-size-bytes', 536870912)

# Compact small files regularly
spark.sql("CALL r2.system.rewrite_data_files('sales.transactions')")
```

### 4. Metadata Caching

```python
# Cache table metadata for faster queries
spark.conf.set('iceberg.metadata-cache-enabled', 'true')
spark.conf.set('iceberg.metadata-cache-expiration-interval-ms', '300000')  # 5 minutes
```

---

## Migration from Parquet to Iceberg

### Step 1: Analyze Existing Data

```python
# Read existing Parquet files
parquet_df = spark.read.parquet('r2://data-bucket/legacy-data/*.parquet')

# Infer schema
parquet_df.printSchema()
```

### Step 2: Create Iceberg Table

```python
# Create Iceberg table with matching schema
spark.sql("""
    CREATE TABLE r2.sales.transactions_iceberg
    USING iceberg
    PARTITIONED BY (days(timestamp))
    AS SELECT * FROM parquet_df
    WHERE 1=0  -- Create schema only
""")
```

### Step 3: Migrate Data

```python
# Migrate data in batches
parquet_df.writeTo('r2.sales.transactions_iceberg').append()

# Verify row counts
iceberg_count = spark.table('r2.sales.transactions_iceberg').count()
parquet_count = parquet_df.count()

assert iceberg_count == parquet_count, "Row count mismatch!"
```

### Step 4: Switch Applications

```python
# Update application queries to use Iceberg table
# Old: spark.read.parquet('r2://data-bucket/legacy-data/*.parquet')
# New: spark.table('r2.sales.transactions_iceberg')
```

### Step 5: Clean Up

```python
# After verification, delete old Parquet files
# Keep legacy data for rollback period (e.g., 30 days)
```

---

## Troubleshooting

### Table Not Found Errors

**Error**: "Table 'sales.transactions' does not exist"

**Solutions**:
- Check namespace and table name spelling
- Verify catalog configuration (REST URI, warehouse location)
- Ensure table was created successfully

### Schema Evolution Errors

**Error**: "Cannot change column type from STRING to INT"

**Solutions**:
- Only safe type promotions allowed (int→long, float→double)
- Use ALTER COLUMN for safe changes
- Rewrite data for unsafe changes

### Snapshot Expiration Warnings

**Error**: "Snapshot not found: 12345678"

**Solutions**:
- Snapshot may have been expired
- Check retention policy with `retain_last`
- Increase snapshot retention period

### Performance Issues

**Problem**: Slow queries on large tables

**Solutions**:
- Add appropriate partitioning
- Compact small files with `rewrite_data_files`
- Enable metadata caching
- Use column pruning (SELECT specific columns)
- Add partition pruning (WHERE on partition columns)

---

## Official Documentation

- **Apache Iceberg**: https://iceberg.apache.org/
- **R2 Data Catalog**: https://developers.cloudflare.com/r2/data-catalog/
- **Iceberg Spark**: https://iceberg.apache.org/docs/latest/spark/
- **Schema Evolution**: https://iceberg.apache.org/docs/latest/evolution/
- **Maintenance**: https://iceberg.apache.org/docs/latest/maintenance/

---

**Manage structured data in R2 with Apache Iceberg - versioning, time-travel, and schema evolution!**
