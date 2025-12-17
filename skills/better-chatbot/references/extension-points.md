## Extension Points Reference

**Quick lookup: "I want to add X" → "Modify Y file"**

| Want to add... | Extend/Modify... | File Location | Notes |
|----------------|------------------|---------------|-------|
| **New default tool** | `AppDefaultToolkit` enum + `APP_DEFAULT_TOOL_KIT` | `lib/ai/tools/tool-kit.ts` | Add tool implementation in `lib/ai/tools/[category]/` + rendering in `components/tool-invocation/` |
| **New tool category** | `AppDefaultToolkit` enum | `lib/ai/tools/index.ts` | Creates new toolkit group (e.g., Visualization, WebSearch) |
| **New workflow node type** | `NodeKind` enum + executor + validator | `lib/ai/workflow/workflow.interface.ts` + `executor/node-executor.ts` + `validator/node-validate.ts` | Also add UI config in `components/workflow/node-config/` |
| **New API endpoint** | Create route handler | `src/app/api/[resource]/route.ts` | Follow standard pattern: auth → validation → repository → response |
| **New server action** | Use `validatedActionWithUser` | `src/app/api/[resource]/actions.ts` | Import from `lib/action-utils.ts` |
| **New database table** | Add to schema + repository | `lib/db/pg/schema.pg.ts` + `lib/db/pg/repositories/[name]-repository.pg.ts` | Then `pnpm db:generate` and `pnpm db:migrate` |
| **New UI component** | Create in domain folder | `src/components/[domain]/[name].tsx` | Use shadcn/ui primitives from `components/ui/` |
| **New React hook** | Create with `use-` prefix | `src/hooks/use-[name].ts` or `src/hooks/queries/use-[name].ts` | Data fetching hooks go in `queries/` subfolder |
| **New Zod schema** | Add to validations | `src/lib/validations/[domain].ts` | Use `z.infer<typeof schema>` for TypeScript types |
| **New AI provider** | Add to providers registry | `lib/ai/providers.ts` | Use `createOpenAI`, `createAnthropic`, etc. from AI SDK |
| **New MCP server** | Configure via UI | Settings → MCP Servers | No code changes needed (file or DB storage) |
| **New agent template** | Create via UI | Agents page | Combine tools/workflows/prompts |
| **New permission type** | Add to permissions enum | `lib/auth/permissions.ts` | Use in `validatedActionWithAdminPermission` |
| **New E2E test** | Add test file | `tests/[feature].spec.ts` | Use Playwright, follow existing patterns |
| **New system prompt** | Add to prompts | `lib/ai/prompts.ts` | Use `mergeSystemPrompt` for composition |

### Common Development Flows

**Adding a Feature End-to-End**:
```
1. Define types (src/types/[domain].ts)
2. Create Zod schema (lib/validations/[domain].ts)
3. Add DB table + repository (lib/db/pg/)
4. Create API route (app/api/[resource]/route.ts)
5. Create UI component (components/[domain]/)
6. Create data hook (hooks/queries/use-[resource].ts)
7. Add E2E test (tests/[feature].spec.ts)
8. Run: pnpm check && pnpm test:e2e
```

**Adding a Tool End-to-End**:
```
1. Implement tool (lib/ai/tools/[category]/[name].ts)
2. Add to toolkit (lib/ai/tools/tool-kit.ts)
3. Create rendering component (components/tool-invocation/[name].tsx)
4. Add to tool invocation switch (components/tool-invocation/index.tsx)
5. Test with @toolname mention in chat
```

**Adding a Workflow Node End-to-End**:
```
1. Add NodeKind enum (lib/ai/workflow/workflow.interface.ts)
2. Define node data type (same file)
3. Add executor (lib/ai/workflow/executor/node-executor.ts)
4. Add validator (lib/ai/workflow/validator/node-validate.ts)
5. Create UI config (components/workflow/node-config/[name]-node.tsx)
6. Test in workflow builder
```

---

