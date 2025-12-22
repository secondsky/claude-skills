# FastMCP CLI Commands Reference

Complete reference for FastMCP command-line interface.

## Installation

```bash
# Install FastMCP
pip install fastmcp

# or with uv
uv pip install fastmcp

# Check version
fastmcp --version
```

## Development Commands

### `fastmcp dev`

Run server with inspector interface (recommended for development).

```bash
# Basic usage
fastmcp dev server.py

# With options
fastmcp dev server.py --port 8000

# Enable debug logging
FASTMCP_LOG_LEVEL=DEBUG fastmcp dev server.py
```

**Features:**
- Interactive inspector UI
- Hot reload on file changes
- Detailed logging
- Tool/resource inspection

### `fastmcp run`

Run server normally (production-like).

```bash
# stdio transport (default)
fastmcp run server.py

# HTTP transport
fastmcp run server.py --transport http --port 8000

# SSE transport
fastmcp run server.py --transport sse
```

**Options:**
- `--transport`: `stdio`, `http`, or `sse`
- `--port`: Port number (for HTTP/SSE)
- `--host`: Host address (default: 127.0.0.1)

### `fastmcp inspect`

Inspect server without running it.

```bash
# Inspect tools and resources
fastmcp inspect server.py

# Output as JSON
fastmcp inspect server.py --json

# Show detailed information
fastmcp inspect server.py --verbose
```

**Output includes:**
- List of tools
- List of resources
- List of prompts
- Configuration details

## Installation Commands

### `fastmcp install`

Install server to Claude Desktop.

```bash
# Basic installation
fastmcp install server.py

# With custom name
fastmcp install server.py --name "My Server"

# Specify config location
fastmcp install server.py --config-path ~/.config/Claude/claude_desktop_config.json
```

**What it does:**
- Adds server to Claude Desktop configuration
- Sets up proper command and arguments
- Validates server before installing

### Claude Desktop Configuration

Manual configuration (if not using `fastmcp install`):

```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

**Config locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Python Direct Execution

### Run with Python

```bash
# stdio (default)
python server.py

# HTTP transport
python server.py --transport http --port 8000

# With arguments
python server.py --transport http --port 8000 --host 0.0.0.0
```

### Custom Argument Parsing

```python
# server.py
if __name__ == "__main__":
    import sys

    # Parse custom arguments
    if "--test" in sys.argv:
        run_tests()
    elif "--migrate" in sys.argv:
        run_migrations()
    else:
        mcp.run()
```

## Environment Variables

### FastMCP-Specific Variables

```bash
# Logging
export FASTMCP_LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
export FASTMCP_LOG_FILE=/path/to/log.txt

# Environment
export FASTMCP_ENV=production  # development, staging, production

# Custom variables (your server)
export API_KEY=your-key
export DATABASE_URL=postgres://...
```

### Using with Commands

```bash
# Inline environment variables
API_KEY=test fastmcp dev server.py

# From .env file
set -a && source .env && set +a && fastmcp dev server.py
```

## Testing Commands

### Run Tests with Client

```python
# test.py
import asyncio
from fastmcp import Client

async def test():
    async with Client("server.py") as client:
        tools = await client.list_tools()
        print(f"Tools: {[t.name for t in tools]}")

asyncio.run(test())
```

```bash
# Run tests
python test.py
```

### Integration Testing

```bash
# Start server in background
fastmcp run server.py --transport http --port 8000 &
SERVER_PID=$!

# Run tests
pytest tests/

# Kill server
kill $SERVER_PID
```

## Debugging Commands

### Enable Debug Logging

```bash
# Full debug output
FASTMCP_LOG_LEVEL=DEBUG fastmcp dev server.py

# Python logging
PYTHONVERBOSE=1 fastmcp dev server.py

# Trace imports
PYTHONPATH=. python -v server.py
```

### Check Python Environment

```bash
# Check Python version
python --version

# Check installed packages
pip list | grep fastmcp

# Check import paths
python -c "import sys; print('\n'.join(sys.path))"
```

### Validate Server

```bash
# Check syntax
python -m py_compile server.py

# Check imports
python -c "import server; print('OK')"

# Inspect structure
fastmcp inspect server.py --verbose
```

## Deployment Commands

### Prepare for Deployment

```bash
# Freeze dependencies
pip freeze > requirements.txt

# Clean specific to FastMCP
echo "fastmcp>=2.12.0" > requirements.txt
echo "httpx>=0.27.0" >> requirements.txt

# Test with clean environment
python -m venv test_env
source test_env/bin/activate
pip install -r requirements.txt
python server.py
```

### Git Commands for Deployment

```bash
# Prepare for cloud deployment
git add server.py requirements.txt
git commit -m "Prepare for deployment"

# Create GitHub repo
gh repo create my-mcp-server --public

# Push
git push -u origin main
```

## Performance Commands

### Profiling

```bash
# Profile with cProfile
python -m cProfile -o profile.stats server.py

# Analyze profile
python -m pstats profile.stats
```

### Memory Profiling

```bash
# Install memory_profiler
pip install memory_profiler

# Run with memory profiling
python -m memory_profiler server.py
```

## Batch Operations

### Multiple Servers

```bash
# Start multiple servers
fastmcp run server1.py --port 8000 &
fastmcp run server2.py --port 8001 &
fastmcp run server3.py --port 8002 &

# Kill all
killall -9 python
```

### Process Management

```bash
# Use screen/tmux for persistent sessions
screen -S fastmcp
fastmcp dev server.py
# Detach: Ctrl+A, D

# Reattach
screen -r fastmcp
```

## Common Command Patterns

### Local Development

```bash
# Quick iteration cycle
fastmcp dev server.py  # Edit, save, auto-reload
```

### Testing with HTTP Client

```bash
# Start HTTP server
fastmcp run server.py --transport http --port 8000

# Test with curl
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### Production-like Testing

```bash
# Set production environment
export ENVIRONMENT=production
export FASTMCP_LOG_LEVEL=WARNING

# Run
fastmcp run server.py
```

## Troubleshooting Commands

### Server Won't Start

```bash
# Check for syntax errors
python -m py_compile server.py

# Check for missing dependencies
pip check

# Verify FastMCP installation
python -c "import fastmcp; print(fastmcp.__version__)"
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
lsof -ti:8000 | xargs kill -9

# Use different port
fastmcp run server.py --port 8001
```

### Permission Issues

```bash
# Make server executable
chmod +x server.py

# Fix Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## Resources

- **FastMCP CLI Docs**: https://github.com/jlowin/fastmcp#cli
- **MCP Protocol**: https://modelcontextprotocol.io
- **Context7**: `/jlowin/fastmcp`
