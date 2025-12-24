# Gemini File Search Error Catalog

Complete catalog of 8 common errors with solutions.

---

## Error 1: Document Immutability

**Symptom:**
```
Error: Documents cannot be modified after indexing
```

**Cause:** Documents are immutable once indexed. No PATCH/UPDATE operation exists.

**Solution:** Use delete + re-upload pattern:

```typescript
// Find existing document
const docs = await ai.fileSearchStores.documents.list({
  parent: fileStore.name
});

const oldDoc = docs.documents.find(d => d.displayName === 'manual.pdf');

// Delete old version
if (oldDoc) {
  await ai.fileSearchStores.documents.delete({
    name: oldDoc.name,
    force: true
  });
}

// Upload new version
await ai.fileSearchStores.uploadToFileSearchStore({
  name: fileStore.name,
  file: fs.createReadStream('manual-v2.pdf'),
  config: { displayName: 'manual.pdf' }
});
```

---

## Error 2: Storage Quota Exceeded

**Symptom:**
```
Error: Quota exceeded. Expected 1GB, but 3.2GB used.
```

**Cause:** Storage = input files + embeddings + metadata ≈ 3x input size.

**Solution:** Calculate storage before upload:

```typescript
const fileSize = fs.statSync('data.pdf').size;  // 500 MB
const estimatedStorage = fileSize * 3;  // 1.5 GB

if (estimatedStorage > 1e9) {
  console.warn('⚠️ May exceed free tier 1 GB limit');
}
```

---

## Error 3: Incorrect Chunking

**Symptom:** Poor retrieval quality, irrelevant results, context cutoff.

**Cause:** Default chunking not optimal for content type.

**Solution:** Configure chunking:

```typescript
await ai.fileSearchStores.uploadToFileSearchStore({
  name: fileStore.name,
  file: fs.createReadStream('docs.pdf'),
  config: {
    chunkingConfig: {
      whiteSpaceConfig: {
        maxTokensPerChunk: 500,  // Smaller = more precise
        maxOverlapTokens: 50     // 10% overlap
      }
    }
  }
});
```

**Guidelines:**
- Technical docs: 500 tokens, 50 overlap
- Prose: 800 tokens, 80 overlap
- Legal: 300 tokens, 30 overlap

---

## Error 4: Metadata Limits

**Symptom:**
```
Error: Maximum 20 custom metadata key-value pairs allowed
```

**Cause:** 20 field limit per document.

**Solution:** Compact metadata schema:

```typescript
// ✅ GOOD: 6 fields
customMetadata: {
  doc_type: 'manual',
  version: '1.0',
  language: 'en',
  department: 'engineering',
  created_at: '2025-11-18',
  tags: 'install,setup,config'  // Comma-separated
}
```

---

## Error 5: Indexing Cost Surprises

**Symptom:** Unexpected bill for large document uploads.

**Cause:** Indexing costs $0.15/1M tokens (one-time).

**Solution:** Estimate costs:

```typescript
// Rough estimate: 1 page ≈ 500 tokens
const pages = 1000;
const estimatedTokens = pages * 500;  // 500k tokens
const cost = (estimatedTokens / 1e6) * 0.15;  // $0.075

console.log(`Estimated indexing cost: $${cost.toFixed(3)}`);
```

---

## Error 6: Operation Polling Timeout

**Symptom:** Upload appears to hang indefinitely.

**Cause:** Not polling operation status until `done: true`.

**Solution:** Poll with timeout:

```typescript
async function pollOperation(ai, operationName, timeoutMs = 300000) {
  const startTime = Date.now();
  let operation = await ai.operations.get({ name: operationName });

  while (!operation.done) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Operation timeout after ${timeoutMs}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    operation = await ai.operations.get({ name: operationName });
  }

  if (operation.error) {
    throw new Error(`Operation failed: ${operation.error.message}`);
  }

  return operation;
}
```

---

## Error 7: Force Delete Requirement

**Symptom:**
```
Error: Store contains documents. Use force: true to delete.
```

**Cause:** Stores with documents require `force: true`.

**Solution:**

```typescript
// Delete store with documents
await ai.fileSearchStores.delete({
  name: fileStore.name,
  force: true  // Required if store has documents
});
```

---

## Error 8: Model Compatibility

**Symptom:**
```
Error: Model gemini-1.5-pro does not support File Search
```

**Cause:** Only Gemini 2.5 Pro/Flash support File Search.

**Solution:** Use correct model:

```typescript
// ✅ CORRECT
const model = ai.getGenerativeModel({
  model: 'gemini-2.5-pro',  // or gemini-2.5-flash
  tools: [{ fileSearchTool: { fileSearchStores: [storeName] } }]
});

// ❌ WRONG
const model = ai.getGenerativeModel({
  model: 'gemini-1.5-pro',  // Not supported
  tools: [{ fileSearchTool: { fileSearchStores: [storeName] } }]
});
```

**Supported models:**
- gemini-2.5-pro
- gemini-2.5-flash

---

## Prevention Checklist

- [ ] Use delete + re-upload for updates (Error 1)
- [ ] Calculate 3x storage multiplier (Error 2)
- [ ] Configure chunking for content type (Error 3)
- [ ] Keep metadata under 20 fields (Error 4)
- [ ] Estimate indexing costs (Error 5)
- [ ] Poll operations with timeout (Error 6)
- [ ] Use force: true for deletes (Error 7)
- [ ] Use Gemini 2.5 models only (Error 8)
