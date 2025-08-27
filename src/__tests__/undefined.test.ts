import { describe, expect, it } from "vitest";
import { undefined_ } from "../index";

describe("undefined_", () => {
  it("should accept undefined value", () => {
    const result = undefined_().unstable_validate(undefined);
    expect(result.value).toBe(undefined); // undefined is the valid value
    expect(result.error).toBeUndefined();
  });

  it.each([
    // Null
    null,

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
    "undefined",
    "UNDEFINED",
    "Undefined",
    "",
    " ",
    "0",
    "false",
    "null",

    // Objects and arrays
    {},
    [],
    [undefined],
    { value: undefined },
    new Object(),

    // Functions
    () => undefined,
    function () {
      return undefined;
    },
    function () {},

    // Symbols and other types
    Symbol("undefined"),
    new Date(),
    /undefined/,
    new Error("undefined"),

    // Edge cases with undefined-like values
    0,
    false,
    "",
    NaN,
  ])("should reject value '%s'", (value) => {
    const result = undefined_().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = undefined;
    const result = undefined_().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = undefined_();
    expect(validator.schema).toEqual({ type: "undefined" });
  });

  it("should include rules", () => {
    const validator = undefined_();
    expect(validator.rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(undefined_().unstable_validate("not undefined").error).toMatchObject(
      {
        schema: { type: "undefined" },
      }
    );
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = "not undefined";
    const validator = undefined_();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      path: { type: "schema", data: input },
    });
  });
});
