---
name: cloudflare-durable-objects:migrate
description: Interactive Durable Objects migration assistant. Guides through new class creation, renaming, deletion, and transfer migrations with validation.
---

# Durable Objects Migration Command

Interactive command to safely create and manage Durable Objects migrations. Handles new classes, renaming, deletion, and transfers with automatic validation and backup.

## Overview

This command simplifies DO migration management by:

- Generating correct migration syntax for all migration types
- Validating migration configuration before committing
- Auto-incrementing migration tags (v1, v2, v3...)
- Backing up wrangler.jsonc before changes
- Checking for common migration errors
- Providing rollback instructions

## Step 1: Analyze Current Configuration

Before prompting user, analyze the current project state:

### Read wrangler.jsonc

```bash
cat wrangler.jsonc
```

Parse configuration to extract:
- Existing Durable Object bindings
- Current migrations array
- Last migration tag (for auto-increment)
- Class names currently in use

### Identify Migration Context

Determine project state:

**Case 1: No Existing Migrations**
- First-time migration setup
- Recommend new_sqlite_classes for all DOs
- Suggest v1 as initial tag

**Case 2: Existing Migrations**
- Extract last migration tag
- Suggest next sequential tag (v2, v3, etc.)
- Show migration history for context

**Case 3: No DO Bindings**
- No DOs configured yet
- Recommend running `/do-setup` first
- Offer to continue anyway (for planning)

### Display Current State

Show user the current configuration:

```plaintext
Current Durable Objects Configuration:

Bindings:
  - MY_DO → MyDurableObject
  - CHAT_ROOM → ChatRoom

Migrations:
  - v1: new_sqlite_classes [MyDurableObject]
  - v2: new_sqlite_classes [ChatRoom]

Next migration tag: v3
```

## Step 2: Gather Migration Requirements

Use AskUserQuestion tool to determine migration type and details:

### Question 1: Migration Type
**Question**: "What type of migration do you need to perform?"
**Header**: "Migration Type"
**Options**:
- **New Class** - Add a new Durable Object class
  - Description: "Create migration for newly added DO class (new_sqlite_classes)"
- **Rename Class** - Rename existing Durable Object class
  - Description: "Migrate DO instances to renamed class (renamed_classes)"
- **Delete Class** - Remove Durable Object class
  - Description: "Delete all DO instances and remove class (deleted_classes)"
- **Transfer Class** - Move DO class to different Worker script
  - Description: "Transfer DO instances to another script (transferred_classes)"

### Question 2: Storage Backend (Only for "New Class")

If user selected **New Class**, ask:

**Question**: "Which storage backend will this Durable Object use?"
**Header**: "Storage Backend"
**Options**:
- **SQL Storage (Recommended)** - SQLite backend with 1GB limit
  - Description: "Use new_sqlite_classes in migration"
- **Key-Value Storage** - KV backend with 128MB limit
  - Description: "Use new_classes in migration"

**Note**: For other migration types, storage backend is already determined by existing class.

### Question 3: Class Details

Gather class name(s) based on migration type:

#### For "New Class"

**Prompt**: "Enter the name of the new Durable Object class to add:"

Show existing class names for reference:
```plaintext
Existing classes:
  - MyDurableObject
  - ChatRoom

New class name: _______
```

Validation:
- Must be PascalCase
- Must not already exist in bindings
- Must be exported in Worker code (check src/)

#### For "Rename Class"

**Prompt 1**: "Enter the current class name to rename:"

Show dropdown/autocomplete of existing class names:
```plaintext
Select class to rename:
  > MyDurableObject
    ChatRoom
```

**Prompt 2**: "Enter the new class name:"

Validation:
- New name must be PascalCase
- New name must not conflict with existing classes
- Warn about code changes required

#### For "Delete Class"

**Prompt**: "Enter the class name to delete:"

Show dropdown of existing classes with WARNING:

```plaintext
⚠️  WARNING: Deleting a class permanently destroys all DO instances and data!

Select class to delete:
  > MyDurableObject
    ChatRoom

This action cannot be undone. Continue? [y/N]
```

Require explicit confirmation due to data loss.

#### For "Transfer Class"

**Prompt 1**: "Enter the class name to transfer:"

Show existing classes:
```
Select class to transfer:
  > MyDurableObject
    ChatRoom
```

**Prompt 2**: "Enter the destination Worker script name:"

```
Current script: my-worker
Destination script: _______
```

Validation:
- Destination script must exist
- Destination script must have wrangler.jsonc configured

### Question 4: Migration Tag

**Question**: "What tag should this migration use?"
**Header**: "Migration Tag"

**Suggested Tag**: Auto-calculated based on existing migrations (e.g., v3)

**Options**:
- **Use Suggested Tag (v3)** - Auto-incremented version
  - Description: "Recommended: sequential versioning"
- **Custom Tag** - Specify custom migration tag
  - Description: "Advanced: use semantic versioning (e.g., v2.1.0)"

If **Custom Tag** selected, prompt:
```
Enter custom migration tag: _______
```

Validation:
- Tag must be unique
- Tag must not already exist in migrations array
- Warn if tag breaks sequential pattern

## Step 3: Validate Migration

Before generating migration, perform validation checks:

### Check 1: Class Export Validation

For **New Class** migrations, verify class is exported:

```bash
# Check if class is exported in main file
grep "export class NEW_CLASS_NAME" src/index.ts
```

If not found:
```
⚠️  WARNING: Class 'MyNewDO' not found in src/index.ts

Before deploying, ensure:
  export class MyNewDO extends DurableObject { ... }

Continue anyway? [y/N]
```

### Check 2: Binding Validation

For **New Class** migrations, check if binding exists:

```bash
# Check wrangler.jsonc for binding
jq '.durable_objects.bindings[]? | select(.class_name == "NEW_CLASS_NAME")' wrangler.jsonc
```

If not found:
```
⚠️  WARNING: No binding found for class 'MyNewDO'

After migration, add to wrangler.jsonc:
  "durable_objects": {
    "bindings": [
      { "name": "MY_NEW_DO", "class_name": "MyNewDO" }
    ]
  }

Continue? [y/N]
```

### Check 3: Destructive Action Confirmation

For **Delete** migrations, require triple confirmation:

```
⚠️  DESTRUCTIVE ACTION: Deleting class 'MyDurableObject'

This will:
  1. Permanently delete ALL DO instances of this class
  2. Destroy ALL data stored in these instances
  3. Remove the class from production

Type the class name to confirm: _______
Type 'DELETE' to proceed: _______
Final confirmation [yes/NO]: _______
```

Only proceed if all three confirmations match.

### Check 4: Migration Conflicts

Check for potential conflicts:

**Sequential Tag Check**:
```
Warning: Migration tag 'v5' but last migration was 'v2'
This creates a gap in versioning.

Recommended: Use sequential tags (v3, v4, v5...)
Continue with v5? [y/N]
```

**Duplicate Class Check**:
```
Error: Class 'MyDurableObject' already has migration in v1
Cannot create duplicate migration.

Options:
  1. Use different class name
  2. Cancel and review existing migrations
```

## Step 4: Generate Migration JSON

Create migration JSON based on type:

### New Class Migration

```json
{
  "tag": "MIGRATION_TAG",
  "new_sqlite_classes": ["CLASS_NAME"]
}
```

Or for KV storage:

```json
{
  "tag": "MIGRATION_TAG",
  "new_classes": ["CLASS_NAME"]
}
```

### Rename Class Migration

```json
{
  "tag": "MIGRATION_TAG",
  "renamed_classes": [
    {
      "from": "OLD_CLASS_NAME",
      "to": "NEW_CLASS_NAME"
    }
  ]
}
```

### Delete Class Migration

```json
{
  "tag": "MIGRATION_TAG",
  "deleted_classes": ["CLASS_NAME"]
}
```

### Transfer Class Migration

```json
{
  "tag": "MIGRATION_TAG",
  "transferred_classes": [
    {
      "from": "CLASS_NAME",
      "from_script": "CURRENT_SCRIPT_NAME",
      "to_script": "DESTINATION_SCRIPT_NAME"
    }
  ]
}
```

## Step 5: Preview and Confirm

Display generated migration for review:

```
Generated Migration:
====================

{
  "tag": "v3",
  "new_sqlite_classes": ["MyNewDO"]
}

This will be added to wrangler.jsonc migrations array.

Action Summary:
  - Migration tag: v3
  - Type: New class (SQL storage)
  - Class: MyNewDO
  - Backup: wrangler.jsonc.bak

Next steps after applying:
  1. Ensure class exported: export class MyNewDO extends DurableObject { ... }
  2. Add binding to wrangler.jsonc
  3. Deploy: wrangler deploy

Apply this migration? [y/N]
```

Wait for user confirmation before proceeding.

## Step 6: Backup Configuration

Create backup of wrangler.jsonc before making changes:

```bash
cp wrangler.jsonc wrangler.jsonc.bak
```

Display backup location:
```
✅ Created backup: wrangler.jsonc.bak

Rollback command (if needed):
  cp wrangler.jsonc.bak wrangler.jsonc
```

## Step 7: Update wrangler.jsonc

Apply migration to configuration file:

### Read Current Config

```bash
# Strip comments and parse JSON
grep -v '^\s*//' wrangler.jsonc | jq '.'
```

### Add Migration

Use jq to append migration:

```bash
jq --argjson migration '{
  "tag": "v3",
  "new_sqlite_classes": ["MyNewDO"]
}' '.migrations += [$migration]' wrangler.jsonc > wrangler.jsonc.tmp

mv wrangler.jsonc.tmp wrangler.jsonc
```

### Verify Update

Read updated config and verify migration was added:

```bash
jq '.migrations' wrangler.jsonc
```

Display:
```
✅ Migration added to wrangler.jsonc

Updated migrations array:
[
  { "tag": "v1", "new_sqlite_classes": ["MyDurableObject"] },
  { "tag": "v2", "new_sqlite_classes": ["ChatRoom"] },
  { "tag": "v3", "new_sqlite_classes": ["MyNewDO"] }
]
```

## Step 8: Validation After Update

Run post-update validation:

### Validate JSON Syntax

```bash
jq '.' wrangler.jsonc > /dev/null
```

If validation fails:
```
❌ ERROR: Invalid JSON syntax after update

Rolling back to backup...
  cp wrangler.jsonc.bak wrangler.jsonc

Please report this issue with your configuration.
```

### Validate Migration Structure

Run validation script:

```bash
./scripts/validate-do-config.sh
```

Check for:
- Migration has required fields
- No duplicate tags
- Class names match bindings (if applicable)

## Step 9: Provide Next Steps

Display action-specific next steps:

### For "New Class" Migration

```
✅ Migration Created Successfully!

Next Steps:
===========

1. Ensure class is exported in your Worker:

   // src/index.ts or src/MyNewDO.ts
   import { DurableObject } from "cloudflare:workers";

   export class MyNewDO extends DurableObject {
     constructor(ctx: DurableObjectState, env: Env) {
       super(ctx, env);

       this.ctx.blockConcurrencyWhile(async () => {
         // Initialize SQL schema
         await this.ctx.storage.sql.exec(`
           CREATE TABLE IF NOT EXISTS my_table (
             id INTEGER PRIMARY KEY,
             data TEXT NOT NULL
           )
         `);
       });
     }
   }

2. Add binding to wrangler.jsonc:

   "durable_objects": {
     "bindings": [
       {
         "name": "MY_NEW_DO",
         "class_name": "MyNewDO"
       }
     ]
   }

3. Update TypeScript Env interface:

   interface Env {
     MY_NEW_DO: DurableObjectNamespace<MyNewDO>;
   }

4. Deploy migration:

   wrangler deploy

5. Test DO creation:

   curl https://your-worker.workers.dev?id=test

Documentation:
  - Load templates/ for code examples
  - Load references/migrations-guide.md for migration patterns
  - Run /do-debug if deployment issues occur
```

### For "Rename Class" Migration

```
✅ Rename Migration Created Successfully!

IMPORTANT: Code changes required before deploying!

Next Steps:
===========

1. Rename class in your code:

   // OLD:
   export class OldClassName extends DurableObject { ... }

   // NEW:
   export class NewClassName extends DurableObject { ... }

2. Update binding in wrangler.jsonc:

   "durable_objects": {
     "bindings": [
       {
         "name": "BINDING_NAME",
         "class_name": "NewClassName"  // ← Update this
       }
     ]
   }

3. Update TypeScript Env interface:

   interface Env {
     BINDING_NAME: DurableObjectNamespace<NewClassName>;  // ← Update this
   }

4. Deploy migration:

   wrangler deploy

Note: Existing DO instances will continue to work.
      The rename affects how new instances are created.

Documentation:
  - Load references/migrations-guide.md for rename patterns
```

### For "Delete Class" Migration

```
⚠️  Delete Migration Created

CRITICAL: This will PERMANENTLY DELETE all DO instances!

Before Deploying:
=================

1. Backup data if needed:
   - Export important data from DO instances
   - Archive to R2 or external storage

2. Remove class from code:
   - Delete class definition
   - Remove from exports

3. Remove binding from wrangler.jsonc:
   - Delete binding entry
   - Remove from Env interface

4. Deploy migration:
   wrangler deploy

After Deployment:
=================

All DO instances and data will be permanently deleted.
This action CANNOT be undone!

Rollback (before deploying):
  cp wrangler.jsonc.bak wrangler.jsonc
```

### For "Transfer Class" Migration

```
✅ Transfer Migration Created Successfully!

Next Steps:
===========

1. Ensure class exists in destination script:

   // In destination script (DEST_SCRIPT_NAME)
   export class TransferredClass extends DurableObject { ... }

2. Add binding to destination script's wrangler.jsonc:

   "durable_objects": {
     "bindings": [
       {
         "name": "TRANSFERRED",
         "class_name": "TransferredClass",
         "script_name": "DEST_SCRIPT_NAME"
       }
     ]
   }

3. Deploy BOTH scripts in order:

   # Deploy destination script first
   cd ../dest-script/
   wrangler deploy

   # Then deploy source script with migration
   cd ../source-script/
   wrangler deploy

4. Update references in source script:
   - Change binding to point to destination script
   - Or remove binding if no longer needed

Documentation:
  - Load references/migrations-guide.md for transfer patterns
```

## Error Handling

Handle common migration errors:

### Error: Invalid JSON in wrangler.jsonc

```
❌ ERROR: wrangler.jsonc contains invalid JSON

Location: Line 15, Column 23
Issue: Trailing comma in migrations array

Fix manually or restore backup:
  cp wrangler.jsonc.bak wrangler.jsonc
```

### Error: Duplicate Migration Tag

```
❌ ERROR: Migration tag 'v3' already exists

Existing migration:
  { "tag": "v3", "new_sqlite_classes": ["OtherClass"] }

Solutions:
  1. Use next sequential tag: v4
  2. Choose different tag name
  3. Cancel migration
```

### Error: Class Not Found

```
❌ ERROR: Class 'MyNewDO' not exported in Worker code

Searched in:
  - src/index.ts
  - src/MyNewDO.ts
  - src/durable-objects/MyNewDO.ts

Solutions:
  1. Create class first: /do-setup
  2. Export existing class: export class MyNewDO { ... }
  3. Continue anyway (migration will fail on deploy)
```

## Related Commands and Resources

After migration, recommend:

- **Validation**: Run `./scripts/validate-do-config.sh`
- **Deployment**: Use `wrangler deploy`
- **Testing**: Create tests with `/do-setup` (if enabled)
- **Debugging**: Use `/do-debug` for deployment issues
- **Documentation**: Load `references/migrations-guide.md`

## Success Criteria

Migration is successful when:
- ✅ Backup created (wrangler.jsonc.bak)
- ✅ Migration added to wrangler.jsonc
- ✅ JSON syntax valid
- ✅ No duplicate tags
- ✅ Class validation passed (or warnings acknowledged)
- ✅ Next steps clearly displayed
- ✅ Rollback instructions provided
