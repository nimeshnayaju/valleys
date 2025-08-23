import { describe, expect, it } from "vitest";
import { undefined_, DecoderError } from "../index";

describe("undefined_", () => {
  it("should accept undefined values", () => {
    const decoder = undefined_();
    expect(decoder.unstable_decode(undefined)).toBe(undefined);
  });

  it("should reject non-undefined values", () => {
    const decoder = undefined_();

    // Null
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);

    // Booleans
    expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);

    // Numbers
    expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(1)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(-1)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(3.14)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(Infinity)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(-Infinity)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);

    // Strings
    expect(() => decoder.unstable_decode("undefined")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("UNDEFINED")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("Undefined")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(" ")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("0")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("false")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("null")).toThrowError(DecoderError);

    // Objects and arrays
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([undefined])).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode({ value: undefined })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Object())).toThrowError(
      DecoderError
    );

    // Functions
    expect(() => decoder.unstable_decode(() => undefined)).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode(function () {
        return undefined;
      })
    ).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(function () {})).toThrowError(
      DecoderError
    );

    // Symbols and other types
    expect(() => decoder.unstable_decode(Symbol("undefined"))).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(/undefined/)).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Error("undefined"))).toThrowError(
      DecoderError
    );

    // BigInt
    expect(() => decoder.unstable_decode(0n)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(123n)).toThrowError(DecoderError);
  });

  it("should have correct schema", () => {
    const decoder = undefined_();
    expect(decoder.schema).toEqual({ type: "undefined" });
  });

  it("should have empty rules", () => {
    const decoder = undefined_();
    expect(decoder.rules).toEqual({});
  });

  it("should throw DecoderError with correct schema, rules and path for non-undefined violation", () => {
    const decoder = undefined_();

    try {
      decoder.unstable_decode("not undefined");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      if (error instanceof DecoderError) {
        expect(error).toEqual(
          expect.objectContaining({
            schema: { type: "undefined" },
            rules: {},
            path: { type: "schema", data: "not undefined" },
          })
        );
      }
    }
  });

  it("should handle edge cases with undefined-like values", () => {
    const decoder = undefined_();

    // Values that might be confused with undefined
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);

    // Different ways to express undefined
    expect(decoder.unstable_decode(void 0)).toBe(undefined);
    expect(decoder.unstable_decode(void 123)).toBe(undefined);

    // Global undefined
    expect(decoder.unstable_decode(globalThis.undefined)).toBe(undefined);
  });

  it("should work correctly with strict equality", () => {
    const decoder = undefined_();

    // Only the primitive undefined value should pass
    expect(decoder.unstable_decode(undefined)).toBe(undefined);

    // Ensure the returned value is actually undefined
    const result = decoder.unstable_decode(undefined);
    expect(result === undefined).toBe(true);
    expect(result).toBeUndefined();
  });
});
