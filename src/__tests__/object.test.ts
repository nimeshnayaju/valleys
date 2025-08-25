import { describe, expect, it } from "vitest";
import {
  object,
  string,
  number,
  boolean,
  array,
  ValidationError,
  or,
  undefined_,
} from "../index";

describe("object", () => {
  it("should accept any object when no validators are provided", () => {
    const validator = object();

    // Empty object
    expect(validator.unstable_validate({})).toEqual({});

    // Objects with various properties
    expect(validator.unstable_validate({ name: "John" })).toEqual({
      name: "John",
    });
    expect(validator.unstable_validate({ age: 30, active: true })).toEqual({
      age: 30,
      active: true,
    });
    expect(validator.unstable_validate({ nested: { value: 123 } })).toEqual({
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
    expect(validator.unstable_validate(complexObj)).toEqual(complexObj);
  });

  it("should validate objects with property validators", () => {
    const validator = object({
      name: string(),
      age: number(),
      isActive: boolean(),
    });

    const validObj = { name: "John", age: 30, isActive: true };
    expect(validator.unstable_validate(validObj)).toEqual(validObj);

    // Extra properties should be allowed
    const objWithExtra = {
      name: "Jane",
      age: 25,
      isActive: false,
      extra: "data",
    };
    expect(validator.unstable_validate(objWithExtra)).toEqual(objWithExtra);
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
    expect(validator.unstable_validate(validData)).toEqual(validData);
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
    expect(validator.unstable_validate(validData)).toEqual(validData);
  });

  it("should handle objects with undefined properties", () => {
    const validator = object({
      name: string(),
      optional: string(),
    });

    // undefined properties should be validated if present in the object
    const objWithUndefined = { name: "Test", optional: undefined };
    expect(() => validator.unstable_validate(objWithUndefined)).toThrowError(
      ValidationError
    );
  });

  it("should handle properties that don't have validators", () => {
    const validator = object({
      name: string(),
    });

    // Properties without validators should pass through
    const obj = { name: "Test", other: "value", another: 123 };
    expect(validator.unstable_validate(obj)).toEqual(obj);
  });

  it("should preserve object reference for valid objects", () => {
    const validator = object();
    const obj = { test: "value" };
    const result = validator.unstable_validate(obj);

    expect(result).toBe(obj);
  });

  it("should include schema for empty object validator", () => {
    const validator = object();
    expect(validator.schema).toEqual({
      type: "object",
      properties: {},
    });
  });

  it("should include schema with property schemas", () => {
    const validator = object({
      name: string(),
      age: number(),
      isActive: boolean(),
    });

    expect(validator.schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        isActive: { type: "boolean" },
      },
    });
  });

  it("should include nested schemas", () => {
    const validator = object({
      user: object({
        name: string(),
        tags: array(string()),
      }),
    });

    expect(validator.schema).toEqual({
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
    const validator = object();

    // Primitives
    expect(() => validator.unstable_validate(null)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(undefined)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate("string")).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(123)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(true)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(false)).toThrowError(
      ValidationError
    );

    // Arrays (arrays are objects but should be rejected)
    expect(() => validator.unstable_validate([])).toThrowError(ValidationError);
    expect(() => validator.unstable_validate([1, 2, 3])).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(["a", "b", "c"])).toThrowError(
      ValidationError
    );

    // Other non-plain objects
    expect(() => validator.unstable_validate(() => {})).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(Symbol("test"))).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Date())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(/regex/)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Map())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(new Set())).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(NaN)).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate(Infinity)).toThrowError(
      ValidationError
    );
  });

  it("should reject objects with invalid property values", () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    // Invalid name (not a string)
    expect(() =>
      validator.unstable_validate({ name: 123, age: 30 })
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate({ name: null, age: 30 })
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate({ name: { value: "John" }, age: 30 })
    ).toThrowError(ValidationError);

    // Invalid age (not a number)
    expect(() =>
      validator.unstable_validate({ name: "John", age: "30" })
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate({ name: "John", age: null })
    ).toThrowError(ValidationError);
    expect(() =>
      validator.unstable_validate({ name: "John", age: true })
    ).toThrowError(ValidationError);
  });

  it("should reject objects with missing properties unless specified as optional", () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    expect(() => validator.unstable_validate({ name: "John" })).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({ age: 30 })).toThrowError(
      ValidationError
    );
    expect(() => validator.unstable_validate({})).toThrowError(ValidationError);

    const optionalvalidator = object({
      name: string(),
      age: or([number(), undefined_()]),
    });

    expect(optionalvalidator.unstable_validate({ name: "John" })).toEqual({
      name: "John",
    });
  });

  it("should throw ValidationError with full details for non-object violation", () => {
    const validator = object();

    try {
      validator.unstable_validate("not an object");
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "schema",
        data: "not an object",
      });
      expect((error as ValidationError).schema).toEqual({
        type: "object",
        properties: {},
      });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed due to schema mismatch; expected schema: {"type":"object","properties":{}}; received value: "not an object"'
      );
    }
  });

  it("should throw ValidationError with full details for property validation failure", () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    try {
      validator.unstable_validate({ name: 123, age: 30 });
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "property",
        property: "name",
        path: {
          type: "schema",
          data: 123,
        },
        data: { name: 123, age: 30 },
      });
      expect((error as ValidationError).schema).toEqual({
        type: "string",
      });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed at name due to schema mismatch; expected schema: {"type":"string"}; received value: 123'
      );
    }
  });

  it("should throw ValidationError with full details for nested property validation failure", () => {
    const validator = object({
      user: object({
        profile: object({
          name: string(),
        }),
      }),
    });

    try {
      validator.unstable_validate({ user: { profile: { name: 123 } } });
      expect.fail();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).path).toEqual({
        type: "property",
        property: "user",
        path: {
          type: "property",
          property: "profile",
          path: {
            type: "property",
            property: "name",
            path: {
              type: "schema",
              data: 123,
            },
            data: { name: 123 },
          },
          data: { profile: { name: 123 } },
        },
        data: { user: { profile: { name: 123 } } },
      });
      expect((error as ValidationError).schema).toEqual({
        type: "string",
      });
      expect((error as ValidationError).rules).toEqual({});
      expect((error as ValidationError).message).toBe(
        'Validation failed at user.profile.name due to schema mismatch; expected schema: {"type":"string"}; received value: 123'
      );
    }
  });
});
