# stems-api: File Upload Endpoints Spec

## Context

The `stem` web app now supports image and PDF artifacts. The client-side UI is built — it uploads files to `api.stem.md/upload` and saves the returned `file_key` on the artifact record. This spec covers what needs to be built in the `stems-api` Worker.

## Prerequisites

- R2 bucket bound in `wrangler.toml` as `BUCKET` (or whatever the existing binding name is)
- Workers AI binding in `wrangler.toml` as `AI` for NSFW scanning
- CSAM scanning enabled on the R2 bucket (already configured)

### wrangler.toml additions needed:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "stem-uploads"  # or whatever you name it

[ai]
binding = "AI"
```

## Endpoints

### POST /upload

Accepts a multipart file upload, validates it, scans for NSFW content, stores in R2, returns the file key.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` field with the uploaded file
- Auth: session cookie (same auth as other endpoints)

**Validation (in order):**
1. User must be authenticated
2. User must have at least 1 approved artifact with a URL (upload gate): `SELECT COUNT(*) as c FROM artifacts WHERE added_by = ? AND status = 'approved' AND url IS NOT NULL`
3. File must be present
4. MIME type must be in allowlist (validate from actual file bytes, not just the extension):
   - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - Documents: `application/pdf`
5. File size limits:
   - Images: max 10MB (10 * 1024 * 1024 bytes)
   - PDFs: max 25MB (25 * 1024 * 1024 bytes)
6. Per-user storage quota: 100MB total. Query: `SELECT COALESCE(SUM(file_size), 0) as total FROM artifacts WHERE added_by = ? AND file_key IS NOT NULL`. Reject if `total + new_file_size > 104857600`
7. NSFW scan (images only — see below)

**NSFW Scanning (images only):**
```javascript
const response = await env.AI.run("@cf/microsoft/resnet-50", {
  image: [...new Uint8Array(fileBuffer)]
});
// Check if any NSFW-related label has confidence > 0.7
// Labels to flag: varies by model — log the response during development to understand the output format
```

Alternative using Cloudflare's dedicated NSFW model:
```javascript
const response = await env.AI.run("@cf/cloudflare/nsfw-detection", {
  image: [...new Uint8Array(fileBuffer)]
});
// Returns { nsfw_score: number } — reject if nsfw_score > 0.8
```

If flagged as NSFW: return `{ error: "This image was flagged by our content filter. Please upload a different image." }` with status 400.

**Storage:**
- Generate key: `uploads/${userId}/${nanoid(16)}.${extension}`
- Store in R2: `await env.BUCKET.put(key, fileBuffer, { httpMetadata: { contentType: mime } })`

**Response (success):**
```json
{
  "file_key": "uploads/usr_abc123/xK9mN2pQ4rS7tV0w.jpg",
  "file_mime": "image/jpeg",
  "file_size": 245760
}
```

**Response (error):**
```json
{ "error": "File too large. Maximum size for images is 10MB." }
```

**Error responses:**
- 401: Not authenticated
- 403: Upload gate not met ("Add a link artifact first to unlock file uploads")
- 400: No file / invalid type / too large / NSFW flagged / quota exceeded

### GET /files/:key

Serves files from R2 with safe headers.

**Request:**
- Method: GET
- Path: `/files/uploads/usr_abc123/xK9mN2pQ4rS7tV0w.jpg` (the full key after `/files/`)
- No auth required (files are public once uploaded — they're tied to public artifacts)

**Implementation:**
```javascript
const key = request.url.split("/files/")[1];
const object = await env.BUCKET.get(key);
if (!object) return new Response("Not found", { status: 404 });

const headers = new Headers();
headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
headers.set("Cache-Control", "public, max-age=31536000, immutable");
headers.set("X-Content-Type-Options", "nosniff");

// Force download for PDFs (prevents inline execution)
if (object.httpMetadata?.contentType === "application/pdf") {
  headers.set("Content-Disposition", "attachment");
}

return new Response(object.body, { headers });
```

### DELETE /files/:key (internal, called when artifact is deleted)

When an artifact with a file_key is deleted, the file should be cleaned up from R2.

This can be triggered from the `stem` web app's `delete_artifact` action by calling:
```
fetch(`https://api.stem.md/files/${artifact.file_key}`, { method: "DELETE", credentials: "include" })
```

**Implementation:**
```javascript
// Require admin or the file owner
await env.BUCKET.delete(key);
return new Response(null, { status: 204 });
```

## MIME Type Validation

Do NOT trust the Content-Type header from the upload. Check the actual file bytes (magic numbers):

```javascript
function detectMimeType(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png";
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  // PDF: 25 50 44 46
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  return null; // Unknown/disallowed type
}
```

## Storage Quota Check

```javascript
const quotaResult = await env.DB.prepare(
  "SELECT COALESCE(SUM(file_size), 0) as total FROM artifacts WHERE added_by = ? AND file_key IS NOT NULL"
).bind(userId).first();

const currentUsage = quotaResult?.total ?? 0;
const MAX_QUOTA = 100 * 1024 * 1024; // 100MB

if (currentUsage + fileSize > MAX_QUOTA) {
  return Response.json(
    { error: `Storage quota exceeded. You've used ${Math.round(currentUsage / 1024 / 1024)}MB of 100MB.` },
    { status: 400 }
  );
}
```

## Upload Gate Check

```javascript
const gateResult = await env.DB.prepare(
  "SELECT COUNT(*) as c FROM artifacts WHERE added_by = ? AND status = 'approved' AND url IS NOT NULL"
).bind(userId).first();

if ((gateResult?.c ?? 0) < 1) {
  return Response.json(
    { error: "Add a link artifact first to unlock file uploads." },
    { status: 403 }
  );
}
```

## CORS

The upload endpoint will be called from `stem.md` (different origin from `api.stem.md`). Ensure CORS headers are set:

```javascript
headers.set("Access-Control-Allow-Origin", "https://stem.md");
headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
headers.set("Access-Control-Allow-Headers", "Content-Type");
headers.set("Access-Control-Allow-Credentials", "true");
```

Handle OPTIONS preflight requests.

## Testing

1. Upload a JPEG < 10MB — should succeed, return file_key
2. Upload a PDF < 25MB — should succeed
3. Upload a .exe renamed to .jpg — should fail (MIME check catches it)
4. Upload when quota would be exceeded — should fail with quota message
5. Upload as new user with 0 artifacts — should fail with gate message
6. GET /files/:key — should serve the file with correct Content-Type
7. Upload NSFW image — should be rejected by Workers AI scan
8. Verify CSAM scanning catches flagged content (Cloudflare handles this at the R2 level)
