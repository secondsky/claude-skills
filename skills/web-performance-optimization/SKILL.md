---
name: web-performance-optimization
description: Optimizes web application performance through code splitting, lazy loading, caching strategies, and Core Web Vitals monitoring. Use when improving page load times, implementing service workers, or reducing bundle sizes.
---

# Web Performance Optimization

Improve web application performance through strategic optimization techniques.

## Code Splitting (React)

```javascript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## Webpack Bundle Optimization

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

## Image Optimization

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img
    src="image.jpg"
    srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 50vw"
    loading="lazy"
    decoding="async"
    alt="Description"
  >
</picture>
```

## Service Worker Caching

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const ASSETS = ['/', '/index.html', '/main.js', '/styles.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
```

## Core Web Vitals Monitoring

```javascript
// Track LCP, CLS, FID
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.startTime}ms`);
    // Send to analytics
    sendToAnalytics({ metric: entry.name, value: entry.startTime });
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((list) => {
  let cls = 0;
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) cls += entry.value;
  }
  sendToAnalytics({ metric: 'CLS', value: cls });
}).observe({ type: 'layout-shift', buffered: true });
```

## Performance Targets

| Metric | Good | Needs Improvement |
|--------|------|-------------------|
| LCP | <2.5s | 2.5-4s |
| FID | <100ms | 100-300ms |
| CLS | <0.1 | 0.1-0.25 |
| TTI | <3.8s | 3.8-7.3s |

## Compression (Nginx)

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;
```

## Optimization Checklist

- [ ] Enable code splitting for routes
- [ ] Lazy load below-fold components
- [ ] Optimize and compress images
- [ ] Implement service worker caching
- [ ] Enable gzip/brotli compression
- [ ] Monitor Core Web Vitals
- [ ] Minimize render-blocking resources

## Additional Configuration

See [references/compression-monitoring.md](references/compression-monitoring.md) for:
- Webpack compression plugin setup
- Apache .htaccess compression config
- TTFB monitoring implementation
- Puppeteer automation for measurement

See [references/typescript-advanced.md](references/typescript-advanced.md) for:
- TypeScript lazyLoad utility
- TypeScript image component
- Advanced service worker with offline fallback
- TerserPlugin configuration
- Complete PerformanceMetrics interface

## Tools

- Lighthouse / PageSpeed Insights
- WebPageTest
- Chrome DevTools Performance tab
- web-vitals npm package
