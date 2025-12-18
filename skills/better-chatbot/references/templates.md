## Practical Templates

### Template: Adding a New Default Tool

```typescript
// 1. Define in lib/ai/tools/[category]/[tool-name].ts
import { tool as createTool } from "ai";
import { z } from "zod";

export const myNewTool = createTool({
  description: "Clear description for LLM to understand when to use this",
  inputSchema: z.object({
    param: z.string().describe("What this parameter does"),
  }),
  execute: async (params) => {
    // For visualization tools: return "Success"
    // For data tools: return actual data
    return "Success";
  },
});

// 2. Add to lib/ai/tools/tool-kit.ts
import { DefaultToolName } from "./index";
import { myNewTool } from "./[category]/[tool-name]";

export enum DefaultToolName {
  // ... existing
  MyNewTool = "my_new_tool",
}

// TODO: Define AppDefaultToolkit enum to categorize your tools
// Example:
// export enum AppDefaultToolkit {
//   Visualization = "visualization",
//   WebSearch = "web-search",
//   Http = "http",
//   Code = "code",
// }

export const APP_DEFAULT_TOOL_KIT = {
  [AppDefaultToolkit.MyCategory]: {  // Replace MyCategory with actual category from your enum
    [DefaultToolName.MyNewTool]: myNewTool,
  },
};

// 3. Create rendering in components/tool-invocation/my-tool-invocation.tsx
export function MyToolInvocation({ part }: { part: ToolUIPart }) {
  const args = part.input as z.infer<typeof myNewTool.inputSchema>;
  return <div>{/* Render based on args */}</div>;
}

// 4. Add to components/tool-invocation/index.tsx switch
if (toolName === DefaultToolName.MyNewTool) {
  return <MyToolInvocation part={part} />;
}
```

### Template: Adding a New API Route

**Note**: Replace placeholder tokens with your actual values:
- `[resource]` → your resource name (e.g., "tasks", "messages", "users")
- `[domain]` → your domain name (e.g., "chat", "analytics", "billing")
- Use singular form for types/repository names: `TaskRepository`, `MessageRepository`
- Use the same name consistently throughout imports, filenames, and calls

```typescript
// src/app/api/[resource]/route.ts
import { getSession } from "auth/server";
import { [resource]Repository } from "lib/db/repository";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().default(10),
});

export async function GET(request: Request) {
  // 1. Auth check
  const session = await getSession();
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse & validate
  try {
    const url = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));

    // 3. Use repository
    const data = await [resource]Repository.selectByUserId(
      session.user.id,
      params.limit
    );

    return Response.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid params", details: error.message },
        { status: 400 }
      );
    }
    console.error("Failed:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

const createSchema = z.object({
  // Define fields matching your resource structure
  // Example: name: z.string(), description: z.string().optional()
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const item = await [resource]Repository.insert({
      ...data,
      userId: session.user.id,
    });

    return Response.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Template: Adding a New Repository

```typescript
// 1. Define interface in src/types/[domain].ts
export type MyRepository = {
  selectById(id: string): Promise<MyType | null>;
  selectByUserId(userId: string, limit?: number): Promise<MyType[]>;
  insert(data: InsertType): Promise<MyType>;
  update(id: string, data: Partial<InsertType>): Promise<MyType>;
  delete(id: string): Promise<void>;
};

// 2. Add table to src/lib/db/pg/schema.pg.ts
export const MyTable = pgTable("my_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => UserTable.id).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("my_table_user_id_idx").on(table.userId),
}));

// 3. Implement in src/lib/db/pg/repositories/my-repository.pg.ts
import { pgDb as db } from "../db.pg";
import { MyTable } from "../schema.pg";
import { eq, desc } from "drizzle-orm";

export const pgMyRepository: MyRepository = {
  selectById: async (id) => {
    const [result] = await db
      .select()
      .from(MyTable)
      .where(eq(MyTable.id, id));
    return result ?? null;
  },

  selectByUserId: async (userId, limit = 10) => {
    return await db
      .select()
      .from(MyTable)
      .where(eq(MyTable.userId, userId))
      .orderBy(desc(MyTable.createdAt))
      .limit(limit);
  },

  insert: async (data) => {
    const [result] = await db
      .insert(MyTable)
      .values(data)
      .returning();
    return result;
  },

  update: async (id, data) => {
    const [result] = await db
      .update(MyTable)
      .set(data)
      .where(eq(MyTable.id, id))
      .returning();
    return result;
  },

  delete: async (id) => {
    await db.delete(MyTable).where(eq(MyTable.id, id));
  },
};

// 4. Export from src/lib/db/repository.ts
export { pgMyRepository as myRepository } from "./pg/repositories/my-repository.pg";

// 5. Generate and run migration
// pnpm db:generate
// pnpm db:migrate
```

---

