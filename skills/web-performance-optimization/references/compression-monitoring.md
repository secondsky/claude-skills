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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable performance tracking
  await page.setCacheEnabled(false);

  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Get performance metrics
  const metrics = await page.metrics();
  const performanceTiming = JSON.parse(
    await page.evaluate(() => JSON.stringify(performance.timing))
  );

  // Calculate key metrics
  const results = {
    ttfb: performanceTiming.responseStart - performanceTiming.requestStart,
    domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
    load: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
    jsHeapSize: metrics.JSHeapUsedSize / 1024 / 1024, // MB
  };

  // Get Lighthouse-style metrics
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });

  results.lcp = lcp;

  await browser.close();
  return results;
}

// Usage
measurePerformance('https://example.com').then(console.log);
```

## Analytics Integration

```javascript
function sendToAnalytics({ metric, value }) {
  // Send to your analytics endpoint
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
  }).catch(console.error);
}
```
