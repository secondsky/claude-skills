# Google Gemini File Search CLI Scripts

This directory contains CLI tools for managing Google Gemini File Search stores and documents.

## Available Scripts

### ✅ create-store.ts
Create a new file search store.

**Usage:**
```bash
ts-node create-store.ts --name "My Knowledge Base" --project "customer-support" --environment "production"
```

**Status:** Complete

### 🚧 upload-batch.ts (TO BE IMPLEMENTED)
Batch upload documents to a file search store with progress tracking.

**Planned Features:**
- Concurrent uploads with configurable batch size
- Progress bar with ETA
- Automatic chunking configuration per file type
- Metadata extraction from file path/name
- Cost estimation before upload
- Operation polling until indexing complete

**Usage:**
```bash
ts-node upload-batch.ts --store "fileSearchStores/abc123" --directory "./docs" --concurrent 5
```

### 🚧 query-store.ts (TO BE IMPLEMENTED)
Interactive query tool with citation display.

**Planned Features:**
- Interactive REPL for queries
- Citation rendering with source links
- Metadata filtering options
- Model selection (Flash vs Pro)
- Export query results

**Usage:**
```bash
ts-node query-store.ts --store "fileSearchStores/abc123"
```

### 🚧 cleanup.ts (TO BE IMPLEMENTED)
Delete stores and documents (with safety prompts).

**Planned Features:**
- List all stores with document counts
- Delete specific store or all stores
- Force delete confirmation prompts
- Dry-run mode

**Usage:**
```bash
ts-node cleanup.ts --store "fileSearchStores/abc123" --force
ts-node cleanup.ts --all --dry-run
```

## Prerequisites

```bash
# Install dependencies
npm install @google/genai

# Set API key
export GOOGLE_API_KEY="your-api-key-here"
```

## Development Status

**Completed:** 1/4 scripts (25%)

**Next Steps:**
1. Implement upload-batch.ts
2. Implement query-store.ts
3. Implement cleanup.ts
4. Add package.json with dependencies and scripts
5. Test all scripts end-to-end

## Notes

These scripts demonstrate best practices from SKILL.md:
- Operation polling until done: true
- Storage quota calculation (3x multiplier)
- Recommended chunking configurations
- Metadata schema patterns
- Force delete for non-empty stores
