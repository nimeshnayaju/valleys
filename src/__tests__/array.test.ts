import { describe, expect, it } from "vitest";
import {
  array,
  string,
  number,
  boolean,
  undefined_,
  null_,
  constant,
  iso8601,
  object,
} from "../index";

describe("array", () => {
  describe("basic", () => {
    it("should accept arrays", () => {
      const validator = array();
      const result1 = validator.unstable_validate([]);
      expect(result1.value).toEqual([]);
      expect(result1.error).toBeUndefined();

      const result2 = validator.unstable_validate([1, 2, 3]);
      expect(result2.value).toEqual([1, 2, 3]);
      expect(result2.error).toBeUndefined();

      const result3 = validator.unstable_validate(["a", "b", "c"]);
      expect(result3.value).toEqual(["a", "b", "c"]);
      expect(result3.error).toBeUndefined();

      const result4 = validator.unstable_validate([true, false]);
      expect(result4.value).toEqual([true, false]);
      expect(result4.error).toBeUndefined();

      // Mixed types
      const result5 = validator.unstable_validate([
        1,
        "hello",
        true,
        null,
        undefined,
      ]);
      expect(result5.value).toEqual([1, "hello", true, null, undefined]);
      expect(result5.error).toBeUndefined();

      // Nested arrays
      const result6 = validator.unstable_validate([[], [1, 2], [["nested"]]]);
      expect(result6.value).toEqual([[], [1, 2], [["nested"]]]);
      expect(result6.error).toBeUndefined();

      // Arrays with objects
      const result7 = validator.unstable_validate([
        { key: "value" },
        { foo: "bar" },
      ]);
      expect(result7.value).toEqual([{ key: "value" }, { foo: "bar" }]);
      expect(result7.error).toBeUndefined();

      // Large array
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const result8 = validator.unstable_validate(largeArray);
      expect(result8.value).toEqual(largeArray);
      expect(result8.error).toBeUndefined();
    });

    it("should reject non-arrays", () => {
      const validator = array();
      const result1 = validator.unstable_validate("not an array");
      expect(result1.value).toBeUndefined();
      expect(result1.error).toBeDefined();

      const result2 = validator.unstable_validate(123);
      expect(result2.value).toBeUndefined();
      expect(result2.error).toBeDefined();

      const result3 = validator.unstable_validate(true);
      expect(result3.value).toBeUndefined();
      expect(result3.error).toBeDefined();

      const result4 = validator.unstable_validate(false);
      expect(result4.value).toBeUndefined();
      expect(result4.error).toBeDefined();

      const result5 = validator.unstable_validate(null);
      expect(result5.value).toBeUndefined();
      expect(result5.error).toBeDefined();

      const result6 = validator.unstable_validate(undefined);
      expect(result6.value).toBeUndefined();
      expect(result6.error).toBeDefined();

      const result7 = validator.unstable_validate({});
      expect(result7.value).toBeUndefined();
      expect(result7.error).toBeDefined();

      const result8 = validator.unstable_validate({ length: 0 }); // array-like object
      expect(result8.value).toBeUndefined();
      expect(result8.error).toBeDefined();

      const result9 = validator.unstable_validate(new Set([1, 2, 3]));
      expect(result9.value).toBeUndefined();
      expect(result9.error).toBeDefined();

      const result10 = validator.unstable_validate(new Map());
      expect(result10.value).toBeUndefined();
      expect(result10.error).toBeDefined();

      const result11 = validator.unstable_validate(() => []);
      expect(result11.value).toBeUndefined();
      expect(result11.error).toBeDefined();

      const result12 = validator.unstable_validate(Symbol("array"));
      expect(result12.value).toBeUndefined();
      expect(result12.error).toBeDefined();

      const result13 = validator.unstable_validate(NaN);
      expect(result13.value).toBeUndefined();
      expect(result13.error).toBeDefined();

      const result14 = validator.unstable_validate(Infinity);
      expect(result14.value).toBeUndefined();
      expect(result14.error).toBeDefined();

      const result15 = validator.unstable_validate(new Date());
      expect(result15.value).toBeUndefined();
      expect(result15.error).toBeDefined();

      const result16 = validator.unstable_validate(/regex/);
      expect(result16.value).toBeUndefined();
      expect(result16.error).toBeDefined();
    });

    it("should return the original value", () => {
      const validator = array();
      const arr = [1, 2, 3];
      const result = validator.unstable_validate(arr);
      expect(result.value).toBe(arr);
      expect(result.error).toBeUndefined();
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
      expect(array(null_()).schema).toEqual({
        type: "array",
        item: { type: "null" },
      });
      expect(array(undefined_()).schema).toEqual({
        type: "array",
        item: { type: "undefined" },
      });
      expect(array(constant(1)).schema).toEqual({
        type: "array",
        item: { type: "constant", value: "1" },
      });
      expect(array(iso8601()).schema).toEqual({
        type: "array",
        item: { type: "iso8601" },
      });
      expect(array(array()).schema).toEqual({
        type: "array",
        item: { type: "array" },
      });
      expect(array(object()).schema).toEqual({
        type: "array",
        item: { type: "object", properties: {} },
      });
    });

    it.each([{}, { minLength: 3 }])("should include rules %s", (rules) => {
      const validator = array(rules);
      expect(validator.rules).toEqual(rules);
    });

    it("should include schema information in error", () => {
      expect(array().unstable_validate(123).error).toMatchObject({
        context: { schema: { type: "array" } },
      });
    });

    it("should include schema information of item in error in case of item violation", () => {
      const validator = array(string());
      const result = validator.unstable_validate([1, 2, 3]);
      expect(result.error).toMatchObject({
        type: "array-index",
        data: [1, 2, 3],
        entry: {
          index: 0,
          node: { type: "schema-violation", data: 1 },
        },
      });
    });

    it("should include rule information in error in case of rule violation of an item", () => {
      const validator = array(string({ minLength: 10 }));
      const result = validator.unstable_validate(["a", "b", "c"]);
      expect(result.error).toMatchObject({
        type: "array-index",
        data: ["a", "b", "c"],
        entry: {
          index: 0,
          node: { type: "rule-violation", rule: "minLength", data: "a" },
        },
      });
    });

    it.each([{ input: [1, 2, 3], rules: { minLength: 5 } }])(
      "should include rules information in error",
      ({ input, rules }) => {
        expect(array(rules).unstable_validate(input).error).toMatchObject({
          context: { rules },
        });
      }
    );

    it("should include 'schema' path in error in case of schema violation", () => {
      const input = "not an array";
      const validator = array();
      const result = validator.unstable_validate(input);
      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();

      expect(result.error).toMatchObject({
        type: "schema-violation",
        data: input,
      });
    });

    it("should include 'item' path in error in case of item violation", () => {
      const input = [1, 2, 3];
      const validator = array(string());
      const result = validator.unstable_validate(input);
      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();

      expect(result.error).toMatchObject({
        type: "array-index",
        data: input,
        entry: { index: 0, node: { type: "schema-violation", data: input[0] } },
      });
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it("should accept arrays meeting minimum length", () => {
        const validator = array({ minLength: 3 });

        // Should accept any array with at least 3 items
        const result1 = validator.unstable_validate([1, 2, 3]);
        expect(result1.value).toEqual([1, 2, 3]);
        expect(result1.error).toBeUndefined();

        const result2 = validator.unstable_validate(["a", "b", "c", "d"]);
        expect(result2.value).toEqual(["a", "b", "c", "d"]);
        expect(result2.error).toBeUndefined();

        const result3 = validator.unstable_validate([
          true,
          false,
          null,
          undefined,
        ]);
        expect(result3.value).toEqual([true, false, null, undefined]);
        expect(result3.error).toBeUndefined();

        const result4 = validator.unstable_validate([{}, [], 42, "mixed"]);
        expect(result4.value).toEqual([{}, [], 42, "mixed"]);
        expect(result4.error).toBeUndefined();

        // Should reject arrays shorter than minimum length
        const result5 = validator.unstable_validate([]);
        expect(result5.value).toBeUndefined();
        expect(result5.error).toBeDefined();

        const result6 = validator.unstable_validate([1]);
        expect(result6.value).toBeUndefined();
        expect(result6.error).toBeDefined();

        const result7 = validator.unstable_validate([1, 2]);
        expect(result7.value).toBeUndefined();
        expect(result7.error).toBeDefined();
      });

      it("should reject arrays shorter than minimum length", () => {
        const validator = array({ minLength: 3 });

        const result = validator.unstable_validate([1, 2]);
        expect(result.value).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it("should include 'rule' path in error in case of minLength violation", () => {
        const input = [1, 2, 3];
        const validator = array({ minLength: 5 });
        const result = validator.unstable_validate(input);
        expect(result.value).toBeUndefined();
        expect(result.error).toBeDefined();

        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "minLength",
          data: input,
        });
      });
    });
  });
});
