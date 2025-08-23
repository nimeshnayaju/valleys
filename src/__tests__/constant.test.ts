import { describe, expect, it } from "vitest";
import { constant, DecoderError } from "../index";

describe("constant", () => {
  describe("string constants", () => {
    it("should accept exact string matches", () => {
      const decoder = constant("hello");
      expect(decoder.unstable_decode("hello")).toBe("hello");
    });

    it("should reject different strings", () => {
      const decoder = constant("hello");
      expect(() => decoder.unstable_decode("Hello")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("hello ")).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(" hello")).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode("HELLO")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("world")).toThrowError(DecoderError);
    });

    it("should work with empty strings", () => {
      const decoder = constant("");
      expect(decoder.unstable_decode("")).toBe("");
      expect(() => decoder.unstable_decode(" ")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("a")).toThrowError(DecoderError);
    });

    it("should work with special characters", () => {
      const special = "!@#$%^&*()";
      const decoder = constant(special);
      expect(decoder.unstable_decode(special)).toBe(special);
      expect(() => decoder.unstable_decode("!@#$%^&*")).toThrowError(
        DecoderError
      );
    });

    it("should work with unicode and emojis", () => {
      const unicodeStr = "你好🌍";
      const decoder = constant(unicodeStr);
      expect(decoder.unstable_decode(unicodeStr)).toBe(unicodeStr);
      expect(() => decoder.unstable_decode("你好")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("🌍")).toThrowError(DecoderError);
    });

    it("should include string value in schema", () => {
      const decoder = constant("test");
      expect(decoder.schema).toEqual({ type: "constant", value: "test" });
    });

    it("should throw DecoderError with full details for non-string violation", () => {
      const decoder = constant("test");
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "test",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"test"}; received value: "actual"'
        );
      }
    });
  });

  describe("number constants", () => {
    it("should accept exact number matches", () => {
      const decoder = constant(42);
      expect(decoder.unstable_decode(42)).toBe(42);
    });

    it("should reject different numbers", () => {
      const decoder = constant(42);
      expect(() => decoder.unstable_decode(41)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(43)).toThrowError(DecoderError);
      expect(decoder.unstable_decode(42.0)).toBe(42); // This should pass as 42 === 42.0
      expect(() => decoder.unstable_decode(42.1)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(-42)).toThrowError(DecoderError);
    });

    it("should work with zero", () => {
      const decoder = constant(0);
      expect(decoder.unstable_decode(0)).toBe(0);
      expect(decoder.unstable_decode(-0)).toBe(-0); // Returns -0 as is, but -0 === 0 passes the validation
      expect(() => decoder.unstable_decode(1)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
    });

    it("should work with negative numbers", () => {
      const decoder = constant(-123);
      expect(decoder.unstable_decode(-123)).toBe(-123);
      expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
    });

    it("should work with decimal numbers", () => {
      const decoder = constant(3.14);
      expect(decoder.unstable_decode(3.14)).toBe(3.14);
      expect(() => decoder.unstable_decode(3)).toThrowError(DecoderError);
      expect(decoder.unstable_decode(3.14)).toBe(3.14); // Should pass as 3.14 === 3.140
    });

    it("should work with very large numbers", () => {
      const largeNum = 9007199254740991; // Number.MAX_SAFE_INTEGER
      const decoder = constant(largeNum);
      expect(decoder.unstable_decode(largeNum)).toBe(largeNum);
      expect(() => decoder.unstable_decode(largeNum - 1)).toThrowError(
        DecoderError
      );
    });

    it("should work with Infinity", () => {
      const decoder = constant(Infinity);
      expect(decoder.unstable_decode(Infinity)).toBe(Infinity);
      expect(() => decoder.unstable_decode(-Infinity)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(Number.MAX_VALUE)).toThrowError(
        DecoderError
      );
    });

    it("should work with -Infinity", () => {
      const decoder = constant(-Infinity);
      expect(decoder.unstable_decode(-Infinity)).toBe(-Infinity);
      expect(() => decoder.unstable_decode(Infinity)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(-Number.MAX_VALUE)).toThrowError(
        DecoderError
      );
    });

    it("should handle NaN properly", () => {
      const decoder = constant(NaN);
      // NaN !== NaN in JavaScript, so this should fail
      expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(Number.NaN)).toThrowError(
        DecoderError
      );
    });

    it("should include number value in schema as string", () => {
      const decoder = constant(42);
      expect(decoder.schema).toEqual({ type: "constant", value: "42" });
    });

    it("should throw DecoderError with full details for non-number violation", () => {
      const decoder = constant(42);
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "42",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"42"}; received value: "actual"'
        );
      }
    });
  });

  describe("boolean constants", () => {
    it("should accept exact boolean matches", () => {
      const trueDecoder = constant(true);
      expect(trueDecoder.unstable_decode(true)).toBe(true);

      const falseDecoder = constant(false);
      expect(falseDecoder.unstable_decode(false)).toBe(false);
    });

    it("should reject opposite boolean", () => {
      const trueDecoder = constant(true);
      expect(() => trueDecoder.unstable_decode(false)).toThrowError(
        DecoderError
      );

      const falseDecoder = constant(false);
      expect(() => falseDecoder.unstable_decode(true)).toThrowError(
        DecoderError
      );
    });

    it("should reject truthy/falsy values", () => {
      const trueDecoder = constant(true);
      expect(() => trueDecoder.unstable_decode(1)).toThrowError(DecoderError);
      expect(() => trueDecoder.unstable_decode("true")).toThrowError(
        DecoderError
      );
      expect(() => trueDecoder.unstable_decode({})).toThrowError(DecoderError);

      const falseDecoder = constant(false);
      expect(() => falseDecoder.unstable_decode(0)).toThrowError(DecoderError);
      expect(() => falseDecoder.unstable_decode("")).toThrowError(DecoderError);
      expect(() => falseDecoder.unstable_decode(null)).toThrowError(
        DecoderError
      );
      expect(() => falseDecoder.unstable_decode(undefined)).toThrowError(
        DecoderError
      );
    });

    it("should include boolean value in schema as string", () => {
      const trueDecoder = constant(true);
      expect(trueDecoder.schema).toEqual({ type: "constant", value: "true" });

      const falseDecoder = constant(false);
      expect(falseDecoder.schema).toEqual({ type: "constant", value: "false" });
    });

    it("should throw DecoderError with full details for non-boolean violation", () => {
      const decoder = constant(true);
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "true",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"true"}; received value: "actual"'
        );
      }
    });
  });

  describe("symbol constants", () => {
    it("should accept exact symbol matches", () => {
      const sym = Symbol("test");
      const decoder = constant(sym);
      expect(decoder.unstable_decode(sym)).toBe(sym);
    });

    it("should reject different symbols", () => {
      const sym1 = Symbol("test");
      const sym2 = Symbol("test");
      const decoder = constant(sym1);
      expect(() => decoder.unstable_decode(sym2)).toThrowError(DecoderError);
    });

    it("should reject non-symbol values", () => {
      const sym = Symbol("test");
      const decoder = constant(sym);
      expect(() => decoder.unstable_decode("Symbol(test)")).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode("test")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(Symbol)).toThrowError(DecoderError);
    });

    it("should work with Symbol.for", () => {
      const globalSym = Symbol.for("global");
      const decoder = constant(globalSym);
      expect(decoder.unstable_decode(Symbol.for("global"))).toBe(globalSym);
      expect(() => decoder.unstable_decode(Symbol("global"))).toThrowError(
        DecoderError
      );
    });

    it("should include symbol in schema as string", () => {
      const sym = Symbol("test");
      const decoder = constant(sym);
      expect(decoder.schema).toEqual({
        type: "constant",
        value: "Symbol(test)",
      });

      const symNoDesc = Symbol();
      const decoderNoDesc = constant(symNoDesc);
      expect(decoderNoDesc.schema).toEqual({
        type: "constant",
        value: "Symbol()",
      });
    });

    it("should throw DecoderError with full details for non-symbol violation", () => {
      const decoder = constant(Symbol("test"));
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "Symbol(test)",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"Symbol(test)"}; received value: "actual"'
        );
      }
    });
  });

  describe("null constant", () => {
    it("should accept null", () => {
      const decoder = constant(null);
      expect(decoder.unstable_decode(null)).toBe(null);
    });

    it("should reject non-null values", () => {
      const decoder = constant(null);
      expect(() => decoder.unstable_decode(undefined)).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("null")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    });

    it("should include null in schema as string", () => {
      const decoder = constant(null);
      expect(decoder.schema).toEqual({ type: "constant", value: "null" });
    });

    it("should throw DecoderError with full details for non-null violation", () => {
      const decoder = constant(null);
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "null",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"null"}; received value: "actual"'
        );
      }
    });
  });

  describe("undefined constant", () => {
    it("should accept undefined", () => {
      const decoder = constant(undefined);
      expect(decoder.unstable_decode(undefined)).toBe(undefined);
    });

    it("should reject non-undefined values", () => {
      const decoder = constant(undefined);
      expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode("undefined")).toThrowError(
        DecoderError
      );
      expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    });

    it("should include undefined in schema as string", () => {
      const decoder = constant(undefined);
      expect(decoder.schema).toEqual({ type: "constant", value: "undefined" });
    });

    it("should throw DecoderError with full details for non-undefined violation", () => {
      const decoder = constant(undefined);
      try {
        decoder.unstable_decode("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as DecoderError).schema).toEqual({
          type: "constant",
          value: "undefined",
        });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"undefined"}; received value: "actual"'
        );
      }
    });
  });
});
