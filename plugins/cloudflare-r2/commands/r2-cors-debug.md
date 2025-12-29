---
name: cloudflare-r2:cors-debug
description: Diagnose and fix CORS configuration errors
---

# R2 CORS Debugger

Systematically diagnose and fix CORS (Cross-Origin Resource Sharing) configuration issues for R2 buckets.

## Required Information

1. **Bucket name**: `{{bucket_name}}`
2. **Origin domain** (e.g., https://example.com): `{{origin}}`
3. **Methods needed** (e.g., GET, PUT, POST, DELETE): `{{methods}}`
4. **Error message** (from browser console, if any): `{{error_message}}`

## What This Command Does

1. **Checks current CORS policy** on bucket
2. **Generates correct CORS configuration** for your use case
3. **Provides curl test commands** to verify setup
4. **Shows Dashboard configuration steps**
5. **Explains common CORS pitfalls**

## Common CORS Errors

| Error Message | Cause | Fix |
|---------------|-------|-----|
| "No 'Access-Control-Allow-Origin' header" | Missing origin in AllowedOrigins | Add your domain |
| "Method PUT is not allowed" | Method not in AllowedMethods | Add PUT to allowed methods |
| "Header 'Content-Type' not allowed" | Header not in AllowedHeaders | Add Content-Type |
| "Credentials mode requires specific origin" | Using wildcard with credentials | Use specific origin |

## CORS Configuration Template

```json
[
  {
    "AllowedOrigins": [
      "https://example.com",
      "https://www.example.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Authorization",
      "X-Requested-With"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## Dashboard Configuration Steps

1. Navigate to **R2** → Select your bucket
2. Click **Settings** tab
3. Scroll to **CORS Policy** section
4. Click **Edit CORS policy**
5. Paste JSON configuration
6. Click **Save**

## Testing CORS with curl

```bash
# Test preflight request (OPTIONS)
curl -v \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  "https://{{bucket_name}}.{{account_id}}.r2.cloudflarestorage.com/test.txt"

# Expected response headers:
# Access-Control-Allow-Origin: https://example.com
# Access-Control-Allow-Methods: GET, PUT, POST, DELETE
# Access-Control-Allow-Headers: Content-Type
# Access-Control-Max-Age: 3600

# Test actual request (PUT)
curl -v \
  -H "Origin: https://example.com" \
  -H "Content-Type: text/plain" \
  -X PUT \
  "https://{{bucket_name}}.{{account_id}}.r2.cloudflarestorage.com/test.txt" \
  -d "Test data"

# Expected response headers:
# Access-Control-Allow-Origin: https://example.com
# Access-Control-Expose-Headers: ETag
```

## Common Use Cases

### Browser Upload

```json
{
  "AllowedOrigins": ["https://myapp.com"],
  "AllowedMethods": ["PUT", "POST"],
  "AllowedHeaders": ["Content-Type"],
  "MaxAgeSeconds": 3600
}
```

### Browser Download

```json
{
  "AllowedOrigins": ["https://myapp.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range"],
  "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
  "MaxAgeSeconds": 3600
}
```

### Full Access (Development)

```json
{
  "AllowedOrigins": ["http://localhost:3000"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

## Security Best Practices

1. **Never use wildcard (*) in production** - Specify exact origins
2. **Limit methods** - Only allow methods you actually need
3. **HTTPS only in production** - Don't allow HTTP origins
4. **Set reasonable MaxAgeSeconds** - 3600 (1 hour) is good default
5. **Don't expose unnecessary headers** - Limit ExposeHeaders
6. **Test after changes** - Always verify CORS works before deploying

## Troubleshooting Checklist

- [ ] CORS policy configured on R2 bucket (not just Worker)
- [ ] Origin matches exactly (including protocol and port)
- [ ] All required methods are in AllowedMethods
- [ ] All custom headers are in AllowedHeaders
- [ ] Browser is sending preflight OPTIONS request
- [ ] Bucket name and account ID are correct in URL
- [ ] Testing with actual browser (not just curl)
- [ ] Clear browser cache if policy was recently changed
