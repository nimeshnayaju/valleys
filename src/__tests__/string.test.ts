import { describe, expect, it } from "vitest";
import { string, DecoderError } from "../index";

describe("string", () => {
  describe("basic", () => {
    it("should accept strings", () => {
      const decoder = string();
      expect(decoder.unstable_decode("hello")).toBe("hello");

      // Edge cases
      expect(decoder.unstable_decode("")).toBe(""); // empty string
      expect(decoder.unstable_decode(" ")).toBe(" "); // space
      expect(decoder.unstable_decode("123")).toBe("123"); // numeric string
      expect(decoder.unstable_decode("true")).toBe("true"); // boolean-like string
      expect(decoder.unstable_decode("null")).toBe("null"); // null-like string
      expect(decoder.unstable_decode("undefined")).toBe("undefined"); // undefined-like string

      // Special characters
      expect(decoder.unstable_decode("!@#$%^&*()")).toBe("!@#$%^&*()");
      expect(decoder.unstable_decode("hello\nworld")).toBe("hello\nworld"); // newline
      expect(decoder.unstable_decode("hello\tworld")).toBe("hello\tworld"); // tab
      expect(decoder.unstable_decode("hello\\world")).toBe("hello\\world"); // backslash
      expect(decoder.unstable_decode('hello"world')).toBe('hello"world'); // quotes
      expect(decoder.unstable_decode("hello'world")).toBe("hello'world"); // single quotes

      // Unicode and emojis
      expect(decoder.unstable_decode("你好世界")).toBe("你好世界"); // Chinese
      expect(decoder.unstable_decode("مرحبا بالعالم")).toBe("مرحبا بالعالم"); // Arabic
      expect(decoder.unstable_decode("🌍🚀✨")).toBe("🌍🚀✨"); // emojis
      expect(decoder.unstable_decode("café")).toBe("café"); // accented characters

      // Very long string
      const longString = "a".repeat(10000);
      expect(decoder.unstable_decode(longString)).toBe(longString);
    });

    it("should reject non-strings", () => {
      const decoder = string();
      expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
      expect(() => decoder.unstable_decode(undefined)).toThrowError(
        DecoderError
      );

      // Additional edge cases
      expect(() => decoder.unstable_decode({})).toThrowError(DecoderError); // object
      expect(() => decoder.unstable_decode([])).toThrowError(DecoderError); // array
      expect(() => decoder.unstable_decode([1, 2, 3])).toThrowError(
        DecoderError
      ); // array with values
      expect(() => decoder.unstable_decode({ key: "value" })).toThrowError(
        DecoderError
      ); // object with values
      expect(() => decoder.unstable_decode(() => {})).toThrowError(
        DecoderError
      ); // function
      expect(() => decoder.unstable_decode(Symbol("test"))).toThrowError(
        DecoderError
      ); // symbol
      expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError); // NaN
      expect(() => decoder.unstable_decode(Infinity)).toThrowError(
        DecoderError
      ); // Infinity
      expect(() => decoder.unstable_decode(-Infinity)).toThrowError(
        DecoderError
      ); // -Infinity
      expect(() => decoder.unstable_decode(new Date())).toThrowError(
        DecoderError
      ); // Date object
      expect(() => decoder.unstable_decode(/regex/)).toThrowError(DecoderError); // RegExp
      expect(() => decoder.unstable_decode(new Map())).toThrowError(
        DecoderError
      ); // Map
      expect(() => decoder.unstable_decode(new Set())).toThrowError(
        DecoderError
      ); // Set
    });

    it("should throw DecoderError with full details for non-string violation", () => {
      const decoder = string();
      try {
        decoder.unstable_decode(123);
        expect.fail();
      } catch (error) {
        expect(error).toBeInstanceOf(DecoderError);
        expect((error as DecoderError).path).toEqual({
          type: "schema",
          data: 123,
        });
        expect((error as DecoderError).schema).toEqual({ type: "string" });
        expect((error as DecoderError).rules).toEqual({});
        expect((error as DecoderError).message).toBe(
          'Validation failed due to schema mismatch; expected schema: {"type":"string"}; received value: 123'
        );
      }
    });

    it("should include schema", () => {
      const decoder = string();
      expect(decoder.schema).toEqual({ type: "string" });
    });
  });

  describe("rules", () => {
    describe("minLength", () => {
      it("should accept strings meeting minimum length", () => {
        const decoder = string({ minLength: 3 });

        expect(decoder.unstable_decode("abc")).toBe("abc");
        expect(decoder.unstable_decode("hello")).toBe("hello");
        expect(decoder.unstable_decode("a very long string")).toBe(
          "a very long string"
        );

        // Edge cases with special characters and unicode
        expect(decoder.unstable_decode("你好世")).toBe("你好世"); // 3 Chinese characters
        expect(decoder.unstable_decode("🌍🚀✨")).toBe("🌍🚀✨"); // 3 emojis
        expect(decoder.unstable_decode("   ")).toBe("   "); // 3 spaces
        expect(decoder.unstable_decode("\n\n\n")).toBe("\n\n\n"); // 3 newlines
        expect(decoder.unstable_decode("a\tb\tc")).toBe("a\tb\tc"); // with tabs
      });

      it("should reject strings shorter than minimum length", () => {
        const decoder = string({ minLength: 3 });

        expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode("a")).toThrowError(DecoderError);
        expect(() => decoder.unstable_decode("ab")).toThrowError(DecoderError);
      });

      it("should include minLength in rules", () => {
        const decoder = string({ minLength: 5 });
        expect(decoder.rules).toEqual({
          minLength: 5,
          maxLength: undefined,
        });
      });

      it("should throw DecoderError with full details for minLength violation", () => {
        const decoder = string({ minLength: 5 });

        try {
          decoder.unstable_decode("abc");
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "minLength",
            data: "abc",
          });
          expect((error as DecoderError).schema).toEqual({ type: "string" });
          expect((error as DecoderError).rules).toEqual({ minLength: 5 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: minLength; expected schema: {"type":"string"} with rules: {"minLength":5}; received value: "abc"'
          );
        }
      });
    });

    describe("maxLength", () => {
      it("should accept strings within maximum length", () => {
        const decoder = string({ maxLength: 5 });

        expect(decoder.unstable_decode("")).toBe("");
        expect(decoder.unstable_decode("hello")).toBe("hello");
        expect(decoder.unstable_decode("hi")).toBe("hi");
      });

      it("should reject strings longer than maximum length", () => {
        const decoder = string({ maxLength: 5 });

        expect(() => decoder.unstable_decode("hello world")).toThrowError(
          DecoderError
        );
        expect(() => decoder.unstable_decode("123456")).toThrowError(
          DecoderError
        );
      });

      it("should include maxLength in rules", () => {
        const decoder = string({ maxLength: 10 });
        expect(decoder.rules).toEqual({
          minLength: undefined,
          maxLength: 10,
        });
      });

      it("should throw DecoderError with full details for maxLength violation", () => {
        const decoder = string({ maxLength: 5 });

        try {
          decoder.unstable_decode("hello world");
          expect.fail();
        } catch (error) {
          expect(error).toBeInstanceOf(DecoderError);
          expect((error as DecoderError).path).toEqual({
            type: "rule",
            rule: "maxLength",
            data: "hello world",
          });
          expect((error as DecoderError).schema).toEqual({ type: "string" });
          expect((error as DecoderError).rules).toEqual({ maxLength: 5 });
          expect((error as DecoderError).message).toBe(
            'Validation failed due to rule violation: maxLength; expected schema: {"type":"string"} with rules: {"maxLength":5}; received value: "hello world"'
          );
        }
      });
    });
  });
});
