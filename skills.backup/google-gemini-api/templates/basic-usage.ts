/**
 * Google Gemini API - Basic Usage Template
 * SDK: @google/genai v1.27+ (NOT @google/generative-ai - deprecated!)
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ===== 1. TEXT GENERATION =====
async function generateText() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Explain quantum computing in simple terms'
  });
  
  console.log(response.text);
}

// ===== 2. STREAMING =====
async function streamResponse() {
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: 'Write a story about a robot'
  });
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }
}

// ===== 3. MULTIMODAL (Image) =====
async function analyzeImage() {
  const imageData = Buffer.from(imageBytes).toString('base64');
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: 'What is in this image?' },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]
  });
  
  console.log(response.text);
}

// ===== 4. FUNCTION CALLING =====
async function functionCalling() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is the weather in San Francisco?',
    tools: [{
      functionDeclarations: [{
        name: 'getWeather',
        description: 'Get current weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        }
      }]
    }]
  });
  
  // Handle function call
  const call = response.functionCalls?.[0];
  if (call) {
    const result = await getWeather(call.args);
    
    // Send result back
    const final = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...response.contents,
        {
          functionResponse: {
            name: call.name,
            response: result
          }
        }
      ]
    });
    
    console.log(final.text);
  }
}

async function getWeather({ location }) {
  return { temperature: 72, unit: 'fahrenheit', location };
}

// ===== 5. MULTI-TURN CHAT =====
async function chat() {
  const chat = ai.models.startChat({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a helpful assistant',
    history: []
  });
  
  let response = await chat.sendMessage('Hello!');
  console.log(response.text);
  
  response = await chat.sendMessage('What is 2+2?');
  console.log(response.text);
}

// ===== 6. THINKING MODE =====
async function thinkingMode() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-thinking',  // Note: -thinking suffix
    contents: 'Solve this logic puzzle: ...'
  });
  
  console.log('Thinking:', response.thinkingContent);
  console.log('Answer:', response.text);
}

/**
 * Best Practices:
 * 1. Use @google/genai (NOT @google/generative-ai)
 * 2. Models: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
 * 3. Max input tokens: 1,048,576 (NOT 2M!)
 * 4. Implement retry logic for rate limits
 * 5. Use streaming for long responses
 * 6. Use context caching for large/repeated inputs
 */
