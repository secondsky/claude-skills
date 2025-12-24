/**
 * Firecrawl with Cloudflare Workers (Direct Fetch API)
 *
 * ⚠️ IMPORTANT: The Firecrawl SDK cannot run in Cloudflare Workers due to Node.js
 * dependencies (axios uses Node.js http module). This template uses direct REST API
 * calls with the fetch API, which works perfectly in Workers.
 *
 * Features:
 *   - Direct Firecrawl v2 API integration using fetch
 *   - Optional KV caching to reduce API calls and credits
 *   - Proper error handling and TypeScript types
 *   - Works in Cloudflare Workers runtime
 *
 * Environment Variables (add via wrangler secrets):
 *   FIRECRAWL_API_KEY - Your Firecrawl API key (get from https://www.firecrawl.dev)
 *
 * Setup:
 *   1. Add API key: npx wrangler secret put FIRECRAWL_API_KEY
 *   2. (Optional) Add KV binding to wrangler.jsonc:
 *      {
 *        "kv_namespaces": [
 *          { "binding": "SCRAPED_CACHE", "id": "your-kv-namespace-id" }
 *        ]
 *      }
 *   3. Deploy: npx wrangler deploy
 *
 * Usage:
 *   POST https://your-worker.workers.dev
 *   Body: { "url": "https://example.com" }
 */

interface Env {
  FIRECRAWL_API_KEY: string;
  SCRAPED_CACHE?: KVNamespace; // Optional: for caching results
}

interface FirecrawlScrapeRequest {
  url: string;
  formats?: ('markdown' | 'html' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
  removeBase64Images?: boolean;
  actions?: Array<{
    type: 'click' | 'wait' | 'scroll';
    selector?: string;
    milliseconds?: number;
    direction?: 'up' | 'down';
  }>;
  headers?: Record<string, string>;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    markdown?: string;
    html?: string;
    screenshot?: string;
    metadata: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL: string;
      statusCode?: number;
    };
  };
  error?: string;
}

interface FirecrawlCrawlRequest {
  url: string;
  limit?: number;
  maxDepth?: number;
  scrapeOptions?: Omit<FirecrawlScrapeRequest, 'url'>;
  allowedDomains?: string[];
  excludePaths?: string[];
  includePaths?: string[];
  webhook?: string;
}

interface FirecrawlCrawlResponse {
  success: boolean;
  id: string;
  url: string; // Status check URL
}

/**
 * Scrape a single URL using Firecrawl v2 API
 */
async function scrapeUrl(
  url: string,
  apiKey: string,
  options: Omit<FirecrawlScrapeRequest, 'url'> = {}
): Promise<FirecrawlScrapeResponse> {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: options.formats || ['markdown'],
      onlyMainContent: options.onlyMainContent ?? true,
      waitFor: options.waitFor,
      removeBase64Images: options.removeBase64Images ?? true,
      actions: options.actions,
      headers: options.headers
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  return await response.json<FirecrawlScrapeResponse>();
}

/**
 * Start a crawl job using Firecrawl v2 API
 */
async function crawlUrl(
  apiKey: string,
  options: FirecrawlCrawlRequest
): Promise<FirecrawlCrawlResponse> {
  const response = await fetch('https://api.firecrawl.dev/v2/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  return await response.json<FirecrawlCrawlResponse>();
}

/**
 * Check crawl status
 */
async function checkCrawlStatus(
  crawlId: string,
  apiKey: string
): Promise<any> {
  const response = await fetch(`https://api.firecrawl.dev/v2/crawl/${crawlId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers (if needed for browser access)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed. Use POST with JSON body: { "url": "..." }' },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      // Parse request body
      let body: any;
      try {
        body = await request.json();
      } catch (e) {
        return Response.json(
          { error: 'Invalid JSON in request body' },
          { status: 400, headers: corsHeaders }
        );
      }

      const { url, action = 'scrape' } = body;

      if (!url) {
        return Response.json(
          { error: 'URL is required in request body' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if API key is configured
      if (!env.FIRECRAWL_API_KEY) {
        return Response.json(
          { error: 'FIRECRAWL_API_KEY not configured. Run: npx wrangler secret put FIRECRAWL_API_KEY' },
          { status: 500, headers: corsHeaders }
        );
      }

      // Handle different actions
      if (action === 'scrape') {
        // Check cache first (if KV is available)
        const cacheKey = `scrape:${url}`;
        if (env.SCRAPED_CACHE) {
          const cached = await env.SCRAPED_CACHE.get(cacheKey, 'json');
          if (cached) {
            console.log(`Cache hit for ${url}`);
            return Response.json(
              { cached: true, data: cached },
              { headers: corsHeaders }
            );
          }
        }

        // Scrape the URL
        console.log(`Scraping ${url}...`);
        const result = await scrapeUrl(url, env.FIRECRAWL_API_KEY, {
          formats: body.formats || ['markdown'],
          onlyMainContent: body.onlyMainContent ?? true,
          waitFor: body.waitFor,
          removeBase64Images: body.removeBase64Images ?? true,
          actions: body.actions,
          headers: body.headers
        });

        if (!result.success) {
          return Response.json(
            { error: result.error || 'Scraping failed' },
            { status: 500, headers: corsHeaders }
          );
        }

        // Cache result for 1 hour (if KV is available)
        if (env.SCRAPED_CACHE) {
          await env.SCRAPED_CACHE.put(
            cacheKey,
            JSON.stringify(result.data),
            { expirationTtl: 3600 } // 1 hour
          );
          console.log(`Cached result for ${url}`);
        }

        return Response.json(
          { cached: false, data: result.data },
          { headers: corsHeaders }
        );

      } else if (action === 'crawl') {
        // Start a crawl job
        console.log(`Starting crawl for ${url}...`);
        const crawlResult = await crawlUrl(env.FIRECRAWL_API_KEY, {
          url,
          limit: body.limit,
          maxDepth: body.maxDepth,
          scrapeOptions: body.scrapeOptions,
          allowedDomains: body.allowedDomains,
          excludePaths: body.excludePaths,
          includePaths: body.includePaths,
          webhook: body.webhook
        });

        return Response.json(crawlResult, { headers: corsHeaders });

      } else if (action === 'crawl-status') {
        // Check crawl status
        const crawlId = body.crawlId;
        if (!crawlId) {
          return Response.json(
            { error: 'crawlId is required for crawl-status action' },
            { status: 400, headers: corsHeaders }
          );
        }

        const status = await checkCrawlStatus(crawlId, env.FIRECRAWL_API_KEY);
        return Response.json(status, { headers: corsHeaders });

      } else {
        return Response.json(
          { error: `Unknown action: ${action}. Use 'scrape', 'crawl', or 'crawl-status'` },
          { status: 400, headers: corsHeaders }
        );
      }

    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

// Example usage with curl:
/*
# Scrape a single page
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.firecrawl.dev", "action": "scrape"}'

# Start a crawl
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.example.com", "action": "crawl", "limit": 10}'

# Check crawl status
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"action": "crawl-status", "crawlId": "abc123"}'
*/
