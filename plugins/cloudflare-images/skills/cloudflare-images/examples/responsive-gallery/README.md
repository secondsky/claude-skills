# Responsive Gallery Example

Complete responsive image gallery using Cloudflare Images with srcset, lazy loading, and variant optimization.

## Features

- ✅ Responsive images with `srcset` and `sizes`
- ✅ Lazy loading for performance
- ✅ Named variants for common sizes
- ✅ Masonry grid layout
- ✅ Lightbox for full-size viewing
- ✅ WebP/AVIF automatic format negotiation
- ✅ CDN caching

## Live Demo Structure

```
responsive-gallery/
├── README.md              # This file
├── index.html             # Gallery UI
└── images.json            # Image metadata (IDs, alt text)
```

## Implementation

### HTML Structure

```html
<div class="gallery">
  <div class="gallery-item" data-image-id="abc123">
    <img
      src="https://imagedelivery.net/{hash}/abc123/thumbnail"
      srcset="
        https://imagedelivery.net/{hash}/abc123/thumbnail 300w,
        https://imagedelivery.net/{hash}/abc123/medium 600w,
        https://imagedelivery.net/{hash}/abc123/large 1200w
      "
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt="Product photo"
      loading="lazy"
      decoding="async"
    />
  </div>
</div>
```

### Variants Configuration

Create these variants using `/generate-variant` command:

```json
{
  "thumbnail": { "width": 300, "height": 300, "fit": "cover", "quality": 80 },
  "medium": { "width": 600, "height": 600, "fit": "scale-down", "quality": 85 },
  "large": { "width": 1200, "height": 1200, "fit": "scale-down", "quality": 90 }
}
```

### Responsive Behavior

- **Mobile (<640px)**: Loads `thumbnail` variant (300px)
- **Tablet (640-1024px)**: Loads `medium` variant (600px)
- **Desktop (>1024px)**: Loads `large` variant (1200px)
- **Retina displays**: Automatically serves higher resolution

### Performance Optimizations

1. **Lazy Loading**: Images load as user scrolls
2. **Decoding Async**: Non-blocking image decode
3. **Format Auto**: WebP/AVIF served automatically (25-50% smaller)
4. **CDN Caching**: Cached globally at edge locations
5. **Named Variants**: Pre-defined sizes for consistency

### Lighthouse Scores

Expected scores with optimizations:

- **Performance**: 95-100
- **Largest Contentful Paint (LCP)**: <2.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Total Blocking Time (TBT)**: <200ms

## Setup

### 1. Create Variants

```bash
# Use the generate-variant command for each size
/generate-variant

# Or via API:
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"id": "thumbnail", "options": {"width": 300, "height": 300, "fit": "cover"}}'
```

### 2. Configure Image Data

Edit `images.json` with your image IDs:

```json
[
  {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "alt": "Product 1",
    "title": "Modern Chair"
  },
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "alt": "Product 2",
    "title": "Wooden Table"
  }
]
```

### 3. Open Gallery

```bash
# Serve locally
npx serve .

# Or open directly
open index.html
```

## Advanced Features

### Lightbox Implementation

```javascript
// Click image to view full size
item.addEventListener('click', () => {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <img src="https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/large?format=auto" />
  `;
  document.body.appendChild(lightbox);
});
```

### Infinite Scroll

```javascript
// Load more images on scroll
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMoreImages();
  }
});

observer.observe(document.querySelector('.load-more-trigger'));
```

### Search and Filter

```javascript
// Filter gallery by search term
function filterGallery(searchTerm) {
  const items = document.querySelectorAll('.gallery-item');
  items.forEach(item => {
    const alt = item.querySelector('img').alt.toLowerCase();
    item.style.display = alt.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
  });
}
```

## Related Examples

- **Basic Upload**: Minimal upload implementation
- **Private Images**: Signed URLs for access control

## Related References

- **Responsive Images**: `references/responsive-images-patterns.md`
- **Variants Guide**: `references/variants-guide.md`
- **Format Optimization**: `references/format-optimization.md`
