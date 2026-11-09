import { describe, expect, it } from "vitest";
import { number, object, record, string } from "..";

describe("record", () => {
  it("should validate every property value when given a value validator", () => {
    const validator = record(string());

    const emptyResult = validator.unstable_validate({});
    expect(emptyResult.value).toEqual({});
    expect(emptyResult.error).toBeUndefined();

    const validInput = { first: "one", second: "two" };
    const validResult = validator.unstable_validate(validInput);
    expect(validResult.value).toBe(validInput);
    expect(validResult.error).toBeUndefined();

    const invalidInput = { first: "one", second: 2 };
    const invalidResult = validator.unstable_validate(invalidInput);
    expect(invalidResult.value).toBeUndefined();
    expect(invalidResult.error).toEqual({
      type: "schema-mismatch",
      path: ["second"],
      input: 2,
      schema: { type: "string" },
      rules: {}
    });
  });

  it("should reject a value that is undefined", () => {
    const result = record(string()).unstable_validate({ first: undefined });
    expect(result.value).toBeUndefined();
    expect(result.error).toEqual({
      type: "schema-mismatch",
      path: ["first"],
      input: undefined,
      schema: { type: "string" },
      rules: {}
    });
  });

  it("should report a rule violation of a value", () => {
    const result = record(string({ minLength: 3 })).unstable_validate({ first: "one", second: "tw" });
    expect(result.value).toBeUndefined();
    expect(result.error).toEqual({
      type: "rule-violation",
      rule: "minLength",
      path: ["second"],
      input: "tw",
      schema: { type: "string" },
      rules: { minLength: 3 }
    });
  });

  it("should start the path of a nested failure with the property", () => {
    const validator = record(object({ file: string() }));

    const validInput = { "main.js": { file: "assets/main.js" } };
    const validResult = validator.unstable_validate(validInput);
    expect(validResult.value).toBe(validInput);
    expect(validResult.error).toBeUndefined();

    const result = validator.unstable_validate({ "main.js": { file: 1 } });
    expect(result.value).toBeUndefined();
    expect(result.error).toEqual({
      type: "schema-mismatch",
      path: ["main.js", "file"],
      input: 1,
      schema: { type: "string" },
      rules: {}
    });

    const result2 = record(object({ sizes: record(number({ max: 10 })) })).unstable_validate({
      "main.js": { sizes: { gzip: 5, raw: 50 } }
    });
    expect(result2.value).toBeUndefined();
    expect(result2.error).toEqual({
      type: "rule-violation",
      rule: "max",
      path: ["main.js", "sizes", "raw"],
      input: 50,
      schema: { type: "number" },
      rules: { max: 10 }
    });
  });

  it("should reject non-objects", () => {
    const validator = record(string());

    const result1 = validator.unstable_validate(null);
    expect(result1.value).toBeUndefined();
    expect(result1.error).toEqual({
      type: "schema-mismatch",
      path: [],
      input: null,
      schema: { type: "record", values: { type: "string" } },
      rules: {}
    });

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

    // Arrays (arrays are objects but should be rejected)
    const result6 = validator.unstable_validate([]);
    expect(result6.value).toBeUndefined();
    expect(result6.error).toBeDefined();

    const result7 = validator.unstable_validate(["a", "b", "c"]);
    expect(result7.value).toBeUndefined();
    expect(result7.error).toBeDefined();

    const result8 = validator.unstable_validate(() => {});
    expect(result8.value).toBeUndefined();
    expect(result8.error).toBeDefined();
  });

  it("should reject non-plain objects", () => {
    const validator = record(string());

    const result1 = validator.unstable_validate(new Date());
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate(new Map());
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    class Example {}
    const result3 = validator.unstable_validate(new Example());
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();
  });

  it("should accept null-prototype objects", () => {
    const input = Object.assign(Object.create(null) as Record<string, unknown>, {
      name: "Test"
    });

    const result = record(string()).unstable_validate(input);
    expect(result.value).toBe(input);
    expect(result.error).toBeUndefined();

    const invalid = Object.assign(Object.create(null) as Record<string, unknown>, {
      name: 1
    });
    const invalidResult = record(string()).unstable_validate(invalid);
    expect(invalidResult.value).toBeUndefined();
    expect(invalidResult.error).toMatchObject({ type: "schema-mismatch", path: ["name"], input: 1 });
  });

  it("should include schema", () => {
    expect(record(string()).schema).toEqual({ type: "record", values: { type: "string" } });
    expect(record(object({ file: string() })).schema).toEqual({
      type: "record",
      values: { type: "object", properties: { file: { type: "string" } }, required: ["file"] }
    });
  });

  it("should include rules", () => {
    expect(record(string()).rules).toEqual({});
    expect(record(string({ minLength: 1 })).rules).toEqual({});
  });
});
