import { describe, expect, it, vi } from "vitest";
import { array, object, string, ValidationError, validate } from "..";

describe("validate", () => {
  it("should return the validated value when validation succeeds", () => {
    const validateFn = vi.fn().mockReturnValue({ value: "validated value" });
    validate("test input", {
      unstable_validate: validateFn,
      schema: { type: "string" },
      rules: {}
    });

    expect(validateFn).toHaveBeenCalledWith("test input");
    expect(true).toBe(true);
  });

  it("should throw ValidationError when validation fails", () => {
    const validateFn = vi.fn().mockReturnValue({
      error: {
        type: "schema-mismatch",
        path: [],
        input: "invalid input",
        schema: { type: "string" },
        rules: {}
      }
    });

    expect(() =>
      validate("invalid input", {
        unstable_validate: validateFn,
        schema: { type: "string" },
        rules: {}
      })
    ).toThrow(ValidationError);
    expect(validateFn).toHaveBeenCalledWith("invalid input");
  });

  it("should include the failure in ValidationError", () => {
    const validateFn = vi.fn().mockReturnValue({
      error: {
        type: "rule-violation",
        rule: "minLength",
        path: [],
        input: "short",
        schema: { type: "string" },
        rules: { minLength: 5 }
      }
    });

    try {
      validate("short", {
        unstable_validate: validateFn,
        schema: { type: "string" },
        rules: { minLength: 5 }
      });
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).cause).toBe(validateFn.mock.results[0]!.value.error);
    }
  });

  it("should name the error ValidationError", () => {
    const error = new ValidationError({
      type: "schema-mismatch",
      path: [],
      input: 1,
      schema: { type: "string" },
      rules: {}
    });

    expect(error.name).toBe("ValidationError");
    expect(String(error)).toMatch(/^ValidationError: Validation failed/);
  });

  it("should name an error thrown by validate ValidationError", () => {
    try {
      validate(1, string());
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect((error as ValidationError).name).toBe("ValidationError");
    }
  });

  it("should name the path of a nested failure in the message", () => {
    try {
      validate({ tags: ["a", ""] }, object({ tags: array(string({ minLength: 1 })) }));
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toBe(
        'Validation failed at tags[1] due to rule violation: minLength; expected schema: {"type":"string"} with rules: {"minLength":1}; received value: ""'
      );
    }
  });
});
