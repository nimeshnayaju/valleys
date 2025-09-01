import { describe, expect, it } from "vitest";
import { number } from "../index";

describe("number", () => {
  it.each([
    // Basic cases
    123,
    0,
    -456,
    3.14,
    -2.71,

    // Edge cases
    -0,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.EPSILON,
    0.000000000000001,
    1e10,
    1e-10,
    1.23e4,
  ])("should accept number %s", (value) => {
    const result = number().unstable_validate(value);
    expect(result.value).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it.each([
    "123", // string
    "hello", // string
    true, // boolean
    false, // boolean
    null, // null
    undefined, // undefined
    {}, // object
    [], // array
    () => {}, // function
    Symbol("test"), // symbol
    new Date(), // Date object
    /regex/, // RegExp
    new Map(), // Map
    new Set(), // Set
  ])("should reject value '%s'", (value) => {
    const result = number().unstable_validate(value);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it.each([Infinity, -Infinity, NaN])(
    "should reject non-finite number %s",
    (value) => {
      const result = number().unstable_validate(value);
      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
    }
  );

  it("should return the original value", () => {
    const value = 123;
    const result = number().unstable_validate(value);
    expect(result.value).toBe(value);
  });

  it("should include schema", () => {
    const validator = number();
    expect(validator.schema).toEqual({ type: "number" });
  });

  it.each([{}, { min: 5 }, { max: 10 }, { min: 5, max: 10 }])(
    "should include rules %s",
    (rules) => {
      const validator = number(rules);
      expect(validator.rules).toEqual(rules);
    }
  );

  it("should include schema information in error", () => {
    expect(number().unstable_validate("123").error).toMatchObject({
      context: { schema: { type: "number" } },
    });
  });

  it.each([
    { input: 3, rules: { min: 5 } },
    { input: 15, rules: { max: 5 } },
    { input: 3, rules: { min: 5, max: 10 } },
  ])("should include rules information in error", ({ input, rules }) => {
    expect(number(rules).unstable_validate(input).error).toMatchObject({
      context: { rules },
    });
  });

  it("should include 'schema' path in error in case of schema violation", () => {
    const input = "123";
    const validator = number();
    const result = validator.unstable_validate(input);
    expect(result.error).toMatchObject({
      type: "schema-violation",
      data: input,
    });
  });

  describe("rules", () => {
    describe("min", () => {
      it.each([
        { input: 10, rules: { min: 10 } },
        { input: 15, rules: { min: 10 } },
        { input: 100, rules: { min: 10 } },
        { input: 10.1, rules: { min: 10 } },
        { input: -5, rules: { min: -10 } },
        { input: 0, rules: { min: -10 } },
        { input: 4, rules: { min: 3.14 } },
      ])(
        "should accept number $input meeting minimum value $rules.min",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBe(input);
          expect(result.error).toBeUndefined();
        }
      );

      it.each([
        { input: 9, rules: { min: 10 } },
        { input: 0, rules: { min: 10 } },
        { input: -5, rules: { min: 10 } },
        { input: 9.99, rules: { min: 10 } },
        { input: -11, rules: { min: -10 } },
        { input: 3, rules: { min: 3.14 } },
      ])(
        "should reject number $input less than minimum value $rules.min",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBeUndefined();
          expect(result.error).toBeDefined();
        }
      );

      it("should include 'rule' path in error in case of min violation", () => {
        const input = 5;
        const validator = number({ min: 10 });
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "min",
          data: input,
        });
      });
    });

    describe("max", () => {
      it.each([
        { input: 100, rules: { max: 100 } },
        { input: 50, rules: { max: 100 } },
        { input: 0, rules: { max: 100 } },
        { input: -10, rules: { max: 100 } },
        { input: 99.9, rules: { max: 100 } },
        { input: -20, rules: { max: -10 } },
        { input: 3, rules: { max: 3.14 } },
      ])(
        "should accept number $input meeting maximum value $rules.max",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBe(input);
          expect(result.error).toBeUndefined();
        }
      );

      it.each([
        { input: 101, rules: { max: 100 } },
        { input: 200, rules: { max: 100 } },
        { input: 100.1, rules: { max: 100 } },
        { input: -9, rules: { max: -10 } },
        { input: 0, rules: { max: -10 } },
        { input: 4, rules: { max: 3.14 } },
      ])(
        "should reject number $input greater than maximum value $rules.max",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBeUndefined();
          expect(result.error).toBeDefined();
        }
      );

      it("should include 'rule' path in error in case of max violation", () => {
        const input = 15;
        const validator = number({ max: 10 });
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "max",
          data: input,
        });
      });
    });

    describe("min and max combined", () => {
      it.each([
        { input: 10, rules: { min: 10, max: 20 } },
        { input: 15, rules: { min: 10, max: 20 } },
        { input: 20, rules: { min: 10, max: 20 } },
        { input: 12.5, rules: { min: 10, max: 20 } },
        { input: -15, rules: { min: -20, max: -10 } },
        { input: 0, rules: { min: -10, max: 10 } },
      ])(
        "should accept number $input within range $rules.min to $rules.max",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBe(input);
          expect(result.error).toBeUndefined();
        }
      );

      it.each([
        { input: 9, rules: { min: 10, max: 20 } },
        { input: 21, rules: { min: 10, max: 20 } },
        { input: 0, rules: { min: 10, max: 20 } },
        { input: 100, rules: { min: 10, max: 20 } },
        { input: -21, rules: { min: -20, max: -10 } },
        { input: -9, rules: { min: -20, max: -10 } },
        { input: -11, rules: { min: -10, max: 10 } },
        { input: 11, rules: { min: -10, max: 10 } },
      ])(
        "should reject number $input outside range $rules.min to $rules.max",
        ({ input, rules }) => {
          const result = number(rules).unstable_validate(input);
          expect(result.value).toBeUndefined();
          expect(result.error).toBeDefined();
        }
      );

      it("should include 'rule' path in error in case of min and max violation", () => {
        const input = 5;
        const validator = number({ min: 10, max: 20 });
        const result = validator.unstable_validate(input);
        expect(result.error).toMatchObject({
          type: "rule-violation",
          rule: "min",
          data: input,
        });
      });
    });
  });
});
