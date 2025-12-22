# Common Patterns - Cloudflare Browser Rendering

Production-ready patterns for browser automation, scraping, and PDF generation with Cloudflare Workers Browser Rendering.

## Table of Contents

1. [Screenshot with KV Caching](#pattern-1-screenshot-with-kv-caching) - Cache screenshots to reduce usage
2. [PDF Generation from HTML](#pattern-2-pdf-generation-from-html) - Convert custom HTML to PDF
3. [Web Scraping with Structured Data](#pattern-3-web-scraping-with-structured-data) - Extract structured data
4. [Batch Scraping Multiple URLs](#pattern-4-batch-scraping-multiple-urls) - Efficiently scrape multiple pages
5. [AI-Enhanced Scraping](#pattern-5-ai-enhanced-scraping) - Combine with Workers AI
6. [Form Filling and Automation](#pattern-6-form-filling-and-automation) - Automate workflows

---

## Pattern 1: Screenshot with KV Caching

Cache screenshots to reduce browser usage and improve performance.

**Use Case**: Screenshot APIs, preview generation, visual testing

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing ?url parameter", { status: 400 });
    }

    const normalizedUrl = new URL(url).toString();

    // Check cache
    let screenshot = await env.CACHE.get(normalizedUrl, { type: "arrayBuffer" });

    if (!screenshot) {
      // Generate screenshot
      const browser = await puppeteer.launch(env.MYBROWSER);
      const page = await browser.newPage();
      await page.goto(normalizedUrl);
      screenshot = await page.screenshot();
      await browser.close();

      // Cache for 24 hours
      await env.CACHE.put(normalizedUrl, screenshot, {
        expirationTtl: 60 * 60 * 24
      });
    }

    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

**Key Points**:
- **Cache first** - Check KV before launching browser
- **TTL** - Set appropriate expiration (24 hours in example)
- **Normalize URLs** - Convert to consistent format for cache keys
- **Cost savings** - Dramatic reduction in browser usage for repeated URLs

**Enhancements**:
- Add cache invalidation endpoint
- Support different viewport sizes in cache key
- Implement rate limiting per IP

---

## Pattern 2: PDF Generation from HTML

Convert custom HTML to PDF for invoices, reports, and documents.

**Use Case**: Invoice generation, report exports, document conversion

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { html } = await request.json<{ html: string }>();

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    // Set custom HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm"
      }
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=document.pdf"
      }
    });
  }
};
```

**Key Points**:
- **POST method** - Accept HTML in request body
- **waitUntil** - Use `"networkidle0"` to ensure all resources loaded
- **printBackground** - Include CSS backgrounds in PDF
- **margins** - Add spacing for better readability
- **filename** - Set download filename in Content-Disposition

**Enhancements**:
- Add header/footer with page numbers
- Support custom CSS injection
- Template system for consistent styling
- Add watermark support

---

## Pattern 3: Web Scraping with Structured Data

Extract structured data from web pages using Puppeteer's evaluate function.

**Use Case**: Price monitoring, product catalogs, data aggregation

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

interface ProductData {
  title: string;
  price: string;
  description: string;
  image: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto(url!, { waitUntil: "networkidle0" });

    // Extract structured data
    const data = await page.evaluate<ProductData>(() => {
      return {
        title: document.querySelector("h1")?.textContent || "",
        price: document.querySelector(".price")?.textContent || "",
        description: document.querySelector(".description")?.textContent || "",
        image: document.querySelector("img")?.src || ""
      };
    });

    await browser.close();

    return Response.json({ url, data });
  }
};
```

**Key Points**:
- **TypeScript interfaces** - Define expected data structure
- **page.evaluate()** - Run JavaScript in browser context
- **Optional chaining** - Handle missing elements safely
- **Default values** - Provide fallbacks for missing data

**Enhancements**:
- Add retry logic for failed selectors
- Implement screenshot on parse error
- Cache results in KV
- Add validation schema (Zod)

---

## Pattern 4: Batch Scraping Multiple URLs

Efficiently scrape multiple URLs using tabs in a single browser instance.

**Use Case**: Bulk data collection, monitoring multiple sites, comparison tools

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

async function scrapeUrl(browser: Browser, url: string): Promise<any> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    const data = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      text: document.body.innerText.slice(0, 500) // First 500 chars
    }));

    await page.close();
    return { success: true, url, data };
  } catch (error) {
    await page.close();
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { urls } = await request.json<{ urls: string[] }>();

    if (!urls || urls.length === 0) {
      return new Response("Missing urls array", { status: 400 });
    }

    const browser = await puppeteer.launch(env.MYBROWSER);

    // Scrape all URLs in parallel (each in its own tab)
    const results = await Promise.all(
      urls.map(url => scrapeUrl(browser, url))
    );

    await browser.close();

    return Response.json({ results });
  }
};
```

**Key Points**:
- **Single browser** - Launch once, use multiple tabs
- **Parallel processing** - Use Promise.all for concurrent scraping
- **Error isolation** - Catch errors per-URL, don't fail entire batch
- **Always close pages** - Free memory after each scrape
- **Timeout per page** - Prevent slow sites from blocking entire batch

**Enhancements**:
- Add concurrency limit (process N at a time)
- Implement retry logic for failed URLs
- Add progress reporting for long batches
- Cache results per URL

---

## Pattern 5: AI-Enhanced Scraping

Combine Browser Rendering with Workers AI to extract structured data from dynamic content.

**Use Case**: Complex product catalogs, unstructured content, adaptive scraping

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    // Scrape page content
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto(url!, { waitUntil: "networkidle0" });

    const bodyContent = await page.$eval("body", el => el.innerHTML);
    await browser.close();

    // Extract structured data with AI
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "user",
          content: `Extract product information as JSON from this HTML. Include: name, price, description, availability.\n\nHTML:\n${bodyContent.slice(0, 4000)}`
        }
      ]
    });

    // Parse AI response
    let productData;
    try {
      productData = JSON.parse(response.response);
    } catch {
      productData = { raw: response.response };
    }

    return Response.json({ url, product: productData });
  }
};
```

**Key Points**:
- **No selectors needed** - AI extracts data from HTML structure
- **Content limit** - Trim HTML to fit AI context window (4000 chars)
- **Structured prompt** - Clearly specify desired JSON format
- **Fallback parsing** - Handle non-JSON AI responses gracefully

**Enhancements**:
- Use embeddings for semantic search
- Implement response validation with schema
- Cache AI extractions
- Add multi-turn conversation for clarification

---

## Pattern 6: Form Filling and Automation

Automate form submissions and multi-step workflows like login, checkout, or data entry.

**Use Case**: Automated testing, data migration, bot automation

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { email, password } = await request.json<{
      email: string;
      password: string;
    }>();

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    // Navigate to login page
    await page.goto("https://example.com/login");

    // Fill form
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);

    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Extract result
    const result = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      loggedIn: document.querySelector(".user-profile") !== null
    }));

    await browser.close();

    return Response.json(result);
  }
};
```

**Key Points**:
- **Type for inputs** - More realistic than directly setting values
- **Wait for navigation** - Ensure form submission completes
- **Verify success** - Check for expected elements after submission
- **Return structured result** - Include URL, title, and success indicators

**Enhancements**:
- Handle CAPTCHA detection
- Add retry logic for network errors
- Screenshot on failure for debugging
- Support multi-step workflows with state machine

---

## Pattern Comparison

| Pattern | Use Case | Complexity | CPU Time | Best For |
|---------|----------|------------|----------|----------|
| **Screenshot Caching** | Preview generation | Low | Low (with cache) | High-traffic, repeated URLs |
| **PDF Generation** | Document export | Low | Medium | Reports, invoices, printables |
| **Structured Scraping** | Data extraction | Medium | Medium | Product catalogs, monitoring |
| **Batch Scraping** | Bulk collection | Medium | High | Multi-site comparison, aggregation |
| **AI Scraping** | Adaptive extraction | High | Very High | Unstructured content, complex layouts |
| **Form Automation** | Workflow automation | High | High | Testing, data migration, bots |

---

## Performance Tips

### Browser Reuse
- **Launch once per batch** - Don't launch/close for each URL
- **Use multiple tabs** - Open pages instead of new browsers
- **Disconnect vs close** - Keep session alive for subsequent requests

### Optimize Navigation
- **Set appropriate waitUntil** - `"load"` for static, `"networkidle0"` for dynamic
- **Reduce timeouts** - Lower default 30s to realistic values
- **Block resources** - Disable images/fonts if not needed

### Memory Management
- **Close pages** - Always close tabs after use
- **Limit concurrency** - Process N URLs at a time, not all at once
- **Monitor sessions** - Use `puppeteer.sessions()` to check usage

### Cost Optimization
- **Cache aggressively** - KV for screenshots, R2 for PDFs
- **Check limits first** - Use `puppeteer.limits()` before launching
- **Batch operations** - Combine multiple operations in one browser session

---

**Last Updated**: 2025-11-25
**Cloudflare Docs**: https://developers.cloudflare.com/browser-rendering/
