declare const brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

type Validator<
  Output,
  Schema extends { type: string } = { type: string },
  RuleSet extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * This is an unstable API. It may change in future.
   *
   * Validate a value using the validator.
   * @param value - The value to validate.
   * @returns The original value with narrowed type if validation was successful. Throws `ValidationError` if validation fails.
   */
  unstable_validate(value: unknown): Output;
  schema: Schema;
  rules: RuleSet;
};

/**
 * Utility type that extracts the output type from a validator. This allows you to get the TypeScript type that a validator will produce.
 *
 * @example
 * ```typescript
 * import { InferOutputOf, object, string, number, boolean, array } from 'valleys';
 *
 * // Simple validator types
 * const nameValidator = string();
 * type Name = InferOutputOf<typeof nameValidator>; // string
 *
 * const ageValidator = number();
 * type Age = InferOutputOf<typeof ageValidator>; // number
 *
 * // Complex object type
 * const userValidator = object({
 *   id: number(),
 *   name: string(),
 *   email: string(),
 *   isActive: boolean(),
 *   tags: array(string())
 * });
 *
 * type User = InferOutputOf<typeof userValidator>;
 * // type User = {
 * //   id: number;
 * //   name: string;
 * //   email: string;
 * //   isActive: boolean;
 * //   tags: string[];
 * // }
 */
export type InferOutputOf<D extends Validator<any, any, any>> =
  D extends Validator<infer T, any, any> ? T : never;

/* -------------------------------------------------------------------------------------------------
 * string
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates string values.
 *
 * @param rules.minLength - Minimum allowed string length
 * @param rules.maxLength - Maximum allowed string length
 * @returns A validator for string values
 */
export function string(): Validator<string, { type: "string" }>;
export function string(rules?: {
  minLength?: number;
  maxLength?: number;
}): Validator<
  string,
  { type: "string" },
  { minLength?: number; maxLength?: number }
>;
export function string(rules?: {
  minLength?: number;
  maxLength?: number;
}): Validator<
  string,
  { type: "string" },
  { minLength?: number; maxLength?: number }
> {
  return {
    unstable_validate(value: unknown): string {
      if (typeof value !== "string") {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && value.length < minLength) {
        throw new ValidationError(this.schema, this.rules, {
          type: "rule",
          rule: "minLength",
          data: value,
        });
      }

      const maxLength = rules?.maxLength;
      if (maxLength !== undefined && value.length > maxLength) {
        throw new ValidationError(this.schema, this.rules, {
          type: "rule",
          rule: "maxLength",
          data: value,
        });
      }

      return value as string;
    },
    schema: { type: "string" },
    rules: {
      minLength: rules?.minLength,
      maxLength: rules?.maxLength,
    },
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
export function number(): Validator<number, { type: "number" }>;
export function number(rules?: {
  min?: number;
  max?: number;
}): Validator<number, { type: "number" }, { min?: number; max?: number }>;
export function number(rules?: {
  min?: number;
  max?: number;
}): Validator<number, { type: "number" }, { min?: number; max?: number }> {
  return {
    unstable_validate(value: unknown): number {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const min = rules?.min;
      if (min !== undefined && value < min) {
        throw new ValidationError(this.schema, this.rules, {
          type: "rule",
          rule: "min",
          data: value,
        });
      }

      const max = rules?.max;
      if (max !== undefined && value > max) {
        throw new ValidationError(this.schema, this.rules, {
          type: "rule",
          rule: "max",
          data: value,
        });
      }

      return value;
    },
    schema: { type: "number" },
    rules: { min: rules?.min, max: rules?.max },
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
export function boolean(): Validator<boolean, { type: "boolean" }> {
  return {
    unstable_validate(value: unknown): boolean {
      if (typeof value !== "boolean") {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      return value;
    },
    schema: { type: "boolean" },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * constant
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates literal/constant values. Accepts only the exact value provided.
 *
 * @param value - The literal value to match against
 * @returns A validator for the specified constant value
 */
export function constant<
  T extends string | number | boolean | symbol | undefined | null
>(value: T): Validator<T, { type: "constant"; value: string }> {
  return {
    unstable_validate(input: unknown): T {
      if (input !== value) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: input,
        });
      }
      return input as T;
    },
    schema: { type: "constant", value: String(value) },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * array
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates array values.
 *
 * @param validator - Optional validator for array items
 * @param rules - Optional validation rules
 * @returns A validator for array values
 */
export function array(rules: {
  minLength?: number;
}): Validator<Array<unknown>, { type: "array" }, { minLength?: number }>;
export function array(): Validator<
  Array<unknown>,
  { type: "array" },
  { minLength?: number }
>;
export function array<D extends Validator<any, any, any>>(
  validator: D,
  rules?: { minLength?: number }
): Validator<
  Array<InferOutputOf<D>>,
  { type: "array"; item: D["schema"] },
  { minLength?: number }
>;
export function array<D extends Validator<any, any, any>>(
  validatorOrRules?: D | { minLength?: number },
  rules?: { minLength?: number }
): Validator<
  Array<InferOutputOf<D>>,
  { type: "array"; item?: D["schema"] },
  { minLength?: number }
> {
  let validator: D | undefined;
  if (
    typeof validatorOrRules === "object" &&
    "unstable_validate" in validatorOrRules
  ) {
    validator = validatorOrRules;
    rules = { minLength: rules?.minLength };
  } else {
    rules = { minLength: validatorOrRules?.minLength };
  }

  return {
    unstable_validate(value: unknown): Array<InferOutputOf<D>> {
      if (!Array.isArray(value)) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && value.length < minLength) {
        throw new ValidationError(this.schema, this.rules, {
          type: "rule",
          rule: "minLength",
          data: value,
        });
      }

      if (validator === undefined) {
        return value;
      }

      for (let i = 0; i < value.length; i++) {
        try {
          validator.unstable_validate(value[i]);
        } catch (err) {
          if (err instanceof ValidationError) {
            throw new ValidationError(err.schema, err.rules, {
              type: "item",
              index: i,
              data: value,
              path: err.path,
            });
          }
          throw err;
        }
      }
      return value;
    },
    schema: { type: "array", item: validator?.schema },
    rules: { minLength: rules?.minLength },
  };
}

/* -------------------------------------------------------------------------------------------------
 * object
 * -----------------------------------------------------------------------------------------------*/
type OptionalKeys<T extends Record<string, Validator<any, any, any>>> = {
  [K in keyof T]: undefined extends InferOutputOf<T[K]> ? K : never;
}[keyof T];

type RequiredKeys<T extends Record<string, Validator<any, any, any>>> = Exclude<
  keyof T,
  OptionalKeys<T>
>;

type Merge<T> = T extends (...args: readonly unknown[]) => unknown
  ? T
  : { [K in keyof T]: T[K] };

type ObjectValidatorType<T extends Record<string, Validator<any, any, any>>> =
  Merge<
    { [K in RequiredKeys<T>]: InferOutputOf<T[K]> } & {
      [K in OptionalKeys<T>]?: InferOutputOf<T[K]>;
    }
  >;

/**
 * Creates a validator that validates object values.
 *
 * @param validators - Optional object mapping property names to their validators
 * @returns A validator for object values
 */
export function object(): Validator<
  Record<string, unknown>,
  { type: "object"; properties: Record<string, { type: string }> }
>;
export function object<T extends Record<string, Validator<any, any, any>>>(
  validators: T
): Validator<
  ObjectValidatorType<T>,
  { type: "object"; properties: { [K in keyof T]: T[K]["schema"] } }
>;
export function object<T extends Record<string, Validator<any, any, any>>>(
  validators?: T
): Validator<
  ObjectValidatorType<T>,
  { type: "object"; properties: Record<string, { type: string }> }
> {
  return {
    unstable_validate(value: unknown): ObjectValidatorType<T> {
      if (
        value === null ||
        value === undefined ||
        typeof value !== "object" ||
        Object.prototype.toString.call(value) !== "[object Object]"
      ) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      if (validators === undefined || Object.keys(validators).length === 0) {
        return value as ObjectValidatorType<T>;
      }

      for (const key in validators) {
        try {
          const validator = validators[key];
          if (!validator) continue;

          validator.unstable_validate((value as any)[key]);
        } catch (err) {
          if (err instanceof ValidationError) {
            throw new ValidationError(err.schema, err.rules, {
              type: "property",
              property: key,
              path: err.path,
              data: value,
            });
          }
          throw err;
        }
      }
      return value as ObjectValidatorType<T>;
    },
    schema: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(validators || {}).map(([key, validator]) => [
          key,
          validator.schema,
        ])
      ) as { [K in keyof T]: T[K]["schema"] },
    },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * iso8601
 * -----------------------------------------------------------------------------------------------*/
/**
 * A branded type representing a valid ISO 8601 date-time string.
 */
export type Iso8601 = Brand<string, "Iso8601">;

const iso8601Regex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Creates a validator that validates ISO 8601 date-time strings. Accepts datetime strings in the format: YYYY-MM-DDTHH:mm:ss[.sss][Z|±HH:mm]
 *
 * @returns A validator for ISO 8601 date-time strings
 */
export function iso8601(): Validator<Iso8601, { type: "iso8601" }> {
  return {
    unstable_validate(value: unknown): Iso8601 {
      if (typeof value !== "string" || !iso8601Regex.test(value)) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      return value as Iso8601;
    },
    schema: { type: "iso8601" },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * or
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates values matching any of the provided validators. Tries each validator in order and returns the first successful result.
 *
 * @param validators - Array of validators to try in order
 * @returns A validator that accepts values matching any of the provided validators
 */
export function or<D extends readonly Validator<any, any, any>[]>(
  validators: D
): Validator<
  InferOutputOf<D[number]>,
  { type: "or"; item: D[number]["schema"][] }
> {
  return {
    unstable_validate(value: unknown): InferOutputOf<D[number]> {
      for (const validator of validators) {
        try {
          return validator.unstable_validate(value);
        } catch (err) {
          // If the error is not a ValidationError, rethrow it
          if (!(err instanceof ValidationError)) throw err;
        }
      }
      throw new ValidationError(this.schema, this.rules, {
        type: "schema",
        data: value,
      });
    },
    schema: {
      type: "or",
      item: validators.map((validator) => validator.schema),
    },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * null_
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates null values. Only accepts the literal null value.
 *
 * @returns A validator for null values
 */
export function null_(): Validator<null, { type: "null" }, {}> {
  return {
    unstable_validate(value: unknown): null {
      if (value !== null) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      return null;
    },
    schema: { type: "null" },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * undefined_
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates undefined values. Only accepts the literal undefined value.
 *
 * @returns A validator for undefined values
 */
export function undefined_(): Validator<undefined, { type: "undefined" }, {}> {
  return {
    unstable_validate(value: unknown): undefined {
      if (value !== undefined) {
        throw new ValidationError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      return undefined;
    },
    schema: { type: "undefined" },
    rules: {},
  };
}

type SchemaPathSegment = {
  type: "schema";
  data: unknown;
};

type RulePathSegment<
  R extends Record<string, unknown> = Record<string, unknown>,
  D = unknown
> = {
  type: "rule";
  rule: keyof R;
  data: D;
};

type IndexedItemErrorPath = {
  type: "item";
  index: number;
  path:
    | SchemaPathSegment
    | RulePathSegment
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath;
  data: Array<unknown>;
};

type KeyedPropertyErrorPath = {
  type: "property";
  property: string;
  path:
    | SchemaPathSegment
    | RulePathSegment
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath;
  data: object;
};

type RuleDataType<S extends { type: string }> = S extends { type: "string" }
  ? string
  : S extends { type: "number" }
  ? number
  : S extends { type: "boolean" }
  ? boolean
  : S extends { type: "object" }
  ? object
  : S extends { type: "array" }
  ? Array<unknown>
  : S extends { type: "iso8601" }
  ? Iso8601
  : never;

export class ValidationError<
  S extends { type: string } = { type: string },
  R extends Record<string, unknown> = Record<string, unknown>
> extends Error {
  #path:
    | SchemaPathSegment
    | RulePathSegment<R, RuleDataType<S>>
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath;
  #schema: S;
  #rules: R;

  constructor(
    schema: S,
    rules: R,
    path:
      | SchemaPathSegment
      | RulePathSegment<R, RuleDataType<S>>
      | KeyedPropertyErrorPath
      | IndexedItemErrorPath
  ) {
    super(
      formatError(
        path as
          | SchemaPathSegment
          | RulePathSegment
          | KeyedPropertyErrorPath
          | IndexedItemErrorPath,
        schema,
        rules
      )
    );
    this.#path = path;
    this.#schema = schema;
    this.#rules = rules;
  }

  get path():
    | SchemaPathSegment
    | RulePathSegment<R, RuleDataType<S>>
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath {
    return this.#path;
  }

  get schema(): S {
    return this.#schema;
  }

  get rules(): R {
    return this.#rules;
  }
}

function formatError(
  path:
    | SchemaPathSegment
    | RulePathSegment
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath,
  schema: { type: string },
  rules: Record<string, unknown>
): string {
  const pathString = formatErrorPath(path);
  let msg = `Validation failed`;
  if (pathString !== "") {
    msg += ` at ${pathString}`;
  }

  let currentPath = path;
  while (currentPath.type !== "schema" && currentPath.type !== "rule") {
    currentPath = currentPath.path;
  }

  const leafPath: SchemaPathSegment | RulePathSegment = currentPath;
  if (leafPath.type === "schema") {
    msg += " due to schema mismatch;";
  } else if (leafPath.type === "rule") {
    msg += ` due to rule violation: ${String(leafPath.rule)};`;
  }

  // TODO: Switch to a safe stringify function or util.inspect to handle BigInt, Symbol, functions, and circular structures.
  msg += ` expected schema: ${JSON.stringify(schema)}`;
  if (Object.keys(rules).filter((key) => rules[key] !== undefined).length > 0) {
    msg += ` with rules: ${JSON.stringify(rules)}`;
  }
  msg += `; received value: ${JSON.stringify(leafPath.data)}`;

  return msg;
}

function formatErrorPath(
  path:
    | SchemaPathSegment
    | RulePathSegment
    | KeyedPropertyErrorPath
    | IndexedItemErrorPath
): string {
  switch (path.type) {
    case "schema":
    case "rule":
      return "";
    case "property": {
      const rest = formatErrorPath(path.path);
      if (!rest) {
        return path.property;
      }
      if (rest.startsWith("[")) {
        return `${path.property}${rest}`;
      }
      return `${path.property}.${rest}`;
    }
    case "item": {
      const rest = formatErrorPath(path.path);
      if (!rest) {
        return `[${path.index}]`;
      }
      if (rest.startsWith("[")) {
        return `[${path.index}]${rest}`;
      }
      return `[${path.index}].${rest}`;
    }
    default:
      return "";
  }
}

/**
 * Validates a value using a validator and asserts its type. Throws a ValidationError if validation fails.
 *
 * @param value - The value to validate
 * @param validator - The validator to use for validation
 * @throws {ValidationError} If the value doesn't match the validator's schema
 * @asserts value is InferOutputOf<D>
 *
 * @example
 * ```typescript
 * import { validate, object, string, number, array } from 'valleys';
 *
 * const userValidator = object({
 *   id: number(),
 *   name: string(),
 *   email: string()
 * });
 *
 * validate(data, userValidator);
 *
 * // TypeScript now knows input is { id: number; name: string; email: string; }
 * console.log(data.name); // ✅ No type errors
 * console.log(data.email.toUpperCase()); // ✅ String methods available
 */
export function validate<D extends Validator<any, any, any>>(
  value: unknown,
  validator: D
): asserts value is InferOutputOf<D> {
  try {
    validator.unstable_validate(value);
  } catch (err) {
    if (err instanceof ValidationError) {
      Error.captureStackTrace(err, validate);
    }
    throw err;
  }
}
