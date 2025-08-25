import { describe, expect, it } from "vitest";
import { or, string, number, boolean, ValidationError, null_ } from "../index";

describe("or", () => {
  it("should accept values matching any of the provided validators", () => {
    const validator = or([string(), number()]);

    // String values
    expect(validator.unstable_validate("hello")).toBe("hello");
    expect(validator.unstable_validate("")).toBe("");
    expect(validator.unstable_validate("123")).toBe("123");

    // Number values
    expect(validator.unstable_validate(123)).toBe(123);
    expect(validator.unstable_validate(0)).toBe(0);
    expect(validator.unstable_validate(-456)).toBe(-456);
    expect(validator.unstable_validate(3.14)).toBe(3.14);
  });

  it("should try validators in order and return first successful match", () => {
    // Both string() and number() would accept "123" as a string,
    // but string() comes first so it should be used
    const validator1 = or([string(), number()]);
    expect(validator1.unstable_validate("123")).toBe("123");
    expect(typeof validator1.unstable_validate("123")).toBe("string");

    // If we reverse the order, number() can't validate "123" as a string,
    // so it falls back to string()
    const validator2 = or([number(), string()]);
    expect(validator2.unstable_validate("123")).toBe("123");
    expect(typeof validator2.unstable_validate("123")).toBe("string");

    // But numeric 123 will be validated by number() in both cases
    expect(validator2.unstable_validate(123)).toBe(123);
    expect(typeof validator2.unstable_validate(123)).toBe("number");
  });

  it("should work with multiple validator types", () => {
    const validator = or([string(), number(), boolean(), null_()]);

    expect(validator.unstable_validate("test")).toBe("test");
    expect(validator.unstable_validate(42)).toBe(42);
    expect(validator.unstable_validate(true)).toBe(true);
    expect(validator.unstable_validate(false)).toBe(false);
    expect(validator.unstable_validate(null)).toBe(null);
  });

  it("should work with a single validator", () => {
    const validator = or([string()]);

    expect(validator.unstable_validate("test")).toBe("test");
    expect(() => validator.unstable_validate(123)).toThrowError(
      ValidationError
    );
  });

  it("should handle empty validator array", () => {
    const validator = or([]);

    // Should always throw since no validators to try
    expect(() => validator.unstable_validate("test")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(123)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(null)).toThrowError(
      ValidationError
    );
  });

  it("should throw ValidationError with full details for no validator matches", () => {
    const validator = or([string(), number()]);

    try {
      validator.unstable_validate(true);
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "schema",
        data: true,
      });
      expect((error as ValidationError).schema).toEqual({
        type: "or",
        item: [{ type: "string" }, { type: "number" }],
      });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"or","item":[{"type":"string"},{"type":"number"}]}; received value: true'
      );
    }
  });

  it("should only catch ValidationError, not other errors", () => {
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
