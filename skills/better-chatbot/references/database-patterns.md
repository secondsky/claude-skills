## Database & Repository Patterns

### Repository Pattern Architecture

**Location**: `src/lib/db/`

**Structure**:
```
db/
├── repository.ts          → Single import point
├── pg/
│   ├── db.pg.ts          → Drizzle connection
│   ├── schema.pg.ts      → Table definitions
│   └── repositories/     → Feature queries
└── migrations/           → Drizzle migrations
```

**Philosophy**: Abstract DB behind repository interfaces

### Interface-First Design

**Pattern**:
```typescript
// 1. Define interface in src/types/[domain].ts
export type ChatRepository = {
  insertThread(thread: Omit<ChatThread, "createdAt">): Promise<ChatThread>;
  selectThread(id: string): Promise<ChatThread | null>;
  selectThreadDetails(id: string): Promise<ThreadDetails | null>;
};

// 2. Implement in src/lib/db/pg/repositories/[domain]-repository.pg.ts
export const pgChatRepository: ChatRepository = {
  selectThreadDetails: async (id: string) => {
    const [thread] = await db
      .select()
      .from(ChatThreadTable)
      .leftJoin(UserTable, eq(ChatThreadTable.userId, UserTable.id))
      .where(eq(ChatThreadTable.id, id));

    if (!thread) return null;

    const messages = await pgChatRepository.selectMessagesByThreadId(id);

    return {
      id: thread.chat_thread.id,
      title: thread.chat_thread.title,
      userId: thread.chat_thread.userId,
      createdAt: thread.chat_thread.createdAt,
      userPreferences: thread.user?.preferences,
      messages,
    };
  },
};

// 3. Export from src/lib/db/repository.ts
export const chatRepository = pgChatRepository;
```

**Why**:
- Easy to swap implementations (pg → sqlite)
- Testable without database
- Consistent API across codebase

### Query Optimization Strategies

**1. Indexes on Foreign Keys**:
```typescript
export const ChatThreadTable = pgTable("chat_thread", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => UserTable.id),
}, (table) => ({
  userIdIdx: index("chat_thread_user_id_idx").on(table.userId),
}));
```

**2. Selective Loading**:
```typescript
// Load minimal data
selectThread(id) → { id, title, userId, createdAt }

// Load full data when needed
selectThreadDetails(id) → { ...thread, messages, userPreferences }
```

**3. SQL Aggregation**:
```typescript
// Get threads with last message timestamp
const threadsWithActivity = await db
  .select({
    threadId: ChatThreadTable.id,
    lastMessageAt: sql<string>`MAX(${ChatMessageTable.createdAt})`,
  })
  .from(ChatThreadTable)
  .leftJoin(ChatMessageTable, eq(ChatThreadTable.id, ChatMessageTable.threadId))
  .groupBy(ChatThreadTable.id)
  .orderBy(desc(sql`last_message_at`));
```

### Schema Evolution Workflow

```bash
# 1. Modify schema in src/lib/db/pg/schema.pg.ts
export const NewTable = pgTable("new_table", { ... });

# 2. Generate migration
pnpm db:generate

# 3. Review generated SQL in drizzle/migrations/
# 4. Apply migration
pnpm db:migrate

# 5. Optional: Visual DB exploration
pnpm db:studio
```

---

