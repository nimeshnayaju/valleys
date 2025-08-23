import { describe, expect, it } from "vitest";
import { or, string, number, boolean, DecoderError, null_ } from "../index";

describe("or", () => {
  it("should accept values matching any of the provided decoders", () => {
    const decoder = or([string(), number()]);

    // String values
    expect(decoder.unstable_decode("hello")).toBe("hello");
    expect(decoder.unstable_decode("")).toBe("");
    expect(decoder.unstable_decode("123")).toBe("123");

    // Number values
    expect(decoder.unstable_decode(123)).toBe(123);
    expect(decoder.unstable_decode(0)).toBe(0);
    expect(decoder.unstable_decode(-456)).toBe(-456);
    expect(decoder.unstable_decode(3.14)).toBe(3.14);
  });

  it("should try decoders in order and return first successful match", () => {
    // Both string() and number() would accept "123" as a string,
    // but string() comes first so it should be used
    const decoder1 = or([string(), number()]);
    expect(decoder1.unstable_decode("123")).toBe("123");
    expect(typeof decoder1.unstable_decode("123")).toBe("string");

    // If we reverse the order, number() can't decode "123" string,
    // so it falls back to string()
    const decoder2 = or([number(), string()]);
    expect(decoder2.unstable_decode("123")).toBe("123");
    expect(typeof decoder2.unstable_decode("123")).toBe("string");

    // But numeric 123 will be decoded by number() in both cases
    expect(decoder2.unstable_decode(123)).toBe(123);
    expect(typeof decoder2.unstable_decode(123)).toBe("number");
  });

  it("should work with multiple decoder types", () => {
    const decoder = or([string(), number(), boolean(), null_()]);

    expect(decoder.unstable_decode("test")).toBe("test");
    expect(decoder.unstable_decode(42)).toBe(42);
    expect(decoder.unstable_decode(true)).toBe(true);
    expect(decoder.unstable_decode(false)).toBe(false);
    expect(decoder.unstable_decode(null)).toBe(null);
  });

  it("should work with a single decoder", () => {
    const decoder = or([string()]);

    expect(decoder.unstable_decode("test")).toBe("test");
    expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
  });

  it("should handle empty decoder array", () => {
    const decoder = or([]);

    // Should always throw since no decoders to try
    expect(() => decoder.unstable_decode("test")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
  });

  it("should throw DecoderError with full details for no decoder matches", () => {
    const decoder = or([string(), number()]);

    try {
      decoder.unstable_decode(true);
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      expect((error as DecoderError).path).toEqual({
        type: "schema",
        data: true,
      });
      expect((error as DecoderError).schema).toEqual({
        type: "or",
        item: [{ type: "string" }, { type: "number" }],
      });
      expect((error as DecoderError).rules).toEqual({});
      expect((error as DecoderError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"or","item":[{"type":"string"},{"type":"number"}]}; received value: true'
      );
    }
  });

  it("should only catch DecoderError, not other errors", () => {
    const throwingDecoder = {
      unstable_decode() {
        throw new Error("Custom error");
      },
      schema: { type: "custom" },
      rules: {},
    };

    const decoder = or([throwingDecoder as any, string()]);

    expect(() => decoder.unstable_decode("test")).toThrowError("Custom error");
  });
});
