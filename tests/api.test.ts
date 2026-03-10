const API_BASE = "http://localhost:5000";

describe("Health Endpoint", () => {
  it("GET /api/health returns ok", async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: "ok", service: "qr-generator" });
  });
});

describe("QR Generation Endpoint", () => {
  it("returns PNG for valid URL", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=https://smallstep.com`,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it("returns JSON with base64 for format=json", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=https://smallstep.com&format=json`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("qr_code");
    expect(body).toHaveProperty("url", "https://smallstep.com");
    const decoded = Buffer.from(body.qr_code, "base64");
    expect(decoded[0]).toBe(0x89);
    expect(decoded[1]).toBe(0x50);
  });

  it("generates non-zero size PNG with logo", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=https://smallstep.com`,
    );
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("handles URLs with query params", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=${encodeURIComponent("https://example.com/path?foo=bar")}&format=json`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://example.com/path?foo=bar");
  });

  it("handles very short URLs", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=https://x.co&format=json`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("qr_code");
  });
});

describe("Input Validation", () => {
  it("returns 422 for missing url param", async () => {
    const res = await fetch(`${API_BASE}/api/qr`);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe(true);
    expect(body.code).toBe("MISSING_URL");
  });

  it("returns 422 for empty url", async () => {
    const res = await fetch(`${API_BASE}/api/qr?url=`);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("EMPTY_URL");
  });

  it("returns 400 for http URL (non-https)", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=http://example.com`,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_URL_SCHEME");
    expect(body.message).toBe("only https URLs are accepted");
  });

  it("returns 400 for invalid URL", async () => {
    const res = await fetch(`${API_BASE}/api/qr?url=not-a-url`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_URL");
  });

  it("returns 400 for URL exceeding 2048 chars", async () => {
    const longUrl = "https://example.com/" + "a".repeat(2050);
    const res = await fetch(
      `${API_BASE}/api/qr?url=${encodeURIComponent(longUrl)}`,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("URL_TOO_LONG");
  });

  it("returns 400 for invalid format", async () => {
    const res = await fetch(
      `${API_BASE}/api/qr?url=https://example.com&format=gif`,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_FORMAT");
  });
});
