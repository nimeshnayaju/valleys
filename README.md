Lightweight, zero-dependency library for validating runtime wire data in TypeScript. `valleys` provides assertion-based validation that refines your types in-place — no cloning, no transformations, and minimal runtime overhead.

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Benchmarks](#benchmarks)
- [Error handling](#error-handling)
- [API Reference](#api-reference)
  - [`string()`](#string)
  - [`number()`](#number)
  - [`integer()`](#integer)
  - [`boolean()`](#boolean)
  - [`url()`](#url)
  - [`constant()`](#constant)
  - [`any()`](#any)
  - [`null_()`](#null_)
  - [`dateTime()`](#datetime)
  - [`array()`](#array)
  - [`object()`](#object)
  - [`record()`](#record)
  - [`optional()`](#optional)
  - [`or()`](#or)
- [Exported types](#exported-types)
  - [`InferOutputOf<D>`](#inferoutputofd)
  - [`AnyValue`](#anyvalue)
  - [`DateTimeString`](#datetimestring)
  - [`UrlString`](#urlstring)
- [Development](#development)
- [Acknowledgements](#acknowledgements)

### Installation

Requires Node.js 22.12+ and ESM imports.

```bash
npm install valleys
```

### Quick start

`valleys` validates your data and narrows its type in-place. Your original values remain unchanged - only their TypeScript types are refined. The `validate` function runs a runtime check and, on success, asserts the original variable's type. On failure, it throws a `ValidationError`.

```ts
import { object, string, number, validate } from "valleys";

// Example of untrusted data (e.g., from an API)
const input: unknown = { id: 123, name: "Alice" };

// Validate the data (throws if validation fails)
validate(input, object({ id: number(), name: string() }));

// `input` is now typed as { id: number; name: string }
console.log(input.id, input.name);
```

`valleys` models wire data: `undefined` is not a valid value. Object fields are required by default; use `optional(...)` only when a property may be absent. `null_()` remains valid because `null` is a real JSON value.

Libraries like [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [Decoders](https://decoders.cc/), etc typically return a new (often transformed) value from `.parse()`. `valleys` instead asserts types directly - this provides several performance benefits as no time is spent copying arrays, strings or nested objects. This makes `valleys` ideal for performance-critical applications where memory efficiency and speed matter.

### Benchmarks

- **[`valleys` vs `zod`](https://github.com/nimeshnayaju/zod?tab=readme-ov-file#benchmarks)** - Compares Valleys with Zod 4 and Zod 3 using the official benchmarks used by Zod to compare Zod 4 against Zod 3.

- **[`valleys` vs `zod` vs `valibot`](https://github.com/nimeshnayaju/valibot-benchmarks?tab=readme-ov-file#relative-performance-valleys-vs-others)** - Compares Valleys against Zod 4 and Valibot across different environments (Node.js, Bun, Deno) - forked from benchmarks maintained by [@naruaway](https://github.com/naruaway).

These historical benchmarks cover earlier versions. They have not been rerun for 0.5.0.

### Error handling

The `validate` function throws a `ValidationError` on the first failure. Its `cause` describes the failing input and the path from the root value to that input.

```ts
import { validate, object, array, string, ValidationError } from "valleys";

try {
  validate({ names: ["Ada", 42] }, object({ names: array(string()) }));
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.cause.path); // ["names", 1]
    console.log(error.cause.input); // 42
    console.log(error.cause.type); // "schema-mismatch"
    console.log(error.cause.schema); // { type: "string" }
  }
}
```

A failure has `type`, `path`, `input`, `schema`, and `rules`. When `type` is `"rule-violation"`, it also has a `rule` name, such as `"maxLength"`. The previous `experimental_root` error tree was removed in 0.5.0.

**Example error message:**

```
Validation failed at user.age due to schema mismatch; expected schema: {"type":"number"}; received value: "ten"
```

> [!NOTE]  
> `valleys` follows a fail-fast approach, immediately throwing when validation fails, which provides better performance and clearer error messages by focusing on the first issue encountered.

### API Reference

#### `string()`

Validates that a value is a string. Optionally accepts rules for validation.

```ts
import { string, validate } from "valleys";

// Basic usage
validate(input, string());
// input is typed as string

// With rules
validate(input, string({ minLength: 3, maxLength: 50 }));
```

**Rules:**

- `minLength?: number` - Minimum string length in UTF-16 code units
- `maxLength?: number` - Maximum string length in UTF-16 code units

#### `number()`

Validates that a value is a finite number.

```ts
import { number, validate } from "valleys";

// Basic usage
validate(input, number());
// input is typed as number

// With rules
validate(input, number({ min: 0, max: 100 }));
```

**Rules:**

- `min?: number` - Minimum value (inclusive)
- `max?: number` - Maximum value (inclusive)

#### `integer()`

Validates that a value is an integer, following JSON Schema's `integer` type
semantics.

```ts
import { integer, validate } from "valleys";

// Basic usage
validate(input, integer());
// input is typed as number

// With rules
validate(input, integer({ min: 0, max: 100 }));
```

**Rules:**

- `min?: number` - Minimum value (inclusive)
- `max?: number` - Maximum value (inclusive)

#### `boolean()`

Validates that a value is a boolean.

```ts
import { boolean, validate } from "valleys";

validate(input, boolean());
// input is typed as boolean
```

#### `url()`

Validates absolute URL strings that already equal `new URL(input).href`. For example, `"https://example.com/"` passes, while `"https://example.com"`, leading whitespace, and hostnames needing normalization fail. Validation does not transform the input.

Any scheme is accepted, including `javascript:`; check the protocol separately when using a URL in a context that requires one.

```ts
import { url, validate } from "valleys";

validate(input, url());
// input is typed as UrlString (a branded string type)
```

#### `constant()`

Validates that a value is exactly equal to a specific literal value.

```ts
import { constant, validate } from "valleys";

// String literals
validate(input, constant("hello"));
// input is typed as "hello"

// Number literals
validate(input, constant(42));
// input is typed as 42

// Boolean literals
validate(input, constant(true));
// input is typed as true
```

#### `any()`

Validates any value except `undefined`. This is the unconstrained value validator, similar in spirit to JSON Schema's always-valid schema (`true` or `{}`), except Valleys rejects `undefined` because it is not valid wire data.

`any()` does not recursively check JSON compatibility. It only rejects `undefined` and otherwise applies no additional constraints. Its output type is `AnyValue` (`{} | null`), not TypeScript `any`.

```ts
import { any, object, optional, string, validate } from "valleys";

const Event = object({
  type: string(),
  payload: any(),
  metadata: optional(any())
});

validate(input, Event);
// input is typed as:
// {
//   type: string;
//   payload: AnyValue;
//   metadata?: AnyValue;
// }
```

#### `null_()`

Validates that a value is JSON `null`.

```ts
import { null_, validate } from "valleys";

validate(input, null_());
// input is typed as null
```

#### `dateTime()`

Validates RFC 3339 date-time strings: `YYYY-MM-DDTHH:mm:ss[.fraction](Z|±HH:mm)`. Fields and calendar dates must be valid, including leap years. Lowercase `t` and `z` are allowed. Leap seconds, date-only strings, and timezone offsets without a colon are rejected.

```ts
import { dateTime, validate } from "valleys";

validate(input, dateTime());
// input is typed as DateTimeString (a branded string type)

// Valid examples:
// "2024-01-15T10:30:00Z"
// "2024-01-15T10:30:00+01:00"
// "2024-01-15T10:30:00.123Z"
```

#### `array()`

Validates arrays with optional item validation and rules. Arrays reject `undefined` items and sparse holes.

```ts
import { any, array, string, number, validate } from "valleys";

// Array of any wire-data values
validate(input, array());
// input is typed as AnyValue[]

// Array of explicitly unconstrained values
validate(input, array(any()));
// input is typed as AnyValue[]

// Array with minimum length
validate(input, array({ minLength: 1 }));

// Array of specific type
validate(input, array(string()));
// input is typed as string[]

// Array of specific type with rules
validate(input, array(number(), { minLength: 3 }));
// input is typed as number[] with at least 3 items
```

**Rules:**

- `minLength?: number` - Minimum array length
- `maxLength?: number` - Maximum array length

Array length rules are checked before the items.

#### `object()`

Validates plain objects and null-prototype dictionaries. Fields are required by default. Extra properties are allowed, but any present property with value `undefined` fails validation. Arrays, class instances, and built-in objects such as `Date`, `Map`, and `Set` are rejected.

```ts
import { object, optional, string, number, boolean, validate } from "valleys";

// Any object
validate(input, object());
// input is typed as Record<string, AnyValue>

// Object with specific shape
validate(input, object({ id: number(), name: string(), active: boolean() }));
// input is typed as { id: number; name: string; active: boolean }

// Optional known field
validate(input, object({ name: optional(string()) }));
// input is typed as { name?: string }

// Nested objects
validate(
  input,
  object({
    user: object({
      id: number(),
      profile: object({ name: string(), age: number() })
    })
  })
);
```

#### `record()`

Validates a plain object or null-prototype dictionary whose own enumerable string-keyed values all pass the supplied validator. This replaces the `object(valueValidator)` overload from 0.4.x.

```ts
import { record, string, validate } from "valleys";

validate(input, record(string()));
// input is typed as Record<string, string>
```

### Object property presence

In Valleys, object fields are required by default:

```ts
object({
  id: string(),
  name: string()
});
```

Use `optional(...)` when a key may be absent:

```ts
object({
  id: string(),
  nickname: optional(string())
});
```

Although `optional(...)` wraps a validator syntactically, it is not a value validator. It marks the object key as optional. If the key is present, its value must pass the wrapped validator.

`optional(...)` controls object-key presence, not the value type. For example, `optional(string())` infers `key?: string`, not `key?: string | undefined`.

This means the key may be absent. If the key is present, the value must pass the wrapped validator. With `exactOptionalPropertyTypes`, `{ key?: T }` means the key may be absent, not that the value may be `undefined`. Since `undefined` is not valid wire data in Valleys, a present property with value `undefined` fails validation. Use `null_()` when JSON `null` is an allowed value.

```ts
const Event = object({
  type: string(),
  payload: any(),
  metadata: optional(any())
});

// This infers:
// {
//   type: string;
//   payload: AnyValue;
//   metadata?: AnyValue;
// }
```

#### `optional()`

Marks an object field as optional, meaning the property may be absent. It is an object-field modifier, not a value validator, so it cannot be used with `array(...)`, `or(...)`, or top-level `validate(...)`. It does not add `undefined` to the wrapped validator's output type.

```ts
import { null_, object, optional, or, string } from "valleys";

const KnownOptional = object({
  name: optional(string())
});
// { name?: string }

const Nullable = object({
  name: or([string(), null_()])
});
// { name: string | null }

const OptionalNullable = object({
  name: optional(or([string(), null_()]))
});
// { name?: string | null }
```

#### `or()`

Creates a union type validator that accepts any of the provided validators. When all branches are objects with a distinct required constant at the same property, that property selects the branch to validate. Errors retain the selected branch's path. For other unions, a failure is preserved when exactly one branch matched the input type; otherwise the union reports a schema mismatch.

Its schema is `{ type: "or", options: [...] }`. Schema metadata describes Valleys validators; it is not JSON Schema.

```ts
import { or, string, number, null_, constant, validate } from "valleys";

// String or number
validate(input, or([string(), number()]));
// input is typed as string | number

// Nullable string (string or null)
validate(input, or([string(), null_()]));
// input is typed as string | null

// Multiple types
validate(input, or([constant("pending"), constant("active"), constant("completed")]));
// input is typed as "pending" | "active" | "completed"
```

### Exported types

#### `InferOutputOf<D>`

A type utility that extracts the output type from a validator. Useful when you need to reference the type that a validator validates.

```ts
import { object, string, number, type InferOutputOf } from "valleys";

const userValidator = object({ id: number(), name: string() });
type User = InferOutputOf<typeof userValidator>;
// User is { id: number; name: string }
```

#### `AnyValue`

Represents any value except `undefined` at the TypeScript level.

`AnyValue = {} | null` means "anything except `undefined`" under strict null checks. It intentionally does not recursively prove JSON compatibility. It may include non-JSON JavaScript values if those values are passed directly to a validator; Valleys assumes inputs normally come from decoded wire data, while `any()` itself only rejects `undefined`.

```ts
import { type AnyValue } from "valleys";

type Payload = AnyValue; // {} | null
```

#### `DateTimeString`

A branded string type for RFC 3339 date-time strings that can only be obtained after validating using the `dateTime` validator.

```ts
import { type DateTimeString, dateTime, validate } from "valleys";

function formatDate(date: DateTimeString): string {
  return new Date(date).toLocaleDateString();
}

const input = "2024-01-01T12:00:00Z";
validate(input, dateTime());
// input is now DateTimeString
formatDate(input);
```

#### `UrlString`

A branded string type for valid URL strings that can only be obtained after validating using the `url` validator.

```ts
import { type UrlString, url, validate } from "valleys";

function parseUrl(value: UrlString): URL {
  return new URL(value);
}

const input = "https://example.com/path";
validate(input, url());
// input is now UrlString
const parsed = parseUrl(input);
```

### Development

Use Node.js 24 (the exact local version is in `.node-version`) and pnpm 12.11.2 (pinned in `package.json`). CI also checks the minimum supported Node.js version, 22.12.0.

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs formatting, linting, TypeScript checks (including `types.test-d.ts` with `exactOptionalPropertyTypes`), runtime tests, and a build followed by [publint](https://publint.dev/). Publint checks the package exports, module formats, and published files; warnings fail the check.

```sh
pnpm format       # Apply formatting
pnpm test         # Runtime tests
pnpm typecheck    # Source and test types
pnpm build        # ESM and declarations in dist/
pnpm lint:package # Build and validate package metadata and files
pnpm pack         # Build and create a publishable tarball
```

The library has one source entry point, so the build uses TypeScript directly to emit ESM and declarations. The package has no runtime dependencies. The `prepack` hook builds the package before packing or publishing. GitHub CI validates changes without publishing to npm.

For releases before 1.0, increment the minor version for breaking changes and the patch version for compatible fixes.

### Acknowledgements

The API is inspired by [Decoders](https://decoders.cc/), which is also my go-to validation library. There is an in-progress [pull request](https://github.com/nvie/decoders/pull/1256) to support readonly decoders, which should bring similar benefits to the library.
