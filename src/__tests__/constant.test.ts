import { describe, expect, it } from "vitest";
import { constant, ValidationError } from "../index";

describe("constant", () => {
  describe("string constants", () => {
    it("should accept exact string matches", () => {
      const validator = constant("hello");
      expect(validator.unstable_validate("hello")).toBe("hello");
    });

    it("should reject different strings", () => {
      const validator = constant("hello");
      expect(() => validator.unstable_validate("Hello")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("hello ")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(" hello")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("HELLO")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("world")).toThrowError(
        ValidationError
      );
    });

    it("should work with empty strings", () => {
      const validator = constant("");
      expect(validator.unstable_validate("")).toBe("");
      expect(() => validator.unstable_validate(" ")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("a")).toThrowError(
        ValidationError
      );
    });

    it("should work with special characters", () => {
      const special = "!@#$%^&*()";
      const validator = constant(special);
      expect(validator.unstable_validate(special)).toBe(special);
      expect(() => validator.unstable_validate("!@#$%^&*")).toThrowError(
        ValidationError
      );
    });

    it("should work with unicode and emojis", () => {
      const unicodeStr = "你好🌍";
      const validator = constant(unicodeStr);
      expect(validator.unstable_validate(unicodeStr)).toBe(unicodeStr);
      expect(() => validator.unstable_validate("你好")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("🌍")).toThrowError(
        ValidationError
      );
    });

    it("should include string value in schema", () => {
      const validator = constant("test");
      expect(validator.schema).toEqual({ type: "constant", value: "test" });
    });

    it("should throw ValidationError with full details for non-string violation", () => {
      const validator = constant("test");
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "test",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"test"}; received value: "actual"'
        );
      }
    });
  });

  describe("number constants", () => {
    it("should accept exact number matches", () => {
      const validator = constant(42);
      expect(validator.unstable_validate(42)).toBe(42);
    });

    it("should reject different numbers", () => {
      const validator = constant(42);
      expect(() => validator.unstable_validate(41)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(43)).toThrowError(
        ValidationError
      );
      expect(validator.unstable_validate(42.0)).toBe(42); // This should pass as 42 === 42.0
      expect(() => validator.unstable_validate(42.1)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(-42)).toThrowError(
        ValidationError
      );
    });

    it("should work with zero", () => {
      const validator = constant(0);
      expect(validator.unstable_validate(0)).toBe(0);
      expect(validator.unstable_validate(-0)).toBe(-0); // Returns -0 as is, but -0 === 0 passes the validation
      expect(() => validator.unstable_validate(1)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(false)).toThrowError(
        ValidationError
      );
    });

    it("should work with negative numbers", () => {
      const validator = constant(-123);
      expect(validator.unstable_validate(-123)).toBe(-123);
      expect(() => validator.unstable_validate(123)).toThrowError(
        ValidationError
      );
    });

    it("should work with decimal numbers", () => {
      const validator = constant(3.14);
      expect(validator.unstable_validate(3.14)).toBe(3.14);
      expect(() => validator.unstable_validate(3)).toThrowError(
        ValidationError
      );
      expect(validator.unstable_validate(3.14)).toBe(3.14); // Should pass as 3.14 === 3.140
    });

    it("should work with very large numbers", () => {
      const largeNum = 9007199254740991; // Number.MAX_SAFE_INTEGER
      const validator = constant(largeNum);
      expect(validator.unstable_validate(largeNum)).toBe(largeNum);
      expect(() => validator.unstable_validate(largeNum - 1)).toThrowError(
        ValidationError
      );
    });

    it("should work with Infinity", () => {
      const validator = constant(Infinity);
      expect(validator.unstable_validate(Infinity)).toBe(Infinity);
      expect(() => validator.unstable_validate(-Infinity)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(Number.MAX_VALUE)).toThrowError(
        ValidationError
      );
    });

    it("should work with -Infinity", () => {
      const validator = constant(-Infinity);
      expect(validator.unstable_validate(-Infinity)).toBe(-Infinity);
      expect(() => validator.unstable_validate(Infinity)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(-Number.MAX_VALUE)).toThrowError(
        ValidationError
      );
    });

    it("should handle NaN properly", () => {
      const validator = constant(NaN);
      // NaN !== NaN in JavaScript, so this should fail
      expect(() => validator.unstable_validate(NaN)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(Number.NaN)).toThrowError(
        ValidationError
      );
    });

    it("should include number value in schema as string", () => {
      const validator = constant(42);
      expect(validator.schema).toEqual({ type: "constant", value: "42" });
    });

    it("should throw ValidationError with full details for non-number violation", () => {
      const validator = constant(42);
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "42",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"42"}; received value: "actual"'
        );
      }
    });
  });

  describe("boolean constants", () => {
    it("should accept exact boolean matches", () => {
      const truevalidator = constant(true);
      expect(truevalidator.unstable_validate(true)).toBe(true);

      const falsevalidator = constant(false);
      expect(falsevalidator.unstable_validate(false)).toBe(false);
    });

    it("should reject opposite boolean", () => {
      const truevalidator = constant(true);
      expect(() => truevalidator.unstable_validate(false)).toThrowError(
        ValidationError
      );

      const falsevalidator = constant(false);
      expect(() => falsevalidator.unstable_validate(true)).toThrowError(
        ValidationError
      );
    });

    it("should reject truthy/falsy values", () => {
      const truevalidator = constant(true);
      expect(() => truevalidator.unstable_validate(1)).toThrowError(
        ValidationError
      );
      expect(() => truevalidator.unstable_validate("true")).toThrowError(
        ValidationError
      );
      expect(() => truevalidator.unstable_validate({})).toThrowError(
        ValidationError
      );

      const falsevalidator = constant(false);
      expect(() => falsevalidator.unstable_validate(0)).toThrowError(
        ValidationError
      );
      expect(() => falsevalidator.unstable_validate("")).toThrowError(
        ValidationError
      );
      expect(() => falsevalidator.unstable_validate(null)).toThrowError(
        ValidationError
      );
      expect(() => falsevalidator.unstable_validate(undefined)).toThrowError(
        ValidationError
      );
    });

    it("should include boolean value in schema as string", () => {
      const truevalidator = constant(true);
      expect(truevalidator.schema).toEqual({ type: "constant", value: "true" });

      const falsevalidator = constant(false);
      expect(falsevalidator.schema).toEqual({
        type: "constant",
        value: "false",
      });
    });

    it("should throw ValidationError with full details for non-boolean violation", () => {
      const validator = constant(true);
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "true",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"true"}; received value: "actual"'
        );
      }
    });
  });

  describe("symbol constants", () => {
    it("should accept exact symbol matches", () => {
      const sym = Symbol("test");
      const validator = constant(sym);
      expect(validator.unstable_validate(sym)).toBe(sym);
    });

    it("should reject different symbols", () => {
      const sym1 = Symbol("test");
      const sym2 = Symbol("test");
      const validator = constant(sym1);
      expect(() => validator.unstable_validate(sym2)).toThrowError(
        ValidationError
      );
    });

    it("should reject non-symbol values", () => {
      const sym = Symbol("test");
      const validator = constant(sym);
      expect(() => validator.unstable_validate("Symbol(test)")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("test")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(Symbol)).toThrowError(
        ValidationError
      );
    });

    it("should work with Symbol.for", () => {
      const globalSym = Symbol.for("global");
      const validator = constant(globalSym);
      expect(validator.unstable_validate(Symbol.for("global"))).toBe(globalSym);
      expect(() => validator.unstable_validate(Symbol("global"))).toThrowError(
        ValidationError
      );
    });

    it("should include symbol in schema as string", () => {
      const sym = Symbol("test");
      const validator = constant(sym);
      expect(validator.schema).toEqual({
        type: "constant",
        value: "Symbol(test)",
      });

      const symNoDesc = Symbol();
      const validatorNoDesc = constant(symNoDesc);
      expect(validatorNoDesc.schema).toEqual({
        type: "constant",
        value: "Symbol()",
      });
    });

    it("should throw ValidationError with full details for non-symbol violation", () => {
      const validator = constant(Symbol("test"));
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "Symbol(test)",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"Symbol(test)"}; received value: "actual"'
        );
      }
    });
  });

  describe("null constant", () => {
    it("should accept null", () => {
      const validator = constant(null);
      expect(validator.unstable_validate(null)).toBe(null);
    });

    it("should reject non-null values", () => {
      const validator = constant(null);
      expect(() => validator.unstable_validate(undefined)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(0)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(false)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("null")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate({})).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([])).toThrowError(
        ValidationError
      );
    });

    it("should include null in schema as string", () => {
      const validator = constant(null);
      expect(validator.schema).toEqual({ type: "constant", value: "null" });
    });

    it("should throw ValidationError with full details for non-null violation", () => {
      const validator = constant(null);
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "null",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"null"}; received value: "actual"'
        );
      }
    });
  });

  describe("undefined constant", () => {
    it("should accept undefined", () => {
      const validator = constant(undefined);
      expect(validator.unstable_validate(undefined)).toBe(undefined);
    });

    it("should reject non-undefined values", () => {
      const validator = constant(undefined);
      expect(() => validator.unstable_validate(null)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(0)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate(false)).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate("undefined")).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate({})).toThrowError(
        ValidationError
      );
      expect(() => validator.unstable_validate([])).toThrowError(
        ValidationError
      );
    });

    it("should include undefined in schema as string", () => {
      const validator = constant(undefined);
      expect(validator.schema).toEqual({
        type: "constant",
        value: "undefined",
      });
    });

    it("should throw ValidationError with full details for non-undefined violation", () => {
      const validator = constant(undefined);
      try {
        validator.unstable_validate("actual");
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: "actual",
        });
        expect((error as ValidationError).schema).toEqual({
          type: "constant",
          value: "undefined",
        });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"constant","value":"undefined"}; received value: "actual"'
        );
      }
    });
  });
});
