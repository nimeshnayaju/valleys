import { describe, expect, it } from "vitest";
import { string } from "..";

describe("string", () => {
  it.each([
    // Basic cases
    "hello",

    // Edge cases
    "", // empty string
    " ", // space
    "123", // numeric string
    "true", // boolean-like string
    "null", // null-like string
    "undefined", // undefined-like string

    // Special characters
    "!@#$%^&*()",
    "hello\nworld", // newline
    "hello\tworld", // tab
    "hello\\world", // backslash
    'hello"world', // quotes
    "hello'world", // single quotes

    // Unicode and emojis
    "你好世界", // Chinese
    "مرحبا بالعالم", // Arabic
    "🌍🚀✨", // emojis
    "café", // accented characters

    // Very long string
    "a".repeat(10000)
  ])("should accept string '%s'", (value) => {
    const result = string().unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    123, // number
    true, // boolean
    false, // boolean
    null, // null
    undefined, // undefined
    [], // array
    {}, // object
    () => {}, // function
    Symbol("test"), // symbol
    NaN, // NaN
    Infinity, // Infinity
    -Infinity, // -Infinity
    new Date(), // Date object
    /regex/, // RegExp
    new Map(), // Map
    new Set() // Set
  ])("should reject value '%s'", (value) => {
    const result = string().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "hello";
    const result = string().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = string();
    expect(validator.schema).toEqual({ type: "string" });
  });

  it.each([{}, { minLength: 5 }, { maxLength: 10 }, { minLength: 5, maxLength: 10 }])(
    "should include rules %s",
    (rules) => {
      const validator = string(rules);
      expect(validator.rules).toEqual(rules);
    }
  );

  it("should include schema information in error", () => {
    expect(string().unstable_validate(123).error).toMatchObject({
      schema: { type: "string" }
    });
  });

  it.each([
    { input: "123", rules: { minLength: 5 } },
    { input: "1234567890", rules: { maxLength: 5 } },
    { input: "123", rules: { minLength: 5, maxLength: 10 } }
  ])("should include rules information in error", ({ input, rules }) => {
    expect(string(rules).unstable_validate(input).error).toMatchObject({
      rules
    });
  });

  it("should report a schema mismatch", () => {
    const input = 123;
    const validator = string();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: input
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it.each([
        { input: "abc", rules: { minLength: 3 } },
        { input: "hello", rules: { minLength: 5 } },
        { input: "a very long string", rules: { minLength: 10 } }
      ])("should accept string $input meeting minimum length $rules.minLength", ({ input, rules }) => {
        const result = string(rules).unstable_validate(input);
        expect(result.value).toBe(input);
        expect(result.error).toBeUndefined();
      });

      it.each([
        { input: "abc", rules: { minLength: 5 } },
        { input: "hello", rules: { minLength: 10 } },
        { input: "a very long string", rules: { minLength: 20 } }
      ])("should reject string $input shorter than minimum length $rules.minLength", ({ input, rules }) => {
        const result = string(rules).unstable_validate(input);
        expect(result.value).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it("should report a minLength rule violation", () => {
        const input = "abc";
        const validator = string({ minLength: 5 });
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "minLength",
          input: input
        });
      });
    });

    describe("maxLength", () => {
      it.each([
        { input: "abc", rules: { maxLength: 3 } },
        { input: "hello", rules: { maxLength: 5 } },
        { input: "a very long string", rules: { maxLength: 20 } }
      ])("should accept string $input meeting maximum length $rules.maxLength", ({ input, rules }) => {
        const result = string(rules).unstable_validate(input);
        expect(result.value).toBe(input);
        expect(result.error).toBeUndefined();
      });

      it.each([
        { input: "abc", rules: { maxLength: 2 } },
        { input: "hello", rules: { maxLength: 1 } },
        { input: "a very long string", rules: { maxLength: 5 } }
      ])("should reject string $input longer than maximum length $rules.maxLength", ({ input, rules }) => {
        const result = string(rules).unstable_validate(input);
        expect(result.value).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it("should report a maxLength rule violation", () => {
        const input = "abc";
        const validator = string({ maxLength: 2 });
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "maxLength",
          input: input
        });
      });
    });
  });

  describe("length units", () => {
    it("should count UTF-16 code units for maxLength", () => {
      const rejected = string({ maxLength: 1 }).unstable_validate("🌍");
      expect(rejected.value).toBeUndefined();
      expect(rejected.error).toMatchObject({
        type: "rule-violation",
        rule: "maxLength",
        input: "🌍"
      });

      const accepted = string({ maxLength: 2 }).unstable_validate("🌍");
      expect(accepted.value).toBe("🌍");
      expect(accepted.error).toBeUndefined();
    });
  });
});
