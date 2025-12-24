# R2 CORS Configuration Guide

**Last Updated**: 2025-11-26
**Official Docs**: https://developers.cloudflare.com/r2/buckets/cors/

---

## Dashboard Configuration

1. Cloudflare Dashboard → R2 → Your bucket
2. Settings tab → CORS Policy → Add CORS policy

---

## Common Scenarios

### Public Assets (Read-Only)

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["Range"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Use when**: Serving public images, videos, or static assets from R2.

### Upload/Download (Full Access)

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-MD5"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Use when**: Allowing browser uploads and downloads from specific domain.

### Development Environment

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Use when**: Local development and testing.

---

## Troubleshooting CORS Errors

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: CORS not configured or origin not allowed.

**Solution**:
1. Add origin to `AllowedOrigins` in bucket CORS policy
2. Verify method is in `AllowedMethods`
3. For `*` origin, ensure credentials mode is not 'include'

### Error: "CORS policy: Request header field X is not allowed"

**Cause**: Custom header not in `AllowedHeaders`.

**Solution**: Add header to `AllowedHeaders` or use `["*"]` for development.

### Error: Presigned URLs failing with CORS

**Cause**: Presigned URLs bypass worker CORS headers.

**Solution**: Configure CORS at bucket level (Dashboard), not in Worker.

---

## Security Best Practices

1. **Never use `["*"]` origin in production** - Always specify exact domains
2. **Limit methods** - Only allow methods your app actually uses
3. **Set reasonable MaxAgeSeconds** - 3600 (1 hour) is typically sufficient
4. **Use ExposeHeaders** - Include ETag for caching validation
5. **Consider preflight caching** - Higher MaxAgeSeconds reduces preflight requests

---

## Testing CORS Configuration

```bash
# Test GET request
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://bucket.account.r2.cloudflarestorage.com/file.txt

# Should return Access-Control-Allow-Origin header
```

See `templates/r2-cors-config.json` for more examples.
