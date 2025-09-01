import { describe, expect, it } from "vitest";
import { boolean } from "../index";

describe("boolean", () => {
  it.each([
    // Basic cases
    true,
    false,
  ])("should accept boolean %s", (value) => {
    const result = boolean().unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
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
    "true",
    "false",
    "True",
    "False",
    "TRUE",
    "FALSE",
    "1",
    "0",
    "",
    " ",
    "yes",
    "no",
    "non-empty string",

    // Null and undefined
    null,
    undefined,

    // Objects and arrays
    {},
    [],
    [true],
    [false],
    { value: true },
    { value: false },

    // Functions
    () => true,
    () => false,
    function () {
      return true;
    },

    // Symbols and other types
    Symbol("test"),
    new Date(),
    /regex/,
    new Boolean(true),
    new Boolean(false),
  ])("should reject value '%s'", (value) => {
    const result = boolean().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = true;
    const result = boolean().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = boolean();
    expect(validator.schema).toEqual({ type: "boolean" });
  });

  it("should include rules", () => {
    const validator = boolean();
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(boolean().unstable_validate("not a boolean").error).toMatchObject({
      context: { schema: { type: "boolean" } },
    });
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = "not a boolean";
    const validator = boolean();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });
});
