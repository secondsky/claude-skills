# Basic Upload Example

Minimal but complete example of uploading images to Cloudflare Images using Direct Creator Upload pattern.

## Features

- ✅ Direct Creator Upload (frontend → Cloudflare, no backend bottleneck)
- ✅ Cloudflare Worker backend for generating upload URLs
- ✅ Simple HTML/JavaScript frontend
- ✅ File validation (size, type)
- ✅ Upload progress tracking
- ✅ Error handling
- ✅ Success state with image display

## Project Structure

```
basic-upload/
├── README.md              # This file
├── package.json           # Dependencies
├── wrangler.jsonc         # Cloudflare Worker config
├── .env.example           # Example environment variables
├── src/
│   └── index.ts           # Worker: Upload URL generation
└── public/
    └── index.html         # Frontend: Upload form
```

## Prerequisites

- Node.js 18+ installed
- Cloudflare account with Images enabled
- Wrangler CLI: `npm install -g wrangler`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Cloudflare credentials:

```bash
CF_ACCOUNT_ID=your_account_id_here
CF_API_TOKEN=your_api_token_here
CF_ACCOUNT_HASH=your_account_hash_here
```

**Get your credentials:**
- **Account ID**: Cloudflare Dashboard → Workers & Pages → Account ID
- **API Token**: Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Images"
- **Account Hash**: Dashboard → Images → Serving Images → Account Hash

### 3. Update wrangler.jsonc

Edit `wrangler.jsonc` and replace `YOUR_ACCOUNT_ID` with your actual account ID:

```json
{
  "account_id": "your_account_id_here"
}
```

### 4. Run Locally

```bash
wrangler dev
```

This starts the Worker at `http://localhost:8787`

### 5. Open Frontend

Open `public/index.html` in your browser (or serve it locally):

```bash
# Option 1: Open directly
open public/index.html

# Option 2: Use a local server
npx serve public
```

### 6. Test Upload

1. Click "Choose File" and select an image
2. Click "Upload Image"
3. Watch progress bar (0-100%)
4. See uploaded image displayed on success

## How It Works

### Architecture

```
Browser                    Worker                  Cloudflare Images
   |                         |                            |
   |---(1) Request URL------>|                            |
   |                         |---(2) Generate URL-------->|
   |                         |<---(3) {uploadURL, id}-----|
   |<---(4) Return URL-------|                            |
   |                                                       |
   |--------------(5) Upload File to uploadURL----------->|
   |<-------------(6) 200 OK-------------------------------|
   |                                                       |
   |---(7) Display image from imagedelivery.net---------->|
```

### Step-by-Step

1. **User selects file**: Frontend validates size (<10MB) and type (JPEG/PNG/WebP/GIF)
2. **Frontend requests upload URL**: `POST http://localhost:8787/api/upload-url`
3. **Worker generates one-time URL**: Calls Cloudflare Images API `/direct_upload`
4. **Worker returns URL to frontend**: `{uploadURL, imageId}`
5. **Frontend uploads directly to Cloudflare**: `POST uploadURL` with `multipart/form-data`
6. **Cloudflare processes image**: Stores, generates variants, caches
7. **Frontend displays image**: Fetches from `imagedelivery.net`

### Key Code

**Worker (src/index.ts):**
```typescript
// Generate one-time upload URL
app.post('/api/upload-url', async (c) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.CF_API_TOKEN}` }
    }
  );

  const result = await response.json();
  return c.json({
    uploadURL: result.result.uploadURL,
    imageId: result.result.id
  });
});
```

**Frontend (public/index.html):**
```javascript
// Get upload URL
const { uploadURL, imageId } = await fetch('http://localhost:8787/api/upload-url', {
  method: 'POST'
}).then(r => r.json());

// Upload to Cloudflare
const formData = new FormData();
formData.append('file', file);

await fetch(uploadURL, {
  method: 'POST',
  body: formData
});

// Display uploaded image
img.src = `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/public`;
```

## Deploy to Production

### 1. Deploy Worker

```bash
wrangler deploy
```

This deploys your Worker to `https://basic-upload.YOUR_SUBDOMAIN.workers.dev`

### 2. Update Frontend

Edit `public/index.html` and replace `http://localhost:8787` with your Worker URL:

```javascript
const API_URL = 'https://basic-upload.YOUR_SUBDOMAIN.workers.dev';
```

### 3. Deploy Frontend

Deploy `public/index.html` to:
- Cloudflare Pages
- Vercel
- Netlify
- Any static hosting

## Troubleshooting

### Error: CORS Policy

**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: CORS headers are already configured in Worker. Ensure:
- Frontend is served from same origin as Worker, OR
- Update CORS origins in `src/index.ts`

### Error: Upload URL Expired

**Symptom**: Upload fails after waiting

**Solution**: Upload URLs expire after 30 minutes. Generate new URL for each upload.

### Error: File Too Large

**Symptom**: "File too large" error

**Solution**: Cloudflare Images max file size is 10MB. Compress image before upload.

### Error: Invalid File Type

**Symptom**: Upload rejected

**Solution**: Only JPEG, PNG, WebP, GIF supported. Convert other formats.

## Next Steps

### Add Features

- **Webhook**: Handle upload notifications (`templates/webhook-handler.ts`)
- **Database**: Store image metadata (Drizzle ORM + D1)
- **Variants**: Create named variants (`/generate-variant`)
- **Signed URLs**: Private images (`references/signed-urls-guide.md`)
- **Watermarks**: Add branding (`templates/overlay-watermark.ts`)

### Production Checklist

- [ ] Environment variables in Wrangler secrets (not `.env`)
- [ ] CORS origins restricted to your domain
- [ ] Rate limiting on upload URL generation
- [ ] File validation server-side (not just client-side)
- [ ] Error logging and monitoring
- [ ] CDN caching configured
- [ ] Variants created for common sizes

## Related Examples

- **Responsive Gallery**: Complete gallery with responsive images
- **Private Images**: Signed URLs for access control

## Related References

- **Direct Upload Guide**: `references/direct-upload-complete-workflow.md`
- **API Reference**: `references/api-reference.md`
- **Worker Template**: `templates/worker-upload.ts`
