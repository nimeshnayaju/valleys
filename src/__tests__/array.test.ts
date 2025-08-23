import { describe, expect, it } from "vitest";
import { array, string, number, object, boolean, DecoderError } from "../index";

describe("array", () => {
  describe("basic", () => {
    it("should accept arrays", () => {
      const decoder = array();
      expect(decoder.unstable_decode([])).toEqual([]);
      expect(decoder.unstable_decode([1, 2, 3])).toEqual([1, 2, 3]);
      expect(decoder.unstable_decode(["a", "b", "c"])).toEqual(["a", "b", "c"]);
      expect(decoder.unstable_decode([true, false])).toEqual([true, false]);

      // Mixed types
      expect(
        decoder.unstable_decode([1, "hello", true, null, undefined])
      ).toEqual([1, "hello", true, null, undefined]);

      // Nested arrays
      expect(decoder.unstable_decode([[], [1, 2], [["nested"]]])).toEqual([
        [],
        [1, 2],
        [["nested"]],
      ]);

      // Arrays with objects
      expect(
        decoder.unstable_decode([{ key: "value" }, { foo: "bar" }])
      ).toEqual([{ key: "value" }, { foo: "bar" }]);

      // Large array
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      expect(decoder.unstable_decode(largeArray)).toEqual(largeArray);
    });

    it("should reject non-arrays", () => {
      const decoder = array();
      expect(() => decoder.unstable_decode("not an array")).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(undefined)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode({ length: 0 })).toThrowError(
        DecoderError
      ); // array-like object
      expect(() => decoder.unstable_decode(new Set([1, 2, 3]))).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(new Map())).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(() => [])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(Symbol("array"))).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(Infinity)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(new Date())).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(/regex/)).toThrowError(DecoderError);
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
      const decoder = array();
      const arr = [1, 2, 3];
      expect(decoder.unstable_decode(arr)).toBe(arr);
    });

    it("should throw DecoderError with full details for non-array violation", () => {
      const decoder = array();
      try {
        decoder.unstable_decode("not an array");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "not an array",
        });
        expect((error as DecoderError).schema).toEqual({ type: "array" });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"array"}; received value: "not an array"'
        );
      }
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it("should work with array(rules) signature without item decoder", () => {
        const decoder = array({ minLength: 3 });

        // Should accept any array with at least 3 items
        expect(decoder.unstable_decode([1, 2, 3])).toEqual([1, 2, 3]);
        expect(decoder.unstable_decode(["a", "b", "c", "d"])).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
        expect(decoder.unstable_decode([true, false, null, undefined])).toEqual(
          [true, false, null, undefined]
        );
        expect(decoder.unstable_decode([{}, [], 42, "mixed"])).toEqual([
          {},
          [],
          42,
          "mixed",
        ]);

        // Should reject arrays shorter than minimum length
        expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode([1])).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode([1, 2])).toThrowError(
          DecoderError
        );

        // Should include schema without item
        expect(decoder.schema).toEqual({ type: "array", item: undefined });
        expect(decoder.rules).toEqual({ minLength: 3 });
      });

      it("should throw DecoderError with correct details for array(rules) signature", () => {
        const decoder = array({ minLength: 3 });

        try {
          decoder.unstable_decode([1, 2]);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: [1, 2],
          });
          expect((error as DecoderError).schema).toEqual({
            type: "array",
            item: undefined,
          });
          expect((error as DecoderError).rules).toEqual({ minLength: 3 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"array"} with rules: {"minLength":3}; received value: [1,2]'
          );
        }
      });

      it("should accept arrays meeting minimum length", () => {
        const decoder = array({ minLength: 3 });

        expect(decoder.unstable_decode([1, 2, 3])).toEqual([1, 2, 3]);
        expect(decoder.unstable_decode([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(decoder.unstable_decode(["a", "b", "c", "d", "e"])).toEqual([
          "a",
          "b",
          "c",
          "d",
          "e",
        ]);

        // Edge case: array with exactly minimum length
        expect(decoder.unstable_decode(Array(3).fill(null))).toEqual([
          null,
          null,
          null,
        ]);

        // Large array
        const largeArray = Array.from({ length: 100 }, (_, i) => i);
        expect(decoder.unstable_decode(largeArray)).toEqual(largeArray);
      });

      it("should reject arrays shorter than minimum length", () => {
        const decoder = array({ minLength: 3 });

        expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode([1])).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode([1, 2])).toThrowError(
          DecoderError
        );
      });

      it("should accept array with minLength 0", () => {
        const decoder = array({ minLength: 0 });
        expect(decoder.unstable_decode([])).toEqual([]);
        expect(decoder.unstable_decode([1])).toEqual([1]);
      });

      it("should include minLength in rules", () => {
        const decoder = array({ minLength: 5 });
        expect(decoder.rules).toEqual({
          minLength: 5,
        });
      });

      it("should throw DecoderError with full details for minLength violation", () => {
        const decoder = array({ minLength: 5 });

        try {
          decoder.unstable_decode([1, 2]);
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: [1, 2],
          });
          expect((error as DecoderError).schema).toEqual({ type: "array" });
          expect((error as DecoderError).rules).toEqual({ minLength: 5 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"array"} with rules: {"minLength":5}; received value: [1,2]'
          );
        }
      });
    });
  });

  describe("typed arrays", () => {
    it("should accept arrays of strings", () => {
      const decoder = array(string());

      expect(decoder.unstable_decode([])).toEqual([]);
      expect(decoder.unstable_decode(["hello", "world"])).toEqual([
        "hello",
        "world",
      ]);
      expect(decoder.unstable_decode(["", " ", "test"])).toEqual([
        "",
        " ",
        "test",
      ]);

      // Unicode and special characters
      expect(decoder.unstable_decode(["你好", "🌍", "café"])).toEqual([
        "你好",
        "🌍",
        "café",
      ]);
    });

    it("should reject arrays with non-string elements", () => {
      const decoder = array(string());

      expect(() => decoder.unstable_decode([1, 2, 3])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(["hello", 123])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode([true, false])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode([null])).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode([undefined])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode([{}])).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode([[]])).toThrowError(DecoderError);
    });

    it("should validate string rules on each element", () => {
      const decoder = array(string({ minLength: 3 }));

      expect(decoder.unstable_decode(["abc", "hello", "world"])).toEqual([
        "abc",
        "hello",
        "world",
      ]);

      expect(() => decoder.unstable_decode(["ab"])).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(["abc", "a"])).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(["", "abc"])).toThrowError(
        DecoderError
      );
    });

    it("should throw DecoderError with full details for non-string elements", () => {
      const decoder = array(string());

      try {
        decoder.unstable_decode([1, 2, 3]);
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "item",
          index: 0,
          path: {
            type: "schema",
            data: 1,
          },
          data: [1, 2, 3],
        });
        expect((error as DecoderError).schema).toEqual({
          type: "string",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed at [0] due to schema mismatch; expected schema: {"type":"string"}; received value: 1'
        );
      }
    });
  });
});
