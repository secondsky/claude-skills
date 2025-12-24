import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat completion
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Streaming
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}

// Function calling
const funcResponse = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'getWeather',
      description: 'Get weather',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      }
    }
  }]
});
