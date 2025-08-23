import { describe, expect, it } from "vitest";
import { boolean, DecoderError } from "../index";

describe("boolean", () => {
  it("should accept boolean values", () => {
    const decoder = boolean();

    // Test true
    expect(decoder.unstable_decode(true)).toBe(true);

    // Test false
    expect(decoder.unstable_decode(false)).toBe(false);
  });

  it("should reject non-boolean values", () => {
    const decoder = boolean();

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
    expect(() => decoder.unstable_decode("true")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("false")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("True")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("False")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("TRUE")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("FALSE")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("1")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("0")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(" ")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("yes")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("no")).toThrowError(DecoderError);

    // Null and undefined
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);

    // Objects and arrays
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([true])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([false])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode({ value: true })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode({ value: false })).toThrowError(
      DecoderError
    );

    // Functions
    expect(() => decoder.unstable_decode(() => true)).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(() => false)).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode(function () {
        return true;
      })
    ).toThrowError(DecoderError);

    // Symbols and other types
    expect(() => decoder.unstable_decode(Symbol("test"))).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(/regex/)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Boolean(true))).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Boolean(false))).toThrowError(
      DecoderError
    );
  });

  it("should have correct schema", () => {
    const decoder = boolean();
    expect(decoder.schema).toEqual({ type: "boolean" });
  });

  it("should have empty rules", () => {
    const decoder = boolean();
    expect(decoder.rules).toEqual({});
  });

  it("should throw DecoderError with correct schema, rules and path for non-boolean violation", () => {
    const decoder = boolean();

    try {
      decoder.unstable_decode("not a boolean");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      if (error instanceof DecoderError) {
        expect(error).toEqual(
          expect.objectContaining({
            schema: { type: "boolean" },
            rules: {},
            path: {
              type: "schema",
              data: "not a boolean",
            },
          })
        );
      }
    }
  });

  it("should handle edge cases with truthy/falsy values", () => {
    const decoder = boolean();

    // Truthy values that are not true
    expect(() => decoder.unstable_decode("non-empty string")).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(1)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(-1)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );

    // Falsy values that are not false
    expect(() => decoder.unstable_decode(0)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(-0)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(0n)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
  });
});
