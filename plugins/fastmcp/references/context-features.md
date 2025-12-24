# FastMCP Context Features Reference

Complete reference for FastMCP's advanced context features: elicitation, progress tracking, and sampling.

## Context Injection

To use context features, inject Context into your tool:

```python
from fastmcp import Context

@mcp.tool()
async def tool_with_context(param: str, context: Context) -> dict:
    """Tool that uses context features."""
    # Access context features here
    pass
```

**Important:** Context parameter MUST have type hint `Context` for injection to work.

## Feature 1: Elicitation (User Input)

Request user input during tool execution.

### Basic Usage

```python
from fastmcp import Context

@mcp.tool()
async def confirm_action(action: str, context: Context) -> dict:
    """Request user confirmation."""
    # Request user input
    user_response = await context.request_elicitation(
        prompt=f"Confirm {action}? (yes/no)",
        response_type=str
    )

    if user_response.lower() == "yes":
        result = await perform_action(action)
        return {"status": "completed", "action": action}
    else:
        return {"status": "cancelled", "action": action}
```

### Type-Based Elicitation

```python
@mcp.tool()
async def collect_user_info(context: Context) -> dict:
    """Collect information from user."""
    # String input
    name = await context.request_elicitation(
        prompt="What is your name?",
        response_type=str
    )

    # Boolean input
    confirmed = await context.request_elicitation(
        prompt="Do you want to continue?",
        response_type=bool
    )

    # Numeric input
    count = await context.request_elicitation(
        prompt="How many items?",
        response_type=int
    )

    return {
        "name": name,
        "confirmed": confirmed,
        "count": count
    }
```

### Custom Type Elicitation

```python
from dataclasses import dataclass

@dataclass
class UserChoice:
    option: str
    reason: str

@mcp.tool()
async def get_user_choice(options: list[str], context: Context) -> dict:
    """Get user choice with reasoning."""
    choice = await context.request_elicitation(
        prompt=f"Choose from: {', '.join(options)}",
        response_type=UserChoice
    )

    return {
        "selected": choice.option,
        "reason": choice.reason
    }
```

### Client Handler for Elicitation

Client must provide handler:

```python
from fastmcp import Client

async def elicitation_handler(message: str, response_type: type, context: dict):
    """Handle elicitation requests."""
    if response_type == str:
        return input(f"{message}: ")
    elif response_type == bool:
        response = input(f"{message} (y/n): ")
        return response.lower() == 'y'
    elif response_type == int:
        return int(input(f"{message}: "))
    else:
        return input(f"{message}: ")

async with Client(
    "server.py",
    elicitation_handler=elicitation_handler
) as client:
    result = await client.call_tool("collect_user_info", {})
```

## Feature 2: Progress Tracking

Report progress for long-running operations.

### Basic Progress

```python
@mcp.tool()
async def long_operation(count: int, context: Context) -> dict:
    """Operation with progress tracking."""
    for i in range(count):
        # Report progress
        await context.report_progress(
            progress=i + 1,
            total=count,
            message=f"Processing item {i + 1}/{count}"
        )

        # Do work
        await asyncio.sleep(0.1)

    return {"status": "completed", "processed": count}
```

### Multi-Phase Progress

```python
@mcp.tool()
async def multi_phase_operation(data: list, context: Context) -> dict:
    """Operation with multiple phases."""
    # Phase 1: Loading
    await context.report_progress(0, 3, "Phase 1: Loading data")
    loaded = await load_data(data)

    # Phase 2: Processing
    await context.report_progress(1, 3, "Phase 2: Processing")
    for i, item in enumerate(loaded):
        await context.report_progress(
            progress=i,
            total=len(loaded),
            message=f"Processing {i + 1}/{len(loaded)}"
        )
        await process_item(item)

    # Phase 3: Saving
    await context.report_progress(2, 3, "Phase 3: Saving results")
    await save_results()

    await context.report_progress(3, 3, "Complete!")

    return {"status": "completed", "items": len(loaded)}
```

### Indeterminate Progress

For operations where total is unknown:

```python
@mcp.tool()
async def indeterminate_operation(context: Context) -> dict:
    """Operation with unknown duration."""
    stages = [
        "Initializing",
        "Loading data",
        "Processing",
        "Finalizing"
    ]

    for stage in stages:
        # No total - shows as spinner/indeterminate
        await context.report_progress(
            progress=stages.index(stage),
            total=None,
            message=stage
        )
        await perform_stage(stage)

    return {"status": "completed"}
```

### Client Handler for Progress

```python
async def progress_handler(progress: float, total: float | None, message: str | None):
    """Handle progress updates."""
    if total:
        pct = (progress / total) * 100
        # Use \r for same-line update
        print(f"\r[{pct:.1f}%] {message}", end="", flush=True)
    else:
        # Indeterminate progress
        print(f"\n[PROGRESS] {message}")

async with Client(
    "server.py",
    progress_handler=progress_handler
) as client:
    result = await client.call_tool("long_operation", {"count": 100})
```

## Feature 3: Sampling (LLM Integration)

Request LLM completions from within tools.

### Basic Sampling

```python
@mcp.tool()
async def enhance_text(text: str, context: Context) -> str:
    """Enhance text using LLM."""
    response = await context.request_sampling(
        messages=[{
            "role": "system",
            "content": "You are a professional copywriter."
        }, {
            "role": "user",
            "content": f"Enhance this text: {text}"
        }],
        temperature=0.7,
        max_tokens=500
    )

    return response["content"]
```

### Structured Output with Sampling

```python
@mcp.tool()
async def classify_text(text: str, context: Context) -> dict:
    """Classify text using LLM."""
    prompt = f"""
    Classify this text: {text}

    Return JSON with:
    - category: one of [news, blog, academic, social]
    - sentiment: one of [positive, negative, neutral]
    - topics: list of main topics

    Return as JSON object.
    """

    response = await context.request_sampling(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,  # Lower for consistency
        response_format="json"
    )

    import json
    return json.loads(response["content"])
```

### Multi-Turn Sampling

```python
@mcp.tool()
async def interactive_analysis(topic: str, context: Context) -> dict:
    """Multi-turn analysis with LLM."""
    # First turn: Generate questions
    questions_response = await context.request_sampling(
        messages=[{
            "role": "user",
            "content": f"Generate 3 key questions about: {topic}"
        }],
        max_tokens=200
    )

    # Second turn: Answer questions
    analysis_response = await context.request_sampling(
        messages=[{
            "role": "user",
            "content": f"Answer these questions about {topic}:\n{questions_response['content']}"
        }],
        max_tokens=500
    )

    return {
        "topic": topic,
        "questions": questions_response["content"],
        "analysis": analysis_response["content"]
    }
```

### Client Handler for Sampling

Client provides LLM access:

```python
async def sampling_handler(messages, params, context):
    """Handle LLM sampling requests."""
    # Call your LLM API
    from openai import AsyncOpenAI

    client = AsyncOpenAI()
    response = await client.chat.completions.create(
        model=params.get("model", "gpt-4"),
        messages=messages,
        temperature=params.get("temperature", 0.7),
        max_tokens=params.get("max_tokens", 1000)
    )

    return {
        "content": response.choices[0].message.content,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    }

async with Client(
    "server.py",
    sampling_handler=sampling_handler
) as client:
    result = await client.call_tool("enhance_text", {"text": "Hello world"})
```

## Combined Example

All context features together:

```python
@mcp.tool()
async def comprehensive_task(data: list, context: Context) -> dict:
    """Task using all context features."""
    # 1. Elicitation: Confirm operation
    confirmed = await context.request_elicitation(
        prompt="Start processing?",
        response_type=bool
    )

    if not confirmed:
        return {"status": "cancelled"}

    # 2. Progress: Track processing
    results = []
    for i, item in enumerate(data):
        await context.report_progress(
            progress=i + 1,
            total=len(data),
            message=f"Processing {i + 1}/{len(data)}"
        )

        # 3. Sampling: Use LLM for processing
        enhanced = await context.request_sampling(
            messages=[{
                "role": "user",
                "content": f"Analyze this item: {item}"
            }],
            temperature=0.5
        )

        results.append({
            "item": item,
            "analysis": enhanced["content"]
        })

    return {
        "status": "completed",
        "total": len(data),
        "results": results
    }
```

## Best Practices

### Elicitation

- **Clear prompts**: Be specific about what you're asking
- **Type validation**: Use appropriate response_type
- **Handle cancellation**: Allow users to cancel operations
- **Provide context**: Explain why input is needed

### Progress Tracking

- **Regular updates**: Report every 5-10% or every item
- **Meaningful messages**: Describe what's happening
- **Phase indicators**: Show which phase of operation
- **Final confirmation**: Report 100% completion

### Sampling

- **System prompts**: Set clear instructions
- **Temperature control**: Lower for factual, higher for creative
- **Token limits**: Set reasonable max_tokens
- **Error handling**: Handle API failures gracefully
- **Cost awareness**: Sampling uses LLM API (costs money)

## Error Handling

### Context Not Available

```python
@mcp.tool()
async def safe_context_usage(context: Context) -> dict:
    """Safely use context features."""
    # Check if feature is available
    if hasattr(context, 'report_progress'):
        await context.report_progress(0, 100, "Starting")

    if hasattr(context, 'request_elicitation'):
        response = await context.request_elicitation(
            prompt="Continue?",
            response_type=bool
        )
    else:
        # Fallback behavior
        response = True

    return {"status": "completed"}
```

### Timeout Handling

```python
import asyncio

@mcp.tool()
async def elicitation_with_timeout(context: Context) -> dict:
    """Elicitation with timeout."""
    try:
        response = await asyncio.wait_for(
            context.request_elicitation(
                prompt="Your input (30 seconds):",
                response_type=str
            ),
            timeout=30.0
        )
        return {"status": "completed", "input": response}
    except asyncio.TimeoutError:
        return {"status": "timeout", "message": "No input received"}
```

## Context Feature Availability

| Feature | Claude Desktop | Claude Code CLI | FastMCP Cloud | Custom Client |
|---------|---------------|----------------|---------------|---------------|
| Elicitation | ✅ | ✅ | ⚠️ Depends | ✅ With handler |
| Progress | ✅ | ✅ | ✅ | ✅ With handler |
| Sampling | ✅ | ✅ | ⚠️ Depends | ✅ With handler |

⚠️ = Feature availability depends on client implementation

## Resources

- **Context API**: See SKILL.md for full Context API reference
- **Client Handlers**: See `client-example.py` template
- **MCP Protocol**: https://modelcontextprotocol.io
