import { describe, expect, it } from "vitest";
import { null_, ValidationError } from "../index";

describe("null_", () => {
  it("should accept null values", () => {
    const validator = null_();
    expect(validator.unstable_validate(null)).toBe(null);
  });

  it("should reject non-null values", () => {
    const validator = null_();

    // Undefined
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );

    // Booleans
    expect(() => validator.unstable_validate(true)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(false)).toThrowError(
      ValidationError
    );

    // Numbers
    expect(() => validator.unstable_validate(0)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(1)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(-1)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(123)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(3.14)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(Infinity)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(-Infinity)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(NaN)).toThrowError(
      ValidationError
    );

    // Strings
    expect(() => validator.unstable_validate("null")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("NULL")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("Null")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("")).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(" ")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("0")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("false")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("undefined")).toThrowError(
      ValidationError
    );

    // Objects and arrays
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([null])).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({ value: null })).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Object())).toThrowError(
      ValidationError
    );

    // Functions
    expect(() => validator.unstable_validate(() => null)).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate(function () {
        return null;
      })
    ).toThrowError(ValidationError);

    // Symbols and other types
    expect(() => validator.unstable_validate(Symbol("null"))).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(/null/)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Error("null"))).toThrowError(
      ValidationError
    );
  });

  it("should have correct schema", () => {
    const validator = null_();
    expect(validator.schema).toEqual({ type: "null" });
  });

  it("should have empty rules", () => {
    const validator = null_();
    expect(validator.rules).toEqual({});
  });

  it("should throw ValidationError with full details for non-null violation", () => {
    const validator = null_();

    try {
      validator.unstable_validate("not null");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "schema",
        data: "not null",
      });
      expect((error as ValidationError).schema).toEqual({ type: "null" });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"null"}; received value: "not null"'
      );
    }
  });

  it("should handle edge cases with null-like values", () => {
    const validator = null_();

    // Values that might be confused with null
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(0)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(false)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("")).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(NaN)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(void 0)).toThrowError(
      ValidationError
    );

    // Object wrappers
    expect(() => validator.unstable_validate(Object(null))).toThrowError(
      ValidationError
    );
  });

  it("should work correctly with strict equality", () => {
    const validator = null_();

    // Only the primitive null value should pass
    expect(validator.unstable_validate(null)).toBe(null);

    // Ensure the returned value is actually null
    const result = validator.unstable_validate(null);
    expect(result === null).toBe(true);
    expect(result).toBeNull();
  });
});
