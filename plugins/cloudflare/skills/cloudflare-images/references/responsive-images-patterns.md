# Responsive Images Patterns

Complete guide to serving optimal images for different devices and screen sizes.

---

## srcset with Named Variants

Best for consistent, predefined sizes.

```html
<img
  srcset="
    https://imagedelivery.net/HASH/ID/mobile 480w,
    https://imagedelivery.net/HASH/ID/tablet 768w,
    https://imagedelivery.net/HASH/ID/desktop 1920w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="https://imagedelivery.net/HASH/ID/desktop"
  alt="Responsive image"
  loading="lazy"
/>
```

**Variants to create**:
- `mobile`: width=480, fit=scale-down
- `tablet`: width=768, fit=scale-down
- `desktop`: width=1920, fit=scale-down

---

## srcset with Flexible Variants

Best for dynamic sizing (public images only).

```html
<img
  srcset="
    https://imagedelivery.net/HASH/ID/w=480,f=auto 480w,
    https://imagedelivery.net/HASH/ID/w=768,f=auto 768w,
    https://imagedelivery.net/HASH/ID/w=1920,f=auto 1920w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="https://imagedelivery.net/HASH/ID/w=1920,f=auto"
  alt="Responsive image"
  loading="lazy"
/>
```

---

## Art Direction (Different Crops)

Serve different image crops for mobile vs desktop.

```html
<picture>
  <!-- Mobile: Square crop -->
  <source
    media="(max-width: 767px)"
    srcset="https://imagedelivery.net/HASH/ID/mobile-square"
  />

  <!-- Desktop: Wide crop -->
  <source
    media="(min-width: 768px)"
    srcset="https://imagedelivery.net/HASH/ID/desktop-wide"
  />

  <!-- Fallback -->
  <img
    src="https://imagedelivery.net/HASH/ID/desktop-wide"
    alt="Art directed image"
    loading="lazy"
  />
</picture>
```

**Variants to create**:
- `mobile-square`: width=480, height=480, fit=cover
- `desktop-wide`: width=1920, height=1080, fit=cover

---

## High-DPI (Retina) Displays

Serve 2x images for high-resolution screens.

```html
<img
  srcset="
    https://imagedelivery.net/HASH/ID/w=400,dpr=1,f=auto 1x,
    https://imagedelivery.net/HASH/ID/w=400,dpr=2,f=auto 2x
  "
  src="https://imagedelivery.net/HASH/ID/w=400,f=auto"
  alt="Retina-ready image"
/>
```

---

## Blur Placeholder (LQIP)

Load tiny blurred placeholder first, then swap to full image.

```html
<img
  id="lqip-image"
  src="https://imagedelivery.net/HASH/ID/w=50,q=10,blur=20,f=webp"
  data-src="https://imagedelivery.net/HASH/ID/w=1920,f=auto"
  alt="Image with LQIP"
  style="filter: blur(10px); transition: filter 0.3s;"
/>

<script>
const img = document.getElementById('lqip-image');
const fullSrc = img.getAttribute('data-src');

const fullImg = new Image();
fullImg.src = fullSrc;
fullImg.onload = () => {
  img.src = fullSrc;
  img.style.filter = 'blur(0)';
};
</script>
```

---

## Lazy Loading

Defer loading below-the-fold images.

```html
<!-- Native lazy loading (modern browsers) -->
<img src="..." loading="lazy" alt="..." />

<!-- With Intersection Observer (better control) -->
<img
  class="lazy"
  data-src="https://imagedelivery.net/HASH/ID/w=800,f=auto"
  alt="Lazy loaded image"
/>

<script>
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
</script>
```

---

## URL Transformations (/cdn-cgi/image/)

Transform ANY publicly accessible image (not just Cloudflare Images storage).

```html
<img
  srcset="
    /cdn-cgi/image/width=480,format=auto/uploads/photo.jpg 480w,
    /cdn-cgi/image/width=768,format=auto/uploads/photo.jpg 768w,
    /cdn-cgi/image/width=1920,format=auto/uploads/photo.jpg 1920w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1920px"
  src="/cdn-cgi/image/width=1920,format=auto/uploads/photo.jpg"
  alt="Transformed origin image"
  loading="lazy"
/>
```

---

## Recommended Breakpoints

```javascript
const breakpoints = {
  mobile: 480,      // Small phones
  tablet: 768,      // Tablets
  desktop: 1024,    // Laptops
  wide: 1920,       // Desktops
  ultrawide: 2560   // Large displays
};
```

**sizes attribute**:
```html
sizes="
  (max-width: 480px) 480px,
  (max-width: 768px) 768px,
  (max-width: 1024px) 1024px,
  (max-width: 1920px) 1920px,
  2560px
"
```

---

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    img { max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <!-- Hero image with art direction -->
  <picture>
    <source
      media="(max-width: 767px)"
      srcset="https://imagedelivery.net/HASH/ID/w=480,h=480,fit=cover,f=auto"
    />
    <source
      media="(min-width: 768px)"
      srcset="https://imagedelivery.net/HASH/ID/w=1920,h=1080,fit=cover,f=auto"
    />
    <img
      src="https://imagedelivery.net/HASH/ID/w=1920,h=1080,fit=cover,f=auto"
      alt="Hero image"
    />
  </picture>

  <!-- Responsive gallery images -->
  <img
    srcset="
      https://imagedelivery.net/HASH/ID/w=480,f=auto 480w,
      https://imagedelivery.net/HASH/ID/w=768,f=auto 768w,
      https://imagedelivery.net/HASH/ID/w=1024,f=auto 1024w
    "
    sizes="
      (max-width: 480px) 100vw,
      (max-width: 768px) 50vw,
      33vw
    "
    src="https://imagedelivery.net/HASH/ID/w=1024,f=auto"
    alt="Gallery image"
    loading="lazy"
  />
</body>
</html>
```

---

## Best Practices

1. **Always use format=auto**: Optimal WebP/AVIF delivery
2. **Add loading="lazy"**: Below-the-fold images
3. **Match sizes to CSS layout**: Use `sizes` attribute correctly
4. **Provide descriptive alt text**: Accessibility
5. **Use LQIP for perceived performance**: Better UX
6. **Named variants for private**: Signed URLs compatible
7. **Flexible variants for public**: Dynamic sizing
8. **Limit srcset to 3-5 sizes**: Balance performance vs flexibility

---

## Official Documentation

- **Responsive Images (MDN)**: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
- **Cloudflare Images**: https://developers.cloudflare.com/images/
