import request from "supertest";
import { createApp } from "../server/app";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  app = await createApp();
});

describe("Health Endpoint", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", service: "qr-generator" });
  });
});

describe("QR Generation Endpoint", () => {
  it("returns PNG for valid URL", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://smallstep.com" });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/png/);
    const buffer = Buffer.from(res.body);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it("returns JSON with base64 for format=json", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://smallstep.com", format: "json" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("qr_code");
    expect(res.body).toHaveProperty("url", "https://smallstep.com");
    const decoded = Buffer.from(res.body.qr_code, "base64");
    expect(decoded[0]).toBe(0x89);
    expect(decoded[1]).toBe(0x50);
  });

  it("generates non-zero size PNG with logo", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://smallstep.com" });
    expect(res.body.length).toBeGreaterThan(1000);
  });

  it("handles URLs with query params", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://example.com/path?foo=bar", format: "json" });
    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://example.com/path?foo=bar");
  });

  it("handles very short URLs", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://x.co", format: "json" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("qr_code");
  });
});

describe("Input Validation", () => {
  it("returns 422 for missing url param", async () => {
    const res = await request(app).get("/api/qr");
    expect(res.status).toBe(422);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe("MISSING_URL");
  });

  it("returns 422 for empty url", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("EMPTY_URL");
  });

  it("returns 400 for http URL (non-https)", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "http://example.com" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_URL_SCHEME");
    expect(res.body.message).toBe("only https URLs are accepted");
  });

  it("returns 400 for invalid URL", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "not-a-url" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_URL");
  });

  it("returns 400 for URL exceeding 2048 chars", async () => {
    const longUrl = "https://example.com/" + "a".repeat(2050);
    const res = await request(app)
      .get("/api/qr")
      .query({ url: longUrl });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("URL_TOO_LONG");
  });

  it("returns 400 for invalid format", async () => {
    const res = await request(app)
      .get("/api/qr")
      .query({ url: "https://example.com", format: "gif" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_FORMAT");
  });
});
