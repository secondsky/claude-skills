# Content Credentials for Cloudflare Images

Guide to image authenticity, provenance tracking, and metadata preservation with Cloudflare Images.

---

## What Are Content Credentials?

Content Credentials are metadata standards that verify:
- **Image provenance** (where image came from)
- **Edit history** (modifications made to image)
- **Creator attribution** (who created/modified image)
- **Authenticity** (whether image is original or AI-generated)

**Key Standards**:
- **C2PA** (Coalition for Content Provenance and Authenticity)
- **IPTC Photo Metadata**
- **EXIF** (Exchangeable Image File Format)

---

## Metadata Preservation in Cloudflare Images

### Default Behavior

**By default**, Cloudflare Images:
- ✅ Preserves basic EXIF orientation
- ❌ Strips most EXIF metadata (GPS, camera info, copyright)
- ❌ Removes IPTC metadata
- ❌ Removes XMP metadata

**Reason**: Privacy and file size optimization

### Preserving Metadata

**During transformation**, use `metadata=keep`:

```html
<!-- Preserve all metadata -->
<img src="/cdn-cgi/image/metadata=keep,width=800/uploads/photo.jpg" />
```

**Via Workers**:
```typescript
return fetch(imageUrl, {
  cf: {
    image: {
      width: 800,
      metadata: 'keep' // Preserve metadata
    }
  }
});
```

**Trade-off**:
- ✅ Preserves creator info, copyright, GPS, camera data
- ⚠️ Larger file size (+5-15%)
- ⚠️ May expose sensitive data (GPS location)

---

## EXIF Metadata

### Common EXIF Fields

```typescript
interface EXIFMetadata {
  // Camera Information
  Make: string;              // "Canon"
  Model: string;             // "EOS R5"
  LensModel: string;         // "RF 24-70mm F2.8 L IS USM"

  // Capture Settings
  FNumber: number;           // f/2.8
  ExposureTime: string;      // "1/250"
  ISO: number;               // 400
  FocalLength: string;       // "50mm"

  // Date/Time
  DateTimeOriginal: string;  // "2025:01:15 14:23:45"
  DateTime: string;          // "2025:01:15 14:23:45"

  // Location (GPS)
  GPSLatitude: string;       // "37.7749° N"
  GPSLongitude: string;      // "122.4194° W"
  GPSAltitude: string;       // "10m"

  // Copyright
  Copyright: string;         // "© 2025 John Doe"
  Artist: string;            // "John Doe"

  // Image Properties
  Orientation: number;       // 1 (normal), 3 (180°), 6 (90° CW), 8 (90° CCW)
  XResolution: number;       // 72 DPI
  YResolution: number;       // 72 DPI
}
```

### Reading EXIF Data

**Using exif-js (Browser)**:
```typescript
import EXIF from 'exif-js';

async function readEXIF(imageFile: File): Promise<any> {
  return new Promise((resolve) => {
    EXIF.getData(imageFile as any, function(this: any) {
      const exifData = EXIF.getAllTags(this);
      resolve(exifData);
    });
  });
}

// Usage
const file = fileInput.files[0];
const exif = await readEXIF(file);
console.log('Camera:', exif.Make, exif.Model);
console.log('Copyright:', exif.Copyright);
```

**Using exifreader (Node.js)**:
```typescript
import ExifReader from 'exifreader';
import { readFile } from 'fs/promises';

const buffer = await readFile('photo.jpg');
const tags = ExifReader.load(buffer);

console.log('Copyright:', tags.Copyright?.description);
console.log('GPS:', tags.GPSLatitude?.description, tags.GPSLongitude?.description);
```

---

## IPTC Metadata

### IPTC Photo Metadata Standard

```typescript
interface IPTCMetadata {
  // Creator Information
  Creator: string[];              // Photographer name(s)
  CreatorJobTitle: string;        // "Photographer"
  CreatorAddress: string;
  CreatorCity: string;
  CreatorCountry: string;

  // Copyright
  CopyrightNotice: string;        // "© 2025 John Doe"
  RightsUsageTerms: string;       // "All rights reserved"
  WebStatement: string;           // URL to copyright info

  // Image Description
  Caption: string;                // Image description
  Headline: string;               // Brief title
  Keywords: string[];             // ["landscape", "sunset", "beach"]

  // Usage Rights
  CreditLine: string;             // "Photo by John Doe"
  Source: string;                 // "Example Photography"

  // Administrative
  DateCreated: string;            // "2025-01-15"
  IntellectualGenre: string;      // "Documentary Photography"
}
```

---

## C2PA Content Credentials

### What is C2PA?

The **Coalition for Content Provenance and Authenticity** provides standards for:
- Verifying image authenticity
- Tracking edits and modifications
- Attributing creators
- Detecting AI-generated content

**Supported by**:
- Adobe, Microsoft, Google, BBC, Sony, Nikon, Canon

### How C2PA Works

1. **Content Binding**:
   - Digital signature embedded in image
   - Links to external manifest (JSON)

2. **Manifest Contains**:
   - Creator information
   - Edit history
   - Assertions (original vs AI-generated)
   - Ingredients (source images)

3. **Verification**:
   - Check signature validity
   - Verify no tampering occurred
   - Display provenance to users

### Implementing C2PA

**Note**: Cloudflare Images doesn't natively support C2PA manifest creation. Implement before upload:

```typescript
// Pseudo-code (requires C2PA library)
import { createC2PAManifest } from 'c2pa';

async function addContentCredentials(
  imageBuffer: ArrayBuffer,
  metadata: {
    creator: string;
    title: string;
    createdDate: string;
    assertions: string[];
  }
): Promise<ArrayBuffer> {
  const manifest = createC2PAManifest({
    claim: {
      creator: metadata.creator,
      title: metadata.title,
      dateCreated: metadata.createdDate,
      assertions: metadata.assertions
    }
  });

  const signedImage = await manifest.embed(imageBuffer);
  return signedImage;
}

// Upload to Cloudflare Images
const credentialedImage = await addContentCredentials(imageBuffer, {
  creator: 'John Doe',
  title: 'Sunset at Beach',
  createdDate: '2025-01-15',
  assertions: ['human-created', 'no-ai-generation']
});

// Upload signedImage to Cloudflare...
```

---

## Preserving Copyright Information

### Add Copyright to Image

```typescript
import ExifWriter from 'exif-js';

async function addCopyright(
  imageBuffer: ArrayBuffer,
  copyrightText: string
): Promise<ArrayBuffer> {
  const exif = {
    Copyright: copyrightText,
    Artist: 'Your Name',
    ImageDescription: 'Image description'
  };

  // Write EXIF data
  const modifiedBuffer = await ExifWriter.insert(exif, imageBuffer);
  return modifiedBuffer;
}

// Usage
const copyrighted = await addCopyright(imageBuffer, '© 2025 Your Company. All Rights Reserved.');

// Upload to Cloudflare Images with metadata=keep
```

**Store in Database** (Alternative):
```typescript
// Store copyright info separately
await db.images.create({
  data: {
    cloudflareId: imageId,
    copyright: '© 2025 Your Company',
    creator: 'John Doe',
    license: 'All Rights Reserved',
    createdAt: new Date()
  }
});

// Display copyright from database (not embedded in image)
```

---

## AI-Generated Content Attribution

### Marking AI-Generated Images

**Metadata Approach**:
```typescript
await db.images.create({
  data: {
    cloudflareId: imageId,
    isAIGenerated: true,
    aiModel: 'DALL-E 3',
    prompt: 'A sunset over mountains',
    generatedAt: new Date()
  }
});
```

**Visible Watermark**:
```html
<div class="relative">
  <img src="https://images.yourdomain.com/ai-generated-id/public" alt="AI Generated" />
  <div class="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
    🤖 AI Generated
  </div>
</div>
```

**EXIF Custom Field**:
```typescript
const exif = {
  ImageDescription: 'AI Generated by DALL-E 3',
  Copyright: '© 2025 Your Company (AI Generated)',
  UserComment: 'Created with artificial intelligence'
};
```

---

## Privacy Considerations

### GPS Data Removal

**Why remove GPS data**:
- Privacy protection (home address, location tracking)
- Security concerns (sensitive locations)

**Cloudflare Images removes GPS by default** ✅

**Manual removal** (if needed before upload):
```typescript
import piexif from 'piexifjs';

function removeGPS(imageDataURL: string): string {
  const exif = piexif.load(imageDataURL);

  // Remove GPS data
  delete exif['GPS'];

  const exifBytes = piexif.dump(exif);
  const newDataURL = piexif.insert(exifBytes, imageDataURL);

  return newDataURL;
}
```

### Sensitive Metadata

**Metadata that may expose privacy**:
- GPS coordinates (exact location)
- Camera serial number (device tracking)
- Timestamps (when photo taken)
- Wi-Fi network names (in some camera models)

**Best practice**: Strip metadata for user-uploaded images unless specifically needed.

---

## Displaying Provenance to Users

### Photo Credit Display

```tsx
interface ImageWithCreditProps {
  imageId: string;
  creator: string;
  copyright: string;
  license: string;
}

export function ImageWithCredit({
  imageId,
  creator,
  copyright,
  license
}: ImageWithCreditProps) {
  return (
    <figure>
      <img
        src={`https://images.yourdomain.com/${imageId}/public`}
        alt={`Photo by ${creator}`}
      />
      <figcaption className="text-sm text-gray-600 mt-2">
        <div>Photo by {creator}</div>
        <div>{copyright}</div>
        <div>License: {license}</div>
      </figcaption>
    </figure>
  );
}
```

---

## Legal Compliance

### DMCA Compliance

If hosting user-uploaded images:

1. **Copyright Notice**:
   ```
   © [Year] [Owner]. All rights reserved.
   Unauthorized use prohibited.
   ```

2. **DMCA Agent**:
   - Designate agent for copyright complaints
   - Provide contact information
   - Register with US Copyright Office

3. **Takedown Process**:
   ```typescript
   async function processDMCATakedown(imageId: string) {
     // Remove from Cloudflare Images
     await fetch(
       `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
       {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${apiToken}` }
       }
     );

     // Mark in database
     await db.images.update({
       where: { cloudflareId: imageId },
       data: { status: 'dmca_removed', removedAt: new Date() }
     });
   }
   ```

---

## Best Practices

### 1. Strip Metadata for Privacy

```typescript
// For user uploads, remove GPS and sensitive data
await uploadImage(file, {
  stripMetadata: true // Default behavior in Cloudflare Images
});
```

### 2. Preserve Copyright for Attribution

```typescript
// For professional photography, keep copyright
await uploadImage(file, {
  preserveMetadata: true,
  metadata: {
    copyright: '© 2025 Photographer Name',
    creator: 'Photographer Name'
  }
});
```

### 3. Store Provenance Separately

```typescript
// Store in database for flexibility
await db.images.create({
  data: {
    cloudflareId,
    source: 'user_upload',
    originalFilename: file.name,
    uploadedBy: userId,
    copyright,
    license,
    provenance: {
      creator,
      dateCreated,
      editHistory: []
    }
  }
});
```

---

## Tools and Libraries

**EXIF Reading/Writing**:
- **exif-js**: https://github.com/exif-js/exif-js (Browser)
- **exifreader**: https://github.com/mattiasw/ExifReader (Node.js)
- **piexif**: https://github.com/hMatoba/piexifjs (Browser)

**C2PA Libraries**:
- **Adobe C2PA**: https://github.com/contentauth/c2pa-js (JavaScript)
- **C2PA Rust**: https://github.com/contentauth/c2pa-rs (Rust/WASM)

**Image Metadata Tools**:
- **ExifTool**: https://exiftool.org/ (CLI)
- **ImageMagick**: https://imagemagick.org/ (CLI)

---

## Related References

- **Upload API**: See `references/api-reference.md`
- **Transformations**: See `references/transformation-options.md`
- **Overlays/Watermarks**: See `references/overlays-watermarks.md`

---

## Official Documentation

- **Cloudflare Images**: https://developers.cloudflare.com/images/
- **C2PA**: https://c2pa.org/
- **IPTC**: https://www.iptc.org/standards/photo-metadata/
