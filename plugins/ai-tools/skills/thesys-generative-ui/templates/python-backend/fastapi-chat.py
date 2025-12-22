"""
TheSys Generative UI - FastAPI Backend Example

This example demonstrates how to set up a FastAPI backend that integrates
with TheSys C1 API for streaming generative UI responses.

Dependencies:
    - fastapi
    - uvicorn
    - thesys-genui-sdk
    - openai
    - python-dotenv
"""

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from thesys_genui_sdk import with_c1_response, write_content
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="TheSys C1 API Backend",
    description="FastAPI backend for TheSys Generative UI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client for TheSys C1 API
client = openai.OpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY")
)

# Request model
class ChatRequest(BaseModel):
    prompt: str
    thread_id: str | None = None
    response_id: str | None = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "TheSys C1 API Backend is running"
    }


@app.post("/api/chat")
@with_c1_response  # Automatically handles streaming headers
async def chat_endpoint(request: ChatRequest):
    """
    Streaming chat endpoint that generates UI components.

    Args:
        request: ChatRequest with prompt and optional thread/response IDs

    Returns:
        StreamingResponse with C1-formatted UI chunks
    """
    try:
        # Create streaming completion request
        stream = client.chat.completions.create(
            model="c1/anthropic/claude-sonnet-4/v-20250930",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that creates interactive user interfaces."
                },
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            stream=True,
            temperature=0.7,
            max_tokens=4096
        )

        # Stream chunks to frontend
        async def generate():
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield write_content(content)

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )

    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to generate response"
        }


if __name__ == "__main__":
    import uvicorn

    # Run the server
    uvicorn.run(
        "fastapi-chat:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
