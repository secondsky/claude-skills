/**
 * MCP Server with OAuth Proxy (GitHub Example)
 *
 * Uses Cloudflare's workers-oauth-provider to proxy OAuth to GitHub.
 * This pattern lets you integrate with GitHub, Google, Azure, etc.
 *
 * Perfect for: Authenticated API access, user-scoped tools
 *
 * Based on: https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-github-oauth
 *
 * ⚠️ CRITICAL OAuth URL CONFIGURATION:
 *
 * ALL OAuth URLs must use the SAME domain and protocol!
 *
 * Client configuration after deployment:
 * {
 *   "mcpServers": {
 *     "github-mcp": {
 *       "url": "https://YOUR-WORKER.workers.dev/sse",
 *       "auth": {
 *         "type": "oauth",
 *         "authorizationUrl": "https://YOUR-WORKER.workers.dev/authorize",
 *         "tokenUrl": "https://YOUR-WORKER.workers.dev/token"
 *       }
 *     }
 *   }
 * }
 *
 * Common mistakes:
 * ❌ Mixed protocols: http://... and https://...
 * ❌ Missing /sse in main URL
 * ❌ Wrong domain after deployment (still using localhost)
 * ❌ Typos in endpoint paths (/authorize vs /auth)
 *
 * Post-deployment checklist:
 * 1. Deploy: npx wrangler deploy
 * 2. Note deployed URL
 * 3. Update ALL three URLs in client config
 * 4. Test OAuth flow in Claude Desktop
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider, GitHubHandler } from "@cloudflare/workers-oauth-provider";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

type Env = {
  OAUTH_KV: KVNamespace; // Required for OAuth token storage
  GITHUB_CLIENT_ID?: string; // Optional: pre-register client
  GITHUB_CLIENT_SECRET?: string; // Optional: pre-register client
};

/**
 * Props passed to MCP server after OAuth authentication
 * Contains user info and access token
 */
type Props = {
  login: string; // GitHub username
  name: string; // User's display name
  email: string; // User's email
  accessToken: string; // GitHub API access token
};

/**
 * Allowlist for sensitive operations (optional)
 * Replace with your GitHub usernames
 */
const ALLOWED_USERNAMES = new Set(["your-github-username"]);

/**
 * MyMCP extends McpAgent with OAuth-authenticated context
 */
export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "GitHub MCP Server",
    version: "1.0.0",
  });

  /**
   * Initialize tools with authenticated context
   * this.props contains user info and accessToken
   */
  async init() {
    // Create Octokit client with user's access token
    const octokit = new Octokit({
      auth: this.props!.accessToken,
    });

    // Tool: List user's repositories
    this.server.tool(
      "list_repos",
      "List GitHub repositories for the authenticated user",
      {
        visibility: z
          .enum(["all", "public", "private"])
          .default("all")
          .describe("Filter by repository visibility"),
        sort: z
          .enum(["created", "updated", "pushed", "full_name"])
          .default("updated")
          .describe("Sort order"),
        per_page: z.number().min(1).max(100).default(30).describe("Results per page"),
      },
      async ({ visibility, sort, per_page }) => {
        try {
          const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            visibility,
            sort,
            per_page,
          });

          const repoList = repos
            .map(
              (repo) =>
                `- ${repo.full_name} (${repo.visibility}) - ${repo.description || "No description"}`
            )
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `Found ${repos.length} repositories:\n\n${repoList}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching repositories: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Get repository details
    this.server.tool(
      "get_repo",
      "Get detailed information about a GitHub repository",
      {
        owner: z.string().describe("Repository owner (username or org)"),
        repo: z.string().describe("Repository name"),
      },
      async ({ owner, repo }) => {
        try {
          const { data: repository } = await octokit.rest.repos.get({
            owner,
            repo,
          });

          return {
            content: [
              {
                type: "text",
                text: `# ${repository.full_name}

${repository.description || "No description"}

**Stars**: ${repository.stargazers_count}
**Forks**: ${repository.forks_count}
**Open Issues**: ${repository.open_issues_count}
**Language**: ${repository.language || "Not specified"}
**License**: ${repository.license?.name || "None"}
**Homepage**: ${repository.homepage || "None"}
**Created**: ${repository.created_at}
**Updated**: ${repository.updated_at}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching repository: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Create GitHub issue (requires write permissions)
    this.server.tool(
      "create_issue",
      "Create a new issue in a GitHub repository",
      {
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
        title: z.string().describe("Issue title"),
        body: z.string().optional().describe("Issue description"),
        labels: z.array(z.string()).optional().describe("Issue labels"),
      },
      async ({ owner, repo, title, body, labels }) => {
        try {
          const { data: issue } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
          });

          return {
            content: [
              {
                type: "text",
                text: `Created issue #${issue.number}: ${issue.title}\n\nURL: ${issue.html_url}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating issue: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Optional: Allowlist-protected tool
    // Only registers if user is in ALLOWED_USERNAMES
    if (ALLOWED_USERNAMES.has(this.props!.login)) {
      this.server.tool(
        "delete_repo",
        "Delete a repository (DANGEROUS - restricted to allowlisted users)",
        {
          owner: z.string().describe("Repository owner"),
          repo: z.string().describe("Repository name"),
        },
        async ({ owner, repo }) => {
          try {
            await octokit.rest.repos.delete({ owner, repo });
            return {
              content: [
                {
                  type: "text",
                  text: `Successfully deleted repository ${owner}/${repo}`,
                },
              ],
            };
          } catch (error: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error deleting repository: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }
      );
    }
  }
}

/**
 * OAuth Provider configuration
 * Handles GitHub OAuth flow and token management
 */
export default new OAuthProvider({
  /**
   * OAuth endpoints
   */
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",

  /**
   * GitHub OAuth handler
   * Automatically handles OAuth flow with GitHub
   */
  defaultHandler: new GitHubHandler({
    // Optional: Pre-configure client credentials
    // If not set, uses Dynamic Client Registration
    clientId: (env: Env) => env.GITHUB_CLIENT_ID,
    clientSecret: (env: Env) => env.GITHUB_CLIENT_SECRET,

    // Scopes: What permissions to request
    scopes: ["repo", "user:email", "read:org"],

    // Context: Extract user info to pass to MCP server
    context: async (accessToken: string) => {
      const octokit = new Octokit({ auth: accessToken });
      const { data: user } = await octokit.rest.users.getAuthenticated();

      return {
        login: user.login,
        name: user.name || user.login,
        email: user.email || `${user.login}@github.com`,
        accessToken,
      };
    },
  }),

  /**
   * KV namespace for token storage
   * Must be bound in wrangler.jsonc
   */
  kv: (env: Env) => env.OAUTH_KV,

  /**
   * API handlers: MCP transport endpoints
   */
  apiHandlers: {
    "/sse": MyMCP.serveSSE("/sse"),
    "/mcp": MyMCP.serve("/mcp"),
  },

  /**
   * Security settings
   */
  allowConsentScreen: true, // Show consent screen (required for production)
  allowDynamicClientRegistration: true, // Allow clients to register on-the-fly
});
