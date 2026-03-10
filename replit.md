# Smallstep QR Code Generator

## Overview
A web service that generates QR codes with the Smallstep logo embedded in the center. Built with Node.js/Express backend and React frontend.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js API
- **QR Generation**: `qrcode` npm package with `sharp` for image compositing

## Key Features
- QR code generation with Smallstep logo overlay
- Error correction level H (30% redundancy for logo overlay)
- HTTPS-only URL validation
- PNG and JSON (base64) response formats
- Responsive web UI
- Direct API access via curl

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/qr?url=<url>&format=<png|json>` - Generate QR code

## Project Structure
```
server/
  qr.ts          - QR generation logic + validation
  routes.ts      - API route handlers
  assets/        - Smallstep logo for embedding
client/src/
  pages/home.tsx - Main QR generator UI
  App.tsx        - Router setup
shared/
  schema.ts      - Shared TypeScript types
```

## Linear Integration
Built from issues in the "QR Code Generator" project under the "Ted's Lab" team.
Issues: TED-1 through TED-8

## Running
`npm run dev` starts both Express backend and Vite frontend dev server on port 5000.
