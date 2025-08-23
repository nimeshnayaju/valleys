import { describe, expect, it } from "vitest";
import { null_, DecoderError } from "../index";

describe("null_", () => {
  it("should accept null values", () => {
    const decoder = null_();
    expect(decoder.unstable_decode(null)).toBe(null);
  });

  it("should reject non-null values", () => {
    const decoder = null_();

    // Undefined
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);

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
    expect(() => decoder.unstable_decode("null")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("NULL")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("Null")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(" ")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("0")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("false")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("undefined")).toThrowError(
      DecoderError
    );

    // Objects and arrays
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([null])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode({ value: null })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Object())).toThrowError(
      DecoderError
    );

    // Functions
    expect(() => decoder.unstable_decode(() => null)).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode(function () {
        return null;
      })
    ).toThrowError(DecoderError);

    // Symbols and other types
    expect(() => decoder.unstable_decode(Symbol("null"))).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(/null/)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Error("null"))).toThrowError(
      DecoderError
    );

    // BigInt
    expect(() => decoder.unstable_decode(0n)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(123n)).toThrowError(DecoderError);
  });

  it("should have correct schema", () => {
    const decoder = null_();
    expect(decoder.schema).toEqual({ type: "null" });
  });

  it("should have empty rules", () => {
    const decoder = null_();
    expect(decoder.rules).toEqual({});
  });

  it("should throw DecoderError with correct schema, rules and path for non-null violation", () => {
    const decoder = null_();

    try {
      decoder.unstable_decode("not null");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      if (error instanceof DecoderError) {
        expect(error).toEqual(
          expect.objectContaining({
            schema: { type: "null" },
            rules: {},
            path: { type: "schema", data: "not null" },
          })
        );
      }
    }
  });

  it("should handle edge cases with null-like values", () => {
    const decoder = null_();

    // Values that might be confused with null
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(void 0)).toThrowError(DecoderError);

    // Object wrappers
    expect(() => decoder.unstable_decode(Object(null))).toThrowError(
      DecoderError
    );
  });

  it("should work correctly with strict equality", () => {
    const decoder = null_();

    // Only the primitive null value should pass
    expect(decoder.unstable_decode(null)).toBe(null);

    // Ensure the returned value is actually null
    const result = decoder.unstable_decode(null);
    expect(result === null).toBe(true);
    expect(result).toBeNull();
  });
});
