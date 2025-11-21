# TypeScript Performance Optimizations

## Lazy Load Utility

```typescript
// utils/lazyLoad.ts
import React from 'react';

export const lazyLoad = (importStatement: Promise<any>) => {
  return React.lazy(() =>
    importStatement.then(module => ({
      default: module.default
    }))
  );
};

// routes.tsx
import { lazyLoad } from './utils/lazyLoad';

export const routes = [
  {
    path: '/',
    component: () => import('./pages/Home'),
    lazy: lazyLoad(import('./pages/Home'))
  },
  {
    path: '/dashboard',
    lazy: lazyLoad(import('./pages/Dashboard'))
  },
  {
    path: '/users',
    lazy: lazyLoad(import('./pages/Users'))
  }
];

// App.tsx with Suspense
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {routes.map(route => {
            // JSX requires PascalCase for component references
            const LazyComponent = route.lazy;
            return (
              <Route key={route.path} path={route.path} element={<LazyComponent />} />
            );
          })}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

## TypeScript Image Component

```typescript
interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  loading = 'lazy'
}) => {
  const webpSrc = src.replace(/\.(jpg|png)$/, '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
};
```

## Advanced Service Worker

```typescript
// service-worker.ts
const CACHE_NAME = 'v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  // Cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(response => {
        // Clone the response
        const cloned = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/offline.html');
      });
    })
  );
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

## TerserPlugin Configuration

```javascript
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ]
  }
};
```

## Complete Performance Metrics Interface

```typescript
// utils/performanceMonitor.ts
interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  cls: number;  // Cumulative Layout Shift
  fid: number;  // First Input Delay
  ttfb: number; // Time to First Byte
}

export const observeWebVitals = (callback: (metrics: Partial<PerformanceMetrics>) => void) => {
  const metrics: Partial<PerformanceMetrics> = {};

  // LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
    callback(metrics);
  });

  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observer not supported');
  }

  // CLS
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        metrics.cls = (metrics.cls || 0) + (entry as any).value;
        callback(metrics);
      }
    }
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observer not supported');
  }

  // FID via INP (First Input Delay)
  const inputObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const firstEntry = entries[0];
    metrics.fid = firstEntry.processingDuration;
    callback(metrics);
  });

  try {
    // NOTE: 'event' is not a valid entryType - use only 'first-input'
    // For INP tracking, use 'layout-shift', 'largest-contentful-paint', etc.
    inputObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observer not supported');
  }

  // TTFB (Time to First Byte) - measure from fetch start to first byte
  const navigationTiming = performance.getEntriesByType('navigation')[0];
  if (navigationTiming) {
    const nav = navigationTiming as PerformanceNavigationTiming;
    // CORRECT: responseStart - fetchStart measures time from fetch start to first byte
    // INCORRECT: responseStart - requestStart only measures request duration
    metrics.ttfb = nav.responseStart - nav.fetchStart;
    callback(metrics);
  }
};

// Usage
observeWebVitals((metrics) => {
  console.log('Performance metrics:', metrics);
  // Send to analytics
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify(metrics)
  });
});

// Chrome DevTools Protocol for performance testing
import puppeteer from 'puppeteer';

async function measurePagePerformance(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  const metrics = JSON.parse(
    await page.evaluate(() => JSON.stringify(window.performance))
  );

  console.log('Page Load Time:', metrics.timing.loadEventEnd - metrics.timing.navigationStart);
  console.log('DOM Content Loaded:', metrics.timing.domContentLoadedEventEnd - metrics.timing.navigationStart);

  await browser.close();
}
```
