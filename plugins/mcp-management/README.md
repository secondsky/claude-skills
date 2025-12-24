# MCP Management Skill

Manage Model Context Protocol (MCP) servers for discovering, analyzing, and executing tools/prompts/resources.

## Overview

This skill provides utilities to interact with MCP servers without polluting the main context window. It supports progressive disclosure of capabilities, intelligent tool selection, and multi-server management.

## Key Benefits

- Progressive disclosure of MCP capabilities (load only what's needed)
- Intelligent tool/prompt/resource selection based on task requirements
- Multi-server management from single config file
- Context-efficient: subagents handle MCP discovery and execution
- Persistent tool catalog: saves discovered tools to JSON for fast reference

## When to Use

1. **Discovering MCP Capabilities**: List available tools/prompts/resources
2. **Task-Based Tool Selection**: Analyze which MCP tools are relevant
3. **Executing MCP Tools**: Call MCP tools programmatically
4. **MCP Integration**: Build or debug MCP client implementations
5. **Context Management**: Delegate MCP operations to subagents

## Quick Start

```bash
# Using bun (preferred)
bunx tsx scripts/cli.ts list-tools  # Saves to assets/tools.json
bunx tsx scripts/cli.ts call-tool memory create_entities '{"entities":[...]}'

# Using npx
npx tsx scripts/cli.ts list-tools
```

## Auto-Trigger Keywords

- MCP server management
- Model Context Protocol
- MCP tool discovery
- MCP integration
- tool execution
- multi-server orchestration
- context protocol
- MCP client

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)
