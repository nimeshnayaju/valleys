import { describe, expect, it } from "vitest";
import { undefined_, ValidationError } from "../index";

describe("undefined_", () => {
  it("should accept undefined values", () => {
    const validator = undefined_();
    expect(validator.unstable_validate(undefined)).toBe(undefined);
  });

  it("should reject non-undefined values", () => {
    const validator = undefined_();

    // Null
    expect(() => validator.unstable_validate(null)).toThrowError(
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
    expect(() => validator.unstable_validate("undefined")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("UNDEFINED")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("Undefined")).toThrowError(
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
    expect(() => validator.unstable_validate("null")).toThrowError(
      ValidationError
    );

    // Objects and arrays
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([undefined])).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate({ value: undefined })
    ).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(new Object())).toThrowError(
      ValidationError
    );

    // Functions
    expect(() => validator.unstable_validate(() => undefined)).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate(function () {
        return undefined;
      })
    ).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(function () {})).toThrowError(
      ValidationError
    );

    // Symbols and other types
    expect(() => validator.unstable_validate(Symbol("undefined"))).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(/undefined/)).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate(new Error("undefined"))
    ).toThrowError(ValidationError);
  });

  it("should have correct schema", () => {
    const validator = undefined_();
    expect(validator.schema).toEqual({ type: "undefined" });
  });

  it("should have empty rules", () => {
    const validator = undefined_();
    expect(validator.rules).toEqual({});
  });

  it("should throw ValidationError with full details for non-undefined violation", () => {
    const validator = undefined_();

    try {
      validator.unstable_validate("not undefined");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "schema",
        data: "not undefined",
      });
      expect((error as ValidationError).schema).toEqual({ type: "undefined" });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"undefined"}; received value: "not undefined"'
      );
    }
  });

  it("should handle edge cases with undefined-like values", () => {
    const validator = undefined_();

    // Values that might be confused with undefined
    expect(() => validator.unstable_validate(null)).toThrowError(
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

    // Different ways to express undefined
    expect(validator.unstable_validate(void 0)).toBe(undefined);
    expect(validator.unstable_validate(void 123)).toBe(undefined);

    // Global undefined
    expect(validator.unstable_validate(globalThis.undefined)).toBe(undefined);
  });

  it("should work correctly with strict equality", () => {
    const validator = undefined_();

    // Only the primitive undefined value should pass
    expect(validator.unstable_validate(undefined)).toBe(undefined);

    // Ensure the returned value is actually undefined
    const result = validator.unstable_validate(undefined);
    expect(result === undefined).toBe(true);
    expect(result).toBeUndefined();
  });
});
