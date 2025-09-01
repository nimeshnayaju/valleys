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
   * @param input - The value to validate.
   * @returns An object with a `value` property if validation was successful, or an `error` property if validation failed.
   */
  unstable_validate(input: unknown):
    | { value: Output; error?: never }
    | {
        value?: never;
        error:
          | ArrayIndexErrorNode
          | ObjectPropertyErrorNode
          | SchemaViolationErrorNode
          | RuleViolationErrorNode;
      };
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
export function string(): Validator<string, { type: "string" }, {}>;
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
    unstable_validate(input: unknown) {
      if (typeof input !== "string") {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && input.length < minLength) {
        return {
          error: {
            type: "rule-violation",
            rule: "minLength",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      const maxLength = rules?.maxLength;
      if (maxLength !== undefined && input.length > maxLength) {
        return {
          error: {
            type: "rule-violation",
            rule: "maxLength",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      return { value: input };
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
    unstable_validate(input: unknown) {
      if (typeof input !== "number" || !Number.isFinite(input)) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      const min = rules?.min;
      if (min !== undefined && input < min) {
        return {
          error: {
            type: "rule-violation",
            rule: "min",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      const max = rules?.max;
      if (max !== undefined && input > max) {
        return {
          error: {
            type: "rule-violation",
            rule: "max",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      return { value: input };
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
export function boolean(): Validator<boolean, { type: "boolean" }, {}> {
  return {
    unstable_validate(input: unknown) {
      if (typeof input !== "boolean") {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      return { value: input };
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
>(value: T): Validator<T, { type: "constant"; value: string }, {}> {
  return {
    unstable_validate(input: unknown) {
      if (input !== value) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      return { value: value as T };
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
    unstable_validate(input: unknown) {
      if (!Array.isArray(input)) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      const minLength = rules?.minLength;
      if (minLength !== undefined && input.length < minLength) {
        return {
          error: {
            type: "rule-violation",
            rule: "minLength",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      if (validator === undefined) {
        return { value: input as Array<InferOutputOf<D>> };
      }

      for (let i = 0; i < input.length; i++) {
        const result = validator.unstable_validate(input[i]);
        if (result.error !== undefined) {
          return {
            error: {
              type: "array-index",
              data: input,
              entry: { index: i, node: result.error },
            },
          };
        }
      }
      return { value: input as Array<InferOutputOf<D>> };
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
  const properties = validators ? Object.keys(validators) : [];
  const _validators = validators
    ? properties.map((k) => validators[k] as Validator<unknown>)
    : [];
  const numOfProperties = properties.length;

  return {
    unstable_validate(input: unknown) {
      if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }

      if (numOfProperties === 0) {
        return { value: input as ObjectValidatorType<T> };
      }

      for (let i = 0; i < numOfProperties; i++) {
        const property = properties[i] as string;
        const validator = _validators[i] as Validator<unknown>;
        const res = validator.unstable_validate((input as any)[property]);
        if (res.error !== undefined) {
          return {
            error: {
              type: "object-property",
              data: input as Record<string, unknown>,
              entry: { property, node: res.error },
            },
          };
        }
      }
      return { value: input as ObjectValidatorType<T> };
    },
    schema: {
      type: "object",
      properties: Object.fromEntries(
        properties.map((property, index) => [
          property,
          (_validators[index] as Validator<unknown>).schema,
        ])
      ),
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
    unstable_validate(input: unknown) {
      if (typeof input !== "string" || !iso8601Regex.test(input)) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      return { value: input as Iso8601 };
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
  const numOfValidators = validators.length;
  return {
    unstable_validate(input: unknown) {
      for (let i = 0; i < numOfValidators; i++) {
        const result = (validators[i] as Validator<unknown>).unstable_validate(
          input
        );
        if (result.error === undefined) {
          return { value: result.value as InferOutputOf<D[number]> };
        }
      }
      return {
        error: {
          type: "schema-violation",
          data: input,
          context: {
            schema: this.schema,
            rules: this.rules,
          },
        },
      };
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
    unstable_validate(input: unknown) {
      if (input !== null) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      return { value: input as null };
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
    unstable_validate(input: unknown) {
      if (input !== undefined) {
        return {
          error: {
            type: "schema-violation",
            data: input,
            context: {
              schema: this.schema,
              rules: this.rules,
            },
          },
        };
      }
      return { value: input as undefined };
    },
    schema: { type: "undefined" },
    rules: {},
  };
}

type ArrayIndexErrorNode = {
  type: "array-index";
  data: Array<unknown>;
  entry: {
    index: number;
    node:
      | ArrayIndexErrorNode
      | ObjectPropertyErrorNode
      | SchemaViolationErrorNode
      | RuleViolationErrorNode;
  };
};

type ObjectPropertyErrorNode = {
  type: "object-property";
  data: Record<string, unknown>;
  entry: {
    property: string;
    node:
      | ArrayIndexErrorNode
      | ObjectPropertyErrorNode
      | SchemaViolationErrorNode
      | RuleViolationErrorNode;
  };
};

type SchemaViolationErrorNode = {
  type: "schema-violation";
  data: unknown;
  context: {
    schema: { type: string };
    rules: Record<string, unknown>;
  };
};

type RuleViolationErrorNode<
  R extends Record<string, unknown> = Record<string, unknown>,
  D = unknown
> = {
  type: "rule-violation";
  rule: keyof R;
  data: D;
  context: {
    schema: { type: string };
    rules: Record<string, unknown>;
  };
};

type ErrorPathNode =
  | ArrayIndexErrorNode
  | ObjectPropertyErrorNode
  | SchemaViolationErrorNode
  | RuleViolationErrorNode;
type ErrorLeafNode<
  R extends Record<string, unknown> = Record<string, unknown>,
  D = unknown
> = SchemaViolationErrorNode | RuleViolationErrorNode<R, D>;

export class ValidationError extends Error {
  #root: ErrorPathNode | ErrorLeafNode;

  constructor(node: ErrorPathNode | ErrorLeafNode) {
    super(formatError(node));
    this.#root = node;
  }

  get root(): ErrorPathNode | ErrorLeafNode {
    return this.#root;
  }
}

function formatError(node: ErrorPathNode | ErrorLeafNode): string {
  let message = "Validation failed";
  const pathString = formatErrorPath(node);
  if (pathString !== "") {
    message += ` at ${pathString}`;
  }

  let currentPath = node;
  while (
    currentPath.type !== "schema-violation" &&
    currentPath.type !== "rule-violation"
  ) {
    currentPath = currentPath.entry.node;
  }

  const leafNode: SchemaViolationErrorNode | RuleViolationErrorNode =
    currentPath;
  if (leafNode.type === "schema-violation") {
    message += " due to schema mismatch;";
  } else if (leafNode.type === "rule-violation") {
    message += ` due to rule violation: ${String(leafNode.rule)};`;
  }

  // TODO: Switch to a safe stringify function or util.inspect to handle BigInt, Symbol, functions, and circular structures.
  message += ` expected schema: ${JSON.stringify(leafNode.context.schema)}`;
  if (
    Object.keys(leafNode.context.rules).filter(
      (key) => leafNode.context.rules[key] !== undefined
    ).length > 0
  ) {
    message += ` with rules: ${JSON.stringify(leafNode.context.rules)}`;
  }
  message += `; received value: ${JSON.stringify(leafNode.data)}`;

  return message;
}

function formatErrorPath(node: ErrorPathNode | ErrorLeafNode): string {
  switch (node.type) {
    case "schema-violation":
    case "rule-violation":
      return "";
    case "array-index": {
      const rest = formatErrorPath(node.entry.node);
      // If the rest of the path is empty, return the index.
      if (rest === "") {
        return `[${node.entry.index}]`;
      }
      // If the rest of the path starts with a square bracket, return the index and the rest of the path.
      if (rest.startsWith("[")) {
        return `[${node.entry.index}]${rest}`;
      }
      return `[${node.entry.index}].${rest}`;
    }
    case "object-property": {
      const rest = formatErrorPath(node.entry.node);
      // If the rest of the path is empty, return the property.
      if (rest === "") {
        return node.entry.property;
      }
      if (rest.startsWith("[")) {
        return `${node.entry.property}${rest}`;
      }
      return `${node.entry.property}.${rest}`;
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
  const result = validator.unstable_validate(value);
  if (result.error !== undefined) {
    throw new ValidationError(result.error);
  }
  return result.value as InferOutputOf<D>;
}
