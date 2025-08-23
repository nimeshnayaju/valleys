import { describe, expect, it } from "vitest";
import { number, DecoderError } from "../index";

describe("number", () => {
  describe("basic", () => {
    it("should accept numbers", () => {
      const decoder = number();
      expect(decoder.unstable_decode(123)).toBe(123);
      expect(decoder.unstable_decode(0)).toBe(0);
      expect(decoder.unstable_decode(-456)).toBe(-456);
      expect(decoder.unstable_decode(3.14)).toBe(3.14);
      expect(decoder.unstable_decode(-2.71)).toBe(-2.71);

      // Edge cases
      expect(decoder.unstable_decode(-0)).toBe(-0);
      expect(decoder.unstable_decode(Number.MAX_SAFE_INTEGER)).toBe(
        Number.MAX_SAFE_INTEGER
      );
      expect(decoder.unstable_decode(Number.MIN_SAFE_INTEGER)).toBe(
        Number.MIN_SAFE_INTEGER
      );
      expect(decoder.unstable_decode(Number.EPSILON)).toBe(Number.EPSILON);
      expect(decoder.unstable_decode(0.000000000000001)).toBe(
        0.000000000000001
      );
      expect(decoder.unstable_decode(1e10)).toBe(1e10);
      expect(decoder.unstable_decode(1e-10)).toBe(1e-10);
      expect(decoder.unstable_decode(1.23e4)).toBe(12300);
    });

    it("should reject non-numbers", () => {
      const decoder = number();
      expect(() => decoder.unstable_decode("123")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("hello")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(undefined)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    });

    it("should reject non-finite numbers", () => {
      const decoder = number();
      expect(() => decoder.unstable_decode(Infinity)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(-Infinity)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
    });

    it("should throw DecoderError with full details for non-number violation", () => {
      const decoder = number();
      try {
        decoder.unstable_decode("123");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "123",
        });
        expect((error as DecoderError).schema).toEqual({ type: "number" });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"number"}; received value: "123"'
        );
      }
    });

    it("should include schema", () => {
      const decoder = number();
      expect(decoder.schema).toEqual({ type: "number" });
    });
  });

  describe("rules", () => {
    describe("min", () => {
      it("should accept numbers meeting minimum value", () => {
        const decoder = number({ min: 10 });

        expect(decoder.unstable_decode(10)).toBe(10);
        expect(decoder.unstable_decode(15)).toBe(15);
        expect(decoder.unstable_decode(100)).toBe(100);
        expect(decoder.unstable_decode(10.1)).toBe(10.1);
      });

      it("should reject numbers less than minimum value", () => {
        const decoder = number({ min: 10 });

        expect(() => decoder.unstable_decode(9)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(-5)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(9.99)).toThrowError(DecoderError);
      });

      it("should work with negative minimum values", () => {
        const decoder = number({ min: -10 });

        expect(decoder.unstable_decode(-10)).toBe(-10);
        expect(decoder.unstable_decode(-5)).toBe(-5);
        expect(decoder.unstable_decode(0)).toBe(0);
        expect(decoder.unstable_decode(10)).toBe(10);

        expect(() => decoder.unstable_decode(-11)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(-100)).toThrowError(DecoderError);
      });

      it("should work with decimal minimum values", () => {
        const decoder = number({ min: 3.14 });

        expect(decoder.unstable_decode(3.14)).toBe(3.14);
        expect(decoder.unstable_decode(3.15)).toBe(3.15);
        expect(decoder.unstable_decode(4)).toBe(4);

        expect(() => decoder.unstable_decode(3.13)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(3)).toThrowError(DecoderError);
      });

      it("should include min in rules", () => {
        const decoder = number({ min: 5 });
        expect(decoder.rules).toEqual({
          min: 5,
          max: undefined,
        });
      });

      it("should throw DecoderError with full details for min violation", () => {
        const decoder = number({ min: 10 });

        try {
          decoder.unstable_decode(5);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "min",
            data: 5,
          });
          expect((error as DecoderError).schema).toEqual({ type: "number" });
          expect((error as DecoderError).rules).toEqual({ min: 10 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: min; expected schema: {"type":"number"} with rules: {"min":10}; received value: 5'
          );
        }
      });
    });

    describe("max", () => {
      it("should accept numbers within maximum value", () => {
        const decoder = number({ max: 100 });

        expect(decoder.unstable_decode(100)).toBe(100);
        expect(decoder.unstable_decode(50)).toBe(50);
        expect(decoder.unstable_decode(0)).toBe(0);
        expect(decoder.unstable_decode(-10)).toBe(-10);
        expect(decoder.unstable_decode(99.9)).toBe(99.9);
      });

      it("should reject numbers greater than maximum value", () => {
        const decoder = number({ max: 100 });

        expect(() => decoder.unstable_decode(101)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(200)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(100.1)).toThrowError(DecoderError);
      });

      it("should work with negative maximum values", () => {
        const decoder = number({ max: -10 });

        expect(decoder.unstable_decode(-10)).toBe(-10);
        expect(decoder.unstable_decode(-20)).toBe(-20);
        expect(decoder.unstable_decode(-100)).toBe(-100);

        expect(() => decoder.unstable_decode(-9)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(10)).toThrowError(DecoderError);
      });

      it("should work with decimal maximum values", () => {
        const decoder = number({ max: 3.14 });

        expect(decoder.unstable_decode(3.14)).toBe(3.14);
        expect(decoder.unstable_decode(3.13)).toBe(3.13);
        expect(decoder.unstable_decode(3)).toBe(3);
        expect(decoder.unstable_decode(0)).toBe(0);

        expect(() => decoder.unstable_decode(3.15)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(4)).toThrowError(DecoderError);
      });

      it("should include max in rules", () => {
        const decoder = number({ max: 10 });
        expect(decoder.rules).toEqual({
          min: undefined,
          max: 10,
        });
      });

      it("should throw DecoderError with full details for max violation", () => {
        const decoder = number({ max: 10 });

        try {
          decoder.unstable_decode(15);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "max",
            data: 15,
          });
          expect((error as DecoderError).schema).toEqual({ type: "number" });
          expect((error as DecoderError).rules).toEqual({ max: 10 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: max; expected schema: {"type":"number"} with rules: {"max":10}; received value: 15'
          );
        }
      });
    });

    describe("min and max combined", () => {
      it("should accept numbers within range", () => {
        const decoder = number({ min: 10, max: 20 });

        expect(decoder.unstable_decode(10)).toBe(10);
        expect(decoder.unstable_decode(15)).toBe(15);
        expect(decoder.unstable_decode(20)).toBe(20);
        expect(decoder.unstable_decode(12.5)).toBe(12.5);
      });

      it("should reject numbers outside range", () => {
        const decoder = number({ min: 10, max: 20 });

        expect(() => decoder.unstable_decode(9)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(21)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(100)).toThrowError(DecoderError);
      });

      it("should include both min and max in rules", () => {
        const decoder = number({ min: 5, max: 15 });
        expect(decoder.rules).toEqual({
          min: 5,
          max: 15,
        });
      });

      it("should work with negative ranges", () => {
        const decoder = number({ min: -20, max: -10 });

        expect(decoder.unstable_decode(-20)).toBe(-20);
        expect(decoder.unstable_decode(-15)).toBe(-15);
        expect(decoder.unstable_decode(-10)).toBe(-10);

        expect(() => decoder.unstable_decode(-21)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(-9)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
      });

      it("should work with ranges spanning negative and positive", () => {
        const decoder = number({ min: -10, max: 10 });

        expect(decoder.unstable_decode(-10)).toBe(-10);
        expect(decoder.unstable_decode(0)).toBe(0);
        expect(decoder.unstable_decode(10)).toBe(10);

        expect(() => decoder.unstable_decode(-11)).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode(11)).toThrowError(DecoderError);
      });

      it("should throw DecoderError with full details for min and max violation", () => {
        const decoder = number({ min: 10, max: 20 });

        try {
          decoder.unstable_decode(5);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "min",
            data: 5,
          });
          expect((error as DecoderError).schema).toEqual({ type: "number" });
          expect((error as DecoderError).rules).toEqual({ min: 10, max: 20 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: min; expected schema: {"type":"number"} with rules: {"min":10,"max":20}; received value: 5'
          );
        }
      });
    });
  });
});
