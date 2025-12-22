// Cross-Shard Aggregation Patterns Template
// Patterns for querying across multiple shards

import { Pool } from 'pg';

// SQL identifier validation to prevent injection
// Only allows alphanumeric + underscore (standard SQL identifiers)
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function validateIdentifier(name: string, type: string): void {
  if (!isValidIdentifier(name)) {
    throw new Error(`Invalid ${type} identifier: "${name}". Only alphanumeric and underscore allowed.`);
  }
}

export class CrossShardAggregator {
  constructor(private shards: Pool[]) {}

  // COUNT across all shards
  async count(table: string, where: string = '1=1', params: any[] = []): Promise<number> {
    // Validate table name to prevent SQL injection
    validateIdentifier(table, 'table');

    const counts = await Promise.all(
      this.shards.map(shard =>
        shard.query(`SELECT COUNT(*) as count FROM ${table} WHERE ${where}`, params)
      )
    );

    return counts.reduce((total, result) => total + parseInt(result.rows[0].count), 0);
  }

  // SUM across all shards
  async sum(table: string, column: string, where: string = '1=1', params: any[] = []): Promise<number> {
    // Validate identifiers to prevent SQL injection
    validateIdentifier(table, 'table');
    validateIdentifier(column, 'column');

    const sums = await Promise.all(
      this.shards.map(shard =>
        shard.query(`SELECT SUM(${column}) as sum FROM ${table} WHERE ${where}`, params)
      )
    );

    return sums.reduce((total, result) => total + parseFloat(result.rows[0].sum || 0), 0);
  }

  // AVG across all shards (weighted by count)
  async avg(table: string, column: string, where: string = '1=1', params: any[] = []): Promise<number> {
    // Validate identifiers to prevent SQL injection
    validateIdentifier(table, 'table');
    validateIdentifier(column, 'column');

    const stats = await Promise.all(
      this.shards.map(shard =>
        shard.query(`SELECT SUM(${column}) as sum, COUNT(*) as count FROM ${table} WHERE ${where}`, params)
      )
    );

    const totalSum = stats.reduce((sum, result) => sum + parseFloat(result.rows[0].sum || 0), 0);
    const totalCount = stats.reduce((count, result) => count + parseInt(result.rows[0].count), 0);

    return totalCount > 0 ? totalSum / totalCount : 0;
  }

  // GROUP BY across all shards
  async groupBy(table: string, groupColumn: string, aggColumn: string, aggFunc: 'SUM' | 'COUNT' | 'AVG', where: string = '1=1', params: any[] = []): Promise<any[]> {
    // Validate all identifiers to prevent SQL injection
    validateIdentifier(table, 'table');
    validateIdentifier(groupColumn, 'column');
    validateIdentifier(aggColumn, 'column');

    // Execute GROUP BY on each shard
    const shardResults = await Promise.all(
      this.shards.map(shard =>
        shard.query(
          `SELECT ${groupColumn}, ${aggFunc}(${aggColumn}) as value FROM ${table} WHERE ${where} GROUP BY ${groupColumn}`,
          params
        )
      )
    );

    // Merge groups
    const merged = new Map<string, number>();
    for (const result of shardResults) {
      for (const row of result.rows) {
        const key = row[groupColumn];
        const value = parseFloat(row.value);
        merged.set(key, (merged.get(key) || 0) + value);
      }
    }

    return Array.from(merged.entries()).map(([key, value]) => ({
      [groupColumn]: key,
      value
    })).sort((a, b) => b.value - a.value);
  }

  // Top N across all shards
  async topN(table: string, orderColumn: string, n: number, where: string = '1=1', params: any[] = []): Promise<any[]> {
    // Validate identifiers to prevent SQL injection
    validateIdentifier(table, 'table');
    validateIdentifier(orderColumn, 'column');

    // Get top N from each shard
    const results = await Promise.all(
      this.shards.map(shard =>
        shard.query(`SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderColumn} DESC LIMIT $${params.length + 1}`, [...params, n])
      )
    );

    // Merge and re-sort
    return results.flatMap(r => r.rows)
      .sort((a, b) => b[orderColumn] - a[orderColumn])
      .slice(0, n);
  }

  // Cursor-based pagination across shards
  async paginate(table: string, orderColumn: string, limit: number, cursor?: any): Promise<{ data: any[], nextCursor: any }> {
    // Validate identifiers to prevent SQL injection
    validateIdentifier(table, 'table');
    validateIdentifier(orderColumn, 'column');

    const cursorValue = cursor || new Date();

    // Get limit from each shard
    const results = await Promise.all(
      this.shards.map(shard =>
        shard.query(
          `SELECT * FROM ${table} WHERE ${orderColumn} < $1 ORDER BY ${orderColumn} DESC LIMIT $2`,
          [cursorValue, limit]
        )
      )
    );

    // Merge and sort
    const merged = results.flatMap(r => r.rows)
      .sort((a, b) => b[orderColumn] - a[orderColumn])
      .slice(0, limit);

    return {
      data: merged,
      nextCursor: merged.length > 0 ? merged[merged.length - 1][orderColumn] : null
    };
  }
}

// Usage Example
const aggregator = new CrossShardAggregator([shard0, shard1, shard2, shard3]);

// Count all active users
const activeUserCount = await aggregator.count('users', 'status = $1', ['active']);
console.log(`Active users: ${activeUserCount}`);

// Sum of all order totals
const revenue = await aggregator.sum('orders', 'total', 'status = $1', ['completed']);
console.log(`Total revenue: $${revenue}`);

// Average order value
const avgOrderValue = await aggregator.avg('orders', 'total', 'status = $1', ['completed']);
console.log(`Average order: $${avgOrderValue}`);

// Orders by country
const ordersByCountry = await aggregator.groupBy('orders', 'country', 'total', 'SUM');
console.log('Orders by country:', ordersByCountry);
// [{ country: 'US', value: 1500000 }, { country: 'UK', value: 500000 }, ...]

// Top 10 products by sales
const topProducts = await aggregator.topN('products', 'sales', 10);
console.log('Top 10 products:', topProducts);

// Paginate users
const page1 = await aggregator.paginate('users', 'created_at', 20);
const page2 = await aggregator.paginate('users', 'created_at', 20, page1.nextCursor);
