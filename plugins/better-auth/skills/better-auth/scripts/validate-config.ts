#!/usr/bin/env bun
/**
 * Validate better-auth configuration
 * Usage: bun run validate-config.ts [path-to-auth.ts]
 *
 * Checks for common configuration mistakes before deployment.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const REQUIRED_FIELDS = ["secret", "database"];
const COMMON_MISTAKES = [
  { pattern: /d1Adapter/i, message: "d1Adapter doesn't exist - use drizzleAdapter(db) for Drizzle or new Kysely({ dialect: new D1Dialect() }) for Kysely" },
  { pattern: /forgetPassword/i, message: "forgetPassword is deprecated - use requestPasswordReset (v1.4.0+)" },
  { pattern: /require\s*\(/i, message: "CommonJS require() detected - better-auth v1.4.0+ is ESM-only" },
];

function validateRequiredFields(content: string): string[] {
  const errors: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!content.includes(field)) {
      errors.push(`Missing required field: '${field}'`);
    }
  }
  return errors;
}

function validateConfig(filePath: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`], warnings: [] };
  }

  const content = readFileSync(filePath, "utf-8");

  // Validate required fields
  errors.push(...validateRequiredFields(content));

  // Check for common mistakes
  for (const { pattern, message } of COMMON_MISTAKES) {
    if (pattern.test(content)) {
      errors.push(message);
    }
  }

  // Check for required imports
  if (!content.includes("betterAuth")) {
    errors.push("Missing betterAuth import");
  }

  // Check for database adapter
  if (!content.includes("drizzleAdapter") && !content.includes("prismaAdapter") && !content.includes("mongoAdapter") && !content.includes("new Kysely(")) {
    warnings.push("No database adapter detected - ensure you're using drizzleAdapter, prismaAdapter, mongoAdapter, or new Kysely()");
  }

  // Check for baseURL in production
  if (!content.includes("baseURL")) {
    warnings.push("Missing 'baseURL' - required for OAuth callbacks in production");
  }

  // Check for ESM compatibility
  if (content.includes("module.exports")) {
    errors.push("CommonJS module.exports detected - use ES module exports");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
const configPath = process.argv[2] || "./src/auth.ts";
const resolvedPath = resolve(configPath);

console.log(`\nValidating: ${resolvedPath}\n`);

const result = validateConfig(resolvedPath);

if (result.errors.length > 0) {
  console.log("ERRORS:");
  result.errors.forEach((e) => console.log(`  - ${e}`));
}

if (result.warnings.length > 0) {
  console.log("\nWARNINGS:");
  result.warnings.forEach((w) => console.log(`  - ${w}`));
}

if (result.valid && result.warnings.length === 0) {
  console.log("Configuration looks good!");
}

process.exit(result.valid ? 0 : 1);
