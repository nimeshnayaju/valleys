declare const brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

type Decoder<
  Output,
  Schema extends { type: string } = { type: string },
  RuleSet extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * This is an unstable API. It may change in future.
   *
   * Decode a value using the decoder.
   * @param value - The value to decode.
   * @returns The original value with narrowed type if decoding was successful. Throws `DecoderError` if decoding fails.
   */
  unstable_decode(value: unknown): Output;
  schema: Schema;
  rules: RuleSet;
};

/**
 * Utility type that extracts the output type from a decoder. This allows you to get the TypeScript type that a decoder will produce.
 *
 * @example
 * ```typescript
 * import { InferOutputOf, object, string, number, boolean, array } from 'decode-kit';
 *
 * // Simple decoder types
 * const nameDecoder = string();
 * type Name = InferOutputOf<typeof nameDecoder>; // string
 *
 * const ageDecoder = number();
 * type Age = InferOutputOf<typeof ageDecoder>; // number
 *
 * // Complex object type
 * const userDecoder = object({
 *   id: number(),
 *   name: string(),
 *   email: string(),
 *   isActive: boolean(),
 *   tags: array(string())
 * });
 *
 * type User = InferOutputOf<typeof userDecoder>;
 * // type User = {
 * //   id: number;
 * //   name: string;
 * //   email: string;
 * //   isActive: boolean;
 * //   tags: string[];
 * // }
 */
export type InferOutputOf<D extends Decoder<any, any, any>> = D extends Decoder<
  infer T,
  any,
  any
>
  ? T
  : never;

/* -------------------------------------------------------------------------------------------------
 * string
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a decoder that validates string values.
 *
 * @param rules.minLength - Minimum allowed string length
 * @param rules.maxLength - Maximum allowed string length
 * @param rules.pattern - Regular expression pattern the string must match
 * @returns A decoder for string values
 */
export function string(): Decoder<string, { type: "string" }>;
export function string(rules?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): Decoder<
  string,
  { type: "string" },
  { minLength?: number; maxLength?: number; pattern?: RegExp }
>;
export function string(rules?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): Decoder<
  string,
  { type: "string" },
  { minLength?: number; maxLength?: number; pattern?: RegExp }
> {
  return {
    unstable_decode(value: unknown): string {
      if (typeof value !== "string") {
        throw new DecoderError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && value.length < minLength) {
        throw new DecoderError(this.schema, this.rules, {
          type: "rule",
          rule: "minLength",
          data: value,
        });
      }

      const maxLength = rules?.maxLength;
      if (maxLength !== undefined && value.length > maxLength) {
        throw new DecoderError(this.schema, this.rules, {
          type: "rule",
          rule: "maxLength",
          data: value,
        });
      }

      const pattern = rules?.pattern;
      if (pattern !== undefined && !pattern.test(value)) {
        throw new DecoderError(this.schema, this.rules, {
          type: "rule",
          rule: "pattern",
          data: value,
        });
      }

      return value as string;
    },
    schema: { type: "string" },
    rules: {
      minLength: rules?.minLength,
      maxLength: rules?.maxLength,
      pattern: rules?.pattern,
    },
  };
}

/* -------------------------------------------------------------------------------------------------
 * number
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a decoder that validates number values. Only accepts finite numbers (not NaN or Infinity).
 *
 * @param rules.min - Minimum allowed value (inclusive)
 * @param rules.max - Maximum allowed value (inclusive)
 * @returns A decoder for number values
 */
export function number(): Decoder<number, { type: "number" }>;
export function number(rules?: {
  min?: number;
  max?: number;
}): Decoder<number, { type: "number" }, { min?: number; max?: number }>;
export function number(rules?: {
  min?: number;
  max?: number;
}): Decoder<number, { type: "number" }, { min?: number; max?: number }> {
  return {
    unstable_decode(value: unknown): number {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new DecoderError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const min = rules?.min;
      if (min !== undefined && value < min) {
        throw new DecoderError(this.schema, this.rules, {
          type: "rule",
          rule: "min",
          data: value,
        });
      }

      const max = rules?.max;
      if (max !== undefined && value > max) {
        throw new DecoderError(this.schema, this.rules, {
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
 * Creates a decoder that validates boolean values. Only accepts true or false.
 *
 * @returns A decoder for boolean values
 */
export function boolean(): Decoder<boolean, { type: "boolean" }> {
  return {
    unstable_decode(value: unknown): boolean {
      if (typeof value !== "boolean") {
        throw new DecoderError(this.schema, this.rules, {
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
 * Creates a decoder that validates literal/constant values. Accepts only the exact value provided.
 *
 * @param value - The literal value to match against
 * @returns A decoder for the specified constant value
 */
export function constant<
  T extends string | number | boolean | symbol | undefined | null
>(value: T): Decoder<T, { type: "constant"; value: string }> {
  return {
    unstable_decode(input: unknown): T {
      if (input !== value) {
        throw new DecoderError(this.schema, this.rules, {
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
 * Creates a decoder that validates array values.
 *
 * @param decoder - Optional decoder for array items
 * @param rules - Optional validation rules
 * @returns A decoder for array values
 */
export function array(rules: {
  minLength?: number;
}): Decoder<Array<unknown>, { type: "array" }, { minLength?: number }>;
export function array(): Decoder<
  Array<unknown>,
  { type: "array" },
  { minLength?: number }
>;
export function array<D extends Decoder<any, any, any>>(
  decoder: D,
  rules?: { minLength?: number }
): Decoder<
  Array<InferOutputOf<D>>,
  { type: "array"; item: D["schema"] },
  { minLength?: number }
>;
export function array<D extends Decoder<any, any, any>>(
  decoderOrRules?: D | { minLength?: number },
  rules?: { minLength?: number }
): Decoder<
  Array<InferOutputOf<D>>,
  { type: "array"; item?: D["schema"] },
  { minLength?: number }
> {
  let decoder: D | undefined;
  if (
    typeof decoderOrRules === "object" &&
    "unstable_decode" in decoderOrRules
  ) {
    decoder = decoderOrRules;
    rules = { minLength: rules?.minLength };
  } else {
    rules = { minLength: decoderOrRules?.minLength };
  }

  return {
    unstable_decode(value: unknown): Array<InferOutputOf<D>> {
      if (!Array.isArray(value)) {
        throw new DecoderError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && value.length < minLength) {
        throw new DecoderError(this.schema, this.rules, {
          type: "rule",
          rule: "minLength",
          data: value,
        });
      }

      if (decoder === undefined) {
        return value;
      }

      for (let i = 0; i < value.length; i++) {
        try {
          decoder.unstable_decode(value[i]);
        } catch (err) {
          if (err instanceof DecoderError) {
            throw new DecoderError(this.schema, this.rules, {
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
    schema: { type: "array", item: decoder?.schema },
    rules: { minLength: rules?.minLength },
  };
}

/* -------------------------------------------------------------------------------------------------
 * object
 * -----------------------------------------------------------------------------------------------*/
type OptionalKeys<T extends Record<string, Decoder<any, any, any>>> = {
  [K in keyof T]: undefined extends InferOutputOf<T[K]> ? K : never;
}[keyof T];

type RequiredKeys<T extends Record<string, Decoder<any, any, any>>> = Exclude<
  keyof T,
  OptionalKeys<T>
>;

type Merge<T> = T extends (...args: readonly unknown[]) => unknown
  ? T
  : { [K in keyof T]: T[K] };

type ObjectDecoderType<T extends Record<string, Decoder<any, any, any>>> =
  Merge<
    { [K in RequiredKeys<T>]: InferOutputOf<T[K]> } & {
      [K in OptionalKeys<T>]?: InferOutputOf<T[K]>;
    }
  >;

/**
 * Creates a decoder that validates object values.
 *
 * @param decoders - Optional object mapping property names to their decoders
 * @returns A decoder for object values
 */
export function object(): Decoder<
  Record<string, unknown>,
  { type: "object"; properties: Record<string, { type: string }> }
>;
export function object<T extends Record<string, Decoder<any, any, any>>>(
  decoders: T
): Decoder<
  ObjectDecoderType<T>,
  { type: "object"; properties: { [K in keyof T]: T[K]["schema"] } }
>;
export function object<T extends Record<string, Decoder<any, any, any>>>(
  decoders?: T
): Decoder<
  ObjectDecoderType<T>,
  { type: "object"; properties: Record<string, { type: string }> }
> {
  return {
    unstable_decode(value: unknown): ObjectDecoderType<T> {
      if (
        value === null ||
        value === undefined ||
        typeof value !== "object" ||
        Object.prototype.toString.call(value) !== "[object Object]"
      ) {
        throw new DecoderError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }

      if (decoders === undefined || Object.keys(decoders).length === 0) {
        return value as ObjectDecoderType<T>;
      }

      for (const key in decoders) {
        try {
          const decoder = decoders[key];
          if (!decoder) continue;

          decoder.unstable_decode((value as any)[key]);
        } catch (err) {
          if (err instanceof DecoderError) {
            throw new DecoderError(this.schema, this.rules, {
              type: "property",
              property: key,
              path: err.path,
              data: value,
            });
          }
          throw err;
        }
      }
      return value as ObjectDecoderType<T>;
    },
    schema: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(decoders || {}).map(([key, decoder]) => [
          key,
          decoder.schema,
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
 * Creates a decoder that validates ISO 8601 date-time strings. Accepts datetime strings in the format: YYYY-MM-DDTHH:mm:ss[.sss][Z|±HH:mm]
 *
 * @returns A decoder for ISO 8601 date-time strings
 */
export function iso8601(): Decoder<Iso8601, { type: "iso8601" }> {
  return {
    unstable_decode(value: unknown): Iso8601 {
      if (typeof value !== "string" || !iso8601Regex.test(value)) {
        throw new DecoderError(this.schema, this.rules, {
          type: "schema",
          data: value,
        });
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new DecoderError(this.schema, this.rules, {
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
 * Creates a decoder that validates values matching any of the provided decoders. Tries each decoder in order and returns the first successful result.
 *
 * @param decoders - Array of decoders to try in order
 * @returns A decoder that accepts values matching any of the provided decoders
 */
export function or<D extends readonly Decoder<any, any, any>[]>(
  decoders: D
): Decoder<
  InferOutputOf<D[number]>,
  { type: "or"; item: D[number]["schema"][] }
> {
  return {
    unstable_decode(value: unknown): InferOutputOf<D[number]> {
      for (const decoder of decoders) {
        try {
          return decoder.unstable_decode(value);
        } catch (err) {
          if (!(err instanceof DecoderError)) throw err;
        }
      }
      throw new DecoderError(this.schema, this.rules, {
        type: "schema",
        data: value,
      });
    },
    schema: {
      type: "or",
      item: decoders.map((decoder) => decoder.schema),
    },
    rules: {},
  };
}

/* -------------------------------------------------------------------------------------------------
 * null_
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a decoder that validates null values. Only accepts the literal null value.
 *
 * @returns A decoder for null values
 */
export function null_(): Decoder<null, { type: "null" }, {}> {
  return {
    unstable_decode(value: unknown): null {
      if (value !== null) {
        throw new DecoderError(this.schema, this.rules, {
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
 * Creates a decoder that validates undefined values. Only accepts the literal undefined value.
 */
export function undefined_(): Decoder<undefined, { type: "undefined" }, {}> {
  return {
    unstable_decode(value: unknown): undefined {
      if (value !== undefined) {
        throw new DecoderError(this.schema, this.rules, {
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

export class DecoderError<
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

  msg += ` expected schema: ${JSON.stringify(schema)}`;
  if (Object.keys(rules).length > 0) {
    msg += ` with rules: ${JSON.stringify(rules)}`;
  }

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
 * Validates a value using a decoder and asserts its type. Throws a DecoderError if validation fails.
 *
 * @param value - The value to validate
 * @param decoder - The decoder to use for validation
 * @throws {DecoderError} If the value doesn't match the decoder's schema
 * @asserts value is InferOutputOf<D>
 *
 * @example
 * ```typescript
 * import { validate, object, string, number, array } from 'decode-kit';
 *
 * const userDecoder = object({
 *   id: number(),
 *   name: string(),
 *   email: string()
 * });
 *
 * validate(data, userDecoder);
 *
 * // TypeScript now knows input is { id: number; name: string; email: string; }
 * console.log(data.name); // ✅ No type errors
 * console.log(data.email.toUpperCase()); // ✅ String methods available
 */
export function validate<D extends Decoder<any, any, any>>(
  value: unknown,
  decoder: D
): asserts value is InferOutputOf<D> {
  try {
    decoder.unstable_decode(value);
  } catch (err) {
    if (err instanceof DecoderError) {
      Error.captureStackTrace(err, validate);
    }
    throw err;
  }
}
