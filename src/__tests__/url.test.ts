import { describe, expect, it } from "vitest";
import { url } from "../index";

describe("url", () => {
  it.each([
    // Basic URLs
    "https://example.com",
    "http://example.com",
    "https://www.example.com",

    // URLs with paths
    "https://example.com/path",
    "https://example.com/path/to/resource",
    "https://example.com/path/to/resource.html",

    // URLs with query strings
    "https://example.com?query=value",
    "https://example.com/path?query=value",
    "https://example.com/path?query=value&another=param",

    // URLs with fragments
    "https://example.com#section",
    "https://example.com/path#section",
    "https://example.com/path?query=value#section",

    // URLs with ports
    "https://example.com:8080",
    "http://localhost:3000",
    "http://localhost:3000/path",

    // URLs with authentication
    "https://user:password@example.com",
    "https://user@example.com",

    // IP addresses
    "http://192.168.1.1",
    "http://192.168.1.1:8080",
    "http://127.0.0.1",

    // Other protocols
    "ftp://ftp.example.com",
    "file:///path/to/file",
    "mailto:user@example.com",

    // URLs with special characters (encoded)
    "https://example.com/path%20with%20spaces",
    "https://example.com/path?query=hello%20world",

    // International domain names
    "https://例え.jp",
    "https://münchen.de",
  ])("should accept valid URL '%s'", (value) => {
    const result = url().unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    // Not a string
    123,
    true,
    false,
    null,
    undefined,
    [],
    {},
    () => {},
    Symbol("test"),
    NaN,
    Infinity,
    new Date(),
    /regex/,
    new Map(),
    new Set(),
  ])("should reject non-string value '%s'", (value) => {
    const result = url().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it.each([
    // Invalid URL strings
    "",
    "not a url",
    "example.com",
    "www.example.com",
    "://example.com",
    "http://",
    "https://",
    "just some text",
    "hello world",
    "123",
    " ",
    "http:// example.com",
    "http://example .com",
  ])("should reject invalid URL string '%s'", (value) => {
    const result = url().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "https://example.com";
    const result = url().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = url();
    expect(validator.schema).toEqual({ type: "url" });
  });

  it("should include schema information in error", () => {
    expect(url().unstable_validate(123).error).toMatchObject({
      context: { schema: { type: "url" } },
    });
  });

  it("should include 'schema-violation' type in error for non-string input", () => {
    const input = 123;
    const validator = url();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });

  it("should include 'schema-violation' type in error for invalid URL string", () => {
    const input = "not a url";
    const validator = url();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });
});
