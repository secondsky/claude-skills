#!/usr/bin/env tsx
/**
 * Test Neon/Vercel Postgres Connection
 *
 * Usage:
 *   npm install -g tsx
 *   npx tsx scripts/test-connection.ts
 *
 * Environment Variables:
 *   DATABASE_URL or POSTGRES_URL - Your Neon/Vercel Postgres connection string
 */

import { neon } from '@neondatabase/serverless';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable not set');
    console.log('\nSet your connection string:');
    console.log('  export DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db?sslmode=require"');
    process.exit(1);
  }

  console.log('🔗 Testing Neon/Vercel Postgres connection...\n');

  // Check if using pooled connection
  if (connectionString.includes('-pooler.')) {
    console.log('✅ Using pooled connection string (recommended for serverless)');
  } else {
    console.log('⚠️  Warning: Not using pooled connection string');
    console.log('   For serverless, use pooled connection: ...@ep-xyz-pooler.region.aws.neon.tech/...');
  }

  // Check SSL mode
  if (connectionString.includes('sslmode=require')) {
    console.log('✅ SSL mode enabled (sslmode=require)');
  } else {
    console.log('⚠️  Warning: SSL mode not set. Add "?sslmode=require" to connection string');
  }

  console.log('');

  try {
    const sql = neon(connectionString);

    // Test query
    console.log('📊 Running test query: SELECT NOW()...');
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

    console.log('✅ Connection successful!');
    console.log('');
    console.log('Database Info:');
    console.log(`  Time: ${result[0].current_time}`);
    console.log(`  Version: ${result[0].pg_version}`);

    // Test table creation
    console.log('');
    console.log('🔧 Testing table operations...');

    await sql`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ CREATE TABLE successful');

    const [insertResult] = await sql`
      INSERT INTO connection_test (test_message)
      VALUES ('Connection test successful')
      RETURNING *
    `;
    console.log('✅ INSERT successful');
    console.log(`  Inserted ID: ${insertResult.id}`);

    const selectResult = await sql`SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1`;
    console.log('✅ SELECT successful');
    console.log(`  Latest message: ${selectResult[0].test_message}`);

    await sql`DROP TABLE connection_test`;
    console.log('✅ DROP TABLE successful');

    console.log('');
    console.log('🎉 All tests passed! Your Neon/Vercel Postgres connection is working correctly.');

  } catch (error: any) {
    console.error('❌ Connection failed:');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('Common fixes:');
    console.error('  1. Verify connection string format');
    console.error('  2. Ensure using pooled connection (-pooler. in hostname)');
    console.error('  3. Add ?sslmode=require to connection string');
    console.error('  4. Check Neon dashboard for compute status');
    console.error('  5. Verify database exists and credentials are correct');
    process.exit(1);
  }
}

testConnection();
