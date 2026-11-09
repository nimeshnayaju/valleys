import { describe, expect, it } from "vitest";
import { constant } from "..";

describe("constant", () => {
  it.each([
    // String constants
    "hello",
    "",
    " ",
    "123",
    "true",
    "false",
    "null",
    "undefined",
    "!@#$%^&*()",
    "hello\nworld",
    "hello\tworld",
    "hello\\world",
    'hello"world',
    "hello'world",
    "你好世界",
    "مرحبا بالعالم",
    "🌍🚀✨",
    "café",
    "a".repeat(10000),

    // Number constants
    0,
    1,
    -1,
    42,
    3.14,
    -123,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
    Infinity,
    -Infinity,

    // Boolean constants
    true,
    false,

    // Null
    null
  ])("should accept constant value %s", (value) => {
    const validator = constant(value);
    const result = validator.unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    // Test with different string constants
    { constant: "hello", invalid: "Hello" },
    { constant: "hello", invalid: "hello " },
    { constant: "hello", invalid: " hello" },
    { constant: "hello", invalid: "HELLO" },
    { constant: "hello", invalid: "" },
    { constant: "hello", invalid: "world" },
    { constant: "", invalid: " " },
    { constant: "", invalid: "a" },
    { constant: "!@#$%^&*()", invalid: "!@#$%^&*" },
    { constant: "你好🌍", invalid: "你好" },
    { constant: "你好🌍", invalid: "🌍" },

    // Test with different number constants
    { constant: 42, invalid: 41 },
    { constant: 42, invalid: 43 },
    { constant: 42, invalid: 42.1 },
    { constant: 42, invalid: -42 },
    { constant: 0, invalid: 1 },
    { constant: 0, invalid: false },
    { constant: -123, invalid: 123 },
    { constant: 3.14, invalid: 3 },
    { constant: Infinity, invalid: -Infinity },
    { constant: -Infinity, invalid: Infinity },

    // Test with different boolean constants
    { constant: true, invalid: false },
    { constant: false, invalid: true },
    { constant: true, invalid: 1 },
    { constant: true, invalid: "true" },
    { constant: true, invalid: {} },
    { constant: false, invalid: 0 },
    { constant: false, invalid: "" },
    { constant: false, invalid: null },
    { constant: false, invalid: undefined },

    // Test with null
    { constant: null, invalid: undefined },
    { constant: null, invalid: 0 },
    { constant: null, invalid: false },
    { constant: null, invalid: "" },
    { constant: null, invalid: "null" },
    { constant: null, invalid: {} },
    { constant: null, invalid: [] },

    // Test with NaN
    { constant: NaN, invalid: NaN },
    { constant: NaN, invalid: 0 }
  ])("should reject value '$invalid' when constant is '$constant'", ({ constant: constValue, invalid }) => {
    const validator = constant(constValue);
    const result = validator.unstable_validate(invalid);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "hello";
    const result = constant(value).unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it.each(["test", 42, true, null])("should include schema", (value) => {
    const validator = constant(value);
    expect(validator.schema).toEqual({
      type: "constant",
      value: value
    });
  });

  it.each([
    { constant: 42, expected: { type: "constant", value: 42 } },
    { constant: true, expected: { type: "constant", value: true } },
    { constant: null, expected: { type: "constant", value: null } },
    { constant: "test", expected: { type: "constant", value: "test" } }
  ])("should hold the value itself in the schema for $constant", ({ constant: constValue, expected }) => {
    expect(constant(constValue).schema).toEqual(expected);
  });

  it("should not equate the schemas of 1 and '1'", () => {
    expect(constant(1).schema).not.toEqual(constant("1").schema);
  });

  it("should include rules", () => {
    const validator = constant("test");
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    const validator = constant("test");
    const result = validator.unstable_validate("actual");
    expect(result.error).toMatchObject({
      schema: { type: "constant", value: "test" }
    });
  });

  it("should report a schema mismatch", () => {
    const input = "actual";
    const validator = constant("test");
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      input: input
    });
  });

  it("should work with Object(null) edge case", () => {
    const validator = constant(null);
    const result = validator.unstable_validate(Object(null));
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  describe("edge cases", () => {
    it("should handle NaN properly", () => {
      const validator = constant(NaN);
      // NaN !== NaN in JavaScript, so this should fail
      const result = validator.unstable_validate(NaN);
      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});
