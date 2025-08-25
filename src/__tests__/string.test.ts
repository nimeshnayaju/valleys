import { describe, expect, it } from "vitest";
import { string, ValidationError } from "../index";

describe("string", () => {
  describe("basic", () => {
    it("should accept strings", () => {
      const validator = string();
      expect(validator.unstable_validate("hello")).toBe("hello");

      // Edge cases
      expect(validator.unstable_validate("")).toBe(""); // empty string
      expect(validator.unstable_validate(" ")).toBe(" "); // space
      expect(validator.unstable_validate("123")).toBe("123"); // numeric string
      expect(validator.unstable_validate("true")).toBe("true"); // boolean-like string
      expect(validator.unstable_validate("null")).toBe("null"); // null-like string
      expect(validator.unstable_validate("undefined")).toBe("undefined"); // undefined-like string

      // Special characters
      expect(validator.unstable_validate("!@#$%^&*()")).toBe("!@#$%^&*()");
      expect(validator.unstable_validate("hello\nworld")).toBe("hello\nworld"); // newline
      expect(validator.unstable_validate("hello\tworld")).toBe("hello\tworld"); // tab
      expect(validator.unstable_validate("hello\\world")).toBe("hello\\world"); // backslash
      expect(validator.unstable_validate('hello"world')).toBe('hello"world'); // quotes
      expect(validator.unstable_validate("hello'world")).toBe("hello'world"); // single quotes

      // Unicode and emojis
      expect(validator.unstable_validate("你好世界")).toBe("你好世界"); // Chinese
      expect(validator.unstable_validate("مرحبا بالعالم")).toBe(
        "مرحبا بالعالم"
      ); // Arabic
      expect(validator.unstable_validate("🌍🚀✨")).toBe("🌍🚀✨"); // emojis
      expect(validator.unstable_validate("café")).toBe("café"); // accented characters

      // Very long string
      const longString = "a".repeat(10000);
      expect(validator.unstable_validate(longString)).toBe(longString);
    });

    it("should reject non-strings", () => {
      const validator = string();
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

      // Additional edge cases
      expect(() => validator.unstable_validate({})).toThrowError(
        ValidationError
      ); // object
      expect(() => validator.unstable_validate([])).toThrowError(
        ValidationError
      ); // array
      expect(() => validator.unstable_validate([1, 2, 3])).toThrowError(
        ValidationError
      ); // array with values
      expect(() => validator.unstable_validate({ key: "value" })).toThrowError(
        ValidationError
      ); // object with values
      expect(() => validator.unstable_validate(() => {})).toThrowError(
        ValidationError
      ); // function
      expect(() => validator.unstable_validate(Symbol("test"))).toThrowError(
        ValidationError
      ); // symbol
      expect(() => validator.unstable_validate(NaN)).toThrowError(
        ValidationError
      ); // NaN
      expect(() => validator.unstable_validate(Infinity)).toThrowError(
        ValidationError
      ); // Infinity
      expect(() => validator.unstable_validate(-Infinity)).toThrowError(
        ValidationError
      ); // -Infinity
      expect(() => validator.unstable_validate(new Date())).toThrowError(
        ValidationError
      ); // Date object
      expect(() => validator.unstable_validate(/regex/)).toThrowError(
        ValidationError
      ); // RegExp
      expect(() => validator.unstable_validate(new Map())).toThrowError(
        ValidationError
      ); // Map
      expect(() => validator.unstable_validate(new Set())).toThrowError(
        ValidationError
      ); // Set
    });

    it("should throw ValidationError with full details for non-string violation", () => {
      const validator = string();
      try {
        validator.unstable_validate(123);
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).path).toEqual({
          type: "schema",
          data: 123,
        });
        expect((error as ValidationError).schema).toEqual({ type: "string" });
        expect((error as ValidationError).rules).toEqual({});
        expect((error as ValidationError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"string"}; received value: 123'
        );
      }
    });

    it("should include schema", () => {
      const validator = string();
      expect(validator.schema).toEqual({ type: "string" });
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it("should accept strings meeting minimum length", () => {
        const validator = string({ minLength: 3 });

        expect(validator.unstable_validate("abc")).toBe("abc");
        expect(validator.unstable_validate("hello")).toBe("hello");
        expect(validator.unstable_validate("a very long string")).toBe(
          "a very long string"
        );

        // Edge cases with special characters and unicode
        expect(validator.unstable_validate("你好世")).toBe("你好世"); // 3 Chinese characters
        expect(validator.unstable_validate("🌍🚀✨")).toBe("🌍🚀✨"); // 3 emojis
        expect(validator.unstable_validate("   ")).toBe("   "); // 3 spaces
        expect(validator.unstable_validate("\n\n\n")).toBe("\n\n\n"); // 3 newlines
        expect(validator.unstable_validate("a\tb\tc")).toBe("a\tb\tc"); // with tabs
      });

      it("should reject strings shorter than minimum length", () => {
        const validator = string({ minLength: 3 });

        expect(() => validator.unstable_validate("")).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate("a")).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate("ab")).toThrowError(
          ValidationError
        );
      });

      it("should include minLength in rules", () => {
        const validator = string({ minLength: 5 });
        expect(validator.rules).toEqual({
          minLength: 5,
          maxLength: undefined,
        });
      });

      it("should throw ValidationError with full details for minLength violation", () => {
        const validator = string({ minLength: 5 });

        try {
          validator.unstable_validate("abc");
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: "abc",
          });
          expect((error as ValidationError).schema).toEqual({ type: "string" });
          expect((error as ValidationError).rules).toEqual({ minLength: 5 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"string"} with rules: {"minLength":5}; received value: "abc"'
          );
        }
      });
    });

    describe("maxLength", () => {
      it("should accept strings within maximum length", () => {
        const validator = string({ maxLength: 5 });

        expect(validator.unstable_validate("")).toBe("");
        expect(validator.unstable_validate("hello")).toBe("hello");
        expect(validator.unstable_validate("hi")).toBe("hi");
      });

      it("should reject strings longer than maximum length", () => {
        const validator = string({ maxLength: 5 });

        expect(() => validator.unstable_validate("hello world")).toThrowError(
          ValidationError
        );
        expect(() => validator.unstable_validate("123456")).toThrowError(
          ValidationError
        );
      });

      it("should include maxLength in rules", () => {
        const validator = string({ maxLength: 10 });
        expect(validator.rules).toEqual({
          minLength: undefined,
          maxLength: 10,
        });
      });

      it("should throw ValidationError with full details for maxLength violation", () => {
        const validator = string({ maxLength: 5 });

        try {
          validator.unstable_validate("hello world");
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).path).toEqual({
            type: "rule",
            rule: "maxLength",
            data: "hello world",
          });
          expect((error as ValidationError).schema).toEqual({ type: "string" });
          expect((error as ValidationError).rules).toEqual({ maxLength: 5 });
          expect((error as ValidationError).message).toBe(
            'Validation failed due to rule violation: maxLength; expected schema: {"type":"string"} with rules: {"maxLength":5}; received value: "hello world"'
          );
        }
      });
    });
  });
});
