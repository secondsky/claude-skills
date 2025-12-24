/**
 * Queue Routes (Producer)
 *
 * Send messages to queues for async processing.
 * Consumer handler should be added to backend/src/index.ts
 *
 * Example consumer:
 * async queue(batch, env) {
 *   for (const message of batch.messages) {
 *     console.log('Processing:', message.body)
 *     // Process message here
 *   }
 * }
 */

import { Hono } from 'hono'

type Bindings = {
  MY_QUEUE: Queue
}

const queues = new Hono<{ Bindings: Bindings }>()

// Send single message
queues.post('/send', async (c) => {
  const body = await c.req.json()

  await c.env.MY_QUEUE.send({
    type: 'task',
    data: body,
    timestamp: Date.now(),
  })

  return c.json({ status: 'queued' })
})

// Send with delay
queues.post('/send-delayed', async (c) => {
  const { data, delaySeconds } = await c.req.json<{
    data: any
    delaySeconds: number
  }>()

  await c.env.MY_QUEUE.send(
    {
      type: 'delayed-task',
      data,
    },
    {
      delaySeconds,
    }
  )

  return c.json({
    status: 'scheduled',
    processAt: new Date(Date.now() + delaySeconds * 1000).toISOString(),
  })
})

// Send batch
queues.post('/send-batch', async (c) => {
  const { messages } = await c.req.json<{
    messages: any[]
  }>()

  if (messages.length > 100) {
    return c.json({ error: 'Maximum 100 messages per batch' }, 400)
  }

  await c.env.MY_QUEUE.sendBatch(
    messages.map((msg) => ({
      body: {
        type: 'batch-task',
        data: msg,
        timestamp: Date.now(),
      },
    }))
  )

  return c.json({
    status: 'queued',
    count: messages.length,
  })
})

export default queues
