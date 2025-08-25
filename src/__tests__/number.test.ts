import { describe, expect, it } from "vitest";
import { number, ValidationError } from "../index";

describe("number", () => {
  describe("basic", () => {
    it("should accept numbers", () => {
      const validator = number();
      expect(validator.unstable_validate(123)).toBe(123);
      expect(validator.unstable_validate(0)).toBe(0);
      expect(validator.unstable_validate(-456)).toBe(-456);
      expect(validator.unstable_validate(3.14)).toBe(3.14);
      expect(validator.unstable_validate(-2.71)).toBe(-2.71);

      // Edge cases
      expect(validator.unstable_validate(-0)).toBe(-0);
      expect(validator.unstable_validate(Number.MAX_SAFE_INTEGER)).toBe(
        Number.MAX_SAFE_INTEGER
      );
      expect(validator.unstable_validate(Number.MIN_SAFE_INTEGER)).toBe(
        Number.MIN_SAFE_INTEGER
      );
      expect(validator.unstable_validate(Number.EPSILON)).toBe(Number.EPSILON);
      expect(validator.unstable_validate(0.000000000000001)).toBe(
        0.000000000000001
      );
      expect(validator.unstable_validate(1e10)).toBe(1e10);
      expect(validator.unstable_validate(1e-10)).toBe(1e-10);
      expect(validator.unstable_validate(1.23e4)).toBe(12300);
    });

    it("should reject non-numbers", () => {
      const validator = number();
      expect(() => validator.unstable_validate("123")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("hello")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(true)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(false)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(null)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(undefined)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate({})).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([])).toThrowError(
        ValidationError
      );
    });

    it("should reject non-finite numbers", () => {
      const validator = number();
      expect(() => validator.unstable_validate(Infinity)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(-Infinity)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(NaN)).toThrowError(
        ValidationError
      );
    });

    it("should throw ValidationError with full details for non-number violation", () => {
      const validator = number();
      try {
        validator.unstable_validate("123");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "123",
        });
        expect((error as ValidationError).schema).toEqual({ type: "number" });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"number"}; received value: "123"'
        );
      }
    });

    it("should include schema", () => {
      const validator = number();
      expect(validator.schema).toEqual({ type: "number" });
    });
  });

  describe("rules", () => {
    describe("min", () => {
      it("should accept numbers meeting minimum value", () => {
        const validator = number({ min: 10 });

        expect(validator.unstable_validate(10)).toBe(10);
        expect(validator.unstable_validate(15)).toBe(15);
        expect(validator.unstable_validate(100)).toBe(100);
        expect(validator.unstable_validate(10.1)).toBe(10.1);
      });

      it("should reject numbers less than minimum value", () => {
        const validator = number({ min: 10 });

        expect(() => validator.unstable_validate(9)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(0)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(-5)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(9.99)).toThrowError(
          ValidationError
        );
      });

      it("should work with negative minimum values", () => {
        const validator = number({ min: -10 });

        expect(validator.unstable_validate(-10)).toBe(-10);
        expect(validator.unstable_validate(-5)).toBe(-5);
        expect(validator.unstable_validate(0)).toBe(0);
        expect(validator.unstable_validate(10)).toBe(10);

        expect(() => validator.unstable_validate(-11)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(-100)).toThrowError(
          ValidationError
        );
      });

      it("should work with decimal minimum values", () => {
        const validator = number({ min: 3.14 });

        expect(validator.unstable_validate(3.14)).toBe(3.14);
        expect(validator.unstable_validate(3.15)).toBe(3.15);
        expect(validator.unstable_validate(4)).toBe(4);

        expect(() => validator.unstable_validate(3.13)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(3)).toThrowError(
          ValidationError
        );
      });

      it("should include min in rules", () => {
        const validator = number({ min: 5 });
        expect(validator.rules).toEqual({
          min: 5,
          max: undefined,
        });
      });

      it("should throw ValidationError with full details for min violation", () => {
        const validator = number({ min: 10 });

        try {
          validator.unstable_validate(5);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "min",
            data: 5,
          });
          expect((error as ValidationError).schema).toEqual({ type: "number" });
          expect((error as ValidationError).rules).toEqual({ min: 10 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: min; expected schema: {"type":"number"} with rules: {"min":10}; received value: 5'
          );
        }
      });
    });

    describe("max", () => {
      it("should accept numbers within maximum value", () => {
        const validator = number({ max: 100 });

        expect(validator.unstable_validate(100)).toBe(100);
        expect(validator.unstable_validate(50)).toBe(50);
        expect(validator.unstable_validate(0)).toBe(0);
        expect(validator.unstable_validate(-10)).toBe(-10);
        expect(validator.unstable_validate(99.9)).toBe(99.9);
      });

      it("should reject numbers greater than maximum value", () => {
        const validator = number({ max: 100 });

        expect(() => validator.unstable_validate(101)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(200)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(100.1)).toThrowError(
          ValidationError
        );
      });

      it("should work with negative maximum values", () => {
        const validator = number({ max: -10 });

        expect(validator.unstable_validate(-10)).toBe(-10);
        expect(validator.unstable_validate(-20)).toBe(-20);
        expect(validator.unstable_validate(-100)).toBe(-100);

        expect(() => validator.unstable_validate(-9)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(0)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(10)).toThrowError(
          ValidationError
        );
      });

      it("should work with decimal maximum values", () => {
        const validator = number({ max: 3.14 });

        expect(validator.unstable_validate(3.14)).toBe(3.14);
        expect(validator.unstable_validate(3.13)).toBe(3.13);
        expect(validator.unstable_validate(3)).toBe(3);
        expect(validator.unstable_validate(0)).toBe(0);

        expect(() => validator.unstable_validate(3.15)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(4)).toThrowError(
          ValidationError
        );
      });

      it("should include max in rules", () => {
        const validator = number({ max: 10 });
        expect(validator.rules).toEqual({
          min: undefined,
          max: 10,
        });
      });

      it("should throw ValidationError with full details for max violation", () => {
        const validator = number({ max: 10 });

        try {
          validator.unstable_validate(15);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "max",
            data: 15,
          });
          expect((error as ValidationError).schema).toEqual({ type: "number" });
          expect((error as ValidationError).rules).toEqual({ max: 10 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: max; expected schema: {"type":"number"} with rules: {"max":10}; received value: 15'
          );
        }
      });
    });

    describe("min and max combined", () => {
      it("should accept numbers within range", () => {
        const validator = number({ min: 10, max: 20 });

        expect(validator.unstable_validate(10)).toBe(10);
        expect(validator.unstable_validate(15)).toBe(15);
        expect(validator.unstable_validate(20)).toBe(20);
        expect(validator.unstable_validate(12.5)).toBe(12.5);
      });

      it("should reject numbers outside range", () => {
        const validator = number({ min: 10, max: 20 });

        expect(() => validator.unstable_validate(9)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(21)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(0)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(100)).toThrowError(
          ValidationError
        );
      });

      it("should include both min and max in rules", () => {
        const validator = number({ min: 5, max: 15 });
        expect(validator.rules).toEqual({
          min: 5,
          max: 15,
        });
      });

      it("should work with negative ranges", () => {
        const validator = number({ min: -20, max: -10 });

        expect(validator.unstable_validate(-20)).toBe(-20);
        expect(validator.unstable_validate(-15)).toBe(-15);
        expect(validator.unstable_validate(-10)).toBe(-10);

        expect(() => validator.unstable_validate(-21)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(-9)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(0)).toThrowError(
          ValidationError
        );
      });

      it("should work with ranges spanning negative and positive", () => {
        const validator = number({ min: -10, max: 10 });

        expect(validator.unstable_validate(-10)).toBe(-10);
        expect(validator.unstable_validate(0)).toBe(0);
        expect(validator.unstable_validate(10)).toBe(10);

        expect(() => validator.unstable_validate(-11)).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate(11)).toThrowError(
          ValidationError
        );
      });

      it("should throw ValidationError with full details for min and max violation", () => {
        const validator = number({ min: 10, max: 20 });

        try {
          validator.unstable_validate(5);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "min",
            data: 5,
          });
          expect((error as ValidationError).schema).toEqual({ type: "number" });
          expect((error as ValidationError).rules).toEqual({
            min: 10,
            max: 20,
          });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: min; expected schema: {"type":"number"} with rules: {"min":10,"max":20}; received value: 5'
          );
        }
      });
    });
  });
});
