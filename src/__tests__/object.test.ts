import { describe, expect, it } from "vitest";
import {
  object,
  string,
  number,
  boolean,
  array,
  or,
  undefined_,
} from "../index";

describe("object", () => {
  it("should accept any object when no validators are provided", () => {
    const validator = object();

    // Empty object
    const result1 = validator.unstable_validate({});
    expect(result1.value).toEqual({});
    expect(result1.error).toBeUndefined();

    // Objects with various properties
    const result2 = validator.unstable_validate({ name: "John" });
    expect(result2.value).toEqual({ name: "John" });
    expect(result2.error).toBeUndefined();

    const result3 = validator.unstable_validate({ age: 30, active: true });
    expect(result3.value).toEqual({ age: 30, active: true });
    expect(result3.error).toBeUndefined();

    const result4 = validator.unstable_validate({ nested: { value: 123 } });
    expect(result4.value).toEqual({ nested: { value: 123 } });
    expect(result4.error).toBeUndefined();

    // Complex objects
    const complexObj = {
      id: 1,
      name: "Test",
      tags: ["a", "b", "c"],
      metadata: { created: new Date(), updated: null },
      fn: () => {},
    };
    const result5 = validator.unstable_validate(complexObj);
    expect(result5.value).toEqual(complexObj);
    expect(result5.error).toBeUndefined();
  });

  it("should validate objects with property validators", () => {
    const validator = object({
      name: string(),
      age: number(),
      isActive: boolean(),
    });

    const validObj = { name: "John", age: 30, isActive: true };
    const result1 = validator.unstable_validate(validObj);
    expect(result1.value).toEqual(validObj);
    expect(result1.error).toBeUndefined();

    // Extra properties should be allowed
    const objWithExtra = {
      name: "Jane",
      age: 25,
      isActive: false,
      extra: "data",
    };
    const result2 = validator.unstable_validate(objWithExtra);
    expect(result2.value).toEqual(objWithExtra);
    expect(result2.error).toBeUndefined();
  });

  it("should work with nested object validators", () => {
    const validator = object({
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
    const result = validator.unstable_validate(validData);
    expect(result.value).toEqual(validData);
    expect(result.error).toBeUndefined();
  });

  it("should work with array validators in objects", () => {
    const validator = object({
      tags: array(string()),
      scores: array(number()),
    });

    const validData = {
      tags: ["javascript", "typescript", "node"],
      scores: [85, 92, 78],
    };
    const result = validator.unstable_validate(validData);
    expect(result.value).toEqual(validData);
    expect(result.error).toBeUndefined();
  });

  it("should handle objects with undefined properties", () => {
    const validator = object({
      name: string(),
      optional: string(),
    });

    // undefined properties should be validated if present in the object
    const objWithUndefined = { name: "Test", optional: undefined };
    const result = validator.unstable_validate(objWithUndefined);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should handle properties that don't have validators", () => {
    const validator = object({
      name: string(),
    });

    // Properties without validators should pass through
    const obj = { name: "Test", other: "value", another: 123 };
    const result = validator.unstable_validate(obj);
    expect(result.value).toEqual(obj);
    expect(result.error).toBeUndefined();
  });

  it("should reject non-objects", () => {
    const validator = object();

    // Primitives
    const result1 = validator.unstable_validate(null);
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate(undefined);
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    const result3 = validator.unstable_validate("string");
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();

    const result4 = validator.unstable_validate(123);
    expect(result4.value).toBeUndefined();
    expect(result4.error).toBeDefined();

    const result5 = validator.unstable_validate(true);
    expect(result5.value).toBeUndefined();
    expect(result5.error).toBeDefined();

    const result6 = validator.unstable_validate(false);
    expect(result6.value).toBeUndefined();
    expect(result6.error).toBeDefined();

    // Arrays (arrays are objects but should be rejected)
    const result7 = validator.unstable_validate([]);
    expect(result7.value).toBeUndefined();
    expect(result7.error).toBeDefined();

    const result8 = validator.unstable_validate([1, 2, 3]);
    expect(result8.value).toBeUndefined();
    expect(result8.error).toBeDefined();

    const result9 = validator.unstable_validate(["a", "b", "c"]);
    expect(result9.value).toBeUndefined();
    expect(result9.error).toBeDefined();

    // Other non-plain objects
    const result10 = validator.unstable_validate(() => {});
    expect(result10.value).toBeUndefined();
    expect(result10.error).toBeDefined();

    const result11 = validator.unstable_validate(Symbol("test"));
    expect(result11.value).toBeUndefined();
    expect(result11.error).toBeDefined();

    const result12 = validator.unstable_validate(NaN);
    expect(result12.value).toBeUndefined();
    expect(result12.error).toBeDefined();

    const result13 = validator.unstable_validate(Infinity);
    expect(result13.value).toBeUndefined();
    expect(result13.error).toBeDefined();
  });

  it("should reject objects with invalid property values", () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    // Invalid name (not a string)
    const result1 = validator.unstable_validate({ name: 123, age: 30 });
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate({ name: null, age: 30 });
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    const result3 = validator.unstable_validate({
      name: { value: "John" },
      age: 30,
    });
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();

    // Invalid age (not a number)
    const result4 = validator.unstable_validate({ name: "John", age: "30" });
    expect(result4.value).toBeUndefined();
    expect(result4.error).toBeDefined();

    const result5 = validator.unstable_validate({ name: "John", age: null });
    expect(result5.value).toBeUndefined();
    expect(result5.error).toBeDefined();

    const result6 = validator.unstable_validate({ name: "John", age: true });
    expect(result6.value).toBeUndefined();
    expect(result6.error).toBeDefined();
  });

  it("should reject objects with missing properties unless specified as optional", () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    const result1 = validator.unstable_validate({ name: "John" });
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate({ age: 30 });
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    const result3 = validator.unstable_validate({});
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();

    const optionalvalidator = object({
      name: string(),
      age: or([number(), undefined_()]),
    });

    const result4 = optionalvalidator.unstable_validate({ name: "John" });
    expect(result4.value).toEqual({ name: "John" });
    expect(result4.error).toBeUndefined();
  });

  it("should accept non-plain objects", () => {
    const validator = object();
    const result1 = validator.unstable_validate(new Date());
    expect(result1.value).toBeDefined();
    expect(result1.error).toBeUndefined();

    const result2 = validator.unstable_validate(/regex/);
    expect(result2.value).toBeDefined();
    expect(result2.error).toBeUndefined();

    const result3 = validator.unstable_validate(new Map());
    expect(result3.value).toBeDefined();
    expect(result3.error).toBeUndefined();

    const result4 = validator.unstable_validate(new Set());
    expect(result4.value).toBeDefined();
    expect(result4.error).toBeUndefined();
  });

  it("should return the original value", () => {
    const value = { name: "Test" };
    const result = object().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    // Empty object
    expect(object().schema).toEqual({
      type: "object",
      properties: {},
    });

    // Object with properties
    expect(
      object({
        name: string(),
        age: number(),
        isActive: boolean(),
      }).schema
    ).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        isActive: { type: "boolean" },
      },
    });

    // Object with nested properties
    expect(
      object({
        user: object({
          name: string(),
          age: number(),
        }),
      }).schema
    ).toEqual({
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: { name: { type: "string" }, age: { type: "number" } },
        },
      },
    });
  });

  it("should include rules", () => {
    expect(object().rules).toEqual({});
    expect(object({ name: string() }).rules).toEqual({});
    expect(object({ name: string(), age: number() }).rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(object().unstable_validate(123).error).toMatchObject({
      schema: { type: "object", properties: {} },
    });
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = 123;
    const validator = object();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      path: { type: "schema", data: input },
    });
  });

  it("should include 'property' path in error in case of property violation", () => {
    const input = { name: 123 };
    const validator = object({ name: string() });
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      path: {
        type: "property",
        property: "name",
        path: { type: "schema", data: input["name"] },
        data: input,
      },
    });

    // Nested property
    const input2 = { user: { name: 123 } };
    const validator2 = object({ user: object({ name: string() }) });
    const result2 = validator2.unstable_validate(input2);
    expect(result2.error).toMatchObject({
      path: {
        type: "property",
        property: "user",
        path: {
          type: "property",
          property: "name",
          path: { type: "schema", data: input2["user"]["name"] },
          data: input2["user"],
        },
        data: input2,
      },
    });
  });
});
