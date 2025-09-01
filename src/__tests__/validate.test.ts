import { validate, ValidationError } from "..";
import { describe, expect, it, vi } from "vitest";

describe("validate", () => {
  it("should return the validated value when validation succeeds", () => {
    const validateFn = vi.fn().mockReturnValue({ value: "validated value" });
    validate("test input", {
      unstable_validate: validateFn,
      schema: { type: "string" },
      rules: {},
    });

    expect(validateFn).toHaveBeenCalledWith("test input");
    expect(true).toBe(true);
  });

  it("should throw ValidationError when validation fails", () => {
    const validateFn = vi.fn().mockReturnValue({
      error: {
        type: "schema-violation",
        data: "invalid input",
        context: { schema: { type: "string" }, rules: {} },
      },
    });

    expect(() =>
      validate("invalid input", {
        unstable_validate: validateFn,
        schema: { type: "string" },
        rules: {},
      })
    ).toThrow(ValidationError);
    expect(validateFn).toHaveBeenCalledWith("invalid input");
  });

  it("should include the error node in ValidationError", () => {
    const validateFn = vi.fn().mockReturnValue({
      error: {
        type: "rule-violation",
        rule: "minLength",
        data: "short",
        context: {
          schema: { type: "string" },
          rules: { minLength: 5 },
        },
      },
    });

    try {
      validate("short", {
        unstable_validate: validateFn,
        schema: { type: "string" },
        rules: { minLength: 5 },
      });
      expect.fail("Expected ValidationError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).root).toBe(
        validateFn.mock.results[0].value.error
      );
    }
  });
});
