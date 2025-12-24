# Image Transformation Options

Complete reference for all image transformation parameters.

Works with:
- **URL format**: `/cdn-cgi/image/<OPTIONS>/<SOURCE>`
- **Workers format**: `fetch(url, { cf: { image: {...} } })`

---

## Sizing

### width
Max width in pixels.

**URL**: `width=800` or `w=800`
**Workers**: `{ width: 800 }`
**Range**: 1-10000

### height
Max height in pixels.

**URL**: `height=600` or `h=600`
**Workers**: `{ height: 600 }`
**Range**: 1-10000

### dpr
Device pixel ratio for high-DPI displays.

**URL**: `dpr=2`
**Workers**: `{ dpr: 2 }`
**Range**: 1-3
**Example**: `dpr=2` serves 2x size for Retina displays

---

## Fit Modes

### fit
How to resize image.

**Options**:
- `scale-down`: Shrink to fit (never enlarge)
- `contain`: Resize to fit within dimensions (preserve aspect ratio)
- `cover`: Resize to fill dimensions (may crop)
- `crop`: Crop to exact dimensions
- `pad`: Resize and add padding

**URL**: `fit=cover`
**Workers**: `{ fit: 'cover' }`
**Default**: `scale-down`

**Examples**:
```
fit=scale-down: 800x600 image → max 400x300 → 400x300 (scaled down)
fit=scale-down: 400x300 image → max 800x600 → 400x300 (not enlarged)
fit=contain: Any size → 800x600 → Fits inside box, preserves aspect
fit=cover: Any size → 800x600 → Fills box, may crop edges
fit=crop: Any size → 800x600 → Exact size, crops as needed
fit=pad: 800x600 image → 1000x1000 → 800x600 + padding
```

---

## Quality & Format

### quality
JPEG/WebP quality.

**URL**: `quality=85` or `q=85`
**Workers**: `{ quality: 85 }`
**Range**: 1-100
**Default**: 85
**Recommended**: 80-90 for photos, 90-100 for graphics

### format
Output format.

**Options**:
- `auto`: Serve AVIF → WebP → Original based on browser support
- `avif`: Always AVIF (with WebP fallback)
- `webp`: Always WebP
- `jpeg`: JPEG (progressive)
- `baseline-jpeg`: JPEG (baseline, for older devices)
- `json`: Image metadata instead of image

**URL**: `format=auto` or `f=auto`
**Workers**: `{ format: 'auto' }`
**Default**: Original format
**Recommended**: `format=auto` for optimal delivery

### compression
WebP compression mode.

**Options**:
- `fast`: Faster encoding, larger file
- `lossless`: No quality loss

**URL**: `compression=fast`
**Workers**: `{ compression: 'fast' }`

---

## Cropping

### gravity
Crop focal point.

**Options**:
- `auto`: Smart crop based on saliency
- `face`: Crop to detected face
- `left`, `right`, `top`, `bottom`: Crop to side
- `XxY`: Coordinates (e.g., `0.5x0.5` for center)

**URL**: `gravity=face` or `gravity=0.5x0.3`
**Workers**: `{ gravity: 'face' }` or `{ gravity: { x: 0.5, y: 0.3 } }`
**Default**: `auto`

**Examples**:
```
gravity=auto: Smart crop to interesting area
gravity=face: Crop to detected face (if found)
gravity=0.5x0.5: Center crop
gravity=0x0: Top-left corner
gravity=1x1: Bottom-right corner
```

### zoom
Face cropping zoom level (when `gravity=face`).

**URL**: `zoom=0.5`
**Workers**: `{ zoom: 0.5 }`
**Range**: 0-1
**Default**: 0
**Behavior**: `0` = include background, `1` = crop close to face

### trim
Remove border (pixels to trim from edges).

**URL**: `trim=10`
**Workers**: `{ trim: 10 }`
**Range**: 0-100

---

## Effects

### blur
Gaussian blur radius.

**URL**: `blur=20`
**Workers**: `{ blur: 20 }`
**Range**: 1-250
**Use cases**: Privacy, background blur, LQIP placeholders

### sharpen
Sharpen intensity.

**URL**: `sharpen=3`
**Workers**: `{ sharpen: 3 }`
**Range**: 0-10
**Recommended**: 1-3 for subtle sharpening

### brightness
Brightness adjustment.

**URL**: `brightness=1.2`
**Workers**: `{ brightness: 1.2 }`
**Range**: 0-2
**Default**: 1 (no change)
**Examples**: `0.5` = darker, `1.5` = brighter

### contrast
Contrast adjustment.

**URL**: `contrast=1.1`
**Workers**: `{ contrast: 1.1 }`
**Range**: 0-2
**Default**: 1 (no change)

### gamma
Gamma correction.

**URL**: `gamma=1.5`
**Workers**: `{ gamma: 1.5 }`
**Range**: 0-2
**Default**: 1 (no change)
**Note**: `0` is ignored

---

## Rotation & Flipping

### rotate
Rotate image.

**Options**: `0`, `90`, `180`, `270`

**URL**: `rotate=90`
**Workers**: `{ rotate: 90 }`

### flip
Flip image.

**Options**:
- `h`: Horizontal flip
- `v`: Vertical flip
- `hv`: Both horizontal and vertical

**URL**: `flip=h`
**Workers**: `{ flip: 'h' }`

**Note**: Flipping is performed BEFORE rotation.

---

## Other

### background
Background color for transparency or padding.

**URL**: `background=rgb(255 0 0)` (CSS4 syntax)
**Workers**: `{ background: 'rgb(255 0 0)' }`
**Examples**:
- `background=white`
- `background=rgb(255 255 255)`
- `background=rgba(255 255 255 50)`

**Use with**: `fit=pad` or transparent images (PNG, WebP)

### metadata
EXIF metadata handling.

**Options**:
- `none`: Strip all metadata
- `copyright`: Keep only copyright tag
- `keep`: Preserve most EXIF metadata

**URL**: `metadata=keep`
**Workers**: `{ metadata: 'keep' }`
**Default**: `copyright` for JPEG, `none` for others

**Note**: Color profiles and EXIF rotation always applied, even if metadata stripped.

### anim
Preserve animation frames (GIF, WebP).

**URL**: `anim=false`
**Workers**: `{ anim: false }`
**Default**: `true`

**Use case**: Converting animated GIF to still image

---

## Combining Options

**URL Format**:
```
/cdn-cgi/image/width=800,height=600,fit=cover,quality=85,format=auto/image.jpg
```

**Workers Format**:
```javascript
fetch(imageURL, {
  cf: {
    image: {
      width: 800,
      height: 600,
      fit: 'cover',
      quality: 85,
      format: 'auto'
    }
  }
});
```

---

## Common Presets

### Thumbnail
```
width=300,height=300,fit=cover,quality=85,format=auto
```

### Avatar
```
width=200,height=200,fit=cover,gravity=face,quality=90,format=auto
```

### Hero
```
width=1920,height=1080,fit=cover,quality=85,format=auto
```

### Blur Placeholder (LQIP)
```
width=50,quality=10,blur=20,format=webp
```

### Product Image
```
width=800,height=800,fit=contain,sharpen=2,quality=90,format=auto
```

### Responsive (Mobile)
```
width=480,quality=85,format=auto
```

### Responsive (Tablet)
```
width=768,quality=85,format=auto
```

### Responsive (Desktop)
```
width=1920,quality=85,format=auto
```

---

## Limits

- **Max dimensions**: 10,000 x 10,000 pixels
- **Max area**: 100 megapixels
- **Max file size**: No published limit (but 10MB recommended)
- **Quality range**: 1-100
- **DPR range**: 1-3

---

## Official Documentation

- **Transform via URL**: https://developers.cloudflare.com/images/transform-images/transform-via-url/
- **Transform via Workers**: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
