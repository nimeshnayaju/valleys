import { describe, expect, it } from "vitest";
import {
  object,
  string,
  number,
  boolean,
  array,
  DecoderError,
  or,
  undefined_,
} from "../index";

describe("object", () => {
  it("should accept any object when no decoders are provided", () => {
    const decoder = object();

    // Empty object
    expect(decoder.unstable_decode({})).toEqual({});

    // Objects with various properties
    expect(decoder.unstable_decode({ name: "John" })).toEqual({ name: "John" });
    expect(decoder.unstable_decode({ age: 30, active: true })).toEqual({
      age: 30,
      active: true,
    });
    expect(decoder.unstable_decode({ nested: { value: 123 } })).toEqual({
      nested: { value: 123 },
    });

    // Complex objects
    const complexObj = {
      id: 1,
      name: "Test",
      tags: ["a", "b", "c"],
      metadata: { created: new Date(), updated: null },
      fn: () => {},
    };
    expect(decoder.unstable_decode(complexObj)).toEqual(complexObj);
  });

  it("should validate objects with property decoders", () => {
    const decoder = object({
      name: string(),
      age: number(),
      isActive: boolean(),
    });

    const validObj = { name: "John", age: 30, isActive: true };
    expect(decoder.unstable_decode(validObj)).toEqual(validObj);

    // Extra properties should be allowed
    const objWithExtra = {
      name: "Jane",
      age: 25,
      isActive: false,
      extra: "data",
    };
    expect(decoder.unstable_decode(objWithExtra)).toEqual(objWithExtra);
  });

  it("should work with nested object decoders", () => {
    const decoder = object({
      user: object({
        name: string(),
        age: number(),
      }),
      settings: object({
        theme: string(),
        notifications: boolean(),
      }),
    });

    const validData = {
      user: { name: "Alice", age: 28 },
      settings: { theme: "dark", notifications: true },
    };
    expect(decoder.unstable_decode(validData)).toEqual(validData);
  });

  it("should work with array decoders in objects", () => {
    const decoder = object({
      tags: array(string()),
      scores: array(number()),
    });

    const validData = {
      tags: ["javascript", "typescript", "node"],
      scores: [85, 92, 78],
    };
    expect(decoder.unstable_decode(validData)).toEqual(validData);
  });

  it("should handle objects with undefined properties", () => {
    const decoder = object({
      name: string(),
      optional: string(),
    });

    // undefined properties should be validated if present in the object
    const objWithUndefined = { name: "Test", optional: undefined };
    expect(() => decoder.unstable_decode(objWithUndefined)).toThrowError(
      DecoderError
    );
  });

  it("should handle properties that don't have decoders", () => {
    const decoder = object({
      name: string(),
    });

    // Properties without decoders should pass through
    const obj = { name: "Test", other: "value", another: 123 };
    expect(decoder.unstable_decode(obj)).toEqual(obj);
  });

  it("should preserve object reference for valid objects", () => {
    const decoder = object();
    const obj = { test: "value" };
    const result = decoder.unstable_decode(obj);

    expect(result).toBe(obj);
  });

  it("should include schema for empty object decoder", () => {
    const decoder = object();
    expect(decoder.schema).toEqual({
      type: "object",
      properties: {},
    });
  });

  it("should include schema with property schemas", () => {
    const decoder = object({
      name: string(),
      age: number(),
      isActive: boolean(),
    });

    expect(decoder.schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        isActive: { type: "boolean" },
      },
    });
  });

  it("should include nested schemas", () => {
    const decoder = object({
      user: object({
        name: string(),
        tags: array(string()),
      }),
    });

    expect(decoder.schema).toEqual({
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            tags: { type: "array", item: { type: "string" } },
          },
        },
      },
    });
  });

  it("should reject non-objects", () => {
    const decoder = object();

    // Primitives
    expect(() => decoder.unstable_decode(null)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(undefined)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode("string")).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(123)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(true)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(false)).toThrowError(DecoderError);

    // Arrays (arrays are objects but should be rejected)
    expect(() => decoder.unstable_decode([])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode([1, 2, 3])).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(["a", "b", "c"])).toThrowError(
      DecoderError
    );

    // Other non-plain objects
    expect(() => decoder.unstable_decode(() => {})).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(Symbol("test"))).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(new Date())).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode(/regex/)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Map())).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(new Set())).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(NaN)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(Infinity)).toThrowError(DecoderError);
    expect(() => decoder.unstable_decode(BigInt(123))).toThrowError(
      DecoderError
    );
  });

  it("should reject objects with invalid property values", () => {
    const decoder = object({
      name: string(),
      age: number(),
    });

    // Invalid name (not a string)
    expect(() => decoder.unstable_decode({ name: 123, age: 30 })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode({ name: null, age: 30 })).toThrowError(
      DecoderError
    );
    expect(() =>
      decoder.unstable_decode({ name: { value: "John" }, age: 30 })
    ).toThrowError(DecoderError);

    // Invalid age (not a number)
    expect(() =>
      decoder.unstable_decode({ name: "John", age: "30" })
    ).toThrowError(DecoderError);
    expect(() =>
      decoder.unstable_decode({ name: "John", age: null })
    ).toThrowError(DecoderError);
    expect(() =>
      decoder.unstable_decode({ name: "John", age: true })
    ).toThrowError(DecoderError);
  });

  it("should reject objects with missing properties unless specified as optional", () => {
    const decoder = object({
      name: string(),
      age: number(),
    });

    expect(() => decoder.unstable_decode({ name: "John" })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode({ age: 30 })).toThrowError(
      DecoderError
    );
    expect(() => decoder.unstable_decode({})).toThrowError(DecoderError);

    const optionalDecoder = object({
      name: string(),
      age: or([number(), undefined_()]),
    });

    expect(optionalDecoder.unstable_decode({ name: "John" })).toEqual({
      name: "John",
    });
  });

  it("should throw DecoderError with correct schema, rules and path for non-object violation", () => {
    const decoder = object();

    try {
      decoder.unstable_decode("not an object");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      expect(error).toEqual(
        expect.objectContaining({
          schema: {
            type: "object",
            properties: {},
          },
          rules: {},
          path: {
            type: "schema",
            data: "not an object",
          },
        })
      );
    }
  });

  it("should throw DecoderError with correct schema, rules and path for property validation failure", () => {
    const decoder = object({
      name: string(),
      age: number(),
    });

    try {
      decoder.unstable_decode({ name: 123, age: 30 });
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      expect(error).toEqual(
        expect.objectContaining({
          schema: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
          },
          rules: {},
          path: {
            type: "property",
            property: "name",
            path: {
              type: "schema",
              data: 123,
            },
            data: { name: 123, age: 30 },
          },
        })
      );
    }
  });

  it("should throw DecoderError with correct schema, rules and path for nested property validation failure", () => {
    const decoder = object({
      user: object({
        profile: object({
          name: string(),
        }),
      }),
    });

    try {
      decoder.unstable_decode({ user: { profile: { name: 123 } } });
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(DecoderError);
      expect(error).toEqual(
        expect.objectContaining({
          schema: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  profile: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          rules: {},
          path: expect.objectContaining({
            property: "user",
          }),
        })
      );
    }
  });
});
