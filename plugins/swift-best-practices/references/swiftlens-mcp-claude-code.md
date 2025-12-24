# SwiftLens MCP Integration for Claude Code

Complete guide to integrating SwiftLens MCP server with **Claude Code CLI** for semantic-level Swift code analysis.

⚠️ **IMPORTANT**: This guide is for **Claude Code CLI** (command line tool), NOT Claude Desktop (GUI app). The configuration is different!

---

## What is SwiftLens MCP?

SwiftLens is the **first and only iOS/Swift MCP server** that provides semantic-level code analysis using Apple's SourceKit-LSP. It goes beyond simple pattern matching to understand your Swift code at a compiler-grade level.

**Official Website**: https://swiftlens.tools/
**GitHub**: https://github.com/swiftlens/swiftlens

---

## Installation

### Step 1: Install SwiftLens Globally

```bash
# Verify uvx is installed (comes with uv package manager)
uvx --version

# Install/run SwiftLens
uvx swiftlens --version
```

**Requirements**:
- macOS 15.7+ (SourceKit-LSP requirement)
- Xcode installed (provides SourceKit-LSP)
- Python 3.10+ (for uvx/uv)

---

## Configuration for Claude Code

SwiftLens MCP can be configured **project-specific** or **globally** in Claude Code.

### Option A: Project-Specific Configuration (Recommended)

Create `.claude/mcps/swiftlens.json` in your Swift project:

```json
{
  "mcpServers": {
    "swiftlens": {
      "description": "SwiftLens MCP provides semantic-level Swift code analysis using Apple's SourceKit-LSP. Includes 15 tools for Swift file analysis, symbol lookup, cross-file references, and code modification.",
      "command": "uvx",
      "args": ["swiftlens"]
    }
  }
}
```

**Advantages**:
- Different projects can use different MCP configurations
- Committed to git → team members get same setup
- Easy to enable/disable per project

### Option B: Global Configuration

Add to `~/.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "mcpServers": {
    "swiftlens": {
      "description": "SwiftLens MCP provides semantic-level Swift code analysis using Apple's SourceKit-LSP. Includes 15 tools for Swift file analysis, symbol lookup, cross-file references, and code modification.",
      "command": "uvx",
      "args": ["swiftlens"]
    }
  }
}
```

**Advantages**:
- Available in all projects automatically
- Single configuration to maintain

---

## SwiftLens's 15 Tools

### Single-File Analysis (No Index Required)

These tools work immediately without building an index:

1. **`swift_analyze_file`** - Parse file structure, extract all symbols (types, functions, properties)
2. **`swift_get_symbols_overview`** - Get top-level declarations from a file
3. **`swift_validate_file`** - Check syntax and type errors using swiftc
4. **`swift_get_diagnostics`** - Get compiler diagnostics (errors/warnings)
5. **`swift_get_document_symbols`** - Get file outline/structure
6. **`swift_get_document_highlights`** - Highlight all occurrences of symbol under cursor
7. **`swift_format_file`** - Format Swift code (requires swift-format)
8. **`swift_get_folding_ranges`** - Get code folding ranges

### Cross-File Analysis (Requires Index)

These tools need a project index to work:

9. **`swift_find_symbol_references`** - Find all usages of a symbol across project
10. **`swift_get_symbol_definition`** - Jump to symbol definition
11. **`swift_get_hover_info`** - Get type information for symbol (44% success rate*)
12. **`swift_get_call_hierarchy`** - Get callers/callees of a function

### Code Modification

13. **`swift_replace_symbol_body`** - Safely replace function/type implementation
14. **`swift_apply_edit`** - Atomic file modifications
15. **`swift_rename_symbol`** - Rename symbol with all references

\* **Known Limitation**: Hover info has ~44% success rate for expressions inside function bodies (Apple SourceKit-LSP limitation)

---

## Index Building (Required for Cross-File Tools)

Cross-file analysis tools (#9-12) require a **project index**. This is **NOT automatic** and must be built manually.

### Build Index for Your Project

```bash
# Navigate to your Xcode project directory
cd /path/to/your/project

# Build index with Swift Package Manager
swift build -Xswiftc -index-store-path -Xswiftc .build/index/store

# OR with Xcode (if you're in an Xcode project)
xcodebuild -scheme YourScheme \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  COMPILER_INDEX_STORE_ENABLE=YES \
  INDEX_DATA_STORE_DIR=.build/index/store
```

### When to Rebuild Index

Rebuild the index when:
- ✅ Adding new Swift files to the project
- ✅ Modifying public interfaces (function signatures, type definitions)
- ✅ Getting "symbol not found" errors from cross-file tools
- ✅ After pulling changes from git
- ✅ After changing Swift dependencies

**Pro Tip**: Add index building to your project's setup script!

---

## Usage Examples (Code-First Approach)

Per the **Cloudflare Code Mode article**, LLMs understand code better than tool definitions. Here's how to use SwiftLens tools:

### Example 1: Analyze a Swift File

```typescript
// Request semantic analysis of a file
const analysis = await swiftlens.analyzeFile({
  path: "/path/to/UserManager.swift"
});

// Returns:
// {
//   symbols: [
//     { name: "UserManager", kind: "class", range: {...} },
//     { name: "login", kind: "method", range: {...} },
//     { name: "logout", kind: "method", range: {...} }
//   ],
//   imports: ["Foundation", "Combine"],
//   diagnostics: []
// }
```

### Example 2: Find All References to a Symbol

```typescript
// Build index first (if not already built)
await swiftlens.buildIndex({
  projectPath: "/path/to/project"
});

// Find all usages of UserManager.login
const references = await swiftlens.findSymbolReferences({
  symbol: "UserManager.login",
  projectPath: "/path/to/project"
});

// Returns:
// {
//   references: [
//     { file: "LoginView.swift", line: 42, column: 12 },
//     { file: "SettingsView.swift", line: 89, column: 8 },
//     { file: "UserManagerTests.swift", line: 15, column: 20 }
//   ],
//   count: 3
// }
```

### Example 3: Get Type Information

```typescript
// Get hover information at a specific location
const typeInfo = await swiftlens.getHoverInfo({
  path: "/path/to/UserManager.swift",
  line: 42,
  column: 15
});

// Returns (if successful - 44% success rate):
// {
//   type: "String",
//   documentation: "User's email address",
//   signature: "var email: String { get }"
// }
```

### Example 4: Safe Refactoring

```typescript
// Replace a function body safely
await swiftlens.replaceSymbolBody({
  path: "/path/to/UserManager.swift",
  symbolName: "login",
  newBody: `
    async throws -> User {
      guard let user = try await authService.login(email: email, password: password) else {
        throw AuthError.invalidCredentials
      }
      await MainActor.run {
        self.currentUser = user
      }
      return user
    }
  `
});
```

---

## When to Use SwiftLens vs This Skill

| Task | Use |
|------|-----|
| **Semantic code analysis** | SwiftLens MCP tools |
| **Find symbol references** | SwiftLens `swift_find_symbol_references` |
| **Jump to definition** | SwiftLens `swift_get_symbol_definition` |
| **Get type information** | SwiftLens `swift_get_hover_info` |
| **Validate Swift syntax** | SwiftLens `swift_validate_file` |
| **Refactor safely** | SwiftLens `swift_replace_symbol_body` |
| | |
| **Swift design patterns** | This skill's references |
| **Concurrency best practices** | references/concurrency.md |
| **Swift 6 migration** | references/swift6-features.md |
| **API design decisions** | references/api-design.md |
| **@available patterns** | references/availability-patterns.md |
| **Actor vs class choice** | This skill's guidance |
| **MainActor strategies** | This skill's examples |

**Workflow**: SwiftLens provides **analysis** (what the code is doing), this skill provides **expertise** (what the code should be doing).

---

## Known Limitations

### 1. Hover Info Success Rate (~44%)

**Problem**: `swift_get_hover_info` only succeeds ~44% of the time for expressions inside function bodies.

**Cause**: Apple SourceKit-LSP limitation (not SwiftLens's fault).

**Workaround**: Use `swift_analyze_file` for file-level symbol information instead.

### 2. Local Variable Analysis

**Problem**: Limited analysis of local variables inside functions.

**Cause**: SourceKit-LSP focuses on API-level symbols.

**Workaround**: Extract logic to functions/types for better analysis.

### 3. Background Indexing

**Problem**: Index doesn't update automatically when files change.

**Cause**: SwiftLens doesn't implement background indexing (manual rebuild required).

**Workaround**: Rebuild index after significant changes (see "When to Rebuild Index" above).

### 4. macOS Only

**Problem**: SwiftLens requires macOS with Xcode.

**Cause**: Depends on Apple's SourceKit-LSP which is macOS/Xcode-specific.

**Workaround**: None - this is a hard requirement.

---

## Troubleshooting

### MCP Server Not Found

```
Error: MCP server "swiftlens" not found
```

**Solutions**:
1. ✅ Verify SwiftLens installed: `uvx swiftlens --version`
2. ✅ Check configuration file exists: `.claude/mcps/swiftlens.json` or `~/.claude/settings.json`
3. ✅ Restart Claude Code completely
4. ✅ Check JSON syntax is valid (no trailing commas!)

### Symbol Not Found Errors

```
Error: Symbol "UserManager" not found
```

**Solutions**:
1. ✅ Build project index (see "Index Building" section)
2. ✅ Verify file path is correct (absolute paths work best)
3. ✅ Rebuild index if files changed
4. ✅ Check spelling of symbol name

### SourceKit-LSP Not Available

```
Error: SourceKit-LSP not found
```

**Solutions**:
1. ✅ Install Xcode from App Store
2. ✅ Run `xcode-select --install`
3. ✅ Verify SourceKit-LSP: `xcrun --find sourcekit-lsp`

### Hover Info Always Fails

```
Error: No hover information available
```

**This is expected**: 44% success rate means 56% failure rate.

**Workarounds**:
1. ✅ Use `swift_analyze_file` for file-level symbols
2. ✅ Use `swift_get_symbol_definition` to find where symbol is defined
3. ✅ Extract local variables to type properties for better analysis

---

## Complementary Workflows

### Workflow 1: Refactor to Swift 6 Concurrency

**Scenario**: Refactor `UserManager` to use Swift 6 concurrency with proper actor isolation.

**Step 1** - Analyze existing code (SwiftLens):
```
Ask Claude: "Use SwiftLens to analyze UserManager.swift and show me all public methods"
```

**Step 2** - Review patterns (This Skill):
```
Ask Claude: "Based on the analysis, should UserManager be an actor or @MainActor class?"
→ Claude loads references/concurrency.md and provides guidance
```

**Step 3** - Find all usages (SwiftLens):
```
Ask Claude: "Find all references to UserManager.login in the project"
→ Claude uses swift_find_symbol_references
```

**Step 4** - Apply refactoring (This Skill + SwiftLens):
```
Claude:
1. Uses skill's actor pattern template
2. Uses SwiftLens to safely replace method bodies
3. Adds await keywords at all call sites
```

### Workflow 2: Swift 6 Migration Audit

**Scenario**: Audit codebase for Swift 6 compatibility issues.

**Step 1** - Get diagnostics (SwiftLens):
```
Ask Claude: "Run Swift 6 compiler checks on all files in src/"
→ Uses swift_validate_file with Swift 6 mode
```

**Step 2** - Categorize issues (This Skill):
```
Claude loads references/swift6-features.md and categorizes:
- Sendable conformance issues
- @MainActor isolation warnings
- Global actor changes
```

**Step 3** - Fix patterns (This Skill + SwiftLens):
```
Claude applies migration strategies from skill while using SwiftLens
to find all affected call sites
```

---

## Comparison: Claude Code vs Claude Desktop

SwiftLens MCP configuration is **different** between Claude Code and Claude Desktop!

### Claude Code (CLI) Configuration

**Location**: `.claude/mcps/swiftlens.json` (project) OR `~/.claude/settings.json` (global)

```json
{
  "mcpServers": {
    "swiftlens": {
      "description": "Swift semantic analysis via SourceKit-LSP",
      "command": "uvx",
      "args": ["swiftlens"]
    }
  }
}
```

**Key Features**:
- ✅ **description** field required
- ✅ Project-specific `.claude/mcps/` directory
- ✅ Can be committed to git
- ✅ Team members get same setup

### Claude Desktop (GUI) Configuration

**Location**: `~/.config/claude/claude_desktop_config.json` (Mac/Linux) OR `%APPDATA%/Claude/claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "swiftlens": {
      "command": "uvx",
      "args": ["swiftlens"]
    }
  }
}
```

**Key Differences**:
- ❌ No `description` field
- ❌ Global only (no project-specific)
- ❌ Different file location
- ❌ Must restart Claude Desktop app to reload

---

## Additional Resources

### SwiftLens Official

- Website: https://swiftlens.tools/
- GitHub: https://github.com/swiftlens/swiftlens
- Documentation: https://github.com/swiftlens/swiftlens#readme

### Apple SourceKit-LSP

- Swift.org LSP: https://github.com/apple/sourcekit-lsp
- Language Server Protocol: https://microsoft.github.io/language-server-protocol/

### Related Skills

- **swift-best-practices** (this skill) - Swift 6+ patterns and best practices
- **typescript-mcp** - Building MCP servers with TypeScript
- **fastmcp** - Building MCP servers with Python

---

## Summary

✅ **Installation**: `uvx swiftlens`
✅ **Configuration**: Create `.claude/mcps/swiftlens.json`
✅ **15 Tools**: Single-file, cross-file, and modification tools
✅ **Index Required**: For cross-file analysis (manual rebuild)
✅ **Limitations**: 44% hover success, local variable constraints
✅ **Use Case**: Semantic analysis + this skill's expertise = complete Swift development

**Remember**: SwiftLens = runtime analysis, This skill = design patterns!
