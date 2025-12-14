import { z } from 'zod'
import { toolDefinition } from '@tanstack/ai'

// Shared definition sent to the model (never include sensitive logic here)
export const createTodoDef = toolDefinition({
  name: 'createTodo',
  description: 'Create a todo item with a title and optional due date',
  inputSchema: z.object({
    title: z.string().min(3),
    due: z.string().optional(),
  }),
  needsApproval: true, // ask the user before creating data
})

// Server implementation (runs on your server)
export const createTodo = createTodoDef.server(async ({ title, due }) => {
  // Replace with your persistence layer
  const todo = { id: crypto.randomUUID(), title, due: due ?? null }
  // e.g., await db.todo.insert(todo)
  return { todo }
})

// Client implementation (runs in the browser)
export const showToast = createTodoDef.client(({ title }) => {
  // Replace with your UI toast system
  console.info(`Todo created: ${title}`)
  return { acknowledged: true }
})

// Export definitions array for convenience
export const tools = [createTodo]
