# Cloudflare Images API Reference

Complete API endpoints for Cloudflare Images.

**Base URL**: `https://api.cloudflare.com/client/v4/accounts/{account_id}`
**Batch API**: `https://batch.imagedelivery.net`

---

## Authentication

All requests require an API token with **Cloudflare Images: Edit** permission.

```bash
Authorization: Bearer <API_TOKEN>
```

Get API token: Dashboard → My Profile → API Tokens → Create Token

---

## Upload Endpoints

### Upload Image (File)

`POST /accounts/{account_id}/images/v1`

Upload an image file.

**Headers**:
- `Authorization: Bearer <API_TOKEN>`
- `Content-Type: multipart/form-data`

**Form Fields**:
- `file` (required): Image file
- `id` (optional): Custom ID (auto-generated if not provided)
- `requireSignedURLs` (optional): `true` for private images
- `metadata` (optional): JSON object (max 1024 bytes)

**Example**:
```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
  --header "Authorization: Bearer <API_TOKEN>" \
  --form 'file=@./image.jpg' \
  --form 'requireSignedURLs=false' \
  --form 'metadata={"key":"value"}'
```

**Response**:
```json
{
  "success": true,
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "filename": "image.jpg",
    "uploaded": "2022-01-31T16:39:28.458Z",
    "requireSignedURLs": false,
    "variants": [
      "https://imagedelivery.net/Vi7wi5KSItxGFsWRG2Us6Q/2cdc28f0.../public"
    ]
  }
}
```

---

### Upload via URL

`POST /accounts/{account_id}/images/v1`

Ingest image from external URL.

**Form Fields**:
- `url` (required): Image URL to ingest
- `id` (optional): Custom ID
- `requireSignedURLs` (optional): `true` for private images
- `metadata` (optional): JSON object

**Example**:
```bash
curl --request POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1 \
  --header "Authorization: Bearer <API_TOKEN>" \
  --form 'url=https://example.com/image.jpg' \
  --form 'metadata={"source":"external"}'
```

**Note**: Cannot use both `file` and `url` in same request.

---

### Direct Creator Upload

`POST /accounts/{account_id}/images/v2/direct_upload`

Generate one-time upload URL for user uploads.

**Headers**:
- `Authorization: Bearer <API_TOKEN>`
- `Content-Type: application/json`

**Body**:
```json
{
  "requireSignedURLs": false,
  "metadata": {"userId": "12345"},
  "expiry": "2025-10-26T18:00:00Z",
  "id": "custom-id"
}
```

**Fields**:
- `requireSignedURLs` (optional): `true` for private images
- `metadata` (optional): JSON object
- `expiry` (optional): ISO 8601 timestamp (default: 30min, max: 6hr)
- `id` (optional): Custom ID (cannot use with `requireSignedURLs=true`)

**Response**:
```json
{
  "success": true,
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "uploadURL": "https://upload.imagedelivery.net/..."
  }
}
```

**Frontend Upload**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]); // MUST be named 'file'

await fetch(uploadURL, {
  method: 'POST',
  body: formData // NO Content-Type header
});
```

---

## Image Management

### List Images

`GET /accounts/{account_id}/images/v2`

List all images (paginated).

**Query Params**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 100, max: 100)

**Example**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v2?page=1&per_page=50" \
  --header "Authorization: Bearer <API_TOKEN>"
```

**Response**:
```json
{
  "success": true,
  "result": {
    "images": [
      {
        "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
        "filename": "image.jpg",
        "uploaded": "2022-01-31T16:39:28.458Z",
        "requireSignedURLs": false,
        "variants": ["https://imagedelivery.net/.../public"]
      }
    ]
  }
}
```

---

### Get Image Details

`GET /accounts/{account_id}/images/v1/{image_id}`

Get details of specific image.

**Example**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/{image_id}" \
  --header "Authorization: Bearer <API_TOKEN>"
```

**Response**:
```json
{
  "success": true,
  "result": {
    "id": "2cdc28f0-017a-49c4-9ed7-87056c83901",
    "filename": "image.jpg",
    "uploaded": "2022-01-31T16:39:28.458Z",
    "requireSignedURLs": false,
    "draft": false,
    "variants": ["https://imagedelivery.net/.../public"]
  }
}
```

**Note**: `draft: true` means Direct Creator Upload not completed yet.

---

### Delete Image

`DELETE /accounts/{account_id}/images/v1/{image_id}`

Delete an image.

**Example**:
```bash
curl --request DELETE \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/{image_id}" \
  --header "Authorization: Bearer <API_TOKEN>"
```

**Response**:
```json
{
  "success": true
}
```

---

## Variants Management

### Create Variant

`POST /accounts/{account_id}/images/v1/variants`

Create a new variant.

**Body**:
```json
{
  "id": "thumbnail",
  "options": {
    "fit": "cover",
    "width": 300,
    "height": 300,
    "metadata": "none"
  },
  "neverRequireSignedURLs": false
}
```

**Options**:
- `fit`: `scale-down`, `contain`, `cover`, `crop`, `pad`
- `width`: Max width in pixels
- `height`: Max height in pixels
- `metadata`: `none`, `copyright`, `keep`

**Example**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/variants" \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{"id":"thumbnail","options":{"fit":"cover","width":300,"height":300}}'
```

---

### List Variants

`GET /accounts/{account_id}/images/v1/variants`

List all variants.

**Example**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1/variants" \
  --header "Authorization: Bearer <API_TOKEN>"
```

---

### Get Variant

`GET /accounts/{account_id}/images/v1/variants/{variant_id}`

Get specific variant details.

---

### Update Variant

`PATCH /accounts/{account_id}/images/v1/variants/{variant_id}`

Update existing variant.

**Body**:
```json
{
  "options": {
    "width": 350,
    "height": 350
  }
}
```

---

### Delete Variant

`DELETE /accounts/{account_id}/images/v1/variants/{variant_id}`

Delete a variant.

---

### Enable Flexible Variants

`PATCH /accounts/{account_id}/images/v1/config`

Enable or disable flexible variants (dynamic transformations).

**Body**:
```json
{
  "flexible_variants": true
}
```

---

## Batch API

Same endpoints as regular API, but different host and authentication.

**Host**: `https://batch.imagedelivery.net`
**Auth**: Batch token (create in Dashboard → Images → Batch API)

**Endpoints**:
- `POST /images/v1` - Upload image
- `GET /images/v2` - List images
- `DELETE /images/v1/{image_id}` - Delete image

**Example**:
```bash
curl "https://batch.imagedelivery.net/images/v1" \
  --header "Authorization: Bearer <BATCH_TOKEN>" \
  --form 'file=@./image.jpg'
```

---

## Error Codes

### HTTP Status Codes
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request (check error message)
- `401 Unauthorized` - Invalid or missing API token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `413 Payload Too Large` - File too large
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Cloudflare error
- `502 Bad Gateway` - Transformation error

### Cloudflare Errors
Check `errors` array in response:
```json
{
  "success": false,
  "errors": [
    {
      "code": 5400,
      "message": "Error description"
    }
  ]
}
```

Common error codes:
- `5400` - Invalid request
- `5408` - Upload timeout
- `5454` - Unsupported protocol

---

## Rate Limits

- **Standard uploads**: No published rate limits
- **Direct Creator Upload**: Limited by one-time URL expiry (default 30min, max 6hr)
- **Batch API**: Contact Cloudflare for high-volume needs

---

## Official Documentation

- **Images API**: https://developers.cloudflare.com/api/resources/images/
- **Upload Images**: https://developers.cloudflare.com/images/upload-images/
- **Direct Creator Upload**: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
- **Variants**: https://developers.cloudflare.com/images/manage-images/create-variants/
