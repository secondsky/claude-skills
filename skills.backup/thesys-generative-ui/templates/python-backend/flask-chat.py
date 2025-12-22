"""
TheSys Generative UI - Flask Backend Example

This example demonstrates how to set up a Flask backend that integrates
with TheSys C1 API for streaming generative UI responses.

Dependencies:
    - flask
    - flask-cors
    - thesys-genui-sdk
    - openai
    - python-dotenv
"""

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from thesys_genui_sdk import with_c1_response, write_content
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Configure for your frontend URL in production
        "allow_headers": "*",
        "expose_headers": "*"
    }
})

# Initialize OpenAI client for TheSys C1 API
client = openai.OpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY")
)


@app.route("/")
def root():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "TheSys C1 API Backend is running"
    })


@app.route("/api/chat", methods=["POST"])
@with_c1_response  # Automatically handles streaming headers
def chat():
    """
    Streaming chat endpoint that generates UI components.

    Request JSON:
        {
            "prompt": str,
            "thread_id": str (optional),
            "response_id": str (optional)
        }

    Returns:
        StreamingResponse with C1-formatted UI chunks
    """
    try:
        data = request.get_json()
        prompt = data.get("prompt")

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Create streaming completion request
        stream = client.chat.completions.create(
            model="c1/openai/gpt-5/v-20250930",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that creates interactive user interfaces."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            stream=True,
            temperature=0.7,
            max_tokens=4096
        )

        # Stream chunks to frontend
        def generate():
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield write_content(content)

        return Response(
            generate(),
            mimetype="text/event-stream"
        )

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to generate response"
        }), 500


if __name__ == "__main__":
    # Run the server
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
