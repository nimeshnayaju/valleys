import { describe, expect, it } from "vitest";
import { url } from "..";

describe("url", () => {
  it.each([
    // Basic URLs
    "https://example.com/",
    "http://example.com/",
    "https://www.example.com/",

    // URLs with paths
    "https://example.com/path",
    "https://example.com/path/to/resource",
    "https://example.com/path/to/resource.html",

    // URLs with query strings
    "https://example.com/?query=value",
    "https://example.com/path?query=value",
    "https://example.com/path?query=value&another=param",

    // URLs with fragments
    "https://example.com/#section",
    "https://example.com/path#section",
    "https://example.com/path?query=value#section",

    // URLs with ports
    "https://example.com:8080/",
    "http://localhost:3000/",
    "http://localhost:3000/path",

    // URLs with authentication
    "https://user:password@example.com/",
    "https://user@example.com/",

    // IP addresses
    "http://192.168.1.1/",
    "http://192.168.1.1:8080/",
    "http://127.0.0.1/",

    // Other protocols
    "ftp://ftp.example.com/",
    "file:///path/to/file",
    "mailto:user@example.com",

    // Any scheme passes; callers check the protocol where it matters
    "javascript:alert(1)",

    // URLs with special characters (encoded)
    "https://example.com/path%20with%20spaces",
    "https://example.com/path?query=hello%20world",

    // International domain names (serialized in punycode)
    "https://xn--r8jz45g.jp/",
    "https://xn--mnchen-3ya.de/"
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
    new Set()
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
    "http://example .com"
  ])("should reject invalid URL string '%s'", (value) => {
    const result = url().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it.each([
    // Serialization adds the "/" path
    "https://example.com",
    // Scheme and host are lowercased
    "HTTPS://EXAMPLE.COM/",
    // Surrounding whitespace is stripped
    " https://example.com/",
    "https://example.com/\n",
    // Tab is removed
    "https://exa\tmple.com/",
    // Backslashes are read as slashes
    "http:\\\\example.com\\path",
    // Missing slashes are added
    "https:example.com",
    // An extra slash is ignored
    "https:///example.com/",
    // Default port is dropped
    "https://example.com:443/",
    // Dot segments are resolved
    "https://example.com/a/../b",
    // Unicode host is converted to punycode
    "https://例え.jp/",
    // Space is percent-encoded
    "https://example.com/a b",
    // IPv4 host is rewritten to 127.0.0.1
    "http://0x7f.1/"
  ])("should reject parseable URL '%s' that isn't in serialized form", (value) => {
    expect(URL.parse(value)).not.toBeNull();
    const result = url().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: value,
      schema: { type: "url" },
      rules: {}
    });
  });

  it("should return the original value", () => {
    const value = "https://example.com/";
    const result = url().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = url();
    expect(validator.schema).toEqual({ type: "url" });
  });

  it("should include schema information in error", () => {
    expect(url().unstable_validate(123).error).toMatchObject({
      schema: { type: "url" }
    });
  });

  it("should include 'schema-mismatch' type in error for non-string input", () => {
    const input = 123;
    const validator = url();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: input
    });
  });

  it("should include 'schema-mismatch' type in error for invalid URL string", () => {
    const input = "not a url";
    const validator = url();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: input
    });
  });
});
