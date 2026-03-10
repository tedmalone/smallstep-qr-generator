# Smallstep QR Code Generator

A web service that generates branded QR codes with the Smallstep logo embedded in the center. Built with Node.js, Express, React, and Sharp.

## Features

- QR code generation with embedded Smallstep logo
- Error correction level H (30% redundancy) for reliable scanning with logo overlay
- HTTPS-only URL validation
- PNG image and Base64 JSON response formats
- Responsive web UI for browser-based generation
- Direct API access for automation and scripting

## Quick Start

```bash
npm install
npm run dev
```

The app starts on port 5000 and serves both the API and the web UI.

## API Reference

### `GET /api/health`

Health check endpoint.

```bash
curl https://your-app-url/api/health
```

**Response:**
```json
{"status": "ok", "service": "qr-generator"}
```

### `GET /api/qr`

Generate a QR code with the Smallstep logo.

**Parameters:**

| Param    | Type   | Required | Default | Description                        |
|----------|--------|----------|---------|------------------------------------|
| `url`    | string | Yes      | -       | The HTTPS URL to encode            |
| `format` | string | No       | `png`   | Response format: `png` or `json`   |

**Example: Get PNG image**
```bash
curl "https://your-app-url/api/qr?url=https://smallstep.com" -o qr-code.png
```

**Example: Get Base64 JSON**
```bash
curl "https://your-app-url/api/qr?url=https://smallstep.com&format=json"
```

**JSON Response:**
```json
{
  "qr_code": "<base64-encoded PNG>",
  "url": "https://smallstep.com"
}
```

### Error Responses

All errors return structured JSON:

```json
{
  "error": true,
  "code": "INVALID_URL_SCHEME",
  "message": "only https URLs are accepted",
  "detail": "received: http://example.com"
}
```

**Error Codes:**

| Code                | HTTP Status | Description                            |
|---------------------|-------------|----------------------------------------|
| `MISSING_URL`       | 422         | `url` parameter not provided           |
| `EMPTY_URL`         | 422         | `url` is an empty string               |
| `INVALID_URL_SCHEME`| 400         | URL scheme is not `https`              |
| `URL_TOO_LONG`      | 400         | URL exceeds 2048 characters            |
| `INVALID_URL`       | 400         | URL is not valid                       |
| `INVALID_FORMAT`    | 400         | `format` is not `png` or `json`        |
| `INTERNAL_ERROR`    | 500         | Unexpected server error                |

## Project Structure

```
server/
  index.ts         - Express server entrypoint
  routes.ts        - API route handlers
  qr.ts            - QR generation logic, validation, logo embedding
  assets/          - Smallstep logo for QR code embedding
client/src/
  pages/home.tsx   - QR Generator web UI
  App.tsx          - React router setup
shared/
  schema.ts        - Shared TypeScript types
tests/
  qr.test.ts       - Unit tests for validation logic
  api.test.ts      - Integration tests for API endpoints
```

## Environment Variables

The following environment variables must be configured as Deployment Secrets in Replit (Deployments > Configuration > Secrets), or in a `.env` file for local development:

| Variable | Required | Description |
|----------|----------|-------------|
| `CONNECTORS_HOSTNAME` | Yes (Replit deploy) | The deployment base URL (e.g., `https://your-app.replit.dev`) |
| `REPLIT_CONNECTORS_HOSTNAME` | Yes (Replit deploy) | Same as `CONNECTORS_HOSTNAME` (Replit platform variable) |
| `SESSION_SECRET` | Yes | A random secret string for session signing. Generate with: `openssl rand -hex 32` |

> **Warning:** Without these variables configured in the Replit Deployment Secrets tab, the app will crash on startup with `TypeError: Invalid URL, input: 'undefined'`. See TED-11 for details.

## Running Tests

```bash
# Run all tests (unit + integration)
npm test

# Unit tests only (no server required)
npx jest tests/qr.test.ts --config jest.config.cjs

# API integration tests only (requires server running on port 5000)
npx jest tests/api.test.ts --config jest.config.cjs
```

## Technical Details

- **QR Engine:** `qrcode` npm package with error correction level H
- **Image Processing:** `sharp` for logo compositing with white padding and rounded corners
- **Logo Size:** Capped at 22% of QR code area (under the 25% max for scannability)
- **Logo Padding:** 6px white border with 8px rounded corners
- **QR Code Size:** 400x400 pixels, box size 10, border 4

## License

Internal tool for Smallstep.
