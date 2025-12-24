# Google Gemini File Search Reference Documentation

This directory contains detailed reference materials for advanced File Search usage.

## Reference Documents

### 🚧 api-reference.md (TO BE IMPLEMENTED)
Complete API documentation extracted from official sources.

**Sections:**
- FileSearchStore API (create, get, list, delete, upload, import)
- Documents API (list, get, delete, query)
- Operations API (polling pattern)
- Request/response schemas
- Error codes and handling

### 🚧 chunking-best-practices.md (TO BE IMPLEMENTED)
Detailed chunking strategies for different content types.

**Sections:**
- How chunking works (whiteSpaceConfig)
- Content type recommendations (technical docs, prose, legal, code, FAQ)
- Chunk size impact on retrieval quality
- Overlap token guidelines
- Testing and tuning chunking configs
- Examples with before/after retrieval quality

### 🚧 pricing-calculator.md (TO BE IMPLEMENTED)
Cost estimation guide with examples.

**Sections:**
- Pricing model breakdown (indexing, storage, queries)
- Token calculation methods
- Cost examples by use case (10GB KB, 100MB docs, 1TB archive)
- ROI comparison (vs Vectorize, OpenAI, manual RAG)
- Cost optimization strategies
- Free tier maximization

### 🚧 migration-from-openai.md (TO BE IMPLEMENTED)
Migration guide from OpenAI Files API.

**Sections:**
- API mapping (OpenAI → Gemini equivalents)
- Key differences (storage model, chunking, pricing)
- Migration checklist
- Code conversion examples
- Common gotchas
- When to migrate vs stay with OpenAI

## Development Status

**Completed:** 0/4 documents (0%)

**Priority:**
1. api-reference.md (most frequently referenced)
2. chunking-best-practices.md (critical for quality)
3. pricing-calculator.md (business decision support)
4. migration-from-openai.md (competitive alternative)

## Notes

These references supplement SKILL.md with deeper technical details for advanced users. SKILL.md provides quick-start patterns; these docs provide comprehensive knowledge.
