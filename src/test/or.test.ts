import { describe, expect, it } from "vitest";
import { array, constant, integer, null_, number, object, optional, or, string, ValidationError, validate } from "..";

describe("or", () => {
  it("should accept values matching any of the provided validators", () => {
    const validator = or([string(), number()]);

    // String values
    const result1 = validator.unstable_validate("hello");
    expect(result1.value).toBeDefined();
    expect(result1.error).toBeUndefined();

    const result2 = validator.unstable_validate("");
    expect(result2.value).toBeDefined();
    expect(result2.error).toBeUndefined();

    const result3 = validator.unstable_validate("123");
    expect(result3.value).toBeDefined();
    expect(result3.error).toBeUndefined();

    // Number values
    const result4 = validator.unstable_validate(123);
    expect(result4.value).toBeDefined();
    expect(result4.error).toBeUndefined();

    const result5 = validator.unstable_validate(0);
    expect(result5.value).toBeDefined();
    expect(result5.error).toBeUndefined();

    const result6 = validator.unstable_validate(-456);
    expect(result6.value).toBeDefined();
    expect(result6.error).toBeUndefined();

    const result7 = validator.unstable_validate(3.14);
    expect(result7.value).toBeDefined();
    expect(result7.error).toBeUndefined();
  });

  it("should work with a single validator", () => {
    const validator = or([string()]);

    const result1 = validator.unstable_validate("test");
    expect(result1.value).toBe("test");
    expect(result1.error).toBeUndefined();

    const result2 = validator.unstable_validate(123);
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();
  });

  it("should handle empty validator array", () => {
    const validator = or([]);

    // Should always fail since no validators to try
    const result1 = validator.unstable_validate("test");
    expect(result1.value).toBeUndefined();
    expect(result1.error).toBeDefined();

    const result2 = validator.unstable_validate(123);
    expect(result2.value).toBeUndefined();
    expect(result2.error).toBeDefined();

    const result3 = validator.unstable_validate(null);
    expect(result3.value).toBeUndefined();
    expect(result3.error).toBeDefined();
  });

  it("should reject values that don't match any of the provided validators", () => {
    const validator = or([string(), number()]);
    const result = validator.unstable_validate(true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("should return the original value", () => {
    const value = "hello";
    const result = or([string(), number()]).unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    expect(or([string(), number()]).schema).toEqual({
      type: "or",
      options: [{ type: "string" }, { type: "number" }]
    });
  });

  it("should include rules", () => {
    expect(or([string(), number()]).rules).toEqual({});
  });

  it("should include schema information in error", () => {
    expect(or([string(), number()]).unstable_validate(true).error).toMatchObject({
      schema: { type: "or", options: [{ type: "string" }, { type: "number" }] }
    });
  });

  it("should report a schema mismatch", () => {
    const validator = or([string(), number()]);
    const result = validator.unstable_validate(true);
    expect(result.error).toMatchObject({
      type: "schema-mismatch",
      path: [],
      input: true
    });
  });

  it("should throw error if any of the validators throw an error", () => {
    const throwingValidator = {
      unstable_validate() {
        throw new Error("Custom error");
      },
      schema: { type: "custom" },
      rules: {}
    };

    const validator = or([throwingValidator as any, string()]);

    expect(() => validator.unstable_validate("test")).toThrowError("Custom error");
  });

  describe("errors when every validator fails", () => {
    it("should return the error of the only validator whose type matched (rule violation)", () => {
      const result = or([null_(), integer({ min: 1, max: 100 })]).unstable_validate(500);
      expect(result.value).toBeUndefined();
      expect(result.error).toEqual({
        type: "rule-violation",
        rule: "max",
        path: [],
        input: 500,
        schema: { type: "integer" },
        rules: { min: 1, max: 100 }
      });
    });

    it("should return the string rule violation of the only matching validator", () => {
      const result = or([null_(), string({ minLength: 1 })]).unstable_validate("");
      expect(result.error).toMatchObject({
        type: "rule-violation",
        rule: "minLength",
        path: [],
        input: ""
      });
    });

    it("should return the object property error of the only matching validator", () => {
      const result = or([null_(), object({ sequence: integer({ min: 0 }) })]).unstable_validate({ sequence: -1 });
      expect(result.error).toMatchObject({
        type: "rule-violation",
        rule: "min",
        path: ["sequence"],
        input: -1
      });
    });

    it("should return the array index error of the only matching validator", () => {
      const result = or([string(), array(string())]).unstable_validate([1]);
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: [0],
        input: 1
      });
    });

    it("should return the union's schema mismatch when two validators match the type", () => {
      const result = or([string({ minLength: 5 }), string({ maxLength: 2 })]).unstable_validate("abc");
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: [],
        input: "abc",
        schema: { type: "or", options: [{ type: "string" }, { type: "string" }] },
        rules: {}
      });
    });

    it("should produce a message naming the violated rule", () => {
      const validator = object({ limit: or([null_(), integer({ min: 1, max: 100 })]) });
      try {
        validate({ limit: 500 }, validator);
        expect.fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          'Validation failed at limit due to rule violation: max; expected schema: {"type":"integer"} with rules: {"min":1,"max":100}; received value: 500'
        );
      }
    });
  });

  describe("objects with a tag", () => {
    it("should return the tagged branch's own error when its property fails", () => {
      const validator = or([object({ type: constant("a"), n: integer({ min: 1 }) }), object({ type: constant("b") })]);
      const input = { type: "a", n: 0 };
      const result = validator.unstable_validate(input);
      expect(result.error).toMatchObject({
        type: "rule-violation",
        rule: "min",
        path: ["n"],
        input: 0
      });
    });

    it("should check only the branch the tag names and report its missing property", () => {
      const validator = or([
        object({ type: constant("send"), content: array() }),
        object({ type: constant("stop"), id: string() })
      ]);
      const input = { type: "stop" };
      const result = validator.unstable_validate(input);
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: ["id"],
        input: undefined
      });
      try {
        validate(input, validator);
        expect.fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          'Validation failed at id due to schema mismatch; expected schema: {"type":"string"}; received value: undefined'
        );
      }
    });

    it("should report an unknown tag value at the tag property", () => {
      const validator = or([
        object({ type: constant("send"), content: array() }),
        object({ type: constant("stop"), id: string() })
      ]);
      const input = { type: "edit" };
      const result = validator.unstable_validate(input);
      expect(result.error).toEqual({
        type: "schema-mismatch",
        path: ["type"],
        input: "edit",
        schema: {
          type: "or",
          options: [
            { type: "constant", value: "send" },
            { type: "constant", value: "stop" }
          ]
        },
        rules: {}
      });
      try {
        validate(input, validator);
        expect.fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          'Validation failed at type due to schema mismatch; expected schema: {"type":"or","options":[{"type":"constant","value":"send"},{"type":"constant","value":"stop"}]}; received value: "edit"'
        );
      }
    });

    it("should report a missing tag at the tag property", () => {
      const validator = or([
        object({ type: constant("send"), content: array() }),
        object({ type: constant("stop"), id: string() })
      ]);
      const input = { id: "m1" };
      const result = validator.unstable_validate(input);
      expect(result.error).toEqual({
        type: "schema-mismatch",
        path: ["type"],
        input: undefined,
        schema: {
          type: "or",
          options: [
            { type: "constant", value: "send" },
            { type: "constant", value: "stop" }
          ]
        },
        rules: {}
      });
    });

    it("should read the tag only from the input's own property", () => {
      const validator = or([object({ toString: constant("a") }), object({ toString: constant("b") })]);
      const input = {};
      const result = validator.unstable_validate(input);
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: ["toString"],
        input: undefined
      });
    });

    it("should return the whole-union error for inputs that are not plain objects", () => {
      const validator = or([
        object({ type: constant("send"), content: array() }),
        object({ type: constant("stop"), id: string() })
      ]);
      for (const input of ["stop", null, []]) {
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "schema-mismatch",
          path: [],
          input,
          schema: { type: "or" },
          rules: {}
        });
      }
    });

    it("should accept valid tagged inputs and return them", () => {
      const validator = or([
        object({ type: constant("send"), content: array() }),
        object({ type: constant("stop"), id: string() })
      ]);
      const send = { type: "send", content: [] };
      const sendResult = validator.unstable_validate(send);
      expect(sendResult.value).toEqual(send);
      expect(sendResult.error).toBeUndefined();
      const stop = { type: "stop", id: "m1" };
      const stopResult = validator.unstable_validate(stop);
      expect(stopResult.value).toEqual(stop);
      expect(stopResult.error).toBeUndefined();
    });

    it("should report the inner path of a tagged union nested in an array", () => {
      const validator = object({
        content: array(
          or([
            object({ type: constant("text"), text: string({ minLength: 1 }) }),
            object({ type: constant("reference"), documentId: string({ minLength: 1 }) })
          ])
        )
      });
      try {
        validate({ content: [{ type: "text", text: "" }] }, validator);
        expect.fail("Expected ValidationError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toMatch(
          /^Validation failed at content\[0\]\.text due to rule violation: minLength/
        );
      }
    });

    it("should use the first distinct constant as the tag when a tag value is shared", () => {
      const validator = or([
        object({ type: constant("reference"), kind: constant("document"), documentId: string() }),
        object({ type: constant("reference"), kind: constant("chat"), chatId: string() })
      ]);
      const input = { type: "reference", kind: "chat", chatId: 5 };
      const result = validator.unstable_validate(input);
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: ["chatId"],
        input: 5
      });
    });

    it("should return the whole-union error when null_ sits beside the tagged objects", () => {
      const send = object({ type: constant("send"), content: array() });
      const stop = object({ type: constant("stop"), id: string() });
      const flat = or([null_(), send, stop]).unstable_validate({ type: "stop" });
      expect(flat.error).toMatchObject({
        type: "schema-mismatch",
        path: [],
        schema: { type: "or" },
        rules: {}
      });
      const nested = or([null_(), or([send, stop])]).unstable_validate({ type: "stop" });
      expect(nested.error).toMatchObject({
        path: ["id"]
      });
    });

    it("should still try every branch when tag values are repeated", () => {
      const validator = or([
        object({ type: constant("a"), x: string() }),
        object({ type: constant("a"), y: string() })
      ]);
      const failed = validator.unstable_validate({ type: "a" });
      expect(failed.error).toMatchObject({
        type: "schema-mismatch",
        path: [],
        schema: { type: "or" },
        rules: {}
      });
      const passed = validator.unstable_validate({ type: "a", y: "1" });
      expect(passed.value).toEqual({ type: "a", y: "1" });
      expect(passed.error).toBeUndefined();
    });

    it("should not treat an optional constant as a tag", () => {
      const validator = or([object({ type: optional(constant("a")), x: string() }), object({ type: constant("b") })]);
      const failed = validator.unstable_validate({ x: 1 });
      expect(failed.error).toMatchObject({
        type: "schema-mismatch",
        path: [],
        schema: { type: "or" },
        rules: {}
      });
      const passed = validator.unstable_validate({ x: "1" });
      expect(passed.value).toEqual({ x: "1" });
      expect(passed.error).toBeUndefined();
    });

    it("should report the only object branch's own constant when a branch is not an object", () => {
      const validator = or([string(), object({ type: constant("a") })]);
      const result = validator.unstable_validate({ type: "b" });
      expect(result.error).toMatchObject({
        type: "schema-mismatch",
        path: ["type"],
        input: "b",
        schema: { type: "constant", value: "a" }
      });
    });
  });
});
