# Python Backend Templates for TheSys Generative UI

This directory contains production-ready Python backend templates for integrating TheSys C1 Generative UI API.

## Available Templates

### 1. FastAPI Backend (`fastapi-chat.py`)

Modern async web framework with automatic API documentation.

**Features**:
- Async streaming support
- Built-in request validation with Pydantic
- Automatic OpenAPI docs
- CORS middleware configured
- Type hints throughout

**Run**:
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export THESYS_API_KEY=sk-th-your-key-here

# Run server
python fastapi-chat.py

# Or with uvicorn directly
uvicorn fastapi-chat:app --reload --port 8000
```

**API Docs**: Visit `http://localhost:8000/docs` for interactive API documentation

---

### 2. Flask Backend (`flask-chat.py`)

Lightweight and flexible web framework.

**Features**:
- Simple and familiar Flask API
- CORS support with flask-cors
- Streaming response handling
- Easy to customize and extend

**Run**:
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export THESYS_API_KEY=sk-th-your-key-here

# Run server
python flask-chat.py

# Or with flask CLI
export FLASK_APP=flask-chat.py
flask run --port 5000
```

---

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# OR install only what you need
pip install thesys-genui-sdk openai python-dotenv

# For FastAPI
pip install fastapi uvicorn

# For Flask
pip install flask flask-cors
```

### 2. Environment Variables

Create a `.env` file:

```bash
THESYS_API_KEY=sk-th-your-api-key-here
```

Get your API key from: https://console.thesys.dev/keys

### 3. Choose Your Model

Both templates use different models by default to show variety:

**FastAPI**: Uses Claude Sonnet 4
```python
model="c1/anthropic/claude-sonnet-4/v-20250930"
```

**Flask**: Uses GPT 5
```python
model="c1/openai/gpt-5/v-20250930"
```

Change to any supported model:
- `c1/anthropic/claude-sonnet-4/v-20250930` - Claude Sonnet 4 (stable)
- `c1/openai/gpt-5/v-20250930` - GPT 5 (stable)
- `c1-exp/openai/gpt-4.1/v-20250617` - GPT 4.1 (experimental)
- `c1-exp/anthropic/claude-3.5-haiku/v-20250709` - Claude 3.5 Haiku (experimental)

---

## Frontend Integration

### React + Vite Example

```typescript
const makeApiCall = async (prompt: string) => {
  const response = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    setC1Response(prev => prev + chunk);
  }
};
```

### Next.js API Route (Proxy)

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache"
    }
  });
}
```

---

## Production Deployment

### Environment Variables

```bash
# Production
THESYS_API_KEY=sk-th-production-key
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend.com
```

### FastAPI (Recommended for Production)

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn fastapi-chat:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### Flask Production

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn flask-chat:app \
  --workers 4 \
  --bind 0.0.0.0:5000 \
  --timeout 120
```

### Docker Example

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY fastapi-chat.py .

ENV THESYS_API_KEY=""
ENV PORT=8000

CMD ["uvicorn", "fastapi-chat:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Troubleshooting

### Common Issues

**1. Import Error: `thesys_genui_sdk` not found**
```bash
pip install thesys-genui-sdk
```

**2. CORS Errors**
Update CORS configuration in the template to match your frontend URL:
```python
allow_origins=["http://localhost:5173"]  # Vite default
```

**3. Streaming Not Working**
Ensure:
- `stream=True` in the API call
- Using `@with_c1_response` decorator
- Proper response headers set

**4. Authentication Failed (401)**
Check that `THESYS_API_KEY` is set correctly:
```python
import os
print(os.getenv("THESYS_API_KEY"))  # Should not be None
```

---

## Next Steps

1. Copy the template you want to use
2. Install dependencies from `requirements.txt`
3. Set your `THESYS_API_KEY` in `.env`
4. Run the server
5. Connect your React frontend
6. Customize the system prompt and model as needed

For more examples, see the main SKILL.md documentation.
