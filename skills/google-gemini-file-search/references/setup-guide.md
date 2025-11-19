# Google Gemini File Search Complete Setup Guide

Complete walkthrough for setting up Google Gemini File Search (managed RAG).

---

## Step 1: Get API Key

1. Go to https://aistudio.google.com/apikey
2. Create new API key
3. Save securely

**Free Tier:**
- 1 GB storage
- 1,500 requests/day
- 1M tokens/minute

**Pricing:**
- Indexing: $0.15/1M tokens (one-time)
- Storage: Free (10 GB - 1 TB)
- Query embeddings: Free

---

## Step 2: Install SDK

```bash
npm install @google/genai
```

**Version:** 0.21.0+

**Node.js:** 18+ required

---

## Step 3: Initialize Client

```typescript
import { GoogleGenerativeAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
```

---

## Step 4: Create File Search Store

```typescript
const fileStore = await ai.fileSearchStores.create({
  config: {
    displayName: 'my-knowledge-base',
    customMetadata: {
      project: 'customer-support',
      environment: 'production'
    }
  }
});

console.log('Store created:', fileStore.name);
```

---

## Step 5: Upload Documents

**Single file:**

```typescript
const operation = await ai.fileSearchStores.uploadToFileSearchStore({
  name: fileStore.name,
  file: fs.createReadStream('./manual.pdf'),
  config: {
    displayName: 'Installation Manual',
    customMetadata: {
      doc_type: 'manual',
      version: '1.0'
    },
    chunkingConfig: {
      whiteSpaceConfig: {
        maxTokensPerChunk: 500,
        maxOverlapTokens: 50
      }
    }
  }
});

// Poll until done
while (!operation.done) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  operation = await ai.operations.get({ name: operation.name });
}

console.log('✅ Indexed:', operation.response.displayName);
```

**Batch upload:**

```typescript
const files = ['manual.pdf', 'faq.md', 'guide.docx'];

const uploadPromises = files.map(file =>
  ai.fileSearchStores.uploadToFileSearchStore({
    name: fileStore.name,
    file: fs.createReadStream(file),
    config: { displayName: file }
  })
);

const operations = await Promise.all(uploadPromises);

// Poll all operations
for (const op of operations) {
  let operation = op;
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    operation = await ai.operations.get({ name: operation.name });
  }
  console.log('✅', operation.response.displayName);
}
```

---

## Step 6: Query Documents

```typescript
const model = ai.getGenerativeModel({
  model: 'gemini-2.5-pro',  // or gemini-2.5-flash
  tools: [{
    fileSearchTool: {
      fileSearchStores: [fileStore.name]
    }
  }]
});

const result = await model.generateContent('How do I install the product?');

console.log(result.response.text());

// Get citations
const groundingMetadata = result.response.candidates[0].groundingMetadata;
if (groundingMetadata) {
  console.log('Sources:', groundingMetadata.groundingChunks.map(
    chunk => chunk.web?.title || 'Document'
  ));
}
```

---

## Step 7: Update Documents (Delete + Re-upload)

Documents are immutable. To update:

```typescript
// 1. List documents
const docs = await ai.fileSearchStores.documents.list({
  parent: fileStore.name
});

// 2. Find and delete old version
const oldDoc = docs.documents.find(d => d.displayName === 'manual.pdf');
if (oldDoc) {
  await ai.fileSearchStores.documents.delete({
    name: oldDoc.name,
    force: true
  });
}

// 3. Upload new version
await ai.fileSearchStores.uploadToFileSearchStore({
  name: fileStore.name,
  file: fs.createReadStream('manual-v2.pdf'),
  config: { displayName: 'manual.pdf' }
});
```

---

## Production Checklist

- [ ] API key stored in environment variable
- [ ] Error handling implemented
- [ ] Operation polling with timeout
- [ ] Storage quota monitoring (3x file size)
- [ ] Chunking configured for content type
- [ ] Custom metadata under 20 fields
- [ ] Delete pattern for updates implemented
- [ ] Citations extracted and displayed
- [ ] Force delete used for cleanup
- [ ] Model compatibility verified (2.5 Pro/Flash only)

---

## Official Documentation

- **File Search Overview**: https://ai.google.dev/api/file-search
- **API Reference**: https://ai.google.dev/api/file-search/documents
- **Blog Post**: https://blog.google/technology/developers/file-search-gemini-api/
