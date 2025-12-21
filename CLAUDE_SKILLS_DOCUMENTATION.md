# Claude Agent Skills: Complete Documentation & Best Practices

## Table of Contents

1. [Overview](#overview)
2. [What Are Agent Skills?](#what-are-agent-skills)
3. [Quick Start Guide](#quick-start-guide)
4. [How Skills Work](#how-skills-work)
5. [Available Skills](#available-skills)
6. [API Integration](#api-integration)
7. [Creating Custom Skills](#creating-custom-skills)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
11. [Advanced Topics](#advanced-topics)
12. [Testing & Evaluation](#testing--evaluation)

---

## Overview

Agent Skills are modular capabilities that extend Claude's functionality through organized folders of instructions, scripts, and resources. They enable specialization for domain-specific tasks while maintaining reusability and composability across multiple workflows.

### Key Benefits

- **Specialization**: Tailor Claude for domain-specific tasks rather than remaining general-purpose
- **Reusability**: Eliminate the need to repeatedly provide the same guidance across multiple conversations
- **Composability**: Combine multiple Skills to build complex workflows
- **Progressive Disclosure**: Claude loads only relevant content, minimizing context consumption

---

## What Are Agent Skills?

Agent Skills package instructions, metadata, and optional resources that Claude automatically uses when relevant to user requests. They integrate with the Messages API via the code execution tool and come from two sources:

1. **Anthropic-managed pre-built Skills**: pptx, xlsx, docx, pdf
2. **Custom Skills**: User-created filesystem-based Skills with SKILL.md files

### Three-Level Loading System

Skills operate through a progressive disclosure approach that minimizes context consumption:

1. **Metadata (always loaded)**: YAML frontmatter with name and description (~100 tokens)
2. **Instructions (triggered)**: Main SKILL.md content providing procedural guidance (<5k tokens)
3. **Resources (as needed)**: Referenced files, scripts, and templates loaded only when accessed

This means Claude reads only relevant content, leaving bundled materials on the filesystem until needed.

---

## Quick Start Guide

### Prerequisites

To get started, you need:
- An Anthropic API key from the Console
- Python 3.7+ or curl
- Beta headers: `code-execution-2025-08-25`, `skills-2025-10-02`, `files-api-2025-04-14`
- Code execution tool enabled in requests

### Step 1: List Available Skills

Query the Skills API to discover what's accessible:

```python
import anthropic

client = anthropic.Anthropic()

skills = client.beta.skills.list(
    source="anthropic",
    betas=["skills-2025-10-02"]
)

for skill in skills.data:
    print(f"{skill.id}: {skill.display_title}")
```

### Step 2: Create Documents

Specify Skills using the `container` parameter in the Messages API:

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {
                "type": "anthropic",
                "skill_id": "pptx",
                "version": "latest"
            }
        ]
    },
    messages=[
        {
            "role": "user",
            "content": "Create a presentation about renewable energy"
        }
    ],
    tools=[
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        }
    ]
)
```

### Step 3: Retrieve Generated Files

Extract the file ID from the response and download using the Files API:

```python
file_id = None
for block in response.content:
    if block.type == 'tool_use':
        for result in block.content:
            if hasattr(result, 'file_id'):
                file_id = result.file_id

if file_id:
    file_content = client.beta.files.download(
        file_id=file_id,
        betas=["files-api-2025-04-14"]
    )
    with open("output.pptx", "wb") as f:
        file_content.write_to_file(f.name)
```

---

## How Skills Work

### Container Parameter

Skills are specified using the **container parameter**, supporting up to 8 Skills per request. Both pre-built and custom Skills use identical integration patterns:

- `type`: "anthropic" or "custom"
- `skill_id`: Short names for Anthropic Skills or generated IDs for custom ones
- `version`: Date-based (20251013) or timestamp-based, with "latest" option

### Progressive Disclosure

Claude automatically loads and uses relevant Skills when needed for your request. This "discover then load" approach means:
- Skills are present without consuming context initially
- Only relevant instructions are loaded when triggered
- Bundled resources remain on filesystem until accessed

**⚠️ System Prompt Budget Limits**

Claude Code includes skill metadata (name + description) in the system prompt, but this has size constraints:
- **Default budget**: 15,000 characters (~4,000 tokens) for all skill descriptions combined
- **When exceeded**: Skills are silently omitted from the system prompt without warnings
- **Impact**: Omitted skills become completely invisible and unusable by Claude
- **Claude Code version**: Issue documented in v2.0.70

**Mitigation Strategies:**
1. **Immediate workaround**: Set environment variable before launching Claude Code:
   ```bash
   SLASH_COMMAND_TOOL_CHAR_BUDGET=30000 claude
   ```
2. **Long-term solution**: Keep skill descriptions concise (under 100 characters ideal)
3. **Future improvements**: Superpowers 4.0 will combine infrequently used skills and optimize descriptions

Source: [Claude Code Skills Not Triggering](https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/)

### Multi-Turn Conversations

Reuse containers across messages by specifying `container.id` rather than recreating the container, maintaining state across turns.

### Long-Running Operations

Handle `pause_turn` stop reasons for extended operations. Provide the response back in subsequent requests to allow Claude to continue.

---

## Available Skills

### Pre-Built Anthropic Skills

Anthropic provides four primary pre-built Skills that work across Claude API and claude.ai:

- **PowerPoint (pptx)**: Create and edit presentations
- **Excel (xlsx)**: Create and analyze spreadsheets
- **Word (docx)**: Create and edit documents
- **PDF (pdf)**: Generate PDF documents

To use different Skills, simply change the `skill_id` parameter to `pptx`, `xlsx`, `docx`, or `pdf`.

### Custom Skills

Users can create filesystem-based Skills with SKILL.md files for specialized workflows. Custom Skills allow you to package domain-specific instructions and resources.

---

## API Integration

### Key Operations

#### Using Skills in Messages

The container parameter specifies which Skills are available. Claude automatically loads and uses relevant Skills when needed for your request.

#### Downloading Generated Files

When Skills create documents, they return file_id attributes. Use the Files API to download actual file content via `client.beta.files.download()`.

#### Combining Multiple Skills

Use multiple Skills together for complex workflows (e.g., data analysis with Excel + presentation with PowerPoint), but avoid including unused Skills to maintain performance.

### Managing Custom Skills

#### Creating Skills

Upload directories containing SKILL.md plus supporting files (max 8MB total). YAML frontmatter requires:
- `name`: 64 characters max, lowercase/hyphens/numbers only
- `description`: 1024 characters max, non-empty

#### Listing, Retrieving, Deleting

Use API endpoints to manage custom Skills. Deletion requires removing all versions first.

#### Versioning Strategy

- **Production deployments**: Pin specific versions for stability
- **Development**: Use "latest" for active updates

### Error Handling

Implement try-catch blocks to gracefully handle skill-specific errors like invalid IDs or version mismatches.

### Prompt Caching

**Important**: Changing the Skills list breaks cache. Keep Skills consistent across cached requests.

### Constraints

- Maximum 8 Skills per request
- 8MB upload size limit
- No network access in execution environment
- No runtime package installation (pre-installed packages only)

---

## Creating Custom Skills

For detailed project-specific guidelines on creating skills, refer to [claude-code-skill-standards.md](planning/claude-code-skill-standards.md).

### Key Requirement

All Skills require a SKILL.md file with YAML frontmatter including:
- `name`: lowercase, max 64 characters
- `description`: non-empty, max 1024 characters

### File Structure

```
my-skill/
├── SKILL.md           # Main instructions with YAML frontmatter
├── scripts/           # Supporting scripts
│   └── helper.py
├── templates/         # Templates and examples
│   └── template.json
└── docs/             # Additional documentation
    └── advanced.md
```

### SKILL.md Format

```markdown
---
name: processing-excel-files
description: Processes and analyzes Excel spreadsheets with advanced formatting and data validation
---

# Excel Processing Skill

## Overview
This Skill helps with Excel file operations...

## When to Use
Use this Skill when the user asks to:
- Create spreadsheets with complex formulas
- Analyze data in Excel format
- Generate reports from tabular data

## Instructions
1. First step...
2. Second step...
3. Reference additional files as needed: see `docs/advanced.md`
```

---

## Best Practices

For project-specific best practices and standards, see:
- [claude-code-skill-standards.md](planning/claude-code-skill-standards.md) - Official compliance standards
- [COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) - Common pitfalls to avoid

### Core Principles

#### 1. Conciseness is Critical

The context window is shared across system prompts, conversation history, and other Skills. Write SKILL.md under 500 lines, assuming Claude already possesses general knowledge.

**Challenge each piece of information**: Does Claude truly need this explanation?

**⚠️ CRITICAL - Description Length Impacts Skill Discovery**

Skill descriptions must be extremely concise because:
- Claude Code has a **15,000 character budget** for all skill descriptions in the system prompt
- When exceeded, skills are **silently omitted** without any warnings
- If Claude doesn't see your skill in the system prompt, it cannot use it
- With many skills installed, every character counts

**Best practices for descriptions:**
- Keep under 100 characters when possible (ideal)
- Maximum 200 characters for complex skills
- Focus on triggers and use cases, not implementation details
- Use third-person, active voice
- Omit articles ("the", "a") where possible to save characters

**Example optimization:**
```yaml
# ❌ Too verbose (143 chars)
description: This skill helps you process and analyze Excel spreadsheets with advanced formatting and data validation capabilities for business reports

# ✅ Concise (87 chars)
description: Processes Excel files with formatting and validation. Use for business reports.
```

#### 2. Appropriate Degrees of Freedom

Match specificity to task fragility:
- **High-freedom text instructions**: Suit flexible decisions
- **Low-freedom specific scripts**: Handle error-prone operations

Think of it like guiding a robot across different terrains—narrow bridges require exact instructions, open fields allow flexible navigation.

#### 3. Multi-Model Testing

Test Skills with Claude Haiku, Sonnet, and Opus since effectiveness depends on the underlying model. Instructions that work for Opus may need more detail for Haiku.

### Metadata Requirements

#### Naming Conventions

Use gerund form (verb + -ing):
- ✅ `processing-pdfs`
- ✅ `analyzing-spreadsheets`
- ❌ `pdf-processor`
- ❌ `spreadsheet-tool`

This clearly describes the capability.

#### Effective Descriptions

- Write in third person: "Processes Excel files" (not "I can help you")
- Include both what the Skill does and specific triggers for when to use it
- **Keep extremely concise** (under 100 chars ideal, under 200 chars max)
- Maximum 1024 characters allowed, but much shorter recommended for discovery
- Non-empty required

**Example (optimized for discovery)**:
```yaml
---
name: analyzing-financial-data
description: Analyzes financial statements, calculates ratios. Use for balance sheets, income statements.
---
```

**Why conciseness matters**: Due to system prompt budget limits (15,000 chars for all skills), verbose descriptions can cause your skill to be silently omitted from Claude's available skills list, making it completely unusable.

### Progressive Disclosure Patterns

#### File Organization

Keep SKILL.md as the table of contents pointing to detailed materials. Bundle additional files Claude loads only when needed:

**Pattern 1: High-level guide with references to specialized files**
```markdown
# Main Skill
Basic instructions here...

For advanced scenarios, see `docs/advanced.md`
For troubleshooting, see `docs/troubleshooting.md`
```

**Pattern 2: Domain-specific organization**
```
skill/
├── SKILL.md
├── finance.md
├── sales.md
└── product.md
```

**Pattern 3: Conditional details**
```markdown
# Basic Usage
Standard instructions...

## Advanced Features
For complex cases, see `advanced/complex-workflows.md`
```

#### Reference File Structure

- Maintain one-level-deep references from SKILL.md to avoid partial file reads
- Include table of contents in files exceeding 100 lines
- No references within references (nested references)

### Content Guidelines

#### Avoid Time-Sensitive Information

Don't reference specific dates ("Before August 2025, use..."). Instead, use "Old patterns" sections with deprecation details.

**Instead of**:
```markdown
Before August 2025, use the old API endpoint.
```

**Use**:
```markdown
## Old Patterns (Deprecated)
The legacy API endpoint is no longer recommended. Use the new endpoint instead.
```

#### Consistent Terminology

Choose one term and use it throughout. Mixing "API endpoint," "URL," and "route" confuses Claude.

**Consistency matters**:
- ✅ Always use "API endpoint"
- ❌ Mixing "API endpoint," "URL," "route," "web service"

---

## Common Patterns

### Template Pattern

Provide strict templates for critical output formats; offer flexible defaults for tasks where adaptation is useful.

```markdown
## Output Format

For financial reports, use this exact structure:
\`\`\`json
{
  "company": "string",
  "period": "YYYY-MM-DD",
  "metrics": {
    "revenue": number,
    "profit": number
  }
}
\`\`\`

For general summaries, adapt the format to the specific needs.
```

### Examples Pattern

Include concrete input/output pairs showing desired style and detail levels, not abstract descriptions.

```markdown
## Example

**Input**: "Analyze Q3 2024 revenue data"

**Output**:
- Total Revenue: $1.2M
- Growth Rate: 15% YoY
- Top Products: Widget A (45%), Widget B (30%), Widget C (25%)
- Recommendation: Increase Widget A production capacity
```

### Conditional Workflows

Guide Claude through decision points:

```markdown
## Workflow Decision Tree

**Creating new content?**
1. Check template requirements
2. Validate input data
3. Generate from template

**Editing existing content?**
1. Load existing file
2. Parse current structure
3. Apply modifications
4. Validate changes
```

### Workflows and Feedback Loops

#### Complex Task Workflows

Break operations into clear sequential steps. Provide checklists Claude can copy and check off:

```markdown
## Processing Checklist

- [ ] Validate input file format
- [ ] Parse data structure
- [ ] Apply transformations
- [ ] Generate output file
- [ ] Verify output integrity
```

#### Feedback Loops

Implement "plan-validate-execute" patterns where Claude creates structured output, validates against a script, then executes only after verification passes.

```markdown
## Validation Workflow

1. Generate proposed changes in `changes.json`
2. Run validation script: `python scripts/validate.py changes.json`
3. If validation passes, execute changes
4. If validation fails, review errors and regenerate
```

This catches errors early for batch operations and destructive changes.

---

## Anti-Patterns to Avoid

For a comprehensive list of common mistakes specific to this project, see [COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md).

### Common Mistakes

❌ **Windows-style paths**
```markdown
# Bad
scripts\helper.py
```
✅ Use forward slashes:
```markdown
# Good
scripts/helper.py
```

❌ **Too many options without a default**
```markdown
# Bad
Choose processing mode: standard, advanced, expert, custom, legacy, experimental
```
✅ Provide a clear default:
```markdown
# Good
Processing mode (default: standard):
- standard: For most use cases
- advanced: For complex scenarios (see docs/advanced.md)
```

❌ **Deeply nested file references**
```markdown
# Bad in SKILL.md
See advanced.md
# Then in advanced.md
See expert.md
# Then in expert.md
See specialized.md
```
✅ One-level-deep references only:
```markdown
# Good in SKILL.md
For basic usage, see basics.md
For advanced usage, see advanced.md
For expert usage, see expert.md
```

❌ **Vague naming**
```markdown
helper.py
utils.py
tools.md
misc/
```
✅ Descriptive naming:
```markdown
validation_helper.py
data_transformation_utils.py
troubleshooting_guide.md
template_examples/
```

❌ **Time-sensitive content without deprecation sections**
```markdown
# Bad
Use version 2.0 API endpoints (valid until December 2024)
```
✅ Use deprecation sections:
```markdown
# Good
## Current Approach
Use version 2.0 API endpoints

## Deprecated Patterns
Version 1.0 endpoints are no longer supported. Migrate using the guide in docs/migration.md
```

❌ **First-person descriptions**
```markdown
# Bad
name: my-excel-tool
description: I can help you process Excel files and create reports
```
✅ Third-person descriptions:
```markdown
# Good
name: processing-excel-files
description: Processes Excel files, creates reports with validation
```

❌ **Verbose descriptions that exceed system prompt budget**
```markdown
# Bad (143 chars - wastes system prompt budget)
description: This skill provides comprehensive capabilities for processing and analyzing Excel spreadsheets with advanced formatting and validation
```
✅ Concise descriptions under 100 characters:
```markdown
# Good (68 chars - maximizes skill discovery)
description: Processes Excel files with formatting and validation
```

---

## Advanced Topics

### Executable Code

#### Solve, Don't Punt

Handle error conditions in scripts explicitly rather than deferring to Claude.

```python
# Good: Handle errors explicitly
def process_file(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    if os.path.getsize(filepath) > MAX_SIZE:
        raise ValueError(f"File exceeds maximum size of {MAX_SIZE} bytes")

    # Process file...
```

#### Document Configuration Parameters

Document all configuration parameters with justifications:

```python
# Good: Explain magic numbers
TIMEOUT_SECONDS = 30  # API calls timeout after 30s per service SLA
MAX_RETRIES = 3       # Balance between reliability and response time
BATCH_SIZE = 100      # Optimal size for memory/performance trade-off

# Bad: Magic numbers without explanation
TIMEOUT_SECONDS = 30
MAX_RETRIES = 3
BATCH_SIZE = 100
```

#### Utility Scripts

Pre-made scripts prove more reliable than generated code, save tokens, and ensure consistency. Clarify whether Claude should execute or read scripts as reference.

```markdown
## Available Utilities

Execute these scripts directly:
- `scripts/validate_data.py` - Validates input data format
- `scripts/transform.py` - Applies standard transformations

Reference these for guidance only:
- `examples/sample_workflow.py` - Example implementation pattern
```

#### Intermediate Validation

For complex operations like batch PDF updates, use intermediate files validated by scripts before executing changes:

```markdown
## Batch Processing Workflow

1. Generate change plan: `changes.json`
2. Validate plan: `python scripts/validate_changes.py changes.json`
3. Review validation output
4. If valid, execute: `python scripts/apply_changes.py changes.json`
```

#### No Assumed Tools

Explicitly list required packages; verify availability in code execution documentation.

```markdown
## Required Packages

This Skill requires the following Python packages (all pre-installed):
- pandas >= 1.5.0
- openpyxl >= 3.0.0
- numpy >= 1.24.0

Note: These packages are available in the code execution environment. Do not attempt to install additional packages.
```

### Combining Multiple Skills

Use multiple Skills together for complex workflows, but avoid including unused Skills to maintain performance.

```python
# Good: Use only needed Skills
container={
    "skills": [
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pptx", "version": "latest"}
    ]
}

# Bad: Including unnecessary Skills
container={
    "skills": [
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pptx", "version": "latest"},
        {"type": "anthropic", "skill_id": "docx", "version": "latest"},  # Not needed
        {"type": "anthropic", "skill_id": "pdf", "version": "latest"}    # Not needed
    ]
}
```

---

## Testing & Evaluation

### Build Evaluations First

Create test scenarios before extensive documentation. Establish baseline performance without the Skill, then write minimal instructions addressing identified gaps.

**Process**:
1. Define test scenarios
2. Test Claude without the Skill (baseline)
3. Identify gaps and failures
4. Write minimal instructions to address gaps
5. Test with the Skill
6. Iterate until performance meets requirements

### Iterative Development

Work with one Claude instance to refine the Skill while testing with another instance. Observe real usage patterns and bring specific observations back to refinement.

**"Observe-Refine-Test" cycle**:
1. Deploy Skill to test environment
2. Observe real usage patterns
3. Note specific issues or improvements
4. Refine Skill instructions/resources
5. Test refined version
6. Repeat

This improves Skills based on actual behavior rather than assumptions.

### Testing Checklist

#### Quality Checks
- [ ] Specific descriptions including key terms and usage triggers
- [ ] SKILL.md under 500 lines
- [ ] One-level-deep references only
- [ ] Clear workflows with decision points
- [ ] Consistent terminology throughout
- [ ] No time-sensitive content (or proper deprecation sections)

#### Code Checks
- [ ] Error handling implemented
- [ ] Configuration parameters documented and justified
- [ ] All dependencies listed and verified
- [ ] Validation for critical operations
- [ ] Scripts have clear execute vs. reference designation

#### Testing Requirements
- [ ] Three or more test evaluations created
- [ ] Tested across Haiku, Sonnet, and Opus
- [ ] Real usage scenarios validated
- [ ] Team feedback incorporated
- [ ] Baseline vs. Skill performance compared

### Multi-Model Testing

Test Skills with all three model tiers:

- **Claude Opus**: May understand terse instructions
- **Claude Sonnet**: Balanced performance/cost
- **Claude Haiku**: May need more detailed instructions

Instructions that work for Opus may need more detail for Haiku.

---

## Summary

### Key Takeaways

1. **Keep it concise**: SKILL.md under 500 lines, assume Claude's knowledge
2. **Progressive disclosure**: Use three-level loading (metadata → instructions → resources)
3. **Test thoroughly**: Create evaluations first, test across models
4. **Organize logically**: One-level-deep references, clear file structure
5. **Document explicitly**: No magic numbers, list all dependencies
6. **Iterate based on observation**: Real usage patterns drive improvements
7. **Match specificity to fragility**: High-freedom for flexible tasks, low-freedom for error-prone operations
8. **Validate early**: Use intermediate validation for complex operations
9. **Be consistent**: Use same terminology throughout
10. **Avoid anti-patterns**: Forward slashes, descriptive names, no nested references

### Next Steps

1. Review the [Agent Skills Cookbook](https://github.com/anthropics/anthropic-cookbook) for custom Skill examples
2. Integrate Skills into the Agent SDK for advanced implementations
3. Start with simple Skills and iterate based on real usage
4. Build evaluations to measure Skill effectiveness
5. Share your Skills with the community

---

## Additional Resources

### Project-Specific Resources
- [claude-code-skill-standards.md](planning/claude-code-skill-standards.md) - Project standards and compliance requirements
- [COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) - Common mistakes and how to avoid them
- [STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md) - Comparison with official Anthropic standards

### External Resources
- [Anthropic Console](https://console.anthropic.com/) - Get your API key
- [Claude API Documentation](https://docs.anthropic.com/) - Full API reference
- [Agent Skills Cookbook](https://github.com/anthropics/anthropic-cookbook) - Example implementations
- [Community Discord](https://discord.gg/anthropic) - Get help and share Skills

---

*Last Updated: Generated from official Anthropic documentation*
*Documentation Sources: platform.claude.com/docs/en/agents-and-tools/agent-skills/*
