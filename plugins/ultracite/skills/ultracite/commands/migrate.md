---
name: ultracite:migrate
description: Migrate from ESLint/Prettier to Ultracite or upgrade v6→v7 preset paths
argument-hint: "[eslint|prettier|v6|v7]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

# Ultracite Migration Command

Interactive migration wizard for:
1. **ESLint + Prettier → Ultracite** (with rule mapping)
2. **Ultracite v6 → v7** (preset path migration)

## What This Command Does

### ESLint/Prettier Migration

Automates the complex process of migrating from ESLint and Prettier to Ultracite:

1. **Scan** existing configurations
   - Detect `.eslintrc*`, `.prettierrc*`, `.stylelintrc*`
   - Read and parse rules
   - Identify plugins and extends

2. **Analyze** compatibility
   - Map ESLint rules to Biome equivalents
   - Identify rules with no equivalent
   - Suggest workarounds for gaps

3. **Generate** biome.jsonc
   - Create equivalent configuration
   - Add comments explaining rule mapping
   - Include unmapped rules as comments

4. **Backup** old configs
   - Move to `.backup/` directory
   - Preserve for rollback if needed

5. **Validate** new config
   - Test syntax
   - Run `ultracite check` on sample files
   - Report any errors

### v6→v7 Migration

Upgrades Ultracite preset paths from v6 to v7 format:

1. **Scan** biome.jsonc for old paths
   - Detect "ultracite/core" pattern
   - Detect "ultracite/react", "ultracite/nextjs", etc.

2. **Update** preset paths
   - Replace with "ultracite/biome/core"
   - Replace with "ultracite/biome/react", etc.

3. **Validate** new paths
   - Ensure presets exist
   - Test configuration loads

4. **Report** changes made

## How to Use

### Interactive Mode (Recommended)

Simply run `/ultracite:migrate` and answer the prompts:

```
/ultracite:migrate
```

The command will:
1. Detect existing configurations
2. Ask which migration to perform
3. Guide you through the process
4. Provide a summary report

### With Argument (Skip Detection)

Specify the migration type directly:

```
/ultracite:migrate eslint
/ultracite:migrate prettier
/ultracite:migrate v6
/ultracite:migrate v7
```

## Migration Workflows

### Workflow 1: ESLint Migration

#### Step 1: Detect ESLint Configuration

Search for ESLint config files:
- `.eslintrc.js`
- `.eslintrc.json`
- `.eslintrc.yml`
- `eslint.config.js` (flat config)
- `package.json` (eslintConfig field)

Read and parse the configuration.

#### Step 2: Map Rules to Biome

Common ESLint rule mappings:

| ESLint Rule | Biome Equivalent | Status |
|-------------|------------------|--------|
| `no-unused-vars` | `correctness/noUnusedVariables` | ✅ Mapped |
| `no-console` | `suspicious/noConsoleLog` | ✅ Mapped |
| `eqeqeq` | `suspicious/noDoubleEquals` | ✅ Mapped |
| `prefer-const` | `style/useConst` | ✅ Mapped |
| `arrow-body-style` | `style/useArrowFunction` | ✅ Mapped |
| `@typescript-eslint/no-floating-promises` | *Use Oxlint provider* | ⚠️ No equivalent |
| `eslint-plugin-security/*` | *Manual review* | ⚠️ No equivalent |

Load full mapping from `references/migration-guides.md`.

#### Step 3: Generate biome.jsonc

Create configuration with:
- Mapped rules enabled
- Comments for unmapped rules
- Framework-specific presets
- Formatter settings (if Prettier detected)

Example generated config:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": [
    "ultracite/biome/core",
    "ultracite/biome/react" // Detected from eslint-plugin-react
  ],
  "linter": {
    "rules": {
      "correctness": {
        "noUnusedVariables": "error" // Mapped from no-unused-vars
      },
      "suspicious": {
        "noConsoleLog": "warn", // Mapped from no-console
        "noDoubleEquals": "error" // Mapped from eqeqeq
      }
      // @typescript-eslint/no-floating-promises: No Biome equivalent
      // Consider using Oxlint provider for type-aware linting
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space", // From Prettier config
    "lineWidth": 80 // From Prettier printWidth
  }
}
```

#### Step 4: Backup Old Configs

Move old files to `.backup/`:
```bash
mkdir -p .backup
mv .eslintrc.js .backup/
mv .prettierrc .backup/
```

#### Step 5: Validate

Run Ultracite check:
```bash
npx ultracite check .
```

Report any errors found.

### Workflow 2: Prettier Migration

#### Step 1: Detect Prettier Configuration

Search for Prettier config files:
- `.prettierrc`
- `.prettierrc.json`
- `.prettierrc.yml`
- `prettier.config.js`
- `package.json` (prettier field)

Read and parse the configuration.

#### Step 2: Map to Biome Formatter

Common Prettier option mappings:

| Prettier Option | Biome Equivalent | Notes |
|----------------|------------------|-------|
| `printWidth` | `formatter.lineWidth` | ✅ Direct mapping |
| `tabWidth` | `formatter.indentWidth` | ✅ Direct mapping |
| `useTabs` | `formatter.indentStyle: "tab"` | ✅ Direct mapping |
| `semi` | `javascript.formatter.semicolons` | ✅ Direct mapping |
| `singleQuote` | `javascript.formatter.quoteStyle` | ✅ Direct mapping |
| `trailingComma` | `javascript.formatter.trailingCommas` | ✅ Direct mapping |
| `arrowParens` | `javascript.formatter.arrowParentheses` | ✅ Direct mapping |

Load full mapping from `references/migration-guides.md`.

#### Step 3: Generate Formatter Config

Add to biome.jsonc:
```jsonc
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "semicolons": "asNeeded",
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "arrowParentheses": "asNeeded"
    }
  }
}
```

#### Step 4: Backup and Validate

Same as ESLint migration workflow.

### Workflow 3: v6→v7 Migration

#### Step 1: Detect v6 Preset Paths

Read `biome.jsonc` and search for old preset paths:
- `"ultracite/core"` → `"ultracite/biome/core"`
- `"ultracite/react"` → `"ultracite/biome/react"`
- `"ultracite/nextjs"` → `"ultracite/biome/nextjs"`
- `"ultracite/vue"` → `"ultracite/biome/vue"`
- `"ultracite/svelte"` → `"ultracite/biome/svelte"`

#### Step 2: Update Paths

Use Edit tool to replace old paths:

Before:
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/react"
  ]
}
```

After:
```jsonc
{
  "extends": [
    "ultracite/biome/core",
    "ultracite/biome/react"
  ]
}
```

#### Step 3: Validate

Check that presets exist:
```bash
node -e "require('ultracite/biome/core')"
```

#### Step 4: Report

```
v6→v7 Migration Complete

✅ Updated preset paths:
  - ultracite/core → ultracite/biome/core
  - ultracite/react → ultracite/biome/react

✅ Validated: All presets exist

Next steps:
  Run: npx ultracite check .
```

## Interactive Prompts

### Prompt 1: Migration Type Selection

```
Which migration do you want to perform?

1. ESLint → Ultracite
2. Prettier → Ultracite
3. ESLint + Prettier → Ultracite
4. Ultracite v6 → v7 (preset paths)
5. Cancel

Choose [1-5]:
```

### Prompt 2: Backup Confirmation

```
Found existing .eslintrc.js with 45 rules.

Backup old configuration files? [y/n]
(Recommended: Creates .backup/ directory)
```

### Prompt 3: Validation Confirmation

```
Generated biome.jsonc successfully.

Test new configuration before committing? [y/n]
(Will run: npx ultracite check .)
```

### Prompt 4: Cleanup Confirmation

```
Migration complete!

Remove old package dependencies? [y/n]

Will run:
  npm uninstall eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  npm uninstall prettier eslint-config-prettier

(You can do this manually later)
```

## Output Reports

### ESLint Migration Report

```
ESLint → Ultracite Migration Report
===================================

ANALYSIS
--------
✅ Found .eslintrc.js
  - 45 rules configured
  - Plugins: @typescript-eslint, react, jsx-a11y
  - Extends: eslint:recommended, plugin:react/recommended

RULE MAPPING
------------
✅ Mapped: 40 rules (89%)
⚠️ No equivalent: 5 rules (11%)

Unmapped Rules:
1. @typescript-eslint/no-floating-promises
   → Use Oxlint provider (supports type-aware linting)
   → See references/provider-oxlint.md

2. eslint-plugin-security/detect-object-injection
   → Manual code review recommended
   → No automatic detection in Biome

3. eslint-plugin-security/detect-non-literal-require
   → Manual code review recommended

4. import/no-cycle
   → Manual dependency analysis needed

5. react/no-unstable-nested-components
   → Manual code review recommended

GENERATED CONFIGURATION
-----------------------
✅ Created biome.jsonc
  - Framework preset: React
  - Provider: Biome
  - Rules: 40 mapped + comments for 5 unmapped
  - Formatter: Enabled (Prettier settings preserved)

BACKUP
------
✅ Backed up to .backup/:
  - .eslintrc.js
  - .prettierrc

VALIDATION
----------
✅ Configuration syntax: Valid
✅ Test run: npx ultracite check .
  - 0 errors
  - 3 warnings (fixable)

NEXT STEPS
----------
1. Review generated biome.jsonc
2. Address unmapped rules (see comments in config)
3. Run: npx ultracite check --write .
4. Remove old packages:
     npm uninstall eslint prettier
5. Update scripts in package.json:
     "lint": "ultracite check ."
     "format": "ultracite check --write ."

Migration Status: ✅ SUCCESS (with 5 unmapped rules to review)
```

### v6→v7 Migration Report

```
Ultracite v6→v7 Migration Report
================================

DETECTED
--------
✅ Found biome.jsonc with v6 preset paths

CHANGES
-------
✅ Updated preset paths:
  - "ultracite/core" → "ultracite/biome/core"
  - "ultracite/react" → "ultracite/biome/react"

VALIDATION
----------
✅ All presets exist
✅ Configuration syntax valid
✅ Test run: npx ultracite check .
  - 0 errors

NEXT STEPS
----------
1. Commit changes to biome.jsonc
2. Run: npx ultracite check .

Migration Status: ✅ SUCCESS
```

## Error Handling

### No Configuration Found

```
❌ No ESLint or Prettier configuration found

Looking for:
  - .eslintrc.js, .eslintrc.json, .eslintrc.yml
  - .prettierrc, .prettierrc.json, prettier.config.js
  - package.json with eslintConfig or prettier fields

To create new Ultracite config:
  Run: npx ultracite init
```

### Parsing Error

```
❌ Failed to parse .eslintrc.js

Error: Unexpected token at line 12
  10: module.exports = {
  11:   extends: ['eslint:recommended'],
> 12:   rules: {
            ^
  Error: Invalid JavaScript

Fix: Verify .eslintrc.js syntax
```

### Validation Failure

```
❌ Generated configuration failed validation

Error: npx ultracite check . exited with code 1

  12 errors found
  - src/App.tsx:15: Unexpected console statement
  - src/utils/api.ts:42: Missing return type

Fix: Review errors and adjust biome.jsonc rules
```

## When to Use

Use `/ultracite:migrate` when:

- ✅ Migrating from ESLint to Ultracite
- ✅ Migrating from Prettier to Ultracite
- ✅ Upgrading from Ultracite v6 to v7
- ✅ Consolidating ESLint + Prettier into Ultracite
- ✅ Switching providers (ESLint → Biome)
- ✅ Adopting Ultracite in existing projects

## Related Resources

- Load `references/migration-guides.md` - Detailed ESLint/Prettier mappings
- Load `references/v6-migration.md` - v6→v7 migration guide
- Load `references/v7-migration.md` - v7 features and changes
- Load `references/provider-biome.md` - Biome provider details
- Load `references/troubleshooting.md` - Common migration issues

## Related Commands

- `/ultracite:doctor` - Validate setup after migration
- Agent: `migration-assistant` - Get detailed migration analysis

## Implementation Notes

This command uses:
- **Read** tool to read existing configs
- **Glob** tool to find config files
- **Write** tool to create biome.jsonc
- **Edit** tool to update preset paths
- **Bash** tool to run validation
- **AskUserQuestion** tool for interactive prompts

Files may be modified - always creates backups before making changes.
