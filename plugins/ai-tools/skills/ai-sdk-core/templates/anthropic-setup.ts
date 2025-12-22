// Anthropic provider configuration
// AI SDK Core - Anthropic (Claude) setup and usage

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async function main() {
  console.log('=== Anthropic (Claude) Provider Setup ===\n');

  // Example model initializations (for demonstration - use models object below in production)
  // Method 1: Use environment variable (recommended)
  // ANTHROPIC_API_KEY=sk-ant-...
  const model1 = anthropic('claude-sonnet-4-5-20250929');

  // Method 2: Explicit API key
  const model2 = anthropic('claude-sonnet-4-5-20250929', {
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Use model1 or model2 in your generateText/streamText calls

  // Available models (Claude 4.x)
  const models = {
    sonnet45: anthropic('claude-sonnet-4-5-20250929'), // Best balance
    opus45: anthropic('claude-opus-4-5-20251101'), // Highest intelligence
    haiku45: anthropic('claude-haiku-4-5-20251001'), // Fastest
  };

  // Example: Generate text with Claude
  console.log('Generating text with Claude Sonnet 4.5...\n');

  const result = await generateText({
    model: models.sonnet45,
    prompt: 'Explain what makes Claude different from other AI assistants in 2 sentences.',
    maxOutputTokens: 150,
  });

  console.log('Response:', result.text);
  console.log('\nUsage:');
  console.log('- Prompt tokens:', result.usage.promptTokens);
  console.log('- Completion tokens:', result.usage.completionTokens);
  console.log('- Total tokens:', result.usage.totalTokens);

  // Example: Long context handling
  console.log('\n=== Long Context Example ===\n');

  const longContextResult = await generateText({
    model: models.sonnet45,
    messages: [
      {
        role: 'user',
        content: 'I will give you a long document to analyze. Here it is: ' + 'Lorem ipsum '.repeat(1000),
      },
      {
        role: 'user',
        content: 'Now summarize the key points.',
      },
    ],
    maxOutputTokens: 200,
  });

  console.log('Long context summary:', longContextResult.text);

  // Model selection guide
  console.log('\n=== Model Selection Guide ===');
  console.log('- Claude Sonnet 4.5: Best balance of intelligence, speed, and cost');
  console.log('- Claude Opus 4.5: Highest intelligence, best for complex reasoning');
  console.log('- Claude Haiku 4.5: Fastest and most cost-effective');
  console.log('\nAll Claude 4.x models support 200K+ token context windows');
}

main().catch(console.error);
