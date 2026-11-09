declare const brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type Validator<
  Output,
  Schema extends { type: string } = { type: string },
  RuleSet extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * This is an unstable API. It may change in future.
   *
   * Validate a value using the validator.
   *
   * @param input - The value to validate.
   * @returns An object with a `value` property if validation was successful, or an `error` property if validation
   *   failed.
   */
  unstable_validate: (input: unknown) => { value: Output; error?: never } | { value?: never; error: ValidationFailure };
  /**
   * What the validator accepts, in this module's terms rather than JSON Schema's: `or()` lists its `options`,
   * `record()` its `values` and `constant()` its `value`. Limits such as `maxLength` are in `rules`.
   */
  schema: Schema;
  rules: RuleSet;
};

/**
 * Why validation failed and where. `path` leads from the validated value to the one that failed, as `["documentIds",
 * 1]`. A `schema-mismatch` means that value isn't what `schema` describes; a `rule-violation` means it is, but breaks
 * the named rule.
 */
type ValidationFailure =
  | {
      type: "schema-mismatch";
      path: Array<string | number>;
      input: unknown;
      schema: { type: string };
      rules: Record<string, unknown>;
    }
  | {
      type: "rule-violation";
      rule: string;
      path: Array<string | number>;
      input: unknown;
      schema: { type: string };
      rules: Record<string, unknown>;
    };

/**
 * Utility type that extracts the output type from a validator. This allows you to get the TypeScript type that a
 * validator will produce.
 *
 * @example
 *   ```typescript
 *   import { type InferOutputOf, object, string, number, boolean, array } from "valleys";
 *
 *   // Simple validator types
 *   const nameValidator = string();
 *   type Name = InferOutputOf<typeof nameValidator>; // string
 *
 *   const ageValidator = number();
 *   type Age = InferOutputOf<typeof ageValidator>; // number
 *
 *   // Complex object type
 *   const userValidator = object({
 *     id: number(),
 *     name: string(),
 *     email: string(),
 *     isActive: boolean(),
 *     tags: array(string())
 *   });
 *
 *   type User = InferOutputOf<typeof userValidator>;
 *   // type User = {
 *   //   id: number;
 *   //   name: string;
 *   //   email: string;
 *   //   isActive: boolean;
 *   //   tags: string[];
 *   // }
 *   ```;
 */
export type InferOutputOf<D extends Validator<any, any, any>> = D extends Validator<infer T, any, any> ? T : never;

/**
 * Represents an unconstrained value in the validators' wire-data model.
 *
 * This type excludes `undefined`, because `undefined` is not valid wire data. It is intentionally not a recursive
 * JSON-value type.
 *
 * `AnyValue` may include non-JSON JavaScript values if such values are passed directly to the validator. The validators
 * assume inputs normally come from decoded wire data, while `any()` itself only rejects `undefined`.
 */
export type AnyValue = {} | null;

function isValidator(value: unknown): value is Validator<any, any, any> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Validator<any, any, any>>;
  return (
    typeof candidate.unstable_validate === "function" &&
    typeof candidate.schema === "object" &&
    candidate.schema !== null &&
    typeof candidate.schema.type === "string" &&
    typeof candidate.rules === "object" &&
    candidate.rules !== null
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/* -------------------------------------------------------------------------------------------------
 * any
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates an unconstrained wire-data value validator.
 *
 * This is similar to JSON Schema's always-valid schema (`true` or `{}`), except that it rejects `undefined` because
 * `undefined` is not valid wire data.
 *
 * This validator does not recursively check JSON compatibility. It only rejects `undefined` and otherwise applies no
 * additional constraints.
 *
 * In object schemas, `any()` means the key is required and its value is unconstrained. Use `optional(any())` when the
 * key may be absent.
 *
 * @returns A validator for any non-undefined value
 */
export function any(): Validator<AnyValue, { type: "any" }, {}> {
  const schema = { type: "any" } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (input === undefined) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value: input };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * string
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates string values.
 *
 * Lengths count UTF-16 code units, as `String.prototype.length` and HTML's `maxlength` do, so "🌍" has length 2. JSON
 * Schema's `minLength` and `maxLength` count characters (code points) instead.
 *
 * @param rules.minLength - Minimum allowed string length.
 * @param rules.maxLength - Maximum allowed string length.
 * @returns A validator for string values
 */
export function string(rules?: {
  minLength?: number;
  maxLength?: number;
}): Validator<string, { type: "string" }, { minLength?: number; maxLength?: number }> {
  const schema = { type: "string" } as const;
  const normalizedRules: { minLength?: number; maxLength?: number } = {
    ...(rules?.minLength === undefined ? {} : { minLength: rules.minLength }),
    ...(rules?.maxLength === undefined ? {} : { maxLength: rules.maxLength })
  };

  return {
    unstable_validate: (input: unknown) => {
      if (typeof input !== "string") {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules: normalizedRules } };
      }
      const { minLength, maxLength } = normalizedRules;
      if (minLength !== undefined && input.length < minLength) {
        return {
          error: { type: "rule-violation", rule: "minLength", path: [], input, schema, rules: normalizedRules }
        };
      }
      if (maxLength !== undefined && input.length > maxLength) {
        return {
          error: { type: "rule-violation", rule: "maxLength", path: [], input, schema, rules: normalizedRules }
        };
      }
      return { value: input };
    },
    schema,
    rules: normalizedRules
  };
}

/* -------------------------------------------------------------------------------------------------
 * number
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates number values. Only accepts finite numbers (not NaN or Infinity).
 *
 * @param rules.min - Minimum allowed value (inclusive)
 * @param rules.max - Maximum allowed value (inclusive)
 * @returns A validator for number values
 */
export function number(rules?: {
  min?: number;
  max?: number;
}): Validator<number, { type: "number" }, { min?: number; max?: number }> {
  const schema = { type: "number" } as const;
  const normalizedRules: { min?: number; max?: number } = {
    ...(rules?.min === undefined ? {} : { min: rules.min }),
    ...(rules?.max === undefined ? {} : { max: rules.max })
  };

  return {
    unstable_validate: (input: unknown) => {
      if (typeof input !== "number" || !Number.isFinite(input)) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules: normalizedRules } };
      }
      const { min, max } = normalizedRules;
      if (min !== undefined && input < min) {
        return { error: { type: "rule-violation", rule: "min", path: [], input, schema, rules: normalizedRules } };
      }
      if (max !== undefined && input > max) {
        return { error: { type: "rule-violation", rule: "max", path: [], input, schema, rules: normalizedRules } };
      }
      return { value: input };
    },
    schema,
    rules: normalizedRules
  };
}

/* -------------------------------------------------------------------------------------------------
 * integer
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates integer values.
 *
 * This follows JSON Schema's `integer` type semantics: any finite number with a zero fractional part is accepted.
 *
 * @param rules.min - Minimum allowed value (inclusive)
 * @param rules.max - Maximum allowed value (inclusive)
 * @returns A validator for integer values
 */
export function integer(rules?: {
  min?: number;
  max?: number;
}): Validator<number, { type: "integer" }, { min?: number; max?: number }> {
  const schema = { type: "integer" } as const;
  const normalizedRules: { min?: number; max?: number } = {
    ...(rules?.min === undefined ? {} : { min: rules.min }),
    ...(rules?.max === undefined ? {} : { max: rules.max })
  };

  return {
    unstable_validate: (input: unknown) => {
      if (typeof input !== "number" || !Number.isInteger(input)) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules: normalizedRules } };
      }
      const { min, max } = normalizedRules;
      if (min !== undefined && input < min) {
        return { error: { type: "rule-violation", rule: "min", path: [], input, schema, rules: normalizedRules } };
      }
      if (max !== undefined && input > max) {
        return { error: { type: "rule-violation", rule: "max", path: [], input, schema, rules: normalizedRules } };
      }
      return { value: input };
    },
    schema,
    rules: normalizedRules
  };
}

/* -------------------------------------------------------------------------------------------------
 * boolean
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates boolean values. Only accepts true or false.
 *
 * @returns A validator for boolean values
 */
export function boolean(): Validator<boolean, { type: "boolean" }, {}> {
  const schema = { type: "boolean" } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (typeof input !== "boolean") {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value: input };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * null_
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates JSON null values.
 *
 * Only accepts the literal `null` value.
 *
 * @returns A validator for null values
 */
export function null_(): Validator<null, { type: "null" }, {}> {
  const schema = { type: "null" } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (input !== null) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value: input };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * constant
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates literal/constant values. Accepts only the exact value provided.
 *
 * @param value - The literal value to match against.
 * @returns A validator for the specified constant value
 */
export function constant<T extends string | number | boolean | null>(
  value: T
): Validator<T, { type: "constant"; value: T }, {}> {
  const schema = { type: "constant", value } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (input !== value) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * url
 * -----------------------------------------------------------------------------------------------*/

export type UrlString = Brand<string, "UrlString">;

/**
 * Creates a validator that validates absolute URL strings in their URL Standard serialization: the input must be what
 * `new URL(input).href` gives back.
 *
 * `"https://example.com/"` passes. `"https://example.com"`, `" https://example.com/"` and `"https:example.com"` don't,
 * because parsing would change them. Send `url.href`, which is also what `JSON.stringify` writes for a `URL`. Since the
 * text is exactly what a URL parser reads, two equal URLs are always equal strings.
 *
 * Any scheme passes, including `javascript:`, so check `new URL(value).protocol` where the scheme matters.
 *
 * @returns A validator for URL strings
 */
export function url(): Validator<UrlString, { type: "url" }, {}> {
  const schema = { type: "url" } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (typeof input !== "string" || URL.parse(input)?.href !== input) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value: input as UrlString };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * dateTime
 * -----------------------------------------------------------------------------------------------*/

/**
 * A branded type representing a valid RFC 3339 date-time string.
 */
export type DateTimeString = Brand<string, "DateTimeString">;

// RFC 3339 section 5.6's `date-time`, with every field in range, "T" and "Z" in either case, and no leap second
const dateTimeRegex =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i;

/**
 * Creates a validator that validates date-time strings in RFC 3339's profile of ISO 8601, the one JSON Schema's
 * `date-time` format uses: `YYYY-MM-DDTHH:mm:ss[.fraction](Z|±HH:mm)`, with every field in range and the day within its
 * month. As RFC 3339 allows, "t" and "z" may be lowercase. Other ISO 8601 forms, such as the date `2024-02-29` alone,
 * don't pass.
 *
 * One deviation: a leap second such as `1998-12-31T23:59:60Z` doesn't pass, because `Date` can't represent it.
 *
 * @returns A validator for date-time strings
 */
export function dateTime(): Validator<DateTimeString, { type: "dateTime" }, {}> {
  const schema = { type: "dateTime" } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      const match = typeof input === "string" ? dateTimeRegex.exec(input) : null;
      if (match === null) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      // RFC 3339 section 5.7 bounds the day by its month, with appendix C's leap year rule. Temporal could check this,
      // but workerd doesn't enable it yet.
      const year = Number(match[1]);
      const month = Number(match[2]);
      const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const daysInMonth =
        month === 2 ? (isLeapYear ? 29 : 28) : month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
      if (Number(match[3]) > daysInMonth) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      return { value: input as DateTimeString };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * array
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates dense array values.
 *
 * Arrays cannot contain sparse holes or `undefined` items. When an item validator is provided, every item must also
 * pass that validator. The length rules are checked first, so an array longer than `maxLength` fails before any of its
 * items is validated.
 *
 * @param validator - Optional validator for array items.
 * @param rules.minLength - Minimum allowed number of items.
 * @param rules.maxLength - Maximum allowed number of items.
 * @returns A validator for array values
 */
export function array(rules?: {
  minLength?: number;
  maxLength?: number;
}): Validator<Array<AnyValue>, { type: "array" }, { minLength?: number; maxLength?: number }>;
export function array<D extends Validator<any, any, any>>(
  validator: D,
  rules?: { minLength?: number; maxLength?: number }
): Validator<Array<InferOutputOf<D>>, { type: "array"; item: D["schema"] }, { minLength?: number; maxLength?: number }>;
export function array<D extends Validator<any, any, any>>(
  validatorOrRules?: D | { minLength?: number; maxLength?: number },
  arrayRules?: { minLength?: number; maxLength?: number }
): Validator<
  Array<InferOutputOf<D>>,
  { type: "array"; item?: D["schema"] },
  { minLength?: number; maxLength?: number }
> {
  const validator = isValidator(validatorOrRules) ? (validatorOrRules as D) : undefined;
  const rules =
    validator === undefined ? (validatorOrRules as { minLength?: number; maxLength?: number } | undefined) : arrayRules;
  const normalizedRules: { minLength?: number; maxLength?: number } = {
    ...(rules?.minLength === undefined ? {} : { minLength: rules.minLength }),
    ...(rules?.maxLength === undefined ? {} : { maxLength: rules.maxLength })
  };
  const schema = { type: "array", item: validator?.schema } as const;
  const itemValidator = validator ?? any();

  return {
    unstable_validate: (input: unknown) => {
      if (!Array.isArray(input)) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules: normalizedRules } };
      }
      const { minLength, maxLength } = normalizedRules;
      if (minLength !== undefined && input.length < minLength) {
        return {
          error: { type: "rule-violation", rule: "minLength", path: [], input, schema, rules: normalizedRules }
        };
      }
      if (maxLength !== undefined && input.length > maxLength) {
        return {
          error: { type: "rule-violation", rule: "maxLength", path: [], input, schema, rules: normalizedRules }
        };
      }
      for (let i = 0; i < input.length; i++) {
        // A hole is refused like undefined, without reading an inherited index.
        if (!Object.hasOwn(input, i)) {
          return {
            error: {
              type: "schema-mismatch",
              path: [i],
              input: undefined,
              schema: itemValidator.schema,
              rules: itemValidator.rules
            }
          };
        }
        const result = itemValidator.unstable_validate(input[i]);
        if (result.error !== undefined) {
          return { error: { ...result.error, path: [i, ...result.error.path] } };
        }
      }
      return { value: input as Array<InferOutputOf<D>> };
    },
    schema,
    rules: normalizedRules
  };
}

/* -------------------------------------------------------------------------------------------------
 * object
 * -----------------------------------------------------------------------------------------------*/
const optionalBrand: unique symbol = Symbol("validators.optional");

export type OptionalField<D extends Validator<any, any, any>> = {
  readonly [optionalBrand]: true;
  readonly inner: D;
};

type ObjectField = Validator<any, any, any> | OptionalField<Validator<any, any, any>>;

/**
 * Marks an object property as optional.
 *
 * This is not a value validator and can only be used inside `object({...})`. It means the object key may be absent. If
 * the key is present, its value must pass the wrapped validator.
 *
 * `optional(string())` does not mean `string | undefined`, and it does not add `undefined` to the value type. With
 * `exactOptionalPropertyTypes`, `{ key?: T }` means the key may be absent, not that the present value may be
 * `undefined`. `undefined` is not valid wire data. Use `null_()` when JSON `null` is an allowed value.
 *
 * @example
 *   ```ts
 *   const User = object({
 *     id: string(),
 *     nickname: optional(string())
 *   });
 *
 *   // Valid:
 *   // { id: "1" }
 *   // { id: "1", nickname: "Nick" }
 *
 *   // Invalid:
 *   // { id: "1", nickname: undefined }
 *   ```;
 *
 * @param inner - The validator to use when the property is present.
 * @returns An object-field modifier accepted by object()
 */
export function optional<D extends Validator<any, any, any>>(inner: D): OptionalField<D> {
  return { [optionalBrand]: true, inner };
}

function isOptionalField(field: ObjectField): field is OptionalField<Validator<any, any, any>> {
  return optionalBrand in field;
}

type FieldValidator<T extends ObjectField> = T extends OptionalField<infer D> ? D : T;

type OptionalObjectKeys<T extends Record<string, ObjectField>> = {
  [K in keyof T]: T[K] extends OptionalField<Validator<any, any, any>> ? K : never;
}[keyof T];

type RequiredObjectKeys<T extends Record<string, ObjectField>> = Exclude<keyof T, OptionalObjectKeys<T>>;

type Merge<T> = { [K in keyof T]: T[K] };

type ObjectValidatorType<T extends Record<string, ObjectField>> = Merge<
  { [K in RequiredObjectKeys<T>]: InferOutputOf<FieldValidator<T[K]>> } & {
    [K in OptionalObjectKeys<T>]?: InferOutputOf<FieldValidator<T[K]>>;
  }
>;

type ObjectSchema<T extends Record<string, ObjectField>> = {
  type: "object";
  properties: { [K in keyof T]: FieldValidator<T[K]>["schema"] };
  required: Array<Extract<RequiredObjectKeys<T>, string>>;
};

/**
 * Creates a validator that validates plain object values.
 *
 * Object fields are required by default. Wrap a field with `optional(...)` when the property may be absent.
 * `optional(...)` only marks key presence; it does not add `undefined` to the value type or allow `undefined` as a
 * value. Any present object property with value `undefined` fails validation.
 *
 * Use `record(...)` when the keys aren't known ahead and every value passes the same validator.
 *
 * @param fields - Optional field map.
 * @returns A validator for plain object values
 */
export function object(): Validator<
  Record<string, AnyValue>,
  {
    type: "object";
    properties: Record<string, { type: string }>;
    required: string[];
  },
  {}
>;
export function object<T extends Record<string, ObjectField>>(
  fields: T
): Validator<ObjectValidatorType<T>, ObjectSchema<T>, {}> & {
  fields: T;
};
export function object(fields?: Record<string, ObjectField>): Validator<any, any, {}> & {
  fields?: Record<string, ObjectField>;
} {
  const entries = Object.entries(fields ?? {}).map(([property, field]) =>
    isOptionalField(field)
      ? { property, validator: field.inner, isOptional: true }
      : { property, validator: field, isOptional: false }
  );
  const fallbackValidator = any();
  const schema = {
    type: "object",
    properties: Object.fromEntries(entries.map(({ property, validator }) => [property, validator.schema])),
    required: entries.filter(({ isOptional }) => !isOptional).map(({ property }) => property)
  } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (!isPlainObject(input)) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }

      for (const { property, validator, isOptional } of entries) {
        const isPresent = Object.hasOwn(input, property);
        if (!isPresent && isOptional) {
          continue;
        }

        // An absent key reads as undefined, not as an inherited member such as `toString`.
        const result = validator.unstable_validate(isPresent ? input[property] : undefined);
        if (result.error !== undefined) {
          return { error: { ...result.error, path: [property, ...result.error.path] } };
        }
      }
      for (const property of Object.keys(input)) {
        if (input[property] === undefined) {
          return {
            error: {
              type: "schema-mismatch",
              path: [property],
              input: undefined,
              schema: fallbackValidator.schema,
              rules: fallbackValidator.rules
            }
          };
        }
      }
      return { value: input };
    },
    schema,
    rules,
    ...(fields === undefined ? {} : { fields })
  };
}

/* -------------------------------------------------------------------------------------------------
 * record
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates plain objects used as records: any keys, each value passing the same validator.
 *
 * @example
 *   ```ts
 *   const Manifest = record(object({ file: string() }));
 *
 *   // Valid: { "main.js": { file: "assets/main.js" } }
 *   // Invalid: { "main.js": { file: 1 } }
 *   ```;
 *
 * @param values - The validator every property value must pass.
 * @returns A validator for records
 */
export function record<D extends Validator<any, any, any>>(
  values: D
): Validator<Record<string, InferOutputOf<D>>, { type: "record"; values: D["schema"] }, {}> {
  const schema = { type: "record", values: values.schema } as const;
  const rules = {};

  return {
    unstable_validate: (input: unknown) => {
      if (!isPlainObject(input)) {
        return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
      }
      for (const property of Object.keys(input)) {
        const result = values.unstable_validate(input[property]);
        if (result.error !== undefined) {
          return { error: { ...result.error, path: [property, ...result.error.path] } };
        }
      }
      return { value: input as Record<string, InferOutputOf<D>> };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * or
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a value-union validator.
 *
 * Tries each validator in order and returns the first successful result. This models unions of values, not object
 * property absence. Use `optional(...)` inside `object({...})` when a property key may be absent.
 *
 * When every validator is an object that requires its own constant at the same property, such as `type`, the input's
 * value there picks the one validator to check it against, as TypeScript narrows a discriminated union, and the error
 * is that validator's own.
 *
 * Otherwise, when every validator fails and exactly one of them accepted the input's type, the error is that
 * validator's own: 500 against `or([null_(), integer({ max: 100 })])` reports the `max` rule. Otherwise the error is a
 * schema mismatch of the whole union.
 *
 * @example
 *   ```ts
 *   const Send = object({ type: constant("send"), content: array() });
 *   const Stop = object({ type: constant("stop"), id: string() });
 *
 *   // Against or([Send, Stop]):
 *   // { type: "stop" } fails at `id`, which is missing.
 *   // { type: "edit" } fails at `type`, which neither object allows.
 *   ```;
 *
 * @param validators - Array of validators to try in order.
 * @returns A validator that accepts values matching any of the provided validators
 */
export function or<D extends readonly Validator<any, any, any>[]>(
  validators: D
): Validator<InferOutputOf<D[number]>, { type: "or"; options: D[number]["schema"][] }, {}> {
  const schema = { type: "or", options: validators.map((validator) => validator.schema) } as const;
  const rules = {};
  // The first property at which every validator is an object that requires a constant, no two of them equal.
  const first = validators[0];
  const discriminant =
    first?.schema.type === "object"
      ? (first.schema.required as string[]).find(
          (property) =>
            validators.every(
              (validator) =>
                validator.schema.type === "object" &&
                validator.schema.required.includes(property) &&
                validator.schema.properties[property].type === "constant"
            ) &&
            new Set(validators.map((validator) => validator.schema.properties[property].value)).size ===
              validators.length
        )
      : undefined;

  return {
    unstable_validate: (input: unknown) => {
      if (discriminant !== undefined && isPlainObject(input)) {
        // An absent key reads as undefined, not as an inherited member such as `toString`.
        const value = Object.hasOwn(input, discriminant) ? input[discriminant] : undefined;
        const match = validators.find((validator) => validator.schema.properties[discriminant].value === value);
        if (match === undefined) {
          return {
            error: {
              type: "schema-mismatch",
              path: [discriminant],
              input: value,
              schema: {
                type: "or",
                options: validators.map((validator) => validator.schema.properties[discriminant])
              },
              rules: {}
            }
          };
        }
        return match.unstable_validate(input);
      }

      const typeMatches: ValidationFailure[] = [];
      for (const validator of validators) {
        const result = validator.unstable_validate(input);
        if (result.error === undefined) {
          return result;
        }
        // The input has this validator's type and failed a rule, an item or a property, as 500 fails
        // `integer({ max: 100 })`.
        if (result.error.type === "rule-violation" || result.error.path.length > 0) {
          typeMatches.push(result.error);
        }
      }
      if (typeMatches.length === 1) {
        return { error: typeMatches[0]! };
      }
      return { error: { type: "schema-mismatch", path: [], input, schema, rules } };
    },
    schema,
    rules
  };
}

/* -------------------------------------------------------------------------------------------------
 * errors
 * -----------------------------------------------------------------------------------------------*/

/**
 * The error `validate()` throws. Its `cause` says why validation failed and where.
 */
export class ValidationError extends Error {
  declare readonly cause: ValidationFailure;

  constructor(failure: ValidationFailure) {
    super(formatError(failure), { cause: failure });
    this.name = "ValidationError";
  }
}

function formatError(failure: ValidationFailure): string {
  // The path to the value that failed, such as `content[1].documentId`.
  const path = failure.path
    .map((segment, index) => (typeof segment === "number" ? `[${segment}]` : index === 0 ? segment : `.${segment}`))
    .join("");

  let message = path === "" ? "Validation failed" : `Validation failed at ${path}`;
  message +=
    failure.type === "schema-mismatch" ? " due to schema mismatch;" : ` due to rule violation: ${failure.rule};`;
  // TODO: Switch to a safe stringify function or util.inspect to handle BigInt, Symbol, functions, and circular structures.
  message += ` expected schema: ${JSON.stringify(failure.schema)}`;
  if (Object.values(failure.rules).some((value) => value !== undefined)) {
    message += ` with rules: ${JSON.stringify(failure.rules)}`;
  }
  message += `; received value: ${JSON.stringify(failure.input)}`;
  return message;
}

/**
 * Validates a value using a validator and asserts its type. Throws a ValidationError if validation fails.
 *
 * @example
 *   ```typescript
 *   import { validate, object, string, number } from "valleys";
 *
 *   const userValidator = object({
 *     id: number(),
 *     name: string(),
 *     email: string()
 *   });
 *
 *   const data: unknown = await request.json();
 *   validate(data, userValidator);
 *
 *   // TypeScript now knows data is { id: number; name: string; email: string; }
 *   console.log(data.name); // ✅ No type errors
 *   console.log(data.email.toUpperCase()); // ✅ String methods available
 *   ```;
 *
 * @param value - The value to validate.
 * @param validator - The validator to use for validation.
 * @throws {ValidationError} If the value doesn't match the validator's schema
 */
export function validate<D extends Validator<any, any, any>>(
  value: unknown,
  validator: D
): asserts value is InferOutputOf<D> {
  const result = validator.unstable_validate(value);
  if (result.error !== undefined) {
    const error = new ValidationError(result.error);
    Error.captureStackTrace(error, validate);
    throw error;
  }
}
