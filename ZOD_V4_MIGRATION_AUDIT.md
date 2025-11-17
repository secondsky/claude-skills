# Zod v4 Migration Audit: Eliminate `zod-to-json-schema` Dependency

**Date**: 2025-11-17
**Issue**: Skills using Zod v3 + `zod-to-json-schema` when Zod v4 has built-in JSON Schema conversion
**Reference**: https://zod.dev/json-schema

---

## Executive Summary

**Finding**: 3 skills use the external `zod-to-json-schema` package while on Zod v3, but Zod v4 now provides built-in `.toJsonSchema()` method, making the external package redundant.

**Recommendation**: Migrate all skills to Zod v4 and use native JSON Schema conversion.

**Benefits**:
- ✅ Remove external dependency (1 less package to maintain)
- ✅ Use official, built-in feature
- ✅ Better TypeScript integration
- ✅ Eliminate peer dependency warnings (mentioned in ai-sdk-core/SKILL.md:1723)
- ✅ Future-proof (official support)

---

## Current State Analysis

### Skills Using `zod-to-json-schema` (Needs Migration)

| Skill | Zod Version | Uses zod-to-json-schema | Migration Priority | Usage Pattern |
|-------|-------------|------------------------|-------------------|---------------|
| **thesys-generative-ui** | `^3.24.1` | ✅ Yes | **HIGH** | OpenAI tool definitions (88, 97, 106) |
| **typescript-mcp** | `^3.23.8` | ✅ Yes | **HIGH** | MCP tool schemas |
| **nuxt-content** | `^3.23.0` | ✅ Yes | **MEDIUM** | Content validation |

### Skills Already on Zod v4 (No Migration Needed)

| Skill | Zod Version | Uses zod-to-json-schema | Status |
|-------|-------------|------------------------|---------|
| **hono-routing** | `^4.1.12` | ❌ No | ✅ Clean |
| **react-hook-form-zod** | `^4.1.12` | ❌ No | ✅ Clean |
| **cloudflare-full-stack-scaffold** | `^4.1.12` | ❌ No | ✅ Clean |
| **zod** (skill) | `^4.1.12` | ❌ No | ✅ Clean |

### Skills on Zod v3 (No JSON Schema Usage)

All other skills use Zod v3 but don't need JSON Schema conversion, so migration is optional.

---

## Migration Path: `zod-to-json-schema` → Zod v4 Native

### Before (Zod v3 + zod-to-json-schema)

```typescript
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const schema = z.object({
  query: z.string().describe("Search query"),
  max_results: z.number().int().min(1).max(10).default(5),
});

const tool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search the web",
    parameters: zodToJsonSchema(schema), // External package
  },
};
```

**Dependencies**:
```json
{
  "dependencies": {
    "zod": "^3.24.1",
    "zod-to-json-schema": "^3.24.1"
  }
}
```

### After (Zod v4 Native)

```typescript
import { z } from "zod";

const schema = z.object({
  query: z.string().describe("Search query"),
  max_results: z.number().int().min(1).max(10).default(5),
});

const tool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search the web",
    parameters: schema.toJsonSchema(), // Native method ✨
  },
};
```

**Dependencies**:
```json
{
  "dependencies": {
    "zod": "^4.1.12"
  }
}
```

**Changes**:
- ✅ Remove `zod-to-json-schema` import
- ✅ Remove `zod-to-json-schema` from package.json
- ✅ Replace `zodToJsonSchema(schema)` → `schema.toJsonSchema()`
- ✅ Update Zod to v4

---

## Detailed Skill-by-Skill Analysis

### 1. thesys-generative-ui (HIGH PRIORITY)

**Why High Priority**:
- Most usage (8+ occurrences across templates)
- Core OpenAI tool integration
- Already has Next.js 15 (latest stack)

**Files to Update**:
1. `templates/nextjs/tool-calling-route.ts` (lines 88, 97, 106)
2. `templates/shared/tool-schemas.ts` (lines 50, 81, 139, 169, 203, 227, 261, 286)
3. `templates/vite-react/tool-calling.tsx` (line 244)
4. `scripts/install-dependencies.sh` (line 56)
5. `templates/nextjs/package.json` (dependencies)
6. `templates/vite-react/package.json` (dependencies)
7. `SKILL.md` (documentation + examples at lines 928, 943, 991, 1625, 1639)
8. `references/common-errors.md` (example at line 172)

**Migration Steps**:
```bash
# 1. Update package.json files
# Change: "zod": "^3.24.1" → "zod": "^4.1.12"
# Remove: "zod-to-json-schema": "^3.24.1"

# 2. Update install script
# scripts/install-dependencies.sh line 56:
# OLD: $PM install zod@^3.24.1 zod-to-json-schema@^3.24.1
# NEW: $PM install zod@^4.1.12

# 3. Update all template files
# Remove: import zodToJsonSchema from "zod-to-json-schema";
# Replace: zodToJsonSchema(schema) → schema.toJsonSchema()

# 4. Update documentation
# Update SKILL.md examples
# Update references/common-errors.md examples
```

**Impact**: 15+ file changes, ~8 code replacements

---

### 2. typescript-mcp (HIGH PRIORITY)

**Why High Priority**:
- Core MCP infrastructure skill
- Documentation explicitly discourages `zodToJsonSchema()` (SKILL.md:520, common-errors.md:117)
- Good opportunity to demonstrate best practice

**Files to Update**:
1. `SKILL.md` (line 690-691 in package.json example, line 520 comment)
2. `scripts/init-mcp-server.sh` (line 66)
3. `references/common-errors.md` (lines 108-117 - needs rewrite)

**Current Documentation** (references/common-errors.md:110-117):
```typescript
// ❌ Don't do this:
inputSchema: zodToJsonSchema(schema)

// ✅ Do this instead:
inputSchema: schema  // MCP SDK handles Zod natively

// NOTE: Do NOT manually convert with `zodToJsonSchema()` unless absolutely necessary
```

**New Documentation** (Zod v4):
```typescript
// ✅ Option 1: Let MCP SDK handle it natively (preferred)
inputSchema: schema

// ✅ Option 2: Use Zod v4's built-in method
inputSchema: schema.toJsonSchema()

// ❌ NEVER use external zod-to-json-schema package
```

**Migration Steps**:
```bash
# 1. Update init script
# scripts/init-mcp-server.sh line 66:
# OLD: "zod": "^3.23.8"
# NEW: "zod": "^4.1.12"

# 2. Update SKILL.md package.json example (line 690)
# Change zod version

# 3. Update references/common-errors.md
# Rewrite section to mention Zod v4 native method
```

**Impact**: 3 file changes, documentation updates

---

### 3. nuxt-content (MEDIUM PRIORITY)

**Why Medium Priority**:
- Less critical (content validation, not API integration)
- Smaller scope

**Files to Update**:
1. `SKILL.md` (line 636, line 2114-2115 in dependencies section)
2. `scripts/setup-nuxt-content.sh` (line 42)

**Current Documentation** (SKILL.md:2114-2115):
```json
- `zod@^3.23.0` - Schema validation (v3)
- `zod@^4.0.0` - Schema validation (v4 with native JSON Schema)
```

**Note**: Documentation ALREADY mentions v4 has native JSON Schema! Just needs implementation.

**Migration Steps**:
```bash
# 1. Update setup script
# scripts/setup-nuxt-content.sh line 42:
# OLD: $INSTALL_CMD -D zod zod-to-json-schema
# NEW: $INSTALL_CMD -D zod@^4.1.12

# 2. Update SKILL.md
# Line 636: Change install command
# Line 2114-2115: Update to recommend v4
```

**Impact**: 2 file changes

---

## Migration Checklist (Per Skill)

- [ ] Update `package.json` → `"zod": "^4.1.12"`
- [ ] Remove `"zod-to-json-schema"` from `package.json`
- [ ] Update install scripts (remove zod-to-json-schema)
- [ ] Remove `import zodToJsonSchema from "zod-to-json-schema";`
- [ ] Replace `zodToJsonSchema(schema)` → `schema.toJsonSchema()`
- [ ] Update SKILL.md documentation
- [ ] Update README.md (if applicable)
- [ ] Update references/common-errors.md (if applicable)
- [ ] Test templates work with new code
- [ ] Verify JSON Schema output is equivalent

---

## Breaking Changes in Zod v4

**Source**: https://github.com/colinhacks/zod/releases

### API Changes (Likely):
1. `.toJsonSchema()` method added (new feature)
2. Potential refinements to `.describe()` behavior
3. Possible changes to error messages

### Compatibility:
- ✅ Most Zod v3 code works in v4 (backwards compatible)
- ⚠️ Check for deprecation warnings
- ⚠️ Test thoroughly with AI SDK/OpenAI SDK/MCP SDK

---

## Testing Plan

### For Each Migrated Skill:

1. **Install Dependencies**
   ```bash
   cd skills/<skill-name>/templates/<template-dir>
   bun install
   # Verify no peer dependency warnings
   ```

2. **Build Test**
   ```bash
   bun run build
   # Should succeed with no errors
   ```

3. **Runtime Test**
   - For thesys-generative-ui: Test tool calling with OpenAI
   - For typescript-mcp: Test MCP server initialization
   - For nuxt-content: Test content validation

4. **JSON Schema Output Verification**
   ```typescript
   // Compare output
   const v3Output = zodToJsonSchema(schema);
   const v4Output = schema.toJsonSchema();
   console.log('Match:', JSON.stringify(v3Output) === JSON.stringify(v4Output));
   ```

---

## Rollout Strategy

### Phase 1: Low-Risk Skill (Week 1)
1. **typescript-mcp** (documentation-heavy, less code)
   - Primarily update docs
   - Update init script template
   - Test MCP server creation

### Phase 2: High-Impact Skills (Week 2)
2. **thesys-generative-ui** (most usage)
   - Update all templates
   - Test with OpenAI API
   - Verify tool calling works

3. **nuxt-content** (simple migration)
   - Update install script
   - Update docs
   - Test content validation

### Phase 3: Verification (Week 3)
- Test all three skills in production scenarios
- Update CHANGELOG.md
- Commit and push changes

---

## Expected Outcomes

### Immediate Benefits:
1. ✅ Remove 3 dependency declarations (`zod-to-json-schema`)
2. ✅ Eliminate peer dependency warnings (mentioned in ai-sdk-core)
3. ✅ Cleaner, more maintainable code
4. ✅ Faster installs (one less package)

### Long-Term Benefits:
1. ✅ Future-proof (using official Zod features)
2. ✅ Better TypeScript support
3. ✅ Easier to maintain (one source of truth)
4. ✅ Sets good example for other skills

### Risks:
- ⚠️ Low: Zod v4 might have subtle JSON Schema output differences
- ⚠️ Low: AI SDKs might not be tested with Zod v4 yet
- ⚠️ Mitigation: Test thoroughly, compare outputs

---

## Related Cleanup

### Other Skills to Update (Optional)

While these don't use `zod-to-json-schema`, consider updating to Zod v4 for consistency:

**Low Priority** (no breaking changes expected):
- ai-sdk-core (`^3.23.8`)
- ai-sdk-ui (`^3.23.8`)
- openai-agents (`^3.24.1`)
- claude-api (`^3.23.0`)
- claude-agent-sdk (`^3.23.0`)
- better-chatbot-patterns (`3.24.2`)
- better-chatbot (uses v3)
- All other Zod v3 skills

**Approach**:
- Update opportunistically when skills are modified for other reasons
- No urgency since they don't use JSON Schema conversion

---

## Conclusion

**Recommendation**: Proceed with migration in 3 phases over 2-3 weeks.

**Priority Order**:
1. **typescript-mcp** (easiest, documentation-focused)
2. **thesys-generative-ui** (highest impact, most usage)
3. **nuxt-content** (simple, already mentions v4 in docs)

**Total Effort**: ~4-6 hours across 3 skills

**Value**: Eliminate technical debt, use official features, prevent future issues

---

**Next Steps**:
1. Review this audit with team
2. Create tracking issue in GitHub
3. Start with Phase 1 (typescript-mcp)
4. Test thoroughly
5. Document any unexpected findings
6. Update CHANGELOG.md

---

**References**:
- Zod v4 JSON Schema docs: https://zod.dev/json-schema
- zod-to-json-schema package: https://www.npmjs.com/package/zod-to-json-schema
- Zod v4 release notes: https://github.com/colinhacks/zod/releases
