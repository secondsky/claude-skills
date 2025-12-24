# Tool Patterns (TanStack AI)

## 1) Server-only tool (data fetch)
```ts
const getUserDef = toolDefinition({...})
export const getUser = getUserDef.server(async ({ id }) => db.user.find(id))
// Pass getUser in server tools array
```
Use for: DB/API reads, writes that must stay server-side.

## 2) Client-only tool (UI mutation)
```ts
const highlightDef = toolDefinition({...})
export const highlight = highlightDef.client(({ id }) => {
  document.querySelector(`#row-${id}`)?.classList.add('ring')
  return { highlighted: true }
})
```
Use for: UI updates, notifications, clipboard, local storage.

## 3) Hybrid (server fetch → client update)
```ts
const getUserDef = toolDefinition({...})
export const getUser = getUserDef.server(/* fetch */)
export const showUser = getUserDef.client(/* render or focus */)
// include both in tools
```
Use for: fetch data then update UI within one agent loop.

## 4) Long-running tool with polling
```ts
export const startJob = jobDef.server(async () => {
  const jobId = await queue.enqueue()
  return { jobId, pollAfterMs: 2000 }
})
```
Model can call the tool again after `pollAfterMs` to check status; cap with `agentLoopStrategy`.

## 5) Approval-gated tool
```ts
const deleteDef = toolDefinition({ needsApproval: true, ... })
export const deleteUser = deleteDef.server(/* destructive op */)
// UI shows approval.pending and calls approval.approve()
```
Use for: billing, deletes, external side effects.

## 6) Error-handling pattern
Return structured errors instead of throw:
```ts
return { error: { type: 'NotFound', message: 'User missing' } }
```
Model can summarize or retry; avoids unhandled stream errors.

## 7) Input validation
Always add Zod schemas on inputs and normalize outputs. Reject early with helpful messages.

## 8) Naming consistency
Tool name in `toolDefinition` must match client/server implementations exactly to avoid “tool not found.”

## 9) Observability hooks
Wrap tool implementations to log duration, input size, and approval status; redact secrets before logging.
