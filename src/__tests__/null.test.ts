import { describe, expect, it } from "vitest";
import { null_ } from "../index";

describe("null_", () => {
  it("should accept null value", () => {
    const result = null_().unstable_validate(null);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    // Undefined
    undefined,

    // Booleans
    true,
    false,

    // Numbers
    0,
    1,
    -1,
    123,
    3.14,
    Infinity,
    -Infinity,
    NaN,

    // Strings
    "null",
    "NULL",
    "Null",
    "",
    " ",
    "0",
    "false",
    "undefined",

    // Objects and arrays
    {},
    [],
    [null],
    { value: null },
    new Object(),

    // Functions
    () => null,
    function () {
      return null;
    },

    // Symbols and other types
    Symbol("null"),
    new Date(),
    /null/,
    new Error("null"),

    // Edge cases with null-like values
    0,
    false,
    "",
    NaN,
    void 0,

    // Object wrappers
    Object(null),
  ])("should reject value '%s'", (value) => {
    const result = null_().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = null;
    const result = null_().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = null_();
    expect(validator.schema).toEqual({ type: "null" });
  });

  it("should include rules", () => {
    const validator = null_();
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(null_().unstable_validate("not null").error).toMatchObject({
      context: { schema: { type: "null" } },
    });
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = "not null";
    const validator = null_();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });

  it("should work correctly with strict equality", () => {
    const validator = null_();

    // Only the primitive null value should pass
    expect(validator.unstable_validate(null).value).toBeDefined();

    // Ensure the returned value is actually null
    const result = validator.unstable_validate(null);
    expect(result.value === null).toBe(true);
    expect(result.value).toBeNull();
  });
});
