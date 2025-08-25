import { describe, expect, it } from "vitest";
import { boolean, ValidationError } from "../index";

describe("boolean", () => {
  it("should accept boolean values", () => {
    const validator = boolean();

    // Test true
    expect(validator.unstable_validate(true)).toBe(true);

    // Test false
    expect(validator.unstable_validate(false)).toBe(false);
  });

  it("should reject non-boolean values", () => {
    const validator = boolean();

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
    expect(() => validator.unstable_validate("true")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("false")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("True")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("False")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("TRUE")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("FALSE")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("1")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("0")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("")).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(" ")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("yes")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("no")).toThrowError(
      ValidationError
    );

    // Null and undefined
    expect(() => validator.unstable_validate(null)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );

    // Objects and arrays
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([true])).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate([false])).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({ value: true })).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({ value: false })).toThrowError(
      ValidationError
    );

    // Functions
    expect(() => validator.unstable_validate(() => true)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(() => false)).toThrowError(
      ValidationError
    );
    expect(() =>
      validator.unstable_validate(function () {
        return true;
      })
    ).toThrowError(ValidationError);

    // Symbols and other types
    expect(() => validator.unstable_validate(Symbol("test"))).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(/regex/)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Boolean(true))).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Boolean(false))).toThrowError(
      ValidationError
    );
  });

  it("should have correct schema", () => {
    const validator = boolean();
    expect(validator.schema).toEqual({ type: "boolean" });
  });

  it("should have empty rules", () => {
    const validator = boolean();
    expect(validator.rules).toEqual({});
  });

  it("should throw ValidationError with full details for non-boolean violation", () => {
    const validator = boolean();

    try {
      validator.unstable_validate("not a boolean");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "not a boolean",
        });
        expect((error as ValidationError).schema).toEqual({ type: "boolean" });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"boolean"}; received value: "not a boolean"'
        );
      }
    }
  });

  it("should handle edge cases with truthy/falsy values", () => {
    const validator = boolean();

    // Truthy values that are not true
    expect(() => validator.unstable_validate("non-empty string")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(1)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(-1)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );

    // Falsy values that are not false
    expect(() => validator.unstable_validate(0)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(-0)).toThrowError(ValidationError);
    expect(() => validator.unstable_validate("")).toThrowError(ValidationError);
    expect(() => validator.unstable_validate(null)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(NaN)).toThrowError(
      ValidationError
    );
  });
});
