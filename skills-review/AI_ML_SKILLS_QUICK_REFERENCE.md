# AI/ML Skills - Quick Reference Summary

**Analysis Date**: 2025-11-17
**Total Skills Analyzed**: 7
**Total Current Lines**: 10,490
**Total Target Lines**: 3,280
**Reduction Needed**: 68%

---

## Priority Rankings

### CRITICAL (3 skills)
1. **google-gemini-api** - 2,126 lines (425% over) - Remove 1,656 duplicate lines
2. **openai-api** - 2,113 lines (422% over) - Remove 1,663 lines, create 2 new refs
3. **ai-sdk-core** - 1,812 lines (362% over) - Remove 1,362 lines, create 6 new refs

### HIGH (3 skills)
4. **openai-assistants** - 1,306 lines (261% over) - Remove 826 duplicate lines
5. **openai-responses** - 1,221 lines (244% over) - Remove 731 duplicate lines
6. **ai-sdk-ui** - 1,051 lines (210% over) - Remove 571 lines, create 3 new refs

### MEDIUM (1 skill)
7. **openai-agents** - 661 lines (132% over) - Remove 171 lines, create 2 new refs

---

## Critical Issues by Skill

### 1. ai-sdk-core (CRITICAL)
- **Lines**: 1,812 (target: 450)
- **Frontmatter**: Non-standard `metadata` field (Lines 17-18) ❌
- **Description**: 108 words (target: 68)
- **Duplication**: ~600 lines
- **Fix Difficulty**: Hard (need 6 new reference docs)
- **Action**: Remove metadata, split into references/

### 2. ai-sdk-ui (HIGH)
- **Lines**: 1,051 (target: 480)
- **Frontmatter**: OK ✅
- **Description**: 102 words (target: 64)
- **Duplication**: ~350 lines
- **Fix Difficulty**: Medium (need 3 new reference docs)
- **Action**: Extract useChat content to reference

### 3. openai-api (CRITICAL)
- **Lines**: 2,113 (target: 450) ⚠️ WORST
- **Frontmatter**: Non-standard `metadata` field (Lines 17-19) ❌
- **Description**: 95 words (target: 70)
- **Duplication**: ~800 lines with existing refs
- **Fix Difficulty**: Hard (need 2 new reference docs)
- **Action**: Remove metadata, massive content reduction

### 4. openai-agents (MEDIUM)
- **Lines**: 661 (target: 490)
- **Frontmatter**: OK ✅
- **Description**: 82 words (target: 61)
- **Duplication**: ~170 lines
- **Fix Difficulty**: Easy
- **Action**: Extract WebRTC details to reference

### 5. openai-assistants (HIGH)
- **Lines**: 1,306 (target: 480)
- **Frontmatter**: Deprecation in description ⚠️
- **Description**: 128 words (target: 73) ⚠️ WORST
- **Duplication**: ~495 lines with perfect existing refs
- **Fix Difficulty**: Easy (just remove duplicates)
- **Action**: Remove 495 lines duplicating references/

### 6. openai-responses (HIGH)
- **Lines**: 1,221 (target: 490)
- **Frontmatter**: OK ✅
- **Description**: 116 words (target: 68)
- **Duplication**: ~461 lines with existing refs
- **Fix Difficulty**: Easy (just remove duplicates)
- **Action**: Remove 461 lines duplicating references/

### 7. google-gemini-api (CRITICAL)
- **Lines**: 2,126 (target: 470) ⚠️ WORST (tied)
- **Frontmatter**: Editorial tone ⚠️
- **Description**: 105 words (target: 72)
- **Duplication**: ~1,656 lines ⚠️ WORST DUPLICATION
- **Fix Difficulty**: Easy (everything exists, just remove)
- **Action**: Remove 1,656 duplicate lines

---

## Top Anti-Patterns Found

### 1. Content Duplication (All 7 skills)
**Total Duplicate Lines**: ~4,532 out of 10,490 (43%)
- Content in SKILL.md already exists in references/
- **Worst**: google-gemini-api (1,656 lines)
- **Fix**: Remove from SKILL.md, reference only

### 2. Inline Code Examples (All 7 skills)
**Estimated Impact**: ~1,200 lines
- Complete implementations embedded in docs
- Already exist in templates/
- **Fix**: Reference templates/ by filename only

### 3. Non-Standard Frontmatter (2 skills)
**Skills**: ai-sdk-core, openai-api
```yaml
metadata:  # ❌ Not in Anthropic spec
  version: "1.0.0"
```
- **Fix**: Remove or move to SKILL.md header

### 4. Verbose Descriptions (All 7 skills)
**Average**: 102 words (target: 65)
- **Worst**: openai-assistants (128 words)
- **Fix**: Condense to 60-75 words

### 5. API Documentation Cloning (3 skills)
**Skills**: openai-api, google-gemini-api, ai-sdk-core
- Complete parameter tables
- Model comparison matrices
- **Fix**: Link to official docs + essentials only

---

## Quick Fixes by Effort

### EASY (Remove Existing Duplicates)
1. **google-gemini-api**: Remove 1,656 lines → Save 78%
2. **openai-assistants**: Remove 495 lines → Save 38%
3. **openai-responses**: Remove 461 lines → Save 38%
4. **openai-agents**: Remove 171 lines → Save 26%

**Total Easy Wins**: 2,783 lines removed (27% of total)

### MEDIUM (Create 2-3 New References)
5. **ai-sdk-ui**: Create 3 new refs → Save 571 lines

### HARD (Create 6+ New References)
6. **ai-sdk-core**: Create 6 new refs → Save 1,362 lines
7. **openai-api**: Create 2 new refs → Save 1,663 lines

---

## Frontmatter Corrections

### ai-sdk-core (CRITICAL)
```yaml
# REMOVE Lines 17-18:
metadata:
  version: "1.0.0"

# SHORTEN description from 108 → 68 words
```

### ai-sdk-ui (MEDIUM)
```yaml
# SHORTEN description from 102 → 64 words
```

### openai-api (CRITICAL)
```yaml
# REMOVE Lines 17-19:
metadata:
  lastUpdated: "2025-10-25"
  sdkVersion: "openai@5.19.1"

# SHORTEN description from 95 → 70 words
```

### openai-agents (MEDIUM)
```yaml
# SHORTEN description from 82 → 61 words
```

### openai-assistants (HIGH)
```yaml
# REMOVE deprecation from description (Lines 7-8)
# SHORTEN description from 128 → 73 words
```

### openai-responses (HIGH)
```yaml
# MERGE two paragraphs into one
# SHORTEN description from 116 → 68 words
```

### google-gemini-api (CRITICAL)
```yaml
# REMOVE editorial tone ("CORRECT", "NOT 2M")
# SHORTEN description from 105 → 72 words
```

---

## Progressive Disclosure Scores

### Best Infrastructure
1. **google-gemini-api**: 15 templates + 11 references ⭐⭐⭐⭐⭐
2. **openai-api**: 10 templates + 7 references ⭐⭐⭐⭐
3. **openai-agents**: 9 templates + 5 references ⭐⭐⭐⭐
4. **openai-responses**: 10 templates + 7 references ⭐⭐⭐⭐
5. **openai-assistants**: 8 templates + 7 references ⭐⭐⭐⭐

### Worst Utilization
1. **google-gemini-api**: Has BEST infrastructure, WORST duplication
2. **openai-assistants**: Perfect refs, all content duplicated
3. **openai-responses**: Excellent refs, massive duplication

### Missing Reference Docs (New Files Needed)
- **ai-sdk-core**: 6 new files needed
- **ai-sdk-ui**: 3 new files needed
- **openai-api**: 2 new files needed
- **openai-agents**: 2 new files needed
- **Others**: 0 new files (just consolidate existing)

---

## Recommended Actions (4-Week Plan)

### Week 1: CRITICAL Fixes
**Impact**: Remove 3,319 lines (32% of total)

1. **google-gemini-api** (2 hours)
   - Remove 1,656 duplicate lines
   - Fix editorial tone
   - Shorten description
   - **Result**: 2,126 → 470 lines (78% reduction)

2. **openai-api** (4 hours)
   - Remove metadata field
   - Create chat-completions-guide.md
   - Create vision-guide.md
   - Remove 1,663 duplicate lines
   - **Result**: 2,113 → 450 lines (79% reduction)

3. **ai-sdk-core** (1 hour - metadata only)
   - Remove metadata field (urgent)
   - **Result**: Fix critical compliance issue

### Week 2: HIGH Fixes
**Impact**: Remove 2,128 lines (20% of total)

4. **openai-assistants** (2 hours)
   - Remove deprecation from frontmatter
   - Remove 826 duplicate lines
   - **Result**: 1,306 → 480 lines (63% reduction)

5. **openai-responses** (2 hours)
   - Merge description paragraphs
   - Remove 731 duplicate lines
   - **Result**: 1,221 → 490 lines (60% reduction)

6. **ai-sdk-ui** (3 hours)
   - Create use-chat-guide.md
   - Create attachments-guide.md
   - Create tool-calling-ui-guide.md
   - Remove 571 lines
   - **Result**: 1,051 → 480 lines (54% reduction)

### Week 3: MEDIUM Fixes
**Impact**: Remove 1,533 lines (15% of total)

7. **ai-sdk-core** (5 hours)
   - Create 6 new reference docs
   - Remove 1,362 lines
   - **Result**: 1,812 → 450 lines (75% reduction)

8. **openai-agents** (1.5 hours)
   - Create realtime-voice-guide.md
   - Remove 171 lines
   - **Result**: 661 → 490 lines (26% reduction)

### Week 4: Polish
**Impact**: Improve all descriptions

9. **All Skills** (4 hours)
   - Update descriptions to 60-75 words
   - Remove ALL inline code examples
   - Verify cross-references
   - Test discovery

**Total Effort**: ~24.5 hours
**Total Impact**: 10,490 → 3,280 lines (68% reduction)

---

## Expected Benefits

### Token Savings
- **Current**: ~10,490 lines loaded per skill discovery
- **Target**: ~3,280 lines loaded per skill discovery
- **Reduction**: 68% fewer tokens
- **Cost Savings**: Estimated $2,000-3,000/month at scale

### Improved Discoverability
- Shorter descriptions = faster matching
- Better keywords = better relevance
- Progressive disclosure = clearer navigation

### Compliance
- Remove non-standard metadata fields
- Align with Anthropic spec 100%
- Better marketplace compatibility

### Maintainability
- Single source of truth (references/)
- Easier updates
- Less duplication = fewer errors

---

## Key Metrics Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Lines** | 10,490 | 3,280 | -68% |
| **Avg Lines/Skill** | 1,499 | 469 | -69% |
| **Duplicate Lines** | 4,532 | 0 | -100% |
| **Avg Description** | 102 words | 67 words | -34% |
| **Non-Standard Fields** | 2 | 0 | -100% |
| **Skills Over Limit** | 7/7 | 0/7 | -100% |
| **Reference Docs Needed** | 11 new | 0 new | Complete |

---

## Worst Offenders (Fix First)

1. **google-gemini-api**: 2,126 lines, 1,656 duplicates, editorial tone
2. **openai-api**: 2,113 lines, 800 duplicates, non-standard metadata
3. **ai-sdk-core**: 1,812 lines, 600 duplicates, non-standard metadata

**Quick Win**: Fix google-gemini-api in 2 hours → save 1,656 lines (16% of total)

---

**For detailed analysis with line numbers and specific fixes, see: AI_ML_SKILLS_DETAILED_ANALYSIS.md**
