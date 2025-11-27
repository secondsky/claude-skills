# Puppeteer API Reference - Cloudflare Browser Rendering

Complete API reference for Puppeteer in Cloudflare Workers Browser Rendering.

## Table of Contents

### Core Functions
- [puppeteer.launch()](#puppeteerlaunch) - Launch new browser instance
- [puppeteer.connect()](#puppeteerconnect) - Connect to existing session
- [puppeteer.sessions()](#puppeteersessions) - List running sessions
- [puppeteer.history()](#puppeteerhistory) - List recent sessions
- [puppeteer.limits()](#puppeteerlimits) - Check account limits

### Browser API
- [browser.newPage()](#browsernewpage) - Create new page/tab
- [browser.sessionId()](#browsersessionid) - Get session ID
- [browser.close()](#browserclose) - Close browser
- [browser.disconnect()](#browserdisconnect) - Disconnect without closing
- [browser.createBrowserContext()](#browsercreatebrowsercontext) - Create isolated context

### Page API
- [page.goto()](#pagegoto) - Navigate to URL
- [page.screenshot()](#pagescreenshot) - Capture screenshot
- [page.pdf()](#pagepdf) - Generate PDF
- [page.content()](#pagecontent) - Get HTML content
- [page.setContent()](#pagesetcontent) - Set custom HTML
- [page.evaluate()](#pageevaluate) - Execute JavaScript
- [page.waitForSelector()](#pagewaitforselector) - Wait for element
- [page.type()](#pagetype) - Type text into input
- [page.click()](#pageclick) - Click element

---

## Core Functions

### puppeteer.launch()

Launch a new browser instance.

**Signature:**
```typescript
await puppeteer.launch(binding: Fetcher, options?: LaunchOptions): Promise<Browser>
```

**Parameters:**
- `binding` (required) - Browser binding from `env.MYBROWSER`
- `options` (optional):
  - `keep_alive` (number) - Keep browser alive for N milliseconds (max: 600000 = 10 minutes)

**Returns:** `Promise<Browser>` - Browser instance

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 60000 // Keep alive for 60 seconds
});
```

**CRITICAL:** Must pass `env.MYBROWSER` binding. Error "Cannot read properties of undefined (reading 'fetch')" means the binding wasn't passed.

---

### puppeteer.connect()

Connect to an existing browser session.

**Signature:**
```typescript
await puppeteer.connect(binding: Fetcher, sessionId: string): Promise<Browser>
```

**Use Cases:**
- Reuse existing browser sessions for performance
- Share browser instance across multiple Workers
- Reduce startup time

**Example:**
```typescript
const sessionId = "478f4d7d-e943-40f6-a414-837d3736a1dc";
const browser = await puppeteer.connect(env.MYBROWSER, sessionId);
```

---

### puppeteer.sessions()

List currently running browser sessions.

**Signature:**
```typescript
await puppeteer.sessions(binding: Fetcher): Promise<SessionInfo[]>
```

**Returns:**
```typescript
interface SessionInfo {
  sessionId: string;
  startTime: number;
  connectionId?: string;  // Present if worker is connected
  connectionStartTime?: number;
}
```

**Example:**
```typescript
const sessions = await puppeteer.sessions(env.MYBROWSER);
// Find sessions without active connections
const freeSessions = sessions.filter(s => !s.connectionId);
```

---

### puppeteer.history()

List recent sessions (both open and closed).

**Signature:**
```typescript
await puppeteer.history(binding: Fetcher): Promise<HistoryEntry[]>
```

**Returns:**
```typescript
interface HistoryEntry {
  sessionId: string;
  startTime: number;
  endTime?: number;
  closeReason?: number;
  closeReasonText?: string; // "NormalClosure", "BrowserIdle", etc.
}
```

**Use Case:** Monitor usage patterns and debug session issues.

---

### puppeteer.limits()

Check current account limits and available sessions.

**Signature:**
```typescript
await puppeteer.limits(binding: Fetcher): Promise<LimitsInfo>
```

**Returns:**
```typescript
interface LimitsInfo {
  activeSessions: Array<{ id: string }>;
  maxConcurrentSessions: number;
  allowedBrowserAcquisitions: number;
  timeUntilNextAllowedBrowserAcquisition: number; // milliseconds
}
```

**Example:**
```typescript
const limits = await puppeteer.limits(env.MYBROWSER);
if (limits.allowedBrowserAcquisitions === 0) {
  return new Response("Rate limit reached", { status: 429 });
}
```

---

## Browser API

Methods available on the `Browser` object returned by `launch()` or `connect()`.

### browser.newPage()

Create a new page (tab) in the browser.

**Signature:**
```typescript
await browser.newPage(): Promise<Page>
```

**Example:**
```typescript
const page = await browser.newPage();
await page.goto("https://example.com");
```

**Performance Tip:** Reuse browser instances and open multiple tabs instead of launching new browsers.

---

### browser.sessionId()

Get the current browser session ID.

**Returns:** `string` - Session ID

**Example:**
```typescript
const sessionId = browser.sessionId();
console.log("Current session:", sessionId);
```

---

### browser.close()

Close the browser and terminate the session.

**Signature:**
```typescript
await browser.close(): Promise<void>
```

**When to use:** When you're completely done with the browser and want to free resources.

---

### browser.disconnect()

Disconnect from the browser WITHOUT closing it.

**Signature:**
```typescript
await browser.disconnect(): Promise<void>
```

**When to use:** Session reuse - allows another Worker to connect to the same session later.

**Example:**
```typescript
// Keep session alive for reuse
const sessionId = browser.sessionId();
await browser.disconnect(); // Don't close, just disconnect
// Later: puppeteer.connect(env.MYBROWSER, sessionId)
```

---

### browser.createBrowserContext()

Create an isolated incognito browser context.

**Signature:**
```typescript
await browser.createBrowserContext(): Promise<BrowserContext>
```

**Use Cases:**
- Isolate cookies and cache between operations
- Test multi-user scenarios
- Maintain session isolation while reusing browser

**Example:**
```typescript
const context1 = await browser.createBrowserContext();
const context2 = await browser.createBrowserContext();

const page1 = await context1.newPage();
const page2 = await context2.newPage();

// page1 and page2 have separate cookies/cache
```

---

## Page API

Methods available on the `Page` object returned by `browser.newPage()`.

### page.goto()

Navigate to a URL.

**Signature:**
```typescript
await page.goto(url: string, options?: NavigationOptions): Promise<Response>
```

**Options:**
- `waitUntil` - When to consider navigation complete:
  - `"load"` - Wait for load event (default)
  - `"domcontentloaded"` - Wait for DOMContentLoaded
  - `"networkidle0"` - Wait until no network connections for 500ms
  - `"networkidle2"` - Wait until ≤2 network connections for 500ms
- `timeout` - Maximum navigation time in milliseconds (default: 30000)

**Example:**
```typescript
await page.goto("https://example.com", {
  waitUntil: "networkidle0",
  timeout: 60000
});
```

**Best Practice:** Use `"networkidle0"` for dynamic content, `"load"` for static pages.

---

### page.screenshot()

Capture a screenshot of the page.

**Signature:**
```typescript
await page.screenshot(options?: ScreenshotOptions): Promise<Buffer>
```

**Options:**
- `fullPage` (boolean) - Capture full scrollable page (default: false)
- `type` (string) - `"png"` or `"jpeg"` (default: `"png"`)
- `quality` (number) - JPEG quality 0-100 (only for jpeg)
- `clip` (object) - Capture specific region: `{ x, y, width, height }`

**Examples:**
```typescript
// Full page screenshot
const screenshot = await page.screenshot({ fullPage: true });

// JPEG with compression
const screenshot = await page.screenshot({
  type: "jpeg",
  quality: 80
});

// Specific region
const screenshot = await page.screenshot({
  clip: { x: 0, y: 0, width: 800, height: 600 }
});
```

---

### page.pdf()

Generate a PDF of the page.

**Signature:**
```typescript
await page.pdf(options?: PDFOptions): Promise<Buffer>
```

**Options:**
- `format` (string) - Page format: `"Letter"`, `"A4"`, etc.
- `printBackground` (boolean) - Include background graphics (default: false)
- `margin` (object) - `{ top, right, bottom, left }` (e.g., `"1cm"`)
- `landscape` (boolean) - Landscape orientation (default: false)
- `scale` (number) - Scale factor 0.1-2 (default: 1)

**Example:**
```typescript
const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
});

return new Response(pdf, {
  headers: { "content-type": "application/pdf" }
});
```

---

### page.content()

Get the full HTML content of the page.

**Signature:**
```typescript
await page.content(): Promise<string>
```

**Example:**
```typescript
const html = await page.content();
console.log(html); // Full HTML source
```

---

### page.setContent()

Set custom HTML content.

**Signature:**
```typescript
await page.setContent(html: string, options?: NavigationOptions): Promise<void>
```

**Use Case:** Generate PDFs from custom HTML.

**Example:**
```typescript
await page.setContent(`
  <!DOCTYPE html>
  <html>
    <head><style>body { font-family: Arial; }</style></head>
    <body><h1>Hello World</h1></body>
  </html>
`);

const pdf = await page.pdf({ format: "A4" });
```

---

### page.evaluate()

Execute JavaScript in the browser context.

**Signature:**
```typescript
await page.evaluate<T>(fn: () => T): Promise<T>
```

**Use Cases:**
- Extract data from the DOM
- Manipulate page content
- Workaround for XPath (not directly supported)

**Examples:**
```typescript
// Extract text content
const title = await page.evaluate(() => document.title);

// Extract structured data
const data = await page.evaluate(() => ({
  title: document.title,
  url: window.location.href,
  headings: Array.from(document.querySelectorAll("h1, h2")).map(el => el.textContent),
  links: Array.from(document.querySelectorAll("a")).map(el => el.href)
}));

// XPath workaround (XPath selectors not directly supported)
const innerHtml = await page.evaluate(() => {
  return new XPathEvaluator()
    .createExpression("/html/body/div/h1")
    .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
    .singleNodeValue.innerHTML;
});
```

---

### page.waitForSelector()

Wait for an element to appear in the DOM.

**Signature:**
```typescript
await page.waitForSelector(selector: string, options?: WaitForOptions): Promise<ElementHandle>
```

**Options:**
- `timeout` (number) - Maximum wait time in milliseconds
- `visible` (boolean) - Wait for element to be visible

**Example:**
```typescript
await page.goto("https://example.com");
await page.waitForSelector("#content", { visible: true });
const screenshot = await page.screenshot();
```

---

### page.type()

Type text into an input field.

**Signature:**
```typescript
await page.type(selector: string, text: string): Promise<void>
```

**Example:**
```typescript
await page.type('input[name="email"]', 'user@example.com');
```

---

### page.click()

Click an element.

**Signature:**
```typescript
await page.click(selector: string): Promise<void>
```

**Example:**
```typescript
await page.click('button[type="submit"]');
await page.waitForNavigation();
```

---

## Best Practices

### Performance Optimization
- **Reuse browser instances** with `disconnect()` instead of `close()`
- **Use browser contexts** for isolated sessions within same browser
- **Set appropriate `keep_alive`** to balance resource usage and startup time
- **Check limits** before launching to avoid rate limiting

### Error Handling
- **Always pass browser binding** (`env.MYBROWSER`) to avoid undefined errors
- **Set reasonable timeouts** for navigation and selector waits
- **Handle navigation failures** gracefully
- **Monitor session limits** using `puppeteer.limits()`

### Resource Management
- **Close pages** when done to free memory
- **Disconnect vs close** - Use disconnect() for session reuse, close() to terminate
- **Monitor active sessions** using `puppeteer.sessions()`
- **Clean up stale sessions** periodically

---

**Last Updated**: 2025-11-25
**Cloudflare Docs**: https://developers.cloudflare.com/browser-rendering/
