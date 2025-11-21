# Compression & Monitoring

## Webpack Compression Plugin

```javascript
// webpack.config.js
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,  // Only compress files > 8KB
      minRatio: 0.8
    })
  ]
};
```

## Apache .htaccess Compression

```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## TTFB Monitoring

```javascript
// Track Time to First Byte
new PerformanceObserver((list) => {
  const entries = list.getEntriesByType('navigation');
  entries.forEach((entry) => {
    const ttfb = entry.responseStart - entry.requestStart;
    sendToAnalytics({ metric: 'TTFB', value: ttfb });
  });
}).observe({ type: 'navigation', buffered: true });

// Complete Web Vitals tracking
function trackWebVitals() {
  // TTFB
  const navEntry = performance.getEntriesByType('navigation')[0];
  const ttfb = navEntry.responseStart - navEntry.requestStart;

  // FID (First Input Delay)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry.processingStart - entry.startTime;
      sendToAnalytics({ metric: 'FID', value: fid });
    }
  }).observe({ type: 'first-input', buffered: true });

  sendToAnalytics({ metric: 'TTFB', value: ttfb });
}
```

## Puppeteer Performance Automation

```javascript
const puppeteer = require('puppeteer');

async function measurePerformance(url) {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Enable performance tracking
    await page.setCacheEnabled(false);

    const client = await page.target().createCDPSession();
    await client.send('Performance.enable');

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Get performance metrics
    const metrics = await page.metrics();
    // Access performance.timing directly without JSON round-trip
    const performanceTiming = await page.evaluate(() => performance.timing);

    // Calculate key metrics
    const results = {
      ttfb: performanceTiming.responseStart - performanceTiming.requestStart,
      domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
      load: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
      jsHeapSize: metrics.JSHeapUsedSize / 1024 / 1024, // MB
    };

    // Get LCP - wait for page to become hidden to capture final value
    // This prevents race condition where LCP updates after initial measurement
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        let latestLCP = 0;

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          // Keep track of the latest LCP value
          latestLCP = entries[entries.length - 1].startTime;
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Wait for page visibility to change to 'hidden' to get final LCP
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            observer.disconnect();
            resolve(latestLCP);
          }
        }, { once: true });

        // Fallback: resolve after a reasonable timeout if visibility never changes
        setTimeout(() => {
          observer.disconnect();
          resolve(latestLCP);
        }, 5000);
      });
    });

    results.lcp = lcp;

    return results;
  } catch (error) {
    console.error('Performance measurement failed:', error);
    throw error;
  } finally {
    // Ensure browser is always closed, even if measurement fails
    if (browser) {
      await browser.close();
    }
  }
}

// Usage
measurePerformance('https://example.com').then(console.log);
```

## Analytics Integration

```javascript
// Simple version - acceptable for optional telemetry
function sendToAnalytics({ metric, value }) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric,
      value,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
  }).catch(console.error); // Silently fail - acceptable for non-critical telemetry
}

// Production version - with retries and fallback
function sendToAnalyticsWithRetry({ metric, value }, retries = 2) {
  const payload = {
    metric,
    value,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };

  const sendRequest = async (endpoint, attempt = 0) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Set reasonable timeout via signal
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok && attempt < retries) {
        // Retry on 5xx errors with exponential backoff
        if (response.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendRequest(endpoint, attempt + 1);
        }
      }

      return response;
    } catch (error) {
      console.error(`Analytics send failed (attempt ${attempt + 1}):`, error);

      // Retry on network errors
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendRequest(endpoint, attempt + 1);
      }

      // Log to fallback endpoint after all retries exhausted
      if (attempt >= retries) {
        try {
          await fetch('/api/analytics/fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, error: error.message })
          });
        } catch (fallbackError) {
          console.error('Fallback analytics also failed:', fallbackError);
          // Optional: Store in localStorage for batch send later
          storeForRetry(payload);
        }
      }

      throw error;
    }
  };

  // Fire and forget - don't block page
  sendRequest('/api/analytics').catch(() => {
    // Already logged and handled above
  });
}

// Optional: Store failed metrics in localStorage for batch retry
function storeForRetry(payload) {
  try {
    const stored = JSON.parse(localStorage.getItem('pendingAnalytics') || '[]');
    stored.push(payload);
    // Limit to prevent unbounded growth
    if (stored.length > 100) stored.shift();
    localStorage.setItem('pendingAnalytics', JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to store analytics locally:', e);
  }
}

// Optional: Retry stored metrics on next page load
function retryStoredAnalytics() {
  try {
    const stored = JSON.parse(localStorage.getItem('pendingAnalytics') || '[]');
    if (stored.length === 0) return;

    fetch('/api/analytics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stored)
    }).then(() => {
      localStorage.removeItem('pendingAnalytics');
    }).catch(console.error);
  } catch (e) {
    console.error('Failed to retry stored analytics:', e);
  }
}

// Call on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', retryStoredAnalytics);
}
```
