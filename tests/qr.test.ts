import { validateUrl, validateFormat } from "../server/qr";

describe("URL Validation", () => {
  it("rejects missing url parameter", () => {
    const result = validateUrl(undefined);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("MISSING_URL");
    expect(result!.message).toBe("url parameter is required");
  });

  it("rejects empty url", () => {
    const result = validateUrl("");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("EMPTY_URL");
    expect(result!.message).toBe("url must not be empty");
  });

  it("rejects whitespace-only url", () => {
    const result = validateUrl("   ");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("EMPTY_URL");
  });

  it("rejects http URLs (non-https)", () => {
    const result = validateUrl("http://example.com");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVALID_URL_SCHEME");
    expect(result!.message).toBe("only https URLs are accepted");
    expect(result!.detail).toContain("http://example.com");
  });

  it("rejects ftp URLs", () => {
    const result = validateUrl("ftp://files.example.com");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVALID_URL_SCHEME");
  });

  it("rejects invalid URLs", () => {
    const result = validateUrl("not-a-url");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVALID_URL");
    expect(result!.message).toBe("url is not a valid URL");
  });

  it("rejects URLs exceeding 2048 characters", () => {
    const longUrl = "https://example.com/" + "a".repeat(2050);
    const result = validateUrl(longUrl);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("URL_TOO_LONG");
  });

  it("accepts valid https URLs", () => {
    const result = validateUrl("https://smallstep.com");
    expect(result).toBeNull();
  });

  it("accepts https URLs with paths and query params", () => {
    const result = validateUrl("https://example.com/path?foo=bar&baz=qux");
    expect(result).toBeNull();
  });

  it("accepts short https URLs", () => {
    const result = validateUrl("https://x.co");
    expect(result).toBeNull();
  });
});

describe("Format Validation", () => {
  it("accepts png format", () => {
    const result = validateFormat("png");
    expect(result).toBeNull();
  });

  it("accepts json format", () => {
    const result = validateFormat("json");
    expect(result).toBeNull();
  });

  it("accepts undefined format (defaults to png)", () => {
    const result = validateFormat(undefined);
    expect(result).toBeNull();
  });

  it("rejects invalid format", () => {
    const result = validateFormat("gif");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVALID_FORMAT");
    expect(result!.detail).toContain("gif");
  });

  it("rejects svg format", () => {
    const result = validateFormat("svg");
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVALID_FORMAT");
  });
});
