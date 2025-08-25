import { describe, expect, it } from "vitest";
import { array, string, number, boolean, ValidationError } from "../index";

describe("array", () => {
  describe("basic", () => {
    it("should accept arrays", () => {
      const validator = array();
      expect(validator.unstable_validate([])).toEqual([]);
      expect(validator.unstable_validate([1, 2, 3])).toEqual([1, 2, 3]);
      expect(validator.unstable_validate(["a", "b", "c"])).toEqual([
        "a",
        "b",
        "c",
      ]);
      expect(validator.unstable_validate([true, false])).toEqual([true, false]);

      // Mixed types
      expect(
        validator.unstable_validate([1, "hello", true, null, undefined])
      ).toEqual([1, "hello", true, null, undefined]);

      // Nested arrays
      expect(validator.unstable_validate([[], [1, 2], [["nested"]]])).toEqual([
        [],
        [1, 2],
        [["nested"]],
      ]);

      // Arrays with objects
      expect(
        validator.unstable_validate([{ key: "value" }, { foo: "bar" }])
      ).toEqual([{ key: "value" }, { foo: "bar" }]);

      // Large array
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      expect(validator.unstable_validate(largeArray)).toEqual(largeArray);
    });

    it("should reject non-arrays", () => {
      const validator = array();
      expect(() => validator.unstable_validate("not an array")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(123)).toThrowError(
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
      expect(() => validator.unstable_validate({ length: 0 })).toThrowError(
        ValidationError
      ); // array-like object
      expect(() =>
        validator.unstable_validate(new Set([1, 2, 3]))
      ).toThrowError(ValidationError);
      expect(() => validator.unstable_validate(new Map())).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(() => [])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(Symbol("array"))).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(NaN)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(Infinity)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(new Date())).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(/regex/)).toThrowError(
        ValidationError
      );
    });

    it("should include schema", () => {
      expect(array().schema).toEqual({ type: "array" });
      expect(array(string()).schema).toEqual({
        type: "array",
        item: { type: "string" },
      });
      expect(array(number()).schema).toEqual({
        type: "array",
        item: { type: "number" },
      });
      expect(array(boolean()).schema).toEqual({
        type: "array",
        item: { type: "boolean" },
      });
    });

    it("should preserve array reference for valid arrays", () => {
      const validator = array();
      const arr = [1, 2, 3];
      expect(validator.unstable_validate(arr)).toBe(arr);
    });

    it("should throw ValidationError with full details for non-array violation", () => {
      const validator = array();
      try {
        validator.unstable_validate("not an array");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "not an array",
        });
        expect((error as ValidationError).schema).toEqual({ type: "array" });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"array"}; received value: "not an array"'
        );
      }
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it("should work with array(rules) signature without item validator", () => {
        const validator = array({ minLength: 3 });

        // Should accept any array with at least 3 items
        expect(validator.unstable_validate([1, 2, 3])).toEqual([1, 2, 3]);
        expect(validator.unstable_validate(["a", "b", "c", "d"])).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
        expect(
          validator.unstable_validate([true, false, null, undefined])
        ).toEqual([true, false, null, undefined]);
        expect(validator.unstable_validate([{}, [], 42, "mixed"])).toEqual([
          {},
          [],
          42,
          "mixed",
        ]);

        // Should reject arrays shorter than minimum length
        expect(() => validator.unstable_validate([])).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate([1])).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate([1, 2])).toThrowError(
          ValidationError
        );

        // Should include schema without item
        expect(validator.schema).toEqual({ type: "array", item: undefined });
        expect(validator.rules).toEqual({ minLength: 3 });
      });

      it("should throw ValidationError with correct details for array(rules) signature", () => {
        const validator = array({ minLength: 3 });

        try {
          validator.unstable_validate([1, 2]);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: [1, 2],
          });
          expect((error as ValidationError).schema).toEqual({
            type: "array",
            item: undefined,
          });
          expect((error as ValidationError).rules).toEqual({ minLength: 3 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"array"} with rules: {"minLength":3}; received value: [1,2]'
          );
        }
      });

      it("should accept arrays meeting minimum length", () => {
        const validator = array({ minLength: 3 });

        expect(validator.unstable_validate([1, 2, 3])).toEqual([1, 2, 3]);
        expect(validator.unstable_validate([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(validator.unstable_validate(["a", "b", "c", "d", "e"])).toEqual([
          "a",
          "b",
          "c",
          "d",
          "e",
        ]);

        // Edge case: array with exactly minimum length
        expect(validator.unstable_validate(Array(3).fill(null))).toEqual([
          null,
          null,
          null,
        ]);

        // Large array
        const largeArray = Array.from({ length: 100 }, (_, i) => i);
        expect(validator.unstable_validate(largeArray)).toEqual(largeArray);
      });

      it("should reject arrays shorter than minimum length", () => {
        const validator = array({ minLength: 3 });

        expect(() => validator.unstable_validate([])).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate([1])).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate([1, 2])).toThrowError(
          ValidationError
        );
      });

      it("should accept array with minLength 0", () => {
        const validator = array({ minLength: 0 });
        expect(validator.unstable_validate([])).toEqual([]);
        expect(validator.unstable_validate([1])).toEqual([1]);
      });

      it("should include minLength in rules", () => {
        const validator = array({ minLength: 5 });
        expect(validator.rules).toEqual({
          minLength: 5,
        });
      });

      it("should throw ValidationError with full details for minLength violation", () => {
        const validator = array({ minLength: 5 });

        try {
          validator.unstable_validate([1, 2]);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: [1, 2],
          });
          expect((error as ValidationError).schema).toEqual({ type: "array" });
          expect((error as ValidationError).rules).toEqual({ minLength: 5 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"array"} with rules: {"minLength":5}; received value: [1,2]'
          );
        }
      });
    });
  });

  describe("typed arrays", () => {
    it("should accept arrays of strings", () => {
      const validator = array(string());

      expect(validator.unstable_validate([])).toEqual([]);
      expect(validator.unstable_validate(["hello", "world"])).toEqual([
        "hello",
        "world",
      ]);
      expect(validator.unstable_validate(["", " ", "test"])).toEqual([
        "",
        " ",
        "test",
      ]);

      // Unicode and special characters
      expect(validator.unstable_validate(["你好", "🌍", "café"])).toEqual([
        "你好",
        "🌍",
        "café",
      ]);
    });

    it("should reject arrays with non-string elements", () => {
      const validator = array(string());

      expect(() => validator.unstable_validate([1, 2, 3])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(["hello", 123])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([true, false])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([null])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([undefined])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([{}])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([[]])).toThrowError(
        ValidationError
      );
    });

    it("should validate string rules on each element", () => {
      const validator = array(string({ minLength: 3 }));

      expect(validator.unstable_validate(["abc", "hello", "world"])).toEqual([
        "abc",
        "hello",
        "world",
      ]);

      expect(() => validator.unstable_validate(["ab"])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(["abc", "a"])).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(["", "abc"])).toThrowError(
        ValidationError
      );
    });

    it("should throw ValidationError with full details for non-string elements", () => {
      const validator = array(string());

      try {
        validator.unstable_validate([1, 2, 3]);
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "item",
          index: 0,
          path: {
            type: "schema",
            data: 1,
          },
          data: [1, 2, 3],
        });
        expect((error as ValidationError).schema).toEqual({
          type: "string",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed at [0] due to schema mismatch; expected schema: {"type":"string"}; received value: 1'
        );
      }
    });
  });
});
