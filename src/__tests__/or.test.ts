import { describe, expect, it } from "vitest";
import { or, string, number } from "../index";

describe("or", () => {
  it("should accept values matching any of the provided validators", () => {
    const validator = or([string(), number()]);

    // String values
    const result1 = validator.unstable_validate("hello");
    expect(result1.value).toBeDefined();
    expect(result1.error).toBeUndefined();

    const result2 = validator.unstable_validate("");
    expect(result2.value).toBeDefined();
    expect(result2.error).toBeUndefined();

    const result3 = validator.unstable_validate("123");
    expect(result3.value).toBeDefined();
    expect(result3.error).toBeUndefined();

    // Number values
    const result4 = validator.unstable_validate(123);
    expect(result4.value).toBeDefined();
    expect(result4.error).toBeUndefined();

    const result5 = validator.unstable_validate(0);
    expect(result5.value).toBeDefined();
    expect(result5.error).toBeUndefined();

    const result6 = validator.unstable_validate(-456);
    expect(result6.value).toBeDefined();
    expect(result6.error).toBeUndefined();

    const result7 = validator.unstable_validate(3.14);
    expect(result7.value).toBeDefined();
    expect(result7.error).toBeUndefined();
  });

  it("should work with a single validator", () => {
    const validator = or([string()]);

    const result1 = validator.unstable_validate("test");
    expect(result1.value).toBe("test");
    expect(result1.error).toBeUndefined();

    const result2 = validator.unstable_validate(123);
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();
  });

  it("should handle empty validator array", () => {
    const validator = or([]);

    // Should always fail since no validators to try
    const result1 = validator.unstable_validate("test");
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate(123);
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    const result3 = validator.unstable_validate(null);
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();
  });

  it("should reject values that don't match any of the provided validators", () => {
    const validator = or([string(), number()]);
    const result = validator.unstable_validate(true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "hello";
    const result = or([string(), number()]).unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    expect(or([string(), number()]).schema).toEqual({
      type: "or",
      item: [{ type: "string" }, { type: "number" }],
    });
  });

  it("should include rules", () => {
    expect(or([string(), number()]).rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(
      or([string(), number()]).unstable_validate(true).error
    ).toMatchObject({
      schema: { type: "or", item: [{ type: "string" }, { type: "number" }] },
    });
  });

  it("should include schema path in error in case of schema violation", () => {
    const validator = or([string(), number()]);
    const result = validator.unstable_validate(true);
    expect(result.error).toMatchObject({
      path: { type: "schema", data: true },
    });
  });

  it("should throw error if any of the validators throw an error", () => {
    const throwingValidator = {
      unstable_validate() {
        throw new Error("Custom error");
      },
      schema: { type: "custom" },
      rules: {},
    };

    const validator = or([throwingValidator as any, string()]);

    expect(() => validator.unstable_validate("test")).toThrowError(
      "Custom error"
    );
  });
});
