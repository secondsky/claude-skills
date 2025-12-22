# Cloudflare Images Complete Setup Guide

Quick setup walkthrough for Cloudflare Images API and Transformations.

---

## Step 1: Enable Cloudflare Images

1. Log into Cloudflare Dashboard
2. Navigate to **Images**
3. Click **Enable**
4. Note your **Account ID** and **Account Hash**

---

## Step 2: Create API Token

1. Go to **API Tokens** in dashboard
2. Click **Create Token**
3. Grant **Cloudflare Images: Edit** permission
4. Save token securely (it won't be shown again)

**Required permissions:**
- Cloudflare Images: Edit

---

## Step 3: Upload First Image

### Via cURL:

```bash
curl --request POST \
  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1 \
  --header 'Authorization: Bearer <API_TOKEN>' \
  --header 'Content-Type: multipart/form-data' \
  --form 'file=@./photo.jpg'
```

### Via TypeScript:

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: formData
  }
);

const { result } = await response.json();
console.log('Image ID:', result.id);
console.log('URL:', result.variants[0]);
```

---

## Step 4: Serve Images

**Public images:**

```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public" />
```

**With transformations:**

```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/width=800" />
```

---

## Step 5: Enable Image Transformations

For transforming any image (not just uploaded ones):

1. Dashboard → **Images** → **Transformations**
2. Select your zone (domain)
3. Click **Enable for zone**

Now you can transform any image on your domain:

```html
<img src="/cdn-cgi/image/width=800,quality=85/uploads/photo.jpg" />
```

---

## Step 6: Create Variants (Optional)

Variants are predefined transformations:

1. Dashboard → **Images** → **Variants**
2. Click **Create variant**
3. Name: `thumbnail` (or any name)
4. Configure: width=200, height=200, fit=cover
5. Save

Use in URLs:

```html
<img src="https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/thumbnail" />
```

---

## Step 7: Direct Creator Upload (User Uploads)

For allowing users to upload without exposing API keys:

### Backend:

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    }
  }
);

const { result } = await response.json();
const uploadURL = result.uploadURL;

// Send uploadURL to frontend
return new Response(JSON.stringify({ uploadURL }));
```

### Frontend:

```typescript
const formData = new FormData();
formData.append('file', file);

await fetch(uploadURL, {
  method: 'POST',
  body: formData
});
```

**Load `references/direct-upload-complete-workflow.md` for complete implementation.**

---

## Production Checklist

- [ ] API token created and stored securely
- [ ] Account ID and Account Hash documented
- [ ] Direct upload CORS configured (if using from browser)
- [ ] Variants created for common sizes
- [ ] Image Transformations enabled for zones (if needed)
- [ ] Signed URLs configured for private images (if needed)
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Batch upload logic implemented (if needed)
- [ ] Responsive images with srcset configured

---

## Official Documentation

- **Images Overview**: https://developers.cloudflare.com/images/
- **Upload API**: https://developers.cloudflare.com/images/upload-images/
- **Transformations**: https://developers.cloudflare.com/images/transform-images/
- **Direct Creator Upload**: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
