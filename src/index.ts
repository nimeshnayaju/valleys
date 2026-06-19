declare const brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type Validator<
	Output,
	Schema extends { type: string } = { type: string },
	RuleSet extends Record<string, unknown> = Record<string, unknown>,
> = {
	/**
	 * This is an unstable API. It may change in future.
	 *
	 * Validate a value using the validator.
	 * @param input - The value to validate.
	 * @returns An object with a `value` property if validation was successful, or an `error` property if validation failed.
	 */
	unstable_validate: (input: unknown) =>
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

/**
 * Represents an unconstrained value in Valleys' wire-data model.
 *
 * This type excludes `undefined`, because `undefined` is not valid wire data
 * in Valleys. It is intentionally not a recursive JSON-value type.
 *
 * `AnyValue` may include non-JSON JavaScript values if such values are passed
 * directly to the validator. Valleys assumes inputs normally come from decoded
 * wire data, while `any()` itself only rejects `undefined`.
 */
export type AnyValue = {} | null;

/* -------------------------------------------------------------------------------------------------
 * any
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates an unconstrained wire-data value validator.
 *
 * This is similar to JSON Schema's always-valid schema (`true` or `{}`), except
 * that Valleys rejects `undefined` because `undefined` is not valid wire data.
 *
 * This validator does not recursively check JSON compatibility. It only rejects
 * `undefined` and otherwise applies no additional constraints.
 *
 * In object schemas, `any()` means the key is required and its value is
 * unconstrained. Use `optional(any())` when the key may be absent.
 *
 * @returns A validator for any non-undefined value
 */
export function any(): Validator<AnyValue, { type: "any" }, {}> {
	const schema = { type: "any" } as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			if (input === undefined) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: input as AnyValue };
		},
		schema: schema,
		rules: rules,
	};
}

function isValidator(value: unknown): value is Validator<any, any, any> {
	return (
		typeof value === "object" && value !== null && "unstable_validate" in value
	);
}

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
	const schema = { type: "string" } as const;
	const normalizedRules: { minLength?: number; maxLength?: number } = {};
	if (rules?.minLength !== undefined) {
		normalizedRules.minLength = rules.minLength;
	}
	if (rules?.maxLength !== undefined) {
		normalizedRules.maxLength = rules.maxLength;
	}
	return {
		unstable_validate: (input: unknown) => {
			if (typeof input !== "string") {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			const minLength = normalizedRules.minLength;
			if (minLength !== undefined && input.length < minLength) {
				return {
					error: {
						type: "rule-violation",
						rule: "minLength",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			const maxLength = normalizedRules.maxLength;
			if (maxLength !== undefined && input.length > maxLength) {
				return {
					error: {
						type: "rule-violation",
						rule: "maxLength",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			return { value: input };
		},
		schema: schema,
		rules: normalizedRules,
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
	const schema = { type: "number" } as const;
	const normalizedRules: { min?: number; max?: number } = {};
	if (rules?.min !== undefined) {
		normalizedRules.min = rules.min;
	}
	if (rules?.max !== undefined) {
		normalizedRules.max = rules.max;
	}
	return {
		unstable_validate: (input: unknown) => {
			if (typeof input !== "number" || !Number.isFinite(input)) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			const min = normalizedRules.min;
			if (min !== undefined && input < min) {
				return {
					error: {
						type: "rule-violation",
						rule: "min",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			const max = normalizedRules.max;
			if (max !== undefined && input > max) {
				return {
					error: {
						type: "rule-violation",
						rule: "max",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			return { value: input };
		},
		schema: schema,
		rules: normalizedRules,
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
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: input };
		},
		schema: schema,
		rules: rules,
	};
}

/* -------------------------------------------------------------------------------------------------
 * url
 * -----------------------------------------------------------------------------------------------*/

export type UrlString = Brand<string, "UrlString">;

/**
 * Creates a validator that validates URL strings.
 *
 * @returns A validator for URL strings
 */
export function url(): Validator<UrlString, { type: "url" }, {}> {
	const schema = { type: "url" } as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			if (typeof input !== "string" || !URL.canParse(input)) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: input as UrlString };
		},
		schema: schema,
		rules: rules,
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
export function constant<T extends string | number | boolean | symbol | null>(
	value: T,
): Validator<T, { type: "constant"; value: string }, {}> {
	const schema = { type: "constant", value: String(value) } as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			if (input !== value) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: value as T };
		},
		schema: schema,
		rules: rules,
	};
}

/* -------------------------------------------------------------------------------------------------
 * array
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a validator that validates dense array values.
 *
 * Arrays cannot contain sparse holes or `undefined` items. When an item
 * validator is provided, every item must also pass that validator.
 *
 * @param validator - Optional validator for array items
 * @param rules - Optional validation rules
 * @returns A validator for array values
 */
export function array(rules: {
	minLength?: number;
}): Validator<Array<AnyValue>, { type: "array" }, { minLength?: number }>;
export function array(): Validator<
	Array<AnyValue>,
	{ type: "array" },
	{ minLength?: number }
>;
export function array<D extends Validator<any, any, any>>(
	validator: D,
	rules?: { minLength?: number },
): Validator<
	Array<InferOutputOf<D>>,
	{ type: "array"; item: D["schema"] },
	{ minLength?: number }
>;
export function array<D extends Validator<any, any, any>>(
	validatorOrRules?: D | { minLength?: number },
	arrayRules?: { minLength?: number },
): Validator<
	Array<InferOutputOf<D>>,
	{ type: "array"; item?: D["schema"] },
	{ minLength?: number }
> {
	let validator: D | undefined;
	const normalizedRules: { minLength?: number } = {};
	if (isValidator(validatorOrRules)) {
		validator = validatorOrRules as D;
		if (arrayRules?.minLength !== undefined) {
			normalizedRules.minLength = arrayRules.minLength;
		}
	} else if (validatorOrRules?.minLength !== undefined) {
		normalizedRules.minLength = validatorOrRules.minLength;
	}
	const schema = { type: "array", item: validator?.schema } as const;
	const fallbackValidator = any();
	const itemValidator = validator ?? fallbackValidator;

	return {
		unstable_validate: (input: unknown) => {
			if (!Array.isArray(input)) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			const minLength = normalizedRules.minLength;
			if (minLength !== undefined && input.length < minLength) {
				return {
					error: {
						type: "rule-violation",
						rule: "minLength",
						data: input,
						context: {
							schema: schema,
							rules: normalizedRules,
						},
					},
				};
			}

			for (let i = 0; i < input.length; i++) {
				if (!Object.hasOwn(input, i)) {
					return {
						error: {
							type: "array-index",
							data: input,
							entry: {
								index: i,
								node: {
									type: "schema-violation",
									data: undefined,
									context: {
										schema: itemValidator.schema,
										rules: itemValidator.rules,
									},
								},
							},
						},
					};
				}

				const item = input[i];
				const result = itemValidator.unstable_validate(item);
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
		schema: schema,
		rules: normalizedRules,
	};
}

/* -------------------------------------------------------------------------------------------------
 * object
 * -----------------------------------------------------------------------------------------------*/
const optionalBrand: unique symbol = Symbol("valleys.optional");

export type OptionalField<D extends Validator<any, any, any>> = {
	readonly [optionalBrand]: true;
	readonly inner: D;
};

type ObjectField =
	| Validator<any, any, any>
	| OptionalField<Validator<any, any, any>>;

/**
 * Marks an object property as optional.
 *
 * This is not a value validator and can only be used inside `object({...})`.
 * It means the object key may be absent. If the key is present, its value
 * must pass the wrapped validator.
 *
 * `optional(string())` does not mean `string | undefined`, and it does not add
 * `undefined` to the value type. With `exactOptionalPropertyTypes`,
 * `{ key?: T }` means the key may be absent, not that the present value may be
 * `undefined`. `undefined` is not valid wire data in Valleys. Use `null_()`
 * when JSON `null` is an allowed value.
 *
 * @example
 * ```ts
 * const User = object({
 *   id: string(),
 *   nickname: optional(string()),
 * });
 *
 * // Valid:
 * // { id: "1" }
 * // { id: "1", nickname: "Nick" }
 *
 * // Invalid:
 * // { id: "1", nickname: undefined }
 * ```
 *
 * @param inner - The validator to use when the property is present
 * @returns An object-field modifier accepted by object()
 */
export function optional<D extends Validator<any, any, any>>(
	inner: D,
): OptionalField<D> {
	return { [optionalBrand]: true, inner };
}

function isOptionalField(
	field: ObjectField,
): field is OptionalField<Validator<any, any, any>> {
	return optionalBrand in field;
}

type FieldValidator<T extends ObjectField> =
	T extends OptionalField<infer D> ? D : T;

type InferFieldOutput<F> =
	F extends OptionalField<infer D>
		? InferOutputOf<D>
		: F extends Validator<any, any, any>
			? InferOutputOf<F>
			: never;

type OptionalObjectKeys<T extends Record<string, ObjectField>> = {
	[K in keyof T]: T[K] extends OptionalField<Validator<any, any, any>>
		? K
		: never;
}[keyof T];

type RequiredObjectKeys<T extends Record<string, ObjectField>> = Exclude<
	keyof T,
	OptionalObjectKeys<T>
>;

type Merge<T> = T extends (...args: readonly unknown[]) => unknown
	? T
	: { [K in keyof T]: T[K] };

type ObjectValidatorType<T extends Record<string, ObjectField>> = Merge<
	{ [K in RequiredObjectKeys<T>]: InferFieldOutput<T[K]> } & {
		[K in OptionalObjectKeys<T>]?: InferFieldOutput<T[K]>;
	}
>;

type ObjectSchema<T extends Record<string, ObjectField>> = {
	type: "object";
	properties: { [K in keyof T]: FieldValidator<T[K]>["schema"] };
	required: Array<Extract<RequiredObjectKeys<T>, string>>;
};

/**
 * Creates a validator that validates object values.
 *
 * Object fields are required by default. Wrap a field with `optional(...)`
 * when the property may be absent. `optional(...)` only marks key presence;
 * it does not add `undefined` to the value type or allow `undefined` as a
 * value. Any present object property with value `undefined` fails validation.
 *
 * @param validators - Optional object mapping property names to their validators
 * @returns A validator for object values
 */
export function object(): Validator<
	Record<string, AnyValue>,
	{
		type: "object";
		properties: Record<string, { type: string }>;
		required: string[];
	}
>;
export function object<T extends Record<string, ObjectField>>(
	fields: T,
): Validator<ObjectValidatorType<T>, ObjectSchema<T>> & {
	fields: T;
};
export function object<T extends Record<string, ObjectField>>(
	fields?: T,
): Validator<
	ObjectValidatorType<T>,
	{
		type: "object";
		properties: Record<string, { type: string }>;
		required: string[];
	}
> & {
	fields?: T;
} {
	const properties = fields ? Object.keys(fields) : [];
	const _fields = fields ? properties.map((k) => fields[k] as ObjectField) : [];
	const _validators = _fields.map((field) =>
		isOptionalField(field) ? field.inner : field,
	);
	const required = properties.filter(
		(_property, index) => !isOptionalField(_fields[index] as ObjectField),
	);
	const numOfProperties = properties.length;
	const fallbackValidator = any();

	const schema = {
		type: "object",
		properties: Object.fromEntries(
			properties.map((property, index) => [
				property,
				(_validators[index] as Validator<unknown>).schema,
			]),
		),
		required: required,
	} as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			if (typeof input !== "object" || input === null || Array.isArray(input)) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}

			if (numOfProperties === 0) {
				for (const property of Object.keys(input)) {
					if ((input as Record<string, unknown>)[property] === undefined) {
						return {
							error: {
								type: "object-property",
								data: input as Record<string, unknown>,
								entry: {
									property,
									node: {
										type: "schema-violation",
										data: undefined,
										context: {
											schema: fallbackValidator.schema,
											rules: fallbackValidator.rules,
										},
									},
								},
							},
						};
					}
				}
				return { value: input as ObjectValidatorType<T> };
			}

			for (let i = 0; i < numOfProperties; i++) {
				const property = properties[i] as string;
				const validator = _validators[i] as Validator<unknown>;
				const isOptional = isOptionalField(_fields[i] as ObjectField);
				if (!Object.hasOwn(input, property) && isOptional) {
					continue;
				}

				const res = validator.unstable_validate(
					(input as Record<string, unknown>)[property],
				);
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
			for (const property of Object.keys(input)) {
				if ((input as Record<string, unknown>)[property] === undefined) {
					return {
						error: {
							type: "object-property",
							data: input as Record<string, unknown>,
							entry: {
								property,
								node: {
									type: "schema-violation",
									data: undefined,
									context: {
										schema: fallbackValidator.schema,
										rules: fallbackValidator.rules,
									},
								},
							},
						},
					};
				}
			}
			return { value: input as ObjectValidatorType<T> };
		},
		schema: schema,
		rules: rules,
		...(fields === undefined ? {} : { fields: fields }),
	};
}

/* -------------------------------------------------------------------------------------------------
 * iso8601
 * -----------------------------------------------------------------------------------------------*/
/**
 * A branded type representing a valid ISO 8601 date-time string.
 */
export type Iso8601String = Brand<string, "Iso8601String">;

const iso8601Regex =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Creates a validator that validates ISO 8601 date-time strings. Accepts datetime strings in the format: YYYY-MM-DDTHH:mm:ss[.sss][Z|±HH:mm]
 *
 * @returns A validator for ISO 8601 date-time strings
 */
export function iso8601(): Validator<Iso8601String, { type: "iso8601" }> {
	const schema = { type: "iso8601" } as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			if (typeof input !== "string" || !iso8601Regex.test(input)) {
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
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
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: input as Iso8601String };
		},
		schema: schema,
		rules: rules,
	};
}

/* -------------------------------------------------------------------------------------------------
 * or
 * -----------------------------------------------------------------------------------------------*/

/**
 * Creates a value-union validator.
 *
 * Tries each validator in order and returns the first successful result.
 * This models unions of values, not object property absence. Use
 * `optional(...)` inside `object({...})` when a property key may be absent.
 *
 * @param validators - Array of validators to try in order
 * @returns A validator that accepts values matching any of the provided validators
 */
export function or<D extends readonly Validator<any, any, any>[]>(
	validators: D,
): Validator<
	InferOutputOf<D[number]>,
	{ type: "or"; item: D[number]["schema"][] }
> {
	const numOfValidators = validators.length;
	const schema = {
		type: "or",
		item: validators.map((validator) => validator.schema),
	} as const;
	const rules = {};

	return {
		unstable_validate: (input: unknown) => {
			for (let i = 0; i < numOfValidators; i++) {
				const result = (validators[i] as Validator<unknown>).unstable_validate(
					input,
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
						schema: schema,
						rules: rules,
					},
				},
			};
		},
		schema: schema,
		rules: {},
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
				return {
					error: {
						type: "schema-violation",
						data: input,
						context: {
							schema: schema,
							rules: rules,
						},
					},
				};
			}
			return { value: input as null };
		},
		schema: schema,
		rules: rules,
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
	D = unknown,
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
	D = unknown,
> = SchemaViolationErrorNode | RuleViolationErrorNode<R, D>;

export class ValidationError extends Error {
	#root: ErrorPathNode | ErrorLeafNode;

	constructor(node: ErrorPathNode | ErrorLeafNode) {
		super(formatError(node));
		this.#root = node;
	}

	get experimental_root(): ErrorPathNode | ErrorLeafNode {
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
			(key) => leafNode.context.rules[key] !== undefined,
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
	validator: D,
): asserts value is InferOutputOf<D> {
	const result = validator.unstable_validate(value);
	if (result.error !== undefined) {
		const error = new ValidationError(result.error);
		Error.captureStackTrace(error, validate);
		throw error;
	}
}
