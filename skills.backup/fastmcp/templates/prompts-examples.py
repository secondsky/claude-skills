"""
FastMCP Prompts Examples
=========================
Examples of pre-configured prompts for LLMs.
"""

from fastmcp import FastMCP
from datetime import datetime

mcp = FastMCP("Prompts Examples")

# ============================================================================
# Basic Prompts
# ============================================================================

@mcp.prompt("help")
def help_prompt() -> str:
    """Generate help text for the server."""
    return """
Welcome to the FastMCP Prompts Examples Server!

This server demonstrates various prompt patterns for LLM interactions.

Available Tools:
- search: Search for items in the database
- analyze: Analyze data and generate insights
- summarize: Create summaries of text content

Available Resources:
- info://status: Current server status
- data://config: Server configuration
- data://users: List of all users

How to Use:
1. Use the search tool to find items
2. Use the analyze tool to generate insights from data
3. Use the summarize tool to create concise summaries

For specific tasks, use the pre-configured prompts:
- /analyze: Analyze a topic in depth
- /report: Generate a comprehensive report
- /review: Review and provide feedback
"""


@mcp.prompt("analyze")
def analyze_prompt(topic: str) -> str:
    """Generate a prompt for analyzing a topic."""
    return f"""
Please analyze the following topic: {topic}

Consider the following aspects:
1. Current State: What is the current situation?
2. Challenges: What are the main challenges or issues?
3. Opportunities: What opportunities exist for improvement?
4. Data Points: What data supports your analysis?
5. Recommendations: What specific actions do you recommend?

Use the available tools to:
- Search for relevant data using the search tool
- Gather statistics and metrics
- Review related information

Provide a structured analysis with:
- Executive Summary
- Detailed Findings
- Data-Driven Insights
- Actionable Recommendations
"""


# ============================================================================
# Prompts with Parameters
# ============================================================================

@mcp.prompt("report")
def report_prompt(
    subject: str,
    timeframe: str = "last month",
    detail_level: str = "summary"
) -> str:
    """Generate a report prompt with parameters."""
    return f"""
Generate a comprehensive report on: {subject}

Timeframe: {timeframe}
Detail Level: {detail_level}

Report Structure:
1. Executive Summary
   - Key findings
   - Critical metrics
   - Main recommendations

2. Data Analysis
   - Quantitative metrics
   - Trend analysis
   - Comparative analysis

3. Insights
   - Patterns discovered
   - Anomalies identified
   - Correlations found

4. Recommendations
   - Short-term actions
   - Long-term strategies
   - Resource requirements

Please use the available tools to gather:
- Statistical data
- User information
- System metrics
- Historical trends

Format: {detail_level.upper()}
- "summary": High-level overview with key points
- "detailed": In-depth analysis with supporting data
- "comprehensive": Full analysis with all available data points
"""


@mcp.prompt("review")
def review_prompt(
    item_type: str,
    item_id: str,
    focus_areas: str = "all"
) -> str:
    """Generate a review prompt."""
    return f"""
Review the {item_type} (ID: {item_id})

Focus Areas: {focus_areas}

Review Criteria:
1. Quality Assessment
   - Overall quality rating
   - Strengths identified
   - Areas for improvement

2. Completeness
   - Required elements present
   - Missing components
   - Suggestions for additions

3. Consistency
   - Internal consistency
   - Alignment with standards
   - Conformance to guidelines

4. Performance
   - Efficiency metrics
   - Resource utilization
   - Optimization opportunities

5. Recommendations
   - Priority improvements
   - Nice-to-have enhancements
   - Long-term considerations

Please gather relevant data using available tools and provide a structured review.
"""


# ============================================================================
# Task-Specific Prompts
# ============================================================================

@mcp.prompt("summarize")
def summarize_prompt(content_type: str = "text") -> str:
    """Generate a summarization prompt."""
    return f"""
Create a comprehensive summary of the {content_type}.

Summary Guidelines:
1. Key Points
   - Extract the most important information
   - Identify main themes or topics
   - Highlight critical details

2. Structure
   - Opening: Context and overview
   - Body: Main points organized logically
   - Closing: Conclusions and implications

3. Audience Consideration
   - Write for clarity and understanding
   - Define technical terms if needed
   - Provide context where necessary

4. Length
   - Brief: 2-3 sentences
   - Standard: 1 paragraph
   - Detailed: 2-3 paragraphs

Output Format:
- Start with a one-sentence overview
- Follow with detailed points
- End with key takeaways

Use available tools to gather additional context if needed.
"""


@mcp.prompt("compare")
def compare_prompt(item1: str, item2: str, criteria: str = "general") -> str:
    """Generate a comparison prompt."""
    return f"""
Compare and contrast: {item1} vs {item2}

Comparison Criteria: {criteria}

Analysis Framework:
1. Similarities
   - Common features
   - Shared characteristics
   - Aligned goals or purposes

2. Differences
   - Unique features
   - Distinct characteristics
   - Divergent approaches

3. Strengths and Weaknesses
   - {item1} strengths
   - {item1} weaknesses
   - {item2} strengths
   - {item2} weaknesses

4. Use Cases
   - When to choose {item1}
   - When to choose {item2}
   - Situational recommendations

5. Conclusion
   - Overall assessment
   - Best fit scenarios
   - Decision factors

Please gather data using available tools and provide a balanced comparison.
"""


# ============================================================================
# Workflow Prompts
# ============================================================================

@mcp.prompt("troubleshoot")
def troubleshoot_prompt(problem_description: str) -> str:
    """Generate a troubleshooting prompt."""
    return f"""
Troubleshoot the following issue:

Problem: {problem_description}

Troubleshooting Process:
1. Problem Definition
   - Describe the issue clearly
   - Identify symptoms
   - Note when it started

2. Information Gathering
   - Use available tools to gather:
     * System status
     * Error logs
     * Configuration details
     * Recent changes

3. Analysis
   - Identify potential causes
   - Determine root cause
   - Assess impact

4. Solution Development
   - Propose solutions (short-term and long-term)
   - Evaluate each solution
   - Recommend best approach

5. Implementation Plan
   - Step-by-step resolution
   - Required resources
   - Expected timeline
   - Verification steps

6. Prevention
   - Preventive measures
   - Monitoring recommendations
   - Documentation needs

Please be systematic and thorough in your analysis.
"""


@mcp.prompt("plan")
def plan_prompt(objective: str, constraints: str = "none") -> str:
    """Generate a planning prompt."""
    return f"""
Create a detailed plan for: {objective}

Constraints: {constraints}

Planning Framework:
1. Objective Analysis
   - Clear definition of success
   - Key success criteria
   - Expected outcomes

2. Current State Assessment
   - Available resources
   - Existing capabilities
   - Known limitations

3. Strategy Development
   - Approach options
   - Recommended strategy
   - Rationale

4. Action Plan
   - Phase 1: Foundation
   - Phase 2: Implementation
   - Phase 3: Optimization

5. Resource Requirements
   - Personnel
   - Technology
   - Budget
   - Time

6. Risk Management
   - Identified risks
   - Mitigation strategies
   - Contingency plans

7. Success Metrics
   - KPIs to track
   - Measurement methods
   - Review milestones

Use available tools to gather supporting data and insights.
"""


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    mcp.run()
